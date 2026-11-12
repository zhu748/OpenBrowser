'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { buildFingerprint } = require('../fingerprint');
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
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!doctype html><head>${req.url === '/viewport' ? '<meta name="viewport" content="width=device-width,initial-scale=1">' : ''}<script>globalThis.ready=true</script></head><body>capability gate</body>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
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
        console.log(`OK ${spec.os} v${spec.version} ${spec.deviceProfile || 'auto'} injected=${spec.injected}`);
      } finally { conn?.close(); await session.close(); }
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
  console.log('fingerprint-capabilities-native: OK (native driver bounds, WebGL1/2, workers, mobile viewport meta)');
}
main().catch((error) => { console.error(error); process.exitCode = error instanceof h.Unavailable ? 2 : 1; });
