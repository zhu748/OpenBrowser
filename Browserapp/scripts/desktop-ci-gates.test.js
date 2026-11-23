'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const app = path.join(__dirname, '..');
function configuredStep(name) {
  const workflow = fs.readFileSync(path.join(app, '../.github/workflows/ci.yml'), 'utf8');
  return workflow.split('      - name: ' + name + '\n')[1]
    ?.split('\n      - name:')[0];
}
const configuredGateStep = () => configuredStep('Real DOM, preload, IPC, SQLite and editor conflict gates');
function configuredGateScript() {
  const gateStep = configuredGateStep();
  const script = gateStep?.match(/^ {10}bash (scripts\/desktop-ci-gates\.sh)$/m)?.[1];
  assert.ok(script, 'the Electron desktop CI step must invoke the tested wrapper');
  return path.join(app, script);
}
const gateScript = process.argv[2] || configuredGateScript();
const render = 'node_modules/electron/cli.js';
const shared = [
  'rebuild/maintenance-ui-selftest.cjs',
  'rebuild/templates-ui-selftest.cjs',
  'rebuild/source-workbench-ui-selftest.cjs',
  'rebuild/workbench-interactions-ui-selftest.cjs',
];
const final = [
  'rebuild/agent-tasks-ui-selftest.cjs',
  'rebuild/agent-history-ui-selftest.cjs',
  'rebuild/agent-streaming-ui-selftest.cjs',
  'rebuild/agent-conversation-cache-ui-selftest.cjs',
  'rebuild/agent-mcp-ui-selftest.cjs',
  'rebuild/agent-approval-ui-selftest.cjs',
];

function expected(runtime) {
  const linux = runtime === 'Linux';
  return [
    (linux ? 'xvfb-run -a ' : '') + render + (linux ? ' --no-sandbox' : '') +
      ' scripts/benchmark-real-render.js --sizes 10,100,1000 --skip-kernel --render-budget-ms 50 --json',
    ...(linux ? ['xvfb-run -a automation/selftests/app-startup-e2e-selftest.js'] : []),
    'rebuild/optimization-ui-selftest.cjs',
    ...shared,
    ...(linux ? ['rebuild/local-api-ui-selftest.cjs', 'rebuild/packaging-selftest.cjs'] : []),
    ...final,
  ];
}

function run(runtime, fail = 'never') {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-gate-test-'));
  try {
    // There is no real node/browser in PATH for this child. All CI commands
    // are inert stubs and only append their arguments to a trace.
    fs.writeFileSync(path.join(temp, 'node'), [
      '#!/bin/bash',
      'printf "%s%s\\n" "${XVFB:-}" "$*" >> "$TRACE"',
      'if [[ "$1" == "rebuild/maintenance-ui-selftest.cjs" && "$FAIL" != never ]]; then',
      '  if [[ "$FAIL" == always || ! -e "$ATTEMPTED" ]]; then',
      '    : > "$ATTEMPTED"',
      '    exit 23',
      '  fi',
      'fi',
      '',
    ].join('\n'), { mode: 0o700 });
    fs.writeFileSync(path.join(temp, 'xvfb-run'), '#!/bin/bash\n[[ "$1" == -a ]] || exit 98\nexport XVFB="xvfb-run -a "\nshift\nexec "$@"\n', { mode: 0o700 });
    const trace = path.join(temp, 'trace');
    const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', gateScript], {
      cwd: app,
      env: { PATH: temp, RUNNER_OS: runtime, FAIL: fail, TRACE: trace, ATTEMPTED: path.join(temp, 'attempted') },
      encoding: 'utf8',
      timeout: 5000,
    });
    if (result.error) throw result.error;
    return { code: result.status, calls: fs.readFileSync(trace, 'utf8').trim().split('\n'), output: result.stdout + result.stderr };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

const upToFailure = runtime => expected(runtime).slice(0, expected(runtime).indexOf(shared[0]) + 1);

test('Linux and Windows stop on the first failing command with its exit status', () => {
  for (const runtime of ['Linux', 'Windows']) {
    const result = run(runtime, 'always');
    assert.equal(result.code, 23, runtime);
    assert.deepEqual(result.calls, upToFailure(runtime), runtime);
    assert.match(result.output, /\[desktop gate\] FAIL Maintenance \(exit 23\)/);
    assert.deepEqual(result.output.match(/^::(?:error|warning)::Desktop gate failed: .*$/gm), [
      '::error::Desktop gate failed: Maintenance (exit 23)',
    ]);
    assert.doesNotMatch(result.output, /START Templates|retrying once/);
  }
});

test('macOS retries exactly once and propagates any retry failure', () => {
  const blocked = run('macOS', 'always');
  const firstRun = upToFailure('macOS');
  assert.equal(blocked.code, 23);
  assert.deepEqual(blocked.calls, [...firstRun, ...firstRun]);
  assert.equal(blocked.output.match(/retrying once/g)?.length, 1);
  assert.deepEqual(blocked.output.match(/^::(?:error|warning)::Desktop gate failed: .*$/gm), [
    '::warning::Desktop gate failed: Maintenance (exit 23)',
    '::error::Desktop gate failed: Maintenance (exit 23)',
  ]);
  const recovered = run('macOS', 'once');
  assert.equal(recovered.code, 0);
  assert.doesNotMatch(recovered.output, /^::error::/m);
  assert.deepEqual(recovered.calls, [...firstRun, ...expected('macOS')]);
});

test('an all-pass workflow keeps the original command order and platform branches', () => {
  for (const runtime of ['Linux', 'Windows', 'macOS']) {
    const result = run(runtime);
    assert.equal(result.code, 0, runtime);
    assert.deepEqual(result.calls, expected(runtime), runtime);
    assert.doesNotMatch(result.output, /^::(?:error|warning)::/m);
  }
});


test('the Linux workflow annotates a failing wrapper self-test before running gates', () => {
  const body = configuredGateStep()?.split('          if [[ "$RUNNER_OS"')[1];
  assert.ok(body);
  const command = 'if [[ "$RUNNER_OS"' + body.replace(/^ {10}/gm, '');
  const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c',
    'node() { return 37; }; bash() { echo unexpected-wrapper; };\n' + command],
  { env: { RUNNER_OS: 'Linux' }, encoding: 'utf8', timeout: 5000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 37, result.stderr);
  assert.equal(result.stdout.trim(), '::error::Desktop gate failed: Wrapper self-test (exit 37)');
});

function workbenchAttempt(runtime, mode, attemptOnly = false) {
  const step = configuredStep('Measure default workbench responsiveness')?.split('        run: |\n')[1];
  assert.ok(step, 'the workbench benchmark must remain wired into desktop CI');
  const body = step.replace(/^ {10}/gm, '');
  const end = body.indexOf('\nif bench');
  assert.ok(end > 0, 'the retry policy must use the tested benchmark attempt');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'workbench-watchdog-test-'));
  const timerTrace = path.join(temp, 'timers');
  const benchTrace = path.join(temp, 'benchmarks');
  fs.writeFileSync(timerTrace, '');
  try {
    fs.writeFileSync(path.join(temp, 'sleep'), [
      '#!/bin/bash',
      '[[ "$1" == 240 ]] || exit 97',
      'printf "%s\\n" "$$" >> "$TIMER_TRACE"',
      'if [[ "$MODE" == stalled ]]; then exec /bin/sleep 1.05; fi',
      'exec /bin/sleep 10',
      '',
    ].join('\n'), { mode: 0o700 });
    fs.writeFileSync(path.join(temp, 'node'), [
      '#!/bin/bash',
      'printf "%s\\n" "$*" >> "$BENCH_TRACE"',
      'if [[ "$MODE" == stalled ]]; then exec /bin/sleep 10; fi',
      'attempt=0',
      'while IFS= read -r line; do ((attempt+=1)); done < "$BENCH_TRACE"',
      'for ((p=0; p<100; p++)); do',
      '  timers=0',
      '  while IFS= read -r line; do ((timers+=1)); done < "$TIMER_TRACE"',
      '  ((timers >= attempt)) && break',
      '  /bin/sleep .01',
      'done',
      '((timers >= attempt)) || exit 98',
      'if [[ "$MODE" == failure || ( "$MODE" == recover && "$attempt" == 1 ) ]]; then exit 23; fi',
      'if [[ "$MODE" == exit137 ]]; then exit 137; fi',
      '',
    ].join('\n'), { mode: 0o700 });
    const result = spawnSync('/bin/bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c',
      attemptOnly ? body.slice(0, end) + '\nbench 1' : body], {
      cwd: app,
      env: { PATH: temp, RUNNER_OS: runtime, MODE: mode, TIMER_TRACE: timerTrace, BENCH_TRACE: benchTrace },
      encoding: 'utf8',
      // A healthy attempt closes captured pipes before the inert 10s timer
      // could expire. This is a generous bound, not a performance threshold.
      timeout: 2500,
    });
    if (result.error) throw result.error;
    const calls = fs.readFileSync(benchTrace, 'utf8').trim().split('\n');
    const timers = fs.readFileSync(timerTrace, 'utf8').trim().split('\n').map(Number);
    assert.equal(timers.length, calls.length, 'a watchdog must be started per attempt');
    for (const pid of timers) {
      assert.ok(pid > 0);
      assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, 'the attempt must reap its own timer');
    }
    const benchmark = 'scripts/benchmark-workbench.js --sizes 10,100,1000 --interaction-budget-ms 1500 --output ../work/workbench-performance/report.json';
    assert.ok(calls.every(call => call === benchmark), 'benchmark command and settings must stay unchanged');
    return { status: result.status, calls: calls.length, output: result.stdout + result.stderr };
  } finally {
    // Reclaim any owned stub timers if an assertion catches a regression.
    for (const pid of fs.readFileSync(timerTrace, 'utf8').split('\n').map(Number)) {
      if (pid > 0) try { process.kill(pid, 'SIGTERM'); } catch (_) {}
    }
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function assertAttemptLog(result, expected) {
  const events = result.output
    .split('\n')
    .filter(line => line.startsWith('::notice::Workbench benchmark attempt '));
  assert.equal(events.length, expected.length * 2, result.output);
  for (const [i, [outcome, code, minSeconds = 0]] of expected.entries()) {
    assert.equal(events[i * 2], `::notice::Workbench benchmark attempt ${i + 1} started`);
    const finish = events[i * 2 + 1].match(new RegExp(
      `^::notice::Workbench benchmark attempt ${i + 1} finished: outcome=${outcome} exit=${code} elapsed=([0-9]+)s$`));
    assert.ok(finish, events[i * 2 + 1]);
    assert.ok(Number(finish[1]) >= minSeconds, events[i * 2 + 1]);
  }
  assert.doesNotMatch(result.output, /hosted-runner jitter|wedge class/);
}

test('a completed workbench benchmark closes captured CI pipes and reaps the watchdog timer', () => {
  const result = workbenchAttempt('Linux', 'success');
  assert.equal(result.status, 0, result.output);
  assert.equal(result.calls, 1);
  assertAttemptLog(result, [['child-exit', 0]]);
});

test('workbench attempts preserve ordinary failure and watchdog timeout statuses', () => {
  for (const [mode, outcome, code, minSeconds] of [
    ['failure', 'child-exit', 23],
    ['exit137', 'child-exit', 137],
    ['stalled', 'watchdog-signal-sent', 137, 1],
  ]) {
    const result = workbenchAttempt('Linux', mode, true);
    assert.equal(result.status, code, result.output);
    assertAttemptLog(result, [[outcome, code, minSeconds]]);
  }
});

test('workbench CI retries two times on macOS and only runs once on Linux and Windows', () => {
  for (const [os, runs] of [['Linux', 1], ['Windows', 1], ['macOS', 3]]) {
    const result = workbenchAttempt(os, 'failure');
    assert.equal(result.status, 1, result.output);
    assert.equal(result.calls, runs, os);
    assert.equal(result.output.match(/::warning::workbench benchmark failed/g)?.length ?? 0, runs - 1, os);
    assertAttemptLog(result, Array.from({ length: runs }, () => ['child-exit', 23]));
  }
});

test('a successful macOS retry reports both attempts and does not start a third', () => {
  const result = workbenchAttempt('macOS', 'recover');
  assert.equal(result.status, 0, result.output);
  assert.equal(result.calls, 2);
  assertAttemptLog(result, [['child-exit', 23], ['child-exit', 0]]);
});
