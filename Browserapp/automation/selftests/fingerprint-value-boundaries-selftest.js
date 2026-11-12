'use strict';

const assert = require('node:assert/strict');
const { normalizeBatterySnapshot, normalizeNetworkInformation } = require('../../shared/profile-values');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint, assertFingerprintConsistency } = require('../fingerprint');
const { createBatteryFromSeed } = require('../fingerprint-generators');

const zero = { charging: false, level: 0, chargingTime: null, dischargingTime: null };
for (const snapshot of [zero,
  { charging: false, level: 0.5, chargingTime: null, dischargingTime: 120 },
  { charging: true, level: 0.5, chargingTime: 60, dischargingTime: null },
  { charging: true, level: 1, chargingTime: 0, dischargingTime: null }]) {
  assert.deepEqual(normalizeBatterySnapshot(snapshot), snapshot);
  assert.deepEqual(createBatteryFromSeed('ignored', snapshot), snapshot);
  for (const privacy of [{ batterySnapshot: snapshot }, { fingerprint: { battery: snapshot } }]) {
    const p = sanitizeProfile({ id: 'battery-bounds', name: 'Battery', privacy });
    const restored = sanitizeProfile(JSON.parse(JSON.stringify(p)));
    assert.deepEqual(buildFingerprint(restored).battery.value, snapshot, 'custom battery survives the entire save/load/generate pipeline');
  }
}
assert.equal(normalizeBatterySnapshot({ level: 0 }).level, 0);
for (const level of [null, '', false, {}, 'bad']) assert.equal(normalizeBatterySnapshot({ level }).level, 0.87);
for (const duration of [null, '', false, {}, -1, Infinity]) {
  assert.equal(normalizeBatterySnapshot({ charging: false, level: 0, dischargingTime: duration }).dischargingTime, null);
}
assert.equal(normalizeBatterySnapshot({ charging: false, chargingTime: 99 }).chargingTime, null);
assert.equal(normalizeBatterySnapshot({ charging: true, dischargingTime: 99 }).dischargingTime, null);

assert.deepEqual(normalizeNetworkInformation({ downlink: 10.1, rtt: 77 }), { downlink: 10, rtt: 100 });
assert.deepEqual(normalizeNetworkInformation({ downlink: -1, rtt: 9999 }), { downlink: 0, rtt: 3000 });
assert.deepEqual(normalizeNetworkInformation({ downlink: 1.025, rtt: 25 }), { downlink: 1.05, rtt: 50 }, 'native half-bucket rounding');
assert.deepEqual(normalizeNetworkInformation({ downlink: null, rtt: '' }), {});
assert.equal(normalizeNetworkInformation(null), null);
const p = sanitizeProfile({ id: 'network-bounds', name: 'Network', fingerprintVersion: 2,
  fingerprint: { network: { downlink: '4.37', rtt: '77', effectiveType: '4g' } } });
assert.deepEqual(p.privacy.fingerprint.network, { downlink: 4.35, rtt: 100, effectiveType: '4g' });
const fp = buildFingerprint(p);
assert.equal(fp.connection.downlink, 4.35);
assert.equal(fp.connection.rtt, 100);
assert.throws(() => assertFingerprintConsistency({ ...fp, connection: { ...fp.connection, downlink: 10.1 } }), /native bounds/);
assert.throws(() => assertFingerprintConsistency({ ...fp, connection: { ...fp.connection, rtt: 77 } }), /native bounds/);
for (let i = 0; i < 10000; i++) {
  const candidate = buildFingerprint({ id: 'audit-network-' + i, os: 'Windows', fingerprintVersion: 2, fingerprintSeed: 'seed-' + i });
  assert.ok(candidate.connection.downlink >= 0 && candidate.connection.downlink <= 10);
  assert.ok(Math.abs(candidate.connection.downlink * 20 - Math.round(candidate.connection.downlink * 20)) < 1e-8);
  assert.ok(candidate.connection.rtt >= 0 && candidate.connection.rtt <= 3000 && candidate.connection.rtt % 50 === 0);
  assert.ok(candidate.consistency.ok);
}
console.log('PASS 10,000 v2 native network bounds/buckets, invalid-value diagnostics, battery zero/null/state semantics and persisted round trips');
