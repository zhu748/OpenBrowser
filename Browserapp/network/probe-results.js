'use strict';

// Provider response normalization and error classification: no sockets or caches.
const net = require('node:net');
const { normalizeLatitude, normalizeLongitude } = require('../automation/input-validation');

function normalizeIpApiResult(value) {
  const ip = String(value.query || '');
  const countryCode = String(value.countryCode || '').toUpperCase();
  if (value.status !== 'success' || !ip || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(String(value.message || 'Proxy exit lookup response was incomplete'));
  }
  return {
    ip,
    country: String(value.country || ''),
    countryCode,
    region: String(value.regionName || ''),
    city: String(value.city || ''),
    zip: String(value.zip || ''),
    timezone: String(value.timezone || ''),
    latitude: normalizeLatitude(value.lat),
    longitude: normalizeLongitude(value.lon),
    isp: String(value.isp || ''),
    organization: String(value.org || ''),
    asn: String(value.as || '').split(/\s+/, 1)[0],
    asName: String(value.asname || ''),
    mobile: Boolean(value.mobile),
    proxy: Boolean(value.proxy),
    hosting: Boolean(value.hosting),
    // ip-api style feeds are closer to registry / WHOIS-facing attributes.
    geoRole: 'registry',
    checkedAt: new Date().toISOString(),
  };
}

function normalizeIpPureResult(value) {
  const ip = String(value.ip || '').trim();
  const fraudScore = Number(value.fraudScore);
  if (!ip || !Number.isFinite(fraudScore) || fraudScore < 0 || fraudScore > 100) {
    throw new Error('risk intelligence response was incomplete');
  }
  return {
    ip,
    fraudScore,
    isResidential: typeof value.isResidential === 'boolean' ? value.isResidential : null,
    isBroadcast: typeof value.isBroadcast === 'boolean' ? value.isBroadcast : null,
    asn: value.asn == null ? '' : 'AS' + String(value.asn).replace(/^AS/i, ''),
    asOrganization: String(value.asOrganization || ''),
    country: String(value.country || ''),
    countryCode: String(value.countryCode || '').toUpperCase(),
    city: String(value.city || ''),
    timezone: String(value.timezone || ''),
    latitude: normalizeLatitude(value.latitude),
    longitude: normalizeLongitude(value.longitude),
    postalCode: String(value.postalCode || ''),
    geoRole: 'risk',
    checkedAt: new Date().toISOString(),
  };
}

function attachIpPure(network, result) {
  if (!result || !network?.ip) return network;
  if (result.ip && result.ip !== network.ip) return network;
  return {
    ...network,
    // Keep risk fields under a neutral key. UI must not surface provider brand.
    riskIntel: {
      fraudScore: result.fraudScore,
      isResidential: result.isResidential,
      isBroadcast: result.isBroadcast,
      asOrganization: result.asOrganization || '',
    },
    // Backward-compatible alias for older score code paths.
    ipPure: {
      fraudScore: result.fraudScore,
      isResidential: result.isResidential,
      isBroadcast: result.isBroadcast,
      asOrganization: result.asOrganization || '',
    },
  };
}

function parseCloudflareTrace(body = '') {
  const text = String(body || '');
  const pick = (key) => {
    const match = text.match(new RegExp(`(?:^|\\n)${key}=([^\\n\\r]+)`, 'i'));
    return match ? String(match[1]).trim() : '';
  };
  const ip = pick('ip');
  const loc = pick('loc').toUpperCase();
  const colo = pick('colo');
  if (!ip || !/^[A-Z]{2}$/.test(loc)) {
    throw new Error('edge location probe response was incomplete');
  }
  return {
    ip,
    country: loc,
    countryCode: loc,
    region: '',
    city: '',
    zip: '',
    timezone: '',
    latitude: null,
    longitude: null,
    isp: '',
    organization: '',
    asn: '',
    asName: '',
    mobile: false,
    proxy: false,
    hosting: false,
    colo,
    // Cloudflare loc reflects the egress/anycast edge the client actually hits.
    geoRole: 'usage',
    checkedAt: new Date().toISOString(),
  };
}

function normalizeIpInfoResult(value) {
  const ip = String(value.ip || '').trim();
  const countryCode = String(value.country || value.countryCode || '').toUpperCase();
  if (!ip || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error('secondary exit lookup response was incomplete');
  }
  const regionCity = String(value.region || '');
  const city = String(value.city || '');
  const org = String(value.org || '');
  const asnMatch = org.match(/\bAS\d+\b/i);
  return {
    ip,
    country: countryCode,
    countryCode,
    region: regionCity,
    city,
    zip: String(value.postal || value.zip || ''),
    timezone: String(value.timezone || ''),
    latitude: normalizeLatitude(value.latitude ?? value.loc?.split?.(',')?.[0]),
    longitude: normalizeLongitude(value.longitude ?? value.loc?.split?.(',')?.[1]),
    isp: org,
    organization: org,
    asn: asnMatch ? asnMatch[0].toUpperCase() : '',
    asName: org.replace(/\bAS\d+\b/i, '').trim(),
    mobile: false,
    proxy: false,
    hosting: false,
    geoRole: 'registry',
    checkedAt: new Date().toISOString(),
  };
}

function firstFilled(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return values[values.length - 1];
}

/**
 * Merge multi-source exit lookups.
 * - usage sources (edge/CDN loc) prefer "where traffic lands"
 * - registry sources prefer WHOIS/registration-facing geo
 * Conflicts like "registered GB / used HK" become countryNote + geoConflict.
 */
function mergeNetworkLookups(parts = []) {
  const list = (Array.isArray(parts) ? parts : []).filter((item) => item && item.ip);
  if (!list.length) throw new Error('exit lookup produced no usable result');

  // Prefer the most common IP; ties keep first.
  const ipVotes = new Map();
  for (const item of list) {
    const ip = String(item.ip).trim();
    ipVotes.set(ip, (ipVotes.get(ip) || 0) + 1);
  }
  const ip = [...ipVotes.entries()].sort((a, b) => b[1] - a[1] || 0)[0][0];
  const sameIp = list.filter((item) => String(item.ip).trim() === ip);

  const countryVotes = new Map();
  const usageCodes = [];
  const registryCodes = [];
  for (const item of sameIp) {
    const code = String(item.countryCode || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) continue;
    countryVotes.set(code, (countryVotes.get(code) || 0) + 1);
    if (item.geoRole === 'usage') usageCodes.push(code);
    else registryCodes.push(code);
  }
  const countries = [...countryVotes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([code]) => code);

  const usageCountry = usageCodes.find(Boolean) || '';
  const registryCountry = registryCodes.find(Boolean) || '';
  // Prefer real egress/usage country when available; fall back to majority registry.
  const countryCode = usageCountry || countries[0] || '';
  const geoConflict = countries.length > 1;
  const countryNote = geoConflict
    ? `多源地区不一致：${countries.join(' / ')}${usageCountry && registryCountry && usageCountry !== registryCountry
      ? `（使用地倾向 ${usageCountry}，注册/库表倾向 ${registryCountry}）`
      : ''}`
    : '';

  const pick = (...keys) => {
    for (const item of sameIp) {
      for (const key of keys) {
        const value = item[key];
        if (value == null) continue;
        if (typeof value === 'string' && !String(value).trim()) continue;
        return value;
      }
    }
    return null;
  };

  const primary = sameIp.find((item) => item.geoRole !== 'usage') || sameIp[0];
  const usage = sameIp.find((item) => item.geoRole === 'usage') || null;

  return {
    ip,
    country: firstFilled(
      sameIp.find((item) => String(item.countryCode || '').toUpperCase() === countryCode)?.country,
      primary.country,
      countryCode,
    ),
    countryCode,
    countries,
    countryUsage: usageCountry || '',
    countryRegistered: registryCountry || '',
    geoConflict,
    countryNote,
    region: firstFilled(pick('region'), ''),
    city: firstFilled(pick('city'), ''),
    zip: firstFilled(pick('zip'), pick('postalCode'), ''),
    timezone: firstFilled(pick('timezone'), ''),
    latitude: pick('latitude'),
    longitude: pick('longitude'),
    isp: firstFilled(pick('isp'), ''),
    organization: firstFilled(pick('organization'), pick('asOrganization'), ''),
    asn: firstFilled(pick('asn'), ''),
    asName: firstFilled(pick('asName'), pick('asOrganization'), ''),
    mobile: sameIp.some((item) => item.mobile),
    proxy: sameIp.some((item) => item.proxy),
    hosting: sameIp.some((item) => item.hosting),
    colo: usage?.colo || pick('colo') || '',
    sourceCount: sameIp.length,
    checkedAt: new Date().toISOString(),
  };
}

function isProxyLinkError(error) {
  if (!error) return false;
  if (error.code === 'probe-unavailable' || error.errorClass === 'probe-unavailable' || error.probeUnavailable) {
    return false;
  }
  const msg = String(error.message || error);

  // Authentication failures are proxy link errors
  if (/authentication failed|username or password|407|rejected available authentication|auth failed/i.test(msg)) {
    return true;
  }

  // SOCKS5 protocol / upstream errors
  if (/SOCKS5 (?:authentication|username|proxy selected|upstream|proxy test tunnel)|Local SOCKS5 bridge/i.test(msg)) {
    return true;
  }

  // HTTP CONNECT tunnel failure
  if (/Proxy test tunnel failed with HTTP/i.test(msg)) {
    return true;
  }

  // Connection to proxy socket timed out
  if (/Proxy connection timed out/i.test(msg)) {
    return true;
  }

  // Upstream bridge failures
  if (/UPSTREAM_CONNECT_FAILED|LOCAL_PROXY_FAILED|Proxy upstream connection failed/i.test(msg)) {
    return true;
  }

  // Network / socket connection errors
  if (/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ENETUNREACH|ECONNRESET|EPIPE|EADDRNOTAVAIL/i.test(msg)) {
    return true;
  }

  // Protocol invalid
  if (/Unsupported proxy protocol|Invalid proxy protocol|Proxy configuration is required/i.test(msg)) {
    return true;
  }

  return false;
}

function isProbeServiceError(error) {
  if (!error) return false;
  if (error.code === 'probe-unavailable' || error.errorClass === 'probe-unavailable' || error.probeUnavailable) {
    return true;
  }
  if (isProxyLinkError(error)) return false;

  const msg = String(error.message || error);

  // HTTP 429 rate limit
  if (/429|rate\s*limit|too many requests/i.test(msg)) {
    return true;
  }

  // HTTP status from probe services (not 407)
  if (/(?:Proxy exit lookup|Proxy edge probe|ifconfig\.me proxy check|lookup returned HTTP|returned HTTP)\s*(?!407)\d{3}/i.test(msg)) {
    return true;
  }

  // Timeouts during probe request
  if (/Proxy exit lookup timed out|HTTPS proxy request timed out|lookup timed out/i.test(msg)) {
    return true;
  }

  // JSON parsing
  if (error instanceof SyntaxError || /Unexpected token|Unexpected end of JSON|JSON parsing failed/i.test(msg)) {
    return true;
  }

  // Incomplete / invalid probe response
  if (/(?:response was incomplete|did not contain a valid IP address|edge location probe response|quota)/i.test(msg)) {
    return true;
  }

  return false;
}

function classifyProxyError(error) {
  if (!error) return 'unknown';
  if (error.code === 'probe-unavailable' || error.errorClass === 'probe-unavailable' || error.probeUnavailable) {
    return 'probe-unavailable';
  }
  const msg = String(error.message ? error.message : error || '');
  if (/probe-unavailable|探测服务不可用/i.test(msg)) return 'probe-unavailable';
  if (/authentication failed|username or password|407|rejected available authentication/i.test(msg)) return 'auth';
  if (/429|rate\s*limit|too many requests/i.test(msg)) return 'probe-unavailable';
  if (/(?:Proxy exit lookup|Proxy edge probe|ifconfig\.me proxy check)\s*(?:returned HTTP\s*(?!407)\d{3}|timed out)/i.test(msg)) {
    return 'probe-unavailable';
  }
  if (/timed?\s*out|timeout/i.test(msg)) return 'timeout';
  if (/ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|ENETUNREACH|socket hang up|connect/i.test(msg)) return 'unreachable';
  if (/Unsupported proxy protocol|Invalid proxy|SOCKS|protocol/i.test(msg)) return 'protocol';
  return 'unknown';
}

function networkTypeFromLookup(result = {}) {
  if (result.mobile) return 'mobile';
  if (result.hosting) return 'hosting';
  if (result.proxy) return 'proxy';
  return 'broadband';
}

function normalizeIpWhoResult(value) {
  const ip = String(value.ip || value.query || '');
  const countryCode = String(value.country_code || value.countryCode || '').toUpperCase();
  if (value.success === false || !ip || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(String(value.message || 'Direct exit lookup response was incomplete'));
  }
  const tz = value.timezone && typeof value.timezone === 'object'
    ? String(value.timezone.id || value.timezone.name || '')
    : String(value.timezone || '');
  return {
    ip,
    country: String(value.country || ''),
    countryCode,
    region: String(value.region || value.regionName || ''),
    city: String(value.city || ''),
    zip: String(value.postal || value.zip || ''),
    timezone: tz,
    latitude: normalizeLatitude(value.latitude ?? value.lat),
    longitude: normalizeLongitude(value.longitude ?? value.lon),
    isp: String(value.connection?.isp || value.isp || ''),
    organization: String(value.connection?.org || value.org || ''),
    asn: String(value.connection?.asn || value.asn || value.as || '').toString().split(/\s+/, 1)[0],
    asName: String(value.connection?.org || value.asname || ''),
    mobile: Boolean(value.connection?.mobile || value.mobile),
    proxy: Boolean(value.security?.proxy || value.proxy),
    hosting: Boolean(value.connection?.hosting || value.hosting),
    geoRole: 'registry',
    checkedAt: new Date().toISOString(),
  };
}

function normalizeIpWhoisAppResult(value) {
  const ip = String(value.ip || '').trim();
  const countryCode = String(value.country_code || value.countryCode || '').toUpperCase();
  if (value.success === false || !ip || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error(String(value.message || 'ipwhois.app exit lookup response was incomplete'));
  }
  const tz = value.timezone && typeof value.timezone === 'object'
    ? String(value.timezone.id || value.timezone.name || '')
    : String(value.timezone || '');
  return {
    ip,
    country: String(value.country || ''),
    countryCode,
    region: String(value.region || ''),
    city: String(value.city || ''),
    zip: String(value.postal || value.zip || ''),
    timezone: tz,
    latitude: normalizeLatitude(value.latitude),
    longitude: normalizeLongitude(value.longitude),
    isp: String(value.isp || ''),
    organization: String(value.org || ''),
    asn: String(value.asn || '').split(/\s+/, 1)[0],
    asName: String(value.org || value.isp || ''),
    mobile: false,
    proxy: false,
    hosting: false,
    geoRole: 'registry',
    checkedAt: new Date().toISOString(),
  };
}

function normalizeFreeIpApiResult(value) {
  const ip = String(value.ipAddress || value.ip || '').trim();
  const countryCode = String(value.countryCode || value.country_code || '').toUpperCase();
  if (!ip || !/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error('freeipapi exit lookup response was incomplete');
  }
  return {
    ip,
    country: String(value.countryName || value.country || ''),
    countryCode,
    region: String(value.regionName || value.region || ''),
    city: String(value.cityName || value.city || ''),
    zip: String(value.zipCode || value.zip || value.postal || ''),
    timezone: String(value.timeZone || value.timezone || ''),
    latitude: normalizeLatitude(value.latitude),
    longitude: normalizeLongitude(value.longitude),
    isp: '',
    organization: '',
    asn: '',
    asName: '',
    mobile: false,
    proxy: false,
    hosting: false,
    geoRole: 'registry',
    checkedAt: new Date().toISOString(),
  };
}

/**
 * HTTPS egress-IP probe requested by the product: https://ifconfig.me/ip.
 * The endpoint is deliberately IP-only, so geo data continues to come from
 * the existing providers while this confirms that the configured proxy can
 * reach ifconfig.me over TLS and exposes a valid public exit address.
 */
function normalizeIfconfigMeResult(value) {
  const ip = String(value || '').trim();
  if (!net.isIP(ip)) throw new Error('ifconfig.me response did not contain a valid IP address');
  return {
    ip,
    source: 'ifconfig.me',
    geoRole: 'egress',
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  normalizeIpApiResult,
  normalizeIpPureResult,
  attachIpPure,
  parseCloudflareTrace,
  normalizeIpInfoResult,
  firstFilled,
  mergeNetworkLookups,
  isProxyLinkError,
  isProbeServiceError,
  classifyProxyError,
  networkTypeFromLookup,
  normalizeIpWhoResult,
  normalizeIpWhoisAppResult,
  normalizeFreeIpApiResult,
  normalizeIfconfigMeResult
};
