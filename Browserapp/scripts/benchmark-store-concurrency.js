#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const median = (samples) => [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)];
const digest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function load(relative, revision) {
  const filename = path.join(root, relative);
  if (revision === 'working') return require(filename);
  const source = execFileSync('git', ['show', revision + ':Browserapp/' + relative], { cwd: root, encoding: 'utf8' });
  const loaded = new Module(filename, module);
  loaded.filename = filename; loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source, filename);
  return loaded.exports;
}

async function proxyWorker(revision, batchSize) {
  const { ProxyStore, normalizeProxyRecord } = load('automation/proxy-store.js', revision);
  const proxies = Array.from({ length: 5000 }, (_, i) => normalizeProxyRecord({ id: 'proxy-' + i, raw: `http://proxy-${i}.test:8080` }));
  const samplesMs = [];
  let results, signature;
  for (let sample = 0; sample < 8; sample += 1) {
    const store = new ProxyStore('unused');
    store.data.items = structuredClone(proxies);
    // Keep cloning, indexing, updates and outcome delivery in the measured
    // production path; omit encryption and filesystem work deliberately.
    store._persistData = async () => {};
    global.gc();
    const started = performance.now();
    results = await Promise.all(Array.from({ length: batchSize }, (_, i) => store.markCheck(
      'proxy-' + Math.floor(i * proxies.length / batchSize), { ip: '192.0.2.' + (i % 250 + 1) },
    )));
    if (sample) samplesMs.push(performance.now() - started);
    signature = digest(results.map(({ id, lastIp, lastCheckOk }) => ({ id, lastIp, lastCheckOk })));
  }
  return { proxies: proxies.length, checks: batchSize, medianMs: median(samplesMs), samplesMs, sha256: signature };
}

async function settingsWorker(revision) {
  const settings = load('automation/local-settings.js', revision);
  const credentials = require('../credential-crypto');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-settings-benchmark-'));
  const keepAlive = setInterval(() => {}, 1000);
  const file = path.join(temp, 'settings.json');
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(temp, 'master.key');
  credentials.resetLocalMasterKeyCache();
  const read = fs.readFile;
  const samplesMs = [], readCounts = [];
  let reads = 0, value;
  try {
    settings.initLocalSettings({ file, defaultProfileDataRoot: path.join(temp, 'profiles') });
    await settings.loadLocalSettings();
    await settings.saveLocalSettings({ memoryLimit: 81, uiGroups: Array.from({ length: 2000 }, (_, i) => ({
      id: 'g' + i, name: '分组 ' + i, color: '#123456', note: 'group note '.repeat(10),
    })) });
    fs.readFile = async (...args) => { if (args[0] === file) reads += 1; return read(...args); };
    for (let sample = 0; sample < 8; sample += 1) {
      reads = 0; global.gc();
      const started = performance.now();
      [value] = await Promise.all(Array.from({ length: 20 }, () => settings.loadLocalSettings()));
      if (sample) { samplesMs.push(performance.now() - started); readCounts.push(reads); }
    }
    return { concurrentReloads: 20, groups: value.uiGroups.length, medianMs: median(samplesMs), samplesMs,
      readsPerSample: readCounts, sha256: digest({ cloud: value.cloud, uiGroups: value.uiGroups, memoryLimit: value.memoryLimit }) };
  } finally {
    fs.readFile = read; clearInterval(keepAlive); credentials.resetLocalMasterKeyCache();
    await fs.rm(temp, { recursive: true, force: true });
  }
}

async function main() {
  if (process.argv[2] === '--worker') {
    const scenario = process.argv[4];
    const result = scenario === 'settings' ? await settingsWorker(process.argv[3])
      : await proxyWorker(process.argv[3], scenario === 'proxy500' ? 500 : 5000);
    console.log(JSON.stringify(result)); return;
  }
  const baseline = execFileSync('git', ['rev-parse', process.argv[2] || 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const report = { baseline, node: process.version, measuredAt: new Date().toISOString(),
    scope: 'seven samples after warmup in isolated processes; proxy updates omit disk/encryption; settings use local encrypted files; no browser/GUI' };
  for (const scenario of ['proxy500', 'proxy5000', 'settings']) {
    const run = (revision) => JSON.parse(execFileSync(process.execPath, ['--expose-gc', __filename, '--worker', revision, scenario], {
      cwd: root, encoding: 'utf8', timeout: 120000,
    }));
    const before = run(baseline), after = run('working');
    assert.equal(before.sha256, after.sha256, 'observable result data must stay identical');
    report[scenario] = { before, after, speedup: before.medianMs / after.medianMs };
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
