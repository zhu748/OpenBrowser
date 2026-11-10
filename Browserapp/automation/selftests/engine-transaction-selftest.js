'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { BrowserEngine } = require('../../engine');
const crypto = require('../../credential-crypto');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-engine-transaction-'));
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  crypto.resetLocalMasterKeyCache();
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'state.db') });
  try {
    await store.init();
    const engine = Object.assign(Object.create(BrowserEngine.prototype), {
      usingSqlite: true, sqliteStore: store,
      profiles: new Map([['a', { id: 'a', name: 'Before' }]]),
      extensions: new Map([['ext', { id: 'ext', name: 'Before' }]]),
      assignments: new Map([['a', new Set(['ext'])]]),
      preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null,
    });
    await engine._persistNow();
    const rawState = () => Object.fromEntries(['meta', 'extensions', 'extension_assignments', 'profiles'].map((table) =>
      [table, store.db.prepare(`SELECT * FROM ${table} ORDER BY 1, 2`).all()]));
    const before = rawState();
    engine.profiles.set('a', { id: 'a', name: 'After' });
    engine.extensions.set('ext', { id: 'ext', name: 'After' });
    engine.assignments.set('a', new Set(['ext', 'new']));
    engine.systemBrowserPath = '/changed';
    const saveProfiles = store.saveProfilesDiffed;
    store.saveProfilesDiffed = function (values) { saveProfiles.call(this, values); throw new Error('late profile failure'); };
    await assert.rejects(engine._persistNow(), /late profile failure/);
    assert.deepEqual(rawState(), before, 'a late failure must roll back metadata, extensions, assignments AND profiles');
    store.saveProfilesDiffed = saveProfiles;
    await engine._persistNow();
    assert.equal(store.getProfile('a').name, 'After', 'rollback must invalidate speculative profile hashes before retry');
    assert.equal(store.listExtensions()[0].name, 'After');
    assert.deepEqual([...store.getAssignments().get('a')], ['ext', 'new']);
    assert.equal(store.getMeta('systemBrowserPath'), '/changed');
    await engine.flushPersistence();

    store.withTransaction(() => {
      store.setMeta('outer', 'kept');
      assert.throws(() => store.withTransaction(() => {
        store.setMeta('inner', 'discarded');
        throw new Error('inner failure');
      }), /inner failure/);
      assert.equal(store.getMeta('inner'), null, 'caught inner failure rolls back only its savepoint');
      store.saveGroups([{ id: 'group', name: 'Kept' }]);
    });
    assert.equal(store.getMeta('outer'), 'kept');
    assert.equal(store.listGroups()[0].name, 'Kept');
    assert.equal(store._transactionDepth, 0);
    assert.throws(() => store.withTransaction(() => Promise.resolve()), /must be synchronous/);

    // Failure at COMMIT must invalidate hashes published by nested saves too.
    const committed = rawState();
    engine.profiles.set('a', { id: 'a', name: 'Commit retry' });
    const execute = store.db.exec.bind(store.db);
    let failCommit = true;
    store.db.exec = (sql) => {
      if (sql === 'COMMIT;' && failCommit) { failCommit = false; throw new Error('commit failed'); }
      return execute(sql);
    };
    await assert.rejects(engine._persistNow(), /commit failed/);
    assert.deepEqual(rawState(), committed);
    assert.equal(store._transactionDepth, 0);
    await engine._persistNow();
    assert.equal(store.getProfile('a').name, 'Commit retry');

    store.close(); await store.init();
    assert.equal(store.saveProfilesDiffed([{ id: 'a', name: 'Commit retry' }]), 1, 'reopening invalidates hashes from the prior connection');
    console.log('ENGINE_TRANSACTION_SELFTEST OK (whole-state rollback, cache invalidation, retry)');
  } finally { store.close(); await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
