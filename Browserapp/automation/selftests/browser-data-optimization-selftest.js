'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const data = require('../browser-data');
const store = require('../../engine/profile-store-api');
const { collectProfileDataFiles, restoreProfileDataFiles } = require('../cloud/profile-data');
const { clearFirefoxProfileLaunchData, enforceDataRetentionFirefox } = require('../../engine/start-firefox');
const { normalizeDefaultPreferences, preference, ipChangePolicy, allowGoogleLogin, DEFAULT_PREFERENCES } = require('../profile-defaults');
const { planMatrix } = require('../window-arrangement');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-browserdata-'));
  const exists = (file) => fs.access(file).then(() => true, () => false);
  const write = async (name, content = 'fixture') => { const file = path.join(root, name); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, content); return file; };
  try {
    const profileRoot = path.join(root, 'profile');
    await fs.mkdir(profileRoot);
    const places = new DatabaseSync(path.join(profileRoot, 'places.sqlite'));
    places.exec(`CREATE TABLE moz_places(id INTEGER PRIMARY KEY,url TEXT,visit_count INTEGER,last_visit_date INTEGER);
      CREATE TABLE moz_historyvisits(id INTEGER,place_id INTEGER);
      CREATE TABLE moz_bookmarks(id INTEGER PRIMARY KEY,guid TEXT,fk INTEGER);
      INSERT INTO moz_places VALUES(1,'https://bookmarked.test',4,123),(2,'https://history.test',1,456);
      INSERT INTO moz_historyvisits VALUES(1,1),(2,2);
      INSERT INTO moz_bookmarks VALUES(1,'root________',NULL),(2,'bookmarkguid',1);`);
    places.close();
    await enforceDataRetentionFirefox(profileRoot, { advanced: { saveHistory: false, saveBookmarks: true } });
    let db = new DatabaseSync(path.join(profileRoot, 'places.sqlite'));
    assert.equal(db.prepare('SELECT count(*) AS n FROM moz_bookmarks').get().n, 2);
    assert.equal(db.prepare('SELECT count(*) AS n FROM moz_historyvisits').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) AS n FROM moz_places').get().n, 1);
    db.exec('INSERT INTO moz_historyvisits VALUES(3,1)'); db.close();
    await enforceDataRetentionFirefox(profileRoot, { advanced: { saveBookmarks: false, saveHistory: true } });
    db = new DatabaseSync(path.join(profileRoot, 'places.sqlite'));
    assert.equal(db.prepare('SELECT count(*) AS n FROM moz_bookmarks').get().n, 1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM moz_historyvisits').get().n, 1); db.close();
    // Unknown schemas must preserve the shared DB and abort before deleting it.
    const unknown = path.join(root, 'unknown'); await fs.mkdir(unknown);
    db = new DatabaseSync(path.join(unknown, 'places.sqlite')); db.exec('CREATE TABLE unrelated(x)'); db.close();
    await assert.rejects(data.clearFirefoxPlaces(unknown, { history: true }), { code: 'FIREFOX_DATA_CLEANUP_FAILED' });
    assert.equal(await exists(path.join(unknown, 'places.sqlite')), true);
    const local = await write('profile/storage/default/https+++site.test/ls/data.sqlite');
    const indexed = await write('profile/storage/default/https+++site.test/idb/index.sqlite');
    await clearFirefoxProfileLaunchData(profileRoot, { advanced: { clearLocalStorageOnStart: true } });
    assert.equal(await exists(local), false); assert.equal(await exists(indexed), true);
    await write('profile/cookies.sqlite', 'cookie bytes'); await write('profile/cache2/entries');
    const engine = { profiles: new Map([['profile', { id: 'profile', engine: 'firefox', cookies: 'secret' }]]),
      profileRoot: () => profileRoot, persist: async () => {} };
    await store.clearProfileCacheAndCookies.call(engine, 'profile');
    assert.equal(await exists(path.join(profileRoot, 'cookies.sqlite')), false);
    assert.equal(await exists(path.join(profileRoot, 'cache2')), false);
    await write('profile/cookies.sqlite', 'backup cookie');
    await write('profile/logins.json', 'encrypted logins'); await write('profile/key4.db', 'key fixture');
    await write('profile/storage/default/https+++site.test/.metadata-v2', 'metadata');
    const files = await collectProfileDataFiles(profileRoot, { engine: 'firefox', advanced: {
      cloudBackup: true, syncPasswords: true, syncIndexedDB: true } });
    assert.ok(files['@firefox/cookies.sqlite']); assert.ok(files['@firefox/logins.json']);
    assert.ok(files['@firefox/storage/default/https+++site.test/idb/index.sqlite']);
    const restored = path.join(root, 'restored'); await fs.mkdir(restored);
    await restoreProfileDataFiles(restored, files);
    assert.equal(await fs.readFile(path.join(restored, 'cookies.sqlite'), 'utf8'), 'backup cookie');
    assert.equal(await exists(path.join(restored, 'Default/cookies.sqlite')), false);
    await assert.rejects(restoreProfileDataFiles(restored, { '@firefox/user.js': Buffer.from('bad').toString('base64') }));
    await write('profile/cookies.sqlite-wal', 'uncheckpointed');
    await assert.rejects(collectProfileDataFiles(profileRoot, { engine: 'firefox', advanced: { cloudBackup: true } }), { code: 'PROFILE_BACKUP_BUSY' });
    const cookie = { name: 'chip', value: 'v', domain: 'third.test', secure: true,
      partitionKey: { topLevelSite: 'https://parent.test', hasCrossSiteAncestor: true } };
    const json = await store.exportProfileCookies({ command: async () => ({ cookies: [cookie] }) });
    let imported;
    await store.importProfileCookies({ command: async (_method, params) => { imported = params.cookies; } }, json);
    assert.deepEqual(imported[0].partitionKey, cookie.partitionKey);
    await assert.rejects(store.importProfileCookies({ command: async () => {} }, JSON.stringify([{ ...cookie, partitionKey: { topLevelSite: 'file:///tmp', hasCrossSiteAncestor: true } }])));
    assert.deepEqual(normalizeDefaultPreferences(), DEFAULT_PREFERENCES);
    assert.equal(preference({ advanced: { openWorkbench: '2' } }, 'openWorkbench', { openWorkbench: false }), false);
    assert.equal(preference({ advanced: { openWorkbench: '1' } }, 'openWorkbench', { openWorkbench: false }), true);
    assert.equal(ipChangePolicy({advanced:{ipChangePolicy:'stop',ipChangeRemind:'0'}}), 'stop');
    assert.equal(ipChangePolicy({advanced:{ipChangePolicy:'patch',ipChangeRemind:'0'}}), 'patch');
    assert.equal(ipChangePolicy({advanced:{ipChangePolicy:'patch',ipChangeRemind:'1'}}), 'notify');
    assert.equal(allowGoogleLogin({advanced:{allowSignin:true}}), true);
    const bounds = planMatrix({ totalWindows: 4, rows: 2, cols: 2, gap: 20, workArea: { x: -1600, y: 0, width: 1600, height: 1000 } });
    assert.equal(bounds[1].left - bounds[0].left - bounds[0].width, 20);
    assert.equal(bounds[2].top - bounds[0].top - bounds[0].height, 20);
    assert.throws(() => planMatrix({ totalWindows: 5, rows: 2, cols: 2, workArea: { width: 1600, height: 1000 } }), /容量/);
    assert.throws(() => planMatrix({ totalWindows: 1, rows: 6, cols: 6, workArea: { width: 800, height: 600 } }), /空间/);
    const { buildImportedProfile, readImportFile, validateImportText, MAX_IMPORT_BYTES } = require('../../ui/ui-profile-commands');
    let read = false;
    await assert.rejects(readImportFile({ size: MAX_IMPORT_BYTES + 1, text: async () => { read = true; return ''; } }), /16 MiB/);
    assert.equal(read, false);
    assert.throws(() => validateImportText('汉'.repeat(6 * 1024 * 1024)), /16 MiB/);
    const importedProfile = buildImportedProfile({proxy:'socks5://base.test:1080',proxyId:'base',startUrl:'https://old.test',
      password:'legacy-secret',platform:{password:'secret',accounts:[{password:'other-account'}]},advanced:{startUrls:'https://old.test'}},
      {proxy:'Direct',startUrl:'https://new.test',password:''},{id:'imported',number:3});
    assert.equal(importedProfile.proxy,'Direct'); assert.equal(importedProfile.networkMode,'direct');
    assert.equal(importedProfile.password,'');assert.equal(importedProfile.platform.password,'');
    assert.deepEqual(importedProfile.platform.accounts,[]);assert.equal(importedProfile.advanced.startUrls,'https://new.test');
    const { ProfileRoutes } = require('../api/profile-routes');
    const rows = Array.from({ length: 5 }, (_, index) => ({ id: 'p' + index, name: 'Profile ' + index, port: 12345, running: true }));
    let queries = 0;
    const routes = new ProfileRoutes({ engine: { status: () => rows }, resolveProfileEndpoint: async () => { queries += 1; return 'ws://127.0.0.1:12345/devtools/browser/test'; } });
    const page = await routes.routeProfileList({ input: { page: 2, page_size: 2, include_debug_endpoints: false } });
    assert.deepEqual(page.data.list.map((p) => p.id), ['p2', 'p3']); assert.equal(page.data.total, 5); assert.equal(queries, 0);
    await routes.routeProfileList({ input: { page: 1, page_size: 2 } }); assert.equal(queries, 2);
    assert.equal((await routes.routeProfileList({ input: { page_size: 1001 } })).code, 400);
    const settings = require('../local-settings');
    process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
    settings.initLocalSettings({ file: path.join(root, 'settings.json'), defaultProfileDataRoot: path.join(root, 'profiles') });
    await settings.loadLocalSettings();
    await settings.saveLocalSettings({ defaultPreferences: { openWorkbench: false } });
    await settings.loadLocalSettings();
    assert.equal(settings.getLocalSettings().defaultPreferences.openWorkbench, false);
    assert.equal(settings.getLocalSettings().defaultPreferences.ipChangeRemind, true);
    await settings.saveLocalSettings({ defaultPreferences: { googleLogin: true } });
    const { BrowserEngine } = require('../../engine');
    const prefsRoot = path.join(root, 'signin-preferences');
    const signinProfile = { language: 'en-US', privacy: {}, advanced: { googleLogin: '2', allowSignin: false } };
    await BrowserEngine.prototype.applyProfilePreferences.call({}, prefsRoot, signinProfile);
    let signinPrefs = JSON.parse(await fs.readFile(path.join(prefsRoot, 'Default/Preferences'), 'utf8'));
    assert.equal(signinPrefs.signin.allowed, true);
    await settings.saveLocalSettings({ defaultPreferences: { googleLogin: false } });
    await BrowserEngine.prototype.applyProfilePreferences.call({}, prefsRoot, signinProfile);
    signinPrefs = JSON.parse(await fs.readFile(path.join(prefsRoot, 'Default/Preferences'), 'utf8'));
    assert.equal(signinPrefs.signin.allowed, false);
    console.log('BROWSER_DATA_OPTIMIZATION_SELFTEST OK (independent retention, rollback, site storage, cleanup, Firefox backup/restore/WAL, partitioned cookies, defaults, matrix)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
