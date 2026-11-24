#!/usr/bin/env node
'use strict';

// Exercise the default obui:// workbench through its real controls, preload,
// IPC, BrowserEngine and SQLite. Timings include UI debounce and paint frames.
const assert = require('node:assert/strict');
const { AsyncLocalStorage, createHook } = require('node:async_hooks');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron: electron } = require('playwright');
const searchPlaceholder = /^搜索 (?:Ctrl|⌘) \+ F$/;

function options(argv) {
  const result = { sizes: [10, 100, 1000], rounds: 7, budgetMs: 1500 };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--runner-temp') {
      result.runnerTemp = true;
      continue;
    }
    const value = argv[++i];
    if (flag === '--sizes' && value) result.sizes = value.split(',').map(Number);
    else if (flag === '--rounds') result.rounds = Number(value);
    else if (flag === '--interaction-budget-ms') result.budgetMs = Number(value);
    else if (flag === '--output' && value) result.output = path.resolve(value);
    else throw Error('Usage: benchmark-workbench.js [--sizes 10,100,1000] [--rounds 7] [--interaction-budget-ms 1500] [--output file] [--runner-temp]');
  }
  if (!result.sizes.length || result.sizes.some(n => !Number.isSafeInteger(n) || n < 1 || n > 5000) ||
      !Number.isSafeInteger(result.rounds) || result.rounds < 1 || result.rounds > 100 ||
      !Number.isFinite(result.budgetMs) || result.budgetMs <= 0) throw Error('Invalid benchmark sizes, rounds or budget');
  result.sizes = [...new Set(result.sizes)].sort((a, b) => a - b);
  return result;
}

const paint = page => page.waitForFunction(() => new Promise(resolve => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
}), undefined, { timeout: 10000 }).then(frame => frame.dispose());
const p95 = samples => [...samples].sort((a, b) => a - b)[Math.ceil(samples.length * .95) - 1];

// Progress watchdog state, marked at every benchmark stage. Two hosted-runner
// failure layers motivated it (see the wedge history in ci.yml):
// 1. A protocol wedge where every armed Playwright timeout refuses to fire
//    while the Node loop keeps beating (f3f70f2..5861594c macOS logs: heartbeats
//    for minutes, no bound message, no catch output, no artifact written).
// 2. Even a clean failure hung afterwards: SIGKILLing the wedged Electron
//    leaves its forked helpers holding the stdio pipes, Playwright's transport
//    never sees EOF, the loop never drains and the process never exits -
//    reproduced locally with a STOPped Electron tree (every bound fired, the
//    error printed, the process still sat there until killed).
// So: every stage marks progress, the heartbeat - the one timer proven to fire
// in every observed wedge - force-exits (code 2) once nothing progressed for
// 2.5 minutes, and main() hard-exits on success and failure. Every legitimate
// inter-mark gap stays far below the limit (the widest is one 120s create
// batch, which is marked per batch inside the creation loop).
const STALL_LIMIT_MS = 150000;
let progressAt = performance.now(), progressLabel = 'startup';
function markProgress(label) {
  progressAt = performance.now();
  if (label) progressLabel = label;
}

// Leave public notice slots for attempt outcomes and the idle watchdog.
// Fixed phase names remain in the ordinary logs; stdout stays JSON-only.
function enterPhase(lifecycle, phase) {
  lifecycle.phase = phase;
  markProgress(phase);
  console.error(`Workbench benchmark phase=${phase}`);
}

async function observeFsWait(lifecycle, operation) {
  const scope = new AsyncLocalStorage(), tracked = new Set();
  const wait = { startedAt: performance.now(), requests: 0, callbacks: 0, lastCallbackAt: null };
  // Node can use different resource types across versions. These are observed
  // callbacks of known FS request types only, not proof of deletion or that
  // work is blocked in the kernel. Never inspect resource objects or paths.
  const hook = createHook({
    init(id, type) {
      if ((type === 'FSREQPROMISE' || type === 'FSREQCALLBACK') && scope.getStore() === wait) {
        tracked.add(id);
        wait.requests++;
      }
    },
    after(id) {
      if (tracked.delete(id)) {
        wait.callbacks++;
        wait.lastCallbackAt = performance.now();
      }
    },
    destroy(id) { tracked.delete(id); },
  }).enable();
  lifecycle.fsWait = wait;
  try {
    const value = await scope.run(wait, operation);
    if (lifecycle.macCi && lifecycle.phase === 'temp-cleanup') {
      lifecycle.completedCleanup = {
        elapsedMs: Math.round(performance.now() - wait.startedAt),
        requests: wait.requests,
        callbacks: wait.callbacks,
      };
    }
    return value;
  } finally {
    lifecycle.fsWait = undefined;
    hook.disable();
    scope.disable();
  }
}

function formatCleanupSuccess(sample) {
  if (!sample) return null;
  const { elapsedMs, requests, callbacks } = sample;
  if (![elapsedMs, requests, callbacks].every(n => Number.isSafeInteger(n) && n >= 0) || callbacks > requests) return null;
  return `::notice::Workbench benchmark temp-cleanup completed: fsWaitMs=${elapsedMs} fsRequests=${requests} fsCallbacks=${callbacks}`;
}

function startProgressWatchdog(lifecycle) {
  markProgress('initialization');
  return setInterval(() => {
    const now = performance.now(), idleMs = now - progressAt;
    console.error(`benchmark heartbeat uptime=${Math.round(process.uptime())}s rss=${Math.round(process.memoryUsage().rss / 1048576)}MB idle=${Math.round(idleMs / 1000)}s`);
    if (idleMs > STALL_LIMIT_MS) {
      const fsWait = lifecycle.fsWait;
      const fsFacts = fsWait
        ? ` fsWaitMs=${Math.round(now - fsWait.startedAt)} fsRequests=${fsWait.requests} fsCallbacks=${fsWait.callbacks} fsLastCallbackAgoMs=${fsWait.lastCallbackAt === null ? 'none' : Math.round(now - fsWait.lastCallbackAt)}`
        : '';
      console.error(`::notice::Workbench benchmark idle limit exceeded: phase=${lifecycle.phase}${fsFacts}`);
      console.error(`benchmark made no progress for ${Math.round(idleMs / 1000)}s after "${progressLabel}"; exiting code 2`);
      try { lifecycle.app?.process().kill('SIGKILL'); } catch { /* already gone */ }
      process.exit(2);
    }
  }, 30000);
}

// Hosted macOS runners intermittently wedge one of the waits Playwright does
// not bound by default: f3f70f2, 33b19197 and three consecutive 9a5f5a4
// attempts all burned the full step budget at the 1000-profile phase while
// the same code passes in seconds on healthy runners (9f6da86: ~10s). Every
// unbounded wait gets a generous deadline — 6-40x the observed healthy
// timings — so a wedge fails fast into the step's retry instead of hanging
// the whole job. A slow-but-alive runner never trips these bounds.
function bounded(promise, ms, label) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} did not settle within ${ms}ms (runner wedge?)`)), ms);
    if (typeof timer.unref === 'function') timer.unref();
  })]).finally(() => { clearTimeout(timer); markProgress(`after ${label}`); });
}

async function closeApp(app) {
  markProgress('close Electron app');
  let timeout;
  try {
    await Promise.race([app.close(), new Promise((_, reject) => {
      timeout = setTimeout(() => {
        app.process().kill('SIGKILL');
        reject(Error('Electron did not exit within 30 seconds'));
      }, 30000);
    })]);
  } finally {
    clearTimeout(timeout);
  }
}

async function observeQueries(app, page) {
  markProgress('benchmark observer install');
  await bounded(page.evaluate(() => {
    globalThis.__workbenchBenchmark = { sequence: 0 };
    function observePaint(state) {
      if (globalThis.__workbenchBenchmark !== state) return;
      const body = document.querySelector('table tbody');
      const displayed = new Set([...body?.querySelectorAll('tr[data-row-id]') || []].map(row => row.dataset.rowId));
      const matches = state.ids.length ? displayed.size === state.ids.length && state.ids.every(id => displayed.has(id))
        : body?.textContent.includes('暂无查询结果');
      if (!matches) { requestAnimationFrame(() => observePaint(state)); return; }
      requestAnimationFrame(() => requestAnimationFrame(() => { state.paintedAt = performance.now(); }));
    }
    globalThis.__workbenchBenchmarkDispose = globalThis.ops.onEvent(event => {
      if (event.type !== 'benchmark:query') return;
      const state = { ...event.state, observedAt: performance.now() };
      globalThis.__workbenchBenchmark = state;
      observePaint(state);
    });
  }), 60000, 'benchmark observer install');
  await bounded(app.evaluate(({ ipcMain }) => {
    const original = ipcMain._invokeHandlers.get('rebuild:request');
    const state = { sequence: 0 };
    ipcMain.removeHandler('rebuild:request');
    ipcMain.handle('rebuild:request', async (event, method, params) => {
      const start = performance.now();
      const response = await original(event, method, params);
      if (method === 'profiles:query' && response.ok) {
        state.sequence++;
        state.params = { ...params };
        state.ids = response.value.rows.map(row => String(row.id));
        state.handlerMs = performance.now() - start;
        event.sender.send('engine:event', { type: 'benchmark:query', state });
      }
      return response;
    });
  }), 60000, 'query-observer install');
}

async function queryPaint(page, act, expected) {
  markProgress(`query paint (${expected})`);
  const sequence = await bounded(page.evaluate(() => globalThis.__workbenchBenchmark.sequence), 60000, 'benchmark state read');
  const start = performance.now();
  await act();
  const actionMs = performance.now() - start;
  const response = await page.waitForFunction(({ sequence, expected }) => {
    const current = globalThis.__workbenchBenchmark;
    const matches = typeof expected === 'number' ? Number(current.params?.page_index) === expected
      : String(current.params?.queryValue || '') === expected;
    return current.sequence > sequence && matches && current.paintedAt ? current : false;
  }, { sequence, expected }, { timeout: 60000 });
  const totalMs = performance.now() - start;
  const { handlerMs, observedAt, paintedAt } = await bounded(response.jsonValue(), 60000, 'benchmark paint timing');
  await bounded(response.dispose(), 60000, 'benchmark response dispose');
  return { totalMs, actionMs, handlerMs, responseToPaintMs: paintedAt - observedAt };
}

function interactionP95(samples) {
  if (!samples.length) return null;
  return Object.fromEntries(Object.keys(samples[0]).map(key => [key, +p95(samples.map(sample => sample[key])).toFixed(1)]));
}

async function measure(page, count, rounds) {
  const search = page.getByPlaceholder(searchPlaceholder);
  const searchMs = [], pageMs = [], selectionMs = [];
  const phase = (label) => {
    markProgress(`${count}-profile ${label}`);
    if (count >= 1000) console.error(`  ${count}-profile ${label}`);
  };
  // Ensure the warm-up itself is a real query even for a single-page fleet.
  const query = async value => { await search.fill(value); await search.press('Enter'); };
  phase('search warmup');
  await queryPaint(page, () => query('warmup-no-match'), 'warmup-no-match');
  for (let i = 0; i < rounds; i++) {
    const value = i % 2 ? 'no-match-' + i : 'Workbench benchmark';
    phase(`search round ${i + 1}/${rounds}`);
    searchMs.push(await queryPaint(page, () => query(value), value));
  }
  await queryPaint(page, () => query(''), '');
  if (count > 10) {
    for (let i = 0; i < rounds; i++) {
      const next = i % 2 === 0;
      phase(`pagination round ${i + 1}/${rounds}`);
      pageMs.push(await queryPaint(page, () => page.getByRole('button', { name: next ? 'Next Page' : 'Previous Page', exact: true }).click(), next ? 2 : 1));
    }
  }
  for (let i = 0; i < rounds; i++) {
    const start = performance.now(), checked = i % 2 === 0;
    phase(`selection round ${i + 1}/${rounds}`);
    await page.locator('thead input[type=checkbox]').setChecked(checked, { force: true });
    await page.waitForFunction(value => document.querySelector('thead input[type=checkbox]')?.checked === value, checked, { timeout: 60000 });
    await paint(page);
    selectionMs.push(performance.now() - start);
  }
  markProgress('profiles:count');
  const counter = await bounded(page.evaluate(() => globalThis.__localRequest('profiles:count')), 60000, 'profiles:count');
  assert.deepEqual(counter, { count });
  markProgress('profiles:list');
  const fullListBytes = await bounded(page.evaluate(async () => new TextEncoder().encode(JSON.stringify(await globalThis.__localRequest('profiles:list'))).byteLength), 60000, 'profiles:list');
  const searchTimings = interactionP95(searchMs), pagination = interactionP95(pageMs);
  return { count, renderedRows: await bounded(page.locator('tbody tr').count(), 60000, 'renderedRows count'),
    searchP95Ms: searchTimings.totalMs, paginationP95Ms: pagination?.totalMs ?? null,
    interactionP95: { search: searchTimings, pagination },
    selectionP95Ms: +p95(selectionMs).toFixed(1), countPayloadBytes: Buffer.byteLength(JSON.stringify(counter)), fullListPayloadBytes: fullListBytes };
}

async function benchmark(args, lifecycle) {
  const tempBase = args.runnerTemp ? process.env.RUNNER_TEMP : os.tmpdir();
  if (args.runnerTemp && (process.env.GITHUB_ACTIONS !== 'true' || !tempBase || !path.isAbsolute(tempBase))) {
    throw Error('--runner-temp requires an absolute GitHub Actions RUNNER_TEMP directory');
  }
  enterPhase(lifecycle, 'temp-create');
  const root = await observeFsWait(lifecycle, () => fs.mkdtemp(path.join(tempBase, 'ob-workbench-benchmark-')));
  const errors = [], reports = [];
  let app, page;
  try {
    enterPhase(lifecycle, 'desktop-startup');
    const start = performance.now();
    markProgress('launch Electron');
    app = await electron.launch({ executablePath: require('electron'),
      args: [
        ...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []),
        // CI hosts have no real display: Chromium's native occlusion detection
        // can flip the window to "occluded" mid-run and freeze the renderer /
        // let macOS App Nap suspend the tree — the observed wedge (all rounds
        // finish, then a protocol call never returns). Disable occlusion
        // detection and every backgrounding heuristic outright.
        '--disable-features=CalculateNativeWinOcclusion',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
        path.resolve(__dirname, '..'),
      ],
      env: { ...process.env, OPENBROWSER_ROXY_UI: '1', OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0',
        OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'master.key'),
        OPENBROWSER_DEFER_KERNEL_BOOTSTRAP: '1' }, timeout: 30000 });
    lifecycle.app = app;
    markProgress('first window');
    page = await app.firstWindow({ timeout: 30000 });
    page.on('pageerror', error => errors.push(error.message));
    // A hosted desktop runner can occlude Electron even when its page is loaded.
    markProgress('browserWindow lookup');
    const window = await bounded(app.browserWindow(page), 60000, 'browserWindow lookup');
    await bounded(window.evaluate(window => {
      window.webContents.setBackgroundThrottling(false);
      window.show();
      window.focus();
    }), 60000, 'window show/focus');
    await window.dispose();
    markProgress('workbench router ready');
    await page.waitForFunction(() => !!globalThis.__localRequest && !!globalThis.__localApi?.window && !!globalThis.__router, undefined, { timeout: 60000 });
    await page.getByPlaceholder(searchPlaceholder).waitFor();
    assert.ok(page.url().startsWith('obui://app/'), 'benchmark must exercise the default workbench');
    const startupMs = Math.round(performance.now() - start);
    enterPhase(lifecycle, 'measurement');
    await observeQueries(app, page);
    let current = 0;
    for (const size of args.sizes) {
      console.error(`Measuring workbench interactions at ${size} profiles`);
      while (current < size) {
        const batch = Math.min(100, size - current);
        markProgress(`create profiles ${current}/${size}`);
        await bounded(page.evaluate(({ batch, current }) => globalThis.__localRequest('profiles:create-batch', {
          createCount: batch, os: 'Linux', coreType: 'Chrome', windowNamePrefix: 'Workbench benchmark ' + current,
        }), { batch, current }), 120000, `profiles:create-batch ${current}+${batch}`);
        current += batch;
      }
      console.error(`Created ${current} profiles`);
      markProgress(`fleet meter at ${size} profiles`);
      await page.waitForFunction(count => document.querySelector('[role=meter]')?.getAttribute('aria-valuenow') === String(count), size, { timeout: 60000 });
      const report = await measure(page, size, args.rounds);
      markProgress(`verify budgets at ${size} profiles`);
      for (const key of ['searchP95Ms', 'paginationP95Ms', 'selectionP95Ms'])
        if (report[key] !== null) assert.ok(report[key] <= args.budgetMs, `${key} exceeded ${args.budgetMs}ms at ${size} profiles: ${report[key]}ms`);
      assert.ok(report.renderedRows <= 10, 'pagination must keep rendered rows bounded');
      reports.push(report);
    }
    assert.deepEqual(errors, []);
    return { complete: true, scope: 'Default workbench: real Electron/DOM/preload/IPC/SQLite, configured profiles, no browser kernels started',
      node: process.version, platform: process.platform, startupMs, rounds: args.rounds,
      interactionBudgetMs: args.budgetMs, reports };
  } catch (error) {
    enterPhase(lifecycle, 'failure-evidence');
    console.error(error.message);
    if (args.output) {
      await fs.mkdir(path.dirname(args.output), { recursive: true });
      await fs.writeFile(args.output, JSON.stringify({ complete: false, reports, errors, error: error.stack }, null, 2));
      await page?.screenshot({ path: args.output + '.png', timeout: 30000 }).catch(() => {});
    }
    throw error;
  } finally {
    try {
      if (app) {
        enterPhase(lifecycle, 'desktop-close');
        await closeApp(app);
        lifecycle.app = undefined;
      }
    } finally {
      // GitHub Actions owns cleanup of RUNNER_TEMP. The fixture holds only
      // synthetic data and each attempt gets a fresh directory.
      if (!args.runnerTemp) {
        enterPhase(lifecycle, 'temp-cleanup');
        await observeFsWait(lifecycle, () => fs.rm(root, { recursive: true, force: true, maxRetries: 3 }));
      }
    }
  }
}

function drainOutput(stream, text) {
  // Drain output, then hard-exit: a wedged, SIGKILLed Electron leaves its
  // forked helpers holding the stdio pipes, Playwright's transport never sees
  // EOF and the event loop never drains. Keep the existing fallback in case
  // a write callback never fires.
  return new Promise(resolve => {
    const fallback = setTimeout(resolve, 250);
    stream.write(text, () => { clearTimeout(fallback); resolve(); });
  });
}

async function main() {
  const lifecycle = { phase: 'initialization', app: undefined,
    macCi: process.platform === 'darwin' && process.env.GITHUB_ACTIONS === 'true' };
  // Keep the guard alive until output and teardown finish, even if a pending
  // promise is the only remaining work apart from the guard itself.
  const heartbeat = startProgressWatchdog(lifecycle);
  let code = 0;
  try {
    const args = options(process.argv.slice(2)), report = await benchmark(args, lifecycle);
    const text = JSON.stringify(report, null, 2) + '\n';
    if (args.output) {
      enterPhase(lifecycle, 'report-write');
      await fs.mkdir(path.dirname(args.output), { recursive: true });
      await fs.writeFile(args.output, text);
    }
    await drainOutput(process.stdout, text);
  } catch (error) {
    code = 1;
    process.exitCode = code;
    await drainOutput(process.stderr, `${(error && error.stack) || error}\n`);
  } finally {
    clearInterval(heartbeat);
  }
  const cleanupNotice = code === 0 && formatCleanupSuccess(lifecycle.completedCleanup);
  if (cleanupNotice) console.error(cleanupNotice);
  process.exit(code);
}

module.exports = { options };
if (require.main === module) void main();
