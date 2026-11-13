'use strict';

// Shared provenance for maps written by independent domains. Fresh values are
// required: a rollback must never mutate a Set retained by another publication.
const pending = new WeakMap();

function publishMapChanges(map, changes, { canRestore = () => true } = {}) {
  let heads = pending.get(map);
  if (!heads) { heads = new Map(); pending.set(map, heads); }
  const entries = [];
  for (const [key, value] of changes) {
    const before = map.get(key);
    const previous = heads.get(key);
    const entry = { key, value, before, hadBefore: map.has(key), failed: false,
      predecessor: previous?.value === before ? previous : null };
    heads.set(key, entry); entries.push(entry);
    if (value === undefined) map.delete(key);
    else map.set(key, value);
  }
  function finish() {
    for (const entry of entries) if (heads.get(entry.key) === entry) heads.delete(entry.key);
  }
  return {
    commit: finish,
    rollback() {
      for (const entry of entries) {
        entry.failed = true;
        if (map.get(entry.key) !== entry.value) continue;
        if (!canRestore(entry.key)) { map.delete(entry.key); heads.delete(entry.key); continue; }
        let original = entry;
        while (original.predecessor?.failed) original = original.predecessor;
        if (original.hadBefore) map.set(entry.key, original.before);
        else map.delete(entry.key);
        if (original.predecessor) heads.set(entry.key, original.predecessor);
        else heads.delete(entry.key);
      }
      finish();
    },
  };
}

const lanes = new WeakMap();
function serializeExtensionMutation(engine, operation) {
  const next = (lanes.get(engine) || Promise.resolve()).then(operation);
  const tail = next.catch(() => {});
  lanes.set(engine, tail);
  tail.finally(() => { if (lanes.get(engine) === tail) lanes.delete(engine); });
  return next;
}

async function persistExtensionChanges(engine, extensions, assignments = []) {
  const metadata = publishMapChanges(engine.extensions, extensions);
  const links = publishMapChanges(engine.assignments, assignments, { canRestore: (id) => engine.profiles.has(id) });
  engine.invalidateStatusCache();
  try { await engine.persist(); metadata.commit(); links.commit(); }
  catch (error) {
    metadata.rollback(); links.rollback();
    engine.invalidateStatusCache(); engine.emit({ type: 'extensions', action: 'write-rollback' });
    throw error;
  }
  engine.emit({ type: 'extensions' });
}

module.exports = { publishMapChanges, serializeExtensionMutation, persistExtensionChanges };
