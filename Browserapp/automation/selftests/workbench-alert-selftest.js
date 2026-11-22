'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');
const { transformSync } = require('esbuild');
const vue = require('vue');
const { compileWorkbenchComponent } = require('../../frontend/compile-workbench-component.cjs');
const entries = require('../../frontend/workbench-entries.json');

function loadAlert() {
  const entry = entries['assets/rx-alert-A_y5uvgP.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const compiled = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  // Render the real compiled component without CSS transitions or Electron.
  const Transition = (_, { slots }) => slots.default()[0];
  const dependencies = {
    './workbench-vue.js': { ...vue, Transition },
    './runtime-dom.esm-bundler-_WxS4Zar.js': { s() {}, t: Transition },
    './basecomponent-ClhuVxJN.js': { Z: () => vue.h('svg', { 'aria-hidden': true }) },
  };
  runInNewContext(transformSync(compiled.code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected alert import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

function node(tag, text) { return { tag, text, props: {}, children: [] }; }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children) {
    const matched = find(child, predicate);
    if (matched) return matched;
  }
}
function mount(component) {
  const root = node('root');
  const renderer = vue.createRenderer({
    createElement: tag => node(tag),
    createText: text => node('#text', text),
    createComment: text => node('#comment', text),
    setText(child, text) { child.text = text; },
    setElementText(child, text) { child.text = text; },
    patchProp(child, key, _old, value) { child.props[key] = value; },
    insert(child, parent, anchor) {
      child.parent = parent;
      const position = anchor ? parent.children.indexOf(anchor) : parent.children.length;
      parent.children.splice(position, 0, child);
    },
    remove(child) {
      if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1);
    },
    parentNode: child => child.parent,
    nextSibling: child => child.parent?.children[child.parent.children.indexOf(child) + 1],
  });
  const app = renderer.createApp(component);
  app.config.globalProperties.$t = text => ({ '关闭': 'Close' })[text] ?? text;
  app.mount(root);
  return { root, unmount: () => app.unmount() };
}

test('a dismissible alert has a named native action and emits close', async () => {
  const Alert = loadAlert();
  const visible = vue.ref(true);
  const closable = vue.ref(true);
  let closed = 0;
  const { root, unmount } = mount(() => vue.h(Alert, {
    visible: visible.value, closable: closable.value,
    'onUpdate:visible': next => { visible.value = next; },
    onClose: () => { closed++; },
  }));
  const closeControl = () => find(root, child => child.props.class === 'rx-alert-close');
  try {
    const button = closeControl();
    assert.equal(button?.tag, 'button');
    assert.equal(button.props.type, 'button', 'dismissal cannot submit a surrounding form');
    assert.equal(button.props['aria-label'], 'Close');
    button.props.onClick();
    await vue.nextTick();
    assert.equal(visible.value, false);
    assert.equal(closed, 1);
    assert.equal(closeControl(), undefined);

    visible.value = true;
    closable.value = false;
    await vue.nextTick();
    assert.ok(find(root, child => child.props.class === 'rx-alert'));
    assert.equal(closeControl(), undefined);
  } finally { unmount(); }
});
