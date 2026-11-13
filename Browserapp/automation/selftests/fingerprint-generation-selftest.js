'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { buildFingerprint, assertFingerprintConsistency } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { fingerprintVersion, createFingerprintDraw } = require('../fingerprint/generation');
const { ProfileRoutes } = require('../api/profile-routes');
const { WINDOWS_PERSONAS } = require('../device-personas');
const { canonicalBridgeToken } = require('../fingerprint/shared');
const { deriveBridgeToken } = require('../font-placeholder');
const legacy = require('./fixtures/fingerprint-v1-linux.json');

function onHost(platform, run) {
  const original = Object.getOwnPropertyDescriptor(process, 'platform');
  try { Object.defineProperty(process, 'platform', { value: platform }); return run(); }
  finally { Object.defineProperty(process, 'platform', original); }
}

async function main() {
  for (const [os, osVersion, kernelVersion] of [
    ['Windows', '7', '157.0.8103.78'], ['Windows', '8', '157.0.8103.78'],
    ['Windows', '8.1', '157.0.8103.78'], ['macos', '10.15', '157.0.8103.78'],
  ]) {
    const profile = sanitizeProfile({ id: 'old-os', name: 'old-os', os, osVersion, fingerprintVersion: 2 });
    const fp = buildFingerprint({ ...profile, kernelVersion });
    assert.equal(fp.osVersion, osVersion);
    assert.throws(() => assertFingerprintConsistency(fp), { code: 'FINGERPRINT_CONFIG_INVALID' });
  }
  for (const [os, osVersion, kernelVersion] of [
    ['Windows', '7', '109.0.0.0'], ['macos', '10.15', '138.0.0.0'], ['macos', '14', '157.0.8103.78'],
  ]) {
    assert.doesNotThrow(() => assertFingerprintConsistency(buildFingerprint({
      id: 'supported-os', os, osVersion, kernelVersion, fingerprintVersion: 2,
    })));
  }
  assert.equal(sanitizeProfile({ id: 'legacy', name: 'Legacy' }).fingerprintVersion, 1);
  for (const value of [0, 3, true, 'next', {}, []]) {
    assert.throws(() => fingerprintVersion(value), /Unsupported fingerprintVersion/);
    assert.throws(() => sanitizeProfile({ id: 'bad', name: 'Bad', fingerprintVersion: value }));
  }
  onHost('linux', () => {
    for (const [os, deviceProfile, i, expected] of legacy) {
      const profile = sanitizeProfile({ id: `legacy-${i}`, name: `Legacy ${i}`, os,
        fingerprintSeed: `seed-${i}`, privacy: { deviceProfile } });
      const fp = buildFingerprint({ ...profile, kernelVersion: '157.0.8103.78' });
      delete fp.consistency;
      // Golden v1 records also contain private transport metadata. Assert the
      // current channel separately, then reconstruct ONLY its historical token
      // and name for the original fixture hash. Every persona value and every
      // other field remains covered by the unchanged golden records.
      if (fp.fontBlobBridge) {
        assert.equal(fp.fontBlobBridge.token, canonicalBridgeToken(fp));
        assert.equal(fp.fontBlobBridge.channelName, '_' + canonicalBridgeToken(fp).slice(0, 16));
        const { fontBlobBridge: _bridge, ...declared } = fp;
        const historicalToken = deriveBridgeToken(declared);
        fp.fontBlobBridge = { ...fp.fontBlobBridge, token: historicalToken,
          channelName: '_' + historicalToken.slice(0, 16) };
      }
      assert.equal(crypto.createHash('sha256').update(JSON.stringify(fp)).digest('hex'), expected,
        `v1 identity changed: ${os}/${deviceProfile}/${i}`);
    }
  });

  const contrastDpr = new Set();
  let total = 0;
  for (const os of ['Windows', 'macos', 'macos_arm', 'Linux', 'Android', 'iOS']) {
    const screens = new Set(), identities = new Set(), gpus = new Set();
    for (let i = 0; i < (os === 'Windows' ? 1000 : 200); i++) {
      const profile = sanitizeProfile({ id: `v2-${os}-${i}`, name: 'New', os,
        fingerprintVersion: 2, fingerprintSeed: `seed-${i}` });
      const fp = buildFingerprint(profile);
      assert.equal(fp.generationVersion, 2);
      assert.deepEqual(fp, buildFingerprint(profile), 'same profile must reproduce exactly');
      assert.ok(fp.consistency.ok, JSON.stringify(fp.consistency));
      assert.ok(!fp.consistency.issues.some((issue) => issue.code === 'hardware-class-incoherent'));
      screens.add(`${fp.screen.width}x${fp.screen.height}`);
      identities.add(JSON.stringify(fp.staticConfig));
      gpus.add(fp.webgl.renderer);
      if (os === 'iOS') {
        assert.equal(fp.webgl.vendor, 'Apple Inc.');
        assert.equal(fp.webgl.renderer, 'Apple GPU');
      }
      if (os === 'Windows' && fp.mediaPreferences?.contrast !== 'no-preference') {
        contrastDpr.add(fp.screen.devicePixelRatio);
      }
      // A saved profile retains its configured identity across OSes. Live GL
      // limits may differ with the actual driver; static selection must not.
      if (i < 30) {
        for (const host of ['win32', 'darwin', 'linux']) {
          assert.deepEqual(onHost(host, () => buildFingerprint(profile)), fp, `${os} on ${host}`);
        }
      }
      total++;
    }
    assert.ok(screens.size >= 3, `${os} screen distribution collapsed`);
    assert.equal(identities.size, os === 'Windows' ? 1000 : 200);
    if (os === 'Windows') assert.deepEqual(gpus, new Set(WINDOWS_PERSONAS.map((p) => p.webgl.renderer)), 'all coherent GPU templates should remain reachable');
  }
  assert.ok(contrastDpr.size >= 2, 'contrast must not force the same DPR');
  const seed = crypto.createHash('sha256').update('domain separation').digest();
  const draw = createFingerprintDraw(seed, 2);
  assert.notEqual(draw('screen.dpr', 24), draw('media.contrast', 82));
  assert.equal(draw('screen.dpr', 0), draw('screen.dpr', 999), 'v2 ignores legacy offsets');

  const profiles = new Map();
  const routes = new ProfileRoutes({ engine: { profiles, sanitizeProfile,
    async syncProfiles(values) { for (const p of values) profiles.set(p.id, p); } } });
  for (const [id, extra, expected] of [['new', {}, 2], ['old', { fingerprint_version: 1 }, 1]]) {
    const response = await routes.routeProfileCreate({ input: { id, name: id, ...extra } });
    assert.ok(profiles.has(id), JSON.stringify(response));
    assert.equal(profiles.get(id).fingerprintVersion, expected);
  }
  await routes.routeProfileCreate({ input: { id: 'future', name: 'Future', fingerprintVersion: 9 } });
  assert.ok(!profiles.has('future'), 'unsupported versions must not be silently downgraded');
  console.log(`fingerprint-generation: OK (240 legacy identities, ${total} v2 profiles, cross-host replay, API versions)`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
