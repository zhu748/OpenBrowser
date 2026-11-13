'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const cdp = require('../../cdp');
const { buildFingerprint, applyFingerprintToTab } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const h = require('./native-gate-harness');

async function main() {
  let browser;
  try { browser = h.chooseChromiumBinary(); }
  catch (error) { if (error instanceof h.Unavailable) { console.log('SKIP ' + error.message); process.exitCode = 2; return; } throw error; }
  const base = sanitizeProfile({ id: 'override-lifecycle', name: 'Override lifecycle', os: 'Windows',
    privacy: { fontListMode: 'real', timezoneMode: 'real', geoMode: 'prompt', geoPermission: 'prompt' } });
  const fp = buildFingerprint({ ...base, kernelVersion: browser.version });
  const server = http.createServer((_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><body>Native override lifecycle</body>'); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let run, page, browserConnection;
  try {
    run = await h.launchPersonaBrowser(browser, { profile: base, fingerprint: fp }, { injectFingerprint: false });
    page = await h.openPage(run.port, 'http://127.0.0.1:' + server.address().port);
    browserConnection = await cdp.connect(await cdp.browserSocket(run.port));
    await page.command('Page.enable'); await h.delay(100);
    const tree = await page.command('Page.getFrameTree');
    const world = await page.command('Page.createIsolatedWorld', { frameId: tree.frameTree.frame.id, worldName: 'native-override-check' });
    // This world observes Chromium's actual overrides, independently of the
    // document-side JS wrappers being tested in the main world.
    const native = async (expression) => {
      const result = await page.command('Runtime.evaluate', { expression, contextId: world.executionContextId,
        awaitPromise: true, returnByValue: true });
      assert.equal(result.exceptionDetails, undefined);
      return result.result.value;
    };
    const baselineZone = await native('Intl.DateTimeFormat().resolvedOptions().timeZone');
    const customZone = baselineZone === 'America/New_York' ? 'Asia/Tokyo' : 'America/New_York';
    const custom = { ...base, privacy: { ...base.privacy, timezoneMode: 'custom', timezone: customZone,
      geoMode: 'custom', latitude: 12, longitude: 34, geoPermission: 'allow' } };
    const customFp = buildFingerprint({ ...custom, kernelVersion: browser.version });
    const invoke = (method, params) => method.startsWith('Browser.')
      ? browserConnection.command(method, params) : page.command(method, params);
    const options = { applyKey: 'native-page', registrationOwner: page };
    await applyFingerprintToTab(invoke, null, customFp, custom, options);
    assert.equal(await native('Intl.DateTimeFormat().resolvedOptions().timeZone'), customZone);
    const coords = 'new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(p=>resolve([p.coords.latitude,p.coords.longitude]),e=>reject(Error(e.message)),{maximumAge:0,timeout:3000}))';
    assert.deepEqual(await native(coords), [12, 34]);
    await applyFingerprintToTab(invoke, null, customFp, { ...custom, privacy: { ...custom.privacy, latitude: 15 } }, options);
    assert.deepEqual(await native(coords), [15, 34], 'profile-only coordinate changes reach native Chromium');
    await applyFingerprintToTab(invoke, null, fp, base, options);
    assert.equal(await native('Intl.DateTimeFormat().resolvedOptions().timeZone'), baselineZone, 'real timezone clears the prior native override');
    assert.equal(await native('navigator.permissions.query({name:"geolocation"}).then(p=>p.state)'), 'prompt', 'automatic grants do not survive switching to prompt');
    console.log('FINGERPRINT_OVERRIDE_LIFECYCLE_SELFTEST OK (native coordinates, source reuse, timezone reset and permission reset)');
  } finally {
    page?.close(); browserConnection?.close(); await run?.close();
    server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
