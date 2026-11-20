"use strict";

const path = require("node:path");
const crypto = require("node:crypto");
const { Worker, MessageChannel } = require("node:worker_threads");
const { createScriptStorage } = require("./agent-script-storage");
const { createScriptPlaywright } = require("./agent-script-playwright");
const { BROWSER_TOOLS, browserTool, operate } = require("./agent-browser-tools");
const { describeScript, isLegacyScript } = require("./agent-script-template");

const MAX_WINDOWS = 200;
const MAX_CONCURRENCY = 8;
const windowQueues = new WeakMap();

function scriptWindows(ids, engine) {
  if (!Array.isArray(ids)) throw Error("无效的脚本任务窗口列表");
  const windows = [...new Set(ids.map(String))];
  if (!windows.length || windows.length > MAX_WINDOWS) throw Error("脚本任务需要选择 1 至 200 个本地窗口");
  if (windows.some(id => !engine.profiles.get(id) || engine.profiles.get(id).trashed))
    throw Error("脚本任务包含不存在或已回收的窗口");
  return windows;
}

function prepareScript(scriptTemplate, task, engine) {
  const { filename, scriptSource: source, params: savedParams, optionsSchema } = scriptTemplate.metadata || {};
  if (!source) throw Error("请先为脚本模板保存本地文件");
  const windowIds = scriptWindows(task.windowIds, engine);
  const params = savedParams ?? {};
  if (typeof params !== "object" || Array.isArray(params)) throw Error("无效的脚本参数");
  const encoded = JSON.stringify(params);
  if (Buffer.byteLength(encoded) > 256 * 1024) throw Error("脚本参数超过 256 KiB");
  const { paramsSchema: schema } = describeScript(source, filename, optionsSchema);
  const concurrency = task.metadata?.concurrency ?? 1;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY)
    throw Error("脚本任务并发数必须在 1 至 8 之间");
  const legacy = isLegacyScript(source);
  const timeoutMs = task.metadata?.timeoutMs ?? (legacy ? 120000 : 30000);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 300000)
    throw Error("脚本窗口超时必须在 1 至 300 秒之间");
  return { source, filename, schema, params: encoded, windowIds, concurrency, legacy, timeoutMs,
    debug: task.metadata?.debug === true };
}

function browserArguments(windowId, method, rawArgs) {
  if (!BROWSER_TOOLS.includes(method) || typeof rawArgs !== "string" || rawArgs.length > 20000)
    throw Error("无效的本地窗口操作");
  const args = JSON.parse(rawArgs);
  if (!args || typeof args !== "object" || Array.isArray(args)) throw Error("无效的本地窗口参数");
  const text = (key, limit) => {
    if (typeof args[key] !== "string" || args[key].length > limit) throw Error("无效的窗口参数 " + key);
    return args[key];
  };
  if (method === "navigate") {
    const url = new URL(text("url", 8192));
    if (!["http:", "https:"].includes(url.protocol) && url.href !== "about:blank")
      throw Error("脚本窗口仅支持 HTTP、HTTPS 和 about:blank");
    return { id: windowId, url: url.href };
  }
  if (method === "click" || method === "fill")
    return { id: windowId, selector: text("selector", 2000), ...(method === "fill" && { value: text("value", 16000) }) };
  return { id: windowId };
}

const MAX_PACKET = 14 * 1024 * 1024;
const pathMethods = new Set(["join", "resolve", "normalize", "dirname", "basename", "extname",
  "isAbsolute", "relative", "parse", "format"]);
const syncMethods = new Set(["pw_sync", "pw_subscribe", "pw_unsubscribe", "file", "path", "url", "crypto", "text_encode", "text_decode"]);

function cryptoOperation([method, args]) {
  if (method === "randomBytes") {
    const size = args[0];
    if (!Number.isSafeInteger(size) || size < 0 || size > 65536) throw Error("随机字节长度无效");
    return crypto.randomBytes(size);
  }
  if (method === "randomUUID") return crypto.randomUUID();
  const [algorithm, key, parts, encoding] = args;
  if (!["hash", "hmac"].includes(method) || !Array.isArray(parts)) throw Error("无效的脚本摘要操作");
  const hash = method === "hash" ? crypto.createHash(algorithm) : crypto.createHmac(algorithm, key);
  for (const [value, inputEncoding] of parts) hash.update(value, inputEncoding);
  return hash.digest(encoding);
}

function runScriptWindow(engine, script, windowId, signal, log, timeoutMs = script.timeoutMs ?? 30000, options = {}) {
  signal.throwIfAborted();
  const abort = new AbortController();
  const deadline = Date.now() + timeoutMs;
  const legacy = script.legacy ?? isLegacyScript(script.source);
  const { port1, port2 } = new MessageChannel();
  const latch = new SharedArrayBuffer(4);
  const notified = new Int32Array(latch);
  const env = {
    BROWSER_URL: "openbrowser:window",
    BROWSER_TYPE: engine?.running?.get(windowId)?.engine === "firefox" ? "firefox" : "chromium",
    CDP_URL: "openbrowser:cdp",
    SANDBOX_RUN_ID: options.runId || "",
    SANDBOX_DIR_ID: windowId,
    SANDBOX_DEBUG: options.debug === true ? "1" : "0",
  };
  const worker = new Worker(path.join(__dirname, "agent-script-worker.js"), {
    workerData: { source: script.source, filename: script.filename, schema: script.schema,
      params: script.params, windowId, deadline, legacy, env, latch, syncPort: port2 },
    transferList: [port2],
    resourceLimits: { maxOldGenerationSizeMb: 64, stackSizeMb: 4 },
  });
  const storage = createScriptStorage(options.storageRoot || script.storageRoot, abort.signal);
  const operations = new Set();
  let completed = false, succeeded = false, timer, cancel, eventCount = 0, eventBytes = 0;
  const session = createScriptPlaywright(engine, windowId, storage, abort.signal, (subscription, value) => {
    if (completed || eventCount >= 1500 || eventBytes >= 4 * 1024 * 1024) return;
    try {
      const payload = JSON.stringify(session.encode(value));
      if (payload.length > 192000) return;
      eventCount++;
      eventBytes += payload.length;
      worker.postMessage({ subscription, payload });
    } catch (error) { log("窗口事件读取失败 " + error.message.slice(0, 300)); }
  });

  function route(method, args) {
    abort.signal.throwIfAborted();
    switch (method) {
      case "simple": {
        const [name, params] = args;
        const input = browserArguments(windowId, name, JSON.stringify(params));
        if (env.BROWSER_TYPE === "firefox")
          return session.connect(["firefox", env.BROWSER_URL]).then(browser => operate(browser, name, input, abort.signal));
        return browserTool(engine, name, input, { abort });
      }
      case "pw_connect": return session.connect(args);
      case "pw_sync": return session.synchronous(args);
      case "pw_method": return session.method(args);
      case "pw_subscribe": return session.subscribe(args);
      case "pw_unsubscribe": return session.unsubscribe(args);
      case "table":
      case "kv": return storage.access(method, args);
      case "file": return storage.file(...args);
      case "path": {
        const [name, values] = args;
        if (!pathMethods.has(name)) throw Error("无效的脚本路径操作");
        if (name === "resolve") return path.posix.resolve("/", ...values);
        if (name === "relative") return path.posix.relative(...values.map(value => path.posix.resolve("/", value)));
        return path.posix[name](...values);
      }
      case "url": {
        const [input, base, property, value] = args;
        const fields = ["href", "protocol", "username", "password", "host", "hostname", "port", "pathname", "search", "hash"];
        const url = new URL(input, base);
        if (fields.includes(property)) url[property] = value;
        return Object.fromEntries([...fields, "origin"].map(key => [key, url[key]]));
      }
      case "crypto": return cryptoOperation(args);
      case "text_encode": return Buffer.from(args[0], "utf8");
      case "text_decode": return args[0].toString(args[1]);
      case "llm":
        if (!options.model) throw Error("请先配置本地 Agent 的模型连接");
        return options.model(args[0], args[1], args[2], abort.signal);
      default: throw Error("无效的本地脚本消息");
    }
  }

  const done = new Promise((resolve, reject) => {
    const finish = (error, result) => {
      if (completed) return;
      completed = true;
      succeeded = !error;
      error ? reject(error) : resolve(result);
    };
    cancel = () => finish(signal.reason || Error("脚本已停止"));
    signal.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(() => finish(Error("本地脚本执行超时")), Math.max(1, deadline - Date.now()));
    worker.on("error", error => finish(error));
    worker.on("exit", () => finish(Error("本地脚本进程提前退出")));
    worker.on("message", message => {
      if (completed) return;
      if (message.type === "log") { log(message.line); return; }
      if (message.type === "result") { finish(null, message.value); return; }
      if (message.type === "failure") { finish(Error(message.error)); return; }
      const { id, method, data, synchronous } = message;
      if (message.type !== "host" || !Number.isSafeInteger(id) || typeof data !== "string" ||
          data.length > MAX_PACKET || (synchronous && !syncMethods.has(method))) {
        finish(Error("无效的本地脚本消息"));
        return;
      }
      const operation = Promise.resolve().then(async () => {
        try {
          const args = session.decode(JSON.parse(data));
          if (!Array.isArray(args)) throw Error("无效的脚本操作参数");
          const value = await route(method, args);
          const encoded = JSON.stringify({ ok: true, value: session.encode(value) });
          if (encoded.length > MAX_PACKET) throw Error("脚本操作返回内容过长");
          return encoded;
        } catch (error) {
          return JSON.stringify({ ok: false, error: String(error?.message || error).slice(0, 500),
            ...(typeof error?.code === "string" && { code: error.code }) });
        }
      }).then(response => {
        if (completed) return;
        if (synchronous) {
          port1.postMessage({ id, response });
          Atomics.store(notified, 0, 1);
          Atomics.notify(notified, 0);
        } else worker.postMessage({ id, response });
      }).catch(error => finish(error));
      operations.add(operation);
      void operation.finally(() => operations.delete(operation));
    });
  });
  return done.finally(async () => {
    clearTimeout(timer);
    signal.removeEventListener("abort", cancel);
    if (!succeeded) abort.abort();
    const client = succeeded ? session.close() : session.cancel();
    await Promise.allSettled([worker.terminate(), client, ...operations]);
    abort.abort();
    port1.close();
    if (storage.artifacts.size && options.artifacts) await options.artifacts(windowId, storage.artifacts);
  });
}

async function withScriptWindow(engine, windowId, signal, run) {
  signal.throwIfAborted();
  let queues = windowQueues.get(engine);
  if (!queues) windowQueues.set(engine, queues = new Map());
  const previous = queues.get(windowId);
  let release;
  const own = new Promise(resolve => { release = resolve; });
  const tail = previous ? previous.then(() => own) : own;
  queues.set(windowId, tail);
  void tail.then(() => {
    if (queues.get(windowId) === tail) queues.delete(windowId);
  });
  try {
    if (previous) {
      let onAbort;
      const stopped = new Promise(resolve => {
        onAbort = resolve;
        signal.addEventListener("abort", onAbort, { once: true });
      });
      try { await Promise.race([previous, stopped]); }
      finally { signal.removeEventListener("abort", onAbort); }
    }
    signal.throwIfAborted();
    return await run();
  } finally {
    release();
  }
}

async function runScriptTask(engine, script, signal, publish, options) {
  const quota = Math.floor(96000 / script.windowIds.length);
  const terminalBudget = Math.min(12010, Math.floor(quota * 0.65));
  let index = 0, failed = 0;
  async function lane() {
    while (index < script.windowIds.length && !signal.aborted) {
      const windowId = script.windowIds[index++];
      let consoleBudget = quota - terminalBudget;
      const write = (line, status) => {
        const budget = status ? terminalBudget : consoleBudget;
        if (!budget && !status) return;
        const shortened = line.length > budget ? line.slice(0, budget - 1) + "…" : line;
        if (!status) consoleBudget = Math.max(0, consoleBudget - shortened.length - 1);
        publish(windowId, shortened, status);
      };
      try {
        await withScriptWindow(engine, windowId, signal, async () => {
          publish(windowId, "", "running");
          const result = await runScriptWindow(engine, script, windowId, signal, line => write(line), script.timeoutMs, options);
          write("结果 " + result, "success");
        });
      } catch (error) {
        if (signal.aborted) break;
        failed++;
        write("失败 " + error.message, "failed");
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(script.concurrency, script.windowIds.length) }, lane));
  signal.throwIfAborted();
  if (failed) throw Object.assign(Error(`${failed} 个窗口的本地脚本执行失败`), {
    code: failed === script.windowIds.length ? "SCRIPT_EXECUTION_FAILED" : "PARTIAL_WINDOW_FAILURE",
  });
}

module.exports = { prepareScript, runScriptTask, runScriptWindow, scriptWindows, MAX_CONCURRENCY };
