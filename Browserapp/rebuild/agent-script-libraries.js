"use strict";

const { api } = require("./agent-script-playwright");

function bridge(native) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const handles = new WeakMap();
  const values = new Map();
  const listeners = new Map();
  let sequence = 0;
  const stringify = JSON.stringify;
  const parse = JSON.parse;
  const toSource = Function.prototype.toString;
  const call = (method, args, sync = false) => {
    const response = native(method, stringify(encode(args)), sync);
    const unpack = reply => {
      const data = parse(reply);
      if (!data.ok) throw Object.assign(Error(data.error), data.code && { code: data.code });
      return decode(data.value);
    };
    return sync ? unpack(response) : response.then(unpack);
  };

  function encode64(bytes) {
    let output = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i], b = bytes[i + 1] || 0, c = bytes[i + 2] || 0;
      output += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] +
        (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : "=") +
        (i + 2 < bytes.length ? alphabet[c & 63] : "=");
    }
    return output;
  }

  function decode64(value) {
    const text = value.replace(/[\t\n\r =]/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const bytes = new Uint8Array(Math.floor(text.length * 6 / 8));
    let bits = 0, count = 0, index = 0;
    for (const char of text) {
      const digit = alphabet.indexOf(char);
      if (digit < 0) throw Error("无效的 Base64 字节");
      bits = (bits << 6) | digit;
      if ((count += 6) >= 8) bytes[index++] = bits >> (count -= 8);
    }
    return bytes;
  }

  class Bytes extends Uint8Array {
    static from(value, encoding = "utf8") {
      if (typeof value !== "string") return new Bytes(value);
      if (encoding === "base64" || encoding === "base64url") return new Bytes(decode64(value));
      if (encoding === "hex") return new Bytes((value.match(/[\da-f]{2}/gi) || []).map(byte => parseInt(byte, 16)));
      if (["binary", "latin1", "ascii"].includes(encoding)) return new Bytes(Array.from(value, ch => ch.charCodeAt(0)));
      return new Bytes(call("text_encode", [value], true));
    }
    static alloc(size, fill = 0) { return new Bytes(size).fill(fill); }
    static isBuffer(value) { return value instanceof Bytes; }
    static byteLength(value, encoding) { return Bytes.from(value, encoding).length; }
    static concat(arrays) {
      const bytes = new Bytes(arrays.reduce((sum, bytes) => sum + bytes.length, 0));
      let offset = 0;
      for (const array of arrays) { bytes.set(array, offset); offset += array.length; }
      return bytes;
    }
    toString(encoding = "utf8", start = 0, end = this.length) {
      const bytes = this.subarray(start, end);
      if (encoding === "base64" || encoding === "base64url") {
        const base64 = encode64(bytes);
        return encoding === "base64" ? base64 : base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      }
      if (encoding === "hex") return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
      return call("text_decode", [bytes, encoding], true);
    }
    toJSON() { return { type: "Buffer", data: Array.from(this) }; }
  }

  function encode(value, depth = 0) {
    if (depth > 40) throw Error("脚本参数嵌套过深");
    if (value === undefined) return { $type: "undefined" };
    if (typeof value === "function") return { $type: "function", source: Reflect.apply(toSource, value, []) };
    if (typeof value === "bigint" || (typeof value === "number" && !Number.isFinite(value)))
      return { $type: typeof value, value: String(value) };
    if (value === null || typeof value !== "object") return value;
    if (handles.has(value)) return { $type: "handle", id: handles.get(value) };
    if (value instanceof RegExp) return { $type: "regexp", source: value.source, flags: value.flags };
    if (value instanceof Date) return { $type: "date", value: value.toISOString() };
    if (ArrayBuffer.isView(value)) return { $type: "bytes", value: encode64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) };
    if (value instanceof ArrayBuffer) return { $type: "bytes", value: encode64(new Uint8Array(value)) };
    if (Array.isArray(value)) return value.map(item => encode(item, depth + 1));
    return { $type: "object", value: Object.fromEntries(Object.entries(value).map(([key, item]) =>
      [key, encode(item, depth + 1)])) };
  }

  function decode(value) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(decode);
    if (value.$type === "handle") return wrap(value.id, value.name);
    if (value.$type === "undefined") return undefined;
    if (value.$type === "bytes") return Bytes.from(value.value, "base64");
    if (value.$type === "date") return new Date(value.value);
    if (value.$type === "regexp") return new RegExp(value.source, value.flags);
    if (value.$type === "bigint") return BigInt(value.value);
    if (value.$type === "number") return Number(value.value);
    if (value.$type === "error") return Error(value.value);
    if (value.$type === "map") return new Map(decode(value.value));
    if (value.$type === "object") return Object.fromEntries(Object.entries(value.value).map(([key, item]) => [key, decode(item)]));
    throw Error("无效的任务返回值");
  }

  function wrap(id, type) {
    if (values.has(id)) return values.get(id);
    const [sync, async, events, properties] = definitions[type];
    const client = {};
    for (const name of sync) client[name] = (...args) => call("pw_sync", [id, name, args], true);
    for (const name of async) client[name] = (...args) => call("pw_method", [id, name, args]);
    for (const name of properties)
      Object.defineProperty(client, name, { get: () => call("pw_sync", [id, name, []], true) });

    if (events.length) {
      function remove(key) {
        listeners.delete(key);
        call("pw_unsubscribe", [key], true);
      }
      function add(event, fn, once = false) {
        if (typeof fn !== "function") throw TypeError("事件监听器必须是函数");
        const key = ++sequence;
        call("pw_subscribe", [id, event, key], true);
        listeners.set(key, { id, event, fn, dispatch: value => {
          if (once) remove(key);
          return fn(value);
        } });
        return key;
      }
      client.on = (event, fn) => { add(event, fn); return client; };
      client.addListener = client.on;
      client.once = (event, fn) => { add(event, fn, true); return client; };
      client.off = (event, fn) => {
        const found = [...listeners].reverse().find(([, item]) => item.id === id && item.event === event && item.fn === fn);
        if (found) remove(found[0]);
        return client;
      };
      client.removeListener = client.off;
      client.removeAllListeners = event => {
        for (const [key, item] of listeners)
          if (item.id === id && (event === undefined || item.event === event)) remove(key);
        return client;
      };
      client.waitForEvent = (event, options = {}) => new Promise((resolve, reject) => {
        const { predicate, timeout = 30000 } = typeof options === "function" ? { predicate: options } : options;
        let timer;
        let done = false;
        const finish = (value, error) => {
          if (done) return;
          done = true;
          globalThis.clearTimeout(timer);
          remove(key);
          if (error) reject(error);
          else resolve(value);
        };
        const key = add(event, async value => {
          try { if (!predicate || await predicate(value)) finish(value); }
          catch (error) { finish(undefined, error); }
        });
        if (timeout !== 0)
          timer = globalThis.setTimeout(() => finish(undefined, Error("等待 Playwright 事件超时：" + event)), timeout);
      });
    }

    if (type === "Page") {
      const matches = (pattern, value) => {
        if (typeof pattern === "function") return pattern(value);
        const url = value.url();
        if (pattern instanceof RegExp) return pattern.test(url);
        const escape = value => value.replace(/[\\^$+?.()|[\]{}]/g, "\\$&");
        if (pattern.includes("*"))
          return new RegExp("^" + pattern.split("**").map(part => part.split("*").map(escape).join("[^/]*")).join(".*") + "$").test(url);
        return pattern === url;
      };
      function waiter(event, pattern, options) {
        return client.waitForEvent(event, { ...options, predicate: value => matches(pattern, value) });
      }
      client.waitForResponse = (pattern, options) => waiter("response", pattern, options);
      client.waitForRequest = (pattern, options) => waiter("request", pattern, options);
    }
    handles.set(client, id);
    values.set(id, Object.freeze(client));
    return client;
  }

  return {
    call, Bytes,
    dispatch(key, payload) {
      const listener = listeners.get(key);
      if (listener) return listener.dispatch(decode(parse(payload)));
    },
  };
}

const definitions = Object.fromEntries(Object.entries(api).map(([name, group]) => [
  name, Array.from({ length: 4 }, (_, index) => (group[index] || "").split(" ").filter(Boolean)),
]));

function core(coreBridge) {
  const { call } = coreBridge;
  function browserType(type) {
    return Object.freeze({
      connect: endpoint => call("pw_connect", [type, typeof endpoint === "object" ? endpoint.wsEndpoint : endpoint]),
      connectOverCDP: endpoint => call("pw_connect", [type, typeof endpoint === "object" ? endpoint.endpointURL : endpoint]),
      name: () => type,
    });
  }
  const chromium = browserType("chromium"), firefox = browserType("firefox");
  const browser = Object.freeze({
    listTabs: () => call("simple", ["list_tabs", {}]),
    navigate: url => call("simple", ["navigate", { url }]),
    readPage: () => call("simple", ["read_page", {}]),
    click: selector => call("simple", ["click", { selector }]),
    fill: (selector, value) => call("simple", ["fill", { selector, value }]),
  });
  return { chromium, firefox, browser, defineMetadata: value => value, defineParams: value => value };
}

function utilities() {
  const randomBetween = (min, max) => Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
  const sleep = (min, max = min) => new Promise(resolve => globalThis.setTimeout(resolve, randomBetween(min, max)));
  const pick = arr => arr[randomBetween(0, arr.length - 1)];
  const maybe = probability => Math.random() < probability;
  function chunk(arr, size) {
    if (!Number.isSafeInteger(size) || size <= 0) throw RangeError("分组大小必须是正整数");
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));
  }
  async function retry(fn, { attempts = 3, baseDelay = 500, factor = 2, onRetry } = {}) {
    if (!Number.isSafeInteger(attempts) || attempts < 1) throw RangeError("尝试次数必须是正整数");
    for (let attempt = 1; ; attempt++) {
      try { return await fn(); }
      catch (error) {
        if (attempt >= attempts) throw error;
        await onRetry?.(error, attempt);
        await sleep(baseDelay * factor ** (attempt - 1));
      }
    }
  }
  return { randomBetween, sleep, pick, maybe, chunk, retry };
}

function human({ sleep, randomBetween, maybe }) {
  async function humanScroll(page, { distance, direction = "down", stepMin = 50, stepMax = 150,
    delayMin = 30, delayMax = 80, backstepChance = 0, backstepRatio = 0.3 }) {
    if (!Number.isFinite(distance) || stepMin < 1 || stepMax < stepMin) throw Error("无效的滚动距离");
    const sign = direction === "up" ? -1 : 1;
    while (distance > 0) {
      const step = Math.min(distance, randomBetween(stepMin, stepMax));
      await page.mouse.wheel(0, sign * step);
      await sleep(delayMin, delayMax);
      if (maybe(backstepChance)) {
        const backstep = Math.round(step * backstepRatio);
        await page.mouse.wheel(0, -sign * backstep);
        await page.mouse.wheel(0, sign * backstep);
      }
      distance -= step;
    }
  }
  async function humanType(page, text, { minDelay = 60, maxDelay = 180 } = {}) {
    for (const character of text) {
      await page.keyboard.type(character);
      await sleep(minDelay, maxDelay);
    }
  }
  return { humanScroll, humanType };
}

function storage({ call }) {
  class Table {
    #name;
    constructor(name) {
      if (typeof name !== "string" || !name.trim()) throw Error("表格名称不能为空");
      this.#name = name;
    }
    get name() { return this.#name; }
    append(rows) { return call("table", [this.#name, "append", rows]); }
    all() { return call("table", [this.#name, "all"]); }
    async find(predicate) { return (await this.all()).find(predicate); }
    clear() { return call("table", [this.#name, "clear"]); }
  }
  class KV {
    #name;
    constructor(name) {
      if (typeof name !== "string" || !name.trim()) throw Error("存储名称不能为空");
      this.#name = name;
    }
    get name() { return this.#name; }
    get(key) { return call("kv", [this.#name, "get", key]); }
    set(key, value) { return call("kv", [this.#name, "set", key, JSON.parse(JSON.stringify(value))]); }
    has(key) { return call("kv", [this.#name, "has", key]); }
    delete(key) { return call("kv", [this.#name, "delete", key]); }
    keys() { return call("kv", [this.#name, "keys"]); }
    all() { return call("kv", [this.#name, "all"]); }
    clear() { return call("kv", [this.#name, "clear"]); }
  }
  return { Table, KV };
}

function debug({ call }) {
  const name = value => {
    if (typeof value !== "string" || !value || /[\\/]/.test(value) || value.includes(".."))
      throw Error("无效的调试文件名称");
    return "html-snapshots/" + value;
  };
  const enabled = () => globalThis.process?.env.SANDBOX_DEBUG === "1";
  async function writeDebugFile(filename, content) {
    if (enabled()) await call("file", ["writeFile", [name(filename), content]]);
  }
  async function capturePageState(page, label) {
    if (enabled()) await writeDebugFile(label + ".html", await page.content());
  }
  return { getPageHtml: page => page.content(), capturePageSnapshot: (page, options) => capturePageState(page, options?.label),
    capturePageState, writeDebugFile };
}

function fsModule({ call }) {
  const synchronous = Object.fromEntries(["readFile", "writeFile", "appendFile", "mkdir", "readdir", "exists"]
    .map(method => [method + "Sync", (...args) => call("file", [method, args], true)]));
  const promises = Object.fromEntries(["readFile", "writeFile", "appendFile", "mkdir", "readdir"]
    .map(method => [method, (...args) => call("file", [method, args])]));
  const callbacks = Object.fromEntries(Object.entries(promises).map(([method, fn]) => [method, (...args) => {
    const callback = args.pop();
    if (typeof callback !== "function") throw new TypeError("文件操作需要回调函数");
    fn(...args).then(value => callback(null, value), callback);
  }]));
  return { ...synchronous, ...callbacks, promises };
}

function pathModule({ call }) {
  const fn = method => (...args) => call("path", [method, args], true);
  const entries = ["join", "resolve", "normalize", "dirname", "basename", "extname", "isAbsolute", "relative", "parse", "format"]
    .map(method => [method, fn(method)]);
  const posix = Object.fromEntries([...entries, ["sep", "/"], ["delimiter", ":"]]);
  return { ...posix, posix };
}

function llm({ call, validate }) {
  const options = value => {
    value?.signal?.throwIfAborted?.();
    return value && { temperature: value.temperature, maxTokens: value.maxTokens };
  };
  return {
    ask: (prompt, opts) => call("llm", [prompt, undefined, options(opts)]),
    async json(prompt, schema, opts) {
      const json = JSON.stringify(schema);
      validate(json);
      const result = await call("llm", [prompt, schema, options(opts)]);
      validate(json, JSON.stringify(result));
      return result;
    },
  };
}

function downloads({ call }) {
  const saveResource = async (page, url, filename, options = {}) => {
    const response = await page.request.get(url, { timeout: options.timeoutMs });
    try {
      if (!response.ok()) throw Error("资源下载失败，HTTP " + response.status());
      const bytes = await response.body();
      if (options.maxBytes && bytes.length > options.maxBytes) throw Error("下载内容超过大小限制");
      filename ||= String(url).split("?")[0].split("/").at(-1);
      await call("file", ["writeFile", [filename, bytes]]);
      return { filename, path: filename, size: bytes.length, bytes: bytes.length, url };
    } finally { await response.dispose(); }
  };
  async function saveDownload(page, trigger, options = {}) {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: options.timeoutMs }), Promise.resolve().then(trigger)]);
    const filename = options.filename ?? download.suggestedFilename();
    await download.saveAs(filename, { maxBytes: options.maxBytes });
    const bytes = await call("file", ["readFile", [filename]]);
    return { filename, path: filename, size: bytes.length, bytes: bytes.length, url: download.url() };
  }
  async function saveResources(page, entries, options) {
    const results = [];
    for (const entry of entries)
      results.push(await saveResource(page, typeof entry === "string" ? entry : entry.url, entry.filename, options));
    return results;
  }
  return { saveResource, saveDownload, saveResources };
}

function urlModule({ call }) {
  const encode = text => encodeURIComponent(text).replace(/%20/g, "+").replace(/[!~'()]/g,
    char => "%" + char.charCodeAt(0).toString(16).toUpperCase());
  const decode = text => {
    const value = text.replace(/\+/g, " ");
    try { return decodeURIComponent(value); } catch (_) { return value; }
  };
  class URLSearchParams {
    #pairs;
    #changed;
    constructor(value = "", changed) {
      this.#changed = changed;
      if (typeof value === "string") {
        this.#pairs = value.replace(/^\?/, "").split("&").filter(Boolean).map(part => {
          const index = part.indexOf("=");
          return index < 0 ? [decode(part), ""] : [decode(part.slice(0, index)), decode(part.slice(index + 1))];
        });
      } else if (Symbol.iterator in Object(value)) {
        this.#pairs = Array.from(value, pair => {
          const values = Array.from(pair, String);
          if (values.length !== 2) throw TypeError("URL 查询参数需要名称和值");
          return values;
        });
      } else this.#pairs = Object.entries(value).map(([name, value]) => [name, String(value)]);
    }
    get size() { return this.#pairs.length; }
    append(name, value) {
      this.#pairs.push([String(name), String(value)]);
      this.#changed?.();
    }
    delete(name, value) {
      this.#pairs = this.#pairs.filter(([key, content]) => key !== String(name) ||
        (value !== undefined && content !== String(value)));
      this.#changed?.();
    }
    getAll(name) { return this.#pairs.filter(([key]) => key === String(name)).map(([, v]) => v); }
    get(name) { return this.getAll(name)[0] ?? null; }
    has(name, value) {
      const found = this.getAll(name);
      return value === undefined ? found.length !== 0 : found.includes(String(value));
    }
    set(name, value) {
      const key = String(name);
      const first = this.#pairs.findIndex(([item]) => item === key);
      if (first === -1) return this.append(key, value);
      this.#pairs[first][1] = String(value);
      this.#pairs = this.#pairs.filter(([item], index) => item !== key || index === first);
      this.#changed?.();
    }
    sort() {
      this.#pairs.sort(([a], [b]) => a < b ? -1 : Number(a !== b));
      this.#changed?.();
    }
    *entries() { for (const entry of this.#pairs) yield [...entry]; }
    *keys() { for (const [name] of this.#pairs) yield name; }
    *values() { for (const [, value] of this.#pairs) yield value; }
    [Symbol.iterator]() { return this.entries(); }
    forEach(fn, receiver) {
      for (const [name, value] of this.#pairs) fn.call(receiver, value, name, this);
    }
    toString() { return this.#pairs.map(([name, value]) => encode(name) + "=" + encode(value)).join("&"); }
  }
  const state = new WeakMap();
  class URL {
    constructor(input, base) {
      state.set(this, call("url", [String(input), base === undefined ? undefined : String(base)], true));
    }
    toString() { return this.href; }
    toJSON() { return this.href; }
    static canParse(input, base) { try { new URL(input, base); return true; } catch (_) { return false; } }
    static parse(input, base) { try { return new URL(input, base); } catch (_) { return null; } }
  }
  Object.defineProperty(URL.prototype, "searchParams", { get() {
    const params = new URLSearchParams(state.get(this).search, () => { this.search = params.toString(); });
    return params;
  } });
  for (const key of ["href", "origin", "protocol", "username", "password", "host", "hostname", "port", "pathname", "search", "hash"]) {
    Object.defineProperty(URL.prototype, key, {
      get() { return state.get(this)[key]; },
      ...(key !== "origin" && { set(value) {
        state.set(this, call("url", [this.href, undefined, key, String(value)], true));
      } }),
    });
  }
  return { URL, URLSearchParams };
}

function cryptoModule({ call }) {
  const randomBytes = size => call("crypto", ["randomBytes", [size]], true);
  const randomUUID = () => call("crypto", ["randomUUID", []], true);
  function hash(method, algorithm, key) {
    const parts = [];
    let ended = false;
    return {
      update(value, encoding) {
        if (ended) throw Error("摘要已完成");
        parts.push([value, encoding]);
        return this;
      },
      digest(encoding) {
        if (ended) throw Error("摘要已完成");
        ended = true;
        return call("crypto", [method, [algorithm, key, parts, encoding]], true);
      },
    };
  }
  return { randomBytes, randomUUID, createHash: algorithm => hash("hash", algorithm),
    createHmac: (algorithm, key) => hash("hmac", algorithm, key) };
}

function build(factory, names, dependency, options = {}) {
  return (dependency ? 'import * as dependency from ' + JSON.stringify(dependency) + ';\n' : '') +
    'const implementation = (' + factory.toString() + ')(' + (dependency ? 'dependency' : '') + ');\n' +
    names.map(name => 'export const ' + name + ' = implementation.' + name + ';').join('\n') +
    (options.default ? '\nexport default implementation;' : '');
}

const internal = "@openbrowser/sandbox/internal";
const modules = {
  [internal]: "const definitions = " + JSON.stringify(definitions) + ";\n" +
    "const implementation = (" + bridge.toString() + ")(globalThis.__scriptHost);\n" +
    "export const { call, Bytes, dispatch } = implementation; export const validate = globalThis.__scriptValidate;",
  "@openbrowser/sandbox/core": build(core, ["chromium", "firefox", "defineMetadata", "defineParams", "browser"], internal),
  "@openbrowser/sandbox/utils": build(utilities, ["sleep", "randomBetween", "pick", "maybe", "chunk", "retry"]),
  "@openbrowser/sandbox/human": build(human, ["humanScroll", "humanType"], "@openbrowser/sandbox/utils"),
  "@openbrowser/sandbox/storage": build(storage, ["Table", "KV"], internal),
  "@openbrowser/sandbox/llm": build(llm, ["ask", "json"], internal),
  "@openbrowser/sandbox/download": build(downloads, ["saveResource", "saveResources", "saveDownload"], internal),
  "@openbrowser/sandbox/debug": build(debug, ["getPageHtml", "capturePageSnapshot", "capturePageState", "writeDebugFile"], internal),
  "@openbrowser/sandbox/table": 'export { Table } from "@openbrowser/sandbox/storage";',
  "@openbrowser/sandbox/kv": 'export { KV } from "@openbrowser/sandbox/storage";',
  "@openbrowser/sandbox": 'export { browser, defineMetadata, defineParams } from "@openbrowser/sandbox/core";',
  "@roxybrowser/sandbox": 'export { browser, defineMetadata, defineParams } from "@openbrowser/sandbox/core";',
  "playwright": 'export { chromium, firefox } from "@openbrowser/sandbox/core";',
  "node:url": build(urlModule, ["URL", "URLSearchParams"], internal, { default: true }),
  "node:path": build(pathModule, ["join", "resolve", "normalize", "dirname", "basename", "extname", "isAbsolute", "relative",
    "parse", "format", "posix", "sep", "delimiter"], internal, { default: true }),
  "node:crypto": build(cryptoModule, ["randomBytes", "randomUUID", "createHash", "createHmac"], internal, { default: true }),
  "node:buffer": 'import { Bytes as Buffer } from "@openbrowser/sandbox/internal"; export { Buffer }; export default { Buffer };',
  "node:fs": build(fsModule, ["readFileSync", "writeFileSync", "appendFileSync", "mkdirSync", "readdirSync", "existsSync",
    "readFile", "writeFile", "appendFile", "mkdir", "readdir", "promises"], internal, { default: true }),
  "node:fs/promises": 'import { promises } from "node:fs"; export const { readFile, writeFile, appendFile, mkdir, readdir } = promises; export default promises;',
};

function scriptModule(name, legacy) {
  const key = name.replace(/^@roxybrowser\/sandbox\//, "@openbrowser/sandbox/")
    .replace(/^(?:path|crypto|buffer|fs(?:\/promises)?|url)$/, "node:$&");
  if ((!legacy && key.startsWith("node:fs")) || !Object.hasOwn(modules, key))
    return { error: Error("本地脚本不支持模块 " + name.slice(0, 180)) };
  return modules[key];
}

module.exports = { scriptModule };
