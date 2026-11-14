'use strict';

const assert = require('node:assert/strict');
const { registerProfileIpc } = require('../../main/profile-ipc');

async function main() {
  const handlers = new Map();
  const calls = [];
  const before = [];
  let removalBarrier = null;
  const engine = Object.fromEntries([
    'syncProfiles', 'deleteProfiles', 'trashProfiles', 'restoreProfiles', 'purgeProfiles', 'emptyTrash',
    'start', 'stop', 'clearProfileCacheAndCookies', 'status', 'testProxy', 'checkProxy',
    'applyProfileCommands', 'profileForEdit', 'statusDelta',
  ].map((method) => [method, (...args) => { calls.push([method, ...args]); return method; }]));
  registerProfileIpc({
    registerTrustedIpc(channel, handler) { assert.equal(handlers.has(channel), false); handlers.set(channel, handler); },
    engine,
    sanitizeIds(values) { if (!Array.isArray(values)) throw new Error('invalid IDs'); return [...new Set(values.map(String))]; },
    async beforeRemove(ids) { before.push(ids); if (removalBarrier) await removalBarrier; },
  });
  const invoke = (action, value, options) => handlers.get(`profiles:${action}`)(null, value, options);
  assert.equal(handlers.size, 15);
  assert.deepEqual(await invoke('apply-commands', [{ kind: 'modify', id: 'a', baseRev: 1 }]), { ipcResult: 1, ok: true, value: 'applyProfileCommands' });
  assert.deepEqual(calls.at(-1), ['applyProfileCommands', [{ kind: 'modify', id: 'a', baseRev: 1 }], undefined]);
  await invoke('apply-commands', [{ kind: 'patch', id: 'a', baseRev: 1, patch: { note: 'n' } }], { delta: true });
  assert.deepEqual(calls.at(-1).at(-1), { delta: true }, 'scoped replies cross trusted IPC');
  assert.deepEqual(await invoke('editor-state', 'a'), { ipcResult: 1, ok: true, value: 'profileForEdit' });
  assert.deepEqual(calls.at(-1), ['profileForEdit', 'a']);
  assert.equal(invoke('status-delta', { a: 1 }), 'statusDelta');
  assert.deepEqual(calls.at(-1), ['statusDelta', { a: 1 }, { includeWatermark: false, includeCursor: true }]);
  assert.equal(invoke('sync', [{ id: 'a' }]), 'syncProfiles');
  assert.deepEqual(calls.at(-1), ['syncProfiles', [{ id: 'a' }], { checkRevisions: true }]);
  for (const [action, method] of [['delete', 'deleteProfiles'], ['purge', 'purgeProfiles'], ['trash', 'trashProfiles']]) {
    await invoke(action, { ids: ['a', 'a', 'b'], deleteData: false });
    assert.deepEqual(before.at(-1), ['a', 'b']);
    assert.deepEqual(calls.at(-1), action === 'trash' ? [method, ['a', 'b']] : [method, ['a', 'b'], false]);
  }
  await invoke('delete', { ids: ['a'] }); assert.deepEqual(calls.at(-1), ['deleteProfiles', ['a'], true]);
  const count = before.length;
  await assert.rejects(invoke('purge', { ids: 'invalid' }), /invalid IDs/);
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
  let release;removalBarrier = new Promise(resolve => { release = resolve; });
  const priorCalls = calls.length,pending = invoke('delete', { ids: ['held'] });
  await new Promise(resolve => setImmediate(resolve));assert.equal(calls.length, priorCalls, 'profile deletion waits for asynchronous sync/theme cleanup');release();await pending;assert.deepEqual(calls.at(-1), ['deleteProfiles', ['held'], true]);
  removalBarrier = Promise.reject(Error('native cleanup failed'));await assert.rejects(invoke('delete', { ids: ['failed'] }), /native cleanup failed/);assert.equal(calls.length, priorCalls + 1, 'failed cleanup cannot delete a live master profile');removalBarrier = null;
  engine.start = async () => { throw new Error('start failed'); };
  await assert.rejects(invoke('start'), /start failed/);
  console.log('PROFILE_IPC_SELFTEST OK (trusted registration, 15 channels, validation, selection, errors)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
