'use strict';

const path = require('node:path');
const { DOCUMENT } = require('./protocol');
const { attachShellNavigationGuard, createShellNavigationPolicy } = require('../automation/shell-guard');

const ROUTES = new Map([
  ['/agent-console', 'AI Agent'], ['/agent-console/task-manager', '任务管理'],
  ['/agent-console/templates', '我的模板'], ['/agent-console/template-store', '模板商城'],
  ['/agent-console/settings', '设置'], ['/agent-console/skills', 'Skill 管理'],
  ['/api-keys', 'API & AI MCP'], ['/skills', 'Skill 管理'],
]);

function workspaceRoute(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\0]/.test(value))
    throw Error('无效功能窗口路径');
  const url = new URL(value, 'https://workspace.invalid');
  const title = ROUTES.get(url.pathname) || (/^\/agent-console\/c\/[a-zA-Z0-9_-]+$/.test(url.pathname) ? 'AI Agent' : null);
  if (url.origin !== 'https://workspace.invalid' || !title) throw Error('未知功能窗口');
  return { route: url.pathname + url.search, key: url.pathname, title };
}

class WorkspaceWindows {
  constructor({ BrowserWindow, parent, windows }) {
    Object.assign(this, { BrowserWindow, parent, windows });
    this.entries = new Map();
  }
  owns(contents) {
    return [...this.entries.values()].some(entry => !entry.window.isDestroyed() && entry.window.webContents === contents);
  }
  async request(method, payload = {}, sender) {
    if (method === 'ui:workspace:focus-main') {
      const parent = this.parent();
      if (parent && !parent.isDestroyed()) { if (parent.isMinimized()) parent.restore(); parent.show(); parent.focus(); }
      return true;
    }
    if (method === 'ui:workspace:ready') {
      const entry = [...this.entries.values()].find(value => value.window.webContents === sender);
      if (!entry) throw Error('功能窗口不存在');
      entry.rendererReady = true;
      return { route: entry.route };
    }
    if (method !== 'ui:workspace:open') throw Error('未知功能窗口操作');
    const selected = workspaceRoute(payload.route);
    const existing = this.entries.get(selected.key);
    if (existing && !existing.window.isDestroyed()) {
      existing.route = selected.route;
      await existing.ready;
      if (existing.rendererReady) existing.window.webContents.send('engine:event', { channel: 'workspace:navigate', payload: selected.route });
      if (existing.window.isMinimized()) existing.window.restore();
      existing.window.show(); existing.window.focus();
      return { key: selected.key };
    }
    const window = new this.BrowserWindow({
      width: 1280, height: 860, minWidth: 960, minHeight: 640,
      title: 'OpenBrowser — ' + selected.title, frame: true, show: false,
      parent: this.parent(), autoHideMenuBar: true, backgroundColor: '#f5fbff',
      webPreferences: { preload: path.resolve(__dirname, '../preload.js'),
        contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
    });
    const entry = { window, route: selected.route, rendererReady: false, ready: null };
    this.entries.set(selected.key, entry);
    this.windows.add(window);
    window.on('closed', () => { this.entries.delete(selected.key); this.windows.delete(window); });
    attachShellNavigationGuard(window.webContents, { policy: createShellNavigationPolicy({ localUi: true }) });
    const url = new URL(DOCUMENT);
    url.searchParams.set('workspace', selected.key);
    url.hash = selected.route;
    entry.ready = window.loadURL(url.href).then(() => {
      if (!window.isDestroyed()) { window.show(); window.focus(); }
    }).catch(error => {
      if (!window.isDestroyed()) window.destroy();
      throw error;
    });
    await entry.ready;
    return { key: selected.key };
  }
  closeAll() {
    for (const { window } of this.entries.values()) if (!window.isDestroyed()) window.destroy();
  }
}

module.exports = { WorkspaceWindows, workspaceRoute };
