#!/usr/bin/env node
'use strict';

// Exercise the default obui:// workbench through its real controls, preload,
// IPC, BrowserEngine and SQLite. Timings include UI debounce and paint frames.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron: electron } = require('playwright');
const searchPlaceholder = /^搜索 (?:Ctrl|⌘) \+ F$/;

function options(argv) {
  const result = { sizes: [10, 100, 1000], rounds: 7, budgetMs: 1500 };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i], value = argv[++i];
    if (flag === '--sizes' && value) result.sizes = value.split(',').map(Number);
    else if (flag === '--rounds') result.rounds = Number(value);
    else if (flag === '--interaction-budget-ms') result.budgetMs = Number(value);
    else if (flag === '--output' && value) result.output = path.resolve(value);
    else throw Error('Usage: benchmark-workbench.js [--sizes 10,100,1000] [--rounds 7] [--interaction-budget-ms 1500] [--output file]');
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

async function closeApp(app) {
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
  await page.evaluate(() => {
    globalThis.__workbenchBenchmark = { sequence: 0, rows: [] };
    globalThis.__workbenchBenchmarkDispose = globalThis.ops.onEvent(event => {
      if (event.type === 'benchmark:query') globalThis.__workbenchBenchmark = event.state;
    });
  });
  await app.evaluate(({ ipcMain }) => {
    const original = ipcMain._invokeHandlers.get('rebuild:request');
    const state = { sequence: 0, rows: [] };
    ipcMain.removeHandler('rebuild:request');
    ipcMain.handle('rebuild:request', async (event, method, params) => {
      const response = await original(event, method, params);
      if (method === 'profiles:query' && response.ok) {
        state.sequence++;
        state.params = { ...params };
        state.rows = response.value.rows.map(row => row.windowName);
        state.total = response.value.total;
        event.sender.send('engine:event', { type: 'benchmark:query', state });
      }
      return response;
    });
  });
}

async function queryPaint(page, act, expected) {
  const sequence = await page.evaluate(() => globalThis.__workbenchBenchmark.sequence);
  const start = performance.now();
  await act();
  await page.waitForFunction(({ sequence, expected }) => {
    const current = globalThis.__workbenchBenchmark;
    return current.sequence > sequence && (expected === null || String(current.params.queryValue || '') === expected);
  }, { sequence, expected });
  const rows = await page.evaluate(() => globalThis.__workbenchBenchmark.rows);
  await page.waitForFunction(rows => {
    const text = document.querySelector('table tbody')?.textContent || '';
    return rows.length ? rows.every(name => text.includes(name)) : text.includes('暂无查询结果');
  }, rows);
  await paint(page);
  return performance.now() - start;
}

async function measure(page, count, rounds) {
  const search = page.getByPlaceholder(searchPlaceholder);
  const searchMs = [], pageMs = [], selectionMs = [];
  // Ensure the warm-up itself is a real query even for a single-page fleet.
  const query = async value => { await search.fill(value); await search.press('Enter'); };
  await queryPaint(page, () => query('warmup-no-match'), 'warmup-no-match');
  for (let i = 0; i < rounds; i++) {
    const value = i % 2 ? 'no-match-' + i : 'Workbench benchmark';
    searchMs.push(await queryPaint(page, () => query(value), value));
  }
  await queryPaint(page, () => query(''), '');
  if (count > 10) {
    for (let i = 0; i < rounds; i++) {
      const next = i % 2 === 0;
      pageMs.push(await queryPaint(page, () => page.getByRole('button', { name: next ? 'Next Page' : 'Previous Page', exact: true }).click(), null));
    }
  }
  for (let i = 0; i < rounds; i++) {
    const start = performance.now(), checked = i % 2 === 0;
    await page.locator('thead input[type=checkbox]').setChecked(checked, { force: true });
    await page.waitForFunction(value => document.querySelector('thead input[type=checkbox]')?.checked === value, checked);
    await paint(page);
    selectionMs.push(performance.now() - start);
  }
  const counter = await page.evaluate(() => globalThis.__localRequest('profiles:count'));
  assert.deepEqual(counter, { count });
  const fullListBytes = await page.evaluate(async () => new TextEncoder().encode(JSON.stringify(await globalThis.__localRequest('profiles:list'))).byteLength);
  return { count, renderedRows: await page.locator('tbody tr').count(),
    searchP95Ms: +p95(searchMs).toFixed(1), paginationP95Ms: pageMs.length ? +p95(pageMs).toFixed(1) : null,
    selectionP95Ms: +p95(selectionMs).toFixed(1), countPayloadBytes: Buffer.byteLength(JSON.stringify(counter)), fullListPayloadBytes: fullListBytes };
}

async function benchmark(args) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-workbench-benchmark-'));
  const errors = [], reports = [];
  let app, page;
  try {
    const start = performance.now();
    app = await electron.launch({ executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.resolve(__dirname, '..')],
      env: { ...process.env, OPENBROWSER_ROXY_UI: '1', OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0',
        OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'master.key') }, timeout: 30000 });
    page = await app.firstWindow();
    page.on('pageerror', error => errors.push(error.message));
    // A hosted desktop runner can occlude Electron even when its page is loaded.
    const window = await app.browserWindow(page);
    await window.evaluate(window => {
      window.webContents.setBackgroundThrottling(false);
      window.show();
      window.focus();
    });
    await window.dispose();
    await page.waitForFunction(() => !!globalThis.__localRequest && !!globalThis.__localApi?.window && !!globalThis.__router);
    await page.getByPlaceholder(searchPlaceholder).waitFor();
    assert.ok(page.url().startsWith('obui://app/'), 'benchmark must exercise the default workbench');
    const startupMs = Math.round(performance.now() - start);
    await observeQueries(app, page);
    let current = 0;
    for (const size of args.sizes) {
      console.error(`Measuring workbench interactions at ${size} profiles`);
      while (current < size) {
        const batch = Math.min(100, size - current);
        await page.evaluate(({ batch, current }) => globalThis.__localRequest('profiles:create-batch', {
          createCount: batch, os: 'Linux', coreType: 'Chrome', windowNamePrefix: 'Workbench benchmark ' + current,
        }), { batch, current });
        current += batch;
      }
      await page.waitForFunction(count => document.querySelector('[role=meter]')?.getAttribute('aria-valuenow') === String(count), size);
      const report = await measure(page, size, args.rounds);
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
    console.error(error.message);
    if (args.output) {
      await fs.mkdir(path.dirname(args.output), { recursive: true });
      await fs.writeFile(args.output, JSON.stringify({ complete: false, reports, errors, error: error.stack }, null, 2));
      await page?.screenshot({ path: args.output + '.png' }).catch(() => {});
    }
    throw error;
  } finally {
    try {
      if (app) await closeApp(app);
    } finally {
      await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
    }
  }
}

async function main() {
  const args = options(process.argv.slice(2)), report = await benchmark(args);
  const text = JSON.stringify(report, null, 2) + '\n';
  if (args.output) { await fs.mkdir(path.dirname(args.output), { recursive: true }); await fs.writeFile(args.output, text); }
  process.stdout.write(text);
}

module.exports = { options };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
