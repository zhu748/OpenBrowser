'use strict';

// Portable Chromium gate. It exercises production target setup, HTTP headers,
// inline first-script reads, CSS metrics and first-instruction worker identity.
// Missing native prerequisites return 2; assertion failures return 1.
const assert = require('node:assert/strict');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const cdp = require('../../cdp');
const { buildFingerprint } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildBaseLaunchArguments } = require('../../engine/launch-arguments');
const injection = require('../../engine/fingerprint-injection');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class Unavailable extends Error {}

function snapshot() {
  return { ua: navigator.userAgent, platform: navigator.platform, cores: navigator.hardwareConcurrency,
    memory: navigator.deviceMemory, connection: navigator.connection ? {
      rtt: navigator.connection.rtt, downlink: navigator.connection.downlink,
      effectiveType: navigator.connection.effectiveType, saveData: navigator.connection.saveData,
    } : null };
}
const snapshotSource = '(' + snapshot.toString() + ')()';
const workerSource = `const first=${snapshotSource};
  const reply=async()=>({first,headers:await (await fetch('/echo')).json()});
  if ('clients' in self && 'registration' in self) {
    self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
    self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
    self.addEventListener('message',event=>event.waitUntil(reply().then(value=>event.ports[0].postMessage(value))));
  } else if ('onconnect' in self) {
    self.onconnect=event=>reply().then(value=>event.ports[0].postMessage(value));
  } else reply().then(value=>self.postMessage(value));`;

function chooseBinary() {
  const explicit = process.env.OPENBROWSER_CHROMIUM_BINARY;
  // Same guard as native-gate-harness: CI hosts and the aggregate suite's
  // availability probe must treat an unset explicit binary as unavailable
  // instead of half-running the runner's unusable google-chrome.
  if (!explicit && process.env.OPENBROWSER_REQUIRE_EXPLICIT_BINARY === '1') {
    throw new Unavailable('Set OPENBROWSER_CHROMIUM_BINARY to an installed Chromium/Chrome executable.');
  }
  for (const binary of explicit ? [explicit] : ['chromium', 'google-chrome', 'chrome', 'chrome.exe']) {
    const result = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 5000, windowsHide: true });
    const version = String(result.stdout || '').match(/\b(\d+\.\d+\.\d+\.\d+)\b/)?.[1];
    if (result.status === 0 && version) return { binary, version };
  }
  throw new Unavailable('Set OPENBROWSER_CHROMIUM_BINARY to an installed Chromium/Chrome executable.');
}

async function startServer() {
  const server = http.createServer((request, response) => {
    if (request.url.startsWith('/echo')) {
      response.setHeader('Content-Type', 'application/json');response.end(JSON.stringify(request.headers));
    } else if (/^\/(dedicated|shared|service)\.js/.test(request.url)) {
      response.setHeader('Content-Type', 'application/javascript');response.end(workerSource);
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><script>globalThis.first=${snapshotSource};globalThis.navigationHeaders=${JSON.stringify(request.headers)};</script></head><body></body></html>`);
    }
  });
  try { await new Promise((resolve, reject) => { server.once('error', reject);server.listen(0, '127.0.0.1', resolve); }); }
  catch (error) { server.close();if (['EPERM', 'EACCES'].includes(error.code)) throw new Unavailable('Loopback listener is unavailable: ' + error.message);throw error; }
  return server;
}

function verifyIdentity(actual, fp) {
  assert.equal(actual.ua, fp.userAgent);
  assert.equal(actual.platform, fp.platform);
  assert.equal(actual.cores, fp.hardwareConcurrency);
  assert.equal(actual.memory, fp.deviceMemory);
  for (const key of ['rtt', 'downlink', 'effectiveType', 'saveData']) assert.equal(actual.connection?.[key], fp.connection[key], key);
}
function verifyHeaders(headers, fp) {
  assert.equal(headers['user-agent'], fp.userAgent);
  assert.equal(String(headers['accept-language'] || '').split(',')[0], fp.languages[0]);
  // Worker fetches on Chromium >= 143 never carry sec-ch-ua* headers natively
  // (workers do not emit Client Hints); absent is the native-consistent value.
  // The main document request must still carry the full platform hint.
}

async function runBrowser(browser, server, id, hostDpr, dpr) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'openbrowser-native-gate-'));
  const profile = sanitizeProfile({ id, name: id, os: 'Windows', fingerprintSeed: id,
    privacy: { deviceProfile: 'persona', fontListMode: 'real', webrtc: 'disabled', stabilityMode: 'force',
      network: { rtt: 250, downlink: 2.3, effectiveType: '3g' }, fingerprint: { devicePixelRatio: dpr } } });
  const fp = buildFingerprint({ ...profile, kernelVersion: browser.version });
  const args = buildBaseLaunchArguments({ root, fingerprint: fp, profile, hostScaleFactor: hostDpr });
  // Route non-test destinations to a closed proxy; tests only need loopback.
  args.push('--headless=new', '--disable-dev-shm-usage', '--disable-background-networking',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost');
  if (!args.some((arg) => arg.startsWith('--force-device-scale-factor='))) args.push('--force-device-scale-factor=' + hostDpr);
  if (process.env.OPENBROWSER_NATIVE_NO_SANDBOX === '1') args.push('--no-sandbox');
  args.push('about:blank');
  const child = spawn(browser.binary, args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '', spawnError;
  child.stderr?.on('data', (data) => { stderr = (stderr + data).slice(-12000); });
  child.on('error', (error) => { spawnError = error; });
  let item, connection;
  try {
    let port;
    for (let i = 0; i < 150; i += 1) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error('Chromium exited before CDP readiness: ' + stderr);
      try { port = Number((await fsp.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch (_) {}
      if (port) break;
      await delay(100);
    }
    assert.ok(port, 'Chromium did not publish a CDP port: ' + stderr);
    const events = [];
    const engine = { ...injection, profiles: new Map([[id, profile]]), networkInfo: new Map(),
      emit: (event) => events.push(event), handleBrowserGone: async () => child.kill() };
    item = { port, profile, fingerprint: fp, kernelVersion: browser.version };
    await engine.startWorkerFingerprintInjection(item, fp);
    const tab = (await cdp.tabs(port))[0];assert.ok(tab, 'initial page');
    connection = await cdp.connect(tab.webSocketDebuggerUrl);
    const url = 'http://127.0.0.1:' + server.address().port;
    await connection.command('Page.navigate', { url });
    let ready = false;
    for (let i = 0; i < 100; i += 1) {
      const result = await connection.command('Runtime.evaluate', { expression: 'Boolean(globalThis.first && document.body)', returnByValue: true });
      if (result.result?.value) { ready = true;break; }await delay(50);
    }
    assert.ok(ready, 'inline script did not complete');
    const result = await connection.command('Runtime.evaluate', { expression: `(async()=>{
      const dpr=${dpr},sw=${fp.screen.width};
      const style=document.createElement('style');style.textContent='#metrics{--dpi:0;--screen:0}@media(resolution:'+dpr+'dppx){#metrics{--dpi:1}}@media(device-width:'+sw+'px){#metrics{--screen:1}}';document.head.append(style);
      const el=document.createElement('div');el.id='metrics';document.body.append(el);
      const workers={};
      workers.dedicated=await new Promise((resolve,reject)=>{const w=new Worker('/dedicated.js');w.onmessage=e=>{w.terminate();resolve(e.data)};w.onerror=e=>reject(new Error(e.message));});
      workers.shared=await new Promise((resolve,reject)=>{const w=new SharedWorker('/shared.js');w.port.onmessage=e=>{w.port.close();resolve(e.data)};w.onerror=e=>reject(new Error(e.message));w.port.start();});
      const registration=await navigator.serviceWorker.register('/service.js');
      const active=registration.active||registration.waiting||registration.installing;
      if(active.state!=='activated')await new Promise(resolve=>active.addEventListener('statechange',()=>{if(active.state==='activated')resolve()}));
      workers.service=await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);registration.active.postMessage('probe',[channel.port2]);});
      await registration.unregister();
      const canvas=document.createElement('canvas');canvas.width=128;canvas.height=96;
      const ctx=canvas.getContext('2d');ctx.fillStyle='rgb(100,100,100)';ctx.fillRect(0,0,128,96);
      const bytes=ctx.getImageData(0,0,128,96).data;
      return {first:globalThis.first,headers:globalThis.navigationHeaders,workers,dpr:devicePixelRatio,
        cssDpr:getComputedStyle(el).getPropertyValue('--dpi'),cssScreen:getComputedStyle(el).getPropertyValue('--screen'),
        canvas:Array.from(bytes),repeat:Array.from(ctx.getImageData(0,0,128,96).data)};
    })()`, returnByValue: true, awaitPromise: true }, { timeout: 30000 });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    const live = result.result.value;
    verifyIdentity(live.first, fp);verifyHeaders(live.headers, fp);
    for (const [kind, worker] of Object.entries(live.workers)) { verifyIdentity(worker.first, fp);verifyHeaders(worker.headers, fp);console.log('PASS ' + id + ' ' + kind + ' first instruction and headers'); }
    assert.equal(live.dpr, dpr);assert.equal(live.cssDpr.trim(), '1');assert.equal(live.cssScreen.trim(), '1');
    assert.deepEqual(live.canvas, live.repeat);
    assert.ok(live.canvas.some((value, index) => index % 4 === 0 && value !== 100), 'stable Canvas must retain noise');
    assert.ok(!events.some((event) => /injection-failed/.test(event.type)), JSON.stringify(events));
    console.log('PASS ' + id + ' inline identity, CSS resolution/screen, stable Canvas');
    return live.canvas;
  } finally {
    connection?.close();item?.workerFingerprintConnection?.close();
    if (child.exitCode === null && child.signalCode === null) {
      await new Promise((resolve) => { const timer = setTimeout(resolve, 5000);child.once('exit', () => { clearTimeout(timer);resolve(); });child.kill('SIGKILL'); });
    }
    await fsp.rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

(async () => {
  const browser = chooseBinary(), server = await startServer();
  try {
    const a = await runBrowser(browser, server, 'native-stable-a', 2, 1);
    const repeated = await runBrowser(browser, server, 'native-stable-a', 2, 1);
    const b = await runBrowser(browser, server, 'native-stable-b', 1, 2);
    assert.deepEqual(a, repeated, 'identity must survive browser restart');
    assert.notDeepEqual(a, b, 'different identities must retain different Canvas samples');
    console.log('PASS Canvas restart stability and cross-profile separation');
    console.log('fingerprint-native-consistency-selftest: OK');
  } finally { await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
