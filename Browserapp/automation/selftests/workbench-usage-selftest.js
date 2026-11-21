'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { LocalService } = require('../../rebuild/local-service');

async function main() {
  const { createUsageCounter } = await import('../../rebuild/workbench-usage.mjs');
  const pending = [], values = [], errors = [];
  const counter = createUsageCounter({
    read: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
    update: value => values.push(value), onError: error => errors.push(error),
  });
  const first = counter.refresh();
  for (let i = 0; i < 100; i++) counter.refresh();
  assert.equal(pending.length, 1);
  pending[0].resolve({ count: 1000 });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(pending.length, 2, 'bursts coalesce to one trailing request');
  pending[1].resolve({ count: 1001 });
  await first;
  assert.deepEqual(values, [1000, 1001]);
  const failing = counter.refresh(); pending[2].reject(Error('offline')); await failing;
  assert.deepEqual(values, [1000, 1001], 'failed reads preserve the last count');
  assert.equal(errors.length, 1);
  const late = counter.refresh(); counter.dispose(); pending[3].resolve({ count: 1 }); await late;
  assert.deepEqual(values, [1000, 1001]);
  await counter.refresh(); assert.equal(pending.length, 4);

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-usage-'));
  let snapshot = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: 'Window', trashed: i < 10 }));
  const service = new LocalService({
    root,
    engine: { profiles: new Map(snapshot.map(profile => [profile.id, profile])), status: () => snapshot, emit() {} },
  });
  try {
    await service.load();
    service.decorate = () => { throw Error('count must not expand profile DTOs'); };
    assert.deepEqual(await service.request('profiles:count'), { count: 990 });
    const cached = service.profileIndex();
    assert.deepEqual(await service.request('profiles:count'), { count: 990 });
    assert.equal(service.profileIndex(), cached);
    snapshot = [...snapshot, { id: 'new', name: 'New' }];
    assert.deepEqual(await service.request('profiles:count'), { count: 991 });
  } finally { await service.agent.shutdown(); await fs.rm(root, { recursive: true, force: true }); }
  console.log('WORKBENCH_USAGE OK (bounded count DTO, projection reuse, burst coalescing, failure preservation, unmount isolation)');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
