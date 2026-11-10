'use strict';

const fs = require('fs');

const path = require('path');
const os = require('os');
const crypto = require('crypto');

const MAGIC_SAFESTORAGE_V1 = 'OBS1'; // OpenBrowser SafeStorage v1
const MAGIC_AES_GCM_V1 = 'OBE1';      // OpenBrowser Encrypted v1 (compatible with cloud-sync .obpack)

const HEADER_LENGTH = 4;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

let _safeStorageMock = null;
let _cachedMasterKey = null;

// P3-31: rate-limit the plaintext-legacy warning — a multi-row store read
// would otherwise warn once per row and drown everything else in the console.
const LEGACY_PLAINTEXT_WARN_LIMIT = 5;
let __legacyPlaintextWarnCount = 0;

/**
 * Returns true if Electron safeStorage is available and configured on this system.
 * Allows override via mock for testing environments.
 */
function isSafeStorageAvailable() {
  if (_safeStorageMock !== null) {
    try {
      return Boolean(_safeStorageMock.isEncryptionAvailable?.());
    } catch (_) {
      return false;
    }
  }
  try {
    const electron = require('electron');
    const safeStorage = electron?.safeStorage;
    if (safeStorage && typeof safeStorage.isEncryptionAvailable === 'function') {
      return Boolean(safeStorage.isEncryptionAvailable());
    }
  } catch (_) {}
  return false;
}

function getSafeStorage() {
  if (_safeStorageMock !== null) {
    return _safeStorageMock;
  }
  try {
    const electron = require('electron');
    return electron?.safeStorage || null;
  } catch (_) {
    return null;
  }
}

/**
 * Test hook to mock Electron's safeStorage in pure Node.js environments.
 * Pass null to restore default discovery.
 */
function setSafeStorageMock(mock) {
  _safeStorageMock = mock;
}

/**
 * Resolve the path to the offline master key file.
 * Stored strictly outside the application's userData directory (in user home with 0600 mode).
 */
function getMasterKeyFilePath() {
  if (process.env.OPENBROWSER_MASTER_KEY_FILE) {
    return path.resolve(process.env.OPENBROWSER_MASTER_KEY_FILE);
  }
  return path.join(os.homedir(), '.openbrowser-master.key');
}

/**
 * Retrieve or generate the local master key for offline AES-256-GCM fallback encryption.
 * Security trade-off:
 * - Stored in ~/.openbrowser-master.key outside userData to prevent credential leakage if userData is copied/exported.
 * - Mode 0600 restricts access to the current OS user.
 * - Provides guaranteed offline/headless availability when OS Keyring/DPAPI is unavailable.
 */
function getLocalMasterKey() {
  if (process.env.OPENBROWSER_MASTER_KEY) {
    return String(process.env.OPENBROWSER_MASTER_KEY).trim();
  }
  if (_cachedMasterKey) {
    return _cachedMasterKey;
  }

  const keyPath = getMasterKeyFilePath();
  try {
    if (fs.existsSync(keyPath)) {
      const content = fs.readFileSync(keyPath, 'utf8').trim();
      if (content && content.length >= 32) {
        _cachedMasterKey = content;
        return _cachedMasterKey;
      }
    }
  } catch (_) {}

  // Generate a new 256-bit cryptographically secure key
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    const dir = path.dirname(keyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(keyPath, generated, { encoding: 'utf8', mode: 0o600 });
    _cachedMasterKey = generated;
    return _cachedMasterKey;
  } catch (writeErr) {
    // SECURITY: never derive the key from guessable system identity (hostname /
    // username / homedir). A predictable key silently converts "at rest"
    // encryption into plaintext for anyone who can read those values. Instead
    // fall back to a random in-memory session key: the process keeps working,
    // but anything encrypted now will not be readable after restart (on a
    // read-only filesystem it could not be persisted anyway).
    _cachedMasterKey = crypto.randomBytes(32).toString('hex');
    console.warn(
      `[OpenBrowser] cannot persist master key at ${keyPath} (${writeErr.message}); ` +
      'using a random in-memory session key — encrypted credentials will NOT survive an app restart. ' +
      'Fix filesystem permissions or set OPENBROWSER_MASTER_KEY_FILE to a writable path.',
    );
    return _cachedMasterKey;
  }
}

/**
 * Reset cached master key (useful in unit tests).
 */
function resetLocalMasterKeyCache() {
  _cachedMasterKey = null;
}

/**
 * Check if the given buffer or string starts with a recognized encryption header.
 */
function isEncrypted(bufferOrString) {
  if (!bufferOrString) return false;
  const buf = Buffer.isBuffer(bufferOrString)
    ? bufferOrString
    : Buffer.from(String(bufferOrString), 'binary');
  if (buf.length < HEADER_LENGTH) return false;
  const header = buf.subarray(0, HEADER_LENGTH).toString('ascii');
  return header === MAGIC_SAFESTORAGE_V1 || header === MAGIC_AES_GCM_V1;
}

/**
 * Return format name: 'OBS1', 'OBE1', or 'plaintext'.
 */
function getFormat(bufferOrString) {
  if (!bufferOrString) return 'plaintext';
  const buf = Buffer.isBuffer(bufferOrString)
    ? bufferOrString
    : Buffer.from(String(bufferOrString), 'binary');
  if (buf.length >= HEADER_LENGTH) {
    const header = buf.subarray(0, HEADER_LENGTH).toString('ascii');
    if (header === MAGIC_SAFESTORAGE_V1) return MAGIC_SAFESTORAGE_V1;
    if (header === MAGIC_AES_GCM_V1) return MAGIC_AES_GCM_V1;
  }
  return 'plaintext';
}

/**
 * Encrypt buffer using AES-256-GCM in OBE1 format.
 * Exactly compatible with cloud-sync.js encryptPayload format.
 */
// scryptSync costs ~30-45ms of synchronous main-thread time per call, and
// persist() re-encrypts every profile on every run. The master key is a
// 256-bit random hex string, so the KDF is defence in depth rather than the
// main strength; pay it once per (passphrase, salt) instead of once per record.
const __derivedKeyCache = new Map();
// THREAT MODEL: this cache holds raw derived key material in memory for the
// process lifetime; accepted because the protected asset is data at rest —
// anyone who can read this process's memory already has wider reach (Electron
// main process) than any at-rest ciphertext. Never serialized anywhere.
const DERIVED_KEY_CACHE_MAX = 256;

function deriveAesKey(passphrase, salt) {
  const cacheKey = salt.toString('hex') + '|' + passphrase;
  const cached = __derivedKeyCache.get(cacheKey);
  if (cached) return cached;
  const key = crypto.scryptSync(passphrase, salt, KEY_LENGTH);
  if (__derivedKeyCache.size >= DERIVED_KEY_CACHE_MAX) __derivedKeyCache.clear();
  __derivedKeyCache.set(cacheKey, key);
  return key;
}

// cloud-sync.js upgraded its OBE1 scrypt cost (N=2^17) while keeping a
// legacy-cost fallback for pre-upgrade packages; Node's default (N=16384)
// equals that legacy cost. OBE1 is a shared wire format between the two
// modules, so a package written by cloud backup must decrypt here too. The
// local format keeps the default cost; the upgraded cost is only used on
// decrypt, after the default derivation fails GCM authentication.
const CLOUD_SCRYPT_COST = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

function deriveAesKeyAtCloudCost(passphrase, salt) {
  const cacheKey = 'cloud-cost|' + salt.toString('hex') + '|' + passphrase;
  const cached = __derivedKeyCache.get(cacheKey);
  if (cached) return cached;
  const key = crypto.scryptSync(passphrase, salt, KEY_LENGTH, CLOUD_SCRYPT_COST);
  if (__derivedKeyCache.size >= DERIVED_KEY_CACHE_MAX) __derivedKeyCache.clear();
  __derivedKeyCache.set(cacheKey, key);
  return key;
}

// —— P2-11: KDF cost tag + negative decrypt cache ——
// OBE1 carries no KDF-cost field, so every record that fails GCM auth under the
// default derivation (wrong passphrase, or a cloud-cost package derived at the
// default cost first) pays a SECOND blocking scryptSync at N=131072 on the
// Electron main thread — a wrong passphrase on a multi-row cloud restore then
// performs 2×N blocking derivations and freezes the UI. All three fixes stay
// inside this module; cloud-sync.js owns the shared OBE1 wire format and must
// not drift, so the tag rides in the envelope's last SALT byte — the only field
// both sides treat as opaque scrypt input. cloud-sync derives the identical key
// from the identical salt bytes, and the magic stays OBE1.
//   0x01 = Node default cost (N=16384), 0x02 = cloud cost (N=131072).
//   Untagged (fully random) salts = legacy envelopes → dual attempt preserved
//   so every existing store still decrypts (legacy fallback stays).
const __negativeDecryptCache = new Map();
const NEGATIVE_DECRYPT_CACHE_MAX = 1024;
const SALT_COST_TAG_DEFAULT = 0x01;
const SALT_COST_TAG_CLOUD = 0x02;
const SALT_LENGTH_UNTAGGED = SALT_LENGTH - 1;

function saltCostTag(salt) {
  return Buffer.isBuffer(salt) && salt.length >= SALT_LENGTH ? salt[SALT_LENGTH - 1] : 0;
}

function negativeCacheKey(passphrase, salt) {
  return String(passphrase) + '|' + salt.toString('hex');
}

// A GCM failure is permanent per (passphrase, salt): the tag is deterministic,
// so remembering the failure lets later rows fast-fail with zero derivations.
function rememberFailedDecrypt(passphrase, salt) {
  if (__negativeDecryptCache.size >= NEGATIVE_DECRYPT_CACHE_MAX) __negativeDecryptCache.clear();
  __negativeDecryptCache.set(negativeCacheKey(passphrase, salt), Date.now());
}

function clearNegativeDecryptCache() {
  __negativeDecryptCache.clear();
}

// Reuse one salt per passphrase for encryption so the KDF cost is paid once
// per process. AES-GCM only requires IV uniqueness per key; the IV stays random.
const __encryptSaltCache = new Map();
// THREAT MODEL: holds KDF salts in memory for process lifetime — same
// acceptance as __derivedKeyCache above; never persisted or serialized.

function encryptSaltFor(passphrase) {
  let salt = __encryptSaltCache.get(passphrase);
  if (!salt) {
    if (__encryptSaltCache.size >= 32) __encryptSaltCache.clear();
    // P2-11: 15 random bytes + cost-tag byte (0x01 = default cost; writes here
    // always use the default derivation). See the P2-11 block above — the tag
    // is inside the salt, so both this module and cloud-sync derive the
    // identical key from the identical bytes and the wire stays OBE1.
    salt = Buffer.concat([crypto.randomBytes(SALT_LENGTH_UNTAGGED), Buffer.from([SALT_COST_TAG_DEFAULT])]);
    __encryptSaltCache.set(passphrase, salt);
  }
  return salt;
}

function encryptAesGcm(plainBuf, passphraseOrKey) {
  const passphrase = String(passphraseOrKey || getLocalMasterKey());
  const salt = encryptSaltFor(passphrase);
  const key = deriveAesKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plainBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([
    Buffer.from(MAGIC_AES_GCM_V1, 'ascii'),
    salt,
    iv,
    tag,
    enc,
  ]);
}

/**
 * Decrypt buffer in OBE1 format using AES-256-GCM.
 * Exactly compatible with cloud-sync.js decryptPayload format.
 */
function decryptAesGcm(buf, passphraseOrKey) {
  const passphrase = String(passphraseOrKey || getLocalMasterKey());
  if (!buf || buf.length < HEADER_LENGTH + SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('无效的 OBE1 加密数据包: 长度不足');
  }
  const header = buf.subarray(0, HEADER_LENGTH).toString('ascii');
  if (header !== MAGIC_AES_GCM_V1) {
    throw new Error(`非 OBE1 格式头: ${header}`);
  }
  const salt = buf.subarray(HEADER_LENGTH, HEADER_LENGTH + SALT_LENGTH);
  const iv = buf.subarray(HEADER_LENGTH + SALT_LENGTH, HEADER_LENGTH + SALT_LENGTH + IV_LENGTH);
  const tag = buf.subarray(HEADER_LENGTH + SALT_LENGTH + IV_LENGTH, HEADER_LENGTH + SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const enc = buf.subarray(HEADER_LENGTH + SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const openWith = (k) => {
    const decipher = crypto.createDecipheriv('aes-256-gcm', k, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]);
  };
  // P2-11: negative cache first — a remembered (passphrase, salt) failure
  // fast-fails before ANY scryptSync, so a wrong passphrase on a multi-row
  // restore pays one derivation for row 1 and none for rows 2..N.
  if (__negativeDecryptCache.has(negativeCacheKey(passphrase, salt))) {
    throw new Error('OBE1 解密失败：口令或数据不匹配（命中失败缓存）');
  }
  const costTag = saltCostTag(salt);
  if (costTag === SALT_COST_TAG_DEFAULT || costTag === SALT_COST_TAG_CLOUD) {
    // Tagged salt: single derivation at the tagged cost. A legacy UNTAGGED
    // salt is fully random, so ~1/256 of legacy records collide with a tag
    // byte; a tag collision is indistinguishable from a wrong passphrase
    // until the other cost is tried. On failure, try the other cost ONCE
    // before caching the negative result — that covers the collision without
    // paying the dual attempt on the success path.
    const cloudTagged = costTag === SALT_COST_TAG_CLOUD;
    const derivedKey = cloudTagged
      ? deriveAesKeyAtCloudCost(passphrase, salt)
      : deriveAesKey(passphrase, salt);
    try {
      const plain = openWith(derivedKey);
      clearNegativeDecryptCache();
      return plain;
    } catch (_) {
      const otherKey = cloudTagged
        ? deriveAesKey(passphrase, salt)
        : deriveAesKeyAtCloudCost(passphrase, salt);
      try {
        const plain = openWith(otherKey);
        clearNegativeDecryptCache();
        return plain;
      } catch (error) {
        rememberFailedDecrypt(passphrase, salt);
        throw error;
      }
    }
  }
  // Legacy untagged salt: keep the dual attempt (default first, cloud second)
  // so every existing store still decrypts. The negative cache above bounds
  // the cost of repeated wrong-passphrase attempts.
  try {
    const plain = openWith(deriveAesKey(passphrase, salt));
    clearNegativeDecryptCache();
    return plain;
  } catch (error) {
    try {
      const plain = openWith(deriveAesKeyAtCloudCost(passphrase, salt));
      clearNegativeDecryptCache();
      return plain;
    } catch (_) {
      rememberFailedDecrypt(passphrase, salt);
      throw error;
    }
  }
}

/**
 * Unified credential encrypt function.
 * Mode:
 *  - 'auto' (default): use safeStorage if available; fall back to AES-256-GCM (OBE1) with local master key.
 *  - 'safeStorage': force safeStorage; throws if unavailable.
 *  - 'aes-gcm': force AES-256-GCM (OBE1).
 *
 * Returns a Buffer with a 4-byte version header ('OBS1' or 'OBE1').
 */
function encryptCredential(plaintext, options = {}) {
  const text = typeof plaintext === 'string'
    ? plaintext
    : Buffer.isBuffer(plaintext) ? plaintext.toString('utf8') : String(plaintext ?? '');
  const mode = options.mode || 'auto';

  if (mode === 'safeStorage' || (mode === 'auto' && isSafeStorageAvailable())) {
    const safeStorage = getSafeStorage();
    if (!safeStorage || typeof safeStorage.encryptString !== 'function') {
      throw new Error('safeStorage 接口不可用');
    }
    const encrypted = safeStorage.encryptString(text);
    return Buffer.concat([Buffer.from(MAGIC_SAFESTORAGE_V1, 'ascii'), encrypted]);
  }

  // Fallback: local master key + AES-256-GCM (OBE1 format)
  const passphrase = options.passphrase || getLocalMasterKey();
  return encryptAesGcm(Buffer.from(text, 'utf8'), passphrase);
}

/**
 * Unified credential decrypt function.
 * If data starts with OBS1: decrypts via safeStorage.
 * If data starts with OBE1: decrypts via AES-256-GCM with passphrase or local master key.
 * If data is unencrypted plaintext: returns the string as-is (for transparent legacy reading).
 */
function decryptCredential(bufferOrString, options = {}) {
  if (bufferOrString == null) return '';
  const buf = Buffer.isBuffer(bufferOrString)
    ? bufferOrString
    : Buffer.from(String(bufferOrString), 'binary');

  if (buf.length < HEADER_LENGTH) {
    return buf.toString('utf8');
  }

  const header = buf.subarray(0, HEADER_LENGTH).toString('ascii');
  if (header === MAGIC_SAFESTORAGE_V1) {
    const safeStorage = getSafeStorage();
    if (!safeStorage || typeof safeStorage.decryptString !== 'function') {
      throw new Error('safeStorage 不可用，无法解密 OBS1 格式凭据');
    }
    return safeStorage.decryptString(buf.subarray(HEADER_LENGTH));
  }

  if (header === MAGIC_AES_GCM_V1) {
    const passphrase = options.passphrase || getLocalMasterKey();
    const plainBuf = decryptAesGcm(buf, passphrase);
    return plainBuf.toString('utf8');
  }

  // Plaintext legacy fallback. A ciphertext that was swapped for plaintext (or a
  // never-encrypted store) lands here silently; log it so an encryption downgrade
  // is at least observable instead of invisible. Rate-limited (P3-31): a store
  // read hits this once per row, which would otherwise flood the console and
  // push the signal (a possible downgrade attack) under the noise.
  if (__legacyPlaintextWarnCount < LEGACY_PLAINTEXT_WARN_LIMIT) {
    __legacyPlaintextWarnCount += 1;
    console.warn('[credential-crypto] decrypting legacy plaintext payload (no OBS1/AES-GCM magic header)');
    if (__legacyPlaintextWarnCount === LEGACY_PLAINTEXT_WARN_LIMIT) {
      console.warn('[credential-crypto] legacy-plaintext warning limit reached; further warnings suppressed for this process');
    }
  }
  return buf.toString('utf8');
}

/**
 * Encrypt a JSON serializable object.
 */
function encryptCredentialJson(data, options = {}) {
  const json = JSON.stringify(data, null, 2);
  return encryptCredential(json, options);
}

/**
 * Decrypt a JSON serializable object.
 */
function decryptCredentialJson(bufferOrString, options = {}) {
  const decrypted = decryptCredential(bufferOrString, options);
  return JSON.parse(decrypted);
}

module.exports = {
  MAGIC_SAFESTORAGE_V1,
  MAGIC_AES_GCM_V1,
  isSafeStorageAvailable,
  setSafeStorageMock,
  getLocalMasterKey,
  getMasterKeyFilePath,
  resetLocalMasterKeyCache,
  isEncrypted,
  getFormat,
  encryptAesGcm,
  decryptAesGcm,
  encryptCredential,
  decryptCredential,
  encryptCredentialJson,
  decryptCredentialJson,
  // P2-11 test surface: salt cost-tag constants + negative-cache hook.
  SALT_COST_TAG_DEFAULT: SALT_COST_TAG_DEFAULT,
  SALT_COST_TAG_CLOUD: SALT_COST_TAG_CLOUD,
  clearNegativeDecryptCache: clearNegativeDecryptCache,
};
