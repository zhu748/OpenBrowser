'use strict';

/**
 * Revision tracking for engine profile mutations.
 *
 * The engine mutates this.profiles from ~13 call sites (sync publish, trash/
 * restore, cookie clear, proxy exit persistence, start resolution, close-time
 * cookie snapshot, local API edits). Wrapping the Map boundary gives every one
 * of them revision semantics without touching their logic:
 *
 *   - content-aware: a rewrite that produces the same bytes keeps the previous
 *     revision (no churn from no-op writes);
 *   - monotonic: changes get an engine-local sequence number, including after
 *     delete/recreate or clear (old editors must never match a new record);
 *   - fresh-object invariant stays intact: identity memoization uses the same
 *     content hash as the sqlite diffed save, so an in-place mutation of a
 *     stored object is still detected (the hash is over content, not identity).
 *
 * The hash itself lives here and is shared with ProfileStoreSqlite so the
 * store's row hashes and the engine's revisions can never drift apart.
 */

const crypto = require('node:crypto');

/** Deterministic content hash over a profile row (the sqlite diffed-save
 * contract: plaintext JSON of the profile plus its dedicated columns, NUL
 * separated). Must stay byte-stable: both the store's row-diff map and the
 * engine's revision counters are persisted/compared against it. */
function profileDataHash(profile) {
  if (!profile || typeof profile !== 'object' || !profile.id) return null;
  const parts = [
    profile.id,
    Number.isInteger(profile.number) ? profile.number : (Number(profile.number) || null),
    String(profile.name || profile.id),
    profile.groupId != null ? String(profile.groupId) : null,
    profile.trashed ? 1 : 0,
    profile.trashedAt ? String(profile.trashedAt) : null,
  ];
  return crypto.createHash('sha256')
    .update(JSON.stringify(parts)).update('\0').update(JSON.stringify(profile)).digest('hex');
}

class TrackedProfileMap extends Map {
  constructor(entries) {
    super();
    this._revisions = new Map(); // id -> { rev, hash }
    this._sequence = 0;
    if (entries != null) {
      for (const [id, profile] of entries) this.set(id, profile);
    }
  }

  /** Current revision of a profile (0 when unknown/never written). */
  revisionOf(id) {
    return this._revisions.get(String(id))?.rev || 0;
  }

  /** {id: rev} snapshot for the given ids (all ids when omitted). */
  revisionState(ids) {
    const out = {};
    for (const id of ids == null ? this.keys() : ids) {
      out[String(id)] = this.revisionOf(id);
    }
    return out;
  }

  set(id, profile) {
    const key = String(id);
    if (profile && typeof profile === 'object' && profile.id) {
      const hash = profileDataHash(profile);
      const previous = this._revisions.get(key);
      // Content-identical rewrite keeps the previous revision. The stored
      // object itself follows the caller's reference: the sqlite diffed save
      // compares by content hash, so this never causes extra row writes.
      if (hash && previous?.hash === hash) return super.set(key, profile);
      if (hash) this._revisions.set(key, { rev: ++this._sequence, hash });
    }
    return super.set(key, profile);
  }

  delete(id) {
    const key = String(id);
    this._revisions.delete(key);
    return super.delete(key);
  }

  clear() {
    this._revisions.clear();
    super.clear();
  }
}

module.exports = { profileDataHash, TrackedProfileMap };
