'use strict';

// Stable sampling stays deterministic without returning the unmodified pixels.
// Use fewer nonzero samples than normal mode, with the same one-byte bound.
function noiseDelta(value, amplitude) {
  if (amplitude === 1) return value < 0.125 ? -1 : (value >= 0.875 ? 1 : 0);
  return Math.floor(value * amplitude) - Math.floor(amplitude / 2);
}

// One runtime policy for documents and all worker scopes. Resolve against the
// current realm's host: the launch-time snapshot may precede navigation.
const runtimeSource = `
  const noiseDelta = ${noiseDelta.toString()};
  const normalizeHost = (value) => String(value || '').trim().toLowerCase()
    .replace(/^https?:\\/\\//, '').replace(/\\/.*$/, '')
    .replace(/:\\d+$/, '').replace(/^\\*\\./, '').replace(/^\\.+/, '');
  const hostMatches = (host, pattern) => {
    const h = normalizeHost(host), p = normalizeHost(pattern);
    if (!h || !p) return false;
    if (p.endsWith('.')) return h === p.slice(0, -1) || h.startsWith(p) || h.endsWith('.' + p.slice(0, -1));
    return h === p || h.endsWith('.' + p);
  };
  const listHasHost = (list, host) => Array.isArray(list) && list.some((item) => hostMatches(host, item));
  const currentHost = () => {
    try { return normalizeHost(globalThis.location && globalThis.location.hostname); } catch (_) { return ''; }
  };
  let __stabilityVerdict;
  const stabilityActiveNow = () => {
    if (__stabilityVerdict !== undefined) return __stabilityVerdict;
    const st = CFG.stability || {}, host = currentHost();
    if (st.mode === 'off') __stabilityVerdict = false;
    else if (listHasHost(st.skipHosts, host)) __stabilityVerdict = false;
    else if (st.mode === 'force') __stabilityVerdict = true;
    else __stabilityVerdict = host ? listHasHost(st.hosts, host) : Boolean(st.active);
    return __stabilityVerdict;
  };
  const noiseAmplitudeNow = () => stabilityActiveNow() ? 1 : 3;
  const sampleStepDivisorNow = () => stabilityActiveNow() ? 128 : 64;
`;

module.exports = { noiseDelta, runtimeSource };
