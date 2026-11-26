'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const http2 = require('node:http2');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const tls = require('node:tls');
const cdp = require('../../cdp');
const { BrowserEngine } = require('../../engine');
const { ProfileRoutes } = require('../api/profile-routes');
const { CURRENT_FINGERPRINT_VERSION } = require('../fingerprint/generation');
const { evaluateBidi } = require('../../network/bidi-connection');
const { chooseChromiumBinary, Unavailable } = require('./native-gate-harness');

const H2_PREFACE = Buffer.from('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n');
const WIRE_LIMIT = 128 * 1024;
const GREASE = value => (value & 0x0f0f) === 0x0a0a && (value >> 8) === (value & 0xff);
const uint16List = data => Array.from({ length: data.length / 2 }, (_, index) => data.readUInt16BE(index * 2));
const appendInitialBytes = (previous, chunk) => Buffer.concat([previous, chunk.subarray(0, WIRE_LIMIT - previous.length)]);
const digest = (value, algorithm = 'md5') => createHash(algorithm).update(value).digest('hex');

function readClientHello(records) {
  const payloads = [];
  for (let offset = 0; offset + 5 <= records.length;) {
    const end = offset + 5 + records.readUInt16BE(offset + 3);
    if (records[offset] !== 22 || end > records.length) break;
    payloads.push(records.subarray(offset + 5, end));
    offset = end;
  }
  const hello = Buffer.concat(payloads);
  assert.ok(hello.length >= 4 && hello[0] === 1, 'expected a TLS ClientHello');
  const end = 4 + hello.readUIntBE(1, 3);
  assert.ok(end <= hello.length, 'expected a complete ClientHello');
  const version = hello.readUInt16BE(4);
  let cursor = 38;
  const takeVector = size => {
    const length = hello.readUIntBE(cursor, size);
    cursor += size;
    const next = cursor + length;
    assert.ok(next <= end, 'ClientHello vector exceeded the handshake length');
    const data = hello.subarray(cursor, next);
    cursor = next;
    return data;
  };
  takeVector(1); // session ID
  const ciphers = uint16List(takeVector(2)).filter(value => !GREASE(value));
  takeVector(1); // compression methods
  const extensionBytes = takeVector(2);
  const extensions = new Map();
  for (let offset = 0; offset < extensionBytes.length;) {
    const type = extensionBytes.readUInt16BE(offset);
    const next = offset + 4 + extensionBytes.readUInt16BE(offset + 2);
    assert.ok(next <= extensionBytes.length, 'truncated ClientHello extension');
    if (!GREASE(type)) extensions.set(type, extensionBytes.subarray(offset + 4, next));
    offset = next;
  }
  const groups = uint16List(extensions.get(10)?.subarray(2) || Buffer.alloc(0)).filter(value => !GREASE(value));
  const points = [...(extensions.get(11)?.subarray(1) || [])];
  const ja3 = [version, ciphers, [...extensions.keys()], groups, points]
    .map(value => Array.isArray(value) ? value.join('-') : value).join(',');
  const offeredAlpn = [];
  const alpn = extensions.get(16) || Buffer.alloc(0);
  for (let offset = 2; offset < alpn.length;) {
    const length = alpn[offset++];
    assert.ok(length > 0 && offset + length <= alpn.length, 'invalid ALPN protocol name');
    offeredAlpn.push(alpn.toString('ascii', offset, offset + length));
    offset += length;
  }
  const versions = uint16List(extensions.get(43)?.subarray(1) || Buffer.alloc(0)).filter(value => !GREASE(value));
  const signatureAlgorithms = uint16List(extensions.get(13)?.subarray(2) || Buffer.alloc(0)).filter(value => !GREASE(value));
  const tlsVersion = new Map([[0x0304, '13'], [0x0303, '12'], [0x0302, '11'], [0x0301, '10']]);
  const highest = tlsVersion.get(versions.length ? Math.max(...versions) : version) || '00';
  const hexList = values => values.map(value => value.toString(16).padStart(4, '0')).join(',');
  const count = size => String(Math.min(size, 99)).padStart(2, '0');
  const hash = list => list ? digest(list, 'sha256').slice(0, 12) : '000000000000';
  const protocol = offeredAlpn[0];
  assert.ok(protocol === 'h2' || protocol === 'http/1.1', 'expected an HTTP ALPN in the first position');
  const ja4Prefix = 't' + highest + (extensions.has(0) ? 'd' : 'i')
    + count(ciphers.length) + count(extensions.size) + protocol[0] + protocol.at(-1);
  const extensionHex = hexList([...extensions.keys()].filter(type => type !== 0 && type !== 16).sort((a, b) => a - b));
  const signatureHex = hexList(signatureAlgorithms);
  const ja4 = [
    ja4Prefix, hash(hexList([...ciphers].sort((a, b) => a - b))),
    hash(signatureHex ? extensionHex + '_' + signatureHex : extensionHex),
  ].join('_');
  return { ja3, ja3Hash: digest(ja3), ja4, offeredAlpn };
}

function readHttp2(bytes, rawHeaders) {
  assert.deepEqual(bytes.subarray(0, H2_PREFACE.length), H2_PREFACE, 'HTTP/2 client preface');
  let settings, windowUpdate;
  const priority = [];
  for (let cursor = H2_PREFACE.length; cursor + 9 <= bytes.length;) {
    const length = bytes.readUIntBE(cursor, 3);
    const type = bytes[cursor + 3];
    const flags = bytes[cursor + 4];
    const stream = bytes.readUInt32BE(cursor + 5) & 0x7fffffff;
    const payload = bytes.subarray(cursor + 9, cursor + 9 + length);
    if (payload.length !== length || type === 1) break; // First request HEADERS
    if (type === 4 && stream === 0 && !(flags & 1) && !settings) {
      assert.equal(length % 6, 0, 'SETTINGS payload length');
      settings = Array.from({ length: length / 6 }, (_, index) => {
        const offset = index * 6;
        return [payload.readUInt16BE(offset), payload.readUInt32BE(offset + 2)];
      });
    }
    if (type === 8 && stream === 0 && windowUpdate === undefined) windowUpdate = payload.readUInt32BE(0) & 0x7fffffff;
    if (type === 2 && length === 5) {
      const dependency = payload.readUInt32BE(0);
      priority.push([stream, Number(Boolean(dependency >>> 31)), dependency & 0x7fffffff, payload[4] + 1].join(':'));
    }
    cursor += 9 + length;
  }
  assert.ok(settings?.length, 'wire SETTINGS must contain client parameters');
  const pseudo = rawHeaders.filter((value, index) => index % 2 === 0 && value.startsWith(':'));
  assert.deepEqual([...pseudo].sort(), [':authority', ':method', ':path', ':scheme']);
  const akamai = [
    settings.map(pair => pair.join(':')).join(';'), windowUpdate ?? 0,
    priority.join(',') || 0, pseudo.map(name => name[1]).join(','),
  ].join('|');
  return { settings, windowUpdate: windowUpdate ?? 0, priority, pseudo, akamai, akamaiHash: digest(akamai) };
}

async function startWireOrigin(root) {
  const files = { key: path.join(root, 'key.pem'), cert: path.join(root, 'cert.pem') };
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
      '-addext', 'subjectAltName=DNS:localhost,DNS:wire.test,IP:127.0.0.1',
      '-keyout', files.key, '-out', files.cert], { stdio: 'ignore', timeout: 15000 });
  } catch (error) {
    if (error.code === 'ENOENT') throw new Unavailable('The local transport test requires OpenSSL.');
    throw error;
  }
  const sockets = new Set();
  const clientHelloByPort = new Map();
  const decryptedByPort = new Map();
  const track = socket => {
    sockets.add(socket);
    socket.on('error', () => {});
    socket.once('close', () => sockets.delete(socket));
    return socket;
  };
  // Match each raw tunnel to its TLS session and the cleartext HTTP/2 parser
  // using the source port of the next loopback hop.
  function tap(source, port, byPort, details = {}) {
    const next = track(net.createConnection(port, '127.0.0.1'));
    const capture = { ...details, bytes: Buffer.alloc(0) };
    next.once('connect', () => {
      const key = next.localPort;
      byPort.set(key, capture);
      next.once('close', () => byPort.delete(key));
    });
    source.on('data', chunk => { capture.bytes = appendInitialBytes(capture.bytes, chunk); });
    source.once('close', () => next.destroy());
    next.once('close', () => source.destroy());
    source.pipe(next).pipe(source);
  }

  const app = http2.createServer();
  const secure = tls.createServer({
    key: await fs.readFile(files.key), cert: await fs.readFile(files.cert), ALPNProtocols: ['h2'],
  }, socket => {
    track(socket);
    tap(socket, app.address().port, decryptedByPort, {
      tls: socket.getProtocol(), alpn: socket.alpnProtocol, clientHello: clientHelloByPort.get(socket.remotePort),
    });
  });
  const raw = net.createServer(socket => tap(track(socket), secure.address().port, clientHelloByPort));
  let observed, failure;
  const finishedDocuments = new Set();
  app.on('stream', (stream, headers, _flags, rawHeaders) => {
    if (headers[':path'] === '/worker.js') {
      stream.respond({ ':status': 200, 'content-type': 'application/javascript' });
      stream.end('postMessage({cores:navigator.hardwareConcurrency, ua:navigator.userAgent});');
      return;
    }
    if (headers[':path'] === '/wire' && !observed && !failure) {
      try {
        const transport = decryptedByPort.get(stream.session.socket.remotePort);
        assert.equal(transport?.alpn, 'h2');
        assert.match(transport.tls, /^TLSv1\.[23]$/);
        observed = {
          userAgent: headers['user-agent'], doNotTrack: headers.dnt ?? null, tls: transport.tls, alpn: transport.alpn,
          ...readClientHello(transport.clientHello.bytes), ...readHttp2(transport.bytes, rawHeaders),
        };
      } catch (error) { failure = error; }
    }
    stream.respond({ ':status': 200, 'content-type': 'text/html' });
    stream.write(`<!doctype html><title>Wire probe</title><script>
      window.transportWorkerResult = new Promise(resolve => {
        const worker = new Worker('/worker.js');
        worker.onmessage = event => { worker.terminate(); resolve(event.data); };
        worker.onerror = () => { worker.terminate(); resolve({error:'worker failed'}); };
        setTimeout(() => { worker.terminate(); resolve({error:'worker timed out'}); }, 5000);
      });
    </script>`);
    const documentPath = headers[':path'];
    if (documentPath !== '/wire' && documentPath !== '/secondary') { stream.end(); return; }
    // Keeping the response open delays DOMContentLoaded beyond the former
    // fixed startup delay, even though the inline worker already started.
    const timer = setTimeout(() => {
      finishedDocuments.add(documentPath);
      stream.end('<main>Wire probe ready</main>');
    }, 750);
    stream.once('close', () => clearTimeout(timer));
  });
  const servers = [app, secure, raw];
  const close = async () => {
    for (const socket of sockets) socket.destroy();
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
  };
  try {
    for (const server of servers) {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
      });
    }
    return { port: raw.address().port, close, finishedDocuments, observation: () => {
      if (failure) throw failure;
      assert.ok(observed, 'the browser did not reach the local HTTP/2 origin');
      return observed;
    } };
  } catch (error) { await close(); throw error; }
}

async function startConnectProxy(port) {
  const authority = 'wire.test:' + port;
  const sockets = new Set();
  const server = http.createServer((_request, response) => response.writeHead(502).end());
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  let tunnels = 0;
  server.on('connect', (request, socket, head) => {
    if (request.url !== authority || request.headers['proxy-authorization'] !== 'Basic ' + Buffer.from('fixture:fixture').toString('base64')) {
      socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n');
      return;
    }
    const target = net.createConnection(port, '127.0.0.1', () => {
      tunnels++;
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) target.write(head);
      target.pipe(socket).pipe(target);
    });
    target.on('error', () => socket.destroy());
    target.once('close', () => socket.destroy());
    socket.on('error', () => target.destroy());
    socket.once('close', () => target.destroy());
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return {
    url: 'http://fixture:fixture@127.0.0.1:' + server.address().port,
    verify() { assert.ok(tunnels > 0, 'browser request must pass the authenticated CONNECT route'); },
    async close() {
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => server.close(resolve));
    },
  };
}

async function readPageValue(item, firefox, target, expression) {
  if (firefox) {
    return evaluateBidi(item.bidiConnection, { context: item.bidiContext }, expression);
  }
  const tab = (await cdp.tabs(item.port)).find(entry => entry.url === target);
  assert.ok(tab?.webSocketDebuggerUrl, 'transport probe did not reach its configured URL');
  const response = await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  assert.ok(!response.exceptionDetails, response.exceptionDetails?.text);
  return response.result?.value;
}

async function readOnlineReport(item, firefox, target) {
  const result = await readPageValue(item, firefox, target, 'document.body?.innerText || ""');
  assert.ok(result, 'missing online transport response');
  let report;
  try { report = JSON.parse(result); }
  catch (_) { throw new Error('The online transport endpoint did not return a JSON fingerprint report'); }
  assert.equal(report.user_agent, item.fingerprint.userAgent, 'online server must receive the managed browser UA');
  assert.match(report.tls?.ja3_hash || '', /^[a-f0-9]{32}$/);
  assert.match(report.tls?.ja4 || '', /^[a-z0-9]+_[a-f0-9]{12}_[a-f0-9]{12}$/);
  assert.ok(report.http_version);
  if (report.http_version === 'h2') assert.ok(report.http2?.akamai_fingerprint);
  return {
    tls: report.tls.tls_version_negotiated, ja3: report.tls.ja3_hash, ja4: report.tls.ja4,
    protocol: report.http_version, akamai: report.http2?.akamai_fingerprint || null,
    upstreamProxyConfigured: Boolean(process.env.OPENBROWSER_TRANSPORT_PROXY),
    externalHttpsTransport: item.capabilities?.externalHttpsTransport || 'native',
  };
}

async function main() {
  const firefox = process.argv.includes('--firefox');
  const engineName = firefox ? 'firefox' : 'chromium';
  const browser = firefox ? (() => {
    const binary = process.env.OPENBROWSER_FIREFOX_BINARY;
    if (!binary) throw new Unavailable('Set OPENBROWSER_FIREFOX_BINARY to an installed Firefox executable.');
    const version = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 10000 }).match(/Firefox\s+(\d+(?:\.\d+)+)/)?.[1];
    assert.ok(version, 'could not determine the Firefox version');
    return { binary, version };
  })() : chooseChromiumBinary();
  const onlineTarget = process.env.OPENBROWSER_TRANSPORT_URL ? new URL(process.env.OPENBROWSER_TRANSPORT_URL) : null;
  if (onlineTarget) {
    assert.ok(onlineTarget.protocol === 'https:' && !onlineTarget.username && !onlineTarget.password && !onlineTarget.hash,
      'use a credential-free HTTPS transport report URL');
  }
  if (onlineTarget) return run({ browser, engineName, onlineTarget });
  const direct = await run({ browser, engineName });
  const tunneled = await run({ browser, engineName, useConnect: true });
  assert.equal(tunneled.ja4, direct.ja4, 'the CONNECT tunnel must pass the native ClientHello');
  assert.equal(tunneled.akamai, direct.akamai, 'the CONNECT tunnel must pass native HTTP/2 frames');
}

async function run({ browser, engineName, onlineTarget, useConnect = false }) {
  const firefox = engineName === 'firefox';
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-transport-wire-'));
  let engine, origin, connect;
  const id = 'wire-observation';
  try {
    if (!onlineTarget) origin = await startWireOrigin(root);
    if (useConnect) connect = await startConnectProxy(origin.port);
    const proxy = connect?.url || (onlineTarget && process.env.OPENBROWSER_TRANSPORT_PROXY);
    const target = onlineTarget?.href || `https://${connect ? 'wire.test' : 'localhost'}:${origin.port}/wire`;
    const userData = path.join(root, 'userData');
    await fs.mkdir(path.join(userData, 'browser-profiles-v2'), { recursive: true });
    engine = new BrowserEngine({ getPath: name => path.join(root, name) }, { preferIndependentKernel: false });
    if (firefox && onlineTarget) {
      const profileRoot = engine.profileRoot(id);
      await fs.mkdir(profileRoot, { mode: 0o700 });
      await fs.writeFile(path.join(profileRoot, 'prefs.js'), 'user_pref("devtools.jsonview.enabled", false);\n', { mode: 0o600 });
      const caFile = process.env.OPENBROWSER_TRANSPORT_CA_FILE;
      if (caFile) {
        const { installFirefoxCa } = require('../firefox-trust-installer');
        const trust = installFirefoxCa(profileRoot, await fs.readFile(caFile));
        if (trust.reason === 'certutil-unavailable') throw new Unavailable('The optional online Firefox CA requires NSS certutil.');
        assert.ok(trust.ok, 'could not import the explicitly supplied CA into the temporary Firefox profile');
      }
    }
    engine.chooseBrowser = () => ({ path: browser.binary, version: browser.version, name: engineName, engine: engineName, independent: true });
    engine.ensureExitNetworkForLocale = async () => null;
    if (proxy) engine.prepareProfileProxyForStart = async profile => profile; // The report itself validates this route.
    const startUrls = origin ? `${target}\n${new URL('/secondary', target)}` : target;
    const created = await new ProfileRoutes({ engine }).routeProfileCreate({ input: {
      id, name: id, engine: engineName, os: 'Windows', fingerprintVersion: CURRENT_FINGERPRINT_VERSION,
      networkMode: proxy ? 'proxy' : 'direct', proxy: proxy || 'Direct',
      privacy: { cores: 24, fontListMode: 'real', webrtc: 'disabled', dntMode: useConnect ? 'off' : 'on',
        noSandbox: process.env.OPENBROWSER_NATIVE_NO_SANDBOX === '1' },
      advanced: { showInfoPage: false, startUrls, ignoreHttpsError: !onlineTarget },
    } });
    assert.equal(created.code, 0, created.msg);
    assert.match(created.data.profile.fingerprintSeed, /^[a-f0-9]{32}$/);
    const configured = await engine.inspectFingerprint(id);
    const status = await engine.start(engine.profiles.get(id), { headless: true });
    assert.equal(status.running, true);
    assert.equal(status.fingerprint.delivery, 'verified-document');
    if (origin) assert.deepEqual(origin.finishedDocuments, new Set(['/wire', '/secondary']), 'startup waits for both document bodies');
    const item = engine.running.get(id);
    assert.equal(item.fingerprint.seed, configured.seed, 'the first launch uses the identity stored during creation');
    const observation = onlineTarget ? await readOnlineReport(item, firefox, target) : origin.observation();
    if (!onlineTarget) {
      assert.equal(observation.userAgent, item.fingerprint.userAgent);
      assert.equal(observation.doNotTrack, item.fingerprint.doNotTrack);
      assert.ok(observation.offeredAlpn.includes('h2'));
      assert.match(observation.ja3Hash, /^[a-f0-9]{32}$/);
      assert.match(observation.ja4, /^t(?:12|13)d\d{4}h2_[a-f0-9]{12}_[a-f0-9]{12}$/);
      connect?.verify();
      const observedWorker = await readPageValue(item, firefox, target, 'window.transportWorkerResult');
      assert.deepEqual(observedWorker, { cores: item.fingerprint.hardwareConcurrency, ua: item.fingerprint.userAgent });
    }
    // TLS randoms, session keys, remote addresses and proxy credentials are omitted.
    console.log(JSON.stringify({
      mode: onlineTarget ? 'online-observer' : useConnect ? 'local-connect-wire' : 'local-wire',
      engine: engineName, version: browser.version, observation,
    }));
    return observation;
  } finally {
    try { if (engine) await engine.stop(id); }
    finally {
      try { await Promise.all([origin?.close(), connect?.close()]); }
      finally { await fs.rm(root, { recursive: true, force: true }); }
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
