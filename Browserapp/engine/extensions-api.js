'use strict';

/** Extension metadata, installation and assignments for BrowserEngine. */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const { addChromeStoreExtension } = require('../store-extension');
const { assertProfileId, isPathInsideOrEqual } = require('../automation/isolation');
const { assertProfileNotMaintained } = require('./profile-maintenance');
const { serializeExtensionMutation, persistExtensionChanges } = require('./map-publication');
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
    // Lowercase canonicalization is only correct on case-INSENSITIVE
    // filesystems (win/mac: differently-cased paths are the same dir). On
    // Linux (case-sensitive) it collapses two distinct dirs into one id and
    // the second extension silently shadows the first in the extensions map.
    // Trade-off (accepted): Linux ids change once for paths containing
    // uppercase; win/mac ids are byte-identical to the old derivation.
    const pathKey = process.platform === 'linux' ? extensionPath : extensionPath.toLowerCase();
    const id = crypto.createHash('sha256').update(pathKey).digest('hex').slice(0, 20);
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
    return serializeExtensionMutation(this, async () => {
      const previous = this.extensions.get(value.id);
      const next = { ...previous, ...value, builtIn: Boolean(previous?.builtIn || value.builtIn) };
      await persistExtensionChanges(this, [[next.id, next]]);
      return next;
    });
  },

  async addStoreExtension(url, fetchPackage) {
    const value = await addChromeStoreExtension(url, this.app.getPath('userData'),
      (directory, builtIn) => this.readExtension(directory, builtIn), fetchPackage);
    return serializeExtensionMutation(this, async () => {
      const previous = this.extensions.get(value.id);
      const next = { ...previous, ...value, builtIn: Boolean(previous?.builtIn || value.builtIn) };
      await persistExtensionChanges(this, [[next.id, next]]);
      return next;
    });
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
      return { ...item, assignedProfiles: assignedProfileIds.length, assignedProfileIds, enabledAll: this.profiles.size ? assignedProfileIds.length === this.profiles.size : item.enabledByDefault === true };
    });
  },
  async assignExtension(extensionId, profileIds, enabled) {
    if (!Array.isArray(profileIds) || profileIds.length > 1000) throw new Error('Invalid profile list');
    const safeIds = [...new Set(profileIds.map(assertProfileId))];
    return serializeExtensionMutation(this, () => this.publishExtensionAssignment(extensionId, safeIds, enabled));
  },

  async setExtensionEnabledAll(extensionId, enabled) {
    return serializeExtensionMutation(this, () => this.publishExtensionAssignment(extensionId, [...this.profiles.keys()], enabled, true));
  },

  async publishExtensionAssignment(extensionId, safeIds, enabled, global = false) {
    const extension = this.extensions.get(extensionId);
    if (!extension) throw new Error('Unknown extension');
    const changes = [];
    for (const id of safeIds) {
      if (!this.profiles.has(id)) throw Object.assign(new Error('Profile not found: ' + id), { code: 'PROFILE_NOT_FOUND' });
      assertProfileNotMaintained(this, id);
      if (this.deletingProfiles?.has(id)) throw Object.assign(new Error('Profile is being deleted: ' + id), { code: 'PROFILE_DELETING' });
      const before = this.assignments.get(id) || new Set();
      if (before.has(extensionId) === Boolean(enabled)) continue;
      const next = new Set(before);
      if (enabled) next.add(extensionId); else next.delete(extensionId);
      changes.push([id, next]);
    }
    const metadata = global && extension.enabledByDefault !== Boolean(enabled)
      ? [[extensionId, { ...extension, enabledByDefault: Boolean(enabled) }]] : [];
    if (changes.length || metadata.length) await persistExtensionChanges(this, metadata, changes);
    return { success: true, affected: safeIds.length, restartRequired: changes.map(([id]) => id).filter((id) => this.running.has(id)) };
  },
  async reloadExtension(id) {
    const existing = this.extensions.get(id);
    if (!existing) throw new Error('Unknown extension');
    if (!fs.existsSync(existing.path)) throw new Error('Extension path does not exist');
    const updated = await this.readExtension(existing.path, Boolean(existing.builtIn));
    updated.addedAt = existing.addedAt || updated.addedAt;
    return serializeExtensionMutation(this, async () => {
      const current = this.extensions.get(id);
      if (!current) throw new Error('Unknown extension');
      const next = { ...current, ...updated, id, addedAt: current.addedAt || updated.addedAt };
      await persistExtensionChanges(this, [[id, next]]);
      return next;
    });
  },
  async reloadAllExtensions() {
    const entries = [...this.extensions].filter(([, extension]) => fs.existsSync(extension.path));
    const loaded = [];
    for (let offset = 0; offset < entries.length; offset += 4) {
      const chunk = entries.slice(offset, offset + 4);
      const results = await Promise.allSettled(chunk.map(([, extension]) => this.readExtension(extension.path, Boolean(extension.builtIn))));
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') loaded.push([chunk[index][0], result.value]);
        else console.warn('[extensions] Failed to reload extension ' + chunk[index][0] + ':', result.reason.message);
      });
    }
    return serializeExtensionMutation(this, async () => {
      const changes = loaded.filter(([id]) => this.extensions.has(id)).map(([id, value]) => {
        const previous = this.extensions.get(id);
        return [id, { ...previous, ...value, id, addedAt: previous.addedAt || value.addedAt }];
      });
      if (changes.length) await persistExtensionChanges(this, changes);
      return changes.map(([, value]) => value);
    });
  },

  async removeExtension(id) {
    return serializeExtensionMutation(this, async () => {
      const value = this.extensions.get(id);
      if (!value || value.builtIn) throw new Error('Built-in extension cannot be removed');
      const assignments = [];
      for (const [profileId, assigned] of this.assignments) {
        if (!assigned.has(id)) continue;
        if (this.profiles.has(profileId)) assertProfileNotMaintained(this, profileId);
        const next = new Set(assigned); next.delete(id); assignments.push([profileId, next]);
      }
      await persistExtensionChanges(this, [[id, undefined]], assignments);
      return { success: true };
    });
  },
};
