#!/usr/bin/env node
'use strict';

/**
 * Offline CPU microbenchmarks for the profile/extension review.
 * Run from any directory: node scripts/benchmark-review.js [baseline revision]
 * Baseline defaults to the reviewed commit, not the moving branch head.
 * Timings exclude IPC, DOM, browsers, encryption and disk persistence.
 */
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');

const ROOT = path.resolve(__dirname, '..', '..');
const revision = process.argv[2] || '0c06ae8';
const readBaseline = (file) => execFileSync('git', ['show', `${revision}:${file}`], { cwd: ROOT, encoding: 'utf8' });
const readCurrent = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const profiles = Array.from({ length: 1000 }, (_, index) => ({
  id: `env-${index}`, number: index + 1, name: `Profile ${index}`, title: `Title ${index}`,
  groupId: `group-${index % 20}`, proxy: 'socks5://127.0.0.1:1080', tag: 'retail',
  updatedAt: new Date(Date.UTC(2026, 0, 1) + ((index * 7919) % 1000) * 60000).toISOString(),
}));

function loadView(read) {
  const scope = vm.createContext({ window: {}, ui: { profiles },
    activeGroupFilter: 'all', activeListTab: 'all', advancedFilterState: null,
    profileSort: { key: '', dir: 1 }, $: () => ({ value: '' }),
    displayProfileNumber: (profile) => profile.number,
    groupNameOf: (profile) => profile.groupId,
    profileEngine: () => ({ running: false }),
  });
  vm.runInContext(read('Browserapp/ui/ui-profile-list.js'), scope);
  const renderer = read('Browserapp/renderer.js');
  const start = renderer.indexOf('function filteredProfilesForCurrentView() {');
  const end = renderer.indexOf('\n// ===== Roxy 对齐：列表标签条', start);
  assert.ok(start >= 0 && end > start, 'profile view function boundaries');
  vm.runInContext(renderer.slice(start, end), scope);
  return { run: () => scope.filteredProfilesForCurrentView(), scope };
}

function extensionMethod(source) {
  const start = source.indexOf('  listExtensions() {');
  const end = source.indexOf('  async assignExtension(', start);
  assert.ok(start >= 0 && end > start, 'extension method boundaries');
  return vm.runInNewContext(`({${source.slice(start, end)}})`).listExtensions;
}

function measure(run) {
  for (let i = 0; i < 30; i += 1) run();
  const samples = [];
  for (let sample = 0; sample < 9; sample += 1) {
    const start = performance.now();
    for (let i = 0; i < 30; i += 1) run();
    samples.push((performance.now() - start) / 30);
  }
  return samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)];
}

const results = [];
function compare(name, before, after) {
  assert.deepEqual(JSON.parse(JSON.stringify(after())), JSON.parse(JSON.stringify(before())), `${name}: results must match`);
  const beforeMs = measure(before);
  const afterMs = measure(after);
  results.push({ name, beforeMs: +beforeMs.toFixed(4), afterMs: +afterMs.toFixed(4),
    speedup: +(beforeMs / afterMs).toFixed(2) });
}

const before = loadView(readBaseline);
const after = loadView(readCurrent);
compare('1000 profiles: empty search', before.run, after.run);
before.scope.profileSort = after.scope.profileSort = { key: 'updated', dir: -1 };
compare('1000 profiles: date sort', before.run, after.run);
before.scope.profileSort = after.scope.profileSort = { key: '', dir: 1 };
before.scope.$ = after.scope.$ = () => ({ value: 'tag::retail' });
compare('1000 profiles: field search', before.run, after.run);

const extensions = new Map(Array.from({ length: 100 }, (_, i) => [`ext-${i}`, { id: `ext-${i}` }]));
const engine = {
  profiles: new Map(profiles.map((profile) => [profile.id, profile])), extensions,
  assignments: new Map(profiles.map((profile, i) => [profile.id, new Set([`ext-${i % 100}`, `ext-${(i + 1) % 100}`, `ext-${(i + 2) % 100}`])])),
};
const oldList = extensionMethod(readBaseline('Browserapp/engine.js'));
const newList = extensionMethod(readCurrent('Browserapp/engine/extensions-api.js'));
compare('1000 profiles, 100 extensions, 3 assignments/profile', () => oldList.call(engine), () => newList.call(engine));

// Stable operation counts complement host-dependent timings.
function countProjections(view) {
  let count = 0;
  view.scope.$ = () => ({ value: '' });
  view.scope.displayProfileNumber = () => { count += 1; return ''; };
  view.scope.groupNameOf = () => { count += 1; return ''; };
  view.run();
  return count;
}
async function drainPollingTimers(source) {
  let count = 0;
  const scope = { module: { exports: {} }, clearTimeout,
    setTimeout: (callback, ms, ...args) => {
      if (ms === 5) count += 1;
      return setTimeout(callback, ms, ...args);
    },
  };
  vm.runInNewContext(source, scope);
  const scheduler = new scope.module.exports.TaskScheduler();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const job = scheduler.schedule(() => gate);
  const waiters = Array.from({ length: 100 }, () => scheduler.drain());
  release();
  await Promise.all([job, ...waiters]);
  return count;
}

(async () => {
  const schedulerFile = 'Browserapp/automation/task-scheduler.js';
  const drainTimers = { before: await drainPollingTimers(readBaseline(schedulerFile)),
    after: await drainPollingTimers(readCurrent(schedulerFile)) };
  console.log(JSON.stringify({ node: process.version, baseline: revision, profiles: profiles.length,
    samples: 'median of 9 batches, 30 calls/batch, 30 warmup calls', results,
    emptySearchDisplayProjections: { before: countProjections(before), after: countProjections(after) },
    schedulerDrainInitialPollingTimers: drainTimers,
  }, null, 2));
})().catch((error) => { console.error(error); process.exitCode = 1; });
