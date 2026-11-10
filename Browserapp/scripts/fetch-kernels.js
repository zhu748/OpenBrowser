#!/usr/bin/env node
'use strict';

/**
 * Fetch packaged kernel seeds from a GitHub Release ("kernel externalization").
 *
 * The 4.22 GB of kernel binaries under Browserapp/kernels/ is tracked by
 * git-LFS. This script provides the alternative source of truth: kernel
 * archives published on a GitHub Release (created by .github/workflows/
 * kernel-release.yml, tag scheme `kernels-vX.Y.Z`). CI, packaging and local
 * development can then materialize a platform seed without paying LFS
 * bandwidth/quota.
 *
 * Flow:
 *   1. resolve the release by tag (published releases via
 *      /releases/tags/<tag>; draft releases via /releases listing — the
 *      latter needs GITHUB_TOKEN/GH_TOKEN);
 *   2. download SHA256SUMS.txt, then every `kernels-<platform>*` archive for
 *      the requested platforms (multi-asset splits and `.partNN` byte-range
 *      shards are both supported for platforms above the 2 GiB release-asset
 *      limit);
 *   3. verify each archive's SHA-256 before it is used;
 *   4. extract into Browserapp/kernels/ so the archives' internal layout
 *      (<platform>/...) matches what prepare-bundled-kernel.js and
 *      package-portable.js expect;
 *   5. re-check the seed readiness and record a stamp in the cache dir.
 *
 * Idempotency: a seed that is already material (binaries present and not LFS
 * pointers) is left alone; a cached archive whose SHA-256 already matches is
 * not re-downloaded (automation/downloader.js handles both). --force
 * re-downloads and re-extracts.
 *
 * Zero new npm dependencies: only Node stdlib plus automation/downloader.js
 * (already in-tree, stdlib-only). Extraction prefers the system `tar`/
 * `unzip`/bsdtar binaries and falls back to the built-in pure-JS tar/zip
 * readers (the fallback exists for hosts without those tools; it is exercised
 * by --selftest against archives produced by the system tools).
 *
 * Env:
 *   GITHUB_TOKEN / GH_TOKEN      optional; needed for draft releases, private
 *                                repos, or when the anonymous API rate limit
 *                                is exhausted. Never printed or stored.
 *   OPENBROWSER_KERNEL_TAG       default release tag (overridden by --tag)
 *   OPENBROWSER_KERNEL_RELEASE_REPO   default `owner/name` (overridden by --repo)
 *   OPENBROWSER_KERNEL_EXTRACTOR 'auto' (default) | 'js' | 'system'
 *   OPENBROWSER_KERNEL_AUTO_FETCH '0' disables the auto-fetch hook used by
 *                                packaging (prepare-bundled-kernel /
 *                                package-portable); see
 *                                ensureKernelSeedForPackaging below.
 *
 * Usage:
 *   node scripts/fetch-kernels.js [--platform windows-x64|macos-x64|macos-arm64|all]
 *       [--tag kernels-vX.Y.Z] [--repo owner/name] [--cache-dir <dir>]
 *       [--dest <kernels-root>] [--dry-run] [--force] [--status] [--selftest]
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const { Downloader } = require('../automation/downloader');

const appRoot = path.resolve(__dirname, '..');
const DEFAULT_KERNELS_ROOT = path.join(appRoot, 'kernels');
const DEFAULT_CACHE_DIR = path.join(appRoot, '.kernel-release-cache');
const DEFAULT_TAG = 'kernels-v1';
const STATE_FILE = 'state.json';
const SUMS_ASSET = 'SHA256SUMS.txt';
const PART_SUFFIX_RE = /\.(part(?:[a-z]{2}|\d{2,3}))$/;

/** Kernel seed platforms managed by the kernel-release workflow. */
const KERNEL_PLATFORMS = Object.freeze(['windows-x64', 'macos-x64', 'macos-arm64']);

/**
 * Seed files whose presence (and non-pointer content) proves a platform seed
 * is material. Mirrors the assertions in prepare-bundled-kernel.js and the
 * "Verify kernel seed" steps in build-installers.yml.
 */
const PLATFORM_SEED_FILES = Object.freeze({
  'windows-x64': ['kernel.json', 'chrome.exe', 'chrome.dll'],
  'macos-x64': [
    'kernel.json',
    'chrome_148/openbrowser_148/OpenBrowser.app/Contents/MacOS/OpenBrowser',
    'chrome_148/openbrowser_148/OpenBrowser.app/Contents/MacOS/OpenBrowser.bin',
  ],
  'macos-arm64': ['kernel.json', 'Wayfern.app/Contents/MacOS/Wayfern'],
});

/** Hosts the downloader may follow redirects to (GitHub release storage). */
const GITHUB_DOWNLOAD_HOSTS = new Set([
  'api.github.com',
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
  'uploads.github.com',
]);

const LFS_POINTER_PREFIX = 'version https://git-lfs';

function log(...args) { console.log('[kernels]', ...args); }
function warn(...args) { console.warn('[kernels] WARNING:', ...args); }

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value >= 1073741824) return `${(value / 1073741824).toFixed(2)} GiB`;
  if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MiB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${value} B`;
}

function resolveDefaultRepo() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
    const url = String((pkg.repository && pkg.repository.url) || '');
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/i);
    if (match) return `${match[1]}/${match[2]}`;
  } catch (_) { /* fall through to the hardcoded default */ }
  return 'zhu748/OpenBrowser';
}

function githubToken() {
  const value = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  return String(value).trim();
}

function defaultTag() {
  return String(process.env.OPENBROWSER_KERNEL_TAG || DEFAULT_TAG).trim() || DEFAULT_TAG;
}

function defaultRepo() {
  return String(process.env.OPENBROWSER_KERNEL_RELEASE_REPO || '').trim() || resolveDefaultRepo();
}

/*
 * wayfern_fonts 布局（docs/wayfern-fonts-dedup-plan.md 阶段 1）：字体正本在共享目录
 * kernels/wayfern-fonts；windows-x64 种子内的 wayfern_fonts 由
 * scripts/materialize-wayfern-fonts.js 物化（package-portable / prepare-bundled-kernel /
 * CI 均已接入）。kernel-release.yml 打 windows-x64 归档前已物化字体，归档布局与历史
 * 一致（归档内仍含 kernels/windows-x64/wayfern_fonts），因此本脚本 fetch 之后无需
 * 额外物化；纯 `git lfs pull` 的本地检出需另跑一次 `npm run fonts:materialize`。
 */
/** True when the file on disk is a git-LFS pointer rather than real content. */
function isLfsPointerFile(file) {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const buf = Buffer.alloc(LFS_POINTER_PREFIX.length + 8);
      const read = fs.readSync(fd, buf, 0, buf.length, 0);
      return buf.subarray(0, read).toString('utf8').startsWith(LFS_POINTER_PREFIX);
    } finally {
      fs.closeSync(fd);
    }
  } catch (_) {
    return false;
  }
}

/**
 * Readiness of one platform seed: every PLATFORM_SEED_FILES entry must exist
 * with real (non-pointer) content. `pointerFiles` counts pointer files in the
 * tree (informational; a partially pulled LFS tree can still report ready if
 * the binaries are material, which is all packaging consumes).
 */
function platformReadiness(kernelsRoot, platform) {
  const result = { platform, ready: false, missing: [], pointerSeeds: [], seedDir: null, pointerFiles: 0, totalFiles: 0 };
  if (!KERNEL_PLATFORMS.includes(platform)) return result;
  const seedDir = path.join(kernelsRoot, platform);
  result.seedDir = seedDir;
  for (const rel of PLATFORM_SEED_FILES[platform]) {
    const file = path.join(kernelsRoot, platform, rel);
    try {
      const stat = fs.lstatSync(file);
      if (stat.isSymbolicLink()) throw new Error('symlink');
      if (isLfsPointerFile(file)) result.pointerSeeds.push(rel);
    } catch (_) {
      result.missing.push(rel);
    }
  }
  result.ready = result.missing.length === 0 && result.pointerSeeds.length === 0;
  try {
    walkSeed(seedDir, (file) => {
      result.totalFiles += 1;
      if (isLfsPointerFile(file)) result.pointerFiles += 1;
    });
  } catch (_) { /* dir absent or unreadable; counts stay zero */ }
  return result;
}

function walkSeed(dir, visit) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) walkSeed(full, visit);
    else if (entry.isFile()) visit(full);
  }
}

/** Reject archive members that escape the extraction root. */
function isSafeMemberName(name) {
  if (!name || name.includes('\0')) return false;
  if (name.startsWith('/') || name.startsWith('\\')) return false;
  if (/^[a-zA-Z]:/.test(name)) return false;
  const parts = String(name).split(/[\\/]/);
  return parts.every((part) => part !== '..');
}

/* ------------------------------------------------------------------ *
 * SHA256SUMS.txt parsing and asset selection
 * ------------------------------------------------------------------ */

/**
 * Parse `sha256sum`-style output: `<64 hex>[ *]<filename>` per line, `#`
 * comments and blank lines ignored. Returns a Map name -> lowercase sha256.
 */
function parseSums(text) {
  const sums = new Map();
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([0-9a-fA-F]{64})\s+\*?(.+)$/);
    if (!match) throw new Error(`malformed SHA256SUMS line: ${rawLine.slice(0, 80)}`);
    const name = match[2].trim();
    if (!name) throw new Error(`malformed SHA256SUMS line (empty name): ${rawLine.slice(0, 80)}`);
    if (sums.has(name)) throw new Error(`duplicate SHA256SUMS entry: ${name}`);
    sums.set(name, match[1].toLowerCase());
  }
  return sums;
}

/** True when a release asset belongs to the given kernel platform. */
function assetMatchesPlatform(assetName, platform) {
  const name = String(assetName || '');
  return name === `kernels-${platform}`
    || name.startsWith(`kernels-${platform}.`)
    || name.startsWith(`kernels-${platform}-`);
}

function metaAssets(assetNames) {
  return assetNames.filter((name) => name === 'kernels-meta' || name.startsWith('kernels-meta.') || name.startsWith('kernels-meta-'));
}

/**
 * Group `.partNN` shards: [{name, sha}] -> [{base, parts: [{name, sha}]}] for
 * sharded archives, plus untouched single archives. Order of parts is the
 * alphabetical order of their suffixes (partaa < partab, part01 < part02).
 */
function groupPartAssets(assets) {
  const singles = [];
  const groups = new Map();
  for (const asset of assets) {
    const match = String(asset.name).match(PART_SUFFIX_RE);
    if (!match) {
      singles.push({ ...asset });
      continue;
    }
    const base = asset.name.slice(0, asset.name.length - match[0].length);
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push(asset);
  }
  const sharded = [];
  for (const [base, parts] of groups) {
    parts.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    sharded.push({ base, parts });
  }
  sharded.sort((a, b) => a.base.localeCompare(b.base));
  singles.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return { singles, sharded };
}

/* ------------------------------------------------------------------ *
 * GitHub REST helpers (metadata only; bulk downloads use Downloader)
 * ------------------------------------------------------------------ */

function apiHeaders(token, extra = {}) {
  const headers = {
    'User-Agent': 'OpenBrowser-kernel-fetch/1.0',
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

class ReleaseNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ReleaseNotFoundError';
  }
}

async function apiGetJson(url, token) {
  const res = await fetch(url, { headers: apiHeaders(token), redirect: 'follow' });
  if (res.status === 404) throw new ReleaseNotFoundError(`not found: ${url}`);
  if (res.status === 401) {
    throw new Error('GitHub API rejected the token (401). Check GITHUB_TOKEN/GH_TOKEN.');
  }
  if (res.status === 403 || res.status === 429) {
    throw new Error(
      'GitHub API rate limit or access denied (403/429). '
      + 'Set GITHUB_TOKEN or GH_TOKEN to authenticate and retry.'
    );
  }
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * Resolve a release by tag. Published releases resolve via
 * /releases/tags/<tag>. Draft releases have no git tag yet, so they are only
 * discoverable through the authenticated /releases listing; match tag_name.
 */
async function resolveRelease({ repo, tag, token }) {
  const byTag = `https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`;
  try {
    return await apiGetJson(byTag, token);
  } catch (err) {
    if (!(err instanceof ReleaseNotFoundError)) throw err;
  }
  if (!token) {
    throw new ReleaseNotFoundError(
      `release ${tag} not found in ${repo} (and no GITHUB_TOKEN/GH_TOKEN to list draft releases). `
      + 'Draft kernel releases are invisible to anonymous clients; publish the release or set a token.'
    );
  }
  for (let page = 1; page <= 10; page += 1) {
    const listUrl = `https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`;
    const releases = await apiGetJson(listUrl, token);
    if (!Array.isArray(releases) || releases.length === 0) break;
    for (const release of releases) {
      if (String(release.tag_name || '') === String(tag)) return release;
    }
    if (releases.length < 100) break;
  }
  throw new ReleaseNotFoundError(`release ${tag} not found in ${repo} (published or draft).`);
}

/** Download URL for a release asset. With a token use the API endpoint so
 *  draft releases and private repos work; anonymous public downloads use the
 *  browser URL. */
function assetDownloadUrl(asset, token) {
  if (token && asset.url) return asset.url;
  if (asset.browser_download_url) return asset.browser_download_url;
  throw new Error(`asset ${asset.name} exposes no download URL`);
}

function validateDownloadUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (err) {
    throw new Error(`invalid download url: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`insecure download url: ${url}`);
  if (!GITHUB_DOWNLOAD_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error(`unexpected download host: ${parsed.hostname}`);
  }
}

/* ------------------------------------------------------------------ *
 * Archive download + verification + extraction
 * ------------------------------------------------------------------ */

async function downloadAsset(asset, { cacheDir, token, force }) {
  const sha = asset._sha256;
  if (!sha) throw new Error(`no SHA-256 known for asset ${asset.name}; refusing unverified download`);
  const destPath = path.join(cacheDir, asset.name);
  if (!force && fs.existsSync(destPath)) {
    const existing = await Downloader.digestFile(destPath, 'sha256');
    if (existing === sha) {
      log(`cache hit ${asset.name} (${formatBytes(asset.size || 0)}, sha256 verified)`);
      return { path: destPath, skipped: true };
    }
    warn(`cached ${asset.name} fails verification; re-downloading`);
  }
  const url = assetDownloadUrl(asset, token);
  // The User-Agent is mandatory: GitHub's asset endpoint answers requests
  // without one with a bare 403 (Node's https.get sends no default UA).
  const headers = {
    'User-Agent': 'OpenBrowser-kernel-fetch/1.0',
    Accept: 'application/octet-stream',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const downloader = new Downloader(url, {
    destPath,
    fileName: asset.name,
    expectedSha256: sha,
    retries: 3,
    headers,
    validateUrl: validateDownloadUrl,
  });
  let lastReport = 0;
  downloader.on('progress', ({ received, total, speed }) => {
    const now = Date.now();
    const done = total > 0 && received >= total;
    if (!done && now - lastReport < 2000) return;
    lastReport = now;
    const pct = total > 0 ? `${Math.floor((received / total) * 100)}%` : '?%';
    process.stdout.write(
      `  ${asset.name}  ${pct}  ${formatBytes(received)}${total ? ` / ${formatBytes(total)}` : ''}`
      + `  ${formatBytes(speed || 0)}/s${done || !process.stdout.isTTY ? '\n' : '\r'}`
    );
  });
  const result = await downloader.start();
  if (!result.skipped) log(`downloaded ${asset.name} (${formatBytes(result.bytes)}, sha256 verified, ${result.attempts} attempt(s))`);
  return { path: result.path, skipped: false };
}

/** Concatenate part files into `base` with streams (works for multi-GiB). */
async function joinPartFiles(parts, basePath) {
  const out = fs.createWriteStream(basePath);
  try {
    for (const part of parts) {
      await new Promise((resolve, reject) => {
        const src = fs.createReadStream(part);
        src.on('error', reject);
        out.on('error', reject);
        src.on('end', resolve);
        src.pipe(out, { end: false });
      });
    }
    await new Promise((resolve, reject) => { out.end(resolve); out.on('error', reject); });
  } catch (err) {
    out.destroy();
    throw err;
  }
  log(`joined ${parts.length} parts -> ${path.basename(basePath)}`);
}

function hasSystemBinary(name) {
  const probe = process.platform === 'win32' ? spawnSync('where', [name]) : spawnSync('which', [name]);
  return probe.status === 0;
}

/**
 * Extract a kernel archive into destRoot. Prefers system tools (battle-tested
 * with exotic tar entries); OPENBROWSER_KERNEL_EXTRACTOR=js forces the
 * built-in readers (also the fallback when the tools are missing).
 */
async function extractArchive(archivePath, destRoot) {
  fs.mkdirSync(destRoot, { recursive: true });
  const prefer = String(process.env.OPENBROWSER_KERNEL_EXTRACTOR || 'auto').toLowerCase();
  const name = path.basename(archivePath);
  const isTar = /\.tar\.gz$|\.tgz$|\.tar$/.test(name);
  const isZip = name.endsWith('.zip');
  if (!isTar && !isZip) throw new Error(`unsupported kernel archive format: ${name} (expected .tar.gz or .zip)`);
  if (prefer !== 'js') {
    if (isTar && hasSystemBinary('tar')) {
      const plain = name.endsWith('.tar');
      const args = plain ? ['-xf', archivePath, '-C', destRoot] : ['-xzf', archivePath, '-C', destRoot];
      const run = spawnSync('tar', args, { stdio: ['ignore', 'ignore', 'pipe'] });
      if (run.status === 0) return { engine: 'system-tar' };
      // GNU tar refuses some bsdtar-produced entries; fall through to the
      // built-in reader before giving up.
      warn(`system tar failed on ${name} (exit ${run.status}); retrying with the built-in reader`);
    }
    if (isZip && hasSystemBinary('unzip')) {
      const run = spawnSync('unzip', ['-oq', archivePath, '-d', destRoot], { stdio: ['ignore', 'ignore', 'pipe'] });
      if (run.status === 0) return { engine: 'system-unzip' };
      warn(`system unzip failed on ${name} (exit ${run.status}); retrying with the built-in reader`);
    }
    if (isZip && hasSystemBinary('tar')) { // bsdtar (Windows System32) reads zip too
      const run = spawnSync('tar', ['-xf', archivePath, '-C', destRoot], { stdio: ['ignore', 'ignore', 'pipe'] });
      if (run.status === 0) return { engine: 'system-bsdtar-zip' };
      warn(`bsdtar zip extraction failed on ${name} (exit ${run.status}); retrying with the built-in reader`);
    }
  }
  if (isTar) return extractTarJs(archivePath, destRoot);
  return extractZipJs(archivePath, destRoot);
}

/* -------------------------- pure-JS tar reader -------------------------- */

function parseTarHeader(block) {
  const readString = (offset, length) => {
    const slice = block.subarray(offset, offset + length);
    const nul = slice.indexOf(0);
    return slice.subarray(0, nul === -1 ? slice.length : nul).toString('utf8');
  };
  const readOctal = (offset, length) => {
    const text = readString(offset, length).trim();
    if (!text) return 0;
    const value = parseInt(text, 8);
    if (Number.isNaN(value)) throw new Error(`malformed tar octal field: ${text}`);
    return value;
  };
  const header = {
    name: readString(0, 100),
    mode: readOctal(100, 8),
    size: readOctal(124, 12),
    typeflag: String.fromCharCode(block[156]) === '\0' ? '0' : String.fromCharCode(block[156]),
    linkname: readString(157, 100),
    prefix: readString(345, 155),
  };
  const magic = readString(257, 6);
  if (magic && !magic.startsWith('ustar')) throw new Error(`unsupported tar header magic: ${magic}`);
  return header;
}

/** Parse pax extended header records ("len key=value\n"). */
function parsePaxRecords(buffer) {
  const records = {};
  let offset = 0;
  while (offset < buffer.length) {
    const spaceIndex = buffer.indexOf(0x20, offset);
    if (spaceIndex === -1) break;
    const length = parseInt(buffer.subarray(offset, spaceIndex).toString('ascii'), 10);
    if (!Number.isFinite(length) || length <= 0 || offset + length > buffer.length) break;
    const record = buffer.subarray(offset, offset + length).toString('utf8');
    const eq = record.indexOf('=');
    if (eq !== -1) {
      const key = record.slice(record.indexOf(' ') + 1, eq);
      const value = record.slice(eq + 1).replace(/\n$/, '');
      records[key] = value;
    }
    offset += length;
  }
  return records;
}

/**
 * Streaming ustar/pax/GNU-longname reader. Archives are read in 512-byte
 * blocks so multi-GiB kernels never sit in memory; file payloads are piped to
 * disk. Members must pass isSafeMemberName before anything is written.
 */
async function extractTarJs(archivePath, destRoot) {
  const gunzip = /\.tgz$|\.tar\.gz$/.test(path.basename(archivePath));
  const input = fs.createReadStream(archivePath);
  const stream = gunzip ? input.pipe(zlib.createGunzip()) : input;
  let carry = Buffer.alloc(0);
  let state = 'header'; // 'header' | 'data' | 'meta' | 'skip'
  let entry = null;
  let remaining = 0;
  let padding = 0;
  let pendingLongName = null;
  let paxRecords = null;
  let globalRecords = {};
  let writer = null;
  let zeroBlocks = 0;
  let extracted = 0;

  const openWriter = async (target) => {
    await fsp.mkdir(path.dirname(target), { recursive: true });
    return fs.createWriteStream(target);
  };

  const symlinkStaysInRoot = (target, linkname) => {
    if (!linkname) return false;
    if (path.isAbsolute(linkname)) return false;
    const resolved = path.resolve(path.dirname(target), linkname);
    return resolved === destRoot || resolved.startsWith(destRoot + path.sep);
  };

  const finishEntry = async () => {
    if (!entry) return;
    if (writer) {
      await new Promise((resolve, reject) => { writer.end(resolve); writer.on('error', reject); });
      writer = null;
    }
    if (entry.typeflag === '5') {
      await fsp.mkdir(entry.target, { recursive: true });
    } else if (entry.typeflag === '2') {
      await fsp.mkdir(path.dirname(entry.target), { recursive: true });
      if (!symlinkStaysInRoot(entry.target, entry.linkname)) {
        warn(`symlink ${entry.name} -> ${entry.linkname} escapes the extraction root; entry skipped`);
      } else {
        try {
          fs.symlinkSync(entry.linkname, entry.target, 'file');
        } catch (err) {
          warn(`cannot create symlink ${entry.name} -> ${entry.linkname} (${err.code || err.message}); entry skipped`);
        }
      }
    } else if (entry.typeflag === '1') {
      warn(`hardlink member ${entry.name} skipped (git checkouts never produce hardlinks)`);
    } else if (entry.typeflag === '0') {
      if (entry.hadWriter) {
        if (entry.mode & 0o111) { try { fs.chmodSync(entry.target, 0o755); } catch (_) {} }
      } else {
        // size-0 regular file: the writer was never opened, create it now.
        await fsp.writeFile(entry.target, '');
        if (entry.mode & 0o111) { try { fs.chmodSync(entry.target, 0o755); } catch (_) {} }
      }
    }
    extracted += 1;
    entry = null;
  };

  const beginEntry = async (header) => {
    const effectivePax = { ...globalRecords, ...(paxRecords || {}) };
    let name = header.prefix ? `${header.prefix}/${header.name}` : header.name;
    if (pendingLongName) { name = pendingLongName; pendingLongName = null; }
    if (effectivePax.path) name = effectivePax.path;
    let linkname = header.linkname;
    if (effectivePax.linkname) linkname = effectivePax.linkname;
    let size = header.size;
    if (effectivePax.size !== undefined) size = parseInt(effectivePax.size, 10) || 0;
    let mode = header.mode || 0o644;
    if (effectivePax.mode !== undefined) mode = parseInt(effectivePax.mode, 8) || mode;
    paxRecords = null;

    if (header.typeflag === 'L' || header.typeflag === 'x' || header.typeflag === 'X' || header.typeflag === 'g') {
      // Meta entry whose payload describes the next entry (GNU long name or
      // pax records). Zero-sized meta entries have nothing to contribute.
      if (size > 0) {
        state = 'meta';
        entry = { typeflag: header.typeflag, size };
        remaining = size;
        padding = (512 - (size % 512)) % 512;
      } else {
        state = 'header';
        entry = null;
      }
      return;
    }
    if (!isSafeMemberName(name)) throw new Error(`unsafe tar member name: ${name}`);
    const isRegular = header.typeflag === '0' || header.typeflag === '7';
    entry = {
      name,
      typeflag: header.typeflag,
      linkname,
      mode,
      size,
      hadWriter: isRegular && size > 0,
      target: path.join(destRoot, name.split('/').join(path.sep)),
    };
    remaining = size;
    padding = (512 - (size % 512)) % 512;
    if (entry.hadWriter) {
      writer = await openWriter(entry.target);
      state = 'data';
    } else if (remaining > 0) {
      state = 'skip'; // payload exists (unhandled member type) — consume and move on
    } else {
      state = 'header'; // size-0 entry: nothing to consume; completes on the next header
    }
  };

  const feedMeta = (chunk) => {
    entry._buffer = entry._buffer ? Buffer.concat([entry._buffer, chunk]) : chunk;
  };

  const endMeta = () => {
    const payload = entry._buffer || Buffer.alloc(0);
    if (entry.typeflag === 'L') {
      pendingLongName = payload.toString('utf8').replace(/\0+$/, '');
    } else if (entry.typeflag === 'x' || entry.typeflag === 'X') {
      paxRecords = parsePaxRecords(payload);
    } else if (entry.typeflag === 'g') {
      // Global pax records persist for the rest of the archive.
      globalRecords = parsePaxRecords(payload);
    }
    entry = null;
  };

  for await (const chunk of stream) {
    carry = carry.length ? Buffer.concat([carry, chunk]) : chunk;
    let progressed = true;
    while (progressed) {
      progressed = false;
      if (state === 'done') break;
      if (state === 'header') {
        // Trailing padding of the previous entry's data block is dropped
        // only here — never before the data itself has been consumed.
        if (padding > 0) {
          const drop = Math.min(carry.length, padding);
          carry = carry.subarray(drop);
          padding -= drop;
          progressed = drop > 0;
          continue;
        }
        if (carry.length >= 512) {
          const block = carry.subarray(0, 512);
          carry = carry.subarray(512);
          progressed = true;
          if (block.every((byte) => byte === 0)) {
            zeroBlocks += 1;
            if (zeroBlocks >= 2) state = 'done';
            continue;
          }
          zeroBlocks = 0;
          await finishEntry();
          await beginEntry(parseTarHeader(block));
        }
        continue;
      }
      // state 'data' | 'meta' | 'skip': consume the current entry's payload.
      if (remaining > 0 && carry.length > 0) {
        const take = Math.min(carry.length, remaining);
        const piece = carry.subarray(0, take);
        carry = carry.subarray(take);
        remaining -= take;
        progressed = true;
        if (state === 'data' && writer) {
          writer.write(piece);
          // Respect backpressure so multi-GiB members never buffer in RAM.
          if (writer.writableLength > 8 * 1024 * 1024) {
            await new Promise((resolve) => { writer.once('drain', resolve); });
          }
        } else if (state === 'meta') feedMeta(piece);
        if (remaining === 0) {
          if (state === 'meta') endMeta();
          else await finishEntry();
          state = 'header';
        }
      }
    }
    if (state === 'done') break;
  }
  await finishEntry();
  return { engine: 'js-tar', entries: extracted };
}

/* -------------------------- pure-JS zip reader -------------------------- */

/** Parse an EOCD record; returns {count, cdOffset, cdSize, zip64}. */
function parseZipEocd(tail) {
  for (let i = tail.length - 22; i >= 0; i -= 1) {
    if (tail.readUInt32LE(i) !== 0x06054b50) continue;
    const eocd = tail.subarray(i, i + 22);
    let count = eocd.readUInt16LE(10);
    let cdSize = eocd.readUInt32LE(12);
    let cdOffset = eocd.readUInt32LE(16);
    let zip64 = false;
    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      zip64 = true;
      // zip64 EOCD locator sits 20 bytes before the classic EOCD.
      const locatorOffset = i - 20;
      if (locatorOffset >= 0 && tail.readUInt32LE(locatorOffset) === 0x07064b50) {
        const zip64Offset = Number(tail.readBigUInt64LE(locatorOffset + 8));
        // The zip64 EOCD itself is read by the caller (needs a wider read).
        return { count, cdSize, cdOffset, zip64, zip64EocdOffset: zip64Offset };
      }
    }
    return { count, cdSize, cdOffset, zip64 };
  }
  return null;
}

function parseZip64Eocd(buffer) {
  // buffer starts at the zip64 EOCD signature (0x06064b50).
  return {
    count: Number(buffer.readBigUInt64LE(32)),
    cdSize: Number(buffer.readBigUInt64LE(40)),
    cdOffset: Number(buffer.readBigUInt64LE(48)),
  };
}

/**
 * Minimal zip reader for kernel archives: stored + deflate members, unix
 * permission bits (exec) and symlinks, via random access on the file
 * descriptor (multi-GiB archives are never fully loaded; each member is
 * decompressed on its own — the largest single kernel file is ~310 MiB).
 */
async function extractZipJs(archivePath, destRoot) {
  const file = await fsp.open(archivePath, 'r');
  try {
    const { size } = await file.stat();
    const tailLength = Math.min(size, 66 * 1024);
    const tail = Buffer.alloc(tailLength);
    await file.read(tail, 0, tailLength, size - tailLength);
    let eocd = parseZipEocd(tail);
    if (!eocd) throw new Error('zip end-of-central-directory not found (corrupt archive?)');
    let { count, cdOffset, cdSize } = eocd;
    if (eocd.zip64) {
      if (eocd.zip64EocdOffset === undefined) throw new Error('zip64 archive without locator');
      const z64 = Buffer.alloc(56);
      await file.read(z64, 0, 56, eocd.zip64EocdOffset);
      if (z64.readUInt32LE(0) !== 0x06064b50) throw new Error('zip64 EOCD signature mismatch');
      const parsed = parseZip64Eocd(z64);
      count = parsed.count;
      cdOffset = parsed.cdOffset;
      cdSize = parsed.cdSize;
    }
    const cd = Buffer.alloc(cdSize);
    await file.read(cd, 0, cdSize, cdOffset);

    const entries = [];
    let offset = 0;
    while (offset + 46 <= cd.length) {
      if (cd.readUInt32LE(offset) !== 0x02014b50) break;
      const flags = cd.readUInt16LE(offset + 8);
      const method = cd.readUInt16LE(offset + 10);
      const compSize = cd.readUInt32LE(offset + 20);
      const nameLen = cd.readUInt16LE(offset + 28);
      const extraLen = cd.readUInt16LE(offset + 30);
      const commentLen = cd.readUInt16LE(offset + 32);
      const externalAttrs = cd.readUInt32LE(offset + 38);
      const localOffset = cd.readUInt32LE(offset + 42);
      const isUtf8 = (flags & 0x800) !== 0;
      const name = cd.subarray(offset + 46, offset + 46 + nameLen).toString(isUtf8 ? 'utf8' : 'latin1');
      entries.push({ method, compSize, externalAttrs, localOffset, name });
      offset += 46 + nameLen + extraLen + commentLen;
    }
    if (entries.length !== count) throw new Error(`zip central directory count mismatch (found ${entries.length}, expected ${count})`);

    let extracted = 0;
    for (const entry of entries) {
      if (!isSafeMemberName(entry.name)) throw new Error(`unsafe zip member name: ${entry.name}`);
      const target = path.join(destRoot, entry.name.split('/').join(path.sep));
      const unixMode = (entry.externalAttrs >>> 16) & 0xffff;
      const isSymlink = (unixMode & 0xf000) === 0xa000;
      if (entry.name.endsWith('/')) {
        await fsp.mkdir(target, { recursive: true });
        extracted += 1;
        continue;
      }
      const local = Buffer.alloc(30);
      await file.read(local, 0, 30, entry.localOffset);
      if (local.readUInt32LE(0) !== 0x04034b50) throw new Error(`zip local header mismatch for ${entry.name}`);
      const localNameLen = local.readUInt16LE(26);
      const localExtraLen = local.readUInt16LE(28);
      const dataOffset = entry.localOffset + 30 + localNameLen + localExtraLen;
      await fsp.mkdir(path.dirname(target), { recursive: true });
      if (isSymlink) {
        const raw = Buffer.alloc(entry.compSize);
        await file.read(raw, 0, entry.compSize, dataOffset);
        const linkTarget = entry.method === 8 ? zlib.inflateRawSync(raw).toString('utf8') : raw.toString('utf8');
        // Same lexical containment the js-tar extractor enforces
        // (symlinkStaysInRoot): a link name escaping destRoot would let a
        // later member write through it outside the extraction root.
        const linkResolved = linkTarget && !path.isAbsolute(linkTarget)
          ? path.resolve(path.dirname(target), linkTarget)
          : null;
        if (!linkResolved || (linkResolved !== destRoot && !linkResolved.startsWith(destRoot + path.sep))) {
          warn(`symlink ${entry.name} -> ${linkTarget} escapes the extraction root; entry skipped`);
        } else {
          try {
            fs.symlinkSync(linkTarget, target, 'file');
          } catch (err) {
            warn(`cannot create symlink ${entry.name} (${err.code || err.message}); entry skipped`);
          }
        }
        extracted += 1;
        continue;
      }
      if (entry.method !== 0 && entry.method !== 8) throw new Error(`unsupported zip compression method ${entry.method} for ${entry.name}`);
      const raw = Buffer.alloc(entry.compSize);
      await file.read(raw, 0, entry.compSize, dataOffset);
      const payload = entry.method === 8 ? zlib.inflateRawSync(raw) : raw;
      await fsp.writeFile(target, payload);
      if (unixMode & 0o111) { try { fs.chmodSync(target, 0o755); } catch (_) {} }
      extracted += 1;
    }
    return { engine: 'js-zip', entries: extracted };
  } finally {
    await file.close();
  }
}

/* ------------------------------------------------------------------ *
 * State stamp (cache dir)
 * ------------------------------------------------------------------ */

async function readState(cacheDir) {
  try {
    return JSON.parse(await fsp.readFile(path.join(cacheDir, STATE_FILE), 'utf8'));
  } catch (_) {
    return {};
  }
}

async function writeState(cacheDir, state) {
  await fsp.mkdir(cacheDir, { recursive: true });
  const target = path.join(cacheDir, STATE_FILE);
  const tmp = `${target}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fsp.rename(tmp, target);
}

/* ------------------------------------------------------------------ *
 * Main fetch flow
 * ------------------------------------------------------------------ */

function lfsFallbackHint(platform) {
  return [
    'Kernel seed fallback options:',
    `  A) kernel release: node scripts/fetch-kernels.js --platform ${platform} --tag <kernels-vX.Y.Z>`,
    '     (set GITHUB_TOKEN/GH_TOKEN for draft releases, private repos or rate limits)',
    `  B) git LFS (classic path): git lfs pull --include "Browserapp/kernels/${platform}/**"`,
  ].join('\n');
}

/**
 * Download and extract kernel seeds for the requested platforms.
 * Returns { fetched: [{platform, assets}], skipped: [platform] }.
 */
async function fetchKernels(options = {}) {
  const {
    platforms,
    tag = defaultTag(),
    repo = defaultRepo(),
    kernelsRoot = DEFAULT_KERNELS_ROOT,
    cacheDir = DEFAULT_CACHE_DIR,
    dryRun = false,
    force = false,
    token = githubToken(),
  } = options;

  const pending = platforms.filter((platform) => force || !platformReadiness(kernelsRoot, platform).ready);
  const skipped = platforms.filter((platform) => !pending.includes(platform));
  for (const platform of skipped) {
    log(`seed ${platform} already material and verified locally — skipping (use --force to re-fetch)`);
  }
  if (pending.length === 0) return { fetched: [], skipped };

  log(`resolving kernel release ${tag} in ${repo}${token ? ' (authenticated)' : ' (anonymous)'}`);
  const release = await resolveRelease({ repo, tag, token });
  const assetNames = (release.assets || []).map((asset) => asset.name);
  log(`release found: ${release.name || release.tag_name}${release.draft ? ' [draft]' : ''} (${assetNames.length} assets)`);

  // SHA256SUMS.txt is the integrity source. Per-platform SHA256SUMS-*.txt
  // files (uploaded before the finalize job merges them) are accepted so a
  // partially assembled release still verifies.
  let sumsText = null;
  const sumsAsset = (release.assets || []).find((asset) => asset.name === SUMS_ASSET);
  if (sumsAsset) {
    sumsText = await downloadSmallText(sumsAsset, { token });
  } else {
    const partial = (release.assets || []).filter((asset) => /^SHA256SUMS-[^\s]+\.txt$/.test(asset.name));
    if (partial.length > 0) {
      const parts = [];
      for (const asset of partial) parts.push(await downloadSmallText(asset, { token }));
      sumsText = parts.join('\n');
      warn(`${SUMS_ASSET} not assembled yet; merged ${partial.length} per-platform checksum files`);
    }
  }
  if (!sumsText) {
    throw new Error(`release ${tag} carries neither ${SUMS_ASSET} nor SHA256SUMS-*.txt; refusing unverified downloads.\n${lfsFallbackHint(pending[0])}`);
  }
  const sums = parseSums(sumsText);

  const plan = [];
  const collectAssets = (platform) => {
    const names = assetNames.filter((name) => assetMatchesPlatform(name, platform));
    for (const name of names) {
      if (!sums.has(name)) throw new Error(`asset ${name} is missing from ${SUMS_ASSET}; refusing unverified download`);
    }
    return names.map((name) => {
      const asset = (release.assets || []).find((entry) => entry.name === name);
      asset._sha256 = sums.get(name);
      return asset;
    });
  };

  for (const platform of pending) {
    plan.push({ platform, assets: collectAssets(platform) });
  }
  const metaNames = metaAssets(assetNames);
  // Meta assets are extracted into kernels/ exactly like kernel archives, so
  // the strict SHA256SUMS policy applies to them too: an asset absent from the
  // manifest fails the fetch here, before anything is downloaded. The old
  // warn-and-proceed path was doubly broken — the consumption loop silently
  // skipped assets without a checksum (packaged meta content went missing with
  // no error), and dropping that guard would have turned them into unverified
  // downloads extracted straight into kernels/.
  const metaPlan = metaNames.map((name) => {
    const asset = (release.assets || []).find((entry) => entry.name === name);
    if (!sums.has(name)) throw new Error(`meta asset ${name} is missing from ${SUMS_ASSET}; refusing unverified download`);
    asset._sha256 = sums.get(name);
    return asset;
  });

  if (dryRun) {
    log('dry run — nothing will be downloaded or extracted');
    for (const item of plan) {
      const total = item.assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
      log(`would fetch ${item.platform}: ${item.assets.map((a) => a.name).join(', ')} (${formatBytes(total)})`);
    }
    if (metaPlan.length > 0) log(`would fetch meta: ${metaPlan.map((a) => a.name).join(', ')}`);
    log(`cache dir: ${cacheDir}`);
    log(`extraction root: ${kernelsRoot}`);
    return { fetched: [], skipped, dryRun: true };
  }

  await fsp.mkdir(cacheDir, { recursive: true });
  const state = await readState(cacheDir);
  state.tag = tag;
  state.repo = repo;
  state.platforms = state.platforms || {};

  const fetched = [];
  for (const item of plan) {
    const { platform, assets } = item;
    if (assets.length === 0) {
      throw new Error(`release ${tag} has no kernel assets for ${platform} (expected kernels-${platform}*.tar.gz|zip).\n${lfsFallbackHint(platform)}`);
    }
    log(`fetching ${platform}: ${assets.map((a) => a.name).join(', ')}`);
    const { singles, sharded } = groupPartAssets(assets);
    const archivePaths = [];
    for (const asset of singles) {
      const result = await downloadAsset(asset, { cacheDir, token, force });
      archivePaths.push({ asset, path: result.path });
    }
    for (const group of sharded) {
      if (!sums.has(group.base)) {
        throw new Error(`sharded asset ${group.base} has no joined checksum in ${SUMS_ASSET}`);
      }
      const partPaths = [];
      for (const part of group.parts) {
        const result = await downloadAsset(part, { cacheDir, token, force });
        partPaths.push(result.path);
      }
      const joinedPath = path.join(cacheDir, group.base);
      await joinPartFiles(partPaths, joinedPath);
      const joinedSha = await Downloader.digestFile(joinedPath, 'sha256');
      if (joinedSha !== sums.get(group.base)) {
        await fsp.rm(joinedPath, { force: true });
        throw new Error(`sharded asset ${group.base} failed joined SHA-256 verification`);
      }
      archivePaths.push({ asset: { name: group.base, size: 0, _sha256: sums.get(group.base) }, path: joinedPath, joined: true });
    }
    for (const { asset, path: archivePath, joined } of archivePaths) {
      log(`extracting ${asset.name} -> ${kernelsRoot}`);
      const extract = await extractArchive(archivePath, kernelsRoot);
      log(`extracted ${asset.name} (${extract.engine}${extract.entries !== undefined ? `, ${extract.entries} entries` : ''})`);
      if (joined) await fsp.rm(archivePath, { force: true });
    }
    const readiness = platformReadiness(kernelsRoot, platform);
    if (!readiness.ready) {
      const detail = [
        readiness.missing.length > 0 ? `missing: ${readiness.missing.join(', ')}` : '',
        readiness.pointerSeeds.length > 0 ? `still LFS pointers: ${readiness.pointerSeeds.join(', ')}` : '',
      ].filter(Boolean).join('; ');
      throw new Error(`extraction completed but the ${platform} seed is still not usable (${detail || 'unexpected layout'})`);
    }
    state.platforms[platform] = {
      at: new Date().toISOString(),
      assets: Object.fromEntries(assets.map((asset) => [asset.name, asset._sha256])),
    };
    fetched.push(platform);
    log(`seed ${platform} ready (${readiness.totalFiles} files, ${readiness.pointerFiles} pointer strays)`);
  }

  if (metaPlan.length > 0) {
    // _sha256 is guaranteed by the plan construction above; downloadAsset
    // still re-refuses on a missing checksum as the single-sourced check. The
    // old `if (asset._sha256)` guard silently skipped unverified meta assets.
    for (const asset of metaPlan) {
      await downloadAsset(asset, { cacheDir, token, force });
      await extractArchive(path.join(cacheDir, asset.name), kernelsRoot);
      log(`meta assets extracted from ${asset.name}`);
    }
  }

  await writeState(cacheDir, state);
  log(`done: ${fetched.length} platform(s) fetched, ${skipped.length} already ready`);
  return { fetched, skipped };
}

/** Small text asset (checksum manifests) via the same auth rules. */
async function downloadSmallText(asset, { token }) {
  const url = assetDownloadUrl(asset, token);
  const headers = { Accept: 'application/octet-stream', 'User-Agent': 'OpenBrowser-kernel-fetch/1.0' };
  if (token) headers.Authorization = `Bearer ${token}`;
  validateDownloadUrl(url);
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${asset.name}`);
  const text = await res.text();
  if (text.length > 1024 * 1024) throw new Error(`${asset.name} unexpectedly large (>1 MiB); refusing to parse`);
  return text;
}

/* ------------------------------------------------------------------ *
 * Packaging hook (used by prepare-bundled-kernel.js / package-portable.js)
 * ------------------------------------------------------------------ */

/**
 * Ensure the integrated kernel seed for a packaging platform is usable.
 *
 * Resolution order:
 *   1. already material locally (classic `git lfs pull` checkout) -> no-op;
 *   2. auto-fetch from the kernel release (default; disable with
 *      OPENBROWSER_KERNEL_AUTO_FETCH=0);
 *   3. hard error listing both recovery commands (release fetch + git lfs).
 *
 * linux-x64 is NOT release-managed (Google Chrome Stable is downloaded by
 * scripts/install-linux-stable.js) and reports ready without any check.
 */
async function ensureKernelSeedForPackaging(platform, options = {}) {
  if (!KERNEL_PLATFORMS.includes(platform)) {
    if (platform === 'linux-x64') return { ready: true, source: 'chrome-stable-installer' };
    return { ready: true, source: 'not-managed' };
  }
  const kernelsRoot = options.kernelsRoot || DEFAULT_KERNELS_ROOT;
  const readiness = platformReadiness(kernelsRoot, platform);
  if (readiness.ready) return { ready: true, source: 'local' };

  const autoFetch = process.env.OPENBROWSER_KERNEL_AUTO_FETCH !== '0';
  if (!autoFetch) {
    const error = new Error(`kernel seed for ${platform} is not usable and auto-fetch is disabled (OPENBROWSER_KERNEL_AUTO_FETCH=0)\n${lfsFallbackHint(platform)}`);
    error.readiness = readiness;
    throw error;
  }
  log(`seed ${platform} not material (${readiness.missing.length ? 'missing ' + readiness.missing.join(', ') : 'LFS pointers'}); trying the kernel release`);
  try {
    await fetchKernels({
      platforms: [platform],
      tag: options.tag || defaultTag(),
      repo: options.repo || defaultRepo(),
      kernelsRoot,
      cacheDir: options.cacheDir || DEFAULT_CACHE_DIR,
      token: options.token !== undefined ? options.token : githubToken(),
      force: false,
    });
  } catch (err) {
    const error = new Error(
      `auto-fetch of the ${platform} kernel seed failed: ${err.message}\n${lfsFallbackHint(platform)}`
    );
    error.cause = err;
    throw error;
  }
  const rechecked = platformReadiness(kernelsRoot, platform);
  if (!rechecked.ready) {
    throw new Error(`kernel seed for ${platform} is still not usable after fetch\n${lfsFallbackHint(platform)}`);
  }
  return { ready: true, source: 'release' };
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

const HELP = [
  'Usage: node scripts/fetch-kernels.js [options]',
  '',
  'Options:',
  '  --platform <p>   windows-x64 | macos-x64 | macos-arm64 | all   (default: all)',
  '  --tag <tag>      kernel release tag            (default: $OPENBROWSER_KERNEL_TAG or kernels-v1)',
  '  --repo <owner/name>  release repository        (default: package.json repository)',
  '  --cache-dir <dir>   archive cache directory    (default: Browserapp/.kernel-release-cache)',
  '  --dest <dir>     kernels root for extraction   (default: Browserapp/kernels)',
  '  --dry-run        resolve the release and print the plan without downloading',
  '  --force          re-download and re-extract even if seeds are ready',
  '  --status         report local seed readiness (offline) and exit accordingly',
  '  --selftest       offline unit checks of the fetch helpers',
  '  --help           show this help',
  '',
  'Env: GITHUB_TOKEN / GH_TOKEN (draft releases, private repos, rate limits),',
  '     OPENBROWSER_KERNEL_TAG, OPENBROWSER_KERNEL_RELEASE_REPO,',
  '     OPENBROWSER_KERNEL_EXTRACTOR=auto|js|system, OPENBROWSER_KERNEL_AUTO_FETCH=0',
].join('\n');

function parseArgs(argv) {
  const options = { platforms: [], tag: defaultTag(), repo: defaultRepo(), cacheDir: DEFAULT_CACHE_DIR, kernelsRoot: DEFAULT_KERNELS_ROOT, dryRun: false, force: false, status: false, selftest: false, help: false };
  const errors = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length || argv[i].startsWith('--')) {
        errors.push(`${arg} requires a value`);
        return '';
      }
      return argv[i];
    };
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--status') options.status = true;
    else if (arg === '--selftest') options.selftest = true;
    else if (arg === '--platform') {
      const value = next();
      if (value === 'all') options.platforms = ['all'];
      else if (KERNEL_PLATFORMS.includes(value)) options.platforms.push(value);
      else if (value) errors.push(`unknown platform '${value}' (expected ${KERNEL_PLATFORMS.join(' | ')} | all)`);
    } else if (arg === '--tag') options.tag = next();
    else if (arg === '--repo') options.repo = next();
    else if (arg === '--cache-dir') options.cacheDir = path.resolve(next());
    else if (arg === '--dest') options.kernelsRoot = path.resolve(next());
    else errors.push(`unknown option '${arg}'`);
  }
  if (options.platforms.length === 0) options.platforms = ['all'];
  const expanded = options.platforms.includes('all') ? [...KERNEL_PLATFORMS] : [...new Set(options.platforms)];
  options.platforms = expanded;
  return { options, errors };
}

async function statusMode(options) {
  const cacheState = await readState(options.cacheDir);
  let allReady = true;
  const rows = [];
  for (const platform of options.platforms) {
    const readiness = platformReadiness(options.kernelsRoot, platform);
    const stamp = cacheState.platforms && cacheState.platforms[platform];
    const problems = [];
    if (readiness.missing.length > 0) problems.push(`missing ${readiness.missing.join(', ')}`);
    if (readiness.pointerSeeds.length > 0) problems.push(`LFS pointers ${readiness.pointerSeeds.join(', ')}`);
    if (readiness.pointerFiles > 0 && readiness.ready) problems.push(`${readiness.pointerFiles} pointer strays (binaries OK)`);
    rows.push({
      platform,
      ready: readiness.ready,
      files: readiness.totalFiles,
      stamp: stamp ? `${cacheState.tag} @ ${stamp.at}` : 'never fetched',
      problems: problems.length > 0 ? problems.join('; ') : '-',
    });
    if (!readiness.ready) allReady = false;
  }
  const width = Math.max(...rows.map((row) => row.platform.length));
  console.log('platform'.padEnd(width + 2) + 'ready    files   last fetch'.padEnd(34) + 'notes');
  for (const row of rows) {
    console.log(
      row.platform.padEnd(width + 2)
      + String(row.ready ? 'yes' : 'NO').padEnd(8)
      + String(row.files).padEnd(8)
      + row.stamp.slice(0, 32).padEnd(34)
      + row.problems
    );
  }
  console.log(`kernels root: ${options.kernelsRoot}`);
  if (!allReady) {
    console.log('\nNot all requested seeds are ready. Fix with either:');
    console.log(`  node scripts/fetch-kernels.js --platform ${rows.find((row) => !row.ready).platform} --tag ${options.tag}`);
    console.log('  git lfs pull --include "Browserapp/kernels/**"   # classic path, needs git-lfs');
  }
  return allReady ? 0 : 1;
}

/* ------------------------------------------------------------------ *
 * Offline selftest (run in CI: scripts stay covered without network)
 * ------------------------------------------------------------------ */

async function selftestMode() {
  const failures = [];
  const ok = (cond, message) => {
    if (cond) console.log('ok  ' + message);
    else { failures.push(message); console.log('FAIL ' + message); }
  };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-kfetch-selftest-'));
  try {
    // parseSums
    const sums = parseSums(
      '# comment\n'
      + 'a'.repeat(64) + '  kernels-windows-x64.tar.gz\n'
      + 'b'.repeat(64) + ' *kernels-macos-x64.zip\n'
      + 'c'.repeat(64) + '  kernels with spaces.tar.gz\n'
    );
    ok(sums.size === 3 && sums.get('kernels-windows-x64.tar.gz') === 'a'.repeat(64), 'parseSums: standard, binary marker and spaced names');
    ok(sums.has('kernels with spaces.tar.gz'), 'parseSums: filename with spaces kept intact');
    let threw = false;
    try { parseSums('zz  nope'); } catch (_) { threw = true; }
    ok(threw, 'parseSums: malformed line rejected');
    threw = false;
    try { parseSums('d'.repeat(64) + '  x\n' + 'd'.repeat(64) + '  x'); } catch (_) { threw = true; }
    ok(threw, 'parseSums: duplicate entries rejected');

    // platform asset matching
    ok(assetMatchesPlatform('kernels-windows-x64.tar.gz', 'windows-x64'), 'asset match: plain archive');
    ok(assetMatchesPlatform('kernels-macos-arm64-app.tar.gz', 'macos-arm64'), 'asset match: split suffix');
    ok(assetMatchesPlatform('kernels-macos-arm64-fonts.tar.gz', 'macos-arm64'), 'asset match: fonts split');
    ok(assetMatchesPlatform('kernels-windows-x64.tar.gz.partaa', 'windows-x64'), 'asset match: part shard');
    ok(!assetMatchesPlatform('kernels-macos-x64.zip', 'windows-x64'), 'asset match: foreign platform rejected');
    ok(assetMatchesPlatform('kernels-macos-x64-foo.zip', 'macos-x64'), 'asset match: dash suffix accepted');
    ok(!assetMatchesPlatform('kernels-macos-arm64-fonts.tar.gz', 'macos-x64'), 'asset match: arm64 does not leak into x64');

    // part grouping
    const grouped = groupPartAssets([
      { name: 'kernels-macos-arm64.tar.gz.partaa', sha: 1 },
      { name: 'kernels-macos-arm64.tar.gz.partac', sha: 3 },
      { name: 'kernels-macos-arm64.tar.gz.partab', sha: 2 },
      { name: 'kernels-macos-x64.tar.gz', sha: 4 },
    ]);
    ok(grouped.singles.length === 1 && grouped.singles[0].name === 'kernels-macos-x64.tar.gz', 'parts: single archive passes through');
    ok(grouped.sharded.length === 1 && grouped.sharded[0].base === 'kernels-macos-arm64.tar.gz', 'parts: shards grouped by base');
    ok(grouped.sharded[0].parts.map((part) => part.name.slice(-1)).join('') === 'abc', 'parts: alphabetical shard order');

    // LFS pointer detection
    const pointerFile = path.join(tmp, 'pointer.bin');
    fs.writeFileSync(pointerFile, 'version https://git-lfs.github.com/spec/v1\noid sha256:' + 'e'.repeat(64) + '\nsize 123\n');
    const realFile = path.join(tmp, 'real.bin');
    fs.writeFileSync(realFile, Buffer.from([0x4d, 0x5a, 0x90, 0x00]));
    ok(isLfsPointerFile(pointerFile) && !isLfsPointerFile(realFile) && !isLfsPointerFile(path.join(tmp, 'absent.bin')), 'LFS pointer detection');

    // member name safety
    ok(isSafeMemberName('windows-x64/chrome.exe') && isSafeMemberName('Wayfern.app/Contents/MacOS/Wayfern'), 'member safety: normal paths accepted');
    ok(!isSafeMemberName('../escape') && !isSafeMemberName('/abs') && !isSafeMemberName('C:\\win') && !isSafeMemberName('a/../../b'), 'member safety: traversal and absolute paths rejected');

    // pax parsing ("12 path=foo\n" — the length prefix counts the whole record)
    const pax = parsePaxRecords(Buffer.from('12 path=foo\n', 'utf8'));
    ok(pax.path === 'foo', 'pax: path record parsed');
    const pax2 = parsePaxRecords(Buffer.from('20 ctime=1234567890\n', 'utf8'));
    ok(pax2.ctime === '1234567890', 'pax: multiple record fields supported');

    // readiness on synthetic trees
    const syntheticRoot = path.join(tmp, 'kernels');
    let readiness = platformReadiness(syntheticRoot, 'windows-x64');
    ok(!readiness.ready && readiness.missing.length === 3, 'readiness: empty root reports missing seeds');
    const seedDir = path.join(syntheticRoot, 'windows-x64');
    fs.mkdirSync(seedDir, { recursive: true });
    for (const rel of PLATFORM_SEED_FILES['windows-x64']) {
      fs.writeFileSync(path.join(seedDir, rel), Buffer.from('MZ-fake-kernel'));
    }
    readiness = platformReadiness(syntheticRoot, 'windows-x64');
    ok(readiness.ready && readiness.pointerFiles === 0, 'readiness: material seed passes');
    fs.writeFileSync(path.join(seedDir, 'chrome.dll'), 'version https://git-lfs/github\n');
    readiness = platformReadiness(syntheticRoot, 'windows-x64');
    ok(!readiness.ready && readiness.pointerSeeds.includes('chrome.dll'), 'readiness: pointer contamination detected');

    // pure-JS tar round-trip against the system tar (when available)
    if (hasSystemBinary('tar')) {
      const fixture = path.join(tmp, 'fixture');
      fs.mkdirSync(path.join(fixture, 'macos-arm64', 'deep', 'nested'), { recursive: true });
      fs.writeFileSync(path.join(fixture, 'macos-arm64', 'kernel.json'), '{"version":"148.0.7778.165"}');
      fs.writeFileSync(path.join(fixture, 'macos-arm64', 'deep', 'nested', 'Wayfern'), 'binary-payload');
      fs.chmodSync(path.join(fixture, 'macos-arm64', 'deep', 'nested', 'Wayfern'), 0o755);
      fs.symlinkSync('Versions/Current/Helpers', path.join(fixture, 'macos-arm64', 'helpers-link'));
      const longName = 'a'.repeat(140) + '.bin';
      fs.writeFileSync(path.join(fixture, 'macos-arm64', longName), 'long-name-payload');
      const archive = path.join(tmp, 'fixture.tar.gz');
      const pack = spawnSync('tar', ['-czf', archive, '-C', fixture, 'macos-arm64']);
      if (pack.status !== 0) {
        ok(false, 'js-tar: system tar fixture creation failed');
      } else {
        const outRoot = path.join(tmp, 'out-tar');
        await extractTarJs(archive, outRoot);
        const readTarget = (file) => fs.lstatSync(file).isSymbolicLink() ? fs.readlinkSync(file) : fs.readFileSync(file, 'utf8');
        ok(readTarget(path.join(outRoot, 'macos-arm64', 'kernel.json')) === '{"version":"148.0.7778.165"}', 'js-tar: file content round-trip');
        ok(fs.lstatSync(path.join(outRoot, 'macos-arm64', 'deep', 'nested', 'Wayfern')).mode & 0o111, 'js-tar: exec bit restored');
        ok(readTarget(path.join(outRoot, 'macos-arm64', 'helpers-link')) === 'Versions/Current/Helpers', 'js-tar: symlink round-trip');
        ok(fs.readFileSync(path.join(outRoot, 'macos-arm64', longName), 'utf8') === 'long-name-payload', 'js-tar: GNU long name member extracted');
      }
    } else {
      console.log('skip js-tar round-trip (system tar unavailable)');
    }

    // pure-JS zip round-trip against the system zip (when available)
    if (hasSystemBinary('zip')) {
      const zdir = path.join(tmp, 'zfixture');
      fs.mkdirSync(path.join(zdir, 'windows-x64'), { recursive: true });
      fs.writeFileSync(path.join(zdir, 'windows-x64', 'chrome.exe'), 'MZ-zip-payload');
      fs.writeFileSync(path.join(zdir, 'windows-x64', 'First Run'), 'first-run-marker');
      const zarchive = path.join(tmp, 'fixture.zip');
      const zpack = spawnSync('zip', ['-q', '-r', zarchive, 'windows-x64'], { cwd: zdir });
      if (zpack.status !== 0) {
        ok(false, 'js-zip: system zip fixture creation failed');
      } else {
        const zout = path.join(tmp, 'out-zip');
        await extractZipJs(zarchive, zout);
        ok(fs.readFileSync(path.join(zout, 'windows-x64', 'chrome.exe'), 'utf8') === 'MZ-zip-payload', 'js-zip: deflate member round-trip');
        ok(fs.readFileSync(path.join(zout, 'windows-x64', 'First Run'), 'utf8') === 'first-run-marker', 'js-zip: spaced filename round-trip');
      }
    } else {
      console.log('skip js-zip round-trip (system zip unavailable)');
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    console.error(`selftest FAILED: ${failures.length} check(s)`);
    return 1;
  }
  console.log('selftest passed');
  return 0;
}

async function main() {
  const { options, errors } = parseArgs(process.argv.slice(2));
  if (errors.length > 0) {
    for (const error of errors) console.error(`[kernels] argument error: ${error}`);
    console.error(HELP);
    process.exitCode = 2;
    return;
  }
  if (options.help) {
    console.log(HELP);
    return;
  }
  if (options.selftest) {
    process.exitCode = await selftestMode();
    return;
  }
  if (options.status) {
    process.exitCode = await statusMode(options);
    return;
  }
  try {
    await fetchKernels(options);
  } catch (err) {
    if (err instanceof ReleaseNotFoundError) {
      console.error(`[kernels] ${err.message}`);
      console.error(`[kernels] fallback (classic path, needs git-lfs):`);
      console.error(`[kernels]   git lfs pull --include "Browserapp/kernels/${options.platforms[0]}/**"`);
      console.error('[kernels] or publish the kernel release first (.github/workflows/kernel-release.yml)');
    } else {
      console.error(`[kernels] ${err.message}`);
    }
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[kernels] fatal:', err && err.stack ? err.stack : err);
    process.exit(1);
  });
}

module.exports = {
  KERNEL_PLATFORMS,
  PLATFORM_SEED_FILES,
  DEFAULT_CACHE_DIR,
  DEFAULT_TAG,
  assetMatchesPlatform,
  downloadAsset,
  ensureKernelSeedForPackaging,
  extractArchive,
  extractTarJs,
  extractZipJs,
  fetchKernels,
  groupPartAssets,
  isLfsPointerFile,
  isSafeMemberName,
  metaAssets,
  parseSums,
  platformReadiness,
  resolveRelease,
};
