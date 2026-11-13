'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, 'ui', 'ui-profile-list.js'), 'utf8');
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
