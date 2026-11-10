'use strict';

const assert = require('node:assert/strict');
const { RpaEngine } = require('../rpa-engine');

async function main() {
  const rpa = new RpaEngine({ engine: {}, store: null, emit() {} });
  let cancelled = false;
  let effects = 0;
  rpa.stepNoop = async () => { effects += 1; cancelled = true; };
  const ctx = { variables: {}, isCancelled: () => cancelled };
  await assert.rejects(rpa.executeStep(0, {
    type: 'forTimes', times: 10,
    children: [{ type: 'noop' }],
    errorChildren: [{ type: 'variableOperation', params: {
      type: 'set', variableObjList: [{ key: 'recovered', value: 'yes' }],
    } }],
  }, ctx), /cancelled/);
  assert.equal(effects, 1, 'nested work stops as soon as cancellation is observed');
  assert.equal(ctx.variables.recovered, undefined, 'cancellation cannot enter recovery steps');

  const expired = { variables: {}, taskDeadline: Date.now() - 1 };
  await assert.rejects(rpa.executeStep(0, { type: 'noop' }, expired), /task timeout/);
  assert.equal(effects, 1, 'an expired task cannot dispatch another step');

  const start = Date.now();
  await assert.rejects(rpa.executeStep(0, { type: 'wait', ms: 5000 }, {
    variables: {}, taskDeadline: start + 40,
  }), /task timeout/);
  assert.ok(Date.now() - start < 1500, 'a long wait respects the task deadline');

  rpa.withPage = async () => null;
  for (const type of ['goback', 'waitforresponse']) {
    const began = Date.now();
    await assert.rejects(rpa.executeStep(0, { type, timeout: 5000 }, {
      variables: {}, taskDeadline: began + 40,
    }), /task timeout/);
    assert.ok(Date.now() - began < 1500, type + ' polls the task deadline');
  }

  const task = { id: 'startup', profile_id: 'p', steps: [{ type: 'noop' }] };
  const stored = {};
  const launch = new RpaEngine({ engine: {}, emit() {}, store: {
    getTask: () => task,
    updateTask: async (_id, patch) => Object.assign(stored, patch),
  } });
  launch.writeDiagnostic = async () => {};
  launch.ensureProfileRunning = async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return { port: 9222 };
  };
  launch.executeStep = async () => { throw new Error('step must not run after startup exhausted budget'); };
  const result = await launch.runTask(task.id, { timeout_ms: 10 });
  assert.equal(result.success, false);
  assert.match(result.error, /task timeout/);
  assert.equal(stored.status, 'failed');
  assert.equal(launch.running.size, 0);
  console.log('RPA_EXECUTION_BUDGET_SELFTEST OK');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
