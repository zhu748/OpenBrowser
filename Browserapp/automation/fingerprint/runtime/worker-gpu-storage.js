'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
// M-1/M-2: the shared body lives in gpu-storage-fragment.js (one source for
// both realms). This shell pins the worker realm: replace (the worker
// bootstrap's helper), the lenient prototype resolution (a dedicated worker
// may expose navigator.gpu without a global GPU constructor), and the worker IIFE closer (the worker
// runtime has NO top-level try — the fragment chain is the arrow body).
const { gpuStorageFragment } = require('./gpu-storage-fragment');

module.exports = gpuStorageFragment({
  realm: 'worker',
  replaceHelper: 'replace',
  guardedNavigator: false,
  iifeCloser: `
})();
`,
});
