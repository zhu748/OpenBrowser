'use strict';

const assert = require('node:assert/strict');
const { RpaEngine } = require('../rpa-engine');
const { RpaStore } = require('../rpa-store');
const { executableStepTypes, unsupportedStepTypes, getStepCapability, resolveStepHandler, analyzeStepGraph, findUnsupportedSteps, validateStepHandlers } = require('../rpa/step-registry');

async function main() {
  validateStepHandlers(RpaEngine.prototype);
  assert.equal(new Set(executableStepTypes).size, executableStepTypes.length);
  assert.equal(Object.isFrozen(executableStepTypes), true);
  for (const type of executableStepTypes) {
    assert.equal(typeof RpaEngine.prototype[resolveStepHandler(type)], 'function');
    assert.deepEqual(findUnsupportedSteps([{ type }]), []);
  }
  assert.equal(resolveStepHandler('__proto__'), null);
  assert.equal(resolveStepHandler('SLEEP'), 'stepWait');
  for (const type of unsupportedStepTypes) {
    assert.equal(getStepCapability(type).status, 'unsupported');
    assert.equal(resolveStepHandler(type), null);
    assert.equal(findUnsupportedSteps([{ type }]).length, 1);
  }
  assert.throws(() => validateStepHandlers({}), /without executor/);
  const cycle = [{ type: 'wait' }]; cycle[0].children = cycle;
  assert.equal(findUnsupportedSteps(cycle)[0].reason, 'cyclic steps');
  assert.deepEqual(RpaStore.countSensitiveSteps(cycle), { evaluate: 0, openai: 0, download: 0 }, 'disclosure also terminates on cycles');
  assert.throws(() => RpaStore.sanitizeOptionalOverlaySteps(cycle), (error) => error.code === 'RPA_INVALID_GRAPH');
  let deep = [{ type: 'wait' }];
  for (let index = 0; index < 1000; index += 1) deep = [{ type: 'ifelse', children: deep }];
  assert.equal(findUnsupportedSteps(deep)[0].reason, 'step nesting exceeds limit');
  assert.doesNotThrow(() => RpaStore.countSensitiveSteps(deep));
  const flow = [{ type: 'ifElse', children: [{ action: 'javaScript' }],
    elseChildren: [{ type: 'downloadFile' }], params: { errorChildren: [{ type: 'getOpenAI' }],
      children: [{ type: 'evaluate' }, { type: 'evaluate' }] } }];
  const analysis = analyzeStepGraph(flow);
  assert.deepEqual(analysis.unsupported, []);
  assert.deepEqual(analysis.sensitive, { evaluate: 1, openai: 1, download: 1 }, 'branches follow executor precedence and action aliases');
  const wrapped = [{ type: 'forTimes', params: { config: { times: 1, children: [{ type: 'script' }] } } }];
  assert.equal(analyzeStepGraph(wrapped).sensitive.evaluate, 1, 'params.config children are disclosed');
  assert.equal(findUnsupportedSteps([{ type: 'forTimes', config: { children: [{ type: 'missing' }] } }])[0].type, 'missing',
    'config children are validated before browser allocation');
  const wrappedCycle = [{ type: 'forTimes', params: { config: {} } }];
  wrappedCycle[0].params.config.children = wrappedCycle;
  assert.equal(findUnsupportedSteps(wrappedCycle)[0].reason, 'cyclic steps');
  const dispatches = [];
  const wrappedRunner = Object.assign(Object.create(RpaEngine.prototype), {
    executeStep: async (_port, step) => dispatches.push(step.type),
  });
  await wrappedRunner.executeStepInternal(0, wrapped[0], { variables: {} });
  assert.deepEqual(dispatches, ['script'], 'the analyzed wrapped child is the child actually executed');
  const reused = [{ type: 'script' }];
  assert.equal(RpaStore.countSensitiveSteps([{ type: 'ifElse', children: reused, elseChildren: reused }]).evaluate, 2,
    'shared acyclic subflows count at each executable path');
  assert.equal(RpaStore.countSensitiveSteps(Array.from({ length: 10001 }, () => ({ type: 'evaluate' }))).evaluate, 10000,
    'capability analysis observes the validation step budget');
  const listing = new RpaStore('unused-in-memory-test.json');
  listing.data.templates = [{ id: 'cycle', steps: cycle }];
  assert.throws(() => listing.listTemplates(), (error) => error.code === 'RPA_INVALID_GRAPH');
  listing.data.templates = [{ id: 'flow', steps: flow }];
  const templates = listing.listTemplates();
  assert.deepEqual(templates.find((item) => item.id === 'flow').sensitive_steps, analysis.sensitive);
  assert.equal(findUnsupportedSteps(Array.from({ length: 10001 }, () => ({ type: 'wait' })))[0].reason, 'step count exceeds limit');
  const shared = [{ type: 'missing' }];
  const issues = findUnsupportedSteps([{ type: 'ifelse', children: shared, elseChildren: shared }]);
  assert.equal(issues.length, 2, 'shared acyclic subflows are validated at each path');
  const seen = [];
  const engine = Object.assign(Object.create(RpaEngine.prototype), { stepToJson: async ({ type }) => seen.push(type) });
  await engine.executeStepInternal(0, { type: 'extractKey' }, { variables: {} });
  await engine.executeStepInternal(0, { type: 'toJson' }, { variables: {} });
  assert.deepEqual(seen, ['extractkey', 'tojson'], 'alias-specific behavior retains the original step type');
  let starts = 0;
  const runner = new RpaEngine({ engine: {}, store: {
    getTask: () => ({ id: 'invalid', profile_id: 'a', steps: [{ type: 'missing' }] }),
    updateTask: async () => {},
  } });
  runner.writeDiagnostic = async () => {};
  runner.ensureProfileRunning = async () => { starts += 1; throw new Error('browser should not start'); };
  const result = await runner.runTask('invalid');
  assert.equal(result.success, false);
  assert.match(result.error, /Invalid RPA steps/);
  assert.equal(starts, 0, 'invalid plans fail before browser allocation');
  assert.equal(runner.running.size, 0, 'preflight failures release the run marker');
  for (const type of ['keyCombination', 'applySubProcess', 'getCaptcha', 'closeOtherPage']) {
    runner.store.getTask = () => ({ id: 'invalid', profile_id: 'a', steps: [{ type }] });
    assert.equal((await runner.runTask('invalid')).success, false, type + ' cannot be reported as success');
    await assert.rejects(runner.executeStepInternal(0, { type }, { variables: {} }), /Unsupported RPA step/);
  }
  assert.equal(starts, 0, 'unimplemented actions never allocate a browser');
  console.log('RPA_REGISTRY_BOUNDARIES_SELFTEST OK (single registry, aliases, real dispatch, cycles, nesting, count budget)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
