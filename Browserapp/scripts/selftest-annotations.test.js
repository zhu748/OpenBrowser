'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
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

function runInertAggregate(cases, env = { GITHUB_ACTIONS: 'true' }, args = []) {
  const filename = path.join(__dirname, 'selftest-all.js');
  const source = fs.readFileSync(filename, 'utf8');
  const start = source.indexOf('const SUITE = [');
  const end = source.indexOf('\n];', start);
  assert.ok(start >= 0 && end > start);
  const fixtures = cases.map(({ alternate }, i) => [
    `inert-child-${i}`, `inert-fixture-${i}.js`, { nativeOnly: Boolean(alternate) },
  ]);
  const isolated = source.slice(0, start) + `const SUITE = ${JSON.stringify(fixtures)};` + source.slice(end + 3);
  const notices = [], exits = [], spawned = [];
  const mod = { exports: {} };
  function stubRequire(name) {
    if (name === 'path') return path;
    if (name === './workbench-test-registry') return { nodeWorkbenchTests: [] };
    if (name === './selftest-status') return { classifySelftestResult };
    if (name === 'child_process') return { spawnSync: (_exec, [file]) => {
      const index = fixtures.findIndex(([, name]) => name === path.basename(file));
      assert.ok(index >= 0, 'invoked only registered fixtures');
      spawned.push(index);
      if (cases[index].throws) throw Error('inert runner error');
      return cases[index].result;
    } };
    throw Error('Unexpected dependency in inert fixture: ' + name);
  }
  stubRequire.main = mod;
  let error;
  try {
    vm.runInNewContext(isolated, {
      __dirname, module: mod, require: stubRequire,
      process: { env, argv: ['node', filename, ...args], execPath: 'inert', platform: 'linux', stdout: { write() {} },
        exit: code => exits.push(code) },
      console: { log(line) { if (line.startsWith('::notice::')) notices.push(line); } },
    }, { filename, timeout: 1000 });
  } catch (failure) {
    error = failure;
  }
  return { notices, exits, spawned, error };
}

test('a completed aggregate failure exposes counts for the two routes, without child details', () => {
  const run = runInertAggregate([
    { result: { status: 1, stdout: 'private/fixture\n::notice::untrusted' } },
    { alternate: true, result: { status: null, error: { code: 'ENOBUFS', message: 'private error' } } },
    { alternate: true, result: { status: 2 } },
    { result: { status: 0 } },
  ]);
  assert.equal(run.error, undefined);
  assert.deepEqual(run.spawned, [0, 1, 2, 3]);
  assert.deepEqual(run.exits, [1]);
  assert.deepEqual(run.notices, ['::notice::Smoke aggregate decision: child-failure ordinaryFailed=1 alternateFailed=1']);
});

test('strict incomplete, non-CI, and pre-decision interruption remain distinct', () => {
  const fixtures = [
    { result: { status: 0, stdout: 'PASS inert\nSKIP inert' } },
    { alternate: true, result: { status: 2 } },
  ];
  const strict = runInertAggregate(fixtures, { GITHUB_ACTIONS: 'true', OPENBROWSER_REQUIRE_COMPLETE_TESTS: '1' });
  assert.equal(strict.error, undefined);
  assert.deepEqual(strict.exits, [1]);
  assert.deepEqual(strict.notices, ['::notice::Smoke aggregate decision: strict-incomplete skipped=1 partial=1']);
  const normal = runInertAggregate(fixtures);
  assert.equal(normal.error, undefined);
  assert.deepEqual(normal.exits, [0]);
  assert.deepEqual(normal.notices, []);
  const local = runInertAggregate([{ result: { status: 1 } }], {});
  assert.equal(local.error, undefined);
  assert.deepEqual(local.exits, [1]);
  assert.deepEqual(local.notices, []);
  const interrupted = runInertAggregate([{ throws: true }]);
  assert.equal(interrupted.error?.message, 'inert runner error');
  assert.deepEqual(interrupted.exits, []);
  assert.deepEqual(interrupted.notices, []);
});

test('kernel-free CI bypasses native fixtures and reports them as skipped', () => {
  const run = runInertAggregate([
    { result: { status: 0 } },
    { alternate: true, throws: true },
    { result: { status: 0 } },
  ], { GITHUB_ACTIONS: 'true', OPENBROWSER_REQUIRE_COMPLETE_TESTS: '1' }, ['--skip-native']);
  assert.equal(run.error, undefined);
  assert.deepEqual(run.spawned, [0, 2]);
  assert.deepEqual(run.exits, [1]);
  assert.deepEqual(run.notices, ['::notice::Smoke aggregate decision: strict-incomplete skipped=1 partial=0']);
});
