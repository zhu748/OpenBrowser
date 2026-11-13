'use strict';

// Browser-specific disk layouts. Legacy backup keys remain Chromium-relative;
// Firefox keys carry a reserved prefix so restore never guesses the engine.
const fs = require('node:fs/promises');
const path = require('node:path');
const { assertSafeProfileChild } = require('./isolation');
const FIREFOX_PREFIX = '@firefox/';
const sqliteFiles = (name) => [name, name + '-wal', name + '-shm', name + '-journal'];
const FIREFOX_COOKIES = sqliteFiles('cookies.sqlite');
const FIREFOX_PASSWORDS = ['logins.json', 'logins-backup.json', ...sqliteFiles('key4.db')];
const FIREFOX_PLACES = sqliteFiles('places.sqlite');
const FIREFOX_LOCAL_STORAGE = sqliteFiles('webappsstore.sqlite');

function isFirefoxProfile(profile = {}) {
  return profile.engine === 'firefox' || /firefox/i.test(String(profile.browser || ''));
}

async function removeBrowserFiles(root, names) {
  for (const name of names) {
    const target = await assertSafeProfileChild(root, path.join(root, name));
    await fs.rm(target, { recursive: true, force: true });
  }
}

async function firefoxOrigins(root) {
  const directory = await assertSafeProfileChild(root, path.join(root, 'storage', 'default'));
  try {
    return (await fs.readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => path.join('storage', 'default', entry.name));
  } catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}

async function clearFirefoxLocalStorage(root) {
  await removeBrowserFiles(root, FIREFOX_LOCAL_STORAGE);
  for (const origin of await firefoxOrigins(root)) await removeBrowserFiles(root, [path.join(origin, 'ls')]);
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

async function browserBackupCandidates(root, profile) {
  const a = profile.advanced || {};
  const firefox = isFirefoxProfile(profile);
  const names = [];
  const add = (...values) => names.push(...values);
  if (firefox) {
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
    if (a.syncHistory) add(...FIREFOX_PLACES);
    return names.map((name) => [FIREFOX_PREFIX + name.replace(/\\/g, '/'), path.join(root, name)]);
  }
  if (a.syncCookiesOnClose !== false || a.saveCookies !== false) add('Network/Cookies', 'Network/Cookies-journal');
  if (a.syncLocalStorage) add('Local Storage');
  if (a.syncIndexedDB) add('IndexedDB');
  if (a.syncPasswords) add('Login Data', 'Login Data-journal');
  if (a.syncExtensionData) add('Local Extension Settings', 'Extension State');
  return names.map((name) => [name, path.join(root, 'Default', name)]);
}

function isFirefoxBackupPath(relative) {
  return [...FIREFOX_COOKIES, ...FIREFOX_PASSWORDS, ...FIREFOX_LOCAL_STORAGE, ...FIREFOX_PLACES, ...sqliteFiles('storage.sqlite')].includes(relative)
    || relative.startsWith('storage/default/') || relative.startsWith('browser-extension-data/');
}

module.exports = { FIREFOX_PREFIX, FIREFOX_COOKIES, FIREFOX_PASSWORDS, FIREFOX_LOCAL_STORAGE,
  isFirefoxProfile, removeBrowserFiles, clearFirefoxLocalStorage, clearFirefoxPlaces, clearBrowserCache,
  browserBackupCandidates, isFirefoxBackupPath };
