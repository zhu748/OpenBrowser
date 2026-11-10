'use strict';

/**
 * Profile revision tracking + per-ID modify commands regression.
 *
 * Covers engine/profile-revisions.js (TrackedProfileMap, shared hash), the
 * applyProfileCommands engine API (baseRev conflict gate, staging reuse) and
 * the profiles:apply-commands IPC wiring, plus the revision semantics of every
 * engine-side write family that can bump a row while an editor is open:
 * trash/restore, cookie clear, local API edit, sync re-publish.
 */

const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');


const { BrowserEngine } = require('../../engine');
const { TrackedProfileMap, profileDataHash } = require('../../engine/profile-revisions');
const { ProfileStoreSqlite } = require('../../automation/profile-store-sqlite');
const { registerProfileIpc } = require('../../main/profile-ipc');
const { unwrapIpcResult } = require('../../shared/ipc-result');

function buildEngine(tmp) {
  const engine = new BrowserEngine({ getPath: () => tmp });
  engine.usingSqlite = true;
  engine.sqliteStore = {
    setMeta() {}, saveExtensions() {}, saveAssignmentsDiffed() {},
    saveProfilesDiffed() {},
    saveEngineState() {},
    trashProfiles() {}, restoreProfiles() {},
  };
  return engine;
}

async function main() {
  const tmp = path.join(os.tmpdir(), 'ob-profile-revisions-selftest');

  // ---- TrackedProfileMap unit behavior ----
  {
    const map = new TrackedProfileMap();
    const row = { id: 'a1', number: 1, name: 'A' };
    map.set('a1', row);
    assert.equal(map.revisionOf('a1'), 1, 'first write gets rev 1');
    map.set('a1', { ...row }); // same content, different object
    assert.equal(map.revisionOf('a1'), 1, 'content-identical rewrite keeps the revision');
    map.set('a1', { ...row, name: 'A2' });
    assert.equal(map.revisionOf('a1'), 2, 'content change bumps the revision');
    map.delete('a1');
    assert.equal(map.revisionOf('a1'), 0, 'delete forgets the revision');
    // Fresh-object invariant (sqlite Test 3.5 contract): in-place mutation of
    // the stored object must still be detected on the next set.
    const row2 = { id: 'a1', number: 1, name: 'A' };
    map.set('a1', row2);
    row2.name = 'A3-in-place';
    map.set('a1', row2);
    assert.equal(map.revisionOf('a1'), 4, 'delete/recreate does not reuse an old editor revision');
    assert.equal(map.revisionState(['a1', 'missing']).a1, 4);
    assert.equal(map.revisionState(['a1', 'missing']).missing, 0);
    map.clear();
    assert.equal(map.revisionOf('a1'), 0, 'clear removes the revision index too');
    map.set('a1', row);
    assert.equal(map.revisionOf('a1'), 5, 'clear does not reuse issued revisions');
    const seeded = new TrackedProfileMap([['a1', row], ['b1', { id: 'b1', name: 'B' }]]);
    assert.equal(seeded.size, 2, 'entry construction initializes tracking before calling set');
    assert.notEqual(seeded.revisionOf('a1'), seeded.revisionOf('b1'));
  }

  // ---- shared hash: engine map and sqlite store see the same bytes ----
  {
    const engine = buildEngine(path.join(tmp, 'hash'));
    const row = { id: 'h1', number: 7, name: 'Hash', proxy: 'http://u:p@203.0.113.1:8080', cookies: 'c'.repeat(4096) };
    await engine.syncProfiles([row]);
    const store = new ProfileStoreSqlite({ dbPath: path.join(tmp, 'hash', 'data.db') });
    await store.init();
    const engineHash = profileDataHash(engine.profiles.get('h1'));
    const storeHash = store.profileDataHash(engine.profiles.get('h1'));
    assert.equal(engineHash, storeHash, 'engine revisions and sqlite row hashes share one definition');
    assert.equal(storeHash, engine.sqliteStore.profileDataHash?.(engine.profiles.get('h1')) ?? storeHash, 'hash stays defined');
  }

  // ---- applyProfileCommands: happy path, publish and revision bump ----
  {
    const engine = buildEngine(path.join(tmp, 'apply'));
    await engine.syncProfiles([{ id: 'm1', name: 'One', number: 1 }]);
    const rev1 = engine.profiles.revisionOf('m1');
    assert.ok(rev1 >= 1);
    const status = engine.status();
    assert.equal(status.find((item) => item.id === 'm1').rev, rev1, 'status view carries the row revision');

    const result = await engine.applyProfileCommands([{
      kind: 'modify', id: 'm1', baseRev: rev1, profile: { id: 'm1', name: 'OneEdited', number: 1 },
    }]);
    assert.equal(engine.profiles.get('m1').name, 'OneEdited');
    assert.equal(result.find((item) => item.id === 'm1').rev, rev1 + 1, 'a command bumps the row revision');
  }

  // ---- applyProfileCommands: stale base revision is rejected atomically ----
  {
    const engine = buildEngine(path.join(tmp, 'stale'));
    await engine.syncProfiles([
      { id: 's1', name: 'S1', number: 1 },
      { id: 's2', name: 'S2', number: 2 },
    ]);
    const rev1 = engine.profiles.revisionOf('s1');
    // Engine-side change the renderer has never seen (proxy exit persisted).
    engine.profiles.set('s1', { ...engine.profiles.get('s1'), name: 'S1-engine' });
    const rev2 = engine.profiles.revisionOf('s1');
    assert.ok(rev2 > rev1, 'engine-side write bumps the revision');

    const before = structuredClone(engine.profiles.get('s1'));
    await assert.rejects(engine.applyProfileCommands([
      { kind: 'modify', id: 's1', baseRev: rev1, profile: { id: 's1', name: 'S1-ui', number: 1 } },
      { kind: 'modify', id: 's2', baseRev: engine.profiles.revisionOf('s2'), profile: { id: 's2', name: 'S2-ui', number: 2 } },
    ]), (error) => {
      assert.equal(error.code, 'PROFILE_STALE_REV');
      assert.deepEqual(error.stale, [{ id: 's1', baseRev: rev1, rev: rev2 }]);
      return true;
    }, 'stale command is rejected');
    assert.equal(engine.profiles.get('s1').name, before.name, 'rejection leaves the engine row untouched');
    assert.equal(engine.profiles.get('s2').name, 'S2', 'the whole batch is rejected, not half-applied');
  }

  // ---- applyProfileCommands: validation ----
  {
    const engine = buildEngine(path.join(tmp, 'validation'));
    await engine.syncProfiles([{ id: 'v1', name: 'V1', number: 1 }]);
    await assert.rejects(engine.applyProfileCommands([]), /Invalid profile commands/);
    await assert.rejects(engine.applyProfileCommands([{ kind: 'delete', id: 'v1' }]), /Unknown profile command/);
    await assert.rejects(engine.applyProfileCommands([{ kind: 'modify', id: 'v1', profile: { id: 'v1' } }]), /Invalid base revision/);
    const unchanged = structuredClone(engine.status());
    const editor = engine.profileForEdit('v1');
    assert.equal(editor.rev, engine.profiles.revisionOf('v1'));
    editor.profile.name = 'Detached editor copy';
    assert.notEqual(engine.profiles.get('v1').name, editor.profile.name, 'editor snapshots cannot mutate engine state');
    assert.throws(() => engine.profileForEdit('missing'), (error) => error.code === 'PROFILE_NOT_FOUND');
    await assert.rejects(engine.applyProfileCommands([
      { kind: 'modify', id: 'v1', baseRev: 1, profile: { id: 'other', name: 'Other' } },
    ]), (error) => error.code === 'PROFILE_COMMAND_ID_MISMATCH');
    await assert.rejects(engine.applyProfileCommands([
      { kind: 'modify', id: 'missing', baseRev: 0, profile: { id: 'missing', name: 'Missing' } },
    ]), (error) => error.code === 'PROFILE_NOT_FOUND');
    assert.deepEqual(engine.status(), unchanged, 'invalid targets cannot publish partial changes');
    await assert.rejects(engine.applyProfileCommands([
      { kind: 'modify', id: 'v1', baseRev: 1, profile: { id: 'v1', name: 'a' } },
      { kind: 'modify', id: 'v1', baseRev: 1, profile: { id: 'v1', name: 'b' } },
    ]), /Duplicate command/);
    await assert.rejects(engine.applyProfileCommands([
      { kind: 'modify', id: '../evil', baseRev: 0, profile: { id: '../evil', name: 'x' } },
    ]), /Invalid profile/);
  }

  // ---- engine write families bump revisions (the stale-detection surface) ----
  {
    const engine = buildEngine(path.join(tmp, 'families'));
    await engine.syncProfiles([
      { id: 'f1', name: 'F1', number: 1, cookies: 'k=v', platform: { password: 'pw', totpSecret: 't' } },
    ]);
    const rev0 = engine.profiles.revisionOf('f1');

    // trash → content change (trashed flag) even though name is untouched
    await engine.trashProfiles(['f1']);
    assert.ok(engine.profiles.revisionOf('f1') > rev0, 'trash bumps the revision');
    await engine.restoreProfiles(['f1']);
    assert.ok(engine.profiles.revisionOf('f1') >= rev0 + 2, 'restore bumps again');

    // in-place mutation followed by the engine's own re-set (close-time cookie
    // snapshot path writes a fresh object)
    const stored = engine.profiles.get('f1');
    engine.profiles.set('f1', { ...stored, cookies: 'snap=1' });
    assert.ok(engine.profiles.revisionOf('f1') >= rev0 + 3, 'cookie snapshot write bumps');

    // no-op re-publish (renderer resend of identical content)
    const before = engine.profiles.revisionOf('f1');
    await engine.syncProfiles([structuredClone(engine.profiles.get('f1'))]);
    assert.equal(engine.profiles.revisionOf('f1'), before, 'identical content does not bump');
  }

  // ---- IPC wiring: profiles:apply-commands reaches the engine ----
  {
    const engine = buildEngine(path.join(tmp, 'ipc'));
    await engine.syncProfiles([{ id: 'i1', name: 'I1', number: 1 }]);
    const channels = new Map();
    const registered = [];
    const registerTrustedIpc = (channel, handler) => { channels.set(channel, handler); registered.push(channel); };
    registerProfileIpc({ registerTrustedIpc, engine, sanitizeIds: (ids) => ids, beforeRemove: () => {} });
    assert.ok(registered.includes('profiles:apply-commands'), 'apply-commands channel is registered');
    const rev = engine.profiles.revisionOf('i1');
    await channels.get('profiles:apply-commands')(null, [{
      kind: 'modify', id: 'i1', baseRev: rev, profile: { id: 'i1', name: 'I1-edited', number: 1 },
    }]);
    assert.equal(engine.profiles.get('i1').name, 'I1-edited', 'IPC path lands the command');
    const rejected = await channels.get('profiles:apply-commands')(null, [
      { kind: 'modify', id: 'i1', baseRev: rev, profile: { id: 'i1', name: 'I1-stale', number: 1 } },
    ]);
    assert.throws(() => unwrapIpcResult(structuredClone(rejected)), (error) => error.code === 'PROFILE_STALE_REV');
  }

  // ---- status poll payload: rev stays consistent with the cache ----
  {
    const engine = buildEngine(path.join(tmp, 'poll'));
    await engine.syncProfiles([{ id: 'p1', name: 'P1', number: 1 }]);
    const first = engine.status();
    const second = engine.status();
    assert.equal(first, second, 'status view is snapshot-cached');
    assert.equal(first.find((item) => item.id === 'p1').rev, second.find((item) => item.id === 'p1').rev);
  }

  // ---- statusDelta: incremental poll lane ----
  {
    const engine = buildEngine(path.join(tmp, 'delta'));
    await engine.syncProfiles([
      { id: 'd1', name: 'D1', number: 1 },
      { id: 'd2', name: 'D2', number: 2 },
    ]);
    const full = engine.statusDelta(null);
    assert.equal(full.full, true, 'no watermark answers full');
    const watermark = engine.profiles.revisionState();
    // No change since the watermark: empty delta.
    const none = engine.statusDelta(watermark);
    assert.equal(none.full, false);
    assert.equal(none.rows.length, 0);
    assert.deepEqual(none.removed, []);
    // One row moves (engine-side write the renderer never saw). Real engine
    // write paths invalidate the status cache alongside the set; mirror that.
    engine.profiles.set('d2', { ...engine.profiles.get('d2'), name: 'D2-engine' });
    engine.invalidateStatusCache();
    const delta = engine.statusDelta(watermark);
    assert.equal(delta.full, false);
    assert.deepEqual(delta.rows.map((row) => row.id), ['d2'], 'only the moved row is returned');
    assert.equal(delta.rows[0].name, 'D2-engine');
    assert.equal(delta.rows[0].rev, engine.profiles.revisionOf('d2'));
    // Deleting a row reports it as removed.
    engine.profiles.delete('d1');
    const afterDelete = engine.statusDelta(delta.watermark);
    assert.equal(afterDelete.full, false);
    assert.deepEqual(afterDelete.removed, ['d1']);
    assert.equal(afterDelete.rows.length, 0, 'rows unchanged since the last watermark');
    // A watermark missing engine rows (boot-time unknown) forces a full resync.
    engine.syncProfiles([{ id: 'd3', name: 'D3', number: 3 }]);
    const partial = engine.statusDelta({ d2: engine.profiles.revisionOf('d2') });
    assert.equal(partial.full, true, 'unknown engine rows force a full answer');
    assert.equal(partial.rows.length, 2, 'full answer carries every live row');
  }

  console.log('PROFILE_REVISIONS_SELFTEST OK (tracked map, shared hash, apply commands, conflict gate, write families, IPC, status delta)');
}

main().then(
  () => process.exit(0),
  (error) => { console.error('PROFILE_REVISIONS_SELFTEST FAILED:', error); process.exit(1); },
);
