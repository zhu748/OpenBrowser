"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { prepareScript, runScriptTask, runScriptWindow } = require("./agent-script-runner");
const { recoverInterruptedRuns } = require("./agent-events");
const { createScriptStorage } = require("./agent-script-storage");

async function checkStorage(signal) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openbrowser-script-store-test-"));
  const previousKeyFile = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, "test.key");
  try {
    const location = path.join(root, "namespaces");
    const first = createScriptStorage(location, signal);
    const second = createScriptStorage(location, signal);
    await Promise.all(Array.from({ length: 12 }, (_, index) => (index % 2 ? first : second)
      .access("table", ["shared", "append", { serial: index, note: index === 0 ? 'line,"one"\n二' : null }])));
    const reopened = createScriptStorage(location, signal);
    const rows = await reopened.access("table", ["shared", "all"]);
    assert.equal(rows.length, 12);
    assert.deepEqual(rows.map(row => row.serial).sort((a, b) => a - b), Array.from({ length: 12 }, (_, index) => index));
    assert.match(second.read("shared.csv").toString(), /"line,""one""\n二"/);
    assert.throws(() => reopened.file("readFile", ["../../host/never"]), /输出目录/);
    reopened.file("mkdir", ["collision.kv.json"]);
    await assert.rejects(reopened.access("kv", ["collision", "set", "example", 1]), /路径是目录/);
    assert.equal(await first.access("kv", ["collision", "has", "example"]), false, "failed output reservation must not commit state");
    await first.access("kv", ["shared", "set", "__proto__", { saved: true }]);
    assert.deepEqual(await second.access("kv", ["shared", "get", "__proto__"]), { saved: true });
    assert.equal(await second.access("kv", ["shared", "has", "constructor"]), false);
  } finally {
    if (previousKeyFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = previousKeyFile;
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

async function main() {
  const signal = new AbortController().signal;
  const engine = { running: new Map() };
  const options = {
    filename: "test.ts",
    schema: { type: "object", properties: { n: { type: "integer", default: 4 } }, required: ["n"] },
    params: "{}",
  };
  const run = (source, overrides = {}, abort = signal, timeout) =>
    runScriptWindow(engine, { ...options, ...overrides, source }, "selected-window", abort, () => {}, timeout);
  const result = await run(`
    import {defineMetadata, defineParams} from "@roxybrowser/sandbox";
    defineMetadata({name: "test"});
    defineParams({type: "object"});
    export async function main({n}: {n: number}, {windowId}: {windowId: string}) {
      await Promise.resolve();
      return [n, windowId, typeof process, typeof fetch, typeof require];
    }
  `);
  assert.deepEqual(JSON.parse(result), [4, "selected-window", "undefined", "undefined", "undefined"]);
  await assert.rejects(run('import fs from "node:fs"; export const main = () => fs;'), /不支持模块/);
  await assert.rejects(run('export const main = async () => import("https://example.invalid/extra.js");'), /不支持模块/);
  await assert.rejects(run("export function main(){return 1}", { params: '{"n":"invalid"}' }), /脚本参数无效/);
  await assert.rejects(run('export async function main(){await new Promise(() => {});}', {}, signal, 2000), /无法完成/);
  await assert.rejects(run('import {browser} from "@openbrowser/sandbox"; export function main(){browser.listTabs(); return "claimed success";}'), /未完成的窗口操作/);
  await assert.rejects(run("export function main(){while(true){}}", {}, signal, 450), /超时|interrupt/i);

  const controller = new AbortController();
  const cancelled = run("export async function main(){while(true){await Promise.resolve()}}", {}, controller.signal);
  const timer = setTimeout(() => controller.abort(Error("测试取消")), 350);
  try { await assert.rejects(cancelled, /测试取消/); }
  finally { clearTimeout(timer); }
  assert.equal(await run("export const __main = () => 42;"), "42");
  assert.equal(await run('enum Result { Finished = "yes" }; export function main() { return Result.Finished; }'), '"yes"');
  assert.equal(await run('import {sleep} from "@roxybrowser/sandbox/utils"; export async function main(){ await sleep(1); process.exit(0); }'), "null");
  await assert.rejects(run('import "playwright"; export function main(){ process.exit(2); }'), /退出码 2/);
  const compatible = prepareScript({ metadata: {
    filename: "archive.ts", scriptSource: 'import "playwright"; export function main({number}){ return number; }',
    optionsSchema: '{"type":"object","properties":{"number":{"default":7}},"required":["number"]}',
  } }, { windowIds: ["selected-window"] }, { profiles: new Map([["selected-window", {}]]) });
  assert.equal(await runScriptWindow(engine, compatible, "selected-window", signal, () => {}, 2000), "7");
  await checkStorage(signal);
  const tabs = [];
  await assert.rejects(runScriptTask(engine, {
    ...options,
    source: 'export function main(_, {windowId}) { if (windowId === "second") throw Error("窗口失败"); return windowId; }',
    windowIds: ["first", "second"], concurrency: 2,
  }, signal, (windowId, line, status) => tabs.push({ windowId, line, status })), { code: "PARTIAL_WINDOW_FAILURE" });
  assert.deepEqual(tabs.filter(entry => entry.status !== "running").sort((a, b) => a.windowId.localeCompare(b.windowId)), [
    { windowId: "first", line: '结果 "first"', status: "success" },
    { windowId: "second", line: "失败 窗口失败", status: "failed" },
  ]);

  const singleWindow = { ...options, windowIds: ["same"], concurrency: 1, source: "export const main = () => 42;" };
  const order = [];
  const launch = (label, abort = signal) => runScriptTask(engine, singleWindow, abort, (_id, _line, status) => {
    order.push(label + ":" + status);
  });
  const first = launch("first");
  const waiting = new AbortController();
  const abandoned = launch("abandoned", waiting.signal);
  const last = launch("last");
  waiting.abort(Error("取消排队任务"));
  await assert.rejects(abandoned, /取消排队任务/);
  await Promise.all([first, last]);
  assert.deepEqual(order, ["first:running", "first:success", "last:running", "last:success"]);

  const event = { runId: "run", sequence: 1, startSequence: 1, event: { type: "run_started" } };
  const interrupted = {
    conversations: [],
    logs: [{ templateType: "script", status: "running", events: [event] }],
  };
  recoverInterruptedRuns(interrupted);
  assert.equal(interrupted.logs[0].status, "interrupted");
  assert.match(interrupted.logs[0].events.at(-1).event.data.message, /任务管理重新运行/);
  console.log("LOCAL_SCRIPT_SELFTEST OK (isolation, exit, cancellation, same-window queue, concurrent storage and restart recovery)");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
