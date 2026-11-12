'use strict';

const crypto = require('node:crypto');
const { u32 } = require('../fingerprint-generators');

const CURRENT_FINGERPRINT_VERSION = 2;

// Missing versions belong to persisted legacy profiles, including old backups.
function fingerprintVersion(value) {
  if (value === undefined || value === null || value === '') return 1;
  if (value !== 1 && value !== 2 && value !== '1' && value !== '2') {
    throw new Error('Unsupported fingerprintVersion: ' + String(value));
  }
  return Number(value);
}

function createFingerprintDraw(seed, version) {
  const cache = new Map();
  return (domain, legacyOffset) => {
    if (version === 1) return u32(seed, legacyOffset);
    if (!cache.has(domain)) {
      // Domain separation avoids the legacy modulo-29 offsets making distinct
      // fields share bits (for example contrast and devicePixelRatio).
      cache.set(domain, crypto.createHash('sha256')
        .update('OpenBrowser/fingerprint/v2\0').update(seed)
        .update('\0').update(domain).digest().readUInt32BE(0));
    }
    return cache.get(domain);
  };
}

module.exports = { CURRENT_FINGERPRINT_VERSION, fingerprintVersion, createFingerprintDraw };
