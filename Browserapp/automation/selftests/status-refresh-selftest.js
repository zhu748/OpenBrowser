'use strict';

const assert = require('node:assert/strict');
const { BrowserEngine } = require('../../engine');
const { TrackedProfileMap } = require('../../engine/profile-revisions');
const { createStatusController, mergeStatusDelta } = require('../../ui/ui-status-controller');

async function main() {
  const engine = Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new TrackedProfileMap([['env-1', { id: 'env-1', cookies: 'private' }], ['env-2', { id: 'env-2' }]]),
    running: new Map(), networkInfo: new Map(), assignments: new Map(), listeners: new Set(),
  });
  let full;
  const configRev = engine.profiles.revisionOf('env-1');
  const runtime = { running: false, port: 0 };
  engine.publicRunning = (id) => id === 'env-1' ? { ...runtime } : { running: false, port: 0 };
  engine.invalidateStatusCache();
  full = engine.statusDelta(null);
  assert.equal(engine.statusDelta(full.watermark).watermark, full.watermark, 'idle polls reuse the snapshot index');
  assert.equal(Object.isFrozen(full.watermark), true, 'a caller cannot mutate the cached index');
  assert.deepEqual(engine.statusDelta(full.watermark, { includeWatermark: false }), { full: false, rows: [], removed: [] });
  const compact = engine.statusDelta(null, { includeWatermark: false });
  assert.equal(compact.full, true);
  assert.deepEqual(compact.rows, full.rows, 'compact responses retain the full resync fallback');
  assert.equal(Object.hasOwn(compact, 'watermark'), false);
  for (const update of [{ running: true, port: 9222 }, { port: 9333 }, { running: false, port: 0 }]) {
    Object.assign(runtime, update);
    engine.emit({ type: 'status', id: 'env-1' });
    const delta = engine.statusDelta(full.watermark);
    assert.notEqual(delta.watermark, full.watermark, 'runtime changes rebuild the index');
    assert.deepEqual(delta.rows.map((row) => row.id), ['env-1']);
    assert.equal(delta.rows[0].running, runtime.running);
    assert.equal(delta.rows[0].port, runtime.port);
    assert.equal(delta.rows[0].rev, configRev, 'runtime changes must not invalidate editor base revisions');
    assert.equal(delta.rows[0].cookies, '', 'new status lane retains redaction');
    full = delta;
  }
  engine.networkInfo.set('env-1', { ip: '192.0.2.1' });
  engine.assignments.set('env-1', new Set(['extension']));
  engine.invalidateStatusCache();
  const changed = engine.statusDelta(full.watermark);
  assert.equal(changed.rows.length, 1);
  assert.deepEqual(changed.rows[0].assignedExtensions, ['extension']);
  assert.equal(engine.statusDelta(changed.watermark).rows.length, 0);
  engine.profiles.set('env-1', { id: 'env-1', name: 'changed' });
  assert.equal(engine.statusDelta(changed.watermark).rows[0].name, 'changed', 'Map edits invalidate cached status without a second hook');
  engine.profiles.delete('env-2');
  assert.equal(engine.status().length, 1);
  assert.deepEqual(engine.statusDelta(changed.watermark, { includeWatermark: false }).removed, ['env-2']);
  assert.equal(engine._statusStamps.has('env-2'), false, 'removed IDs do not grow status bookkeeping');
  const oldToken = engine.status()[0].statusRev;
  engine._statusStamps.clear(); engine._statusInstance = null; engine.invalidateStatusCache();
  assert.notEqual(engine.status()[0].statusRev, oldToken, 'a new engine incarnation cannot share an old watermark');

  let reads = 0;
  const rows = Array.from({ length: 10000 }, (_, id) => ({ get id() { reads += 1; return String(id); } }));
  const delta = { full: false, rows: Array.from({ length: 1000 }, (_, i) => ({ id: String(10000 + i) })), removed: [] };
  assert.equal(mergeStatusDelta(rows, delta).length, 11000);
  assert.ok(reads < 5 * rows.length, 'delta append must not scan the whole fleet per new row');
  assert.equal(mergeStatusDelta(rows, { full: false, rows: [] }), rows);

  let current = [];
  let resolve;
  let calls = 0;
  const controller = createStatusController({ getRows: () => current, setRows: (next) => { current = next; },
    fetchDelta: (watermark) => { calls += 1; assert.equal(watermark, null); return new Promise((done) => { resolve = done; }); },
    fetchFull: async () => { throw new Error('full response already contains rows'); } });
  const first = controller.refresh();
  assert.equal(controller.refresh(), first, 'scheduled and direct refresh share IPC');
  resolve({ full: true, rows: [{ id: 'first', statusRev: 'opaque' }] }); await first;
  assert.equal(current[0].id, 'first');
  assert.equal(calls, 1);
  current = [];
  const stale = controller.refresh();
  current = [{ id: 'edited', statusRev: 'new' }];
  resolve({ full: true, rows: [{ id: 'stale' }] });
  assert.equal(await stale, false);
  assert.equal(current[0].id, 'edited', 'an in-flight old reply cannot overwrite a newer editor result');

  let previousWatermark;
  let projections = 0;
  let notifications = 0;
  const stableRow = { id: 'stable', get statusRev() { projections += 1; return 'stable-token'; } };
  current = [stableRow];
  const cached = createStatusController({ getRows: () => current, setRows: (next) => { current = next; },
    fetchDelta: async (watermark) => {
      if (previousWatermark) assert.equal(watermark, previousWatermark, 'unchanged rows reuse their watermark');
      previousWatermark = watermark;
      return { full: false, rows: [], removed: [] };
    },
    onRows: () => { notifications += 1; } });
  await cached.refresh(); await cached.refresh(); await cached.refresh();
  assert.equal(projections, 1, 'idle IPC must not rebuild every row revision');
  assert.equal(notifications, 3, 'consumers still reconcile local state on each refresh');
  current = [];
  const requests = [];
  const cursorClient = createStatusController({ getRows: () => current, setRows: (next) => { current = next; },
    fetchDelta: async (watermark) => { requests.push(watermark); return engine.statusDelta(watermark, { includeWatermark: false, includeCursor: true }); } });
  await cursorClient.refresh(); await cursorClient.refresh();
  assert.equal(typeof requests[1], 'string', 'steady refresh sends one opaque cursor');
  const cursor = requests[1];
  engine.profiles.set('env-1', { id: 'env-1', name: 'cursor-change', cookies: 'private' });
  await cursorClient.refresh();
  assert.equal(current[0].name, 'cursor-change'); assert.equal(current[0].cookies, '');
  for (let i = 0; i < 10; i++) { engine.invalidateStatusCache(); engine.statusDelta(null, { includeCursor: true }); }
  assert.equal(engine._statusCursorHistory.size, 8);
  assert.equal(engine.statusDelta(cursor).full, true, 'expired history safely resynchronizes');
  assert.equal(engine.statusDelta('unknown-engine:cursor').full, true);
  current = [{ id: 'local-edit', statusRev: 'local' }];
  await cursorClient.refresh();
  assert.equal(typeof requests.at(-1), 'object', 'a local row replacement invalidates the cursor');
  for (const bad of [[null], [{ id: '' }], [{ id: 'a' }, { id: 'a' }], [['a']]]) {
    assert.throws(() => mergeStatusDelta([], { full: true, rows: bad }), /Invalid status/);
    assert.throws(() => mergeStatusDelta([], { full: false, rows: bad }), /Invalid status/);
  }
  assert.throws(() => mergeStatusDelta([], { full: false, rows: [{ id: 'same' }], removed: ['same'] }), /Invalid status/);
  current = [{ id: 'safe', statusRev: 'safe-token' }];
  const safe = current, fallbackRequests = [];
  let nextDelta = { full: false, rows: [], cursor: 'old-cursor' }, fullReply = safe;
  const recovery = createStatusController({ getRows: () => current, setRows: (next) => { current = next; },
    fetchDelta: async (watermark) => { fallbackRequests.push(watermark); return nextDelta; }, fetchFull: async () => fullReply });
  await recovery.refresh();
  nextDelta = { full: false, rows: [null], cursor: 'bad-cursor' };
  await recovery.refresh();
  assert.equal(current, safe, 'a validated full fallback may reuse the exact current array');
  nextDelta = { full: false, rows: [] }; await recovery.refresh();
  assert.equal(typeof fallbackRequests.at(-1), 'object', 'a malformed delta clears the old cursor even when fallback reuses rows');
  fullReply = [null]; nextDelta = { full: true, rows: [null] };
  await assert.rejects(recovery.refresh(), /Invalid status/);
  assert.equal(current, safe, 'invalid delta and full replies leave the last good rows intact');
  console.log('STATUS_REFRESH_SELFTEST OK (runtime delta, stable edit revisions, restart tokens, cache lifetime, linear merge, IPC races)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
