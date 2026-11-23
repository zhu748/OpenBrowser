'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const fsp = require('node:fs/promises');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const syntheticCloud = { passphrase: 'synthetic-cloud-passphrase', github: { token: 'synthetic-cloud-token' } };

function loadModule(relative, overrides) {
  const filename = path.resolve(__dirname, relative);
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  runInNewContext('(function(require, module) {\n' + readFileSync(filename, 'utf8') + '\n})',
    { structuredClone, console }, { filename })(name => overrides[name] || localRequire(name), module);
  return module.exports;
}

async function fixture(t) {
  const scratch = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-client-settings-ipc-'));
  t.after(() => fsp.rm(scratch, { recursive: true, force: true }));
  const file = path.join(scratch, 'settings.json');
  const profileRoot = path.join(scratch, 'profile-root');
  const crypto = require('../../credential-crypto');
  const key = { mode: 'fallback', passphrase: 'synthetic isolated client settings test key' };
  const decrypt = value => crypto.decryptCredential(value, key);
  const storageFs = Object.create(fsp);
  const openSettings = async () => {
    const store = loadModule('../local-settings.js', {
      'fs/promises': storageFs,
      '../credential-crypto': { ...crypto, decryptCredential: decrypt, encryptCredential: value => crypto.encryptCredential(value, key) },
    });
    store.initLocalSettings({ file, defaultProfileDataRoot: profileRoot });
    await store.loadLocalSettings();
    return store;
  };
  const settings = await openSettings();
  await settings.saveLocalSettings({ memoryLimit: 62, diskLimit: 38, cloud: syntheticCloud, uiGroups: [{ id: 'synthetic-group' }] });
  await settings.saveLocalSettings({ memoryLimit: 61, diskLimit: 37 });

  const handlers = new Map();
  let quitting = false, trayDestructions = 0;
  loadModule('../../main/system-ipc.js', { '../automation/local-settings': settings }).registerSystemIpc({
    registerTrustedIpc: (channel, handler) => handlers.set(channel, handler),
    isQuitting: () => quitting, destroyTray: () => trayDestructions++,
    getEngine: () => ({ getProfileDataRoot: () => profileRoot, running: new Map() }),
    getAutomation: () => undefined, defaultProfileDataRoot: profileRoot,
  });
  const bridge = {};
  const preload = path.resolve(__dirname, '../../preload.js');
  runInNewContext(readFileSync(preload, 'utf8'), { require: name => {
    assert.equal(name, 'electron');
    return {
      contextBridge: { exposeInMainWorld: (name, value) => { bridge[name] = value; } },
      ipcRenderer: { invoke: async (name, ...args) => structuredClone(await handlers.get(name)({}, ...structuredClone(args))) },
    };
  } }, { filename: preload });
  return {
    ops: bridge.ops, settings, file, profileRoot, storageFs, stop: () => { quitting = true; },
    trayDestructions: () => trayDestructions,
    read: async () => JSON.parse(decrypt(await fsp.readFile(file))),
    reopen: async () => (await openSettings()).getLocalSettings(),
    bytes: () => Promise.all([fsp.readFile(file), fsp.readFile(file + '.bak')]),
  };
}

function holdCloseWrite(fixture, phase) {
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  let held = false;
  const pause = async () => {
    if (held) return;
    held = true;
    entered.resolve();
    await release.promise;
  };
  if (phase === 'stage') fixture.storageFs.open = async (file, ...args) => {
    const handle = await fsp.open(file, ...args);
    if (file.startsWith(fixture.file + '.tmp-close-')) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => { await pause(); await sync(); };
    }
    return handle;
  };
  else fixture.storageFs.rename = async (from, to) => {
    if (from.startsWith(fixture.file + '.tmp-close-') && to === fixture.file) await pause();
    return fsp.rename(from, to);
  };
  return { entered: entered.promise, resume() { release.resolve(); delete fixture.storageFs.open; delete fixture.storageFs.rename; } };
}

test('untouched classic numeric input, malformed values and a mixed patch cannot change durable settings', async t => {
  const { ops, settings, read, bytes } = await fixture(t);
  const before = await bytes();
  const nativeWarn = console.warn, messages = [];
  console.warn = (...args) => messages.push(args.join(' '));
  try {
    for (const input of [
      { memoryLimit: '', diskLimit: '' },
      { memoryLimit: null, diskLimit: true },
      { memoryLimit: '   ', diskLimit: '0' },
      { memoryLimit: 72, diskLimit: 'synthetic invalid value', 'synthetic unknown key': true },
      { memoryLimit: '0x10' }, { diskLimit: [] }, { diskLimit: Infinity },
      { memoryLimit: 70, defaultPreferences: { googleLogin: 'true' } },
      { closeAction: 'synthetic invalid action' }, ['not an object patch'],
      { 'synthetic unknown only': 'ignored' },
    ]) {
      await assert.rejects(ops.saveClientSettings(input), error => error.code === 'CLIENT_SETTINGS_INVALID'
        && !error.message.includes('synthetic'));
    }
  } finally { console.warn = nativeWarn; }
  await settings.flushSettingsWriter();
  const state = await read();
  assert.deepEqual([state.memoryLimit, state.diskLimit], [61, 37]);
  assert.deepEqual([settings.getLocalSettings().memoryLimit, settings.getLocalSettings().diskLimit], [61, 37]);
  assert.deepEqual(await bytes(), before);
  assert.ok(messages.every(message => !message.includes('synthetic')));
});

test('ordinary settings expose only their typed fields while cloud and storage stay dedicated', async t => {
  const { ops, profileRoot, read, trayDestructions, stop, settings } = await fixture(t);
  const expected = {
    memoryLimit: 61, diskLimit: 37, closeAction: 'ask',
    defaultPreferences: { openWorkbench: true, ipChangeRemind: true, googleLogin: false },
  };
  assert.deepEqual(await ops.getClientSettings(), expected);
  const saved = await ops.saveClientSettings({
    memoryLimit: ' 6.9e1 ', diskLimit: '0', closeAction: 'exit', defaultPreferences: { openWorkbench: false },
    cloud: { passphrase: 'ordinary patch must not write this' }, profileDataRoot: '/not-used-by-this-fixture',
  });
  const desired = { ...expected, memoryLimit: 69, diskLimit: 0, closeAction: 'exit',
    defaultPreferences: { ...expected.defaultPreferences, openWorkbench: false } };
  assert.deepEqual(saved, desired);
  assert.deepEqual(await ops.getClientSettings(), desired);
  assert.equal(trayDestructions(), 1);
  assert.deepEqual(await ops.saveClientSettings({ diskLimit: 0 }), desired);
  assert.deepEqual(await ops.cloudGetConfig(), syntheticCloud);
  await ops.cloudSetConfig({ passphrase: 'synthetic explicit cloud edit' });
  assert.equal((await ops.cloudGetConfig()).passphrase, 'synthetic explicit cloud edit');
  assert.equal((await ops.getProfileStorage()).profileRoot, profileRoot);
  assert.deepEqual(await ops.getClientSettings(), desired);
  const onDisk = await read();
  assert.deepEqual([onDisk.memoryLimit, onDisk.diskLimit, onDisk.profileDataRoot], [69, 0, profileRoot]);
  assert.equal(onDisk.uiGroups[0].id, 'synthetic-group');
  assert.equal(onDisk.cloud.passphrase, 'synthetic explicit cloud edit');

  stop();
  await assert.rejects(ops.saveClientSettings({ memoryLimit: '75' }), { code: 'APP_SHUTTING_DOWN' });
  await settings.flushSettingsWriter();
  assert.equal((await read()).memoryLimit, 69);
});

test('accepted settings failure reports no commit, hides the storage path and remains normally retryable', async t => {
  const { file, bytes, ops, storageFs, read, settings } = await fixture(t);
  const before = await bytes();
  const warn = console.warn;
  storageFs.rename = async (from, to) => {
    if (to === file) throw Object.assign(new Error('synthetic ENOSPC at ' + file), { code: 'ENOSPC' });
    return fsp.rename(from, to);
  };
  console.warn = () => {}; // only the IPC boundary owns the error shown to the renderer
  try {
    await assert.rejects(ops.saveClientSettings({ memoryLimit: 73 }), error => error.code === 'ENOSPC'
      && !error.message.includes(file) && !error.message.includes('synthetic'));
    assert.deepEqual(await bytes(), before);
  } finally { storageFs.rename = fsp.rename; console.warn = warn; }
  await settings.flushSettingsWriter();
  const recovered = await read();
  assert.deepEqual([recovered.memoryLimit, recovered.diskLimit], [73, 37]);
});

test('rejected close-bearing patches cannot reach primary, backup, live settings, root commits, or quit retries', async t => {
  for (const mixed of [false, true]) {
    await t.test(mixed ? 'valid mixed patch' : 'dedicated close action', async t => {
      const f = await fixture(t);
      await f.ops.setCloseAction('tray');
      const before = await f.bytes();
      let closeAttempts = 0;
      f.storageFs.rename = async (from, to) => {
        if (from.startsWith(f.file + '.tmp-close-') && to === f.file) {
          closeAttempts++;
          throw Object.assign(new Error('private synthetic path'), { code: 'ENOSPC' });
        }
        return fsp.rename(from, to);
      };
      const rejected = mixed ? f.ops.saveClientSettings({ closeAction: 'exit', memoryLimit: 72 }) : f.ops.setCloseAction('exit');
      await assert.rejects(rejected, error => error.code === 'ENOSPC' && !error.message.includes('private'));
      assert.deepEqual(await f.bytes(), before);
      assert.deepEqual([f.settings.getLocalSettings().closeAction, f.settings.getLocalSettings().memoryLimit], ['tray', 61]);
      assert.equal(f.trayDestructions(), 0);
      const stale = { ...f.settings.getLocalSettings(), closeAction: 'exit', diskLimit: 13 };
      await f.settings.saveLocalSettings(stale);
      const root = path.join(path.dirname(f.file), 'another-root');
      await fsp.mkdir(root, { recursive: true });
      await f.settings.commitProfileDataRoot(root);
      f.stop();
      await f.settings.flushSettingsWriter();
      const final = await f.read();
      assert.deepEqual([final.profileDataRoot, final.closeAction, final.memoryLimit, final.diskLimit], [root, 'tray', 61, 13]);
      const reopened = await f.reopen();
      assert.deepEqual([reopened.profileDataRoot, reopened.closeAction, reopened.memoryLimit, reopened.diskLimit], [root, 'tray', 61, 13]);
      assert.equal(closeAttempts, 1);
      assert.equal(f.trayDestructions(), 0);
      assert.equal((await fsp.readdir(path.dirname(f.file))).filter(name => name.startsWith(path.basename(f.file) + '.tmp-close-')).length, 0);
    });
  }
});

test('a newer close intent or shutdown before rename cancels the entire staged patch', async t => {
  for (const replacement of ['explicit-same-tray', 'quit', 'ordinary-field']) {
    await t.test(replacement, async t => {
      const f = await fixture(t);
      await f.ops.setCloseAction('tray');
      const before = await f.bytes();
      const hold = holdCloseWrite(f, 'stage');
      const pending = f.ops.saveClientSettings({ closeAction: 'exit', memoryLimit: 72 });
      const outcome = pending.catch(error => error);
      let next;
      try {
        await hold.entered;
        assert.deepEqual([f.settings.getLocalSettings().closeAction, f.settings.getLocalSettings().memoryLimit], ['tray', 61]);
        if (replacement === 'quit') f.stop();
        else if (replacement === 'ordinary-field') next = f.ops.saveClientSettings({ memoryLimit: 61 }); // same current value is a newer choice
        else next = f.ops.setCloseAction('tray');
      } finally { hold.resume(); }
      assert.equal((await outcome).code, replacement === 'quit' ? 'APP_SHUTTING_DOWN' : 'CLOSE_SETTINGS_SUPERSEDED');
      await next;
      await f.settings.flushSettingsWriter();
      assert.deepEqual(await f.bytes(), before);
      assert.equal(f.trayDestructions(), 0);
    });
  }
});

test('an already-dispatched close returns the exact durable snapshot and never performs a stale tray effect', async t => {
  const f = await fixture(t);
  await f.ops.setCloseAction('tray');
  const hold = holdCloseWrite(f, 'rename');
  const first = f.ops.saveClientSettings({ closeAction: 'exit', memoryLimit: 72, defaultPreferences: { openWorkbench: false } });
  let second, ordinary;
  try {
    await hold.entered;
    assert.equal((await f.read()).closeAction, 'tray');
    second = f.ops.setCloseAction('tray');
    ordinary = f.ops.saveClientSettings({ memoryLimit: 74, defaultPreferences: { ipChangeRemind: false } });
  } finally { hold.resume(); }
  const committed = await first;
  assert.deepEqual([committed.closeAction, committed.memoryLimit, committed.defaultPreferences.openWorkbench], ['exit', 72, false]);
  assert.deepEqual(await second, { success: true, closeAction: 'tray' });
  await ordinary;
  await f.settings.flushSettingsWriter();
  const final = await f.read();
  assert.deepEqual([final.closeAction, final.memoryLimit, final.defaultPreferences], ['tray', 74,
    { openWorkbench: false, ipChangeRemind: false, googleLogin: false }]);
  assert.equal(f.trayDestructions(), 0);
});

test('a current exit affects the tray once; a same-value explicit exit, ordinary edits and invalid input do not repeat it', async t => {
  const f = await fixture(t);
  await f.ops.setCloseAction('tray');
  const held = holdCloseWrite(f, 'rename');
  const first = f.ops.setCloseAction('exit');
  let same;
  try {
    await held.entered;
    same = f.ops.setCloseAction('exit');
  } finally { held.resume(); }
  assert.equal((await first).closeAction, 'exit');
  assert.equal((await same).closeAction, 'exit');
  assert.equal(f.trayDestructions(), 1);
  const before = await f.bytes();
  await f.ops.setCloseAction('exit');
  await assert.rejects(f.ops.setCloseAction(null), { code: 'CLIENT_SETTINGS_INVALID' });
  assert.deepEqual(await f.bytes(), before);
  await f.ops.saveClientSettings({ diskLimit: 0 });
  assert.equal((await f.read()).closeAction, 'exit');
  assert.equal((await f.reopen()).closeAction, 'exit');
  assert.equal((await f.read()).diskLimit, 0);
  assert.equal(f.trayDestructions(), 1);
});

test('quit drains an already-dispatched close but refuses new admissions and suppresses the tray effect', async t => {
  const f = await fixture(t);
  await f.ops.setCloseAction('tray');
  const hold = holdCloseWrite(f, 'rename');
  const saving = f.ops.setCloseAction('exit');
  let flushing;
  try {
    await hold.entered;
    f.stop();
    await assert.rejects(f.ops.setCloseAction('ask'), { code: 'APP_SHUTTING_DOWN' });
    await assert.rejects(f.ops.saveClientSettings({ memoryLimit: 72, closeAction: 'tray' }), { code: 'APP_SHUTTING_DOWN' });
    flushing = f.settings.flushSettingsWriter();
  } finally { hold.resume(); }
  assert.deepEqual(await saving, { success: true, closeAction: 'exit' });
  await flushing;
  assert.equal((await f.read()).closeAction, 'exit');
  assert.equal((await f.read()).memoryLimit, 61);
  assert.equal(f.trayDestructions(), 0);
});

test('a successfully dispatched close survives a failed backup refresh without replacing the previous backup', async t => {
  const f = await fixture(t);
  await f.ops.setCloseAction('tray');
  const before = await f.bytes();
  f.storageFs.rename = async (from, to) => {
    if (to === f.file + '.bak') throw Object.assign(new Error('private fixture backup destination'), { code: 'EIO' });
    return fsp.rename(from, to);
  };
  assert.deepEqual(await f.ops.setCloseAction('exit'), { success: true, closeAction: 'exit' });
  assert.deepEqual((await f.bytes())[1], before[1]);
  assert.equal((await f.read()).closeAction, 'exit');
  assert.equal(f.trayDestructions(), 1);
});

test('a mixed choice matching durable numerics can supersede an earlier unsaved ordinary change', async t => {
  const f = await fixture(t);
  await f.ops.setCloseAction('tray');
  const earlier = f.ops.saveClientSettings({ memoryLimit: 77 });
  const mixed = f.ops.saveClientSettings({ closeAction: 'tray', memoryLimit: 61 });
  await Promise.all([earlier, mixed]);
  await f.settings.flushSettingsWriter();
  assert.equal((await f.read()).memoryLimit, 61);
  assert.equal((await f.read()).closeAction, 'tray');
  assert.equal(f.trayDestructions(), 0);
});
