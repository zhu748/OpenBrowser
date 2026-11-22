'use strict';

const assert = require('node:assert/strict');

async function main() {
  const { createSelectOptionModel, indexOfSelectedOption } = await import('../../frontend/src/workbench/shared/inputs/select-options.mjs');
  const settings = { optionLabel: 'label' };
  const model = createSelectOptionModel(settings);
  const first = { id: 0, label: 'İstanbul', omitted: true, note: null };
  const duplicate = { id: 0, label: 'Second' };
  const choices = [first, duplicate, 'Ankara', 0, false, '', null];

  assert.equal(model.labelOf(null), '');
  assert.equal(model.labelOf(false), 'false');
  assert.equal(model.labelOf({}), 'undefined', 'a configured but missing label is stringified');
  assert.equal(model.valueOf(first), first);
  assert.equal(model.valuesEqual(first, duplicate), false, 'without a value accessor, objects compare by identity');
  assert.equal(model.findSelectedOption(choices, first), first);
  assert.equal(model.findSelectedOption(choices, 0), 0);
  assert.equal(model.findSelectedOption(choices, false), false);
  assert.equal(model.findSelectedOption(choices, ''), null);
  assert.equal(model.findSelectedOption(choices, null), null);
  assert.equal(indexOfSelectedOption(choices, model.findSelectedOption(choices, 0)), 3, 'opening focuses a selected zero');
  assert.equal(indexOfSelectedOption(choices, model.findSelectedOption(choices, false)), 4, 'opening focuses a selected false');
  assert.equal(indexOfSelectedOption([first, null], model.findSelectedOption(choices, null)), -1);
  assert.equal(indexOfSelectedOption([first], model.findSelectedOption(choices, false)), -1, 'filtered-out selections are not focused');
  assert.equal(model.filterOptions(choices, ''), choices, 'blank queries preserve the same list');

  Object.assign(settings, { optionValue: 'id', optionDisabled: 'omitted', filterLocale: 'tr', filterMatchMode: 'startsWith' });
  assert.equal(model.valuesEqual(first, duplicate), true);
  assert.equal(model.findSelectedOption(choices, 0), first, 'first matching row wins');
  assert.equal(model.findSelectedOption(choices, '0'), null, 'value matching is strict');
  assert.equal(model.optionDisabled(first), true);
  assert.equal(model.optionDisabled(null), false);
  assert.deepEqual(model.filterOptions(choices, 'ist'), [first], 'search is locale-aware even for a disabled option');
  assert.deepEqual(model.filterOptions(choices, 'stan'), [], 'startsWith is not substring matching');

  Object.assign(settings, { optionLabel: row => row.label, optionValue: row => row.id, optionDisabled: row => row.id === 0,
    filterFields: ['note'], filterMatchMode: 'endsWith' });
  assert.equal(model.optionDisabled(duplicate), true);
  assert.equal(model.valueOf(first), 0);
  assert.deepEqual(model.filterOptions(choices, 'bul'), [first], 'null filter fields fall back to the label callback');
  assert.deepEqual(model.filterOptions(choices, 'KARA'), ['Ankara']);
  assert.deepEqual(model.filterOptions(choices, 'alse'), [false]);
  settings.filterMatchMode = 'other';
  assert.deepEqual(model.filterOptions(choices, 'stan'), [first], 'unknown match modes retain contains behavior');
  settings.filterLocale = 'invalid_locale';
  assert.deepEqual(model.filterOptions([], 'query'), [], 'an empty list need not resolve the search locale');
  console.log('WORKBENCH_SELECT_OPTIONS_SELFTEST OK');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
