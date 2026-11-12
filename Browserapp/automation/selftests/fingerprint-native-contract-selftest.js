'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const h = require('./native-gate-harness');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript } = require('../fingerprint');
const { buildWorkerFontPresenceSource } = require('../worker-font-presence-fallback');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

function probe() {
  const out = { ua: navigator.userAgent, cores: navigator.hardwareConcurrency, location: location.href,
    markers: Object.getOwnPropertyNames(globalThis).filter((key) => /^__ob/.test(key)) };
  let calls = 0, reads = 0;
  const callback = function example() {};
  Object.defineProperty(callback, 'toString', { get() { reads++; return () => { calls++; return 'custom'; }; } });
  Function.prototype.toString.call(callback);
  out.toString = { calls, reads };
  out.gl = ['webgl', 'webgl2'].map((kind) => {
    const canvas = typeof document === 'object' ? document.createElement('canvas') : new OffscreenCanvas(1, 1);
    const gl = canvas.getContext(kind);
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return null;
    const code = ext.UNMASKED_RENDERER_WEBGL;
    let conversions = 0, receiverConversions = 0;
    const values = [gl.getParameter(code), gl.getParameter(String(code)),
      gl.getParameter({ [Symbol.toPrimitive]() { conversions++; return code; } }), gl.getParameter(code + 2 ** 32)];
    let wrongReceiver, missingArgument, bigint;
    try { gl.getParameter.call({}, { [Symbol.toPrimitive]() { receiverConversions++; return code; } }); }
    catch (error) { wrongReceiver = error.name; }
    try { gl.getParameter(); } catch (error) { missingArgument = error.name; }
    try { gl.getParameter(BigInt(code)); } catch (error) { bigint = error.name; }
    return { values, conversions, receiverConversions, wrongReceiver, missingArgument, bigint };
  });
  if (typeof document === 'object') {
    out.windows = {};
    for (const key of ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight', 'devicePixelRatio', 'screenX']) {
      let owner = window, depth = 0, descriptor;
      while (owner && !(descriptor = Object.getOwnPropertyDescriptor(owner, key))) { owner = Object.getPrototypeOf(owner); depth++; }
      let invalidReceiver;
      try { descriptor.get.call({}); invalidReceiver = 'accepted'; } catch (error) { invalidReceiver = error.name; }
      out.windows[key] = { depth, configurable: descriptor.configurable, enumerable: descriptor.enumerable,
        getter: descriptor.get?.name, setter: descriptor.set?.name, invalidReceiver };
    }
    let iteratorReads = 0, iterations = 0, coercions = 0, typeReads = 0, indexReads = 0;
    const parts = { get [Symbol.iterator]() { iteratorReads++; return function* () {
      iterations++; yield { toString() { coercions++; return '@font-face{font-family:test;src:local(test)}'; } };
    }; } };
    const blob = new Blob(parts, { get type() { typeReads++; return 'text/css'; } });
    const array = ['native'];
    Object.defineProperty(array, 0, { get() { indexReads++; return 'native'; } });
    new Blob(array);
    class DerivedBlob extends Blob {}
    const derived = new DerivedBlob(['native']);
    out.blobAbi = { iteratorReads, iterations, coercions, typeReads, indexReads,
      type: blob.type, size: blob.size, subclass: derived instanceof Blob && derived instanceof DerivedBlob && derived.constructor === DerivedBlob };
    out.constructors = {};
    for (const key of ['Blob', 'Worker', 'SharedWorker']) {
      const fn = globalThis[key];
      if (!fn) continue;
      out.constructors[key] = { keys: Object.getOwnPropertyNames(fn),
        source: Function.prototype.toString.call(fn), prototype: fn.prototype.constructor === fn };
    }
    const style = document.createElement('div').style;
    style.setProperty('-webkit-touch-callout', 'none');
    const rule = document.createElement('style');
    rule.textContent = '@supports (-webkit-touch-callout:none){body{--native-contract:yes}}';
    document.head.append(rule);
    out.css = { js: CSS.supports('-webkit-touch-callout', 'none'),
      declaration: Boolean(style.getPropertyValue('-webkit-touch-callout')),
      sheet: getComputedStyle(document.body).getPropertyValue('--native-contract').trim() === 'yes' };
    rule.remove();
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const getter = Object.getOwnPropertyDescriptor(Navigator.prototype, 'hardwareConcurrency').get;
    out.crossRealmSource = iframe.contentWindow.Function.prototype.toString.call(getter);
    iframe.remove();
  }
  return out;
}
const expression = `(${probe.toString()})()`;
function checkCommon(actual, expected, native, label) {
  assert.deepEqual(actual.toString, { calls: 0, reads: 0 }, label + ' Function.toString must not invoke user properties');
  assert.deepEqual(actual.markers, [], label + ' no public installation markers');
  if (expected) { assert.equal(actual.ua, expected.userAgent, label + ' UA'); assert.equal(actual.cores, expected.hardwareConcurrency, label + ' cores'); }
  actual.gl.forEach((gl, index) => {
    assert.ok(gl && native.gl[index], label + ' actual WebGL context');
    assert.ok(gl.values.every((value) => value === gl.values[0]), label + ' WebIDL enum parity');
    if (expected) assert.equal(gl.values[0], expected.webgl.renderer, label + ' GPU');
    assert.equal(gl.conversions, 1, label + ' argument converted once');
    assert.equal(gl.receiverConversions, 0, label + ' native receiver validation precedes argument conversion');
    for (const key of ['wrongReceiver', 'missingArgument', 'bigint']) assert.equal(gl[key], native.gl[index][key], label + ' ' + key);
  });
}
async function run() {
  const browser = h.chooseChromiumBinary();
  const headless = process.env.OPENBROWSER_CONTRACT_HEADFUL !== '1';
  const server = http.createServer((req, res) => {
    if (req.url === '/csp') res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob: data:; connect-src 'none'");
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body><script>globalThis.ready=true</script>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  let native;
  try {
    for (const spec of [
      { os: 'Windows', version: 2, inject: false }, { os: 'Windows', version: 1, inject: true },
      { os: 'Windows', version: 2, inject: true }, { os: 'Android', version: 2, inject: true }, { os: 'iOS', version: 2, inject: true },
    ]) {
      const profile = sanitizeProfile({ id: 'native-contract', name: 'Native contract', os: spec.os,
        fingerprintVersion: spec.version, fingerprintSeed: 'native-contract-seed', privacy: {
          deviceProfile: 'persona', fontListMode: spec.os === 'Windows' && spec.version === 2 && spec.inject ? 'noise' : 'real',
          customArgs: '--use-gl=angle;--use-angle=swiftshader;--enable-unsafe-swiftshader',
        } });
      const fp = buildFingerprint({ ...profile, kernelVersion: browser.version });
      const session = await h.launchPersonaBrowser(browser, { profile, fingerprint: fp }, { injectFingerprint: spec.inject, headless });
      let conn;
      try {
        conn = await h.openPage(session.port, `http://127.0.0.1:${server.address().port}`);
        for (let i = 0; i < 100 && !await h.evaluate(conn, 'globalThis.ready || false'); i++) await h.delay(30);
        const doc = await h.evaluate(conn, expression);
        if (!spec.inject) native = doc;
        checkCommon(doc, spec.inject ? fp : null, native, spec.os + ' document');
        assert.deepEqual(doc.windows, native.windows, 'Window descriptor locations, setters and receivers');
        assert.deepEqual(doc.constructors, native.constructors, 'native constructor surface');
        assert.deepEqual(doc.blobAbi, native.blobAbi, 'Blob iterators, element getters, type getter and subclassing');
        assert.equal(doc.css.js, doc.css.declaration, 'CSS query must match the declaration parser');
        assert.equal(doc.css.js, doc.css.sheet, 'CSS query must match stylesheet @supports');
        assert.match(doc.crossRealmSource, /\[native code\]/, 'foreign realm must not expose getter implementation');
        for (const type of ['classic', 'module']) {
          const worker = await h.evaluate(conn, `new Promise((resolve,reject)=>{
            const url=URL.createObjectURL(new Blob([${JSON.stringify(`postMessage(${expression});`)}],{type:'application/javascript'}));
            let conversions=0, optionsRead=0;
            const input={ [Symbol.toPrimitive](){conversions++;return url;} };
            class DerivedWorker extends Worker {}
            const w=new DerivedWorker(input,{get type(){optionsRead++;return ${JSON.stringify(type)}}});
            w.onmessage=e=>{const data=e.data;const shape={instance:w instanceof Worker,derived:w instanceof DerivedWorker,constructor:w.constructor===DerivedWorker,location:data.location===url};w.terminate();URL.revokeObjectURL(url);resolve({data,shape,conversions,optionsRead})};
            w.onerror=e=>{w.terminate();URL.revokeObjectURL(url);reject(Error(e.message))};
          })`);
          checkCommon(worker.data, spec.inject ? fp : null, native, spec.os + ' ' + type + ' worker');
          assert.deepEqual(worker.shape, { instance: true, derived: true, constructor: true, location: true });
          assert.equal(worker.conversions, 1, 'Worker URL conversion happens once');
          assert.equal(worker.optionsRead, 1, 'Worker options getter happens once');
        }
        const shared = await h.evaluate(conn, `new Promise((resolve,reject)=>{
          const url=URL.createObjectURL(new Blob(['let count=0;self.onconnect=e=>{e.ports[0].postMessage({count:++count,cores:navigator.hardwareConcurrency,location:location.href,markers:Object.getOwnPropertyNames(self).filter(k=>/^__ob/.test(k))})}'],{type:'application/javascript'}));
          const first=new SharedWorker(url),second=new SharedWorker(url),values=[];
          for(const w of [first,second]){w.onerror=e=>reject(Error(e.message));w.port.onmessage=e=>{values.push(e.data);w.port.close();if(values.length===2){URL.revokeObjectURL(url);resolve({values,shape:first instanceof SharedWorker && first.constructor===SharedWorker,location:values.every(v=>v.location===url)})}}}
        })`);
        assert.deepEqual(shared.values.map((v) => v.count).sort(), [1, 2], 'same-URL SharedWorkers share one instance');
        assert.ok(shared.shape && shared.location, 'SharedWorker constructor and location');
        for (const value of shared.values) {
          assert.deepEqual(value.markers, []);
          assert.equal(value.cores, spec.inject ? fp.hardwareConcurrency : doc.cores);
        }
        if (spec.inject && spec.os === 'Windows' && spec.version === 2) {
          const prefix = buildWorkerInjectionScript(fp) + '\n' + buildWorkerFontPresenceSource(fp);
          const replay = await h.evaluate(conn, `new Promise((resolve,reject)=>{
            const source=${JSON.stringify(prefix)};
            const body=source+'\\n;const before={toString:Function.prototype.toString,cores:Object.getOwnPropertyDescriptor(WorkerNavigator.prototype,"hardwareConcurrency").get};eval('+JSON.stringify(source)+');postMessage({stable:before.toString===Function.prototype.toString && before.cores===Object.getOwnPropertyDescriptor(WorkerNavigator.prototype,"hardwareConcurrency").get,markers:Object.getOwnPropertyNames(self).filter(k=>/^__ob/.test(k))})';
            const url=URL.createObjectURL(new Blob([body],{type:'application/javascript'}));const w=new Worker(url);
            w.onmessage=e=>{w.terminate();URL.revokeObjectURL(url);resolve(e.data)};w.onerror=e=>reject(Error(e.message));
          })`);
          assert.ok(replay.stable, 'actual worker prefix replay with font overlay');
          assert.deepEqual(replay.markers, []);
        }
        if (spec.inject) {
          await h.evaluate(conn, "globalThis.beforeNativeContract={worker:Worker,blob:Blob,toString:Function.prototype.toString,cores:Object.getOwnPropertyDescriptor(Navigator.prototype,'hardwareConcurrency').get};true");
          await h.evaluate(conn, buildInjectionScript(fp) + ';true');
          const stable = await h.evaluate(conn, "({worker:Worker===beforeNativeContract.worker,blob:Blob===beforeNativeContract.blob,toString:Function.prototype.toString===beforeNativeContract.toString,cores:Object.getOwnPropertyDescriptor(Navigator.prototype,'hardwareConcurrency').get===beforeNativeContract.cores})");
          assert.deepEqual(stable, { worker: true, blob: true, toString: true, cores: true }, 'actual repeated injection must keep wrappers identical');
        }
        if (spec.inject && spec.os === 'Windows' && spec.version === 2) {
          await conn.command('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/csp` });
          for (let i = 0; i < 100 && !await h.evaluate(conn, 'globalThis.ready || false'); i++) await h.delay(30);
          const blocked = await h.evaluate(conn, `new Promise(resolve=>{
            const url=URL.createObjectURL(new Blob(['postMessage(navigator.hardwareConcurrency)'],{type:'application/javascript'}));
            try{const w=new Worker(url);w.onmessage=e=>{w.terminate();URL.revokeObjectURL(url);resolve({cores:e.data})};w.onerror=()=>resolve({error:'load-error'})}
            catch(e){URL.revokeObjectURL(url);resolve({error:e.name})}
          })`);
          assert.equal(blocked.error, 'SecurityError', 'CSP-blocked prefix delivery must not fall back to host identity');
          const trusted = await h.evaluate(conn, `(()=>{
            if(!globalThis.trustedTypes)return 'unavailable';
            const policy=trustedTypes.createPolicy('native-contract',{createScriptURL:value=>value});
            const url=URL.createObjectURL(new Blob(['postMessage(navigator.hardwareConcurrency)'],{type:'application/javascript'}));
            try{new Worker(policy.createScriptURL(url));return 'accepted'}catch(e){return e.name}finally{URL.revokeObjectURL(url)}
          })()`);
          assert.equal(trusted, 'SecurityError', 'trusted inline URLs must not bypass delivery or Trusted Types policy');
        }
        console.log(`PASS ${spec.os} v${spec.version} injected=${spec.inject} native contracts (${headless ? 'headless' : 'headed'})`);
      } finally { conn?.close(); await session.close(); }
    }
  } finally { await new Promise((resolve) => server.close(resolve)); }
}
run().catch((error) => { console.error(error); process.exitCode = error instanceof h.Unavailable ? 2 : 1; });
