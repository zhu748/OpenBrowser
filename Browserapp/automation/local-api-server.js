'use strict';

const http = require('http');
const crypto = require('crypto');
const { URL } = require('url');
const { cleanApiKey, isApiKeyPlaceholder, resolveApiKey } = require('./api-key');
const { redactProxyCredentials } = require('./proxy-redact');
const { resolveAvailablePort } = require('./port-utils');

const MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_API_PORT = 50325;
const AUTH_FAILURE_LOCKOUT_THRESHOLD = 25;
const AUTH_LOCKOUT_BASE_MS = 1000;
const AUTH_LOCKOUT_MAX_MS = 60 * 1000;

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

function ok(data = {}, msg = 'success') {
  return { code: 0, msg, data };
}

function fail(msg, code = -1, data = null) {
  return { code, msg: String(msg || 'error'), data };
}

const ROUTE_METHODS = new Map();

function registerRouteMethods(methods, paths) {
  const allowed = Object.freeze(methods.map((method) => String(method).toUpperCase()));
  for (const pathname of paths) ROUTE_METHODS.set(pathname, allowed);
}

registerRouteMethods(['GET'], [
  '/', '/status', '/api/getVersion', '/api/v1/version',
  '/api/v1/user/list', '/api/v2/browser-profile/list', '/api/profiles',
  '/api/v1/user/detail', '/api/v2/browser-profile/detail', '/api/profiles/get', '/api/profile',
  '/api/v1/browser/active', '/api/v2/browser-profile/active', '/api/browser/active',
  '/api/v2/proxy-list/list', '/api/proxy/list',
  '/api/fingerprint', '/api/v1/fingerprint', '/api/isolation/audit', '/api/v1/isolation/audit',
  '/api/v1/application/list', '/api/application/list', '/api/apps',
  '/api/application/recommended', '/api/apps/recommended',
  '/api/extension/list', '/api/extensions', '/api/extension/update', '/api/getExtensionStatus',
  '/api/sync/status', '/api/window-sync/status', '/api/getRpaStatus', '/api/rpa/status',
]);
registerRouteMethods(['POST'], [
  '/api/v1/user/create', '/api/v2/browser-profile/create', '/api/profiles/create',
  '/api/v2/browser-profile/update', '/api/profiles/update',
  '/api/v2/browser-profile/duplicate', '/api/profiles/duplicate',
  '/api/v1/user/delete', '/api/v2/browser-profile/delete', '/api/profiles/delete',
  '/api/v1/browser/start', '/api/v2/browser-profile/start', '/api/browser/start',
  '/api/v1/browser/stop', '/api/v2/browser-profile/stop', '/api/browser/stop',
  '/api/v1/browser/stop-all', '/api/v2/browser-profile/stop-all', '/api/browser/stop-all',
  '/api/v1/browser/open-url', '/api/browser/open-url',
  '/api/v1/browser/screenshot', '/api/browser/screenshot',
  '/api/v2/proxy-list/create', '/api/proxy/create',
  '/api/v2/proxy-list/update', '/api/proxy/update',
  '/api/v2/proxy-list/delete', '/api/proxy/delete',
  '/api/proxy/check', '/api/checkProxy', '/api/proxy/check-profile',
  '/api/extension/assign', '/api/extensions/assign',
  '/api/sync/start', '/api/window-sync/start', '/api/sync/stop', '/api/window-sync/stop',
  '/api/sync/restart', '/api/window-sync/restart', '/api/sync/arrange', '/api/window-sync/arrange',
  '/api/rpa/run', '/api/rpa', '/api/rpav2', '/api/stopRpa', '/api/rpa/stop',
]);
registerRouteMethods(['GET', 'POST'], ['/api/sync/settings', '/api/rpa/plans', '/api/rpa/templates']);
registerRouteMethods(['GET', 'DELETE'], ['/api/rpa/tasks']);
registerRouteMethods(['POST'], ['/api/rpa/tasks/delete']);

function allowedMethodsForPath(pathname) {
  const exact = ROUTE_METHODS.get(pathname);
  if (exact) return exact;
  if (pathname.startsWith('/api/rpa/plans/')) return ['DELETE'];
  if (pathname.startsWith('/api/rpa/tasks/')) return ['GET', 'DELETE'];
  if (pathname.startsWith('/api/rpa/templates/') && pathname.endsWith('/install')) return ['POST'];
  if (pathname.startsWith('/api/rpa/templates/')) return ['GET', 'DELETE'];
  return null;
}

// Command routing table (cmd -> handler), the data behind route(). A plain
// string value serves the path for ANY verb, exactly like the old if/else
// chain branches that carried no method check (the 405 gate in handle()
// has already narrowed the verb per path via ROUTE_METHODS above); an
// object value is verb-specific. Id-in-path RPA routes are prefix entries
// in API_PREFIX_ROUTES and are consulted after the exact lookup, in the
// same order the old chain checked them.
const API_ROUTES = {
  '/': 'routeStatus',
  '/status': 'routeStatus',
  '/api/getVersion': 'routeVersion',
  '/api/v1/version': 'routeVersion',
  '/api/v1/user/list': 'routeProfileList',
  '/api/v2/browser-profile/list': 'routeProfileList',
  '/api/profiles': 'routeProfileList',
  '/api/v1/user/create': 'routeProfileCreate',
  '/api/v2/browser-profile/create': 'routeProfileCreate',
  '/api/profiles/create': 'routeProfileCreate',
  '/api/v2/browser-profile/update': 'routeProfileUpdate',
  '/api/profiles/update': 'routeProfileUpdate',
  '/api/v2/browser-profile/duplicate': 'routeProfileDuplicate',
  '/api/profiles/duplicate': 'routeProfileDuplicate',
  '/api/v1/user/delete': 'routeProfileDelete',
  '/api/v2/browser-profile/delete': 'routeProfileDelete',
  '/api/profiles/delete': 'routeProfileDelete',
  '/api/v1/browser/start': 'routeBrowserStart',
  '/api/v2/browser-profile/start': 'routeBrowserStart',
  '/api/browser/start': 'routeBrowserStart',
  '/api/v1/browser/stop': 'routeBrowserStop',
  '/api/v2/browser-profile/stop': 'routeBrowserStop',
  '/api/browser/stop': 'routeBrowserStop',
  '/api/v1/browser/stop-all': 'routeBrowserStopAll',
  '/api/v2/browser-profile/stop-all': 'routeBrowserStopAll',
  '/api/browser/stop-all': 'routeBrowserStopAll',
  '/api/v1/browser/active': 'routeBrowserActive',
  '/api/v2/browser-profile/active': 'routeBrowserActive',
  '/api/browser/active': 'routeBrowserActive',
  '/api/v1/user/detail': 'routeProfileDetail',
  '/api/v2/browser-profile/detail': 'routeProfileDetail',
  '/api/profiles/get': 'routeProfileDetail',
  '/api/profile': 'routeProfileDetail',
  '/api/v1/browser/open-url': 'routeBrowserOpenUrl',
  '/api/browser/open-url': 'routeBrowserOpenUrl',
  '/api/v1/browser/screenshot': 'routeBrowserScreenshot',
  '/api/browser/screenshot': 'routeBrowserScreenshot',
  '/api/v2/proxy-list/list': 'routeProxyList',
  '/api/proxy/list': 'routeProxyList',
  '/api/v2/proxy-list/create': 'routeProxyCreate',
  '/api/proxy/create': 'routeProxyCreate',
  '/api/v2/proxy-list/update': 'routeProxyUpdate',
  '/api/proxy/update': 'routeProxyUpdate',
  '/api/v2/proxy-list/delete': 'routeProxyDelete',
  '/api/proxy/delete': 'routeProxyDelete',
  '/api/proxy/check': 'routeProxyCheck',
  '/api/checkProxy': 'routeProxyCheck',
  '/api/proxy/check-profile': 'routeProxyCheckProfile',
  '/api/fingerprint': 'routeFingerprint',
  '/api/v1/fingerprint': 'routeFingerprint',
  '/api/isolation/audit': 'routeIsolationAudit',
  '/api/v1/isolation/audit': 'routeIsolationAudit',
  '/api/v1/application/list': 'routeAppList',
  '/api/application/list': 'routeAppList',
  '/api/apps': 'routeAppList',
  '/api/application/recommended': 'routeAppRecommended',
  '/api/apps/recommended': 'routeAppRecommended',
  '/api/extension/list': 'routeExtensionList',
  '/api/extensions': 'routeExtensionList',
  '/api/extension/assign': 'routeExtensionAssign',
  '/api/extensions/assign': 'routeExtensionAssign',
  '/api/extension/update': 'routeExtensionStatus',
  '/api/getExtensionStatus': 'routeExtensionStatus',
  '/api/sync/status': 'routeSyncStatus',
  '/api/window-sync/status': 'routeSyncStatus',
  '/api/sync/start': 'routeSyncStart',
  '/api/window-sync/start': 'routeSyncStart',
  '/api/sync/stop': 'routeSyncStop',
  '/api/window-sync/stop': 'routeSyncStop',
  '/api/sync/restart': 'routeSyncRestart',
  '/api/window-sync/restart': 'routeSyncRestart',
  '/api/sync/arrange': 'routeSyncArrange',
  '/api/window-sync/arrange': 'routeSyncArrange',
  '/api/rpa/run': 'routeRpaRun',
  '/api/rpa': 'routeRpaRun',
  '/api/rpav2': 'routeRpaRun',
  '/api/getRpaStatus': 'routeRpaStatus',
  '/api/rpa/status': 'routeRpaStatus',
  '/api/stopRpa': 'routeRpaStop',
  '/api/rpa/stop': 'routeRpaStop',
  '/api/sync/settings': { GET: 'routeSyncSettingsGet', POST: 'routeSyncSettingsPost' },
  '/api/rpa/plans': { GET: 'routeRpaPlansList', POST: 'routeRpaPlanUpsert' },
  '/api/rpa/tasks': { GET: 'routeRpaTasksList', DELETE: 'routeRpaTasksDelete' },
  '/api/rpa/tasks/delete': { POST: 'routeRpaTasksDelete' },
  '/api/rpa/templates': { GET: 'routeRpaTemplatesList', POST: 'routeRpaTemplatesAction' },
};

// Dynamic (id-in-path) routes: checked after the exact table, mirroring the
// old chain precedence (e.g. DELETE /api/rpa/tasks/delete falls through the
// exact POST-only entry to the tasks prefix and deletes task id 'delete').
const API_PREFIX_ROUTES = [
  { prefix: '/api/rpa/plans/', DELETE: 'routeRpaPlanDelete' },
  { prefix: '/api/rpa/tasks/', GET: 'routeRpaTaskGet', DELETE: 'routeRpaTaskDelete' },
  { prefix: '/api/rpa/templates/', suffix: '/install', POST: 'routeRpaTemplateInstall' },
  { prefix: '/api/rpa/templates/', GET: 'routeRpaTemplateGet', DELETE: 'routeRpaTemplateDelete' },
];

function resolveApiRoute(method, pathname) {
  const exact = Object.prototype.hasOwnProperty.call(API_ROUTES, pathname)
    ? API_ROUTES[pathname]
    : null;
  if (exact) {
    if (typeof exact === 'string') return exact;
    if (Object.prototype.hasOwnProperty.call(exact, method)) return exact[method];
  }
  for (const route of API_PREFIX_ROUTES) {
    if (!pathname.startsWith(route.prefix)) continue;
    if (route.suffix && !pathname.endsWith(route.suffix)) continue;
    if (Object.prototype.hasOwnProperty.call(route, method)) return route[method];
  }
  return null;
}

function decodePathId(value, label) {
  try {
    return decodeURIComponent(String(value || ''));
  } catch (_) {
    const error = new Error(`invalid encoded ${label} id`);
    error.statusCode = 400;
    throw error;
  }
}

function redactProxyRecord(item) {
  if (!item || typeof item !== 'object') return item;
  const safe = { ...item };
  delete safe.raw;
  delete safe.username;
  delete safe.password;
  const protocol = String(item.protocol || 'http').replace(/:$/, '').toLowerCase();
  const host = String(item.host || '').trim();
  const displayHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  const port = Number(item.port) || '';
  const endpoint = host && port ? `${protocol}://${displayHost}:${port}` : '';
  const hasCredentials = Boolean(item.authenticated || item.username || item.password);
  return {
    ...safe,
    chromeUrl: endpoint,
    endpoint,
    credentials_redacted: hasCredentials,
  };
}

/**
 * Strip secrets from a profile before it crosses the local API boundary.
 * API clients are automation tools, not secret vaults: proxy credentials,
 * account passwords, TOTP seeds and cookie jars never belong in responses.
 */
function redactProfileForApi(profile) {
  if (!profile || typeof profile !== 'object') return profile;
  const safe = { ...profile };
  if (typeof safe.proxy === 'string' && safe.proxy) safe.proxy = redactProxyCredentials(safe.proxy);
  if (typeof safe.cookies === 'string') safe.cookies = '';
  if (typeof safe.username === 'string') safe.username = '';
  if (typeof safe.password === 'string') safe.password = '';
  if (typeof safe.totpSecret === 'string') safe.totpSecret = '';
  if (typeof safe.otp === 'string') safe.otp = '';
  if (safe.platform && typeof safe.platform === 'object') {
    safe.platform = { ...safe.platform };
    if (typeof safe.platform.username === 'string') safe.platform.username = '';
    if (typeof safe.platform.password === 'string') safe.platform.password = '';
    if (typeof safe.platform.totpSecret === 'string') safe.platform.totpSecret = '';
    if (typeof safe.platform.otp === 'string') safe.platform.otp = '';
  }
  return safe;
}

function booleanValue(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'off', 'no', 'disabled'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'yes', 'enabled'].includes(normalized)) return true;
  return Boolean(value);
}

function firstDefined(input, keys, fallback = undefined) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(input || {}, key) && input[key] !== undefined) return input[key];
  }
  return fallback;
}

function firstArray(input, keys) {
  for (const key of keys) {
    if (Array.isArray(input?.[key])) return input[key];
  }
  return null;
}

function firstString(input, keys, fallback = '') {
  const value = firstDefined(input, keys, fallback);
  return value == null ? String(fallback) : String(value);
}

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
    const params = new URLSearchParams(raw);
    return Object.fromEntries(params.entries());
  }
}

function parseResolution(value) {
  if (value && typeof value === 'object') {
    return [Number(value.width), Number(value.height)];
  }
  const text = String(value || '').trim();
  const match = text.match(/(\d+)\s*[x×*]\s*(\d+)/i) || text.match(/^(\d+)[,\s]+(\d+)$/);
  if (!match) return [NaN, NaN];
  return [Number(match[1]), Number(match[2])];
}

function parseGeolocation(value) {
  if (value && typeof value === 'object') {
    return [Number(value.latitude ?? value.lat), Number(value.longitude ?? value.lon ?? value.lng)];
  }
  const parts = String(value || '').split(/[,;:\s]+/).map(Number);
  if (parts.length >= 2 && parts.every(Number.isFinite)) return [parts[0], parts[1]];
  return [NaN, NaN];
}

/**
 * Accept both the UI's camelCase profile shape and the MCP/API snake_case
 * shape. The profile engine only understands a few top-level fields
 * (width/height/userAgent/startUrl/note), while the rest live under
 * privacy/privacy.fingerprint. Without this bridge, MCP fields such as
 * start_url, user_agent, resolution or fingerprint were silently dropped.
 */
function normalizeProfileInput(input = {}) {
  const out = { ...input };
  const privacy = { ...(out.privacy && typeof out.privacy === 'object' ? out.privacy : {}) };
  const hasTopLevelFingerprint = Object.prototype.hasOwnProperty.call(out, 'fingerprint');
  const hasPrivacyFingerprint = Object.prototype.hasOwnProperty.call(privacy, 'fingerprint');
  const legacyFingerprintKeys = [
    'webgl_vendor', 'webglVendor', 'webgl_renderer', 'webglRenderer',
    'hardware_concurrency', 'hardwareConcurrency', 'device_memory', 'deviceMemory',
  ];
  const hasLegacyFingerprint = legacyFingerprintKeys.some((key) => Object.prototype.hasOwnProperty.call(out, key));
  const hasFingerprintInput = hasTopLevelFingerprint || hasPrivacyFingerprint || hasLegacyFingerprint;
  let fingerprint = out.fingerprint && typeof out.fingerprint === 'object'
    ? { ...out.fingerprint }
    : (privacy.fingerprint && typeof privacy.fingerprint === 'object' ? { ...privacy.fingerprint } : null);
  const clearFingerprint = out.fingerprint === null || out.privacy?.fingerprint === null;

  if (out.profile_id === undefined && out.profileId !== undefined) out.profile_id = out.profileId;
  if (out.user_id === undefined && out.userId !== undefined) out.user_id = out.userId;
  if (out.start_url !== undefined) out.startUrl = out.start_url;
  if (out.user_agent !== undefined) out.userAgent = out.user_agent;
  if (out.network_mode !== undefined) out.networkMode = out.network_mode;
  if (out.language_code !== undefined) out.languageCode = out.language_code;
  if (out.user_proxy_config === undefined && out.userProxyConfig !== undefined) out.user_proxy_config = out.userProxyConfig;
  if (out.privacy_extra === undefined && out.privacyExtra !== undefined) out.privacy_extra = out.privacyExtra;
  if (typeof out.platform === 'string') out.platform = { type: out.platform };

  const sizeValue = out.resolution ?? out.window_size ?? out.windowSize;
  if (sizeValue !== undefined) {
    const [width, height] = parseResolution(sizeValue);
    if (Number.isFinite(width)) out.width = width;
    if (Number.isFinite(height)) out.height = height;
  }
  if (out.notes !== undefined) out.note = out.notes;
  if (out.privacy_extra && typeof out.privacy_extra === 'object') Object.assign(privacy, out.privacy_extra);

  if (out.timezone !== undefined && String(out.timezone).trim()) {
    privacy.timezone = String(out.timezone).trim();
    privacy.timezoneMode = 'custom';
  }
  if (out.locale !== undefined && String(out.locale).trim()) {
    privacy.uiLanguage = String(out.locale).trim();
    privacy.languageMode = String(out.locale).trim();
  }
  if (out.geolocation !== undefined) {
    const [lat, lon] = parseGeolocation(out.geolocation);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      privacy.latitude = lat;
      privacy.longitude = lon;
      privacy.geoMode = 'custom';
    }
  }
  const webglVendor = firstDefined(out, ['webgl_vendor', 'webglVendor']);
  if (webglVendor !== undefined && String(webglVendor).trim()) {
    fingerprint = fingerprint || {};
    fingerprint.webglVendor = String(webglVendor).trim();
    privacy.webglMeta = 'custom';
  }
  const webglRenderer = firstDefined(out, ['webgl_renderer', 'webglRenderer']);
  if (webglRenderer !== undefined && String(webglRenderer).trim()) {
    fingerprint = fingerprint || {};
    fingerprint.webglRenderer = String(webglRenderer).trim();
    privacy.webglMeta = 'custom';
  }
  const hardwareConcurrency = firstDefined(out, ['hardware_concurrency', 'hardwareConcurrency']);
  if (hardwareConcurrency !== undefined) {
    const n = Number(hardwareConcurrency);
    if (Number.isFinite(n)) {
      fingerprint = fingerprint || {};
      privacy.cores = n;
      fingerprint.hardwareConcurrency = n;
    }
  }
  const deviceMemory = firstDefined(out, ['device_memory', 'deviceMemory']);
  if (deviceMemory !== undefined) {
    const n = Number(deviceMemory);
    if (Number.isFinite(n)) {
      fingerprint = fingerprint || {};
      privacy.memory = n;
      fingerprint.deviceMemory = n;
    }
  }
  const doNotTrack = firstDefined(out, ['do_not_track', 'doNotTrack']);
  if (doNotTrack !== undefined) {
    const enabled = doNotTrack === true || doNotTrack === 'on' || doNotTrack === '1';
    privacy.dnt = enabled;
    privacy.dntMode = enabled ? 'on' : 'off';
  }

  if (clearFingerprint) {
    fingerprint = null;
    delete privacy.fingerprint;
  }
  if (hasFingerprintInput && fingerprint) {
    out.fingerprint = fingerprint;
    privacy.fingerprint = fingerprint;
  } else if (clearFingerprint) {
    delete out.fingerprint;
    delete privacy.fingerprint;
  } else {
    delete out.fingerprint;
  }
  out.privacy = privacy;
  out.__clearFingerprint = clearFingerprint;
  return out;
}

function normalizeProxyInput(input = {}) {
  const out = { ...input };
  if (out.refreshUrl === undefined && out.refresh_url !== undefined) out.refreshUrl = out.refresh_url;
  if (out.ipChannel === undefined && out.ip_channel !== undefined) out.ipChannel = out.ip_channel;
  if (out.proxyAuthAction === undefined && out.proxy_auth_action !== undefined) out.proxyAuthAction = out.proxy_auth_action;
  return out;
}

function normalizeRpaInput(input = {}) {
  const out = { ...input };
  const aliases = [
    ['profile_id', 'profileId'], ['user_id', 'userId'],
    ['profile_ids', 'profileIds'], ['user_ids', 'userIds'],
    ['plan_id', 'planId'], ['task_id', 'taskId'], ['template_id', 'templateId'],
    ['process_name', 'processName'], ['plan_name', 'planName'], ['save_as', 'saveAs'],
  ];
  for (const [snakeCase, camelCase] of aliases) {
    if (out[snakeCase] === undefined && out[camelCase] !== undefined) out[snakeCase] = out[camelCase];
  }
  return out;
}

function readProxyAssociation(input = {}) {
  const source = input && typeof input.profile === 'object' ? { ...input, ...input.profile } : input;
  const keys = ['proxy_id', 'proxy_library_id', 'proxyId', 'proxyLibraryId'];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source || {}, key)) {
      return { present: true, value: source[key] == null ? '' : String(source[key]).trim() };
    }
  }
  const hasExplicitManualProxy = ['proxy', 'user_proxy_config', 'userProxyConfig', 'network_mode', 'networkMode']
    .some((key) => Object.prototype.hasOwnProperty.call(source || {}, key));
  if (!hasExplicitManualProxy && source?.proxyMeta && typeof source.proxyMeta === 'object') {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source.proxyMeta, key)) {
        const value = source.proxyMeta[key];
        return { present: true, value: value == null ? '' : String(value).trim() };
      }
    }
  }
  return { present: false, value: '' };
}

function proxySummary(profile, proxyStore, explicitProxyId = undefined) {
  const proxyMeta = profile?.proxyMeta && typeof profile.proxyMeta === 'object' ? profile.proxyMeta : {};
  const profileProxyId = profile?.proxyId
    ?? profile?.proxy_id
    ?? profile?.proxyLibraryId
    ?? profile?.proxy_library_id;
  const metaProxyId = proxyMeta.proxyId
    ?? proxyMeta.proxy_id
    ?? proxyMeta.proxyLibraryId
    ?? proxyMeta.proxy_library_id;
  const proxyId = explicitProxyId === undefined
    ? String((profileProxyId !== undefined ? profileProxyId : metaProxyId) || '').trim()
    : String(explicitProxyId || '').trim();
  if (proxyId) {
    const summary = {
      proxy_id: proxyId,
      proxy_library_id: proxyId,
      proxy_status: proxyStore?.get(proxyId) ? 'linked' : 'missing',
    };
    return {
      ...summary,
      proxy: {
        id: proxyId,
        proxyId,
        proxy_id: proxyId,
        proxy_library_id: proxyId,
        status: summary.proxy_status,
      },
    };
  }
  const summary = {
    proxy_id: null,
    proxy_library_id: null,
    proxy_status: profile?.networkMode === 'proxy' ? 'manual' : 'direct',
  };
  return {
    ...summary,
    proxy: {
      id: null,
      proxyId: null,
      proxy_id: null,
      proxy_library_id: null,
      status: summary.proxy_status,
    },
  };
}

async function resolveWebSocketDebuggerUrl(port, profileId) {
  if (!port) return null;
  const fallback = `ws://127.0.0.1:${port}/devtools/browser/${profileId || 'default'}`;
  try {
    const cdp = require('../cdp');
    const ws = await Promise.race([
      cdp.browserSocket(port),
      new Promise((_, reject) => setTimeout(() => reject(new Error('cdp version timeout')), 1500)),
    ]);
    if (typeof ws === 'string' && ws.startsWith('ws://')) {
      return ws;
    }
  } catch (_) {}
  return fallback;
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
  }

  static PEER_LIMIT() { return 512; }

  peerOf(req) {
    return req?.socket?.remoteAddress || 'unknown';
  }

  pruneAuthPeers(now = Date.now()) {
    if (this.authFailuresByPeer.size <= LocalApiServer.PEER_LIMIT()) return;
    for (const [peer, entry] of this.authFailuresByPeer) {
      if (entry.until < now && entry.count === 0) this.authFailuresByPeer.delete(peer);
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

      if (this.authLockedOut(req)) {
        const entry = this.authFailuresByPeer.get(this.peerOf(req));
        const retryAfterSec = Math.max(1, Math.ceil(((entry?.until || 0) - Date.now()) / 1000));
        return sendJson(res, 429, fail('too many failed attempts, retry later', 429), origin, { 'Retry-After': String(retryAfterSec) });
      }
      // Unauthenticated /status and / reveal only the product name and version.
      // The previous body (port fallback state, key flag, running counts) told
      // any local process how the port fallback landed and whether a key is
      // configured — probe value with no client need behind it (audited as
      // finding 7-2). Legitimate key holders still receive the full body.
      if ((pathname === '/' || pathname === '/status') && !this.authOk(req)) {
        return sendJson(res, 200, ok({ name: 'openbrowser-local-api', version: this.getVersion() }));
      }
      if (!this.authOk(req)) {
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
    // Lookup-table dispatch: API_ROUTES / API_PREFIX_ROUTES (module scope,
    // right after allowedMethodsForPath) map every command onto a handler
    // method, replacing the if/else chain that used to live here. A miss
    // keeps the old fall-through: undefined -> 404 from handle().
    const handlerName = resolveApiRoute(method, pathname);
    if (!handlerName) return undefined;
    return this[handlerName]({ method, pathname, input });
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

  // ---- profiles (v1-style) ----
  // debug_port / ws in this listing hand out every running profile's CDP port.
  // The CDP endpoint itself carries no authentication, so the whole surface
  // leans on the premise that debug ports are only ever bound to 127.0.0.1
  // (engine start: --remote-debugging-address=127.0.0.1). Keep that binding
  // intact when touching the launch flags, or this route becomes a full
  // control-plane disclosure for any process holding the API key.
  async routeProfileList() {
    const list = this.engine.status().map((item) => ({
      id: item.id,
      user_id: item.id,
      profile_id: item.id,
      name: item.name,
      title: item.title || item.name,
      number: item.number,
      status: item.running ? 'Active' : 'Inactive',
      ws: item.port ? { puppeteer: `ws://127.0.0.1:${item.port}/devtools/browser/${item.id}`, selenium: `127.0.0.1:${item.port}` } : null,
      debug_port: item.port || null,
      ...proxySummary(item, this.proxyStore),
    }));
    return ok({ list, page: 1, page_size: list.length });
  }

  async routeProfileCreate({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    let body = normalizeProfileInput(input && typeof input.profile === 'object' ? { ...input, ...input.profile } : input);
    const association = this.resolveProxyAssociation(input, body);
    const hasManualProxyConfiguration = !association.present && [
      'proxy', 'user_proxy_config', 'network_mode', 'networkMode',
    ].some((key) => Object.prototype.hasOwnProperty.call(body || {}, key));
    if (association.present) body = { ...body, ...association.patch };
    const existingIds = new Set(this.engine.profiles ? [...this.engine.profiles.keys()] : []);
    let id = firstString(body, ['user_id', 'userId', 'profile_id', 'profileId', 'id']).trim();
    if (!id) {
      do { id = 'ob-' + Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex'); } while (existingIds.has(id));
    }
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return fail('invalid profile id', 400);
    if (existingIds.has(id)) return fail('profile already exists', 409);
    const numbers = this.engine.profiles ? [...this.engine.profiles.values()].map((item) => Number(item.number)).filter((n) => Number.isInteger(n) && n > 0) : [];
    const number = Number.isInteger(Number(body.number)) && Number(body.number) > 0 ? Number(body.number) : ((Math.max(0, ...numbers) || 0) + 1);
    const rawProxy = String(body.proxy || '').trim();
    const userProxy = body.user_proxy_config && typeof body.user_proxy_config === 'object' ? body.user_proxy_config : {};
    const proxyType = String(userProxy.proxy_type || 'http').toLowerCase();
    const proxyHost = String(userProxy.proxy_host || '').trim();
    const proxyPort = String(userProxy.proxy_port || '').trim();
    const proxyUser = String(userProxy.proxy_user || '');
    const proxyPassword = String(userProxy.proxy_password || '');
    const proxy = rawProxy || (proxyHost && proxyPort ? (proxyType === 'socks' ? 'socks5' : proxyType) + '://' + (proxyUser ? encodeURIComponent(proxyUser) + ':' + encodeURIComponent(proxyPassword) + '@' : '') + proxyHost + ':' + proxyPort : 'Direct');
    const profile = {
      ...body,
      id, number,
      name: String(body.name || body.title || ('Environment ' + number)),
      title: String(body.title || body.name || ('Environment ' + number)),
      language: String(body.language || 'en-US'),
      networkMode: body.networkMode || (/^(direct|offline|none)$/i.test(proxy) ? 'direct' : 'proxy'),
      proxy,
      privacy: {
        ...(body.privacy && typeof body.privacy === 'object' ? body.privacy : {}),
      },
    };
    // The engine's sanitizer may still reject structurally odd profiles (e.g. a
    // non-string name slipped past String() coercion). Surface that as a 400
    // request error rather than an internal 500 from syncProfiles' throw.
    let created;
    try {
      created = this.engine.sanitizeProfile(profile);
      created = this.normalizeProxyAssociationState(created, association.present
        ? association
        : (hasManualProxyConfiguration ? { present: true, value: '' } : association));
      await this.engine.syncProfiles([created]);
    } catch (error) {
      return fail(`invalid profile: ${error.message}`, 400);
    }
    if (typeof this.engine.persist === 'function') await this.engine.persist();
    created = this.engine.profiles.get(id) || created;
    return ok({ user_id: id, profile_id: id, id, ...proxySummary(created, this.proxyStore), profile: redactProfileForApi(created) });
  }

  async routeProfileUpdate({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const current = this.engine.profiles.get(id);
    if (!current) return fail('profile not found', 404);
    const clearFingerprint = Boolean(input.__clearFingerprint) || input.fingerprint === null || input.privacy?.fingerprint === null;
    let body = normalizeProfileInput(input);
    const association = this.resolveProxyAssociation(input, current);
    const hasManualProxyPatch = !association.present && (
      Object.prototype.hasOwnProperty.call(input || {}, 'proxy')
      || Object.prototype.hasOwnProperty.call(input || {}, 'user_proxy_config')
      || Object.prototype.hasOwnProperty.call(input || {}, 'userProxyConfig')
      || Object.prototype.hasOwnProperty.call(input || {}, 'network_mode')
      || Object.prototype.hasOwnProperty.call(input || {}, 'networkMode')
    );
    if (association.present) body = { ...body, ...association.patch };
    else if (hasManualProxyPatch) {
      const rawProxy = String(input?.proxy || '').trim();
      const directRequested = String(input?.network_mode ?? input?.networkMode ?? '').toLowerCase() === 'direct'
        || /^(direct|offline|none)$/i.test(rawProxy);
      body = {
        ...body,
        ...(directRequested && !rawProxy ? { proxy: 'Direct' } : {}),
        networkMode: directRequested ? 'direct' : 'proxy',
        proxyId: null,
        proxyMeta: this.proxyMetaWithAssociation(current.proxyMeta, null),
      };
    }
    const allowed = new Set([
      'name', 'title', 'number', 'language', 'proxy', 'networkMode', 'startUrl', 'os', 'platform',
      'browser', 'userAgent', 'resolution', 'windowSize', 'timezone', 'locale', 'languageCode',
      'geolocation', 'webglVendor', 'webglRenderer', 'hardwareConcurrency', 'deviceMemory', 'doNotTrack',
      'privacy', 'fingerprint', 'user_proxy_config', 'note', 'width', 'height', 'advanced',
      'proxyMeta', 'tag', 'groupId', 'group_name',
      'proxyId',
    ]);
    const patch = {};
    for (const [key, value] of Object.entries(body)) {
      if (!allowed.has(key)) continue;
      if (key === 'startUrl' && value !== undefined) patch.startUrl = value;
      else if (key === 'userAgent' && value !== undefined) patch.userAgent = value;
      else if (key === 'windowSize' && value !== undefined) patch.windowSize = value;
      else if (key === 'networkMode' && value !== undefined) patch.networkMode = value;
      else if (key === 'languageCode' && value !== undefined) patch.languageCode = value;
      else if (key === 'privacy' && value !== undefined) {
        const next = { ...(current.privacy || {}), ...(value && typeof value === 'object' ? value : {}) };
        if (clearFingerprint) delete next.fingerprint;
        patch.privacy = next;
      }
      else if (key === 'platform' && value && typeof value === 'object') patch.platform = { ...(current.platform || {}), ...value };
      else if (key === 'advanced' && value && typeof value === 'object') patch.advanced = { ...(current.advanced || {}), ...value };
      else if (key === 'proxyMeta' && value && typeof value === 'object') patch.proxyMeta = { ...(current.proxyMeta || {}), ...value };
      else if (key === 'user_proxy_config' && value && typeof value === 'object') {
        const { proxy_type, proxy_host, proxy_port, proxy_user, proxy_password } = value;
        if (proxy_host && proxy_port) {
          const type = String(proxy_type || 'http').toLowerCase();
          patch.proxy = (type === 'socks' ? 'socks5' : type) + '://' +
            (proxy_user ? encodeURIComponent(proxy_user) + ':' + encodeURIComponent(proxy_password || '') + '@' : '') +
            proxy_host + ':' + proxy_port;
          patch.networkMode = 'proxy';
        }
      }
      else if (key === 'fingerprint' && value && typeof value === 'object') patch.fingerprint = { ...value };
      else if (key !== 'profile_id' && key !== 'user_id' && key !== 'id') patch[key] = value;
    }
    if (clearFingerprint) {
      delete patch.fingerprint;
      if (!Object.prototype.hasOwnProperty.call(patch, 'privacy')) {
        const nextPrivacy = { ...(current.privacy || {}) };
        delete nextPrivacy.fingerprint;
        patch.privacy = nextPrivacy;
      }
    }
    const mergedProfile = { ...current, ...patch, id };
    if (clearFingerprint) {
      // Older callers/tests may still carry a duplicated top-level
      // fingerprint alongside privacy.fingerprint. Remove both copies so a
      // reset cannot be undone by the merge before sanitization.
      delete mergedProfile.fingerprint;
      if (mergedProfile.privacy && typeof mergedProfile.privacy === 'object') {
        delete mergedProfile.privacy.fingerprint;
      }
    }
    const next = this.engine.sanitizeProfile(mergedProfile);
    this.normalizeProxyAssociationState(next, association.present
      ? association
      : (hasManualProxyPatch ? { present: true, value: '' } : association));
    this.engine.profiles.set(id, next);
    // syncProfiles() invalidates the status snapshot on every other mutation
    // path; this direct set must match it or the renderer keeps serving a
    // stale cache until an unrelated status emit happens.
    this.engine.invalidateStatusCache?.();
    if (typeof this.engine.persist === 'function') await this.engine.persist();
    const profile = this.engine.profiles.get(id);
    return ok({
      profile_id: id,
      ...proxySummary(profile, this.proxyStore, association.present ? association.value : undefined),
      profile: redactProfileForApi(profile),
    });
  }

  async routeProfileDuplicate({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const duplicateInput = normalizeProfileInput(input);
    const sourceId = firstString(duplicateInput, ['source_profile_id', 'sourceProfileId', 'profile_id', 'profileId', 'user_id', 'userId', 'id']).trim();
    if (!sourceId) return fail('source profile id required', 400);
    const source = this.engine.profiles.get(sourceId);
    if (!source) return fail('source profile not found', 404);
    const numbers = [...this.engine.profiles.values()].map((item) => Number(item.number)).filter((n) => Number.isInteger(n) && n > 0);
    const number = (Math.max(0, ...numbers) || 0) + 1;
    const id = 'ob-' + Date.now().toString(36) + '-' + crypto.randomBytes(5).toString('hex');
    const base = this.engine.sanitizeProfile(source);
    const requestedStartUrl = duplicateInput.startUrl !== undefined
      ? String(duplicateInput.startUrl || '').trim()
      : null;
    const next = this.engine.sanitizeProfile({
      ...base,
      id,
      number,
      name: String(duplicateInput.name || (base.name ? base.name + ' Copy' : 'Environment ' + number)),
      title: String(duplicateInput.name || base.title || base.name || ('Environment ' + number)),
      startUrl: requestedStartUrl === null ? base.startUrl : requestedStartUrl,
      profileId: id,
      cookies: '',
      username: '',
      password: '',
      totpSecret: '',
      otp: '',
      exitCheckedAt: undefined,
      exitNetwork: undefined,
      platform: {
        ...(base.platform || {}),
        ...(requestedStartUrl === null ? {} : { startUrl: requestedStartUrl }),
        username: '',
        password: '',
        totpSecret: '',
        otp: '',
      },
      advanced: {
        ...(base.advanced || {}),
        ...(requestedStartUrl === null ? {} : { startUrls: requestedStartUrl }),
      },
      privacy: {
        ...(base.privacy || {}),
        fingerprint: undefined,
        batterySnapshot: undefined,
        mediaLabels: undefined,
      },
    });
    await this.engine.syncProfiles([next]);
    if (typeof this.engine.persist === 'function') await this.engine.persist();
    return ok({ profile_id: id, profile: redactProfileForApi(this.engine.profiles.get(id) || next) });
  }

  async routeProfileDelete({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const rawIds = firstArray(input, ['user_ids', 'userIds', 'profile_ids', 'profileIds', 'ids'])
      || [firstDefined(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id'])];
    const ids = rawIds.map((value) => String(value || '').trim()).filter(Boolean);
    if (!ids.length) return fail('profile id required', 400);
    let result;
    try {
      const deleteData = input.delete_data !== undefined
        ? booleanValue(input.delete_data, true)
        : booleanValue(input.deleteData, true);
      result = await this.engine.deleteProfiles(ids, deleteData);
    } catch (error) {
      // e.g. isolation root validation rejection while removing profile data —
      // surface as a request error, not an internal 500.
      return fail(`delete failed: ${error.message}`, 400);
    }
    return ok(result);
  }

  async routeBrowserStart({ input }) {
    const id = firstString(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id']);
    const profile = this.engine.profiles.get(id);
    if (!profile) return fail('profile not found', 404);
    const started = await this.engine.start(profile);
    const port = started?.port || this.engine.running?.get(id)?.port || null;
    const puppeteerWs = port ? await resolveWebSocketDebuggerUrl(port, id) : null;
    return ok({
      user_id: id,
      profile_id: id,
      debug_port: port,
      ws: {
        puppeteer: puppeteerWs,
      },
    });
  }

  async routeBrowserStop({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id']).trim();
    if (!id) return fail('profile id required', 400);
    if (!this.engine.profiles?.has(id)) return fail('profile not found', 404);
    await this.engine.stop(id);
    return ok({ user_id: id, profile_id: id });
  }

  async routeBrowserStopAll() {
    await this.engine.stopAll();
    return ok({ stopped: true });
  }

  async routeBrowserActive() {
    const active = this.engine.status().filter((item) => item.running).map((item) => ({
      user_id: item.id,
      debug_port: item.port,
      profile_directory: item.profileDirectory || null,
    }));
    return ok({ list: active });
  }

  async routeProfileDetail({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const profile = this.engine.profiles?.get(id);
    if (!profile) return fail('profile not found', 404);
    const running = this.engine.running?.get(id);
    return ok({
      profile_id: id,
      user_id: id,
      name: profile.name,
      title: profile.title,
      status: running ? 'Active' : 'Inactive',
      debug_port: running?.port || null,
      ws: running?.port ? { puppeteer: await resolveWebSocketDebuggerUrl(running.port, id), selenium: '127.0.0.1:' + running.port } : null,
      profile: redactProfileForApi(profile),
      ...proxySummary(profile, this.proxyStore),
    });
  }

  async routeBrowserOpenUrl({ input }) {
    if (!this.engine) return fail('browser engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    const rawUrl = firstString(input, ['url', 'target_url', 'targetUrl', 'start_url', 'startUrl']);
    if (!id) return fail('profile id required', 400);
    if (!rawUrl) return fail('url required', 400);
    let targetUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl) && !/^about:/i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    const runningItem = this.engine.running?.get(id);
    const cdp = require('../cdp');
    if (runningItem?.port) {
      try {
        await cdp.navigate(runningItem.port, targetUrl);
        return ok({ profile_id: id, url: targetUrl, navigated: true });
      } catch (error) {
        return fail('navigate failed: ' + error.message, 500);
      }
    }
    const profile = this.engine.profiles?.get(id);
    if (!profile) return fail('profile not found', 404);
    const started = await this.engine.start({ ...profile, startUrl: targetUrl });
    const port = started?.port || null;
    const puppeteerWs = port ? await resolveWebSocketDebuggerUrl(port, id) : null;
    return ok({
      profile_id: id,
      url: targetUrl,
      started: true,
      debug_port: port,
      ws: port ? { puppeteer: puppeteerWs } : null,
    });
  }

  async routeBrowserScreenshot({ input }) {
    if (!this.engine) return fail('browser engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const runningItem = this.engine.running?.get(id);
    if (!runningItem?.port) return fail('profile is not running', 400);
    const cdp = require('../cdp');
    try {
      const tab = await cdp.firstTab(runningItem.port);
      if (!tab) return fail('no active tab in profile', 404);
      const format = String(input.format || 'png').toLowerCase();
      const shot = await cdp.call(tab.webSocketDebuggerUrl, 'Page.captureScreenshot', { format: format === 'jpeg' ? 'jpeg' : 'png' }, 15000);
      if (!shot?.data) return fail('failed to capture screenshot', 500);
      return ok({
        profile_id: id,
        format: format === 'jpeg' ? 'jpeg' : 'png',
        data: shot.data,
      });
    } catch (error) {
      return fail('screenshot failed: ' + error.message, 500);
    }
  }

  // ---- proxy library ----
  async routeProxyList({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    const list = this.proxyStore.list(input).map(redactProxyRecord);
    return ok({ list, page: 1, page_size: list.length });
  }

  async routeProxyCreate({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    if (Array.isArray(input) || Array.isArray(input.data)) {
      const body = Array.isArray(input) ? input : input.data;
      return ok({ list: await this.proxyStore.createMany(body.map(normalizeProxyInput)) });
    }
    return ok(await this.proxyStore.create(normalizeProxyInput(input)));
  }

  async routeProxyUpdate({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    const id = String(input.proxy_id || input.proxy_library_id || input.proxyId || input.proxyLibraryId || input.id || '');
    if (!id) return fail('id required', 400);
    return ok(await this.proxyStore.update(id, normalizeProxyInput(input)));
  }

  async routeProxyDelete({ input }) {
    if (!this.proxyStore) return fail('proxy store unavailable', 503);
    const ids = firstArray(input, ['proxy_ids', 'proxyIds', 'proxy_library_ids', 'proxyLibraryIds', 'proxy_id', 'proxyId', 'ids'])
      || [firstDefined(input, ['id', 'proxy_id', 'proxyId', 'proxy_library_id', 'proxyLibraryId'])];
    return ok(await this.proxyStore.remove(ids.filter(Boolean)));
  }

  async routeProxyCheck({ input }) {
    if (!this.proxyStore || !this.engine) return fail('proxy check unavailable', 503);
    const id = String(input.proxy_id || input.proxy_library_id || input.proxyId || input.proxyLibraryId || input.id || '');
    const item = id ? this.proxyStore.get(id) : null;
    const raw = item?.raw || input.proxy || input.raw;
    if (!raw) return fail('proxy required', 400);
    const ipChannel = firstString(input, ['ip_channel', 'ipChannel'], 'ip-api');
    try {
      const result = await this.engine.testProxy({ id: 'proxy-check', name: 'proxy-check', proxy: raw, proxyMeta: { ipChannel: item?.ipChannel || ipChannel } });
      if (item) await this.proxyStore.markCheck(item.id, result);
      return ok(result);
    } catch (err) {
      return fail('proxy check failed: ' + (err?.message || err), 400);
    }
  }

  async routeProxyCheckProfile({ input }) {
    if (!this.engine) return fail('profile engine unavailable', 503);
    const id = firstString(input, ['profile_id', 'profileId', 'user_id', 'userId', 'id']);
    if (!id) return fail('profile id required', 400);
    const profile = this.engine.profiles.get(id);
    if (!profile) return fail('profile not found', 404);
    try {
      const result = await this.engine.checkProxy(profile, { allowExtract: false, persist: true });
      return ok(result);
    } catch (err) {
      return fail('check-profile failed: ' + (err?.message || err), 400);
    }
  }

  // ---- fingerprint / isolation ----
  async routeFingerprint({ input }) {
    const id = firstString(input, ['user_id', 'userId', 'profile_id', 'profileId', 'id']);
    if (!id) return fail('profile_id required', 400);
    try {
      return ok(this.engine.fingerprintFor(id));
    } catch (error) {
      return fail(error.message, 400);
    }
  }

  async routeIsolationAudit() {
    return ok(this.engine.isolationAudit());
  }

  // ---- application center ----
  async routeAppList({ input }) {
    if (!this.appCenter) return fail('app center unavailable', 503);
    return ok(this.appCenter.list(input));
  }

  async routeAppRecommended() {
    if (!this.appCenter) return fail('app center unavailable', 503);
    return ok({ list: this.appCenter.recommended() });
  }

  async routeExtensionList() {
    return ok({ list: this.engine.listExtensions() });
  }

  async routeExtensionAssign({ input }) {
    const extensionId = firstString(input, ['extension_id', 'extensionId', 'id']);
    const ids = this.parseIds(input);
    const enabled = booleanValue(input.enabled, true);
    if (!extensionId || !ids.length) return fail('extension_id and profile_ids required', 400);
    await this.engine.assignExtension(extensionId, ids, enabled);
    return ok({ extension_id: extensionId, profile_ids: ids, enabled });
  }

  async routeExtensionStatus() {
    return ok({ list: this.engine.listExtensions() });
  }

  // ---- window sync ----
  async routeSyncStatus() {
    return ok(this.syncBridge.status());
  }

  async routeSyncStart({ input }) {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    if (Object.prototype.hasOwnProperty.call(input || {}, 'settings')) {
      return fail('sync settings must be updated through /api/sync/settings', 400);
    }
    let ids;
    try {
      ids = this.parseIds(input);
    } catch (err) {
      return fail('invalid profile ids: ' + (err?.message || err), 400);
    }
    if (input.operate) this.syncBridge.updateOperateList(input.operate);
    try {
      const result = await this.syncBridge.start(ids, {
        tile: booleanValue(input.tile, true),
        cascade: booleanValue(input.cascade, false),
      });
      return ok(result);
    } catch (err) {
      return fail('sync start failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncStop() {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    try {
      return ok(this.syncBridge.stop());
    } catch (err) {
      return fail('sync stop failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncRestart() {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    try {
      return ok(await this.syncBridge.restart());
    } catch (err) {
      return fail('sync restart failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncArrange({ input }) {
    if (!this.syncBridge) return fail('sync bridge unavailable', 503);
    let ids;
    try {
      ids = this.parseIds(input);
    } catch (err) {
      return fail('invalid profile ids: ' + (err?.message || err), 400);
    }
    try {
      return ok(await this.syncBridge.arrange(ids, input.mode || 'tile'));
    } catch (err) {
      return fail('sync arrange failed: ' + (err?.message || err), 400);
    }
  }

  async routeSyncSettingsGet() {
    return ok(this.syncBridge.getSettings?.() || {});
  }

  async routeSyncSettingsPost({ input }) {
    return ok(this.syncBridge.updateSettings?.(input) || {});
  }

  // ---- RPA ----
  async routeRpaPlansList() {
    return ok({ list: this.rpaStore.listPlans() });
  }

  async routeRpaPlanUpsert({ input }) {
    const rpaInput = normalizeRpaInput(input);
    return ok(await this.rpaStore.upsertPlan({
      ...rpaInput,
      id: rpaInput.id ?? rpaInput.plan_id,
    }));
  }

  async routeRpaPlanDelete({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/plans/'.length), 'RPA plan');
    return ok(await this.rpaStore.deletePlan(id));
  }

  async routeRpaTasksList({ input }) {
    const rpaInput = normalizeRpaInput(input);
    const list = this.rpaStore.listTasks(rpaInput);
    const limit = Math.max(1, Math.min(500, Number(rpaInput.limit) || 50));
    return ok({ list: list.slice(0, limit), total: list.length });
  }

  async routeRpaTaskGet({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/tasks/'.length), 'RPA task');
    const task = this.rpaStore.getTask(id);
    if (!task) return fail('task not found: ' + id, 404);
    return ok({ task });
  }

  async routeRpaTaskDelete({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/tasks/'.length), 'RPA task');
    return ok(await this.rpaStore.deleteTask(id));
  }

  async routeRpaTasksDelete({ input }) {
    const rpaInput = normalizeRpaInput(input);
    const rawIds = firstArray(rpaInput, ['task_ids', 'taskIds', 'ids']) || [firstDefined(rpaInput, ['task_id', 'taskId', 'id'])];
    const ids = rawIds.map((v) => String(v || '').trim()).filter(Boolean);
    const deleted = [];
    for (const id of ids) {
      const res = await this.rpaStore.deleteTask(id);
      if (res && res.deleted) deleted.push(id);
    }
    return ok({ deleted });
  }

  async routeRpaRun({ input }) {
    const rpaInput = normalizeRpaInput(input);
    const wait = rpaInput.wait !== false && rpaInput.wait !== 'false';
    if (rpaInput.plan_id) {
      if (!wait) {
        this.rpaEngine.runPlan(String(rpaInput.plan_id), rpaInput).catch(() => {});
        return ok({ async: true, plan_id: String(rpaInput.plan_id) });
      }
      return ok(await this.rpaEngine.runPlan(String(rpaInput.plan_id), rpaInput));
    }
    if (rpaInput.task_id) {
      if (!wait) {
        this.rpaEngine.runTask(String(rpaInput.task_id), rpaInput).catch(() => {});
        return ok({ async: true, task_id: String(rpaInput.task_id) });
      }
      return ok(await this.rpaEngine.runTask(String(rpaInput.task_id), rpaInput));
    }
    if (Array.isArray(rpaInput.steps)) {
      const task = await this.rpaStore.createTask({
        profile_id: firstString(rpaInput, ['profile_id', 'user_id']),
        process_name: String(rpaInput.process_name || rpaInput.name || 'adhoc'),
        steps: rpaInput.steps,
      });
      if (!wait) {
        this.rpaEngine.runTask(task.id, rpaInput).catch(() => {});
        return ok({ async: true, task_id: task.id, task });
      }
      return ok(await this.rpaEngine.runTask(task.id, rpaInput));
    }
    return fail('plan_id, task_id or steps required', 400);
  }

  async routeRpaStatus() {
    return ok({
      ...this.rpaEngine.getStatus(),
      tasks: this.rpaStore.listTasks({ status: 'running' }),
    });
  }

  async routeRpaStop({ input }) {
    const rpaInput = normalizeRpaInput(input);
    if (!this.rpaEngine) return fail('rpa engine unavailable', 503);
    const taskId = rpaInput.task_id || null;
    if (taskId && this.rpaStore) {
      const task = this.rpaStore.getTask(taskId);
      if (!task && !this.rpaEngine.running?.has(taskId)) {
        return fail('task not found: ' + taskId, 404);
      }
    }
    return ok(await this.rpaEngine.stop(taskId));
  }

  // ---- RPA template store ----
  async routeRpaTemplatesList({ input }) {
    const rpaInput = normalizeRpaInput(input);
    return ok({
      list: this.rpaStore.listTemplates(rpaInput),
      categories: this.rpaStore.listTemplateCategories(),
    });
  }

  async routeRpaTemplatesAction({ input }) {
    const rpaInput = normalizeRpaInput(input);
    if (rpaInput.action === 'install' || rpaInput.install) {
      return ok(await this.rpaStore.installTemplate(String(rpaInput.id || rpaInput.template_id), rpaInput));
    }
    if (rpaInput.action === 'import') {
      return ok(await this.rpaStore.importTemplates(rpaInput.payload || rpaInput.data || rpaInput));
    }
    if (rpaInput.action === 'save_as' || rpaInput.save_as) {
      return ok(await this.rpaStore.saveAsTemplate(rpaInput));
    }
    return ok(await this.rpaStore.upsertTemplate(rpaInput));
  }

  async routeRpaTemplateInstall({ pathname, input }) {
    const rpaInput = normalizeRpaInput(input);
    const encodedId = pathname.slice('/api/rpa/templates/'.length, -'/install'.length);
    const id = decodePathId(encodedId, 'RPA template');
    return ok(await this.rpaStore.installTemplate(id, rpaInput));
  }

  async routeRpaTemplateGet({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/templates/'.length), 'RPA template');
    const tpl = this.rpaStore.getTemplate(id);
    if (!tpl) return fail('template not found', 404);
    return ok(tpl);
  }

  async routeRpaTemplateDelete({ pathname }) {
    const id = decodePathId(pathname.slice('/api/rpa/templates/'.length), 'RPA template');
    return ok(await this.rpaStore.deleteTemplate(id));
  }

  resolveProxyAssociation(input = {}, base = {}) {
    const association = readProxyAssociation(input);
    if (!association.present) return { present: false, patch: {} };
    if (!association.value) {
      return {
        present: true,
        value: '',
        patch: {
          proxyId: null,
          proxyMeta: this.proxyMetaWithAssociation(base.proxyMeta, null),
        },
      };
    }
    if (!this.proxyStore) {
      const error = new Error('proxy store unavailable');
      error.statusCode = 503;
      throw error;
    }
    const item = this.proxyStore.get(association.value);
    if (!item) {
      const error = new Error('proxy library entry not found: ' + association.value);
      error.statusCode = 404;
      throw error;
    }
    return {
      present: true,
      value: item.id,
      item,
      patch: {
        proxyId: item.id,
        proxy: item.raw,
        networkMode: 'proxy',
        proxyMeta: this.proxyMetaWithAssociation({
          ...(base.proxyMeta || {}),
          ipChannel: item.ipChannel || base.proxyMeta?.ipChannel || 'ip-api',
          refreshUrl: item.refreshUrl || base.proxyMeta?.refreshUrl || '',
        }, item.id),
      },
    };
  }

  proxyMetaWithAssociation(value, proxyId) {
    const proxyMeta = value && typeof value === 'object' ? { ...value } : {};
    for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId', 'proxyIdAlias']) delete proxyMeta[key];
    proxyMeta.proxyId = proxyId == null || String(proxyId).trim() === '' ? null : String(proxyId).trim();
    return proxyMeta;
  }

  normalizeProxyAssociationState(profile, association) {
    if (!profile || !association?.present) return profile;
    for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId', 'proxyIdAlias']) delete profile[key];
    const proxyId = association.value || null;
    profile.proxyId = proxyId;
    profile.proxyMeta = this.proxyMetaWithAssociation(profile.proxyMeta, proxyId);
    return profile;
  }

  parseIds(input) {
    const { assertProfileId } = require('./isolation');
    let ids = firstArray(input, ['profile_ids', 'profileIds', 'ids', 'user_ids', 'userIds']);
    if (!ids && input.handles) ids = String(input.handles).split(',').map((s) => s.trim()).filter(Boolean);
    else if (!ids) {
      const id = firstDefined(input, ['user_id', 'userId', 'profile_id', 'profileId']);
      ids = id !== undefined && id !== null && id !== '' ? [id] : [];
    }
    if (ids.length > 200) throw new Error('Invalid profile selection');
    return [...new Set(ids.map((id) => assertProfileId(String(id))))];
  }
}

// Load-time wiring check for the command routing table: every entry must
// name a real handler method, and an exact route may only exist for a path
// the 405 method gate (ROUTE_METHODS) already covers — so the table can
// never silently widen the served API surface.
for (const [routePath, entry] of Object.entries(API_ROUTES)) {
  if (!ROUTE_METHODS.has(routePath)) {
    throw new Error(`local API route not covered by the method gate: ${routePath}`);
  }
  const names = typeof entry === 'string' ? [entry] : Object.values(entry);
  for (const name of names) {
    if (typeof LocalApiServer.prototype[name] !== 'function') {
      throw new Error(`local API route handler missing: ${routePath} -> ${name}`);
    }
  }
}
for (const route of API_PREFIX_ROUTES) {
  for (const [verb, name] of Object.entries(route)) {
    if (verb === 'prefix' || verb === 'suffix') continue;
    if (typeof LocalApiServer.prototype[name] !== 'function') {
      throw new Error(`local API prefix route handler missing: ${route.prefix} -> ${name}`);
    }
  }
}

module.exports = { LocalApiServer, resolveWebSocketDebuggerUrl };
