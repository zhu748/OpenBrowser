'use strict';

/** Self-test for atomic state writes and transient filesystem retries. */

const assert = require('assert');
const fsp = require('fs/promises');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  KERNEL_POLICY_VERSION,
  writeJsonAtomically,
  writeRawAtomically,
  readEngineStateCandidate,
} = require('../../engine/state-storage');

const results = [];
async function check(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, err: error.message || String(error) }); }
}

async function withPatchedOpen(failures, fn) {
  const original = fsp.open;
  let remaining = failures;
  fsp.open = async (...args) => {
    const target = String(args[0] || '');
    if (remaining > 0 && target.includes('.tmp-')) {
      remaining -= 1;
      const error = new Error('simulated transient open failure');
      error.code = 'ENOENT';
      throw error;
    }
    return original.apply(fsp, args);
  };
  try { return await fn(); } finally { fsp.open = original; }
}

async function withPatchedRename(failures, fn) {
  const original = fsp.rename;
  let remaining = failures;
  fsp.rename = async (...args) => {
    if (remaining > 0) {
      remaining -= 1;
      const error = new Error('simulated transient rename failure');
      error.code = 'EINVAL';
      throw error;
    }
    return original.apply(fsp, args);
  };
  try { return await fn(); } finally { fsp.rename = original; }
}

async function checkStartupReadFailure(sqlite, code, errno) {
  const { BrowserEngine } = require('../../engine');
  const { ProfileStoreSqlite } = require('../profile-store-sqlite');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-startup-read-'));
  const create = () => new BrowserEngine({ getPath: () => root });
  const engine = create();
  let retried;
  const read = fsp.readFile;
  const isSupported = ProfileStoreSqlite.isSupported;
  const openDatabase = ProfileStoreSqlite.prototype._openDatabase;
  try {
    if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
    const state = id => JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: [{ id, name: id }] });
    const primary = Buffer.from(state('newest'));
    const backup = Buffer.from(state('older'));
    const backupPath = engine.stateFile + '.bak';
    await fsp.writeFile(engine.stateFile, primary);
    await fsp.writeFile(backupPath, backup);
    const filesBefore = (await fsp.readdir(root)).sort();
    const failure = Object.assign(Error('injected primary workspace read failure'), { code, errno });
    let primaryAttempts = 0, backupReads = 0, dbOpens = 0;
    ProfileStoreSqlite.prototype._openDatabase = function () {
      dbOpens++;
      return openDatabase.call(this);
    };
    fsp.readFile = async (...args) => {
      if (args[0] === engine.stateFile && ++primaryAttempts === 1) throw failure;
      if (args[0] === backupPath) backupReads++;
      return read(...args);
    };
    let rejected;
    try { await engine.init(null); }
    catch (error) { rejected = error; }
    finally {
      fsp.readFile = read;
      ProfileStoreSqlite.prototype._openDatabase = openDatabase;
    }
    assert.deepStrictEqual([...engine.profiles.keys()], [], 'an unreadable primary must not select the older backup');
    assert.strictEqual(rejected?.code, code, 'startup must surface the original error code');
    assert.strictEqual(rejected?.errno, errno, 'startup must preserve errno');
    assert.strictEqual(primaryAttempts, 1, 'the same startup must not silently fall back to another path');
    assert.strictEqual(backupReads, 0, 'only corruption or missing primary may select recovery candidates');
    assert.strictEqual(dbOpens, 0, 'an unreadable primary must not even open a database for migration');
    assert.strictEqual(fs.existsSync(engine.dbFile), false, 'failure must not initialize SQLite');
    assert.deepStrictEqual((await fsp.readdir(root)).sort(), filesBefore, 'failure must not archive or replace files');
    assert.deepStrictEqual(await read(engine.stateFile), primary);
    assert.deepStrictEqual(await read(backupPath), backup);

    retried = create();
    await retried.init(null);
    assert.strictEqual(retried.usingSqlite, sqlite);
    assert.deepStrictEqual([...retried.profiles.keys()], ['newest']);
  } finally {
    fsp.readFile = read;
    ProfileStoreSqlite.isSupported = isSupported;
    engine.sqliteStore?.close();
    retried?.sqliteStore?.close();
    await fsp.rm(root, { recursive: true, force: true });
  }
}

async function checkStartupRecovery(sqlite, corrupt) {
  const { BrowserEngine } = require('../../engine');
  const { ProfileStoreSqlite } = require('../profile-store-sqlite');
  const { encryptCredential } = require('../../credential-crypto');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-startup-recovery-'));
  const engine = new BrowserEngine({ getPath: () => root });
  const isSupported = ProfileStoreSqlite.isSupported;
  try {
    if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
    if (corrupt) {
      // The primary decrypts successfully, but the decoded JSON is malformed.
      const primary = encryptCredential('{malformed');
      const backup = encryptCredential(JSON.stringify({
        kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: [{ id: 'recovered', name: 'Recovered' }],
      }));
      await fsp.writeFile(engine.stateFile, primary);
      await fsp.writeFile(engine.stateFile + '.bak', backup);
      await engine.init(null);
      assert.deepStrictEqual([...engine.profiles.keys()], ['recovered']);
      const stateName = path.basename(engine.stateFile);
      const prefix = sqlite ? stateName + '.migrated-' : stateName + '.corrupt-';
      const archive = (await fsp.readdir(root)).find(name => name.startsWith(prefix));
      assert.ok(archive, 'the malformed original is archived for recovery');
      assert.deepStrictEqual(await fsp.readFile(path.join(root, archive)), primary);
      assert.deepStrictEqual(await fsp.readFile(engine.stateFile + '.bak'), backup);
    } else {
      await engine.init(null);
      assert.deepStrictEqual([...engine.profiles.keys()], [], 'a truly fresh workspace still starts empty');
    }
    assert.strictEqual(engine.usingSqlite, sqlite);
  } finally {
    ProfileStoreSqlite.isSupported = isSupported;
    engine.sqliteStore?.close();
    await fsp.rm(root, { recursive: true, force: true });
  }
}

async function checkRecoverySource(sqlite, fixture) {
  const { BrowserEngine } = require('../../engine');
  const { ProfileStoreSqlite } = require('../profile-store-sqlite');
  const { collectStorageDiagnostics } = require('../storage-diagnostics');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-source-'));
  const make = () => new BrowserEngine({ getPath: () => root });
  let engine = make();
  const primary = engine.stateFile, backup = primary + '.bak';
  const staged = (fixture === 'backup-staging-only' ? backup : primary) + '.tmp-123-1234567890abcdef';
  const isSupported = ProfileStoreSqlite.isSupported, read = fsp.readFile, rename = fsp.rename;
  const snapshot = id => JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: [{ id, name: id }] });
  const committed = snapshot('committed'), pending = snapshot('not-committed');
  try {
    if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
    const stagingOnly = fixture.endsWith('staging-only');
    if (!stagingOnly) await fsp.writeFile(backup, fixture === 'invalid-backup' ? '{invalid' : committed);
    if (stagingOnly || fixture === 'invalid-shape') {
      await fsp.writeFile(staged, pending);
      await fsp.utimes(staged, new Date(2_000_000), new Date(2_000_000));
    }
    if (fixture === 'invalid-shape') {
      await fsp.writeFile(primary, JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: {} }));
      await fsp.utimes(backup, new Date(1_000_000), new Date(1_000_000));
    }
    if (fixture === 'archive-eio') await fsp.writeFile(primary, '{invalid');
    if (fixture === 'explicit-empty' || fixture === 'legacy-omission') {
      await fsp.writeFile(primary, JSON.stringify({
        kernelPolicyVersion: KERNEL_POLICY_VERSION, ...(fixture === 'explicit-empty' ? { profiles: [] } : {}),
      }));
    }
    const filesBefore = await Promise.all((await fsp.readdir(root)).sort().map(async name => [name, await read(path.join(root, name))]));
    if (fixture === 'backup-eio') {
      fsp.readFile = async (...args) => {
        if (args[0] === backup) throw Object.assign(Error('injected backup read failure'), { code: 'EIO' });
        return read(...args);
      };
    }
    if (fixture === 'archive-eio') {
      fsp.rename = async (...args) => {
        if (args[0] === primary) throw Object.assign(Error('injected primary archive failure'), { code: 'EIO' });
        return rename(...args);
      };
    }
    const retry = fixture.endsWith('-eio');
    if (stagingOnly || retry || fixture === 'invalid-backup') {
      try {
        await assert.rejects(engine.init(null), { code: retry ? 'EIO' : 'ENGINE_STATE_UNAVAILABLE' });
      } finally { fsp.readFile = read; fsp.rename = rename; }
      assert.strictEqual(fs.existsSync(engine.dbFile), false, 'uncertain state must not create an empty database');
      assert.deepStrictEqual((await fsp.readdir(root)).sort(), filesBefore.map(([name]) => name));
      for (const [name, bytes] of filesBefore) assert.deepStrictEqual(await read(path.join(root, name)), bytes);
      if (!retry) return;
      engine = make();
    }

    await engine.init(null);
    const expected = ['explicit-empty', 'legacy-omission'].includes(fixture) ? [] : ['committed'];
    assert.deepStrictEqual([...engine.profiles.keys()], expected, 'the committed snapshot is authoritative over staging');
    assert.strictEqual(collectStorageDiagnostics({ engine }).warnings.some(row => row.code === 'ENGINE_RECOVERED'), Boolean(expected.length));
    if (sqlite && expected.length) assert.strictEqual(engine.sqliteStore.getMeta('migrated_from'), backup);
    assert.strictEqual(await read(backup, 'utf8'), committed);
    if (fixture === 'invalid-shape') assert.strictEqual(await read(staged, 'utf8'), pending, 'staging is not consumed');
    engine.sqliteStore?.close();
    engine = make();
    await engine.init(null);
    assert.deepStrictEqual([...engine.profiles.keys()], expected);
    assert.strictEqual(await read(backup, 'utf8'), committed);
  } finally {
    fsp.readFile = read;
    fsp.rename = rename;
    ProfileStoreSqlite.isSupported = isSupported;
    engine.sqliteStore?.close();
    await fsp.rm(root, { recursive: true, force: true });
  }
}

async function checkRecoveredDeletionPreflight() {
  const { BrowserEngine } = require('../../engine');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-recovered-deletion-'));
  const make = () => new BrowserEngine({ getPath: () => root });
  let engine = make();
  const backup = engine.stateFile + '.bak';
  const snapshot = JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: [{ id: 'kept', name: 'Kept' }] });
  const stage = path.join(engine.profileDataRootPath, '.openbrowser-delete-fixture');
  const journalPath = path.join(stage, 'journal.json');
  const content = path.join(stage, 'absent-from-backup', 'fixture.txt');
  const journal = JSON.stringify({ version: 1, ids: ['absent-from-backup'] });
  try {
    await fsp.writeFile(backup, snapshot);
    await fsp.mkdir(path.dirname(content), { recursive: true });
    await fsp.writeFile(journalPath, journal);
    await fsp.writeFile(content, 'staged user data');
    for (let attempt = 0; attempt < 2; attempt++) {
      engine = make();
      await assert.rejects(engine.init(null), { code: 'PROFILE_DELETE_RECOVERY_REQUIRED' });
      assert.strictEqual(fs.existsSync(engine.dbFile), false);
      assert.strictEqual(fs.existsSync(engine.stateFile), false);
      assert.strictEqual(await fsp.readFile(backup, 'utf8'), snapshot);
      assert.strictEqual(await fsp.readFile(journalPath, 'utf8'), journal);
      assert.strictEqual(await fsp.readFile(content, 'utf8'), 'staged user data');
    }

    // A completed deletion with a durable marker has no such ambiguity.
    await fsp.writeFile(path.join(stage, '.committed'), '1');
    engine = make();
    await engine.init(null);
    assert.deepStrictEqual([...engine.profiles.keys()], ['kept']);
    assert.strictEqual(Boolean(engine.storageRecovery), true);
    assert.strictEqual(fs.existsSync(stage), false);
    engine.sqliteStore.close();
    engine = make();
    await engine.init(null);
    assert.deepStrictEqual([...engine.profiles.keys()], ['kept']);
    assert.strictEqual(Boolean(engine.storageRecovery), false, 'a later boot uses the new authority, not a stale recovery flag');
  } finally {
    engine.sqliteStore?.close();
    await fsp.rm(root, { recursive: true, force: true });
  }
}

async function checkExistingDatabaseAuthority(zeroBytes) {
  const { BrowserEngine } = require('../../engine');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-existing-db-'));
  const make = () => new BrowserEngine({ getPath: () => root });
  let engine = make();
  try {
    if (zeroBytes) await fsp.writeFile(engine.dbFile, '');
    else {
      await engine.init(null);
      engine.sqliteStore.close();
    }
    const dbBefore = await fsp.readFile(engine.dbFile);
    const backup = engine.stateFile + '.bak';
    const bytes = JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: [{ id: 'deleted', name: 'Deleted' }] });
    await fsp.writeFile(backup, bytes);
    engine = make();
    if (zeroBytes) await assert.rejects(engine.init(null), { code: 'ENGINE_STATE_UNAVAILABLE' });
    else {
      await engine.init(null);
      assert.deepStrictEqual([...engine.profiles.keys()], []);
      assert.strictEqual(Boolean(engine.storageRecovery), false);
      engine.sqliteStore.close();
    }
    assert.deepStrictEqual(await fsp.readFile(engine.dbFile), dbBefore);
    assert.strictEqual(await fsp.readFile(backup, 'utf8'), bytes);
  } finally {
    engine.sqliteStore?.close();
    await fsp.rm(root, { recursive: true, force: true });
  }
}

async function checkBundledProfileRecovery(sqlite, source, { duplicate = false } = {}) {
  const { BrowserEngine } = require('../../engine');
  const { ProfileStoreSqlite } = require('../profile-store-sqlite');
  const { collectStorageDiagnostics } = require('../storage-diagnostics');
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-bundled-profiles-'));
  const bundled = path.join(root, 'local-marker');
  const make = () => new BrowserEngine({ getPath: () => root });
  let engine = make();
  const backup = engine.stateFile + '.bak';
  const supported = ProfileStoreSqlite.isSupported;
  const openDatabase = ProfileStoreSqlite.prototype._openDatabase;
  let dbOpens = 0;
  const state = profiles => JSON.stringify({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles });
  const complete = { id: 'complete', name: 'Complete' };
  const incomplete = { id: 'incomplete', note: 'Original legacy metadata' };
  const second = { id: 'second', name: 'Second' };
  const valid = state([complete, second]);
  const invalid = state([complete, duplicate ? { ...second, id: complete.id } : incomplete]);
  try {
    if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
    ProfileStoreSqlite.prototype._openDatabase = function () {
      dbOpens++;
      return openDatabase.call(this);
    };
    await fsp.mkdir(bundled);
    await fsp.writeFile(path.join(bundled, 'manifest.json'), JSON.stringify({
      manifest_version: 3, name: 'Local recovery fixture', version: '1.0',
    }));
    const backupBytes = source === 'backup' || source === 'backup-after-corruption' ? invalid : valid;
    await fsp.writeFile(backup, backupBytes);
    const primary = source === 'primary' ? invalid : source === 'backup-after-corruption' ? '{invalid' : null;
    if (primary !== null) await fsp.writeFile(engine.stateFile, primary);
    const filesBefore = (await fsp.readdir(root)).sort();
    for (let attempt = 0; attempt < 2; attempt++) {
      engine = make();
      let writes = 0;
      const persistNow = engine._persistNow.bind(engine);
      engine._persistNow = (...args) => { writes++; return persistNow(...args); };
      let failure;
      try { await engine.init(bundled); }
      catch (error) { failure = error; }
      if (source === 'valid') {
        assert.ifError(failure);
        assert.strictEqual(engine.usingSqlite, sqlite);
        assert.deepStrictEqual([...engine.profiles.keys()], ['complete', 'second']);
        assert.strictEqual(writes, attempt === 0 ? 1 : 0,
          'boot commits recovery and extension changes once, then skips unchanged state');
        assert.strictEqual(Boolean(engine.storageRecovery), !attempt);
        engine.sqliteStore?.close();
        continue;
      }
      assert.ok((await fsp.readFile(backup)).equals(Buffer.from(backupBytes)), 'bundled startup must not overwrite the sole legacy backup');
      assert.strictEqual(failure?.code, 'ENGINE_STATE_UNAVAILABLE');
      if (duplicate) assert.match(failure.message, /Duplicate profile ID at row 2/);
      assert.strictEqual(writes, 0);
      assert.strictEqual(dbOpens, 0, 'invalid selected data must be rejected before attempting a migration');
      assert.strictEqual(engine.profiles.size, 0);
      assert.strictEqual(engine.extensions.size, 0);
      assert.strictEqual(collectStorageDiagnostics({ engine }).warnings.some(w => w.code === 'ENGINE_RECOVERED'), false);
      assert.strictEqual(fs.existsSync(engine.dbFile), false);
      assert.deepStrictEqual((await fsp.readdir(root)).sort(), filesBefore);
      if (primary !== null) assert.strictEqual(await fsp.readFile(engine.stateFile, 'utf8'), primary);
    }
  } finally {
    ProfileStoreSqlite.isSupported = supported;
    ProfileStoreSqlite.prototype._openDatabase = openDatabase;
    engine.sqliteStore?.close();
    await fsp.rm(root, { recursive: true, force: true });
  }
}

(async () => {
  for (const sqlite of [false, true]) {
    const mode = sqlite ? 'SQLite migration' : 'JSON startup';
    for (const [code, errno] of [['EIO', -5], ['EACCES', -13]]) {
      await check(`${mode} preserves active state on ${code}`, () => checkStartupReadFailure(sqlite, code, errno));
    }
    await check(`${mode} still recovers a malformed decoded primary`, () => checkStartupRecovery(sqlite, true));
    await check(`${mode} still accepts a fresh workspace`, () => checkStartupRecovery(sqlite, false));
    for (const fixture of ['backup-only', 'invalid-shape', 'staging-only', 'backup-staging-only', 'backup-eio', 'invalid-backup', 'explicit-empty', 'legacy-omission']) {
      await check(`${mode} recovery authority: ${fixture}`, () => checkRecoverySource(sqlite, fixture));
    }
    for (const source of ['backup', 'primary', 'backup-after-corruption', 'valid']) {
      await check(`${mode} bundled profile recovery: ${source}`, () => checkBundledProfileRecovery(sqlite, source));
    }
    for (const source of ['backup', 'primary', 'backup-after-corruption']) {
      await check(`${mode} bundled profile recovery refuses duplicate IDs: ${source}`, () => checkBundledProfileRecovery(sqlite, source, { duplicate: true }));
    }
  }
  await check('JSON preserves a good backup if the primary archive fails', () => checkRecoverySource(false, 'archive-eio'));
  await check('an existing empty SQLite database remains authoritative over legacy files', () => checkExistingDatabaseAuthority(false));
  await check('a zero-byte SQLite file is indeterminate and is not filled from a legacy backup', () => checkExistingDatabaseAuthority(true));
  await check('ambiguous backup deletion journals refuse two boots before migrating; a durable marker still settles', checkRecoveredDeletionPreflight);

  await check('legacy engine-state migration encrypts the recovery backup', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-backup-'));
    const file = path.join(root, 'state.json');
    const crypto = require('../../credential-crypto');
    try {
      await fsp.writeFile(file, JSON.stringify({ password: 'legacy-test-secret', version: 1 }));
      await writeJsonAtomically(file, { version: 2 });
      const backup = await fsp.readFile(file + '.bak');
      assert.ok(crypto.isEncrypted(backup), 'backup cannot retain plaintext credentials');
      assert.ok(!backup.includes(Buffer.from('legacy-test-secret')));
      assert.equal((await readEngineStateCandidate(file + '.bak')).saved.password, 'legacy-test-secret');
    } finally { await fsp.rm(root, { recursive: true, force: true }); }
  });

  await check('directory handles close even when directory fsync is unsupported', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const original = fsp.open;
    let closed = 0;
    fsp.open = async (...args) => {
      if (args[0] === root && args[1] === 'r') return {
        sync: async () => { throw Object.assign(new Error('directory fsync unsupported'), { code: 'EINVAL' }); },
        close: async () => { closed += 1; },
      };
      return original.apply(fsp, args);
    };
    try {
      const file = path.join(root, 'state.json');
      await writeRawAtomically(file, 'durable');
      assert.strictEqual(await fsp.readFile(file, 'utf8'), 'durable');
      assert.strictEqual(closed, 1, 'failed fsync must not leak its directory descriptor');
    } finally { fsp.open = original; await fsp.rm(root, { recursive: true, force: true }); }
  });

  await check('writeRawAtomically retries a transient open error', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      await withPatchedOpen(1, () => writeRawAtomically(file, '{"ok":true}', 0o600));
      assert.strictEqual(await fsp.readFile(file, 'utf8'), '{"ok":true}');
      const leftovers = (await fsp.readdir(root)).filter((name) => name.startsWith('state.json.tmp-'));
      assert.deepStrictEqual(leftovers, []);
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  await check('writeRawAtomically retries a transient rename error', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      await withPatchedRename(1, () => writeRawAtomically(file, '{"renamed":true}', 0o600));
      assert.strictEqual(await fsp.readFile(file, 'utf8'), '{"renamed":true}');
      const leftovers = (await fsp.readdir(root)).filter((name) => name.startsWith('state.json.tmp-'));
      assert.deepStrictEqual(leftovers, []);
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  await check('writeRawAtomically gives up after four transient failures', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      await assert.rejects(() => withPatchedOpen(4, () => writeRawAtomically(file, 'x', 0o600)), /transient open failure/);
      assert.strictEqual(fs.existsSync(file), false);
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  await check('backup read I/O failure preserves the primary and can be retried', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-backup-'));
    const file = path.join(root, 'state.json');
    const read = fsp.readFile;
    const failure = Object.assign(Error('unreadable backup source'), { code: 'EIO' });
    try {
      await writeJsonAtomically(file, { version: 1 });
      const before = await read(file);
      fsp.readFile = async (...args) => {
        if (args[0] === file) throw failure;
        return read(...args);
      };
      let rejected;
      try { await writeJsonAtomically(file, { version: 2 }); }
      catch (error) { rejected = error; }
      finally { fsp.readFile = read; }
      assert.ok(before.equals(await read(file)), 'last-good primary was overwritten without a recovery copy');
      assert.strictEqual(rejected, failure, 'the caller must receive the original read error');
      assert.deepStrictEqual(await fsp.readdir(root), ['state.json']);

      await writeJsonAtomically(file, { version: 2 });
      assert.deepStrictEqual(await read(file + '.bak'), before, 'retry must back up the original state');
      assert.strictEqual((await readEngineStateCandidate(file)).saved.version, 2);
    } finally { await fsp.rm(root, { recursive: true, force: true }); }
  });

  await check('writeJsonAtomically encrypts at rest, backs up raw previous bytes and round-trips', async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'state-storage-'));
    const file = path.join(root, 'state.json');
    try {
      // .bak refresh is throttled (BAK_REFRESH_INTERVAL_MS = 5min) and only a
      // real .bak write records the timestamp. This case pins that contract:
      // 1st write has no previous file → no .bak; the immediate 2nd write
      // produces one from the 1st write's raw bytes; a 3rd write inside the
      // window must NOT refresh it again.
      await writeJsonAtomically(file, '{"version":1}');
      assert.strictEqual(fs.existsSync(file + '.bak'), false, 'no .bak while no previous file exists');
      await writeJsonAtomically(file, '{"version":2}');
      const atRest = await fsp.readFile(file, 'utf8');
      assert.ok(atRest.startsWith('OBE1') || atRest.startsWith('OBS1'), 'state file must carry an encryption header');
      assert.ok(!atRest.includes('"version"'), 'plaintext must not be readable at rest');
      assert.strictEqual((await readEngineStateCandidate(file)).saved.version, 2);
      const bak = await fsp.readFile(file + '.bak');
      assert.ok(bak.length > 0, '.bak must preserve previous raw bytes');
      assert.strictEqual((await readEngineStateCandidate(file + '.bak')).saved.version, 1);
      await writeJsonAtomically(file, '{"version":3}');
      assert.strictEqual((await readEngineStateCandidate(file)).saved.version, 3);
      assert.strictEqual(
        (await readEngineStateCandidate(file + '.bak')).saved.version, 1,
        '.bak refresh must be throttled within the interval (still the first write\'s bytes)',
      );
    } finally {
      await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
    }
  });

  const failed = results.filter((item) => !item.ok);
  for (const item of results) {
    if (item.ok) console.log('  PASS  ' + item.name);
    else console.error('  FAIL  ' + item.name + ': ' + item.err);
  }
  if (failed.length) {
    console.error(`state-storage-selftest: FAIL ${results.length - failed.length}/${results.length}`);
    process.exitCode = 1;
  } else {
    console.log(`state-storage-selftest: OK ${results.length}/${results.length}`);
  }
})();
