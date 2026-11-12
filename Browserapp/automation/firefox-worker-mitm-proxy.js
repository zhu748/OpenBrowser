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
 *   - other response bodies stream without decoding or buffering, and the
 *     upstream leg can be DIRECT or chained through a configured proxy
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
const net = require('net');
const tls = require('tls');
const http = require('node:http');
const https = require('node:https');
const { forwardWorkerResponse, forwardHeaders } = require('./firefox-worker-response');
const { WorkerCertificates, createCA, createCASync } = require('./firefox-worker-certificates');
const { isCloudMetadataHostname, isPrivateOrLocalHostname, createPolicyLookup } = require('../network/address-policy');

const WORKER_DESTS = new Set(['worker', 'serviceworker', 'sharedworker']);
const MAX_HEADER_BYTES = 65536;
const SOCKET_TIMEOUT_MS = 30000;

function workerDestFor(headers) {
  const raw = Array.isArray(headers)
    ? headers.find(([key]) => key.toLowerCase() === 'sec-fetch-dest')?.[1]
    : headers['sec-fetch-dest'];
  const value = String(raw || '').toLowerCase().trim();
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

function authority(host, port) { return (net.isIP(host) === 6 ? '[' + host + ']' : host) + ':' + port; }

class FirefoxWorkerMitmProxy {
  constructor(options = {}) {
    this.workerSource = String(options.workerSource || '');
    // Chained upstream: { host, port } of an authenticated proxy bridge. Null = direct.
    this.upstreamProxy = options.upstreamProxy || null;
    this.ca = options.ca || FirefoxWorkerMitmProxy.generateCA();
    this.certificates = new WorkerCertificates(this.ca);
    this.leafCache = this.certificates.cache;
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
    this.destinationLookup = createPolicyLookup({ lookup: options.lookup });
    this.server = null;
    this.sockets = new Set();
    this.port = 0;
    this.logger = typeof options.logger === 'function' ? options.logger : null;
  }

  static generateCA() { return createCASync(); }

  // The desktop startup path never blocks the main event loop on OpenSSL.
  static async create(options = {}) {
    return new this({ ...options, ca: options.ca || await createCA() });
  }

  // Synchronous compatibility path for certificate-override fixtures only.
  leafFor(host) { return this.certificates.getSync(host); }

  /** SHA-256 fingerprint (base64) and DER of the leaf, for cert_override.txt. */
  fingerprintsFor(servername) {
    const leaf = this.leafFor(servername);
    const x509 = new crypto.X509Certificate(leaf.cert);
    return { sha256Base64: certificateFingerprint(x509.raw), leafDer: x509.raw };
  }

  setWorkerSource(source) { this.workerSource = String(source || ''); }

  get url() { return 'http://127.0.0.1:' + this.port; }

  track(socket) {
    if (this.closed) { socket.destroy(); return socket; }
    if (this.sockets.has(socket)) return socket;
    this.sockets.add(socket);
    socket.once('close', () => this.sockets.delete(socket));
    socket.on('error', () => {});
    socket.setTimeout(SOCKET_TIMEOUT_MS, () => socket.destroy());
    return socket;
  }

  async start() {
    if (this.server || this.closing) throw new Error('Worker proxy cannot be started twice');
    this.closed = false;
    this.server = http.createServer({ maxHeaderSize: MAX_HEADER_BYTES }, (request, response) => {
      this.forward(request, response);
    });
    this.tlsHttpServer = http.createServer({ maxHeaderSize: MAX_HEADER_BYTES }, (request, response) => {
      this.forward(request, response);
    });
    for (const server of [this.server, this.tlsHttpServer]) {
      server.headersTimeout = SOCKET_TIMEOUT_MS;
      server.on('clientError', (_error, socket) => socket.destroy());
      server.on('upgrade', (request, socket, head) => this.forwardUpgrade(request, socket, head));
    }
    this.server.on('connection', (socket) => this.track(socket));
    this.server.on('connect', (request, socket, head) => {
      this.onConnect(request, socket, head).catch((error) => {
        this.log('connect-failed', error.message);
        if (!socket.destroyed) socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
      });
    });
    await new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(0, '127.0.0.1', resolve);
    });
    this.port = this.server.address().port;
    return this;
  }

  close() {
    return this.closing ||= (async () => {
      this.closed = true;
      for (const socket of this.sockets) socket.destroy();
      this.sockets.clear();
      for (const server of [this.server, this.tlsHttpServer]) {
        server?.closeAllConnections();
        if (server?.listening) await new Promise((resolve) => server.close(resolve));
        else server?.close();
      }
      await this.certificates.close();
    })();
  }

  log(...args) { try { this.logger?.(...args); } catch (_) {} }

  assertDestination(host) {
    if (!this.upstreamProxy && !this.allowedUpstreamHosts.has(host.toLowerCase())) assertSafeUpstreamHost(host);
    if (this.closed) throw new Error('Worker proxy is closed');
  }

  openTunnel(host, port, { signal } = {}) {
    this.assertDestination(host);
    return new Promise((resolve, reject) => {
      if (!this.upstreamProxy) {
        const socket = this.track(net.connect({ host, port, signal,
          ...(!this.allowedUpstreamHosts.has(host.toLowerCase()) ? { lookup: this.destinationLookup } : {}),
        }));
        socket.once('connect', () => resolve(socket));
        socket.once('error', reject);
        socket.once('close', () => reject(new Error('Upstream connection closed')));
        return;
      }
      const headers = { host: authority(host, port) };
      const { username, password } = this.upstreamProxy;
      if (username || password) headers['proxy-authorization'] = 'Basic ' + Buffer.from(username + ':' + (password || '')).toString('base64');
      const connect = http.request({ host: this.upstreamProxy.host, port: this.upstreamProxy.port,
        method: 'CONNECT', path: authority(host, port), headers, agent: false, signal });
      connect.on('socket', (socket) => this.track(socket));
      connect.setTimeout(SOCKET_TIMEOUT_MS, () => connect.destroy(new Error('Upstream CONNECT timeout')));
      connect.once('error', reject);
      connect.once('connect', (response, socket, head) => {
        if (response.statusCode !== 200 || this.closed) {
          socket.destroy(); reject(new Error('Upstream CONNECT rejected')); return;
        }
        if (head.length) socket.unshift(head);
        resolve(socket);
      });
      connect.end();
    });
  }

  async onConnect(request, client, head) {
    const target = new URL('https://' + request.url);
    if (target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw new Error('Invalid CONNECT target');
    const host = target.hostname.replace(/^\[|\]$/g, '');
    const port = Number(target.port) || 443;
    this.assertDestination(host);
    client.pause();
    if (this.terminatingHosts && !this.terminatingHosts.has(host.toLowerCase())) {
      const controller = new AbortController();
      client.once('close', () => controller.abort());
      const upstream = await this.openTunnel(host, port, { signal: controller.signal });
      if (client.destroyed || this.closed) { upstream.destroy(); return; }
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      upstream.on('error', () => client.destroy());
      client.on('error', () => upstream.destroy());
      client.once('close', () => upstream.destroy());
      upstream.pipe(client); client.pipe(upstream); client.resume();
      return;
    }
    // Once TLS negotiation begins there is no safe raw-tunnel fallback.
    const leaf = await this.certificates.get(host);
    if (client.destroyed || this.closed) return;
    client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head.length) client.unshift(head);
    const socket = this.track(new tls.TLSSocket(client, {
      isServer: true, secureContext: tls.createSecureContext({ key: leaf.key, cert: leaf.cert }),
    }));
    socket.workerTarget = { host, port };
    const timer = setTimeout(() => socket.destroy(), 8000);
    timer.unref?.();
    socket.once('close', () => { clearTimeout(timer); client.destroy(); });
    socket.once('secure', () => {
      clearTimeout(timer);
      this.tlsHttpServer.emit('connection', socket);
    });
    socket.resume(); client.resume();
  }

  destination(request) {
    const target = request.socket.workerTarget;
    const url = target
      ? new URL(request.url, 'https://' + authority(target.host, target.port))
      : new URL(request.url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid proxy URL');
    if (target && (url.hostname.replace(/^\[|\]$/g, '') !== target.host || (Number(url.port) || 443) !== target.port || url.protocol !== 'https:')) {
      throw new Error('HTTPS authority changed inside CONNECT');
    }
    const host = url.hostname.replace(/^\[|\]$/g, '');
    this.assertDestination(host);
    return { url, host, port: Number(url.port) || (url.protocol === 'https:' ? 443 : 80) };
  }

  outgoing(request) {
    const { url, host, port } = this.destination(request);
    const headers = forwardHeaders(request.headers);
    if (isFirefoxWorkerScript(request.headers) && this.workerSource) {
      for (const key of ['if-none-match', 'if-modified-since', 'range', 'if-range']) delete headers[key];
    }
    headers.host = url.host;
    headers.connection = 'close';
    const options = { method: request.method, headers, agent: false };
    if (url.protocol === 'http:') {
      if (this.upstreamProxy) {
        options.hostname = this.upstreamProxy.host; options.port = this.upstreamProxy.port;
        options.path = url.href;
        const { username, password } = this.upstreamProxy;
        if (username || password) headers['proxy-authorization'] = 'Basic ' + Buffer.from(username + ':' + (password || '')).toString('base64');
      } else {
        options.hostname = host; options.port = port; options.path = url.pathname + url.search;
        if (!this.allowedUpstreamHosts.has(host.toLowerCase())) options.lookup = this.destinationLookup;
      }
      return { transport: http, options };
    }
    const agent = new https.Agent({ keepAlive: false });
    const controller = new AbortController();
    const destroy = agent.destroy.bind(agent);
    agent.destroy = () => { controller.abort(); destroy(); };
    agent.createConnection = (_options, done) => {
      this.openTunnel(host, port, { signal: controller.signal }).then((upstream) => {
        if (this.closed || controller.signal.aborted) { upstream.destroy(); done(new Error('Worker request was closed')); return; }
        const secure = this.track(tls.connect({ socket: upstream, host,
          ...(net.isIP(host) ? {} : { servername: host }),
          ...([this.trustedUpstreamCert, this.upstreamCaBundle].some(Boolean)
            ? { ca: [this.trustedUpstreamCert, this.upstreamCaBundle].filter(Boolean) } : {}),
          ALPNProtocols: ['http/1.1'], rejectUnauthorized: true,
        }));
        done(null, secure);
      }, done);
    };
    Object.assign(options, { hostname: host, port, path: url.pathname + url.search, agent });
    return { transport: https, options, agent };
  }

  forward(request, response) {
    let upstream, agent;
    let failed = false;
    const fail = (error) => {
      if (failed) return;
      failed = true;
      this.log('forward-failed', error.message);
      upstream?.destroy(); agent?.destroy();
      if (response.headersSent) response.destroy();
      else if (!response.destroyed) response.writeHead(502, { 'content-length': '0', connection: 'close' }).end();
    };
    try {
      const outgoing = this.outgoing(request);
      agent = outgoing.agent;
      upstream = outgoing.transport.request(outgoing.options);
      upstream.on('socket', (socket) => this.track(socket));
      upstream.setTimeout(SOCKET_TIMEOUT_MS, () => upstream.destroy(new Error('Upstream response timeout')));
      upstream.once('error', fail);
      upstream.once('response', (result) => {
        forwardWorkerResponse(result, response, { method: request.method,
          isWorker: isFirefoxWorkerScript(request.headers), workerSource: this.workerSource,
        }).catch(fail).finally(() => agent?.destroy());
      });
      request.once('aborted', () => upstream.destroy());
      response.once('close', () => { upstream.destroy(); agent?.destroy(); });
      request.pipe(upstream);
    } catch (error) { fail(error); }
  }

  forwardUpgrade(request, client, head) {
    let outgoing, upstream;
    try {
      outgoing = this.outgoing(request);
      outgoing.options.headers.upgrade = request.headers.upgrade;
      outgoing.options.headers.connection = 'Upgrade';
      upstream = outgoing.transport.request(outgoing.options);
      upstream.on('socket', (socket) => this.track(socket));
      upstream.setTimeout(SOCKET_TIMEOUT_MS, () => upstream.destroy());
      upstream.once('error', () => client.destroy());
      upstream.once('response', () => client.end('HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\nConnection: close\r\n\r\n'));
      upstream.once('upgrade', (response, socket, remainder) => {
        const lines = response.rawHeaders.reduce((all, value, i, values) => i % 2 ? all : [...all, value + ': ' + values[i + 1]], []);
        client.write('HTTP/1.1 101 Switching Protocols\r\n' + lines.join('\r\n') + '\r\n\r\n');
        if (remainder.length) client.write(remainder);
        if (head.length) socket.write(head);
        socket.on('error', () => client.destroy());
        client.on('error', () => socket.destroy());
        client.once('close', () => socket.destroy());
        socket.once('close', () => { client.destroy(); outgoing.agent?.destroy(); });
        socket.setTimeout(0); client.setTimeout(0);
        socket.pipe(client); client.pipe(socket); client.resume();
      });
      client.once('close', () => { upstream.destroy(); outgoing.agent?.destroy(); });
      upstream.end();
    } catch (_) { client.destroy(); outgoing?.agent?.destroy(); }
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
