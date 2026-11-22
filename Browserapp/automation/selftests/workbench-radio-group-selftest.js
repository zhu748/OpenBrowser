'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { renderToString } = require('@vue/server-renderer');
const { transformSync } = require('esbuild');
const vue = require('vue');
const { compileWorkbenchComponent } = require('../../frontend/compile-workbench-component.cjs');
const entries = require('../../frontend/workbench-entries.json');

const RadioStub = vue.defineComponent({
  props: { disabled: Boolean, inputId: String, value: String },
  render() {
    return vue.h('input', { type: 'radio', disabled: this.disabled, id: this.inputId, value: this.value });
  },
});

function loadRadioGroup() {
  const entry = entries['assets/rx-input-radio-BGeLgzak.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const compiled = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  // Run the real compiled Vue component against an input stub, without Electron or browser globals.
  runInNewContext(transformSync(compiled.code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (id === './workbench-vue.js') return vue;
      if (id === './radiobutton-B3i1EP5M.js') return { t: RadioStub };
      throw Error('Unexpected component import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

test('radio group disabling applies to every option without changing individual defaults', async () => {
  const Group = loadRadioGroup();
  const options = [
    { label: 'Enabled by default', value: 'normal' },
    { label: 'Explicitly enabled', value: 'explicit', disabled: false },
    { label: 'Disabled option', value: 'locked', disabled: true },
  ];
  for (const [props, expected] of [
    [{ disabled: true }, [true, true, true]],
    [{ disabled: '' }, [true, true, true]],
    [{ disabled: false }, [false, false, true]],
    [{}, [false, false, true]],
  ]) {
    const markup = await renderToString(vue.createSSRApp({ render: () => vue.h(Group, { options, name: 'format', ...props }) }));
    const inputs = [...markup.matchAll(/<input\b[^>]*>/g)].map(([input]) => /\sdisabled(?=[\s=>])/.test(input));
    assert.deepEqual(inputs, expected, JSON.stringify(props));
  }
});
