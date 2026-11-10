#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const path = require('node:path');
const vm = require('node:vm');
const { mergeStatusDelta } = require('../ui/ui-status-controller');

// Run the exact previous renderer merge block, without booting its DOM wiring.
const baseline = process.argv[2] || 'c8c4102';
const source = execFileSync('git', ['show', `${baseline}:Browserapp/renderer.js`], {
  cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
});
const start = source.indexOf('const byId = new Map(delta.rows.map');
const end = source.indexOf('__statusWatermark = delta.watermark', start);
if (start < 0 || end < 0) throw new Error('Baseline has no supported status merge block');
const previous = vm.runInThisContext(`(function(rows, delta) { let engineProfiles = rows; ${source.slice(start, end)} return engineProfiles; })`);
const rows = Array.from({ length: 10000 }, (_, id) => ({ id: `profile-${id}`, rev: 1 }));
const delta = { full: false, rows: Array.from({ length: 1000 }, (_, id) => ({ id: `added-${id}`, rev: 1 })), removed: [] };
assert.deepEqual(mergeStatusDelta(rows, delta), previous(rows, delta));
function measure(run) {
  run();
  const samplesMs = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now(); run(); samplesMs.push(performance.now() - start);
  }
  return { medianMs: [...samplesMs].sort((a, b) => a - b)[2], samplesMs };
}
console.log(JSON.stringify({ baseline, node: process.version, measuredAt: new Date().toISOString(),
  scope: 'in-memory status merge only; no desktop or browser workload', parity: true,
  profiles: rows.length, added: delta.rows.length,
  before: measure(() => previous(rows, delta)), after: measure(() => mergeStatusDelta(rows, delta)),
  unchangedPreservesArray: mergeStatusDelta(rows, { full: false, rows: [] }) === rows,
}, null, 2));
