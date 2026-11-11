'use strict';

const fsp = require('node:fs/promises');
const path = require('node:path');
const { findUnsupportedSteps } = require('../automation/rpa/step-registry');
const APP_ROOT = path.join(__dirname, '..');

/** Trusted IPC registration with live stack/window access, isolated from bootstrap. */
function registerAutomationControlIpc({ registerTrustedIpc, getAutomation, getMainWindow, app, dialog }) {
  const register = (channel, handler) => registerTrustedIpc(channel, (...args) =>
    handler({ automation: getAutomation(), mainWindow: getMainWindow() }, ...args));
  register('automation:rpa-status', ({ automation }) => automation?.rpaEngine?.getStatus?.() || { running: [], count: 0 });
  register('automation:rpa-plans', ({ automation }) => automation?.rpaStore?.listPlans?.() || []);
  register('automation:rpa-tasks', ({ automation }, _event, filter) => automation?.rpaStore?.listTasks?.(filter || {}) || []);
  register('automation:rpa-get-plan', ({ automation }, _event, id) => automation?.rpaStore?.getPlan?.(String(id || '')) || null);
  register('automation:rpa-save-plan', ({ automation }, _event, plan) => {
    if (!automation) throw new Error('Automation stack is not ready');
    return automation.rpaStore.upsertPlan(plan);
  });
  register('automation:rpa-delete-plan', ({ automation }, _event, id) => {
    if (!automation) throw new Error('Automation stack is not ready');
    return automation.rpaStore.deletePlan(String(id || ''));
  });
  register('automation:rpa-run', async ({ automation }, _event, payload) => {
    if (!automation) throw new Error('Automation stack is not ready');
    if (payload?.plan_id) return automation.rpaEngine.runPlan(String(payload.plan_id), payload);
    if (payload?.task_id) return automation.rpaEngine.runTask(String(payload.task_id), payload);
    if (Array.isArray(payload?.steps)) {
      const unsupported = findUnsupportedSteps(payload.steps);
      if (unsupported.length) {
        throw new Error('Invalid RPA steps: ' + unsupported.slice(0, 4).map((item) => `${item.path.join('.')}: ${item.type}`).join(', '));
      }
      const task = await automation.rpaStore.createTask({
        profile_id: String(payload.profile_id || ''),
        process_name: String(payload.name || 'ipc-rpa'),
        steps: payload.steps,
      });
      return automation.rpaEngine.runTask(task.id, payload);
    }
    throw new Error('plan_id, task_id or steps required');
  });
  register('automation:rpa-stop', ({ automation }, _event, taskId) => automation?.rpaEngine?.stop?.(taskId || null));
  register('automation:rpa-templates', ({ automation }, _event, filter) => {
    if (!automation?.rpaStore) return { list: [], categories: ['全部'], config: {} };
    return {
      list: automation.rpaStore.listTemplates(filter || {}),
      categories: automation.rpaStore.listTemplateCategories(),
      config: automation.rpaStore.getConfig?.() || {},
    };
  });
  register('automation:rpa-template-get', ({ automation }, _event, id) => automation?.rpaStore?.getTemplate?.(String(id || '')) || null);
  register('automation:rpa-template-save', ({ automation }, _event, payload) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    return automation.rpaStore.upsertTemplate(payload || {});
  });
  register('automation:rpa-template-save-as', ({ automation }, _event, payload) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    return automation.rpaStore.saveAsTemplate(payload || {});
  });
  register('automation:rpa-template-delete', ({ automation }, _event, id) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    return automation.rpaStore.deleteTemplate(String(id || ''));
  });
  register('automation:rpa-template-install', ({ automation }, _event, payload) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    const id = String(payload?.id || payload?.template_id || '');
    if (!id) throw new Error('template id required');
    return automation.rpaStore.installTemplate(id, payload || {});
  });
  register('automation:rpa-template-sync-remote', async ({ automation }, _event, payload) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    // Remote sync is opt-in only: caller must pass base explicitly (no hard-coded host).
    if (payload?.token || payload?.cookie || payload?.apiKey || payload?.base) {
      await automation.rpaStore.setConfig({
        remoteToken: payload.token || undefined,
        remoteCookie: payload.cookie || undefined,
        remoteApiKey: payload.apiKey || undefined,
        remoteApiBase: payload.base || undefined,
        remoteApiOrigin: payload.origin || undefined,
        remoteLang: payload.lang || 'zh-CN',
      });
    }
    return automation.rpaStore.syncRemoteTemplates(payload || {});
  });
  register('automation:rpa-template-config', async ({ automation }, _event, payload) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    if (payload && typeof payload === 'object' && Object.keys(payload).length) {
      return automation.rpaStore.setConfig(payload);
    }
    return automation.rpaStore.getConfig();
  });
  register('automation:rpa-template-import-remote', async ({ automation }, _event, payload) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    return automation.rpaStore.importRemoteTemplatePayload(payload || {});
  });
  register('automation:rpa-template-export', async ({ automation, mainWindow }, _event, id) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    const bundle = id
      ? automation.rpaStore.exportTemplate(String(id))
      : automation.rpaStore.exportAllCustomTemplates();
    const result = mainWindow && !mainWindow.isDestroyed()
      ? await dialog.showSaveDialog(mainWindow, {
          title: '导出自动脚本模版',
          defaultPath: `openbrowser-rpa-template-${Date.now()}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })
      : await dialog.showSaveDialog({
          title: '导出自动脚本模版',
          defaultPath: `openbrowser-rpa-template-${Date.now()}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
    if (result.canceled || !result.filePath) return { canceled: true };
    await fsp.writeFile(result.filePath, JSON.stringify(bundle, null, 2), 'utf8');
    return { success: true, path: result.filePath, count: bundle.templates?.length || 0 };
  });
  register('automation:rpa-template-import', async ({ automation, mainWindow }) => {
    if (!automation?.rpaStore) throw new Error('Automation stack is not ready');
    const result = mainWindow && !mainWindow.isDestroyed()
      ? await dialog.showOpenDialog(mainWindow, {
          title: '导入自动脚本模版 JSON',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }],
        })
      : await dialog.showOpenDialog({
          title: '导入自动脚本模版 JSON',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
    if (result.canceled || !result.filePaths?.[0]) return { canceled: true };
    const raw = await fsp.readFile(result.filePaths[0], 'utf8');
    let parsed;
    try { parsed = JSON.parse(raw); } catch (error) {
      throw new Error('JSON 解析失败：' + error.message);
    }
    return automation.rpaStore.importTemplates(parsed);
  });
  register('automation:api-key-rotate', async ({ automation }) => {
    if (!automation) throw new Error('Automation stack is not ready');
    const newKey = await automation.rotateApiKey();
    automation.apiKey = newKey;
    return { apiKey: newKey };
  });
  register('automation:rpa-task-delete', async ({ automation }, _event, ids) => {
    if (!automation) throw new Error('Automation stack is not ready');
    const list = [...new Set((Array.isArray(ids) ? ids : [ids]).map((id) => String(id || '').trim()).filter(Boolean))];
    const deleted = []; const skipped = [];
    for (const id of list) {
      const rpa = automation.rpaEngine;
      let active;
      if (typeof rpa?.isTaskActive === 'function') active = rpa.isTaskActive(id);
      else {
        const status = rpa?.getStatus?.() || {};
        active = (status.running || []).includes(id) || (status.queued || []).includes(id);
      }
      if (active) { skipped.push(id); continue; }
      const result = await automation.rpaStore.deleteTask(id);
      if (result && result.deleted) deleted.push(id);
      else skipped.push(id);
    }
    return { deleted, skipped };
  });
  register('automation:mcp-paths', ({ automation }) => ({
    mcpScript: path.join(APP_ROOT, 'automation', 'mcp-server.js'),
    appRoot: APP_ROOT,
    port: automation?.info?.port || Number(process.env.OPENBROWSER_API_PORT || 50325),
    apiKey: automation?.apiKey || process.env.OPENBROWSER_API_KEY || '',
    apiKeyFile: automation?.apiKeyFile || path.join(app.getPath('userData'), 'local-api-key.txt'),
    localApi: automation?.info || null,
  }));
}

module.exports = { registerAutomationControlIpc };
