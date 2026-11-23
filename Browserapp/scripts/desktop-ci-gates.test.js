'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const app = path.join(__dirname, '..');
function configuredGateStep() {
  const workflow = fs.readFileSync(path.join(app, '../.github/workflows/ci.yml'), 'utf8');
  return workflow.split('      - name: Real DOM, preload, IPC, SQLite and editor conflict gates\n')[1]
    ?.split('\n      - name:')[0];
}
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
