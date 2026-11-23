'use strict';

// System / app-update / cloud IPC domain, registered through the host sender
// guard. Extracted from main.js' whenReady block; the early-registration set
// (system:info, sync:state, rebuild:request) intentionally stays in main.js —
// those must be registered BEFORE createWindow(), while everything here runs
// after window creation.

const cloudSync = require('../automation/cloud-sync');
const appUpdate = require('../automation/app-update');
const cloudOps = require('../automation/cloud-ops');
const settingsStore = require('../automation/local-settings');
const { collectStorageDiagnostics } = require('../automation/storage-diagnostics');
const { writeRawAtomically } = require('../engine/state-storage');
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const CLOSE_ACTIONS = new Set(['ask', 'tray', 'exit']);
// New fields in the persistence schema must not expand this IPC implicitly.
const CLIENT_DEFAULT_PREFERENCES = Object.freeze({ openWorkbench: true, ipChangeRemind: true, googleLogin: false });
const settingLabels = Object.freeze({
  memoryLimit: '内存使用率上限', diskLimit: '磁盘可用空间下限',
  closeAction: '关闭窗口行为', defaultPreferences: '默认环境偏好',
});
const saveErrors = Object.freeze({
  ENOSPC: '磁盘空间不足，未能确认设置保存。',
  EACCES: '没有足够的文件访问权限，未能确认设置保存。',
  EPERM: '没有足够的文件访问权限，未能确认设置保存。',
  LOCAL_SETTINGS_DECRYPT_FAILED: '无法解密本地设置。请检查加密密钥后重试。',
  LOCAL_SETTINGS_INVALID: '本地设置格式无效。请先处理恢复记录。',
  LOCAL_SETTINGS_RECOVERY_REQUIRED: '本地设置需要恢复。请先处理恢复记录。',
  APP_SHUTTING_DOWN: '应用正在退出，无法保存设置。',
  CLOSE_SETTINGS_SUPERSEDED: '设置已被更新的操作替代，未保存这次更改。',
  CLIENT_SETTINGS_SAVE_FAILED: '未能确认客户端设置保存。请检查本地存储后重试。',
});

function clientSettingsDto(saved) {
  return {
    memoryLimit: Number.isFinite(saved.memoryLimit) ? saved.memoryLimit : 95,
    diskLimit: Number.isFinite(saved.diskLimit) ? saved.diskLimit : 8,
    closeAction: CLOSE_ACTIONS.has(saved.closeAction) ? saved.closeAction : 'ask',
    defaultPreferences: Object.fromEntries(Object.entries(CLIENT_DEFAULT_PREFERENCES).map(([key, fallback]) => {
      const value = saved.defaultPreferences?.[key];
      return [key, typeof value === 'boolean' ? value : fallback];
    })),
  };
}

function invalidClientSettings(field) {
  const label = settingLabels[field];
  return Object.assign(new Error(label ? `无效的客户端设置：${label}。` : '没有可保存的客户端设置。'),
    { code: 'CLIENT_SETTINGS_INVALID' });
}

const record = value => value !== null && typeof value === 'object'
  && Object.prototype.toString.call(value) === '[object Object]';

function finiteSetting(value, field) {
  const number = typeof value === 'number' ? value
    : typeof value === 'string' && DECIMAL.test(value.trim()) ? Number(value) : NaN;
  if (!Number.isFinite(number)) throw invalidClientSettings(field);
  return number;
}

function clientSettingsPatch(payload) {
  if (!record(payload)) throw invalidClientSettings();
  const next = {};
  if (Object.hasOwn(payload, 'memoryLimit')) {
    next.memoryLimit = settingsStore.clampMemoryLimit(finiteSetting(payload.memoryLimit, 'memoryLimit'));
  }
  if (Object.hasOwn(payload, 'diskLimit')) {
    next.diskLimit = settingsStore.clampDiskLimit(finiteSetting(payload.diskLimit, 'diskLimit'));
  }
  if (Object.hasOwn(payload, 'closeAction')) {
    if (!CLOSE_ACTIONS.has(payload.closeAction)) throw invalidClientSettings('closeAction');
    next.closeAction = payload.closeAction;
  }
  if (Object.hasOwn(payload, 'defaultPreferences')) {
    if (!record(payload.defaultPreferences)) throw invalidClientSettings('defaultPreferences');
    const preferences = {};
    for (const key of Object.keys(CLIENT_DEFAULT_PREFERENCES)) {
      if (!Object.hasOwn(payload.defaultPreferences, key)) continue;
      const value = payload.defaultPreferences[key];
      if (typeof value !== 'boolean') throw invalidClientSettings('defaultPreferences');
      preferences[key] = value;
    }
    if (Object.keys(preferences).length) next.defaultPreferences = preferences;
  }
  // Unknown keys have no authority and are never copied or logged. Without
  // any supported field there is nothing to report as a successful save.
  if (!Object.keys(next).length) throw invalidClientSettings();
  return next;
}

function registerSystemIpc({
  registerTrustedIpc, shell, dialog, clipboard, BrowserWindow,
  getEngine, getAutomation, getMainWindow, defaultProfileDataRoot,
  isQuitting, destroyTray, applyWindowChrome, updateProfileDataRoot,
}) {
  const fsp = require('node:fs/promises');
  const assertSettingsWritable = () => {
    // Accepted writes are drained by quit cleanup. Do not queue a later
    // renderer edit that can outlive the last settings flush.
    if (isQuitting()) throw Object.assign(new Error('应用正在退出，无法保存设置。'), { code: 'APP_SHUTTING_DOWN' });
  };
  const saveClientPatch = async (patch) => {
    try {
      return await (Object.hasOwn(patch, 'closeAction')
        ? settingsStore.commitCloseSettings(patch, { isQuitting, onExit: destroyTray })
        : settingsStore.saveLocalSettings(patch, { clientIntent: true }));
    } catch (error) {
      // Ordinary preference writes can retry. Close-bearing patches do not.
      // Neither kind returns a path or a raw filesystem error to the client.
      const code = Object.hasOwn(saveErrors, error?.code) ? error.code : 'CLIENT_SETTINGS_SAVE_FAILED';
      throw Object.assign(new Error(saveErrors[code]), { code });
    }
  };

  registerTrustedIpc('system:read-clipboard', () => {
    try { return clipboard.readText(); } catch (_) { return ''; }
  });
  registerTrustedIpc('system:set-close-action', async (_event, mode) => {
    assertSettingsWritable();
    if (!CLOSE_ACTIONS.has(mode)) throw invalidClientSettings('closeAction');
    const saved = await saveClientPatch({ closeAction: mode });
    return { success: true, closeAction: saved.closeAction };
  });
  // Ordinary preferences never include the cloud, group or storage data
  // maintained by their separate host operations.
  registerTrustedIpc('system:get-client-settings', () => clientSettingsDto(settingsStore.getLocalSettings()));
  registerTrustedIpc('system:save-client-settings', async (_event, payload) => {
    assertSettingsWritable();
    const next = clientSettingsPatch(payload); // validate the entire patch before any write
    return clientSettingsDto(await saveClientPatch(next));
  });
  registerTrustedIpc('app:update-check', async () => {
    const payload = await appUpdate.pushAppUpdateStatus({ check: true });
    if (payload?.error && !payload?.remoteVersion) throw new Error(payload.error);
    // Return check fields (without event envelope noise for renderer helpers)
    const {  light, checkedAt, error, ...rest } = payload || {};
    if (error && !rest.supported) throw new Error(error);
    return rest.currentVersion != null ? { ...rest, light, checkedAt } : await appUpdate.checkAppUpdate();
  });
  registerTrustedIpc('app:update-download', () => appUpdate.downloadAppUpdate());
  registerTrustedIpc('app:open-github', async () => {
    const url = `https://github.com/${appUpdate.UPDATE_REPOSITORY}`;
    await shell.openExternal(url);
    return { success: true, url };
  });
  registerTrustedIpc('system:set-ui-chrome', (_event, payload) => {
    const win = BrowserWindow.fromWebContents(_event.sender) || getMainWindow();
    const themeId = typeof payload === 'string' ? payload : String(payload?.themeId || '');
    const colorMode = typeof payload === 'object' && payload ? String(payload.colorMode || 'light') : 'light';
    applyWindowChrome(win, themeId, colorMode);
    return { success: true, theme: themeId, colorMode };
  });
  registerTrustedIpc('system:get-storage', () => {
    const engine = getEngine();
    return { profileRoot: engine.getProfileDataRoot(), defaultProfileRoot: defaultProfileDataRoot,
      running: engine.running.size, ...collectStorageDiagnostics({ engine, automation: getAutomation() }) };
  });
  let storageRequestGeneration = 0;
  registerTrustedIpc('system:choose-storage', async () => {
    assertSettingsWritable();
    const engine = getEngine();
    const mainWindow = getMainWindow();
    if (engine.running.size) throw new Error('\u8bf7\u5148\u505c\u6b62\u6240\u6709\u73af\u5883\uff0c\u518d\u4fee\u6539\u6570\u636e\u4fdd\u5b58\u4f4d\u7f6e');
    const options = { title: '\u9009\u62e9\u73af\u5883\u6570\u636e\u4fdd\u5b58\u76ee\u5f55', defaultPath: engine.getProfileDataRoot(), properties: ['openDirectory', 'createDirectory', 'promptToCreate'] };
    const generation = ++storageRequestGeneration;
    const result = mainWindow && !mainWindow.isDestroyed() ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths?.[0] || generation !== storageRequestGeneration) {
      return { canceled: true, profileRoot: engine.getProfileDataRoot(), defaultProfileRoot: defaultProfileDataRoot };
    }
    assertSettingsWritable();
    return { canceled: false, ...(await updateProfileDataRoot(result.filePaths[0])) };
  });
  registerTrustedIpc('system:reset-storage', () => {
    assertSettingsWritable();
    storageRequestGeneration++;
    return updateProfileDataRoot(defaultProfileDataRoot);
  });
  registerTrustedIpc('system:open-storage', async () => {
    const profileRoot = getEngine().getProfileDataRoot(); await fsp.mkdir(profileRoot, { recursive: true });
    const message = await shell.openPath(profileRoot); if (message) throw new Error(message);
    return { success: true, profileRoot };
  });
  registerTrustedIpc('cloud:get-config', async () => {
    return settingsStore.getLocalSettings().cloud || cloudSync.defaultCloudConfig();
  });
  registerTrustedIpc('cloud:set-config', async (_event, cloud) => {
    const next = { ...cloudSync.defaultCloudConfig(), ...(settingsStore.getLocalSettings().cloud || {}), ...(cloud || {}) };
    await settingsStore.saveLocalSettings({ ...settingsStore.getLocalSettings(), cloud: next });
    return next;
  });
  registerTrustedIpc('cloud:choose-dir', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择云备份本地目录',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    return { canceled: false, dir: result.filePaths[0] };
  });
  registerTrustedIpc('cloud:backup', async (_event, payload) => cloudOps.runCloudBackup(payload || {}));
  registerTrustedIpc('cloud:restore', async (_event, payload) => cloudOps.runCloudRestore(payload || {}));
  registerTrustedIpc('cloud:profile-push', async (_event, payload) => cloudOps.runCloudProfilePush(payload || {}));
  registerTrustedIpc('cloud:profile-pull', async (_event, payload) => cloudOps.runCloudProfilePull(payload || {}));
  registerTrustedIpc('cloud:export-file', async (_event, payload) => {
    const { buffer, meta } = await cloudOps.createBackupPackage(payload || {});
    const result = await dialog.showSaveDialog({
      title: '导出 OpenBrowser 备份',
      defaultPath: `openbrowser-backup-${Date.now()}.obpack`,
      filters: [{ name: 'OpenBrowser Backup', extensions: ['obpack'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await writeRawAtomically(result.filePath, buffer);
    return { success: true, path: result.filePath, meta };
  });
  registerTrustedIpc('cloud:import-file', async (_event, payload) => {
    const result = await dialog.showOpenDialog({
      title: '导入 OpenBrowser 备份',
      properties: ['openFile'],
      filters: [{ name: 'OpenBrowser Backup', extensions: ['obpack', 'json', 'gz'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const buffer = await fsp.readFile(result.filePaths[0]);
    const body = await cloudSync.parseBackupPackage(buffer, payload?.passphrase || settingsStore.getLocalSettings().cloud?.passphrase || '');
    const mode = String(payload?.mode || settingsStore.getLocalSettings().cloud?.restoreMode || 'merge');
    const applied = await cloudOps.applyBackupBody(body, {
      mode,
      localProfiles: payload?.localProfiles,
      localGroups: payload?.localGroups,
    });
    return { success: true, mode, ...applied };
  });
}

module.exports = { registerSystemIpc };
