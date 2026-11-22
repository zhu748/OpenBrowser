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

function loadHeader() {
  const entry = entries['assets/views-header-CcjwXPjG.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const { code } = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const dependencies = {
    './workbench-vue.js': vue,
    './utils-BIWenCnY.js': { wt: () => ({ path: '/accounts', query: {} }) },
    './rich-html-link-VdBpR3Cm.js': { b: () => ({ back() {}, replace() {} }) },
    './basecomponent-ClhuVxJN.js': { Z: () => vue.h('svg') },
  };
  const module = { exports: {} };
  runInNewContext(transformSync(code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected view header import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

test('a visible view-header back action is a named native button', async () => {
  const Header = loadHeader();
  const render = showBack => {
    const app = vue.createSSRApp({ render: () => vue.h(Header, { showBack }, { title: () => 'Add account' }) });
    app.component('i18n-t', () => vue.h('span'));
    app.config.globalProperties.$t = key => key === '返回' ? 'Back' : key;
    return renderToString(app);
  };
  const html = await render(true);
  const button = html.match(/<button\b[^>]*>/)?.[0];
  assert.ok(button, 'the visible back icon must be natively keyboard operable');
  assert.match(button, /\btype="button"/, 'it cannot submit an enclosing form');
  assert.match(button, /\baria-label="Back"/);
  assert.doesNotMatch(await render(false), /<button\b/);
});
