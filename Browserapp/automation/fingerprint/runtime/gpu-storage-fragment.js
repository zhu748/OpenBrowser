'use strict';
const storageEstimate = require('./storage-estimate-fragment');

// M-1/M-2: document-gpu-storage.js and worker-gpu-storage.js were ~450-line
// verbatim twins drifting apart quote-style-first (128 divergent lines at the
// last audit). One parameterized factory now renders the shared WebGPU
// adapter / StorageManager surface for both realms; the realm-specific parts
// are the parameters:
//   - replaceHelper: the bootstrap's method-replacement helper name
//     (document: replaceMethod with stack stripping; worker: replace)
//   - guardedNavigator: document requires navigator.gpu before touching
//     anything (stock parity); the worker realm resolves the prototype from
//     the instance itself
// Storage estimate behavior is a separate shared fragment; it registers its
// same-origin sub-window hook only when the realm exposes that hook registry.
// Semantics unified on the more correct variant of each pair: the blocked
// requestAdapter re-raises TypeError (a genuine user error must not be
// swallowed into "no adapter"), and adapter-info prototype resolution falls
// back to the live instance's prototype when the global constructor is not
// exposed in the realm.
function gpuStorageFragment({ realm, replaceHelper, guardedNavigator, iifeCloser }) {
  const replace = replaceHelper;
  const navigatorGuard = guardedNavigator
    ? `  if (!isIosPersona && CFG.webgpu && typeof navigator !== "undefined" && navigator.gpu) {`
    : `  if (CFG.webgpu) {`;
  const requestTargetDecl = guardedNavigator
    ? `      const gpuProto = (typeof GPU !== 'undefined' && GPU.prototype) || (navigator.gpu && Object.getPrototypeOf(navigator.gpu));`
    : `      const navGpu = (() => { try { return navigator.gpu || null; } catch (_) { return null; } })();
      const gpuProto = (typeof GPU !== 'undefined' && GPU.prototype) || (navGpu && Object.getPrototypeOf(navGpu));`;
  return `  // --- WebGPU adapter info (${realm}) ---
  // Modes mirror the profile contract:
  //   real    : do not touch the kernel's adapter or its info
  //   blocked : keep navigator.gpu present but make requestAdapter resolve to no adapter
  //   webgl   : expose an adapter whose info matches the configured WebGL/GPU identity
${navigatorGuard}
    try {
      const gpuMode = String(CFG.webgpu.mode || 'real');
${requestTargetDecl}
      const requestTarget = gpuProto;

      const gpuInfo = CFG.webgpu.gpu && (CFG.webgpu.gpu.vendor || CFG.webgpu.gpu.architecture)
        ? {
          vendor: String(CFG.webgpu.gpu.vendor || ''),
          architecture: String(CFG.webgpu.gpu.architecture || ''),
          device: String(CFG.webgpu.gpu.device || ''),
          description: String(CFG.webgpu.gpu.description || CFG.webgpu.gpu.architecture || ''),
        }
        : null;

      if (gpuMode === 'blocked' && requestTarget) {
        ${replace}(requestTarget, 'requestAdapter', (origReq) => async function requestAdapter(...args) {
          if (typeof origReq === 'function') {
            try {
              await origReq.apply(this, args);
            } catch (err) {
              // A malformed request (TypeError) is a caller error, not "no adapter":
              // rethrow so parity with the native contract survives the spoof.
              if (err instanceof TypeError) throw err;
            }
          }
          return null;
        });
      } else if (gpuMode === 'webgl' && gpuInfo && requestTarget) {
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

        const patchInfoAccessor = (key, iProtoHint) => {
          const iProto = iProtoHint
            || (typeof GPUAdapterInfo !== 'undefined' && GPUAdapterInfo.prototype)
            || null;
          if (!iProto || patchedInfoKeys.has(key)) return false;
          const descriptor = Object.getOwnPropertyDescriptor(iProto, key);
          if (!descriptor || typeof descriptor.get !== 'function') return false;
          const nativeGet = descriptor.get;
          Object.defineProperty(iProto, key, {
            configurable: descriptor.configurable,
            enumerable: descriptor.enumerable,
            get: nativeLike(function adapterInfoValue() {
              const value = infoOverrides.get(this);
              if (value && Object.prototype.hasOwnProperty.call(value, key)) return value[key];
              return nativeGet.call(this);
            }, nativeGet, 'get ' + key, 0),
            set: descriptor.set,
          });
          patchedInfoKeys.add(key);
          return true;
        };

        const patchInfoAccessors = (iProto) => {
          if (!iProto) return;
          for (const key of Object.keys(gpuInfo)) patchInfoAccessor(key, iProto);
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
            ${replace}(aProto, 'requestAdapterInfo', (origReqInfo) => async function requestAdapterInfo(...args) {
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

        ${replace}(requestTarget, 'requestAdapter', (originalRequestAdapter) => async function requestAdapter(...args) {
          const adapter = await originalRequestAdapter.apply(this, args);
          if (!adapter) return adapter;
          prepareAdapter(adapter);
          return adapter;
        });
      }
    } catch (_) {}
  }

${storageEstimate}
${iifeCloser}`;
}

module.exports = { gpuStorageFragment };
