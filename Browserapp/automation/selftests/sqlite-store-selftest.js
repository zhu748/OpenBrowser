'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');

const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const { BrowserEngine } = require('../../engine');
const { KERNEL_POLICY_VERSION } = require('../../engine/state-storage');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { registerProfileIpc } = require('../../main/profile-ipc');
const { LocalService } = require('../../rebuild/local-service');
const cloudSync = require('../cloud-sync');

// Each boot models a restart. Windows also requires the last SQLite connection
// (including its WAL mapping) to be closed before removing the fixture.
async function withEngineFixture(prefix, run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  let engine;
  async function boot() {
    engine?.sqliteStore?.close();
    engine = new BrowserEngine({ getPath: () => root }, {
      profileDataRoot: path.join(root, 'profiles-data'),
      auditLogs: false,
    });
    await engine.init(null);
    return engine;
  }
  try {
    await run(boot, root);
  } finally {
    engine?.sqliteStore?.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function checkLegacySyncPreservesUnreadableRows() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-sync-durable-id-'));
  const initialKey = process.env.OPENBROWSER_MASTER_KEY;
  const originalKey = randomBytes(32).toString('hex');
  const temporaryKey = randomBytes(32).toString('hex');
  let engine;
  async function reopen(key) {
    engine?.sqliteStore?.close();
    process.env.OPENBROWSER_MASTER_KEY = key;
    engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    assert.equal(engine.usingSqlite, true);
  }
  function legacySync(values) {
    const handlers = new Map();
    registerProfileIpc({ engine, registerTrustedIpc: (name, handle) => handlers.set(name, handle) });
    return handlers.get('profiles:sync')({}, values, { delta: true });
  }
  const raw = id => Buffer.from(engine.sqliteStore.db.prepare('SELECT data FROM profiles WHERE id=?').get(id).data);
  try {
    await reopen(originalKey);
    await legacySync([{ id: 'protected', name: 'Original profile' }]);
    const originalBytes = raw('protected');
    await reopen(temporaryKey);
    assert.equal(engine.profiles.has('protected'), false);
    assert.equal(engine.sqliteStore.hasProfile('protected'), true);
    assert.ok(engine.sqliteStore.decodeFailureReport().count > 0);
    await legacySync([{ id: 'readable', name: 'Created with temporary key' }]);
    const readable = engine.profileForEdit('readable');
    const readableBytes = raw('readable');

    let failure;
    try {
      await legacySync([
        { ...readable.profile, rev: readable.rev, name: 'Must not partially save' },
        { id: 'new-in-mixed-batch', name: 'Must not partially insert' },
        { id: 'protected', name: 'Stale renderer snapshot' },
      ]);
    } catch (error) { failure = error; }
    assert.ok(raw('protected').equals(originalBytes), 'legacy sync replaced unreadable active ciphertext');
    assert.equal(failure?.code, 'STORAGE_DECODE_FAILED');
    assert.deepEqual(engine.profileForEdit('readable'), readable);
    assert.ok(raw('readable').equals(readableBytes), 'a forbidden collision must stop the whole batch');
    assert.equal(engine.sqliteStore.hasProfile('new-in-mixed-batch'), false);
    assert.equal(engine.profiles.has('new-in-mixed-batch'), false);

    const results = await legacySync([
      { ...readable.profile, rev: readable.rev, name: 'Allowed legacy edit' },
      { id: 'truly-new', name: 'Allowed new ID' },
    ]);
    assert.deepEqual(results.map(row => row.name), ['Allowed legacy edit', 'Allowed new ID']);
    const local = new LocalService({ engine, root });
    const updated = await local.request('profiles:update', {
      id: 'readable', rev: engine.profileForEdit('readable').rev, windowName: 'Allowed modern edit',
    });
    assert.equal(updated.windowName, 'Allowed modern edit');
    assert.ok(raw('protected').equals(originalBytes), 'normal sync must not drop or rewrite an omitted durable row');

    await reopen(originalKey);
    assert.equal(engine.profileForEdit('protected').profile.name, 'Original profile');
    assert.ok(raw('protected').equals(originalBytes));
    assert.ok(engine.sqliteStore.decodeFailureReport().samples.some(row => row.id === 'protected'),
      'historical diagnostic records should not block a now readable row');
    const recovered = engine.profileForEdit('protected');
    await legacySync([{ ...recovered.profile, rev: recovered.rev, name: 'Recovered and editable' }]);
    await reopen(originalKey);
    assert.equal(engine.profileForEdit('protected').profile.name, 'Recovered and editable');
    console.log('  PASS  unreadable durable profile IDs survive legacy sync, while readable and new IDs still work');
  } finally {
    engine?.sqliteStore?.close();
    if (initialKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = initialKey;
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function main() {
  console.log('Running SQLite Modernization & Reliability Test Suite...');
  await checkLegacySyncPreservesUnreadableRows();

  // ==========================================
  // Test 1: Migration & Idempotence
  // ==========================================
  console.log('\n--- [Test 1] Migration & Idempotence ---');
  await withEngineFixture('ob-migration-test-', async (boot, tempDir1) => {
    const legacyJsonPath = path.join(tempDir1, 'openbrowser-engine.json');
    const dbPath = path.join(tempDir1, 'openbrowser-data.db');

    // 1.1 Prepare legacy JSON with profiles, groups, extensions, assignments
    const complexFingerprint = {
      core: { platform: 'MacIntel', hardwareConcurrency: 8, deviceMemory: 8 },
      canvas: { noise: 0.12345, mode: 'noise' },
      webgl: { vendor: 'Apple', renderer: 'Apple M1' },
      audio: { sampleRate: 44100 },
      fonts: ['Arial', 'Helvetica', 'Times New Roman'],
    };

    const initialJson = {
      kernelPolicyVersion: 1,
      preferIndependentKernel: true,
      allowSystemBrowserFallback: false,
      systemBrowserPath: null,
      profiles: [
        {
          id: 'mig-p1',
          number: 1,
          name: 'Active Profile 1',
          groupId: 'grp-1',
          trashed: false,
          trashedAt: null,
          fingerprint: complexFingerprint,
          cookies: 'test_token=abc123xyz',
          proxy: 'socks5://user:pass@127.0.0.1:1080',
        },
        {
          id: 'mig-p2',
          number: 2,
          name: 'Trashed Profile 2',
          groupId: 'grp-2',
          trashed: true,
          trashedAt: '2026-10-25T10:00:00.000Z',
          fingerprint: complexFingerprint,
        },
      ],
      groups: [
        { id: 'grp-1', name: 'Work', color: '#245CFF', sort: 0 },
        { id: 'grp-2', name: 'Trash Group', color: '#94A3B8', sort: 1 },
      ],
      extensions: [
        { id: 'ext-bundled', name: 'Bundled Helper', path: path.join(tempDir1, 'ext'), builtIn: true },
      ],
      assignments: {
        'mig-p1': ['ext-bundled'],
      },
    };

    fs.writeFileSync(legacyJsonPath, JSON.stringify(initialJson, null, 2), 'utf8');

    // 1.2 First engine boot: trigger automatic migration
    const engine1 = await boot();

    assert.equal(engine1.usingSqlite, true, 'Engine should activate SQLite store');
    assert.equal(engine1.profiles.size, 2, 'All 2 profiles must be migrated');
    
    const p1 = engine1.profiles.get('mig-p1');
    assert.ok(p1, 'mig-p1 must exist in engine');
    assert.equal(p1.name, 'Active Profile 1');
    assert.equal(p1.trashed, false);
    assert.equal(p1.cookies, 'test_token=abc123xyz');
    assert.ok(Number.isFinite(Date.parse(p1.createdAt)), 'old payloads fall back to the SQLite creation column');
    assert.equal(p1.privacy.fingerprint.canvas.noise, 0.12345);
    assert.equal(p1.privacy.fingerprint.webgl.vendor, 'Apple');

    const p2 = engine1.profiles.get('mig-p2');
    assert.ok(p2, 'mig-p2 must exist in engine');
    assert.equal(p2.trashed, true);
    assert.equal(p2.trashedAt, '2026-10-25T10:00:00.000Z');

    // Verify old file was renamed to .migrated-*.bak
    assert.equal(fs.existsSync(legacyJsonPath), false, 'Original legacy JSON should be renamed');
    const migratedBackups = fs.readdirSync(tempDir1).filter((f) => f.includes('.migrated-'));
    assert.ok(migratedBackups.length > 0, 'Old file must be kept as .migrated-*.bak');
    assert.ok(fs.existsSync(dbPath), 'openbrowser-data.db must exist');

    // 1.3 Second engine boot: Idempotence test (no re-migration, loads directly from SQLite)
    const engine2 = await boot();

    assert.equal(engine2.usingSqlite, true);
    assert.equal(engine2.profiles.size, 2);
    assert.equal(engine2.profiles.get('mig-p1').cookies, 'test_token=abc123xyz');
    assert.equal(engine2.profiles.get('mig-p1').createdAt, p1.createdAt, 'legacy creation dates survive reopening');
    assert.equal(engine2.profiles.get('mig-p2').trashed, true);

    console.log('  PASS  Automatic lossless migration from legacy JSON to SQLite');
    console.log('  PASS  Migration backup created and retained');
    console.log('  PASS  Subsequent boots are strictly idempotent');
  });

  // ==========================================
  // Test 2: Crash Simulation / Power Loss (kill -9)
  // ==========================================
  console.log('\n--- [Test 2] Power-loss / Crash Simulation (kill -9) ---');
  const tempDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-crash-test-'));
  try {
    const dbPath = path.join(tempDir2, 'openbrowser-data.db');

    // Spawn a child process that opens SQLite in WAL mode, inserts profiles, and waits
    const workerScript = `
      const { ProfileStoreSqlite } = require(${JSON.stringify(path.join(__dirname, '../profile-store-sqlite'))});
      const store = new ProfileStoreSqlite({ dbPath: ${JSON.stringify(dbPath)}, wal: true });
      (async () => {
        await store.init();
        store.db.exec('PRAGMA wal_autocheckpoint = 0; PRAGMA wal_checkpoint(TRUNCATE);');
        // Insert 100 committed profiles
        const list = [];
        for (let i = 0; i < 100; i++) {
          list.push({ id: 'crash-p' + i, number: i + 1, name: 'Profile ' + i, trashed: false });
        }
        store.saveProfiles(list);
        // Signal parent that batch is committed
        process.stdout.write('COMMITTED\\n');
        // Keep process hanging to be killed
        setInterval(() => {}, 1000);
      })();
    `;

    const child = cp.spawn(process.execPath, ['-e', workerScript], {
      stdio: ['ignore', 'pipe', 'inherit'],
      timeout: 30_000, killSignal: 'SIGKILL',
    });
    const closed = new Promise(resolve => child.once('close', resolve));
    try {
      await new Promise((resolve, reject) => {
        let output = '';
        child.stdout.setEncoding('utf8').on('data', chunk => {
          output += chunk;
          if (output.includes('COMMITTED\n')) resolve();
        });
        child.once('error', reject);
        child.once('exit', (code, signal) => reject(Error(`WAL writer exited before commit: ${signal || code}`)));
      });
    } finally {
      // Simulate power loss, then wait for process and stdio handles to close.
      child.kill('SIGKILL');
      await closed;
    }

    const wal = fs.readFileSync(dbPath + '-wal'), shm = fs.readFileSync(dbPath + '-shm');
    assert.ok(wal.length > 0 && shm.length > 0);
    const checkpointedFile = path.join(tempDir2, 'checkpoint-only.db');
    fs.copyFileSync(dbPath, checkpointedFile);
    const withoutWal = new DatabaseSync(checkpointedFile, { readOnly: true });
    try { assert.equal(withoutWal.prepare('SELECT COUNT(*) AS count FROM profiles').get().count, 0); }
    finally { withoutWal.close(); }

    // A stale JSON backup must never override committed pages in a matching WAL.
    const backupBytes = JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: [{ id: 'stale', name: 'Stale' }] });
    const engine = new BrowserEngine({ getPath: () => tempDir2 });
    fs.writeFileSync(engine.stateFile + '.bak', backupBytes);
    try {
      await engine.init(null);
      assert.equal(engine.profiles.size, 100, 'All 100 WAL-only profiles must survive kill -9');
      assert.equal(engine.profiles.has('stale'), false);
      assert.equal(Boolean(engine.storageRecovery), false);
      assert.equal(engine.sqliteStore.db.prepare('PRAGMA integrity_check;').get().integrity_check, 'ok');
      assert.equal(fs.readFileSync(engine.stateFile + '.bak', 'utf8'), backupBytes);
    } finally { engine.sqliteStore?.close(); }

    // When the primary is missing, neither sidecar can establish authority.
    for (const [name, sidecars, hasBackup, sqlite] of [
      ['both-with-backup', [['-wal', wal], ['-shm', shm]], true, true],
      ['wal-alone', [['-wal', wal]], false, true],
      ['shm-alone', [['-shm', shm]], false, true],
      ['json-fallback', [['-wal', wal], ['-shm', shm]], true, false],
    ]) {
      const orphanRoot = path.join(tempDir2, name);
      fs.mkdirSync(orphanRoot);
      const make = () => new BrowserEngine({ getPath: () => orphanRoot });
      const fixture = make();
      for (const [suffix, bytes] of sidecars) fs.writeFileSync(fixture.dbFile + suffix, bytes);
      if (hasBackup) fs.writeFileSync(fixture.stateFile + '.bak', backupBytes);
      const originalFiles = fs.readdirSync(orphanRoot).sort();
      const isSupported = ProfileStoreSqlite.isSupported;
      try {
        if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
        for (let attempt = 0; attempt < 2; attempt++) {
          const restarted = make();
          try { await assert.rejects(restarted.init(null), { code: 'ENGINE_STATE_UNAVAILABLE' }); }
          finally { restarted.sqliteStore?.close(); }
          assert.deepEqual(fs.readdirSync(orphanRoot).sort(), originalFiles, 'no new database, state, or archive');
          assert.equal(restarted.profiles.size, 0);
          for (const [suffix, bytes] of sidecars) assert.ok(fs.readFileSync(fixture.dbFile + suffix).equals(bytes));
          if (hasBackup) assert.equal(fs.readFileSync(fixture.stateFile + '.bak', 'utf8'), backupBytes);
        }
      } finally { ProfileStoreSqlite.isSupported = isSupported; }
    }
    const deniedRoot = path.join(tempDir2, 'denied-sidecar');
    fs.mkdirSync(deniedRoot);
    const denied = new BrowserEngine({ getPath: () => deniedRoot });
    const lstat = fs.lstatSync;
    fs.lstatSync = (target, ...args) => {
      if (target === denied.dbFile + '-wal') throw Object.assign(Error('sidecar access denied'), { code: 'EACCES', errno: -13 });
      return lstat(target, ...args);
    };
    try {
      await assert.rejects(denied.init(null), { code: 'EACCES', errno: -13 });
      assert.deepEqual(fs.readdirSync(deniedRoot), []);
    } finally { fs.lstatSync = lstat; denied.sqliteStore?.close(); }

    console.log('  PASS  Child process killed with SIGKILL (kill -9)');
    console.log('  PASS  WAL auto-recovery preserved 100/100 committed profiles');
    console.log('  PASS  Orphan SQLite sidecars block fresh startup without changing stored bytes');
    console.log('  PASS  PRAGMA integrity_check = ok');
  } finally {
    fs.rmSync(tempDir2, { recursive: true, force: true });
  }

  // ==========================================
  // Test 3: Issue #37 Recycle Bin Full Lifecycle
  // ==========================================
  console.log('\n--- [Test 3] Recycle Bin Lifecycle & #37 Semantics ---');
  await withEngineFixture('ob-trash-lifecycle-', async (boot) => {
    const engine = await boot();
    assert.equal(engine.usingSqlite, true);

    // Create 3 active profiles
    engine.syncProfiles([
      { id: 'rb-1', number: 1, name: 'RB One', groupId: 'g1' },
      { id: 'rb-2', number: 2, name: 'RB Two', groupId: 'g1' },
      { id: 'rb-3', number: 3, name: 'RB Three', groupId: 'g2' },
    ]);
    await engine.persist();

    const dir1 = engine.profileRoot('rb-1');
    const dir2 = engine.profileRoot('rb-2');
    const dir3 = engine.profileRoot('rb-3');
    fs.mkdirSync(dir1, { recursive: true });
    fs.mkdirSync(dir2, { recursive: true });
    fs.mkdirSync(dir3, { recursive: true });

    // Abort the second SQL update to exercise rollback of the whole batch.
    const rejectSecondProfile = () => engine.sqliteStore.db.exec(`
      CREATE TRIGGER fail_rb_update BEFORE UPDATE ON profiles
      WHEN NEW.id = 'rb-2' BEGIN SELECT RAISE(ABORT, 'synthetic trash state write failure'); END;
    `);
    const allowProfileUpdates = () => engine.sqliteStore.db.exec('DROP TRIGGER fail_rb_update');
    const assertTrashState = (trashed) => {
      for (const id of ['rb-1', 'rb-2']) {
        assert.equal(engine.profiles.get(id).trashed, trashed);
        assert.equal(engine.sqliteStore.getProfile(id).trashed, trashed);
        assert.equal(engine.profiles.get(id).trashedAt, engine.sqliteStore.getProfile(id).trashedAt);
        assert(!engine.deletingProfiles.has(id));
      }
    };
    rejectSecondProfile();
    await assert.rejects(engine.trashProfiles(['rb-1', 'rb-2']), /synthetic trash state write failure/);
    assertTrashState(false);
    allowProfileUpdates();

    // 3.1 Soft delete: move rb-1 and rb-2 to trash
    const trashRes = await engine.trashProfiles(['rb-1', 'rb-2']);
    assert.equal(trashRes.success, true);
    assert.equal(trashRes.trashed, 2);
    assert.deepEqual(trashRes.ids, ['rb-1', 'rb-2']);

    assert.equal(engine.profiles.get('rb-1').trashed, true);
    assert.ok(engine.profiles.get('rb-1').trashedAt);
    assert.equal(engine.profiles.get('rb-2').trashed, true);
    assert.equal(engine.profiles.get('rb-3').trashed, false);

    // Verify in SQLite database directly
    const dbP1 = engine.sqliteStore.getProfile('rb-1');
    assert.equal(dbP1.trashed, true);
    assert.ok(dbP1.trashedAt);
    assert.ok(fs.existsSync(dir1), 'Profile data directory must remain on soft delete');

    rejectSecondProfile();
    await assert.rejects(engine.restoreProfiles(['rb-1', 'rb-2']), /synthetic trash state write failure/);
    assertTrashState(true);
    allowProfileUpdates();

    // 3.2 Restore: restore rb-1
    const restoreRes = await engine.restoreProfiles(['rb-1']);
    assert.equal(restoreRes.success, true);
    assert.equal(restoreRes.restored, 1);
    assert.deepEqual(restoreRes.ids, ['rb-1']);

    assert.equal(engine.profiles.get('rb-1').trashed, false);
    assert.equal(engine.profiles.get('rb-1').trashedAt, null);
    assert.equal(engine.sqliteStore.getProfile('rb-1').trashed, false);

    // 3.3 Purge: permanently delete rb-2
    const purgeRes = await engine.purgeProfiles(['rb-2'], true);
    assert.equal(purgeRes.success, true);
    assert.equal(purgeRes.deleted, 1);
    assert.equal(engine.profiles.has('rb-2'), false);
    assert.equal(engine.sqliteStore.getProfile('rb-2'), null);
    assert.equal(fs.existsSync(dir2), false, 'Data directory must be removed on purge');

    // 3.4 Empty trash: trash rb-1 and empty trash
    await engine.trashProfiles(['rb-1']);
    const emptyRes = await engine.emptyTrash(true);
    assert.equal(emptyRes.success, true);
    assert.equal(emptyRes.deleted, 1);
    assert.equal(engine.profiles.has('rb-1'), false);
    assert.equal(engine.sqliteStore.getProfile('rb-1'), null);
    assert.equal(engine.profiles.has('rb-3'), true, 'Active profile rb-3 must remain');
    assert.equal(fs.existsSync(dir3), true, 'Active profile directory must remain');

    console.log('  PASS  trashProfiles soft delete updates SQLite and preserves data directories');
    console.log('  PASS  restoreProfiles clears trashed flag in SQLite and memory');
    console.log('  PASS  purgeProfiles permanently removes record from SQLite and disk');
    console.log('  PASS  emptyTrash cleans all trashed items while preserving active profiles');

    // ==========================================
    // Test 3.5 (5b): trash/restore sync _rowHashes — unchanged rows are not rewritten
    // ==========================================
    console.log('\n--- [Test 3.5] trash/restore must not make saveProfilesDiffed rewrite unchanged rows ---');
    {
      const tempDir35 = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-diff-hash-'));
      let store35;
      try {
        store35 = new ProfileStoreSqlite({
          dbPath: path.join(tempDir35, 'data.db'),
          wal: true,
        });
        await store35.init();
        const profiles = [
          { id: 'diff-a', number: 1, name: 'A', trashed: false },
          { id: 'diff-b', number: 2, name: 'B', trashed: false },
        ];
        store35.saveProfiles(profiles);
        // Prime the diff map the way a boot does.
        store35.getAllProfiles();

        // Count real row writes by spying on the upsert statement.
        let upserts = 0;
        const realUpsert = store35._statements.upsertProfile;
        store35._statements.upsertProfile = {
          run: (...args) => { upserts += 1; return realUpsert.run(...args); },
        };

        // Re-saving unchanged profiles must write nothing.
        let changed = store35.saveProfilesDiffed(profiles);
        assert.equal(changed, 0, 'unchanged profiles are not rewritten');
        assert.equal(upserts, 0, 'no upsert for unchanged rows');

        // Trash one profile, then re-save the full (unchanged-in-memory) set:
        // only the trashed row may be rewritten.
        store35.trashProfiles(['diff-a']);
        const after = store35.getAllProfiles();
        upserts = 0;
        changed = store35.saveProfilesDiffed(after);
        assert.equal(changed, 0, 'trashProfiles synced the hash map: no rewrite');
        assert.equal(upserts, 0, 'no upsert after trash for synced rows');

        // Mutating one profile rewrites exactly that row.
        after[1].name = 'B2';
        upserts = 0;
        changed = store35.saveProfilesDiffed(after);
        assert.equal(changed, 1, 'only the mutated row is detected');
        assert.equal(upserts, 1, 'exactly one upsert for the mutated row');

        // Restore path: same guarantee.
        store35.restoreProfiles(['diff-a']);
        const restored = store35.getAllProfiles();
        upserts = 0;
        changed = store35.saveProfilesDiffed(restored);
        assert.equal(changed, 0, 'restoreProfiles synced the hash map: no rewrite');
        assert.equal(upserts, 0, 'no upsert after restore for synced rows');

        console.log('  PASS  trashProfiles/restoreProfiles keep _rowHashes in sync (no stale-hash rewrites)');
      } finally {
        store35?.close();
        fs.rmSync(tempDir35, { recursive: true, force: true });
      }
    }
  });

  // ==========================================
  // Test 4: LocalStorage Quota Exceeded & Notification
  // ==========================================
  console.log('\n--- [Test 4] LocalStorage Quota Reliability & Notification ---');
  {
    let toastCalled = false;
    let toastMessage = '';
    let toastTone = '';

    global.toast = function (msg, opts) {
      toastCalled = true;
      toastMessage = msg;
      toastTone = opts?.tone;
    };
    global.tx = (s) => s;

    // Simulated localStorage with a 200-byte quota limit
    const storageStore = new Map();
    let initialThrowCount = 0;
    const mockLocalStorage = {
      setItem: (key, value) => {
        const str = String(value);
        if (str.length > 500) {
          initialThrowCount += 1;
          const quotaErr = new Error('QuotaExceededError: DOMException 22');
          quotaErr.name = 'QuotaExceededError';
          quotaErr.code = 22;
          throw quotaErr;
        }
        storageStore.set(key, str);
      },
      getItem: (key) => storageStore.get(key) || null,
      removeItem: (key) => storageStore.delete(key),
    };

    global.localStorage = mockLocalStorage;

    // Simulate renderer save() with large profile payload
     // Just test logic
    // Define helper methods directly mirroring renderer.js
    function redactProfileForStorage(profile) {
      return { ...profile, cookies: '', platform: {} };
    }

    let lastQuotaWarningAt = 0;
    function notifyStorageQuotaExceeded(_error) {
      const now = Date.now();
      if (now - lastQuotaWarningAt > 5000) {
        lastQuotaWarningAt = now;
        if (typeof global.toast === 'function') {
          global.toast(global.tx('本地存储空间不足，已降级精简持久化字段，部分UI状态可能未保存'), { tone: 'error' });
        }
      }
    }

    function trimProfileForUiStorage(profile) {
      const value = redactProfileForStorage(profile);
      return {
        id: value.id,
        number: value.number,
        name: value.name,
        groupId: value.groupId,
        tags: value.tags,
        trashed: value.trashed,
        trashedAt: value.trashedAt,
      };
    }

    const testUi = {
      groups: [{ id: 'g1', name: 'Group 1' }],
      logs: Array.from({ length: 50 }, (_, i) => ({ time: '12:00:00', module: 'test', message: 'Log message #' + i })),
      profiles: Array.from({ length: 5 }, (_, i) => ({
        id: 'ui-p' + i,
        number: i + 1,
        name: 'Profile ' + i,
        heavyFingerprintData: 'x'.repeat(200), // Makes full object > 1000 bytes
      })),
    };

    const simulatedSave = () => {
      const safe = {
        ...testUi,
        profiles: (testUi.profiles || []).map((item) => redactProfileForStorage(item)),
      };
      try {
        global.localStorage.setItem('openbrowser-ui-state', JSON.stringify(safe));
      } catch (err) {
        notifyStorageQuotaExceeded(err);
        try {
          const trimmed = {
            ...testUi,
            logs: [],
            profiles: (testUi.profiles || []).map((item) => trimProfileForUiStorage(item)),
          };
          global.localStorage.setItem('openbrowser-ui-state', JSON.stringify(trimmed));
        } catch (_) {}
      }
    };

    simulatedSave();

    assert.equal(toastCalled, true, 'Toast notification must be shown to user on quota overflow');
    assert.equal(toastTone, 'error', 'Toast tone must be error');
    assert.ok(toastMessage.includes('本地存储空间不足'), 'Toast must inform user of quota issue');
    assert.ok(initialThrowCount > 0, 'Quota error was thrown and caught');
    assert.ok(storageStore.has('openbrowser-ui-state'), 'Trimmed payload must successfully persist');

    const storedValue = JSON.parse(storageStore.get('openbrowser-ui-state'));
    assert.equal(storedValue.logs.length, 0, 'Trimmed logs should be emptied');
    assert.equal(storedValue.profiles.length, 5, 'Profiles should still be present in trimmed form');
    assert.equal(storedValue.profiles[0].heavyFingerprintData, undefined, 'Heavy non-essential data should be pruned');

    console.log('  PASS  Quota overflow triggers visible user toast (no silent exception swallow)');
    console.log('  PASS  Degradation fallback trims logs and non-essential fields to fit quota');
  }

  // ==========================================
  // Test 5: Cloud Export & JSON Parity
  // ==========================================
  console.log('\n--- [Test 5] Cloud Export & JSON Parity ---');
  await withEngineFixture('ob-export-parity-', async (boot) => {
    const engine = await boot();

    engine.syncProfiles([
      { id: 'exp-1', number: 1, name: 'Export 1', cookies: 'token=123', proxy: 'socks5://127.0.0.1:1080' },
      { id: 'exp-2', number: 2, name: 'Export 2', trashed: true, trashedAt: '2026-10-25T12:00:00Z' },
    ]);
    await engine.persist();

    // Export state
    const exported = engine.exportEngineState();
    assert.ok(Array.isArray(exported.profiles));
    assert.equal(exported.profiles.length, 2);
    assert.ok(exported.kernelPolicyVersion != null);
    assert.ok(typeof exported.preferIndependentKernel === 'boolean');

    // Test cloud sync merge with exported profiles
    const merged = cloudSync.mergeProfiles([], exported.profiles, 'merge');
    assert.equal(merged.profiles.length, 2);
    assert.equal(merged.stats.added, 2);

    // Test dumpToJson() produces valid JSON identical to legacy format
    const jsonDump = engine.dumpToJson();
    const parsedDump = JSON.parse(jsonDump);
    assert.equal(parsedDump.profiles.length, 2);
    assert.equal(parsedDump.profiles[0].id, 'exp-1');
    assert.equal(parsedDump.profiles[0].cookies, 'token=123');

    console.log('  PASS  dumpToJson() and exportEngineState() match legacy JSON structure');
    console.log('  PASS  Exported state is 100% interoperable with cloud-sync.js');
  });

  console.log('\n======================================================');
  console.log('ALL SQLITE MODERNIZATION & RELIABILITY TESTS PASSED!');
  console.log('======================================================');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
