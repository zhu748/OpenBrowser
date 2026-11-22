'use strict';

/**
 * Profile store API mixin for BrowserEngine (prototype-assigned by engine.js):
 * profile CRUD, trash/restore/purge, cache clearing, and cookie import/export.
 * Persistence itself stays in engine/persistence.js and engine/state-storage.js;
 * these are the operations the UI and profile-store-sqlite drive.
 */

const { assertProfileId } = require('../automation/isolation');
const { prepareProfileSync } = require('./profile-sync');
const { persistProfileSync } = require('./profile-publication');
const { assertProfileNotMaintained, acquireProfileMaintenance } = require('./profile-maintenance');
const { assertProfileRestoreReady } = require('../automation/cloud/file-restore');
const { FIREFOX_COOKIES, isFirefoxProfile, removeBrowserFiles, clearBrowserCache } = require('../automation/browser-data');
const { deleteProfileDirectories } = require('./profile-deletion');

async function withProfileLifecycleChange(engine, ids, change) {
  if (!Array.isArray(ids) || ids.length > 200) throw new Error('Invalid profile selection');
  const safeIds = [...new Set(ids.map(assertProfileId))];
  for (const id of safeIds) assertProfileNotMaintained(engine, id);
  engine.deletingProfiles ||= new Set();
  if (safeIds.some((id) => engine.deletingProfiles.has(id))) {
    throw Object.assign(new Error('Profile lifecycle change is already in progress'), { code: 'PROFILE_DELETING' });
  }
  for (const id of safeIds) engine.deletingProfiles.add(id);
  try {
    return await change(safeIds);
  } finally {
    for (const id of safeIds) engine.deletingProfiles.delete(id);
  }
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
    // Do not drop unknown engine profiles here — deleteProfiles is the explicit path.
    // persist() coalesces the burst, checks row differences and propagates write
    // failures. Saving here as well hashed the same credential payload twice.
    await persistProfileSync(this, staged);
    this.emit({ type: 'status', action: 'profiles-update' });
    const rows = this.status();
    return options.delta === true ? rows.filter((row) => staged.profiles.has(row.id)) : rows;
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
  async applyProfileCommands(commands, options = {}) {
    if (!Array.isArray(commands) || commands.length > 200 || commands.length === 0) {
      throw new Error('Invalid profile commands');
    }
    const seen = new Set();
    const modify = [];
    for (const command of commands) {
      if (!command || typeof command !== 'object' || !['modify', 'patch'].includes(command.kind)) {
        throw new Error('Unknown profile command');
      }
      const id = assertProfileId(command.id);
      if (command.kind === 'modify' && (!command.profile || command.profile.id !== id)) {
        throw Object.assign(new Error('Profile command ID does not match payload'), { code: 'PROFILE_COMMAND_ID_MISMATCH' });
      }
      if (!this.profiles.has(id)) {
        throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'PROFILE_NOT_FOUND' });
      }
      if (seen.has(id)) throw Object.assign(new Error(`Duplicate command for profile ${id}`), { code: 'PROFILE_COMMAND_DUPLICATE' });
      seen.add(id);
      const baseRev = Number(command.baseRev);
      if (!Number.isInteger(baseRev) || baseRev < 0) throw new Error('Invalid base revision');
      let profile = command.profile;
      if (command.kind === 'patch') {
        const patch = command.patch;
        const fields = new Set(['name', 'title', 'number', 'groupId', 'tag', 'note']);
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)
          || !Object.keys(patch).length || Object.keys(patch).some((key) => !fields.has(key))) {
          throw new Error('Invalid profile metadata patch');
        }
        // Resolve untouched fields from authoritative state, never the UI's
        // redacted or stale full profile. Identity and credentials cannot be patched.
        profile = { ...this.profiles.get(id), ...patch };
      }
      modify.push({ id, baseRev, profile });
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
    await persistProfileSync(this, staged);
    this.emit({ type: 'status', action: 'profiles-update' });
    const rows = this.status();
    return options?.delta === true ? rows.filter((row) => seen.has(row.id)) : rows;
  },

  deleteProfiles(ids, deleteData = true) {
    return withProfileLifecycleChange(this, ids, (safeIds) => this._deleteProfiles(safeIds, deleteData));
  },

  async _deleteProfiles(safeIds, deleteData) {
    this.invalidateStatusCache?.();
    // Preflight the whole batch before removing any data: recovery backups
    // from an interrupted restore must not disappear in a later bulk purge.
    if (deleteData) {
      for (let offset = 0; offset < safeIds.length; offset += 4) {
        await Promise.all(safeIds.slice(offset, offset + 4)
          .filter((id) => this.profiles.has(id)).map((id) => assertProfileRestoreReady(this.profileRoot(id))));
      }
    }

    const stopped = await this._stopProfilesForRemoval(safeIds);
    const deleted = safeIds.filter((id) => this.profiles.has(id));
    if (deleted.length) {
      const commit = () => this._persistProfileDeletion(deleted);
      if (deleteData) await deleteProfileDirectories(this, deleted, commit);
      else await commit();
    }
    this.emit({ type: 'profiles', action: 'delete', ids: deleted });
    this.emit({ type: 'extensions' });
    return { success: true, deleted: deleted.length, stopped, dataDeleted: Boolean(deleteData), ids: deleted };
  },

  async _stopProfilesForRemoval(safeIds) {
    let stopped = 0;
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
          throw Object.assign(new Error(`Browser exit is unconfirmed for profile ${id}`), {
            code: 'BROWSER_EXIT_UNCONFIRMED', profileId: id,
          });
        }
        if (!result.value?.alreadyStopped) stopped += 1;
      }
    }

    return stopped;
  },

  trashProfiles(ids) {
    return withProfileLifecycleChange(this, ids, async (safeIds) => {
      const stopped = await this._stopProfilesForRemoval(safeIds);
      const trashed = await this._persistProfileTrashState(safeIds, true);
      this.emit({ type: 'profiles', action: 'trash', ids: trashed });
      return { success: true, trashed: trashed.length, stopped, ids: trashed };
    });
  },

  restoreProfiles(ids) {
    return withProfileLifecycleChange(this, ids, async (safeIds) => {
      const restored = await this._persistProfileTrashState(safeIds, false);
      this.emit({ type: 'profiles', action: 'restore', ids: restored });
      return { success: true, restored: restored.length, ids: restored };
    });
  },

  async purgeProfiles(ids, deleteData = true) {
    // deleteProfiles invalidates the status cache itself.
    return this.deleteProfiles(ids, deleteData);
  },

  purgeTrashedProfiles(ids, deleteData = true, { trashedAtById, revisions, beforeRemove } = {}) {
    return withProfileLifecycleChange(this, ids, async (safeIds) => {
      const selected = safeIds.filter((id) => {
        const profile = this.profiles.get(id);
        return profile?.trashed
          && (!revisions || !Object.hasOwn(revisions, id) || this.profiles.revisionOf?.(id) === revisions[id])
          && (!trashedAtById || !Object.hasOwn(trashedAtById, id) || (profile.trashedAt ?? null) === trashedAtById[id]);
      });
      if (!selected.length) return { success: true, deleted: 0, stopped: 0, dataDeleted: Boolean(deleteData), ids: [] };
      await beforeRemove?.(selected);
      return this._deleteProfiles(selected, deleteData);
    });
  },

  async emptyTrash(deleteData = true) {
    const trashedIds = [...this.profiles.values()]
      .filter((profile) => profile.trashed)
      .map((profile) => profile.id);
    const revisions = this.profiles.revisionState?.(trashedIds);
    const result = { success: true, deleted: 0, stopped: 0, dataDeleted: Boolean(deleteData), ids: [] };
    for (let offset = 0; offset < trashedIds.length; offset += 200) {
      try {
        const batch = await this.purgeTrashedProfiles(trashedIds.slice(offset, offset + 200), deleteData, { revisions });
        result.deleted += batch.deleted || 0;
        result.stopped += batch.stopped || 0;
        result.ids.push(...(batch.ids || []));
      } catch (error) {
        error.completed = result.deleted;
        error.remainingIds = trashedIds.slice(offset);
        throw error;
      }
    }
    return result;
  },

  /** Clear cache + cookies on disk for a stopped profile. */
  async clearProfileCacheAndCookies(profileId) {
    const id = assertProfileId(profileId);
    const lease = acquireProfileMaintenance(this, [id]);
    try {
      const root = this.profileRoot(id);
      await assertProfileRestoreReady(root);
      const profile = this.profiles.get(id);
      await clearBrowserCache(root, profile);
      await removeBrowserFiles(root, isFirefoxProfile(profile)
        ? FIREFOX_COOKIES : ['Default/Network/Cookies', 'Default/Network/Cookies-journal', 'Default/Network/Cookies-wal', 'Default/Network/Cookies-shm', 'Default/Cookies', 'Default/Cookies-journal']);
      if (profile) {
        // Fresh-object write, same reason as trashProfiles above.
        this.profiles.set(id, { ...profile, cookies: '', updatedAt: new Date().toISOString() });
        await this.persist();
      }
    } finally { lease.release(); }
    return { success: true, id };
  },

  async clearProfileCache(root) {
    await clearBrowserCache(root);
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
        ...(c.partitionKey ? { partitionKey: c.partitionKey } : {}),
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
      if (item.partitionKey !== undefined) {
        const key = item.partitionKey;
        if (!key || typeof key.topLevelSite !== 'string' || typeof key.hasCrossSiteAncestor !== 'boolean') throw new Error('Invalid cookie partition key');
        const site = new URL(key.topLevelSite);
        if (!['https:', 'http:'].includes(site.protocol) || site.origin !== key.topLevelSite) throw new Error('Invalid cookie partition site');
        cookie.partitionKey = { topLevelSite: key.topLevelSite, hasCrossSiteAncestor: key.hasCrossSiteAncestor };
      }
      return cookie;
    });
    if (cookies.length) await connection.command('Storage.setCookies', { cookies }, 30000); return cookies.length;
  },};
