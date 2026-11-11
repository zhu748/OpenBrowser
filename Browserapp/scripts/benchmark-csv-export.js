#!/usr/bin/env node
'use strict';

// Compare local export CPU costs in isolated processes; no GUI or network.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const Module = require('node:module');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const relative = 'automation/rpa/csv.js';
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

function load(revision) {
  if (revision === 'working') return require(path.join(root, relative));
  const filename = path.join(root, relative);
  const source = execFileSync('git', ['show', revision + ':Browserapp/' + relative], { cwd: root, encoding: 'utf8' });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source, filename);
  return loaded.exports;
}

function worker(revision, scenario) {
  const { csvChunks } = load(revision);
  const rowCount = scenario === 'wide' ? 20000 : 100000;
  const fields = Array.from({ length: scenario === 'wide' ? 64 : 8 }, (_, i) => 'field' + i);
  const records = Array.from({ length: rowCount }, (_, i) => Object.fromEntries(fields.map((field, j) => [
    field, j % 3 === 0 ? `环境${i},"value"\r\n😀` : `value-${i}-${j}`,
  ])));
  const samplesMs = [], heapGrowthBytes = [];
  let characters, chunks;
  for (let sample = 0; sample < 8; sample += 1) {
    global.gc();
    const beforeHeap = process.memoryUsage().heapUsed;
    const started = performance.now();
    characters = 0; chunks = 0;
    for (const chunk of csvChunks(records, fields)) { characters += chunk.length; chunks += 1; }
    const elapsed = performance.now() - started;
    if (sample) {
      samplesMs.push(elapsed);
      heapGrowthBytes.push(process.memoryUsage().heapUsed - beforeHeap);
    }
  }
  const hash = crypto.createHash('sha256');
  let bytes = 0;
  for (const chunk of csvChunks(records, fields)) { hash.update(chunk); bytes += Buffer.byteLength(chunk); }
  return { rows: rowCount, columns: fields.length, characters, bytes, chunks, sha256: hash.digest('hex'),
    medianMs: median(samplesMs), samplesMs, medianEndHeapGrowthBytes: median(heapGrowthBytes),
    heapMeasurement: 'heapUsed at iteration end minus after explicit GC; not a peak memory measurement' };
}

function main() {
  if (process.argv[2] === '--worker') {
    console.log(JSON.stringify(worker(process.argv[3], process.argv[4])));
    return;
  }
  const baseline = execFileSync('git', ['rev-parse', process.argv[2] || 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const report = { baseline, node: process.version, measuredAt: new Date().toISOString(),
    scope: 'CSV chunk generation only; synthetic in-memory records, no disk/browser/GUI; seven samples after warmup' };
  for (const scenario of ['narrow', 'wide']) {
    const run = (revision) => JSON.parse(execFileSync(process.execPath, ['--expose-gc', __filename, '--worker', revision, scenario], {
      cwd: root, encoding: 'utf8', timeout: 120000,
    }));
    const before = run(baseline), after = run('working');
    assert.equal(before.sha256, after.sha256, 'CSV output bytes must stay identical');
    assert.equal(before.bytes, after.bytes);
    report[scenario] = { before, after, speedup: before.medianMs / after.medianMs };
  }
  console.log(JSON.stringify(report, null, 2));
}

main();
