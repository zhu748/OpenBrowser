'use strict';

const assert = require('node:assert/strict');
const { createFatalErrorHandler } = require('../../main/fatal-error');

async function main() {
  let release;
  let cleanupCount = 0;
  let deadline;
  const exits = [], logs = [], cleared = [];
  const cleanup = new Promise(resolve => { release = resolve; });
  const handler = createFatalErrorHandler({
    log: (kind, error) => logs.push([kind, error]),
    shutdown: () => { cleanupCount++; return cleanup; },
    exit: code => exits.push(code),
    setTimer: (callback, ms) => { deadline = callback; assert.equal(ms, 15000); return 0; },
    clearTimer: id => cleared.push(id),
  });
  const first = handler('uncaughtException', Error('first'));
  assert.strictEqual(handler('unhandledRejection', Error('second')), first);
  await Promise.resolve();
  assert.equal(cleanupCount, 1);
  assert.equal(logs.length, 2);
  deadline();
  assert.deepEqual(exits, [1], 'a hung shutdown reaches the fatal deadline');
  release();
  await first;
  assert.deepEqual(exits, [1], 'late cleanup cannot exit twice');
  assert.deepEqual(cleared, [0]);

  const failures = [];
  const rejecting = createFatalErrorHandler({
    log: (kind) => { failures.push(kind); throw Error('logger unavailable'); },
    shutdown: () => { throw Error('cleanup failed'); },
    exit: code => failures.push(code),
    setTimer: () => 1, clearTimer() {},
  });
  await rejecting('uncaughtException', Error('failure'));
  assert.deepEqual(failures, ['uncaughtException', 'fatal-shutdown', 1]);
  console.log('PASS fatal errors: single shutdown, bounded exit, failed cleanup and logging isolation');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
