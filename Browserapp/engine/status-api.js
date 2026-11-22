'use strict';

const crypto = require('node:crypto');

function buildStatusRow(engine, profile) {
  const { id } = profile;
  const runtime = engine.publicRunning(id);
  const view = { ...profile, ...runtime, network: engine.networkInfo.get(id) || null,
    assignedExtensions: [...(engine.assignments.get(id) || [])], rev: engine.profiles.revisionOf?.(id) || 0 };
  if ('cookies' in view) view.cookies = '';
  if (view.platform && typeof view.platform === 'object') {
    view.platform = { ...view.platform };
    if ('password' in view.platform) view.platform.password = '';
    if ('totpSecret' in view.platform) view.platform.totpSecret = '';
    if (Array.isArray(view.platform.accounts) && view.platform.accounts.length) {
      view.platform.accounts = view.platform.accounts.map(account => ({ ...account, password: '', totpSecret: '' }));
    }
  }
  const signature = JSON.stringify([view.rev, runtime, view.network, view.assignedExtensions]);
  let stamp = engine._statusStamps.get(id);
  if (!stamp || stamp.signature !== signature) {
    engine._statusSequence = (engine._statusSequence || 0) + 1;
    stamp = { signature, token: `${engine._statusInstance}:${engine._statusSequence}` };
    engine._statusStamps.set(id, stamp);
  }
  view.statusRev = stamp.token;
  return view;
}

// A cursor records the prior token of each changed row. Keep the transitions
// so a client that missed several polls can combine them without a fleet scan.
function recordStatusCursor(engine, snapshot) {
  const previous = engine._statusWatermarkSnapshot;
  const changed = new Map();
  if (previous && engine._statusChangesSinceCursor) {
    for (const id of engine._statusChangesSinceCursor) {
      const index = engine._statusPositions.get(id);
      changed.set(id, previous[index].statusRev);
    }
  } else if (previous) {
    const prior = new Map(previous.map(row => [row.id, row.statusRev]));
    for (const row of snapshot) {
      if (prior.get(row.id) !== row.statusRev) changed.set(row.id, prior.get(row.id));
      prior.delete(row.id);
    }
    for (const [id, token] of prior) changed.set(id, token);
  }
  engine._statusWatermarkSnapshot = snapshot;
  engine._statusWatermark = null;
  engine._statusChangesSinceCursor = new Set();
  const sequence = engine._statusCursorSequence = (engine._statusCursorSequence || 0) + 1;
  engine._statusCursor = `${engine._statusInstance}:snapshot:${sequence}`;
  engine._statusCursorHistory ||= new Map();
  engine._statusCursorHistory.set(engine._statusCursor, changed);
  if (engine._statusCursorHistory.size > 8) engine._statusCursorHistory.delete(engine._statusCursorHistory.keys().next().value);
}

function changesAfterCursor(history, cursor) {
  const prior = new Map();
  let found = false;
  for (const [key, changes] of history) {
    if (found) {
      for (const [id, token] of changes) if (!prior.has(id)) prior.set(id, token);
    } else if (key === cursor) found = true;
  }
  return prior;
}

module.exports = {
  // Public status view. Cookie jars (up to 500 KB per profile) and platform
  // account secrets do not belong in a poll payload that the renderer requests
  // every ~120 ms: the editor reads them from local state, and the cloud-backup
  // flow receives the full profile through the 'profile-closed' event instead.
  // Proxy strings keep their credentials — the renderer merges them back into
  // local state (mergeEngineExitState) and localStorage already strips them.
  status() {
    if (this._statusCache && this._statusProfiles === this.profiles && this._statusProfileVersion === this.profiles.version) {
      if (!this._dirtyStatusRows?.size) return this._statusCache;
      const snapshot = this._statusCache.slice();
      for (const id of this._dirtyStatusRows) {
        const position = this._statusPositions.get(id);
        if (position === undefined) continue;
        const row = buildStatusRow(this, this.profiles.get(id));
        if (row.statusRev !== snapshot[position].statusRev) this._statusChangesSinceCursor?.add(id);
        snapshot[position] = row;
      }
      this._dirtyStatusRows.clear();
      this._statusCache = snapshot;
      return snapshot;
    }
    this._dirtyStatusRows?.clear();
    this._statusChangesSinceCursor = null;
    for (const id of this.profileLifecycles?.keys() || []) if (!this.profiles.has(id)) this.profileLifecycles.delete(id);
    this._statusProfiles = this.profiles;
    this._statusProfileVersion = this.profiles.version;
    this._statusStamps ||= new Map();
    this._statusInstance ||= crypto.randomBytes(8).toString('hex');
    for (const id of this._statusStamps.keys()) if (!this.profiles.has(id)) this._statusStamps.delete(id);
    this._statusPositions = new Map();
    this._statusCache = [];
    for (const [id, profile] of this.profiles) {
      this._statusPositions.set(id, this._statusCache.length);
      this._statusCache.push(buildStatusRow(this, profile));
    }
    return this._statusCache;
  },

  invalidateStatusCache(id) {
    if (id && this._statusCache && this.profiles.version !== undefined) {
      if (this._statusPositions.has(id)) (this._dirtyStatusRows ||= new Set()).add(id);
      return;
    }
    this._statusCache = null;
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
  statusDelta(watermark, { includeWatermark = true, includeCursor = false } = {}) {
    const snapshot = this.status();
    if (this._statusWatermarkSnapshot !== snapshot) recordStatusCursor(this, snapshot);
    if (includeWatermark && !this._statusWatermark) {
      this._statusWatermark = Object.freeze(Object.fromEntries(snapshot.map(row => [row.id, row.statusRev])));
    }
    const reply = (full, rows, removed) => ({ full, rows, removed,
      ...(includeWatermark ? { watermark: this._statusWatermark } : {}), ...(includeCursor ? { cursor: this._statusCursor } : {}) });
    if (typeof watermark === 'string') {
      if (watermark === this._statusCursor) return reply(false, [], []);
      if (!this._statusCursorHistory.has(watermark)) return reply(true, snapshot, []);
      const positions = [], removed = [];
      for (const [id, before] of changesAfterCursor(this._statusCursorHistory, watermark)) {
        const position = this._statusPositions.get(id);
        if (position === undefined) {
          if (before !== undefined) removed.push(id);
        } else if (snapshot[position].statusRev !== before) positions.push(position);
      }
      positions.sort((a, b) => a - b);
      return reply(false, positions.map(position => snapshot[position]), removed);
    }
    if (!watermark || typeof watermark !== 'object' || Array.isArray(watermark)) return reply(true, snapshot, []);
    if (watermark === this._statusWatermark) return reply(false, [], []);
    const removed = [];
    for (const id of Object.keys(watermark)) {
      if (!this._statusPositions.has(id)) removed.push(id);
    }
    const rows = [];
    for (const row of snapshot) {
      const { id, statusRev } = row;
      const seen = Object.hasOwn(watermark, id) ? watermark[id] : undefined;
      if (seen === undefined) return reply(true, snapshot, []);
      if (seen !== statusRev) rows.push(row);
    }
    return reply(false, rows, removed);
  },
};
