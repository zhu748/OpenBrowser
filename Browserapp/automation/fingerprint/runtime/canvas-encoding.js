'use strict';

const { captureImageEncodeOptions } = require('../native-arguments');

function installHtmlCanvasEncoding(target, replace, readPixels) {
  const proto = target.HTMLCanvasElement?.prototype;
  if (!proto) return;
  const widthOf = Object.getOwnPropertyDescriptor(proto, 'width')?.get;
  const heightOf = Object.getOwnPropertyDescriptor(proto, 'height')?.get;

  const snapshot = (source) => {
    const width = widthOf.call(source), height = heightOf.call(source);
    if (!width || !height) return null;
    const copy = target.document.createElement('canvas');
    copy.width = width;
    copy.height = height;
    const context = copy.getContext('2d');
    if (!context) return null;
    // drawImage reads the canvas bitmap independently of WebGL framebuffer
    // bindings, pixel pack state and readPixels overloads.
    context.drawImage(source, 0, 0);
    context.putImageData(readPixels(context, width, height), 0, 0);
    return copy;
  };

  const encode = (original, source, args, typeIndex) => {
    const type = args[typeIndex];
    if (!widthOf || !heightOf || typeof type === 'symbol') return Reflect.apply(original, source, args);
    if (type !== null && (typeof type === 'object' || typeof type === 'function')) {
      // Validate the receiver before any side effects from MIME coercion.
      try { widthOf.call(source); } catch (_) { return Reflect.apply(original, source, args); }
      args[typeIndex] = `${type}`;
    }
    let copy;
    try { copy = snapshot(source); } catch (_) { /* Native encoding owns source errors. */ }
    return Reflect.apply(original, copy || source, args);
  };

  replace(proto, 'toDataURL', (original) => function toDataURL(...args) {
    return encode(original, this, args, 0);
  });
  replace(proto, 'toBlob', (original) => function toBlob(...args) {
    if (typeof args[0] !== 'function') return Reflect.apply(original, this, args);
    return encode(original, this, args, 1);
  });
}

function installOffscreenCanvasEncoding(target, replace) {
  const Canvas = target.OffscreenCanvas;
  if (!Canvas?.prototype.convertToBlob) return;
  replace(Canvas.prototype, 'convertToBlob', (original) => async function convertToBlob(options) {
    const captured = captureImageEncodeOptions(options);
    const blob = await original.call(this, captured.options);
    try {
      const bitmap = await target.createImageBitmap(blob);
      let copy;
      try {
        const { width, height } = bitmap;
        copy = new Canvas(width, height);
        const context = copy.getContext('2d');
        if (!context) return blob;
        context.drawImage(bitmap, 0, 0);
        context.putImageData(context.getImageData(0, 0, width, height), 0, 0);
      } finally {
        try { bitmap.close(); } catch (_) {}
      }
      return await original.call(copy, captured.replay);
    } catch (_) { return blob; }
  });
}

module.exports = {
  htmlRuntimeSource: `${installHtmlCanvasEncoding.toString()}\n`,
  offscreenRuntimeSource: `${captureImageEncodeOptions.toString()}\n${installOffscreenCanvasEncoding.toString()}\n`,
};
