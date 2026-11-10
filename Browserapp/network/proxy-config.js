'use strict';

// Proxy input normalization and display; no sockets, probes or engine state.
const net = require('node:net');

const IP_LOOKUP_CHANNELS = Object.freeze(['ip-api', 'ip2location', 'ifconfig-me']);

function normalizeIpLookupChannel(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'ifconfig' || raw === 'ifconfig.me' || raw === 'ifconfig-me') return 'ifconfig-me';
  return IP_LOOKUP_CHANNELS.includes(raw) ? raw : 'ip-api';
}

function decode(value) {
  const raw = String(value || '');
  try { return decodeURIComponent(raw); } catch (_) {
    return raw.replace(/(?:%[0-9a-f]{2})+/gi, (encoded) => {
      try { return decodeURIComponent(encoded); } catch (_) { return encoded; }
    });
  }
}

function normalizeProxyProtocol(value) {
  const protocol = String(value || 'http').trim().replace(/:$/, '').toLowerCase();
  if (protocol === 'socks5h' || protocol === 'socks5s') return 'socks5';
  return protocol;
}

function splitProxyRemark(value) {
  let raw = String(value || '').trim();
  if (!raw) return { source: '', remark: '' };
  raw = raw.replace(/^["'`(]+|["'`)]+$/g, '').trim();

  const at = raw.lastIndexOf('@');
  if (at >= 0) {
    const beforeAt = raw.slice(0, at);
    const afterAt = raw.slice(at + 1);
    const afterHasPort = /^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})(?:[#\/]|$)/.test(afterAt);
    const isHostAtUser = !afterHasPort && /^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})\/?$/.test(beforeAt);
    if (isHostAtUser) {
      return { source: raw, remark: '' };
    }
    const hashIndex = afterAt.indexOf('#');
    if (hashIndex >= 0) {
      const marker = at + 1 + hashIndex;
      return {
        source: raw.slice(0, marker).trim(),
        remark: decode(raw.slice(marker + 1)).trim(),
      };
    }
    return { source: raw, remark: '' };
  }

  const hashIndex = raw.indexOf('#');
  if (hashIndex < 0) return { source: raw, remark: '' };

  const beforeHash = raw.slice(0, hashIndex).trim();
  const isHostPort = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(\[[^\]]+\]|[a-zA-Z0-9._-]+)(?::\d{1,5})?\/?$/i.test(beforeHash);
  if (isHostPort) {
    return {
      source: beforeHash,
      remark: decode(raw.slice(hashIndex + 1)).trim(),
    };
  }

  return { source: raw, remark: '' };
}

function normalizeProxyHost(value) {
  const raw = String(value || '').trim();
  return raw.startsWith('[') && raw.endsWith(']') ? raw.slice(1, -1) : raw;
}

function proxyHostForUrl(host) {
  return net.isIP(host) === 6 ? `[${host}]` : host;
}

function buildProxyConfig(input = {}) {
  const protocol = normalizeProxyProtocol(input.protocol);
  const host = normalizeProxyHost(input.host);
  const port = Number(input.port);
  const username = String(input.username || '');
  const password = String(input.password || '');
  const remark = String(input.remark || '').trim();
  const name = String(input.name || '').trim();

  if (!['http', 'https', 'socks4', 'socks5'].includes(protocol)) throw new Error('Unsupported proxy protocol');
  if ((!net.isIP(host) && !/^[a-zA-Z0-9._-]+$/.test(host))
    || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid proxy host or port');
  }
  if ((username || password) && protocol === 'socks4') throw new Error('Authenticated SOCKS proxies must use SOCKS5');
  if (protocol === 'socks5' && (Buffer.byteLength(username, 'utf8') > 255 || Buffer.byteLength(password, 'utf8') > 255)) throw new Error('SOCKS5 username or password length is invalid');

  const urlHost = proxyHostForUrl(host);
  const auth = username || password
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    : '';
  const canonicalRemark = remark ? `#${encodeURIComponent(remark)}` : '';
  const chromeUrl = `${protocol}://${urlHost}:${port}`;
  return {
    raw: `${protocol}://${auth}${urlHost}:${port}${canonicalRemark}`,
    protocol,
    host,
    port,
    username,
    password,
    authenticated: Boolean(username || password),
    chromeUrl,
    remark,
    name: name || remark || `${protocol.toUpperCase()} ${host}:${port}`,
  };
}

function parseProxyString(value) {
  let { source, remark } = splitProxyRemark(value);
  if (!source || /^(direct|offline|none)$/i.test(source)) return null;

  source = source.replace(/^["'`(]+|["'`)]+$/g, '').trim();
  if (source.endsWith('/')) source = source.slice(0, -1).trim();
  if (!source || /^(direct|offline|none)$/i.test(source)) return null;

  let protocol = 'http';
  let body = source;
  const scheme = source.match(/^([a-z][a-z0-9+.-]*):\/\/([\s\S]*)$/i);
  if (scheme) {
    protocol = normalizeProxyProtocol(scheme[1]);
    body = scheme[2];
  }

  let host = '';
  let port = 0;
  let username = '';
  let password = '';

  const legacyScheme = scheme && body.match(/^([a-zA-Z0-9._-]+):(\d{1,5}):([^:]*):([\s\S]*)$/);
  if (legacyScheme) {
    host = legacyScheme[1];
    port = Number(legacyScheme[2]);
    username = decode(legacyScheme[3]);
    password = decode(legacyScheme[4]);
  } else if (scheme) {
    // Match the endpoint from the right so raw @, / and backslashes remain
    // valid inside credentials. Some proxy vendors escape the final separator
    // as \@; only that final compatibility slash is discarded.
    // URL serialization adds `/` to an authority-only URL. Accept that one
    // empty path so renderer-redacted proxies still compare as the same endpoint.
    const authority = body.match(/^([\s\S]*?)(?:(\\@|@))?(\[[^\]]+\]|[a-zA-Z0-9._-]+)(?::(\d{1,5}))?\/?$/);
    if (!authority) {
      throw new Error('Invalid proxy format');
    } else {
      const userinfo = authority[1];
      const hasAuthSeparator = Boolean(authority[2]);
      host = normalizeProxyHost(authority[3]);
      port = Number(authority[4] || (protocol === 'https' ? 443 : 0));
      if (hasAuthSeparator) {
        const separator = userinfo.indexOf(':');
        username = decode(separator < 0 ? userinfo : userinfo.slice(0, separator));
        password = decode(separator < 0 ? '' : userinfo.slice(separator + 1));
      } else if (userinfo) {
        throw new Error('Invalid proxy format');
      }
    }
  } else {
    const userAtHost = body.match(/^([\s\S]*?)(?:(\\@|@))(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})\/?$/);
    const hostAtUser = !userAtHost && body.match(/^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})@([\s\S]*)\/?$/);
    const legacy = !userAtHost && !hostAtUser && body.match(/^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})(?::([\s\S]*))?$/);

    if (userAtHost) {
      protocol = 'socks5';
      host = normalizeProxyHost(userAtHost[3]);
      port = Number(userAtHost[4]);
      const userinfo = userAtHost[1];
      const separator = userinfo.indexOf(':');
      username = decode(separator < 0 ? userinfo : userinfo.slice(0, separator));
      password = decode(separator < 0 ? '' : userinfo.slice(separator + 1));
    } else if (hostAtUser) {
      protocol = 'socks5';
      host = normalizeProxyHost(hostAtUser[1]);
      port = Number(hostAtUser[2]);
      const userinfo = hostAtUser[3];
      const separator = userinfo.indexOf(':');
      username = decode(separator < 0 ? userinfo : userinfo.slice(0, separator));
      password = decode(separator < 0 ? '' : userinfo.slice(separator + 1));
    } else if (legacy) {
      host = normalizeProxyHost(legacy[1]);
      port = Number(legacy[2]);
      if (legacy[3] != null) {
        const separator = legacy[3].indexOf(':');
        if (separator < 0) throw new Error('Invalid proxy format; use host:port:user:password');
        protocol = 'socks5';
        username = decode(legacy[3].slice(0, separator));
        password = decode(legacy[3].slice(separator + 1));
      }
    } else {
      throw new Error('Invalid proxy format; use host:port or protocol://username:password@host:port');
    }
  }

  return buildProxyConfig({ protocol, host, port, username, password, remark });
}

function parseProxyInput(value) {
  if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
    const raw = value.raw ?? value.proxy ?? value.proxy_url ?? value.proxyUrl;
    const hasRaw = raw != null && String(raw).trim();
    const parsed = hasRaw ? parseProxyString(raw) : null;
    const host = value.host ?? value.proxy_host ?? value.proxyHost ?? value.server;
    if (hasRaw && !parsed && host == null) return null;
    return buildProxyConfig({
      protocol: value.protocol ?? value.type ?? value.proxy_type ?? value.proxyType ?? parsed?.protocol,
      host: host ?? parsed?.host,
      port: value.port ?? value.proxy_port ?? value.proxyPort ?? parsed?.port,
      username: value.username ?? value.user ?? value.proxy_user ?? value.proxy_username ?? value.proxyUsername ?? parsed?.username,
      password: value.password ?? value.pass ?? value.proxy_password ?? value.proxyPassword ?? parsed?.password,
      remark: value.remark ?? value.note ?? parsed?.remark ?? '',
      name: value.name ?? '',
    });
  }
  return parseProxyString(value);
}

function parseProxy(value) {
  return parseProxyInput(value);
}

/**
 * The single endpoint handed to Chromium as `--proxy-server`.
 *
 * Chromium accepts `scheme://host:port` only, so the raw stored string cannot be used verbatim:
 * `socks5h://x:1`, a `#remark` suffix, a trailing slash or the bare `host:port` shorthand all
 * need normalising first. Deriving the endpoint from the parser (instead of pattern-matching the
 * raw text) matters because a rejected string used to yield no `--proxy-server` at all — Chromium
 * then falls through to the host's own system proxy and the profile leaks the machine's real
 * route while the UI still reports the configured proxy.
 *
 * Returns null only for the explicit direct sentinels (direct/offline/none/empty). Malformed
 * input throws, so callers fail closed instead of silently starting unproxied.
 */
function chromeProxyEndpoint(value) {
  const config = parseProxy(value);
  return config ? config.chromeUrl : null;
}

function displayProxy(value) {
  try {
    const config = parseProxy(value);
    if (!config) return 'Direct';
    return config.protocol.toUpperCase() + ' · ' + config.host + ':' + config.port + (config.authenticated ? ' · Auth' : '');
  } catch (_) { return 'Invalid proxy'; }
}

module.exports = { IP_LOOKUP_CHANNELS, normalizeIpLookupChannel, decode, normalizeProxyProtocol, splitProxyRemark, normalizeProxyHost, proxyHostForUrl, buildProxyConfig, parseProxyString, parseProxyInput, parseProxy, chromeProxyEndpoint, displayProxy };
