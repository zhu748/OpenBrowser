'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'ui-profile-list.js'), 'utf8');
const context = vm.createContext({ window: {} });
new vm.Script(source, { filename: 'ui-profile-list.js' }).runInContext(context);
const { filterProfiles, summarizeProfiles, paginate } = context.window.OpenBrowserProfileList;

const profiles = [
  { id: 'a', number: 1, groupId: 'us', browser: 'Chrome', proxy: 'socks5://us', tag: 'retail' },
  { id: 'b', number: 2, groupId: 'eu', browser: 'Edge', proxy: 'direct', tag: 'ads' },
  { id: 'c', number: 3, browser: 'Chrome', proxy: 'direct', tag: 'retail' },
];
const options = { displayProfileNumber: (p) => String(p.number), groupNameOf: (p) => ({ us: 'United States', eu: 'Europe' })[p.groupId] || 'Ungrouped' };

assert.deepStrictEqual(filterProfiles({ profiles, activeGroupFilter: 'us', ...options }).map((p) => p.id), ['a']);
assert.deepStrictEqual(filterProfiles({ profiles, activeGroupFilter: 'ungrouped', ...options }).map((p) => p.id), ['c']);
assert.deepStrictEqual(filterProfiles({ profiles, query: 'Europe', ...options }).map((p) => p.id), ['b']);
assert.deepStrictEqual(filterProfiles({ profiles, query: 'retail', ...options }).map((p) => p.id), ['a', 'c']);
const secondPage = paginate(profiles, 2, 2);
assert.strictEqual(secondPage.currentPage, 2);
assert.strictEqual(secondPage.totalPages, 2);
assert.strictEqual(secondPage.total, 3);
assert.deepStrictEqual(secondPage.items.map((profile) => profile.id), ['c']);
assert.strictEqual(paginate(profiles, 9, 2).currentPage, 2);

const profilesWithTrash = [
  ...profiles,
  { id: 'd', number: 4, groupId: 'us', browser: 'Chrome', proxy: 'direct', tag: 'trash-item', trashed: true },
];
assert.deepStrictEqual(filterProfiles({ profiles: profilesWithTrash, activeGroupFilter: 'all', ...options }).map((p) => p.id), ['a', 'b', 'c']);
assert.deepStrictEqual(filterProfiles({ profiles: profilesWithTrash, activeGroupFilter: 'us', ...options }).map((p) => p.id), ['a']);
assert.deepStrictEqual(filterProfiles({ profiles: profilesWithTrash, activeGroupFilter: 'trash', ...options }).map((p) => p.id), ['d']);

// Empty and field-only searches must not construct unrelated display text.
let projections = 0;
const countingOptions = {
  displayProfileNumber: () => { projections += 1; return ''; },
  groupNameOf: () => { projections += 1; return ''; },
};
assert.strictEqual(filterProfiles({ profiles, ...countingOptions }).length, 3);
assert.strictEqual(projections, 0);
assert.deepStrictEqual(filterProfiles({ profiles, query: 'tag::retail', ...countingOptions }).map((p) => p.id), ['a', 'c']);
assert.strictEqual(projections, 0, 'field search must only project the requested field');
assert.deepStrictEqual(filterProfiles({ profiles, query: 'constructor::x' }).map((p) => p.id), [], 'prototype names are plain text, not search fields');

const fleet = [
  { id: 'x', number: 3, title: 'Bravo', groupId: 'us', favorite: true, tag: 'retail', platform: { username: 'Alice' }, updatedAt: '2026-01-02' },
  { id: 'y', number: 1, title: 'alpha', groupId: 'us', tags: ['retail'], updatedAt: 'invalid' },
  { id: 'z', number: 2, title: 'Bravo', updatedAt: '2026-01-01' },
  { id: 'trash', number: 4, trashed: true, favorite: true },
];
const isRunning = (id) => id === 'x' || id === 'trash';
const ids = (extra) => filterProfiles({ profiles: fleet, isRunning, ...options, ...extra }).map((p) => p.id);
assert.deepStrictEqual(ids({ activeListTab: 'fav' }), ['x']);
assert.deepStrictEqual(ids({ activeListTab: 'open' }), ['x']);
assert.deepStrictEqual(ids({ advancedFilter: { status: 'stopped', fav: 'no', tag: ' retail ' } }), ['y']);
assert.deepStrictEqual(ids({ advancedFilter: { account: 'aliCE', status: 'running' } }), ['x']);
assert.deepStrictEqual(ids({ query: 'tag::retail name::bravo', advancedFilter: { fav: 'yes' } }), ['x']);
assert.deepStrictEqual(ids({ activeGroupFilter: 'trash', activeListTab: 'trash' }), ['trash']);
assert.deepStrictEqual(ids({ sort: { key: 'name', dir: 1 } }), ['y', 'x', 'z'], 'equal sort keys retain input order');
assert.deepStrictEqual(ids({ sort: { key: 'updated', dir: -1 } }), ['x', 'z', 'y']);
let numberReads = 0;
assert.deepStrictEqual(ids({ sort: { key: 'number' }, displayProfileNumber: (p) => { numberReads += 1; return p.number; } }), ['y', 'z', 'x']);
assert.strictEqual(numberReads, 3, 'sort values are computed once per non-trashed profile');
assert.deepStrictEqual(fleet.map((p) => p.id), ['x', 'y', 'z', 'trash'], 'filtering and sorting do not mutate the source');

const summary = summarizeProfiles(fleet, isRunning);
assert.deepStrictEqual([summary.all, summary.fav, summary.open, summary.trash], [3, 1, 1, 1]);
assert.deepStrictEqual(Array.from(summary.groups, ([id, count]) => [id, count]), [['all', 3], ['ungrouped', 1], ['us', 2]]);
fleet[0].trashed = true;
const changed = summarizeProfiles(fleet, isRunning);
assert.deepStrictEqual([changed.all, changed.fav, changed.open, changed.trash], [2, 0, 0, 2], 'in-place changes are reflected without a stale memo');

console.log('profile-list-selftest: OK');

const viewCache = context.window.OpenBrowserProfileList.createProfileListCache();
let runtime = {}, runningId = 'a', groupLabel = 'United States', groupReads = 0;
const running = (id) => id === runningId;
const groupName = () => { groupReads++; return groupLabel; };
const cachedOptions = { profiles, query: 'United', groupNameOf: groupName, isRunning: running };
const read = (locale = 'en') => viewCache.filter(cachedOptions, { runtimeVersion: runtime, locale });
const initial = read();
assert.equal(viewCache.ids(profiles), viewCache.ids(profiles), 'unchanged membership reuses its ID index');
assert.equal(viewCache.firstExit(profiles), undefined);
const readsAfterFirst = groupReads;
assert.equal(read(), initial, 'paging and selection reuse the current filter');
assert.equal(groupReads, readsAfterFirst, 'a hot query does not project every profile again');
assert.equal(viewCache.summarize(profiles, running, runtime).open, 1);
runningId = 'missing'; runtime = {};
assert.equal(viewCache.summarize(profiles, running, runtime).open, 0, 'runtime deltas invalidate counts');
groupLabel = 'États-Unis';
assert.equal(read('fr').length, 0, 'locale/group label changes invalidate text matching');
cachedOptions.query = 'Changed';
profiles[0].title = 'Changed';
viewCache.invalidate();
assert.deepEqual(read().map((p) => p.id), ['a'], 'saved in-place edits are visible');
profiles[0].trashed = true; viewCache.invalidate();
assert.equal(read().length, 0, 'trash mutations invalidate membership');
assert.equal(viewCache.summarize(profiles, running, runtime).trash, 1);
profiles[1].exitIp = '203.0.113.1'; viewCache.invalidate();
assert.equal(viewCache.firstExit(profiles), profiles[1], 'saved exit changes invalidate the header projection');

test('legacy startup retains trash at every age; only confirmed permanent deletion sends a snapshot', async () => {
  const filename = path.join(__dirname, '../../renderer.js');
  const renderer = fs.readFileSync(filename, 'utf8');
  const section = (start, end) => {
    const first = renderer.indexOf(start), last = renderer.indexOf(end, first + 1);
    assert.ok(first !== -1 && last > first, 'renderer section must be present: ' + start);
    return renderer.slice(first, last);
  };
  const now = Date.parse('2026-11-23T00:00:00Z');
  const week = 7 * 24 * 60 * 60 * 1000;
  const at = age => new Date(now - age).toISOString();
  const rows = [
    { id: 'older', trashed: true, trashedAt: at(week + 1), rev: 8 },
    { id: 'boundary', trashed: true, trashedAt: at(week), rev: 9 },
    { id: 'newer', trashed: true, trashedAt: at(week - 1), rev: 10 },
    { id: 'undated', trashed: true, trashedAt: null, rev: 11 },
    { id: 'invalid-date', trashed: true, trashedAt: 'not-a-date', rev: 12 },
    { id: 'active', trashed: false, trashedAt: at(week * 2), rev: 13 },
  ];
  const original = structuredClone(rows), timers = [], calls = [], confirmations = [], handlers = new Map();
  const inputs = new Map();
  let answer, reportedSave = 0;
  const mock = vm.createContext({
    Date: { now: () => now, parse: Date.parse },
    loadedUi: {}, migratedUi: { profiles: rows }, migratedGroups: [],
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    window: {
      ops: {
        profileStatus: async () => rows,
        async purgeTrashedProfiles(selection) {
          calls.push(structuredClone(selection));
          return { deleted: 0, ids: [] };
        },
      },
      OpenBrowserProfileBatch: { removeProfilesById: (profiles, ids) => profiles.filter(row => !ids.includes(row.id)) },
    },
    $(selector) {
      if (!inputs.has(selector)) inputs.set(selector, {
        addEventListener: (event, callback) => { handlers.set(selector + ':' + event, callback); },
        showModal() { this.open = true; }, close() { this.open = false; },
      });
      return inputs.get(selector);
    },
    selectedProfiles: new Set(), selectedSessions: new Set(), profileListCache: context.window.OpenBrowserProfileList.createProfileListCache(),
    setConfirmation(answerPromise) { answer = answerPromise; },
    confirmAction: options => { confirmations.push(options); return answer; },
    save() { reportedSave++; }, invalidateViewCache() {}, renderProfiles() {}, log() {}, toast() {},
    refreshStatus: async () => {}, refreshSessions: async () => {}, refreshExtensions: async () => {}, readUiProfiles: async () => rows,
    t: key => key,
  });
  const read = code => vm.runInContext(code, mock, { filename });
  read(section('let ui = { ...loadedUi', '\nlet activeGroupFilter'));
  for (const { callback } of timers) await callback();
  assert.deepStrictEqual(calls, [], 'opening the legacy renderer does not request permanent deletion, even past seven days');
  assert.deepStrictEqual(read('ui.profiles'), original);
  assert.strictEqual(reportedSave, 0, 'opening the legacy renderer does not rewrite trash state');
  read(section('function trashRemainingText(', '\nfunction renderProfiles('));
  for (const name of ['older', 'boundary', 'newer', 'undated', 'invalid-date']) {
    assert.strictEqual(read(`trashRemainingText(ui.profiles.find(row => row.id === '${name}'))`), '∞');
  }
  assert.strictEqual(read("trashRemainingText(ui.profiles.find(row => row.id === 'active'))"), '—');

  read(section('async function purgeProfile(', '\nfunction filteredProfilesForCurrentView('));
  mock.setConfirmation(Promise.resolve(false));
  await read("purgeProfile('older')");
  assert.deepStrictEqual(calls, [], 'cancelled permanent deletion sends no IPC');

  let confirm;
  mock.setConfirmation(new Promise(resolve => { confirm = resolve; }));
  const requested = read("purgeProfile('older')");
  assert.strictEqual(confirmations.length, 2);
  assert.deepStrictEqual(calls, [], 'nothing is sent while the confirmation is pending');
  // A different operation can update the row while the dialog is open.
  rows[0].rev++;
  rows[0].trashedAt = at(5);
  confirm(true);
  await requested;
  assert.deepStrictEqual(calls, [{
    ids: ['older'], trashedAtById: { older: original[0].trashedAt }, revisions: { older: original[0].rev },
  }], 'the explicit action retains only its original ID, deletion time and revision');
  assert.strictEqual(read('ui.profiles.length'), original.length, 'a stale acknowledgement must not remove any rows');

  read("let activeGroupFilter = 'trash', profileDeleteRevision = 0, pendingProfileDelete = null, engineProfiles;");
  read('function filteredProfilesForCurrentView() { return ui.profiles.filter(row => row.trashed); }');
  read(section('// group filter chips', 'function setProfileGroupFilter('));
  read(section("$('#delete-selected').addEventListener(", "\n$('#restore-selected')"));
  mock.selectedProfiles.add('boundary').add('newer');
  await handlers.get('#delete-selected:click')();
  assert.strictEqual(calls.length, 1, 'opening the batch confirmation sends no purge');
  await handlers.get('#batch-delete-form:submit')({ preventDefault() {}, submitter: { value: 'cancel' } });
  assert.strictEqual(calls.length, 1, 'cancelling the batch sends no purge');

  await handlers.get('#delete-selected:click')();
  rows[1].rev++;
  rows[1].trashedAt = at(6);
  await handlers.get('#batch-delete-form:submit')({ preventDefault() {}, submitter: { value: 'confirm' } });
  assert.deepStrictEqual(calls[1], {
    ids: ['boundary', 'newer'],
    trashedAtById: { boundary: original[1].trashedAt, newer: original[2].trashedAt },
    revisions: { boundary: original[1].rev, newer: original[2].rev },
  }, 'confirmed batch sends only selected IDs with the snapshots captured before confirmation');
});

test('legacy tab and group changes invalidate batch confirmations without losing same-scope pagination selections', async () => {
  const filename = path.join(__dirname, '../../renderer.js');
  const renderer = fs.readFileSync(filename, 'utf8');
  const section = (start, end) => {
    const first = renderer.indexOf(start), last = renderer.indexOf(end, first + 1);
    assert.ok(first !== -1 && last > first, 'renderer section must be present: ' + start);
    return renderer.slice(first, last);
  };
  const workbench = fs.readFileSync(path.join(__dirname, '../../ui/ui-workbench.js'), 'utf8');
  const cardStart = workbench.indexOf("document.getElementById('groups-card-grid')?.addEventListener('click'");
  const cardEnd = workbench.indexOf('// 2. Templates Card Grid', cardStart);
  assert.ok(cardStart !== -1 && cardEnd > cardStart);
  const events = new vm.Script([
    workbench.slice(cardStart, cardEnd),
    section('function switchListTab(', '// Row "⋮" menu'),
    section("document.querySelectorAll('#profile-list-tabs .list-tab').forEach(", '// 全局 Ctrl+F'),
    section("$('#select-all-profiles').addEventListener(", "\n$('#select-all-sessions')"),
    section("$('#profile-next').addEventListener(", "\n$('#profile-page')"),
    section('// group filter chips', "\ndocument.getElementById('group-color-chips')"),
    section("$('#delete-selected').addEventListener(", "\n$('#restore-selected')"),
  ].join('\n'), { filename });
  const rows = [
    { id: 'a1', groupId: 'A' }, { id: 'a2', groupId: 'A', favorite: true },
    { id: 'b1', groupId: 'B' }, { id: 'b2', groupId: 'B', favorite: true },
  ];
  function setup(deleteData) {
    const controls = new Map(), handlers = new Map(), requests = [], navigation = [], dialogs = [], notices = [];
    let heldStatus;
    function control(id) {
      if (!controls.has(id)) controls.set(id, {
        checked: false, addEventListener: (event, fn) => handlers.set(id + ':' + event, fn),
        showModal() { this.open = true; dialogs.push('open'); }, close() { this.open = false; },
      });
      return controls.get(id);
    }
    function inertDelete(mode, ids, ...options) {
      requests.push([mode, Array.from(ids), ...options]);
      throw Error('inert fixture: do not perform deletion');
    }
    control('#batch-delete-data').checked = deleteData;
    const scopeRows = () => filterProfiles({ profiles: rows, activeGroupFilter: mock.activeGroupFilter, activeListTab: mock.activeListTab });
    const mock = vm.createContext({
      $: control, document: { getElementById: control, querySelector: () => null,
        querySelectorAll: () => ['all', 'fav', 'open', 'trash', 'transfer'].map(listTab =>
          Object.assign(control('tab-' + listTab), { dataset: { listTab } })) },
      activeGroupFilter: 'A', activeListTab: 'all', profilePage: 1, ui: { profiles: rows }, selectedProfiles: new Set(),
      profileDeleteRevision: 0, pendingProfileDelete: null, filteredProfilesForCurrentView: scopeRows,
      profileListCache: context.window.OpenBrowserProfileList.createProfileListCache(),
      switchView(view) { navigation.push([view, mock.activeGroupFilter, mock.profilePage, [...mock.selectedProfiles]]); },
      renderProfiles() {}, toast: message => notices.push(message), t: key => key, tx: key => key,
      visibleProfilePageIds: () => paginate(scopeRows(), mock.profilePage, 1).items.map(row => row.id),
      window: { ops: {
        profileStatus() {
          const result = heldStatus ?? Promise.resolve(rows);
          heldStatus = undefined;
          return result;
        },
        trashProfiles: ids => inertDelete('recycle', ids),
        purgeProfiles: (ids, flag) => inertDelete('permanent', ids, flag),
      } },
    });
    events.runInContext(mock);
    const click = (control, event) => handlers.get(control + ':click')(event);
    return {
      mock, requests, navigation, dialogs, notices,
      useTab: tab => click('tab-' + tab), isDialogOpen: () => !!control('#batch-delete-dialog').open,
      next: () => click('#profile-next'),
      selectPage: (checked = true) => handlers.get('#select-all-profiles:change')({ target: { checked } }),
      useGroup: groupView => click('group-table', { target: { closest: selector => selector === '[data-group-view]'
        ? { dataset: { groupView } } : null } }),
      useCard: rpcView => click('groups-card-grid', { target: { closest: selector => selector === '[data-rpc-view]'
        ? { dataset: { rpcView } } : null } }),
      filterGroup: groupFilter => click('profile-group-chips', { target: { closest: selector => selector === '[data-group-filter]'
        ? { dataset: { groupFilter } } : null } }),
      deferStatus() {
        const gate = Promise.withResolvers();
        heldStatus = gate.promise;
        return error => error ? gate.reject(error) : gate.resolve(rows);
      },
      open: () => click('#delete-selected'),
      submit: value => handlers.get('#batch-delete-form:submit')({ preventDefault() {}, submitter: { value } }),
    };
  }

  const scenarios = [setup(false), setup(true)];
  for (const view of scenarios) {
    view.selectPage();
    view.next();
    assert.deepStrictEqual([...view.mock.selectedProfiles], ['a1'], 'paging in A retains the deliberate selection');
    view.useGroup('B');
    await view.open();
    await view.submit('confirm');
  }
  assert.deepStrictEqual(scenarios.map(view => view.requests), [[], []],
    'neither recycle nor permanent confirmation in B may send A’s hidden ID');
  for (const [index, view] of scenarios.entries()) {
    assert.deepStrictEqual(view.navigation, [['profiles', 'B', 1, []]], 'selection and page reset before the new view renders');
    assert.deepStrictEqual(view.dialogs, [], 'an empty selection cannot open confirmation');
    view.selectPage();
    view.next();
    view.selectPage();
    view.useGroup('B');
    assert.deepStrictEqual(view.navigation.at(-1), ['profiles', 'B', 2, ['b1', 'b2']],
      'using the same group does not change its page or accumulated selection');
    await view.open();
    assert.deepStrictEqual(view.dialogs, ['open']);
    assert.deepStrictEqual(view.requests, [], 'nothing is sent before confirmation');
    await view.submit('cancel');
    assert.deepStrictEqual(view.requests, [], 'cancel does not send selected B rows');
    await view.open();
    await view.submit('confirm');
    assert.deepStrictEqual(view.requests, [index ? ['permanent', ['b1', 'b2'], true] : ['recycle', ['b1', 'b2']]]);

    view.filterGroup('A');
    assert.deepStrictEqual([view.mock.activeGroupFilter, view.mock.profilePage, [...view.mock.selectedProfiles]], ['A', 1, []],
      'group filter chips continue to reset page and selection');
  }

  for (const deleteData of [false, true]) {
    const delayed = setup(deleteData);
    delayed.selectPage();
    const release = delayed.deferStatus();
    const openingA = delayed.open();
    assert.deepStrictEqual(delayed.dialogs, [], 'navigation is not blocked before the dialog opens');
    delayed.useGroup('B');
    release();
    await openingA;
    await delayed.submit('confirm');
    assert.deepStrictEqual([delayed.dialogs, delayed.requests], [[], []], 'late status cannot open or leave a confirmation for the old group');
  }

  const roundTrip = setup(false);
  roundTrip.selectPage();
  const releaseOld = roundTrip.deferStatus();
  const oldA = roundTrip.open();
  roundTrip.useGroup('B');
  roundTrip.useGroup('A');
  releaseOld();
  await oldA;
  assert.deepStrictEqual(roundTrip.dialogs, [], 'returning to A does not make the old A request current again');

  const card = setup(false);
  card.selectPage();
  await card.open();
  card.useCard('B');
  assert.deepStrictEqual(card.navigation, [['profiles', 'B', 1, []]], 'card and table navigation use the same actual group and scope boundary');
  await card.submit('confirm');
  assert.deepStrictEqual(card.requests, []);

  const deselected = setup(false);
  deselected.selectPage();
  const finishStatus = deselected.deferStatus();
  const loadingCount = deselected.open();
  deselected.selectPage(false);
  finishStatus();
  await loadingCount;
  await deselected.submit('confirm');
  assert.deepStrictEqual([deselected.dialogs, deselected.requests], [[], []], 'a removed selection cannot become a delete target later');

  for (const permanent of [false, true]) {
    const list = setup(permanent);
    list.selectPage();
    const release = list.deferStatus();
    const previous = list.open();
    list.useTab('fav');
    assert.deepStrictEqual([...list.mock.selectedProfiles], []);
    list.selectPage();
    await list.open();
    release();
    await previous;
    assert.deepStrictEqual(list.dialogs, ['open'], 'All cannot replace the newer Favorites confirmation');
    await list.submit('confirm');
    assert.deepStrictEqual(list.requests, [permanent ? ['permanent', ['a2'], true] : ['recycle', ['a2']]]);

    const opened = setup(permanent);
    opened.selectPage();
    await opened.open();
    assert.equal(opened.isDialogOpen(), true);
    opened.useTab('fav');
    assert.equal(opened.isDialogOpen(), false, 'navigation also closes a dialog that was already open');
    opened.useTab('all');
    await opened.submit('confirm');
    assert.deepStrictEqual(opened.requests, [], 'a previous dialog cannot regain its IDs on returning to All');
  }

  const current = setup(false);
  current.selectPage();
  const releaseStale = current.deferStatus();
  const staleA = current.open();
  current.useGroup('B');
  current.selectPage();
  await current.open();
  releaseStale();
  await staleA;
  assert.deepStrictEqual(current.dialogs, ['open'], 'the newer B confirmation opens once');
  await current.submit('confirm');
  assert.deepStrictEqual(current.requests, [['recycle', ['b1']]], 'the late A result cannot replace the newer confirmation');

  const rejected = setup(false);
  rejected.selectPage();
  const rejectOld = rejected.deferStatus();
  const failedA = rejected.open();
  rejected.filterGroup('B');
  rejectOld(Error('stale A status failure'));
  await failedA;
  assert.deepStrictEqual(rejected.notices, []);
  rejected.selectPage();
  const rejectCurrent = rejected.deferStatus();
  const failedB = rejected.open();
  rejectCurrent(Error('current B status failure'));
  await failedB;
  assert.deepStrictEqual(rejected.notices, ['current B status failure']);
  assert.deepStrictEqual([rejected.dialogs, rejected.requests], [[], []]);
});

test('classic batch export respects the filtered list and never widens empty results', async () => {
  const renderer = fs.readFileSync(path.join(__dirname, '..', '..', 'renderer.js'), 'utf8');
  const view = renderer.slice(renderer.indexOf('function filteredProfilesForCurrentView()'), renderer.indexOf('// ===== Roxy 对齐：列表标签条'));
  const exportClick = renderer.slice(renderer.indexOf('function sanitizeProfileForExport('), renderer.indexOf("$('#test-all-proxies')?.addEventListener"));
  const fleet = [
    { id: 'a1', number: 1, groupId: 'A', favorite: true, platform: {
      password: 'fixture-only', totpSecret: 'fixture-only', accounts: [{ password: 'fixture-only', totpSecret: 'fixture-only' }],
    } },
    { id: 'a2', number: 2, groupId: 'A' }, { id: 'b1', number: 3, groupId: 'B', favorite: true },
    { id: 'trash', number: 4, groupId: 'A', trashed: true },
  ];
  const notices = [], downloads = [], search = { value: '' };
  let click;
  const env = {
    ui: { profiles: fleet, groups: [] }, engineProfiles: {}, profileListCache: context.window.OpenBrowserProfileList.createProfileListCache(),
    window: {}, activeGroupFilter: 'A', activeListTab: 'all', advancedFilterState: null, profileSort: { key: 'number', dir: -1 },
    selectedProfiles: new Set(), profilePage: 2, profilePageSize: 1, displayProfileNumber: row => row.number,
    groupNameOf: row => row.groupId, isProfileRunning: id => id === 'a2', Blob,
    $: key => key === '#profile-search' ? search : { addEventListener: (_, handler) => { click = handler; } },
    t: key => key, toast: key => notices.push(key), setTimeout: () => {},
    URL: { createObjectURL: blob => { downloads.push(blob); return 'blob:fixture'; } },
    document: { createElement: () => ({ click() {}, remove() {} }), body: { append() {} } },
  };
  vm.runInNewContext(view + exportClick, env);
  const read = async () => JSON.parse(await downloads.at(-1).text());
  click();
  const first = await read();
  assert.deepStrictEqual(first.map(row => row.id), ['a2', 'a1'], 'filtered result covers all pages, excluding B and trash');
  assert.equal(first[1].platform.password, '');
  assert.equal(first[1].platform.totpSecret, '');
  assert.deepStrictEqual(first[1].platform.accounts, [{ password: '', totpSecret: '' }]);
  assert.equal(fleet[0].platform.password, 'fixture-only', 'export must not edit the original row');
  env.selectedProfiles = new Set(['b1', 'a1']);
  click();
  assert.deepStrictEqual((await read()).map(row => row.id), ['a1'], 'an explicit selection is intersected with the filter');
  env.selectedProfiles = new Set(['b1']);
  click();
  env.selectedProfiles.clear();
  search.value = 'no match';
  click();
  search.value = '';
  env.activeListTab = 'fav';
  env.advancedFilterState = { status: 'running' };
  click();
  env.activeListTab = 'transfer';
  env.advancedFilterState = null;
  click();
  assert.equal(downloads.length, 2, 'no inactive, stale, or empty scope authorizes a download');
  assert.deepStrictEqual(notices.slice(-4), Array(4).fill('profiles.exportNone'));
});
