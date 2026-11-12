'use strict';

/**
 * Worker-constructor patch for the main-world document script.
 *
 * Chromium delivers worker-scope identity mocks by prefixing NETWORK-loaded
 * worker scripts at the Fetch layer (engine/fingerprint-injection.js). A worker
 * created from a blob:/data: URL never hits the network, so a detector page
 * can read the host's navigator.platform / hardwareConcurrency / font metrics
 * from an inline worker. The value-level audit found exactly that on Linux:
 * a Win32/4-core persona answering "Linux x86_64"/2 from a blob worker.
 *
 * Delivery design ("bootstrap worker"):
 *
 *   new Worker(blob:/data:) is rewritten to a bootstrap worker whose source
 *   does three things, in order, before any user code runs:
 *     1. importScripts(PERSONA_URL) — the full worker injection prefix,
 *        minted as a fresh blob URL at construction time (never a network
 *        request, so the Fetch prefixer is not involved);
 *     2. fetch(ORIGINAL_URL).then(r => r.text()) — blob: URLs of the
 *        creating origin are fetchable from the worker (origin inherits);
 *        data: URLs are decoded in-page synchronously and embedded directly;
 *     3. self.__obImportSession('boot', text) — the hook the prefix
 *        installed concatenates the persona source with the original bytes,
 *        mints ANOTHER fresh blob URL and importScripts()s it. The hook
 *        deletes itself before running the user code.
 *
 *   Why not patch Blob/URL.createObjectURL (the previous design): it stored
 *   an own `__obParts` property on every constructed Blob — a static, page-
 *   visible marker on a global constructor chain. This design adds NOTHING
 *   to any global except the Worker and SharedWorker constructor swaps, and
 *   the bootstrap's blob URLs are minted with the NATIVE createObjectURL the
 *   patch captured, so URL identity checks behave normally.
 *
 *   SharedWorker(blob:/data:) follows the same flow (its global scope also
 *   supports importScripts for classic scripts).
 *
 *   Module workers ({ type: 'module' }) pass through UNTOUCHED: on Chromium
 *   143+ the engine's worker-attach path already delivers the persona to
 *   module scopes (verified empirically: blob/data module workers read the
 *   persona platform and cores on a pristine engine build), and a bootstrap
 *   module cannot use importScripts — intercepting them would deadlock the
 *   worker before any user code runs.
 *
 * Probed engine facts this design leans on (Chrome 156/157, Linux):
 *   - WorkerLocation is prototype-inherited, origin = creator origin,
 *     protocol 'blob:' — a re-emitted blob URL is shape-identical; no
 *     location fix-up needed.
 *   - Blob workers create ZERO resource-timing entries; no timing surface.
 *   - ServiceWorkerContainer.register(blob:) is rejected natively by Chrome
 *     ("URL protocol of the script") — not an entry point to cover.
 *   - importScripts(blob:) inside a classic worker works; the worker-side
 *     prefix wraps it (see runtime/worker-session-bootstrap.js).
 *
 * Shape discipline: patched constructors keep native name/length/prototype
 * and throw the same native TypeErrors; the patch no-ops when URL/Blob/Worker
 * are absent (vm-sandbox unit scopes).
 */

/** Build the patch source. `workerSource` is the full worker injection script. */
module.exports = function workerConstructorPatch({ workerSource }) {
  return `
// --- Worker constructor patch (blob:/data: worker identity delivery) ---
(() => {
  // Environment guard: the patch targets real browser documents, where URL,
  // Blob and Worker always exist. Sandboxed unit-test scopes build the
  // injection script against minimal mocks that may lack them — degrade to a
  // no-op instead of taking down the whole document-start script.
  if (typeof URL !== 'function' || typeof URL.createObjectURL !== 'function'
    || typeof Blob !== 'function' || typeof Worker !== 'function') return;
  const nativeCreateObjectURL = URL.createObjectURL;
  const nativeWorker = window.Worker;
  const nativeSharedWorker = window.SharedWorker;

  // The persona source the worker-side __obImportSession hook prepends. Kept
  // in the closure only — page script cannot reach it.
  const PERSONA_SOURCE = ${JSON.stringify(String(workerSource))};

  // ---- construction-part capture (WeakMap, not object markers) ----
  // new Blob(parts) is the ONLY point where the parts are synchronously
  // readable. They are recorded in a WeakMap keyed by the Blob instance:
  // nothing is written onto the Blob (no enumerable/configurable own
  // property a detector could diff), and the map itself is closure-private.
  const nativeBlob = window.Blob;
  const blobParts = new WeakMap();
  const PatchedBlob = function Blob(parts, options) {
    if (!(this instanceof PatchedBlob)) throw new TypeError("Failed to construct 'Blob': Please use the 'new' operator");
    const blob = parts === undefined ? new nativeBlob() : new nativeBlob(parts, options);
    try {
      if (Array.isArray(parts) && parts.length <= 64) blobParts.set(blob, parts);
    } catch (_) { /* capture must never break Blob construction */ }
    return blob;
  };
  try {
    PatchedBlob.prototype = nativeBlob.prototype;
    Object.defineProperty(PatchedBlob, 'name', { value: 'Blob' });
    Object.defineProperty(PatchedBlob, 'length', { value: 0 });
  } catch (_) {}
  PatchedBlob.toString = () => 'function Blob() { [native code] }';
  try { Object.defineProperty(window, 'Blob', { value: PatchedBlob, writable: true, configurable: true }); } catch (_) {}

  const partsToText = (parts) => {
    try {
      let text = '';
      for (const part of parts) {
        if (typeof part === 'string') text += part;
        else if (part instanceof ArrayBuffer) text += String.fromCharCode(...new Uint8Array(part));
        else if (ArrayBuffer.isView(part)) text += String.fromCharCode(...new Uint8Array(part.buffer, part.byteOffset, part.byteLength));
        else return null;
      }
      return text;
    } catch (_) { return null; }
  };

  // ---- URL-keyed blob registry ----
  // createObjectURL records which Blob backs each URL (bounded; revocation
  // drops entries). Combined with the WeakMap above this recovers source
  // text synchronously at Worker-construction time.
  const urlToBlob = new Map();
  const URL_LIMIT = 256;
  const nativeRevoke = URL.revokeObjectURL;
  const patchedCreateObjectURL = function createObjectURL(obj) {
    const url = nativeCreateObjectURL.call(this, obj);
    try {
      if (obj && typeof obj === 'object' && typeof obj.size === 'number' && typeof obj.text === 'function') {
        urlToBlob.set(url, obj);
        if (urlToBlob.size > URL_LIMIT) {
          const oldest = urlToBlob.keys().next().value;
          if (oldest !== undefined) urlToBlob.delete(oldest);
        }
      }
    } catch (_) { /* tracking must never break URL creation */ }
    return url;
  };
  try { Object.defineProperty(patchedCreateObjectURL, 'name', { value: 'createObjectURL' }); } catch (_) {}
  try { Object.defineProperty(patchedCreateObjectURL, 'length', { value: 1 }); } catch (_) {}
  patchedCreateObjectURL.toString = () => 'function createObjectURL() { [native code] }';
  try { Object.defineProperty(URL, 'createObjectURL', { value: patchedCreateObjectURL, writable: true, configurable: true }); } catch (_) {}
  const patchedRevokeObjectURL = function revokeObjectURL(u) {
    urlToBlob.delete(String(u));
    return nativeRevoke.call(this, u);
  };
  try { Object.defineProperty(patchedRevokeObjectURL, 'name', { value: 'revokeObjectURL' }); } catch (_) {}
  try { Object.defineProperty(patchedRevokeObjectURL, 'length', { value: 1 }); } catch (_) {}
  patchedRevokeObjectURL.toString = () => 'function revokeObjectURL() { [native code] }';
  try { Object.defineProperty(URL, 'revokeObjectURL', { value: patchedRevokeObjectURL, writable: true, configurable: true }); } catch (_) {}

  const dataUrlText = (url) => {
    try {
      const m = /^data:([^,]*),(.*)$/s.exec(String(url));
      if (!m) return null;
      const meta = m[1]; let payload = m[2];
      if (/;base64/i.test(meta)) payload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      else payload = decodeURIComponent(payload);
      return payload;
    } catch (_) { return null; }
  };

  // ---- session bootstrap (classic workers with unknown/binary text) ----
  // The bootstrap importScripts the persona prefix, fetches the original
  // blob text inside the worker, and hands it to __obImportSession.
  const makeBootstrap = (personaU, originalUrl) => '(async function () {\\n'
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

  const makeDataBootstrap = (personaU, originalText) => '(function () {\\n'
    + '  "use strict";\\n'
    + '  try {\\n'
    + '    importScripts(' + JSON.stringify(personaU) + ');\\n'
    + '    try { Object.defineProperty(self, "__obPersonaUrl", { value: ' + JSON.stringify(personaU) + ', configurable: true, writable: true }); } catch (e) {}\\n'
    + '    if (typeof self.__obImportSession === "function") {\\n'
    + '      self.__obImportSession("boot", ' + JSON.stringify(originalText) + ');\\n'
    + '    }\\n'
    + '  } catch (e) {}\\n'
    + '})();';

  const personaUrl = () => nativeCreateObjectURL.call(URL,
    new Blob([PERSONA_SOURCE], { type: 'application/javascript' }));

  // Rewrite decision per (url, isModule):
  //   known text (string-backed blob or data:) -> direct prefix+text blob,
  //     type matching the worker kind (classic / module both parse the IIFE).
  //   unknown text (binary-backed blob) + classic -> session bootstrap.
  //   unknown text + module -> passthrough (dynamic import in module workers
  //     deadlocks under the engine's worker attach on Chromium 157; the
  //     attach path still provides UA/platform/cores via Network override).
  //   network URL -> passthrough (Fetch prefixer owns those).
  const rewrite = (u, isModule) => {
    if (/^data:/.test(u)) {
      const text = dataUrlText(u);
      if (text !== null) {
        // Footer publishes the persona URL so the nested-Worker patch inside
        // this worker can serve grandchild workers without another copy of
        // PERSONA_SOURCE (the literal is already in this closure).
        const footer = ';try{Object.defineProperty(self,"__obPersonaUrl",{value:URL.createObjectURL(new Blob([' + JSON.stringify(PERSONA_SOURCE) + '],{type:"application/javascript"})),configurable:true,writable:true});}catch(e){}\\n';
        return nativeCreateObjectURL.call(URL, new Blob([PERSONA_SOURCE + footer + '\\n;\\n' + text],
          { type: isModule ? 'text/javascript' : 'application/javascript' }));
      }
      return null;
    }
    if (/^blob:/.test(u)) {
      const blob = urlToBlob.get(u);
      const parts = blob ? blobParts.get(blob) : undefined;
      const text = parts ? partsToText(parts) : null;
      if (text !== null) {
        const footer = ';try{Object.defineProperty(self,"__obPersonaUrl",{value:URL.createObjectURL(new Blob([' + JSON.stringify(PERSONA_SOURCE) + '],{type:"application/javascript"})),configurable:true,writable:true});}catch(e){}\\n';
        return nativeCreateObjectURL.call(URL, new Blob([PERSONA_SOURCE + footer + '\\n;\\n' + text],
          { type: isModule ? 'text/javascript' : 'application/javascript' }));
      }
      if (isModule) return null;
      return nativeCreateObjectURL.call(URL, new Blob([makeBootstrap(personaUrl(), u)], { type: 'application/javascript' }));
    }
    return null;
  };

  if (typeof nativeWorker === 'function') {
    const PatchedWorker = function Worker(url, options) {
      if (!(this instanceof PatchedWorker)) throw new TypeError("Failed to construct 'Worker': Please use the 'new' operator");
      let target = url;
      try {
        const replaced = rewrite(String(url), Boolean(options && options.type === 'module'));
        if (replaced) target = replaced;
      } catch (_) { /* never break construction */ }
      return new nativeWorker(target, options);
    };
    try {
      PatchedWorker.prototype = Object.create(nativeWorker.prototype);
      PatchedWorker.prototype.constructor = PatchedWorker;
      Object.defineProperty(PatchedWorker, 'name', { value: 'Worker' });
      Object.defineProperty(PatchedWorker, 'length', { value: 1 });
    } catch (_) {}
    try { Object.defineProperty(window, 'Worker', { value: PatchedWorker, writable: true, configurable: true }); } catch (_) {}
  }

  if (typeof nativeSharedWorker === 'function') {
    const PatchedSharedWorker = function SharedWorker(url, options) {
      if (!(this instanceof PatchedSharedWorker)) throw new TypeError("Failed to construct 'SharedWorker': Please use the 'new' operator");
      let target = url;
      try {
        const replaced = rewrite(String(url), false);
        if (replaced) target = replaced;
      } catch (_) { /* never break construction */ }
      return new nativeSharedWorker(target, options);
    };
    try {
      PatchedSharedWorker.prototype = Object.create(nativeSharedWorker.prototype);
      PatchedSharedWorker.prototype.constructor = PatchedSharedWorker;
      Object.defineProperty(PatchedSharedWorker, 'name', { value: 'SharedWorker' });
      Object.defineProperty(PatchedSharedWorker, 'length', { value: 1 });
    } catch (_) {}
    try { Object.defineProperty(window, 'SharedWorker', { value: PatchedSharedWorker, writable: true, configurable: true }); } catch (_) {}
  }
})();
`;
}
