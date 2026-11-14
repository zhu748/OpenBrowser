'use strict';

// Guards the re-inject contract of the runtime fingerprint pass.
//
// The injector wraps the live readers, so running an identical config over the same document twice
// adds a second layer of noise and moves canvas / clientRects while the profile is already in use.
// The launch sequence drives two passes back to back (before and after the start page) and the watch
// loop keeps sweeping, so those repeats must not reach the injector:
//   1. same config + recorded hash  -> no inject at all
//   2. same config, no recorded hash -> still trusted (callers that do not track a hash)
//   3. different config              -> every live tab is re-applied, then tracked stays quiet

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const assert = require('assert');

let passed = 0;
const ok = (name, cond) => { assert.ok(cond, name); console.log('  PASS  ' + name); passed += 1; };

(async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'fpreinject-'));
  process.env.OPENBROWSER_FP_LOG = path.join(dir, 'fp.log');

  // Swap the injector for a spy before the engine captures its imports, so counting "did the
  // runtime decide to inject" never needs a live browser.
  const fpPath = require.resolve('../fingerprint');
  const realFingerprint = require(fpPath);
  const injectCalls = [];
  require.cache[fpPath] = {
    id: fpPath,
    filename: fpPath,
    loaded: true,
    exports: {
      ...realFingerprint,
      applyFingerprintToTab: async (...args) => { injectCalls.push(args); },
    },
  };

  const cdp = require('../../cdp');
  const { BrowserEngine } = require('../../engine.js');

  const originalTabs = cdp.tabs;
  const originalCall = cdp.call;
  const originalConnect = cdp.connect;
  const tabs = [
    { id: 'T1', url: 'https://example.com/a', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/1' },
    { id: 'T2', url: 'https://example.com/b', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/2' },
  ];
  cdp.tabs = async () => tabs;
  cdp.call = async () => { const fp = injectCalls.at(-1)?.[2] || {}; return { result: { value: { userAgent: fp.userAgent, platform: fp.platform, hardwareConcurrency: fp.hardwareConcurrency } } }; };

  cdp.connect = async (url) => ({ command: (method, params) => cdp.call(url, method, params), close() {} });

  const run = (fingerprint, options) => BrowserEngine.prototype.applyRuntimeSettings.call(
    { networkInfo: new Map() }, 9222, { id: 'reinject', advanced: {}, privacy: {} }, fingerprint, options,
  );

  try {
    const tracked = {};
    const fpA = { userAgent: 'UA-A', platform: 'Win32', hardwareConcurrency: 8 };
    const fpB = { userAgent: 'UA-B', platform: 'Win32', hardwareConcurrency: 8 };

    await run(fpA, { appliedTargetIds: new Set(), trackOn: tracked, phase: 'pre-startpage' });
    ok('first pass injects every live tab', injectCalls.length === 2);
    ok('first pass records the config hash', typeof tracked.fpAppliedHash === 'string' && tracked.fpAppliedHash.length > 0);
    ok('first pass records every tab', tracked.fpAppliedTargets instanceof Set && tracked.fpAppliedTargets.size === 2);

    injectCalls.length = 0;
    await run(fpA, {
      appliedTargetIds: tracked.fpAppliedTargets,
      appliedFingerprintHash: tracked.fpAppliedHash,
      trackOn: tracked,
      phase: 'post-startpage',
    });
    ok('identical config after the start page does not re-inject', injectCalls.length === 0);
    ok('re-inject guard still refreshes tracked state', tracked.fpAppliedTargets.size === 2 && tracked.fpAppliedHash.length > 0);

    injectCalls.length = 0;
    await run(fpA, {
      appliedTargetIds: tracked.fpAppliedTargets,
      trackOn: tracked,
      phase: 'watch-ensure',
    });
    ok('a caller that records no hash keeps the tracked cache', injectCalls.length === 0);

    injectCalls.length = 0;
    const previousHash = tracked.fpAppliedHash;
    await run(fpB, {
      appliedTargetIds: tracked.fpAppliedTargets,
      appliedFingerprintHash: previousHash,
      trackOn: tracked,
      phase: 'watch-ensure',
    });
    ok('a different config re-applies every live tab', injectCalls.length === 2);
    ok('a different config replaces the recorded hash', tracked.fpAppliedHash !== previousHash);

    injectCalls.length = 0;
    await run(fpB, {
      appliedTargetIds: tracked.fpAppliedTargets,
      appliedFingerprintHash: tracked.fpAppliedHash,
      trackOn: tracked,
      phase: 'watch-ensure',
    });
    ok('the re-applied config is trusted on the next sweep', injectCalls.length === 0);

    injectCalls.length = 0;
    const pendingState = { targetId: 'T1', ready: false, reason: null };
    const pendingOwner = { fingerprintSessionStates: new Map([['pending-session', pendingState]]) };
    const ownedApplied = new Set(['T2']);
    await run(fpB, { appliedTargetIds: ownedApplied, trackOn: pendingOwner, phase: 'watch-ensure' });
    ok('watch does not compete with the auto-attach owner of a paused document', injectCalls.length === 0);
    ok('pending document remains unverified in the applied set', !ownedApplied.has('T1'));
    pendingState.ready = true;
    await run(fpB, { appliedTargetIds: ownedApplied, trackOn: pendingOwner, phase: 'watch-ensure' });
    ok('a ready target still receives fallback injection and verification when needed', injectCalls.length === 1 && ownedApplied.has('T1'));

    injectCalls.length = 0;
    const laterState = { targetId: 'T1', ready: true, reason: null };
    const laterOwner = { fingerprintSessionStates: new Map([['late-session', laterState]]) };
    const steadyTabs = cdp.tabs;
    cdp.tabs = async () => { queueMicrotask(() => queueMicrotask(() => { laterState.ready = false; }));return tabs; };
    try {
      await run(fpB, { appliedTargetIds: new Set(['T2']), trackOn: laterOwner, phase: 'watch-ensure' });
      ok('an attach owner appearing after the target snapshot also prevents competing injection', injectCalls.length === 0);
    } finally { cdp.tabs = steadyTabs; }

    const healthyCall = cdp.call;
    cdp.call = async (url, method, ...args) => { if (method === 'Runtime.evaluate') throw Error('intentional live delivery failure');return healthyCall(url, method, ...args); };
    try {
      for (const failed of [false, true]) {
        const state = { targetId: 'T1', ready: !failed, reason: failed ? 'failed' : null };
        await assert.rejects(run(fpB, { appliedTargetIds: new Set(['T2']), trackOn: { fingerprintSessionStates: new Map([['state', state]]) }, phase: 'watch-ensure' }), /intentional live delivery failure/);
        ok(failed ? 'a failed attach owner cannot suppress a real delivery error' : 'real errors on ready live documents still reject', true);
      }
    } finally { cdp.call = healthyCall; }

    const log = fs.existsSync(process.env.OPENBROWSER_FP_LOG)
      ? await fsp.readFile(process.env.OPENBROWSER_FP_LOG, 'utf8')
      : '';
    ok('guard passes stay out of the diagnostic log', !log.includes('"phase":"watch-ensure"') || log.split('\n').filter(Boolean).length < 40);
  } finally {
    cdp.tabs = originalTabs;
    cdp.call = originalCall;
    cdp.connect = originalConnect;
    delete process.env.OPENBROWSER_FP_LOG;
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }

  console.log(`\nfingerprint-reinject-guard-selftest: ${passed} checks passed.`);
  process.exit(0);
})().catch((error) => {
  console.error('fingerprint-reinject-guard-selftest FAILED:', (error && error.stack) || error);
  process.exit(1);
});
