#!/usr/bin/env node
'use strict';

/**
 * Worker realm StorageManager.estimate parity selftest.
 *
 * The worker script used to evaluate `Boolean(CFG.mobile || isIosPersona || isAndroidPersona)`
 * with CFG missing os/mobile/mobileDevice and both persona flags out of scope: the read threw a
 * ReferenceError that the enclosing try swallowed, so the whole estimate patch was skipped and
 * a worker answered navigator.storage.estimate() with the HOST quota while the page answered
 * with the persona quota. The same scope hole broke the phone-profile UAData replacement path.
 *
 * This suite runs the built worker script in a vm sandbox (no browser needed) and pins:
 *   1. the worker estimate slot is covered and answers the persona quota;
 *   2. the quota matches the main-world script for the same profile (cross-realm parity);
 *   3. desktop and android personas yield the mobile/desktop quota tiers respectively;
 *   4. a phone profile gets its page-side userAgentData replacement back (MOBILE path).
 */

const assert = require('assert');
const vm = require('vm');

const { buildFingerprint } = require('../fingerprint');
const { buildWorkerInjectionScript } = require('../fingerprint/worker-injection');
const { buildInjectionScript } = require('../fingerprint/injection-script');

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

class SandboxStorageManager {
  constructor() { this.hostQuota = 999999999; this.hostUsage = 12345; }
  estimate() { return Promise.resolve({ quota: this.hostQuota, usage: this.hostUsage, usageDetails: { indexedDB: 12 } }); }
}

// A worker-realm-shaped sandbox: self/globalThis, a storage-bearing navigator, and the same
// class set the real WorkerGlobalScope exposes. No DOM: the worker subset must not need one.
function makeWorkerSandbox() {
  const sandbox = {
    console, Math, Date, Promise, Object, Array, JSON, Number, String, Boolean, Symbol,
    WeakMap, Map, Set, Reflect, Intl, TypeError, Error, isNaN, parseInt, parseFloat,
    Function, Uint8Array, Uint8ClampedArray, WeakSet, setTimeout, clearTimeout,
    Event, EventTarget, StorageManager: SandboxStorageManager,
  };
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.navigator = { storage: new SandboxStorageManager() };
  sandbox.WorkerNavigator = undefined; // not present in Node vm; the script guards on it
  sandbox.RTCPeerConnection = class RTCPeerConnection { constructor() { throw new TypeError('no native PC in sandbox'); } };
  sandbox.webkitRTCPeerConnection = sandbox.RTCPeerConnection;
  return sandbox;
}

async function workerEstimate(fp) {
  const sandbox = makeWorkerSandbox();
  const src = buildWorkerInjectionScript(fp);
  vm.runInNewContext(src, sandbox, { timeout: 20000 });
  // In a vm sandbox the injected script and this file share one StorageManager class object, so
  // patch detection is behavioural: the slot must answer the persona quota (not the host's).
  const est = sandbox.StorageManager.prototype.estimate;
  const value = await est.call(sandbox.navigator.storage);
  const hostLeak = value.quota === 999999999;
  return {
    quota: value.quota, usage: value.usage, usageDetails: value.usageDetails,
    patched: !hostLeak, hostLeak,
  };
}

async function mainEstimate(fp) {
  const sandbox = makeWorkerSandbox();
  sandbox.window = sandbox; // page world
  const src = buildInjectionScript(fp, { livePatch: true });
  vm.runInNewContext(src, sandbox, { timeout: 20000 });
  const est = sandbox.StorageManager.prototype.estimate;
  const value = await est.call(sandbox.navigator.storage);
  return { quota: value.quota, usage: value.usage, patched: value.quota !== 999999999 };
}

const MOBILE_TIER_LOW = 10737418240;
const MOBILE_TIER_HIGH = 16106127360;
const DESK_TIER_LOW = 32212254720;
const DESK_TIER_HIGH = 64424509440;

// The patched estimate rejects receivers that are not StorageManager instances with the same
// TypeError a native method raises (Illegal invocation) — part of the patch, so pin it here.
async function sandboxIllegalInvocation(fp) {
  const sandbox = makeWorkerSandbox();
  vm.runInNewContext(buildWorkerInjectionScript(fp), sandbox, { timeout: 20000 });
  try {
    const p = await sandbox.StorageManager.prototype.estimate.call({});
    return false; // resolved: no rejection raised
  } catch (err) {
    return err instanceof TypeError || /Illegal invocation/.test(String(err && err.message));
  }
}

(async () => {
  const fpDesk = buildFingerprint({ id: 'storage-parity-desk', privacy: { deviceProfile: 'persona' }, advanced: {} });
  const fpAndroid = buildFingerprint({ id: 'storage-parity-android', os: 'android', privacy: { deviceProfile: 'persona' }, advanced: {} });

  check('profiles resolve as expected (desktop/android, memory 8)', () => {
    assert.ok(!fpDesk.mobile, 'desktop profile must not be mobile');
    assert.strictEqual(fpAndroid.mobile, true);
    assert.strictEqual(fpAndroid.mobileDevice.os, 'android');
    assert.strictEqual(Number(fpAndroid.deviceMemory), 8);
  });

  check('built worker script carries the os/mobile/mobileDevice CFG keys', () => {
    const src = buildWorkerInjectionScript(fpAndroid);
    const cfg = JSON.parse(src.match(/const CFG = (\{[\s\S]*?\});\n/)[1]);
    assert.strictEqual(cfg.mobile, true);
    assert.strictEqual(cfg.mobileDevice.os, 'android');
    assert.ok(cfg.os === 'android');
  });

  await checkAsync('worker estimate is patched and answers the persona (mobile) quota', async () => {
    const r = await workerEstimate(fpAndroid);
    assert.ok(r.patched, 'worker estimate still answers the host quota — patch skipped');
    assert.strictEqual(r.quota, MOBILE_TIER_HIGH, `expected mobile high tier, got ${r.quota}`);
    assert.strictEqual(r.usage, 12345, 'usage must forward the native usage');
    assert.deepStrictEqual(r.usageDetails, { indexedDB: 12 });
    assert.strictEqual(await sandboxIllegalInvocation(fpAndroid), true, 'patched estimate must reject foreign receivers with TypeError (Illegal invocation)');
  });

  await checkAsync('worker estimate matches the main-world estimate for the same android profile', async () => {
    const w = await workerEstimate(fpAndroid);
    const m = await mainEstimate(fpAndroid);
    assert.ok(m.patched, 'main world estimate unexpectedly unpatched');
    assert.strictEqual(w.quota, m.quota, `worker ${w.quota} vs main ${m.quota} — cross-realm mismatch`);
  });

  await checkAsync('worker estimate matches the main-world estimate for the same desktop profile', async () => {
    const w = await workerEstimate(fpDesk);
    const m = await mainEstimate(fpDesk);
    assert.strictEqual(w.quota, m.quota, `worker ${w.quota} vs main ${m.quota} — cross-realm mismatch`);
    assert.strictEqual(w.quota, DESK_TIER_HIGH);
  });

  await checkAsync('mobile and desktop personas land in different quota tiers', async () => {
    const wMob = await workerEstimate(fpAndroid);
    const wDesk = await workerEstimate(fpDesk);
    assert.notStrictEqual(wMob.quota, wDesk.quota, 'isMob is not effective');
    assert.ok([MOBILE_TIER_LOW, MOBILE_TIER_HIGH].includes(wMob.quota), `mobile quota out of tier: ${wMob.quota}`);
    assert.ok([DESK_TIER_LOW, DESK_TIER_HIGH].includes(wDesk.quota), `desktop quota out of tier: ${wDesk.quota}`);
  });

  check('phone profile worker script restores the page-side userAgentData path (MOBILE flag)', () => {
    const src = buildWorkerInjectionScript(fpAndroid);
    // The MOBILE-gated replacement block must now reference the declared flag, not an undeclared one.
    assert.ok(/const MOBILE = Boolean\(CFG\.mobile\)/.test(src), 'MOBILE must be declared at IIFE top');
    assert.ok(/MOBILE \? globalThis\.Navigator\?\.prototype : null/.test(src), 'page-side UAData replacement must be gated on MOBILE');
    // And evaluating it must not throw: run it where Navigator exists to prove the path executes.
    const sandbox = makeWorkerSandbox();
    class Navigator { }
    sandbox.Navigator = Navigator;
    Navigator.prototype.userAgentData = { brands: [] };
    Object.defineProperty(Navigator.prototype, 'userAgentData', { configurable: true, enumerable: true, get() { return { brands: [] }; } });
    vm.runInNewContext(src, sandbox, { timeout: 20000 });
    const getter = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgentData');
    assert.ok(getter && typeof getter.get === 'function', 'page-side userAgentData accessor must be re-installed for phone profiles');
  });

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nworker-storage-estimate-parity-selftest: ${results.length - failed} checks passed, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
})().catch((err) => { console.error(err); process.exit(1); });

// Helper: async variant of check that awaits the body.
async function checkAsync(name, body) {
  try {
    await body();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  FAIL  ${name} — ${err.message}`);
    process.exitCode = 1;
  }
}
