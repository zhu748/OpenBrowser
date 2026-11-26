'use strict';

const assert = require('node:assert/strict');
const h = require('./native-gate-harness');
const { buildFingerprint, buildInjectionScript } = require('../fingerprint');
const { LIVE_PROBE_EXPRESSION } = require('../fingerprint/delivery-probe');
const { evaluateFingerprintDelivery } = require('../request-header-rewriter');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

// A one-row texture tests advertised width without a large GPU allocation.
function graphicsProbe() {
  return ['webgl', 'webgl2'].map((kind) => {
    const canvas = typeof document === 'object' ? document.createElement('canvas') : new OffscreenCanvas(1, 1);
    const gl = canvas.getContext(kind);
    if (!gl) return null;
    const params = [0x0d33, 0x851c, 0x84e8, 0x8869, 0x8b4c, 0x8b4d, 0x8872, 0x8a30, 0x8a34, 0x8a2b, 0x8a2d];
    const values = Object.fromEntries(params.map((p) => [p, gl.getParameter(p)]));
    const stringsMatch = params.every((p) => gl.getParameter(String(p)) === values[p]);
    const viewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    const points = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
    while (gl.getError()) { /* drain invalid WebGL1 enums */ }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, values[0x0d33], 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const allocationError = gl.getError();
    gl.deleteTexture(texture);
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    let invalidReceiver = false;
    try { gl.getParameter.call({}, gl.MAX_TEXTURE_SIZE); } catch (error) { invalidReceiver = error instanceof TypeError; }
    return { kind, values, viewport: Array.from(viewport), viewportType: viewport.constructor.name,
      points: Array.from(points), pointsType: points.constructor.name, allocationError, invalidReceiver, stringsMatch,
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null };
  });
}
const probe = `(${graphicsProbe.toString()})()`;
const geometry = '({innerWidth,innerHeight,outerWidth,outerHeight,screenWidth:screen.width,screenHeight:screen.height})';

async function load(session, url, fp, nativeMetrics = false) {
  const conn = await h.openPage(session.port);
  if (nativeMetrics) await conn.command('Emulation.setDeviceMetricsOverride', {
    ...fp.mobileDevice.viewport, deviceScaleFactor: fp.screen.devicePixelRatio, mobile: true,
    screenWidth: fp.screen.width, screenHeight: fp.screen.height,
    screenOrientation: { type: 'portraitPrimary', angle: 0 }, positionX: 0, positionY: 0,
  });
  await conn.command('Page.navigate', { url });
  for (let i = 0; i < 100; i++) {
    if (await h.evaluate(conn, 'globalThis.ready || false')) return conn;
    await h.delay(30);
  }
  conn.close();
  throw new Error('Test page did not load');
}
function contextCalls(makeCanvas, prototype) {
  function outcome(call) {
    try {
      const context = call();
      return context === null ? 'null' : typeof context;
    } catch (error) {
      return error.name;
    }
  }
  let contextReads = 0;
  const context2d = outcome(() => makeCanvas().getContext({ toString() { contextReads++; return '2d'; } }));
  let webglReads = 0;
  const webglObject = outcome(() => makeCanvas().getContext({ toString() { webglReads++; return 'webgl'; } }));
  let invalidReceiverReads = 0;
  const invalidReceiver = outcome(() => prototype.getContext.call({}, {
    toString() { invalidReceiverReads++; return 'webgl'; },
  }));
  return {
    context2d, contextReads, webglObject, webglReads, invalidReceiver, invalidReceiverReads,
    webgl: outcome(() => makeCanvas().getContext('webgl')),
    webgl2: outcome(() => makeCanvas().getContext('webgl2')),
    experimental: outcome(() => makeCanvas().getContext('experimental-webgl')),
    unsupported: outcome(() => makeCanvas().getContext('webgl-unknown')),
    missing: outcome(() => makeCanvas().getContext()),
    symbol: outcome(() => makeCanvas().getContext(Symbol())),
  };
}

async function contextPolicySnapshot(read) {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  const child = frame.contentWindow;
  const result = {
    main: read(() => document.createElement('canvas'), HTMLCanvasElement.prototype),
    iframe: read(() => child.document.createElement('canvas'), child.HTMLCanvasElement.prototype),
    offscreen: read(() => new OffscreenCanvas(4, 4), OffscreenCanvas.prototype),
  };
  frame.remove();

  const transferred = document.createElement('canvas');
  transferred.transferControlToOffscreen();
  try { transferred.getContext('webgl'); result.transferred = 'returned'; }
  catch (error) { result.transferred = error.name; }

  const url = URL.createObjectURL(new Blob([
    `postMessage((${read})(() => new OffscreenCanvas(4, 4), OffscreenCanvas.prototype));`,
  ], { type: 'text/javascript' }));
  const worker = new Worker(url);
  try {
    result.worker = await new Promise((resolve, reject) => {
      worker.onmessage = event => resolve(event.data);
      worker.onerror = () => reject(Error('OffscreenCanvas Worker failed'));
    });
  } finally {
    worker.terminate();
    URL.revokeObjectURL(url);
  }
  return result;
}

async function webglEncodingSnapshot() {
  const results = [];
  for (const method of ['toDataURL', 'toBlob', 'convertToBlob']) {
    const canvas = method === 'convertToBlob' ? new OffscreenCanvas(16, 16) : document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    gl.clearColor(0.2, 0.4, 0.6, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    const color = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, color);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, 16, 16);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
    gl.clearColor(1, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const blob = method === 'toDataURL' ? await fetch(canvas.toDataURL()).then((response) => response.blob())
      : method === 'toBlob' ? await new Promise((resolve) => canvas.toBlob(resolve)) : await canvas.convertToBlob();
    const bitmap = await createImageBitmap(blob);
    const copy = new OffscreenCanvas(16, 16), ctx = copy.getContext('2d');
    ctx.drawImage(bitmap, 0, 0); bitmap.close();
    const pixel = [...ctx.getImageData(1, 1, 1, 1).data];
    results.push({ method, pixel, error: gl.getError(), bound: gl.getParameter(gl.FRAMEBUFFER_BINDING) === framebuffer });
  }
  return results;
}

async function canvasTaintSnapshot(imageUrl) {
  const image = new Image();
  image.src = imageUrl;
  await image.decode();
  const html = document.createElement('canvas'), offscreen = new OffscreenCanvas(2, 2);
  for (const canvas of [html, offscreen]) canvas.getContext('2d').drawImage(image, 0, 0);
  const outcomes = [];
  for (const encode of [() => html.toDataURL(), () => new Promise((resolve) => html.toBlob(resolve)),
    () => offscreen.convertToBlob()]) {
    try { await encode(); outcomes.push('returned'); }
    catch (error) { outcomes.push(error.name); }
  }
  return outcomes;
}

async function checkContextPolicy(conn, url, fingerprint, imageUrl) {
  const expression = `(${contextPolicySnapshot})(${contextCalls})`;
  const native = await h.evaluate(conn, expression);
  const encoding = `(${webglEncodingSnapshot})()`;
  const taint = `(${canvasTaintSnapshot})(${JSON.stringify(imageUrl)})`;
  const nativeTaint = await h.evaluate(conn, taint);
  assert.deepEqual(nativeTaint, ['SecurityError', 'SecurityError', 'SecurityError']);
  const nativeEncoding = await h.evaluate(conn, encoding);
  for (const result of nativeEncoding) {
    assert.deepEqual(result.pixel, [51, 102, 153, 255]);
    assert.equal(result.error, 0);
    assert.equal(result.bound, true);
  }
  for (const realm of ['main', 'iframe', 'offscreen', 'worker']) {
    assert.equal(native[realm].webgl, 'object', realm + ' baseline requires WebGL');
    assert.equal(native[realm].webgl2, 'object', realm + ' baseline requires WebGL2');
  }

  await conn.command('Page.enable');
  for (const [canvasMode, webglMode] of [['noise', 'real'], ['real', 'noise'], ['noise', 'blocked'], ['blocked', 'blocked']]) {
    const source = buildInjectionScript({
      ...fingerprint,
      canvas: { ...fingerprint.canvas, mode: canvasMode },
      webgl: { ...fingerprint.webgl, mode: webglMode, metaMode: 'real' },
    });
    const { identifier } = await conn.command('Page.addScriptToEvaluateOnNewDocument', { source });
    try {
      // Use the same unblocked kernel and test the document-start layer alone.
      const target = new URL(`/?canvas=${canvasMode}&webgl=${webglMode}`, url).href;
      await conn.command('Page.navigate', { url: target });
      for (let i = 0; i < 100; i++) {
        if (await h.evaluate(conn, `location.href === ${JSON.stringify(target)} && !!document.body`)) break;
        await h.delay(30);
      }
      assert.equal(await h.evaluate(conn, 'location.href'), target);
      const actual = await h.evaluate(conn, expression);
      const expected = structuredClone(native);
      if (webglMode === 'blocked') {
        for (const realm of ['main', 'iframe', 'offscreen', 'worker']) {
          Object.assign(expected[realm], { webgl: 'null', webgl2: 'null', webglObject: 'null' });
        }
        expected.main.experimental = expected.iframe.experimental = 'null';
      }
      assert.deepEqual(actual, expected, `Canvas ${canvasMode} / WebGL ${webglMode}`);
      if (webglMode === 'real') {
        const actualEncoding = await h.evaluate(conn, encoding);
        assert.deepEqual(actualEncoding.map(({ pixel, ...result }) => ({ ...result, pixel: pixel.slice(1) })),
          nativeEncoding.map(({ pixel, ...result }) => ({ ...result, pixel: pixel.slice(1) })),
          'canvas encoding reads the presented image and leaves WebGL state intact');
        for (const result of actualEncoding) assert.ok(Math.abs(result.pixel[0] - 51) <= 1, result.method);
        assert.deepEqual(await h.evaluate(conn, taint), nativeTaint, 'cross-origin exports retain native SecurityError');
      }
    } finally {
      await conn.command('Page.removeScriptToEvaluateOnNewDocument', { identifier });
    }
  }
  console.log('PASS no launch flags: WebGL policy and native context arguments in documents, iframes and OffscreenCanvas Workers');
}
function check(actual, baseline, label) {
  assert.equal(actual.length, 2);
  for (let i = 0; i < actual.length; i++) {
    const value = actual[i], native = baseline[i];
    assert.ok(value && native, label + ' WebGL context required');
    assert.equal(value.allocationError, 0, label + ' advertised texture width must work');
    assert.equal(value.viewportType, native.viewportType);
    assert.equal(value.pointsType, native.pointsType);
    assert.ok(value.invalidReceiver, label + ' native receiver validation');
    assert.ok(value.stringsMatch, label + ' WebIDL enum string coercion');
    for (const [key, n] of Object.entries(value.values)) {
      if (native.values[key] === null) assert.equal(n, null, label + ' WebGL1 invalid enum stays null');
      else if (Number(key) === 0x8a34) assert.ok(n >= native.values[key], label + ' native buffer alignment');
      else assert.ok(n <= native.values[key], label + ' limit exceeds native capability: ' + key);
    }
    value.viewport.forEach((n, axis) => assert.ok(n <= native.viewport[axis], label + ' viewport bounds'));
    assert.ok(value.points[1] <= native.points[1], label + ' point size bounds');
  }
}
async function main() {
  const browser = h.chooseChromiumBinary();
  const { a: server, b: imageServer, close } = await h.startDualOriginServers((req, res) => {
    if (req.url === '/canvas-image') {
      res.setHeader('Content-Type', 'image/png');
      res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><head>${req.url === '/viewport' ? '<meta name="viewport" content="width=device-width,initial-scale=1">' : ''}<script>globalThis.ready=true</script></head><body>capability gate</body>`);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  const imageUrl = `http://127.0.0.1:${imageServer.address().port}/canvas-image`;
  let baseline;
  const specs = [
    { os: 'Windows', version: 1, deviceProfile: 'default', injected: false },
    { os: 'Windows', version: 1, deviceProfile: 'default', injected: true },
    { os: 'Windows', version: 1, deviceProfile: 'persona', injected: true },
    { os: 'Windows', version: 2, injected: true },
    { os: 'Android', version: 2, injected: true },
    { os: 'iOS', version: 2, injected: true },
  ];
  try {
    for (const spec of specs) {
      const profile = sanitizeProfile({ id: 'sample', name: 'sample', os: spec.os,
        fingerprintVersion: spec.version, fingerprintSeed: 'stable-seed', privacy: {
          deviceProfile: spec.deviceProfile, fontListMode: 'real',
          customArgs: '--use-gl=angle;--use-angle=swiftshader;--enable-unsafe-swiftshader',
        } });
      const fp = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint: fp }, { injectFingerprint: spec.injected });
      let conn;
      try {
        conn = await load(session, url, fp);
        const actual = await h.evaluate(conn, probe);
        if (!spec.injected) baseline = actual;
        check(actual, baseline, `${spec.os} v${spec.version} document`);
        const worker = await h.evaluate(conn, `new Promise((resolve,reject)=>{
          const url=URL.createObjectURL(new Blob([${JSON.stringify(`self.postMessage(${probe})`)}],{type:'text/javascript'}));
          const w=new Worker(url);w.onmessage=e=>{w.terminate();URL.revokeObjectURL(url);resolve(e.data)};w.onerror=reject;
        })`);
        check(worker, baseline, `${spec.os} v${spec.version} worker`);
        if (spec.os === 'iOS') {
          assert.equal(actual[0].vendor, 'Apple Inc.');
          assert.equal(worker[0].renderer, 'Apple GPU');
        }
        if (fp.mobile) {
          for (const route of ['/', '/viewport']) {
            conn.close(); conn = await load(session, url + route, fp);
            const patched = await h.evaluate(conn, geometry);
            const raw = await h.launchPersonaBrowser(browser, { profile, fingerprint: fp }, { injectFingerprint: false });
            let rawConn;
            try {
              rawConn = await load(raw, url + route, fp, true);
              const expected = await h.evaluate(rawConn, geometry);
              assert.deepEqual(patched, expected, `${spec.os} mobile geometry ${route}`);
            } finally { rawConn?.close(); await raw.close(); }
          }
        }
        if (!spec.injected) await checkContextPolicy(conn, url, fp, imageUrl);
        console.log(`OK ${spec.os} v${spec.version} ${spec.deviceProfile || 'auto'} injected=${spec.injected}`);
      } finally { conn?.close(); await session.close(); }
    }
    for (const [webgl, webglMeta] of [['blocked', 'real'], ['real', 'blocked']]) {
      const profile = sanitizeProfile({ id: 'gl-policy', name: 'GL policy', os: 'Windows',
        fingerprintVersion: 2, privacy: {
          fontListMode: 'real', fingerprint: { webgl, webglMeta },
          customArgs: '--use-gl=angle;--use-angle=swiftshader;--enable-unsafe-swiftshader',
        } });
      const fp = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint: fp });
      let conn;
      try {
        conn = await load(session, url, fp);
        const live = await h.evaluate(conn, LIVE_PROBE_EXPRESSION);
        assert.equal(live.probeError, undefined);
        assert.deepEqual(Object.keys(live.webglContexts), ['webgl', 'webgl2']);
        for (const [type, context] of Object.entries(live.webglContexts)) {
          assert.equal(context.webglContextPresent, webgl !== 'blocked', type);
          assert.equal(context.webglUnmasked, false, type);
        }
        const verified = evaluateFingerprintDelivery(profile, fp, live, { strict: true });
        assert.equal(verified.ok, true, JSON.stringify(verified.mismatches));
        console.log(`PASS live probe distinguishes WebGL mode=${webgl} and metadata=${webglMeta}`);
      } finally { conn?.close(); await session.close(); }
    }
  } finally { await close(); }
  console.log('fingerprint-capabilities-native: OK (native driver bounds, WebGL1/2, workers, mobile viewport meta)');
}
main().catch((error) => { console.error(error); process.exitCode = error instanceof h.Unavailable ? 2 : 1; });
