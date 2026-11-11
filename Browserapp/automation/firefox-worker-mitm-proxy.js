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
 * This proxy is a per-profile loopback forwarder:
 *   - plain HTTP and CONNECT sessions are parsed (one request at a time,
 *     Connection: close forced);
 *   - requests the browser itself labels as worker scripts (Sec-Fetch-Dest:
 *     worker / serviceworker / sharedworker) get the response body prepended
 *     with the persona worker injection source (chunked bodies re-encoded,
 *     content-length rewritten, binary content types skipped);
 *   - everything else passes through byte-faithful at the HTTP layer, and the
 *     upstream leg can be DIRECT or chained through an authenticated proxy
 *     bridge (upstreamProxy: { host, port }) — CONNECT for TLS origins, absolute
 *     request-URIs for plain ones.
 *
 * TLS termination: each intercepted host gets a leaf signed on the fly by a
 * per-instance CA (openssl CLI; Node exposes no X.509 signing API) with the
 * host in SAN. The CA is imported into the profile's NSS store (certutil) or
 * pinned per-host via cert_override.txt (gate/test environments), so worker
 * script loads on ARBITRARY https origins can be rewritten.
 *
 * Safety: address-policy checks (no cloud metadata, no private loopback
 * upstreams on the direct leg) mirror proxy-forwarder's egress rules.
 */

const crypto = require('crypto');
const fs = require('fs');
const net = require('net');
const tls = require('tls');
const { execFileSync } = require('child_process');
const os = require('os');
const path = require('path');
const { isCloudMetadataHostname, isPrivateOrLocalHostname } = require('../network/address-policy');

const WORKER_DESTS = new Set(['worker', 'serviceworker', 'sharedworker']);
// Chunked bodies are decoded before prefixing and re-served identity-encoded;
// content-length is rewritten either way.
const CHUNKED = /(?:^|,)\s*chunked\s*(?:,|$)/i;
const MAX_HEADER_BYTES = 65536;

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

/** Egress guard shared with proxy-forwarder: refuse metadata/private targets. */
function assertSafeUpstreamHost(host) {
  const text = String(host || '').replace(/^\[|\]$/g, '');
  if (!text) throw new Error('Empty upstream host');
  if (isCloudMetadataHostname(text) || isPrivateOrLocalHostname(text)) {
    throw new Error('Upstream host rejected by address policy: ' + text);
  }
}

function openssl(args, cwd) {
  execFileSync('openssl', args, { stdio: ['ignore', 'ignore', 'ignore'], timeout: 20000, cwd });
}

class FirefoxWorkerMitmProxy {
  constructor(options = {}) {
    this.workerSource = String(options.workerSource || '');
    // Chained upstream: { host, port } of an authenticated proxy bridge. Null = direct.
    this.upstreamProxy = options.upstreamProxy || null;
    this.ca = options.ca || FirefoxWorkerMitmProxy.generateCA();
    this.leafCache = new Map();
    // Product default: terminate every TLS session (worker scripts can live on
    // any origin). Test/gate setups pass an explicit host list to keep the
    // blast radius small.
    this.terminatingHosts = Array.isArray(options.terminatingHosts)
      ? new Set(options.terminatingHosts.map((h) => String(h).toLowerCase()))
      : null; // null = terminate all
    this.trustedUpstreamCert = options.trustedUpstreamCert || null;
    // Extra CA bundle (PEM path or buffer) for upstream verification — used for
    // Firefox background origins signed by public CAs while tests pin their own.
    this.upstreamCaBundle = options.upstreamCaBundle || null;
    // Loopback test origins opt in explicitly; external upstreams stay behind
    // the shared address policy.
    this.allowedUpstreamHosts = new Set((options.allowedUpstreamHosts || []).map((h) => String(h).toLowerCase()));
    this.server = null;
    this.sockets = new Set();
    this.port = 0;
    this.logger = typeof options.logger === 'function' ? options.logger : null;
  }

  /**
   * A per-instance CA (openssl CLI). Leaves are signed from it per host with a
   * matching SAN, so a Firefox that trusts the CA accepts interception on
   * arbitrary origins — the product trust path (NSS import at launch).
   */
  static generateCA() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-ff-mitm-'));
    const keyPath = path.join(dir, 'ca.key');
    const certPath = path.join(dir, 'ca.crt');
    const serialPath = path.join(dir, 'ca.srl');
    openssl([
      'req', '-x509', '-newkey', 'rsa:2048', '-keyout', keyPath, '-out', certPath,
      '-days', '30', '-nodes', '-subj', '/CN=OpenBrowser Worker CA',
      '-addext', 'basicConstraints=critical,CA:TRUE',
      '-addext', 'keyUsage=critical,keyCertSign,cRLSign',
    ]);
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
      serialPath,
      dir,
      serial: 1,
    };
  }

  /** Per-host leaf signed by the CA (cached). SAN covers the host exactly. */
  leafFor(servername) {
    const host = String(servername || 'localhost').toLowerCase();
    let leaf = this.leafCache.get(host);
    if (leaf) return leaf;
    const dir = this.ca.dir;
    const keyPath = path.join(dir, 'leaf-' + crypto.createHash('sha1').update(host).digest('hex').slice(0, 12) + '.key');
    const csrPath = keyPath.replace(/\.key$/, '.csr');
    const certPath = keyPath.replace(/\.key$/, '.crt');
    const isIp = /^\d+\.\d+\.\d+\.\d+$|^\[[0-9a-f:]+\]$/i.test(host);
    const san = isIp ? `IP:${host.replace(/^\[|\]$/g, '')}` : `DNS:${host}`;
    this.ca.serial += 1;
    openssl(['req', '-new', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', keyPath, '-out', csrPath, '-subj', '/CN=' + (isIp ? 'mitm' : host)]);
    openssl(['x509', '-req', '-in', csrPath, '-CA', path.join(dir, 'ca.crt'),
      '-CAkey', path.join(dir, 'ca.key'), '-set_serial', String(this.ca.serial),
      '-days', '30', '-out', certPath,
      '-extfile', '-', '-sha256'], dir);
    // extfile via stdin: pass SAN through a temp file to keep execFileSync simple.
    const extPath = certPath.replace(/\.crt$/, '.ext');
    fs.writeFileSync(extPath, `subjectAltName=${san}\nbasicConstraints=CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\n`);
    openssl(['x509', '-req', '-in', csrPath, '-CA', path.join(dir, 'ca.crt'),
      '-CAkey', path.join(dir, 'ca.key'), '-set_serial', String(this.ca.serial),
      '-days', '30', '-out', certPath, '-extfile', extPath, '-sha256']);
    leaf = { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath), host };
    this.leafCache.set(host, leaf);
    return leaf;
  }

  /** SHA-256 fingerprint (base64) and DER of the leaf, for cert_override.txt. */
  fingerprintsFor(servername) {
    const leaf = this.leafFor(servername);
    const x509 = new crypto.X509Certificate(leaf.cert);
    return { sha256Base64: certificateFingerprint(x509.raw), leafDer: x509.raw };
  }

  setWorkerSource(source) { this.workerSource = String(source || ''); }

  get url() { return 'http://127.0.0.1:' + this.port; }

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
    if (this.ca?.dir) fs.rm(this.ca.dir, { recursive: true, force: true }, () => {});
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
      if (pending.length > MAX_HEADER_BYTES) { client.destroy(); return; }
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

  /** CONNECT: terminate TLS (worker rewrite needs the plaintext), else blind-tunnel. */
  onConnect(client, firstLine, remainder) {
    // The request line is 'CONNECT host:port HTTP/1.1' — drop the protocol suffix
    // before parsing, or the port slice becomes '443 HTTP/1.1' (NaN).
    const target = firstLine.replace(/^CONNECT\s+/i, '').replace(/\s+HTTP\/\d(?:\.\d)?$/i, '').trim();
    const separator = target.lastIndexOf(':');
    const host = separator > 0 ? target.slice(0, separator) : target;
    const port = separator > 0 ? Number(target.slice(separator + 1)) : 443;
    // We cannot see Sec-Fetch-Dest before the TLS handshake: worker detection
    // happens INSIDE the terminated session. Product default terminates every
    // session; an explicit terminatingHosts list (tests) keeps the rest blind.
    const shouldTerminate = !this.terminatingHosts || this.terminatingHosts.has(host.toLowerCase());
    if (shouldTerminate) {
      this.terminateTls(client, host, port, remainder).catch((error) => {
        this.log('mitm-terminate-failed', host, error.message);
        this.tunnel(client, host, port, remainder);
      });
      return;
    }
    this.tunnel(client, host, port, remainder);
  }

  /** Open the upstream leg: direct TCP, or a CONNECT tunnel through the chained bridge. */
  connectUpstream(host, port, onTunnelReady) {
    if (!this.upstreamProxy) {
      if (!this.allowedUpstreamHosts?.has(String(host).toLowerCase())) assertSafeUpstreamHost(host);
      const socket = net.connect({ host, port }, () => onTunnelReady(null, socket));
      return socket;
    }
    // Chained bridge speaks plain HTTP proxy: send CONNECT (with credentials
    // when the bridge still expects them), wait for 2xx, then pipe.
    const bridge = net.connect({ host: this.upstreamProxy.host, port: this.upstreamProxy.port });
    let head = Buffer.alloc(0);
    const onData = (chunk) => {
      head = Buffer.concat([head, chunk]);
      const marker = head.indexOf('\r\n\r\n');
      if (marker < 0) {
        if (head.length > MAX_HEADER_BYTES) bridge.destroy();
        return;
      }
      bridge.removeListener('data', onData);
      const statusLine = head.subarray(0, marker).toString('latin1').split('\r\n', 1)[0];
      if (!/\s2\d\d\s/.test(' ' + statusLine + ' ')) {
        bridge.destroy();
        onTunnelReady(new Error('Chained upstream CONNECT failed: ' + statusLine), bridge);
        return;
      }
      onTunnelReady(null, bridge);
    };
    bridge.on('data', onData);
    bridge.on('connect', () => {
      const auth = this.upstreamProxy.username || this.upstreamProxy.password
        ? 'Proxy-Authorization: Basic ' + Buffer.from(
            this.upstreamProxy.username + ':' + (this.upstreamProxy.password || ''), 'utf8').toString('base64') + '\r\n'
        : '';
      bridge.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`, 'latin1');
    });
    return bridge;
  }

  tunnel(client, host, port, remainder) {
    if (!Number.isFinite(port) || port <= 0 || port > 65535) {
      if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: invalid CONNECT target\r\nConnection: close\r\n\r\n');
      return;
    }
    let upstream;
    try { upstream = this.connectUpstream(host, port, (error, socket) => {
      if (error || !socket) {
        if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: upstream connect failed\r\nConnection: close\r\n\r\n');
        return;
      }
      client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: OpenBrowser-Worker-MITM\r\n\r\n');
      // The CONNECT header stage paused the client; blind piping needs it live.
      if (client.isPaused && client.isPaused()) client.resume();
      if (remainder.length) socket.write(remainder);
      socket.pipe(client); client.pipe(socket);
    }); } catch (policyError) {
      if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: ' + policyError.message + '\r\nConnection: close\r\n\r\n');
      return;
    }
    this.sockets.add(upstream);
    upstream.once('close', () => this.sockets.delete(upstream));
    upstream.on('error', () => client.destroy());
    client.on('error', () => upstream.destroy());
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

  /** HTTP/1.1 session over the terminated TLS socket (one request at a time). */
  serveHttpsSession(socket, host, port, initialRemainder) {
    let buffer = initialRemainder;
    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        const marker = buffer.indexOf('\r\n\r\n');
        if (marker < 0) break;
        const headerText = buffer.subarray(0, marker + 4).toString('latin1');
        const body = buffer.subarray(marker + 4);
        const { start, headers } = parseHeaders(headerText);
        const contentLength = Number(findHeader(headers, 'content-length')?.[1] || 0);
        if (body.length < contentLength) return; // wait for the rest of the body
        buffer = Buffer.alloc(0);
        this.dispatchRequest(socket, host, port, start, headers, body);
      }
    });
    socket.on('error', () => socket.destroy());
  }

  dispatchRequest(socket, host, port, start, headers, body) {
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
    let upstream;
    try {
      upstream = this.connectUpstream(request.host, request.port, (error, tunnelSocket) => {
        if (error || !tunnelSocket) {
          if (!socket.destroyed) socket.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: upstream connect failed\r\nConnection: close\r\n\r\n');
          socket.destroy();
          return;
        }
        const isIpLiteral = /^\d+\.\d+\.\d+\.\d+$|^\[[0-9a-f:]+\]$/i.test(request.host);
        const secure = tls.connect({
          socket: tunnelSocket,
          // `host` keeps hostname verification alive on a socket-based connect.
          host: request.host,
          // RFC 6066 forbids an IP SNI; Node warns and it can stall some stacks.
          ...(isIpLiteral ? {} : { servername: request.host }),
          // Strict by default; the forwarder's owner can pin the origin's CA/leaf
          // for test origins via trustedUpstreamCert without disabling verification.
          ...(this.trustedUpstreamCert ? { ca: this.trustedUpstreamCert } : {}),
          ...(this.upstreamCaBundle ? { ca: this.upstreamCaBundle } : {}),
          rejectUnauthorized: true,
        }, () => {
          const head = request.start + '\r\n' + request.headers.map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
          this.log('mitm-upstream-connected', request.host + ':' + request.port, 'head-bytes=' + head.length);
          secure.write(head, 'latin1');
          if (request.body.length) secure.write(request.body);
          this.readUpstreamResponse(secure, socket, request);
        });
        secure.on('error', (error) => {
          this.log('mitm-upstream-failed', request.host, error.message);
          if (!socket.destroyed) socket.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: upstream tls failed\r\nConnection: close\r\n\r\n');
          socket.destroy();
        });
        socket.on('error', () => secure.destroy());
      });
    } catch (policyError) {
      if (!socket.destroyed) socket.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: ' + policyError.message + '\r\nConnection: close\r\n\r\n');
      return;
    }
    if (upstream) {
      this.sockets.add(upstream);
      upstream.once('close', () => this.sockets.delete(upstream));
    }
  }

  readUpstreamResponse(upstream, client, request) {
    let buffer = Buffer.alloc(0);
    const onUpstreamData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const marker = buffer.indexOf('\r\n\r\n');
      if (marker < 0) {
        if (buffer.length > MAX_HEADER_BYTES) { upstream.destroy(); client.destroy(); }
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
    const isWorker = isFirefoxWorkerScript(headers);
    removeHeaders(headers, ['connection', 'proxy-connection', 'keep-alive']);
    headers.push(['connection', 'close']);
    const originHost = url.hostname;
    const originPort = Number(url.port) || 80;
    let upstream;
    try {
      if (this.upstreamProxy) {
        // Chained bridge: keep the absolute request-URI (standard proxy form).
        upstream = net.connect({ host: this.upstreamProxy.host, port: this.upstreamProxy.port }, () => {
          const chainAuth = this.upstreamProxy.username || this.upstreamProxy.password
            ? [['proxy-authorization', 'Basic ' + Buffer.from(
                this.upstreamProxy.username + ':' + (this.upstreamProxy.password || ''), 'utf8').toString('base64')]]
            : [];
          const head = start + '\r\n' + [...headers, ...chainAuth].map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
          upstream.write(head, 'latin1');
          if (remainder.length) upstream.write(remainder);
          this.readUpstreamResponse(upstream, client, { isWorker, host: originHost });
        });
      } else {
        if (!this.allowedUpstreamHosts?.has(originHost.toLowerCase())) assertSafeUpstreamHost(originHost);
        upstream = net.connect({ host: originHost, port: originPort }, () => {
          const pathPart = url.pathname + url.search;
          const rewrittenStart = start.replace(/^(\S+)\s+\S+\s+(\S+)$/, `$1 ${pathPart} $2`);
          const head = rewrittenStart + '\r\n' + headers.map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n';
          upstream.write(head, 'latin1');
          if (remainder.length) upstream.write(remainder);
          this.readUpstreamResponse(upstream, client, { isWorker, host: originHost });
        });
      }
    } catch (policyError) {
      if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: ' + policyError.message + '\r\nConnection: close\r\n\r\n');
      return;
    }
    this.sockets.add(upstream);
    upstream.once('close', () => this.sockets.delete(upstream));
    upstream.on('error', () => client.destroy());
    client.on('error', () => upstream.destroy());
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

module.exports = { FirefoxWorkerMitmProxy, certOverrideLine, isFirefoxWorkerScript, WORKER_DESTS, assertSafeUpstreamHost };
