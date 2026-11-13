'use strict';

/** Extension IPC domain; all handlers use the host's trusted registration. */
function registerExtensionIpc({ registerTrustedIpc, engine, dialog, sanitizeIds, fetchStorePackage }) {
  let actions = Promise.resolve();
  function registerAction(channel, handler) {
    registerTrustedIpc(channel, (...args) => {
      const next = actions.then(() => handler(...args));
      actions = next.catch(() => {});
      return next;
    });
  }
  // Batch stop+restart for the extension install / global-toggle flows. This
  // used to be two serial for-loops: one failing stop aborted the whole batch
  // and left the remaining environments stopped-but-not-restarted, and every
  // step waited for the previous one.
  async function restartRunningProfiles(profileIds) {
    const stopIds = [...profileIds];
    const stopOk = new Set();
    const restartFailures = [], restartSkipped = [];
    let stopCursor = 0;
    await Promise.all(Array.from({ length: Math.min(4, stopIds.length) }, async () => {
      while (stopCursor < stopIds.length) {
        const id = stopIds[stopCursor++];
        try {
          const result = await engine.stop(id);
          if (result?.running || result?.cleanupBlocked || engine.running.has(id)) {
            restartFailures.push({ id, phase: 'stop', message: 'Browser exit is unconfirmed' }); continue;
          }
          stopOk.add(id);
        } catch (error) {
          restartFailures.push({ id, phase: 'stop', message: error.message });
          console.warn('OpenBrowser batch stop failed for', id, error?.message || error);
        }
      }
    }));
    const restartIds = [...stopOk];
    let startCursor = 0;
    let restarted = 0;
    await Promise.all(Array.from({ length: Math.min(3, restartIds.length) }, async () => {
      while (startCursor < restartIds.length) {
        const id = restartIds[startCursor++];
        const profile = engine.profiles.get(id);
        if (!profile) { restartSkipped.push({ id, reason: 'removed' }); continue; }
        // engine.start is idempotent for concurrent starts of the same id, but
        // a user-initiated start racing this batch used to layer a second
        // progress stream and one extra generation bump on top of it. Skip the
        // display-level restart when a start is already in flight.
        if (engine.starting.has(id)) { restartSkipped.push({ id, reason: 'starting' }); continue; }
        try { await engine.start(profile); restarted += 1; } catch (error) {
          restartFailures.push({ id, phase: 'start', message: error.message });
          console.warn('OpenBrowser batch restart failed for', id, error?.message || error);
        }
      }
    }));
    return { restarted, restartFailures, restartSkipped, partial: Boolean(restartFailures.length || restartSkipped.length) };
  }
  registerTrustedIpc('extensions:list', () => engine.listExtensions());
  registerAction('extensions:add-folder', async () => {
    const result = await dialog.showOpenDialog({ title: '选择已解压的 Chrome 扩展目录', properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const extension = await engine.addExtension(result.filePaths[0]);
    const assignment = await engine.setExtensionEnabledAll(extension.id, true);
    const ids = [...engine.profiles.keys()];
    const restart = await restartRunningProfiles(assignment.restartRequired);
    return { canceled: false, extension, assigned: ids.length, ...restart };
  });
  registerAction('extensions:add-store', async (_event, payload) => {
    const ids = sanitizeIds(payload.profileIds || []);
    const storeUrl = String(payload.url || ''); let extension;
    try { extension = await engine.addStoreExtension(storeUrl); }
    catch (directError) {
      try { extension = await engine.addStoreExtension(storeUrl, (url) => fetchStorePackage(url, 'system')); }
      catch (systemError) { throw new Error(`Chrome 应用商店下载失败。直连：${directError.message}；系统代理：${systemError.message}`); }
    }
    const assignment = ids.length ? await engine.assignExtension(extension.id, ids, true) : { restartRequired: [] };
    const restart = payload.restart ? await restartRunningProfiles(assignment.restartRequired) : { restarted: 0 };
    return { extension, assigned: ids.length, ...restart };
  });
  registerAction('extensions:assign', (_event, payload) => engine.assignExtension(String(payload.extensionId), sanitizeIds(payload.profileIds), Boolean(payload.enabled)));
  registerAction('extensions:toggle-all', async (_event, payload) => {
    const extensionId = String(payload.extensionId || ''); const enabled = Boolean(payload.enabled);
    const assignment = await engine.setExtensionEnabledAll(extensionId, enabled);
    const restart = await restartRunningProfiles(assignment.restartRequired);
    return { success: true, enabled, affected: assignment.affected, ...restart };
  });
  registerAction('extensions:reload', async (_event, id) => {
    if (!id || id === 'all') return await engine.reloadAllExtensions();
    return await engine.reloadExtension(String(id));
  });
  registerAction('extensions:remove', (_event, id) => engine.removeExtension(String(id)));

}

module.exports = { registerExtensionIpc };
