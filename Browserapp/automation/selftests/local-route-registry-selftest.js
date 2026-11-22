'use strict';

const assert = require('node:assert/strict');
const { LocalService } = require('../../rebuild/local-service');
const { createLocalRouteRegistry, localRoutes } = require('../../rebuild/local-route-registry');

const handle = async () => true;
assert.throws(() => createLocalRouteRegistry([[['a:b', handle, 'serial'], ['a:b', handle, 'parallel']]]), /Duplicate/);
assert.throws(() => createLocalRouteRegistry([[['a:b', null, 'serial']]]), /Missing local handler/);
assert.throws(() => createLocalRouteRegistry([[['a:b', handle]]]), /execution policy/);
assert.throws(() => createLocalRouteRegistry([[['a:b', handle, 'read', false]]]), /data policy/);
const exact = async () => 'exact';
const registry = createLocalRouteRegistry([[['a:', handle, 'serial'], ['a:b', exact, 'parallel']]]);
assert.equal(registry.resolve('a:b').handle, exact);
assert.equal(registry.resolve('a:c').handle, handle);
for (const routes of [
  [['a:', handle, 'serial'], ['a:read:', exact, 'read']],
  [['a:read:', exact, 'read'], ['a:', handle, 'serial']],
]) {
  const nested = createLocalRouteRegistry([routes]);
  assert.equal(nested.resolve('a:read:list').handle, exact);
  assert.equal(nested.resolve('a:read:list').execution, 'read');
  assert.equal(nested.resolve('a:other').handle, handle);
}
assert.ok(localRoutes.every(Object.isFrozen));

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function checkNotificationWrites(service) {
  service.data.notifications = [
    { id: 'unread', read: false },
    { id: 'already-read', read: true },
    { id: 'other-unread', read: false },
  ];
  let writes = 0;
  service.save = async () => { writes++; };
  for (const ids of [[], ['missing'], ['already-read']]) {
    assert.equal(await service.request('notifications:read', { ids }), true);
  }
  assert.equal(writes, 0, 'no-op reads must not write the store');
  await assert.rejects(service.request('notifications:read', { ids: [null] }), /通知 ID/);
  assert.equal(writes, 0);

  const markUnread = () => service.request('notifications:read', { ids: ['unread', 'unread'] });
  await Promise.all([markUnread(), markUnread()]);
  assert.equal(writes, 1, 'concurrent duplicate requests save only the first change');
  assert.deepEqual(service.data.notifications.map(row => row.read), [true, true, false]);

  service.save = async () => { throw Error('notice disk fixture'); };
  await assert.rejects(service.request('notifications:read'), /notice disk fixture/);
  assert.equal(service.data.notifications[2].read, false, 'failed writes roll back read flags');
  service.save = async () => { writes++; };
  await service.request('notifications:read');
  await service.request('notifications:read');
  assert.equal(writes, 2, 'mark all saves only when something changes');
  assert.ok(service.data.notifications.every(row => row.read));
}

async function main() {
  // Use the real request/dispatch/handlers with controlled I/O and no desktop.
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.data = { settings: {} };
  let loaded = 0;
  service.load = async () => { loaded++; };
  service.agent = { request: async (method, payload) => ({ method, payload }) };
  service.robot = service.agent;
  assert.deepEqual(await service.request('agent:info', { id: 1 }), { method: 'info', payload: { id: 1 } });
  assert.equal(loaded, 0, 'the Agent owns its store and must not depend on local metadata');
  await service.request('cookie-robot:list');
  assert.equal(loaded, 1, 'Cookie Robot waits for local metadata migration');
  service.save = async () => {};
  const launch = deferred();
  service.engine = {
    profileForEdit: () => ({ profile: { id: 'one' } }),
    start: () => launch.promise,
  };
  const starting = service.request('profiles:start', { id: 'one' });
  await service.request('settings:set', { duringLaunch: true });
  assert.equal(service.data.settings.duringLaunch, true, 'launch must not hold the local mutation queue');
  launch.resolve({ alreadyRunning: true });
  await starting;

  const disk = deferred();
  const entered = deferred();
  let writes = 0;
  service.save = async () => {
    if (++writes === 1) { entered.resolve(); await disk.promise; throw Error('disk fixture'); }
  };
  const failed = service.request('settings:set', { failed: true });
  const rejected = assert.rejects(failed, /disk fixture/);
  await entered.promise;
  const next = service.request('settings:set', { next: true });
  assert.equal(writes, 1, 'local writes must remain serialized');
  disk.resolve();
  await rejected;
  await next;
  assert.deepEqual(service.data.settings, { duringLaunch: true, next: true });

  // A read waits for a pending write, then clones only its result. Detect
  // whole-store cloning without timing assertions or a large memory fixture.
  const pendingWrite = deferred();
  const saving = deferred();
  service.save = async () => { saving.resolve(); await pendingWrite.promise; };
  const writing = service.request('settings:set', { ordered: true });
  await saving.promise;
  let readFinished = false;
  const originalClone = globalThis.structuredClone;
  const reading = service.request('settings:get').then(value => { readFinished = true; return value; });
  await Promise.resolve();
  assert.equal(readFinished, false, 'reads cannot observe a write before it commits');
  globalThis.structuredClone = value => {
    assert.notStrictEqual(value, service.data, 'ordered reads must not clone the whole local store');
    return originalClone(value);
  };
  try {
    pendingWrite.resolve();
    await writing;
    const settings = await reading;
    assert.equal(settings.ordered, true);
    settings.ordered = false;
    assert.equal(service.data.settings.ordered, true, 'read results remain isolated');
  } finally {
    globalThis.structuredClone = originalClone;
  }
  service.save = async () => {};
  await assert.rejects(service.request('missing:method'), { code: 'LOCAL_CHANNEL_UNIMPLEMENTED' });
  await service.request('settings:set', { recovered: true });
  assert.equal(service.data.settings.recovered, true);
  await checkNotificationWrites(service);

  // A large existing library must not exceed the JS argument-count limit when
  // creating a profile or reserving a batch of sequential display numbers.
  service.engine.profiles = new Map();
  for (let number = 1; number <= 200000; number++) {
    service.engine.profiles.set(String(number), { number });
  }
  service.engine.status = () => { throw Error('Number allocation must not build a status snapshot'); };
  let saved;
  service.engine.syncProfiles = async profiles => { saved = profiles; };
  const created = await service.request('profiles:create', { windowName: 'large library' });
  assert.equal(created.sortNum, 200001);
  assert.equal(saved[0].number, 200001);
  const batch = await service.request('profiles:create-batch', { createCount: 3 });
  assert.deepEqual(batch.map(profile => profile.sortNum), [200001, 200002, 200003]);
  console.log('PASS local routes: validation, dispatch, launch isolation, serialized rollback, notification write deduplication and recovery');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
