'use strict';

/**
 * Profile store API mixin for BrowserEngine (prototype-assigned by engine.js):
 * profile CRUD, trash/restore/purge, cache clearing, and cookie import/export.
 * Persistence itself stays in engine/persistence.js and engine/state-storage.js;
 * these are the operations the UI and profile-store-sqlite drive.
 */

const { assertProfileId, assertSafeProfileChild, validateProfileRootSecure } = require('../automation/isolation');
const { prepareProfileSync } = require('./profile-sync');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

module.exports = {
  async syncProfiles(values) {
    const staged = prepareProfileSync(this, values);
    this.invalidateStatusCache?.();
    for (const [id, profile] of staged.profiles) this.profiles.set(id, profile);
    for (const [id, assigned] of staged.assignments) this.assignments.set(id, assigned);
    for (const id of staged.networkInvalidations) this.networkInfo.delete(id);
    // Do not drop unknown engine profiles here — deleteProfiles is the explicit path.
    // persist() coalesces the burst, checks row differences and propagates write
    // failures. Saving here as well hashed the same credential payload twice.
    await this.persist();
    return this.status();
  },

  async deleteProfiles(ids, deleteData = true) {
    if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
    const safeIds = [...new Set(ids.map(assertProfileId))];
    this.deletingProfiles ||= new Set();
    if (safeIds.some((id) => this.deletingProfiles.has(id))) {
      throw Object.assign(new Error('Profile deletion is already in progress'), { code: 'PROFILE_DELETING' });
    }
    for (const id of safeIds) this.deletingProfiles.add(id);
    try {
      return await this._deleteProfiles(safeIds, deleteData);
    } finally {
      for (const id of safeIds) this.deletingProfiles.delete(id);
    }
  },

  async _deleteProfiles(safeIds, deleteData) {
    this.invalidateStatusCache?.();
    const deleted = []; let stopped = 0;

    // Phase 1 — stop running environments with bounded concurrency. A serial
    // stop loop serialized every window's teardown (taskkill scans, helper
    // drains …); batches of deleted environments waited for each sibling.
    const activeIds = safeIds.filter((id) =>
      this.profiles.has(id)
      && (this.running.has(id) || this.starting.has(id) || this.stopping.has(id)));
    for (let offset = 0; offset < activeIds.length; offset += 4) {
      const batch = activeIds.slice(offset, offset + 4);
      const results = await Promise.allSettled(batch.map((id) => this.stop(id)));
      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        if (result.status === 'rejected') throw result.reason;
        const id = batch[index];
        if (result.value?.running || result.value?.cleanupBlocked
          || this.running.has(id) || this.starting.has(id) || this.stopping.has(id)) {
          throw Object.assign(new Error(`Browser exit is unconfirmed for profile ${id}; deletion stopped`), {
            code: 'BROWSER_EXIT_UNCONFIRMED', profileId: id,
          });
        }
        if (!result.value?.alreadyStopped) stopped += 1;
      }
    }

    // Phase 2 — remove data directories with the same bounded concurrency.
    if (deleteData) {
      const removals = safeIds.filter((id) => this.profiles.has(id));
      const removeRoot = async (id) => {
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
      };
      for (let offset = 0; offset < removals.length; offset += 4) {
        const batch = removals.slice(offset, offset + 4);
        const results = await Promise.allSettled(batch.map(removeRoot));
        for (const result of results) {
          if (result.status === 'rejected') throw result.reason;
        }
      }
    }

    // Phase 3 — after directory removal, commit the database batch before
    // removing live records, then persist the remaining engine state once.
    const existingIds = safeIds.filter((id) => this.profiles.has(id));
    if (existingIds.length && this.usingSqlite && this.sqliteStore) {
      // One transaction for the batch. A database failure must leave the
      // in-memory records intact instead of committing a partial removal.
      this.sqliteStore.deleteProfiles(existingIds);
    }
    for (const id of existingIds) {
      this.profiles.delete(id);
      this.assignments.delete(id);
      this.networkInfo.delete(id);
      deleted.push(id);
    }
    if (deleted.length) await this.persist();
    this.emit({ type: 'profiles', action: 'delete', ids: deleted }); this.emit({ type: 'extensions' });
    return { success: true, deleted: deleted.length, stopped, dataDeleted: Boolean(deleteData), ids: deleted };
  },

  async trashProfiles(ids) {
    if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
    const safeIds = [...new Set(ids.map(assertProfileId))];
    // Same operation guard as deleteProfiles: trashing shares the deletingProfiles
    // set so a start() racing in mid-transition is rejected by the existing check
    // in engine.js, and a second trash/delete of the same ids cannot interleave
    // its stop phase with this one.
    this.deletingProfiles ||= new Set();
    if (safeIds.some((id) => this.deletingProfiles.has(id))) {
      throw Object.assign(new Error('Profile deletion is already in progress'), { code: 'PROFILE_DELETING' });
    }
    for (const id of safeIds) this.deletingProfiles.add(id);
    try {
      return await this._trashProfiles(safeIds);
    } finally {
      for (const id of safeIds) this.deletingProfiles.delete(id);
    }
  },

  async _trashProfiles(safeIds) {
    this.invalidateStatusCache?.();
    const trashed = [];
    let stopped = 0;
    const nowIso = new Date().toISOString();

    // Phase 1 — stop running environments first, with the same bounded-concurrency
    // batches deleteProfiles uses. Trash is a soft delete, but it still must not
    // flip profiles to trashed while their windows are live: the wrapper teardown
    // persists state on close, and a mid-stop persist of a partially trashed batch
    // committed the subset as final even when a later item's stop failed.
    const activeIds = safeIds.filter((id) =>
      this.profiles.has(id)
      && (this.running.has(id) || this.starting.has(id) || this.stopping.has(id)));
    for (let offset = 0; offset < activeIds.length; offset += 4) {
      const batch = activeIds.slice(offset, offset + 4);
      const results = await Promise.allSettled(batch.map((id) => this.stop(id)));
      for (let index = 0; index < results.length; index += 1) {
        const result = results[index];
        if (result.status === 'rejected') throw result.reason;
        const id = batch[index];
        if (result.value?.running || result.value?.cleanupBlocked
          || this.running.has(id) || this.starting.has(id) || this.stopping.has(id)) {
          throw Object.assign(new Error(`Browser exit is unconfirmed for profile ${id}; trashing stopped`), {
            code: 'BROWSER_EXIT_UNCONFIRMED', profileId: id,
          });
        }
        if (!result.value?.alreadyStopped) stopped += 1;
      }
    }

    // Phase 2 — only after every stop resolved does any profile flip to trashed.
    // A rejected or incomplete stop above aborts with zero partial trash instead
    // of leaving a subset the next unrelated persist would commit.
    for (const id of safeIds) {
      const profile = this.profiles.get(id);
      if (!profile) continue;
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
    this.invalidateStatusCache?.();
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
    // deleteProfiles invalidates the status cache itself.
    return this.deleteProfiles(ids, deleteData);
  },

  async emptyTrash(deleteData = true) {
    this.invalidateStatusCache?.();
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
