'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function main() {
  const source = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/workbench/shared/AdvancedSearch.vue'), 'utf8');
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm, '');
  const searches = [];
  const name = { key: 'name', syntax: 'name::', label: 'Name' };
  const note = { key: 'remark', syntax: 'note::', label: 'Note' };
  const { query, displayedValue, choose, onKeydown } = vm.runInNewContext(`
    (() => { ${script}\nreturn { query, displayedValue, choose, onKeydown }; })()
  `, {
    defineProps: () => ({
      query: '', options: [name, note],
      search: ({ key, value }) => searches.push([key, value]),
    }),
    computed: getter => ({ get value() { return getter(); } }),
    ref: value => ({ value }),
    useTemplateRef: () => ({}),
    onMounted() {}, onUnmounted() {}, watch() {},
    $t: value => value, mac: false,
  });

  for (const text of ['qa::daily', '2001::1']) {
    query.value = text;
    assert.equal(displayedValue.value, text, 'unknown prefix is ordinary search text');
    onKeydown({ key: 'Enter', preventDefault() {} });
    assert.deepEqual(searches.at(-1), [undefined, text], 'plain Enter search preserves the whole term');
  }

  query.value = 'name::qa::daily';
  assert.equal(displayedValue.value, 'qa::daily');
  await choose(note);
  assert.equal(query.value, 'note::qa::daily', 'switching filter removes one configured prefix');
  assert.deepEqual(searches.at(-1), ['remark', 'qa::daily']);
  await choose();
  assert.equal(query.value, 'qa::daily', 'switching to the all-field search retains literal text');
  assert.deepEqual(searches.at(-1), [undefined, 'qa::daily']);
  console.log('WORKBENCH_ADVANCED_SEARCH_SELFTEST OK (literal terms, Enter, known operators and filter switching)');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
