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
const http = require('node:http');
const {
  Unavailable, chooseChromiumBinary, buildPersona, launchPersonaBrowser, openPage, evaluate,
} = require('./native-gate-harness');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Full-snapshot body shared by the nested-worker probes: same fields as
// WORKER_SNAP, delivered without the outer wrapper. Single-quoted with the
// embedded font name in double quotes (no escape games).
const NESTED_SNAP_BODY = 'const out = { platform: navigator.platform, cores: navigator.hardwareConcurrency, ua: navigator.userAgent, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }; try { const c = new OffscreenCanvas(200, 60); const ctx = c.getContext("2d"); ctx.font = "13px Arial"; ctx.fillText("probe", 4, 22); out.mtext = ctx.measureText("mmmmmmmmmmlli").width; } catch (e) { out.mtextErr = String(e); } postMessage(JSON.stringify(out));';

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

// SharedWorker variant: same fields, but delivered over the first connect()ed
// MessagePort (SharedWorkerGlobalScope cannot postMessage the page directly).
const SHARED_WORKER_SNAP = `(() => {
  self.onconnect = (e) => {
    const port = e.ports[0];
    port.start();
    const out = { platform: navigator.platform, cores: navigator.hardwareConcurrency,
      ua: navigator.userAgent, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
    try {
      const c = new OffscreenCanvas(200, 60);
      const ctx = c.getContext('2d');
      ctx.font = '13px "Arial"';
      ctx.fillText('probe', 4, 22);
      out.mtext = ctx.measureText('mmmmmmmmmmlli').width;
    } catch (err) { out.mtextErr = String(err); }
    port.postMessage(JSON.stringify(out));
  };
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
      // Extensionless worker endpoint: the URL carries no .js suffix, so only the
      // resourceType-"Other" + Sec-Fetch-Dest discriminator can reach it. This is
      // the P0 delivery hole this gate protects against reopening.
      if (req.url.startsWith('/api/worker')) {
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
      const extensionlessWorker = await run(new Worker(location.origin + '/api/worker'));
      // Binary-backed blob: the bytes are identical to WORKER_SNAP but travel
      // as a Uint8Array part — no string part anywhere in the Blob.
      const bytes = new TextEncoder().encode(${JSON.stringify(WORKER_SNAP)});
      const binaryBlobWorker = await run(new Worker(URL.createObjectURL(new Blob([bytes], { type: 'application/javascript' }))));
      // Response-derived blob: the classic wasm-compile pattern
      // (fetch->arrayBuffer->Blob) a detector uses to dodge string captures.
      const respBlob = await fetch(location.origin + '/worker.js').then((r) => r.blob());
      const responseWorker = await run(new Worker(URL.createObjectURL(respBlob)));
      // Module worker with blob URL.
      const moduleWorker = await run(new Worker(URL.createObjectURL(new Blob(['export default null;' + ${JSON.stringify(WORKER_SNAP)}], { type: 'text/javascript' })), { type: 'module' }));
      // importScripts(blob:) from inside a classic blob worker: the nested
      // script runs AFTER the outer worker's own persona bootstrap, so it must
      // be wrapped by the worker-side importScripts patch.
      const nestedSrc = "importScripts(URL.createObjectURL(new Blob([" + JSON.stringify(${JSON.stringify(WORKER_SNAP)}) + "], { type: 'application/javascript' })));";
      const importScriptsWorker2 = await run(new Worker(URL.createObjectURL(new Blob([nestedSrc], { type: 'application/javascript' }))));
      // SharedWorker via blob URL.
      const sharedRun = () => new Promise((resolve) => {
        try {
          const sw = new SharedWorker(URL.createObjectURL(new Blob([${JSON.stringify(SHARED_WORKER_SNAP)}], { type: 'application/javascript' })));
          sw.port.onmessage = (e) => resolve(e.data);
          sw.onerror = (e) => resolve(JSON.stringify({ err: e.message }));
          setTimeout(() => resolve(JSON.stringify({ timeout: true })), 10000);
          sw.port.start();
        } catch (e) { resolve(JSON.stringify({ err: String(e.message) })); }
      });
      const sharedWorker = await sharedRun();
      // Nested classic worker (worker created INSIDE a blob worker): the
      // document-side patch does not run in worker scopes, so the worker-scope
      // nested patch must deliver the persona. Assembled via JSON literal
      // operands — never spliced inside quotes.
      const nestedInner = ${JSON.stringify(NESTED_SNAP_BODY)};
      const nestedOuter = 'const NW = new Worker(URL.createObjectURL(new Blob([' + JSON.stringify(nestedInner) + '], { type: ' + JSON.stringify('application/javascript') + ' })));'
        + 'NW.onmessage = (e) => postMessage(e.data);'
        + 'NW.onerror = (e) => postMessage(JSON.stringify({ err: e.message }));'
        + 'setTimeout(() => postMessage(JSON.stringify({ timeout: true })), 9000);';
      const nestedWorker = await run(new Worker(URL.createObjectURL(new Blob([nestedOuter], { type: 'application/javascript' }))));
      // Nested worker that importScripts an inner blob (three delivery levels:
      // doc patch -> worker prefix -> worker-scope importScripts wrapper).
      // The inner ISU script is minted in-page (its URL is a page constant);
      // the middle worker embeds that URL as a JSON literal operand.
      const isuScript = ${JSON.stringify(NESTED_SNAP_BODY)};
      const isuUrl = URL.createObjectURL(new Blob([isuScript], { type: 'application/javascript' }));
      const middleScript = 'var IC = ' + JSON.stringify(isuUrl) + '; importScripts(IC);';
      const nestedIsOuter = 'const NW = new Worker(URL.createObjectURL(new Blob([' + JSON.stringify(middleScript) + '], { type: ' + JSON.stringify('application/javascript') + ' })));'
        + 'NW.onmessage = (e) => postMessage(e.data);'
        + 'NW.onerror = (e) => postMessage(JSON.stringify({ err: e.message }));'
        + 'setTimeout(() => postMessage(JSON.stringify({ timeout: true })), 9000);';
      const nestedImportScriptsWorker = await run(new Worker(URL.createObjectURL(new Blob([nestedIsOuter], { type: 'application/javascript' }))));
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.font = '13px "Arial"';
      const mainMtext = ctx.measureText('mmmmmmmmmmlli').width;
      return JSON.stringify({ blobWorker, dataWorker, networkWorker, extensionlessWorker, binaryBlobWorker, responseWorker, moduleWorker, importScriptsWorker: importScriptsWorker2, sharedWorker, nestedWorker, nestedImportScriptsWorker, mainMtext });
    })()`);
    assert.ok(probe && !probe.err, 'worker probes failed: ' + JSON.stringify(probe));
    const parsed = JSON.parse(probe);
    const blobWorker = JSON.parse(parsed.blobWorker);
    const dataWorker = JSON.parse(parsed.dataWorker);
    const networkWorker = JSON.parse(parsed.networkWorker);
    const extensionlessWorker = JSON.parse(parsed.extensionlessWorker);
    const binaryBlobWorker = JSON.parse(parsed.binaryBlobWorker);
    const responseWorker = JSON.parse(parsed.responseWorker);
    const moduleWorker = JSON.parse(parsed.moduleWorker);
    const importScriptsWorker = JSON.parse(parsed.importScriptsWorker);
    const sharedWorker = JSON.parse(parsed.sharedWorker);
    const nestedWorker = JSON.parse(parsed.nestedWorker);
    const nestedImportScriptsWorker = JSON.parse(parsed.nestedImportScriptsWorker);
    assert.ok(!blobWorker.timeout && !blobWorker.err, 'blob worker: ' + parsed.blobWorker);
    assert.ok(!dataWorker.timeout && !dataWorker.err, 'data worker: ' + parsed.dataWorker);
    assert.ok(!networkWorker.timeout && !networkWorker.err, 'network worker: ' + parsed.networkWorker);
    assert.ok(!extensionlessWorker.timeout && !extensionlessWorker.err, 'extensionless worker: ' + parsed.extensionlessWorker);

    for (const [label, worker] of [['blob', blobWorker], ['data', dataWorker], ['network', networkWorker], ['extensionless', extensionlessWorker],
      ['binaryBlob', binaryBlobWorker], ['responseBlob', responseWorker], ['module', moduleWorker],
      ['importScriptsNested', importScriptsWorker], ['shared', sharedWorker],
      ['nestedClassic', nestedWorker], ['nestedImportScripts', nestedImportScriptsWorker]]) {
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
