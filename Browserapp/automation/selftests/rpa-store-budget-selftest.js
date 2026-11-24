'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { enforceStoreBudget } = require('../rpa-store-budget');
const { RpaStore } = require('../rpa-store');
const { decryptCredential } = require('../../credential-crypto');
const { collectStorageDiagnostics } = require('../storage-diagnostics');
const bytes = (value) => Buffer.byteLength(JSON.stringify(value), 'utf8');

async function checkLoadRecovery(root) {
  const file = path.join(root, 'recovery.json');
  const knownGood = JSON.stringify({ version: 4, plans: [{ id: 'keep' }], tasks: [], templates: [], config: {} });
  const broken = '{malformed';
  const readFile = fs.readFile, rename = fs.rename, warn = console.warn;
  let renameCalls = 0, writes = 0;
  const makeStore = () => {
    const store = new RpaStore(file);
    store.ensureBuiltinTemplates = async () => {};
    store.ensureLocalCatalogTemplates = async () => {};
    const write = store._writeAtomic.bind(store);
    store._writeAtomic = async () => { writes += 1; await write(); };
    return store;
  };
  const diagnostics = (rpaStore) => collectStorageDiagnostics({ automation: { rpaStore } }).warnings;
  try {
    console.warn = () => {};
    await fs.writeFile(file, knownGood);
    fs.rename = async (...args) => { renameCalls += 1; return rename(...args); };
    fs.readFile = async (target, ...args) => {
      if (target === file) throw Object.assign(new Error('fixture read failure'), { code: 'EIO' });
      return readFile(target, ...args);
    };
    const unreadable = makeStore();
    await assert.rejects(unreadable.load(), { message: /Cannot read RPA store/ });
    await assert.rejects(unreadable.save(), /no replacement was written/);
    assert.equal(await readFile(file, 'utf8'), knownGood);
    assert.equal(writes + renameCalls, 0, 'an I/O error is not corruption');
    assert.deepEqual(diagnostics(unreadable), []);

    fs.readFile = readFile;
    await fs.writeFile(file, broken);
    fs.rename = async (from, to) => {
      if (from === file) {
        renameCalls += 1;
        throw Object.assign(new Error('fixture quarantine failure'), { code: 'EBUSY' });
      }
      return rename(from, to);
    };
    const notQuarantined = makeStore();
    await assert.rejects(notQuarantined.load(), /Cannot quarantine/);
    await assert.rejects(notQuarantined.save(), /no replacement was written/);
    assert.equal(await fs.readFile(file, 'utf8'), broken);
    assert.equal(writes, 0, 'failed quarantine must not write a replacement');
    assert.equal(renameCalls, 1);
    assert.deepEqual(diagnostics(notQuarantined), [], 'must not claim that the original was quarantined');

    fs.rename = rename;
    const quarantined = makeStore();
    await quarantined.load();
    assert.equal(quarantined.loadReport.quarantined, true);
    assert.equal(await fs.readFile(quarantined.loadReport.quarantineFile, 'utf8'), broken);
    assert.deepEqual(JSON.parse(decryptCredential(await fs.readFile(file))).plans, []);
    assert.equal(diagnostics(quarantined)[0].code, 'RPA_QUARANTINED');
    assert.equal(writes, 1);

    const virgin = new RpaStore(path.join(root, 'absent.json'));
    virgin.ensureBuiltinTemplates = async () => {};
    virgin.ensureLocalCatalogTemplates = async () => {};
    await virgin.load();
    assert.equal(virgin.loadReport.quarantined, false);
    assert.deepEqual(JSON.parse(decryptCredential(await fs.readFile(virgin.filePath))).tasks, []);
  } finally {
    fs.readFile = readFile;
    fs.rename = rename;
    console.warn = warn;
  }
}

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
    await checkLoadRecovery(root);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
  console.log('RPA_STORE_BUDGET_SELFTEST OK (serialization, retention, exact limit, real file size, fail-closed recovery)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
