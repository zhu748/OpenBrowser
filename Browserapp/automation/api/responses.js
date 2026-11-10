'use strict';

// Public response envelopes and credential redaction.
const { redactProxyCredentials } = require('../proxy-redact');

function ok(data = {}, msg = 'success') {
  return { code: 0, msg, data };
}

function fail(msg, code = -1, data = null) {
  return { code, msg: String(msg || 'error'), data };
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

function redactAccount(account) {
  if (!account || typeof account !== 'object') return account;
  const safe = { ...account };
  for (const key of ['username', 'password', 'totpSecret', 'otp']) {
    if (typeof safe[key] === 'string') safe[key] = '';
  }
  return safe;
}

function redactProfileForApi(profile) {
  if (!profile || typeof profile !== 'object') return profile;
  const safe = redactAccount(profile);
  if (typeof safe.proxy === 'string' && safe.proxy) safe.proxy = redactProxyCredentials(safe.proxy);
  if (typeof safe.cookies === 'string') safe.cookies = '';
  if (safe.platform && typeof safe.platform === 'object') {
    safe.platform = redactAccount(safe.platform);
    if (Array.isArray(safe.platform.accounts)) safe.platform.accounts = safe.platform.accounts.map(redactAccount);
  }
  if (Array.isArray(safe.proxyMeta?.backupProxies)) {
    safe.proxyMeta = { ...safe.proxyMeta, backupProxies: safe.proxyMeta.backupProxies.map(redactProxyCredentials) };
  }
  return safe;
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

module.exports = { ok, fail, decodePathId, redactProxyRecord, redactProfileForApi, proxySummary };
