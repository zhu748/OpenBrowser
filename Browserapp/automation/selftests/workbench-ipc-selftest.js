'use strict';

const assert = require('node:assert/strict');
const { setImmediate: tick } = require('node:timers/promises');
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

  const closing = table.load();
  await tick();
  table.dispose();
  reads[5].reject(Error('closed view'));
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

async function navigationChecks() {
  const { installWorkspaceNavigation } = await import('../../rebuild/workbench-navigation.mjs');
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
  await apiChecks();
  await navigationChecks();
  await profileBatchChecks();
  const result = await captureIpcResult(() => {
    throw Object.assign(Error('partial delete'), { code: 'EIO', completed: 200, remainingIds: ['a'], privateField: 'fixture' });
  });
  assert.throws(() => unwrapIpcResult(result), error =>
    error.code === 'EIO' && error.completed === 200 && error.remainingIds[0] === 'a' && !('privateField' in error));
  console.log('WORKBENCH_IPC_SELFTEST OK (table query, latest response, pagination recovery, settings queue, initial navigation and partial error DTO)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
