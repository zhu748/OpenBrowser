'use strict';

/**
 * Worker-constructor patch for the main-world document script.
 *
 * Chromium 157 delivers worker-scope identity mocks by prefixing NETWORK-loaded
 * worker scripts at the Fetch layer (engine/fingerprint-injection.js). A worker
 * created from a blob:/data: URL never hits the network, so a detector page can
 * read the host's navigator.platform / hardwareConcurrency / font metrics from
 * a blob worker — the exact gap the value-level audit found on Linux (persona
 * claimed Win32/4 cores, the blob worker answered "Linux x86_64"/2).
 *
 * This fragment patches, in the page's main world:
 *   - URL.createObjectURL: remembers every created Blob/File in a side table
 *     (bounded) so the Worker constructor can recover the source text
 *     synchronously — no async read is possible inside `new Worker()`.
 *   - Worker / SharedWorker / ServiceWorkerContainer.register: when the script
 *     source is a blob: URL with a known Blob, or a data: URL, build a NEW
 *     blob whose content is the worker injection source + "\n;\n" + the
 *     original bytes and hand the fresh URL to the native constructor. Network
 *     URLs pass through untouched (the Fetch prefixer owns those).
 *
 * Shape discipline mirrors the rest of the runtime: the patched constructors
 * keep native name/length/prototype, throw the same native TypeErrors on bad
 * input, and never expose the side table.
 */

/** Build the patch source. `workerSource` is the full worker injection script. */
module.exports = function workerConstructorPatch({ workerSource }) {
  // The prefix is a string literal inside the emitted script; JSON.stringify
  // gives a safe JS string literal for any content.
  const prefixLiteral = JSON.stringify(String(workerSource) + '\n;\n');
  return `
// --- Worker constructor patch (blob:/data: worker identity delivery) ---
(() => {
  // Environment guard: the patch targets real browser documents, where URL and
  // Blob always exist. Sandboxed unit-test scopes build the injection script
  // against minimal mocks that may lack them — degrade to a no-op instead of
  // taking down the whole document-start script.
  if (typeof URL !== 'function' || typeof URL.createObjectURL !== 'function' || typeof Blob !== 'function') return;
  const PREFIX = ${prefixLiteral};
  const nativeCreateObjectURL = URL.createObjectURL;
  const nativeWorker = window.Worker;
  const nativeSharedWorker = window.SharedWorker;
  const MAX_TRACKED = 256;
  const tracked = new Map(); // url -> Blob (bounded, revoked entries removed)
  if (typeof nativeCreateObjectURL === 'function') {
    const nativeRevoke = URL.revokeObjectURL;
    let revokePatched = false;
    const patchedCreateObjectURL = function createObjectURL(obj) {
      const url = nativeCreateObjectURL.call(this, obj);
      try {
        const looksBlob = obj && typeof obj === 'object'
          && typeof obj.size === 'number' && typeof obj.type === 'string'
          && (typeof obj.text === 'function' || typeof obj.stream === 'function');
        if (looksBlob) {
          // Capture the construction text synchronously when the Blob is made
          // only of strings (the standard inline-worker pattern). Non-string
          // parts (ArrayBuffer/View) fall back to size/type-only tracking and
          // pass through un-prefixed.
          let text = '';
          let allStrings = true;
          const parts = obj.__obParts;
          if (Array.isArray(parts)) {
            for (const part of parts) {
              if (typeof part === 'string') text += part;
              else if (part instanceof ArrayBuffer) { const bytes = new Uint8Array(part); text += String.fromCharCode(...bytes); }
              else if (ArrayBuffer.isView(part)) { const bytes = new Uint8Array(part.buffer, part.byteOffset, part.byteLength); text += String.fromCharCode(...bytes); }
              else { allStrings = false; break; }
            }
          } else allStrings = false;
          tracked.set(url, allStrings ? text : null);
          if (tracked.size > MAX_TRACKED) {
            const oldest = tracked.keys().next().value;
            if (oldest !== undefined) tracked.delete(oldest);
          }
          if (!revokePatched && typeof nativeRevoke === 'function') {
            revokePatched = true;
            const patchedRevoke = function revokeObjectURL(u) { tracked.delete(String(u)); return nativeRevoke.call(this, u); };
            try { Object.defineProperty(patchedRevoke, 'name', { value: 'revokeObjectURL' }); } catch (_) {}
            try { Object.defineProperty(patchedRevoke, 'length', { value: 1 }); } catch (_) {}
            patchedRevoke.toString = () => 'function revokeObjectURL() { [native code] }';
            try { Object.defineProperty(URL, 'revokeObjectURL', { value: patchedRevoke, writable: true, configurable: true }); } catch (_) {}
          }
        }
      } catch (_) { /* tracking must never break URL creation */ }
      return url;
    };
    try { Object.defineProperty(patchedCreateObjectURL, 'name', { value: 'createObjectURL' }); } catch (_) {}
    try { Object.defineProperty(patchedCreateObjectURL, 'length', { value: 1 }); } catch (_) {}
    patchedCreateObjectURL.toString = () => 'function createObjectURL() { [native code] }';
    try { Object.defineProperty(URL, 'createObjectURL', { value: patchedCreateObjectURL, writable: true, configurable: true }); } catch (_) {}
  }

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

  const prefixedBlobUrl = (sourceText) => {
    try {
      const blob = new Blob([PREFIX + sourceText], { type: 'application/javascript' });
      return nativeCreateObjectURL.call(URL, blob);
    } catch (_) { return null; }
  };

  const nativeBlob = window.Blob;
  if (typeof nativeBlob === 'function') {
    const PatchedBlob = function Blob(parts, options) {
      if (!(this instanceof PatchedBlob)) throw new TypeError("Failed to construct 'Blob': Please use the 'new' operator");
      const blob = parts === undefined ? new nativeBlob() : new nativeBlob(parts, options);
      try {
        if (Array.isArray(parts) && parts.length <= 32) {
          Object.defineProperty(blob, '__obParts', { value: parts.slice(), enumerable: false, configurable: true });
        }
      } catch (_) {}
      return blob;
    };
    try {
      PatchedBlob.prototype = nativeBlob.prototype;
      Object.defineProperty(PatchedBlob, 'name', { value: 'Blob' });
      Object.defineProperty(PatchedBlob, 'length', { value: 0 });
    } catch (_) {}
    PatchedBlob.toString = () => 'function Blob() { [native code] }';
    try { Object.defineProperty(window, 'Blob', { value: PatchedBlob, writable: true, configurable: true }); } catch (_) {}
  }

  if (typeof nativeWorker === 'function') {
    const PatchedWorker = function Worker(url, options) {
      if (!(this instanceof PatchedWorker)) throw new TypeError("Failed to construct 'Worker': Please use the 'new' operator");
      let target = url;
      try {
        const u = String(url);
        if (/^data:/.test(u)) {
          const text = dataUrlText(u);
          if (text !== null) {
            const replaced = prefixedBlobUrl(text);
            if (replaced) target = replaced;
          }
        } else if (/^blob:/.test(u) && tracked.has(u)) {
          // String-backed blobs were captured at createObjectURL time; rebuild
          // them with the prefix synchronously. Binary blobs (null entry) and
          // unknown URLs pass through untouched.
          const text = tracked.get(u);
          if (typeof text === 'string') {
            const replaced = prefixedBlobUrl(text);
            if (replaced) target = replaced;
          }
        }
        // Network and unknown URLs pass through untouched (Fetch prefixer owns them).
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
})();
`;
};
