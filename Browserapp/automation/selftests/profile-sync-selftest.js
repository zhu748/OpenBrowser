'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { BrowserEngine } = require('../../engine');

async function main() {
  const engine = new BrowserEngine({ getPath: () => path.join(os.tmpdir(), 'ob-sync-review') });
  const writes = [];
  engine.usingSqlite = true;
  engine.sqliteStore = {
    setMeta() {}, saveExtensions() {}, saveAssignmentsDiffed() {},
    saveProfilesDiffed(values) { writes.push(structuredClone(values)); },
  };
  const raw = { id: 'env-review', name: 'Before', advanced: { blockImages: false } };
  await engine.syncProfiles([raw]);
  assert.equal(writes.length, 1, 'one sync must use only the unified persistence lane');
  assert.equal(writes[0][0].name, 'Before');

  raw.name = 'After';
  raw.advanced.blockImages = true;
  await engine.syncProfiles([raw]);
  assert.equal(engine.profiles.get(raw.id).name, 'After', 'reusing a mutable object must not hide edits');
  assert.equal(engine.profiles.get(raw.id).advanced.blockImages, true, 'nested edits must be sanitized again');
  assert.equal(writes.length, 2);

  const first = engine.syncProfiles([{ ...raw, name: 'Intermediate' }]);
  const second = engine.syncProfiles([{ ...raw, name: 'Latest' }]);
  await Promise.all([first, second]);
  await engine.flushPersistence();
  assert.equal(writes.length, 3, 'a burst of sync calls must coalesce into one write');
  assert.equal(writes.at(-1)[0].name, 'Latest');

  const before = structuredClone([...engine.profiles]);
  const assignments = structuredClone([...engine.assignments]);
  engine.networkInfo.set(raw.id, { ip: '192.0.2.1' });
  await assert.rejects(engine.syncProfiles([
    { ...raw, name: 'Must not be applied', proxy: 'http://127.0.0.1:8080' },
    { id: '../invalid', name: 'Invalid' },
  ]));
  assert.deepEqual([...engine.profiles], before, 'late invalid input must not leave an earlier profile partially updated');
  assert.deepEqual([...engine.assignments], assignments);
  assert.equal(engine.networkInfo.get(raw.id).ip, '192.0.2.1', 'validation failure must not discard live network details');
  assert.equal(writes.length, 3, 'validation failure must not schedule persistence');

  engine.extensions.set('builtin', { id: 'builtin', name: 'Marker', builtIn: true });
  const orphanAssignment = new Set(['existing']);
  engine.assignments.set('orphan', orphanAssignment);
  await assert.rejects(engine.syncProfiles([{ id: 'orphan', name: 'New' }, { id: '../invalid', name: 'Invalid' }]));
  assert.equal(engine.profiles.has('orphan'), false);
  assert.deepEqual([...orphanAssignment], ['existing'], 'staging must not mutate pre-existing assignment Sets');
  assert.equal(engine.assignments.get('orphan'), orphanAssignment);

  await engine.syncProfiles([
    { id: 'dupe', name: 'First', cookies: 'private-cookie', platform: { password: 'private-password' } },
    { id: 'dupe', name: 'Last' },
  ]);
  assert.equal(engine.profiles.get('dupe').name, 'Last', 'duplicate IDs retain sequential last-write semantics');
  assert.equal(engine.profiles.get('dupe').cookies, 'private-cookie', 'later redaction restores the staged predecessor secrets');
  assert.ok(engine.assignments.get('dupe').has('builtin'));
  console.log('PROFILE_SYNC_SELFTEST OK (single persistence lane, mutable input, coalesced sync)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
