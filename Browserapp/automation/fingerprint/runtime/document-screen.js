'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- screen ---
  try {
    const s = CFG.screen || {};
    const baseScreenWidth = Number(s.width) || 0;
    const baseScreenHeight = Number(s.height) || 0;
    const baseAvailWidth = Number(s.availWidth) || baseScreenWidth;
    const baseAvailHeight = Number(s.availHeight) || (baseScreenHeight ? Math.max(0, baseScreenHeight - 40) : 0);

    const rawWinWidthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'innerWidth');
    const rawInnerWidthGet = rawWinWidthDesc?.get ? () => rawWinWidthDesc.get.call(window) : null;
    const rawWinHeightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'innerHeight');
    const rawInnerHeightGet = rawWinHeightDesc?.get ? () => rawWinHeightDesc.get.call(window) : null;

    const rawVisualViewport = window.visualViewport;
    const rawVisualWidthDesc = rawVisualViewport ? (Object.getOwnPropertyDescriptor(rawVisualViewport, 'width') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(rawVisualViewport), 'width')) : null;
    const rawVisualWidthGet = rawVisualWidthDesc?.get ? () => rawVisualWidthDesc.get.call(rawVisualViewport) : null;
    const rawVisualHeightDesc = rawVisualViewport ? (Object.getOwnPropertyDescriptor(rawVisualViewport, 'height') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(rawVisualViewport), 'height')) : null;
    const rawVisualHeightGet = rawVisualHeightDesc?.get ? () => rawVisualHeightDesc.get.call(rawVisualViewport) : null;

    const liveViewportSize = (axis, fallback) => {
      try {
        if (axis === 'width') {
          if (typeof rawVisualWidthGet === 'function') {
            const vw = Number(rawVisualWidthGet());
            if (Number.isFinite(vw) && vw > 0) return Math.round(vw);
          }
          if (typeof rawInnerWidthGet === 'function') {
            const rawW = Number(rawInnerWidthGet());
            if (Number.isFinite(rawW) && rawW > 0) return Math.round(rawW);
          }
        } else {
          if (typeof rawVisualHeightGet === 'function') {
            const vh = Number(rawVisualHeightGet());
            if (Number.isFinite(vh) && vh > 0) return Math.round(vh);
          }
          if (typeof rawInnerHeightGet === 'function') {
            const rawH = Number(rawInnerHeightGet());
            if (Number.isFinite(rawH) && rawH > 0) return Math.round(rawH);
          }
        }
        const root = document && document.documentElement;
        const rootVal = axis === 'width' ? Number(root?.clientWidth) : Number(root?.clientHeight);
        if (Number.isFinite(rootVal) && rootVal > 0) return Math.round(rootVal);
        const body = document && document.body;
        const bodyVal = axis === 'width' ? Number(body?.clientWidth) : Number(body?.clientHeight);
        if (Number.isFinite(bodyVal) && bodyVal > 0) return Math.round(bodyVal);
      } catch (_) {}
      return fallback;
    };

    // A phone has no desktop title bar or window chrome: outerWidth/outerHeight track the layout
    // viewport, the touch surface has to exist as own properties rather than only through
    // navigator.maxTouchPoints, and screen.* stays the panel instead of growing with the window.
    const dynamicScreen = {
      width: () => (MOBILE && baseScreenWidth ? baseScreenWidth : (baseScreenWidth ? Math.max(baseScreenWidth, liveViewportSize('width', baseScreenWidth)) : liveViewportSize('width', 1920))),
      height: () => (MOBILE && baseScreenHeight ? baseScreenHeight : (baseScreenHeight ? Math.max(baseScreenHeight, liveViewportSize('height', baseScreenHeight)) : liveViewportSize('height', 1080))),
      availWidth: () => (MOBILE && baseAvailWidth ? baseAvailWidth : (baseAvailWidth ? Math.max(baseAvailWidth, liveViewportSize('width', baseAvailWidth)) : liveViewportSize('width', 1920))),
      availHeight: () => (MOBILE && baseAvailHeight ? baseAvailHeight : (baseAvailHeight ? Math.max(baseAvailHeight, liveViewportSize('height', baseAvailHeight)) : liveViewportSize('height', 1040))),
      availLeft: () => s.availLeft ?? 0,
      availTop: () => s.availTop ?? 0,
      colorDepth: () => s.colorDepth ?? 24,
      pixelDepth: () => s.pixelDepth ?? 24,
    };

    for (const [key, getter] of Object.entries(dynamicScreen)) {
      try {
        const nativeG = makeNativeGetter(key, getter, "screen");
        Object.defineProperty(Screen.prototype, key, { configurable: true, enumerable: true, get: nativeG });
        if (typeof screen !== "undefined") {
          try { delete screen[key]; } catch (_) {}
        }
      } catch (_) {}
    }
    // Shape parity (P0-1): in real Chromium these metrics are enumerable
    // accessors on Window.prototype, NOT own properties of the window
    // instance. Installing them as own props made Object.getOwnPropertyNames
    // / Object.keys(window) reveal the persona (extra own keys that no stock
    // browser has). Install on the prototype and delete any same-named own
    // property so the shape probes see a stock window.
    const defineWindowMetric = (key, desc) => {
      try {
        const proto = Object.getPrototypeOf(window);
        if (proto && proto !== Object.prototype) {
          Object.defineProperty(proto, key, { configurable: true, enumerable: true, get: desc.get, set: desc.set });
          try { delete window[key]; } catch (_) {}
        } else {
          Object.defineProperty(window, key, desc);
        }
      } catch (_) {
        try { Object.defineProperty(window, key, desc); } catch (_) {}
      }
    };
    try { defineWindowMetric('devicePixelRatio', nativeAccessor('devicePixelRatio', { configurable: true, get: () => s.devicePixelRatio || 1 })); } catch (_) {}
    for (const [key, value] of Object.entries({ screenX: s.screenX, screenY: s.screenY, screenLeft: s.screenX, screenTop: s.screenY })) {
      try { defineWindowMetric(key, nativeAccessor(key, { configurable: true, get: () => value || 0 })); } catch (_) {}
    }

    const initialInnerWidth = Number(window.innerWidth) || Number(s.availWidth) || Number(s.width) || 1;
    const initialInnerHeight = Number(window.innerHeight) || Number(s.availHeight) || Number(s.height) || 1;
    try { defineWindowMetric('innerWidth', nativeAccessor('innerWidth', { configurable: true, get: () => liveViewportSize('width', initialInnerWidth) })); } catch (_) {}
    try { defineWindowMetric('innerHeight', nativeAccessor('innerHeight', { configurable: true, get: () => liveViewportSize('height', initialInnerHeight) })); } catch (_) {}
    const isFullscreen = () => {
      try { return Boolean(document && (document.fullscreenElement || document.webkitFullscreenElement)); }
      catch (_) { return false; }
    };
    const getOuterHeight = () => {
      const h = liveViewportSize('height', initialInnerHeight);
      return (MOBILE || isFullscreen()) ? h : (h + 88);
    };
    const getOuterWidth = () => {
      const w = liveViewportSize('width', initialInnerWidth);
      return (MOBILE || isFullscreen()) ? w : (w + 16);
    };
    try { defineWindowMetric('outerWidth', nativeAccessor('outerWidth', { configurable: true, get: getOuterWidth })); } catch (_) {}
    try { defineWindowMetric('outerHeight', nativeAccessor('outerHeight', { configurable: true, get: getOuterHeight })); } catch (_) {}
    if (MOBILE) {
      // ontouchstart genuinely is an own window property in stock browsers
      // (it round-trips through the attribute), so it stays on the instance —
      // but enumerable, matching the real shape.
      try { Object.defineProperty(window, 'ontouchstart', nativeAccessor('ontouchstart', { configurable: true, enumerable: true, get: () => null })); } catch (_) {}
      try { defineWindowMetric('orientation', nativeAccessor('orientation', { configurable: true, get: () => 0 })); } catch (_) {}

    }

    try {
      if (typeof window.matchMedia === "function") {
        const origMatchMedia = window.matchMedia.bind(window);
        // F-10: pages call matchMedia on every resize/layout pass (frameworks
        // included); the four feature regexes are fixed, so they are built
        // once instead of recompiled per call.
        const RE_DEVICE_WIDTH = /\\((min-|max-)?device-width:\\s*([\\d.]+)px\\)/;
        const RE_DEVICE_HEIGHT = /\\((min-|max-)?device-height:\\s*([\\d.]+)px\\)/;
        const RE_WEBKIT_DPR = /\\(-webkit-(min-|max-)?device-pixel-ratio:\\s*([\\d.]+)\\)/;
        const RE_RESOLUTION = /\\((min-|max-)?resolution:\\s*([\\d.]+)(dppx|dpi)\\)/;
        // A plain object literal is not a MediaQueryList: Object.getPrototypeOf(mql) and
        // an instanceof MediaQueryList check both give the patch away, and the listener methods
        // silently do nothing. Take a real MediaQueryList from the engine and override only the
        // two values we need, so the prototype chain, brand checks and change events stay real.
        const spoofMql = (query, matches) => {
          const real = origMatchMedia(String(query));
          if (real.matches === matches) return real;
          try {
            // Re-query with a expression the engine itself resolves to the value we need, so the
            // object keeps live change notifications instead of a frozen boolean.
            const forced = origMatchMedia(matches ? 'all' : 'not all');
            Object.defineProperty(forced, 'media', {
              configurable: true, enumerable: true, get: nativeLike(function media() { return String(query); }, null, 'media', 0),
            });
            if (forced.matches !== matches) {
              Object.defineProperty(forced, 'matches', {
                configurable: true, enumerable: true, get: nativeLike(function matches() { return matches; }, null, 'matches', 0),
              });
            }
            return forced;
          } catch (_) {}
          try {
            Object.defineProperty(real, 'matches', {
              configurable: true, enumerable: true, get: nativeLike(function matches() { return matches; }, null, 'matches', 0),
            });
          } catch (_) {}
          return real;
        };
        const patchedMatchMedia = {
          matchMedia(query) {
            const q = String(query || "").toLowerCase();
            const sw = dynamicScreen.width();
            const sh = dynamicScreen.height();
            const mDevW = q.match(RE_DEVICE_WIDTH);
            if (mDevW) {
              const type = mDevW[1] || "";
              const val = parseFloat(mDevW[2]);
              let matches = false;
              if (type === "min-") matches = sw >= val;
              else if (type === "max-") matches = sw <= val;
              else matches = Math.abs(sw - val) < 1;
              return spoofMql(query, matches);
            }
            const mDevH = q.match(RE_DEVICE_HEIGHT);
            if (mDevH) {
              const type = mDevH[1] || "";
              const val = parseFloat(mDevH[2]);
              let matches = false;
              if (type === "min-") matches = sh >= val;
              else if (type === "max-") matches = sh <= val;
              else matches = Math.abs(sh - val) < 1;
              return spoofMql(query, matches);
            }
            const mDpr = q.match(RE_WEBKIT_DPR);
            if (mDpr) {
              const type = mDpr[1] || "";
              const val = parseFloat(mDpr[2]);
              const curDpr = Number(s.devicePixelRatio) || 1;
              let matches = false;
              if (type === "min-") matches = curDpr >= val;
              else if (type === "max-") matches = curDpr <= val;
              else matches = Math.abs(curDpr - val) < 0.01;
              return spoofMql(query, matches);
            }
            const mRes = q.match(RE_RESOLUTION);
            if (mRes) {
              const type = mRes[1] || "";
              const val = parseFloat(mRes[2]);
              const unit = mRes[3];
              const curDpr = Number(s.devicePixelRatio) || 1;
              const curVal = unit === "dpi" ? curDpr * 96 : curDpr;
              let matches = false;
              if (type === "min-") matches = curVal >= val;
              else if (type === "max-") matches = curVal <= val;
              else matches = Math.abs(curVal - val) < (unit === "dpi" ? 1 : 0.01);
              return spoofMql(query, matches);
            }
            return origMatchMedia(query);
          }
        }.matchMedia;
        nativeSource.set(patchedMatchMedia, "function matchMedia() { [native code] }");
        Object.defineProperty(window, "matchMedia", { configurable: true, writable: true, value: patchedMatchMedia });
      }
    } catch (_) {}

    const patchedSubWindows = new WeakSet();
    const patchSubWindow = (subWin) => {
      if (!subWin || subWin === window || patchedSubWindows.has(subWin)) return;
      patchedSubWindows.add(subWin);
      try {
        // Register the sub-window's GENUINE instances before this realm's getters are
        // installed into the child: the getters close over this closure's predicates, and
        // only the registered real navigator/screen may read through them — synthetic
        // receivers built on the child's prototypes stay rejected with "Illegal invocation".
        if (subWin.navigator) {
          try { crossRealmApproved.add(subWin.navigator); } catch (_) {}
        }
        if (subWin.screen) {
          try { crossRealmApproved.add(subWin.screen); } catch (_) {}
        }
        const subNav = subWin.Navigator && subWin.Navigator.prototype;
        if (subNav) {
          for (const [key, desc] of Object.entries(navPatch)) {
            const g = makeNativeGetter(key, desc.get, "navigator", subWin);
            Object.defineProperty(subNav, key, { configurable: true, enumerable: true, get: g });
            if (subWin.navigator) {
              try { delete subWin.navigator[key]; } catch (_) {}
            }
          }
          if (typeof Navigator !== "undefined" && Navigator.prototype) {
            for (const k of ['userAgentData', 'plugins', 'mimeTypes']) {
              const d = Object.getOwnPropertyDescriptor(Navigator.prototype, k);
              if (d) {
                try { Object.defineProperty(subNav, k, d); } catch (_) {}
                if (subWin.navigator) { try { delete subWin.navigator[k]; } catch (_) {} }
              }
            }
          }
          const subUa = CFG.userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "");
          const subAppVer = CFG.appVersion || (subUa.startsWith("Mozilla/") ? subUa.slice(8) : subUa);
          const gUa = makeNativeGetter("userAgent", () => subUa, "navigator", subWin);
          const gApp = makeNativeGetter("appVersion", () => subAppVer, "navigator", subWin);
          Object.defineProperty(subNav, "userAgent", { configurable: true, enumerable: true, get: gUa });
          Object.defineProperty(subNav, "appVersion", { configurable: true, enumerable: true, get: gApp });
          if (subWin.navigator) {
            try { delete subWin.navigator.userAgent; } catch (_) {}
            try { delete subWin.navigator.appVersion; } catch (_) {}
          }
        }
        const subScreen = subWin.Screen && subWin.Screen.prototype;
        if (subScreen) {
          for (const [key, getter] of Object.entries(dynamicScreen)) {
            const g = makeNativeGetter(key, getter, "screen", subWin);
            Object.defineProperty(subScreen, key, { configurable: true, enumerable: true, get: g });
            if (subWin.screen) {
              try { delete subWin.screen[key]; } catch (_) {}
            }
          }
        }
        if (isIosPersona) {
          try {
            Object.defineProperty(subWin.Window?.prototype || Object.prototype, "chrome", {
              get() { return undefined; },
              configurable: true,
            });
          } catch (_) {}
          try { delete subWin.chrome;
            try { subWin.chrome = undefined; } catch (_) {} } catch (_) {}
          if (typeof subWin.chrome !== "undefined" || subWin.chrome) {
            try { delete subWin.chrome.app; } catch (_) {}
            try { delete subWin.chrome.loadTimes; } catch (_) {}
            try { delete subWin.chrome.csi; } catch (_) {}
            try { subWin.chrome = undefined; } catch (_) {}
          }
        } else if (subWin.chrome) {
          if (isAndroidPersona) {
            try { delete subWin.chrome.app; } catch (_) {}
          }
          if (typeof subWin.chrome.csi !== 'function') {
            try {
              subWin.chrome.csi = nativeLike(function csi() {
                const timing = (typeof performance !== 'undefined' && performance.timing) || {};
                const startE = timing.navigationStart || Date.now();
                const onloadT = timing.loadEventEnd || timing.domContentLoadedEventEnd || startE;
                const pageT = (typeof performance !== 'undefined' && performance['now']) ? performance['now']() : (Date.now() - startE);
                return { startE, onloadT, pageT, tran: 15 };
              }, null, 'csi', 0);
            } catch (_) {}
          }
          if (typeof subWin.chrome.loadTimes !== 'function') {
            try {
              subWin.chrome.loadTimes = nativeLike(function loadTimes() {
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
        } else if (!subWin.chrome && typeof window !== "undefined" && window.chrome) {
          try { subWin.chrome = window.chrome; } catch (_) {}
        }
        if (subWin.Function && subWin.Function.prototype) {
          try {
            const origSubToString = subWin.Function.prototype.toString;
            // The frame can carry its own framework that replaced toString and calls back into
            // this wrapper. A re-entrant call is answered from the bridge cache so the cycle
            // cannot grow past the second hop.
            let subToStringReentryDepth = 0;
            const subHolder = {
              toString(...args) {
                const secret = args[0];
                if (subToStringReentryDepth > 0) {
                  if (nativeSource.has(this)) {
                    if (secret === BRIDGE_TOKEN) return { bridge: true, token: BRIDGE_TOKEN, nativeText: nativeSource.get(this) };
                    return nativeSource.get(this);
                  }
                  return "function " + (this && typeof this.name === "string" ? this.name : "toString") + "() { [native code] }";
                }
                subToStringReentryDepth += 1;
                try {
                  if (secret === BRIDGE_TOKEN) {
                    if (nativeSource.has(this)) return { bridge: true, token: BRIDGE_TOKEN, nativeText: nativeSource.get(this) };
                    try {
                      const inherited = origSubToString.call(this, ...args);
                      if (inherited && typeof inherited === "object" && inherited.bridge === true) return inherited;
                    } catch (_) {}
                    return null;
                  }
                  if (nativeSource.has(this)) return nativeSource.get(this);
                  try {
                    if (typeof this.toString === "function" && this.toString !== patchedSubToString) {
                      const crossRealm = this.toString(BRIDGE_TOKEN);
                      if (crossRealm && typeof crossRealm === "object" && crossRealm.bridge === true && crossRealm.nativeText) {
                        return crossRealm.nativeText;
                      }
                    }
                  } catch (_) {}
                  return origSubToString.call(this, ...args);
                } finally {
                  subToStringReentryDepth -= 1;
                }
              }
            };
            const patchedSubToString = subHolder.toString;
            nativeSource.set(patchedSubToString, "function toString() { [native code] }");
            Object.defineProperty(subWin.Function.prototype, "toString", {
              configurable: true,
              writable: true,
              value: patchedSubToString,
            });
            // Re-arm the font-blob token channel that this wrapper just buried. The gate exposes
            // its installer on the realm global; without it the lazy payload handshake dead-ends
            // and Local Font Access blob() returns empty inside child frames.
            try {
              const rearm = subWin.__obFontGateReinstallToString;
              if (typeof rearm === "function") rearm.call(subWin);
            } catch (_) {}
          } catch (_) {}
        }
        if (isIosPersona) {
          try {
            if (subNav) {
              delete subNav.userAgentData;
              delete subNav.connection;
              delete subNav.getBattery;
              delete subNav.usb;
              delete subNav.hid;
              delete subNav.bluetooth;
              delete subNav.serial;
              delete subNav.deviceMemory;
            }
            if (subWin.navigator) {
              delete subWin.navigator.userAgentData;
              delete subWin.navigator.connection;
              delete subWin.navigator.getBattery;
              delete subWin.navigator.usb;
              delete subWin.navigator.hid;
              delete subWin.navigator.bluetooth;
              delete subWin.navigator.serial;
              delete subWin.navigator.deviceMemory;
            }
            if ('NavigatorUAData' in subWin) delete subWin.NavigatorUAData;
            delete subWin.NetworkInformation;
            delete subWin.BatteryManager;
            delete subWin.USB;
            delete subWin.HID;
            delete subWin.Bluetooth;
            delete subWin.Serial;
            delete subWin.GPU;
            delete subWin.GPUAdapter;
            delete subWin.GPUDevice;
            if (subWin.Navigator?.prototype) {
              delete subWin.Navigator.prototype.gpu;
            }
            if (subNav) {
              delete subNav.gpu;
            }
            delete subWin.chrome;
            if (typeof subWin.GestureEvent === "undefined" && typeof window.GestureEvent !== "undefined") {
              subWin.GestureEvent = window.GestureEvent;
            }
          } catch (_) {}
        }
        if (isMobilePersona && subNav) {
          try {
            const emptyPlugins = Object.create(typeof PluginArray !== "undefined" ? PluginArray.prototype : Object.prototype);
            Object.defineProperty(emptyPlugins, "length", { value: 0, configurable: true, enumerable: false, writable: false });
            const emptyMimeTypes = Object.create(typeof MimeTypeArray !== "undefined" ? MimeTypeArray.prototype : Object.prototype);
            Object.defineProperty(emptyMimeTypes, "length", { value: 0, configurable: true, enumerable: false, writable: false });
            const pGetter = makeNativeGetter("plugins", () => emptyPlugins, "navigator", subWin);
            Object.defineProperty(subNav, "plugins", { configurable: true, enumerable: true, get: pGetter, set: undefined });
            const mGetter = makeNativeGetter("mimeTypes", () => emptyMimeTypes, "navigator", subWin);
            Object.defineProperty(subNav, "mimeTypes", { configurable: true, enumerable: true, get: mGetter, set: undefined });
            const pdfG = makeNativeGetter("pdfViewerEnabled", () => false, "navigator", subWin);
            Object.defineProperty(subNav, "pdfViewerEnabled", { configurable: true, enumerable: true, get: pdfG, set: undefined });
          } catch (_) {}
        }
        if (subWin.HTMLIFrameElement) {
          try {
            const desc = Object.getOwnPropertyDescriptor(subWin.HTMLIFrameElement.prototype, "contentWindow");
            if (desc && typeof desc.get === "function") {
              const origCW = desc.get;
              let patchedSubCW;
              const subHolderCW = {
                get contentWindow() {
                  try {
                    const nestedWin = origCW.call(this);
                    if (nestedWin) patchSubWindow(nestedWin);
                    return nestedWin;
                  } catch (err) {
                    stripStackFrame(err, patchedSubCW, "get contentWindow");
                    throw err;
                  }
                }
              };
              patchedSubCW = Object.getOwnPropertyDescriptor(subHolderCW, "contentWindow").get;
              try { Object.defineProperty(patchedSubCW, "name", { configurable: true, value: "get contentWindow" }); } catch (_) {}
              try { Object.defineProperty(patchedSubCW, "length", { configurable: true, value: 0 }); } catch (_) {}
              nativeSource.set(patchedSubCW, "function get contentWindow() { [native code] }");
              Object.defineProperty(subWin.HTMLIFrameElement.prototype, "contentWindow", {
                configurable: true,
                enumerable: true,
                get: patchedSubCW,
              });
            }
            const docDesc = Object.getOwnPropertyDescriptor(subWin.HTMLIFrameElement.prototype, "contentDocument");
            if (docDesc && typeof docDesc.get === "function") {
              const origCD = docDesc.get;
              let patchedSubCD;
              const subHolderCD = {
                get contentDocument() {
                  try {
                    const nestedDoc = origCD.call(this);
                    if (nestedDoc && nestedDoc.defaultView) patchSubWindow(nestedDoc.defaultView);
                    return nestedDoc;
                  } catch (err) {
                    stripStackFrame(err, patchedSubCD, "get contentDocument");
                    throw err;
                  }
                }
              };
              patchedSubCD = Object.getOwnPropertyDescriptor(subHolderCD, "contentDocument").get;
              try { Object.defineProperty(patchedSubCD, "name", { configurable: true, value: "get contentDocument" }); } catch (_) {}
              try { Object.defineProperty(patchedSubCD, "length", { configurable: true, value: 0 }); } catch (_) {}
              nativeSource.set(patchedSubCD, "function get contentDocument() { [native code] }");
              Object.defineProperty(subWin.HTMLIFrameElement.prototype, "contentDocument", {
                configurable: true,
                enumerable: true,
                get: patchedSubCD,
              });
            }
          } catch (_) {}
        }
        if (typeof subWin.open === "function") {
          const origSubOpen = subWin.open;
          const origSubDesc = Object.getOwnPropertyDescriptor(subWin, "open");
          const patchedSubOpen = nativeLike(function open(...args) {
            const nestedWin = origSubOpen.apply(this, args);
            if (nestedWin) {
              try { patchSubWindow(nestedWin); } catch (_) {}
            }
            return nestedWin;
          }, origSubOpen, "open", origSubOpen.length);
          Object.defineProperty(subWin, "open", {
            configurable: origSubDesc ? origSubDesc.configurable : true,
            writable: origSubDesc ? origSubDesc.writable : true,
            enumerable: origSubDesc ? origSubDesc.enumerable : false,
            value: patchedSubOpen,
          });
        }
        for (const hook of subWindowSyncHooks) {
          try { hook(subWin); } catch (_) {}
        }
      } catch (_) {}
    };

    try {
      if (typeof HTMLIFrameElement !== "undefined") {
        const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentWindow");
        if (desc && typeof desc.get === "function") {
          const origCW = desc.get;
          let patchedCW;
          const holderCW = {
            get contentWindow() {
              try {
                const subWin = origCW.call(this);
                if (subWin) patchSubWindow(subWin);
                return subWin;
              } catch (err) {
                stripStackFrame(err, patchedCW, "get contentWindow");
                throw err;
              }
            }
          };
          patchedCW = Object.getOwnPropertyDescriptor(holderCW, "contentWindow").get;
          try { Object.defineProperty(patchedCW, "name", { configurable: true, value: "get contentWindow" }); } catch (_) {}
          try { Object.defineProperty(patchedCW, "length", { configurable: true, value: 0 }); } catch (_) {}
          nativeSource.set(patchedCW, "function get contentWindow() { [native code] }");
          Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
            configurable: true,
            enumerable: true,
            get: patchedCW,
          });
        }
        const docDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "contentDocument");
        if (docDesc && typeof docDesc.get === "function") {
          const origCD = docDesc.get;
          let patchedCD;
          const holderCD = {
            get contentDocument() {
              try {
                const subDoc = origCD.call(this);
                if (subDoc && subDoc.defaultView) patchSubWindow(subDoc.defaultView);
                return subDoc;
              } catch (err) {
                stripStackFrame(err, patchedCD, "get contentDocument");
                throw err;
              }
            }
          };
          patchedCD = Object.getOwnPropertyDescriptor(holderCD, "contentDocument").get;
          try { Object.defineProperty(patchedCD, "name", { configurable: true, value: "get contentDocument" }); } catch (_) {}
          try { Object.defineProperty(patchedCD, "length", { configurable: true, value: 0 }); } catch (_) {}
          nativeSource.set(patchedCD, "function get contentDocument() { [native code] }");
          Object.defineProperty(HTMLIFrameElement.prototype, "contentDocument", {
            configurable: true,
            enumerable: true,
            get: patchedCD,
          });
        }

        const sboxBootstrap = '<script>(' + String(function(cfg) {
          try {
            try {
              const curScript = document.currentScript;
              if (curScript && curScript.parentNode) curScript.parentNode.removeChild(curScript);
            } catch (_) {}

            const sboxNative = new WeakMap();
            const setSboxNative = (fn, str) => {
              sboxNative.set(fn, str);
            };

            const origToString = Function.prototype.toString;
            const patchedToString = function toString(...args) {
              if (cfg.bridgeToken && args[0] === cfg.bridgeToken) {
                if (sboxNative.has(this)) return { bridge: true, nativeText: sboxNative.get(this) };
                try {
                  const inherited = origToString.call(this, ...args);
                  if (inherited && typeof inherited === "object" && inherited.bridge === true) return inherited;
                } catch (_) {}
                return null;
              }
              if (sboxNative.has(this)) return sboxNative.get(this);
              return origToString.call(this, ...args);
            };
            setSboxNative(patchedToString, "function toString() { [native code] }");
            try {
              Object.defineProperty(Function.prototype, "toString", {
                configurable: true, writable: true, value: patchedToString
              });
            } catch (_) {}

            if (typeof Navigator !== "undefined" && Navigator.prototype) {
              const nav = Navigator.prototype;
              if (cfg.platform) {
                const g = () => cfg.platform;
                setSboxNative(g, "function get platform() { [native code] }");
                Object.defineProperty(nav, "platform", { configurable: true, enumerable: true, get: g });
              }
              if (cfg.hardwareConcurrency != null) {
                const g = () => cfg.hardwareConcurrency;
                setSboxNative(g, "function get hardwareConcurrency() { [native code] }");
                Object.defineProperty(nav, "hardwareConcurrency", { configurable: true, enumerable: true, get: g });
              }
              if (cfg.platform === "iPhone") {
                // Real iOS Safari (WebKit) has no navigator.deviceMemory; mirror the main-frame
                // and sub-window iOS scrub so srcdoc frames do not resurrect a Chromium-only member.
                try { delete nav.deviceMemory; } catch (_) {}
                try { if (typeof navigator !== "undefined") delete navigator.deviceMemory; } catch (_) {}
              } else if (cfg.deviceMemory != null) {
                const g = () => Math.min(8, cfg.deviceMemory);
                setSboxNative(g, "function get deviceMemory() { [native code] }");
                Object.defineProperty(nav, "deviceMemory", { configurable: true, enumerable: true, get: g });
              }
              if (cfg.userAgent) {
                const g = () => cfg.userAgent;
                setSboxNative(g, "function get userAgent() { [native code] }");
                Object.defineProperty(nav, "userAgent", { configurable: true, enumerable: true, get: g });
              }
              if (Array.isArray(cfg.languages)) {
                const frozen = Object.freeze([...cfg.languages]);
                const gLangs = () => frozen;
                const gLang = () => frozen[0] || "en-US";
                setSboxNative(gLangs, "function get languages() { [native code] }");
                setSboxNative(gLang, "function get language() { [native code] }");
                Object.defineProperty(nav, "languages", { configurable: true, enumerable: true, get: gLangs });
                Object.defineProperty(nav, "language", { configurable: true, enumerable: true, get: gLang });
              }
            }
            if (cfg.screen && typeof Screen !== "undefined" && Screen.prototype) {
              const scr = Screen.prototype;
              if (cfg.screen.width) {
                const g = () => cfg.screen.width;
                setSboxNative(g, "function get width() { [native code] }");
                Object.defineProperty(scr, "width", { configurable: true, enumerable: true, get: g });
              }
              if (cfg.screen.height) {
                const g = () => cfg.screen.height;
                setSboxNative(g, "function get height() { [native code] }");
                Object.defineProperty(scr, "height", { configurable: true, enumerable: true, get: g });
              }
            }
            if (cfg.timezone && typeof Intl !== "undefined" && Intl.DateTimeFormat) {
              const targetTz = String(cfg.timezone).trim();
              const OrigDTF = Intl.DateTimeFormat;
              const PatchedDTF = function DateTimeFormat(locales, options) {
                const opts = Object.assign({}, options);
                if (opts.timeZone === undefined) opts.timeZone = targetTz;
                return Reflect.construct(OrigDTF, [locales, opts], new.target || PatchedDTF);
              };
              PatchedDTF.prototype = OrigDTF.prototype;
              Object.defineProperty(PatchedDTF, "prototype", { value: OrigDTF.prototype, writable: false, enumerable: false, configurable: false });
              if (OrigDTF.supportedLocalesOf) PatchedDTF.supportedLocalesOf = OrigDTF.supportedLocalesOf;
              setSboxNative(PatchedDTF, "function DateTimeFormat() { [native code] }");
              Intl.DateTimeFormat = PatchedDTF;

              const dtf = new OrigDTF("en-US", { timeZone: targetTz, timeZoneName: "longOffset" });
              const getOffset = (d) => {
                try {
                  const parts = dtf.formatToParts(d);
                  const p = parts.find(x => x.type === "timeZoneName")?.value || "";
                  const m = p.match(/^GMT([+-])(\\d{2}):(\\d{2})$/);
                  if (!m) return 0;
                  const sign = m[1] === "+" ? -1 : 1;
                  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
                } catch (_) { return 0; }
              };
              if (typeof Date !== "undefined" && Date.prototype) {
                Date.prototype.getTimezoneOffset = function getTimezoneOffset() {
                  return getOffset(this);
                };
                setSboxNative(Date.prototype.getTimezoneOffset, "function getTimezoneOffset() { [native code] }");
              }
            }
            if (cfg.webgl && typeof WebGLRenderingContext !== "undefined" && WebGLRenderingContext.prototype) {
              const origGetParam = WebGLRenderingContext.prototype.getParameter;
              WebGLRenderingContext.prototype.getParameter = function getParameter(param) {
                if (param === 0x9245 && cfg.webgl.vendor) return cfg.webgl.vendor;
                if (param === 0x9246 && cfg.webgl.renderer) return cfg.webgl.renderer;
                return origGetParam.call(this, param);
              };
              setSboxNative(WebGLRenderingContext.prototype.getParameter, "function getParameter() { [native code] }");
            }
          } catch (_) {}
        }) + ")(" + JSON.stringify({
          platform: CFG.platform,
          userAgent: CFG.userAgent,
          hardwareConcurrency: CFG.hardwareConcurrency,
          deviceMemory: CFG.deviceMemory,
          languages: CFG.languages,
          timezone: CFG.timezone,
          screen: CFG.screen,
          webgl: { vendor: CFG.webgl?.vendor, renderer: CFG.webgl?.renderer }, bridgeToken: BRIDGE_TOKEN
        }).replace(/</g, "\\u003c") + ");<\/script>";

        const cleanSrcdoc = (val) => {
          if (typeof val !== "string") return val;
          const marker = "</script>";
          const idx = val.indexOf(marker);
          if (idx !== -1 && val.startsWith("<script>(") && (val.includes(BRIDGE_TOKEN) || val.includes("sboxNative") || val.includes("setSboxNative"))) {
            return val.slice(idx + marker.length);
          }
          return val;
        };

        const rawSrcdocMap = new WeakMap();
        const srcdocDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "srcdoc");
        if (srcdocDesc && typeof srcdocDesc.set === "function") {
          const origSetSrcdoc = srcdocDesc.set;
          const origGetSrcdoc = srcdocDesc.get;
          Object.defineProperty(HTMLIFrameElement.prototype, "srcdoc", {
            configurable: true,
            enumerable: true,
            get: nativeGetter("srcdoc", function() {
              if (rawSrcdocMap.has(this)) return rawSrcdocMap.get(this);
              return cleanSrcdoc(origGetSrcdoc.call(this));
            }),
            set: nativeSetter("srcdoc", function(val) {
              rawSrcdocMap.set(this, val);
              let patched = val;
              try {
                if (typeof val === "string" && val.length > 0) {
                  patched = sboxBootstrap + val;
                }
              } catch (_) {}
              return origSetSrcdoc.call(this, patched);
            }),
          });
        }
        if (typeof Element !== "undefined" && Element.prototype.getAttribute) {
          const origGetAttribute = Element.prototype.getAttribute;
          Element.prototype.getAttribute = nativeLike(function getAttribute(name, ...args) {
            const val = origGetAttribute.call(this, name, ...args);
            if (String(name).toLowerCase() === "srcdoc") {
              if (rawSrcdocMap.has(this)) return rawSrcdocMap.get(this);
              return cleanSrcdoc(val);
            }
            return val;
          }, origGetAttribute, "getAttribute", 1);
        }
        if (typeof Element !== "undefined" && Element.prototype.getAttributeNS) {
          const origGetAttributeNS = Element.prototype.getAttributeNS;
          Element.prototype.getAttributeNS = nativeLike(function getAttributeNS(ns, name, ...args) {
            const val = origGetAttributeNS.call(this, ns, name, ...args);
            if (String(name).toLowerCase() === "srcdoc") {
              if (rawSrcdocMap.has(this)) return rawSrcdocMap.get(this);
              return cleanSrcdoc(val);
            }
            return val;
          }, origGetAttributeNS, "getAttributeNS", 2);
        }
        if (typeof Element !== "undefined" && Element.prototype.getAttributeNode) {
          const origGetAttributeNode = Element.prototype.getAttributeNode;
          Element.prototype.getAttributeNode = nativeLike(function getAttributeNode(name, ...args) {
            const node = origGetAttributeNode.call(this, name, ...args);
            if (node && String(name).toLowerCase() === "srcdoc") {
              const rawVal = rawSrcdocMap.has(this) ? rawSrcdocMap.get(this) : cleanSrcdoc(node.value);
              try {
                Object.defineProperty(node, "value", {
                  configurable: true,
                  enumerable: true,
                  get: nativeLike(function value() { return rawVal; }, null, "value", 0),
                });
              } catch (_) {}
            }
            return node;
          }, origGetAttributeNode, "getAttributeNode", 1);
        }
        if (typeof Element !== "undefined" && Element.prototype.setAttribute) {
          const origSetAttribute = Element.prototype.setAttribute;
          Element.prototype.setAttribute = nativeLike(function setAttribute(name, val, ...args) {
            if (String(name).toLowerCase() === "srcdoc" && typeof HTMLIFrameElement !== "undefined" && this instanceof HTMLIFrameElement) {
              rawSrcdocMap.set(this, String(val));
              let patched = val;
              try {
                if (typeof val === "string" && val.length > 0) {
                  patched = sboxBootstrap + val;
                }
              } catch (_) {}
              return origSetAttribute.call(this, name, patched, ...args);
            }
            return origSetAttribute.call(this, name, val, ...args);
          }, origSetAttribute, "setAttribute", 2);
        }
      }
      if (typeof window !== "undefined" && typeof window.open === "function") {
        const origWindowOpen = window.open;
        const origDesc = Object.getOwnPropertyDescriptor(window, "open");
        const patchedWindowOpen = nativeLike(function open(...args) {
          const subWin = origWindowOpen.apply(this, args);
          if (subWin) {
            try {
              const targetUrl = typeof args[0] === "string" ? args[0].trim() : "";
              if (!targetUrl || targetUrl === "about:blank") {
                patchSubWindow(subWin);
              }
            } catch (_) {}
          }
          return subWin;
        }, origWindowOpen, "open", origWindowOpen.length);
        Object.defineProperty(window, "open", {
          configurable: origDesc ? origDesc.configurable : true,
          writable: origDesc ? origDesc.writable : true,
          enumerable: origDesc ? origDesc.enumerable : false,
          value: patchedWindowOpen,
        });
      }
    } catch (_) {}
    // These live on the prototype in a real build. Shadowing them on the instance added own
    // properties that a real document/viewport never carries, so the replacements are installed on
    // the prototype and keep the original enumerability.
    try {
      const viewport = window.visualViewport;
      const viewportProto = viewport ? Object.getPrototypeOf(viewport) : null;
      if (viewportProto) {
        const baseSizes = new WeakMap();
        const baselineFor = (instance, key, nativeDesc, fallback) => {
          let record = baseSizes.get(instance);
          if (!record) { record = {}; baseSizes.set(instance, record); }
          if (record[key] === undefined) {
            let value = fallback;
            try {
              if (nativeDesc && typeof nativeDesc.get === 'function') {
                const native = Number(nativeDesc.get.call(instance));
                if (Number.isFinite(native) && native > 0) value = native;
              }
            } catch (_) {}
            record[key] = value;
          }
          return record[key];
        };
        const widthDesc = rawVisualWidthDesc || Object.getOwnPropertyDescriptor(viewportProto, 'width');
        const heightDesc = rawVisualHeightDesc || Object.getOwnPropertyDescriptor(viewportProto, 'height');
        // A receiver other than the viewport we serve goes back to the original accessor, which keeps
        // the native brand check (and its TypeError) intact.
        if (widthDesc && typeof widthDesc.get === 'function') {
          Object.defineProperty(viewportProto, 'width', nativeAccessor('width', {
            configurable: true,
            enumerable: widthDesc.enumerable,
            get() {
              if (this !== viewport) return widthDesc.get.call(this);
              return liveViewportSize('width', baselineFor(this, 'w', widthDesc, initialInnerWidth));
            }
          }));
        }
        if (heightDesc && typeof heightDesc.get === 'function') {
          Object.defineProperty(viewportProto, 'height', nativeAccessor('height', {
            configurable: true,
            enumerable: heightDesc.enumerable,
            get() {
              if (this !== viewport) return heightDesc.get.call(this);
              return liveViewportSize('height', baselineFor(this, 'h', heightDesc, initialInnerHeight));
            }
          }));
        }
      }
    } catch (_) {}
    try {
      const docProto = (typeof Document !== 'undefined' && Document.prototype) || Object.getPrototypeOf(document);
      const forceDocFlag = (key) => {
        const existing = docProto ? Object.getOwnPropertyDescriptor(docProto, key) : null;
        if (!existing) return; // never invent an entry point the build does not expose
        const nativeGet = typeof existing.get === 'function' ? existing.get : null;
        Object.defineProperty(docProto, key, nativeAccessor(key, {
          configurable: true,
          enumerable: existing.enumerable,
          get() {
            // Foreign receivers are answered by the original accessor so its brand check still fires.
            if (this !== document) {
              if (nativeGet) return nativeGet.call(this);
              return false;
            }
            return true;
          }
        }));
      };
      forceDocFlag('fullscreenEnabled');
      forceDocFlag('webkitFullscreenEnabled');
    } catch (_) {}
    try {
      // The two entry points are separate functions in a real build - distinct objects, each named
      // after its own property. Sharing one replacement made them identical and left the legacy one
      // carrying the standard name, which a single equality or name check gives away.
      // The fullscreen entry points are deliberately left exactly as the build ships them. A shim
      // here could only change what the page observes: retrying through the legacy entry point turned
      // the native rejection into a success (the legacy call resolves in this build without actually
      // entering fullscreen), and any replacement also adds its own frames to error stacks.
    } catch (_) {}
    try {
      const ensureIframeFullscreen = (node) => {
        if (!node || node.nodeType !== 1 || node.tagName !== 'IFRAME') return;
        try {
          if (!node.hasAttribute('allowfullscreen')) node.setAttribute('allowfullscreen', 'true');
          if (!node.hasAttribute('webkitallowfullscreen')) node.setAttribute('webkitallowfullscreen', 'true');
          const curAllow = node.getAttribute('allow') || '';
          if (!curAllow.includes('fullscreen')) {
            node.setAttribute('allow', (curAllow ? curAllow + '; ' : '') + 'fullscreen *; autoplay *');
          }
        } catch (_) {}
      };
      try {
        if (typeof document.querySelectorAll === 'function') {
          document.querySelectorAll('iframe').forEach(ensureIframeFullscreen);
        }
      } catch (_) {}
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          try {
            document.querySelectorAll('iframe').forEach(ensureIframeFullscreen);
          } catch (_) {}
        }, { once: true });
      }
      const ensureSubWindow = (node) => {
        if (!node || node.nodeType !== 1) return;
        if (node.tagName === 'IFRAME' || node.tagName === 'FRAME') {
          try {
            if (node.contentWindow) patchSubWindow(node.contentWindow);
          } catch (_) {}
        }
      };
      if (typeof MutationObserver === 'function' && document.documentElement) {
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const n of m.addedNodes) {
              ensureIframeFullscreen(n);
              ensureSubWindow(n);
              if (n.querySelectorAll) {
                try {
                  n.querySelectorAll('iframe, frame').forEach((sub) => {
                    ensureIframeFullscreen(sub);
                    ensureSubWindow(sub);
                  });
                } catch (_) {}
              }
            }
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    } catch (_) {}
  } catch (_) {}

`;
