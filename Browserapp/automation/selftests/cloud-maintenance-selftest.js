'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { BrowserEngine } = require('../../engine');
const { acquireProfileMaintenance } = require('../../engine/profile-maintenance');
const { prepareFileRestore } = require('../cloud/file-restore');
const { initCloudOps, applyBackupBody } = require('../cloud-ops');
const b64 = (value) => Buffer.from(value).toString('base64');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-cloud-maintenance-'));
  const engine = new BrowserEngine({ getPath: () => root });
  engine.persist = async () => {};
  let settings = { uiGroups: [{ id: 'local-group', name: 'Local' }] };
  let fail = false;
  let entered;
  let release;
  const proxyStore = { list: () => [{ id: 'local-proxy' }], async replaceAll() {
    entered?.();
    if (release) await new Promise((resolve) => { release.resolve = resolve; });
    if (fail) throw new Error('injected proxy write failure');
  } };
  initCloudOps({ getEngine: () => engine, getAutomation: () => ({ proxyStore }), getSettings: () => settings,
    saveSettings: async (value) => { settings = value; } });
  try {
    await engine.syncProfiles([{ id: 'env-1', name: 'Local', cookies: 'local-secret' }, { id: 'local-only', name: 'Keep' }]);
    const profileRoot = engine.profileRoot('env-1');
    const file = path.join(profileRoot, 'Default/Network/Cookies');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, 'original');
    const body = { profiles: [{ id: 'env-1', name: 'Remote', cookies: '', _dataFiles: { 'Network/Cookies': b64('remote'), 'new-file': b64('new') } }], proxies: [{ id: 'remote-proxy' }] };
    fail = true;
    await assert.rejects(applyBackupBody(body, { mode: 'overwrite' }), (error) => error.restorePhase === 'proxies');
    assert.equal(await fs.readFile(file, 'utf8'), 'original', 'metadata failure rolls back overwritten browser files');
    await assert.rejects(fs.stat(path.join(profileRoot, 'Default/new-file')), { code: 'ENOENT' });
    assert.equal(engine.profileMaintenance.size, 0);
    assert.ok((await fs.readdir(profileRoot)).every((name) => !name.startsWith('.openbrowser-restore-')));
    fail = false;
    const started = new Promise((resolve) => { entered = resolve; });
    release = {};
    const restoring = applyBackupBody(body, { mode: 'overwrite', localProfiles: [{ id: 'stale-ui' }] });
    await started;
    await assert.rejects(engine.start(engine.profiles.get('env-1')), { code: 'PROFILE_MAINTENANCE' });
    await assert.rejects(engine.deleteProfiles(['env-1']), { code: 'PROFILE_MAINTENANCE' });
    await assert.rejects(engine.trashProfiles(['env-1']), { code: 'PROFILE_MAINTENANCE' });
    await assert.rejects(engine.clearProfileCacheAndCookies('env-1'), { code: 'PROFILE_MAINTENANCE' });
    await assert.rejects(engine.syncProfiles([{ id: 'env-1', name: 'racing edit' }]), { code: 'PROFILE_MAINTENANCE' });
    assert.throws(() => engine.setProfileDataRoot(path.join(root, 'other')), /Stop all/);
    assert.throws(() => acquireProfileMaintenance(engine, ['free-id', 'env-1']), { code: 'PROFILE_MAINTENANCE' });
    assert.equal(engine.profileMaintenance.has('free-id'), false, 'failed batch reservation does not take partial locks');
    engine.profiles.set('local-only', { ...engine.profiles.get('local-only'), name: 'Concurrent edit' });
    release.resolve();
    const result = await restoring;
    assert.deepEqual(result.profiles.map((p) => p.id), ['env-1', 'local-only']);
    assert.equal(engine.profiles.has('local-only'), true);
    assert.equal(engine.profiles.get('local-only').name, 'Concurrent edit', 'restore must not re-publish stale local-only snapshots');
    assert.equal(engine.profiles.has('stale-ui'), false, 'authoritative engine rows beat stale renderer snapshots');
    assert.equal(engine.profiles.get('env-1').cookies, '', 'explicit remote clears do not revive local secrets');
    assert.equal(await fs.readFile(file, 'utf8'), 'remote');
    assert.equal(result.proxies.length, 2, 'local-only proxy remains available to local-only environments');
    assert.equal(settings.uiGroups[0].id, 'local-group');
    assert.equal(engine.profileMaintenance.size, 0);

    const lease = acquireProfileMaintenance(engine, ['env-1']);
    lease.release(); lease.release();
    const newer = acquireProfileMaintenance(engine, ['env-1']);
    lease.release();
    assert.equal(engine.profileMaintenance.get('env-1'), newer.token);
    newer.release();

    // Validation of a later profile must not touch an earlier profile's files.
    await assert.rejects(prepareFileRestore([{ root: profileRoot, files: { 'Network/Cookies': b64('bad') } },
      { root: path.join(root, 'other'), files: { '../outside': b64('invalid') } }]), /路径/);
    assert.equal(await fs.readFile(file, 'utf8'), 'remote');
    const tx = await prepareFileRestore([{ root: profileRoot, files: { 'Network/Cookies': b64('partial'), 'second': b64('next') } }]);
    const rename = fs.rename;
    fs.rename = async (from, to) => {
      if (to === path.join(profileRoot, 'Default/second') && from.endsWith('.new')) throw new Error('injected rename failure');
      return rename(from, to);
    };
    try { await assert.rejects(tx.commit(), /rename failure/); await tx.rollback(); }
    finally { fs.rename = rename; }
    assert.equal(await fs.readFile(file, 'utf8'), 'remote', 'mid-commit failure restores earlier files');
    const recoverable = await prepareFileRestore([{ root: profileRoot, files: { 'Network/Cookies': b64('committed') } }]);
    await recoverable.commit();
    fs.rename = async (from, to) => {
      if (from.endsWith('.previous')) throw new Error('injected rollback failure');
      return rename(from, to);
    };
    try {
      await assert.rejects(recoverable.rollback(), (error) => {
        assert.equal(error.recoveryDirectories.length, 1);
        return /未能回滚/.test(error.message);
      });
      const dirs = (await fs.readdir(profileRoot)).filter((name) => name.startsWith('.openbrowser-restore-'));
      assert.equal(dirs.length, 1);
      const manifest = JSON.parse(await fs.readFile(path.join(profileRoot, dirs[0], 'manifest.json'), 'utf8'));
      assert.equal(manifest[0].target.replace(/\\/g, '/'), 'Default/Network/Cookies');
      assert.equal(await fs.readFile(path.join(profileRoot, dirs[0], manifest[0].backup), 'utf8'), 'remote');
    } finally { fs.rename = rename; }
    await recoverable.rollback();
    assert.equal(await fs.readFile(file, 'utf8'), 'remote');
    fail = true; release = null; entered = null;
    fs.rename = async (from, to) => {
      if (from.endsWith('.previous')) throw new Error('rollback denied');
      return rename(from, to);
    };
    try {
      await assert.rejects(applyBackupBody(body, { mode: 'overwrite' }), (error) => {
        assert.equal(error.restorePhase, 'proxies');
        assert.equal(error.recoveryDirectories.length, 1);
        return true;
      });
      assert.equal(engine.profileMaintenance.has('env-1'), true, 'failed rollback retains the guard until recovery');
      await assert.rejects(engine.start(engine.profiles.get('env-1')), { code: 'PROFILE_MAINTENANCE' });
    } finally { fs.rename = rename; }
    console.log('CLOUD_MAINTENANCE_SELFTEST OK (real engine races, batch leases, staged rollback, authoritative merge, secret clears)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
