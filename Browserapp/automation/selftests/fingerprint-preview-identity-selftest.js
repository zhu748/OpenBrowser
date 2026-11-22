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

function identity(fp) {
  return { seed: fp.seed, canvas: fp.canvas, audio: fp.audio, clientRects: fp.clientRects,
    connection: fp.connection, screen: fp.screen, mediaDevices: fp.mediaDevices };
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-preview-identity-'));
  try {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    engine.chooseBrowser = profile => ({ version: profile.engine === 'firefox' ? '159.0' : '159.0.8154.6' });
    const service = new LocalService({ engine, root, dialog: {}, window: () => null });
    for (const coreType of ['Chrome', 'Firefox']) {
      const selected = { os: 'Windows', osVersion: 'Windows 11', coreType, coreVersion: '159' };
      const [compact] = await service.request('fingerprint:preview', { ...selected, includeRuntime: false });
      assert.equal(Object.hasOwn(compact, '_openbrowser'), false, 'the editor can omit the runtime payload');
      const compactProfile = await service.request('profiles:create', { ...selected, ...compact });
      assert.equal(compactProfile.id, compact._fingerprintDraft.profileId);
      assert.equal(compactProfile.userAgent, compact.userAgent);
      assert.equal(compactProfile.fingerprintSeed, compact._fingerprintDraft.seed);
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
      ...mobile, reuseDraft: mobilePreview._fingerprintDraft, previousUserAgent: mobilePreview.userAgent,
    });
    assert.deepEqual(mobileUa._fingerprintDraft, mobilePreview._fingerprintDraft);
    assert.deepEqual(mobileUa._openbrowser.mobileDevice, mobilePreview._openbrowser.mobileDevice);
    assert.deepEqual(identity(mobileUa._openbrowser), identity(mobilePreview._openbrowser));
    await assert.rejects(service.request('fingerprint:preview', {
      ...mobile, reuseDraft: { ...mobilePreview._fingerprintDraft, seed: '0'.repeat(32) },
    }), /指纹预览已失效/);

    await assert.rejects(service.request('fingerprint:preview', { profileId: 'missing' }), /not found/i);
    const invalid = await service.request('profiles:create', { windowName: 'invalid draft UUID', _fingerprintDraft: { profileId: '../escape' } });
    assert.notEqual(invalid.id, '../escape');
    const forgedId = randomUUID();
    const forged = await service.request('profiles:create', { windowName: 'forged UUID',
      _fingerprintDraft: { profileId: forgedId, seed: 'guessed', allocation: '0'.repeat(64) } });
    assert.notEqual(forged.id, forgedId, 'unissued UUIDs cannot adopt an orphaned storage directory');
    const [retryPreview] = await service.request('fingerprint:preview', { os: 'Windows' });
    const sync = engine.syncProfiles;
    engine.syncProfiles = async () => { throw Error('simulated failed persistence'); };
    await assert.rejects(service.request('profiles:create', retryPreview), /failed persistence/);
    engine.syncProfiles = sync;
    const retried = await service.request('profiles:create', retryPreview);
    assert.equal(retried.id, retryPreview._fingerprintDraft.profileId, 'failed persistence does not consume the allocation');
    await service.request('profiles:delete', { ids: [retried.id] });
    await service.request('profiles:purge', { ids: [retried.id] });
    const afterPurge = await service.request('profiles:create', retryPreview);
    assert.notEqual(afterPurge.id, retried.id, 'purging a window does not reauthorize its old template allocation');
    const legacy = fromRoxy({ os: 'Windows' });
    legacy.fingerprintVersion = 1;legacy.fingerprintSeed = 'legacy-persisted-seed';
    await engine.syncProfiles([legacy]);
    const oldIdentity = identity(engine.fingerprintFor(legacy.id));
    await service.request('profiles:update', { id: legacy.id, rev: engine.profileForEdit(legacy.id).rev, windowName: 'legacy rename' });
    assert.equal(engine.profiles.get(legacy.id).fingerprintVersion, 1);
    assert.deepEqual(identity(engine.fingerprintFor(legacy.id)), oldIdentity, 'ordinary edits do not upgrade or reroll legacy identity');
    const [upgraded] = await service.request('fingerprint:preview', { profileId: legacy.id, os: 'Windows' });
    assert.equal(upgraded._fingerprintDraft.version, 2, 'explicit randomization retains the documented opt-in generation upgrade');
    await service.request('profiles:update', { ...upgraded, id: legacy.id, rev: engine.profileForEdit(legacy.id).rev });
    assert.deepEqual(identity(engine.fingerprintFor(legacy.id)), identity(upgraded._openbrowser));
    const restored = new BrowserEngine({ getPath: () => root });
    await restored.init(null);
    restored.chooseBrowser = engine.chooseBrowser;
    for (const [id] of engine.profiles)
      assert.deepEqual(identity(restored.fingerprintFor(id)), identity(engine.fingerprintFor(id)), 'disk reload preserves the preview identity');
    console.log('FINGERPRINT_PREVIEW_IDENTITY_SELFTEST OK (create/edit/batch/import/clone/template replay and disk reload)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error);process.exitCode = 1; });
