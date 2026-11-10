'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ipc = require('../../shared/ipc-result');
const commands = require('../../ui/ui-profile-commands');
const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const snapshot = (id, rev, note = 'Engine') => ({ ipcResult: 1, ok: true, value: { profile: { id, name: id, note }, rev } });

async function main() {
  const a = deferred(); const b = deferred(); const shown = [];
  const opener = commands.createProfileEditorOpener({ readSnapshot: (id) => id === 'a' ? a.promise : b.promise, show: (value) => shown.push(value) });
  const first = opener.open('a'); const second = opener.open('b');
  b.resolve(snapshot('b', 7));
  assert.equal(await second, true);
  a.resolve(snapshot('a', 2));
  assert.equal(await first, false, 'late responses cannot replace the current editor');
  assert.deepEqual(shown.map((value) => value.profile.id), ['b']);
  assert.equal(shown[0].rev, 7);

  const cancelled = deferred();
  const next = commands.createProfileEditorOpener({ readSnapshot: () => cancelled.promise, show: () => { throw new Error('cancelled editor opened'); } });
  const pending = next.open('a'); next.cancel(); cancelled.reject(new Error('late failure'));
  assert.equal(await pending, false, 'navigation suppresses both stale results and stale errors');
  const malformed = commands.createProfileEditorOpener({ readSnapshot: async () => snapshot('wrong', 1), show: () => {} });
  await assert.rejects(malformed.open('a'), (error) => error.code === 'PROFILE_SNAPSHOT_INVALID');

  // Exercise the production open wrapper, including its snapshot transport.
  const text = fs.readFileSync(path.join(__dirname, '../../ui/ui-editor.js'), 'utf8');
  const start = text.indexOf('const profileEditorOpener =');
  const end = text.indexOf('function showProfileEditor(', start);
  const context = {
    window: { OpenBrowserProfileCommands: commands, ops: { profileForEdit: async () => snapshot('a', 3, 'Fresh fields') } },
    ui: { profiles: [{ id: 'a', note: 'Old local fields' }] }, engineProfiles: [{ id: 'a', rev: 99 }],
    showProfileEditor(profile, rev) { context.displayed = { profile, rev }; },
    tx: (value) => value, toast: (value) => { throw new Error(value); },
  };
  vm.runInNewContext(text.slice(start, end), context);
  assert.equal(await context.openProfileEditor('a'), true);
  assert.equal(context.displayed.profile.note, 'Fresh fields');
  assert.equal(context.displayed.rev, 3, 'form revision is coupled to the fields, never taken from the polling cache');
  let committed = false;
  await assert.rejects(commands.commitProfileEdit({
    profile: { id: 'a' }, baseRev: 1, applyCommands: async () => ipc.captureIpcResult(() => ({ unexpected: true })), commit: () => { committed = true; },
  }), (error) => error.code === 'PROFILE_COMMAND_RESULT_INVALID');
  assert.equal(committed, false);
  console.log('PROFILE_EDITOR_OPEN_SELFTEST OK (authoritative snapshot, latest request, cancellation, real wrapper, invalid replies)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
