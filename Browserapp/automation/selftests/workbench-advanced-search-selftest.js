'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function main() {
  const source = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/workbench/shared/AdvancedSearch.vue'), 'utf8');
  const script = source.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*;$/gm, '');
  const searches = [];
  let blurs = 0;
  const name = { key: 'name', syntax: 'name::', label: 'Name' };
  const note = { key: 'remark', syntax: 'note::', label: 'Note' };
  const { query, displayedValue, active, expanded, highlighted, choose, onKeydown } = vm.runInNewContext(`
    (() => { ${script}\nreturn { query, displayedValue, active, expanded, highlighted, choose, onKeydown }; })()
  `, {
    defineProps: () => ({
      query: '', options: [name, note],
      search: ({ key, value }) => searches.push([key, value]),
    }),
    computed: getter => ({ get value() { return getter(); } }),
    ref: value => ({ value }),
    useTemplateRef: () => ({ value: { blur: () => { blurs++; } } }),
    onMounted() {}, onUnmounted() {}, watch() {},
    $t: value => value, mac: false,
  });

  function press(key, properties) {
    const event = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...properties };
    onKeydown(event);
    return event;
  }

  query.value = '候选';
  active.value = name;
  highlighted.value = 1;
  expanded.value = true;
  for (const key of ['Enter', 'Escape', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight']) {
    for (const composition of [{ isComposing: true }, { isComposing: false, keyCode: 229 }]) {
      assert.equal(press(key, composition).defaultPrevented, false, 'the IME must receive ' + key);
      assert.equal(query.value, '候选');
      assert.equal(active.value, name);
      assert.equal(highlighted.value, 1);
      assert.equal(expanded.value, true);
      assert.equal(searches.length, 0, 'composition must not submit the search');
      assert.equal(blurs, 0, 'composition must keep the input focused for the IME');
    }
  }

  assert.equal(press('Escape').defaultPrevented, false);
  assert.equal(expanded.value, false, 'ordinary Escape closes the menu');
  assert.equal(press('ArrowDown').defaultPrevented, true);
  assert.equal(expanded.value, true);
  assert.equal(highlighted.value, 2, 'ordinary ArrowDown moves to the next option');
  assert.equal(press('ArrowUp').defaultPrevented, true);
  assert.equal(highlighted.value, 1, 'ordinary ArrowUp moves to the previous option');
  assert.equal(press('Enter').defaultPrevented, true);
  assert.deepEqual(searches.at(-1), ['name', '候选'], 'ordinary Enter submits the highlighted field');
  assert.equal(blurs, 1);
  assert.equal(expanded.value, false);
  active.value = null;
  highlighted.value = 0;

  for (const text of ['qa::daily', '2001::1']) {
    query.value = text;
    assert.equal(displayedValue.value, text, 'unknown prefix is ordinary search text');
    press('Enter');
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
  console.log('WORKBENCH_ADVANCED_SEARCH_SELFTEST OK (IME, ordinary keyboard handling, literal terms and filter switching)');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
