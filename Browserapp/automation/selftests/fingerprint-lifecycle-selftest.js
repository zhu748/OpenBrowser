'use strict';

const assert = require('node:assert/strict');
const { buildFingerprint, applyFingerprintToTab, forgetFingerprintOwner, forgetFingerprintTarget } = require('../fingerprint');
const { ensureLegacyFingerprintSeed } = require('../../engine/start');
const { pageFingerprintConnection, closePageFingerprintConnections } = require('../../engine/fingerprint-transport');
const cdp = require('../../cdp');
const { applyTargetRuntimePolicy, forgetTargetRuntimePolicy } = require('../../engine/runtime-policy');
const { PersistentConnection } = require('../../network/cdp-connection');
const { applyFingerprintToSession } = require('../../engine/fingerprint-injection');
const deferred = () => { let resolve;const promise = new Promise((done) => { resolve = done; });return { promise, resolve }; };
const turn = () => new Promise((resolve) => setImmediate(resolve));
const profile = (id) => ({ id, name: id, os: 'Windows', fingerprintSeed: id, privacy: { fontListMode: 'real' } });
const fp = buildFingerprint(profile('lifecycle'));
let passed = 0;
async function test(name, run) { await run();console.log('PASS ' + name);passed += 1; }
function transport(behavior = {}) {
  const calls = [];let registrations = 0;
  const connection = { calls, close() { connection.closed = true; }, async command(method, params) {
    calls.push({ method, params });
    const value = await behavior.command?.(method, params);
    if (value !== undefined) return value;
    if (method === 'Page.addScriptToEvaluateOnNewDocument') return { identifier: String(++registrations) };
    return {};
  } };
  return connection;
}
const apply = (owner, key, value = fp, scope = '') => applyFingerprintToTab(
  (method, params) => owner.command(method, params), null, value, {}, {
    applyKey: key, registrationOwner: owner, registrationScope: scope,
  });
const count = (owner, method) => owner.calls.filter((call) => call.method === method).length;

(async () => {
  await test('concurrent identical injection is serialized and registers exactly once', async () => {
    const gate = deferred();const owner = transport({ command: (method) => method === 'Page.addScriptToEvaluateOnNewDocument' ? gate.promise : undefined });
    const operations = Array.from({ length: 12 }, () => apply(owner, 'concurrent'));
    await turn();assert.equal(count(owner, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    gate.resolve({ identifier: 'shared' });await Promise.all(operations);
    assert.equal(count(owner, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    assert.equal(count(owner, 'Runtime.evaluate'), 1);
  });
  await test('connection and flat-session registrations remain independent', async () => {
    const a = transport(), b = transport();
    await apply(a, 'same-target', fp, 's1');await apply(a, 'same-target', fp, 's2');await apply(b, 'same-target', fp, 's1');
    await apply(a, 'same-target', fp, 's1');
    assert.equal(count(a, 'Page.addScriptToEvaluateOnNewDocument'), 2);
    assert.equal(count(b, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    forgetFingerprintTarget(a, 'same-target', 's1');
    await apply(a, 'same-target', fp, 's2');assert.equal(count(a, 'Page.addScriptToEvaluateOnNewDocument'), 2);
    await apply(a, 'same-target', fp, 's1');assert.equal(count(a, 'Page.addScriptToEvaluateOnNewDocument'), 3);
  });
  await test('more than 256 live targets do not evict their document registrations', async () => {
    const owner = transport();
    for (let i = 0; i < 270; i += 1) await apply(owner, 'live-' + i);
    await apply(owner, 'live-0');
    assert.equal(count(owner, 'Page.addScriptToEvaluateOnNewDocument'), 270);
    forgetFingerprintOwner(owner);
  });
  await test('a failed replacement cannot leave a removed script marked installed', async () => {
    let fail = false;
    const owner = transport({ command(method) { if (fail && method === 'Page.addScriptToEvaluateOnNewDocument') throw new Error('registration rejected'); } });
    await apply(owner, 'replace');
    fail = true;
    await assert.rejects(apply(owner, 'replace', buildFingerprint(profile('new-identity'))), /registration rejected/);
    fail = false;
    await apply(owner, 'replace');
    assert.equal(count(owner, 'Page.removeScriptToEvaluateOnNewDocument'), 1);
    assert.equal(count(owner, 'Page.addScriptToEvaluateOnNewDocument'), 4, 'original, two failed attempts, reinstalled original');
  });
  await test('failed evaluation retries reuse the registration without poisoning the queue', async () => {
    let fail = true;
    const owner = transport({ command(method) { if (fail && method === 'Runtime.evaluate') return { exceptionDetails: { text: 'script failed' } }; } });
    await assert.rejects(apply(owner, 'retry'), /script failed/);
    fail = false;await apply(owner, 'retry');
    assert.equal(count(owner, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    assert.equal(count(owner, 'Runtime.evaluate'), 2);
  });
  await test('detaching while registration is pending cancels late and queued evaluation', async () => {
    const gate = deferred();const owner = transport({ command: (method) => method === 'Page.addScriptToEvaluateOnNewDocument' ? gate.promise : undefined });
    const first = apply(owner, 'closed'), second = apply(owner, 'closed');
    const checks = [first, second].map((promise) => assert.rejects(promise, { code: 'FINGERPRINT_TARGET_CLOSED' }));
    await turn();forgetFingerprintOwner(owner);gate.resolve({ identifier: 'late' });await Promise.all(checks);
    assert.equal(count(owner, 'Runtime.evaluate'), 0);
  });
  await test('persistent fallback connection is shared, pruned and stopped on unexpected loss', async () => {
    const original = cdp.connect, originalTabs = cdp.tabs;let opens = 0, stopped = 0, disconnect;
    cdp.tabs = async () => [{ id: 'page' }];
    const owner = transport();const item = { profile: { id: 'transport' }, fpAppliedTargets: new Set(['page']) };
    cdp.connect = async (_url, options) => { opens += 1;disconnect = options.onDisconnect;return owner; };
    try {
      const engine = { async handleBrowserGone(_id, _item, _reason, options) { assert.equal(options.kill, true);stopped += 1; } };
      const tab = { id: 'page', webSocketDebuggerUrl: 'ws://localhost/page' };
      assert.equal(await pageFingerprintConnection(engine, item, tab), owner);
      assert.equal(await pageFingerprintConnection(engine, item, tab), owner);assert.equal(opens, 1);
      closePageFingerprintConnections(item, new Set(['page']));assert.equal(owner.closed, undefined);
      await disconnect(new Error('socket lost'), owner);assert.equal(stopped, 1);
      assert.equal(item.fpAppliedTargets.has('page'), false);
      assert.equal(item.fingerprintPageConnections.size, 0);
    } finally { cdp.connect = original;cdp.tabs = originalTabs;closePageFingerprintConnections(item); }
  });
  await test('closing one page normally does not stop the remaining browser', async () => {
    const original = cdp.connect, originalTabs = cdp.tabs, owner = transport(), item = {};let disconnect, stops = 0;
    cdp.connect = async (_url, options) => { disconnect = options.onDisconnect;return owner; };
    cdp.tabs = async () => [{ id: 'remaining-tab' }];
    try {
      await pageFingerprintConnection({ handleBrowserGone: async () => { stops += 1; } }, item, { id: 'closed-page', webSocketDebuggerUrl: 'ws://localhost/closed' });
      await disconnect(new Error('normal tab closure'), owner);
      assert.equal(stops, 0);assert.equal(item.fingerprintPageConnections.size, 0);
    } finally { cdp.connect = original;cdp.tabs = originalTabs; }
  });
  await test('policy registrations survive handover by remaining scoped to their actual session', async () => {
    const owner = {}, a = transport(), b = transport();
    const configured = { privacy: { portScanProtect: true, portScanAllow: '8080' }, advanced: { blockVideo: true } };
    const run = (connection) => applyTargetRuntimePolicy({ owner, targetId: 'policy-page', profile: configured,
      registrationOwner: connection, waiting: true, invoke: (method, params) => connection.command(method, params) });
    await Promise.all([run(a), run(b)]);
    assert.equal(count(a, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    assert.equal(count(b, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    assert.equal(count(a, 'Network.setBlockedURLs'), 1);assert.equal(count(b, 'Network.setBlockedURLs'), 1);
    forgetTargetRuntimePolicy(owner, 'policy-page', a);
    await run(b);assert.equal(count(b, 'Page.addScriptToEvaluateOnNewDocument'), 1);
    assert.equal(count(b, 'Page.removeScriptToEvaluateOnNewDocument'), 0);
  });
  await test('blank or paused handover retires the previous session before native overrides', async () => {
    const original = cdp.connect;
    for (const paused of [false, true]) {
      const previous = transport(), p = profile('handover-' + paused), item = { profile: p };
      cdp.connect = async () => previous;
      try {
        await pageFingerprintConnection({}, item, { id: 'handover', webSocketDebuggerUrl: 'ws://localhost/handover' });
        const next = transport({ command() { assert.equal(previous.closed, true); } });
        await applyFingerprintToSession.call({ networkInfo: new Map() }, next, 'flat', item, buildFingerprint(p), {
          targetId: 'handover', type: 'page', url: paused ? 'https://example.test/' : 'about:blank', waitingForDebugger: paused,
        });
        assert.equal(item.fingerprintPageConnections.size, 0);
        assert.equal(count(next, 'Page.addScriptToEvaluateOnNewDocument'), 1);
      } finally { closePageFingerprintConnections(item); }
    }
    cdp.connect = original;
  });
  await test('active unpaused documents cannot silently switch fingerprint session ownership', async () => {
    const original = cdp.connect, previous = transport(), next = transport(), p = profile('unsafe-handover'), item = { profile: p };
    cdp.connect = async () => previous;
    try {
      await pageFingerprintConnection({}, item, { id: 'unsafe', webSocketDebuggerUrl: 'ws://localhost/unsafe' });
      await assert.rejects(applyFingerprintToSession.call({ networkInfo: new Map() }, next, 'flat', item, buildFingerprint(p), {
        targetId: 'unsafe', type: 'page', url: 'https://example.test/',
      }), { code: 'FINGERPRINT_HANDOVER_UNSAFE' });
      assert.equal(previous.closed, undefined);assert.equal(next.calls.length, 0);
    } finally { cdp.connect = original;closePageFingerprintConnections(item); }
  });
  await test('native geolocation, granted permission and mobile touch failures block registration', async () => {
    for (const method of ['Emulation.setGeolocationOverride', 'Browser.setPermission', 'Emulation.setTouchEmulationEnabled']) {
      const p = { ...profile('required-' + method.replaceAll('.', '-')), os: method.includes('Touch') ? 'Android' : 'Windows',
        privacy: { fontListMode: 'real', geoMode: 'custom', latitude: 0, longitude: 0, geoPermission: 'allow' } };
      const owner = transport({ command(name) { if (name === method) throw new Error('not available'); } });
      await assert.rejects(applyFingerprintToTab((name, params) => owner.command(name, params), null, buildFingerprint(p), p), /not available/);
      assert.equal(count(owner, 'Page.addScriptToEvaluateOnNewDocument'), 0, method);
    }
  });
  await test('failed port-policy replacement cannot preserve a removed registration as valid', async () => {
    const owner = {};let fail = false;
    const connection = transport({ command(method) {
      if (fail && method === 'Page.addScriptToEvaluateOnNewDocument') throw new Error('policy registration rejected');
    } });
    const run = (port) => applyTargetRuntimePolicy({ owner, targetId: 'port-retry', waiting: true,
      profile: { privacy: { portScanProtect: true, portScanAllow: port } },
      invoke: (method, params) => connection.command(method, params) });
    await run('8080');fail = true;await assert.rejects(run('8081'), /policy registration rejected/);
    fail = false;await run('8080');
    assert.equal(count(connection, 'Page.addScriptToEvaluateOnNewDocument'), 3);
  });
  await test('closing a browser during fallback connection opening cannot leak the socket', async () => {
    const original = cdp.connect, gate = deferred(), owner = transport(), item = {};
    cdp.connect = () => gate.promise;
    try {
      const opening = pageFingerprintConnection({}, item, { id: 'late', webSocketDebuggerUrl: 'ws://localhost/late' });
      const rejected = assert.rejects(opening, /stopped/);
      closePageFingerprintConnections(item);gate.resolve(owner);await rejected;
      assert.equal(owner.closed, true);assert.equal(item.fingerprintPageConnections.size, 0);
    } finally { cdp.connect = original; }
  });
  await test('async disconnect cleanup rejection cannot become an unhandled transport rejection', async () => {
    const connection = new PersistentConnection('ws://localhost/test', { socket: { close() {} },
      async onDisconnect() { throw new Error('cleanup rejected'); } });
    connection.opened = true;
    connection.terminate(new Error('socket lost'), true);
    await turn();assert.equal(connection.closed, true);assert.equal(connection.disconnectNotified, true);
  });
  await test('seed persistence failure blocks launch and retries the same identity', async () => {
    const p = { id: 'seed-failure', name: 'Seed', fingerprintSeed: '' };let writes = 0;
    const engine = { profiles: new Map([[p.id, p]]), async persist() { writes += 1;if (writes === 1) throw new Error('disk failed'); } };
    await assert.rejects(ensureLegacyFingerprintSeed(engine, p), { code: 'FINGERPRINT_SEED_PERSIST_FAILED' });
    const chosen = p.fingerprintSeed;assert.match(chosen, /^[a-f0-9]{32}$/);
    engine.profiles.set(p.id, { ...engine.profiles.get(p.id), note: 'concurrent edit' });
    await ensureLegacyFingerprintSeed(engine, { ...engine.profiles.get(p.id) });
    assert.equal(writes, 2);assert.equal(engine.profiles.get(p.id).fingerprintSeed, chosen);
    assert.equal(engine.profiles.get(p.id).note, 'concurrent edit');
    await ensureLegacyFingerprintSeed(engine, p);assert.equal(writes, 2);
  });
  await test('concurrent seed migration shares one flush and preserves current profile fields', async () => {
    const gate = deferred(), a = { id: 'seed-shared', name: 'Old', fingerprintSeed: '' }, b = { ...a };let writes = 0;
    const engine = { profiles: new Map([[a.id, { ...a, name: 'Latest' }]]), async persist() { writes += 1;await gate.promise; } };
    const first = ensureLegacyFingerprintSeed(engine, a), second = ensureLegacyFingerprintSeed(engine, b);
    await turn();assert.equal(writes, 1);assert.equal(a.fingerprintSeed, b.fingerprintSeed);
    assert.equal(engine.profiles.get(a.id).name, 'Latest');gate.resolve();await Promise.all([first, second]);
  });
  await test('changing or deleting identity during the seed flush cannot launch an obsolete identity', async () => {
    for (const remove of [false, true]) {
      const gate = deferred(), p = { id: 'seed-edited-' + remove, name: 'Seed', fingerprintSeed: '' };
      const engine = { profiles: new Map([[p.id, p]]), persist: () => gate.promise };
      const migration = ensureLegacyFingerprintSeed(engine, p);
      const rejected = assert.rejects(migration, { code: 'FINGERPRINT_IDENTITY_CHANGED' });
      if (remove) engine.profiles.delete(p.id);
      else engine.profiles.set(p.id, { ...engine.profiles.get(p.id), fingerprintSeed: 'user-new-seed' });
      gate.resolve();await rejected;
      assert.equal(engine.profiles.get(p.id)?.fingerprintSeed, remove ? undefined : 'user-new-seed');
      if (remove) await assert.rejects(ensureLegacyFingerprintSeed(engine, p), { code: 'FINGERPRINT_IDENTITY_CHANGED' });
      else { await ensureLegacyFingerprintSeed(engine, p);assert.equal(p.fingerprintSeed, 'user-new-seed'); }
    }
  });
  console.log(`fingerprint-lifecycle-selftest: OK ${passed}/${passed}`);
})().catch((error) => { console.error(error);process.exitCode = 1; });
