'use strict';

/**
 * Browser-only UA installer, serialized by user-agent.js. Keep dependencies and
 * host state in the builder; this closure receives only JSON data and its token.
 * The authored function is linted before the emitted script is parsed/tested.
 */
module.exports = (U, UA_BRIDGE_TOKEN) => {
  const nativeSource = new WeakMap();
  const originalToString = Function.prototype.toString;
  const getRealmTypeError = (receiver, fallbackProto) => {
    try {
      if (receiver) {
        if (receiver.ownerDocument && receiver.ownerDocument.defaultView && receiver.ownerDocument.defaultView.TypeError) {
          return receiver.ownerDocument.defaultView.TypeError;
        }
        if (receiver.defaultView && receiver.defaultView.TypeError) {
          return receiver.defaultView.TypeError;
        }
        if (typeof receiver.TypeError === "function") {
          return receiver.TypeError;
        }
        const ctor = receiver.constructor;
        if (ctor) {
          if (ctor.ownerDocument && ctor.ownerDocument.defaultView && ctor.ownerDocument.defaultView.TypeError) {
            return ctor.ownerDocument.defaultView.TypeError;
          }
          if (typeof ctor.constructor === "function") {
            try {
              const globalObj = ctor.constructor("return this")();
              if (globalObj && globalObj.TypeError) return globalObj.TypeError;
            } catch (_) {}
          }
        }
      }
    } catch (_) {}
    try {
      if (fallbackProto && fallbackProto.constructor && typeof fallbackProto.constructor.constructor === "function") {
        try {
          const globalObj = fallbackProto.constructor.constructor("return this")();
          if (globalObj && globalObj.TypeError) return globalObj.TypeError;
        } catch (_) {}
      }
    } catch (_) {}
    return (typeof TypeError !== "undefined" ? TypeError : Error);
  };

  const patchSubWindow = (subWin) => {
    try {
      if (!subWin || patchedSubWindows.has(subWin)) return;
      patchedSubWindows.add(subWin);
      if (subWin.Function && subWin.Function.prototype) {
        const origSubToString = subWin.Function.prototype.toString;
        if (!nativeSource.has(origSubToString)) {
          const subHolder = {
            toString(...args) {
              const secret = args[0];
              if (secret === UA_BRIDGE_TOKEN) {
                if ((args[1] === 'documentInstalled' || args[1] === 'sharedWorkers')) return origSubToString.call(this, ...args);
                if (nativeSource.has(this)) return { bridge: true, nativeText: nativeSource.get(this) };
                try {
                  const inherited = origSubToString.call(this, secret);
                  if (inherited && typeof inherited === "object" && inherited.bridge === true) return inherited;
                } catch (_) {}
                return null;
              }
              if (typeof secret === 'string' && secret.length === 64 && secret !== UA_BRIDGE_TOKEN) {
                try {
                  const inherited = origSubToString.call(this, ...args);
                  if (inherited && inherited.bridge === true && inherited.token === secret) return inherited;
                  if (typeof inherited === 'string') return nativeSource.get(this) || inherited;
                } catch (_) {}
              }
              if (nativeSource.has(this)) return nativeSource.get(this);
              try {
                const inherited = origSubToString.call(this, ...args);
                if (inherited && typeof inherited === "object" && inherited.bridge === true && inherited.nativeText) {
                  return inherited.nativeText;
                }
              } catch (_) {}
              return origSubToString.call(this, ...args);
            }
          };
          const patchedSubToString = subHolder.toString;
          nativeSource.set(patchedSubToString, "function toString() { [native code] }");
          try { Object.defineProperty(patchedSubToString, "name", { configurable: true, value: "toString" }); } catch (_) {}
          try { Object.defineProperty(patchedSubToString, "length", { configurable: true, value: 0 }); } catch (_) {}
          Object.defineProperty(subWin.Function.prototype, "toString", {
            configurable: true,
            writable: true,
            value: patchedSubToString,
          });
        }
      }
      if (subWin.Navigator && subWin.Navigator.prototype) {
        applyNavPatches(subWin.Navigator.prototype);
      }
      if (subWin.navigator) {
        // Register the sub-window's GENUINE instances so the getters this realm installs into
        // the child keep answering the child's own navigator (and its userAgentData) — synthetic
        // receivers built on the child's prototypes stay rejected.
        try { approvedNavs.add(subWin.navigator); } catch (_) {}
        try { if (subWin.navigator.userAgentData) approvedUad.add(subWin.navigator.userAgentData); } catch (_) {}
        cleanNavProperties(subWin.navigator);
      }
      hookIframeAccess(subWin);
    } catch (_) {}
  };

  const patchedSubWindows = new WeakSet();
  const hookIframeAccess = (targetWin) => {
    try {
      const win = targetWin || (typeof window !== "undefined" ? window : null);
      if (!win) return;
      if (win.HTMLIFrameElement && win.HTMLIFrameElement.prototype) {
        const descCW = Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, "contentWindow");
        if (descCW && typeof descCW.get === "function" && !nativeSource.has(descCW.get)) {
          const origCW = descCW.get;
          let patchedCW;
          const holderCW = {};
          Object.defineProperty(holderCW, "contentWindow", {
            configurable: true,
            get: function() {
              try {
                const sw = origCW.call(this);
                if (sw) patchSubWindow(sw);
                return sw;
              } catch (err) {
                stripStackFrame(err, patchedCW, "get contentWindow");
                throw err;
              }
            }
          });
          patchedCW = Object.getOwnPropertyDescriptor(holderCW, "contentWindow").get;
          try { Object.defineProperty(patchedCW, "name", { configurable: true, value: "get contentWindow" }); } catch (_) {}
          try { Object.defineProperty(patchedCW, "length", { configurable: true, value: 0 }); } catch (_) {}
          nativeSource.set(patchedCW, "function get contentWindow() { [native code] }");
          Object.defineProperty(win.HTMLIFrameElement.prototype, "contentWindow", {
            configurable: true,
            enumerable: true,
            get: patchedCW,
          });
        }
        const descCD = Object.getOwnPropertyDescriptor(win.HTMLIFrameElement.prototype, "contentDocument");
        if (descCD && typeof descCD.get === "function" && !nativeSource.has(descCD.get)) {
          const origCD = descCD.get;
          let patchedCD;
          const holderCD = {};
          Object.defineProperty(holderCD, "contentDocument", {
            configurable: true,
            get: function() {
              try {
                const sd = origCD.call(this);
                if (sd && sd.defaultView) patchSubWindow(sd.defaultView);
                return sd;
              } catch (err) {
                stripStackFrame(err, patchedCD, "get contentDocument");
                throw err;
              }
            }
          });
          patchedCD = Object.getOwnPropertyDescriptor(holderCD, "contentDocument").get;
          try { Object.defineProperty(patchedCD, "name", { configurable: true, value: "get contentDocument" }); } catch (_) {}
          try { Object.defineProperty(patchedCD, "length", { configurable: true, value: 0 }); } catch (_) {}
          nativeSource.set(patchedCD, "function get contentDocument() { [native code] }");
          Object.defineProperty(win.HTMLIFrameElement.prototype, "contentDocument", {
            configurable: true,
            enumerable: true,
            get: patchedCD,
          });
        }
      }
      if (typeof win.open === "function" && !nativeSource.has(win.open)) {
        const origOpen = win.open;
        let patchedOpen;
        const holderOpen = {
          open(...args) {
            try {
              const opened = origOpen.apply(this, args);
              if (opened) patchSubWindow(opened);
              return opened;
            } catch (err) {
              stripStackFrame(err, patchedOpen, "open");
              throw err;
            }
          }
        };
        patchedOpen = holderOpen.open;
        try { Object.defineProperty(patchedOpen, "name", { configurable: true, value: "open" }); } catch (_) {}
        try { Object.defineProperty(patchedOpen, "length", { configurable: true, value: origOpen.length || 0 }); } catch (_) {}
        nativeSource.set(patchedOpen, "function open() { [native code] }");
        try {
          Object.defineProperty(win, "open", {
            configurable: true,
            writable: true,
            value: patchedOpen,
          });
        } catch (_) {}
      }
    } catch (_) {}
  };

  try {
    if (!nativeSource.has(Function.prototype.toString)) {
      const holder = {
        toString(...args) {
          const secret = args[0];
          if (secret === UA_BRIDGE_TOKEN) {
            if ((args[1] === 'documentInstalled' || args[1] === 'sharedWorkers')) return originalToString.call(this, ...args);
            if (nativeSource.has(this)) return { bridge: true, nativeText: nativeSource.get(this) };
            try {
              const inherited = originalToString.call(this, secret);
              if (inherited && typeof inherited === "object" && inherited.bridge === true) return inherited;
            } catch (_) {}
            return null;
          }
          if (typeof secret === 'string' && secret.length === 64 && secret !== UA_BRIDGE_TOKEN) {
            try {
              const inherited = originalToString.call(this, ...args);
              if (inherited && inherited.bridge === true && inherited.token === secret) return inherited;
              if (typeof inherited === 'string') return nativeSource.get(this) || inherited;
            } catch (_) {}
          }
          if (nativeSource.has(this)) return nativeSource.get(this);
          return originalToString.call(this, ...args);
        }
      };
      const patchedToString = holder.toString;
      nativeSource.set(patchedToString, "function toString() { [native code] }");
      try { Object.defineProperty(patchedToString, "name", { configurable: true, value: "toString" }); } catch (_) {}
      try { Object.defineProperty(patchedToString, "length", { configurable: true, value: 0 }); } catch (_) {}
      Object.defineProperty(Function.prototype, "toString", {
        configurable: true,
        writable: true,
        value: patchedToString,
      });
    }
  } catch (_) {}

  const sameValue = (obj, key, expected) => {
    try { return obj && obj[key] === expected; } catch (_) { return false; }
  };
  // Genuine-instance whitelist. WebIDL getters brand-check the receiver against internal
  // slots, which pure JS cannot inspect; instanceof/toString heuristics accept the synthetic
  // receivers a page builds with Object.create(Navigator.prototype) — receivers the real
  // engine rejects with "Illegal invocation" (verified against stock Chrome 157 / Firefox
  // 160), which is a one-line injection oracle. Only this realm's own navigator instance and
  // sub-window instances registered at sync time may read; everything else falls through to
  // the original getter and inherits its native rejection.
  const approvedNavs = new WeakSet();
  const approvedUad = new WeakSet();
  const isNav = (receiver) => {
    try {
      if (!receiver) return false;
      if (typeof Navigator !== "undefined" && receiver === Navigator.prototype) return false;
      if (typeof WorkerNavigator !== "undefined" && receiver === WorkerNavigator.prototype) return false;
      if (receiver && receiver.constructor && receiver.constructor.prototype === receiver) return false;
      if (typeof navigator !== "undefined" && receiver === navigator) return true;
      if (approvedNavs.has(receiver)) return true;
      return false;
    } catch (_) { return false; }
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
      const header = lines[0];
      const filtered = lines.slice(1).filter((l) => {
        if (frameName && l.indexOf(frameName) !== -1) return false;
        if (baseName && l.indexOf(baseName) !== -1) return false;
        if (l.indexOf("stripStackFrame") !== -1 || l.indexOf("nativeGetter") !== -1 || l.indexOf("isNav") !== -1) return false;
        return true;
      });
      try { err.stack = [header, ...filtered].join(nl); } catch (_) {}
    }
    return err;
  };
  const define = (obj, key, getter) => {
    if (sameValue(obj, key, getter())) return true;
    let originalGetter = null;
    try {
      let cursor = obj;
      while (cursor && !originalGetter) {
        originalGetter = Object.getOwnPropertyDescriptor(cursor, key)?.get || null;
        cursor = Object.getPrototypeOf(cursor);
      }
    } catch (_) {}
    let nativeGetter;
    const holder = {};
    Object.defineProperty(holder, key, {
      configurable: true,
      get: function() {
        if (!isNav(this)) {
          const RealmTypeError = getRealmTypeError(this, obj);
          if (originalGetter) {
            try {
              return originalGetter.call(this);
            } catch (err) {
              if (RealmTypeError !== TypeError && err && err.name === "TypeError") {
                const reErr = new RealmTypeError(err.message || "Illegal invocation");
                stripStackFrame(reErr, nativeGetter, "get " + key);
                throw reErr;
              }
              stripStackFrame(err, nativeGetter, "get " + key);
              throw err;
            }
          }
          const err = new RealmTypeError("Illegal invocation");
          stripStackFrame(err, nativeGetter, "get " + key);
          throw err;
        }
        return getter();
      }
    });
    nativeGetter = Object.getOwnPropertyDescriptor(holder, key).get;
    try { Object.defineProperty(nativeGetter, "name", { configurable: true, value: originalGetter?.name || ("get " + key) }); } catch (_) {}
    try { Object.defineProperty(nativeGetter, "length", { configurable: true, value: 0 }); } catch (_) {}
    try { nativeSource.set(nativeGetter, originalGetter ? originalToString.call(originalGetter) : ("function get " + key + "() { [native code] }")); } catch (_) {}
    try {
      Object.defineProperty(obj, key, { configurable: true, enumerable: true, get: nativeGetter });
      return true;
    } catch (_) {
      try { Object.defineProperty(obj, key, { configurable: true, get: nativeGetter }); return true; } catch (__) { return false; }
    }
  };
  const contextExposesClientHints = () => {
    try {
      if (typeof Navigator !== "undefined" && Navigator.prototype && ("userAgentData" in Navigator.prototype)) return true;
      if (typeof WorkerNavigator !== "undefined" && WorkerNavigator.prototype && ("userAgentData" in WorkerNavigator.prototype)) return true;
      return typeof navigator !== "undefined" && navigator.userAgentData != null;
    } catch (_) { return false; }
  };
  const applyNavPatches = (proto) => {
    if (!proto) return;
    define(proto, "userAgent", () => U.userAgent);
    define(proto, "appVersion", () => U.appVersion);
    define(proto, "platform", () => U.platform);
    define(proto, "vendor", () => U.vendor);
    if (typeof Navigator !== "undefined" && proto === Navigator.prototype) {
      define(proto, "appCodeName", () => "Mozilla");
      define(proto, "appName", () => "Netscape");
      define(proto, "product", () => "Gecko");
      define(proto, "productSub", () => "20030107");
      define(proto, "vendorSub", () => "");
    }
  };
  const cleanNavProperties = (nav) => {
    if (!nav) return;
    ["userAgent", "appVersion", "platform", "vendor", "appCodeName", "appName", "product", "productSub", "vendorSub"].forEach((k) => {
      try { delete nav[k]; } catch (_) {}
    });
  };
  try {
    const navPrototypes = [];
    if (typeof Navigator !== "undefined" && Navigator.prototype) navPrototypes.push(Navigator.prototype);
    if (typeof WorkerNavigator !== "undefined" && WorkerNavigator.prototype) navPrototypes.push(WorkerNavigator.prototype);
    for (const proto of navPrototypes) {
      applyNavPatches(proto);
    }
    if (typeof navigator !== "undefined") {
      cleanNavProperties(navigator);
    }
  } catch (_) {}

  // userAgentData (Client Hints JS API)
  try {
    const brands = (U.brands || []).map((b) => ({ brand: String(b.brand), version: String(b.version) }));
    const publicBrands = Object.freeze(brands.map((item) => ({ ...item })));
    const fullVersionList = (U.fullVersionList || brands).map((b) => ({ brand: String(b.brand), version: String(b.version) }));
    const copyHintValue = (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' ? { ...item } : item) : value;
    const highEntropy = {
      brands,
      fullVersionList,
      fullVersion: String(U.fullVersion || ""),
      platform: String(U.chPlatform || ""),
      platformVersion: String(U.platformVersion || ""),
      architecture: String(U.architecture ?? ""),
      model: String(U.model || ""),
      mobile: Boolean(U.mobile),
      bitness: String(U.bitness ?? ""),
      wow64: Boolean(U.wow64),
      uaFullVersion: String(U.fullVersion || ""),
      formFactors: U.formFactors,
    };
    const parseHints = (hints, targetMethod, ErrorCtor = TypeError) => {
      if (hints === null || hints === undefined || typeof hints === "number" || typeof hints === "boolean" || typeof hints === "string" || typeof hints === "symbol" || typeof hints === "bigint") {
        throw new ErrorCtor("Failed to execute '" + targetMethod + "' on 'NavigatorUAData': The provided value cannot be converted to a sequence.");
      }
      const iterator = hints[Symbol.iterator];
      if (typeof iterator !== "function") {
        throw new ErrorCtor("Failed to execute '" + targetMethod + "' on 'NavigatorUAData': The object must have a callable @@iterator property.");
      }
      return Array.from({ [Symbol.iterator]: () => iterator.call(hints) }, (item) => {
        if (typeof item === 'symbol') throw new ErrorCtor('Cannot convert a Symbol value to a string');
        return String(item);
      });
    };

    // Probe native support once. Requests for this optional hint await the
    // result, including a request made during the first injected instruction.
    let formFactorsReady = Promise.resolve(false);
    try {
      const realUad = (typeof navigator !== "undefined" && navigator.userAgentData) || null;
      const hostGeh = realUad && realUad.getHighEntropyValues;
      if (typeof hostGeh === "function") {
        formFactorsReady = Promise.resolve(hostGeh.call(realUad, ["formFactors"]))
          .then(result => Boolean(result) && Array.isArray(result.formFactors), () => false);
      }
    } catch (_) {}
    const highEntropyResult = (want) => {
      const snapshot = supported => {
        const out = { brands: copyHintValue(brands), mobile: Boolean(U.mobile), platform: String(U.chPlatform || "") };
        for (const hint of want) {
          if (Object.prototype.hasOwnProperty.call(highEntropy, hint) && hint !== 'fullVersion'
              && (hint !== 'formFactors' || supported)) out[hint] = copyHintValue(highEntropy[hint]);
          if (hint === 'uaFullVersion') out.uaFullVersion = highEntropy.fullVersion;
        }
        return out;
      };
      return want.includes('formFactors') ? formFactorsReady.then(snapshot) : Promise.resolve(snapshot(false));
    };
      if (typeof NavigatorUAData !== "undefined") {
      const targetProto = NavigatorUAData.prototype;
      // userAgentData need not return the same object on consecutive reads.
      // Validate genuine receivers through the native getter: instanceof would
      // also accept Object.create(NavigatorUAData.prototype) fakes.
      const realUad = (() => { try { return (typeof navigator !== "undefined" && navigator.userAgentData) || null; } catch (_) { return null; } })();
      const nativeUaBrandGetter = Object.getOwnPropertyDescriptor(targetProto, "mobile")?.get;
      const isUaReceiver = (receiver) => {
        if (receiver === realUad || approvedUad.has(receiver)) return true;
        try {
          if (typeof nativeUaBrandGetter === "function") {
            nativeUaBrandGetter.call(receiver);
            return true;
          }
        } catch (_) {}
        return false;
      };
      const makeUaGetter = (prop, fn) => {
        let originalGetter = null;
        try {
          originalGetter = Object.getOwnPropertyDescriptor(targetProto, prop)?.get || null;
        } catch (_) {}
        let g;
        const h = {};
        Object.defineProperty(h, prop, {
          configurable: true,
          get: function() {
            if (!isUaReceiver(this)) {
              const RealmTypeError = getRealmTypeError(this, targetProto);
              if (originalGetter) {
                try {
                  return originalGetter.call(this);
                } catch (err) {
                  if (RealmTypeError !== TypeError && err && err.name === "TypeError") {
                    const reErr = new RealmTypeError(err.message || "Illegal invocation");
                    stripStackFrame(reErr, g, "get " + prop);
                    throw reErr;
                  }
                  stripStackFrame(err, g, "get " + prop);
                  throw err;
                }
              }
              const err = new RealmTypeError("Illegal invocation");
              stripStackFrame(err, g, "get " + prop);
              throw err;
            }
            return fn.call(this);
          }
        });
        g = Object.getOwnPropertyDescriptor(h, prop).get;
        try { Object.defineProperty(g, "name", { configurable: true, value: originalGetter?.name || ("get " + prop) }); } catch (_) {}
        try { Object.defineProperty(g, "length", { configurable: true, value: 0 }); } catch (_) {}
        nativeSource.set(g, originalGetter ? originalToString.call(originalGetter) : ("function get " + prop + "() { [native code] }"));
        return g;
      };
      Object.defineProperty(targetProto, "brands", { get: makeUaGetter("brands", () => publicBrands), enumerable: true, configurable: true });
      Object.defineProperty(targetProto, "mobile", { get: makeUaGetter("mobile", () => Boolean(U.mobile)), enumerable: true, configurable: true });
      Object.defineProperty(targetProto, "platform", { get: makeUaGetter("platform", () => String(U.chPlatform || "")), enumerable: true, configurable: true });
      const nativeGeh = targetProto.getHighEntropyValues;
      const nativeToJSON = targetProto.toJSON;
      let geh;
      const gehHolder = {
        getHighEntropyValues(hints) {
          const RealmTypeError = getRealmTypeError(this, targetProto);
          if (!isUaReceiver(this)) {
            if (typeof nativeGeh === "function") return nativeGeh.apply(this, arguments);
            const err = new RealmTypeError("Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': Illegal invocation");
            stripStackFrame(err, geh, "getHighEntropyValues");
            return Promise.reject(err);
          }
          if (arguments.length < 1) {
            const err = new RealmTypeError("Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': 1 argument required, but only 0 present.");
            stripStackFrame(err, geh, "getHighEntropyValues");
            return Promise.reject(err);
          }
          let want;
          try {
            want = parseHints(hints, "getHighEntropyValues", RealmTypeError);
          } catch (err) {
            stripStackFrame(err, geh, "getHighEntropyValues");
            return Promise.reject(err);
          }
          return highEntropyResult(want);
        }
      };
      geh = gehHolder.getHighEntropyValues;
      nativeSource.set(geh, "function getHighEntropyValues() { [native code] }");
      Object.defineProperty(targetProto, "getHighEntropyValues", { configurable: true, writable: true, enumerable: true, value: geh });
      let tj;
      const tjHolder = {
        toJSON() {
          if (!isUaReceiver(this)) {
            if (typeof nativeToJSON === "function") {
              try {
                return nativeToJSON.apply(this, arguments);
              } catch (err) {
                const RealmTypeError = getRealmTypeError(this, targetProto);
                if (RealmTypeError !== TypeError && err && err.name === "TypeError") {
                  const reErr = new RealmTypeError(err.message || "Illegal invocation");
                  stripStackFrame(reErr, tj, "toJSON");
                  throw reErr;
                }
                stripStackFrame(err, tj, "toJSON");
                throw err;
              }
            }
            const RealmTypeError = getRealmTypeError(this, targetProto);
            const err = new RealmTypeError("Illegal invocation");
            stripStackFrame(err, tj, "toJSON");
            throw err;
          }
          return { brands: copyHintValue(brands), mobile: Boolean(U.mobile), platform: String(U.chPlatform || "") };
        }
      };
      tj = tjHolder.toJSON;
      nativeSource.set(tj, "function toJSON() { [native code] }");
      Object.defineProperty(targetProto, "toJSON", { configurable: true, writable: true, enumerable: true, value: tj });

      const existing = (() => { try { return navigator.userAgentData; } catch (_) { return null; } })();
      if (existing) {
        try {
          delete existing.brands;
          delete existing.mobile;
          delete existing.platform;
          delete existing.getHighEntropyValues;
          delete existing.toJSON;
        } catch (_) {}
      } else if (contextExposesClientHints()) {
        const uaData = Object.create(targetProto);
        const protoTarget = typeof Navigator !== "undefined" ? Navigator.prototype : (typeof WorkerNavigator !== "undefined" ? WorkerNavigator.prototype : null);
        if (protoTarget) define(protoTarget, "userAgentData", () => uaData);
        try { delete navigator.userAgentData; } catch (_) {}
      }
    } else {
      const uaData = {};
      const makeUaGetter = (prop, fn) => {
        let g;
        const h = {};
        Object.defineProperty(h, prop, {
          configurable: true,
          get: function() {
            if (this !== uaData) {
              const RealmTypeError = getRealmTypeError(this);
              const err = new RealmTypeError("Illegal invocation");
              stripStackFrame(err, g, "get " + prop);
              throw err;
            }
            return fn.call(this);
          }
        });
        g = Object.getOwnPropertyDescriptor(h, prop).get;
        try { Object.defineProperty(g, "name", { configurable: true, value: "get " + prop }); } catch (_) {}
        try { Object.defineProperty(g, "length", { configurable: true, value: 0 }); } catch (_) {}
        nativeSource.set(g, "function get " + prop + "() { [native code] }");
        return g;
      };
      Object.defineProperty(uaData, "brands", { get: makeUaGetter("brands", () => publicBrands), enumerable: true, configurable: true });
      Object.defineProperty(uaData, "mobile", { get: makeUaGetter("mobile", () => Boolean(U.mobile)), enumerable: true, configurable: true });
      Object.defineProperty(uaData, "platform", { get: makeUaGetter("platform", () => String(U.chPlatform || "")), enumerable: true, configurable: true });
      let geh;
      const gehHolder = {
        getHighEntropyValues(hints) {
          const RealmTypeError = getRealmTypeError(this);
          if (this !== uaData) {
            const err = new RealmTypeError("Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': Illegal invocation");
            stripStackFrame(err, geh, "getHighEntropyValues");
            return Promise.reject(err);
          }
          if (arguments.length < 1) {
            const err = new RealmTypeError("Failed to execute 'getHighEntropyValues' on 'NavigatorUAData': 1 argument required, but only 0 present.");
            stripStackFrame(err, geh, "getHighEntropyValues");
            return Promise.reject(err);
          }
          let want;
          try {
            want = parseHints(hints, "getHighEntropyValues", RealmTypeError);
          } catch (err) {
            stripStackFrame(err, geh, "getHighEntropyValues");
            return Promise.reject(err);
          }
          return highEntropyResult(want);
        }
      };
      geh = gehHolder.getHighEntropyValues;
      nativeSource.set(geh, "function getHighEntropyValues() { [native code] }");
      Object.defineProperty(uaData, "getHighEntropyValues", { configurable: true, writable: true, enumerable: true, value: geh });
      let tj;
      const tjHolder = {
        toJSON() {
          const RealmTypeError = getRealmTypeError(this);
          if (this !== uaData) {
            const err = new RealmTypeError("Illegal invocation");
            stripStackFrame(err, tj, "toJSON");
            throw err;
          }
          return { brands: copyHintValue(brands), mobile: Boolean(U.mobile), platform: String(U.chPlatform || "") };
        }
      };
      tj = tjHolder.toJSON;
      nativeSource.set(tj, "function toJSON() { [native code] }");
      Object.defineProperty(uaData, "toJSON", { configurable: true, writable: true, enumerable: true, value: tj });
      if (contextExposesClientHints()) {
        const protoTarget = typeof Navigator !== "undefined" ? Navigator.prototype : (typeof WorkerNavigator !== "undefined" ? WorkerNavigator.prototype : null);
        if (protoTarget) define(protoTarget, "userAgentData", () => uaData);
        try { delete navigator.userAgentData; } catch (_) {}
      }
    }
  } catch (_) {}
  try {
    hookIframeAccess();
  } catch (_) {}
};
