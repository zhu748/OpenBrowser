'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const crypto = require('../../credential-crypto');

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-sqlite-diff-'));
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  crypto.resetLocalMasterKeyCache();
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'data.db') });
  try {
    await store.init();
    const original = { id: 'a', name: 'Original', trashed: false };
    store.saveProfiles([original, { id: 'b', name: 'B', trashed: false }]);
    store.getAllProfiles();
    store.saveProfile({ ...original, name: 'Direct edit' });
    assert.equal(store.saveProfilesDiffed([original]), 1, 'direct writes must invalidate the previous hash');
    assert.equal(store.getProfile('a').name, 'Original');

    for (const operation of ['trashProfiles', 'restoreProfiles']) {
      if (operation === 'restoreProfiles') store.trashProfiles(['a', 'b']);
      store.getAllProfiles();
      const before = store.getProfile('a');
      const statement = store._statements.updateProfileTrash;
      let calls = 0;
      let attempted;
      store._statements.updateProfileTrash = { run: (...args) => {
        if (++calls === 2) throw new Error('simulated transaction failure');
        const result = statement.run(...args);
        attempted = store.getProfile('a');
        return result;
      } };
      try {
        assert.throws(() => store[operation](['a', 'b']), /transaction failure/);
      } finally { store._statements.updateProfileTrash = statement; }
      assert.deepEqual(store.getProfile('a'), before, 'SQLite must roll back the first row');
      assert.equal(store.saveProfilesDiffed([attempted]), 1, 'rolled-back hashes must not suppress a later save');
      assert.deepEqual(store.getProfile('a'), attempted);
    }
    assert.equal(store.saveProfilesDiffed(store.getAllProfiles()), 0, 'unchanged rows still skip writes');

    const baseline = store.getAllProfiles();
    const first = baseline.find((profile) => profile.id === 'a');
    assert.equal(store.saveProfilesDiffed([{ ...first, name: 'Superseded' }, first]), 0,
      'the last duplicate must win even when it matches the persisted value');
    assert.deepEqual(store.getProfile('a'), first);

    const hash = store.profileDataHash;
    let hashes = 0;
    store.profileDataHash = function (profile) { hashes += 1; return hash.call(this, profile); };
    const changed = baseline.map((profile) => ({ ...profile, name: profile.name + ' changed' }));
    assert.equal(store.saveProfilesDiffed(changed), 2);
    assert.equal(hashes, 2, 'each final profile must be hashed only once per save');
    store.profileDataHash = hash;
    console.log('SQLITE_DIFF_SELFTEST OK (direct saves, trash/restore rollback, unchanged rows)');
  } finally {
    store.close();
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
