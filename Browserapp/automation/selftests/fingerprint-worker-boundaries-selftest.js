'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { buildFingerprint } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

// Browser observations are compared against a clean instance of the same
// binary. These probes intentionally cross realms and use observable coercions.
async function probe() {
  const out = {};
  let reads = 0;
  class OwnBlob extends Blob { get type() { reads++; return super.type; } }
  const blob = new OwnBlob(['plain text'], { type: 'text/plain' });
  reads = 0;
  URL.revokeObjectURL(URL.createObjectURL(blob));
  out.blobTypeReads = reads;
  reads = 0;
  try { URL.createObjectURL({ get type() { reads++; return 'text/css'; } }); }
  catch (error) { out.invalidBlobError = error.name; }
  out.invalidBlobReads = reads;
  let conversions = 0;
  const original = URL.createObjectURL(new Blob(['plain text']));
  URL.revokeObjectURL({ [Symbol.toPrimitive]() { conversions++; return original; } });
  out.revokeConversions = conversions;

  const render = async () => {
    const context = new OfflineAudioContext(2, 256, 44100);
    const osc = context.createOscillator(); osc.connect(context.destination); osc.start();
    return context.startRendering();
  };
  const audio = await render();
  let getReads = 0, copyReads = 0, startReads = 0, writeReads = 0, invalidReads = 0;
  audio.getChannelData({ valueOf() { getReads++; return 0; } });
  audio.copyFromChannel(new Float32Array(8), { valueOf() { copyReads++; return 0; } }, { valueOf() { startReads++; return 2; } });
  const exact = new Float32Array(8).fill(0.25);
  audio.copyToChannel(exact, { valueOf() { writeReads++; return 1; } }, 9);
  let invalidError;
  try { audio.copyFromChannel({}, { valueOf() { invalidReads++; return 0; } }); } catch (error) { invalidError = error.name; }
  out.audio = { getReads, copyReads, startReads, writeReads, invalidReads, invalidError,
    authored: Array.from(audio.getChannelData(1).slice(9, 17)) };

  out.precision = [];
  for (const kind of ['webgl', 'webgl2']) {
    const gl = document.createElement('canvas').getContext(kind);
    if (!gl) { out.precision.push(null); continue; }
    const values = [];
    for (const type of [gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT, gl.LOW_INT, gl.MEDIUM_INT, gl.HIGH_INT]) {
      const read = (value) => [value.rangeMin, value.rangeMax, value.precision];
      let count = 0;
      values.push({ numeric: read(gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, type)),
        string: read(gl.getShaderPrecisionFormat(String(gl.FRAGMENT_SHADER), String(type))),
        object: read(gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, { valueOf() { count++; return type; } })), count });
    }
    out.precision.push(values);
  }
  const child = document.createElement('iframe'); child.src = '/frame';
  await new Promise((resolve) => { child.onload = resolve; document.body.append(child); });
  const sharedSource = 'let count=0;onconnect=e=>e.ports[0].postMessage({count:++count,origin:self.origin,location:location.href,cores:navigator.hardwareConcurrency})';
  const message = (target) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('worker message timed out')), 10000);
    target.onmessage = (event) => { clearTimeout(timer); resolve(event.data); };
    target.onerror = (event) => { clearTimeout(timer); reject(Error(event.message)); };
  });
  out.shared = [];
  for (const kind of ['blob', 'data']) {
    const url = kind === 'blob' ? URL.createObjectURL(new Blob([sharedSource], { type: 'application/javascript' }))
      : 'data:application/javascript,' + encodeURIComponent(sharedSource);
    const first = new SharedWorker(url), second = new child.contentWindow.SharedWorker(url);
    const values = await Promise.all([message(first.port), message(second.port)]);
    out.shared.push({ kind, counts: values.map((value) => value.count).sort(),
      locations: values.every((value) => value.location === url), origins: values.map((value) => value.origin),
      cores: values.map((value) => value.cores) });
    first.port.close(); second.port.close(); if (kind === 'blob') URL.revokeObjectURL(url);
  }
  child.remove();
  const activeUrl = URL.createObjectURL(new Blob([sharedSource], { type: 'application/javascript' }));
  const active = new SharedWorker(activeUrl); await message(active.port);
  for (let i = 0; i < 130; i++) {
    const bad = URL.createObjectURL(new Blob([''], { type: 'application/javascript' }));
    try { new SharedWorker(bad, { type: 'invalid' }); } catch (_) {}
    URL.revokeObjectURL(bad);
  }
  const reconnect = new SharedWorker(activeUrl);
  out.reconnect = await message(reconnect.port);
  active.port.close(); reconnect.port.close(); URL.revokeObjectURL(activeUrl);

  const revokedUrl = URL.createObjectURL(new Blob([sharedSource], { type: 'application/javascript' }));
  const beforeRevoke = new SharedWorker(revokedUrl);
  await message(beforeRevoke.port);
  URL.revokeObjectURL(revokedUrl);
  const afterRevoke = new SharedWorker(revokedUrl);
  out.revokedReconnect = await message(afterRevoke.port);
  beforeRevoke.port.close(); afterRevoke.port.close();

  const popupUrl = URL.createObjectURL(new Blob([sharedSource], { type: 'application/javascript' }));
  const popupActive = new SharedWorker(popupUrl);
  await message(popupActive.port);
  let popup, descendant;
  const ready = async (win) => {
    if (!win) throw Error('popup fixture did not open');
    for (let i = 0; i < 500 && !win.ready; i++) await new Promise((resolve) => setTimeout(resolve, 10));
    if (!win.ready) throw Error('popup fixture did not become ready');
  };
  try {
    popup = open('/popup'); await ready(popup);
    popup.opener = null;
    descendant = popup.open('/descendant'); await ready(descendant);
    const fromDescendant = new descendant.SharedWorker(popupUrl);
    out.popupReconnect = await message(fromDescendant.port);
    fromDescendant.port.close();
  } finally {
    descendant?.close(); popup?.close(); popupActive.port.close(); URL.revokeObjectURL(popupUrl);
  }

  const dependency = 'data:text/javascript,' + encodeURIComponent('export const first={cores:navigator.hardwareConcurrency,platform:navigator.platform}');
  const cases = [
    { name: 'continuation', code: '"a"\n["b"].map(()=>{});postMessage({ok:true})' },
    { name: 'strict', code: '"a";"use strict";postMessage({strict:(function(){return this})()===undefined})' },
    { name: 'non-directive', code: '"use strict"+0;postMessage({strict:(function(){return this})()===undefined})' },
    { name: 'hashbang', code: '#!worker\n"use strict";postMessage({strict:(function(){return this})()===undefined})' },
    { name: 'meta', type: 'module', code: 'postMessage({url:import.meta.url,location:location.href})' },
    { name: 'template-meta', type: 'module', code: '"not-a-directive"+import.meta.url;postMessage({url:`${import.meta.url}`})' },
    { name: 'dependency', type: 'module', code: 'import {first} from ' + JSON.stringify(dependency) + ';postMessage({first,cores:navigator.hardwareConcurrency,url:import.meta.url});onmessage=e=>postMessage({echo:e.data})' },
    { name: 'data-dependency', data: true, type: 'module', code: 'import {first} from ' + JSON.stringify(dependency) + ';postMessage({first,cores:navigator.hardwareConcurrency,url:import.meta.url});onmessage=e=>postMessage({echo:e.data})' },
  ];
  out.workers = [];
  for (const spec of cases) {
    const url = spec.data ? 'data:application/javascript,' + encodeURIComponent(spec.code)
      : URL.createObjectURL(new Blob([spec.code], { type: 'application/javascript' }));
    const worker = new Worker(url, { type: spec.type || 'classic' });
    const values = [];
    const value = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('fixture timed out: ' + spec.name)), 10000);
      worker.onmessage = (event) => {
        values.push(event.data);
        if (!spec.name.endsWith('dependency') || values.length === 2) { clearTimeout(timer); resolve(values); }
      };
      worker.onerror = (event) => { event.preventDefault(); clearTimeout(timer); resolve({ error: event.message }); };
      if (spec.name.endsWith('dependency')) worker.postMessage('early');
    });
    worker.terminate(); URL.revokeObjectURL(url);
    out.workers.push({ name: spec.name, value, urlMatches: Array.isArray(value) && value[0]?.url ? value[0].url === url : null });
  }
  return out;
}
function compare(actual, baseline, fp) {
  for (const key of ['blobTypeReads', 'invalidBlobError', 'invalidBlobReads', 'revokeConversions', 'audio']) assert.deepEqual(actual[key], baseline[key], key);
  actual.precision.forEach((values, index) => {
    assert.ok(values && baseline.precision[index], 'native WebGL context required');
    values.forEach((value, type) => {
      assert.deepEqual(value.numeric, value.string, 'shader string conversion');
      assert.deepEqual(value.numeric, value.object, 'shader object conversion');
      assert.equal(value.count, 1);
      value.numeric.forEach((n, axis) => assert.ok(n <= baseline.precision[index][type].numeric[axis], 'shader capacity must not exceed the driver'));
    });
  });
  actual.shared.forEach((value, index) => {
    assert.deepEqual(value.counts, [1, 2], 'one SharedWorker across same-origin realms');
    assert.ok(value.locations);
    assert.deepEqual(value.origins, baseline.shared[index].origins);
    if (fp) assert.deepEqual(value.cores, [fp.hardwareConcurrency, fp.hardwareConcurrency]);
  });
  assert.equal(actual.reconnect.count, 2, 'invalid constructor attempts cannot evict the live worker');
  assert.equal(actual.revokedReconnect.count, baseline.revokedReconnect.count, 'revoked URI can reconnect to its live SharedWorker');
  assert.equal(actual.popupReconnect.count, 2, 'detached opener descendants retain the canonical SharedWorker');
  for (let i = 0; i < actual.workers.length; i++) {
    const fixture = actual.workers[i], native = baseline.workers[i];
    if (fixture.name.endsWith('dependency')) {
      assert.equal(fixture.value[1].echo, 'early', 'startup message delivery');
      if (fp) {
        assert.equal(fixture.value[0].first.cores, fp.hardwareConcurrency, 'static dependency first instruction');
        assert.equal(fixture.value[0].first.platform, fp.platform);
      }
    } else if (!fixture.urlMatches) assert.deepEqual(fixture.value, native.value, fixture.name);
    if (native.urlMatches) assert.ok(fixture.urlMatches, fixture.name + ' import.meta.url');
  }
}
async function main() {
  const browser = h.chooseChromiumBinary();
  const server = http.createServer((_req, response) => { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><body><script>globalThis.ready=true</script>'); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let baseline;
  try {
    for (const spec of [{ os: 'Windows', inject: false }, { os: 'Windows', inject: true }, { os: 'Android', inject: true }]) {
      const profile = sanitizeProfile({ id: 'worker-boundaries', name: 'Worker boundaries', os: spec.os, fingerprintVersion: 2,
        privacy: { deviceProfile: 'persona', fontListMode: 'noise', cores: 12,
          customArgs: '--use-gl=angle;--use-angle=swiftshader;--enable-unsafe-swiftshader' } });
      const fp = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint: fp }, {
        injectFingerprint: spec.inject, headless: process.env.OPENBROWSER_CONTRACT_HEADFUL !== '1',
      });
      let connection;
      try {
        connection = await h.openPage(session.port, `http://127.0.0.1:${server.address().port}`);
        for (let i = 0; i < 100 && !await h.evaluate(connection, 'globalThis.ready || false'); i++) await h.delay(30);
        const observed = await h.evaluate(connection, '(' + probe.toString() + ')()', 60000);
        if (!spec.inject) baseline = observed;
        compare(observed, baseline, spec.inject ? fp : null);
        console.log(`PASS ${spec.os} injected=${spec.inject}: URL/Audio/WebGL coercion, SharedWorker sharing/cache, worker grammar/module dependencies`);
      } finally { connection?.close(); await session.close(); }
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => { console.error(error); process.exitCode = error instanceof h.Unavailable ? 2 : 1; });
