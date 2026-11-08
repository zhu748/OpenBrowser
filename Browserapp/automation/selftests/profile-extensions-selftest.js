#!/usr/bin/env node
'use strict';

/**
 * In-browser extension installation selftest.
 *
 * Mainstream fingerprint browsers let users install extensions *inside* the
 * browser (Chrome Web Store "Add to Chrome", Firefox AMO) and keep those
 * installs across restarts. This suite locks in the three invariants that
 * make that work here, so a future "hardening" or perf change cannot silently
 * break it:
 *
 *   1. Launch surfaces never carry blocking switches. No --disable-extensions
 *      / --disable-extensions-except anywhere in the arg builders, no
 *      -safe-mode, and the Firefox user.js never sets install-gating prefs
 *      (xpinstall.signatures.required / extensions.autoDisableScopes /
 *      extensions.enabledScopes).
 *   2. Profile prep merges instead of clobbering. applyProfilePreferences is a
 *      read-modify-write on Default/Preferences, so the extensions.settings
 *      bookkeeping a store install writes survives; enforceDataRetention /
 *      clearProfileCache / resetTabs never touch Default/Extensions.
 *   3. The Firefox pipeline launches the same persistent profile root, and
 *      mergeLoadExtensionArgs only ever appends --load-extension=.
 */

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

const appRoot = path.join(__dirname, '..', '..');
const { BrowserEngine } = require('../../engine.js');
const kv = require('../../automation/kernel-versions');
const { mergeLoadExtensionArgs } = require('../../automation/protocol/app-center-protocol');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}: ${error.message}`);
  }
}

// ---------- A. source scan: launch surfaces must not block extensions ----------
const scanFiles = [
  'engine/start.js',
  'engine/start-firefox.js',
  'automation/kernel-versions.js',
  'automation/command-line-flags.js',
  'automation/protocol/app-center-protocol.js',
  ...fs.readdirSync(path.join(appRoot, 'automation', 'fingerprint'))
    .filter((name) => name.endsWith('.js'))
    .map((name) => path.join('automation', 'fingerprint', name)),
].map((rel) => path.join(appRoot, rel));

// '--disable-extensions' also covers the -except variant by prefix; these
// switches would kill in-browser store installs at spawn time.
const forbiddenLaunchTokens = [
  '--disable-extensions',
  'xpinstall.signatures.required',
  'extensions.autoDisableScopes',
  'extensions.enabledScopes',
  '-safe-mode',
];

check('A1. no arg/user.js builder mentions an extension-blocking switch', () => {
  for (const file of scanFiles) {
    const src = fs.readFileSync(file, 'utf8');
    for (const token of forbiddenLaunchTokens) {
      assert.ok(!src.includes(token), `${path.relative(appRoot, file)} contains ${token}`);
    }
  }
});

// ---------- B. Chromium: profile prep keeps store-install state intact ----------
const proto = BrowserEngine.prototype;
// Methods under test use no `this` state besides an optional emit().
const stub = { emit() {} };

const STORE_ID = 'abcdefghijklmnopabcdefghijklmnop'; // 32 a-p chars, like a webstore id
const seededSettings = {
  [STORE_ID]: {
    from_webstore: true,
    state: 1,
    location: 1,
    path: 'Default/Extensions/STORE_MARKER',
    manifest: { name: 'Store Installed', version: '1.2.3', manifest_version: 3 },
  },
};
const seededSecure = { extensions: { settings: { component: { state: 1 } } }, other: { keep: true } };

async function seedProfileRoot() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'profext-'));
  const def = path.join(root, 'Default');
  // Payload a store install leaves on disk: the code directory + Preferences keys.
  const extDir = path.join(def, 'Extensions', STORE_ID, '1.2.3');
  await fsp.mkdir(extDir, { recursive: true });
  await fsp.writeFile(path.join(extDir, 'manifest.json'), '{"name":"Store Installed","version":"1.2.3"}');
  await fsp.writeFile(path.join(extDir, '_locales'), 'binary payload');
  // Retention targets (so the deletion jobs really run against something).
  await fsp.mkdir(path.join(def, 'Network'), { recursive: true });
  await fsp.writeFile(path.join(def, 'Network', 'Cookies'), 'x');
  await fsp.writeFile(path.join(def, 'Network', 'Cookies-journal'), 'x');
  for (const name of ['Login Data', 'Login Data-journal', 'Bookmarks', 'History', 'History-journal', 'Visited Links', 'Top Sites']) {
    await fsp.writeFile(path.join(def, name), 'x');
  }
  await fsp.mkdir(path.join(def, 'Local Storage'), { recursive: true });
  await fsp.mkdir(path.join(def, 'IndexedDB'), { recursive: true });
  // Session + cache targets for resetTabs / clearProfileCache.
  await fsp.mkdir(path.join(def, 'Sessions'), { recursive: true });
  await fsp.writeFile(path.join(def, 'Current Session'), 'x');
  for (const name of ['Cache', 'Code Cache', 'GPUCache']) await fsp.mkdir(path.join(def, name), { recursive: true });
  await fsp.mkdir(path.join(def, 'Service Worker', 'CacheStorage'), { recursive: true });
  // Preferences carries the install bookkeeping; Secure Preferences is where
  // component-extension state lives. Both must come back byte-identical.
  await fsp.writeFile(path.join(def, 'Preferences'), JSON.stringify({
    extensions: { settings: seededSettings },
    profile: { exit_type: 'Crashed', exited_cleanly: false },
    partition: { per_host_zoom_levels: { 'http://x': 2 } },
    browser: { default_zoom_level: 5 },
  }));
  await fsp.writeFile(path.join(def, 'Secure Preferences'), JSON.stringify(seededSecure));
  return { root, def, extDir };
}

// One profile with every retention toggle off: enforceDataRetention then runs
// its maximal deletion set, which is exactly when Extensions must stay safe.
const retentionOffProfile = {
  language: 'en-US',
  advanced: {
    saveCookies: false, savePasswords: false, saveBookmarks: false, saveLocalStorage: false,
    saveIndexedDB: false, saveHistory: false, blockImages: false, blockSound: false,
    blockNotifications: false, blockPopups: false, blockPasswordPrompt: false,
    blockRestoreDialog: true, tabMode: 'fixed', restoreSession: false,
    allowSignin: false, showBookmarkBar: false,
  },
  privacy: { media: 'real', geoMode: 'ip', fontMode: 'default' },
};

async function assertStoreStateIntact(root, def, phase) {
  const manifest = await fsp.readFile(path.join(def, 'Extensions', STORE_ID, '1.2.3', 'manifest.json'), 'utf8');
  assert.strictEqual(manifest, '{"name":"Store Installed","version":"1.2.3"}', `${phase}: extension payload rewritten`);
  const payload = await fsp.readFile(path.join(def, 'Extensions', STORE_ID, '1.2.3', '_locales'), 'utf8');
  assert.strictEqual(payload, 'binary payload', `${phase}: extension payload rewritten`);
  const prefs = JSON.parse(await fsp.readFile(path.join(def, 'Preferences'), 'utf8'));
  assert.deepStrictEqual(prefs.extensions.settings, seededSettings, `${phase}: extensions.settings lost from Preferences`);
  assert.strictEqual(prefs.profile.exit_type, 'Normal', `${phase}: applyProfilePreferences did not run (marker)`);
  const secure = JSON.parse(await fsp.readFile(path.join(def, 'Secure Preferences'), 'utf8'));
  assert.deepStrictEqual(secure, seededSecure, `${phase}: Secure Preferences clobbered`);
}

async function sectionB() {
  const { root, def } = await seedProfileRoot();

  // The exact prep sequence prepareProfileFilesForStart runs before spawn.
  await proto.applyProfilePreferences.call(stub, root, retentionOffProfile);
  await assertStoreStateIntact(root, def, 'after applyProfilePreferences');

  await proto.enforceDataRetention.call(stub, root, retentionOffProfile);
  // Deletion really ran (guards against the test passing vacuously)...
  for (const gone of ['Network/Cookies', 'Login Data', 'Bookmarks', 'Local Storage', 'IndexedDB', 'History']) {
    const target = path.join(def, ...gone.split('/'));
    assert.ok(!fs.existsSync(target), `retention failed to delete ${gone} (vacuous test)`);
  }
  await assertStoreStateIntact(root, def, 'after enforceDataRetention (max deletion)');

  await proto.clearProfileCache.call(stub, root);
  assert.ok(!fs.existsSync(path.join(def, 'Cache')), 'clearProfileCache failed (vacuous test)');
  await assertStoreStateIntact(root, def, 'after clearProfileCache');

  await proto.resetTabs.call(stub, root);
  assert.ok(!fs.existsSync(path.join(def, 'Sessions')), 'resetTabs failed (vacuous test)');
  await assertStoreStateIntact(root, def, 'after resetTabs');

  // Second launch on the same root: prep is idempotent, installs still intact.
  await proto.applyProfilePreferences.call(stub, root, retentionOffProfile);
  await assertStoreStateIntact(root, def, 'after second-launch prep');
  await fsp.rm(root, { recursive: true, force: true });
}
// ---------- C. Firefox + merge helpers ----------
check('C1. buildFirefoxUserJs contains no install-gating pref', () => {
  const userJs = kv.buildFirefoxUserJs({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
    acceptLanguages: 'en-US,en;q=0.9',
    locale: 'en-US',
    proxyEndpoint: 'socks5://127.0.0.1:1080',
    noProxyHosts: 'localhost, 127.0.0.1',
  });
  for (const token of forbiddenLaunchTokens.slice(1)) {
    assert.ok(!userJs.includes(token), `user.js sets ${token}`);
  }
  // The managed-kernel prefs that DO exist are about updates/telemetry, never installs.
  assert.ok(userJs.includes('user_pref("extensions.update.enabled", false)'), 'expected benign extensions.update.enabled pref');
});

check('C2. firefoxStartupArgs: persistent -profile, --no-remote, never -safe-mode', () => {
  const args = kv.firefoxStartupArgs({ root: '/tmp/ff-root', startUrl: 'https://example.com/', headless: false });
  assert.deepStrictEqual(args, ['-profile', '/tmp/ff-root', '--no-remote', 'https://example.com/']);
  assert.ok(!args.some((a) => a.includes('-safe-mode')), 'safe-mode would disable all extensions for the session');
  const headless = kv.firefoxStartupArgs({ root: '/tmp/ff-root', startUrl: 'https://example.com/', headless: true });
  assert.ok(headless.includes('-headless'));
  assert.ok(!headless.some((a) => a.includes('-safe-mode')), 'headless variant must not add -safe-mode');
});

check('C3. mergeLoadExtensionArgs appends --load-extension= and never a disable flag', () => {
  const merged = mergeLoadExtensionArgs(['--foo', '--bar'], ['/tmp/a', '/tmp/b']);
  assert.deepStrictEqual(merged, ['--foo', '--bar', '--load-extension=/tmp/a,/tmp/b']);
  assert.ok(!merged.some((a) => String(a).startsWith('--disable-extensions')), 'merge must never disable extensions');
  const dedup = mergeLoadExtensionArgs(['--load-extension=/tmp/a'], ['/tmp/a', '/tmp/c']);
  assert.deepStrictEqual(dedup, ['--load-extension=/tmp/a,/tmp/c'], 'dedupe preserves existing paths');
});

// ---------- run ----------
(async () => {
  await check('B. profile prep never disturbs store-installed extensions (max-retention run + relaunch)', sectionB);
  const total = passed + failed;
  console.log(`profile-extensions-selftest: ${passed} passed, ${failed} failed (${total} checks)`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error('profile-extensions-selftest: fatal', error);
  process.exit(1);
});
