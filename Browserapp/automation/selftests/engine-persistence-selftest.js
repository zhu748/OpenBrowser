'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { BrowserEngine } = require('../../engine');

function makeEngine() {
  return Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new Map(), extensions: new Map(), assignments: new Map(),
    _persistQueue: Promise.resolve(),
    preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null,
  });
}

async function main() {
  for (const synchronous of [false, true]) {
    const engine = makeEngine();
    engine._persistNow = synchronous
      ? () => { throw new Error('disk failure'); }
      : async () => { throw new Error('disk failure'); };
    const request = assert.rejects(engine.persist(), /disk failure/);
    try {
      await assert.rejects(engine.flushPersistence(), /disk failure/);
      await request;
    } finally {
      engine._persistNow = async () => {};
      await engine.flushPersistence();
    }
  }

  const batch = makeEngine();
  let writes = 0;
  batch._persistNow = async () => { writes += 1; };
  const requests = Array.from({ length: 100 }, () => batch.persist());
  await batch.flushPersistence();
  await Promise.all(requests);
  assert.equal(writes, 1, 'a burst of requests coalesces into one completed write');

  const overlapping = makeEngine();
  let entered;
  const started = new Promise((resolve) => { entered = resolve; });
  let releaseFirst;
  const firstGate = new Promise((resolve) => { releaseFirst = resolve; });
  let enteredSecond;
  const secondStarted = new Promise((resolve) => { enteredSecond = resolve; });
  let releaseSecond;
  const secondGate = new Promise((resolve) => { releaseSecond = resolve; });
  let calls = 0;
  overlapping._persistNow = async () => {
    if (++calls === 1) { entered(); await firstGate; }
    else { enteredSecond(); await secondGate; }
  };
  const first = overlapping.persist();
  await started;
  const second = overlapping.persist();
  let flushed = false;
  const flush = overlapping.flushPersistence().then(() => { flushed = true; });
  releaseFirst();
  await secondStarted;
  assert.equal(flushed, false, 'flush waits for the late write, not only the active write');
  releaseSecond();
  await Promise.all([first, second, flush]);
  assert.equal(calls, 2);

  // A fresh standalone CLI has no Electron window or ambient ref'd handles.
  // A request enqueued by an active write must survive the first completion.
  const output = execFileSync(process.execPath, ['-e', `
    const { BrowserEngine } = require(${JSON.stringify(path.resolve(__dirname, '../../engine'))});
    const engine = Object.create(BrowserEngine.prototype);
    let calls = 0;
    engine._persistNow = async () => {
      if (++calls === 1) engine.persist().then(() => console.log('late'));
    };
    engine.persist().then(() => console.log('first'));
  `], { encoding: 'utf8', timeout: 3000 });
  assert.deepEqual(output.trim().split(/\r?\n/), ['first', 'late']);

  const state = makeEngine();
  state.profiles.set('env-001', { id: 'env-001', cookies: 'private-cookie', platform: { password: 'private-password' } });
  state.assignments.set('env-001', new Set(['a', 'b']));
  assert.deepEqual(JSON.parse(state.dumpToJson()), state.exportEngineState(), 'JSON and object exports use one state representation');
  assert.equal(state.exportEngineState().profiles[0].cookies, 'private-cookie', 'engine persistence retains the private data needed for recovery');
  await state.flushPersistence();

  const direct = makeEngine();
  let fail = true;
  direct.usingSqlite = true;
  direct.sqliteStore = {
    setMeta() { if (fail) throw new Error('direct database failure'); },
    saveExtensions() {}, saveAssignmentsDiffed() {}, saveProfilesDiffed() {},
  };
  await assert.rejects(direct._persistNow(), /direct database failure/);
  await assert.rejects(direct.flushPersistence(), /direct database failure/, 'flush retains direct write failures');
  fail = false;
  await direct._persistNow();
  await direct.flushPersistence();
  console.log('ENGINE_PERSISTENCE_SELFTEST OK (failure propagation, coalescing, late requests, CLI lifetime, exports)');
}

const deadline = setTimeout(() => { console.error('Persistence selftest timed out'); process.exit(1); }, 5000);
deadline.unref();
main().then(() => clearTimeout(deadline)).catch((error) => { console.error(error); process.exitCode = 1; });
