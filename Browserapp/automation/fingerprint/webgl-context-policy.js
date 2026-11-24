'use strict';

function isWebglContext(type, htmlCanvas) {
  return type === 'webgl' || type === 'webgl2' || (htmlCanvas && type === 'experimental-webgl');
}

function blockWebglContext(proto, replace, htmlCanvas) {
  if (!proto) return;
  const readWidth = Object.getOwnPropertyDescriptor(proto, 'width')?.get;
  if (!readWidth) return;

  replace(proto, 'getContext', original => function getContext(...args) {
    let type = args[0];
    const needsConversion = type !== null && (typeof type === 'object' || typeof type === 'function');
    if (!needsConversion && !isWebglContext(type, htmlCanvas)) return Reflect.apply(original, this, args);

    // Native receiver validation precedes argument conversion. The width
    // accessor accepts real cross-realm canvases without creating a context.
    try { Reflect.apply(readWidth, this, []); }
    catch (_) { return Reflect.apply(original, this, args); }

    if (needsConversion) type = `${type}`;
    if (isWebglContext(type, htmlCanvas)) {
      // A DOM canvas accepts any DOMString and still performs its native
      // transferred-canvas check for an unsupported context ID. OffscreenCanvas
      // takes an enum, so it has no equivalent harmless unsupported ID.
      return htmlCanvas ? Reflect.apply(original, this, ['']) : null;
    }
    // Forward the converted value so the native call cannot repeat page hooks.
    args[0] = type;
    return Reflect.apply(original, this, args);
  });
}

module.exports = {
  contextKindSource: isWebglContext.toString() + '\n',
  contextBlockingSource: blockWebglContext.toString() + '\n',
};
