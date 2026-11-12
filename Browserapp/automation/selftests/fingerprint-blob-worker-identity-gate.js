'use strict';

/**
 * Regression gate: blob:/data: worker identity delivery (Chromium).
 *
 * The value-level audit found that Chromium 157's Fetch-layer worker prefixing
 * only intercepts NETWORK-loaded scripts: a worker built from a blob: or data:
 * URL ran with the host's navigator.platform / hardwareConcurrency, silently
 * contradicting the persona in any worker-side read. The main-world document
 * runtime now patches the Worker constructor (runtime/worker-constructor-patch.js)
 * so string-backed inline workers are re-emitted with the injection prefix.
 *
 * This gate asserts, on a production-shaped launch:
 *   1. a blob: worker reads the persona platform / cores / timezone / UA;
 *   2. a data: worker reads the persona platform / cores;
 *   3. the worker's OffscreenCanvas measureText carries the seeded jitter
 *      (parity with the main-thread mock): the SAME text measured on the main
 *      thread and in the worker must agree, and must differ from the stock
 *      host metrics by the persona jitter;
 *   4. network-loaded workers still receive the prefix (no regression from
 *      the constructor patch).
 *
 * Exit codes: 2 = prerequisites missing (skip), 1 = assertion failure.
 */

const assert = require('node:assert/strict');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {
  Unavailable, chooseChromiumBinary, buildPersona, launchPersonaBrowser, openPage, evaluate,
} = require('./native-gate-harness');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const WORKER_SNAP = `(() => {
  const out = { platform: navigator.platform, cores: navigator.hardwareConcurrency,
    ua: navigator.userAgent, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
  try {
    const c = new OffscreenCanvas(200, 60);
    const ctx = c.getContext('2d');
    ctx.font = '13px "Arial"';
    ctx.fillText('probe', 4, 22);
    out.mtext = ctx.measureText('mmmmmmmmmmlli').width;
  } catch (e) { out.mtextErr = String(e); }
  postMessage(JSON.stringify(out));
})()`;

(async () => {
  let browser, session, server;
  try {
    browser = chooseChromiumBinary();
    const persona = buildPersona('blob-worker-gate', { os: 'Windows', timezone: 'America/New_York' });
    const { fingerprint } = persona;
    // One bounded retry on a launch-time CDP failure: in full-suite context the
    // preceding native gates churn many browser processes and the first CDP
    // connection can hit a transient socket error before any assertion runs.
    // A failure AFTER launch is never retried — only the harness bring-up is.
    try {
      session = await launchPersonaBrowser(browser, persona);
    } catch (launchError) {
      if (/CDP persistent socket error|ECONNREFUSED|WebSocket/i.test(String(launchError?.message || ''))) {
        await delay(1500);
        session = await launchPersonaBrowser(browser, persona);
      } else throw launchError;
    }

    // Loopback origin for the network-loaded worker (MITM-free: engine prefixer
    // sees the response through the page Fetch domain).
    const networkWorkerBody = WORKER_SNAP;
    server = http.createServer((req, res) => {
      if (req.url.startsWith('/worker.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(networkWorkerBody);
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><body>gate</body></html>');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;

    const connection = await openPage(session.port, origin + '/gate.html');
    await delay(500);

    const probe = await evaluate(connection, `(async () => {
      const run = (w) => new Promise((resolve) => {
        w.onmessage = (e) => { w.terminate(); resolve(e.data); };
        w.onerror = (e) => resolve(JSON.stringify({ err: e.message }));
        setTimeout(() => resolve(JSON.stringify({ timeout: true })), 10000);
      });
      const blobWorker = await run(new Worker(URL.createObjectURL(new Blob([${JSON.stringify(WORKER_SNAP)}], { type: 'application/javascript' }))));
      const dataWorker = await run(new Worker('data:application/javascript;base64,' + btoa(${JSON.stringify(WORKER_SNAP)})));
      const networkWorker = await run(new Worker(location.origin + '/worker.js'));
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font = '13px "Arial"';
      const mainMtext = ctx.measureText('mmmmmmmmmmlli').width;
      return JSON.stringify({ blobWorker, dataWorker, networkWorker, mainMtext });
    })()`);
    assert.ok(probe && !probe.err, 'worker probes failed: ' + JSON.stringify(probe));
    const parsed = JSON.parse(probe);
    const blobWorker = JSON.parse(parsed.blobWorker);
    const dataWorker = JSON.parse(parsed.dataWorker);
    const networkWorker = JSON.parse(parsed.networkWorker);
    assert.ok(!blobWorker.timeout && !blobWorker.err, 'blob worker: ' + parsed.blobWorker);
    assert.ok(!dataWorker.timeout && !dataWorker.err, 'data worker: ' + parsed.dataWorker);
    assert.ok(!networkWorker.timeout && !networkWorker.err, 'network worker: ' + parsed.networkWorker);

    for (const [label, worker] of [['blob', blobWorker], ['data', dataWorker], ['network', networkWorker]]) {
      assert.equal(worker.platform, fingerprint.platform, label + ' worker platform');
      assert.equal(worker.cores, fingerprint.hardwareConcurrency, label + ' worker cores');
      assert.equal(worker.tz, fingerprint.timezone, label + ' worker timezone');
      assert.equal(worker.ua, fingerprint.userAgent, label + ' worker UA');
    }

    // measureText parity: worker and main thread agree (both jittered by the
    // same (origin, seed, font, text) hash); both differ from the raw host
    // metric, which the STOCK browser would return.
    assert.equal(blobWorker.mtext, parsed.mainMtext, 'worker vs main measureText parity');
    assert.notEqual(blobWorker.mtext, 116.95556640625, 'measureText must not be the raw host constant');
    assert.ok(Number.isFinite(blobWorker.mtext) && blobWorker.mtext > 100, 'measureText sanity: ' + blobWorker.mtext);

    console.log('blob-worker-identity-gate: OK (blob/data/network workers all persona; measureText parity ' + blobWorker.mtext.toFixed(4) + ')');
  } catch (error) {
    if (error instanceof Unavailable) { console.error('SKIP ' + error.message); process.exit(2); }
    console.error('FAIL ' + (error && error.stack || error)); process.exit(1);
  } finally {
    try { await session?.close(); } catch (_) {}
    server?.close?.();
  }
  process.exit(0);
})();
