'use strict';

const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
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
  assert.deepEqual(await service.request('notifications:list'), []);
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
    async commitProfiles(rows, options) {
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
    ids: ['first'], options: { checkRevisions: true },
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

async function checkSavedFilterDeleteSort() {
  const service = Object.create(LocalService.prototype);
  const filters = [{ filter_name: 'First' }, { filter_name: 'Keep' }];
  const filterSort = [{ name: 'First', sort: 0 }, { name: 'Keep', sort: 1 }];
  service.queue = Promise.resolve();
  service.data = { settings: { filterSort }, filters };
  service.load = async () => {};
  const remove = () => service.request('filters:delete', { filter_name: 'First' });

  service.save = async () => { throw Error('filter disk fixture'); };
  await assert.rejects(remove(), /filter disk fixture/);
  assert.deepEqual(service.data, { settings: { filterSort }, filters }, 'failed deletion retains both view and order');

  const writes = [];
  service.save = async () => { writes.push(structuredClone(service.data)); };
  await remove();
  assert.deepEqual(writes, [{ settings: { filterSort: [{ name: 'Keep', sort: 1 }] }, filters: [{ filter_name: 'Keep' }] }],
    'deleting a saved view removes its sort entry in the same write');
  await remove();
  assert.equal(writes.length, 1, 'missing views do not cause a redundant write');
  await service.request('filters:save', { filter_name: 'First' });
  assert.deepEqual((await service.request('filters:list')).map(row => row.filter_name), ['Keep', 'First'],
    'a newly created view does not inherit a removed view’s position');
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

async function checkExchangeFileBom() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-exchange-bom-'));
  const file = path.join(temp, 'profiles.json');
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.load = async () => {};
  service.data = { groups: [] };
  service.window = () => null;
  service.dialog = { showOpenDialog: async () => ({ filePaths: [file], canceled: false }) };
  try {
    const valid = { format: 'openbrowser-profiles', version: 1, profiles: [] };
    for (const prefix of ['', '\uFEFF']) {
      await fs.writeFile(file, prefix + JSON.stringify(valid), 'utf8');
      assert.deepEqual(await service.request('transfer:import'), { count: 0 });
    }
    await fs.writeFile(file, '\uFEFF' + JSON.stringify({ ...valid, version: 2 }), 'utf8');
    await assert.rejects(service.request('transfer:import'), /Invalid profile exchange file/);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function checkExchangeProjectAliases() {
  const { BrowserEngine } = require('../../engine');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-exchange-projects-'));
  const sourceRoot = path.join(temp, 'source'), destinationRoot = path.join(temp, 'destination');
  const file = path.join(temp, 'profiles.json');
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  const sourceEngine = new BrowserEngine({ getPath: () => sourceRoot });
  const openDestinationEngine = () => new BrowserEngine({ getPath: () => destinationRoot });
  let destinationEngine = openDestinationEngine();
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  try {
    await sourceEngine.init(null);
    const first = { id: 'legacy-project-profile', name: 'Legacy member', groupId: '7', group_name: 'Old project name' };
    const second = { id: 'exact-project-profile', name: 'Exact member', groupId: '8', group_name: 'Another old name' };
    await sourceEngine.syncProfiles([first, second]);
    const source = new LocalService({
      engine: sourceEngine, root: sourceRoot, window: () => null,
      dialog: { showSaveDialog: async () => ({ canceled: false, filePath: file }) },
    });
    const groups = [
      { id: 7, projectName: 'Renamed legacy project' },
      { id: '8', projectName: 'Exact string project' },
      { id: 8, projectName: 'Separate numeric project' },
    ];
    await fs.writeFile(source.file, JSON.stringify({
      version: 1, groups, templates: [], filters: [], settings: {}, skills: [], tasks: [],
    }));
    const names = ['Renamed legacy project', 'Exact string project'];
    assert.deepEqual((await source.request('profiles:list')).map(row => row.projectName), names);
    const sourceBytes = await fs.readFile(source.file);
    assert.deepEqual(await source.request('transfer:export', { ids: [first.id, second.id] }), { count: 2 });
    const exchange = JSON.parse(await fs.readFile(file, 'utf8'));
    assert.deepEqual(exchange.profiles.map(row => row.group_name), names,
      'exchange must export current project names, including legacy numeric aliases');
    assert.deepEqual(await fs.readFile(source.file), sourceBytes, 'export must not rewrite the project store');

    await destinationEngine.init(null);
    const destination = new LocalService({
      engine: destinationEngine, root: destinationRoot, window: () => null,
      dialog: { showOpenDialog: async () => ({ canceled: false, filePaths: [file] }) },
    });
    assert.deepEqual(await destination.request('transfer:import'), { count: 2 });
    destinationEngine.sqliteStore?.close();
    destinationEngine = openDestinationEngine();
    await destinationEngine.init(null);
    const reopened = new LocalService({ engine: destinationEngine, root: destinationRoot });
    assert.deepEqual((await reopened.request('groups:list')).map(row => [row.projectName, row.windowCount]),
      names.map(name => [name, 1]), 'import must recreate the current projects and memberships');
  } finally {
    sourceEngine.sqliteStore?.close();
    destinationEngine.sqliteStore?.close();
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function checkProfileCommitReceipts() {
  const { BrowserEngine } = require('../../engine');
  const { ProfileStoreSqlite } = require('../profile-store-sqlite');
  const { readEngineStateCandidate } = require('../../engine/state-storage');
  const { readLocalStore } = require('../../rebuild/local-store');
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  const supported = ProfileStoreSqlite.isSupported;
  const rename = fs.rename;
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-profile-receipts-'));
  const failures = [];
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  try {
    assert.ok(supported(), 'receipt fixture requires real SQLite and forced JSON');
    for (const sqlite of [true, false]) {
      ProfileStoreSqlite.isSupported = sqlite ? supported : () => false;
      for (const [route, phases] of [
        ['transfer:import', ['projection', 'notification', 'profile-write']],
        ['groups:delete', ['projection', 'notification', 'metadata-write']],
      ]) {
        for (const phase of phases) {
          const root = await fs.mkdtemp(path.join(temp, 'workspace-'));
          const picker = path.join(root, 'exchange.json');
          const open = async () => {
            const engine = new BrowserEngine({ getPath: () => root });
            await engine.init(null);
            assert.equal(engine.usingSqlite, sqlite);
            return engine;
          };
          const serviceFor = engine => new LocalService({
            engine, root, window: () => null,
            dialog: { showOpenDialog: async () => ({ canceled: false, filePaths: [picker] }) },
          });
          const readProfiles = async engine => sqlite ? engine.sqliteStore.getAllProfiles()
            : (await readEngineStateCandidate(engine.stateFile)).saved.profiles;
          const enospc = Object.assign(Error('fixture persistent write failed'), { code: 'ENOSPC', errno: -28 });
          const projection = Object.assign(Error('fixture status projection failed'), { code: 'EIO' });
          const transferring = route === 'transfer:import';
          let engine;
          try {
            engine = await open();
            const service = serviceFor(engine);
            let group;
            if (transferring) {
              await engine.persist();
              await fs.writeFile(picker, JSON.stringify({
                format: 'openbrowser-profiles', version: 1,
                profiles: [{ id: 'source-profile', name: 'Imported profile', group_name: 'Imported project' }],
              }));
            } else {
              group = await service.request('groups:save', { projectName: 'Existing project' });
              const rows = await engine.syncProfiles([
                { id: 'member', name: 'Existing member', groupId: group.id, group_name: group.projectName },
              ], { delta: true });
              assert.deepEqual(rows.map(row => row.id), ['member'], 'ordinary sync still returns projected rows');
            }
            let profileUpdates = 0, writes = 0, projectionCalls = 0;
            const originalStatus = engine.status, emit = engine.emit;
            if (phase === 'projection') {
              // A real listener failure must not stop another listener from observing the update.
              engine.on(event => { if (event.action === 'profiles-update') throw Error('fixture late listener'); });
              engine.on(event => { if (event.action === 'profiles-update') profileUpdates++; });
            }
            engine.status = function () {
              projectionCalls++;
              if (phase === 'projection' || (phase === 'metadata-write' && writes >= 2)) throw projection;
              return originalStatus.call(this);
            };
            if (phase === 'notification') {
              engine.emit = function (event) {
                if (event.action === 'profiles-update') throw Error('fixture update notification preparation failed');
                return emit.call(this, event);
              };
            }
            if (phase === 'metadata-write' || (phase === 'profile-write' && !sqlite)) {
              fs.rename = async (source, target) => {
                if ((phase === 'metadata-write' && target === service.file && ++writes === 2) ||
                    (phase === 'profile-write' && target === engine.stateFile)) throw enospc;
                return rename(source, target);
              };
            }
            const saveProfiles = engine.sqliteStore?.saveProfilesDiffed;
            if (phase === 'profile-write' && sqlite) {
              engine.sqliteStore.saveProfilesDiffed = function (rows) {
                saveProfiles.call(this, rows);
                throw enospc; // Exercise rollback after the upsert, before SQLite commits.
              };
            }
            const invoke = () => service.request(route, group ? { ids: [group.id] } : {});
            try {
              if (phase.endsWith('-write')) await assert.rejects(invoke, error => error === enospc);
              else assert.deepEqual(await invoke(), transferring ? { count: 1 } : true);
              assert.equal(projectionCalls, 0);
              if (phase === 'projection') assert.equal(profileUpdates, 1);
            } finally {
              engine.status = originalStatus;
              engine.emit = emit;
              fs.rename = rename;
              if (sqlite) engine.sqliteStore.saveProfilesDiffed = saveProfiles;
            }
            const groups = (await readLocalStore(service.file)).data;
            const count = phase === 'profile-write' ? 0 : 1;
            const keptProject = phase !== 'profile-write' && (transferring || phase === 'metadata-write');
            assert.equal(Object.hasOwn(groups, 'pendingProfileRelations'), false);
            assert.equal(groups.groups.length, Number(keptProject));
            assert.deepEqual(service.data.groups, groups.groups);
            const durable = await readProfiles(engine);
            assert.equal(durable.length, count);
            if (count) assert.equal(durable[0].groupId, groups.groups[0]?.id || '');
            engine.sqliteStore?.close();
            engine = await open();
            const reopened = serviceFor(engine);
            assert.deepEqual((await readProfiles(engine)).map(row => [row.id, row.groupId]),
              durable.map(row => [row.id, row.groupId]));
            const reopenedGroups = await reopened.request('groups:list');
            assert.deepEqual(reopenedGroups.map(row => [row.id, row.windowCount]),
              groups.groups.map(row => [row.id, 1]));
            if (transferring) {
              assert.deepEqual(await reopened.request(route), { count: 1 });
              const ids = (await readProfiles(engine)).map(row => row.id);
              assert.equal(ids.length, count + 1);
              assert.equal(new Set(ids).size, ids.length, 'a new import of the same file still creates a different profile');
            }
          } catch (error) {
            failures.push(new Error(`${sqlite ? 'SQLite' : 'JSON'} ${route} ${phase}: ${error.message}`, { cause: error }));
          } finally { fs.rename = rename; engine?.sqliteStore?.close(); }
        }
      }
    }
    if (failures.length) throw new AggregateError(failures, `${failures.length} profile commit receipt cases failed`);
  } finally {
    ProfileStoreSqlite.isSupported = supported;
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function checkFullProfileListSingleSnapshot() {
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.load = async () => {};
  service.data = { groups: [{ id: 'group', projectName: 'Current name' }], labels: [] };
  const snapshot = [
    { id: 'first', groupId: 'group' },
    { id: 'trashed', trashed: true },
    { id: 'second', groupId: 'group', running: true },
  ];
  let statusCalls = 0;
  service.engine = { status: () => { statusCalls++; return snapshot; } };
  const rows = await service.request('profiles:list');
  assert.deepEqual(rows.map(row => [row.id, row.projectName]), [
    ['first', 'Current name'], ['second', 'Current name'],
  ]);
  assert.equal(statusCalls, 1, 'full list should reuse the same projection for every DTO');
  service.engine.status = () => [{ id: 'trashed', trashed: true }];
  service.profileIndex = () => { throw Error('Trash-only library should not build a projection'); };
  assert.deepEqual(await service.request('profiles:list'), []);
}

async function checkTemplateDeleteWrites() {
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.load = async () => {};
  const template = id => ({ id, templateName: String(id), content: "{}" });
  const templates = [template(1), template(2), template(4)];
  service.data = { templates, settings: {} };
  const writes = [];
  service.save = async () => { writes.push(structuredClone(service.data)); };
  const remove = ids => service.request('templates:delete', { ids });

  await Promise.all(Array.from({ length: 10 }, () => remove([99, 99])));
  assert.equal(writes.length, 0, 'stale template delete batches must not rewrite the workspace');
  assert.equal(service.data.templates, templates, 'no-op deletion retains existing metadata');
  await Promise.all([remove([2, 4, 2, 99]), remove([2, 4])]);
  assert.equal(writes.length, 1, 'only the batch that actually removes templates writes');
  assert.deepEqual(writes[0].templates, [template(1)]);
  assert.equal(writes[0].recordIds.templates, 4, 'high-water mark retains the highest removed ID');
  const added = await service.request('templates:save', { templateName: 'new', content: '{}' });
  assert.equal(added.id, 5);
}

async function checkProjectSortWrites() {
  const service = Object.create(LocalService.prototype);
  const groups = ['a', 'b', 'c', 'd'].map(id => ({ id }));
  service.queue = Promise.resolve();
  service.load = async () => {};
  service.data = { groups };
  const writes = [], events = [];
  service.save = async () => { writes.push(service.data.groups.map(row => row.id)); };
  service.engine = { emit: event => events.push(event) };
  const reorder = projectIds => service.request('groups:sort', { projectIds });

  await reorder(['local-default']);
  await Promise.all(Array.from({ length: 10 }, () => reorder(['b', 'd'])));
  assert.equal(writes.length, 0, 'unchanged project ordering must not rewrite the workspace store');
  assert.equal(events.length, 0, 'unchanged project ordering must not trigger list refreshes');
  assert.equal(service.data.groups, groups);

  await Promise.all([reorder(['d', 'b']), reorder(['d', 'b'])]);
  assert.deepEqual(writes, [['a', 'd', 'c', 'b']], 'only the chosen positions change, once');
  assert.deepEqual(events, [{ type: 'profiles', action: 'group-metadata' }]);
  await assert.rejects(reorder(['b', 'b']), /项目排序不能重复/);
  await assert.rejects(reorder(['unknown']), /排序中的项目不存在/);
  assert.equal(writes.length, 1, 'validation still applies to every reorder request');

  service.data.groups = [{ id: 7 }, { id: 'untouched' }, { id: 'current-id' }];
  await reorder(['current-id', 7]);
  assert.deepEqual(writes.at(-1), ['current-id', 'untouched', 7],
    'legacy numeric IDs from the project list reorder without changing persisted IDs');
  await reorder(['current-id', '7']);
  assert.equal(writes.length, 2, 'the equivalent string ID does not cause another write');
  service.data.groups.push({ id: '7' });
  await assert.rejects(reorder(['7']), /项目 ID 重复/);
  assert.equal(service.data.groups.length, 4, 'ambiguous IDs must not drop a persisted project');
  assert.equal(writes.length, 2);
}

async function checkProjectDeleteAmbiguity() {
  const { BrowserEngine } = require('../../engine');
  const { encodeLocalStore } = require('../../rebuild/local-store');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-delete-ambiguous-projects-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  const groups = [
    { id: 7, projectName: 'Legacy numeric project' },
    { id: '7', projectName: 'Separate string project' },
    { id: 8, projectName: 'Unambiguous numeric project' },
    { id: '9', projectName: 'Unambiguous string project' },
    { id: 'keep', projectName: 'Keep project' },
  ];
  const members = [
    { id: 'ambiguous-member', groupId: '7', group_name: 'Separate string project' },
    { id: 'numeric-member', groupId: '8', group_name: 'Unambiguous numeric project' },
    { id: 'string-member', groupId: '9', group_name: 'Unambiguous string project' },
    { id: 'keep-member', groupId: 'keep', group_name: 'Keep project' },
  ].map(row => ({ ...row, name: row.id }));
  let engine, service;
  const open = async () => {
    engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    assert.ok(engine.sqliteStore, 'fixture must exercise real SQLite persistence');
    service = new LocalService({ engine, root });
  };
  const membership = () => members.map(({ id }) => {
    const { rev, profile: { groupId, group_name } } = engine.profileForEdit(id);
    return { id, rev, groupId, group_name };
  });
  const links = rows => rows.map(({ id, groupId, group_name }) => [id, groupId, group_name]);
  try {
    await open();
    await engine.syncProfiles(members);
    await fs.writeFile(service.file, encodeLocalStore({
      version: 1, groups, templates: [], filters: [], settings: {}, skills: [], tasks: [],
    }));
    await service.load();
    const original = await fs.readFile(service.file);
    const originalMembers = membership();
    const events = [], sqliteWrites = [];
    let workspaceWrites = 0;
    const save = service.save.bind(service);
    service.save = () => { workspaceWrites++; return save(); };
    const sqliteSave = engine.sqliteStore.saveProfilesDiffed.bind(engine.sqliteStore);
    engine.sqliteStore.saveProfilesDiffed = rows => {
      sqliteWrites.push(rows.map(row => row.id));
      return sqliteSave(rows);
    };
    engine.on(event => events.push(event));

    const remove = ids => service.request('groups:delete', { ids });
    for (const ambiguous of [7, '7']) {
      await assert.rejects(remove(['8', ambiguous, 9]), {
        code: 'PROJECT_ID_AMBIGUOUS', message: /项目 ID 冲突，未删除任何项目/,
      });
    }
    assert.equal(workspaceWrites, 0, 'a rejected mixed batch must not stage or commit metadata');
    assert.deepEqual(sqliteWrites, [], 'ambiguous selection must not touch SQLite memberships');
    assert.deepEqual(events, [], 'a rejected delete must not publish a change');
    assert.deepEqual(service.data.groups, groups);
    assert.deepEqual(membership(), originalMembers, 'all member links and revisions must survive the whole rejected batch');
    assert.deepEqual(await fs.readFile(service.file), original, 'encrypted workspace bytes must remain identical');

    engine.sqliteStore.close();
    await open();
    await service.load();
    assert.deepEqual(service.data.groups, groups);
    const reopenedMembers = membership();
    assert.deepEqual(links(reopenedMembers), links(originalMembers), 'SQLite membership links survive reopening');
    assert.equal(await remove(['8', 9]), true, 'unambiguous aliases remain valid in a batch even when unselected IDs collide');
    const surviving = [groups[0], groups[1], groups[4]];
    assert.deepEqual(service.data.groups, surviving);
    const afterDelete = membership();
    assert.deepEqual(afterDelete.map(row => [row.groupId, row.group_name]), [
      ['7', 'Separate string project'], ['', ''], ['', ''], ['keep', 'Keep project'],
    ]);
    assert.deepEqual([afterDelete[0], afterDelete[3]], [reopenedMembers[0], reopenedMembers[3]]);

    engine.sqliteStore.close();
    await open();
    await service.load();
    assert.deepEqual(service.data.groups, surviving);
    assert.deepEqual(links(membership()), links(afterDelete), 'the valid batch persists through reopening');
  } finally {
    engine?.sqliteStore?.close();
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function checkProjectNameSearch() {
  const service = Object.create(LocalService.prototype);
  const groups = [{ id: 'group-a', projectName: 'Renamed project' }, { id: 7, projectName: 'Other project' }];
  const profiles = [
    { id: 'profile-a', groupId: 'group-a', group_name: 'Stale name' },
    { id: 'profile-b', groupId: '7', group_name: 'Renamed somewhere else' },
    { id: 'profile-numeric', groupId: 7 },
    { id: 'profile-legacy', group_name: 'Legacy project' },
  ];
  service.queue = Promise.resolve();
  service.load = async () => {};
  service.data = { groups, labels: [] };
  service.engine = { status: () => profiles };
  const decorate = service.decorate.bind(service);
  let decorated = 0;
  service.decorate = (...args) => { decorated++; return decorate(...args); };
  const search = queryValue => service.request('profiles:query', { queryKey: 'project_name', queryValue });

  const renamed = await search('rEnAmEd');
  assert.deepEqual(renamed.rows.map(row => row.id), ['profile-a'], 'search uses the current displayed project name');
  assert.equal(renamed.total, 1);
  assert.equal(renamed.rows[0].projectName, 'Renamed project');
  assert.equal(decorated, 1, 'non-matching rows are not decorated');
  assert.deepEqual((await search('Stale')).rows, [], 'renamed project no longer matches its old name');
  const current = await search('Other project');
  assert.deepEqual(current.rows.map(row => row.id), ['profile-b', 'profile-numeric'],
    'legacy numeric project keys resolve to their current name, not the stale profile label');
  assert.ok(current.rows.every(row => row.projectName === 'Other project'));
  assert.deepEqual((await service.request('profiles:query', { projectId: '7' })).rows.map(row => row.id),
    ['profile-b', 'profile-numeric'], 'project membership filter uses the same key');
  const projects = await service.request('groups:list');
  assert.equal(projects.find(project => project.id === 7)?.windowCount, 2,
    'project count includes both numeric and string profile references without changing the stored id');
  assert.deepEqual((await search('Legacy')).rows.map(row => row.id), ['profile-legacy'], 'legacy unindexed names still work');
  service.data.groups = [...groups, { id: '7', projectName: 'Separate stored label' }];
  assert.deepEqual((await search('Other project')).rows.map(row => row.id), ['profile-numeric']);
  assert.deepEqual((await search('Separate stored label')).rows.map(row => row.id), ['profile-b'],
    'ambiguous stored IDs still prefer the exact key for displayed names');
}

async function checkTextImportEncoding() {
  const { parseProfileImport } = require('../../rebuild/profile-import-formats');
  const parse = bytes => parseProfileImport({ type: 'text/plain', bytes });
  const text = 'windowName=工作台例子😀\r\nos=Linux\r\nwindowRemark=a=b';
  const le = Buffer.from(text, 'utf16le');
  const utf16LE = Buffer.concat([Buffer.from([0xff, 0xfe]), le]);
  const utf16BE = Buffer.concat([Buffer.from([0xfe, 0xff]), Buffer.from(le).swap16()]);
  const expected = [{ rowNum: 1, windowName: '工作台例子😀', os: 'Linux', windowRemark: 'a=b' }];
  assert.deepEqual(await parse(Buffer.from(text, 'utf8')), expected);
  assert.deepEqual(await parse(Buffer.from('\uFEFF' + text, 'utf8')), expected);
  assert.deepEqual(await parse(utf16LE), expected, 'preserve UTF-16LE BOM-marked text files');
  assert.deepEqual(await parse(utf16BE), expected, 'preserve UTF-16BE BOM-marked text files');
  await assert.rejects(parse(Buffer.from([0xf0, 0x28, 0x8c, 0x28])), { code: 'ERR_ENCODING_INVALID_ENCODED_DATA' });
  await assert.rejects(parse(Buffer.from([0xff, 0xfe, 0x61])), { code: 'ERR_ENCODING_INVALID_ENCODED_DATA' });
}

async function checkStartupProjectRecovery() {
  const { readLocalStore } = require('../../rebuild/local-store');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-project-recovery-'));
  const file = path.join(temp, 'rebuild-local.json');
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  const originalRename = fs.rename;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  const existing = { id: 7, project_id: 7, projectName: 'Current legacy label' };
  const recovered = { id: 'missing', project_id: 'missing', projectName: 'Recovered label' };
  const activity = [{ action: 'ui_action', at: '2026-07-01T09:00:00.000Z' }];
  const mirrored = { id: 'mirrored', title: '本地操作记录', message: 'ui_action', at: '2026-07-01T09:00:00.002Z', read: false };
  const actual = { id: 'actual', title: 'Cookie Robot', message: 'Warmup completed', at: mirrored.at, read: false };
  const explicit = { ...mirrored, id: 'explicit', source: 'local', read: true };
  const later = { ...mirrored, id: 'later', at: '2026-07-01T09:00:10.000Z', read: false };
  const initial = JSON.stringify({
    version: 1, groups: [existing], templates: [], filters: [], settings: { view: 'fixture' },
    skills: [], tasks: [], activity, notifications: [actual, mirrored, explicit, later],
  });
  const open = () => Object.assign(Object.create(LocalService.prototype), {
    file, queue: Promise.resolve(),
    engine: { profiles: new Map([
      ['one', { groupId: '7', group_name: 'Stale duplicate label' }],
      ['two', { groupId: 'missing', group_name: 'Recovered label' }],
      ['three', { groupId: 'missing', group_name: 'Do not add twice' }],
    ]) },
  });
  let replacements = 0, fail = true;
  try {
    await fs.writeFile(file, initial);
    fs.rename = async (source, target) => {
      if (target === file) {
        replacements++;
        if (fail) throw Object.assign(Error('project recovery disk fixture'), { code: 'EIO' });
      }
      return originalRename(source, target);
    };
    const first = open();
    const failed = await Promise.allSettled([first.load(), first.load()]);
    assert.equal(replacements, 1, 'concurrent startup readers share one recovery attempt');
    assert.ok(failed.every(result => result.status === 'rejected' && result.reason.code === 'EIO'));
    assert.equal(await fs.readFile(file, 'utf8'), initial, 'failed recovery leaves the prior file intact');
    assert.equal(first.data, undefined, 'failed recovery is not published');

    fail = false;
    await Promise.all([first.load(), first.load()]);
    assert.equal(replacements, 2, 'retry persists exactly one recovered snapshot');
    assert.deepEqual(first.data.groups, [existing, recovered],
      'legacy numeric ID and normalized profile group ID refer to the same project');
    const stored = (await readLocalStore(file)).data;
    assert.deepEqual(stored.groups, [existing, recovered]);
    assert.deepEqual(stored.activity, activity, 'migration preserves the original activity log');
    assert.deepEqual(stored.notifications, [actual, explicit, later],
      'migration removes only the historical duplicate and preserves genuine read flags');
    const reopened = open();
    await reopened.load();
    assert.deepEqual(reopened.data.groups, [existing, recovered], 'recovery is idempotent across fresh instances');
    assert.deepEqual(await reopened.request('settings:get'), { view: 'fixture' });
    assert.deepEqual(await reopened.request('notifications:list'), [later, explicit, actual]);
    assert.equal(replacements, 2, 'another startup does not rewrite the recovered file');
  } finally {
    fs.rename = originalRename;
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function main() {
  if (process.argv.includes('--profile-receipts-only')) {
    await checkProfileCommitReceipts();
    console.log('PASS profile commit receipts: transfer and project membership, SQLite and JSON, reopen');
    return;
  }
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
  await checkSavedFilterDeleteSort();
  await checkSettingsNoopWrites();
  await checkExchangeFileBom();
  await checkExchangeProjectAliases();
  await checkProfileCommitReceipts();
  await checkFullProfileListSingleSnapshot();
  await checkTemplateDeleteWrites();
  await checkProjectSortWrites();
  await checkProjectDeleteAmbiguity();
  await checkProjectNameSearch();
  await checkTextImportEncoding();
  await checkStartupProjectRecovery();

  // A large existing library must not exceed the JS argument-count limit when
  // creating a profile or reserving a batch of sequential display numbers.
  service.engine.profiles = new Map();
  for (let number = 1; number <= 200000; number++) {
    service.engine.profiles.set(String(number), { number });
  }
  service.engine.status = () => { throw Error('Number allocation must not build a status snapshot'); };
  let saved;
  service.engine.commitProfiles = async (profiles, { prepareReply }) => {
    saved = profiles;
    return prepareReply(profiles);
  };
  const created = await service.request('profiles:create', { windowName: 'large library' });
  assert.equal(created.sortNum, 200001);
  assert.equal(saved[0].number, 200001);
  const batch = await service.request('profiles:create-batch', { createCount: 3 });
  assert.deepEqual(batch.map(profile => profile.sortNum), [200001, 200002, 200003]);
  console.log('PASS local routes: validation, dispatch, launch isolation, rollback, notification/settings writes, collection projections and filter identity');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
