'use strict';

const { invokeNativeUnsigned } = require('./native-arguments');

// Let WebIDL validate the receiver, arity and numeric conversion exactly once.
// The conversion object only runs after native receiver validation succeeds.
function readWebglParameter(original, receiver, args) {
  const result = invokeNativeUnsigned(original, receiver, args, [0]);
  return { value: result.value, param: result.values[0] };
}

// Runs in the target realm. A persona can lower a driver's limits, but cannot
// grant capabilities the context does not have. Keep native null/error behavior.
function boundWebglLimit(native, requested, param) {
  const target = Number(requested);
  if (!Number.isFinite(target) || target <= 0) return native;
  if (param === 0x0d3a || param === 0x846d) {
    if (!native || native.length !== 2) return native;
    const out = new native.constructor(native);
    if (param === 0x0d3a) {
      out[0] = Math.min(native[0], target);
      out[1] = Math.min(native[1], target);
    } else {
      out[1] = Math.max(native[0], Math.min(native[1], target));
    }
    return out;
  }
  if (typeof native !== 'number' || !Number.isFinite(native)) return native;
  // UNIFORM_BUFFER_OFFSET_ALIGNMENT is a minimum requirement, not a maximum.
  if (param === 0x8a34) return Math.max(native, target);
  return Math.min(native, target);
}

module.exports = { boundWebglLimit, readWebglParameter,
  runtimeSource: `${readWebglParameter.toString()}\n${boundWebglLimit.toString()}\n` };
