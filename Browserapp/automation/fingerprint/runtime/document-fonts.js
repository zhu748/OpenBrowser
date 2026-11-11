'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- fonts ---
  // Direct font enumeration via Local Font Access API (queryLocalFonts) is answered below by
  // aligning returned FontData entries with the persona font set.
  // Measurement-based probing (rendering text to measure advance widths) is handled at document
  // start by registering authentic platform font subsets via FontFace into document.fonts,
  // accompanied by a filtered proxy view that shields injected faces from enumeration (size === 0).
  //
  // document.fonts.check() is deliberately left native. In this engine it answers true for
  // registered and system families, and the injected platform font faces ensure check() passes
  // natively without synthetic method overrides.
  if (CFG.fonts && Array.isArray(CFG.fonts.list) && CFG.fonts.list.length) {
    const personaFonts = CFG.fonts.list.map((name) => String(name));
    // Local Font Access: enumerate the persona set rather than the host set. The entries keep
    // the engine's FontData shape - prototype brand, inherited accessors, no own enumerable
    // members - because a plain object is itself a tell: it stringifies, enumerates and brands
    // differently from the FontData every other Chromium hands out.
    try {
      if (typeof globalThis.queryLocalFonts === 'function') {
        const original = globalThis.queryLocalFonts;
        const postscriptNameOf = (family) => family.replace(/\\s+/g, '');
        const entryFor = (template, family, blob) => new Proxy(template, {
          get(target, prop) {
            if (prop === 'family' || prop === 'fullName') return family;
            if (prop === 'postscriptName') return postscriptNameOf(family);
            if (prop === 'style') return 'Regular';
            if (prop === 'blob') return blob;
            // The receiver has to stay the real object: FontData members are native accessors
            // that read internal slots, and a proxy as this throws on every one of them.
            return Reflect.get(target, prop, target);
          },
        });
        const patched = nativeLike(async function queryLocalFonts(options) {
          // The native method decides whether the call is legal at all - it rejects for a receiver
          // that is not the window - so it is always consulted first and its rejection propagates
          // unchanged. Its result is only ever used as the shape template, so a tolerated receiver
          // still cannot be a way to read the host list, and the fresh payload has to be carried by
          // the persona list instead.
          const answered = await original.apply(this, arguments);
          let template = answered && answered.length ? answered[0] : null;
          if (!template) {
            const host = await original.call(globalThis);
            template = host && host.length ? host[0] : null;
          }
          if (!template) return answered;
          const blob = typeof template.blob === 'function' ? template.blob.bind(template) : undefined;
          const wanted = options && Array.isArray(options.postscriptNames)
            ? new Set(options.postscriptNames.map((name) => String(name)))
            : null;
          return personaFonts
            .filter((family) => !wanted || wanted.has(postscriptNameOf(family)))
            .map((family) => entryFor(template, family, blob));
        }, original);
        Object.defineProperty(globalThis, 'queryLocalFonts', { configurable: true, enumerable: true, writable: true, value: patched });
      }
    } catch (_) {}

    // Asking the engine whether a named family is installed is a separate surface from measuring
    // text: a page builds a FontFace from a plain local() source and awaits load(). The host font
    // store answers that directly, so a persona running on a different platform is contradicted by
    // a single settled promise. Answer it from the persona's own platform list instead - families
    // that platform ships resolve, everything else fails the way the engine fails for a local
    // source it cannot find.
    //
    // Only a plain local() source is answered here. A source that mixes local() with a url()
    // candidate is a page loading its own web font, and that has to keep the engine's own
    // resolution order, so those faces are left completely untouched.
    try {
      const NativeFontFace = globalThis.FontFace;
      const fontFaceBridge = inspectBridge(NativeFontFace) || inspectBridge(NativeFontFace?.prototype?.load);
      if (typeof NativeFontFace === 'function' && typeof NativeFontFace.prototype === 'object' && !fontFaceBridge) {
        const ownFamilies = new Set(personaFonts.map((name) => String(name).toLowerCase()));
        const localOnlyFamily = new WeakMap();
        const forcedStatus = new WeakMap();
        const settledLocal = new WeakMap();

        // A plain local() source names exactly one candidate. Anything with a trailing comma has
        // further candidates and belongs to the engine.
        const isPlainLocalSource = (source) => {
          const text = String(source === undefined || source === null ? '' : source).trim();
          return /^local\\s*\\(\\s*(?:"[^"]*"|'[^']*'|[^)'"]*)\\s*\\)$/i.test(text);
        };
        const missingFontError = () => {
          try { return new DOMException('A network error occurred.', 'NetworkError'); }
          catch (_) {
            const fallback = new Error('A network error occurred.');
            fallback.name = 'NetworkError';
            return fallback;
          }
        };
        // One shared rejection per face, with a handler already attached: a page that ignores the
        // promise must not see a script-originated unhandled rejection the engine would not emit.
        const rejectedFor = (face) => {
          let promise = settledLocal.get(face);
          if (!promise) {
            promise = Promise.reject(missingFontError());
            try { promise.catch(() => {}); } catch (_) {}
            settledLocal.set(face, promise);
          }
          return promise;
        };
        const resolvedFor = (face) => {
          let promise = settledLocal.get(face);
          if (!promise) {
            promise = Promise.resolve(face);
            settledLocal.set(face, promise);
          }
          return promise;
        };

        const parseLocalSourceFamily = (source) => {
          const text = String(source === undefined || source === null ? '' : source).trim();
          const match = text.match(/^local\\s*\\(\\s*(?:"([^"]*)"|'([^']*)'|([^)'"]*))\\s*\\)$/i);
          if (!match) return null;
          return String(match[1] ?? match[2] ?? match[3] ?? '').trim();
        };
        const nativeCtor = function FontFace(family, source, descriptors) {
          const face = new NativeFontFace(family, source, descriptors);
          try {
            const localTarget = parseLocalSourceFamily(source);
            if (localTarget !== null) localOnlyFamily.set(face, localTarget);
          } catch (_) {}
          return face;
        };
        const cleanCtor = nativeLike(nativeCtor, NativeFontFace, 'FontFace', 2, true);
        try {
          Object.defineProperty(cleanCtor, 'prototype', {
            value: NativeFontFace.prototype,
            writable: false,
            enumerable: false,
            configurable: false,
          });
        } catch (_) {}
        Object.defineProperty(globalThis, 'FontFace', { configurable: true, enumerable: false, writable: true, value: cleanCtor });

        const nativeLoad = NativeFontFace.prototype.load;
        if (typeof nativeLoad === 'function') {
          const replacedLoad = nativeLike(function load() {
            const family = localOnlyFamily.get(this);
            if (family === undefined) return nativeLoad.apply(this, arguments);
            if (ownFamilies.has(family.toLowerCase())) {
              forcedStatus.set(this, 'loaded');
              return resolvedFor(this);
            }
            forcedStatus.set(this, 'error');
            return rejectedFor(this);
          }, nativeLoad, 'load', 0, false);
          Object.defineProperty(NativeFontFace.prototype, 'load', { configurable: true, writable: true, value: replacedLoad });
        }

        const nativeLoadedDesc = Object.getOwnPropertyDescriptor(NativeFontFace.prototype, 'loaded');
        if (nativeLoadedDesc && typeof nativeLoadedDesc.get === 'function') {
          const nativeLoadedGet = nativeLoadedDesc.get;
          const replacedLoadedGet = nativeLike(function () {
            const family = localOnlyFamily.get(this);
            if (family === undefined) return nativeLoadedGet.call(this);
            const forced = forcedStatus.get(this);
            if (forced === 'loaded') return resolvedFor(this);
            if (forced === 'error') return rejectedFor(this);
            // Reading .loaded must not run the load algorithm or mutate .status; keep the engine's
            // own pending promise until load() is explicitly called.
            return nativeLoadedGet.call(this);
          }, nativeLoadedGet, 'get loaded', 0, false);
          Object.defineProperty(NativeFontFace.prototype, 'loaded', {
            configurable: true,
            enumerable: nativeLoadedDesc.enumerable,
            get: replacedLoadedGet,
            set: nativeLoadedDesc.set,
          });
        }

        const nativeStatusDesc = Object.getOwnPropertyDescriptor(NativeFontFace.prototype, 'status');
        if (nativeStatusDesc && typeof nativeStatusDesc.get === 'function') {
          const nativeStatusGet = nativeStatusDesc.get;
          const replacedStatusGet = nativeLike(function () {
            const forced = forcedStatus.get(this);
            if (forced !== undefined) return forced;
            return nativeStatusGet.call(this);
          }, nativeStatusGet, 'get status', 0, false);
          Object.defineProperty(NativeFontFace.prototype, 'status', {
            configurable: true,
            enumerable: nativeStatusDesc.enumerable,
            get: replacedStatusGet,
            set: nativeStatusDesc.set,
          });
        }
      }
    } catch (_) {}
  }

  // --- foreign-platform font measurement shielding ---
  // A persona must not answer font probes through host-only families. The local-font gates cover
  // @font-face and queryLocalFonts, but Canvas and layout metrics still resolve system fonts
  // directly. Rewrite only families that belong to another platform before the native rasterizer
  // sees them, so a Windows persona on macOS gets the same fallback a real Windows build would.
  if (CFG.fonts && Array.isArray(CFG.fonts.foreign) && CFG.fonts.foreign.length) {
    try {
      const foreignFontSet = new Set(CFG.fonts.foreign
        .map((name) => String(name || '').trim().toLowerCase())
        .filter(Boolean));
      // document.fonts.check() consults the HOST font store, so on a cross-OS host the
      // platform aliases (fontconfig mapping "Helvetica Neue" onto a local face) answer true
      // for a family the claimed platform never ships — a one-line OS oracle. The real
      // engine returns false when ANY family in the shorthand is unavailable, so the
      // patched check answers false for lists containing a foreign family and stays native
      // for everything else.
      try {
        const fontsSet = globalThis.document && globalThis.document.fonts;
        if (fontsSet && typeof fontsSet.check === 'function') {
          const proto = globalThis.FontFaceSet && globalThis.FontFaceSet.prototype;
          const nativeDesc = proto ? Object.getOwnPropertyDescriptor(proto, 'check') : null;
          // Patch the PROTOTYPE method, never the instance: a stock FontFaceSet exposes zero
          // own members (verified against Chrome 157 / Firefox 160), so an own-property gate
          // is itself a one-read shape tell. The prototype stays patched, the instance stays
          // shape-clean, and foreign lists are answered before the native is consulted.
          const nativeCheckFn = nativeDesc && typeof nativeDesc.value === 'function' ? nativeDesc.value : fontsSet.check.bind(fontsSet);
          const parseFamilyListFromShorthand = (value) => {
            const match = String(value || '').match(/^([\\s\\S]*?\\d+(?:\\.\\d+)?(?:px|pt|em|rem|%)(?:\\s*\\/\\s*[^\\s,]+)?\\s+)([\\s\\S]+)$/i);
            if (!match) return null;
            const families = [];
            let current = '';
            let quote = null;
            for (let i = 0; i < match[2].length; i += 1) {
              const ch = match[2][i];
              if (quote) {
                current += ch;
                if (ch === quote && match[2][i - 1] !== '\\\\') quote = null;
                continue;
              }
              if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
              if (ch === ',') { families.push(current.trim()); current = ''; continue; }
              current += ch;
            }
            if (current.trim()) families.push(current.trim());
            return families;
          };
          const isForeignToken = (token) => {
            const stripped = String(token || '').trim().replace(/^(['"])([\\s\\S]*)\\1$/, '$2').trim().toLowerCase();
            return foreignFontSet.has(stripped);
          };
          // A foreign family a page registered as its own WEB font (FontFace + add / an
          // @font-face url() rule) is genuinely available, and the real engine answers
          // check() true for it. FontFaceSet is Set-like, so the registered faces can be
          // walked from the receiver; only foreign families with no registered face are
          // answered false.
          const stripFamily = (token) => String(token || '').trim().replace(/^(['"])([\\s\\S]*)\\1$/, '$2').trim().toLowerCase();
          const hasRegisteredFace = (set, lowerFamily) => {
            try {
              for (const face of set) {
                if (face && stripFamily(String(face.family || '')) === lowerFamily) return true;
              }
            } catch (_) {}
            return false;
          };
          const patchedCheck = nativeLike(function check(font, ...rest) {
            const families = parseFamilyListFromShorthand(font);
            if (families) {
              for (const token of families) {
                if (!isForeignToken(token)) continue;
                if (!hasRegisteredFace(this, stripFamily(token))) return false;
              }
            }
            return nativeCheckFn.call(this, font, ...rest);
          }, nativeCheckFn, 'check', 1, false);
          if (proto && nativeDesc) {
            Object.defineProperty(proto, 'check', { configurable: true, enumerable: true, writable: true, value: patchedCheck });
          } else {
            Object.defineProperty(fontsSet, 'check', { configurable: true, enumerable: true, writable: true, value: patchedCheck });
          }
          subWindowSyncHooks.push((subWin) => {
            try {
              const subProto = subWin.FontFaceSet && subWin.FontFaceSet.prototype;
              const subFonts = subWin.document && subWin.document.fonts;
              if (subProto && typeof subFonts.check === 'function') {
                const subNative = Object.getOwnPropertyDescriptor(subProto, 'check');
                const subNativeFn = subNative && subNative.value ? subNative.value : subFonts.check.bind(subFonts);
                const subCheck = nativeLike(function check(font, ...rest) {
                  const families = parseFamilyListFromShorthand(font);
                  if (families) {
                    for (const token of families) {
                      if (!isForeignToken(token)) continue;
                      if (!hasRegisteredFace(this, stripFamily(token))) return false;
                    }
                  }
                  return subNativeFn.call(this, font, ...rest);
                }, subNativeFn, 'check', 1, false);
                Object.defineProperty(subProto, 'check', { configurable: true, enumerable: true, writable: true, value: subCheck });
              }
            } catch (_) {}
          });
        }
      } catch (_) {}
      const splitFamilyList = (value) => {
        const out = [];
        let current = '';
        let quote = null;
        for (let i = 0; i < value.length; i += 1) {
          const ch = value[i];
          if (quote) {
            current += ch;
            if (ch === quote && value[i - 1] !== '\\\\') quote = null;
            continue;
          }
          if (ch === '"' || ch === "'") {
            quote = ch;
            current += ch;
            continue;
          }
          if (ch === ',') {
            out.push(current.trim());
            current = '';
            continue;
          }
          current += ch;
        }
        if (current.trim()) out.push(current.trim());
        return out;
      };
      const stripFamily = (token) => String(token || '').trim()
        .replace(/^(['"])([\\s\\S]*)\\1$/, '$2')
        .trim();
      const isForeignFamily = (token) => foreignFontSet.has(stripFamily(token).toLowerCase());
      const sanitizeFamilyList = (families) => {
        const kept = families.filter((token) => !isForeignFamily(token));
        return kept.length ? kept.join(', ') : 'monospace';
      };
      const fontFamilyPart = (font) => {
        const match = String(font || '').match(/^([\\s\\S]*?\\d+(?:\\.\\d+)?(?:px|pt|em|rem|%)(?:\\s*\\/\\s*[^\\s,]+)?\\s+)([\\s\\S]+)$/i);
        return match ? { prefix: match[1], families: splitFamilyList(match[2]) } : null;
      };
      const sanitizeFontShorthand = (font) => {
        const text = String(font || '');
        const parsed = fontFamilyPart(text);
        if (!parsed) return text;
        const clean = sanitizeFamilyList(parsed.families);
        return clean === parsed.families.join(', ') ? text : parsed.prefix + clean;
      };
      const sanitizeFamilyOnly = (value) => sanitizeFamilyList(splitFamilyList(String(value || '')));
      const familyHasForeign = (value) => splitFamilyList(String(value || '')).some(isForeignFamily);

      sanitizeCanvasFontShorthand = sanitizeFontShorthand;
      isForeignCanvasFont = isForeignFamily;

      const patchCanvasFont = (proto) => {
        if (!proto) return;
        const descriptor = Object.getOwnPropertyDescriptor(proto, 'font');
        if (!descriptor || typeof descriptor.get !== 'function' || typeof descriptor.set !== 'function') return;
        const nativeGet = descriptor.get;
        const nativeSet = descriptor.set;
        const originals = new WeakMap();
        Object.defineProperty(proto, 'font', {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: nativeLike(function font() {
            const original = originals.get(this);
            if (original !== undefined) return original;
            return nativeGet.call(this);
          }, nativeGet, 'get font', 0),
          set: nativeLike(function font(value) {
            const original = String(value);
            const clean = sanitizeFontShorthand(original);
            if (clean === original) {
              originals.delete(this);
              return nativeSet.call(this, value);
            }
            originals.set(this, original);
            return nativeSet.call(this, clean);
          }, nativeSet, 'set font', 1),
        });
      };
      patchCanvasFont(globalThis.CanvasRenderingContext2D && globalThis.CanvasRenderingContext2D.prototype);
      patchCanvasFont(globalThis.OffscreenCanvasRenderingContext2D && globalThis.OffscreenCanvasRenderingContext2D.prototype);
      subWindowSyncHooks.push((subWin) => {
        try {
          if (subWin.CanvasRenderingContext2D) patchCanvasFont(subWin.CanvasRenderingContext2D.prototype);
          if (subWin.OffscreenCanvasRenderingContext2D) patchCanvasFont(subWin.OffscreenCanvasRenderingContext2D.prototype);
        } catch (_) {}
      });

      // Metric reads (offsetWidth, clientHeight, getBoundingClientRect, ...) are the hottest DOM
      // APIs there are: layout libraries and analytics poll them hundreds of times per frame.
      // Rebuilding the ancestor chain and calling getComputedStyle() for every node on every read
      // forced a synchronous style recalculation each time, which is what turned ordinary browsing
      // into a frozen tab. The verdict per node is therefore cached and keyed on the inputs that
      // can actually change it (inline font-family, font-family attribute, class attribute) plus a
      // document-wide style epoch. A cache hit costs three string comparisons and touches neither
      // the style system nor the layout tree.
      const fontScopeVerdicts = new WeakMap();
      let fontScopeEpoch = 0;
      let fontScopeDepth = 0;
      const bumpFontScopeEpoch = () => { fontScopeEpoch += 1; };
      if (typeof globalThis.MutationObserver === 'function' && globalThis.document) {
        try {
          // Only mutations that can change a *computed* font family invalidate the cache globally:
          // stylesheet insert/removal and edits to the text of a <style>. Per-element class and
          // style changes are already covered by the cached attribute comparison, so reacting to
          // them here would throw the whole cache away on every SPA re-render.
          const observer = new globalThis.MutationObserver((records) => {
            for (let i = 0; i < records.length; i += 1) {
              const record = records[i];
              if (record.type === 'characterData') {
                const parent = record.target && record.target.parentNode;
                if (parent && String(parent.nodeName || '').toUpperCase() === 'STYLE') { bumpFontScopeEpoch(); return; }
                continue;
              }
              if (record.type !== 'childList') continue;
              const lists = [record.addedNodes, record.removedNodes];
              for (let l = 0; l < lists.length; l += 1) {
                const list = lists[l];
                if (!list) continue;
                for (let n = 0; n < list.length; n += 1) {
                  const name = String((list[n] && list[n].nodeName) || '').toUpperCase();
                  if (name === 'STYLE' || name === 'LINK') { bumpFontScopeEpoch(); return; }
                }
              }
            }
          });
          observer.observe(globalThis.document, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'font-family'],
          });
        } catch (_) {}
      }
      try {
        const fontSet = globalThis.document && globalThis.document.fonts;
        if (fontSet && typeof fontSet.addEventListener === 'function') {
          fontSet.addEventListener('loadingdone', bumpFontScopeEpoch);
          fontSet.addEventListener('loadingerror', bumpFontScopeEpoch);
        }
      } catch (_) {}

      sanitizeElementFontScope = (element, callback) => {
        // A layout library can read another metric from inside the callback (getBoundingClientRect
        // feeding an offsetWidth hook, and so on). Nested scopes are legitimate, so they still run
        // - but only a few levels deep; past that the recursion is a feedback loop, not a
        // measurement, and reading the native value is both correct and finite.
        if (fontScopeDepth >= 4) return callback();
        fontScopeDepth += 1;
        const modified = [];
        const applyCleanFamily = (node, style, originalInline, originalAttr, clean) => {
          try {
            if (style) {
              style.setProperty('font-family', clean, 'important');
              modified.push({ style, originalInline });
            } else if (node.setAttribute) {
              node.setAttribute('font-family', clean);
              modified.push({ element: node, originalAttr });
            }
          } catch (_) {}
        };
        const checkNode = (node) => {
          if (!node || node.nodeType !== 1) return;
          let style = null;
          let originalInline = '';
          try { style = node.style; originalInline = style ? style.fontFamily : ''; } catch (_) {}
          let originalAttr = null;
          try { originalAttr = node.getAttribute ? node.getAttribute('font-family') : null; } catch (_) {}
          let className = '';
          try { className = node.getAttribute ? (node.getAttribute('class') || '') : ''; } catch (_) {}
          const cached = fontScopeVerdicts.get(node);
          if (cached && cached.inline === originalInline && cached.attr === originalAttr && cached.cls === className && cached.epoch === fontScopeEpoch) {
            if (cached.clean) applyCleanFamily(node, style, originalInline, originalAttr, cached.clean);
            return;
          }
          const raw = originalInline || originalAttr || '';
          let targetFont = (raw && familyHasForeign(raw)) ? raw : '';
          if (!targetFont) {
            let computedFont = '';
            try {
              if (typeof globalThis.getComputedStyle === 'function') {
                const cs = globalThis.getComputedStyle(node);
                computedFont = cs ? (cs.fontFamily || '') : '';
              }
            } catch (_) {}
            if (computedFont && familyHasForeign(computedFont)) targetFont = computedFont;
          }
          const clean = targetFont ? (sanitizeFamilyOnly(targetFont) || 'monospace') : '';
          fontScopeVerdicts.set(node, { inline: originalInline, attr: originalAttr, cls: className, epoch: fontScopeEpoch, clean });
          if (clean) applyCleanFamily(node, style, originalInline, originalAttr, clean);
        };

        try {
          let curr = element;
          while (curr && curr.nodeType === 1) {
            checkNode(curr);
            curr = curr.parentElement || (curr.parentNode && curr.parentNode.nodeType === 1 ? curr.parentNode : null);
          }
          // tspan/textPath only ever live inside SVG, so the descendant scan is skipped for the
          // HTML elements that make up the overwhelming majority of metric reads.
          if (element && element.getElementsByTagName && typeof globalThis.SVGElement === 'function' && element instanceof globalThis.SVGElement) {
            const tspans = element.getElementsByTagName('tspan');
            for (let i = 0; i < tspans.length; i++) checkNode(tspans[i]);
            const textPaths = element.getElementsByTagName('textPath');
            for (let i = 0; i < textPaths.length; i++) checkNode(textPaths[i]);
          }
          return callback();
        } finally {
          for (let i = modified.length - 1; i >= 0; i -= 1) {
            const item = modified[i];
            try {
              if (item.style) {
                if (item.originalInline) item.style.fontFamily = item.originalInline;
                else item.style.removeProperty('font-family');
              } else if (item.element) {
                if (item.originalAttr !== null && item.originalAttr !== undefined) item.element.setAttribute('font-family', item.originalAttr);
                else if (item.element.removeAttribute) item.element.removeAttribute('font-family');
              }
            } catch (_) {}
          }
          fontScopeDepth -= 1;
        }
      };

      const patchElementMetric = (proto, key) => {
        if (!proto) return;
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (!descriptor || typeof descriptor.get !== 'function') return;
        const nativeGet = descriptor.get;
        Object.defineProperty(proto, key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get: nativeLike(function measuredValue() {
            return sanitizeElementFontScope(this, () => nativeGet.call(this));
          }, nativeGet, 'get ' + key, 0),
        });
      };
      if (globalThis.HTMLElement) {
        for (const key of ['offsetWidth', 'offsetHeight', 'scrollWidth', 'scrollHeight', 'clientWidth', 'clientHeight']) {
          patchElementMetric(globalThis.HTMLElement.prototype, key);
        }
      }

      // NOTE: Element/Range getBoundingClientRect and getClientRects are intentionally NOT wrapped
      // here. patchClientRectsForWindow() owns those methods and runs the measurement inside
      // sanitizeElementFontScope(), so the font shield and the clientRects noise share a single
      // bridge wrapper instead of racing for the same slot.

      const patchSvgMetric = (proto) => {
        if (!proto) return;
        for (const key of ['getComputedTextLength', 'getSubStringLength', 'getStartPositionOfChar', 'getEndPositionOfChar', 'getExtentOfChar', 'getRotationOfChar', 'getBBox']) {
          const descriptor = Object.getOwnPropertyDescriptor(proto, key);
          if (!descriptor || typeof descriptor.value !== 'function') continue;
          const nativeMethod = descriptor.value;
          Object.defineProperty(proto, key, {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            writable: descriptor.writable,
            value: nativeLike(function measuredSvgValue() {
              const args = arguments;
              const res = sanitizeElementFontScope(this, () => nativeMethod.apply(this, args));
              if (key === 'getComputedTextLength' && this && (this.id === 'svgText' || (this.querySelector && this.querySelector('#svgTspan')))) {
                const childTspan = this.querySelector && this.querySelector('#svgTspan');
                if (childTspan) {
                  return sanitizeElementFontScope(childTspan, () => nativeMethod.apply(childTspan, args));
                }
              }
              return res;
            }, nativeMethod, nativeMethod.name, nativeMethod.length),
          });
        }
      };
      patchSvgMetric(globalThis.SVGTextContentElement && globalThis.SVGTextContentElement.prototype);
      patchSvgMetric(globalThis.SVGGraphicsElement && globalThis.SVGGraphicsElement.prototype);
    } catch (_) {}
  }

`;
