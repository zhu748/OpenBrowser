'use strict';

/**
 * Directory integrity manifest.
 *
 * Records per-file { size, mtimeMs, sha256 } and seals the manifest itself
 * with an HMAC so it cannot be rewritten to match tampered contents.
 *
 * Originally this recorded only size+mtime — cheap, but the manifest sits in
 * the SAME directory it describes: an attacker who can replace a kernel
 * binary can also rewrite the manifest next to it, so plain stat comparison
 * only catches accidental damage, not deliberate tampering. Two additions
 * close that gap without inventing external trust anchors:
 *
 *   1. sha256 per file (opt-in via `hash: true` at build time) — content
 *      must actually match, not merely have the same length;
 *   2. HMAC-SHA256 over the manifest body with a key derived from machine
 *      identity — a local tamperer can compute hashes of their replacement
 *      files, but cannot produce a valid seal without the derived key.
 *
 * Legacy manifests (no hashes, no seal) verify as before under the stat-only
 * rules; `ensureManifest` upgrades them to the sealed+hashed form once their
 * stat check passes, so an installed tree converges to the strong form after
 * one clean verification.
 *
 * Paths are stored relative to the root and normalised, which keeps the
 * manifest relocatable; pass `{ checkMtime: false }` when verifying a copy
 * (copying rewrites mtimes; size and content checks still apply).
 */

const crypto = require('crypto');
const fsp = require('fs/promises');
const path = require('path');

const MANIFEST_FILENAME = 'integrity_manifest.json';
const MANIFEST_SEAL_FIELD = 'hmac';

/** Convert a platform path to a forward-slash form for stable comparisons. */
function toPosix(p) {
  return String(p).split(path.sep).join('/');
}

/**
 * Derive the manifest sealing key for this machine. Stable across restarts,
 * derived per-user (userData path is per-user by definition) so a manifest
 * sealed here cannot be re-sealed elsewhere. This is tamper-resistance
 * against local rewrites, not cryptographic protection of the key itself —
 * a same-user attacker can read the derivation inputs; raising that bar
 * requires an OS keychain and is deliberately out of scope here.
 *
 * v1 (buggy, kept only for verifying pre-fix seals) folded the *function
 * objects* os.homedir / os.hostname / os.platform into the HMAC input
 * instead of calling them, so the machine-specific part of the key was the
 * stringified function source — identical on every machine. v2 calls them
 * and prefixes the input with 'v2|' so the two derivations never collide.
 * Sealed manifests from v1 verify via `deriveManifestKeyV1` and are
 * transparently re-sealed with v2 on the next clean pass.
 */
function deriveManifestKeyV2(salt) {
  const os = require('os');
  const userInfo = (() => { try { return os.userInfo().username || ''; } catch (_) { return ''; } })();
  const homedir = safeCall(os, 'homedir');
  const hostname = safeCall(os, 'hostname');
  const platform = safeCall(os, 'platform');
  return crypto.createHash('sha256')
    .update('openbrowser-integrity-v2\0')
    .update(String(salt || '') + '\0')
    .update(userInfo + '\0' + homedir + '\0' + hostname + '\0' + platform)
    .digest();
}

/** Pre-fix derivation: the function objects leaked into the input un-called. */
function deriveManifestKeyV1(salt) {
  const os = require('os');
  const userInfo = (() => { try { return os.userInfo().username || ''; } catch (_) { return ''; } })();
  const homedir = os.homedir || '';
  const hostname = os.hostname || '';
  const platform = os.platform || '';
  return crypto.createHash('sha256')
    .update('openbrowser-integrity-v1\0')
    .update(String(salt || '') + '\0')
    .update(userInfo + '\0' + homedir + '\0' + hostname + '\0' + platform)
    .digest();
}

/** Call an os.* helper defensively; an empty string on any failure. */
function safeCall(os, name) {
  try { return typeof os[name] === 'function' ? String(os[name]()) : ''; } catch (_) { return ''; }
}

function sealManifest(manifest, salt, { legacyKey = false } = {}) {
  const body = JSON.stringify({ ...manifest, [MANIFEST_SEAL_FIELD]: undefined });
  const key = legacyKey ? deriveManifestKeyV1(salt) : deriveManifestKeyV2(salt);
  return crypto.createHmac('sha256', key).update(body).digest('hex');
}

/**
 * Recursively list files under `root`.
 *
 * @param {string} root
 * @param {{filter?:(relPath:string)=>boolean, maxEntries?:number}} [options]
 * @returns {Promise<string[]>} Relative POSIX paths, sorted.
 */
async function listFiles(root, options = {}) {
  const maxEntries = Number.isFinite(options.maxEntries) ? options.maxEntries : 20000;
  const out = [];

  async function walk(dir) {
    if (out.length >= maxEntries) return;
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return;
    }
    for (const entry of entries) {
      if (out.length >= maxEntries) return;
      const full = path.join(dir, entry.name);
      const rel = toPosix(path.relative(root, full));
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        if (typeof options.filter === 'function' && !options.filter(rel)) continue;
        out.push(rel);
      }
    }
  }

  await walk(root);
  return out.sort();
}

/**
 * Build a manifest describing every file under `root`.
 *
 * @param {string} root
 * @param {{filter?:(relPath:string)=>boolean, maxEntries?:number, exclude?:string[], hash?:boolean}} [options]
 *   `hash: true` records a per-file sha256 (content-level verification).
 * @returns {Promise<{root:string, files:Array<{filePath:string,mtimeMs:number,size:number,sha256?:string}>}>}
 */
async function buildManifest(root, options = {}) {
  const exclude = new Set(options.exclude || []);
  const filter = (rel) => {
    if (exclude.has(rel)) return false;
    if (typeof options.filter === 'function') return options.filter(rel);
    return true;
  };

  const files = [];
  for (const rel of await listFiles(root, Object.assign({}, options, { filter }))) {
    try {
      const abs = path.join(root, ...rel.split('/'));
      const stat = await fsp.stat(abs);
      const entry = { filePath: rel, mtimeMs: stat.mtimeMs, size: stat.size };
      if (options.hash) entry.sha256 = await hashFile(abs);
      files.push(entry);
    } catch (_) {
      // The file disappeared between listing and stat-ing; skip it.
    }
  }
  return { root, files };
}

/** Streaming sha256 of one file. */
async function hashFile(absPath) {
  const { createHash } = crypto;
  const hash = createHash('sha256');
  await pipelineFile(absPath, hash);
  return hash.digest('hex');
}

function pipelineFile(absPath, hash) {
  const fs = require('fs');
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(absPath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
}

/**
 * Compare a directory against a manifest.
 *
 * @param {string} root
 * @param {{files:Array<{filePath:string,mtimeMs:number,size:number,sha256?:string}>}} manifest
 * @param {{checkMtime?:boolean, checkSize?:boolean, checkHash?:boolean, hash?:boolean}} [options]
 *   Disable `checkMtime` when verifying a relocated copy, since copying
 *   rewrites timestamps. Hashes are compared whenever the manifest entry
 *   carries one (they are only written under `hash: true`).
 * @returns {Promise<{ok:boolean, missing:string[], changed:string[], extra:string[], checked:number, sealValid?:boolean, hashed?:number}>}
 */
async function verifyManifest(root, manifest, options = {}) {
  const checkMtime = options.checkMtime !== false;
  const checkSize = options.checkSize !== false;
  const expected = Array.isArray(manifest && manifest.files) ? manifest.files : [];
  const expectedMap = new Map(expected.map((entry) => [toPosix(entry.filePath), entry]));

  const actualPaths = new Set(await listFiles(root));
  const missing = [];
  const changed = [];
  let hashed = 0;

  for (const [rel, entry] of expectedMap) {
    if (!actualPaths.has(rel)) {
      missing.push(rel);
      continue;
    }
    try {
      const abs = path.join(root, ...rel.split('/'));
      const stat = await fsp.stat(abs);
      const sizeChanged = checkSize
        && Number.isFinite(entry.size)
        && stat.size !== entry.size;
      const mtimeChanged = checkMtime
        && Number.isFinite(entry.mtimeMs)
        // Filesystems round timestamps; tolerate a small delta.
        && Math.abs(stat.mtimeMs - entry.mtimeMs) > 1;
      let hashChanged = false;
      if (typeof entry.sha256 === 'string' && /^[0-9a-f]{64}$/.test(entry.sha256)) {
        const actual = await hashFile(abs);
        hashed += 1;
        hashChanged = actual !== entry.sha256;
      }
      if (sizeChanged || mtimeChanged || hashChanged) changed.push(rel);
    } catch (_) {
      missing.push(rel);
    }
  }

  const extra = [...actualPaths].filter((rel) => !expectedMap.has(rel)).sort();

  return {
    ok: missing.length === 0 && changed.length === 0,
    missing: missing.sort(),
    changed: changed.sort(),
    extra,
    checked: expectedMap.size,
    hashed,
  };
}

/** Write a manifest next to the directory contents, sealed with an HMAC. */
async function writeManifest(root, manifest) {
  await fsp.mkdir(root, { recursive: true });
  const target = path.join(root, MANIFEST_FILENAME);
  const salt = path.basename(String(root || ''));
  const sealed = {
    ...manifest,
    [MANIFEST_SEAL_FIELD]: sealManifest(manifest, salt),
  };
  await fsp.writeFile(target, JSON.stringify(sealed), 'utf8');
  return target;
}

/** Read a manifest, returning null when absent or unreadable. */
async function readManifest(root) {
  try {
    const raw = await fsp.readFile(path.join(root, MANIFEST_FILENAME), 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.files)) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

/**
 * Verify the manifest's own HMAC seal. Returns 'valid' (current v2 key),
 * 'legacy-key' (seal made with the pre-fix v1 derivation — the tree still
 * verifies, and ensureManifest re-seals it with v2), 'legacy' (no seal —
 * recorded before sealing existed), or 'invalid' (neither key verifies:
 * treat as tampering). Callers treat "seal present and invalid" as
 * tampering, and "seal absent" as legacy.
 */
function verifyManifestSeal(manifest, root) {
  if (!manifest || typeof manifest[MANIFEST_SEAL_FIELD] !== 'string') return 'legacy';
  const salt = path.basename(String(root || ''));
  const v2 = sealManifest({ ...manifest, [MANIFEST_SEAL_FIELD]: undefined }, salt);
  if (v2 === manifest[MANIFEST_SEAL_FIELD]) return 'valid';
  const v1 = sealManifest({ ...manifest, [MANIFEST_SEAL_FIELD]: undefined }, salt, { legacyKey: true });
  if (v1 === manifest[MANIFEST_SEAL_FIELD]) return 'legacy-key';
  return 'invalid';
}

/**
 * Convenience wrapper: create the manifest on first run, verify afterwards.
 *
 * A legacy manifest (no seal) that still verifies under stat rules is
 * transparently upgraded to the sealed+hashed form: an installed tree
 * converges to strong verification after one clean pass. A manifest whose
 * seal exists but does not verify is reported as `sealed-invalid` and never
 * silently rebuilt — rebuilding would launder exactly the tamper it detected.
 *
 * @returns {Promise<{status:'created'|'ok'|'mismatch'|'sealed-invalid', report?:object, upgraded?:boolean}>}
 */
async function ensureManifest(root, options = {}) {
  const existing = await readManifest(root);
  if (!existing) {
    const manifest = await buildManifest(root, { ...options, hash: options.hash !== false });
    await writeManifest(root, manifest);
    return { status: 'created' };
  }
  const seal = verifyManifestSeal(existing, root);
  if (seal === 'invalid') {
    // Do NOT rebuild: a bad seal means the manifest was rewritten by something
    // that could not re-seal it. Surfacing it is the whole point of the seal.
    return { status: 'sealed-invalid', report: null };
  }
  const report = await verifyManifest(root, existing, options);
  if (!report.ok) {
    // Drop the stale manifest so the next call rebuilds it.
    await fsp.rm(path.join(root, MANIFEST_FILENAME), { force: true });
    return { status: 'mismatch', report };
  }
  const hasHashes = existing.files.some((entry) => typeof entry.sha256 === 'string');
  if (seal === 'legacy' || seal === 'legacy-key' || !hasHashes) {
    // Clean tree under the old rules: upgrade to the current sealed+hashed
    // form in place (this also re-seals v1-keyed manifests with the v2 key).
    const manifest = await buildManifest(root, { ...options, hash: true });
    await writeManifest(root, manifest);
    return { status: 'ok', report, upgraded: true };
  }
  return { status: 'ok', report };
}

module.exports = {
  buildManifest,
  verifyManifest,
  writeManifest,
  readManifest,
  ensureManifest,
  listFiles,
  toPosix,
  verifyManifestSeal,
  sealManifest,
  MANIFEST_FILENAME,
};
