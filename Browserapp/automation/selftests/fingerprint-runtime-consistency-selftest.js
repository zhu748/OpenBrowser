'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript, applyFingerprintToTab,
  assertFingerprintConsistency } = require('../fingerprint');
const documentBootstrap = require('../fingerprint/runtime/document-bootstrap');
const workerBootstrap = require('../fingerprint/runtime/worker-bootstrap');
const { LIVE_PROBE_EXPRESSION } = require('../fingerprint-debug-log');
const { buildDocumentDeliveryProbe } = require('../fingerprint/delivery-probe');
const { buildPortScanProtectionScript } = require('../port-scan-protection');
const { canonicalBridgeToken } = require('../fingerprint/shared');
const { evaluateFingerprintDelivery } = require('../request-header-rewriter');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');

let passed = 0;
async function test(name, run) { await run(); passed += 1; console.log('PASS ' + name); }
const profile = (id, privacy = {}) => ({ id, name: id, os: 'Windows',
  fingerprintSeed: id, privacy: { fontListMode: 'real', ...privacy } });

// Execute the production bootstrap up to its native-wrapper setup. This exposes
// the actual pixel transform without implementing a second canvas algorithm.
function noiseRealm(fp, worker, hostname, origin) {
  const context = { json: JSON.stringify({ seed: fp.seed, canvas: fp.canvas, stability: fp.stability }),
    bridgeToken: 'test', uaScript: '', canvasNoise: true };
  const source = worker ? workerBootstrap(context) : documentBootstrap(context);
  const boundary = worker ? '  const sources = ' : '  const originalToString';
  const offset = source.indexOf(boundary);
  assert.ok(offset > 0, 'production noise bootstrap boundary exists');
  const scope = vm.createContext({ URL, origin, location: { hostname } });
  vm.runInContext(source.slice(0, offset) + `
    globalThis.sample=(data=new Uint8ClampedArray(128*96*4).fill(100))=>{
      const image={width:128,height:96,data};
      applyCanvasNoise(image,CFG.canvas.mark);
      return {pixels:Array.from(image.data),active:stabilityActiveNow(),amp:noiseAmplitudeNow(),step:sampleStepDivisorNow()};
    };
    globalThis.transparent=()=>{
      const image={width:128,height:96,data:new Uint8ClampedArray(128*96*4)};
      applyCanvasNoise(image,CFG.canvas.mark);
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
    for (const [key,value] of Object.entries({rtt:0,downlink:10,downlinkMax:200,effectiveType:'4g',saveData:false})) {
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
  await test('the live delivery probe requires the script installed for the exact fingerprint', async () => {
    const fp = buildFingerprint(profile('document-delivery-marker'));
    const { scope } = networkRealm(fp, false);
    const healthy = await vm.runInContext(buildDocumentDeliveryProbe(fp), scope);
    assert.equal(healthy.userAgent, fp.userAgent);
    const wrong = buildFingerprint(profile('different-marker'));
    for (const [fingerprint, context] of [[fp, vm.createContext({})], [wrong, scope]]) {
      const failed = await vm.runInContext(buildDocumentDeliveryProbe(fingerprint), context);
      assert.match(failed.probeError, /未完成安装/);
    }
    assert.equal(vm.runInContext(buildDocumentDeliveryProbe(fp, { paused: true }), scope).userAgent, fp.userAgent);
  });
  await test('port protection preserves document verification when registered after fingerprint delivery', async () => {
    const fp = buildFingerprint(profile('port-protection-delivery-marker'));
    const { scope, source } = networkRealm(fp, false);
    vm.runInContext(buildPortScanProtectionScript([]), scope);
    const protectedToString = vm.runInContext('Function.prototype.toString', scope);
    assert.equal((await vm.runInContext(buildDocumentDeliveryProbe(fp), scope)).userAgent, fp.userAgent);
    const token = JSON.stringify(canonicalBridgeToken(fp));
    assert.equal(vm.runInContext(`(() => {
      const inspect = Function.prototype.toString;
      const registry = new WeakMap();
      return inspect.call(inspect, ${token}, 'sharedWorkers', registry) === registry;
    })()`, scope), true);
    const wrongFingerprint = buildFingerprint(profile('other-port-protection-delivery-marker'));
    assert.match((await vm.runInContext(buildDocumentDeliveryProbe(wrongFingerprint), scope)).probeError, /未完成安装/);
    const nativeText = 'function toString() { [native code] }';
    assert.equal(vm.runInContext('Function.prototype.toString.call(Function.prototype.toString)', scope), nativeText);
    const wrongToken = JSON.stringify(canonicalBridgeToken(wrongFingerprint));
    assert.equal(vm.runInContext(`Function.prototype.toString.call(Function.prototype.toString, ${wrongToken}, 'documentInstalled')`,
      scope), nativeText);
    vm.runInContext(source, scope);
    assert.equal(vm.runInContext('Function.prototype.toString', scope), protectedToString, 'registered replay stays a no-op');
  });
  await test('system timezone and real GPU are shared across document and worker configuration', async () => {
    const sourceProfile = profile('native-timezone-and-gpu', { timezoneMode: 'real', webglMeta: 'real', webgpu: 'webgl' });
    const fp = buildFingerprint(sourceProfile);
    assert.deepEqual(fp.webgpu, { mode: 'real', gpu: null });
    fp.dynamicConfig.timezone = 'Pacific/Kiritimati';
    for (const worker of [false, true]) {
      const { scope, source } = networkRealm(fp, worker);
      assert.match(source, /"webgpu":\{"mode":"real","gpu":null\}/);
      assert.equal(vm.runInContext('Intl.DateTimeFormat().resolvedOptions().timeZone', scope),
        Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    const calls = [];
    await applyFingerprintToTab(async (method, params) => {
      calls.push({ method, params });
      return { identifier: 'script' };
    }, null, fp, sourceProfile);
    assert.ok(!calls.some(call => call.method === 'Emulation.setTimezoneOverride'));
  });
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
  await test('inherited origins use the same allowlist and exceptions as direct URLs', () => {
    const fp = buildFingerprint(profile('inherited-origin', { stabilityHosts: ['example.test'], stabilitySkipHosts: ['cdn.'] }));
    for (const worker of [false, true]) {
      for (const [hostname, origin, active] of [
        ['', 'https://a.example.test:8443', true],
        ['', 'https://cdn.example.test', false],
        ['a.example.test.', 'https://other.test', true],
        ['', 'null', false],
      ]) assert.equal(vm.runInContext('sample().active', noiseRealm(fp, worker, hostname, origin)), active);
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
      const blankFirst = noiseRealm(buildFingerprint(profile('seed-a', { stabilityMode: 'force' })), worker, 'example.test');
      vm.runInContext('transparent()', blankFirst);
      assert.deepEqual(Array.from(vm.runInContext('sample().pixels', blankFirst)), pixels,
        'a transparent first read cannot suppress noise on later opaque draws of the same size');
      blankFirst.foreignPixels = new Uint8ClampedArray(128 * 96 * 4).fill(100);
      assert.deepEqual(Array.from(vm.runInContext('sample(foreignPixels).pixels', blankFirst)), pixels,
        'byte pixels from a different realm use the same sampling plan');
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
    const p = profile('probe-network', { network: { downlinkMax: 75 } }), fp = buildFingerprint(p);
    const { scope } = networkRealm(fp, false);
    const live = await vm.runInContext(LIVE_PROBE_EXPRESSION, scope);
    assert.equal(live.probeError, undefined);
    assert.equal(live.connection.rtt, fp.connection.rtt);
    assert.equal(live.connection.downlinkMax, 75);
    const healthy = evaluateFingerprintDelivery(p, fp, live, { strict: true });
    assert.ok(!healthy.mismatches.some((m) => m.field.startsWith('connection.')));
    const drifted = evaluateFingerprintDelivery(p, fp, { ...live, connection: { ...live.connection, rtt: -1, downlinkMax: 200 } }, { strict: true });
    assert.ok(drifted.mismatches.some((m) => m.field === 'connection.rtt'));
    assert.ok(drifted.mismatches.some((m) => m.field === 'connection.downlinkMax'));
  });
  await test('system language takes precedence over saved custom languages and is verified', async () => {
    const p = sanitizeProfile(profile('system-language', { languageMode: 'system', fingerprint: { languages: ['de-DE', 'ja-JP'] } }));
    const fp = buildFingerprint(p);
    assert.equal(fp.languages[0], Intl.getCanonicalLocales(Intl.DateTimeFormat().resolvedOptions().locale)[0]);
    assert.deepEqual(p.privacy.fingerprint.languages, ['de-DE', 'ja-JP']);
    assert.deepEqual(buildFingerprint({ ...p, privacy: { ...p.privacy, languageMode: 'profile' } }).languages, ['de-DE', 'ja-JP']);
    const { scope } = networkRealm(fp, false);
    const live = await vm.runInContext(LIVE_PROBE_EXPRESSION, scope);
    const drifted = evaluateFingerprintDelivery(p, fp, { ...live, language: 'es-ES', languages: ['es-ES'] }, { strict: true });
    assert.ok(drifted.mismatches.some(({ field }) => field === 'languages'));
  });
  await test('desktop metrics explicitly apply saved DPR with live viewport dimensions', async () => {
    for (const dpr of [1, 1.5, 2, 4.5]) {
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
  await test('saved screen work areas fit the panel and preserve a zero-height taskbar', async () => {
    const custom = (extra) => sanitizeProfile(profile('work-area', { fingerprint: { screenWidth: 1280, screenHeight: 800, ...extra } }));
    const cases = [
      [{ availLeft: 40, availTop: 55 }, [40, 55, 1240, 745]],
      [{ availLeft: 40, availTop: 55, availWidth: 1280, availHeight: 800 }, [40, 55, 1240, 745]],
      [{ availLeft: 7680, availTop: 7680 }, [1279, 799, 1, 1]],
      [{ taskbarHeight: 0 }, [0, 0, 1280, 800]],
    ];
    for (const [settings, expected] of cases) {
      const p = custom(settings), fp = buildFingerprint(p);
      assertFingerprintConsistency(fp);
      const { scope } = networkRealm(fp, false);
      const live = await vm.runInContext(LIVE_PROBE_EXPRESSION, scope);
      const { availLeft, availTop, availWidth, availHeight } = live.screenWorkArea;
      assert.deepEqual([availLeft, availTop, availWidth, availHeight], expected);
      const delivered = evaluateFingerprintDelivery(p, fp, live, { strict: true });
      assert.ok(!delivered.mismatches.some((m) => m.field.startsWith('screen.')));
      live.screenWorkArea.availHeight += 1;
      const drift = evaluateFingerprintDelivery(p, fp, live, { strict: true });
      assert.ok(drift.mismatches.some((m) => m.field === 'screen.availHeight'));
    }
  });
  await test('following the display disables stored custom geometry and DPR until custom is selected again', () => {
    const custom = sanitizeProfile(profile('switch-display', { fingerprint: {
      screenWidth: 1280, screenHeight: 800, availLeft: 40, availWidth: 1240, devicePixelRatio: 4.5,
    } }));
    const system = { ...custom, privacy: { ...custom.privacy, resolutionMode: 'real' } };
    const hostScreen = { width: 1440, height: 900, availLeft: 0, availTop: 20, availWidth: 1440, availHeight: 880, devicePixelRatio: 1.5 };
    const real = buildFingerprint({ ...system, hostScreen });
    assertFingerprintConsistency(real);
    for (const [key, value] of Object.entries(hostScreen)) assert.equal(real.screen[key], value, key);
    const fallback = buildFingerprint(system);
    assert.deepEqual(fallback.screen, buildFingerprint({ ...system, privacy: { ...system.privacy, fingerprint: {} } }).screen);
    const restored = buildFingerprint({ ...custom, hostScreen });
    assertFingerprintConsistency(restored);
    assert.equal(restored.screen.devicePixelRatio, 4.5);
    assert.equal(restored.screen.availLeft, 40);
    const mobile = buildFingerprint({ ...custom, os: 'Android' });
    assert.equal(mobile.mobileDevice.dpr, mobile.screen.devicePixelRatio);
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
  await test('retry restores native settings after a failed switch without adding a second script', async () => {
    const original = profile('retry-switch');
    const alternate = { ...original, os: 'Linux' };
    const initial = buildFingerprint(original);
    const changed = buildFingerprint(alternate);
    const commands = [];
    let failMetrics = false;
    let deliveredUa;
    const invoke = async (method, params) => {
      commands.push(method);
      if (method === 'Network.setUserAgentOverride') deliveredUa = params.userAgent;
      if (failMetrics && method === 'Emulation.setDeviceMetricsOverride') throw Error('metrics failure');
      return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'original-script' } : {};
    };
    const options = { applyKey: 'retry-switch' };
    await applyFingerprintToTab(invoke, null, initial, original, options);
    failMetrics = true;
    await assert.rejects(applyFingerprintToTab(invoke, null, changed, alternate, options), /metrics failure/);
    assert.equal(deliveredUa, changed.userAgent, 'the failed switch partially changed native settings');
    failMetrics = false;
    commands.length = 0;
    assert.deepEqual(await applyFingerprintToTab(invoke, null, initial, original, options), { documentStartOk: true, evaluated: true });
    assert.equal(deliveredUa, initial.userAgent);
    assert.ok(commands.includes('Emulation.setDeviceMetricsOverride'));
    assert.ok(!commands.some(method => /Page\.(add|remove)Script|Runtime\.evaluate/.test(method)));
    commands.length = 0;
    await applyFingerprintToTab(invoke, null, initial, original, options);
    assert.deepEqual(commands, [], 'a recovered target can reuse its verified state');
  });
  await test('retry clears an override whose acknowledgement was lost', async () => {
    const original = profile('retry-location', { geoMode: 'prompt', geoPermission: 'prompt' });
    const changed = { ...original, privacy: { ...original.privacy, geoMode: 'custom', geoPermission: 'allow', latitude: 45, longitude: 12 } };
    const fp = buildFingerprint(original);
    for (const failure of ['Emulation.setGeolocationOverride', 'Browser.setPermission']) {
      const calls = [];
      let failOnce = true;
      const invoke = async (method, params) => {
        calls.push([method, params.setting]);
        if (failOnce && method === failure) {
          failOnce = false;
          throw Error('Lost native acknowledgement');
        }
        return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'location-script' } : {};
      };
      const options = { applyKey: 'location-retry-' + failure };
      await applyFingerprintToTab(invoke, null, fp, original, options);
      await assert.rejects(applyFingerprintToTab(invoke, null, fp, changed, options), /Lost native acknowledgement/);
      calls.length = 0;
      await applyFingerprintToTab(invoke, null, fp, original, options);
      assert.ok(calls.some(([method]) => method === 'Emulation.clearGeolocationOverride'));
      if (failure === 'Browser.setPermission') assert.ok(calls.some(([method, setting]) => method === failure && setting === 'prompt'));
    }
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
  await test('losing configured coordinates revokes the live grant before clearing native emulation', async () => {
    const p = { ...profile('location-permission-reset', { geoMode: 'ip', geoPermission: 'allow' }), exitLatitude: 0, exitLongitude: 0 };
    const fp = buildFingerprint(p), calls = [];
    let failDenial = false;
    const invoke = async (method, params) => {
      calls.push({ method, params });
      if (failDenial && method === 'Browser.setPermission' && params.setting === 'denied') throw new Error('permission update failed');
      return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'location-source' } : {};
    };
    const options = { applyKey: 'location-policy' };
    await applyFingerprintToTab(invoke, null, fp, p, options);
    const override = calls.findIndex(({ method }) => method === 'Emulation.setGeolocationOverride');
    const grant = calls.findIndex(({ method }) => method === 'Browser.setPermission');
    assert.deepEqual(calls[override].params, fp.dynamicConfig.geoposition, 'CDP uses the same IP accuracy as generation');
    assert.ok(override < grant && calls[grant].params.setting === 'granted', 'coordinates precede the grant');
    const missing = { ...p, exitLatitude: null };
    calls.length = 0;
    failDenial = true;
    await assert.rejects(applyFingerprintToTab(invoke, null, fp, missing, options), /permission update failed/);
    assert.deepEqual(calls.map(({ method }) => method), ['Browser.setPermission'], 'a failed revocation keeps the existing override');
    failDenial = false;
    calls.length = 0;
    await applyFingerprintToTab(invoke, null, fp, missing, options);
    assert.deepEqual(calls, [
      { method: 'Browser.setPermission', params: { permission: { name: 'geolocation' }, setting: 'denied' } },
      { method: 'Emulation.clearGeolocationOverride', params: {} },
    ]);
    calls.length = 0;
    await applyFingerprintToTab(invoke, null, fp, p, options);
    assert.deepEqual(calls.map(({ method, params }) => [method, params.setting]),
      [['Emulation.setGeolocationOverride', undefined], ['Browser.setPermission', 'granted']]);
    calls.length = 0;
    const legacyPrompt = { ...p, privacy: { ...p.privacy, geoMode: 'prompt', geoPermission: undefined } };
    await applyFingerprintToTab(invoke, null, fp, legacyPrompt, options);
    assert.deepEqual(calls.map(({ method, params }) => [method, params.setting]),
      [['Browser.setPermission', 'prompt'], ['Emulation.clearGeolocationOverride', undefined]]);
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
