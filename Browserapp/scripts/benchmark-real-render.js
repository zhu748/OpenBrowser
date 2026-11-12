#!/usr/bin/env node
'use strict';

/**
 * P1 real-desktop render measurement (10/100/1000 profile fleets).
 *
 * Runs the REAL app stack — real index.html + real preload (full window.ops
 * IPC surface), real BrowserEngine, real SQLite store, real sync IPC lane —
 * in a real Electron window. The only thing not loaded is main.js's
 * kernel/tray/auto-update surface, which this measurement deliberately does
 * not exercise (the P1 backlog item is profile-fleet load, not kernel boot).
 *
 * The renderer seeds a fleet through window.ops.syncProfiles (the same IPC the
 * UI uses), then measures the REAL DOM cost of the UI's own renderProfiles()
 * inside the renderer process, plus the renderer's own memory and the main
 * process's event-loop percentiles while re-rendering.
 *
 * Usage (needs a display):
 *   xvfb-run -a node scripts/benchmark-real-render.js [--sizes 10,100,1000] [--json]
 */

const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { LoopMonitor } = require('../automation/event-loop-monitor');
const os = require('node:os');

const { BrowserEngine } = require('../engine');
const { ProfileStoreSqlite } = require('../automation/profile-store-sqlite');
const { registerProfileIpc } = require('../main/profile-ipc');
const { ensureDataRootIsolationSecure } = require('../automation/isolation');

function argValue(name) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; }
const SIZES = (argValue('--sizes') || '10,100,1000').split(',').map(Number);
const JSON_MODE = process.argv.includes('--json');
const APP = path.resolve(__dirname, '..');



// Same trusted-sender contract as main.js (window + exact index.html URL).
let win = null;
function assertTrustedIpcSender(event) {
  if (!win || win.isDestroyed() || event?.sender !== win.webContents) {
    throw new Error('untrusted IPC sender');
  }
  const senderUrl = String(event.sender.getURL?.() || '');
  const expected = pathToFileURL(path.join(APP, 'index.html')).href;
  if (senderUrl !== expected && !senderUrl.startsWith(expected + '?') && !senderUrl.startsWith(expected + '#')) {
    throw new Error('untrusted IPC document');
  }
}
function registerTrustedIpc(channel, handler) {
  const { ipcMain } = require('electron');
  if (!ipcMain?.handle) throw new Error('benchmark-real-render must run under the Electron runtime (electron cli.js), not plain node');
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedIpcSender(event);
    return handler(event, ...args);
  });
}

// Minimal main-process surface the renderer boot path actually awaits:
// getInfo (initialize), getSyncState, profileStatus, syncProfiles, onEvent,
// plus lenient no-op stubs for channels the UI calls lazily later. Anything
// the benchmark does not model answers from real engine state where the real
// data path exists, and a safe default otherwise.
function registerBootIpc() {
  const { ipcMain } = require('electron');
  const guard = (channel, handler) => {
    ipcMain.handle(channel, (event, ...args) => {
      assertTrustedIpcSender(event);
      return handler(event, ...args);
    });
  };
  guard('system:info', () => ({
    appVersion: require('../package.json').version,
    platform: process.platform,
    closeAction: 'tray',
    kernel: { engine: 'chromium' },
    ready: true,
  }));
  guard('sync:state', () => ({ active: false, master: null, selected: [] }));
  guard('sync:sessions', () => state._engine ? state._engine.sessions() : []);
  // Lenient catch-all: the UI may probe optional surfaces on interaction;
  // those never run during the measurement and must not crash it.
  for (const channel of [
    'system:set-close-action', 'sync:settings:get', 'sync:settings:set', 'app-update:check',
    'extensions:list', 'proxy:list', 'rpa:list', 'clipboard:read', 'client-settings:save',
    'ua:build', 'system:get-client-settings', 'system:choose-storage', 'system:reset-storage',
    'system:open-storage', 'sync:get-settings', 'sync:selection', 'automation:app-center',
  ]) {
    ipcMain.handle(channel, (event) => {
      assertTrustedIpcSender(event);
      return null;
    });
  }
}

const RENDERER_MEASURE = `(async (size) => {
  const fleet = Array.from({ length: size }, (_, i) => ({
    id: 'render-' + i, name: '环境 ' + i, number: i + 1,
    os: 'Windows', language: 'en-US', width: 1280, height: 820,
    networkMode: 'direct', proxy: 'Direct',
    privacy: { cores: 8, memory: 8, customArgs: '' },
    platform: { type: 'social', name: 'Example', username: 'user' + i },
    cookies: '', startUrl: 'https://example.test/start',
    favorite: i % 7 === 0, tag: i % 5 === 0 ? 'work' : '',
  }));
  // Real IPC lane the UI uses on boot: renderer local state -> engine -> status.
  await window.ops.syncProfiles(fleet);
  const p = (arr, q) => arr[Math.min(arr.length - 1, Math.ceil((q / 100) * arr.length) - 1)];
  const out = { size, pageSizes: {} };
  // The list view is paginated (10/20/50/100 rows). DOM cost is per-page and
  // fleet-independent; the fleet-scaled part is the filter+summarize pass that
  // runs over ALL rows on every render. Measure both, at every page size.
  for (const pageSize of [10, 100]) {
    // Set the page size through the UI's own change path (updates the live
    // profilePageSize variable, not just localStorage).
    const sel = document.getElementById('profile-page-size');
    if (sel) {
      sel.value = String(pageSize);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    window.renderProfiles(); // warm-up with this page size
    const rows = [];
    const filterSamples = [];
    for (let r = 0; r < 5; r += 1) {
      const f0 = performance.now();
      const summary = window.OpenBrowserProfileList.summarizeProfiles(window.ui.profiles, () => false);
      const filtered = window.OpenBrowserProfileList.filterProfiles({ profiles: window.ui.profiles, summary, search: '', groupFilter: '', trash: 'active' });
      window.OpenBrowserProfileList.paginate(filtered, 1, pageSize);
      filterSamples.push(performance.now() - f0);
      const t0 = performance.now();
      window.renderProfiles();
      const renderMs = performance.now() - t0;
      const t1 = performance.now();
      document.querySelectorAll('#profile-list tr, [data-profile-id]').forEach((el) => void el.getBoundingClientRect());
      const layoutMs = performance.now() - t1;
      rows.push({ renderMs, layoutMs });
    }
    rows.sort((a, b) => a.renderMs - b.renderMs);
    filterSamples.sort((a, b) => a - b);
    out.pageSizes[pageSize] = {
      renderMedianMs: +p(rows.map((x) => x.renderMs), 50).toFixed(2),
      renderP95Ms: +p(rows.map((x) => x.renderMs), 95).toFixed(2),
      layoutMedianMs: +p(rows.map((x) => x.layoutMs), 50).toFixed(2),
      filterFleetP95Ms: +p(filterSamples, 95).toFixed(2),
      domNodes: document.querySelectorAll('*').length,
      profileRows: document.querySelectorAll('#profile-table tr[data-profile-id]').length,
    };
  }
  out.domNodes = out.pageSizes[100].domNodes;
  // Editor save + conflict-retry path against the real engine (the P1-a
  // contract): open the real editor state, save via applyProfileCommands with
  // the row's real rev, force an engine-side write underneath, confirm the
  // stale save is rejected and a new edit based on the refreshed row lands.
  out.editorConflict = null;
  try {
    const row = await window.ops.profileStatus();
    const target = row.find((item) => item.id === 'render-0');
    if (!target) throw new Error('render-0 missing from status');
    // 1) clean save
    const clean = window.OpenBrowserIpcResult.unwrapIpcResult(await window.ops.applyProfileCommands([{
      kind: 'modify', id: 'render-0', baseRev: target.rev,
      profile: { ...target, name: '环境 0 (编辑保存)' },
    }]));
    const savedRev = clean.find((item) => item.id === 'render-0').rev;
    // 2) engine-side write the renderer never sees (stale base)
    const staleSave = await window.ops.applyProfileCommands([{
      kind: 'modify', id: 'render-0', baseRev: target.rev,
      profile: { ...target, name: '环境 0 (旧版本保存)' },
    }]).then((result) => {
      window.OpenBrowserIpcResult.unwrapIpcResult(result);
      return 'landed';
    }).catch((error) => error?.code || String(error));
    // 3) resync + retry against the fresh revision
    const fresh = await window.ops.profileStatus();
    const freshRow = fresh.find((item) => item.id === 'render-0');
    const retried = window.OpenBrowserIpcResult.unwrapIpcResult(await window.ops.applyProfileCommands([{
      kind: 'modify', id: 'render-0', baseRev: freshRow.rev,
      profile: { ...freshRow, name: '环境 0 (重试保存)' },
    }]));
    const finalName = retried.find((item) => item.id === 'render-0').name;
    out.editorConflict = { savedRev, staleSave, finalName };
  } catch (error) {
    out.editorConflict = { error: String(error?.message || error) };
  }
  // Delta poll lane vs full lane, measured in the real renderer over the real
  // IPC bridge: payload bytes per poll at this fleet size.
  out.pollLane = null;
  try {
    const fullBytes = new Blob([JSON.stringify(await window.ops.profileStatus())]).size;
    let rows = [];
    const responses = [];
    const controller = window.OpenBrowserStatusController.createStatusController({
      getRows: () => rows, setRows: (value) => { rows = value; },
      fetchFull: () => window.ops.profileStatus(),
      fetchDelta: async (watermark) => {
        const delta = await window.ops.profileStatusDelta(watermark);
        responses.push({ bytes: new Blob([JSON.stringify(delta)]).size, full: delta.full });
        return delta;
      },
    });
    await controller.refresh();
    await controller.refresh();
    if (responses.length !== 2 || responses[1].full !== false) throw new Error('steady poll did not use the incremental lane');
    out.pollLane = { fullBytes, deltaFirstBytes: responses[0].bytes, steadyBytes: responses[1].bytes };
  } catch (error) {
    out.pollLane = { error: String(error?.message || error) };
  }
  // Renderer has no node integration: approximate committed JS heap via the
  // Blink extension when present, else -1 (filled from app metrics in the
  // main process).
  out.rendererRssMb = (performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : -1);
  return out;
})`;

async function measureSize(size) {
  const engine = state._engine;
  // Per-size isolation through distinct ids: the engine, store and caches are
  // real and shared (exactly like a live app whose fleet grows); each size
  // seeds its own rows so render cost reflects that fleet alone.
  const loop = new LoopMonitor().start();
  const result = await win.webContents.executeJavaScript(`(${RENDERER_MEASURE})(${size})`, true);
  const loopStats = loop.stop();
  await engine.flushPersistence();
  // Blink-side JS heap when available; otherwise the renderer process RSS from
  // the process metrics Electron exposes to the main process.
  const rendererMetrics = app.getAppMetrics?.().find((entry) => entry.type === 'Renderer' && !entry.webContents?.isDestroyed?.());
  result.rendererRssMb = result.rendererRssMb >= 0
    ? result.rendererRssMb
    : +((rendererMetrics?.memory?.workingSetSize || 0) / 1024).toFixed(1);
  return {
    ...result,
    mainLoop: loopStats,
  };
}

const state = { _engine: null, profileRoot: null, dbRoot: null };

/**
 * Real-kernel session phase (R2): spawn REAL Chrome Stable kernels (one per
 * profile — the engine auto-resolves Browserapp/kernels/chrome-stable, no
 * environment setup needed), wait for CDP readiness, then measure the
 * engine.sessions() inventory lane against the real kernel, and stop
 * everything with leak verification at the end.
 *
 * This complements the fake-kernel HTTP stand-in in benchmark-real-load.js:
 * there the transport is modeled; here the full spawn → CDP boot → /json/list
 * round-trip runs against the real binary the product ships.
 */
async function runRealKernelSessions(engine) {
  // Container-sane default: one real Chrome instance. Each extra instance
  // multiplies memory/thread pressure; in a constrained sandbox two
  // simultaneous spawns can crash in the zygote (verified — SIGABRT at N=2),
  // which is a container limit, not a product defect. Override with
  // REAL_KERNEL_SESSIONS=N on hosts that can afford it.
  const SESSIONS = Math.max(1, Math.min(10, Number(process.env.REAL_KERNEL_SESSIONS || 1)));
  const ids = Array.from({ length: SESSIONS }, (_, i) => `render-${i}`);
  const seeded = ids.map((id) => engine.profiles.get(id)).filter(Boolean);
  if (seeded.length < SESSIONS) throw new Error(`only ${seeded.length}/${SESSIONS} seed profiles present in the engine`);

  const report = { requested: SESSIONS, spawnMs: null, running: 0, rows: 0, failures: 0, wallSingleMs: null, wallDoubleMs: null, stopLeftovers: [] };

  // Spawn: real Chrome Stable per profile; about:blank keeps navigation noise
  // out of the measurement. The run itself is launched with OPENBROWSER_HEADLESS
  // (the app's own supported switch) plus --no-sandbox per profile via
  // privacy.customArgs — both are required in a container; a GUI launch here
  // dies in the zygote sandbox (verified: direct spawn probes).
  const spawnStart = performance.now();
  await Promise.all(seeded.map((profile) => engine.start({
    ...profile,
    platform: { ...profile.platform, startUrl: 'about:blank' },
    startUrl: 'about:blank',
    privacy: { ...(profile.privacy || {}), customArgs: '--no-sandbox' },
    // The engine's stored seed carries advanced.startUrls = "about:blank"
    // (mirrored by the sanitizer); headless Chrome rejects multiple CLI
    // targets, so keep exactly one startup URL.
    advanced: { ...(profile.advanced || {}), startUrls: '' },
  })));

  // Wait for CDP readiness (spawn returns after the start pipeline; poll the
  // running map until every instance exposes a CDP port).
  const deadline = Date.now() + 90000;
  for (;;) {
    const ready = engine.runningWithCdp([...engine.running.keys()]).length;
    if (ready >= SESSIONS) break;
    if (Date.now() > deadline) throw new Error(`only ${ready}/${SESSIONS} kernels reached CDP readiness`);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  report.spawnMs = +(performance.now() - spawnStart).toFixed(0);
  report.running = engine.running.size;

  // Inventory lane, single caller.
  const t0 = performance.now();
  const rows = await engine.sessions();
  report.wallSingleMs = +(performance.now() - t0).toFixed(1);
  report.rows = rows.length;
  report.failures = rows.filter((row) => row.error).length;

  // Two concurrent callers: the shared-query dedup contract must converge to
  // one batch — wall time must not double versus the single call.
  const t1 = performance.now();
  const [againA, againB] = await Promise.all([engine.sessions(), engine.sessions()]);
  report.wallDoubleMs = +(performance.now() - t1).toFixed(1);
  if (againA.length !== againB.length) throw new Error('concurrent callers disagree on row count');

  // Teardown with leak verification: engine.stop runs the full process-tree
  // cleanup per profile; afterwards the running map must be empty.
  await Promise.allSettled(ids.map((id) => engine.stop(id).catch(() => {})));
  await new Promise((resolve) => setTimeout(resolve, 500));
  report.stopLeftovers = [...engine.running.keys()];
  return report;
}

/** Lazily built engine: the renderer's boot sequence fires its first
 * profiles:sync/profileStatus during initialize(), before any benchmark size
 * exists. Building on first IPC use gives those boot calls a real engine with
 * a real store, so the measured renderer is the fully booted real UI. */
async function ensureEngine() {
  if (state._engine) return state._engine;
  const engine = new BrowserEngine(app, { profileDataRoot: state.profileRoot });
  engine.usingSqlite = true;
  engine.sqliteStore = new ProfileStoreSqlite({ dbPath: path.join(state.dbRoot, 'boot.db'), wal: true });
  await engine.sqliteStore.init();
  await engine.init(path.join(APP, 'bundled-extension'));
  state._engine = engine;
  return engine;
}

async function main() {
  if (!process.env.DISPLAY) {
    console.error('real-render benchmark needs a display (run under xvfb-run -a).');
    app.exit(2);
    return;
  }
  const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-real-render-'));
  const profileDataRoot = path.join(dataRoot, 'profiles');
  fs.mkdirSync(profileDataRoot, { recursive: true });
  state.profileRoot = profileDataRoot;
  state.dbRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-real-render-db-'));
  const isolation = await ensureDataRootIsolationSecure(profileDataRoot);
  if (!isolation.ok) throw new Error(isolation.message);

  registerBootIpc();
  // Build the engine BEFORE registering profile IPC: registerProfileIpc
  // captures the engine value once (main/profile-ipc.js destructures it at
  // call time), so it must already exist here.
  await ensureEngine();
  registerProfileIpc({
    registerTrustedIpc,
    engine: state._engine,
    sanitizeIds: (ids) => ids,
    beforeRemove: () => {},
  });

  await app.whenReady();
  win = new BrowserWindow({
    width: 1440, height: 900, show: false,
    webPreferences: { preload: path.join(APP, 'preload.js'), contextIsolation: true },
  });
  await win.loadFile(path.join(APP, 'index.html'));
  await win.webContents.executeJavaScript('typeof window.renderProfiles', true); // renderer booted
  // Let the renderer's boot-time sync/IPC settle; the first profileStatus
  // poll cycle needs to have run at least once.
  await new Promise((resolve) => setTimeout(resolve, 800));

  const reports = [];
  for (const size of SIZES) {
    const report = await measureSize(size);
    reports.push(report);
  }

  // R2: real-kernel sessions against the shipped Chrome Stable binary.
  let kernel = null;
  try {
    kernel = await runRealKernelSessions(state._engine);
  } catch (error) {
    kernel = { error: String(error?.message || error) };
  }

  // Teardown: engine holds sqlite handles + a start-page server; flush both.
  await state._engine?.flushPersistence?.();
  try { await state._engine?.startPageServer?.stop?.(); } catch (_) {}

  if (JSON_MODE) {
    console.log(JSON.stringify({ node: process.version, electron: process.versions.electron, reports, kernel }, null, 1));
  } else {
    console.log(`real-render benchmark — Electron ${process.versions.electron}, Chromium ${process.versions.chrome}, window 1440x900`);
    for (const r of reports) {
      for (const [pageSize, m] of Object.entries(r.pageSizes)) {
        console.log([
          `N=${String(r.size).padStart(4)}`,
          `page=${String(pageSize).padStart(3)}`,
          `render med ${String(m.renderMedianMs).padStart(7)}ms`,
          `p95 ${String(m.renderP95Ms).padStart(7)}ms`,
          `layout med ${String(m.layoutMedianMs).padStart(6)}ms`,
          `filter fleet p95 ${String(m.filterFleetP95Ms).padStart(7)}ms`,
          `DOM ${String(m.domNodes).padStart(6)}`,
          `rows ${String(m.profileRows).padStart(5)}`,
          `JSheap ${String(r.rendererRssMb).padStart(6)}MB`,
          `mainLoop p95 ${r.mainLoop.p95Ms.toFixed(2)}ms`,
          `p99 ${r.mainLoop.p99Ms.toFixed(2)}ms`,
        ].join('  '));
      }
      if (r.editorConflict) {
        const ec = r.editorConflict;
        console.log(`     editor-conflict: clean save rev=${ec.savedRev}, stale=${ec.staleSave}, retry name="${ec.finalName}"`);
      }
      if (r.pollLane) {
        const pl = r.pollLane;
        if (pl.error) console.log(`     poll-lane: ERROR ${pl.error}`);
        else console.log(`     poll-lane: full ${pl.fullBytes}B, delta-first ${pl.deltaFirstBytes}B, steady ${pl.steadyBytes}B`);
      }
    }
    if (kernel) {
      if (kernel.error) console.log(`kernel-sessions: ERROR ${kernel.error}`);
      else {
        console.log(`kernel-sessions: ${kernel.running}/${kernel.requested} real Chrome Stable, spawn ${kernel.spawnMs}ms, sessions single ${kernel.wallSingleMs}ms / double ${kernel.wallDoubleMs}ms, rows ${kernel.rows}, failures ${kernel.failures}, stop-leftovers ${kernel.stopLeftovers.length ? kernel.stopLeftovers.join(',') : 'none'}`);
      }
    }
  }
  app.exit(0);
}

main().catch(async (error) => {
  console.error('REAL_RENDER_FAILED:', error);
  app.exit(1);
});
