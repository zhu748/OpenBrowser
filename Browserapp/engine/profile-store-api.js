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

async function commitProfileSync(engine, values, options, prepareReply) {
  const staged = prepareProfileSync(engine, values, options);
  // Build an optional receipt from the detached snapshot that this write owns,
  // before any formatting error could turn a successful write into a failure.
  const reply = prepareReply?.(structuredClone([...staged.profiles.values()]));
  // Do not drop unknown profiles here: deletion has its own explicit path.
  // persist() coalesces the write and propagates persistence failures.
  await persistProfileSync(engine, staged);
  return { staged, reply };
}

function notifyProfileCommit(engine) {
  try { engine.emit({ type: 'status', action: 'profiles-update' }); }
  catch (_) {
    try { console.warn('[BrowserEngine] Profile update notification failed after commit'); }
    catch (_) { /* diagnostics must not change the commit result */ }
  }
}

function stageProfileCommands(engine, commands, { activeOnly = false } = {}) {
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
    const current = engine.profiles.get(id);
    if (!current) {
      throw Object.assign(new Error(`Profile not found: ${id}`), { code: 'PROFILE_NOT_FOUND' });
    }
    if (activeOnly && current.trashed) {
      throw Object.assign(new Error('所选窗口已移入回收站，请刷新后重试'), { code: 'PROFILE_INACTIVE' });
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
      profile = { ...current, ...patch };
    }
    modify.push({ id, baseRev, profile });
  }
  const stale = modify.filter((entry) => engine.profiles.revisionOf?.(entry.id) !== entry.baseRev);
  if (stale.length) {
    // Reject the whole batch: half-applied commands would strand the caller
    // between two revisions. The error carries both sides so the renderer
    // can refresh exactly the affected rows.
    throw Object.assign(new Error(`Profile revision conflict for: ${stale.map((entry) => entry.id).join(', ')}`), {
      code: 'PROFILE_STALE_REV',
      stale: stale.map((entry) => ({ id: entry.id, baseRev: entry.baseRev, rev: engine.profiles.revisionOf?.(entry.id) || 0 })),
    });
  }
  return { seen, staged: prepareProfileSync(engine, modify.map((entry) => entry.profile)) };
}

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
    const { staged } = await commitProfileSync(this, values, options);
    this.emit({ type: 'status', action: 'profiles-update' });
    const rows = this.status();
    return options.delta === true ? rows.filter((row) => staged.profiles.has(row.id)) : rows;
  },

  // Internal callers coordinating persisted metadata need confirmation of
  // the write, not a status projection. Nothing after commit should tell
  // them to compensate or retry an already persisted profile change.
  async commitProfiles(values, { prepareReply, ...options } = {}) {
    const { reply } = await commitProfileSync(this, values, options, prepareReply);
    notifyProfileCommit(this);
    return reply;
  },

  // Additive commands drawn from the active roster must reject the whole
  // selection if a target was recycled. Validate them in the same synchronous
  // staging pass as revisions, before publishing or persisting any row.
  async commitActiveProfileCommands(commands) {
    const { staged } = stageProfileCommands(this, commands, { activeOnly: true });
    await persistProfileSync(this, staged);
    notifyProfileCommit(this);
  },

  // The editor needs its own detached DTO and revision, not a fresh read
  // that can fail or pick up a different write after this commit.
  async commitProfileCommand(command, prepareReply) {
    const { staged } = stageProfileCommands(this, [command]);
    const reply = prepareReply(structuredClone(staged.profiles.get(command.id)));
    const writing = persistProfileSync(this, staged);
    // Publication is synchronous up to the persistence barrier. Capture
    // the revision of these staged fields before awaiting the disk write.
    const rev = this.profiles.revisionOf(command.id);
    await writing;
    notifyProfileCommit(this);
    return { ...reply, rev };
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
    const { seen, staged } = stageProfileCommands(this, commands);
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

  /** Return a complete live snapshot or an empty string when it cannot be read. */
  async exportProfileCookies(connection, engine = 'chromium', timeout = 1500) {
    if (!connection?.command) return '';
    try {
      const result = await connection.command(engine === 'firefox' ? 'storage.getCookies' : 'Storage.getCookies', {}, timeout);
      if (!Array.isArray(result?.cookies) || result.cookies.length > 5000) return '';
      const compact = result.cookies.filter(cookie => !cookie.partitionKeyOpaque).map((cookie) => {
        const value = typeof cookie.value === 'string' ? cookie.value
          : cookie.value?.type === 'base64' ? Buffer.from(cookie.value.value, 'base64').toString('latin1')
          : cookie.value?.value;
        if (typeof cookie.name !== 'string' || typeof value !== 'string' || typeof cookie.domain !== 'string')
          throw new Error('Invalid cookie snapshot');
        return {
          name: cookie.name,
          value,
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: Boolean(cookie.secure),
          httpOnly: Boolean(cookie.httpOnly),
          sameSite: cookie.sameSite,
          expires: cookie.expires ?? cookie.expiry,
          ...(cookie.partitionKey ? { partitionKey: cookie.partitionKey } : {}),
        };
      });
      const snapshot = JSON.stringify(compact);
      return snapshot.length <= 500000 ? snapshot : '';
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
