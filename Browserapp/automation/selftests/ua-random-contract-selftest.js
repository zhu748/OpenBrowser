'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ua = require('../user-agent');
const { buildEditorUa } = require('../editor-ua');
const { buildFingerprint, assertFingerprintConsistency } = require('../fingerprint');
const { CURRENT_FINGERPRINT_VERSION } = require('../fingerprint/generation');
const { resolveUaPatchVersion, pickRandomChromeVersion, resolveRandomChromeVersion } = require('../ua-version');
const publishedVersions = require('../data/chrome-release-versions.json').versions;
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFirefoxFingerprint } = require('../firefox-fingerprint');

async function main() {
  for (const [engine, kernel, oldUa, prefix] of [
    ['chromium', '156.0.8078.74', 'Chrome/156.0.8078.74', '156.0.8078.'],
    ['firefox', '156.0', 'Firefox/156.0.74', '156.0.'],
  ]) {
    assert.equal(resolveUaPatchVersion(kernel, oldUa, engine), prefix + '74');
  }
  assert.equal(resolveUaPatchVersion('157.0.8100.1', 'Chrome/156.0.8078.74'), '157.0.8100.74');
  assert.equal(resolveUaPatchVersion('157.0', 'Firefox/156.0.74', 'firefox'), '157.0.74');
  assert.equal(resolveUaPatchVersion('156.0.8078.74', 'Firefox/156.0.74'), null);
  const kernelVersion = '156.0.8078.79';
  for (const [os, pool] of Object.entries(publishedVersions)) {
    for (let major = 113; major <= 160; major++) {
      const versions = pool[major];
      assert.ok(versions?.length > 1, `${os} Chrome ${major} supports randomization`);
      assert.equal(new Set(versions).size, versions.length);
      for (const version of versions) {
        assert.match(version, /^\d+\.\d+\.\d+\.\d+$/);
        assert.ok(version.startsWith(major + '.'));
        assert.equal(resolveRandomChromeVersion(versions[0], os, `Chrome/${version}`), version);
      }
    }
    const versions = pool[156];
    for (const version of versions) {
      const previous = `Chrome/${version}`;
      const picked = pickRandomChromeVersion(kernelVersion, os, previous);
      assert.ok(versions.includes(picked));
      assert.notEqual(picked, version);
      assert.equal(resolveRandomChromeVersion('157.0.8116.1', os, previous), '157.0.8116.1');
    }
    assert.equal(resolveRandomChromeVersion(kernelVersion, os, 'Chrome/156.0.1.2'), kernelVersion);
    assert.equal(resolveRandomChromeVersion('156.0.9900.12', os, 'Chrome/156.0.9900.15'), '156.0.9900.15', 'catalog refresh retains a valid saved fallback');
  }
  for (const os of ['windows', 'macos', 'macos_arm', 'linux']) {
    assert.ok(publishedVersions[os][160].includes('160.0.8184.0'), `${os} includes the listed Chrome for Testing build`);
    assert.equal(resolveRandomChromeVersion('160.0.8171.0', os, 'Chrome/160.0.8184.0'), '160.0.8184.0');
  }
  for (const [major, version] of [[146, '146.0.7680.165'], [147, '147.0.7727.117'], [151, '151.0.7922.138'], [156, '156.0.8078.80']]) {
    assert.ok(publishedVersions.linux[major].includes(version), `Linux includes the downloadable build ${version}`);
  }
  const nextMajor = 1 + Math.max(...Object.values(publishedVersions).flatMap(Object.keys).map(Number));
  for (const [kernel, firstPatch, lastPatch] of [[`${nextMajor}.0.8200.2`, 0, 10], [`${nextMajor + 1}.0.8224.112`, 104, 120]]) {
    const prefix = kernel.slice(0, kernel.lastIndexOf('.') + 1);
    const future = { profiles: new Map(), chooseBrowser: () => ({ version: kernel }) };
    for (const os of ['Windows', 'Android', 'iOS']) {
      let previousUserAgent = `Chrome/${kernel}`;
      for (let i = 0; i < 4; i += 1) {
        const generated = await buildEditorUa(future, { os, random: true, previousUserAgent });
        assert.ok(generated.chromeFull.startsWith(prefix));
        const patch = Number(generated.chromeFull.slice(prefix.length));
        assert.ok(Number.isInteger(patch) && patch >= firstPatch && patch <= lastPatch);
        assert.notEqual(ua.parseChromeVersion(previousUserAgent).full, generated.chromeFull);
        const saved = sanitizeProfile({ id: `future-ua-${i}`, name: 'Future UA', os, userAgent: generated.userAgent,
          fingerprintVersion: CURRENT_FINGERPRINT_VERSION,
          privacy: { fingerprint: { uaGenerated: true, uaVersionRandomized: true, clientHints: generated.clientHints } } });
        const runtime = buildFingerprint({ ...saved, kernelVersion: kernel });
        assert.equal(runtime.userAgent, generated.userAgent);
        assert.equal(runtime.userAgentMetadata.fullVersion, generated.chromeFull);
        assertFingerprintConsistency(runtime);
        previousUserAgent = generated.userAgent;
      }
    }
    assert.equal(resolveRandomChromeVersion(kernel, 'windows', `Chrome/${prefix}${lastPatch + 1}`), kernel);
  }
  const incompleteVersion = `${nextMajor}.0`;
  assert.equal(pickRandomChromeVersion(incompleteVersion, 'windows'), incompleteVersion, 'an incomplete kernel version has no known build branch');
  const firefoxEngine = { profiles: new Map(), chooseBrowser: () => ({ version: '160.0.2' }) };
  const systemBrowser = { path: '/fixture/chrome', independent: false };
  const systemUa = await buildEditorUa({
    profiles: new Map(),
    chooseBrowser: () => systemBrowser,
    kernelManager: { async readInstalledVersion(browser) {
      assert.equal(browser, systemBrowser);
      return kernelVersion;
    } },
  }, { os: 'Windows', random: true });
  assert.equal(systemUa.kernelVersion, kernelVersion);
  assert.match(systemUa.userAgent, /Chrome\/156\./);
  for (let i = 0; i < 16; i++) {
    const native = await buildEditorUa(firefoxEngine, { engine: 'firefox', os: 'Windows', random: true, previousUserAgent: 'Firefox/160.0.73' });
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
    ['pinned-mac', { os: 'macOS', fingerprintVersion: 3,
      privacy: { fingerprint: { clientHints: { architecture: 'arm', platform_version: '15.7.0' } } } }],
    ['iphone', { os: 'iOS', osVersion: 'iOS 27', fingerprintVersion: 3,
      privacy: { fingerprint: { clientHints: { deviceModel: 'iPhone 18 Pro Max', platform_version: '27.0.0' } } } }],
    ['old-iphone', { os: 'iOS', osVersion: '18', fingerprintVersion: 2,
      privacy: { fingerprint: { clientHints: { deviceModel: 'iPhone 16', platform_version: '18.0.0' } } } }],
  ]), chooseBrowser: () => ({ version: kernelVersion }) };
  const originalRandomBytes = crypto.randomBytes;
  crypto.randomBytes = size => Buffer.alloc(size);
  try {
    const linux = await buildEditorUa(engine, { profileId: 'linux', random: true });
    assert.equal(linux.os, 'linux');
    assert.equal(linux.metadata.platformVersion, '');
    const mac = await buildEditorUa(engine, { profileId: 'mac', random: true });
    assert.equal(mac.os, 'macos_arm');
    assert.equal(mac.metadata.architecture, 'arm');
    assert.equal(mac.metadata.platformVersion, '14.5.0');
    const pinnedMac = await buildEditorUa(engine, { profileId: 'pinned-mac', os: 'macOS', random: true });
    assert.equal(pinnedMac.os, 'macos_arm');
    assert.equal(pinnedMac.metadata.architecture, 'arm');
    assert.equal(pinnedMac.metadata.platformVersion, '15.7.0');
    const switched = await buildEditorUa(engine, { profileId: 'mac', os: 'Windows', random: true });
    assert.equal(switched.os, 'windows');
    assert.equal(switched.metadata.platformVersion, '15.0.0', 'OS switches cannot inherit the old OS release');
    const runtime = buildFingerprint({ ...sanitizeProfile({ id: 'editor-random-version', name: 'Generated UA', os: 'Windows',
      userAgent: switched.userAgent, privacy: { fingerprint: { uaGenerated: switched.kernelBound,
        uaVersionRandomized: switched.uaVersionRandomized, uaReduced: switched.uaReduced, clientHints: switched.clientHints } } }),
      kernelVersion });
    assert.equal(runtime.userAgent, switched.userAgent);
    assert.equal(runtime.userAgentMetadata.fullVersion, switched.chromeFull);
    assert.ok(publishedVersions.windows[156].includes(switched.chromeFull));
    assert.equal(ua.parseChromeVersion(switched.userAgent).full, switched.chromeFull);
    assert.equal(switched.uaVersionRandomized, true);
    assertFingerprintConsistency(runtime);
    const ios = await buildEditorUa(engine, { profileId: 'iphone', os: 'iOS', random: true, chromeMajor: 148 });
    assert.equal(ios.os, 'ios');
    assert.equal(ios.platform, 'iPhone');
    assert.equal(ios.clientHints.deviceModel, 'iPhone 18 Pro Max');
    assert.ok(publishedVersions.ios[156].includes(ios.chromeFull));
    assert.equal(ios.kernelBound, true);
    const rerolled = await buildEditorUa(engine, { profileId: 'old-iphone', os: 'iOS', osVersion: 'iOS 27',
      fingerprintVersion: '3', resetFingerprint: true, random: true, chromeMajor: 148 });
    assert.match(rerolled.userAgent, /iPhone OS 27_0/);
    await assert.rejects(buildEditorUa(engine, { os: 'Android', engine: 'firefox' }), { code: 'UA_PLATFORM_UNSUPPORTED' });
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
main().catch(error => { console.error(error); process.exitCode = 1; });
