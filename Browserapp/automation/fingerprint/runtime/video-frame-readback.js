'use strict';

// Installed in both document and worker closures. Native copyTo owns all
// validation and layout conversion; only successful packed pixel copies change.
function installVideoFrameCopy(proto, replace, applyNoise) {
  if (!proto || typeof proto.copyTo !== 'function') return;
  const formatOf = Object.getOwnPropertyDescriptor(proto, 'format')?.get;
  const visibleOf = Object.getOwnPropertyDescriptor(proto, 'visibleRect')?.get;
  if (!formatOf || !visibleOf) return;
  const rectProto = globalThis.DOMRectReadOnly?.prototype;
  const widthOf = rectProto && Object.getOwnPropertyDescriptor(rectProto, 'width')?.get;
  const heightOf = rectProto && Object.getOwnPropertyDescriptor(rectProto, 'height')?.get;
  const typed = Object.getPrototypeOf(Uint8Array.prototype);
  const typedGet = ['buffer', 'byteOffset', 'byteLength'].map((key) => Object.getOwnPropertyDescriptor(typed, key).get);
  const dataViewGet = ['buffer', 'byteOffset', 'byteLength'].map((key) => Object.getOwnPropertyDescriptor(DataView.prototype, key).get);
  const isView = ArrayBuffer.isView;
  const primitive = (value) => value === null || (typeof value !== 'object' && typeof value !== 'function');
  const captureNumber = (value, save) => {
    if (primitive(value)) {
      if (typeof value !== 'symbol' && typeof value !== 'bigint') save(+value);
      return value;
    }
    return { valueOf() { const number = +value; save(number); return number; } };
  };
  const captureOptions = (options) => {
    const state = { format: undefined, rect: null };
    if (primitive(options)) return { options, state };
    const forwarded = new Proxy(Object.create(null), {
      get(_target, key) {
        const value = Reflect.get(options, key, options);
        if (key === 'format' && value !== undefined) {
          if (primitive(value)) {
            if (typeof value !== 'symbol') state.format = String(value);
            return value;
          }
          return { [Symbol.toPrimitive]() { state.format = `${value}`; return state.format; } };
        }
        if (key !== 'rect' || value === undefined) return value;
        state.rect = { width: 0, height: 0 };
        if (primitive(value)) return value;
        return new Proxy(Object.create(null), {
          get(_rect, member) {
            const item = Reflect.get(value, member, value);
            return (member === 'width' || member === 'height') && item !== undefined
              ? captureNumber(item, (number) => { state.rect[member] = number; }) : item;
          },
        });
      },
    });
    return { options: forwarded, state };
  };
  const byteView = (destination) => {
    if (!isView(destination)) return new Uint8Array(destination);
    let getters = typedGet;
    try { typedGet[0].call(destination); } catch (_) { getters = dataViewGet; }
    return new Uint8Array(getters[0].call(destination), getters[1].call(destination), getters[2].call(destination));
  };
  replace(proto, 'copyTo', (original) => function copyTo(destination, options) {
    const captured = captureOptions(options), forwarded = Array.from(arguments);
    if (forwarded.length > 1) forwarded[1] = captured.options;
    const result = Reflect.apply(original, this, forwarded);
    let metadata;
    try {
      const visible = visibleOf.call(this);
      metadata = { format: captured.state.format ?? formatOf.call(this),
        width: captured.state.rect ? captured.state.rect.width : (widthOf ? widthOf.call(visible) : visible.width),
        height: captured.state.rect ? captured.state.rect.height : (heightOf ? heightOf.call(visible) : visible.height) };
    } catch (_) { /* A rejected copy retains the native error. */ }
    return result.then((layouts) => {
      try {
        if (!metadata || !Array.isArray(layouts) || layouts.length !== 1) return layouts;
        const { format, width, height } = metadata;
        if (!['RGBA', 'RGBX', 'BGRA', 'BGRX'].includes(format)
          || !Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) return layouts;
        const { offset, stride } = layouts[0], rowBytes = width * 4;
        const view = byteView(destination);
        if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(stride) || stride < rowBytes
          || offset + (height - 1) * stride + rowBytes > view.length) return layouts;
        const red = format.startsWith('BG') ? 2 : 0, opaque = format.endsWith('X');
        const length = width * height * 4;
        const locate = (index) => offset + Math.floor(index / rowBytes) * stride + Math.floor((index % rowBytes) / 4) * 4;
        // A zero-byte typed-array facade lets the shared noise policy address
        // logical RGBA pixels without allocating/copying an entire frame.
        const pixels = new Proxy(new Uint8ClampedArray(0), {
          get(target, key) {
            if (key === 'length') return length;
            const index = typeof key === 'string' ? Number(key) : NaN;
            if (!Number.isSafeInteger(index) || index < 0 || index >= length) return Reflect.get(target, key, target);
            const channel = index % 4;
            if (channel === 3 && opaque) return 255;
            return view[locate(index) + (channel === 0 ? red : channel === 2 ? 2 - red : channel)];
          },
          set(_target, key, value) {
            const index = typeof key === 'string' ? Number(key) : NaN;
            if (Number.isSafeInteger(index) && index >= 0 && index < length && index % 4 === 0) view[locate(index) + red] = value;
            return true;
          },
        });
        applyNoise({ data: pixels, width, height });
      } catch (_) { /* Detached destinations and unsupported layouts keep native results. */ }
      return layouts;
    });
  });
}

module.exports = { installVideoFrameCopy, runtimeSource: `${installVideoFrameCopy.toString()}\n` };
