'use strict';

const assert = require('node:assert/strict');
const { LocalService } = require('../../rebuild/local-service');
const { createLocalRouteRegistry, localRoutes } = require('../../rebuild/local-route-registry');

const handle = async () => true;
assert.throws(() => createLocalRouteRegistry([[['a:b', handle, 'serial'], ['a:b', handle, 'parallel']]]), /Duplicate/);
assert.throws(() => createLocalRouteRegistry([[['a:b', null, 'serial']]]), /Missing local handler/);
assert.throws(() => createLocalRouteRegistry([[['a:b', handle]]]), /execution policy/);
const exact = async () => 'exact';
const registry = createLocalRouteRegistry([[['a:', handle, 'serial'], ['a:b', exact, 'parallel']]]);
assert.equal(registry.resolve('a:b').handle, exact);
assert.equal(registry.resolve('a:c').handle, handle);
assert.ok(localRoutes.every(Object.isFrozen));

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function main() {
  // Use the real request/dispatch/handlers with controlled I/O and no desktop.
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.data = { settings: {} };
  service.load = async () => {};
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
  await assert.rejects(service.request('missing:method'), { code: 'LOCAL_CHANNEL_UNIMPLEMENTED' });
  await service.request('settings:set', { recovered: true });
  assert.equal(service.data.settings.recovered, true);

  // A large existing library must not exceed the JS argument-count limit when
  // creating a profile or reserving a batch of sequential display numbers.
  service.engine.status = () => Array.from({ length: 200000 }, (_, index) => ({ number: index + 1 }));
  let saved;
  service.engine.syncProfiles = async profiles => { saved = profiles; };
  const created = await service.request('profiles:create', { windowName: 'large library' });
  assert.equal(created.sortNum, 200001);
  assert.equal(saved[0].number, 200001);
  const batch = await service.request('profiles:create-batch', { createCount: 3 });
  assert.deepEqual(batch.map(profile => profile.sortNum), [200001, 200002, 200003]);
  console.log('PASS local routes: validation, dispatch, launch isolation, serialized rollback and recovery');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
