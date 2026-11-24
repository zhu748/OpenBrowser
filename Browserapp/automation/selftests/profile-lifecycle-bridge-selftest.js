'use strict';

const assert = require('node:assert/strict');

async function verifyLaunchReceipts(createBridge) {
  // Real state/IPC projections with an inert owner; no browser is launched.
  const { BrowserEngine } = require('../../engine');
  const { TrackedProfileMap } = require('../../engine/profile-revisions');
  const { captureProfileLaunchRevision } = require('../../engine/profile-lifecycle');
  const routes = new Map(require('../../rebuild/routes/profiles').map(([name, handler]) => [name, handler]));
  const id = 'launch-receipt', profile = { id, name: 'Mock window', option: 'original', lastOpenedAt: null };
  const engine = Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new TrackedProfileMap([[id, profile]]), starting: new Map(), stopping: new Map(),
    running: new Map(), networkInfo: new Map(), assignments: new Map(), listeners: new Set(),
    lifecycleGenerations: new Map([[id, 1]]), allowSystemBrowserFallback: true,
  });
  const emitted = [];
  const bridge = createBridge({ emit: (_channel, value) => emitted.push(value) });
  engine.on(event => bridge.handle(event));
  const service = { engine };
  const snapshot = () => routes.get('profiles:lifecycle-rows')(service);
  const mockOwner = { browser: { name: 'Fixture Browser', path: '/mock/browser' }, extensions: [] };
  const initialRevision = engine.profiles.revisionOf(id);
  const warn = (message, lifecycleGeneration = 1) => engine.emit({ type: 'profile-start-page-warning', id, lifecycleGeneration, message });
  engine.browserSelection = () => ({ mode: 'system-manual', browser: mockOwner.browser });
  engine.start = async requested => {
    const launchProfileSnapshot = captureProfileLaunchRevision(engine, requested);
    engine.emitStartProgress(id, 'prepare', 1, '', 1);
    engine.chooseBrowser(requested, 'chromium', 1);
    engine.running.set(id, { ...mockOwner, verificationBlocked: true, lifecycleGeneration: 1, launchProfileSnapshot });
    warn('Mock start page could not load');
    assert.equal(engine.publicRunning(id).running, false, 'a staged process is not an open window');
    engine.emitStartProgress(id, 'ready', 100, '', 1);
    return engine.publicRunning(id);
  };
  engine.applyProfileCommands = async () => { throw new Error('Mock metadata write failed'); };
  const operation = bridge.beginStart(id);
  const result = await routes.get('profiles:start')(service, { id });
  bridge.finishStart(operation, result);
  const evidence = emitted.at(-1).data;
  assert.equal(result.running, true);
  assert.equal(evidence.message, '窗口已打开，配置验证受阻');
  assert.equal(evidence.launchStatus.capturedRevision, initialRevision);
  assert.deepEqual(evidence.warningMessages.slice(0, 2), ['用户已手动选择本机浏览器回退。', 'Mock start page could not load']);
  assert.match(evidence.warningMessages[2], /Mock metadata write failed/);
  assert.equal(emitted.filter(event => event.data?.percent === 100 && !event.data.statusUpdate).length, 1,
    'late metadata must not retrigger the window-open callback');

  const [reloaded] = createBridge({ emit() {} }).messages(snapshot());
  assert.equal(reloaded.detail, evidence.detail, 'a fresh renderer restores the same evidence');
  assert.deepEqual(reloaded.warningMessages, evidence.warningMessages);
  const staleRows = snapshot(), cursor = bridge.snapshotCursor();
  warn('Late live warning');
  assert.deepEqual(bridge.messages(staleRows, cursor), [], 'a delayed snapshot cannot erase live evidence');

  engine.profiles.set(id, { ...profile, lastOpenedAt: 'bookkeeping only' });
  assert.notEqual(engine.publicRunning(id).launchStatus.savedRevision, initialRevision);
  assert.equal(engine.publicRunning(id).launchStatus.savedRelation, 'matches', 'an open-time write is not a settings edit');
  engine.profiles.set(id, { ...engine.profiles.get(id), option: 'edited after launch' });
  const currentRevision = engine.profiles.revisionOf(id);
  bridge.refreshReceipts(snapshot(), bridge.snapshotCursor());
  assert.equal(emitted.at(-1).data.launchStatus.savedRelation, 'differs');

  const reuse = bridge.beginStart(id);
  const reused = await BrowserEngine.prototype.startManaged.call(engine, id, engine.profiles.get(id),
    () => assert.fail('reuse must not launch another window'));
  bridge.finishStart(reuse, reused);
  const reuseData = emitted.at(-1).data;
  assert.equal(reused.alreadyRunning, true);
  assert.equal(reuseData.launchStatus.reused, true);
  assert.equal(reuseData.launchStatus.capturedRevision, initialRevision);
  assert.equal(reuseData.launchStatus.savedRevision, currentRevision);
  assert.match(reuseData.detail, /未重新启动/);
  assert.match(reuseData.detail, /保存配置与启动记录不同/);

  // An unverified owner without a capture must not inherit the previous
  // blocked result or obtain its own launch revision from the saved row.
  engine.running.delete(id);
  engine.emit({ type: 'profile-stop-progress', id, phase: 'done', lifecycleGeneration: 1 });
  engine.lifecycleGenerations.set(id, 2);
  engine.emitStartProgress(id, 'prepare', 1, '', 2);
  assert.equal(captureProfileLaunchRevision(engine, { ...profile, option: 'not the saved row' }), null);
  engine.running.set(id, { ...mockOwner, engine: 'firefox', lifecycleGeneration: 2 });
  warn('Old owner must not send warnings');
  engine.emitStartProgress(id, 'ready', 100, '', 2);
  const [nextOwner] = bridge.messages(snapshot());
  assert.deepEqual(nextOwner.launchStatus, {
    configurationState: 'unverified', savedRevision: currentRevision, capturedRevision: null, savedRelation: 'unknown', reused: false,
  });
  assert.match(nextOwner.detail, /启动时的配置版本未知/);
  assert.deepEqual(nextOwner.warningMessages, []);

  const hardId = 'reject-fixture';
  engine.profiles.set(hardId, { id: hardId, name: 'Rejected' });
  engine.lifecycleGenerations.set(hardId, 1);
  engine.emit({ type: 'profile-start-progress', id: hardId, phase: 'error', lifecycleGeneration: 1,
    errorCode: 'FIXTURE_UNSUPPORTED', message: 'Fixture option is unsupported' });
  const rejected = bridge.messages(snapshot()).find(row => row.dirId === hardId);
  assert.equal(rejected.code, 1);
  assert.equal(rejected.errorCode, 'FIXTURE_UNSUPPORTED');
  assert.equal(rejected.errorMessage, 'Fixture option is unsupported');
}

async function main() {
  const { createProfileLifecycleBridge } = await import('../../rebuild/workbench-profile-lifecycle.mjs');
  const events = [], errors = [], id = 'profile';
  const bridge = createProfileLifecycleBridge({ emit: (channel, value) => events.push({ channel, value }), notify: value => errors.push(value) });
  const operation = bridge.beginStart(id);
  const progress = (phase, percent) => bridge.handle({ type: 'profile-start-progress', id, phase, percent, lifecycleGeneration: 1 });
  progress('proxy', 18);
  assert.equal(events.at(-1).value.data.message, '检测 IP…');
  const before = events.length;
  bridge.handle({ type: 'status', id, running: true, lifecycle: { operation: 'start', phase: 'proxy', percent: 18, pending: true, generation: 1 } });
  assert.equal(events.length, before, 'an early process status cannot complete the open button');
  progress('inject', 88);assert.equal(events.at(-1).value.data.message, '启动窗口');
  progress('ready', 100);
  bridge.finishStart(operation, {});
  assert.equal(events.filter(e => e.channel === 'browser:launch-process-message' && e.value.data.percent === 100).length, 1);
  const noOp = bridge.beginStart(id);
  bridge.finishStart(noOp, { alreadyRunning: true, lifecycle: { generation: 1 } });
  assert.equal(events.at(-1).value.data.percent, 100);
  bridge.handle({ type: 'profile-stop-progress', id, phase: 'sync', lifecycleGeneration: 1 });
  assert.equal(events.at(-2).value.uploading, true);
  assert.equal(events.at(-2).value.data.message, '同步中…');
  const duringStop = events.length;
  progress('inject', 88);assert.equal(events.length, duringStop, 'a late startup frame cannot replace close progress');
  bridge.handle({ type: 'status', id, running: false, lifecycle: { operation: 'sync', phase: 'sync', pending: true, generation: 1 } });
  assert.equal(events.some(e => e.channel === 'browser:on-close'), false, 'cleanup status cannot clear outstanding synchronization');
  bridge.handle({ type: 'profile-sync-progress', id, phase: 'done', lifecycleGeneration: 1 });
  assert.equal(events.at(-1).channel, 'browser:on-close');
  const next = bridge.beginStart(id), count = events.length;
  progress('ready', 100);assert.equal(events.length, count, 'old generation completion is ignored');
  bridge.finishStart(operation, null, Error('obsolete client failure'));assert.equal(events.length, count);
  bridge.handle({ type: 'profile-start-progress', id, phase: 'error', error: true, message: 'probe failed', lifecycleGeneration: 2 });
  bridge.finishStart(next, null, Error('probe failed'));
  assert.equal(events.at(-1).value.code, 1);
  const recovered = bridge.messages([{ id, dirId: id, openStatus: false,
    lifecycle: { operation: 'start', phase: 'proxy', percent: 18, pending: true } }]);
  assert.equal(recovered[0].message, '检测 IP…');assert.equal(recovered[0].percent, 18);
  const syncing = bridge.messages([{ id, openStatus: false, lifecycle: { operation: 'sync', phase: 'sync', pending: true } }]);
  assert.equal(syncing[0].uploading, true);assert.equal(syncing[0].percent, 100);
  bridge.handle({ type: 'profile-stop-progress', id, phase: 'error', error: true, message: 'blocked', lifecycleGeneration: 2 });
  assert.equal(events.at(-1).channel, 'browser:on-close');assert.equal(errors.length, 1);
  bridge.handle({ type: 'profile-stop-progress', id, phase: 'error', error: true, running: true,
    message: 'still running', lifecycleGeneration: 3 });
  assert.equal(events.at(-1).channel, 'browser:launch-process-message');
  assert.equal(events.at(-1).value.data.percent, 100);
  assert.match(errors.at(-1), /still running/);
  const unconfirmed = bridge.beginStart('no-window');
  bridge.finishStart(unconfirmed, {});
  assert.equal(events.at(-1).value.errorCode, 'PROFILE_WINDOW_NOT_CONFIRMED',
    'an empty result is not proof that a window opened');
  await verifyLaunchReceipts(createProfileLifecycleBridge);
  console.log('PROFILE_LIFECYCLE_BRIDGE_SELFTEST OK (lifecycle, blocked/unverified receipts, refresh, saved revisions and reuse)');
}
main().catch(error => { console.error(error);process.exitCode = 1; });
