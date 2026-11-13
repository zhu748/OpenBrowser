'use strict';

/**
 * Cloud backup/restore operations, extracted from main.js.
 *
 * The backup pipeline (full pack, per-profile packs, merge/replace restore)
 * over browser profiles, groups, and proxies. Host state (engine, automation
 * registry, settings cache, window broadcaster) is injected once by main.js
 * via initCloudOps() so this module stays requirable and testable in plain
 * Node; nothing here touches Electron directly.
 */

const path = require('path');
const cloudSync = require('./cloud-sync');
const { mergeProfileState } = require('./cloud/merge');
const { prepareFileRestore, assertProfileRestoreReady } = require('./cloud/file-restore');
const { captureRestoreState, saveRestoreState, readRestoreState, rollbackRestoreState, cleanupRestoreState, removeRestoreState } = require('./cloud/restore-state');
const { acquireProfileMaintenance } = require('../engine/profile-maintenance');
const { assertProfileId, sanitizeIds, assertSafeProfileChild } = require('./isolation');

let deps = null;

/**
 * Cloud sync operations are mutually exclusive: a backup pack being built
 * while a restore lands its merge results would upload the pre-restore
 * state and silently roll the restore back, and both tails overwrite
 * saveSettings wholesale so the last writer clobbers the other's
 * lastSyncAt. Every entry point below funnels through this single
 * in-flight chain, serializing backup / restore / profile push / pull.
 */
let chain = Promise.resolve();

function enqueueCloudOp(run) {
  const next = chain.then(run, run);
  chain = next.catch(() => {});
  return next;
}

/**
 * Merge a new cloud block into the settings being saved without clobbering
 * unrelated keys that another concurrent flow may have written between the
 * caller's read and write. Fields explicitly carried by `cloud` win; keys
 * absent from it keep the current value (so a writer that only computed
 * lastSyncAt does not wipe provider credentials, and vice versa).
 */
function mergeCloudIntoSettings(currentSettings, cloud) {
  if (!cloud || typeof cloud !== 'object') return currentSettings;
  const existing = (currentSettings && typeof currentSettings.cloud === 'object' && currentSettings.cloud) || {};
  return { ...currentSettings, cloud: { ...existing, ...cloud } };
}

// Operations own their completion status, not a snapshot of editable settings.
function mergeCloudCompletion(currentSettings, cloud) {
  return mergeCloudIntoSettings(currentSettings, {
    lastSyncAt: cloud.lastSyncAt,
    lastError: cloud.lastError,
  });
}

function initCloudOps({ getEngine, getAutomation, emit, getSettings, saveSettings }) {
  deps = {
    getEngine: getEngine || (() => null),
    getAutomation: getAutomation || (() => null),
    emit: emit || (() => {}),
    getSettings,
    saveSettings,
  };
}

function requireDeps() {
  if (!deps) throw new Error('cloud-ops is not initialized (call initCloudOps from the Electron main process first)');
  return deps;
}

function providerConfigFromCloud(cloud) {
  const provider = String(cloud.provider || 'local').toLowerCase();
  if (provider === 'webdav') return cloud.webdav || {};
  if (provider === 'github') return cloud.github || {};
  if (provider === 'gdrive' || provider === 'google' || provider === 'gcs') return cloud.gdrive || {};
  if (provider === 'onedrive' || provider === 'microsoft' || provider === 'mscloud') return cloud.onedrive || cloud.webdav || {};
  if (provider === 'quark' || provider === 'kuake') return cloud.quark || cloud.webdav || {};
  if (provider === 'baidu' || provider === 'baiduyun' || provider === 'pan') return cloud.baidu || cloud.webdav || {};
  if (cloudSync.isWebDavBridgeProvider?.(provider)) {
    return cloud[provider] || cloud.webdav || {};
  }
  return cloud.local || {};
}

/**
 * Star-mask every credential-shaped field in a cloud config before it is
 * serialized into a backup package. Nested provider blocks are walked; a
 * masked value is always the fixed '***' so the round-trip never leaves a
 * usable secret in the pack. Fields that merely name things (url, dir,
 * owner, repo, branch, provider, enabled, restoreMode…) pass through.
 */
const CLOUD_SECRET_KEYS = /passphrase|password|pass|token|secret|apikey|credential|cookie/i;

function maskCloudNode(node, out) {
  if (!node || typeof node !== 'object') return out;
  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object') {
      out[key] = Array.isArray(value) ? value : maskCloudNode(value, {});
      continue;
    }
    out[key] = (typeof value === 'string' && value && CLOUD_SECRET_KEYS.test(key)) ? '***' : value;
  }
  return out;
}

function sanitizeCloudForBackup(cloud) {
  const masked = maskCloudNode({ ...cloud }, {});
  masked.passphrase = cloud?.passphrase ? '***' : '';
  return masked;
}

async function runCloudBackup(payload = {}) {
  return enqueueCloudOp(() => runCloudBackupExclusive(payload));
}

/** Resolve credentials in the host, and hold stopped profiles while reading files. */
async function buildEngineBackup(payload = {}, { settings, includeProxies = true } = {}) {
  const { getEngine, getAutomation, getSettings } = requireDeps();
  const engine = getEngine();
  const local = getSettings();
  const cloud = { ...local.cloud, ...(payload.cloud || {}) };
  const values = engine?.profiles?.values ? [...engine.profiles.values()] : (payload.profiles || []);
  const ids = Array.isArray(payload.profileIds) ? new Set(payload.profileIds.map(assertProfileId)) : null;
  const selected = values.filter((profile) => ids ? ids.has(profile.id) : profile.advanced?.cloudBackup);
  const fileIds = cloud.includeBrowserData !== false ? selected.filter((profile) => profile.advanced?.cloudBackup).map((profile) => profile.id) : [];
  // Close-time automatic pushes can arrive just before the stop promise settles.
  for (const id of fileIds) if (engine?.stopping?.has(id)) await engine.stopping.get(id);
  const lease = acquireProfileMaintenance(engine, fileIds);
  try {
    const profiles = structuredClone(selected.map((profile) => engine?.profiles?.get(profile.id) || profile));
    const proxies = includeProxies ? (getAutomation()?.proxyStore?.list?.({}) || []) : [];
    const result = await cloudSync.buildBackupPackage({
      profiles, groups: payload.groups || local.uiGroups || [], proxies,
      settings: settings || { cloud: sanitizeCloudForBackup(cloud) },
      profileDataRoot: engine?.getProfileDataRoot?.() || local.profileDataRoot,
      includeBrowserData: cloud.includeBrowserData !== false,
      passphrase: cloud.passphrase || '', profileIds: ids ? [...ids] : null,
    });
    return { ...result, cloud };
  } finally { lease.release(); }
}

function createBackupPackage(payload = {}) {
  return enqueueCloudOp(() => buildEngineBackup(payload));
}

/** Called before the API starts; interrupted restores finish compensation first. */
async function recoverPendingRestore({ proxyStore } = {}) {
  const { getEngine, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const state = await readRestoreState(engine);
  if (!state) return false;
  const lease = acquireProfileMaintenance(engine, state.profiles.map((entry) => entry.id));
  let proxyLease;
  try {
    if (state.proxies !== null) proxyLease = await proxyStore.acquireMaintenance?.();
    if (state.phase !== 'committed') await rollbackRestoreState({ engine, proxyStore, getSettings, saveSettings,
      state, maintenanceToken: proxyLease?.token });
    await cleanupRestoreState(engine, state);
    lease.release(); proxyLease?.release();
    return true;
  } catch (error) {
    throw Object.assign(new Error('未完成的恢复需要修复；原始数据与恢复记录已保留', { cause: error }), { code: 'CLOUD_RECOVERY_REQUIRED' });
  }
}

async function runCloudBackupExclusive(payload = {}) {
  const { emit, getSettings, saveSettings } = requireDeps();
  const { buffer, meta, cloud } = await buildEngineBackup(payload);
  const remoteName = payload.remoteName || cloudSync.REMOTE_NAME;
  const result = await cloudSync.upload(cloud.provider, providerConfigFromCloud(cloud), buffer, remoteName);
  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  await saveSettings(mergeCloudCompletion(getSettings(), cloud));
  emit({ type: 'cloud-sync', action: 'backup', ...meta, ...result });
  return { success: true, meta, result, cloud: getSettings().cloud };
}

async function applyBackupBody(body, options = {}) {
  return enqueueCloudOp(() => applyBackupBodyExclusive(body, options));
}

async function applyBackupBodyExclusive(body, { mode = 'merge', localProfiles = null, localGroups = null } = {}) {
  const { getEngine, getAutomation, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const automation = getAutomation();
  const localSettingsCache = getSettings();
  const profileRoot = engine?.getProfileDataRoot?.() || localSettingsCache.profileDataRoot;
  if (!['merge', 'local-wins', 'remote-wins', 'overwrite'].includes(mode)) throw new Error('恢复策略无效');
  if (!Array.isArray(body.profiles) || body.profiles.length > 5000) throw new Error('备份环境列表无效或超过 5000 个');
  if (body.groups != null && !Array.isArray(body.groups)) throw new Error('备份分组列表无效');
  if (body.proxies != null && !Array.isArray(body.proxies)) throw new Error('备份代理列表无效');
  const remoteProfiles = body.profiles.map((profile) => ({ ...profile }));
  const dataById = new Map();
  const remoteIds = new Set();
  for (const profile of remoteProfiles) {
    assertProfileId(profile?.id);
    if (remoteIds.has(profile.id)) throw new Error('备份包含重复环境：' + profile.id);
    remoteIds.add(profile.id);
    engine?.sanitizeProfile?.(profile);
    if (profile._dataFiles && profile.id) {
      dataById.set(profile.id, profile._dataFiles);
      delete profile._dataFiles;
    }
  }

  // Engine data is authoritative; renderer snapshots can be redacted or stale.
  const localList = engine?.profiles?.values ? [...engine.profiles.values()] : (localProfiles || []);
  const localGroupList = Array.isArray(localGroups) ? localGroups : (localSettingsCache.uiGroups || []);
  // Legacy mode names keep working. Restore never deletes unrelated local
  // environments, groups or proxy records; same-ID remote values take priority.
  const mergeMode = ['overwrite', 'remote-wins'].includes(mode) ? 'remote-preferred' : mode;
  const merged = mergeProfileState(localList, remoteProfiles, mergeMode);
  merged.stats.mode = mode;
  if (merged.profiles.length > 5000) throw new Error('合并后环境数量超过 5000 个');
  const groups = cloudSync.mergeGroups(localGroupList, body.groups || [], mergeMode);
  const ids = [...merged.remoteProfileIds];
  const lease = acquireProfileMaintenance(engine, ids);
  const proxyStore = automation?.proxyStore;
  let proxyLease;
  let recovery;
  let proxiesChanged = false;
  let groupsChanged = false;
  let profilesChanged = false;
  let transaction;
  let phase = 'prepare';
  let rollbackFailed = false;
  try {
    if (await readRestoreState(engine)) throw Object.assign(new Error('请先恢复上次未完成的云恢复操作'), { code: 'CLOUD_RECOVERY_REQUIRED' });
    if (body.proxies?.length) proxyLease = await proxyStore?.acquireMaintenance?.();
    for (const id of ids) await assertProfileRestoreReady(path.join(profileRoot, id));
    recovery = structuredClone(captureRestoreState(engine, ids, proxyStore, getSettings(), Boolean(body.proxies?.length)));
    await saveRestoreState(engine, recovery);
    const selections = [];
    for (const id of ids.filter((id) => dataById.has(id))) {
      const root = path.join(profileRoot, id);
      await assertSafeProfileChild(profileRoot, root);
      selections.push({ root, files: dataById.get(id) });
    }
    transaction = await prepareFileRestore(selections);
    recovery.records = transaction.recoveryRecords;
    recovery.phase = 'pending';
    await saveRestoreState(engine, recovery);
    phase = 'files';
    await transaction.commit();
    phase = 'proxies';
    let proxies = body.proxies || [];
    if (Array.isArray(proxies) && proxies.length) {
      const localProxies = automation?.proxyStore?.list?.({}) || [];
      proxies = cloudSync.mergeProxies(localProxies, proxies, mergeMode);
      if (proxyStore?.replaceAll) await proxyStore.replaceAll(proxies, { maintenanceToken: proxyLease?.token });
      else if (proxyStore) for (const item of proxies) await proxyStore.create(item);
      proxiesChanged = true;
    }
    phase = 'settings';
    groupsChanged = true;
    await saveSettings({ ...getSettings(), uiGroups: groups });
    phase = 'profiles';
    profilesChanged = true;
    const selectedProfiles = merged.profiles.filter((profile) => merged.remoteProfileIds.has(profile.id));
    if (engine && selectedProfiles.length) await engine.syncProfiles(selectedProfiles.map((profile) => ({
      ...profile, secretsAction: 'replace', proxyAuthAction: 'clear',
    })), { maintenanceToken: lease.token });
    recovery.phase = 'committed';
    await saveRestoreState(engine, recovery);
    let cleanupWarnings = [];
    // The durable decision is final. Cleanup failure must not roll back
    // metadata after backups have already been deleted by finish().
    try {
      cleanupWarnings = await transaction.finish();
      await removeRestoreState(engine);
    } catch (cleanupError) { cleanupWarnings.push({ message: cleanupError.message }); }
    return {
      profiles: engine?.profiles?.values ? [...engine.profiles.values()] : merged.profiles,
      groups, proxies, restoredFiles: transaction.count,
      mergeStats: merged.stats, createdAt: body.createdAt,
      ...(cleanupWarnings.length ? { cleanupWarnings } : {}),
    };
  } catch (error) {
    error.restorePhase = phase;
    if (recovery) {
      try {
        await rollbackRestoreState({ engine, proxyStore, getSettings, saveSettings, state: recovery,
          maintenanceToken: proxyLease?.token, restoreProxies: proxiesChanged, restoreGroups: groupsChanged, restoreProfiles: profilesChanged });
        await transaction?.rollback();
        await cleanupRestoreState(engine, recovery);
      }
      catch (rollbackError) {
        rollbackFailed = true;
        throw Object.assign(new AggregateError([error, rollbackError], error.message + '；恢复回滚未完成，恢复记录已保留，重新启动应用后将重试'), {
          code: 'CLOUD_RECOVERY_REQUIRED',
          restorePhase: phase, recoveryDirectories: rollbackError.recoveryDirectories,
        });
      }
    }
    throw error;
  } finally { if (!rollbackFailed) { lease.release(); proxyLease?.release(); } }
}

async function runCloudRestore(payload = {}) {
  return enqueueCloudOp(() => runCloudRestoreExclusive(payload));
}

async function runCloudRestoreExclusive(payload = {}) {
  const { emit, getSettings, saveSettings } = requireDeps();
  const localSettingsCache = getSettings();
  const cloud = { ...localSettingsCache.cloud, ...(payload.cloud || {}) };
  const mode = String(payload.mode || cloud.restoreMode || 'merge');
  const remoteName = payload.remoteName || cloudSync.REMOTE_NAME;
  const buffer = await cloudSync.download(cloud.provider, providerConfigFromCloud(cloud), remoteName);
  const body = await cloudSync.parseBackupPackage(buffer, cloud.passphrase || payload.passphrase || '');

  // optional: only restore subset of profile ids from the pack
  if (Array.isArray(payload.profileIds) && payload.profileIds.length) {
    const allow = new Set(payload.profileIds.map(String));
    body.profiles = (body.profiles || []).filter((p) => allow.has(String(p.id)));
  }

  const applied = await applyBackupBodyExclusive(body, {
    mode,
    localProfiles: payload.localProfiles,
    localGroups: payload.localGroups,
  });

  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  cloud.restoreMode = mode;
  await saveSettings(mergeCloudCompletion(getSettings(), cloud));
  emit({
    type: 'cloud-sync',
    action: 'restore',
    mode,
    profileCount: applied.profiles.length,
    restoredFiles: applied.restoredFiles,
    mergeStats: applied.mergeStats,
  });
  return { success: true, mode, ...applied, cloud: getSettings().cloud };
}

/** Push one or more environments as individual remote packs + refresh full pack optional */
async function runCloudProfilePush(payload = {}) {
  return enqueueCloudOp(() => runCloudProfilePushExclusive(payload));
}

async function runCloudProfilePushExclusive(payload = {}) {
  const { getEngine, emit, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const localSettingsCache = getSettings();
  const cloud = { ...localSettingsCache.cloud, ...(payload.cloud || {}) };
  const ids = sanitizeIds(payload.profileIds || (payload.profileId ? [payload.profileId] : []));
  if (!ids.length) throw new Error('请指定要同步的环境');
  const allProfiles = engine?.profiles?.values ? [...engine.profiles.values()] : (payload.profiles || []);
  const results = [];
  const profilesById = new Map();
  for (const profile of allProfiles) {
    if (!profilesById.has(profile.id)) profilesById.set(profile.id, profile);
  }
  // C-8: one failing id used to abort the whole multi-profile push and the
  // exception discarded every result of the ids that had already shipped —
  // the caller learned nothing about the partial success, and lastError was
  // never recorded. Each id pushes independently; failures are collected
  // per id, already-shipped results survive, and the batch ends with one
  // aggregated error that still names every failed id.
  const failures = [];
  for (const id of ids) {
    const profile = profilesById.get(id);
    if (!profile) { failures.push({ id, error: new Error('环境不存在：' + id) }); continue; }
    try {
      const { buffer, meta } = await buildEngineBackup({ ...payload, profiles: [profile], profileIds: [id] }, {
        settings: { kind: 'profile', profileId: id }, includeProxies: false,
      });
      const remoteName = cloudSync.profileRemoteName(id);
      const result = await cloudSync.upload(cloud.provider, providerConfigFromCloud(cloud), buffer, remoteName);
      results.push({ id, meta, result, remoteName });
    } catch (error) {
      failures.push({ id, error });
    }
  }
  cloud.lastSyncAt = new Date().toISOString();
  if (failures.length) {
    const summary = failures.map(({ id, error }) => `${id}: ${error.message}`).join('；');
    cloud.lastError = summary;
    await saveSettings(mergeCloudCompletion(getSettings(), cloud));
    emit({ type: 'cloud-sync', action: 'profile-push', count: results.length, ids, failedIds: failures.map((f) => f.id) });
    if (!results.length) throw new Error('云推送全部失败：' + summary);
    const error = new Error(`云推送部分失败（成功 ${results.length}/${ids.length}）：${summary}`);
    error.code = 'CLOUD_PUSH_PARTIAL';
    error.partialResults = results;
    throw error;
  }
  cloud.lastError = '';
  await saveSettings(mergeCloudCompletion(getSettings(), cloud));
  emit({ type: 'cloud-sync', action: 'profile-push', count: results.length, ids });
  return { success: true, results, cloud: getSettings().cloud };
}

async function runCloudProfilePull(payload = {}) {
  return enqueueCloudOp(() => runCloudProfilePullExclusive(payload));
}

async function runCloudProfilePullExclusive(payload = {}) {
  const { getEngine, emit, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const localSettingsCache = getSettings();
  const cloud = { ...localSettingsCache.cloud, ...(payload.cloud || {}) };
  const mode = String(payload.mode || cloud.restoreMode || 'merge');
  const ids = sanitizeIds(payload.profileIds || (payload.profileId ? [payload.profileId] : []));
  if (!ids.length) throw new Error('请指定要拉取的环境');
  const localProfiles = Array.isArray(payload.localProfiles)
    ? payload.localProfiles
    : [...(engine?.profiles?.values?.() || [])];
  let combinedRemote = [];
  let restoredFiles = 0;
  const per = [];
  for (const id of ids) {
    const remoteName = cloudSync.profileRemoteName(id);
    const buffer = await cloudSync.download(cloud.provider, providerConfigFromCloud(cloud), remoteName);
    const body = await cloudSync.parseBackupPackage(buffer, cloud.passphrase || payload.passphrase || '');
    combinedRemote = combinedRemote.concat(body.profiles || []);
    per.push({ id, remoteName, count: (body.profiles || []).length, createdAt: body.createdAt });
  }
  const applied = await applyBackupBodyExclusive(
    { profiles: combinedRemote, groups: payload.groups || localSettingsCache.uiGroups || [], proxies: [] },
    { mode, localProfiles, localGroups: payload.localGroups }
  );
  restoredFiles = applied.restoredFiles;
  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  await saveSettings(mergeCloudCompletion(getSettings(), cloud));
  emit({ type: 'cloud-sync', action: 'profile-pull', count: ids.length, mode, mergeStats: applied.mergeStats });
  return { success: true, mode, ...applied, per, restoredFiles, cloud: getSettings().cloud };
}

module.exports = {
  initCloudOps,
  providerConfigFromCloud,
  sanitizeCloudForBackup,
  mergeCloudIntoSettings,
  runCloudBackup,
  createBackupPackage,
  recoverPendingRestore,
  applyBackupBody,
  runCloudRestore,
  runCloudProfilePush,
  runCloudProfilePull,
};
