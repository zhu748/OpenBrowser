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
  const connection = { close() {},
    async command(method) {
      assert.equal(method, 'Browser.getVersion');
      return { product: fault === 'runtime-version' ? 'Chrome/150.0.0.0' : 'Chrome/149.0.0.0' };
    },
  };
  let spawns = 0, persistCalls = 0;
  const actualRequire = Module.createRequire(require.resolve('../../engine/start'));
  let spawnConfig, deliveredFingerprint;
  const replacements = {
    child_process: { spawn: (_binary, args, options) => { spawns += 1; spawnConfig = { args, options }; return child; } },
    '../automation/browser-kernel': { ensureKernelReadyForLaunch: async () => {} },
    '../automation/env-icon': { normalizeEnvNumber: () => '1', prepareMarkerExtension: async () => null },
    '../automation/isolation': { validateProfileRootSecure: async () => ({ ok: true }), acquireProfileLock: async () => ({}), updateProfileLock: async () => ({}) },
    './extension-pipe': { portConnection: async () => connection, reconcileOnConnection: async () => ({ installed: [], extensions: [] }) },
    './resource-gate': { assertResourceGateForLaunch: async () => {} },
    './startup-session': { openVerifiedStartupTabs: async (engine) => { engine.navigations += 1; } },
  };
  const filename = require.resolve('../../engine/start');
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.require = (name) => replacements[name] || actualRequire(name);
  compiled._compile(fs.readFileSync(filename, 'utf8'), filename);
  const p = sanitizeProfile({ ...profile, advanced: { showInfoPage: false } });
  if (!fault) p.privacy.customArgs = '--time-zone-for-testing=Asia/Tokyo --time-zone-for-testing=Europe/Paris';
  if (fault === 'config') { p.os = 'Linux'; p.userAgent = fp.userAgent; }
  if (fault === 'url-config') p.advanced.allowUrls = '*';
  const engine = {
    profiles: new Map(), running: new Map(), extensions: new Map(), networkInfo: new Map(),
    app: { getPath: () => root }, navigations: 0, watches: 0, attempts: 0,
    sanitizeProfile, resolveStoredProxyProfile: (value) => value, prepareProfileProxyForStart: async (value) => value,
    assertStartGenerationActive() {}, assertProxyConcurrencyAvailable() {}, emit() {}, emitStartProgress() {},
    profileRoot: () => root, applyResolvedLocale: (value) => value,
    ensureExitNetworkForLocale: async () => null, persist: async () => {
      persistCalls += 1;if (fault === 'seed' && persistCalls === 2) throw new Error('fixture seed disk failure');
    }, assignedExtensions: () => [],
    kernelStatus: () => ({ installed: true }), chooseBrowser: () => ({ name: 'fixture', path: '/fixture/chromium', version: '149.0.0.0' }),
    prepareProfileFilesForStart: async () => {}, resolveStartupUrls: () => ['https://example.test/'], proxyConfig: () => null,
    waitForPort: async () => 12345, startNativeProfileMarker: () => null, suppressStartupExtensionPages: async () => {},
    applyRuntimeSettings: async (_port, _profile, candidate) => {
      engine.attempts += 1;
      if (fault === 'inject') throw new Error('fixture inject failed');
      deliveredFingerprint = candidate;
      return candidate;
    },
    startWorkerFingerprintInjection: async () => {},
    verifyStartupFingerprintDelivery: async () => { if (fault === 'probe') throw new Error('fixture probe failed'); return fault === 'verify' ? { ok: false, mismatches: [{ message: 'fixture mismatch' }] } : { ok: true }; },
    ensureStartPageFingerprint: async () => {}, applyEnvWindowTitle: async () => {},
    cleanupStartupResources: async () => { engine.startupCleanups = (engine.startupCleanups || 0) + 1; return {}; },
    publicRunning: () => ({ running: engine.running.has(p.id) }), startRunningWatch: () => { engine.watches += 1; },
    async handleBrowserGone(id, item, _reason, options) { assert.equal(options.kill, true); item.stopping = true; child.kill(); engine.running.delete(id); },
  };
  try {
    if (fault === 'seed') {
      await assert.rejects(compiled.exports._start.call(engine, p), { code: 'FINGERPRINT_SEED_PERSIST_FAILED' });
      assert.equal(spawns, 0);assert.equal(engine.navigations, 0);assert.equal(engine.startupCleanups, 1);
    } else if (fault === 'runtime-version') {
      await assert.rejects(compiled.exports._start.call(engine, p), { code: 'KERNEL_VERSION_MISMATCH' });
      assert.equal(spawns, 1); assert.equal(engine.navigations, 0); assert.equal(engine.attempts, 0);
      assert.equal(engine.startupCleanups, 1);
    } else if (fault === 'config' || fault === 'url-config') {
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
      assert.deepEqual(spawnConfig.args.filter(arg => arg.startsWith('--time-zone-for-testing=')), ['--time-zone-for-testing=Europe/Paris']);
      if (process.platform !== 'win32') assert.equal(spawnConfig.options.env.TZ, 'Europe/Paris');
      assert.equal(deliveredFingerprint.timezone, 'Europe/Paris');
      assert.equal(deliveredFingerprint.dynamicConfig.timezone, 'Europe/Paris');
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
    assert.equal(evaluateFingerprintDelivery({ ...profile, os: 'Linux' }, fp, liveFor(), { strict: true }).ok, true,
      'effective OS takes precedence over the raw profile field');
    for (const patch of [{ timezone: '' }, { languages: [] }, { language: 'ja-JP' }, { platform: 'Win64' }, { webglRenderer: fp.webgl.renderer + ' WRONG' }]) {
      assert.equal(evaluateFingerprintDelivery(profile, fp, { ...liveFor(), ...patch }, { strict: true }).ok, false);
    }
    assert.equal(evaluateFingerprintDelivery(profile, fp, { ...liveFor(), webglUnmasked: false, webglRenderer: 'WebKit WebGL', webglVendor: 'WebKit' }, { strict: true }).ok, true);
  });
  await test('strict delivery verifies native DNT while accepting each engine’s inactive value', () => {
    const enabled = { ...fp, doNotTrack: '1' };
    const check = (expected, actual, dntMode = 'default') => evaluateFingerprintDelivery({
      ...profile, privacy: { ...profile.privacy, dntMode },
    }, expected, { ...liveFor(), doNotTrack: actual }, { strict: true });
    assert.equal(check(enabled, '1').ok, true);
    for (const inactive of [null, '0', 'unspecified', undefined]) {
      assert.equal(check(fp, inactive, 'off').ok, true);
      assert.ok(check(enabled, inactive).mismatches.some(({ field }) => field === 'doNotTrack'));
    }
    assert.ok(check(fp, '1', 'off').mismatches.some(({ field }) => field === 'doNotTrack'));
    assert.equal(check(fp, '1').ok, true, 'default preserves the native browser’s policy');
  });
  await test('strict probe checks configured blocking independently of WebGL pixel noise and raw profile settings', () => {
    const current = { ...fp, webgl: { ...fp.webgl, mode: 'blocked', metaMode: 'real' } };
    const verify = (expected, patch) => evaluateFingerprintDelivery(profile, expected, { ...liveFor(), ...patch }, { strict: true });
    assert.equal(verify(current, { webglContextPresent: true }).ok, false);
    assert.equal(verify(current, { webglContextPresent: false }).ok, true);
    const hideMetadata = { ...fp, webgl: { ...fp.webgl, mode: 'real', metaMode: 'blocked' } };
    assert.equal(verify(hideMetadata, { webglContextPresent: true }).ok, false);
    assert.equal(verify(hideMetadata, { webglContextPresent: true, webglUnmasked: false }).ok, true);
    const retainNoise = { ...fp, webgl: { ...fp.webgl, mode: 'real', metaMode: 'noise' } };
    assert.equal(verify(retainNoise, { webglRenderer: fp.webgl.renderer + ' WRONG', webglContextPresent: true }).ok, false);
    const unavailable = verify(retainNoise, { webglContextPresent: false, webglUnmasked: false, webglVendor: null, webglRenderer: null });
    assert.equal(unavailable.ok, true);
    assert.ok(unavailable.warnings.some(warning => warning.includes('WebGL')));
  });
  await test('strict WebGL verification checks both API versions', () => {
    const webgl1 = { webglContextPresent: true, webglUnmasked: true, webglRenderer: fp.webgl.renderer, webglVendor: fp.webgl.vendor };
    const webgl2 = { ...webgl1, webglRenderer: 'Different WebGL2 renderer' };
    const check = (fingerprint, primary, secondary) => evaluateFingerprintDelivery(profile, fingerprint, {
      ...liveFor(), ...primary, webglContexts: { webgl: primary, webgl2: secondary },
    }, { strict: true });
    assert.ok(check(fp, webgl1, webgl2).mismatches.some(({ field }) => field === 'webgl2.webglRenderer'));
    const hidden = { ...fp, webgl: { ...fp.webgl, metaMode: 'blocked' } };
    assert.ok(check(hidden, { ...webgl1, webglUnmasked: false }, webgl2).mismatches.some(({ field }) => field === 'webglUnmasked'));
    const blocked = { ...fp, webgl: { ...fp.webgl, mode: 'blocked' } };
    assert.ok(check(blocked, { webglContextPresent: false }, webgl2).mismatches.some(({ field }) => field === 'webglContext'));
  });
  await test('platform classification and timezone aliases avoid false delivery failures', () => {
    assert.equal(normalizePlatformFamily('Darwin'), 'macos');
    assert.equal(detectUaPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');
    assert.equal(normalizeTimezone('US/Pacific'), normalizeTimezone('America/Los_Angeles'));
    assert.equal(normalizeTimezone('Etc/UTC'), normalizeTimezone('UTC'));
  });
  await test('timezone delivery verifies the effective launch value and ignores invalid stored values', () => {
    const invalid = { ...profile, exitTimezone: 'Not/AZone', privacy: {
      ...profile.privacy, timezone: 'Invalid/Zone',
    } };
    const invalidFp = buildFingerprint(invalid);
    assert.equal(invalidFp.timezone, null);
    assert.equal(evaluateFingerprintDelivery(invalid, invalidFp, liveFor(), { strict: true }).ok, true);
    assert.equal(buildFingerprint({ ...invalid, exitTimezone: 'Europe/Paris' }).timezone, 'Europe/Paris');
    const real = { ...profile, privacy: { ...profile.privacy, timezoneMode: 'real' } };
    const explicit = buildFingerprint(real, { timezone: 'Europe/Paris' });
    assert.ok(evaluateFingerprintDelivery(real, explicit, liveFor(), { strict: true }).mismatches
      .some(({ field }) => field === 'timezone'));
    assert.equal(evaluateFingerprintDelivery(real, explicit, { ...liveFor(), timezone: explicit.timezone }, { strict: true }).ok, true);
  });
  await test('runtime bookkeeping requires a valid live probe and can recheck without reinjection', async () => {
    const saved = { call: cdp.call, tabs: cdp.tabs, connect: cdp.connect };
    const tab = { id: 'probe-target', url: 'about:blank', webSocketDebuggerUrl: 'ws://127.0.0.1:12345/devtools/page/abcd1234' };
    let live = liveFor(); let registrations = 0; let probes = 0; let installCheck = false;
    cdp.tabs = async () => [tab];
    cdp.call = async (_url, method, params) => {
      if (method === 'Page.addScriptToEvaluateOnNewDocument') { registrations += 1; return { identifier: 'script' }; }
      if (method === 'Runtime.evaluate' && params.expression.includes(LIVE_PROBE_EXPRESSION)) {
        probes += 1;
        installCheck = params.expression.includes("'documentInstalled'");
        return { result: { value: live } };
      }
      return {};
    };
    cdp.connect = async (url) => ({ command: (method, params) => cdp.call(url, method, params), close() {} });
    const applied = new Set(); const trackOn = {};
    const run = (extra = {}) => runtime.applyRuntimeSettings.call({ networkInfo: new Map() }, 12345, profile, fp, { appliedTargetIds: applied, trackOn, ...extra });
    try {
      await run(); assert.equal(applied.has(tab.id), true);
      await run({ verifyApplied: true }); assert.equal(probes, 2); assert.equal(registrations, 1);
      assert.equal(installCheck, true);
      tab.url = 'http://127.0.0.1/site';
      await run({ verifyApplied: true });
      assert.equal(installCheck, false, 'website diagnostics compare live values without depending on the installer check');
      live = null;
      await assert.rejects(run({ verifyApplied: true }), /指纹交付校验失败/);
      assert.equal(applied.has(tab.id), false);
      live = { ...liveFor(), hardwareConcurrency: 99 };
      await assert.rejects(run(), /核心数/);
      cdp.tabs = async () => [];
      await assert.rejects(run({ phase: 'pre-startpage' }), /No page target/);
      await assert.rejects(run({ phase: 'post-startpage', verifyApplied: true }), /No page target/);
      let reads = 0;
      cdp.tabs = async () => ++reads === 1 ? [tab] : [];
      live = null;
      await assert.rejects(run({ phase: 'post-startpage', verifyApplied: true }), /No startup page remained/);
    } finally { Object.assign(cdp, saved); }
  });
  await test('the runtime watcher reuses its tab snapshot and retains newer attached targets', async () => {
    const savedTabs = cdp.tabs;
    const observedTabs = [{ id: 'existing', url: 'about:blank', webSocketDebuggerUrl: 'ws://localhost/page' }];
    const connection = {};
    const applied = new Set(['existing', 'just-attached', 'closed']);
    const trackOn = {
      workerFingerprintConnection: connection,
      fingerprintSessionStates: new Map([['new-session', { targetId: 'just-attached', connection, ready: true }]]),
    };
    let lookups = 0;
    cdp.tabs = async () => { lookups += 1; return observedTabs; };
    try {
      await runtime.applyRuntimeSettings.call({ networkInfo: new Map() }, 12345, profile, fp, {
        phase: 'watch-ensure', trackOn, appliedTargetIds: applied, observedTabs,
      });
      assert.equal(lookups, 0);
      assert.deepEqual([...applied], ['existing', 'just-attached']);
    } finally { cdp.tabs = savedTabs; }
  });
  await test('the runtime watcher defers to a flat owner that finishes attaching while a direct connection opens', async () => {
    const saved = { tabs: cdp.tabs, connect: cdp.connect };
    const tab = { id: 'handover', url: 'about:blank', webSocketDebuggerUrl: 'ws://localhost/page' };
    for (const blockVideo of [true, false]) {
      const applied = new Set();
      const flat = {};
      const trackOn = {
        workerFingerprintConnection: flat,
        fingerprintSessionStates: new Map(),
        fingerprintTargetSessions: new Map(),
      };
      let directOpens = 0, lookups = 0;
      cdp.tabs = async () => { lookups += 1; return [tab]; };
      cdp.connect = async () => {
        directOpens += 1;
        trackOn.fingerprintSessionStates.set('new', { targetId: tab.id, connection: flat, ready: true });
        trackOn.fingerprintTargetSessions.set('new', { targetId: tab.id, type: 'page' });
        applied.add(tab.id);
        throw new Error('Direct page connection retired by flat owner');
      };
      try {
        const activeProfile = { ...profile, advanced: { ...profile.advanced, blockVideo } };
        await runtime.applyRuntimeSettings.call({ networkInfo: new Map() }, 12345, activeProfile, fp, {
          phase: 'watch-ensure', trackOn, appliedTargetIds: applied, observedTabs: [tab],
        });
        assert.equal(directOpens, 1);
        assert.equal(lookups, 0, 'handover is confirmed by the live owner');
        assert.ok(applied.has(tab.id), 'the sweep must preserve the new owner’s verification');
      } finally { Object.assign(cdp, saved); }
    }
  });
  await test('a late probe from a detached CDP session cannot mark or invalidate the new target owner', async () => {
    const savedTabs = cdp.tabs;
    const tab = { id: 'swapping-session', url: 'about:blank', webSocketDebuggerUrl: 'ws://localhost/page' };
    const hash = injection.fingerprintConfigHash(fp);
    for (const successor of ['closed-tab', 'missing', 'pending', 'different-config', 'verified']) {
      const started = deferred(), reply = deferred(), applied = new Set([tab.id]);
      const previous = { async command(method, _params, { sessionId }) {
        assert.equal(method, 'Runtime.evaluate');assert.equal(sessionId, 'old');
        started.resolve();return reply.promise;
      } };
      const current = {};
      const trackOn = { fpAppliedHash: hash, fpAppliedTargets: applied, workerFingerprintConnection: previous,
        fingerprintTargetSessions: new Map([['old', { targetId: tab.id, type: 'page' }]]),
        fingerprintSessionStates: new Map([['old', { targetId: tab.id, connection: previous, ready: true, fingerprintHash: hash }]]) };
      cdp.tabs = async () => successor === 'closed-tab' ? [] : [tab];
      const sweep = runtime.applyRuntimeSettings.call({ networkInfo: new Map() }, 12345, profile, fp, {
        phase: 'watch-ensure', verifyApplied: true, trackOn, appliedTargetIds: applied, observedTabs: [tab],
      });
      const failed = ['missing', 'pending', 'different-config'].includes(successor);
      const result = failed ? assert.rejects(sweep, { code: 'FINGERPRINT_TARGET_CLOSED' }) : sweep;
      result.catch(() => {});
      try {
        await Promise.race([started.promise, result.then(() => { throw Error('probe never reached the old session'); })]);
        applied.delete(tab.id);
        trackOn.workerFingerprintConnection = current;
        trackOn.fingerprintTargetSessions = new Map();
        trackOn.fingerprintSessionStates = new Map();
        if (['pending', 'different-config', 'verified'].includes(successor)) {
          applied.add(tab.id);
          trackOn.fingerprintSessionStates.set('new', { targetId: tab.id, connection: current,
            ready: successor !== 'pending', fingerprintHash: successor === 'different-config' ? 'old-config' : hash });
        }
        reply.resolve({ result: { value: liveFor() } });
        await result;
        assert.equal(applied.has(tab.id), successor === 'verified', successor);
      } finally { reply.resolve({});cdp.tabs = savedTabs;await result.catch(() => {}); }
    }
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
  await test('Firefox watcher cleans up a live process with a closed BiDi connection', async () => {
    const savedTimeout = global.setTimeout;
    let tick;
    global.setTimeout = (fn) => { tick = fn; return 1; };
    const item = { profile, fingerprint: fp, engine: 'firefox', bidiConnection: { closed: true } };
    const reasons = [];
    const engine = { running: new Map([[profile.id, item]]),
      async handleBrowserGone(_id, _item, reason) { reasons.push(reason); }, emit() {} };
    try {
      lifecycle.startRunningWatch.call(engine, item);
      await tick();
      assert.deepEqual(reasons, []);
      await tick();
      assert.deepEqual(reasons, ['bidi-dead']);
    } finally { global.setTimeout = savedTimeout; }
  });
  await test('clearing a running watcher prevents in-flight probes from scheduling another tick', async () => {
    const saved = { timeout: global.setTimeout, clearTimeout: global.clearTimeout, tabs: cdp.tabs };
    const timers = [], probe = deferred();
    global.setTimeout = (fn) => { timers.push(fn); return timers.length; };
    global.clearTimeout = () => {};
    cdp.tabs = () => probe.promise;
    const item = { profile, engine: 'chromium', port: 12345, sessionUrls: ['about:blank'] };
    const engine = { running: new Map([[profile.id, item]]), emit() {} };
    try {
      lifecycle.startRunningWatch.call(engine, item);
      const previous = timers[0]();
      lifecycle.startRunningWatch.call(engine, item);
      assert.equal(timers.length, 1, 'a polling watcher is still active');
      lifecycle.clearRunningWatch.call(engine, item);
      lifecycle.startRunningWatch.call(engine, item);
      probe.resolve([{ id: 'old', url: 'http://127.0.0.1/old' }]);
      await previous;
      assert.equal(timers.length, 2);
      assert.deepEqual(item.sessionUrls, ['about:blank']);
    } finally { global.setTimeout = saved.timeout; global.clearTimeout = saved.clearTimeout; cdp.tabs = saved.tabs; }
  });
  await test('Chromium watcher requires consecutive confirmed empty lists before closing', async () => {
    const saved = { timeout: global.setTimeout, json: cdp.json, tabs: cdp.tabs };
    let tick, listError = false, stops = 0, applies = 0, versionLookups = 0;
    global.setTimeout = (fn) => { tick = fn; return 1; };
    cdp.json = async () => { versionLookups += 1; return {}; };
    cdp.tabs = async () => {
      if (listError) throw new Error('CDP tab list timeout');
      return [];
    };
    const item = { profile, fingerprint: fp, engine: 'chromium', port: 12345 };
    const engine = { running: new Map([[profile.id, item]]),
      async stop() { stops += 1; }, async applyRuntimeSettings() { applies += 1; }, emit() {} };
    try {
      lifecycle.startRunningWatch.call(engine, item);
      await tick();
      assert.equal(item.watchEmptyTicks, 1);
      assert.equal(versionLookups, 0);
      listError = true;
      await tick(); await tick(); await tick();
      assert.equal(stops, 0);
      assert.equal(applies, 0);
      assert.equal(versionLookups, 3);
      listError = false;
      await tick();
      assert.equal(stops, 0);
      await tick();
      assert.equal(stops, 1);
    } finally { global.setTimeout = saved.timeout; cdp.json = saved.json; cdp.tabs = saved.tabs; }
  });
  await test('an obsolete watcher failure cannot report or stop a restarted profile', async () => {
    const saved = { timeout: global.setTimeout, tabs: cdp.tabs };
    let tick, reject, stops = 0;
    const events = [];
    const pending = new Promise((_resolve, fail) => { reject = fail; });
    global.setTimeout = (fn) => { tick = fn; return 1; };
    cdp.tabs = async () => [{ id: 'page', url: 'about:blank' }];
    const item = { profile, fingerprint: fp, engine: 'chromium', port: 12345 };
    const engine = {
      running: new Map([[profile.id, item]]),
      applyRuntimeSettings: () => pending,
      async handleBrowserGone() { stops += 1; },
      emit(event) { events.push(event); },
    };
    try {
      lifecycle.startRunningWatch.call(engine, item);
      await tick();
      assert.equal(item.fpEnsureBusy, true);
      engine.running.set(profile.id, { ...item, port: 12346 });
      reject(new Error('old page connection closed'));
      await turn();
      assert.equal(stops, 0);
      assert.deepEqual(events, []);
      assert.equal(item.cdpError, undefined);
    } finally { global.setTimeout = saved.timeout; cdp.tabs = saved.tabs; }
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
  await test('seed persistence failure stops Chromium before process spawn and releases launch resources', () => startupHarness('seed'));
  await test('verified Chromium startup navigates and starts its watcher', () => startupHarness(null));
  await test('a stale Chromium kernel record blocks injection and navigation', () => startupHarness('runtime-version'));
  await test('contradictory Chromium configuration is rejected before process spawn', () => startupHarness('config'));
  await test('invalid website rules are rejected before Chromium process spawn or resource acquisition', () => startupHarness('url-config'));
  console.log(`fingerprint-delivery-boundaries-selftest: OK ${count}/${count}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
