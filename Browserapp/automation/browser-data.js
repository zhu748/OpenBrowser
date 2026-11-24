'use strict';

// Browser-specific disk layouts. Legacy backup keys remain Chromium-relative;
// Firefox keys carry a reserved prefix so restore never guesses the engine.
const fs = require('node:fs/promises');
const path = require('node:path');
const { assertSafeProfileChild, lockPath } = require('./isolation');
const FIREFOX_PREFIX = '@firefox/';
const sqliteFiles = (name) => [name, name + '-wal', name + '-shm', name + '-journal'];
const FIREFOX_COOKIES = sqliteFiles('cookies.sqlite');
const FIREFOX_LOGINS = ['logins.json', 'logins-backup.json'];
// Login backups need the decryption key. Deleting saved logins must not
// delete the shared NSS key database (which can also hold certificate keys).
const FIREFOX_PASSWORDS = [...FIREFOX_LOGINS, ...sqliteFiles('key4.db')];
const FIREFOX_PLACES = sqliteFiles('places.sqlite');
const FIREFOX_PLACES_BACKUP = FIREFOX_PREFIX + FIREFOX_PLACES[0];
const FIREFOX_LOCAL_STORAGE = sqliteFiles('webappsstore.sqlite');

function firefoxPlacesBackupPolicy(profile = {}) {
  const a = profile.advanced || {};
  const history = a.syncHistory === true;
  const bookmarks = a.uploadBookmarks === true;
  return {
    include: history && bookmarks,
    warning: history !== bookmarks ? {
      path: FIREFOX_PLACES_BACKUP,
      reason: history ? 'firefox-places-history-only-unsupported' : 'firefox-places-bookmarks-only-unsupported',
    } : null,
  };
}

function isFirefoxPlacesBackupPath(relative) {
  const normalized = relative.replace(/\\/g, '/');
  return normalized.startsWith(FIREFOX_PREFIX) && FIREFOX_PLACES.includes(normalized.slice(FIREFOX_PREFIX.length));
}

// This format carries one self-contained History DB, never a separately
// size-limited journal/WAL. A stopped browser may still have recovery data
// after a crash. Never combine it with a different History file on restore.
async function assertChromiumHistoryQuiescent(root, restoring = false) {
  const busyCode = restoring ? 'PROFILE_RESTORE_BUSY' : 'PROFILE_BACKUP_BUSY';
  // The engine maintenance lease covers this process only. Refuse even an
  // apparently stale lock; recovery/ownership belongs to the launcher.
  const lock = await assertSafeProfileChild(root, lockPath(root));
  try {
    await fs.lstat(lock);
    throw Object.assign(new Error('环境仍持有浏览器锁，请先正常关闭环境再重试。'), { code: busyCode });
  } catch (err) { if (err.code !== 'ENOENT') throw err; }
  for (const suffix of ['-wal', '-shm', '-journal']) {
    const file = await assertSafeProfileChild(root, path.join(root, 'Default', 'History' + suffix));
    let stat;
    try { stat = await fs.lstat(file); } catch (err) { if (err.code === 'ENOENT') continue; throw err; }
    if (stat.isFile() && stat.size === 0) continue;
    if (stat.isFile() && suffix === '-journal' && stat.size >= 8) {
      // SQLite PERSIST mode keeps the journal but zeros its header on commit.
      const handle = await fs.open(file, 'r');
      try {
        const header = Buffer.alloc(8);
        const { bytesRead } = await handle.read(header, 0, 8, 0);
        if (bytesRead === 8 && header.every((byte) => byte === 0)) continue;
      } finally { await handle.close(); }
    }
    throw Object.assign(new Error('历史记录数据库可能有未完成的事务，请先打开并正常关闭该环境再重试。'), {
      code: busyCode,
    });
  }
}

function isFirefoxProfile(profile = {}) {
  return profile.engine === 'firefox' || /firefox/i.test(String(profile.browser || ''));
}

async function removeBrowserFiles(root, names) {
  for (const name of names) {
    const target = await assertSafeProfileChild(root, path.join(root, name));
    await fs.rm(target, { recursive: true, force: true });
  }
}

async function firefoxOrigins(root, repository = 'default') {
  const directory = await assertSafeProfileChild(root, path.join(root, 'storage', repository));
  try {
    return (await fs.readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => path.join('storage', repository, entry.name));
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function clearFirefoxSiteStorage(root, { localStorage = false, indexedDB = false } = {}) {
  if (!localStorage && !indexedDB) return;
  if (localStorage) {
    // The legacy shadow database and migration archive can repopulate LS.
    await removeBrowserFiles(root, [...FIREFOX_LOCAL_STORAGE,
      ...sqliteFiles('storage/ls-archive.sqlite'), ...sqliteFiles('storage/ls-archive-tmp.sqlite')]);
  }
  for (const repository of ['default', 'permanent', 'temporary', 'private']) {
    for (const origin of await firefoxOrigins(root, repository)) {
      // System and extension databases are browser/add-on state, not site data.
      if (/^chrome(?:\^|$)|^(?:about|moz-safe-about|chrome|resource|moz-extension)\+/i.test(path.basename(origin))) continue;
      if (localStorage) await removeBrowserFiles(root, [path.join(origin, 'ls')]);
      if (indexedDB) await removeBrowserFiles(root, [path.join(origin, 'idb')]);
    }
  }
}

async function enforceDataRetentionFirefox(root, profile) {
  const a = profile?.advanced || {};
  if (a.saveCookies === false) await removeBrowserFiles(root, FIREFOX_COOKIES);
  if (a.savePasswords === false) await removeBrowserFiles(root, FIREFOX_LOGINS);
  await clearFirefoxPlaces(root, { history: a.saveHistory === false, bookmarks: a.saveBookmarks === false });
  await clearFirefoxSiteStorage(root, { localStorage: a.saveLocalStorage === false, indexedDB: a.saveIndexedDB === false });
}

/** Preserve the shared Places store when only one data category is cleared.
 * Unsupported schemas/triggers fail the transaction and abort launch, keeping
 * the original data intact instead of falling back to deleting the database. */
async function clearFirefoxPlaces(root, { history = false, bookmarks = false } = {}) {
  if (!history && !bookmarks) return;
  if (history && bookmarks) {
    await removeBrowserFiles(root, [...FIREFOX_PLACES, 'bookmarkbackups', 'bookmarks.json']);
    return;
  }
  const file = await assertSafeProfileChild(root, path.join(root, 'places.sqlite'));
  try { await fs.access(file); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA busy_timeout=3000; BEGIN IMMEDIATE');
    const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name));
    if (history) {
      if (!tables.has('moz_historyvisits')) throw new Error('Unsupported Firefox history schema');
      db.exec('DELETE FROM moz_historyvisits');
      if (tables.has('moz_inputhistory')) db.exec('DELETE FROM moz_inputhistory');
      if (tables.has('moz_places')) {
        const columns = new Set(db.prepare('PRAGMA table_info(moz_places)').all().map((row) => row.name));
        const resets = ['visit_count=0', 'last_visit_date=NULL', 'typed=0', 'frecency=-1']
          .filter((expression) => columns.has(expression.split('=')[0]));
        if (resets.length) db.exec('UPDATE moz_places SET ' + resets.join(','));
        if (tables.has('moz_bookmarks')) db.exec('DELETE FROM moz_places WHERE NOT EXISTS (SELECT 1 FROM moz_bookmarks WHERE fk=moz_places.id)');
      }
    }
    if (bookmarks) {
      if (!tables.has('moz_bookmarks')) throw new Error('Unsupported Firefox bookmarks schema');
      // Keep Firefox's permanent root folders; user folders and their children
      // are removed in the same transaction. History rows remain untouched.
      db.exec("DELETE FROM moz_bookmarks WHERE guid NOT IN ('root________','menu________','toolbar_____','unfiled_____','mobile______','tags________')");
    }
    db.exec('COMMIT');
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    throw Object.assign(new Error('Firefox 数据清理失败，原始书签与历史已保留：' + error.message, { cause: error }), { code: 'FIREFOX_DATA_CLEANUP_FAILED' });
  } finally { db.close(); }
  if (bookmarks) await removeBrowserFiles(root, ['bookmarkbackups', 'bookmarks.json']);
}

async function clearBrowserCache(root, profile = {}) {
  await removeBrowserFiles(root, isFirefoxProfile(profile)
    ? ['cache2', 'startupCache', 'shader-cache']
    : ['OpenBrowserCache', 'Default/Cache', 'Default/Code Cache', 'Default/GPUCache', 'Default/Service Worker/CacheStorage']);
}

async function browserBackupCandidates(root, profile, { onSkipped } = {}) {
  const a = profile.advanced || {};
  const firefox = isFirefoxProfile(profile);
  const names = [];
  const add = (...values) => names.push(...values);
  if (firefox) {
    // Places cannot be split/replaced by category without rewriting the shared
    // schema. Do not copy a category the user did not select.
    const places = firefoxPlacesBackupPolicy(profile);
    if (places.warning) onSkipped?.(places.warning);
    if (a.syncCookiesOnClose !== false || a.saveCookies !== false) add(...FIREFOX_COOKIES);
    if (a.syncPasswords) add(...FIREFOX_PASSWORDS);
    if (a.syncLocalStorage) add(...FIREFOX_LOCAL_STORAGE);
    if (a.syncLocalStorage || a.syncIndexedDB || a.syncExtensionData) {
      add(...sqliteFiles('storage.sqlite'));
      for (const origin of await firefoxOrigins(root)) {
        add(path.join(origin, '.metadata-v2'));
        if (a.syncLocalStorage || a.syncExtensionData && origin.includes('moz-extension')) add(path.join(origin, 'ls'));
        if (a.syncIndexedDB || a.syncExtensionData && origin.includes('moz-extension')) add(path.join(origin, 'idb'));
      }
    }
    if (a.syncExtensionData) add('browser-extension-data');
    if (places.include) add(...FIREFOX_PLACES);
    return names.map((name) => [FIREFOX_PREFIX + name.replace(/\\/g, '/'), path.join(root, name)]);
  }
  if (a.syncCookiesOnClose !== false || a.saveCookies !== false) add('Network/Cookies', 'Network/Cookies-journal');
  if (a.syncLocalStorage) add('Local Storage');
  if (a.syncIndexedDB) add('IndexedDB');
  if (a.syncHistory) {
    await assertChromiumHistoryQuiescent(root);
    add('History');
  }
  if (a.syncPasswords) add('Login Data', 'Login Data-journal');
  if (a.syncExtensionData) add('Local Extension Settings', 'Extension State');
  return names.map((name) => [name, path.join(root, 'Default', name)]);
}

function isFirefoxBackupPath(relative) {
  return [...FIREFOX_COOKIES, ...FIREFOX_PASSWORDS, ...FIREFOX_LOCAL_STORAGE, ...FIREFOX_PLACES, ...sqliteFiles('storage.sqlite')].includes(relative)
    || relative.startsWith('storage/default/') || relative.startsWith('browser-extension-data/');
}

module.exports = { FIREFOX_PREFIX, FIREFOX_COOKIES, FIREFOX_PASSWORDS, FIREFOX_LOCAL_STORAGE, FIREFOX_PLACES_BACKUP,
  isFirefoxProfile, removeBrowserFiles, clearFirefoxSiteStorage, enforceDataRetentionFirefox, clearFirefoxPlaces, clearBrowserCache,
  browserBackupCandidates, isFirefoxBackupPath, isFirefoxPlacesBackupPath, firefoxPlacesBackupPolicy, assertChromiumHistoryQuiescent };
