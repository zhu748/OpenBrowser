'use strict';

// Shared by document and worker runtimes; preserve native API presence,
// property descriptors and receiver checks in both realms.
module.exports = `
  const patchNetworkRealm = (target) => {
    if (!CFG.connection) return;
    try {
      const realConnection = target.navigator && target.navigator.connection;
      if (!realConnection) return;
      const netProto = Object.getPrototypeOf(realConnection);
      const netState = CFG.connection;
      for (const key of ['type', 'effectiveType', 'downlink', 'rtt', 'saveData']) {
        const descriptor = Object.getOwnPropertyDescriptor(netProto, key);
        if (!descriptor || typeof descriptor.get !== 'function' || !descriptor.configurable) continue;
        const nativeGet = descriptor.get;
        const existing = inspectBridge(nativeGet);
        if (existing && existing.token === BRIDGE_TOKEN) continue;
        const wrappedGet = nativeLike(function networkValue() {
          const original = nativeGet.call(this);
          return this === realConnection && Object.prototype.hasOwnProperty.call(netState, key)
            ? netState[key] : original;
        }, nativeGet, 'get ' + key, 0);
        Object.defineProperty(netProto, key, { ...descriptor, get: wrappedGet });
      }
    } catch (_) {}
  };
  patchNetworkRealm(globalThis);
  if (typeof subWindowSyncHooks !== 'undefined') subWindowSyncHooks.push(patchNetworkRealm);
`;
