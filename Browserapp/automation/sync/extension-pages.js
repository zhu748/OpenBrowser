'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cdp = require('../../cdp');
const { extensionIdFromPublicKey } = require('../crx-reader');
const { extensionPathKey: extensionPath, extensionIdFromPath } = require('../extension-identity');

const validId = (id) => /^[a-p]{32}$/.test(id);
function extensionHost(tab) {
  try {
    const url = new URL(String(tab?.url || ''));
    return ['chrome-extension:', 'edge-extension:'].includes(url.protocol) && validId(url.hostname) ? url.hostname : '';
  } catch (_) { return ''; }
}
function extensionPageKey(tab) {
  try { const url = new URL(tab.url); return url.protocol + '//' + url.hostname + url.pathname; }
  catch (_) { return ''; }
}
function extensionPages(values) {
  return values.filter((tab) => ['page', 'iframe', 'other', 'background_page'].includes(String(tab.type || 'page')) && extensionHost(tab));
}
function targetIndex(targets, used) {
  const byId = new Map(), byKey = new Map(), byHost = new Map();
  for (const target of targets) {
    byId.set(target.id, target);
    for (const [index, key] of [[byKey, extensionPageKey(target)], [byHost, extensionHost(target)]]) {
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(target);
    }
  }
  return { byId, byKey, byHost, used };
}

/** Extension capture is authorized by current assignments, not all loaded pages. */
function createExtensionSyncMethods({ injection, bindingName }) {
  return {
    masterExtensionWhitelist() {
      const assigned = this.engine.assignedExtensions?.(this.master?.id) || [];
      const running = this.master && this.engine.running?.get(this.master.id);
      const loaded = new Map((running?.loadedExtensions || []).filter((item) => item.enabled !== false && item.path)
        .map((item) => [extensionPath(item.path), item]));
      const paths = new Set(assigned.filter((item) => item.path).map((item) => extensionPath(item.path)));
      for (const key of this.extensionManifestCache?.keys() || []) if (!paths.has(key)) this.extensionManifestCache.delete(key);
      const ids = new Set();
      for (const extension of assigned) {
        const actual = loaded.get(extensionPath(extension.path));
        const id = String(actual?.id || '').toLowerCase();
        if (validId(id)) ids.add(id);
        else {
          const derived = this.cachedExtensionKeyId(extension);
          if (derived) ids.add(derived);
        }
      }
      return ids;
    },

    cachedExtensionKeyId(extension) {
      if (!extension?.path) return '';
      const key = extensionPath(extension.path);
      const file = path.join(extension.path, 'manifest.json');
      const cache = this.extensionManifestCache ||= new Map();
      let stat;
      try { stat = fs.statSync(file); } catch (_) { cache.delete(key); return ''; }
      const stamp = `${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}:${stat.ino}`;
      if (cache.get(key)?.stamp === stamp) return cache.get(key).id;
      let id = '';
      try {
        const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        id = manifest.key ? extensionIdFromPublicKey(manifest.key) : extensionIdFromPath(extension.path);
      } catch (_) { /* invalid manifests cannot authorize capture */ }
      cache.set(key, { stamp, id });
      return id;
    },

    async refreshExtensionConnections(masterTargets, slaveLists) {
      const generation = this.getRefreshGeneration();
      const master = this.master;
      const isCurrent = () => this.master === master && this.isRefreshGenerationCurrent(generation);
      const whitelist = this.masterExtensionWhitelist();
      const targets = masterTargets.filter((target) => whitelist.has(extensionHost(target)));
      const live = new Set(targets.map((target) => target.id));
      for (const [id, value] of this.extensionConnections) {
        if (!live.has(id) || value.connection.socket?.readyState !== 1) {
          value.connection.close(); this.extensionConnections.delete(id);
        }
      }
      for (const id of this.extensionMap.keys()) if (!live.has(id)) this.extensionMap.delete(id);

      // Build used-target and lookup indexes once per slave, not per master page.
      const indexes = new Map();
      for (const slave of this.slaves) {
        const used = new Set([...this.extensionMap.values()].map((mapping) => mapping.get(slave.id)?.id).filter(Boolean));
        indexes.set(slave.id, targetIndex(slaveLists.get(slave.id) || [], used));
      }
      for (const target of targets) {
        if (!isCurrent()) return;
        const mapping = this.extensionMap.get(target.id) || new Map();
        for (const slave of this.slaves) {
          if (!this.isSlaveAvailable(slave)) continue;
          const index = indexes.get(slave.id);
          const current = mapping.get(slave.id);
          const currentTarget = current && index.byId.get(current.id);
          if (currentTarget && extensionHost(currentTarget) === extensionHost(target)) { mapping.set(slave.id, currentTarget); continue; }
          if (current) { mapping.delete(slave.id); index.used.delete(current.id); }
          const choose = (items) => items?.find((item) => !index.used.has(item.id));
          const match = choose(index.byKey.get(extensionPageKey(target))) || choose(index.byHost.get(extensionHost(target)));
          if (match) { mapping.set(slave.id, match); index.used.add(match.id); }
        }
        this.extensionMap.set(target.id, mapping);
        if (!this.extensionConnections.has(target.id)) {
          this.pauseGeometrySync(1200, 'extension-surface-attached');
          await this.attachExtensionPage(target).catch((error) => {
            if (isCurrent()) this.emit({ type: 'live-sync-extension-error', targetId: target.id, url: target.url, message: String(error?.message || error) });
          });
        }
      }
    },

    async attachExtensionPage(tab) {
      const master = this.master, generation = this.getRefreshGeneration();
      const isCurrent = () => this.master === master && this.isRefreshGenerationCurrent(generation);
      if (!this.masterExtensionWhitelist().has(extensionHost(tab))) return;
      let connection;
      connection = new cdp.PersistentConnection(tab.webSocketDebuggerUrl, {
        onEvent: (event) => {
          if (this.extensionConnections.get(tab.id)?.connection === connection) return this.handleExtensionPage(tab.id, event);
        },
        onDisconnect: () => {
          if (this.extensionConnections.get(tab.id)?.connection === connection) this.extensionConnections.delete(tab.id);
        },
      });
      this.pendingAttachments ||= new Set(); this.pendingAttachments.add(connection);
      let ready = false;
      try {
        await connection.open();
        if (!isCurrent() || this.extensionConnections.has(tab.id)) return;
        this.extensionConnections.set(tab.id, { tab, connection });
        for (const [method, params] of [
          ['Runtime.addBinding', { name: bindingName }],
          ['Page.addScriptToEvaluateOnNewDocument', { source: injection }],
          ['Runtime.enable', {}], ['Runtime.evaluate', { expression: injection }], ['Page.enable', {}],
        ]) {
          if (!isCurrent()) return;
          // Older kernels omit the Page domain on extension targets.
          const command = connection.command(method, params);
          if (method.startsWith('Page.')) await command.catch(() => {});
          else await command;
        }
        ready = isCurrent() && this.masterExtensionWhitelist().has(extensionHost(tab));
        if (ready) this.emit({ type: 'live-sync-extension-attached', targetId: tab.id, url: tab.url, targets: this.extensionMap.get(tab.id)?.size || 0 });
      } catch (error) { if (isCurrent()) throw error; }
      finally {
        this.pendingAttachments.delete(connection);
        if (!ready) {
          connection.close();
          if (this.extensionConnections.get(tab.id)?.connection === connection) this.extensionConnections.delete(tab.id);
        }
      }
    },

    async handleExtensionPage(tabId, event) {
      const connection = this.extensionConnections.get(tabId)?.connection;
      if (!connection) return;
      if (event.method === 'Target.attachedToTarget' && event.params?.sessionId) {
        const sessionId = event.params.sessionId;
        const command = (method, params = {}) => connection.command(method, params, { sessionId, timeout: 10000 });
        (async () => {
          await command('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
          await command('Runtime.addBinding', { name: bindingName });
          await command('Page.addScriptToEvaluateOnNewDocument', { source: injection });
          await command('Runtime.enable'); await command('Page.enable');
          await command('Runtime.evaluate', { expression: injection });
        })().catch(() => {});
      }
      if (event.method === 'Runtime.executionContextCreated') {
        if (event.params?.context?.auxData?.isDefault === false) return;
        const contextId = event.params?.context?.id;
        if (contextId) connection.command('Runtime.evaluate', { expression: injection, contextId }, event.sessionId ? { sessionId: event.sessionId } : {}).catch(() => {});
      }
      if (event.method === 'Runtime.bindingCalled' && event.params?.name === bindingName) {
        let payload; try { payload = JSON.parse(event.params.payload); } catch (_) { return; }
        if (payload && typeof payload === 'object') this.enqueueForward(tabId, payload);
      }
    },
  };
}

module.exports = { createExtensionSyncMethods, extensionPages, extensionIdFromPath };
