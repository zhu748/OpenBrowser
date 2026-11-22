'use strict';

/**
 * P0 gate for first-script reads through iframe, popup and application tab entry points.
 *
 * Matrix: about:blank document.write, srcdoc, nested and cross-origin iframes,
 * an application-created tab, and window.open with an opener. The navigation
 * gate covers new targets without an opener.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const cdp = require('../../cdp');
const {
  Unavailable, entrySnapshotSource, chooseChromiumBinary, buildPersona,
  launchPersonaBrowser, openPage, evaluate, startDualOriginServers, verifyIdentity,
} = require('./native-gate-harness');

const PAGE = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script>globalThis.first=${entrySnapshotSource};</script></head><body></body></html>`;

(async () => {
  const browser = chooseChromiumBinary();
  const framePage = (channel) => PAGE.replace(
    '</head>',
    '<scr' + 'ipt>addEventListener("load",()=>parent.postMessage({"' + channel + '":globalThis.first},"*"))</scr' + 'ipt></head>'
  );
  const servers = await startDualOriginServers((request, response) => {
    response.setHeader('Content-Type', 'text/html');
    if (request.url.startsWith('/frame')) { response.end(framePage('__crossSite')); return; }
    response.end(PAGE);
  });
  const originA = 'http://127.0.0.1:' + servers.a.address().port;
  const originB = 'http://127.0.0.1:' + servers.b.address().port;
  const persona = buildPersona('native-entry-matrix', { os: 'Windows', dpr: 1, timezone: 'America/New_York' });
  const fp = persona.fingerprint;
  const session = await launchPersonaBrowser(browser, persona);
  try {
    const page = await openPage(session.port, originA + '/start');
    let ready = false;
    for (let i = 0; i < 100; i += 1) {
      const r = await page.command('Runtime.evaluate', { expression: 'Boolean(globalThis.first && document.body)', returnByValue: true });
      if (r.result?.value) { ready = true; break; }
      await new Promise((r2) => setTimeout(r2, 50));
    }
    assert.ok(ready, 'host page inline script did not run');

    const snap = await evaluate(page, `${entrySnapshotSource}`);
    const results = { main: snap, entries: {}, errors: {} };
    const runEntry = async (name, expression) => {
      console.log('[entry] running', name);
      try {
        results.entries[name] = await evaluate(page, expression, 20000);
        console.log('[entry] done', name, results.entries[name] ? 'ok' : 'EMPTY');
      } catch (error) {
        results.errors[name] = String(error && error.message || error);
        console.log('[entry] error', name, results.errors[name]);
      }
    };
    await runEntry('docwrite-blank', `(async (entryFnSource) => {
      const f = document.createElement('iframe');
      document.body.append(f);
      const doc = f.contentDocument;
      doc.open();
      doc.write('<scr' + 'ipt>globalThis.first=' + entryFnSource + ';</scr' + 'ipt>');
      doc.close();
      return f.contentWindow.first;
    })(${JSON.stringify(entrySnapshotSource)})`);
    await runEntry('srcdoc', `(async (entryFnSource) => new Promise((resolve) => {
      const f = document.createElement('iframe');
      f.srcdoc = '<scr' + 'ipt>globalThis.first=' + entryFnSource + ';</scr' + 'ipt>';
      f.onload = () => setTimeout(() => resolve(f.contentWindow.first), 50);
      document.body.append(f);
    }))(${JSON.stringify(entrySnapshotSource)})`);
    await runEntry('nested', `(async () => new Promise((resolve) => {
      const outer = document.createElement('iframe');
      outer.src = '/outer';
      outer.onload = () => {
        const inner = outer.contentDocument.createElement('iframe');
        inner.src = '/inner';
        inner.onload = () => setTimeout(() => resolve(inner.contentWindow.first), 50);
        outer.contentDocument.body.append(inner);
      };
      document.body.append(outer);
    }))()`);
    await runEntry('cross-site', `(async () => new Promise((resolve) => {
      const f = document.createElement('iframe');
      f.src = '${originB}/frame';
      window.addEventListener('message', (event) => {
        if (event.data && event.data.__crossSite) resolve(event.data.__crossSite);
      }, { once: true });
      f.onerror = () => resolve(null);
      document.body.append(f);
    }))()`);
    await evaluate(page, `window.__opened = window.open('/opened'); true`);
    let windowOpenFirst = null;
    for (let i = 0; i < 80; i += 1) {
      const r = await evaluate(page, `(window.__opened && window.__opened.first) || null`, 5000).catch(() => null);
      if (r) { windowOpenFirst = r; await evaluate(page, `window.__opened.close(); true`, 5000).catch(() => {}); break; }
      await new Promise((r2) => setTimeout(r2, 150));
    }
    if (!windowOpenFirst) {
      // Popup may be cross-process or the handle lost; read it over CDP instead.
      for (let i = 0; i < 60; i += 1) {
        const targets = await cdp.targets(session.port);
        const candidate = targets.find((t) => t.type === 'page' && t.url.includes('/opened'));
        if (candidate?.webSocketDebuggerUrl) {
          const r = await cdp.call(candidate.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: 'globalThis.first', returnByValue: true }).catch(() => ({ result: {} }));
          if (r.result?.value) { windowOpenFirst = r.result.value; await cdp.closeTab(session.port, candidate.id).catch(() => {}); break; }
        }
        await new Promise((r2) => setTimeout(r2, 150));
      }
    }
    // The application creates a blank tab before navigating it. The renderer
    // path through window.open with noopener has a separate native test.
    const newTab = await cdp.newTab(session.port, originA + '/newtab');
    assert.ok(newTab, 'the application returned a new tab');
    let newTabFirst = null;
    for (let i = 0; i < 60; i += 1) {
      const r = await cdp.call(newTab.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: 'globalThis.first', returnByValue: true }).catch(() => ({ result: {} }));
      if (r.result?.value) { newTabFirst = r.result.value; break; }
      await new Promise((r2) => setTimeout(r2, 150));
    }
    const openerState = await cdp.call(newTab.webSocketDebuggerUrl, 'Runtime.evaluate', { expression: 'window.opener === null', returnByValue: true });
    await cdp.closeTab(session.port, newTab.id).catch(() => {});
    assert.ok(newTabFirst, 'application-created tab inline first read missing');
    assert.equal(openerState.result?.value, true, 'application-created tabs have no opener');

    // ---- Assertions -------------------------------------------------------
    verifyIdentity(results.main, fp, 'main');
    for (const name of ['docwrite-blank', 'srcdoc', 'nested', 'cross-site']) {
      const value = results.entries[name];
      assert.ok(value, `entry ${name} did not report (errors: ${results.errors[name] || 'none'})`);
      verifyIdentity(value, fp, name);
      console.log('PASS page-entry ' + name + ' first read is persona');
    }
    verifyIdentity(newTabFirst, fp, 'new-tab');
    console.log('PASS page-entry application-created tab first read is persona');
    assert.ok(windowOpenFirst, 'window.open first read missing');
    verifyIdentity(windowOpenFirst, fp, 'window-open');
    console.log('PASS page-entry window-open first read is persona');

    // No injection failures were emitted during the whole matrix.
    const failures = session.events.filter((event) => /injection-failed/.test(event.type));
    assert.deepEqual(failures, [], JSON.stringify(failures));
    console.log('fingerprint-page-entry-matrix-selftest: OK');
  } finally {
    await session.close().catch(() => {});
    await servers.close();
  }
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
