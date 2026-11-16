'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ua = require('../user-agent');
const { buildEditorUa } = require('../editor-ua');
const { buildFingerprint, assertFingerprintConsistency } = require('../fingerprint');
const { randomUaPatchVersion, resolveUaPatchVersion } = require('../ua-version');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFirefoxFingerprint } = require('../firefox-fingerprint');

function main() {
  for (const [engine, kernel, oldUa, prefix] of [
    ['chromium', '156.0.8078.74', 'Chrome/156.0.8078.74', '156.0.8078.'],
    ['firefox', '156.0', 'Firefox/156.0.74', '156.0.'],
  ]) {
    const versions = new Set();
    for (let index = 0; index < 254; index++) {
      const version = randomUaPatchVersion(kernel, { engine, previousUserAgent: oldUa,
        randomInt: size => { assert.equal(size, 254); return index; } });
      assert.ok(version.startsWith(prefix));
      assert.notEqual(version, prefix + '74');
      versions.add(version);
    }
    assert.equal(versions.size, 254, 'the random pool covers all other patches, rather than two text formats');
    assert.ok(versions.has(prefix + '1') && versions.has(prefix + '255'));
    assert.equal(resolveUaPatchVersion(kernel, oldUa, engine), prefix + '74');
  }
  assert.equal(resolveUaPatchVersion('157.0.8100.1', 'Chrome/156.0.8078.74'), '157.0.8100.74');
  assert.equal(resolveUaPatchVersion('157.0', 'Firefox/156.0.74', 'firefox'), '157.0.74');
  assert.equal(resolveUaPatchVersion('156.0.8078.74', 'Firefox/156.0.74'), null);
  assert.throws(() => randomUaPatchVersion('unknown'));
  const firefoxEngine = { profiles: new Map(), chooseBrowser: () => ({ version: '160.0.2' }) };
  for (let i = 0; i < 16; i++) {
    const native = buildEditorUa(firefoxEngine, { engine: 'firefox', os: 'Windows', random: true, previousUserAgent: 'Firefox/160.0.73' });
    assert.ok(native.userAgent.endsWith('Firefox/160.0'));
    assert.equal(native.uaPatchRandomized, false);
    assert.equal(native.uaReduced, false);
  }
  const oldGenerated = { id: 'firefox-native-policy', name: 'Firefox native policy', engine: 'firefox', os: 'Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:160.0) Gecko/20100101 Firefox/160.0.73',
    fingerprintSeed: 'existing-seed', fingerprintVersion: 1,
    privacy: { fingerprint: { uaGenerated: true, uaPatchRandomized: true } } };
  const normalized = sanitizeProfile(oldGenerated);
  assert.ok(normalized.userAgent.endsWith('Firefox/160.0'));
  assert.deepEqual(sanitizeProfile(normalized), normalized, 'native UA normalization is idempotent');
  assert.equal(normalized.privacy.fingerprint.uaPatchRandomized, false);
  assert.equal(normalized.fingerprintSeed, 'existing-seed');assert.equal(normalized.fingerprintVersion, 1);
  const beforeMigration = buildFirefoxFingerprint({ ...normalized, userAgent: oldGenerated.userAgent,
    privacy: { ...normalized.privacy, fingerprint: { ...normalized.privacy.fingerprint, uaPatchRandomized: true } } }, '160.0.2');
  const afterMigration = buildFirefoxFingerprint(normalized, '160.0.2');
  for (const key of ['seed', 'canvas', 'audio', 'clientRects', 'webgl'])
    assert.deepEqual(afterMigration[key], beforeMigration[key], 'UA format migration preserves ' + key);
  assert.equal(sanitizeProfile({ ...oldGenerated, privacy: { fingerprint: { uaGenerated: false } } }).userAgent, oldGenerated.userAgent, 'manual UA remains user-owned');
  const overridden = sanitizeProfile({ ...oldGenerated, privacy: { fingerprint: { ...oldGenerated.privacy.fingerprint, userAgent: oldGenerated.userAgent + ' Custom' } } });
  assert.equal(overridden.privacy.fingerprint.userAgent, oldGenerated.userAgent + ' Custom');
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
    const runtime = buildFingerprint({ id: 'editor-random-patch', os: 'Windows', userAgent: switched.userAgent, kernelVersion: '159.0.8154.6',
      privacy: { fingerprint: { uaGenerated: true, uaPatchRandomized: switched.uaPatchRandomized, clientHints: switched.clientHints } } });
    assert.equal(runtime.userAgent, switched.userAgent);
    assert.equal(runtime.userAgentMetadata.fullVersion, switched.chromeFull);
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
