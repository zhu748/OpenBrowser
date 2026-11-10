(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../shared/ipc-result'));
  else root.OpenBrowserProfileCommands = factory(root.OpenBrowserIpcResult);
})(globalThis, (ipc) => {
  'use strict';

  const { unwrapIpcResult } = ipc;

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

  return { commitProfileEdit, createProfileEditorOpener };
});
