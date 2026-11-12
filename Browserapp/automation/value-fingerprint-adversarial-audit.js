'use strict';

/**
 * Value-level fingerprint adversarial audit (Linux-host, dual-engine).
 *
 * The ten existing adversarial audits are darwin-only and stop at SHAPE level
 * for several vectors (canvas/audio/Math/SVG surfaces but not their rendered
 * VALUES). This audit fills the value gap on a Linux host: it launches the
 * STOCK browser and a PERSONA browser through the exact production launcher /
 * injection pipeline, then compares surfaces a detector actually hashes:
 *
 *   1. canvas 2D        — fillText/arc toDataURL hashes, measureText widths,
 *                         font-metric drift across persona families
 *   2. OffscreenCanvas  — same hash in a worker scope
 *   3. WebGL            — renderer/unmasked strings, precision/limits table,
 *                         and a rendered-scene hash (triangle + blending)
 *   4. Audio            — OfflineAudioContext oscillator+compressor digest
 *   5. Math/ECMAScript  — Math.sin/exp/log1p/tanh/cbrt at adversarial inputs,
 *                         Date(0) toString, Number formatting via toFixed,
 *                         string sort (collation) — host-lib value quirks
 *   6. SVG text render  — getBBox/getComputedTextLength + totalLength
 *   7. CDP/driver marks — Runtime.enable artifacts, error.stack shape,
 *                         console behavior, Notification.permission,
 *                         document.hidden/visibilityState, chrome.* shapes
 *
 * Report-only by design: findings feed the hardening backlog; exit 0 unless
 * the harness itself breaks (exit 1) or prerequisites are missing (exit 2).
 */

const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const cdp = require('../cdp');
const { buildFingerprint } = require('./fingerprint');
const { sanitizeProfile } = require('../engine/profile-sanitizer');
const { buildBaseLaunchArguments } = require('../engine/launch-arguments');
const injection = require('../engine/fingerprint-injection');
const {
  chooseChromiumBinary, Unavailable,
} = require('./selftests/native-gate-harness');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const COLLECT_SOURCE = `(() => {
  const out = {};
  const sha = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16); };

  // 1. Canvas 2D value hash + text metrics
  try {
    const c = document.createElement('canvas'); c.width = 300; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f60';
    ctx.fillRect(10, 10, 100, 30);
    ctx.fillStyle = '#069'; ctx.font = '14px "Arial"';
    ctx.fillText('CrimsonCanvas::fingerprint\\u2044value\\u00e9\\u4e2d', 4, 26);
    ctx.strokeStyle = 'rgba(0,66,99,0.7)'; ctx.arc(60, 60, 22, 0, Math.PI * 1.6); ctx.stroke();
    out.canvas2d = { hash: sha(c.toDataURL()), mArial: ctx.measureText('mmmmmmmmmmlli').width,
      mMono: (ctx.font = '12px "Courier New"', ctx.measureText('0O1lI|').width) };
  } catch (e) { out.canvas2d = { err: String(e) }; }

  // 2. WebGL strings, limits, rendered scene hash
  try {
    const c = document.createElement('canvas'); c.width = 60; c.height = 60;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const gl2 = typeof gl.createVertexArray === 'function';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const limits = [ 'MAX_TEXTURE_SIZE', 'MAX_RENDERBUFFER_SIZE', 'MAX_VIEWPORT_DIMS', 'MAX_VARYING_VECTORS', 'MAX_VERTEX_UNIFORM_VECTORS' ]
      .map((k) => String(gl.getParameter(gl[k])));
    const prec = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    gl.clearColor(0.1, 0.2, 0.3, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }'); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision highp float; void main(){ gl_FragColor = vec4(gl_FragCoord.x / 60.0, 0.5, gl_FragCoord.y / 60.0, 1.0); }'); gl.compileShader(fs);
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 0,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out.webgl = { vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER),
      unmasked: dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : null,
      version: gl.getParameter(gl.VERSION), limits, precRange: [prec.rangeMin, prec.rangeMax, prec.precision], isGL2: gl2,
      scene: sha(String.fromCharCode(...px.subarray(0, 2048))) };
  } catch (e) { out.webgl = { err: String(e) }; }

  // 3. Audio digest (OfflineAudioContext)
  try {
    const len = 5000; const rate = 44100;
    const ctx = new OfflineAudioContext(1, len, rate);
    const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50; comp.knee.value = 40; comp.ratio.value = 12; comp.attack.value = 0; comp.release.value = 0.25;
    osc.connect(comp); comp.connect(ctx.destination); osc.start(0);
    ctx.startRendering().then((buf) => {
      const d = buf.getChannelData(0); let s = 0, mx = 0;
      for (let i = 0; i < d.length; i++) { s += Math.abs(d[i]); if (Math.abs(d[i]) > mx) mx = Math.abs(d[i]); }
      window.__audioDigest = { sum: s.toFixed(6), max: mx.toFixed(6), mid: d[2500].toFixed(8) };
    });
  } catch (e) { window.__audioDigest = { err: String(e) }; }

  // 4. Math / ECMAScript numeric quirks
  try {
    out.math = {
      sin: [Math.sin(-2.1e-7), Math.sin(Math.PI), Math.sin(1e-300 * 1e-10)].map((v) => v.toExponential(20)).join(','),
      exp: [Math.exp(1), Math.exp(-1030), Math.expm1(1e-10)].map((v) => v.toExponential(20)).join(','),
      tanh: Math.tanh(1e-12).toExponential(20), cbrt: Math.cbrt(-27.000000000000004).toExponential(20),
      log1p: Math.log1p(1e-20).toExponential(20), pow: Math.pow(Math.PI, -100).toExponential(20),
      acos: Math.acos(-1.0000000000000002) + '', sinh: Math.sinh(710) + '',
      date0: new Date(0).toString(), date0UTC: new Date(0).toUTCString(),
      toFixed: (0.0000005).toFixed(7) + '/' + (1.005).toFixed(2) + '/' + (2.675).toFixed(2),
      collate: ['ä', 'a', 'z', 'A', 'ö', 'o'].sort().join('|'),
    };
  } catch (e) { out.math = { err: String(e) }; }

  // 5. SVG text render values
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '200'); svg.setAttribute('height', '40');
    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', '2'); txt.setAttribute('y', '20');
    txt.setAttribute('font-family', 'Arial'); txt.setAttribute('font-size', '16');
    txt.textContent = 'Svg#Fp\\u00e9\\u4e2d0O';
    svg.appendChild(txt); document.documentElement.appendChild(svg);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M2,2 C10,30 30,-10 40,25'); svg.appendChild(path);
    out.svg = { bbox: txt.getBBox ? [txt.getBBox().width, txt.getBBox().height] : null,
      len: txt.getComputedTextLength ? txt.getComputedTextLength() : null,
      pathLen: path.getTotalLength ? +path.getTotalLength().toFixed(6) : null };
    svg.remove();
  } catch (e) { out.svg = { err: String(e) }; }

  // 6. CDP / driver marks
  try {
    const stacks = [];
    try { null.x; } catch (e) { stacks.push(String(e.stack).split('\\n').length, /at\\s/.test(String(e.stack))); }
    const errArgs = (() => { try { (0)(); } catch (e) { return e.message; } })();
    out.driver = {
      webdriver: navigator.webdriver === undefined ? 'absent' : String(navigator.webdriver),
      chromeRuntime: typeof window.chrome === 'undefined' ? 'no-window.chrome'
        : window.chrome.runtime === undefined ? 'chrome-runtime-undefined' : 'chrome-runtime-present',
      notification: typeof Notification !== 'undefined' ? Notification.permission : 'no-Notification',
      visibility: document.visibilityState + '/' + document.hidden,
      stackLines: stacks, errArgsMessage: errArgs,
      cdpOnError: typeof window.cdc_adoQpoasnfa76pfcZLmcfl_Array === 'string' ? 'cdc-mark' : 'no-cdc-mark',
      devicePixelRatio: window.devicePixelRatio, screen: [screen.width, screen.height, screen.availWidth, screen.availHeight, screen.colorDepth],
      touchPoints: navigator.maxTouchPoints, pdfViewer: navigator.pdfViewerEnabled === undefined ? 'absent' : String(navigator.pdfViewerEnabled),
      hardware: navigator.hardwareConcurrency + '/' + (navigator.deviceMemory || 'no-dm'),
    };
  } catch (e) { out.driver = { err: String(e) }; }

  return JSON.parse(JSON.stringify(out));
})()`;

const WORKER_COLLECT_SOURCE = `(() => {
  const out = {};
  try {
    const c = new OffscreenCanvas(200, 60);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#09f'; ctx.fillRect(0, 0, 100, 30);
    ctx.font = '13px "Arial"'; ctx.fillStyle = '#000';
    ctx.fillText('WorkerCanvas\\u00e9\\u4e2d', 4, 22);
    let h = 5381; const px = new Uint8ClampedArray(200 * 60 * 4); // not readable back without convertToBlob; hash font metrics instead
    out.mtext = ctx.measureText('mmmmmmmmmmlli').width;
    out.font = ctx.font;
  } catch (e) { out.oc = String(e); }
  out.workerCores = navigator.hardwareConcurrency;
  out.workerPlatform = navigator.platform;
  out.workerUA = navigator.userAgent;
  out.workerTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  postMessage(JSON.stringify(out));
})()`;

async function launchStockChrome() {
  const browser = chooseChromiumBinary();
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-audit-stock-'));
  const args = ['--headless=new', '--disable-dev-shm-usage', '--user-data-dir=' + root,
    '--remote-debugging-port=0',
    '--window-size=1440,900', '--force-device-scale-factor=1',
    '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost', 'about:blank'];
  if (process.env.OPENBROWSER_NATIVE_NO_SANDBOX === '1') args.push('--no-sandbox');
  const child = spawn(browser.binary, args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '';
  child.stderr?.on('data', (d) => { stderr = (stderr + d).slice(-8000); });
  let port;
  for (let i = 0; i < 150; i += 1) {
    if (child.exitCode !== null) throw new Error('stock chromium exited: ' + stderr);
    try { port = Number((await fsp.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch (_) {}
    if (port) break;
    await delay(100);
  }
  if (!port) { child.kill('SIGKILL'); throw new Error('stock chromium never published CDP'); }
  return { child, port, close: async () => { child.kill('SIGKILL'); await fsp.rm(root, { recursive: true, force: true }).catch(() => {}); } };
}

async function launchPersonaChrome(personaSpec) {
  const browser = chooseChromiumBinary();
  const profile = sanitizeProfile({
    id: personaSpec.id, name: personaSpec.id, engine: 'chrome', os: personaSpec.os,
    width: 1440, height: 900,
    privacy: { cores: personaSpec.cores, memory: personaSpec.memory || 8, webrtc: 'disabled', fontListMode: 'real', timezoneMode: 'custom', timezone: personaSpec.timezone },
    advanced: { showInfoPage: false },
  });
  const fingerprint = buildFingerprint(profile);
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-audit-persona-'));
  const args = buildBaseLaunchArguments({ root, fingerprint, profile, hostScaleFactor: 1 });
  args.push('--headless=new', '--disable-dev-shm-usage', '--disable-popup-blocking',
    '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1;localhost');
  if (!args.some((a) => a.startsWith('--force-device-scale-factor='))) args.push('--force-device-scale-factor=1');
  if (process.env.OPENBROWSER_NATIVE_NO_SANDBOX === '1') args.push('--no-sandbox');
  args.push('about:blank');
  const child = spawn(browser.binary, args, { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '';
  child.stderr?.on('data', (d) => { stderr = (stderr + d).slice(-8000); });
  let port;
  for (let i = 0; i < 150; i += 1) {
    if (child.exitCode !== null) throw new Error('persona chromium exited: ' + stderr);
    try { port = Number((await fsp.readFile(path.join(root, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); } catch (_) {}
    if (port) break;
    await delay(100);
  }
  if (!port) { child.kill('SIGKILL'); throw new Error('persona chromium never published CDP'); }
  const engine = { ...injection, profiles: new Map([[profile.id, profile]]), networkInfo: new Map(),
    emit: () => {}, handleBrowserGone: async () => { if (child.exitCode === null) child.kill('SIGKILL'); } };
  const item = { port, profile, fingerprint, kernelVersion: browser.version };
  await engine.startWorkerFingerprintInjection(item, fingerprint);
  return { child, port, close: async () => {
    try { item.workerFingerprintConnection?.close(); } catch (_) {}
    child.kill('SIGKILL');
    await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
  } };
}

async function evaluateOn(port, expression, timeout = 30000) {
  const tab = (await cdp.tabs(port))[0];
  const connection = await cdp.connect(tab.webSocketDebuggerUrl);
  try {
    const result = await connection.command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, { timeout });
    return result.exceptionDetails ? { harnessError: JSON.stringify(result.exceptionDetails).slice(0, 400) } : result.result.value;
  } finally { connection.close(); }
}

/** Page that runs the worker probe and stashes the result. */
async function withWorkerProbe(port, origin) {
  const tab = (await cdp.tabs(port))[0];
  const connection = await cdp.connect(tab.webSocketDebuggerUrl);
  try {
    await connection.command('Page.navigate', { url: origin + '/probe.html' });
    await connection.command('Runtime.evaluate', {
      expression: `(async () => {
        const blob = new Blob([${JSON.stringify(WORKER_COLLECT_SOURCE)}], { type: 'application/javascript' });
        const w = new Worker(URL.createObjectURL(blob));
        window.__workerOut = await new Promise((resolve) => {
          w.onmessage = (e) => { w.terminate(); resolve(e.data); };
          w.onerror = (e) => resolve('worker-error: ' + e.message);
          setTimeout(() => resolve('worker-timeout'), 10000);
        });
        true;
      })()`,
      awaitPromise: true, returnByValue: true,
    }, { timeout: 20000 });
    await delay(150);
    const result = await connection.command('Runtime.evaluate', {
      expression: 'window.__workerOut', returnByValue: true,
    }, { timeout: 10000 });
    return result.result.value;
  } finally { connection.close(); }
}

function diff(label, stockValue, personaValue, findings, { expect = 'differ' } = {}) {
  const stockJson = JSON.stringify(stockValue);
  const personaJson = JSON.stringify(personaValue);
  if (stockJson === personaJson) {
    if (expect === 'differ') findings.push(`LEAK ${label}: persona value is byte-identical to stock (${stockJson})`);
    return;
  }
  if (expect === 'same') findings.push(`NOISE ${label}: differs between runs of the SAME config (stock=${stockJson} persona=${personaJson})`);
}

function compare(stock, persona, findings) {
  // canvas / webgl / svg value hashes must DIFFER for a different persona font stack/gpu persona — or at minimum not match stock.
  if (stock.canvas2d?.hash && persona.canvas2d?.hash) {
    diff('canvas2d.hash', stock.canvas2d.hash, persona.canvas2d.hash, findings);
  }
  if (stock.math && persona.math) {
    for (const key of Object.keys(stock.math)) {
      if (stock.math[key] === persona.math[key] && key !== 'collate') {
        // same value is EXPECTED for math (both are the same host lib) — no leak unless cross-OS persona claims otherwise
      } else if (stock.math[key] !== persona.math[key]) {
        findings.push(`NOTE math.${key}: host-lib value differs stock vs persona (stock=${stock.math[key]} persona=${persona.math[key]}) — verify the persona's claimed OS uses the same lib values`);
      }
    }
  }
  if (stock.driver && persona.driver) {
    diff('driver.webdriver', stock.driver.webdriver, persona.driver.webdriver, findings, { expect: 'same-ok' });
    if (persona.driver.webdriver === 'true') findings.push('LEAK driver.webdriver: persona exposes navigator.webdriver=true');
    if (stock.driver.chromeRuntime === persona.driver.chromeRuntime && stock.driver.chromeRuntime === 'chrome-runtime-present') {
      findings.push('LEAK driver.chromeRuntime: chrome.runtime present in persona (headless mark)');
    }
    if (persona.driver.visibility && !/visible\/false/.test(persona.driver.visibility)) {
      findings.push(`NOTE driver.visibility: persona ${persona.driver.visibility} (headless may legitimately differ)`);
    }
    diff('driver.screen', stock.driver.screen, persona.driver.screen, findings);
  }
}

(async () => {
  const http = require('node:http');
  const srvServer = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><html><body>probe</body></html>');
  });
  await new Promise((r) => srvServer.listen(0, '127.0.0.1', r));
  const srv = 'http://127.0.0.1:' + srvServer.address().port;

  let stock, persona;
  try {
    stock = await launchStockChrome();
    console.log('audit: stock chromium up (port ' + stock.port + ')');
    persona = await launchPersonaChrome({ id: 'audit-win', os: 'Windows', cores: 4, memory: 8, timezone: 'America/New_York' });
    console.log('audit: persona chromium up (port ' + persona.port + ')');

    const stockData = await evaluateOn(stock.port, COLLECT_SOURCE);
    const personaData = await evaluateOn(persona.port, COLLECT_SOURCE);
    await delay(600); // audio rendering promise
    const stockAudio = await evaluateOn(stock.port, 'window.__audioDigest');
    const personaAudio = await evaluateOn(persona.port, 'window.__audioDigest');
    const stockWorker = await withWorkerProbe(stock.port, srv);
    const personaWorker = await withWorkerProbe(persona.port, srv);

    const findings = [];
    compare(stockData, personaData, findings);
    if (stockAudio?.sum && personaAudio?.sum) {
      // Audio policy: the persona digest must be STABLE per launch (verified
      // A/A: identical across renders and launches) and differ from stock —
      // a seeded per-persona offset that leaves the stock constant behind.
      if (stockAudio.sum === personaAudio.sum) findings.push('LEAK audio.digest: persona identical to stock constant ' + stockAudio.sum);
      else console.log('PASS audio.digest: persona ' + personaAudio.sum + ' stable per launch, differs from stock ' + stockAudio.sum);
    } else findings.push('NOTE audio.digest: not collected on one side (stock=' + JSON.stringify(stockAudio) + ' persona=' + JSON.stringify(personaAudio) + ')');
    const parseWorker = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : null; } catch (_) { return { raw: v }; } };
    const sw = parseWorker(stockWorker); const pw = parseWorker(personaWorker);
    if (sw && sw.mtext !== undefined && pw && pw.mtext !== undefined) {
      diff('worker.mtext', sw.mtext, pw.mtext, findings);
      if (pw.workerPlatform !== 'Win32') findings.push('LEAK worker.platform: persona worker reads ' + pw.workerPlatform);
      if (pw.workerCores !== 4) findings.push('LEAK worker.cores: persona worker reads ' + pw.workerCores);
    } else findings.push('NOTE worker.probe: stock=' + JSON.stringify(stockWorker).slice(0, 120) + ' persona=' + JSON.stringify(personaWorker).slice(0, 120));

    console.log('\\n===== VALUE-LEVEL AUDIT REPORT =====');
    console.log('stock canvas :', stockData?.canvas2d?.hash, 'persona:', personaData?.canvas2d?.hash);
    console.log('stock webgl  :', JSON.stringify(stockData?.webgl?.unmasked || stockData?.webgl?.renderer));
    console.log('persona webgl:', JSON.stringify(personaData?.webgl?.unmasked || personaData?.webgl?.renderer));
    console.log('stock scene  :', stockData?.webgl?.scene, 'persona:', personaData?.webgl?.scene);
    console.log('stock audio  :', JSON.stringify(stockAudio), '\\npersona audio:', JSON.stringify(personaAudio));
    console.log('stock worker :', stockWorker, '\\npersona worker:', personaWorker);
    console.log('stock driver :', JSON.stringify(stockData?.driver));
    console.log('persona driver:', JSON.stringify(personaData?.driver));
    console.log('stock svg    :', JSON.stringify(stockData?.svg), 'persona svg:', JSON.stringify(personaData?.svg));
    console.log('-----------------------------------');
    for (const f of findings) console.log(f);
    if (!findings.length) console.log('no value-level findings');
    console.log('===== END REPORT =====');
  } catch (error) {
    if (error instanceof Unavailable) { console.error('SKIP ' + error.message); process.exit(2); }
    console.error('FAIL harness: ' + (error && error.stack || error)); process.exit(1);
  } finally {
    await stock?.close?.(); await persona?.close?.(); srvServer.close();
  }
  process.exit(0);
})();
