'use strict';

/**
 * init mixin for BrowserEngine (prototype-assigned by engine.js).
 * Extracted verbatim from engine.js during the decomposition; see the class
 * body in engine.js for the remaining methods and engine/start.js for the
 * startup routine that drives these.
 */

const { KERNEL_POLICY_VERSION, engineStateRecoveryCandidates, preserveCorruptEngineState, readEngineStateCandidate } = require('./index');
const fs = require('fs');
const path = require('path');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');

// Startup load cap. 1000 was low for RPA farms and truncated SILENTLY: the
// JSON archive then lost the tail on the next persist (persist writes only
// the loaded set). 5000 keeps startup bounded while covering real fleet
// sizes, and exceeding it is now warned, not invisible.
const LOAD_PROFILE_CAP = 5000;

module.exports = {
  async init(bundledExtensionPath) {
    await this.kernelManager.loadMeta();
    let migrateKernelPolicy = false;
    let recoveredState = false;

    if (ProfileStoreSqlite.isSupported()) {
      try {
        const sqlite = new ProfileStoreSqlite({
          dbPath: this.dbFile,
          legacyJsonPath: this.stateFile,
          wal: true,
          backupOldJson: true,
        });
        const initRes = await sqlite.init();
        this.sqliteStore = sqlite;
        this.usingSqlite = true;
        if (initRes.migrated) {
          this.emit({ type: 'storage-migrated', engine: 'sqlite' });
        }
      } catch (err) {
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
        if (!fs.existsSync(extension.path)) return;
        try {
          const refreshed = await this.readExtension(extension.path, Boolean(extension.builtIn));
          refreshed.addedAt = extension.addedAt || refreshed.addedAt;
          this.extensions.set(refreshed.id, refreshed);
        } catch (_) {
          this.extensions.set(extension.id, extension);
        }
      }));
      const assignments = this.sqliteStore.getAssignments();
      for (const [profileId, ids] of assignments.entries()) {
        this.assignments.set(profileId, ids);
      }
      const loadedProfiles = this.sqliteStore.getAllProfiles();
      for (const raw of loadedProfiles.slice(0, LOAD_PROFILE_CAP)) {
        try {
          const profile = this.sanitizeProfile(raw);
          this.profiles.set(profile.id, profile);
        } catch (_) {}
      }
      // 静默截断修正：超限必须有可见性；否则上千环境的用户有档案「凭空消失」
      // 却无任何线索（下一次 persist 只写回已加载集合，JSON 存档会被覆盖）。
      if (loadedProfiles.length > LOAD_PROFILE_CAP) {
        console.warn(`[BrowserEngine] ${loadedProfiles.length} profiles exceed the load cap; only the first ${LOAD_PROFILE_CAP} were loaded.`);
      }
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
      let state = null;
      let primaryStateError = null;
      try {
        state = await readEngineStateCandidate(this.stateFile);
      } catch (error) {
        primaryStateError = error;
      }
      if (!state) {
        const recovery = await engineStateRecoveryCandidates(this.stateFile);
        if (recovery.length) {
          state = recovery[0];
          recoveredState = true;
          if (primaryStateError && primaryStateError.code !== 'ENOENT') {
            await preserveCorruptEngineState(this.stateFile);
          }
        }
      }
      if (!state && primaryStateError && primaryStateError.code !== 'ENOENT') {
        throw new Error(`引擎状态文件损坏且没有可用备份: ${primaryStateError.message || primaryStateError}`);
      }
      if (state) {
        const saved = state.saved;
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
        if (Array.isArray(saved.profiles)) {
          for (const raw of saved.profiles.slice(0, LOAD_PROFILE_CAP)) {
            try {
              const profile = this.sanitizeProfile(raw);
              this.profiles.set(profile.id, profile);
            } catch (_) {}
          }
          if (saved.profiles.length > LOAD_PROFILE_CAP) {
            console.warn(`[BrowserEngine] ${saved.profiles.length} profiles exceed the load cap; only the first ${LOAD_PROFILE_CAP} were loaded.`);
          }
        }
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
    if (bundledExtensionPath && fs.existsSync(path.join(bundledExtensionPath, 'manifest.json'))) {
      const builtIn = await this.readExtension(bundledExtensionPath, true);
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
      await this.persist();
    }
    if (migrateKernelPolicy || recoveredState) await this.persist();
  },
};
