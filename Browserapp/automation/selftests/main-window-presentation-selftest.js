'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { parse } = require('acorn');

const filename = path.resolve(__dirname, '../../main.js');
const source = readFileSync(filename, 'utf8');
const declarations = parse(source, { ecmaVersion: 'latest', sourceType: 'commonjs' }).body;
function mainFunction(name, context) {
  const declaration = declarations.find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert.ok(declaration);
  return runInNewContext(source.slice(declaration.start, declaration.end) + '\n' + name, context, { filename });
}

function fixture() {
  const loading = Promise.withResolvers();
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
    setMenu() {}
    loadURL() { return loading.promise; }
  }
  const context = {
    BrowserWindow, mainWindow: null, windows: new Set(), path, __dirname: path.dirname(filename),
    quitting: false, app: { getVersion: () => 'fixture' }, roxyPreview: true,
    windowIconPath() {}, windowBackground() {},
    askCloseAction() {}, hideMainWindowToTray() {},
    createWindowCloseHandler: () => () => {},
    attachShellNavigationGuard() {}, createShellNavigationPolicy() {},
    rebuildProtocol: { DOCUMENT: 'local-workbench-fixture' },
  };
  const createWindow = mainFunction('createWindow', context);
  const creation = createWindow();
  return { window, loading, creation, startQuit() { context.quitting = true; } };
}

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
