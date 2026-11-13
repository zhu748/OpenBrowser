'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript, applyFingerprintToTab,
  assertFingerprintConsistency } = require('../fingerprint');
const documentBootstrap = require('../fingerprint/runtime/document-bootstrap');
const workerBootstrap = require('../fingerprint/runtime/worker-bootstrap');
const { LIVE_PROBE_EXPRESSION } = require('../fingerprint-debug-log');
const { evaluateFingerprintDelivery } = require('../request-header-rewriter');

let passed = 0;
async function test(name, run) { await run(); passed += 1; console.log('PASS ' + name); }
const profile = (id, privacy = {}) => ({ id, name: id, os: 'Windows',
  fingerprintSeed: id, privacy: { fontListMode: 'real', ...privacy } });

// Execute the production bootstrap up to its native-wrapper setup. This exposes
// the actual pixel transform without implementing a second canvas algorithm.
function noiseRealm(fp, worker, hostname) {
  const context = { json: JSON.stringify({ seed: fp.seed, canvas: fp.canvas, stability: fp.stability }), bridgeToken: 'test', uaScript: '' };
  const source = worker ? workerBootstrap(context) : documentBootstrap(context);
  const boundary = worker ? '  const sources = ' : '  const originalToString';
  const offset = source.indexOf(boundary);
  assert.ok(offset > 0, 'production noise bootstrap boundary exists');
  const scope = vm.createContext({});
  vm.runInContext(`globalThis.location={hostname:${JSON.stringify(hostname)}};`, scope);
  vm.runInContext(source.slice(0, offset) + `
    globalThis.sample=()=>{
      const image={width:128,height:96,data:new Uint8ClampedArray(128*96*4).fill(100)};
      ${worker ? 'applyNoise' : 'applyCanvasNoise'}(image,CFG.canvas.mark);
      return {pixels:Array.from(image.data),active:stabilityActiveNow(),amp:noiseAmplitudeNow(),step:sampleStepDivisorNow()};
    };
    globalThis.transparent=()=>{
      const image={width:16,height:16,data:new Uint8ClampedArray(16*16*4)};
      ${worker ? 'applyNoise' : 'applyCanvasNoise'}(image,CFG.canvas.mark);
      return Array.from(image.data);
    };
    ${worker ? '' : '} catch(error) {throw error;}'}
  })();`, scope);
  return scope;
}

function networkRealm(fp, worker, expose = true) {
  const scope = vm.createContext({ setTimeout, clearTimeout, URL, DOMException });
  vm.runInContext(`
    const window=globalThis,self=globalThis;
    class ${worker ? 'WorkerNavigator' : 'Navigator'} {}
    class Screen {}
    const navigator=new ${worker ? 'WorkerNavigator' : 'Navigator'}();
    const screen=new Screen();
    const document={documentElement:{clientWidth:800,clientHeight:600},body:{},createElement(){return {getContext(){return null}}},querySelectorAll(){return []}};
    const location={hostname:'example.test',href:'https://example.test/'};
    class NetworkInformation {}
    const connection=new NetworkInformation();
    for (const [key,value] of Object.entries({rtt:0,downlink:10,effectiveType:'4g',saveData:false})) {
      Object.defineProperty(NetworkInformation.prototype,key,{configurable:true,enumerable:true,get(){
        if(this!==connection)throw new TypeError('Illegal invocation');return value;
      }});
    }
    ${expose ? `Object.defineProperty(${worker ? 'WorkerNavigator' : 'Navigator'}.prototype,'connection',{configurable:true,get(){return connection}});` : ''}
    globalThis.navigator=navigator;globalThis.window=window;globalThis.self=self;
    globalThis.${worker ? 'WorkerNavigator' : 'Navigator'}=${worker ? 'WorkerNavigator' : 'Navigator'};
    globalThis.connection=connection;
  `, scope);
  const source = worker ? buildWorkerInjectionScript(fp) : buildInjectionScript(fp);
  vm.runInContext(source, scope);
  return { scope, source };
}

(async () => {
  await test('runtime auto/force/off and prefix exceptions agree in documents and workers', () => {
    for (const [mode, host, active] of [['auto', 'www.amazon.com', true], ['auto', 'example.test', false],
      ['force', 'example.test', true], ['off', 'www.amazon.com', false], ['force', 'cdn.amazon.com', false]]) {
      const fp = buildFingerprint(profile('policy', { stabilityMode: mode }));
      const results = [false, true].map((worker) => vm.runInContext('sample()', noiseRealm(fp, worker, host)));
      for (const result of results) {
        assert.equal(result.active, active);
        assert.equal(result.amp, active ? 1 : 3);
        assert.equal(result.step, active ? 128 : 64);
        assert.ok(result.pixels.some((v) => v !== 100), `${mode} must preserve perturbation`);
      }
      assert.deepEqual(Array.from(results[0].pixels), Array.from(results[1].pixels), 'realm pixel parity');
    }
  });
  await test('stable samples repeat exactly, remain seed-specific, and preserve transparent pixels', () => {
    for (const worker of [false, true]) {
      const a = noiseRealm(buildFingerprint(profile('seed-a', { stabilityMode: 'force' })), worker, 'example.test');
      const b = noiseRealm(buildFingerprint(profile('seed-b', { stabilityMode: 'force' })), worker, 'example.test');
      const pixels = Array.from(vm.runInContext('sample().pixels', a));
      assert.deepEqual(pixels, Array.from(vm.runInContext('sample().pixels', a)));
      assert.notDeepEqual(pixels, Array.from(vm.runInContext('sample().pixels', b)));
      assert.ok(vm.runInContext('transparent().every(v=>v===0)', a));
    }
  });
  await test('document and worker network accessors use one persona and preserve native contracts', () => {
    const fp = buildFingerprint(profile('network', { network: { rtt: 250, downlink: 2.3, effectiveType: '3g' } }));
    for (const worker of [false, true]) {
      const { scope, source } = networkRealm(fp, worker);
      assert.equal(vm.runInContext('navigator.connection.rtt', scope), fp.connection.rtt);
      assert.equal(vm.runInContext('navigator.connection.downlink', scope), fp.connection.downlink);
      assert.equal(vm.runInContext('navigator.connection.effectiveType', scope), fp.connection.effectiveType);
      assert.equal(vm.runInContext("'type' in navigator.connection", scope), false, 'absent API members stay absent');
      assert.equal(vm.runInContext("Object.getOwnPropertyNames(connection).length", scope), 0);
      assert.throws(() => vm.runInContext("Object.getOwnPropertyDescriptor(NetworkInformation.prototype,'rtt').get.call({})", scope), (e) => e.name === 'TypeError');
      vm.runInContext('globalThis.firstGetter=Object.getOwnPropertyDescriptor(NetworkInformation.prototype,"rtt").get;', scope);
      vm.runInContext(source, scope);
      assert.equal(vm.runInContext('firstGetter===Object.getOwnPropertyDescriptor(NetworkInformation.prototype,"rtt").get', scope), true, 'reinjection must not stack network getters');
    }
  });
  await test('network real mode and absent worker APIs remain native', () => {
    for (const worker of [false, true]) {
      const real = networkRealm(buildFingerprint(profile('real-' + worker, { networkMode: 'real' })), worker);
      assert.equal(vm.runInContext('navigator.connection.rtt', real.scope), 0);
      const absent = networkRealm(buildFingerprint(profile('absent-' + worker)), worker, false);
      assert.equal(vm.runInContext("'connection' in navigator", absent.scope), false);
    }
  });
  await test('iOS personas omit the network-information API in both document and worker scopes', () => {
    const fp = buildFingerprint({ ...profile('ios-network'), os: 'iOS' });
    for (const worker of [false, true]) {
      const { scope } = networkRealm(fp, worker);
      assert.equal(vm.runInContext("'connection' in navigator", scope), false);
    }
  });
  await test('the production live probe reads network state and strict delivery rejects drift', async () => {
    const p = profile('probe-network'), fp = buildFingerprint(p);
    const { scope } = networkRealm(fp, false);
    const live = await vm.runInContext(LIVE_PROBE_EXPRESSION, scope);
    assert.equal(live.probeError, undefined);
    assert.equal(live.connection.rtt, fp.connection.rtt);
    const healthy = evaluateFingerprintDelivery(p, fp, live, { strict: true });
    assert.ok(!healthy.mismatches.some((m) => m.field.startsWith('connection.')));
    const drifted = evaluateFingerprintDelivery(p, fp, { ...live, connection: { ...live.connection, rtt: -1 } }, { strict: true });
    assert.ok(drifted.mismatches.some((m) => m.field === 'connection.rtt'));
  });
  await test('desktop metrics explicitly apply DPR=1/1.5/2 with live viewport dimensions', async () => {
    for (const dpr of [1, 1.5, 2]) {
      const p = profile('metrics-' + dpr, { fingerprint: { devicePixelRatio: dpr } });
      const fp = buildFingerprint(p), commands = [];
      await applyFingerprintToTab(async (method, params) => {
        commands.push({ method, params });
        return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'registered' } : {};
      }, null, fp, p, { applyKey: p.id, isWaiting: true });
      const metrics = commands.filter((c) => c.method === 'Emulation.setDeviceMetricsOverride');
      assert.equal(metrics.length, 1);
      assert.deepEqual(metrics[0].params, { width: 0, height: 0, deviceScaleFactor: dpr, mobile: false,
        screenWidth: fp.screen.width, screenHeight: fp.screen.height });
      assert.ok(!commands.some((c) => c.method === 'Emulation.clearDeviceMetricsOverride'));
      assert.ok(commands.indexOf(metrics[0]) < commands.findIndex((c) => c.method === 'Page.addScriptToEvaluateOnNewDocument'));
    }
  });
  await test('resizing the viewport cannot change the declared screen or available display', () => {
    const fp = buildFingerprint(profile('stable-display'));
    const { scope } = networkRealm(fp, false);
    const read = () => vm.runInContext('({width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight})', scope);
    const before = JSON.stringify(read());
    vm.runInContext('document.documentElement.clientWidth=5000;document.documentElement.clientHeight=4000;', scope);
    assert.equal(vm.runInContext('innerWidth', scope), 5000, 'viewport follows the resize');
    assert.equal(JSON.stringify(read()), before, 'display identity stays fixed');
    assert.equal(read().width, fp.screen.width);
  });
  await test('failed desktop metric synchronization rejects injection before registration', async () => {
    const p = profile('failed-metrics');let registered = false;
    await assert.rejects(applyFingerprintToTab(async (method) => {
      if (method === 'Emulation.setDeviceMetricsOverride') throw new Error('metrics unavailable');
      if (method === 'Page.addScriptToEvaluateOnNewDocument') registered = true;
      return {};
    }, null, buildFingerprint(p), p), /metrics unavailable/);
    assert.equal(registered, false);
  });
  await test('profile-only overrides update independently of JS registration and restore native defaults', async () => {
    const p = profile('native-override-key', { geoMode: 'custom', latitude: 12, longitude: 34,
      geoPermission: 'allow', timezoneMode: 'custom', timezone: 'America/New_York' });
    const fp = buildFingerprint(p), calls = [];
    const invoke = async (method, params) => {
      calls.push({ method, params });
      return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'override-source' } : {};
    };
    const options = { applyKey: 'overrides' };
    await applyFingerprintToTab(invoke, null, fp, p, options);
    calls.length = 0;
    await applyFingerprintToTab(invoke, null, fp, { ...p, privacy: { ...p.privacy, latitude: 15 } }, options);
    assert.equal(calls.find((c) => c.method === 'Emulation.setGeolocationOverride').params.latitude, 15);
    assert.equal(calls.length, 1, 'a coordinate-only edit needs exactly one native command');
    assert.equal(calls.some((c) => /Runtime.evaluate|Page.addScript/.test(c.method)), false, 'native-only changes do not resend the JS payload');
    calls.length = 0;
    const reset = { ...p, privacy: { ...p.privacy, timezoneMode: 'real', geoMode: 'prompt', geoPermission: 'prompt' } };
    await applyFingerprintToTab(invoke, null, buildFingerprint(reset), reset, options);
    assert.equal(calls.find((c) => c.method === 'Emulation.setTimezoneOverride').params.timezoneId, '');
    assert.ok(calls.some((c) => c.method === 'Emulation.clearGeolocationOverride'));
    assert.equal(calls.find((c) => c.method === 'Browser.setPermission').params.setting, 'prompt');
  });
  await test('desktop profiles clear touch emulation left by a mobile identity', async () => {
    const calls = [], invoke = async (method, params) => {
      calls.push({ method, params }); return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'touch-source' } : {};
    };
    const mobile = { ...profile('touch-reset'), os: 'Android' };
    await applyFingerprintToTab(invoke, null, buildFingerprint(mobile), mobile, { applyKey: 'touch' });
    calls.length = 0;
    const desktop = profile('touch-reset');
    await applyFingerprintToTab(invoke, null, buildFingerprint(desktop), desktop, { applyKey: 'touch' });
    assert.ok(calls.some((c) => c.method === 'Emulation.setTouchEmulationEnabled' && c.params.enabled === false));
  });
  await test('subframes do not receive top-level layout commands; mobile geometry stays pinned', async () => {
    for (const os of ['Windows', 'Android']) {
      for (const subframe of [false, true]) {
        const p = { ...profile(os + '-' + subframe), os }, fp = buildFingerprint(p), commands = [];
        await applyFingerprintToTab(async (method, params) => {
          commands.push({ method, params });
          return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'registered' } : {};
        }, null, fp, p, { isSubframe: subframe, targetType: subframe ? 'iframe' : 'page', isWaiting: true });
        const metrics = commands.find((c) => c.method === 'Emulation.setDeviceMetricsOverride');
        if (subframe) assert.equal(metrics, undefined);
        else if (fp.mobile) assert.equal(metrics.params.width, fp.mobileDevice.viewport.width);
        else assert.equal(metrics.params.width, 0);
      }
    }
  });
  await test('a stale custom UA fails before CDP; strict mode repairs UA and Client Hints', async () => {
    const p = { ...profile('stale-ua'), kernelVersion: '156.0.8078.79',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };
    let calls = 0;
    await assert.rejects(applyFingerprintToTab(async () => { calls += 1; }, null, buildFingerprint(p), p), { code: 'FINGERPRINT_CONFIG_INVALID' });
    assert.equal(calls, 0);
    const repaired = buildFingerprint({ ...p, privacy: { ...p.privacy, fingerprint: { uaStrict: true } } });
    assertFingerprintConsistency(repaired);
    assert.match(repaired.userAgent, /Chrome\/156\.0\.0\.0/);
    assert.equal(repaired.userAgentMetadata.fullVersion, p.kernelVersion);
  });
  console.log(`fingerprint-runtime-consistency-selftest: OK ${passed}/${passed}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
