'use strict';

/**
 * Math / ECMAScript value-parity audit across engines and personas.
 *
 * Round 5 left one question open: the persona (a Windows claim on a Linux
 * host) inherits the HOST's libm for Math.* and Intl — is that a
 * contradiction a detector can hash? This probe answers it empirically:
 *
 *   A) STOCK Chrome vs STOCK Firefox on adversarial inputs — how much do the
 *      two engines' libm implementations differ at all (V8 is fdlibm-derived
 *      and largely platform-independent since the arm/mathintrin port;
 *      SpiderMonkey uses its own fdlibm copy).
 *   B) STOCK vs PERSONA per engine — persona must equal stock (the persona
 *      inherits the same host binary; any delta would be OUR noise leaking
 *      into math surfaces, which nothing currently patches).
 *   C) Known cross-browser divergences (sin(π), toFixed rounding,
 *      Date(0) toString, sort collation) quantified for the record.
 *
 * Report-only: exit 0 with findings, 1 on harness failure, 2 on skip.
 *
 * ARCHIVED FINDING (2026-11-12, Chrome 157 / Firefox 160 / Linux host):
 *   stock Chrome vs stock Firefox: 0 differing surfaces across ~24 probes —
 *   V8 and SpiderMonkey both derive these functions from fdlibm and are
 *   bit-identical across engines on this input set. A Windows persona on a
 *   Linux host therefore inherits host libm values that also match real
 *   Windows browsers for these surfaces: NOT a detectable contradiction.
 *   persona vs stock differs only on Date(0) toString/toLocaleString — the
 *   timezone spoof rendering EST, which is the intended behavior.
 */

const http = require('node:http');
const { buildPersona, launchPersonaBrowser, openPage, evaluate } = require('./selftests/native-gate-harness');
const { chooseChromiumBinary, Unavailable } = require('./selftests/native-gate-harness');
const { spawn } = require('node:child_process');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const cdp = require('../cdp');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROBE = `(() => {
  const E = (v) => (typeof v === 'number' ? v.toExponential(20) : String(v));
  const inputs = [-2.1e-7, Math.PI, 1e-300 * 1e-10, 0.5, 1e10 + 0.5, 123456789.123456789, 1e308, -1.0000000000000002, 710, 1e-10];
  const out = {
    sin: inputs.map((x) => E(Math.sin(x))),
    cos: inputs.map((x) => E(Math.cos(x))),
    tan: inputs.map((x) => E(Math.tan(x))),
    exp: inputs.map((x) => E(Math.exp(x))),
    log: inputs.map((x) => E(Math.log(Math.abs(x) || 1))),
    expm1: E(Math.expm1(1e-10)),
    log1p: E(Math.log1p(1e-20)),
    sinh: E(Math.sinh(710)),
    asinh: E(Math.asinh(1e300)),
    atan2: E(Math.atan2(1e-300, 1e300)),
    hypot: E(Math.hypot(1e308, 1e308)),
    fround: E(Math.fround(0.1)),
    imul: String(Math.imul(-1, 5)),
    pow: [E(Math.pow(Math.PI, -100)), E(Math.pow(0.7, 10))],
    toFixed: [(0.0000005).toFixed(7), (1.005).toFixed(2), (2.675).toFixed(2), (8.495).toFixed(2), (1.255).toFixed(2)],
    toPrecision: [(1234.5678).toPrecision(7), (0.000123456).toPrecision(9)],
    date0: new Date(0).toString(),
    date0Locale: new Date(0).toLocaleString('en-US'),
    numFormat: new Intl.NumberFormat('en-US').format(123456.789),
    collate: ['ä', 'a', 'z', 'A', 'ö', 'o'].sort().join('|'),
    collateLocale: ['ä', 'a', 'z', 'A', 'ö', 'o'].sort(new Intl.Collator('de').compare).join('|'),
  };
  return JSON.stringify(out);
})()`;

async function launchStockChrome(binary) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'math-stock-'));
  const args = ['--headless=new', '--disable-dev-shm-usage', '--user-data-dir=' + root, '--remote-debugging-port=0', 'about:blank'];
  if (process.env.OPENBROWSER_NATIVE_NO_SANDBOX === '1') args.push('--no-sandbox');
  const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  child._err = ''; child.stderr?.on('data', (d) => { child._err = (child._err + String(d)).slice(-2000); });
  let port;
  for (let i = 0; i < 150; i += 1) {
    if (child.exitCode !== null) throw new Error('stock chromium exited: ' + (child._err || ''));
    try { port = Number((await fsp.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch (_) {}
    if (port) break;
    await delay(100);
  }
  if (!port) { child.kill('SIGKILL'); throw new Error('stock chromium never published CDP'); }
  return { child, port, close: async () => { child.kill('SIGKILL'); await fsp.rm(root, { recursive: true, force: true }).catch(() => {}); } };
}

(async () => {
  let chromeStock, personaSession, srv;
  try {
    const chromeBinary = process.env.OPENBROWSER_CHROMIUM_BINARY || chooseChromiumBinary().binary;
    const ffBinary = process.env.OPENBROWSER_FIREFOX_BINARY;
    if (!ffBinary || !(await fsp.stat(ffBinary).catch(() => null))) {
      console.error('SKIP Set OPENBROWSER_FIREFOX_BINARY for the cross-engine leg.');
      process.exit(2);
    }
    srv = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><body>m</body></html>'); });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const origin = 'http://127.0.0.1:' + srv.address().port;

    // A) stock chrome
    chromeStock = await launchStockChrome(chromeBinary);
    const csTab = (await cdp.tabs(chromeStock.port))[0];
    const csConn = await cdp.connect(csTab.webSocketDebuggerUrl);
    await csConn.command('Page.navigate', { url: origin + '/' });
    await delay(400);
    const stockChrome = JSON.parse((await csConn.command('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value);
    csConn.close();

    // B) persona chrome (Windows claim on Linux host)
    const browser = { binary: chromeBinary, version: '157' };
    const persona = buildPersona('math-parity', { os: 'Windows', timezone: 'America/New_York' });
    personaSession = await launchPersonaBrowser(browser, persona);
    const pConn = await openPage(personaSession.port, origin + '/');
    await delay(400);
    const personaChrome = JSON.parse(await evaluate(pConn, PROBE));

    // C) stock firefox via the audit's own stock-launch pattern (no persona)
    const { buildFirefoxUserJs, firefoxStartupArgs } = require('./kernel-versions');
    const { BidiConnection, waitForFirefoxEndpoint, evaluateBidi } = require('../network/bidi-connection');
    const ffRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'math-ff-'));
    await fsp.writeFile(path.join(ffRoot, 'user.js'), buildFirefoxUserJs({
      userAgent: '', acceptLanguages: 'en-US,en', locale: 'en-US', proxyEndpoint: '', noProxyHosts: '',
      extraPrefs: [['network.captive-portal-service.enabled', false], ['network.connectivity-service.enabled', false]],
    }), { mode: 0o600 });
    const ffChild = spawn(ffBinary, firefoxStartupArgs({ root: ffRoot, startUrl: 'about:blank', headless: true, remoteDebugging: true }), { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TZ: 'UTC' } });
    const wsUrl = await waitForFirefoxEndpoint(ffChild, 30000);
    const ffConn = new BidiConnection(wsUrl, {});
    await ffConn.open();
    await ffConn.command('session.new', { capabilities: { alwaysMatch: {} } });
    const ctx = await ffConn.command('browsingContext.create', { url: origin + '/', type: 'tab' });
    await delay(800);
    const stockFirefox = JSON.parse(await evaluateBidi(ffConn, { context: ctx.context }, PROBE));
    ffConn.close(); ffChild.kill('SIGKILL');

    // Report: engine-vs-engine deltas, persona-vs-stock deltas
    const diffs = (a, b) => Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    const chromeVsFirefox = diffs(stockChrome, stockFirefox);
    const chromeStockVsPersona = diffs(stockChrome, personaChrome);
    console.log('===== MATH VALUE PARITY =====');
    console.log('stock Chrome  vs stock Firefox :', chromeVsFirefox.length, 'differing surfaces:', JSON.stringify(chromeVsFirefox));
    console.log('stock Chrome  vs persona Chrome :', chromeStockVsPersona.length, 'differing surfaces:', JSON.stringify(chromeStockVsPersona));
    for (const k of chromeVsFirefox.slice(0, 6)) {
      console.log('  [engine-delta] ' + k + ': chrome=' + JSON.stringify(stockChrome[k]).slice(0, 90) + ' firefox=' + JSON.stringify(stockFirefox[k]).slice(0, 90));
    }
    console.log('=============================');
  } catch (error) {
    if (error instanceof Unavailable) { console.error('SKIP ' + error.message); process.exit(2); }
    console.error('FAIL harness: ' + (error && error.stack || error)); process.exit(1);
  } finally {
    try { await chromeStock?.close(); } catch (_) {}
    try { await personaSession?.close(); } catch (_) {}
    srv?.close?.();
  }
  process.exit(0);
})();
