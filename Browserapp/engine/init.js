'use strict';

/**
 * init mixin for BrowserEngine (prototype-assigned by engine.js).
 * Extracted verbatim from engine.js during the decomposition; see the class
 * body in engine.js for the remaining methods and engine/start.js for the
 * startup routine that drives these.
 */

const { KERNEL_POLICY_VERSION, EngineStateUnavailableError,
  inspectSQLiteDatabase, loadEngineStartupState, preserveCorruptEngineState } = require('./index');
const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual } = require('node:util');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');
const { recoverProfileDeletions } = require('./profile-deletion');

// Storage is authoritative: UI pagination must never truncate the state that
// the next save will persist. Both backends already decode the full snapshot.
const snapshotProfileIds = saved => new Set((saved.profiles || []).map(profile => profile?.id));

function prepareLegacyProfiles(engine, state, collect = false) {
  const prepared = collect ? [] : null;
  const ids = new Set();
  const source = state.recovered ? 'committed engine backup' : 'primary engine state';
  for (const [index, raw] of (state.saved.profiles || []).entries()) {
    let profile;
    try {
      profile = engine.sanitizeProfile(raw);
    } catch (_) {
      // Never make a partial legacy snapshot authoritative or disclose raw
      // profile fields in a startup message. Do not try an older snapshot.
      throw new EngineStateUnavailableError(new Error(`Invalid profile record at row ${index + 1}`), source);
    }
    // Both stores key profiles by ID. Repeated IDs would silently discard a
    // row in JSON, including after a failed migration falls back to JSON.
    if (ids.has(profile.id)) {
      throw new EngineStateUnavailableError(new Error(`Duplicate profile ID at row ${index + 1}`), source);
    }
    ids.add(profile.id);
    prepared?.push(profile);
  }
  return prepared;
}

module.exports = {
  async init(bundledExtensionPath) {
    await this.kernelManager.loadMeta();
    let migrateKernelPolicy = false;
    let recoveredState = false;
    let extensionsChanged = false;
    let storedIds;
    const existingDatabase = Boolean(inspectSQLiteDatabase(this.dbFile));

    const storageUnavailable = (cause) => Object.assign(new Error(
      'Existing SQLite storage is unavailable; data was preserved. Repair or restore the database before continuing.',
      { cause }
    ), { code: 'STORAGE_UNAVAILABLE', dbPath: this.dbFile });
    if (existingDatabase && !ProfileStoreSqlite.isSupported()) throw storageUnavailable();

    if (ProfileStoreSqlite.isSupported()) {
      const sqlite = new ProfileStoreSqlite({
        dbPath: this.dbFile, legacyJsonPath: this.stateFile, wal: true, backupOldJson: true,
      });
      try {
        const initRes = await sqlite.init({
          validateLegacySnapshot: state => prepareLegacyProfiles(this, state),
          // Refuse ambiguous deletion journals before backup data can become
          // the durable database consulted on any subsequent startup.
          beforeBackupMigration: saved => recoverProfileDeletions(this, {
            recoveredState: true, storedIds: snapshotProfileIds(saved), validateOnly: true,
          }),
        });
        this.sqliteStore = sqlite;
        this.usingSqlite = true;
        recoveredState = Boolean(initRes.recovered);
        if (initRes.migrated) {
          this.emit({ type: 'storage-migrated', engine: 'sqlite' });
        }
      } catch (err) {
        sqlite.close();
        if (err instanceof EngineStateUnavailableError) throw err;
        if (existingDatabase || fs.existsSync(this.dbFile)) throw storageUnavailable(err);
        console.warn(`[BrowserEngine] SQLite initialization failed, falling back to legacy JSON: ${err.message}`);
        this.sqliteStore = null;
        this.usingSqlite = false;
      }
    }

    if (this.usingSqlite && this.sqliteStore) {
      const extensions = this.sqliteStore.listExtensions();
      // Extension directories are independent; refresh them concurrently
      // instead of serializing manifest/locale/hash reads at every startup.
      await Promise.all(extensions.map(async (extension) => {
        if (!fs.existsSync(extension.path)) {
          extensionsChanged = true;
          return;
        }
        try {
          const refreshed = await this.readExtension(extension.path, Boolean(extension.builtIn));
          refreshed.addedAt = extension.addedAt || refreshed.addedAt;
          if (!isDeepStrictEqual(refreshed, extension)) extensionsChanged = true;
          this.extensions.set(refreshed.id, refreshed);
        } catch (_) {
          this.extensions.set(extension.id, extension);
        }
      }));
      const assignments = this.sqliteStore.getAssignments();
      for (const [profileId, ids] of assignments.entries()) {
        this.assignments.set(profileId, ids);
      }
      // IPC remains behind the startup barrier while storage yields between batches.
      const loadedProfiles = await this.sqliteStore.loadStartupProfiles(
        profile => this.sanitizeProfile(profile),
        profile => this.profiles.set(profile.id, profile),
      );
      if (typeof this.profiles.contentHash === 'function') {
        this.profiles.acknowledgeWrites(this.profiles.pendingWrites().filter(([id]) =>
          this.sqliteStore.hasPersistedProfileHash(id, this.profiles.contentHash(id))));
        this._profilePersistenceStore = this.sqliteStore;
      }
      this.profileStartupFailures = this.sqliteStore.countProfileRows() - loadedProfiles;
      const meta = this.sqliteStore.getAllMeta();
      if (typeof meta.preferIndependentKernel === 'boolean') {
        this.preferIndependentKernel = meta.preferIndependentKernel;
      }
      if (meta.kernelPolicyVersion !== KERNEL_POLICY_VERSION) {
        this.allowSystemBrowserFallback = false;
        this.systemBrowserPath = null;
        migrateKernelPolicy = true;
      } else if (typeof meta.allowSystemBrowserFallback === 'boolean') {
        this.allowSystemBrowserFallback = meta.allowSystemBrowserFallback;
        if (typeof meta.systemBrowserPath === 'string') {
          this.systemBrowserPath = meta.systemBrowserPath;
        }
      }
    } else {
      const state = await loadEngineStartupState(this.stateFile);
      if (state) {
        // Validate every row before archiving files or publishing even one row.
        const profiles = prepareLegacyProfiles(this, state, true);
        const saved = state.saved;
        storedIds = snapshotProfileIds(saved);
        recoveredState = state.recovered;
        if (state.corruptPrimary) {
          await recoverProfileDeletions(this, { recoveredState, storedIds, validateOnly: true });
          await preserveCorruptEngineState(this.stateFile);
        }
        for (const extension of saved.extensions || []) {
          if (fs.existsSync(extension.path)) {
            try {
              const refreshed = await this.readExtension(extension.path, Boolean(extension.builtIn));
              refreshed.addedAt = extension.addedAt || refreshed.addedAt;
              this.extensions.set(refreshed.id, refreshed);
            } catch (_) {
              this.extensions.set(extension.id, extension);
            }
          }
        }
        for (const [profileId, ids] of Object.entries(saved.assignments || {})) this.assignments.set(profileId, new Set(ids));
        // Profiles (incl. cookies / proxy auth / platform secrets) live in main-process state,
        // not renderer localStorage, so XSS cannot dump them from the UI store.
        for (const profile of profiles) this.profiles.set(profile.id, profile);
        if (typeof saved.preferIndependentKernel === 'boolean') this.preferIndependentKernel = saved.preferIndependentKernel;
        if (saved.kernelPolicyVersion !== KERNEL_POLICY_VERSION) {
          // Prior releases could select a system browser implicitly. Migrate to
          // the explicit-selection policy and keep fallback disabled by default.
          this.allowSystemBrowserFallback = false;
          this.systemBrowserPath = null;
          migrateKernelPolicy = true;
        } else if (typeof saved.allowSystemBrowserFallback === 'boolean') {
          this.allowSystemBrowserFallback = saved.allowSystemBrowserFallback;
          if (typeof saved.systemBrowserPath === 'string') this.systemBrowserPath = saved.systemBrowserPath;
        }
      }
    }
    await recoverProfileDeletions(this, { recoveredState, storedIds });
    if (bundledExtensionPath && fs.existsSync(path.join(bundledExtensionPath, 'manifest.json'))) {
      const builtIn = await this.readExtension(bundledExtensionPath, true);
      const previous = this.extensions.get(builtIn.id);
      if (previous?.addedAt) builtIn.addedAt = previous.addedAt;
      const obsoleteBuiltInIds = [...this.extensions.values()]
        .filter((extension) => extension.builtIn && path.basename(extension.path) === 'bundled-extension' && extension.id !== builtIn.id)
        .map((extension) => extension.id);

      if (obsoleteBuiltInIds.length) {
        for (const assigned of this.assignments.values()) {
          const hadOldMarker = obsoleteBuiltInIds.some((id) => assigned.has(id));
          for (const id of obsoleteBuiltInIds) assigned.delete(id);
          if (hadOldMarker) assigned.add(builtIn.id);
        }
        for (const id of obsoleteBuiltInIds) this.extensions.delete(id);
      }
      this.extensions.set(builtIn.id, builtIn);
      extensionsChanged ||= obsoleteBuiltInIds.length > 0 || !isDeepStrictEqual(previous, builtIn);
    }
    this.storageRecovery = recoveredState;
    if (migrateKernelPolicy || extensionsChanged || (recoveredState && !this.usingSqlite)
        || (this.usingSqlite && this.profiles.pendingWrites?.().length)) await this._persistNow();
  },
};
