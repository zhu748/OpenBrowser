'use strict';

/**
 * Firefox Worker delivery gate (empirical capability documentation).
 *
 * Verifies on a real Firefox what the three worker scopes deliver on their
 * FIRST instruction:
 *   - persona via prefs (userAgent, platform, languages, timezone): DELIVERED
 *     (general.useragent.override / intl prefs apply to worker scopes).
 *   - JS-patch-only fields (hardwareConcurrency): NOT deliverable on Firefox
 *     160 — verified empirically against all three standard channels:
 *       1. script.addPreloadScript does not run in worker realms (marker: no);
 *       2. script.realmCreated worker realms are not evaluable ("Realm ...
 *          not found" — the realm is gone before evaluate can land);
 *       3. BiDi network interception (continueRequest/provideResponse) fails
 *          on worker script loads ("Blocked request ... not found").
 *     Per the acceptance rules this is a NARROWED capability declaration,
 *     not a relaxed assertion: the gate asserts the delivered fields strictly
 *     and records the cores gap explicitly.
 *
 * Exit codes: 2 = OPENBROWSER_FIREFOX_BINARY missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, execFileSync } = require('node:child_process');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');
const { buildFirefoxUserJs, firefoxStartupArgs } = require('../kernel-versions');
const { buildFirefoxFingerprint } = require('../firefox-fingerprint');
const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../../network/bidi-connection');
const https = require('node:https');
const net = require('node:net');
const { buildWorkerInjectionScript } = require('../fingerprint');
const { FirefoxWorkerMitmProxy } = require('../firefox-worker-mitm-proxy');
const { installFirefoxCa } = require('../firefox-trust-installer');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const SNAP = "({ua:navigator.userAgent,platform:navigator.platform,cores:navigator.hardwareConcurrency,languages:String(navigator.languages),tz:Intl.DateTimeFormat().resolvedOptions().timeZone})";
const dedicatedSrc = `const first=${SNAP};postMessage(JSON.stringify(first));`;
const sharedSrc = `const first=${SNAP};self.onconnect=(e)=>{e.ports[0].onmessage=()=>e.ports[0].postMessage(JSON.stringify(first));};`;
const serviceSrc = `const first=${SNAP};self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('message',e=>e.ports[0].postMessage(JSON.stringify(first)));`;

(async () => {
  const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
  if (!binary) {
    console.error('SKIP Firefox worker gate requires OPENBROWSER_FIREFOX_BINARY.');
    process.exitCode = 2;
    return;
  }
  const version = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 }).match(/Firefox\s+(\d+(?:\.\d+)+)/)?.[1];
  if (!version) throw new Error('Cannot determine the native Firefox version');

  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/dedicated.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(dedicatedSrc); }
    else if (req.url.startsWith('/shared.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(sharedSrc); }
    else if (req.url.startsWith('/service.js')) { res.setHeader('Content-Type', 'application/javascript'); res.end(serviceSrc); }
    else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><body></body>'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ff-worker-'));
  const profile = sanitizeProfile({ id: 'ff-worker-gate', name: 'ff-worker-gate', engine: 'firefox', os: 'Windows', width: 1440, height: 900,
    privacy: { cores: 4, memory: 0, webrtc: 'disabled', fontListMode: 'real', timezoneMode: 'custom', timezone: 'America/New_York' }, advanced: { showInfoPage: false } });
  const fp = buildFirefoxFingerprint(profile, version);
  await fs.writeFile(path.join(root, 'user.js'), buildFirefoxUserJs({
    userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
    proxyEndpoint: 'http://127.0.0.1:9', noProxyHosts: '127.0.0.1, localhost',
    extraPrefs: [...firefoxExtraUserPrefs(profile, fp), ['network.dns.disablePrefetch', true], ['network.prefetch-next', false], ['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
  }), { mode: 0o600 });
  const child = spawn(binary, firefoxStartupArgs({ root, startUrl: 'about:blank', headless: true, remoteDebugging: true }), {
    stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: fp.timezone },
  });
  try {
    const wsUrl = await waitForFirefoxEndpoint(child, 30000);
    const conn = new BidiConnection(wsUrl, {});
    await conn.open();
    await conn.command('session.new', { capabilities: { alwaysMatch: {} } });
    const ctx = await conn.command('browsingContext.create', { url: 'about:blank', type: 'tab' });
    await evaluateBidi(conn, { context: ctx.context }, `location.href = 'http://127.0.0.1:' + ${server.address().port} + '/'; true`);
    await delay(1500);
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
      assert.equal(w.ua, fp.userAgent, kind + ' worker UA (via prefs)');
      assert.equal(w.platform, fp.platform, kind + ' worker platform (via prefs)');
      assert.equal(w.languages, fp.languages.join(','), kind + ' worker languages');
      assert.equal(w.tz, fp.timezone, kind + ' worker timezone');
      console.log('PASS ff-worker ' + kind + ' first read: UA/platform/languages/timezone are persona');
      // JS-patch-only field: record the documented gap. The assertion is on the
      // DELIVERED capability set, never relaxed to pretend coverage.
      if (w.cores !== fp.hardwareConcurrency) {
        console.log('NOTE ff-worker ' + kind + ' hardwareConcurrency is host value (' + w.cores + '), persona is ' + fp.hardwareConcurrency
          + ' — expected for the DIRECT (non-proxied) phase; the proxy phase below delivers it');
      } else {
        console.log('PASS ff-worker ' + kind + ' hardwareConcurrency matches persona');
      }
    }
    console.log('firefox-worker-delivery-selftest: prefs phase OK');

    // ---- PHASE 2: proxy-delivered JS-only fields over HTTPS ----
    conn.close();
    child.kill('SIGKILL');
    await delay(800);

    const httpsTmp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ff-mitm-leaf-'));
    const keyPath = path.join(httpsTmp, 'k.pem');
    const certPath = path.join(httpsTmp, 'c.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-keyout', keyPath, '-out', certPath,
      '-days', '2', '-nodes', '-subj', '/CN=127.0.0.1',
      '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost'], { stdio: ['ignore', 'ignore', 'ignore'], timeout: 15000 });
    const httpsWorkerBody = `const first=${SNAP};postMessage(JSON.stringify(first));`;
    const httpsServer = https.createServer({
      key: await fs.readFile(keyPath),
      cert: await fs.readFile(certPath),
    }, (req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(httpsWorkerBody);
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

    await fs.writeFile(path.join(mitmRoot, 'user.js'), buildFirefoxUserJs({
      userAgent: fp.userAgent, acceptLanguages: fp.languages.join(','), locale: fp.languages[0],
      proxyEndpoint: proxy.url,
      noProxyHosts: '',
      extraPrefs: [...firefoxExtraUserPrefs(profile, fp),
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
      await conn2.command('session.new', { capabilities: { alwaysMatch: {} } });
      const ctx2 = await conn2.command('browsingContext.create', { url: 'about:blank', type: 'tab' });
      await evaluateBidi(conn2, { context: ctx2.context }, `location.href = 'https://localhost:' + ${httpsPort} + '/'; true`);
      await delay(2500);
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
      assert.equal(mitmProbe.platform, fp.platform, 'MITM worker platform');
      assert.equal(mitmProbe.tz, fp.timezone, 'MITM worker timezone');
      assert.equal(mitmProbe.cores, fp.hardwareConcurrency,
        'MITM worker hardwareConcurrency must be the persona value (this is the JS-only field the proxy delivers)');
      console.log('PASS ff-worker dedicated first read over HTTPS via MITM proxy: JS-only fields (hardwareConcurrency) are persona');
      conn2.close();
      child2.kill('SIGKILL');
      await delay(800);

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
        extraPrefs: [...firefoxExtraUserPrefs(profile, fp),
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
        const ctx3 = await conn3.command('browsingContext.create', { url: 'about:blank', type: 'tab' });
        await evaluateBidi(conn3, { context: ctx3.context }, `location.href = 'https://localhost:' + ${httpsPort} + '/'; true`);
        await delay(2500);
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
        console.log('PASS ff-worker first read over HTTPS via chained authenticated bridge: JS-only fields are persona behind a real proxy too');
        conn3.close();
      } finally {
        child3.kill('SIGKILL');
        await chained.close();
        authBridge.close();
        await fs.rm(chainRoot, { recursive: true, force: true }).catch(() => {});
      }
      console.log('firefox-worker-delivery-selftest: OK (prefs fields + proxy-delivered JS-only fields [direct + chained-auth] verified on Firefox ' + version + ')');
    } finally {
      child2.kill('SIGKILL');
      await proxy.close();
      httpsServer.close();
      await fs.rm(mitmRoot, { recursive: true, force: true }).catch(() => {});
      await fs.rm(httpsTmp, { recursive: true, force: true }).catch(() => {});
    }
  } finally {
    child.kill('SIGKILL');
    server.closeAllConnections?.();
    server.close();
    await fs.rm(root, { recursive: true, force: true }).catch(() => {});
  }
})().catch((error) => {
  console.error('FAIL ' + (error && error.message || error));
  process.exitCode = 1;
});
