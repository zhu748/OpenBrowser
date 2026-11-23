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
  const settings = loadModule('../local-settings.js', {
    'fs/promises': storageFs,
    '../credential-crypto': { ...crypto, decryptCredential: decrypt, encryptCredential: value => crypto.encryptCredential(value, key) },
  });
  settings.initLocalSettings({ file, defaultProfileDataRoot: profileRoot });
  await settings.loadLocalSettings();
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
    bytes: () => Promise.all([fsp.readFile(file), fsp.readFile(file + '.bak')]),
  };
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
