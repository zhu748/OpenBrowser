'use strict';

// Shared document/worker policy: writes are hints, never a replacement for
// native reads. Pixel snapshots must survive caller mutations and drawing.
module.exports = `
  const createCanvasReadbackCache = () => {
    const returned = new WeakSet();
    const writes = new WeakMap();
    return {
      tag(image) { returned.add(image); return image; },
      matches(context, image, args) {
        const last = writes.get(context);
        if (!last) return false;
        if (args[0] !== last.x || args[1] !== last.y || args[2] !== last.width || args[3] !== last.height
            || canvasImageColorSpace?.call(image) !== last.colorSpace) return false;
        const data = canvasBytePixels(image);
        const length = data && canvasArrayLength.call(data);
        if (length === last.data.length) {
          let equal = true;
          for (let i = 0; i < length; i += 1) {
            if (data[i] !== last.data[i]) { equal = false; break; }
          }
          if (equal) return true;
        }
        writes.delete(context);
        return false;
      },
      wrote(context, args) {
        writes.delete(context);
        const [image, x, y] = args;
        // Dirty rectangles and converted coordinates require native clipping.
        if (args.length !== 3 || !returned.has(image)
          || !Number.isInteger(x) || !Number.isInteger(y)
          || x !== (x | 0) || y !== (y | 0)) return;
        const data = canvasBytePixels(image);
        if (!data) return;
        writes.set(context, { x, y, width: canvasImageWidth.call(image), height: canvasImageHeight.call(image),
          colorSpace: canvasImageColorSpace?.call(image), data: new CanvasBytes(data) });
      },
    };
  };
`;
