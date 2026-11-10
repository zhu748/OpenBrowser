const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { BrowserEngine } = require('./engine');

async function run() {
  const root = path.join(__dirname, '.tmp-profile-batch-selftest-' + process.pid);
  await fsp.rm(root, { recursive: true, force: true });
  const engine = new BrowserEngine({ getPath: () => root });
  const existing = [1, 2, 3, 4].map((number) => ({ id: 'env-' + String(number).padStart(3, '0'), name: 'Existing ' + number }));
  engine.syncProfiles(existing);
  engine.extensions.set('ext-global', { id: 'ext-global', name: 'Global Test', version: '1.0.0', path: root, builtIn: false });
  await engine.assignExtension('ext-global', existing.map((item) => item.id), true);

  const added = [5, 6, 7].map((number) => ({ id: 'env-' + String(number).padStart(3, '0'), name: 'Batch ' + number }));
  engine.syncProfiles([...existing, ...added]);
  for (const profile of added) assert(engine.assignments.get(profile.id).has('ext-global'), profile.id + ' did not inherit the global extension');

  for (const id of ['env-005', 'env-006', 'env-007']) {
    await fsp.mkdir(engine.profileRoot(id), { recursive: true });
    await fsp.writeFile(path.join(engine.profileRoot(id), 'marker.txt'), id);
  }
  const stopped = [];
  engine.running.set('env-005', { pid: 12345 });
  engine.stop = async (id) => { stopped.push(id); engine.running.delete(id); return { id, running: false }; };

  const deleted = await engine.deleteProfiles(['env-005', 'env-006'], true);
  assert.strictEqual(deleted.deleted, 2);
  assert.strictEqual(deleted.stopped, 1);
  assert.deepStrictEqual(stopped, ['env-005']);
  assert(!engine.profiles.has('env-005') && !engine.profiles.has('env-006'));
  assert(!engine.assignments.has('env-005') && !engine.assignments.has('env-006'));
  assert(!fs.existsSync(engine.profileRoot('env-005')) && !fs.existsSync(engine.profileRoot('env-006')));
  assert(engine.listExtensions().find((item) => item.id === 'ext-global').enabledAll);

  const retained = await engine.deleteProfiles(['env-007'], false);
  assert.strictEqual(retained.deleted, 1);
  assert(fs.existsSync(engine.profileRoot('env-007')), 'Browser data should be retained when deleteData is false');
  assert.strictEqual(engine.status().length, 4);

  const failedId = 'env-008';
  const failedProfile = engine.sanitizeProfile({ id: failedId, name: 'Delete failure' });
  engine.profiles.set(failedId, failedProfile);
  engine.assignments.set(failedId, new Set(['ext-global']));
  engine.networkInfo.set(failedId, { ip: '203.0.113.8' });
  await fsp.mkdir(engine.profileRoot(failedId), { recursive: true });
  await fsp.writeFile(path.join(engine.profileRoot(failedId), 'marker.txt'), failedId);
  const originalRm = fsp.rm;
  fsp.rm = async (target, options) => {
    if (path.resolve(target) === path.resolve(engine.profileRoot(failedId))) {
      const error = new Error('synthetic profile delete failure');
      error.code = 'EIO';
      throw error;
    }
    return originalRm(target, options);
  };
  try {
    await assert.rejects(engine.deleteProfiles([failedId], true), /synthetic profile delete failure/);
  } finally {
    fsp.rm = originalRm;
  }
  assert.strictEqual(engine.profiles.get(failedId), failedProfile, 'disk failure must retain profile in memory');
  assert(engine.assignments.get(failedId).has('ext-global'), 'disk failure must retain extension assignments');
  assert.strictEqual(engine.networkInfo.get(failedId).ip, '203.0.113.8', 'disk failure must retain network state');
  assert(fs.existsSync(engine.profileRoot(failedId)), 'disk failure must retain browser data');

  // A rejected or incomplete stop must never proceed to data deletion.
  const stoppedNormally = engine.stop;
  for (const mode of ['reject', 'incomplete']) {
    engine.running.set(failedId, { pid: 12345 });
    engine.stop = async () => {
      if (mode === 'reject') throw new Error('synthetic stop failure');
      return { running: true, cleanupBlocked: true };
    };
    await assert.rejects(engine.deleteProfiles([failedId], true), /stop|exit/i);
    assert(engine.profiles.has(failedId), 'failed stop must retain profile metadata');
    assert(fs.existsSync(path.join(engine.profileRoot(failedId), 'marker.txt')), 'failed stop must retain data');
    assert(!engine.deletingProfiles?.has(failedId), 'failed deletion must release its operation guard');
    engine.running.delete(failedId);
  }
  engine.stop = stoppedNormally;

  // Hold removal open to model a slow filesystem while another caller tries
  // to start or delete the same profile through a different API surface.
  let entered;
  const removing = new Promise((resolve) => { entered = resolve; });
  let resume;
  const released = new Promise((resolve) => { resume = resolve; });
  fsp.rm = async (target, options) => {
    if (path.resolve(target) === path.resolve(engine.profileRoot(failedId))) {
      entered();
      await released;
    }
    return originalRm(target, options);
  };
  try {
    const deletion = engine.deleteProfiles([failedId], true);
    await removing;
    await assert.rejects(engine.start(failedProfile), (error) => error.code === 'PROFILE_DELETING');
    await assert.rejects(engine.deleteProfiles([failedId], true), (error) => error.code === 'PROFILE_DELETING');
    resume();
    await deletion;
    assert(!engine.deletingProfiles.has(failedId));
  } finally { resume(); fsp.rm = originalRm; }
  // SQLite deletion is one transaction, and a rejected transaction must not
  // remove a subset of the profiles from the engine's live state.
  engine.usingSqlite = true;
  engine.sqliteStore = { deleteProfiles: () => { throw new Error('synthetic database failure'); } };
  await assert.rejects(engine.deleteProfiles(['env-001', 'env-002'], false), /synthetic database failure/);
  assert(engine.profiles.has('env-001') && engine.profiles.has('env-002'));
  assert(engine.assignments.has('env-001') && engine.assignments.has('env-002'));
  const databaseCalls = [];
  engine.sqliteStore.deleteProfiles = (ids) => { databaseCalls.push(ids); };
  engine.persist = async () => {};
  const databaseDeleted = await engine.deleteProfiles(['env-001', 'env-002', 'env-001'], false);
  assert.strictEqual(databaseDeleted.deleted, 2);
  assert.deepStrictEqual(databaseCalls, [['env-001', 'env-002']], 'one database transaction per batch, with duplicate ids removed');
  await fsp.rm(root, { recursive: true, force: true });
  console.log('PROFILE_BATCH_SELFTEST_OK lifecycle, inheritance, disk/database failure consistency and batched deletion');
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
