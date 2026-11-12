'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
// M-1/M-2: the shared body lives in gpu-storage-fragment.js (one source for
// both realms). This shell pins the document realm: replaceMethod (stack
// stripping), the strict navigator.gpu entry guard, and the document
// IIFE closer (the document runtime's outermost try/finally pair ends here).
const { gpuStorageFragment } = require('./gpu-storage-fragment');

module.exports = gpuStorageFragment({
  realm: 'document',
  replaceHelper: 'replaceMethod',
  guardedNavigator: true,
  // The document runtime wraps its whole fragment chain in a top-level
  // try/finally — this fragment is the last one, so it owns the closer.
  iifeCloser: `
} catch (_) {}
})();`,
});
