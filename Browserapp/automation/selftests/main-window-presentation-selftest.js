'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const fsp = require('node:fs/promises');
const { createRequire } = require('node:module');
const os = require('node:os');
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
      this.webContents = new EventEmitter();
      this.webContents.getURL = () => this.url;
      this.webContents.isCrashed = () => false;
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
    destroyTray() {},
    hideMainWindowToTray: win => { calls.hide++; win.hide(); },
    createWindowCloseHandler: (win, options) => createWindowCloseHandler(win, { ...options, platform: 'linux' }),
    attachShellNavigationGuard() {}, createShellNavigationPolicy() {},
    rebuildProtocol: { DOCUMENT: 'local-workbench-fixture' },
    isTrustedAppIndexUrl: value => value?.startsWith('local-workbench-fixture'),
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
  let beforeRename, beforeSync;
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
      async open(name, flags) {
        if (flags === 'wx') files.set(name, Buffer.alloc(0));
        return { async writeFile(value) { files.set(name, Buffer.from(value)); }, async sync() { await beforeSync?.(name); }, async close() {} };
      },
      async unlink(name) { files.delete(name); },
      async rename(from, to) { await beforeRename?.(from, to); files.set(to, files.get(from)); files.delete(from); },
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
    setBeforeRename: handler => { beforeRename = handler; },
    setBeforeSync: handler => { beforeSync = handler; },
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

test('clean quit drains accepted settings writes but rejects new work after the flush', async () => {
  const settings = startupSettings('ask');
  await settings.started;
  settings.finish();
  await settings.load;
  const exitAllowed = Promise.withResolvers();
  const afterFlush = Promise.withResolvers();
  const sender = { getURL: () => 'obui://app/index.html' };
  const handlers = new Map();
  const exits = [];
  const context = {
    mainWindow: { isDestroyed: () => false, webContents: sender },
    localUiDialogs: null, localUiWorkspaces: null, localUiSync: null, localUiService: null,
    fatalFailure: false, quitting: false, quitCleanupPromise: null, quitCleanupSettled: false,
    isTrustedAppIndexUrl: value => value === sender.getURL(),
    ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) },
    engine: null, liveSync: null, destroyTray() {}, stopShortcutBridge() {},
    settingsStore: settings.settingsStore,
    async drainBrowsersForQuit() { return { stopped: true, remaining: [] }; },
    lifecycleTimeout: pending => pending,
    automation: { stop() { afterFlush.resolve(); return exitAllowed.promise; } },
    app: { exit: code => exits.push({ code, settings: settings.persisted() }) },
  };
  context.assertTrustedIpcSender = mainFunction('assertTrustedIpcSender', context);
  const registerTrustedIpc = mainFunction('registerTrustedIpc', context);
  const beginQuitCleanup = mainFunction('beginQuitCleanup', context);
  const systemIpcPath = path.resolve(__dirname, '../../main/system-ipc.js');
  const module = { exports: {} };
  runInNewContext(readFileSync(systemIpcPath, 'utf8'), {
    module,
    require: name => name === '../automation/local-settings' ? settings.settingsStore : {},
  }, { filename: systemIpcPath });
  module.exports.registerSystemIpc({
    registerTrustedIpc, isQuitting: () => context.quitting, destroyTray: context.destroyTray,
  });
  const bridge = {};
  const preloadPath = path.resolve(__dirname, '../../preload.js');
  runInNewContext(readFileSync(preloadPath, 'utf8'), {
    require: () => ({
      contextBridge: { exposeInMainWorld: (name, api) => { bridge[name] = api; } },
      ipcRenderer: { invoke: async (channel, ...args) => handlers.get(channel)({ sender }, ...args) },
    }),
  }, { filename: preloadPath });

  const accepted = bridge.ops.saveClientSettings({ memoryLimit: 71 });
  const cleanup = beginQuitCleanup();
  await afterFlush.promise;
  assert.equal((await accepted).memoryLimit, 71);
  const observe = operation => operation.then(value => ({ value }), error => ({ error }));
  const late = [observe(bridge.ops.saveClientSettings({ memoryLimit: 83 })), observe(bridge.ops.setCloseAction('exit'))];
  const readableWhileQuitting = await bridge.ops.getClientSettings();
  exitAllowed.resolve();
  await cleanup;
  // The old IPC guard let this write run only after the mocked process exit.
  // Settle it here so the deliberately red fixture leaves no timers behind.
  const outcomes = await Promise.all(late);
  assert.equal(exits.length, 1);
  assert.equal(exits[0].code, 0);
  assert.equal(exits[0].settings.memoryLimit, 71);
  assert.equal(exits[0].settings.closeAction, 'ask');
  for (const { error } of outcomes) assert.match(error?.message || '', /应用正在退出/);
  assert.equal(readableWhileQuitting.memoryLimit, 71, 'the settings read still works at quit');
  assert.equal(settings.persisted().memoryLimit, 71);
  assert.equal(settings.persisted().closeAction, 'ask');
});

async function profileStorageFixture(t) {
  const scratch = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-profile-root-')));
  t.after(() => fsp.rm(scratch, { recursive: true, force: true }));
  const [oldRoot, nextRoot, otherRoot] = ['old', 'next', 'other'].map(name => path.join(scratch, name));
  const file = path.join(scratch, 'settings.json');
  const { BrowserEngine } = require('../../engine');
  const { ensureDataRootIsolationSecure } = require('../isolation');
  const { createProfileRootRecoveryProbe } = require('../../main/profile-root-recovery');
  const cc = require('../../credential-crypto');
  const options = { passphrase: 'synthetic-settings-profile-root-key', mode: 'fallback' };
  const crypto = {
    ...cc,
    encryptCredential: value => cc.encryptCredential(value, options),
    decryptCredential: value => cc.decryptCredential(value, options),
  };
  function moduleFrom(relative, overrides) {
    const target = path.resolve(__dirname, relative);
    const module = { exports: {} };
    const localRequire = createRequire(target);
    runInNewContext('(function(require, module) {\n' + readFileSync(target, 'utf8') + '\n})',
      { structuredClone, console }, { filename: target })(name => overrides[name] || localRequire(name), module);
    return module.exports;
  }
  function makeStore(fsApi) {
    const settings = moduleFrom('../local-settings.js', { 'fs/promises': fsApi, '../credential-crypto': crypto });
    settings.initLocalSettings({ file, defaultProfileDataRoot: oldRoot });
    return settings;
  }
  const storageFs = Object.create(fsp);
  const settingsStore = makeStore(storageFs);
  await fsp.mkdir(oldRoot);
  await fsp.writeFile(path.join(oldRoot, 'synthetic.txt'), 'no migration expected');
  await settingsStore.loadLocalSettings();
  await settingsStore.saveLocalSettings({ memoryLimit: 64 });
  await settingsStore.saveLocalSettings({ memoryLimit: 65 });
  const buildEngine = profileDataRootPath => Object.assign(Object.create(BrowserEngine.prototype), {
    profileDataRootPath, running: new Map(), starting: new Map(), stopping: new Map(),
    deletingProfiles: new Set(), profileMaintenance: new Map(), profiles: new Map(),
  });
  const engine = buildEngine(oldRoot);
  const events = [], exits = [], dialogs = [], handlers = new Map();
  const context = {
    engine, settingsStore, defaultProfileDataRoot: oldRoot, ensureDataRootIsolationSecure,
    engineInitComplete: true, cloudOps: { runQuitCloudBackup: async () => ({ skipped: true }) },
    createProfileRootRecoveryProbe,
    quitting: false, quitCleanupPromise: null, quitCleanupSettled: false, fatalFailure: false,
    localUiSync: null, localUiService: null, liveSync: null, automation: null,
    async drainBrowsersForQuit() { return { stopped: true, remaining: [] }; },
    destroyTray() {}, stopShortcutBridge() {}, app: { getPath: name => {
      assert.equal(name, 'userData'); return scratch;
    }, exit: code => exits.push(code) },
    lifecycleTimeout: pending => pending, console,
    emit: value => events.push([value.type, value.profileRoot, engine.getProfileDataRoot(), settingsStore.getLocalSettings().profileDataRoot]),
  };
  const update = mainFunction('updateProfileDataRoot', context);
  const quit = mainFunction('beginQuitCleanup', context);
  moduleFrom('../../main/system-ipc.js', { '../automation/local-settings': settingsStore }).registerSystemIpc({
    registerTrustedIpc: (channel, handler) => handlers.set(channel, handler), updateProfileDataRoot: update,
    isQuitting: () => context.quitting, getEngine: () => engine, defaultProfileDataRoot: oldRoot,
    getMainWindow: () => null, dialog: { showOpenDialog() {
      const selection = Promise.withResolvers(); dialogs.push(selection.resolve); return selection.promise;
    } },
  });
  const read = async () => JSON.parse(crypto.decryptCredential(await fsp.readFile(file)));
  const choose = () => handlers.get('system:choose-storage')();
  const reset = () => handlers.get('system:reset-storage')();
  async function assertRoot(expected) {
    const loaded = await makeStore(fsp).loadLocalSettings();
    assert.deepEqual([engine.getProfileDataRoot(), settingsStore.getLocalSettings().profileDataRoot,
      (await read()).profileDataRoot, buildEngine(loaded.profileDataRoot).getProfileDataRoot()], Array(4).fill(expected));
  }
  return { oldRoot, nextRoot, otherRoot, file, choose, reset, update, quit, settingsStore, storageFs,
    engine, events, exits, dialogs, read, assertRoot };
}

test('storage root ENOSPC leaves live/disk/backup unchanged even after the real quit flush', async t => {
  const { file, storageFs, nextRoot, oldRoot, quit, update, events, exits, assertRoot } = await profileStorageFixture(t);
  const primary = await fsp.readFile(file);
  const backup = await fsp.readFile(file + '.bak');
  let attempts = 0;
  storageFs.rename = (from, to) => {
    if (to === file && from.startsWith(file + '.tmp-root-')) {
      attempts++;
      throw Object.assign(new Error('synthetic ENOSPC'), { code: 'ENOSPC' });
    }
    return fsp.rename(from, to);
  };
  await assert.rejects(update(nextRoot), { code: 'ENOSPC' });
  storageFs.rename = fsp.rename;
  assert.equal(attempts, 1);
  await quit();
  await assertRoot(oldRoot);
  assert.deepEqual(await fsp.readFile(file), primary);
  assert.deepEqual(await fsp.readFile(file + '.bak'), backup);
  assert.equal((await fsp.readdir(path.dirname(file))).some(name => name.includes('.tmp-root-')), false);
  assert.deepEqual(events, []);
  assert.deepEqual(exits, [0]);
  assert.equal(await fsp.readFile(path.join(oldRoot, 'synthetic.txt'), 'utf8'), 'no migration expected');
  assert.deepEqual(await fsp.readdir(nextRoot), []);
});

test('a pending cloud recovery copy prevents a new directory and preserves original bytes', async t => {
  const { file, nextRoot, oldRoot, update, choose, dialogs, quit, events, exits, assertRoot, engine } = await profileStorageFixture(t);
  const journal = path.join(path.dirname(file), 'cloud-restore-pending.obstate.bak');
  const originalJournal = Buffer.from('unreadable synthetic backup');
  await fsp.writeFile(journal, originalJournal);
  const before = [await fsp.readFile(file), await fsp.readFile(file + '.bak')];
  const canceled = choose();
  dialogs.shift()({ canceled: true });
  assert.equal((await canceled).canceled, true);
  assert.equal((await update(oldRoot)).changed, false);
  const select = choose();
  dialogs.shift()({ filePaths: [nextRoot] });
  await assert.rejects(select, error => error.code === 'PROFILE_ROOT_RECOVERY_PENDING'
    && !error.message.includes(journal) && !error.message.includes('synthetic'));
  assert.equal(engine.profileDataRootChange, null);
  await assert.rejects(fsp.access(nextRoot), { code: 'ENOENT' });
  await quit();
  await assertRoot(oldRoot);
  assert.deepEqual([await fsp.readFile(file), await fsp.readFile(file + '.bak')], before);
  assert.deepEqual(await fsp.readFile(journal), originalJournal);
  assert.deepEqual(events, []);
  assert.deepEqual(exits, [0]);
});

test('only app-owned global and immediate root recovery markers veto storage changes', async t => {
  const { file, nextRoot, oldRoot, update, assertRoot, events } = await profileStorageFixture(t);
  const cloud = path.join(path.dirname(file), 'cloud-restore-pending.obstate');
  const markers = [cloud, cloud + '.tmp-123-0123456789abcdef', cloud + '.bak.tmp-123-0123456789abcdef',
    path.join(oldRoot, '.openbrowser-delete-current'), path.join(nextRoot, '.openbrowser-delete-destination')];
  await fsp.mkdir(nextRoot);
  const raw = Buffer.from('malformed recovery data is never interpreted');
  for (const marker of markers) {
    await fsp.writeFile(marker, raw);
    const originalRead = fsp.readFile;
    fsp.readFile = async (name, ...args) => {
      if (String(name) === marker) throw Object.assign(new Error('sentinel unreadable'), { code: 'EIO' });
      return originalRead(name, ...args);
    };
    try { await assert.rejects(update(nextRoot), { code: 'PROFILE_ROOT_RECOVERY_PENDING' }); }
    finally { fsp.readFile = originalRead; }
    assert.deepEqual(await fsp.readFile(marker), raw);
    await fsp.unlink(marker); // user-side fixture repair between attempts
    await assertRoot(oldRoot);
    assert.deepEqual(events, []);
  }
  await fsp.writeFile(cloud + '.tmp-report', 'not a real stage');
  const unrelated = path.join(nextRoot, 'ordinary-folder');
  await fsp.mkdir(unrelated);
  await fsp.writeFile(path.join(unrelated, '.openbrowser-delete-unrelated'), 'do not traverse');
  assert.equal((await update(nextRoot)).changed, true, 'ordinary and nested names are outside this check');
  await assertRoot(nextRoot);
  assert.equal(events.length, 1);
  assert.equal(await fsp.readFile(path.join(unrelated, '.openbrowser-delete-unrelated'), 'utf8'), 'do not traverse');
});

test('uncertain recovery directory scans and a redirected candidate parent fail closed and release the lease', async t => {
  const { file, nextRoot, otherRoot, oldRoot, engine, update, events, assertRoot } = await profileStorageFixture(t);
  await fsp.mkdir(nextRoot);
  const readdir = fsp.readdir;
  for (const directory of [path.dirname(file), oldRoot, nextRoot]) {
    fsp.readdir = async (name, ...args) => {
      if (String(name) === directory) throw Object.assign(new Error('cannot inspect ' + directory), { code: 'EIO' });
      return readdir(name, ...args);
    };
    try {
      await assert.rejects(update(nextRoot), error => error.code === 'PROFILE_ROOT_RECOVERY_UNAVAILABLE'
        && error.cause.code === 'EIO' && !error.message.includes(directory));
      assert.equal(engine.profileDataRootChange, null);
    } finally { fsp.readdir = readdir; }
  }
  await fsp.symlink(nextRoot, otherRoot, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(update(path.join(otherRoot, 'missing-child')), { code: 'PROFILE_ROOT_RECOVERY_UNAVAILABLE' });
  await assert.rejects(fsp.access(path.join(nextRoot, 'missing-child')), { code: 'ENOENT' });
  await assertRoot(oldRoot);
  assert.deepEqual(events, []);
  assert.equal((await update(nextRoot)).changed, true, 'a genuinely accessible candidate can retry');
  await assertRoot(nextRoot);
});

test('late deletion marker vetoes after staging while accepted preferences and quit keep the old root', async t => {
  const { file, storageFs, oldRoot, nextRoot, engine, update, quit, events, exits, assertRoot,
    settingsStore, read } = await profileStorageFixture(t);
  const syncEntered = Promise.withResolvers(), release = Promise.withResolvers();
  const originalOpen = fsp.open;
  storageFs.open = async (...args) => {
    const handle = await originalOpen(...args);
    if (args[0].startsWith(file + '.tmp-root-')) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => { await sync(); syncEntered.resolve(); await release.promise; };
    }
    return handle;
  };
  const rejected = assert.rejects(update(nextRoot), { code: 'PROFILE_ROOT_RECOVERY_PENDING' });
  await syncEntered.promise;
  const stage = path.join(oldRoot, '.openbrowser-delete-late');
  const journal = path.join(stage, 'journal.json');
  const raw = Buffer.from('{"version":1,"ids":["retained-fixture"]}');
  const before = [await fsp.readFile(file), await fsp.readFile(file + '.bak')];
  try {
    assert.notEqual(engine.profileDataRootChange, null);
    await fsp.mkdir(stage);
    await fsp.writeFile(journal, raw);
    release.resolve();
    await rejected;
  } finally { release.resolve(); }
  assert.equal(engine.profileDataRootChange, null);
  await assertRoot(oldRoot);
  assert.deepEqual([await fsp.readFile(file), await fsp.readFile(file + '.bak')], before);
  await settingsStore.saveLocalSettings({ diskLimit: 17 });
  await quit();
  await assertRoot(oldRoot);
  assert.equal((await read()).diskLimit, 17);
  assert.deepEqual(await fsp.readFile(journal), raw);
  assert.equal((await fsp.readdir(path.dirname(file))).some(name => name.includes('.tmp-root-')), false);
  assert.deepEqual(events, []);
  assert.deepEqual(exits, [0]);
});

test('replacing a directory at its original spelling before the final scan vetoes the root change', async t => {
  const { file, storageFs, engine, oldRoot, nextRoot, otherRoot, update, events, assertRoot } = await profileStorageFixture(t);
  const originalOpen = fsp.open;
  storageFs.open = async (...args) => {
    const handle = await originalOpen(...args);
    if (args[0].startsWith(file + '.tmp-root-')) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        await sync();
        await fsp.rename(oldRoot, otherRoot);
        await fsp.mkdir(oldRoot);
      };
    }
    return handle;
  };
  await assert.rejects(update(nextRoot), { code: 'PROFILE_ROOT_RECOVERY_UNAVAILABLE' });
  assert.equal(engine.profileDataRootChange, null);
  assert.equal(await fsp.readFile(path.join(otherRoot, 'synthetic.txt'), 'utf8'), 'no migration expected');
  await assertRoot(oldRoot);
  assert.deepEqual(events, []);
});

test('quit during the awaited final recovery probe is rechecked before replacing settings', async t => {
  const { file, oldRoot, nextRoot, engine, update, quit, events, exits, assertRoot } = await profileStorageFixture(t);
  const waiting = Promise.withResolvers(), release = Promise.withResolvers();
  const readdir = fsp.readdir;
  let probes = 0;
  fsp.readdir = async (directory, ...args) => {
    if (String(directory) === path.dirname(file) && ++probes === 2) {
      waiting.resolve();
      await release.promise;
    }
    return readdir(directory, ...args);
  };
  try {
    const before = [await fsp.readFile(file), await fsp.readFile(file + '.bak')];
    const rejected = assert.rejects(update(nextRoot), { code: 'APP_SHUTTING_DOWN' });
    await waiting.promise;
    assert.notEqual(engine.profileDataRootChange, null);
    const cleanup = quit();
    release.resolve();
    await rejected;
    await cleanup;
    assert.equal(engine.profileDataRootChange, null);
    assert.deepEqual(await Promise.all([fsp.readFile(file), fsp.readFile(file + '.bak')]), before);
  } finally { release.resolve(); fsp.readdir = readdir; }
  await assertRoot(oldRoot);
  assert.deepEqual(events, []);
  assert.deepEqual(exits, [0]);
});

test('storage chooser cancels, ignores inverted stale selections and rejects a late choice after quit', async t => {
  const { file, choose, reset, dialogs, quit, oldRoot, nextRoot, otherRoot, events, assertRoot,
    settingsStore, read } = await profileStorageFixture(t);
  const stale = { ...settingsStore.getLocalSettings() };
  const primary = await fsp.readFile(file);
  const cancel = choose();
  dialogs.shift()({ canceled: true });
  assert.equal((await cancel).canceled, true);
  const same = choose();
  dialogs.shift()({ canceled: false, filePaths: [oldRoot] });
  assert.equal((await same).changed, false);
  assert.deepEqual(events, []);

  const older = choose(), newer = choose();
  dialogs.pop()({ canceled: false, filePaths: [nextRoot] });
  assert.equal((await newer).profileRoot, nextRoot);
  dialogs.shift()({ canceled: false, filePaths: [otherRoot] });
  assert.equal((await older).canceled, true);
  await assertRoot(nextRoot);
  assert.deepEqual(events, [['storage-settings', nextRoot, nextRoot, nextRoot]]);
  assert.deepEqual(await fsp.readFile(file + '.bak'), primary, 'the committed root keeps the authenticated previous settings as backup');
  assert.equal((await settingsStore.saveLocalSettings({ ...stale, diskLimit: 15 })).profileDataRoot, nextRoot);
  await assertRoot(nextRoot);
  assert.equal((await read()).diskLimit, 15, 'stale root input cannot discard an unrelated preference');

  const delayed = choose();
  assert.equal((await reset()).changed, true);
  dialogs.shift()({ canceled: false, filePaths: [nextRoot] });
  assert.equal((await delayed).canceled, true, 'a programmatic reset supersedes an older dialog');
  const late = choose();
  await quit();
  dialogs.shift()({ canceled: false, filePaths: [otherRoot] });
  await assert.rejects(late, { code: 'APP_SHUTTING_DOWN' });
  await assertRoot(oldRoot);
  assert.deepEqual(events.map(event => event[1]), [nextRoot, oldRoot]);
});

test('a preference admitted during a failed root rename still persists with the old root', async t => {
  const { file, storageFs, oldRoot, nextRoot, update, quit, events, assertRoot,
    settingsStore, read } = await profileStorageFixture(t);
  const renameEntered = Promise.withResolvers(), release = Promise.withResolvers();
  storageFs.rename = async (from, to) => {
    if (to === file && from.startsWith(file + '.tmp-root-')) {
      renameEntered.resolve();
      await release.promise;
      throw Object.assign(new Error('synthetic ENOSPC'), { code: 'ENOSPC' });
    }
    return fsp.rename(from, to);
  };
  const rejected = assert.rejects(update(nextRoot), { code: 'ENOSPC' });
  await renameEntered.promise;
  const prefs = settingsStore.saveLocalSettings({ diskLimit: 13 });
  release.resolve();
  await rejected;
  assert.equal((await prefs).diskLimit, 13);
  await quit();
  await assertRoot(oldRoot);
  assert.equal((await read()).diskLimit, 13);
  assert.deepEqual(events, []);
});

test('storage commit isolates lifecycle and old-root input, then quit drains an accepted rename and preferences', async t => {
  const { file, storageFs, engine, settingsStore, oldRoot, nextRoot, otherRoot,
    update, quit, events, exits, read, assertRoot } = await profileStorageFixture(t);
  const { acquireProfileMaintenance } = require('../../engine/profile-maintenance');
  for (const [collection, add] of [['running', 'set'], ['starting', 'set'], ['stopping', 'set'],
    ['deletingProfiles', 'add'], ['profileMaintenance', 'set']]) {
    engine[collection][add]('synthetic', true);
    await assert.rejects(update(nextRoot), /Stop all browser environments/);
    engine[collection].delete('synthetic');
  }
  const renameEntered = Promise.withResolvers(), release = Promise.withResolvers();
  storageFs.rename = async (from, to) => {
    if (to === file && from.startsWith(file + '.tmp-root-')) {
      renameEntered.resolve();
      await release.promise;
    }
    return fsp.rename(from, to);
  };
  const stale = { ...settingsStore.getLocalSettings() };
  const request = update(nextRoot);
  await renameEntered.promise;
  try {
    assert.equal(engine.getProfileDataRoot(), oldRoot);
    assert.equal(settingsStore.getLocalSettings().profileDataRoot, oldRoot);
    assert.equal((await read()).profileDataRoot, oldRoot);
    assert.deepEqual(events, []);
    await assert.rejects(update(otherRoot), { code: 'PROFILE_DATA_ROOT_BUSY' });
    await assert.rejects(engine.startManaged('synthetic', {}, () => assert.fail('must not launch')),
      { code: 'PROFILE_DATA_ROOT_BUSY' });
    await assert.rejects(engine.deleteProfiles(['synthetic'], true), { code: 'PROFILE_DATA_ROOT_BUSY' });
    assert.throws(() => acquireProfileMaintenance(engine, ['synthetic']), { code: 'PROFILE_DATA_ROOT_BUSY' });

    const prefs = settingsStore.saveLocalSettings({ ...stale, memoryLimit: 72 });
    const cleanup = quit();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(exits, [], 'quit waits for the already-dispatched rename');
    release.resolve();
    assert.equal((await request).changed, true);
    assert.equal((await prefs).memoryLimit, 72);
    await cleanup;
  } finally { release.resolve(); }
  await assertRoot(nextRoot);
  assert.equal((await read()).memoryLimit, 72);
  assert.deepEqual(events, [['storage-settings', nextRoot, nextRoot, nextRoot]]);
  assert.deepEqual(exits, [0]);
  assert.equal(engine.profileDataRootChange, null);
});

test('quit before the root rename discards staging rather than committing the cancelled request', async t => {
  const { file, storageFs, oldRoot, nextRoot, update, quit, events, assertRoot } = await profileStorageFixture(t);
  const syncEntered = Promise.withResolvers(), release = Promise.withResolvers();
  storageFs.open = async (...args) => {
    const handle = await fsp.open(...args);
    if (args[0].startsWith(file + '.tmp-root-')) {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => { syncEntered.resolve(); await release.promise; await sync(); };
    }
    return handle;
  };
  const rejected = assert.rejects(update(nextRoot), { code: 'APP_SHUTTING_DOWN' });
  await syncEntered.promise;
  const cleanup = quit();
  release.resolve();
  await rejected;
  await cleanup;
  await assertRoot(oldRoot);
  assert.deepEqual(events, []);
  assert.equal((await fsp.readdir(path.dirname(file))).some(name => name.includes('.tmp-root-')), false);
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

test('an older close dialog cannot save after an ABA or explicit same-value ask, but its one-time choice still acts', async () => {
  for (const modes of [['tray', 'ask'], ['ask']]) {
    const settings = startupSettings('ask');
    await settings.started; settings.finish(); await settings.load;
    const asked = Promise.withResolvers(), choice = Promise.withResolvers();
    const { window, loading, creation, calls } = fixture({ ...settings, ask() { asked.resolve(); return choice.promise; } });
    loading.resolve(); await creation;
    const closing = window.requestClose().pending;
    await asked.promise;
    for (const closeAction of modes) await settings.settingsStore.commitCloseSettings({ closeAction });
    choice.resolve({ mode: 'tray', remember: true });
    await closing; await settings.settingsStore.flushSettingsWriter();
    assert.deepEqual(calls, { ask: 1, hide: 1, close: 0 });
    assert.equal(settings.persisted().closeAction, 'ask');
  }
});

test('a remembered exit gets a chance to commit before one-time close and can still close if rejected', async () => {
  for (const failure of [false, true]) {
    const settings = startupSettings('ask');
    await settings.started; settings.finish(); await settings.load;
    settings.setBeforeRename(async from => {
      if (failure && from.includes('.tmp-close-')) throw Object.assign(new Error('synthetic rename failed'), { code: 'ENOSPC' });
    });
    const { window, loading, creation, calls } = fixture({ ...settings, ask: async () => ({ mode: 'exit', remember: true }) });
    loading.resolve(); await creation;
    await window.requestClose().pending;
    assert.deepEqual(calls, { ask: 1, hide: 0, close: 1 });
    assert.equal(settings.persisted().closeAction, failure ? 'ask' : 'exit');
    await settings.settingsStore.flushSettingsWriter();
    assert.equal(settings.persisted().closeAction, failure ? 'ask' : 'exit');
  }
});

test('one-time exit is not trapped by a stalled remember, and an undispatched save cannot follow the closed window', async t => {
  const settings = startupSettings('ask');
  await settings.started; settings.finish(); await settings.load;
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const staged = Promise.withResolvers(), release = Promise.withResolvers();
  settings.setBeforeSync(async name => {
    if (name.includes('.tmp-close-')) { staged.resolve(); await release.promise; }
  });
  const { window, loading, creation, calls } = fixture({ ...settings, ask: async () => ({ mode: 'exit', remember: true }) });
  loading.resolve(); await creation;
  const closing = window.requestClose().pending;
  try {
    await staged.promise;
    t.mock.timers.tick(2_000);
    await closing;
    assert.deepEqual(calls, { ask: 1, hide: 0, close: 1 });
    assert.equal(settings.persisted().closeAction, 'ask');
  } finally { release.resolve(); }
  await settings.settingsStore.flushSettingsWriter();
  assert.equal(settings.persisted().closeAction, 'ask');
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

test('a generic Electron load error preserves a ready workbench document', async () => {
  const { window, loading, creation } = fixture();
  window.url = 'local-workbench-fixture';
  window.webContents.emit('dom-ready');
  window.url += '#/browser/list';
  window.webContents.emit('did-start-navigation', {}, window.url, true, true);
  loading.reject(Object.assign(new Error('generic navigation error'), { code: 'ERR_FAILED', errno: -2 }));
  await creation;
  assert.equal(window.shows, 1);
  assert.equal(window.webContents.listenerCount('dom-ready'), 0);
});

test('without a live ready document a generic Electron load error remains fatal', async () => {
  for (const state of ['pending', 'changed', 'replaced', 'crashed']) {
    const { window, loading, creation } = fixture();
    window.url = 'local-workbench-fixture';
    if (state !== 'pending') window.webContents.emit('dom-ready');
    if (state === 'changed') window.url = 'about:blank';
    if (state === 'replaced') window.webContents.emit('did-start-navigation', {}, window.url, false, true);
    if (state === 'crashed') window.webContents.isCrashed = () => true;
    const failure = Object.assign(new Error('generic navigation error'), { code: 'ERR_FAILED', errno: -2 });
    loading.reject(failure);
    await assert.rejects(creation, error => error === failure);
    assert.equal(window.webContents.listenerCount('dom-ready'), 0);
  }
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
