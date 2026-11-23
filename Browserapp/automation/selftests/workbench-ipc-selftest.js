'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { setImmediate: tick } = require('node:timers/promises');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { captureIpcResult, unwrapIpcResult } = require('../../shared/ipc-result');

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

async function main() {
  await tableChecks();
  await compactTableChecks();
  await savedViewDateChecks();
  await apiChecks();
  await navigationChecks();
  await profileBatchChecks();
  const result = await captureIpcResult(() => {
    throw Object.assign(Error('partial delete'), { code: 'EIO', completed: 200, remainingIds: ['a'], privateField: 'fixture' });
  });
  assert.throws(() => unwrapIpcResult(result), error =>
    error.code === 'EIO' && error.completed === 200 && error.remainingIds[0] === 'a' && !('privateField' in error));
  console.log('WORKBENCH_IPC_SELFTEST OK (table query, latest response, pagination recovery, compact refresh failures, settings queue, initial navigation and partial error DTO)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
