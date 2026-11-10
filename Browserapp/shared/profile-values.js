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

  return Object.freeze({ toFiniteNumber, toBoundedInteger, normalizeLatitude, normalizeLongitude,
    isValidLatitude, isValidLongitude, normalizeCoordinates, MAX_LATITUDE, MAX_LONGITUDE });
});
