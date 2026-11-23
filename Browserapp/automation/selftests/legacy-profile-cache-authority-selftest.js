'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const OpenBrowserUiState = require('../../ui/ui-state-store');
const OpenBrowserProfileState = require('../../ui/ui-profile-state');
const OpenBrowserStatusController = require('../../ui/ui-status-controller');

const filename = path.join(__dirname, '../../renderer.js');
const source = fs.readFileSync(filename, 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first + 1);
  assert.ok(first !== -1 && last > first, start);
  return source.slice(first, last);
}
const beforeInit = new vm.Script([
  'const UI_KEY = "openbrowser-ui-state";',
  section('function createGroupId()', '\nfunction normalizeOptionalWebUrl'),
  section('function mergeEngineExitState(', '\nasync function createUiProfiles('),
  section('const uiStateStore =', '\nfunction normalizeGroup'),
  section('function normalizeGroup(', '\nlet profileSort'),
  section('function save()', '\nfunction textDelayRange'),
  section('const statusController =', '\nconst __statusRefresher'),
].join('\n'), { filename });
const init = new vm.Script(section('async function initialize()', '\n// 共享 CSV') + '\nappInitialization;', { filename });
const groupsController = new vm.Script(fs.readFileSync(path.join(__dirname, '../../ui/ui-groups.js'), 'utf8'));

const legacyGroup = { id: 'g-old', name: 'Old group', color: '#123456', sort: 0, note: '', createdAt: '2026-01-01T00:00:00.000Z' };
const legacyLog = { time: '01:02:03', module: 'Local', message: 'Previous activity' };
const legacy = { id: 'saved-legacy', number: 7, name: 'Old record', note: 'keep this note', groupId: legacyGroup.id, rev: 1 };
const original = JSON.stringify({ profiles: [legacy], groups: [legacyGroup], logs: [legacyLog], nextProfileNumber: 8 }, null, 2);
const other = { id: 'different', number: 9, name: 'Current' };
const noop = () => {};

function fixture(raw, { localError, status = [], locale = 'zh-CN' } = {}) {
  const writes = [], syncs = [], renders = [], timers = new Map(), listeners = new Map(), notices = [], statusCalls = [];
  const nodes = new Map(), clicked = [], confirms = [], patches = [], groupLogs = [];
  function createElement(tag) {
    return { tag, children: [], events: new Map(), setAttribute: noop,
      append(...children) { this.children.push(...children); }, addEventListener(name, handler) { this.events.set(name, handler); } };
  }
  const table = { before(node) { nodes.set('#' + node.id, node); } };
  nodes.set('#profile-table', { closest: () => table });
  nodes.set('#create-profile', { addEventListener(event, fn) { this[event] = fn; } });
  nodes.set('#quick-create', { addEventListener: noop });
  for (const id of ['group-create', 'group-form', 'clear-logs']) {
    nodes.set('#' + id, { addEventListener(event, fn) { this[event] = fn; } });
  }
  for (const id of ['group-edit-id', 'group-name', 'group-note', 'group-color', 'group-dialog-title']) nodes.set('#' + id, { value: '', addEventListener: noop });
  nodes.set('#group-dialog', { open: false, showModal() { this.open = true; }, close() { this.open = false; } });
  let timer = 0, failure = localError, reply = status, confirm, writeError;
  const context = vm.createContext({
    window: {
      OpenBrowserUiState, OpenBrowserProfileState, OpenBrowserStatusController,
      OpenBrowserI18n: { getLocale: () => locale },
      addEventListener: (event, handle) => listeners.set(event, handle),
      openWorkbenchEditorMode(...args) { clicked.push(args); },
      ops: {
        getInfo: async () => ({}), getSyncState: async () => ({}), getProfileStorage: async () => ({ warnings: [] }),
        async profileStatus() { statusCalls.push('full'); return structuredClone(await reply); },
        async profileStatusDelta() { return { full: true, rows: structuredClone(await reply) }; },
        async syncProfiles(rows) { syncs.push(structuredClone(rows)); return rows; },
      },
    },
    document: { getElementById: id => nodes.get('#' + id) ?? null, querySelector: () => null, createElement },
    $: selector => nodes.get(selector) ?? null,
    localStorage: {
      getItem() { if (failure) { const error = failure; failure = undefined; throw error; } return raw; },
      setItem(key, value) {
        assert.equal(key, 'openbrowser-ui-state', 'do not copy an old raw cache to another key');
        if (writeError) throw writeError;
        writes.push(value); raw = value;
      },
    },
    setTimeout(callback) { timers.set(++timer, callback); return timer; }, clearTimeout: id => timers.delete(id),
    structuredClone, normalizeProfileSettings: row => ({ ...row }),
    listGroups: () => vm.runInContext('ui.groups', context), findGroup: id => context.listGroups().find(group => group.id === id),
    countProfilesInGroup: id => vm.runInContext('ui.profiles', context).filter(row => row.groupId === id).length,
    GROUP_COLORS: ['#245cff'], UNGROUPED_ID: '', activeGroupFilter: 'all',
    fillGroupSelect: noop, invalidateViewCache: noop,
    async confirmAction(options) { confirms.push(options); return await confirm; },
    async commitProfilePatches(entries) {
      patches.push(...structuredClone(entries));
      const byId = new Map(entries.map(entry => [entry.id, entry.patch]));
      for (const row of vm.runInContext('ui.profiles', context)) {
        if (byId.has(row.id)) Object.assign(row, byId.get(row.id));
      }
    },
    profileListCache: { invalidate: noop }, notifyStorageQuotaExceeded: noop, console: { warn: noop, error: noop },
    engineProfiles: [], syncSettings: {}, syncState: {}, preferredMasterId: null, editingProfileId: null, openCreateProfileDialog: noop,
    refreshLocaleChrome: noop, applyVersionTrafficLight: noop, updateEngineBadge: noop, renderRuntimeInfo: noop,
    applySyncSettings: noop, fillSyncSettingsForm: noop, refreshProxies: async () => {},
    refreshSessions: async () => {}, refreshExtensions: async () => {},
    renderProfiles() {
      renders.push(vm.runInContext('Array.from(ui.profiles, row => row.id)', context).join(','));
      vm.runInContext("if (typeof renderLegacyProfileCacheStatus === 'function') renderLegacyProfileCacheStatus();", context);
    },
    renderLogs: noop, log: (domain, message) => { if (domain === 'Group') groupLogs.push(message); },
    t: key => key, tx: key => key, toast: message => notices.push(message),
    switchView: noop, mergeRemoteProxy: (_local, remote) => remote, proxyHasCredentials: () => false, proxyLibraryItem: () => null,
  });
  groupsController.runInContext(context);
  beforeInit.runInContext(context);
  vm.runInContext(section("$('#create-profile').addEventListener(", '\n// group filter chips'), context);
  vm.runInContext(section('// groups page actions', "\ndocument.getElementById('batch-assign-group-btn')"), context);
  vm.runInContext(section('async function toggleProfileFavorite(', '\nfunction exportProfile'), context);
  vm.runInContext(section("$('#clear-logs').addEventListener(", "\n$('#choose-profile-storage')"), context);
  const evaluate = code => vm.runInContext(code, context, { filename });
  return {
    start: () => init.runInContext(context), evaluate, writes, syncs, renders, notices, statusCalls, clicked, confirms, patches, groupLogs,
    get banner() { return nodes.get('#legacy-profile-cache-status'); },
    create: () => nodes.get('#create-profile').click(),
    createGroup: () => nodes.get('#group-create').click(),
    submitGroup(id, name, value = 'save') {
      for (const [selector, field] of [['#group-edit-id', id], ['#group-name', name], ['#group-color', '#123456']]) nodes.get(selector).value = field;
      return nodes.get('#group-form').submit({ preventDefault: noop, submitter: { value } });
    },
    clearLogs: () => nodes.get('#clear-logs').click(),
    decide: next => { confirm = next; },
    failWrites: () => { writeError = Error('fixture write failure'); },
    get groupDialogOpen() { return nodes.get('#group-dialog').open; },
    stored: () => raw, reply: next => { reply = next; },
    exerciseWrites() {
      evaluate('save(); uiStateStore.request();');
      for (const [id, callback] of timers) { timers.delete(id); callback(); }
      evaluate('uiStateStore.request();'); listeners.get('pagehide')();
      evaluate('uiStateStore.request();'); listeners.get('beforeunload')();
    },
  };
}

test('classic early, scheduled and unload saves do not overwrite unknown or degraded history', async () => {
  const degraded = JSON.stringify({ profiles: [legacy], logs: [], degraded: true }, null, 2);
  for (const [bytes, options] of [[original, { localError: Object.assign(Error('fixture denied'), { name: 'SecurityError' }) }],
    [degraded, {}], ['{ "profiles" : null }', {}], ['{ "profiles" : [null] }', {}]]) {
    const gate = Promise.withResolvers();
    const view = fixture(bytes, { ...options, status: gate.promise });
    assert.equal(view.stored(), bytes, 'top-level save must leave the original key byte-for-byte');
    const starting = view.start();
    view.exerciseWrites();
    assert.deepEqual(view.writes, [], 'no direct, scheduled or unload save while host authority is pending');
    gate.resolve([other]); await starting;
    view.exerciseWrites();
    assert.equal(view.stored(), bytes, 'unmatched or unknown history remains on the original key');
    assert.deepEqual(view.writes, []);
    assert.deepEqual(view.syncs, []);
    assert.equal(view.renders.at(-1), 'different', 'only verified host rows become normal list entries');
    assert.equal(view.banner.hidden, false, 'unresolved history stays visible when current rows can render');
  }
});

test('classic retains cache-only rows through empty, EIO and malformed host status; a later good read recovers', async () => {
  for (const kind of ['empty', 'EIO', 'malformed']) {
    const pending = Promise.withResolvers();
    const view = fixture(original, { status: pending.promise });
    const starting = view.start();
    if (kind === 'EIO') pending.reject(Error('fixture status EIO'));
    else pending.resolve(kind === 'malformed' ? [null] : []);
    await starting;
    view.exerciseWrites();
    assert.deepEqual(view.syncs, [], 'a cached ID must never be sent as startup synchronization');
    assert.deepEqual(view.writes, []);
    assert.equal(view.stored(), original);
    assert.equal(view.renders.at(-1), '', 'an unconfirmed cached row is not an active row');
    view.reply([other]);
    if (kind === 'empty') await view.evaluate('statusController.refresh()');
    else {
      assert.equal(view.banner.children[1].hidden, false, 'a failed authority read can be retried');
      await view.banner.children[1].events.get('click')();
      assert.equal(view.banner.children[1].hidden, true);
    }
    assert.equal(view.evaluate('Array.from(ui.profiles, row => row.id).join(",")'), 'different');
    assert.equal(view.stored(), original, 'recovery must not erase an unmatched old row');
  }
});

test('classic fresh empty and healthy matching history resume ordinary saving after confirmation', async () => {
  const virgin = fixture(null);
  assert.deepEqual(virgin.writes, []);
  await virgin.start();
  assert.deepEqual(virgin.syncs, []);
  assert.equal(virgin.renders.at(-1), '');
  assert.deepEqual(JSON.parse(virgin.stored()).profiles, []);
  assert.equal(JSON.parse(virgin.stored()).groups[0].id, 'grp-default');
  assert.equal(virgin.banner, undefined, 'confirmed first run shows no recovery warning');
  virgin.create();
  assert.equal(virgin.clicked[0][0], 'single', 'confirmed first run can use the existing normal create entry');
  const available = fixture(original, { localError: Error('temporary local read failure'),
    status: [{ id: legacy.id, name: 'Authoritative', number: 7, rev: 1 }] });
  assert.equal(available.stored(), original);
  await available.start();
  assert.deepEqual(available.syncs, []);
  assert.equal(available.renders.at(-1), legacy.id);
  const [retained] = JSON.parse(available.stored()).profiles;
  assert.deepEqual([retained.name, retained.note], ['Authoritative', legacy.note]);
  assert.deepEqual(JSON.parse(available.stored()).groups, [legacyGroup], 'recovered group metadata survives the first authorized save');
  assert.deepEqual(JSON.parse(available.stored()).logs, [legacyLog], 'recovered log metadata survives the first authorized save');
  available.exerciseWrites();
  assert.ok(available.writes.length > 1, 'healthy source and authority do not leave the cache permanently blocked');
});

test('protected classic group actions and adjacent local changes report the block before side effects', async () => {
  const view = fixture(original, { status: [other] });
  await view.start();
  view.createGroup();
  assert.equal(view.groupDialogOpen, false, 'a protected create must not open an unsavable dialog');
  view.evaluate('openGroupDialog(findGroup("g-old"));');
  assert.equal(view.groupDialogOpen, false, 'a protected edit must not open an unsavable dialog');
  view.submitGroup('', 'New group');
  view.submitGroup(legacyGroup.id, 'Changed');
  await view.evaluate('deleteGroup("g-old");');
  await view.evaluate('toggleProfileFavorite("different");');
  view.clearLogs();
  assert.equal(view.evaluate('ui.groups[0].name'), legacyGroup.name);
  assert.equal(view.evaluate('ui.groups.length'), 1);
  assert.equal(view.evaluate('Boolean(ui.profiles[0].favorite)'), false);
  assert.equal(view.evaluate('ui.logs[0].message'), legacyLog.message);
  assert.equal(view.notices.length, 7, 'each rejected action gives visible feedback');
  assert.ok(view.notices.every(text => /本地缓存受保护/.test(text)));
  assert.deepEqual([view.confirms, view.patches, view.groupLogs, view.writes], [[], [], [], []]);
  assert.equal(view.stored(), original);
  const english = fixture(original, { status: [other], locale: 'en' });
  await english.start();
  english.createGroup();
  assert.match(english.banner.children[0].textContent, /Unverified records/);
  assert.equal(english.notices.at(-1), 'This change cannot be saved while the local cache is protected.');
});

test('classic group actions remain usable when writable and recheck permission after delayed confirmation', async () => {
  const host = [{ ...legacy, favorite: false }];
  const view = fixture(original, { status: host });
  await view.start();
  view.createGroup();
  assert.equal(view.groupDialogOpen, true);
  view.submitGroup('', 'New group');
  assert.equal(view.groupDialogOpen, false);
  assert.equal(JSON.parse(view.stored()).groups[1].name, 'New group');
  view.submitGroup(legacyGroup.id, 'Changed');
  assert.equal(JSON.parse(view.stored()).groups[0].name, 'Changed');
  await view.evaluate('toggleProfileFavorite("saved-legacy")');
  assert.equal(JSON.parse(view.stored()).profiles[0].favorite, true);
  view.clearLogs();
  assert.deepEqual(JSON.parse(view.stored()).logs, []);
  const decision = Promise.withResolvers();
  view.decide(decision.promise);
  const deleting = view.evaluate('deleteGroup("g-old");');
  assert.equal(view.confirms.length, 1);
  view.evaluate('profileCacheWritable = false;');
  decision.resolve(true);
  await deleting;
  assert.deepEqual(view.patches, [], 'a stale confirmation must not reach the host after writes become protected');
  assert.equal(view.evaluate('ui.groups[0].name'), 'Changed');
  assert.match(view.notices.at(-1), /本地缓存受保护/);
  view.evaluate('profileCacheWritable = true;');
  view.decide(false);
  await view.evaluate('deleteGroup("g-old");');
  assert.deepEqual(view.patches, [], 'cancelling remains side-effect free');
  view.decide(true);
  await view.evaluate('deleteGroup("g-old");');
  assert.deepEqual(view.patches, [{ id: legacy.id, patch: { groupId: '' } }]);
  assert.deepEqual(JSON.parse(view.stored()).groups.map(group => group.name), ['New group']);
  assert.equal(view.notices.at(-1), '已删除分组');
});

test('writable classic group save does not close or claim success if local storage fails', async () => {
  const view = fixture(original, { status: [legacy] });
  await view.start();
  view.createGroup();
  view.failWrites();
  view.submitGroup('', 'New group');
  assert.equal(view.groupDialogOpen, true, 'the rejected group draft remains available');
  assert.equal(view.evaluate('ui.groups.length'), 1, 'a failed local write must not publish a new group');
  assert.deepEqual(view.groupLogs, []);
  assert.match(view.notices.at(-1), /未能保存本地更改/);
  await view.evaluate('toggleProfileFavorite("saved-legacy")');
  assert.equal(view.evaluate('Boolean(ui.profiles[0].favorite)'), false, 'a failed local write must not publish Favorite');
  assert.match(view.notices.at(-1), /未能保存本地更改/);
  view.clearLogs();
  assert.equal(view.evaluate('ui.logs[0].message'), legacyLog.message, 'a failed local write must not claim cleared logs');
  assert.match(view.notices.at(-1), /未能保存本地更改/);
  view.decide(true);
  await view.evaluate('deleteGroup("g-old");');
  assert.deepEqual(view.patches, [{ id: legacy.id, patch: { groupId: '' } }]);
  assert.equal(view.evaluate('ui.profiles[0].groupId'), '', 'successful host reassignment is not rolled back or reported as unchanged');
  assert.equal(view.evaluate('ui.groups.length'), 1);
  assert.match(view.notices.at(-1), /分组未删除.*已移出的环境/);
});
