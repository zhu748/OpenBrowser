'use strict';

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');
const { cleanApiKey, isApiKeyPlaceholder, resolveApiKey } = require('./api-key');
const { ok, fail } = require('./api/responses');
const { resolveAvailablePort } = require('./port-utils');
const { resolveWebSocketDebuggerUrl, createProfileEndpointResolver } = require('./api/devtools');

const MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_API_PORT = 50325;
const AUTH_FAILURE_LOCKOUT_THRESHOLD = 25;
const AUTH_LOCKOUT_BASE_MS = 1000;
const AUTH_LOCKOUT_MAX_MS = 60 * 1000;
const { createApiHandlers } = require('./api/controllers');

function responseHeaders(origin = '', extra = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, api-key, x-api-key';
    headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS';
  }
  return headers;
}

function sendJson(res, status, body, origin = '', extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, responseHeaders(origin, extraHeaders));
  res.end(payload);
}

const { allowedMethodsForPath, resolveApiRoute, validateApiRoutes } = require('./api/route-registry');

function timingSafeStringEqual(left, right) {
  // Hash both sides first: timingSafeEqual requires equal-length buffers, and
  // the early return on length mismatch leaked the key length to an observer.
  const leftDigest = crypto.createHash('sha256').update(String(left)).digest();
  const rightDigest = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      // Destroy the stream: otherwise the peer keeps filling the socket after
      // the 413 and the queued chunks stay resident until the response lands.
      req.destroy();
      const error = new Error('request body too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (_) {
    // Form-encoded bodies: keep duplicate keys instead of collapsing them via
    // fromEntries (ids=a&ids=b&ids=c used to shrink to the last single value,
    // silently truncating batch ops). A repeated key becomes an array, which
    // matches the JSON body path's semantics ({"ids": ["a","b"]}).
    const params = new URLSearchParams(raw);
    const out = {};
    for (const key of new Set(params.keys())) {
      const values = params.getAll(key);
      out[key] = values.length > 1 ? values : values[0];
    }
    return out;
  }
}

/**
 * Local HTTP API for OpenBrowser control plane.
 * Response envelope uses {code,msg,data}.
 */
class LocalApiServer {
  constructor(options = {}) {
    this.host = options.host || '127.0.0.1';
    const configuredPort = options.port === undefined ? DEFAULT_API_PORT : Number(options.port);
    const usable = Number.isInteger(configuredPort) && configuredPort >= 0 && configuredPort <= 65535;
    this.requestedPort = usable ? configuredPort : DEFAULT_API_PORT;
    // A busy port must not take the whole automation stack down with it, so by
    // default we fall back to an OS-assigned one and report the real port back.
    this.allowPortFallback = options.allowPortFallback !== false;
    this.portFallback = null;
    this.port = this.requestedPort;
    this.userDataPath = options.userDataPath || '';
    const cleanedKey = cleanApiKey(options.apiKey);
    this.apiKey = (cleanedKey && !isApiKeyPlaceholder(cleanedKey)) ? cleanedKey : '';
    if (!this.apiKey && this.userDataPath) {
      try {
        const diskKey = resolveApiKey({ userDataPath: this.userDataPath, ignoreEnv: true })?.key;
        if (diskKey && !isApiKeyPlaceholder(diskKey)) this.apiKey = diskKey;
      } catch (_) {}
    }
    if (!this.apiKey) {
      this.apiKey = crypto.randomBytes(32).toString('base64url');
    }
    this.allowedOrigins = new Set(options.allowedOrigins || []);
    this.engine = options.engine;
    this.resolveProfileEndpoint = createProfileEndpointResolver(this.engine);
    this.rpaEngine = options.rpaEngine;
    this.rpaStore = options.rpaStore;
    this.syncBridge = options.syncBridge;
    this.appCenter = options.appCenter;
    this.proxyStore = options.proxyStore;
    this.getVersion = options.getVersion || (() => '1.0.0');
    this.server = null;
    this.startedAt = null;
    // 401 flood backoff: any local process may keep guessing credentials, so
    // consecutive failures escalate into a temporary lockout (max 60s).
    // Accounting is per client address: a single misconfigured client must
    // not lock everyone else out, and the map is pruned so it cannot grow.
    this.authFailuresByPeer = new Map(); // peer -> { count, until }
    this.routeHandlers = Object.freeze({
      ...createApiHandlers({ engine: this.engine, proxyStore: this.proxyStore, rpaEngine: this.rpaEngine,
        rpaStore: this.rpaStore, syncBridge: this.syncBridge, appCenter: this.appCenter,
        resolveProfileEndpoint: this.resolveProfileEndpoint }),
      routeStatus: this.routeStatus.bind(this),
      routeVersion: this.routeVersion.bind(this),
    });
    validateApiRoutes(this.routeHandlers);
  }

  static PEER_LIMIT() { return 512; }

  peerOf(req) {
    return req?.socket?.remoteAddress || 'unknown';
  }

  pruneAuthPeers(now = Date.now()) {
    if (this.authFailuresByPeer.size <= LocalApiServer.PEER_LIMIT()) return;
    for (const [peer, entry] of this.authFailuresByPeer) {
      // Expired (or never-set) lockouts are reclaimable. Stored entries always
      // have count >= 1, so the previous `entry.count === 0` guard never
      // matched anything and pushed pruning into the blind eviction loop
      // below, which could evict an active lockout ahead of stale entries.
      if (!entry.until || entry.until < now) this.authFailuresByPeer.delete(peer);
    }
    while (this.authFailuresByPeer.size > LocalApiServer.PEER_LIMIT()) {
      const oldest = [...this.authFailuresByPeer.entries()]
        .sort((a, b) => (a[1].until || 0) - (b[1].until || 0))[0];
      if (!oldest) break;
      this.authFailuresByPeer.delete(oldest[0]);
    }
  }

  registerAuthFailure(req) {
    const peer = this.peerOf(req);
    const entry = this.authFailuresByPeer.get(peer) || { count: 0, until: 0 };
    entry.count += 1;
    if (entry.count >= AUTH_FAILURE_LOCKOUT_THRESHOLD) {
      const over = entry.count - AUTH_FAILURE_LOCKOUT_THRESHOLD;
      entry.until = Date.now() + Math.min(AUTH_LOCKOUT_MAX_MS, AUTH_LOCKOUT_BASE_MS * (2 ** over));
    }
    this.authFailuresByPeer.set(peer, entry);
    this.pruneAuthPeers();
  }

  registerAuthSuccess(req) {
    this.authFailuresByPeer.delete(this.peerOf(req));
  }

  authLockedOut(req) {
    const entry = this.authFailuresByPeer.get(this.peerOf(req));
    return Boolean(entry?.until && Date.now() < entry.until);
  }

  authOk(req) {
    if (!this.apiKey) return true;
    const auth = String(req.headers.authorization || '');
    const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    // Header-only credential channel: query strings leak into proxy logs and
    // shell history, so api_key/api_token/key URL parameters are not accepted.
    const candidates = [
      req.headers['api-key'],
      req.headers['x-api-key'],
      bearer,
    ];
    const cleanedCandidates = candidates
      .map((candidate) => cleanApiKey(candidate))
      .filter((k) => k && !isApiKeyPlaceholder(k));
    return cleanedCandidates.some((candidate) => timingSafeStringEqual(candidate, this.apiKey));
  }

  setApiKey(newKey) {
    const key = cleanApiKey(newKey);
    if (!key || isApiKeyPlaceholder(key)) return false;
    this.apiKey = key;
    return true;
  }

  allowedOrigin(req) {
    const origin = String(req.headers.origin || '');
    if (!origin) return '';
    return this.allowedOrigins.has(origin) ? origin : null;
  }

  async start() {
    if (this.server) return this.info();
    this.server = http.createServer((req, res) => this.handle(req, res));
    const preferred = await this.preferredListenPort();
    try {
      await this.listenOn(preferred);
    } catch (error) {
      // Someone may have taken the port between the probe and the bind.
      const retryable = error && error.code === 'EADDRINUSE' && this.allowPortFallback && preferred !== 0;
      if (!retryable) {
        await this.releaseServer();
        throw error;
      }
      this.portFallback = { requested: this.requestedPort, port: 0, reason: 'EADDRINUSE' };
      await this.listenOn(0);
      this.portFallback.port = this.port;
    }
    if (this.portFallback) {
      console.warn(`[local-api] port ${this.portFallback.requested} is unavailable (${this.portFallback.reason}); listening on ${this.port}`);
    }
    this.startedAt = Date.now();
    return this.info();
  }

  /**
   * Decide which port to bind. The preferred one is kept while it is reachable,
   * otherwise the helper hands back an OS-assigned port.
   */
  async preferredListenPort() {
    // 0 already means "let the OS decide", so there is nothing to fall back from.
    if (this.requestedPort === 0 || !this.allowPortFallback) return this.requestedPort;
    try {
      const resolved = await resolveAvailablePort(this.requestedPort, { host: this.host });
      if (resolved !== this.requestedPort) {
        this.portFallback = { requested: this.requestedPort, port: resolved, reason: 'in-use' };
      }
      return resolved;
    } catch (_) {
      // A failed probe is not a reason to refuse to start; the bind itself will
      // report a genuinely unusable port.
      return this.requestedPort;
    }
  }

  listenOn(port) {
    return new Promise((resolve, reject) => {
      const server = this.server;
      const onError = (error) => { server.removeListener('listening', onListening); reject(error); };
      const onListening = () => {
        server.removeListener('error', onError);
        const address = server.address();
        if (address && typeof address === 'object' && Number.isFinite(address.port)) this.port = address.port;
        resolve();
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port, this.host);
    });
  }

  async releaseServer() {
    const server = this.server;
    this.server = null;
    if (!server) return;
    await new Promise((resolve) => {
      try { server.close(() => resolve()); } catch (_) { resolve(); }
    });
  }

  async stop() {
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    this.portFallback = null;
    await new Promise((resolve) => {
      server.close(() => resolve());
      // Idle keep-alive sockets keep close() waiting forever, which would hang
      // the quit path while an MCP client is still attached.
      server.closeAllConnections?.();
    });
  }

  info() {
    return {
      host: this.host,
      port: this.port,
      requestedPort: this.requestedPort,
      portFallback: this.portFallback,
      url: `http://${this.host}:${this.port}/`,
      startedAt: this.startedAt,
      apiKeyRequired: Boolean(this.apiKey),
    };
  }

  async handle(req, res) {
    let origin = '';
    try {
      origin = this.allowedOrigin(req);
      if (origin === null) return sendJson(res, 403, fail('origin not allowed', 403));
      if (req.method === 'OPTIONS') return sendJson(res, 204, ok(), origin);
      const url = new URL(req.url || '/', `http://${this.host}:${this.port}`);
      const pathname = url.pathname.replace(/\/+$/, '') || '/';

      const authenticated = this.authOk(req);
      // Loopback clients share an IP address. A broken client's backoff must
      // never reject another client's valid credential.
      if (!authenticated && this.authLockedOut(req)) {
        const entry = this.authFailuresByPeer.get(this.peerOf(req));
        const retryAfterSec = Math.max(1, Math.ceil(((entry?.until || 0) - Date.now()) / 1000));
        return sendJson(res, 429, fail('too many failed attempts, retry later', 429), origin, { 'Retry-After': String(retryAfterSec) });
      }
      // Unauthenticated /status and / reveal only the product name and version.
      // The previous body (port fallback state, key flag, running counts) told
      // any local process how the port fallback landed and whether a key is
      // configured — probe value with no client need behind it (audited as
      // finding 7-2). Legitimate key holders still receive the full body.
      if ((pathname === '/' || pathname === '/status') && !authenticated) {
        return sendJson(res, 200, ok({ name: 'openbrowser-local-api', version: this.getVersion() }));
      }
      if (!authenticated) {
        this.registerAuthFailure(req);
        return sendJson(res, 401, fail('unauthorized', 401), origin, { 'WWW-Authenticate': 'Bearer' });
      }
      this.registerAuthSuccess(req);

      const method = String(req.method || 'GET').toUpperCase();
      const allowedMethods = allowedMethodsForPath(pathname);
      if (allowedMethods && !allowedMethods.includes(method)) {
        return sendJson(
          res,
          405,
          fail(`method ${method} not allowed`, 405),
          origin,
          { Allow: allowedMethods.join(', ') },
        );
      }

      const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await readBody(req) : {};
      const query = Object.fromEntries(url.searchParams.entries());
      // Keep array request bodies as arrays. Object-spreading a batch payload
      // turns it into {"0": ..., "1": ...}, so /api/proxy/create can no
      // longer recognize the direct batch form. Query values still need to be
      // available for compatibility, therefore attach them as non-index keys.
      const input = Array.isArray(body)
        ? Object.assign(body.slice(), query)
        : { ...query, ...(body && typeof body === 'object' ? body : {}) };

      const result = await this.route(method, pathname, input, req);
      if (result === undefined) return sendJson(res, 404, fail('not found', 404), origin);
      // Route-level failures carry an HTTP status as their code (all fail() call sites
      // use 3-digit codes): reflect it in the real HTTP status instead of always 200,
      // so clients and tests can distinguish success from failure without body parsing.
      const resultCode = Number(result && result.code);
      if (Number.isInteger(resultCode) && resultCode >= 400 && resultCode <= 599) {
        return sendJson(res, resultCode, result, origin);
      }
      return sendJson(res, 200, result, origin);
    } catch (error) {
      const status = Number(error.statusCode) || 500;
      return sendJson(res, status, fail(status === 500 ? 'internal error' : error.message, status), origin || '');
    }
  }

  async route(method, pathname, input) {
    // The registry and bound domain controllers share one dispatch contract.
    // A miss preserves undefined -> 404 from handle().
    const handlerName = resolveApiRoute(method, pathname);
    if (!handlerName) return undefined;
    return this.routeHandlers[handlerName]({ method, pathname, input });
  }

  // health / version
  async routeStatus() {
    return ok({
      name: 'openbrowser-local-api',
      version: this.getVersion(),
      ...this.info(),
      runningProfiles: this.engine?.running?.size || 0,
      sync: this.syncBridge?.status?.() || null,
      rpa: this.rpaEngine?.getStatus?.() || null,
      platform: this.engine?.platformPreflightReport?.() || null,
    });
  }

  async routeVersion() {
    return ok({ version: this.getVersion(), soft: 'OpenBrowser' });
  }
}

module.exports = { LocalApiServer, resolveWebSocketDebuggerUrl };
