'use strict';

const assert = require('node:assert/strict');
const cdp = require('../../cdp');
const injection = require('../../engine/fingerprint-injection');
const { FingerprintSession } = require('../../engine/fingerprint-session');
const { buildFingerprint } = require('../fingerprint');
const profile = { id: 'session-races', name: 'Sessions', os: 'Windows', privacy: { fontListMode: 'real' } };
const fp = buildFingerprint(profile);
const deferred = () => { let resolve;const promise = new Promise((done) => { resolve = done; });return { promise, resolve }; };
const turn = () => new Promise((resolve) => setImmediate(resolve));
let passed = 0;
async function test(name, run) { await run();passed += 1;console.log('PASS ' + name); }

async function harness(type, behavior = {}) {
  const saved = { connect: cdp.connect, browserSocket: cdp.browserSocket, targets: cdp.targets };
  const target = { targetId: 'target', type, url: behavior.url || (type === 'page' ? 'about:blank' : 'https://example.test/worker.js') };
  const commands = [], events = [], evaluations = new Map();let onEvent, exists = behavior.initial !== false;
  const item = { port: 12345, profile, fingerprint: fp };
  const connection = { closed: false, close() { this.closed = true; }, async command(method, params = {}, options = {}) {
    commands.push({ method, params, sessionId: options.sessionId });
    if (method === 'Target.getTargets') return behavior.targets?.(target) || { targetInfos: exists ? [target] : [] };
    if (method === 'Target.setAutoAttach' && !options.sessionId && behavior.initial !== false) queueMicrotask(() => { onEvent(attach('old'), connection); });
    if (method === 'Runtime.evaluate') {
      evaluations.set(options.sessionId, (evaluations.get(options.sessionId) || 0) + 1);
      return behavior.evaluate?.(options.sessionId) || {};
    }
    if (method === 'Runtime.runIfWaitingForDebugger') return behavior.resume?.(options.sessionId) || {};
    if (method === 'Fetch.enable') return behavior.fetch?.(options.sessionId) || {};
    if (method === 'Target.closeTarget') { exists = false;return { success: true }; }
    return {};
  } };
  function attach(sessionId) { return { method: 'Target.attachedToTarget', params: { sessionId, targetInfo: target, waitingForDebugger: true } }; }
  const engine = {
    networkInfo: new Map(), emit: (event) => events.push(event),
    applyFingerprintToSession: async (_connection, sessionId, _item, _fp, info) => behavior.apply?.(sessionId, info),
    async handleBrowserGone() { engine.stopped = true;item.stopping = true;item.workerFingerprintConnection?.close(); },
  };
  cdp.browserSocket = async () => 'ws://127.0.0.1:12345/devtools/browser/races';
  cdp.targets = async () => [];
  cdp.connect = async (_url, options) => { onEvent = options.onEvent;return connection; };
  const startup = injection.startWorkerFingerprintInjection.call(engine, item, fp);startup.catch(() => {});
  await turn();
  const dispatch = (method, params) => {
    if (method === 'Target.targetDestroyed') exists = false;
    return onEvent({ method, params }, connection);
  };
  return { item, engine, connection, commands, events, evaluations, startup, dispatch,
    attach: (id) => { exists = true;return onEvent(attach(id), connection); },
    cleanup() { item.workerFingerprintConnection?.close();Object.assign(cdp, saved); },
  };
}

(async () => {
  for (const type of ['worker', 'shared_worker', 'service_worker', 'page', 'iframe']) {
    await test(type + ' detach cancels pending setup without debugger resume or readiness publication', async () => {
      const gate = deferred();
      const h = await harness(type, { evaluate: () => gate.promise, apply: () => gate.promise });
      try {
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });
        await assert.rejects(h.startup, /detached/);gate.resolve({});await turn();
        assert.equal(h.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), false);
        assert.equal(h.item.fpAppliedTargets?.has('target') || false, false);
        assert.equal(h.item.attachedWorkerTargets?.has('target') || false, false);
        assert.equal(h.item.fingerprintTargetSessions.size, 0);
      } finally { gate.resolve({});h.cleanup(); }
    });
    await test(type + ' destruction releases the initial barrier and ignores late setup results', async () => {
      const gate = deferred();const h = await harness(type, { evaluate: () => gate.promise, apply: () => gate.promise });
      try {
        h.dispatch('Target.targetDestroyed', { targetId: 'target' });await h.startup;
        gate.resolve({});await turn();
        assert.equal(h.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), false);
        assert.equal(h.commands.some((call) => call.method === 'Target.closeTarget'), false);
        assert.equal(h.engine.stopped, undefined);
        assert.equal(h.item.fingerprintTargetSessions.size, 0);
      } finally { gate.resolve({});h.cleanup(); }
    });
  }
  await test('a replacement session can complete without an old detached task closing its target', async () => {
    const gate = deferred();const h = await harness('worker', { evaluate: (id) => id === 'old' ? gate.promise : {} });
    try {
      h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });
      await h.attach('replacement');await h.startup;
      gate.resolve({});await turn();
      assert.equal(h.commands.some((call) => call.method === 'Target.closeTarget'), false);
      assert.equal(h.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger' && call.sessionId === 'old'), false);
      assert.equal(h.item.fingerprintTargetSessions.has('replacement'), true);
      assert.equal(h.item.fingerprintTargetSessions.has('old'), false);
    } finally { gate.resolve({});h.cleanup(); }
  });
  await test('repeated old detach events preserve replacement page and worker readiness', async () => {
    for (const type of ['worker', 'page']) {
      const h = await harness(type);
      try {
        await h.startup;await h.attach('replacement');
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });await turn();
        assert.equal(h.item.fingerprintTargetSessions.has('replacement'), true);
        assert.equal(type === 'page' ? h.item.fpAppliedTargets.has('target') : h.item.attachedWorkerTargets.has('target'), true);
        assert.equal(h.engine.stopped, undefined);
      } finally { h.cleanup(); }
    }
  });
  await test('worker destruction wins over an earlier still-live CDP snapshot', async () => {
    const behavior = {}, h = await harness('worker', behavior);
    try {
      await h.startup;
      let reads = 0;
      behavior.targets = (target) => {
        reads += 1;
        if (reads === 2) h.dispatch('Target.targetDestroyed', { targetId: 'target' });
        return { targetInfos: [target] }; // both snapshots were taken before destruction
      };
      h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });
      await turn();
      assert.equal(reads, 2);
      assert.equal(h.engine.stopped, undefined);
    } finally { h.cleanup(); }
  });
  await test('detach during Fetch registration prevents resume and later interception commands', async () => {
    for (const type of ['worker', 'page']) {
      const gate = deferred(), h = await harness(type, { fetch: () => gate.promise });
      try {
        assert.equal(h.commands.some((call) => call.method === 'Fetch.enable'), true);
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });
        await assert.rejects(h.startup, /detached/);
        const count = h.commands.length;gate.resolve({});await turn();
        assert.equal(h.commands.length, count);
        assert.equal(h.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), false);
      } finally { gate.resolve({});h.cleanup(); }
    }
  });
  await test('detach during debugger resume cannot republish worker or page readiness', async () => {
    for (const type of ['worker', 'page']) {
      const gate = deferred();const h = await harness(type, { resume: () => gate.promise });
      try {
        assert.equal(h.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), true);
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });
        await assert.rejects(h.startup, /detached/);gate.resolve({});await turn();
        assert.equal(h.item.fpAppliedTargets?.has('target') || false, false);
        assert.equal(h.item.attachedWorkerTargets?.has('target') || false, false);
      } finally { gate.resolve({});h.cleanup(); }
    }
  });
  await test('closing during a pending command cancels continuation without late browser commands', async () => {
    const gate = deferred();const h = await harness('worker', { evaluate: () => gate.promise });
    try {
      h.item.workerFingerprintConnection.close();await assert.rejects(h.startup, /closed/);
      const count = h.commands.length;gate.resolve({});await turn();
      assert.equal(h.commands.length, count);
      assert.equal(h.item.fingerprintTargetSessions.size, 0);
    } finally { gate.resolve({});h.cleanup(); }
  });
  await test('losing an already-ready live session stops the browser; destroyed targets do not', async () => {
    for (const destroyed of [false, true]) {
      const h = await harness('worker');
      try {
        await h.startup;
        if (destroyed) h.dispatch('Target.targetDestroyed', { targetId: 'target' });
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });await turn();
        assert.equal(h.engine.stopped === true, !destroyed);
      } finally { h.cleanup(); }
    }
  });
  await test('a cancelled native page setup cannot issue commands after its pending command resolves', async () => {
    const gate = deferred(), commands = [], item = { profile }, connection = { command: async (method) => {
      commands.push(method);if (method === 'Emulation.setUserAgentOverride') return gate.promise;
      return method === 'Page.addScriptToEvaluateOnNewDocument' ? { identifier: 'script' } : {};
    } };
    const state = new FingerprintSession({ sessionId: 'page', targetId: 'target', item, connection });
    const task = injection.applyFingerprintToSession.call({ networkInfo: new Map() }, connection, 'page', item, fp,
      { type: 'page', targetId: 'target', waitingForDebugger: true, setupGuard: state });
    const rejection = assert.rejects(task, { code: 'FINGERPRINT_SESSION_CANCELLED' });
    await turn();state.cancel('detached');await rejection;
    const before = commands.length;gate.resolve({});await turn();
    assert.equal(commands.length, before);assert.equal(item.fpAppliedHash, undefined);
  });
  await test('excluded internal workers are resumed without claiming verified fingerprint delivery', async () => {
    for (const type of ['worker', 'shared_worker', 'service_worker']) {
      const h = await harness(type, { url: 'chrome-extension://internal/worker.js' });
      try {
        await h.startup;await turn();
        assert.equal(h.evaluations.size, 0);
        assert.equal(h.item.attachedWorkerTargets?.has('target') || false, false);
        assert.equal(h.item.fingerprintTargetSessions.size, 0);
        h.dispatch('Target.detachedFromTarget', { sessionId: 'old', targetId: 'target' });await turn();
        assert.equal(h.engine.stopped, undefined);
      } finally { h.cleanup(); }
    }
  });
  await test('a late iframe deadline closes the target and cancels its pending injection', async () => {
    const gate = deferred(), h = await harness('iframe', { initial: false, apply: () => gate.promise });
    const originalTimer = global.setTimeout;let expire, setup;
    try {
      await h.startup;
      global.setTimeout = (callback, delay, ...args) => {
        if (delay === 5000) expire = callback;
        return originalTimer(callback, delay, ...args);
      };
      setup = h.attach('late');await turn();global.setTimeout = originalTimer;
      assert.equal(typeof expire, 'function');expire();await setup;
      assert.equal(h.commands.some((call) => call.method === 'Target.closeTarget'), true);
      assert.equal(h.events.some((event) => event.type === 'fingerprint-injection-failed' && /timeout/.test(event.message)), true);
      const count = h.commands.length;gate.resolve({});await turn();
      assert.equal(h.commands.length, count);
      assert.equal(h.commands.some((call) => call.method === 'Runtime.runIfWaitingForDebugger'), false);
      assert.equal(h.item.fpAppliedTargets?.has('target') || false, false);
    } finally { global.setTimeout = originalTimer;gate.resolve({});await setup;h.cleanup(); }
  });
  console.log(`fingerprint-session-races-selftest: OK ${passed}/${passed}`);
})().catch((error) => { console.error(error);process.exitCode = 1; });
