'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { workbenchTests, nodeWorkbenchTests } = require('../../scripts/workbench-test-registry');
const { options, runTest } = require('../../rebuild/acceptance-runner.cjs');
const { createTestDirectory } = require('../../rebuild/selftest-helpers.cjs');
const manifest = require('../../rebuild/acceptance-manifest.json');

async function main() {
  assert.deepEqual(workbenchTests.map(test => test.file), manifest);
  const registered = new Map(require('../../scripts/selftest-all').SUITE.map(([, script, flags]) => [script, flags]));
  for (const test of workbenchTests) {
    assert.ok(Object.isFrozen(test));
    assert.ok(['node', 'electron', 'chromium', 'firefox'].includes(test.runtime));
    assert.ok(test.timeoutMs > 0);
    if (test.runtime === 'node') {
      assert.ok(registered.has(test.script), test.script);
      assert.equal(registered.get(test.script).timeoutMs, test.timeoutMs);
    }
  }
  assert.equal(new Set(nodeWorkbenchTests.map(test => test.script)).size, nodeWorkbenchTests.length);
  assert.equal(options(['--runtime', 'node', '--list']).runtime, 'node');
  assert.throws(() => options(['--runtime', 'unknown']), /Usage/);

  // No work/rebuild parent is needed. Exercise real child exit, logs and timeout.
  const root = await createTestDirectory('runner-');
  try {
    await fs.mkdir(path.join(root, 'commands'));
    const fixture = path.join(root, 'fixture.cjs');
    const app = path.resolve(__dirname, '../..');
    const test = { file: 'fixture.cjs', script: path.relative(app, fixture), runtime: 'node', timeoutMs: 10000 };
    await fs.writeFile(fixture, "console.log('fixture output');process.exitCode=3;");
    const failed = await runTest(test, root);
    assert.equal(failed.exitCode, 3);
    assert.equal(failed.status, 'FAIL');
    assert.match(await fs.readFile(path.join(root, 'commands/fixture.cjs.log'), 'utf8'), /fixture output/);
    await fs.writeFile(fixture, 'setInterval(() => {}, 1000);');
    const timedOut = await runTest({ ...test, timeoutMs: 200 }, root);
    assert.equal(timedOut.status, 'FAIL');
    assert.equal(timedOut.signal, 'SIGTERM');
    await fs.writeFile(fixture, 'process.exitCode=0;');
    const recovered = await runTest(test, root);
    assert.equal(recovered.status, 'PASS');
    assert.equal(recovered.testSourceUnchanged, true);
    await fs.writeFile(fixture, "console.log('SKIP browser fixture unavailable');process.exitCode=2;");
    assert.equal((await runTest(test, root)).status, 'SKIP');
    await fs.writeFile(fixture, "console.log('PASS pure checks');console.log('SKIP browser fixture unavailable');");
    assert.equal((await runTest(test, root)).status, 'PARTIAL');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log('PASS workbench registry: prerequisites, smoke coverage, standalone setup, exit status, timeout and recovery');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
