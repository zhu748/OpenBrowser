'use strict';

/**
 * Independent Chromium kernel manager.
 *
 * Runtime policy: prefer integrated seeds under Browserapp/kernels/ and use the
 * official Google Chrome Stable package when a download is requested.
 * Custom user-selected Chromium binaries remain allowed.
 */

const { Downloader } = require('./downloader');
const { compareVersions } = require('./version-compare');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
const { isSystemBrowserExecutable } = require('./isolation');
const { ensureManifest, readManifest, verifyManifest, verifyManifestSeal, MANIFEST_FILENAME } = require('./asset-integrity');
const {
  CHROMIUM_CATALOG_URL,
  CHROMIUM_CATALOG_MAX_BYTES,
  CHROMIUM_CATALOG_TTL_MS,
  FIREFOX_RELEASES_URL,
  FIREFOX_VERSIONS_URL,
  FIREFOX_CATALOG_TTL_MS,
  FIREFOX_LOCALE,
  chromiumUrlForVersion,
  filterChromiumCatalog,
  filterFirefoxCatalog,
  firefoxPlatformDir,
  parseSha256Sums,
  firefoxArtifactFor,
  firefoxCdnUrl,
  firefoxSumsUrl,
  firefoxBinaryRelative,
  compareKernelVersions,
} = require('./kernel-versions');

/** Optional remote kernel feed URL (unused when integrated seeds are present). */
const WAYFERN_META = 'https://donutbrowser.com/wayfern.json';
/** Google Chrome for Testing stable channel (legacy/package fallback). */
const CFT_META = 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions-with-downloads.json';
const CHROME_STABLE_PACKAGES = Object.freeze({
  'linux:x64': { url: 'https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb', kind: 'deb' },
  'darwin:x64': { url: 'https://dl.google.com/chrome/mac/universal/stable/GGRO/googlechrome.dmg', kind: 'dmg' },
  'darwin:arm64': { url: 'https://dl.google.com/chrome/mac/universal/stable/GGRO/googlechrome.dmg', kind: 'dmg' },
  'win32:x64': { url: 'https://dl.google.com/chrome/install/googlechromestandaloneenterprise64.msi', kind: 'msi' },
  'win32:arm64': { url: 'https://dl.google.com/chrome/install/googlechromestandaloneenterprise64.msi', kind: 'msi' },
});

const SOURCE_WAYFERN = 'donut-wayfern';
const SOURCE_CFT = 'chrome-for-testing';
const SOURCE_CHROME_STABLE = 'chrome-stable';
const SOURCE_CUSTOM = 'custom';
/** Mozilla release archive (per-version Firefox kernels). */
const SOURCE_MOZILLA = 'mozilla';
/** Bundled / userData OpenBrowser 148 independent kernel. Default on macOS x64. */
const SOURCE_OPENBROWSER = 'openbrowser-148';
const OPENBROWSER_KERNEL_VERSION = '148.0.7778.165';
const WAYFERN_ACCEPT_TERMS_ARG = '--accept-terms-and-conditions';
const MAX_META_BYTES = 2 * 1024 * 1024;
const MAX_KERNEL_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_REDIRECTS = 6;
const MAX_ARCHIVE_ENTRIES = 100000;
// A full browser tree is a few thousand files; the cap only guards against a
// pathological tree, and a truncated listing still cannot hide a missing file.
const MAX_INTEGRITY_ENTRIES = 60000;
const KERNEL_HOSTS = new Set([
  'donutbrowser.com',
  'download.wayfern.com',
  'googlechromelabs.github.io',
  'storage.googleapis.com',
  'dl.google.com',
  // Firefox kernels: release metadata and the CDN that serves archives + SHA256SUMS.
  'product-details.mozilla.org',
  'download-installer.cdn.mozilla.net',
]);
const acceptedWayfernTerms = new Set();

function trustedKernelUrl(value) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || !KERNEL_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error(`Untrusted kernel download URL: ${parsed.origin}`);
  }
  return parsed;
}

// ---------------------------------------------------------------------------
// Archive digest pinning.
//
// Google publishes no checksums inside the Chrome-for-Testing metadata and the
// Wayfern feed has none today either, so a first download can only be trusted
// as far as TLS + the host allow-list go. What CAN be hardened is every
// download after the first: the digest of a known-good archive is recorded
// locally and any later fetch of the same versioned URL must reproduce it
// byte for byte. A compromised mirror (or a feed entry quietly repointed at
// different bytes) then fails closed instead of installing silently.
// Rolling "current" URLs (dl.google.com .../google-chrome-stable_current_...)
// legitimately change content under a fixed URL, so they are never pinned.
// ---------------------------------------------------------------------------

const ARCHIVE_DIGESTS_FILE = 'archive-digests.json';
const MAX_ARCHIVE_DIGEST_PINS = 32;
const SHA256_HEX = /^[0-9a-f]{64}$/;

function archiveDigestsPath(kernelsRoot) {
  return path.join(kernelsRoot, ARCHIVE_DIGESTS_FILE);
}

/**
 * Atomic write for the kernels/ bookkeeping files: unique temp file + fsync +
 * rename + directory fsync, so a crash never leaves a torn JSON file behind
 * (a torn archive-digests.json would silently disable digest verification).
 */
async function writeFileAtomic(targetPath, contents) {
  const directory = path.dirname(targetPath);
  await fsp.mkdir(directory, { recursive: true });
  const temporary = `${targetPath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  let handle = null;
  try {
    handle = await fsp.open(temporary, 'wx', 0o600);
    await handle.writeFile(contents);
    await handle.sync();
    await handle.close();
    handle = null;
    await fsp.rename(temporary, targetPath);
    try {
      const directoryHandle = await fsp.open(directory, 'r');
      await directoryHandle.sync();
      await directoryHandle.close();
    } catch (_) {}
  } finally {
    if (handle) await handle.close().catch(() => {});
    await fsp.rm(temporary, { force: true }).catch(() => {});
  }
}

/** A URL is pinnable only when it embeds a concrete version string. */
function isVersionedArchiveUrl(url, version) {
  const text = String(url || '');
  const ver = String(version || '');
  return Boolean(ver) && /^\d/.test(ver) && text.includes(ver);
}

async function loadArchiveDigests(kernelsRoot) {
  let raw;
  try {
    raw = await fsp.readFile(archiveDigestsPath(kernelsRoot), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return { pins: {} };
    // Exists but unreadable: the pins on disk are unknown, so this must never
    // be treated as "no pins yet" (that would silently disable verification).
    console.error(`[kernel] archive digest store unreadable (${ARCHIVE_DIGESTS_FILE}): ${error.message}`);
    return { pins: {}, corrupt: true };
  }
  try {
    const parsed = JSON.parse(raw);
    const pins = parsed && typeof parsed === 'object' && parsed.pins && typeof parsed.pins === 'object' ? parsed.pins : null;
    return pins ? { pins } : { pins: {} };
  } catch (error) {
    // A corrupt file used to be indistinguishable from "nothing pinned yet",
    // which fails open exactly where the design promises fail-closed.
    console.error(`[kernel] archive digest store corrupt (${ARCHIVE_DIGESTS_FILE}): ${error.message}; previously verified URLs will download unverified`);
    return { pins: {}, corrupt: true };
  }
}

/** Digest previously recorded for this exact URL, or null. */
async function pinnedArchiveSha256(kernelsRoot, url) {
  if (!url) return null;
  const { pins, corrupt } = await loadArchiveDigests(kernelsRoot);
  const entry = pins[url];
  const sha256 = entry && typeof entry === 'object' ? entry.sha256 : entry;
  const value = String(sha256 || '').toLowerCase();
  if (SHA256_HEX.test(value)) return value;
  // No usable pin is normally just "not pinned yet"; with a corrupt store it
  // means a previously verified URL is about to download unverified. The
  // download still proceeds (refusing would break users), but not silently.
  if (corrupt) {
    console.warn('[kernel] archive digest store corrupt; download will proceed unverified:', url);
  }
  return null;
}

/** Record the digest of a known-good archive; keeps the newest N pins. */
async function pinArchiveSha256(kernelsRoot, url, sha256) {
  const value = String(sha256 || '').toLowerCase();
  if (!url || !SHA256_HEX.test(value)) return false;
  try {
    const { pins } = await loadArchiveDigests(kernelsRoot);
    delete pins[url];
    pins[url] = { sha256: value, pinnedAt: new Date().toISOString() };
    const keys = Object.keys(pins);
    for (const stale of keys.slice(0, Math.max(0, keys.length - MAX_ARCHIVE_DIGEST_PINS))) {
      delete pins[stale];
    }
    await writeFileAtomic(
      archiveDigestsPath(kernelsRoot),
      JSON.stringify({ version: 1, pins }, null, 2) + '\n'
    );
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Pull an optional digest out of a kernel feed document. Accepts the shapes a
 * feed is likely to grow (`sha256`, `sha256Hex`, per-platform `checksums`),
 * validates the hex, and returns {} when nothing trustworthy is published.
 */
function extractFeedDigest(feed, platform) {
  const out = {};
  if (!feed || typeof feed !== 'object') return out;
  const direct = [feed.sha256, feed.sha256Hex];
  const checksums = feed.checksums && typeof feed.checksums === 'object' ? feed.checksums : {};
  const fromMap = checksums[platform] || checksums[String(platform || '').replace(/\s+/g, '')];
  const nested = fromMap && typeof fromMap === 'object' ? fromMap.sha256 : fromMap;
  const sha256 = String(direct.find(Boolean) || nested || '').trim().toLowerCase();
  if (SHA256_HEX.test(sha256)) out.sha256 = sha256;
  const md5 = String(feed.md5 || (fromMap && typeof fromMap === 'object' ? fromMap.md5 : '') || '').trim().toLowerCase();
  if (/^[0-9a-f]{32}$/.test(md5)) out.md5 = md5;
  return out;
}

function validateArchiveMemberName(value) {
  const name = String(value || '').replace(/\\/g, '/');
  if (!name || name.includes('\0') || name.startsWith('/') || /^[A-Za-z]:\//.test(name)) {
    throw new Error('Kernel archive contains an absolute or invalid path');
  }
  const parts = name.split('/').filter(Boolean);
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
  if (parts.some((part) => part === '..' || part.includes(':') || /[. ]$/.test(part) || reserved.test(part))) {
    throw new Error('Kernel archive contains an unsafe path segment');
  }
  return name;
}

async function preflightArchiveMembers(archivePath, kind) {
  if (kind === 'dmg') return;
  let stdout;
  if (kind === 'zip') {
    if (process.platform === 'win32') {
      const escaped = archivePath.replace(/'/g, "''");
      const script = [
        'Add-Type -AssemblyName System.IO.Compression.FileSystem',
        `$z=[System.IO.Compression.ZipFile]::OpenRead('${escaped}')`,
        "try { $z.Entries | ForEach-Object { $mode=($_.ExternalAttributes -shr 16) -band 0xF000; \"$($_.FullName)`t$mode\" } } finally { $z.Dispose() }",
      ].join('; ');
      ({ stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', script], {
        windowsHide: true,
        maxBuffer: 32 * 1024 * 1024,
      }));
      const rows = String(stdout || '').split(/\r?\n/).filter(Boolean);
      if (!rows.length || rows.length > MAX_ARCHIVE_ENTRIES) throw new Error('Kernel archive entry count is invalid');
      for (const row of rows) {
        const split = row.lastIndexOf('\t');
        const name = split >= 0 ? row.slice(0, split) : row;
        const mode = split >= 0 ? Number(row.slice(split + 1)) : 0;
        validateArchiveMemberName(name);
        if (mode === 0xA000) throw new Error('Kernel ZIP contains a symbolic link');
      }
      return;
    } else {
      ({ stdout } = await execFileAsync('unzip', ['-Z1', archivePath], { maxBuffer: 32 * 1024 * 1024 }));
      const names = String(stdout || '').split(/\r?\n/).filter(Boolean);
      if (!names.length || names.length > MAX_ARCHIVE_ENTRIES) throw new Error('Kernel archive entry count is invalid');
      for (const name of names) validateArchiveMemberName(name);
      const listing = await execFileAsync('unzip', ['-Z', '-l', archivePath], { maxBuffer: 32 * 1024 * 1024 });
      if (String(listing.stdout || '').split(/\r?\n/).some((line) => /^l[rwx-]{9}\s/.test(line))) {
        throw new Error('Kernel ZIP contains a symbolic link');
      }
      return;
    }
  } else {
    ({ stdout } = await execFileAsync('tar', ['-tf', archivePath], { maxBuffer: 32 * 1024 * 1024 }));
    const names = String(stdout || '').split(/\r?\n/).filter(Boolean);
    if (!names.length || names.length > MAX_ARCHIVE_ENTRIES) throw new Error('Kernel archive entry count is invalid');
    for (const name of names) validateArchiveMemberName(name);
    const listing = await execFileAsync('tar', ['-tvf', archivePath], { maxBuffer: 32 * 1024 * 1024 });
    if (String(listing.stdout || '').split(/\r?\n/).some((line) => line[0] === 'l' || line[0] === 'h')) {
      throw new Error('Kernel TAR contains a link');
    }
    return;
  }
}

async function assertSafeExtractedTree(root) {
  const base = await fsp.realpath(root);
  const stack = [base];
  let count = 0;
  while (stack.length) {
    const dir = stack.pop();
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      count += 1;
      if (count > MAX_ARCHIVE_ENTRIES) throw new Error('Extracted kernel contains too many files');
      const full = path.join(dir, entry.name);
      const stat = await fsp.lstat(full);
      if (stat.isSymbolicLink()) {
        const target = await fsp.realpath(full).catch(() => null);
        if (!target || !isPathInsideRoot(target, base)) throw new Error('Extracted kernel contains an unsafe link');
        continue;
      }
      if (stat.isDirectory()) stack.push(full);
      else if (!stat.isFile()) throw new Error('Extracted kernel contains a special file');
    }
  }
}

function isPathInsideRoot(candidate, root) {
  const child = path.resolve(candidate);
  const base = path.resolve(root);
  const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
  return normalize(child) === normalize(base) || normalize(child).startsWith(normalize(base) + path.sep);
}

function safeInstalledBinary(candidate, root) {
  if (!candidate || !root) return null;
  const lexical = path.resolve(candidate);
  const base = path.resolve(root);
  if (!isPathInsideRoot(lexical, base)) return null;
  try {
    const linkStat = fs.lstatSync(lexical);
    if (linkStat.isSymbolicLink() || !linkStat.isFile()) return null;
    const real = fs.realpathSync.native(lexical);
    const realBase = fs.realpathSync.native(base);
    return isPathInsideRoot(real, realBase) ? lexical : null;
  } catch (_) {
    return null;
  }
}

function donutPlatformKey() {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  if (process.platform === 'darwin') return `macos-${arch}`;
  if (process.platform === 'win32') return `windows-${arch}`;
  return `linux-${arch}`;
}

function cftPlatformKey() {
  if (process.platform === 'darwin') return process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  if (process.platform === 'win32') return 'win64';
  return 'linux64';
}

function chromeStablePackage() {
  return CHROME_STABLE_PACKAGES[`${process.platform}:${process.arch}`] || null;
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

/** Relative path of the OpenBrowser 148 launcher (shell wrapper → OpenBrowser.bin). */
function openBrowserKernelBinaryRelative() {
  // Flat integrated layout: Browserapp/kernels/macos-x64/...
  // Compat: kernels/openbrowser -> macos-x64 symlink still works via candidates.
  return path.join(
    'macos-x64',
    'chrome_148',
    'openbrowser_148',
    'OpenBrowser.app',
    'Contents',
    'MacOS',
    'OpenBrowser'
  );
}

function isMacX64Host() {
  return process.platform === 'darwin' && process.arch === 'x64';
}

/**
 * openbrowser-148 is a macOS Intel (x86_64) kernel only.
 * Never package it for other platforms; never auto-select it at runtime elsewhere.
 * @param {string} [platform=process.platform]
 * @param {string} [arch=process.arch] node arch (x64/arm64) or package arch (x86_64/arm64)
 */
function isOpenBrowser148SupportedHost(platform = process.platform, arch = process.arch) {
  const p = String(platform || '').toLowerCase();
  const a = String(arch || '').toLowerCase();
  const isX64 = a === 'x64' || a === 'x86_64' || a === 'amd64';
  return p === 'darwin' && isX64;
}

/**
 * Locate OpenBrowser 148 kernel under kernelsRoot or optional resource roots.
 * Preferred layout: kernels/macos-x64/chrome_148/openbrowser_148/OpenBrowser.app/Contents/MacOS/OpenBrowser
 * Compat layout:   kernels/openbrowser/... (symlink or legacy tree)
 * Returns null on non-macOS-x64 hosts so a stray kernels tree cannot be selected.
 */
function findOpenBrowserKernelBinary(kernelsRoot, extraRoots = []) {
  if (!isOpenBrowser148SupportedHost()) return null;
  const rel = openBrowserKernelBinaryRelative();
  const legacyRel = path.join(
    'openbrowser',
    'chrome_148',
    'openbrowser_148',
    'OpenBrowser.app',
    'Contents',
    'MacOS',
    'OpenBrowser'
  );
  const roots = [];
  const push = (r) => {
    if (!r) return;
    const s = String(r).trim();
    if (s && !roots.includes(s)) roots.push(s);
  };
  push(kernelsRoot);
  for (const r of extraRoots || []) push(r);
  try {
    push(process.env.OPENBROWSER_KERNEL_ROOT);
  } catch (_) {}

  const candidates = [];
  for (const root of roots) {
    // root is .../kernels → flat seed
    candidates.push(path.join(root, rel));
    // legacy kernels/openbrowser/...
    candidates.push(path.join(root, legacyRel));
    // root is the seed dir itself (macos-x64 or openbrowser)
    candidates.push(path.join(root, 'chrome_148', 'openbrowser_148', 'OpenBrowser.app', 'Contents', 'MacOS', 'OpenBrowser'));
    // root is app/source dir
    candidates.push(path.join(root, 'kernels', rel));
    candidates.push(path.join(root, 'kernels', legacyRel));
    // process.resourcesPath / resources/app
    candidates.push(path.join(root, 'app', 'kernels', rel));
    candidates.push(path.join(root, 'app', 'kernels', legacyRel));
  }
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return path.resolve(candidate);
    } catch (_) {}
  }
  return null;
}

function kernelDisplayName(source) {
  if (source === SOURCE_OPENBROWSER) return 'OpenBrowser 148';
  if (source === SOURCE_WAYFERN) return '独立内核';
  if (source === SOURCE_CHROME_STABLE) return 'Google Chrome Stable';
  if (source === SOURCE_CUSTOM) return 'Custom Chromium';
  if (source === SOURCE_CFT) return 'Chrome for Testing';
  if (source === SOURCE_MOZILLA) return 'Firefox';
  return 'Independent Chromium';
}

function isWayfernKernel(candidate = {}, versionOutput = '') {
  const source = String(candidate.source || '').toLowerCase();
  const binaryPath = String(candidate.path || candidate.binary || candidate || '').toLowerCase().replace(/\\/g, '/');
  const version = String(versionOutput || candidate.versionOutput || '').toLowerCase();
  return source === SOURCE_WAYFERN
    || /(?:^|\/)wayfern(?:\/|$)/.test(binaryPath)
    // Flat integrated seeds (no "wayfern" segment in path)
    || /(?:^|\/)kernels\/(?:windows-x64|macos-arm64)(?:\/|$)/.test(binaryPath)
    || /(?:^|\/)(?:windows-x64|macos-arm64)\/(?:chrome\.exe|wayfern(?:\.exe)?|chromium(?:\.exe)?)$/.test(binaryPath)
    || /\bwayfern\b/.test(version);
}

/**
 * Locate companion library that hosts CDP session policy for integrated kernels.
 * Windows: chrome.dll next to chrome.exe
 * macOS arm64: Wayfern Framework inside .app
 */
function companionLibraryForKernelBinary(binaryPath = '') {
  const binary = path.resolve(String(binaryPath || ''));
  if (!binary || !fs.existsSync(binary)) return null;
  const dir = path.dirname(binary);
  const base = path.basename(binary).toLowerCase();
  if (process.platform === 'win32' || /\.exe$/i.test(binary)) {
    const dll = path.join(dir, 'chrome.dll');
    return fs.existsSync(dll) ? dll : null;
  }
  // .../Wayfern.app/Contents/MacOS/Wayfern → Frameworks/.../Wayfern Framework
  if (/\/Contents\/MacOS\//i.test(binary.replace(/\\/g, '/'))) {
    const contents = path.resolve(dir, '..');
    const versions = path.join(contents, 'Frameworks', 'Wayfern Framework.framework', 'Versions');
    if (fs.existsSync(versions)) {
      let ver = 'Current';
      try {
        const names = fs.readdirSync(versions).filter((n) => n !== 'Current');
        if (names.length) ver = names.sort().reverse()[0];
      } catch (_) {}
      const fw = path.join(versions, ver, 'Wayfern Framework');
      if (fs.existsSync(fw)) return fw;
      const cur = path.join(versions, 'Current', 'Wayfern Framework');
      if (fs.existsSync(cur)) return cur;
    }
  }
  // binary is already the framework dylib
  if (/Wayfern Framework$/i.test(base) || /Chromium Framework$/i.test(base)) return binary;
  return null;
}

/** Byte markers that must be present for local CDP session policy on integrated kernels. */
const INTEGRATED_KERNEL_CDP_MARKERS = Object.freeze({
  // chrome.dll 149.0.7827.114 (windows-x64 seed)
  'win-chrome-dll-149': [
    { fo: 0x37e6551, bytes: Buffer.from('909090909090', 'hex') },
    { fo: 0x41fddd0, bytes: Buffer.from('b001c3', 'hex') },
  ],
  // Wayfern Framework 149.0.7827.114 (macos-arm64 seed)
  'mac-framework-149': [
    { fo: 0x2d0c2d4, bytes: Buffer.from('1f2003d5', 'hex') },
    { fo: 0x3504df8, bytes: Buffer.from('20008052c0035fd6', 'hex') },
  ],
});

function readFileSlice(filePath, offset, length) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(length);
    const n = fs.readSync(fd, buf, 0, length, offset);
    return n === length ? buf : null;
  } finally {
    try { fs.closeSync(fd); } catch (_) {}
  }
}

function markersMatch(filePath, markers) {
  if (!filePath || !fs.existsSync(filePath) || !Array.isArray(markers) || !markers.length) return false;
  try {
    const st = fs.statSync(filePath);
    for (const m of markers) {
      const fo = Number(m.fo);
      const expect = Buffer.isBuffer(m.bytes) ? m.bytes : Buffer.from(String(m.bytes || ''), 'hex');
      if (!Number.isFinite(fo) || fo < 0 || !expect.length) return false;
      if (st.size < fo + expect.length) return false;
      const got = readFileSlice(filePath, fo, expect.length);
      if (!got || !got.equals(expect)) return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * True when the integrated kernel binary is ready for local CDP / RPA.
 * openbrowser-148 and custom Chromium are treated as ready (no companion markers).
 * Windows/macOS-arm integrated seeds require companion library markers.
 */
function isIntegratedKernelCdpReady(candidate = {}) {
  const binary = String(candidate.path || candidate.binary || candidate || '').trim();
  if (!binary || !fs.existsSync(binary)) return false;
  const source = String(candidate.source || '').toLowerCase();
  if (source === SOURCE_OPENBROWSER || source === SOURCE_CUSTOM || source === SOURCE_CFT || source === SOURCE_CHROME_STABLE) return true;
  if (isOpenBrowser148SupportedHost() && /openbrowser_148|kernels[/\\](macos-x64|openbrowser)[/\\]/i.test(binary)) {
    return true;
  }
  if (!isWayfernKernel({ path: binary, source })) {
    // Unknown independent Chromium — allow (custom-like)
    return true;
  }
  const lib = companionLibraryForKernelBinary(binary);
  if (!lib) return false;
  const lower = lib.toLowerCase().replace(/\\/g, '/');
  if (lower.endsWith('chrome.dll')) {
    return markersMatch(lib, INTEGRATED_KERNEL_CDP_MARKERS['win-chrome-dll-149']);
  }
  if (/wayfern framework$|chromium framework$/i.test(path.basename(lib))) {
    return markersMatch(lib, INTEGRATED_KERNEL_CDP_MARKERS['mac-framework-149']);
  }
  return false;
}

function termsAcceptanceArgsForKernel(candidate = {}, versionOutput = '') {
  return isWayfernKernel(candidate, versionOutput) ? [WAYFERN_ACCEPT_TERMS_ARG] : [];
}

function wayfernLicenseAcceptedPath() {
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(base, 'Wayfern', 'license-accepted');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Wayfern', 'license-accepted');
  }
  return path.join(os.homedir(), '.config', 'Wayfern', 'license-accepted');
}

function wayfernTermsAlreadyAccepted() {
  try {
    return fs.existsSync(wayfernLicenseAcceptedPath());
  } catch (_) {
    return false;
  }
}

function looksLikeTermsAcceptedOutput(text = '') {
  return /Terms and Conditions accepted|License recorded|You can now run Wayfern normally/i.test(String(text || ''));
}

async function ensureKernelReadyForLaunch(candidate = {}, versionOutput = '') {
  const binary = String(candidate.path || candidate.binary || candidate || '').trim();
  if (!binary) throw new Error('内核不可用：缺少内核路径');

  // Integrated Windows/mac-arm seeds must be CDP-ready before spawn (RPA / Local API).
  if (isWayfernKernel({ ...candidate, path: binary }, versionOutput)
    && !isIntegratedKernelCdpReady({ ...candidate, path: binary })) {
    throw new Error(
      '独立内核未就绪（CDP 会话策略不匹配）。请使用安装包内 kernels/windows-x64 或 kernels/macos-arm64 的完整内核，'
      + '并删除 userData 下过期的 kernels 副本后重试。'
      + ` binary=${binary}`
    );
  }

  const args = termsAcceptanceArgsForKernel(candidate, versionOutput);
  if (!args.length) return false;

  const cacheKey = [path.resolve(binary), process.env.APPDATA || process.env.HOME || ''].join('\0');
  if (acceptedWayfernTerms.has(cacheKey) || wayfernTermsAlreadyAccepted()) {
    acceptedWayfernTerms.add(cacheKey);
    return true;
  }

  try {
    // One-shot accept process: it is expected to exit after writing license-accepted.
    // Do NOT pass this flag to the long-lived browser spawn.
    const { stdout, stderr } = await execFileAsync(binary, args, {
      timeout: 20000,
      windowsHide: true,
      maxBuffer: 256 * 1024,
    });
    acceptedWayfernTerms.add(cacheKey);
    return true;
  } catch (error) {
    const output = [error.stdout, error.stderr, error.message]
      .map((value) => String(value || '').trim())
      .filter(Boolean)
      .join(' | ');
    // Some builds exit non-zero after successfully recording the license.
    if (looksLikeTermsAcceptedOutput(output) || wayfernTermsAlreadyAccepted()) {
      acceptedWayfernTerms.add(cacheKey);
      return true;
    }
    throw new Error('内核条款初始化失败：' + (output || 'accept-terms command failed'));
  }
}

function fetchJson(url, redirects = 0, maxBytes = MAX_META_BYTES) {
  if (redirects > MAX_REDIRECTS) return Promise.reject(new Error('Kernel metadata redirected too many times'));
  const parsed = trustedKernelUrl(url);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      handler(value);
    };
    const req = https.get(parsed, { headers: { 'User-Agent': 'OpenBrowser/1.0 (kernel)' }, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return fetchJson(new URL(res.headers.location, parsed).toString(), redirects + 1, maxBytes)
          .then((value) => finish(resolve, value), (error) => finish(reject, error));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return finish(reject, new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      const chunks = []; let size = 0;
      res.on('data', (c) => {
        if (settled) return;
        size += c.length;
        if (size > maxBytes) {
          const error = new Error(`Kernel metadata exceeds ${Math.round(maxBytes / 1024 / 1024)} MiB`);
          finish(reject, error);
          res.destroy(error);
          req.destroy(error);
        } else {
          chunks.push(c);
        }
      });
      res.on('error', (error) => finish(reject, error));
      res.on('end', () => {
        if (settled) return;
        try { finish(resolve, JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { finish(reject, e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Kernel metadata request timed out')));
    req.on('error', (error) => finish(reject, error));
  });
}

/** Fetch a trusted-host text document (Firefox SHA256SUMS). */
function fetchText(url, { maxBytes = MAX_META_BYTES, timeoutMs = 30000 } = {}) {
  const parsed = trustedKernelUrl(url);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      handler(value);
    };
    const req = https.get(parsed, { headers: { 'User-Agent': 'OpenBrowser/1.0 (kernel)' }, timeout: timeoutMs }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return finish(reject, new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      const chunks = []; let size = 0;
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        if (settled) return;
        size += chunk.length;
        if (size > maxBytes) {
          const error = new Error(`Kernel text document exceeds ${maxBytes} bytes`);
          finish(reject, error);
          res.destroy(error);
          req.destroy(error);
        } else {
          chunks.push(chunk);
        }
      });
      res.on('error', (error) => finish(reject, error));
      res.on('end', () => {
        if (settled) return;
        finish(resolve, chunks.join(''));
      });
    });
    req.on('timeout', () => req.destroy(new Error('Kernel text request timed out')));
    req.on('error', (error) => finish(reject, error));
  });
}

/**
 * Fetch a kernel archive.
 *
 * Behaviour that matters for a payload this size, and that a bare
 * `https.get` does not give:
 *   - the transfer resumes from a leftover partial file when the server
 *     supports range requests, so a dropped connection does not restart a
 *     multi-hundred-megabyte download;
 *   - the archive lands in a sibling partial file and is only moved into place
 *     once it is complete, so an interrupted run never leaves a truncated file
 *     where the extractor expects a whole one;
 *   - a response that announces more bytes than it delivers is rejected as
 *     truncated, and a supplied SHA-256/MD5 digest is enforced before the file
 *     is promoted (fail closed);
 *   - the byte ceiling is enforced on the announced length *and* while the
 *     body streams, because a chunked response announces nothing;
 *   - `trustedKernelUrl` vets every hop, not just the first, so a redirect
 *     cannot move the transfer off the allowed hosts.
 *
 * @param {{expectedSha256?:string, expectedMd5?:string}} [options] Digests to
 *   enforce; the SHA-256 of the transfer is always computed and returned so the
 *   caller can pin it for later downloads.
 * @returns {Promise<{path:string, bytes:number, sha256:string|null}>}
 */
function downloadFile(url, dest, onProgress, options = {}) {
  const downloader = new Downloader(url, {
    destPath: dest,
    resume: true,
    retries: 2,
    timeoutMs: 60000,
    headers: { 'User-Agent': 'OpenBrowser/1.0 (kernel)' },
    maxBytes: MAX_KERNEL_BYTES,
    validateUrl: (target) => { trustedKernelUrl(target); },
    expectedSha256: options.expectedSha256 || '',
    expectedMd5: options.expectedMd5 || '',
    computeSha256: true,
  });

  if (typeof onProgress === 'function') {
    downloader.on('progress', ({ received, total }) => {
      if (!total) return;
      onProgress({ received, total, percent: Math.floor((received / total) * 100) });
    });
  }

  return downloader.start().then((result) => ({
    path: result.path,
    bytes: result.bytes,
    sha256: result.sha256 || null,
  }));
}


function requestJson(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('CDP probe timed out')));
    req.on('error', reject);
  });
}

async function waitForDevToolsPort(root, timeout = 12000) {
  const file = path.join(root, 'DevToolsActivePort');
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const value = await fsp.readFile(file, 'utf8');
      const port = Number(value.split(/\r?\n/)[0]);
      if (Number.isInteger(port) && port > 0) return port;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error('浏览器未在限定时间内提供 CDP 调试端口');
}

function startupOutput(child) {
  return [child?._startupStdout, child?._startupStderr]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(' | ');
}

async function stopProbeProcess(child) {
  if (!child || child.exitCode !== null) return;
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 3000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
  });
  if (child.exitCode === null) child.kill('SIGKILL');
}

async function extractZip(zipPath, destDir) {
  await preflightArchiveMembers(zipPath, 'zip');
  await new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      const ps = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`;
      execFile('powershell.exe', ['-NoProfile', '-Command', ps], { windowsHide: true }, (err) => (err ? reject(err) : resolve()));
      return;
    }
    execFile('unzip', ['-o', '-q', zipPath, '-d', destDir], (err) => {
      if (err) {
        if (process.platform === 'darwin') {
          execFile('ditto', ['-x', '-k', zipPath, destDir], (e2) => (e2 ? reject(err) : resolve()));
          return;
        }
        return reject(err);
      }
      resolve();
    });
  });
  await assertSafeExtractedTree(destDir);
}

async function extractDeb(debPath, destDir) {
  if (process.platform !== 'linux') throw new Error('DEB 仅支持 Linux');
  await execFileAsync('dpkg-deb', ['-x', debPath, destDir]);
  // Keep only /opt/google/chrome. The Debian package also contains system-wide
  // launchers/cron hooks with absolute symlinks that are irrelevant here.
  for (const systemPath of ['usr', 'etc']) {
    await fsp.rm(path.join(destDir, systemPath), { recursive: true, force: true });
  }
  await assertSafeExtractedTree(destDir);
}

async function extractMsi(msiPath, destDir) {
  if (process.platform !== 'win32') throw new Error('MSI 仅支持 Windows');
  await execFileAsync('msiexec.exe', ['/a', msiPath, `/qn`, '/norestart', `TARGETDIR=${destDir}`], {
    windowsHide: true,
    timeout: 120000,
  });
  await assertSafeExtractedTree(destDir);
}

async function extractTarXz(archivePath, destDir) {
  await preflightArchiveMembers(archivePath, 'tar.xz');
  await execFileAsync('tar', ['-xJf', archivePath, '-C', destDir]);
  await assertSafeExtractedTree(destDir);
}

async function extractTarGz(archivePath, destDir) {
  await preflightArchiveMembers(archivePath, 'tar.gz');
  await execFileAsync('tar', ['-xzf', archivePath, '-C', destDir]);
  await assertSafeExtractedTree(destDir);
}

/**
 * macOS: mount DMG, copy first .app into destDir, detach.
 * High-level DMG extract helper for macOS kernel archives.
 */
async function extractDmg(dmgPath, destDir) {
  if (process.platform !== 'darwin') throw new Error('DMG 仅支持 macOS');
  const mountRoot = path.join(destDir, '_dmg_mount');
  await fsp.mkdir(mountRoot, { recursive: true });
  let mountPoint = null;
  try {
    const { stdout } = await execFileAsync('hdiutil', [
      'attach', dmgPath, '-nobrowse', '-readonly', '-mountroot', mountRoot,
    ], { maxBuffer: 4 * 1024 * 1024 });
    // Prefer scanning mountRoot for .app; fallback parse plist-ish output for /Volumes/
    const entries = await fsp.readdir(mountRoot, { withFileTypes: true }).catch(() => []);
    const vol = entries.find((e) => e.isDirectory());
    if (vol) mountPoint = path.join(mountRoot, vol.name);
    if (!mountPoint) {
      const m = String(stdout || '').match(/\/Volumes\/[^\n\t]+/);
      if (m) mountPoint = m[0].trim();
    }
    if (!mountPoint || !fs.existsSync(mountPoint)) throw new Error('无法挂载 DMG');

    const apps = (await fsp.readdir(mountPoint, { withFileTypes: true }))
      .filter((e) => e.isDirectory() && e.name.endsWith('.app'))
      .map((e) => path.join(mountPoint, e.name));
    if (!apps.length) throw new Error('DMG 内未找到 .app');

    const appName = path.basename(apps[0]);
    const targetApp = path.join(destDir, appName);
    await fsp.rm(targetApp, { recursive: true, force: true }).catch(() => {});
    // ditto preserves resource forks / codesign better than cp -R
    await execFileAsync('ditto', [apps[0], targetApp]);
    await assertSafeExtractedTree(targetApp);
  } finally {
    // detach everything under mountRoot
    try {
      const kids = await fsp.readdir(mountRoot).catch(() => []);
      for (const name of kids) {
        await execFileAsync('hdiutil', ['detach', path.join(mountRoot, name), '-quiet']).catch(() => {});
      }
      await execFileAsync('hdiutil', ['detach', mountRoot, '-quiet']).catch(() => {});
    } catch (_) {}
    await fsp.rm(mountRoot, { recursive: true, force: true }).catch(() => {});
  }
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

/** Locate a Chrome for Testing seed bundled beside the application resources. */
function findBundledChromeForTesting(resourceRoots = []) {
  const roots = [];
  const addRoot = (root) => {
    if (!root) return;
    const value = path.resolve(String(root));
    if (!roots.includes(value)) roots.push(value);
  };
  for (const root of resourceRoots || []) {
    addRoot(path.join(root, 'kernels', 'chrome-for-testing'));
    addRoot(path.join(root, 'app', 'kernels', 'chrome-for-testing'));
    addRoot(path.join(root, 'chrome-for-testing'));
  }
  const relative = chromeForTestingBinaryRelative(cftPlatformKey());
  for (const root of roots) {
    const binary = path.join(root, relative);
    const trusted = safeInstalledBinary(binary, root);
    if (trusted) return { binary: trusted, root };
  }
  return null;
}

/** Locate a standard Google Chrome Stable package installed beside the app. */
function findBundledChromeStable(resourceRoots = []) {
  const roots = [];
  const addRoot = (root) => {
    if (!root) return;
    const value = path.resolve(String(root));
    if (!roots.includes(value)) roots.push(value);
  };
  for (const root of resourceRoots || []) {
    addRoot(path.join(root, 'kernels', 'chrome-stable'));
    addRoot(path.join(root, 'app', 'kernels', 'chrome-stable'));
    addRoot(path.join(root, 'chrome-stable'));
  }
  const relative = chromeStableBinaryRelative();
  for (const root of roots) {
    const binary = safeInstalledBinary(path.join(root, relative), root);
    if (binary) return { binary, root };
  }
  return null;
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

function archiveKindFromUrl(url) {
  const u = String(url || '').toLowerCase();
  if (u.endsWith('.deb')) return 'deb';
  if (u.endsWith('.msi')) return 'msi';
  if (u.endsWith('.dmg')) return 'dmg';
  if (u.endsWith('.tar.xz') || u.endsWith('.txz')) return 'tar.xz';
  if (u.endsWith('.tar.gz') || u.endsWith('.tgz')) return 'tar.gz';
  if (u.endsWith('.zip')) return 'zip';
  if (u.includes('.dmg')) return 'dmg';
  if (u.includes('.tar.xz')) return 'tar.xz';
  if (u.includes('.zip')) return 'zip';
  return 'zip';
}

class BrowserKernelManager {
  constructor(userDataPath, options = {}) {
    this.userData = userDataPath;
    this.kernelsRoot = path.join(userDataPath, 'kernels');
    this.metaFile = path.join(this.kernelsRoot, 'kernel-meta.json');
    this.onProgress = options.onProgress || (() => {});
    this.installPromise = null;
    // Result of the most recent install-tree check; surfaced through status().
    this.integritySummary = null;
    // Optional extra roots (e.g. process.resourcesPath) for bundled mac x64 kernel seed
    this.resourceRoots = Array.isArray(options.resourceRoots)
      ? options.resourceRoots.filter(Boolean)
      : (options.resourceRoot ? [options.resourceRoot] : []);
    this.meta = {
      version: null,
      platform: donutPlatformKey(),
      binary: null,
      updatedAt: null,
      source: null,
      remoteVersion: null,
      downloadUrl: null,
    };
  }

  async loadMeta() {
    try {
      this.meta = { ...this.meta, ...JSON.parse(await fsp.readFile(this.metaFile, 'utf8')) };
    } catch (error) {
      // A missing file is the normal first run; anything else means the pin
      // or install root recorded in it may be silently lost.
      if (error.code !== 'ENOENT') {
        console.warn('[kernel] kernel-meta.json unreadable, continuing with defaults:', error.message);
      }
    }
    // Reconcile the metadata with a kernel discovered in the current data root.
    const installed = this.resolveInstalled();
    if (installed && (this.meta.binary !== installed.path || this.meta.source !== installed.source)) {
      this.meta.binary = installed.path;
      this.meta.source = installed.source;
      if (installed.version) this.meta.version = installed.version;
      this.meta.updatedAt = new Date().toISOString();
      await this.saveMeta();
    }
    return this.meta;
  }

  async saveMeta() {
    await writeFileAtomic(this.metaFile, JSON.stringify(this.meta, null, 2));
  }

  /**
   * Resolve the tree the integrity record covers.
   *
   * Only a tree this manager installed is covered, and only when it still sits
   * inside the data root: an arbitrary path carried in the metadata must never
   * make the manager describe somebody else's directory.
   */
  kernelIntegrityRoot() {
    const recorded = String(this.meta.installRoot || '');
    if (!recorded) return null;
    const root = path.resolve(recorded);
    const base = path.resolve(this.kernelsRoot);
    const inside = root === base || root.startsWith(base + path.sep);
    if (!inside || root === base) return null;
    return root;
  }

  /**
   * Write the integrity manifest for a tree WITHOUT pointing the active-kernel
   * record at it. Used by per-version installs that stay dormant until pinned.
   */
  async baselineTree(target) {
    const resolved = path.resolve(String(target || ''));
    const base = path.resolve(this.kernelsRoot);
    if (!resolved || (resolved !== base && !resolved.startsWith(base + path.sep))) {
      return { status: 'skipped', reason: 'outside-data-root' };
    }
    try {
      const result = await ensureManifest(resolved, {
        exclude: [MANIFEST_FILENAME],
        maxEntries: MAX_INTEGRITY_ENTRIES,
        checkMtime: false,
      });
      let files = result.report?.checked ?? null;
      if (files === null) {
        try {
          const recorded = await readManifest(resolved);
          files = Array.isArray(recorded?.files) ? recorded.files.length : null;
        } catch (_) { files = null; }
      }
      return { status: result.status === 'created' ? 'baselined' : result.status, files };
    } catch (error) {
      return { status: 'skipped', reason: String(error?.message || error) };
    }
  }

  /** Point the active-kernel integrity record at an installed tree. */
  async pointIntegrityAt(root) {
    const target = path.resolve(String(root || ''));
    const base = path.resolve(this.kernelsRoot);
    if (!target.startsWith(base + path.sep) || target === base) return false;
    this.meta.installRoot = target;
    await this.saveMeta();
    return true;
  }

  /**
   * Record the freshly installed tree so a later run can tell whether files
   * disappeared or were truncated.
   *
   * Sizes are compared rather than timestamps: the tree may legitimately be
   * copied into place by an installer, which rewrites every mtime.
   * Bookkeeping must never fail an install, so every error is swallowed.
   */
  async recordInstallBaseline(root) {
    const target = path.resolve(String(root || ''));
    const base = path.resolve(this.kernelsRoot);
    if (!target || (target !== base && !target.startsWith(base + path.sep))) {
      this.integritySummary = { status: 'skipped', reason: 'outside-data-root', checkedAt: new Date().toISOString() };
      return this.integritySummary;
    }
    const summary = await this.baselineTree(target);
    this.integritySummary = { ...summary, checkedAt: new Date().toISOString() };
    await this.pointIntegrityAt(target);
    return this.integritySummary;
  }

  /**
   * Compare the installed tree against its recorded baseline.
   *
   * Reports a truncated or removed file as a warning instead of letting the
   * launch fail later with a message that says nothing about the cause.
   */
  async checkInstalledKernelIntegrity() {
    const root = this.kernelIntegrityRoot();
    const checkedAt = new Date().toISOString();
    if (!root) {
      this.integritySummary = { status: 'unbaselined', checkedAt };
      return this.integritySummary;
    }
    let manifest = null;
    try {
      manifest = await readManifest(root);
    } catch (_) {
      manifest = null;
    }
    if (!manifest) {
      this.integritySummary = { status: 'unbaselined', root, checkedAt };
      return this.integritySummary;
    }
    // Seal gate: the manifest sits beside the files it describes, so it must
    // carry a valid HMAC to be trusted at all. An invalid seal means someone
    // rewrote it without the machine-derived key — treat as tampered, never
    // silently rebuild. Legacy (unsealed) manifests keep the stat-only rules;
    // recordInstallBaseline upgrades them to the sealed+hashed form.
    const seal = verifyManifestSeal(manifest, root);
    if (seal === 'invalid') {
      this.integritySummary = {
        status: 'mismatch',
        reason: 'manifest-seal-invalid',
        root,
        checkedAt,
      };
      this.onProgress({
        phase: 'integrity',
        code: 'KERNEL_INTEGRITY_MANIFEST_TAMPERED',
        level: 'warning',
        message: '内核完整性清单校验失败：清单被重写且无法重新封签，内核文件可能被篡改。建议重新安装内核。',
      });
      return this.integritySummary;
    }
    let report;
    try {
      report = await verifyManifest(root, manifest, { checkMtime: false, maxEntries: MAX_INTEGRITY_ENTRIES });
    } catch (error) {
      this.integritySummary = { status: 'error', reason: String(error?.message || error), root, checkedAt };
      return this.integritySummary;
    }
    this.integritySummary = {
      status: report.ok ? 'ok' : 'mismatch',
      root,
      checked: report.checked,
      missing: report.missing.length,
      changed: report.changed.length,
      missingPaths: report.missing.slice(0, 5),
      changedPaths: report.changed.slice(0, 5),
      hashed: report.hashed || 0,
      sealed: seal === 'valid',
      checkedAt,
    };
    if (!report.ok) {
      this.onProgress({
        phase: 'integrity',
        code: 'KERNEL_INTEGRITY_MISMATCH',
        level: 'warning',
        message: `内核文件与安装记录不一致：缺失 ${report.missing.length} 个、被改动 ${report.changed.length} 个文件。建议重新安装内核。`,
        missing: this.integritySummary.missingPaths,
        changed: this.integritySummary.changedPaths,
      });
    }
    return this.integritySummary;
  }

  resolveInstalled() {
    // 1) Explicit user pin (kernel panel "设为默认") — highest priority, and the
    //    only branch that may return a Firefox kernel as the global default.
    if (this.meta.pin && this.meta.pin.path) {
      const pin = this.meta.pin;
      const list = this.listInstalledKernels();
      const fresh = list.find((k) => k.engine === pin.engine && k.version === pin.version) || null;
      const trusted = fresh ? fresh.path : safeInstalledBinary(pin.path, this.kernelsRoot);
      if (trusted && fs.existsSync(trusted)) {
        return {
          name: fresh ? fresh.name : (pin.engine === 'firefox' ? `Firefox ${pin.version}` : `Chrome for Testing ${pin.version}`),
          path: trusted,
          version: pin.version,
          engine: pin.engine,
          independent: true,
          source: pin.source || (pin.engine === 'firefox' ? SOURCE_MOZILLA : SOURCE_CFT),
        };
      }
    }

    // 2) A user-requested Stable download overrides legacy kernels bundled by an
    // older package. Otherwise the old CFT resource would win forever.
    if (this.meta.source === SOURCE_CHROME_STABLE && this.meta.binary) {
      const stable = safeInstalledBinary(this.meta.binary, this.kernelsRoot);
      if (stable) {
        return {
          name: kernelDisplayName(SOURCE_CHROME_STABLE),
          path: stable,
          version: this.meta.version || 'stable',
          independent: true,
          source: SOURCE_CHROME_STABLE,
        };
      }
    }

    // macOS x64 default only: OpenBrowser 148 under kernels/macos-x64/ (wrapper binary).
    // Other hosts must never auto-select this kernel even if a stray tree exists.
    if (isOpenBrowser148SupportedHost()) {
      const openBrowserBin = findOpenBrowserKernelBinary(this.kernelsRoot, this.resourceRoots);
      if (openBrowserBin) {
        const trustedOb = this.safeCustomBinary(openBrowserBin);
        if (trustedOb) {
          return {
            name: kernelDisplayName(SOURCE_OPENBROWSER),
            path: trustedOb,
            version: this.meta.version || OPENBROWSER_KERNEL_VERSION,
            independent: true,
            source: SOURCE_OPENBROWSER,
          };
        }
      }
    }

    // Prefer install-tree / resource integrated seeds that are CDP-ready.
    // Stale userData kernels (unpatched companion libs) must not win over the package seed.
    const bundled = findBundledWayfernKernel(this.resourceRoots);
    if (bundled) {
      const trustedBundled = safeInstalledBinary(bundled.binary, bundled.root);
      if (trustedBundled && isIntegratedKernelCdpReady({ path: trustedBundled, source: SOURCE_WAYFERN })) {
        return {
          name: kernelDisplayName(SOURCE_WAYFERN),
          path: trustedBundled,
          version: bundledKernelVersion(bundled.root),
          independent: true,
          source: SOURCE_WAYFERN,
        };
      }
    }

    const bundledStable = findBundledChromeStable(this.resourceRoots);
    if (bundledStable) {
      return {
        name: kernelDisplayName(SOURCE_CHROME_STABLE),
        path: bundledStable.binary,
        version: this.meta.version || bundledKernelVersion(bundledStable.root),
        independent: true,
        source: SOURCE_CHROME_STABLE,
      };
    }

    // Chrome for Testing is the integrated Ubuntu x86_64 kernel. Search
    // resource roots so a portable package works without copying a kernel to
    // userData first.
    const bundledCft = findBundledChromeForTesting(this.resourceRoots);
    if (bundledCft) {
      return {
        name: kernelDisplayName(SOURCE_CFT),
        path: bundledCft.binary,
        version: bundledKernelVersion(bundledCft.root),
        independent: true,
        source: SOURCE_CFT,
      };
    }

    if (this.meta.binary && fs.existsSync(this.meta.binary)) {
      const src = this.meta.source || SOURCE_WAYFERN;
      // Refuse stale openbrowser-148 meta on non-mac-x64 hosts.
      if (src === SOURCE_OPENBROWSER && !isOpenBrowser148SupportedHost()) {
        // fall through
      } else {
        const trusted = (src === SOURCE_CUSTOM || src === SOURCE_OPENBROWSER)
          ? this.safeCustomBinary(this.meta.binary)
          : safeInstalledBinary(this.meta.binary, this.kernelsRoot);
        if (trusted) {
          // Skip userData / meta binaries that fail CDP readiness when a better seed exists.
          const ready = isIntegratedKernelCdpReady({ path: trusted, source: src });
          if (ready || src === SOURCE_CUSTOM || src === SOURCE_CFT || src === SOURCE_CHROME_STABLE || src === SOURCE_OPENBROWSER) {
            return {
              name: kernelDisplayName(src),
              path: trusted,
              version: this.meta.version || 'unknown',
              independent: true,
              source: src,
            };
          }
        }
      }
    }

    // Fall back to bundled even if marker check failed (still better than nothing; launch will re-check).
    if (bundled) {
      const trustedBundled = safeInstalledBinary(bundled.binary, bundled.root);
      if (trustedBundled) {
        return {
          name: kernelDisplayName(SOURCE_WAYFERN),
          path: trustedBundled,
          version: bundledKernelVersion(bundled.root),
          independent: true,
          source: SOURCE_WAYFERN,
        };
      }
    }

    // Scan integrated seeds under userData/kernels/{platform} (+ legacy compat paths)
    try {
      let found = null;
      let foundRoot = null;
      for (const seed of wayfernSeedDirNames()) {
        const seedRoot = path.join(this.kernelsRoot, seed);
        found = findWayfernKernelBinary(seedRoot);
        if (found) { foundRoot = seedRoot; break; }
        const compat = path.join(this.kernelsRoot, 'wayfern', seed);
        found = findWayfernKernelBinary(compat);
        if (found) { foundRoot = compat; break; }
      }
      if (!found) {
        const wayfernDir = path.join(this.kernelsRoot, 'wayfern');
        found = findWayfernKernelBinary(wayfernDir);
        if (found) foundRoot = wayfernDir;
      }
      const trusted = safeInstalledBinary(found, foundRoot || this.kernelsRoot);
      if (trusted && isIntegratedKernelCdpReady({ path: trusted, source: SOURCE_WAYFERN })) {
        return {
          name: kernelDisplayName(SOURCE_WAYFERN),
          path: trusted,
          version: this.meta.version || bundledKernelVersion(foundRoot || this.kernelsRoot),
          independent: true,
          source: SOURCE_WAYFERN,
        };
      }
    } catch (_) {}

    const localStable = findBundledChromeStable([this.userData, this.kernelsRoot]);
    if (localStable) {
      return {
        name: kernelDisplayName(SOURCE_CHROME_STABLE),
        path: localStable.binary,
        version: this.meta.version || bundledKernelVersion(localStable.root),
        independent: true,
        source: SOURCE_CHROME_STABLE,
      };
    }

    // User-data Chrome for Testing path (legacy and explicit local installs).
    const localCft = findBundledChromeForTesting([this.userData, this.kernelsRoot]);
    if (localCft) {
      return {
        name: kernelDisplayName(SOURCE_CFT),
        path: localCft.binary,
        version: this.meta.version || bundledKernelVersion(localCft.root),
        independent: true,
        source: SOURCE_CFT,
      };
    }

    const custom = path.join(this.kernelsRoot, 'custom', 'chrome');
    const trustedCustom = this.safeCustomBinary(custom);
    if (trustedCustom) {
      return {
        name: kernelDisplayName(SOURCE_CUSTOM),
        path: trustedCustom,
        version: this.meta.version || 'custom',
        independent: true,
        source: SOURCE_CUSTOM,
      };
    }
    return null;
  }

  safeCustomBinary(candidate) {
    const resolved = path.resolve(String(candidate || ''));
    try {
      const stat = fs.lstatSync(resolved);
      if (stat.isSymbolicLink() || !stat.isFile() || isSystemBrowserExecutable(resolved)) return null;
      const real = fs.realpathSync.native(resolved);
      return isSystemBrowserExecutable(real) ? null : resolved;
    } catch (_) {
      return null;
    }
  }

  status() {
    const installed = this.resolveInstalled();
    // Channel label only claims openbrowser-148 default when that kernel is present.
    const openBrowserDefault = isOpenBrowser148SupportedHost()
      && Boolean(installed && installed.source === SOURCE_OPENBROWSER);
    const wayfernIntegrated = !openBrowserDefault
      && Boolean(installed && installed.source === SOURCE_WAYFERN);
    const stableIntegrated = !openBrowserDefault
      && Boolean(installed && installed.source === SOURCE_CHROME_STABLE);
    const cftIntegrated = !openBrowserDefault
      && Boolean(installed && installed.source === SOURCE_CFT);
    return {
      platform: donutPlatformKey(),
      cftPlatform: cftPlatformKey(),
      kernelsRoot: this.kernelsRoot,
      installed: Boolean(installed),
      kernel: installed,
      meta: this.meta,
      integrity: this.integritySummary,
      autoDownload: true,
      channel: openBrowserDefault
        ? {
          name: 'OpenBrowser 148（macOS x86 内置）',
          metaUrl: null,
          site: null,
          engineSite: null,
        }
        : wayfernIntegrated
          ? {
            name: 'Wayfern（安装包内置）',
            metaUrl: WAYFERN_META,
            site: 'https://donutbrowser.com',
            engineSite: 'https://wayfern.com',
          }
        : stableIntegrated
          ? {
            name: 'Google Chrome Stable',
            metaUrl: chromeStablePackage()?.url || null,
            site: 'https://www.google.com/chrome/',
            engineSite: 'https://www.google.com/chrome/',
          }
          : {
            name: cftIntegrated ? 'Google Chrome for Testing（旧包）' : !installed ? 'Google Chrome Stable' : '独立内核（安装包内置）',
            metaUrl: cftIntegrated ? CFT_META : chromeStablePackage()?.url || null,
            site: cftIntegrated ? 'https://googlechromelabs.github.io/chrome-for-testing/' : 'https://www.google.com/chrome/',
            engineSite: 'https://www.google.com/chrome/',
          },
      note: openBrowserDefault
        ? 'macOS x86 优先使用安装包/源码内置的 OpenBrowser 148（kernels/macos-x64/）；点击下载可切换到 Google Chrome Stable 正式包。'
        : wayfernIntegrated
          ? 'Windows x64 / macOS arm64 优先使用安装包内置 Wayfern；点击下载可切换到 Google Chrome Stable 正式包。'
          : cftIntegrated
            ? '当前仍在使用旧的 Chrome for Testing 包；点击下载会切换到 Google Chrome Stable 正式包。'
            : stableIntegrated
              ? '使用 Google Chrome Stable 正式包，已解压到 OpenBrowser 独立内核目录。'
            : installed?.source === SOURCE_CUSTOM
              ? '正在使用自定义 Chromium。点击下载可切换到 Google Chrome Stable 正式包。'
              : '未发现内置独立内核。点击下载将获取 Google Chrome Stable 正式包。',
    };
  }

  /**
   * Fetch optional remote kernel feed and resolve download for this platform.
   * @returns {{ version, url, platform, source }}
   */
  async fetchOfficialRelease() {
    this.onProgress({ phase: 'meta', message: '查询远程内核版本…' });
    let data;
    try {
      data = await fetchJson(WAYFERN_META);
    } catch (err) {
      throw new Error('无法访问远程内核源：' + (err.message || err));
    }
    const version = String(data.version || '').trim();
    if (!version) throw new Error('远程内核元数据缺少 version 字段');

    const platform = donutPlatformKey();
    const downloads = data.downloads || {};
    const url = downloads[platform] || null;

    if (url) {
      // Enforce a digest when the feed publishes one; today it does not, but
      // the moment it does every install becomes verifiable end to end.
      const digest = extractFeedDigest(data, platform);
      return { version, url, platform, source: SOURCE_WAYFERN, raw: data, ...digest };
    }

    // Platform missing (e.g. macos-x64 null) → Chrome for Testing fallback
    this.onProgress({ phase: 'meta', message: `当前平台无专用内核包，回退 Chrome for Testing…` });
    const cft = await fetchJson(CFT_META);
    const stable = cft.channels?.Stable;
    if (!stable) throw new Error('无法获取 Chrome for Testing 稳定版信息');
    const cftPlat = cftPlatformKey();
    const entry = (stable.downloads?.chrome || []).find((d) => d.platform === cftPlat);
    if (!entry?.url) {
      throw new Error(
        `当前平台无可用内核：Wayfern 无 ${platform} 下载，Chrome for Testing 也无 ${cftPlat}。`
      );
    }
    return {
      version: stable.version,
      url: entry.url,
      platform: cftPlat,
      source: SOURCE_CFT,
      raw: { wayfern: data, cft: stable },
    };
  }

  /** Fetch the stable Chrome for Testing archive for the current platform. */
  async fetchChromeForTestingRelease() {
    this.onProgress({ phase: 'meta', message: '查询 Google Chrome for Testing 稳定版…' });
    let data;
    try {
      data = await fetchJson(CFT_META);
    } catch (error) {
      throw new Error('无法访问 Chrome for Testing 官方源：' + (error.message || error));
    }
    const stable = data.channels?.Stable;
    const version = String(stable?.version || '').trim();
    const platform = cftPlatformKey();
    const entry = (stable?.downloads?.chrome || []).find((item) => item.platform === platform);
    if (!version || !entry?.url) {
      throw new Error(`当前平台无可用 Chrome for Testing 内核：${platform}`);
    }
    return { version, url: entry.url, platform, source: SOURCE_CFT, raw: stable };
  }

  /** Resolve the official, non-CfT Google Chrome Stable package. */
  async fetchChromeStableRelease() {
    const packageInfo = chromeStablePackage();
    if (!packageInfo) throw new Error(`当前平台没有可用的 Google Chrome Stable 包：${process.platform}/${process.arch}`);
    this.onProgress({ phase: 'meta', message: '准备 Google Chrome Stable 正式包…' });
    return {
      version: 'stable',
      url: packageInfo.url,
      kind: packageInfo.kind,
      platform: donutPlatformKey(),
      source: SOURCE_CHROME_STABLE,
    };
  }

  // -------------------------------------------------------------------------
  // Multi-version kernel catalogs (Chrome for Testing) and Firefox kernels.
  //
  // Per-version installs live in their own tree (kernels/chromium-versions/<v>,
  // kernels/firefox/<v>) and coexist; the active one is chosen either by an
  // explicit pin (pinKernel) or per-profile in the engine layer. Installs are
  // dormant until pinned, so they never disturb the active kernel's integrity
  // record.
  // -------------------------------------------------------------------------

  chromiumCatalogPath() { return path.join(this.kernelsRoot, 'chromium-versions.json'); }
  firefoxCatalogPath() { return path.join(this.kernelsRoot, 'firefox-versions.json'); }

  async loadCatalogCache(file, platformKey, ttlMs) {
    try {
      const raw = JSON.parse(await fsp.readFile(file, 'utf8'));
      if (!raw || typeof raw !== 'object') return null;
      if (String(raw.platform || '') !== String(platformKey)) return null;
      const fetchedAt = Date.parse(raw.fetchedAt || '');
      if (!Number.isFinite(fetchedAt) || Date.now() - fetchedAt > ttlMs) return null;
      if (!Array.isArray(raw.versions) || !raw.versions.length) return null;
      return raw;
    } catch (_) {
      return null;
    }
  }

  async saveCatalogCache(file, payload) {
    try {
      await fsp.mkdir(this.kernelsRoot, { recursive: true });
      await fsp.writeFile(file, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    } catch (_) { /* cache write is best-effort */ }
  }

  decorateChromiumInstalled(versions) {
    return (versions || []).map((item) => ({
      ...item,
      installed: fs.existsSync(path.join(this.kernelsRoot, 'chromium-versions', String(item.version || ''))),
    }));
  }

  decorateFirefoxInstalled(versions) {
    return (versions || []).map((item) => ({
      ...item,
      installed: fs.existsSync(path.join(this.kernelsRoot, 'firefox', String(item.version || ''))),
    }));
  }

  /** Chrome for Testing versions for this platform, newest first (cached 24h). */
  async listChromiumVersions({ refresh = false } = {}) {
    const plat = cftPlatformKey();
    if (!refresh) {
      const cached = await this.loadCatalogCache(this.chromiumCatalogPath(), plat, CHROMIUM_CATALOG_TTL_MS);
      if (cached) return { ...cached, versions: this.decorateChromiumInstalled(cached.versions) };
    }
    this.onProgress({ phase: 'meta', message: '查询 Chrome for Testing 版本目录…' });
    const feed = await fetchJson(CHROMIUM_CATALOG_URL, 0, CHROMIUM_CATALOG_MAX_BYTES);
    const versions = filterChromiumCatalog(feed, plat);
    if (!versions.length) throw new Error(`当前平台无可用 Chrome for Testing 版本：${plat}`);
    const payload = { platform: plat, fetchedAt: new Date().toISOString(), versions };
    await this.saveCatalogCache(this.chromiumCatalogPath(), payload);
    return { ...payload, versions: this.decorateChromiumInstalled(versions) };
  }

  /** Firefox versions for this platform: newest release per major + current ESR. */
  async listFirefoxVersions({ refresh = false } = {}) {
    const plat = firefoxPlatformDir();
    if (!plat) throw new Error(`当前平台无可用 Firefox 包：${process.platform}/${process.arch}`);
    if (!refresh) {
      const cached = await this.loadCatalogCache(this.firefoxCatalogPath(), plat, FIREFOX_CATALOG_TTL_MS);
      if (cached) return { ...cached, versions: this.decorateFirefoxInstalled(cached.versions) };
    }
    this.onProgress({ phase: 'meta', message: '查询 Firefox 版本目录…' });
    const [releases, current] = await Promise.all([
      fetchJson(FIREFOX_RELEASES_URL),
      fetchJson(FIREFOX_VERSIONS_URL),
    ]);
    const versions = filterFirefoxCatalog(releases, current);
    if (!versions.length) throw new Error('Firefox 版本目录为空');
    const payload = { platform: plat, fetchedAt: new Date().toISOString(), versions };
    await this.saveCatalogCache(this.firefoxCatalogPath(), payload);
    return { ...payload, versions: this.decorateFirefoxInstalled(versions) };
  }

  /** Download a specific Chrome for Testing version into kernels/chromium-versions/<version>. */
  async installChromiumVersion(version) {
    const wanted = String(version || '').trim();
    if (!/^\d+(?:\.\d+){0,3}$/.test(wanted)) throw new Error('无效的 Chromium 版本号: ' + wanted);
    const plat = cftPlatformKey();
    await fsp.mkdir(this.kernelsRoot, { recursive: true });
    const work = path.join(this.kernelsRoot, 'chromium-versions', wanted);

    // Prefer a catalog URL (known-good list); the official URL pattern is the
    // offline fallback. Both embed the version, so digest pinning applies either way.
    let url = chromiumUrlForVersion(wanted, plat);
    try {
      const { versions } = await this.listChromiumVersions({ refresh: false });
      const hit = (versions || []).find((item) => item.version === wanted);
      if (hit?.url) url = hit.url;
    } catch (_) { /* offline: pattern URL still versioned + pinnable */ }

    const archivePath = path.join(this.kernelsRoot, `chromium-${wanted}-${plat}.zip`);
    const pinned = await pinnedArchiveSha256(this.kernelsRoot, url);
    this.onProgress({ phase: 'download', message: `下载 Chrome for Testing ${wanted}${pinned ? '（校验摘要）' : ''}…`, version: wanted, url });
    const download = await downloadFile(url, archivePath, (p) => this.onProgress({ phase: 'download', ...p, version: wanted }), {
      expectedSha256: pinned || '',
    });

    this.onProgress({ phase: 'extract', message: `解压 Chrome for Testing ${wanted}…`, version: wanted });
    await fsp.rm(work, { recursive: true, force: true });
    await fsp.mkdir(work, { recursive: true });
    await extractZip(archivePath, work);

    let binary = path.join(work, chromeForTestingBinaryRelative(plat));
    if (!fs.existsSync(binary)) {
      binary = findExecutableSync(work, process.platform === 'win32' ? ['chrome.exe', 'chrome'] : ['Google Chrome for Testing', 'chrome', 'chromium']);
    }
    binary = safeInstalledBinary(binary, work);
    if (!binary) throw new Error('解压后未找到 Chrome for Testing 可执行文件');
    if (process.platform !== 'win32') {
      try { await fsp.chmod(binary, 0o755); } catch (_) {}
    }

    this.onProgress({ phase: 'validate', message: `验证 Chrome for Testing ${wanted} 兼容性…`, version: wanted, binary });
    await this.probeBrowserBinary(binary);

    await fsp.writeFile(path.join(work, 'kernel.json'), JSON.stringify({
      engine: 'chromium',
      source: SOURCE_CFT,
      version: wanted,
      platform: plat,
      downloadUrl: url,
      installedAt: new Date().toISOString(),
    }, null, 2) + '\n', 'utf8');

    await this.baselineTree(work);
    if (isVersionedArchiveUrl(url, wanted) && download.sha256) {
      await pinArchiveSha256(this.kernelsRoot, url, download.sha256);
    }
    await fsp.rm(archivePath, { force: true }).catch(() => {});

    this.onProgress({ phase: 'done', message: `Chrome for Testing ${wanted} 已就绪`, version: wanted, binary });
    return {
      name: `Chrome for Testing ${wanted}`,
      path: binary,
      version: wanted,
      engine: 'chromium',
      independent: true,
      source: SOURCE_CFT,
    };
  }

  /** Download a Firefox release into kernels/firefox/<version> (esr suffix kept). */
  async installFirefoxVersion(version) {
    const wanted = String(version || '').trim();
    if (!/^\d+(?:\.\d+){0,3}(?:esr)?$/.test(wanted)) throw new Error('无效的 Firefox 版本号: ' + wanted);
    const platformDir = firefoxPlatformDir();
    if (!platformDir) throw new Error(`当前平台无可用 Firefox 包：${process.platform}/${process.arch}`);
    await fsp.mkdir(this.kernelsRoot, { recursive: true });

    // SHA256SUMS is the authoritative artifact list AND the digest source.
    this.onProgress({ phase: 'meta', message: `获取 Firefox ${wanted} 校验清单…`, version: wanted });
    const sumsText = await fetchText(firefoxSumsUrl(wanted), { maxBytes: 2 * 1024 * 1024 });
    const sums = parseSha256Sums(sumsText);
    if (!sums.size) throw new Error('Firefox SHA256SUMS 为空或格式无效');
    const artifact = firefoxArtifactFor(platformDir, wanted, sums, FIREFOX_LOCALE);
    if (!artifact) throw new Error(`Firefox ${wanted} 在 ${platformDir} 平台没有可用安装包`);

    const url = firefoxCdnUrl(wanted, artifact.relPath);
    const work = path.join(this.kernelsRoot, 'firefox', wanted);
    const ext = artifact.kind === 'tar.xz' ? 'tar.xz' : artifact.kind === 'dmg' ? 'dmg' : artifact.kind === 'msi' ? 'msi' : 'exe';
    const archivePath = path.join(this.kernelsRoot, `firefox-${wanted}-${platformDir}.${ext}`);

    // The CDN digest is authoritative from the first download on; a prior pin
    // only matters when the feed digest is somehow missing.
    const pinned = await pinnedArchiveSha256(this.kernelsRoot, url);
    const expectedSha256 = artifact.sha256 || pinned || '';
    this.onProgress({ phase: 'download', message: `下载 Firefox ${wanted}（校验摘要）…`, version: wanted, url });
    const download = await downloadFile(url, archivePath, (p) => this.onProgress({ phase: 'download', ...p, version: wanted }), {
      expectedSha256,
    });

    this.onProgress({ phase: 'extract', message: `解压 Firefox ${wanted}…`, version: wanted });
    await fsp.rm(work, { recursive: true, force: true });
    await fsp.mkdir(work, { recursive: true });
    if (artifact.kind === 'tar.xz') {
      await extractTarXz(archivePath, work);
    } else if (artifact.kind === 'dmg') {
      await extractDmg(archivePath, work);
    } else if (artifact.kind === 'msi') {
      await extractMsi(archivePath, work);
      await this.ensureWindowsFirefoxTree(work);
    } else {
      // Windows full installer: no archive form exists — run it silently into work.
      await this.runFirefoxSetupExe(archivePath, work);
    }
    await assertSafeExtractedTree(work).catch((error) => {
      throw new Error('Firefox 安装树校验失败：' + (error.message || error));
    });

    let binary = safeInstalledBinary(path.join(work, firefoxBinaryRelative(platformDir)), work);
    if (!binary || !fs.existsSync(binary)) {
      binary = safeInstalledBinary(findExecutableSync(work, ['firefox.exe', 'firefox']), work);
    }
    if (!binary) throw new Error('解压后未找到 Firefox 可执行文件');
    if (process.platform !== 'win32') {
      try { await fsp.chmod(binary, 0o755); } catch (_) {}
    }

    this.onProgress({ phase: 'validate', message: `验证 Firefox ${wanted} 兼容性…`, version: wanted, binary });
    const probe = await this.probeFirefoxBinary(binary);

    await fsp.writeFile(path.join(work, 'kernel.json'), JSON.stringify({
      engine: 'firefox',
      source: SOURCE_MOZILLA,
      version: probe.version || wanted,
      platform: platformDir,
      downloadUrl: url,
      installedAt: new Date().toISOString(),
    }, null, 2) + '\n', 'utf8');

    await this.baselineTree(work);
    if (isVersionedArchiveUrl(url, wanted) && download.sha256) {
      await pinArchiveSha256(this.kernelsRoot, url, download.sha256);
    }
    await fsp.rm(archivePath, { force: true }).catch(() => {});

    this.onProgress({ phase: 'done', message: `Firefox ${wanted} 已就绪`, version: wanted, binary });
    return {
      name: `Firefox ${wanted}`,
      path: binary,
      version: probe.version || wanted,
      engine: 'firefox',
      independent: true,
      source: SOURCE_MOZILLA,
    };
  }

  /**
   * Windows: after msiexec /a, a WiX-wrapper MSI yields the embedded full
   * installer instead of a tree. Run it silently into work (/D must be the
   * last argument and unquoted, so the directory must not contain spaces).
   */
  async ensureWindowsFirefoxTree(work) {
    if (process.platform !== 'win32') return;
    const direct = path.join(work, 'firefox.exe');
    if (fs.existsSync(direct)) return;
    const setup = findExecutableSync(work, ['FullInstaller', 'Firefox Setup']);
    if (!setup) throw new Error('MSI 解包后未找到 firefox.exe，也未找到可静默执行的完整安装器');
    await this.runFirefoxSetupExe(setup, work);
    if (!fs.existsSync(direct)) throw new Error('Firefox 静默安装后仍未找到 firefox.exe');
  }

  async runFirefoxSetupExe(setupPath, work) {
    if (process.platform !== 'win32') throw new Error('Firefox 安装器仅支持 Windows');
    const target = path.resolve(String(work || ''));
    if (!target || !fs.existsSync(setupPath)) throw new Error('Firefox 安装器不存在: ' + setupPath);
    if (/\s/.test(target)) throw new Error('Windows 静默安装目录不能包含空格: ' + target);
    this.onProgress({ phase: 'extract', message: '正在静默安装 Firefox…' });
    await new Promise((resolve, reject) => {
      const child = spawn(setupPath, ['/S', `/D=${target}`], { windowsHide: true, stdio: 'ignore' });
      const timer = setTimeout(() => {
        try { child.kill(); } catch (_) {}
        reject(new Error('Firefox 静默安装超时'));
      }, 240000);
      child.once('error', (error) => { clearTimeout(timer); reject(error); });
      child.once('exit', (code) => {
        clearTimeout(timer);
        // NSIS setup may exit non-zero after a successful per-user install; verify by file.
        if (fs.existsSync(path.join(target, 'firefox.exe'))) return resolve();
        if (code === 0) return resolve();
        reject(new Error('Firefox 静默安装失败 exitCode=' + code));
      });
    });
  }

  /** application.ini fallback (Windows GUI binaries print nothing for --version). */
  readFirefoxApplicationIni(binaryPath) {
    const binary = path.resolve(String(binaryPath || ''));
    const dir = path.dirname(binary);
    const candidates = [
      path.join(dir, 'application.ini'),
      path.join(dir, 'firefox', 'application.ini'),
      path.join(dir, '..', 'Resources', 'application.ini'),
    ];
    for (const file of candidates) {
      try {
        const text = fs.readFileSync(file, 'utf8');
        const app = {};
        let inApp = false;
        for (const line of text.split(/\r?\n/)) {
          const s = line.trim();
          if (s.startsWith('[')) { inApp = /^\[App\]$/i.test(s); continue; }
          if (!inApp || !s.includes('=')) continue;
          const eq = s.indexOf('=');
          const key = s.slice(0, eq).trim();
          if (key === 'Version' || key === 'Name' || key === 'Vendor') app[key] = s.slice(eq + 1).trim();
        }
        if (app.Version) return app;
      } catch (_) {}
    }
    return null;
  }

  /** Firefox counterpart of probeBrowserBinary (no CDP: only the binary is verified). */
  async probeFirefoxBinary(binaryPath) {
    const resolved = path.resolve(String(binaryPath || ''));
    let stat;
    try { stat = await fsp.stat(resolved); } catch (_) { throw new Error('文件不存在: ' + resolved); }
    if (!stat.isFile()) throw new Error('内核路径必须是可执行文件: ' + resolved);
    if (process.platform !== 'win32') {
      try { await fsp.access(resolved, fs.constants.X_OK); } catch (_) { throw new Error('内核文件没有执行权限: ' + resolved); }
    }
    let versionOutput = '';
    try {
      const result = await execFileAsync(resolved, ['--version'], { timeout: 8000, windowsHide: true, maxBuffer: 64 * 1024 });
      versionOutput = String(result.stdout || result.stderr || '').trim();
    } catch (_) { versionOutput = ''; }
    let version = (versionOutput.match(/(\d+(?:\.\d+){1,3}(?:esr)?)/) || [])[1] || '';
    if (!/firefox/i.test(versionOutput)) {
      const ini = this.readFirefoxApplicationIni(resolved);
      if (!ini || !/firefox/i.test(String(ini.Name || ''))) {
        throw new Error('所选文件不是受支持的 Firefox 内核: ' + (versionOutput || '未返回版本信息'));
      }
      version = String(ini.Version || '') || version;
    }
    return { path: resolved, version: version || 'unknown', browser: `Firefox ${version || '?'}` };
  }

  /** All per-version installs across both engines, newest first within each. */
  listInstalledKernels() {
    const readTree = (base, engine) => {
      const out = [];
      let entries = [];
      try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch (_) { return out; }
      for (const ent of entries) {
        if (!ent.isDirectory() || ent.name.startsWith('.') || ent.name === '_dmg_mount') continue;
        const tree = path.join(base, ent.name);
        let meta = {};
        try { meta = JSON.parse(fs.readFileSync(path.join(tree, 'kernel.json'), 'utf8')); } catch (_) {}
        const version = String(meta.version || ent.name);
        let binary = null;
        if (engine === 'firefox') {
          binary = safeInstalledBinary(path.join(tree, firefoxBinaryRelative(firefoxPlatformDir())), tree)
            || safeInstalledBinary(findExecutableSync(tree, ['firefox.exe', 'firefox']), tree);
        } else {
          binary = safeInstalledBinary(path.join(tree, chromeForTestingBinaryRelative(cftPlatformKey())), tree)
            || safeInstalledBinary(findExecutableSync(tree, ['chrome.exe', 'Google Chrome for Testing', 'chrome']), tree);
        }
        if (!binary) continue;
        const source = String(meta.source || (engine === 'firefox' ? SOURCE_MOZILLA : SOURCE_CFT));
        out.push({
          id: `${engine}:${ent.name}`,
          engine,
          version,
          source,
          path: binary,
          tree,
          binaryExists: true,
          name: engine === 'firefox' ? `Firefox ${version}` : `Chrome for Testing ${version}`,
        });
      }
      return out;
    };
    const chromium = readTree(path.join(this.kernelsRoot, 'chromium-versions'), 'chromium');
    const firefox = readTree(path.join(this.kernelsRoot, 'firefox'), 'firefox');
    chromium.sort((a, b) => compareKernelVersions(String(b.version), String(a.version)));
    firefox.sort((a, b) => compareKernelVersions(String(b.version), String(a.version)));
    return [...chromium, ...firefox];
  }

  /** Make an installed kernel the default for every profile (explicit pin). */
  async pinKernel({ engine, version } = {}) {
    await this.loadMeta();
    const wantedEngine = engine === 'firefox' ? 'firefox' : 'chromium';
    const wantedVersion = String(version || '').trim();
    const list = this.listInstalledKernels();
    const hit = list.find((k) => k.engine === wantedEngine && (!wantedVersion || k.version === wantedVersion));
    if (!hit || !hit.binaryExists) {
      throw new Error(`未找到已安装的 ${wantedEngine === 'firefox' ? 'Firefox' : 'Chromium'} ${wantedVersion || ''} 内核`);
    }
    this.meta.pin = { engine: hit.engine, version: hit.version, source: hit.source, path: hit.path };
    this.meta.updatedAt = new Date().toISOString();
    await this.saveMeta();
    await this.pointIntegrityAt(hit.tree);
    return this.resolveInstalled();
  }

  /** Drop the explicit pin; bundled/default resolution takes over again. */
  async clearPin() {
    await this.loadMeta();
    this.meta.pin = null;
    this.meta.updatedAt = new Date().toISOString();
    await this.saveMeta();
    return this.resolveInstalled();
  }

  /** Resolve an integrated kernel, or download the official Chrome Stable package. */
  async ensureIntegrated(force = false) {
    if (!this.installPromise) {
      this.installPromise = this.ensureIntegratedInternal(force).finally(() => { this.installPromise = null; });
    }
    return this.installPromise;
  }

  async ensureIntegratedInternal(force = false) {
    await this.loadMeta();
    const existing = this.resolveInstalled();
    if (existing && !force && existing.source !== SOURCE_CFT) {
      this.meta.binary = existing.path;
      this.meta.version = existing.version || this.meta.version || null;
      this.meta.source = existing.source || this.meta.source || SOURCE_WAYFERN;
      this.meta.platform = donutPlatformKey();
      this.meta.downloadUrl = null;
      this.meta.updatedAt = new Date().toISOString();
      await this.saveMeta();
      this.onProgress({
        phase: 'done',
        message: `使用内置独立内核 ${existing.version || ''}`.trim(),
        version: existing.version,
        binary: existing.path,
      });
      return existing;
    }

    // Windows/macOS integrated Wayfern seed.
    const bundled = findBundledWayfernKernel(this.resourceRoots);
    if (!force && bundled) {
      const trusted = safeInstalledBinary(bundled.binary, bundled.root);
      if (trusted) {
        const version = bundledKernelVersion(bundled.root);
        this.meta.binary = trusted;
        this.meta.version = version;
        this.meta.source = SOURCE_WAYFERN;
        this.meta.platform = donutPlatformKey();
        this.meta.downloadUrl = null;
        this.meta.updatedAt = new Date().toISOString();
        await this.saveMeta();
        const resolved = {
          name: kernelDisplayName(SOURCE_WAYFERN),
          path: trusted,
          version,
          independent: true,
          source: SOURCE_WAYFERN,
        };
        this.onProgress({
          phase: 'done',
          message: `使用内置 Wayfern 内核 ${version}`,
          version,
          binary: trusted,
        });
        return resolved;
      }
    }

    const release = await this.fetchChromeStableRelease();
    try {
      return await this.installChromeStable(release);
    } catch (error) {
      if (!force && existing?.source === SOURCE_CFT) {
        this.onProgress({ phase: 'done', message: '正式 Chrome Stable 包不可用，继续使用已安装的 Chrome for Testing', version: existing.version, binary: existing.path });
        return existing;
      }
      throw error;
    }
  }

  /** @deprecated Use ensureIntegrated. */
  async ensureLatest(force = false) {
    return this.ensureIntegrated(force);
  }

  async ensureLatestInternal(force = false) {
    return this.ensureIntegrated(force);
  }

  async installWayfern(release) {
    const { version, url, platform } = release;
    const work = path.join(this.kernelsRoot, 'wayfern');
    await fsp.mkdir(this.kernelsRoot, { recursive: true });

    const kind = archiveKindFromUrl(url);
    const ext = kind === 'dmg' ? 'dmg' : kind === 'tar.xz' ? 'tar.xz' : kind === 'tar.gz' ? 'tar.gz' : 'zip';
    const archivePath = path.join(this.kernelsRoot, `wayfern-${version}-${platform}.${ext}`);

    // A previously pinned digest for this exact URL turns a re-download into
    // a byte-exact comparison; the feed digest (when published) takes
    // precedence because it is the fresher statement from the source.
    const pinned = isVersionedArchiveUrl(url, version) ? await pinnedArchiveSha256(this.kernelsRoot, url) : null;
    const expectedSha256 = release.sha256 || pinned || '';
    const expectedMd5 = release.md5 || '';

    this.onProgress({
      phase: 'download',
      message: `下载独立内核 ${version}${expectedSha256 ? '（校验摘要）' : ''}…`,
      version,
      url,
    });
    const download = await downloadFile(url, archivePath, (p) => this.onProgress({ phase: 'download', ...p, version }), {
      expectedSha256,
      expectedMd5,
    });

    this.onProgress({ phase: 'extract', message: '解压独立内核…', version });
    await fsp.rm(work, { recursive: true, force: true });
    await fsp.mkdir(work, { recursive: true });

    try {
      if (kind === 'dmg') await extractDmg(archivePath, work);
      else if (kind === 'tar.xz') await extractTarXz(archivePath, work);
      else if (kind === 'tar.gz') await extractTarGz(archivePath, work);
      else await extractZip(archivePath, work);
    } catch (err) {
      throw new Error('解压独立内核失败：' + (err.message || err));
    }

    const binary = await resolveWayfernBinary(work);
    const trustedBinary = safeInstalledBinary(binary, work);
    if (!trustedBinary) {
      throw new Error('解压后未找到独立内核可执行文件，请检查平台包是否完整');
    }

    if (process.platform !== 'win32') {
      try { await fsp.chmod(trustedBinary, 0o755); } catch (_) {}
    }

    this.onProgress({ phase: 'validate', message: '验证已下载内核兼容性…', version, binary: trustedBinary });
    await this.probeBrowserBinary(trustedBinary);

    this.meta.binary = trustedBinary;
    this.meta.version = version;
    this.meta.platform = platform;
    this.meta.updatedAt = new Date().toISOString();
    this.meta.source = SOURCE_WAYFERN;
    this.meta.downloadUrl = url;
    this.meta.remoteVersion = version;
    this.meta.archiveSha256 = download.sha256 || null;
    await this.saveMeta();

    await this.recordInstallBaseline(work);
    // The archive passed extraction, the escape-proof path check and the launch
    // probe — pin its digest so the next download of this URL must match.
    if (isVersionedArchiveUrl(url, version) && download.sha256) {
      await pinArchiveSha256(this.kernelsRoot, url, download.sha256);
    }

    await fsp.rm(archivePath, { force: true }).catch(() => {});

    this.onProgress({ phase: 'done', message: '独立内核就绪', version, binary: trustedBinary });
    return this.resolveInstalled();
  }

  async installChromeStable(release) {
    const { url, kind = archiveKindFromUrl(url) } = release;
    const work = path.join(this.kernelsRoot, 'chrome-stable');
    await fsp.mkdir(this.kernelsRoot, { recursive: true });
    const archivePath = path.join(this.kernelsRoot, `google-chrome-stable-${donutPlatformKey()}.${kind}`);

    const expectedSha256 = await pinnedArchiveSha256(this.kernelsRoot, url);
    this.onProgress({ phase: 'download', message: '下载 Google Chrome Stable 正式包…', version: 'stable', url });
    if (!expectedSha256) {
      // First download of this URL has no known-good digest to enforce; the
      // host allow-list and TLS are the only guards. Surface that instead of
      // letting the progress UI imply a verified download. (The URL is
      // version-less, so a pin is only enforced once a versioned URL exists.)
      this.onProgress({ phase: 'download', message: '首次下载未附带摘要校验（仅 HTTPS 与官方域名白名单保护）', version: 'stable' });
      console.warn('[kernel] Chrome Stable download has no pinned SHA-256; trusting TLS + host allow-list only:', url);
    }
    const download = await downloadFile(url, archivePath, (p) => this.onProgress({ phase: 'download', ...p, version: 'stable' }), {
      expectedSha256: expectedSha256 || '',
    });

    this.onProgress({ phase: 'extract', message: '解压 Google Chrome Stable…', version: 'stable' });
    await fsp.rm(work, { recursive: true, force: true });
    await fsp.mkdir(work, { recursive: true });
    try {
      if (kind === 'deb') await extractDeb(archivePath, work);
      else if (kind === 'msi') await extractMsi(archivePath, work);
      else if (kind === 'dmg') await extractDmg(archivePath, work);
      else throw new Error(`不支持的 Chrome Stable 包格式：${kind}`);
    } catch (error) {
      throw new Error('解压 Google Chrome Stable 失败：' + (error.message || error));
    }

    let binary = path.join(work, chromeStableBinaryRelative());
    if (!fs.existsSync(binary)) {
      binary = await findExecutable(work, process.platform === 'win32' ? ['chrome.exe'] : ['Google Chrome', 'chrome']);
    }
    binary = this.safeCustomBinary(binary) || safeInstalledBinary(binary, work);
    if (!binary) throw new Error('解压后未找到 Google Chrome Stable 可执行文件');

    if (process.platform !== 'win32') {
      try { await fsp.chmod(binary, 0o755); } catch (_) {}
    }

    this.onProgress({ phase: 'validate', message: '验证 Google Chrome Stable 兼容性…', version: 'stable', binary });
    const probe = await this.probeBrowserBinary(binary);
    const version = probe.version || 'stable';
    await fsp.writeFile(path.join(work, 'kernel.json'), JSON.stringify({
      version,
      source: SOURCE_CHROME_STABLE,
      platform: donutPlatformKey(),
      downloadUrl: url,
    }, null, 2) + '\n', 'utf8');

    this.meta.binary = binary;
    this.meta.version = version;
    this.meta.platform = donutPlatformKey();
    this.meta.updatedAt = new Date().toISOString();
    this.meta.source = SOURCE_CHROME_STABLE;
    this.meta.downloadUrl = url;
    this.meta.remoteVersion = version;
    this.meta.archiveSha256 = download.sha256 || null;
    await this.saveMeta();
    // Rolling "current" URL: content legitimately changes, so the digest is
    // recorded for provenance but deliberately not pinned.
    await fsp.rm(archivePath, { force: true }).catch(() => {});
    await this.recordInstallBaseline(work);

    await fsp.rm(path.join(this.kernelsRoot, 'chrome-for-testing'), { recursive: true, force: true }).catch(() => {});

    this.onProgress({ phase: 'done', message: 'Google Chrome Stable 已就绪', version, binary });
    return this.resolveInstalled();
  }

  async installChromeForTesting(release) {
    const { version, url } = release;
    const plat = cftPlatformKey();
    const work = path.join(this.kernelsRoot, 'chrome-for-testing');
    await fsp.mkdir(this.kernelsRoot, { recursive: true });
    const zipPath = path.join(this.kernelsRoot, `chrome-${version}-${plat}.zip`);

    // CfT URLs embed the exact version, so a pinned digest is a strict
    // byte-exact guarantee on every re-download of the same version.
    const pinned = isVersionedArchiveUrl(url, version) ? await pinnedArchiveSha256(this.kernelsRoot, url) : null;

    this.onProgress({ phase: 'download', message: `下载 Chrome for Testing ${version}${pinned ? '（校验摘要）' : ''}`, version, url });
    const download = await downloadFile(url, zipPath, (p) => this.onProgress({ phase: 'download', ...p, version }), {
      expectedSha256: pinned || '',
    });

    this.onProgress({ phase: 'extract', message: '解压内核…', version });
    await fsp.rm(work, { recursive: true, force: true });
    await fsp.mkdir(work, { recursive: true });
    await extractZip(zipPath, work);

    let binary = path.join(work, chromeForTestingBinaryRelative(plat));
    if (!fs.existsSync(binary)) {
      const found = await findExecutable(work, process.platform === 'win32' ? ['chrome.exe'] : ['Google Chrome for Testing', 'chrome']);
      if (!found) throw new Error('解压后未找到浏览器可执行文件');
      binary = found;
    }
    binary = safeInstalledBinary(binary, work);
    if (!binary) throw new Error('内核可执行文件逃逸出安装目录或是符号链接');

    if (process.platform !== 'win32') {
      try { await fsp.chmod(binary, 0o755); } catch (_) {}
    }

    this.onProgress({ phase: 'validate', message: '验证已下载内核兼容性…', version, binary });
    await this.probeBrowserBinary(binary);

    this.meta.binary = binary;
    this.meta.version = version;
    this.meta.platform = plat;
    this.meta.updatedAt = new Date().toISOString();
    this.meta.source = SOURCE_CFT;
    this.meta.downloadUrl = url;
    this.meta.remoteVersion = version;
    this.meta.archiveSha256 = download.sha256 || null;
    await this.saveMeta();
    await this.recordInstallBaseline(work);
    if (isVersionedArchiveUrl(url, version) && download.sha256) {
      await pinArchiveSha256(this.kernelsRoot, url, download.sha256);
    }

    await fsp.rm(zipPath, { force: true }).catch(() => {});

    this.onProgress({ phase: 'done', message: 'Chrome for Testing 就绪', version, binary });
    return this.resolveInstalled();
  }

  async probeBrowserBinary(binaryPath) {
    const resolved = path.resolve(String(binaryPath || ''));
    if (isSystemBrowserExecutable(resolved)) throw new Error('不能选择本机已安装的 Chrome、Edge 或 Chromium 作为指纹浏览器内核');
    let stat;
    try { stat = await fsp.stat(resolved); } catch (_) { throw new Error('文件不存在: ' + resolved); }
    if (!stat.isFile()) throw new Error('内核路径必须是可执行文件: ' + resolved);
    if (process.platform !== 'win32') {
      try { await fsp.access(resolved, fs.constants.X_OK); } catch (_) { throw new Error('内核文件没有执行权限: ' + resolved); }
    }

    let versionOutput;
    try {
      const result = await execFileAsync(resolved, ['--version'], { timeout: 8000, windowsHide: true, maxBuffer: 64 * 1024 });
      versionOutput = String(result.stdout || result.stderr || '').trim();
    } catch (error) {
      throw new Error('无法执行内核版本检查：' + (error.message || error));
    }
    // A Firefox --version prints "Mozilla Firefox 141.0"; route it to the
    // Firefox probe so a custom local Firefox can also be selected.
    if (/firefox/i.test(versionOutput) && !/\b(chrome|chromium|wayfern)\b/i.test(versionOutput)) {
      const probe = await this.probeFirefoxBinary(resolved);
      return { ...probe, browser: `Firefox ${probe.version}` };
    }
    if (!/\b(chrome|chromium|wayfern)\b/i.test(versionOutput)) {
      throw new Error('所选文件不是受支持的 Chromium/Firefox 内核: ' + (versionOutput || '未返回版本信息'));
    }

    await fsp.mkdir(this.kernelsRoot, { recursive: true });
    const probeRoot = await fsp.mkdtemp(path.join(this.kernelsRoot, '.probe-'));
    let child;
    try {
      this.onProgress({ phase: 'validate', message: '验证自定义 Chromium 内核兼容性…', binary: resolved });
      await ensureKernelReadyForLaunch({ path: resolved }, versionOutput);
      child = spawn(resolved, [
        `--user-data-dir=${probeRoot}`,
        `--disk-cache-dir=${path.join(probeRoot, 'OpenBrowserCache')}`,
        `--crash-dumps-dir=${path.join(probeRoot, 'OpenBrowserCrashReports')}`,
        '--remote-debugging-port=0',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-mode',
        'about:blank',
      ], { detached: process.platform !== 'win32', windowsHide: false, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout?.setEncoding('utf8');
      child.stderr?.setEncoding('utf8');
      // spawn's 'error' is emitted asynchronously (binary deleted between stat
      // and spawn, wrong arch, permissions); without a listener it becomes an
      // uncaughtException and the probe degrades into a 12s port wait.
      const probeState = { spawnError: null };
      child.once('error', (error) => { probeState.spawnError = error; });
      const probeAbort = new Promise((_, reject) => {
        const poll = setInterval(() => { if (probeState.spawnError) { clearInterval(poll); reject(probeState.spawnError); } }, 100);
        setTimeout(() => clearInterval(poll), 30000).unref?.();
      });
      child._startupStdout = '';
      child._startupStderr = '';
      child.stdout?.on('data', (chunk) => { child._startupStdout = String(child._startupStdout + chunk).slice(-16 * 1024); });
      child.stderr?.on('data', (chunk) => { child._startupStderr = String(child._startupStderr + chunk).slice(-16 * 1024); });
      const port = await Promise.race([waitForDevToolsPort(probeRoot), probeAbort]);
      const details = await requestJson(`http://127.0.0.1:${port}/json/version`);
      if (!/\b(chrome|chromium|wayfern)\b/i.test(String(details.Browser || ''))) {
        throw new Error('CDP 返回的浏览器不是 Chromium 兼容内核');
      }
      const version = String(details.Browser || versionOutput).match(/(\d+(?:\.\d+){1,3})/)?.[1] || 'custom';
      return { path: resolved, version, browser: String(details.Browser), protocolVersion: String(details['Protocol-Version'] || '') };
    } catch (error) {
      const output = startupOutput(child);
      const status = child && child.exitCode !== null && child.exitCode !== undefined
        ? ` exitCode=${child.exitCode}${child.signalCode ? ` signal=${child.signalCode}` : ''}`
        : '';
      throw new Error('内核兼容性验证失败：' + (error.message || error) + status + (output ? ` browserOutput=${output}` : ''));
    } finally {
      await stopProbeProcess(child).catch(() => {});
      await fsp.rm(probeRoot, { recursive: true, force: true }).catch(() => {});
    }
  }

  async setCustomBinary(binaryPath) {
    const probe = await this.probeBrowserBinary(binaryPath);
    const isOpenBrowser = /[/\\]openbrowser[/\\]chrome_148[/\\]/i.test(probe.path)
      || path.basename(path.dirname(probe.path)) === 'MacOS' && /OpenBrowser$/i.test(path.basename(probe.path));
    const isFirefox = /firefox/i.test(String(probe.browser || ''));
    this.meta.binary = probe.path;
    this.meta.version = probe.version || (isOpenBrowser ? OPENBROWSER_KERNEL_VERSION : probe.version);
    this.meta.source = isOpenBrowser ? SOURCE_OPENBROWSER : SOURCE_CUSTOM;
    // A custom Firefox tree never matches a per-version install record, so the
    // integrity record is dropped here (mirrors the custom-Chromium behavior).
    if (isFirefox) {
      this.meta.pin = { engine: 'firefox', version: probe.version || 'custom', source: SOURCE_CUSTOM, path: probe.path };
      this.meta.installRoot = null;
      this.integritySummary = null;
    }
    this.meta.updatedAt = new Date().toISOString();
    this.meta.platform = donutPlatformKey();
    this.meta.downloadUrl = null;
    // The chosen binary is not a tree this manager installed, so any earlier
    // install record no longer describes what will actually run.
    this.meta.installRoot = null;
    this.integritySummary = null;
    await this.saveMeta();
    return { ...this.resolveInstalled(), validation: probe };
  }

  /** Check the Google Chrome Stable package without downloading it. */
  async checkUpdate() {
    await this.loadMeta();
    const installed = this.resolveInstalled();
    if (installed && installed.source !== SOURCE_CFT && installed.source !== SOURCE_CHROME_STABLE) {
      return {
        installed,
        remote: null,
        needsUpdate: false,
        upToDate: true,
        autoDownload: true,
      };
    }
    try {
      const release = await this.fetchChromeStableRelease();
      const needsUpdate = !installed || installed.source !== SOURCE_CHROME_STABLE;
      return {
        installed,
        remote: { version: release.version, source: release.source, url: release.url, platform: release.platform },
        needsUpdate,
        upToDate: Boolean(installed) && !needsUpdate,
        autoDownload: true,
      };
    } catch (error) {
      return { installed, remote: null, needsUpdate: false, upToDate: Boolean(installed), autoDownload: true, error: error.message };
    }
  }
}

module.exports = {
  BrowserKernelManager,
  platformKey: donutPlatformKey,
  donutPlatformKey,
  cftPlatformKey,
  chromeBinaryRelative: chromeForTestingBinaryRelative,
  openBrowserKernelBinaryRelative,
  findOpenBrowserKernelBinary,
  isMacX64Host,
  isOpenBrowser148SupportedHost,
  WAYFERN_META,
  CFT_META,
  CHROME_STABLE_PACKAGES,
  SOURCE_WAYFERN,
  SOURCE_CFT,
  SOURCE_CHROME_STABLE,
  SOURCE_CUSTOM,
  SOURCE_OPENBROWSER,
  SOURCE_MOZILLA,
  OPENBROWSER_KERNEL_VERSION,
  isWayfernKernel,
  companionLibraryForKernelBinary,
  isIntegratedKernelCdpReady,
  INTEGRATED_KERNEL_CDP_MARKERS,
  termsAcceptanceArgsForKernel,
  ensureKernelReadyForLaunch,
  compareVersions,
  validateArchiveMemberName,
  safeInstalledBinary,
  isVersionedArchiveUrl,
  extractFeedDigest,
  pinnedArchiveSha256,
  pinArchiveSha256,
  findWayfernKernelBinary,
  findBundledWayfernKernel,
  findBundledChromeForTesting,
  findBundledChromeStable,
  wayfernSeedDirNames,
  bundledKernelVersion,
  downloadFile,
  fetchJson,
  fetchText,
  extractZip,
  extractDeb,
  extractMsi,
  extractDmg,
  extractTarXz,
  extractTarGz,
  archiveKindFromUrl,
  resolveWayfernBinary,
  findExecutableSync,
};
