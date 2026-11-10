#!/usr/bin/env node
'use strict';

// Compare actual implementations in isolated processes. No browser/GUI needed.
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
  if (revision === 'working') return require(path.join(root, relative));
  const source = execFileSync('git', ['show', revision + ':Browserapp/' + relative], { cwd: root, encoding: 'utf8' });
  const filename = path.join(root, relative);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source, filename);
  return loaded.exports;
}

function median(values) { return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]; }

async function worker(revision, scenario) {
  const samples = [];
  if (scenario === 'status') {
    const statusApi = load('engine/status-api.js', revision);
    const { createStatusController } = load('ui/ui-status-controller.js', revision);
    const rows = Array.from({ length: 10000 }, (_, i) => ({ id: 'profile-' + i, statusRev: 'token-' + i }));
    const engine = { status: () => rows };
    const watermark = statusApi.statusDelta.call(engine, null).watermark;
    const controller = createStatusController({ getRows: () => rows, setRows() {},
      fetchDelta: async () => ({ full: false, rows: [], removed: [] }) });
    for (let sample = 0; sample < 6; sample += 1) {
      const started = performance.now();
      for (let i = 0; i < 200; i += 1) {
        const delta = statusApi.statusDelta.call(engine, watermark);
        assert.equal(delta.rows.length, 0);
        await controller.refresh();
      }
      if (sample) samples.push(performance.now() - started);
    }
    return { profiles: rows.length, pollsPerSample: 200, medianMs: median(samples), samplesMs: samples };
  }
  const { RpaEngine } = load('automation/rpa-engine.js', revision);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-export-bench-'));
  const output = path.join(temp, 'export.csv');
  const records = Array.from({ length: 50000 }, (_, i) => ({
    id: String(i), name: '环境-' + i, text: 'a,"b"\n' + 'value'.repeat(20), tag: 'tag',
  }));
  const rpa = Object.create(RpaEngine.prototype);
  rpa.outputPath = () => output;
  const writeFile = fs.writeFile, open = fs.open;
  let peak = 0;
  const sampleHeap = () => { peak = Math.max(peak, process.memoryUsage().heapUsed); };
  fs.writeFile = async function (...args) { sampleHeap(); return writeFile.apply(this, args); };
  fs.open = async function (...args) {
    const handle = await open.apply(this, args);
    const write = handle.writeFile.bind(handle);
    handle.writeFile = async (...values) => { sampleHeap(); return write(...values); };
    return handle;
  };
  const heaps = [];
  try {
    for (let i = 0; i < 4; i += 1) {
      global.gc();
      const before = process.memoryUsage().heapUsed; peak = before;
      const started = performance.now();
      await rpa.stepExportExcel({ params: { data: records }, variables: {}, text: String });
      const elapsed = performance.now() - started;
      if (i) { samples.push(elapsed); heaps.push(peak - before); }
    }
    const result = await fs.readFile(output);
    return { records: records.length, outputBytes: result.length,
      sha256: crypto.createHash('sha256').update(result).digest('hex'),
      medianMs: median(samples), samplesMs: samples,
      medianSampledHeapGrowthBytes: median(heaps), sampledHeapGrowthBytes: heaps,
      heapMeasurement: 'heapUsed sampled at write boundaries; excludes input records, not an allocation or RSS bound' };
  } finally {
    fs.writeFile = writeFile; fs.open = open;
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function main() {
  if (process.argv[2] === '--worker') {
    console.log(JSON.stringify(await worker(process.argv[3], process.argv[4]))); return;
  }
  const baseline = process.argv[2] || 'c1c02c6';
  const result = { baseline, node: process.version, measuredAt: new Date().toISOString(),
    scope: '10k-row idle status computation and 50k-record CSV file export; excludes Electron IPC, GUI and browser workload' };
  for (const scenario of ['status', 'csv']) {
    const run = (revision) => JSON.parse(execFileSync(process.execPath,
      ['--expose-gc', __filename, '--worker', revision, scenario], { encoding: 'utf8', maxBuffer: 1024 * 1024 }));
    const before = run(baseline), after = run('working');
    if (scenario === 'csv') assert.equal(before.sha256, after.sha256, 'CSV bytes must remain identical');
    result[scenario] = { before, after };
  }
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
