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
  const keyStore = new ApiKeyStore(userDataPath);
  let effectiveApiKey = await keyStore.resolve(context.apiKey || process.env.OPENBROWSER_API_KEY);
  const keyFilePath = keyStore.filePath;

  const storePath = path.join(userDataPath, 'rpa-store.json');
  const rpaStore = new RpaStore(storePath);
  await rpaStore.load();

  const proxyStore = new ProxyStore(path.join(userDataPath, 'proxy-library.json'));
  await proxyStore.load();
  await context.beforeApiStart?.(proxyStore);
  const accountStore = new AccountStore(path.join(userDataPath, 'platform-accounts.enc'));
  const transferStore = new TransferStore(path.join(userDataPath, 'window-transfers.enc'));
  // A damaged optional store locks that feature without preventing recovery,
  // the local API, or RPA from starting. Writes remain blocked in the store.
  for (const [feature, store] of [['accounts', accountStore], ['transfers', transferStore]]) {
    try { await store.load(); }
    catch (error) { emit({ type: 'storage-error', feature, message: error.message }); }
  }
  await engine?.setProxyStore?.(proxyStore);

  const rpaEngine = new RpaEngine({
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

  const localApi = new LocalApiServer({
    host: '127.0.0.1',
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
  });

  const info = await localApi.start();
  emit({ type: 'local-api', ...info });

  return {
    localApi,
    rpaEngine,
    rpaStore,
    syncBridge,
    appCenter,
    proxyStore,
    keyStore,
    accountStore,
    transferStore,
    info,
    apiKey: effectiveApiKey,
    apiKeyFile: keyFilePath,
    async rotateApiKey() {
      const newKey = await keyStore.rotate();
      this.apiKey = newKey;
      localApi.setApiKey(newKey);
      return newKey;
    },
    async stop() {
      await rpaEngine.stop();
      await localApi.stop();
      // Proxy credentials are written through a serialized queue. Wait for the
      // queue before Electron is allowed to tear down the main process.
      await proxyStore.flush?.();
      await accountStore.flush();
      await transferStore.flush();
      // RPA task/template updates coalesce into one quiet-period write; flush
      // it so the final task status is on disk before teardown.
      await rpaStore.flush?.();
    },
  };
}

module.exports = {
  startAutomation,
  LocalApiServer,
  RpaEngine,
  RpaStore,
  WindowSyncBridge,
  AppCenter,
  ProxyStore,
  ApiKeyStore,
};
