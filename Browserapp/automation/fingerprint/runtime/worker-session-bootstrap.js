'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
// The session hook: the main-world Worker-constructor patch rewrites
// blob:/data: workers into a bootstrap whose only job is to hand the
// original script bytes to this hook. It concatenates the persona prefix
// (this very script) with the original bytes, mints a fresh blob URL with
// the NATIVE createObjectURL captured at install time, and importScripts
// it synchronously. The hook is installed as a plain configurable property
// and deleted before importScripts runs, so the user script sees the same
// global a network-prefixed worker presents.
//
// importScripts()/import() wrapping (worker scope): a classic worker calling
// importScripts(blob:) or a module worker dynamic-importing a blob:/data:
// URL would run un-prefixed scripts. Network URLs pass through untouched —
// the Fetch prefixer owns those.
module.exports = `  // --- worker session bootstrap hook ---
  const nativeImportScripts = typeof importScripts === 'function' ? importScripts : null;
  const nativeWorkerFetch = typeof fetch === 'function' ? fetch : null;
  const nativeWorkerCreateObjectURL = (typeof URL === 'function' && URL.createObjectURL) ? URL.createObjectURL.bind(URL) : null;
  const nativeWorkerBlob = typeof Blob === 'function' ? Blob : null;

  // Re-emission WITHOUT self-embedding: the session bootstrap has ALREADY
  // importScripts'd the persona prefix (it runs as the worker's first
  // script), so the persona mocks are installed globally in this scope. The
  // user source then runs as a plain second importScripts — no concatenated
  // copy of the prefix is ever materialized, keeping the composed document
  // script free of a second payload copy (font-bridge budget).
  const runPatchedSource = (sourceText) => {
    if (!nativeWorkerBlob || !nativeWorkerCreateObjectURL) return false;
    try {
      const blob = new nativeWorkerBlob([sourceText], { type: 'application/javascript' });
      const url = nativeWorkerCreateObjectURL(blob);
      if (nativeImportScripts) nativeImportScripts(url);
      return true;
    } catch (e) { return false; }
  };

  if (typeof __obImportSession === 'undefined') {
    try {
      Object.defineProperty(self, '__obImportSession', {
        configurable: true,
        writable: true,
        value: function (token, originalText) {
          try { delete self.__obImportSession; } catch (e) {}
          if (!originalText) return;
          runPatchedSource(originalText);
        },
      });
    } catch (e) {}
  }

  // Wrap importScripts so blob:/data: scripts launched from INSIDE a worker
  // also receive the prefix. Applies to classic workers (module workers use
  // import(), handled below via the import wrapper only when available).
  if (nativeImportScripts) {
    const wrappedImportScripts = function importScripts() {
      const args = Array.prototype.slice.call(arguments);
      try {
        for (let i = 0; i < args.length; i++) {
          const u = String(args[i]);
          if (/^(blob|data):/.test(u)) {
            if (nativeWorkerFetch) {
              // Synchronous read is impossible; fire-and-forget fetch then
              // run synchronously is not possible for importScripts, so use
              // XMLHttpRequest (workers have sync XHR) to fetch the text.
              const xhr = new XMLHttpRequest();
              xhr.open('GET', u, false);
              xhr.send(null);
              if (xhr.status === 200 || xhr.status === 0) {
                const text = xhr.responseText;
                if (runPatchedSource(text)) {
                  args.splice(i, 1);
                  i -= 1;
                  continue;
                }
              }
            }
          }
        }
        if (args.length) return nativeImportScripts.apply(self, args);
      } catch (e) {
        return nativeImportScripts.apply(self, arguments);
      }
    };
    try { Object.defineProperty(wrappedImportScripts, 'name', { value: 'importScripts' }); } catch (e) {}
    try { Object.defineProperty(wrappedImportScripts, 'length', { value: 0 }); } catch (e) {}
    self.importScripts = wrappedImportScripts;
  }
`;
