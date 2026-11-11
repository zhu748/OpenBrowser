'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- hide automation (navigator.webdriver / AutomationControlled) ---
  try {
    const hideWd = makeNativeGetter("webdriver", () => false, "navigator");
    if (typeof Navigator !== "undefined") {
      Object.defineProperty(Navigator.prototype, "webdriver", { configurable: true, enumerable: true, get: hideWd });
    }
    if (typeof navigator !== "undefined") {
      try { delete navigator.webdriver; } catch (_) {}
    }
  } catch (_) {}
  // cdc_ / $cdc_ selenium leftovers if present
  try {
    const cleanTargets = typeof document !== "undefined" ? [document, (typeof window !== "undefined" ? window : null)].filter(Boolean) : [];
    for (const tgt of cleanTargets) {
      for (const key of Object.getOwnPropertyNames(tgt)) {
        if (String(key).startsWith('$cdc_') || String(key).startsWith('cdc_') || String(key).startsWith('__selenium') || String(key).startsWith('__webdriver') || String(key).startsWith('__driver_')) {
          try { delete tgt[key]; } catch (_) {}
        }
      }
    }
  } catch (_) {}

  // --- Persona platform guards (iOS, Android, Mobile, Linux) ---
  const isIosPersona = Boolean(CFG.os === "ios" || CFG.platform === "iPhone" || CFG.mobileDevice?.os === "ios" || (CFG.platform && /iphone|ipad|ipod/i.test(CFG.platform)));
  const isAndroidPersona = Boolean(CFG.os === "android" || CFG.mobileDevice?.os === "android" || (CFG.platform && /android/i.test(CFG.platform)));
  const isMobilePersona = Boolean(CFG.mobile || isIosPersona || isAndroidPersona);

  // --- navigator (non-UA fields; UA handled by uaScript) ---
  const FROZEN_LANGUAGES = Object.freeze(Array.isArray(CFG.languages) ? [...CFG.languages] : ["en-US"]);
  const navPatch = {
    platform: { get: () => CFG.platform },
    maxTouchPoints: { get: () => CFG.maxTouchPoints },
    vendor: { get: () => CFG.vendor },
    languages: { get: () => FROZEN_LANGUAGES },
    language: { get: () => FROZEN_LANGUAGES[0] || "en-US" },
    webdriver: { get: () => false },
  };
  if (CFG.hardwareConcurrency != null) navPatch.hardwareConcurrency = { get: () => CFG.hardwareConcurrency };
  if (CFG.deviceMemory != null && !isIosPersona) navPatch.deviceMemory = { get: () => Math.min(8, CFG.deviceMemory) };
  if (CFG.doNotTrack != null) navPatch.doNotTrack = { get: () => CFG.doNotTrack };

  try {
    const navProto = typeof Navigator !== "undefined" ? Navigator.prototype : null;
    if (navProto) {
      for (const [key, desc] of Object.entries(navPatch)) {
        // Only members this document already exposes may be answered. deviceMemory is gated on a
        // secure context, so a data: frame has no such member: installing one there hands a page a
        // navigator property no stock engine has, which is a single in-operator away from being a
        // tell. The worker scope has carried this guard for the same reason.
        try { if (!(key in navProto)) continue; } catch (_) { continue; }
        const fn = desc.get;
        const getter = makeNativeGetter(key, fn, "navigator");
        Object.defineProperty(navProto, key, {
          configurable: true,
          enumerable: true,
          get: getter,
        });
        if (typeof navigator !== "undefined") {
          try { delete navigator[key]; } catch (_) {}
        }
      }
    }
  } catch (_) {}

  // --- Persona platform guards (iOS, Android, Mobile, Linux) ---

  if (isIosPersona) {
    try {
      if (typeof Navigator !== "undefined" && Navigator.prototype) {
        delete Navigator.prototype.userAgentData;
        delete Navigator.prototype.connection;
        delete Navigator.prototype.getBattery;
        delete Navigator.prototype.usb;
        delete Navigator.prototype.hid;
        delete Navigator.prototype.bluetooth;
        delete Navigator.prototype.serial;
        delete Navigator.prototype.deviceMemory;
        delete Navigator.prototype.gpu;
      }
      if (typeof navigator !== "undefined") {
        delete navigator.userAgentData;
        delete navigator.connection;
        delete navigator.getBattery;
        delete navigator.usb;
        delete navigator.hid;
        delete navigator.bluetooth;
        delete navigator.serial;
        delete navigator.deviceMemory;
        delete navigator.gpu;
      }
      if (typeof window !== "undefined") {
        if ("NavigatorUAData" in window) delete window.NavigatorUAData;
        if ("NetworkInformation" in window) delete window.NetworkInformation;
        if ("BatteryManager" in window) delete window.BatteryManager;
        if ("USB" in window) delete window.USB;
        if ("HID" in window) delete window.HID;
        if ("Bluetooth" in window) delete window.Bluetooth;
        if ("Serial" in window) delete window.Serial;
        if ("GPU" in window) delete window.GPU;
        if ("GPUAdapter" in window) delete window.GPUAdapter;
        if ("GPUDevice" in window) delete window.GPUDevice;
        try {
          Object.defineProperty(Window.prototype, "chrome", {
            get() { return undefined; },
            configurable: true,
          });
        } catch (_) {}
        try { delete window.chrome; } catch (_) {}
        try { delete globalThis.chrome; } catch (_) {}
        if (typeof window.chrome !== "undefined" || window.chrome) {
          try { delete window.chrome.app; } catch (_) {}
          try { delete window.chrome.loadTimes; } catch (_) {}
          try { delete window.chrome.csi; } catch (_) {}
          try { window.chrome = undefined; } catch (_) {}
        }

      }
    } catch (_) {}
    if (typeof window !== "undefined" && typeof window.GestureEvent === "undefined") {
      try {
        const BaseEvent = typeof UIEvent !== "undefined" ? UIEvent : Event;
        const FakeGestureEvent = function GestureEvent(type, eventInitDict) {
          if (!new.target) throw new TypeError("Failed to construct 'GestureEvent': Please use the 'new' operator.");
          return Reflect.construct(BaseEvent, [type, eventInitDict], new.target);
        };
        FakeGestureEvent.prototype = Object.create(BaseEvent.prototype, {
          constructor: { value: FakeGestureEvent, writable: true, configurable: true },
          scale: { value: 0, writable: true, configurable: true, enumerable: true },
          rotation: { value: 0, writable: true, configurable: true, enumerable: true },
          [Symbol.toStringTag]: { value: "GestureEvent", configurable: true },
        });
        Object.defineProperty(FakeGestureEvent, "prototype", { writable: false, enumerable: false, configurable: false });
        nativeLike(FakeGestureEvent, null, "GestureEvent", 1, true);
        nativeSource.set(FakeGestureEvent, "function GestureEvent() { [native code] }");
        Object.defineProperty(window, "GestureEvent", {
          configurable: true,
          writable: true,
          enumerable: false,
          value: FakeGestureEvent,
        });
      } catch (_) {}
    }
    if (typeof MediaSource !== "undefined" && typeof MediaSource.isTypeSupported === "function") {
      const origIsSupported = MediaSource.isTypeSupported;
      const patchedIsSupported = function isTypeSupported(type) {
        const t = String(type || "").toLowerCase();
        if (t.includes("webm")) return false;
        return origIsSupported.call(this, type);
      };
      nativeLike(patchedIsSupported, origIsSupported, "isTypeSupported", 1);
      try {
        Object.defineProperty(MediaSource, "isTypeSupported", {
          configurable: true, enumerable: true, writable: true, value: patchedIsSupported,
        });
      } catch (_) {}
    }
    if (typeof HTMLMediaElement !== "undefined" && HTMLMediaElement.prototype && HTMLMediaElement.prototype.canPlayType) {
      const origCanPlay = HTMLMediaElement.prototype.canPlayType;
      const patchedCanPlay = function canPlayType(type) {
        const t = String(type || "").toLowerCase();
        if (t.includes("webm")) return "";
        return origCanPlay.call(this, type);
      };
      nativeLike(patchedCanPlay, origCanPlay, "canPlayType", 1);
      try {
        Object.defineProperty(HTMLMediaElement.prototype, "canPlayType", {
          configurable: true, enumerable: true, writable: true, value: patchedCanPlay,
        });
      } catch (_) {}
    }
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
      const origSupports = CSS.supports;
      const patchedSupports = function supports(prop, val) {
        if (arguments.length === 2) {
          const p = String(prop || "").trim().toLowerCase();
          if (p === "-webkit-touch-callout") {
            const v = String(val || "").trim().toLowerCase();
            return v === "none" || v === "default";
          }
        } else if (arguments.length === 1) {
          const s = String(prop).replace(/\\(\\s*-webkit-touch-callout\\s*:\\s*(none|default)\\s*\\)/gi, '(display: block)');
          return origSupports.call(this, s);
        }
        return origSupports.apply(this, arguments);
      };
      nativeLike(patchedSupports, origSupports, "supports", 2);
      try {
        Object.defineProperty(CSS, "supports", {
          configurable: true, enumerable: true, writable: true, value: patchedSupports,
        });
      } catch (_) {}
    }
  }

  if (isMobilePersona) {
    try {
      const emptyPlugins = Object.create(typeof PluginArray !== "undefined" ? PluginArray.prototype : Object.prototype);
      Object.defineProperty(emptyPlugins, "length", { value: 0, configurable: true, enumerable: false, writable: false });
      const emptyMimeTypes = Object.create(typeof MimeTypeArray !== "undefined" ? MimeTypeArray.prototype : Object.prototype);
      Object.defineProperty(emptyMimeTypes, "length", { value: 0, configurable: true, enumerable: false, writable: false });

      if (typeof PluginArray !== "undefined" && PluginArray.prototype) {
        if (PluginArray.prototype.item) {
          const origItem = PluginArray.prototype.item;
          replaceMethod(PluginArray.prototype, "item", () => function item(index) {
            if (!this || this === PluginArray.prototype) throw new TypeError("Illegal invocation");
            if (this === emptyPlugins) return null;
            return origItem.apply(this, arguments);
          });
        }
        if (PluginArray.prototype.namedItem) {
          const origNamedItem = PluginArray.prototype.namedItem;
          replaceMethod(PluginArray.prototype, "namedItem", () => function namedItem(name) {
            if (!this || this === PluginArray.prototype) throw new TypeError("Illegal invocation");
            if (this === emptyPlugins) return null;
            return origNamedItem.apply(this, arguments);
          });
        }
      }

      if (typeof MimeTypeArray !== "undefined" && MimeTypeArray.prototype) {
        if (MimeTypeArray.prototype.item) {
          const origItem = MimeTypeArray.prototype.item;
          replaceMethod(MimeTypeArray.prototype, "item", () => function item(index) {
            if (!this || this === MimeTypeArray.prototype) throw new TypeError("Illegal invocation");
            if (this === emptyMimeTypes) return null;
            return origItem.apply(this, arguments);
          });
        }
        if (MimeTypeArray.prototype.namedItem) {
          const origNamedItem = MimeTypeArray.prototype.namedItem;
          replaceMethod(MimeTypeArray.prototype, "namedItem", () => function namedItem(name) {
            if (!this || this === MimeTypeArray.prototype) throw new TypeError("Illegal invocation");
            if (this === emptyMimeTypes) return null;
            return origNamedItem.apply(this, arguments);
          });
        }
      }

      if (typeof Navigator !== "undefined" && Navigator.prototype) {
        const emptyPluginsGetter = makeNativeGetter("plugins", () => emptyPlugins, "navigator");
        Object.defineProperty(Navigator.prototype, "plugins", {
          configurable: true, enumerable: true, get: emptyPluginsGetter, set: undefined,
        });
        const emptyMimeTypesGetter = makeNativeGetter("mimeTypes", () => emptyMimeTypes, "navigator");
        Object.defineProperty(Navigator.prototype, "mimeTypes", {
          configurable: true, enumerable: true, get: emptyMimeTypesGetter, set: undefined,
        });
        const pdfGetter = makeNativeGetter("pdfViewerEnabled", () => false, "navigator");
        Object.defineProperty(Navigator.prototype, "pdfViewerEnabled", {
          configurable: true, enumerable: true, get: pdfGetter, set: undefined,
        });
      }
      if (typeof navigator !== "undefined") {
        try { delete navigator.plugins; } catch (_) {}
        try { delete navigator.mimeTypes; } catch (_) {}
        try { delete navigator.pdfViewerEnabled; } catch (_) {}
      }
    } catch (_) {}

    if (typeof ScreenOrientation !== "undefined" && ScreenOrientation.prototype && ScreenOrientation.prototype.lock) {
      const origLock = ScreenOrientation.prototype.lock;
      const patchedLock = function lock(orientation) {
        if (!document.fullscreenElement) {
          return Promise.reject(new DOMException("screen.orientation.lock() is only available in fullscreen mode.", "SecurityError"));
        }
        return origLock.apply(this, arguments);
      };
      nativeLike(patchedLock, origLock, "lock", 1);
      try {
        Object.defineProperty(ScreenOrientation.prototype, "lock", {
          configurable: true,
          enumerable: true,
          writable: true,
          value: patchedLock,
        });
      } catch (_) {}
    }
  }

  const targetClaimedOs = String(CFG.os || "").toLowerCase();
  if (targetClaimedOs === "linux" && typeof MediaCapabilities !== "undefined" && MediaCapabilities.prototype && MediaCapabilities.prototype.decodingInfo) {
    const origDecodingInfo = MediaCapabilities.prototype.decodingInfo;
    const patchedDecodingInfo = function decodingInfo(configuration) {
      const p = origDecodingInfo.apply(this, arguments);
      return p.then((res) => {
        try {
          const c = String(configuration?.video?.contentType || "").toLowerCase();
          if (c.includes("hvc1") || c.includes("hev1")) {
            return {
              supported: res.supported,
              smooth: res.smooth,
              powerEfficient: false,
            };
          }
        } catch (_) {}
        return res;
      });
    };
    nativeLike(patchedDecodingInfo, origDecodingInfo, "decodingInfo", 1);
    try {
      Object.defineProperty(MediaCapabilities.prototype, "decodingInfo", {
        configurable: true,
        enumerable: true,
        writable: true,
        value: patchedDecodingInfo,
      });
    } catch (_) {}
  }

  // --- Keyboard Layout side-channel shielding (navigator.keyboard.getLayoutMap) ---
  if (typeof Keyboard !== "undefined" && Keyboard.prototype && typeof Keyboard.prototype.getLayoutMap === "function") {
    const US_KEYBOARD_LAYOUT = {
      KeyA: "a", KeyB: "b", KeyC: "c", KeyD: "d", KeyE: "e", KeyF: "f", KeyG: "g", KeyH: "h",
      KeyI: "i", KeyJ: "j", KeyK: "k", KeyL: "l", KeyM: "m", KeyN: "n", KeyO: "o", KeyP: "p",
      KeyQ: "q", KeyR: "r", KeyS: "s", KeyT: "t", KeyU: "u", KeyV: "v", KeyW: "w", KeyX: "x",
      KeyY: "y", KeyZ: "z",
      Digit0: "0", Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4",
      Digit5: "5", Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9",
      Backquote: String.fromCharCode(96), Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]",
      Backslash: String.fromCharCode(92), Semicolon: ";", Quote: String.fromCharCode(39), Comma: ",", Period: ".", Slash: "/",
      IntlBackslash: "§",
    };
    replaceMethod(Keyboard.prototype, "getLayoutMap", (origGetLayoutMap) => async function getLayoutMap() {
      const realMap = await origGetLayoutMap.call(this);
      if (!realMap || typeof realMap.get !== "function") return realMap;
      const targetLayout = US_KEYBOARD_LAYOUT;
      const layoutMapInstance = new Map(Object.entries(targetLayout));
      const origGet = realMap.get.bind(realMap);
      const origHas = realMap.has.bind(realMap);
      realMap.get = nativeLike(function get(key) {
        if (key in targetLayout) return targetLayout[key];
        return origGet(key);
      }, realMap.get, "get", 1);
      realMap.has = nativeLike(function has(key) {
        if (key in targetLayout) return true;
        return origHas ? Boolean(origHas(key)) : false;
      }, realMap.has, "has", 1);
      realMap.entries = nativeLike(function entries() {
        return layoutMapInstance.entries();
      }, realMap.entries, "entries", 0);
      realMap.keys = nativeLike(function keys() {
        return layoutMapInstance.keys();
      }, realMap.keys, "keys", 0);
      realMap.values = nativeLike(function values() {
        return layoutMapInstance.values();
      }, realMap.values, "values", 0);
      realMap.forEach = nativeLike(function forEach(callback, thisArg) {
        for (const [k, v] of layoutMapInstance.entries()) {
          callback.call(thisArg, v, k, realMap);
        }
      }, realMap.forEach, "forEach", 1);
      realMap[Symbol.iterator] = realMap.entries;
      return realMap;
    });
  }

  // --- permissions consistency (Notification.permission vs permissions.query) ---
  try {
    const permProto = typeof Permissions !== "undefined" ? Permissions.prototype : (typeof navigator !== "undefined" && navigator.permissions ? Object.getPrototypeOf(navigator.permissions) : null);
    if (permProto && typeof permProto.query === "function") {
      const notificationStatuses = new WeakSet();
      // Geolocation permission policy (Roxy geoLocation mode 对齐): the editor's geoPermission
      // switch forces the reported PermissionStatus. 'granted' pairs with the CDP coordinate
      // override (tab-apply Browser.setPermission is the native layer; this mirrors it for
      // hosts where that command is unavailable), 'denied' answers denied before any prompt.
      const geoStatuses = new WeakSet();
      const forcedGeoState = (CFG.geoPermission === "denied" || CFG.geoPermission === "granted") ? CFG.geoPermission : null;
      if (typeof PermissionStatus !== "undefined" && PermissionStatus.prototype) {
        const stateDesc = Object.getOwnPropertyDescriptor(PermissionStatus.prototype, "state");
        if (stateDesc && typeof stateDesc.get === "function") {
          const origStateGet = stateDesc.get;
          const patchedStateGet = nativeLike(function state() {
            if (forcedGeoState && geoStatuses.has(this)) return forcedGeoState;
            if (notificationStatuses.has(this) && typeof Notification !== "undefined") {
              return Notification.permission === "default" ? "prompt" : Notification.permission;
            }
            return origStateGet.call(this);
          }, origStateGet, "get state", 0);
          Object.defineProperty(PermissionStatus.prototype, "state", {
            configurable: true,
            enumerable: true,
            get: patchedStateGet,
          });
        }
      }
      replaceMethod(permProto, "query", (origQuery) => async function query(descriptor) {
        const status = await origQuery.call(this, descriptor);
        if (descriptor && descriptor.name === 'notifications') {
          if (status) notificationStatuses.add(status);
        }
        if (status && forcedGeoState && descriptor && descriptor.name === 'geolocation') {
          geoStatuses.add(status);
        }
        return status;
      });
    }
  } catch (_) {}

  // --- geolocation API policy ---
  // 'denied' keeps the native shape: callbacks fire asynchronously, the error object is a
  // GeolocationPositionError with code 1, watchPosition yields no id. Without this the host
  // flow would still raise the native prompt and a user click would leak real coordinates.
  if (CFG.geoPermission === "denied") {
    try {
      const geo = typeof navigator !== "undefined" ? navigator.geolocation : null;
      if (geo && typeof Geolocation !== "undefined" && Geolocation.prototype) {
        const makeGeoError = () => {
          const err = (typeof GeolocationPositionError !== "undefined" && GeolocationPositionError.prototype)
            ? Object.create(GeolocationPositionError.prototype)
            : {};
          Object.defineProperty(err, "code", { value: 1, enumerable: true });
          Object.defineProperty(err, "message", { value: "User denied Geolocation", enumerable: true });
          return err;
        };
        const denyPosition = () => function getCurrentPosition(success, error) {
          if (typeof error === "function") {
            setTimeout(() => {
              try { error.call(undefined, makeGeoError()); } catch (_) {}
            }, 0);
          }
        };
        replaceMethod(Geolocation.prototype, "getCurrentPosition", (original) => denyPosition());
        replaceMethod(Geolocation.prototype, "watchPosition", (original) => function watchPosition(success, error) {
          denyPosition()(success, error);
          return 0;
        });
      }
    } catch (_) {}
  }

  // --- window.chrome presence ---
  try {
    if (CFG.engine !== 'firefox' && typeof window !== "undefined") {
      if (isIosPersona) {
        try {
          Object.defineProperty(window, "chrome", {
            value: undefined,
            writable: false,
          });
        } catch (_) {
          try { window.chrome = undefined; } catch (_) {}
        }
        try {
          if (typeof Window !== "undefined" && Window.prototype) {
            delete Window.prototype.chrome;
          }
        } catch (_) {}
        try { delete globalThis.chrome; } catch (_) {}
        if (typeof window.chrome !== "undefined" && window.chrome) {
          try { delete window.chrome.app; } catch (_) {}
          try { delete window.chrome.loadTimes; } catch (_) {}
          try { delete window.chrome.csi; } catch (_) {}
          try { window.chrome = undefined; } catch (_) {}
        }
        try {
          replaceMethod(Object.prototype, "hasOwnProperty", (orig) => function hasOwnProperty(prop) {
            if (this === window && (prop === "chrome" || prop === "loadTimes" || prop === "csi" || prop === "app")) return false;
            return orig.call(this, prop);
          });
          if (typeof Object.hasOwn === "function") {
            const origHasOwn = Object.hasOwn;
            Object.defineProperty(Object, "hasOwn", {
              configurable: true,
              writable: true,
              value: nativeLike(function hasOwn(obj, prop) {
                if (obj === window && (prop === "chrome" || prop === "loadTimes" || prop === "csi" || prop === "app")) return false;
                return origHasOwn(obj, prop);
              }, origHasOwn, "hasOwn", 2),
            });
          }
          const origGetDesc = Object.getOwnPropertyDescriptor;
          Object.defineProperty(Object, "getOwnPropertyDescriptor", {
            configurable: true,
            writable: true,
            value: nativeLike(function getOwnPropertyDescriptor(obj, prop) {
              if (obj === window && prop === "chrome") return undefined;
              return origGetDesc(obj, prop);
            }, origGetDesc, "getOwnPropertyDescriptor", 2),
          });
          if (typeof Reflect !== "undefined" && typeof Reflect.getOwnPropertyDescriptor === "function") {
            const origReflectGetDesc = Reflect.getOwnPropertyDescriptor;
            Object.defineProperty(Reflect, "getOwnPropertyDescriptor", {
              configurable: true,
              writable: true,
              value: nativeLike(function getOwnPropertyDescriptor(obj, prop) {
                if (obj === window && prop === "chrome") return undefined;
                return origReflectGetDesc(obj, prop);
              }, origReflectGetDesc, "getOwnPropertyDescriptor", 2),
            });
          }
          if (typeof Reflect !== "undefined" && typeof Reflect.has === "function") {
            const origReflectHas = Reflect.has;
            Object.defineProperty(Reflect, "has", {
              configurable: true,
              writable: true,
              value: nativeLike(function has(obj, prop) {
                if (obj === window && prop === "chrome") return false;
                return origReflectHas(obj, prop);
              }, origReflectHas, "has", 2),
            });
          }
          const origGetNames = Object.getOwnPropertyNames;
          Object.defineProperty(Object, "getOwnPropertyNames", {
            configurable: true,
            writable: true,
            value: nativeLike(function getOwnPropertyNames(obj) {
              const names = origGetNames(obj);
              if (obj === window) return names.filter((n) => n !== "chrome");
              return names;
            }, origGetNames, "getOwnPropertyNames", 1),
          });
        } catch (_) {}
      } else {
        if (!window.chrome) window.chrome = {};
        if (isAndroidPersona) {
          try { delete window.chrome.app; } catch (_) {}
        } else if (!window.chrome.app) {
          const noop = () => {};
          window.chrome.app = {
            isInstalled: false,
            InstallState: { DISABLED: "disabled", INSTALLED: "installed", NOT_INSTALLED: "not_installed" },
            RunningState: { CANNOT_RUN: "cannot_run", READY_TO_RUN: "ready_to_run", RUNNING: "running" },
            getDetails: nativeLike(noop, null, "getDetails", 0),
            getIsInstalled: nativeLike(() => false, null, "getIsInstalled", 0),
            installState: nativeLike((cb) => { if (typeof cb === 'function') cb('not_installed'); }, null, "installState", 1),
            runningState: nativeLike(() => "cannot_run", null, "runningState", 0),
          };
        }
        if (typeof window.chrome.csi !== 'function') {
          try {
            window.chrome.csi = nativeLike(function csi() {
              const timing = (typeof performance !== 'undefined' && performance.timing) || {};
              const startE = timing.navigationStart || Date.now();
              const onloadT = timing.loadEventEnd || timing.domContentLoadedEventEnd || startE;
              const pageT = (typeof performance !== 'undefined' && performance['now']) ? performance['now']() : (Date.now() - startE);
              return { startE, onloadT, pageT, tran: 15 };
            }, null, 'csi', 0);
          } catch (_) {}
        }
        if (typeof window.chrome.loadTimes !== 'function') {
          try {
            window.chrome.loadTimes = nativeLike(function loadTimes() {
              const timing = (typeof performance !== 'undefined' && performance.timing) || {};
              const navStart = (timing.navigationStart || Date.now()) / 1000;
              const loadEnd = (timing.loadEventEnd || timing.domContentLoadedEventEnd || Date.now()) / 1000;
              return {
                requestTime: navStart,
                startLoadTime: navStart,
                commitLoadTime: 0,
                finishDocumentLoadTime: loadEnd,
                finishLoadTime: loadEnd,
                firstPaintTime: 0,
                firstPaintAfterLoadTime: 0,
                navigationType: 'Other',
                wasFetchedViaSpdy: false,
                wasNpnNegotiated: false,
                npnNegotiatedProtocol: '',
                wasAlternateProtocolAvailable: false,
                connectionInfo: 'unknown',
              };
            }, null, 'loadTimes', 0);
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

`;
