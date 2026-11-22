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

async function checkActivityRecords() {
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.data = { settings: {} };
  service.load = async () => {};
  const writes = [];
  service.save = async () => { writes.push(JSON.parse(JSON.stringify(service.data))); };

  for (const invalid of [{}, { action: null }, { action: ['open-settings'] }, { action: 'contains space' }]) {
    await assert.rejects(service.request('activity:append', invalid), /Invalid action name/);
  }
  assert.deepEqual(writes, []);
  assert.deepEqual(service.data, { settings: {} });

  const action = 'open-settings:v2';
  assert.equal(await service.request('activity:append', { action }), true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].activity[0].action, action);
  assert.equal((await service.request('notifications:list'))[0].message, action);
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

async function checkLabelProjection() {
  const service = Object.create(LocalService.prototype);
  const snapshot = [
    { id: 'first', tag: '1,2' },
    { id: 'trashed', tag: '1', trashed: true },
    { id: 'second', tag: '1' },
  ];
  let statusCalls = 0;
  service.queue = Promise.resolve();
  service.data = { labels: [], groups: [] };
  service.load = async () => {};
  service.engine = { status: () => { statusCalls++; return snapshot; } };
  assert.deepEqual(await service.request('labels:list'), []);
  assert.equal(statusCalls, 0, 'an empty label list needs no profile snapshot');

  service.data.labels = Array.from({ length: 1000 }, (_, index) => ({ id: index + 1 }));
  const rows = await service.request('labels:list');
  assert.equal(rows.length, 1000);
  assert.equal(statusCalls, 1, 'all labels must share one profile-index lookup');
  assert.deepEqual(rows[0].bindWindowIds, ['first', 'second']);
  assert.deepEqual(rows[1].bindWindowIds, ['first']);
  assert.deepEqual(rows[2].bindWindowIds, []);
  rows[0].bindWindowIds.push('not-a-profile');
  const again = await service.request('labels:list');
  assert.equal(statusCalls, 2);
  assert.deepEqual(again[0].bindWindowIds, ['first', 'second'], 'returned lists must not edit the cached index');
}

async function checkBatchAssociations() {
  const service = Object.create(LocalService.prototype);
  const first = { id: 'first', tag: '1,2,3,2', groupId: '7', group_name: 'Selected' };
  const second = { id: 'second', tag: '1,3', groupId: '8', group_name: 'Keep' };
  const profiles = new Map([[first.id, first], [second.id, second]]);
  const writes = [];
  let linearLookupWidth = 0;
  class ObservedIds extends Array {
    includes(value) { linearLookupWidth += this.length; return super.includes(value); }
  }
  service.queue = Promise.resolve();
  service.data = { labels: [{ id: 1 }, { id: 2 }, { id: 3 }], groups: [{ id: 7 }, { id: '8' }] };
  service.load = async () => {};
  service.save = async () => {};
  service.engine = {
    profiles,
    profileForEdit: id => ({ profile: profiles.get(id), rev: 4 }),
    async syncProfiles(rows, options) {
      writes.push({ ids: rows.map(row => row.id), options });
      for (const row of rows) profiles.set(row.id, row);
    },
  };

  const unrelated = Array.from({ length: 1000 }, (_, index) => index + 100);
  await service.request('labels:delete', { ids: ObservedIds.from([...unrelated, '2', '02']) });
  assert.deepEqual(service.data.labels, [{ id: 1 }, { id: 3 }]);
  assert.equal(service.data.recordIds.labels, 3, 'deletion must preserve the ID high-water mark');
  assert.equal(profiles.get('first').tag, '1,3');
  await assert.rejects(service.request('groups:delete', { ids: ['local-default'] }), /默认项目不能删除/);
  await service.request('groups:delete', { ids: ObservedIds.from([...unrelated, 7, '7']) });
  assert.deepEqual(service.data.groups, [{ id: '8' }]);
  assert.equal(profiles.get('first').groupId, '');
  assert.equal(profiles.get('first').group_name, '');
  assert.equal(profiles.get('second'), second);
  assert.deepEqual(writes, Array.from({ length: 2 }, () => ({
    ids: ['first'], options: { checkRevisions: true, delta: true },
  })));
  assert.equal(linearLookupWidth, 0, 'bulk relationship updates must not rescan the entire ID array per row');
}

async function checkSavedFilterRename() {
  const service = Object.create(LocalService.prototype);
  const first = { filter_name: 'Active', filter_condition: { running: true } };
  const second = { filter_name: 'Favorite', filter_condition: { favorite: true } };
  const filterSort = [{ name: 'Favorite', sort: 1 }, { name: 'Active', sort: 2 }];
  service.queue = Promise.resolve();
  service.data = { settings: { filterSort }, filters: [first, second] };
  service.load = async () => {};
  let saves = 0;
  service.save = async () => { saves++; };
  const rename = name => service.request('filters:save', {
    ...first, old_filter_name: 'Active', new_filter_name: name,
  });

  await assert.rejects(rename('Favorite'), /筛选器名称已存在/);
  assert.deepEqual(service.data.filters, [first, second]);
  assert.deepEqual(service.data.settings.filterSort, filterSort);
  assert.equal(saves, 0, 'rejected rename cannot mutate persisted filters or ordering');

  await rename('Running');
  assert.equal(saves, 1);
  assert.deepEqual(service.data.settings.filterSort, [{ name: 'Favorite', sort: 1 }, { name: 'Running', sort: 2 }]);
  assert.deepEqual((await service.request('filters:list')).map(row => row.filter_name), ['Favorite', 'Running']);
  await service.request('filters:save', {
    old_filter_name: 'Running', new_filter_name: 'Running', filter_condition: { running: false },
  });
  assert.equal(saves, 2);
  assert.deepEqual((await service.request('filters:list')).map(row => row.filter_condition),
    [{ favorite: true }, { running: false }], 'an edit with the same name does not create a second record');
}

async function checkSettingsNoopWrites() {
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.load = async () => {};
  const storedSort = [{ name: 'name', direction: 'asc' }, { name: 'createdAt', direction: 'desc' }];
  service.data = { settings: { colorScheme: 'dark', tableSort: storedSort } };
  const saved = [];
  service.save = async () => { saved.push(structuredClone(service.data.settings)); };

  await service.request('settings:set', {});
  await Promise.all(Array.from({ length: 25 }, () => service.request('settings:set', {
    tableSort: storedSort.map(({ direction, name }) => ({ direction, name })), colorScheme: 'dark',
  })));
  assert.equal(saved.length, 0, 'repeated equal patches must not rewrite the local store');

  const reorderedSort = [...storedSort].reverse();
  await Promise.all([
    service.request('settings:set', { tableSort: reorderedSort }),
    service.request('settings:set', { tableSort: structuredClone(reorderedSort) }),
  ]);
  assert.deepEqual(saved, [{ colorScheme: 'dark', tableSort: reorderedSort }],
    'a real array reorder is persisted once and the unchanged duplicate is skipped');
  assert.deepEqual(await service.request('settings:get'), saved[0]);
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
  await checkActivityRecords();
  await checkNotificationWrites(service);
  await checkLabelProjection();
  await checkBatchAssociations();
  await checkSavedFilterRename();
  await checkSettingsNoopWrites();

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
  console.log('PASS local routes: validation, dispatch, launch isolation, rollback, notification/settings writes, collection projections and filter identity');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
