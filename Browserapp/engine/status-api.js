'use strict';

const crypto = require('node:crypto');

module.exports = {
  // Public status view. Cookie jars (up to 500 KB per profile) and platform
  // account secrets do not belong in a poll payload that the renderer requests
  // every ~120 ms: the editor reads them from local state, and the cloud-backup
  // flow receives the full profile through the 'profile-closed' event instead.
  // Proxy strings keep their credentials — the renderer merges them back into
  // local state (mergeEngineExitState) and localStorage already strips them.
  status() {
    // Snapshot cache: the renderer polls this constantly, and building the
    // full view (spread + secret scrub per profile × N) is wasted when nothing
    // changed. Profile Map versions catch content edits; runtime/extension/
    // network writers still invalidate explicitly when their public view changes.
    if (this._statusCache && this._statusProfileVersion === this.profiles.version) return this._statusCache;
    this._statusProfileVersion = this.profiles.version;
    this._statusStamps ||= new Map();
    this._statusInstance ||= crypto.randomBytes(8).toString('hex');
    for (const id of this._statusStamps.keys()) if (!this.profiles.has(id)) this._statusStamps.delete(id);
    this._statusCache = [...this.profiles.values()].map((profile) => {
      const runtime = this.publicRunning(profile.id);
      const view = { ...profile, ...runtime, network: this.networkInfo.get(profile.id) || null, assignedExtensions: [...(this.assignments.get(profile.id) || [])] };
      // Engine revision of this row: lets the renderer issue per-ID modify
      // commands with a base revision (applyProfileCommands) instead of
      // resending the whole fleet. Zero cost per poll: this runs only when
      // the snapshot cache was invalidated.
      view.rev = this.profiles.revisionOf?.(profile.id) || 0;
      if ('cookies' in view) view.cookies = '';
      if (view.platform && typeof view.platform === 'object') {
        view.platform = { ...view.platform };
        if ('password' in view.platform) view.platform.password = '';
        if ('totpSecret' in view.platform) view.platform.totpSecret = '';
        // 多账号行与主账号字段同源（profile-sanitizer 原样保留 password/totpSecret），
        // 这里同样只留 username：轮询通道绝不携带任意一行的账号机密，
        // 编辑器需要的完整行仍走一次性 'profile-closed' 事件（与 cookies 同一设计）。
        if (Array.isArray(view.platform.accounts) && view.platform.accounts.length) {
          view.platform.accounts = view.platform.accounts.map((account) => ({
            ...account,
            password: '',
            totpSecret: '',
          }));
        }
      }
      const signature = JSON.stringify([view.rev, runtime, view.network, view.assignedExtensions]);
      let stamp = this._statusStamps.get(profile.id);
      if (!stamp || stamp.signature !== signature) {
        this._statusSequence = (this._statusSequence || 0) + 1;
        stamp = { signature, token: `${this._statusInstance}:${this._statusSequence}` };
        this._statusStamps.set(profile.id, stamp);
      }
      view.statusRev = stamp.token;
      return view;
    });
    return this._statusCache;
  },

  invalidateStatusCache() {
    this._statusCache = null;
    this._statusDeltaEpoch = (this._statusDeltaEpoch || 0) + 1;
  },

  /**
   * Incremental status view for the renderer's 120ms poll loop. The caller
   * passes its last-seen revision watermark ({id: statusRev}); the engine answers
   * only rows whose revision moved past it, plus removed ids, and the new
   * watermark. At 1000+ profile fleets a full status view is megabytes per
   * poll (measured 3.5MB at N=1000, ~30MB/s at the UI's poll cadence); the
   * delta lane cuts the payload to the rows that actually changed.
   *
   * `full: true` is the resync fallback: any mismatch (unknown ids, a stale
   * shape the caller cannot merge) returns full instead, so the poll loop
   * degrades to today's behavior rather than guessing.
   */
  statusDelta(watermark) {
    const snapshot = this.status();
    if (this._statusWatermarkSnapshot !== snapshot) {
      this._statusWatermarkSnapshot = snapshot;
      // The snapshot is stable until invalidation. Reuse its immutable index
      // across idle polls instead of allocating N entries on every request.
      this._statusWatermark = Object.freeze(Object.fromEntries(snapshot.map((row) => [row.id, row.statusRev])));
    }
    const known = this._statusWatermark;
    const caller = (watermark && typeof watermark === 'object' && !Array.isArray(watermark)) ? watermark : null;
    if (!caller) return { full: true, rows: snapshot, watermark: known, removed: [] };
    const removed = [];
    for (const id of Object.keys(caller)) {
      if (!Object.hasOwn(known, id)) removed.push(id);
    }
    let unknown = 0;
    const rows = [];
    for (const row of snapshot) {
      const { id, statusRev } = row;
      const seen = Object.hasOwn(caller, id) ? caller[id] : undefined;
      if (seen === undefined) { unknown += 1; continue; }
      if (seen !== statusRev) rows.push(row);
    }
    if (unknown > 0) return { full: true, rows: snapshot, watermark: known, removed: [] };
    return { full: false, rows, removed, watermark: known };
  },
};
