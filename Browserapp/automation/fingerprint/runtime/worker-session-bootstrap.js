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

  // --- worker-scope Worker constructor patch (nested worker identity) ---
  // A worker created from INSIDE another worker (new Worker in worker scope)
  // never passes the document-side constructor patch, and the engine's
  // worker-attach only applies a UA override — the nested worker's
  // navigator.platform / hardwareConcurrency read the HOST. Mirror the
  // document-side hybrid here:
  //   - patched Blob records parts in a WeakMap (nothing on the instance)
  //   - patched createObjectURL keeps a bounded url->Blob registry
  //   - string-backed blob / data: workers are rewritten synchronously to
  //     persona+text blobs; the persona prefix comes from self.__obPersonaUrl
  //     (published by the bootstrap that launched THIS worker, or by the
  //     engine prefixer footer for network workers) via a nested bootstrap
  //     that importScripts it first — so the prefix text exists exactly once.
  //   - binary-backed classic workers get the session bootstrap (persona
  //     import, in-worker fetch of the original blob, hook re-run).
  //   - module and network URLs pass through untouched.
  const nestedNativeWorker = typeof Worker === 'function' ? Worker : null;
  const nestedNativeBlob = nativeWorkerBlob;
  const nestedBlobParts = (typeof WeakMap === 'function' && nestedNativeBlob) ? new WeakMap() : null;
  if (nestedNativeWorker && nestedBlobParts) {
    const NestedPatchedBlob = function Blob(parts, options) {
      if (!(this instanceof NestedPatchedBlob)) throw new TypeError("Failed to construct 'Blob': Please use the 'new' operator");
      const blob = parts === undefined ? new nestedNativeBlob() : new nestedNativeBlob(parts, options);
      try {
        if (Array.isArray(parts) && parts.length <= 64) nestedBlobParts.set(blob, parts);
      } catch (e) { /* capture must never break Blob construction */ }
      return blob;
    };
    try {
      NestedPatchedBlob.prototype = nestedNativeBlob.prototype;
      Object.defineProperty(NestedPatchedBlob, 'name', { value: 'Blob' });
      Object.defineProperty(NestedPatchedBlob, 'length', { value: 0 });
    } catch (e) {}
    NestedPatchedBlob.toString = function () { return 'function Blob() { [native code] }'; };
    try { Object.defineProperty(self, 'Blob', { value: NestedPatchedBlob, writable: true, configurable: true }); } catch (e) {}

    const nestedUrlToBlob = new Map();
    const NESTED_URL_LIMIT = 256;
    if (nativeWorkerCreateObjectURL) {
      const nestedNativeRevoke = (typeof URL === 'function' && URL.revokeObjectURL) ? URL.revokeObjectURL : null;
      const nestedCreate = function createObjectURL(obj) {
        const url = nativeWorkerCreateObjectURL(obj);
        try {
          if (obj && typeof obj === 'object' && typeof obj.size === 'number' && typeof obj.text === 'function') {
            nestedUrlToBlob.set(url, obj);
            if (nestedUrlToBlob.size > NESTED_URL_LIMIT) {
              const oldest = nestedUrlToBlob.keys().next().value;
              if (oldest !== undefined) nestedUrlToBlob.delete(oldest);
            }
          }
        } catch (e) { /* tracking must never break URL creation */ }
        return url;
      };
      try { Object.defineProperty(nestedCreate, 'name', { value: 'createObjectURL' }); } catch (e) {}
      try { Object.defineProperty(nestedCreate, 'length', { value: 1 }); } catch (e) {}
      nestedCreate.toString = function () { return 'function createObjectURL() { [native code] }'; };
      try { Object.defineProperty(URL, 'createObjectURL', { value: nestedCreate, writable: true, configurable: true }); } catch (e) {}
      if (nestedNativeRevoke) {
        const nestedRevoke = function revokeObjectURL(u) {
          nestedUrlToBlob.delete(String(u));
          return nestedNativeRevoke.call(URL, u);
        };
        try { Object.defineProperty(nestedRevoke, 'name', { value: 'revokeObjectURL' }); } catch (e) {}
        try { Object.defineProperty(nestedRevoke, 'length', { value: 1 }); } catch (e) {}
        nestedRevoke.toString = function () { return 'function revokeObjectURL() { [native code] }'; };
        try { Object.defineProperty(URL, 'revokeObjectURL', { value: nestedRevoke, writable: true, configurable: true }); } catch (e) {}
      }
    }

    const nestedPartsToText = (parts) => {
      try {
        let text = '';
        for (const part of parts) {
          if (typeof part === 'string') text += part;
          else if (part instanceof ArrayBuffer) text += String.fromCharCode.apply(null, new Uint8Array(part));
          else if (ArrayBuffer.isView(part)) text += String.fromCharCode.apply(null, new Uint8Array(part.buffer, part.byteOffset, part.byteLength));
          else return null;
        }
        return text;
      } catch (e) { return null; }
    };

    const nestedDataUrlText = (url) => {
      try {
        const m = /^data:([^,]*),(.*)$/s.exec(String(url));
        if (!m) return null;
        const meta = m[1]; let payload = m[2];
        if (/;base64/i.test(meta)) payload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        else payload = decodeURIComponent(payload);
        return payload;
      } catch (e) { return null; }
    };

    // Nested bootstrap: import the persona prefix (via __obPersonaUrl), then
    // run the original text through the session hook so mocks are live
    // before any user code. Async IIFE — the nested worker's messages queue
    // behind it, so ordering is preserved without blocking construction.
    const nestedBootstrap = (personaU, originalUrl) => '(async function () {\\n'
      + '  "use strict";\\n'
      + '  try {\\n'
      + '    importScripts(' + JSON.stringify(personaU) + ');\\n'
      + '    try { Object.defineProperty(self, "__obPersonaUrl", { value: ' + JSON.stringify(personaU) + ', configurable: true, writable: true }); } catch (e) {}\\n'
      + '    var t = await (await fetch(' + JSON.stringify(originalUrl) + ')).text();\\n'
      + '    if (typeof self.__obImportSession === "function") {\\n'
      + '      self.__obImportSession("boot", t);\\n'
      + '    }\\n'
      + '  } catch (e) {}\\n'
      + '})();';

    // Nested classic bootstrap: importScripts the persona prefix, then re-run
    // the original text through the session hook so mocks are live before
    // any user code. Module workers are not rewritten (see nestedRewrite).
    const nestedClassicBootstrapWithText = (personaU, text) => '(function () {\\n'
      + '  "use strict";\\n'
      + '  try {\\n'
      + '    importScripts(' + JSON.stringify(personaU) + ');\\n'
      + '    try { Object.defineProperty(self, "__obPersonaUrl", { value: ' + JSON.stringify(personaU) + ', configurable: true, writable: true }); } catch (e) {}\\n'
      + '    if (typeof self.__obImportSession === "function") {\\n'
      + '      self.__obImportSession("boot", ' + JSON.stringify(text) + ');\\n'
      + '    }\\n'
      + '  } catch (e) {}\\n'
      + '})();';

    // First read captures the persona URL into a closure and removes the
    // self marker (it is configurable for exactly this); later constructions
    // use the cached value. Before the first nested construction the
    // property remains visible to getOwnPropertyNames — documented residual.
    let nestedPersonaUrlCache = null;
    const nestedPersonaUrl = () => {
      if (nestedPersonaUrlCache) return nestedPersonaUrlCache;
      const v = self.__obPersonaUrl;
      if (!v) return null;
      nestedPersonaUrlCache = String(v);
      try { delete self.__obPersonaUrl; } catch (e) {}
      return nestedPersonaUrlCache;
    };

    const nestedRewrite = (u, isModule) => {
      const personaU = nestedPersonaUrl();
      if (!personaU || !nativeWorkerCreateObjectURL || !nestedNativeBlob) return null;
      // Module workers are NEVER intercepted here: dynamic import() of a
      // classic-shaped blob from a nested module worker deadlocks under the
      // engine's worker-attach on Chromium 157 (verified empirically both
      // top-level and nested). Nested module workers keep the engine's
      // attach-level UA override only — same boundary as the document-side
      // patch's module passthrough, and it is documented in the round-6/7
      // reports rather than silently widened.
      if (isModule) return null;
      if (/^data:/.test(u)) {
        const text = nestedDataUrlText(u);
        if (text === null) return null;
        return nativeWorkerCreateObjectURL(new nestedNativeBlob([nestedClassicBootstrapWithText(personaU, text)], { type: 'application/javascript' }));
      }
      if (/^blob:/.test(u)) {
        const blob = nestedUrlToBlob.get(u);
        const parts = blob ? nestedBlobParts.get(blob) : undefined;
        const text = parts ? nestedPartsToText(parts) : null;
        if (text !== null) {
          return nativeWorkerCreateObjectURL(new nestedNativeBlob([nestedClassicBootstrapWithText(personaU, text)], { type: 'application/javascript' }));
        }
        return nativeWorkerCreateObjectURL(new nestedNativeBlob([nestedBootstrap(personaU, u)], { type: 'application/javascript' }));
      }
      return null;
    };

    const NestedPatchedWorker = function Worker(url, options) {
      if (!(this instanceof NestedPatchedWorker)) throw new TypeError("Failed to construct 'Worker': Please use the 'new' operator");
      let target = url;
      try {
        const replaced = nestedRewrite(String(url), Boolean(options && options.type === 'module'));
        if (replaced) target = replaced;
      } catch (e) { /* never break construction */ }
      return new nestedNativeWorker(target, options);
    };
    try {
      NestedPatchedWorker.prototype = Object.create(nestedNativeWorker.prototype);
      NestedPatchedWorker.prototype.constructor = NestedPatchedWorker;
      Object.defineProperty(NestedPatchedWorker, 'name', { value: 'Worker' });
      Object.defineProperty(NestedPatchedWorker, 'length', { value: 1 });
    } catch (e) {}
    try { Object.defineProperty(self, 'Worker', { value: NestedPatchedWorker, writable: true, configurable: true }); } catch (e) {}
  }
`;
