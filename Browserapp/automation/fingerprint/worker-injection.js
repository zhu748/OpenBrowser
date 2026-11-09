'use strict';

/**
 * The worker-safe injection subset applied before attached workers are
 * resumed. Extracted verbatim from the former automation/fingerprint.js.
 */

// Shared CFG layer: the os/timezone/deviceMemory/webgl/stability computations the
// main-world builder (injection-script.js) also embeds live in injection-config.js so
// the two emitted CFGs cannot drift independently. Key order, key set and the
// intentionally divergent leaves (vendor, userAgentMetadata, webgpu, stability caps)
// stay in this file's literal — see the drift list in injection-config.js.
const { resolveInjectionStability, injectionOs, injectionTimezone, injectionDeviceMemory, injectionWebgl, stabilityNoiseAmplitude, stabilitySampleStepDivisor, stabilityMaxWidth, stabilityMaxHeight, stabilitySquare } = require('./injection-config');
const { canonicalBridgeToken } = require('./shared');


/** Worker-safe subset injected before attached workers are resumed. */
function buildWorkerInjectionScript(fp) {
  const bridgeToken = canonicalBridgeToken(fp);
  const stability = resolveInjectionStability(fp);
  const json = JSON.stringify({
    platform: fp.platform,
    // Mirrors the main-world CFG (injection-script.js): os/mobile/mobileDevice feed the worker's
    // platform guards (isIosPersona / isAndroidPersona / the UAData page-side replacement path).
    // Missing keys made those guards read undefined and silently skip the patches they gate.
    os: injectionOs(fp),
    mobile: Boolean(fp.mobile),
    mobileDevice: fp.mobileDevice || null,
    userAgent: fp.userAgent,
    appVersion: fp.uaProfile?.appVersion || String(fp.userAgent || '').replace(/^Mozilla\//, ''),
    // Intentionally divergent from the main-world CFG (injection-script.js adds the iOS
    // 'Apple Computer, Inc.' branch and a uaProfile.vendor fallback) — preserved as-is,
    // see the drift list in injection-config.js.
    vendor: fp.vendor || fp.uaProfile?.vendor || 'Google Inc.',
    // Intentionally divergent from the main-world CFG (main falls back to
    // fp.uaProfile?.metadata) — preserved as-is, see injection-config.js.
    userAgentMetadata: fp.userAgentMetadata,
    languages: fp.languages,
    timezone: injectionTimezone(fp),
    hardwareConcurrency: fp.hardwareConcurrency,
    // Pass persona's legal quantised tiers (0.25/0.5) through; snap illegal values to the
    // nearest step — same policy as the main-world script, shared in injection-config.js.
    deviceMemory: injectionDeviceMemory(fp),
    webgl: injectionWebgl(fp),
    // Intentionally divergent from the main-world CFG (main passes fp.webgpu || null
    // through unchanged; this side restructures to {mode, gpu} and synthesises a
    // webgl-gpu fallback) — preserved as-is, see injection-config.js.
    webgpu: fp.webgpu ? {
      mode: String(fp.webgpu.mode || 'real'),
      gpu: fp.webgpu.gpu || fp.webgl?.gpu || null,
    } : (fp.webgl?.gpu ? {
      mode: 'webgl',
      gpu: fp.webgl.gpu,
    } : null),
    canvas: fp.canvas,
    seed: fp.seed,
    stability: {
      active: Boolean(stability.active),
      mode: String(stability.mode || 'auto'),
      hosts: Array.isArray(stability.hosts) ? stability.hosts : [],
      skipHosts: Array.isArray(stability.skipHosts) ? stability.skipHosts : [],
      noiseAmplitude: stabilityNoiseAmplitude(stability),
      sampleStepDivisor: stabilitySampleStepDivisor(stability),
      maxWidth: stabilityMaxWidth(stability),
      maxHeight: stabilityMaxHeight(stability),
      square: stabilitySquare(stability),
    },
  });
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
  const stabilityActiveNow = () => {
    const st = CFG.stability || {};
    if (st.mode === 'force') return !listHasHost(st.skipHosts, currentHost());
    if (st.mode === 'off') return false;
    const host = currentHost();
    if (!host) return Boolean(st.active);
    if (listHasHost(st.skipHosts, host)) return false;
    if (listHasHost(st.hosts, host)) return true;
    return Boolean(st.active);
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
            workerLocks.set(key, locked);
          }
          for (let i = 0; i < locked.length; i += 1) {
            const item = locked[i];
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
        const isProto = (typeof WorkerNavigator !== 'undefined' && this === WorkerNavigator.prototype) ||
          (this && this.constructor && this.constructor.prototype === this) ||
          (this && Object.getPrototypeOf(this) === Object.prototype);
        const isWorkerNav = Boolean(
          this &&
          !isProto &&
          (typeof WorkerNavigator === 'undefined' || this !== WorkerNavigator.prototype) &&
          (
            this === (typeof navigator !== 'undefined' ? navigator : null) ||
            (typeof WorkerNavigator !== 'undefined' && (this instanceof WorkerNavigator || WorkerNavigator.prototype.isPrototypeOf(this))) ||
            (this.constructor && this.constructor.name === 'WorkerNavigator' && this !== this.constructor.prototype)
          )
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
              if (state) return state[key];
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
          fullVersion: state.fullVersion,
          uaFullVersion: state.fullVersion,
          platform: state.platform,
          platformVersion: state.platformVersion,
          architecture: state.architecture,
          model: state.model,
          mobile: state.mobile,
          bitness: state.bitness,
          wow64: state.wow64,
        };
        const out = { brands: state.brands, mobile: state.mobile, platform: state.platform };
        for (const hint of Array.isArray(hints) ? hints : []) if (hint in all) out[hint] = all[hint];
        return out;
      };
      const makeUaData = () => {
        const value = Object.create(uaProto || Object.prototype);
        uaDataStates.set(value, uaDataState);
        for (const key of ['brands', 'mobile', 'platform']) {
          if (!ensureUaAccessor(key)) {
            Object.defineProperty(value, key, { configurable: true, enumerable: true, value: uaDataState[key] });
          }
        }
        if (!ensureUaMethod('getHighEntropyValues', function getHighEntropyValues(hints) {
          return Promise.resolve(highEntropyValue(uaDataStates.get(this), hints));
        })) {
          Object.defineProperty(value, 'getHighEntropyValues', {
            configurable: true, enumerable: true, writable: true,
            value: function getHighEntropyValues(hints) { return Promise.resolve(highEntropyValue(uaDataState, hints)); },
          });
        }
        if (!ensureUaMethod('toJSON', function toJSON() {
          const state = uaDataStates.get(this) || uaDataState;
          return { brands: state.brands, mobile: state.mobile, platform: state.platform };
        })) {
          Object.defineProperty(value, 'toJSON', {
            configurable: true, enumerable: true, writable: true,
            value: function toJSON() { return { brands: uaDataState.brands, mobile: uaDataState.mobile, platform: uaDataState.platform }; },
          });
        }
        return value;
      };
      const uaData = makeUaData();
      try {
        // The member is secure-context gated, so a worker that does not have it here (an insecure
        // origin, an opaque document) must keep not having it.
        if ('userAgentData' in navProto) {
          Object.defineProperty(navProto, 'userAgentData', nativeAccessor('userAgentData', { configurable: true, enumerable: true, get: () => uaData }));
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

  // Same guard as the page copy: the engine may already be in the target zone, and re-implementing
  // the Date and Intl surfaces on top of a correct engine only adds differences.
  const engineReportsTargetZone = (() => {
    try {
      const want = new Intl.DateTimeFormat('en-US', { timeZone: String(CFG.timezone).trim() }).resolvedOptions().timeZone;
      return new Intl.DateTimeFormat().resolvedOptions().timeZone === want;
    } catch (_) { return false; }
  })();
  if (CFG.timezone && !engineReportsTargetZone) {
    try {
      const targetTz = String(CFG.timezone).trim();
      new Intl.DateTimeFormat('en-US', { timeZone: targetTz }).format();

      const OrigDateTimeFormat = Intl.DateTimeFormat;
      const DateTimeFormatProto = OrigDateTimeFormat.prototype;

      const origSetTime = Date.prototype.setTime;
      const origGetTzOffset = Date.prototype.getTimezoneOffset;
      const origGetTime = Date.prototype.getTime;
      // Native getTime is the brand check: a receiver that is not a Date has to throw exactly the
      // TypeError the engine throws rather than answer with a coerced value.
      const asDate = (self) => { origGetTime.call(self); return self; };
      // The zone offset for an instant comes straight from ICU numeric long-offset form. Rebuilding
      // the wall clock through Date.UTC is not equivalent: that route cannot represent years outside
      // 1..9999 or before the common era, and it drops the sub-minute offsets some zones had.
      const offsetFormatter = new OrigDateTimeFormat('en-US', { timeZone: targetTz, timeZoneName: 'longOffset' });
      const getOffsetMinutes = (date) => {
        try {
          const ts = date.getTime();
          if (isNaN(ts)) return NaN;
          const raw = (offsetFormatter.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || '').replace(/^GMT/, '');
          const m = raw.match(/^([+-])(\\d{1,2})(?::(\\d{2}))?(?::(\\d{2}))?$/);
          if (!m) return 0;
          const seconds = Number(m[2]) * 3600 + Number(m[3] || 0) * 60 + Number(m[4] || 0);
          return (m[1] === '-' ? 1 : -1) * (seconds / 60);
        } catch (_) {
          return 0;
        }
      };
      // ICU has no long zone name for every instant, while V8 still prints one: outside the modern
      // metazone range the long form degrades to a numeric offset. A reference instant in the same
      // standard/daylight state supplies the name V8 prints, chosen by nearest offset.
      const zoneNameRefs = (() => {
        const nameAt = (ms) => new OrigDateTimeFormat(undefined, { timeZone: targetTz, timeZoneName: 'long' })
          .formatToParts(new Date(ms)).find((p) => p.type === 'timeZoneName')?.value || '';
        const winter = Date.UTC(2026, 0, 15, 12);
        const summer = Date.UTC(2026, 6, 15, 12);
        return [{ offset: getOffsetMinutes(new Date(winter)), name: nameAt(winter) }, { offset: getOffsetMinutes(new Date(summer)), name: nameAt(summer) }];
      })();
      const zoneNameFor = (date) => {
        const name = new OrigDateTimeFormat(undefined, { timeZone: targetTz, timeZoneName: 'long' })
          .formatToParts(date).find((p) => p.type === 'timeZoneName')?.value || '';
        const offset = getOffsetMinutes(date);
        const exact = zoneNameRefs.find((ref) => ref.offset === offset);
        if (exact) return /^GMT/.test(name) ? (exact.name || name) : name;
        let best = zoneNameRefs[0];
        for (const ref of zoneNameRefs) if (Math.abs(ref.offset - offset) < Math.abs(best.offset - offset)) best = ref;
        return best.name || name;
      };

      const getLocalComponents = (date) => {
        const off = getOffsetMinutes(date);
        const shifted = new Date(date.getTime() - off * 60000);
        if (!isNaN(shifted.getTime())) return shifted;
        // ICU still answers at the domain edges, where the shifted instant is not representable, and
        // the wall clock there can itself sit past the Date domain, so the fields are handed back as
        // a read-only view instead of a Date that cannot exist.
        const parts = new OrigDateTimeFormat('en-US', {
          timeZone: targetTz, era: 'short', year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).formatToParts(date);
        const get = (type) => parts.find((p) => p.type === type)?.value || '';
        // Self-contained year read: the old branch referenced an undeclared identifier (numbered),
        // so any Date at the domain edge threw a ReferenceError through to the page here.
        const year = /BC/i.test(get('era')) ? 1 - parseInt(get('year'), 10) : parseInt(get('year'), 10);
        const month = parseInt(get('month'), 10) - 1;
        const day = parseInt(get('day'), 10);
        const hour = parseInt(get('hour'), 10) % 24;
        const minute = parseInt(get('minute'), 10);
        const second = parseInt(get('second'), 10);
        const millisecond = ((date.getTime() % 1000) + 1000) % 1000;
        const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
        const invalid = () => NaN;
        return {
          getUTCFullYear: () => year,
          getUTCMonth: () => month,
          getUTCDate: () => day,
          getUTCDay: () => weekday,
          getUTCHours: () => hour,
          getUTCMinutes: () => minute,
          getUTCSeconds: () => second,
          getUTCMilliseconds: () => millisecond,
          getTime: invalid,
          setUTCFullYear: invalid,
          setUTCMonth: invalid,
          setUTCDate: invalid,
          setUTCHours: invalid,
          setUTCMinutes: invalid,
          setUTCSeconds: invalid,
          setUTCMilliseconds: invalid,
        };
      };

      // Reading timeZone here would add an access the engine already makes, and copying the options
      // would read every other option a second time, so a prototype-chained copy carries the default
      // zone while the page options stay the only source for everything else. A null argument has to
      // reach the engine unchanged, because the TypeError it raises is part of the surface.
      const withDefaultTimeZone = (options) => {
        if (options === undefined) return { timeZone: targetTz };
        if (options === null) return options;
        const boxed = Object(options);
        const opts = Object.create(boxed);
        // The engine reads timeZone exactly once, so the substitute is a lazy accessor rather than a
        // value: it forwards to the page options on the engine read and answers the target zone when
        // the page left the option absent or undefined. Copying the options would instead read every
        // other option a second time.
        let read = false;
        let resolved = targetTz;
        Object.defineProperty(opts, 'timeZone', {
          enumerable: true,
          configurable: true,
          get() {
            if (!read) {
              read = true;
              const fromPage = boxed.timeZone;
              resolved = fromPage === undefined ? targetTz : fromPage;
            }
            return resolved;
          },
        });
        return opts;
      };
      const PatchedDateTimeFormat = function DateTimeFormat(locales, options) {
        const opts = withDefaultTimeZone(options);
        if (!(this instanceof PatchedDateTimeFormat)) {
          return Reflect.construct(OrigDateTimeFormat, [locales, opts]);
        }
        return Reflect.construct(OrigDateTimeFormat, [locales, opts], new.target);
      };
      Object.defineProperty(PatchedDateTimeFormat, 'prototype', {
        value: DateTimeFormatProto,
        writable: false,
        enumerable: false,
        configurable: false,
      });
      // Without this the prototype's constructor still points at the original, so the one-line
      // check Intl.DateTimeFormat.prototype.constructor === Intl.DateTimeFormat returns false.
      try {
        Object.defineProperty(DateTimeFormatProto, 'constructor', {
          configurable: true, writable: true, enumerable: false, value: PatchedDateTimeFormat,
        });
      } catch (_) {}
      if (OrigDateTimeFormat.supportedLocalesOf) {
        PatchedDateTimeFormat.supportedLocalesOf = nativeLike(
          function supportedLocalesOf(...args) { return OrigDateTimeFormat.supportedLocalesOf.apply(OrigDateTimeFormat, args); },
          OrigDateTimeFormat.supportedLocalesOf,
          'supportedLocalesOf',
          1
        );
      }
      nativeLike(PatchedDateTimeFormat, OrigDateTimeFormat, 'DateTimeFormat', 0, true);
      Intl.DateTimeFormat = PatchedDateTimeFormat;

      replace(Date.prototype, 'getTimezoneOffset', () => function getTimezoneOffset() {
        const minutes = getOffsetMinutes(asDate(this));
        if (!isFinite(minutes)) return NaN;
        const whole = Math.trunc(minutes);
        return whole === 0 ? 0 : whole;
      });

      const formatTzDate = (date) => {
        try {
          // en-US on purpose: the weekday and month abbreviations V8 prints are fixed English,
          // while the zone name in the parenthetical follows the default locale (zoneNameFor).
          const parts = new OrigDateTimeFormat('en-US', {
            timeZone: targetTz,
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZoneName: 'long'
          }).formatToParts(date);
          const get = (type) => parts.find(p => p.type === type)?.value || '';
          const weekday = get('weekday');
          const month = get('month');
          const day = get('day');
          const localYear = getLocalComponents(date).getUTCFullYear();
          const year = localYear < 0 ? '-' + String(-localYear).padStart(4, '0') : String(localYear).padStart(4, '0');
          const hour = (get('hour') === '24' ? '00' : get('hour')).padStart(2, '0');
          const minute = get('minute').padStart(2, '0');
          const second = get('second').padStart(2, '0');
          const tzName = zoneNameFor(date);
          const diffMins = getOffsetMinutes(date);
          const sign = diffMins <= 0 ? '+' : '-';
          const absMins = Math.trunc(Math.abs(diffMins));
          const offH = String(Math.floor(absMins / 60)).padStart(2, '0');
          const offM = String(absMins % 60).padStart(2, '0');
          const gmt = 'GMT' + sign + offH + offM;
          return weekday + ' ' + month + ' ' + day + ' ' + year + ' ' + hour + ':' + minute + ':' + second + ' ' + gmt + ' (' + tzName + ')';
        } catch (_) {
          return date.toISOString();
        }
      };

      replace(Date.prototype, 'toString', () => function toString() {
        if (isNaN(asDate(this).getTime())) return 'Invalid Date';
        return formatTzDate(this);
      });

      replace(Date.prototype, 'toTimeString', () => function toTimeString() {
        if (isNaN(asDate(this).getTime())) return 'Invalid Date';
        const full = formatTzDate(this);
        const match = full.match(/[0-9]{4}[ ]+(.*)/);
        return match ? match[1] : full;
      });

      replace(Date.prototype, 'toDateString', () => function toDateString() {
        if (isNaN(asDate(this).getTime())) return 'Invalid Date';
        const full = formatTzDate(this);
        return full.split(' ').slice(0, 4).join(' ');
      });

      replace(Date.prototype, 'toLocaleString', (orig) => function toLocaleString(locales, options) {
        const opts = options && options.timeZone ? options : Object.assign({}, options, { timeZone: targetTz });
        return orig.call(this, locales, opts);
      });

      replace(Date.prototype, 'toLocaleDateString', (orig) => function toLocaleDateString(locales, options) {
        const opts = options && options.timeZone ? options : Object.assign({}, options, { timeZone: targetTz });
        return orig.call(this, locales, opts);
      });

      replace(Date.prototype, 'toLocaleTimeString', (orig) => function toLocaleTimeString(locales, options) {
        const opts = options && options.timeZone ? options : Object.assign({}, options, { timeZone: targetTz });
        return orig.call(this, locales, opts);
      });

      replace(Date.prototype, 'getHours', () => function getHours() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCHours();
      });

      replace(Date.prototype, 'getDate', () => function getDate() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCDate();
      });

      replace(Date.prototype, 'getDay', () => function getDay() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCDay();
      });

      replace(Date.prototype, 'getFullYear', () => function getFullYear() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCFullYear();
      });

      replace(Date.prototype, 'getMonth', () => function getMonth() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCMonth();
      });

      replace(Date.prototype, 'getMinutes', () => function getMinutes() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCMinutes();
      });

      replace(Date.prototype, 'getSeconds', () => function getSeconds() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCSeconds();
      });

      replace(Date.prototype, 'getMilliseconds', () => function getMilliseconds() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCMilliseconds();
      });

      replace(Date.prototype, 'getYear', () => function getYear() {
        if (isNaN(asDate(this).getTime())) return NaN;
        return getLocalComponents(this).getUTCFullYear() - 1900;
      });

      // Local-time setters must land in the spoofed zone too. Reading a component through the
      // patched getters while writing it through the host zone leaves the two disagreeing,
      // which is a stronger signal than not spoofing at all.
      const setLocal = (self, mutate) => {
        if (isNaN(asDate(self).getTime())) return NaN;
        const shifted = getLocalComponents(self);
        mutate(shifted);
        // Resolve the offset twice: the write may have crossed a DST boundary.
        let guess = shifted.getTime() + getOffsetMinutes(self) * 60000;
        guess = shifted.getTime() + getOffsetMinutes(new Date(guess)) * 60000;
        return origSetTime.call(self, guess);
      };
      replace(Date.prototype, 'setFullYear', () => function setFullYear(y, m, d) {
        return setLocal(this, (x) => {
          x.setUTCFullYear(y);
          if (m !== undefined) x.setUTCMonth(m);
          if (d !== undefined) x.setUTCDate(d);
        });
      });
      replace(Date.prototype, 'setMonth', () => function setMonth(m, d) {
        return setLocal(this, (x) => { x.setUTCMonth(m); if (d !== undefined) x.setUTCDate(d); });
      });
      replace(Date.prototype, 'setDate', () => function setDate(d) {
        return setLocal(this, (x) => x.setUTCDate(d));
      });
      replace(Date.prototype, 'setHours', () => function setHours(h, mi, sec, ms) {
        return setLocal(this, (x) => {
          x.setUTCHours(h);
          if (mi !== undefined) x.setUTCMinutes(mi);
          if (sec !== undefined) x.setUTCSeconds(sec);
          if (ms !== undefined) x.setUTCMilliseconds(ms);
        });
      });
      replace(Date.prototype, 'setMinutes', () => function setMinutes(mi, sec, ms) {
        return setLocal(this, (x) => {
          x.setUTCMinutes(mi);
          if (sec !== undefined) x.setUTCSeconds(sec);
          if (ms !== undefined) x.setUTCMilliseconds(ms);
        });
      });
      replace(Date.prototype, 'setSeconds', () => function setSeconds(sec, ms) {
        return setLocal(this, (x) => { x.setUTCSeconds(sec); if (ms !== undefined) x.setUTCMilliseconds(ms); });
      });
      replace(Date.prototype, 'setMilliseconds', () => function setMilliseconds(ms) {
        return setLocal(this, (x) => x.setUTCMilliseconds(ms));
      });

      // new Date(y, m, d, ...) and Date.parse('2026-01-15 12:00:00') are defined against the
      // *local* zone. Left alone they resolve against the host zone while every getter above
      // reports the spoofed one, so a two-line script recovers the real timezone.
      try {
        const OrigDate = Date;
        const localToUtc = (ms) => {
          if (isNaN(ms)) return NaN;
          // getOffsetMinutes keeps the JS sign convention (UTC+05:30 reports -330), so shifting
          // a wall-clock reading in the spoofed zone back to a real instant means adding it.
          let out = ms + getOffsetMinutes(new OrigDate(ms)) * 60000;
          out = ms + getOffsetMinutes(new OrigDate(out)) * 60000;
          return out;
        };
        // Matches ES2015+ "date-time forms without a timezone offset", which parse as local.
        const NO_TZ = new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}(:[0-9]{2}([.][0-9]+)?)?$');
        const parseLocal = (value) => {
          const raw = OrigDate.parse(value);
          if (isNaN(raw)) return raw;
          if (!NO_TZ.test(String(value).trim())) return raw;
          // OrigDate.parse resolved these fields against the host zone. Undo that with the
          // engine's own offset, then re-apply the spoofed zone's.
          const undo = raw - origGetTzOffset.call(new OrigDate(raw)) * 60000;
          return localToUtc(undo);
        };
        const PatchedDate = function Date(...args) {
          if (!new.target) return OrigDate();
          if (args.length === 0) return Reflect.construct(OrigDate, [], new.target);
          if (args.length === 1) {
            const only = args[0];
            if (typeof only === 'string') {
              return Reflect.construct(OrigDate, [parseLocal(only)], new.target);
            }
            return Reflect.construct(OrigDate, args, new.target);
          }
          // Interpret the fields as wall-clock time in the *spoofed* zone. Letting the engine
          // parse them first would apply the host zone's offset, which the correction below
          // would then apply a second time.
          const y = Number(args[0]);
          // undefined means "default"; anything else is coerced the way the engine would, so a NaN
          // field leaves the whole date Invalid instead of folding to 0.
          const field = (value, fallback) => (value === undefined ? fallback : Number(value));
          const wall = OrigDate.UTC(
            y >= 0 && y <= 99 ? y + 1900 : y,
            field(args[1], 0),
            field(args[2], 1),
            field(args[3], 0),
            field(args[4], 0),
            field(args[5], 0),
            field(args[6], 0)
          );
          return Reflect.construct(OrigDate, [localToUtc(wall)], new.target);
        };
        Object.defineProperty(PatchedDate, 'prototype', {
          value: OrigDate.prototype,
          writable: false,
          enumerable: false,
          configurable: false,
        });
        try {
          Object.defineProperty(OrigDate.prototype, 'constructor', {
            configurable: true, writable: true, enumerable: false, value: PatchedDate,
          });
        } catch (_) {}
        PatchedDate.now = OrigDate.now;
        PatchedDate.parse = nativeLike(
          function parse(value) { return parseLocal(value); },
          OrigDate.parse, 'parse', 1
        );
        PatchedDate.UTC = OrigDate.UTC;
        nativeLike(PatchedDate, OrigDate, 'Date', 7, true);
        globalThis.Date = PatchedDate;
      } catch (_) {}
    } catch (_) {}
  }
  const canvasMark = Number(CFG.canvas?.mark) || 1;
  if (CFG.canvas?.mode === 'blocked') {
    const deny = () => { throw new DOMException('Canvas reading is disabled by permissions policy', 'SecurityError'); };
    replace(globalThis.OffscreenCanvasRenderingContext2D?.prototype, 'getImageData', () => deny);
    replace(globalThis.OffscreenCanvas?.prototype, 'convertToBlob', () => function() {
      return Promise.reject(new DOMException('Canvas reading is disabled by permissions policy', 'SecurityError'));
    });
  } else if (CFG.canvas?.mode === 'noise') {
    replace(globalThis.OffscreenCanvasRenderingContext2D?.prototype, 'getImageData', (original) => function(...args) {
      return applyNoise(original.apply(this, args), canvasMark);
    });
    replace(globalThis.OffscreenCanvas?.prototype, 'convertToBlob', (original) => async function convertToBlob(options) {
      const blob = await original.call(this, options);
      try {
        const w = Number(this.width) || 0;
        const h = Number(this.height) || 0;
        if (w <= 0 || h <= 0) return blob;
        const bitmap = await createImageBitmap(blob);
        const copy = new OffscreenCanvas(w, h);
        const context = copy.getContext('2d');
        if (!context) return blob;
        context.drawImage(bitmap, 0, 0);
        bitmap.close?.();
        const image = context.getImageData(0, 0, copy.width, copy.height);
        context.putImageData(image, 0, 0);
        return original.call(copy, options);
      } catch (_) { return blob; }
    });
  }
  if (CFG.webgl?.mode === 'blocked') {
    replace(globalThis.OffscreenCanvas?.prototype, 'getContext', (original) => function(type, ...rest) {
      const value = String(type || '');
      if (value.includes('webgl') || value === 'experimental-webgl') return null;
      return original.call(this, type, ...rest);
    });
  } else if (CFG.webgl && (CFG.webgl.mode === 'noise' || (CFG.webgl.metaMode && CFG.webgl.metaMode !== 'real'))) {
    const mark = Number(CFG.webgl?.mark) || 1;
    const metaMode = String(CFG.webgl?.metaMode || 'noise');
    const pixelNoise = CFG.webgl.mode === 'noise';
    const enabledDebugExts = new WeakSet();
    const precisionOverridesMap = new WeakMap();
    const patchPrecisionFormatProto = (proto) => {
      if (!proto) return;
      for (const prop of ['rangeMin', 'rangeMax', 'precision']) {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (desc && typeof desc.get === 'function') {
          const nativeGet = desc.get;
          Object.defineProperty(proto, prop, {
            configurable: desc.configurable,
            enumerable: desc.enumerable,
            get: nativeLike(function () {
              const custom = precisionOverridesMap.get(this);
              if (custom && typeof custom[prop] === 'number') {
                return custom[prop];
              }
              return nativeGet.call(this);
            }, nativeGet, 'get ' + prop, 0),
            set: desc.set,
          });
        }
      }
    };
    if (typeof WebGLShaderPrecisionFormat !== 'undefined' && WebGLShaderPrecisionFormat.prototype) {
      patchPrecisionFormatProto(WebGLShaderPrecisionFormat.prototype);
    }
    const targetGpuVendor = (() => {
      const gv = String(CFG.webgl?.gpu?.vendor || '').toLowerCase();
      if (gv) return gv;
      const v = String(CFG.webgl?.vendor || '').toLowerCase();
      const r = String(CFG.webgl?.renderer || '').toLowerCase();
      if (v.includes('nvidia') || r.includes('nvidia')) return 'nvidia';
      if (v.includes('amd') || v.includes('ati') || r.includes('amd') || r.includes('radeon')) return 'amd';
      if (v.includes('intel') || r.includes('intel')) return 'intel';
      if (v.includes('apple') || r.includes('apple')) return 'apple';
      return '';
    })();
    const isDisallowedVendorExtension = (name) => {
      if (!targetGpuVendor || metaMode === 'real') return false;
      const lower = String(name || '').toLowerCase();
      if (lower.startsWith('nv_') && targetGpuVendor !== 'nvidia') return true;
      if (lower.startsWith('amd_') && targetGpuVendor !== 'amd') return true;
      if (lower.startsWith('intel_') && targetGpuVendor !== 'intel') return true;
      if (lower.startsWith('qcom_') && targetGpuVendor !== 'qualcomm') return true;
      return false;
    };
    const patch = (proto) => {
      if (!proto) return;
      if (metaMode !== 'real') {
        if (proto.getParameter) {
          replace(proto, 'getParameter', (original) => function(param) {
            const UNMASKED_VENDOR_WEBGL = 0x9245;
            const UNMASKED_RENDERER_WEBGL = 0x9246;
            if (param === UNMASKED_VENDOR_WEBGL || param === UNMASKED_RENDERER_WEBGL) {
              if (!enabledDebugExts.has(this)) {
                // Conforms to real Chrome: without WEBGL_debug_renderer_info, native returns null and sets INVALID_ENUM
                return original.apply(this, arguments);
              }
              if (param === UNMASKED_VENDOR_WEBGL) return metaMode === 'blocked' ? '' : CFG.webgl.vendor;
              if (param === UNMASKED_RENDERER_WEBGL) return metaMode === 'blocked' ? '' : CFG.webgl.renderer;
            }
            const limits = CFG.webgl && CFG.webgl.limits;
            if (limits) {
              if (param === 0x0d3a) {
                const native = original.apply(this, arguments);
                const side = Number(limits[0x84e8]) || 0;
                if (side && native && native.length === 2) {
                  const out = new native.constructor(2);
                  out[0] = side; out[1] = side;
                  return out;
                }
                return native;
              }
              if (param === 0x846d) {
                const native = original.apply(this, arguments);
                const maxPoint = Number(limits[0x846d]) || 0;
                if (maxPoint && native && native.length === 2) {
                  const out = new native.constructor(2);
                  out[0] = native[0] || 1;
                  out[1] = maxPoint;
                  return out;
                }
                return native;
              }
              const isWebgl2 = typeof WebGL2RenderingContext !== 'undefined' && (this instanceof WebGL2RenderingContext);
              const WEBGL2_PARAM_KEYS = [0x8a30, 0x8a34, 0x8a2b, 0x8a2d];
              if (WEBGL2_PARAM_KEYS.includes(param)) {
                if (isWebgl2) return limits[param];
                return original.apply(this, arguments);
              }
              if (Object.prototype.hasOwnProperty.call(limits, param)) return limits[param];
            }
            return original.apply(this, arguments);
          });
        }
        if (proto.getShaderPrecisionFormat) {
          replace(proto, 'getShaderPrecisionFormat', (original) => function(shaderType, precisionType) {
            const fmt = original.apply(this, arguments);
            if (!fmt) return null;

            const osName = String(CFG.os || '').toLowerCase();
            const isMobilePersona = Boolean(CFG.mobile) || osName === 'android' || osName === 'ios'
              || (CFG.platform && /Android|iPhone|iPad/i.test(CFG.platform))
              || (CFG.webgl?.gpu?.vendor && /qualcomm|arm/i.test(CFG.webgl.gpu.vendor));

            let target = null;
            if (isMobilePersona) {
              if (precisionType === 0x8df1 || precisionType === 0x8df0) {
                target = { rangeMin: 14, rangeMax: 14, precision: 10 };
              } else if (precisionType === 0x8df2) {
                target = { rangeMin: 127, rangeMax: 127, precision: 23 };
              } else if (precisionType === 0x8df3 || precisionType === 0x8df4) {
                target = { rangeMin: 15, rangeMax: 14, precision: 0 };
              } else if (precisionType === 0x8df5) {
                target = { rangeMin: 31, rangeMax: 30, precision: 0 };
              }
            } else {
              if (precisionType === 0x8df0 || precisionType === 0x8df1 || precisionType === 0x8df2) {
                target = { rangeMin: 127, rangeMax: 127, precision: 23 };
              } else if (precisionType === 0x8df3 || precisionType === 0x8df4 || precisionType === 0x8df5) {
                target = { rangeMin: 31, rangeMax: 30, precision: 0 };
              }
            }

            if (target) {
              precisionOverridesMap.set(fmt, target);
            }
            return fmt;
          });
        }
      }
      if (proto.getExtension) {
        replace(proto, 'getExtension', (original) => function(name) {
          const extName = String(name || '').toLowerCase();
          if (metaMode === 'blocked' && extName === 'webgl_debug_renderer_info') return null;
          if (isDisallowedVendorExtension(extName)) return null;
          let ext = original.apply(this, arguments);
          if (extName === 'webgl_debug_renderer_info') {
            if (!ext && metaMode !== 'blocked' && metaMode !== 'real' && (CFG.webgl?.vendor || CFG.webgl?.renderer)) {
              const debugProto = typeof WebGLDebugRendererInfo !== 'undefined' ? WebGLDebugRendererInfo.prototype : Object.prototype;
              ext = Object.create(debugProto);
              Object.defineProperty(ext, 'UNMASKED_VENDOR_WEBGL', { value: 0x9245, enumerable: true, writable: false, configurable: false });
              Object.defineProperty(ext, 'UNMASKED_RENDERER_WEBGL', { value: 0x9246, enumerable: true, writable: false, configurable: false });
            }
            if (ext) enabledDebugExts.add(this);
          }
          return ext;
        });
      }
      if (proto.getSupportedExtensions) {
        replace(proto, 'getSupportedExtensions', (original) => function() {
          let list = original.apply(this, arguments);
          if (!Array.isArray(list)) return list;
          if (metaMode === 'blocked') {
            list = list.filter((ext) => String(ext).toLowerCase() !== 'webgl_debug_renderer_info');
          } else if (metaMode !== 'real' && (CFG.webgl?.vendor || CFG.webgl?.renderer)) {
            if (!list.some((ext) => String(ext).toLowerCase() === 'webgl_debug_renderer_info')) {
              list = [...list, 'WEBGL_debug_renderer_info'];
            }
          }
          list = list.filter((ext) => !isDisallowedVendorExtension(ext));
          return list;
        });
      }
      if (!pixelNoise || !proto.readPixels) return;
      replace(proto, 'readPixels', (original) => function(...args) {
        const result = original.apply(this, args);
        try {
          const pixels = args[6];
          if (pixels && pixels.length && (pixels instanceof Uint8Array || pixels instanceof Uint8ClampedArray)) {
            let hasNonZero = false;
            for (let i = 0; i < pixels.length; i += 32) {
              if (pixels[i] !== 0) { hasNonZero = true; break; }
            }
            if (!hasNonZero) return result;

            const ampW = noiseAmplitudeNow();
            const stepDiv = sampleStepDivisorNow();
            const step2 = Math.max(4, Math.floor(pixels.length / stepDiv));
            for (let i = 0; pixels && i < pixels.length; i += step2) {
              const alphaIdx = i - (i % 4) + 3;
              if (alphaIdx < pixels.length && pixels[alphaIdx] === 0) continue;
              const n = Math.floor(noise(i + mark) * ampW) - Math.floor(ampW / 2);
              pixels[i] = Math.max(0, Math.min(255, (pixels[i] || 0) + n));
            }
          }
        } catch (_) {}
        return result;
      });
    };
    patch(globalThis.WebGLRenderingContext?.prototype);
    patch(globalThis.WebGL2RenderingContext?.prototype);
  }
  // DedicatedWorker WebGPU adapter surface parity
  if (CFG.webgpu) {
    try {
      const gpuMode = String(CFG.webgpu.mode || "real");
      const navGpu = (() => { try { return navigator.gpu || null; } catch (_) { return null; } })();
      const gpuProto = (typeof GPU !== 'undefined' && GPU.prototype) || (navGpu && Object.getPrototypeOf(navGpu));

      const gpuInfo = CFG.webgpu.gpu && (CFG.webgpu.gpu.vendor || CFG.webgpu.gpu.architecture)
        ? {
          vendor: String(CFG.webgpu.gpu.vendor || ""),
          architecture: String(CFG.webgpu.gpu.architecture || ""),
          device: String(CFG.webgpu.gpu.device || ""),
          description: String(CFG.webgpu.gpu.description || CFG.webgpu.gpu.architecture || ""),
        }
        : null;

      if (gpuMode === "blocked" && gpuProto) {
        replace(gpuProto, 'requestAdapter', (origReq) => async function requestAdapter(...args) {
          if (typeof origReq === 'function') {
            try {
              await origReq.apply(this, args);
            } catch (err) {
              if (err instanceof TypeError) throw err;
            }
          }
          return null;
        });
      } else if (gpuMode === "webgl" && gpuInfo && gpuProto) {
        const infoOverrides = new WeakMap();
        const adapterInfos = new WeakMap();
        const featuresMap = new WeakMap();
        const limitsMap = new WeakMap();
        const patchedInfoKeys = new Set();
        let patchedFeaturesProto = false;
        let patchedLimitsProto = false;
        let adapterProtoPatched = false;

        const targetVendor = String(gpuInfo.vendor || '').toLowerCase().trim();
        const targetArch = String(gpuInfo.architecture || '').toLowerCase().trim();
        const disallowedFeatures = new Set();
        if (targetVendor === 'intel' || targetVendor === 'nvidia' || targetVendor === 'amd') {
          disallowedFeatures.add('texture-compression-astc');
          disallowedFeatures.add('texture-compression-etc2');
          if (targetVendor === 'intel' && (targetArch.includes('gen9') || targetArch.includes('gen7') || targetArch.includes('gen11') || targetArch.includes('gen-9') || targetArch.includes('gen-7'))) {
            disallowedFeatures.add('shader-f16');
            disallowedFeatures.add('subgroups-f16');
          }
        } else if (targetVendor === 'qualcomm' || targetVendor === 'arm' || targetVendor === 'samsung') {
          disallowedFeatures.add('texture-compression-bc');
        }

        const getFamilyLimits = (vendor, arch) => {
          const v = String(vendor || '').toLowerCase().trim();
          if (v === 'nvidia' || v === 'amd') {
            return {
              maxTextureDimension1D: 16384,
              maxTextureDimension2D: 16384,
              maxTextureDimension3D: 2048,
              maxTextureArrayLayers: 2048,
              maxBufferSize: 2147483648,
              maxStorageBufferBindingSize: 2147483648,
              minUniformBufferOffsetAlignment: 256,
              minStorageBufferOffsetAlignment: 256,
              maxComputeWorkgroupStorageSize: 32768,
              maxComputeInvocationsPerWorkgroup: 1024,
              maxComputeWorkgroupSizeX: 1024,
              maxComputeWorkgroupSizeY: 1024,
              maxComputeWorkgroupSizeZ: 64,
            };
          }
          if (v === 'intel' || v === 'apple') {
            return {
              maxTextureDimension1D: 16384,
              maxTextureDimension2D: 16384,
              maxTextureDimension3D: 2048,
              maxTextureArrayLayers: 2048,
              maxBufferSize: 2147483648,
              maxStorageBufferBindingSize: 1073741824,
              minUniformBufferOffsetAlignment: 256,
              minStorageBufferOffsetAlignment: 256,
              maxComputeWorkgroupStorageSize: 32768,
              maxComputeInvocationsPerWorkgroup: 1024,
              maxComputeWorkgroupSizeX: 1024,
              maxComputeWorkgroupSizeY: 1024,
              maxComputeWorkgroupSizeZ: 64,
            };
          }
          if (v === 'qualcomm' || v === 'arm') {
            return {
              maxTextureDimension1D: 8192,
              maxTextureDimension2D: 8192,
              maxTextureDimension3D: 2048,
              maxTextureArrayLayers: 2048,
              maxBufferSize: 268435456,
              maxStorageBufferBindingSize: 134217728,
              minUniformBufferOffsetAlignment: 256,
              minStorageBufferOffsetAlignment: 256,
              maxComputeWorkgroupStorageSize: 16384,
              maxComputeInvocationsPerWorkgroup: 256,
              maxComputeWorkgroupSizeX: 256,
              maxComputeWorkgroupSizeY: 256,
              maxComputeWorkgroupSizeZ: 64,
            };
          }
          return {};
        };

        const resolveLimits = (hostLimits) => {
          const familyLimits = getFamilyLimits(gpuInfo.vendor, gpuInfo.architecture);
          const out = {};
          for (const [k, famVal] of Object.entries(familyLimits)) {
            try {
              const hostVal = hostLimits[k];
              if (typeof hostVal === 'number') {
                if (k.startsWith('min')) {
                  out[k] = Math.max(famVal, hostVal);
                } else {
                  out[k] = Math.min(famVal, hostVal);
                }
              }
            } catch (_) {}
          }
          return out;
        };

        const patchInfoAccessors = (iProto) => {
          if (!iProto) return;
          for (const key of Object.keys(gpuInfo)) {
            if (patchedInfoKeys.has(key)) continue;
            const desc = Object.getOwnPropertyDescriptor(iProto, key);
            if (!desc || typeof desc.get !== 'function') continue;
            const natGet = desc.get;
            Object.defineProperty(iProto, key, {
              configurable: desc.configurable,
              enumerable: desc.enumerable,
              get: nativeLike(function adapterInfoValue() {
                const val = infoOverrides.get(this);
                if (val && Object.prototype.hasOwnProperty.call(val, key)) return val[key];
                return natGet.call(this);
              }, natGet, 'get ' + key, 0),
              set: desc.set,
            });
            patchedInfoKeys.add(key);
          }
        };

        const patchFeaturesAccessors = (fProto) => {
          if (!fProto || patchedFeaturesProto) return;
          patchedFeaturesProto = true;
          const sizeDesc = Object.getOwnPropertyDescriptor(fProto, 'size');
          if (sizeDesc && typeof sizeDesc.get === 'function') {
            const natSizeGet = sizeDesc.get;
            Object.defineProperty(fProto, 'size', {
              configurable: sizeDesc.configurable,
              enumerable: sizeDesc.enumerable,
              get: nativeLike(function size() {
                natSizeGet.call(this);
                const filtered = featuresMap.get(this);
                return filtered ? filtered.size : natSizeGet.call(this);
              }, natSizeGet, 'get size', 0),
              set: sizeDesc.set,
            });
          }
          if (typeof fProto.has === 'function') {
            const natHas = fProto.has;
            const hasMethod = nativeLike(function has(key) {
              natHas.call(this, key);
              const filtered = featuresMap.get(this);
              if (filtered) return filtered.has(String(key));
              return natHas.call(this, key);
            }, natHas, 'has', 1);
            Object.defineProperty(fProto, 'has', {
              configurable: true,
              enumerable: true,
              writable: true,
              value: hasMethod,
            });
          }
          const wrapIter = (key, makeIter) => {
            if (typeof fProto[key] === 'function') {
              const natFn = fProto[key];
              const method = nativeLike(function (...args) {
                natFn.apply(this, args);
                const filtered = featuresMap.get(this);
                if (filtered) return makeIter(filtered);
                return natFn.apply(this, args);
              }, natFn, key, natFn.length);
              Object.defineProperty(fProto, key, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: method,
              });
            }
          };
          wrapIter('entries', (f) => f.entries());
          wrapIter('keys', (f) => f.keys());
          wrapIter('values', (f) => f.values());
          if (typeof Symbol !== 'undefined' && Symbol.iterator && typeof fProto[Symbol.iterator] === 'function') {
            const natSym = fProto[Symbol.iterator];
            const symMethod = nativeLike(function () {
              natSym.call(this);
              const filtered = featuresMap.get(this);
              if (filtered) return filtered[Symbol.iterator]();
              return natSym.call(this);
              // Do NOT rename or re-arity this wrapper: a Blink setlike prototype exposes
              // Symbol.iterator as the very same values function object, so the native
              // name/length are part of the observable surface. Overriding them would make the
              // prototype signature differ from an un-injected build.
            }, natSym);
            Object.defineProperty(fProto, Symbol.iterator, {
              configurable: true,
              enumerable: false,
              writable: true,
              value: symMethod,
            });
          }
          if (typeof fProto.forEach === 'function') {
            const natForEach = fProto.forEach;
            const forEachMethod = nativeLike(function forEach(callback, thisArg) {
              natForEach.call(this, () => {});
              const filtered = featuresMap.get(this);
              if (filtered) {
                for (const val of filtered) {
                  callback.call(thisArg, val, val, this);
                }
                return;
              }
              return natForEach.apply(this, arguments);
            }, natForEach, 'forEach', 1);
            Object.defineProperty(fProto, 'forEach', {
              configurable: true,
              enumerable: true,
              writable: true,
              value: forEachMethod,
            });
          }
        };

        const patchLimitsAccessors = (lProto) => {
          if (!lProto || patchedLimitsProto) return;
          patchedLimitsProto = true;
          const props = Object.getOwnPropertyNames(lProto);
          for (const key of props) {
            if (key === 'constructor') continue;
            const desc = Object.getOwnPropertyDescriptor(lProto, key);
            if (!desc || typeof desc.get !== 'function') continue;
            const natGet = desc.get;
            Object.defineProperty(lProto, key, {
              configurable: desc.configurable,
              enumerable: desc.enumerable,
              get: nativeLike(function () {
                natGet.call(this);
                const custom = limitsMap.get(this);
                if (custom && Object.prototype.hasOwnProperty.call(custom, key)) {
                  return custom[key];
                }
                return natGet.call(this);
              }, natGet, 'get ' + key, 0),
              set: desc.set,
            });
          }
        };

        const patchAdapterProto = (aProto) => {
          if (adapterProtoPatched || !aProto) return;
          adapterProtoPatched = true;
          const infoDesc = Object.getOwnPropertyDescriptor(aProto, 'info');
          if (infoDesc && typeof infoDesc.get === 'function') {
            const natInfoGet = infoDesc.get;
            Object.defineProperty(aProto, 'info', {
              configurable: infoDesc.configurable,
              enumerable: infoDesc.enumerable,
              get: nativeLike(function info() {
                const spoofed = adapterInfos.get(this);
                return spoofed || natInfoGet.call(this);
              }, natInfoGet, 'get info', 0),
              set: infoDesc.set,
            });
          }

          const featuresDesc = Object.getOwnPropertyDescriptor(aProto, 'features');
          if (featuresDesc && typeof featuresDesc.get === 'function') {
            const natFeaturesGet = featuresDesc.get;
            Object.defineProperty(aProto, 'features', {
              configurable: featuresDesc.configurable,
              enumerable: featuresDesc.enumerable,
              get: nativeLike(function features() {
                const f = natFeaturesGet.call(this);
                if (f && !featuresMap.has(f)) {
                  const allowed = new Set();
                  try {
                    for (const item of f) {
                      if (!disallowedFeatures.has(item)) allowed.add(item);
                    }
                  } catch (_) {}
                  featuresMap.set(f, allowed);
                }
                return f;
              }, natFeaturesGet, 'get features', 0),
              set: featuresDesc.set,
            });
          }

          const limitsDesc = Object.getOwnPropertyDescriptor(aProto, 'limits');
          if (limitsDesc && typeof limitsDesc.get === 'function') {
            const natLimitsGet = limitsDesc.get;
            Object.defineProperty(aProto, 'limits', {
              configurable: limitsDesc.configurable,
              enumerable: limitsDesc.enumerable,
              get: nativeLike(function limits() {
                const l = natLimitsGet.call(this);
                if (l && !limitsMap.has(l)) {
                  limitsMap.set(l, resolveLimits(l));
                }
                return l;
              }, natLimitsGet, 'get limits', 0),
              set: limitsDesc.set,
            });
          }

          if (typeof aProto.requestAdapterInfo === 'function') {
            replace(aProto, 'requestAdapterInfo', (origReqInfo) => async function requestAdapterInfo(...args) {
              const info = await origReqInfo.apply(this, args);
              if (!info || typeof info !== 'object') return info;
              const iProto = (typeof GPUAdapterInfo !== 'undefined' && GPUAdapterInfo.prototype) || Object.getPrototypeOf(info);
              patchInfoAccessors(iProto);
              infoOverrides.set(info, gpuInfo);
              adapterInfos.set(this, info);
              return info;
            });
          }
        };

        // Pre-patch if global prototypes exist
        if (typeof GPUAdapterInfo !== 'undefined' && GPUAdapterInfo.prototype) {
          patchInfoAccessors(GPUAdapterInfo.prototype);
        }
        if (typeof GPUSupportedFeatures !== 'undefined' && GPUSupportedFeatures.prototype) {
          patchFeaturesAccessors(GPUSupportedFeatures.prototype);
        }
        if (typeof GPUSupportedLimits !== 'undefined' && GPUSupportedLimits.prototype) {
          patchLimitsAccessors(GPUSupportedLimits.prototype);
        }
        if (typeof GPUAdapter !== 'undefined' && GPUAdapter.prototype) {
          patchAdapterProto(GPUAdapter.prototype);
        }

        const prepareAdapter = (adapter) => {
          if (!adapter) return;
          const aProto = (typeof GPUAdapter !== 'undefined' && GPUAdapter.prototype) || Object.getPrototypeOf(adapter);
          patchAdapterProto(aProto);

          let info = null;
          try { info = adapter.info; } catch (_) {}
          if (info && typeof info === 'object') {
            const iProto = (typeof GPUAdapterInfo !== 'undefined' && GPUAdapterInfo.prototype) || Object.getPrototypeOf(info);
            patchInfoAccessors(iProto);
            infoOverrides.set(info, gpuInfo);
            adapterInfos.set(adapter, info);
          }

          let features = null;
          try { features = adapter.features; } catch (_) {}
          if (features && typeof features === 'object') {
            const fProto = (typeof GPUSupportedFeatures !== 'undefined' && GPUSupportedFeatures.prototype) || Object.getPrototypeOf(features);
            patchFeaturesAccessors(fProto);
            if (!featuresMap.has(features)) {
              const allowed = new Set();
              try {
                for (const item of features) {
                  if (!disallowedFeatures.has(item)) allowed.add(item);
                }
              } catch (_) {}
              featuresMap.set(features, allowed);
            }
          }

          let limits = null;
          try { limits = adapter.limits; } catch (_) {}
          if (limits && typeof limits === 'object') {
            const lProto = (typeof GPUSupportedLimits !== 'undefined' && GPUSupportedLimits.prototype) || Object.getPrototypeOf(limits);
            patchLimitsAccessors(lProto);
            if (!limitsMap.has(limits)) {
              limitsMap.set(limits, resolveLimits(limits));
            }
          }
        };

        replace(gpuProto, 'requestAdapter', (origReq) => async function requestAdapter(...args) {
          const adapter = await origReq.apply(this, args);
          if (!adapter) return adapter;
          prepareAdapter(adapter);
          return adapter;
        });
      }
    } catch (_) {}
  }
  if (typeof StorageManager !== 'undefined' && StorageManager.prototype && StorageManager.prototype.estimate) {
    // Quota must match the main-world patch (injection-script.js) across realms: reading the
    // flags from the IIFE-top declarations keeps worker and page on the same personaQuota.
    try {
      const origEstimate = StorageManager.prototype.estimate;
      const isMob = Boolean(CFG.mobile || isIosPersona || isAndroidPersona);
      const mem = Number(CFG.deviceMemory) || 8;
      const personaQuota = isMob
        ? (mem >= 8 ? 16106127360 : 10737418240)
        : (mem >= 8 ? 64424509440 : 32212254720);

      const patchedEstimate = function estimate() {
        if (!this || !(this instanceof StorageManager)) {
          return Promise.reject(new TypeError("Illegal invocation"));
        }
        return origEstimate.apply(this, arguments).then((res) => {
          return {
            quota: personaQuota,
            usage: res ? (res.usage || 0) : 0,
            usageDetails: res ? (res.usageDetails || {}) : {},
          };
        });
      };
      nativeLike(patchedEstimate, origEstimate, "estimate", 0);
      Object.defineProperty(StorageManager.prototype, "estimate", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: patchedEstimate,
      });
    } catch (_) {}
  }
})

();`;
}

module.exports = {
  buildWorkerInjectionScript,
};
