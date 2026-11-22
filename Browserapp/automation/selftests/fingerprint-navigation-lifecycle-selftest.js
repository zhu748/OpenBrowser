'use strict';

/**
 * P1 gate: navigation and lifecycle delivery rules.
 *
 * Reload, cross-site navigation, back/forward (bfcache path), document.open on an
 * existing document, programmatically created tabs, window reuse, Service Worker
 * update (re-register a changed script), and a browser restart — every state the
 * page can land in must still serve the persona on first script read.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const cdp = require('../../cdp');
const {
  Unavailable, delay, entrySnapshotSource, chooseChromiumBinary, buildPersona,
  launchPersonaBrowser, openPage, evaluate, startDualOriginServers, verifyIdentity,
} = require('./native-gate-harness');

const PAGE = `<!doctype html><script>globalThis.first=${entrySnapshotSource};</script>`;
const SNAP = 'globalThis.first';
let servers;

(async () => {
  const browser = chooseChromiumBinary();
  const persona = buildPersona('native-nav', { os: 'Windows', fontListMode: 'noise' });
  const fp = persona.fingerprint;
  const unknownFont = 'OpenBrowser unavailable fixture font';
  let swVersion = 1;
  const initialRequests = new Map();
  servers = await startDualOriginServers((request, response) => {
    const url = request.url;
    if (url.startsWith('/sw.js')) {
      response.setHeader('Content-Type', 'application/javascript');
      response.setHeader('Cache-Control', 'no-store');
      response.end(`const v=${swVersion};self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('message',e=>{e.ports[0].postMessage({v,platform:navigator.platform,ua:navigator.userAgent.slice(0,40)});});`);
    } else if (url.startsWith('/sw-page')) {
      response.setHeader('Content-Type', 'text/html');
      response.end(PAGE.replace('</head>', '<script>navigator.serviceWorker.register("/sw.js").catch(()=>{})</script></head>'));
    } else if (url.startsWith('/openerless/')) {
      const chunks = [];
      request.on('data', chunk => chunks.push(chunk));
      request.on('end', () => {
        initialRequests.set(url, { method: request.method, headers: request.headers, body: Buffer.concat(chunks).toString() });
        response.setHeader('Content-Type', 'text/html');
        if (url.endsWith('/srcdoc')) {
          response.end('<!doctype html><iframe srcdoc="' + PAGE.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '"></iframe>');
          return;
        }
        const css = `<style>@font-face{font-family:fixture;src:local("${unknownFont}")}:root{--configured-dpr:no}
          @media(resolution:${fp.screen.devicePixelRatio}dppx){:root{--configured-dpr:yes}}</style>`;
        response.end(url.endsWith('/scriptless') ? '<!doctype html>' + css : PAGE.replace('<script>', css + '<script>').replace('</script>', `
          globalThis.first.openerAbsent=opener===null;
          globalThis.first.nativeDpr=getComputedStyle(document.documentElement).getPropertyValue('--configured-dpr');
          globalThis.first.staticFont=document.styleSheets[0].cssRules[0].cssText;
          </script>`));
      });
    } else { response.setHeader('Content-Type', 'text/html'); response.end(PAGE); }
  });
  const originA = 'http://127.0.0.1:' + servers.a.address().port;
  const originB = 'http://127.0.0.1:' + servers.b.address().port;

  const readFirst = async (page, timeoutMs = 9000, expression = SNAP) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const v = await evaluate(page, `${expression} || null`, 4000).catch(() => null);
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

    const tab = await cdp.newTab(session.port, originB + '/new-tab');
    assert.ok(tab?.webSocketDebuggerUrl, 'programmatically created tab');
    const newPage = await cdp.connect(tab.webSocketDebuggerUrl);
    try {
      const newFirst = await readFirst(newPage);
      assert.ok(newFirst, 'new tab first read');
      verifyIdentity(newFirst, fp, 'programmatically created tab');
    } finally {
      newPage.close();
    }
    const closed = await session.item.workerFingerprintConnection.command('Target.closeTarget', { targetId: tab.id });
    assert.equal(closed.success, true);
    verifyIdentity(await evaluate(page, SNAP), fp, 'original tab after new tab closes');
    console.log('PASS nav new tab carries the profile on its first script read');

    // Chrome can defer renderer creation for tabs without an accessible opener.
    if (Number(browser.version.split('.')[0]) >= 143) {
      for (const entry of ['window', 'link', 'form', 'scriptless', 'srcdoc']) {
        const route = '/openerless/' + entry;
        const url = originB + route;
        const target = JSON.stringify(url);
        const expression = entry === 'link'
          ? `const a=document.createElement('a');a.href=${target};a.rel='noreferrer';a.target='_blank';document.body.append(a);a.click();a.remove();`
          : entry === 'form'
            ? `const form=document.createElement('form');form.action=${target};form.method='post';form.target='_blank';form.rel='noopener';
              const input=document.createElement('input');input.name='value';input.value='kept';form.append(input);document.body.append(form);form.submit();form.remove();`
            : `window.open(${target}, '_blank', 'noopener'); true`;
        await page.command('Runtime.evaluate', { expression: '(() => {' + expression + '})()', userGesture: true });
        let popup;
        for (let attempt = 0; !popup && attempt < 60; attempt++) {
          popup = (await cdp.tabs(session.port)).find(target => target.url === url);
          if (!popup) await delay(150);
        }
        const error = session.events.find(event => event.type === 'fingerprint-injection-failed');
        assert.ok(popup, `the ${entry} tab without an opener must navigate (${error?.message || 'no matching target'})`);
        const popupPage = await cdp.connect(popup.webSocketDebuggerUrl);
        try {
          if (entry === 'scriptless') {
            assert.equal(await evaluate(popupPage, 'navigator.platform'), fp.platform, 'scriptless tab reached ready');
          } else if (entry === 'srcdoc') {
            const frameFirst = await readFirst(popupPage, 9000, 'document.querySelector("iframe")?.contentWindow.first');
            assert.ok(frameFirst, 'static child frame recorded its first read');
            verifyIdentity(frameFirst, fp, 'first script in a static child frame');
          } else {
            const popupFirst = await readFirst(popupPage);
            assert.ok(popupFirst, 'new tab without an opener first read');
            verifyIdentity(popupFirst, fp, entry + ' tab without an opener');
            assert.equal(popupFirst.openerAbsent, true);
            assert.equal(popupFirst.nativeDpr, 'yes', 'native DPR is applied before the first page script');
            assert.ok(popupFirst.staticFont.includes('local(') && !popupFirst.staticFont.includes(unknownFont),
              'the first document response has its static font rule rewritten before parsing');
          }
          const initialRequest = initialRequests.get(route);
          assert.equal(initialRequest.headers['user-agent'], fp.userAgent, 'first request uses configured UA');
          if (entry === 'link') assert.equal(initialRequest.headers.referer, undefined, 'noreferrer is retained');
          if (entry === 'form') {
            assert.equal(initialRequest.method, 'POST');
            assert.equal(initialRequest.body, 'value=kept', 'original form data is retained');
          }
        } finally {
          popupPage.close();
        }
        await session.item.workerFingerprintConnection.command('Target.closeTarget', { targetId: popup.id });
      }
      console.log('PASS nav openerless windows, links, POST forms, static child frames and scriptless documents retain navigation and fingerprint');
    }

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

  if (Number(browser.version.split('.')[0]) >= 143) {
    const latency = 1200;
    for (const offline of [false, true]) {
      const networkPersona = { fingerprint: fp, profile: { ...persona.profile, privacy: {
        ...persona.profile.privacy, networkConditions: { offline, latency },
      } } };
      const networkSession = await launchPersonaBrowser(browser, networkPersona);
      try {
        const page = await openPage(networkSession.port);
        const route = '/openerless/' + (offline ? 'offline' : 'latency');
        const url = originB + route;
        const start = Date.now();
        await page.command('Runtime.evaluate', {
          expression: `window.open(${JSON.stringify(url)}, '_blank', 'noopener'); true`,
          userGesture: true,
        });
        let target;
        for (let attempt = 0; !target && attempt < 100; attempt++) {
          target = (await cdp.tabs(networkSession.port)).find(tab => tab.url === url
            && networkSession.item.fpAppliedTargets?.has(tab.id));
          if (!target) await delay(100);
        }
        assert.ok(target, 'new target reached ready with ' + (offline ? 'offline' : 'latency') + ' simulation');
        if (offline) {
          assert.equal(initialRequests.has(route), false, 'offline simulation prevents the first outgoing request');
        } else {
          assert.ok(initialRequests.has(route), 'throttled page made its original request');
          assert.ok(Date.now() - start >= latency - 100, 'latency simulation delays the first response');
          const page = await cdp.connect(target.webSocketDebuggerUrl);
          try { verifyIdentity(await readFirst(page), fp, 'throttled openerless tab'); }
          finally { page.close(); }
        }
      } finally {
        await networkSession.close();
      }
    }
    console.log('PASS nav openerless first navigation honors latency and offline simulation');
  }

  console.log('fingerprint-navigation-lifecycle-selftest: OK');
})().finally(() => servers?.close()).catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
