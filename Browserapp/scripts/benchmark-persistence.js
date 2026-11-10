#!/usr/bin/env node
'use strict';

/** Offline SQLite assignment benchmark; no browser, credentials or network. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');

function instrument(store) {
  const execute = store.db.exec.bind(store.db);
  let transactions = 0;
  store.db.exec = (sql) => {
    if (/^BEGIN\b/i.test(sql)) transactions += 1;
    return execute(sql);
  };
  const changes = store.db.prepare('SELECT total_changes() AS n');
  return (run) => {
    const initialTransactions = transactions;
    const initialChanges = changes.get().n;
    const start = performance.now();
    run();
    return { ms: performance.now() - start, transactions: transactions - initialTransactions,
      rowChanges: changes.get().n - initialChanges };
  };
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-persistence-benchmark-'));
  const full = new ProfileStoreSqlite({ dbPath: path.join(root, 'full.db') });
  const diff = new ProfileStoreSqlite({ dbPath: path.join(root, 'diff.db') });
  try {
    await full.init();
    await diff.init();
    const assignments = new Map(Array.from({ length: 1000 }, (_, i) => [`env-${i}`, new Set(['a', 'b', 'c'])]));
    full.saveAssignmentsDiffed(assignments);
    diff.saveAssignmentsDiffed(assignments);
    const measureFull = instrument(full);
    const measureDiff = instrument(diff);
    const saveFull = () => { for (const [id, ids] of assignments) full.setAssignments(id, ids); };
    const saveDiff = () => diff.saveAssignmentsDiffed(assignments);
    const results = [];
    for (const scenario of ['unchanged', 'one profile changed']) {
      const before = [];
      const after = [];
      for (let run = 0; run < 11; run += 1) {
        if (scenario !== 'unchanged') assignments.set('env-0', new Set(['a', 'b', 'c', run % 2 ? 'x' : 'y']));
        const a = measureFull(saveFull);
        const b = measureDiff(saveDiff);
        if (run >= 2) { before.push(a); after.push(b); }
      }
      const median = (values) => values.sort((a, b) => a.ms - b.ms)[Math.floor(values.length / 2)];
      const a = median(before);
      const b = median(after);
      results.push({ scenario, before: { ...a, ms: +a.ms.toFixed(4) }, after: { ...b, ms: +b.ms.toFixed(4) },
        speedup: +(a.ms / b.ms).toFixed(2) });
      assert.deepEqual(full.getAssignments(), diff.getAssignments(), 'saved relations must match');
    }
    console.log(JSON.stringify({ node: process.version, profiles: assignments.size, assignmentsPerProfile: 3,
      samples: '2 warmup runs + median of 9 runs per scenario',
      comparison: 'per-profile setAssignments versus saveAssignmentsDiffed, both real SQLite WAL files', results }, null, 2));
  } finally {
    full.close();
    diff.close();
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
