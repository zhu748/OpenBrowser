'use strict';

const { LIVE_PROBE_EXPRESSION } = require('../fingerprint/delivery-probe');
const assert = require('node:assert/strict');
const { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup } = require('../firefox-fingerprint');
const { BidiConnection } = require('../../network/bidi-connection');

const profile = { id: 'firefox-contexts', os: 'Windows', engine: 'firefox', privacy: {
  fontListMode: 'real', timezoneMode: 'custom', timezone: 'Asia/Shanghai',
} };
const fingerprint = buildFirefoxFingerprint(profile, '145.0.1');
fingerprint.dynamicConfig.geoposition = { latitude: 31.2, longitude: 121.5, accuracy: 10 };
const deferred = () => { let resolve;const promise = new Promise((done) => { resolve = done; });return { promise, resolve }; };
const turn = () => new Promise((resolve) => setImmediate(resolve));
const remote = (value) => {
  if (value === null) return { type: 'null' };
  if (Array.isArray(value)) return { type: 'array', value: value.map(remote) };
  if (typeof value === 'object') return { type: 'object', value: Object.entries(value).map(([key, entry]) => [key, remote(entry)]) };
  return { type: typeof value, value };
};
const live = {
  platform: fingerprint.platform, userAgent: fingerprint.userAgent, hardwareConcurrency: fingerprint.hardwareConcurrency,
  languages: fingerprint.languages, timezone: fingerprint.timezone, vendor: '', screenWidth: fingerprint.screen.width,
  screenHeight: fingerprint.screen.height, devicePixelRatio: fingerprint.screen.devicePixelRatio,
};
function fixture(behavior = {}) {
  const calls = [], notifications = [];
  const connection = { onEvent: behavior.previousEvent, async command(method, params = {}) {
    calls.push({ method, params });
    if (method.startsWith('emulation.')) return behavior.emulate?.(method, params) || {};
    if (method === 'permissions.setPermission') return behavior.permission?.(params) || {};
    if (method === 'browsingContext.getTree') return { contexts: [{ context: 'initial', url: 'about:blank' }] };
    if (method === 'script.addPreloadScript') return { script: 'preload' };
    if (method === 'script.evaluate') return { type: 'success', result: params.expression === LIVE_PROBE_EXPRESSION ? remote(live) : { type: 'undefined' } };
    if (method === 'browsingContext.navigate') return behavior.navigate?.(params) || {};
    if (method === 'browsingContext.create') {
      if (behavior.emitCreated !== false) {
        const task = connection.onEvent({ method: 'browsingContext.contextCreated', params: { context: 'second', parent: null } }, connection);
        task.catch(() => {});notifications.push(task);
      }
      return { context: 'second' };
    }
    return {};
  } };
  const emit = (method, params) => connection.onEvent({ method, params }, connection);
  return { connection, calls, notifications, emit, initialize: () => initializeFirefoxFingerprint(connection,
    behavior.geoPermission ? { ...fingerprint, geoPermission: behavior.geoPermission } : fingerprint, profile) };
}
let passed = 0;
async function test(name, run) { await run();passed += 1;console.log('PASS ' + name); }

(async () => {
  await test('native permission setup precedes startup navigation and is shared by same-origin tabs', async () => {
    const h = fixture({ geoPermission: 'granted' });const initialized = await h.initialize();
    await navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test/a', 'https://one.test/b']);
    const permissions = h.calls.filter(call => call.method === 'permissions.setPermission');
    assert.deepEqual(permissions, [{ method: 'permissions.setPermission', params: { descriptor: { name: 'geolocation' }, state: 'granted', origin: 'https://one.test' } }]);
    assert.ok(h.calls.indexOf(permissions[0]) < h.calls.findIndex(call => call.method === 'browsingContext.navigate'));
  });
  await test('failed native permission setup blocks navigation and does not cache success', async () => {
    let attempts = 0;
    const h = fixture({ geoPermission: 'denied', permission: () => { if (++attempts === 1) throw new Error('native permission unsupported');return {}; } });
    const initialized = await h.initialize();
    await assert.rejects(navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test']), /native permission unsupported/);
    assert.equal(h.calls.some(call => call.method === 'browsingContext.navigate'), false);
    await navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test']);assert.equal(attempts, 2);
  });
  await test('Firefox startup allows website network errors and rejects transport errors', async () => {
    const networkError = Object.assign(Error('Error: NS_ERROR_NET_RESET'), { code: 'unknown error' });
    const h = fixture({ navigate: ({ url }) => {
      if (url === 'https://one.test/') throw networkError;
      if (url === 'https://three.test/') throw Error('Firefox BiDi connection closed');
    } });
    const initialized = await h.initialize();
    const warnings = [];
    const options = { onNavigationError: error => warnings.push(error) };
    await navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test', 'https://two.test'], options);
    assert.deepEqual(warnings, ['NS_ERROR_NET_RESET']);
    assert.ok(h.calls.some(call => call.method === 'browsingContext.navigate' && call.params.url === 'https://two.test/'));
    await assert.rejects(navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test']), networkError);
    await assert.rejects(navigateFirefoxStartup(h.connection, initialized.context, ['https://three.test'], options), /BiDi connection closed/);
  });
  await test('startup waits for the shared native context setup before navigating the new tab', async () => {
    const gate = deferred();
    const h = fixture({ emulate: (method, params) => method === 'emulation.setUserAgentOverride' && params.contexts?.[0] === 'second' ? gate.promise : {} });
    const initialized = await h.initialize();
    const navigation = navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test', 'https://two.test']);
    try {
      await turn();
      assert.equal(h.calls.some((call) => call.method === 'browsingContext.navigate' && call.params.context === 'second'), false);
      gate.resolve({});await navigation;await Promise.all(h.notifications);
      const overrides = h.calls.filter((call) => call.method.startsWith('emulation.') && call.params.contexts?.[0] === 'second');
      assert.deepEqual(overrides.map((call) => call.method), [
        'emulation.setUserAgentOverride', 'emulation.setTimezoneOverride',
        'emulation.setScreenSettingsOverride', 'emulation.setGeolocationOverride',
      ]);
      assert.deepEqual(h.calls.find(call => call.method === 'browsingContext.setViewport' && call.params.context === 'second')?.params,
        { context: 'second', devicePixelRatio: fingerprint.screen.devicePixelRatio });
      const geoIndex = h.calls.findIndex((call) => call.method === 'emulation.setGeolocationOverride' && call.params.contexts?.[0] === 'second');
      assert.ok(geoIndex < h.calls.findIndex((call) => call.method === 'browsingContext.navigate' && call.params.context === 'second'));
    } finally { gate.resolve({});await navigation; }
  });
  await test('a delayed context event shares the setup initiated by startup navigation', async () => {
    const h = fixture({ emitCreated: false });const initialized = await h.initialize();
    await navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test', 'https://two.test']);
    await h.emit('browsingContext.contextCreated', { context: 'second', parent: null });
    assert.equal(h.calls.filter((call) => call.method === 'emulation.setUserAgentOverride' && call.params.contexts?.[0] === 'second').length, 1);
  });
  await test('startup setup is not delayed by an unrelated earlier context-event listener', async () => {
    const gate = deferred();const h = fixture({ previousEvent: () => gate.promise });
    const initialized = await h.initialize();
    try {
      await navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test', 'https://two.test']);
      assert.equal(h.calls.filter((call) => call.method === 'emulation.setGeolocationOverride' && call.params.contexts?.[0] === 'second').length, 1);
    } finally { gate.resolve();await Promise.all(h.notifications); }
  });
  await test('configured position failure rejects both the new-context event and startup navigation', async () => {
    const h = fixture({ emulate: (method, params) => {
      if (method === 'emulation.setGeolocationOverride' && params.contexts?.[0] === 'second') throw new Error('position delivery failed');
      return {};
    } });
    const initialized = await h.initialize();
    await assert.rejects(navigateFirefoxStartup(h.connection, initialized.context, ['https://one.test', 'https://two.test']), /position delivery failed/);
    await assert.rejects(h.notifications[0], /position delivery failed/);
    assert.equal(h.calls.some((call) => call.method === 'browsingContext.navigate' && call.params.context === 'second'), false);
    assert.equal(initialized.warnings.some((warning) => warning.includes('position delivery failed')), false);
  });
  await test('a failed initial configured position stops before document registration or navigation', async () => {
    const h = fixture({ emulate: (method) => { if (method === 'emulation.setGeolocationOverride') throw new Error('position unsupported');return {}; } });
    await assert.rejects(h.initialize(), /position unsupported/);
    assert.equal(h.calls.some((call) => call.method === 'script.addPreloadScript' || call.method === 'browsingContext.navigate'), false);
  });
  await test('child context events inherit native settings without top-level-only emulation calls', async () => {
    const h = fixture();await h.initialize();const count = h.calls.length;
    await h.emit('browsingContext.contextCreated', { context: 'child', parent: 'initial' });
    assert.equal(h.calls.length, count);
  });
  await test('unsupported native screen settings report degraded delivery', async () => {
    const h = fixture({ emulate: (method) => {
      if (method === 'emulation.setScreenSettingsOverride') throw Object.assign(new Error('unknown command'), { code: 'unknown command' });
      return {};
    } });
    const initialized = await h.initialize();
    assert.ok(initialized.warnings.some(warning => warning.includes('emulation.setScreenSettingsOverride')));
    const fatal = fixture({ emulate: (method) => {
      if (method === 'emulation.setScreenSettingsOverride') throw new Error('connection timed out');
      return {};
    } });
    await assert.rejects(fatal.initialize(), /connection timed out/);
  });
  await test('a vanished Worker realm is benign while real injection failures reach the caller', async () => {
    const h = fixture();
    const errors = [];
    await initializeFirefoxFingerprint(h.connection, fingerprint, profile, { onWorkerError: error => errors.push(error.message) });
    const send = h.connection.command;
    let failure = Object.assign(new Error('Realm with id short-lived not found'), { code: 'no such frame' });
    h.connection.command = (method, params) => params?.target?.realm ? Promise.reject(failure) : send(method, params);
    const realm = { realm: 'short-lived', type: 'dedicated-worker' };
    await h.emit('script.realmCreated', realm);
    assert.deepEqual(errors, []);
    failure = new Error('script execution failed');
    await h.emit('script.realmCreated', realm);
    assert.deepEqual(errors, ['script execution failed']);
  });
  await test('older kernels retain the explicit fallback for unsupported context parameters', async () => {
    const h = fixture({ emulate: (method, params) => {
      if (method === 'emulation.setGeolocationOverride' && params.contexts) throw Object.assign(new Error('unknown contexts'), { code: 'invalid argument' });
      return {};
    } });
    await h.initialize();
    const geo = h.calls.filter((call) => call.method === 'emulation.setGeolocationOverride');
    assert.equal(geo.length, 2);assert.deepEqual(geo[0].params.contexts, ['initial']);
    assert.equal(geo[1].params.contexts, undefined);assert.deepEqual(geo[1].params.coordinates, fingerprint.dynamicConfig.geoposition);
  });
  await test('startup navigation requires successful fingerprint initialization', async () => {
    const h = fixture();
    await assert.rejects(navigateFirefoxStartup(h.connection, 'initial', ['https://one.test']), /initialization is required/);
    assert.equal(h.calls.length, 0);
  });
  await test('fatal BiDi events close pending commands and observe asynchronous disconnect errors', async () => {
    class Socket extends EventTarget {
      constructor() { super();this.readyState = 0;queueMicrotask(() => { this.readyState = 1;this.dispatchEvent(new Event('open')); }); }
      send() {}
      close() { this.readyState = 3;this.dispatchEvent(new Event('close')); }
    }
    const socket = new Socket(), unhandled = [];let disconnected = 0;
    const listener = (error) => unhandled.push(error);process.on('unhandledRejection', listener);
    const connection = new BidiConnection('ws://127.0.0.1:12345', {
      socketFactory: () => socket, onEvent: async () => { throw new Error('required context setup failed'); },
      onDisconnect: async () => { disconnected += 1;throw new Error('cleanup failed'); },
    });
    try {
      await connection.open();
      const pending = connection.command('pending');
      const rejected = assert.rejects(pending, /required context setup failed/);
      socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'event', method: 'context' }) }));
      await rejected;await turn();await turn();
      assert.equal(connection.closed, true);assert.equal(connection.pending.size, 0);assert.equal(disconnected, 1);
      assert.deepEqual(unhandled, []);
    } finally { connection.close();process.removeListener('unhandledRejection', listener); }
  });
  console.log(`firefox-context-barrier-selftest: OK ${passed}/${passed}`);
})().catch((error) => { console.error(error);process.exitCode = 1; });
