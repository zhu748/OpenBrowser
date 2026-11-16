'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SUITE } = require('../../scripts/selftest-all');
const { nativePlan, runPlan } = require('../../scripts/native-test-runner');

const runtimes = ['chromium', 'firefox', 'electron'];
const covered = new Set(runtimes.flatMap(runtime => nativePlan(runtime).map(test => test.name)));
assert.deepEqual([...covered].sort(), SUITE.filter(row => row[2]?.nativeOnly).map(row => row[0]).sort());
assert.deepEqual(nativePlan('firefox').find(test => test.name === 'selftest:inlineworkers').args, ['--firefox']);
assert.throws(() => nativePlan('chromium', [['new', 'test.js', { nativeOnly: true }]]), /Declare/);
assert.throws(() => nativePlan('chromium', [['new', 'test.js', { nativeOnly: true, runtimes: ['typo'] }]]), /Declare/);
const states = [
  { status: 0, stdout: 'PASS assertions ran' },
  { status: 2, stdout: 'SKIP browser missing' },
  { status: 0, stdout: 'PASS static\nSKIP native' },
  { status: null, signal: 'SIGTERM', error: Error('timeout') },
];
const logs = [];
const result = runPlan(states.map((_, i) => ({ name: String(i) })), {
  execute: test => states[Number(test.name)], saveLog: (test, output) => logs.push([test.name, output]),
});
assert.deepEqual(result.map(row => row.passed), [true, false, false, false]);
assert.equal(logs.length, states.length);
const workflow = fs.readFileSync(path.resolve(__dirname, '../../../.github/workflows/ci.yml'), 'utf8');
for (const runtime of ['chromium', 'firefox']) assert.ok(workflow.includes('native-test-runner.js --runtime ' + runtime));
assert.ok(workflow.includes('work/native-gates/'), 'native execution evidence is uploaded');
console.log('NATIVE_TEST_PLAN OK (registry coverage, per-browser variants, strict skip/partial/timeout handling, workflow wiring)');
