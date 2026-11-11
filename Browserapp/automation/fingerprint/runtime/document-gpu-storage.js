'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
// M-1/M-2: the shared body lives in gpu-storage-fragment.js (one source for
// both realms). This shell pins the document realm: replaceMethod (stack
// stripping), the strict navigator.gpu entry guard, the sub-window
// propagation hook for the StorageManager quota patch, and the document
// IIFE closer (the document runtime's outermost try/finally pair ends here).
const { gpuStorageFragment } = require('./gpu-storage-fragment');

module.exports = gpuStorageFragment({
  realm: 'document',
  replaceHelper: 'replaceMethod',
  guardedNavigator: true,
  subWindowHook: `
      subWindowSyncHooks.push((subWin) => {
        try {
          if (!subWin || !subWin.StorageManager || !subWin.StorageManager.prototype || !subWin.StorageManager.prototype.estimate) return;
          const origSubEst = subWin.StorageManager.prototype.estimate;
          const patchedSubEst = nativeLike(function estimate() {
            if (!this || !(this instanceof subWin.StorageManager)) {
              return Promise.reject(new TypeError("Illegal invocation"));
            }
            return origSubEst.apply(this, arguments).then((res) => {
              return {
                quota: personaQuota,
                usage: res ? (res.usage || 0) : 0,
                usageDetails: res ? (res.usageDetails || {}) : {},
              };
            });
          }, origSubEst, "estimate", 0);
          Object.defineProperty(subWin.StorageManager.prototype, "estimate", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: patchedSubEst,
          });
        } catch (_) {}
      });
`,
  // The document runtime wraps its whole fragment chain in a top-level
  // try/finally — this fragment is the last one, so it owns the closer.
  iifeCloser: `
} catch (_) {}
})();`,
});
