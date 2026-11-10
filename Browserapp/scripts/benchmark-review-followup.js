#!/usr/bin/env node
'use strict';

// Compare actual baseline functions against current entry points. Row counts use
// a DOM model, not browser layout timing. Task timings are local Node medians.
// Usage: node scripts/benchmark-review-followup.js [baseline-commit]
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const assert = require('node:assert/strict');
const { reconcileProfileRows } = require('../ui/ui-profile-rows');
const { pruneTaskHistory } = require('../automation/rpa/task-records');
const { createProfileTable } = require('../automation/selftests/helpers/profile-table');

const baseline = process.argv[2] || '4867888';
const sourceAt = (file) => execFileSync('git', ['show', `${baseline}:Browserapp/${file}`], { encoding: 'utf8' });
const renderer = sourceAt('renderer.js');
const start = renderer.indexOf('  const existingRows = new Map(');
const end = renderer.indexOf("  const inTrash = activeGroupFilter === 'trash';", start);
assert.ok(start >= 0 && end > start, 'baseline renderer row loop is present');
const legacyRows = new Function('table', 'visible', 'renderKeyFor', 'buildProfileRow', 'selectedProfiles', renderer.slice(start, end));
const store = sourceAt('automation/rpa-store.js');
const methodStart = store.indexOf('  pruneTasks() {');
const methodEnd = store.indexOf('  async deleteTask(', methodStart);
assert.ok(methodStart >= 0 && methodEnd > methodStart, 'baseline history method is present');
const method = store.slice(methodStart, methodEnd);
const legacyPrune = new Function('TASK_HISTORY_LIMIT', method.slice(method.indexOf('{') + 1, method.lastIndexOf('}')));

const rowMutations = [10, 50, 100].map((size) => {
  const profiles = Array.from({ length: size }, (_, index) => ({ id: String(index) }));
  const before = createProfileTable(profiles);
  const after = createProfileTable(profiles);
  const selectedIds = new Set();
  for (let pass = 0; pass < 100; pass += 1) {
    legacyRows(before.table, profiles, before.renderKeyFor, before.buildRow, selectedIds);
    reconcileProfileRows({ ...after, profiles, selectedIds });
  }
  assert.deepEqual(before.table.children.map((row) => row.dataset.profileId), profiles.map((item) => item.id));
  assert.deepEqual(after.table.children.map((row) => row.dataset.profileId), profiles.map((item) => item.id));
  return { size, refreshes: 100, beforePlacements: before.table.placements, afterPlacements: after.table.placements };
});

function measure(run, tasks) {
  const samples = [];
  for (let pass = 0; pass < 7; pass += 1) {
    const data = tasks.slice();
    const start = performance.now();
    run(data);
    const elapsed = performance.now() - start;
    assert.deepEqual(data, tasks.slice(tasks.length / 2), 'all active tasks survive in order');
    if (pass >= 2) samples.push(elapsed);
  }
  return samples.sort((a, b) => a - b)[2];
}
const taskRetention = [1000, 10000, 20000].map((size) => {
  const tasks = Array.from({ length: size }, (_, index) => ({ id: index, status: index < size / 2 ? 'success' : 'running' }));
  const beforeMs = measure((data) => legacyPrune.call({ data: { tasks: data } }, 100), tasks);
  const afterMs = measure((data) => pruneTaskHistory(data, 100), tasks);
  return { size, beforeMedianMs: +beforeMs.toFixed(3), afterMedianMs: +afterMs.toFixed(3), speedup: +(beforeMs / afterMs).toFixed(2) };
});
console.log(JSON.stringify({ baseline, node: process.version, platform: process.platform,
  scope: 'Row DOM-operation model; local in-memory task-retention benchmark; no browser or disk timings.',
  rowMutations, taskRetention }, null, 2));
