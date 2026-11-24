'use strict';

// Run the same fixture against this checkout or pass another Browserapp directory.
const assert = require('node:assert/strict');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { pathToFileURL } = require('node:url');
const app = path.resolve(process.argv[2] ?? path.join(__dirname, '..'));
const { buildProfileIndex } = require(path.join(app, 'rebuild/profile-index'));
const { queryProfiles } = require(path.join(app, 'rebuild/profile-query'));
const { AccountStore } = require(path.join(app, 'automation/account-store'));
const { requestAccounts } = require(path.join(app, 'rebuild/accounts'));

// Four warm-up batches, followed by seven timed batches. Each batch checks
// its results, so an empty or incorrectly scoped response cannot win.
async function medianMs(batch, operations) {
  const samples = [];
  for (let i = 0; i < 11; i++) {
    const start = performance.now();
    await batch();
    if (i >= 4) samples.push((performance.now() - start) / operations);
  }
  return Number(samples.sort((a, b) => a - b)[3].toFixed(4));
}

async function main() {
  const size = 5000;
  const snapshot = Array.from({ length: size }, (_, i) => ({
    id: 'p' + i, name: 'Profile ' + i, number: size - i, groupId: 'g' + i % 100,
    tag: '1,2,3', platform: { accounts: [{ url: 'https://example.test/' }] },
  }));
  const labels = ['Office', 'Blue', 'Green'].map((name, i) => ({ id: i + 1, name }));
  const build = () => buildProfileIndex({ snapshot, groups: [], labels });
  const index = build();
  const service = { profileIndex: () => index, decorate: row => row.id };
  const { createSelectOptionModel } = await import(pathToFileURL(path.join(app,
    'frontend/src/workbench/shared/inputs/select-options.mjs')).href);
  const select = createSelectOptionModel({ filterFields: ['name', 'id', 'note', 'groupId'] });
  const store = new AccountStore();
  for (let i = 0; i < size; i++) {
    const id = 'a' + i;
    store.accounts.set(id, { id, username: 'User ' + i, url: 'https://example.test/',
      remark: 'fixture', password: 'test-only', totpSecret: 'test-only' });
  }
  const accounts = { accountStore: () => store, engine: { profiles: new Map() } };
  const results = {};
  results.buildIndex = await medianMs(() => {
    for (let j = 0; j < 12; j++) assert.equal(build().activeCount, size);
  }, 12);
  results.projectPage = await medianMs(() => {
    for (let j = 0; j < 200; j++) {
      const project = j % 100;
      const result = queryProfiles(service, { scopeProjectId: 'g' + project, pageSize: 10, pageIndex: 2 });
      assert.equal(result.total, 50);
      assert.equal(result.rows[0], 'p' + (1000 + project));
    }
  }, 200);
  results.tagSearch = await medianMs(() => {
    for (let j = 0; j < 60; j++) assert.equal(queryProfiles(service, { queryKey: 'tag', queryValue: 'green' }).total, size);
  }, 60);
  results.selectSearch = await medianMs(() => {
    for (let j = 0; j < 60; j++) assert.equal(select.filterOptions(snapshot, 'profile').length, size);
  }, 60);
  results.accountPage = await medianMs(async () => {
    for (let j = 0; j < 50; j++) {
      const result = await requestAccounts(accounts, 'list', { page_size: 20, page_index: j + 1 });
      assert.equal(result.total, size);
      assert.equal(result.rows.length, 20);
      assert.equal(result.rows[0].id, 'a' + (20 * j));
      assert.equal(result.rows[0].platformPassword, undefined);
    }
  }, 50);
  console.log(JSON.stringify({ node: process.version, platform: process.platform, size, medianMs: results }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
