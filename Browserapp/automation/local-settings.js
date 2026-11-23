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
const { DEFAULT_PREFERENCES, normalizeDefaultPreferences } = require('../shared/default-preferences');
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
let committedCloseAction = 'ask';
let closeActionGeneration = 0;
let exitEffectPending = false;
const clientPreferenceSlots = ['memoryLimit', 'diskLimit', ...Object.keys(DEFAULT_PREFERENCES)];
const preferenceGenerations = new Map();
const isDefaultPreference = field => Object.hasOwn(DEFAULT_PREFERENCES, field);
const preferenceValue = (settings, field) => isDefaultPreference(field) ? settings.defaultPreferences?.[field] : settings[field];
const hasPreference = (patch, field) => Object.hasOwn(isDefaultPreference(field) ? (patch.defaultPreferences || {}) : patch, field);

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

function parseSettingsObject(json) {
  try {
    const saved = JSON.parse(json);
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : null;
  } catch (_) { return null; }
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
  const saved = parseSettingsObject(encrypted ? decryptSettingsEnvelope(raw) : raw.toString('utf8'));
  if (saved) return { saved, needsMigration: !encrypted };
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
  committedCloseAction = normalized.closeAction;
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
    // Capture exactly the state being written. Edits can replace the live cache
    // while filesystem operations yield; marking that newer cache as persisted
    // would make the next coalesced run skip an edit that never reached disk.
    const snapshot = JSON.parse(JSON.stringify({ ...localSettingsCache, closeAction: committedCloseAction }));
    await persistSettingsSnapshot(snapshot);
  });
}

async function writeSyncedStage(temporary, payload) {
  const handle = await fsp.open(temporary, 'wx', 0o600);
  try {
    try {
      await handle.writeFile(payload);
      await handle.sync();
    } finally { await handle.close(); }
  } catch (error) {
    await fsp.unlink(temporary).catch(() => {});
    throw error;
  }
}

async function refreshSettingsBackup(existing) {
  let temporary;
  let staged = false;
  try {
    const backup = settingsFile + '.bak';
    temporary = backup + '.tmp-' + randomUUID();
    await writeSyncedStage(temporary, existing);
    staged = true;
    await fsp.rename(temporary, backup);
  } catch (_) {
    if (staged) await fsp.unlink(temporary).catch(() => {});
    // The primary has already committed. Never turn a backup-side fault
    // into a rejected save or expose the original filesystem error/path.
    try { console.warn('OpenBrowser: settings were saved, but the recovery copy could not be refreshed. Any previous backup was left in place.'); }
    catch (_) {}
  }
}

async function persistSettingsSnapshot(snapshot, commit) {
  if (settingsLoadFailure) throw settingsLoadFailure;
  const directory = path.dirname(settingsFile);
  await fsp.mkdir(directory, { recursive: true });
  let existing;
  try { existing = await fsp.readFile(settingsFile); }
  catch (error) {
    if (error.code !== 'ENOENT') {
      throw settingsError(error.code || 'LOCAL_SETTINGS_READ_FAILED', 'Could not read local settings before saving. Settings were not changed.', error);
    }
    try { await requireNoBackup(); }
    catch (backupError) {
      if (backupError.code === 'LOCAL_SETTINGS_RECOVERY_REQUIRED') settingsLoadFailure = backupError;
      throw backupError;
    }
  }
  const encrypted = existing !== undefined && credentialCrypto.isEncrypted(existing);
  // A queued save can drain before an explicit reload. Validate the same
  // bytes we might back up: authentication alone doesn't prove that the
  // previous primary is a settings object or useful for recovery.
  if (existing !== undefined) {
    try {
      const decoded = encrypted ? decryptSettingsEnvelope(existing) : existing.toString('utf8');
      if (!parseSettingsObject(decoded)) {
        throw settingsError('LOCAL_SETTINGS_INVALID', 'Local settings are malformed. Both settings and backup were left in place; check recovery before retrying.');
      }
    } catch (error) {
      settingsLoadFailure = error;
      throw error;
    }
  }
  const temporary = settingsFile + (commit ? `.tmp-${commit.stageName}-${randomUUID()}` : '.tmp');
  const serialized = JSON.stringify({ version: 2, ...snapshot }, null, 2);
  const payload = credentialCrypto.encryptCredential(serialized);

  let staged = false;
  try {
    if (commit) {
      await writeSyncedStage(temporary, payload);
      staged = true;
      if (commit.verifyBeforeReplace) await commit.verifyBeforeReplace();
      // Shutdown and reservation/path checks are synchronous at the rename
      // boundary, after the final potentially slow recovery probe.
      commit.beforeReplace?.();
    } else await fsp.writeFile(temporary, payload, { mode: 0o600 });
    await fsp.rename(temporary, settingsFile);
  } catch (error) {
    // A refused staged preference was never in the ordinary cache or retry
    // queue. The exclusive staging file may be removed without touching .bak.
    if (!commit || staged) await fsp.unlink(temporary).catch(() => {});
    throw error;
  }

  persistedSettingsSnapshot = snapshot;
  commit?.publish?.();
  // Only an encrypted, structurally usable prior primary is eligible.
  // Leave the older known-good .bak untouched until the new primary commits.
  if (encrypted) await refreshSettingsBackup(existing);
  if (!commit) return;
  try {
    const handle = await fsp.open(directory, 'r');
    try { await handle.sync(); } finally { await handle.close(); }
  } catch (_) { /* Directory fsync is not available on all target filesystems. */ }
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

async function commitProfileDataRoot(value, rootChange = {}) {
  ensureInitialized();
  for (let pending; (pending = pendingSettingsRead());) await pending;
  const root = normalizeProfileDataRoot(value);
  return serializeSettingsFile(async () => {
    const snapshot = structuredClone({ ...localSettingsCache, profileDataRoot: root, closeAction: committedCloseAction });
    await persistSettingsSnapshot(snapshot, {
      ...rootChange, stageName: 'root',
      publish() {
        // Merge only the committed root; other approved settings can have
        // changed in the cache while this transaction was staging.
        localSettingsCache = { ...localSettingsCache, profileDataRoot: root, closeAction: committedCloseAction };
        rootChange.publish?.();
      },
    });
    return root;
  });
}

function getCloseActionGeneration() { return closeActionGeneration; }

/** Commit close behavior (and any accompanying validated client patch) once. */
async function commitCloseSettings(value, { expectedGeneration, isQuitting = () => false, isOwner = () => true, onExit } = {}) {
  ensureInitialized();
  const patch = structuredClone(value);
  const mode = patch?.closeAction;
  if (!CLOSE_ACTION_VALUES.includes(mode)) throw settingsError('CLIENT_SETTINGS_INVALID', '无效的客户端设置：关闭窗口行为。');
  const superseded = () => settingsError('CLOSE_SETTINGS_SUPERSEDED', '设置已被更新的操作替代，未保存这次更改。');
  const assertActive = () => {
    if (isQuitting()) throw settingsError('APP_SHUTTING_DOWN', '应用正在退出，无法保存设置。');
    if (!isOwner()) throw superseded();
  };
  assertActive();
  if (expectedGeneration !== undefined && (expectedGeneration !== closeActionGeneration || committedCloseAction !== 'ask')) throw superseded();
  // Even a same-value explicit choice revokes an earlier dialog's authority.
  const generation = ++closeActionGeneration;
  const fields = clientPreferenceSlots.filter(field => hasPreference(patch, field));
  const versions = fields.map(field => preferenceGenerations.get(field));
  const isUnchanged = (field, i) => preferenceGenerations.get(field) === versions[i];
  const assertCurrent = () => {
    assertActive();
    if (generation !== closeActionGeneration || !fields.every(isUnchanged)) throw superseded();
  };
  const applyExitEffect = () => {
    // Nothing after a successful replacement is allowed to misreport it as
    // rejected. In particular, a superseded receipt must not touch the tray.
    try {
      if (!exitEffectPending || !onExit || mode !== 'exit' || generation !== closeActionGeneration || isQuitting() || !isOwner()) return;
      exitEffectPending = false;
      onExit();
    } catch (_) { /* The preference has already been saved. */ }
  };
  for (let pending; (pending = pendingSettingsRead());) await pending;
  return serializeSettingsFile(async () => {
    assertCurrent();
    const snapshot = structuredClone({ ...localSettingsCache, closeAction: mode });
    if (Object.hasOwn(patch, 'memoryLimit')) snapshot.memoryLimit = clampMemoryLimit(patch.memoryLimit);
    if (Object.hasOwn(patch, 'diskLimit')) snapshot.diskLimit = clampDiskLimit(patch.diskLimit);
    if (Object.hasOwn(patch, 'defaultPreferences')) snapshot.defaultPreferences = normalizeDefaultPreferences(patch.defaultPreferences, snapshot.defaultPreferences);
    if (persistedSettingsSnapshot?.closeAction === mode
      && fields.every(field => preferenceValue(persistedSettingsSnapshot, field) === preferenceValue(snapshot, field)
        && preferenceValue(localSettingsCache, field) === preferenceValue(snapshot, field))) {
      applyExitEffect();
      return structuredClone(persistedSettingsSnapshot);
    }
    await persistSettingsSnapshot(snapshot, {
      stageName: 'close', beforeReplace: assertCurrent,
      publish() {
        if (committedCloseAction !== mode) exitEffectPending = mode === 'exit';
        committedCloseAction = mode;
        const next = { ...localSettingsCache, closeAction: mode, defaultPreferences: { ...localSettingsCache.defaultPreferences } };
        // A newer ordinary preference may have arrived after rename was
        // dispatched. Retain its live value for the next ordinary write.
        fields.forEach((field, index) => {
          if (!isUnchanged(field, index)) return;
          const target = isDefaultPreference(field) ? next.defaultPreferences : next;
          target[field] = preferenceValue(snapshot, field);
        });
        localSettingsCache = next;
        applyExitEffect();
      },
    });
    return structuredClone(snapshot);
  });
}

async function saveLocalSettings(value, { clientIntent = false } = {}) {
  ensureInitialized();
  for (let pending; (pending = pendingSettingsRead());) await pending;
  const next = structuredClone({
    profileDataRoot: localSettingsCache.profileDataRoot,
    cloud: value.cloud || localSettingsCache.cloud || cloudSync.defaultCloudConfig(),
    uiGroups: Array.isArray(value.uiGroups) ? value.uiGroups : (localSettingsCache.uiGroups || []),
    // Whole-store callers carry stale copies; only commitCloseSettings owns
    // this field, and a failed close change was never in this cache.
    closeAction: committedCloseAction,
    memoryLimit: clampMemoryLimit(value.memoryLimit !== undefined ? value.memoryLimit : localSettingsCache.memoryLimit),
    diskLimit: clampDiskLimit(value.diskLimit !== undefined ? value.diskLimit : localSettingsCache.diskLimit),
    defaultPreferences: normalizeDefaultPreferences(value.defaultPreferences, localSettingsCache.defaultPreferences),
  });
  for (const field of clientPreferenceSlots) {
    if (preferenceValue(localSettingsCache, field) !== preferenceValue(next, field) || (clientIntent && hasPreference(value, field))) {
      preferenceGenerations.set(field, (preferenceGenerations.get(field) || 0) + 1);
    }
  }
  localSettingsCache = next;
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
  await settingsFileQueue;
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
  commitCloseSettings,
  getCloseActionGeneration,
  commitProfileDataRoot,
  writeLocalSettingsFile,
  normalizeProfileDataRoot,
  normalizeCloseAction,
  clampMemoryLimit,
  clampDiskLimit,
  flushSettingsWriter,
};
