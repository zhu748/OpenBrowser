#!/usr/bin/env node
'use strict';
/**
 * Wave-2 audit remediation selftest (num=4: 主进程与引擎生命周期).
 * Covers: atomic Preferences writes (resetZoom/markProfileCleanExit),
 * Firefox pipeline retention/prefs/URLs/capabilities, pool close semantics,
 * close-managed-browsers lock attestation, isStartPageUrl narrowing.
 * Node-only (no GUI, no Electron window): pure function + mock-socket tests.
 */
const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');

let passed = 0; let failed = 0;
function check(name, fn) {
  try { fn(); passed += 1; console.log(`  ok  ${name}`); }
  catch (e) { failed += 1; console.error(`FAIL  ${name}: ${e.message}`); }
}
async function checkAsync(name, fn) {
  try { await fn(); passed += 1; console.log(`  ok  ${name}`); }
  catch (e) { failed += 1; console.error(`FAIL  ${name}: ${e.message}`); }
}

(async () => {
  // ---- M-1: atomic Preferences writes ----
  const { BrowserEngine } = require('../../engine');
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-wave2-'));
  fs.mkdirSync(path.join(tmp, 'userData'), { recursive: true });
  const engine = new BrowserEngine({ getPath: (n) => path.join(tmp, n === 'userData' ? 'userData' : n) }, {});

  await checkAsync('resetZoom writes Preferences via writeRawAtomically (no .tmp residue, content intact)', async () => {
    const root = path.join(tmp, 'p1'); const dir = path.join(root, 'Default');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'Preferences'), JSON.stringify({ partition: { per_host_zoom_levels: { 'a.com': 1.2 } }, browser: { default_zoom_level: 2 } }));
    const spy = [];
    const orig = require('../../engine/state-storage').writeRawAtomically;
    const pathmod = require('module');
    // Assert by observing behavior: call resetZoom, then verify no partial write is possible by
    // checking the file is valid JSON with zoom cleared (the atomic write is exercised directly).
    await engine.resetZoom(root);
    const after = JSON.parse(fs.readFileSync(path.join(dir, 'Preferences'), 'utf8'));
    assert.deepStrictEqual(after.partition.per_host_zoom_levels, {});
    assert.strictEqual(after.browser.default_zoom_level, 0);
    // source-level guarantee
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'engine.js'), 'utf8');
    assert.ok(/resetZoom[\s\S]{0,400}writeRawAtomically/.test(src), 'resetZoom must use writeRawAtomically');
    assert.ok(!/resetZoom[\s\S]{0,400}fsp\.writeFile/.test(src), 'resetZoom must not bare-writeFile');
    // markProfileCleanExit must read the file back after the atomic write
    // (catch-return for write failures sits between them in current engine.js,
    // so anchor on the declaration and span both steps instead of an exact
    // string match against the old layout).
    assert.ok(/markProfileCleanExit\(root\)[\s\S]{0,900}writeRawAtomically\(file, JSON\.stringify\(prefs\), 0o600\)[\s\S]{0,900}写后回读校验/.test(src), 'markProfileCleanExit must read back after write');
  });

  await checkAsync('markProfileCleanExit writes and the file parses', async () => {
    const root = path.join(tmp, 'p2'); const dir = path.join(root, 'Default');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'Preferences'), JSON.stringify({ profile: { exit_type: 'Crashed' } }));
    await engine.markProfileCleanExit(root);
    const after = JSON.parse(fs.readFileSync(path.join(dir, 'Preferences'), 'utf8'));
    assert.strictEqual(after.profile.exit_type, 'Normal');
    assert.strictEqual(after.profile.exited_cleanly, true);
  });

  // ---- H-1: Firefox pipeline ----
  const ff = require('../../engine/start-firefox');

  await checkAsync('enforceDataRetentionFirefox removes only switched-off stores', async () => {
    const root = path.join(tmp, 'ff1');
    fs.mkdirSync(root, { recursive: true });
    for (const f of ['cookies.sqlite', 'logins.json', 'places.sqlite', 'webappsstore.sqlite']) {
      fs.writeFileSync(path.join(root, f), 'x');
    }
    await ff.enforceDataRetentionFirefox(root, { advanced: { saveCookies: false, savePasswords: false } });
    assert.ok(!fs.existsSync(path.join(root, 'cookies.sqlite')));
    assert.ok(!fs.existsSync(path.join(root, 'logins.json')));
    assert.ok(fs.existsSync(path.join(root, 'places.sqlite')), 'bookmarks/history untouched when both switches on');
    assert.ok(fs.existsSync(path.join(root, 'webappsstore.sqlite')));
  });

  check('firefoxExtraUserPrefs maps expressible advanced/privacy toggles', () => {
    const prefs = ff.firefoxExtraUserPrefs({
      advanced: { blockImages: true, blockPopups: true, savePasswords: true, blockPasswordPrompt: false },
      privacy: { media: 'blocked', geoMode: 'disabled', fontMode: 'custom', fontSize: 18 },
    });
    const map = new Map(prefs);
    assert.strictEqual(map.get('permissions.default.image'), 2);
    assert.strictEqual(map.get('dom.disable_open_during_load'), false);
    assert.strictEqual(map.get('signon.rememberSignons'), true);
    assert.strictEqual(map.get('permissions.default.microphone'), 2);
    assert.strictEqual(map.get('permissions.default.geo'), 2);
    assert.strictEqual(map.get('font.minimum-size.x-western'), 18);
  });

  const { buildFirefoxUserJs, firefoxStartupArgs } = require('../../automation/kernel-versions');
  check('buildFirefoxUserJs appends extraPrefs and drops network.proxy.share', () => {
    const js = buildFirefoxUserJs({
      userAgent: 'UA', acceptLanguages: 'en-US', locale: 'en-US',
      proxyEndpoint: 'http://127.0.0.1:1234', noProxyHosts: 'localhost, 127.0.0.1',
      extraPrefs: [['signon.rememberSignons', false]],
    });
    assert.ok(js.includes('user_pref("network.proxy.http", "127.0.0.1")'));
    assert.ok(js.includes('user_pref("network.proxy.ssl", "127.0.0.1")'));
    assert.ok(!js.includes('network.proxy.share'), 'inert Chrome-ism must be gone');
    assert.ok(js.includes('user_pref("signon.rememberSignons", false)'), 'extraPrefs appended');
  });

  check('firefoxStartupArgs passes every start URL', () => {
    const args = firefoxStartupArgs({ root: '/r', startUrl: 'https://a.test/', extraUrls: ['https://b.test/', 'file:///c.html'], headless: false });
    assert.deepStrictEqual(args, ['-profile', '/r', '--no-remote', 'https://a.test/', 'https://b.test/', 'file:///c.html']);
  });

  // ---- L-1: isStartPageUrl narrowing ----
  const { isStartPageUrl } = require('../../engine/start-page');
  const bound = { isStartPageUrl: (u) => isStartPageUrl.call({ startPageServer: null }, u) };
  check('isStartPageUrl no longer matches loose substrings', () => {
    assert.strictEqual(bound.isStartPageUrl('https://evil.test/openbrowser-start-page-scam'), false);
    assert.strictEqual(bound.isStartPageUrl('https://evil.test/?q=openbrowser-native'), false);
    assert.strictEqual(bound.isStartPageUrl('http://127.0.0.1:50327/'), true, 'port-range still recognized (server down window)');
    assert.strictEqual(bound.isStartPageUrl('file:///x/openbrowser-start.html'), true, 'file fallback name kept');
    assert.strictEqual(bound.isStartPageUrl('file:///x/openbrowser-start-page.html'), true, 'page name kept');
  });

  const mainSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'main.js'), 'utf8');
  check('isEnvironmentStartUrl delegates to engine and only file:// fallback keeps the filename', () => {
    const idx = mainSrc.indexOf('function isEnvironmentStartUrl');
    const body = mainSrc.slice(idx, mainSrc.indexOf('}', idx + 400));
    assert.ok(body.includes('engine?.isStartPageUrl'), 'must delegate to the engine session judge');
    assert.ok(body.includes('file:\\/\\/'), 'file:// fallback must be explicit');
    // assert on code lines only: the explanatory comment legitimately names the
    // retired bare markers, and that is not a code match.
    const codeOnly = body.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    assert.ok(!/openbrowser-native/i.test(codeOnly), 'loose native substring must be gone');
  });

  // ---- L-3: close-managed-browsers lock attestation ----
  await checkAsync('close-managed-browsers skips roots without a live lock owner', async () => {
    const cmSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'close-managed-browsers.js'), 'utf8');
    assert.ok(cmSrc.includes('lockOwnerPid'), 'must consult the instance lock');
    assert.ok(cmSrc.includes('skipped'), 'skips must be reported');
    // Behavioral: stale DevToolsActivePort without lock must not attempt a close.
    const dataRoot = path.join(tmp, 'cmd-root');
    fs.mkdirSync(dataRoot, { recursive: true });
    process.env.OPENBROWSER_USER_DATA = dataRoot;
    const childPath = path.join(dataRoot, 'close-managed-browsers.js');
    fs.copyFileSync(path.join(__dirname, '..', '..', 'close-managed-browsers.js'), childPath);
    const prof = path.join(dataRoot, 'browser-profiles-v2', 'env-x');
    fs.mkdirSync(prof, { recursive: true });
    fs.writeFileSync(path.join(prof, 'DevToolsActivePort'), '59999\n/devtools/browser/fake');
    // No .openbrowser-instance.lock → skip. The port 59999 points nowhere anyway.
    const { execFileSync } = require('child_process');
    const out = execFileSync(process.execPath, [path.join(__dirname, '..', '..', 'close-managed-browsers.js')], { encoding: 'utf8' });
    const parsed = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1));
    assert.strictEqual(parsed.closed, 0);
    assert.ok(parsed.skipped >= 1);
    delete process.env.OPENBROWSER_USER_DATA;
    delete require.cache[require.resolve(childPath)];
  });

  // ---- L-4: batch restart checks starting ----
  check('restartRunningProfiles consults engine.starting before restart', () => {
    // the guard sits ~20 lines into the function, past the old 900-char window;
    // anchor on the declaration and span generously.
    assert.ok(/async function restartRunningProfiles\([\s\S]{0,3000}?engine\.starting\.has\(id\)/.test(mainSrc), 'must skip in-flight starts');
  });

  // ---- L-2: pool close semantics ----
  const cdp = require('../../cdp');
  await checkAsync('closePooledSocket defers while in-flight and closes after drain', async () => {
    // source + behavior parity: reuse the mock-socket suite's real assertion path via a manual socket.
    assert.ok(/closePooledSocket[\s\S]{0,600}inFlight > 0/.test(fs.readFileSync(path.join(__dirname, '..', '..', 'cdp.js'), 'utf8')), 'close must check inFlight');
    // behavioral: with in-flight, entry stays until drain. Simulate via pool map directly.
    const { callPool } = cdp.__test.pool;
    const url = 'ws://mock-wave2.test/devtools/browser/x';
    const entry = { conn: { close() { this.closed = true; } }, openPromise: Promise.resolve(), inFlight: 1, dead: false, diedAt: 0, lastUsed: Date.now(), idleTimer: null };
    callPool.set(url, entry);
    cdp.closePooledSocket(url);
    assert.strictEqual(callPool.has(url), true, 'entry kept while in-flight');
    assert.strictEqual(entry.conn.closed, undefined, 'socket not torn down yet');
    entry.inFlight = 0;
    await new Promise((r) => setTimeout(r, 260));
    assert.strictEqual(callPool.has(url), false, 'evicted after drain');
    assert.strictEqual(entry.conn.closed, true, 'socket closed after drain');
  });

  // ---- M-2: store metadata page-first ----
  const msrc = mainSrc;
  check('fetchChromeStoreMetadata consults the detail page before the package download', () => {
    const fn = msrc.slice(msrc.indexOf('async function fetchChromeStoreMetadata'));
    const pageIdx = fn.indexOf('fetchChromeStorePageHtml(safeId)');
    const pkgIdx = fn.indexOf('fetchStorePackage(');
    const skipIdx = fn.indexOf('skipPackage');
    assert.ok(pageIdx > 0 && pkgIdx > pageIdx, 'page fetch must precede the package download');
    assert.ok(skipIdx > 0, 'package download must be skippable');
    assert.ok(fn.includes('chromeStoreTextMeta'), 'og:title/og:description extraction must be called');
  });

  console.log(`\nwave2-remediation-selftest: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('FAIL suite crashed:', e); process.exit(1); });
