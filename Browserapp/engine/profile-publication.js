'use strict';

// Track only pending publications. A coalesced write can reject several
// overlapping callers; their rollback must reach the original state rather
// than leave an intermediate edit that also failed to persist.
const pending = new WeakMap();
const { publishMapChanges } = require('./map-publication');

async function persistProfileSync(engine, staged) {
  let entries = pending.get(engine);
  if (!entries) { entries = new Map(); pending.set(engine, entries); }
  const changes = [];
  engine.invalidateStatusCache?.();
  for (const [id, profile] of staged.profiles) {
    const before = engine.profiles.get(id);
    const predecessor = entries.get(id);
    const entry = { id, profile, before,
      predecessor: predecessor?.profile === before ? predecessor : null,
      network: engine.networkInfo.get(id), failed: false };
    entries.set(id, entry); changes.push(entry);
    engine.profiles.set(id, profile);
  }
  const assignments = publishMapChanges(engine.assignments, staged.assignments, { canRestore: (id) => engine.profiles.has(id) });
  for (const id of staged.networkInvalidations) engine.networkInfo.delete(id);
  try {
    await engine.persist();
    assignments.commit();
  } catch (error) {
    for (const entry of changes) {
      entry.failed = true;
      if (engine.profiles.get(entry.id) !== entry.profile) continue;
      let original = entry;
      while (original.predecessor?.failed) original = original.predecessor;
      if (original.before) engine.profiles.set(entry.id, original.before);
      else engine.profiles.delete(entry.id);
      if (!engine.networkInfo.has(entry.id)) {
        if (original.network) engine.networkInfo.set(entry.id, original.network);
      }
      if (original.predecessor) entries.set(entry.id, original.predecessor);
      else entries.delete(entry.id);
    }
    assignments.rollback();
    engine.invalidateStatusCache?.();
    engine.emit?.({ type: 'status', action: 'profile-write-rollback' });
    throw error;
  } finally {
    for (const entry of changes) if (entries.get(entry.id) === entry) entries.delete(entry.id);
  }
}

module.exports = { persistProfileSync };
