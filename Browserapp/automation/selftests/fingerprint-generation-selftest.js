'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { buildFingerprint, assertFingerprintConsistency } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { CURRENT_FINGERPRINT_VERSION, fingerprintVersion, createFingerprintDraw } = require('../fingerprint/generation');
const { ProfileRoutes } = require('../api/profile-routes');
const { normalizeProfileInput } = require('../api/input');
const { WINDOWS_PERSONAS } = require('../device-personas');
const { canonicalBridgeToken } = require('../fingerprint/shared');
const { deriveBridgeToken } = require('../font-placeholder');
const { mediaLabelsFromFp } = require('../kernel-init-sync');
const { fromRoxy, toRoxy } = require('../../rebuild/profile-dto');
const legacy = require('./fixtures/fingerprint-v1-linux.json');
const desktopCatalog = require('../data/desktop-personas-v3.json');
const mobileCatalog = require('../data/mobile-personas-v3.json');
const desktopAdditions = require('../data/desktop-personas-v4.json');
const mobileAdditions = require('../data/mobile-personas-v4.json');

function onHost(platform, run) {
  const original = Object.getOwnPropertyDescriptor(process, 'platform');
  try { Object.defineProperty(process, 'platform', { value: platform }); return run(); }
  finally { Object.defineProperty(process, 'platform', original); }
}

async function main() {
  for (const [privacy, mode, value] of [
    [{ dntMode: 'on', dnt: false }, 'on', '1'],
    [{ dntMode: 'off', dnt: true }, 'off', null],
    [{ dntMode: 'default', dnt: true }, 'default', null],
    [{ dnt: '1' }, 'on', '1'],
    [{ dnt: '0' }, 'off', null],
    [{ dnt: 'false' }, 'off', null],
    [{}, 'default', null],
  ]) {
    const raw = { id: 'dnt-settings', name: 'DNT', privacy };
    const saved = sanitizeProfile(raw);
    assert.deepEqual([saved.privacy.dntMode, saved.privacy.dnt], [mode, mode === 'on']);
    assert.equal(buildFingerprint(raw).doNotTrack, value);
    assert.equal(buildFingerprint(saved).doNotTrack, value);
  }
  const dntDefault = sanitizeProfile({ id: 'dnt-workbench', name: 'DNT', privacy: { dntMode: 'default' } });
  assert.equal(fromRoxy({ doNotTrack: false }, dntDefault).privacy.dntMode, 'default', 'an unchanged boolean round-trip preserves default');
  const dntOn = fromRoxy({ doNotTrack: true }, dntDefault);
  assert.equal(dntOn.privacy.dntMode, 'on');
  const dntOff = fromRoxy({ doNotTrack: false }, dntOn);
  assert.equal(dntOff.privacy.dntMode, 'off');
  assert.equal(toRoxy(dntOff).doNotTrack, false);
  const apiDisable = normalizeProfileInput({ do_not_track: 'false', privacy: dntOn.privacy });
  assert.equal(apiDisable.privacy.dntMode, 'off');
  assert.equal(apiDisable.privacy.dnt, false);
  const apiEnable = normalizeProfileInput({ doNotTrack: 'true', privacy: dntOff.privacy });
  assert.equal(apiEnable.privacy.dntMode, 'on');
  assert.equal(apiEnable.privacy.dnt, true);

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
  const storedUa = buildFingerprint({
    id: 'unsupported-os-with-saved-ua', os: 'Windows', osVersion: 'Windows 7',
    fingerprintVersion: 3, kernelVersion: '159.0.8154.6',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Safari/537.36',
    privacy: { fingerprint: { uaGenerated: true } },
  });
  assert.equal(storedUa.osVersion, 'Windows 7');
  assert.throws(() => assertFingerprintConsistency(storedUa), /last supporting major: 109/);
  assert.equal(sanitizeProfile({ id: 'legacy', name: 'Legacy' }).fingerprintVersion, 1);
  for (const value of [0, 5, true, 'next', {}, []]) {
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

  for (const fingerprintVersion of [1, 2, 3, CURRENT_FINGERPRINT_VERSION]) {
    const input = { id: 'optional-marks', name: 'Optional marks', os: 'Linux', fingerprintSeed: 'fixed-fixture', fingerprintVersion };
    const original = buildFingerprint(input);
    for (const missing of [null, '', '  ', false, true, 0, '0']) {
      const profile = { ...input, privacy: {
        fingerprint: { canvasId: missing, webglId: missing, audioId: missing, clientRectsId: missing },
      } };
      const candidate = buildFingerprint(profile);
      for (const field of ['canvas', 'webgl', 'audio', 'clientRects']) assert.equal(candidate[field].mark, original[field].mark);
      const saved = sanitizeProfile(profile).privacy.fingerprint;
      for (const field of ['canvasId', 'webglId', 'audioId', 'clientRectsId']) assert.equal(saved[field], undefined);
    }
    const explicit = buildFingerprint({ ...input, privacy: { fingerprint: { canvasId: '-2', audioId: 1.5 } } });
    assert.equal(explicit.canvas.mark, -2);
    assert.equal(explicit.audio.mark, 1.5);
    assert.equal(explicit.staticConfig.canvasMark, explicit.canvas.mark);
    assert.equal(explicit.staticConfig.audioFp, explicit.audio.mark);

    for (const value of [null, '', '  ', false, true, [], {}]) {
      const config = { ...input, privacy: { cores: value, memory: value,
        fingerprint: { hardwareConcurrency: value, deviceMemory: value } } };
      for (const fp of [buildFingerprint(config), buildFingerprint(sanitizeProfile(config))]) {
        assert.equal(fp.hardwareConcurrency, original.hardwareConcurrency);
        assert.equal(fp.deviceMemory, original.deviceMemory);
      }
    }
    const aliases = { ...input, privacy: { fingerprint: { hardwareConcurrency: '4.5', deviceMemory: '6' } } };
    for (const fp of [buildFingerprint(aliases), buildFingerprint(sanitizeProfile(aliases))]) {
      assert.equal(fp.hardwareConcurrency, 5);
      assert.equal(fp.deviceMemory, 8);
      assert.equal(fp.staticConfig.hardwareConcurrency, 5);
      assert.equal(fp.staticConfig.deviceMemory, 8);
      assertFingerprintConsistency(fp);
    }
    const native = buildFingerprint({ ...aliases, privacy: { ...aliases.privacy, cores: '0', memory: 0 } });
    assert.equal(native.hardwareConcurrency, null);
    assert.equal(native.deviceMemory, null);
  }

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

  const kernelVersion = '159.0.8154.6';
  function current(os, i, osVersion, version = 3) {
    return buildFingerprint({ ...sanitizeProfile({ id: `catalog-${os}`, name: 'Catalog', os, osVersion,
      fingerprintVersion: version, fingerprintSeed: `catalog-${i}` }), kernelVersion });
  }
  for (const [catalog, extensions] of [[desktopCatalog, desktopAdditions], [mobileCatalog, mobileAdditions]]) {
    const sources = { ...catalog.sources, ...extensions.sources };
    const devices = [...catalog.devices, ...extensions.devices];
    for (const device of devices) {
      for (const reference of [device.source].flat()) assert.match(sources[reference], /^https:\/\//);
    }
  }
  const desktopShape = ({ cores, width, height, dpr, gpu }) => JSON.stringify([cores, width, height, dpr, gpu]);
  for (const version of [3, CURRENT_FINGERPRINT_VERSION]) {
    const desktopDevices = version === 3 ? desktopCatalog.devices : [...desktopCatalog.devices, ...desktopAdditions.devices];
    const mobileDevices = version === 3 ? mobileCatalog.devices : [...mobileCatalog.devices, ...mobileAdditions.devices];
    const reach = new Set();
    for (const [inputOs, platforms] of [['Windows', ['windows']], ['macos', ['macos', 'macos_arm']],
      ['macos_arm', ['macos_arm']], ['Linux', ['linux']], ['Android', ['android']], ['iOS', ['ios']]]) {
      const rows = desktopDevices.filter(device => platforms.includes(device.platform));
      const webUas = new Set();
      for (let i = 0; i < 320; i++) {
        const fp = current(inputOs, i, undefined, version);
        assertFingerprintConsistency(fp);
        assert.equal(fp.generationVersion, version);
        assert.ok(platforms.includes(fp.os));
        assert.equal(fp.userAgentMetadata.fullVersion, kernelVersion);
        if (version >= 4) {
          const camera = fp.mediaDevices.devices.find(device => device.kind === 'videoinput').label;
          assert.ok(!/\([0-9a-f]{4}:[0-9a-f]{4}\)/i.test(camera));
          assert.deepEqual(mediaLabelsFromFp(fp).video_input_labels, [camera]);
          if (fp.os === 'ios') assert.match(camera, /^(Front|Back) Camera$/);
        }
        webUas.add(fp.userAgent);
        if (fp.mobileDevice) {
          const row = mobileDevices.find(device => device.model === fp.clientHints.deviceModel);
          assert.ok(row && row.osVersions.includes(fp.mobileDevice.osVersion), JSON.stringify(fp.mobileDevice));
          assert.deepEqual([fp.hardwareConcurrency, fp.screen.width, fp.screen.height, fp.screen.devicePixelRatio],
            [row.cores, row.width, row.height, row.dpr]);
          reach.add(row.model);
          continue;
        }
        const row = rows.find(device => device.platform === fp.os && device.logicalProcessors === fp.hardwareConcurrency
          && Math.round(device.panel[0] / device.dpr) === fp.screen.width && Math.round(device.panel[1] / device.dpr) === fp.screen.height
          && device.dpr === fp.screen.devicePixelRatio && fp.webgl.renderer.includes(device.gpu.name));
        assert.ok(row, `${fp.os} ${JSON.stringify(fp.screen)} ${fp.webgl.renderer}`);
        reach.add(fp.os + desktopShape({ cores: fp.hardwareConcurrency, width: fp.screen.width, height: fp.screen.height,
          dpr: fp.screen.devicePixelRatio, gpu: row.gpu.name }));
        if (row.macOS) assert.ok(row.macOS.includes(fp.userAgentMetadata.platformVersion)
          || rows.some(other => other.platform === row.platform && other.gpu.name === row.gpu.name
            && other.macOS.includes(fp.userAgentMetadata.platformVersion)));
        if (fp.os === 'linux') assert.equal(fp.userAgentMetadata.platformVersion, '');
      }
      if (inputOs === 'iOS') assert.equal(webUas.size, 5);
      else assert.deepEqual([...webUas].map(ua => ua.match(/Chrome\/([\d.]+)/)?.[1]), [kernelVersion.split('.')[0] + '.0.0.0']);
    }
    const expectedReach = new Set(mobileDevices.map(device => device.model));
    for (const row of desktopDevices)
      expectedReach.add(row.platform + desktopShape({ cores: row.logicalProcessors, width: Math.round(row.panel[0] / row.dpr),
        height: Math.round(row.panel[1] / row.dpr), dpr: row.dpr, gpu: row.gpu.name }));
    assert.deepEqual(reach, expectedReach, 'all projected catalog devices are reachable');
  }
  assert.equal(current('Android', 1, 'Android 17').mobileDevice.osVersion, 17);
  assert.equal(current('iOS', 1, 'iOS 27').mobileDevice.osVersion, 27);
  const mac27 = current('macos', 1, 'macOS 27');
  assert.equal(mac27.os, 'macos_arm');
  assert.equal(mac27.userAgentMetadata.platformVersion, '27.0.0');
  assert.throws(() => assertFingerprintConsistency(current('macos', 1, 'macOS 12')), /last supporting major: 150/);
  assert.deepEqual(current('Android', 1, 'all').mobileDevice, current('Android', 1).mobileDevice);
  assert.throws(() => current('iOS', 1, 'iOS 25'), /不兼容/);

  const profiles = new Map();
  const routes = new ProfileRoutes({ engine: { profiles, sanitizeProfile,
    async commitProfiles(values, { prepareReply }) {
      const reply = prepareReply(values);
      for (const p of values) profiles.set(p.id, p);
      return reply;
    },
  } });
  for (const [id, extra, expected] of [['new', {}, CURRENT_FINGERPRINT_VERSION], ['old', { fingerprint_version: 1 }, 1]]) {
    const response = await routes.routeProfileCreate({ input: { id, name: id, ...extra } });
    assert.ok(profiles.has(id), JSON.stringify(response));
    assert.equal(profiles.get(id).fingerprintVersion, expected);
  }
  await routes.routeProfileCreate({ input: { id: 'future', name: 'Future', fingerprintVersion: 9 } });
  assert.ok(!profiles.has('future'), 'unsupported versions must not be silently downgraded');
  console.log(`fingerprint-generation: OK (240 legacy identities, ${total} v2 profiles, 1920 each for v3/v4, cross-host replay, API versions)`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
