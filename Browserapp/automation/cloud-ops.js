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
const { assertProfileId, sanitizeIds } = require('./isolation');

let deps = null;

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

async function runCloudBackup(payload = {}) {
  const { getEngine, getAutomation, emit, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const automation = getAutomation();
  const localSettingsCache = getSettings();
  const cloud = { ...localSettingsCache.cloud, ...(payload.cloud || {}) };
  const allProfiles = Array.isArray(payload.profiles)
    ? payload.profiles
    : [...(engine?.profiles?.values?.() || [])];
  const profileIds = Array.isArray(payload.profileIds) ? payload.profileIds.map(String) : null;
  const groups = Array.isArray(payload.groups) ? payload.groups : (localSettingsCache.uiGroups || []);
  let proxies = [];
  try { proxies = automation?.proxyStore?.list?.({}) || []; } catch (_) {}
  const { buffer, meta } = await cloudSync.buildBackupPackage({
    profiles: allProfiles,
    groups,
    proxies,
    settings: { cloud: { ...cloud, passphrase: cloud.passphrase ? '***' : '' } },
    profileDataRoot: engine?.getProfileDataRoot?.() || localSettingsCache.profileDataRoot,
    includeBrowserData: cloud.includeBrowserData !== false,
    passphrase: cloud.passphrase || '',
    profileIds,
  });
  const remoteName = payload.remoteName || cloudSync.REMOTE_NAME;
  const result = await cloudSync.upload(cloud.provider, providerConfigFromCloud(cloud), buffer, remoteName);
  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  await saveSettings({ ...getSettings(), cloud });
  emit({ type: 'cloud-sync', action: 'backup', ...meta, ...result });
  return { success: true, meta, result, cloud };
}

async function applyBackupBody(body, { mode = 'merge', localProfiles = null, localGroups = null } = {}) {
  const { getEngine, getAutomation, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const automation = getAutomation();
  const localSettingsCache = getSettings();
  const profileRoot = engine?.getProfileDataRoot?.() || localSettingsCache.profileDataRoot;
  const remoteProfiles = (body.profiles || []).map((p) => {
    const copy = { ...p };
    return copy;
  });
  let restoredFiles = 0;
  const dataById = new Map();
  for (const profile of remoteProfiles) {
    assertProfileId(profile?.id);
    if (profile._dataFiles && profile.id) {
      dataById.set(profile.id, profile._dataFiles);
      delete profile._dataFiles;
    }
  }

  const localList = Array.isArray(localProfiles)
    ? localProfiles
    : [...(engine?.profiles?.values?.() || [])];
  const localGroupList = Array.isArray(localGroups) ? localGroups : (localSettingsCache.uiGroups || []);

  const merged = cloudSync.mergeProfiles(localList, remoteProfiles, mode);
  const groups = cloudSync.mergeGroups(localGroupList, body.groups || [], mode);

  // restore browser data files for profiles that came from remote package
  for (const profile of merged.profiles) {
    const files = dataById.get(profile.id);
    if (files) {
      restoredFiles += await cloudSync.restoreProfileDataFiles(path.join(profileRoot, profile.id), files);
    }
  }

  let proxies = body.proxies || [];
  if (Array.isArray(proxies) && proxies.length) {
    let localProxies = [];
    try { localProxies = automation?.proxyStore?.list?.({}) || []; } catch (_) {}
    proxies = cloudSync.mergeProxies(localProxies, proxies, mode);
    if (automation?.proxyStore?.replaceAll) {
      await automation.proxyStore.replaceAll(proxies).catch(() => {});
    } else if (automation?.proxyStore) {
      for (const item of proxies) {
        try { await automation.proxyStore.create(item); } catch (_) {}
      }
    }
  }

  await saveSettings({ ...getSettings(), uiGroups: groups });
  if (engine) await engine.syncProfiles(merged.profiles);

  return {
    profiles: merged.profiles,
    groups,
    proxies,
    restoredFiles,
    mergeStats: merged.stats,
    createdAt: body.createdAt,
  };
}

async function runCloudRestore(payload = {}) {
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

  const applied = await applyBackupBody(body, {
    mode,
    localProfiles: payload.localProfiles,
    localGroups: payload.localGroups,
  });

  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  cloud.restoreMode = mode;
  await saveSettings({ ...getSettings(), cloud, uiGroups: applied.groups });
  emit({
    type: 'cloud-sync',
    action: 'restore',
    mode,
    profileCount: applied.profiles.length,
    restoredFiles: applied.restoredFiles,
    mergeStats: applied.mergeStats,
  });
  return { success: true, mode, ...applied, cloud };
}

/** Push one or more environments as individual remote packs + refresh full pack optional */
async function runCloudProfilePush(payload = {}) {
  const { getEngine, emit, getSettings, saveSettings } = requireDeps();
  const engine = getEngine();
  const localSettingsCache = getSettings();
  const cloud = { ...localSettingsCache.cloud, ...(payload.cloud || {}) };
  const ids = sanitizeIds(payload.profileIds || (payload.profileId ? [payload.profileId] : []));
  if (!ids.length) throw new Error('请指定要同步的环境');
  const allProfiles = Array.isArray(payload.profiles)
    ? payload.profiles
    : [...(engine?.profiles?.values?.() || [])];
  const results = [];
  for (const id of ids) {
    const profile = allProfiles.find((p) => p.id === id);
    if (!profile) throw new Error('环境不存在：' + id);
    const { buffer, meta } = await cloudSync.buildBackupPackage({
      profiles: [{ ...profile, updatedAt: profile.updatedAt || new Date().toISOString() }],
      groups: Array.isArray(payload.groups) ? payload.groups : (localSettingsCache.uiGroups || []),
      proxies: [],
      settings: { kind: 'profile', profileId: id },
      profileDataRoot: engine?.getProfileDataRoot?.() || localSettingsCache.profileDataRoot,
      includeBrowserData: cloud.includeBrowserData !== false,
      passphrase: cloud.passphrase || '',
      profileIds: [id],
    });
    const remoteName = cloudSync.profileRemoteName(id);
    const result = await cloudSync.upload(cloud.provider, providerConfigFromCloud(cloud), buffer, remoteName);
    results.push({ id, meta, result, remoteName });
  }
  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  await saveSettings({ ...getSettings(), cloud });
  emit({ type: 'cloud-sync', action: 'profile-push', count: results.length, ids });
  return { success: true, results, cloud };
}

async function runCloudProfilePull(payload = {}) {
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
  const applied = await applyBackupBody(
    { profiles: combinedRemote, groups: payload.groups || localSettingsCache.uiGroups || [], proxies: [] },
    { mode, localProfiles, localGroups: payload.localGroups }
  );
  restoredFiles = applied.restoredFiles;
  cloud.lastSyncAt = new Date().toISOString();
  cloud.lastError = '';
  await saveSettings({ ...getSettings(), cloud, uiGroups: applied.groups });
  emit({ type: 'cloud-sync', action: 'profile-pull', count: ids.length, mode, mergeStats: applied.mergeStats });
  return { success: true, mode, ...applied, per, restoredFiles, cloud };
}

module.exports = {
  initCloudOps,
  providerConfigFromCloud,
  runCloudBackup,
  applyBackupBody,
  runCloudRestore,
  runCloudProfilePush,
  runCloudProfilePull,
};
