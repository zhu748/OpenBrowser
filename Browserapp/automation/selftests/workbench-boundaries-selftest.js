'use strict';

const assert = require('node:assert/strict');
const { BrowserEngine } = require('../../engine');
const cloud = require('../cloud-sync');
const operations = require('../cloud-ops');
const { startCookieWarmup } = require('../cookie-warmup');
const { RpaEngine } = require('../rpa-engine');

async function main() {
  const engine = new BrowserEngine({ getPath: () => '/unused-review-path' });
  for (let i = 0; i < 401; i++) engine.profiles.set('p-' + i, { id: 'p-' + i, name: String(i), trashed: true });
  const batchSizes = [];
  engine._deleteProfiles = async (ids) => {
    batchSizes.push(ids.length);
    for (const id of ids) engine.profiles.delete(id);
    return { deleted: ids.length, stopped: 0, ids };
  };
  const cleared = await engine.emptyTrash(false);
  assert.equal(cleared.deleted, 401);
  assert.deepEqual(batchSizes, [200, 200, 1]);
  assert.equal(engine.profiles.size, 0);
  for (let i = 0; i < 201; i++) engine.profiles.set('p-' + i, { id: 'p-' + i, trashed: true });
  engine._deleteProfiles = async (ids) => {
    if (ids.includes('p-200')) throw new Error('second batch failed');
    for (const id of ids) engine.profiles.delete(id);
    return { deleted: ids.length, ids };
  };
  await assert.rejects(engine.emptyTrash(false), (error) => error.completed === 200 && error.remainingIds.length === 1);
  assert.equal(engine.profiles.size, 1);
  engine.starting.set('busy', Promise.resolve());
  await assert.rejects(engine.start({ id: 'busy', name: 'Busy', proxy: 'Direct' }, { headless: true }), { code: 'PROFILE_BUSY' });
  engine.starting.delete('busy');

  let settings = { cloud: { provider: 'local', includeBrowserData: false, enabled: true, local: { dir: '/old' } }, uiGroups: [] };
  operations.initCloudOps({ getEngine: () => ({ profiles: new Map() }), getAutomation: () => ({}), getSettings: () => settings, saveSettings: async (value) => { settings = value; } });
  const originalBuild = cloud.buildBackupPackage, originalUpload = cloud.upload;
  let started, release;
  const uploading = new Promise((resolve) => { started = resolve; });
  const completion = new Promise((resolve) => { release = resolve; });
  cloud.buildBackupPackage = async () => ({ buffer: Buffer.from('fixture'), meta: {} });
  cloud.upload = async () => { started(); await completion; return {}; };
  try {
    const backup = operations.runCloudBackup();
    await uploading;
    settings = { ...settings, cloud: { ...settings.cloud, enabled: false, local: { dir: '/new' } } };
    release(); await backup;
    assert.equal(settings.cloud.enabled, false);
    assert.equal(settings.cloud.local.dir, '/new');
    assert.ok(settings.cloud.lastSyncAt);
  } finally { cloud.buildBackupPackage = originalBuild; cloud.upload = originalUpload; }

  let task, runOptions;
  const profile = { id: 'warm', engine: 'chromium' };
  const context = { engine: { profiles: new Map([['warm', profile]]), running: new Map(), starting: new Map() },
    rpaStore: { createTask: async (value) => { task = { id: 'warm-task', ...value }; return task; }, updateTask: async () => {} },
    rpaEngine: { runTask: async (_id, options) => { runOptions = options; return { success: true }; } } };
  const result = await startCookieWarmup(context, { profileId: 'warm', urls: ['https://example.test'], stayMin: 10, stayMax: 10, scrollMin: 100, scrollMax: 100, autoClose: true, headless: true });
  assert.equal(result.taskId, 'warm-task');
  assert.deepEqual(task.steps.map((step) => step.type), ['goto', 'wait', 'scroll']);
  assert.equal(task.steps[2].params.distance, 100);
  assert.equal(runOptions.warmup.autoClose, true);
  assert.equal(runOptions.warmup.headless, true);
  await assert.rejects(startCookieWarmup(context, { profileId: 'warm', urls: ['file:///private'] }));
  await assert.rejects(startCookieWarmup(context, { profileId: 'warm', urls: ['https://example.test'], stayMin: 20, stayMax: 10 }));
  context.engine.running.set('warm', { port: 1 });
  await assert.rejects(startCookieWarmup(context, { profileId: 'warm', urls: ['https://example.test'], headless: true }), /先停止/);

  for (const fail of [false, true]) {
    let closed = 0;
    const record = { id: 'warm-task', profile_id: 'warm', steps: [{ type: 'wait', params: { ms: 1 } }] };
    const rpa = new RpaEngine({ engine: { stop: async () => { closed++; } }, store: { getTask: () => record, updateTask: async (_id, patch) => Object.assign(record, patch) } });
    rpa.writeDiagnostic = async () => {};
    rpa.ensureProfileRunning = async () => ({ port: 1 });
    rpa.executeStep = async () => { if (fail) throw new Error('navigation failed'); };
    const done = await rpa.runTask(record.id, { warmup: { autoClose: true } });
    assert.equal(done.success, !fail);
    assert.equal(closed, 1, 'warmup closes on success and error, exactly once');
  }
  let cancelledClose = 0;
  const cancelledTask = { id: 'cancel-start', profile_id: 'warm', steps: [{ type: 'wait' }] };
  const cancelledRpa = new RpaEngine({ engine: { stop: async () => { cancelledClose++; } }, store: {
    getTask: () => cancelledTask, updateTask: async (_id, patch) => Object.assign(cancelledTask, patch),
  } });
  cancelledRpa.writeDiagnostic = async () => {};
  cancelledRpa.ensureProfileRunning = async () => { await cancelledRpa.stop(cancelledTask.id); return { port: 1 }; };
  const cancelledResult = await cancelledRpa.runTask(cancelledTask.id, { warmup: { autoClose: true } });
  assert.equal(cancelledResult.status, 'cancelled');
  assert.equal(cancelledClose, 1, 'cancellation during browser startup still closes the completed launch');
  const closingTask = { id: 'cancel-close', profile_id: 'warm', steps: [{ type: 'wait' }] };
  const closingRpa = new RpaEngine({ engine: { stop: async () => closingRpa.stop(closingTask.id) }, store: {
    getTask: () => closingTask, updateTask: async (_id, patch) => Object.assign(closingTask, patch),
  } });
  closingRpa.writeDiagnostic = async () => {};
  closingRpa.ensureProfileRunning = async () => ({ port: 1 });
  closingRpa.executeStep = async () => {};
  assert.equal((await closingRpa.runTask(closingTask.id, { warmup: { autoClose: true } })).status, 'cancelled');
  console.log('WORKBENCH_BOUNDARIES_SELFTEST OK (batched trash, partial progress, concurrent cloud settings, persisted warmup, validation, cleanup)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
