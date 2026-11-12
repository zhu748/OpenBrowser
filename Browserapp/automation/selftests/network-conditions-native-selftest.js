'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const h = require('./native-gate-harness');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');
const { applyNetworkConditions } = require('../../engine/network-conditions');

(async () => {
  const browser = h.chooseChromiumBinary();
  if (!browser) { console.log('SKIP network conditions: Chromium unavailable');return; }
  const server = http.createServer((_request, response) => { response.setHeader('Cache-Control', 'no-store');response.end('network-conditions-ok'); });
  server.listen(0, '127.0.0.1');await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = sanitizeProfile({ id: 'native-network-conditions', name: 'Network', os: 'Linux', networkMode: 'direct', privacy: { fontListMode: 'real' } });
  let live, page;
  try {
    live = await h.launchPersonaBrowser(browser, { profile, fingerprint: buildFingerprint(profile) }, { injectFingerprint: false });
    page = await h.openPage(live.port);
    await page.command('Page.navigate', { url: origin });
    for (let i = 0; i < 150; i++) {
      if (await h.evaluate(page, 'document.readyState === "complete" && location.origin === ' + JSON.stringify(origin))) break;
      await h.delay(20);
    }
    const request = () => h.evaluate(page, `fetch('/probe?'+Math.random(), {cache:'no-store'}).then(r=>r.text()).catch(e=>'failed:'+e.name)`);
    const sessionCall = (method, params) => page.command(method, params);
    await applyNetworkConditions(sessionCall, { latency: 75, downloadThroughput: null, uploadThroughput: null });
    assert.equal(await request(), 'network-conditions-ok', 'latency-only configuration leaves transfers unlimited');
    await applyNetworkConditions(sessionCall, { offline: true });
    assert.match(await request(), /^failed:/, 'native offline setting blocks a new uncached request');
    await applyNetworkConditions(sessionCall, null);
    assert.equal(await request(), 'network-conditions-ok', 'reset restores native connectivity');
    console.log(`NETWORK_CONDITIONS_NATIVE_SELFTEST OK Chromium ${browser.version} latency-only/offline/reset`);
  } finally {
    page?.close();await live?.close();server.closeAllConnections();await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
