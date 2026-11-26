'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { BrowserEngine } = require('../../engine');
const { LocalService } = require('../../rebuild/local-service');
const { fromRoxy } = require('../../rebuild/profile-dto');
const { buildFirefoxFingerprint } = require('../firefox-fingerprint');
const { fontsForOs } = require('../fingerprint/shared');
const { CURRENT_FINGERPRINT_VERSION } = require('../fingerprint/generation');
const { writeOpenBrowserKernelInit, loadInitObject } = require('../kernel-init-sync');
const { parseChromeVersion } = require('../user-agent');
const publishedVersions = require('../data/chrome-release-versions.json').versions;

function identity(fp) {
  return { seed: fp.seed, canvas: fp.canvas, audio: fp.audio, clientRects: fp.clientRects,
    connection: fp.connection, screen: fp.screen, mediaDevices: fp.mediaDevices };
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-preview-identity-'));
  try {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    const chromiumVersions = { 160: '160.0.8182.0', 161: '161.0.8200.2', 162: '162.0.8224.112' };
    engine.chooseBrowser = profile => ({ version: profile.engine === 'firefox'
      ? (profile.engineVersion === '158' ? '158.0' : '159.0')
      : (chromiumVersions[profile.engineVersion] || '159.0.8154.6') });
    const service = new LocalService({ engine, root, dialog: {}, window: () => null });
    for (const coreType of ['Chrome', 'Firefox']) {
      const selected = { os: 'Windows', osVersion: 'Windows 11', coreType, coreVersion: '159' };
      const [compact] = await service.request('fingerprint:preview', { ...selected, includeRuntime: false });
      assert.equal(Object.hasOwn(compact, '_openbrowser'), false, 'the editor can omit the runtime payload');
      const compactProfile = await service.request('profiles:create', { ...selected, ...compact });
      assert.equal(compactProfile.id, compact._fingerprintDraft.profileId);
      assert.equal(compactProfile.userAgent, compact.userAgent);
      assert.equal(compactProfile.fingerprintSeed, compact._fingerprintDraft.seed);
      assert.equal(compactProfile.fingerprintVersion, CURRENT_FINGERPRINT_VERSION);
      assert.equal(compact._fingerprintDraft.uaPatchRandomized, false);
      if (coreType === 'Chrome') {
        assert.match(compact.userAgent, /Chrome\/159\.0\.0\.0 /);
        assert.equal(compact._fingerprintDraft.clientHints.ua_full_version, '159.0.8154.6');
        assert.equal(compactProfile.privacy.cores, null);
        assert.equal(compactProfile.privacy.memory, null);
        assert.equal(compactProfile.privacy.fingerprint.webglRenderer, '');
      }
      const [preview] = await service.request('fingerprint:preview', selected);
      const payload = { ...selected, ...preview, windowName: coreType + ' preview' };
      const row = await service.request('profiles:create', payload);
      assert.equal(row.id, preview._fingerprintDraft.profileId);
      assert.deepEqual(identity(engine.fingerprintFor(row.id)), identity(preview._openbrowser), 'create keeps every derived noise value');
      const before = engine.profileForEdit(row.id);
      const replay = await service.request('profiles:create', payload);
      assert.notEqual(replay.id, row.id, 'template/double-submit cannot overwrite the first window');
      assert.notEqual(engine.fingerprintFor(replay.id).seed, preview._openbrowser.seed, 'reused templates get distinct identities');
      assert.deepEqual(engine.profileForEdit(row.id), before, 'creation did not mutate a preexisting window');
      const [copy] = await service.request('profiles:clone', { ids: [row.id] });
      assert.notEqual(engine.fingerprintFor(copy.id).seed, preview._openbrowser.seed, 'clones retain per-window separation');

      const live = engine.fingerprintFor(row.id);
      engine.running.set(row.id, { fingerprint: live });
      let editPreview;
      try {
        [editPreview] = await service.request('fingerprint:preview', { ...selected, profileId: row.id });
        assert.notEqual(editPreview._openbrowser.seed, live.seed, 'an active editor previews the proposed identity, not its live snapshot');
        assert.equal(engine.fingerprintFor(row.id).seed, live.seed, 'the running identity is not mutated by sampling');
      } finally { engine.running.delete(row.id); }
      assert.equal(editPreview._fingerprintDraft.profileId, row.id);
      await service.request('profiles:update', { ...selected, ...editPreview, id: row.id, rev: before.rev });
      assert.deepEqual(identity(engine.fingerprintFor(row.id)), identity(editPreview._openbrowser), 'editing uses the persisted storage ID');

      const fingers = await service.request('fingerprint:preview', { ...selected, count: 2 });
      const batch = await service.request('profiles:create-batch', { ...selected, createCount: 2, fingerDetail: fingers });
      for (let i = 0; i < batch.length; i++) {
        assert.equal(batch[i].id, fingers[i]._fingerprintDraft.profileId);
        assert.deepEqual(identity(engine.fingerprintFor(batch[i].id)), identity(fingers[i]._openbrowser));
      }
      const [fresh] = await service.request('fingerprint:preview', selected);
      const collision = await service.request('profiles:create-batch', { ...selected, createCount: 2, fingerDetail: [fresh, fresh] });
      assert.equal(collision[0].id, fresh._fingerprintDraft.profileId);
      assert.notEqual(collision[0].id, collision[1].id, 'duplicate preview UUIDs in one batch cannot collapse rows');
      const imports = await service.request('fingerprint:preview', { ...selected, count: 2 });
      await service.request('profiles:import', { ...selected, fingerDetail: imports,
        excelData: [{ windowName: 'import 1', os: 'Windows' }, { windowName: 'import 2', os: 'Windows' }] });
      for (const imported of imports)
        assert.equal(engine.fingerprintFor(imported._fingerprintDraft.profileId).seed, imported._openbrowser.seed);
    }
    const legacyGraphics = fromRoxy({ os: 'Windows', hardwareConcurrent: '6', deviceMemory: '4' });
    legacyGraphics.privacy.fingerprint = {
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) Graphics Direct3D11, D3D11)',
    };
    await engine.syncProfiles([legacyGraphics]);
    const [differentPlatform] = await service.request('fingerprint:preview', {
      profileId: legacyGraphics.id, os: 'macOS', osVersion: '27', webGLInfo: 1,
    });
    assert.match(differentPlatform.webGLRender, /Metal/);
    assert.equal(differentPlatform.hardwareConcurrent, '6');
    assert.equal(differentPlatform.deviceMemory, '4');
    const changed = await service.request('profiles:update', { ...differentPlatform, id: legacyGraphics.id,
      os: 'macOS', osVersion: '27', webGLInfo: 1, rev: engine.profileForEdit(legacyGraphics.id).rev });
    assert.equal(changed.privacy.fingerprint.webglRenderer, '');
    assert.deepEqual(engine.fingerprintFor(changed.id).webgl, differentPlatform._openbrowser.webgl);
    const [automatic] = await service.request('fingerprint:preview', {
      profileId: changed.id, hardwareConcurrent: '', deviceMemory: '',
    });
    const reset = await service.request('profiles:update', { ...automatic, id: changed.id,
      hardwareConcurrent: '', deviceMemory: '', rev: engine.profileForEdit(changed.id).rev });
    assert.equal(reset.privacy.cores, null);
    const legacyModes = fromRoxy({ os: 'Windows', canvas: true, webGLInfo: 1, webGpu: 'real' });
    legacyModes.privacy.fingerprint = { canvas: 'real', webgl: 'real', audio: 'muted', clientRects: 'real',
      speech: 'blocked', webglMeta: 'custom', webgpu: 'blocked', webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) Graphics Direct3D11, D3D11)' };
    await engine.syncProfiles([legacyModes]);
    const readLegacy = () => service.request('profiles:read', { id: legacyModes.id, hardwarePreview: true });
    const edit = await readLegacy();
    assert.deepEqual([edit.canvas, edit.webGL, edit.audioContext, edit.clientRects, edit.speechVoices, edit.webGLInfo, edit.webGpu],
      [false, false, true, false, true, 2, 'block']);
    const saveLegacy = changes => service.request('profiles:update', {
      ...edit, ...changes, id: legacyModes.id, rev: engine.profileForEdit(legacyModes.id).rev });
    await saveLegacy({ windowRemark: 'keep legacy policies' });
    const unchanged = engine.fingerprintFor(legacyModes.id);
    assert.deepEqual([unchanged.canvas.mode, unchanged.audio.mode, unchanged.speech.mode, unchanged.webgl.metaMode, unchanged.webgpu.mode],
      ['real', 'muted', 'blocked', 'custom', 'blocked']);
    const controlsAfterEdit = { canvas: true, webGL: true, audioContext: false, clientRects: true, speechVoices: false,
      webGLInfo: 0, webGpu: 'real' };
    const [switched] = await service.request('fingerprint:preview', { profileId: legacyModes.id, ...controlsAfterEdit });
    await saveLegacy({ ...switched, ...controlsAfterEdit });
    const modes = fp => [fp.canvas.mode, fp.webgl.mode, fp.audio.mode, fp.clientRects.mode, fp.speech.mode, fp.webgl.metaMode, fp.webgpu.mode];
    assert.deepEqual(modes(switched._openbrowser), ['noise', 'noise', 'real', 'noise', 'real', 'real', 'real']);
    assert.deepEqual(modes(engine.fingerprintFor(legacyModes.id)), modes(switched._openbrowser));
    const shape = fromRoxy({ canvas: false, audioContext: false, webGL: false }, { ...legacyModes,
      privacy: { ...legacyModes.privacy, fingerprint: { canvas: { noise: 220 }, audio: { sampleRate: 48000 },
        webgl: { renderer: 'Legacy vendor data' } } } });
    for (const key of ['canvas', 'audio', 'webgl']) assert.equal(typeof shape.privacy.fingerprint[key], 'object');
    for (const [os, family] of [['Linux', 'linux'], ['macOS', 'macos']]) {
      const [fontPreview] = await service.request('fingerprint:preview', { os, fontType: true });
      assert.deepEqual(fontPreview.fontList, fontsForOs(family));
      assert.equal(fontPreview._fingerprintDraft.generatedFonts, fontPreview.font);
      const fontProfile = await service.request('profiles:create', { os, fontType: true, ...fontPreview });
      assert.ok(!fontProfile.privacy.fingerprint.fonts?.length);
      assert.deepEqual(engine.fingerprintFor(fontProfile.id).fonts.list, fontPreview.fontList);
      const explicitFonts = await service.request('profiles:create', { os, fontType: true, ...fontPreview, font: 'Custom Test Font' });
      assert.deepEqual(engine.fingerprintFor(explicitFonts.id).fonts.list, ['Custom Test Font']);
    }
    assert.equal(reset.privacy.memory, null);
    assert.equal(engine.fingerprintFor(reset.id).hardwareConcurrency, automatic._openbrowser.hardwareConcurrency);
    const systemHardware = { os: 'Windows', hardwareConcurrent: '0', deviceMemory: '0' };
    const systemDrafts = await service.request('fingerprint:preview', { ...systemHardware, count: 2 });
    const systemRows = await service.request('profiles:create-batch', { ...systemHardware, createCount: 2, fingerDetail: systemDrafts });
    assert.ok(systemRows.every(row => row.privacy.cores === 0 && row.privacy.memory === 0));
    await assert.rejects(service.request('fingerprint:preview', { os: 'macOS', osVersion: '12' }),
      { code: 'FINGERPRINT_CONFIG_INVALID' });
    const display = { os: 'Android', resolutionType: true, resolutionX: '320', resolutionY: '580' };
    const [customDisplay] = await service.request('fingerprint:preview', display);
    assert.deepEqual([customDisplay._openbrowser.screen.width, customDisplay._openbrowser.screen.height], [320, 580]);
    const savedDisplay = await service.request('profiles:create', { ...display, ...customDisplay });
    const restoredDisplay = await service.request('profiles:update', {
      id: savedDisplay.id, rev: engine.profileForEdit(savedDisplay.id).rev, resolutionType: false,
    });
    assert.equal(restoredDisplay.privacy.fingerprint.screenWidth, 320, 'the custom selection is retained while disabled');
    const effective = engine.fingerprintFor(savedDisplay.id);
    assert.ok(effective.screen.width > 320 && effective.screen.height > 580);
    const [followed] = await service.request('fingerprint:preview', { profileId: savedDisplay.id,
      resolutionType: false, reuseDraft: customDisplay._fingerprintDraft });
    assert.deepEqual(followed._openbrowser.screen, effective.screen);
    const again = await service.request('profiles:update', {
      id: savedDisplay.id, rev: engine.profileForEdit(savedDisplay.id).rev, resolutionType: true,
    });
    assert.deepEqual([again.privacy.fingerprint.screenWidth, again.privacy.fingerprint.screenHeight], [320, 580]);
    const restoredSize = engine.fingerprintFor(again.id);
    assert.deepEqual([restoredSize.screen.width, restoredSize.screen.height], [320, 580]);
    const iosBefore = engine.profiles.size;
    const [iosImport] = await service.request('fingerprint:preview', { os: 'IOS', useLatestCore: true });
    await service.request('profiles:import', {
      os: 'Windows', osVersion: '11', fingerDetail: [iosImport], excelData: [{ windowName: 'iOS without a release', os: 'IOS' }],
    });
    assert.equal(engine.profiles.size, iosBefore + 1);
    assert.equal(engine.profiles.get(iosImport._fingerprintDraft.profileId).osVersion, '');
    assert.deepEqual(engine.fingerprintFor(iosImport._fingerprintDraft.profileId).mobileDevice, iosImport._openbrowser.mobileDevice);
    const customFirefoxUa = 'Mozilla/5.0 (X11; Linux x86_64; rv:159.0) Gecko/20100101 Firefox/159.0 ImportTest/1.0';
    const linuxFirefox = { os: 'Linux', coreType: 'Firefox', coreVersion: '159' };
    const [manualImport] = await service.request('fingerprint:preview', { ...linuxFirefox, userAgent: customFirefoxUa });
    assert.equal(manualImport.userAgent, customFirefoxUa);
    assert.equal(manualImport._fingerprintDraft.generated, false);
    await assert.rejects(service.request('fingerprint:preview', { ...linuxFirefox, userAgent: customFirefoxUa.replaceAll('159.0', '150.0') }),
      { code: 'FINGERPRINT_CONFIG_INVALID' });
    const android = { os: 'Android', osVersion: '16', coreType: 'Chrome', coreVersion: '159' };
    const [blankImport] = await service.request('fingerprint:preview', android);
    await service.request('profiles:import', { fingerDetail: [manualImport, blankImport], excelData: [
      { ...linuxFirefox, windowName: 'Explicit Firefox UA', userAgent: ` ${customFirefoxUa} ` },
      { ...android, windowName: 'Blank UA inherits its draft', userAgent: '   ' },
    ] });
    const manualProfile = engine.profiles.get(manualImport._fingerprintDraft.profileId);
    assert.equal(manualProfile.privacy.fingerprint.uaGenerated, false);
    assert.equal(engine.fingerprintFor(manualProfile.id).userAgent, customFirefoxUa);
    const blankProfile = engine.profiles.get(blankImport._fingerprintDraft.profileId);
    assert.equal(blankProfile.userAgent, blankImport.userAgent);
    assert.equal(blankProfile.privacy.fingerprint.uaGenerated, true);
    assert.deepEqual(engine.fingerprintFor(blankProfile.id).mobileDevice, blankImport._openbrowser.mobileDevice);
    const pinnedDevice = fromRoxy({
      os: 'Android', osVersion: '16', coreVersion: '158', windowName: 'Pinned Pixel',
      hardwareConcurrent: '8', webGLInfo: 2,
      webGLManufacturer: 'Google Inc. (ARM)', webGLRender: 'ANGLE (ARM, Mali-G715, OpenGL ES 3.2)',
    });
    pinnedDevice.fingerprintSeed = 'saved-pixel-seed';
    pinnedDevice.userAgent = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Mobile Safari/537.36';
    pinnedDevice.privacy.fingerprint = { ...pinnedDevice.privacy.fingerprint, uaGenerated: true, uaReduced: true,
      clientHints: { os: 'android', model: 'Pixel 8 Pro', deviceModel: 'Pixel 8 Pro', platform_version: '16.0.0', ua_full_version: '158.0.8127.88' } };
    const pinnedFirefox = fromRoxy({ coreType: 'Firefox', os: 'Windows', coreVersion: '158', windowName: 'Custom Firefox UA',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0' });
    await engine.syncProfiles([pinnedDevice, pinnedFirefox]);
    const beforeUpgrade = engine.profileForEdit(pinnedDevice.id);
    const groups = [
      { version: '159', ids: [pinnedDevice.id] },
      { version: '159', ids: [pinnedFirefox.id] },
    ];
    await assert.rejects(service.request('profiles:upgrade-kernels', { groups }), { code: 'FINGERPRINT_CONFIG_INVALID' });
    assert.deepEqual(engine.profileForEdit(pinnedDevice.id), beforeUpgrade, 'one incompatible profile rolls back the whole upgrade');
    assert.equal(engine.profiles.get(pinnedFirefox.id).userAgent, pinnedFirefox.userAgent);
    assert.deepEqual(await service.request('profiles:upgrade-kernels', { groups: groups.slice(0, 1) }), { updated: 1 });
    const upgradedDevice = engine.profiles.get(pinnedDevice.id);
    assert.equal(upgradedDevice.engineVersion, '159');
    assert.equal(upgradedDevice.fingerprintSeed, pinnedDevice.fingerprintSeed);
    assert.equal(upgradedDevice.privacy.cores, 8);
    assert.equal(upgradedDevice.privacy.fingerprint.webglRenderer, pinnedDevice.privacy.fingerprint.webglRenderer);
    assert.equal(upgradedDevice.privacy.fingerprint.clientHints.deviceModel, 'Pixel 8 Pro');
    assert.equal(upgradedDevice.privacy.fingerprint.clientHints.ua_full_version, '159.0.8154.6');
    assert.match(upgradedDevice.userAgent, /Chrome\/159\.0\.0\.0 /);
    const [pinnedUaOnly] = await service.request('fingerprint:preview', { profileId: upgradedDevice.id,
      reuseDraft: { seed: upgradedDevice.fingerprintSeed, version: upgradedDevice.fingerprintVersion } });
    assert.equal(pinnedUaOnly._fingerprintDraft.seed, pinnedDevice.fingerprintSeed);
    assert.equal(pinnedUaOnly._fingerprintDraft.clientHints.deviceModel, 'Pixel 8 Pro');
    assert.equal(pinnedUaOnly._fingerprintDraft.clientHints.platform_version, '16.0.0');
    let newPhone;
    for (let attempt = 0; attempt < 32; attempt++) {
      [newPhone] = await service.request('fingerprint:preview', { profileId: upgradedDevice.id, webGLInfo: 1 });
      if (newPhone._fingerprintDraft.clientHints.deviceModel !== 'Pixel 8 Pro') break;
    }
    assert.notEqual(newPhone._fingerprintDraft.clientHints.deviceModel, 'Pixel 8 Pro');
    const [draftUaOnly] = await service.request('fingerprint:preview', {
      profileId: upgradedDevice.id, reuseDraft: newPhone._fingerprintDraft, randomizeUaVersion: true,
      previousUserAgent: newPhone.userAgent, webGLInfo: 1,
    });
    assert.notEqual(draftUaOnly.userAgent, newPhone.userAgent);
    assert.deepEqual(draftUaOnly._openbrowser.mobileDevice, newPhone._openbrowser.mobileDevice);
    const pinnedMac = fromRoxy({ os: 'macOS', coreType: 'Chrome', windowName: 'Pinned Apple silicon',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Safari/537.36' });
    pinnedMac.fingerprintSeed = 'saved-apple-silicon';
    pinnedMac.privacy.fingerprint = { uaGenerated: true, uaReduced: true,
      clientHints: { architecture: 'arm', platform_version: '15.7.0' } };
    await engine.syncProfiles([pinnedMac]);
    const [macUaOnly] = await service.request('fingerprint:preview', {
      profileId: pinnedMac.id, reuseDraft: { seed: pinnedMac.fingerprintSeed, version: pinnedMac.fingerprintVersion },
      randomizeUaVersion: true,
    });
    assert.equal(macUaOnly._openbrowser.os, 'macos_arm');
    assert.equal(macUaOnly._fingerprintDraft.clientHints.platform_version, '15.7.0');
    assert.deepEqual(macUaOnly._openbrowser.webgl, engine.fingerprintFor(pinnedMac.id).webgl);
    const configured = fromRoxy({
      coreType: 'Firefox', coreVersion: '159', os: 'Linux', hardwareConcurrent: '20',
      isTimeZone: false, timeZone: 'Asia/Shanghai', resolutionType: true, resolutionX: 1600, resolutionY: 1000,
      isDisplayLanguageBaseIp: false, displayLanguage: 'fr-FR', randomFingerprint: true,
    });
    configured.privacy.fingerprint = {
      ...configured.privacy.fingerprint, canvasId: 3456, userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
    };
    await engine.syncProfiles([configured]);
    const storedConfig = engine.profileForEdit(configured.id);
    const [configuredPreview] = await service.request('fingerprint:preview', { profileId: configured.id });
    assert.match(configuredPreview.userAgent, /Firefox\/159\.0$/);
    assert.equal(configuredPreview._openbrowser.platform, 'Linux x86_64');
    assert.equal(configuredPreview._openbrowser.timezone, 'Asia/Shanghai');
    assert.equal(configuredPreview._openbrowser.languages[0], 'fr-FR');
    assert.equal(configuredPreview._openbrowser.screen.width, 1600);
    assert.equal(configuredPreview.hardwareConcurrent, '20');
    assert.deepEqual(engine.profileForEdit(configured.id), storedConfig, 'sampling cannot mutate the saved configuration');
    await service.request('profiles:update', { ...configuredPreview, id: configured.id, rev: storedConfig.rev });
    const savedConfig = engine.profiles.get(configured.id);
    const inspection = engine.fingerprintFor(savedConfig.id);
    assert.deepEqual(identity(inspection), identity(configuredPreview._openbrowser));
    assert.deepEqual(identity(engine.fingerprintFor(savedConfig.id)), identity(inspection),
      'reading a stopped Firefox profile does not randomize it');
    const launchA = buildFirefoxFingerprint({ ...savedConfig, fingerprintLaunchSeed: 'launch-a' }, '159.0');
    const launchB = buildFirefoxFingerprint({ ...savedConfig, fingerprintLaunchSeed: 'launch-b' }, '159.0');
    assert.notEqual(launchA.seed, launchB.seed, 'each supplied Firefox launch seed yields a separate identity');
    assert.notEqual(launchA.seed, inspection.seed);
    const mobile = { os: 'Android', osVersion: 'Android 13', coreType: 'Chrome', coreVersion: '159' };
    const [mobilePreview] = await service.request('fingerprint:preview', mobile);
    const [mobileUa] = await service.request('fingerprint:preview', {
      ...mobile, reuseDraft: mobilePreview._fingerprintDraft,
    });
    assert.deepEqual(mobileUa._fingerprintDraft, mobilePreview._fingerprintDraft);
    assert.deepEqual(mobileUa._openbrowser.mobileDevice, mobilePreview._openbrowser.mobileDevice);
    assert.equal(mobileUa._openbrowser.mobileDevice.osVersion, 13);
    for (const selected of [{ os: 'macOS', osVersion: 'macOS 27' }, { os: 'Linux', osVersion: 'Ubuntu' }]) {
      const [draft] = await service.request('fingerprint:preview', selected);
      const [refreshed] = await service.request('fingerprint:preview', { ...selected, reuseDraft: draft._fingerprintDraft });
      assert.deepEqual(refreshed._fingerprintDraft, draft._fingerprintDraft);
      const row = await service.request('profiles:create', { ...selected, ...refreshed });
      const stored = engine.fingerprintFor(row.id);
      assert.deepEqual(stored.userAgentMetadata, refreshed._openbrowser.userAgentMetadata);
      assert.deepEqual(stored.webgl, refreshed._openbrowser.webgl);
    }
    assert.deepEqual(identity(mobileUa._openbrowser), identity(mobilePreview._openbrowser));
    const controls = { os: 'Windows', coreType: 'Chrome', deviceNameSwitch: true, deviceName: '  ', macInfo: true, macAddr: '' };
    const [devicePreview] = await service.request('fingerprint:preview', controls);
    assert.match(devicePreview.deviceName, /^(DESKTOP|LAPTOP)-[0-9A-Z]{7}$/);
    assert.match(devicePreview.macAddr, /^[0-9A-F][26AE](?::[0-9A-F]{2}){5}$/);
    const [sameDevicePreview] = await service.request('fingerprint:preview', {
      ...controls, reuseDraft: devicePreview._fingerprintDraft,
    });
    assert.equal(sameDevicePreview.deviceName, devicePreview.deviceName);
    assert.equal(sameDevicePreview.macAddr, devicePreview.macAddr);
    const deviceProfile = await service.request('profiles:create', { ...controls, ...devicePreview });
    assert.equal(deviceProfile.privacy.deviceName, '');
    assert.equal(deviceProfile.privacy.mac, '');
    const device = engine.fingerprintFor(deviceProfile.id);
    assert.equal(device.deviceName, devicePreview.deviceName);
    assert.equal(device.mac.value, devicePreview.macAddr);
    const written = await writeOpenBrowserKernelInit(path.join(root, 'device-init'), {
      fingerprint: device, profile: deviceProfile,
    });
    const init = loadInitObject(await fs.readFile(written.path));
    assert.equal(init.machine, devicePreview.deviceName);
    assert.equal(init.mac_address, devicePreview.macAddr.toLowerCase());
    const [rerolledDevice] = await service.request('fingerprint:preview', { profileId: deviceProfile.id });
    assert.notEqual(rerolledDevice.deviceName, devicePreview.deviceName);
    assert.notEqual(rerolledDevice.macAddr, devicePreview.macAddr);
    const [fixedDevice] = await service.request('fingerprint:preview', {
      profileId: deviceProfile.id, deviceName: 'MY-WORKSTATION', macAddr: '02:00:00:11:22:33',
    });
    assert.equal(fixedDevice.deviceName, 'MY-WORKSTATION');
    assert.equal(fixedDevice.macAddr, '02:00:00:11:22:33');
    assert.equal(fixedDevice._fingerprintDraft.generatedHardware.deviceName, undefined);
    assert.equal(fixedDevice._fingerprintDraft.generatedHardware.macAddr, undefined);
    for (const os of ['Windows', 'macOS', 'Linux', 'Android', 'iOS']) {
      const selected = { os, coreType: 'Chrome', coreVersion: '160' };
      const [original] = await service.request('fingerprint:preview', selected);
      const request = { ...selected, reuseDraft: original._fingerprintDraft, randomizeUaVersion: true };
      const [first] = await service.request('fingerprint:preview', { ...request, previousUserAgent: original.userAgent });
      const [next] = await service.request('fingerprint:preview', { ...request, previousUserAgent: first.userAgent });
      assert.notEqual(next.userAgent, first.userAgent);
      assert.equal(next._fingerprintDraft.uaVersionRandomized, true);
      assert.equal(next._fingerprintDraft.uaReduced, false);
      assert.equal(next._fingerprintDraft.seed, original._fingerprintDraft.seed);
      assert.equal(next._fingerprintDraft.clientHints.deviceModel, original._fingerprintDraft.clientHints.deviceModel);
      assert.deepEqual(identity(next._openbrowser), identity(original._openbrowser));
      const version = parseChromeVersion(next.userAgent).full;
      assert.ok(publishedVersions[next._openbrowser.os][160].includes(version));
      assert.equal(next._openbrowser.userAgentMetadata.fullVersion, version);
      const saved = await service.request('profiles:create', { ...selected, ...next });
      assert.equal(saved.privacy.fingerprint.uaVersionRandomized, true);
      assert.equal(engine.fingerprintFor(saved.id).userAgent, next.userAgent);
      assert.equal(engine.fingerprintFor(saved.id).clientHints.ua_full_version, version);
      const manual = fromRoxy({ userAgent: next.userAgent + ' Custom' }, engine.profiles.get(saved.id));
      assert.equal(manual.privacy.fingerprint.uaVersionRandomized, undefined);
    }
    for (const [os, coreVersion] of [['Windows', '161'], ['Android', '162']]) {
      const selected = { os, coreType: 'Chrome', coreVersion };
      const [original] = await service.request('fingerprint:preview', selected);
      const [first] = await service.request('fingerprint:preview', { ...selected, randomizeUaVersion: true,
        previousUserAgent: original.userAgent });
      const saved = await service.request('profiles:create', { ...selected, ...first });
      const [next] = await service.request('fingerprint:preview', { profileId: saved.id, reuseDraft: first._fingerprintDraft,
        randomizeUaVersion: true, previousUserAgent: first.userAgent });
      const intended = parseChromeVersion(next.userAgent).full;
      assert.notEqual(next.userAgent, first.userAgent);
      assert.equal(next._fingerprintDraft.seed, first._fingerprintDraft.seed);
      assert.deepEqual(identity(next._openbrowser), identity(first._openbrowser));
      assert.equal(intended.split('.').slice(0, 3).join('.'), chromiumVersions[coreVersion].split('.').slice(0, 3).join('.'));
      await service.request('profiles:update', { ...selected, ...next, id: saved.id, rev: engine.profileForEdit(saved.id).rev });
      const runtime = engine.fingerprintFor(saved.id);
      assert.equal(runtime.userAgent, next.userAgent);
      assert.equal(runtime.userAgentMetadata.fullVersion, intended);
    }
    await assert.rejects(service.request('fingerprint:preview', {
      ...mobile, reuseDraft: { ...mobilePreview._fingerprintDraft, seed: '0'.repeat(32) },
    }), /指纹预览已失效/);
    await assert.rejects(service.request('fingerprint:preview', {
      ...mobile, reuseDraft: { ...mobilePreview._fingerprintDraft, version: 1 },
    }), /指纹预览已失效/);

    await assert.rejects(service.request('fingerprint:preview', { profileId: 'missing' }), /not found/i);
    const invalid = await service.request('profiles:create', { windowName: 'invalid draft UUID', _fingerprintDraft: { profileId: '../escape' } });
    assert.notEqual(invalid.id, '../escape');
    const forgedId = randomUUID();
    const forged = await service.request('profiles:create', { windowName: 'forged UUID',
      _fingerprintDraft: { profileId: forgedId, seed: 'guessed', allocation: '0'.repeat(64) } });
    assert.notEqual(forged.id, forgedId, 'unissued UUIDs cannot adopt an orphaned storage directory');
    const [retryPreview] = await service.request('fingerprint:preview', { os: 'Windows' });
    const persist = engine.persist;
    try {
      engine.persist = async () => { throw Error('simulated failed persistence'); };
      await assert.rejects(service.request('profiles:create', retryPreview), /failed persistence/);
    } finally { engine.persist = persist; }
    const retried = await service.request('profiles:create', retryPreview);
    assert.equal(retried.id, retryPreview._fingerprintDraft.profileId, 'failed persistence does not consume the allocation');
    await service.request('profiles:delete', { ids: [retried.id] });
    await service.request('profiles:purge', { ids: [retried.id] });
    const afterPurge = await service.request('profiles:create', retryPreview);
    assert.notEqual(afterPurge.id, retried.id, 'purging a window does not reauthorize its old template allocation');
    const legacy = fromRoxy({ os: 'Windows' });
    legacy.fingerprintVersion = 1;legacy.fingerprintSeed = 'legacy-persisted-seed';
    legacy.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.8154.73 Safari/537.36';
    legacy.privacy.fingerprint = { uaGenerated: true, uaPatchRandomized: true };
    await engine.syncProfiles([legacy]);
    const oldIdentity = identity(engine.fingerprintFor(legacy.id));
    await service.request('profiles:update', { id: legacy.id, rev: engine.profileForEdit(legacy.id).rev, windowName: 'legacy rename' });
    assert.equal(engine.profiles.get(legacy.id).fingerprintVersion, 1);
    assert.deepEqual(identity(engine.fingerprintFor(legacy.id)), oldIdentity, 'ordinary edits do not upgrade or reroll legacy identity');
    assert.equal(engine.fingerprintFor(legacy.id).userAgent, legacy.userAgent);
    const [legacyUaRefresh] = await service.request('fingerprint:preview', { profileId: legacy.id,
      reuseDraft: { seed: legacy.fingerprintSeed, version: 1 } });
    assert.equal(legacyUaRefresh._fingerprintDraft.version, 1);
    assert.equal(legacyUaRefresh._fingerprintDraft.seed, legacy.fingerprintSeed);
    assert.equal(legacyUaRefresh._fingerprintDraft.uaPatchRandomized, false);
    assert.match(legacyUaRefresh.userAgent, /Chrome\/159\.0\.0\.0 /);
    assert.deepEqual(identity(legacyUaRefresh._openbrowser), oldIdentity);
    const [upgraded] = await service.request('fingerprint:preview', { profileId: legacy.id, os: 'Windows' });
    assert.equal(upgraded._fingerprintDraft.version, CURRENT_FINGERPRINT_VERSION, 'explicit randomization retains the documented opt-in generation upgrade');
    await service.request('profiles:update', { ...upgraded, id: legacy.id, rev: engine.profileForEdit(legacy.id).rev });
    assert.deepEqual(identity(engine.fingerprintFor(legacy.id)), identity(upgraded._openbrowser));
    const restored = new BrowserEngine({ getPath: () => root });
    await restored.init(null);
    restored.chooseBrowser = engine.chooseBrowser;
    for (const [id] of engine.profiles) {
      const beforeReload = engine.fingerprintFor(id), afterReload = restored.fingerprintFor(id);
      assert.deepEqual(identity(afterReload), identity(beforeReload), 'disk reload preserves the preview identity');
      assert.equal(afterReload.userAgent, beforeReload.userAgent, 'disk reload preserves the saved UA');
    }
    assert.equal(restored.fingerprintFor(deviceProfile.id).mac.value, devicePreview.macAddr);
    assert.equal(restored.fingerprintFor(deviceProfile.id).deviceName, devicePreview.deviceName);
    console.log('FINGERPRINT_PREVIEW_IDENTITY_SELFTEST OK (create/edit/batch/import/clone/template replay and disk reload)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error);process.exitCode = 1; });
