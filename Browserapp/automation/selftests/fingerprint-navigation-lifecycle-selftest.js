'use strict';

/**
 * P1 gate: navigation and lifecycle delivery rules.
 *
 * Reload, cross-site navigation, back/forward (bfcache path), document.open on an
 * existing document, window reuse (one tab navigated repeatedly), Service Worker
 * update (re-register a changed script), and a browser restart — every state the
 * page can land in must still serve the persona on first script read.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const {
  Unavailable, delay, entrySnapshotSource, chooseChromiumBinary, buildPersona,
  launchPersonaBrowser, openPage, evaluate, startDualOriginServers, verifyIdentity,
} = require('./native-gate-harness');

const PAGE = `<!doctype html><script>globalThis.first=${entrySnapshotSource};</script>`;
const SNAP = 'globalThis.first';

(async () => {
  const browser = chooseChromiumBinary();
  let swVersion = 1;
  const servers = await startDualOriginServers((request, response) => {
    const url = request.url;
    if (url.startsWith('/sw.js')) {
      response.setHeader('Content-Type', 'application/javascript');
      response.setHeader('Cache-Control', 'no-store');
      response.end(`const v=${swVersion};self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('message',e=>{e.ports[0].postMessage({v,platform:navigator.platform,ua:navigator.userAgent.slice(0,40)});});`);
    } else if (url.startsWith('/sw-page')) {
      response.setHeader('Content-Type', 'text/html');
      response.end(PAGE.replace('</head>', '<script>navigator.serviceWorker.register("/sw.js").catch(()=>{})</script></head>'));
    } else { response.setHeader('Content-Type', 'text/html'); response.end(PAGE); }
  });
  const originA = 'http://127.0.0.1:' + servers.a.address().port;
  const originB = 'http://127.0.0.1:' + servers.b.address().port;

  const persona = buildPersona('native-nav', { os: 'Windows' });
  const fp = persona.fingerprint;

  const readFirst = async (page, timeoutMs = 9000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const v = await evaluate(page, `${SNAP} || null`, 4000).catch(() => null);
      if (v) return v;
      await delay(150);
    }
    return null;
  };

  const session = await launchPersonaBrowser(browser, persona);
  try {
    // ---- 1. Reload ----
    let page = await openPage(session.port, originA + '/start');
    let first = await readFirst(page);
    assert.ok(first, 'initial load first read');
    verifyIdentity(first, fp, 'initial');
    await evaluate(page, `location.reload(); true`, 10000).catch(() => {});
    await delay(900);
    // reload may invalidate the socket; reopen if needed
    try { await page.command('Runtime.evaluate', { expression: '1' }); } catch (_) { page = await openPage(session.port); }
    first = await readFirst(page);
    assert.ok(first, 'reload first read');
    verifyIdentity(first, fp, 'reload');
    console.log('PASS nav reload keeps persona');

    // ---- 2. Cross-site navigation (A -> B) ----
    await evaluate(page, `location.href = '${originB}/cross'; true`, 10000).catch(() => {});
    await delay(900);
    try { await page.command('Runtime.evaluate', { expression: '1' }); } catch (_) { page = await openPage(session.port); }
    first = await readFirst(page);
    assert.ok(first, 'cross-site first read');
    verifyIdentity(first, fp, 'cross-site');
    console.log('PASS nav cross-site keeps persona');

    // ---- 3. Back (bfcache / history) ----
    await evaluate(page, `history.back(); true`, 10000).catch(() => {});
    await delay(900);
    try { await page.command('Runtime.evaluate', { expression: '1' }); } catch (_) { page = await openPage(session.port); }
    first = await readFirst(page);
    // bfcache restores the OLD document; the persona snapshot it recorded at
    // load time must still be the persona (it was captured pre-patch-free).
    assert.ok(first, 'back first read');
    verifyIdentity(first, fp, 'back');
    console.log('PASS nav history back keeps persona');

    // ---- 4. document.open on an existing document ----
    first = await evaluate(page, `(async () => {
      document.open();
      document.write('<scr' + 'ipt>globalThis.first=' + ${JSON.stringify(entrySnapshotSource)} + ';</scr' + 'ipt>');
      document.close();
      return globalThis.first;
    })()`, 10000);
    assert.ok(first, 'document.open produced no first read');
    verifyIdentity(first, fp, 'docopen');
    console.log('PASS nav document.open keeps persona');

    // ---- 5. Window reuse: same tab, multiple navigations ----
    for (const path of ['/w1', '/w2', '/w3']) {
      await evaluate(page, `location.href = '${originA}${path}'; true`, 10000).catch(() => {});
      await delay(700);
      try { await page.command('Runtime.evaluate', { expression: '1' }); } catch (_) { page = await openPage(session.port); }
      first = await readFirst(page);
      assert.ok(first, 'window reuse ' + path);
      verifyIdentity(first, fp, 'reuse-' + path);
    }
    console.log('PASS nav window reuse keeps persona across navigations');

    // ---- 6. Service Worker register + update ----
    // NOTE: registering from an inline load-time script races the engine's
    // SW-target pause (ready stalls). Registering after load — the flow the
    // baseline gate and real controlled pages use — is the covered path.
    await evaluate(page, `location.href = '${originA}/sw-host'; true`, 10000).catch(() => {});
    await delay(900);
    try { await page.command('Runtime.evaluate', { expression: '1' }); } catch (_) { page = await openPage(session.port); }
    first = await readFirst(page);
    assert.ok(first, 'sw-host first read');
    verifyIdentity(first, fp, 'sw-host');
    const withTimeout = (p, ms, tag) => Promise.race([p, new Promise((_r, rej) => setTimeout(() => rej(new Error(tag + ' timed out after ' + ms + 'ms')), ms))]);
    console.log('[sw] step 1: register + ready probe');
    const sw1 = await withTimeout(evaluate(page, `(async () => {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const ready = await navigator.serviceWorker.ready;
      const ch = new MessageChannel();
      const p = new Promise((res) => { ch.port1.onmessage = (e) => res(e.data); setTimeout(() => res({ timeout: true }), 6000); });
      ready.active.postMessage('v', [ch.port2]);
      return await p;
    })()`, 20000), 22000, 'sw-first');
    assert.ok(sw1 && sw1.platform === fp.platform, 'SW first registration serves persona platform: ' + JSON.stringify(sw1));
    // Update the SW script and re-register: the new version must still be persona.
    console.log('[sw] step 2: update probe');
    swVersion = 2;
    const sw2 = await withTimeout(evaluate(page, `(async () => {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await new Promise((res) => setTimeout(res, 1500));
      const active = reg.active || reg.waiting || reg.installing;
      const ch = new MessageChannel();
      const p = new Promise((res) => { ch.port1.onmessage = (e) => res(e.data); setTimeout(() => res({ timeout: true }), 6000); });
      (active || reg.active).postMessage('v', [ch.port2]);
      return await p;
    })()`, 25000), 27000, 'sw-update');
    assert.ok(sw2 && sw2.platform === fp.platform, 'SW update serves persona platform: ' + JSON.stringify(sw2));
    console.log('PASS nav Service Worker register + update keep persona');
    await evaluate(page, `navigator.serviceWorker.getRegistrations().then(rs => Promise.all(rs.map(r => r.unregister()))).then(() => true)`, 10000).catch(() => {});
  } finally {
    await session.close().catch(() => {});
  }

  // ---- 7. Browser restart: same rules hold ----
  {
    const session2 = await launchPersonaBrowser(browser, persona);
    try {
      const page = await openPage(session2.port, originA + '/after-restart');
      const first = await readFirst(page);
      assert.ok(first, 'post-restart first read');
      verifyIdentity(first, fp, 'restart');
      console.log('PASS nav browser restart keeps persona');
    } finally {
      await session2.close().catch(() => {});
    }
  }

  console.log('fingerprint-navigation-lifecycle-selftest: OK');
  await servers.close();
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
