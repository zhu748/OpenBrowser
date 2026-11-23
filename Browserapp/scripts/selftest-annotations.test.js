'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { formatOrdinarySmokeFailure } = require('./selftest-all');
const { classifySelftestResult } = require('./selftest-status');

const label = 'selftest:settings';
const format = (result, name = label, githubActions = 'true') =>
  formatOrdinarySmokeFailure(name, classifySelftestResult(result), result, githubActions);

test('an ordinary child failure emits one static GitHub annotation', () => {
  assert.equal(format({ status: 23, stdout: 'fixture stdout', stderr: 'fixture stderr' }),
    '::error::Smoke selftest failed: Local settings (exit 23)');
  assert.equal(format({ status: 1 }, 'selftest:workbenchipc'),
    '::error::Smoke selftest failed: Workbench IPC (exit 1)');
  assert.equal(format({ status: 1 }, 'selftest:statestorage'),
    '::error::Smoke selftest failed: State storage (exit 1)');
  assert.equal(format({ status: 2 }),
    '::error::Smoke selftest failed: Local settings (exit 2)');
});

test('only failed allowlisted suites in GitHub Actions are annotated', () => {
  assert.equal(format({ status: 0 }), null);
  assert.equal(format({ status: 2, stdout: 'SKIP fixture' }), null);
  assert.equal(format({ status: 0, stdout: 'PASS local check\nSKIP fixture' }), null);
  assert.equal(format({ status: 1 }, label, 'false'), null);
  assert.equal(format({ status: 1 }, label, 'true\n::error::invalid'), null);
  for (const name of ['selftest:sqlitestore', 'selftest:localroutes', 'not-allowlisted', '__proto__']) {
    assert.equal(format({ status: 1 }, name), null);
  }
});

test('failure classes are fixed and never echo child data or invalid status values', () => {
  const privateText = 'private/fixture\n::notice::untrusted';
  for (const [result, suffix] of [
    [{ status: null, signal: 'SIGTERM', error: { code: 'ETIMEDOUT', message: privateText } }, 'timed out'],
    [{ status: null, error: { code: 'ENOBUFS', message: privateText } }, 'output limit'],
    [{ status: null, error: { code: privateText, message: privateText } }, 'child process error'],
    [{ status: null, signal: privateText }, 'terminated by signal'],
    [{ status: privateText }, 'no numeric exit code'],
    [{ status: 256 }, 'no numeric exit code'],
    [{ status: 255 }, 'exit 255'],
  ]) {
    assert.equal(format({ ...result, stdout: privateText, stderr: privateText }),
      `::error::Smoke selftest failed: Local settings (${suffix})`);
  }
});
