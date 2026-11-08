#!/usr/bin/env node
'use strict';

/**
 * WebRTC fallback per-profile source selftest.
 *
 * The fallback injector used to hardcode publicIp 203.0.113.9 / localIp 192.168.1.100, so every
 * environment emitted the identical synthetic host candidate (cross-environment correlation) and
 * real-mode profiles without an exit address advertised a srflx candidate that contradicted the
 * proxy identity. The fix takes only per-profile values:
 *   - host side  <- buildFingerprint's seeded webrtcLocalIp (per-profile private IP);
 *   - srflx side <- explicit webrtcAddress / known exit address only;
 *   - neither known -> no fallback source injected at all (prefer missing over shared-constant).
 *
 * Pure node / vm: no browser needed.
 */

const assert = require('assert');
const vm = require('vm');

const { buildFingerprint } = require('../fingerprint');
const { buildInjectionScript } = require('../fingerprint/injection-script');
const { createWebRtcFallbackSource } = require('../webrtc-fallback');

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  FAIL  ${name} — ${err.message}`);
    process.exitCode = 1;
  }
};

const CONSTANT_IPS = ['203.0.113.9', '192.168.1.100'];

check('two profiles produce different seeded local IPs', () => {
  const fpA = buildFingerprint({ id: 'webrtc-per-profile-alpha', privacy: { webrtc: 'proxy' }, advanced: {} });
  const fpB = buildFingerprint({ id: 'webrtc-per-profile-beta', privacy: { webrtc: 'proxy' }, advanced: {} });
  assert.ok(/^\d+\.\d+\.\d+\.\d+$/.test(fpA.webrtcLocalIp), `alpha localIp not an IPv4: ${fpA.webrtcLocalIp}`);
  assert.ok(/^\d+\.\d+\.\d+\.\d+$/.test(fpB.webrtcLocalIp), `beta localIp not an IPv4: ${fpB.webrtcLocalIp}`);
  assert.notStrictEqual(fpA.webrtcLocalIp, fpB.webrtcLocalIp, 'two profiles must not share a local IP');
  assert.ok(!CONSTANT_IPS.includes(fpA.webrtcLocalIp) && !CONSTANT_IPS.includes(fpB.webrtcLocalIp),
    'seeded local IP must never be one of the old shared constants');
});

check('injection output carries per-profile host candidate and no constant literals', () => {
  const fpA = buildFingerprint({ id: 'webrtc-per-profile-alpha', privacy: { webrtc: 'proxy' }, advanced: {} });
  const fpB = buildFingerprint({ id: 'webrtc-per-profile-beta', privacy: { webrtc: 'proxy' }, advanced: {} });
  const sA = buildInjectionScript(fpA, { livePatch: true });
  const sB = buildInjectionScript(fpB, { livePatch: true });
  for (const ip of CONSTANT_IPS) {
    assert.ok(!sA.includes(ip), `alpha output still contains the shared constant ${ip}`);
    assert.ok(!sB.includes(ip), `beta output still contains the shared constant ${ip}`);
  }
  const localA = sA.match(/const LOCAL_IP = "([^"]+)";/);
  const localB = sB.match(/const LOCAL_IP = "([^"]+)";/);
  assert.ok(localA, 'alpha output must bind LOCAL_IP');
  assert.ok(localB, 'beta output must bind LOCAL_IP');
  assert.strictEqual(localA[1], fpA.webrtcLocalIp, 'LOCAL_IP must be the profile seeded webrtcLocalIp');
  assert.strictEqual(localB[1], fpB.webrtcLocalIp, 'LOCAL_IP must be the profile seeded webrtcLocalIp');
  assert.notStrictEqual(localA[1], localB[1], 'the two host candidates must differ');
});

check('no exit info: srflx side absent, host side still per-profile', () => {
  const fpA = buildFingerprint({ id: 'webrtc-per-profile-alpha', privacy: { webrtc: 'proxy' }, advanced: {} });
  assert.strictEqual(fpA.webrtcAddress, null, 'profile without exit info must have no webrtcAddress');
  const sA = buildInjectionScript(fpA, { livePatch: true });
  assert.strictEqual(sA.match(/const hasPublic = (true|false);/)[1], 'false', 'hasPublic must be false');
  assert.strictEqual(sA.match(/const PUBLIC_IP = ([^;]+);/)[1], 'null', 'PUBLIC_IP must be null');
  assert.strictEqual(sA.match(/const hasLocal = (true|false);/)[1], 'true', 'hasLocal must stay true');
});

check('explicit webrtcAddress: srflx side carries exactly that address', () => {
  const fpC = buildFingerprint({
    id: 'webrtc-per-profile-gamma',
    privacy: { webrtc: 'proxy', fingerprint: { webrtcAddress: '198.51.100.7' } },
    advanced: {},
  });
  assert.strictEqual(fpC.webrtcAddress, '198.51.100.7');
  const sC = buildInjectionScript(fpC, { livePatch: true });
  assert.strictEqual(sC.match(/const hasPublic = (true|false);/)[1], 'true');
  assert.strictEqual(sC.match(/const PUBLIC_IP = "([^"]+)";/)[1], '198.51.100.7');
});

check('no value at all: fallback source is not injected (宁缺勿假)', () => {
  assert.strictEqual(createWebRtcFallbackSource({ publicIp: null, localIp: null }), '');
  assert.strictEqual(createWebRtcFallbackSource({}), '');
  assert.strictEqual(createWebRtcFallbackSource({ publicIp: '', localIp: '   ' }), '');
});

check('disabled mode: no fallback section in the composed script', () => {
  const fpD = buildFingerprint({ id: 'webrtc-per-profile-delta', privacy: { webrtc: 'disabled' }, advanced: {} });
  const sD = buildInjectionScript(fpD, { livePatch: true });
  assert.ok(!sD.includes('const hasLocal'), 'disabled mode must not carry the fallback source');
  assert.ok(!sD.includes('RTCPeerConnection fallback'), 'disabled mode must not mention the fallback');
});

check('synthetic gathering honours the gating (vm sandbox A/B)', async () => {
  // Run the fallback source in a vm and drive one synthetic PC per profile, then compare the
  // host candidate addresses the page would observe.
  const observed = [];
  for (const id of ['webrtc-per-profile-alpha', 'webrtc-per-profile-beta']) {
    const fp = buildFingerprint({ id, privacy: { webrtc: 'proxy' }, advanced: {} });
    const src = createWebRtcFallbackSource({ publicIp: null, localIp: fp.webrtcLocalIp });
    assert.ok(src.length > 0);
    const sandbox = {
      console, Math, Date, Promise, Object, Array, JSON, Number, String, Boolean, Symbol,
      WeakMap, Map, Set, Reflect, Intl, TypeError, Error, isNaN, parseInt, parseFloat,
      Function, Uint8Array, Uint8ClampedArray, WeakSet, setTimeout, clearTimeout,
      Event, EventTarget,
      RTCIceCandidate: class { constructor(init) { Object.assign(this, init); } },
      RTCSessionDescription: class { constructor(init) { Object.assign(this, init); } },
      RTCPeerConnectionIceEvent: class { constructor(type, init) { this.type = type; this.candidate = init && init.candidate; } },
      RTCDataChannel: function () {},
      RTCStatsReport: class { constructor() { this.map = new Map(); } },
      document: undefined,
    };
    sandbox.self = sandbox; sandbox.globalThis = sandbox; sandbox.window = sandbox;
    class RTCPeerConnection { constructor() { throw new TypeError('native construction unavailable'); } }
    sandbox.RTCPeerConnection = RTCPeerConnection;
    sandbox.webkitRTCPeerConnection = RTCPeerConnection;
    sandbox.navigator = {};
    vm.runInNewContext(src, sandbox, { timeout: 20000 });
    const pc = new sandbox.RTCPeerConnection({});
    const cands = [];
    pc.onicecandidate = (ev) => { if (ev && ev.candidate) cands.push(String(ev.candidate.candidate || '')); };
    await pc.setLocalDescription({ type: 'offer', sdp: 'v=0' });
    await new Promise((r) => setTimeout(r, 80));
    const host = cands.find((c) => c.includes('typ host'));
    const srflx = cands.find((c) => c.includes('typ srflx'));
    assert.ok(host, 'expected a host candidate');
    assert.ok(!srflx, 'must not emit an srflx candidate without an exit address');
    assert.ok(host.includes(fp.webrtcLocalIp), `host candidate must carry ${fp.webrtcLocalIp}`);
    for (const ip of CONSTANT_IPS) assert.ok(!host.includes(ip), `host candidate must not contain ${ip}`);
    observed.push(host);
  }
  assert.notStrictEqual(observed[0], observed[1], 'the two profiles must observe different host candidates');
});

const failed = results.filter((r) => !r.ok).length;
console.log(`\nwebrtc-fallback-perprofile-selftest: ${results.length - failed} checks passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
