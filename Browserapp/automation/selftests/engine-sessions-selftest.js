'use strict';

const assert = require('node:assert/strict');
const { BrowserEngine } = require('../../engine');
const cdp = require('../../cdp');

function fixture(count) {
  return Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new Map(Array.from({ length: count }, (_, i) => [`env-${i}`, { id: `env-${i}` }])),
    running: new Map(Array.from({ length: count }, (_, i) => [`env-${i}`, { port: 10000 + i, browser: { name: 'Test' } }])),
  });
}

async function main() {
  const original = cdp.tabs;
  let active = 0;
  let peak = 0;
  let calls = 0;
  const gates = [];
  cdp.tabs = async (port) => {
    calls++;
    peak = Math.max(peak, ++active);
    try {
      await new Promise((resolve) => { gates.push(resolve); });
      if (port === 10003) throw new Error('one browser failed');
      return [{ id: `tab-${port}` }];
    } finally { active--; }
  };
  const turn = () => new Promise((resolve) => setImmediate(resolve));
  try {
    const engine = fixture(100);
    const first = engine.sessions();
    const second = engine.sessions();
    await turn();
    assert.equal(peak, 8, 'all callers share one engine-wide concurrency bound');
    let settled = false;
    first.then(() => { settled = true; });
    while (!settled) {
      for (const resolve of gates.splice(0)) resolve();
      await turn();
    }
    const [a, b] = await Promise.all([first, second]);
    assert.equal(calls, 100, 'overlapping inventories share each runtime query');
    assert.deepEqual(a, b);
    assert.deepEqual(a.map((item) => item.id), [...engine.running.keys()], 'completion order does not reorder sessions');
    assert.deepEqual(a[3].tabs, []);
    assert.equal(a[3].error, 'one browser failed');
    assert.equal(engine._sessionQueries.size, 0, 'settled queries are not retained');

    const changing = fixture(10);
    calls = 0;
    const snapshot = changing.sessions();
    await turn();
    changing.running.delete('env-8'); // queued, never dial this browser
    const oldRuntime = changing.running.get('env-0');
    changing.running.set('env-0', { port: 20000, browser: { name: 'Restarted' } });
    oldRuntime.cleanedUp = true;
    let finished = false;
    snapshot.then(() => { finished = true; });
    while (!finished) { for (const resolve of gates.splice(0)) resolve(); await turn(); }
    const sessions = await snapshot;
    assert.ok(!sessions.some((item) => ['env-0', 'env-8'].includes(item.id)), 'closed and replaced runtimes must not return stale inventory');
    assert.equal(calls, 9, 'queued closed runtime is skipped');
    assert.equal(changing._sessionQueries.size, 0);

    const restarted = fixture(1);
    const old = restarted.sessions();
    await turn();
    restarted.running.set('env-0', { port: 30000, browser: { name: 'New' } });
    const fresh = restarted.sessions();
    await turn();
    gates.shift()();
    assert.deepEqual(await old, []);
    assert.equal(restarted._sessionQueries.size, 1, 'old completion must not remove the replacement runtime query');
    gates.shift()();
    assert.equal((await fresh)[0].port, 30000);
    assert.equal(restarted._sessionQueries.size, 0);
    console.log('ENGINE_SESSIONS_SELFTEST OK (100 runtimes, shared cap, dedup, order, partial failure, lifecycle)');
  } finally {
    for (const resolve of gates.splice(0)) resolve();
    cdp.tabs = original;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
