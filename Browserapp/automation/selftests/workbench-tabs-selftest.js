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

function loadTabs() {
  const entry = entries['assets/rx-tabs-Dp-8mudX.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const { code } = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  const wrapper = tag => (_, { slots }) => vue.h(tag, slots.default?.());
  const dependencies = {
    './workbench-vue.js': vue,
    './basecomponent-ClhuVxJN.js': { Z: wrapper('i') },
    './tab-6bJNMvq4.js': { a: wrapper('main'), i: wrapper('section'), n: wrapper('nav'), r: wrapper('article'), t: wrapper('button') },
  };
  runInNewContext(transformSync(code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected tabs import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

function makeNode(tag, text = '') { return { tag, text, children: [] }; }
function mount(render) {
  const root = makeNode('root');
  function remove(child) {
    if (!child.parent) return;
    child.parent.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = null;
  }
  const renderer = vue.createRenderer({
    createElement: tag => makeNode(tag),
    createText: text => makeNode('#text', text),
    createComment: text => makeNode('#comment', text),
    setText(child, text) { child.text = text; },
    setElementText(child, text) { child.text = text; child.children = []; },
    patchProp() {},
    insert(child, parent, anchor) {
      if (child === anchor) return;
      remove(child);
      child.parent = parent;
      parent.children.splice(anchor ? parent.children.indexOf(anchor) : parent.children.length, 0, child);
    },
    remove,
    parentNode: child => child.parent,
    nextSibling: child => child.parent?.children[child.parent.children.indexOf(child) + 1],
  });
  const app = renderer.createApp(render);
  app.mount(root);
  return { root, unmount: () => app.unmount() };
}
function firstChild(node, tag) {
  for (const child of node.children) {
    if (child.tag === tag) return child;
    const nested = firstChild(child, tag);
    if (nested) return nested;
  }
}

test('changing a tab title preserves its header and mounted panel state', async () => {
  const Tabs = loadTabs();
  const title = vue.ref('Installed');
  const value = vue.ref('installed');
  let mounts = 0;
  const Content = vue.defineComponent({
    setup() {
      const mountNumber = ++mounts;
      return () => vue.h('p', 'Instance ' + mountNumber);
    },
  });
  const { root, unmount } = mount(() => vue.h(Tabs, { tabs: [{ title: title.value, value: value.value, render: Content }] }));
  try {
    const originalButton = firstChild(root, 'button');
    assert.equal(firstChild(originalButton, 'span').text, 'Installed');
    assert.equal(firstChild(root, 'p').text, 'Instance 1');
    title.value = '已安装';
    await vue.nextTick();
    assert.equal(firstChild(root, 'p').text, 'Instance 1', 'a display-only title cannot reset the panel');
    assert.equal(firstChild(root, 'button'), originalButton, 'a display-only title cannot replace the focused header');
    assert.equal(firstChild(originalButton, 'span').text, '已安装');
    value.value = 'different';
    await vue.nextTick();
    assert.equal(firstChild(root, 'p').text, 'Instance 2', 'a genuinely different tab has a different panel');
  } finally { unmount(); }
});
