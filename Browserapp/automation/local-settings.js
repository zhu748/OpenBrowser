'use strict';

/**
 * Local settings store, extracted from main.js.
 *
 * Owns the settings cache, the encrypted on-disk file (atomic rewrite with a
 * 0600 plaintext-safe .bak), and the coalescing writer. The file path and the
 * default profile root derive from Electron's userData and are injected once
 * by main.js via initLocalSettings(); everything else is plain Node so
 * selftests can exercise the store directly.
 */

const { randomUUID } = require('node:crypto');
const fsp = require('fs/promises');
const path = require('path');
const cloudSync = require('./cloud-sync');
const credentialCrypto = require('../credential-crypto');
const { createCoalescedWriter } = require('./coalesced-writer');
const { normalizeDefaultPreferences } = require('../shared/default-preferences');
const { deepEqual } = require('./object-utils');
const { validateDataRootIsolationSecure } = require('./isolation');

let settingsFile = null;
let defaultRoot = null;

function ensureInitialized() {
  if (!settingsFile || !defaultRoot) {
    throw new Error('local-settings is not initialized (call initLocalSettings from the Electron main process first)');
  }
}

function initLocalSettings({ file, defaultProfileDataRoot }) {
  settingsFile = file;
  defaultRoot = defaultProfileDataRoot;
}

function normalizeProfileDataRoot(value) {
  ensureInitialized();
  const raw = String(value || '').trim();
  const candidate = path.resolve(raw || defaultRoot);
  const check = validateDataRootIsolationSecure(candidate);
  if (!check.ok) throw new Error(check.message);
  return check.root;
}

const CLOSE_ACTION_VALUES = ['ask', 'tray', 'exit'];
function normalizeCloseAction(value) {
  return CLOSE_ACTION_VALUES.includes(value) ? value : 'ask';
}

// Roxy 客户端设置默认值（main.mjs 设置对象）：内存使用率上限 95%、磁盘可用空间下限 8GB。
function clampMemoryLimit(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 95;
  return Math.min(100, Math.max(1, n));
}
function clampDiskLimit(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 8;
  return Math.min(1024, Math.max(0, n));
}

function defaultCache() {
  return {
    profileDataRoot: defaultRoot,
    cloud: cloudSync.defaultCloudConfig(),
    uiGroups: [],
    closeAction: 'ask',
    memoryLimit: 95,
    diskLimit: 8,
    defaultPreferences: normalizeDefaultPreferences(),
  };
}

let localSettingsCache = null;
let settingsLoad = null;
let settingsLoadFailure = null;
let settingsLoaded = false;
let settingsFileQueue = Promise.resolve();

function serializeSettingsFile(operation) {
  const pending = settingsFileQueue.then(operation, operation);
  settingsFileQueue = pending.catch(() => {});
  return pending;
}

/** The live settings object (same reference semantics the main process had). */
function getLocalSettings() {
  if (!localSettingsCache) localSettingsCache = defaultCache();
  return localSettingsCache;
}

async function loadLocalSettings() {
  ensureInitialized();
  if (settingsLoad) return settingsLoad;
  const pending = readLocalSettings();
  settingsLoad = pending;
  try { return await pending; }
  finally { if (settingsLoad === pending) settingsLoad = null; }
}

function settingsError(code, message, cause) {
  return Object.assign(new Error(message, { cause }), { code });
}

function decryptSettingsEnvelope(raw) {
  try { return credentialCrypto.decryptCredential(raw); }
  catch (error) {
    // A wrong key or unavailable keyring is indistinguishable from damaged
    // ciphertext here. Do not rename, fall back, or write either copy.
    throw settingsError('LOCAL_SETTINGS_DECRYPT_FAILED', 'Could not decrypt local settings. Settings were preserved; check the encryption key before retrying.', error);
  }
}

async function requireNoBackup() {
  try {
    // A backup is a recovery candidate, not proof that its older values are
    // appropriate now. Never replace it or restore it implicitly.
    await fsp.lstat(settingsFile + '.bak');
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw settingsError(error.code || 'LOCAL_SETTINGS_READ_FAILED', 'Could not inspect the local settings backup. Settings were not changed.', error);
  }
  throw settingsError('LOCAL_SETTINGS_RECOVERY_REQUIRED', 'A local settings backup was preserved. Check and restore the appropriate settings before continuing.');
}

async function readSettingsDocument() {
  let raw;
  try {
    raw = await fsp.readFile(settingsFile);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw settingsError(error.code || 'LOCAL_SETTINGS_READ_FAILED', 'Could not read local settings. Settings were not changed.', error);
    }
    await requireNoBackup();
    return {};
  }

  const encrypted = credentialCrypto.isEncrypted(raw);
  const json = encrypted ? decryptSettingsEnvelope(raw) : raw.toString('utf8');
  let saved;
  try { saved = JSON.parse(json); }
  catch (_) { /* Only decoded JSON syntax or shape reaches quarantine. */ }
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    return { saved, needsMigration: !encrypted };
  }
  await serializeSettingsFile(async () => {
    try { await fsp.rename(settingsFile, `${settingsFile}.corrupt-${Date.now()}-${randomUUID()}`); }
    catch (error) {
      throw settingsError(error.code || 'LOCAL_SETTINGS_QUARANTINE_FAILED',
        'Could not preserve the malformed local settings file. Settings were not changed.', error);
    }
    console.warn('OpenBrowser: malformed local settings were preserved for recovery.');
  });
  await requireNoBackup();
  return {};
}

function normalizedSettings(saved) {
  // A saved directory can become unusable without changing the settings
  // bytes. Report validation errors rather than quarantining the file and
  // silently switching to another data directory.
  if (!saved) return defaultCache();
  return {
    profileDataRoot: normalizeProfileDataRoot(saved.profileDataRoot),
    cloud: { ...cloudSync.defaultCloudConfig(), ...(saved.cloud || {}) },
    uiGroups: Array.isArray(saved.uiGroups) ? saved.uiGroups : [],
    closeAction: normalizeCloseAction(saved.closeAction),
    memoryLimit: clampMemoryLimit(saved.memoryLimit),
    diskLimit: clampDiskLimit(saved.diskLimit),
    defaultPreferences: normalizeDefaultPreferences(saved.defaultPreferences),
  };
}

async function readLocalSettings() {
  // Finish writes accepted before this load. New edits wait for validation so
  // a failed read cannot queue a rewrite from an older or default cache.
  const blocked = settingsLoadFailure;
  if (!blocked) await drainSettingsWriter();
  else {
    // Refuse acknowledgements admitted during the failed physical write,
    // before a successful retry can change the cache they would acknowledge.
    await localSettingsWriter.flushNow().catch(error => {
      if (error !== blocked) throw error;
    });
  }
  await settingsFileQueue;
  let saved, needsMigration, normalized;
  try {
    ({ saved, needsMigration } = await readSettingsDocument());
    normalized = normalizedSettings(saved);
  } catch (error) {
    settingsLoadFailure = error;
    throw error;
  }
  settingsLoadFailure = null;
  settingsLoaded = true;
  localSettingsCache = normalized;
  persistedSettingsSnapshot = (saved || blocked) && !needsMigration ? structuredClone(normalized) : null;
  if (blocked && !saved) {
    // Consume any refused retry marker without auto-writing fresh defaults.
    await drainSettingsWriter();
    persistedSettingsSnapshot = null;
  }
  if (needsMigration) {
    try {
      await localSettingsWriter.request();
    } catch (migrateError) {
      console.warn('OpenBrowser settings encryption migration warning:', migrateError.message);
    }
  }
  return localSettingsCache;
}

// Snapshot of what the file currently holds, so an unchanged cache does not
// rewrite it. Cloned rather than referenced: later edits mutate nested objects.
let persistedSettingsSnapshot = null;

/** Write the settings file from the in-memory cache. */
async function writeLoadedSettingsFile() {
  ensureInitialized();
  return serializeSettingsFile(async () => {
    if (settingsLoadFailure) throw settingsLoadFailure;
    // Capture exactly the state being written. Edits can replace the live cache
    // while filesystem operations yield; marking that newer cache as persisted
    // would make the next coalesced run skip an edit that never reached disk.
    const snapshot = JSON.parse(JSON.stringify(localSettingsCache));
    await fsp.mkdir(path.dirname(settingsFile), { recursive: true });
    let existing;
    try { existing = await fsp.readFile(settingsFile); }
    catch (error) {
      if (error.code !== 'ENOENT') {
        throw settingsError(error.code || 'LOCAL_SETTINGS_READ_FAILED', 'Could not read local settings before saving. Settings were not changed.', error);
      }
    }
    const encrypted = credentialCrypto.isEncrypted(existing);
    // A write admitted before a reload may drain first. Authenticate the
    // current envelope under the available key before backing it up or
    // replacing it. JSON parsing remains the reader's responsibility.
    if (encrypted) {
      try { decryptSettingsEnvelope(existing); }
      catch (error) {
        settingsLoadFailure = error;
        throw error;
      }
    }
    const temporary = settingsFile + '.tmp';
    const serialized = JSON.stringify({ version: 2, ...snapshot }, null, 2);
    const payload = credentialCrypto.encryptCredential(serialized);

    // Preserve backup of existing file before atomic rewrite. Only encrypted
    // content may land in the .bak: a legacy plaintext file must not gain a
    // long-lived plaintext twin. All artifacts stay owner-only (0600).
    if (encrypted) {
      try { await fsp.writeFile(settingsFile + '.bak', existing, { mode: 0o600 }); }
      catch (_) {}
    }

    try {
      await fsp.writeFile(temporary, payload, { mode: 0o600 });
      await fsp.rename(temporary, settingsFile);
    } catch (error) {
      // Cleanup stays inside the serialized writer so it cannot remove the
      // next attempt's staging file. Report the original write failure.
      try { await fsp.unlink(temporary); } catch (_) {}
      throw error;
    }
    persistedSettingsSnapshot = snapshot;
  });
}

// The cache holds the whole settings object, so a burst of changes only needs
// the last one on disk. Going through one writer also stops concurrent callers
// from racing on the same temporary file.
const localSettingsWriter = createCoalescedWriter({
  keepAlive: true,
  write: writeLoadedSettingsFile,
  // Saving the same settings twice is common (panel switches, repeated toggles)
  // and the disk already holds that state, so skip the write entirely.
  shouldWrite: () => Boolean(settingsLoadFailure) || persistedSettingsSnapshot === null
    || !deepEqual(localSettingsCache, persistedSettingsSnapshot),
  onError: (error) => {
    if (error !== settingsLoadFailure) console.warn('OpenBrowser settings write failed:', error.message);
  },
});

function pendingSettingsRead() {
  if (settingsLoad) return settingsLoad;
  if (settingsLoadFailure) throw settingsLoadFailure;
  return settingsLoaded ? null : loadLocalSettings();
}

async function writeLocalSettingsFile() {
  ensureInitialized();
  for (let pending; (pending = pendingSettingsRead());) await pending;
  return writeLoadedSettingsFile();
}

async function saveLocalSettings(value) {
  ensureInitialized();
  for (let pending; (pending = pendingSettingsRead());) await pending;
  localSettingsCache = structuredClone({
    profileDataRoot: normalizeProfileDataRoot(value.profileDataRoot || localSettingsCache.profileDataRoot),
    cloud: value.cloud || localSettingsCache.cloud || cloudSync.defaultCloudConfig(),
    uiGroups: Array.isArray(value.uiGroups) ? value.uiGroups : (localSettingsCache.uiGroups || []),
    closeAction: normalizeCloseAction(value.closeAction || localSettingsCache.closeAction),
    memoryLimit: clampMemoryLimit(value.memoryLimit !== undefined ? value.memoryLimit : localSettingsCache.memoryLimit),
    diskLimit: clampDiskLimit(value.diskLimit !== undefined ? value.diskLimit : localSettingsCache.diskLimit),
    defaultPreferences: normalizeDefaultPreferences(value.defaultPreferences, localSettingsCache.defaultPreferences),
  });
  await localSettingsWriter.request();
  // A newer cache value may still be waiting for its own write. Acknowledge
  // only a snapshot which has passed the disk barrier.
  return structuredClone(persistedSettingsSnapshot);
}

/** Flush a pending quiet-period write; called from the quit chain. */
async function flushSettingsWriter() {
  while (settingsLoad) await settingsLoad;
  if (settingsLoadFailure) throw settingsLoadFailure;
  await drainSettingsWriter();
}

async function drainSettingsWriter() {
  await localSettingsWriter.flushNow();
  await localSettingsWriter.idle();
}

module.exports = {
  initLocalSettings,
  getLocalSettings,
  loadLocalSettings,
  saveLocalSettings,
  writeLocalSettingsFile,
  normalizeProfileDataRoot,
  normalizeCloseAction,
  clampMemoryLimit,
  clampDiskLimit,
  flushSettingsWriter,
};
