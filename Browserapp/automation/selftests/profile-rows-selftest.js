'use strict';

const assert = require('node:assert/strict');
const { profileRenderKey, reconcileProfileRows } = require('../../ui/ui-profile-rows');
const { createProfileTable } = require('./helpers/profile-table');

const profiles = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
const fixture = createProfileTable(profiles);
const { table } = fixture;
const originalRows = [...table.children];
const selectedIds = new Set(['b']);
const render = (items) => reconcileProfileRows({ ...fixture, profiles: items, selectedIds });
const ids = () => table.children.map((row) => row.dataset.profileId);
render(profiles);
assert.deepEqual(ids(), ['a', 'b', 'c', 'd']);
assert.deepEqual(table.children, originalRows);
assert.equal(table.placements, 0, 'unchanged rows must not move');
assert.equal(table.removals, 0);
assert.equal(originalRows[1].checkbox.checked, true, 'selection still refreshes');
selectedIds.clear();
render(profiles);
assert.equal(originalRows[1].checkbox.checked, false);
assert.equal(table.placements, 0, 'selection changes must not move rows');

// Reordering preserves every reusable node and its attached state.
render([profiles[3], ...profiles.slice(0, 3)]);
assert.deepEqual(ids(), ['d', 'a', 'b', 'c']);
assert.equal(table.placements, 1, 'moving the last row to the front requires one insertion');
assert.equal(table.children[0], originalRows[3]);
table.resetCounts();
render([profiles[3], { id: 'a', version: 1 }, profiles[1], profiles[2]]);
assert.deepEqual(ids(), ['d', 'a', 'b', 'c']);
assert.notEqual(table.children[1], originalRows[0]);
assert.equal(table.children[1].dataset.i18nPending, '1');
assert.equal(table.children[2], originalRows[1]);
assert.equal(table.placements, 1);
assert.equal(table.removals, 1, 'one changed row replaces only itself');

// Successive page changes cover insertion, removal, reverse order and empty lists.
for (const items of [
  [{ id: 'x' }, { id: 'b' }, { id: 'd' }],
  [{ id: 'd' }, { id: 'b' }, { id: 'x' }],
  [{ id: 'b', version: 2 }, { id: 'y' }], [], profiles,
]) {
  render(items);
  assert.deepEqual(ids(), items.map((item) => item.id));
  const stable = [...table.children];
  table.resetCounts();
  render(items);
  assert.deepEqual(table.children, stable);
  assert.equal(table.placements, 0);
  assert.equal(table.removals, 0);
}
render([profiles[0], profiles[0], profiles[1]]);
assert.deepEqual(ids(), ['a', 'b'], 'duplicate ids cannot leave duplicate rows');

const context = { profile: { id: 'a', updatedAt: 'unchanged' }, info: { running: false },
  starting: { phase: 'custom', percent: 20, message: 'before' }, remaining: '2d' };
const key = profileRenderKey(context);
for (const patch of [
  { profile: { ...context.profile, createdAt: 'new-time' } },
  { profile: { ...context.profile, platform: { startUrl: 'https://example.test/' } } },
  { profile: { ...context.profile, platform: { type: 'Website' } } },
  { starting: { ...context.starting, message: 'after' } },
  { remaining: '1d' }, { locale: 'en' }, { light: true }, { group: { name: 'group', color: 'red' } },
]) assert.notEqual(profileRenderKey({ ...context, ...patch }), key, 'display changes invalidate the row even without an updatedAt change');
assert.equal(profileRenderKey({ ...context, profile: { ...context.profile, cookies: 'secret' } }), key,
  'non-display changes do not invalidate the row');

const keyed = createProfileTable([context.profile], (profile) => profileRenderKey({ ...context, profile }));
const previous = keyed.table.children[0];
reconcileProfileRows({ ...keyed, profiles: [{ ...context.profile, platform: { startUrl: 'https://new.test' } }], selectedIds });
assert.notEqual(keyed.table.children[0], previous, 'the real reconciliation uses the updated display key');
console.log('PROFILE_ROWS_SELFTEST OK (no-op mutations, selection, identity, reorder, replacement, paging, duplicates)');
