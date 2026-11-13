'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');
const h = require('./native-gate-harness');

// Runs unchanged in Window and WorkerGlobalScope, through production injection.
function exerciseCanvas() {
  const canvas = typeof document === 'object' ? document.createElement('canvas') : new OffscreenCanvas(4, 4);
  canvas.width = canvas.height = 4;
  const ctx = canvas.getContext('2d');
  const pixel = () => [...ctx.getImageData(0, 0, 4, 4).data.slice(0, 4)];
  ctx.fillStyle = 'red'; ctx.fillRect(0, 0, 4, 4);
  const image = ctx.getImageData(0, 0, 4, 4);
  const before = [...image.data];
  ctx.putImageData(image, 0, 0);
  const roundtrip = [...ctx.getImageData(0, 0, 4, 4).data];
  // Mutating the caller's ImageData does not modify the canvas or its hint.
  image.data.fill(0);
  const afterCallerMutation = pixel();
  ctx.fillStyle = 'blue'; ctx.fillRect(0, 0, 4, 4);
  const afterDraw = pixel();
  ctx.clearRect(0, 0, 4, 4);
  const afterClear = pixel();
  ctx.fillStyle = 'red'; ctx.fillRect(0, 0, 4, 4);
  const dirty = ctx.getImageData(0, 0, 4, 4);
  ctx.fillStyle = 'blue'; ctx.fillRect(0, 0, 4, 4);
  ctx.putImageData(dirty, 0, 0, 0, 0, 1, 1);
  const outsideDirty = [...ctx.getImageData(2, 2, 1, 1).data];
  canvas.width = 4;
  const afterResize = pixel();
  let invalidWriteThrew = false;
  try { ctx.putImageData(null, 0, 0); } catch (_) { invalidWriteThrew = true; }
  return { before, roundtrip, afterCallerMutation, afterDraw, afterClear, outsideDirty, afterResize, invalidWriteThrew };
}

function verify(result) {
  assert.deepEqual(result.roundtrip, result.before, 'unmodified pixel roundtrip stays stable');
  assert.ok(result.afterCallerMutation[0] > 245 && result.afterCallerMutation[2] < 10, 'caller mutation cannot change stored pixels');
  for (const pixel of [result.afterDraw, result.outsideDirty]) assert.ok(pixel[2] > 245 && pixel[0] < 10, 'drawing and dirty writes preserve native pixels');
  assert.deepEqual(result.afterClear, [0, 0, 0, 0]);
  assert.deepEqual(result.afterResize, [0, 0, 0, 0]);
  assert.equal(result.invalidWriteThrew, true, 'native argument errors remain intact');
}

// The same WebIDL and identity checks run in Window and WorkerGlobalScope.
function exerciseTextMetrics() {
  const canvas = typeof document === 'object' ? document.createElement('canvas') : new OffscreenCanvas(32, 32);
  const context = canvas.getContext('2d'); context.font = '16px sans-serif';
  const errorName = (fn) => { try { fn(); return ''; } catch (error) { return error.name; } };
  let coercions = 0;
  const measured = context.measureText({ toString() { coercions++; return 'measured text'; } });
  const expected = context.measureText('measured text');
  const properties = ['width', 'actualBoundingBoxLeft', 'actualBoundingBoxRight', 'actualBoundingBoxAscent', 'actualBoundingBoxDescent'];
  const metrics = properties.map((key) => measured[key]);
  const objectMatches = properties.every((key) => measured[key] === expected[key]);
  const primitivesMatch = [0, false, null, undefined, 123n].every((value) => context.measureText(value).width === context.measureText(String(value)).width);
  let receiverCoercions = 0;
  const receiverError = errorName(() => Object.getPrototypeOf(context).measureText.call({}, { toString() { receiverCoercions++; return 'invalid receiver'; } }));
  const missingError = errorName(() => context.measureText());
  const symbolError = errorName(() => context.measureText(Symbol('text')));
  const fontChanged = context.measureText({ toString() { context.font = '24px sans-serif'; return 'font change'; } }).width;
  const fontChangeMatches = fontChanged === context.measureText('font change').width;
  context.font = '16px "PingFang SC"';
  const foreignFontChanged = context.measureText({ toString() { context.font = '24px sans-serif'; return 'foreign font change'; } }).width;
  return { coercions, objectMatches, primitivesMatch, receiverCoercions, receiverError, missingError, symbolError,
    fontChangeMatches, fontSwapChangeMatches: foreignFontChanged === context.measureText('foreign font change').width,
    constructorMatches: measured.constructor === TextMetrics, metrics };
}

function verifyTextMetrics(result) {
  assert.equal(result.coercions, 1, 'text object coercion runs exactly once');
  assert.equal(result.objectMatches, true); assert.equal(result.primitivesMatch, true);
  assert.equal(result.receiverCoercions, 0, 'illegal receivers reject before converting text');
  for (const name of ['receiverError', 'missingError', 'symbolError']) assert.equal(result[name], 'TypeError', name);
  assert.equal(result.fontChangeMatches, true, 'coercion-time font changes affect the measured metrics');
  assert.equal(result.fontSwapChangeMatches, true, 'font sanitization cannot revert coercion-time font edits');
  assert.equal(result.constructorMatches, true);
}

async function exerciseOffscreenEncoding() {
  const canvas = new OffscreenCanvas(4, 3), context = canvas.getContext('2d');
  context.fillStyle = 'red'; context.fillRect(0, 0, 4, 3);
  const accesses = [];
  const options = Object.freeze({
    get quality() { accesses.push('quality'); return { valueOf() { accesses.push('number'); return 0.8; } }; },
    type: Object.freeze({ toString() { accesses.push('type'); return accesses.filter((value) => value === 'type').length === 1 ? 'image/png' : 'image/jpeg'; } }),
  });
  const pending = canvas.convertToBlob(options);
  canvas.width = 10; canvas.height = 12;
  context.fillStyle = 'blue'; context.fillRect(0, 0, 10, 12);
  const blob = await pending, bitmap = await createImageBitmap(blob);
  const dimensions = [bitmap.width, bitmap.height];
  const copy = new OffscreenCanvas(bitmap.width, bitmap.height), copied = copy.getContext('2d');
  copied.drawImage(bitmap, 0, 0); bitmap.close();
  const pixel = [...copied.getImageData(0, 0, 1, 1).data];
  let invalidReads = 0, receiverError = '';
  try { await OffscreenCanvas.prototype.convertToBlob.call({}, { get quality() { invalidReads++; return 1; } }); }
  catch (error) { receiverError = error.name; }

  // Force a failed helper context after decoding; its ImageBitmap still closes.
  const fallback = new OffscreenCanvas(2, 2); fallback.getContext('2d').fillRect(0, 0, 2, 2);
  const create = globalThis.createImageBitmap, getContext = OffscreenCanvas.prototype.getContext;
  let closedBitmaps = 0;
  globalThis.createImageBitmap = async (...args) => {
    const image = await Reflect.apply(create, globalThis, args), close = image.close;
    Object.defineProperty(image, 'close', { value() { closedBitmaps++; return close.call(this); } });
    return image;
  };
  OffscreenCanvas.prototype.getContext = function(type) {
    if (this !== fallback && type === '2d') return null;
    return getContext.apply(this, arguments);
  };
  let fallbackType;
  try { fallbackType = (await fallback.convertToBlob()).type; }
  finally { globalThis.createImageBitmap = create; OffscreenCanvas.prototype.getContext = getContext; }
  return { dimensions, pixel, accesses, type: blob.type, receiverError, invalidReads, closedBitmaps, fallbackType };
}

function verifyOffscreenEncoding(result, mode) {
  assert.deepEqual(result.dimensions, [4, 3], 'encoding retains the original snapshot dimensions after resize');
  assert.ok(result.pixel[0] > 245 && result.pixel[2] < 10, 'later drawing cannot replace the encoded snapshot');
  assert.deepEqual(result.accesses, ['quality', 'number', 'type'], 'encoding options are read and converted once');
  assert.equal(result.type, 'image/png'); assert.equal(result.fallbackType, 'image/png');
  assert.equal(result.receiverError, 'TypeError'); assert.equal(result.invalidReads, 0);
  assert.equal(result.closedBitmaps, mode === 'noise' ? 1 : 0, 'failed helper contexts release decoded bitmaps');
}

async function exerciseVideoFrame() {
  const raw = new Uint8Array(4 * 4 * 4);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) raw.set([64 + x * 10, 80 + y * 10, 120, 255], (y * 4 + x) * 4);
  const createFrame = (cropped = true) => new VideoFrame(raw, { format: 'RGBA', codedWidth: 4, codedHeight: 4,
    ...(cropped ? { visibleRect: { x: 1, y: 1, width: 2, height: 2 } } : {}), timestamp: 0 });
  const crop = new Uint8ClampedArray(16);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) crop.set(raw.subarray(((y + 1) * 4 + x + 1) * 4, ((y + 1) * 4 + x + 1) * 4 + 4), (y * 2 + x) * 4);
  const canvas = new OffscreenCanvas(2, 2), context = canvas.getContext('2d');
  context.putImageData(new ImageData(crop, 2, 2), 0, 0);
  const expected = [...context.getImageData(0, 0, 2, 2).data];
  const cases = [];
  for (const format of [null, 'RGBA', 'BGRA']) {
    const frame = createFrame(format === null), storage = new Uint8Array(80).fill(17), destination = new DataView(storage.buffer, 3, 64);
    const accesses = [];
    const rect = Object.freeze({ x: 1, y: 1,
      get width() { accesses.push('width'); return { valueOf() { accesses.push('width-value'); return 2; } }; },
      get height() { accesses.push('height'); return { valueOf() { accesses.push('height-value'); return 2; } }; },
    });
    const options = Object.freeze({
      get format() { accesses.push('format'); return format ? { toString() { accesses.push('format-value'); return format; } } : undefined; },
      get rect() { accesses.push('rect'); return format ? rect : undefined; },
      layout: [{ offset: 7, stride: 20 }],
    });
    const pending = frame.copyTo(destination, options); frame.close();
    const layout = await pending;
    const output = [];
    const written = new Set();
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      const base = 3 + 7 + y * 20 + x * 4;
      const pixel = [...storage.subarray(base, base + 4)];
      output.push(...(format === 'BGRA' ? [pixel[2], pixel[1], pixel[0], pixel[3]] : pixel));
      for (let i = 0; i < 4; i++) written.add(base + i);
    }
    cases.push({ format: format || 'default-visible-rect', layout, output, accesses,
      paddingIntact: storage.every((value, index) => written.has(index) || value === 17) });
  }
  const closed = createFrame(); closed.close();
  let closedError = '', receiverError = '', invalidReads = 0;
  try { await closed.copyTo(new Uint8Array(16)); } catch (error) { closedError = error.name; }
  try { await VideoFrame.prototype.copyTo.call({}, new Uint8Array(16), { get format() { invalidReads++; return 'RGBA'; } }); }
  catch (error) { receiverError = error.name; }
  return { expected, cases, closedError, receiverError, invalidReads };
}

function verifyVideoFrame(result) {
  for (const row of result.cases) {
    assert.deepEqual(row.layout, [{ offset: 7, stride: 20 }]);
    assert.deepEqual(row.output, result.expected, row.format + ': copied pixels match the canvas policy after the frame closes');
    assert.equal(row.paddingIntact, true, row.format + ': destination padding and surrounding bytes stay untouched');
    const expected = row.format === 'default-visible-rect' ? ['format', 'rect']
      : ['format', 'format-value', 'rect', 'width', 'width-value', 'height', 'height-value'];
    assert.deepEqual([...row.accesses].sort(), expected.sort(), 'native dictionary members/coercion hooks run once');
  }
  assert.equal(result.closedError, 'InvalidStateError'); assert.equal(result.receiverError, 'TypeError'); assert.equal(result.invalidReads, 0);
}

async function exerciseAudio() {
  const context = new OfflineAudioContext(1, 128, 44100);
  const analyser = context.createAnalyser(); analyser.fftSize = 32;
  const results = [];
  for (const method of ['getFloatFrequencyData', 'getByteFrequencyData', 'getFloatTimeDomainData', 'getByteTimeDomainData']) {
    const size = method.includes('Frequency') ? analyser.frequencyBinCount : analyser.fftSize;
    const ArrayType = method.includes('Byte') ? Uint8Array : Float32Array;
    for (const extra of [-size, -1, 0, 7, 4096]) {
      const length = size + extra, sentinel = 123;
      const array = new ArrayType(length).fill(sentinel);
      let lengthReads = 0;
      Object.defineProperty(array, 'length', { get() { lengthReads++; return length + 1000; } });
      const returned = analyser[method](array);
      let changedTail = false;
      for (let i = size; i < length; i++) if (array[i] !== sentinel) changedTail = true;
      results.push({ method, length, changedTail, lengthReads, nativeReturn: returned === undefined });
    }
  }
  const oscillator = context.createOscillator(); oscillator.connect(context.destination); oscillator.start();
  const buffer = await context.startRendering();
  const first = buffer.getChannelData(0).slice(), repeated = buffer.getChannelData(0).slice();
  const copied = new Float32Array(buffer.length); buffer.copyFromChannel(copied, 0);
  buffer.getChannelData(0)[0] = 0.75;
  buffer.copyToChannel(new Float32Array([0.5, 0.25]), 0, 5);
  const authoredContext = new OfflineAudioContext(1, 128, 44100);
  const source = authoredContext.createOscillator(); source.connect(authoredContext.destination); source.start();
  const authoredBuffer = await authoredContext.startRendering();
  for (let i = 0; i < 1000; i++) authoredBuffer.copyToChannel(new Float32Array(8).fill(0.25), 0, i % 8);
  authoredBuffer.copyToChannel(new Float32Array(64).fill(0.5), 0, 96);
  const authoredBeforeRead = [...authoredBuffer.getChannelData(0)];
  return { results, first: [...first], repeated: [...repeated], copied: [...copied],
    authored: [buffer.getChannelData(0)[0], buffer.getChannelData(0)[5], buffer.getChannelData(0)[6]], authoredBeforeRead };
}

function verifyAudio(result) {
  for (const row of result.results) {
    assert.equal(row.changedTail, false, row.method + ': oversized tails stay untouched');
    assert.equal(row.lengthReads, 0, row.method + ': native APIs ignore a shadowed length property');
    assert.equal(row.nativeReturn, true);
  }
  assert.deepEqual(result.first, result.repeated, 'rendered noise is applied only once');
  assert.deepEqual(result.first, result.copied, 'audio copy and direct reads agree');
  assert.deepEqual(result.authored, [0.75, 0.5, 0.25], 'authored audio survives repeated reads');
  assert.ok(result.authoredBeforeRead.slice(0, 15).every((value) => value === 0.25));
  assert.ok(result.authoredBeforeRead.slice(96).every((value) => value === 0.5), 'overlapping and clipped writes remain exact before the first read');
}

async function main() {
  let browser;
  try { browser = h.chooseChromiumBinary(); }
  catch (error) { if (error instanceof h.Unavailable) { console.log('SKIP ' + error.message); process.exitCode = 2; return; } throw error; }
  const streams = new Map(), timers = new Set();
  const css = '@FoNt-FaCe {font-family:ReviewFont;src:l\\6f cal("Review Forbidden Font");}';
  const markupCss = css + 'body{color:rgb(1, 2, 3)}';
  const template = '<style>' + css + '</style>';
  const digest = (algorithm) => `'${algorithm}-${crypto.createHash(algorithm).update(markupCss).digest('base64')}'`;
  const server = http.createServer((req, res) => {
    if (req.url === '/markup') {
      res.setHeader('Content-Type', 'text/html; charset=windows-1252');
      res.setHeader('Content-Security-Policy', "script-src 'unsafe-inline'; style-src " + digest('sha512'));
      const html = '<!doctype html><head><meta http-equiv="Content-Security-Policy" content="style-src ' + digest('sha384')
        + '; script-src \'unsafe-inline\'"><title>Café</title><style>' + markupCss + '</style><script>globalThis.template='
        + JSON.stringify(template) + '</script></head><body><textarea>' + template + '</textarea></body>';
      res.end(Buffer.from(html, 'latin1')); return;
    }
    if (req.url.startsWith('/first/')) {
      const state = streams.get(req.url.slice('/first/'.length));
      if (state) state.firstBeforeEnd = !state.ended;
      res.end('ok'); return;
    }
    if (!req.url.startsWith('/stream/')) { res.writeHead(204); res.end(); return; }
    const id = req.url.slice('/stream/'.length);
    const state = { ended: false }; streams.set(id, state);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write('<!doctype html><head><style>' + css + '</style><script>fetch("/first/' + id + '")</script></head><body>first chunk');
    const timer = setTimeout(() => { timers.delete(timer); state.ended = true; res.end('</body>'); }, 1500);
    timers.add(timer);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    for (const mode of ['real', 'noise']) {
      const profile = sanitizeProfile({ id: 'semantics-' + mode, name: 'Semantics', os: 'Windows',
        privacy: { fontListMode: mode, canvas: mode, audio: mode, deviceProfile: 'persona', webrtc: 'disabled' } });
      const fingerprint = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const run = await h.launchPersonaBrowser(browser, { profile, fingerprint });
      let connection;
      try {
        connection = await h.openPage(run.port, 'http://127.0.0.1:' + server.address().port + '/stream/' + mode);
        for (let i = 0; i < 80 && streams.get(mode)?.firstBeforeEnd === undefined; i++) await h.delay(50);
        assert.equal(streams.get(mode)?.firstBeforeEnd, mode === 'real', 'real fonts stream immediately; protected static CSS is sanitized before execution');
        const style = await h.evaluate(connection, 'document.querySelector("style").textContent');
        if (mode === 'real') assert.equal(style, css, 'follow-system mode preserves original CSS');
        else assert.ok(!style.includes('Review Forbidden Font') && style.includes('SysFallback'), style);
        verify(await h.evaluate(connection, '(' + exerciseCanvas.toString() + ')()'));
        verifyAudio(await h.evaluate(connection, '(' + exerciseAudio.toString() + ')()'));
        const text = await h.evaluate(connection, '(' + exerciseTextMetrics.toString() + ')()');
        verifyTextMetrics(text);
        verifyOffscreenEncoding(await h.evaluate(connection, '(' + exerciseOffscreenEncoding.toString() + ')()'), mode);
        const video = await h.evaluate(connection, '(' + exerciseVideoFrame.toString() + ')()');
        verifyVideoFrame(video);
        const worker = `new Promise((resolve,reject)=>{
          const url=URL.createObjectURL(new Blob([${JSON.stringify('postMessage((' + exerciseCanvas.toString() + ')())')}],{type:'text/javascript'}));
          const worker=new Worker(url);const timer=setTimeout(()=>{worker.terminate();URL.revokeObjectURL(url);reject(Error('worker timeout'));},10000);
          worker.onmessage=e=>{clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);resolve(e.data);};
          worker.onerror=e=>{clearTimeout(timer);worker.terminate();URL.revokeObjectURL(url);reject(Error(e.message));};
        })`;
        verify(await h.evaluate(connection, worker));
        const textWorker = worker.replace(JSON.stringify('postMessage((' + exerciseCanvas.toString() + ')())'),
          JSON.stringify('postMessage((' + exerciseTextMetrics.toString() + ')())'));
        const workerText = await h.evaluate(connection, textWorker);
        verifyTextMetrics(workerText);
        assert.deepEqual(workerText.metrics, text.metrics, mode + ' Canvas mode agrees between document and worker');
        const encodingWorker = worker.replace(JSON.stringify('postMessage((' + exerciseCanvas.toString() + ')())'),
          JSON.stringify('(' + exerciseOffscreenEncoding.toString() + ')().then(postMessage)'));
        verifyOffscreenEncoding(await h.evaluate(connection, encodingWorker), mode);
        const videoWorker = worker.replace(JSON.stringify('postMessage((' + exerciseCanvas.toString() + ')())'),
          JSON.stringify('(' + exerciseVideoFrame.toString() + ')().then(postMessage)'));
        const workerVideo = await h.evaluate(connection, videoWorker);
        verifyVideoFrame(workerVideo);
        assert.deepEqual(workerVideo.cases.map((row) => row.output), video.cases.map((row) => row.output), 'VideoFrame policy agrees across document and worker');
        await connection.command('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/markup' });
        await h.delay(600);
        const markup = await h.evaluate(connection, '({title:document.title,template:globalThis.template,text:document.querySelector("textarea").value,color:getComputedStyle(document.body).color})');
        assert.deepEqual(markup, { title: 'Café', template, text: template, color: 'rgb(1, 2, 3)' }, 'raw text, non-UTF8 documents, header and meta CSP retain browser behavior');
        console.log('PASS ' + mode + ' fonts/canvas/audio: streaming policy, CSS parsing, Canvas/Worker text coercion and native read-write semantics');
      } finally { connection?.close(); await run.close(); }
    }
  } finally {
    for (const timer of timers) clearTimeout(timer);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  console.log('FINGERPRINT_CANVAS_FONT_SEMANTICS_SELFTEST OK');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
