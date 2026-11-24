'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- canvas ---
  if (CFG.canvas && CFG.canvas.mode === 'blocked') {
    const patchedCanvasBlockedWindows = new WeakSet();
    const patchCanvasBlocked = (targetWin) => {
      if (!targetWin || patchedCanvasBlockedWindows.has(targetWin)) return;
      if (adoptNativeBridgeWrappers(targetWin.HTMLCanvasElement?.prototype, targetWin.CanvasRenderingContext2D?.prototype, targetWin.OffscreenCanvasRenderingContext2D?.prototype, targetWin.OffscreenCanvas?.prototype)) {
        try { patchedCanvasBlockedWindows.add(targetWin); } catch (_) {}
        return;
      }
      try { patchedCanvasBlockedWindows.add(targetWin); } catch (_) {}
      const deny = () => { throw new DOMException('Canvas reading is disabled by permissions policy', 'SecurityError'); };
      try {
        replaceMethod(targetWin.HTMLCanvasElement?.prototype, 'toDataURL', () => deny);
        replaceMethod(targetWin.HTMLCanvasElement?.prototype, 'toBlob', () => function(callback) {
          if (typeof callback === 'function') queueMicrotask(() => callback(null));
        });
        replaceMethod(targetWin.CanvasRenderingContext2D?.prototype, 'getImageData', () => deny);
        replaceMethod(targetWin.OffscreenCanvasRenderingContext2D?.prototype, 'getImageData', () => deny);
        replaceMethod(targetWin.OffscreenCanvas?.prototype, 'convertToBlob', () => function() {
          return Promise.reject(new DOMException('Canvas reading is disabled by permissions policy', 'SecurityError'));
        });
      } catch (_) {}
    };
    patchCanvasBlocked(globalThis);
    subWindowSyncHooks.push((subWin) => { patchCanvasBlocked(subWin); });
  } else if (CFG.canvas && CFG.canvas.mode === 'noise') {
    const mark = Number(CFG.canvas.mark) || 1;
    const readback = createCanvasReadbackCache();
    const webglCanvases = new WeakSet();

    const patchedCanvasWindows = new WeakSet();
    const patchCanvasForWindow = (targetWin) => {
      if (!targetWin || patchedCanvasWindows.has(targetWin)) return;
      if (adoptNativeBridgeWrappers(targetWin.HTMLCanvasElement?.prototype, targetWin.CanvasRenderingContext2D?.prototype, targetWin.OffscreenCanvasRenderingContext2D?.prototype, targetWin.OffscreenCanvas?.prototype)) {
        try { patchedCanvasWindows.add(targetWin); } catch (_) {}
        return;
      }
      try { patchedCanvasWindows.add(targetWin); } catch (_) {}
      try {
        const measureJitterCache = createTextMetricJitterCache(
          String(targetWin?.location?.origin || globalThis.location?.origin || ''),
          String(CFG.seed || CFG.canvas?.mark || '1'));
        const hookGetAndPut = (proto) => {
          if (!proto) return;
          const originalGet = replaceMethod(proto, 'getImageData', (original) => function getImageData(...args) {
            const result = original.apply(this, args);
            try {
              if (readback.matches(this, result, args)) return readback.tag(result);
            } catch (_) {}
            const noised = applyCanvasNoise(result, mark);
            try { readback.tag(noised); } catch (_) {}
            return noised;
          });
          if (proto.putImageData) {
            replaceMethod(proto, 'putImageData', (origPut) => function putImageData(...args) {
              const result = origPut.apply(this, args);
              try { readback.wrote(this, args); } catch (_) {}
              return result;
            });
          }
          if (proto.measureText) {
            replaceMethod(proto, 'measureText', (origMeasure) => function measureText(text, ...args) {
              const currentFont = String(this.font || '');
              const cleanFont = sanitizeCanvasFontShorthand(currentFont);
              let fontSwapped = false;
              let temporaryFont;
              if (cleanFont !== currentFont) {
                try {
                  this.font = cleanFont;
                  temporaryFont = String(this.font || '');
                  fontSwapped = true;
                } catch (_) {}
              }
              let call;
              try {
                call = invokeNativeText(origMeasure, this, arguments);
              } finally {
                if (fontSwapped) {
                  try { if (String(this.font || '') === temporaryFont) this.font = currentFont; } catch (_) {}
                }
              }
              const tm = call.value;
              try {
                const { jitter, widthJitter } = measureJitterCache.get(String(this.font || ''), call.text);
                return new Proxy(tm, {
                  get(target, prop, receiver) {
                    if (prop === 'constructor') return target.constructor;
                    const val = Reflect.get(target, prop, target);
                    if (typeof val === 'number') {
                      if (prop === 'width') return val === 0 ? 0 : Math.max(0, val + widthJitter);
                      if (prop === 'actualBoundingBoxRight') return val + jitter;
                      if (prop === 'actualBoundingBoxLeft') return val - jitter;
                      if (prop === 'actualBoundingBoxAscent') return val + (jitter * 0.5);
                      if (prop === 'actualBoundingBoxDescent') return val - (jitter * 0.5);
                      // fontBoundingBox* and the baseline offsets expose the FONT's own
                      // metrics, not the text's — a different font (or none) answers with
                      // the host's rasterized values. The same seeded jitter family applies
                      // (half-strength on the vertical box edges, mirroring the ascent/
                      // descent treatment), keeping every numeric property persona-sourced.
                      if (prop === 'fontBoundingBoxAscent') return val + (jitter * 0.5);
                      if (prop === 'fontBoundingBoxDescent') return val - (jitter * 0.5);
                      if (prop === 'fontBoundingBoxLeft') return val - jitter;
                      if (prop === 'fontBoundingBoxRight') return val + jitter;
                      // Baselines are intrinsic constants of the font's em box; the
                      // smallest defensible nudge (quarter-strength) keeps them from
                      // reading the host verbatim without inventing impossible geometry.
                      if (prop === 'alphabeticBaseline') return val + (jitter * 0.25);
                      if (prop === 'ideographicBaseline' || prop === 'hangingBaseline') return val + (jitter * 0.25);
                    }
                    return typeof val === 'function' ? val.bind(target) : val;
                  }
                });
              } catch (_) {
                return tm;
              }
            });
          }
          return originalGet;
        };

        const rawGet = hookGetAndPut(targetWin.CanvasRenderingContext2D?.prototype);
        hookGetAndPut(targetWin.OffscreenCanvasRenderingContext2D?.prototype);

        const readCanvasPixels = (context, width, height) => {
          return rawGet ? applyCanvasNoise(rawGet.call(context, 0, 0, width, height), mark)
            : context.getImageData(0, 0, width, height);
        };
        installHtmlCanvasEncoding(targetWin, replaceMethod, readCanvasPixels);
        installOffscreenCanvasEncoding(targetWin, replaceMethod);

        installVideoFrameCopy(targetWin.VideoFrame?.prototype, replaceMethod, (data, width, height) => canvasPixelNoise(data, width, height, mark));

        const gpuQueueProto = targetWin.GPUQueue ? targetWin.GPUQueue.prototype : null;
        if (gpuQueueProto && typeof gpuQueueProto.copyExternalImageToTexture === 'function') {
          const sourceSize = (value) => {
            try {
              const w = Math.round(Number(value.width || value.displayWidth || value.codedWidth || 0)) || 0;
              const h = Math.round(Number(value.height || value.displayHeight || value.codedHeight || 0)) || 0;
              return w > 0 && h > 0 ? { width: w, height: h } : null;
            } catch (_) { return null; }
          };
          const maskedCopyOf = (value) => {
            const size = sourceSize(value);
            if (!size || webglCanvases.has(value)) return null;
            try {
              const doc = (value && value.ownerDocument) || (targetWin && targetWin.document) || document;
              const copy = doc.createElement('canvas');
              copy.width = size.width;
              copy.height = size.height;
              const surface = copy.getContext('2d');
              if (!surface) return null;
              surface.drawImage(value, 0, 0, size.width, size.height);
              surface.putImageData(readCanvasPixels(surface, size.width, size.height), 0, 0);
              return copy;
            } catch (_) { return null; }
          };
          replaceMethod(gpuQueueProto, 'copyExternalImageToTexture', (original) => function copyExternalImageToTexture(source, destination, copySize) {
            try {
              if (source && source.source) {
                const masked = maskedCopyOf(source.source);
                if (masked) {
                  const swapped = {};
                  for (const key of Object.keys(source)) swapped[key] = source[key];
                  swapped.source = masked;
                  return original.call(this, swapped, destination, copySize);
                }
              }
            } catch (_) {}
            return original.apply(this, arguments);
          });
        }

        // Track WebGL canvases for the GPUQueue source policy. A blocked
        // profile installs its own context wrapper below.
        if (CFG.webgl?.mode !== 'blocked') {
          const trackContext = (proto, htmlCanvas) => replaceMethod(proto, 'getContext', (original) => function getContext(...args) {
            const { value, text } = invokeNativeText(original, this, args);
            if (value && isWebglContext(text, htmlCanvas)) webglCanvases.add(this);
            return value;
          });
          trackContext(targetWin.HTMLCanvasElement?.prototype, true);
          trackContext(targetWin.OffscreenCanvas?.prototype, false);
        }
      } catch (_) {}
    };

    patchCanvasForWindow(globalThis);
    subWindowSyncHooks.push((subWin) => { patchCanvasForWindow(subWin); });
  }

  // --- webgl ---
  if (CFG.webgl && CFG.webgl.mode === 'blocked') {
    const patchWebglBlocked = (target) => {
      blockWebglContext(target.HTMLCanvasElement?.prototype, replaceMethod, true);
      blockWebglContext(target.OffscreenCanvas?.prototype, replaceMethod, false);
    };
    patchWebglBlocked(globalThis);
    subWindowSyncHooks.push(patchWebglBlocked);
  } else if (CFG.webgl && (CFG.webgl.mode === 'noise' || (CFG.webgl.metaMode && CFG.webgl.metaMode !== 'real'))) {
    try {
      const mark = Number(CFG.webgl.mark) || 1;
      const metaMode = String(CFG.webgl.metaMode || 'noise');
      const pixelNoise = CFG.webgl.mode === 'noise';
      const enabledDebugExts = new WeakSet();

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

      const patchGetExtension = (proto) => {
        if (!proto || !proto.getExtension) return;
        replaceMethod(proto, 'getExtension', (original) => function(name) {
          const extName = String(name || '').toLowerCase();
          if (metaMode === 'blocked' && extName === 'webgl_debug_renderer_info') return null;
          if (isDisallowedVendorExtension(extName)) return null;
          let ext = original.apply(this, arguments);
          if (extName === 'webgl_debug_renderer_info') {
            if (!ext && metaMode !== 'blocked' && metaMode !== 'real' && (CFG.webgl?.vendor || CFG.webgl?.renderer)) {
              const debugProto = typeof WebGLDebugRendererInfo !== "undefined" ? WebGLDebugRendererInfo.prototype : Object.prototype;
              ext = Object.create(debugProto);
              Object.defineProperty(ext, 'UNMASKED_VENDOR_WEBGL', { value: 0x9245, enumerable: true, writable: false, configurable: false });
              Object.defineProperty(ext, 'UNMASKED_RENDERER_WEBGL', { value: 0x9246, enumerable: true, writable: false, configurable: false });
            }
            if (ext) enabledDebugExts.add(this);
          }
          return ext;
        });
      };

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

      const patchGetShaderPrecisionFormat = (proto) => {
        if (!proto || !proto.getShaderPrecisionFormat) return;
        if (metaMode === 'real') return;
        replaceMethod(proto, 'getShaderPrecisionFormat', (original) => function(shaderType, precisionType) {
          const invocation = invokeNativeUnsigned(original, this, arguments, [0, 1]);
          const fmt = invocation.value;
          precisionType = invocation.values[1];
          if (!fmt) return null;

          const osName = String(CFG.os || '').toLowerCase();
          const isMobilePersona = Boolean(CFG.mobile) || osName === 'android' || osName === 'ios'
            || (CFG.platform && /Android|iPhone|iPad/i.test(CFG.platform))
            || (CFG.webgl?.gpu?.vendor && /qualcomm|arm/i.test(CFG.webgl.gpu.vendor));

          let target = null;
          if (isMobilePersona) {
            if (precisionType === 0x8df1 /* MEDIUM_FLOAT */ || precisionType === 0x8df0 /* LOW_FLOAT */) {
              target = { rangeMin: 14, rangeMax: 14, precision: 10 };
            } else if (precisionType === 0x8df2 /* HIGH_FLOAT */) {
              target = { rangeMin: 127, rangeMax: 127, precision: 23 };
            } else if (precisionType === 0x8df3 /* LOW_INT */ || precisionType === 0x8df4 /* MEDIUM_INT */) {
              target = { rangeMin: 15, rangeMax: 14, precision: 0 };
            } else if (precisionType === 0x8df5 /* HIGH_INT */) {
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
            for (const key of ['rangeMin', 'rangeMax', 'precision']) target[key] = Math.min(Number(fmt[key]), target[key]);
            precisionOverridesMap.set(fmt, target);
          }
          return fmt;
        });
      };

      const patchGetParameter = (proto) => {
        if (!proto || !proto.getParameter) return;
        if (metaMode === 'real') return;
        replaceMethod(proto, 'getParameter', (original) => function(param) {
          const queried = readWebglParameter(original, this, arguments);
          const native = queried.value;
          const enumValue = queried.param;
          if (native === null) return native;
          if (enumValue === 0x9245 || enumValue === 0x9246) {
            if (!enabledDebugExts.has(this)) return native;
            if (metaMode === 'blocked') return '';
            return enumValue === 0x9245 ? CFG.webgl.vendor : CFG.webgl.renderer;
          }
          const limits = CFG.webgl && CFG.webgl.limits;
          if (limits) {
            const key = enumValue === 0x0d3a ? 0x84e8 : enumValue;
            if (Object.prototype.hasOwnProperty.call(limits, key)) {
              return boundWebglLimit(native, limits[key], enumValue);
            }
          }
          return native;
        });
      };

      // Subtle deterministic readPixels noise so WebGL hashers diverge per env
      const patchReadPixels = (proto) => {
        if (!pixelNoise || !proto || !proto.readPixels) return;
        replaceMethod(proto, 'readPixels', (original) => function(...args) {
          const result = original.apply(this, args);
          try {
            const pixels = args[6];
            if (pixels && pixels.length && (pixels instanceof Uint8Array || pixels instanceof Uint8ClampedArray)) {
              // Skip empty/black buffer
              let hasNonZero = false;
              for (let i = 0; i < pixels.length; i += 32) {
                if (pixels[i] !== 0) { hasNonZero = true; break; }
              }
              if (!hasNonZero) return result;

              const amp = noiseAmplitudeNow();
              const step = Math.max(4, Math.floor(pixels.length / sampleStepDivisorNow()));
              for (let i = 0; i < pixels.length; i += step) {
                const alphaIdx = i - (i % 4) + 3;
                if (alphaIdx < pixels.length && pixels[alphaIdx] === 0) continue;
                const n = noiseDelta(noise(i + mark), amp);
                pixels[i] = Math.max(0, Math.min(255, (pixels[i] || 0) + n));
              }
            }
          } catch (_) {}
          return result;
        });
      };

      const patchGetSupportedExtensions = (proto) => {
        if (!proto || !proto.getSupportedExtensions) return;
        replaceMethod(proto, 'getSupportedExtensions', (original) => function() {
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
      };

      if (typeof WebGLShaderPrecisionFormat !== 'undefined' && WebGLShaderPrecisionFormat.prototype) {
        patchPrecisionFormatProto(WebGLShaderPrecisionFormat.prototype);
      }
      const globalWebglAlreadyPatched = adoptNativeBridgeWrappers(globalThis.WebGLRenderingContext?.prototype, globalThis.WebGL2RenderingContext?.prototype);
      if (!globalWebglAlreadyPatched && globalThis.WebGLRenderingContext) {
        patchGetParameter(WebGLRenderingContext.prototype);
        patchGetShaderPrecisionFormat(WebGLRenderingContext.prototype);
        patchReadPixels(WebGLRenderingContext.prototype);
        patchGetExtension(WebGLRenderingContext.prototype);
        patchGetSupportedExtensions(WebGLRenderingContext.prototype);
      }
      if (!globalWebglAlreadyPatched && globalThis.WebGL2RenderingContext) {
        patchGetParameter(WebGL2RenderingContext.prototype);
        patchGetShaderPrecisionFormat(WebGL2RenderingContext.prototype);
        patchReadPixels(WebGL2RenderingContext.prototype);
        patchGetExtension(WebGL2RenderingContext.prototype);
        patchGetSupportedExtensions(WebGL2RenderingContext.prototype);
      }
      const patchedWebglWindows = new WeakSet();
      subWindowSyncHooks.push((subWin) => {
        if (!subWin || patchedWebglWindows.has(subWin)) return;
        if (adoptNativeBridgeWrappers(subWin.WebGLRenderingContext?.prototype, subWin.WebGL2RenderingContext?.prototype)) {
          try { patchedWebglWindows.add(subWin); } catch (_) {}
          return;
        }
        try { patchedWebglWindows.add(subWin); } catch (_) {}
        if (subWin.WebGLShaderPrecisionFormat && subWin.WebGLShaderPrecisionFormat.prototype) {
          patchPrecisionFormatProto(subWin.WebGLShaderPrecisionFormat.prototype);
        }
        if (subWin.WebGLRenderingContext) {
          patchGetParameter(subWin.WebGLRenderingContext.prototype);
          patchGetShaderPrecisionFormat(subWin.WebGLRenderingContext.prototype);
          patchReadPixels(subWin.WebGLRenderingContext.prototype);
          patchGetExtension(subWin.WebGLRenderingContext.prototype);
          patchGetSupportedExtensions(subWin.WebGLRenderingContext.prototype);
        }
        if (subWin.WebGL2RenderingContext) {
          patchGetParameter(subWin.WebGL2RenderingContext.prototype);
          patchGetShaderPrecisionFormat(subWin.WebGL2RenderingContext.prototype);
          patchReadPixels(subWin.WebGL2RenderingContext.prototype);
          patchGetExtension(subWin.WebGL2RenderingContext.prototype);
          patchGetSupportedExtensions(subWin.WebGL2RenderingContext.prototype);
        }
      });
    } catch (_) {}
  }

  // --- client rects ---
  if (CFG.clientRects && CFG.clientRects.mode === 'noise') {
    try {
      const mark = Number(CFG.clientRects.mark) || 1;
      // Bucket width is what makes two profiles distinguishable. The original 7-way residue
      // collides for roughly one in seven seed pairs, and when it collides two *different* profiles
      // measure byte-identical ClientRects -- the exact cross-profile differentiation this layer
      // exists to provide. Use much finer residues (97 / 89 buckets) so the offsets almost never
      // coincide, while keeping every offset far below one CSS pixel so the value stays plausible
      // for a real device.
      const absMark = Math.abs(Math.trunc(mark)) || 1;
      const noisePx = ((absMark % 97) - 48) * 0.00001;
      const noiseSize = ((absMark % 89) - 44) * 0.00001;

      const rectListStates = new WeakMap();

      const ensureRectListAccessor = (rectListProto, key, serve) => {
        if (!rectListProto) return false;
        const descriptor = Object.getOwnPropertyDescriptor(rectListProto, key);
        if (!descriptor || typeof descriptor.get !== 'function') return false;
        const nativeGet = descriptor.get;
        Object.defineProperty(rectListProto, key, nativeAccessor(key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          get() {
            if (!this || (typeof this !== 'object' && typeof this !== 'function')) return nativeGet.call(this);
            const state = rectListStates.get(this);
            if (state) return serve(state);
            return nativeGet.call(this);
          },
          set: descriptor.set,
        }));
        return true;
      };

      const ensureRectListMethod = (rectListProto, key, serve) => {
        if (!rectListProto) return false;
        const descriptor = Object.getOwnPropertyDescriptor(rectListProto, key);
        if (!descriptor || typeof descriptor.value !== 'function') return false;
        const nativeMethod = descriptor.value;
        Object.defineProperty(rectListProto, key, {
          configurable: descriptor.configurable,
          enumerable: descriptor.enumerable,
          writable: descriptor.writable,
          value: nativeLike(function (...args) {
            if (!this || (typeof this !== 'object' && typeof this !== 'function')) return nativeMethod.apply(this, args);
            const state = rectListStates.get(this);
            if (state) return serve(state, args);
            return nativeMethod.apply(this, args);
          }, nativeMethod),
        });
        return true;
      };

      const patchedClientRectWindows = new WeakSet();
      const patchClientRectsForWindow = (targetWin) => {
        if (!targetWin || patchedClientRectWindows.has(targetWin)) return;
        // Only the two geometry methods this layer owns may veto the patch. Scanning every own
        // member of Element.prototype was wrong: the font shield installs Element.prototype
        // .getAttribute through nativeLike(), which carries the same bridge marker, so
        // adoptNativeBridgeWrappers() reported "already patched" on every document and the whole
        // clientRects layer bailed out. Every profile then measured identical rects -- visible to
        // any page that compares two environments, and the reason the cross-profile audit failed.
        const rectMethodAlreadyBridged = (proto, key) => {
          if (!proto) return false;
          const descriptor = Object.getOwnPropertyDescriptor(proto, key);
          const fn = descriptor && descriptor.value;
          const state = inspectBridge(fn);
          if (!state) return false;
          try { nativeSource.set(fn, state.nativeText || ('function ' + (fn.name || key) + '() { [native code] }')); } catch (_) {}
          return true;
        };
        const alreadyPatchedByUs = ['getBoundingClientRect', 'getClientRects'].some((key) => (
          rectMethodAlreadyBridged(targetWin.Element && targetWin.Element.prototype, key)
          || rectMethodAlreadyBridged(targetWin.Range && targetWin.Range.prototype, key)
        ));
        if (alreadyPatchedByUs) {
          try { patchedClientRectWindows.add(targetWin); } catch (_) {}
          return;
        }
        try { patchedClientRectWindows.add(targetWin); } catch (_) {}
        const TargetDOMRect = targetWin.DOMRect || globalThis.DOMRect;
        const targetDOMRectListProto = targetWin.DOMRectList ? targetWin.DOMRectList.prototype : null;

        if (targetDOMRectListProto) {
          ensureRectListAccessor(targetDOMRectListProto, 'length', (state) => state.length);
          ensureRectListMethod(targetDOMRectListProto, 'item', (state, args) => {
            const index = Math.trunc(Number(args[0]) || 0);
            return index >= 0 && index < state.length ? state.rects[index] : null;
          });
          if (typeof Symbol !== 'undefined' && Symbol.iterator) {
            ensureRectListMethod(targetDOMRectListProto, Symbol.iterator, (state) => state.rects[Symbol.iterator]());
          }
        }

        const makeRectList = (rects) => {
          const list = Object.create(targetDOMRectListProto || globalThis.DOMRectList?.prototype || Object.prototype);
          const state = { length: rects.length, rects: rects.slice() };
          rectListStates.set(list, state);
          for (let i = 0; i < state.length; i += 1) {
            Object.defineProperty(list, String(i), {
              value: state.rects[i],
              enumerable: true,
              configurable: true,
              writable: false,
            });
          }
          return list;
        };

        // A Range measures its commonAncestorContainer; an Element measures itself. Both must be
        // font-sanitised so a foreign family cannot leak host metrics through layout probes.
        const scopeTargetFor = (receiver, isRange) => {
          if (!isRange) return receiver;
          try {
            const c = receiver && receiver.commonAncestorContainer;
            if (!c) return null;
            return c.nodeType === 1 ? c : (c.parentElement || null);
          } catch (_) { return null; }
        };

        const patchRect = (proto, method, isRange = false) => {
          if (!proto || !proto[method]) return;
          replaceMethod(proto, method, (original) => function() {
            const run = () => {
              const rect = original.apply(this, arguments);
              if (!rect) return rect;
              try {
                const x = rect.x + noisePx, y = rect.y + noisePx;
                const width = rect.width === 0 ? 0 : Math.max(0, rect.width + noiseSize);
                const height = rect.height === 0 ? 0 : Math.max(0, rect.height + noiseSize);
                return TargetDOMRect && TargetDOMRect.fromRect ? TargetDOMRect.fromRect({ x, y, width, height }) : rect;
              } catch (_) { return rect; }
            };
            return sanitizeElementFontScope(scopeTargetFor(this, isRange), run);
          });
        };

        const patchList = (proto, method, isRange = false) => {
          if (!proto || !proto[method]) return;
          replaceMethod(proto, method, (original) => function() {
            const run = () => {
              const list = original.apply(this, arguments);
              if (!list) return list;
              try {
                const rects = [];
                for (let i = 0; i < list.length; i += 1) {
                  const rect = list[i];
                  const width = rect.width === 0 ? 0 : Math.max(0, rect.width + noiseSize);
                  const height = rect.height === 0 ? 0 : Math.max(0, rect.height + noiseSize);
                  rects.push(TargetDOMRect && TargetDOMRect.fromRect
                    ? TargetDOMRect.fromRect({ x: rect.x + noisePx, y: rect.y + noisePx, width, height })
                    : rect);
                }
                return makeRectList(rects);
              } catch (_) { return list; }
            };
            return sanitizeElementFontScope(scopeTargetFor(this, isRange), run);
          });
        };

        if (targetWin === globalThis) {
          if (typeof Element !== 'undefined') {
            patchRect(Element.prototype, 'getBoundingClientRect');
            patchList(Element.prototype, 'getClientRects');
          }
          if (globalThis.Range) {
            patchRect(Range.prototype, 'getBoundingClientRect', true);
            patchList(Range.prototype, 'getClientRects', true);
          }
        } else {
          if (targetWin.Element) {
            patchRect(targetWin.Element.prototype, 'getBoundingClientRect');
            patchList(targetWin.Element.prototype, 'getClientRects');
          }
          if (targetWin.Range) {
            patchRect(targetWin.Range.prototype, 'getBoundingClientRect', true);
            patchList(targetWin.Range.prototype, 'getClientRects', true);
          }
        }
      };

      patchClientRectsForWindow(globalThis);
      subWindowSyncHooks.push((subWin) => { patchClientRectsForWindow(subWin); });
    } catch (_) {}
  }

`;
