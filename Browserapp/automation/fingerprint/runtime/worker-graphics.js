'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  const canvasMark = Number(CFG.canvas?.mark) || 1;
  if (CFG.canvas?.mode === 'blocked') {
    const deny = () => { throw new DOMException('Canvas reading is disabled by permissions policy', 'SecurityError'); };
    replace(globalThis.OffscreenCanvasRenderingContext2D?.prototype, 'getImageData', () => deny);
    replace(globalThis.OffscreenCanvas?.prototype, 'convertToBlob', () => function() {
      return Promise.reject(new DOMException('Canvas reading is disabled by permissions policy', 'SecurityError'));
    });
  } else if (CFG.canvas?.mode === 'noise') {
    const readback = createCanvasReadbackCache();
    replace(globalThis.OffscreenCanvasRenderingContext2D?.prototype, 'getImageData', (original) => function(...args) {
      const image = original.apply(this, args);
      return readback.tag(readback.matches(this, image, args) ? image : applyNoise(image, canvasMark));
    });
    replace(globalThis.OffscreenCanvasRenderingContext2D?.prototype, 'putImageData', (original) => function(...args) {
      const result = original.apply(this, args);
      try { readback.wrote(this, args); } catch (_) {}
      return result;
    });
    replace(globalThis.OffscreenCanvas?.prototype, 'convertToBlob', (original) => async function convertToBlob(options) {
      const captured = captureImageEncodeOptions(options);
      const blob = await original.call(this, captured.options);
      let bitmap;
      try {
        bitmap = await createImageBitmap(blob);
        const w = bitmap.width, h = bitmap.height;
        const copy = new OffscreenCanvas(w, h);
        const context = copy.getContext('2d');
        if (!context) return blob;
        context.drawImage(bitmap, 0, 0);
        const image = context.getImageData(0, 0, copy.width, copy.height);
        context.putImageData(image, 0, 0);
        return original.call(copy, captured.replay);
      } catch (_) { return blob; }
      finally { try { bitmap?.close(); } catch (_) {} }
    });
    installVideoFrameCopy(globalThis.VideoFrame?.prototype, replace, (image) => applyNoise(image, canvasMark));
  }
  // Worker measureText parity: the main thread jitters TextMetrics by a
  // (origin, seed, font, text) hash (document-graphics F-5); without the same
  // treatment here, a detector comparing main-thread canvas metrics with
  // OffscreenCanvas metrics in a worker sees the jitter on one side only —
  // and a cross-session comparison sees the raw host font stack on the
  // worker side.
  // Font-family sanitization, mirroring the document gate (document-fonts.js): a
  // font family foreign to the claimed OS must not reach the host rasterizer inside
  // a worker either, or OffscreenCanvas measureText/drawText leaks the host's
  // fontconfig substitution for that family. The ctx.font setter rewrites foreign
  // families out before the native side sees them.
  if (CFG.fonts && Array.isArray(CFG.fonts.foreign) && CFG.fonts.foreign.length
    && globalThis.OffscreenCanvasRenderingContext2D?.prototype) {
    try {
      const foreignFontSet = new Set(CFG.fonts.foreign
        .map((name) => String(name || '').trim().toLowerCase())
        .filter(Boolean));
      const stripFamily = (token) => String(token || '').trim()
        .replace(/^"([^"\\\\]|\\\\.)*"$/, '')
        .replace(/^'([^'\\\\]|\\\\.)*'$/, '')
        .replace(/^"([^"]*)"$/, '$1')
        .replace(/^'([^']*)'$/, '$1')
        .trim();
      const splitFamilyList = (value) => {
        const out = [];
        let current = '';
        let quote = null;
        for (let i = 0; i < value.length; i++) {
          const ch = value[i];
          if (quote) {
            current += ch;
            if (ch === quote && value[i - 1] !== String.fromCharCode(92)) quote = null;
            continue;
          }
          if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
          if (ch === ',') { out.push(current.trim()); current = ''; continue; }
          current += ch;
        }
        if (current.trim()) out.push(current.trim());
        return out;
      };
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
      const ctxProto = globalThis.OffscreenCanvasRenderingContext2D.prototype;
      const fontDescriptor = Object.getOwnPropertyDescriptor(ctxProto, 'font');
      if (fontDescriptor && typeof fontDescriptor.get === 'function' && typeof fontDescriptor.set === 'function') {
        const nativeGet = fontDescriptor.get;
        const nativeSet = fontDescriptor.set;
        const originals = new WeakMap();
        Object.defineProperty(ctxProto, 'font', {
          configurable: fontDescriptor.configurable,
          enumerable: fontDescriptor.enumerable,
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
      }
      // measureText also sanitizes on the fly: a font set before this patch installed
      // (or via a direct native path) must not rasterize a foreign family either.
      const originalMeasureForSanitize = ctxProto.measureText;
      if (typeof originalMeasureForSanitize === 'function') {
        Object.defineProperty(ctxProto, 'measureText', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: nativeLike(function measureText(text) {
            const currentFont = String(this.font || '');
            const cleanFont = sanitizeFontShorthand(currentFont);
            if (cleanFont !== currentFont) {
              try { this.font = cleanFont; } catch (_) {}
              const temporaryFont = String(this.font || '');
              try { return originalMeasureForSanitize.apply(this, arguments); }
              finally { try { if (String(this.font || '') === temporaryFont) this.font = currentFont; } catch (_) {} }
            }
            return originalMeasureForSanitize.apply(this, arguments);
          }, originalMeasureForSanitize, 'measureText', 1),
        });
      }
    } catch (_) {}
  }
  if (CFG.canvas?.mode === 'noise' && globalThis.OffscreenCanvasRenderingContext2D?.prototype?.measureText) {
    const measureJitterCache = createTextMetricJitterCache(String(globalThis.location?.origin || ''),
      String(CFG.seed || CFG.canvas?.mark || '1'));
    replace(globalThis.OffscreenCanvasRenderingContext2D.prototype, 'measureText', (original) => function measureText(text, ...args) {
      const call = invokeNativeText(original, this, arguments);
      const tm = call.value;
      try {
        const { jitter, widthJitter } = measureJitterCache.get(String(this.font || ''), call.text);
        return new Proxy(tm, {
          get(target, prop) {
            if (prop === 'constructor') return target.constructor;
            const val = Reflect.get(target, prop, target);
            if (typeof val === 'number') {
              if (prop === 'width') return val === 0 ? 0 : Math.max(0, val + widthJitter);
              if (prop === 'actualBoundingBoxRight') return val + jitter;
              if (prop === 'actualBoundingBoxLeft') return val - jitter;
              if (prop === 'actualBoundingBoxAscent') return val + (jitter * 0.5);
              if (prop === 'actualBoundingBoxDescent') return val - (jitter * 0.5);
              // Keep parity with the document-side TextMetrics proxy (see
              // document-graphics.js): fontBoundingBox* and baseline offsets get the
              // same half/quarter-strength jitter so a value compared across the main
              // thread and a worker cannot diverge in WHICH properties are spoofed.
              if (prop === 'fontBoundingBoxAscent') return val + (jitter * 0.5);
              if (prop === 'fontBoundingBoxDescent') return val - (jitter * 0.5);
              if (prop === 'fontBoundingBoxLeft') return val - jitter;
              if (prop === 'fontBoundingBoxRight') return val + jitter;
              if (prop === 'alphabeticBaseline') return val + (jitter * 0.25);
              if (prop === 'ideographicBaseline' || prop === 'hangingBaseline') return val + (jitter * 0.25);
            }
            return typeof val === 'function' ? val.bind(target) : val;
          },
        });
      } catch (_) { return tm; }
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
        }
        if (proto.getShaderPrecisionFormat) {
          replace(proto, 'getShaderPrecisionFormat', (original) => function(shaderType, precisionType) {
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
              for (const key of ['rangeMin', 'rangeMax', 'precision']) target[key] = Math.min(Number(fmt[key]), target[key]);
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
              const n = noiseDelta(noise(i + mark), ampW);
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
`;
