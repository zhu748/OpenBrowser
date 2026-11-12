'use strict';

// Shared by documents, their same-origin child realms and workers. A reported
// capacity cannot grant storage the native quota manager does not provide.
module.exports = `
  const isStorageMobile = Boolean(CFG.mobile || isIosPersona || isAndroidPersona);
  const storageMemory = Number(CFG.deviceMemory) || 8;
  const personaQuota = isStorageMobile
    ? (storageMemory >= 8 ? 16106127360 : 10737418240)
    : (storageMemory >= 8 ? 64424509440 : 32212254720);
  const patchStorageRealm = (target) => {
    try {
      const proto = target?.StorageManager?.prototype
        || (target?.navigator?.storage && Object.getPrototypeOf(target.navigator.storage));
      const descriptor = proto && Object.getOwnPropertyDescriptor(proto, 'estimate');
      const original = descriptor?.value;
      if (typeof original !== 'function') return;
      const existing = inspectBridge(original);
      if (existing && existing.token === BRIDGE_TOKEN) return;
      const patched = nativeLike(function estimate(...args) {
        // Native brand/argument validation accepts genuine objects from another
        // realm. instanceof rejects them and is not a WebIDL brand check.
        return Reflect.apply(original, this, args).then(result => {
          if (!result || typeof result !== 'object') return result;
          const field = Object.getOwnPropertyDescriptor(result, 'quota');
          const quota = field?.value;
          if (field?.writable && typeof quota === 'number' && Number.isFinite(quota) && quota >= 0) {
            const usageValue = Object.getOwnPropertyDescriptor(result, 'usage')?.value;
            const usage = typeof usageValue === 'number' && Number.isFinite(usageValue) ? Math.max(0, usageValue) : 0;
            // Keep the native dictionary's realm, optional fields and flags.
            Object.defineProperty(result, 'quota', { ...field, value: Math.min(quota, Math.max(personaQuota, usage)) });
          }
          return result;
        });
      }, original, 'estimate', 0);
      Object.defineProperty(proto, 'estimate', { ...descriptor, value: patched });
    } catch (_) {}
  };
  patchStorageRealm(globalThis);
  if (typeof subWindowSyncHooks !== 'undefined') subWindowSyncHooks.push(patchStorageRealm);
`;
