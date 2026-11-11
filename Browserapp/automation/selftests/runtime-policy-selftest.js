'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const cdp = require('../../cdp');
const { applyRuntimeSettings } = require('../../engine/runtime-settings');
const { applyTargetRuntimePolicy, runtimePolicyProfile } = require('../../engine/runtime-policy');
const { fingerprintConfigHash } = require('../../engine/fingerprint-injection');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript } = require('../fingerprint');
const { buildPortScanProtectionScript } = require('../port-scan-protection');

let count = 0;
async function test(name, run) { await run(); count += 1; console.log('PASS ' + name); }
const profile = (privacy = {}, advanced = {}) => ({ id: 'runtime-policy', os: 'Windows', privacy: { fontListMode: 'real', ...privacy }, advanced });
function realm() {
  return vm.createContext({ URL, DOMException, location: { href: 'https://example.test/' }, fetch: async (url) => ({ url }), setTimeout, clearTimeout });
}

(async () => {
  await test('port policies update and disable in place across document/worker fingerprint wrappers', async () => {
    for (const fingerprintScript of [null, buildInjectionScript(buildFingerprint(profile())), buildWorkerInjectionScript(buildFingerprint(profile()))]) {
      const context = realm();
      vm.runInContext(buildPortScanProtectionScript([8080]), context);
      const original = vm.runInContext('fetch', context);
      if (fingerprintScript) vm.runInContext(fingerprintScript, context);
      vm.runInContext(buildPortScanProtectionScript([8081]), context);
      assert.equal(vm.runInContext('fetch', context), original, 'updates cannot stack a wrapper');
      assert.equal(await vm.runInContext("fetch('http://127.0.0.1:8081').then(()=>true,()=>false)", context), true);
      assert.equal(await vm.runInContext("fetch('http://127.0.0.1:8080').then(()=>true,()=>false)", context), false);
      vm.runInContext(buildPortScanProtectionScript([], { enabled: false }), context);
      assert.equal(await vm.runInContext("fetch('http://127.0.0.1:9999').then(()=>true,()=>false)", context), true);
      assert.equal(vm.runInContext("typeof Function.prototype.toString.call(fetch, 'f'.repeat(64))", context), 'string');
    }
  });
  await test('protected constructors retain constants, subclassing and the native no-new error', () => {
    const context = realm();
    vm.runInContext(`
      var WebSocket=class WebSocket { static OPEN=1; static CONNECTING=0; constructor(url){this.url=url} };
      var EventSource=class EventSource { static CLOSED=2; constructor(url){this.url=url} };
      globalThis.WebSocket=WebSocket;globalThis.EventSource=EventSource;
      const images=new WeakSet();
      var HTMLImageElement=class HTMLImageElement {constructor(){images.add(this)}get src(){if(!images.has(this))throw new TypeError('Illegal invocation');return this.value||''}set src(value){if(!images.has(this))throw new TypeError('Illegal invocation');this.value=value}};
      globalThis.HTMLImageElement=HTMLImageElement;
    `, context);
    vm.runInContext(buildPortScanProtectionScript([8080]), context);
    assert.equal(vm.runInContext('WebSocket.OPEN', context), 1);
    assert.equal(vm.runInContext('EventSource.CLOSED', context), 2);
    assert.equal(vm.runInContext("new WebSocket('wss://example.test').constructor===WebSocket", context), true);
    assert.equal(vm.runInContext("new EventSource('https://example.test').constructor===EventSource", context), true);
    assert.equal(vm.runInContext("(()=>{class Child extends WebSocket{};return new Child('wss://example.test') instanceof Child})()", context), true);
    assert.throws(() => vm.runInContext("WebSocket('wss://example.test')", context), (error) => error.name === 'TypeError');
    assert.equal(vm.runInContext("(()=>{const image=new HTMLImageElement();image.src='http://127.0.0.1:9999/a';image.src='https://example.test/b';return image.src})()", context), 'https://example.test/b');
    assert.match(vm.runInContext("Function.prototype.toString.call(Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src').set)", context), /\[native code\]/);
    assert.throws(() => vm.runInContext("Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src').set.call({},'http://127.0.0.1:9999')", context), (error) => error.name === 'TypeError');
  });
  await test('local pages retain same-origin APIs without allowing other ports or external-origin probes', async () => {
    const context = realm();
    context.location.href = 'http://127.0.0.1:50326/?pid=test';
    vm.runInContext('var WebSocket=class WebSocket{constructor(url){this.url=url}};', context);
    vm.runInContext(buildPortScanProtectionScript([]), context);
    assert.equal(await vm.runInContext("fetch('/api/session').then(()=>true,()=>false)", context), true);
    assert.equal(vm.runInContext("new WebSocket('ws://127.0.0.1:50326/socket').url", context), 'ws://127.0.0.1:50326/socket');
    assert.throws(() => vm.runInContext("new WebSocket('ws://127.0.0.1:50327/socket')", context), (error) => error.name === 'SecurityError');
    assert.equal(await vm.runInContext("fetch('http://127.0.0.1:50327/api/session').then(()=>true,()=>false)", context), false);
    context.location.href = 'https://external.test/';
    assert.equal(await vm.runInContext("fetch('http://127.0.0.1:50326/api/session').then(()=>true,()=>false)", context), false);
    assert.throws(() => vm.runInContext("new WebSocket('ws://127.0.0.1:50326/socket')", context), (error) => error.name === 'SecurityError');
  });
  await test('private bridge misses traverse stacked wrappers once instead of exponentially', () => {
    const context = realm();
    vm.runInContext(`var baseCalls=0;const baseToString=Function.prototype.toString;Function.prototype.toString=function(){baseCalls++;return baseToString.apply(this,arguments)}`, context);
    for (let index = 0; index < 5; index += 1) {
      vm.runInContext(buildInjectionScript(buildFingerprint({ ...profile(), id: 'bridge-' + index })), context);
    }
    vm.runInContext('baseCalls=0', context);
    assert.equal(vm.runInContext("typeof Function.prototype.toString.call(Array,'f'.repeat(64))", context), 'string');
    assert.equal(vm.runInContext('baseCalls', context), 1, 'each bridge miss delegates only once');
  });
  await test('cached fingerprints still receive saved policy edits, removals and port disable', async () => {
    const savedCdp = { tabs: cdp.tabs, call: cdp.call, connect: cdp.connect };
    const launched = profile({ portScanProtect: true, portScanAllow: '8080' }, { blockVideo: true });
    const fp = buildFingerprint(launched);
    const owner = {}, applied = new Set(['page']);
    const context = realm(), commands = [], scripts = new Map();
    let nextId = 0;
    const engine = { networkInfo: new Map(), profiles: new Map([[launched.id, launched]]) };
    cdp.tabs = async () => [{ id: 'page', url: 'https://example.test/', webSocketDebuggerUrl: 'ws://127.0.0.1/page' }];
    cdp.call = async (_ws, method, params) => {
      commands.push({ method, params });
      if (method === 'Page.addScriptToEvaluateOnNewDocument') { const identifier = String(++nextId); scripts.set(identifier, params.source); return { identifier }; }
      if (method === 'Page.removeScriptToEvaluateOnNewDocument') scripts.delete(params.identifier);
      if (method === 'Runtime.evaluate') vm.runInContext(params.expression, context);
      return {};
    };
    cdp.connect = async (url) => ({ command: (method, params) => cdp.call(url, method, params), close() {} });
    const run = () => applyRuntimeSettings.call(engine, 1234, launched, fp, { appliedTargetIds: applied, appliedFingerprintHash: fingerprintConfigHash(fp), trackOn: owner });
    try {
      assert.equal(await run(), fp);
      assert.ok(commands.some((x) => x.method === 'Network.setBlockedURLs' && x.params.urls.includes('*.mp4')));
      assert.equal(scripts.size, 1);
      const firstFetch = vm.runInContext('fetch', context);
      commands.length = 0;
      await run();
      assert.equal(commands.length, 0, 'steady policy requires no protocol calls');
      engine.profiles.set(launched.id, profile({ portScanProtect: true, portScanAllow: '8081' }, { blockVideo: false, blockUrls: '' }));
      await run();
      assert.deepEqual(commands.find((x) => x.method === 'Network.setBlockedURLs').params.urls, []);
      assert.equal(scripts.size, 1);
      assert.equal(vm.runInContext('fetch', context), firstFetch);
      assert.equal(await vm.runInContext("fetch('http://localhost:8081').then(()=>true,()=>false)", context), true);
      engine.profiles.set(launched.id, profile({ portScanProtect: false }, {}));
      await run();
      assert.equal(scripts.size, 0);
      assert.equal(await vm.runInContext("fetch('http://localhost:9999').then(()=>true,()=>false)", context), true);
      assert.equal(owner.fingerprint, fp);
      assert.equal(runtimePolicyProfile(launched, { ...profile(), userAgent: 'changed' }).userAgent, launched.userAgent);
    } finally { Object.assign(cdp, savedCdp); }
  });
  await test('parallel flat/socket calls share registrations, and failed policy commands retry', async () => {
    const owner = {}, calls = [];
    let failBlock = true, failEvaluation = true;
    const invoke = async (method, _params) => {
      calls.push(method);
      if (method === 'Network.setBlockedURLs' && failBlock) { failBlock = false; throw new Error('block failed'); }
      if (method === 'Page.addScriptToEvaluateOnNewDocument') return { identifier: 'policy' };
      if (method === 'Runtime.evaluate' && failEvaluation) { failEvaluation = false; return { exceptionDetails: { text: 'policy failed' } }; }
      return {};
    };
    const options = { owner, targetId: 'same', invoke, profile: profile({ portScanProtect: true }, { blockVideo: true }) };
    await assert.rejects(applyTargetRuntimePolicy(options), /block failed/);
    await assert.rejects(applyTargetRuntimePolicy(options), /policy failed/);
    await Promise.all([applyTargetRuntimePolicy(options), applyTargetRuntimePolicy(options)]);
    assert.equal(calls.filter((x) => x === 'Network.setBlockedURLs').length, 2);
    assert.equal(calls.filter((x) => x === 'Page.addScriptToEvaluateOnNewDocument').length, 2);
    assert.equal(calls.filter((x) => x === 'Page.removeScriptToEvaluateOnNewDocument').length, 1);
  });
  await test('iframe and all worker sessions receive policies without page registrations in workers', async () => {
    const oldTabs = cdp.tabs;
    const launched = profile({ portScanProtect: true }, { blockVideo: true });
    const fp = buildFingerprint(launched), calls = [];
    const targets = ['iframe', 'worker', 'shared_worker', 'service_worker'];
    const item = {
      fingerprintTargetSessions: new Map(targets.map((type) => [type, { targetId: type, type }])),
      workerFingerprintConnection: { command: async (method, params, options) => {
        calls.push({ method, params, sessionId: options.sessionId });
        return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'iframe-policy' } : {};
      } },
    };
    cdp.tabs = async () => [];
    try {
      await applyRuntimeSettings.call({ networkInfo: new Map() }, 1234, launched, fp, { appliedTargetIds: new Set(), trackOn: item });
      for (const type of targets) {
        assert.ok(calls.some((x) => x.sessionId === type && x.method === 'Runtime.evaluate'));
        assert.ok(calls.some((x) => x.sessionId === type && x.method === 'Network.setBlockedURLs'));
        assert.equal(calls.some((x) => x.sessionId === type && x.method.startsWith('Page.')), type === 'iframe');
      }
    } finally { cdp.tabs = oldTabs; }
  });
  console.log(`runtime-policy-selftest: OK ${count}/${count}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
