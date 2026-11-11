'use strict';

/**
 * Ed25519 release-signature trust root for the app updater.
 *
 * Threat model: SHA256SUMS.txt and the installer travel through the same
 * GitHub account. An account takeover replaces both, and a digest check
 * "passes" against the attacker's own manifest. A signature made with a
 * private key that never touches the release account breaks that coupling:
 * the manifest is signed offline, the public key is embedded in the app.
 *
 * Key lifecycle: the shipped public keys live in TRUSTED_KEYS below. The
 * first real key was generated and embedded 2026-11-07; releases from that
 * point on should publish SHA256SUMS.txt.sig assets alongside the manifest.
 * Future updates require a signature. app-update.js contains an exact
 * historical version exception; transport failures and malformed signatures
 * never become that exception, and no env var bypasses the trust root. The deployment proof in
 * selftests/data/update-trust-proof.json ties the embedded key to the
 * offline private half and is checked by update-checksum-selftest on every
 * CI run.
 *
 * Rotation: append the new key to TRUSTED_KEYS; releases signed with any
 * listed key verify. Remove a retired key only after every supported app
 * version knows the new one.
 */

const crypto = require('crypto');

const TRUSTED_KEYS = [
  // Key 1 — generated 2026-11-07 with `node update-trust-tool.js genkey`, first
  // deployed trust root. Sign each release manifest offline with
  // `node update-trust-tool.js sign SHA256SUMS.txt` before publishing; the
  // public half below is the only part that may ever be committed.
  'MCowBQYDK2VwAyEAnSISpERX6lMiPF2De4D7RBjf0PmqP7COy6xF/t3li/A=',
];

function trustedPublicKeys() {
  return TRUSTED_KEYS.map((k) => String(k || '').trim()).filter((k) => k && !k.includes('PLACEHOLDER'));
}

function parsePemOrBase64(publicKey) {
  const raw = String(publicKey || '').trim();
  if (!raw) return null;
  if (raw.startsWith('-----BEGIN')) return raw;
  // bare base64 SPKI
  try {
    return crypto.createPublicKey({ key: Buffer.from(raw, 'base64'), format: 'der', type: 'spki' });
  } catch (_) {
    return null;
  }
}

/**
 * Verify a detached Ed25519 signature over the exact manifest bytes.
 * @returns {{ ok: boolean, reason: string }}
 */
function verifyManifestSignature(manifestBuffer, signatureBuffer) {
  if (!Buffer.isBuffer(manifestBuffer) || manifestBuffer.length === 0) {
    return { ok: false, reason: 'empty-manifest' };
  }
  if (!Buffer.isBuffer(signatureBuffer) || signatureBuffer.length === 0) {
    return { ok: false, reason: 'empty-signature' };
  }
  const keys = trustedPublicKeys();
  if (!keys.length) {
    // No real key embedded yet: the trust root is not deployed. Refuse to
    // "verify" rather than pretend — callers treat this as unsigned-release.
    return { ok: false, reason: 'no-trusted-key-embedded' };
  }
  let lastReason = 'no-key-matched';
  for (const keySrc of keys) {
    const key = parsePemOrBase64(keySrc);
    if (!key) { lastReason = 'unparseable-trusted-key'; continue; }
    try {
      const valid = crypto.verify(null, manifestBuffer, key, signatureBuffer);
      if (valid) return { ok: true, reason: 'ok' };
      lastReason = 'signature-mismatch';
    } catch (error) {
      lastReason = 'verify-error:' + (error && error.message ? error.message.slice(0, 80) : 'unknown');
    }
  }
  return { ok: false, reason: lastReason };
}

module.exports = {
  trustedPublicKeys,
  verifyManifestSignature,
  parsePemOrBase64,
};
