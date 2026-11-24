'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const routes = require('../../rebuild/routes/collections');

const [, groupsList] = routes.find(([name]) => name === 'groups:list');

function fixture(pinAt, defaultProjectPin = 0, size = 1000) {
  const work = { indexCalls: 0, countLookups: [], clones: [] };
  const data = {
    groups: Array.from({ length: size }, (_, i) => {
      const id = 'group-' + i;
      const metadata = { description: id };
      return {
        id,
        projectName: 'Project ' + i,
        pinStatus: pinAt.get(i) ?? 0,
        get metadata() {
          work.clones.push(id);
          return metadata;
        },
      };
    }),
    settings: { defaultProjectPin },
  };
  const activeByProject = new Map([['', Array(7)], ['group-50', Array(4)]]);
  return {
    data,
    work,
    profileIndex() {
      work.indexCalls++;
      return {
        activeByProject: {
          get(id) {
            work.countLookups.push(id);
            return activeByProject.get(id);
          },
        },
      };
    },
  };
}

test('pinned sidebar projects only returned rows, keeping list order and default count', async () => {
  const service = fixture(new Map([[50, 1], [200, '1'], [900, 1]]), 1);
  const rows = await groupsList(service, { default: 2, pinnedOnly: true });
  assert.deepEqual(rows.map((row) => row.id), ['local-default', 'group-50', 'group-900']);
  assert.deepEqual(rows.map((row) => row.windowCount), [7, 4, 0]);
  assert.deepEqual(rows.map((row) => row.projectId), rows.map((row) => row.id));
  assert.deepEqual(rows.map((row) => row.project_id), rows.map((row) => row.id));
  assert.equal(rows[0].projectDefault, 1);
  assert.deepEqual(rows[0].user_info, [{ userId: 'local', userName: 'OpenBrowser', pinStatus: 1 }]);
  assert.deepEqual(service.work, {
    indexCalls: 1,
    countLookups: ['group-50', 'group-900', ''],
    clones: ['group-50', 'group-900'],
  });
  rows[1].metadata.description = 'changed by caller';
  assert.equal(service.data.groups[50].metadata.description, 'group-50');
});

test('an empty response does not access the profile index', async () => {
  const unpinned = fixture(new Map([[50, '1']]), '1');
  const empty = fixture(new Map(), 0, 0);
  assert.deepEqual(await groupsList(unpinned, { default: 2, pinnedOnly: true }), []);
  assert.deepEqual(await groupsList(empty, {}), []);
  assert.deepEqual(unpinned.work, { indexCalls: 0, countLookups: [], clones: [] });
  assert.deepEqual(empty.work, { indexCalls: 0, countLookups: [], clones: [] });
});

test('unfiltered lists keep every real project and include default only for numeric mode 2', async () => {
  const service = fixture(new Map([[1, 1]]), 0, 3);
  const rows = await groupsList(service, { default: 2 });
  assert.deepEqual(rows.map((row) => row.id), ['local-default', 'group-0', 'group-1', 'group-2']);
  assert.equal(rows[0].pinStatus, 0);
  assert.deepEqual((await groupsList(service, { default: '2' })).map((row) => row.id), ['group-0', 'group-1', 'group-2']);
  assert.deepEqual((await groupsList(service, { pinnedOnly: true })).map((row) => row.id), ['group-1']);
  const defaultOnly = await groupsList(fixture(new Map(), 1, 0), { default: 2, pinnedOnly: true });
  assert.deepEqual(defaultOnly.map((row) => [row.id, row.windowCount]), [['local-default', 7]]);
});
