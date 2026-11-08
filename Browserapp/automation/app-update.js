'use strict';

/**
 * App updater subsystem, extracted from main.js.
 *
 * Everything update-related lives here: release-tag resolution (Atom feed →
 * HTML redirect → REST API), asset resolution, the download path with its
 * fail-closed integrity gates (SHA256SUMS manifest + detached Ed25519
 * signature from automation/update-trust.js), and the status cache/watcher
 * that drives the UI traffic light.
 *
 * The module is requirable outside Electron (selftests require it directly):
 * nothing at module scope touches Electron. Functions that need `app` or
 * `shell` resolve them lazily through requireElectron(), and the window
 * broadcaster is injected once by main.js via configureAppUpdateBroadcast().
 */

const { createHash, timingSafeEqual, randomUUID } = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { compareVersions } = require('./version-compare');

const UPDATE_REPOSITORY = 'zhu748/OpenBrowser';
const UPDATE_API_URL = `https://api.github.com/repos/${UPDATE_REPOSITORY}/releases/latest`;
const UPDATE_LATEST_HTML = `https://github.com/${UPDATE_REPOSITORY}/releases/latest`;
const UPDATE_RELEASES_ATOM = `https://github.com/${UPDATE_REPOSITORY}/releases.atom`;
const UPDATE_ASSETS = Object.freeze({
  'darwin:x64': 'OpenBrowser-macOS-x86_64.dmg',
  'darwin:arm64': 'OpenBrowser-macOS-arm64-with-kernel.dmg',
  'win32:x64': 'OpenBrowser-Windows-x86_64-with-kernel.exe',
  'linux:x64': 'OpenBrowser-Linux-x86_64-with-kernel.tar.gz',
});
const UPDATE_MAX_BYTES = 1024 * 1024 * 1024;
const UPDATE_TIMEOUT_MS = 20000;
const UPDATE_ALLOWED_HOSTS = new Set(['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']);
const UPDATE_CHECKSUM_ASSET = 'SHA256SUMS.txt';

// Window broadcaster, injected by main.js (its emit() iterates live windows).
let broadcastEvent = null;

function configureAppUpdateBroadcast(emit) {
  broadcastEvent = emit;
}

function emit(value) {
  if (typeof broadcastEvent === 'function') broadcastEvent(value);
}

/** Electron resolves lazily so selftests can require this module in plain Node. */
function requireElectron() {
  const electron = require('electron');
  if (!electron || !electron.app) {
    throw new Error('app-update requires the Electron main process');
  }
  return electron;
}

/** Parse a `sha256sum`-style manifest into a Map(assetName -> sha256 hex). */
function parseChecksumManifest(text) {
  const map = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    const match = line.match(/^([0-9a-fA-F]{64})\s+\*?(.+?)\s*$/);
    if (match) map.set(match[2], match[1].toLowerCase());
  }
  return map;
}

/**
 * Fetch the release's SHA256SUMS.txt manifest (direct asset URL first).
 * Returns { map, manifestBuffer, signature } — or null when this release
 * publishes no manifest (older releases). Callers must treat a null map as
 * "cannot verify", never as "valid". `signature` is null when the release
 * carries no detached Ed25519 .sig asset yet.
 */
async function resolveReleaseChecksums(remoteVersion) {
  if (!remoteVersion) return null;
  const manifestUrl = `https://github.com/${UPDATE_REPOSITORY}/releases/download/v${remoteVersion}/${UPDATE_CHECKSUM_ASSET}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPDATE_TIMEOUT_MS);
    try {
      const response = await fetch(manifestUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': updateUserAgent(), Accept: 'text/plain,*/*' },
        signal: controller.signal,
      });
      if (response.ok) {
        const manifestBuffer = Buffer.from(await response.arrayBuffer());
        if (manifestBuffer.length && manifestBuffer.length <= 65536) {
          const map = parseChecksumManifest(manifestBuffer.toString('utf8'));
          if (map.size) {
            const signature = await fetchReleaseSignature(remoteVersion, controller.signal);
            return { map, manifestBuffer, signature };
          }
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (_) { /* manifest unavailable on this release */ }
  return null;
}

/** Fetch the detached Ed25519 signature asset for the checksum manifest, if published. */
async function fetchReleaseSignature(remoteVersion, parentSignal) {
  const { verifyManifestSignature } = require('./update-trust');
  const sigUrl = `https://github.com/${UPDATE_REPOSITORY}/releases/download/v${remoteVersion}/${UPDATE_CHECKSUM_ASSET}.sig`;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  parentSignal?.addEventListener?.('abort', onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), UPDATE_TIMEOUT_MS);
  try {
    const response = await fetch(sigUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': updateUserAgent(), Accept: 'application/octet-stream' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const signature = Buffer.from(await response.arrayBuffer());
    if (!signature.length || signature.length > 4096) return null;
    return signature;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener?.('abort', onAbort);
  }
}

/** SHA-256 a file with constant-memory streaming and timing-safe hex compare. */
async function verifyFileSha256(filePath, expectedHex) {
  const expected = String(expectedHex || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(expected)) return false;
  const actual = await new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
  const a = Buffer.from(actual, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function updatePlatformKey() {
  return `${process.platform}:${process.arch}`;
}

function updateAssetName() {
  return UPDATE_ASSETS[updatePlatformKey()] || null;
}

function updateUrlIsAllowed(value, assetName) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:') return false;
    const pathName = decodeURIComponent(url.pathname);
    const endsWithAsset = pathName.endsWith('/' + assetName) || pathName.endsWith(assetName);
    if (!endsWithAsset) return false;
    return UPDATE_ALLOWED_HOSTS.has(url.hostname)
      || (url.hostname === 'github.com' && pathName.includes('/releases/download/'));
  } catch (_) {
    return false;
  }
}

function updateUserAgent() {
  return `OpenBrowser/${requireElectron().app.getVersion()} (+https://github.com/${UPDATE_REPOSITORY})`;
}

function normalizeRemoteTag(value) {
  return String(value || '').trim().replace(/^v/i, '');
}

function metaFromTag(tag, source, releaseUrl) {
  const remoteVersion = normalizeRemoteTag(tag);
  if (!remoteVersion) return null;
  return {
    remoteVersion,
    releaseName: remoteVersion,
    releaseUrl: releaseUrl || `https://github.com/${UPDATE_REPOSITORY}/releases/tag/v${remoteVersion}`,
    source,
  };
}

/**
 * Resolve latest release tag without relying solely on GitHub API
 * (unauthenticated REST hits rate limits → false "unknown/yellow" light).
 * Priority: Atom feed → HTML follow/redirect → REST API.
 */
async function resolveLatestReleaseMeta() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPDATE_TIMEOUT_MS);
  const htmlHeaders = { 'User-Agent': updateUserAgent(), Accept: 'text/html,application/xhtml+xml,*/*' };
  try {
    // 1) Atom feed — no API quota, works in Electron without redirect:manual quirks
    try {
      const response = await fetch(UPDATE_RELEASES_ATOM, {
        headers: { 'User-Agent': updateUserAgent(), Accept: 'application/atom+xml,application/xml,text/xml,*/*' },
        signal: controller.signal,
      });
      if (response.ok) {
        const atom = await response.text();
        // Prefer entry-level ids/links (first entry is newest)
        const entry = atom.match(/<entry\b[\s\S]*?<\/entry>/i)?.[0] || atom;
        const fromAtom = entry.match(/\/releases\/tag\/([^<"'\s]+)/i)
          || entry.match(/<id>tag:github\.com,\d+:Repository\/\d+\/([^<]+)<\/id>/i)
          || atom.match(/\/releases\/tag\/([^<"'\s]+)/i);
        const meta = fromAtom ? metaFromTag(decodeURIComponent(fromAtom[1]), 'atom') : null;
        if (meta) return meta;
      }
    } catch (_) { /* try next */ }

    // 2) /releases/latest — follow redirects; final URL or body contains /releases/tag/vX.Y.Z
    //    (prefer follow over manual: Electron Chromium often hides Location on opaqueredirect)
    try {
      const response = await fetch(UPDATE_LATEST_HTML, {
        method: 'GET',
        redirect: 'follow',
        headers: htmlHeaders,
        signal: controller.signal,
      });
      const finalUrl = String(response.url || '');
      const fromUrl = finalUrl.match(/\/releases\/tag\/([^/?#]+)/i);
      if (fromUrl) {
        const meta = metaFromTag(decodeURIComponent(fromUrl[1]), 'html-url', finalUrl);
        if (meta) return meta;
      }
      if (response.ok) {
        const html = await response.text();
        const fromHtml = html.match(/\/releases\/tag\/(v?[\w.-]+)/i);
        const meta = fromHtml ? metaFromTag(fromHtml[1], 'html') : null;
        if (meta) return meta;
      }
    } catch (_) { /* try next */ }

    // 2b) manual redirect Location (Node undici / some hosts)
    try {
      const response = await fetch(UPDATE_LATEST_HTML, {
        method: 'GET',
        redirect: 'manual',
        headers: htmlHeaders,
        signal: controller.signal,
      });
      const location = response.headers.get('location') || response.headers.get('Location') || '';
      const fromLoc = location.match(/\/releases\/tag\/([^/?#]+)/i);
      if (fromLoc) {
        const abs = location.startsWith('http') ? location : `https://github.com${location}`;
        const meta = metaFromTag(decodeURIComponent(fromLoc[1]), 'redirect', abs);
        if (meta) return meta;
      }
    } catch (_) { /* try next */ }

    // 3) REST API (last resort; unauthenticated often 403 rate-limit)
    const response = await fetch(UPDATE_API_URL, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': updateUserAgent(),
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`GitHub Releases request failed (${response.status})`);
    const release = await response.json();
    const tag = normalizeRemoteTag(release.tag_name || release.name || '');
    if (!tag) throw new Error('GitHub Release has no version tag');
    return {
      remoteVersion: tag,
      releaseName: String(release.name || release.tag_name || tag),
      releaseUrl: String(release.html_url || `https://github.com/${UPDATE_REPOSITORY}/releases/tag/v${tag}`),
      source: 'api',
      apiRelease: release,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function resolveReleaseAsset(remoteVersion, assetName) {
  if (!assetName || !remoteVersion) return null;
  const directUrl = `https://github.com/${UPDATE_REPOSITORY}/releases/download/v${remoteVersion}/${assetName}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPDATE_TIMEOUT_MS);
    try {
      const response = await fetch(directUrl, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': updateUserAgent() },
        signal: controller.signal,
      });
      if (response.ok) {
        return {
          name: assetName,
          size: Number(response.headers.get('content-length')) || 0,
          browser_download_url: directUrl,
        };
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (_) { /* optional */ }

  // HEAD can be blocked or redirected differently by GitHub's edge. Resolve
  // the exact tagged release through the API before declaring the asset absent.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPDATE_TIMEOUT_MS);
    try {
      const apiUrl = `${UPDATE_API_URL.replace(/\/latest$/, '')}/tags/v${encodeURIComponent(remoteVersion)}`;
      const response = await fetch(apiUrl, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': updateUserAgent() },
        signal: controller.signal,
      });
      if (response.ok) {
        const release = await response.json();
        const asset = Array.isArray(release.assets)
          ? release.assets.find((item) => item?.name === assetName)
          : null;
        if (asset?.browser_download_url && updateUrlIsAllowed(asset.browser_download_url, assetName)) {
          return {
            name: asset.name,
            size: Number(asset.size) || 0,
            browser_download_url: asset.browser_download_url,
          };
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (_) { /* unavailable release metadata */ }
  return null;
}

/**
 * Version traffic light only needs remote tag vs app.getVersion().
 * Download package availability is optional (canDownload).
 * green = up to date; red = remote is newer.
 */
async function checkAppUpdate() {
  const assetName = updateAssetName();
  const currentVersion = requireElectron().app.getVersion();
  const meta = await resolveLatestReleaseMeta();
  const remoteVersion = meta.remoteVersion;
  if (!remoteVersion) throw new Error('GitHub Release has no version tag');
  const upToDate = compareVersions(remoteVersion, currentVersion) <= 0;
  let asset = null;
  if (assetName) {
    asset = await resolveReleaseAsset(remoteVersion, assetName);
    // Prefer API asset URL if present
    if (meta.apiRelease && Array.isArray(meta.apiRelease.assets)) {
      const fromApi = meta.apiRelease.assets.find((item) => item?.name === assetName);
      if (fromApi?.browser_download_url && updateUrlIsAllowed(fromApi.browser_download_url, assetName)) {
        asset = { name: fromApi.name, size: Number(fromApi.size) || 0, browser_download_url: fromApi.browser_download_url };
      }
    }
  }
  return {
    // supported = can show green/red for this build (always when we resolved a remote tag)
    supported: true,
    canDownload: Boolean(assetName && asset?.browser_download_url),
    repository: UPDATE_REPOSITORY,
    currentVersion,
    remoteVersion,
    upToDate,
    releaseName: meta.releaseName || remoteVersion,
    releaseUrl: meta.releaseUrl || `https://github.com/${UPDATE_REPOSITORY}/releases`,
    platform: process.platform,
    arch: process.arch,
    source: meta.source || 'unknown',
    asset: asset ? { name: asset.name, size: asset.size || 0, browser_download_url: asset.browser_download_url } : null,
  };
}

// The Ed25519 trust root in automation/update-trust.js is deployed (first key
// generated 2026-11-07). The guard stays on purpose: if the key list is ever
// emptied — a botched rotation, a bad cherry-pick — verification silently
// degrades to digest-only trust against the same release account, and this
// warning is what makes that regression visible in the field log.
let updateTrustRootWarned = false;
function warnIfUpdateTrustRootUndeployed() {
  if (updateTrustRootWarned) return;
  updateTrustRootWarned = true;
  try {
    const { trustedPublicKeys } = require('./update-trust');
    if (!trustedPublicKeys().length) {
      console.warn('[OpenBrowser] updater trust root is not deployed (no real key in automation/update-trust.js):'
        + ' manifest signatures cannot be verified, releases are trusted only via SHA256SUMS from the same GitHub account.'
        + ' Restore a deployed public key or rotate with update-trust-tool.js.');
    }
  } catch (_) {}
}

async function downloadAppUpdate() {
  warnIfUpdateTrustRootUndeployed();
  const electron = requireElectron();
  const result = await checkAppUpdate();
  if (!result.canDownload || !result.asset?.name) throw new Error('This platform has no published OpenBrowser installer package');
  if (result.upToDate) return { success: false, upToDate: true, version: result.currentVersion, assetName: result.asset.name };
  const downloadUrl = result.asset.browser_download_url
    || `https://github.com/${UPDATE_REPOSITORY}/releases/download/v${result.remoteVersion}/${result.asset.name}`;
  if (!updateUrlIsAllowed(downloadUrl, result.asset.name)) throw new Error('The selected update package URL is not trusted');
  const controller = new AbortController();
  // Idle watchdog instead of the old fixed 120s cap: a 1 GB installer over
  // a slow link legitimately needs longer than 120s; only a stalled transfer
  // (no chunks arriving) should abort. Every chunk re-arms it, and any
  // existing clearTimeout(timer) cleanup still sees the live handle.
  let timer = null;
  const IDLE_TIMEOUT_MS = 60000;
  const armWatchdog = () => { clearTimeout(timer); timer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS); };
  armWatchdog();
  const extension = path.extname(result.asset.name).toLowerCase();
  const baseName = path.basename(result.asset.name, extension);
  const temporaryPath = path.join(electron.app.getPath('downloads'), `${baseName}-${randomUUID()}${extension}`);
  let received = 0;
  try {
    const response = await fetch(downloadUrl, {
      headers: { Accept: 'application/octet-stream', 'User-Agent': `OpenBrowser/${electron.app.getVersion()}` },
      signal: controller.signal,
    });
    if (!response.ok || !response.body) throw new Error(`Update download failed (${response.status})`);
    const contentLength = Number(response.headers.get('content-length')) || 0;
    if (contentLength > UPDATE_MAX_BYTES) throw new Error('Update package is too large');
    await fsp.mkdir(path.dirname(temporaryPath), { recursive: true });
    const file = await fsp.open(temporaryPath, 'w');
    try {
      const reader = response.body.getReader();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        armWatchdog();
        received += chunk.value.byteLength;
        if (received > UPDATE_MAX_BYTES) throw new Error('Update package is too large');
        await file.write(Buffer.from(chunk.value));
        emit({ type: 'app-update-progress', received, total: contentLength || result.asset.size || 0, percent: contentLength ? Math.min(100, Math.round(received / contentLength * 100)) : null, version: result.remoteVersion });
      }
    } finally {
      clearTimeout(timer);
      await file.close();
    }
    // A server that hangs up early ends the body stream cleanly; without this
    // gate a truncated installer could reach the SHA-256 step (or, for a
    // release without a manifest, the desktop) as a "complete" download.
    if (contentLength && received < contentLength) {
      throw new Error(`Update download was truncated: received ${received} of ${contentLength} announced bytes`);
    }
    emit({ type: 'app-update-progress', received, total: contentLength || result.asset.size || received, percent: 100, version: result.remoteVersion });
    // Integrity gate: when the release publishes SHA256SUMS.txt the downloaded
    // installer MUST match before it is handed to the OS (fail closed on
    // mismatch). Releases without a manifest fail closed by default too — the
    // manifest lives in the same account as the installer, but requiring it at
    // least blocks the "replaced both files" and "quietly dropped the manifest"
    // downgrade paths. OPENBROWSER_ALLOW_UNSIGNED_UPDATE=1 restores the old
    // warn-and-proceed behavior for historical releases, explicitly opt-in.
    const checksums = await resolveReleaseChecksums(result.remoteVersion);
    const expectedHex = (checksums?.map && (checksums.map.get(result.asset.name)
      || checksums.map.get(path.basename(result.asset.name)))) || null;
    // Detached Ed25519 signature over the manifest bytes. A published .sig is
    // binding: an invalid or untrusted signature is fatal, and NO env var
    // downgrades it — the point of the trust root is that replacing the
    // release account must not become a path to code execution.
    if (checksums?.signature) {
      const { verifyManifestSignature } = require('./update-trust');
      const verdict = verifyManifestSignature(checksums.manifestBuffer, checksums.signature);
      if (!verdict.ok) {
        throw new Error(`Release v${result.remoteVersion} manifest signature is not trusted (${verdict.reason}) — refusing to run the installer`);
      }
    }
    if (expectedHex) {
      const valid = await verifyFileSha256(temporaryPath, expectedHex);
      if (!valid) throw new Error('Update package failed SHA-256 integrity verification — the download is corrupted or was tampered with');
    } else if (process.env.OPENBROWSER_ALLOW_UNSIGNED_UPDATE === '1') {
      console.warn(`[OpenBrowser] release v${result.remoteVersion} publishes no ${UPDATE_CHECKSUM_ASSET} — proceeding without integrity verification (OPENBROWSER_ALLOW_UNSIGNED_UPDATE=1)`);
    } else {
      throw new Error(`Release v${result.remoteVersion} publishes no ${UPDATE_CHECKSUM_ASSET} — refusing to run an unverifiable installer (set OPENBROWSER_ALLOW_UNSIGNED_UPDATE=1 to override)`);
    }
    const openError = await electron.shell.openPath(temporaryPath);
    if (openError) electron.shell.showItemInFolder(temporaryPath);
    return { success: true, path: temporaryPath, version: result.remoteVersion, assetName: result.asset.name, verified: Boolean(expectedHex), signed: Boolean(checksums?.signature) };
  } catch (error) {
    await fsp.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
  }
}


/** Last GitHub Releases check; pushed to UI as traffic-light status. */
let lastAppUpdateStatus = null;
let appUpdateWatchTimer = null;
const APP_UPDATE_POLL_MS = 6 * 60 * 60 * 1000;
const APP_UPDATE_STARTUP_DELAY_MS = 2500;

/** Cache file lives in userData; resolved lazily so plain-Node requires work. */
function appUpdateCacheFile() {
  return path.join(requireElectron().app.getPath('userData'), 'openbrowser-update-status.json');
}

function appUpdateLightFromResult(result) {
  // Product rule: green = latest, red = update available.
  // Never use yellow for "I am latest". Failed checks without cache → gray "unknown".
  if (!result) return 'unknown';
  if (result.remoteVersion != null && result.currentVersion != null && result.upToDate != null) {
    return result.upToDate ? 'green' : 'red';
  }
  return 'unknown';
}

async function loadCachedAppUpdateStatus() {
  try {
    const raw = JSON.parse(await fsp.readFile(appUpdateCacheFile(), 'utf8'));
    if (!raw || typeof raw !== 'object') return null;
    if (raw.remoteVersion == null || raw.upToDate == null) return null;
    // Cache only useful if it was for this same local version
    if (raw.currentVersion && String(raw.currentVersion) !== String(requireElectron().app.getVersion())) return null;
    lastAppUpdateStatus = {
      supported: true,
      canDownload: Boolean(raw.canDownload),
      repository: UPDATE_REPOSITORY,
      currentVersion: String(raw.currentVersion || requireElectron().app.getVersion()),
      remoteVersion: String(raw.remoteVersion),
      upToDate: Boolean(raw.upToDate),
      releaseName: raw.releaseName || raw.remoteVersion,
      releaseUrl: raw.releaseUrl || `https://github.com/${UPDATE_REPOSITORY}/releases`,
      platform: process.platform,
      arch: process.arch,
      source: raw.source || 'cache',
      asset: raw.asset || null,
      cachedAt: raw.checkedAt || null,
    };
    return lastAppUpdateStatus;
  } catch (_) {
    return null;
  }
}

async function saveCachedAppUpdateStatus(result) {
  if (!result || result.remoteVersion == null || result.upToDate == null) return;
  const cacheFile = appUpdateCacheFile();
  try {
    await fsp.mkdir(path.dirname(cacheFile), { recursive: true });
    const payload = {
      currentVersion: result.currentVersion,
      remoteVersion: result.remoteVersion,
      upToDate: result.upToDate,
      canDownload: result.canDownload,
      releaseName: result.releaseName,
      releaseUrl: result.releaseUrl,
      source: result.source,
      asset: result.asset || null,
      checkedAt: new Date().toISOString(),
    };
    const temporary = cacheFile + '.tmp';
    await fsp.writeFile(temporary, JSON.stringify(payload, null, 2), 'utf8');
    await fsp.rm(cacheFile, { force: true });
    await fsp.rename(temporary, cacheFile);
  } catch (_) { /* non-fatal */ }
}

/**
 * Check GitHub latest release and push status to all windows (traffic light).
 * green = up to date; red = newer release available; unknown = check failed (gray).
 */
async function pushAppUpdateStatus({ check = true } = {}) {
  try {
    const result = check ? await checkAppUpdate() : lastAppUpdateStatus;
    if (!result) {
      const cached = lastAppUpdateStatus;
      if (cached?.remoteVersion != null && cached.upToDate != null) {
        const payload = {
          type: 'app-update-status',
          light: cached.upToDate ? 'green' : 'red',
          checkedAt: new Date().toISOString(),
          ...cached,
          stale: true,
        };
        emit(payload);
        return payload;
      }
      const payload = {
        type: 'app-update-status',
        light: 'unknown',
        currentVersion: requireElectron().app.getVersion(),
        checkedAt: new Date().toISOString(),
      };
      emit(payload);
      return payload;
    }
    lastAppUpdateStatus = { ...result, error: null };
    await saveCachedAppUpdateStatus(lastAppUpdateStatus);
    const payload = {
      type: 'app-update-status',
      light: appUpdateLightFromResult(result),
      checkedAt: new Date().toISOString(),
      ...result,
    };
    emit(payload);
    return payload;
  } catch (error) {
    // Prefer last successful green/red over a confusing amber "error" light
    if (lastAppUpdateStatus?.remoteVersion != null && lastAppUpdateStatus.upToDate != null) {
      const payload = {
        type: 'app-update-status',
        light: lastAppUpdateStatus.upToDate ? 'green' : 'red',
        checkedAt: new Date().toISOString(),
        ...lastAppUpdateStatus,
        stale: true,
        warning: String(error && error.message || error),
      };
      emit(payload);
      return payload;
    }
    const payload = {
      type: 'app-update-status',
      light: 'unknown',
      currentVersion: requireElectron().app.getVersion(),
      error: String(error && error.message || error),
      checkedAt: new Date().toISOString(),
    };
    emit(payload);
    return payload;
  }
}

function startAppUpdateWatcher() {
  // Paint cached green/red immediately so UI never sticks on yellow/checking
  loadCachedAppUpdateStatus().then((cached) => {
    if (cached) {
      emit({
        type: 'app-update-status',
        light: appUpdateLightFromResult(cached),
        checkedAt: new Date().toISOString(),
        ...cached,
        stale: true,
      });
    }
  }).catch(() => {});

  const run = () => {
    pushAppUpdateStatus({ check: true }).catch((error) => {
      console.warn('OpenBrowser update check failed:', error.message || error);
    });
  };
  setTimeout(run, APP_UPDATE_STARTUP_DELAY_MS);
  if (appUpdateWatchTimer) clearInterval(appUpdateWatchTimer);
  appUpdateWatchTimer = setInterval(run, APP_UPDATE_POLL_MS);
  if (typeof appUpdateWatchTimer.unref === 'function') appUpdateWatchTimer.unref();
}

module.exports = {
  UPDATE_REPOSITORY,
  configureAppUpdateBroadcast,
  parseChecksumManifest,
  verifyFileSha256,
  updatePlatformKey,
  updateAssetName,
  updateUrlIsAllowed,
  normalizeRemoteTag,
  metaFromTag,
  appUpdateLightFromResult,
  checkAppUpdate,
  downloadAppUpdate,
  pushAppUpdateStatus,
  startAppUpdateWatcher,
};
