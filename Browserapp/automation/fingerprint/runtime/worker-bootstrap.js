'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = function bootstrap({ json, bridgeToken }) {
  return `(() => {
  const CFG = ${json};

  // Phone identity flags mirroring the main-world script: declared once at IIFE top level so
  // every guard below (UAData replacement, StorageManager quota) sees them. Previously each flag
  // was referenced from a block whose declaring try had already exited, so evaluating the guard
  // threw a ReferenceError that the outer try swallowed and the gated patch silently never ran.
  const MOBILE = Boolean(CFG.mobile);
  const isIosPersona = Boolean(CFG.os === "ios" || CFG.platform === "iPhone" || CFG.mobileDevice?.os === "ios" || (CFG.platform && /iphone|ipad|ipod/i.test(CFG.platform)));
  const isAndroidPersona = Boolean(CFG.os === "android" || CFG.mobileDevice?.os === "android" || (CFG.platform && /android/i.test(CFG.platform)));

  const seedNum = parseInt(String(CFG.seed || '1').slice(0, 8), 16) || 1;
  const noise = (n) => { const x = Math.sin((n + 1) * seedNum) * 10000; return x - Math.floor(x); };
  const square = Math.max(2, Number(CFG.stability?.square) || 8);
  const workerLocks = new Map();
  // Bounded like the main thread's canvasNoiseLocks: video/frame-processing
  // workers allocate many distinct canvas sizes and the map must not grow for
  // the worker's whole lifetime.
  const WORKER_LOCK_LIMIT = 64;
  const rememberWorkerLock = (key, locked) => {
    if (workerLocks.size >= WORKER_LOCK_LIMIT) {
      const oldest = workerLocks.keys().next().value;
      if (oldest !== undefined) workerLocks.delete(oldest);
    }
    workerLocks.set(key, locked);
  };
  const normalizeHost = (value) => String(value || '')
    .trim()
    .toLowerCase()
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
    try { return normalizeHost(self && self.location && self.location.hostname); } catch (_) { return ''; }
  };
  // Match main-thread stabilityActiveNow: evaluate host at noise-time, not only at launch.
  // active === true 时 noiseAmplitude = 1 (零噪声)，skipHosts 命中时 active === false (保留常规噪声 amp=3)
  // Memoized like the main thread: the verdict only depends on CFG (fixed per
  // injection) and the worker's hostname (fixed per worker), so the host-list
  // scans must not re-run on every noise sample.
  let __stabilityVerdict;
  const stabilityActiveNow = () => {
    if (__stabilityVerdict !== undefined) return __stabilityVerdict;
    const st = CFG.stability || {};
    let verdict;
    if (st.mode === 'force') verdict = !listHasHost(st.skipHosts, currentHost());
    else if (st.mode === 'off') verdict = false;
    else {
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
  const sampleStepDivisorNow = () => stabilityActiveNow()
    ? (Number(CFG.stability?.sampleStepDivisor) || 128)
    : 64;
  const applyNoise = (imageData, mark) => {
    try {
      const data = imageData.data;
      const width = imageData.width || 0;
      const height = imageData.height || 0;
      const maxW = Number(CFG.stability?.maxWidth) || 600;
      const maxH = Number(CFG.stability?.maxHeight) || 600;
      const limitW = width > 0 ? Math.min(width, maxW) : width;
      const limitH = height > 0 ? Math.min(height, maxH) : height;
      const amp = noiseAmplitudeNow();
      const stableWorker = stabilityActiveNow();
      if (width > 0 && height > 0) {
        if (stableWorker) {
          const key = width + 'x' + height + ':' + mark + ':' + square + ':' + amp;
          let locked = workerLocks.get(key);
          if (!locked) {
            locked = [];
            for (let y = 0; y < limitH; y += square) {
              for (let x = 0; x < limitW; x += square) {
                const px = ((y * width) + x) * 4;
                if (px + 3 >= data.length) continue;
                if (data[px + 3] === 0) continue;
                locked.push({ px: px, delta: Math.floor(noise(px + mark) * amp) - Math.floor(amp / 2) });
              }
            }
            rememberWorkerLock(key, locked);
          }
          for (let i = 0; i < locked.length; i += 1) {            const item = locked[i];
            if (item.px + 3 >= data.length) continue;
            if (data[item.px + 3] === 0) continue;
            data[item.px] = Math.max(0, Math.min(255, data[item.px] + item.delta));
          }
          return imageData;
        }
        for (let y = 0; y < limitH; y += square) {
          for (let x = 0; x < limitW; x += square) {
            const px = ((y * width) + x) * 4;
            if (px + 3 >= data.length) continue;
            if (data[px + 3] === 0) continue;
            const n = Math.floor(noise(px + mark) * amp) - Math.floor(amp / 2);
            data[px] = Math.max(0, Math.min(255, data[px] + n));
          }
        }
      } else {
        for (let i = 0; i < data.length; i += 4) {
          const n = Math.floor(noise(i + mark) * amp) - Math.floor(amp / 2);
          data[i] = Math.max(0, Math.min(255, data[i] + n));
        }
      }
    } catch (_) {}
    return imageData;
  };
  const sources = new WeakMap();
  const originalToString = Function.prototype.toString;
  const BRIDGE_TOKEN = ${JSON.stringify(bridgeToken)};
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
  // Same-token worker recovery passes are no-ops. A changed profile has a fresh token and can
  // still apply without placing any marker on WorkerGlobalScope.
  const workerBridgeCheck = inspectBridge(Function.prototype.toString); if (workerBridgeCheck && workerBridgeCheck.token === BRIDGE_TOKEN) return;
  const nativeLike = (wrapper, original, nameOverride, lengthOverride, isConstructor = false) => {
    if (typeof wrapper !== 'function') return wrapper;
    const fnName = nameOverride !== undefined ? nameOverride : (original ? original.name : (wrapper.name || ''));
    const fnLength = lengthOverride !== undefined ? lengthOverride : (original ? original.length : wrapper.length);
    let clean;
    if (isConstructor) {
      clean = wrapper;
      try { Object.defineProperty(clean, 'name', { configurable: true, value: fnName }); } catch (_) {}
      try { Object.defineProperty(clean, 'length', { configurable: true, value: fnLength }); } catch (_) {}
    } else {
      const holder = {
        [fnName](...args) {
          return wrapper.apply(this, args);
        }
      };
      clean = holder[fnName];
      try { Object.defineProperty(clean, 'length', { configurable: true, value: fnLength }); } catch (_) {}
    }
    const nativeStr = (typeof original === 'function')
      ? (sources.get(original) || originalToString.call(original))
      : ('function ' + fnName + '() { [native code] }');
    try { sources.set(clean, nativeStr); } catch (_) {}
    try { sources.set(wrapper, nativeStr); } catch (_) {}
    return clean;
  };
  // Workers are probed independently of the page, so the accessors installed here need the
  // same native disguise: real WorkerNavigator getters stringify as [native code].
  const nativeAccessor = (key, desc) => {
    if (desc && typeof desc.get === 'function') {
      try { Object.defineProperty(desc.get, 'name', { configurable: true, value: 'get ' + key }); } catch (_) {}
      try { Object.defineProperty(desc.get, 'length', { configurable: true, value: 0 }); } catch (_) {}
      try { sources.set(desc.get, 'function get ' + key + '() { [native code] }'); } catch (_) {}
    }
    return desc;
  };
  const stripStackFrame = (err, fn, frameName) => {
    if (!err) return err;
    if (typeof Error.captureStackTrace === 'function' && typeof fn === 'function') {
      try { Error.captureStackTrace(err, fn); } catch (_) {}
    }
    if (typeof err.stack === 'string') {
      const nl = String.fromCharCode(10);
      const lines = err.stack.split(nl);
      const baseName = (frameName && frameName.indexOf('get ') === 0) ? frameName.slice(4) : '';
      if (lines.length > 1 && lines[1] && ((frameName && lines[1].indexOf(frameName) !== -1) || (baseName && lines[1].indexOf(baseName) !== -1))) {
        lines.splice(1, 1);
        try { err.stack = lines.join(nl); } catch (_) {}
      }
    }
    return err;
  };
  const getWorkerRealmTypeError = (receiver) => {
    try {
      if (receiver && receiver.constructor) {
        const ctor = receiver.constructor;
        if (typeof ctor.constructor === 'function') {
          const glob = ctor.constructor('return this')();
          if (glob && glob.TypeError) return glob.TypeError;
        }
      }
    } catch (_) {}
    try {
      if (typeof self !== 'undefined' && self.TypeError) return self.TypeError;
    } catch (_) {}
    try {
      if (typeof globalThis !== 'undefined' && globalThis.TypeError) return globalThis.TypeError;
    } catch (_) {}
    return (typeof TypeError !== 'undefined' ? TypeError : Error);
  };
  const makeNativeWorkerGetter = (key, getValue) => {
    let getter;
    const holder = {
      get [key]() {
        // Same brand-check approximation as the document runtime: only the realm's own
        // WorkerNavigator instance may read. A worker scope is a single realm — there are no
        // sub-windows to register, so synthetic receivers (Object.create(
        // WorkerNavigator.prototype), subclasses, plain objects) throw "Illegal invocation"
        // exactly like the real engine does.
        const isProto = (typeof WorkerNavigator !== 'undefined' && this === WorkerNavigator.prototype) ||
          (this && this.constructor && this.constructor.prototype === this) ||
          (this && Object.getPrototypeOf(this) === Object.prototype);
        const isWorkerNav = Boolean(
          this &&
          !isProto &&
          (typeof WorkerNavigator === 'undefined' || this !== WorkerNavigator.prototype) &&
          this === (typeof navigator !== 'undefined' ? navigator : null)
        );
        if (!isWorkerNav) {
          const RealmTypeError = getWorkerRealmTypeError(this);
          const err = new RealmTypeError('Illegal invocation');
          stripStackFrame(err, getter, 'get ' + key);
          throw err;
        }
        return getValue.call(this);
      }
    };
    getter = Object.getOwnPropertyDescriptor(holder, key).get;
    try { Object.defineProperty(getter, 'name', { configurable: true, value: 'get ' + key }); } catch (_) {}
    try { Object.defineProperty(getter, 'length', { configurable: true, value: 0 }); } catch (_) {}
    try { sources.set(getter, 'function get ' + key + '() { [native code] }'); } catch (_) {}
    return getter;
  };
  try {
    // originalToString is whatever implementation was installed when this realm was patched. A
    // site that replaced Function.prototype.toString earlier (core-js) can call back into this
    // wrapper from inside its own body, which used to recurse until the renderer watchdog fired.
    // Re-entrant calls are answered from the bridge cache instead of re-entering page code.
    let toStringReentryDepth = 0;
    const rawToString = function toString(...args) {
      const secret = args[0];
      if (toStringReentryDepth > 0) {
        if (sources.has(this)) {
          if (secret === BRIDGE_TOKEN) return { bridge: true, token: BRIDGE_TOKEN, nativeText: sources.get(this) };
          return sources.get(this);
        }
        return 'function ' + (this && typeof this.name === 'string' ? this.name : 'toString') + '() { [native code] }';
      }
      toStringReentryDepth += 1;
      try {
        if (secret === BRIDGE_TOKEN) {
          if (sources.has(this)) return { bridge: true, token: BRIDGE_TOKEN, nativeText: sources.get(this) };
          try {
            const inherited = originalToString.call(this, secret);
            if (inherited && typeof inherited === 'object' && inherited.bridge === true) return inherited;
          } catch (_) {}
        }
        if (typeof secret === 'string' && secret.length === 64 && secret !== BRIDGE_TOKEN) {
          try {
            const inherited = originalToString.call(this, ...args);
            if (inherited && inherited.bridge === true && inherited.token === secret) return inherited;
            if (typeof inherited === 'string') return sources.get(this) || inherited;
          } catch (_) {}
        }
        if (sources.has(this)) return sources.get(this);
        return originalToString.call(this, ...args);
      } finally {
        toStringReentryDepth -= 1;
      }
    };
    const patched = nativeLike(rawToString, originalToString, 'toString', 0);
    Object.defineProperty(Function.prototype, 'toString', { configurable: true, writable: true, value: patched });
  } catch (_) {}
  const replace = (proto, key, factory) => {
    try {
      if (!proto || typeof proto[key] !== 'function') return;
      const original = proto[key];
      const existing = inspectBridge(original);
      if (existing) {
        try { sources.set(original, existing.nativeText || ('function ' + (original.name || key) + '() { [native code] }')); } catch (_) {}
        return;
      }
      Object.defineProperty(proto, key, {
        configurable: true,
        enumerable: Object.getOwnPropertyDescriptor(proto, key)?.enumerable || false,
        writable: true,
        value: nativeLike(factory(original), original),
      });
    } catch (_) {}
  };
  try {
    const navProto = globalThis.WorkerNavigator?.prototype;
    if (navProto) {
      const navValues = {
        platform: CFG.platform,
        userAgent: CFG.userAgent,
        appVersion: CFG.appVersion,
        vendor: CFG.vendor,
        languages: Object.freeze([...(CFG.languages || [])]),
        language: (CFG.languages || [])[0] || 'en-US',
      };
      if (CFG.hardwareConcurrency != null) navValues.hardwareConcurrency = CFG.hardwareConcurrency;
      if (CFG.deviceMemory != null) navValues.deviceMemory = CFG.deviceMemory;
      for (const [key, value] of Object.entries(navValues)) {
        // Only members the build already exposes may be answered. WorkerNavigator does not carry
        // every Navigator member - vendor, for one, is window-only in this engine - and adding one
        // here leaves the worker with an own prototype member no stock build has, which is a single
        // getOwnPropertyNames() call away from identifying the profile.
        if (!(key in navProto)) continue;
        const getter = makeNativeWorkerGetter(key, () => value);
        try {
          Object.defineProperty(navProto, key, {
            configurable: true,
            enumerable: true,
            get: getter,
          });
        } catch (_) {}
      }
      // Self-contained judgement: the flags now come from the IIFE-top declarations, so this
      // read can no longer throw and swallow the whole estimate patch.
      const isIosPersona = CFG.os === "ios" || CFG.platform === "iPhone" || CFG.mobileDevice?.os === "ios" || (CFG.platform && /iphone|ipad|ipod/i.test(CFG.platform));
      const isAndroidPersona = CFG.os === "android" || CFG.mobileDevice?.os === "android" || (CFG.platform && /android/i.test(CFG.platform));
      if (isIosPersona) {
        try {
          if (typeof WorkerNavigator !== "undefined" && WorkerNavigator.prototype) {
            delete WorkerNavigator.prototype.userAgentData;
            delete WorkerNavigator.prototype.gpu;
            delete WorkerNavigator.prototype.deviceMemory;
          }
          if (typeof self !== "undefined" && self.navigator) {
            delete self.navigator.userAgentData;
            delete self.navigator.gpu;
            delete self.navigator.deviceMemory;
          }
          if (typeof self !== "undefined") {
            delete self.GPU;
            delete self.GPUAdapter;
            delete self.GPUDevice;
          }
        } catch (_) {}
      }
      const metadata = CFG.userAgentMetadata || {};
      const brands = Object.freeze((metadata.brands || []).map((item) => Object.freeze({ brand: String(item.brand), version: String(item.version) })));
      const fullVersionList = Object.freeze((metadata.fullVersionList || brands).map((item) => Object.freeze({ brand: String(item.brand), version: String(item.version) })));
      const uaDataState = {
        brands,
        fullVersionList,
        fullVersion: String(metadata.fullVersion || metadata.uaFullVersion || ''),
        platform: String(metadata.platform || ''),
        platformVersion: String(metadata.platformVersion || ''),
        architecture: String(metadata.architecture || ''),
        model: String(metadata.model || ''),
        mobile: Boolean(metadata.mobile),
        bitness: String(metadata.bitness ?? '64'),
        wow64: Boolean(metadata.wow64),
      };
      const uaDataStates = new WeakMap();
      const publicBrands = Object.freeze(brands.map((item) => ({ ...item })));
      const uaProto = globalThis.NavigatorUAData && globalThis.NavigatorUAData.prototype;
      const patchedUaAccessors = new Set();
      const patchedUaMethods = new Set();
      const ensureUaAccessor = (key) => {
        if (!uaProto || patchedUaAccessors.has(key)) return Boolean(uaProto);
        const descriptor = Object.getOwnPropertyDescriptor(uaProto, key);
        if (!descriptor || typeof descriptor.get !== 'function') return false;
        const nativeGet = descriptor.get;
        try {
          Object.defineProperty(uaProto, key, nativeAccessor(key, {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            get() {
              const state = uaDataStates.get(this);
              if (state) return key === 'brands' ? publicBrands : state[key];
              return nativeGet.call(this);
            },
            set: descriptor.set,
          }));
        } catch (_) { return false; }
        patchedUaAccessors.add(key);
        return true;
      };
      const ensureUaMethod = (key, serve) => {
        if (!uaProto || patchedUaMethods.has(key)) return Boolean(uaProto);
        const descriptor = Object.getOwnPropertyDescriptor(uaProto, key);
        if (!descriptor || typeof descriptor.value !== 'function') return false;
        const nativeMethod = descriptor.value;
        try {
          Object.defineProperty(uaProto, key, {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            writable: descriptor.writable,
            value: nativeLike(function (...args) {
              const state = uaDataStates.get(this);
              if (state) return serve.apply(this, args);
              return nativeMethod.apply(this, args);
            }, nativeMethod, key, nativeMethod.length),
          });
        } catch (_) { return false; }
        patchedUaMethods.add(key);
        return true;
      };
      const highEntropyValue = (state, hints) => {
        const all = {
          brands: state.brands,
          fullVersionList: state.fullVersionList,
          uaFullVersion: state.fullVersion,
          platform: state.platform,
          platformVersion: state.platformVersion,
          architecture: state.architecture,
          model: state.model,
          mobile: state.mobile,
          bitness: state.bitness,
          wow64: state.wow64,
        };
        const copy = (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' ? { ...item } : item) : value;
        const out = { brands: copy(state.brands), mobile: state.mobile, platform: state.platform };
        for (const hint of hints) if (Object.prototype.hasOwnProperty.call(all, hint)) out[hint] = copy(all[hint]);
        return out;
      };
      const serveHighEntropy = function getHighEntropyValues(hints) {
        try {
          const state = uaDataStates.get(this);
          if (!state) throw new TypeError('Illegal invocation');
          if (!arguments.length) throw new TypeError("Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': 1 argument required, but only 0 present.");
          if (hints === null || !['object', 'function'].includes(typeof hints)) throw new TypeError('The provided value cannot be converted to a sequence.');
          const iterator = hints[Symbol.iterator];
          if (typeof iterator !== 'function') throw new TypeError('The object must have a callable @@iterator property.');
          const values = Array.from({ [Symbol.iterator]: () => iterator.call(hints) }, (item) => {
            if (typeof item === 'symbol') throw new TypeError('Cannot convert a Symbol value to a string');
            return String(item);
          });
          return Promise.resolve(highEntropyValue(state, values));
        } catch (error) {
          stripStackFrame(error, serveHighEntropy, 'getHighEntropyValues');
          return Promise.reject(error);
        }
      };
      const serveUaJSON = function toJSON() {
        const state = uaDataStates.get(this);
        if (!state) throw new TypeError('Illegal invocation');
        return { brands: state.brands.map((item) => ({ ...item })), mobile: state.mobile, platform: state.platform };
      };
      const makeUaData = () => {
        const value = Object.create(uaProto || Object.prototype);
        uaDataStates.set(value, uaDataState);
        for (const key of ['brands', 'mobile', 'platform']) {
          if (!ensureUaAccessor(key)) {
            Object.defineProperty(value, key, { configurable: true, enumerable: true, value: key === 'brands' ? publicBrands : uaDataState[key] });
          }
        }
        if (!ensureUaMethod('getHighEntropyValues', serveHighEntropy)) {
          Object.defineProperty(value, 'getHighEntropyValues', {
            configurable: true, enumerable: true, writable: true,
            value: nativeLike(serveHighEntropy, null, 'getHighEntropyValues', 1),
          });
        }
        if (!ensureUaMethod('toJSON', serveUaJSON)) {
          Object.defineProperty(value, 'toJSON', {
            configurable: true, enumerable: true, writable: true,
            value: nativeLike(serveUaJSON, null, 'toJSON', 0),
          });
        }
        return value;
      };
      const uaData = makeUaData();
      try {
        // The member is secure-context gated, so a worker that does not have it here (an insecure
        // origin, an opaque document) must keep not having it.
        if ('userAgentData' in navProto) {
          Object.defineProperty(navProto, 'userAgentData', { configurable: true, enumerable: true, get: makeNativeWorkerGetter('userAgentData', () => uaData) });
        }
      } catch (_) {}
      // Only a phone profile can reach the page-side replacement path. Desktop profiles keep the
      // native object and only have its prototype members rewritten.
      try {
        const pageNavProto = MOBILE ? globalThis.Navigator?.prototype : null;
        if (pageNavProto) {
          if ('userAgentData' in pageNavProto) {
            Object.defineProperty(pageNavProto, 'userAgentData', nativeAccessor('userAgentData', { configurable: true, enumerable: true, get: () => uaData }));
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

`;
};
