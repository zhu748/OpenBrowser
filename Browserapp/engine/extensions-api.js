'use strict';

/** Extension metadata, installation and assignments for BrowserEngine. */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { addChromeStoreExtension } = require('../store-extension');
const { assertProfileId, isPathInsideOrEqual } = require('../automation/isolation');
const { assertExtensionTreeSafe } = require('./index');

module.exports = {
  async readExtension(directory, builtIn = false) {
    const extensionPath = await assertExtensionTreeSafe(directory);
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const manifest = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
    if (![2, 3].includes(manifest.manifest_version)
      || typeof manifest.name !== 'string' || typeof manifest.version !== 'string') {
      throw new Error('The selected folder does not contain a valid Chrome extension manifest');
    }
    let messages = {};
    const locale = String(manifest.default_locale || 'en').replace(/[^a-zA-Z0-9_-]/g, '');
    for (const candidate of new Set([locale, 'en', 'en_US', 'zh_CN'])) {
      try {
        messages = JSON.parse(await fsp.readFile(path.join(extensionPath, '_locales', candidate, 'messages.json'), 'utf8'));
        if (Object.keys(messages).length) break;
      } catch (_) { /* Optional locale: try the next fallback. */ }
    }
    const localized = (text) => {
      const match = String(text || '').match(/^__MSG_([^_].*?)__$/i);
      return match && messages[match[1]]?.message ? String(messages[match[1]].message) : String(text || '');
    };
    const iconSource = this.extensionIconSource(manifest);
    let iconUrl = null;
    if (iconSource) {
      const iconPath = path.resolve(extensionPath, iconSource.replace(/^[/\\]+/, ''));
      if (isPathInsideOrEqual(iconPath, extensionPath)) {
        try {
          const iconRealPath = await fsp.realpath(iconPath);
          const iconStat = await fsp.lstat(iconPath);
          if (!iconStat.isSymbolicLink() && iconStat.isFile() && isPathInsideOrEqual(iconRealPath, extensionPath)) iconUrl = pathToFileURL(iconRealPath).toString();
        } catch (_) {}
      }
    }
    const id = crypto.createHash('sha256').update(extensionPath.toLowerCase()).digest('hex').slice(0, 20);
    return { id, name: localized(manifest.name), version: manifest.version, description: localized(manifest.description), manifestVersion: manifest.manifest_version, path: extensionPath, iconUrl, builtIn, addedAt: new Date().toISOString() };
  },

  extensionIconSource(manifest) {
    const iconSets = [manifest.icons, manifest.action?.default_icon, manifest.browser_action?.default_icon, manifest.page_action?.default_icon];
    for (const iconSet of iconSets) {
      if (typeof iconSet === 'string') return iconSet;
      if (!iconSet || typeof iconSet !== 'object') continue;
      const candidates = Object.entries(iconSet)
        .filter(([, value]) => typeof value === 'string')
        .sort(([left], [right]) => Number(right) - Number(left));
      if (candidates[0]) return candidates[0][1];
    }
    return null;
  },

  async addExtension(directory) {
    const value = await this.readExtension(directory, false);
    this.extensions.set(value.id, value);
    await this.persist();
    this.emit({ type: 'extensions' });
    return value;
  },

  async addStoreExtension(url, fetchPackage) {
    const value = await addChromeStoreExtension(url, this.app.getPath('userData'),
      (directory, builtIn) => this.readExtension(directory, builtIn), fetchPackage);
    this.extensions.set(value.id, value);
    await this.persist();
    this.emit({ type: 'extensions' });
    return value;
  },
  listExtensions() {
    // Invert the sparse assignment relation once. Preserve profile insertion
    // order, and ignore orphan profile/extension ids as the public API did.
    const byExtension = new Map([...this.extensions.keys()].map((id) => [id, []]));
    for (const profileId of this.profiles.keys()) {
      for (const extensionId of this.assignments.get(profileId) || []) {
        byExtension.get(extensionId)?.push(profileId);
      }
    }
    return [...this.extensions.values()].map((item) => {
      const assignedProfileIds = byExtension.get(item.id) || [];
      return { ...item, assignedProfiles: assignedProfileIds.length, assignedProfileIds, enabledAll: this.profiles.size > 0 && assignedProfileIds.length === this.profiles.size };
    });
  },
  async assignExtension(extensionId, profileIds, enabled) {
    if (!this.extensions.has(extensionId)) throw new Error('Unknown extension');
    if (!Array.isArray(profileIds) || profileIds.length > 1000) throw new Error('Invalid profile list');
    const safeIds = profileIds.map(assertProfileId);
    this.invalidateStatusCache();
    for (const id of safeIds) {
      const assigned = this.assignments.get(id) || new Set();
      if (enabled) assigned.add(extensionId);
      else assigned.delete(extensionId);
      this.assignments.set(id, assigned);
    }
    await this.persist();
    this.emit({ type: 'extensions' });
    return { success: true, restartRequired: safeIds.filter((id) => this.running.has(id)) };
  },
  async reloadExtension(id) {
    const existing = this.extensions.get(id);
    if (!existing) throw new Error('Unknown extension');
    if (!fs.existsSync(existing.path)) throw new Error('Extension path does not exist');
    const updated = await this.readExtension(existing.path, Boolean(existing.builtIn));
    updated.addedAt = existing.addedAt || updated.addedAt;
    this.extensions.set(id, updated);
    await this.persist();
    this.emit({ type: 'extensions' });
    return updated;
  },
  async reloadAllExtensions() {
    const results = [];
    for (const [id, ext] of this.extensions.entries()) {
      if (fs.existsSync(ext.path)) {
        try {
          const updated = await this.readExtension(ext.path, Boolean(ext.builtIn));
          updated.addedAt = ext.addedAt || updated.addedAt;
          this.extensions.set(id, updated);
          results.push(updated);
        } catch (e) {
          console.warn('[extensions] Failed to reload extension ' + id + ':', e.message);
        }
      }
    }
    await this.persist();
    this.emit({ type: 'extensions' });
    return results;
  },
  async removeExtension(id) {
    const value = this.extensions.get(id);
    if (!value || value.builtIn) throw new Error('Built-in extension cannot be removed');
    if (this.usingSqlite && this.sqliteStore) {
      this.sqliteStore.deleteExtension(id);
    }
    this.extensions.delete(id);
    for (const set of this.assignments.values()) set.delete(id);
    this.invalidateStatusCache();
    await this.persist();
    this.emit({ type: 'extensions' });
    return { success: true };
  },
};
