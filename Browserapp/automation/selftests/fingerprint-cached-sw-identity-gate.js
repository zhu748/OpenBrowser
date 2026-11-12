#!/usr/bin/env node
'use strict';

/**
 * Regression gate: cached service-worker identity delivery (Chromium).
 *
 * The audit's last P0 delivery hole: a service worker that has already been
 * registered starts from the SCRIPT CACHE on later navigations — no network
 * request, so the Fetch-layer prefixer never fires and the SW scope reads the
 * host's navigator (platform / hardwareConcurrency / userAgent) and its
 * clients inherit its unpatched fetch(). The engine now evaluates the worker
 * fingerprint source directly on the SW session after resume (deduped against
 * fulfilledUrls so a network-fetched SW is not evaluated twice).
 *
 * This gate asserts, on a production-shaped launch:
 *   1. first registration: the network-loaded SW script carries the persona
 *      (prefixer path — guard against a regression there too);
 *   2. SECOND navigation (SW served from script cache): the SW scope still
 *      reads the persona platform / cores / UA, and a fetch() the SW performs
 *      for its client carries persona headers.
 *
 * Exit codes: 2 = prerequisites missing (skip), 1 = assertion failure.
 */

const assert = require('node:assert/strict');
const http = require('node:http');
const {
  Unavailable, chooseChromiumBinary, buildPersona, launchPersonaBrowser, openPage, evaluate,
} = require('./native-gate-harness');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// SW body: echoes scope-level reads to its client, and proxies fetch() so the
// request goes through the SW's own network session (headers observable).
const SW_BODY = `
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('message', (e) => {
  const snap = JSON.stringify({
    platform: navigator.platform,
    cores: navigator.hardwareConcurrency,
    ua: navigator.userAgent,
    scopeTZ: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  // Reply on the TRANSFERRED port (e.ports[0]): the page listens on the other
  // end of the MessageChannel, not on the serviceWorker object's message event.
  if (e.ports && e.ports[0]) e.ports[0].postMessage(snap);
  else e.source.postMessage(snap);
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname === '/sw-proxied') {
    e.respondWith(fetch('/echo', { headers: { 'X-Sw-Proxy': '1' } }).then((r) => r.text().then((t) => new Response(t, { headers: { 'Content-Type': 'text/plain' } }))));
  }
});
`;

(async () => {
  let browser, session, server;
  try {
    browser = chooseChromiumBinary();
    const persona = buildPersona('cached-sw-gate', { os: 'Windows', timezone: 'America/New_York' });
    const { fingerprint } = persona;
    try {
      session = await launchPersonaBrowser(browser, persona);
    } catch (launchError) {
      if (/CDP persistent socket error|ECONNREFUSED|WebSocket/i.test(String(launchError?.message || ''))) {
        await delay(1500);
        session = await launchPersonaBrowser(browser, persona);
      } else throw launchError;
    }

    const echoHeaders = {};
    server = http.createServer((req, res) => {
      if (req.url.startsWith('/sw.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'max-age=86400'); // make the script cacheable
        res.end(SW_BODY);
        return;
      }
      if (req.url.startsWith('/echo')) {
        echoHeaders.ua = req.headers['user-agent'];
        echoHeaders.swProxy = req.headers['x-sw-proxy'];
        res.setHeader('Content-Type', 'text/plain');
        res.end('echo-ok');
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><body>sw-gate</body></html>');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;

    const connection = await openPage(session.port, origin + '/page1.html');
    await delay(500);

    // 1. Register the SW and read its scope (network script load -> prefixer path).
    const first = await evaluate(connection, `(async () => {
      let reg;
      try { reg = await navigator.serviceWorker.register('${origin}/sw.js', { scope: '${origin}/' }); }
      catch (e) { return JSON.stringify({ err: 'register: ' + e.message }); }
      await new Promise((resolve) => {
        if (reg.active && navigator.serviceWorker.controller) resolve();
        else if (reg.active) navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
        else reg.addEventListener('activechange', () => {
          if (navigator.serviceWorker.controller) resolve();
        }, { once: true });
        setTimeout(resolve, 8000);
      });
      const sw = navigator.serviceWorker.controller || reg.active;
      if (!sw) return JSON.stringify({ err: 'no controller' });
      const snap = await new Promise((resolve) => {
        const ch = new MessageChannel();
        ch.port1.onmessage = (e) => resolve(e.data);
        sw.postMessage('snap', [ch.port2]);
        setTimeout(() => resolve(JSON.stringify({ timeout: true })), 8000);
      });
      return JSON.stringify({ snap, controlled: Boolean(navigator.serviceWorker.controller) });
    })()`);
    const parsed1 = JSON.parse(first);
    assert.ok(!parsed1.err, 'registration failed: ' + first);
    assert.ok(parsed1.controlled, 'page1 not controlled after registration');
    const snap1 = JSON.parse(parsed1.snap);
    assert.ok(!snap1.timeout, 'first SW snapshot timed out');
    assert.equal(snap1.platform, fingerprint.platform, 'network SW platform');
    assert.equal(snap1.cores, fingerprint.hardwareConcurrency, 'network SW cores');
    assert.equal(snap1.ua, fingerprint.userAgent, 'network SW UA');

    // 2. SECOND navigation: the SW starts from the script cache (no network hit
    //    for sw.js). Its first-script execution gate must carry the persona.
    await connection.command('Page.navigate', { url: origin + '/page2.html' });
    await delay(3000); // allow SW start + controller claim
    const second = await evaluate(connection, `(async () => {
      if (!navigator.serviceWorker.controller) return JSON.stringify({ err: 'not controlled on page2' });
      const sw = navigator.serviceWorker.controller;
      const snap = await new Promise((resolve) => {
        const ch = new MessageChannel();
        ch.port1.onmessage = (e) => resolve(e.data);
        sw.postMessage('snap', [ch.port2]);
        setTimeout(() => resolve(JSON.stringify({ timeout: true })), 8000);
      });
      // SW-proxied fetch: exercises the SW's own network session headers.
      const proxied = await fetch('${origin}/sw-proxied').then((r) => r.text()).catch((e) => 'fetch-err:' + e.message);
      return JSON.stringify({ snap, proxied });
    })()`);
    const parsed2 = JSON.parse(second);
    assert.ok(!parsed2.err, 'page2 not controlled: ' + second);
    const snap2 = JSON.parse(parsed2.snap);
    assert.ok(!snap2.timeout, 'cached SW snapshot timed out');
    assert.equal(snap2.platform, fingerprint.platform, 'CACHED SW platform (script-cache start leaked host)');
    assert.equal(snap2.cores, fingerprint.hardwareConcurrency, 'CACHED SW cores');
    assert.equal(snap2.ua, fingerprint.userAgent, 'CACHED SW UA');
    assert.equal(snap2.scopeTZ, fingerprint.timezone, 'CACHED SW timezone');
    assert.equal(parsed2.proxied, 'echo-ok', 'SW-proxied fetch body');
    assert.ok(!echoHeaders.swProxy || echoHeaders.ua === fingerprint.userAgent,
      'SW-proxied fetch UA leaked host: ' + echoHeaders.ua);

    console.log('cached-sw-identity-gate: OK (network + script-cache SW scopes both persona)');
  } catch (error) {
    if (error instanceof Unavailable) {
      console.log('cached-sw-identity-gate: SKIP ' + error.message);
      process.exit(2);
    }
    console.error('FAIL ' + (error && error.stack ? error.stack : error));
    process.exit(1);
  } finally {
    try { session?.close(); } catch (_) {}
    try { await session?.close?.(); } catch (_) {}
    try { server?.close(); } catch (_) {}
  }
})();
