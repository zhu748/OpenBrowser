#!/usr/bin/env node
'use strict';

/**
 * E2E selftest for the Firefox launch pipeline (engine/_startFirefox) on
 * linux/x64 with a stub Firefox binary:
 *
 *   stub "firefox" = a Node script that copies a marker file and waits until
 *   killed, so the pipeline's spawn → watch → stop path runs for real, while
 *   probeBrowserBinary/probeFirefoxBinary are stubbed to pass (the stub is not
 *   a real browser).
 *
 * Verifies: user.js written with proxy/UA/telemetry prefs before spawn,
 * running item shape (engine:'firefox', port:null, connection:null), start
 * progress events, stop() kills the process and releases the profile lock, and
 * startup diagnostics are written on failure.
 */

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const net = require('node:net');

let passed = 0;
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}: ${error.message}`);
  }
}
const IS_LINUX = process.platform === 'linux';

// Test the production orchestration with loopback resource fixtures. Browser
// and TLS behavior are covered by the native Firefox gates, not these stubs.
const proxyModule = require('../../proxy-forwarder');
const mitmModule = require('../firefox-worker-mitm-proxy');
const trustModule = require('../firefox-trust-installer');
const originals = { bridge: proxyModule.startAuthenticatedProxy, mitm: mitmModule.FirefoxWorkerMitmProxy, trust: trustModule.installFirefoxCa };
const proxyResources = [];
const bridgeConfigs = [];
let rejectTrust = false;
class ProxyFixture {
  static async create(options) { return new this(options); }
  constructor(options = {}) { this.options = options; this.ca = { cert: Buffer.from('fixture') }; proxyResources.push(this); }
  async start() {
    this.server = net.createServer((socket) => socket.destroy());
    await new Promise((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.port = this.server.address().port;
    this.url = 'http://127.0.0.1:' + this.port;
    return this;
  }
  close() { return this.closing ||= new Promise((resolve) => { this.closed = true; this.server.close(resolve); }); }
}
proxyModule.startAuthenticatedProxy = async (config) => { bridgeConfigs.push(config); return new ProxyFixture().start(); };
mitmModule.FirefoxWorkerMitmProxy = ProxyFixture;
trustModule.installFirefoxCa = () => ({ ok: !rejectTrust, reason: rejectTrust ? 'fixture-import-failed' : undefined });
const { BrowserEngine } = require('../../engine');

async function makeEngine(tmp) {
  fs.mkdirSync(path.join(tmp, 'userData'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'userData', 'browser-profiles-v2'), { recursive: true });
  const engine = new BrowserEngine({ getPath: (name) => path.join(tmp, name === 'userData' ? 'userData' : name) }, {});
  return engine;
}

function makeStubFirefox(tmp) {
  const tree = path.join(tmp, 'userData', 'kernels', 'firefox', '141.0');
  const binary = path.join(tree, 'firefox', 'firefox');
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  const markerDir = path.join(tmp, 'markers');
  fs.mkdirSync(markerDir, { recursive: true });
  // One process with no polling subprocesses. Reading user.js proves the
  // pipeline wrote it before spawn. argv: -profile <root> --no-remote <url>
  fs.writeFileSync(binary, [
    '#!/usr/bin/env node',
    'const fs = require("node:fs");',
    'if (process.argv.includes("--version")) { console.log("Mozilla Firefox 141.0"); process.exit(0); }',
    'const root = process.argv[process.argv.indexOf("-profile") + 1];',
    'fs.copyFileSync(require("node:path").join(root, "user.js"), ' + JSON.stringify(path.join(markerDir, 'user.js.copy')) + ');',
    'fs.writeFileSync(' + JSON.stringify(path.join(markerDir, 'args.txt')) + ', process.argv.slice(2).join(" "));',
    'console.error("WebDriver BiDi listening on ws://127.0.0.1:12345");',
    'setInterval(() => {}, 10000);',
    '',
  ].join('\n'), { mode: 0o755 });
  fs.writeFileSync(path.join(tree, 'kernel.json'), JSON.stringify({
    engine: 'firefox', source: 'mozilla', version: '141.0',
  }));
  return { binary, tree, markerDir };
}

(async () => {
  if (!IS_LINUX) {
    console.log('SKIP Firefox pipeline fixture requires Linux');
    process.exitCode = 2;
    return;
  }
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-ffstart-'));
  const engine = await makeEngine(tmp);
  engine.ensureExitNetworkForLocale = async () => null;
  engine.prepareProfileProxyForStart = async (profile) => profile;
  // Exercise the production BiDi client and launch barriers without a network socket.
  const originalWebSocket = global.WebSocket;
  const commands = [];
  let rejectPreload = false;
  const remote = (value) => {
    if (value === null) return { type: 'null' };
    if (Array.isArray(value)) return { type: 'array', value: value.map(remote) };
    if (typeof value === 'object') return { type: 'object', value: Object.entries(value).map(([key, entry]) => [key, remote(entry)]) };
    return { type: typeof value, value };
  };
  global.WebSocket = class extends EventTarget {
    constructor() { super(); this.readyState = 0; queueMicrotask(() => { this.readyState = 1; this.dispatchEvent(new Event('open')); }); }
    close() { this.readyState = 3; this.dispatchEvent(new Event('close')); }
    send(text) {
      const command = JSON.parse(text);
      commands.push(command);
      if (command.method === 'browser.close') {
        setImmediate(() => engine.running.get('env-900')?.child.kill('SIGTERM'));
      }
      let result = {};
      if (command.method === 'script.addPreloadScript') result = { script: 'firefox-preload' };
      if (command.method === 'browsingContext.getTree') result = { contexts: [{ context: 'initial', url: 'about:blank' }] };
      if (command.method === 'browsingContext.create') result = { context: 'extra' };
      if (command.method === 'script.evaluate') {
        const fp = engine.running.get('env-900').fingerprint;
        result = { type: 'success', result: command.params.expression.includes('webglVendor: webglVendor')
          ? remote({ platform: fp.platform, userAgent: fp.userAgent, hardwareConcurrency: fp.hardwareConcurrency, languages: fp.languages, timezone: fp.timezone, vendor: '', screenWidth: fp.screen.width, screenHeight: fp.screen.height, devicePixelRatio: fp.screen.devicePixelRatio })
          : { type: 'undefined' } };
      }
      const response = rejectPreload && command.method === 'script.addPreloadScript'
        ? { type: 'error', id: command.id, error: 'unknown error', message: 'test preload rejected' }
        : { type: 'success', id: command.id, result };
      queueMicrotask(() => this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(response) })));
    }
  };
  const { binary, markerDir } = makeStubFirefox(tmp);

  // probe stubs: the stub is not a real browser.
  engine.kernelManager.probeFirefoxBinary = async () => ({ path: binary, version: '141.0', browser: 'Firefox 141.0' });
  engine.kernelManager.meta.pin = { engine: 'firefox', version: '141.0', source: 'mozilla', path: binary };
  // A profile that must run under Firefox.
  const profile = {
    id: 'env-900',
    name: 'env-900',
    number: 900,
    engine: 'firefox',
    os: 'Windows',
    language: 'en-US',
    networkMode: 'direct',
    proxy: 'Direct',
    advanced: { showInfoPage: false, multiOpen: false, startUrls: 'https://first.test\nhttps://second.test' },
    privacy: {},
  };
  engine.profiles.set('env-900', profile);

  const events = [];
  const unsubscribe = engine.on((event) => events.push(event));

  try {
    const started = await engine.start(profile);
    await check('start() launches via the firefox pipeline', () => {
      assert.strictEqual(started.running, true);
      assert.strictEqual(started.engine, 'firefox');
      assert.strictEqual(started.port, null);
      assert.ok(started.pid > 0);
    });

    const item = engine.running.get('env-900');
    await check('running item shape for firefox', () => {
      assert.strictEqual(item.engine, 'firefox');
      assert.strictEqual(item.cdpConnection, null);
      assert.strictEqual(item.port, null);
      assert.strictEqual(item.browser.engine, 'firefox');
      assert.ok(item.bidiConnection);
      assert.strictEqual(started.capabilities.fingerprintDelivery, true);
      assert.strictEqual(started.capabilities.workerFingerprintDelivery, 'prefs-fields-plus-proxy');
      assert.ok(item.workerMitmProxy);
      assert.match(item.fingerprint.userAgent, /Firefox\/141\.0$/);
    });

    await check('user.js written before spawn with proxy/UA/telemetry prefs', () => {
      const copied = fs.readFileSync(path.join(markerDir, 'user.js.copy'), 'utf8');
      assert.ok(copied.includes('user_pref("network.proxy.type", 1);'), 'manual proxy mode');
      assert.ok(copied.includes('user_pref("general.useragent.override",'), 'UA override');
      assert.ok(copied.includes('user_pref("app.update.enabled", false);'), 'no self-update');
      assert.ok(copied.includes('user_pref("toolkit.telemetry.enabled", false);'), 'no telemetry');
    });

    await check('launch args used -profile and --no-remote', () => {
      const args = fs.readFileSync(path.join(markerDir, 'args.txt'), 'utf8');
      assert.ok(args.includes('--no-remote'));
      assert.ok(args.includes('--remote-debugging-port=0'));
      assert.ok(!args.includes('https://'), 'startup URLs must not bypass preload');
    });
    await check('BiDi registers and verifies before both startup URLs navigate', () => {
      const registered = commands.findIndex((command) => command.method === 'script.addPreloadScript');
      const navigated = commands.findIndex((command) => command.method === 'browsingContext.navigate');
      assert.ok(registered >= 0 && navigated > registered);
      assert.equal(commands.filter((command) => command.method === 'browsingContext.navigate').length, 2);
    });

    await check('progress events were emitted', () => {
      const progress = events.filter((e) => e.type === 'profile-start-progress' && e.id === 'env-900');
      assert.ok(progress.some((e) => e.phase === 'ready' && e.percent === 100));
    });

    const stopped = await engine.stop('env-900');
    await check('stop() kills the firefox process and clears running', async () => {
      assert.strictEqual(stopped.running, false);
      assert.strictEqual(engine.running.has('env-900'), false);
      // process really gone
      await new Promise((r) => setTimeout(r, 300));
      let alive = false;
      try { process.kill(stopped.pid, 0); alive = true; } catch (_) {}
      assert.strictEqual(alive, false, 'stub firefox must be dead after stop');
      assert.strictEqual(item.workerMitmProxy.closed, true, 'worker listener must close on normal stop');
      assert.ok(commands.some((command) => command.method === 'browser.close'), 'Firefox stop uses native BiDi close');
    });
    await check('status event emitted after stop', () => {
      assert.ok(events.some((e) => e.type === 'status' && e.id === 'env-900' && e.running === false));
    });
    await check('a local Worker forwarder cannot satisfy a missing upstream proxy', async () => {
      const before = proxyResources.length;
      await assert.rejects(engine.start({ ...engine.profiles.get(profile.id), networkMode: 'proxy', proxy: 'Direct' }), { code: 'proxy-required' });
      assert.equal(proxyResources.length, before, 'invalid route rejected before local forwarder allocation');
      assert.equal(engine.running.has(profile.id), false);
    });
    for (const proxy of ['http://proxy.test:8080', 'https://proxy.test:8443', 'http://user:pass@proxy.test:8080', 'socks5://user:pass@proxy.test:1080']) {
      await check('upstream route retained: ' + new URL(proxy).protocol, async () => {
        const before = bridgeConfigs.length;
        const candidate = { ...engine.profiles.get(profile.id), networkMode: 'proxy', proxy };
        await engine.start(candidate);
        const current = engine.running.get(profile.id);
        assert.equal(bridgeConfigs.length, before + 1, 'every configured proxy must create a bridge');
        assert.equal(bridgeConfigs.at(-1).host, 'proxy.test');
        assert.deepEqual(Object.keys(current.workerMitmProxy.options.upstreamProxy).sort(), ['host', 'port'], 'credentials belong to the bridge');
        assert.equal(current.workerMitmProxy.options.upstreamProxy.host, '127.0.0.1');
        assert.equal(current.workerMitmProxy.options.upstreamProxy.port, current.proxyForwarder.port);
        await engine.stop(profile.id);
        assert.equal(current.workerMitmProxy.closed, true);
        assert.equal(current.proxyForwarder.closed, true);
      });
    }
    await check('failed CA trust blocks spawn and closes both proxies', async () => {
      rejectTrust = true;
      try {
        const before = commands.length;
        await assert.rejects(engine.start({ ...engine.profiles.get(profile.id) }), { code: 'WORKER_MITM_CA_IMPORT_FAILED' });
        assert.equal(commands.length, before, 'no browser commands before CA trust');
        assert.equal(engine.running.has(profile.id), false);
        assert.ok(proxyResources.every((resource) => resource.closed));
      } finally { rejectTrust = false; }
    });
    rejectPreload = true;
    const beforeFailure = commands.filter((command) => command.method === 'browsingContext.navigate').length;
    await assert.rejects(engine.start({ ...engine.profiles.get(profile.id) }), /test preload rejected/);
    await check('failed Firefox preload closes the browser without target navigation', () => {
      assert.equal(engine.running.has(profile.id), false);
      assert.equal(commands.filter((command) => command.method === 'browsingContext.navigate').length, beforeFailure);
      assert.ok(proxyResources.every((resource) => resource.closed), 'failed preload releases proxy resources');
    });
  } catch (error) {
    failed += 1;
    console.error('FAIL  pipeline crashed: ' + (error && error.stack || error));
  } finally {
    unsubscribe();
    await engine.stopAll().catch(() => {});
    global.WebSocket = originalWebSocket;
    proxyModule.startAuthenticatedProxy = originals.bridge;
    mitmModule.FirefoxWorkerMitmProxy = originals.mitm;
    trustModule.installFirefoxCa = originals.trust;
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }

  console.log(`\nfirefox-start-pipeline-selftest: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
