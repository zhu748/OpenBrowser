'use strict';

/**
 * Platform font subset loading and the document.fonts metrics script.
 *
 * Extracted verbatim from automation/fingerprint.js: this is the layer that
 * reads assets/font-subsets (per-platform index + font files, base64-cached
 * per process) and turns a platform key into the document-start seeding
 * script that masks document.fonts with persona subsets. Both the document
 * variant (payload inline or hoisted into a shared binding by the caller)
 * and the livePatch behaviour (empty payload → no-op) are preserved.
 */

const fs = require('fs');
const path = require('path');
const { deriveBridgeToken } = require('./font-placeholder');

const FONT_SUBSET_ROOT = path.join(__dirname, '..', 'assets', 'font-subsets');

let fontSubsetIndexCache = null;
const fontSubsetPayloadCache = new Map();

/**
 * Map platform string (e.g. Win32, MacIntel, Linux x86_64, Android)
 * to standard font subset platform key (windows | macos | linux | android).
 * Returns null if unrecognized or unsupported.
 */
function mapPlatformToSubsetKey(platform) {
  if (typeof platform !== 'string') return null;
  const p = platform.trim();
  if (!p) return null;
  if (/^win/i.test(p)) return 'windows';
  if (/^mac/i.test(p) || /darwin/i.test(p) || /iphone|ipad|ipod|ios/i.test(p)) return 'macos';
  if (/android/i.test(p)) return 'android';
  if (/^linux/i.test(p)) {
    if (/arm|aarch/i.test(p)) return 'android';
    return 'linux';
  }
  return null;
}

/**
 * Load and cache platform font subset definitions and base64 payloads.
 * Only reads index.json on first invocation and lazily reads font files per platform.
 */
function loadFontSubsetPayload(platformKey) {
  const normalizedKey = mapPlatformToSubsetKey(platformKey) || (['windows', 'macos', 'linux', 'android'].includes(platformKey) ? platformKey : null);
  if (!normalizedKey) return [];
  if (fontSubsetPayloadCache.has(normalizedKey)) {
    return fontSubsetPayloadCache.get(normalizedKey);
  }

  if (!fontSubsetIndexCache) {
    const indexPath = path.join(FONT_SUBSET_ROOT, 'index.json');
    if (!fs.existsSync(indexPath)) {
      return [];
    }
    try {
      fontSubsetIndexCache = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch (_) {
      return [];
    }
  }

  const platformData = fontSubsetIndexCache?.platforms?.[normalizedKey];
  if (!platformData || typeof platformData !== 'object') {
    return [];
  }

  const payload = [];
  for (const [family, entry] of Object.entries(platformData)) {
    if (!entry || !entry.file) continue;
    const fontFilePath = path.join(FONT_SUBSET_ROOT, normalizedKey, entry.file);
    if (!fs.existsSync(fontFilePath)) continue;
    try {
      const buf = fs.readFileSync(fontFilePath);
      payload.push({
        family,
        format: entry.file.endsWith('.woff2') ? 'font/woff2' : 'font/ttf',
        base64: buf.toString('base64'),
      });
    } catch (_) {}
  }

  fontSubsetPayloadCache.set(normalizedKey, payload);
  return payload;
}

/**
 * Generate document-start IIFE to inject authentic platform font subsets
 * into document.fonts via FontFace, with filtered proxy masking on Document.prototype.fonts.
 */
function buildFontMetricsScript(platformKey, options = {}) {
  const bridgeToken = String(options.bridgeToken || deriveBridgeToken({ platformKey, options }));
  if (options && options.disabled) {
    return '';
  }

  const resolvedPlatform = mapPlatformToSubsetKey(platformKey) || (['windows', 'macos', 'linux', 'android'].includes(platformKey) ? platformKey : null);
  if (!resolvedPlatform) {
    return '';
  }

  // The same platform font payload is consumed twice per document (document.fonts seeding here
  // and the dynamic @font-face local() gate). buildInjectionScript hoists it into one shared
  // binding instead of serialising ~3 MB of base64 twice.
  const payload = Array.isArray(options.payload) ? options.payload : loadFontSubsetPayload(resolvedPlatform);
  if (!payload || !payload.length) {
    return '';
  }
  const payloadExpression = options.payloadVar ? String(options.payloadVar) : JSON.stringify(payload);

  return `(() => {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const BRIDGE_TOKEN = ${JSON.stringify(bridgeToken)};
    const inspectBridge = (fn) => {
      try {
        const result = Function.prototype.toString.call(fn, BRIDGE_TOKEN);
        return result && typeof result === 'object' && result.bridge === true ? result : null;
      } catch (_) { return null; }
    };
    const origFontsDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'fonts');
    if (!origFontsDesc || typeof origFontsDesc.get !== 'function') return;
    // The feature's own getter is the idempotence probe. It keeps bookkeeping in closures
    // and adds no window/globalThis/Symbol property that a page can enumerate.
    if (inspectBridge(origFontsDesc.get)) return;
    if (typeof FontFace !== 'function' || !document || !document.fonts) return;

    const fontData = ${payloadExpression};
    if (!fontData || !fontData.length) return;

    const internalFaces = new WeakSet();
    const shieldedFontsMap = new WeakMap();
    const boundMethodCache = new Map();
    const nativeMap = new WeakMap();
    const origToString = Function.prototype.toString;

    if (origFontsDesc && typeof origFontsDesc.get === 'function') {
      const origFontsGet = origFontsDesc.get;

      const createShieldedProxy = (realFonts) => {
        const wrapIterator = (rawIterator, isEntries) => {
          let cachedNext = null;
          let cachedIter = null;
          return new Proxy(rawIterator, {
            get(iterTarget, iterProp, iterReceiver) {
              if (iterProp === 'next') {
                if (!cachedNext) {
                  cachedNext = function next() {
                    while (true) {
                      const res = iterTarget.next();
                      if (res.done) return res;
                      const face = isEntries ? res.value[0] : res.value;
                      if (internalFaces.has(face)) continue;
                      return res;
                    }
                  };
                  try { Object.defineProperty(cachedNext, 'name', { value: 'next', configurable: true }); } catch (_) {}
                  try { Object.defineProperty(cachedNext, 'length', { value: 0, configurable: true }); } catch (_) {}
                  nativeMap.set(cachedNext, 'function next() { [native code] }');
                }
                return cachedNext;
              }
              if (iterProp === Symbol.iterator) {
                if (!cachedIter) {
                  cachedIter = function () { return iterReceiver; };
                  try { Object.defineProperty(cachedIter, 'name', { value: '[Symbol.iterator]', configurable: true }); } catch (_) {}
                  try { Object.defineProperty(cachedIter, 'length', { value: 0, configurable: true }); } catch (_) {}
                  nativeMap.set(cachedIter, 'function [Symbol.iterator]() { [native code] }');
                }
                return cachedIter;
              }
              if (iterProp === 'constructor') {
                return iterTarget.constructor;
              }
              const val = Reflect.get(iterTarget, iterProp, iterReceiver);
              return typeof val === 'function' ? val.bind(iterTarget) : val;
            }
          });
        };

        const getOrCreateMethod = (name, factory, length = 0) => {
          let fn = boundMethodCache.get(name);
          if (!fn) {
            fn = factory();
            try { Object.defineProperty(fn, 'name', { value: name, configurable: true }); } catch (_) {}
            try { Object.defineProperty(fn, 'length', { value: length, configurable: true }); } catch (_) {}
            nativeMap.set(fn, 'function ' + name + '() { [native code] }');
            boundMethodCache.set(name, fn);
          }
          return fn;
        };

        return new Proxy(realFonts, {
          getOwnPropertyDescriptor(target, prop) {
            return Reflect.getOwnPropertyDescriptor(target, prop);
          },
          has(target, prop) {
            return Reflect.has(target, prop);
          },
          get(target, prop, receiver) {
            if (prop === 'size') {
              let count = 0;
              for (const face of target) {
                if (!internalFaces.has(face)) count++;
              }
              return count;
            }
            if (prop === 'has') {
              return getOrCreateMethod('has', () => function has(face) {
                if (internalFaces.has(face)) return false;
                return target.has(face);
              }, 1);
            }
            if (prop === 'entries') {
              return getOrCreateMethod('entries', () => function entries() {
                return wrapIterator(target.entries(), true);
              }, 0);
            }
            if (prop === 'keys') {
              return getOrCreateMethod('keys', () => function keys() {
                return wrapIterator(target.keys(), false);
              }, 0);
            }
            if (prop === 'values' || prop === Symbol.iterator) {
              return getOrCreateMethod('values', () => function values() {
                return wrapIterator(target.values(), false);
              }, 0);
            }
            if (prop === 'forEach') {
              return getOrCreateMethod('forEach', () => function forEach(callback, thisArg) {
                for (const face of target) {
                  if (!internalFaces.has(face)) {
                    callback.call(thisArg, face, face, receiver);
                  }
                }
              }, 1);
            }
            if (prop === 'check') {
              let bound = boundMethodCache.get('check');
              if (!bound) {
                const targetCheck = target.check;
                // check() must answer exactly like a stock build. Chromium's native implementation
                // answers true for any family it can fall back on -- it is not a font-enumeration
                // oracle -- so filtering by the persona list here cannot hide anything, it only
                // creates a page-visible difference (stock: true, injected: false) that flags the
                // browser as instrumented. The real FontFaceSet already holds the injected faces,
                // so delegating with the real receiver is both correct and sufficient.
                bound = function check(font, text) {
                  return targetCheck.apply(target, arguments);
                };
                try { Object.defineProperty(bound, 'name', { value: 'check', configurable: true }); } catch (_) {}
                try { Object.defineProperty(bound, 'length', { value: targetCheck ? targetCheck.length : 1, configurable: true }); } catch (_) {}
                nativeMap.set(bound, 'function check() { [native code] }');
                boundMethodCache.set('check', bound);
              }
              return bound;
            }
            if (prop === 'load') {
              let bound = boundMethodCache.get('load');
              if (!bound) {
                const targetLoad = target.load;
                bound = function load(font, text) {
                  let pending;
                  try { pending = targetLoad.apply(target, arguments); } catch (error) { return Promise.reject(error); }
                  return Promise.resolve(pending).then((faces) => {
                    if (!Array.isArray(faces)) return faces;
                    return faces.filter((face) => !internalFaces.has(face));
                  });
                };
                try { Object.defineProperty(bound, 'name', { value: 'load', configurable: true }); } catch (_) {}
                try { Object.defineProperty(bound, 'length', { value: targetLoad ? targetLoad.length : 1, configurable: true }); } catch (_) {}
                nativeMap.set(bound, 'function load() { [native code] }');
                boundMethodCache.set('load', bound);
              }
              return bound;
            }
            if (prop === 'delete') {
              let bound = boundMethodCache.get('delete');
              if (!bound) {
                const targetDelete = target.delete;
                bound = function delete_(face) {
                  if (internalFaces.has(face)) return false;
                  return targetDelete.call(target, face);
                };
                try { Object.defineProperty(bound, 'name', { value: 'delete', configurable: true }); } catch (_) {}
                try { Object.defineProperty(bound, 'length', { value: targetDelete ? targetDelete.length : 1, configurable: true }); } catch (_) {}
                nativeMap.set(bound, 'function delete() { [native code] }');
                boundMethodCache.set('delete', bound);
              }
              return bound;
            }
            if (prop === 'clear') {
              let bound = boundMethodCache.get('clear');
              if (!bound) {
                const targetClear = target.clear;
                bound = function clear() {
                  for (const face of Array.from(target)) {
                    if (!internalFaces.has(face)) target.delete(face);
                  }
                };
                try { Object.defineProperty(bound, 'name', { value: 'clear', configurable: true }); } catch (_) {}
                try { Object.defineProperty(bound, 'length', { value: targetClear ? targetClear.length : 0, configurable: true }); } catch (_) {}
                nativeMap.set(bound, 'function clear() { [native code] }');
                boundMethodCache.set('clear', bound);
              }
              return bound;
            }
            const val = Reflect.get(target, prop, target);
            if (typeof val === 'function') {
              let bound = boundMethodCache.get(val);
              if (!bound) {
                bound = val.bind(target);
                try { Object.defineProperty(bound, 'name', { value: val.name, configurable: true }); } catch (_) {}
                try { Object.defineProperty(bound, 'length', { value: val.length, configurable: true }); } catch (_) {}
                nativeMap.set(bound, 'function ' + val.name + '() { [native code] }');
                boundMethodCache.set(val, bound);
              }
              return bound;
            }
            return val;
          }
        });
      };

      const patchedFontsGet = function getFonts() {
        const isDoc = this === document || (typeof Document !== 'undefined' && this instanceof Document) ||
          Object.prototype.toString.call(this) === '[object HTMLDocument]' ||
          Object.prototype.toString.call(this) === '[object Document]';
        if (!isDoc) {
          throw new TypeError('Illegal invocation');
        }
        const realFonts = origFontsGet.call(this);
        let shielded = shieldedFontsMap.get(this);
        if (!shielded) {
          shielded = createShieldedProxy(realFonts);
          shieldedFontsMap.set(this, shielded);
        }
        return shielded;
      };

      try {
        Object.defineProperty(patchedFontsGet, 'name', { configurable: true, value: 'get fonts' });
      } catch (_) {}
      try {
        Object.defineProperty(patchedFontsGet, 'length', { configurable: true, value: 0 });
      } catch (_) {}
      nativeMap.set(patchedFontsGet, 'function get fonts() { [native code] }');

      // Page frameworks (core-js and friends) replace Function.prototype.toString themselves. If
      // our wrapper falls back to whatever implementation is installed and that implementation
      // calls back into ours, the pair recurses with no exit and pins a core for as long as the
      // tab lives. The depth guard answers a re-entrant call from the bridge cache only, so the
      // cycle terminates at the second hop instead of spinning.
      let toStringReentryDepth = 0;
      const customToString = function toString(...args) {
        const secret = args[0];
        if (toStringReentryDepth > 0) {
          if (nativeMap.has(this)) {
            if (secret === BRIDGE_TOKEN) return { bridge: true, nativeText: nativeMap.get(this) };
            return nativeMap.get(this);
          }
          return 'function ' + (this && typeof this.name === 'string' ? this.name : 'toString') + '() { [native code] }';
        }
        toStringReentryDepth += 1;
        try {
          if (secret === BRIDGE_TOKEN) {
            if ((args[1] === 'documentInstalled' || args[1] === 'sharedWorkers')) return origToString.call(this, ...args);
            if (nativeMap.has(this)) return { bridge: true, nativeText: nativeMap.get(this) };
            try {
              const inherited = origToString.call(this, secret);
              if (inherited && typeof inherited === 'object' && inherited.bridge === true) return inherited;
            } catch (_) {}
          }
          if (nativeMap.has(this)) return nativeMap.get(this);
          return origToString.call(this, ...args);
        } finally {
          toStringReentryDepth -= 1;
        }
      };
      nativeMap.set(customToString, 'function toString() { [native code] }');
      try {
        Object.defineProperty(Function.prototype, 'toString', {
          configurable: true,
          writable: true,
          value: customToString,
        });
      } catch (_) {}

      Object.defineProperty(Document.prototype, 'fonts', {
        configurable: true,
        enumerable: origFontsDesc.enumerable,
        get: patchedFontsGet,
        set: undefined,
      });
    }

    for (let i = 0; i < fontData.length; i++) {
      try {
        const item = fontData[i];
        const face = new FontFace(item.family, 'url("data:' + item.format + ';base64,' + item.base64 + '")');
        internalFaces.add(face);
        document.fonts.add(face);
        face.load().catch(() => {});
      } catch (_) {}
    }
  } catch (_) {}
})();`;
}


module.exports = {
  FONT_SUBSET_ROOT,
  mapPlatformToSubsetKey,
  loadFontSubsetPayload,
  buildFontMetricsScript,
};
