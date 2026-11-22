'use strict';

const { existsSync } = require('node:fs');
const { join } = require('node:path');

const assets = join(__dirname, '..', 'assets');
const pixelLogo = join(assets, 'logo-pixel.png');
const pngLogo = join(assets, 'logo.png');
const macLogo = join(assets, 'logo.icns');
const windowsLogo = join(assets, 'logo.ico');

function rasterIconPath(exists) {
  return [pixelLogo, pngLogo].find(file => exists(file)) ?? windowsLogo;
}

function windowIconPath(platform = process.platform, exists = existsSync) {
  return platform === 'darwin' && exists(macLogo) ? macLogo : rasterIconPath(exists);
}

function trayIconImage(nativeImage, platform = process.platform, exists = existsSync) {
  const image = nativeImage.createFromPath(rasterIconPath(exists));
  return platform === 'win32' && !image.isEmpty() ? image.resize({ width: 16, height: 16 }) : image;
}

function applyDockIcon(dock, exists = existsSync, warn = console.warn) {
  for (const file of [pixelLogo, pngLogo, macLogo]) {
    try {
      if (!exists(file)) continue;
      dock.setIcon(file);
      return;
    } catch (error) {
      warn('OpenBrowser Dock icon could not be applied:', error.message);
    }
  }
}

function windowBackground(colorMode) {
  return colorMode === 'dark' ? '#0c111b' : '#ffffff';
}

// Keep themeId in the IPC callback contract; native chrome follows color mode only.
function applyWindowChrome(win, _themeId, colorMode, platform = process.platform) {
  if (!win || win.isDestroyed()) return;
  // Keep the window opaque even when the platform supports native backdrops.
  try { win.setBackgroundColor(windowBackground(colorMode)); } catch (_) {}
  if (platform === 'darwin') {
    try { win.setVibrancy?.(null); } catch (_) {}
  } else if (platform === 'win32') {
    try { win.setBackgroundMaterial?.('none'); } catch (_) {}
  }
}

module.exports = { applyDockIcon, applyWindowChrome, trayIconImage, windowBackground, windowIconPath };
