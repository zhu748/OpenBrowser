'use strict';

// Filesystem discovery only: no downloads, metadata mutation or process launches.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { safeInstalledBinary } = require('./archive');

function cftPlatformKey() {
  if (process.platform === 'darwin') return process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  if (process.platform === 'win32') return 'win64';
  return 'linux64';
}

function chromeStableBinaryRelative() {
  if (process.platform === 'darwin') {
    return path.join('Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome');
  }
  if (process.platform === 'win32') return path.join('Google', 'Chrome', 'Application', 'chrome.exe');
  return path.join('opt', 'google', 'chrome', 'chrome');
}

function chromeForTestingBinaryRelative(platform) {
  if (platform.startsWith('mac-')) {
    return path.join(
      platform === 'mac-arm64' ? 'chrome-mac-arm64' : 'chrome-mac-x64',
      'Google Chrome for Testing.app',
      'Contents',
      'MacOS',
      'Google Chrome for Testing'
    );
  }
  if (platform === 'win64') return path.join('chrome-win64', 'chrome.exe');
  return path.join('chrome-linux64', 'chrome');
}

async function findExecutable(root, preferredNames) {
  const stack = [root];
  const found = [];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch (_) { continue; }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        // Prefer walking into .app/Contents/MacOS
        if (ent.name.endsWith('.app')) {
          const macosDir = path.join(full, 'Contents', 'MacOS');
          if (fs.existsSync(macosDir)) stack.push(macosDir);
          else stack.push(full);
        } else if (!['Frameworks', 'Helpers', 'resources', 'locales', 'Resources'].includes(ent.name)) {
          stack.push(full);
        }
      } else {
        const lower = ent.name.toLowerCase();
        for (const pref of preferredNames) {
          if (lower === pref.toLowerCase() || ent.name.includes(pref)) {
            found.push({ full, score: lower === pref.toLowerCase() ? 0 : 1, name: ent.name });
          }
        }
      }
    }
  }
  found.sort((a, b) => a.score - b.score);
  // Skip crashpad helpers
  const cleaned = found.filter((f) => !/crashpad|helper|nacl|chrome_crash/i.test(f.name));
  return (cleaned[0] || found[0] || null)?.full || null;
}

/** Sync tree walk for installed-kernel discovery (listInstalledKernels is sync). */
function findExecutableSync(root, preferredNames) {
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 6) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name.endsWith('.app')) {
          const macos = path.join(full, 'Contents', 'MacOS');
          if (fs.existsSync(macos)) walk(macos, depth + 1);
          else walk(full, depth + 1);
        } else if (!['Frameworks', 'Helpers', 'resources', 'locales', 'Resources', 'uninstall', 'update', 'uninst'].includes(ent.name)) {
          walk(full, depth + 1);
        }
      } else {
        const lower = ent.name.toLowerCase();
        for (const pref of preferredNames) {
          const want = String(pref).toLowerCase();
          if (lower === want || lower.includes(want)) {
            found.push({ full, score: lower === want ? 0 : 1, name: ent.name });
          }
        }
      }
    }
  };
  try { walk(path.resolve(String(root || '')), 0); } catch (_) { return null; }
  found.sort((a, b) => a.score - b.score);
  const cleaned = found.filter((f) => !/crashpad|helper|nacl|chrome_crash|uninstall|updater/i.test(f.name));
  return (cleaned[0] || found[0] || null)?.full || null;
}

async function resolveWayfernBinary(installDir) {
  if (process.platform === 'darwin') {
    // Prefer .app → Contents/MacOS/{primary|Chromium}
    try {
      const entries = await fsp.readdir(installDir, { withFileTypes: true });
      const app = entries.find((e) => e.isDirectory() && e.name.endsWith('.app'));
      if (app) {
        const macosDir = path.join(installDir, app.name, 'Contents', 'MacOS');
        if (fs.existsSync(macosDir)) {
          const bins = await fsp.readdir(macosDir);
          const pick = bins.find((n) => /Wayfern/i.test(n))
            || bins.find((n) => /Chromium/i.test(n))
            || bins.find((n) => /Chrome/i.test(n) && !/helper|crash/i.test(n));
          if (pick) return path.join(macosDir, pick);
        }
      }
    } catch (_) {}
  }
  const names = process.platform === 'win32'
    ? ['wayfern.exe', 'chromium.exe', 'chrome.exe']
    : ['wayfern', 'chromium', 'chrome', 'Wayfern', 'Chromium'];
  // direct candidates
  for (const name of names) {
    for (const rel of ['', 'wayfern', 'wayfern-linux', 'chrome-linux', 'Wayfern']) {
      const candidate = path.join(installDir, rel, name);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return findExecutable(installDir, names.map((n) => n.replace(/\.exe$/i, '')));
}

/** Platform seed dir names under kernels/ (no cross-arch fallback on macOS). */
function wayfernSeedDirNames(platform = process.platform, arch = process.arch) {
  if (platform === 'win32') {
    // WoA can still run x64 builds under emulation in some setups; prefer native first.
    return arch === 'arm64' ? ['windows-arm64', 'windows-x64'] : ['windows-x64'];
  }
  if (platform === 'darwin') {
    // arm64 and x64 Mach-O are not interchangeable — never fall back across arch.
    return arch === 'arm64' ? ['macos-arm64'] : ['macos-x64'];
  }
  if (platform === 'linux') {
    return arch === 'arm64' ? ['linux-arm64'] : ['linux-x64'];
  }
  return [];
}

function isForeignWayfernSeedDir(name, platform = process.platform, arch = process.arch) {
  const n = String(name || '').toLowerCase();
  if (!/^(windows|macos|linux)-(x64|arm64)$/.test(n)) return false;
  const allowed = new Set(wayfernSeedDirNames(platform, arch));
  return !allowed.has(n);
}

function findWayfernKernelBinary(root) {
  const base = path.resolve(String(root || ''));
  if (!fs.existsSync(base)) return null;
  const names = process.platform === 'win32'
    ? ['wayfern.exe', 'chromium.exe', 'chrome.exe']
    : ['wayfern', 'chromium', 'chrome', 'Wayfern', 'Chromium'];
  const walk = (dir, depth, skipForeignSeeds) => {
    if (depth > 8) return null;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return null; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && skipForeignSeeds && isForeignWayfernSeedDir(entry.name)) {
        continue;
      }
      if (entry.isDirectory() && entry.name.endsWith('.app')) {
        const macos = path.join(full, 'Contents', 'MacOS');
        const hit = fs.existsSync(macos) ? walk(macos, depth + 1, false) : null;
        if (hit) return hit;
      } else if (entry.isFile() && names.some((name) => entry.name.toLowerCase() === name.toLowerCase())) {
        return full;
      } else if (entry.isDirectory() && !['Frameworks', 'Helpers', 'resources', 'locales', 'Resources'].includes(entry.name)) {
        const hit = walk(full, depth + 1, false);
        if (hit) return hit;
      }
    }
    return null;
  };
  // Prefer nested platform seeds before a deep walk of the whole tree (avoids
  // picking the wrong arch seed when multiple seeds exist).
  for (const seed of wayfernSeedDirNames()) {
    const seedRoot = path.join(base, seed);
    if (!fs.existsSync(seedRoot)) continue;
    const hit = walk(seedRoot, 0, false);
    if (hit) return hit;
  }
  return walk(base, 0, true);
}

function findBundledWayfernKernel(resourceRoots = []) {
  const roots = [];
  const addRoot = (root) => {
    if (!root) return;
    const value = path.resolve(String(root));
    if (!roots.includes(value)) roots.push(value);
  };
  for (const root of resourceRoots || []) {
    // Preferred flat layout: Browserapp/kernels/{windows-x64|macos-arm64}
    for (const seed of wayfernSeedDirNames()) {
      addRoot(path.join(root, 'kernels', seed));
      addRoot(path.join(root, 'app', 'kernels', seed));
      addRoot(path.join(root, seed));
    }
    // Compat: legacy nested platform seed paths (symlink tree)
    addRoot(path.join(root, 'kernels', 'wayfern'));
    addRoot(path.join(root, 'app', 'kernels', 'wayfern'));
    for (const seed of wayfernSeedDirNames()) {
      addRoot(path.join(root, 'kernels', 'wayfern', seed));
      addRoot(path.join(root, 'app', 'kernels', 'wayfern', seed));
    }
    // Legacy staging directory (should not ship)
    addRoot(path.join(root, 'bundled-kernels', 'wayfern'));
    addRoot(path.join(root, 'app', 'bundled-kernels', 'wayfern'));
  }
  for (const root of roots) {
    const binary = findWayfernKernelBinary(root);
    if (binary) return { binary, root };
  }
  return null;
}

/** Ordered resource roots shared by the bundled Chrome distributions. */
function findBundledBrowser(resourceRoots, directory, relativeBinary) {
  const roots = new Set();
  for (const root of resourceRoots || []) {
    for (const candidate of [path.join(root, 'kernels', directory), path.join(root, 'app', 'kernels', directory), path.join(root, directory)]) {
      roots.add(path.resolve(candidate));
    }
  }
  for (const root of roots) {
    const binary = safeInstalledBinary(path.join(root, relativeBinary), root);
    if (binary) return { binary, root };
  }
  return null;
}

/** Locate a Chrome for Testing seed bundled beside the application resources. */
function findBundledChromeForTesting(resourceRoots = []) {
  return findBundledBrowser(resourceRoots, 'chrome-for-testing', chromeForTestingBinaryRelative(cftPlatformKey()));
}

/** Locate a standard Google Chrome Stable package installed beside the app. */
function findBundledChromeStable(resourceRoots = []) {
  return findBundledBrowser(resourceRoots, 'chrome-stable', chromeStableBinaryRelative());
}

function bundledKernelVersion(root) {
  const tryFiles = [];
  if (root) {
    tryFiles.push(path.join(root, 'kernel.json'));
    // binary may live one level deeper than seed root
    tryFiles.push(path.join(root, '..', 'kernel.json'));
  }
  for (const file of tryFiles) {
    try {
      const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
      const version = String(manifest.version || '').trim();
      if (version) return version;
    } catch (_) {}
  }
  return 'bundled';
}

module.exports = { cftPlatformKey, chromeStableBinaryRelative, chromeForTestingBinaryRelative, findExecutable, findExecutableSync, resolveWayfernBinary, wayfernSeedDirNames, findWayfernKernelBinary, findBundledWayfernKernel, findBundledChromeForTesting, findBundledChromeStable, bundledKernelVersion };
