'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { EventEmitter } = require('node:events');
const cdp = require('../../cdp');
const runtime = require('../../engine/runtime-settings');
const injection = require('../../engine/fingerprint-injection');
const lifecycle = require('../../engine/lifecycle-cleanup');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../fingerprint');
const { RequestHeaderRewriter, evaluateFingerprintDelivery, normalizePlatformFamily, detectUaPlatform, normalizeTimezone } = require('../request-header-rewriter');
const { LIVE_PROBE_EXPRESSION } = require('../fingerprint-debug-log');
const { BidiConnection } = require('../../network/bidi-connection');

const profile = sanitizeProfile({ id: 'delivery-boundaries', name: 'delivery-boundaries', os: 'Windows', privacy: { fontListMode: 'real', timezoneMode: 'custom', timezone: 'Asia/Shanghai' } });
const fp = buildFingerprint(profile);
const liveFor = () => ({
  userAgent: fp.userAgent, platform: fp.platform, vendor: fp.vendor,
  languages: fp.languages, timezone: fp.timezone, hardwareConcurrency: fp.hardwareConcurrency,
  deviceMemory: fp.deviceMemory, screenWidth: fp.screen.width, screenHeight: fp.screen.height,
  devicePixelRatio: fp.screen.devicePixelRatio, webglVendor: fp.webgl.vendor,
  webglRenderer: fp.webgl.renderer, webglUnmasked: true,
});
const paused = (sessionId = 's1', headers = {}, extra = {}) => ({
  method: 'Fetch.requestPaused', sessionId,
  params: { requestId: 'same-id', request: { url: 'https://example.test/', headers, ...extra } },
});
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const turn = () => new Promise((resolve) => setImmediate(resolve));
let count = 0;
async function test(name, fn) { await fn(); console.log('PASS ' + name); count += 1; }

async function workerHarness(type, behavior = {}) {
  const saved = { connect: cdp.connect, browserSocket: cdp.browserSocket, targets: cdp.targets };
  const commands = [];
  let onEvent;
  const item = { port: 12345, profile: behavior.profile || profile, fingerprint: fp };
  const engine = {
    emit() {}, networkInfo: new Map(),
    applyFingerprintToSession: async () => {},
    handleBrowserGone: async () => { engine.stopped = true; },
  };
  const targetInfo = { targetId: 'target', type, url: 'https://example.test/worker.js' };
  const event = { method: 'Target.attachedToTarget', params: { sessionId: 'worker-session', targetInfo, waitingForDebugger: true } };
  const connection = {
    close() {},
    async command(method, params, options = {}) {
      commands.push({ method, params, options });
      if (method === 'Target.getTargets') {
        if (behavior.discoveryFailure) throw new Error('target discovery failed');
        return { targetInfos: [targetInfo] };
      }
      if (method === 'Target.setAutoAttach' && !options.sessionId) queueMicrotask(() => onEvent(event, connection));
      if (method === 'Fetch.enable' && behavior.fetch) return behavior.fetch(item);
      if (method === 'Runtime.evaluate' && behavior.evaluate) return behavior.evaluate(params);
      if (method === 'Target.closeTarget') return { success: behavior.canClose !== false };
      return {};
    },
  };
  cdp.browserSocket = async () => 'ws://127.0.0.1:12345/devtools/browser/test';
  cdp.targets = async () => { throw new Error('target fallback failed'); };
  cdp.connect = async (_url, options) => { onEvent = options.onEvent; return connection; };
  const startup = injection.startWorkerFingerprintInjection.call(engine, item, fp);
  startup.catch(() => {});
  return { item, engine, commands, startup, dispatch: (event) => onEvent(event, connection), duplicate: () => onEvent(event, connection), cleanup() { Object.assign(cdp, saved); item.workerFingerprintConnection?.close(); } };
}

async function startupHarness(fault) {
  // Exercise the actual startup routine with process/protocol boundaries replaced.
  // No executable is launched and exit-network discovery never leaves this fixture.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-start-boundary-'));
  const child = Object.assign(new EventEmitter(), { pid: 999999, exitCode: null, stdout: new EventEmitter(), stderr: new EventEmitter() });
  child.stdout.setEncoding = child.stderr.setEncoding = () => {};
  child.kill = () => { child.killed = true; };
  const connection = { close() {} };
  let spawns = 0;
  const actualRequire = Module.createRequire(require.resolve('../../engine/start'));
  const replacements = {
    child_process: { spawn: () => { spawns += 1; return child; } },
    '../automation/browser-kernel': { ensureKernelReadyForLaunch: async () => {} },
    '../automation/env-icon': { normalizeEnvNumber: () => '1', prepareMarkerExtension: async () => null },
    '../automation/isolation': { validateProfileRootSecure: async () => ({ ok: true }), acquireProfileLock: async () => ({}), updateProfileLock: async () => ({}) },
    '../extension-pipe': { portConnection: async () => connection, reconcileOnConnection: async () => ({ installed: [], extensions: [] }) },
    './resource-gate': { assertResourceGateForLaunch: async () => {} },
    './startup-session': { openVerifiedStartupTabs: async (engine) => { engine.navigations += 1; } },
  };
  const filename = require.resolve('../../engine/start');
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.require = (name) => replacements[name] || actualRequire(name);
  compiled._compile(fs.readFileSync(filename, 'utf8'), filename);
  const p = sanitizeProfile({ ...profile, advanced: { showInfoPage: false } });
  if (fault === 'config') { p.os = 'Linux'; p.userAgent = fp.userAgent; }
  if (fault === 'url-config') p.advanced.allowUrls = '*';
  const engine = {
    profiles: new Map(), running: new Map(), extensions: new Map(), networkInfo: new Map(),
    app: { getPath: () => root }, navigations: 0, watches: 0, attempts: 0,
    sanitizeProfile, resolveStoredProxyProfile: (value) => value, prepareProfileProxyForStart: async (value) => value,
    assertStartGenerationActive() {}, assertProxyConcurrencyAvailable() {}, emit() {}, emitStartProgress() {},
    profileRoot: () => root, applyResolvedLocale: (value) => value,
    ensureExitNetworkForLocale: async () => null, persist: async () => {}, assignedExtensions: () => [],
    kernelStatus: () => ({ installed: true }), chooseBrowser: () => ({ name: 'fixture', path: '/fixture/chromium', version: '149.0.0.0' }),
    prepareProfileFilesForStart: async () => {}, resolveStartupUrls: () => ['https://example.test/'], proxyConfig: () => null,
    waitForPort: async () => 12345, startNativeProfileMarker: () => null, suppressStartupExtensionPages: async () => {},
    applyRuntimeSettings: async () => { engine.attempts += 1; if (fault === 'inject') throw new Error('fixture inject failed'); return fp; },
    startWorkerFingerprintInjection: async () => {},
    verifyStartupFingerprintDelivery: async () => { if (fault === 'probe') throw new Error('fixture probe failed'); return fault === 'verify' ? { ok: false, mismatches: [{ message: 'fixture mismatch' }] } : { ok: true }; },
    ensureStartPageFingerprint: async () => {}, applyEnvWindowTitle: async () => {},
    cleanupStartupResources: async () => { engine.startupCleanups = (engine.startupCleanups || 0) + 1; return {}; },
    publicRunning: () => ({ running: engine.running.has(p.id) }), startRunningWatch: () => { engine.watches += 1; },
    async handleBrowserGone(id, item, _reason, options) { assert.equal(options.kill, true); item.stopping = true; child.kill(); engine.running.delete(id); },
  };
  try {
    if (fault === 'config' || fault === 'url-config') {
      await assert.rejects(compiled.exports._start.call(engine, p), fault === 'config' ? /指纹配置不一致/ : /无效网站规则/);
      assert.equal(spawns, 0); assert.equal(engine.navigations, 0); assert.equal(engine.running.size, 0);
      assert.equal(engine.startupCleanups || 0, fault === 'config' ? 1 : 0);
    } else if (fault) {
      await assert.rejects(compiled.exports._start.call(engine, p), /fixture/);
      assert.equal(engine.navigations, 0); assert.equal(child.killed, true);
      assert.equal(engine.running.size, 0); assert.equal(engine.watches, 0);
      if (fault === 'inject') assert.equal(engine.attempts, 3);
    } else {
      assert.equal((await compiled.exports._start.call(engine, p)).running, true);
      assert.equal(engine.navigations, 1); assert.equal(engine.watches, 1);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

(async () => {
  await test('duplicate pauses share one sanitized continuation; session IDs stay independent', async () => {
    const gate = deferred(); const commands = [];
    const connection = { command(method, params) { commands.push({ method, params }); return gate.promise; } };
    const rewriter = new RequestHeaderRewriter({ profile, fingerprint: fp });
    const first = rewriter.handleEvent(paused(), connection);
    assert.equal(rewriter.handleEvent(paused(), connection), first);
    const other = rewriter.handleEvent(paused('s2'), connection);
    await turn();
    assert.equal(commands.length, 2);
    assert.equal(rewriter.inFlight.size, 2);
    assert.ok(commands.every((call) => call.params.headers.some((header) => header.name === 'User-Agent' && header.value === fp.userAgent)));
    gate.resolve({}); await Promise.all([first, other]);
    assert.equal(rewriter.inFlight.size, 0);
  });
  await test('rejected header overrides block requests without retrying raw headers', async () => {
    const commands = [];
    const rewriter = new RequestHeaderRewriter({ profile, fingerprint: fp });
    await rewriter.handleEvent(paused(), { async command(method, params) {
      commands.push({ method, params });
      if (method === 'Fetch.continueRequest') throw new Error('Invalid header');
      return {};
    } });
    assert.deepEqual(commands.map((call) => call.method), ['Fetch.continueRequest', 'Fetch.failRequest']);
    assert.equal(commands[1].params.errorReason, 'BlockedByClient');
    assert.equal(rewriter.operations.size, 0);
  });
  await test('hung continuations are bounded and failed blocking escalates to the host', async () => {
    const commands = []; let fatal = 0;
    const rewriter = new RequestHeaderRewriter({ profile, fingerprint: fp, commandTimeout: 15, onFatalError() { fatal += 1; } });
    const keepAlive = setInterval(() => {}, 1000);
    try {
      await rewriter.handleEvent(paused(), { command(method) { commands.push(method); return new Promise(() => {}); } });
      assert.deepEqual(commands, ['Fetch.continueRequest', 'Fetch.failRequest']);
      assert.equal(fatal, 1); assert.equal(rewriter.inFlight.size, 0);
    } finally { clearInterval(keepAlive); rewriter.destroy(); }
  });
  await test('detaching a session cancels pending work without late protocol commands', async () => {
    const commands = [];
    const rewriter = new RequestHeaderRewriter({ profile, fingerprint: fp });
    const pending = rewriter.handleEvent(paused(), { command(method) { commands.push(method); return new Promise(() => {}); } });
    await turn(); rewriter.cleanupSession('s1'); await pending;
    assert.deepEqual(commands, ['Fetch.continueRequest']);
    assert.equal(rewriter.operations.size, 0);
  });
  await test('Client Hints retain native eligibility on insecure requests and preflights', async () => {
    const rewriter = new RequestHeaderRewriter({ profile, fingerprint: fp });
    for (const request of [{ url: 'http://example.test/' }, { method: 'OPTIONS' }]) {
      let headers;
      await rewriter.handleEvent(paused('s1', {}, request), { async command(_method, params) { headers = params.headers; return {}; } });
      assert.ok(!headers.some((header) => header.name.startsWith('sec-ch-ua')));
    }
    let headers;
    await rewriter.handleEvent(paused('s1', { 'Sec-CH-UA': 'host', 'Sec-CH-UA-Platform': 'host' }), { async command(_method, params) { headers = params.headers; return {}; } });
    assert.ok(headers.some((header) => header.name === 'sec-ch-ua-platform' && header.value === '"Windows"'));
  });
  await test('strict delivery rejects missing timezone/languages and same-brand GPU mismatches', () => {
    assert.equal(evaluateFingerprintDelivery(profile, fp, liveFor(), { strict: true }).ok, true);
    for (const patch of [{ timezone: '' }, { languages: [] }, { platform: 'Win64' }, { webglRenderer: fp.webgl.renderer + ' WRONG' }]) {
      assert.equal(evaluateFingerprintDelivery(profile, fp, { ...liveFor(), ...patch }, { strict: true }).ok, false);
    }
    assert.equal(evaluateFingerprintDelivery(profile, fp, { ...liveFor(), webglUnmasked: false, webglRenderer: 'WebKit WebGL', webglVendor: 'WebKit' }, { strict: true }).ok, true);
  });
  await test('platform classification and timezone aliases avoid false delivery failures', () => {
    assert.equal(normalizePlatformFamily('Darwin'), 'macos');
    assert.equal(detectUaPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');
    assert.equal(normalizeTimezone('US/Pacific'), normalizeTimezone('America/Los_Angeles'));
    assert.equal(normalizeTimezone('Etc/UTC'), normalizeTimezone('UTC'));
  });
  await test('runtime bookkeeping requires a valid live probe and can recheck without reinjection', async () => {
    const saved = { call: cdp.call, tabs: cdp.tabs };
    const tab = { id: 'probe-target', url: 'about:blank', webSocketDebuggerUrl: 'ws://127.0.0.1:12345/devtools/page/abcd1234' };
    let live = liveFor(); let registrations = 0; let probes = 0;
    cdp.tabs = async () => [tab];
    cdp.call = async (_url, method, params) => {
      if (method === 'Page.addScriptToEvaluateOnNewDocument') { registrations += 1; return { identifier: 'script' }; }
      if (method === 'Runtime.evaluate' && params.expression === LIVE_PROBE_EXPRESSION) { probes += 1; return { result: { value: live } }; }
      return {};
    };
    const applied = new Set(); const trackOn = {};
    const run = (extra = {}) => runtime.applyRuntimeSettings.call({ networkInfo: new Map() }, 12345, profile, fp, { appliedTargetIds: applied, trackOn, ...extra });
    try {
      await run(); assert.equal(applied.has(tab.id), true);
      await run({ verifyApplied: true }); assert.equal(probes, 2); assert.equal(registrations, 1);
      live = null;
      await assert.rejects(run({ verifyApplied: true }), /指纹交付校验失败/);
      assert.equal(applied.has(tab.id), false);
      live = { ...liveFor(), hardwareConcurrency: 99 };
      await assert.rejects(run(), /核心数/);
      cdp.tabs = async () => [];
      await assert.rejects(run({ phase: 'pre-startpage' }), /No page target/);
    } finally { Object.assign(cdp, saved); }
  });
  for (const type of ['worker', 'shared_worker', 'service_worker']) {
    await test(`${type} startup waits for network setup and evaluation before resume`, async () => {
      const gate = deferred(); const harness = await workerHarness(type, { evaluate: () => gate.promise });
      try {
        let completed = false; harness.startup.then(() => { completed = true; });
        await turn(); assert.equal(completed, false);
        assert.ok(harness.commands.some((call) => call.method === 'Fetch.enable'));
        assert.ok(!harness.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'));
        gate.resolve({}); await harness.startup;
        await harness.duplicate();
        assert.equal(harness.commands.filter((call) => call.method === 'Runtime.evaluate').length, 1);
        assert.equal(harness.commands.at(-1).method, 'Runtime.runIfWaitingForDebugger');
      } finally { harness.cleanup(); }
    });
  }
  await test('worker exceptions close targets; failed closure stops the browser', async () => {
    const harness = await workerHarness('service_worker', { evaluate: () => ({ exceptionDetails: { text: 'worker script failed' } }), canClose: false });
    try {
      await assert.rejects(harness.startup, /worker script failed/);
      assert.equal(harness.engine.stopped, true);
      assert.ok(!harness.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'));
    } finally { harness.cleanup(); }
  });
  for (const type of ['worker', 'shared_worker', 'service_worker']) {
    await test(`${type} port protection completes before resume and detaches cleanly`, async () => {
      const harness = await workerHarness(type, { profile: { ...profile, privacy: { ...profile.privacy, portScanProtect: true } } });
      try {
        await harness.startup;
        const policyIndex = harness.commands.findIndex((call) => call.method === 'Runtime.evaluate' && call.params.expression.includes('const initial ='));
        const resumeIndex = harness.commands.findIndex((call) => call.method === 'Runtime.runIfWaitingForDebugger');
        assert.ok(policyIndex >= 0 && policyIndex < resumeIndex);
        assert.equal(harness.item.fingerprintTargetSessions.get('worker-session').type, type);
        await harness.dispatch({ method: 'Target.detachedFromTarget', params: { sessionId: 'worker-session', targetId: 'target' } });
        assert.equal(harness.item.fingerprintTargetSessions.size, 0);
        await harness.dispatch({ method: 'Target.attachedToTarget', params: { sessionId: 'reattached-session', waitingForDebugger: true,
          targetInfo: { targetId: 'target', type, url: 'https://example.test/worker.js' } } });
        assert.equal(harness.item.fingerprintTargetSessions.get('reattached-session').type, type);
        assert.equal(harness.commands.filter((call) => call.method === 'Runtime.evaluate' && call.params.expression.includes('const initial =')).length, 2, 'reattaching must reapply the policy in the new session');
      } finally { harness.cleanup(); }
    });
  }
  await test('failed worker port policy blocks debugger resume', async () => {
    const harness = await workerHarness('worker', {
      profile: { ...profile, privacy: { ...profile.privacy, portScanProtect: true } },
      evaluate: (params) => params.expression.includes('const initial =') ? { exceptionDetails: { text: 'port policy failed' } } : {},
    });
    try {
      await assert.rejects(harness.startup, /port policy failed/);
      assert.equal(harness.item.fingerprintTargetSessions.size, 0);
      assert.equal(harness.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), false);
    } finally { harness.cleanup(); }
  });
  for (const type of ['page', 'iframe', 'worker', 'shared_worker', 'service_worker']) {
    await test(`${type} shares access policy with headers before Fetch readiness and debugger resume`, async () => {
      const gate = deferred();
      const restricted = { ...profile, advanced: { ...profile.advanced, allowUrls: 'allowed.test' } };
      const harness = await workerHarness(type, { profile: restricted, fetch: () => gate.promise });
      try {
        await turn();
        assert.ok(harness.commands.some((call) => call.method === 'Fetch.enable'));
        assert.equal(harness.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), false);
        harness.dispatch({ method: 'Fetch.requestPaused', sessionId: 'worker-session', params: {
          requestId: 'access-denied', resourceType: 'Fetch', request: { url: 'https://blocked.test/', method: 'GET', headers: {} },
        } });
        await turn();
        assert.ok(harness.commands.some((call) => call.method === 'Fetch.failRequest' && call.params.requestId === 'access-denied'));
        assert.equal(harness.commands.some((call) => call.method === 'Fetch.continueRequest' && call.params.requestId === 'access-denied'), false);
        gate.resolve({});
        await harness.startup;
        harness.engine.profiles = new Map([[profile.id, { ...restricted, advanced: { ...restricted.advanced, allowUrls: 'next.test' } }]]);
        harness.dispatch({ method: 'Fetch.requestPaused', sessionId: 'worker-session', params: {
          requestId: 'changed-policy', resourceType: 'Fetch', request: { url: 'https://allowed.test/', method: 'GET', headers: {} },
        } });
        await turn();
        assert.ok(harness.commands.some((call) => call.method === 'Fetch.failRequest' && call.params.requestId === 'changed-policy'), 'saved edits apply before a watcher sweep');
      } finally { gate.resolve({}); harness.cleanup(); }
    });
  }
  await test('access policy exempts only the actual managed start-page server', async () => {
    const harness = await workerHarness('page', { profile: { ...profile, advanced: { ...profile.advanced, allowUrls: 'allowed.test' } } });
    try {
      harness.engine.startPageServer = { server: {}, isStartPageUrl: (value) => new URL(value).origin === 'http://127.0.0.1:50326' };
      await harness.startup;
      for (const [requestId, url] of [['internal', 'http://127.0.0.1:50326/api/session'], ['different-port', 'http://127.0.0.1:50327/'], ['external-name', 'https://evil.test/openbrowser-start.html']]) {
        harness.dispatch({ method: 'Fetch.requestPaused', sessionId: 'worker-session', params: {
          requestId, resourceType: 'Fetch', request: { url, method: 'GET', headers: {} },
        } });
        await turn();
        assert.ok(harness.commands.some((call) => call.params.requestId === requestId && call.method === (requestId === 'internal' ? 'Fetch.continueRequest' : 'Fetch.failRequest')));
      }
      harness.engine.startPageServer.server = null;
      harness.dispatch({ method: 'Fetch.requestPaused', sessionId: 'worker-session', params: {
        requestId: 'stopped-server', resourceType: 'Fetch', request: { url: 'http://127.0.0.1:50326/', method: 'GET', headers: {} },
      } });
      await turn();
      assert.ok(harness.commands.some((call) => call.params.requestId === 'stopped-server' && call.method === 'Fetch.failRequest'));
    } finally { harness.cleanup(); }
  });
  await test('worker request interception failures never resume an unconfigured target', async () => {
    const harness = await workerHarness('worker', { fetch() { throw new Error('Fetch unavailable'); } });
    try {
      await assert.rejects(harness.startup, /Fetch unavailable/);
      assert.ok(harness.commands.some((call) => call.method === 'Target.closeTarget'));
      assert.ok(!harness.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'));
    } finally { harness.cleanup(); }
  });
  await test('failed target discovery cannot resolve an empty startup barrier', async () => {
    const harness = await workerHarness('worker', { discoveryFailure: true });
    try { await assert.rejects(harness.startup, /target fallback failed/); }
    finally { harness.cleanup(); }
  });
  await test('failed responses are released by the response handler without request-stage rewriting', async () => {
    const harness = await workerHarness('worker');
    try {
      await harness.startup;
      const before = harness.commands.length;
      await harness.dispatch({ method: 'Fetch.requestPaused', sessionId: 'worker-session', params: {
        requestId: 'failed-response', responseErrorReason: 'ConnectionRefused', request: { url: 'https://example.test/' },
      } });
      await turn();
      const commands = harness.commands.slice(before);
      assert.equal(commands.length, 1);
      assert.equal(commands[0].method, 'Fetch.continueRequest');
      assert.equal(commands[0].params.headers, undefined);
    } finally { harness.cleanup(); }
  });
  await test('page readiness is published only after Fetch setup and debugger resume', async () => {
    const gate = deferred(); const harness = await workerHarness('page', { fetch: (item) => { assert.ok(!item.fpAppliedTargets?.has('target')); return gate.promise; } });
    try {
      await turn(); assert.ok(!harness.item.fpAppliedTargets?.has('target'));
      gate.resolve({}); await harness.startup;
      assert.equal(harness.item.fpAppliedTargets.has('target'), true);
      assert.equal(harness.commands.at(-1).method, 'Runtime.runIfWaitingForDebugger');
    } finally { harness.cleanup(); }
  });
  await test('Firefox watcher stays on BiDi and never invokes the Chromium injection pass', async () => {
    const savedTimeout = global.setTimeout;
    let tick; let applies = 0;
    global.setTimeout = (fn) => { tick = fn; return 1; };
    const item = { profile, fingerprint: fp, engine: 'firefox', bidiConnection: { command: async () => ({ contexts: [{ url: 'about:blank' }] }) } };
    const engine = { running: new Map([[profile.id, item]]), applyRuntimeSettings() { applies += 1; }, emit() {} };
    try { lifecycle.startRunningWatch.call(engine, item); await tick(); assert.equal(applies, 0); }
    finally { global.setTimeout = savedTimeout; }
  });
  await test('BiDi repeated opens share one socket and constructor failures close transport state', async () => {
    let sockets = 0;
    class Socket extends EventTarget { constructor() { super(); queueMicrotask(() => this.dispatchEvent(new Event('open'))); } close() {} }
    const connection = new BidiConnection('ws://127.0.0.1:12345', { socketFactory() { sockets += 1; return new Socket(); } });
    await Promise.all([connection.open(), connection.open()]); assert.equal(sockets, 1); connection.close();
    const failed = new BidiConnection('ws://127.0.0.1:12345', { socketFactory() { throw new Error('factory failed'); } });
    await assert.rejects(failed.open(), /factory failed/); assert.equal(failed.closed, true);
  });
  for (const fault of ['inject', 'verify', 'probe']) {
    await test(`Chromium ${fault} failure rejects startup and kills its process without navigation`, () => startupHarness(fault));
  }
  await test('verified Chromium startup navigates and starts its watcher', () => startupHarness(null));
  await test('contradictory Chromium configuration is rejected before process spawn', () => startupHarness('config'));
  await test('invalid website rules are rejected before Chromium process spawn or resource acquisition', () => startupHarness('url-config'));
  console.log(`fingerprint-delivery-boundaries-selftest: OK ${count}/${count}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
