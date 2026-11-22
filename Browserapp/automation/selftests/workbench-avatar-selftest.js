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

function loadAvatar() {
  const entry = entries['assets/rx-avatar-h90aIpxl.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const compiled = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  const dependencies = {
    './workbench-vue.js': vue,
    './runtime-dom.esm-bundler-_WxS4Zar.js': { s() {} },
    './tooltip-BYYKWrvu.js': { t: {} },
    './rx-tooltip-CNCSEJGC.js': { t: (_, { slots }) => slots.default() },
  };
  runInNewContext(transformSync(compiled.code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected avatar import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

test('workbench avatar initials render two whole user-visible characters', async () => {
  const Avatar = loadAvatar();
  const names = ['A😀b', '👩‍💻Brenda', 'e\u0301漢', 'alice', '猫'];
  const list = names.map(name => ({ name }));
  const html = await renderToString(vue.createSSRApp({ render: () => vue.h(Avatar, { list }) }));
  const initials = [...html.matchAll(/<div>([^<]*)<\/div>/g)].map(([, text]) => text);
  assert.deepEqual(initials, ['A😀', '👩‍💻B', 'E\u0301漢', 'AL', '猫']);
});
