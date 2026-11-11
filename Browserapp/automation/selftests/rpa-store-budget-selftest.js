'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { enforceStoreBudget } = require('../rpa-store-budget');
const { RpaStore } = require('../rpa-store');
const { decryptCredential } = require('../../credential-crypto');
const bytes = (value) => Buffer.byteLength(JSON.stringify(value), 'utf8');

async function main() {
  const task = (id, status = 'success') => ({ id, status, process_logs: [], process_result: { variables: { value: '字'.repeat(300) } } });
  const data = { plans: [{ id: 'plan' }], templates: [{ id: 'template' }], tasks: Array.from({ length: 1000 }, (_, i) => task(`t${i}`)) };
  const plans = structuredClone(data.plans);
  const templates = structuredClone(data.templates);
  const limit = Math.floor(bytes(data) / 4);
  const stringify = JSON.stringify;
  let calls = 0;
  JSON.stringify = (...args) => { calls += 1; return stringify(...args); };
  try { enforceStoreBudget(data, limit); }
  finally { JSON.stringify = stringify; }
  assert.ok(bytes(data) <= limit);
  assert.ok(calls <= 1001, `eviction must not repeatedly serialize the surviving tasks: ${calls}`);
  assert.equal(data.tasks[0].id, 't0');
  assert.deepEqual(data.plans, plans);
  assert.deepEqual(data.templates, templates);
  assert.ok(data.tasks.every((entry, i) => entry.id === `t${i}`), 'eviction keeps the newest prefix in order');

  const active = { plans: [], templates: [], tasks: [task('newest'), task('pending', 'pending'), task('running', 'running')] };
  const protectedIds = active.tasks.map((entry) => entry.id);
  active.tasks.forEach((entry) => { entry.process_logs = [{ message: 'x'.repeat(500) }]; });
  enforceStoreBudget(active, 700);
  assert.deepEqual(active.tasks.map((entry) => entry.id), protectedIds);
  assert.ok(active.tasks.every((entry) => !entry.process_logs.length && !entry.process_result.variables));
  assert.ok(bytes(active) <= 700);

  const exact = { tasks: [{ id: 'newest', status: 'success' }, { id: 'older', status: 'success' }] };
  const exactSize = bytes(exact);
  enforceStoreBudget(exact, exactSize);
  assert.equal(exact.tasks.length, 2, 'an exact fit does not prune');
  enforceStoreBudget(exact, bytes({ tasks: [exact.tasks[0]] }));
  assert.equal(exact.tasks.length, 1, 'comma bytes are removed with the old task');

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-rpa-budget-'));
  try {
    const file = path.join(root, 'tasks.json');
    const store = new RpaStore(file);
    store.data = structuredClone(data);
    store.sizeLimitBytes = limit;
    await store._writeAtomic();
    const raw = await fs.readFile(file);
    const plaintext = decryptCredential(raw);
    assert.ok(Buffer.byteLength(plaintext) <= limit, 'the budget bounds plaintext data before the encryption envelope');
    assert.deepEqual(JSON.parse(plaintext), store.data);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
  console.log('RPA_STORE_BUDGET_SELFTEST OK (linear serialization, retention, UTF-8, exact limit, actual file size)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
