'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const values = require('../../shared/profile-values');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');
const { normalizeProfileInput } = require('../api/input');

for (const pair of [[null, null], ['', ' '], [true, false], [91, 0], [0, 181], [NaN, 1], [1, Infinity]]) {
  assert.equal(values.normalizeCoordinates(...pair).valid, false);
  const profile = sanitizeProfile({ id: 'geo', name: 'Geo', privacy: { geoMode: 'custom', latitude: pair[0], longitude: pair[1] } });
  assert.equal(profile.privacy.latitude, null);
  assert.equal(profile.privacy.longitude, null);
  assert.equal(buildFingerprint(profile).dynamicConfig.geoposition, null, 'invalid custom location never becomes 0,0');
  assert.throws(() => normalizeProfileInput({ geolocation: { latitude: pair[0], longitude: pair[1] } }), (error) => error.statusCode === 400);
}
for (const pair of [[0, 0], ['-90', '180'], ['1e1', '-2.5']]) {
  const location = values.normalizeCoordinates(...pair);
  assert.equal(location.valid, true);
  const input = normalizeProfileInput({ geolocation: { latitude: pair[0], longitude: pair[1] } });
  const profile = sanitizeProfile({ ...input, id: 'geo', name: 'Geo' });
  assert.equal(buildFingerprint(profile).dynamicConfig.geoposition.latitude, location.latitude);
}
const absent = sanitizeProfile({ id: 'geo', name: 'Geo' });
assert.equal(buildFingerprint(absent).dynamicConfig.geoposition, null, 'missing exit location remains unknown');
assert.equal(buildFingerprint({ ...absent, exitLatitude: 30, exitLongitude: 120 }).dynamicConfig.geoposition.latitude, 30);
assert.throws(() => normalizeProfileInput({ geolocation: ',120' }), /invalid geolocation/);
const browser = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../../shared/profile-values'), 'utf8'), browser);
assert.equal(browser.OpenBrowserProfileValues.normalizeCoordinates('', '').valid, false);
assert.equal(browser.OpenBrowserProfileValues.normalizeCoordinates(0, 0).valid, true);
assert.strictEqual(require('../input-validation').normalizeCoordinates, values.normalizeCoordinates, 'Node and UI share one implementation');
console.log('PROFILE_VALUES_SELFTEST OK (empty, boolean, bounds, API, sanitized profiles, fingerprint and browser parity)');
