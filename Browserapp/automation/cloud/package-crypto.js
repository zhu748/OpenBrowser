'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);

// OBE1 retains compatibility with packages written before the KDF upgrade.
const CURRENT = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const LEGACY = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const keys = new Map();
const salts = new Map();
const deriving = new Map();
// M-9: the cache keys below used to embed the passphrase verbatim; a heap
// snapshot or crash log containing either Map's key list read the backup
// secret straight back. Keys are now HMAC digests under a process-random
// secret — an attacker with the heap needs both the digest (unusable as a
// passphrase) and this non-exported secret to attempt anything.
const CACHE_HMAC_KEY = crypto.randomBytes(32);
const digestId = (passphrase, saltHex, N) => {
  const mac = crypto.createHmac('sha256', CACHE_HMAC_KEY);
  mac.update(saltHex + '|' + N + '|');
  mac.update(String(passphrase));
  return mac.digest('hex');
};

function cacheKey(passphrase, salt, params) {
  return digestId(passphrase, salt.toString('hex'), params.N);
}

function rememberKey(id, key) {
  if (keys.size >= 16) keys.clear();
  keys.set(id, key);
  return key;
}

function deriveSync(passphrase, salt, params) {
  const id = cacheKey(passphrase, salt, params);
  return keys.get(id) || rememberKey(id, crypto.scryptSync(String(passphrase), salt, 32, params));
}

// Concurrent callers share the same derivation. Package operations await the
// worker-pool KDF so an uncached password does not block the desktop event loop.
function deriveAsync(passphrase, salt, params) {
  const id = cacheKey(passphrase, salt, params);
  if (keys.has(id)) return Promise.resolve(keys.get(id));
  if (deriving.has(id)) return deriving.get(id);
  const pending = scrypt(String(passphrase), salt, 32, params)
    .then((key) => rememberKey(id, key))
    .finally(() => deriving.delete(id));
  deriving.set(id, pending);
  return pending;
}

function encryptionSalt(passphrase) {
  const id = digestId(passphrase, '', 'salt');
  if (!salts.has(id)) {
    if (salts.size >= 8) salts.clear();
    salts.set(id, crypto.randomBytes(16));
  }
  return salts.get(id);
}

function encryptWithKey(plainBuf, salt, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plainBuf), cipher.final()]);
  return { encrypted: true, data: Buffer.concat([Buffer.from('OBE1'), salt, iv, cipher.getAuthTag(), enc]) };
}

function encryptedParts(buf, passphrase) {
  if (buf.length < 4 || buf.subarray(0, 4).toString() !== 'OBE1') return null;
  if (!passphrase) throw new Error('备份已加密，请填写恢复密码');
  if (buf.length < 48) throw new Error('加密备份包不完整');
  return { salt: buf.subarray(4, 20), iv: buf.subarray(20, 32), tag: buf.subarray(32, 48), enc: buf.subarray(48) };
}

function decryptWithKey({ iv, tag, enc }, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

// Keep the original synchronous exports for external callers and credential
// format parity checks. The actual backup/restore pipeline uses the async pair.
function encryptPayload(plainBuf, passphrase) {
  if (!passphrase) return { encrypted: false, data: plainBuf };
  const salt = encryptionSalt(String(passphrase));
  return encryptWithKey(plainBuf, salt, deriveSync(passphrase, salt, CURRENT));
}

async function encryptPayloadAsync(plainBuf, passphrase) {
  if (!passphrase) return { encrypted: false, data: plainBuf };
  const salt = encryptionSalt(String(passphrase));
  return encryptWithKey(plainBuf, salt, await deriveAsync(passphrase, salt, CURRENT));
}

// M-9: a GCM tag mismatch surfaces as a raw OpenSSL error ("Unsupported
// state" / "auth tag mismatch") that tells the user nothing. Both failure
// modes of a wrong passphrase — tag mismatch and garbled header — map to
// one actionable message; the original error stays on `cause` for logs.
function friendlyDecryptError(error) {
  const message = String(error && error.message || '');
  if (/auth tag|unsupported state|digit range|invalid/.test(message) || !message) {
    const wrapped = new Error('备份口令不正确或备份包已损坏（解密失败）');
    wrapped.code = 'BACKUP_DECRYPT_FAILED';
    wrapped.cause = error;
    return wrapped;
  }
  return error;
}

function decryptPayload(buf, passphrase) {
  const parts = encryptedParts(buf, passphrase);
  if (!parts) return buf;
  try { return decryptWithKey(parts, deriveSync(passphrase, parts.salt, CURRENT)); }
  catch (error) {
    try { return decryptWithKey(parts, deriveSync(passphrase, parts.salt, LEGACY)); }
    catch (_) { throw friendlyDecryptError(error); }
  }
}

async function decryptPayloadAsync(buf, passphrase) {
  const parts = encryptedParts(buf, passphrase);
  if (!parts) return buf;
  try { return decryptWithKey(parts, await deriveAsync(passphrase, parts.salt, CURRENT)); }
  catch (error) {
    try { return decryptWithKey(parts, await deriveAsync(passphrase, parts.salt, LEGACY)); }
    catch (_) { throw friendlyDecryptError(error); }
  }
}

module.exports = { encryptPayload, decryptPayload, encryptPayloadAsync, decryptPayloadAsync };
