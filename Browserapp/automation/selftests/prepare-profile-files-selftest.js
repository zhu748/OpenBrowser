'use strict';

// Exercise real pre-spawn file preparation on disposable profiles. Zoom and
// other managed settings must survive together while unrelated cleanup runs.

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { BrowserEngine } = require('../../engine.js');
const { applyDefaultSearchEngine } = require('../../engine/launch-preferences');
const { acquireProfileLock, isProfileLockOwner, lockPath, releaseProfileLock } = require('../isolation');

const proto = BrowserEngine.prototype;
const eng = {
  // applyProfilePreferences reads the extension assignment/registry maps when
  // pinning store extensions; empty maps keep the minimal-stub contract true.
  assignments: new Map(),
  extensions: new Map(),
  applyProfilePreferences: proto.applyProfilePreferences,
  enforceDataRetention: proto.enforceDataRetention, resetTabs: proto.resetTabs,
  clearProfileCache: proto.clearProfileCache, prepareProfileFilesForStart: proto.prepareProfileFilesForStart,
};
const profile = {
  language: 'ja-JP',
  advanced: { clearCacheOnStart: true, saveCookies: false, savePasswords: true, saveBookmarks: true,
    saveLocalStorage: true, saveIndexedDB: true, saveHistory: true, allowSignin: false, showBookmarkBar: false },
  privacy: { media: 'allow', geoMode: 'allow', fontMode: 'default' },
};

let passed = 0;
const ok = (n, c) => { assert.ok(c, n); passed++; };

async function oneRun(_i) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'prep-'));
  const def = path.join(root, 'Default');
  await fsp.mkdir(path.join(def, 'Network'), { recursive: true });
  await fsp.mkdir(path.join(def, 'Sessions'), { recursive: true });
  await fsp.mkdir(path.join(def, 'Cache'), { recursive: true });
  // Seed Preferences with values for both zoom and normal-exit settings.
  await fsp.writeFile(path.join(def, 'Preferences'), JSON.stringify({
    partition: { per_host_zoom_levels: { 'http://x': 2 } },
    browser: { default_zoom_level: 5 },
    profile: { exit_type: 'Crashed', exited_cleanly: false },
  }));
  await fsp.writeFile(path.join(def, 'Network', 'Cookies'), 'x');

  await eng.prepareProfileFilesForStart(root, profile, false);

  const prefs = JSON.parse(await fsp.readFile(path.join(def, 'Preferences'), 'utf8'));
  // Both zoom resets landed:
  const zoomOk = Object.keys(prefs.partition.per_host_zoom_levels).length === 0 && prefs.browser.default_zoom_level === 0;
  // Other managed preferences landed too:
  const prefOk = prefs.profile.exit_type === 'Normal' && prefs.profile.exited_cleanly === true
    && prefs.intl && prefs.intl.accept_languages === 'ja-JP,ja';
  // rm jobs ran:
  const tabsGone = !fs.existsSync(path.join(def, 'Sessions'));
  const cacheGone = !fs.existsSync(path.join(def, 'Cache'));
  const cookieGone = !fs.existsSync(path.join(def, 'Network', 'Cookies'));
  await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
  return { zoomOk, prefOk, tabsGone, cacheGone, cookieGone };
}

function offlineStartEngine(tmp, emitted = []) {
  const engine = new BrowserEngine({ getPath: () => tmp });
  return Object.assign(engine, {
    emit: (message) => emitted.push(message), persist: async () => {},
    prepareProfileProxyForStart: async (item) => item, ensureExitNetworkForLocale: async () => {},
    kernelStatus: () => ({ installed: true }), chooseBrowser: () => ({ path: path.join(tmp, 'unused'), version: '128.0' }),
    drainProfileHelpers: async () => ({ known: true, pids: [] }),
    resolveStartupUrls: () => { throw Error('Failed preparation must stop before browser startup'); },
  });
}

async function postPrepOwnershipChange(tmp) {
  const engine = offlineStartEngine(tmp), id = 'prefs-ownership', root = engine.profileRoot(id);
  const history = path.join(root, 'Default', 'History');
  await fsp.mkdir(path.dirname(history), { recursive: true });
  await fsp.writeFile(history, 'retained');
  const entered = Promise.withResolvers(), release = Promise.withResolvers();
  let cleanupStarted = false;
  engine.cleanupStartupResources = (...args) => {
    cleanupStarted = true;
    return proto.cleanupStartupResources.apply(engine, args);
  };
  // A sync ownership check fails just after the first post-prep job starts.
  engine.prepareProfileFilesForStart = async (...args) => {
    await proto.prepareProfileFilesForStart.apply(engine, args);
    const set = engine.profiles.set.bind(engine.profiles);
    engine.profiles.set = (key, value) => {
      const result = set(key, value);
      engine.profileMaintenance.set(key, 'test-maintenance');
      return result;
    };
    engine.persist = async () => { entered.resolve(); await release.promise; };
  };
  const outcome = engine.start({ ...profile, id, name: id, advanced: { ...profile.advanced, clearHistoryOnStart: true } })
    .then(() => { throw Error('changed ownership must block launch'); }, (error) => error);
  try {
    await Promise.race([entered.promise, outcome.then(error => { throw error; })]);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(cleanupStarted, false, 'do not clean up while an already-started job is pending');
    assert.ok(fs.existsSync(lockPath(root)));
  } finally { release.resolve(); }
  assert.equal((await outcome).code, 'PROFILE_MAINTENANCE');
  assert.equal(await fsp.readFile(history, 'utf8'), 'retained', 'do not start additional mutations after ownership changes');
  assert.ok(!fs.existsSync(lockPath(root)));
}

async function preparationLeavesLockToOwner(tmp) {
  const id = 'prep-owned', root = path.join(tmp, id), file = lockPath(root);
  const owner = await acquireProfileLock(root, { profileId: id });
  const readFile = fsp.readFile, rm = fsp.rm, touched = [];
  fsp.readFile = (...args) => {
    if (args[0] === file) touched.push('read');
    return readFile(...args);
  };
  fsp.rm = (...args) => {
    if (args[0] === file) touched.push('remove');
    return rm(...args);
  };
  try {
    await eng.prepareProfileFilesForStart(root, { ...profile, id }, false);
    assert.deepEqual(touched, [], 'file preparation must leave application lock I/O to its owner');
    assert.ok(isProfileLockOwner(root, owner));
  } finally {
    fsp.readFile = readFile; fsp.rm = rm;
    assert.strictEqual(await releaseProfileLock(root, owner), true);
  }
}

async function preferenceReadFailures() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'preferences-errors-'));
  const readFile = fsp.readFile;
  const seed = JSON.stringify({ homepage: 'https://saved.example/', extensions: { pinned_extensions: ['kept'] } }, null, 2) + '\n';
  try {
    for (const [phase, input, code] of [
      ['profile', seed, 'EBUSY'], ['search', seed, 'EACCES'],
      ['profile', '{"truncated":', 'PROFILE_PREFERENCES_INVALID'],
      ['search', '  [1,2]  ', 'PROFILE_PREFERENCES_INVALID'],
      ['profile', 'null', 'PROFILE_PREFERENCES_INVALID'],
      ['search', Buffer.from([123, 34, 107, 34, 58, 34, 255, 34, 125]), 'PROFILE_PREFERENCES_INVALID'],
    ]) {
      const emitted = [];
      const engine = offlineStartEngine(tmp, emitted);
      const id = 'prefs-case';
      const root = engine.profileRoot(id), file = path.join(root, 'Default', 'Preferences');
      let failRead = false, before;
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, seed);
      // Real prep would discard these session/cookie files and change Local
      // State. On an initial Preferences error, none of that work is allowed.
      const sentinels = [
        [path.join(root, 'Default', 'Sessions', 'Tabs_1'), 'saved tabs'],
        [path.join(root, 'Default', 'Network', 'Cookies'), 'saved cookies'],
        [path.join(root, 'Local State'), '{"unchanged": true}\n'],
      ];
      if (phase === 'profile') {
        for (const [target, value] of sentinels) {
          await fsp.mkdir(path.dirname(target), { recursive: true });
          await fsp.writeFile(target, value);
        }
      }
      async function armFault() {
        if (code === 'PROFILE_PREFERENCES_INVALID') await fsp.writeFile(file, input);
        before = await readFile(file);
        failRead = code !== 'PROFILE_PREFERENCES_INVALID';
      }
      engine.prepareProfileFilesForStart = async (...args) => {
        if (phase === 'profile') await armFault();
        const result = await proto.prepareProfileFilesForStart.apply(engine, args);
        if (phase === 'search') await armFault();
        return result;
      };
      fsp.readFile = async (target, ...args) => {
        if (target === file && failRead) {
          failRead = false; // Even a single failed read must not authorize a replacement.
          throw Object.assign(new Error(code + ': Preferences unavailable'), { code });
        }
        return readFile(target, ...args);
      };
      await assert.rejects(engine.start({ ...profile, id, name: id, engine: 'chromium', privacy: { ...profile.privacy, searchEngine: 'bing' } }), { code });
      assert.deepStrictEqual(await readFile(file), before, phase + ' failure changed the existing bytes');
      if (phase === 'profile') {
        for (const [target, value] of sentinels) assert.equal(await readFile(target, 'utf8'), value);
      }
      assert.ok(emitted.some((event) => event.type === 'profile-file-sync-error' && event.id === id
        && event.code === code && event.issues?.length), 'a concrete Preferences issue must reach the caller');
      assert.ok(!fs.existsSync(lockPath(root)), 'startup lock released for retry');
      fsp.readFile = readFile;
    }
    const firstRun = path.join(tmp, 'fresh');
    assert.strictEqual(await applyDefaultSearchEngine(firstRun, 'bing'), true);
    await eng.prepareProfileFilesForStart(firstRun, profile, false);
    const fresh = JSON.parse(await readFile(path.join(firstRun, 'Default', 'Preferences'), 'utf8'));
    assert.equal(fresh.default_search_provider_data.template_url_data.keyword, 'bing.com');
    assert.equal(fresh.profile.exit_type, 'Normal');
    // Simulate a path validation error at the filesystem boundary, before
    // read or just before staging a replacement. Never use a real invalid path.
    const lstat = fsp.lstat, file = path.join(firstRun, 'Default', 'Preferences');
    const before = await readFile(file);
    for (const update of [
      () => eng.applyProfilePreferences(firstRun, profile),
      () => applyDefaultSearchEngine(firstRun, 'google'),
    ]) {
      for (const denyAfterRead of [false, true]) {
        let wasRead = false;
        fsp.readFile = async (target, ...args) => {
          if (target === file) wasRead = true;
          return readFile(target, ...args);
        };
        fsp.lstat = async (target, ...args) => {
          if (target === file && (!denyAfterRead || wasRead)) throw Object.assign(Error('fixture: path cannot be validated'), { code: 'EPERM' });
          return lstat(target, ...args);
        };
        try {
          await assert.rejects(update(), { code: 'EPERM' });
          assert.equal(wasRead, denyAfterRead);
          assert.deepStrictEqual(await readFile(file), before);
        } finally { fsp.readFile = readFile; fsp.lstat = lstat; }
      }
    }
    await preparationLeavesLockToOwner(tmp);
    await postPrepOwnershipChange(tmp);
    console.log('  PASS  creation, failure preservation, path validation, and independent lock ownership');
  } finally {
    fsp.readFile = readFile;
    await fsp.rm(tmp, { recursive: true, force: true });
  }
}

(async () => {
  await preferenceReadFailures();
  const N = 60;
  let allZoom = true, allPref = true, allTabs = true, allCache = true, allCookie = true;
  for (let i = 0; i < N; i++) {
    const r = await oneRun(i);
    allZoom &&= r.zoomOk; allPref &&= r.prefOk; allTabs &&= r.tabsGone; allCache &&= r.cacheGone; allCookie &&= r.cookieGone;
  }
  ok(`[x${N}] resetZoom changes survive`, allZoom);
  ok(`[x${N}] applyProfilePreferences changes survive (NO lost update)`, allPref);
  ok(`[x${N}] resetTabs removed Sessions`, allTabs);
  ok(`[x${N}] clearProfileCache removed Cache`, allCache);
  ok(`[x${N}] enforceDataRetention removed Cookies`, allCookie);
  console.log(`  PASS  all ${N} parallel runs kept zoom and profile settings and completed cleanup`);
  console.log(`\nprepare-profile-files test: ${passed} checks passed (x${N} iterations).`);
  process.exit(0);
})().catch((e) => { console.error('TEST ERROR:', e); process.exit(1); });
