'use strict';

const assert = require('node:assert/strict');
const { registerProfileIpc } = require('../../main/profile-ipc');

async function main() {
  const handlers = new Map();
  const calls = [];
  const before = [];
  const engine = Object.fromEntries([
    'syncProfiles', 'deleteProfiles', 'trashProfiles', 'restoreProfiles', 'purgeProfiles', 'emptyTrash',
    'start', 'stop', 'clearProfileCacheAndCookies', 'status', 'testProxy', 'checkProxy',
    'applyProfileCommands', 'profileForEdit', 'statusDelta',
  ].map((method) => [method, (...args) => { calls.push([method, ...args]); return method; }]));
  registerProfileIpc({
    registerTrustedIpc(channel, handler) { assert.equal(handlers.has(channel), false); handlers.set(channel, handler); },
    engine,
    sanitizeIds(values) { if (!Array.isArray(values)) throw new Error('invalid IDs'); return [...new Set(values.map(String))]; },
    beforeRemove(ids) { before.push(ids); },
  });
  const invoke = (action, value) => handlers.get(`profiles:${action}`)(null, value);
  assert.equal(handlers.size, 15);
  assert.deepEqual(await invoke('apply-commands', [{ kind: 'modify', id: 'a', baseRev: 1 }]), { ipcResult: 1, ok: true, value: 'applyProfileCommands' });
  assert.deepEqual(calls.at(-1), ['applyProfileCommands', [{ kind: 'modify', id: 'a', baseRev: 1 }]]);
  assert.deepEqual(await invoke('editor-state', 'a'), { ipcResult: 1, ok: true, value: 'profileForEdit' });
  assert.deepEqual(calls.at(-1), ['profileForEdit', 'a']);
  assert.equal(invoke('status-delta', { a: 1 }), 'statusDelta');
  assert.deepEqual(calls.at(-1), ['statusDelta', { a: 1 }, { includeWatermark: false }]);
  assert.equal(invoke('sync', [{ id: 'a' }]), 'syncProfiles');
  assert.deepEqual(calls.at(-1), ['syncProfiles', [{ id: 'a' }]]);
  for (const [action, method] of [['delete', 'deleteProfiles'], ['purge', 'purgeProfiles'], ['trash', 'trashProfiles']]) {
    invoke(action, { ids: ['a', 'a', 'b'], deleteData: false });
    assert.deepEqual(before.at(-1), ['a', 'b']);
    assert.deepEqual(calls.at(-1), action === 'trash' ? [method, ['a', 'b']] : [method, ['a', 'b'], false]);
  }
  invoke('delete', { ids: ['a'] }); assert.deepEqual(calls.at(-1), ['deleteProfiles', ['a'], true]);
  const count = before.length;
  assert.throws(() => invoke('purge', { ids: 'invalid' }), /invalid IDs/);
  assert.equal(before.length, count, 'input validation precedes host selection changes');
  invoke('restore', { ids: ['a', 'a'] }); assert.deepEqual(calls.at(-1), ['restoreProfiles', ['a']]);
  assert.equal(before.length, count, 'restore does not remove the sync selection');
  invoke('empty-trash'); assert.deepEqual(calls.at(-1), ['emptyTrash', true]);
  invoke('empty-trash', { deleteData: false }); assert.deepEqual(calls.at(-1), ['emptyTrash', false]);
  for (const [action, method] of [['start', 'start'], ['stop', 'stop'], ['clear-cache-cookies', 'clearProfileCacheAndCookies'], ['test-proxy', 'testProxy']]) {
    assert.equal(invoke(action, 'value'), method); assert.deepEqual(calls.at(-1), [method, 'value']);
  }
  assert.equal(invoke('status'), 'status');
  invoke('check-proxy', { id: 'a' }); assert.deepEqual(calls.at(-1), ['checkProxy', { id: 'a' }, { persist: true }]);
  engine.start = async () => { throw new Error('start failed'); };
  await assert.rejects(invoke('start'), /start failed/);
  console.log('PROFILE_IPC_SELFTEST OK (trusted registration, 15 channels, validation, selection, errors)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
