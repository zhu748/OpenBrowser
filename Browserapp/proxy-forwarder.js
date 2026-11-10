'use strict';

const { isBlockedOutboundHostname, assertSafeOutboundUrl, fetchUrlText } = require('./network/outbound');
const { normalizeIpLookupChannel, normalizeProxyHost, parseProxyInput, parseProxy, chromeProxyEndpoint, displayProxy } = require('./network/proxy-config');
const { isCloudMetadataHostname, isPrivateOrLocalHostname } = require('./network/address-policy');
const crypto = require('crypto');
const dns = require('dns');
const net = require('net');
const { runProxyProbes } = require('./engine/proxy-probe-runner');
const {
  normalizeIpApiResult,
  normalizeIpPureResult,
  attachIpPure,
  parseCloudflareTrace,
  normalizeIpInfoResult,
  mergeNetworkLookups,
  isProxyLinkError,
  isProbeServiceError,
  classifyProxyError,
  networkTypeFromLookup,
  normalizeIpWhoResult,
  normalizeIpWhoisAppResult,
  normalizeFreeIpApiResult,
  normalizeIfconfigMeResult
} = require('./network/probe-results');
const tls = require('tls');

let proxyDohResolver = null;
let proxyDohLookup = null;

// DoH degradation is a per-resolution chronic condition (blocked endpoint,
// restricted network): without deduplication every single lookup re-warns the
// same message. Rate-limit each distinct message to once per 60s.
const dohWarnAt = new Map();
function warnDohDegradedOnce(message) {
  const now = Date.now();
  const last = dohWarnAt.get(message) || 0;
  if (now - last < 60000) return;
  dohWarnAt.set(message, now);
  if (dohWarnAt.size > 512) {
    const oldest = dohWarnAt.keys().next().value;
    dohWarnAt.delete(oldest);
  }
  console.warn(message);
}

function getProxyDohLookup() {
  if (!proxyDohLookup) {
    try {
      const { DohResolver, createDohLookup } = require('./automation/doh-resolver');
      if (!proxyDohResolver) {
        proxyDohResolver = new DohResolver();
      }
      const baseLookup = createDohLookup(proxyDohResolver, {
        fallback: (hostname, opts, callback) => {
          warnDohDegradedOnce(`[proxy-forwarder] DoH lookup for "${hostname}" fell back to system DNS (potential ISP DNS leak)`);
          dns.lookup(hostname, opts, callback);
        },
      });
      // createDohLookup deliberately surfaces transport errors (a blocked or unreachable DoH
      // endpoint) so callers can decide. Proxy dialling must still succeed in restricted
      // networks, so degrade to the system resolver — loudly, never silently.
      proxyDohLookup = (hostname, opts, callback) => {
        const settings = typeof opts === 'function' ? {} : (opts || {});
        const done = typeof opts === 'function' ? opts : callback;
        baseLookup(hostname, settings, (error, address, family) => {
          if (!error) { done(null, address, family); return; }
          warnDohDegradedOnce(`[proxy-forwarder] DoH transport failure for "${hostname}" (${error.code || error.message}); resolving via system DNS (potential ISP DNS leak)`);
          dns.lookup(hostname, settings, done);
        });
      };
    } catch (err) {
      warnDohDegradedOnce('[proxy-forwarder] Failed to initialize DoH resolver, falling back to system DNS: ' + (err?.message || err));
      proxyDohLookup = (hostname, opts, callback) => {
        const done = typeof opts === 'function' ? opts : callback;
        const options = typeof opts === 'function' ? {} : (opts || {});
        warnDohDegradedOnce(`[proxy-forwarder] DoH lookup unavailable, resolving "${hostname}" with system DNS (potential ISP DNS leak)`);
        dns.lookup(hostname, options, done);
      };
    }
  }
  return proxyDohLookup;
}

function setProxyDohResolver(resolver) {
  proxyDohResolver = resolver;
  proxyDohLookup = null;
}

/**
 * Local TLS profile descriptors for future dialer integration.
 * These describe ClientHello-oriented preferences only; Node's tls.connect
 * still performs the handshake. A dedicated dialer can consume the same shape.
 */
const TLS_PROFILE_PRESETS = {
  chrome: {
    id: 'chrome',
    alpn: ['h2', 'http/1.1'],
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    // Cipher order approximates modern Chrome; exact GREASE/extension order needs a custom dialer.
    ciphers: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-RSA-AES128-SHA',
      'ECDHE-RSA-AES256-SHA',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384',
      'AES128-SHA',
      'AES256-SHA',
    ].join(':'),
    ecdhCurve: 'X25519:P-256:P-384',
    permuteExtensions: true,
    grease: true,
  },
  chrome_legacy: {
    id: 'chrome_legacy',
    alpn: ['h2', 'http/1.1'],
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: [
      'TLS_AES_128_GCM_SHA256',
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-RSA-AES128-SHA',
      'ECDHE-RSA-AES256-SHA',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384',
      'AES128-SHA',
      'AES256-SHA',
    ].join(':'),
    ecdhCurve: 'X25519:P-256:P-384',
    permuteExtensions: false,
    grease: false,
  },
  node: {
    id: 'node',
    alpn: ['http/1.1', 'h2'],
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    ciphers: null,
    ecdhCurve: null,
    permuteExtensions: false,
    grease: false,
  },
};

function resolveTlsProfile(input = {}) {
  if (!input || input === false || input === 'off' || input === 'disabled') {
    return { ...TLS_PROFILE_PRESETS.node, id: 'off', enabled: false };
  }
  const raw = typeof input === 'string' ? { id: input } : (typeof input === 'object' ? input : {});
  const major = Number(raw.chromeMajor || raw.major || 0) || 0;
  let id = String(raw.id || raw.profile || raw.name || '').trim().toLowerCase();
  if (!id || id === 'auto') {
    id = major && major < 106 ? 'chrome_legacy' : 'chrome';
  }
  if (id === 'chrome' && major && major < 106) id = 'chrome_legacy';
  const base = TLS_PROFILE_PRESETS[id] || TLS_PROFILE_PRESETS.chrome;
  const profile = {
    ...base,
    id: base.id,
    enabled: raw.enabled !== false,
    chromeMajor: major || null,
    servername: raw.servername ? String(raw.servername).slice(0, 253) : null,
    alpn: Array.isArray(raw.alpn) && raw.alpn.length
      ? raw.alpn.map((v) => String(v)).filter(Boolean).slice(0, 8)
      : base.alpn.slice(),
    minVersion: raw.minVersion || base.minVersion,
    maxVersion: raw.maxVersion || base.maxVersion,
    ciphers: raw.ciphers != null ? String(raw.ciphers) : base.ciphers,
    ecdhCurve: raw.ecdhCurve != null ? String(raw.ecdhCurve) : base.ecdhCurve,
    permuteExtensions: raw.permuteExtensions != null ? Boolean(raw.permuteExtensions) : base.permuteExtensions,
    grease: raw.grease != null ? Boolean(raw.grease) : base.grease,
  };
  return profile;
}

/** Options for Node tls.connect that we can apply today without a custom dialer. */
function tlsConnectOptionsFromProfile(profile, { socket, servername, rejectUnauthorized = true } = {}) {
  const resolved = resolveTlsProfile(profile || 'node');
  const options = {
    rejectUnauthorized: rejectUnauthorized !== false,
  };
  if (socket) options.socket = socket;
  const sn = servername || resolved.servername;
  if (sn) options.servername = sn;
  if (!resolved.enabled || resolved.id === 'off' || resolved.id === 'node') {
    return options;
  }
  if (resolved.minVersion) options.minVersion = resolved.minVersion;
  if (resolved.maxVersion) options.maxVersion = resolved.maxVersion;
  if (resolved.ciphers) options.ciphers = resolved.ciphers;
  if (resolved.ecdhCurve) options.ecdhCurve = resolved.ecdhCurve;
  if (resolved.alpn && resolved.alpn.length) options.ALPNProtocols = resolved.alpn.slice();
  return options;
}

class BufferedReader {
  constructor(socket) {
    this.socket = socket; this.buffer = Buffer.alloc(0); this.waiters = []; this.failure = null;
    this.onData = (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      // Hard cap: after a handshake timeout the socket stays in flowing mode,
      // and a local peer could otherwise grow this buffer without bound.
      if (this.buffer.length > 65536) {
        this.fail(new Error('Proxy handshake buffer overflow'));
        try { this.socket.destroy(); } catch (_) {}
        return;
      }
      this.pump();
    };
    this.onError = (error) => this.fail(error);
    this.onClose = () => this.fail(new Error('Socket closed during handshake'));
    socket.on('data', this.onData); socket.on('error', this.onError); socket.on('close', this.onClose);
  }
  read(size, timeout = 15000) { return this.wait({ type: 'size', size, timeout }); }
  readUntil(marker, max = 65536, timeout = 15000) { return this.wait({ type: 'marker', marker: Buffer.from(marker), max, timeout }); }
  wait(options) {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise((resolve, reject) => {
      const waiter = { ...options, resolve, reject };
      waiter.timer = setTimeout(() => { this.waiters = this.waiters.filter((item) => item !== waiter); reject(new Error('Proxy handshake timed out')); }, options.timeout);
      this.waiters.push(waiter); this.pump();
    });
  }
  pump() {
    const waiter = this.waiters[0]; if (!waiter) return;
    let end = -1;
    if (waiter.type === 'size' && this.buffer.length >= waiter.size) end = waiter.size;
    if (waiter.type === 'marker') {
      const index = this.buffer.indexOf(waiter.marker);
      if (index >= 0) end = index + waiter.marker.length;
      else if (this.buffer.length > waiter.max) return this.fail(new Error('Proxy response header was too large'));
    }
    if (end < 0) return;
    this.waiters.shift(); clearTimeout(waiter.timer);
    const value = this.buffer.subarray(0, end); this.buffer = this.buffer.subarray(end); waiter.resolve(value);
  }
  fail(error) {
    if (this.failure) return; this.failure = error;
    for (const waiter of this.waiters.splice(0)) { clearTimeout(waiter.timer); waiter.reject(error); }
  }
  release() {
    this.socket.off('data', this.onData); this.socket.off('error', this.onError); this.socket.off('close', this.onClose);
    const value = this.buffer; this.buffer = Buffer.alloc(0); return value;
  }
}

function connectSocket(host, port, timeout = 8000, signal = null) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Proxy bridge closed'));
    const connectOptions = { host, port };
    if (host && !net.isIP(host)) {
      connectOptions.lookup = getProxyDohLookup();
    }
    const socket = net.connect(connectOptions);
    let onAbort = null;
    const cleanup = () => {
      socket.off('error', onError);
      socket.off('connect', onConnect);
      if (onAbort && signal) signal.removeEventListener('abort', onAbort);
    };
    const onError = (error) => { cleanup(); reject(error); };
    const onConnect = () => { cleanup(); socket.setTimeout(0); socket.setKeepAlive(true, 10000); resolve(socket); };
    socket.setTimeout(timeout, () => socket.destroy(new Error('Proxy connection timed out')));
    if (signal) {
      onAbort = () => socket.destroy(new Error('Proxy bridge closed'));
      signal.addEventListener('abort', onAbort, { once: true });
    }
    socket.once('error', onError); socket.once('connect', onConnect);
  });
}

function makeNotifier(onStatus) {
  let last = '';
  return (code, message) => {
    const key = code + ':' + message; if (last === key) return; last = key;
    try { onStatus({ code, message }); } catch (_) {}
  };
}

async function readSocksAddress(reader, atyp) {
  if (atyp === 1) return reader.read(4);
  if (atyp === 4) return reader.read(16);
  if (atyp === 3) { const size = await reader.read(1); return Buffer.concat([size, await reader.read(size[0])]); }
  throw new Error('Unsupported SOCKS address type');
}

function encodeSocksAddress(host) {
  const normalizedHost = normalizeProxyHost(host);
  if (net.isIP(normalizedHost) === 4) return Buffer.from([1, ...normalizedHost.split('.').map(Number)]);
  if (net.isIP(normalizedHost) === 6) {
    const parts = normalizedHost.split('::');
    if (parts.length > 2) throw new Error('SOCKS5 target IPv6 address is invalid');
    const parseWords = (value) => {
      if (!value) return [];
      return value.split(':').flatMap((part) => {
        if (part.includes('.')) {
          if (net.isIP(part) !== 4) throw new Error('SOCKS5 target IPv6 address is invalid');
          const octets = part.split('.').map(Number);
          return [(octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]];
        }
        if (!/^[0-9a-f]{1,4}$/i.test(part)) throw new Error('SOCKS5 target IPv6 address is invalid');
        return [Number.parseInt(part, 16)];
      });
    };
    const left = parseWords(parts[0]);
    const right = parseWords(parts[1] || '');
    const words = parts.length === 2
      ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill(0), ...right]
      : [...left];
    if (words.length !== 8 || (parts.length === 2 && left.length + right.length >= 8)) {
      throw new Error('SOCKS5 target IPv6 address is invalid');
    }
    return Buffer.from([4, ...words.flatMap((word) => [word >> 8, word & 255])]);
  }
  if (normalizedHost.includes(':') || normalizedHost.includes('[')) {
    throw new Error('SOCKS5 target hostname is invalid');
  }
  const value = Buffer.from(normalizedHost, 'utf8');
  if (!value.length || value.length > 255 || value.includes(0)) throw new Error('SOCKS5 target hostname is invalid');
  return Buffer.concat([Buffer.from([3, value.length]), value]);
}

async function connectSocksTargetOnce(config, host, port, signal = null) {
  let upstream;
  try {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('SOCKS5 target port is invalid');
    }
    upstream = await connectSocket(config.host, config.port, 8000, signal); upstream.on('error', () => {});
    const reader = new BufferedReader(upstream); const timeout = 8000;
    upstream.write(config.authenticated ? Buffer.from([5, 1, 2]) : Buffer.from([5, 1, 0]));
    const method = await reader.read(2, timeout); if (method[0] !== 5 || method[1] === 255) throw new Error('SOCKS5 proxy rejected available authentication methods');
    if (method[1] === 2) {
      const user = Buffer.from(config.username || '', 'utf8'); const password = Buffer.from(config.password || '', 'utf8');
      if (user.length > 255 || password.length > 255) throw new Error('SOCKS5 username or password length is invalid');
      upstream.write(Buffer.concat([Buffer.from([1, user.length]), user, Buffer.from([password.length]), password]));
      const auth = await reader.read(2, timeout); if (auth[0] !== 1 || auth[1] !== 0) throw new Error('SOCKS5 authentication failed');
    } else if (method[1] !== 0) throw new Error('SOCKS5 proxy selected an unsupported authentication method');
    upstream.write(Buffer.concat([Buffer.from([5, 1, 0]), encodeSocksAddress(host), Buffer.from([port >> 8, port & 255])]));
    const response = await reader.read(4, timeout);
    if (response[0] !== 5) throw new Error('Invalid SOCKS5 reply version');
    if (response[1] !== 0) throw new Error('SOCKS5 upstream connection failed with code ' + response[1]);
    await readSocksAddress(reader, response[3]); await reader.read(2, timeout);
    const remainder = reader.release(); return { upstream, remainder };
  } catch (error) {
    upstream?.destroy();
    throw error;
  }
}

function retryableSocksError(error) {
  const message = String(error?.message || "");
  return !/authentication failed|rejected available authentication|unsupported authentication|username or password length|target (?:hostname|port|ipv6(?: address)?) is invalid|invalid socks5 reply version|upstream connection failed with code/i.test(message);
}

async function connectSocksTarget(config, host, port, attempts = 3, signal = null) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (signal?.aborted) throw new Error('Proxy bridge closed');
    try { return await connectSocksTargetOnce(config, host, port, signal); }
    catch (error) {
      lastError = error;
      if (signal?.aborted || attempt >= attempts || !retryableSocksError(error)) throw error;
      await new Promise((resolve) => {
        let onAbort = null;
        const timer = setTimeout(() => {
          if (signal && onAbort) signal.removeEventListener('abort', onAbort);
          resolve();
        }, 180 * attempt);
        if (signal) {
          onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', onAbort);
            resolve();
          };
          signal.addEventListener('abort', onAbort, { once: true });
        }
      });
    }
  }
  throw lastError || new Error('SOCKS5 connection failed');
}

function concurrentConnector(callback, maxConcurrent = 128, spacing = 0, signal = null) {
  const queue = []; let active = 0; let nextAt = 0; let timer = null;
  const drainQueue = (err) => {
    if (timer) { clearTimeout(timer); timer = null; }
    while (queue.length) {
      queue.shift().reject(err || new Error('Proxy bridge closed'));
    }
  };
  const pump = () => {
    if (signal?.aborted) { drainQueue(); return; }
    if (timer) return;
    while (active < maxConcurrent && queue.length) {
      const wait = Math.max(0, nextAt - Date.now());
      if (wait) { timer = setTimeout(() => { timer = null; pump(); }, wait); return; }
      const item = queue.shift(); active += 1; nextAt = Date.now() + spacing;
      Promise.resolve()
        .then(() => callback(...item.args))
        .then(item.resolve, item.reject)
        .finally(() => { active -= 1; pump(); });
    }
  };
  if (signal) {
    signal.addEventListener('abort', () => drainQueue(), { once: true });
  }
  return (...args) => {
    if (signal?.aborted) return Promise.reject(new Error('Proxy bridge closed'));
    return new Promise((resolve, reject) => { queue.push({ args, resolve, reject }); pump(); });
  };
}

function parseHttpTarget(header) {
  const first = header.split('\r\n', 1)[0]; const parts = first.split(/\s+/); const method = String(parts[0] || '').toUpperCase(); const target = String(parts[1] || '');
  if (method === 'CONNECT') {
    const separator = target.lastIndexOf(':'); if (separator < 1) throw new Error('Invalid HTTP CONNECT target');
    const host = target.slice(0, separator).replace(/^\[|\]$/g, '');
    const port = Number(target.slice(separator + 1));
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid HTTP proxy port');
    return { method, host, port, header };
  }
  let host = ''; let port = 80; let path = target;
  if (/^https?:\/\//i.test(target)) {
    const url = new URL(target);
    host = url.hostname;
    port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    path = (url.pathname || '/') + url.search;
  } else {
    const hostLine = header.split('\r\n').find((l) => /^host:/i.test(l));
    const hostVal = hostLine ? hostLine.replace(/^host:\s*/i, '').trim() : '';
    if (!hostVal) throw new Error('Invalid HTTP proxy request: missing Host header');
    const colon = hostVal.lastIndexOf(':');
    if (colon >= 0 && !hostVal.endsWith(']')) {
      host = hostVal.slice(0, colon).replace(/^\[|\]$/g, '');
      port = Number(hostVal.slice(colon + 1)) || 80;
    } else {
      host = hostVal.replace(/^\[|\]$/g, '');
      port = 80;
    }
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid HTTP proxy port');
  const lines = header.split('\r\n'); lines[0] = method + ' ' + path + ' ' + (parts[2] || 'HTTP/1.1');
  return { method, host, port, header: lines.filter((line) => !/^proxy-authorization:/i.test(line) && !/^proxy-connection:/i.test(line)).join('\r\n') };
}

async function startHttpToSocks5Bridge(config, onStatus) {
  const sockets = new Set(); const notify = makeNotifier(onStatus); const controller = new AbortController();
  // Keep authentication handshakes paced for residential proxies, without
  // making a modern Chrome page wait almost a second for every connection.
  const connectTarget = concurrentConnector((host, port) => connectSocksTarget(config, host, port, 3, controller.signal), 128, 0, controller.signal);
  const server = net.createServer((client) => {
    sockets.add(client); client.setNoDelay(true); client.on('error', () => {}); client.once('close', () => sockets.delete(client));
    let pending = Buffer.alloc(0);
    const receiveHeader = (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      if (pending.length > 65536) {
        // Detach the listener and destroy, not just end: with the listener still
        // attached, a half-closing client keeps streaming into `pending`
        // (Buffer.concat with no cap) and exhausts memory.
        client.off('data', receiveHeader);
        client.destroy();
        return;
      }
      const marker = pending.indexOf('\r\n\r\n'); if (marker < 0) return;
      client.off('data', receiveHeader); client.pause();
      const header = pending.subarray(0, marker + 4).toString('latin1'); const body = pending.subarray(marker + 4);
      let target = null;
      (async () => {
        target = parseHttpTarget(header);
        if (process.env.OPENBROWSER_PROXY_DIAGNOSTICS === '1') notify('REQUEST', target.host + ':' + target.port);
        if (/^(mtalk\.google\.com|android\.clients\.google\.com|update\.googleapis\.com)$/i.test(target.host)) { client.end(target.method === 'CONNECT' ? 'HTTP/1.1 502 Background Request Blocked\r\nConnection: close\r\n\r\n' : 'HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n'); return; }
        const connected = await connectTarget(target.host, target.port); const upstream = connected.upstream;
        if (process.env.OPENBROWSER_PROXY_DIAGNOSTICS === '1') notify('CONNECTED', target.host + ':' + target.port);
        if (client.destroyed) { upstream.destroy(); return; }
        sockets.add(upstream); upstream.once('close', () => sockets.delete(upstream)); upstream.on('error', () => client.destroy()); client.on('error', () => upstream.destroy());
        if (target.method === 'CONNECT') client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: OpenBrowser\r\n\r\n');
        else {
          // 非 CONNECT：与 startHttpBridge 同一 keep-alive 危害 —— 桥只解析每条
          // 客户端连接的第一个请求，客户端 Connection: keep-alive（HTTP/1.1 缺省）
          // 复用连接时第二个请求会被 pipe 进第一个请求的 SOCKS 目标（跨站请求/
          // Cookie 误投递）。复用 forwardedHeader('socks-tunnel') 改写：目标站点
          // 收到 Connection: close 后随首个响应关闭，upstream.pipe(client) 结束
          // 客户端腿，复用不可能发生。不注入任何认证（SOCKS 握手已完成，且这里
          // 的请求头直发目标站点）。
          upstream.write(forwardedHeader(target.header, config, 'socks-tunnel'), 'latin1');
        }
        if (connected.remainder.length) client.write(connected.remainder); if (body.length) upstream.write(body);
        client.pipe(upstream); upstream.pipe(client); client.resume();
      })().catch((error) => {
        if (controller.signal.aborted) { client.destroy(); return; }
        const isAuth = /authentication/i.test(error.message);
        notify(isAuth ? 'AUTH_FAILED' : 'UPSTREAM_CONNECT_FAILED', (target?.host ? target.host + ':' + target.port + ' - ' : '') + error.message);
        if (!client.destroyed) {
          client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: ' + (isAuth ? 'AUTH_FAILED' : 'UPSTREAM_CONNECT_FAILED') + ': ' + sanitizeProxyErrorDetail(error.message) + '\r\nConnection: close\r\n\r\n');
        }
      });
    };
    client.on('data', receiveHeader);
  });
  await listen(server, notify);
  return bridgeResult(server, sockets, 'http', () => controller.abort());
}

async function startSocks5Bridge(config, onStatus) {
  const sockets = new Set(); const notify = makeNotifier(onStatus); const controller = new AbortController();
  const server = net.createServer((client) => {
    sockets.add(client); client.setNoDelay(true); client.on('error', () => {}); client.once('close', () => sockets.delete(client));
    let upstream = null;
    (async () => {
      const local = new BufferedReader(client);
      const greeting = await local.read(2); if (greeting[0] !== 5) throw new Error('Invalid local SOCKS5 greeting');
      await local.read(greeting[1]); client.write(Buffer.from([5, 0]));
      const requestHead = await local.read(4); if (requestHead[0] !== 5 || requestHead[1] !== 1) throw new Error('Only SOCKS5 CONNECT is supported');
      const requestAddress = await readSocksAddress(local, requestHead[3]); const requestPort = await local.read(2);
      upstream = await connectSocket(config.host, config.port, 8000, controller.signal); sockets.add(upstream);
      upstream.on('error', () => { if (!client.destroyed) client.destroy(); }); client.on('error', () => upstream.destroy()); upstream.once('close', () => sockets.delete(upstream));
      const remote = new BufferedReader(upstream);
      upstream.write(config.authenticated ? Buffer.from([5, 1, 2]) : Buffer.from([5, 1, 0]));
      const method = await remote.read(2); if (method[0] !== 5 || method[1] === 255) throw new Error('SOCKS5 proxy rejected available authentication methods');
      if (method[1] === 2) {
        const user = Buffer.from(config.username || '', 'utf8'); const password = Buffer.from(config.password || '', 'utf8');
        if (user.length > 255 || password.length > 255) throw new Error('SOCKS5 username or password length is invalid');
        upstream.write(Buffer.concat([Buffer.from([1, user.length]), user, Buffer.from([password.length]), password]));
        const auth = await remote.read(2);
        if (auth[0] !== 1 || auth[1] !== 0) { notify('AUTH_FAILED', 'SOCKS5 username or password was rejected'); throw new Error('SOCKS5 authentication failed'); }
      } else if (method[1] !== 0) throw new Error('SOCKS5 proxy selected an unsupported authentication method');
      upstream.write(Buffer.concat([requestHead, requestAddress, requestPort]));
      const responseHead = await remote.read(4);
      if (responseHead[0] !== 5 || responseHead[1] !== 0) {
        notify('TUNNEL_FAILED', 'SOCKS5 tunnel failed with code ' + responseHead[1]);
        // Fixed 10-byte failure reply: VER REP RSV ATYP(IPv4) BND.ADDR BND.PORT.
        // Echoing the upstream head plus a hand-made tail produced a malformed
        // frame (ATYP did not match the address bytes that followed).
        if (!client.destroyed) client.end(Buffer.from([5, responseHead[1], 0, 1, 0, 0, 0, 0, 0, 0]));
        throw new Error('SOCKS5 upstream connection failed with code ' + responseHead[1]);
      }
      const responseAddress = await readSocksAddress(remote, responseHead[3]); const responsePort = await remote.read(2);
      client.write(Buffer.concat([responseHead, responseAddress, responsePort]));
      const localRemainder = local.release(); const remoteRemainder = remote.release();
      if (localRemainder.length) upstream.write(localRemainder); if (remoteRemainder.length) client.write(remoteRemainder);
      client.pipe(upstream); upstream.pipe(client);
    })().catch((error) => {
      upstream?.destroy();
      notify(error.message.includes('authentication') ? 'AUTH_FAILED' : 'UPSTREAM_CONNECT_FAILED', error.message);
      if (!client.destroyed) client.end(Buffer.from([5, 1, 0, 1, 0, 0, 0, 0, 0, 0]));
    });
  });
  await listen(server, notify);
  return bridgeResult(server, sockets, 'socks5', () => controller.abort());
}

function authorization(config) {
  return 'Basic ' + Buffer.from(config.username + ':' + config.password, 'utf8').toString('base64');
}

/**
 * Sanitize an internal error detail before echoing it into a 502 response
 * header: strip CR/LF (header injection) and cap at 120 chars so upstream
 * internals (addresses, credentials in URLs, stack fragments) cannot leak in
 * full while the failure code stays diagnosable.
 */
function sanitizeProxyErrorDetail(value) {
  return String(value || '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 120);
}

// 单一实现（single-source）：两条桥接路径共用的请求头改写 ——
// 'http-upstream'（明文 HTTP 上游，startHttpBridge）与 'socks-tunnel'
// （HTTP→SOCKS 桥，startHttpToSocks5Bridge 非 CONNECT 请求）。仓库曾因
// 两份漂移副本吃过亏：新增桥接路径必须复用这里，不许再抄一份。
// 两条路径共有的不变式：
// - 剥离逐跳代理头（Proxy-Authorization / Proxy-Connection）——idempotent，
//   parseHttpTarget 已剥过一遍也无妨；
// - `Connection:` 一律重写：非 Upgrade 追加 Connection: close。桥只解析每条
//   客户端连接的第一个请求；keep-alive 复用会把第二个请求隧进第一个请求的
//   上游 socket（跨站请求/Cookie 误投递），Connection: close 让上游在首个
//   响应后关闭，upstream.pipe(client) 随之结束客户端腿，复用不可能发生。
//   Upgrade（WebSocket）保留原 Connection 行，不追加 close。
// 仅 'http-upstream' 模式：注入上游 Basic 认证（407 由上游代理裁决）并追加
// Proxy-Connection: close；'socks-tunnel' 模式的请求头直发目标站点，SOCKS
// 握手已在上游完成认证 —— 目标站点绝不能看到任何代理凭据或逐跳代理头。
function forwardedHeader(header, config, mode = 'http-upstream') {
  const httpUpstream = mode === 'http-upstream';
  const lines = header.split('\r\n'); const first = lines.shift();
  let upgradeLine = '';
  const kept = lines.filter((line) => {
    if (!line) return false;
    const lower = line.toLowerCase();
    if (lower.startsWith('proxy-authorization:') || lower.startsWith('proxy-connection:')) return false;
    if (lower.startsWith('connection:')) {
      if (lower.includes('upgrade')) upgradeLine = line;
      return false;
    }
    return true;
  });
  if (httpUpstream && config.authenticated) kept.push('Proxy-Authorization: ' + authorization(config));
  if (upgradeLine) kept.push(upgradeLine);
  else {
    if (httpUpstream) kept.push('Proxy-Connection: close');
    kept.push('Connection: close');
  }
  return [first, ...kept, '', ''].join('\r\n');
}

function connectHttpUpstream(config, onConnect) {
  const connectOpts = { host: config.host, port: config.port };
  if (config.host && !net.isIP(config.host)) {
    connectOpts.lookup = getProxyDohLookup();
  }
  if (config.protocol === 'https') {
    const tlsProfile = resolveTlsProfile(config.tlsProfile || 'auto');
    const opts = tlsConnectOptionsFromProfile(tlsProfile, {
      ...connectOpts,
      servername: config.host,
      rejectUnauthorized: true,
    });
    return tls.connect(opts, onConnect);
  }
  return net.connect(connectOpts, onConnect);
}

async function startHttpBridge(config, onStatus) {
  const sockets = new Set(); const notify = makeNotifier(onStatus);
  const server = net.createServer((client) => {
    sockets.add(client); client.setNoDelay(true); client.once('close', () => sockets.delete(client));
    let pending = Buffer.alloc(0);
    const receiveHeader = (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      if (pending.length > 65536) {
        // Detach the listener and destroy, not just end: with the listener still
        // attached, a half-closing client keeps streaming into `pending`
        // (Buffer.concat with no cap) and exhausts memory.
        client.off('data', receiveHeader);
        client.destroy();
        return;
      }
      const marker = pending.indexOf('\r\n\r\n'); if (marker < 0) return;
      client.removeListener('data', receiveHeader); client.pause();
      const header = pending.subarray(0, marker + 4).toString('latin1'); const remainder = pending.subarray(marker + 4);
      const isConnect = /^CONNECT\s+/i.test(header.split('\r\n', 1)[0]); let upstream;
      const fail = (message) => { notify('UPSTREAM_CONNECT_FAILED', message); if (!client.destroyed) client.end('HTTP/1.1 502 Bad Gateway\r\nX-Proxy-Error: ' + sanitizeProxyErrorDetail(message || 'UPSTREAM_CONNECT_FAILED') + '\r\nConnection: close\r\n\r\n'); };
      try {
        upstream = connectHttpUpstream(config, () => {
          upstream.write(forwardedHeader(header, config), 'latin1');
          if (!isConnect) {
            if (remainder.length) upstream.write(remainder);
            // Only the first request on a client connection gets parsed; a
            // keep-alive reuse would skip Proxy-Authorization injection and
            // tunnel the second request into the first upstream socket. The
            // actual safeguard is the Connection: close rewrite forwardedHeader
            // performs on the client leg's request: the upstream proxy closes
            // after the first response, and the clientEnd/close handlers below
            // end the client socket, so reuse cannot happen. (An earlier
            // revision assigned client.writeHeadOnData = null here claiming a
            // further safeguard — that mechanism never existed; nothing ever
            // read the property. Do not reintroduce it.)
            const clientEnd = () => { if (!client.destroyed) client.end(); };
            upstream.once('end', clientEnd);
            upstream.once('close', () => { clientEnd(); upstream.removeListener('end', clientEnd); });
            client.pipe(upstream); upstream.pipe(client); client.resume(); return;
          }
          let response = Buffer.alloc(0);
          const receiveResponse = (data) => {
            response = Buffer.concat([response, data]); if (response.length > 65536) { upstream.destroy(); fail('Proxy response header was too large'); return; }
            const responseMarker = response.indexOf('\r\n\r\n'); if (responseMarker < 0) return;
            if (receiveResponse.cleanup) receiveResponse.cleanup();
            const responseHeader = response.subarray(0, responseMarker + 4); const responseRemainder = response.subarray(responseMarker + 4);
            const match = responseHeader.toString('latin1').split('\r\n', 1)[0].match(/\s(\d{3})(?:\s|$)/); const status = Number(match?.[1] || 0);
            if (status !== 200) {
              notify(status === 407 ? 'AUTH_FAILED' : 'TUNNEL_FAILED', status === 407 ? 'Proxy username or password was rejected' : 'Proxy tunnel failed with HTTP ' + status);
              client.end(responseHeader); upstream.end(); return;
            }
            // Chrome is happier with a clean CONNECT reply than whatever the upstream proxy returned.
            client.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: OpenBrowser\r\n\r\n');
            if (responseRemainder.length) client.write(responseRemainder);
            if (remainder.length) upstream.write(remainder); client.pipe(upstream); upstream.pipe(client); client.resume();
          };
          upstream.on('data', receiveResponse);
          // A CONNECT waits for the upstream response header. An upstream that
          // dies mid-handshake without an error (clean FIN — accept-then-close
          // proxies, or a reset connection where the kernel delivers EOF first)
          // never fires 'error', so without this the client would hang until
          // its own timeout with no 502 and no diagnostics.
          const handshakeDeadline = setTimeout(() => { if (!client.destroyed) fail('Proxy CONNECT handshake timed out'); upstream.destroy(); }, 8000);
          const onUpstreamGone = () => { clearTimeout(handshakeDeadline); if (!client.destroyed) fail('Proxy closed the connection during CONNECT handshake'); upstream.removeListener('end', onUpstreamGone); upstream.removeListener('close', onUpstreamGone); };
          upstream.once('end', onUpstreamGone);
          upstream.once('close', onUpstreamGone);
          receiveResponse.cleanup = () => { clearTimeout(handshakeDeadline); upstream.removeListener('end', onUpstreamGone); upstream.removeListener('close', onUpstreamGone); upstream.removeListener('data', receiveResponse); };
        });
      } catch (error) { fail(error.message); return; }
      sockets.add(upstream); upstream.once('close', () => sockets.delete(upstream));
      upstream.once('error', (error) => { if (!client.destroyed) fail(error.message); client.destroy(); }); client.once('error', () => upstream.destroy());
    };
    client.on('data', receiveHeader); client.on('error', () => {});
  });
  await listen(server, notify);
  return bridgeResult(server, sockets, 'http');
}

function listen(server, notify) {
  server.on('error', (error) => notify('LOCAL_PROXY_FAILED', error.message));
  return new Promise((resolve, reject) => {
    const onError = (error) => { server.off('listening', onListen); reject(error); };
    const onListen = () => { server.off('error', onError); resolve(); };
    server.once('error', onError); server.once('listening', onListen); server.listen(0, '127.0.0.1');
  });
}

function needsProxyBridge(config) {
  if (!config) return false;
  return Boolean(
    config.authenticated ||
    config.protocol === 'socks5' ||
    process.env.OPENBROWSER_ALWAYS_BRIDGE_PROXY === '1'
  );
}

function bridgeResult(server, sockets, protocol, onClose = () => {}) {
  const address = server.address();
  return {
    protocol, port: address.port, url: protocol + '://127.0.0.1:' + address.port,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      onClose();
      await new Promise((resolve) => server.close(() => resolve()));
    }
  };
}

async function startAuthenticatedProxy(config, onStatus = () => {}) {
  if (!config) throw new Error('Proxy configuration is required');
  if (config.probeSignal?.aborted) throw new Error('Proxy probe cancelled');
  let bridge;

  // Keep HTTPS TLS and probe orchestration/error classification on their proven JS paths.
  if (process.env.OPENBROWSER_USE_RUST_CORE === '1' && !config.probeSignal && ['socks5', 'http'].includes(config.protocol)) {
    try {
      const { startRustProxyBridge } = require('./automation/rust-core-bridge');
      const rustBridge = await startRustProxyBridge({
        protocol: config.protocol,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        remark: config.remark,
      }, onStatus, config.probeSignal);
      bridge = {
        protocol: 'http',
        port: rustBridge.port,
        url: 'http://127.0.0.1:' + rustBridge.port,
        engine: 'rust-core',
        close: async () => {
          await rustBridge.stop();
        },
      };
    } catch (rustErr) {
      if (config.probeSignal?.aborted) throw new Error('Proxy probe cancelled');
      console.warn('[proxy-forwarder] Rust Core unavailable; retaining configured JS proxy backend:', rustErr.message);
    }
  }

  if (!bridge) {
    if (config.protocol === 'socks5') bridge = await startHttpToSocks5Bridge(config, onStatus);
    else if (['http', 'https'].includes(config.protocol)) bridge = await startHttpBridge(config, onStatus);
    else throw new Error('SOCKS4 bridge is not supported');
  }
  if (!config.probeSignal) return bridge;
  const close = bridge.close;
  let closing;
  const abort = () => { bridge.close().catch(() => {}); };
  bridge.close = () => {
    config.probeSignal.removeEventListener('abort', abort);
    return closing ||= close();
  };
  config.probeSignal.addEventListener('abort', abort, { once: true });
  if (config.probeSignal.aborted) {
    await bridge.close();
    throw new Error('Proxy probe cancelled');
  }
  return bridge;
}

async function connectBridge(bridge, hostname, port) {
  const socket = await connectSocket('127.0.0.1', bridge.port); const reader = new BufferedReader(socket);
  if (bridge.protocol === 'http') {
    // Bracket a bare IPv6 literal: "CONNECT 2001:db8::1:443" is unparseable
    // on the upstream side (host/port boundary is ambiguous).
    const authority = String(hostname || '').includes(':') && !String(hostname || '').startsWith('[')
      ? `[${hostname}]:${port}` : `${hostname}:${port}`;
    socket.write('CONNECT ' + authority + ' HTTP/1.1\r\nHost: ' + authority + '\r\nConnection: close\r\n\r\n');
    const header = await reader.readUntil('\r\n\r\n');
    const headerStr = header.toString('latin1');
    const status = Number(headerStr.split('\r\n', 1)[0].match(/\s(\d{3})(?:\s|$)/)?.[1] || 0);
    if (status !== 200) {
      const proxyErrorMatch = headerStr.match(/^X-Proxy-Error:\s*([^\r\n]+)/mi);
      const detail = proxyErrorMatch ? ' (' + proxyErrorMatch[1] + ')' : '';
      if (status === 407 || (proxyErrorMatch && /AUTH_FAILED|authentication/i.test(proxyErrorMatch[1]))) {
        throw new Error('Proxy authentication failed' + detail);
      }
      throw new Error('Proxy test tunnel failed with HTTP ' + status + detail);
    }
  } else {
    socket.write(Buffer.from([5, 1, 0])); const greeting = await reader.read(2); if (greeting[1] !== 0) throw new Error('Local SOCKS5 bridge rejected no-auth mode');
    socket.write(Buffer.concat([Buffer.from([5, 1, 0]), encodeSocksAddress(hostname), Buffer.from([port >> 8, port & 255])]));
    const reply = await reader.read(4);
    if (reply[1] !== 0) throw new Error('SOCKS5 proxy test tunnel failed with code ' + reply[1]);
    await readSocksAddress(reader, reply[3]); await reader.read(2);
  }
  const remainder = reader.release(); if (remainder.length) socket.unshift(remainder);
  return socket;
}

function decodeChunked(buffer) {
  const chunks = []; let offset = 0;
  while (offset < buffer.length) {
    const line = buffer.indexOf('\r\n', offset); if (line < 0) throw new Error('Invalid chunked response');
    const size = Number.parseInt(buffer.subarray(offset, line).toString('ascii').split(';')[0], 16); if (!Number.isFinite(size)) throw new Error('Invalid chunk size');
    offset = line + 2; if (size === 0) break;
    // A truncated final chunk would decode into a silently short body; the
    // trailing CRLF after the chunk must be present too.
    if (offset + size + 2 > buffer.length) throw new Error('Invalid chunked response');
    chunks.push(buffer.subarray(offset, offset + size)); offset += size + 2;
  }
  return Buffer.concat(chunks);
}

// Aligned with fetchUrlText's 2 MiB response cap: a probe channel must never
// accumulate an unbounded body while only the 15s timeout holds the line.
const PROBE_RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024;

async function requestProxyHttp(config, hostname, pathname) {
  const bridge = await startAuthenticatedProxy(config); let socket;
  try {
    socket = bridge.protocol === 'http' ? await connectSocket('127.0.0.1', bridge.port) : await connectBridge(bridge, hostname, 80);
    const target = bridge.protocol === 'http' ? 'http://' + hostname + pathname : pathname;
    socket.write('GET ' + target + ' HTTP/1.1\r\nHost: ' + hostname + '\r\nAccept: application/json\r\nAccept-Encoding: identity\r\nConnection: close\r\nUser-Agent: OpenBrowser/2.0\r\n\r\n');
    const chunks = await new Promise((resolve, reject) => {
      const values = [];
      const timer = setTimeout(() => {
        socket.destroy();
        const timeoutErr = new Error('Proxy exit lookup timed out');
        timeoutErr.code = 'probe-unavailable';
        timeoutErr.probeUnavailable = true;
        reject(timeoutErr);
      }, 15000);
      let received = 0;
      socket.on('data', (chunk) => {
        received += chunk.length;
        if (received > PROBE_RESPONSE_LIMIT_BYTES) {
          clearTimeout(timer);
          socket.destroy();
          const sizeErr = new Error('Proxy exit lookup response body too large');
          sizeErr.code = 'probe-unavailable';
          sizeErr.probeUnavailable = true;
          reject(sizeErr);
          return;
        }
        values.push(chunk);
      });
      socket.once('end', () => { clearTimeout(timer); resolve(values); });
      socket.once('error', (error) => { clearTimeout(timer); reject(error); });
      socket.once('close', () => { clearTimeout(timer); reject(new Error('Proxy probe connection closed')); });
    });
    const response = Buffer.concat(chunks); const marker = response.indexOf('\r\n\r\n');
    if (marker < 0) {
      const err = new Error('Invalid proxy exit lookup response');
      err.code = 'probe-unavailable';
      err.probeUnavailable = true;
      throw err;
    }
    const header = response.subarray(0, marker).toString('latin1');
    const proxyErrorMatch = header.match(/^X-Proxy-Error:\s*([^\r\n]+)/mi);
    if (proxyErrorMatch) {
      const err = new Error('Proxy upstream connection failed: ' + proxyErrorMatch[1]);
      err.errorClass = 'unreachable';
      throw err;
    }
    const status = Number(header.split('\r\n', 1)[0].match(/\s(\d{3})(?:\s|$)/)?.[1] || 0);
    let body = response.subarray(marker + 4);
    if (/transfer-encoding:\s*chunked/i.test(header)) {
      try {
        body = decodeChunked(body);
      } catch (chunkErr) {
        const err = new Error('Invalid chunked response: ' + chunkErr.message);
        err.code = 'probe-unavailable';
        err.probeUnavailable = true;
        throw err;
      }
    }
    return { status, body };
  } finally {
    socket?.destroy(); await bridge.close().catch(() => {});
  }
}

async function requestProxyHttps(config, hostname, pathname) {
  const bridge = await startAuthenticatedProxy(config); let socket; let secure;
  try {
    socket = await connectBridge(bridge, hostname, 443);
    secure = tls.connect({ socket, servername: hostname, rejectUnauthorized: true });
    const response = await new Promise((resolve, reject) => {
      const chunks = [];
      const timer = setTimeout(() => {
        secure.destroy();
        const timeoutErr = new Error('HTTPS proxy request timed out');
        timeoutErr.code = 'probe-unavailable';
        timeoutErr.probeUnavailable = true;
        reject(timeoutErr);
      }, 15000);
      const cleanup = () => clearTimeout(timer);
      let received = 0;
      secure.once('secureConnect', () => {
        secure.write('GET ' + pathname + ' HTTP/1.1\r\nHost: ' + hostname + '\r\nAccept: application/json\r\nAccept-Encoding: identity\r\nConnection: close\r\nUser-Agent: OpenBrowser/2.0\r\n\r\n');
      });
      secure.on('data', (chunk) => {
        received += chunk.length;
        if (received > PROBE_RESPONSE_LIMIT_BYTES) {
          cleanup();
          secure.destroy();
          const sizeErr = new Error('HTTPS proxy probe response body too large');
          sizeErr.code = 'probe-unavailable';
          sizeErr.probeUnavailable = true;
          reject(sizeErr);
          return;
        }
        chunks.push(chunk);
      });
      secure.once('end', () => { cleanup(); resolve(Buffer.concat(chunks)); });
      secure.once('error', (error) => { cleanup(); reject(error); });
      secure.once('close', () => { cleanup(); reject(new Error('Proxy probe connection closed')); });
    });
    const marker = response.indexOf('\r\n\r\n');
    if (marker < 0) {
      const err = new Error('Invalid HTTPS proxy response');
      err.code = 'probe-unavailable';
      err.probeUnavailable = true;
      throw err;
    }
    const header = response.subarray(0, marker).toString('latin1');
    const status = Number(header.split('\r\n', 1)[0].match(/\s(\d{3})(?:\s|$)/)?.[1] || 0);
    let body = response.subarray(marker + 4);
    if (/transfer-encoding:\s*chunked/i.test(header)) {
      try {
        body = decodeChunked(body);
      } catch (chunkErr) {
        const err = new Error('Invalid chunked response: ' + chunkErr.message);
        err.code = 'probe-unavailable';
        err.probeUnavailable = true;
        throw err;
      }
    }
    return { status, body };
  } finally {
    secure?.destroy(); socket?.destroy(); await bridge.close().catch(() => {});
  }
}

async function lookupIpPureDirect() {
  const { status, body } = await fetchUrlText('https://my.ippure.com/v1/info', { timeout: 12000 });
  if (status !== 200) throw new Error('risk intelligence lookup returned HTTP ' + status);
  return normalizeIpPureResult(JSON.parse(body));
}

async function lookupIpPureProxy(config) {
  const response = await requestProxyHttps(config, 'my.ippure.com', '/v1/info');
  if (response.status !== 200) throw new Error('risk intelligence proxy lookup returned HTTP ' + response.status);
  return normalizeIpPureResult(JSON.parse(response.body.toString('utf8')));
}

async function enrichWithIpPure(network, lookup) {
  try {
    return attachIpPure(network, await lookup());
  } catch (_) {
    return network;
  }
}

async function raceSettledValues(tasks, { minWaitMs = 0, maxWaitMs = 10000 } = {}) {
  const started = Date.now();
  const results = [];
  const errors = [];
  await Promise.all(tasks.map(async (task) => {
    let timer = null;
    try {
      const timeoutErr = new Error('lookup timed out');
      timeoutErr.code = 'probe-unavailable';
      timeoutErr.probeUnavailable = true;
      const value = await Promise.race([
        task(),
        new Promise((_, reject) => { timer = setTimeout(() => reject(timeoutErr), maxWaitMs); if (timer.unref) timer.unref(); }),
      ]);
      if (value) results.push(value);
    } catch (err) {
      errors.push(err);
    } finally {
      // Losing the race must not leave the maxWait timer alive: six orphaned
      // 11s timers per lookup keep the loop busy for nothing.
      clearTimeout(timer);
    }
  }));
  const elapsed = Date.now() - started;
  if (minWaitMs > elapsed) {
    await new Promise((resolve) => setTimeout(resolve, minWaitMs - elapsed));
  }
  results.errors = errors;
  return results;
}

function extractProxyStrings(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const out = [];
  const push = (value) => {
    const s = String(value || '').trim();
    if (s && !out.includes(s)) out.push(s);
  };
  try {
    const json = JSON.parse(raw);
    const walk = (node, depth = 0) => {
      if (depth > 6 || node == null) return;
      if (typeof node === 'string') {
        push(node);
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node.slice(0, 50)) walk(item, depth + 1);
        return;
      }
      if (typeof node === 'object') {
        const host = node.host || node.ip || node.server || node.hostname;
        const port = node.port;
        const user = node.username || node.user || node.login;
        const pass = node.password || node.pass || node.pwd;
        const protocol = String(node.protocol || node.type || node.schema || 'http').toLowerCase().replace('://', '');
        if (host && port) {
          if (user && pass) push(`${protocol}://${user}:${pass}@${host}:${port}`);
          else push(`${protocol}://${host}:${port}`);
        }
        for (const key of ['proxy', 'proxies', 'data', 'result', 'list', 'items', 'url', 'raw', 'line', 'value', 'content']) {
          if (key in node) walk(node[key], depth + 1);
        }
      }
    };
    walk(json);
  } catch (_) {
    // plain text body
  }
  for (const line of raw.split(/[\r\n,;]+/)) {
    const s = line.trim();
    if (!s || s.startsWith('#') || s.length > 400) continue;
    if (/^(https?|socks5):\/\//i.test(s) || /^[\w.-]+:\d{2,5}(?::[^\s]+)?$/.test(s)) push(s);
  }
  const re = /(?:(?:https?|socks5):\/\/)?(?:[^\s@/:]+:[^\s@/]+@)?[\w.-]+:\d{2,5}/gi;
  let m;
  while ((m = re.exec(raw)) && out.length < 30) push(m[0]);
  return out;
}

async function extractProxyFromApi(url) {
  const { body } = await fetchUrlText(url, { timeout: 20000 });
  const candidates = extractProxyStrings(body);
  const errors = [];
  for (const candidate of candidates.slice(0, 20)) {
    try {
      const config = parseProxy(candidate);
      if (config) return config;
    } catch (error) {
      errors.push(String(error.message || error));
    }
  }
  throw new Error(errors[0] ? ('API 响应无法解析为代理：' + errors[0]) : 'API 响应中未找到代理地址');
}

async function invokeProxyRefresh(url) {
  const started = Date.now();
  const result = await fetchUrlText(url, { timeout: 20000, method: 'GET' });
  return {
    ok: true,
    status: result.status,
    latencyMs: Date.now() - started,
    refreshedAt: new Date().toISOString(),
    preview: String(result.body || '').slice(0, 200),
  };
}

const DEFAULT_PROBE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes default
const DEFAULT_PROBE_CACHE_MAX_ENTRIES = 1000;

class ProbeMemoryCache {
  constructor(maxEntries = DEFAULT_PROBE_CACHE_MAX_ENTRIES) {
    this.maxEntries = Math.max(1, Number(maxEntries) || DEFAULT_PROBE_CACHE_MAX_ENTRIES);
    this.entries = new Map();
  }

  get(key, { allowStale = false } = {}) {
    if (!key) return null;
    const hit = this.entries.get(key);
    if (!hit) return null;
    if (!allowStale && hit.expiresAt <= Date.now()) {
      return null;
    }
    // Refresh recency for LRU eviction
    this.entries.delete(key);
    this.entries.set(key, hit);
    return hit;
  }

  set(key, value, ttlMs) {
    if (!key) return;
    const ttl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : DEFAULT_PROBE_CACHE_TTL_MS;
    this.entries.delete(key);
    this.entries.set(key, {
      value,
      storedAt: Date.now(),
      expiresAt: Date.now() + ttl,
    });
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      this.entries.delete(oldest);
    }
  }

  delete(key) {
    return this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }

  get size() {
    return this.entries.size;
  }
}

const probeMemoryCache = new ProbeMemoryCache();

const providerCooldowns = new Map();
let _probeRotationCounter = 0;

function recordProviderRateLimit(providerName, cooldownMs = 60000) {
  if (providerName) {
    providerCooldowns.set(providerName, Date.now() + cooldownMs);
  }
}

function isProviderCoolingDown(providerName) {
  const until = providerCooldowns.get(providerName);
  if (!until) return false;
  if (Date.now() >= until) {
    providerCooldowns.delete(providerName);
    return false;
  }
  return true;
}

function clearProviderCooldowns() {
  providerCooldowns.clear();
}

function clearProbeCache() {
  probeMemoryCache.clear();
  clearProviderCooldowns();
}

function getProbeCacheStats() {
  return {
    size: probeMemoryCache.size,
    maxEntries: probeMemoryCache.maxEntries,
  };
}

function resolveProbeCacheTtl(options = {}) {
  if (Number.isFinite(options.ttlMs) && options.ttlMs > 0) return options.ttlMs;
  if (Number.isFinite(options.cacheTtlMs) && options.cacheTtlMs > 0) return options.cacheTtlMs;
  const envVal = Number(process.env.OPENBROWSER_PROBE_CACHE_TTL_MS);
  if (Number.isFinite(envVal) && envVal > 0) return envVal;
  return DEFAULT_PROBE_CACHE_TTL_MS;
}

function getProbeCacheKey(config, ipChannel) {
  let protocol = "http";
  let host = "";
  let port = "";
  let username = "";
  let password = "";

  if (typeof config === "string") {
    try {
      const parsed = parseProxy(config);
      if (parsed) {
        protocol = parsed.protocol || "http";
        host = parsed.host || "";
        port = parsed.port || "";
        username = parsed.username || "";
        password = parsed.password || "";
      }
    } catch (_) {
      host = String(config || "").trim();
    }
  } else if (config && typeof config === "object") {
    protocol = String(config.protocol || config.type || "http").toLowerCase();
    host = String(config.host || config.hostname || config.server || config.ip || "").toLowerCase().trim();
    port = String(config.port || "");
    username = String(config.username || config.user || config.login || "");
    password = String(config.password || config.pass || "");
  }

  const channel = normalizeIpLookupChannel(ipChannel);
  if (!port) {
    if (protocol === "socks5") port = "1080";
    else if (protocol === "https") port = "443";
    else port = "80";
  }

  // Include irreversible digest of password to isolate credentials/sessions (e.g. residential proxies)
  // while NEVER storing raw passwords in key/logs.
  const passHash = password ? crypto.createHash("sha256").update(String(password)).digest("hex").slice(0, 16) : "";
  const authPart = username || passHash
    ? `${username ? encodeURIComponent(username) : ""}${passHash ? ":h_" + passHash : ""}@`
    : "";
  return `${protocol}://${authPart}${host}:${port}#channel=${channel}`;
}

function cloneLookupResult(value) {
  if (!value || typeof value !== "object") return value;
  const copy = { ...value };
  if (Array.isArray(value.countries)) copy.countries = [...value.countries];
  if (value.riskIntel && typeof value.riskIntel === "object") copy.riskIntel = { ...value.riskIntel };
  if (value.ipPure && typeof value.ipPure === "object") copy.ipPure = { ...value.ipPure };
  return copy;
}

async function lookupProxyCountry(config, options = {}) {
  const started = Date.now();
  const ipChannel = normalizeIpLookupChannel(options.ipChannel || options.channel);
  const bypassCache = Boolean(options.force || options.refresh);
  const cacheKey = getProbeCacheKey(config, ipChannel);
  const ttlMs = resolveProbeCacheTtl(options);

  if (!bypassCache) {
    const cached = probeMemoryCache.get(cacheKey, { allowStale: false });
    if (cached && cached.value && cached.value.ip) {
      const cloned = cloneLookupResult(cached.value);
      cloned.cached = true;
      cloned.fromCache = true;
      cloned.latencyMs = cached.value.latencyMs ?? (Date.now() - started);
      return cloned;
    }
  }

  try {
    const withSignal = (lookup) => (signal) => lookup({ ...config, probeSignal: signal });
    const richProviders = [
      { name: 'ip-api.com', fn: lookupProxyIpApi },
      { name: 'ipwho.is', fn: lookupProxyIpWho },
      { name: 'ipinfo.io', fn: lookupProxyIpInfo },
      { name: 'ipwhois.app', fn: lookupProxyIpWhoisApp },
      { name: 'freeipapi.com', fn: lookupProxyFreeIpApi },
    ];
    const active = richProviders.filter((p) => !isProviderCoolingDown(p.name));
    const cooling = richProviders.filter((p) => isProviderCoolingDown(p.name));
    const ordered = [...active, ...cooling];
    const fallbackLookups = [
      ...ordered.map((p) => withSignal(p.fn)),
      withSignal(lookupProxyCloudflareTrace),
    ];
    // ifconfig.me is IP-only; keep the existing geo providers in the same
    // request cycle so selecting it does not leave locale/timezone blank.
    const lookups = ipChannel === 'ifconfig-me'
      ? [withSignal(lookupProxyIfconfigMe), ...fallbackLookups]
      : [...fallbackLookups, withSignal(lookupProxyIfconfigMe)];
    const parts = await runProxyProbes(lookups, {
      totalTimeoutMs: options.totalTimeoutMs || 6500,
      attemptTimeoutMs: options.attemptTimeoutMs || 2200,
      
    });

    if (!parts.length) {
      // All lookups failed. Check if any failure was a real proxy link failure.
      const linkError = parts.errors?.find(isProxyLinkError);
      if (linkError) {
        // True proxy link failure -> fail closed
        const err = new Error(linkError.message || String(linkError));
        err.errorClass = classifyProxyError(linkError);
        err.code = linkError.code || err.errorClass;
        err.latencyMs = Date.now() - started;
        throw err;
      }

      // No proxy link errors detected: all failures were probe service issues (429, timeouts, 5xx, parse errors).
      // A 4xx/5xx from a probe service — 429 included — is at most evidence that
      // the service is unhealthy; it is NOT evidence that the tunnel works. The
      // old gate here (any httpStatus >= 400 => "tunnel verified") is gone: only
      // a completed successful round trip through the tunnel in this cycle
      // counts as verification, and in this branch there is none (parts is
      // empty). Reuse of prior data is still allowed below, but it now carries
      // the verification state recorded when that data was last genuinely
      // verified — reuse never upgrades it.
      const staleCached = probeMemoryCache.get(cacheKey, { allowStale: true });
      if (staleCached && staleCached.value && staleCached.value.ip) {
        const reused = cloneLookupResult(staleCached.value);
        reused.cached = true;
        reused.stale = true;
        reused.fromCache = true;
        reused.probeUnavailable = true;
        // Keep the verification state stored with the entry (a real round trip
        // at probe time); stale reuse must not manufacture a fresh one.
        reused.transportVerified = staleCached.value.transportVerified === true;
        reused.transportVerifiedAt = staleCached.value.transportVerifiedAt || null;
        reused.probeWarning = '探测服务不可用（限频/超时），复用此前缓存的探测结果';
        reused.latencyMs = Date.now() - started;
        return reused;
      }

      // 2. Check profile or options for existing exit details
      const fallbackIp = options.exitIp
        || options.previousResult?.ip
        || options.fallback?.ip
        || options.profile?.exitIp
        || config?.exitIp;

      if (fallbackIp && typeof fallbackIp === 'string' && fallbackIp.trim()) {
        const ip = fallbackIp.trim();
        const countryCode = String(
          options.exitCountryCode
          || options.previousResult?.countryCode
          || options.fallback?.countryCode
          || options.profile?.exitCountryCode
          || config?.exitCountryCode
          || ''
        ).toUpperCase().slice(0, 2);

        const fallbackResult = {
          ip,
          country: options.exitCountry || options.previousResult?.country || options.profile?.exitCountry || countryCode || '',
          countryCode,
          countries: countryCode ? [countryCode] : [],
          countryUsage: '',
          countryRegistered: '',
          geoConflict: false,
          countryNote: '',
          region: options.exitRegion || options.previousResult?.region || options.profile?.exitRegion || '',
          city: options.exitCity || options.previousResult?.city || options.profile?.exitCity || '',
          zip: options.exitZip || options.previousResult?.zip || '',
          timezone: options.exitTimezone || options.previousResult?.timezone || options.profile?.exitTimezone || '',
          latitude: options.exitLatitude ?? options.previousResult?.latitude ?? options.profile?.exitLatitude ?? null,
          longitude: options.exitLongitude ?? options.previousResult?.longitude ?? options.profile?.exitLongitude ?? null,
          isp: options.previousResult?.isp || '',
          organization: options.previousResult?.organization || '',
          asn: options.previousResult?.asn || '',
          asName: options.previousResult?.asName || '',
          mobile: Boolean(options.previousResult?.mobile),
          proxy: true,
          hosting: Boolean(options.previousResult?.hosting),
          colo: options.previousResult?.colo || '',
          sourceCount: options.previousResult?.sourceCount || 1,
          checkedAt: new Date().toISOString(),
          ipChannel,
          latencyMs: Date.now() - started,
          networkType: 'proxy',
          fallback: true,
          probeUnavailable: true,
          // Built from stored profile fields with no evidence from this cycle:
          // no probe completed through the tunnel, so this is NOT a fresh
          // verification. If the caller supplied the previously applied network
          // and that was genuinely verified, carry the legacy state through —
          // reuse reports what was true before, it never upgrades.
          transportVerified: options.previousResult?.transportVerified === true,
          transportVerifiedAt: options.previousResult?.transportVerifiedAt || null,
          probeWarning: '探测服务不可用（限频/超时），复用既有配置的出口信息',
        };
        probeMemoryCache.set(cacheKey, fallbackResult, ttlMs);
        return fallbackResult;
      }

      // 3. Truly nothing is known
      const err = new Error('出口探测服务暂时不可用（公开查询源限频或超时），代理链路状态未知');
      err.code = 'probe-unavailable';
      err.errorClass = 'probe-unavailable';
      err.probeUnavailable = true;
      err.latencyMs = Date.now() - started;
      err.probeErrors = parts.errors?.map((e) => e.message || String(e)) || [];
      // The startup gate may still continue on legacy exit info when the tunnel
      // was genuinely verified in a previous cycle and only the probe service
      // is failing now. Carry that evidence on the error; the catch chains
      // (here and in _testProxy) preserve it up to the caller.
      if (options.previousResult?.transportVerified === true) {
        err.transportVerified = true;
        err.transportVerifiedAt = options.previousResult.transportVerifiedAt || null;
      }
      throw err;
    }

    const result = mergeNetworkLookups(parts);
    const latencyMs = Date.now() - started;
    let enriched = {
      ...result,
      ipChannel,
      latencyMs,
      networkType: networkTypeFromLookup(result),
      // At least one provider completed a full 2xx round trip through the
      // tunnel in this cycle — the only event that proves the transport.
      transportVerified: true,
      transportVerifiedAt: new Date().toISOString(),
    };
    if (options.includeRisk === true) enriched = await enrichWithIpPure(enriched, () => lookupIpPureProxy(config));

    probeMemoryCache.set(cacheKey, enriched, ttlMs);
    return enriched;
  } catch (error) {
    const err = new Error(error.message || String(error));
    err.code = error.code || (error.errorClass === 'probe-unavailable' ? 'probe-unavailable' : undefined);
    err.errorClass = error.errorClass || classifyProxyError(error);
    if (error.probeUnavailable) err.probeUnavailable = true;
    if (error.probeErrors) err.probeErrors = error.probeErrors;
    // Preserve verification evidence across the rebuild: a probe-unavailable
    // failure whose transport was verified in an earlier cycle keeps that
    // fact so the startup gate can decide on legacy exit info. Omitting these
    // fields made the "verified before, probe failing now" branch unreachable.
    if (error.transportVerified !== undefined) err.transportVerified = error.transportVerified === true;
    if (error.transportVerifiedAt !== undefined) err.transportVerifiedAt = error.transportVerifiedAt || null;
    err.latencyMs = error.latencyMs ?? (Date.now() - started);
    throw err;
  }
}

/** Field list shared by the direct and proxied ip-api.com lookups. */
const IP_API_FIELDS = 'status,message,country,countryCode,regionName,city,zip,timezone,lat,lon,isp,org,as,asname,mobile,proxy,hosting,query';

async function lookupDirectIpApi() {
  const { status, body } = await fetchUrlText(`http://ip-api.com/json/?fields=${IP_API_FIELDS}`, { timeout: 10000 });
  if (status !== 200) throw new Error('HTTP ' + status);
  return normalizeIpApiResult(JSON.parse(body));
}

async function lookupDirectIpWho() {
  const errors = [];
  for (const url of ['https://ipwho.is/', 'http://ipwho.is/']) {
    try {
      const { status, body } = await fetchUrlText(url, { timeout: 10000 });
      if (status !== 200) throw new Error('HTTP ' + status);
      return normalizeIpWhoResult(JSON.parse(body));
    } catch (error) {
      errors.push(String(error.message || error));
    }
  }
  throw new Error(errors[0] || 'ipwho lookup failed');
}

async function lookupDirectIpInfo() {
  const { status, body } = await fetchUrlText('https://ipinfo.io/json', { timeout: 10000 });
  if (status !== 200) throw new Error('HTTP ' + status);
  return normalizeIpInfoResult(JSON.parse(body));
}

async function lookupDirectIpWhoisApp() {
  const { status, body } = await fetchUrlText('https://ipwhois.app/json/', { timeout: 10000 });
  if (status !== 200) throw new Error('HTTP ' + status);
  return normalizeIpWhoisAppResult(JSON.parse(body));
}

async function lookupDirectFreeIpApi() {
  const { status, body } = await fetchUrlText('https://freeipapi.com/api/json', { timeout: 10000 });
  if (status !== 200) throw new Error('HTTP ' + status);
  return normalizeFreeIpApiResult(JSON.parse(body));
}

async function lookupDirectCloudflareTrace() {
  const { status, body } = await fetchUrlText('https://www.cloudflare.com/cdn-cgi/trace', { timeout: 10000 });
  if (status !== 200) throw new Error('HTTP ' + status);
  return parseCloudflareTrace(body);
}

/** Direct (no proxy) multi-source exit lookup. */
async function lookupDirectCountry() {
  const parts = await raceSettledValues([
    lookupDirectIpApi,
    lookupDirectIpWho,
    lookupDirectIpInfo,
    lookupDirectIpWhoisApp,
    lookupDirectFreeIpApi,
    lookupDirectCloudflareTrace,
  ], { maxWaitMs: 11000 });
  if (!parts.length) throw new Error('本地出口查询失败：所有公开源均不可用');
  const merged = mergeNetworkLookups(parts);
  return enrichWithIpPure({
    ...merged,
    latencyMs: null,
    networkType: networkTypeFromLookup(merged),
    protocol: 'direct',
  }, lookupIpPureDirect);
}

/**
 * Shared skeleton for the proxied exit-IP probe providers: run the tunnel
 * request, translate a non-200 reply into the probe-unavailable error
 * contract (recording the provider cooldown bucket when a rate-limited geo
 * source answers 429), then hand the decoded body to the provider parser.
 */
async function probeProxyProvider({ request, rateLimitProvider, httpErrorPrefix, parse }) {
  const response = await request();
  if (response.status !== 200) {
    if (rateLimitProvider && response.status === 429) {
      recordProviderRateLimit(rateLimitProvider);
    }
    const err = new Error(httpErrorPrefix + response.status);
    err.httpStatus = response.status;
    if (response.status === 429 || (response.status >= 400 && response.status !== 407)) {
      err.code = 'probe-unavailable';
      err.probeUnavailable = true;
    }
    throw err;
  }
  return parse(response.body.toString('utf8'));
}

/** JSON body parser for the geo providers; keeps the legacy parse-failure wording. */
function parseProxyProviderJson(normalize) {
  return (body) => {
    let json;
    try {
      json = JSON.parse(body);
    } catch (parseErr) {
      const err = new Error('Proxy exit lookup JSON parsing failed: ' + parseErr.message);
      err.code = 'probe-unavailable';
      err.probeUnavailable = true;
      throw err;
    }
    return normalize(json);
  };
}

/** HTTPS-first transport with a plain-HTTP fallback when the tunnel itself is healthy. */
function requestProxyHttpsThenHttp(config, hostname, pathname) {
  return requestProxyHttps(config, hostname, pathname).catch((httpsErr) => {
    if (isProxyLinkError(httpsErr)) throw httpsErr;
    return requestProxyHttp(config, hostname, pathname);
  });
}

async function lookupProxyIpApi(config) {
  return probeProxyProvider({
    request: () => requestProxyHttp(config, 'ip-api.com', '/json/?fields=' + IP_API_FIELDS),
    rateLimitProvider: 'ip-api.com',
    httpErrorPrefix: 'Proxy exit lookup returned HTTP ',
    parse: parseProxyProviderJson(normalizeIpApiResult),
  });
}

async function lookupProxyIpWho(config) {
  return probeProxyProvider({
    request: () => requestProxyHttps(config, 'ipwho.is', '/'),
    rateLimitProvider: 'ipwho.is',
    httpErrorPrefix: 'Proxy exit lookup returned HTTP ',
    parse: parseProxyProviderJson(normalizeIpWhoResult),
  });
}

async function lookupProxyIpInfo(config) {
  return probeProxyProvider({
    request: () => requestProxyHttps(config, 'ipinfo.io', '/json'),
    rateLimitProvider: 'ipinfo.io',
    httpErrorPrefix: 'Proxy exit lookup returned HTTP ',
    parse: parseProxyProviderJson(normalizeIpInfoResult),
  });
}

async function lookupProxyIpWhoisApp(config) {
  return probeProxyProvider({
    request: () => requestProxyHttpsThenHttp(config, 'ipwhois.app', '/json/'),
    rateLimitProvider: 'ipwhois.app',
    httpErrorPrefix: 'Proxy exit lookup returned HTTP ',
    parse: parseProxyProviderJson(normalizeIpWhoisAppResult),
  });
}

async function lookupProxyFreeIpApi(config) {
  return probeProxyProvider({
    request: () => requestProxyHttpsThenHttp(config, 'freeipapi.com', '/api/json'),
    rateLimitProvider: 'freeipapi.com',
    httpErrorPrefix: 'Proxy exit lookup returned HTTP ',
    parse: parseProxyProviderJson(normalizeFreeIpApiResult),
  });
}

async function lookupProxyCloudflareTrace(config) {
  return probeProxyProvider({
    request: () => requestProxyHttps(config, 'www.cloudflare.com', '/cdn-cgi/trace'),
    httpErrorPrefix: 'Proxy edge probe returned HTTP ',
    parse: parseCloudflareTrace,
  });
}

async function lookupProxyIfconfigMe(config) {
  return probeProxyProvider({
    request: () => requestProxyHttps(config, 'ifconfig.me', '/ip'),
    httpErrorPrefix: 'ifconfig.me proxy check returned HTTP ',
    parse: normalizeIfconfigMeResult,
  });
}

async function probeProxyTunnel(config, hostname = 'www.google.com', port = 443) {
  const bridge = await startAuthenticatedProxy(config); let socket;
  try {
    socket = await connectBridge(bridge, hostname, port);
    return { hostname, port };
  } finally {
    socket?.destroy(); await bridge.close().catch(() => {});
  }
}

async function probeProxyHttps(config, hostname = 'www.google.com', pathname = '/generate_204', options = {}) {
  const bridge = await startAuthenticatedProxy(config); let socket; let secure;
  try {
    socket = await connectBridge(bridge, hostname, 443);
    const tlsProfile = resolveTlsProfile(options.tlsProfile || config.tlsProfile || 'auto');
    secure = tls.connect(tlsConnectOptionsFromProfile(tlsProfile, { socket, servername: hostname, rejectUnauthorized: true }));
    await new Promise((resolve, reject) => { const timer = setTimeout(() => { secure.destroy(); reject(new Error('Google HTTPS handshake timed out')); }, 15000); secure.once('secureConnect', () => { clearTimeout(timer); resolve(); }); secure.once('error', (error) => { clearTimeout(timer); reject(error); }); });
    const reader = new BufferedReader(secure);
    secure.write('HEAD ' + pathname + ' HTTP/1.1\r\nHost: ' + hostname + '\r\nConnection: close\r\nUser-Agent: OpenBrowser/2.0\r\n\r\n');
    const header = (await reader.readUntil('\r\n\r\n', 65536, 15000)).toString('latin1'); reader.release();
    const status = Number(header.split('\r\n', 1)[0].match(/\s(\d{3})(?:\s|$)/)?.[1] || 0);
    if (status < 200 || status >= 400) throw new Error('Google HTTPS probe returned HTTP ' + status);
    return { hostname, status };
  } finally {
    secure?.destroy(); socket?.destroy(); await bridge.close().catch(() => {});
  }
}

module.exports = {
  parseProxy,
  parseProxyInput,
  chromeProxyEndpoint,
  displayProxy,
  normalizeIpLookupChannel,
  startAuthenticatedProxy,
  startProxyBridge: startAuthenticatedProxy,
  needsProxyBridge,
  startSocks5Bridge,
  retryableSocksError,
  lookupProxyCountry,
  lookupDirectCountry,
  mergeNetworkLookups,
  parseCloudflareTrace,
  normalizeIpInfoResult,
  normalizeIfconfigMeResult,
  probeProxyTunnel,
  probeProxyHttps,
  classifyProxyError,
  networkTypeFromLookup,
  fetchUrlText,
  assertSafeOutboundUrl,
  isBlockedOutboundHostname,
  isCloudMetadataHostname,
  isPrivateOrLocalHostname,
  extractProxyStrings,
  extractProxyFromApi,
  encodeSocksAddress,
  invokeProxyRefresh,
  resolveTlsProfile,
  tlsConnectOptionsFromProfile,
  TLS_PROFILE_PRESETS,
  connectSocket,
  getProxyDohLookup,
  setProxyDohResolver,
  clearProbeCache,
  getProbeCacheStats,
  getProbeCacheKey,
  isProxyLinkError,
  isProbeServiceError,
  ProbeMemoryCache,
  DEFAULT_PROBE_CACHE_TTL_MS,
  normalizeIpWhoisAppResult,
  normalizeFreeIpApiResult,
  recordProviderRateLimit,
  isProviderCoolingDown,
  clearProviderCooldowns,
};
