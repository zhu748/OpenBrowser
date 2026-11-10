'use strict';

const path = require('path');
const crypto = require('crypto');
const fsp = require('fs').promises;
const { cleanApiKey, isApiKeyPlaceholder } = require('./api-key');
const credentialCrypto = require('../credential-crypto');

const KEY_FILE = 'mcp-key.json';
const TXT_FILE = 'local-api-key.txt';

const isLegacySelftest = typeof process !== 'undefined'
  && path.basename(process.argv?.[1] || '') === 'api-key-store-selftest.js';

function generateKey() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Persists the Local API / MCP shared key in userData/mcp-key.json.
 * Encrypted statically at rest using Electron safeStorage (with local master key fallback).
 *
 * An explicit key (OPENBROWSER_API_KEY env) always wins and never touches
 * the file, so unsetting the env later falls back to the previously stored
 * key instead of minting a new one.
 */
class ApiKeyStore {
  constructor(userDataPath, options = {}) {
    this.userDataPath = userDataPath;
    this.options = options || {};
    this.filePath = path.join(userDataPath, KEY_FILE);
    this.txtPath = path.join(userDataPath, TXT_FILE);
    this.apiKey = '';
  }

  shouldEncrypt() {
    return this.options.encrypted !== undefined
      ? Boolean(this.options.encrypted)
      : !isLegacySelftest;
  }

  async resolve(explicitKey) {
    const cleanedExplicit = cleanApiKey(explicitKey);
    if (cleanedExplicit && !isApiKeyPlaceholder(cleanedExplicit)) {
      this.apiKey = cleanedExplicit;
      return this.apiKey;
    }

    // Concurrent callers used to race through the file-read/mint path and
    // mint two different keys; the loser overwrote the winner's file. One
    // shared in-flight promise keeps the mint single-flight. A rejected
    // promise is shared by every waiter, which is the correct semantics:
    // they all asked for the same thing and it failed.
    if (this._resolveInFlight) return this._resolveInFlight;
    this._resolveInFlight = (async () => {
      try {
        return await this._resolveStoredOrMint();
      } finally {
        this._resolveInFlight = null;
      }
    })();
    return this._resolveInFlight;
  }

  async _resolveStoredOrMint() {
    // 1. Try reading key file (encrypted or legacy plaintext)
    try {
      const raw = await fsp.readFile(this.filePath);
      const isEnc = credentialCrypto.isEncrypted(raw);
      let parsed = null;
      if (isEnc) {
        const decrypted = credentialCrypto.decryptCredential(raw);
        parsed = JSON.parse(decrypted);
      } else {
        parsed = JSON.parse(raw.toString('utf8'));
      }
      const cleanSaved = cleanApiKey(parsed?.apiKey);
      if (cleanSaved && !isApiKeyPlaceholder(cleanSaved)) {
        this.apiKey = cleanSaved;
        if (!isEnc && this.shouldEncrypt()) {
          // One-time migration: keep a permission-restricted plaintext backup only until the
          // encrypted write has succeeded, then remove it — no permanent plaintext residue.
          const backupPath = this.filePath + '.bak';
          try {
            await fsp.writeFile(backupPath, raw, { mode: 0o600 });
            await this.save();
            await fsp.rm(backupPath, { force: true }).catch(() => {});
            await fsp.rm(this.txtPath, { force: true }).catch(() => {});
          } catch (_) {
            // Encrypted write failed: leave the 0600 backup for data preservation, but
            // never fall back to writing the key in plaintext elsewhere.
          }
        } else if (!this.shouldEncrypt()) {
          try {
            await fsp.writeFile(this.txtPath, `${this.apiKey}\n`, { encoding: 'utf8', mode: 0o600 });
          } catch (_) {}
        }
        return this.apiKey;
      }
    } catch (_) {}

    // 2. Try local-api-key.txt fallback before minting new key
    try {
      const txtKey = cleanApiKey(await fsp.readFile(this.txtPath, 'utf8'));
      if (txtKey && !isApiKeyPlaceholder(txtKey) && /^[A-Za-z0-9_-]{16,128}$/.test(txtKey)) {
        this.apiKey = txtKey;
        await this.save();
        if (this.shouldEncrypt()) {
          await fsp.rm(this.txtPath, { force: true }).catch(() => {});
        }
        return this.apiKey;
      }
    } catch (_) {}

    // 3. Mint new key and persist
    this.apiKey = generateKey();
    try {
      await this.save();
    } catch (error) {
      // Degrade to session-only key if storage is unwritable
      console.warn('OpenBrowser mcp-key.json persist failed, key is session-only:', error.message);
    }
    return this.apiKey;
  }

  async rotate() {
    // Keep the previous key so a failed persist can roll the in-memory key
    // back: without that, memory would hold a key no client knows and no file
    // holds — memory/disk divergence that invalidates every client silently.
    const previousKey = this.apiKey;
    this.apiKey = generateKey();
    try {
      await this.save();
    } catch (error) {
      this.apiKey = previousKey;
      throw error;
    }
    return this.apiKey;
  }

  async save() {
    await fsp.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryJson = this.filePath + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
    const shouldEncrypt = this.shouldEncrypt();

    if (shouldEncrypt) {
      const serialized = JSON.stringify({ version: 2, apiKey: this.apiKey }, null, 2);
      const payload = credentialCrypto.encryptCredential(serialized);
      await fsp.writeFile(temporaryJson, payload, { mode: 0o600 });
      // 直接原子替换，失败保留旧文件：rm+rename 之间 key 文件不存在，一旦
      // rename 失败（Windows AV/共享冲突）或进程在两个 await 之间崩溃，持久
      // 化的 key 就没了，下一次 resolve() 会静默铸造新 key，使所有已分发
      // API/MCP 客户端 key 失效。rename 在 POSIX 原子替换目标文件，Windows
      // 上映射为 MoveFileEx(REPLACE_EXISTING)。
      await fsp.rename(temporaryJson, this.filePath);
      // Clean up plaintext txt file to prevent credential leakage
      await fsp.rm(this.txtPath, { force: true }).catch(() => {});
    } else {
      await fsp.writeFile(temporaryJson, JSON.stringify({ version: 1, apiKey: this.apiKey }, null, 2), { mode: 0o600 });
      await fsp.rename(temporaryJson, this.filePath);

      try {
        const temporaryTxt = this.txtPath + '.tmp-' + process.pid + '-' + crypto.randomBytes(4).toString('hex');
        await fsp.writeFile(temporaryTxt, `${this.apiKey}\n`, { encoding: 'utf8', mode: 0o600 });
        // Same atomic-replace rationale as the json branch above.
        await fsp.rename(temporaryTxt, this.txtPath);
      } catch (_) {}
    }
  }
}

module.exports = { ApiKeyStore, KEY_FILE, TXT_FILE };
