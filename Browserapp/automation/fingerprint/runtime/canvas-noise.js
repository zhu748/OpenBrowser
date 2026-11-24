'use strict';

function createCanvasPixelNoise(stability, stableNow, amplitudeNow, noise, deltaFor) {
  const maxWidth = Number(stability?.maxWidth) || 600;
  const maxHeight = Number(stability?.maxHeight) || 600;
  const square = Math.max(2, Number(stability?.square) || 8);
  const plans = new Map();
  // Cache only small sampling grids. Larger grids use the same calculation
  // without retaining a plan for every canvas size.
  const maxPlans = 64;
  const maxPlanSamples = 16384;

  return function applyCanvasPixelNoise(data, width, height, mark) {
    const right = Math.min(width, maxWidth);
    const bottom = Math.min(height, maxHeight);
    const length = data.length;
    const amp = amplitudeNow();
    if (stableNow() && Math.ceil(right / square) * Math.ceil(bottom / square) <= maxPlanSamples) {
      const key = width + 'x' + height + ':' + mark;
      let plan = plans.get(key);
      if (!plan) {
        plan = [];
        for (let y = 0; y < bottom; y += square) {
          for (let x = 0; x < right; x += square) {
            const offset = (y * width + x) * 4;
            const delta = deltaFor(noise(offset + mark), amp);
            if (delta) plan.push(offset, delta);
          }
        }
        if (plans.size >= maxPlans) plans.delete(plans.keys().next().value);
        plans.set(key, plan);
      }
      // Transparency belongs to the current read, not to the sampling plan.
      for (let i = 0; i < plan.length; i += 2) {
        const offset = plan[i];
        if (offset + 3 < length && data[offset + 3] !== 0) {
          data[offset] = Math.max(0, Math.min(255, data[offset] + plan[i + 1]));
        }
      }
      return;
    }
    for (let y = 0; y < bottom; y += square) {
      for (let x = 0; x < right; x += square) {
        const offset = (y * width + x) * 4;
        if (offset + 3 < length && data[offset + 3] !== 0) {
          data[offset] = Math.max(0, Math.min(255, data[offset] + deltaFor(noise(offset + mark), amp)));
        }
      }
    }
  };
}

const runtimeSource = `
  const CanvasBytes = Uint8Array;
  const canvasTypedArrayProto = Object.getPrototypeOf(CanvasBytes.prototype);
  const canvasArrayTag = Object.getOwnPropertyDescriptor(canvasTypedArrayProto, Symbol.toStringTag).get;
  const canvasArrayLength = Object.getOwnPropertyDescriptor(canvasTypedArrayProto, 'length').get;
  const canvasImageProto = globalThis.ImageData?.prototype;
  const canvasImageGetter = (key) => canvasImageProto && Object.getOwnPropertyDescriptor(canvasImageProto, key)?.get;
  const canvasImageData = canvasImageGetter('data');
  const canvasImageWidth = canvasImageGetter('width');
  const canvasImageHeight = canvasImageGetter('height');
  const canvasImageColorSpace = canvasImageGetter('colorSpace');
  const canvasBytePixels = (image) => {
    const data = canvasImageData ? canvasImageData.call(image) : image?.data;
    const type = canvasArrayTag.call(data);
    return type === 'Uint8Array' || type === 'Uint8ClampedArray' ? data : null;
  };
  const canvasPixelNoise = (${createCanvasPixelNoise.toString()})(CFG.stability, stabilityActiveNow, noiseAmplitudeNow, noise, noiseDelta);
  const applyCanvasNoise = (image, mark) => {
    try {
      const data = canvasBytePixels(image);
      if (data) canvasPixelNoise(data, canvasImageWidth ? canvasImageWidth.call(image) : image.width,
        canvasImageHeight ? canvasImageHeight.call(image) : image.height, mark);
    } catch (_) {}
    return image;
  };
`;

module.exports = { createCanvasPixelNoise, runtimeSource };
