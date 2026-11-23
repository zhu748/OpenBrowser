'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { transformSync } = require('esbuild');

function loadDialog() {
  const filename = path.resolve(__dirname, '../../frontend/src/workbench/shared/use-workbench-dialog.mjs');
  const module = { exports: {} };
  const mounts = [];
  const listeners = new Set();
  const dependencies = {
    './workbench-vue.js': {
      getCurrentInstance: () => undefined,
      h: (type, props, slots) => ({ type, props, slots }),
      mergeProps: (...props) => Object.assign({}, ...props),
      ref: value => ({ value }),
    },
    './runtime-dom.esm-bundler-_WxS4Zar.js': { a: node => { if (node) mounts.push(node); } },
    './rich-html-link-VdBpR3Cm.js': {
      r: { on: (_name, handler) => listeners.add(handler), off: (_name, handler) => listeners.delete(handler) },
    },
    './dialog-CrBr3eoy.js': { t: {} },
    './rx-button-DyzuUt-V.js': { t: {} },
  };
  runInNewContext(transformSync(readFileSync(filename, 'utf8'), { format: 'cjs' }).code, {
    module,
    document: { createElement: () => ({ remove() {} }) },
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected workbench dialog import: ' + id);
    },
  }, { filename });
  return { useDialog: module.exports.t, mounts, listeners };
}

test('a closed dialog’s late save cannot unregister its replacement', async () => {
  const { useDialog, mounts, listeners } = loadDialog();
  const [show] = useDialog();
  let finish;
  const save = new Promise(resolve => { finish = resolve; });
  const options = { header: 'Edit project' };
  const first = show({ ...options, handleOk: () => save });
  const saving = first.handleOk();
  assert.equal(await first.handleCancel(), true);
  const second = show(options);
  assert.notEqual(second, first);
  assert.equal(show(options), second);
  assert.equal(listeners.size, 1);

  finish(true);
  await saving;
  const current = show(options);
  assert.equal(mounts.length, 2, 'the late save must not let a duplicate dialog mount');
  assert.equal(current, second, 'the current dialog still owns its key');
  assert.equal(listeners.size, 1);
  assert.equal(await second.handleCancel(), true);
  assert.notEqual(show(options), second, 'the actual owner can release its key when closed');
  assert.equal(mounts.length, 3);
});
