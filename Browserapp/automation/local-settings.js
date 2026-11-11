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

const fsp = require('fs/promises');
const path = require('path');
const cloudSync = require('./cloud-sync');
const credentialCrypto = require('../credential-crypto');
const { createCoalescedWriter } = require('./coalesced-writer');
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
  };
}

let localSettingsCache = null;
let settingsRevision = 0;
let settingsLoad = null;
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
  const pending = readLocalSettings(settingsRevision);
  settingsLoad = pending;
  try { return await pending; }
  finally { if (settingsLoad === pending) settingsLoad = null; }
}

async function readLocalSettings(revision) {
  // Disk must include edits already queued before a reload. A later edit is
  // guarded by the revision check below, including on the error/reset path.
  await flushSettingsWriter();
  try {
    const raw = await fsp.readFile(settingsFile);
    let jsonStr;
    let needsMigration = false;
    if (credentialCrypto.isEncrypted(raw)) {
      jsonStr = credentialCrypto.decryptCredential(raw);
    } else {
      jsonStr = raw.toString('utf8');
      needsMigration = true;
    }
    const saved = JSON.parse(jsonStr);
    if (settingsRevision !== revision) return getLocalSettings();
    localSettingsCache = {
      profileDataRoot: normalizeProfileDataRoot(saved.profileDataRoot),
      cloud: { ...cloudSync.defaultCloudConfig(), ...(saved.cloud || {}) },
      uiGroups: Array.isArray(saved.uiGroups) ? saved.uiGroups : [],
      closeAction: normalizeCloseAction(saved.closeAction),
      memoryLimit: clampMemoryLimit(saved.memoryLimit),
      diskLimit: clampDiskLimit(saved.diskLimit),
    };
    if (needsMigration) {
      persistedSettingsSnapshot = null;
      try {
        await localSettingsWriter.request();
      } catch (migrateError) {
        console.warn('OpenBrowser settings encryption migration warning:', migrateError.message);
      }
    } else persistedSettingsSnapshot = JSON.parse(JSON.stringify(localSettingsCache));
    return localSettingsCache;
  } catch (error) {
    if (settingsRevision !== revision) return getLocalSettings();
    // A torn settings file used to be silently reset to factory defaults and
    // then overwritten by the next write. Keep the corrupt copy aside so it
    // can still be recovered by hand; booting on defaults is unchanged.
    if (error.code !== 'ENOENT') {
      await serializeSettingsFile(async () => {
        if (settingsRevision !== revision) return;
        persistedSettingsSnapshot = null;
        try {
          const aside = `${settingsFile}.corrupt-${Date.now()}`;
          await fsp.rename(settingsFile, aside);
          console.warn(`OpenBrowser: local settings corrupt (${error.message}); original kept at ${aside}`);
        } catch (_) {}
      });
    }
    if (settingsRevision !== revision) return getLocalSettings();
    persistedSettingsSnapshot = null;
    localSettingsCache = defaultCache();
    return localSettingsCache;
  }
}

// Snapshot of what the file currently holds, so an unchanged cache does not
// rewrite it. Cloned rather than referenced: later edits mutate nested objects.
let persistedSettingsSnapshot = null;

/** Write the settings file from the in-memory cache. */
async function writeLocalSettingsFile() {
  ensureInitialized();
  return serializeSettingsFile(async () => {
    // Capture exactly the state being written. Edits can replace the live cache
    // while filesystem operations yield; marking that newer cache as persisted
    // would make the next coalesced run skip an edit that never reached disk.
    const snapshot = JSON.parse(JSON.stringify(localSettingsCache));
    await fsp.mkdir(path.dirname(settingsFile), { recursive: true });
    const temporary = settingsFile + '.tmp';
    const serialized = JSON.stringify({ version: 2, ...snapshot }, null, 2);
    const payload = credentialCrypto.encryptCredential(serialized);

    // Preserve backup of existing file before atomic rewrite. Only encrypted
    // content may land in the .bak: a legacy plaintext file must not gain a
    // long-lived plaintext twin. All artifacts stay owner-only (0600).
    try {
      const existing = await fsp.readFile(settingsFile);
      if (credentialCrypto.isEncrypted(existing)) {
        await fsp.writeFile(settingsFile + '.bak', existing, { mode: 0o600 });
      }
    } catch (_) {}

    await fsp.writeFile(temporary, payload, { mode: 0o600 });
    await fsp.rename(temporary, settingsFile);
    persistedSettingsSnapshot = snapshot;
  });
}

// The cache holds the whole settings object, so a burst of changes only needs
// the last one on disk. Going through one writer also stops concurrent callers
// from racing on the same temporary file.
const localSettingsWriter = createCoalescedWriter({
  keepAlive: true,
  write: writeLocalSettingsFile,
  // Saving the same settings twice is common (panel switches, repeated toggles)
  // and the disk already holds that state, so skip the write entirely.
  shouldWrite: () => persistedSettingsSnapshot === null
    || !deepEqual(localSettingsCache, persistedSettingsSnapshot),
  onError: (error) => console.warn('OpenBrowser settings write failed:', error.message),
});

async function saveLocalSettings(value) {
  ensureInitialized();
  localSettingsCache = {
    profileDataRoot: normalizeProfileDataRoot(value.profileDataRoot || localSettingsCache.profileDataRoot),
    cloud: value.cloud || localSettingsCache.cloud || cloudSync.defaultCloudConfig(),
    uiGroups: Array.isArray(value.uiGroups) ? value.uiGroups : (localSettingsCache.uiGroups || []),
    closeAction: normalizeCloseAction(value.closeAction || localSettingsCache.closeAction),
    memoryLimit: clampMemoryLimit(value.memoryLimit !== undefined ? value.memoryLimit : localSettingsCache.memoryLimit),
    diskLimit: clampDiskLimit(value.diskLimit !== undefined ? value.diskLimit : localSettingsCache.diskLimit),
  };
  settingsRevision += 1;
  return localSettingsWriter.request();
}

/** Flush a pending quiet-period write; called from the quit chain. */
async function flushSettingsWriter() {
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
