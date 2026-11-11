'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const os = require('node:os');
const cdp = require('../../cdp');
const startPage = require('../../engine/start-page');
const { readDeferredSessionUrls, saveDeferredSession, preserveLegacySession, openVerifiedStartupTabs, startupNavigationUrl } = require('../../engine/startup-session');
const { buildFingerprint, buildInjectionScript, applyFingerprintToTab } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { completeLaunchArguments } = require('../../engine/launch-arguments');
const { buildEditorUa } = require('../editor-ua');
const { evaluateFingerprintDelivery } = require('../request-header-rewriter');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup } = require('../firefox-fingerprint');
const { BidiConnection, evaluateBidi, deserializeRemoteValue, localBidiEndpoint } = require('../../network/bidi-connection');

let count = 0;
const test = async (name, fn) => { await fn(); count += 1; console.log(`PASS ${name}`); };
const profile = (extra = {}) => sanitizeProfile({ id: 'reliable-01', name: 'reliable', os: 'Windows', privacy: { fontListMode: 'real' }, ...extra });
const remote = (value) => {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) return { type: 'array', value: value.map(remote) };
  if (typeof value === 'object') return { type: 'object', value: Object.entries(value).map(([key, entry]) => [key, remote(entry)]) };
  return { type: typeof value, value };
};
function documentScope() {
  const scope = vm.createContext({});
  vm.runInContext(`
    class Navigator {};
    for (const [key,value] of Object.entries({userAgent:'native',platform:'Win32',vendor:'',deviceMemory:4,hardwareConcurrency:2,language:'en-US',languages:['en-US'],maxTouchPoints:0,webdriver:false})) {
      Object.defineProperty(Navigator.prototype,key,{configurable:true,enumerable:true,get(){return value}});
    }
    const navigator=new Navigator();const window=globalThis;const self=globalThis;
    const document={createElement(){return {getContext(){return null}}}};
    const screen={width:1920,height:1080};const location={hostname:'example.test',href:'https://example.test/'};
  `, scope);
  return scope;
}

(async () => {
  await test('safe defaults survive the production sanitizer', () => {
    const p = profile({ privacy: {} });
    assert.equal(p.privacy.webgpu, 'webgl');
    assert.equal(p.privacy.speech, 'noise');
    assert.ok(!buildFingerprint(p).consistency.issues.some((issue) => issue.code === 'webgpu-real-vs-webgl-disguised'));
  });
  await test('persistent seed rerolls identity and survives save/load', () => {
    const p = profile({ fingerprintSeed: 'seed-1' });
    assert.equal(sanitizeProfile(JSON.parse(JSON.stringify(p))).fingerprintSeed, 'seed-1');
    assert.equal(buildFingerprint(p).seed, buildFingerprint(p).seed);
    assert.notEqual(buildFingerprint(p).seed, buildFingerprint({ ...p, fingerprintSeed: 'seed-2' }).seed);
  });
  await test('start-page expectations use the actual launch identity without regenerating it', async () => {
    const p = profile();
    const fp = buildFingerprint({ ...p, fingerprintLaunchSeed: 'actual-launch', kernelVersion: '149.0.7827.114' });
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fp-start-page-'));
    let expected;
    const engine = {
      networkInfo: new Map([[p.id, { ip: '203.0.113.8' }]]),
      ensureStartPage: async () => ({ registerSession: (_profile, extras) => { expected = extras.expectedFingerprint; return 'http://127.0.0.1:50326/'; } }),
    };
    try {
      await startPage.buildStartPageUrl.call(engine, p, root, 'Chromium', 0, fp);
      assert.equal(expected.userAgent, fp.userAgent);
      assert.equal(expected.hardwareConcurrency, fp.hardwareConcurrency);
      assert.equal(expected.webglRenderer, fp.webgl.renderer);
    } finally { await fs.promises.rm(root, { recursive: true, force: true }); }
  });
  await test('the real randomize button generates fresh seeds on repeated clicks', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../ui/ui-editor.js'), 'utf8');
    const body = source.slice(source.indexOf('function randomizeFingerprintDraft()'), source.indexOf('\nconst profileEditorOpener'));
    const nodes = new Map();
    const $ = (selector) => { if (!nodes.has(selector)) nodes.set(selector, { value: '', dataset: {} }); return nodes.get(selector); };
    $('#editor-battery-charging').value = 'no';
    $('#editor-battery-level').value = '0.5';
    $('#editor-media-label-audio').value = 'Fixed microphone';
    const context = vm.createContext({ $, window: { crypto: crypto.webcrypto }, renderEditorSummary() {} });
    vm.runInContext(body, context);
    vm.runInContext('randomizeFingerprintDraft()', context);
    const first = $('#profile-editor-form').dataset.fingerprintSeed;
    vm.runInContext('randomizeFingerprintDraft()', context);
    assert.match(first, /^[a-f0-9]{32}$/);
    assert.notEqual(first, $('#profile-editor-form').dataset.fingerprintSeed);
    assert.equal($('#editor-device-profile').value, 'persona');
    assert.equal($('#editor-battery-charging').value, 'auto');
    assert.equal($('#editor-battery-level').value, '');
    assert.equal($('#editor-media-label-audio').value, '');
  });
  await test('real memory remains native after executing the complete injection', () => {
    const fp = buildFingerprint(profile({ privacy: { memory: 0, fontListMode: 'real' } }));
    const context = documentScope();
    vm.runInContext(buildInjectionScript(fp), context);
    assert.equal(fp.deviceMemory, null);
    assert.equal(vm.runInContext('navigator.deviceMemory', context), 4);
  });
  await test('fixed bridge token never exposes an object in the full script', () => {
    const context = documentScope();
    vm.runInContext(buildInjectionScript(buildFingerprint(profile())), context);
    assert.equal(vm.runInContext(`typeof Function.prototype.toString.call(Object.getOwnPropertyDescriptor(Navigator.prototype,'userAgent').get,'__UA_BRIDGE_TOKEN__')`, context), 'string');
  });
  await test('selected OS version preserves custom UA and Client Hints', () => {
    const p = profile({ osVersion: '11', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/149.0.0.0 CUSTOM', privacy: { fingerprint: { clientHints: { architecture: 'arm' } } } });
    const fp = buildFingerprint(p);
    assert.equal(fp.userAgent, p.userAgent);
    assert.equal(fp.userAgentMetadata.architecture, 'arm');
  });
  await test('UA generation uses the selected kernel and persists preview hints', () => {
    const engine = { profiles: new Map(), chooseBrowser: () => ({ version: '149.0.7827.114' }) };
    const generated = buildEditorUa(engine, { random: true, os: 'windows' });
    const saved = buildFingerprint(profile({ userAgent: generated.userAgent, privacy: { fingerprint: { clientHints: generated.clientHints } } }));
    assert.match(generated.userAgent, /Chrome\/149\.0\.0\.0/);
    assert.equal(generated.metadata.fullVersion, '149.0.7827.114');
    assert.equal(saved.userAgentMetadata.fullVersion, generated.metadata.fullVersion);
    assert.equal(buildFingerprint({ ...profile(), kernelVersion: '150.0.1234.56' }).userAgentMetadata.fullVersion, '150.0.1234.56');
    assert.equal(buildFingerprint({ ...profile(), os: 'Android', kernelVersion: '150.0.1234.56' }).userAgentMetadata.fullVersion, '150.0.1234.56');
  });
  await test('registration failures and script exceptions reject instead of passing', async () => {
    const fp = buildFingerprint(profile());
    await assert.rejects(applyFingerprintToTab(async (method) => {
      if (method === 'Page.addScriptToEvaluateOnNewDocument') throw new Error('registration rejected');
      return {};
    }, null, fp, profile(), { applyKey: 'reliability-registration' }), /registration rejected/);
    let registrations = 0;
    const failing = async (method) => {
      if (method === 'Page.addScriptToEvaluateOnNewDocument') { registrations += 1; return { identifier: 'registered' }; }
      if (method === 'Runtime.evaluate') return { exceptionDetails: { text: 'execution rejected' } };
      return {};
    };
    for (let i = 0; i < 2; i += 1) await assert.rejects(applyFingerprintToTab(failing, null, fp, profile(), { applyKey: 'reliability-execution' }), /execution rejected/);
    assert.equal(registrations, 1, 'retry must reuse the successful document-start registration');
  });
  await test('missing coordinates stay unset while valid zero coordinates work', async () => {
    const run = async (p, key) => {
      const geo = [];
      await applyFingerprintToTab(async (method, params) => {
        if (method === 'Emulation.setGeolocationOverride') geo.push(params);
        return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: key } : {};
      }, null, buildFingerprint(p), p, { applyKey: key });
      return geo;
    };
    assert.deepEqual(await run(profile(), 'missing-geo'), []);
    assert.equal(buildFingerprint(profile()).geoPermission, 'denied', 'missing exit coordinates must not grant access to host geolocation');
    assert.equal((await run(profile({ exitLatitude: 0, exitLongitude: 0 }), 'zero-geo'))[0].latitude, 0);
  });
  await test('empty or failed probes block, including automatic hardware mismatches', () => {
    for (const live of [null, undefined, { probeError: 'unavailable' }, {}]) {
      assert.equal(evaluateFingerprintDelivery(profile(), buildFingerprint(profile()), live, { strict: true }).ok, false);
    }
    const fp = buildFingerprint(profile());
    const result = evaluateFingerprintDelivery(profile(), fp, { userAgent: fp.userAgent, platform: fp.platform, hardwareConcurrency: 63, deviceMemory: fp.deviceMemory }, { strict: true });
    assert.ok(result.mismatches.some((m) => m.field === 'hardwareConcurrency'));
  });
  await test('initial insecure blank pages preserve native memory API gating', () => {
    const p = profile();
    const fp = buildFingerprint(p);
    const live = { userAgent: fp.userAgent, platform: fp.platform, hardwareConcurrency: fp.hardwareConcurrency,
      screenWidth: fp.screen.width, screenHeight: fp.screen.height, devicePixelRatio: fp.screen.devicePixelRatio,
      deviceMemoryPresent: false, secureContext: false, vendor: fp.vendor, timezone: fp.timezone, languages: fp.languages };
    assert.equal(evaluateFingerprintDelivery(p, fp, live, { strict: true }).ok, true);
    live.secureContext = true;
    assert.ok(evaluateFingerprintDelivery(p, fp, live, { strict: true }).mismatches.some((m) => m.field === 'deviceMemory'));
  });
  await test('CLI never opens target URLs or restores sessions before the barrier', () => {
    for (const restoreSession of [true, false]) {
      const { args } = completeLaunchArguments([], { profile: profile(), restoreSession, startUrl: 'https://first.test', customStartUrls: ['https://first.test', 'https://second.test'] });
      assert.ok(args.includes('about:blank'));
      assert.ok(!args.some((arg) => arg.includes('https://') || arg === '--restore-last-session'));
    }
  });
  await test('deferred session snapshots preserve URLs and archive legacy session bytes', async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fp-session-'));
    try {
      const item = { root, engine: 'firefox', fingerprint: {}, bidiConnection: { command: async () => ({ contexts: [{ url: 'https://one.test/' }, { url: 'https://one.test/' }, { url: 'https://internal.test/' }] }) } };
      await saveDeferredSession(item, (url) => url.includes('internal.test'));
      assert.deepEqual(await readDeferredSessionUrls(root), ['https://one.test/']);
      item.bidiConnection.command = async () => { throw new Error('browser closed'); };
      await saveDeferredSession(item);
      assert.deepEqual(await readDeferredSessionUrls(root), ['https://one.test/']);
      await fs.promises.mkdir(path.join(root, 'Default/Sessions'), { recursive: true });
      const legacy = path.join(root, 'Default/Sessions/Tabs_1');
      await fs.promises.writeFile(legacy, 'original session');
      const backup = await preserveLegacySession(root);
      await fs.promises.writeFile(legacy, 'new session');
      assert.equal(await preserveLegacySession(root), null);
      assert.equal(await fs.promises.readFile(path.join(backup, 'Default/Sessions/Tabs_1'), 'utf8'), 'original session');
      assert.equal(startupNavigationUrl('example.com'), 'https://example.com/');
      assert.equal(startupNavigationUrl('javascript:alert(1)'), null);
    } finally { await fs.promises.rm(root, { recursive: true, force: true }); }
  });
  await test('additional startup URLs wait for their target injection', async () => {
    const previousTabs = cdp.tabs;
    const previousCall = cdp.call;
    const calls = [];
    const item = { port: 1234, fpAppliedTargets: new Set() };
    item.workerFingerprintConnection = { command: async () => {
      setTimeout(() => item.fpAppliedTargets.add('extra'), 30);
      return { targetId: 'extra' };
    } };
    cdp.tabs = async () => [{ id: 'extra', webSocketDebuggerUrl: 'ws://127.0.0.1:1234/extra' }];
    cdp.call = async (_url, _method, params) => { assert.ok(item.fpAppliedTargets.has('extra')); calls.push(params.url); return {}; };
    try {
      await openVerifiedStartupTabs({ keepDefaultTab: async (_port, url) => { calls.push(url); } }, item, ['https://one.test', 'https://two.test']);
      assert.deepEqual(calls, ['https://one.test/', 'https://two.test/']);
    } finally { cdp.tabs = previousTabs; cdp.call = previousCall; }
  });
  const firefoxProfile = profile({ engine: 'firefox', privacy: { fontListMode: 'real', timezoneMode: 'custom', timezone: 'Asia/Shanghai' } });
  const firefox = buildFirefoxFingerprint(firefoxProfile, '145.0.1');
  await test('Firefox preserves Gecko UA and native absent APIs', () => {
    assert.match(firefox.userAgent, /Gecko\/20100101 Firefox\/145\.0$/);
    assert.equal(firefox.vendor, '');
    assert.equal(firefox.userAgentMetadata, null);
    assert.equal(firefox.deviceMemory, null);
    const context = documentScope();
    vm.runInContext('delete Navigator.prototype.deviceMemory', context);
    vm.runInContext(buildInjectionScript(firefox), context);
    assert.equal(vm.runInContext("'deviceMemory' in navigator", context), false);
    assert.equal(vm.runInContext("'chrome' in globalThis", context), false);
    assert.equal(vm.runInContext('navigator.vendor', context), '');
  });
  await test('Firefox initialization registers main-world preload before navigation', async () => {
    const calls = [];
    const connection = { command: async (method, params) => {
      calls.push({ method, params });
      if (method === 'script.addPreloadScript') return { script: 'preload' };
      if (method === 'browsingContext.getTree') return { contexts: [{ context: 'initial', url: 'about:blank' }] };
      if (method === 'script.evaluate') return { type: 'success', result: params.expression.includes('webglVendor: webglVendor')
        ? remote({ platform: firefox.platform, userAgent: firefox.userAgent, hardwareConcurrency: firefox.hardwareConcurrency, languages: firefox.languages, timezone: firefox.timezone, vendor: '', screenWidth: firefox.screen.width, screenHeight: firefox.screen.height, devicePixelRatio: firefox.screen.devicePixelRatio }) : { type: 'undefined' } };
      if (method === 'browsingContext.create') return { context: 'second' };
      return {};
    } };
    const initialized = await initializeFirefoxFingerprint(connection, firefox, firefoxProfile);
    assert.equal(initialized.capabilities.workerFingerprintDelivery, false);
    const preload = calls.find((call) => call.method === 'script.addPreloadScript');
    assert.equal(preload.params.sandbox, undefined);
    assert.equal(calls.filter((call) => call.method === 'browsingContext.navigate').length, 0);
    await navigateFirefoxStartup(connection, initialized.context, ['https://one.test', 'https://two.test']);
    assert.equal(calls.filter((call) => call.method === 'browsingContext.navigate').length, 2);
    assert.ok(calls.findIndex((call) => call.method === 'script.evaluate') < calls.findIndex((call) => call.method === 'browsingContext.navigate'));
    await assert.rejects(initializeFirefoxFingerprint({ command: async (method) => {
      if (method === 'browsingContext.getTree') return { contexts: [{ context: 'initial' }] };
      if (method === 'script.addPreloadScript') throw new Error('preload failed');
      return {};
    } }, firefox, firefoxProfile), /preload failed/);
    await assert.rejects(evaluateBidi({ command: async () => ({ type: 'exception', exceptionDetails: { text: 'bad script' } }) }, { context: 'initial' }, 'bad'), /bad script/);
  });
  await test('BiDi transport bounds requests and rejects pending commands on disconnect', async () => {
    class Socket extends EventTarget {
      constructor() { super(); this.readyState = 0; queueMicrotask(() => { this.readyState = 1; this.dispatchEvent(new Event('open')); }); }
      send(text) { const message = JSON.parse(text); if (message.method === 'hang') return; queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'success', id: message.id, result: { echo: message.params } }) }))); }
      close() { this.readyState = 3; this.dispatchEvent(new Event('close')); }
    }
    const connection = await new BidiConnection('ws://127.0.0.1:12345', { socketFactory: () => new Socket() }).open();
    assert.deepEqual(await connection.command('echo', { value: 7 }), { echo: { value: 7 } });
    const pending = connection.command('hang');
    connection.close();
    await assert.rejects(pending, /closed/);
    assert.equal(connection.pending.size, 0);
    assert.throws(() => localBidiEndpoint('ws://example.com:1234/session'), /loopback/);
    assert.deepEqual(deserializeRemoteValue(remote({ list: [1, null, 'ok'] })), { list: [1, null, 'ok'] });
  });
  console.log(`fingerprint-reliability-selftest: OK ${count}/${count}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
