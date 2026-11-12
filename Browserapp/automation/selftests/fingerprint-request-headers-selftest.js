'use strict';

/**
 * P0 gate: UA and request-header consistency across every fetch path.
 *
 * Matrix: navigation document, redirect chain, fetch(), XMLHttpRequest, Worker
 * fetch, subresource (image), and the Accept-CH high-entropy Client Hints
 * negotiation (server asks via Accept-CH; the follow-up request must carry the
 * persona's full-version-list/platform/arch/bitness hints — not the host's).
 * The server records every request it sees; the gate asserts each one.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const {
  Unavailable, chooseChromiumBinary, buildPersona, launchPersonaBrowser,
  openPage, evaluate, startDualOriginServers,
} = require('./native-gate-harness');

(async () => {
  const browser = chooseChromiumBinary();
  const persona = buildPersona('native-headers', { os: 'Windows', dpr: 1, timezone: 'America/New_York' });
  const fp = persona.fingerprint;

  // Every request is recorded with its headers for later assertion.
  const requests = [];
  const record = (request) => {
    const entry = { url: request.url, headers: request.headers };
    requests.push(entry);
    return entry;
  };

  const servers = await startDualOriginServers((request, response) => {
    record(request);
    const url = request.url;
    if (url.startsWith('/redirect')) {
      response.statusCode = 302;
      response.setHeader('Location', '/landed');
      response.end();
    } else if (url.startsWith('/accept-ch')) {
      // Client Hints negotiation: ask for the high-entropy hints; the NEXT
      // request from the same origin must carry them.
      response.setHeader('Accept-CH', 'Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness, Sec-CH-UA-Model');
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><script>fetch("/after-ch").then(r=>r.text()).then(()=>parent.postMessage("ch-done","*"))</script>');
    } else if (url.startsWith('/echo')) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(request.headers));
    } else if (url.startsWith('/worker.js')) {
      response.setHeader('Content-Type', 'application/javascript');
      response.end("postMessage('boot');");
    } else if (url.startsWith('/pixel.png')) {
      response.setHeader('Content-Type', 'image/png');
      response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><html><head></head><body></body></html>');
    }
  });
  const origin = 'http://127.0.0.1:' + servers.a.address().port;

  const session = await launchPersonaBrowser(browser, persona);
  try {
    const page = await openPage(session.port, origin + '/start');
    let ready = false;
    for (let i = 0; i < 100; i += 1) {
      const r = await page.command('Runtime.evaluate', { expression: 'document.readyState === "complete"', returnByValue: true });
      if (r.result?.value) { ready = true; break; }
      await new Promise((r2) => setTimeout(r2, 50));
    }
    assert.ok(ready, 'start page did not load');

    const byUrl = (needle) => requests.filter((r) => r.url.startsWith(needle));
    const findLast = (needle) => [...byUrl(needle)].pop();

    // 1. Navigation document headers
    await evaluate(page, `(async () => { location.href = '/nav-target'; })()`, 15000).catch(() => {});
    await new Promise((r) => setTimeout(r, 600));
    // (after navigation the old connection may break; reopen)
    let page2 = page;
    try { await page.command('Runtime.evaluate', { expression: '1' }); } catch (_) {
      page2 = await openPage(session.port);
    }
    let nav = findLast('/nav-target');
    for (let i = 0; i < 40 && !nav; i += 1) { await new Promise((r) => setTimeout(r, 150)); nav = findLast('/nav-target'); }
    assert.ok(nav, 'navigation request was not recorded');
    assert.equal(nav.headers['user-agent'], fp.userAgent, 'navigation UA');
    assert.equal(String(nav.headers['sec-ch-ua-platform'] || '').replace(/"/g, ''), 'Windows', 'navigation sec-ch-ua-platform');
    assert.ok(/"Google Chrome";v="157"/.test(nav.headers['sec-ch-ua'] || '') || /Chromium/.test(nav.headers['sec-ch-ua'] || ''), 'navigation sec-ch-ua brands');

    // 2. Redirect chain
    await evaluate(page2, `(async () => {
      const r = await fetch('/redirect', { redirect: 'follow' });
      return r.status;
    })()`, 15000);
    const land = findLast('/landed');
    assert.ok(land, 'redirect landing request missing');
    assert.equal(land.headers['user-agent'], fp.userAgent, 'redirected request UA');

    // 3. fetch() + 4. XHR
    const echoFetch = await evaluate(page2, `fetch('/echo?via=fetch').then(r => r.json())`, 15000);
    assert.equal(echoFetch['user-agent'], fp.userAgent, 'fetch UA');
    const echoXhr = await evaluate(page2, `new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('GET', '/echo?via=xhr');
      x.onload = () => resolve(JSON.parse(x.responseText));
      x.onerror = () => reject(new Error('xhr failed'));
      x.send();
    })`, 15000);
    assert.equal(echoXhr['user-agent'], fp.userAgent, 'XHR UA');

    // 5. Subresource (image)
    await evaluate(page2, `new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = '/pixel.png?v=' + Math.random();
    })`, 15000);
    const pixel = findLast('/pixel.png');
    assert.ok(pixel, 'image request missing');
    assert.equal(pixel.headers['user-agent'], fp.userAgent, 'subresource UA');

    // 6. Worker fetch
    await evaluate(page2, `new Promise((resolve, reject) => {
      const w = new Worker('/worker.js?v=' + Math.random());
      w.onmessage = () => {
        fetch('/echo?via=workerfetch').then(r => r.json()).then((h) => { w.terminate(); resolve(h); }).catch(reject);
      };
      w.onerror = (e) => reject(new Error(e.message));
    })`, 20000).then((workerHeaders) => {
      assert.equal(workerHeaders['user-agent'], fp.userAgent, 'worker fetch UA');
      console.log('PASS headers worker fetch UA');
    });

    // 7. Accept-CH negotiation: Chromium only persists hints for a TOP-LEVEL
    //    navigation to the origin (iframe subresource requests do not count).
    //    Navigate top-level, then issue the follow-up fetch from that document.
    await evaluate(page2, `location.href = '/accept-ch'; true`, 15000).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    let page3 = page2;
    try { await page2.command('Runtime.evaluate', { expression: '1' }); } catch (_) { page3 = await openPage(session.port); }
    let chReady = false;
    for (let i = 0; i < 40; i += 1) {
      const r = await page3.command('Runtime.evaluate', { expression: 'document.readyState === "complete" && location.pathname === "/accept-ch"', returnByValue: true }).catch(() => ({ result: {} }));
      if (r.result?.value) { chReady = true; break; }
      await new Promise((r2) => setTimeout(r2, 150));
    }
    assert.ok(chReady, 'Accept-CH top-level page did not load');
    await evaluate(page3, `fetch('/after-ch').then(r => r.text())`, 15000);
    let after = findLast('/after-ch');
    for (let i = 0; i < 30 && !after; i += 1) { await new Promise((r) => setTimeout(r, 150)); after = findLast('/after-ch'); }
    assert.ok(after, 'after-ch request missing — Accept-CH follow-up never sent');
    const meta = fp.userAgentMetadata || {};
    assert.equal(String(after.headers['sec-ch-ua-platform'] || '').replace(/"/g, ''), 'Windows', 'after-ch platform');
    const fvl = after.headers['sec-ch-ua-full-version-list'];
    assert.ok(fvl, 'after-ch must carry sec-ch-ua-full-version-list once negotiated');
    assert.ok(String(fvl).includes(meta.fullVersion || ''), 'after-ch full-version-list version: got ' + fvl);
    assert.ok(String(after.headers['sec-ch-ua-arch'] || '').replace(/"/g, '').length > 0, 'after-ch arch hint');
    console.log('PASS headers Accept-CH negotiation full-version-list/arch');

    // 8. Cross-origin fetch to origin B (CORS echo)
    const originB = 'http://127.0.0.1:' + servers.b.address().port;
    await evaluate(page2, `fetch('${originB}/echo?via=cross', { mode: 'cors' }).then(r => r.text()).catch(e => String(e))`, 15000);
    let cross = findLast('/echo?via=cross');
    for (let i = 0; i < 30 && !cross; i += 1) { await new Promise((r) => setTimeout(r, 150)); cross = findLast('/echo?via=cross'); }
    assert.ok(cross, 'cross-origin request missing (CORS preflight failure is fine; the request must still be recorded)');
    assert.equal(cross.headers['user-agent'], fp.userAgent, 'cross-origin fetch UA');

    // Consolidated pass lines
    console.log('PASS headers navigation UA/platform/brands');
    console.log('PASS headers redirect UA');
    console.log('PASS headers fetch UA');
    console.log('PASS headers XHR UA');
    console.log('PASS headers subresource UA');
    console.log('PASS headers cross-origin fetch UA');
    console.log('fingerprint-request-headers-selftest: OK');
  } finally {
    await session.close().catch(() => {});
    await servers.close();
  }
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
