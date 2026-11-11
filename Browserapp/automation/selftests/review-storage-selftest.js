'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const cc = require('../../credential-crypto');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { RpaStore } = require('../rpa-store');
const init = require('../../engine/init');
const persistence = require('../../engine/persistence');
const { prepareProfileSync } = require('../../engine/profile-sync');
const { readEngineStateCandidate } = require('../../engine/state-storage');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-review-storage-'));
  const originalEnv = { ...process.env };
  const supported = ProfileStoreSqlite.isSupported;
  try {
    process.env.OPENBROWSER_MASTER_KEY = 'isolated-review-fixture-key-with-at-least-32-chars';
    cc.setSafeStorageMock({ isEncryptionAvailable: () => false });
    const first = cc.encryptCredential('first');
    const healthy = cc.encryptCredential('healthy');
    assert.ok(first.subarray(4, 20).equals(healthy.subarray(4, 20)));
    const damaged = Buffer.from(first); damaged[damaged.length - 1] ^= 1;
    assert.throws(() => cc.decryptCredential(damaged));
    assert.equal(cc.decryptCredential(healthy), 'healthy', 'a damaged envelope cannot poison a sibling sharing its salt');
    assert.throws(() => cc.decryptCredential(damaged));
    assert.equal(cc.decryptCredential(first), 'first', 'original bytes remain readable after a damaged copy fails');

    const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'credentials.db') });
    try {
      await store.init();
      store.saveProfile({ id: 'p', name: 'Before', password: 'fixture-secret' });
      const before = store.db.prepare('SELECT data FROM profiles WHERE id=?').get('p').data;
      cc.setSafeStorageMock({ isEncryptionAvailable: () => true, encryptString() { throw new Error('keyring unavailable'); } });
      assert.throws(() => store.saveEngineState({ profiles: [{ id: 'p', name: 'After' }], extensions: [], assignments: {},
        kernelPolicyVersion: 4, preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null }), /encryption failed/);
      assert.deepEqual(store.db.prepare('SELECT data FROM profiles WHERE id=?').get('p').data, before, 'encryption failure preserves the committed ciphertext');
      assert.throws(() => store.saveProfile({ id: 'new', password: 'never-store-me' }), /encryption failed/);
      assert.equal(store.db.prepare('SELECT count(*) AS n FROM profiles WHERE id=?').get('new').n, 0);
      cc.setSafeStorageMock({ isEncryptionAvailable: () => false });
      store.db.prepare('UPDATE profiles SET data=? WHERE id=?').run(JSON.stringify({ id: 'p', name: 'Legacy' }), 'p');
      const legacyProfiles = store.getAllProfiles();
      assert.equal(store.saveProfilesDiffed(legacyProfiles), 1, 'unchanged plaintext rows migrate on the next save');
      assert.ok(cc.isEncrypted(Buffer.from(store.db.prepare('SELECT data FROM profiles WHERE id=?').get('p').data)));
    } finally { store.close(); cc.setSafeStorageMock({ isEncryptionAvailable: () => false }); }

    const profiles = Array.from({ length: 5001 }, (_, i) => ({ id: 'p' + i, number: i + 1, name: 'Profile ' + i }));
    assert.equal(prepareProfileSync({ profiles: new Map(), extensions: new Map(), assignments: new Map(),
      listExtensions: () => [], sanitizeProfile: (p) => p, resolveStoredProxyProfile: (p) => p }, profiles).profiles.size, 5001,
    'a full UI sync accepts every loaded profile');
    for (const sqlite of [false, true]) {
      const stateFile = path.join(root, `${sqlite}.json`);
      const dbFile = path.join(root, `${sqlite}.db`);
      await fs.writeFile(stateFile, cc.encryptCredentialJson({ profiles, kernelPolicyVersion: 4 }));
      ProfileStoreSqlite.isSupported = () => sqlite;
      const engine = Object.assign({ stateFile, dbFile, kernelManager: { loadMeta: async () => {} },
        profiles: new Map(), extensions: new Map(), assignments: new Map(), sanitizeProfile: (p) => p, emit() {},
        preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null,
      }, persistence);
      try {
        await init.init.call(engine);
        assert.equal(engine.profiles.size, profiles.length);
        await engine._persistNow();
        const saved = sqlite ? engine.sqliteStore.getAllProfiles() : (await readEngineStateCandidate(stateFile)).saved.profiles;
        assert.equal(saved.length, profiles.length, 'save must retain every profile on both backends');
        assert.ok(saved.some((p) => p.id === 'p5000'));
      } finally { engine.sqliteStore?.close(); }
    }

    const rpaFile = path.join(root, 'rpa.json');
    const legacy = { version: 4, plans: [{ id: 'plan', variables: { password: 'rpa-fixture-secret' } }], tasks: [], templates: [], config: {} };
    await fs.writeFile(rpaFile, JSON.stringify(legacy));
    const rpa = new RpaStore(rpaFile);
    await rpa.load();
    const raw = await fs.readFile(rpaFile);
    assert.ok(cc.isEncrypted(raw), 'legacy RPA stores migrate to encryption');
    assert.ok(!raw.includes(Buffer.from('rpa-fixture-secret')));
    assert.equal(JSON.parse(cc.decryptCredential(raw)).plans[0].variables.password, 'rpa-fixture-secret');
    const task = await rpa.createTask({ profile_id: 'p', steps: [] });
    assert.equal((await rpa.deleteTask(task.id)).deleted, true, 'real task deletion reports the contract used by UI/API');
    assert.equal((await rpa.deleteTask(task.id)).deleted, false);
    const committed = await fs.readFile(rpaFile);
    process.env.OPENBROWSER_MASTER_KEY = 'different-review-fixture-key-with-at-least-32-chars';
    await assert.rejects(new RpaStore(rpaFile).load(), /existing data was preserved/);
    assert.deepEqual(await fs.readFile(rpaFile), committed, 'wrong key must not quarantine/reset encrypted plans');

    delete process.env.OPENBROWSER_MASTER_KEY;
    process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'invalid.key');
    await fs.writeFile(process.env.OPENBROWSER_MASTER_KEY_FILE, 'damaged');
    cc.resetLocalMasterKeyCache();
    assert.throws(() => cc.getLocalMasterKey(), /invalid/);
    assert.equal(await fs.readFile(process.env.OPENBROWSER_MASTER_KEY_FILE, 'utf8'), 'damaged');
    await fs.writeFile(path.join(root, 'blocker'), 'file');
    process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'blocker', 'key');
    cc.resetLocalMasterKeyCache();
    assert.throws(() => cc.encryptCredential('cannot be persisted'), /ENOTDIR|credential writes were refused/);

    const env = { ...process.env, OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'shared.key') };
    const script = `const c=require(${JSON.stringify(require.resolve('../../credential-crypto'))});const k=c.getLocalMasterKey();console.log(require('crypto').createHash('sha256').update(k).digest('hex'));`;
    const outputs = await Promise.all(Array.from({ length: 8 }, () => promisify(execFile)(process.execPath, ['-e', script], { env })));
    assert.equal(new Set(outputs.map((r) => r.stdout.trim())).size, 1, 'concurrent creators must use the same durable key');
    console.log('REVIEW_STORAGE_SELFTEST OK (isolation, fail-closed writes, 5001 profiles, RPA migration, key failures/concurrency)');
  } finally {
    ProfileStoreSqlite.isSupported = supported;
    cc.setSafeStorageMock(null); cc.resetLocalMasterKeyCache(); cc.clearNegativeDecryptCache();
    for (const key of ['OPENBROWSER_MASTER_KEY', 'OPENBROWSER_MASTER_KEY_FILE']) {
      if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key];
    }
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
