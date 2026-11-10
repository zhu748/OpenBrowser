'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { mergeProfiles, mergeProfileState } = require('../cloud/merge');
const { collectProfileDataFiles } = require('../cloud/profile-data');
const { initCloudOps, applyBackupBody } = require('../cloud-ops');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-cloud-restore-'));
  const local = { id: 'env-1', name: 'local', updatedAt: '2026-02-01' };
  const remote = { id: 'env-1', name: 'remote', updatedAt: '2026-01-01', _dataFiles: { 'Network/Cookies': Buffer.from('remote').toString('base64') } };
  const cookieFile = path.join(root, 'env-1/Default/Network/Cookies');
  const engine = { profiles: new Map([[local.id, local]]), getProfileDataRoot: () => root,
    running: new Map(), starting: new Map(), stopping: new Map(), async syncProfiles() {} };
  let settings = {};
  let writes = 0;
  const proxyStore = { list: () => [], async replaceAll() {} };
  initCloudOps({ getEngine: () => engine, getAutomation: () => ({ proxyStore }),
    getSettings: () => settings, saveSettings: async (next) => { settings = next; writes += 1; } });
  try {
    await fs.mkdir(path.dirname(cookieFile), { recursive: true });
    for (const mode of ['local-wins', 'merge']) {
      await fs.writeFile(cookieFile, 'local');
      const result = await applyBackupBody({ profiles: [remote] }, { mode });
      assert.equal(result.restoredFiles, 0);
      assert.equal(result.profiles[0].name, 'local');
      assert.equal(await fs.readFile(cookieFile, 'utf8'), 'local', `${mode} must keep local browser data`);
    }
    for (const mode of ['overwrite', 'remote-wins', 'merge']) {
      const result = await applyBackupBody({ profiles: [{ ...remote, updatedAt: '2026-03-01' }] }, { mode });
      assert.equal(result.restoredFiles, 1);
      assert.equal(await fs.readFile(cookieFile, 'utf8'), 'remote');
    }
    const state = mergeProfileState([local], [remote], 'merge');
    assert.equal(state.remoteProfileIds.size, 0);
    assert.deepEqual(Object.keys(mergeProfiles([local], [remote])).sort(), ['profiles', 'stats']);
    const noTimestamp = mergeProfileState([{ id: 'env-1' }], [{ id: 'env-1', proxy: 'http://host:80' }]);
    assert.ok(noTimestamp.remoteProfileIds.has('env-1'), 'merged remote fields also select remote files');

    await fs.writeFile(cookieFile, 'local');
    const before = writes;
    await assert.rejects(applyBackupBody({ profiles: [remote, remote] }), /重复环境/);
    assert.equal(writes, before, 'invalid full input fails before settings writes');
    for (const field of ['running', 'starting', 'stopping']) {
      engine[field].set('env-1', {});
      await assert.rejects(applyBackupBody({ profiles: [remote] }, { mode: 'overwrite' }), /先停止环境/);
      engine[field].clear();
    }
    assert.equal(await fs.readFile(cookieFile, 'utf8'), 'local');
    proxyStore.replaceAll = async () => { throw new Error('proxy persistence failed'); };
    await assert.rejects(applyBackupBody({ profiles: [], proxies: [{ id: 'proxy-1' }] }), /proxy persistence failed/);

    const profile = { advanced: { cloudBackup: true } };
    const profileRoot = path.join(root, 'env-1');
    assert.deepEqual(await collectProfileDataFiles(profileRoot, profile, { maxTotalBytes: 0 }), {});
    const files = await collectProfileDataFiles(profileRoot, profile, { maxTotalBytes: 5 });
    assert.equal(Buffer.from(files['Network/Cookies'], 'base64').toString(), 'local');
    assert.deepEqual(await collectProfileDataFiles(profileRoot, profile, { maxTotalBytes: 4 }), {});
    await fs.writeFile(path.join(path.dirname(cookieFile), 'Cookies-journal'), 'journal');
    assert.equal(Object.keys(await collectProfileDataFiles(profileRoot, profile, { maxFiles: 1 })).length, 1);
    // Simulate a file growing after the metadata check; the actual read is bounded.
    const lstat = fs.lstat;
    fs.lstat = async (file, ...args) => {
      const stat = await lstat(file, ...args);
      if (file === cookieFile) stat.size = 0;
      return stat;
    };
    try { assert.deepEqual(await collectProfileDataFiles(profileRoot, profile, { maxTotalBytes: 4 }), {}); }
    finally { fs.lstat = lstat; }
    console.log('CLOUD_RESTORE_SELFTEST OK (provenance, preflight, failure reporting, bounded file reads)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
