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
      const payload = JSON.stringify(this._engineStateSnapshot(), null, 2);
      write = () => writeJsonAtomically(this.stateFile, payload);
    }
    // Retain a healthy serialization lane for retries, and a strict result
    // for explicit flushes, including callers of _persistNow() itself.
    const previous = this._persistQueue || Promise.resolve();
    const queued = previous.then(write, write);
    this._lastPersistWrite = queued;
    this._persistQueue = queued.catch(() => {});
    return queued;
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
