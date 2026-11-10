'use strict';

/** Extension IPC domain; all handlers use the host's trusted registration. */
function registerExtensionIpc({ registerTrustedIpc, engine, dialog, sanitizeIds, fetchStorePackage }) {
  // Batch stop+restart for the extension install / global-toggle flows. This
  // used to be two serial for-loops: one failing stop aborted the whole batch
  // and left the remaining environments stopped-but-not-restarted, and every
  // step waited for the previous one.
  async function restartRunningProfiles(profileIds) {
    const stopIds = [...profileIds];
    const stopOk = new Set();
    await Promise.all(Array.from({ length: Math.min(4, stopIds.length) }, async () => {
      while (stopIds.length) {
        const id = stopIds.shift();
        try {
          const result = await engine.stop(id);
          if (result?.running || result?.cleanupBlocked || engine.running.has(id)) continue;
          stopOk.add(id);
        } catch (error) {
          console.warn('OpenBrowser batch stop failed for', id, error?.message || error);
        }
      }
    }));
    const restartIds = [...stopOk];
    let restarted = 0;
    await Promise.all(Array.from({ length: Math.min(3, restartIds.length) }, async () => {
      while (restartIds.length) {
        const id = restartIds.shift();
        const profile = engine.profiles.get(id);
        if (!profile) continue;
        // engine.start is idempotent for concurrent starts of the same id, but
        // a user-initiated start racing this batch used to layer a second
        // progress stream and one extra generation bump on top of it. Skip the
        // display-level restart when a start is already in flight.
        if (engine.starting.has(id)) continue;
        try { await engine.start(profile); restarted += 1; } catch (error) {
          console.warn('OpenBrowser batch restart failed for', id, error?.message || error);
        }
      }
    }));
    return { restarted };
  }
  registerTrustedIpc('extensions:list', () => engine.listExtensions());
  registerTrustedIpc('extensions:add-folder', async () => {
    const result = await dialog.showOpenDialog({ title: '选择已解压的 Chrome 扩展目录', properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const extension = await engine.addExtension(result.filePaths[0]);
    const ids = [...engine.profiles.keys()]; const running = ids.filter((id) => engine.running.has(id));
    if (ids.length) await engine.assignExtension(extension.id, ids, true);
    const restart = await restartRunningProfiles(running);
    return { canceled: false, extension, assigned: ids.length, ...restart };
  });
  registerTrustedIpc('extensions:add-store', async (_event, payload) => {
    const ids = sanitizeIds(payload.profileIds || []);
    const storeUrl = String(payload.url || ''); let extension;
    try { extension = await engine.addStoreExtension(storeUrl); }
    catch (directError) {
      try { extension = await engine.addStoreExtension(storeUrl, (url) => fetchStorePackage(url, 'system')); }
      catch (systemError) { throw new Error(`Chrome 应用商店下载失败。直连：${directError.message}；系统代理：${systemError.message}`); }
    }
    const selected = new Set(ids);
    const running = new Set(engine.status().filter((item) => item.running && selected.has(item.id)).map((item) => item.id));
    if (ids.length) await engine.assignExtension(extension.id, ids, true);
    let restarted = 0;
    if (payload.restart) restarted = (await restartRunningProfiles([...running])).restarted;
    return { extension, assigned: ids.length, restarted };
  });
  registerTrustedIpc('extensions:assign', (_event, payload) => engine.assignExtension(String(payload.extensionId), sanitizeIds(payload.profileIds), Boolean(payload.enabled)));
  registerTrustedIpc('extensions:toggle-all', async (_event, payload) => {
    const extensionId = String(payload.extensionId || ''); const enabled = Boolean(payload.enabled);
    const ids = [...engine.profiles.keys()]; const running = ids.filter((id) => engine.running.has(id));
    await engine.assignExtension(extensionId, ids, enabled);
    const restart = await restartRunningProfiles(running);
    return { success: true, enabled, affected: ids.length, ...restart };
  });
  registerTrustedIpc('extensions:reload', async (_event, id) => {
    if (!id || id === 'all') return await engine.reloadAllExtensions();
    return await engine.reloadExtension(String(id));
  });
  registerTrustedIpc('extensions:remove', (_event, id) => engine.removeExtension(String(id)));

}

module.exports = { registerExtensionIpc };
