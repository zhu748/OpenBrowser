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
// Adapter-info prototype resolution falls back to the live instance when
// the constructor is absent from the realm.
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
          // Keep native validation and promise rejections in every realm.
          await Reflect.apply(origReq, this, args);
          return null;
        });
      } else if (gpuMode === 'webgl' && gpuInfo && requestTarget) {
        const infoOverrides = new WeakMap();
        const adapterInfos = new WeakMap();
        const featuresMap = new WeakMap();
        const featureIterators = new WeakMap();
        const patchedIteratorPrototypes = new WeakSet();
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

        const rememberFeatures = (features) => {
          if (!features || !disallowedFeatures.size || featuresMap.has(features)) return;
          try {
            const allowed = new Set();
            let removed = false;
            for (const value of features) {
              if (disallowedFeatures.has(value)) removed = true;
              else allowed.add(value);
            }
            featuresMap.set(features, removed ? allowed : null);
          } catch (_) {}
        };

        const filterIterator = (iterator, allowed, entries) => {
          const proto = Object.getPrototypeOf(iterator);
          if (!patchedIteratorPrototypes.has(proto)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, 'next');
            const next = descriptor?.value;
            if (typeof next !== 'function') return iterator;
            Object.defineProperty(proto, 'next', {
              ...descriptor,
              value: nativeLike(function nextFeature(...args) {
                let item = Reflect.apply(next, this, args);
                const filter = featureIterators.get(this);
                while (filter && !item.done && !filter.allowed.has(filter.entries ? item.value[0] : item.value)) {
                  item = Reflect.apply(next, this, args);
                }
                return item;
              }, next),
            });
            patchedIteratorPrototypes.add(proto);
          }
          featureIterators.set(iterator, { allowed, entries });
          return iterator;
        };

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
                const size = natSizeGet.call(this);
                return featuresMap.get(this)?.size ?? size;
              }, natSizeGet, 'get size', 0),
              set: sizeDesc.set,
            });
          }
          const hasDesc = Object.getOwnPropertyDescriptor(fProto, 'has');
          if (typeof hasDesc?.value === 'function') {
            const natHas = hasDesc.value;
            const hasMethod = nativeLike(function has() {
              const filtered = featuresMap.get(this);
              if (!filtered) return Reflect.apply(natHas, this, arguments);
              const call = invokeNativeText(natHas, this, arguments);
              return call.value && filtered.has(call.text);
            }, natHas, 'has', 1);
            Object.defineProperty(fProto, 'has', { ...hasDesc, value: hasMethod });
          }
          // Reuse one wrapper when the binding aliases values, keys or @@iterator.
          const iteratorMethods = new Map();
          for (const key of ['entries', 'keys', 'values', Symbol.iterator]) {
            const desc = Object.getOwnPropertyDescriptor(fProto, key);
            const original = desc?.value;
            if (typeof original !== 'function') continue;
            let patched = iteratorMethods.get(original);
            if (!patched) {
              patched = nativeLike(function (...args) {
                const iterator = Reflect.apply(original, this, args);
                const allowed = featuresMap.get(this);
                return allowed ? filterIterator(iterator, allowed, key === 'entries') : iterator;
              }, original);
              iteratorMethods.set(original, patched);
            }
            Object.defineProperty(fProto, key, { ...desc, value: patched });
          }
          const forEachDesc = Object.getOwnPropertyDescriptor(fProto, 'forEach');
          if (typeof forEachDesc?.value === 'function') {
            const natForEach = forEachDesc.value;
            const forEachMethod = nativeLike(function forEach(callback, thisArg) {
              const filtered = featuresMap.get(this);
              if (!filtered || typeof callback !== 'function') return Reflect.apply(natForEach, this, arguments);
              return natForEach.call(this, function visit(value, key, owner) {
                'use strict';
                if (filtered.has(value)) Reflect.apply(callback, this, [value, key, owner]);
              }, thisArg);
            }, natForEach, 'forEach', 1);
            Object.defineProperty(fProto, 'forEach', { ...forEachDesc, value: forEachMethod });
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
                const value = natGet.call(this);
                const custom = limitsMap.get(this);
                if (custom && Object.prototype.hasOwnProperty.call(custom, key)) {
                  return custom[key];
                }
                return value;
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
                rememberFeatures(f);
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
            rememberFeatures(features);
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
