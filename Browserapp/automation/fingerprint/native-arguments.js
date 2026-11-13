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

function invokeNativeText(original, receiver, args) {
  if (typeof args[0] === 'string') return { value: Reflect.apply(original, receiver, args), text: args[0] };
  const input = args[0];
  if (args.length && (input === null || (typeof input !== 'object' && typeof input !== 'function'))) {
    // Let native bindings own primitive errors (including their API prefix).
    const value = Reflect.apply(original, receiver, args);
    return { value, text: String(input) };
  }
  const forwarded = Array.from(args);
  let text;
  if (forwarded.length) {
    forwarded[0] = { [Symbol.toPrimitive]() { text = `${input}`; return text; } };
  }
  return { value: Reflect.apply(original, receiver, forwarded), text };
}

// Native dictionary conversion owns access order and validation. Record the
// converted members so an internal second encode never re-runs user getters.
function captureImageEncodeOptions(options) {
  const replay = Object.assign(Object.create(null), { quality: undefined, type: 'image/png' });
  if (options === null || (typeof options !== 'object' && typeof options !== 'function')) return { options, replay };
  const forwarded = new Proxy(Object.create(null), {
    get(_target, key) {
      const value = Reflect.get(options, key, options);
      if (value === undefined || (key !== 'quality' && key !== 'type')) return value;
      const object = value !== null && (typeof value === 'object' || typeof value === 'function');
      if (!object) {
        replay[key] = key === 'quality'
          ? (typeof value === 'symbol' || typeof value === 'bigint' ? value : +value)
          : (typeof value === 'symbol' ? value : String(value));
        return value;
      }
      if (key === 'quality') return { valueOf() { replay.quality = +value; return replay.quality; } };
      return { [Symbol.toPrimitive]() { replay.type = `${value}`; return replay.type; } };
    },
  });
  return { options: forwarded, replay };
}

module.exports = { invokeNativeUnsigned, invokeNativeText, captureImageEncodeOptions,
  runtimeSource: `${invokeNativeUnsigned.toString()}\n${invokeNativeText.toString()}\n${captureImageEncodeOptions.toString()}\n` };
