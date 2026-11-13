(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../shared/ipc-result'));
  else root.OpenBrowserProfileCommands = factory(root.OpenBrowserIpcResult);
})(globalThis, (ipc) => {
  'use strict';

  const { unwrapIpcResult } = ipc;
  const MAX_IMPORT_BYTES = 16 * 1024 * 1024;
  const MAX_IMPORT_PROFILES = 5000;

  function validateImportText(value) {
    const text = String(value ?? '');
    if (text.length > MAX_IMPORT_BYTES || new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
      throw new Error('导入文件超过 16 MiB，请分批导入');
    }
    return text;
  }

  async function readImportFile(file) {
    if (!file || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_IMPORT_BYTES) {
      throw new Error('导入文件无效或超过 16 MiB，请分批导入');
    }
    return validateImportText(await file.text());
  }

  /** Import data owns its credentials and routing; defaults supply preferences. */
  function buildImportedProfile(base, row, { id, number }) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid imported profile');
    const ownProxy = Object.hasOwn(row, 'proxy');
    const proxy = ownProxy ? String(row.proxy ?? '').trim() || 'Direct' : base.proxy;
    const direct = /^(direct|offline|none)$/i.test(proxy || 'Direct');
    const startUrl = row.startUrl ?? base.startUrl ?? base.platform?.startUrl ?? '';
    return {
      ...base, id, number, name: String(number), title: row.title || `环境-${number}`,
      os: row.os || base.os || 'Windows', startUrl,
      networkMode: ownProxy ? (direct ? 'direct' : 'proxy') : base.networkMode, proxy,
      ...(ownProxy ? { proxyId: null, proxyMeta: { ...(base.proxyMeta || {}), proxyId: null } } : {}),
      cookies: row.cookies ?? '', username: '', password: '', totpSecret: '', otp: '',
      tag: row.tag ?? base.tag ?? '', note: row.note ?? base.note ?? '',
      platform: { ...(base.platform || {}), startUrl, username: row.username ?? '',
        password: row.password ?? '', totpSecret: row.totpSecret ?? '', otp: '',
        accounts: Array.isArray(row.accounts) ? structuredClone(row.accounts) : [],
      },
      advanced: { ...(base.advanced || {}), ...(Object.hasOwn(row, 'startUrl') ? { startUrls: startUrl } : {}) },
    };
  }

  function resolveEditorUaDraft({ current = {}, userAgent = '', generatedUa = null, reset = false }) {
    const value = String(userAgent || '').trim();
    const previous = current.privacy?.fingerprint?.userAgent || current.userAgent || '';
    const generated = generatedUa?.userAgent === value ? generatedUa : null;
    const keep = !reset && value === previous;
    return {
      userAgent: value,
      fingerprint: {
        // The editor has one visible UA field. Migrate the hidden legacy override
        // and discard old hints when the user changes or clears that field.
        userAgent: undefined,
        clientHints: generated?.clientHints || (keep ? current.privacy?.fingerprint?.clientHints : undefined),
        uaGenerated: generated ? generated.kernelBound === true : (keep && current.privacy?.fingerprint?.uaGenerated === true),
      },
    };
  }

  /** Fetch fields and their revision together; only the latest request may open. */
  function createProfileEditorOpener({ readSnapshot, show }) {
    let generation = 0;
    return {
      cancel() { generation += 1; },
      async open(id) {
        const request = ++generation;
        try {
          const snapshot = unwrapIpcResult(await readSnapshot(id));
          if (request !== generation) return false;
          if (!snapshot?.profile || snapshot.profile.id !== id || !Number.isSafeInteger(snapshot.rev) || snapshot.rev < 1) {
            throw Object.assign(new Error('Invalid profile editor snapshot'), { code: 'PROFILE_SNAPSHOT_INVALID' });
          }
          show(snapshot);
          return true;
        } catch (error) {
          if (request !== generation) return false;
          throw error;
        }
      },
    };
  }

  /** Commit local state only after the engine accepts the exact edited revision. */
  async function commitProfileEdit({ profile, baseRev, applyCommands, commit }) {
    const payload = { ...profile, credentialsAction: 'replace' };
    const rows = unwrapIpcResult(await applyCommands([{
      kind: 'modify', id: profile.id, baseRev, profile: payload,
    }]));
    if (!Array.isArray(rows) || !rows.some((row) => row?.id === profile.id && Number.isSafeInteger(row.rev) && row.rev > 0)) {
      throw Object.assign(new Error('Invalid profile command result'), { code: 'PROFILE_COMMAND_RESULT_INVALID' });
    }
    // A conflict is deliberately propagated. Replacing baseRev with a fresh
    // value would claim that this draft had seen concurrent engine changes.
    commit(profile, rows);
    return rows;
  }

  /** Bounded metadata edits; acknowledged chunks publish before any later failure. */
  async function commitProfilePatches({ patches, rows, applyCommands, onCommitted }) {
    const current = new Map(rows.map((row) => [row.id, row]));
    const seen = new Set();
    const commands = patches.map(({ id, patch }) => {
      const row = current.get(id);
      if (!row || !Number.isSafeInteger(row.rev) || row.rev < 1 || seen.has(id)) {
        throw new Error('Invalid or duplicate profile patch target: ' + id);
      }
      seen.add(id);
      return { kind: 'patch', id, baseRev: row.rev, patch: structuredClone(patch) };
    });
    let completed = 0;
    try {
      for (let offset = 0; offset < commands.length; offset += 200) {
        const batch = commands.slice(offset, offset + 200);
        const accepted = unwrapIpcResult(await applyCommands(batch, { delta: true }));
        const expected = new Map(batch.map((entry) => [entry.id, entry]));
        const received = new Set();
        if (!Array.isArray(accepted) || accepted.length !== batch.length || accepted.some((row) => {
          if (!expected.has(row?.id) || received.has(row.id) || !Number.isSafeInteger(row.rev)
            || row.rev < expected.get(row.id).baseRev) return true;
          received.add(row.id);
          return false;
        })) throw new Error('Invalid profile patch result');
        onCommitted(batch, accepted);
        completed += batch.length;
      }
    } catch (error) {
      error.completedCount = completed;
      throw error;
    }
  }

  /**
   * Own an editor save session independently of renderer globals. All reads are
   * explicit so a completed request cannot close another editor or borrow the
   * revision of a newer background refresh for an older draft.
   */
  function createProfileEditorSubmit({ getSession, getProfiles, readDraft, ops, publish, setRows,
    normalize, saveProxy, afterProxy, onSaved, onError, onConflict, onWarning }) {
    let saving = false;
    return async (event) => {
      event.preventDefault();
      if (saving) return;
      const session = getSession();
      const previous = getProfiles().find((profile) => profile.id === session.id);
      if (!previous) return onError(new Error('环境不存在'));
      const form = event.currentTarget;
      saving = true;
      if (form) form.dataset.saving = '1';
      const commit = (profile, baseRev) => commitProfileEdit({ profile, baseRev,
        applyCommands: (commands) => ops.applyProfileCommands(commands),
        commit: (accepted, rows) => { publish(accepted); setRows(rows); },
      });
      try {
        const draft = readDraft();
        if (!draft.name) throw new Error('环境名称不能为空');
        if (draft.proxy !== previous.proxy && !session.networkResult) {
          for (const key of ['exitIp', 'exitCountryCode', 'exitTimezone', 'exitLatitude', 'exitLongitude', 'exitCheckedAt']) delete draft[key];
        }
        draft.updatedAt = new Date().toISOString();
        const rows = await commit(draft, session.baseRev);
        if (saveProxy) {
          try {
            const proxyId = await saveProxy(draft, session);
            if (proxyId) {
              const linked = { ...draft, proxyId, proxyMeta: { ...(draft.proxyMeta || {}), proxyId } };
              // The draft has seen exactly this command result, never a newer
              // polling snapshot that may contain changes from another client.
              await commit(linked, rows.find((row) => row.id === draft.id).rev);
            }
            await afterProxy?.(draft, session);
          } catch (error) { onWarning(error); }
        }
        onSaved(draft, session);
        return true;
      } catch (error) {
        if (error?.code === 'PROFILE_STALE_REV') {
          try {
            const current = unwrapIpcResult(await ops.profileForEdit(session.id));
            publish(normalize(current.profile));
            setRows(await ops.profileStatus());
          } catch (refreshError) { onWarning(refreshError); }
          // Refresh the row, but do not grant the still-open draft a new revision.
          onConflict(error);
        } else { onError(error); }
        return false;
      } finally {
        saving = false;
        if (form) delete form.dataset.saving;
      }
    };
  }

  return { MAX_IMPORT_BYTES, MAX_IMPORT_PROFILES, validateImportText, readImportFile,
    buildImportedProfile, commitProfileEdit, commitProfilePatches, createProfileEditorOpener, createProfileEditorSubmit, resolveEditorUaDraft };
});
