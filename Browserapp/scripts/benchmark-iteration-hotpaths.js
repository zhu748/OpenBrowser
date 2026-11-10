#!/usr/bin/env node
'use strict';

// Local CPU/queue benchmark. No browser, IPC, network or disk timing claims.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const Module = require('node:module');
const { TaskScheduler } = require('../automation/task-scheduler');
const { orderedSessionIds } = require('../ui/ui-sync-text');
const { removeProfilesById } = require('../ui/ui-profile-batch');

const baseline = process.argv[2] || '4867888';
const sourceAt = (file) => execFileSync('git', ['show', `${baseline}:Browserapp/${file}`], { encoding: 'utf8' });
const legacyModule = new Module(__filename, module);
legacyModule.filename = __filename;
legacyModule.paths = module.paths;
legacyModule._compile(sourceAt('automation/task-scheduler.js'), __filename);
const LegacyScheduler = legacyModule.exports.TaskScheduler;
const source = sourceAt('renderer.js');
const start = source.indexOf('function specifiedTextSessionIds() {');
const end = source.indexOf('\nfunction specifiedTextFailureLabel', start);
assert.ok(start >= 0 && end > start);
const method = source.slice(start, end);
const legacyOrder = new Function('selectedSessionIds', 'sessions', 'displayProfileNumber', method.slice(method.indexOf('{') + 1, method.lastIndexOf('}')));

async function median(run) {
  const values = [];
  for (let pass = 0; pass < 7; pass += 1) {
    const start = performance.now();
    await run();
    if (pass >= 2) values.push(performance.now() - start);
  }
  return +values.sort((a, b) => a - b)[2].toFixed(3);
}

async function drain(Scheduler, size) {
  const scheduler = new Scheduler();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const first = scheduler.schedule(() => gate);
  const jobs = Array.from({ length: size }, (_, index) => scheduler.schedule(() => index));
  release();
  await first;
  const result = await Promise.all(jobs);
  await scheduler.drain();
  assert.equal(result.length, size);
  assert.equal(result.at(-1), size - 1);
}

async function main() {
  const scheduler = [];
  for (const size of [1000, 10000, 30000]) {
    scheduler.push({ size, beforeMedianMs: await median(() => drain(LegacyScheduler, size)),
      afterMedianMs: await median(() => drain(TaskScheduler, size)) });
  }
  const sessionSort = [];
  for (const size of [100, 1000, 3000]) {
    const sessions = Array.from({ length: size }, (_, index) => ({ id: String(index), profile: { number: size - index } }));
    const ids = sessions.map((session) => session.id);
    const numberOf = (profile) => profile.number ?? profile.id;
    const expected = ids.slice().reverse();
    sessionSort.push({ size,
      beforeMedianMs: await median(() => assert.deepEqual(legacyOrder(() => ids.slice(), sessions, numberOf), expected)),
      afterMedianMs: await median(() => assert.deepEqual(orderedSessionIds(ids, sessions, numberOf), expected)) });
  }
  const batchRemoval = [];
  for (const size of [1000, 10000, 20000]) {
    const profiles = Array.from({ length: size }, (_, index) => ({ id: String(index) }));
    const ids = profiles.filter((_, index) => index % 2 === 0).map((profile) => profile.id);
    const expected = profiles.filter((_, index) => index % 2 !== 0);
    batchRemoval.push({ size,
      beforeMedianMs: await median(() => assert.deepEqual(profiles.filter((profile) => !ids.includes(profile.id)), expected)),
      afterMedianMs: await median(() => assert.deepEqual(removeProfilesById(profiles, ids), expected)) });
  }
  console.log(JSON.stringify({ baseline, node: process.version, platform: process.platform,
    scope: 'Local Node CPU and queue latency; 2 warmups, 5 samples; not whole-application speedups.',
    scheduler, sessionSort, batchRemoval }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
