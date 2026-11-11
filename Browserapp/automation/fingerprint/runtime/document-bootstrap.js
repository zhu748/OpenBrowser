'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = function bootstrap({ uaScript, json, bridgeToken }) {
  return `${uaScript}
(() => {
  try {
  const CFG = ${json};
  // Phone identity flag, shared by the window metrics and the navigator patch below.
  const MOBILE = Boolean(CFG.mobile);

  const seedNum = parseInt(String(CFG.seed || '1').slice(0, 8), 16) || 1;
  const noise = (n) => {
    let x = Math.sin((n + 1) * seedNum) * 10000;
    return x - Math.floor(x);
  };
  const normalizeHost = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\\/\\//, '')
    .replace(/\\/.*$/, '')
    .replace(/:\\d+$/, '')
    .replace(/^\\*\\./, '');
  const hostMatches = (host, pattern) => {
    const h = normalizeHost(host);
    const p = normalizeHost(pattern);
    if (!h || !p) return false;
    if (h === p) return true;
    return h.endsWith('.' + p);
  };
  const listHasHost = (list, host) => Array.isArray(list) && list.some((item) => hostMatches(host, item));
  const currentHost = () => {
    try { return normalizeHost(location && location.hostname); } catch (_) { return ''; }
  };
  // stability 策略动态判定：
  // - active === true (稳定性生效): noiseAmplitude = 1 -> delta 恒为 0 (零噪声，最大一致性)
  // - active === false (常规噪声或 skipHosts 例外): noiseAmplitude = 3 -> delta ∈ {-1, 0, 1}
  // - skipHosts 是保留常规噪声的例外表，不可短路返回原生真实数据
  // The verdict is memoized at document scope: it depends only on CFG (fixed
  // per injection) and location.hostname (fixed per document), yet it used to
  // re-run up to 4 host-list scans on EVERY canvas noise sample — thousands of
  // regex passes per minute on host-heavy configurations.
  let __stabilityVerdict;
  const stabilityActiveNow = () => {
    if (__stabilityVerdict !== undefined) return __stabilityVerdict;
    const st = CFG.stability || {};
    let verdict;
    if (st.mode === 'force') {
      verdict = !listHasHost(st.skipHosts, currentHost());
    } else if (st.mode === 'off') {
      verdict = false;
    } else {
      const host = currentHost();
      if (!host) verdict = Boolean(st.active);
      else if (listHasHost(st.skipHosts, host)) verdict = false;
      else if (listHasHost(st.hosts, host)) verdict = true;
      else verdict = Boolean(st.active);
    }
    __stabilityVerdict = verdict;
    return verdict;
  };
  const noiseAmplitudeNow = () => stabilityActiveNow() ? (Number(CFG.stability?.noiseAmplitude) || 1) : 3;
  const sampleStepDivisorNow = () => stabilityActiveNow() ? (Number(CFG.stability?.sampleStepDivisor) || 128) : 64;
  const canvasNoiseLocks = new Map();
  // Lock entries are keyed by canvas size × call site; a page that allocates
  // many distinct sizes (video frames, chart libraries) used to grow the map
  // without bound for the document's lifetime. 64 keys × a few hundred deltas
  // each covers real usage; the oldest entry is evicted first.
  const CANVAS_NOISE_LOCK_LIMIT = 64;
  const rememberCanvasNoiseLock = (key, locked) => {
    if (canvasNoiseLocks.size >= CANVAS_NOISE_LOCK_LIMIT) {
      const oldest = canvasNoiseLocks.keys().next().value;
      if (oldest !== undefined) canvasNoiseLocks.delete(oldest);
    }
    canvasNoiseLocks.set(key, locked);
  };
  const applyCanvasNoise = (imageData, mark) => {
    try {
      if (!imageData || !imageData.data) return imageData;
      const data = imageData.data;
      if (!(data instanceof Uint8ClampedArray) && !(data instanceof Uint8Array)) return imageData;
      const amp = noiseAmplitudeNow();
      const maxW = Number(CFG.stability?.maxWidth) || 600;
      const maxH = Number(CFG.stability?.maxHeight) || 600;
      const width = imageData.width || 0;
      const height = imageData.height || 0;
      const limitW = width > 0 ? Math.min(width, maxW) : width;
      const limitH = height > 0 ? Math.min(height, maxH) : height;
      const square = Math.max(2, Number(CFG.stability?.square) || 8);
      const stable = stabilityActiveNow();
      // On high-risk hosts, lock first-read deltas so repeated samples stay within hamming threshold.
      if (stable) {
        const key = width + 'x' + height + ':' + mark + ':' + square + ':' + amp;
        let locked = canvasNoiseLocks.get(key);
        if (!locked) {
          locked = [];
          for (let y = 0; y < (limitH || height); y += square) {
            for (let x = 0; x < (limitW || width); x += square) {
              const px = ((y * width) + x) * 4;
              if (px + 3 >= data.length) continue;
              if (data[px + 3] === 0) continue;
              const delta = Math.floor(noise(px + mark) * amp) - Math.floor(amp / 2);
              locked.push({ px: px, delta: delta });
            }
          }
          rememberCanvasNoiseLock(key, locked);
        }
        for (let i = 0; i < locked.length; i += 1) {
          const item = locked[i];
          if (item.px + 3 >= data.length) continue;
          if (data[item.px + 3] === 0) continue;
          data[item.px] = Math.max(0, Math.min(255, data[item.px] + item.delta));
        }
        return imageData;
      }
      for (let y = 0; y < (limitH || height); y += square) {
        for (let x = 0; x < (limitW || width); x += square) {
          const px = ((y * width) + x) * 4;
          if (px + 3 >= data.length) continue;
          if (data[px + 3] === 0) continue;
          const n = Math.floor(noise(px + mark) * amp) - Math.floor(amp / 2);
          data[px] = Math.max(0, Math.min(255, data[px] + n));
        }
      }
    } catch (_) {}
    return imageData;
  };
  const originalToString = Function.prototype.toString;
  const BRIDGE_TOKEN = ${JSON.stringify(bridgeToken)};
  const nativeSource = new WeakMap();
  const subWindowSyncHooks = [];
  // Assigned by the font-shield block below when a profile declares foreign families. The
  // clientRects patch wraps its measurement in this scope so both layers live in ONE bridge
  // wrapper: two independent nativeLike wrappers would make replaceMethod treat the second
  // one as an existing bridge and silently skip it.
  let sanitizeElementFontScope = (element, callback) => callback();
  let sanitizeCanvasFontShorthand = (font) => font;
  let isForeignCanvasFont = (family) => false;
  const inspectBridge = (fn) => {
    try {
      if (typeof fn !== 'function') return null;
      // A same-origin iframe has its own Function.prototype and its own private WeakMap.
      // Calling fn.toString first enters that Realm's bridge; the current Realm is only a fallback.
      const ownToString = fn.toString;
      if (typeof ownToString === 'function') {
        const result = ownToString.call(fn, BRIDGE_TOKEN);
        if (result && typeof result === 'object' && result.bridge === true) return result;
      }
      const fallback = Function.prototype.toString.call(fn, BRIDGE_TOKEN);
      return fallback && typeof fallback === 'object' && fallback.bridge === true ? fallback : null;
    } catch (_) { return null; }
  };
  // The token is derived from the exact fingerprint configuration. Same-source document-start and
  // Runtime.evaluate passes return here before they can add a second noise layer; a changed
  // configuration has a different token and continues without writing a public marker.
  const bridgeCheck = inspectBridge(Function.prototype.toString); if (bridgeCheck && bridgeCheck.token === BRIDGE_TOKEN) return;
  const cleanStack = (err, fnName) => {
    try {
      if (err && typeof err.stack === 'string') {
        const lines = err.stack.split(String.fromCharCode(10));
        const header = lines[0];
        const filtered = lines.slice(1).filter((l) => {
          if (fnName && l.includes(fnName)) return false;
          if (l.includes('<anonymous>') && (l.includes('getImageData') || l.includes('replaceMethod') || l.includes('nativeLike') || l.includes('safeWrapper'))) return false;
          return true;
        });
        err.stack = [header, ...filtered].join(String.fromCharCode(10));
      }
    } catch (_) {}
    return err;
  };
  const nativeLike = (wrapper, original, nameOverride, lengthOverride, isConstructor = false) => {
    if (typeof wrapper !== "function") return wrapper;
    const fnName = nameOverride !== undefined ? nameOverride : (original ? original.name : (wrapper.name || ""));
    const fnLength = lengthOverride !== undefined ? lengthOverride : (original ? original.length : wrapper.length);
    let clean;
    if (isConstructor) {
      clean = wrapper;
      try { Object.defineProperty(clean, "name", { configurable: true, value: fnName }); } catch (_) {}
      try { Object.defineProperty(clean, "length", { configurable: true, value: fnLength }); } catch (_) {}
    } else {
      const holder = {
        [fnName](...args) {
          try {
            return wrapper.apply(this, args);
          } catch (err) {
            throw cleanStack(err, fnName);
          }
        }
      };
      clean = holder[fnName];
      try { Object.defineProperty(clean, "length", { configurable: true, value: fnLength }); } catch (_) {}
    }
    let nativeStr;
    if (typeof original === "function") {
      const origStr = nativeSource.get(original) || originalToString.call(original);
      nativeStr = (origStr && origStr.includes("[native code]"))
        ? origStr
        : ("function " + fnName + "() { [native code] }");
    } else {
      nativeStr = "function " + fnName + "() { [native code] }";
    }
    try { nativeSource.set(clean, nativeStr); } catch (_) {}
    try { nativeSource.set(wrapper, nativeStr); } catch (_) {}
    return clean;
  };
  const stripStackFrame = (err, fn, frameName) => {
    if (!err) return err;
    if (typeof Error.captureStackTrace === "function" && typeof fn === "function") {
      try { Error.captureStackTrace(err, fn); } catch (_) {}
    }
    if (typeof err.stack === "string") {
      const nl = String.fromCharCode(10);
      const lines = err.stack.split(nl);
      const baseName = (frameName && frameName.indexOf("get ") === 0) ? frameName.slice(4) : "";
      if (lines.length > 1 && lines[1] && ((frameName && lines[1].indexOf(frameName) !== -1) || (baseName && lines[1].indexOf(baseName) !== -1))) {
        lines.splice(1, 1);
        try { err.stack = lines.join(nl); } catch (_) {}
      }
    }
    return err;
  };
  const getRealmTypeError = (receiver) => {
    try {
      if (receiver) {
        if (receiver.ownerDocument && receiver.ownerDocument.defaultView && receiver.ownerDocument.defaultView.TypeError) {
          return receiver.ownerDocument.defaultView.TypeError;
        }
        const ctor = receiver.constructor;
        if (ctor) {
          if (ctor.ownerDocument && ctor.ownerDocument.defaultView && ctor.ownerDocument.defaultView.TypeError) {
            return ctor.ownerDocument.defaultView.TypeError;
          }
          if (typeof ctor.constructor === "function") {
            const globalObj = ctor.constructor("return this")();
            if (globalObj && globalObj.TypeError) return globalObj.TypeError;
          }
        }
      }
    } catch (_) {}
    return (typeof TypeError !== "undefined" ? TypeError : Error);
  };
  // Genuine-instance whitelist for cross-realm receivers. WebIDL getters brand-check the
  // receiver against interface internal slots, which pure JS cannot inspect. The previous
  // structural acceptance (foreign constructor name + prototype match) also accepted synthetic
  // receivers built on ANOTHER realm's prototype (Object.create(frameWin.Navigator.prototype)
  // passed the parent-closure getters installed by patchSubWindow) — receivers stock engines
  // reject with "Illegal invocation" (verified against Chrome 157 / Firefox 160). Only this
  // realm's own navigator/screen instance and sub-window instances registered at sync time
  // (see document-screen.js patchSubWindow) may read; everything else throws.
  const crossRealmApproved = new WeakSet();
  const isPlatformObject = (receiver, localInstance) => {
    if (!receiver) return false;
    if (receiver === localInstance) return true;
    return crossRealmApproved.has(receiver);
  };
  const makeNativeGetter = (key, getValue, targetType, realmWin) => {
    let getter;
    const holder = {
      get [key]() {
        if (targetType === "navigator") {
          const isProto = (typeof Navigator !== "undefined" && this === Navigator.prototype) ||
            (this && this.constructor && this.constructor.prototype === this) ||
            (this && Object.getPrototypeOf(this) === Object.prototype);
          const isNav = !isProto && isPlatformObject(
            this,
            typeof navigator !== "undefined" ? navigator : null
          );
          if (!isNav) {
            const RealmTypeError = (realmWin && realmWin.TypeError) || getRealmTypeError(this);
            const err = new RealmTypeError("Illegal invocation");
            stripStackFrame(err, getter, "get " + key);
            throw err;
          }
        } else if (targetType === "screen") {
          const isProto = (typeof Screen !== "undefined" && this === Screen.prototype) ||
            (this && this.constructor && this.constructor.prototype === this) ||
            (this && Object.getPrototypeOf(this) === Object.prototype);
          const isScr = !isProto && isPlatformObject(
            this,
            typeof screen !== "undefined" ? screen : null
          );
          if (!isScr) {
            const RealmTypeError = (realmWin && realmWin.TypeError) || getRealmTypeError(this);
            const err = new RealmTypeError("Illegal invocation");
            stripStackFrame(err, getter, "get " + key);
            throw err;
          }
        }
        try {
          return getValue.call(this);
        } catch (err) {
          stripStackFrame(err, getter, "get " + key);
          throw err;
        }
      }
    };
    getter = Object.getOwnPropertyDescriptor(holder, key).get;
    try { Object.defineProperty(getter, "name", { configurable: true, value: "get " + key }); } catch (_) {}
    try { Object.defineProperty(getter, "length", { configurable: true, value: 0 }); } catch (_) {}
    nativeSource.set(getter, "function get " + key + "() { [native code] }");
    return getter;
  };
  const nativeGetter = (key, fn) => {
    if (typeof fn !== "function") return fn;
    try { Object.defineProperty(fn, "name", { configurable: true, value: "get " + key }); } catch (_) {}
    try { Object.defineProperty(fn, "length", { configurable: true, value: 0 }); } catch (_) {}
    try { nativeSource.set(fn, "function get " + key + "() { [native code] }"); } catch (_) {}
    return fn;
  };
  const nativeSetter = (key, fn) => {
    if (typeof fn !== "function") return fn;
    try { Object.defineProperty(fn, "name", { configurable: true, value: "set " + key }); } catch (_) {}
    try { Object.defineProperty(fn, "length", { configurable: true, value: 1 }); } catch (_) {}
    try { nativeSource.set(fn, "function set " + key + "() { [native code] }"); } catch (_) {}
    return fn;
  };
  const nativeAccessor = (key, desc) => {
    if (desc && typeof desc.get === "function") nativeGetter(key, desc.get);
    if (desc && typeof desc.set === "function") {
      try { Object.defineProperty(desc.set, "name", { configurable: true, value: "set " + key }); } catch (_) {}
      try { nativeSource.set(desc.set, "function set " + key + "() { [native code] }"); } catch (_) {}
    }
    return desc;
  };
  try {
    let patchedToString;
    const holder = {
      toString(...args) {
        const secret = args[0];
        if (secret === BRIDGE_TOKEN) {
          if (args[1] === "register" && typeof args[2] === "function" && typeof args[3] === "string") {
            nativeSource.set(args[2], args[3]);
            return true;
          }
          if (nativeSource.has(this)) return { bridge: true, token: BRIDGE_TOKEN, nativeText: nativeSource.get(this) };
          try {
            const inherited = originalToString.call(this, secret);
            if (inherited && typeof inherited === 'object' && inherited.bridge === true) return inherited;
          } catch (_) {}
          return null;
        }
        if (nativeSource.has(this)) return nativeSource.get(this);
        try {
          if (typeof this.toString === "function" && this.toString !== patchedToString) {
            const crossRealm = this.toString(BRIDGE_TOKEN);
            if (crossRealm && typeof crossRealm === "object" && crossRealm.bridge === true && crossRealm.nativeText) {
              return crossRealm.nativeText;
            }
          }
        } catch (_) {}
        return originalToString.call(this, ...args);
      }
    };
    patchedToString = holder.toString;
    nativeSource.set(patchedToString, "function toString() { [native code] }");
    try { Object.defineProperty(patchedToString, "length", { configurable: true, value: 0 }); } catch (_) {}
    try { Object.defineProperty(patchedToString, "name", { configurable: true, value: "toString" }); } catch (_) {}
    Object.defineProperty(Function.prototype, "toString", {
      configurable: true,
      writable: true,
      value: patchedToString,
    });
  } catch (_) {}
  // Replacements only answer for the receiver they are meant to serve. Anything else is handed to
  // the native implementation, so brand checks, thrown error types and rejection messages stay
  // exactly what the build produces instead of being replaced by a hand-made error.
  const guardReceiver = (original, isTarget, serve) => function (...args) {
    if (typeof original === 'function' && typeof isTarget === 'function' && !isTarget(this)) {
      return original.apply(this, args);
    }
    return serve.apply(this, args);
  };
  const adoptNativeBridgeWrappers = (...protos) => {
    let adopted = false;
    for (const proto of protos.flat().filter(Boolean)) {
      let names = [];
      try { names = Object.getOwnPropertyNames(proto); } catch (_) { continue; }
      for (const key of names) {
        let descriptor = null;
        try { descriptor = Object.getOwnPropertyDescriptor(proto, key); } catch (_) { continue; }
        const fn = descriptor && descriptor.value;
        const state = inspectBridge(fn);
        if (!state) continue;
        try { nativeSource.set(fn, state.nativeText || ('function ' + (fn.name || key) + '() { [native code] }')); } catch (_) {}
        adopted = true;
      }
    }
    return adopted;
  };
  const replaceMethod = (proto, key, factory) => {
    try {
      if (!proto || typeof proto[key] !== "function") return null;
      const original = proto[key];
      const existing = inspectBridge(original);
      if (existing) {
        try { nativeSource.set(original, existing.nativeText || ('function ' + (original.name || key) + '() { [native code] }')); } catch (_) {}
        return original;
      }
      const rawFn = factory(original);
      let replacement;
      const safeWrapper = function(...args) {
        try {
          return rawFn.apply(this, args);
        } catch (err) {
          stripStackFrame(err, replacement, key);
          throw cleanStack(err, key);
        }
      };
      replacement = nativeLike(safeWrapper, original, key, original.length);
      Object.defineProperty(proto, key, {
        configurable: true,
        enumerable: Object.getOwnPropertyDescriptor(proto, key)?.enumerable || false,
        writable: true,
        value: replacement,
      });
      return original;
    } catch (_) { return null; }
  };

`;
};
