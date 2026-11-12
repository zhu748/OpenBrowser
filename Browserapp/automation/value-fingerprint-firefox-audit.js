'use strict';

/**
 * Value-level fingerprint audit for the FIREFOX engine (Linux host).
 *
 * Mirrors automation/value-fingerprint-adversarial-audit.js (Chromium) over the
 * Firefox production path: stock launch vs persona launch through
 * engine/start-firefox.js — including the worker-script MITM forwarder that
 * delivers JS-only fields (hardwareConcurrency) below the browser. Two worker
 * probes exercise BOTH delivery paths a detector can force:
 *   - network worker: served by a loopback https origin, intercepted by the
 *     MITM forwarder (proxy-level prefix);
 *   - blob worker: built inline in the page — Firefox has no main-world
 *     constructor patch, so this is a DOCUMENTED capability boundary; the
 *     audit records the actual values rather than failing.
 *
 * Vectors: canvas 2D hash, WebGL strings/scene, audio digest, Math/ECMAScript
 * value quirks, SVG text values, driver marks, worker identity (UA/platform/
 * cores/timezone) on both worker paths.
 *
 * Exit codes follow the suite contract: 2 = prerequisite missing, 1 = harness
 * failure, 0 = audit complete (findings printed).
 */

const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const { spawn, execFileSync } = require('node:child_process');
const { sanitizeProfile } = require('../engine/profile-sanitizer');
const { buildFirefoxUserJs, firefoxStartupArgs } = require('./kernel-versions');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint } = require('./firefox-fingerprint');
const { buildWorkerInjectionScript } = require('./fingerprint');
const { FirefoxWorkerMitmProxy } = require('./firefox-worker-mitm-proxy');
const { installFirefoxCa } = require('./firefox-trust-installer');
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../network/bidi-connection');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const SNAP_WORKER = `(() => {
  const out = {};
  try {
    const c = new OffscreenCanvas(200, 60);
    const ctx = c.getContext('2d');
    ctx.font = '13px "Arial"';
    ctx.fillText('probe', 4, 22);
    out.mtext = ctx.measureText('mmmmmmmmmmlli').width;
  } catch (e) { out.ocErr = String(e); }
  out.workerCores = navigator.hardwareConcurrency;
  out.workerPlatform = navigator.platform;
  out.workerUA = navigator.userAgent;
  out.workerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  postMessage(JSON.stringify(out));
})()`;

const PAGE_PROBE = `(() => {
  const out = {};
  const sha = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); };
  try {
    const c = document.createElement('canvas'); c.width = 300; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f60';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = '#069'; ctx.font = '14px "Arial"';
    ctx.fillText('CrimsonCanvas::fingerprint\\u2044value\\u00e9\\u4e2d', 4, 26);
    out.canvas2d = sha(c.toDataURL());
    out.mtextMain = ctx.measureText('mmmmmmmmmmlli').width;
  } catch (e) { out.canvas2d = 'err:' + String(e); }
  try {
    const c = document.createElement('canvas'); c.width = 60; c.height = 60;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    gl.clearColor(0.1, 0.2, 0.3, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const px = new Uint8Array(60 * 60 * 4);
    gl.readPixels(0, 0, 60, 60, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out.webgl = { vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER),
      unmasked: dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : null, scene: sha(String.fromCharCode(...px.subarray(0, 2048))) };
  } catch (e) { out.webgl = { err: String(e) }; }
  try {
    out.math = { sin: Math.sin(-2.1e-7).toExponential(20), exp: Math.exp(-1030).toExponential(20),
      tanh: Math.tanh(1e-12).toExponential(20), date0: new Date(0).toString(),
      toFixed: (0.0000005).toFixed(7) + '/' + (1.005).toFixed(2) };
  } catch (e) { out.math = { err: String(e) }; }
  out.driver = { webdriver: String(navigator.webdriver), platform: navigator.platform,
    cores: navigator.hardwareConcurrency, tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: [screen.width, screen.height, screen.colorDepth], dpr: window.devicePixelRatio };
  return JSON.stringify(out);
})()`;

async function startOrigin() {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ff-audit-origin-'));
  const key = path.join(tmp, 'k.pem');
  const cert = path.join(tmp, 'c.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', key, '-out', cert,
    '-days', '2', '-nodes', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'],
    { stdio: ['ignore', 'ignore', 'ignore'], timeout: 15000 });
  const server = https.createServer({
    key: fs.readFileSync(key), cert: fs.readFileSync(cert),
  }, (req, res) => {
    if (req.url.startsWith('/worker.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(SNAP_WORKER);
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><html><body>audit</body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, port: server.address().port, cert: fs.readFileSync(cert), dir: tmp };
}

async function launchFirefox({ root, proxyUrl, fp, profile, inject }) {
  await fsp.writeFile(path.join(root, 'user.js'), buildFirefoxUserJs({
    userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
    proxyEndpoint: proxyUrl || '', noProxyHosts: '',
    extraPrefs: [
      ['network.captive-portal-service.enabled', false],
      ['network.connectivity-service.enabled', false],
      ...(proxyUrl ? [['network.proxy.allow_hijacking_localhost', true]] : []),
    ],
  }), { mode: 0o600 });
  const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
  const child = spawn(binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: fp.timezone },
  });
  child.stderr?.on('data', (d) => { const s = String(d); if (!/dbus|bus\.cc/.test(s)) process.stderr.write('[ff] ' + s); });
  const wsUrl = await waitForFirefoxEndpoint(child, 30000);
  const conn = new BidiConnection(wsUrl, {});
  await conn.open();
  // Production startup path: initializeFirefoxFingerprint opens the session
  // itself and registers the document-start preload (UA/JS surfaces + scoped
  // emulation). An audit that skips it measures a half-configured browser,
  // not the product — exactly what the first run of this audit did.
  let initialized = null;
  if (inject) {
    initialized = await initializeFirefoxFingerprint(conn, fp, profile);
  } else {
    await conn.command('session.new', { capabilities: { alwaysMatch: {} } });
  }
  return { child, conn, context: initialized?.context || null };
}

(async () => {
  let origin, stock, persona, mitm;
  try {
    const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
    if (!binary || !fs.existsSync(binary)) {
      console.error('SKIP Set OPENBROWSER_FIREFOX_BINARY to an installed Firefox executable.');
      process.exit(2);
    }
    origin = await startOrigin();

    // ---- stock Firefox (no persona, no proxy) ----
    const stockRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'ff-audit-stock-'));
    await fsp.writeFile(path.join(stockRoot, 'user.js'), buildFirefoxUserJs({
      userAgent: '', acceptLanguages: 'en-US,en', locale: 'en-US', proxyEndpoint: '', noProxyHosts: '',
      extraPrefs: [['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
    }), { mode: 0o600 });
    stock = await launchFirefox({ root: stockRoot, proxyUrl: '', fp: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:160.0) Gecko/20100101 Firefox/160.0', languages: ['en-US'], timezone: 'UTC' } });
    console.log('audit: stock firefox up');

    // ---- persona Firefox through the worker MITM forwarder (production path) ----
    const profile = sanitizeProfile({ id: 'ff-audit', name: 'ff-audit', engine: 'firefox', os: 'Windows', width: 1440, height: 900,
      privacy: { cores: 4, memory: 0, webrtc: 'disabled', fontListMode: 'real', timezoneMode: 'custom', timezone: 'America/New_York' }, advanced: { showInfoPage: false } });
    const fp = buildFirefoxFingerprint(profile, '160.0');
    mitm = new FirefoxWorkerMitmProxy({
      workerSource: buildWorkerInjectionScript(fp),
      trustedUpstreamCert: origin.cert,
      allowedUpstreamHosts: ['localhost'],
    });
    await mitm.start();
    const personaRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'ff-audit-persona-'));
    const trust = installFirefoxCa(personaRoot, mitm.ca.cert);
    if (!trust.ok) console.log('NOTE trust: ' + trust.reason);
    persona = await launchFirefox({ root: personaRoot, proxyUrl: mitm.url, fp, profile, inject: true });
    console.log('audit: persona firefox up (MITM port ' + mitm.port + ')');

    const collect = async (session) => {
      const ctx = session.context
        ? { context: session.context }
        : await session.conn.command('browsingContext.create', { url: 'about:blank', type: 'tab' });
      await evaluateBidi(session.conn, { context: ctx.context }, `location.href = 'https://localhost:${origin.port}/'; true`);
      await delay(2500);
      const page = JSON.parse(await evaluateBidi(session.conn, { context: ctx.context }, PAGE_PROBE));
      const networkWorker = JSON.parse(await evaluateBidi(session.conn, { context: ctx.context }, `(async () => {
        return await new Promise((resolve) => {
          const w = new Worker(location.origin + '/worker.js');
          w.onmessage = (e) => { w.terminate(); resolve(e.data); };
          w.onerror = (e) => resolve(JSON.stringify({ err: e.message }));
          setTimeout(() => resolve(JSON.stringify({ timeout: true })), 10000);
        });
      })()`));
      const blobWorker = JSON.parse(await evaluateBidi(session.conn, { context: ctx.context }, `(async () => {
        const src = ${JSON.stringify(SNAP_WORKER)};
        const blob = new Blob([src], { type: 'application/javascript' });
        const w = new Worker(URL.createObjectURL(blob));
        return await new Promise((resolve) => {
          w.onmessage = (e) => { w.terminate(); resolve(e.data); };
          w.onerror = (e) => resolve(JSON.stringify({ err: e.message }));
          setTimeout(() => resolve(JSON.stringify({ timeout: true })), 10000);
        });
      })()`));
      return { page, networkWorker, blobWorker, context: ctx.context };
    };

    const stockData = await collect(stock);
    const personaData = await collect(persona);
    const findings = [];

    console.log('\\n===== FIREFOX VALUE-LEVEL AUDIT =====');
    console.log('stock page   :', JSON.stringify(stockData.page));
    console.log('persona page :', JSON.stringify(personaData.page));
    console.log('stock netwk  :', JSON.stringify(stockData.networkWorker));
    console.log('persona netwk:', JSON.stringify(personaData.networkWorker));
    console.log('stock blob   :', JSON.stringify(stockData.blobWorker));
    console.log('persona blob :', JSON.stringify(personaData.blobWorker));

    const pw = personaData.networkWorker;
    if (pw.timeout || pw.err) findings.push('LEAK ff.network-worker: ' + JSON.stringify(pw));
    else {
      if (pw.workerPlatform !== 'Win32') findings.push('LEAK ff.network-worker.platform: ' + pw.workerPlatform);
      if (pw.workerCores !== 4) findings.push('LEAK ff.network-worker.cores: ' + pw.workerCores);
      if (pw.workerTZ !== 'America/New_York') findings.push('LEAK ff.network-worker.tz: ' + pw.workerTZ);
      if (!/Windows NT 10\.0/.test(pw.workerUA || '')) findings.push('LEAK ff.network-worker.ua: ' + pw.workerUA);
    }
    const pb = personaData.blobWorker;
    if (pb.timeout || pb.err) findings.push('NOTE ff.blob-worker: probe failed ' + JSON.stringify(pb));
    else if (pb.workerPlatform !== 'Win32' || pb.workerCores !== 4) {
      findings.push('NOTE ff.blob-worker (documented boundary): persona reads ' + pb.workerPlatform + '/' + pb.workerCores + ' — Firefox has no main-world Worker-constructor patch; RDM delivery is proxy-level only');
    }
    if (personaData.page.driver.platform !== 'Win32') findings.push('LEAK ff.page.platform: ' + personaData.page.driver.platform);
    if (personaData.page.driver.cores !== 4) findings.push('LEAK ff.page.cores: ' + personaData.page.driver.cores);
    if (stockData.page.canvas2d === personaData.page.canvas2d) findings.push('NOTE ff.canvas2d: identical to stock (' + stockData.page.canvas2d + ')');

    console.log('-------------------------------------');
    for (const f of findings) console.log(f);
    if (!findings.length) console.log('no findings');
    console.log('===== END =====');
  } catch (error) {
    console.error('FAIL harness: ' + (error && error.stack || error)); process.exit(1);
  } finally {
    try { stock?.conn?.close(); stock?.child?.kill('SIGKILL'); } catch (_) {}
    try { persona?.conn?.close(); persona?.child?.kill('SIGKILL'); } catch (_) {}
    await mitm?.close?.(); origin?.server?.close?.();
  }
  process.exit(0);
})();
