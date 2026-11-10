'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // --- canvas ---
  const webglCanvases = new WeakSet();
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
    const rawGetMap = new WeakMap();
    const noisedImageDataMap = new WeakMap();
    const ctxLastPutMap = new WeakMap();

    const patchedCanvasWindows = new WeakSet();
    const patchCanvasForWindow = (targetWin) => {
      if (!targetWin || patchedCanvasWindows.has(targetWin)) return;
      if (adoptNativeBridgeWrappers(targetWin.HTMLCanvasElement?.prototype, targetWin.CanvasRenderingContext2D?.prototype, targetWin.OffscreenCanvasRenderingContext2D?.prototype, targetWin.OffscreenCanvas?.prototype)) {
        try { patchedCanvasWindows.add(targetWin); } catch (_) {}
        return;
      }
      try { patchedCanvasWindows.add(targetWin); } catch (_) {}
      try {
        const hookGetAndPut = (proto) => {
          if (!proto) return;
          if (proto.getImageData) {
            const originalGet = replaceMethod(proto, 'getImageData', (original) => function getImageData(...args) {
              const result = original.apply(this, args);
              try {
                const lastPut = ctxLastPutMap.get(this);
                if (lastPut && lastPut.data && result && result.data && result.data.length === lastPut.data.length) {
                  const sx = args[0] || 0;
                  const sy = args[1] || 0;
                  const sw = args[2] || 0;
                  const sh = args[3] || 0;
                  if (sx === lastPut.dx && sy === lastPut.dy && sw === lastPut.w && sh === lastPut.h) {
                    result.data.set(lastPut.data);
                    noisedImageDataMap.set(result, true);
                    return result;
                  }
                }
              } catch (_) {}
              const noised = applyCanvasNoise(result, mark);
              try { noisedImageDataMap.set(noised, true); } catch (_) {}
              return noised;
            });
            if (originalGet) rawGetMap.set(proto, originalGet);
          }
          if (proto.putImageData) {
            replaceMethod(proto, 'putImageData', (origPut) => function putImageData(imgData, dx, dy, ...rest) {
              try {
                if (noisedImageDataMap.has(imgData)) {
                  ctxLastPutMap.set(this, {
                    data: imgData.data,
                    dx: dx | 0,
                    dy: dy | 0,
                    w: imgData.width | 0,
                    h: imgData.height | 0,
                  });
                } else {
                  ctxLastPutMap.delete(this);
                }
              } catch (_) {}
              return origPut.call(this, imgData, dx, dy, ...rest);
            });
          }
          if (proto.measureText) {
            replaceMethod(proto, 'measureText', (origMeasure) => function measureText(text, ...args) {
              const currentFont = String(this.font || '');
              const cleanFont = sanitizeCanvasFontShorthand(currentFont);
              let fontSwapped = false;
              if (cleanFont !== currentFont) {
                try {
                  this.font = cleanFont;
                  fontSwapped = true;
                } catch (_) {}
              }
              let tm;
              try {
                tm = origMeasure.call(this, text, ...args);
              } finally {
                if (fontSwapped) {
                  try { this.font = currentFont; } catch (_) {}
                }
              }
              try {
                const s = String(text || '');
                const originStr = String(targetWin?.location?.origin || globalThis.location?.origin || '');
                const seedStr = String(CFG.seed || CFG.canvas?.mark || '1');
                const hashKey = originStr + ':' + seedStr + ':' + currentFont + ':' + s;
                let h = 0;
                for (let i = 0; i < hashKey.length; i++) h = ((h << 5) - h + hashKey.charCodeAt(i)) | 0;
                const jitter = ((h % 100) / 10000);
                const widthJitter = (((h % 200) - 100) / 10000);
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
                    }
                    return typeof val === 'function' ? val.bind(target) : val;
                  }
                });
              } catch (_) {
                return tm;
              }
            });
          }
        };

        const ctxProto = targetWin.CanvasRenderingContext2D && targetWin.CanvasRenderingContext2D.prototype;
        hookGetAndPut(ctxProto);
        const offscreenCtxProto = targetWin.OffscreenCanvasRenderingContext2D?.prototype;
        hookGetAndPut(offscreenCtxProto);

        const noiseCanvas = (source) => {
          const w = source.width | 0;
          const h = source.height | 0;
          if (!w || !h) return null;
          const doc = (source && source.ownerDocument) || (targetWin && targetWin.document) || document;
          const copy = doc.createElement('canvas');
          copy.width = w;
          copy.height = h;
          const c2 = copy.getContext('2d');
          if (!c2) return null;
          try {
            if (webglCanvases.has(source)) {
              try {
                const gl = source.getContext('webgl2') || source.getContext('webgl') || source.getContext('experimental-webgl');
                if (gl && typeof gl.readPixels === 'function') {
                  const pixels = new Uint8Array(w * h * 4);
                  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                  const imgData = c2.createImageData(w, h);
                  const rowBytes = w * 4;
                  for (let y = 0; y < h; y++) {
                    const srcY = (h - 1 - y) * rowBytes;
                    const dstY = y * rowBytes;
                    imgData.data.set(pixels.subarray(srcY, srcY + rowBytes), dstY);
                  }
                  c2.putImageData(imgData, 0, 0);
                  return copy;
                }
              } catch (_) {}
            }
            c2.drawImage(source, 0, 0);
            const rawGet = ctxProto ? rawGetMap.get(ctxProto) : null;
            const image = applyCanvasNoise(rawGet ? rawGet.call(c2, 0, 0, w, h) : c2.getImageData(0, 0, w, h), mark);
            c2.putImageData(image, 0, 0);
            return copy;
          } catch (_) { return null; }
        };

        const canvasProto = targetWin.HTMLCanvasElement && targetWin.HTMLCanvasElement.prototype;
        if (canvasProto && canvasProto.toDataURL) {
          replaceMethod(canvasProto, 'toDataURL', (original) => function toDataURL(...args) {
            try {
              const copy = noiseCanvas(this);
              if (copy) return original.apply(copy, args);
            } catch (_) {}
            return original.apply(this, args);
          });
        }

        if (canvasProto && canvasProto.toBlob) {
          replaceMethod(canvasProto, 'toBlob', (originalBlob) => function toBlob(cb, ...rest) {
            if (typeof cb !== 'function') return originalBlob.apply(this, arguments);
            try {
              const copy = noiseCanvas(this);
              if (copy) return originalBlob.call(copy, cb, ...rest);
            } catch (_) {}
            return originalBlob.call(this, cb, ...rest);
          });
        }

        const offscreenProto = targetWin.OffscreenCanvas?.prototype;
        if (offscreenProto?.convertToBlob) {
          replaceMethod(offscreenProto, 'convertToBlob', (original) => async function convertToBlob(options) {
            try {
              const w = Number(this.width) || 0;
              const h = Number(this.height) || 0;
              if (w > 0 && h > 0 && webglCanvases.has(this)) {
                const gl = this.getContext('webgl2') || this.getContext('webgl') || this.getContext('experimental-webgl');
                if (gl && typeof gl.readPixels === 'function') {
                  const pixels = new Uint8Array(w * h * 4);
                  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                  const TargetOffscreen = targetWin.OffscreenCanvas || OffscreenCanvas;
                  const copy = new TargetOffscreen(w, h);
                  const context = copy.getContext('2d');
                  if (context) {
                    const imgData = context.createImageData(w, h);
                    const rowBytes = w * 4;
                    for (let y = 0; y < h; y++) {
                      const srcY = (h - 1 - y) * rowBytes;
                      const dstY = y * rowBytes;
                      imgData.data.set(pixels.subarray(srcY, srcY + rowBytes), dstY);
                    }
                    context.putImageData(imgData, 0, 0);
                    return original.call(copy, options);
                  }
                }
              }
            } catch (_) {}
            const blob = await original.call(this, options);
            try {
              const w = Number(this.width) || 0;
              const h = Number(this.height) || 0;
              if (w <= 0 || h <= 0) return blob;
              const bitmap = await createImageBitmap(blob);
              const TargetOffscreen = targetWin.OffscreenCanvas || OffscreenCanvas;
              const copy = new TargetOffscreen(w, h);
              const context = copy.getContext('2d');
              if (!context) return blob;
              context.drawImage(bitmap, 0, 0);
              bitmap.close?.();
              const image = context.getImageData(0, 0, w, h);
              context.putImageData(image, 0, 0);
              return original.call(copy, options);
            } catch (_) { return blob; }
          });
        }

        const videoFrameProto = targetWin.VideoFrame ? targetWin.VideoFrame.prototype : null;
        if (videoFrameProto && typeof videoFrameProto.copyTo === 'function') {
          const packedRedOffset = (format) => {
            const name = String(format || '');
            if (name === 'RGBA' || name === 'RGBX') return 0;
            if (name === 'BGRA' || name === 'BGRX') return 2;
            return -1;
          };
          const perturbCopiedFrame = (frame, destination, options) => {
            try {
              const settings = options || {};
              const redOffset = packedRedOffset(settings.format || frame.format);
              if (redOffset < 0) return;
              const view = destination instanceof ArrayBuffer
                ? new Uint8Array(destination)
                : (ArrayBuffer.isView(destination)
                  ? new Uint8Array(destination.buffer, destination.byteOffset, destination.byteLength)
                  : null);
              if (!view) return;
              const frameWidth = Number(frame.codedWidth || frame.displayWidth || 0) || 0;
              const frameHeight = Number(frame.codedHeight || frame.displayHeight || 0) || 0;
              if (!frameWidth || !frameHeight) return;
              const layout = settings.layout || null;
              const base = Number(layout && layout.offset) || 0;
              const rowBytes = Number(layout && layout.bytesPerRow) >= frameWidth * 4
                ? Number(layout.bytesPerRow)
                : frameWidth * 4;
              const rect = settings.rect || null;
              const rx = Number(rect && rect.x) || 0;
              const ry = Number(rect && rect.y) || 0;
              const rw = Number(rect && rect.width) || frameWidth;
              const rh = Number(rect && rect.height) || frameHeight;
              if (!(rw > 0) || !(rh > 0)) return;
              const temp = new Uint8ClampedArray(rw * rh * 4);
              for (let y = 0; y < rh; y += 1) {
                for (let x = 0; x < rw; x += 1) {
                  const from = base + (ry + y) * rowBytes + (rx + x) * 4;
                  if (from + 3 >= view.length) return;
                  const to = (y * rw + x) * 4;
                  temp[to] = view[from + redOffset];
                  temp[to + 1] = view[from + 1];
                  temp[to + 2] = view[from + (redOffset === 0 ? 2 : 0)];
                  temp[to + 3] = view[from + 3];
                }
              }
              applyCanvasNoise({ data: temp, width: rw, height: rh }, mark);
              for (let y = 0; y < rh; y += 1) {
                for (let x = 0; x < rw; x += 1) {
                  const from = base + (ry + y) * rowBytes + (rx + x) * 4;
                  const to = (y * rw + x) * 4;
                  if (from + 3 >= view.length) return;
                  if (temp[to] === view[from + redOffset]) continue;
                  view[from + redOffset] = temp[to];
                }
              }
            } catch (_) {}
          };
          replaceMethod(videoFrameProto, 'copyTo', (original) => function copyTo(destination, options) {
            const result = original.apply(this, arguments);
            try {
              if (result && typeof result.then === 'function') {
                return result.then((value) => { perturbCopiedFrame(this, destination, options); return value; });
              }
              perturbCopiedFrame(this, destination, options);
            } catch (_) {}
            return result;
          });
        }

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
              const rawGet = ctxProto ? rawGetMap.get(ctxProto) : null;
              const image = applyCanvasNoise(rawGet ? rawGet.call(surface, 0, 0, size.width, size.height) : surface.getImageData(0, 0, size.width, size.height), mark);
              surface.putImageData(image, 0, 0);
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

        const wrapCtx = (proto) => {
          if (!proto || !proto.getContext) return;
          replaceMethod(proto, 'getContext', (original) => function getContext(...args) {
            const ctx = original.apply(this, args);
            try {
              const type = String(args[0] || '').toLowerCase();
              if (type.includes('webgl') || type.includes('experimental-webgl')) {
                webglCanvases.add(this);
              }
            } catch (_) {}
            return ctx;
          });
        };
        wrapCtx(targetWin.HTMLCanvasElement && targetWin.HTMLCanvasElement.prototype);
        wrapCtx(targetWin.OffscreenCanvas && targetWin.OffscreenCanvas.prototype);
      } catch (_) {}
    };

    patchCanvasForWindow(globalThis);
    subWindowSyncHooks.push((subWin) => { patchCanvasForWindow(subWin); });
  }

  // --- webgl ---
  if (CFG.webgl && CFG.webgl.mode === 'blocked') {
    try {
      const blockContext = (proto) => replaceMethod(proto, 'getContext', (target) => function(...argArray) {
          const type = String(argArray[0] || '');
          if (type.includes('webgl') || type === 'experimental-webgl') return null;
          return Reflect.apply(target, this, argArray);
      });
      blockContext(globalThis.HTMLCanvasElement?.prototype);
      blockContext(globalThis.OffscreenCanvas?.prototype);
    } catch (_) {}
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
          const fmt = original.apply(this, arguments);
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
            precisionOverridesMap.set(fmt, target);
          }
          return fmt;
        });
      };

      const patchGetParameter = (proto) => {
        if (!proto || !proto.getParameter) return;
        if (metaMode === 'real') return;
        replaceMethod(proto, 'getParameter', (original) => function(param) {
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
              // MAX_VIEWPORT_DIMS has to follow the size limits, and it is an array, so it is
              // rebuilt from the native value's own constructor to keep the exact same type.
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
              // ALIASED_POINT_SIZE_RANGE: Float32Array [1, maxPoint]
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
                const n = Math.floor(noise(i + mark) * amp) - Math.floor(amp / 2);
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

      // Track WebGL canvases so 2D toDataURL does not attempt to draw them
      try {
        const wrapCtx = (proto) => {
          if (!proto || !proto.getContext) return;
          replaceMethod(proto, 'getContext', (original) => function(...args) {
            const ctx = original.apply(this, args);
            try {
              const type = String(args[0] || '').toLowerCase();
              if (type.includes('webgl') || type.includes('experimental-webgl')) {
                webglCanvases.add(this);
              }
            } catch (_) {}
            return ctx;
          });
        };
        wrapCtx(globalThis.HTMLCanvasElement && HTMLCanvasElement.prototype);
        wrapCtx(globalThis.OffscreenCanvas && OffscreenCanvas.prototype);
      } catch (_) {}
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
