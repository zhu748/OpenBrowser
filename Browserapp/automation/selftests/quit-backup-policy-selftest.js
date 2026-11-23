'use strict';

const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const { Script, runInNewContext } = require('node:vm');
const { BrowserEngine } = require('../../engine');
const { decryptCredentialJson } = require('../../credential-crypto');
const cloudOps = require('../cloud-ops');
const cloudSync = require('../cloud-sync');
const { readRestoreState } = require('../cloud/restore-state');

const filename = path.join(__dirname, '../../main.js');
const source = readFileSync(filename, 'utf8');
const first = source.indexOf('function beginQuitCleanup()');
const last = source.indexOf('// A renderer or helper', first);
assert.ok(first >= 0 && last > first);
const quit = new Script(source.slice(first, last) + '\nbeginQuitCleanup', { filename });

function loadIsolated(file, overrides = {}) {
  const instance = { exports: {} };
  const req = createRequire(file);
  runInNewContext(readFileSync(file, 'utf8'), {
    module: instance, require: name => Object.hasOwn(overrides, name) ? overrides[name] : req(name),
    structuredClone, Buffer, console,
  }, { filename: file });
  return instance.exports;
}

const profile = { id: 'local', name: 'Previously backed up', groupId: 'base', advanced: { cloudBackup: true } };
const newName = 'Durably updated in local store';
const oldGroups = [{ id: 'base', name: 'Original group name' }];
const newGroup = { id: 'from-restore', name: 'Restored group name' };
const passphrase = 'Synthetic quit policy package phrase';
const settingsModule = require.resolve('../local-settings');
const systemIpcModule = require.resolve('../../main/system-ipc');

async function fixture(t, { initializeSettings = true } = {}) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'ob-quit-backup-policy-')));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  const exits = [], warnings = [], events = [];
  const app = { getPath: () => root, exit: code => exits.push(code) };
  const engine = new BrowserEngine(app);
  t.after(async () => {
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    engine.sqliteStore?.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(engine.getProfileDataRoot(), { recursive: true });
  await engine.init(null);
  await engine.commitProfiles([profile]);
  const settingsFile = path.join(root, 'openbrowser-local-settings.json');
  const openSettings = () => {
    const store = loadIsolated(settingsModule);
    store.initLocalSettings({ file: settingsFile, defaultProfileDataRoot: engine.getProfileDataRoot() });
    return store;
  };
  const settings = openSettings();
  await settings.loadLocalSettings();
  const dir = path.join(root, 'previous'), nextDir = path.join(root, 'selected');
  const cloud = { enabled: true, autoSyncOnQuit: true, provider: 'local', passphrase, includeBrowserData: false, local: { dir } };
  cloudOps.initCloudOps({
    getEngine: () => engine, getSettings: settings.getLocalSettings, getQuitBackupSettings: settings.getQuitBackupSettings,
    saveSettings: settings.saveLocalSettings, emit: value => events.push(value),
  });
  const handlers = new Map();
  loadIsolated(systemIpcModule, { '../automation/local-settings': settings }).registerSystemIpc({
    registerTrustedIpc: (channel, handle) => handlers.set(channel, handle), isQuitting: () => false,
  });
  const call = (channel, payload) => handlers.get(channel)({}, payload);
  let previous, archive, pack, structure;
  if (initializeSettings) {
    await settings.saveLocalSettings({ cloud, uiGroups: oldGroups });
    ({ result: { path: archive } } = await cloudOps.runCloudBackup());
    previous = await fs.readFile(archive);
    pack = await cloudSync.parseBackupPackage(previous, passphrase);
    structure = (await fs.readdir(dir)).sort();
    assert.equal(pack.profiles[0].name, profile.name);
    events.length = 0;
  }
  await engine.commitProfiles([{ ...profile, name: newName }]);
  const runQuit = (beforeFlush) => quit.runInNewContext({
    app, engine, engineInitComplete: true, automation: null, localUiService: null, localUiSync: null, liveSync: null,
    fatalFailure: false, quitting: false, quitCleanupPromise: null, quitCleanupSettled: false,
    console: { warn: (...args) => warnings.push(args.join(' ')) }, destroyTray() {}, stopShortcutBridge() {},
    cloudOps, settingsStore: settings, lifecycleTimeout: promise => promise,
    async drainBrowsersForQuit() { await beforeFlush?.(); return { stopped: true, remaining: [], errors: [] }; },
  })();
  return {
    root, dir, nextDir, cloud, settings, settingsFile, archive, exits, warnings, events, call, engine, runQuit,
    async readPack(usedDir = dir) {
      return cloudSync.parseBackupPackage(await fs.readFile(path.join(usedDir, cloudSync.REMOTE_NAME)), passphrase);
    },
    async assertPrevious() {
      const current = await fs.readFile(archive);
      assert.ok(current.equals(previous), 'must preserve the exact previous backup bytes');
      assert.deepEqual(await cloudSync.parseBackupPackage(current, passphrase), pack);
      assert.deepEqual((await fs.readdir(dir)).sort(), structure, 'must not replace, rotate or leave stages');
    },
    assertNoDestination: () => assert.rejects(fs.lstat(nextDir), { code: 'ENOENT' }),
    async disk() { return decryptCredentialJson(await fs.readFile(settingsFile)); },
    readFromRestart: () => openSettings().loadLocalSettings(),
  };
}

function observeQueue(t) {
  const queued = Promise.withResolvers();
  const original = cloudOps.runQuitCloudBackup;
  t.mock.method(cloudOps, 'runQuitCloudBackup', (...args) => {
    queued.resolve();
    return original(...args);
  });
  return queued.promise;
}

function holdNextBuild(t) {
  const atBuild = Promise.withResolvers(), resume = Promise.withResolvers();
  const original = cloudSync.buildBackupPackage;
  let count = 0;
  t.mock.method(cloudSync, 'buildBackupPackage', async options => {
    if (++count === 1) { atBuild.resolve(options); await resume.promise; }
    return original(options);
  });
  return { atBuild: atBuild.promise, release: resume.resolve };
}

test('opt-out already committed during quit drain protects the prior pack without recording a failure', async t => {
  const f = await fixture(t);
  const draining = Promise.withResolvers(), resume = Promise.withResolvers();
  const stopped = f.runQuit(() => { draining.resolve(); return resume.promise; });
  let settingsBytes;
  try {
    await draining.promise;
    const saved = await f.call('cloud:set-config', { autoSyncOnQuit: false, local: { dir: f.nextDir } });
    assert.equal(saved.autoSyncOnQuit, false);
    settingsBytes = await fs.readFile(f.settingsFile);
  } finally { resume.resolve(); }
  await stopped;
  await f.assertPrevious();
  await f.assertNoDestination();
  assert.deepEqual(await fs.readFile(f.settingsFile), settingsBytes);
  assert.equal((await f.readFromRestart()).cloud.autoSyncOnQuit, false);
  assert.deepEqual(f.events, []);
  assert.deepEqual(f.exits, [0]);
});

test('changes committed before the queue runs use the new authorized location', async t => {
  const f = await fixture(t);
  const build = holdNextBuild(t);
  const predecessor = cloudOps.createBackupPackage();
  const queued = observeQueue(t);
  let stopped;
  try {
    await build.atBuild;
    stopped = f.runQuit();
    await queued;
    await f.call('cloud:set-config', { local: { dir: f.nextDir } });
  } finally { build.release(); }
  await predecessor;
  await stopped;
  await f.assertPrevious();
  assert.equal((await f.readPack(f.nextDir)).profiles[0].name, newName);
  assert.equal((await f.readFromRestart()).cloud.local.dir, f.nextDir);
  assert.equal(f.events.at(-1)?.action, 'backup');
  assert.deepEqual(f.exits, [0]);
});

test('the same queue captures groups and profiles after an earlier actual restore commits', async t => {
  const f = await fixture(t);
  const journal = path.join(f.root, 'cloud-restore-pending.obstate');
  const gate = Promise.withResolvers(), resume = Promise.withResolvers();
  const link = fs.link;
  t.mock.method(fs, 'link', async (from, to) => {
    if (to === journal) { gate.resolve(); await resume.promise; }
    return link(from, to);
  });
  const queued = observeQueue(t);
  const incoming = { ...profile, id: 'imported', name: 'Imported while quitting', groupId: newGroup.id };
  const restoring = cloudOps.applyBackupBody({ profiles: [incoming], groups: [newGroup] });
  let stopped;
  try {
    await gate.promise;
    stopped = f.runQuit();
    await queued;
  } finally { resume.resolve(); }
  await restoring;
  await stopped;
  assert.equal(await readRestoreState(f.engine), null);
  const savedGroups = (await f.disk()).uiGroups;
  assert.deepEqual(savedGroups, [...oldGroups, newGroup]);
  const pack = await f.readPack();
  assert.ok(pack.profiles.some(row => row.id === incoming.id && row.groupId === newGroup.id));
  assert.deepEqual(pack.groups, savedGroups);
  assert.deepEqual(f.exits, [0]);
});

test('late relevant settings changes protect the old package and do not switch targets', async t => {
  for (const kind of ['opt-out', 'destination', 'ABA', 'group']) await t.test(kind, async t => {
    const f = await fixture(t);
    const build = holdNextBuild(t);
    const stopped = f.runQuit();
    let expectedBytes;
    try {
      assert.deepEqual((await build.atBuild).groups, oldGroups);
      if (kind === 'opt-out') await f.call('cloud:set-config', { autoSyncOnQuit: false });
      if (kind === 'destination') await f.call('cloud:set-config', { local: { dir: f.nextDir } });
      if (kind === 'ABA') {
        await f.call('cloud:set-config', { autoSyncOnQuit: false });
        assert.equal((await f.disk()).cloud.autoSyncOnQuit, false);
        await f.call('cloud:set-config', { autoSyncOnQuit: true });
      }
      if (kind === 'group') await f.settings.saveLocalSettings({ uiGroups: [newGroup] });
      expectedBytes = await fs.readFile(f.settingsFile);
    } finally { build.release(); }
    await stopped;
    await f.assertPrevious();
    await f.assertNoDestination();
    assert.deepEqual(await fs.readFile(f.settingsFile), expectedBytes);
    assert.deepEqual(f.events, []);
    assert.deepEqual(f.exits, [0]);
  });
});

test('the local writer already dispatched is not cancelled by a new policy; its outcome cannot overwrite it', async t => {
  for (const outcome of ['ENOSPC', 'committed']) await t.test(outcome, async t => {
    const f = await fixture(t);
    const stage = Promise.withResolvers(), allow = Promise.withResolvers();
    const realRename = fs.rename;
    t.mock.method(fs, 'rename', async (from, to) => {
      if (to === f.archive) {
        stage.resolve();
        await allow.promise;
        if (outcome === 'ENOSPC') throw Object.assign(new Error('private synthetic target path detail'), { code: outcome });
      }
      return realRename(from, to);
    });
    const stopped = f.runQuit();
    let expected;
    try {
      await stage.promise;
      await f.call('cloud:set-config', { autoSyncOnQuit: false, local: { dir: f.nextDir } });
      expected = await fs.readFile(f.settingsFile);
    } finally { allow.resolve(); }
    await stopped;
    await f.assertNoDestination();
    if (outcome === 'ENOSPC') {
      await f.assertPrevious();
      assert.ok(f.warnings.some(line => /auto-backup failed/.test(line)));
      assert.doesNotMatch(f.warnings.join(' '), /private synthetic target path detail/);
    } else assert.equal((await f.readPack()).profiles[0].name, newName, 'an already dispatched local writer really did commit');
    assert.deepEqual(await fs.readFile(f.settingsFile), expected);
    const restarted = await f.readFromRestart();
    assert.equal(restarted.cloud.autoSyncOnQuit, false);
    assert.equal(restarted.cloud.local.dir, f.nextDir);
    assert.deepEqual(f.events, []);
    assert.deepEqual(f.exits, [0]);
  });
});

test('ordinary preference and close commits do not revoke unchanged backup authority', async t => {
  const f = await fixture(t);
  const build = holdNextBuild(t);
  const stopped = f.runQuit();
  try {
    await build.atBuild;
    await f.settings.saveLocalSettings({ memoryLimit: 62, diskLimit: 37 }, { clientIntent: true });
    await f.settings.commitCloseSettings({ closeAction: 'tray' });
  } finally { build.release(); }
  await stopped;
  assert.equal((await f.readPack()).profiles[0].name, newName);
  const reopened = await f.readFromRestart();
  assert.equal(reopened.memoryLimit, 62);
  assert.equal(reopened.diskLimit, 37);
  assert.equal(reopened.closeAction, 'tray');
  assert.equal(f.events.at(-1)?.action, 'backup');
  assert.deepEqual(f.exits, [0]);
});

test('with only an optimistic late destination edit, no provider may replace the prior pack', async t => {
  const f = await fixture(t);
  const build = holdNextBuild(t);
  const stage = Promise.withResolvers(), resume = Promise.withResolvers();
  const realRename = fs.rename;
  t.mock.method(fs, 'rename', async (from, to) => {
    if (to === f.settingsFile) { stage.resolve(); await resume.promise; }
    return realRename(from, to);
  });
  const stopped = f.runQuit();
  let saving;
  try {
    await build.atBuild;
    saving = f.call('cloud:set-config', { local: { dir: f.nextDir } });
    await stage.promise;
    assert.equal(f.settings.getLocalSettings().cloud.local.dir, f.nextDir);
    assert.equal((await f.disk()).cloud.local.dir, f.dir);
    build.release();
    await stopped;
    await f.assertPrevious();
    await f.assertNoDestination();
    assert.deepEqual(f.events, []);
  } finally { build.release(); resume.resolve(); }
  await saving;
  assert.equal((await f.readFromRestart()).cloud.local.dir, f.nextDir);
  assert.deepEqual(f.exits, [0]);
});

test('a fresh workspace and an invalid automatic policy do not build or rotate a backup', async t => {
  for (const kind of ['fresh', 'unknown-provider', 'nonboolean-opt-in']) await t.test(kind, async t => {
    const f = await fixture(t, { initializeSettings: kind !== 'fresh' });
    if (kind === 'unknown-provider') await f.call('cloud:set-config', { provider: 'unrecognized-fixture' });
    if (kind === 'nonboolean-opt-in') await f.call('cloud:set-config', { autoSyncOnQuit: 'true' });
    const build = t.mock.method(cloudSync, 'buildBackupPackage', async () => { throw new Error('Unexpected package construction'); });
    await f.runQuit();
    assert.equal(build.mock.callCount(), 0);
    if (kind === 'fresh') {
      await assert.rejects(fs.lstat(f.settingsFile), { code: 'ENOENT' });
      await assert.rejects(fs.lstat(f.dir), { code: 'ENOENT' });
    } else await f.assertPrevious();
    assert.deepEqual(f.events, []);
    assert.deepEqual(f.exits, [0]);
  });
});

test('manual local backup still uses explicitly supplied settings and groups when auto backup is disabled', async t => {
  const f = await fixture(t);
  await f.call('cloud:set-config', { autoSyncOnQuit: false });
  await f.call('cloud:backup', { cloud: { local: { dir: f.nextDir } }, groups: [newGroup] });
  await f.assertPrevious();
  assert.deepEqual((await f.readPack(f.nextDir)).groups, [newGroup]);
  assert.equal((await f.readFromRestart()).cloud.local.dir, f.dir);
  assert.equal((await f.readFromRestart()).cloud.autoSyncOnQuit, false);
});
