'use strict';

// Preserve native receiver/arity/preceding-argument checks while recording
// WebIDL unsigned-long conversions. User coercion hooks run exactly once.
function invokeNativeUnsigned(original, receiver, args, indices) {
  const forwarded = Array.from(args);
  const values = [];
  for (const index of indices) {
    if (index >= forwarded.length) continue;
    const input = forwarded[index];
    forwarded[index] = { valueOf() { values[index] = (+input) >>> 0; return values[index]; } };
  }
  return { value: Reflect.apply(original, receiver, forwarded), values };
}

module.exports = { invokeNativeUnsigned, runtimeSource: `${invokeNativeUnsigned.toString()}\n` };
