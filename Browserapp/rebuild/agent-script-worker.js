"use strict";

const { parentPort, receiveMessageOnPort, workerData } = require("node:worker_threads");
const { newQuickJSWASMModuleFromVariant } = require("quickjs-emscripten-core");
const variant = require("@jitl/quickjs-wasmfile-release-sync").default;
const { scriptModule } = require("./agent-script-libraries");
const { scriptJavaScript } = require("./agent-script-template");

function validateSchema(schema, values, useDefaults = false) {
  const dialect = schema.$schema || "";
  const Ajv = typeof dialect === "string" && dialect.includes("2020-12") ? require("ajv/dist/2020") :
    typeof dialect === "string" && dialect.includes("2019-09") ? require("ajv/dist/2019") : require("ajv");
  const validator = new Ajv({ strict: false, validateSchema: false, ownProperties: true, useDefaults, logger: false });
  require("ajv-formats")(validator);
  const validate = validator.compile(schema);
  if (validate.$async) throw Error("本地脚本参数需要同步 JSON Schema");
  if (values === undefined) return;
  const options = JSON.parse(values);
  if (!validate(options)) {
    const first = validate.errors[0];
    throw Error("脚本参数无效 " + (first.instancePath || "/") + " " + first.message);
  }
  return JSON.stringify(options);
}

async function execute() {
  const { source, filename, schema, params, windowId, deadline, legacy, env, syncPort, latch } = workerData;
  const options = validateSchema(schema, params, true);
  const wasm = await newQuickJSWASMModuleFromVariant(variant);
  const runtime = wasm.newRuntime();
  runtime.setMemoryLimit(32 * 1024 * 1024);
  runtime.setMaxStackSize(512 * 1024);
  runtime.setInterruptHandler(() => Date.now() >= deadline);
  runtime.setModuleLoader(name => scriptModule(name, legacy));
  const context = runtime.newContext();
  const pending = new Map();
  const timers = new Map();
  const notified = new Int32Array(latch);
  let wake, nextId = 0, nextTimer = 0, logged = 0, delivered = 0, simplePending = false, fatal, dispatch, exitCode;
  const managed = [];
  const keep = handle => { managed.push(handle); return handle; };
  const poll = ({ id, response, subscription, payload }) => {
    try {
      if (subscription !== undefined) {
        if (!dispatch || delivered++ >= 1500) return;
        const key = context.newNumber(subscription), data = context.newString(payload);
        try { context.unwrapResult(context.callFunction(dispatch, context.undefined, key, data)).dispose(); }
        finally { key.dispose(); data.dispose(); }
      } else {
        const item = pending.get(id);
        if (!item) return;
        pending.delete(id);
        if (item.method === "simple") simplePending = false;
        const value = context.newString(response);
        try { item.deferred.resolve(value); }
        finally { value.dispose(); item.deferred.dispose(); }
      }
    } catch (error) { fatal = error; }
    finally { wake?.(); }
  };
  parentPort.on("message", poll);
  const expose = (name, callback) => context.setProp(context.global, name, keep(context.newFunction(name, callback)));
  expose("__scriptLog", line => {
    if (logged++ < 20 && context.typeof(line) === "string")
      parentPort.postMessage({ type: "log", line: context.getString(line).slice(0, 600) });
  });
  expose("__scriptValidate", (schema, value) => {
    const json = context.getString(schema);
    if (json.length > 16000) throw Error("脚本模型输出 Schema 过长");
    validateSchema(JSON.parse(json), value && context.typeof(value) === "string" ? context.getString(value) : undefined);
  });
  expose("__scriptExit", code => {
    const value = context.getNumber(code);
    if (!Number.isInteger(value) || value < 0 || value > 255) throw Error("脚本退出码无效");
    exitCode = value;
    throw Error("脚本请求退出");
  });
  expose("__scriptHost", (method, args, sync) => {
    if (context.typeof(method) !== "string" || context.typeof(args) !== "string" || nextId >= 6000 || pending.size >= 32)
      throw Error("本地脚本操作次数或并发数超出限制");
    const name = context.getString(method);
    const data = context.getString(args);
    if (data.length > 14 * 1024 * 1024) throw Error("脚本调用内容超出限制");
    const id = ++nextId;
    const synchronous = context.dump(sync) === true;
    const message = { type: "host", id, method: name, data, synchronous };
    if (synchronous) {
      Atomics.store(notified, 0, 0);
      parentPort.postMessage(message);
      while (Date.now() < deadline) {
        if (Atomics.load(notified, 0)) {
          const result = receiveMessageOnPort(syncPort);
          if (result?.message.id === id) return context.newString(result.message.response);
        }
        Atomics.wait(notified, 0, Atomics.load(notified, 0), 20);
      }
      throw Error("本地脚本执行超时");
    }
    if (name === "simple" && simplePending) throw Error("请顺序调用本地窗口");
    if (name === "simple") simplePending = true;
    const deferred = context.newPromise();
    pending.set(id, { deferred, method: name });
    parentPort.postMessage(message);
    return deferred.handle.dup();
  });
  expose("__scriptTimer", (callback, delay, repeat) => {
    if (context.typeof(callback) !== "function" || timers.size >= 64 || nextTimer >= 6000)
      throw Error("无效的脚本计时器");
    const fn = callback.dup();
    const timerId = ++nextTimer;
    const interval = context.dump(repeat) === true;
    const invoke = () => {
      if (!interval) timers.delete(timerId);
      try { context.unwrapResult(context.callFunction(fn, context.undefined)).dispose(); }
      catch (error) { fatal = error; }
      finally {
        if (!interval) fn.dispose();
        wake?.();
      }
    };
    const ms = Math.max(1, Math.min(context.getNumber(delay) || 0, Math.max(1, deadline - Date.now())));
    const timer = interval ? setInterval(invoke, ms) : setTimeout(invoke, ms);
    timers.set(timerId, { timer, fn });
    return context.newNumber(timerId);
  });
  const clear = id => {
    const item = timers.get(id);
    if (!item) return;
    timers.delete(id);
    clearTimeout(item.timer);
    item.fn.dispose();
  };
  expose("__cancelScriptTimer", id => clear(context.getNumber(id)));

  async function settle(handle) {
    while (Date.now() < deadline) {
      if (fatal) throw fatal;
      const state = context.getPromiseState(handle);
      if (state.type !== "pending") return context.unwrapResult(state);
      const jobs = runtime.executePendingJobs(100);
      if (context.unwrapResult(jobs) === 0) {
        if (!pending.size && !timers.size) {
          // Event-only waits are allowed while the document is open.
          if (!legacy) throw Error("脚本等待的 Promise 无法完成");
        }
        await new Promise(resolve => { wake = resolve; });
        wake = undefined;
      }
    }
    throw Error("本地脚本执行超时");
  }
  try {
    const decode = keep(context.unwrapResult(context.evalCode("JSON.parse")));
    keep(context.unwrapResult(context.evalCode(`
      (() => {
        const out = __scriptLog, timer = __scriptTimer, cancel = __cancelScriptTimer, exit = __scriptExit, stringify = JSON.stringify;
        const log = (...parts) => out(parts.map(part => typeof part === "string" ? part : stringify(part)).join(" ").slice(0, 600));
        globalThis.console = Object.freeze({ log, info: log, warn: log, error: log, debug: ${env.SANDBOX_DEBUG === "1" ? "log" : "() => {}"} });
        globalThis.defineMetadata = globalThis.defineParams = value => value;
        globalThis.setTimeout = (fn, ms = 0, ...args) => timer(() => fn(...args), Number(ms), false);
        globalThis.setInterval = (fn, ms = 0, ...args) => timer(() => fn(...args), Number(ms), true);
        globalThis.clearTimeout = globalThis.clearInterval = cancel;
        globalThis.setImmediate = (fn, ...args) => globalThis.setTimeout(fn, 0, ...args);
        globalThis.clearImmediate = cancel;
        delete globalThis.__scriptLog;
        delete globalThis.__scriptTimer;
        delete globalThis.__cancelScriptTimer;
        delete globalThis.__scriptExit;
        if (${legacy}) {
          const noOp = () => {};
          globalThis.process = Object.freeze({
            env: Object.freeze(${JSON.stringify(env)}), cwd: () => "/", execPath: "node",
            platform: ${JSON.stringify(process.platform)}, arch: ${JSON.stringify(process.arch)},
            argv: ["node", "sandbox", ${JSON.stringify(filename)}], execArgv: [],
            exit: (code = 0) => exit(Number(code)),
            nextTick: (fn, ...args) => Promise.resolve().then(() => fn(...args)),
            stdout: { write: log }, stderr: { write: log }, on: noOp, once: noOp, off: noOp,
          });
        }
      })()
    `)));
    const bootstrap = keep(context.unwrapResult(context.evalCode(`
      import { Bytes, dispatch } from "@openbrowser/sandbox/internal";
      import { URL, URLSearchParams } from "node:url";
      delete globalThis.__scriptHost;
      delete globalThis.__scriptValidate;
      globalThis.URL = URL;
      globalThis.URLSearchParams = URLSearchParams;
      globalThis.Buffer = Bytes;
      globalThis.TextEncoder = class { encode(value = "") { return Bytes.from(String(value)); } };
      globalThis.TextDecoder = class {
        constructor(encoding = "utf8") { this.encoding = encoding; }
        decode(bytes = []) { return Bytes.from(bytes).toString(this.encoding); }
      };
      export { dispatch };
    `, "sandbox-bootstrap.mjs", { type: "module" })));
    const boot = await settle(bootstrap);
    if (boot !== bootstrap) keep(boot);
    dispatch = keep(context.getProp(boot, "dispatch"));
    const encode = keep(context.unwrapResult(context.evalCode(`
      (() => {
        const stringify = JSON.stringify;
        return value => {
          const text = stringify(value) ?? "null";
          if (text.length > 12000) throw Error("脚本返回值超过 12000 字符");
          return text;
        };
      })()
    `)));
    const loaded = keep(context.unwrapResult(context.evalCode(scriptJavaScript(source), filename, { type: "module" })));
    const namespace = await settle(loaded);
    if (namespace !== loaded) keep(namespace);
    let entry = keep(context.getProp(namespace, "main"));
    if (context.typeof(entry) !== "function") entry = keep(context.getProp(namespace, "__main"));
    if (context.typeof(entry) !== "function") throw Error("脚本的 main(options) 不是函数");
    const args = keep(context.unwrapResult(context.callFunction(decode, context.undefined, keep(context.newString(options)))));
    const scope = keep(context.unwrapResult(context.callFunction(decode, context.undefined, keep(context.newString(JSON.stringify({ windowId }))))));
    const result = keep(context.unwrapResult(context.callFunction(entry, context.undefined, args, scope)));
    const output = await settle(result);
    if (output !== result) keep(output);
    const encoded = keep(context.unwrapResult(context.callFunction(encode, context.undefined, output)));
    if (exitCode !== undefined) throw Error("脚本请求退出");
    if (pending.size) throw Error("脚本退出时仍有未完成的窗口操作，请等待操作完成");
    return context.getString(encoded);
  } catch (error) {
    if (exitCode === 0 && !pending.size) return "null";
    if (exitCode) throw Error("脚本退出码 " + exitCode);
    throw error;
  } finally {
    parentPort.off("message", poll);
    for (const id of timers.keys()) clear(id);
    for (const { deferred } of pending.values()) deferred.dispose();
    syncPort.close();
    for (const handle of managed.reverse()) handle.dispose();
    context.dispose();
    runtime.dispose();
  }
}

execute().then(
  value => parentPort.postMessage({ type: "result", value }),
  error => parentPort.postMessage({ type: "failure", error: String(error?.message || error).slice(0, 600) }),
);
