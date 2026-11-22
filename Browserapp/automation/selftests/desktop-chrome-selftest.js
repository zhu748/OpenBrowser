'use strict';

const assert = require('node:assert/strict');
const { basename } = require('node:path');
const { test } = require('node:test');
const { applyDockIcon, applyWindowChrome, trayIconImage, windowBackground, windowIconPath } = require('../../main/desktop-chrome');

const available = (...names) => file => names.includes(basename(file));

test('window icon prefers macOS ICNS only on macOS, then pixel PNG, PNG and ICO', () => {
  const both = available('logo.icns', 'logo-pixel.png', 'logo.png');
  assert.equal(basename(windowIconPath('darwin', both)), 'logo.icns');
  assert.equal(basename(windowIconPath('linux', both)), 'logo-pixel.png');
  assert.equal(basename(windowIconPath('darwin', available('logo.png'))), 'logo.png');
  assert.equal(basename(windowIconPath('win32', available())), 'logo.ico');
});

test('tray loads the pixel logo and resizes nonempty Windows images only', () => {
  const calls = [];
  let empty = false;
  const image = { isEmpty: () => empty, resize: size => { calls.push(size); return 'resized'; } };
  const nativeImage = { createFromPath: file => { calls.push(basename(file)); return image; } };
  assert.equal(trayIconImage(nativeImage, 'win32', available('logo-pixel.png', 'logo.png')), 'resized');
  assert.equal(trayIconImage(nativeImage, 'linux', available('logo.png')), image);
  empty = true;
  assert.equal(trayIconImage(nativeImage, 'win32', available()), image);
  assert.deepEqual(calls, ['logo-pixel.png', { width: 16, height: 16 }, 'logo.png', 'logo.ico']);
});

test('Dock prefers PNG assets before ICNS and keeps trying after a failure', () => {
  const attempts = [];
  const warnings = [];
  const dock = { setIcon(file) {
    const name = basename(file);
    attempts.push(name);
    if (name !== 'logo.icns') throw new Error(name);
  } };
  applyDockIcon(dock, available('logo.icns', 'logo.png', 'logo-pixel.png'), (...args) => warnings.push(args));
  assert.deepEqual(attempts, ['logo-pixel.png', 'logo.png', 'logo.icns']);
  assert.deepEqual(warnings.map(([, message]) => message), ['logo-pixel.png', 'logo.png']);
});

test('window chrome keeps light and dark windows opaque on every platform', () => {
  assert.equal(windowBackground(), '#ffffff');
  assert.equal(windowBackground('light'), '#ffffff');
  assert.equal(windowBackground('dark'), '#0c111b');
  const calls = [];
  const win = {
    isDestroyed: () => false,
    setBackgroundColor: color => calls.push(color),
    setVibrancy: effect => calls.push(effect),
    setBackgroundMaterial: material => calls.push(material),
  };
  applyWindowChrome(win, 'modern', 'dark', 'darwin');
  applyWindowChrome(win, 'another-theme', 'light', 'win32');
  applyWindowChrome(win, 'default', 'dark', 'linux');
  applyWindowChrome({ ...win, isDestroyed: () => true }, 'modern', 'light', 'linux');
  assert.deepEqual(calls, ['#0c111b', null, '#ffffff', 'none', '#0c111b']);
});
