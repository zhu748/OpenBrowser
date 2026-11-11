'use strict';

const assert = require('node:assert/strict');
const { TaskScheduler } = require('../task-scheduler');
const { fetchStoreEntries } = require('../store-fetch');
const { RpaEngine } = require('../rpa-engine');
const { runRegex } = require('../rpa/regex');
const { RpaRoutes } = require('../api/rpa-routes');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const scheduler = new TaskScheduler({ concurrency: 1, maxPending: 1 });
  let release;
  const first = scheduler.schedule(() => new Promise((resolve) => { release = resolve; }), null, { timeout: 10 });
  let nextStarted = false;
  const second = scheduler.schedule(() => { nextStarted = true; return 'next'; });
  await assert.rejects(scheduler.schedule(() => {}), (e) => e.code === 'QUEUE_FULL');
  await assert.rejects(first, (e) => e.code === 'ETIMEDOUT');
  assert.equal(scheduler.running, 1);
  assert.equal(nextStarted, false, 'timed-out uncooperative work retains its resource slot');
  let drained = false;
  const drain = scheduler.drain().then(() => { drained = true; });
  await delay(5); assert.equal(drained, false);
  release(); await second; await drain;
  assert.equal(scheduler.running, 0);
  const queuedController = new AbortController();
  let unlock;
  const held = scheduler.schedule(() => new Promise((resolve) => { unlock = resolve; }));
  const cancelled = scheduler.schedule(() => { throw new Error('must not start'); }, null, { signal: queuedController.signal });
  queuedController.abort(new Error('cancel while queued'));
  await assert.rejects(cancelled, /cancel while queued/);
  assert.equal(scheduler.size, 0, 'queued cancellation immediately releases queue capacity');
  await Promise.resolve(); unlock(); await held; await scheduler.drain();

  let active = 0, peak = 0;
  const results = await fetchStoreEntries(Array.from({ length: 12 }, (_, i) => String(i)),
    async (_id, { signal }) => {
      active++; peak = Math.max(peak, active);
      try { await new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })); }
      finally { active--; }
    }, { concurrency: 2, timeoutMs: 15 });
  assert.deepEqual(results, {});
  assert.equal(active, 0, 'transport cancellation releases actual work');
  assert.equal(peak, 2);

  const tasks = new Map(Array.from({ length: 12 }, (_, i) => ['t' + i,
    { id: 't' + i, profile_id: 'p' + i, status: 'pending', steps: [{ type: 'wait' }] }]));
  const rpa = new RpaEngine({ engine: {}, store: {
    getTask: (id) => tasks.get(id), updateTask: async (id, patch) => Object.assign(tasks.get(id), patch),
  } });
  rpa.writeDiagnostic = async () => {};
  rpa.ensureProfileRunning = async () => ({ port: 1 });
  active = 0; peak = 0;
  rpa.executeStep = async () => { active++; peak = Math.max(peak, active); await delay(10); active--; };
  const runs = [...tasks.keys()].map((id) => rpa.runTask(id));
  const routes = new RpaRoutes({ rpaEngine: rpa, rpaStore: {
    deleteTask: () => { throw new Error('cannot delete an active task'); },
  } });
  assert.equal((await routes.routeRpaTaskDelete({ pathname: '/api/rpa/tasks/t11' })).code, 409);
  await assert.rejects(rpa.runTask('t0'), /already running or queued/);
  assert.ok((await Promise.all(runs)).every((r) => r.success));
  assert.equal(peak, 8, 'public single-task calls use the shared task-body limit');
  assert.equal(rpa.queued.size + rpa.running.size, 0);
  for (const task of tasks.values()) task.profile_id = 'same-profile';
  active = 0; peak = 0;
  await Promise.all([...tasks.keys()].map((id) => rpa.runTask(id)));
  assert.equal(peak, 1, 'flows using the same profile cannot overlap');
  assert.equal(rpa.profileRuns.size, 0);

  assert.deepEqual(await runRegex('(a+)', '', 'baa'), ['aa', 'aa']);
  await assert.rejects(runRegex('[', '', 'abc'), /regular expression|unterminated/i);
  let ticks = 0;
  const timer = setInterval(() => { ticks++; }, 5);
  try { await assert.rejects(runRegex('(a+)+$', '', 'a'.repeat(32) + '!', { timeoutMs: 100 }), (e) => e.code === 'RPA_REGEX_TIMEOUT'); }
  finally { clearInterval(timer); }
  assert.ok(ticks > 0, 'expensive expressions leave the host event loop responsive');
  const controller = new AbortController();
  const expression = runRegex('(a+)+$', '', 'a'.repeat(32) + '!', { signal: controller.signal });
  controller.abort(new Error('requested cancellation'));
  await assert.rejects(expression, /requested cancellation/);
  assert.deepEqual(await runRegex('b', '', 'abc'), ['b'], 'a killed worker does not break later expressions');
  console.log('REVIEW_RUNTIME_SELFTEST OK (capacity, cancellation, actual concurrency, profile exclusion, regex isolation)');
}

const watchdog = setTimeout(() => { console.error('Runtime regression timed out'); process.exit(1); }, 10000);
main().then(() => clearTimeout(watchdog)).catch((error) => { clearTimeout(watchdog); console.error(error); process.exitCode = 1; });
