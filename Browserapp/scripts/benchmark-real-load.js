#!/usr/bin/env node
'use strict';

/**
 * P1 real-load measurement: event-loop p95/p99, render timings, IPC payload
 * and RSS at 10/100/1000 profile fleets, against the REAL engine — real
 * SQLite (better-sqlite-equivalent DatabaseSync), real CDP HTTP round-trips
 * against a local server that models kernel latency, real revision tracking.
 *
 * What each scenario answers (from the P1 backlog item):
 *  - poll (renderer 120ms status loop): event-loop delay percentiles + how a
 *    sync burst interacts with the poll cadence;
 *  - sync-fleet (first sync + steady-state resend): staging and diffed-save
 *    cost at fleet scale;
 *  - sessions (running environments): scheduler queue wait, failure rate,
 *    connection peak — the inputs for the query concurrency/timeout decision.
 *
 * Modes:
 *   node scripts/benchmark-real-load.js             full run (10/100/1000)
 *   node scripts/benchmark-real-load.js --sizes 100 one size
 *   node scripts/benchmark-real-load.js --json      machine-readable (CI digest)
 */


const fsp = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { LoopMonitor } = require('../automation/event-loop-monitor');

const { BrowserEngine } = require('../engine');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');
const { prepareProfileSync } = require('../engine/profile-sync');
const { createStatusController } = require('../ui/ui-status-controller');

function argValue(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }
const SIZES = (argValue('--sizes') || process.env.REAL_LOAD_SIZES || '10,100,1000').split(',').map(Number);
const JSON_MODE = process.argv.includes('--json');

const KERNEL_LATENCY_MS = 20; // per-tab HTTP latency of the fake kernel
const POLL_MS = 120;           // renderer poll cadence
const POLL_ROUNDS = 50;        // ~6s of polling per scenario
const SYNC_REPEATS = 3;

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function rssMb() {
  const usage = process.memoryUsage.rss();
  return usage / 1024 / 1024;
}

/** Local kernel stand-in: fixed per-request latency, real HTTP round-trip. */
function startFakeKernel() {
  let liveSockets = 0;
  let peakSockets = 0;
  const requests = { total: 0, failures: 0 };
  const server = http.createServer((req, res) => {
    requests.total += 1;
    liveSockets += 1;
    peakSockets = Math.max(peakSockets, liveSockets);
    server.getConnections?.(() => {});
    let closed = false;
    const close = () => { if (!closed) { closed = true; liveSockets = Math.max(0, liveSockets - 1); } };
    res.on('finish', close);
    res.on('close', close);
    setTimeout(() => {
      if (req.url.startsWith('/json/list') || req.url.startsWith('/json')) {
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify([
          { id: 'tab-1', type: 'page', title: 'Example', url: 'https://example.test/', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/tab-1' },
          { id: 'tab-2', type: 'page', title: 'Second', url: 'https://example.test/2', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/tab-2' },
        ]));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    }, KERNEL_LATENCY_MS);
  });
  server.on('connection', () => {});
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        port: server.address().port,
        stats: () => ({ ...requests, peakSockets }),
        close: () => new Promise((done) => server.close(() => done(null))),
      });
    });
  });
}

function fleetProfile(i, size) {
  const host = `203.0.113.${(i % 250) + 1}`;
  return {
    id: `bench-${i}`, name: `环境 ${i}`, number: i + 1,
    os: 'Windows', language: 'en-US', width: 1280, height: 820,
    networkMode: 'proxy', proxy: `http://u${i}:p${i}@${host}:8080`,
    privacy: { cores: 8, memory: 8, customArgs: '' },
    platform: { type: 'social', name: 'Example', username: `user${i}`, password: `pw${i}`, totpSecret: `t${i}` },
    cookies: `k${i}=`.repeat(64).slice(0, 2048),
    startUrl: 'https://example.test/start',
    tag: i % 4 === 0 ? 'work' : '',
    groupId: size > 100 ? `g-${i % 20}` : '',
    favorite: i % 7 === 0,
  };
}

async function buildFleetEngine(root, _size) {
  const engine = new BrowserEngine({ getPath: () => root });
  engine.usingSqlite = true;
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'data.db'), wal: true });
  await store.init();
  engine.sqliteStore = store;
  return engine;
}

async function runScenario(size) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), `ob-real-load-${size}-`));
  const kernel = await startFakeKernel();
  const engine = await buildFleetEngine(root, size);

  const report = { size, rss: {}, loop: {}, poll: {}, sync: {}, sessions: {} };

  // ---- Phase 1: first sync (cold) + steady-state resend ----
  const incoming = Array.from({ length: size }, (_, i) => fleetProfile(i, size));
  {
    const loop = new LoopMonitor().start();
    const timings = [];
    for (let r = 0; r < SYNC_REPEATS; r += 1) {
      const start = performance.now();
      await engine.syncProfiles(incoming.map((p) => structuredClone(p)));
      timings.push(performance.now() - start);
    }
    await engine.flushPersistence();
    const steady = timings.slice(1).sort((a, b) => a - b);
    report.sync = {
      firstMs: +timings[0].toFixed(1),
      steadyMedianMs: +((steady[0] + steady[1]) / 2).toFixed(1),
    };
    report.loop.afterSync = loop.stop();
    report.rss.afterFleetMb = +rssMb().toFixed(1);
  }

  // ---- Phase 2: renderer-style poll loop while idle (full vs delta lane) ----
  {
    const loop = new LoopMonitor().start();
    const pollDelays = { full: [], delta: [] };
    const ipcPayloadBytes = { full: { total: 0, peak: 0 }, delta: { total: 0, peak: 0 } };
    const runLane = async (lane) => {
      let rows = [], deltaBytes = 0;
      const status = createStatusController({
        getRows: () => rows, setRows: (value) => { rows = value; },
        fetchFull: () => engine.status(),
        fetchDelta: (watermark) => {
          const delta = engine.statusDelta(watermark, { includeWatermark: false });
          deltaBytes = Buffer.byteLength(JSON.stringify(delta));
          return delta;
        },
      });
      const start = performance.now();
      let polls = 0;
      let done = false;
      const tick = () => {
        if (done) return;
        const scheduled = start + polls * POLL_MS;
        const delay = Math.max(0, scheduled - performance.now());
        setTimeout(async () => {
          const t0 = performance.now();
          let bytes;
          if (lane === 'delta') {
            await status.refresh();
            bytes = deltaBytes;
          } else {
            await Promise.resolve(engine.status());
            bytes = Buffer.byteLength(JSON.stringify(engine.status()));
          }
          ipcPayloadBytes[lane].total += bytes;
          ipcPayloadBytes[lane].peak = Math.max(ipcPayloadBytes[lane].peak, bytes);
          pollDelays[lane].push(performance.now() - t0);
          polls += 1;
          if (polls < POLL_ROUNDS) tick();
        }, delay);
      };
      tick();
      await new Promise((resolve) => {
        const check = setInterval(() => { if (polls >= POLL_ROUNDS) { clearInterval(check); resolve(); } }, 50);
      });
      done = true;
    };
    // One mid-poll engine write so the delta lane has something to carry.
    await runLane('full');
    engine.profiles.set('bench-0', { ...engine.profiles.get('bench-0'), note: 'mid-poll engine write' });
    engine.invalidateStatusCache();
    await runLane('delta');
    for (const lane of ['full', 'delta']) pollDelays[lane].sort((a, b) => a - b);
    report.poll = {
      rounds: POLL_ROUNDS,
      fullBuildMsP95: +percentile(pollDelays.full, 95).toFixed(3),
      fullIpcBytesAvg: Math.round(ipcPayloadBytes.full.total / Math.max(1, POLL_ROUNDS)),
      fullIpcPeak: ipcPayloadBytes.full.peak,
      deltaBuildMsP95: +percentile(pollDelays.delta, 95).toFixed(3),
      deltaIpcBytesAvg: Math.round(ipcPayloadBytes.delta.total / Math.max(1, POLL_ROUNDS)),
      deltaIpcPeak: ipcPayloadBytes.delta.peak,
    };
    report.loop.duringPoll = loop.stop();
  }

  // ---- Phase 3: sessions against running environments (queue + failures) ----
  {
    // Mark a subset as running with the fake kernel's port; the session path
    // issues real HTTP to it through cdp.tabs.
    const runningCount = Math.min(size, 100);
    for (let i = 0; i < runningCount; i += 1) {
      const id = `bench-${i}`;
      engine.running.set(id, { port: kernel.port, profile: engine.profiles.get(id), browser: { name: 'Fake' } });
    }
    const loop = new LoopMonitor().start();
    const t0 = performance.now();
    const results = await Promise.all([
      engine.sessions(),
      engine.sessions(), // two concurrent callers: the dedup contract
    ]);
    const elapsed = performance.now() - t0;
    const flat = results.flat();
    const failures = flat.filter((entry) => entry?.error).length;
    report.sessions = {
      running: runningCount,
      callers: 2,
      returnedRows: flat.length,
      failures,
      wallMs: +elapsed.toFixed(1),
      httpTotal: kernel.stats().total,
      peakConnections: kernel.stats().peakSockets,
    };
    report.loop.duringSessions = loop.stop();
  }

  await engine.flushPersistence();
  await kernel.close();
  report.rss.finalMb = +rssMb().toFixed(1);

  // prepareProfileSync share of a sync (per-edit cost the new command path pays)
  {
    const oneEdit = structuredClone(engine.profiles.get('bench-0'));
    oneEdit.name = '环境 0 (编辑)';
    const t0 = performance.now();
    prepareProfileSync(engine, [oneEdit]);
    report.sync.perEditStagingMs = +(performance.now() - t0).toFixed(3);
  }

  engine.sqliteStore.close();
  await fsp.rm(root, { recursive: true, force: true });
  return report;
}

function humanLine(report) {
  const l = report.loop;
  return [
    `N=${String(report.size).padStart(4)}`,
    `sync first ${String(report.sync.firstMs).padStart(7)}ms`,
    `steady ${String(report.sync.steadyMedianMs).padStart(7)}ms`,
    `edit-stage ${String(report.sync.perEditStagingMs).padStart(6)}ms`,
    `poll full p95 ${String(report.poll.fullBuildMsP95).padStart(6)}ms`,
    `${String(report.poll.fullIpcBytesAvg).padStart(7)}B/poll`,
    `delta p95 ${String(report.poll.deltaBuildMsP95).padStart(6)}ms`,
    `${String(report.poll.deltaIpcBytesAvg).padStart(6)}B/poll`,
    `evt p95 ${l.duringPoll.p95Ms.toFixed(2).padStart(6)}ms`,
    `p99 ${l.duringPoll.p99Ms.toFixed(2).padStart(6)}ms`,
    `sess ${String(report.sessions.wallMs).padStart(6)}ms`,
    `peak-conn ${String(report.sessions.peakConnections).padStart(3)}`,
    `fail ${report.sessions.failures}`,
    `RSS ${String(report.rss.finalMb).padStart(6)}MB`,
  ].join('  ');
}

(async () => {
  const reports = [];
  for (const size of SIZES) {
    const report = await runScenario(size);
    reports.push(report);
  }
  if (JSON_MODE) {
    console.log(JSON.stringify({ node: process.version, kernelLatencyMs: KERNEL_LATENCY_MS, pollMs: POLL_MS, reports }, null, 1));
  } else {
    console.log(`real-load benchmark — Node ${process.version}, kernel latency ${KERNEL_LATENCY_MS}ms, poll ${POLL_MS}ms × ${POLL_ROUNDS}`);
    for (const report of reports) console.log(humanLine(report));
  }
  process.exit(0);
})().catch((error) => { console.error('REAL_LOAD_BENCHMARK_FAILED:', error); process.exit(1); });
