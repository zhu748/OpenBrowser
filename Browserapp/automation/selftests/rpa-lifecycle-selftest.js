'use strict';

const assert = require('node:assert/strict');
const { RpaEngine } = require('../rpa-engine');
const { RpaStore } = require('../rpa-store');
const { RpaRoutes } = require('../api/rpa-routes');
const { registerAutomationControlIpc } = require('../../main/automation-ipc');

function ipcHandlers(store, rpa) {
  const handlers = new Map();
  registerAutomationControlIpc({
    registerTrustedIpc: (name, handler) => handlers.set(name, handler),
    getAutomation: () => ({ rpaStore: store, rpaEngine: rpa }), getMainWindow: () => null,
  });
  return handlers;
}

function fixture() {
  const tasks = new Map();
  const profilesStarted = [];
  const store = {
    getPlan: () => ({ id: 'plan', profile_ids: ['p1', 'p2', 'p3'], steps: [{ type: 'noop' }] }),
    createTasks: async (values) => values.map((value, i) => {
      const task = { ...value, id: value.id || `t${i + 1}`, status: 'pending' };
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

function memoryStack() {
  const store = new RpaStore('unused-in-memory-test.json');
  store.save = async () => {};
  const engine = { running: new Map([['p', { port: 1 }], ['q', { port: 2 }]]) };
  const rpa = new RpaEngine({ engine, store });
  rpa.writeDiagnostic = async () => {};
  return { store, rpa, routes: new RpaRoutes({ rpaStore: store, rpaEngine: rpa }) };
}

async function retryState() {
  const { store, rpa, routes } = memoryStack();
  await store.upsertPlan({ id: 'plan', profile_ids: ['p'] });
  const task = await store.createTask({ id: 'retry', plan_id: 'plan', profile_id: 'p', steps: [{ type: 'noop' }] });
  assert.equal((await rpa.runTask(task.id)).success, true);
  assert.equal(task.process_result.ok, true);
  await store.updateTask(task.id, { error: 'old diagnostic', finishedAt: 'old attempt' });

  const queued = Promise.withResolvers(), entered = Promise.withResolvers(), running = Promise.withResolvers();
  const terminal = Promise.withResolvers(), closing = Promise.withResolvers();
  const blocker = rpa.taskBodyScheduler.schedule(() => queued.promise, null, { key: 'p' });
  rpa.executeStep = async () => { entered.resolve(); await running.promise; };
  rpa.writeDiagnostic = async (event) => {
    if (event.type === 'rpa-task-success') { terminal.resolve(); await closing.promise; }
  };
  const retry = rpa.runTask(task.id);
  const fetch = async () => (await routes.routeRpaTaskGet({ pathname: '/api/rpa/tasks/retry' })).data.task;
  const deletePlan = () => routes.routeRpaPlanDelete({ pathname: '/api/rpa/plans/plan' });
  const ipc = ipcHandlers(store, rpa);
  const conflict = { code: 'RPA_PLAN_HAS_ACTIVE_TASKS', statusCode: 409 };
  try {
    assert.equal((await fetch()).status, 'pending');
    assert.equal(task.start_time, null);
    assert.deepEqual(task.process_logs, []);
    await assert.rejects(store.deletePlan('plan'), conflict);
    await assert.rejects(deletePlan(), conflict);
    for (const status of ['pending', 'running']) {
      const visible = await fetch();
      assert.equal(visible.status, status);
      assert.equal(visible.process_result, null);
      assert.equal(visible.complete_time, null);
      assert.equal(visible.error, null);
      assert.equal(visible.finishedAt, null);
      if (status === 'pending') { queued.resolve(); await entered.promise; }
    }
    running.resolve();
    await terminal.promise;
    assert.equal(task.status, 'success');
    assert.equal(rpa.isTaskActive(task.id), true);
    await assert.rejects(deletePlan(), conflict, 'terminal persistence/cleanup still owns the record');
    await assert.rejects(ipc.get('automation:rpa-delete-plan')({}, 'plan'), conflict);
  } finally {
    queued.resolve(); running.resolve(); closing.resolve();
    await Promise.all([blocker, retry]);
  }
  assert.equal((await retry).success, true);
  assert.equal((await deletePlan()).code, 0);
  assert.equal(store.getTask(task.id), null);
}

async function planPreflight() {
  const { store, rpa, routes } = memoryStack();
  await store.upsertPlan({ id: 'empty', profile_ids: [] });
  await store.upsertPlan({ id: 'saved', profile_ids: ['p'] });
  const run = (input) => routes.routeRpaRun({ input });
  let launched;
  const submitPlan = rpa.submitPlan.bind(rpa);
  rpa.submitPlan = async (...args) => {
    const submission = await submitPlan(...args);
    launched = submission.completion;
    return submission;
  };
  for (const wait of [false, true, 'false']) {
    assert.equal((await run({ plan_id: 'empty', wait })).code, 400);
    assert.equal((await run({ plan_id: 'empty', profile_ids: [], wait })).code, 400);
    assert.equal((await run({ plan_id: 'empty', profile_ids: [' '], wait })).code, 400);
    assert.equal((await run({ plan_id: 'missing', wait })).code, 404);
  }
  assert.equal(launched, undefined, 'invalid plans never reach the background launcher');
  assert.equal(store.listTasks().length, 0);
  const accepted = await run({ planId: 'empty', profileIds: ['q'], wait: false });
  assert.equal(accepted.code, 0);
  assert.equal(accepted.data.async, true);
  assert.equal((await launched).success, true);
  assert.equal(store.listTasks({ plan_id: 'empty' })[0].profile_id, 'q');
  assert.equal((await run({ plan_id: 'saved', profile_ids: [], wait: true })).data.success, true);
  assert.equal(store.listTasks({ plan_id: 'saved' })[0].profile_id, 'p');
}

async function adHocCancellation() {
  const input = { profile_id: 'p', steps: [{ type: 'noop' }] };
  for (const mode of ['http', 'http-async', 'ipc']) {
    for (const all of [false, true]) {
      const { store, rpa, routes } = memoryStack();
      const ipc = ipcHandlers(store, rpa);
      const inSave = Promise.withResolvers(), holdSave = Promise.withResolvers();
      let writes = 0, browserCalls = 0, completion;
      store.save = async () => {
        if (++writes === 1) { inSave.resolve(); await holdSave.promise; }
      };
      rpa.ensureProfileRunning = async () => { browserCalls += 1; return { port: 1 }; };
      routes.fireAndForget = (run) => { completion = run(); };
      const submit = mode === 'ipc' ? ipc.get('automation:rpa-run')({}, input)
        : routes.routeRpaRun({ input: { ...input, wait: mode === 'http' } });
      await inSave.promise;
      let stop;
      try {
        const [record] = store.listTasks();
        assert.equal(record.status, 'pending', mode);
        assert.deepEqual(rpa.getStatus().queued, [record.id], 'the visible record is already runtime-owned');
        assert.equal((await routes.routeRpaTaskDelete({ pathname: '/api/rpa/tasks/' + record.id })).code, 409);
        assert.equal((await routes.routeRpaRun({ input: { task_id: record.id, wait: false } })).code, 409);
        stop = mode === 'ipc' ? ipc.get('automation:rpa-stop')({}, all ? null : record.id)
          : routes.routeRpaStop({ input: all ? { all: true } : { task_id: record.id } }).then((value) => value.data);
        assert.equal(rpa.queuedControllers.get(record.id).signal.aborted, true);
      } finally {
        holdSave.resolve();
      }
      const reply = await submit;
      const result = mode === 'http-async' ? (assert.equal(reply.data.async, true), await completion)
        : mode === 'http' ? reply.data : reply;
      const stopped = await stop;
      if (all) assert.equal(stopped.count, 1);
      else assert.equal(stopped.state, 'cancelling');
      assert.equal(result.status, 'cancelled', mode);
      assert.equal(store.getTask(result.taskId).status, 'cancelled');
      assert.equal(browserCalls, 0, 'cancellation during acceptance must not call even a mock browser');
      assert.equal(writes, 2, 'initial record and terminal cancellation are persisted');
      assert.equal(rpa.getStatus().queuedCount, 0);
      assert.equal(rpa.queuedControllers.size + rpa.cancelled.size, 0);
    }
  }

  const { store, rpa, routes } = memoryStack();
  let writes = 0;
  store.save = async () => { if (++writes === 1) throw new Error('initial write failed'); };
  rpa.ensureProfileRunning = async () => assert.fail('unaccepted task must not start');
  await assert.rejects(routes.routeRpaRun({ input }), /initial write failed/);
  assert.equal(store.listTasks()[0].status, 'failed', 'write retry cannot leave a stranded pending record');
  assert.equal(rpa.getStatus().queuedCount + rpa.queuedControllers.size, 0);
}

async function resultDurability() {
  const { store, rpa, routes } = memoryStack();
  const ipc = ipcHandlers(store, rpa);
  let saved, writes = 0, steps = 0;
  store.save = async () => {
    if (store.getTask('durability')?.status === 'success' && ++writes <= 2) {
      throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
    }
    saved = structuredClone(store.data);
  };
  const task = await store.createTask({ id: 'durability', profile_id: 'p', steps: [{ type: 'noop' }] });
  const neverStarted = await store.createTask({ id: 'pending-at-restart', profile_id: 'p', steps: [{ type: 'noop' }] });
  rpa.ensureProfileRunning = async () => {
    assert.equal(saved.tasks.find(({ id }) => id === task.id).status, 'running', 'execution entry is durable before acquiring resources');
    return { port: 1 };
  };
  rpa.executeStep = async (_port, _step, context) => { steps += 1; context.variables.result = 'executed once'; };
  const run = (wait = true) => routes.routeRpaRun({ input: { task_id: task.id, wait } });
  const reply = await run();
  assert.equal(reply.data.success, true);
  assert.deepEqual(reply.data.result.variables, { result: 'executed once' });
  assert.equal(reply.data.persistence.code, 'RPA_RESULT_NOT_SAVED');
  assert.equal(writes, 2);
  assert.equal(task.status, 'success');
  assert.equal(task.process_result.ok, true);
  assert.equal((await routes.routeRpaTaskGet({ pathname: '/api/rpa/tasks/' + task.id })).data.task.persistence.state, 'unconfirmed');

  const checkBlocked = async (callback, code) => {
    const fresh = await callback();
    assert.equal(fresh.code, 409);
    assert.equal(fresh.data.code, code);
  };
  await checkBlocked(() => run(false), 'RPA_RESULT_NOT_SAVED');
  await assert.rejects(ipc.get('automation:rpa-run')({}, { task_id: task.id }), { code: 'RPA_RESULT_NOT_SAVED' });
  assert.equal(steps, 1);

  const onDiskBeforeRecovery = saved;
  // A later successful store write may recover the first outcome, but a
  // repeat of the old task ID is not a new execution request.
  await store.save();
  assert.equal(saved.tasks.find(({ id }) => id === task.id).status, 'success');
  await checkBlocked(run, 'RPA_RESULT_NOT_SAVED');
  assert.equal(steps, 1);

  // Simulate restart before the recovered success written above. Process
  // state is gone and only the previously durable entry marker is known.
  const restarted = memoryStack();
  restarted.store.readData = async () => onDiskBeforeRecovery;
  restarted.store.ensureBuiltinTemplates = async () => {};
  restarted.store.ensureLocalCatalogTemplates = async () => {};
  await restarted.store.load();
  assert.equal(restarted.store.getTask(task.id).status, 'interrupted');
  assert.equal(restarted.store.getTask(neverStarted.id).status, 'failed');
  restarted.rpa.ensureProfileRunning = async () => assert.fail('an uncertain task must not execute again');
  await checkBlocked(() => restarted.routes.routeRpaRun({ input: { task_id: task.id, wait: false } }), 'RPA_EXECUTION_INTERRUPTED');
  await assert.rejects(restarted.rpa.runTask(task.id), { code: 'RPA_EXECUTION_INTERRUPTED' });

  const transient = memoryStack();
  const clean = await transient.store.createTask({ id: 'transient', profile_id: 'p', steps: [{ type: 'noop' }] });
  let writesAfterCompletion = 0;
  transient.store.save = async () => {
    if (clean.status === 'success' && ++writesAfterCompletion === 1) throw new Error('transient write error');
  };
  assert.equal((await transient.rpa.runTask(clean.id)).persistence, undefined, 'one failed write does not mark a recovered task as uncertain');
  assert.equal(writesAfterCompletion, 2);
  assert.equal((await transient.rpa.runTask(clean.id)).success, true, 'normally recorded work remains intentionally repeatable');

  for (const status of ['failed', 'cancelled']) {
    const affected = memoryStack();
    const affectedTask = await affected.store.createTask({ id: 'acted', profile_id: 'p', steps: [{ type: 'noop' }] });
    let effectCount = 0, terminalAttempts = 0;
    affected.store.save = async () => {
      if (affectedTask.status === status) {
        terminalAttempts += 1;
        throw Object.assign(new Error('disk full'), { code: 'ENOSPC' });
      }
    };
    affected.rpa.executeStep = async () => {
      effectCount += 1;
      if (status === 'cancelled') await affected.rpa.stop(affectedTask.id);
      else throw new Error('mock step failure');
    };
    const outcome = await affected.rpa.runTask(affectedTask.id);
    assert.equal(outcome.status, status);
    assert.equal(outcome.persistence.code, 'RPA_RESULT_NOT_SAVED');
    assert.equal(terminalAttempts, 2);
    await assert.rejects(affected.rpa.runTask(affectedTask.id), { code: 'RPA_RESULT_NOT_SAVED' });
    assert.equal(effectCount, 1);
  }

  const preflight = memoryStack();
  const preflightTask = await preflight.store.createTask({ id: 'not-acted', profile_id: 'p', steps: [{ type: 'noop' }] });
  const ensure = preflight.rpa.ensureProfileRunning.bind(preflight.rpa);
  preflight.rpa.ensureProfileRunning = async () => assert.fail('failed start fence must prevent any mock action');
  preflight.store.save = async () => { if (preflightTask.status === 'running') throw new Error('write fence failed'); };
  assert.equal((await preflight.rpa.runTask(preflightTask.id)).status, 'failed');
  assert.equal(preflightTask.persistence, undefined);
  preflight.store.save = async () => {};
  preflight.rpa.ensureProfileRunning = ensure;
  assert.equal((await preflight.rpa.runTask(preflightTask.id)).success, true, 'pre-execution storage failure stays retryable');
}

async function main() {
  await retryState();
  await planPreflight();
  await adHocCancellation();
  await resultDurability();
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
      if (ctx.task.profile_id === 'p1') { entered(); await gate; }
    };
    const plan = rpa.runPlan('plan');
    await started;
    const forProfile = (id) => [...tasks.values()].find((task) => task.profile_id === id);
    assert.equal(rpa.getStatus().queuedCount, 2);
    // Release the in-step gate BEFORE stop(): stop-all now drains actual
    // termination (automation review 2026-11-10 [P2-9]) — a quit waits up to
    // 2.5s for running tasks to observe cancellation — so awaiting stop()
    // while a step is still gated would only test the drain cap. This order
    // matches a real quit: steps keep running, cancellation is requested,
    // then steps finish and their terminal state persists.
    release();
    await rpa.stop(stopAll ? null : forProfile('p2').id);
    const result = await plan;
    assert.equal(result.success, false);
    assert.equal(forProfile('p2').status, 'cancelled');
    assert.equal(profilesStarted.includes('p2'), false, 'cancelled pending work must not start its browser');
    if (stopAll) {
      assert.equal(profilesStarted.includes('p3'), false);
      assert.equal(forProfile('p1').status, 'cancelled', 'cancellation during the final step is observed before success');
    }
    else assert.equal(forProfile('p3').status, 'success', 'other queued tasks still run');
    assert.equal(rpa.running.size + rpa.queued.size + rpa.cancelled.size, 0);
  }

  const duringCreate = fixture();
  const create = duringCreate.store.createTasks;
  let enteredCreate;
  const creating = new Promise((resolve) => { enteredCreate = resolve; });
  let releaseCreate;
  const createGate = new Promise((resolve) => { releaseCreate = resolve; });
  duringCreate.store.createTasks = async (values) => {
    const records = await create(values);
    enteredCreate(records);
    await createGate;
    return records;
  };
  const stoppedPlan = duringCreate.rpa.runPlan('plan');
  const [record] = await creating;
  assert.equal((await duringCreate.rpa.stop(record.id)).state, 'cancelling', 'individual plan tasks are cancellable during acceptance');
  const stopPlan = duringCreate.rpa.stop();
  releaseCreate();
  assert.equal((await stopPlan).count, 3);
  await stoppedPlan;
  assert.equal(duringCreate.profilesStarted.length, 0, 'stop-all includes plans still creating task records');
  assert.ok([...duringCreate.tasks.values()].every((task) => task.status === 'cancelled'));
  await duringCreate.rpa.stop('unknown');
  assert.equal(duringCreate.rpa.cancelled.size, 0, 'unknown ids do not accumulate cancellation markers');

  const failingPlan = memoryStack();
  await failingPlan.store.upsertPlan({ id: 'failing', profile_ids: ['p', 'q'] });
  const inSave = Promise.withResolvers(), failSave = Promise.withResolvers();
  let taskWrites = 0, acknowledged = false;
  failingPlan.store.save = async () => {
    if (++taskWrites === 1) { inSave.resolve(); await failSave.promise; throw new Error('batch write failed'); }
  };
  const refused = failingPlan.routes.routeRpaRun({ input: { plan_id: 'failing', wait: false } })
    .then((reply) => { acknowledged = true; return reply; });
  await inSave.promise;
  assert.equal(acknowledged, false, 'the async HTTP plan waits for initial storage acceptance');
  failSave.resolve();
  await assert.rejects(refused, /batch write failed/);
  assert.deepEqual(failingPlan.store.listTasks().map((task) => task.status), ['failed', 'failed']);
  assert.equal(failingPlan.rpa.getStatus().queuedCount + failingPlan.rpa.queuedControllers.size, 0);
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
  console.log('RPA_LIFECYCLE_SELFTEST OK (launch barrier, cancellation across admission, normal retry, result durability and restart fence)');
}

const deadline = setTimeout(() => { console.error('RPA lifecycle selftest timed out'); process.exit(1); }, 5000);
main().then(() => clearTimeout(deadline)).catch((error) => { clearTimeout(deadline); console.error(error); process.exitCode = 1; });
