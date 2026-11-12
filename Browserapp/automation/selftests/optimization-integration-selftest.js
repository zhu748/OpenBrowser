'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const { BrowserEngine } = require('../../engine');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { ProxyStore } = require('../proxy-store');
const cloud = require('../cloud-sync');
const ops = require('../cloud-ops');
const { acquireProfileMaintenance } = require('../../engine/profile-maintenance');
const { ProfileRoutes } = require('../api/profile-routes');
const { reconcileProfiles, mergeExitState } = require('../../ui/ui-profile-state');
const { collectProfileDataFiles } = require('../cloud/profile-data');
const { readRestoreState } = require('../cloud/restore-state');
const { validateProfileRootSecure } = require('../isolation');

async function aliasedProfileRoots(root) {
  const dataRoot = path.join(root, 'boundary-profiles');
  await fs.mkdir(dataRoot);
  const profileRoot = path.join(dataRoot, 'new');
  const missing = await validateProfileRootSecure(dataRoot, profileRoot, 'new');
  assert.equal(missing.ok, true, missing.message);
  assert.equal(missing.realRoot, path.join(await fs.realpath(dataRoot), 'new'));
  await assert.rejects(fs.access(profileRoot), { code: 'ENOENT' }, 'validation must not create the profile');
  await fs.mkdir(profileRoot);
  assert.equal((await validateProfileRootSecure(dataRoot, profileRoot, 'new')).ok, true);
  assert.equal((await validateProfileRootSecure(dataRoot, path.join(dataRoot, 'created'), 'created', { create: true })).ok, true);
  const outside = path.join(root, 'outside');
  await fs.mkdir(outside);
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  const linkedProfile = path.join(dataRoot, 'escape');
  await fs.symlink(outside, linkedProfile, linkType);
  assert.equal((await validateProfileRootSecure(dataRoot, linkedProfile, 'escape')).ok, false,
    'an aliased ancestor must not allow a symlinked profile root');
  const linkedDataRoot = path.join(root, 'linked-profiles');
  await fs.symlink(dataRoot, linkedDataRoot, linkType);
  assert.equal((await validateProfileRootSecure(linkedDataRoot, path.join(linkedDataRoot, 'new'), 'new')).ok, false,
    'the data root itself must still reject symlinks');
}

async function publicationFailures(root) {
  for (const scenario of ['both-fail', 'last-fails', 'last-succeeds']) {
    const engine = new BrowserEngine({ getPath: () => root });
    const original = engine.sanitizeProfile({ id: 'p', name: 'Original' });
    engine.profiles.set('p', original);
    engine.assignments.set('p', new Set(['old-extension']));
    const writes = [];
    engine.persist = () => new Promise((resolve, reject) => writes.push({ resolve, reject }));
    const first = engine.syncProfiles([{ ...original, name: 'First' }]);
    const second = engine.syncProfiles([{ ...original, name: 'Second' }]);
    const settled = Promise.allSettled([first, second]);
    const independentAssignment = new Set(['new-extension']);
    engine.assignments.set('p', independentAssignment);
    if (scenario === 'last-fails') { writes[0].resolve(); await first; writes[1].reject(new Error('second failed')); }
    else {
      writes[0].reject(new Error('first failed'));
      if (scenario === 'both-fail') writes[1].reject(new Error('second failed')); else writes[1].resolve();
    }
    await settled;
    assert.equal(engine.profiles.get('p').name, { 'both-fail': 'Original', 'last-fails': 'First', 'last-succeeds': 'Second' }[scenario]);
    assert.equal(engine.assignments.get('p'), independentAssignment, 'rollback preserves independent extension changes');
  }
}

async function main() {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-optimization-'));
  const physicalRoot = path.join(temporaryRoot, 'physical');
  const alias = path.join(temporaryRoot, 'alias');
  await fs.mkdir(physicalRoot);
  // Exercise macOS-style temporary directory aliases on every platform.
  await fs.symlink(physicalRoot, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const root = path.join(alias, 'app');
  await fs.mkdir(root);
  const oldKey = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  const engine = new BrowserEngine({ getPath: () => root });
  const proxyStore = new ProxyStore(path.join(root, 'proxies.json'));
  let settings = { uiGroups: [{ id: 'local-group' }], cloud: { provider: 'local', includeBrowserData: false, passphrase: 'synthetic-integration-passphrase' } };
  const configure = () => ops.initCloudOps({ getEngine: () => engine, getAutomation: () => ({ proxyStore }),
    getSettings: () => settings, saveSettings: async (next) => { settings = next; } });
  engine.sqliteStore = new ProfileStoreSqlite({ dbPath: engine.dbFile });
  engine.usingSqlite = true;
  await engine.sqliteStore.init();
  const upload = cloud.upload;
  try {
    await aliasedProfileRoots(root);
    await publicationFailures(root);
    configure();
    await engine.syncProfiles([{ id: 'p', name: 'Original', cookies: 'synthetic-cookie',
      platform: { username: 'u', password: 'synthetic-password', totpSecret: 'synthetic-totp' }, advanced: { cloudBackup: true } }]);
    const stale = structuredClone(engine.status());
    let uploaded;
    cloud.upload = async (_provider, _config, buffer) => { uploaded = buffer; return {}; };
    for (const action of [() => ops.runCloudBackup({ profiles: stale }),
      () => ops.runCloudProfilePush({ profiles: stale, profileIds: ['p'] }),
      async () => { uploaded = (await ops.createBackupPackage({ profiles: stale })).buffer; }]) {
      await action();
      const body = await cloud.parseBackupPackage(uploaded, settings.cloud.passphrase);
      assert.equal(body.profiles[0].cookies, 'synthetic-cookie');
      assert.equal(body.profiles[0].platform.password, 'synthetic-password');
      assert.equal(body.profiles[0].platform.totpSecret, 'synthetic-totp');
    }
    const routes = new ProfileRoutes({ engine });
    await routes.routeProfileUpdate({ input: { id: 'p', name: 'API-name', proxy: 'http://127.0.0.1:8081' } });
    const reconciled = reconcileProfiles({ localProfiles: stale, engineProfiles: engine.status(), normalizeProfile: (p) => p, mergeProxy: (a) => a });
    assert.equal(reconciled[0].name, 'API-name');
    assert.equal(reconciled[0].proxy, 'http://127.0.0.1:8081');
    const merged = mergeExitState({ profiles: stale, engineProfiles: engine.status(), hasCredentials: () => false });
    assert.equal(merged.profiles[0].name, 'API-name');
    assert.equal(mergeExitState({ profiles: merged.profiles, engineProfiles: engine.status(), hasCredentials: () => false }).profiles, merged.profiles);
    await assert.rejects(engine.syncProfiles(stale, { checkRevisions: true }), { code: 'PROFILE_STALE_REV' });
    const added = await engine.syncProfiles([{ id: 'api-new', name: 'API-created' }], { delta: true });
    assert.equal(added.length, 1);
    const membership = mergeExitState({ profiles: merged.profiles, engineProfiles: added, hasCredentials: () => false });
    assert.equal(membership.profiles[1].name, 'API-created');
    await engine.deleteProfiles(['api-new'], false);
    const lease = acquireProfileMaintenance(engine, ['p']);
    assert.equal((await routes.routeProfileUpdate({ input: { id: 'p', name: 'blocked' } })).code, 409);
    lease.release();
    engine.deletingProfiles.add('p');
    assert.equal((await routes.routeProfileUpdate({ input: { id: 'p', name: 'blocked' } })).code, 409);
    engine.deletingProfiles.delete('p');
    engine.running.set('p', {});
    await assert.rejects(ops.createBackupPackage({ cloud: { includeBrowserData: true } }), { code: 'PROFILE_BUSY' });
    engine.running.delete('p');

    const cookieFile = path.join(engine.profileRoot('p'), 'Default/Network/Cookies');
    await fs.mkdir(path.dirname(cookieFile), { recursive: true });
    const db = new DatabaseSync(cookieFile);
    db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE cookies(value TEXT); PRAGMA wal_checkpoint(TRUNCATE); INSERT INTO cookies VALUES (\'new-cookie\');');
    await assert.rejects(collectProfileDataFiles(engine.profileRoot('p'), engine.profiles.get('p')), { code: 'PROFILE_BACKUP_BUSY' });
    db.close();
    const files = await collectProfileDataFiles(engine.profileRoot('p'), engine.profiles.get('p'));
    const restored = path.join(root, 'check.db');
    await fs.writeFile(restored, Buffer.from(files['Network/Cookies'], 'base64'));
    const check = new DatabaseSync(restored);
    assert.equal(check.prepare('SELECT count(*) AS n FROM cookies').get().n, 1); check.close();
    const warnings = [];
    assert.deepEqual(await collectProfileDataFiles(engine.profileRoot('p'), engine.profiles.get('p'), { maxTotalBytes: 0, onSkipped: (entry) => warnings.push(entry) }), {});
    assert.equal(warnings[0].reason, 'capacity');
    const largeFile = path.join(engine.getProfileDataRoot(), 'large/Default/Network/Cookies');
    await fs.mkdir(path.dirname(largeFile), { recursive: true });
    const large = await fs.open(largeFile, 'w');
    try { await large.truncate(25 * 1024 * 1024 + 1); } finally { await large.close(); }
    const partial = await cloud.buildBackupPackage({ profiles: [{ id: 'large', advanced: { cloudBackup: true } }],
      profileDataRoot: engine.getProfileDataRoot(), passphrase: settings.cloud.passphrase });
    assert.equal(partial.meta.complete, false); assert.equal(partial.meta.skippedFileCount, 1);
    const partialBody = await cloud.parseBackupPackage(partial.buffer, settings.cloud.passphrase);
    assert.equal(partialBody.backupWarnings[0].reason, 'size-limit');

    await proxyStore.replaceAll([{ id: 'local-proxy', raw: 'http://127.0.0.1:8082' }]);
    const proxyLease = await proxyStore.acquireMaintenance();
    await assert.rejects(proxyStore.create({ raw: 'http://127.0.0.1:8083' }), { code: 'PROXY_MAINTENANCE' });
    proxyLease.release();
    const before = structuredClone(engine.profiles.get('p'));
    const persist = engine.persist.bind(engine);
    let fail = true;
    engine.persist = () => { if (fail) { fail = false; return Promise.reject(new Error('injected disk failure')); } return persist(); };
    const originalBytes = await fs.readFile(cookieFile);
    await assert.rejects(ops.applyBackupBody({ profiles: [{ ...before, name: 'Remote', _dataFiles: { 'Network/Cookies': Buffer.from('remote').toString('base64') } },
      { id: 'new-profile', name: 'New' }], groups: [{ id: 'remote-group' }], proxies: [{ id: 'remote-proxy', raw: 'http://127.0.0.1:8084' }] }, { mode: 'remote-wins' }), /injected disk failure/);
    assert.deepEqual(await fs.readFile(cookieFile), originalBytes);
    assert.deepEqual(engine.profiles.get('p'), before);
    assert.equal(engine.profiles.has('new-profile'), false);
    assert.deepEqual(settings.uiGroups, [{ id: 'local-group' }]);
    assert.deepEqual(proxyStore.list().map((p) => p.id), ['local-proxy']);
    assert.equal(engine.profileMaintenance.size, 0);
    assert.equal(await readRestoreState(engine), null);
    assert.deepEqual(engine.sqliteStore.getAllProfiles().map((p) => p.id), ['p']);
    console.log('OPTIMIZATION_INTEGRATION_SELFTEST OK (aliased roots, symlink guards, backup roundtrip, authoritative UI, API guards, WAL, busy backup, limits, metadata compensation)');
  } finally {
    cloud.upload = upload;
    engine.sqliteStore.close();
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE; else process.env.OPENBROWSER_MASTER_KEY_FILE = oldKey;
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
