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

function loadSidebar() {
  const entry = entries['assets/workbench-sidebar-links.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const { code } = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  const dependencies = {
    './workbench-vue.js': vue,
    './runtime-dom.esm-bundler-_WxS4Zar.js': { s() {} },
    './utils-BIWenCnY.js': { gi: () => true },
    './rich-html-link-VdBpR3Cm.js': { y: () => ({ matched: [] }) },
    './basecomponent-ClhuVxJN.js': { Z: () => vue.h('svg') },
    './workbench-sidebar-menu-item.js': {
      default: vue.defineComponent({ render: () => vue.h('a', { href: '/projects/offline' }, 'Offline project') }),
      __esModule: true,
    },
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
  const Sidebar = loadSidebar();
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
