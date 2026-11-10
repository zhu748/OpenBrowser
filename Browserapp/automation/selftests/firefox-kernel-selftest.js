#!/usr/bin/env node
'use strict';

/**
 * Selftest for multi-version + Firefox kernel management and the dual-engine
 * start branch. Network and child processes are stubbed:
 *   - fetchJson/fetchText/Downloader are replaced with fixtures;
 *   - probe binaries are stubbed scripts (/bin/sh or the node binary) instead
 *     of real browsers;
 *   - the install flows are exercised for real (archive written, extracted,
 *     baselined, pinned) using a tar.xz fixture on linux/x64.
 *
 * Runs on linux/x64 only for the archive-shaped parts; other platforms skip
 * those and still run the engine-selection parts.
 */

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const kernelModule = require('../../automation/browser-kernel');
const { BrowserKernelManager } = kernelModule;
const kv = require('../../automation/kernel-versions');



let passed = 0;
let failed = 0;
const skips = [];
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}: ${error.message}`);
  }
}
function skip(name, why) {
  skips.push(`${name}: ${why}`);
}

const IS_LINUX_X64 = process.platform === 'linux' && process.arch === 'x64';

// ---------- Shared fixture helpers ----------
const SUMS_141 = [
  '94e72abd752b2a430b0b73f4f3e30c082d66cfc03675252f9415ea15358e8159  linux-x86_64/en-US/firefox-141.0.tar.xz',
  '435a07e04f1fcae53b992cdcc31ccdf541d9f2433fce744f432b4be4620b5c8c  win64/en-US/Firefox Setup 141.0.exe',
].join('\n');

function makeStubBrowser(dir) {
  // A tiny executable that answers --version like Firefox and exits 0.
  const target = path.join(dir, 'firefox', 'firefox');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (process.platform === 'win32') {
    fs.writeFileSync(target + '.cmd', '@echo off\necho Mozilla Firefox 141.0\r\n');
    return target + '.cmd';
  }
  fs.writeFileSync(target, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "Mozilla Firefox 141.0"; exit 0; fi\nexit 0\n', { mode: 0o755 });
  return target;
}

async function makeFakeManager(withPinTree) {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-kernels-'));
  const manager = new BrowserKernelManager(tmp, {
    onProgress: () => {},
    resourceRoots: [tmp],
  });
  // Pin trees stay dormant; the active-kernel record must not move.
  if (withPinTree) await withPinTree(manager, tmp);
  return { manager, tmp };
}

// ---------- Firefox version listing (network stubbed at module boundary) ----------
check('listFirefoxVersions resolves release + esr entries (stubbed network)', async () => {
  const { manager, tmp } = await makeFakeManager();
  const origFetchJson = kernelModule.fetchJson;
  const origFetchText = kernelModule.fetchText;
  const calls = [];
  kernelModule.fetchJson = async (url) => {
    calls.push(url);
    if (url.includes('firefox.json')) {
      return {
        releases: {
          'firefox-141.0': { category: 'major', version: '141.0' },
          'firefox-141.0.3': { category: 'stability', version: '141.0.3' },
          'firefox-140.0': { category: 'major', version: '140.0' },
        },
      };
    }
    if (url.includes('firefox_versions')) {
      return { FIREFOX_ESR: '153.6.0esr', LATEST_FIREFOX_VERSION: '141.0.3' };
    }
    throw new Error('unexpected url ' + url);
  };
  kernelModule.fetchText = async () => SUMS_141;
  try {
    const listing = await manager.listFirefoxVersions({ refresh: true });
    assert.strictEqual(listing.platform, kv.firefoxPlatformDir());
    assert.deepStrictEqual(listing.versions.map((v) => v.version), ['141.0.3', '153.6.0esr', '140.0']);
    // cache round-trip: second call must not hit the network
    const again = await manager.listFirefoxVersions({ refresh: false });
    assert.strictEqual(again.versions.length, 3);
    const before = calls.length;
    await manager.listFirefoxVersions({ refresh: false });
    assert.strictEqual(calls.length, before, 'cached listing must not refetch');
  } finally {
    kernelModule.fetchJson = origFetchJson;
    kernelModule.fetchText = origFetchText;
    await fsp.rm(tmp, { recursive: true, force: true });
  }
});

// ---------- Firefox install end-to-end (linux/x64 only, stubbed download) ----------
if (IS_LINUX_X64) {
  check('installFirefoxVersion: download → extract → probe → baseline → pin digest', async () => {
    const { manager, tmp } = await makeFakeManager();
    const origFetchJson = kernelModule.fetchJson;
    const origFetchText = kernelModule.fetchText;
    const origDownloadFile = kernelModule.downloadFile;
    const origProbe = manager.probeFirefoxBinary.bind(manager);
    kernelModule.fetchJson = async () => ({ releases: {}, FIREFOX_ESR: '' });
    kernelModule.fetchText = async (url) => {
      assert.ok(url.endsWith('/141.0/SHA256SUMS'), 'sums url must target the release folder');
      return SUMS_141;
    };
    // A real tar.xz whose tree layout matches firefoxBinaryRelative('linux-x86_64').
    const staging = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-ffsrc-'));
    const _srcBinary = makeStubBrowser(staging);
    await fsp.writeFile(path.join(staging, 'firefox', 'application.ini'), '[App]\nName=Firefox\nVersion=141.0\n');
    const archive = path.join(staging, 'firefox-141.0.tar.xz');
    execFileSync('tar', ['-cJf', archive, '-C', staging, 'firefox']);
    const archiveSha = require('crypto').createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    kernelModule.downloadFile = async (url, dest) => {
      assert.strictEqual(url, kv.firefoxCdnUrl('141.0', 'linux-x86_64/en-US/firefox-141.0.tar.xz'));
      assert.ok(String(dest).endsWith('.tar.xz'));
      await fsp.copyFile(archive, dest);
      return { path: dest, bytes: fs.statSync(archive).size, sha256: archiveSha };
    };
    manager.probeFirefoxBinary = async (binary) => ({
      path: binary, version: '141.0', browser: 'Firefox 141.0',
    });
    try {
      const events = [];
      manager.onProgress = (p) => events.push(p.phase);
      const installed = await manager.installFirefoxVersion('141.0');
      assert.strictEqual(installed.engine, 'firefox');
      assert.ok(installed.path.endsWith(path.join('firefox', '141.0', 'firefox', 'firefox')));
      assert.ok(fs.existsSync(path.join(tmp, 'kernels', 'firefox', '141.0', 'kernel.json')));
      assert.ok(events.includes('download') && events.includes('extract') && events.includes('validate'));

      // Dormant until pinned: the active kernel record must be untouched.
      const resolved = manager.resolveInstalled();
      assert.ok(!resolved || resolved.engine !== 'firefox' || manager.meta.pin, 'per-version install must not hijack the default kernel');

      // Digest pinned for the CDN URL.
      const pins = JSON.parse(await fsp.readFile(path.join(tmp, 'kernels', 'archive-digests.json'), 'utf8'));
      const pinnedUrl = kv.firefoxCdnUrl('141.0', 'linux-x86_64/en-US/firefox-141.0.tar.xz');
      assert.strictEqual(pins.pins[pinnedUrl].sha256, archiveSha);

      // listInstalledKernels sees it; pinKernel promotes it to default.
      const list = manager.listInstalledKernels();
      assert.ok(list.some((k) => k.engine === 'firefox' && k.version === '141.0'));
      await manager.pinKernel({ engine: 'firefox', version: '141.0' });
      const afterPin = manager.resolveInstalled();
      assert.strictEqual(afterPin.engine, 'firefox');
      assert.strictEqual(afterPin.version, '141.0');

      // clearPin returns to the pre-pin state.
      await manager.clearPin();
      const afterClear = manager.resolveInstalled();
      assert.ok(!afterClear || afterClear.engine !== 'firefox');
    } finally {
      kernelModule.fetchJson = origFetchJson;
      kernelModule.fetchText = origFetchText;
      kernelModule.downloadFile = origDownloadFile;
      manager.probeFirefoxBinary = origProbe;
      await fsp.rm(tmp, { recursive: true, force: true });
      await fsp.rm(staging, { recursive: true, force: true });
    }
  });
} else {
  skip('installFirefoxVersion end-to-end', 'archive fixture is linux/x64 only');
}

// ---------- probeFirefoxBinary via application.ini on real stub ----------
if (IS_LINUX_X64) {
  check('probeFirefoxBinary reads version from a stub binary', async () => {
    const { manager, tmp } = await makeFakeManager();
    try {
      const staging = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-probe-'));
      const binary = makeStubBrowser(staging);
      const probe = await manager.probeFirefoxBinary(binary);
      assert.strictEqual(probe.version, '141.0');
      await fsp.rm(staging, { recursive: true, force: true });
    } finally {
      await fsp.rm(tmp, { recursive: true, force: true });
    }
  });
} else {
  skip('probeFirefoxBinary stub', 'linux/x64 only');
}

// ---------- Chromium per-version install (zip fixture) ----------
if (IS_LINUX_X64) {
  check('installChromiumVersion: known-good URL, digest pin, dormant until pinned', async () => {
    const { manager, tmp } = await makeFakeManager();
    const origDownloadFile = kernelModule.downloadFile;
    const origProbe = manager.probeBrowserBinary.bind(manager);
    const staging = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-crsrc-'));
    // chrome-linux64/chrome matching chromeForTestingBinaryRelative('linux64').
    const binaryDir = path.join(staging, 'chrome-linux64');
    fs.mkdirSync(binaryDir, { recursive: true });
    const stub = path.join(binaryDir, 'chrome');
    fs.writeFileSync(stub, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "Chromium 159.0.8149.0"; exit 0; fi\nexit 0\n', { mode: 0o755 });
    const archive = path.join(staging, 'cft.zip');
    execFileSync('zip', ['-q', '-r', archive, 'chrome-linux64'], { cwd: staging });
    const archiveSha = require('crypto').createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
    kernelModule.downloadFile = async (url, dest) => {
      assert.ok(url.includes('159.0.8149.0'), 'url embeds the version: ' + url);
      await fsp.copyFile(archive, dest);
      return { path: dest, bytes: fs.statSync(archive).size, sha256: archiveSha };
    };
    manager.probeBrowserBinary = async (binary) => ({ path: binary, version: '159.0.8149.0', browser: 'Chrome for Testing 159.0.8149.0' });
    try {
      const installed = await manager.installChromiumVersion('159.0.8149.0');
      assert.strictEqual(installed.engine, 'chromium');
      assert.ok(installed.path.endsWith(path.join('chromium-versions', '159.0.8149.0', 'chrome-linux64', 'chrome')));
      assert.ok(!manager.meta.pin, 'per-version install stays dormant');
      const list = manager.listInstalledKernels();
      assert.ok(list.some((k) => k.engine === 'chromium' && k.version === '159.0.8149.0'));
      await manager.pinKernel({ engine: 'chromium', version: '159.0.8149.0' });
      assert.strictEqual(manager.resolveInstalled().engine, 'chromium');
      assert.strictEqual(manager.resolveInstalled().version, '159.0.8149.0');
    } finally {
      kernelModule.downloadFile = origDownloadFile;
      manager.probeBrowserBinary = origProbe;
      await fsp.rm(tmp, { recursive: true, force: true });
      await fsp.rm(staging, { recursive: true, force: true });
    }
  });
} else {
  skip('installChromiumVersion end-to-end', 'zip fixture is linux/x64 only');
}

// ---------- Engine selection semantics (pure, on a manager with meta only) ----------
check('pin survives resolveInstalled and drives engine selection', async () => {
  const { manager, tmp } = await makeFakeManager();
  try {
    manager.meta.pin = { engine: 'firefox', version: '141.0', source: 'mozilla', path: '/nonexistent/firefox' };
    // stale pin whose tree vanished → falls through to default resolution
    const resolved = manager.resolveInstalled();
    assert.ok(!resolved || resolved.engine !== 'firefox');
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true });
  }
});

// ---------- Firefox pipeline module surface ----------
check('engine/start-firefox mixin exports and pure helpers', async () => {
  const mixin = require('../../engine/start-firefox');
  assert.strictEqual(typeof mixin._startFirefox, 'function');
  assert.strictEqual(typeof mixin.firefoxOsName, 'function');
  assert.strictEqual(typeof mixin.collectAcceptLanguages, 'function');
  assert.strictEqual(mixin.firefoxOsName({ os: 'macOS' }), 'mac');
  assert.strictEqual(mixin.firefoxOsName({ os: 'Windows 11' }), 'win');
  assert.strictEqual(mixin.firefoxOsName({}), 'linux');
  assert.deepStrictEqual(mixin.collectAcceptLanguages(null, { languages: ['ja-JP', 'en-US'] }), 'ja-JP,en-US');
  assert.deepStrictEqual(mixin.collectAcceptLanguages(null, { language: 'fr-FR' }), 'fr-FR');
  assert.deepStrictEqual(mixin.collectAcceptLanguages(null, {}), 'en-US');
});

// ---------- profile sanitizer carries engine ----------
check('sanitizeProfile preserves engine and defaults legacy profiles to chromium', () => {
  const { sanitizeProfile } = require('../../engine/profile-sanitizer');
  const base = { id: 'env-001', name: 'env-001' };
  assert.strictEqual(sanitizeProfile(base).engine, 'chromium');
  assert.strictEqual(sanitizeProfile({ ...base, engine: 'firefox' }).engine, 'firefox');
  assert.strictEqual(sanitizeProfile({ ...base, engine: 'garbage' }).engine, 'chromium');
});

console.log(`\nfirefox-kernel-selftest: ${passed} passed, ${failed} failed${skips.length ? `, ${skips.length} skipped` : ''}`);
for (const s of skips) console.log(`  skip  ${s}`);
process.exit(failed ? 1 : 0);
