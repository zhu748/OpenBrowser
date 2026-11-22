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

function loadRelatedProfilesCell() {
  const entry = entries['assets/workbench-related-profiles.js'];
  const filename = path.resolve(__dirname, '../..', entry.source);
  const { code } = compileWorkbenchComponent({ ...entry, filename, source: readFileSync(filename, 'utf8') });
  const module = { exports: {} };
  const dependencies = {
    './workbench-vue.js': vue,
    './related-info-VU3nxvtB.js': { t: () => vue.h('span', '--') },
    './rx-button-DyzuUt-V.js': { t: vue.defineComponent({ render: () => vue.h('button') }) },
    './tooltip-BYYKWrvu.js': { t: {} },
    './useProfileEntityLabels-BfqbVpel.js': {
      n: () => vue.ref({ selectEntityTooltip: 'Add a related window' }),
    },
  };
  runInNewContext(transformSync(code, { format: 'cjs' }).code, {
    module,
    require(id) {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      throw Error('Unexpected related-profiles import: ' + id);
    },
  }, { filename });
  return module.exports.default;
}

test('the add-related-window button has an accessible name from the same labels as the tooltip', async () => {
  const Cell = loadRelatedProfilesCell();
  const render = props => renderToString(vue.createSSRApp({ render: () => vue.h(Cell, { list: [], ...props }) }));
  assert.match(await render({ showAdd: true }), /<button\b[^>]*aria-label="Add a related window"/);
  assert.match(await render({ showAdd: true, addTooltip: 'Link existing profile' }),
    /<button\b[^>]*aria-label="Link existing profile"/);
  assert.doesNotMatch(await render({ showAdd: false }), /<button\b/);
});
