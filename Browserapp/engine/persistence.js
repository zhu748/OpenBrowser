'use strict';

/** Persistence coordination and state export for BrowserEngine. */
const { createCoalescedWriter } = require('../automation/coalesced-writer');
const { KERNEL_POLICY_VERSION, writeJsonAtomically } = require('./index');

module.exports = {
  persist() {
    this._persistWriter ||= createCoalescedWriter({
      delayMs: 50,
      keepAlive: true,
      write: () => this._persistNow(),
    });
    return this._persistWriter.request();
  },

  _persistNow() {
    let write;
    if (this.usingSqlite && this.sqliteStore) {
      write = async () => {
        if (typeof this.sqliteStore.saveEngineState === 'function') {
          return this.sqliteStore.saveEngineState(this._engineStateSnapshot());
        }
        // Compatibility for storage adapters without the atomic snapshot API.
        this.sqliteStore.setMeta('kernelPolicyVersion', KERNEL_POLICY_VERSION);
        this.sqliteStore.setMeta('preferIndependentKernel', this.preferIndependentKernel);
        this.sqliteStore.setMeta('allowSystemBrowserFallback', this.allowSystemBrowserFallback);
        this.sqliteStore.setMeta('systemBrowserPath', this.systemBrowserPath);
        this.sqliteStore.saveExtensions([...this.extensions.values()]);
        if (typeof this.sqliteStore.saveAssignmentsDiffed === 'function') {
          this.sqliteStore.saveAssignmentsDiffed(this.assignments);
        } else {
          for (const [profileId, assignedSet] of this.assignments) {
            this.sqliteStore.setAssignments(profileId, assignedSet);
          }
        }
        const profiles = [...this.profiles.values()];
        if (typeof this.sqliteStore.saveProfilesDiffed === 'function') this.sqliteStore.saveProfilesDiffed(profiles);
        else this.sqliteStore.saveProfiles(profiles);
      };
    } else {
      write = () => writeJsonAtomically(this.stateFile, JSON.stringify(this._engineStateSnapshot(), null, 2));
    }
    return this._queuePersist(write);
  },

  _queuePersist(write) {
    // Retain a healthy serialization lane for retries, and a strict result
    // for explicit flushes, including callers of _persistNow() itself.
    const previous = this._persistQueue || Promise.resolve();
    const queued = previous.then(write, write);
    this._lastPersistWrite = queued;
    this._persistQueue = queued.catch(() => {});
    return queued;
  },

  async _persistProfileTrashState(ids, trashed) {
    if (!ids.some((id) => this.profiles.has(id))) return [];
    // Settle edits that were already published before the lifecycle guard was acquired.
    await this._persistWriter?.flushNow();
    return this._queuePersist(async () => {
      const now = new Date().toISOString();
      const changed = new Map();
      for (const id of ids) {
        const profile = this.profiles.get(id);
        if (profile) changed.set(id, { ...profile, trashed, trashedAt: trashed ? now : null });
      }
      if (!changed.size) return [];
      if (this.usingSqlite && this.sqliteStore) {
        this.sqliteStore.saveProfilesDiffed([...changed.values()]);
      } else {
        const snapshot = this._engineStateSnapshot();
        snapshot.profiles = snapshot.profiles.map((profile) => changed.get(profile.id) || profile);
        await writeJsonAtomically(this.stateFile, JSON.stringify(snapshot, null, 2));
      }
      for (const [id, profile] of changed) this.profiles.set(id, profile);
      this.invalidateStatusCache?.();
      return [...changed.keys()];
    });
  },

  async _persistProfileDeletion(ids) {
    const removed = new Set(ids);
    await this._queuePersist(async () => {
      if (this.usingSqlite && this.sqliteStore) {
        // The SQLite transaction deletes both profiles and their assignments.
        this.sqliteStore.deleteProfiles(ids, { durable: true });
      } else {
        const snapshot = this._engineStateSnapshot();
        snapshot.profiles = snapshot.profiles.filter(profile => !removed.has(profile.id));
        for (const id of ids) delete snapshot.assignments[id];
        await writeJsonAtomically(this.stateFile, JSON.stringify(snapshot, null, 2));
      }
      for (const id of ids) {
        this.profiles.delete(id);
        this.assignments.delete(id);
        this.networkInfo.delete(id);
      }
      this.invalidateStatusCache?.();
    });
  },

  async flushPersistence() {
    if (this._persistWriter) {
      await this._persistWriter.flushNow();
      await this._persistWriter.idle();
    }
    await (this._lastPersistWrite || this._persistQueue);
  },

  _engineStateSnapshot() {
    return {
      extensions: [...this.extensions.values()],
      assignments: Object.fromEntries([...this.assignments].map(([id, values]) => [id, [...values]])),
      profiles: [...this.profiles.values()],
      kernelPolicyVersion: KERNEL_POLICY_VERSION,
      preferIndependentKernel: this.preferIndependentKernel,
      allowSystemBrowserFallback: this.allowSystemBrowserFallback,
      systemBrowserPath: this.systemBrowserPath,
    };
  },

  dumpToJson(indent = 2) {
    return JSON.stringify(this.exportEngineState(), null, indent);
  },

  exportEngineState() {
    if (this.usingSqlite && this.sqliteStore) return this.sqliteStore.exportEngineState();
    return this._engineStateSnapshot();
  },
};
