'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setImmediate: tick } = require('node:timers/promises');
const { test } = require('node:test');
const vm = require('node:vm');
const { parse } = require('acorn');
const vue = require('vue');
const { LocalService } = require('../../rebuild/local-service');
const { captureIpcResult } = require('../../shared/ipc-result');

const readSource = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');
const source = readSource('frontend/src/workbench/profiles/use-profile-table.mjs');
const operationSource = readSource('frontend/src/workbench/profiles/operations/profile-operations.mjs');
const tree = js => parse(js, { ecmaVersion: 'latest', sourceType: 'module' }).body;
const take = (js, node) => js.slice(node.start, node.end);
const useProfileTable = tree(source).find(entry => entry.declaration?.id?.name === 'useProfileTable').declaration;
const setup = useProfileTable.body.body.find(node => node.declarations?.[0]?.init?.callee?.name === 'useProfileDelete');
const helper = tree(source).find(node => node.id?.name === 'useProfileDelete');
const methods = tree(operationSource);
const handler = methods.find(node => node.declarations?.[0]?.id.name === 'handlers')
  .declarations[0].init.properties.find(node => node.key.name === 'delete');
const runOperation = methods.find(node => node.id?.name === 'useProfileOperations');
const updates = methods.find(node => node.id?.name === 'useProfileUpdates');
const bridge = readSource('rebuild/renderer-bridge.js').replace(/^import\s+[\s\S]*?;$/gm, '');
async function fixture() {
  const tableModule = await import('../../rebuild/workbench-table.mjs');
  const group = 'opaque,A';
  const profiles = new Map([
    ['a1', { id: 'a1', groupId: group, name: 'Alpha 1', number: 1 }],
    ['a2', { id: 'a2', groupId: group, name: 'Alpha 2', number: 2 }],
    ['b1', { id: 'b1', groupId: 'B', name: 'Beta 1', number: 3 }],
  ]);
  const service = Object.assign(Object.create(LocalService.prototype), {
    data: { groups: [], settings: {} }, load: async () => {},
    engine: { profiles, status: () => [...profiles.values()].map(row => ({ ...row })) },
  });
  const route = vue.reactive({ name: 'project-item', params: { id: group } });
  const workspace = vue.reactive({ currentWorkspace: { id: 'local' } });
  const props = vue.reactive({ currentFilter: { id: 'all' }, inactive: false });
  const params = vue.reactive({ page_index: 3, page_size: 10, queryKey: 'name', queryValue: 'Alpha',
    projectIds: ['B'], scopeProjectId: 'B' });
  const row = (id, projectId = group) => ({ id, dirId: id, projectId });
  const page = vue.ref([row('a1'), row('a2')]), selection = vue.ref([page.value[0]]);
  const tableRef = vue.shallowRef({ getParams: () => ({ ...params }), getDataList: () => page.value });
  const reads = [], removals = [], warnings = [], disposers = [];
  let pauseClosed, pauseRead, canPurge = true;
  const renderer = vm.createContext({
    $t: value => value, createProfileLifecycleBridge: () => ({}),
    rebuild: {
      async request(method, input) {
        const payload = structuredClone(input);
        if (method === 'profiles:query') {
          reads.push(payload);
          const result = await captureIpcResult(() => service.request(method, payload));
          const held = pauseRead;
          pauseRead = null;
          await held?.promise;
          return result;
        }
        assert.ok(['profiles:delete', 'profiles:purge'].includes(method), 'unexpected IPC: ' + method);
        // These tests verify the real command/payload at the transport only.
        // The engine never has a trash or purge method, and cannot write data.
        removals.push([method, payload]);
        return { success: true };
      },
    },
  });
  vm.runInContext(bridge, renderer);
  const api = renderer.__localApi;
  const effects = vue.effectScope();
  const controller = effects.run(() => vm.runInNewContext([
    take(source, helper), take(operationSource, updates),
    'const { batchModifyWindow: xr } = useProfileUpdates({ onlyErrorToast: K2, onRefreshTable() { throw Error("duplicate refresh"); } });',
    take(source, setup),
    'const handlers = {' + take(operationSource, handler) + '};', take(operationSource, runOperation),
    '({ confirmation: deleteConfirmation, run: useProfileOperations({ deleteProfile: requestProfileDelete, saveLocalTrack() {} }) })',
  ].join('\n'), {
    ...tableModule, tableRef, selection, props, g2: route, rn: workspace, o: api, api,
    S: vue.ref, ue: vue.watch, x: fn => disposers.push(fn), toRaw: vue.toRaw, $t: value => value,
    z: { Delete: 'Delete' }, check: () => canPurge,
    K2: (code, message) => { if (code !== 0) warnings.push(message); },
    Qn: async rows => {
      const held = pauseClosed;
      pauseClosed = null;
      await held?.promise;
      return rows;
    },
  }));
  return {
    group, profiles, route, workspace, props, params, page, selection, reads, removals, warnings,
    dialog: () => controller.confirmation.value,
    remove: (mode = 'batch', targets = mode === 'single' ? page.value[0] : selection.value) =>
      controller.run({ name: 'delete' }, targets, mode),
    holdIPC() { const gate = pauseRead = Promise.withResolvers(); return gate.resolve; },
    holdClosed() { const gate = pauseClosed = Promise.withResolvers(); return gate.resolve; },
    revokePurge: () => { canPurge = false; },
    dispose() { disposers.forEach(dispose => dispose()); effects.stop(); },
  };
}

test('a project A → B → A round trip or hidden table invalidates each async preflight stage', async () => {
  const f = await fixture();
  const releaseClosed = f.holdClosed();
  const old = f.remove();
  f.route.params.id = 'B';
  f.route.params.id = f.group;
  assert.equal(await old, false, 'cancellation completes even if the original read stalls');
  releaseClosed();
  await tick();
  assert.equal(f.reads.length, 0, 'a stale process check may not start an authoritative read');

  const releaseOld = f.holdIPC();
  const switched = f.remove();
  await tick();
  assert.equal(f.reads.length, 1);
  f.props.inactive = true;
  f.props.inactive = false;
  assert.equal(await switched, false);
  f.selection.value = [f.page.value[1]];
  const newer = f.remove();
  await tick();
  const dialog = f.dialog();
  assert.ok(dialog);
  releaseOld();
  await tick();
  assert.equal(f.dialog(), dialog, 'an old response may not replace a later confirmation');
  dialog.cancel();
  assert.equal(await newer, false);
  assert.deepEqual(f.removals, []);
  assert.deepEqual(f.warnings, []);
  f.dispose();
});

test('a visible dialog closes on selection, filter, page, workspace, or unmount changes', async () => {
  for (const change of [
    f => { f.selection.value = [f.page.value[1]]; },
    f => { f.params.queryValue = 'Beta'; f.params.queryValue = 'Alpha'; },
    f => { f.params.page_index = 4; },
    f => { f.props.currentFilter.id = 'favorites'; },
    f => { f.workspace.currentWorkspace.id = 'new-workspace'; },
    f => f.dispose(),
  ]) {
    const f = await fixture();
    const done = f.remove();
    await tick();
    const oldDialog = f.dialog();
    oldDialog.permanent = true;
    change(f);
    assert.equal(await done, false);
    assert.equal(f.dialog(), null);
    assert.equal(await oldDialog.accept(), false, 'a stale callback may not dispatch either command');
    assert.equal(f.reads.length, 1, 'stale clicks do not restart validation');
    assert.deepEqual(f.removals, []);
    f.dispose();
  }
});

test('the final check rejects a late scope switch and a target moved or started outside the rendered table', async () => {
  for (const change of [
    f => { f.profiles.get('a1').groupId = 'B'; },
    f => { f.profiles.get('a1').running = true; },
    f => { f.profiles.get('a1').name = 'No longer matches'; },
    f => { f.profiles.get('a1').trashed = true; },
    f => f.revokePurge(),
  ]) {
    const f = await fixture();
    const done = f.remove();
    await tick();
    f.dialog().permanent = true;
    change(f);
    assert.equal(await f.dialog().accept(), false);
    assert.equal(await done, false);
    assert.equal(f.reads.length, 2);
    assert.deepEqual(f.removals, []);
    f.dispose();
  }

  const f = await fixture();
  const pending = f.remove();
  await tick();
  const dialog = f.dialog();
  const release = f.holdIPC();
  const accepting = dialog.accept();
  await tick();
  assert.equal(f.reads.length, 2);
  f.route.params.id = 'B';
  f.route.params.id = f.group;
  release();
  assert.equal(await accepting, false);
  assert.equal(await pending, false);
  assert.deepEqual(f.removals, []);
  f.dispose();
});

test('an unchanged row action requires no checkbox and batch/single confirmations dispatch only their snapshot once', async () => {
  for (const [mode, permanent, method] of [['batch', true, 'profiles:purge'], ['single', false, 'profiles:delete']]) {
    const f = await fixture();
    const expected = mode === 'batch' ? ['a1', 'a2'] : ['a1'];
    f.selection.value = mode === 'batch' ? f.page.value : [];
    const done = f.remove(mode);
    await tick();
    const dialog = f.dialog();
    assert.ok(dialog);
    dialog.permanent = permanent;
    const release = f.holdIPC();
    const confirming = dialog.accept();
    assert.equal(await dialog.accept(), false, 'a double click may not dispatch twice');
    await tick();
    assert.deepEqual(f.removals, []);
    release();
    assert.equal(await confirming, true);
    assert.equal(await done, true);
    assert.deepEqual(f.reads, [0, 1].map(() => ({
      queryKey: 'name', queryValue: 'Alpha', page_index: 1, page_size: expected.length,
      scopeProjectId: f.group, dirIds: expected, isDelete: 0,
    })), 'both reads use the exact opaque project and normal filter contract, rather than broadening the search');
    assert.deepEqual(f.removals, [[method, { ids: expected }]]);
    assert.equal(f.dialog(), null);
    f.dispose();
  }
});
