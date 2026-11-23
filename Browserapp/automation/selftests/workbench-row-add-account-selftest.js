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
  const first = (await bridge.__localApi.window.userGetWindowInfoListList({})).data.rows.find(row => row.id === sourceId);
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
  const { useAccountMenu, useProfileProxyOperations } = vm.runInNewContext(
    [decl(proxyModel, 'accountFields'), decl(proxyModel, 'pick'), decl(proxyModel, 'updateAccounts'),
      'const updateAccountRow = updateAccounts;', decl(profileRow, 'useProfileProxyOperations'),
      decl(profileRow, 'useAccountMenu'), '({useProfileProxyOperations,useAccountMenu})'].join('\n'), bindings);
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
      emit: name => { assert.equal(name, 'close'); formProps.onClose(); }, report: onlyErrorToast,
    });
    return save;
  }
  return {
    calls, cache, activity, errors, row, rowBefore,
    engine: () => engine,
    dismissed: () => dismissed,
    resets: () => resets,
    failReceipt: () => { falseReceipt = true; },
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
