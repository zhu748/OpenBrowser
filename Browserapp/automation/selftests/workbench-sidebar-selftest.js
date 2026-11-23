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

function loadSidebarComponent(name, imports = {}) {
  const entry = entries['assets/workbench-sidebar-' + name + '.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const { code } = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  const dependencies = {
    './workbench-vue.js': vue,
    './runtime-core.esm-bundler-CBj16o9G.js': { ct: vue.watchEffect },
    './runtime-dom.esm-bundler-_WxS4Zar.js': { s() {} },
    './utils-BIWenCnY.js': { gi: () => true },
    './rich-html-link-VdBpR3Cm.js': { y: () => ({ matched: [] }) },
    './basecomponent-ClhuVxJN.js': { Z: () => vue.h('svg') },
    './ripple-DKjDc6yC.js': { t: {} },
    './tooltip-BYYKWrvu.js': { t: {} },
    './hook-CnJE4hRq.js': { m: {} },
    './roxy-claw-1j3mqM_d.js': { n: () => ({}) },
    './workbench-sidebar-menu-item.js': {
      default: vue.defineComponent({ render: () => vue.h('a', { href: '/projects/offline' }, 'Offline project') }),
      __esModule: true,
    },
    ...imports,
  };
  runInNewContext(transformSync(code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected sidebar import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

test('folded sidebar links cannot receive keyboard focus while visually hidden', async () => {
  const Sidebar = loadSidebarComponent('links');
  const render = props => renderToString(vue.createSSRApp({
    render: () => vue.h(Sidebar, { items: [{ name: 'offline-project' }], ...props }),
  }));
  const folded = await render({ collapsedChildren: true });
  assert.match(folded, /<div\b[^>]*class="[^"]*\bfolded\b[^"]*"/);
  assert.match(folded, /^<div\b[^>]*\binert(?=[\s=>])/,
    'a folded branch must remove all descendant links from keyboard navigation');
  assert.match(folded, /<a\b[^>]*href="\/projects\/offline"/, 'links remain mounted for the fold transition');
  assert.doesNotMatch(await render({ collapsedChildren: false }), /\binert(?=[\s=>])/);
  assert.doesNotMatch(await render({ collapsed: true }), /\binert(?=[\s=>])/,
    'compact sidebar mode is not the same as a folded subtree');
});

function element(tag, text) { return { tag, text, props: {}, children: [] }; }
function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children) {
    const result = find(child, predicate);
    if (result) return result;
  }
}

test('pinned projects keep their primary link and expose a separate keyboardable disclosure', async () => {
  const Item = loadSidebarComponent('menu-item');
  const Sidebar = loadSidebarComponent('links', { './workbench-sidebar-menu-item.js': { default: Item, __esModule: true } });
  const projects = { name: 'projects', meta: { title: 'Projects' } };
  const pinned = { name: 'project-item', meta: { title: 'Offline project', params: { id: 'fixture' } } };
  const items = vue.ref([{ ...projects, children: [] }]);
  const compact = vue.ref(false);
  const navigated = [];
  const root = element('root');
  function remove(child) {
    if (!child.parent) return;
    child.parent.children.splice(child.parent.children.indexOf(child), 1);
    child.parent = undefined;
  }
  const renderer = vue.createRenderer({
    createElement: tag => element(tag),
    createText: text => element('#text', text),
    createComment: text => element('#comment', text),
    setText: (child, text) => { child.text = text; },
    setElementText: (child, text) => { child.text = text; },
    patchProp: (child, key, _previous, value) => { child.props[key] = value; },
    insert(child, parent, anchor) {
      remove(child);
      child.parent = parent;
      parent.children.splice(anchor ? parent.children.indexOf(anchor) : parent.children.length, 0, child);
    },
    remove,
    parentNode: child => child.parent,
    nextSibling: child => child.parent?.children[child.parent.children.indexOf(child) + 1],
  });
  const app = renderer.createApp(() => vue.h(Sidebar, { items: items.value, collapsed: compact.value }));
  // A slot-only router stand-in avoids opening a browser and records named navigation.
  app.component('RouterLink', {
    props: ['to', 'custom'],
    setup(props, { slots }) {
      return () => {
        const isActive = props.to.name === 'projects';
        return slots.default({
          href: isActive ? '#/projects' : '#/projects/' + props.to.params.id,
          navigate: () => navigated.push(props.to.name),
          isActive,
        });
      };
    },
  });
  app.config.globalProperties.$t = text => ({ 展开: 'Expand', 收起: 'Collapse' })[text] ?? text;
  app.mount(root);
  const mainLink = () => find(root, el => el.tag === 'a');
  const expander = () => find(root, el => el.tag === 'button');
  const activate = el => el.props.onClick({ preventDefault() {}, stopPropagation() {} });
  try {
    assert.equal(mainLink().props.href, '#/projects');
    assert.equal(expander(), undefined, 'no disclosure is needed without pinned children');
    activate(mainLink());
    assert.deepEqual(navigated, ['projects']);
    items.value = [{ ...projects, children: [pinned] }];
    await vue.nextTick();
    assert.equal(mainLink().props.href, '#/projects', 'pinning a project must not remove the keyboard-focusable Projects link');
    assert.notEqual(mainLink().props.tabindex, -1);
    assert.match(mainLink().props.class, /\bactive\b/);
    activate(mainLink());
    assert.deepEqual(navigated, ['projects', 'projects']);

    const disclosure = expander();
    assert.equal(disclosure?.props.type, 'button', 'Enter and Space use the native button activation');
    assert.notEqual(disclosure.props.tabindex, -1);
    const panelId = disclosure.props['aria-controls'];
    assert.ok(panelId && find(root, el => el.props.id === panelId), 'the expander identifies its submenu');
    const panel = () => find(root, el => el.props.id === panelId);
    const before = disclosure.props['aria-expanded'];
    assert.equal(Boolean(panel().props.inert), !before);
    activate(disclosure);
    await vue.nextTick();
    assert.equal(expander().props['aria-expanded'], !before);
    assert.match(expander().props['aria-label'], new RegExp((before ? 'Expand' : 'Collapse') + ' Projects'));
    assert.equal(Boolean(panel().props.inert), before);
    assert.deepEqual(navigated, ['projects', 'projects'], 'activating the disclosure never navigates');
    if (!expander().props['aria-expanded']) {
      activate(expander());
      await vue.nextTick();
    }
    assert.ok(!panel().props.inert, 'expanding restores access to pinned links');
    assert.ok(find(panel(), el => el.tag === 'a' && el.props.href === '#/projects/fixture'));

    compact.value = true;
    await vue.nextTick();
    assert.equal(expander(), undefined, 'compact layout keeps no hidden extra tab stop');
    assert.equal(mainLink().props.href, '#/projects');
    assert.equal(mainLink().props['aria-label'], 'Projects');
    activate(mainLink());
    assert.deepEqual(navigated, ['projects', 'projects', 'projects']);
    assert.ok(panel().props.inert, 'compact layout hides pinned links from keyboard focus');
  } finally { app.unmount(); }
});
