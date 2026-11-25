'use strict';

const assert = require('node:assert/strict');
const { fromRoxy, toRoxy } = require('../../rebuild/profile-dto');
const { buildFingerprint } = require('../fingerprint');
const { resolveProfileGeolocation, resolveFingerprintGeolocation } = require('../fingerprint/geolocation-policy');
const { mapFingerprintToInitFields } = require('../kernel-init-sync');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { BrowserEngine } = require('../../engine');

const version = '159.0.8154.6';
const original = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.8154.74 Safari/537.36';
const changed = original.replace('.74 ', '.73 ');
for (const visibleUa of ['', original, changed]) {
  const legacy = fromRoxy({ os: 'Windows', userAgent: visibleUa });
  legacy.privacy.fingerprint = { userAgent: original, uaGenerated: true, uaPatchRandomized: true,
    clientHints: { ua_full_version: '159.0.8154.74' } };
  assert.equal(toRoxy(legacy).userAgent, original, 'the editor displays the effective legacy override');
  const renamed = fromRoxy({ windowName: 'Rename only' }, legacy);
  assert.equal(renamed.privacy.fingerprint.userAgent, original, 'partial updates preserve explicit legacy intent');
  const migrated = fromRoxy({ userAgent: toRoxy(legacy).userAgent }, legacy);
  assert.equal(migrated.userAgent, original);
  assert.equal(migrated.privacy.fingerprint.userAgent, undefined);
  assert.equal(migrated.privacy.fingerprint.uaGenerated, true);
  const generated = fromRoxy({ userAgent: changed, _fingerprintDraft: {
    seed: 'round6-migration', version: 2, generated: true, userAgent: changed,
    uaReduced: false, uaPatchRandomized: true, clientHints: { ua_full_version: '159.0.8154.73' },
  } }, legacy);
  assert.equal(generated.privacy.fingerprint.userAgent, undefined);
  const delivered = buildFingerprint({ ...generated, kernelVersion: version });
  assert.equal(delivered.userAgent, changed, 'the hidden legacy field cannot replace the newly displayed UA');
  assert.equal(delivered.userAgentMetadata.fullVersion, '159.0.8154.73');
  const cleared = fromRoxy({ userAgent: '' }, legacy);
  assert.equal(cleared.userAgent, '');
  for (const key of ['userAgent', 'clientHints', 'uaPatchRandomized']) assert.equal(cleared.privacy.fingerprint[key], undefined);
  assert.equal(cleared.privacy.fingerprint.uaGenerated, false);
}

const legacyDevice = sanitizeProfile({
  id: 'legacy-device', name: 'Legacy device', os: 'Windows', fingerprintVersion: 4,
  privacy: {
    geoMode: 'disabled', geoFromIp: false, latitude: 0, longitude: 0, accuracy: 20,
    webrtc: 'proxy', deviceNameMode: 'noise', macMode: 'real',
    fingerprint: {
      webrtc: 'real', deviceNameMode: 'custom', deviceName: 'OLD-DESKTOP',
      macMode: 'custom', mac: '02:00:00:01:02:03', hardwareConcurrency: 12, deviceMemory: 4,
    },
  },
});
const legacyDeviceDto = toRoxy(legacyDevice);
assert.deepEqual(
  [legacyDeviceDto.webRTC, legacyDeviceDto.deviceName, legacyDeviceDto.macInfo, legacyDeviceDto.macAddr],
  [1, 'OLD-DESKTOP', true, '02:00:00:01:02:03'],
);
assert.deepEqual([legacyDeviceDto.hardwareConcurrent, legacyDeviceDto.deviceMemory], [12, 4]);
assert.equal(legacyDeviceDto.position, 2);
assert.equal(legacyDeviceDto.isPositionBaseIp, false);
const renamedDevice = fromRoxy({ windowName: 'Device renamed' }, legacyDevice);
assert.deepEqual(renamedDevice.privacy.fingerprint, legacyDevice.privacy.fingerprint, 'a metadata edit preserves device overrides');
const editedDevice = fromRoxy({
  webRTC: 2, deviceNameSwitch: true, deviceName: 'NEW-DESKTOP',
  macInfo: true, macAddr: '02:00:00:03:02:01', hardwareConcurrent: '32', deviceMemory: '0.5', position: 0,
}, legacyDevice);
const deviceFp = buildFingerprint({ ...editedDevice, kernelVersion: version });
assert.equal(deviceFp.deviceName, 'NEW-DESKTOP');
assert.equal(deviceFp.mac.value, '02:00:00:03:02:01');
assert.equal(deviceFp.webrtc, 'disabled');
assert.equal(deviceFp.webrtcPolicy, 0);
assert.deepEqual([deviceFp.hardwareConcurrency, deviceFp.deviceMemory], [32, 0.5]);
const nativeDevice = mapFingerprintToInitFields(deviceFp, editedDevice);
assert.equal(nativeDevice.machine, deviceFp.deviceName);
assert.equal(nativeDevice.mac_address, deviceFp.mac.value.toLowerCase());
assert.equal(nativeDevice.webrtc_policy, 0);
assert.deepEqual([nativeDevice.hardwareConcurrency, nativeDevice.deviceMemory], [32, 0.5]);
assert.deepEqual(resolveFingerprintGeolocation(deviceFp, editedDevice), {
  permission: 'prompt', position: { latitude: 0, longitude: 0, accuracy: 20 },
});
const denied = fromRoxy({ position: 2 }, editedDevice);
assert.deepEqual(resolveProfileGeolocation(denied), { permission: 'denied', position: null });
assert.equal(toRoxy(denied).isPositionBaseIp, false);
const granted = fromRoxy({ position: 1 }, denied);
assert.deepEqual(resolveProfileGeolocation(granted), {
  permission: 'granted', position: { latitude: 0, longitude: 0, accuracy: 20 },
});
assert.equal(fromRoxy({ position: 'constructor' }, legacyDevice).privacy.geoPermission, 'deny');
assert.equal(toRoxy(fromRoxy({ isPositionBaseIp: false, position: 1, latitude: 0, longitude: 0 })).isPositionBaseIp, false);

const profile = fromRoxy({ os: 'Windows', coreType: 'Chrome', coreVersion: '159' });
let selections = 0;
const engine = { profiles: new Map([[profile.id, profile]]), running: new Map(), profilePrefersFirefox: () => false,
  chooseBrowser(selected, family) { selections++; assert.equal(selected.engineVersion, '159'); assert.equal(family, 'chromium');return { version }; } };
const stopped = BrowserEngine.prototype.fingerprintFor.call(engine, profile.id);
assert.equal(stopped.userAgentMetadata.fullVersion, version, 'stopped previews use the selected installed kernel');
assert.equal(selections, 1);
engine.running.set(profile.id, { fingerprint: stopped });
const running = BrowserEngine.prototype.fingerprintFor.call(engine, profile.id);
running.userAgent = 'mutated';
assert.equal(engine.running.get(profile.id).fingerprint.userAgent, stopped.userAgent);
assert.equal(selections, 1, 'a running identity is returned without regenerating it');
engine.running.clear();
engine.chooseBrowser = () => { throw Error('kernel missing'); };
assert.throws(() => BrowserEngine.prototype.fingerprintFor.call(engine, profile.id), /kernel missing/);
console.log('FINGERPRINT_REVIEW_SELFTEST OK (legacy editor settings, geolocation, UA and running identity isolation)');
