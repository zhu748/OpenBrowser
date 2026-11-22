'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-list-cache-'));
  try {
    const source = path.resolve(__dirname, '../../frontend/src/workbench/shared/workbench-list-cache.mjs');
    const file = path.join(root, 'workbench-list-cache.mjs');
    const aliases = {
      'package.json': '{"type":"module"}',
      'workbench-vue.js': 'export const ref = value => ({ value });',
      'agent-BmSFI9WH.js': 'export const i = (_id, setup) => setup;',
      'workbench-local-workspace.js': 'export const useWorkspace = () => ({});',
      'workbench-table.js': 'export const listCacheVersion = () => 0;',
    };
    await Promise.all([
      fs.copyFile(source, file),
      ...Object.entries(aliases).map(([name, text]) => fs.writeFile(path.join(root, name), text)),
    ]);
    const { bt: useListCache, vt: { BROWSER_LIST: list } } = await import(pathToFileURL(file).href);
    const cache = useListCache();
    const projects = Array.from({ length: 100 }, (_, projectId) => ({ projectId }));
    const peek = project => cache.peekScrollOffset(list, 'primary', project);
    for (const [index, project] of projects.entries()) cache.setScrollOffset(list, 'primary', project, index + 10);
    assert.equal(projects.filter(project => peek(project) !== null).length, 5, 'scroll-only project entries share the five-project limit');
    assert.equal(peek(projects[94]), null);
    assert.equal(peek(projects[95]), 105);

    const leave = (project, offset) => {
      cache.set(list, 'primary', project, { rows: [{ id: offset }] });
      cache.setScrollOffset(list, 'primary', project, offset);
    };
    cache.clearAll();
    cache.setScrollOffset(list, 'secondary', projects[0], 200);
    leave(projects[0], 100);
    cache.invalidate(list, 'primary', projects[0]);
    assert.equal(cache.get(list, 'primary', projects[0]), null);
    assert.equal(peek(projects[0]), 100, 'refreshing rows must not discard the current scroll position');
    leave(projects[1], 101);
    cache.invalidate(list, 'primary');
    assert.equal(cache.get(list, 'primary', projects[1]), null);
    assert.equal(peek(projects[1]), 101);
    for (let i = 2; i <= 5; i++) leave(projects[i], i + 100);
    assert.equal(peek(projects[0]), null, 'old position still participates in eviction after row invalidation');
    assert.equal(peek(projects[1]), 101);
    assert.equal(cache.peekScrollOffset(list, 'secondary', projects[0]), 200, 'workspace buckets are independent');

    cache.clearScrollOffset(list, 'primary', projects[1]);
    cache.clearScrollOffset(list, 'primary', projects[5]); // Still has rows, so retains its slot.
    leave(projects[6], 106);
    assert.equal(peek(projects[2]), 102, 'an empty cleared entry must not cause extra eviction');
    assert.deepEqual(cache.get(list, 'primary', projects[5]).rows, [{ id: 105 }]);
    leave(projects[7], 107);
    assert.equal(cache.get(list, 'primary', projects[2]), null);
    assert.equal(peek(projects[2]), null, 'normal LRU eviction clears both row and scroll entries');
    console.log('WORKBENCH_LIST_CACHE_SELFTEST OK (five-project budget, row invalidation, workspace isolation and cleanup)');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
