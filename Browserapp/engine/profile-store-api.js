'use strict';

/**
 * Profile store API mixin for BrowserEngine (prototype-assigned by engine.js):
 * profile CRUD, trash/restore/purge, cache clearing, and cookie import/export.
 * Persistence itself stays in engine/persistence.js and engine/state-storage.js;
 * these are the operations the UI and profile-store-sqlite drive.
 */

const { assertProfileId, assertSafeProfileChild, validateProfileRootSecure } = require('../automation/isolation');
const { prepareProfileSync } = require('./profile-sync');
const { assertProfileNotMaintained, acquireProfileMaintenance } = require('./profile-maintenance');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

/** One publication path for full sync and revision-checked commands. */
function publishProfileSync(engine, staged) {
  engine.invalidateStatusCache?.();
  for (const [id, profile] of staged.profiles) engine.profiles.set(id, profile);
  for (const [id, assigned] of staged.assignments) engine.assignments.set(id, assigned);
  for (const id of staged.networkInvalidations) engine.networkInfo.delete(id);
}

module.exports = {
  profileForEdit(id) {
    const safeId = assertProfileId(id);
    const profile = this.profiles.get(safeId);
    if (!profile) throw Object.assign(new Error(`Profile not found: ${safeId}`), { code: 'PROFILE_NOT_FOUND' });
    // Explicit trusted-editor read; polling status continues to redact secrets.
    return { profile: structuredClone(profile), rev: this.profiles.revisionOf(safeId) };
  },

  async syncProfiles(values, options = {}) {
    const staged = prepareProfileSync(this, values, options);
    publishProfileSync(this, staged);
    // Do not drop unknown engine profiles here — deleteProfiles is the explicit path.
    // persist() coalesces the burst, checks row differences and propagates write
    // failures. Saving here as well hashed the same credential payload twice.
    await this.persist();
    return this.status();
  },

  /**
   * Per-ID modify commands with base-revision conflict detection. Reuses
   * prepareProfileSync unchanged (validation, merge, extension inheritance,
   * association break and network invalidation all apply per command), so the
   * only difference from syncProfiles is scope + the conflict gate.
   *
   * Command: { kind: 'modify', id, baseRev, profile } — the profile is the
   * full edited form exactly as syncProfiles would receive it (same fields,
   * same redaction behavior). baseRev is the engine revision the editor
   * started from (status view's .rev). When the engine has moved on since
   * (proxy exit persisted, close-time cookie snapshot, local API edit …),
   * the command is REJECTED with code PROFILE_STALE_REV: the caller refreshes
   * its row before editing again. Never silently resubmit an old draft with
   * a newer revision or use a full sync to bypass the conflict gate.
   */
  async applyProfileCommands(commands) {
    if (!Array.isArray(commands) || commands.length > 200 || commands.length === 0) {
      throw new Error('Invalid profile commands');
    }
    const seen = new Set();
    const modify = [];
    for (const command of commands) {
      if (!command || typeof command !== 'object' || command.kind !== 'modify') {
        throw new Error('Unknown profile command');
      }
      const id = assertProfileId(command.id);
      if (!command.profile || command.profile.id !== id) {
        throw Object.assign(new Error('Profile command ID does not match payload'), { code: 'PROFILE_COMMAND_ID_MISMATCH' });
      }
      if (!this.profiles.has(id)) {
        throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'PROFILE_NOT_FOUND' });
      }
      if (seen.has(id)) throw Object.assign(new Error(`Duplicate command for profile ${id}`), { code: 'PROFILE_COMMAND_DUPLICATE' });
      seen.add(id);
      const baseRev = Number(command.baseRev);
      if (!Number.isInteger(baseRev) || baseRev < 0) throw new Error('Invalid base revision');
      modify.push({ id, baseRev, profile: command.profile });
    }
    const stale = modify.filter((entry) => this.profiles.revisionOf?.(entry.id) !== entry.baseRev);
    if (stale.length) {
      // Reject the whole batch: half-applied commands would strand the caller
      // between two revisions. The error carries both sides so the renderer
      // can refresh exactly the affected rows.
      throw Object.assign(new Error(`Profile revision conflict for: ${stale.map((entry) => entry.id).join(', ')}`), {
        code: 'PROFILE_STALE_REV',
        stale: stale.map((entry) => ({ id: entry.id, baseRev: entry.baseRev, rev: this.profiles.revisionOf?.(entry.id) || 0 })),
      });
    }
    const staged = prepareProfileSync(this, modify.map((entry) => entry.profile));
    publishProfileSync(this, staged);
    await this.persist();
    return this.status();
  },

  async deleteProfiles(ids, deleteData = true) {
    if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
    const safeIds = [...new Set(ids.map(assertProfileId))];
    for (const id of safeIds) assertProfileNotMaintained(this, id);
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
    for (const id of safeIds) assertProfileNotMaintained(this, id);
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
      // Fresh-object write: in-place mutation would go undetected by the
      // identity-memoized profileDataHash (round-4 PERF-2).
      this.profiles.set(id, { ...profile, trashed: true, trashedAt: nowIso });
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
    for (const id of safeIds) assertProfileNotMaintained(this, id);
    const restored = [];
    for (const id of safeIds) {
      const profile = this.profiles.get(id);
      if (!profile) continue;
      // Fresh-object write, same reason as trashProfiles above.
      this.profiles.set(id, { ...profile, trashed: false, trashedAt: null });
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
    const lease = acquireProfileMaintenance(this, [id]);
    try {
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
        // Fresh-object write, same reason as trashProfiles above.
        this.profiles.set(id, { ...profile, cookies: '', updatedAt: new Date().toISOString() });
        await this.persist();
      }
    } finally { lease.release(); }
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
