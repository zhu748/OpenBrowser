'use strict';

const assert = require('node:assert/strict');
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
  console.log('PROFILE_LIFECYCLE_BRIDGE_SELFTEST OK (real stage labels, deduplicated completion, resync, sync/error and stale RPC handling)');
}
main().catch(error => { console.error(error);process.exitCode = 1; });
