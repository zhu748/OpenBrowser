'use strict';

/**
 * Firefox worker-script MITM proxy (product-level JS-only field delivery).
 *
 * Firefox BiDi offers no channel into worker realms (verified on 160:
 * script.addPreloadScript does not run there; realmCreated worker realms are not
 * evaluable; network interception commands fail on worker script loads). The
 * fields a user.js pref cannot reach — hardwareConcurrency, deviceMemory and
 * anything else patched only by the worker injection source — therefore have to
 * be delivered below the browser: at the proxy that the profile already routes
 * through.
 *
 * This proxy is a per-profile loopback forwarder. Plain HTTP and every
 * non-worker request is transparently tunneled (for HTTP, byte-for-byte piped
 * after the initial header parse; for HTTPS, a blind TCP tunnel exactly like the
 * existing forwarders). For requests the browser itself labels as worker
 * scripts (Sec-Fetch-Dest: worker / serviceworker / sharedworker), the tunnel is
 * terminated with a self-signed leaf, the upstream body is read, the persona
 * worker injection source is prepended, and the response is re-served with the
 * original status, headers and encoding handled. The worker's first instruction
 * then observes the patched globals — the same first-read contract the Chromium
 * Fetch-stage prefixer (automation/worker-script-prefixer.js) provides.
 *
 * Trust: the leaf is issued from a generated per-profile CA. The gate seeds a
 * cert_override.txt entry (full handshake verification stays on); the product
 * path imports the CA into the profile's NSS store at build/first-launch time.
 */

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const net = require('net');
const tls = require('tls');

const WORKER_DESTS = new Set(['worker', 'serviceworker', 'sharedworker']);
// Chunked bodies are decoded before prefixing and re-served identity-encoded;
// content-length is rewritten either way.
const CHUNKED = /(?:^|,)\s*chunked\s*(?:,|$)/i;

function parseHeaders(text) {
  const lines = text.split('\r\n');
  const start = lines.shift();
  const headers = [];
  for (const line of lines) {
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    headers.push([line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim()]);
  }
  return { start, headers };
}

function headerLine(headerName) {
  return `${headerName}: ${this.get(headerName)}`;
}

function findHeader(headers, name) {
  const lower = String(name).toLowerCase();
  return headers.find(([key]) => key === lower);
}

function removeHeaders(headers, names) {
  const set = new Set(names.map((n) => n.toLowerCase()));
  for (let i = headers.length - 1; i >= 0; i -= 1) if (set.has(headers[i][0])) headers.splice(i, 1);
}

function parseAbsoluteUrl(raw) {
  try { return new URL(raw); } catch (_) { return null; }
}

function decodeChunkedBody(buffer) {
  const out = [];
  let offset = 0;
  for (;;) {
    const lineEnd = buffer.indexOf('\r\n', offset);
    if (lineEnd < 0) throw new Error('Malformed chunked body');
    const size = parseInt(buffer.subarray(offset, lineEnd).toString('latin1').split(';')[0], 16);
    if (!Number.isFinite(size)) throw new Error('Malformed chunk size');
    if (size === 0) break;
    out.push(buffer.subarray(lineEnd + 2, lineEnd + 2 + size));
    offset = lineEnd + 2 + size + 2; // data + CRLF
  }
  return Buffer.concat(out);
}

function workerDestFor(headers) {
  const found = findHeader(headers, 'sec-fetch-dest');
  if (!found) return '';
  const value = found[1].toLowerCase().trim();
  return WORKER_DESTS.has(value) ? value : '';
}

function isFirefoxWorkerScript(headers) {
  return Boolean(workerDestFor(headers));
}

function certificateFingerprint(der) {
  return crypto.createHash('sha256').update(der).digest('base64');
}

class FirefoxWorkerMitmProxy {
  constructor(options = {}) {
    this.workerSource = String(options.workerSource || '');
    this.upstreamProxy = options.upstreamProxy || null; // { host, port } passthrough target
    this.leaf = options.leaf || FirefoxWorkerMitmProxy.generateLeaf();
    this.trustedUpstreamCert = options.trustedUpstreamCert || null;
    this.leafCache = new Map();
    // Hosts whose CONNECT is terminated (TLS-MITM); everything else tunnels.
    this.terminatingHosts = new Set((options.terminatingHosts || []).map((h) => String(h).toLowerCase()));
    this.server = null;
    this.sockets = new Set();
    this.port = 0;
    this.logger = typeof options.logger === 'function' ? options.logger : null;
  }

  /**
   * One self-signed leaf per proxy instance, generated through the openssl CLI
   * (Node exposes no X.509 signing API). Override-based trust pins the leaf
   * fingerprint, so a single cert serves every intercepted host; the SAN list
   * covers loopback plus a wildcard for the profile's declared test hosts.
   */
  static generateLeaf() {
    const os = require('node:os');
    const path = require('node:path');
    const { execFileSync } = require('node:child_process');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-ff-mitm-'));
    const keyPath = path.join(dir, 'leaf.key');
    const certPath = path.join(dir, 'leaf.crt');
    execFileSync('openssl', [
      'req', '-x509', '-newkey', 'rsa:2048', '-keyout', keyPath, '-out', certPath,
      '-days', '30', '-nodes', '-subj', '/CN=OpenBrowser-Worker-MITM',
      '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1,DNS:*.local',
    ], { stdio: ['ignore', 'ignore', 'ignore'], timeout: 15000 });
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath), dir };
  }

  leafFor() { return this.leaf; }

  /** SHA-256 fingerprint (base64) and DER of the leaf, for cert_override.txt. */
  fingerprintsFor() {
    const x509 = new crypto.X509Certificate(this.leaf.cert);
    return { sha256Base64: certificateFingerprint(x509.raw), leafDer: x509.raw };
  }

  setWorkerSource(source) { this.workerSource = String(source || ''); }

  async start() {
    this.server = net.createServer((client) => this.onClient(client));
    await new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(0, '127.0.0.1', () => resolve());
    });
    this.port = this.server.address().port;
    return this;
  }

  async close() {
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    await new Promise((resolve) => this.server ? this.server.close(() => resolve()) : resolve());
    if (this.leaf?.dir) fs.rm(this.leaf.dir, { recursive: true, force: true }, () => {});
  }

  log(...args) { if (this.logger) this.logger(...args); }

  onClient(client) {
    this.sockets.add(client);
    client.setNoDelay(true);
    client.once('close', () => this.sockets.delete(client));
    client.on('error', () => {});
    let pending = Buffer.alloc(0);
    const onHeader = (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      if (pending.length > 65536) { client.destroy(); return; }
      const marker = pending.indexOf('\r\n\r\n');
      if (marker < 0) return;
      client.removeListener('data', onHeader);
      client.pause();
      const header = pending.subarray(0, marker + 4).toString('latin1');
      const remainder = pending.subarray(marker + 4);
      const firstLine = header.split('\r\n', 1)[0];
      if (/^CONNECT\s+/i.test(firstLine)) this.onConnect(client, firstLine, remainder);
      else this.onPlainRequest(client, header, remainder);
    };
    client.on('data', onHeader);
  }

  /** Blind tunnel for everything except worker-labeled HTTPS requests. */
  onConnect(client, firstLine, remainder) {
    // The request line is 'CONNECT host:port HTTP/1.1' — drop the protocol suffix
    // before parsing, or the port slice becomes '443 HTTP/1.1' (NaN).
    const target = firstLine.replace(/^CONNECT\s+/i, '').replace(/\s+HTTP\/\d(?:\.\d)?$/i, '').trim();
    const separator = target.lastIndexOf(':');
    const host = separator > 0 ? target.slice(0, separator) : target;
    const port = separator > 0 ? Number(target.slice(separator + 1)) : 443;
    const done = (socket) => {
      this.sockets.add(socket);
      socket.once('close', () => this.sockets.delete(socket));
      client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: OpenBrowser-Worker-MITM\r\n\r\n');
      if (remainder.length) socket.write(remainder);
      socket.pipe(client); client.pipe(socket);
      socket.on('error', () => client.destroy());
    };
    // We cannot see Sec-Fetch-Dest before the TLS handshake: worker detection
    // happens INSIDE the terminated session. Strategy: terminate only when the
    // SNI matches a host we have an override for (the gate); otherwise tunnel.
    // For the product this is inverted: terminate all, tunnel failures fall back.
    if (this.terminatingHosts && this.terminatingHosts.size && !this.terminatingHosts.has(host.toLowerCase())) {
      this.tunnel(client, host, port, remainder);
      return;
    }
    this.terminateTls(client, host, port, remainder).catch((error) => {
      this.log('mitm-terminate-failed', host, error.message);
      this.tunnel(client, host, port, remainder);
    });
  }

  tunnel(client, host, port, remainder) {
    if (!Number.isFinite(port) || port <= 0 || port > 65535) {
      if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: invalid CONNECT target\r\nConnection: close\r\n\r\n');
      return;
    }
    const socket = net.connect({ host, port }, () => {
      client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: OpenBrowser-Worker-MITM\r\n\r\n');
      // The CONNECT header stage paused the client; blind piping needs it live.
      if (client.isPaused && client.isPaused()) client.resume();
      if (remainder.length) socket.write(remainder);
      socket.pipe(client); client.pipe(socket);
    });
    this.sockets.add(socket);
    socket.once('close', () => this.sockets.delete(socket));
    socket.on('error', () => client.destroy());
    client.on('error', () => socket.destroy());
  }

  async terminateTls(client, host, port, remainder) {
    const leaf = this.leafFor(host);
    // Wrapping with TLSSocket pauses the underlying stream until handshake
    // completes; the CONNECT reply must go out on the RAW socket first, and the
    // remainder (early TLS bytes) must be re-fed after the wrap.
    const secureContext = tls.createSecureContext({ key: leaf.key, cert: leaf.cert });
    const tlsServer = new tls.TLSSocket(client, { isServer: true, secureContext });
    client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: OpenBrowser-Worker-MITM\r\n\r\n');
    if (client.isPaused && client.isPaused()) client.resume();
    if (remainder.length) tlsServer.write(remainder);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('TLS handshake timeout')), 8000);
      const onSecure = () => { clearTimeout(timer); resolve(); };
      const onError = (error) => { clearTimeout(timer); reject(error); };
      tlsServer.once('secure', onSecure);
      tlsServer.once('error', onError);
    });
    this.sockets.add(tlsServer);
    tlsServer.once('close', () => this.sockets.delete(tlsServer));
    this.serveHttpsSession(tlsServer, host, port, remainder);
  }

  /** HTTP/1.1 session over the terminated TLS socket. */
  serveHttpsSession(socket, host, port, initialRemainder) {
    let pending = initialRemainder;
    const handle = () => {
      for (;;) {
        const marker = pending.indexOf('\r\n\r\n');
        if (marker < 0) return;
        const headerText = pending.subarray(0, marker + 4).toString('latin1');
        let body = pending.subarray(marker + 4);
        pending = Buffer.alloc(0);
        const { start, headers } = parseHeaders(headerText);
        const contentLength = Number(findHeader(headers, 'content-length')?.[1] || 0);
        // Wait for the full request body before deciding.
        if (body.length < contentLength) { pending = Buffer.concat([body, pending]).length ? Buffer.concat([pending.subarray(0, 0), body]) : body; return this.waitForMore(socket, headerText, body, contentLength); }
        this.dispatchRequest(socket, host, port, start, headers, body);
      }
    };
    socket.on('data', (chunk) => { pending = Buffer.concat([pending, chunk]); handle(); });
    socket.on('error', () => socket.destroy());
  }

  // Simplified: requests are handled one at a time with Connection: close forced.
  waitForMore(socket, headerText, body, contentLength) {
    // The caller already concatenated; body length will be re-checked on next data.
    return undefined;
  }

  dispatchRequest(socket, host, port, start, headers, body) {
    const url = parseAbsoluteUrl(start.split(/\s+/)[1] || '');
    const isWorker = isFirefoxWorkerScript(headers);
    // Force close per request (Firefox re-opens; correctness over throughput here).
    removeHeaders(headers, ['connection', 'proxy-connection', 'keep-alive']);
    headers.push(['connection', 'close']);
    const request = { host, port, start, headers, body, isWorker };
    this.fetchUpstreamHttps(socket, request);
  }

  fetchUpstreamHttps(socket, request) {
    if (!Number.isFinite(request.port) || request.port <= 0) {
      socket.destroy();
      this.log('mitm-bad-upstream-port', request.host, String(request.port));
      return;
    }
    const isIpLiteral = /^\d+\.\d+\.\d+\.\d+$|^\[[0-9a-f:]+\]$/i.test(request.host);
    const upstream = tls.connect({
      host: request.host,
      port: request.port,
      // RFC 6066 forbids an IP SNI; Node warns and it can stall some stacks.
      ...(isIpLiteral ? {} : { servername: request.host }),
      // Strict by default; the forwarder's owner can pin the origin's CA/leaf
      // for test origins via trustedUpstreamCert without disabling verification.
      ...(this.trustedUpstreamCert ? { ca: this.trustedUpstreamCert } : {}),
      rejectUnauthorized: true,
    }, () => {
      const head = request.start + '\r\n' + request.headers.map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
      this.log('mitm-upstream-connected', request.host + ':' + request.port, 'head-bytes=' + head.length);
      upstream.write(head, 'latin1');
      if (request.body.length) upstream.write(request.body);
      this.readUpstreamResponse(upstream, socket, request);
    });
    this.sockets.add(upstream);
    upstream.once('close', () => this.sockets.delete(upstream));
    upstream.on('error', (error) => {
      this.log('mitm-upstream-failed', request.host, error.message);
      if (!socket.destroyed) socket.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: upstream tls failed\r\nConnection: close\r\n\r\n');
      socket.destroy();
    });
    socket.on('error', () => upstream.destroy());
  }

  readUpstreamResponse(upstream, client, request) {
    let buffer = Buffer.alloc(0);
    const onUpstreamData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const marker = buffer.indexOf('\r\n\r\n');
      if (marker < 0) {
        if (buffer.length > 65536) { upstream.destroy(); client.destroy(); }
        return;
      }
      upstream.removeListener('data', onUpstreamData);
      const headerText = buffer.subarray(0, marker + 4).toString('latin1');
      const headRemainder = buffer.subarray(marker + 4);
      const { start: statusLine, headers } = parseHeaders(headerText);
      const contentLengthHeader = findHeader(headers, 'content-length');
      const contentLength = contentLengthHeader ? Number(contentLengthHeader[1]) : null;
      const chunked = CHUNKED.test(findHeader(headers, 'transfer-encoding')?.[1] || '');
      const collect = (data) => {
        buffer = Buffer.concat([buffer, data]);
        const done = chunked
          ? /0\r\n\r\n$/.test(buffer.subarray(buffer.length - 64).toString('latin1')) || buffer.includes('\r\n0\r\n\r\n')
          : contentLength !== null && buffer.length >= contentLength;
        if (!done) return;
        upstream.removeListener('data', collect);
        let body = buffer;
        try { if (chunked) body = decodeChunkedBody(body); } catch (_) { /* pass raw */ }
        this.respond(client, request, statusLine, headers, body);
        upstream.end(); client.end();
      };
      buffer = headRemainder;
      if (buffer.length) collect(Buffer.alloc(0));
      upstream.on('data', collect);
    };
    upstream.on('data', onUpstreamData);
  }

  respond(client, request, statusLine, headers, upstreamBody) {
    let body = upstreamBody;
    let extraNote = '';
    const contentType = findHeader(headers, 'content-type')?.[1] || '';
    const looksBinary = !/javascript|ecmascript|text\/plain/i.test(contentType);
    if (request.isWorker && this.workerSource && !looksBinary) {
      body = Buffer.concat([Buffer.from(this.workerSource, 'utf8'), Buffer.from('\n;', 'utf8'), upstreamBody]);
      extraNote = 'prefixed';
    }
    // Rewrite framing headers for the (possibly changed) body.
    removeHeaders(headers, ['content-length', 'transfer-encoding', 'content-encoding', 'connection']);
    headers.push(['connection', 'close']);
    headers.push(['content-length', String(body.length)]);
    const head = statusLine + '\r\n' + headers.map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
    client.write(head, 'latin1');
    client.write(body);
    this.log('mitm-respond', request.host, statusLine.split(' ')[1], extraNote || 'pass-through');
  }

  /** Plain-HTTP session: parse each request; worker scripts get the prefix. */
  onPlainRequest(client, headerText, remainder) {
    const { start, headers } = parseHeaders(headerText);
    const url = parseAbsoluteUrl(start.split(/\s+/)[1] || '');
    if (!url) { client.destroy(); return; }
    const contentLength = Number(findHeader(headers, 'content-length')?.[1] || 0);
    const isWorker = isFirefoxWorkerScript(headers);
    removeHeaders(headers, ['connection', 'proxy-connection', 'keep-alive']);
    headers.push(['connection', 'close']);
    const upstream = net.connect({ host: url.hostname, port: Number(url.port) || 80 }, () => {
      const path = url.pathname + url.search;
      const rewrittenStart = start.replace(/^(\S+)\s+\S+\s+(\S+)$/, `$1 ${path} $2`);
      const head = rewrittenStart + '\r\n' + headers.map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
      upstream.write(head, 'latin1');
      if (remainder.length) upstream.write(remainder);
    });
    this.sockets.add(upstream);
    upstream.once('close', () => this.sockets.delete(upstream));
    upstream.on('error', () => client.destroy());
    client.on('error', () => upstream.destroy());
    let buffer = Buffer.alloc(0);
    const onData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const marker = buffer.indexOf('\r\n\r\n');
      if (marker < 0) { if (buffer.length > 65536) upstream.destroy(); return; }
      upstream.removeListener('data', onData);
      const headerText2 = buffer.subarray(0, marker + 4).toString('latin1');
      const bodySoFar = buffer.subarray(marker + 4);
      const { start: statusLine, headers: responseHeaders } = parseHeaders(headerText2);
      const contentLengthHeader = findHeader(responseHeaders, 'content-length');
      const contentLength = contentLengthHeader ? Number(contentLengthHeader[1]) : null;
      const chunked = CHUNKED.test(findHeader(responseHeaders, 'transfer-encoding')?.[1] || '');
      const collect = (data) => {
        buffer = Buffer.concat([buffer, data]);
        const done = chunked
          ? /0\r\n\r\n$/.test(buffer.subarray(buffer.length - 64).toString('latin1'))
          : contentLength !== null ? buffer.length >= contentLength : true;
        if (!done) return;
        upstream.removeListener('data', collect);
        let body = buffer;
        try { if (chunked) body = decodeChunkedBody(body); } catch (_) {}
        this.respond(client, { isWorker, host: url.hostname }, statusLine, responseHeaders, body);
        upstream.end(); client.end();
      };
      buffer = bodySoFar;
      if (buffer.length) collect(Buffer.alloc(0));
      upstream.on('data', collect);
    };
    upstream.on('data', onData);
  }
}

/**
 * cert_override.txt line for a host:port against the MITM leaf (Firefox's
 * five-field format: host:port, OID, colon-hex uppercase fingerprint, override
 * bits, dbKey). The dbKey is the NSS key for the certificate itself; for a
 * self-signed leaf Firefox accepts the DER wrapped in the standard length
 * prefix (verified live on 160).
 */
function certOverrideLine({ host, port, sha256Base64, leafDer }) {
  const hex = Buffer.from(sha256Base64, 'base64').toString('hex').toUpperCase().replace(/(..)/g, '$1:').replace(/:$/, '');
  const der = leafDer;
  const dbKey = Buffer.concat([Buffer.from([0, 0, 0, der.length]), der]).toString('base64');
  return `${host}:${port} OID.2.16.840.1.101.3.4.2.1 ${hex} M ${dbKey}`;
}

module.exports = { FirefoxWorkerMitmProxy, certOverrideLine, isFirefoxWorkerScript, WORKER_DESTS };
