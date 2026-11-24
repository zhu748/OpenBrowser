'use strict';

/**
 * Native Firefox Worker delivery gate. The control isolates launch prefs.
 * The local response filter and trusted forwarder phases check first-worker
 * instructions, including module dependencies, nested and persisted Workers.
 *
 * Exit codes: 2 = OPENBROWSER_FIREFOX_BINARY missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { gzipSync } = require('node:zlib');
const { spawn, execFileSync } = require('node:child_process');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');
const { buildFirefoxUserJs, firefoxStartupArgs } = require('../kernel-versions');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint } = require('../firefox-fingerprint');
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../../network/bidi-connection');
const https = require('node:https');
const net = require('node:net');
const { buildWorkerInjectionScript } = require('../fingerprint');
const { FirefoxWorkerMitmProxy } = require('../firefox-worker-mitm-proxy');
const { installFirefoxCa } = require('../firefox-trust-installer');
const { receiverShadowSnapshot } = require('./fingerprint-receiver-probes');
const { matrixSources, probeFirefoxWorkerMatrix, probeCachedFirefoxServiceWorker } = require('./firefox-worker-matrix-probes');
const { prepareFirefoxWorkerCache } = require('../firefox-worker-cache');
const { installFirefoxLocalWorkerFilter, LOOPBACK_HOSTS } = require('../firefox-local-workers');

async function closeFirefox(connection, child) {
  await connection.command('browser.close', {}, 5000).catch(() => {});
  connection.close();
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 5000);
    child.once('close', () => { clearTimeout(timer);resolve(); });
  });
}

function verifyReceivers(snapshot) {
  assert.ok(snapshot, 'dedicated worker receiver checks ran');
  for (const value of Object.values(snapshot)) {
    assert.equal(value.reads, 0);
    assert.equal(value.applyReads, 0);
    assert.deepEqual(value.after, value.before);
    if (value.forgery) assert.deepEqual(value.forgery, { errorName: 'TypeError', reads: 0 });
  }
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Firefox test process did not exit')), 5000);
    child.once('close', () => { clearTimeout(timer); resolve(); });
    child.kill('SIGKILL');
  });
}
async function navigate(connection, context, url) {
  await connection.command('browsingContext.navigate', { context, url, wait: 'complete' }, 20000);
  assert.equal(await evaluateBidi(connection, { context }, 'document.documentURI'), url,
    'test origin must finish loading before a relative Worker URL is used');
}
async function startupContext(connection) {
  // The production initializer reuses Firefox's initial about:blank tab. These
  // worker checks need that context, not a second tab or its readiness policy.
  const tree = await connection.command('browsingContext.getTree', {});
  assert.ok(tree.contexts?.[0]?.context, 'Firefox initial browsing context');
  return tree.contexts[0];
}
const SNAP = "({ua:navigator.userAgent,platform:navigator.platform,cores:navigator.hardwareConcurrency,languages:String(navigator.languages),tz:Intl.DateTimeFormat().resolvedOptions().timeZone,strict:(function(){return this})()===undefined})";
const dedicatedSrc = `"use strict";const first=${SNAP};(${receiverShadowSnapshot.toString()})().then(receivers=>postMessage(JSON.stringify({...first,receivers})));`;
const sharedSrc = `"use strict";const first=${SNAP};self.onconnect=(e)=>{e.ports[0].onmessage=()=>e.ports[0].postMessage(JSON.stringify(first));};`;
const serviceSrc = `"use strict";const first=${SNAP};self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('message',e=>e.ports[0].postMessage(JSON.stringify(first)));`;
const matrixScripts = matrixSources(SNAP);
const localDedicatedSource = '#!local-network-worker\n' + dedicatedSrc;
const evaluateMatrix = (connection, context) => evaluateBidi({
  command: (method, params) => connection.command(method, params, 120000),
}, { context }, `(${probeFirefoxWorkerMatrix.toString()})(${JSON.stringify(SNAP)})`);

(async () => {
  const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
  if (!binary) {
    console.error('SKIP Firefox worker gate requires OPENBROWSER_FIREFOX_BINARY.');
    process.exitCode = 2;
    return;
  }
  const version = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 }).match(/Firefox\s+(\d+(?:\.\d+)+)/)?.[1];
  if (!version) throw new Error('Cannot determine the native Firefox version');

  const serveLocal = (req, res) => {
    if (req.url === '/matrix/service.js') res.setHeader('Service-Worker-Allowed', '/');
    if (matrixScripts[req.url]) { res.setHeader('Content-Type', 'application/javascript');res.end(matrixScripts[req.url]); }
    else if (req.url.startsWith('/dedicated.js')) {
      res.writeHead(200, { 'Content-Type': 'application/javascript', 'Content-Encoding': 'gzip', 'Cache-Control': 'max-age=600' });
      res.end(gzipSync(localDedicatedSource));
    }
    else if (req.url.startsWith('/shared.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(sharedSrc); }
    else if (req.url.startsWith('/service.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(serviceSrc); }
    else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><body></body>'); }
  };
  const server = http.createServer(serveLocal);
  const ipv6 = http.createServer(serveLocal);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  await new Promise((resolve, reject) => {
    ipv6.once('error', error => ['EADDRNOTAVAIL', 'EAFNOSUPPORT'].includes(error.code) ? resolve() : reject(error));
    ipv6.listen(0, '::1', resolve);
  });

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ff-worker-'));
  const controlProfile = sanitizeProfile({ id: 'ff-worker-gate', name: 'ff-worker-gate', engine: 'firefox', os: 'Windows', width: 1440, height: 900,
    privacy: { cores: 4, memory: 0, webrtc: 'disabled', fontListMode: 'real', timezoneMode: 'custom', timezone: 'America/New_York',
      fingerprint: { languages: ['fr_ca', 'en-US;q=0.9', 'FR-CA'] } }, advanced: { showInfoPage: false } });
  const controlFp = buildFirefoxFingerprint(controlProfile, version);
  assert.deepEqual(controlFp.languages, ['fr-CA', 'en-US']);
  await fs.writeFile(path.join(root, 'user.js'), buildFirefoxUserJs({
    userAgent: controlFp.userAgent, acceptLanguages: controlFp.languages.join(','), locale: controlFp.languages[0],
    proxyEndpoint: 'http://127.0.0.1:9', noProxyHosts: LOOPBACK_HOSTS.join(', '),
    extraPrefs: [...firefoxExtraUserPrefs(controlProfile, controlFp).filter(([name]) => name !== 'dom.maxHardwareConcurrency'),
      ['network.dns.disablePrefetch', true], ['network.prefetch-next', false], ['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
  }), { mode: 0o600 });
  const child = spawn(binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: controlFp.timezone },
  });
  try {
    const wsUrl = await waitForFirefoxEndpoint(child, 30000);
    const conn = new BidiConnection(wsUrl, {});
    await conn.open();
    await conn.command('session.new', { capabilities: { alwaysMatch: {} } });
    const ctx = await startupContext(conn);
    await navigate(conn, ctx.context, 'http://127.0.0.1:' + server.address().port + '/');
    const raw = await evaluateBidi(conn, { context: ctx.context }, `(async () => {
      const out = {};
      out.dedicated = await new Promise((resolve) => {
        const w = new Worker('/dedicated.js');
        w.onmessage = (e) => { w.terminate(); resolve(JSON.parse(String(e.data))); };
        w.onerror = () => resolve(null);
      });
      out.shared = await new Promise((resolve) => {
        const sw = new SharedWorker('/shared.js');
        sw.port.onmessage = (e) => { sw.port.close(); resolve(JSON.parse(String(e.data))); };
        sw.port.start(); sw.port.postMessage('go');
        setTimeout(() => resolve(null), 6000);
      });
      out.service = await (async () => {
        try {
          const reg = await navigator.serviceWorker.register('/service.js');
          await navigator.serviceWorker.ready;
          const ch = new MessageChannel();
          return await new Promise((resolve) => {
            ch.port1.onmessage = (e) => resolve(JSON.parse(String(e.data)));
            setTimeout(() => resolve(null), 6000);
            reg.active.postMessage('go', [ch.port2]);
          });
        } catch (_) { return null; }
      })();
      return JSON.stringify(out);
    })()`);
    const workers = JSON.parse(raw);
    for (const kind of ['dedicated', 'shared', 'service']) {
      const w = workers[kind];
      assert.ok(w, kind + ' worker produced no first read');
      // Delivered-by-prefs fields: strict persona assertions.
      assert.equal(w.ua, controlFp.userAgent, kind + ' worker UA (via prefs)');
      assert.equal(w.platform, controlFp.platform, kind + ' worker platform (via prefs)');
      assert.equal(w.languages, controlFp.languages.join(','), kind + ' worker languages');
      assert.equal(w.tz, controlFp.timezone, kind + ' worker timezone');
      assert.equal(w.strict, true, kind + ' worker strict semantics');
      if (kind === 'dedicated') verifyReceivers(w.receivers);
      console.log('PASS ff-worker ' + kind + ' first read: UA/platform/languages/timezone are persona');
      // JS-patch-only field: record the documented gap. The assertion is on the
      // DELIVERED capability set, never relaxed to pretend coverage.
      if (w.cores !== controlFp.hardwareConcurrency) {
        console.log('NOTE ff-worker ' + kind + ' hardwareConcurrency is host value (' + w.cores + '), persona is ' + controlFp.hardwareConcurrency
          + ' (prefs-only control)');
      } else {
        console.log('PASS ff-worker ' + kind + ' hardwareConcurrency matches persona');
      }
    }
    console.log('firefox-worker-delivery-selftest: prefs phase OK');
    const nativeMatrix = await evaluateMatrix(conn, ctx.context);
    console.log('NATIVE_WORKER_MATRIX', JSON.stringify(nativeMatrix));
    const nativeCores = nativeMatrix.network.cores;

    await closeFirefox(conn, child);
    const directProfile = sanitizeProfile({ ...controlProfile, privacy: { ...controlProfile.privacy, cores: nativeCores === 24 ? 4 : 24 } });
    const directFp = buildFirefoxFingerprint(directProfile, version);
    assert.notEqual(directFp.hardwareConcurrency, nativeCores, 'configured loopback cores must differ from the native control');
    const directSource = buildWorkerInjectionScript(directFp);
    await prepareFirefoxWorkerCache(root, directSource, { localDelivery: true });
    await fs.writeFile(path.join(root, 'user.js'), buildFirefoxUserJs({
      userAgent: directFp.userAgent, acceptLanguages: directFp.languages.join(','), locale: directFp.languages[0],
      proxyEndpoint: 'http://127.0.0.1:9', noProxyHosts: LOOPBACK_HOSTS.join(', '),
      extraPrefs: [...firefoxExtraUserPrefs(directProfile, directFp), ['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
    }), { mode: 0o600 });
    const localChild = spawn(binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: directFp.timezone },
    });
    let localConnection;
    try {
      localConnection = new BidiConnection(await waitForFirefoxEndpoint(localChild, 30000), {});
      await localConnection.open();
      const local = await initializeFirefoxFingerprint(localConnection, directFp, directProfile, {
        installLocalWorkerFilter: () => installFirefoxLocalWorkerFilter(localConnection, root, directSource),
      });
      await navigate(localConnection, local.context, 'http://127.0.0.1:' + server.address().port + '/');
      const oldService = await evaluateBidi(localConnection, { context: local.context }, `(${probeCachedFirefoxServiceWorker.toString()})()`);
      assert.equal(oldService.missing, true, 'older local registration is invalidated');
      const localMatrix = await evaluateMatrix(localConnection, local.context);
      for (const [kind, result] of Object.entries(localMatrix)) {
        assert.equal(result.cores, directFp.hardwareConcurrency, kind + ' local first read: ' + JSON.stringify(result));
      }
      assert.equal(localMatrix.module.dependency.cores, directFp.hardwareConcurrency, 'local static module dependency first read');
      assert.equal(localMatrix.network.strict, true, 'local filter preserves strict semantics');
      const readGzipWorker = `new Promise(resolve => {
        const worker = new Worker('/dedicated.js');
        worker.onmessage = event => { worker.terminate(); resolve(JSON.parse(event.data)); };
        worker.onerror = event => resolve({ error: event.message });
      })`;
      for (let count = 0; count < 2; count++) {
        const gzipWorker = await evaluateBidi(localConnection, { context: local.context }, readGzipWorker);
        assert.equal(gzipWorker.cores, directFp.hardwareConcurrency, 'local gzip Worker: ' + JSON.stringify(gzipWorker));
        verifyReceivers(gzipWorker.receivers);
      }
      assert.equal(await evaluateBidi(localConnection, { context: local.context }, "fetch('/dedicated.js').then(response => response.text())"),
        localDedicatedSource, 'ordinary fetch of the same URL preserves the original response');
      const aliases = ['http://localhost:' + server.address().port + '/'];
      if (ipv6.listening) aliases.push('http://[::1]:' + ipv6.address().port + '/');
      for (const url of aliases) {
        await navigate(localConnection, local.context, url);
        const result = await evaluateBidi(localConnection, { context: local.context }, readGzipWorker);
        assert.equal(result.cores, directFp.hardwareConcurrency, 'loopback alias first read: ' + url);
      }
      console.log('PASS ff-worker direct loopback first reads', nativeCores + ' native cores → ' + directFp.hardwareConcurrency + ' configured');
    } finally {
      if (localConnection) await closeFirefox(localConnection, localChild);
      await stopChild(localChild);
    }

    // ---- PHASE 2: proxy-delivered JS-only fields over HTTPS ----
    // Normalize the new core count in both the privacy and fingerprint settings.
    const profile = sanitizeProfile({ ...controlProfile, privacy: { ...controlProfile.privacy, cores: nativeCores === 4 ? 6 : 4 } });
    const fp = buildFirefoxFingerprint(profile, version);
    assert.notEqual(fp.hardwareConcurrency, nativeCores, 'configured HTTPS cores must differ from the native control');
    // Isolate forwarder delivery from the native CPU cap in the remaining tests.
    const proxyPrefs = firefoxExtraUserPrefs(profile, fp).filter(([name]) => name !== 'dom.maxHardwareConcurrency');
    const httpsTmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ff-mitm-leaf-'));
    const keyPath = path.join(httpsTmp, 'k.pem');
    const certPath = path.join(httpsTmp, 'c.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', keyPath, '-out', certPath,
      '-days', '2', '-nodes', '-subj', '/CN=127.0.0.1',
      '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost'], { stdio: ['ignore', 'ignore', 'ignore'], timeout: 15000 });
    const httpsWorkerBody = '#!network-worker\n' + dedicatedSrc;
    const httpsServer = https.createServer({
      key: await fs.readFile(keyPath),
      cert: await fs.readFile(certPath),
    }, (req, res) => {
      if (req.url === '/matrix/service.js') res.setHeader('Service-Worker-Allowed', '/');
      if (matrixScripts[req.url]) { res.setHeader('Content-Type', 'application/javascript');res.end(matrixScripts[req.url]); }
      else if (req.url === '/') { res.setHeader('Content-Type', 'text/html');res.end('<!doctype html><body>Worker matrix</body>'); }
      else { res.setHeader('Content-Type', 'application/javascript');res.end(httpsWorkerBody); }
    });
    await new Promise((r) => httpsServer.listen(0, '127.0.0.1', r));
    const httpsPort = httpsServer.address().port;

    // Product trust path: import the proxy CA into the profile's NSS store
    // (works for ANY origin). Falls back to per-host cert_override pins only
    // when certutil is unavailable, so the gate still documents delivery.
    const mitmRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ff-worker-mitm-'));

    const proxy = new FirefoxWorkerMitmProxy({
      workerSource: buildWorkerInjectionScript(fp),
      terminatingHosts: ['127.0.0.1', 'localhost'],
      trustedUpstreamCert: await fs.readFile(certPath),
      allowedUpstreamHosts: ['127.0.0.1', 'localhost'], // loopback test origin
    });
    await proxy.start();
    const trustResult = installFirefoxCa(mitmRoot, proxy.ca.cert);
    let trustMode = 'nss-ca';
    if (!trustResult.ok) {
      trustMode = 'cert-override (certutil unavailable: ' + trustResult.reason + ')';
      const { certOverrideLine } = require('../firefox-worker-mitm-proxy');
      const { sha256Base64, leafDer } = proxy.fingerprintsFor('localhost');
      await fs.writeFile(path.join(mitmRoot, 'cert_override.txt'),
        '# PSM Certificate Override Settings file\n# This is a generated file! Do not edit.\n'
        + certOverrideLine({ host: 'localhost', port: httpsPort, sha256Base64, leafDer }) + '\n', 'utf8');
    }
    console.log('NOTE ff-worker MITM trust mode: ' + trustMode);
    await prepareFirefoxWorkerCache(mitmRoot, proxy.workerSource);

    await fs.writeFile(path.join(mitmRoot, 'user.js'), buildFirefoxUserJs({
      userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
      proxyEndpoint: proxy.url,
      noProxyHosts: '',
      extraPrefs: [...proxyPrefs,
        ['network.proxy.allow_hijacking_localhost', true],
        ['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
    }), { mode: 0o600 });

    const child2 = spawn(binary, firefoxStartupArgs({ root: mitmRoot, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
      stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: fp.timezone },
    });
    try {
      const wsUrl2 = await waitForFirefoxEndpoint(child2, 30000);
      const conn2 = new BidiConnection(wsUrl2, {});
      await conn2.open();
      await initializeFirefoxFingerprint(conn2, fp, profile, { workerProxyReady: true });
      const ctx2 = await startupContext(conn2);
      await navigate(conn2, ctx2.context, 'https://localhost:' + httpsPort + '/');
      const matrix = await evaluateMatrix(conn2, ctx2.context);
      console.log('INJECTED_WORKER_MATRIX', JSON.stringify(matrix));
      for (const [kind, value] of Object.entries(matrix)) {
        assert.equal(value.error, undefined, kind + ' must run');
        for (const [label, fields] of [[kind, value], ...(value.dependency ? [[kind + ' dependency', value.dependency]] : [])]) {
          assert.equal(fields.cores, fp.hardwareConcurrency, label + ' first-read cores');
          assert.equal(fields.ua, fp.userAgent, label + ' first-read UA');
          assert.equal(fields.platform, fp.platform, label + ' first-read platform');
          assert.equal(fields.tz, fp.timezone, label + ' first-read timezone');
        }
      }
      const mitmProbe = await evaluateBidi(conn2, { context: ctx2.context }, `(async () => {
        return await new Promise((resolve) => {
          const w = new Worker('/worker.js');
          w.onmessage = (e) => { w.terminate(); resolve(JSON.parse(String(e.data))); };
          w.onerror = (e) => resolve({ err: e.message });
          setTimeout(() => resolve({ timeout: true }), 8000);
        });
      })()`);
      assert.ok(mitmProbe && !mitmProbe.err && !mitmProbe.timeout, 'HTTPS worker through the MITM proxy failed: ' + JSON.stringify(mitmProbe));
      assert.equal(mitmProbe.ua, fp.userAgent, 'MITM worker UA');
      verifyReceivers(mitmProbe.receivers);
      assert.equal(mitmProbe.strict, true, 'MITM worker strict semantics');
      assert.equal(mitmProbe.platform, fp.platform, 'MITM worker platform');
      assert.equal(mitmProbe.tz, fp.timezone, 'MITM worker timezone');
      assert.equal(mitmProbe.cores, fp.hardwareConcurrency,
        'MITM worker hardwareConcurrency must be the persona value (this is the JS-only field the proxy delivers)');
      console.log('PASS ff-worker dedicated first read over HTTPS via MITM proxy: JS-only fields (hardwareConcurrency) are persona');
      await evaluateBidi(conn2, { context: ctx2.context }, `(async()=>{
        document.cookie='worker_keep=retained;Max-Age=3600;SameSite=Lax;Secure';localStorage.setItem('worker_keep','retained');
        await (await caches.open('worker-retention')).put('/retained',new Response('retained'));
      })()`);
      const registrationFile = path.join(mitmRoot, 'serviceworker.txt');
      for (let retry = 0; ; retry++) {
        if (await fs.readFile(registrationFile, 'utf8').catch(() => '').then(text => text.includes('/matrix/service.js'))) break;
        if (retry >= 100) throw Error('Firefox did not persist the worker registration');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      await closeFirefox(conn2, child2);
      const changedCores = [6, 8, 12].find(cores => cores !== nativeCores && cores !== fp.hardwareConcurrency);
      const changedProfile = sanitizeProfile({ ...profile, privacy: { ...profile.privacy, cores: changedCores } });
      const changed = buildFirefoxFingerprint(changedProfile, version);
      for (const current of [fp, changed]) {
        proxy.setWorkerSource(buildWorkerInjectionScript(current));
        const cacheState = await prepareFirefoxWorkerCache(mitmRoot, proxy.workerSource);
        assert.equal(cacheState.reset, current === changed, 'only a changed worker identity invalidates registrations');
        const cachedChild = spawn(binary, firefoxStartupArgs({ root: mitmRoot, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
          stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: current.timezone },
        });
        let restartConnection;
        try {
          restartConnection = new BidiConnection(await waitForFirefoxEndpoint(cachedChild, 30000), {});
          await restartConnection.open();
          await initializeFirefoxFingerprint(restartConnection, current, current === changed ? changedProfile : profile, { workerProxyReady: true });
          const ctx3 = await startupContext(restartConnection);
          await navigate(restartConnection, ctx3.context, 'https://localhost:' + httpsPort + '/');
          const cached = await evaluateBidi(restartConnection, { context: ctx3.context }, `(${probeCachedFirefoxServiceWorker.toString()})()`);
          if (cacheState.reset) {
            assert.equal(cached.missing, true, 'old cached programs cannot execute under a new identity');
            const fresh = await evaluateMatrix(restartConnection, ctx3.context);
            assert.equal(fresh.service.cores, current.hardwareConcurrency, 'reregistered worker uses the changed identity');
          } else assert.equal(cached.cores, current.hardwareConcurrency, 'unchanged cached worker keeps its identity');
          const retained = await evaluateBidi(restartConnection, { context: ctx3.context }, `(async()=>({cookie:document.cookie,
            local:localStorage.getItem('worker_keep'),cache:await(await(await caches.open('worker-retention')).match('/retained')).text()}))()`);
          assert.ok(retained.cookie.includes('worker_keep=retained'));
          assert.equal(retained.local, 'retained');assert.equal(retained.cache, 'retained');
          console.log('PASS ff-worker cached restart', cacheState.reset ? 'changed identity, fresh registration' : 'same identity, registration preserved', '(origin data retained)');
          await closeFirefox(restartConnection, cachedChild);
        } finally { restartConnection?.close();await stopChild(cachedChild); }
      }

      // ---- PHASE 3: same delivery through a chained AUTHENTICATED bridge ----
      // The engine chains the MITM forwarder through the authenticated proxy
      // bridge; assert the worker still reads persona fields on that path.
      const authBridge = net.createServer((c) => {
        let buf = Buffer.alloc(0);
        const onBridgeData = (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          const marker = buf.indexOf('\r\n\r\n');
          if (marker < 0) return;
          c.removeListener('data', onBridgeData);
          const head = buf.subarray(0, marker).toString('latin1');
          const rest = buf.subarray(marker + 4);
          const expected = 'Basic ' + Buffer.from('gate:token', 'utf8').toString('base64');
          if (!new RegExp('proxy-authorization:\\s*' + expected, 'i').test(head)) {
            c.end('HTTP/1.1 407 Proxy Authentication Required\r\nConnection: close\r\n\r\n');
            return;
          }
          const first = head.split(' ')[0].toUpperCase();
          if (first === 'CONNECT') {
            const target = head.split(' ')[1].replace(/\s+HTTP.*$/, '');
            const sep = target.lastIndexOf(':');
            const up = net.connect({ host: target.slice(0, sep), port: Number(target.slice(sep + 1)) }, () => {
              c.write('HTTP/1.1 200 Connection Established\r\n\r\n');
              if (rest.length) up.write(rest);
              c.pipe(up); up.pipe(c);
            });
            up.on('error', () => c.destroy());
            c.on('error', () => up.destroy());
          } else {
            // Plain absolute-URI request: forward with the absolute form intact.
            const up = net.connect({ host: '127.0.0.1', port: httpsServer.address().port }, () => {
              up.write(head + '\r\n\r\n');
              if (rest.length) up.write(rest);
              c.pipe(up); up.pipe(c);
            });
            up.on('error', () => c.destroy());
            c.on('error', () => up.destroy());
          }
        };
        c.on('data', onBridgeData);
      });
      await new Promise((r) => authBridge.listen(0, '127.0.0.1', r));

      const chained = new FirefoxWorkerMitmProxy({
        workerSource: buildWorkerInjectionScript(fp),
        upstreamProxy: { host: '127.0.0.1', port: authBridge.address().port, username: 'gate', password: 'token' },
        trustedUpstreamCert: await fs.readFile(certPath),
        allowedUpstreamHosts: ['localhost', '127.0.0.1'],
      });
      await chained.start();

      const chainRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ff-worker-chain-'));
      const chainTrust = installFirefoxCa(chainRoot, chained.ca.cert);
      if (!chainTrust.ok) {
        const { certOverrideLine } = require('../firefox-worker-mitm-proxy');
        const { sha256Base64, leafDer } = chained.fingerprintsFor('localhost');
        await fs.writeFile(path.join(chainRoot, 'cert_override.txt'),
          '# PSM Certificate Override Settings file\n# This is a generated file! Do not edit.\n'
          + certOverrideLine({ host: 'localhost', port: httpsPort, sha256Base64, leafDer }) + '\n', 'utf8');
      }
      await fs.writeFile(path.join(chainRoot, 'user.js'), buildFirefoxUserJs({
        userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
        proxyEndpoint: chained.url,
        noProxyHosts: '',
        extraPrefs: [...proxyPrefs,
          ['network.proxy.allow_hijacking_localhost', true],
          ['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
      }), { mode: 0o600 });

      const child3 = spawn(binary, firefoxStartupArgs({ root: chainRoot, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
        stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: fp.timezone },
      });
      try {
        const wsUrl3 = await waitForFirefoxEndpoint(child3, 30000);
        const conn3 = new BidiConnection(wsUrl3, {});
        await conn3.open();
        await conn3.command('session.new', { capabilities: { alwaysMatch: {} } });
        const ctx3 = await startupContext(conn3);
        await navigate(conn3, ctx3.context, 'https://localhost:' + httpsPort + '/');
        const chainProbe = await evaluateBidi(conn3, { context: ctx3.context }, `(async () => {
          return await new Promise((resolve) => {
            const w = new Worker('/worker.js');
            w.onmessage = (e) => { w.terminate(); resolve(JSON.parse(String(e.data))); };
            w.onerror = (e) => resolve({ err: e.message });
            setTimeout(() => resolve({ timeout: true }), 8000);
          });
        })()`);
        assert.ok(chainProbe && !chainProbe.err && !chainProbe.timeout, 'HTTPS worker through the chained authenticated bridge failed: ' + JSON.stringify(chainProbe));
        assert.equal(chainProbe.cores, fp.hardwareConcurrency, 'chained worker hardwareConcurrency must be the persona value');
        assert.equal(chainProbe.ua, fp.userAgent, 'chained worker UA');
        verifyReceivers(chainProbe.receivers);
        assert.equal(chainProbe.strict, true, 'chained worker strict semantics');
        console.log('PASS ff-worker first read over HTTPS via chained authenticated bridge: JS-only fields are persona behind a real proxy too');
        conn3.close();
      } finally {
        await stopChild(child3);
        await chained.close();
        authBridge.close();
        await fs.rm(chainRoot, { recursive: true, force: true }).catch(() => {});
      }
      console.log('firefox-worker-delivery-selftest: OK (loopback, trusted forwarder and chained proxy on Firefox ' + version + ')');
    } finally {
      await stopChild(child2);
      await proxy.close();
      httpsServer.close();
      await fs.rm(mitmRoot, { recursive: true, force: true }).catch(() => {});
      await fs.rm(httpsTmp, { recursive: true, force: true }).catch(() => {});
    }
  } finally {
    await stopChild(child);
    server.closeAllConnections?.();
    server.close();
    ipv6.closeAllConnections?.();
    ipv6.close();
    await fs.rm(root, { recursive: true, force: true }).catch(() => {});
  }
})().catch((error) => {
  console.error('FAIL ' + (error && error.message || error));
  process.exitCode = 1;
});
