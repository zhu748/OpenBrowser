'use strict';

const assert = require('node:assert/strict');
const { createRefreshScheduler } = require('../../ui/ui-refresh-scheduler');

async function main() {
  const timers = new Map();
  let nextTimer = 0;
  let paused = false;
  let active = 0;
  let peak = 0;
  let calls = 0;
  let release;
  let fail = false;
  const errors = [];
  const scheduler = createRefreshScheduler({
    setTimer(fn) { const id = nextTimer++; timers.set(id, fn); return id; },
    clearTimer(id) { timers.delete(id); },
    isPaused: () => paused,
    onError(error) { errors.push(error.message); throw new Error('observer failed'); },
    async refresh() {
      calls += 1;
      peak = Math.max(peak, ++active);
      try {
        await new Promise((resolve) => { release = resolve; });
        if (fail) throw new Error('refresh failed');
      } finally { active -= 1; }
    },
  });
  function fire() {
    assert.equal(timers.size, 1);
    const [id, fn] = timers.entries().next().value;
    timers.delete(id);
    return fn();
  }
  for (let i = 0; i < 100; i++) scheduler.request();
  assert.equal(timers.size, 1, 'a burst shares one timer, even when its ID is zero');
  const first = fire();
  for (let i = 0; i < 100; i++) scheduler.request();
  assert.equal(timers.size, 0, 'requests during slow IPC must not start another request');
  release(); await first;
  assert.equal(timers.size, 1, 'one trailing refresh captures events received during IPC');
  const trailing = fire(); release(); await trailing;
  assert.equal(calls, 2);
  assert.equal(peak, 1);
  assert.equal(timers.size, 0);

  paused = true;
  scheduler.request(); scheduler.request();
  assert.equal(timers.size, 0, 'a hidden window keeps work pending without timers');
  paused = false; scheduler.resume();
  paused = true; await fire();
  assert.equal(calls, 2, 'a window hidden after scheduling must not fetch');
  paused = false; scheduler.resume();
  const visible = fire(); release(); await visible;
  assert.equal(calls, 3);

  fail = true;
  scheduler.request();
  const failing = fire(); scheduler.request(); release(); await failing;
  assert.deepEqual(errors, ['refresh failed']);
  fail = false;
  const recovery = fire(); release(); await recovery;
  assert.equal(timers.size, 0, 'both refresh and observer errors must release the lane');

  scheduler.request(); scheduler.dispose();
  assert.equal(timers.size, 0, 'dispose clears the timer');
  scheduler.request(); scheduler.resume();
  assert.equal(timers.size, 0, 'disposed schedulers reject further scheduling');

  const inFlight = createRefreshScheduler({
    setTimer(fn) { timers.set(0, fn); return 0; }, clearTimer(id) { timers.delete(id); },
    refresh: () => new Promise((resolve) => { release = resolve; }),
  });
  inFlight.request(); const pending = fire();
  inFlight.request(); inFlight.dispose(); release(); await pending;
  assert.equal(timers.size, 0, 'in-flight completion cannot reschedule after dispose');
  console.log('REFRESH_SCHEDULER_SELFTEST OK (burst, slow IPC, trailing refresh, visibility, failure, disposal)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
