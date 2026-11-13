'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { types } = require('node:util');
const { installVideoFrameCopy } = require('../fingerprint/runtime/video-frame-readback');

class Frame {
  constructor(width = 4, height = 3, fast = false) { this.width = width; this.height = height; this.fast = fast; this.closed = false; }
  get format() { return this.closed ? null : 'RGBA'; }
  get visibleRect() { return this.closed ? null : { width: this.width, height: this.height }; }
  close() { this.closed = true; }
  copyTo(destination, options = {}) {
    if (!(this instanceof Frame) || !arguments.length || (!ArrayBuffer.isView(destination) && !types.isAnyArrayBuffer(destination))) return Promise.reject(new TypeError('native destination'));
    if (this.closed) return Promise.reject(new Error('native closed frame'));
    const requestedFormat = options?.format;
    const format = requestedFormat === undefined ? 'RGBA' : `${requestedFormat}`;
    const rect = options?.rect;
    const width = rect ? +rect.width : this.width, height = rect ? +rect.height : this.height;
    const plane = options?.layout?.[0] || { offset: 0, stride: width * 4 };
    this.layouts = [{ offset: plane.offset, stride: plane.stride }];
    const bytes = ArrayBuffer.isView(destination)
      ? new Uint8Array(destination.buffer, destination.byteOffset, destination.byteLength) : new Uint8Array(destination);
    if (!this.fast) for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const base = plane.offset + y * plane.stride + x * 4;
      bytes.set(format.startsWith('BG') ? [70, 60, 50, format.endsWith('X') ? 0 : 255]
        : [50, 60, 70, format.endsWith('X') ? 0 : 255], base);
    }
    return Promise.resolve(this.layouts);
  }
}

async function main() {
  let calls = 0, largestLogicalBytes = 0;
  installVideoFrameCopy(Frame.prototype, (proto, key, factory) => { proto[key] = factory(proto[key]); }, (image) => {
    calls++;
    assert.ok(image.data instanceof Uint8ClampedArray);
    assert.equal(image.data.buffer.byteLength, 0, 'logical frame access needs no full-frame scratch allocation');
    largestLogicalBytes = Math.max(largestLogicalBytes, image.data.length);
    image.data[0] += 1;
    image.data[image.data.length - 4] += 1;
  });
  for (const format of ['RGBA', 'BGRA', 'RGBX', 'BGRX']) {
    const storage = new Uint8Array(80).fill(9), destination = new DataView(storage.buffer, 5, 64);
    const frame = new Frame(); let widths = 0, heights = 0;
    const options = Object.freeze({ format, rect: Object.freeze({ width: { valueOf() { widths++; return 2; } }, height: { valueOf() { heights++; return 2; } } }),
      layout: [{ offset: 7, stride: 16 }] });
    const pending = frame.copyTo(destination, options); frame.close();
    let reads = 0;
    for (const property of ['buffer', 'byteOffset', 'byteLength']) Object.defineProperty(destination, property,
      { get() { reads++; throw new Error('shadowed buffer property'); } });
    const result = await pending;
    assert.equal(result, frame.layouts, 'native layout object identity is retained');
    assert.equal(widths, 1); assert.equal(heights, 1); assert.equal(reads, 0);
    const expected = new Uint8Array(80).fill(9), red = format.startsWith('BG') ? 2 : 0;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) expected.set(format.startsWith('BG')
      ? [70, 60, 50, format.endsWith('X') ? 0 : 255] : [50, 60, 70, format.endsWith('X') ? 0 : 255], 5 + 7 + y * 16 + x * 4);
    expected[5 + 7 + red]++; expected[5 + 7 + 16 + 4 + red]++;
    assert.deepEqual(storage, expected, 'only copied red bytes change; prefix, padding, alpha and suffix remain native');
  }
  const foreignBuffer = vm.runInNewContext('new ArrayBuffer(48)');
  await new Frame().copyTo(foreignBuffer);
  assert.equal(new Uint8Array(foreignBuffer)[0], 51, 'cross-realm ArrayBuffers retain their native storage');
  if (typeof SharedArrayBuffer === 'function') {
    const shared = new SharedArrayBuffer(48); await new Frame().copyTo(shared);
    assert.equal(new Uint8Array(shared)[0], 51, 'shared destinations keep their native storage');
  }
  const before = calls;
  const closed = new Frame(); closed.close();
  await assert.rejects(closed.copyTo(new Uint8Array(48)), /native closed frame/);
  await assert.rejects(new Frame().copyTo(), TypeError);
  await assert.rejects(new Frame().copyTo({ length: 48 }), TypeError);
  assert.equal(calls, before, 'native rejections never run the noise policy');
  const large = new Frame(4000, 3000, true);
  await large.copyTo(new ArrayBuffer(4000 * 3000 * 4));
  assert.equal(largestLogicalBytes, 48000000);
  console.log('VIDEO_FRAME_READBACK_SELFTEST OK (native layouts, cropped/strided byte views, four packed formats, coercion, closure, cross-realm buffers, errors, zero-byte scratch for 48 MB frame)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
