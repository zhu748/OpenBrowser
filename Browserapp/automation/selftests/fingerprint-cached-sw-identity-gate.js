#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { BrowserEngine } = require('../../engine');
const { buildFingerprint } = require('../fingerprint');
const { normalizeTimezone } = require('../request-header-rewriter');
const { Unavailable, chooseChromiumBinary, buildPersona, launchPersonaBrowser, openPage, evaluate } = require('./native-gate-harness');

// Capture identity at script entry, before any application event can run.
const workerSource = `
const entry = {
  platform: navigator.platform, cores: navigator.hardwareConcurrency, ua: navigator.userAgent,
  languages: Array.from(navigator.languages), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));
self.addEventListener('message', event => event.ports[0].postMessage(entry));
self.addEventListener('fetch', event => {
  if (new URL(event.request.url).pathname === '/sw-proxied') {
    event.respondWith(fetch('/echo', { headers: { 'X-Sw-Proxy': '1' } }));
  }
});`;

async function readWorker(register) {
  if (register) await navigator.serviceWorker.register('/sw.js');
  const registration = await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  }
  const entry = await new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = ({ data }) => { channel.port1.close(); resolve(data); };
    registration.active.postMessage('snapshot', [channel.port2]);
  });
  const headers = await (await fetch('/sw-proxied')).json();
  return { entry, headers };
}

function verifyWorker({ entry, headers }, fingerprint) {
  assert.equal(entry.platform, fingerprint.platform);
  assert.equal(entry.cores, fingerprint.hardwareConcurrency);
  assert.equal(entry.ua, fingerprint.userAgent);
  assert.deepEqual(entry.languages, fingerprint.languages);
  assert.equal(normalizeTimezone(entry.timezone), normalizeTimezone(fingerprint.timezone));
  assert.equal(headers['x-sw-proxy'], '1', 'request was forwarded by the Service Worker');
  assert.equal(headers['user-agent'], fingerprint.userAgent);
}

async function main() {
  const browser = chooseChromiumBinary();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'openbrowser-cached-worker-'));
  let session, page, serveScript = true, servedScripts = 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/sw.js') {
      if (!serveScript) { res.writeHead(503).end(); return; }
      servedScripts += 1;
      res.writeHead(200, { 'Content-Type': 'application/javascript' }).end(workerSource);
    } else if (req.url === '/echo') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(req.headers));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><title>Worker delivery</title>');
    }
  });
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const url = 'http://127.0.0.1:' + server.address().port;
    const before = buildPersona('cached-sw-gate', { os: 'Windows', timezone: 'America/New_York', kernelVersion: browser.version });
    const profile = { ...before.profile, privacy: {
      ...before.profile.privacy, timezone: 'Etc/UTC', fingerprint: {
        ...before.profile.privacy.fingerprint, hardwareConcurrency: before.fingerprint.hardwareConcurrency === 4 ? 8 : 4,
        languages: ['fr-CA', 'fr'],
      },
    } };
    const after = { profile, fingerprint: buildFingerprint({ ...profile, kernelVersion: browser.version }) };
    const preparer = Object.assign(Object.create(BrowserEngine.prototype), { assignments: new Map(), extensions: new Map() });
    const launch = async persona => {
      await preparer.prepareProfileFilesForStart(root, persona.profile, true);
      return launchPersonaBrowser(browser, persona, { profileRoot: root, gracefulClose: true });
    };
    const read = register => evaluate(page, '(' + readWorker.toString() + ')(' + register + ')');

    session = await launch(before);
    page = await openPage(session.port, url);
    verifyWorker(await read(true), before.fingerprint);
    assert.ok(servedScripts > 0);

    page.close();
    await session.close();
    assert.ok(session.child.exitCode !== null || session.child.signalCode !== null, 'first browser exited');
    // The second worker must use the registration from disk. A stale-prefix
    // regression cannot be hidden by a successful script download.
    serveScript = false;
    session = await launch(after);
    const archive = JSON.parse(await fs.readFile(path.join(root, 'OpenBrowserLegacySessions/chromium/manifest.json'), 'utf8'));
    assert.ok(archive.files.includes('Default/Sessions'), 'original native session was archived');
    page = await openPage(session.port, url);
    verifyWorker(await read(false), after.fingerprint);
    assert.ok(session.events.some(event => event.type === 'service-worker-first-script-injected'));
    console.log('cached-sw-identity-gate: OK (first-script identity after process restart with persisted worker)');
  } finally {
    page?.close();
    await session?.close();
    server.closeAllConnections();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

main().catch(error => {
  if (error instanceof Unavailable) {
    console.log('cached-sw-identity-gate: SKIP ' + error.message);
    process.exitCode = 2;
  } else {
    console.error(error);
    process.exitCode = 1;
  }
});
