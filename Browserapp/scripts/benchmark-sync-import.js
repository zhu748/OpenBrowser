#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');

function load(relative, revision) {
  const filename = path.join(root, relative);
  if (revision === 'working') return require(filename);
  const source = execFileSync('git', ['show', revision + ':Browserapp/' + relative], { cwd: root, encoding: 'utf8' });
  const loaded = new Module(filename, module);
  loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source, filename);
  return loaded.exports;
}
const median = (samples) => [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];

async function worker(revision, scenario) {
  const samples = [];
  if (scenario === 'mapping') {
    const { LiveSyncController } = load('live-sync-v5.js', revision);
    const host = 'a'.repeat(32), count = 1000;
    let reads = 0, idReads = 0;
    const tabs = (prefix, probe = false) => Array.from({ length: count }, (_, i) => {
      const value = { id: prefix + i, url: `chrome-extension://${host}/page${i}.html` };
      if (probe) Object.defineProperties(value, {
        id: { get() { idReads += 1; return prefix + i; } },
        url: { get() { reads += 1; return `chrome-extension://${host}/page${i}.html`; } },
      });
      return value;
    });
    const masters = tabs('master'), slaves = tabs('slave');
    const controller = new LiveSyncController({ running: new Map() }, () => {});
    controller.master = { id: 'master' }; controller.slaves = [{ id: 'slave' }];
    // Isolate target mapping from permission resolution and real socket I/O.
    controller.masterExtensionWhitelist = () => new Set([host]);
    controller.attachExtensionPage = async () => {};
    for (let i = 0; i < 6; i += 1) {
      controller.extensionMap.clear(); reads = 0; idReads = 0;
      const started = performance.now();
      await controller.refreshExtensionConnections(masters, new Map([['slave', slaves]]));
      if (i) samples.push(performance.now() - started);
      for (let j = 0; j < count; j += 1) assert.equal(controller.extensionMap.get('master' + j).get('slave').id, 'slave' + j);
    }
    // Count property reads separately so instrumentation cannot inflate timing.
    controller.extensionMap.clear(); reads = 0; idReads = 0;
    await controller.refreshExtensionConnections(tabs('master', true), new Map([['slave', tabs('slave', true)]]));
    return { pagesPerBrowser: count, medianMs: median(samples), samplesMs: samples, urlReadsPerRefresh: reads, idReadsPerRefresh: idReads };
  }

  const { RpaEngine } = load('automation/rpa-engine.js', revision);
  const { csvChunks } = require('../automation/rpa/csv');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-import-benchmark-'));
  const filename = path.join(temp, 'input.csv');
  async function fixture() {
    const records = Array.from({ length: 50000 }, (_, i) => ({ id: String(i), name: '环境-' + i, text: 'a,"b"' + 'value'.repeat(20), tag: 'tag' }));
    const handle = await fs.open(filename, 'w');
    try { for (const chunk of csvChunks(records, ['id', 'name', 'text', 'tag'])) await handle.writeFile(chunk); }
    finally { await handle.close(); }
  }
  await fixture();
  const rpa = Object.create(RpaEngine.prototype);
  rpa.resolveSpreadsheetPath = async () => filename;
  const heaps = [], gaps = [];
  let sha256, rows;
  try {
    for (let i = 0; i < 4; i += 1) {
      global.gc();
      const before = process.memoryUsage().heapUsed;
      let peak = before;
      let lastSampleAt = performance.now(), maxGapMs = 0;
      const sample = () => {
        const now = performance.now(); maxGapMs = Math.max(maxGapMs, now - lastSampleAt); lastSampleAt = now;
        peak = Math.max(peak, process.memoryUsage().heapUsed);
      };
      const timer = setInterval(sample, 1);
      const variables = {};
      const started = performance.now();
      try {
        await rpa.stepUseExcel({ params: { path: filename, variable: 'rows' }, variables, ctx: {}, text: String });
        sample();
      } finally { clearInterval(timer); }
      const elapsed = performance.now() - started;
      if (i) { samples.push(elapsed); heaps.push(peak - before); gaps.push(maxGapMs); }
      rows = variables.rows.length;
      sha256 = crypto.createHash('sha256').update(JSON.stringify(variables.rows)).digest('hex');
    }
    return { records: rows, fileBytes: (await fs.stat(filename)).size, sha256,
      medianMs: median(samples), samplesMs: samples,
      medianSampledHeapGrowthBytes: median(heaps), sampledHeapGrowthBytes: heaps,
      medianMaxSampleGapMs: median(gaps), maxSampleGapsMs: gaps,
      heapMeasurement: 'heapUsed sampled on a 1ms interval and completion; includes parsed records, not a precise peak/RSS bound' };
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
}

async function main() {
  if (process.argv[2] === '--worker') {
    console.log(JSON.stringify(await worker(process.argv[3], process.argv[4]))); return;
  }
  const baseline = process.argv[2] || 'c1c02c6';
  const result = { baseline, node: process.version, measuredAt: new Date().toISOString(),
    scope: 'in-memory extension page mapping with injected whitelist; local CSV import; no GUI or real browser' };
  for (const scenario of ['mapping', 'csvImport']) {
    const run = (revision) => JSON.parse(execFileSync(process.execPath, ['--expose-gc', __filename, '--worker', revision, scenario], { encoding: 'utf8' }));
    const before = run(baseline), after = run('working');
    if (scenario === 'csvImport') assert.equal(before.sha256, after.sha256);
    result[scenario] = { before, after };
  }
  console.log(JSON.stringify(result, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
