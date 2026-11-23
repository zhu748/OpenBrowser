'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const filename = path.join(__dirname, 'benchmark-workbench.js');
const script = new vm.Script(fs.readFileSync(filename, 'utf8'), { filename });
const pending = () => new Promise(() => {});
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture(stall) {
  const trace = [], notices = [], stdoutText = [], reports = [], terminal = [], timers = new Set();
  let now = 0;
  const timer = (fn, delay, repeat) => {
    const task = { fn, delay, at: now + delay, repeat, unref() {} };
    timers.add(task);
    return task;
  };
  const stdout = { write: (text, callback) => { stdoutText.push(text); if (stall !== 'stdout') callback?.(); } };
  const stderr = { write: (_text, callback) => { if (stall !== 'stderr') callback?.(); } };
  let context;
  const locator = { waitFor: async () => {}, count: async () => 1, fill: async () => {}, press: async () => {}, setChecked: async () => {} };
  const page = {
    on() {},
    url: () => 'obui://app/index.html',
    locator: () => locator,
    getByPlaceholder: () => locator,
    waitForFunction: async () => ({
      jsonValue: async () => ({ handlerMs: 0, observedAt: 0, paintedAt: 0 }), dispose: async () => {},
    }),
    async evaluate(fn) {
      const body = String(fn);
      if (body.includes("'profiles:count'")) return vm.runInContext('({ count: 1 })', context);
      if (body.includes('TextEncoder')) return 3;
      return 0;
    },
  };
  const app = {
    async firstWindow() {
      if (stall === 'throw' || stall === 'stderr') throw Error('synthetic renderer error');
      return page;
    },
    evaluate: async () => {},
    browserWindow: async () => ({ evaluate: async () => {}, dispose: async () => {} }),
    close: async () => { trace.push('close'); },
    process: () => ({ kill: () => trace.push('kill') }),
  };
  const files = {
    mkdtemp: async () => {
      trace.push('temp-create');
      if (stall === 'temp-create') return pending();
      return '/synthetic';
    },
    mkdir: async () => {},
    rm: async () => {
      trace.push('temp-cleanup');
      if (stall === 'temp-cleanup') return pending();
    },
    writeFile: async (_path, text) => {
      const report = JSON.parse(text);
      trace.push('report-write');
      if (stall === 'report-write' && report.complete) return pending();
      reports.push(report);
    },
  };
  const mod = { exports: {} };
  function stubRequire(name) {
    switch (name) {
      case 'node:assert/strict': return assert;
      case 'node:fs/promises': return files;
      case 'node:path': return path;
      case 'node:os': return { tmpdir: () => '/synthetic' };
      case 'playwright': return { _electron: { launch: async () => app } };
      case 'electron': return '/synthetic/electron-not-executed';
      default: throw Error('Unexpected module in inert fixture: ' + name);
    }
  }
  stubRequire.main = mod;
  context = vm.createContext({
    require: stubRequire, module: mod, __dirname, Buffer, performance: { now: () => now },
    process: {
      argv: ['node', filename, '--sizes', '1', '--rounds', '1', '--output', '/synthetic/report.json'],
      platform: 'darwin', env: {}, version: 'inert', uptime: () => now / 1000, memoryUsage: () => ({ rss: 0 }),
      stdout, stderr, exit: code => terminal.push(code),
    },
    console: { error: text => { if (text.startsWith('::notice::')) notices.push(text); } },
    setInterval: (fn, ms) => timer(fn, ms, true), setTimeout: (fn, ms) => timer(fn, ms, false),
    clearTimeout: event => timers.delete(event), clearInterval: event => timers.delete(event),
  });
  script.runInContext(context, { timeout: 1000 });

  async function advance(to) {
    await flush();
    while (!terminal.length) {
      const next = [...timers].sort((a, b) => a.at - b.at)[0];
      if (!next || next.at > to) break;
      now = next.at;
      if (next.repeat) next.at += next.delay;
      else timers.delete(next);
      next.fn();
      await flush();
    }
    now = to;
  }
  return { trace, notices, stdoutText, reports, terminal, advance };
}

for (const phase of ['temp-create', 'temp-cleanup', 'report-write']) {
  test(`the real workbench CLI keeps its idle guard during ${phase}`, async () => {
    const run = fixture(phase);
    await run.advance(150000);
    assert.equal(run.trace.at(-1), phase, phase);
    assert.deepEqual(run.terminal, [], 'must retain the 150s idle threshold');
    await run.advance(180000);
    assert.deepEqual(run.terminal, [2], phase);
    assert.ok(run.notices.includes(`::notice::Workbench benchmark phase=${phase}`), phase);
    assert.ok(run.notices.includes(`::notice::Workbench benchmark idle limit exceeded: phase=${phase}`), phase);
    assert.equal(run.reports.some(report => report.complete), false, phase);
  });
}

test('healthy and thrown renderer paths retain complete vs failure report and exit semantics', async () => {
  const healthy = fixture('none');
  await healthy.advance(240000);
  assert.deepEqual(healthy.terminal, [0]);
  assert.deepEqual(healthy.trace, ['temp-create', 'close', 'temp-cleanup', 'report-write']);
  assert.equal(healthy.reports[0].complete, true);
  assert.equal(healthy.reports[0].reports[0].count, 1);
  assert.equal(healthy.reports[0].rounds, 1);
  assert.equal(healthy.reports[0].interactionBudgetMs, 1500);
  assert.deepEqual(healthy.stdoutText.map(text => JSON.parse(text)), healthy.reports, 'stdout must remain JSON-only');
  const failed = fixture('throw');
  await failed.advance(240000);
  assert.deepEqual(failed.terminal, [1]);
  assert.deepEqual(failed.trace, ['temp-create', 'report-write', 'close', 'temp-cleanup']);
  assert.equal(failed.reports[0].complete, false);
  assert.match(failed.reports[0].error, /synthetic renderer error/);
  assert.doesNotMatch(failed.notices.join('\n'), /synthetic|report\.json/);
});

test('a missing output callback retains the 250ms drain fallback and correct process status', async () => {
  for (const [stream, code] of [['stdout', 0], ['stderr', 1]]) {
    const run = fixture(stream);
    await run.advance(249);
    assert.deepEqual(run.terminal, []);
    await run.advance(250);
    assert.deepEqual(run.terminal, [code]);
  }
});
