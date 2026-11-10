#!/usr/bin/env node
'use strict';

/** Compare the old store-budget method with the current standalone policy. */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { enforceStoreBudget } = require('../automation/rpa-store-budget');

const root = path.resolve(__dirname, '../..');
const revision = process.argv[2] || '0c06ae8';
const source = execFileSync('git', ['show', `${revision}:Browserapp/automation/rpa-store.js`], { cwd: root, encoding: 'utf8' });
const start = source.indexOf('  enforceStoreBudget() {');
const end = source.indexOf('  // ---------- plans ----------', start);
assert.ok(start >= 0 && end > start, 'baseline method boundaries');
const legacy = vm.runInNewContext(`({${source.slice(start, end)}})`, { Buffer, JSON }).enforceStoreBudget;
const fixture = {
  version: 4, plans: [], templates: [], config: {},
  tasks: Array.from({ length: 1000 }, (_, i) => ({ id: `task-${i}`, status: i ? 'success' : 'running',
    process_logs: [{ message: 'history' }], process_result: { variables: { value: 'x'.repeat(256) } } })),
};
const originalBytes = Buffer.byteLength(JSON.stringify(fixture));
const limitBytes = Math.floor(originalBytes / 4);
const stringify = JSON.stringify;

function measure(run) {
  const data = structuredClone(fixture);
  let calls = 0;
  JSON.stringify = (...args) => { calls += 1; return stringify(...args); };
  const started = performance.now();
  try { run(data); }
  finally { JSON.stringify = stringify; }
  const ms = performance.now() - started;
  const finalBytes = Buffer.byteLength(stringify(data));
  assert.ok(finalBytes <= limitBytes, 'the resulting compact JSON fits the budget');
  assert.equal(data.tasks[0].id, 'task-0', 'the newest/active task is retained');
  return { ms: +ms.toFixed(4), serializationCalls: calls, retainedTasks: data.tasks.length, finalBytes };
}

const before = [];
const after = [];
for (let i = 0; i < 6; i += 1) {
  const a = measure((data) => legacy.call({ data, sizeLimitBytes: limitBytes }));
  const b = measure((data) => enforceStoreBudget(data, limitBytes));
  if (i) { before.push(a); after.push(b); }
}
const median = (values) => values.sort((a, b) => a.ms - b.ms)[Math.floor(values.length / 2)];
const a = median(before);
const b = median(after);
console.log(JSON.stringify({ node: process.version, baseline: revision, tasks: fixture.tasks.length,
  originalBytes, limitBytes, samples: '1 warmup + median of 5 runs, CPU only, no filesystem',
  before: a, after: b, speedup: +(a.ms / b.ms).toFixed(2),
  originalPrettyBytes: Buffer.byteLength(JSON.stringify(fixture, null, 2)), originalCompactBytes: originalBytes,
}, null, 2));
