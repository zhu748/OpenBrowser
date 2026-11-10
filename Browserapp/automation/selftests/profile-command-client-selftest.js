'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { captureIpcResult, unwrapIpcResult } = require('../../shared/ipc-result');
const { commitProfileEdit } = require('../../ui/ui-profile-commands');

async function main() {
  const profile = { id: 'a', name: 'A', note: 'Draft' };
  const original = structuredClone(profile);
  const code = 'PROFILE_STALE_REV';
  const stale = [{ id: 'a', baseRev: 1, rev: 2 }];
  const failure = await captureIpcResult(() => { throw Object.assign(new Error('conflict'), { code, stale, password: 'private' }); });
  assert.equal(JSON.stringify(failure).includes('private'), false, 'only documented error fields cross IPC');
  assert.throws(() => unwrapIpcResult(structuredClone(failure)), (error) => error.code === code && error.stale[0].rev === 2);
  assert.deepEqual(unwrapIpcResult(await captureIpcResult(() => ['ok'])), ['ok']);
  assert.equal(unwrapIpcResult('legacy'), 'legacy', 'old successful transports remain compatible');

  // Exercise the real sandboxed preload transport. A returned object crosses
  // contextBridge as data; errors are reconstructed by the renderer module.
  let ops;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../preload.js'), 'utf8'), {
    require(name) {
      assert.equal(name, 'electron');
      return {
        contextBridge: { exposeInMainWorld(_name, api) { ops = api; } },
        ipcRenderer: { invoke: async () => structuredClone(failure) },
      };
    },
  });
  let commits = 0; let requests = 0;
  await assert.rejects(commitProfileEdit({
    profile, baseRev: 1,
    applyCommands: (commands) => { requests += 1; return ops.applyProfileCommands(commands); },
    commit: () => { commits += 1; },
  }), (error) => error.code === code);
  assert.equal(commits, 0, 'conflicts leave local state unchanged');
  assert.equal(requests, 1, 'a conflict never retries the old draft');
  await assert.rejects(commitProfileEdit({ profile, baseRev: 1, applyCommands: async () => { throw new Error('disk failed'); }, commit: () => { commits += 1; } }), /disk failed/);
  assert.equal(commits, 0, 'transport and persistence failures leave local state unchanged');

  let complete;
  const pending = new Promise((resolve) => { complete = resolve; });
  let sent;
  const saving = commitProfileEdit({
    profile, baseRev: 1,
    applyCommands: (commands) => { sent = commands; return pending; },
    commit: (accepted, rows) => { commits += 1; assert.equal(accepted, profile); assert.equal(rows[0].rev, 2); },
  });
  assert.equal(commits, 0, 'no local publication while the engine is pending');
  assert.equal(sent[0].profile.credentialsAction, 'replace');
  assert.deepEqual(profile, original, 'the action marker never mutates UI data');
  complete(await captureIpcResult(() => [{ id: 'a', rev: 2 }]));
  await saving;
  assert.equal(commits, 1);
  console.log('PROFILE_COMMAND_CLIENT_SELFTEST OK (preload round trip, error fields, conflict, failure, commit ordering)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
