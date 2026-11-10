#!/usr/bin/env node
'use strict';

/** Offline review benchmark against a Git revision; uses synthetic data only. */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { performance } = require('node:perf_hooks');
const { BrowserEngine } = require('../engine');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');
const { reconcileProfiles } = require('../ui/ui-profile-state');

const ROOT = path.resolve(__dirname, '../..');
const baseline = process.argv[2] || '65ddc51';
const revision = execFileSync('git', ['rev-parse', '--verify', `${baseline}^{commit}`], { cwd: ROOT, encoding: 'utf8' }).trim();
const sourceAt = (file) => execFileSync('git', ['show', `${revision}:${file}`], { cwd: ROOT, encoding: 'utf8' });
function loadBaseline(file) {
  const filename = path.join(ROOT, file);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(sourceAt(file), filename);
  return loaded.exports;
}
function median(samples) {
  return samples.sort((a, b) => a.ms - b.ms)[Math.floor(samples.length / 2)];
}

function benchmarkRestore() {
  const source = sourceAt('Browserapp/renderer.js');
  const start = source.indexOf('      for (const remote of engineStatus)');
  const end = source.indexOf('\n    }\n  } catch', start);
  assert.ok(start >= 0 && end > start, 'baseline contains the engine-only restore loop');
  const legacy = new Function('ui', 'engineStatus', 'normalizeProfileSettings', source.slice(start, end) + '\nreturn ui.profiles;');
  const profiles = Array.from({ length: 1000 }, (_, i) => ({ id: `env-${i}`, name: `Environment ${i}` }));
  const current = (rows) => reconcileProfiles({
    localProfiles: [], engineProfiles: rows, normalizeProfile: (value) => value, mergeProxy: (_a, b) => b,
  });
  assert.deepEqual(legacy({ profiles: [] }, profiles, (value) => value), current(profiles));
  const results = [];
  for (const run of [(rows) => legacy({ profiles: [] }, rows, (value) => value), current]) {
    const samples = [];
    for (let i = 0; i < 11; i++) {
      const start = performance.now();
      for (let repeat = 0; repeat < 30; repeat++) run(profiles);
      if (i >= 2) samples.push({ ms: +( (performance.now() - start) / 30).toFixed(4) });
    }
    let idReads = 0;
    const observed = profiles.map((profile) => ({ get id() { idReads++; return profile.id; } }));
    run(observed);
    results.push({ ...median(samples), idReads });
  }
  return { profiles: profiles.length, before: results[0], after: results[1] };
}

async function benchmarkSync() {
  const previous = loadBaseline('Browserapp/engine/profile-store-api.js');
  const profiles = Array.from({ length: 1000 }, (_, i) => ({ id: `env-${i}`, name: `Environment ${i}`, cookies: 'x'.repeat(10000) }));
  const results = [];
  for (const sync of [previous.syncProfiles, BrowserEngine.prototype.syncProfiles]) {
    const engine = new BrowserEngine({ getPath: () => os.tmpdir() });
    const store = Object.create(ProfileStoreSqlite.prototype);
    let hashes = 0;
    store.saveProfiles = () => {};
    store.profileDataHash = (profile) => { hashes++; return ProfileStoreSqlite.prototype.profileDataHash(profile); };
    engine.usingSqlite = true;
    engine.sqliteStore = {
      setMeta() {}, saveExtensions() {}, saveAssignmentsDiffed() {},
      saveProfilesDiffed: (values) => store.saveProfilesDiffed(values),
    };
    // Exclude the 50ms quiet period and real disk/encryption from this CPU path.
    engine.persist = () => engine._persistNow();
    const samples = [];
    for (let i = 0; i < 11; i++) {
      // IPC transfers fresh objects on each invoke, as in the desktop host.
      const input = structuredClone(profiles);
      hashes = 0;
      const start = performance.now();
      await sync.call(engine, input);
      if (i >= 2) samples.push({ ms: +(performance.now() - start).toFixed(4), hashes });
    }
    results.push(median(samples));
  }
  return { profiles: profiles.length, cookieBytesPerProfile: 10000, before: results[0], after: results[1] };
}

async function benchmarkRows(root) {
  const PreviousStore = loadBaseline('Browserapp/automation/profile-store-sqlite.js').ProfileStoreSqlite;
  const stores = [new PreviousStore({ dbPath: path.join(root, 'before.db') }), new ProfileStoreSqlite({ dbPath: path.join(root, 'after.db') })];
  const extensions = Array.from({ length: 100 }, (_, i) => ({ id: `ext-${i}`, name: `Extension ${i}`, version: '1' }));
  const results = [];
  try {
    for (const store of stores) {
      await store.init();
      const save = () => {
        for (const key of ['kernelPolicyVersion', 'preferIndependentKernel', 'allowSystemBrowserFallback', 'systemBrowserPath']) store.setMeta(key, true);
        store.saveExtensions(extensions);
      };
      save();
      const changes = store.db.prepare('SELECT total_changes() AS n');
      const rowCounts = [];
      for (const changed of [false, true]) {
        if (changed) extensions[0].name = 'Changed';
        const before = changes.get().n;
        save();
        rowCounts.push(changes.get().n - before);
      }
      results.push({ unchangedRowWrites: rowCounts[0], singleEditRowWrites: rowCounts[1] });
      extensions[0].name = 'Extension 0';
    }
    assert.deepEqual(stores[0].listExtensions(), stores[1].listExtensions());
    return { extensions: extensions.length, metadataKeys: 4, before: results[0], after: results[1] };
  } finally { for (const store of stores) store.close(); }
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-maintenance-bench-'));
  try {
    const restore = benchmarkRestore();
    const sync = await benchmarkSync();
    const sqliteRows = await benchmarkRows(root);
    console.log(JSON.stringify({ baseline: revision, node: process.version, platform: process.platform,
      samples: '2 warmups + median of 9 samples; restore uses 30 calls per sample',
      scope: 'synthetic engine-only restore, sync sanitization/hash CPU, actual SQLite row-change counts; excludes desktop IPC, browsers and credential encryption',
      restore, sync, sqliteRows }, null, 2));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
