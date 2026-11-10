'use strict';

const assert = require('node:assert/strict');
const { RpaEngine } = require('../rpa-engine');
const { RpaStore } = require('../rpa-store');
const { executableStepTypes, unsupportedStepTypes, getStepCapability, resolveStepHandler, findUnsupportedSteps, validateStepHandlers } = require('../rpa/step-registry');

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
  assert.throws(() => RpaStore.sanitizeOptionalOverlaySteps(cycle), (error) => error.code === 'RPA_INVALID_GRAPH');
  let deep = [{ type: 'wait' }];
  for (let index = 0; index < 1000; index += 1) deep = [{ type: 'ifelse', children: deep }];
  assert.equal(findUnsupportedSteps(deep)[0].reason, 'step nesting exceeds limit');
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
