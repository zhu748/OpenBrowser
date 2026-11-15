'use strict';

const assert = require('node:assert/strict');
const { prepareLaunchProfile } = require('../../engine/launch-preparation');
const { profileWriteGuard } = require('../../engine/profile-write-guard');
const { TrackedProfileMap } = require('../../engine/profile-revisions');

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function fixture() {
  const profile = { id: 'preparation', name: 'Original', advanced: {} };
  let active = true;
  const calls = [];
  const engine = {
    profiles: new TrackedProfileMap([[profile.id, profile]]), networkInfo: new Map(),
    sanitizeProfile: value => ({ ...value }),
    assertStartGenerationActive() {
      if (!active) throw Object.assign(Error('cancelled'), { code: 'BROWSER_START_CANCELLED' });
    },
    prepareProfileProxyForStart: async value => value,
    profileRoot: () => '/unused-preparation-fixture',
    ensureExitNetworkForLocale: async () => {},
    applyResolvedLocale: (value, network) => ({ ...value, exitIp: network?.ip }),
    emitStartProgress: (_id, stage) => calls.push(stage),
    emit() {},
    persist: async () => { calls.push('persist'); },
  };
  const start = onStage => prepareLaunchProfile(engine, profile, {
    lifecycleGeneration: 1, assertCurrent: profileWriteGuard(engine, profile.id), onStage: onStage || (() => {}),
  });
  return { engine, profile, calls, start, cancel: () => { active = false; } };
}

async function main() {
  for (const mode of ['cancel', 'edit', 'delete', 'failure-after-cancel']) {
    const f = fixture(), entered = deferred(), response = deferred();
    f.engine.ensureExitNetworkForLocale = async (_profile, options) => {
      entered.resolve();
      await response.promise;
      if (mode === 'failure-after-cancel') throw Error('late network error');
      options.onNetwork({ ip: '192.0.2.3' });
    };
    const running = f.start();
    const rejected = assert.rejects(running, {
      code: mode === 'edit' || mode === 'delete' ? 'PROFILE_STALE_REV' : 'BROWSER_START_CANCELLED',
    });
    await entered.promise;
    if (mode === 'edit') f.engine.profiles.set(f.profile.id, { ...f.profile, name: 'Newer edit' });
    else if (mode === 'delete') f.engine.profiles.delete(f.profile.id);
    else f.cancel();
    const latest = f.engine.profiles.get(f.profile.id);
    response.resolve();
    await rejected;
    assert.strictEqual(f.engine.profiles.get(f.profile.id), latest, 'late results cannot replace current state');
    assert.equal(f.engine.networkInfo.size, 0);
    assert.equal(f.calls.includes('persist'), false);
  }
  {
    const f = fixture();
    f.engine.ensureExitNetworkForLocale = async () => { throw Error('a cancelled progress callback must not probe'); };
    await assert.rejects(f.start(stage => { if (stage === 'resources') f.cancel(); }), { code: 'BROWSER_START_CANCELLED' });
    assert.deepEqual(f.calls, ['resources']);
  }
  {
    const f = fixture(), entered = deferred(), disk = deferred();
    f.engine.persist = async () => { entered.resolve(); await disk.promise; };
    const running = f.start();
    const rejected = assert.rejects(running, { code: 'BROWSER_START_CANCELLED' });
    await entered.promise;
    f.cancel(); disk.resolve(); await rejected;
  }
  const f = fixture();
  const result = await f.start();
  result.assertCurrent();
  assert.deepEqual(f.calls, ['resources', 'proxy', 'persist']);
  console.log('PASS launch preparation: cancellation, stale results, progress reentrancy and persistence barrier');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
