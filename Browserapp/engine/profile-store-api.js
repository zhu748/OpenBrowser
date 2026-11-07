'use strict';

/**
 * Profile store API mixin for BrowserEngine (prototype-assigned by engine.js):
 * profile CRUD, trash/restore/purge, cache clearing, and cookie import/export.
 * Persistence itself stays in engine.js (persist) and engine/state-storage.js;
 * these are the operations the UI and profile-store-sqlite drive.
 */

const { assertProfileId, assertSafeProfileChild, validateProfileRootSecure } = require('../automation/isolation');
const { proxyHasCredentials, sameProxyEndpoint, sameProxyIdentity } = require('./index');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

module.exports = {
  async syncProfiles(values) {
    if (!Array.isArray(values) || values.length > 1000) throw new Error('Invalid profile list');
    const existingIds = [...this.profiles.keys()];
    const globallyEnabled = existingIds.length ? [...this.extensions.keys()].filter((extensionId) => existingIds.every((profileId) => (this.assignments.get(profileId) || new Set()).has(extensionId))) : [];
    let assignmentsChanged = false;
    const incomingIds = new Set();
    for (const value of values) {
      const sanitized = this.sanitizeProfile(value);
      const previous = this.profiles.get(sanitized.id);
      let profile = sanitized;
      if (previous && sanitized.proxyId && previous.proxyId === sanitized.proxyId) {
        const stored = this.proxyStore?.get?.(sanitized.proxyId);
        const matchesPrevious = sameProxyIdentity(sanitized.proxy, previous.proxy)
          || (!proxyHasCredentials(sanitized.proxy) && sameProxyEndpoint(sanitized.proxy, previous.proxy));
        const matchesStored = Boolean(stored?.raw) && (
          sameProxyIdentity(sanitized.proxy, stored.raw)
          || (!proxyHasCredentials(sanitized.proxy) && sameProxyEndpoint(sanitized.proxy, stored.raw))
        );
        if (!matchesPrevious && !matchesStored) {
          // A linked profile whose endpoint/auth was manually edited becomes a
          // manual proxy. This prevents the old library id from overwriting it.
          profile = this.sanitizeProfile({
            ...sanitized,
            proxyId: null,
            proxyMeta: { ...(sanitized.proxyMeta || {}), proxyId: null },
          });
        }
      }
      profile = this.resolveStoredProxyProfile(profile);
      const isNew = !previous;
      // UI may send redacted proxy (no auth) after localStorage reload. Prefer previous
      // authenticated form only when host:port match and incoming lacks credentials.
      let merged = profile;
      if (previous) {
        const nextProxy = String(profile.proxy || '');
        const prevProxy = String(previous.proxy || '');
        const nextHasAuth = proxyHasCredentials(nextProxy);
        const prevHasAuth = proxyHasCredentials(prevProxy);
        const explicitlyCleared = String(value?.proxyAuthAction ?? value?.proxy_auth_action ?? '').toLowerCase() === 'clear';
        if (!explicitlyCleared && !nextHasAuth && prevHasAuth && sameProxyEndpoint(prevProxy, nextProxy)) {
          merged = this.sanitizeProfile({ ...profile, proxy: prevProxy });
        }
        // Restore cookies/platform secrets only when UI clearly redacted ALL of them
        // (post-localStorage load) while engine still holds values — not when user
        // intentionally cleared a single field in the editor.
        const secretAction = String(value?.secretsAction ?? value?.credentialsAction ?? '').trim().toLowerCase();
        const explicitSecretUpdate = value?.__secretsExplicit === true
          || secretAction === 'replace'
          || secretAction === 'clear';
        const uiLooksRedacted = !explicitSecretUpdate
          && !String(profile.cookies || '').trim()
          && !String(profile.platform?.password || '').trim()
          && !String(profile.platform?.totpSecret || '').trim()
          && (
            String(previous.cookies || '').trim()
            || String(previous.platform?.password || '').trim()
            || String(previous.platform?.totpSecret || '').trim()
          );
        if (uiLooksRedacted) {
          merged = this.sanitizeProfile({
            ...merged,
            cookies: previous.cookies || '',
            platform: {
              ...(merged.platform || {}),
              password: previous.platform?.password || '',
              totpSecret: previous.platform?.totpSecret || '',
            },
          });
        }
        // Renderer storage intentionally omits runtime exit details. Keep the engine's
        // last successful result unless the proxy itself changed (which invalidates it).
        if (previous.proxy === merged.proxy && previous.exitIp && !profile.exitIp) {
          merged = this.sanitizeProfile({
            ...merged,
            exitIp: previous.exitIp,
            exitCountryCode: previous.exitCountryCode,
            exitTimezone: previous.exitTimezone,
            exitLatitude: previous.exitLatitude,
            exitLongitude: previous.exitLongitude,
            exitCheckedAt: previous.exitCheckedAt,
            exitLatencyMs: previous.exitLatencyMs,
            exitNetworkType: previous.exitNetworkType,
          });
        }
      }
      if (previous && previous.proxy !== merged.proxy) this.networkInfo.delete(profile.id);
      this.profiles.set(merged.id, merged);
      incomingIds.add(merged.id);
      const hasSavedAssignment = this.assignments.has(merged.id);
      if (isNew || !hasSavedAssignment) {
        const assigned = this.assignments.get(merged.id) || new Set();
        for (const extensionId of globallyEnabled) assigned.add(extensionId);
        // The bundled marker is part of the environment contract.
        for (const [extensionId, extension] of this.extensions) {
          if (extension.builtIn) assigned.add(extensionId);
        }
        this.assignments.set(merged.id, assigned); assignmentsChanged = true;
      }
    }
    // Do not drop unknown engine profiles here — deleteProfiles is the explicit path.
    if (this.usingSqlite && this.sqliteStore) {
      const incomingList = [...incomingIds].map((id) => this.profiles.get(id)).filter(Boolean);
      this.sqliteStore.saveProfiles(incomingList);
    }
    await this.persist();
    return this.status();
  },

  async deleteProfiles(ids, deleteData = true) {
    if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
    const safeIds = [...new Set(ids.map(assertProfileId))];
    const deleted = []; let stopped = 0;
    for (const id of safeIds) {
      if (!this.profiles.has(id)) continue;
      if (this.running.has(id) || this.starting.has(id) || this.stopping.has(id)) {
        await this.stop(id);
        stopped += 1;
      }
      if (deleteData) {
        const profileRoot = this.profileRoot(id);
        const rootCheck = await validateProfileRootSecure(this.profileDataRootPath, profileRoot, id);
        if (!rootCheck.ok) throw new Error('Isolation error: ' + rootCheck.message);
        if (fs.existsSync(profileRoot)) {
          // Windows often holds Chrome locks (EBUSY/EPERM) briefly after Browser.close / taskkill.
          let lastError = null;
          for (let attempt = 0; attempt < 8; attempt += 1) {
            try {
              await fsp.rm(profileRoot, { recursive: true, force: true });
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              if (!error || !['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY'].includes(error.code)) throw error;
              await new Promise((resolve) => setTimeout(resolve, 120 * (attempt + 1)));
            }
          }
          if (lastError) throw lastError;
        }
      }
      // Commit in-memory deletion only after the profile directory is gone.
      // Persist each successful item so a later batch failure cannot leave the
      // durable profile list disagreeing with already-deleted directories.
      const previousProfile = this.profiles.get(id);
      const previousAssignments = this.assignments.get(id);
      const previousNetwork = this.networkInfo.get(id);
      const hadAssignments = this.assignments.has(id);
      const hadNetwork = this.networkInfo.has(id);
      this.profiles.delete(id);
      this.assignments.delete(id);
      this.networkInfo.delete(id);
      if (this.usingSqlite && this.sqliteStore) {
        this.sqliteStore.deleteProfiles([id]);
      }
      try {
        await this.persist();
      } catch (error) {
        if (previousProfile) this.profiles.set(id, previousProfile);
        if (hadAssignments) this.assignments.set(id, previousAssignments);
        if (hadNetwork) this.networkInfo.set(id, previousNetwork);
        throw error;
      }
      deleted.push(id);
    }
    this.emit({ type: 'profiles', action: 'delete', ids: deleted }); this.emit({ type: 'extensions' });
    return { success: true, deleted: deleted.length, stopped, dataDeleted: Boolean(deleteData), ids: deleted };
  },

  async trashProfiles(ids) {
    if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
    const safeIds = [...new Set(ids.map(assertProfileId))];
    const trashed = [];
    let stopped = 0;
    const nowIso = new Date().toISOString();
    for (const id of safeIds) {
      const profile = this.profiles.get(id);
      if (!profile) continue;
      if (this.running.has(id) || this.starting.has(id) || this.stopping.has(id)) {
        await this.stop(id);
        stopped += 1;
      }
      profile.trashed = true;
      profile.trashedAt = nowIso;
      trashed.push(id);
    }
    if (this.usingSqlite && this.sqliteStore) {
      this.sqliteStore.trashProfiles(trashed, nowIso);
    }
    await this.persist();
    this.emit({ type: 'profiles', action: 'trash', ids: trashed });
    return { success: true, trashed: trashed.length, stopped, ids: trashed };
  },

  async restoreProfiles(ids) {
    if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
    const safeIds = [...new Set(ids.map(assertProfileId))];
    const restored = [];
    for (const id of safeIds) {
      const profile = this.profiles.get(id);
      if (!profile) continue;
      profile.trashed = false;
      profile.trashedAt = null;
      restored.push(id);
    }
    if (this.usingSqlite && this.sqliteStore) {
      this.sqliteStore.restoreProfiles(restored);
    }
    await this.persist();
    this.emit({ type: 'profiles', action: 'restore', ids: restored });
    return { success: true, restored: restored.length, ids: restored };
  },

  async purgeProfiles(ids, deleteData = true) {
    return this.deleteProfiles(ids, deleteData);
  },

  async emptyTrash(deleteData = true) {
    const trashedIds = [...this.profiles.values()]
      .filter((p) => Boolean(p.trashed))
      .map((p) => p.id);
    return this.purgeProfiles(trashedIds, deleteData);
  },

  /** Clear cache + cookies on disk for a stopped profile. */
  async clearProfileCacheAndCookies(profileId) {
    const id = assertProfileId(profileId);
    if (this.running.has(id) || this.starting.has(id) || this.stopping.has(id)) throw new Error('请先关闭窗口再清除缓存及 Cookie');
    const root = this.profileRoot(id);
    await this.clearProfileCache(root);
    const base = path.join(root, 'Default');
    for (const name of [
      path.join('Network', 'Cookies'),
      path.join('Network', 'Cookies-journal'),
      'Cookies',
      'Cookies-journal',
    ]) {
      const target = await assertSafeProfileChild(root, path.join(base, name));
      await fsp.rm(target, { recursive: true, force: true }).catch(() => {});
    }
    const profile = this.profiles.get(id);
    if (profile) {
      profile.cookies = '';
      profile.updatedAt = new Date().toISOString();
      this.profiles.set(id, profile);
      await this.persist().catch(() => {});
    }
    return { success: true, id };
  },

  async clearProfileCache(root) {
    const base = path.join(root, 'Default');
    for (const name of ['Cache', 'Code Cache', 'GPUCache', path.join('Service Worker', 'CacheStorage')]) {
      const target = await assertSafeProfileChild(root, path.join(base, name));
      await fsp.rm(target, { recursive: true, force: true }).catch(() => {});
    }
  },

  /** Export live cookies via CDP for cloud backup on close. */
  async exportProfileCookies(connection) {
    if (!connection?.command) return '';
    try {
      const result = await connection.command('Storage.getCookies', {}, 15000);
      const list = Array.isArray(result?.cookies) ? result.cookies : [];
      const compact = list.slice(0, 5000).map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        secure: Boolean(c.secure),
        httpOnly: Boolean(c.httpOnly),
        sameSite: c.sameSite,
        expires: c.expires,
      }));
      return JSON.stringify(compact);
    } catch (_) {
      return '';
    }
  },

  async importProfileCookies(connection, raw) {
    if (!raw) return 0; const values = JSON.parse(raw); if (!Array.isArray(values)) throw new Error('Cookie JSON must be an array');
    const sameSite = (value) => ({ strict: 'Strict', lax: 'Lax', none: 'None', no_restriction: 'None', unspecified: undefined })[String(value || '').toLowerCase()];
    const cookies = values.slice(0, 5000).map((item) => {
      if (!item || typeof item.name !== 'string' || typeof item.value !== 'string') throw new Error('Cookie entries require name and value');
      const cookie = { name: item.name, value: item.value, path: String(item.path || '/'), secure: Boolean(item.secure), httpOnly: Boolean(item.httpOnly ?? item.http_only) };
      if (item.url) cookie.url = String(item.url); else if (item.domain) cookie.domain = String(item.domain);
      if (!cookie.url && !cookie.domain) throw new Error('Cookie entry requires url or domain');
      const site = sameSite(item.sameSite ?? item.same_site); if (site) cookie.sameSite = site;
      const expires = Number(item.expires ?? item.expirationDate ?? item.expiration_date); if (Number.isFinite(expires) && expires > 0) cookie.expires = expires > 1e12 ? expires / 1000 : expires;
      return cookie;
    });
    if (cookies.length) await connection.command('Storage.setCookies', { cookies }, 30000); return cookies.length;
  },};
