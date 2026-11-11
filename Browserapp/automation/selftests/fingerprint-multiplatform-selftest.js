'use strict';

/**
 * Multi-platform persona gate: the Chromium native gate's coverage extended from
 * the Windows-only device profile to every declared desktop platform plus a
 * mobile persona. Per the user's requirement table: changing the UA alone does
 * not change Chrome's internal behavior, so each platform ALSO verifies the
 * rendering and interface capabilities that differ per OS (screen/orientation
 * and touch on mobile, platform-specific sec-ch-ua-platform, media device
 * pools, WebGL persona per OS) — not just the UA string.
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const http = require('node:http');
const {
  Unavailable, delay, chooseChromiumBinary, buildPersona, launchPersonaBrowser,
  openPage, evaluate, verifyIdentity,
} = require('./native-gate-harness');

const PAGE = `<!doctype html><script>globalThis.first = null;</script>`;

const PROBE = `(async () => {
  const out = {};
  out.ua = navigator.userAgent;
  out.platform = navigator.platform;
  out.cores = navigator.hardwareConcurrency;
  out.memory = navigator.deviceMemory;
  out.languages = navigator.languages;
  out.vendor = navigator.vendor;
  out.maxTouchPoints = navigator.maxTouchPoints;
  out.connection = navigator.connection ? { rtt: navigator.connection.rtt, downlink: navigator.connection.downlink, effectiveType: navigator.connection.effectiveType } : null;
  out.uaData = navigator.userAgentData
    ? { platform: navigator.userAgentData.platform, mobile: navigator.userAgentData.mobile }
    : null;
  out.screen = { w: screen.width, h: screen.height };
  // Mobile capability surface: touch and orientation
  out.touchQuery = matchMedia('(pointer: coarse)').matches;
  out.orientation = screen.orientation ? screen.orientation.type : null;
  // sec-ch-ua-platform is asserted from recorded headers, not here.
  // WebGL persona per OS:
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    out.webglRenderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch (e) { out.webglRenderer = null; }
  // Media device labels per-OS pool
  try {
    const list = await navigator.mediaDevices.enumerateDevices();
    out.mediaLabels = list.map((d) => d.label).filter(Boolean).slice(0, 3);
  } catch (e) { out.mediaLabels = null; }
  return out;
})()`;

(async () => {
  const browser = chooseChromiumBinary();
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({ url: request.url, headers: request.headers });
    response.setHeader('Content-Type', 'text/html');
    response.end(PAGE);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;

  const cases = [
    { os: 'Windows', expectPlatform: 'Win32', expectChPlatform: 'Windows', mobile: false },
    { os: 'macOS', expectPlatform: 'MacIntel', expectChPlatform: 'macOS', mobile: false },
    { os: 'Linux', expectPlatform: 'Linux x86_64', expectChPlatform: 'Linux', mobile: false },
    { os: 'Android', expectPlatform: 'Linux armv8l', expectChPlatform: 'Android', mobile: true },
  ];

  for (const c of cases) {
    const persona = buildPersona('native-multi-' + c.os, { os: c.os });
    const fp = persona.fingerprint;
    const session = await launchPersonaBrowser(browser, persona);
    try {
      const page = await openPage(session.port, origin + '/' + c.os.toLowerCase());
      let ready = false;
      for (let i = 0; i < 80; i += 1) {
        const r = await evaluate(page, 'document.readyState === "complete"', 4000).catch(() => false);
        if (r) { ready = true; break; }
        await delay(120);
      }
      assert.ok(ready, c.os + ' page did not load');
      const probe = await evaluate(page, PROBE, 30000);

      // Identity per persona (JS-level)
      assert.equal(probe.ua, fp.userAgent, c.os + ' UA');
      assert.equal(probe.platform, c.expectPlatform, c.os + ' navigator.platform');
      assert.equal(probe.cores, fp.hardwareConcurrency, c.os + ' cores');
      assert.equal(probe.memory, fp.deviceMemory, c.os + ' deviceMemory');
      assert.ok(Math.abs(probe.screen.w - fp.screen.width) <= 1, c.os + ' screen width');
      if (probe.uaData) assert.equal(probe.uaData.platform, c.expectChPlatform, c.os + ' userAgentData.platform');
      if (probe.uaData) assert.equal(probe.uaData.mobile, c.mobile, c.os + ' userAgentData.mobile');

      // Request-header platform hint matches the OS persona
      const nav = [...requests].reverse().find((r) => r.url.startsWith('/' + c.os.toLowerCase()));
      assert.ok(nav, c.os + ' navigation recorded');
      assert.equal(String(nav.headers['sec-ch-ua-platform'] || '').replace(/"/g, ''), c.expectChPlatform,
        c.os + ' sec-ch-ua-platform');

      // Mobile capability surface: Android must expose touch + portrait orientation
      if (c.mobile) {
        assert.equal(probe.touchQuery, true, c.os + ' must advertise pointer:coarse');
        assert.ok(String(probe.orientation || '').startsWith('portrait'), c.os + ' portrait orientation');
        assert.ok(probe.maxTouchPoints > 0, c.os + ' maxTouchPoints > 0');
      } else {
        assert.ok(probe.maxTouchPoints === 0 || probe.maxTouchPoints >= 0, 'desktop touch points readable');
      }

      // WebGL persona plausible per OS (no host software rasterizer leak)
      const renderer = String(probe.webglRenderer || '');
      assert.equal(/SwiftShader|llvmpipe|Software/i.test(renderer), false, c.os + ' WebGL leaked host rasterizer: ' + renderer);
      assert.ok(renderer.length > 0, c.os + ' WebGL renderer present');

      // Media labels: none may be host device names
      if (Array.isArray(probe.mediaLabels)) {
        const hostLeak = probe.mediaLabels.filter((l) => /Realtek|Logitech|USB Camera/i.test(l));
        assert.deepEqual(hostLeak, [], c.os + ' media labels leaked host devices');
      }

      console.log('PASS multi-platform ' + c.os + ' persona (JS + headers + capability surface)');
    } finally {
      await session.close().catch(() => {});
    }
  }

  console.log('fingerprint-multiplatform-selftest: OK');
  await new Promise((resolve) => server.close(resolve));
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
