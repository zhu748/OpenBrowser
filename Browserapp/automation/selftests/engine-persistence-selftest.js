'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { BrowserEngine } = require('../../engine');

function makeEngine() {
  return Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new Map(), extensions: new Map(), assignments: new Map(),
    _persistQueue: Promise.resolve(),
    preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null,
  });
}

async function testIncrementalSqliteWrites() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-persist-incremental-'));
  const engine = new BrowserEngine({ getPath: () => root });
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  try {
    await engine.init(null);
    const store = engine.sqliteStore;
    await engine.syncProfiles(Array.from({ length: 100 }, (_, i) => ({ id: `p-${i}`, name: `Profile ${i}` })));
    const diff = store.saveProfilesDiffed.bind(store);
    const batches = [];
    let fail = false;
    store.saveProfilesDiffed = (profiles) => {
      batches.push(profiles.map(profile => profile.id));
      const changed = diff(profiles);
      if (fail) throw new Error('injected transaction failure after upsert');
      return changed;
    };
    const edit = (note) => engine.profiles.set('p-50', { ...engine.profiles.get('p-50'), note, cookies: 'fixture-cookie' });
    edit('pending');
    fail = true;
    await assert.rejects(engine._persistNow(), /injected transaction failure/);
    assert.notEqual(store.getProfile('p-50').note, 'pending');
    fail = false;
    await engine._persistNow();
    assert.equal(store.getProfile('p-50').note, 'pending');
    assert.equal(store.getProfile('p-50').cookies, 'fixture-cookie');
    const raw = store.db.prepare('SELECT data FROM profiles WHERE id = ?').get('p-50').data;
    assert.equal(Buffer.from(raw).includes(Buffer.from('fixture-cookie')), false);
    await engine._persistNow();
    assert.deepEqual(batches, [['p-50'], ['p-50'], []]);

    const save = store.saveEngineState.bind(store);
    const { promise: began, resolve: notifyBegan } = Promise.withResolvers();
    const { promise: gate, resolve: release } = Promise.withResolvers();
    store.saveEngineState = async (state) => {
      const result = save(state);
      notifyBegan();
      await gate;
      return result;
    };
    edit('first');
    const writing = engine._persistNow();
    await began;
    edit('second');
    release();
    await writing;
    store.saveEngineState = save;
    await engine._persistNow();
    assert.equal(store.getProfile('p-50').note, 'second');
    assert.deepEqual(batches.slice(-2), [['p-50'], ['p-50']]);
  } finally {
    engine.sqliteStore?.close();
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    await fs.rm(root, { recursive: true, force: true });
  }
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
  await testIncrementalSqliteWrites();
  console.log('ENGINE_PERSISTENCE_SELFTEST OK (failure propagation, coalescing, late requests, CLI lifetime, exports)');
}

const deadline = setTimeout(() => { console.error('Persistence selftest timed out'); process.exit(1); }, 5000);
deadline.unref();
main().then(() => clearTimeout(deadline)).catch((error) => { console.error(error); process.exitCode = 1; });
