'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { BrowserEngine } = require('../../engine');
const { registerSystemIpc } = require('../../main/system-ipc');
const { encryptCredential, decryptCredential } = require('../../credential-crypto');
const cloudOps = require('../cloud-ops');
const cloudSync = require('../cloud-sync');
const { readRestoreState, saveRestoreState } = require('../cloud/restore-state');

const journalName = 'cloud-restore-pending.obstate';
const stageName = `${journalName}.tmp-643-1234567890abcdef`;
const backupStageName = `${journalName}.bak.tmp-643-1234567890abcdef`;
const groups = [{ id: 'local-group', name: 'Local group' }];
const incoming = [{ id: 'cloud-group', name: 'Cloud group' }];
const pending = { version: 1, phase: 'pending', records: [], profiles: [], groups, proxies: null };

async function fixture(t, { proxyStore } = {}) {
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  t.after(() => {
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
  });
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'ob-cloud-journal-authority-')));
  const app = { getPath: () => root };
  let engine = new BrowserEngine(app);
  t.after(async () => { engine.sqliteStore?.close(); await fs.rm(root, { recursive: true, force: true }); });
  await engine.init(null);
  await engine.syncProfiles([{ id: 'local', name: 'Original local profile' }]);

  const journal = path.join(root, journalName);
  const settingsFile = path.join(root, 'preferences.enc');
  let settingsWrites = 0;
  let settings = { uiGroups: groups };
  const writeSettings = value => fs.writeFile(settingsFile, encryptCredential(JSON.stringify(value)));
  await writeSettings(settings);
  cloudOps.initCloudOps({
    getEngine: () => engine,
    getAutomation: () => ({ proxyStore }),
    getSettings: () => settings,
    async saveSettings(value) { await writeSettings(value); settings = value; settingsWrites++; },
  });

  const pack = path.join(root, 'incoming.obpack');
  const { buffer } = await cloudSync.buildBackupPackage({
    profiles: [{ id: 'cloud', name: 'Incoming profile' }], profileIds: ['cloud'], groups: incoming, includeBrowserData: false,
    proxies: proxyStore ? [{ id: 'cloud-proxy', raw: 'http://127.0.0.1:8080' }] : [],
  });
  await fs.writeFile(pack, buffer);
  const handlers = new Map();
  registerSystemIpc({
    registerTrustedIpc: (channel, handler) => handlers.set(channel, handler),
    dialog: { showOpenDialog: async () => ({ canceled: false, filePaths: [pack] }) },
    isQuitting: () => false,
  });
  const original = await fs.readFile(settingsFile);
  return {
    root, get engine() { return engine; }, journal,
    async restartEngine() {
      engine.sqliteStore.close();
      engine = new BrowserEngine(app);
      await engine.init(null);
    },
    restore: () => handlers.get('cloud:import-file')({}, { mode: 'merge' }),
    storeState: state => saveRestoreState(engine, state),
    recover: () => cloudOps.recoverPendingRestore({ proxyStore }),
    async assertUnchanged({ retainedLease = false } = {}) {
      assert.deepEqual(await fs.readFile(settingsFile), original);
      assert.equal(settingsWrites, 0);
      assert.equal(engine.profiles.has('cloud'), false);
      assert.equal(engine.sqliteStore.hasProfile('cloud'), false);
      assert.equal(engine.profiles.get('local').name, 'Original local profile');
      assert.equal(engine.profileMaintenance.size, retainedLease ? 1 : 0);
    },
    readGroups: async () => JSON.parse(decryptCredential(await fs.readFile(settingsFile))).uiGroups,
  };
}

function blocked(error) {
  assert.equal(error.code, 'CLOUD_RECOVERY_REQUIRED');
  assert.doesNotMatch(error.message, /ob-cloud-journal-authority-|private fixture/);
  return true;
}

async function rejectBoth(f) {
  await assert.rejects(f.recover(), blocked);
  await assert.rejects(f.restore(), blocked);
  await f.assertUnchanged();
}

test('an authenticated backup-only journal is not absence or permission to recover from an older phase', async t => {
  const f = await fixture(t);
  await f.storeState(pending);
  await f.storeState({ ...pending, phase: 'committed' });
  const backup = f.journal + '.bak';
  const bytes = await fs.readFile(backup);
  assert.equal(JSON.parse(decryptCredential(bytes)).phase, 'pending');
  await fs.unlink(f.journal);

  await rejectBoth(f);
  assert.deepEqual(await fs.readFile(backup), bytes);
  await assert.rejects(fs.lstat(f.journal), { code: 'ENOENT' });
});

test('known primary and backup stages preserve their bytes; unrelated names do not block clean import', async t => {
  for (const name of [stageName, backupStageName, stageName.toUpperCase()]) {
    await t.test(name, async t => {
      const f = await fixture(t);
      const file = path.join(f.root, name);
      const bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
      await fs.writeFile(file, bytes);
      await rejectBoth(f);
      assert.deepEqual(await fs.readFile(file), bytes);
      await assert.rejects(fs.lstat(f.journal), { code: 'ENOENT' });
    });
  }
  await t.test('unrelated filename and healthy absence', async t => {
    const f = await fixture(t);
    const unrelated = f.journal + '.tmp-user-notes';
    await fs.writeFile(unrelated, 'unrelated fixture');
    const unused = path.join(f.root, 'new', 'workspace');
    assert.equal(await readRestoreState({ app: { getPath: () => unused } }), null);
    await assert.rejects(fs.lstat(path.dirname(unused)), { code: 'ENOENT' });
    assert.equal(await f.recover(), false);
    const result = await f.restore();
    assert.equal(result.success, true);
    assert.equal(f.engine.sqliteStore.hasProfile('cloud'), true);
    assert.deepEqual(await f.readGroups(), [...groups, ...incoming]);
    assert.equal(await fs.readFile(unrelated, 'utf8'), 'unrelated fixture');
    assert.equal(await f.recover(), false);
    assert.equal(await readRestoreState(f.engine), null);
  });
});

test('current journal ambiguity and scoped I/O faults fail closed without changing filesystem evidence', async t => {
  for (const fault of ['primary-with-stage', 'invalid-phase', 'primary-read-EIO', 'directory-EIO', 'directory-ENOENT']) {
    await t.test(fault, async t => {
      const f = await fixture(t);
      const hasPrimary = !fault.startsWith('directory-');
      if (hasPrimary) await f.storeState(fault === 'invalid-phase' ? { ...pending, phase: 'unknown' } : pending);
      const knownStage = path.join(f.root, stageName);
      if (fault === 'primary-with-stage') await fs.writeFile(knownStage, 'partially written test stage');
      const bytes = hasPrimary ? await fs.readFile(f.journal) : null;
      const originalRead = fs.readFile, originalList = fs.readdir;
      const fail = code => Object.assign(new Error('private fixture path'), { code });
      if (fault === 'primary-read-EIO') fs.readFile = async (file, ...args) => {
        if (file === f.journal) throw fail('EIO');
        return originalRead(file, ...args);
      };
      if (fault.startsWith('directory-')) fs.readdir = async (file, ...args) => {
        if (file === f.root) throw fail(fault.split('-')[1]);
        return originalList(file, ...args);
      };
      try { await rejectBoth(f); }
      finally { fs.readFile = originalRead; fs.readdir = originalList; }
      if (hasPrimary) assert.deepEqual(await fs.readFile(f.journal), bytes);
      else await assert.rejects(fs.lstat(f.journal), { code: 'ENOENT' });
      if (fault === 'primary-with-stage') assert.equal(await fs.readFile(knownStage, 'utf8'), 'partially written test stage');
    });
  }
  await t.test('the primary is a redirected path', async t => {
    const f = await fixture(t);
    const target = path.join(f.root, 'unrelated-fixture');
    const bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
    await fs.writeFile(target, bytes);
    try { await fs.symlink(target, f.journal, 'file'); }
    catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) return t.skip('file symlinks require host privileges');
      throw error;
    }
    await rejectBoth(f);
    assert.equal((await fs.lstat(f.journal)).isSymbolicLink(), true);
    assert.deepEqual(await fs.readFile(target), bytes);
  });
});

test('restore rechecks global evidence after profile/proxy preflight without compensating an unstarted transaction', async t => {
  for (const name of [journalName + '.bak', backupStageName]) {
    await t.test(name, async t => {
      let marker, bytes, proxyReleases = 0, proxyWrites = 0;
      const f = await fixture(t, {
        proxyStore: {
          async acquireMaintenance() {
            await fs.writeFile(marker, bytes);
            return { token: Symbol(), release() { proxyReleases++; } };
          },
          list: () => [],
          async replaceAll() { proxyWrites++; },
        },
      });
      marker = path.join(f.root, name);
      bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
      assert.equal(await f.recover(), false);
      await assert.rejects(f.restore(), blocked);
      assert.equal(proxyReleases, 1);
      assert.equal(proxyWrites, 0);
      assert.deepEqual(await fs.readFile(marker), bytes);
      await f.assertUnchanged();
      await assert.rejects(fs.lstat(f.journal), { code: 'ENOENT' });
    });
  }
});

test('valid primary recovery, including cleanup retry, retains its authenticated decision until backup is removed', async t => {
  const f = await fixture(t);
  await f.storeState(pending);
  await f.storeState({ ...pending, phase: 'committed' });
  const backup = f.journal + '.bak';
  const committed = await fs.readFile(f.journal);
  const past = await fs.readFile(backup);
  const remove = fs.rm;
  fs.rm = async (file, ...args) => {
    if (file === backup) throw Object.assign(new Error('private fixture refusal'), { code: 'EIO' });
    return remove(file, ...args);
  };
  try { await assert.rejects(f.recover(), blocked); }
  finally { fs.rm = remove; }
  assert.deepEqual(await fs.readFile(f.journal), committed);
  assert.deepEqual(await fs.readFile(backup), past);
  await f.assertUnchanged();
  assert.equal(await f.recover(), true);
  await assert.rejects(fs.lstat(backup), { code: 'ENOENT' });
  assert.equal(await f.recover(), false);
  assert.equal(await readRestoreState(f.engine), null);
});

test('the first journal writer preserves a backup arriving after both preflight reads', async t => {
  for (const fail of [false, true]) {
    await t.test(fail ? 'first write reports EIO' : 'first write could otherwise proceed', async t => {
      const f = await fixture(t);
      const backup = f.journal + '.bak';
      const bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
      const open = fs.open;
      let inserted = false;
      fs.open = async (file, ...args) => {
        if (!inserted && file.startsWith(f.journal + '.tmp-')) {
          inserted = true;
          await fs.writeFile(backup, bytes, { flag: 'wx' });
          if (fail) throw Object.assign(new Error('private fixture fault'), { code: 'EIO' });
        }
        return open(file, ...args);
      };
      try { await assert.rejects(f.restore(), blocked); }
      finally { fs.open = open; }
      assert.equal(inserted, true);
      await f.assertUnchanged();
      assert.deepEqual(await fs.readFile(backup), bytes);
      await assert.rejects(fs.lstat(f.journal), { code: 'ENOENT' });
      assert.ok(!(await fs.readdir(f.root)).some(name => name.startsWith(journalName + '.tmp-')));
    });
  }
});

test('atomic canonical claim never replaces an incumbent or leaves an owned stage after a refused link', async t => {
  for (const fault of ['incumbent', 'post-link-backup', 'EPERM', 'ENOTSUP']) {
    await t.test(fault, async t => {
      const f = await fixture(t);
      const backup = f.journal + '.bak';
      const bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
      const link = fs.link;
      let intercepted = false;
      fs.link = async (source, target) => {
        if (target !== f.journal) return link(source, target);
        intercepted = true;
        if (fault === 'incumbent') await fs.writeFile(target, bytes, { flag: 'wx' });
        if (fault === 'EPERM' || fault === 'ENOTSUP') throw Object.assign(new Error('private fixture fault'), { code: fault });
        await link(source, target);
        if (fault === 'post-link-backup') await fs.writeFile(backup, bytes, { flag: 'wx' });
      };
      try { await assert.rejects(f.restore(), blocked); }
      finally { fs.link = link; }
      assert.equal(intercepted, true);
      await f.assertUnchanged();
      assert.ok(!(await fs.readdir(f.root)).some(name => name.startsWith(journalName + '.tmp-')));
      if (fault === 'incumbent') assert.deepEqual(await fs.readFile(f.journal), bytes);
      else await assert.rejects(fs.lstat(f.journal), { code: 'ENOENT' });
      if (fault === 'post-link-backup') {
        assert.deepEqual(await fs.readFile(backup), bytes);
        await assert.rejects(f.recover(), blocked);
      } else await assert.rejects(fs.lstat(backup), { code: 'ENOENT' });
      if (fault === 'EPERM' || fault === 'ENOTSUP') assert.equal((await f.restore()).success, true);
    });
  }
});

test('a foreign backup after our durable claim is not adopted during rollback or during the next startup', async t => {
  const f = await fixture(t);
  const backup = f.journal + '.bak';
  const bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
  const open = fs.open;
  let stages = 0, claimed;
  fs.open = async (file, ...args) => {
    if (file.startsWith(f.journal + '.tmp-') && ++stages === 2) {
      claimed = await fs.readFile(f.journal);
      await fs.writeFile(backup, bytes, { flag: 'wx' });
    }
    return open(file, ...args);
  };
  try { await assert.rejects(f.restore(), blocked); }
  finally { fs.open = open; }
  assert.equal(JSON.parse(decryptCredential(claimed)).phase, 'prepare');
  await f.assertUnchanged({ retainedLease: true });
  await f.restartEngine();
  await rejectBoth(f);
  assert.deepEqual(await fs.readFile(f.journal), claimed);
  assert.deepEqual(await fs.readFile(backup), bytes);
  assert.ok(!(await fs.readdir(f.root)).some(name => name.startsWith(journalName + '.tmp-')));
});

test('backup replacement while the pending phase publishes still blocks live mutation', async t => {
  const f = await fixture(t);
  const backup = f.journal + '.bak';
  const foreign = path.join(f.root, 'foreign-fixture');
  const bytes = Buffer.from(encryptCredential(JSON.stringify(pending)));
  await fs.writeFile(foreign, bytes);
  const rename = fs.rename;
  fs.rename = async (source, target) => {
    if (target === f.journal) await rename(foreign, backup);
    return rename(source, target);
  };
  try { await assert.rejects(f.restore(), blocked); }
  finally { fs.rename = rename; }
  assert.equal(JSON.parse(decryptCredential(await fs.readFile(f.journal))).phase, 'pending');
  assert.deepEqual(await fs.readFile(backup), bytes);
  await f.assertUnchanged({ retainedLease: true });
  await f.restartEngine();
  await rejectBoth(f);
  assert.deepEqual(await fs.readFile(backup), bytes);
});

test('an owned durable primary and its owned backup are recoverable after process exit', async t => {
  const f = await fixture(t);
  const script = `
const { claimRestoreState } = require(process.argv[1]);
const engine = { app: { getPath: () => process.argv[2] } };
const state = JSON.parse(process.argv[3]);
(async () => {
  const owner = await claimRestoreState(engine, state);
  await owner.save({ ...state, phase: 'committed' });
  process.exit(71);
})().catch(error => { console.error(error); process.exit(1); });`;
  const child = spawnSync(process.execPath, ['-e', script, require.resolve('../cloud/restore-state'), f.root, JSON.stringify(pending)],
    { env: process.env, encoding: 'utf8', timeout: 10_000 });
  assert.equal(child.status, 71, child.stderr || child.error?.message);
  await f.restartEngine();
  const primary = await readRestoreState(f.engine);
  assert.equal(primary.phase, 'committed');
  assert.match(primary.claimId, /^[0-9a-f]{32}$/);
  assert.equal(await f.recover(), true);
  await f.assertUnchanged();
  assert.equal(await f.recover(), false);
  await assert.rejects(fs.lstat(f.journal + '.bak'), { code: 'ENOENT' });
});
