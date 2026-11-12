'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const http = require('node:http');
const https = require('node:https');
const cp = require('node:child_process');
const cc = require('../../credential-crypto');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const init = require('../../engine/init');
const { LocalApiServer } = require('../local-api-server');
const cloud = require('../cloud-sync');

function legacyEnvelope(profile) {
  const salt = Buffer.alloc(16, 3);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(process.env.OPENBROWSER_MASTER_KEY, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(profile)), cipher.final()]);
  return Buffer.concat([Buffer.from('OBE1'), salt, iv, cipher.getAuthTag(), data]);
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-optimization-'));
  const originalKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = 'isolated-optimization-fixture-key-at-least-32-chars';
  cc.setSafeStorageMock({ isEncryptionAvailable: () => false });
  try {
    const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'migration.db') });
    await store.init();
    try {
      for (const id of ['edited', 'deleted', 'unchanged']) {
        store.saveProfile({ id, name: 'before' });
        store.db.prepare('UPDATE profiles SET data=? WHERE id=?').run(legacyEnvelope({ id, name: 'before' }), id);
      }
      store.getAllProfiles();
      store.saveProfile({ id: 'edited', name: 'after' });
      store.deleteProfiles(['deleted']);
      await new Promise(setImmediate);
      assert.equal(store.getProfile('edited').name, 'after');
      assert.equal(store.getProfile('deleted'), null, 'migration cannot resurrect a deleted row');
      const raw = Buffer.from(store.db.prepare('SELECT data FROM profiles WHERE id=?').get('unchanged').data);
      assert.ok(cc.isUnifiedSaltEnvelope(raw), 'unchanged legacy row is re-encrypted');

      for (let n = 0; n < 120; n++) {
        const id = 'batch-' + n;
        store.saveProfile({ id });
        store.db.prepare('UPDATE profiles SET data=? WHERE id=?').run(legacyEnvelope({ id }), id);
      }
      store.getAllProfiles();
      await new Promise(setImmediate);
      store.deleteProfiles(['batch-100']);
      while (store._legacySaltMigrationScheduled) await new Promise(setImmediate);
      assert.equal(store.getProfile('batch-100'), null, 'later migration chunks also respect deletions');
      assert.ok(cc.isUnifiedSaltEnvelope(Buffer.from(store.db.prepare('SELECT data FROM profiles WHERE id=?').get('batch-119').data)));

      store.db.prepare('UPDATE profiles SET data=? WHERE id=?').run(legacyEnvelope({ id: 'unchanged' }), 'unchanged');
      store.getAllProfiles();
      store.close();
      await new Promise(setImmediate);
      await store.init();
      assert.equal(store.getProfile('unchanged').id, 'unchanged', 'closing cancels pending migration safely');
    } finally { store.close(); }

    const legacy = path.join(root, 'legacy.json');
    const fixture = { profiles: [{ id: 'p', cookies: 'fixture-cookie-secret' }] };
    await fs.writeFile(legacy, JSON.stringify(fixture));
    const migrated = new ProfileStoreSqlite({ dbPath: path.join(root, 'converted.db'), legacyJsonPath: legacy });
    try {
      await migrated.init();
      const name = (await fs.readdir(root)).find((entry) => entry.startsWith('legacy.json.migrated-'));
      const bytes = await fs.readFile(path.join(root, name));
      assert.ok(cc.isEncrypted(bytes));
      assert.ok(!bytes.includes(Buffer.from('fixture-cookie-secret')));
      assert.deepEqual(JSON.parse(cc.decryptCredential(bytes)), fixture);
      await assert.rejects(fs.access(legacy), { code: 'ENOENT' });
    } finally { migrated.close(); }

    const historical = legacy + '.migrated-123.bak';
    await fs.writeFile(historical, JSON.stringify(fixture));
    try {
      await migrated.init();
      assert.ok(cc.isEncrypted(await fs.readFile(historical)), 'existing installations secure historical plaintext migration backups');
      assert.deepEqual(JSON.parse(cc.decryptCredential(await fs.readFile(historical))), fixture);
    } finally { migrated.close(); }

    const dbFile = path.join(root, 'broken.db');
    const stateFile = path.join(root, 'missing.json');
    await fs.writeFile(dbFile, 'not a database');
    const engine = { dbFile, stateFile, kernelManager: { loadMeta: async () => {} } };
    await assert.rejects(init.init.call(engine), { code: 'STORAGE_UNAVAILABLE' });
    assert.equal(await fs.readFile(dbFile, 'utf8'), 'not a database');
    await assert.rejects(fs.access(stateFile), { code: 'ENOENT' });

    const failedFile = path.join(root, 'failed-migration.json');
    await fs.writeFile(failedFile, JSON.stringify(fixture));
    const failed = new ProfileStoreSqlite({ dbPath: path.join(root, 'failed.db'), legacyJsonPath: failedFile });
    const encrypt = cc.encryptCredential;
    let calls = 0;
    cc.encryptCredential = (...args) => {
      if (++calls === 2) throw new Error('backup encryption failed');
      return encrypt(...args);
    };
    try {
      await assert.rejects(failed.init(), /backup encryption failed/);
      assert.deepEqual(JSON.parse(await fs.readFile(failedFile, 'utf8')), fixture);
      await assert.rejects(fs.access(failed.dbPath), { code: 'ENOENT' });
    } finally { cc.encryptCredential = encrypt; failed.close(); }
    console.log('PASS migration races, chunking, encrypted backups and database failure preservation');

    const mock = { isEncryptionAvailable: () => true, getSelectedStorageBackend: () => 'basic_text',
      encryptString: () => { throw new Error('weak backend must not encrypt'); },
      decryptString: () => 'legacy-basic-text-value' };
    cc.setSafeStorageMock(mock);
    assert.equal(cc.isSafeStorageAvailable(), false);
    assert.equal(cc.getFormat(cc.encryptCredential('fixture')), 'OBE1');
    assert.equal(cc.decryptCredential(Buffer.from('OBS1legacy')), 'legacy-basic-text-value', 'existing weak-backend records remain readable');
    cc.setSafeStorageMock(null);
    const spawnSync = cp.spawnSync;
    cp.spawnSync = () => { throw new Error('plain Node must not install Electron'); };
    try { assert.equal(cc.isSafeStorageAvailable(), false); assert.equal(cc.isSafeStorageAvailable(), false); }
    finally { cp.spawnSync = spawnSync; cc.setSafeStorageMock({ isEncryptionAvailable: () => false }); }
    console.log('PASS basic_text fallback, legacy reads and offline Node capability checks');

    const api = new LocalApiServer({ port: 0, apiKey: 'fixture-valid-key' });
    await api.start();
    const call = async (key) => {
      const response = await fetch(`http://127.0.0.1:${api.port}/api/getVersion`, { headers: { 'api-key': key } });
      await response.arrayBuffer();
      return response;
    };
    try {
      for (let n = 0; n < 25; n++) await call('invalid');
      const rejected = await call('invalid');
      assert.equal(rejected.status, 429);
      assert.ok(Number(rejected.headers.get('retry-after')) >= 1);
      assert.equal((await call('fixture-valid-key')).status, 200);
      assert.equal((await call('invalid')).status, 401, 'valid authentication clears the peer failure streak');
    } finally { await api.stop(); }
    console.log('PASS valid API credentials remain usable during another client lockout');

    let stored = Buffer.alloc(64 * 1024, 7);
    let metadataStatus = 200;
    let writes = 0;
    const sha = 'a'.repeat(40);
    const server = http.createServer(async (req, res) => {
      try {
        assert.equal(req.headers.authorization, 'Bearer fixture');
        if (req.method === 'PUT') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const input = JSON.parse(Buffer.concat(chunks));
          assert.equal(input.sha, sha);
          stored = Buffer.from(input.content, 'base64');
          writes++;
          res.writeHead(200); res.end('{}');
        } else if (req.headers.accept === 'application/vnd.github.raw+json') {
          res.writeHead(200); res.end(stored);
        } else {
          assert.equal(req.headers.accept, 'application/vnd.github.object+json');
          res.writeHead(metadataStatus, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ sha, content: stored.length <= 1024 * 1024 ? stored.toString('base64') : '', encoding: 'base64' }));
        }
      } catch (error) { res.writeHead(500); res.end(error.message); }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const originalRequest = https.request;
    https.request = (_url, options, callback) => http.request({ ...options, host: '127.0.0.1', port: server.address().port, path: '/fixture' }, callback);
    const cfg = { owner: 'fixture', repo: 'fixture', token: 'fixture' };
    try {
      const first = Buffer.alloc(1024 * 1024, 8);
      await cloud.upload('github', cfg, first);
      const second = Buffer.alloc(2 * 1024 * 1024, 9);
      await cloud.upload('github', cfg, second);
      assert.deepEqual(await cloud.download('github', cfg), second, 'raw downloads restore files above the Contents JSON limit');
      assert.equal(writes, 2);
      metadataStatus = 403;
      await assert.rejects(cloud.upload('github', cfg, Buffer.from('replacement')), /403/);
      assert.equal(writes, 2, 'metadata failures must not initiate a replacement');
    } finally { https.request = originalRequest; server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
    console.log('PASS repeated GitHub backup, large raw restore and metadata rejection');
  } finally {
    cc.setSafeStorageMock(null);
    if (originalKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = originalKey;
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log('OPTIMIZATION_BOUNDARIES_SELFTEST OK');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
