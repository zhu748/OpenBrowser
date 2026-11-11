'use strict';

/**
 * Trust installer for the Firefox worker-MITM CA.
 *
 * The MITM forwarder intercepts TLS sessions with per-host leaves signed by a
 * per-instance CA. Firefox must trust that CA, and the only per-profile channel
 * that works without OS-level elevation is the NSS store in the profile root:
 * import the CA with certutil (shipped by the kernel bundle / extracted to a
 * known location) before the first launch. This replaces the earlier
 * cert_override.txt pinning, which only ever covered a fixed host list and
 * therefore could not scale beyond the gate.
 *
 * The import is idempotent: -A with the same nickname overwrites, and a
 * missing certutil or a failed import is a hard error for the caller to decide
 * on (the engine falls back to launching without worker rewriting rather than
 * blocking the profile).
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/** Locate certutil: env override, kernel-bundled copy, then PATH. */
function findCertutil() {
  if (process.env.OPENBROWSER_CERTUTIL) {
    try { fs.accessSync(process.env.OPENBROWSER_CERTUTIL, fs.constants.X_OK); return process.env.OPENBROWSER_CERTUTIL; } catch (_) { /* fall through */ }
  }
  const bundled = path.join(__dirname, '..', 'kernels', 'certutil');
  const exe = process.platform === 'win32' ? bundled + '.exe' : bundled;
  try { fs.accessSync(exe, fs.constants.X_OK); return exe; } catch (_) { /* fall through */ }
  const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['certutil'], { encoding: 'utf8' });
  if (which.status === 0) return which.stdout.trim().split('\n')[0];
  return null;
}

/**
 * Import `caPem` into the profile's NSS store (sql:<root>). Safe on a fresh
 * profile (cert9.db not yet created — certutil -N runs first) and on an
 * existing one. Returns true on success, false when certutil is unavailable.
 */
function installFirefoxCa(root, caPem) {
  const certutil = findCertutil();
  if (!certutil) return { ok: false, reason: 'certutil-unavailable' };
  const db = 'sql:' + root;
  const hasDb = fs.existsSync(path.join(root, 'cert9.db'));
  if (!hasDb) {
    const created = spawnSync(certutil, ['-N', '-d', db, '--empty-password'], { encoding: 'utf8', timeout: 20000 });
    if (created.status !== 0) return { ok: false, reason: 'nss-init-failed', detail: created.stderr?.trim().slice(0, 300) };
  }
  const caPath = path.join(root, '.ob-worker-ca.pem');
  fs.writeFileSync(caPath, caPem, { mode: 0o600 });
  try {
    const added = spawnSync(certutil, ['-A', '-d', db, '-t', 'C,,', '-n', 'OpenBrowser Worker CA', '-i', caPath], { encoding: 'utf8', timeout: 20000 });
    if (added.status !== 0) return { ok: false, reason: 'ca-import-failed', detail: added.stderr?.trim().slice(0, 300) };
    return { ok: true };
  } finally {
    fs.rmSync(caPath, { force: true });
  }
}

module.exports = { installFirefoxCa, findCertutil };
