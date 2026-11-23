'use strict';

const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { parse } = require('acorn');
const { BrowserEngine } = require('../../engine');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { createLocalRouteRegistry } = require('../../rebuild/local-route-registry');
const { captureIpcResult } = require('../../shared/ipc-result');

const app = path.resolve(__dirname, '../..');
const frontend = 'frontend/src/workbench/profiles/';
const read = name => fs.readFile(path.join(app, name), 'utf8');
const noop = () => {};
const unsupported = () => { throw Error('Out-of-scope fixture call'); };
const sourceId = 'target-profile';
const otherId = 'unselected-profile';
const oldCredentials = { password: 'synthetic-old-password', totpSecret: 'synthetic-old-2fa' };
const latestCredentials = { password: 'synthetic-latest-password', totpSecret: 'synthetic-latest-2fa' };
const entry = {
  platformUrl: 'https://new.invalid', platformUserName: 'new placeholder',
  platformPassword: 'synthetic-new-password', platformEfa: 'synthetic-new-2fa',
};
const containsFields = (account, fields) =>
  account?.password === fields.password && account?.totpSecret === fields.totpSecret;

function decl(source, name) {
  const node = parse(source, { ecmaVersion: 'latest', sourceType: 'module' }).body.find(item =>
    item.id?.name === name || item.declarations?.[0]?.id.name === name);
  assert.ok(node, name);
  return source.slice(node.start, node.end);
}

function tableDeclarations(source, ...names) {
  const hook = parse(source, { ecmaVersion: 'latest', sourceType: 'module' }).body.find(item =>
    item.declaration?.id?.name === 'useProfileTable').declaration;
  return names.map(name => {
    const node = hook.body.body.find(item => item.type === 'FunctionDeclaration' && item.id.name === name);
    assert.ok(node, name);
    return source.slice(node.start, node.end);
  });
}

async function loadExact(name, overrides) {
  const filename = path.join(app, name);
  const localRequire = createRequire(filename);
  const module = { exports: {} };
  vm.runInNewContext('(function(require, module){' + await read(name) + '\n})',
    { structuredClone }, { filename })(key => Object.hasOwn(overrides, key) ? overrides[key] : localRequire(key), module);
  return module.exports;
}

async function fixture(t, sqlite) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-row-add-account-'));
  const beforeKey = process.env.OPENBROWSER_MASTER_KEY;
  const originalSupports = ProfileStoreSqlite.isSupported;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
  let engine;
  t.after(async () => {
    engine?.sqliteStore?.close();
    ProfileStoreSqlite.isSupported = originalSupports;
    if (beforeKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = beforeKey;
    await fs.rm(root, { recursive: true, force: true });
  });

  // Ordinary DTO mapping/persistence only: fence off production identity
  // normalization, preview, native process work and unrelated local routes.
  const normalizeOrdinary = row => structuredClone(row);
  const dto = await loadExact('rebuild/profile-dto.js',
    { '../engine/profile-sanitizer': { sanitizeProfile: normalizeOrdinary } });
  const routes = await loadExact('rebuild/routes/profiles.js', {
    '../profile-dto': dto,
    '../../engine/profile-sanitizer': { sanitizeProfile: normalizeOrdinary },
    '../fingerprint-draft': { profileFromPreview: unsupported, savePreviewProfiles: unsupported },
  });
  const allowed = new Set(['profiles:query', 'profiles:edit-data', 'profiles:patch']);
  const registry = createLocalRouteRegistry([routes.filter(([name]) => allowed.has(name))]);
  const { LocalService } = await loadExact('rebuild/local-service.js', {
    './profile-dto': dto,
    './local-route-registry': { resolveLocalRoute(method) {
      assert.ok(allowed.has(method), 'only ordinary profile operations may run');
      return registry.resolve(method);
    } },
  });
  async function open() {
    const instance = new BrowserEngine({ getPath: () => root });
    instance.kernelManager = { loadMeta: async () => {} };
    instance.sanitizeProfile = normalizeOrdinary;
    instance.start = unsupported;
    instance.stop = unsupported;
    await instance.init(null);
    assert.equal(instance.usingSqlite, sqlite);
    return instance;
  }
  engine = await open();
  const existing = { url: 'https://old.invalid', username: 'old placeholder', ...oldCredentials };
  await engine.commitProfiles([
    { id: sourceId, number: 1, name: 'Selected', note: 'Keep note', groupId: 'known-project',
      platform: { startUrl: existing.url, username: existing.username, ...oldCredentials, accounts: [existing] } },
    { id: otherId, number: 2, name: 'Unselected', platform: { accounts: [] } },
  ]);
  const service = Object.assign(Object.create(LocalService.prototype), {
    engine, queue: Promise.resolve(), file: path.join(root, 'local.json'),
  });
  const activity = [], cache = [], calls = [], errors = [];
  let drawer, onEvent, dismissed = 0, falseReceipt = false;
  engine.on(event => onEvent?.(event));
  const bridgeCode = (await read('rebuild/renderer-bridge.js')).replace(/^import\s+[\s\S]*?;$/gm, '');
  const bridge = vm.createContext({
    createProfileLifecycleBridge: () => ({ handle: noop }),
    invalidateProfileTableCache: () => activity.push('invalidated'),
    currentScope: () => null,
    $t: key => key,
    rebuild: { onEvent: handler => { onEvent = handler; }, request: (method, payload) => captureIpcResult(() => {
      assert.ok(allowed.has(method));
      calls.push([method, structuredClone(payload)]);
      if (falseReceipt) return false;
      return service.request(method, structuredClone(payload));
    }) },
  });
  vm.runInContext(bridgeCode, bridge);
  bridge.electronAPI.on('local:profiles-change', () => activity.push('table refresh event'));
  const { data: { rows } } = await bridge.__localApi.window.userGetWindowInfoListList({});
  const first = rows.find(row => row.id === sourceId);
  const other = structuredClone(rows.find(row => row.id === otherId));
  assert.equal(first.windowPlatformList.length, 1);
  assert.ok(!first.windowPlatformList[0].platformPassword && !first.windowPlatformList[0].platformEfa);
  // Even if legacy display ID diverges, backend selection must use the row key.
  const row = { ...structuredClone(first), dirId: otherId };
  const rowBefore = structuredClone(row);
  calls.length = 0;

  const profileRow = await read(frontend + 'row/profile-row.mjs');
  const proxyModel = await read(frontend + 'use-profile-proxy.mjs');
  const bindings = { api: bridge.__localApi, unref: value => value, isFunction: value => typeof value === 'function',
    useListCache: () => ({ invalidateCache: key => cache.push(key) }), cacheKeys: { ACCOUNT_LIST: 'accounts' },
    useProxyForm: () => ({}), requestType: { AddPlatform: 'add_platform' }, editKind: { PlatformAdd: 'platform_add' },
    h: (_component, props) => props, NewAccount: {}, $t: key => key };
  const { useAccountMenu, useProfileProxyOperations, updateAccountRow } = vm.runInNewContext(
    [decl(proxyModel, 'accountFields'), decl(proxyModel, 'pick'), decl(proxyModel, 'updateAccounts'),
      'const updateAccountRow = updateAccounts;', decl(profileRow, 'useProfileProxyOperations'),
      decl(profileRow, 'useAccountMenu'), '({useProfileProxyOperations,useAccountMenu,updateAccountRow})'].join('\n'), bindings);
  const drawerInstance = { showDrawer: async options => { drawer = options; }, hideDrawer: () => { dismissed++; } };
  const onlyErrorToast = (code, message) => { if (code !== 0) errors.push(message); };
  const common = { data: row, drawerInstance, onlyErrorToast, workspaceName: 'Fixture', emit: noop };
  const options = useAccountMenu({
    ...common, check: () => true, saveLocalTrack: noop,
    updateProfile: useProfileProxyOperations(common).updateProfile,
  }).getAccountModel().find(item => item.name === 'addPlatformAccount');
  assert.ok(options.visible);

  const formSource = (await read(frontend + 'row/ProfileAccountEditorForm.vue')).split('<script setup>')[1].split('</script>')[0];
  let resets = 0;
  function form(formProps) {
    const save = vm.runInNewContext(decl(formSource, 'save') + '\nsave', {
      pending: { value: false }, addAnother: { value: false }, clone: structuredClone, props: { ...formProps, data: {} },
      form: { value: { reset: () => { resets++; }, setInputsProps: noop } },
      icons: { value: {} }, originalIcons: () => ({}), iconRevision: 0, syncLabels: noop,
      emit: name => { assert.equal(name, 'close'); formProps.onClose?.(); }, report: onlyErrorToast,
    });
    return save;
  }
  const tableSource = await read(frontend + 'use-profile-table.mjs');
  const operations = await read(frontend + 'operations/profile-operations.mjs');
  const handlerSource = decl(operations, 'handlers');
  const addAction = parse(handlerSource, { ecmaVersion: 'latest' }).body[0].declarations[0].init.properties
    .find(node => node.key.name === 'addPlatformAccount');
  assert.ok(addAction);
  let menu;
  const tableDrawer = {
    showDrawer: options => { drawer = options; },
    hideDrawer() { dismissed++; drawer.onHide(); },
  };
  const toolbar = vm.runInNewContext([
    ...tableDeclarations(tableSource, 'ti', 'openActions'),
    `const handlers = {${handlerSource.slice(addAction.start, addAction.end)}};`, decl(operations, 'useProfileOperations'),
    'const runOperation = useProfileOperations({ multipleAccountChange: ti, saveLocalTrack: () => {} });',
    '({ openActions, runOperation });',
  ].join('\n'), {
    o: bridge.__localApi, V: bindings.editKind, z: bindings.requestType, $t: bindings.$t,
    we: updateAccountRow, I: (_component, props) => props, St: {}, toRaw: value => value,
    T2: tableDrawer, K2: onlyErrorToast, dr: () => cache.push('accounts'), i: value => value, ie: value => value,
    Ke2: (_event, options) => { menu = options; },
  });
  return {
    calls, cache, activity, errors, row, rowBefore, other,
    engine: () => engine,
    dismissed: () => dismissed,
    resets: () => resets,
    failReceipt: () => { falseReceipt = true; },
    request: (name, payload) => service.request(name, payload),
    toolbar(operationType, rows = operationType === 'batch' ? [row, other] : row) {
      const action = { name: 'addPlatformAccount' };
      if (operationType === 'single') toolbar.openActions({ event: {}, operation: [action] }, rows);
      const finished = operationType === 'single' ? menu.operationHandler(action)
        : toolbar.runOperation(action, rows, operationType);
      const formProps = drawer.slots.container();
      return { save: form(formProps), close: () => tableDrawer.hideDrawer(), finished };
    },
    async show() {
      await options.command();
      const props = drawer.slots.container();
      return { save: form(props), close: props.onClose };
    },
    async visible() {
      const result = await bridge.__localApi.window.userGetWindowInfoListList({});
      return result.data.rows.find(value => value.id === sourceId);
    },
    async reopen() {
      engine.sqliteStore?.close();
      engine = await open();
      service.engine = engine;
      return engine.profileForEdit(sourceId).profile;
    },
  };
}

for (const sqlite of [true, false]) {
  test(`${sqlite ? 'SQLite' : 'encrypted JSON'}: single row Add Account preserves the latest persisted old fields`,
    { skip: sqlite && !ProfileStoreSqlite.isSupported(), timeout: 10000 }, async t => {
      const f = await fixture(t, sqlite);
      const { save } = await f.show();
      assert.deepEqual(f.calls, [], 'opening the drawer needs no trusted credential detail');
      const live = f.engine().profileForEdit(sourceId).profile;
      // Another ordinary edit changes the old record after the drawer opened.
      await f.engine().commitProfiles([{ ...live, platform: { ...live.platform, ...latestCredentials,
        accounts: [{ ...live.platform.accounts[0], ...latestCredentials }] } }]);
      f.activity.length = 0;
      const base = f.engine().profileForEdit(sourceId).rev;
      await save({ ...entry, id: 'not-an-account-link', accountId: 'not-an-account-link' });
      assert.equal(f.engine().profileForEdit(sourceId).rev, base + 1, 'exactly one selected profile revision advances');
      const saved = await f.reopen();
      assert.equal(saved.platform.accounts.length, 2, 'new inline account is present after reopening storage');
      assert.ok(containsFields(saved.platform.accounts[0], latestCredentials),
        'the already stored synthetic account password and 2FA must not be cleared');
      assert.ok(containsFields(saved.platform.accounts[1], { password: entry.platformPassword, totpSecret: entry.platformEfa }),
        'new synthetic fields are present after reopening storage');
      assert.equal(saved.platform.accounts[1].url, entry.platformUrl);
      assert.equal(saved.platform.accounts[1].accountId, undefined, 'a new inline entry is never treated as a library link');
      assert.equal(saved.note, 'Keep note');
      assert.equal(saved.groupId, 'known-project');
      assert.equal(f.engine().profileForEdit(otherId).profile.platform.accounts.length, 0);
      assert.equal(f.calls.length, 1);
      assert.equal(f.calls[0][0], 'profiles:edit-data');
      const payload = f.calls[0][1];
      assert.equal(payload.type, 'platform_add');
      assert.deepEqual(payload.ids, [sourceId]);
      assert.deepEqual(Object.keys(payload.paramList), ['windowPlatformList']);
      assert.equal(payload.paramList.windowPlatformList.length, 1);
      assert.deepEqual(Object.keys(payload.paramList.windowPlatformList[0]).sort(),
        ['platformEfa', 'platformPassword', 'platformUrl', 'platformUserName']);
      assert.ok(JSON.stringify(f.row) === JSON.stringify(f.rowBefore), 'the shared roster must not store editor inputs or be patched optimistically');
      assert.deepEqual(f.activity, ['invalidated', 'table refresh event']);
      assert.deepEqual(f.cache, ['accounts']);
      assert.deepEqual([f.dismissed(), f.resets(), f.errors.length], [1, 1, 0]);
      const visible = (await f.visible()).windowPlatformList;
      assert.equal(visible.length, 2);
      assert.ok(visible.every(account => !account.platformPassword && !account.platformEfa), 'refresh receives redacted row data');
    });
}

test('cancel, persistence rejection, and an unconfirmed boolean never update the row or close an unsaved draft', { timeout: 10000 }, async t => {
  const f = await fixture(t, false);
  (await f.show()).close();
  assert.deepEqual([f.calls, f.activity, f.cache, f.dismissed()], [[], [], [], 1]);

  const { save } = await f.show();
  const backend = f.engine(), persist = backend.persist;
  const waiting = Promise.withResolvers();
  const started = Promise.withResolvers();
  backend.persist = () => { started.resolve(); return waiting.promise; };
  try {
    const attempt = save(entry);
    await started.promise;
    await save(entry);
    assert.equal(f.calls.length, 1, 'the same pending form cannot submit twice');
    assert.ok(JSON.stringify(f.row) === JSON.stringify(f.rowBefore), 'an inflight save does not change the shared row');
    assert.deepEqual([f.dismissed(), f.resets(), f.cache.length, f.activity.length], [1, 0, 0, 0]);
    waiting.reject(Error('synthetic persistence unavailable'));
    await attempt;
  } finally { backend.persist = persist; }
  assert.equal(f.errors.length, 1);
  assert.deepEqual([f.dismissed(), f.resets(), f.cache.length, f.activity.length], [1, 0, 0, 0]);
  assert.ok(JSON.stringify(f.row) === JSON.stringify(f.rowBefore));
  let durable = await f.reopen();
  assert.equal(durable.platform.accounts.length, 1);
  assert.ok(containsFields(durable.platform.accounts[0], oldCredentials));

  f.failReceipt();
  await (await f.show()).save(entry);
  assert.equal(f.errors.length, 2, 'false payload with code 0 is not a successful receipt');
  assert.deepEqual([f.dismissed(), f.resets(), f.cache.length, f.activity.length], [1, 0, 0, 0]);
  assert.ok(JSON.stringify(f.row) === JSON.stringify(f.rowBefore));
  durable = await f.reopen();
  assert.equal(durable.platform.accounts.length, 1);
  assert.ok(containsFields(durable.platform.accounts[0], oldCredentials));
});

const addPayload = ids => ({ ids, type: 'platform_add', paramList: { windowPlatformList: [entry] } });
const newCredentials = { password: entry.platformPassword, totpSecret: entry.platformEfa };
const capturedAccount = { url: 'https://ordinary.invalid', username: 'Existing entry', ...oldCredentials };

for (const sqlite of [true, false]) {
  const backend = sqlite ? 'SQLite' : 'encrypted JSON';
  const cases = { skip: sqlite && !ProfileStoreSqlite.isSupported(), timeout: 10000 };

  for (const mode of ['single', 'batch']) test(`${backend}: ${mode} toolbar Add sends only an inline draft and keeps the roster redacted`, cases, async t => {
    const f = await fixture(t, sqlite);
    const first = f.toolbar(mode);
    first.close();
    await first.finished;
    assert.deepEqual([f.calls, f.cache, f.activity, f.errors], [[], [], [], []]);
    const form = f.toolbar(mode);
    const ids = mode === 'single' ? [sourceId] : [sourceId, otherId];
    const otherBefore = structuredClone(f.other);
    const before = new Map([sourceId, otherId].map(id => [id, f.engine().profileForEdit(id).rev]));
    const version = f.engine().profiles.version;
    await form.save({ ...entry, id: 'not-a-link', accountId: 'not-a-link', _tempId: 'not-a-persisted-field' });
    assert.deepEqual(f.calls, [['profiles:edit-data', { ...addPayload(ids), requestType: 'add_platform' }]]);
    assert.deepEqual([f.dismissed(), f.resets(), f.errors.length, f.cache.length], [2, 1, 0, 1]);
    await form.finished;
    assert.deepEqual(f.activity, ['invalidated', 'table refresh event']);
    assert.deepEqual(f.row, f.rowBefore, 'the form must not patch roster data in place');
    assert.deepEqual(f.other, otherBefore);
    assert.equal(f.engine().profiles.version, version + ids.length);
    for (const [id, rev] of before) {
      const next = f.engine().profileForEdit(id).rev;
      assert.ok(ids.includes(id) ? next > rev : next === rev);
    }
    const durable = await f.reopen();
    assert.equal(durable.platform.accounts.length, 2);
    assert.ok(containsFields(durable.platform, oldCredentials));
    assert.ok(containsFields(durable.platform.accounts[0], oldCredentials));
    assert.ok(containsFields(durable.platform.accounts[1], newCredentials));
    assert.equal(durable.platform.accounts[1].accountId, undefined);
    assert.equal(f.engine().profileForEdit(otherId).profile.platform.accounts.length, mode === 'batch' ? 1 : 0);
    assert.ok((await f.visible()).windowPlatformList.every(account => !account.platformPassword && !account.platformEfa));
  });

  test(`${backend}: retired, absent, retiring and duplicate targets abort the entire append`, cases, async t => {
    const f = await fixture(t, sqlite);
    const openForm = f.toolbar('batch');
    await f.engine().trashProfiles([otherId]);
    const healthy = f.engine().profileForEdit(sourceId);
    const archived = f.engine().profileForEdit(otherId);
    const reject = (ids, code) => assert.rejects(f.request('profiles:edit-data', addPayload(ids)), { code });
    await reject([sourceId, otherId], 'PROFILE_INACTIVE');
    await reject([sourceId, 'absent-profile'], 'PROFILE_NOT_FOUND');
    await reject([sourceId, sourceId], 'PROFILE_COMMAND_DUPLICATE');
    f.engine().deletingProfiles.add(sourceId);
    try { await reject([sourceId], 'PROFILE_DELETING'); }
    finally { f.engine().deletingProfiles.delete(sourceId); }
    await openForm.save(entry);
    assert.deepEqual([f.dismissed(), f.resets(), f.errors.length, f.cache.length], [0, 0, 1, 0]);
    openForm.close();
    await openForm.finished;
    assert.deepEqual(f.engine().profileForEdit(sourceId), healthy);
    assert.deepEqual(f.engine().profileForEdit(otherId), archived);
    assert.deepEqual(await f.reopen(), healthy.profile);
    assert.deepEqual(f.engine().profileForEdit(otherId).profile, archived.profile);
  });

  test(`${backend}: a missing ID cannot be coerced into a different real active ID`, cases, async t => {
    const f = await fixture(t, sqlite);
    const id = 'null';
    await f.engine().commitProfiles([{ id, name: 'Exact string key', platform: { accounts: [] } }]);
    const before = f.engine().profileForEdit(sourceId);
    await assert.rejects(f.request('profiles:edit-data', addPayload([sourceId, null])), /Invalid profile id/);
    await assert.rejects(f.request('profiles:edit-data', addPayload([])), /窗口选择数量无效/);
    await assert.rejects(f.request('profiles:edit-data', addPayload(Array(201).fill(sourceId))), /窗口选择数量无效/);
    assert.deepEqual(f.engine().profileForEdit(sourceId), before);
    assert.equal(f.engine().profileForEdit(id).profile.platform.accounts.length, 0);
    assert.equal(await f.request('profiles:edit-data', addPayload([id])), true);
    await f.reopen();
    assert.equal(f.engine().profileForEdit(id).profile.platform.accounts.length, 1);
  });

  test(`${backend}: 19 to 20 commits; a later target already at 20 rejects the batch`, cases, async t => {
    const f = await fixture(t, sqlite);
    const many = (id, count) => {
      const { profile } = f.engine().profileForEdit(id);
      return { ...profile, platform: { ...profile.platform, ...capturedAccount,
        accounts: Array.from({ length: count }, () => ({ ...capturedAccount })) } };
    };
    await f.engine().commitProfiles([many(sourceId, 19), many(otherId, 19)]);
    assert.equal(await f.request('profiles:edit-data', addPayload([otherId])), true);
    const first = f.engine().profileForEdit(sourceId);
    const second = f.engine().profileForEdit(otherId);
    assert.equal(second.profile.platform.accounts.length, 20);
    await assert.rejects(f.request('profiles:edit-data', addPayload([sourceId, otherId])), /最多 20/);
    assert.deepEqual(f.engine().profileForEdit(sourceId), first);
    assert.deepEqual(f.engine().profileForEdit(otherId), second);
    assert.equal((await f.reopen()).platform.accounts.length, 19);
    const saved = f.engine().profileForEdit(otherId).profile.platform.accounts;
    assert.equal(saved.length, 20);
    assert.ok(containsFields(saved.at(-1), newCredentials));
  });

  for (const fail of ['projection', 'notification']) test(`${backend}: ${fail} failure after append does not invite a retry`, cases, async t => {
    const f = await fixture(t, sqlite);
    const engine = f.engine(), { status, emit } = engine;
    const form = await f.show();
    const code = Object.assign(Error('Fixture late failure'), { code: 'EIO' });
    if (fail === 'projection') engine.status = () => { throw code; };
    else engine.emit = function (event) {
      if (event.action === 'profiles-update') throw code;
      return emit.call(this, event);
    };
    try { await form.save(entry); }
    finally { Object.assign(engine, { status, emit }); }
    const saved = (await f.reopen()).platform.accounts;
    assert.equal(saved.length, 2);
    assert.ok(containsFields(saved[0], oldCredentials));
    assert.ok(containsFields(saved[1], newCredentials));
    assert.deepEqual([f.calls.length, f.dismissed(), f.resets(), f.errors.length], [1, 1, 1, 0]);
  });

  test(`${backend}: real write boundary ENOSPC rejects and retains every prior target`, cases, async t => {
    const f = await fixture(t, sqlite);
    const engine = f.engine(), { rename } = fs;
    const store = engine.sqliteStore, save = store?.saveProfilesDiffed;
    const error = Object.assign(Error('Fixture write boundary failed'), { code: 'ENOSPC' });
    const first = engine.profileForEdit(sourceId).profile, other = engine.profileForEdit(otherId).profile;
    let reached = 0;
    if (sqlite) store.saveProfilesDiffed = function (profiles) {
      save.call(this, profiles); // The outer real transaction must roll back both rows.
      reached++;
      throw error;
    };
    else fs.rename = async (source, destination) => {
      if (destination !== engine.stateFile) return rename(source, destination);
      reached++;
      throw error;
    };
    try { await assert.rejects(f.request('profiles:edit-data', addPayload([sourceId, otherId])), e => e === error); }
    finally { if (sqlite) store.saveProfilesDiffed = save; else fs.rename = rename; }
    assert.equal(reached, 1);
    assert.deepEqual(f.engine().profileForEdit(sourceId).profile, first);
    assert.deepEqual(f.engine().profileForEdit(otherId).profile, other);
    assert.deepEqual(await f.reopen(), first);
    assert.deepEqual(f.engine().profileForEdit(otherId).profile, other);
  });
}

test('batch toolbar stays open for an unconfirmed response and ignores duplicate submits while pending', { timeout: 10000 }, async t => {
  const f = await fixture(t, false);
  const form = f.toolbar('batch');
  f.failReceipt();
  const saving = form.save(entry);
  await form.save(entry);
  await saving;
  assert.deepEqual([f.calls.length, f.dismissed(), f.resets(), f.errors.length, f.cache.length], [1, 0, 0, 1, 0]);
  assert.deepEqual(f.row, f.rowBefore);
  assert.equal((await f.reopen()).platform.accounts.length, 1);
  form.close();
  await form.finished;
});
