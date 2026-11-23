'use strict';

/**
 * Coalesced persistence.
 *
 * Two properties matter here: a burst of changes must not produce a burst of
 * writes, and `await request()` must mean "the value is on disk" rather than
 * "the write is queued". The second is what keeps settings durable across a
 * quit that happens right after a change.
 */

const assert = require('assert');
const fs = require('fs');
const fsp = require('node:fs/promises');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('path');
const { Script, runInNewContext } = require('node:vm');
const { parse } = require('acorn');

const { createCoalescedWriter, DEFAULT_DELAY_MS } = require('../coalesced-writer');
const { deepEqual } = require('../object-utils');
const credentials = require('../../credential-crypto');

const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}
async function checkAsync(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}

function trackingWriter(state, delayMs = 0, failTimes = 0) {
  return async () => {
    state.calls += 1;
    const call = state.calls;
    state.inFlight += 1;
    state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
    await new Promise((r) => setTimeout(r, delayMs));
    state.inFlight -= 1;
    if (call <= failTimes) throw new Error('write failed #' + call);
    state.persisted += 1;
  };
}

const fixturePassphrase = 'synthetic coalesced writer fixture key';
function decodeSettings(bytes) {
  assert.ok(credentials.isEncrypted(bytes), 'settings must be encrypted on disk');
  return JSON.parse(credentials.decryptCredential(bytes, { passphrase: fixturePassphrase }));
}

async function withinFixture(promise, label) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Fixture timed out: ' + label)), 5000);
    })]);
  } finally { clearTimeout(timer); }
}

async function withSettings(run) {
  const root = await fsp.realpath(await fsp.mkdtemp(path.join(os.tmpdir(), 'ob-coalesced-settings-')));
  const file = path.join(root, 'settings.json');
  const fixture = { root, file, writes: [], replacements: [], beforeRename: null };
  const storePath = require.resolve('../local-settings');
  const requireFromStore = createRequire(storePath);
  const instance = { exports: {} };
  const overrides = {
    'fs/promises': {
      ...fsp,
      async mkdir(target, ...args) {
        fixture.writes.push(target);
        return fsp.mkdir(target, ...args);
      },
      async writeFile(target, ...args) {
        fixture.writes.push(target);
        return fsp.writeFile(target, ...args);
      },
      async rename(from, to) {
        if (to !== file) return fsp.rename(from, to);
        const staged = decodeSettings(await fsp.readFile(from));
        await fixture.beforeRename?.(from, staged);
        await fsp.rename(from, to);
        fixture.replacements.push(staged.memoryLimit);
      },
    },
    '../credential-crypto': {
      ...credentials,
      encryptCredential: value => credentials.encryptCredential(value, { passphrase: fixturePassphrase }),
      decryptCredential: value => credentials.decryptCredential(value, { passphrase: fixturePassphrase }),
    },
    './coalesced-writer': {
      // Keep the real writer. Only stretch the quiet period so queued writes
      // cannot race the explicit flush or run because of a slow CI machine.
      createCoalescedWriter: options => createCoalescedWriter({ ...options, delayMs: 60_000, keepAlive: false }),
    },
  };
  runInNewContext(fs.readFileSync(storePath, 'utf8'), {
    module: instance, require: name => Object.hasOwn(overrides, name) ? overrides[name] : requireFromStore(name),
    structuredClone, console: { warn() {} },
  }, { filename: storePath });
  const store = instance.exports;
  fixture.store = store;
  fixture.bytes = () => fsp.readFile(file);
  fixture.save = patch => {
    const accepted = store.saveLocalSettings(patch);
    accepted.catch(() => {}); // assertions inspect the original promise
    return accepted;
  };
  fixture.saveAndFlush = patch => withinFixture(Promise.all([fixture.save(patch), store.flushSettingsWriter()]), 'settings save and flush');
  try {
    store.initLocalSettings({ file, defaultProfileDataRoot: path.join(root, 'profiles') });
    await store.loadLocalSettings();
    await run(fixture);
  } finally {
    fixture.beforeRename = null;
    try { await withinFixture(store.flushSettingsWriter(), 'fixture cleanup'); }
    finally { await fsp.rm(root, { recursive: true, force: true }); }
  }
}

function quitWithSettings(fixture) {
  const filename = path.join(__dirname, '../../main.js');
  const source = fs.readFileSync(filename, 'utf8');
  const declaration = parse(source, { ecmaVersion: 'latest', sourceType: 'commonjs' }).body
    .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'beginQuitCleanup');
  assert.ok(declaration, 'cannot find the main-process quit flow');
  const exits = [];
  const quit = new Script(source.slice(declaration.start, declaration.end) + '\nbeginQuitCleanup();', { filename });
  return quit.runInNewContext({
    settingsStore: fixture.store,
    app: { exit: code => exits.push({ code, memoryLimit: decodeSettings(fs.readFileSync(fixture.file)).memoryLimit }) },
    quitting: false, fatalFailure: false, quitCleanupPromise: null, quitCleanupSettled: false,
    engine: null, automation: null, liveSync: null, localUiSync: null, localUiService: null,
    destroyTray() {}, stopShortcutBridge() {}, lifecycleTimeout: pending => pending,
    async drainBrowsersForQuit() { return { stopped: true, remaining: [], errors: [] }; },
  }).then(() => exits);
}

// The queue's timer is deliberately unref'd so deferred work never keeps the
// host alive on its own. A test process has nothing else pending, so it needs
// one live timer to reach the writes it is waiting for.
const keepAlive = setInterval(() => {}, 250);

(async () => {
  await checkAsync('failed writes back off, cap retries and recover the normal delay', async () => {
    const originalSet = global.setTimeout, originalClear = global.clearTimeout;
    const delays = [];
    // Drive explicit flushes while observing the actual retry timers, without
    // timing assertions or allowing background retries to race the test.
    global.setTimeout = (_callback, delay) => { delays.push(delay); return { unref() {} }; };
    global.clearTimeout = () => {};
    try {
      let fail = true;
      const writer = createCoalescedWriter({ delayMs: 10, maxRetryDelayMs: 40, write: () => {
        if (fail) throw new Error('disk unavailable');
      } });
      const request = assert.rejects(writer.request(), /disk unavailable/);
      for (const delay of [10, 20, 40, 40]) {
        await assert.rejects(writer.flushNow(), /disk unavailable/);
        assert.equal(delays.at(-1), delay);
      }
      await request;
      const retry = assert.rejects(writer.request(), /disk unavailable/);
      assert.equal(delays.at(-1), 40, 'new requests must retain failure backoff');
      await assert.rejects(writer.flushNow(), /disk unavailable/);
      await retry;
      fail = false;
      await writer.flushNow();
      const saved = writer.request();
      assert.equal(delays.at(-1), 10);
      await writer.flushNow();
      await saved;
      fail = true;
      const immediate = createCoalescedWriter({ delayMs: 0, maxRetryDelayMs: 0, write: () => {
        if (fail) throw new Error('disk unavailable');
      } });
      const rejected = assert.rejects(immediate.request(), /disk unavailable/);
      await assert.rejects(immediate.flushNow(), /disk unavailable/);
      await rejected;
      assert.equal(delays.at(-1), 1, 'zero quiet periods must not produce zero-delay failure retries');
      fail = false;
      await immediate.flushNow();
    } finally { global.setTimeout = originalSet; global.clearTimeout = originalClear; }
  });

  await checkAsync('large bursts retain one dirty marker and settle every caller', async () => {
    let writes = 0;
    const writer = createCoalescedWriter({ delayMs: 10000, write: () => { writes += 1; } });
    const requests = Array.from({ length: 10000 }, () => writer.request());
    assert.equal(writer.stats().pending, 1);
    await writer.flushNow();
    await Promise.all(requests);
    assert.equal(writes, 1);
    assert.equal(writer.stats().waiters, 0);
  });

  await checkAsync('deferred batches accept imports larger than the argument limit', async () => {
    const { DeferredQueue } = require('../deferred-queue');
    const items = Array.from({ length: 200000 }, (_, index) => index);
    let received;
    const queue = new DeferredQueue({ handler: (batch) => { received = batch; } });
    queue.addAll(items);
    assert.equal(await queue.flush(), items.length);
    assert.deepEqual(received, items);
    queue.addAll([1, 2]);
    queue.addAll(queue.items);
    await queue.flush();
    assert.deepEqual(received, [1, 2, 1, 2]);
  });

  await checkAsync('a burst of requests produces a single write', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({ write: trackingWriter(state), delayMs: 25 });
    await Promise.all([1, 2, 3, 4, 5].map(() => writer.request()));
    assert.strictEqual(state.calls, 1, `wrote ${state.calls} times`);
    assert.strictEqual(state.persisted, 1);
  });

  await checkAsync('awaiting a request means the write already happened', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({ write: trackingWriter(state), delayMs: 5 });
    await writer.request();
    assert.strictEqual(state.persisted, 1, 'the write had not finished when the caller resumed');
    assert.strictEqual(writer.stats().waiters, 0);
  });

  await checkAsync('requests arriving during a write still resolve', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({ write: trackingWriter(state, 30), delayMs: 1 });
    const first = writer.request();
    await new Promise((r) => setTimeout(r, 10)); // land inside the first write
    const second = writer.request();
    const third = writer.request();
    await Promise.all([first, second, third]);
    assert.strictEqual(state.persisted, 2, `expected two writes, saw ${state.persisted}`);
    assert.strictEqual(state.maxInFlight, 1, 'writes must not overlap');
    assert.strictEqual(writer.stats().waiters, 0, 'a waiter was left behind');
  });

  await checkAsync('a failed write rejects its callers', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const seen = [];
    const writer = createCoalescedWriter({
      write: trackingWriter(state, 0, 1),
      delayMs: 1,
      onError: (error) => seen.push(error.message),
    });
    let error = null;
    try { await writer.request(); } catch (e) { error = e; }
    assert.ok(error && /write failed/.test(error.message), error && error.message);
    assert.deepStrictEqual(seen, ['write failed #1'], 'the observer was not told');
    assert.strictEqual(writer.stats().lastError, 'write failed #1', 'the failure was not recorded');
  });

  await checkAsync('a later request retries the failed write', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({ write: trackingWriter(state, 0, 1), delayMs: 1 });
    await writer.request().catch(() => {});
    assert.ok(writer.stats().lastError, 'the first failure should be recorded');
    await writer.request();
    assert.strictEqual(state.persisted, 1, 'the retry did not persist');
    assert.strictEqual(writer.stats().lastError, null, 'a successful run should clear the error');
  });

  await checkAsync('flushNow writes without waiting for the quiet period', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({ write: trackingWriter(state), delayMs: 10000 });
    const pending = writer.request(); // arms a very long timer
    const started = Date.now();
    await writer.flushNow();
    await pending;
    assert.ok(Date.now() - started < 1000, 'flushNow waited for the quiet period');
    assert.ok(state.persisted >= 1, 'nothing was written');
    await writer.idle();
  });

  await checkAsync('flushNow rejects a failed disk write and the next flush can recover', async () => {
    let fail = true;
    const writer = createCoalescedWriter({ delayMs: 10000, write: async () => {
      if (fail) throw new Error('disk unavailable');
    } });
    const pending = assert.rejects(writer.request(), /disk unavailable/);
    try {
      await assert.rejects(writer.flushNow(), /disk unavailable/);
      await pending;
    } finally {
      fail = false;
      await writer.flushNow();
      await pending;
    }
    assert.strictEqual(writer.stats().lastError, null);
  });

  await checkAsync('idle rejects after bounded retries of a failed write', async () => {
    let fail = true;
    const writer = createCoalescedWriter({ delayMs: 10000, write: async () => {
      if (fail) throw new Error('persistent disk failure');
    } });
    const pending = assert.rejects(writer.request(), /persistent disk failure/);
    try {
      await assert.rejects(writer.idle(), /persistent disk failure/);
      await pending;
      assert.strictEqual(writer.stats().runs, 3, 'shutdown retries must remain bounded');
    } finally {
      fail = false;
      await writer.flushNow();
      await pending;
    }
  });

  await checkAsync('an overlapping retry cannot erase the previous flush error', async () => {
    let finishFirst;
    let finishSecond;
    const firstGate = new Promise((resolve) => { finishFirst = resolve; });
    const secondGate = new Promise((resolve) => { finishSecond = resolve; });
    let calls = 0;
    const writer = createCoalescedWriter({ delayMs: 10000, write: async () => {
      if (++calls === 1) { await firstGate; throw new Error('first write failed'); }
      await secondGate;
    } });
    const request = assert.rejects(writer.request(), /first write failed/);
    const firstFlush = assert.rejects(writer.flushNow(), /first write failed/);
    const retry = writer.flushNow();
    finishFirst();
    try { await firstFlush; }
    finally { finishSecond(); await retry; await request; }
    assert.strictEqual(calls, 2);
  });

  await checkAsync('concurrent writers never overlap', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({ write: trackingWriter(state, 8), delayMs: 1 });
    const rounds = [];
    for (let i = 0; i < 4; i += 1) {
      rounds.push(writer.request());
      await new Promise((r) => setTimeout(r, 3));
    }
    await Promise.all(rounds);
    assert.strictEqual(state.maxInFlight, 1);
    assert.ok(state.persisted >= 1);
  });

  await checkAsync('an unchanged state skips the write and still resolves', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    let value = { a: 1, nested: { b: [2, 3] } };
    let written = null;
    const writer = createCoalescedWriter({
      write: async () => { written = JSON.parse(JSON.stringify(value)); await trackingWriter(state)(); },
      shouldWrite: () => written === null || !deepEqual(value, written),
      delayMs: 1,
    });
    await writer.request();
    assert.strictEqual(state.persisted, 1, 'the first save should write');
    // Same content, freshly built object: nothing changed, so nothing is written.
    value = { a: 1, nested: { b: [2, 3] } };
    await writer.request();
    assert.strictEqual(state.persisted, 1, 'an unchanged state wrote again');
    assert.strictEqual(writer.stats().skipped, 1, 'the skip was not recorded');
    assert.strictEqual(writer.stats().waiters, 0);
  });

  await checkAsync('a changed state writes again', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    let value = { a: 1 };
    let written = null;
    const writer = createCoalescedWriter({
      write: async () => { written = JSON.parse(JSON.stringify(value)); await trackingWriter(state)(); },
      shouldWrite: () => written === null || !deepEqual(value, written),
      delayMs: 1,
    });
    await writer.request();
    value.a = 2;
    await writer.request();
    assert.strictEqual(state.persisted, 2, 'a changed state must be persisted');
    assert.strictEqual(written.a, 2);
  });

  await checkAsync('requests arriving while a skip is decided still resolve', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    let allowChange = false;
    const writer = createCoalescedWriter({
      write: trackingWriter(state, 20),
      shouldWrite: () => allowChange,
      delayMs: 1,
    });
    const first = writer.request(); // skipped
    const second = writer.request();
    const third = writer.request();
    await Promise.all([first, second, third]);
    assert.strictEqual(state.persisted, 0, 'nothing should have been written');
    assert.strictEqual(writer.stats().waiters, 0, 'a waiter was left behind after a skip');
    // Now let it write, to prove the queue is still usable afterwards.
    allowChange = true;
    await writer.request();
    assert.strictEqual(state.persisted, 1);
  });

  await checkAsync('a throwing predicate falls back to writing', async () => {
    const state = { calls: 0, inFlight: 0, maxInFlight: 0, persisted: 0 };
    const writer = createCoalescedWriter({
      write: trackingWriter(state),
      shouldWrite: () => { throw new Error('predicate exploded'); },
      delayMs: 1,
    });
    await writer.request();
    assert.strictEqual(state.persisted, 1, 'a broken predicate must not lose the write');
  });

  check('a writer without a function is rejected', () => {
    assert.throws(() => createCoalescedWriter({}), /write must be a function/);
    assert.throws(() => createCoalescedWriter(), /write must be a function/);
  });

  check('the quiet period has a sensible default', () => {
    assert.ok(Number.isFinite(DEFAULT_DELAY_MS) && DEFAULT_DELAY_MS > 0);
    const writer = createCoalescedWriter({ write: async () => {} });
    assert.strictEqual(writer.stats().delayMs, DEFAULT_DELAY_MS);
  });

  // ---- host wiring through the real settings store and temporary files ----
  await checkAsync('settings go through the coalescing writer', () => withSettings(async f => {
    const changes = [61, 62, 63].map(memoryLimit => f.save({ memoryLimit }));
    await withinFixture(f.store.flushSettingsWriter(), 'coalesced settings burst');
    const receipts = await withinFixture(Promise.all(changes), 'all settings receipts');
    assert.deepStrictEqual(receipts.map(receipt => receipt.memoryLimit), [63, 63, 63]);
    assert.deepStrictEqual(f.replacements, [63]);
    assert.strictEqual(decodeSettings(await f.bytes()).memoryLimit, 63);
  }));

  await checkAsync('ordinary settings saves do not bypass the queued write or acknowledge early', () => withSettings(async f => {
    let acknowledged = false;
    const save = f.save({ diskLimit: 37 });
    save.then(() => { acknowledged = true; }, () => {});
    assert.deepStrictEqual(await fsp.readdir(f.root), [], 'unexpected disk work before the queue was flushed');
    assert.deepStrictEqual(f.writes, [], 'save wrote outside the coalescer');
    assert.strictEqual(acknowledged, false, 'save acknowledged a value still queued');
    await withinFixture(f.store.flushSettingsWriter(), 'deferred settings write');
    assert.strictEqual((await withinFixture(save, 'settings receipt')).diskLimit, 37);
    assert.strictEqual(decodeSettings(await f.bytes()).diskLimit, 37);
  }));

  await checkAsync('quitting flushes any pending settings write', () => withSettings(async f => {
    await f.saveAndFlush({ memoryLimit: 62 });
    const pending = f.save({ memoryLimit: 71 });
    assert.strictEqual(decodeSettings(await f.bytes()).memoryLimit, 62);
    assert.deepStrictEqual(await withinFixture(quitWithSettings(f), 'main quit flush'), [{ code: 0, memoryLimit: 71 }]);
    assert.strictEqual((await withinFixture(pending, 'settings receipt on quit')).memoryLimit, 71);
  }));

  await checkAsync('an unchanged cache is not rewritten; the commit records the captured snapshot', () => withSettings(async f => {
    const groups = [{ id: 'fixture', name: 'Kept group' }];
    await f.saveAndFlush({ memoryLimit: 61, uiGroups: groups });
    const prior = await f.bytes();
    await f.saveAndFlush({ memoryLimit: 61, uiGroups: structuredClone(groups) });
    assert.ok((await f.bytes()).equals(prior), 'equivalent settings rewrote the encrypted file');
    assert.deepStrictEqual(f.replacements, [61]);

    const staged = Promise.withResolvers(), release = Promise.withResolvers();
    f.beforeRename = async (_from, snapshot) => {
      if (snapshot.memoryLimit === 62) { staged.resolve(); await release.promise; }
    };
    const first = f.save({ memoryLimit: 62 });
    const draining = f.store.flushSettingsWriter();
    draining.catch(() => {});
    let later;
    try {
      await withinFixture(staged.promise, 'settings snapshot staged');
      later = f.save({ memoryLimit: 63 });
      assert.ok((await f.bytes()).equals(prior), 'first snapshot committed before release');
    } finally { release.resolve(); }
    const [firstReceipt, laterReceipt] = await withinFixture(Promise.all([first, later, draining]), 'successive settings snapshots');
    assert.strictEqual(firstReceipt.memoryLimit, 62);
    assert.strictEqual(laterReceipt.memoryLimit, 63);
    assert.deepStrictEqual(f.replacements, [61, 62, 63], 'the first commit must not mark the queued edit as already saved');
    assert.strictEqual(decodeSettings(await f.bytes()).memoryLimit, 63);
  }));

  await checkAsync('settings stage an atomic replacement and preserve the primary on failure', () => withSettings(async f => {
    await f.saveAndFlush({ memoryLimit: 61 });
    const prior = await f.bytes();
    let checkedStage = false;
    f.beforeRename = async (from, staged) => {
      assert.notStrictEqual(from, f.file, 'replacement must come from a separate staged file');
      assert.strictEqual(path.dirname(from), f.root, 'the stage must share the destination directory');
      assert.strictEqual(staged.memoryLimit, 62);
      assert.ok((await f.bytes()).equals(prior), 'primary changed before the atomic replacement');
      checkedStage = true;
      throw Object.assign(new Error('synthetic settings rename failure'), { code: 'ENOSPC' });
    };
    const refused = assert.rejects(f.save({ memoryLimit: 62 }), { code: 'ENOSPC' });
    refused.catch(() => {});
    await withinFixture(assert.rejects(f.store.flushSettingsWriter(), { code: 'ENOSPC' }), 'failed settings replacement');
    await withinFixture(refused, 'failed settings receipt');
    assert.strictEqual(checkedStage, true);
    assert.ok((await f.bytes()).equals(prior), 'failed replacement did not preserve the primary');
    assert.deepStrictEqual(await fsp.readdir(f.root), ['settings.json'], 'failed replacement left staging artifacts');

    f.beforeRename = null;
    await withinFixture(f.store.flushSettingsWriter(), 'ordinary settings retry');
    assert.deepStrictEqual(f.replacements, [61, 62]);
    assert.strictEqual(decodeSettings(await f.bytes()).memoryLimit, 62);
    assert.ok((await fsp.readFile(f.file + '.bak')).equals(prior), 'successful retry must preserve the old primary as backup');
  }));

  // ================= report =================
  for (const r of results) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.err}`}`);
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\nCOALESCED_WRITER_SELFTEST ${failed.length ? 'FAILED' : 'OK'} ${results.filter((r) => r.ok).length}/${results.length}`);
  if (failed.length) process.exitCode = 1;
  clearInterval(keepAlive);
})();
