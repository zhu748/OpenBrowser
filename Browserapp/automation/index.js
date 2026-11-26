'use strict';


const path = require('path');

const { LocalApiServer } = require('./local-api-server');
const { RpaEngine } = require('./rpa-engine');
const { RpaStore } = require('./rpa-store');
const { WindowSyncBridge } = require('./window-sync-bridge');
const { AppCenter } = require('./app-center');
const { ProxyStore } = require('./proxy-store');

const { ApiKeyStore } = require('./api-key-store');
const { AccountStore } = require('./account-store');
const { TransferStore } = require('./transfer-store');
const { createAutomationStop } = require('./shutdown');

/**
 * Mount automation stack (Local API + RPA + window-sync + app center + proxy library).
 * MCP is a separate stdio process: `node automation/mcp-server.js`.
 * Fully self-contained — does not call or embed external browser binaries.
 */
async function startAutomation(context = {}) {
  const {
    app,
    engine,
    liveSync,
    beginSync,
    endSync,
    restartSync,
    getSyncState,
    setSelection,
    tile,
    emit = () => {},
    port = Number(process.env.OPENBROWSER_API_PORT || 50325),
  } = context;

  const userDataPath = app.getPath('userData');
  const reportApiError = error => emit({ type: 'local-api-error', message: error.message });
  const reportStorageError = (feature, error) => emit({ type: 'storage-error', feature, message: error.message });
  const keyStore = new ApiKeyStore(userDataPath);
  const keyFilePath = keyStore.filePath;
  const apiKeyReady = keyStore.resolve(context.apiKey || process.env.OPENBROWSER_API_KEY)
    .catch(error => { reportApiError(error); return null; });

  const rpaStorage = new RpaStore(path.join(userDataPath, 'rpa-store.json'));
  const rpaReady = rpaStorage.load().then(() => rpaStorage, error => {
    reportStorageError('rpa', error);
    return null;
  });

  const proxyStorage = new ProxyStore(path.join(userDataPath, 'proxy-library.json'));
  const proxyStore = await proxyStorage.load().then(() => proxyStorage, error => {
    reportStorageError('proxies', error);
    return null;
  });
  let recoveryError;
  try {
    await context.beforeApiStart?.(proxyStore);
    if (proxyStore) await engine?.setProxyStore?.(proxyStore);
  } catch (error) {
    recoveryError = error;
    reportApiError(error);
  }
  const accountStore = new AccountStore(path.join(userDataPath, 'platform-accounts.enc'), {
    recoverProfileChanges: async journal => {
      if (recoveryError) throw recoveryError;
      const conflicts = await require('../rebuild/accounts').restoreAccountProfiles(engine, journal);
      if (conflicts.length) emit({ type: 'storage-error', feature: 'accounts',
        message: `账号库恢复时保留了 ${conflicts.length} 个窗口的后续账号修改` });
    },
  });
  const transferStore = new TransferStore(path.join(userDataPath, 'window-transfers.enc'));
  // A damaged optional store locks that feature without preventing recovery,
  // the local API, or RPA from starting. Writes remain blocked in the store.
  await Promise.all([['accounts', accountStore], ['transfers', transferStore]].map(async ([feature, store]) => {
    try { await store.load(); }
    catch (error) { reportStorageError(feature, error); }
  }));
  const [effectiveApiKey, rpaStore] = await Promise.all([apiKeyReady, rpaReady]);

  const rpaEngine = rpaStore && new RpaEngine({
    engine,
    store: rpaStore,
    emit: (event) => emit(event),
    userDataPath,
  });

  const syncBridge = new WindowSyncBridge({
    getLiveSync: () => liveSync,
    beginSync,
    endSync,
    restartSync,
    getSyncState,
    setSelection,
    tile,
    // Read-only accessors are reached from the health endpoint, so they must
    // tolerate a stack mounted without the sync controller.
    getSettings: () => (liveSync?.getSettings?.() ?? {}),
    updateSettings: (value) => (liveSync?.updateSettings?.(value) ?? null),
  });

  const appCenter = new AppCenter({ engine });

  const localApi = effectiveApiKey && !recoveryError ? new LocalApiServer({
    host: context.apiHost || '127.0.0.1',
    port,
    apiKey: effectiveApiKey,
    userDataPath,
    engine,
    rpaEngine,
    rpaStore,
    syncBridge,
    appCenter,
    proxyStore,
    getVersion: () => app.getVersion(),
  }) : null;

  let info = null;
  if (localApi) {
    info = { ...localApi.info(), enabled: false };
    if (context.apiEnabled !== false) {
      try { info = { ...await localApi.start(), enabled: true }; }
      catch (error) {
        await localApi.stop();
        reportApiError(error);
      }
    }
    emit({ type: 'local-api', ...info });
  }

  return {
    localApi,
    rpaEngine,
    rpaStore,
    syncBridge,
    appCenter,
    proxyStore: recoveryError ? null : proxyStore,
    keyStore,
    accountStore,
    transferStore,
    info,
    apiKey: effectiveApiKey,
    apiKeyFile: keyFilePath,
    async rotateApiKey() {
      if (!localApi) throw new Error('本地 API 服务尚未就绪');
      const newKey = await keyStore.rotate();
      this.apiKey = newKey;
      localApi.setApiKey(newKey);
      return newKey;
    },
    stop: createAutomationStop({ rpaEngine, localApi, proxyStore, accountStore, transferStore, rpaStore }),
  };
}

module.exports = {
  startAutomation,
};
