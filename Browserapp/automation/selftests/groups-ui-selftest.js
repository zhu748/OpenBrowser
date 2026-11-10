'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function main() {
  const profiles = Array.from({ length: 1000 }, (_, i) => ({ id: `env-${i}`, groupId: 'old' }));
  const selected = new Set(profiles.filter((_, i) => i % 10 === 0).map((profile) => profile.id));
  let synced;
  const scope = vm.createContext({
    ui: { profiles }, selectedProfiles: selected, UNGROUPED_ID: '', engineProfiles: [],
    findGroup: (id) => id === 'new' ? { id } : null,
    save() {}, renderProfiles() {}, toast() {}, log() {}, tx: (text) => text,
    groupNameOf: () => 'New', window: { ops: { syncProfiles: async (values) => { synced = values; return values; } } },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../../ui/ui-groups.js'), 'utf8'), scope);
  await scope.assignSelectedToGroup('new');
  assert.equal(synced.length, 1000);
  for (let i = 0; i < profiles.length; i += 1) {
    assert.equal(scope.ui.profiles[i].groupId, selected.has(profiles[i].id) ? 'new' : 'old');
    if (!selected.has(profiles[i].id)) assert.equal(scope.ui.profiles[i], profiles[i], 'unselected objects retain their identity');
  }
  await scope.assignSelectedToGroup('ungrouped');
  assert.equal(scope.ui.profiles[0].groupId, '');
  await assert.rejects(scope.assignSelectedToGroup('missing'), /分组不存在/);
  scope.selectedProfiles = new Set();
  await assert.rejects(scope.assignSelectedToGroup('new'), /请先勾选环境/);
  console.log('GROUPS_UI_SELFTEST OK (1000 profiles, partial selection, ungrouped, validation)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
