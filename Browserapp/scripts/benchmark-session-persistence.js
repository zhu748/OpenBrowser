#!/usr/bin/env node
'use strict';

/** Reproducible, offline session-load and SQLite transaction measurements. */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const http = require('node:http');
const { performance } = require('node:perf_hooks');
const { BrowserEngine } = require('../engine');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');
const cdp = require('../cdp');
const crypto = require('../credential-crypto');

const ROOT = path.resolve(__dirname, '../..');
const revision = execFileSync('git', ['rev-parse', '--verify', `${process.argv[2] || '65ddc51'}^{commit}`], { cwd: ROOT, encoding: 'utf8' }).trim();
const source = (file) => execFileSync('git', ['show', `${revision}:${file}`], { cwd: ROOT, encoding: 'utf8' });
function loadBaseline(file) {
  const filename = path.join(ROOT, file);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(source(file), filename);
  return loaded.exports;
}

async function benchmarkSessions() {
  let active = 0;
  let peak = 0;
  let requests = 0;
  const server = http.createServer((_req, res) => {
    requests++;
    peak = Math.max(peak, ++active);
    setTimeout(() => {
      active--;
      res.end(JSON.stringify([{ id: 'tab', type: 'page', webSocketDebuggerUrl: 'ws://example.test/tab' }]));
    }, 20);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const method = source('Browserapp/engine.js').split('\n').find((line) => line.startsWith('  async sessions()'));
  assert.ok(method, 'baseline contains the original session inventory method');
  const previous = new Function('cdp', `return { ${method} }.sessions;`)(cdp);
  const results = [];
  try {
    for (const count of [10, 100]) {
      const metrics = [];
      let baselineResults;
      for (const run of [previous, BrowserEngine.prototype.sessions]) {
        const engine = Object.assign(Object.create(BrowserEngine.prototype), {
          profiles: new Map(Array.from({ length: count }, (_, i) => [`env-${i}`, { id: `env-${i}` }])),
          running: new Map(Array.from({ length: count }, (_, i) => [`env-${i}`, { port, browser: { name: 'Fixture' } }])),
        });
        requests = 0; peak = 0;
        const start = performance.now();
        const [first, second] = await Promise.all([run.call(engine), run.call(engine)]);
        assert.deepEqual(first, second);
        if (baselineResults) assert.deepEqual(first, baselineResults);
        else baselineResults = first;
        metrics.push({ requests, peakActiveRequests: peak, elapsedMs: +(performance.now() - start).toFixed(3) });
      }
      results.push({ profiles: count, simultaneousCallers: 2, before: metrics[0], after: metrics[1] });
    }
    return results;
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function benchmarkPersistence(root) {
  const PreviousStore = loadBaseline('Browserapp/automation/profile-store-sqlite.js').ProfileStoreSqlite;
  const previousPersist = loadBaseline('Browserapp/engine/persistence.js')._persistNow;
  const metrics = [];
  let beforeState;
  for (const [index, Store, persist] of [[0, PreviousStore, previousPersist], [1, ProfileStoreSqlite, BrowserEngine.prototype._persistNow]]) {
    const store = new Store({ dbPath: path.join(root, `store-${index}.db`) });
    try {
      await store.init();
      let transactions = 0;
      let savepoints = 0;
      const execute = store.db.exec.bind(store.db);
      store.db.exec = (sql) => {
        if (/^BEGIN\b/.test(sql)) transactions++;
        if (/^SAVEPOINT\b/.test(sql)) savepoints++;
        return execute(sql);
      };
      const engine = Object.assign(Object.create(BrowserEngine.prototype), {
        profiles: new Map(), extensions: new Map(), assignments: new Map(), usingSqlite: true, sqliteStore: store,
        preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: null,
      });
      const samples = [];
      for (let run = 0; run < 11; run++) {
        for (let i = 0; i < 100; i++) {
          engine.profiles.set(`env-${i}`, { id: `env-${i}`, name: `Environment ${i} revision ${run}`, cookies: 'x'.repeat(1000) });
          engine.assignments.set(`env-${i}`, new Set(['a', 'b', `revision-${run}`]));
        }
        for (let i = 0; i < 25; i++) engine.extensions.set(`ext-${i}`, { id: `ext-${i}`, name: `Extension ${i} revision ${run}` });
        engine.systemBrowserPath = `/revision-${run}`;
        transactions = 0; savepoints = 0;
        const start = performance.now();
        await persist.call(engine);
        if (run >= 2) samples.push({ ms: +(performance.now() - start).toFixed(3), explicitTransactions: transactions, nestedSavepoints: savepoints });
      }
      const state = store.exportEngineState();
      if (beforeState) assert.deepEqual(state, beforeState);
      else beforeState = state;
      samples.sort((a, b) => a.ms - b.ms);
      metrics.push(samples[Math.floor(samples.length / 2)]);
    } finally { store.close(); }
  }
  return { profiles: 100, cookieBytesPerProfile: 1000, extensions: 25, assignmentsPerProfile: 3,
    before: metrics[0], after: metrics[1] };
}

function benchmarkHashes() {
  const previous = loadBaseline('Browserapp/automation/profile-store-sqlite.js').ProfileStoreSqlite.prototype.profileDataHash;
  const profiles = Array.from({ length: 100 }, (_, i) => ({
    id: `env-${i}`, name: `Environment ${i}`, cookies: 'token="abc\\xyz";'.repeat(10000).slice(0, 100000),
  }));
  const metrics = [];
  for (const hash of [previous, ProfileStoreSqlite.prototype.profileDataHash]) {
    assert.equal(hash(profiles[0]), hash(structuredClone(profiles[0])));
    const samples = [];
    for (let run = 0; run < 11; run++) {
      const start = performance.now();
      for (const profile of profiles) hash(profile);
      if (run >= 2) samples.push({ ms: +(performance.now() - start).toFixed(3) });
    }
    samples.sort((a, b) => a.ms - b.ms);
    metrics.push(samples[Math.floor(samples.length / 2)]);
  }
  return { profiles: profiles.length, cookieBytesPerProfile: 100000, before: metrics[0], after: metrics[1] };
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-session-persist-bench-'));
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  crypto.resetLocalMasterKeyCache();
  try {
    const sessions = await benchmarkSessions();
    const persistence = await benchmarkPersistence(root);
    const hashes = benchmarkHashes();
    console.log(JSON.stringify({ baseline: revision, node: process.version, platform: process.platform,
      sessionScope: 'real local HTTP requests, one fixture server with 20ms response delay; one measurement per scenario, not real browsers',
      persistenceScope: 'real SQLite WAL, encryption and row diffs; 2 warmups + median of 9 samples, excludes coalescing delay; explicit transaction count excludes metadata autocommits',
      hashScope: 'plaintext serialization + SHA-256 CPU, 2 warmups + median of 9 samples, one hash per profile in both versions',
      sessions, persistence, hashes }, null, 2));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
