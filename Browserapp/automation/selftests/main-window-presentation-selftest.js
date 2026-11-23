'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { parse } = require('acorn');
const { createWindowCloseHandler } = require('../../main/window-close');

const filename = path.resolve(__dirname, '../../main.js');
const source = readFileSync(filename, 'utf8');
const declarations = parse(source, { ecmaVersion: 'latest', sourceType: 'commonjs' }).body;
function mainFunction(name, context) {
  const declaration = declarations.find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert.ok(declaration);
  return runInNewContext(source.slice(declaration.start, declaration.end) + '\n' + name, context, { filename });
}

function fixture({ settingsStore, loadSettingsForStartup = () => Promise.resolve(), ask = async () => ({ mode: 'tray', remember: true }) } = {}) {
  const loading = Promise.withResolvers();
  const calls = { ask: 0, hide: 0, close: 0 };
  let window;
  class BrowserWindow extends EventEmitter {
    constructor() {
      super();
      window = this;
      this.webContents = {};
      this.visible = false;
      this.destroyed = false;
      this.shows = 0;
      this.focuses = 0;
    }
    isDestroyed() { return this.destroyed; }
    isVisible() { assert.equal(this.destroyed, false); return this.visible; }
    show() { assert.equal(this.destroyed, false); this.visible = true; this.shows++; }
    focus() { assert.equal(this.destroyed, false); this.focuses++; }
    isMinimized() { return false; }
    hide() { this.visible = false; }
    requestClose() {
      let prevented = false;
      const pending = this.listeners('close')[0]({ preventDefault: () => { prevented = true; } });
      if (!prevented) { calls.close++; this.destroyed = true; }
      return { pending, prevented };
    }
    close() { this.requestClose(); }
    setMenu() {}
    loadURL() { return loading.promise; }
  }
  const context = {
    BrowserWindow, mainWindow: null, windows: new Set(), path, __dirname: path.dirname(filename),
    quitting: false, app: { getVersion: () => 'fixture' }, roxyPreview: true,
    windowIconPath() {}, windowBackground() {},
    settingsStore, loadSettingsForStartup,
    askCloseAction: () => { calls.ask++; return ask(); },
    hideMainWindowToTray: win => { calls.hide++; win.hide(); },
    createWindowCloseHandler: (win, options) => createWindowCloseHandler(win, { ...options, platform: 'linux' }),
    attachShellNavigationGuard() {}, createShellNavigationPolicy() {},
    rebuildProtocol: { DOCUMENT: 'local-workbench-fixture' },
  };
  const createWindow = mainFunction('createWindow', context);
  const creation = createWindow();
  return { window, loading, creation, calls, startQuit() { context.quitting = true; } };
}

function startupSettings(closeAction) {
  const started = Promise.withResolvers();
  const read = Promise.withResolvers();
  const file = path.resolve('synthetic/settings.json');
  const saved = { version: 2, profileDataRoot: path.resolve('synthetic/existing'), memoryLimit: 62, uiGroups: [{ id: 'retained' }], closeAction };
  const files = new Map([[file, Buffer.from(JSON.stringify(saved))]]);
  let first = true;
  const storePath = path.resolve(__dirname, '../local-settings.js');
  const storeRequire = createRequire(storePath);
  const overrides = {
    'fs/promises': {
      readFile(name) {
        if (!first) return Promise.resolve(files.get(name));
        first = false;
        started.resolve();
        return read.promise;
      },
      async mkdir() {},
      async writeFile(name, value) { files.set(name, Buffer.from(value)); },
      async rename(from, to) { files.set(to, files.get(from)); files.delete(from); },
    },
    // The fixture exercises store/close sequencing, not storage encoding.
    '../credential-crypto': { isEncrypted: () => true, decryptCredential: raw => raw.toString(), encryptCredential: text => text },
    './cloud-sync': { defaultCloudConfig: () => ({}) },
    './isolation': { validateDataRootIsolationSecure: root => ({ ok: true, root }) },
  };
  const module = { exports: {} };
  runInNewContext('(function(require, module) {\n' + readFileSync(storePath, 'utf8') + '\n})',
    { structuredClone, console }, { filename: storePath })(name => overrides[name] || storeRequire(name), module);
  const settingsStore = module.exports;
  settingsStore.initLocalSettings({ file, defaultProfileDataRoot: path.resolve('synthetic/default') });
  const load = settingsStore.loadLocalSettings();
  load.catch(() => {});
  return {
    settingsStore, loadSettingsForStartup: () => load, started: started.promise, load,
    finish: () => read.resolve(files.get(file)), fail: () => read.reject(new Error('synthetic read failure')),
    saved, persisted: () => JSON.parse(files.get(file).toString()),
  };
}

function hostStartupFixture() {
  const settings = Promise.withResolvers();
  const document = Promise.withResolvers();
  const documentStarted = Promise.withResolvers();
  const engineStarted = Promise.withResolvers();
  const engine = Promise.withResolvers();
  const calls = { exits: [], dialogs: [], rejected: [], ready: 0, watcher: 0 };
  const context = {
    app: { whenReady: async () => {}, setName() {}, exit: code => calls.exits.push(code) },
    process: { platform: 'linux', argv: [] },
    quitting: false, startupFailed: false, roxyPreview: false,
    session: { defaultSession: { webRequest: { onBeforeRequest() {} }, setPermissionRequestHandler() {}, setPermissionCheckHandler() {} } },
    registerTrustedIpc() {}, loadSettingsForStartup: () => settings.promise,
    createWindow() { documentStarted.resolve(); return document.promise; },
    async ensureDataRootIsolationSecure() { return { ok: true }; },
    runEngineFixture() { engineStarted.resolve(); return engine.promise; },
    resolveStartupReady() { calls.ready++; }, rejectStartupReady: error => calls.rejected.push(error),
    dialog: { showErrorBox: (_title, message) => calls.dialogs.push(message) },
    console: { error() {} }, handleProfileLaunch() {},
    appUpdate: { startAppUpdateWatcher() { calls.watcher++; } },
  };
  // Run the actual readiness callback and error handler, replacing only the
  // unrelated engine/domain setup with an inert readiness promise.
  const startup = declarations.find(node => source.startsWith('app.whenReady().then(', node.start));
  assert.ok(startup, 'main must register its initial readiness callback');
  const body = source.slice(startup.start, startup.end);
  const begin = body.indexOf('  engine = new BrowserEngine(');
  const end = body.indexOf('  await windowPromise;');
  assert.ok(begin > 0 && end > begin);
  if (declarations.some(node => node.id?.name === 'reportStartupFailure'))
    context.reportStartupFailure = mainFunction('reportStartupFailure', context);
  const startupComplete = runInNewContext(body.slice(0, begin) + '  await runEngineFixture();\n' + body.slice(end), context, { filename });
  return { settings, document, documentStarted: documentStarted.promise, engine, engineStarted: engineStarted.promise,
    calls, startupComplete, startQuit() { context.quitting = true; } };
}

test('a hard initial document failure is reported even while settings are stalled', async () => {
  const host = hostStartupFixture();
  await host.documentStarted;
  const failure = Object.assign(new Error('inert local document load failure'), { code: 'ERR_FILE_NOT_FOUND', errno: -6 });
  host.document.reject(failure);
  await new Promise(setImmediate);
  assert.deepEqual(host.calls.exits, [1]);
  assert.deepEqual(host.calls.rejected, [failure]);
  assert.match(host.calls.dialogs[0], /inert local document load failure/);
  host.settings.reject(new Error('later settings failure'));
  await host.startupComplete;
  assert.deepEqual(host.calls.exits, [1], 'a later rejection must not report startup twice');
  assert.equal(host.calls.watcher, 0);
});

test('initial document cancellation and clean quit do not raise startup failure', async () => {
  for (const errorCode of [{ code: 'ERR_ABORTED' }, { errno: -3 }, null]) {
    const host = hostStartupFixture();
    await host.documentStarted;
    if (!errorCode) host.startQuit();
    host.document.reject(errorCode ? Object.assign(new Error('superseded navigation'), errorCode) : new Error('window closed during quit'));
    await new Promise(setImmediate);
    assert.deepEqual(host.calls.exits, []);
    assert.deepEqual(host.calls.dialogs, []);
    host.settings.resolve({ profileDataRoot: '/synthetic' });
    if (errorCode) {
      await host.engineStarted;
      host.engine.resolve();
    }
    await host.startupComplete;
    assert.deepEqual(host.calls.exits, []);
    assert.equal(host.calls.ready, errorCode ? 1 : 0);
    assert.equal(host.calls.watcher, errorCode ? 1 : 0);
  }
});

test('normal startup keeps engine and window work parallel without opening IPC early', async () => {
  const host = hostStartupFixture();
  await host.documentStarted;
  host.settings.resolve({ profileDataRoot: '/synthetic' });
  await host.engineStarted;
  host.engine.resolve();
  await new Promise(setImmediate);
  assert.equal(host.calls.ready, 0, 'a pending document must still hold readiness');
  host.document.resolve();
  await host.startupComplete;
  assert.deepEqual(host.calls.exits, []);
  assert.equal(host.calls.ready, 1);
  assert.equal(host.calls.watcher, 1);
});

test('an early close waits for the saved exit preference and repeated requests share one close', async () => {
  const settings = startupSettings('exit');
  await settings.started;
  const { window, loading, creation, calls } = fixture(settings);
  loading.resolve();
  await creation;
  assert.ok(window.visible, 'first window is still presented while settings load');
  const first = window.requestClose();
  const next = window.requestClose();
  assert.ok(first.prevented && next.prevented);
  assert.equal(first.pending, next.pending);
  await Promise.resolve();
  assert.deepEqual(calls, { ask: 0, hide: 0, close: 0 });
  settings.finish();
  await first.pending;
  await settings.settingsStore.flushSettingsWriter();
  assert.deepEqual(calls, { ask: 0, hide: 0, close: 1 });
  assert.deepEqual(settings.persisted(), settings.saved);
});

test('remembering an early close choice preserves saved and newer unrelated settings', async () => {
  const settings = startupSettings('ask');
  await settings.started;
  const asked = Promise.withResolvers();
  const choice = Promise.withResolvers();
  const { window, loading, creation, calls } = fixture({ ...settings, ask() { asked.resolve(); return choice.promise; } });
  loading.resolve();
  await creation;
  const closing = window.requestClose().pending;
  await Promise.resolve();
  assert.equal(calls.ask, 0, 'the prompt must not run against factory settings');
  settings.finish();
  await asked.promise;
  await settings.settingsStore.saveLocalSettings({ memoryLimit: 71 });
  choice.resolve({ mode: 'tray', remember: true });
  await closing;
  await settings.settingsStore.flushSettingsWriter();
  assert.deepEqual(calls, { ask: 1, hide: 1, close: 0 });
  const { profileDataRoot, uiGroups, memoryLimit, closeAction } = settings.persisted();
  assert.deepEqual({ profileDataRoot, uiGroups, memoryLimit, closeAction }, {
    profileDataRoot: settings.saved.profileDataRoot, uiGroups: settings.saved.uiGroups, memoryLimit: 71, closeAction: 'tray',
  });
});

test('early close uses saved tray behavior, but ignores it after quit or destruction', async () => {
  for (const end of ['normal', 'quitting', 'destroyed']) {
    const settings = startupSettings('tray');
    await settings.started;
    const { window, loading, creation, calls, startQuit } = fixture(settings);
    loading.resolve();
    await creation;
    const closing = window.requestClose().pending;
    await Promise.resolve();
    if (end === 'quitting') startQuit();
    if (end === 'destroyed') window.destroyed = true;
    settings.finish();
    await closing;
    assert.deepEqual(calls, { ask: 0, hide: end === 'normal' ? 1 : 0, close: 0 }, end);
    assert.deepEqual(settings.persisted(), settings.saved);
  }
});

test('settings read failure or a stalled read cannot trap close or remember factory settings', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const failure of ['rejected', 'stalled']) {
    const settings = startupSettings('tray');
    await settings.started;
    const { window, loading, creation, calls } = fixture(settings);
    loading.resolve();
    await creation;
    const closing = window.requestClose().pending;
    await Promise.resolve();
    if (failure === 'rejected') settings.fail();
    else t.mock.timers.tick(2_000);
    await closing;
    if (failure === 'stalled') settings.finish();
    await settings.load.catch(() => {});
    assert.deepEqual(calls, { ask: 0, hide: 0, close: 1 }, failure);
    assert.deepEqual(settings.persisted(), settings.saved);
  }
});

test('the startup fallback and ready-to-show cannot both present the main window', async () => {
  for (const readyFirst of [true, false]) {
    const { window, loading, creation } = fixture();
    if (readyFirst) window.emit('ready-to-show');
    else {
      loading.resolve();
      await creation;
    }
    assert.equal(window.visible, true);
    // Simulate the window being sent to the tray immediately after first paint.
    window.hide();
    if (readyFirst) {
      loading.resolve();
      await creation;
    } else window.emit('ready-to-show');
    assert.equal(window.visible, false, 'later startup completion must not undo hide-to-tray');
    assert.equal(window.shows, 1);
    assert.equal(window.focuses, 1);
  }
});

test('startup presentation ignores an already destroyed main window', async () => {
  const { window, loading, creation } = fixture();
  window.destroyed = true;
  window.emit('ready-to-show');
  loading.resolve();
  await creation;
  assert.equal(window.shows, 0);
  assert.equal(window.focuses, 0);
});

test('a replacement navigation can present the window after the initial load is cancelled', async () => {
  const { window, loading, creation } = fixture();
  const cancelled = Object.assign(new Error('superseded navigation'), { code: 'ERR_ABORTED' });
  loading.reject(cancelled);
  await assert.rejects(creation, error => error === cancelled);
  window.emit('ready-to-show');
  assert.equal(window.shows, 1);
});

test('startup presentation does not bring the window forward during quit', async () => {
  const { window, loading, creation, startQuit } = fixture();
  startQuit();
  window.emit('ready-to-show');
  loading.resolve();
  await creation;
  assert.equal(window.shows, 0);
  assert.equal(window.focuses, 0);
});

test('tray and second-launch restore requests do not revive the shell during quit', () => {
  for (const state of ['minimized', 'destroyed', 'absent']) {
    const calls = [];
    const context = {
      quitting: true,
      mainWindow: state === 'absent' ? null : {
        isDestroyed: () => state === 'destroyed', isMinimized: () => true,
        restore: () => calls.push('restore'), show: () => calls.push('show'), focus: () => calls.push('focus'),
      },
      createWindow: async () => { calls.push('create'); },
    };
    const restore = mainFunction('showMainWindow', context);
    restore();
    assert.deepEqual(calls, [], state);
    context.quitting = false;
    restore();
    assert.deepEqual(calls, state === 'minimized' ? ['restore', 'show', 'focus'] : ['create']);
  }
});

test('a failed tray setup leaves a restorable minimized window and allows tray retry', () => {
  let fail = true;
  const calls = [];
  class Tray extends EventEmitter {
    setToolTip() {}
    setContextMenu() { if (fail) throw Error('tray unavailable'); }
    destroy() { calls.push('destroy'); }
  }
  const context = {
    Tray, tray: null, nativeImage: {}, process: { platform: 'win32' },
    Menu: { buildFromTemplate: items => items }, trayIconImage() {}, closeActionStrings: () => ({}),
    console: { warn() {} },
  };
  context.ensureTray = mainFunction('ensureTray', context);
  const hide = mainFunction('hideMainWindowToTray', context);
  const win = { hide: () => calls.push('hide'), minimize: () => calls.push('minimize') };
  hide(win);
  assert.deepEqual(calls, ['destroy', 'minimize']);
  assert.equal(context.tray, null);
  fail = false;
  hide(win);
  assert.ok(context.tray instanceof Tray);
  assert.deepEqual(calls, ['destroy', 'minimize', 'hide']);
});
