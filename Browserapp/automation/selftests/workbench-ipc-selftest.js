'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { setImmediate: tick } = require('node:timers/promises');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { captureIpcResult, unwrapIpcResult } = require('../../shared/ipc-result');

async function rendererFixture(relative, modules, globals = {}, exportName) {
  const { parse } = require('acorn');
  const filename = path.resolve(__dirname, '../../', relative);
  const source = await fs.readFile(filename, 'utf8');
  const { compileWorkbenchComponent } = require('../../frontend/compile-workbench-component.cjs');
  const code = filename.endsWith('.vue') ? compileWorkbenchComponent({ filename, source }).code : source;
  let program = code;
  for (const entry of parse(code, { sourceType: 'module', ecmaVersion: 'latest' }).body.reverse()) {
    const replacement = entry.type === 'ImportDeclaration'
      ? 'const { ' + entry.specifiers.map(({ imported, local }) => `${imported?.name ?? 'default'}: ${local.name}`).join(', ') +
        ' } = modules[' + JSON.stringify(entry.source.value) + '];'
      : entry.type === 'ExportDefaultDeclaration' ? '__workbenchComponent;'
      : exportName && entry.type === 'ExportNamedDeclaration'
        ? entry.declaration ? code.slice(entry.declaration.start, entry.end) : '' : null;
    if (replacement !== null) program = program.slice(0, entry.start) + replacement + program.slice(entry.end);
  }
  if (exportName) program += '\n' + exportName;
  return vm.runInNewContext(program, { modules, $t: message => message, ...globals }, { filename });
}

// Render the actual workbench page and exercise its table/toolbar callbacks.
// The host, network and other UI widgets stay inert.
async function listPageFixture(relative, tableRef, overrides, globals = {}) {
  const vue = require('vue'), noop = () => {}, widget = {}, cleanup = [];
  const modules = {
    './workbench-vue.js': { ...vue, useTemplateRef: () => tableRef, resolveComponent: () => widget,
      onBeforeMount: noop, onMounted: noop, onBeforeUnmount: fn => cleanup.push(fn) },
    './agent-BmSFI9WH.js': { a: value => value, n: () => [noop, noop] },
    './ry-table-do6kugym.js': { t: widget }, './views-header-CcjwXPjG.js': { t: widget },
    './rx-button-DyzuUt-V.js': { t: widget }, './useconfirm-CV4GTWBW.js': { n: () => ({}) },
    ...overrides,
  };
  const component = await rendererFixture(relative, new Proxy(modules, { get: (all, key) => all[key] ?? {} }), globals);
  const render = component.setup({}, { expose: noop }), cache = [];
  return {
    table: () => render({ $t: value => value, $route: { meta: {} } }, cache).children[1].children[0],
    unmount: () => cleanup.forEach(fn => fn()),
  };
}

async function accountPageChecks() {
  const vue = require('vue');
  const { createTableLoader } = await import('../../rebuild/workbench-table.mjs');
  const displayed = vue.ref([]), table = vue.shallowRef({ getDataList: () => displayed.value });
  const reads = [], lookups = [], exports = [], credential = Promise.withResolvers();
  const defer = (queue, params) => {
    const hold = Promise.withResolvers();
    queue.push({ params, finish: rows => hold.resolve({ code: 0, data: { rows, total: rows.length } }) });
    return hold.promise;
  };
  const page = await listPageFixture('frontend/src/workbench/accounts/AccountsWorkbench.vue', table, {
    './utils-BIWenCnY.js': { h: { platform: { userGetPlatformInfoV2List: p => defer(reads, p) },
      window: { userGetWindowInfoListList: p => defer(lookups, p) } }, nn: () => ({ check: () => true }),
      qt: { Firefox: 'Firefox' }, rn: {}, at: () => ({ isViewer: vue.ref(false) }), v: () => ({}), mt: () => ({}), yt: () => ({}) },
    './rich-html-link-VdBpR3Cm.js': { b: () => ({}) }, './simplePopup-D6H7ykCr.js': { t: () => ({}) },
    './useProxyFormDrawer-r-7UykRS.js': { o: () => ({}) }, './quick-CZrtqSCy.js': { a: () => [], s: {}, r: () => ({ columns: vue.ref([]) }) },
    './useProfileEntityLabels-BfqbVpel.js': { n: () => vue.ref({}) }, './useProfileOpenState-GCrr7PDa.js': { i: () => ({}) },
    './usedialog-Dh0xp3r7.js': { n: () => ({ open: (_component, dialog) => exports.push(Array.from(dialog.data.props.ids)) }) },
  }, { __localRequest: () => credential.promise });
  let search = 'old';
  const loader = createTableLoader({ params: () => ({ page_index: 1, page_size: 10, queryValue: search }), wait() {},
    read: (params, current) => page.table().props['table-request'](params, current),
    apply: ({ rows }) => { displayed.value = rows; }, busy() {}, failed: error => { throw error; }, paginate: () => false });
  const clickExport = () => page.table().children['display-before']()[0].props.onClick({ stopPropagation() {} });
  const select = rows => page.table().props['onUpdate:selection'](rows);
  const account = (id, profile) => ({ id, boundProfileIds: profile ? [profile] : [] });
  const start = loader.load();
  await tick();
  search = 'current';
  const latest = loader.load();
  await tick();
  reads[1].finish([account('b', 'b-profile'), account('c')]);
  await latest;
  clickExport();
  reads[0].finish([account('a', 'a-profile')]);
  await start;
  clickExport();
  assert.deepEqual(exports, [['b', 'c'], ['b', 'c']], 'a late list response cannot change the export dialog IDs');
  assert.deepEqual(lookups.map(({ params }) => Array.from(params.dirIds)), [['b-profile']],
    'a dropped list response must not even start loading related windows');
  select([account('a'), account('c')]);
  clickExport();
  assert.deepEqual(exports.at(-1), ['c'], 'explicit selection is intersected with the displayed rows');
  select([account('a')]);
  clickExport();
  assert.equal(exports.length, 3, 'only stale IDs selected must not fall back to exporting the whole page');
  select([]);

  const oldRow = displayed.value[0], column = { visible: {} };
  const reveal = page.table().children.password({ data: oldRow, column: { _cache: column } })[0].props.onToggleMasked();
  // A cache restore can change the accepted rows without another account request.
  loader.invalidate();
  displayed.value = [account('b', 'new-binding')];
  lookups[1].finish([{ dirId: 'new-binding', coreType: 'Firefox' }]);
  await tick();
  lookups[0].finish([{ dirId: 'b-profile', coreType: 'Chrome' }]);
  credential.resolve({ rows: [{ platformPassword: 'fixture-only' }] });
  await reveal;
  await tick();
  const actions = page.table().props['table-operation'](displayed.value[0]);
  assert.equal(actions[0].icon, 'base/rx_ic_firefox', 'an older binding lookup cannot replace the displayed association');
  assert.equal(column.visible.b, undefined, 'a late credential read cannot reveal the newly displayed row');
  assert.equal(oldRow.platformPassword, undefined, 'a stale read must not merge into a prior cached page either');
  clickExport();
  assert.deepEqual(exports.at(-1), ['b']);
  page.unmount();
  loader.dispose();
}

async function projectListPageChecks() {
  const vue = require('vue');
  const { LocalService } = require('../../rebuild/local-service');
  const tableModule = await import('../../rebuild/workbench-table.mjs');
  const workspace = { currentWorkspace: { id: 'local' } }, route = { query: {} };
  const useCache = await rendererFixture('frontend/src/workbench/shared/workbench-list-cache.mjs', {
    './workbench-vue.js': vue, './agent-BmSFI9WH.js': { i: (_name, setup) => setup },
    './workbench-local-workspace.js': { useWorkspace: () => workspace }, './workbench-table.js': tableModule,
  }, {}, 'useListCache');
  const cache = useCache(), engine = {};
  const groups = ['A', 'B', 'C', 'D'].map(id => ({ id, projectName: id, pinStatus: id === 'B' ? 1 : 0 }));
  const activeByProject = new Map([['', [1]], ['C', [1, 2]]]);
  const service = Object.assign(Object.create(LocalService.prototype), {
    data: { groups, settings: {} }, queue: Promise.resolve(), load: async () => {}, save: async () => {}, engine,
    profileIndex: () => ({ activeByProject }),
  });
  const bridgeFile = path.resolve(__dirname, '../../rebuild/renderer-bridge.js');
  const code = (await fs.readFile(bridgeFile, 'utf8')).replace(/^import\s+[\s\S]*?;$/gm, '');
  let delaySort, delayRead;
  const reads = [];
  const renderer = vm.createContext({
    ...tableModule, currentScope: () => null, createProfileLifecycleBridge: () => ({ handle() {} }),
    rebuild: {
      onEvent: listener => { engine.emit = listener; },
      request: async (method, p) => {
        const result = await captureIpcResult(() => service.request(method, structuredClone(p)));
        if (method === 'groups:sort' && delaySort) await delaySort.promise;
        if (method === 'groups:query') {
          reads.push(p.page_index);
          const held = delayRead;
          delayRead = null;
          await held?.promise;
        }
        return result;
      },
    },
  });
  vm.runInContext(code, renderer, { filename: bridgeFile });
  const api = renderer.__localApi, table = vue.shallowRef(), ids = rows => Array.from(rows, row => row.project_id);
  const page = await listPageFixture('frontend/src/workbench/projects/ProjectsWorkbench.vue', table, {
    './utils-BIWenCnY.js': { h: api, nn: () => ({}), mt: () => ({}), v: () => ({}),
      vt: { PROJECT_LIST: 'project-list' }, yt: () => ({ invalidateCache() {} }) },
    './project-zUGx3yhI.js': {},
    './useProject-BHb2F7tC.js': { t: () => [] }, './useDialog-BC-nc8J-.js': { t: () => [] },
    './usePopupMenu-BRw1zJ0m.js': { t: () => ({}) },
  });
  let beforeMount, beforeUnmount;
  const useTable = await rendererFixture('frontend/src/workbench/shared/tables/use-browser-table.mjs', {
    './workbench-vue.js': { ...vue, onMounted() {}, onBeforeMount: fn => { beforeMount = fn; },
      onBeforeUnmount: fn => { beforeUnmount = fn; } },
    './utils-BIWenCnY.js': { bt: () => cache, mt: () => workspace, o: () => ({}) },
    './rich-html-link-VdBpR3Cm.js': { y: () => route }, './workbench-table.js': tableModule,
    './workbench-table-actions.js': {}, './workbench-table-context.js': { useTableContextMenu: () => [] },
  }, { localStorage: { getItem: () => null }, HTMLElement: class {}, electronAPI: renderer.electronAPI }, 'useBrowserTable');
  const published = [];
  async function mount() {
    const effects = vue.effectScope();
    const view = effects.run(() => useTable({
      dataKey: 'project_id', cacheKey: 'project-list', listCacheKey: 'project-list', clearSelectionOnRequest: true,
      immediate: true, pageRows: 2, tableSort: () => ({}), tableFilters: () => [],
      tableRequest: params => page.table().props['table-request'](params),
    }, vue.ref([]), {}, vue.ref(), vue.ref()));
    table.value = { getParams: view.getParams, refresh: view.refresh };
    effects.run(() => vue.watch(view.rows, rows => published.push(Array.from(rows ?? [], row => row.projectName)), { flush: 'sync' }));
    await beforeMount();
    return { view, unmount() { beforeUnmount(); effects.stop(); } };
  }
  let mounted = await mount();
  const visible = () => mounted.view.rows.value;
  const load = async number => {
    mounted.view.page.first = (number - 1) * 2;
    await mounted.view.load();
    assert.equal(mounted.view.page.total, 5, 'total includes the default exactly once regardless of page');
    return ids(visible());
  };
  const reorder = () => page.table().props.onRowReorder({ value: visible().slice().reverse() });
  assert.deepEqual(ids(visible()), ['local-default', 'A']);
  assert.equal(visible()[0].windowCount, 1);
  await reorder();
  assert.equal(reads.length, 1, 'dragging only the built-in row is a no-op');
  assert.deepEqual(ids(visible()), ['local-default', 'A'], 'the fixed default project cannot move in the displayed first page');
  assert.deepEqual(await load(2), ['B', 'C']);
  assert.equal(visible()[1].windowCount, 2);
  delaySort = Promise.withResolvers();
  const saving = reorder();
  await tick();
  assert.deepEqual(ids(visible()), ['C', 'B'], 'the committed event refreshes before a delayed write acknowledgement');
  assert.deepEqual(await load(3), ['D']);
  const readsBeforeAck = reads.length;
  delaySort.resolve();
  await saving;
  assert.equal(reads.length, readsBeforeAck, 'the same commit must not reload the table twice');
  assert.deepEqual(ids(visible()), ['D'], 'reorder acknowledgement must not overwrite a newly displayed page');
  assert.deepEqual(await load(4), ['D'], 'the displayed page clamps after a shrink or invalid page request');
  assert.deepEqual(ids((await api.limit.userGetProjectInfoByWorkspaceList({ default: 2, page_index: 4, page_size: 2 })).data.rows), []);
  assert.deepEqual(ids((await api.limit.userGetProjectInfoByWorkspaceList({ default: 2 })).data.rows),
    ['local-default', 'A', 'C', 'B', 'D'], 'selection widgets get every project; only slots from the reordered page moved');
  assert.deepEqual(ids((await api.limit.userGetTopProjectInfoList()).data.rows), ['B'], 'pinned sidebar remains unpaginated');
  await assert.rejects(api.limit.userGetProjectInfoByWorkspaceList({ page_size: -1 }), /分页/);

  const afterPage = reads.length;
  for (const event of [{ type: 'profiles', action: 'label-metadata' }, { type: 'profiles', action: 'trash', ids: [] },
    { type: 'profile-start-progress', lifecycle: { pending: false } }, { type: 'status', action: 'not-a-persisted-write' }]) engine.emit(event);
  await tick();
  assert.equal(reads.length, afterPage, 'labels, empty removals, and lifecycle status do not affect the project list');
  const heldRead = delayRead = Promise.withResolvers();
  await service.request('groups:save', { id: 'D', projectName: 'Snapshot to discard' });
  await tick();
  assert.equal(reads.length, afterPage + 1);
  assert.equal(cache.get('project-list', 'local', {}), null);
  await service.request('groups:save', { id: 'D', projectName: 'Authoritative name' });
  activeByProject.set('D', [1, 2, 3]);
  engine.emit({ type: 'status', action: 'profiles-update' });
  engine.emit({ type: 'profiles', action: 'restore', ids: ['restored'] });
  assert.equal(reads.length, afterPage + 1, 'events received during an old read request only one follow-up');
  heldRead.resolve();
  await tick();
  assert.equal(reads.length, afterPage + 2);
  assert.equal(mounted.view.page.first, 4, 'background project changes do not reset the displayed page');
  assert.deepEqual([visible()[0].projectName, visible()[0].windowCount], ['Authoritative name', 3]);
  assert.equal(published.flat().includes('Snapshot to discard'), false, 'a superseded response never displays or enters the cache');

  mounted.unmount();
  const beforeRemount = reads.length;
  await service.request('groups:save', { id: 'A', projectName: 'Changed while away' });
  activeByProject.set('A', [1, 2]);
  engine.emit({ type: 'profiles', action: 'restore', ids: ['restored-while-away'] });
  assert.equal(cache.get('project-list', 'local', {}), null);
  mounted = await mount();
  assert.equal(reads.length, beforeRemount + 1, 'a project event invalidates even inactive cached views');
  assert.deepEqual([visible()[1].projectName, visible()[1].windowCount], ['Changed while away', 2]);
  mounted.unmount();
  page.unmount();
}

async function tableChecks() {
  const { buildTableQuery, createTableLoader, isProfileTable } = await import('../../rebuild/workbench-table.mjs');
  assert.equal(isProfileTable('browser-list'), true);
  assert.equal(isProfileTable('browser-recycle-list'), true);
  assert.equal(isProfileTable('account-list'), false);
  const page = { first: 11, pageSize: 10 };
  assert.deepEqual(buildTableQuery(page), { page_index: 3, page_size: 10 }, 'preserve legacy page rounding');
  const layers = {
    ...page, filters: { page_index: 5, search: 'filter', tag: 'kept' },
    tableParams: { page_size: 15, search: 'table' },
    runtimeParams: { page_size: 20, search: 'runtime', orderName: 'default', orderType: 'asc' },
  };
  const merged = { page_index: 5, page_size: 20, search: 'runtime', tag: 'kept', orderName: 'default', orderType: 'asc' };
  assert.deepEqual(buildTableQuery(layers), merged, 'explicit params override table params, filters and pagination');
  assert.deepEqual(buildTableQuery({ ...layers, sortField: 'title', sortOrder: -1 }),
    { ...merged, orderName: 'title', orderType: 'desc' });
  assert.deepEqual(buildTableQuery({ ...layers, sortField: 'title', sortOrder: 0 }),
    { ...merged, orderName: 'title' }, 'compact table keeps the field and explicit direction when the sort order is zero');
  assert.deepEqual(buildTableQuery({ ...layers, sortField: false, sortOrder: 0 }),
    merged, 'browser table does not override explicit sort params when sort order is zero');
  assert.deepEqual(buildTableQuery({ ...page, sortField: 'title', sortOrder: 'desc' }),
    { page_index: 3, page_size: 10, orderName: 'title', orderType: -1 }, 'preserve string-to-number sort conversion');
  const reads = [], applied = [], errors = [], loading = [];
  let query = { page_index: 1, page_size: 5, queryValue: 'old' };
  const table = createTableLoader({
    params: () => query, wait: () => {},
    read: params => new Promise((resolve, reject) => reads.push({ params, resolve, reject })),
    apply: (data, options) => applied.push({ data, options }),
    busy: value => loading.push(value), failed: error => errors.push(error.message), paginate: () => true,
  });
  const old = table.load();
  await tick();
  query = { ...query, queryValue: 'new' };
  const current = table.load();
  await tick();
  reads[1].resolve({ code: 0, data: { total: 1, rows: [{ id: 'new' }] } });
  await current;
  reads[0].reject(Error('obsolete failure'));
  await old;
  assert.equal(applied[0].data.rows[0].id, 'new');
  assert.deepEqual(errors, []);
  assert.equal(loading.at(-1), false);

  const failed = table.load();
  await tick();
  reads[2].resolve({ code: 'STORE_ERROR', msg: 'current failure' });
  await failed;
  assert.deepEqual(errors, ['current failure']);
  assert.equal(applied.length, 1, 'a failed refresh must preserve the last successful rows');

  query = { page_index: 3, page_size: 5, queryValue: 'new' };
  const refresh = table.refresh();
  assert.equal(table.refresh(), refresh);
  await tick();
  reads[3].resolve({ total: 6, rows: [] });
  await tick();
  assert.deepEqual(reads[4].params, { ...query, page_index: 2 });
  reads[4].resolve({ total: 6, rows: [{ id: 'last-visible' }] });
  await refresh;
  assert.deepEqual(applied[1].options, { background: true, first: 5 });
  assert.equal(reads.length, 5);

  query = { page_index: 1, page_size: 5, queryValue: 'manual filter' };
  const foreground = table.load();
  await tick();
  const changeRefresh = table.refresh();
  await tick();
  const [foregroundRead, changeRead] = reads.slice(-2);
  assert.deepEqual(changeRead.params, query);
  changeRead.resolve({ total: 1, rows: [{ id: 'manual-filter-match' }] });
  await changeRefresh;
  foregroundRead.resolve({ total: 1, rows: [{ id: 'late-foreground' }] });
  await foreground;
  assert.equal(applied.at(-1).data.rows[0].id, 'manual-filter-match');
  assert.equal(applied.at(-1).options.background, false,
    'a profile-change refresh must not change a pending filter load into selection-preserving background work');

  const background = table.refresh();
  await tick();
  reads.at(-1).resolve({ total: 1, rows: [{ id: 'ordinary-background' }] });
  await background;
  assert.equal(applied.at(-1).options.background, true, 'unrelated background refreshes still retain selection');

  const closing = table.load();
  await tick();
  table.dispose();
  reads.at(-1).reject(Error('closed view'));
  await closing;
  assert.deepEqual(errors, ['current failure']);
}

async function projectTableScopeChecks() {
  const vue = require('vue');
  const { LocalService } = require('../../rebuild/local-service');
  const tableModule = await import('../../rebuild/workbench-table.mjs');
  const workspace = { currentWorkspace: { id: 'local' } };
  const useCache = await rendererFixture('frontend/src/workbench/shared/workbench-list-cache.mjs', {
    './workbench-vue.js': vue, './agent-BmSFI9WH.js': { i: (_name, setup) => setup },
    './workbench-local-workspace.js': { useWorkspace: () => workspace }, './workbench-table.js': tableModule,
  }, {}, 'useListCache');
  const cache = useCache(), route = vue.reactive({ name: 'project-item', params: { id: 'A' }, query: {} });
  const entries = [
    { id: 'a1', name: 'A1', number: 2, groupId: 'A' }, { id: 'a2', name: 'A2', number: 1, groupId: 'A' },
    { id: 'b1', name: 'B1', number: 4, groupId: 'B' }, { id: 'b2', name: 'B2', number: 3, groupId: 'B' },
  ];
  const service = Object.create(LocalService.prototype);
  Object.assign(service, {
    queue: Promise.resolve(), data: { groups: [], labels: [] }, load: async () => {},
    engine: { status: () => entries, profiles: new Map(entries.map(row => [row.id, row])) },
  });
  const requests = [], errors = [], controlled = [], publications = [], actions = [];
  const rowsFilename = path.resolve(__dirname, '../../frontend/src/workbench/profiles/operations/profile-operations.mjs');
  const rowsSource = await fs.readFile(rowsFilename, 'utf8');
  const { parse } = require('acorn');
  const rowsFunction = parse(rowsSource, { sourceType: 'module', ecmaVersion: 'latest' }).body
    .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'useProfileTableRows');
  assert.ok(rowsFunction);
  const profileRows = vm.runInNewContext(rowsSource.slice(rowsFunction.start, rowsFunction.end) + '\nuseProfileTableRows', {
    ...tableModule,
    ref: vue.ref, watch: vue.watch, useRoute: () => route, useRouter: () => ({}), useWorkspace: () => workspace,
    useAutoOpen: () => ({}), parseAutoOpen: () => null, filterParams: () => ({}), readFilters: () => ({}),
    isEmpty: value => !Object.keys(value).length,
    events: { emit: (_event, rows) => publications.push(rows) }, $t: key => key,
    api: { window: { userGetWindowInfoListList(params) {
      const result = service.request('profiles:query', params).then(data => ({ code: 0, data }));
      return new Promise((resolve, reject) => requests.push({ params, resolve: () => resolve(result), reject }));
    } } },
  }, { filename: rowsFilename })({ filtersMenu: vue.ref([]) });
  let init, notifyProfilesChanged, openedMenu;
  const useBrowserTable = await rendererFixture('frontend/src/workbench/shared/tables/use-browser-table.mjs', {
    './workbench-vue.js': { ...vue, onMounted() {}, onBeforeMount: hook => { init = hook; }, onBeforeUnmount() {} },
    './utils-BIWenCnY.js': { bt: () => cache, mt: () => workspace, o: () => ({}) },
    './rich-html-link-VdBpR3Cm.js': { y: () => route },
    './workbench-table.js': tableModule, './workbench-table-actions.js': { permittedActions: value => value },
    './workbench-table-context.js': { useTableContextMenu: () => [(_event, options) => { openedMenu = options; }] },
  }, {
    localStorage: { getItem: () => null }, __localUiError: message => errors.push(message),
    electronAPI: { on(_name, listener) { notifyProfilesChanged = listener; } },
  }, 'useBrowserTable');
  const attrs = vue.reactive({ selection: undefined, 'onUpdate:selection': value => controlled.push(value) });
  const state = useBrowserTable({
    cacheKey: 'browser-list', listCacheKey: 'browser-list', listCacheScope: () => ({ projectId: route.params.id }),
    listCacheMeta: () => ({ scopeProjectId: route.params.id }),
    dataKey: 'id', pageRows: 1, clearSelectionOnRequest: true, selectionMode: 'multiple',
    tableSort: () => ({ data: { sortField: 'windowSortNum', sortOrder: 1 } }), tableFilters: () => [],
    operationHandler: (_action, row) => actions.push(row),
    tableRequest(query, current = () => true) {
      const result = profileRows.tableRequest(query, current);
      requests.at(-1).current = current;
      return result;
    },
  }, vue.ref([]), attrs, vue.ref(), vue.ref());
  const ids = rows => Array.from(rows ?? [], row => row.id);
  const visible = () => ids(state.rows.value);
  const cached = projectId => cache.get('browser-list', 'local', { projectId });
  const move = projectId => { route.params.id = projectId; };
  function restore() {
    const saved = state.restoreFromCache();
    if (saved) profileRows.syncFromCacheEntry(saved);
    return saved;
  }
  async function read(load = state.load) {
    const before = requests.length;
    const done = load();
    await tick();
    assert.equal(requests.length, before + 1);
    return { ...requests.at(-1), done };
  }
  await init();
  const a = await read();
  a.resolve();
  await a.done;
  assert.deepEqual(visible(), ['a2']);
  state.page.first = 1;
  const aPage = await read();
  aPage.resolve();
  await aPage.done;
  assert.deepEqual(visible(), ['a1']);
  assert.deepEqual(structuredClone(aPage.params), {
    page_index: 2, page_size: 1, orderName: 'windowSortNum', orderType: 'asc', scopeProjectId: 'A', isDelete: 0,
  });

  move('B');
  const staleB = await read();
  assert.equal(state.loaded.value, false, 'a cold project cannot show a successful empty state while its read is pending');
  move('A');
  const beforeRestore = requests.length;
  assert.deepEqual(ids(restore().rows), ['a1']);
  assert.equal(state.loaded.value, true);
  await tick();
  assert.equal(requests.length, beforeRestore, 'a valid cached page needs no network read');
  const beforeLate = publications.length;
  staleB.resolve();
  await staleB.done;
  assert.deepEqual(visible(), ['a1'], 'cached A activation must outrank a late read from B');
  assert.equal(publications.length, beforeLate, 'obsolete rows must not publish via the profile table adapter');
  assert.deepEqual(ids(profileRows.dataList.value), ['a1']);
  assert.deepEqual(ids(cached('A').rows), ['a1'], 'stale B never writes A cache');
  assert.equal(cached('B'), null, 'discarded view work does not populate a different cache');
  assert.equal(state.page.first, 1, 'A resumes its cached page');
  assert.equal(state.loading.value, false);

  move('B');
  const b = await read();
  assert.equal(b.params.page_index, 1, 'cold B starts on its first page');
  b.resolve();
  await b.done;
  assert.deepEqual(visible(), ['b2']);
  assert.deepEqual(ids(publications.at(-1)), ['b2'], 'legitimate new activation can publish results');
  attrs.selection = state.rows.value;
  state.contextSelection.value = state.rows.value[0];
  state.showMenu({ event: {}, operation: [{ name: 'fixture' }] }, state.rows.value[0], 'single');
  move('A');
  restore();
  assert.deepEqual(visible(), ['a1']);
  assert.equal(state.selectionData.value, undefined, 'cross-project selection is ineffective even before the controller clears its old value');
  assert.equal(state.contextSelection.value, undefined);
  assert.equal(controlled.at(-1), undefined);
  await openedMenu.operationHandler({ name: 'fixture' });
  await state.batchOperation({ name: 'fixture' });
  assert.deepEqual(actions, [], 'a delayed scope-B menu or selection action cannot target B rows while A is active');
  attrs.selection = undefined; // Parent acknowledgement.
  attrs.selection = state.rows.value; // Deliberate current-project selection.
  assert.deepEqual(ids(state.selectionData.value), ['a1']);

  const obsoleteA = await read();
  restore();
  assert.equal(state.loading.value, false, 'same-key cache reactivation ends the previous load');
  assert.equal(obsoleteA.current(), false, 'page adapters cannot publish a reactivated request');
  const currentA = await read();
  obsoleteA.reject(Error('old A request'));
  await obsoleteA.done;
  assert.equal(state.loading.value, true, 'obsolete failure cannot clear a newer load');
  assert.deepEqual(errors, []);
  currentA.resolve();
  await currentA.done;
  assert.deepEqual(visible(), ['a1']);

  const oldestA = await read();
  move('B');
  const middleB = await read();
  move('A');
  const newestA = await read();
  newestA.resolve();
  await newestA.done;
  const savedPublicationCount = publications.length;
  middleB.resolve();
  oldestA.resolve();
  await Promise.all([middleB.done, oldestA.done]);
  assert.equal(publications.length, savedPublicationCount, 'a round trip does not reactivate an older request for the same key');
  assert.deepEqual(visible(), ['a2']);
  assert.deepEqual(ids(cached('B').rows), ['b2']);

  move('B');
  const failedB = await read();
  move('A');
  restore();
  failedB.reject(Error('late B request'));
  await failedB.done;
  assert.deepEqual(errors, []);
  assert.equal(state.loading.value, false);

  attrs.selection = undefined;
  attrs.selection = state.rows.value;
  const retainedA = await read(() => { notifyProfilesChanged(); });
  retainedA.resolve();
  await tick();
  assert.deepEqual(ids(controlled.at(-1)), ['a2'], 'a valid background refresh preserves active-scope selection');
  assert.deepEqual(retainedA.params.orderName, 'windowSortNum');

  const backgroundA = await read(() => { notifyProfilesChanged(); });
  move('B');
  const backgroundB = await read(() => { notifyProfilesChanged(); });
  backgroundB.resolve();
  await tick();
  backgroundA.resolve();
  await tick();
  assert.deepEqual(visible(), ['b2'], 'an old stalled background request does not block the active scope refresh');
  assert.deepEqual(ids(cached('B').rows), ['b2']);
}

async function profileTableErrorChecks() {
  const vue = require('vue');
  const tableModule = await import('../../rebuild/workbench-table.mjs');
  const noop = () => {};
  const errors = [];
  let mount, state, response;
  const queries = [];
  const dataTable = {}, slot = { 'table-empty': () => vue.h('div', { id: 'ordinary-empty' }) };
  const vueStub = { ...vue, useAttrs: () => ({}), useModel: () => vue.ref([]), useTemplateRef: () => vue.ref(),
    onBeforeMount: hook => { mount = hook; }, onBeforeUnmount: noop, onMounted: noop, withDirectives: node => node,
    renderSlot: (slots, name) => slots[name]?.() ?? vue.createCommentVNode() };
  const utils = { bt: () => ({}), mt: () => ({ currentWorkspace: {} }), o: () => ({}), yr: noop };
  const useBrowserTable = await rendererFixture('frontend/src/workbench/shared/tables/use-browser-table.mjs', {
    './workbench-vue.js': vueStub, './utils-BIWenCnY.js': utils,
    './rich-html-link-VdBpR3Cm.js': { y: () => ({ query: {} }) },
    './workbench-table.js': tableModule, './workbench-table-actions.js': { permittedActions: value => value },
    './workbench-table-context.js': { useTableContextMenu: () => [noop] },
  }, { localStorage: { getItem: () => null }, __localUiError: error => errors.push(error) }, 'useBrowserTable');
  const component = await rendererFixture('frontend/src/workbench/shared/tables/BrowserDataTable.vue', {
    './workbench-vue.js': vueStub, './utils-BIWenCnY.js': utils,
    './contextmenu-BBjizTDn.js': { a: {}, i: {}, o: dataTable }, './paginator-vnwyVxKC.js': { t: {} },
    './skeleton-CcmFVUhV.js': { t: {} }, './divider-BXJIHZjP.js': { t: {} }, './m-input-select-C8pih1gY.js': { n: {} },
    './AnimatePresence-d-29l3Fb.js': { t: {} }, './basecomponent-ClhuVxJN.js': { Z: {} },
    './workbench-row-actions.js': { default: {} }, './workbench-column-settings.js': { default: {} },
    './workbench-table-filters.js': { default: {} }, './workbench-table-refresh.js': { default: {} },
    './workbench-selection-toolbar.js': { default: {} },
    './workbench-browser-table-state.js': { useBrowserTable(...args) { return (state = useBrowserTable(...args)); } },
  });
  function findNode(node, matches) {
    if (Array.isArray(node)) return node.map(child => findNode(child, matches)).find(Boolean);
    return node && (matches(node) ? node : Array.isArray(node.children) && findNode(node.children, matches));
  }
  async function openTable(cacheKey, overrides) {
    const props = { cacheKey, dataKey: 'id', pageRows: 10, immediate: true, tableSort: () => ({}), tableFilters: () => [],
      async tableRequest(query) {
        queries.push({ ...query });
        if (response instanceof Error) throw response;
        return response;
      }, ...overrides };
    const render = component.setup(props, { expose: noop });
    await mount();
    return () => findNode(render({ $slots: slot, $t: message => message }, []), node => node.type === dataTable);
  }
  response = new Error('temporary local read failure');
  const table = await openTable('browser-list');
  const empty = () => table().children.empty();
  const emptyMessage = () => findNode(empty(), node => node.props?.id === 'ordinary-empty');
  const retryButton = () => findNode(empty(), node => node.type === 'button');
  assert.ok(!emptyMessage(), 'an unreadable store must not claim there are no profiles');
  assert.deepEqual(errors, ['temporary local read failure']);
  assert.equal(findNode(empty(), node => node.props?.role === 'status').children, '列表读取失败');
  assert.equal(retryButton().props.type, 'button');
  assert.equal(retryButton().children, '重试');

  let finishRetry;
  response = new Promise(resolve => { finishRetry = resolve; });
  const firstRetry = retryButton().props.onClick();
  assert.equal(retryButton().props['aria-disabled'], true, 'the button stays focusable but cannot repeat while loading');
  assert.equal(retryButton().props.disabled, undefined);
  await retryButton().props.onClick();
  await tick();
  assert.equal(queries.length, 2, 'the retry issues one read even on repeated activation');
  assert.deepEqual(queries[1], queries[0], 'retry requests the same list');
  finishRetry({ rows: [], total: 0 });
  await firstRetry;
  assert.ok(emptyMessage(), 'a successful empty result still uses the ordinary empty slot');
  assert.ok(!retryButton());
  assert.deepEqual(table().props.value, []);

  response = new Error('second local read failure');
  await state.refresh({ queryValue: 'fixture' });
  assert.ok(!emptyMessage());
  response = { rows: [{ id: 'fixture' }], total: 1 };
  await retryButton().props.onClick();
  assert.equal(queries.at(-1).queryValue, 'fixture');
  assert.deepEqual(table().props.value, [{ id: 'fixture' }]);
  assert.ok(!retryButton());
  state.selection.value = [{ id: 'fixture' }];
  response = new Error('refresh failure with data');
  await state.load();
  assert.deepEqual(table().props.value, [{ id: 'fixture' }], 'a failed refresh retains the last good nonempty result');
  assert.deepEqual(state.selection.value, [{ id: 'fixture' }]);
  assert.equal(state.page.total, 1);
  assert.ok(!retryButton());

  const recycle = await openTable('browser-recycle-list');
  assert.ok(findNode(recycle().children.empty(), node => node.type === 'button'), 'failed recycle reads offer the same retry');

  const otherTable = await openTable('unrelated-list');
  assert.ok(findNode(otherTable().children.empty(), node => node.props?.id === 'ordinary-empty'),
    'unrelated list behavior is unchanged');
  const projectPages = [];
  await openTable('project-list', { tableRequest: async params => {
    projectPages.push(params.page_index);
    return { total: 11, rows: params.page_index <= 2 ? [{ id: params.page_index }] : [] };
  } });
  state.page.first = 40;
  await state.load();
  assert.deepEqual(projectPages, [1, 5, 2], 'an emptied project page retries the last available page');
  assert.equal(state.page.first, 10);
  assert.deepEqual(state.rows.value, [{ id: 2 }]);
  await profileSortPreferenceChecks(openTable, () => state, errors);
}

async function profileSortPreferenceChecks(openTable, getState, errors) {
  const { LocalService } = require('../../rebuild/local-service');
  const service = Object.create(LocalService.prototype);
  const writes = [];
  let nextSave, persisted;
  Object.assign(service, {
    queue: Promise.resolve(), data: { settings: { tableSort: { orderName: 'windowName', orderType: 'asc' } } }, load: async () => {},
    async save() {
      if (nextSave) {
        const hold = nextSave;
        nextSave = undefined;
        await hold;
      }
      persisted = structuredClone(service.data.settings.tableSort);
      writes.push(persisted);
    },
  });
  const bridgeFile = path.resolve(__dirname, '../../rebuild/renderer-bridge.js');
  const code = (await fs.readFile(bridgeFile, 'utf8')).replace(/^import\s+[\s\S]*?;$/gm, '');
  const renderer = vm.createContext({
    createProfileLifecycleBridge: () => ({}),
    rebuild: { request: (name, payload) => captureIpcResult(() => service.request(name, structuredClone(payload))) },
  });
  vm.runInContext(code, renderer, { filename: bridgeFile });
  const api = { window: {
    userGetWindowTableSortOrderList: renderer.__localApi.window.userGetWindowTableSortOrderList,
    userSaveWindowTableSortOrderCreate(payload) {
      const saving = renderer.__localApi.window.userSaveWindowTableSortOrderCreate(payload);
      // Suppress the old detached rejection at the fixture boundary so it can assert the missing notice.
      saving.catch(() => {});
      return saving;
    },
  } };
  const { sortDirection } = await import('../../rebuild/workbench-table.mjs');
  const profileSortOptions = await rendererFixture('frontend/src/workbench/profiles/profile-table-options.mjs', {
    './utils-BIWenCnY.js': { h: api, jr: sortDirection, nn: () => ({}) },
    './proxy-D7e36h-l.js': {}, './format-_cvrr_iF.js': {},
  }, {}, 'profileSortOptions');
  const queries = [];
  const table = await openTable('browser-list', {
    tableSort: profileSortOptions,
    tableRequest: async query => {
      queries.push({ ...query });
      return { total: 20, rows: [{ id: query.orderType + ':' + query.page_index }] };
    },
  });
  const state = getState();
  assert.deepEqual(state.rows.value, [{ id: 'asc:1' }]);
  assert.equal(queries[0].orderName, 'name', 'a remembered DTO field selects the actual name column');
  state.page.first = 10;
  await state.load();
  assert.deepEqual(state.rows.value, [{ id: 'asc:2' }]);

  let failWrite;
  nextSave = new Promise((_resolve, reject) => { failWrite = reject; });
  const failingSort = table().props.onSort({ sortField: 'name', sortOrder: -1 });
  await tick();
  assert.deepEqual(state.rows.value, [{ id: 'desc:1' }], 'visible sorting does not wait for preference persistence');
  const fault = 'sort preference file could not be saved';
  failWrite(Object.assign(Error(fault), { code: 'EIO' }));
  await failingSort;
  await tick();
  assert.equal(errors.at(-1), fault, 'a failed preference save is visible instead of a detached rejection');
  assert.equal(service.data.settings.tableSort.orderType, 'asc', 'the real local settings route rolls back a failed write');
  assert.deepEqual(state.rows.value, [{ id: 'desc:1' }]);

  let releaseWrite;
  nextSave = new Promise(resolve => { releaseWrite = resolve; });
  const older = table().props.onSort({ sortField: 'name', sortOrder: -1 });
  const newer = table().props.onSort({ sortField: 'windowSortNum', sortOrder: 1 });
  await tick();
  assert.deepEqual(state.rows.value, [{ id: 'asc:1' }]);
  assert.equal(queries.at(-1).orderName, 'windowSortNum');
  assert.deepEqual(writes, [], 'the older in-flight preference does not block the newer visible sort');
  releaseWrite();
  await Promise.all([older, newer]);
  assert.deepEqual(persisted, { orderName: 'windowSortNum', orderType: 'asc' });
  assert.equal(service.data.settings.tableSort.orderName, 'windowSortNum');
  assert.equal(state.sort.sortOrder, 1);
  state.page.first = 10;
  await state.load();
  assert.deepEqual(state.rows.value, [{ id: 'asc:2' }]);
  assert.deepEqual(queries.at(-1), { page_index: 2, page_size: 10, orderName: 'windowSortNum', orderType: 'asc' });
  assert.deepEqual(writes, [{ orderName: 'name', orderType: 'desc' }, { orderName: 'windowSortNum', orderType: 'asc' }],
    'the real settings queue preserves the order of rapid writes');

  const previousErrors = errors.length;
  nextSave = new Promise((_resolve, reject) => { failWrite = reject; });
  const obsolete = table().props.onSort({ sortField: 'name', sortOrder: 1 });
  await tick();
  const clear = table().props.onSort({ sortField: 'name', sortOrder: 0 });
  failWrite(Error('obsolete sort preference failure'));
  await Promise.all([obsolete, clear]);
  assert.equal(errors.length, previousErrors, 'obsolete sort failures do not confuse the currently selected sort');
  assert.deepEqual(persisted, {}, 'clearing a sort clears the remembered preference');
  assert.deepEqual(queries.at(-1), { page_index: 1, page_size: 10 }, 'clearing sort resets pagination and omits the explicit order');

  const snapshot = [
    { id: 'first', number: 1, name: 'Zulu' }, { id: 'second', number: 2, name: 'Alpha' },
    { id: 'third', number: 3, name: 'Alpha' },
  ];
  const projection = require('../../rebuild/profile-index').buildProfileIndex({ snapshot, groups: [], labels: [] });
  service.profileIndex = () => projection;
  service.decorate = row => ({ id: row.id, projectId: 'demo' });
  const real = await openTable('browser-list', { tableSort: profileSortOptions, tableRequest: renderer.__localApi.window.userGetWindowInfoListList });
  await real().props.onSort({ sortField: 'name', sortOrder: 1 });
  assert.deepEqual(Array.from(getState().rows.value, row => row.id), ['second', 'third', 'first'],
    'clicking the actual name column sorts by names, not profile numbers, with stable ties');
  await real().props.onSort({ sortField: 'name', sortOrder: -1 });
  assert.deepEqual(Array.from(getState().rows.value, row => row.id), ['first', 'second', 'third']);
  const aliases = await renderer.__localApi.window.userGetWindowInfoListList({ orderName: 'windowName', orderType: 'asc', page_size: 1, page_index: 2 });
  assert.deepEqual(Array.from(aliases.data.rows, row => row.id), ['third']);
}

async function apiChecks() {
  const { createApiSettingsWriter } = await import('../../rebuild/workbench-api-settings.mjs');
  let saved = { open: true, port: 50100, apiAllowLan: false, apiKey: 'local-secret' };
  let draft = { ...saved, port: 50101 };
  const writes = [], errors = [];
  const submit = createApiSettingsWriter({
    draft: () => draft, saved: () => saved,
    write: value => new Promise((resolve, reject) => writes.push({ value, resolve, reject })),
    failed: error => errors.push(error.message),
    publish: ({ confirmed, next }) => { saved = confirmed; draft = { ...draft, ...next }; },
  });
  const first = submit();
  await tick();
  draft = { ...draft, port: 50102, open: false };
  const next = submit();
  assert.equal(writes.length, 1, 'only the next durable write should enter IPC');
  assert.equal(Object.hasOwn(writes[0].value, 'apiKey'), false);
  writes[0].reject(Error('port in use'));
  await first;
  await tick();
  assert.deepEqual(writes[1].value, { open: false, port: 50102, apiAllowLan: false });
  writes[1].resolve({ ...writes[1].value, apiKey: 'unchanged' });
  await next;
  await submit();
  assert.equal(writes.length, 2, 'equal settings must not restart the listener');
  assert.equal(saved.port, 50102);
  assert.deepEqual(errors, ['port in use']);
}

async function compactTableChecks() {
  // Run the real compact table state module with small renderer dependency
  // stand-ins; the build copies these aliased imports into the desktop bundle.
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-compact-table-'));
  const appRoot = path.resolve(__dirname, '../..');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousError = globalThis.__localUiError;
  const errors = [];
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  globalThis.__localUiError = message => errors.push(message);
  try {
    const files = {
      'package.json': '{"type":"module"}',
      'workbench-vue.js': `export const ref = value => ({value}), reactive = value => value, toRaw = value => value,
        computed = value => Object.defineProperty({}, 'value', typeof value === 'function' ? {get: value} : value),
        nextTick = async () => {}, watch = () => {}, onMounted = () => {}, onBeforeMount = () => {}, onBeforeUnmount = () => {};`,
      'utils-BIWenCnY.js': 'export const Dr = JSON.parse, o = () => ({});',
      'rich-html-link-VdBpR3Cm.js': 'export const y = () => ({query:{page_index:3}});',
      'usePreventMask-Cud6gNnu.js': 'export const t = () => ({});',
    };
    await Promise.all([
      ...Object.entries(files).map(([name, content]) => fs.writeFile(path.join(root, name), content)),
      fs.copyFile(path.join(appRoot, 'frontend/src/workbench/shared/tables/use-compact-table.mjs'), path.join(root, 'compact.js')),
      fs.copyFile(path.join(appRoot, 'rebuild/workbench-table.mjs'), path.join(root, 'workbench-table.js')),
    ]);
    const { useCompactTable } = await import(pathToFileURL(path.join(root, 'compact.js')).href);
    const row = { id: 'saved-row' };
    let response = { code: 0, data: { rows: [row], total: '1' } }, refreshed = 0;
    const queries = [];
    const table = useCompactTable({
      columns: [], pageSize: 10, dataKey: 'id', selectionMode: 'multiple',
      tableRequest: async query => {
        queries.push(query);
        if (response instanceof Error) throw response;
        return response;
      },
      afterRefresh: () => { refreshed += 1; },
    }, {}, null, false, {}, {});
    await table.reload();
    table.selection.value = [row];

    response = { code: 17, msg: 'list could not be read' };
    await table.reload();
    assert.deepEqual(table.rows.value, [row], 'compact table keeps rows on API failure');
    assert.deepEqual(table.selection.value, [row], 'compact table keeps selection on API failure');
    assert.equal(table.page.total, '1', 'the successful response total retains its type');
    assert.equal(table.loading.value, false);
    assert.equal(refreshed, 1, 'failed refresh is not presented as completed');

    response = new Error('desktop disconnected');
    await table.reload();
    assert.deepEqual(errors, ['list could not be read', 'desktop disconnected']);
    assert.deepEqual(table.rows.value, [row]);

    let rejectStale;
    response = new Promise((_resolve, reject) => { rejectStale = reject; });
    const stale = table.load();
    await tick();
    response = { rows: [], total: 0 };
    await table.reload();
    rejectStale(new Error('obsolete failure'));
    await stale;
    assert.deepEqual(table.rows.value, [], 'a genuinely empty list is still applied');
    assert.deepEqual(table.selection.value, []);
    assert.equal(refreshed, 2);
    assert.deepEqual(errors, ['list could not be read', 'desktop disconnected'], 'obsolete failures remain silent');
    assert.deepEqual(queries.map(query => query.page_index), [3, 3, 3, 3, 3], 'compact tables do not retry a smaller page');
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else delete globalThis.localStorage;
    globalThis.__localUiError = previousError;
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function savedViewDateChecks() {
  const { LocalService } = require('../../rebuild/local-service');
  const file = path.resolve(__dirname, '../../rebuild/renderer-bridge.js');
  const program = (await fs.readFile(file, 'utf8')).replace(/^import\s+[\s\S]*?;$/gm, '');
  const service = Object.create(LocalService.prototype);
  service.queue = Promise.resolve();
  service.data = { settings: {}, filters: [] };
  service.load = async () => {};
  let persisted;
  service.save = async () => { persisted = JSON.stringify(service.data); };
  const renderer = vm.createContext({
    Date,
    createProfileLifecycleBridge: () => ({}),
    rebuild: { request: (name, payload) => service.request(name, structuredClone(payload)) },
  });
  vm.runInContext(program, renderer, { filename: file });
  const from = new Date(2026, 10, 5), to = new Date(2026, 10, 7);
  await renderer.__localApi.window.userAddWindowFilterNameCreate({
    filter_name: 'Date fixture',
    filter_condition: { createTime: [from, to], modfiyTime: [from, to], openStatus: true },
  });
  service.data = JSON.parse(persisted);
  const reopened = await renderer.__localApi.window.userGetWindowFilterNameListList();
  const condition = reopened.data[0].filter_condition;
  assert.deepEqual(condition, {
    createTime: [from.toISOString(), to.toISOString()],
    modfiyTime: [from.toISOString(), to.toISOString()], openStatus: true,
  }, 'calendar selections survive renderer IPC and saved-view reload');
  assert.equal(new Date(condition.createTime[0]).getTime(), from.getTime());
  const strings = ['2026-11-01', '2026-11-07'];
  const update = createTime => renderer.__localApi.window.userUpdateWindowFilterNameCreate({
    old_filter_name: 'Date fixture', new_filter_name: 'Date fixture',
    filter_condition: { createTime },
  });
  await update(strings);
  assert.deepEqual(JSON.parse(persisted).filters[0].filter_condition.createTime, strings,
    'serialized date strings are preserved by the update alias');
  const beforeInvalid = persisted;
  await assert.rejects(update([new Date(NaN)]), /筛选器日期无效/);
  assert.equal(persisted, beforeInvalid, 'invalid Date input is not saved');
}

async function inlineRenameChecks() {
  const vue = require('vue');
  const { LocalService } = require('../../rebuild/local-service');
  const appRoot = path.resolve(__dirname, '../..');
  const id = 'rename-fixture';
  let profile = { id, name: 'Original name' }, rev = 1;
  const writes = [];
  const service = Object.create(LocalService.prototype);
  Object.assign(service, {
    queue: Promise.resolve(),
    data: { groups: [], labels: [] },
    load: async () => {},
    resolveInputs: data => data,
    decorate: ({ name }) => ({ windowName: name }),
    engine: {
      profileForEdit: () => ({ profile: { ...profile }, rev }),
      async commitProfileCommand(command, prepareReply) {
        writes.push(command.baseRev);
        if (command.baseRev !== rev) {
          throw Object.assign(Error('stale fixture'), { code: 'PROFILE_STALE_REV' });
        }
        const reply = prepareReply(structuredClone(command.profile));
        profile = command.profile;
        rev += 1;
        return { ...reply, rev };
      },
    },
  });
  const bridgeFile = path.join(appRoot, 'rebuild/renderer-bridge.js');
  const bridge = (await fs.readFile(bridgeFile, 'utf8')).replace(/^import\s+[\s\S]*?;$/gm, '');
  let pendingRead;
  const methods = [];
  const renderer = vm.createContext({
    createProfileLifecycleBridge: () => ({}),
    rebuild: {
      async request(method, payload) {
        methods.push(method);
        if (method === 'profiles:read' && pendingRead) return pendingRead;
        return captureIpcResult(() => service.request(method, structuredClone(payload)));
      },
    },
  });
  vm.runInContext(bridge, renderer, { filename: bridgeFile });

  const notices = [], emissions = [];
  // Render the actual SFC's slots and event bindings without mounting Electron.
  const instance = await rendererFixture('frontend/src/workbench/profiles/EditableProfileName.vue', {
    './workbench-vue.js': { ...vue, withDirectives: node => node },
    './utils-BIWenCnY.js': { h: renderer.__localApi },
    './agent-BmSFI9WH.js': { n: () => [null, (...args) => notices.push(args)] },
    './utils-CnUy4XUk.js': { a: () => 'Auto ' },
    './inplace-DdcGL3G8.js': { t: {} },
    './inputtext-Crzvb5jQ.js': { t: {} },
    './tooltip-BYYKWrvu.js': { t: {} },
    './focustrap-DJJkEqE8.js': { t: {} },
  });
  // Like the active-list DTO, the visible row intentionally has no revision.
  const props = vue.reactive({ data: { id, windowName: profile.name } });
  const render = instance.setup(props, { emit: name => emissions.push(name), expose() {} });
  const inplace = () => render({}, []).children[0];
  let closed = 0;
  const close = () => { closed += 1; inplace().props.onClose?.(); };
  const input = () => inplace().children.content({ closeCallback: close })[0].props;
  const open = () => { inplace().props.onOpen?.(); input().onFocus?.(); };
  const draft = text => input()['onUpdate:modelValue'](text);
  const submit = () => input().onKeydown({ key: 'Enter' });

  open();
  draft('Old editor draft');
  await tick();
  await service.request('profiles:update', { id, rev: 1, windowName: 'Other saved name' });
  // Hold back profile-change notifications: the visible row still shows rev 1's name.
  await submit();
  assert.equal(profile.name, 'Other saved name', 'an old inline draft must not overwrite a newer saved name');
  assert.equal(rev, 2);
  assert.deepEqual(writes, [1, 1], 'inline save carries the revision read at activation');
  assert.equal(notices.length, 1);
  assert.equal(notices[0][0], -1, 'the conflict is shown rather than reported as success');
  assert.match(notices[0][1], /窗口已在别处更新/);
  assert.deepEqual(emissions, ['refresh']);

  // A refresh and deliberate second edit apply normally; Enter also closes the
  // editor, so a following blur must not send a second write.
  props.data = { id, windowName: profile.name };
  open();
  draft('  Deliberate retry  ');
  const submitHandlers = input();
  const retry = submitHandlers.onKeydown({ key: 'Enter' });
  await submitHandlers.onBlur();
  await retry;
  assert.equal(profile.name, 'Deliberate retry');
  assert.equal(rev, 3);
  assert.deepEqual(writes, [1, 1, 2]);
  assert.deepEqual(notices.at(-1), [0, '']);
  assert.equal(props.data.windowName, profile.name);
  assert.equal(closed, 2);
  assert.deepEqual(methods, ['profiles:read', 'profiles:update', 'profiles:read', 'profiles:update']);

  function deferRead() {
    let release;
    pendingRead = new Promise(resolve => { release = resolve; });
    return release;
  }
  const read = () => captureIpcResult(() => service.request('profiles:read', { id }));
  const oldBaseline = await read();
  const releaseCancelled = deferRead();
  open();
  draft('Cancelled draft');
  close();
  pendingRead = undefined;
  await service.request('profiles:update', { id, rev: 3, windowName: 'Unrelated rename' });
  props.data = { id, windowName: profile.name };
  open();
  draft('New activation draft');
  await tick();
  releaseCancelled(oldBaseline);
  await tick();
  await submit();
  assert.equal(profile.name, 'New activation draft', 'late cancelled reads cannot supply the next activation’s revision');
  assert.equal(rev, 5);
  assert.deepEqual(writes, [1, 1, 2, 3, 4]);

  const releaseLate = deferRead();
  open();
  draft('Draft based on a stale table row');
  await service.request('profiles:update', { id, rev: 5, windowName: 'Newly saved name' });
  const delayedSubmit = submit();
  releaseLate(await read());
  pendingRead = undefined;
  await delayedSubmit;
  assert.equal(profile.name, 'Newly saved name', 'an activation read must still match the name shown to the editor');
  assert.equal(rev, 6);
  assert.deepEqual(writes, [1, 1, 2, 3, 4, 5], 'do not write when the delayed read already proves a conflict');
  assert.equal(notices.at(-1)[0], -1);
  assert.deepEqual(emissions, ['refresh', 'refresh']);

  props.data = { id, windowName: profile.name };
  pendingRead = captureIpcResult(() => ({ windowName: profile.name }));
  open();
  draft('Draft without a revision');
  await submit();
  assert.equal(rev, 6, 'missing revision must never fall back to an unversioned patch');
  assert.equal(notices.at(-1)[0], -1);
  assert.equal(methods.includes('profiles:patch'), false);
}

async function startupSettingsChecks() {
  const { LocalService } = require('../../rebuild/local-service');
  const bridgeFile = path.resolve(__dirname, '../../rebuild/renderer-bridge.js');
  const bootstrapFile = path.resolve(__dirname, '../../frontend/src/workbench/bootstrap.mjs');
  const withoutImports = code => code.replace(/^import\s+[\s\S]*?;$/gm, '');
  const bridge = withoutImports(await fs.readFile(bridgeFile, 'utf8'));
  const bootstrap = withoutImports(await fs.readFile(bootstrapFile, 'utf8'));
  const privatePath = '/fixture/private-account/settings.enc';
  function readError(code) { return Object.assign(Error('reading ' + privatePath), { code }); }
  const noop = () => {};
  function setup(loadOnce, { language = 'en-US', cachedLocale, infoError, dictionaryError, routeError } = {}) {
    const calls = [], locales = [], logged = [];
    const counts = { info: 0, reads: 0, apps: 0, installs: 0, routeHooks: 0, navigation: 0, listeners: 0, mounts: 0 };
    const service = Object.create(LocalService.prototype);
    Object.assign(service, {
      queue: Promise.resolve(),
      async loadOnce() {
        if (this.data) return;
        await loadOnce(++counts.reads);
        this.data = { settings: { language: 'ru' } };
      },
    });
    const active = { element: undefined };
    const element = (tag, text = '') => ({
      tag, textContent: text, children: [], attributes: {}, listeners: new Map(),
      append(...nodes) { this.children.push(...nodes); },
      replaceChildren(...nodes) { this.children = nodes; },
      setAttribute(key, value) { this.attributes[key] = value; },
      toggleAttribute: noop,
      focus() { active.element = this; },
      addEventListener(type, callback, options) { this.listeners.set(type, { callback, options }); },
      click() {
        const listener = this.listeners.get('click');
        if (this.disabled || !listener) return;
        if (listener.options?.once) this.listeners.delete('click');
        listener.callback();
      },
    });
    const root = element('app'), body = element('body');
    body.append(root);
    const context = vm.createContext({
      URL, location: { href: 'obui://app/index.html#/browser/list' },
      navigator: { language }, localStorage: { getItem: () => cachedLocale && JSON.stringify({ currentLocale: cachedLocale }) },
      document: { body, documentElement: element('html'), createElement: element, querySelector: query => query === '#app' ? root : undefined },
      console: { error: (...args) => logged.push(args) },
      ops: { async getInfo() { counts.info++; if (infoError) throw infoError; return { appVersion: 'fixture' }; } },
      createProfileLifecycleBridge: () => ({}),
      rebuild: {
        request(method, payload) {
          calls.push(method);
          return captureIpcResult(() => {
            if (method === 'host:dictionary' && dictionaryError) throw dictionaryError;
            return service.request(method, structuredClone(payload));
          });
        },
        onEvent() { counts.listeners++; return noop; },
      },
      i18n: {}, loadLocale: async ({ defaultLocale }) => { locales.push(defaultLocale); },
      createApp() {
        counts.apps++;
        return { use: noop, config: {}, mount() { counts.mounts++; root.replaceChildren(); } };
      },
      installPrimeVue: noop, installGlobalComponents: noop, registerRouter: noop, finishLoading: noop,
      installRouter: async () => { counts.installs++; if (routeError) throw routeError; },
      router: { afterEach() { counts.routeHooks++; }, replace: async () => {},
        resolve: () => ({ matched: ['fixture'] }), currentRoute: { value: { matched: ['fixture'] } } },
      installWorkspaceNavigation: async (_router, { events }) => {
        counts.navigation++;
        events(noop);
        return { initialPath: '/browser/list', activate: async () => {} };
      },
    });
    vm.runInContext(bridge, context, { filename: bridgeFile });
    vm.runInContext(bootstrap, context, { filename: bootstrapFile });
    const all = node => [node, ...node.children.flatMap(all)];
    return { counts, calls, locales, logged, active, button: () => all(body).find(node => node.tag === 'button'),
      visibleText: () => all(body).map(node => node.textContent).join(' '), root };
  }

  let releaseRetry;
  const secondRead = new Promise(resolve => { releaseRetry = resolve; });
  const recovery = setup(async attempt => {
    if (attempt === 1) throw readError('EIO');
    if (attempt === 2) await secondRead;
  });
  await tick();
  const retry = recovery.button();
  assert.ok(retry, 'an actual cold settings load failure offers a retry instead of replacing the body with an error');
  assert.equal(retry.type, 'button');
  assert.equal(retry.textContent, 'Retry');
  assert.equal(retry.attributes['aria-describedby'], 'ob-startup-detail');
  assert.equal(recovery.active.element, retry);
  assert.doesNotMatch(recovery.visibleText(), /private-account|settings\.enc/);
  assert.doesNotMatch(JSON.stringify(recovery.logged), /private-account|settings\.enc/);
  assert.deepEqual(recovery.calls, ['settings:get']);
  assert.equal(recovery.counts.reads, 1);
  assert.deepEqual(recovery.locales, []);
  assert.equal(recovery.counts.mounts, 0);
  retry.click();
  retry.click();
  await tick();
  assert.equal(retry.disabled, true);
  assert.match(recovery.visibleText(), /Trying again/);
  assert.deepEqual(recovery.calls, ['settings:get', 'settings:get'], 'one pending retry and no automatic replay');
  assert.equal(recovery.counts.mounts, 0);
  releaseRetry();
  await tick();
  assert.deepEqual(recovery.calls, ['settings:get', 'settings:get', 'host:dictionary']);
  assert.deepEqual(recovery.locales, ['ru'], 'chosen app locale is installed only after settings can be read');
  assert.deepEqual(recovery.counts, { info: 1, reads: 2, apps: 1, installs: 1, routeHooks: 1, navigation: 1, listeners: 2, mounts: 1 });
  assert.equal(recovery.button(), undefined);

  const healthy = setup(async () => {});
  await tick();
  assert.deepEqual(healthy.calls, ['settings:get', 'host:dictionary']);
  assert.deepEqual(healthy.locales, ['ru']);
  assert.deepEqual(healthy.counts, { ...recovery.counts, reads: 1 });
  assert.equal(healthy.button(), undefined);

  const repeated = setup(async attempt => { if (attempt < 3) throw readError('EBUSY'); }, { cachedLocale: 'ru' });
  await tick();
  assert.equal(repeated.button().textContent, 'Повторить');
  repeated.button().click();
  await tick();
  assert.equal(repeated.button().disabled, undefined);
  assert.equal(repeated.active.element, repeated.button());
  assert.equal(repeated.counts.reads, 2);
  repeated.button().click();
  await tick();
  assert.equal(repeated.counts.mounts, 1);

  for (const failure of [setup(async () => { throw readError('EACCES'); }),
    setup(async () => {}, { infoError: readError('EIO') }),
    setup(async () => {}, { dictionaryError: readError('EIO') }),
    setup(async () => {}, { routeError: readError('EIO') })]) {
    await tick();
    assert.equal(failure.button(), undefined, 'non-retryable or later failures do not replay startup');
    assert.equal(failure.counts.mounts, 0);
    assert.doesNotMatch(failure.visibleText(), /private-account|settings\.enc/);
    assert.match(failure.visibleText(), /Could not start the workbench/);
    assert.doesNotMatch(JSON.stringify(failure.logged), /private-account|settings\.enc/);
  }
}

async function localPreferenceChecks() {
  const { LocalService } = require('../../rebuild/local-service');
  const vue = require('vue');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-workbench-prefs-'));
  const originalKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = 'synthetic-workbench-preferences-fixture-key';
  try {
    const file = path.join(root, 'rebuild-local.json');
    const createService = () => Object.assign(Object.create(LocalService.prototype), {
      file, queue: Promise.resolve(), engine: { profiles: new Map() },
    });
    const service = createService();
    const initial = { batchOpenLayout: 'stack', language: 'en', unknownPreference: { keep: true } };
    await service.request('settings:set', initial);
    const reopened = () => createService().request('settings:get');
    const calls = [], applied = [], errors = [];
    const persist = service.save.bind(service);
    let hold, invalidRead, rejectWrite, writes = 0, repeatWrites = 0;
    service.save = async () => {
      if (rejectWrite) {
        const error = rejectWrite;
        rejectWrite = undefined;
        throw error;
      }
      writes++;
      await persist();
    };
    const renderer = vm.createContext({
      createProfileLifecycleBridge: () => ({}),
      __applyLocalUserConfig: saved => applied.push(structuredClone(saved)),
      rebuild: { async request(method, payload) {
        const plain = structuredClone(payload);
        calls.push([method, plain]);
        const gate = method === 'settings:get' && hold;
        if (gate) hold = undefined;
        const result = await captureIpcResult(() => service.request(method, plain));
        if (gate) {
          gate.captured.resolve();
          await gate.reply.promise;
        }
        if (method === 'settings:get' && invalidRead) {
          invalidRead = false;
          return captureIpcResult(() => []);
        }
        return result;
      } },
    });
    const bridgeFile = path.resolve(__dirname, '../../rebuild/renderer-bridge.js');
    vm.runInContext((await fs.readFile(bridgeFile, 'utf8')).replace(/^import\s+[\s\S]*?;$/gm, ''), renderer, { filename: bridgeFile });
    const api = renderer.__localApi.base;
    const usePreferences = await rendererFixture('frontend/src/workbench/shared/use-local-preferences.mjs', {
      './workbench-vue.js': { ...vue, inject: () => undefined },
      './utils-BIWenCnY.js': { h: renderer.__localApi, sn: () => null, v: () => ({
        updateUserConfig(patch) { repeatWrites++; return api.userSetUserConfigCreate(patch); },
      }) },
      './runtime-core.esm-bundler-CBj16o9G.js': { ht: vue.isReactive },
      './locales-BfKu2SD4.js': { t: message => message },
      './agent-BmSFI9WH.js': { n: () => [null, (code, message) => { if (code !== 0) errors.push([code, message]); }] },
      './useFormDialog-ChvKgFzE.js': { t: () => [] },
      './hooks-Jw3GridD.js': { t: () => ({}) },
    }, { electronAPI: renderer.electronAPI }, 'useLocalPreferences');
    const { saveUserConfig } = usePreferences();
    const edit = (name, value) => saveUserConfig({ name, value });
    const setCalls = () => calls.filter(([method]) => method === 'settings:set').map(([, patch]) => patch);
    function holdRead() {
      const gate = { captured: Promise.withResolvers(), reply: Promise.withResolvers() };
      hold = gate;
      return gate;
    }
    const waitForRead = (gate, save) => Promise.race([
      gate.captured.promise,
      save.then(() => assert.fail('the save finished without requesting its settings snapshot')),
    ]);

    const old = holdRead();
    const grid = edit('batchOpenLayout', 'grid');
    await waitForRead(old, grid);
    await edit('batchOpenLayout', 'cascade');
    assert.equal((await reopened()).batchOpenLayout, 'cascade');
    old.reply.resolve();
    await grid;
    assert.equal((await reopened()).batchOpenLayout, 'cascade', 'the old readback must not replay the old write after the newer acknowledgement');
    assert.deepEqual(applied, [{ ...initial, batchOpenLayout: 'cascade' }]);
    assert.deepEqual(setCalls(), [{ batchOpenLayout: 'grid' }, { batchOpenLayout: 'cascade' }]);
    assert.equal(writes, 2);
    assert.equal(repeatWrites, 0, 'the hook must not write via a second settings updater');

    const oldSnapshot = holdRead();
    const first = api.userSetUserConfigCreate({ remarkDisplayStatus: true });
    await waitForRead(oldSnapshot, first);
    await edit('language', 'ru');
    oldSnapshot.reply.resolve();
    const both = { ...initial, batchOpenLayout: 'cascade', remarkDisplayStatus: true, language: 'ru' };
    assert.deepEqual(structuredClone(await first), { code: 0, data: both, msg: '' }, 'callers of the compatibility getter/setter must not receive stale snapshots');
    assert.deepEqual(applied.at(-1), both);
    assert.deepEqual(structuredClone(renderer.__localSettings), both);
    assert.deepEqual(await reopened(), both);
    assert.equal(applied.length, 2);
    assert.equal(writes, 4);

    const lastGood = holdRead();
    const stack = edit('batchOpenLayout', 'stack');
    await waitForRead(lastGood, stack);
    rejectWrite = Object.assign(Error('simulated preference write failure'), { code: 'EIO' });
    await edit('batchOpenLayout', 'grid');
    assert.deepEqual(errors, [[-1, 'simulated preference write failure']], 'a rejected latest save is visible even if an older successful read is pending');
    assert.deepEqual(applied.at(-1), both, 'a rejected value must not be applied');
    lastGood.reply.resolve();
    await stack;
    const expected = { ...both, batchOpenLayout: 'stack' };
    assert.deepEqual(applied.at(-1), expected, 'the older successful snapshot is still current when the latest save failed');
    assert.deepEqual(await reopened(), expected);
    assert.equal(writes, 5);
    assert.deepEqual(setCalls().slice(-4), [{ remarkDisplayStatus: true }, { language: 'ru' }, { batchOpenLayout: 'stack' }, { batchOpenLayout: 'grid' }]);
    assert.equal(errors.length, 1);
    assert.equal(calls.filter(([method]) => method === 'settings:get').length, 5, 'only successful saves request a snapshot, once per intent');

    invalidRead = true;
    await assert.rejects(api.userGetUserConfigList(), { code: 'LOCAL_SETTINGS_INVALID_SNAPSHOT' });
    assert.deepEqual(applied.at(-1), expected, 'an invalid readback is not published');
    const result = await api.userGetUserConfigList();
    assert.deepEqual(structuredClone(result), { code: 0, data: expected, msg: '' });
  } finally {
    if (originalKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = originalKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function navigationChecks() {
  const { installWorkspaceNavigation } = await import('../../rebuild/workbench-navigation.mjs');
  const mainRouter = { beforeEach() {} };
  for (const [stored, expected] of [
    ['/api-keys#local-api', '/browser/list'],
    ['/skills#library', '/browser/list'],
    ['/skills?from=legacy#library', '/browser/list'],
    ['/browser/list?projectId=fixture#list', '/browser/list?projectId=fixture#list'],
  ]) {
    const { initialPath } = await installWorkspaceNavigation(mainRouter, {
      url: 'obui://app/index.html#' + stored,
      request() { assert.fail('main window does not request workspace setup'); },
    });
    assert.equal(initialPath, expected, 'restore main-window route: ' + stored);
  }
  const pushed = [];
  let event;
  const navigation = await installWorkspaceNavigation({
    beforeEach() {}, push: async route => pushed.push(route),
  }, {
    url: 'obui://app/index.html?workspace=/agent-console/mcp#/agent-console/mcp',
    events: callback => { event = callback; },
    request: async () => ({ route: '/agent-console/mcp' }),
  });
  event({ channel: 'workspace:navigate', payload: '/agent-console/mcp?tab=new' });
  assert.deepEqual(pushed, [], 'events wait until initial routing settles');
  await navigation.activate();
  assert.equal(pushed[0], '/agent-console/mcp?tab=new');
}

async function profileBatchChecks() {
  const routes = require('../../rebuild/routes/profiles');
  const purge = routes.find(([name]) => name === 'profiles:purge')[1];
  const stop = routes.find(([name]) => name === 'profiles:stop')[1];
  await assert.rejects(stop({ engine: { stop: async () => ({ cleanupBlocked: true, running: false }) } }, { id: 'fixture' }),
    { code: 'BROWSER_EXIT_UNCONFIRMED' });
  const ids = Array.from({ length: 501 }, (_, index) => 'fixture-' + index);
  const batches = [];
  const service = { engine: { async purgeProfiles(selected, deleteData) {
    assert.equal(deleteData, true);
    batches.push(selected);
    if (batches.length === 2) throw Object.assign(Error('injected failure'), { code: 'EIO' });
    return { deleted: selected.length, ids: selected };
  } } };
  await assert.rejects(purge(service, { ids: [...ids, ids[0]] }), error =>
    error.code === 'EIO' && error.completed === 200 && error.remainingIds.length === 301);
  assert.deepEqual(batches.map(batch => batch.length), [200, 200]);
  await assert.rejects(purge(service, { ids: [...ids, 'bad/id'] }), /Invalid profile id/);
  assert.equal(batches.length, 2, 'validation must precede every mutation');
}

async function profilePreviewValidationChecks() {
  const vue = require('vue'), noop = () => {}, workbench = 'frontend/src/workbench/';
  const incomplete = '指纹预览未返回完整身份，请重试';
  const previewErrors = [], statuses = [], submitted = [], imported = [], requestedCounts = [], requestedInputs = [];
  const draft = await rendererFixture('rebuild/workbench-fingerprint-draft.mjs', {}, {
    __localUiError: message => previewErrors.push(message),
  }, '({ requireFingerprintPreviewRows, refreshFingerprintDraft, serializeFingerprintDraft, fingerprintPreviewInput })');
  const fields = await rendererFixture(workbench + 'shared/workbench-fields.mjs', {
    './workbench-fingerprint-draft.js': draft,
  }, {}, '({ findField, selectFields, readFields, applyValues })');
  const fixtureRow = id => {
    const text = 'Preview display text ' + id;
    return { userAgent: text, _fingerprintDraft: {
      profileId: 'record-' + id, allocation: 'receipt-' + id, seed: 'fixture-' + id, version: 2, userAgent: text,
    } };
  };
  const [first, second] = ['a', 'b'].map(fixtureRow);
  const malformed = { ...second, _fingerprintDraft: {} };
  const userAgent = { name: 'userAgent', value: '' };
  const groups = [[userAgent, { name: 'coreType', value: 'Chrome' }]];
  let reply;
  const electronAPI = { send(channel, payload, count) {
    assert.equal(channel, 'util:genRandomFingerprint');
    if (payload.count !== undefined) assert.equal(payload.count, count);
    requestedCounts.push(count);
    requestedInputs.push(payload);
    return Promise.resolve(typeof reply === 'function' ? reply(count) : reply);
  } };
  const button = {}, profileForm = {}, uploadInput = {};
  const modules = {
    './workbench-fingerprint-draft.js': draft,
    './workbench-vue.js': { ...vue, withDirectives: node => node },
    './utils-BIWenCnY.js': { a: fields.findField, i: fields.selectFields, o: fields.readFields, d: fields.applyValues,
      v: () => ({}), s: () => ({}), mt: () => ({}), m: async () => ({}), qt: { Chrome: 'Chrome' },
      h: { window: {
        userBatchWindowInfoV2Create: async params => {
          submitted.push(structuredClone(params)); return { code: 0, msg: '' };
        },
        userImportWindowInfoV2Create: async params => {
          imported.push(JSON.parse(JSON.stringify(params))); return { code: 0, msg: '' };
        },
      } } },
    './agent-BmSFI9WH.js': { n: () => [noop, (...args) => statuses.push(args)] },
    './utils-CnUy4XUk.js': { o: value => Boolean(value) },
    './quick-kroUOSn_.js': { i: () => '' },
    './account-2bDq0W_G.js': { t: { Order: 1 } },
    './createDefaultAccordions-CO1KkbkO.js': { r: {}, t: () => [] },
    './hook-CnJE4hRq.js': { o: {} },
    './rx-input-number-EcSY6ALQ.js': { t: {} },
    './useAsyncGate-D7VA7DLY.js': { n: profileForm },
    './mate-group-CBm6kY0g.js': { t: {} },
    './rx-button-DyzuUt-V.js': { t: button },
    './workbench-profile-import-file.js': { default: uploadInput },
  };
  const stubs = new Proxy(modules, { get: (all, key) => all[key] ?? {} });
  const generate = await rendererFixture(workbench + 'profiles/profile-inputs.mjs', stubs,
    { electronAPI }, 'refreshProfileFingerprint');
  const component = await rendererFixture(workbench + 'profiles/CreateBatch.vue', stubs, { electronAPI });
  const loading = vue.ref(false);
  const shared = {
    collapsed: vue.ref(false), loading, inputsGroup: vue.ref(groups), previewInputs: vue.ref(groups),
    canSubmit: vue.ref(true), createCount: vue.ref(2), profileTemplate: vue.ref({}), metaData: vue.ref({}),
    formGate: { waitUntilReady: async () => {} }, clearGuide: noop, onBack: noop,
    prepareCreateParams: async () => ({ createCount: 2, windowName: 'Fixture', os: 'Linux', coreType: 'Firefox', hardwareConcurrent: '12' }),
  };
  const mount = target => {
    const render = target.setup({ shared }, { expose: noop });
    return () => render({ $t: value => value }, []);
  };
  function findNode(node, match) {
    if (match(node)) return node;
    const children = Array.isArray(node) ? node : (Array.isArray(node?.children) ? node.children : []);
    for (const child of children) {
      const found = findNode(child, match);
      if (found) return found;
    }
  }
  const clickCreate = render => findNode(render(), node => node?.type === button && node.props?.label === '创建窗口')
    .props.onClick({ stopPropagation: noop });
  const mountBatch = mount(component);
  const create = () => clickCreate(mountBatch);

  for (const candidate of [
    malformed,
    { ...second, _fingerprintDraft: { ...second._fingerprintDraft, allocation: ' ' } },
    { ...second, _fingerprintDraft: { ...second._fingerprintDraft, version: undefined } },
    { ...second, _fingerprintDraft: { ...second._fingerprintDraft, userAgent: 'different display text' } },
  ]) {
    reply = [candidate];
    assert.equal((await generate(groups)).length, 0);
    assert.equal(userAgent.invalid, true);
    assert.equal(userAgent.errorMsg, incomplete);
    assert.equal(draft.serializeFingerprintDraft(groups, {})._fingerprintDraft, undefined);
  }
  assert.deepEqual(previewErrors, Array(4).fill(incomplete));
  const old = Promise.withResolvers();
  reply = old.promise;
  const superseded = generate(groups);
  reply = [first];
  assert.equal((await generate(groups)).length, 1, 'a complete retry must succeed');
  old.resolve([malformed]);
  assert.equal((await superseded).length, 0);
  assert.equal(userAgent.invalid, false);
  assert.equal(userAgent.value, first.userAgent);
  assert.equal(draft.serializeFingerprintDraft(groups, {})._fingerprintDraft.profileId, first._fingerprintDraft.profileId);
  assert.equal(previewErrors.length, 4, 'an obsolete bad response must not report an error');

  requestedCounts.length = 0;
  const sparse = [first]; sparse.length = 2;
  for (const candidate of [null, [], [first], [first, second, first], sparse, [first, malformed]]) {
    reply = candidate;
    await create();
    assert.deepEqual(statuses.at(-1), [-1, incomplete]);
    assert.equal(submitted.length, 0, 'the actual batch create callback must not submit invalid previews');
    assert.equal(loading.value, false);
  }
  reply = [first, second];
  const prepare = shared.prepareCreateParams;
  const waitingForProxy = Promise.withResolvers(), proxyChecked = Promise.withResolvers();
  shared.prepareCreateParams = async () => {
    const snapshot = await prepare();
    waitingForProxy.resolve();
    await proxyChecked.promise;
    return snapshot;
  };
  const engineField = groups[0].find(field => field.name === 'coreType');
  engineField.value = 'Firefox';
  const creating = create();
  await waitingForProxy.promise;
  engineField.value = 'Chrome';
  proxyChecked.resolve();
  await creating;
  shared.prepareCreateParams = prepare;
  assert.equal(submitted.length, 1, 'valid previews must allow a retry after failures');
  assert.deepEqual(submitted[0].fingerDetail.map(row => row._fingerprintDraft), [first._fingerprintDraft, second._fingerprintDraft]);
  assert.deepEqual(requestedCounts, Array(7).fill(2));
  assert.deepEqual([requestedInputs.at(-1).os, requestedInputs.at(-1).coreType, requestedInputs.at(-1).hardwareConcurrent],
    ['Linux', 'Firefox', '12'], 'batch generation uses the prepared save snapshot rather than the live form');

  let closedProgress = 0;
  modules['./agent-BmSFI9WH.js'].a = () => ({ currentWorkspace: vue.ref({ id: 'local' }) });
  modules['./useDialog-BC-nc8J-.js'] = { t: () => [() => ({ hideModal: () => closedProgress++ })] };
  const mountImport = mount(await rendererFixture(workbench + 'profiles/CreateFromFile.vue', stubs, { electronAPI }));
  const form = findNode(mountImport(), node => node?.type === profileForm);
  const input = findNode(form.children.before(), node => node?.type === uploadInput);
  input.props.onImportSuccess({ excelData: Array.from({ length: 101 }, () => ({})) });
  requestedCounts.length = 0;
  const rowsForCount = count => Array.from({ length: count }, (_, index) => fixtureRow(`${count}-${index}`));
  reply = count => count === 1 ? [malformed] : rowsForCount(count);
  await clickCreate(mountImport);
  assert.deepEqual(requestedCounts, [100, 1], 'test an incomplete reply after a successful import chunk');
  assert.deepEqual(statuses.at(-1), [-1, '第 101 行：' + incomplete]);
  assert.equal(imported.length, 0, 'the actual import callback must not submit partial previews');
  assert.equal(closedProgress, 1);
  assert.equal(loading.value, false);
  reply = rowsForCount;
  await clickCreate(mountImport);
  assert.equal(imported.length, 1, 'valid import previews must allow a retry after failures');
  assert.equal(imported[0].fingerDetail.length, 101);
  assert.equal(closedProgress, 2);
}

async function main() {
  await tableChecks();
  await accountPageChecks();
  await projectListPageChecks();
  await projectTableScopeChecks();
  await profileTableErrorChecks();
  await compactTableChecks();
  await savedViewDateChecks();
  await inlineRenameChecks();
  await apiChecks();
  await startupSettingsChecks();
  await localPreferenceChecks();
  await navigationChecks();
  await profileBatchChecks();
  await profilePreviewValidationChecks();
  const result = await captureIpcResult(() => {
    throw Object.assign(Error('partial delete'), { code: 'EIO', completed: 200, remainingIds: ['a'], privateField: 'fixture' });
  });
  assert.throws(() => unwrapIpcResult(result), error =>
    error.code === 'EIO' && error.completed === 200 && error.remainingIds[0] === 'a' && !('privateField' in error));
  console.log('WORKBENCH_IPC_SELFTEST OK (table queries, retry, sort preferences, inline rename revisions, local preference snapshots, startup settings, navigation, preview validation and partial error DTO)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
