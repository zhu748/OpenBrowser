'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { parse: parseVue } = require('@vue/compiler-sfc');
const { parse } = require('acorn');

function loadSelectHandler(context) {
  const filename = path.resolve(__dirname, '../../frontend/src/workbench/shared/inputs/SelectInput.vue');
  const { descriptor, errors } = parseVue(readFileSync(filename, 'utf8'), { filename });
  assert.deepEqual(errors, []);
  const script = descriptor.scriptSetup.content;
  const ast = parse(script, { ecmaVersion: 'latest', sourceType: 'module' });
  const handler = ast.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'handleKey');
  assert.ok(handler);
  // Use the real SFC key handler with a deterministic selection state; no native IME is needed.
  return runInNewContext(script.slice(handler.start, handler.end) + '\nhandleKey', context, { filename });
}

test('select does not consume IME candidate keys but still accepts ordinary Enter', () => {
  const option = { label: 'Already highlighted', value: 1 };
  const actions = [];
  const handleKey = loadSelectHandler({
    props: { disabled: false },
    opened: { value: true },
    focusedIndex: { value: 0 },
    filteredOptions: { value: [option] },
    searchable: { value: true },
    choose: value => actions.push(['choose', value]),
    close: () => actions.push(['close']),
    moveFocus: delta => actions.push(['focus', delta]),
  });
  function event(key, extra) {
    return {
      key, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...extra,
    };
  }
  for (const key of ['Enter', 'Escape', 'ArrowDown']) {
    for (const composition of [{ isComposing: true }, { isComposing: false, keyCode: 229 }]) {
      const composing = event(key, composition);
      handleKey(composing);
      assert.equal(composing.defaultPrevented, false, 'native IME must receive ' + key);
      assert.deepEqual(actions, []);
    }
  }
  const enter = event('Enter', { isComposing: false, keyCode: 13 });
  handleKey(enter);
  assert.equal(enter.defaultPrevented, true);
  assert.deepEqual(actions, [['choose', option]]);
});
