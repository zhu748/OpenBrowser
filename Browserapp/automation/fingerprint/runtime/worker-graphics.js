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
