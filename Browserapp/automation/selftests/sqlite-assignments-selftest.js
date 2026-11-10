'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { BrowserEngine } = require('../../engine');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-assignments-'));
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'data.db') });
  try {
    await store.init();
    const values = new Map([['a', new Set(['x', 'y'])], ['b', new Set(['y'])], ['empty', new Set()]]);
    assert.equal(store.saveAssignmentsDiffed(values), 2);
    assert.equal(store.saveAssignmentsDiffed(values), 0);
    values.set('a', new Set(['y', 'x']));
    assert.equal(store.saveAssignmentsDiffed(values), 0, 'set order does not cause a write');

    const loaded = store.getAssignments();
    loaded.get('a').delete('x');
    assert.equal(store.saveAssignmentsDiffed(loaded), 1, 'mutating a returned Set does not mutate the persisted snapshot');
    assert.deepEqual([...store.getAssignments().get('a')], ['y']);
    assert.equal(store.saveAssignmentsDiffed(values), 1);

    store.setAssignments('a', ['z']);
    assert.equal(store.saveAssignmentsDiffed(values), 1, 'direct set invalidates the snapshot');
    store.assignExtension('z', ['b'], true);
    assert.equal(store.saveAssignmentsDiffed(values), 1, 'direct extension assignment invalidates the snapshot');
    store.deleteExtension('y');
    assert.equal(store.saveAssignmentsDiffed(values), 2, 'deleting an extension invalidates affected assignments');
    store.deleteProfiles(['a']);
    assert.equal(store.saveAssignmentsDiffed(values), 1, 'deleting a profile invalidates its assignments');

    const add = store._statements.addAssignment;
    let calls = 0;
    const changed = new Map([['a', new Set(['new-x'])], ['b', new Set(['new-y'])]]);
    store._statements.addAssignment = { run: (...args) => {
      if (++calls === 2) throw new Error('synthetic assignment failure');
      const result = add.run(...args);
      store.getAssignments(); // observe tentative rows during the transaction
      return result;
    } };
    try {
      assert.throws(() => store.saveAssignmentsDiffed(changed), /synthetic assignment failure/);
    } finally { store._statements.addAssignment = add; }
    assert.deepEqual(store.getAssignments(), new Map([['a', new Set(['x', 'y'])], ['b', new Set(['y'])]]), 'all writes roll back together');
    assert.equal(store.saveAssignmentsDiffed(changed), 2, 'a failed transaction does not publish tentative snapshots');
    assert.equal(store.saveAssignmentsDiffed(changed), 0);
    assert.equal(store.saveAssignmentsDiffed(new Map([['a', new Set()]])), 1);
    assert.equal(store.getAssignments().has('a'), false, 'an empty set clears previous assignments');

    store.close();
    await store.init();
    assert.equal(store.saveAssignmentsDiffed(changed), 1, 'reopening rebuilds the persisted snapshot');

    const engine = Object.assign(Object.create(BrowserEngine.prototype), {
      usingSqlite: true, sqliteStore: store, extensions: new Map(), profiles: new Map(),
      assignments: new Map([['a', new Set(['engine-assignment'])]]),
      preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null,
    });
    const saveAssignments = store.saveAssignmentsDiffed;
    let diffCalls = 0;
    store.saveAssignmentsDiffed = function (values) { diffCalls += 1; return saveAssignments.call(this, values); };
    const request = engine.persist();
    await engine.flushPersistence();
    await request;
    assert.equal(diffCalls, 1, 'the engine uses the batched diff entry point');
    assert.deepEqual([...store.getAssignments().get('a')], ['engine-assignment']);
    console.log('SQLITE_ASSIGNMENTS_SELFTEST OK (diffs, mutation isolation, direct writes, rollback, reopen)');
  } finally {
    store.close();
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
