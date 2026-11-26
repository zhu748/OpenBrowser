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
 * Verifies: user.js written with direct connection, UA and telemetry prefs before spawn,
 * running item shape (engine:'firefox', port:null, connection:null), start
 * progress events, stop() kills the process and releases the profile lock, and
 * startup diagnostics are written on failure.
 */

const { LIVE_PROBE_EXPRESSION } = require('../fingerprint/delivery-probe');
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
const originalBridge = proxyModule.startAuthenticatedProxy;
const proxyResources = [];
const bridgeConfigs = [];
class ProxyFixture {
  constructor() { proxyResources.push(this); }
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
const { BrowserEngine } = require('../../engine');
const { writeFirefoxLaunchPreferences } = require('../../engine/launch-preferences');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');

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
  let reportedVersion = '141.0';
  let rejectPreload = false;
  let rejectFilter = false;
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
      if (command.method === 'session.new') result = { capabilities: { browserVersion: reportedVersion } };
      if (command.method === 'script.addPreloadScript') result = { script: 'firefox-preload' };
      if (command.method === 'webExtension.install') result = { extension: 'local-workers@openbrowser.local' };
      if (command.method === 'browsingContext.getTree') result = { contexts: [{ context: 'initial', url: 'about:blank' }] };
      if (command.method === 'browsingContext.create') result = { context: 'extra' };
      if (command.method === 'script.evaluate') {
        const fp = engine.running.get('env-900').fingerprint;
        result = { type: 'success', result: command.params.expression.includes(LIVE_PROBE_EXPRESSION)
          ? remote({ platform: fp.platform, userAgent: fp.userAgent, hardwareConcurrency: fp.hardwareConcurrency, languages: fp.languages, timezone: fp.timezone, vendor: '', screenWidth: fp.screen.width, screenHeight: fp.screen.height, devicePixelRatio: fp.screen.devicePixelRatio })
          : { type: 'undefined' } };
      }
      const response = rejectFilter && command.method === 'webExtension.install'
        ? { type: 'error', id: command.id, error: 'unknown error', message: 'test Worker filter rejected' }
        : rejectPreload && command.method === 'script.addPreloadScript'
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
    privacy: { fingerprint: { languages: ['de-DE', 'en-US'] } },
  };
  engine.profiles.set('env-900', profile);

  const events = [];
  const unsubscribe = engine.on((event) => events.push(event));

  try {
    await check('restoring Firefox defaults clears only the released preferences', async () => {
      const root = path.join(tmp, 'firefox-prefs-restore');
      await fsp.mkdir(root);
      const filename = path.join(root, 'prefs.js');
      const unchanged = '// native preferences\r\nuser_pref("permissions.default.camera.example", 1);\r\n'
        + 'user_pref("browser.startup.custom", "a; b");\r\nuser_pref("media.block-autoplay-until-user-interaction", true);\r\n';
      await fsp.writeFile(filename, unchanged + '  user_pref("dom.maxHardwareConcurrency", 2);\r\n'
        + 'user_pref("permissions.default.desktop-notification", 2);\r\nuser_pref("permissions.default.camera", 2);\r\n'
        + 'user_pref("permissions.default.microphone", 2);\r\nuser_pref("font.minimum-size.x-western", 30);');
      const next = { privacy: { media: 'real', fontMode: 'default' }, advanced: { blockVideo: true, blockNotifications: false } };
      const native = { platform: 'Linux x86_64', webrtc: 'real', hardwareConcurrency: null };
      await writeFirefoxLaunchPreferences(root, { extraPrefs: firefoxExtraUserPrefs(next, native) });
      assert.strictEqual(await fsp.readFile(filename, 'utf8'), unchanged);
      const startup = await fsp.readFile(path.join(root, 'user.js'), 'utf8');
      assert.match(startup, /user_pref\("media\.block-autoplay-until-user-interaction", true\);/);
      assert.ok(!startup.includes('undefined'));
      await writeFirefoxLaunchPreferences(root, { extraPrefs: firefoxExtraUserPrefs({ ...next, advanced: {} }, native) });
      assert.strictEqual(await fsp.readFile(filename, 'utf8'), unchanged.replace(/user_pref\("media\..*\);\r\n/, ''));
    });
    await check('invalid fingerprint leaves existing browser data intact', async () => {
      const root = engine.profileRoot(profile.id);
      const cookies = path.join(root, 'cookies.sqlite');
      const invalid = { ...profile, userAgent: 'Mozilla/5.0 Gecko/20100101 Firefox/100.0',
        advanced: { ...profile.advanced, clearCookiesOnStart: true, saveCookies: false } };
      await fsp.mkdir(root, { recursive: true });
      await fsp.writeFile(cookies, 'existing cookies');
      await engine.syncProfiles([invalid]);
      try {
        await assert.rejects(engine.start(invalid), { code: 'FINGERPRINT_CONFIG_INVALID' });
        assert.equal(await fsp.readFile(cookies, 'utf8'), 'existing cookies');
        assert.equal(engine.running.has(profile.id), false);
      } finally {
        await fsp.rm(cookies, { force: true });
        await engine.syncProfiles([profile]);
      }
    });
    await check('mismatched Firefox runtime version blocks preload and startup navigation', async () => {
      const before = commands.length;
      reportedVersion = '140.0';
      try {
        await assert.rejects(engine.start(profile), { code: 'KERNEL_VERSION_MISMATCH' });
        assert.equal(engine.running.has(profile.id), false);
        assert.equal(commands.slice(before).some(command => ['script.addPreloadScript', 'browsingContext.navigate'].includes(command.method)), false);
      } finally {
        reportedVersion = '141.0';
      }
    });
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
      assert.strictEqual(started.capabilities.workerFingerprintDelivery, 'browser-response-filter');
      assert.strictEqual(started.capabilities.externalHttpsTransport, 'native');
      assert.strictEqual(started.capabilities.localWorkerResponseFilter, true);
      assert.equal(item.proxyForwarder, null, 'direct mode uses the Firefox network stack');
      assert.match(item.fingerprint.userAgent, /Firefox\/141\.0$/);
    });

    await check('user.js written before spawn with direct connection, UA and telemetry prefs', () => {
      const copied = fs.readFileSync(path.join(markerDir, 'user.js.copy'), 'utf8');
      assert.ok(copied.includes('user_pref("network.proxy.type", 1);'), 'direct mode uses empty manual endpoints');
      assert.ok(copied.includes('user_pref("network.proxy.ssl", "");'), 'do not inherit a previous launch proxy');
      assert.ok(copied.includes('user_pref("general.useragent.override",'), 'UA override');
      assert.ok(copied.includes('user_pref("intl.accept_languages", "de-DE,en-US");'), 'native language list');
      assert.ok(copied.includes('user_pref("intl.locale.requested", "de-DE");'), 'native locale follows the resolved list');
      assert.ok(copied.includes('user_pref("dom.maxHardwareConcurrency", ' + item.fingerprint.hardwareConcurrency + ');'), 'native CPU cap');
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
      const installed = commands.findIndex((command) => command.method === 'webExtension.install');
      const registered = commands.findIndex((command) => command.method === 'script.addPreloadScript');
      const navigated = commands.findIndex((command) => command.method === 'browsingContext.navigate');
      assert.ok(installed >= 0 && registered > installed && navigated > registered);
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
      assert.ok(commands.some((command) => command.method === 'browser.close'), 'Firefox stop uses native BiDi close');
    });
    await check('status event emitted after stop', () => {
      assert.ok(events.some((e) => e.type === 'status' && e.id === 'env-900' && e.running === false));
    });
    await check('a missing required upstream proxy blocks launch', async () => {
      const before = proxyResources.length;
      await assert.rejects(engine.start({ ...engine.profiles.get(profile.id), networkMode: 'proxy', proxy: 'Direct' }), { code: 'proxy-required' });
      assert.equal(proxyResources.length, before, 'invalid route rejected before bridge allocation');
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
        const prefs = fs.readFileSync(path.join(markerDir, 'user.js.copy'), 'utf8');
        assert.ok(prefs.includes('user_pref("network.proxy.type", 1);'));
        assert.ok(prefs.includes('user_pref("network.proxy.ssl_port", ' + current.proxyForwarder.port + ');'));
        assert.doesNotMatch(prefs, /proxy\.test|user:pass/);
        await engine.stop(profile.id);
        assert.equal(current.proxyForwarder.closed, true);
      });
    }
    await check('failed Worker filter blocks navigation and closes the explicit proxy bridge', async () => {
      rejectFilter = true;
      try {
        const before = commands.filter(command => command.method === 'browsingContext.navigate').length;
        const candidate = { ...engine.profiles.get(profile.id), networkMode: 'proxy', proxy: 'http://proxy.test:8080' };
        await assert.rejects(engine.start(candidate), /test Worker filter rejected/);
        assert.equal(commands.filter(command => command.method === 'browsingContext.navigate').length, before);
        assert.equal(engine.running.has(profile.id), false);
        assert.ok(proxyResources.every(resource => resource.closed));
      } finally { rejectFilter = false; }
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
    proxyModule.startAuthenticatedProxy = originalBridge;
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }

  console.log(`\nfirefox-start-pipeline-selftest: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
