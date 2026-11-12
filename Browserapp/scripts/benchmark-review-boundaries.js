#!/usr/bin/env node
'use strict';

// Compare structural costs and fault behavior against a Git revision. Fake
// deadline timers isolate retained resources without wall-clock assumptions.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..', '..');
const ref = process.argv[2] || 'HEAD';

async function measure(revision) {
  const timers = new Set();
  const read = (file) => revision ? execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8' })
    : fs.readFileSync(path.join(root, file), 'utf8');
  const load = (file, dependencies = {}) => {
    const localRequire = createRequire(path.join(root, file));
    const module = { exports: {} };
    vm.runInNewContext(read(file), {
      module, console, Buffer, AbortController,
      require: (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : localRequire(name),
      setTimeout: (_callback, delay) => { const timer = { delay, unref() {} }; timers.add(timer); return timer; },
      clearTimeout: (timer) => timers.delete(timer),
    }, { filename: file });
    return module.exports;
  };
  const deferred = load('Browserapp/automation/deferred-queue.js');
  const { createCoalescedWriter } = load('Browserapp/automation/coalesced-writer.js', { './deferred-queue': deferred });
  let writes = 0;
  const writer = createCoalescedWriter({ delayMs: 10, write: () => { writes += 1; } });
  const requests = Array.from({ length: 10000 }, () => writer.request());
  const dirtyMarkers = writer.stats().pending;
  await writer.flushNow(); await Promise.all(requests);

  let fail = true;
  const failing = createCoalescedWriter({ delayMs: 10, maxRetryDelayMs: 40, write: () => { if (fail) throw Error('disk'); } });
  const requested = failing.request().catch(() => {});
  const retryDelays = [];
  for (let index = 0; index < 4; index += 1) {
    await failing.flushNow().catch(() => {});
    retryDelays.push([...timers].at(-1)?.delay);
  }
  await requested; fail = false; await failing.flushNow();

  const queue = new deferred.DeferredQueue();
  let largeBatch;
  try { queue.addAll(Array.from({ length: 200000 }, (_, index) => index)); largeBatch = queue.size; }
  catch (error) { largeBatch = error.name; }

  const { runProxyProbes } = load('Browserapp/engine/proxy-probe-runner.js');
  const probes = await runProxyProbes(Array.from({ length: 1000 }, () => () => ({ ip: '192.0.2.1' })));
  const probeTimersRetained = timers.size;

  const proxyMethods = load('Browserapp/engine/profile-proxy.js');
  let resolveProbe;
  const profile = { id: 'review', name: 'Original', proxy: 'http://127.0.0.1:9' };
  const host = Object.assign({}, proxyMethods, {
    profiles: new Map([[profile.id, profile]]), networkInfo: new Map(), running: new Map(),
    sanitizeProfile: (value) => value, resolveStoredProxyProfile: (value) => value,
    restoreStoredProxyCredentials: (value) => value,
    testProxy: () => new Promise((resolve) => { resolveProbe = resolve; }),
    fingerprintPatchFromNetwork: () => ({}), emit() {}, invalidateStatusCache() {},
  });
  const pending = host.checkProxy(profile).then(() => 'applied', (error) => error.code);
  host.profiles.set(profile.id, { ...profile, name: 'Edited' });
  resolveProbe({ ip: '192.0.2.2' });
  const staleResult = await pending;
  return { saveRequests: requests.length, dirtyMarkers, writes, retryDelays,
    largeBatchItems: largeBatch, completedProbes: probes.length, probeTimersRetained,
    staleProbeResult: staleResult, profileNameAfterProbe: host.profiles.get(profile.id).name };
}

(async () => {
  const baseline = await measure(ref), current = await measure(null);
  console.log(JSON.stringify({ baselineRef: ref, baseline, current,
    scope: 'Deterministic operation and retained-resource counts; not desktop/browser throughput.' }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
