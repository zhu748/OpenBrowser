'use strict';

// Stable sampling stays deterministic without returning the unmodified pixels.
// Use fewer nonzero samples than normal mode, with the same one-byte bound.
function noiseDelta(value, amplitude) {
  if (amplitude === 1) return value < 0.125 ? -1 : (value >= 0.875 ? 1 : 0);
  return Math.floor(value * amplitude) - Math.floor(amplitude / 2);
}

function normalizeHost(value) {
  return String(value || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    .replace(/:\d+$/, '').replace(/^\*\./, '').replace(/^\.+/, '');
}

function normalizeSiteHost(value) {
  return normalizeHost(value).replace(/\.+$/, '');
}

function matchesNormalizedHost(host, pattern) {
  if (!host || !pattern) return false;
  if (pattern.endsWith('.')) {
    const label = pattern.slice(0, -1);
    return host === label || host.startsWith(pattern) || host.endsWith('.' + label);
  }
  return host === pattern || host.endsWith('.' + pattern);
}

function hostMatchesPattern(host, pattern) {
  return matchesNormalizedHost(normalizeSiteHost(host), normalizeHost(pattern));
}

function listIncludesHost(list, host) {
  const normalized = normalizeSiteHost(host);
  return Boolean(normalized) && Array.isArray(list)
    && list.some((pattern) => matchesNormalizedHost(normalized, normalizeHost(pattern)));
}

// One runtime policy for documents and all worker scopes. Resolve against the
// current realm's host: the launch-time snapshot may precede navigation.
const runtimeSource = `
  const noiseDelta = ${noiseDelta.toString()};
  ${normalizeHost.toString()}
  ${normalizeSiteHost.toString()}
  ${matchesNormalizedHost.toString()}
  ${listIncludesHost.toString()}
  const currentHost = () => {
    try {
      const location = globalThis.location;
      if (location?.hostname) return location.hostname;
      // Blob URLs and inherited documents can have an origin without a URL hostname.
      const origin = globalThis.origin ?? location?.origin;
      return origin && origin !== 'null' ? new URL(origin).hostname : '';
    } catch (_) { return ''; }
  };
  let __stabilityVerdict;
  const stabilityActiveNow = () => {
    if (__stabilityVerdict !== undefined) return __stabilityVerdict;
    const st = CFG.stability || {}, host = currentHost();
    if (st.mode === 'off') __stabilityVerdict = false;
    else if (listIncludesHost(st.skipHosts, host)) __stabilityVerdict = false;
    else if (st.mode === 'force') __stabilityVerdict = true;
    else __stabilityVerdict = host ? listIncludesHost(st.hosts, host) : Boolean(st.active);
    return __stabilityVerdict;
  };
  const noiseAmplitudeNow = () => stabilityActiveNow() ? 1 : 3;
  const sampleStepDivisorNow = () => stabilityActiveNow() ? 128 : 64;
`;

module.exports = { noiseDelta, normalizeHost, normalizeSiteHost, hostMatchesPattern, listIncludesHost, runtimeSource };
