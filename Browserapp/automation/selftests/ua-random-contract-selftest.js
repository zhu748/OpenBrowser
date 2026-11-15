'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ua = require('../user-agent');
const { buildEditorUa } = require('../editor-ua');
const { buildFingerprint, assertFingerprintConsistency } = require('../fingerprint');

function main() {
  const engine = { profiles: new Map([
    ['linux', { os: 'Linux', osVersion: 'ubuntu 22.04', engine: 'chromium' }],
    ['mac', { os: 'macos_arm', osVersion: '14.5', engine: 'chromium' }],
  ]), chooseBrowser: () => ({ version: '159.0.8154.6' }) };
  const originalRandomBytes = crypto.randomBytes;
  crypto.randomBytes = size => Buffer.alloc(size);
  try {
    const linux = buildEditorUa(engine, { profileId: 'linux', random: true });
    assert.equal(linux.os, 'linux');
    assert.equal(linux.metadata.platformVersion, '6.5.0');
    const mac = buildEditorUa(engine, { profileId: 'mac', random: true });
    assert.equal(mac.os, 'macos_arm');
    assert.equal(mac.metadata.architecture, 'arm');
    assert.equal(mac.metadata.platformVersion, '14.5.0');
    const switched = buildEditorUa(engine, { profileId: 'mac', os: 'Windows', random: true });
    assert.equal(switched.os, 'windows');
    assert.equal(switched.metadata.platformVersion, '15.0.0', 'OS switches cannot inherit the old OS release');
    assert.throws(() => buildEditorUa(engine, { os: 'Android', engine: 'firefox' }), { code: 'UA_PLATFORM_UNSUPPORTED' });
  } finally { crypto.randomBytes = originalRandomBytes; }

  const platforms = [
    ['windows', 'Win32', 'Windows'], ['macos', 'MacIntel', 'macOS'],
    ['linux', 'Linux x86_64', 'Linux'], ['android', 'Linux armv8l', 'Android'], ['ios', 'iPhone', 'iOS'],
  ];
  for (const [os, platformNav, platform] of platforms) {
    for (const input of [{ platform: platformNav }, { platform }, { platformNav, chPlatform: platform }]) {
      const built = ua.buildUaProfile({ os, ...input });
      assert.equal(built.platform, platformNav);
      assert.equal(built.metadata.platform, platform);
    }
    assert.deepEqual(ua.randomUaForSeed(4711, { osList: [os.toUpperCase()] }), ua.randomUaForSeed(4711, { osList: [os] }));
  }
  const pinned = ua.buildUaProfile({ os: 'windows', chromeMajor: 159 }).userAgent;
  assertFingerprintConsistency(buildFingerprint({ id: 'explicit-nav', os: 'Windows', kernelVersion: '159.0.8154.6',
    userAgent: pinned, privacy: { fingerprint: { platform: 'Win32' } } }));
  const conflict = buildFingerprint({ id: 'explicit-ch', os: 'Windows', userAgent: pinned,
    privacy: { fingerprint: { clientHints: { platform: 'Linux' } } } });
  assert.equal(conflict.userAgentMetadata.platform, 'Linux');
  assert.throws(() => assertFingerprintConsistency(conflict), { code: 'FINGERPRINT_CONFIG_INVALID' });

  const profileWithHints = (clientHints, source, custom = true, strict = false) => ({
    id: 'ua-hint-aliases', fingerprintSeed: 'fixed-alias-replay', os: 'macOS', kernelVersion: '159.0.8154.6',
    ...(custom ? { userAgent: ua.buildUaProfile({ os: 'macos', chromeMajor: 159 }).userAgent } : {}),
    ...(source === 'profile' ? { clientHints } : {}),
    privacy: { fontListMode: 'real', ...(source === 'privacy' ? { clientHints } : {}),
      fingerprint: { uaStrict: strict, ...(source === 'fingerprint' ? { clientHints } : {}) } },
  });
  for (const source of ['profile', 'privacy', 'fingerprint']) {
    for (const custom of [false, true]) {
      const canonical = buildFingerprint(profileWithHints({ platform_version: '14.5.0', ua_full_version: '159.0.8154.6' }, source, custom));
      for (const fullKey of ['uaFullVersion', 'fullVersion']) {
        const hints = Object.freeze({ platformVersion: '14.5.0', [fullKey]: '159.0.8154.6' });
        assert.deepEqual(buildFingerprint(profileWithHints(hints, source, custom)), canonical, source + ' aliases match canonical fields');
        assert.equal(Object.hasOwn(hints, 'ua_full_version'), false, 'saved configuration is not mutated');
      }
    }
  }
  const obsoleteOs = buildFingerprint(profileWithHints({ platformVersion: '10.15.7' }, 'fingerprint'));
  assert.throws(() => assertFingerprintConsistency(obsoleteOs), { code: 'FINGERPRINT_CONFIG_INVALID' });
  const staleVersion = { uaFullVersion: '158.0.1.2' };
  assert.throws(() => assertFingerprintConsistency(buildFingerprint(profileWithHints(staleVersion, 'fingerprint'))), { code: 'FINGERPRINT_CONFIG_INVALID' });
  const strict = buildFingerprint(profileWithHints(staleVersion, 'fingerprint', true, true));
  assert.equal(strict.userAgentMetadata.fullVersion, '159.0.8154.6', 'strict mode follows the selected kernel over stale aliases');
  assertFingerprintConsistency(strict);
  const precedence = buildFingerprint(profileWithHints({ ua_full_version: '159.0.8154.6', uaFullVersion: '158.0.1.2' }, 'fingerprint'));
  assert.equal(precedence.userAgentMetadata.fullVersion, '159.0.8154.6', 'canonical fields retain precedence');

  for (const seed of [undefined, null, false, '', -1, 0.5, NaN, Infinity, 0x100000000])
    assert.throws(() => ua.randomUaForSeed(seed), { code: 'UA_RANDOM_SEED_INVALID' });
  for (const osList of [[], 'windows', ['unknown'], Array(1)])
    assert.throws(() => ua.randomUaForSeed(0, { osList }), { code: 'UA_RANDOM_OS_INVALID' });
  for (const majors of [[], '159', [0], [159.5], [Infinity], [NaN], [false], [null], Array(1)])
    assert.throws(() => ua.randomUaForSeed(0, { majors }), { code: 'UA_RANDOM_VERSION_INVALID' });
  const options = { osList: Object.freeze(['Linux']), majors: Object.freeze([159]), fullVersion: '159.0.8154.6' };
  assert.deepEqual(ua.randomUaForSeed(0xffffffff, options), ua.randomUaForSeed('4294967295', options));

  const first = ua.buildUaProfile({ os: 'windows', chromeMajor: 159 });
  const expected = structuredClone(first.metadata.brands);
  first.metadata.brands.forEach(item => { item.brand = 'changed'; item.version = '0'; });
  assert.deepEqual(ua.buildUaProfile({ os: 'windows', chromeMajor: 159 }).metadata.brands, expected);
  const input = { brands: [{ brand: 'Custom', version: '159' }], fullVersionList: [{ brand: 'Custom', version: '159.0.1.2' }] };
  const metadata = ua.buildUserAgentMetadata(pinned, input);
  input.brands[0].brand = 'input-mutated';
  metadata.fullVersionList[0].version = 'result-mutated';
  assert.equal(metadata.brands[0].brand, 'Custom');
  assert.equal(input.fullVersionList[0].version, '159.0.1.2');
  console.log('PASS UA random contracts: saved OS/release, platform fields, deterministic draws, invalid pools and profile isolation');
}
try { main(); } catch (error) { console.error(error); process.exitCode = 1; }
