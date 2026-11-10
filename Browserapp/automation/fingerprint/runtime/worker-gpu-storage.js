'use strict';

// Ordered fragment of one emitted IIFE; runtime-source.js owns assembly.
module.exports = `  // DedicatedWorker WebGPU adapter surface parity
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
