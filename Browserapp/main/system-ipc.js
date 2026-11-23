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

  registerTrustedIpc('system:read-clipboard', () => {
    try { return clipboard.readText(); } catch (_) { return ''; }
  });
  registerTrustedIpc('system:set-close-action', async (_event, mode) => {
    assertSettingsWritable();
    const value = settingsStore.normalizeCloseAction(mode);
    settingsStore.getLocalSettings().closeAction = value;
    await settingsStore.saveLocalSettings(settingsStore.getLocalSettings());
    // A remembered "exit" means the user no longer wants background running.
    if (value === 'exit') destroyTray();
    return { success: true, closeAction: value };
  });
  // 启动保护（Roxy 客户端设置对齐）：内存使用率上限 / 磁盘可用空间下限。
  registerTrustedIpc('system:get-client-settings', () => settingsStore.getLocalSettings());
  // 设置字段白名单 + 类型/范围校验：renderer 的 patch 不再整个浅合并进设置。
  // 旧实现把任意键一并并入并持久化（cloud/uiGroups/profileDataRoot 可被一次
  // IPC 覆盖，或注入任意未知键）；此处镜像 system:set-close-action 的做法——
  // 归一化一律走 settingsStore 自身的 clamp（clampMemoryLimit 1-100、
  // clampDiskLimit 0-1024、closeAction 枚举），非法值丢弃并只记一次日志，
  // 绝不静默回退默认值（garbage patch 不得改写已存设置）。renderer 的
  // input.value 是数字字符串，故先 Number() 再判有限。
  let warnedClientSettingsDrops = false;
  registerTrustedIpc('system:save-client-settings', async (_event, payload) => {
    assertSettingsWritable();
    const patch = payload && typeof payload === 'object' ? payload : {};
    const known = new Set(['memoryLimit', 'diskLimit', 'closeAction', 'defaultPreferences']);
    const dropped = [];
    const next = {};
    if (patch.memoryLimit !== undefined) {
      const num = Number(patch.memoryLimit);
      if (!Number.isFinite(num)) dropped.push(`memoryLimit:${JSON.stringify(patch.memoryLimit)}`);
      else next.memoryLimit = settingsStore.clampMemoryLimit(num);
    }
    if (patch.diskLimit !== undefined) {
      const num = Number(patch.diskLimit);
      if (!Number.isFinite(num)) dropped.push(`diskLimit:${JSON.stringify(patch.diskLimit)}`);
      else next.diskLimit = settingsStore.clampDiskLimit(num);
    }
    if (patch.closeAction !== undefined) {
      // 枚举精确匹配：normalizeCloseAction 会把非法值静默改成 'ask'，
      // 一次垃圾提交就能覆盖用户已选的 'tray'/'exit'。
      if (patch.closeAction === 'ask' || patch.closeAction === 'tray' || patch.closeAction === 'exit') next.closeAction = patch.closeAction;
      else dropped.push(`closeAction:${JSON.stringify(patch.closeAction)}`);
    }
    if (patch.defaultPreferences && typeof patch.defaultPreferences === 'object') {
      const { DEFAULT_PREFERENCES, normalizeDefaultPreferences } = require('../automation/profile-defaults');
      const valid = Object.fromEntries(Object.entries(patch.defaultPreferences)
        .filter(([key, value]) => Object.hasOwn(DEFAULT_PREFERENCES, key) && typeof value === 'boolean'));
      next.defaultPreferences = normalizeDefaultPreferences(valid, settingsStore.getLocalSettings().defaultPreferences);
    }
    for (const key of Object.keys(patch)) if (!known.has(key)) dropped.push(`unknown:${key}`);
    if (dropped.length && !warnedClientSettingsDrops) {
      warnedClientSettingsDrops = true;
      console.warn('[client-settings] dropped untrusted keys/values:', dropped.join(', '), '(further drops are silent for this process)');
    }
    const saved = await settingsStore.saveLocalSettings({ ...settingsStore.getLocalSettings(), ...next });
    if (saved.closeAction === 'exit') destroyTray();
    return saved;
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
  registerTrustedIpc('system:choose-storage', async () => {
    const engine = getEngine();
    const mainWindow = getMainWindow();
    if (engine.running.size) throw new Error('\u8bf7\u5148\u505c\u6b62\u6240\u6709\u73af\u5883\uff0c\u518d\u4fee\u6539\u6570\u636e\u4fdd\u5b58\u4f4d\u7f6e');
    const options = { title: '\u9009\u62e9\u73af\u5883\u6570\u636e\u4fdd\u5b58\u76ee\u5f55', defaultPath: engine.getProfileDataRoot(), properties: ['openDirectory', 'createDirectory', 'promptToCreate'] };
    const result = mainWindow && !mainWindow.isDestroyed() ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
    if (result.canceled || !result.filePaths[0]) return { canceled: true, profileRoot: engine.getProfileDataRoot(), defaultProfileRoot: defaultProfileDataRoot };
    return { canceled: false, ...(await updateProfileDataRoot(result.filePaths[0])) };
  });
  registerTrustedIpc('system:reset-storage', () => updateProfileDataRoot(defaultProfileDataRoot));
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
