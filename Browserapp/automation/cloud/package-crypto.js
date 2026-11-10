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

function cacheKey(passphrase, salt, params) {
  return `${salt.toString('hex')}|${params.N}|${String(passphrase)}`;
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
  if (!salts.has(passphrase)) {
    if (salts.size >= 8) salts.clear();
    salts.set(passphrase, crypto.randomBytes(16));
  }
  return salts.get(passphrase);
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

function decryptPayload(buf, passphrase) {
  const parts = encryptedParts(buf, passphrase);
  if (!parts) return buf;
  try { return decryptWithKey(parts, deriveSync(passphrase, parts.salt, CURRENT)); }
  catch (error) {
    try { return decryptWithKey(parts, deriveSync(passphrase, parts.salt, LEGACY)); }
    catch (_) { throw error; }
  }
}

async function decryptPayloadAsync(buf, passphrase) {
  const parts = encryptedParts(buf, passphrase);
  if (!parts) return buf;
  try { return decryptWithKey(parts, await deriveAsync(passphrase, parts.salt, CURRENT)); }
  catch (error) {
    try { return decryptWithKey(parts, await deriveAsync(passphrase, parts.salt, LEGACY)); }
    catch (_) { throw error; }
  }
}

module.exports = { encryptPayload, decryptPayload, encryptPayloadAsync, decryptPayloadAsync };
