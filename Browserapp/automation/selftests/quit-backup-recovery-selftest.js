'use strict';

const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { Script } = require('node:vm');
const { BrowserEngine } = require('../../engine');
const { encodeLocalStore } = require('../../rebuild/local-store');
const { startupConfig } = require('../../rebuild/local-api');
const { encryptCredential } = require('../../credential-crypto');
const cloudOps = require('../cloud-ops');
const cloudSync = require('../cloud-sync');
const { saveRestoreState } = require('../cloud/restore-state');

const filename = path.join(__dirname, '../../main.js');
const source = readFileSync(filename, 'utf8');
const first = source.indexOf('function beginQuitCleanup()');
const last = source.indexOf('// A renderer or helper', first);
assert.ok(first >= 0 && last > first);
const quit = new Script(source.slice(first, last) + '\nbeginQuitCleanup', { filename });
const oldName = 'Known-good profile';
const oldGroups = [{ id: 'local', name: 'Known-good group' }];
const nextName = 'Current fixture profile';
const nextGroups = [{ id: 'local', name: 'Current fixture group' }];
const pending = { version: 1, phase: 'pending', profiles: [], records: [], groups: oldGroups, proxies: null };
const passphrase = 'Synthetic test archive passphrase';

async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'ob-quit-backup-recovery-')));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  const exits = [], warnings = [], events = [];
  const app = { getPath: () => root, exit: code => exits.push(code) };
  const engine = new BrowserEngine(app);
  let currentEngine = engine;
  t.after(async () => {
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    engine.sqliteStore?.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(engine.getProfileDataRoot(), { recursive: true });
  await engine.init(null);
  const writeProfile = name => engine.commitProfiles([{ id: 'fixture', name, groupId: 'local', advanced: { cloudBackup: true } }]);
  await writeProfile(oldName);
  const dir = path.join(root, 'backups'), journal = path.join(root, 'cloud-restore-pending.obstate');
  const cloud = { enabled: true, autoSyncOnQuit: true, provider: 'local', passphrase, includeBrowserData: false, local: { dir } };
  let settings = { uiGroups: oldGroups, cloud };
  let saves = 0, flushes = 0, backupBuilds = 0;
  const build = cloudSync.buildBackupPackage;
  const save = async value => { settings = value; saves++; };
  cloudOps.initCloudOps({
    getEngine: () => currentEngine, getSettings: () => settings,
    getQuitBackupSettings: () => structuredClone({ generation: 1, cloud: settings.cloud, uiGroups: settings.uiGroups }),
    saveSettings: save, emit: event => events.push(event),
  });
  const { result } = await cloudOps.runCloudBackup();
  const previous = await fs.readFile(result.path);
  const files = (await fs.readdir(dir)).sort();
  const previousPack = await cloudSync.parseBackupPackage(previous, passphrase);
  assert.equal(previousPack.profiles[0].name, oldName);
  assert.deepEqual(previousPack.groups, oldGroups);
  await writeProfile(nextName);
  settings = { ...settings, uiGroups: nextGroups };
  const startingSaves = saves;
  events.length = 0;
  const instrumentBuild = (run = options => build(options)) => {
    cloudSync.buildBackupPackage = options => { backupBuilds++; return run(options); };
    t.after(() => { cloudSync.buildBackupPackage = build; });
  };
  const runQuit = ({ flushError, initComplete = true, afterDrain } = {}) => quit.runInNewContext({
    app, engine: currentEngine, engineInitComplete: initComplete, automation: null, localUiService: null, localUiSync: null, liveSync: null,
    fatalFailure: false, quitting: false, quitCleanupPromise: null, quitCleanupSettled: false,
    console: { warn: (...args) => warnings.push(args.join(' ')) },
    destroyTray() {}, stopShortcutBridge() {}, cloudOps,
    settingsStore: { getLocalSettings: () => settings, saveLocalSettings: save,
      async flushSettingsWriter() { flushes++; if (flushError) throw Error('synthetic failed settings flush'); } },
    async drainBrowsersForQuit() { await afterDrain?.(); return { stopped: true, remaining: [], errors: [] }; },
    lifecycleTimeout: promise => promise,
  })();
  return {
    root, journal, engine, instrumentBuild, runQuit, writeProfile,
    pendingBytes: () => Buffer.from(encryptCredential(JSON.stringify(pending))),
    loseEngine() { currentEngine = undefined; },
    get backupBuilds() { return backupBuilds; },
    async assertPreserved() {
      assert.deepEqual(exits, [0]);
      assert.equal(flushes, 1);
      const current = await fs.readFile(result.path);
      assert.ok(current.equals(previous), 'known-good canonical pack must not be replaced');
      assert.deepEqual(await cloudSync.parseBackupPackage(current, passphrase), previousPack);
      assert.deepEqual((await fs.readdir(dir)).sort(), files, 'no replacement, extra timestamp pack or rotation');
      assert.equal(saves, startingSaves, 'a recovery skip cannot rewrite settings');
      assert.deepEqual(events, [], 'no backup success event');
    },
    async assertUpdated(expectedName = nextName) {
      assert.deepEqual(exits, [0]);
      assert.equal(flushes, 1);
      assert.equal(saves, startingSaves + 1);
      assert.equal(events.at(-1)?.action, 'backup');
      const current = await cloudSync.parseBackupPackage(await fs.readFile(result.path), passphrase);
      assert.deepEqual(current.groups, nextGroups);
      assert.equal(current.profiles[0].name, expectedName);
    },
    warnings,
  };
}

test('recovery evidence blocks quit backup before construction and leaves a readable prior pack', async t => {
  for (const issue of ['pending', 'backup-only', 'stage-only', 'malformed', 'EIO', 'no-engine']) {
    await t.test(issue, async t => {
      const f = await fixture(t);
      const suffix = issue === 'backup-only' ? '.bak' : issue === 'stage-only' ? '.bak.tmp-681-0123456789abcdef' : '';
      const file = f.journal + suffix;
      const expected = issue === 'malformed' ? Buffer.from('invalid fixture journal') : f.pendingBytes();
      if (issue === 'pending') await saveRestoreState(f.engine, pending);
      else if (issue === 'no-engine') f.loseEngine();
      else if (issue !== 'EIO') await fs.writeFile(file, expected);
      const prior = issue === 'EIO' || issue === 'no-engine' ? null : await fs.readFile(file);
      const readdir = fs.readdir;
      if (issue === 'EIO') fs.readdir = async (directory, ...args) => {
        if (directory === f.root) throw Object.assign(new Error('private test path detail'), { code: 'EIO' });
        return readdir(directory, ...args);
      };
      f.instrumentBuild();
      try { await f.runQuit(); }
      finally { fs.readdir = readdir; }
      await f.assertPreserved();
      assert.equal(f.backupBuilds, 0);
      assert.doesNotMatch(f.warnings.join(' '), /private test path detail|ob-quit-backup-recovery-/);
      if (prior) assert.deepEqual(await fs.readFile(file), prior);
    });
  }
});

test('authority is sampled inside the backup queue and again after package construction', async t => {
  await t.test('marker while queued', async t => {
    const f = await fixture(t);
    const entered = Promise.withResolvers(), unblock = Promise.withResolvers();
    const build = cloudSync.buildBackupPackage;
    let firstBuild = true;
    f.instrumentBuild(async options => {
      if (firstBuild) { firstBuild = false; entered.resolve(); await unblock.promise; }
      return build(options);
    });
    const previous = cloudOps.createBackupPackage();
    await entered.promise;
    const shuttingDown = f.runQuit();
    await fs.writeFile(f.journal + '.bak', f.pendingBytes(), { flag: 'wx' });
    unblock.resolve();
    await previous;
    await shuttingDown;
    await f.assertPreserved();
    assert.equal(f.backupBuilds, 1, 'only the earlier queued package was constructed');
  });
  for (const change of ['late-backup', 'engine-changed', 'profile-state-changed', 'directory-replaced']) {
    await t.test(change, async t => {
      const f = await fixture(t);
      const build = cloudSync.buildBackupPackage;
      const bytes = f.pendingBytes();
      f.instrumentBuild(async options => {
        const built = await build(options);
        if (change === 'late-backup') await fs.writeFile(f.journal + '.bak', bytes, { flag: 'wx' });
        else if (change === 'engine-changed') f.loseEngine();
        else if (change === 'profile-state-changed') await f.writeProfile('Only after the earlier backup snapshot');
        else {
          const active = f.engine.getProfileDataRoot();
          await fs.rename(active, active + '-previous');
          await fs.mkdir(active);
        }
        return built;
      });
      await f.runQuit();
      assert.equal(f.backupBuilds, 1);
      await f.assertPreserved();
      if (change === 'late-backup') assert.deepEqual(await fs.readFile(f.journal + '.bak'), bytes);
    });
  }
});

test('ordinary quit still completes healthy backup regardless of optional Local API settings', async t => {
  for (const kind of ['disabled', 'bad-config']) {
    await t.test(kind, async t => {
      const f = await fixture(t);
      const localApi = { open: false, apiAllowLan: false, port: kind === 'disabled' ? 50325 : 'invalid fixture' };
      await fs.writeFile(path.join(f.root, 'rebuild-local.json'), encodeLocalStore({ version: 1, settings: { localApi } }));
      if (kind === 'disabled') assert.deepEqual(await startupConfig(f.root), localApi);
      else await assert.rejects(startupConfig(f.root), /配置损坏/);
      f.instrumentBuild();
      await f.runQuit();
      assert.equal(f.backupBuilds, 1);
      await f.assertUpdated();
    });
  }
  await t.test('failed normal settings flush is still a veto', async t => {
    const f = await fixture(t);
    f.instrumentBuild();
    await f.runQuit({ flushError: true });
    assert.equal(f.backupBuilds, 0);
    await f.assertPreserved();
  });
  await t.test('an engine object alone does not certify that its store initialized', async t => {
    const f = await fixture(t);
    f.instrumentBuild();
    await f.runQuit({ initComplete: false });
    assert.equal(f.backupBuilds, 0);
    await f.assertPreserved();
  });
  await t.test('an accepted close-time edit before drain completes is included', async t => {
    const f = await fixture(t);
    const accepted = 'Accepted close-time fixture edit';
    f.instrumentBuild();
    await f.runQuit({ afterDrain: () => f.writeProfile(accepted) });
    assert.equal(f.backupBuilds, 1);
    await f.assertUpdated(accepted);
  });
});
