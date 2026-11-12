(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OpenBrowserProfileValues = factory();
})(globalThis, () => {
  'use strict';

  const MAX_LATITUDE = 90;
  const MAX_LONGITUDE = 180;

  /** Missing values and booleans must never become numeric configuration. */
  function toFiniteNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function toBoundedInteger(value, min, max) {
    const n = toFiniteNumber(value);
    return n !== null && Number.isInteger(n) && n >= min && n <= max ? n : null;
  }

  function normalizeLatitude(value) {
    const n = toFiniteNumber(value);
    return n !== null && Math.abs(n) <= MAX_LATITUDE ? n : null;
  }

  function normalizeLongitude(value) {
    const n = toFiniteNumber(value);
    return n !== null && Math.abs(n) <= MAX_LONGITUDE ? n : null;
  }

  const isValidLatitude = (value) => normalizeLatitude(value) !== null;
  const isValidLongitude = (value) => normalizeLongitude(value) !== null;

  /** @returns {{latitude:number|null, longitude:number|null, valid:boolean}} */
  function normalizeCoordinates(latitude, longitude) {
    const lat = normalizeLatitude(latitude);
    const lon = normalizeLongitude(longitude);
    return lat === null || lon === null
      ? { latitude: null, longitude: null, valid: false }
      : { latitude: lat, longitude: lon, valid: true };
  }

  // null transports Infinity through JSON. It must never pass through Number(null).
  function normalizeBatterySnapshot(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const charging = value.charging !== false && value.charging !== 0 && value.charging !== '0';
    const rawLevel = toFiniteNumber(value.level);
    const level = rawLevel === null ? 0.87 : Math.min(1, Math.max(0, rawLevel));
    const duration = (key, fallback) => {
      if (value[key] === undefined) return fallback;
      const n = toFiniteNumber(value[key]);
      return n !== null && n >= 0 ? n : null;
    };
    return {
      charging,
      chargingTime: charging ? (level === 1 ? 0 : duration('chargingTime', null)) : null,
      dischargingTime: charging ? null : duration('dischargingTime', null),
      level,
    };
  }

  // Chromium's web-exposed buckets: 50 Kbps up to 10 Mbps, 50 ms up to 3 s.
  function normalizeNetworkInformation(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const out = { ...value };
    for (const [key, maximum, units] of [['downlink', 10, 20], ['rtt', 3000, 0.02]]) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      const n = toFiniteNumber(value[key]);
      if (n === null) delete out[key];
      else out[key] = Number((Math.round(Math.min(maximum, Math.max(0, n)) * units) / units).toFixed(2));
    }
    return out;
  }

  // Throughput is bytes/sec. null means unlimited; explicit zero is retained.
  function normalizeNetworkConditions(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const out = { offline: value.offline === true, latency: null, downloadThroughput: null, uploadThroughput: null };
    for (const [key, maximum] of [['latency', 60000], ['downloadThroughput', 1073741824], ['uploadThroughput', 1073741824]]) {
      const n = toFiniteNumber(value[key]);
      if (n !== null) out[key] = Math.min(maximum, Math.max(0, n));
    }
    return out.offline || Object.values(out).some((n) => typeof n === 'number') ? out : null;
  }

  return Object.freeze({ toFiniteNumber, toBoundedInteger, normalizeLatitude, normalizeLongitude, normalizeBatterySnapshot, normalizeNetworkInformation, normalizeNetworkConditions,
    isValidLatitude, isValidLongitude, normalizeCoordinates, MAX_LATITUDE, MAX_LONGITUDE });
});
