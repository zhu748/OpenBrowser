'use strict';

// Explicit native-browser gate. All traffic is local; external requests are
// routed to an unavailable loopback proxy. Missing Firefox is a non-pass.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');
const { buildFirefoxUserJs, firefoxStartupArgs } = require('../kernel-versions');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup } = require('../firefox-fingerprint');
const { ProfileRoutes } = require('../api/profile-routes');
const { clearFirefoxPlaces } = require('../browser-data');
const { DatabaseSync } = require('node:sqlite');
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../../network/bidi-connection');

async function run(generation) {
  const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
  if (!binary) {
    console.error('Native Firefox verification requires OPENBROWSER_FIREFOX_BINARY; no browser checks ran.');
    process.exitCode = 2;
    return;
  }
  const version = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 }).match(/Firefox\s+(\d+(?:\.\d+)+)/)?.[1];
  if (!version) throw new Error('Cannot determine the native Firefox version');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-firefox-fingerprint-'));
  const requests = [];
  const probe = `({ua:navigator.userAgent,platform:navigator.platform,vendor:navigator.vendor,cores:navigator.hardwareConcurrency,memoryPresent:'deviceMemory' in navigator,chromePresent:'chrome' in window,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,width:screen.width,height:screen.height})`;
  const server = http.createServer((request, response) => {
    requests.push({ path: request.url, ua: request.headers['user-agent'] });
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><script>window.firstFingerprint=${probe};</script>${request.url === '/doc' ? '<iframe src="/frame"></iframe>' : ''}`);
  });
  let child;
  let connection;
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const profile = sanitizeProfile({ id: 'firefox-native', fingerprintVersion: generation, name: 'Firefox native', engine: 'firefox', os: 'Windows', width: 1440, height: 900, privacy: { cores: 4, memory: 0, webrtc: 'disabled', fontListMode: 'real', timezoneMode: 'custom', timezone: 'America/New_York' }, advanced: { showInfoPage: false } });
    const fp = buildFirefoxFingerprint(profile, version);
    await fs.writeFile(path.join(root, 'user.js'), buildFirefoxUserJs({
      userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
      proxyEndpoint: 'http://127.0.0.1:9', noProxyHosts: '127.0.0.1, localhost',
      extraPrefs: [...firefoxExtraUserPrefs(profile, fp), ['network.dns.disablePrefetch', true], ['network.prefetch-next', false], ['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
    }), { mode: 0o600 });
    child = spawn(binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: fp.timezone },
    });
    child._startupDiagnostic = { stderr: '' };
    child.stderr.on('data', (chunk) => { child._startupDiagnostic.stderr = (child._startupDiagnostic.stderr + chunk).slice(-32768); });
    connection = await new BidiConnection(await waitForFirefoxEndpoint(child)).open();
    const initialized = await initializeFirefoxFingerprint(connection, fp, profile);
    await navigateFirefoxStartup(connection, initialized.context, [`http://127.0.0.1:${server.address().port}/doc`]);
    const delivered = await evaluateBidi(connection, { context: initialized.context }, `new Promise((resolve,reject)=>{const deadline=Date.now()+5000;const poll=()=>{const frame=document.querySelector('iframe');if(frame?.contentWindow?.firstFingerprint)resolve({main:window.firstFingerprint,frame:frame.contentWindow.firstFingerprint});else if(Date.now()>deadline)reject(new Error('iframe did not load'));else setTimeout(poll,25)};poll()})`);
    for (const realm of [delivered.main, delivered.frame]) {
      assert.equal(realm.ua, fp.userAgent);
      assert.equal(realm.platform, fp.platform);
      assert.equal(realm.vendor, '');
      assert.equal(realm.cores, 4);
      assert.equal(realm.memoryPresent, false);
      assert.equal(realm.chromePresent, false);
      assert.equal(realm.timezone, fp.timezone);
      assert.equal(realm.width, fp.screen.width);
      assert.equal(realm.height, fp.screen.height);
    }
    assert.ok(requests.some((request) => request.path === '/doc' && request.ua === fp.userAgent));
    assert.ok(requests.some((request) => request.path === '/frame' && request.ua === fp.userAgent));
    const routes = new ProfileRoutes({ engine: {
      profiles: new Map([[profile.id, profile]]),
      running: new Map([[profile.id, { engine: 'firefox', bidiConnection: connection, bidiContext: initialized.context }]]),
      start: async () => { throw new Error('an active Firefox must navigate without restarting'); },
    } });
    const navigation = await routes.routeBrowserOpenUrl({ input: { profile_id: profile.id, url: `http://127.0.0.1:${server.address().port}/api-navigation` } });
    assert.equal(navigation.code, 0); assert.equal(navigation.data.navigated, true);
    assert.ok(requests.some((request) => request.path === '/api-navigation'));
    const shot = await routes.routeBrowserScreenshot({ input: { profile_id: profile.id } });
    assert.equal(shot.code, 0);
    assert.equal(Buffer.from(shot.data.data, 'base64').subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const exited = new Promise((resolve) => child.once('exit', resolve));
    await connection.command('browser.close', {}, 3000).catch(() => {});
    await exited;
    const placesFile = path.join(root, 'places.sqlite');
    let places = new DatabaseSync(placesFile);
    const bookmarksBefore = places.prepare('SELECT count(*) AS n FROM moz_bookmarks').get().n;
    const historyBefore = places.prepare('SELECT count(*) AS n FROM moz_historyvisits').get().n;
    places.close();
    await clearFirefoxPlaces(root, { bookmarks: true });
    places = new DatabaseSync(placesFile);
    assert.equal(places.prepare('SELECT count(*) AS n FROM moz_historyvisits').get().n, historyBefore);
    const permanentRoots = places.prepare('SELECT count(*) AS n FROM moz_bookmarks').get().n;
    assert.ok(permanentRoots <= bookmarksBefore);
    places.close();
    await clearFirefoxPlaces(root, { history: true });
    places = new DatabaseSync(placesFile);
    assert.equal(places.prepare('SELECT count(*) AS n FROM moz_bookmarks').get().n, permanentRoots);
    assert.equal(places.prepare('SELECT count(*) AS n FROM moz_historyvisits').get().n, 0);
    assert.equal(places.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    places.close();
    console.log(`Firefox ${version} generation ${generation}: native document-start, iframe first-script, device fields, timezone and HTTP UA verified`);
    console.log('Workers: not certified by this document/iframe gate; capability remains best-effort.');
  } finally {
    connection?.close();
    if (child && child.exitCode == null && child.signalCode == null) {
      child.kill();
      await new Promise((resolve) => { const timer = setTimeout(resolve, 3000); child.once('exit', () => { clearTimeout(timer); resolve(); }); });
    }
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
}
run(1).then(() => process.exitCode === 2 ? undefined : run(2))
  .catch((error) => { console.error(error); process.exitCode = 1; });
