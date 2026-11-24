'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { classify } = require('./module-inventory');

test('separates authored frontend source, build inputs and generated output', () => {
  const workbench = 'Browserapp/frontend/src/workbench/';
  assert.deepEqual(classify(workbench + 'profiles/ProfileList.vue'), ['workbench', 'supported']);
  assert.deepEqual(classify(workbench + 'icons/useIcon.mjs'), ['workbench', 'supported']);
  assert.deepEqual(classify(workbench + 'icons/icon.svg'), ['resources-data', 'supported']);
  assert.deepEqual(classify('Browserapp/frontend/workbench/assets/vendor-bundle.js'), ['frontend-build-inputs', 'locked-input']);
  assert.deepEqual(classify('Browserapp/frontend/workbench/vendor/runtime.js'), ['frontend-build-inputs', 'locked-input']);
  assert.deepEqual(classify('Browserapp/frontend/dist/assets/chunk.js'), ['generated-ui', 'generated']);
  assert.deepEqual(classify('Browserapp/roxy-ui/index.html'), ['generated-ui', 'generated']);
  assert.deepEqual(classify('Browserapp/frontend/build-workbench.cjs'), ['build-tools', 'development']);
  assert.deepEqual(classify('Browserapp/frontend/workbench-entries.json'), ['build-tools', 'development']);
});

test('distinguishes tests, fixtures, resources, and historical evidence', () => {
  assert.deepEqual(classify('Browserapp/scripts/module-inventory.test.js'), ['tests-tools', 'development']);
  assert.deepEqual(classify('Browserapp/automation/selftests/data/sample.json'), ['tests-tools', 'development']);
  assert.deepEqual(classify('Browserapp/rebuild/acceptance-manifest.json'), ['tests-tools', 'development']);
  assert.deepEqual(classify('assets/openbrowser-title.svg'), ['resources-data', 'supported']);
  assert.deepEqual(classify('README.md'), ['documentation', 'reference']);
  assert.deepEqual(classify('docs/rebuild/BUILD-REPRODUCIBILITY.md'), ['documentation', 'reference']);
  assert.deepEqual(classify('docs/rebuild/evidence/acceptance/run.log'), ['documentation-evidence', 'reference']);
});

test('classifies local services separately from assembled renderer modules and packaged skills', () => {
  assert.deepEqual(classify('Browserapp/rebuild/routes/collections.js'), ['workbench-services', 'supported']);
  assert.deepEqual(classify('Browserapp/rebuild/workbench-table.mjs'), ['workbench', 'supported']);
  assert.deepEqual(classify('Browserapp/rebuild/skills/automation-script-writing/SKILL.md'), ['skill-packages', 'supported']);
  assert.deepEqual(classify('Browserapp/automation/protocol/event-map.js'), ['protocol-contracts', 'supported']);
  assert.deepEqual(classify('Browserapp/bundled-extension/manifest.json'), ['bundled-extension', 'supported']);
});

test('inventory CLI writes a categorized report without reinterpreting shipping rules', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'openbrowser-inventory-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const output = path.join(temp, 'reports', 'inventory.json');
  const stdout = execFileSync(process.execPath, [require.resolve('./module-inventory'), '--output', output], {
    cwd: temp,
    encoding: 'utf8',
  });
  const { totals, files } = JSON.parse(fs.readFileSync(output, 'utf8'));
  assert.deepEqual(JSON.parse(stdout), { output, totals });
  const byPath = new Map(files.map((row) => [row.file, row]));
  assert.equal(byPath.size, files.length);
  assert.equal(Object.values(totals).reduce((sum, category) => sum + category.files, 0), files.length);
  const find = (filename, category, shipped) => {
    const row = byPath.get(filename);
    assert.ok(row, filename);
    assert.equal(row.category, category);
    assert.equal(row.shipped, shipped);
  };
  find('Browserapp/main.js', 'desktop-host', true);
  find('Browserapp/frontend/workbench/index.html', 'frontend-build-inputs', false);
  find('Browserapp/frontend/build-workbench.cjs', 'build-tools', false);
  find('Browserapp/scripts/module-inventory.test.js', 'tests-tools', false);
  find('docs/code-organization.md', 'documentation', false);
});
