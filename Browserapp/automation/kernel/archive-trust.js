'use strict';

// Atomic bookkeeping and per-URL digest pins, independent of browser lifecycle.
const fsp = require('node:fs/promises');
const path = require('node:path');
const pinWrites = new Map();

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
    let directoryHandle;
    try {
      directoryHandle = await fsp.open(directory, 'r');
      await directoryHandle.sync();
    } catch (_) {
      // Directory fsync is not supported by every platform/filesystem.
    } finally {
      if (directoryHandle) await directoryHandle.close().catch(() => {});
    }
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

/**
 * Extract a kernel build version embedded in a download URL, e.g. the
 * "wayfern-156.0.8078.80-…" basename or a per-version chrome-for-testing
 * path segment. The Wayfern feed has announced a top-level `version` one
 * patch ahead of the builds its URLs actually serve (156.0.8078.81 meta vs
 * 156.0.8078.80 assets), so the URL — not the feed headline — is the
 * version of record for what would get installed.
 */
function buildVersionFromUrl(url) {
  const text = String(url || '');
  // Scan only path + query: an IPv4 host (https://192.168.1.100/…) would
  // otherwise be reported as the build version, and the first match would
  // even win over a real version later in the path.
  let scan = text;
  try {
    const parsed = new URL(text);
    scan = parsed.pathname + parsed.search;
  } catch (_) { /* not an absolute URL: scan as-is */ }
  // A trailing ".digit" means the match truncated a longer version
  // (1.2.3.4 out of 1.2.3.4.5) — require a separator or end of string.
  const match = /[/_-](\d+\.\d+\.\d+\.\d+)(?=$|[/_-]|\.(?!\d))/.exec(scan);
  return match ? match[1] : '';
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
  if (!url || typeof kernelsRoot !== 'string' || !kernelsRoot) return null;
  await pinWrites.get(path.resolve(kernelsRoot));
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
  if (!url || typeof kernelsRoot !== 'string' || !kernelsRoot || !SHA256_HEX.test(value)) return false;
  const key = path.resolve(kernelsRoot);
  const previous = pinWrites.get(key) || Promise.resolve();
  const write = previous.catch(() => {}).then(async () => {
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
    } catch (error) {
      console.warn('[kernel] archive digest could not be stored:', error.message);
      return false;
    }
  });
  pinWrites.set(key, write);
  try {
    return await write;
  } finally {
    if (pinWrites.get(key) === write) pinWrites.delete(key);
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

module.exports = { ARCHIVE_DIGESTS_FILE, MAX_ARCHIVE_DIGEST_PINS, SHA256_HEX, archiveDigestsPath, writeFileAtomic, isVersionedArchiveUrl, buildVersionFromUrl, loadArchiveDigests, pinnedArchiveSha256, pinArchiveSha256, extractFeedDigest };
