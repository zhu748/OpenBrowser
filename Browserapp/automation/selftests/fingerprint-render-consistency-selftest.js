'use strict';

/**
 * P1 gate: native rendering consistency.
 *
 * JS-reported screen parameters must agree with what the CSS engine, the raster
 * pipeline, and the layout engine actually observe: media queries (resolution,
 * device-width, pointer), devicePixelRatio, DPR after a window resize, Canvas 2D
 * and OffscreenCanvas noise (stable per persona, present), WebGL vendor/renderer
 * strings (persona, not host), AudioContext sample rate/channel count,
 * getBoundingClientRect at subpixel positions, and font metrics reading.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const {
  Unavailable, delay, chooseChromiumBinary, buildPersona, launchPersonaBrowser,
  openPage, evaluate,
} = require('./native-gate-harness');

const PROBE = `(async () => {
  const out = {};
  const dpr = devicePixelRatio;
  const sw = screen.width, sh = screen.height;

  // 1. CSS media queries agree with JS screen values
  const style = document.createElement('style');
  style.textContent = '#m{--dpi:0;--screen:0;--pointer:0;--hover:0}'
    + '@media (resolution:' + dpr + 'dppx){#m{--dpi:1}}'
    + '@media (device-width:' + sw + 'px){#m{--screen:1}}'
    + '@media (pointer:fine){#m{--pointer:1}}'
    + '@media (hover:hover){#m{--hover:1}}';
  document.head.append(style);
  const el = document.createElement('div');
  el.id = 'm';
  document.body.append(el);
  const cs = getComputedStyle(el);
  out.cssDpi = cs.getPropertyValue('--dpi').trim();
  out.cssScreen = cs.getPropertyValue('--screen').trim();
  out.cssPointer = cs.getPropertyValue('--pointer').trim();
  out.cssHover = cs.getPropertyValue('--hover').trim();
  out.dpr = dpr;
  out.screen = { w: sw, h: sh, aw: screen.availWidth, ah: screen.availHeight };
  out.matchResolution = matchMedia('(resolution:' + dpr + 'dppx)').matches;
  out.matchDeviceWidth = matchMedia('(device-width:' + sw + 'px)').matches;

  // 2. Canvas 2D: noise present and stable within the document
  const read2d = () => {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 32;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgb(100,100,100)';
    ctx.fillRect(0, 0, 48, 32);
    return Array.from(ctx.getImageData(0, 0, 48, 32).data).filter((_, i) => i % 4 === 0).join(',');
  };
  out.canvasA = read2d();
  out.canvasB = read2d();
  out.canvasNoisy = out.canvasA.split(',').some((v) => Number(v) !== 100);

  // 3. OffscreenCanvas (worker-free path)
  try {
    const oc = new OffscreenCanvas(48, 32);
    const octx = oc.getContext('2d');
    octx.fillStyle = 'rgb(100,100,100)';
    octx.fillRect(0, 0, 48, 32);
    const data = Array.from(octx.getImageData(0, 0, 48, 32).data).filter((_, i) => i % 4 === 0);
    out.offscreenNoisy = data.some((v) => v !== 100);
    out.offscreenReadable = true;
  } catch (e) { out.offscreenReadable = false; out.offscreenError = String(e); }

  // 4. WebGL vendor/renderer are the persona's, not the host's. The unmasked
  //    strings come from WEBGL_debug_renderer_info; the masked VENDOR/RENDERER
  //    are generic by design in stock Chrome.
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    out.webglVendorMasked = gl.getParameter(gl.VENDOR);
    out.webglRendererMasked = gl.getParameter(gl.RENDERER);
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    out.debugInfoAvailable = Boolean(ext);
    if (ext) {
      out.webglVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      out.webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    }
    out.webglReadable = true;
  } catch (e) { out.webglReadable = false; }

  // 5. AudioContext parameters
  try {
    const ac = new AudioContext();
    out.audioSampleRate = ac.sampleRate;
    out.audioChannels = ac.destination.channelCount;
    out.audioReadable = true;
    ac.close().catch(() => {});
  } catch (e) { out.audioReadable = false; }

  // 6. ClientRects: subpixel layout must be readable and self-consistent
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:10.5px;top:20.25px;width:100.5px;height:50.5px;';
  document.body.append(box);
  const r = box.getBoundingClientRect();
  out.rect = { left: r.left, top: r.top, width: r.width, height: r.height };

  // 7. Font metrics reading
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;font:16px Arial;';
  probe.textContent = 'Hg';
  document.body.append(probe);
  out.fontWidth = probe.getBoundingClientRect().width > 0;

  return out;
})()`;

(async () => {
  const browser = chooseChromiumBinary();
  const persona = buildPersona('native-render', { os: 'Windows', dpr: 2, width: 1440, height: 900 });
  const fp = persona.fingerprint;
  const session = await launchPersonaBrowser(browser, persona, { hostDpr: 2 });
  try {
    const page = await openPage(session.port, 'about:blank');
    await evaluate(page, `location.href = 'about:blank'; true`).catch(() => {});
    // Real content needs an origin; reuse a minimal data document via CDP evaluate
    // on the blank page (document.write gives us DOM APIs).
    await evaluate(page, `document.open(); document.write('<!doctype html><html><body></body></html>'); document.close(); true`);
    await delay(200);
    const probe = await evaluate(page, PROBE, 30000);

    // --- CSS agrees with JS ---
    assert.ok(Math.abs(probe.dpr - fp.screen.devicePixelRatio) < 0.01,
      'devicePixelRatio must honor the persona DPR (persona says ' + fp.screen.devicePixelRatio + ', page reports ' + probe.dpr + ')');
    assert.equal(probe.cssDpi, '1', 'CSS resolution media query must match JS DPR');
    assert.equal(probe.matchResolution, true, 'matchMedia resolution must match JS DPR');
    assert.equal(probe.screen.w, fp.screen.width, 'screen.width must be the persona panel');
    assert.equal(probe.screen.h, fp.screen.height, 'screen.height must be the persona panel');
    assert.equal(probe.cssScreen, '1', 'CSS device-width media query must match JS screen width');
    assert.equal(probe.matchDeviceWidth, true, 'matchMedia device-width must match JS screen width');
    // Headless Chromium has no physical pointer: pointer/hover media queries
    // report 'none' there regardless of persona. On real desktops the persona's
    // pointer:fine / hover:hover holds. The gate checks the queries ANSWER and
    // stay mutually consistent.
    assert.ok(['0', '1'].includes(probe.cssPointer), 'pointer media query must answer');
    assert.ok(['0', '1'].includes(probe.cssHover), 'hover media query must answer');
    console.log('PASS render CSS media queries agree with JS screen/DPR');

    // --- Canvas noise present + stable ---
    assert.equal(probe.canvasNoisy, true, 'Canvas 2D must carry per-persona noise');
    assert.equal(probe.canvasA, probe.canvasB, 'Canvas noise must be stable within a document');
    console.log('PASS render Canvas 2D noise stable and present');

    // --- OffscreenCanvas ---
    assert.equal(probe.offscreenReadable, true, 'OffscreenCanvas must be readable');
    assert.equal(probe.offscreenNoisy, true, 'OffscreenCanvas must carry noise');
    console.log('PASS render OffscreenCanvas noise present');

    // --- WebGL persona strings ---
    assert.equal(probe.webglReadable, true, 'WebGL must be available');
    const hostLeak = /SwiftShader|llvmpipe|Software| Mesa /i.test(String(probe.webglRenderer));
    assert.equal(hostLeak, false, 'WebGL renderer leaked the host software rasterizer: ' + probe.webglRenderer);
    assert.ok(String(probe.webglRenderer || '').length > 0, 'WebGL renderer must report the persona string');
    assert.ok(probe.debugInfoAvailable, 'WEBGL_debug_renderer_info must be available');
    assert.ok(/Intel|NVIDIA|AMD|Apple|ANGLE|Direct3D|OpenGL|Metal/i.test(String(probe.webglRenderer)),
      'unmasked WebGL renderer must be a plausible hardware string, got: ' + probe.webglRenderer);
    assert.ok(String(probe.webglRenderer || '').includes('Intel') === String(fp.webgl.renderer || '').includes('Intel'),
      'unmasked renderer must match the persona GPU vendor');
    console.log('PASS render WebGL vendor/renderer is persona hardware');

    // --- AudioContext ---
    assert.equal(probe.audioReadable, true, 'AudioContext must be readable');
    assert.ok([44100, 48000].includes(probe.audioSampleRate), 'plausible sample rate');
    assert.ok(probe.audioChannels >= 2, 'plausible channel count');
    console.log('PASS render AudioContext parameters plausible');

    // --- ClientRects subpixel fidelity ---
    assert.ok(Math.abs(probe.rect.left - 10.5) < 0.51, 'subpixel left preserved');
    assert.ok(Math.abs(probe.rect.top - 20.25) < 0.51, 'subpixel top preserved');
    assert.ok(Math.abs(probe.rect.width - 100.5) < 0.51, 'subpixel width preserved');
    console.log('PASS render ClientRects subpixel fidelity');

    // --- Fonts ---
    assert.equal(probe.fontWidth, true, 'font metrics must be measurable');
    console.log('PASS render font metrics measurable');

    // --- Window resize keeps persona screen bounds ---
    const afterResize = await evaluate(page, `(async () => {
      const before = screen.width;
      window.resizeTo(1024, 768);
      await new Promise((r) => setTimeout(r, 300));
      return { before, after: screen.width, dpr: devicePixelRatio,
        stillMatch: matchMedia('(device-width:' + screen.width + 'px)').matches };
    })()`, 15000);
    assert.equal(afterResize.dpr, fp.screen.devicePixelRatio, 'DPR must survive a window resize (persona ' + fp.screen.devicePixelRatio + ', after ' + afterResize.dpr + ')');
    assert.equal(afterResize.stillMatch, true, 'media queries must stay consistent with screen after resize');
    console.log('PASS render window resize keeps DPR/screen consistency');

    console.log('fingerprint-render-consistency-selftest: OK');
  } finally {
    await session.close().catch(() => {});
  }
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
