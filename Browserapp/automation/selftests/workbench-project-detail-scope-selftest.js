'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { parse } = require('acorn');
const vue = require('vue');
const { LocalService } = require('../../rebuild/local-service');
const { captureIpcResult } = require('../../shared/ipc-result');

const app = path.resolve(__dirname, '../..');
const wb = 'frontend/src/workbench/';
const read = name => fs.readFile(path.join(app, name), 'utf8');
const noop = () => {};
const tr = value => value;
const ids = rows => Array.from(rows ?? [], row => row.id);
const sourceFor = (source, node) => source.slice(node.start, node.end);
const tree = source => parse(source, { sourceType: 'module', ecmaVersion: 'latest' }).body;

function extract(source, names, body = tree(source)) {
  return names.map(name => {
    const node = body.map(item => item.declaration ?? item).find(item => item.id?.name === name || item.declarations?.[0]?.id.name === name);
    assert.ok(node, name);
    return sourceFor(source, node);
  }).join('\n');
}

async function loadExport(file, name, imports, globals = {}) {
  const source = await read(file);
  let code = source;
  for (const item of tree(source).reverse()) {
    let statement;
    if (item.type === 'ImportDeclaration') {
      statement = 'const { ' + item.specifiers.map(binding => `${binding.imported.name}:${binding.local.name}`).join(',') +
        ` } = imports[${JSON.stringify(item.source.value)}];`;
    } else if (item.type === 'ExportNamedDeclaration') {
      statement = item.declaration ? sourceFor(source, item.declaration) : '';
    }
    if (statement !== undefined) code = code.slice(0, item.start) + statement + code.slice(item.end);
  }
  return vm.runInNewContext(code + '\n' + name, { imports, $t: tr, ...globals }, { filename: file });
}

function fixtureService() {
  const data = [
    { id: 'a-1', name: 'Shared Alpha 1', groupId: 'A', number: 1 },
    { id: 'a-2', name: 'Shared Alpha 2', groupId: 'A', number: 2 },
    { id: 'b-1', name: 'Shared Beta', groupId: 'B', number: 3 },
    { id: 'default', name: 'Default', groupId: '', number: 4 },
    { id: 'opaque', name: 'Opaque', groupId: 'alpha,beta', number: 5 },
    { id: 'split-1', name: 'Split Alpha', groupId: 'alpha', number: 6 },
    { id: 'split-2', name: 'Split Beta', groupId: 'beta', number: 7 },
    { id: 'archived-a', name: 'Archived', groupId: 'A', number: 8, trashed: true },
    { id: 'legacy-numeric', name: 'Numeric', groupId: 7, number: 9 },
  ];
  const groups = ['A', 'B', 'alpha,beta', 'alpha', 'beta'].map(id => ({ id, projectName: id }));
  // Actual LocalService dispatcher, profile-index and query. The only mocked
  // data source is an immutable ordinary metadata snapshot; no lifecycle work.
  return Object.assign(Object.create(LocalService.prototype), {
    data: { groups, settings: {} },
    engine: { status: () => data, profiles: new Map(data.map(row => [row.id, row])) },
    queue: Promise.resolve(), load: async () => {},
  });
}

async function fixture() {
  const service = fixtureService();
  const workspace = { currentWorkspace: { id: 'local' } };
  const route = vue.reactive({ name: 'project-item', params: { id: 'A' }, query: {} });
  const requests = [], publications = [], selectedActions = [], errors = [];
  let invalidReply = false, latestRefresh;
  const bridge = vm.createContext({ createProfileLifecycleBridge: () => ({}), $t: tr,
    rebuild: { request: (method, payload) => captureIpcResult(() => {
      assert.equal(method, 'profiles:query', 'only local list reads may dispatch');
      requests.push(structuredClone(payload));
      if (invalidReply) return { rows: [{ id: 'a-1', projectId: 'A' }, { id: 'b-1', projectId: 'B' }], total: 2 };
      return service.request(method, structuredClone(payload));
    }) } });
  vm.runInContext((await read('rebuild/renderer-bridge.js')).replace(/^import\s+[\s\S]*?;$/gm, ''), bridge);
  const tableModule = await import('../../rebuild/workbench-table.mjs');
  const useCache = await loadExport(wb + 'shared/workbench-list-cache.mjs', 'useListCache', {
    './workbench-vue.js': vue, './agent-BmSFI9WH.js': { i: (_key, setup) => setup },
    './workbench-local-workspace.js': { useWorkspace: () => workspace }, './workbench-table.js': tableModule,
  });
  const cache = useCache();
  const fields = await read(wb + 'shared/workbench-fields.mjs');
  const { readFields, filterValues } = vm.runInNewContext(extract(fields, ['missing', 'validateField', 'readFields', 'filterValues']) +
    '\n({readFields,filterValues})');
  const menu = vue.ref([]);
  const ops = await read(wb + 'profiles/operations/profile-operations.mjs');
  const adapters = vm.runInNewContext(extract(ops, ['useProfileTableRows', 'parseAutoOpen']) + '\nuseProfileTableRows', {
    ...tableModule, ref: vue.ref, watch: vue.watch, useRoute: () => route,
    useRouter: () => ({ replace() { assert.fail('automatic navigation is not part of this fixture'); } }),
    useWorkspace: () => workspace, useAutoOpen: () => ({}),
    filterParams: filterValues, readFilters: readFields, isEmpty: obj => !Object.keys(obj).length,
    api: bridge.__localApi, events: { emit: (_event, rows) => publications.push(ids(rows)) }, $t: tr,
  })({
    filtersMenu: menu, getCurrentFilterParams: () => ({}),
    tableRef: { value: { refresh: (...args) => { latestRefresh = table.refresh(...args); } } },
  });

  // Extract the exact cache gate, metadata and menu adapter used by ProfileTable
  // without invoking its unrelated form, proxy, or lifecycle operations.
  const profileTable = await read(wb + 'profiles/use-profile-table.mjs');
  const profileHook = tree(profileTable).find(item => item.declaration?.id?.name === 'useProfileTable').declaration;
  const profile = vm.runInNewContext(extract(profileTable, ['cacheScope', 'lr', 'ur', 'pr', 'restoreCache', 'hr', 'cacheMetadata', 'vr', '$'], profileHook.body.body) +
    '\n({cacheScope, restoreCache, cacheMetadata, vr, activate: $})', {
    ...tableModule, g2: route, props: { get isProjectProfile() { return route.name === 'project-item'; } },
    rn: workspace, an: cache, _: { BROWSER_LIST: 'browser-list' }, profileActivation: 0, filters: menu, Vn2: vue.ref(false),
    tableRef: { value: { restoreFromCache: () => table.restoreFromCache() } },
    e: (value, fallback) => value ? JSON.parse(value) : fallback,
    refresh: adapters.onRefreshTable, sr: adapters.syncFromCacheEntry,
    on2: (list, scope) => cache.invalidate(list, 'local', scope),
    Mt: async () => [
      { name: 'projectIds', value: [{ value: 'B', label: 'B' }], formatValue: entry => entry.value.map(choice => choice.value) },
      { name: 'queryValue', value: 'Shared' },
    ],
  });
  let beforeMount;
  const useBrowserTable = await loadExport(wb + 'shared/tables/use-browser-table.mjs', 'useBrowserTable', {
    './workbench-vue.js': { ...vue, onMounted: noop, onBeforeMount: load => { beforeMount = load; }, onBeforeUnmount: noop },
    './utils-BIWenCnY.js': { bt: () => cache, mt: () => workspace, o: () => ({}) },
    './rich-html-link-VdBpR3Cm.js': { y: () => route },
    './workbench-table.js': tableModule, './workbench-table-actions.js': { permittedActions: value => value },
    './workbench-table-context.js': { useTableContextMenu: () => [noop] },
  }, { localStorage: { getItem: () => null }, __localUiError: message => errors.push(message) });
  const table = useBrowserTable({
    cacheKey: 'browser-list', listCacheKey: 'browser-list', listCacheScope: profile.cacheScope,
    listCacheMeta: profile.cacheMetadata, listCacheShouldRestore: profile.restoreCache,
    dataKey: 'id', pageRows: 10, clearSelectionOnRequest: true, selectionMode: 'multiple',
    tableSort: () => ({ data: { sortField: 'windowSortNum', sortOrder: 1 } }), tableFilters: () => [],
    operationHandler: (_action, rows) => selectedActions.push(ids(rows)),
    tableRequest: adapters.tableRequest,
  }, vue.ref([]), {}, vue.ref(), vue.ref());
  return { service, route, table, profile, adapters, requests, publications, selectedActions, errors, menu,
    poisonReply: () => { invalidReply = true; },
    start: () => beforeMount(),
    waitForRefresh: () => latestRefresh,
    cached: () => cache.get('browser-list', 'local', profile.cacheScope()),
    injectCache: value => cache.set('browser-list', 'local', profile.cacheScope(), {
      outerParams: {}, paginator: { first: 0, rows: 10 }, total: value.rows.length, ...value,
    }),
    restore: () => profile.restoreCache() && table.restoreFromCache(),
  };
}

test('Project A ignores conflicting incoming aliases and publishes/selects only A', async () => {
  const f = await fixture();
  await f.start();
  await f.table.load();
  assert.deepEqual(ids(f.table.rows.value), ['a-1', 'a-2']);
  await f.table.refresh({ scopeProjectId: 'B', projectId: 'B', projectIds: ['B'], queryKey: 'name', queryValue: 'Shared' });
  assert.deepEqual(ids(f.table.rows.value), ['a-1', 'a-2']);
  assert.deepEqual(f.publications.at(-1), ['a-1', 'a-2']);
  for (const key of ['projectId', 'projectIds']) assert.equal(Object.hasOwn(f.requests.at(-1), key), false);
  assert.equal(f.requests.at(-1).scopeProjectId, 'A');
  f.table.selection.value = [f.table.rows.value[0]];
  await f.table.batchOperation({ name: 'inert only' });
  assert.deepEqual(f.selectedActions, [['a-1']]);
  assert.equal(f.cached().meta.scopeProjectId, 'A');
  assert.deepEqual(ids(f.cached().rows), ['a-1', 'a-2']);

  await f.profile.vr();
  assert.deepEqual(Array.from(f.menu.value, field => field.name), ['queryValue']);
  f.adapters.onRefreshTable({ scopeProjectId: 'B', projectIds: ['B'], queryKey: 'name' }, false);
  await f.waitForRefresh();
  assert.deepEqual(JSON.parse(JSON.stringify(f.cached().outerParams)), { queryKey: 'name', queryValue: 'Shared' });
  f.route.name = 'browser-list';
  f.route.params.id = 'A'; // an unrelated route param cannot assert a Project scope
  await f.profile.vr();
  assert.deepEqual(Array.from(f.menu.value, field => field.name), ['projectIds', 'queryValue']);
  assert.deepEqual(ids((await f.adapters.tableRequest({ projectIds: 'A,B', scopeProjectId: 'B' })).data.rows),
    ['a-1', 'a-2', 'b-1']);
  assert.equal(Object.hasOwn(f.requests.at(-1), 'scopeProjectId'), false);
});

test('exact scope matches opaque/default IDs and intersects non-project filters before pagination', async () => {
  const service = fixtureService();
  const query = params => service.request('profiles:query', params);
  assert.deepEqual(ids((await query({ scopeProjectId: 'alpha,beta' })).rows), ['opaque']);
  assert.deepEqual(ids((await query({ projectIds: 'alpha,beta' })).rows), ['split-1', 'split-2'], 'old CSV union is unchanged');
  assert.deepEqual(ids((await query({ scopeProjectId: 'local-default' })).rows), ['default']);
  assert.deepEqual(ids((await query({ scopeProjectId: '7' })).rows), ['legacy-numeric']);
  assert.deepEqual(ids((await query({ scopeProjectId: 'A', projectIds: 'B' })).rows), [], 'scope can only narrow a direct query');
  for (const scope of ['', null, ['A'], 7]) {
    await assert.rejects(query({ scopeProjectId: scope }), /项目范围|project scope/i);
  }
  const page = await query({ scopeProjectId: 'A', queryKey: 'name', queryValue: 'Shared',
    page_index: 2, page_size: 1, orderName: 'windowSortNum', orderType: 'asc' });
  assert.deepEqual(ids(page.rows), ['a-2']);
  assert.equal(page.total, 2);

  const f = await fixture();
  f.route.params.id = 'alpha,beta';
  await f.start();
  await f.table.load();
  assert.deepEqual(ids(f.table.rows.value), ['opaque']);
  f.route.params.id = 'local-default';
  await f.table.refresh({});
  assert.deepEqual(ids(f.table.rows.value), ['default']);
  f.route.params.id = '7';
  await f.table.refresh({});
  assert.deepEqual(ids(f.table.rows.value), ['legacy-numeric']);
  const before = f.requests.length;
  f.route.params.id = undefined;
  await f.table.refresh({});
  assert.equal(f.requests.length, before, 'an invalid detail route must not read global data');
  assert.equal(f.errors.length, 1);
});

test('bad detail cache cannot become selectable; healthy A cache restores without an IPC read', async () => {
  const f = await fixture();
  const safe = { id: 'a-1', projectId: 'A' };
  f.injectCache({ rows: [{ id: 'b-1', projectId: 'B' }], meta: { scopeProjectId: 'A' } });
  assert.equal(f.profile.restoreCache(), false);
  assert.equal(f.cached(), null, 'discard an out-of-scope entry');
  f.injectCache({ rows: [], meta: {} });
  assert.equal(f.profile.restoreCache(), false, 'unqualified old empty cache is not proof of a genuinely empty project');
  f.injectCache({ rows: [safe], outerParams: { projectId: 'B' }, meta: { scopeProjectId: 'A' } });
  assert.equal(f.profile.restoreCache(), false);
  f.injectCache({ rows: [safe], meta: { scopeProjectId: 'A', filtersMenu: [{ name: 'projectIds' }] } });
  assert.equal(f.profile.restoreCache(), false);
  f.injectCache({ rows: [safe], meta: { scopeProjectId: 'A', filtersMenu: [null] } });
  assert.equal(f.profile.restoreCache(), false);
  f.injectCache({ rows: [safe], meta: { scopeProjectId: 'A' } });
  assert.ok(f.restore());
  assert.deepEqual(ids(f.table.rows.value), ['a-1']);
  assert.equal(f.requests.length, 0);

  f.poisonReply();
  await f.start();
  const events = f.publications.length;
  await f.table.load();
  assert.deepEqual(ids(f.table.rows.value), ['a-1'], 'an out-of-scope response cannot replace last good rows');
  assert.equal(f.publications.length, events);
  assert.equal(f.errors.length, 1);
});

test('opening a detail with a bad cache refetches the scoped rows using the actual activation path', async () => {
  const f = await fixture();
  f.route.query.customFilterParams = JSON.stringify({ scopeProjectId: 'B', projectIds: ['B'], queryKey: 'name' });
  f.injectCache({ rows: [{ id: 'b-1', projectId: 'B' }], meta: { scopeProjectId: 'A' } });
  await f.start();
  assert.deepEqual(ids(f.table.rows.value), []);
  assert.equal(f.cached(), null);
  await f.profile.activate();
  await f.waitForRefresh();
  assert.deepEqual(ids(f.table.rows.value), ['a-1', 'a-2']);
  assert.deepEqual(f.publications, [['a-1', 'a-2']]);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].scopeProjectId, 'A');
  assert.equal(f.requests[0].queryValue, 'Shared');
  assert.equal(f.profile.restoreCache(), true, 'the exact replacement cache can be reactivated later');
});
