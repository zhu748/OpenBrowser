'use strict';

const assert = require('node:assert/strict');
const { RpaEngine } = require('../rpa-engine');

function fixture() {
  const tasks = new Map();
  const profilesStarted = [];
  const store = {
    getPlan: () => ({ id: 'plan', profile_ids: ['p1', 'p2', 'p3'], steps: [{ type: 'noop' }] }),
    createTasks: async (values) => values.map((value, i) => {
      const task = { ...value, id: `t${i + 1}`, status: 'pending' };
      tasks.set(task.id, task);
      return task;
    }),
    getTask: (id) => tasks.get(id),
    updateTask: async (id, patch) => Object.assign(tasks.get(id), patch),
  };
  const rpa = new RpaEngine({ engine: {}, store, emit() {} });
  rpa.writeDiagnostic = async () => {};
  rpa.ensureProfileRunning = async (id) => { profilesStarted.push(id); return { port: 9222 }; };
  rpa.executeStep = async () => {};
  rpa.taskBodyScheduler.setConcurrency(1);
  return { rpa, store, tasks, profilesStarted };
}

async function main() {
  let launches = 0;
  const engine = { profiles: new Map([['p', { id: 'p' }]]), running: new Map(),
    start: async () => { launches += 1; return { port: 9222 }; } };
  const concurrent = new RpaEngine({ engine, store: null, emit() {} });
  await Promise.all(Array.from({ length: 20 }, () => concurrent.ensureProfileRunning('p', { log: async () => {} })));
  assert.equal(launches, 1, 'asynchronous logging must not split the shared launch barrier');
  assert.equal(concurrent.profileStarts.size, 0);

  const broken = new RpaEngine({ engine, emit() {}, store: {
    getTask: () => ({ id: 'broken', profile_id: 'p' }),
    updateTask: async () => { throw new Error('store unavailable'); },
  } });
  broken.writeDiagnostic = async () => {};
  await assert.rejects(broken.runTask('broken'), /store unavailable/);
  assert.equal(broken.running.size, 0, 'initialization failure always releases runtime state');
  assert.equal(broken.cancelled.size, 0);

  for (const stopAll of [false, true]) {
    const { rpa, tasks, profilesStarted } = fixture();
    let entered;
    const started = new Promise((resolve) => { entered = resolve; });
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    rpa.executeStep = async (_port, _step, ctx) => {
      if (ctx.task.id === 't1') { entered(); await gate; }
    };
    const plan = rpa.runPlan('plan');
    await started;
    assert.equal(rpa.getStatus().queuedCount, 2);
    // Release the in-step gate BEFORE stop(): stop-all now drains actual
    // termination (automation review 2026-11-10 [P2-9]) — a quit waits up to
    // 2.5s for running tasks to observe cancellation — so awaiting stop()
    // while a step is still gated would only test the drain cap. This order
    // matches a real quit: steps keep running, cancellation is requested,
    // then steps finish and their terminal state persists.
    release();
    await rpa.stop(stopAll ? null : 't2');
    const result = await plan;
    assert.equal(result.success, false);
    assert.equal(tasks.get('t2').status, 'cancelled');
    assert.equal(profilesStarted.includes('p2'), false, 'cancelled pending work must not start its browser');
    if (stopAll) {
      assert.equal(profilesStarted.includes('p3'), false);
      assert.equal(tasks.get('t1').status, 'cancelled', 'cancellation during the final step is observed before success');
    }
    else assert.equal(tasks.get('t3').status, 'success', 'other queued tasks still run');
    assert.equal(rpa.running.size + rpa.queued.size + rpa.cancelled.size, 0);
  }

  const duringCreate = fixture();
  const create = duringCreate.store.createTasks;
  let enteredCreate;
  const creating = new Promise((resolve) => { enteredCreate = resolve; });
  let releaseCreate;
  const createGate = new Promise((resolve) => { releaseCreate = resolve; });
  duringCreate.store.createTasks = async (values) => { enteredCreate(); await createGate; return create(values); };
  const stoppedPlan = duringCreate.rpa.runPlan('plan');
  await creating;
  await duringCreate.rpa.stop();
  releaseCreate();
  await stoppedPlan;
  assert.equal(duringCreate.profilesStarted.length, 0, 'stop-all includes plans still creating task records');
  assert.ok([...duringCreate.tasks.values()].every((task) => task.status === 'cancelled'));
  await duringCreate.rpa.stop('unknown');
  assert.equal(duringCreate.rpa.cancelled.size, 0, 'unknown ids do not accumulate cancellation markers');
  const fair = fixture();
  fair.rpa.taskBodyScheduler.setConcurrency(2);
  const planValues = ['shared', 'shared', 'shared', 'independent'].map((profile_id) => ({
    profile_id, steps: [{ type: 'noop' }],
  }));
  const fairTasks = await fair.store.createTasks(planValues);
  let release;
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  const gate = new Promise((resolve) => { release = resolve; });
  fair.rpa.executeStep = async (_port, _step, ctx) => {
    if (ctx.task.id === 't1') { entered(); await gate; }
  };
  const runs = fairTasks.map((task) => fair.rpa.runTask(task.id));
  await started;
  try {
    await new Promise(setImmediate);
    assert.equal(fair.tasks.get('t4').status, 'success', 'a busy profile cannot stall unrelated profiles');
    assert.equal(fair.rpa.taskBodyScheduler.running, 1);
    await fair.rpa.stop('t2');
    const cancelled = await Promise.race([runs[1], new Promise((_, reject) => setTimeout(() => reject(new Error('queued stop waited for active profile')), 500))]);
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(fair.rpa.queued.has('t2'), false, 'queued cancellation settles without waiting for the held browser');
    assert.equal(fair.rpa.queuedControllers.has('t2'), false);
  } finally { release(); }
  await Promise.all(runs);
  await fair.rpa.taskBodyScheduler.drain();
  assert.equal(fair.rpa.taskBodyScheduler.keys.size + fair.rpa.queuedControllers.size, 0);
  console.log('RPA_LIFECYCLE_SELFTEST OK (launch barrier, failed initialization, queued cancellation, stop during create)');
}

const deadline = setTimeout(() => { console.error('RPA lifecycle selftest timed out'); process.exit(1); }, 5000);
main().then(() => clearTimeout(deadline)).catch((error) => { clearTimeout(deadline); console.error(error); process.exitCode = 1; });
