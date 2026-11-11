#!/usr/bin/env node
'use strict';

/**
 * E2E selftest for the Firefox launch pipeline (engine/_startFirefox) on
 * linux/x64 with a stub Firefox binary:
 *
 *   stub "firefox" = a shell script that copies a marker file and sleeps until
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
  // Copy prefs out, then idle until killed. Reading user.js proves the
  // pipeline wrote it before spawn. argv: -profile <root> --no-remote <url>
  fs.writeFileSync(binary, [
    '#!/bin/sh',
    'P="$1"',
    '[ "$P" = "--version" ] && { echo "Mozilla Firefox 141.0"; exit 0; }',
    'ROOT="$2"',
    'cp "$ROOT/user.js" "' + markerDir + '/user.js.copy" 2>/dev/null',
    'echo "$@" > "' + markerDir + '/args.txt"',
    'echo "WebDriver BiDi listening on ws://127.0.0.1:12345" >&2',
    'while :; do sleep 0.2; done',
    'exit 0',
    '',
  ].join('\n'), { mode: 0o755 });
  fs.writeFileSync(path.join(tree, 'kernel.json'), JSON.stringify({
    engine: 'firefox', source: 'mozilla', version: '141.0',
  }));
  return { binary, tree, markerDir };
}

(async () => {
  if (!IS_LINUX) {
    console.log('firefox-start-pipeline-selftest: skipped (linux only)');
    return;
  }
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-ffstart-'));
  const engine = await makeEngine(tmp);
  engine.ensureExitNetworkForLocale = async () => null;
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
      assert.strictEqual(started.capabilities.workerFingerprintDelivery, false);
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
    });
    await check('status event emitted after stop', () => {
      assert.ok(events.some((e) => e.type === 'status' && e.id === 'env-900' && e.running === false));
    });
    rejectPreload = true;
    const beforeFailure = commands.filter((command) => command.method === 'browsingContext.navigate').length;
    await assert.rejects(engine.start(profile), /test preload rejected/);
    await check('failed Firefox preload closes the browser without target navigation', () => {
      assert.equal(engine.running.has(profile.id), false);
      assert.equal(commands.filter((command) => command.method === 'browsingContext.navigate').length, beforeFailure);
    });
  } catch (error) {
    failed += 1;
    console.error('FAIL  pipeline crashed: ' + (error && error.stack || error));
  } finally {
    unsubscribe();
    await engine.stopAll().catch(() => {});
    global.WebSocket = originalWebSocket;
    await fsp.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }

  console.log(`\nfirefox-start-pipeline-selftest: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
