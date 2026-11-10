'use strict';

const { captureIpcResult } = require('../shared/ipc-result');

/** Profile IPC; sync selection remains owned by the host and is injected here. */
function registerProfileIpc({ registerTrustedIpc, engine, sanitizeIds, beforeRemove }) {
  function removalIds(payload) {
    const ids = sanitizeIds(payload?.ids || []);
    beforeRemove(ids);
    return ids;
  }
  registerTrustedIpc('profiles:sync', (_event, profiles) => engine.syncProfiles(profiles));
  registerTrustedIpc('profiles:apply-commands', (_event, commands) => captureIpcResult(() => engine.applyProfileCommands(commands)));
  registerTrustedIpc('profiles:editor-state', (_event, id) => captureIpcResult(() => engine.profileForEdit(id)));
  registerTrustedIpc('profiles:delete', (_event, payload) => engine.deleteProfiles(removalIds(payload), payload?.deleteData !== false));
  registerTrustedIpc('profiles:trash', (_event, payload) => engine.trashProfiles(removalIds(payload)));
  registerTrustedIpc('profiles:restore', (_event, payload) => engine.restoreProfiles(sanitizeIds(payload?.ids || [])));
  registerTrustedIpc('profiles:purge', (_event, payload) => engine.purgeProfiles(removalIds(payload), payload?.deleteData !== false));
  registerTrustedIpc('profiles:empty-trash', (_event, payload) => engine.emptyTrash(payload?.deleteData !== false));
  registerTrustedIpc('profiles:start', (_event, profile) => engine.start(profile));
  registerTrustedIpc('profiles:stop', (_event, id) => engine.stop(id));
  registerTrustedIpc('profiles:clear-cache-cookies', (_event, id) => engine.clearProfileCacheAndCookies(id));
  registerTrustedIpc('profiles:status', () => engine.status());
  registerTrustedIpc('profiles:status-delta', (_event, watermark) => engine.statusDelta(watermark));
  registerTrustedIpc('profiles:test-proxy', (_event, profile) => engine.testProxy(profile));
  registerTrustedIpc('profiles:check-proxy', (_event, profile) => engine.checkProxy(profile, { persist: true }));
}

module.exports = { registerProfileIpc };
