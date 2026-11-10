#!/usr/bin/env node
'use strict';

// CPU paths only; does not measure desktop latency, disk or real browsers.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const Module = require('node:module');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '../..');
const baseline = process.argv[2] || 'HEAD';

function loadBaseline(relative) {
  const source = execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const filename = path.join(root, relative);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source, filename);
  return loaded.exports;
}
function measure(run, repetitions = 5) {
  run();
  const samples = [];
  for (let i = 0; i < repetitions; i += 1) {
    const start = performance.now(); run(); samples.push(performance.now() - start);
  }
  return { medianMs: [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)], samplesMs: samples };
}
async function responsiveness(run) {
  const start = performance.now();
  const fired = new Promise((resolve) => setTimeout(() => resolve(performance.now() - start), 0));
  await run();
  return { totalMs: performance.now() - start, firstTimerMs: await fired };
}
async function main() {
  const previousProxy = loadBaseline('Browserapp/automation/proxy-store.js');
  const previousCloud = loadBaseline('Browserapp/automation/cloud-sync.js');
  const currentProxy = require('../automation/proxy-usage');
  const currentCloud = require('../automation/cloud-sync');
  const { encryptPayloadAsync } = require('../automation/cloud/package-crypto');
  const proxies = Array.from({ length: 200 }, (_, i) => ({ id: `proxy-${i}`, raw: `socks5://host-${i}.test:1080` }));
  const profiles = Array.from({ length: 2000 }, (_, i) => ({ id: `env-${i}`, proxy: `host-${i % 200}.test:1080`,
    ...(i % 2 ? { proxyId: `proxy-${i % 200}` } : {}) }));
  const project = (api) => api.summarizeProxyUsage(proxies, profiles).map(({ id, profiles, count }) => ({ id, profiles, count }));
  assert.deepEqual(project(currentProxy), project(previousProxy));
  const usage = { proxies: proxies.length, profiles: profiles.length,
    before: measure(() => previousProxy.summarizeProxyUsage(proxies, profiles)),
    after: measure(() => currentProxy.summarizeProxyUsage(proxies, profiles)) };
  const local = Array.from({ length: 10000 }, (_, i) => ({ id: `env-${i}`, name: `${i}`, updatedAt: '2026-01-01' }));
  const remote = Array.from({ length: 10000 }, (_, i) => ({ id: `env-${i + 5000}`, name: `${i}`, updatedAt: '2026-02-01' }));
  const merged = {};
  for (const mode of ['merge', 'local-wins', 'remote-wins', 'overwrite']) {
    const clean = ({ profiles, stats }) => ({ stats, profiles: profiles.map(({ syncedAt: _syncedAt, ...item }) => item) });
    assert.deepEqual(clean(currentCloud.mergeProfiles(local, remote, mode)), clean(previousCloud.mergeProfiles(local, remote, mode)));
    merged[mode] = { before: measure(() => previousCloud.mergeProfiles(local, remote, mode)),
      after: measure(() => currentCloud.mergeProfiles(local, remote, mode)) };
  }
  const cryptoTiming = {
    before: await responsiveness(() => previousCloud.encryptPayload(Buffer.from('benchmark'), 'benchmark-sync-cold')),
    after: await responsiveness(() => encryptPayloadAsync(Buffer.from('benchmark'), 'benchmark-async-cold')),
  };
  console.log(JSON.stringify({ baseline, node: process.version, measuredAt: new Date().toISOString(),
    scope: 'CPU snapshots and first cold KDF; not whole-app performance', parity: true,
    proxyUsage: usage, cloudMerge: { local: local.length, remote: remote.length, modes: merged }, crypto: cryptoTiming }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
