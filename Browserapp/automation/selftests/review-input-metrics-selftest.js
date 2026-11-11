'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { readCsvRecords, readTextLines, readJsonRecords } = require('../rpa/file-input');
const { LoopMonitor } = require('../event-loop-monitor');
const { collectStorageDiagnostics } = require('../storage-diagnostics');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-review-input-'));
  try {
    const csv = path.join(root, 'data.csv');
    await fs.writeFile(csv, 'name\n"中文😀"\nsecond\n');
    assert.equal((await readCsvRecords(csv)).length, 2);
    await assert.rejects(readCsvRecords(csv, () => {}, { maxRows: 1 }), /row limit/);
    await assert.rejects(readCsvRecords(csv, () => {}, { maxFieldChars: 3 }), /character limit/);
    await assert.rejects(readCsvRecords(csv, () => {}, { maxBytes: 8 }), /byte limit/);
    await fs.writeFile(csv, 'a,b\n1,2\n');
    await assert.rejects(readCsvRecords(csv, () => {}, { maxColumns: 1 }), /column limit/);
    await fs.writeFile(csv, 'value\n"' + 'x'.repeat(65540) + '"\n');
    await assert.rejects(readCsvRecords(csv, () => {}, { maxFieldChars: 65536 }), /character limit/);
    const text = path.join(root, 'data.txt');
    await fs.writeFile(text, '中文😀\r\nsecond');
    assert.deepEqual(await readTextLines(text), ['中文😀', 'second']);
    await assert.rejects(readTextLines(text, () => {}, { maxRows: 1 }), /row limit/);
    await assert.rejects(readTextLines(text, () => {}, { maxFieldChars: 2 }), /character limit/);
    const json = path.join(root, 'data.json');
    await fs.writeFile(json, '[{"value":"中文😀"},{}]');
    assert.equal((await readJsonRecords(json)).length, 2);
    await assert.rejects(readJsonRecords(json, () => {}, { maxRows: 1 }), /row limit/);
    await assert.rejects(readJsonRecords(json, () => {}, { maxBytes: 4 }), /byte limit/);
    await assert.rejects(readJsonRecords(json, () => { throw new Error('cancelled'); }), /cancelled/);
    const monitor = new LoopMonitor({ histogram: {
      reset() {}, enable() {}, disable() {}, count: 1234, max: 500000000,
      percentile(p) { return p * 1000000; },
      get mean() { throw new Error('averages must not replace histogram percentiles'); },
    } });
    assert.deepEqual(monitor.start().stop(), { p50Ms: 50, p95Ms: 95, p99Ms: 99, maxMs: 500, rawCount: 1234 });
    const diagnostics = collectStorageDiagnostics({ engine: { storageRecovery: true,
      sqliteStore: { decodeFailureReport: () => ({ count: 3, samples: [{ raw: 'never-expose-this-secret' }] }) } },
    automation: { rpaStore: { loadReport: { quarantined: true, error: 'never-expose-this-secret' } },
      proxyStore: { loadReport: { badRecordCount: 2, badRecords: ['never-expose-this-secret'] } } } });
    assert.equal(diagnostics.warnings.length, 4);
    assert.ok(!JSON.stringify(diagnostics).includes('never-expose-this-secret'));
    assert.deepEqual(collectStorageDiagnostics().warnings, []);
    console.log('REVIEW_INPUT_METRICS_SELFTEST OK (byte/row/field/column budgets, multi-chunk parsing, real histogram percentiles)');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
