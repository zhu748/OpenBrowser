#!/usr/bin/env node
'use strict';

/**
 * Fingerprint remediation selftest (audit round, chapter 6, tasks 3/4/5/6).
 *
 *   T3: Android mobile persona synthesises WebGL vendor/renderer through the ANGLE template
 *       (`ANGLE (<vendor>, <renderer>, OpenGL ES 3.2)`) with a non-empty gpu.architecture from
 *       the repo's existing family mapping; the two Pixel 2 records missing (TM) are fixed.
 *   T4: navigator.languages and Accept-Language resolve through ONE chain
 *       (privacy.languages -> privacy.fingerprint.languages -> profile.languages -> locale
 *       default), so the JS surface and the HTTP header can never disagree on the default chain.
 *   T5: Date domain-edge getters (new Date(8.64e15).getHours()) no longer throw ReferenceError
 *       through to the page, in BOTH the main-world and the worker scripts.
 *   T6: deviceMemory passes persona's legal quantised tiers (0.25/0.5) through instead of
 *       rewriting them to 1; illegal values snap to the nearest tier.
 *
 * Pure node / vm: no browser needed.
 */

const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const { buildFingerprint } = require('../fingerprint');
const { buildInjectionScript } = require('../fingerprint/injection-script');
const { buildWorkerInjectionScript } = require('../fingerprint/worker-injection');

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

const ANGLE_FORM = /^ANGLE \(.+, .+, OpenGL ES 3\.2\)$/;
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'mobile-devices.json'), 'utf8'));
const android = raw.devices.filter((d) => d.os === 'android');

// --- T3: mobile WebGL ANGLE synthesis ---
check('T3: every android persona renderer matches the ANGLE template and the device record', () => {
  for (const id of ['t3-a', 't3-b', 't3-c', 't3-d']) {
    const fp = buildFingerprint({ id: `t3-${id}`, os: 'android', privacy: { deviceProfile: 'persona' }, advanced: {} });
    const rec = android.find((d) => d.name === fp.mobileDevice.name);
    assert.ok(rec, 'sampled device must exist in the pool');
    assert.strictEqual(fp.webgl.vendor, `Google Inc. (${rec.gpuVendor})`);
    assert.ok(ANGLE_FORM.test(fp.webgl.renderer), `renderer not ANGLE-form: ${fp.webgl.renderer}`);
    assert.ok(fp.webgl.renderer.includes(rec.gpuRenderer), 'renderer must name the device GPU string');
    assert.strictEqual(fp.webgl.gpu && fp.webgl.gpu.architecture ? true : false, true, 'gpu.architecture must be non-empty');
    assert.ok(['adreno-700', 'valhall', 'rdna-2', 'rogue'].includes(fp.webgl.gpu.architecture), `unknown architecture: ${fp.webgl.gpu.architecture}`);
  }
});

check('T3: architectures come only from the existing family mapping', () => {
  const seen = new Set();
  for (let i = 0; i < 40; i += 1) {
    const fp = buildFingerprint({ id: `t3-scan-${i}`, os: 'android', privacy: { deviceProfile: 'persona' }, advanced: {} });
    seen.add(fp.webgl.gpu.architecture);
  }
  for (const arch of seen) assert.ok(['adreno-700', 'valhall', 'rdna-2', 'rogue'].includes(arch), `invented architecture: ${arch}`);
});

check('T3: the two Pixel 2 GPU records carry (TM) now', () => {
  const bad = android.filter((d) => /Adreno/.test(String(d.gpuRenderer)) && !/\(TM\)/.test(String(d.gpuRenderer)));
  assert.deepStrictEqual(bad.map((d) => d.name), [], 'Adreno records without (TM) must be gone');
  const px = android.filter((d) => d.name === 'Google Pixel 2' || d.name === 'Google Pixel 2 XL');
  assert.strictEqual(px.length, 2);
  for (const d of px) assert.strictEqual(d.gpuRenderer, 'Adreno (TM) 540');
});

// --- T4: single languages chain ---
check('T4: navigator.languages and Accept-Language agree on the default chain', () => {
  for (const id of ['t4-a', 't4-b']) {
    const fp = buildFingerprint({ id, advanced: {} });
    const navFirst = String(fp.languages[0]);
    const accFirst = String(fp.acceptLanguage.split(',')[0]).split(';')[0].trim();
    assert.strictEqual(navFirst, accFirst, `nav ${navFirst} vs header ${accFirst}`);
  }
});

check('T4: privacy.languages wins over privacy.fingerprint.languages on every surface', () => {
  const fp = buildFingerprint({
    id: 't4-split',
    privacy: { languages: ['zh-CN', 'zh'], fingerprint: { languages: ['ja-JP', 'ja'] } },
    advanced: {},
  });
  assert.deepStrictEqual(fp.languages, ['zh-CN', 'zh'], 'fp.languages must follow privacy.languages');
  assert.deepStrictEqual(fp.staticConfig.langs, ['zh-CN', 'zh'], 'staticConfig.langs must follow the same chain');
  assert.ok(fp.acceptLanguage.startsWith('zh-CN'), `acceptLanguage must be zh-CN first: ${fp.acceptLanguage}`);
  assert.ok(!fp.acceptLanguage.startsWith('ja'), 'acceptLanguage must not be the fingerprint.languages value');
});

check('T4: cross check — nav languages vs Accept-Language across a profile sweep', () => {
  for (let i = 0; i < 25; i += 1) {
    const fp = buildFingerprint({ id: `t4-sweep-${i}`, language: ['en-US', 'ja-JP', 'de-DE'][i % 3], advanced: {} });
    const navFirst = String(fp.languages[0]);
    const accFirst = String(fp.acceptLanguage.split(',')[0]).split(';')[0].trim();
    assert.strictEqual(navFirst, accFirst, `profile ${i}: nav ${navFirst} vs header ${accFirst}`);
  }
});

// --- T5: Date domain edge ---
function dateEdge(script) {
  const sb = {
    console, Math, Date, Promise, Object, Array, JSON, Number, String, Boolean, Symbol,
    WeakMap, Map, Set, Reflect, Intl, TypeError, Error, isNaN, parseInt, parseFloat,
    Function, Uint8Array, Uint8ClampedArray, WeakSet, setTimeout, clearTimeout,
    Event, EventTarget,
    StorageManager: class { estimate() { return Promise.resolve({ quota: 1, usage: 0, usageDetails: {} }); } },
  };
  sb.self = sb; sb.globalThis = sb; sb.window = sb;
  sb.navigator = { storage: new sb.StorageManager() };
  sb.WorkerNavigator = undefined;
  sb.RTCPeerConnection = class { constructor() { throw new TypeError('x'); } };
  sb.webkitRTCPeerConnection = sb.RTCPeerConnection;
  vm.runInNewContext(script, sb, { timeout: 20000 });
  const out = {};
  for (const [label, ms] of [['max', 8.64e15], ['max-1', 8.64e15 - 1], ['min+', -8.64e15 + 1]]) {
    const d = new sb.Date(ms);
    try {
      const h = d.getHours();
      out[label] = { threw: false, value: h };
    } catch (err) {
      out[label] = { threw: true, type: err.constructor.name };
    }
  }
  return out;
}

check('T5: main-world Date edge getters never throw', () => {
  const fp = buildFingerprint({ id: 't5-edge', privacy: { deviceProfile: 'persona', fingerprint: { timezone: 'Asia/Tokyo' } }, advanced: {} });
  const out = dateEdge(buildInjectionScript(fp, { livePatch: true }));
  for (const label of Object.keys(out)) {
    assert.ok(!out[label].threw, `${label} threw ${out[label].type}`);
    assert.ok(typeof out[label].value === 'number' && isFinite(out[label].value), `${label} returned non-number`);
  }
});

check('T5: worker Date edge getters never throw (same fix)', () => {
  const fp = buildFingerprint({ id: 't5-edge-w', privacy: { deviceProfile: 'persona', fingerprint: { timezone: 'Asia/Tokyo' } }, advanced: {} });
  const out = dateEdge(buildWorkerInjectionScript(fp));
  for (const label of Object.keys(out)) {
    assert.ok(!out[label].threw, `${label} threw ${out[label].type}`);
    assert.ok(typeof out[label].value === 'number' && isFinite(out[label].value), `${label} returned non-number`);
  }
});

// --- T6: deviceMemory tier passthrough ---
check('T6: legal persona tiers pass through the injection (main + worker)', () => {
  for (const memory of [0.25, 0.5, 1, 2, 4, 8]) {
    const fp = buildFingerprint({ id: `t6-${memory}`, privacy: { deviceProfile: 'persona', fingerprint: { memory } }, advanced: {} });
    assert.strictEqual(fp.deviceMemory, memory, `persona layer must keep ${memory}`);
    const main = buildInjectionScript(fp, { livePatch: true }).match(/"deviceMemory":([0-9.]+)/)[1];
    const worker = buildWorkerInjectionScript(fp).match(/"deviceMemory":([0-9.]+)/)[1];
    assert.strictEqual(Number(main), memory, `main script rewrote ${memory} to ${main}`);
    assert.strictEqual(Number(worker), memory, `worker script rewrote ${memory} to ${worker}`);
  }
});

check('T6: illegal values snap to the nearest tier', () => {
  const fp = buildFingerprint({ id: 't6-snap', privacy: { deviceProfile: 'persona', fingerprint: { memory: 0.7 } }, advanced: {} });
  // persona layer snaps 0.7 -> 0.5 already; the injection must not re-clamp it to 1
  assert.strictEqual(fp.deviceMemory, 0.5);
  const main = buildInjectionScript(fp, { livePatch: true }).match(/"deviceMemory":([0-9.]+)/)[1];
  assert.strictEqual(Number(main), 0.5, `injection rewrote 0.5 to ${main}`);
});

const failed = results.filter((r) => !r.ok).length;
console.log(`\nfingerprint-remediation-selftest: ${results.length - failed} checks passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
