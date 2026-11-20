'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { BrowserEngine } = require('../../engine');
const { profileLifecycle, beginProfileStop, observeProfileStop } = require('../../engine/profile-lifecycle');
const { syncClosedProfile } = require('../close-profile-sync');
const deferred = () => { let resolve, reject;const promise = new Promise((a, b) => { resolve = a;reject = b; });return { promise, resolve, reject }; };

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-lifecycle-status-'));
  try {
    const engine = new BrowserEngine({ getPath: () => root }), id = 'status-test';
    engine.profiles.set(id, engine.sanitizeProfile({ id, name: id }));
    engine.lifecycleGenerations.set(id, 1);
    const events = [];engine.on(event => events.push(event));
    engine.starting.set(id, Promise.resolve());
    engine.emitStartProgress(id, 'prepare', 1, 'prepare', 1);
    const initial = engine.status();
    engine.emitStartProgress(id, 'proxy', 18, 'probe', 1);
    assert.notEqual(engine.status(), initial, 'progress invalidates the snapshot cache');
    assert.equal(engine.status()[0].lifecycle.phase, 'proxy');
    const item = { lifecycleGeneration: 1, browser: { name: 'test', path: '/test' }, extensions: [], root };
    engine.running.set(id, item);
    engine.emit({ type: 'status', id, running: true });
    assert.equal(engine.publicRunning(id).running, false, 'a registered process is not a verified ready browser');
    engine.emitStartProgress(id, 'ready', 100, 'ready', 1);
    assert.equal(engine.publicRunning(id).running, true);
    engine.starting.delete(id);
    const existing = await engine.startManaged(id, engine.profiles.get(id), () => { throw Error('must not relaunch'); });
    assert.equal(existing.alreadyRunning, true);
    assert.equal(engine.lifecycleGenerations.get(id), 1, 'a no-op start retains the process ownership generation');
    assert.equal(existing.lifecycle.generation, 1);

    const local = deferred(), cloud = deferred();
    beginProfileStop(engine, id, item);
    engine.stopping.set(id, local.promise);observeProfileStop(engine, id, local.promise, item);
    const upload = syncClosedProfile(engine, { cloudBackup: true, profile: { id }, lifecycleGeneration: 1 }, {
      cloud: { enabled: true }, groups: [], push: () => cloud.promise,
    });
    engine.running.delete(id);local.resolve();await local.promise;await Promise.resolve();
    assert.equal(profileLifecycle(engine, id).operation, 'sync');
    assert.equal(engine.status()[0].lifecycle.pending, true, 'remote sync can outlive local stop');
    cloud.resolve();assert.equal((await upload).ok, true);
    assert.equal(profileLifecycle(engine, id).pending, false);
    assert.equal(engine.stopping.has(id), false);

    const lateLocal = deferred();
    beginProfileStop(engine, id, item);
    engine.stopping.set(id, lateLocal.promise);observeProfileStop(engine, id, lateLocal.promise, item);
    await syncClosedProfile(engine, { cloudBackup: true, profile: { id }, lifecycleGeneration: 1 }, {
      cloud: { enabled: true }, push: async () => { throw Error('early upload failure'); },
    });
    assert.equal(profileLifecycle(engine, id).pending, true, 'a failed upload does not hide unfinished local cleanup');
    lateLocal.resolve();await lateLocal.promise;await Promise.resolve();
    assert.equal(profileLifecycle(engine, id).error, true, 'local completion cannot erase the earlier upload failure');

    const failed = deferred();
    beginProfileStop(engine, id, item);
    engine.stopping.set(id, failed.promise);observeProfileStop(engine, id, failed.promise, item);
    failed.reject(Error('cleanup blocked'));await failed.promise.catch(() => {});await Promise.resolve();
    assert.equal(profileLifecycle(engine, id).error, true);
    assert.equal(profileLifecycle(engine, id).pending, false, 'failure clears the indefinite busy indicator');
    const blocked = deferred();
    engine.running.set(id, item);
    beginProfileStop(engine, id, item);
    engine.stopping.set(id, blocked.promise);
    observeProfileStop(engine, id, blocked.promise, item);
    blocked.resolve({ running: false, cleanupBlocked: true });
    await blocked.promise;
    assert.equal(events.at(-1).running, true, 'an uncertain cleanup preserves the current process state');
    assert.equal(events.at(-1).phase, 'error', 'an uncertain cleanup must not publish success');
    engine.running.delete(id);
    engine.lifecycleGenerations.set(id, 2);
    engine.emitStartProgress(id, 'proxy', 18, 'new probe', 2);
    const count = events.length;
    engine.emit({ type: 'profile-start-progress', id, phase: 'error', error: true, lifecycleGeneration: 1 });
    engine.emit({ type: 'profile-stop-progress', id, phase: 'done', lifecycleGeneration: 1 });
    assert.equal(events.length, count, 'obsolete generation events are not delivered');
    assert.equal(profileLifecycle(engine, id).phase, 'proxy');
    beginProfileStop(engine, id, { lifecycleGeneration: 2 });
    engine.emit({ type: 'profile-stop-progress', id, phase: 'done', percent: 100, lifecycleGeneration: 2 });
    engine.emit({ type: 'profile-start-progress', id, phase: 'error', error: true,
      message: 'browser exited before verification', lifecycleGeneration: 2 });
    assert.equal(profileLifecycle(engine, id).error, true, 'failed startup remains visible after process cleanup');
    engine.lifecycleGenerations.set(id, 3);
    engine.emitStartProgress(id, 'proxy', 18, 'third probe', 3);
    assert.equal(syncClosedProfile(engine, { cloudBackup: true, profile: { id } }, { cloud: { enabled: false } }), null);
    let notified;
    const failure = await syncClosedProfile(engine, { cloudBackup: true, profile: { id }, lifecycleGeneration: 3 }, {
      cloud: { enabled: true }, push: async () => { throw Error('upload failed'); }, onError: error => { notified = error.message; },
    });
    assert.equal(failure.ok, false);assert.equal(notified, 'upload failed');
    assert.equal(profileLifecycle(engine, id).operation, 'start', 'a pending start is still represented after a separate sync settles');
    engine.profiles.delete(id);engine.invalidateStatusCache();engine.status();
    assert.equal(engine.profileLifecycles.has(id), false, 'removed profiles release transient lifecycle state');
    console.log('PROFILE_LIFECYCLE_SELFTEST OK (snapshot recovery, readiness, local/cloud stop barriers, failures and generation isolation)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error);process.exitCode = 1; });
