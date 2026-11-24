'use strict';

// Only temporary profiles. No browser, real credentials, network or OS process cleanup.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { randomBytes } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { BrowserEngine } = require('../../engine');
const { clearProfileLaunchData } = require('../../engine/launch-preferences');
const { acquireProfileLock, isProfileLockOwner, releaseProfileLock, lockPath } = require('../isolation');
const { buildBackupPackage, parseBackupPackage, profileRemoteName, upload } = require('../cloud-sync');
const cloudOps = require('../cloud-ops');
const { MAX_BROWSER_FILE_BYTES } = require('../cloud/limits');
const { collectProfileDataFiles, restoreProfileDataFiles } = require('../cloud/profile-data');
const { prepareFileRestore } = require('../cloud/file-restore');
const { fromRoxy, toRoxy } = require('../../rebuild/profile-dto');

const plain = 'synthetic fixture';
async function fixture(t) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-storage-policy-'));
  t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const engine = new BrowserEngine({ getPath: () => tmp });
  const root = engine.profileRoot('fixture');
  await fs.mkdir(root, { recursive: true });
  engine.drainProfileHelpers = async () => ({ known: true, pids: [] });
  const write = async (name, value = plain) => {
    const p = path.join(root, name); await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, value);
  };
  const read = name => fs.readFile(path.join(root, name), 'utf8');
  const gone = name => assert.rejects(read(name), { code: 'ENOENT' });
  return { engine, tmp, root, write, read, gone };
}

test('Chromium startup clears exactly the enabled store and does not follow a linked Default', async t => {
  const { tmp, root, engine, write, gone, read } = await fixture(t);
  const ls = 'Default/Local Storage/leveldb/fixture.log', legacy = 'Default/Local Storage/old.localstorage';
  const idb = 'Default/IndexedDB/site/index', ss = 'Default/Session Storage/fixture.log';
  for (const file of [ls, legacy, idb, ss, 'Default/History', 'Default/Network/Cookies']) await write(file);
  await clearProfileLaunchData(root, { advanced: {} });
  assert.equal(await read(ls), plain);
  assert.deepEqual(await clearProfileLaunchData(root, { advanced: { clearLocalStorageOnStart: true } }), ['Default/Local Storage']);
  await gone(ls); await gone(legacy);
  for (const file of [idb, ss, 'Default/History', 'Default/Network/Cookies']) assert.equal(await read(file), plain);
  await write(ls); await engine.enforceDataRetention(root, { advanced: { saveIndexedDB: false } });
  await gone(idb); assert.equal(await read(ls), plain); assert.equal(await read(ss), plain);

  const outside = path.join(tmp, 'outside');
  await fs.rename(path.join(root, 'Default'), outside);
  await fs.symlink(outside, path.join(root, 'Default'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(clearProfileLaunchData(root, { advanced: { clearLocalStorageOnStart: true } }), /Isolation/);
  assert.equal(await fs.readFile(path.join(outside, 'Local Storage/leveldb/fixture.log'), 'utf8'), plain);
});

const ff = 'storage/default/https+++fixture.test/';
const keyDb = 'key4.db', keyWal = 'key4.db-wal', legacyLs = 'webappsstore.sqlite', archive = 'storage/ls-archive.sqlite';
const ffOther = ['storage/default/https+++fixture.test/.metadata-v2', ff + 'cache/fixture', 'storage.sqlite',
  'storage/permanent/chrome/idb/internal', 'storage/default/moz-extension+++fixture/idb/addon',
  'Default/Local Storage/fixture', 'Default/IndexedDB/fixture', keyDb, keyWal];

async function runningFirefox(f, advanced) {
  const profile = f.engine.sanitizeProfile({ id: 'fixture', name: 'Fixture', engine: 'firefox', browser: 'Firefox', advanced });
  const profileLock = await acquireProfileLock(f.root, { profileId: profile.id });
  const item = { root: f.root, profile, engine: 'firefox', profileLock, lifecycleGeneration: 1,
    child: { exitCode: 0 }, childExitState: { exited: true } };
  // The edited profile now points at Chromium; close must use the actual Firefox process.
  f.engine.profiles.set('fixture', { ...profile, engine: 'chromium', browser: 'Google Chrome' });
  f.engine.running.set('fixture', item);
  return item;
}

for (const [ls, idb] of [[true, false], [false, true], [true, true], [false, false]]) {
  test('normal Firefox stop respects independent storage switches: saveLS=' + ls + ' saveIDB=' + idb, async t => {
    const f = await fixture(t);
    const local = [ff + 'ls/data.sqlite', legacyLs, legacyLs + '-wal', archive];
    const indexed = [ff + 'idb/index.sqlite', 'storage/temporary/https+++second.test/idb/files/fixture'];
    for (const name of [...local, ...indexed, ...ffOther, 'logins.json', 'logins-backup.json']) await f.write(name);
    const item = await runningFirefox(f, { saveLocalStorage: ls, saveIndexedDB: idb, savePasswords: false });
    let underLock = false;
    const retain = f.engine.enforceDataRetention.bind(f.engine);
    f.engine.enforceDataRetention = async (...args) => {
      underLock = isProfileLockOwner(f.root, item.profileLock); return retain(...args);
    };
    const result = await f.engine.stop('fixture');
    assert.equal(result.running, false); assert.equal(underLock, true);
    for (const n of local) if (ls) assert.equal(await f.read(n), plain); else await f.gone(n);
    for (const n of indexed) if (idb) assert.equal(await f.read(n), plain); else await f.gone(n);
    for (const n of ffOther) assert.equal(await f.read(n), plain);
    await f.gone('logins.json'); await f.gone('logins-backup.json');
    await assert.rejects(fs.stat(lockPath(f.root)), { code: 'ENOENT' });
  });
}

test('unknown helper state defers cleanup; a linked Firefox origin never deletes another directory', async t => {
  const f = await fixture(t);
  await f.write(ff + 'idb/keep');
  const item = await runningFirefox(f, { saveIndexedDB: false });
  f.engine.drainProfileHelpers = async () => ({ known: false, pids: [] });
  await assert.rejects(f.engine.stop('fixture'), { code: 'BROWSER_HELPERS_EXIT_UNCONFIRMED' });
  assert.equal(await f.read(ff + 'idb/keep'), plain);
  assert.ok(isProfileLockOwner(f.root, item.profileLock));
  const origin = path.resolve(f.root, ff), outside = path.join(f.tmp, 'other');
  await fs.rename(origin, outside);
  await fs.symlink(outside, origin, process.platform === 'win32' ? 'junction' : 'dir');
  f.engine.drainProfileHelpers = async () => ({ known: true, pids: [] });
  await assert.rejects(f.engine.stop('fixture'), /Isolation/);
  assert.equal(await fs.readFile(path.join(f.tmp, 'other/idb/keep'), 'utf8'), plain);
  assert.ok(isProfileLockOwner(f.root, item.profileLock));
});

test('Firefox next-start retention removes IDB before launch even after an unclean exit', async t => {
  const f = await fixture(t), engine = f.engine;
  await f.write(ff + 'ls/data'); await f.write(ff + 'idb/data'); await f.write(keyDb);
  // Stop at the first boundary AFTER file preparation, strictly before browser or proxy setup.
  const boundary = new Error('synthetic pre-spawn boundary');
  engine.networkInfo.get = () => { throw boundary; };
  engine._platformPreflightDone = true;
  engine.prepareProfileProxyForStart = async p => p;
  engine.ensureExitNetworkForLocale = async () => {};
  engine.applyResolvedLocale = p => p;
  engine.persist = async () => {};
  engine.chooseBrowser = () => ({ name: 'Firefox fixture', path: path.join(f.tmp, 'never-executed') });
  const previous = process.env.OPENBROWSER_RESOURCE_GATE;
  process.env.OPENBROWSER_RESOURCE_GATE = 'off';
  try {
    await assert.rejects(engine._startFirefox({ id: 'fixture', name: 'Fixture', browser: 'Firefox', engine: 'firefox',
      advanced: { saveLocalStorage: true, saveIndexedDB: false } }), err => err === boundary);
  } finally {
    if (previous === undefined) delete process.env.OPENBROWSER_RESOURCE_GATE;
    else process.env.OPENBROWSER_RESOURCE_GATE = previous;
  }
  await f.gone(ff + 'idb/data'); assert.equal(await f.read(ff + 'ls/data'), plain); assert.equal(await f.read(keyDb), plain);
});

function visitDb(file, url) {
  const db = new DatabaseSync(file);
  try {
    db.exec('CREATE TABLE urls(url TEXT); CREATE TABLE visits(url_id INTEGER)');
    db.prepare('INSERT INTO urls VALUES (?)').run(url);
    db.exec('INSERT INTO visits VALUES (1)');
  } finally { db.close(); }
}
const packPass = 'offline regression fixture only';
const cloudProfile = advanced => ({ id: 'fixture', name: 'Fixture', engine: 'chromium', advanced: {
  cloudBackup: true, syncCookiesOnClose: false, saveCookies: false, ...advanced } });
const build = (f, p) => buildBackupPackage({ profiles: [p], profileDataRoot: path.dirname(f.root), passphrase: packPass });

test('history backup round-trips real SQLite data and does not copy unselected stores', async t => {
  const f = await fixture(t);
  await f.write('Default/Session Storage/0001.log');
  visitDb(path.join(f.root, 'Default/History'), 'https://fixture.invalid/visit');
  const disabled = await build(f, cloudProfile({ syncHistory: false }));
  assert.equal(disabled.meta.complete, true);
  assert.deepEqual((await parseBackupPackage(disabled.buffer, packPass)).profiles[0]._dataFiles, {});
  const { buffer, meta } = await build(f, cloudProfile({ syncHistory: true }));
  assert.equal(meta.complete, true); assert.equal(meta.skippedFileCount, 0);
  const files = (await parseBackupPackage(buffer, packPass)).profiles[0]._dataFiles;
  assert.deepEqual(Object.keys(files), ['History']);
  const target = path.join(f.tmp, 'restored'); await fs.mkdir(path.join(target, 'Default'), { recursive: true });
  visitDb(path.join(target, 'Default/History'), 'https://old.invalid/');
  await restoreProfileDataFiles(target, files);
  const db = new DatabaseSync(path.join(target, 'Default/History'), { readOnly: true });
  try { assert.equal(db.prepare('SELECT urls.url FROM visits JOIN urls ON urls.rowid = visits.url_id').get().url, 'https://fixture.invalid/visit'); }
  finally { db.close(); }
  const before = await fs.readFile(path.join(target, 'Default/History'));
  const corrupted = Buffer.from(before); corrupted.fill(255, 100, 106); // SQLite header remains intact
  for (const entry of [plain, files.History + '!', corrupted.toString('base64')]) {
    await assert.rejects(restoreProfileDataFiles(target, { History: entry }), { code: 'INVALID_HISTORY_BACKUP' });
    assert.deepEqual(await fs.readFile(path.join(target, 'Default/History')), before);
  }
});

test('history refuses a live WAL, rollback journal, or foreign lock; restore leaves the original alone', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.root, 'Default')); const history = path.join(f.root, 'Default/History');
  visitDb(history, plain);
  const p = cloudProfile({ syncHistory: true });
  const good = await collectProfileDataFiles(f.root, p);
  const db = new DatabaseSync(history);
  try {
    db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; INSERT INTO urls VALUES ('committed-to-WAL')");
    await assert.rejects(build(f, p), { code: 'PROFILE_BACKUP_BUSY' });
    await assert.rejects(restoreProfileDataFiles(f.root, good), { code: 'PROFILE_RESTORE_BUSY' });
    assert.equal(db.prepare('SELECT count(*) n FROM urls').get().n, 2);
  } finally { db.close(); }
  await f.write('Default/History-journal', 'incomplete journal data');
  await assert.rejects(build(f, p), { code: 'PROFILE_BACKUP_BUSY' });
  await assert.rejects(restoreProfileDataFiles(f.root, good), { code: 'PROFILE_RESTORE_BUSY' });
  await f.write('Default/History-journal', Buffer.alloc(512)); // retained PERSIST journal, cold header
  const after = await collectProfileDataFiles(f.root, p); assert.notEqual(after.History, good.History);
  const owner = await acquireProfileLock(f.root, { profileId: 'fixture' });
  try {
    await assert.rejects(build(f, p), { code: 'PROFILE_BACKUP_BUSY' });
    await assert.rejects(restoreProfileDataFiles(f.root, good), { code: 'PROFILE_RESTORE_BUSY' });
    assert.equal(isProfileLockOwner(f.root, owner), true);
  } finally { await releaseProfileLock(f.root, owner); }
  const tx = await prepareFileRestore([{ root: f.root, files: good }]);
  await f.write('Default/History-wal', 'appeared after staging');
  await assert.rejects(tx.commit(), { code: 'PROFILE_RESTORE_BUSY' }); await tx.rollback();
  assert.equal((await fs.readFile(history)).toString('base64'), after.History);
  assert.equal(await f.read('Default/History-wal'), 'appeared after staging');
});

test('a requested tab-bound store always yields an explicit partial result, never a raw all-origin export', async t => {
  const f = await fixture(t);
  await f.write('Default/Session Storage/0001.log', 'selected-and-unselected-origins');
  await f.write('Default/Local Storage/leveldb/fixture.log', 'local-only');
  const rules = [{ domain: 'allowed.invalid', key: ['first'] }];
  const base = cloudProfile({ syncLocalStorage: true });
  const fromEditor = fromRoxy({ syncSessionStorage: true, sessionStorages: rules }, base);
  assert.deepEqual(JSON.parse(fromEditor.advanced.sessionStorages), rules);
  assert.equal(toRoxy(fromEditor).sessionStorages, fromEditor.advanced.sessionStorages);
  for (const [input, suffix] of [[fromEditor.advanced.sessionStorages, 'domain-key-filter'], ['[object Object]', 'domain-key-filter'],
    ['bad json', 'domain-key-filter'], ['', 'tab-restore']]) {
    const p = cloudProfile({ syncSessionStorage: true, sessionStorages: input, syncLocalStorage: true });
    const { meta, buffer } = await build(f, p); const body = await parseBackupPackage(buffer, packPass);
    const skip = { profileId: 'fixture', path: 'Session Storage', reason: 'session-storage-' + suffix + '-unsupported' };
    assert.equal(meta.complete, false); assert.deepEqual(meta.skippedFiles, [skip]); assert.deepEqual(body.backupWarnings, [skip]);
    assert.deepEqual(Object.keys(body.profiles[0]._dataFiles), ['Local Storage/leveldb/fixture.log']);
    assert.equal(JSON.stringify(body).includes('selected-and-unselected-origins'), false);
  }
});

async function cloudFixture(t) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-cloud-policy-'));
  const userData = path.join(tmp, 'app data #fixture');
  const engine = new BrowserEngine({ getPath: () => userData });
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  t.after(async () => {
    engine.sqliteStore?.close();
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(tmp, { recursive: true, force: true });
  });
  await fs.mkdir(engine.getProfileDataRoot(), { recursive: true });
  await engine.init(null);
  const dir = path.join(tmp, 'backups');
  const cloud = { enabled: true, provider: 'local', local: { dir }, passphrase: packPass,
    autoSyncOnQuit: true, includeBrowserData: true };
  let settings = { cloud, uiGroups: [] };
  const events = [];
  cloudOps.initCloudOps({ getEngine: () => engine, getSettings: () => settings,
    getQuitBackupSettings: () => ({ ...settings, generation: 1 }),
    saveSettings: async next => { settings = next; }, emit: event => events.push(event) });
  const write = async (root, name, value) => {
    const file = path.join(root, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, value);
    return file;
  };
  return { tmp, engine, dir, cloud, events, write, settings: () => settings };
}

test('partial automatic quit and close backups leave both canonical complete packages unchanged', async t => {
  const f = await cloudFixture(t);
  const p = cloudProfile({ syncLocalStorage: true });
  const fileKey = 'Local Storage/leveldb/value.log';
  const file = await f.write(f.engine.profileRoot(p.id), 'Default/' + fileKey, 'previous complete backup');
  await f.engine.commitProfiles([p]);
  const full = await cloudOps.runQuitCloudBackup();
  const pushed = await cloudOps.runCloudProfilePush({ profileId: p.id }, { automatic: true });
  assert.equal(full.meta.complete, true);
  assert.equal(pushed.results[0].meta.complete, true);
  const archive = full.result.path;
  const profileArchive = pushed.results[0].result.path;
  const [previousFull, previousProfile, previousDirectory] = await Promise.all([
    fs.readFile(archive), fs.readFile(profileArchive), fs.readdir(f.dir),
  ]);
  const previousCloud = structuredClone(f.settings().cloud);
  const eventCount = f.events.length;

  await fs.truncate(file, MAX_BROWSER_FILE_BYTES + 1);
  const warning = { profileId: p.id, path: fileKey, reason: 'size-limit' };
  const assertVeto = error => {
    assert.equal(error.code, 'CLOUD_AUTO_BACKUP_INCOMPLETE');
    assert.equal(error.meta.complete, false);
    assert.deepEqual(error.meta.skippedFiles, [warning]);
    return true;
  };
  await assert.rejects(cloudOps.runQuitCloudBackup(), assertVeto);
  assert.deepEqual(f.settings().cloud, previousCloud, 'quit veto is not recorded as a fresh backup');
  assert.equal(f.events.length, eventCount, 'quit veto does not emit a success event');
  await assert.rejects(cloudOps.runCloudProfilePush({ profileId: p.id }, { automatic: true }), assertVeto);
  assert.equal(f.settings().cloud.lastSyncAt, previousCloud.lastSyncAt, 'failed auto-push does not advance success time');
  assert.deepEqual((await fs.readdir(f.dir)).sort(), previousDirectory.sort(), 'veto does not publish or rotate');
  assert.deepEqual(await fs.readFile(archive), previousFull);
  assert.deepEqual(await fs.readFile(profileArchive), previousProfile);

  const manual = await cloudOps.runCloudBackup({ remoteName: 'salvage/available.obpack' });
  assert.equal(manual.success, true);
  assert.equal(manual.meta.complete, false);
  assert.deepEqual((await parseBackupPackage(await fs.readFile(manual.result.path), packPass)).backupWarnings, [warning]);
  assert.deepEqual(await fs.readFile(archive), previousFull, 'an explicitly separate salvage file coexists with the complete package');

  await fs.writeFile(file, 'next complete backup');
  const next = await cloudOps.runQuitCloudBackup();
  assert.equal(next.meta.complete, true);
  const body = await parseBackupPackage(await fs.readFile(archive), packPass);
  assert.equal(Buffer.from(body.profiles[0]._dataFiles[fileKey], 'base64').toString(), 'next complete backup');
});

function placesDb(file, marker) {
  const db = new DatabaseSync(file);
  try {
    db.exec('CREATE TABLE moz_historyvisits(url TEXT); CREATE TABLE moz_bookmarks(title TEXT)');
    db.prepare('INSERT INTO moz_historyvisits VALUES (?)').run(marker + ' visit');
    db.prepare('INSERT INTO moz_bookmarks VALUES (?)').run(marker + ' bookmark');
  } finally { db.close(); }
}

test('Firefox Places exports only with both toggles and a legacy single-category restore leaves Places unchanged', async t => {
  const f = await cloudFixture(t);
  const id = 'fixture';
  const source = path.join(f.tmp, 'source', id);
  await fs.mkdir(source, { recursive: true });
  const sourceDb = path.join(source, 'places.sqlite');
  placesDb(sourceDb, 'source');
  const targetRoot = f.engine.profileRoot(id);
  await fs.mkdir(targetRoot, { recursive: true });
  const targetDb = path.join(targetRoot, 'places.sqlite');
  placesDb(targetDb, 'target');
  const oldBytes = await fs.readFile(targetDb);
  const key = '@firefox/places.sqlite';
  const make = (history, bookmarks) => ({ ...cloudProfile({ syncHistory: history, uploadBookmarks: bookmarks }), engine: 'firefox', browser: 'Firefox' });
  const pack = profile => buildBackupPackage({ profiles: [profile], profileDataRoot: path.dirname(source), passphrase: packPass });
  await f.engine.commitProfiles([make(true, true)]);

  for (const [history, bookmarks, reason] of [[false, false, null], [true, false, 'history-only'], [false, true, 'bookmarks-only']]) {
    const p = make(history, bookmarks);
    const { buffer, meta } = await pack(p);
    const parsed = await parseBackupPackage(buffer, packPass);
    assert.deepEqual(parsed.profiles[0]._dataFiles, {}, 'an unselected category cannot reach the archive');
    assert.equal(meta.complete, !reason);
    const expected = reason ? [{ profileId: id, path: key, reason: 'firefox-places-' + reason + '-unsupported' }] : [];
    assert.deepEqual(parsed.backupWarnings, expected);
    assert.deepEqual(meta.skippedFiles, expected);
    if (!reason) continue;

    // The old writer copied Places and could include a transaction sidecar
    // even for a single category. The destination opted into both, so using
    // destination flags instead of the pack's flags would wrongly replace it.
    const oldPack = { profiles: [{ ...p, _dataFiles: { [key]: (await fs.readFile(sourceDb)).toString('base64'),
      [key + '-journal']: '', 'Local Storage/other.log': Buffer.from('separate good file').toString('base64') } }] };
    if (!history) oldPack.backupWarnings = expected; // Duplicate reasons are shown only once.
    await f.engine.commitProfiles([make(true, true)]);
    const restored = await cloudOps.applyBackupBody(oldPack, { mode: 'overwrite' });
    assert.equal(restored.restoredFiles, 1);
    assert.equal(restored.complete, false);
    assert.equal(restored.skippedFileCount, 1);
    assert.deepEqual(restored.backupWarnings, expected);
    assert.deepEqual(await fs.readFile(targetDb), oldBytes);
    await assert.rejects(fs.lstat(targetDb + '-journal'), { code: 'ENOENT' });
    assert.equal(await fs.readFile(path.join(targetRoot, 'Default/Local Storage/other.log'), 'utf8'), 'separate good file');
  }

  const oldBookmarks = make(false, true);
  const missing = await cloudOps.applyBackupBody({ profiles: [{ ...oldBookmarks, _dataFiles: {} }] }, { mode: 'overwrite' });
  assert.deepEqual(missing.backupWarnings, [{ profileId: id, path: key, reason: 'firefox-places-bookmarks-only-unsupported' }]);
  const metadataOnly = await cloudOps.applyBackupBody({ profiles: [oldBookmarks] }, { mode: 'overwrite' });
  assert.deepEqual(metadataOnly.backupWarnings, []);
  assert.deepEqual(await fs.readFile(targetDb), oldBytes);

  const both = await pack(make(true, true));
  assert.equal(both.meta.complete, true);
  const validPack = await parseBackupPackage(both.buffer, packPass);
  assert.deepEqual(Object.keys(validPack.profiles[0]._dataFiles), [key]);
  const bothRestored = await cloudOps.applyBackupBody(validPack, { mode: 'overwrite' });
  assert.equal(bothRestored.complete, true);
  assert.equal(bothRestored.restoredFiles, 1);
  assert.deepEqual(await fs.readFile(targetDb), await fs.readFile(sourceDb));
});

test('empty and damaged Chromium History do not block exporting or restoring other profiles', async t => {
  const f = await cloudFixture(t);
  const sources = path.join(f.tmp, 'sources');
  const empty = cloudProfile({ syncHistory: true, syncLocalStorage: true });
  const intact = { ...empty, id: 'healthy', advanced: { ...empty.advanced, syncLocalStorage: false } };
  const emptyDir = path.join(sources, empty.id, 'Default');
  const goodDir = path.join(sources, intact.id, 'Default');
  await f.write(emptyDir, 'Local Storage/keep.log', 'other valid data');
  await fs.mkdir(goodDir, { recursive: true });
  const blank = path.join(emptyDir, 'History');
  new DatabaseSync(blank).close(); // Normal SQLite open, but no schema has been created yet.
  const good = path.join(goodDir, 'History');
  visitDb(good, 'https://good.invalid/example');
  const db = new DatabaseSync(good);
  try { db.exec('PRAGMA journal_mode=WAL'); }
  finally { db.close(); }
  const bytes = await fs.readFile(good);
  assert.equal(bytes[18], 2, 'exercise a checkpointed WAL-mode database');
  const damaged = Buffer.from(bytes);
  damaged.fill(255, 100, 106); // A header-only check would accept this damaged database.
  const oldDir = path.join(f.engine.profileRoot(empty.id), 'Default');
  await fs.mkdir(oldDir, { recursive: true });
  const targetHistory = path.join(oldDir, 'History');
  visitDb(targetHistory, 'https://old.invalid/example');
  const old = await fs.readFile(targetHistory);

  for (const reason of ['empty-history-database', 'invalid-history-database']) {
    if (reason === 'invalid-history-database') await fs.writeFile(blank, damaged);
    const packed = await buildBackupPackage({ profiles: [empty, intact], profileDataRoot: sources, passphrase: packPass });
    const warning = { profileId: empty.id, path: 'History', reason };
    assert.equal(packed.meta.complete, false);
    assert.deepEqual(packed.meta.skippedFiles, [warning]);
    const body = await parseBackupPackage(packed.buffer, packPass);
    assert.deepEqual(Object.keys(body.profiles[0]._dataFiles), ['Local Storage/keep.log']);
    assert.equal(body.profiles[1]._dataFiles.History, bytes.toString('base64'));
    const restored = await cloudOps.applyBackupBody(body, { mode: 'overwrite' });
    assert.equal(restored.restoredFiles, 2);
    assert.deepEqual(restored.backupWarnings, [warning]);
    assert.deepEqual(await fs.readFile(targetHistory), old);
    assert.equal(await fs.readFile(path.join(oldDir, 'Local Storage/keep.log'), 'utf8'), 'other valid data');
    assert.deepEqual(await fs.readFile(path.join(f.engine.profileRoot(intact.id), 'Default/History')), bytes);
    for (const suffix of ['-wal', '-shm']) await assert.rejects(fs.lstat(good + suffix), { code: 'ENOENT' });
  }
});

test('full restores and profile pulls report omissions only for the remote rows actually applied', async t => {
  const f = await cloudFixture(t);
  const source = path.join(f.tmp, 'source');
  const profile = id => ({ ...cloudProfile({ syncSessionStorage: true, syncLocalStorage: true }), id });
  const all = ['retained', 'restored', 'excluded'].map(profile);
  for (const p of all) await f.write(path.join(source, p.id), 'Default/Local Storage/store.log', p.id + ' data');
  await f.engine.commitProfiles([all[0]]);
  const pack = profiles => buildBackupPackage({ profiles, profileDataRoot: source, passphrase: packPass });
  const want = id => ({ profileId: id, path: 'Session Storage', reason: 'session-storage-tab-restore-unsupported' });

  const full = await pack(all);
  await upload('local', f.cloud.local, full.buffer);
  const restored = await cloudOps.runCloudRestore({ mode: 'local-wins', profileIds: ['retained', 'restored'] });
  assert.equal(restored.success, true);
  assert.equal(restored.restoredFiles, 1);
  assert.equal(restored.complete, false);
  assert.equal(restored.skippedFileCount, 1);
  assert.deepEqual(restored.backupWarnings, [want('restored')]);
  assert.equal(f.events.at(-1).action, 'restore');
  assert.equal(f.events.at(-1).complete, false);
  assert.deepEqual(f.events.at(-1).backupWarnings, restored.backupWarnings);
  assert.equal(await fs.readFile(path.join(f.engine.profileRoot('restored'), 'Default/Local Storage/store.log'), 'utf8'), 'restored data');
  assert.equal(f.engine.profiles.has('excluded'), false);

  for (const p of [all[0], all[2]]) {
    const item = await pack([p]);
    await upload('local', f.cloud.local, item.buffer, profileRemoteName(p.id));
  }
  const pulled = await cloudOps.runCloudProfilePull({ mode: 'local-wins', profileIds: ['retained', 'excluded'] });
  assert.equal(pulled.success, true);
  assert.equal(pulled.restoredFiles, 1);
  assert.equal(pulled.skippedFileCount, 1);
  assert.deepEqual(pulled.backupWarnings, [want('excluded')]);
  assert.equal(f.events.at(-1).action, 'profile-pull');
  assert.equal(f.events.at(-1).skippedFileCount, 1);
  assert.deepEqual(f.events.at(-1).backupWarnings, pulled.backupWarnings);
  assert.equal(await fs.readFile(path.join(f.engine.profileRoot('excluded'), 'Default/Local Storage/store.log'), 'utf8'), 'excluded data');
});
