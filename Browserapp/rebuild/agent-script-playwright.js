"use strict";

const { MAX_FILE } = require("./agent-script-storage");

// The first list is synchronous, the second asynchronous, the third events,
// and the fourth properties. Only these methods cross the Worker boundary.
const api = {
  Browser: ["contexts isConnected version", "newContext newPage close", "disconnected"],
  BrowserContext: [
    "pages browser", "newPage close cookies addCookies clearCookies storageState grantPermissions clearPermissions " +
      "setGeolocation setExtraHTTPHeaders setOffline", "page close request response requestfailed requestfinished", "request",
  ],
  Page: [
    "locator frameLocator getByRole getByText getByLabel getByPlaceholder getByAltText getByTitle getByTestId " +
      "url isClosed context mainFrame frames frame viewportSize",
    "$ $$ $eval $$eval goto reload goBack goForward close bringToFront content setContent title evaluate evaluateHandle opener " +
      "waitForURL waitForLoadState waitForSelector waitForTimeout waitForFunction screenshot pdf setViewportSize " +
      "click dblclick tap fill type press hover focus check uncheck selectOption setInputFiles " +
      "textContent innerText innerHTML inputValue getAttribute isVisible isHidden isEnabled isDisabled isChecked isEditable " +
      "addScriptTag addStyleTag setExtraHTTPHeaders emulateMedia",
    "response request requestfinished requestfailed download popup console dialog pageerror load domcontentloaded close frameattached " +
      "framenavigated framedetached", "keyboard mouse touchscreen request",
  ],
  Frame: [
    "locator frameLocator getByRole getByText getByLabel getByPlaceholder getByAltText getByTitle getByTestId " +
      "url name parentFrame childFrames page isDetached",
    "$ $$ $eval $$eval goto content setContent title evaluate evaluateHandle waitForURL waitForLoadState waitForSelector " +
      "waitForTimeout waitForFunction click dblclick fill type press hover focus check uncheck selectOption setInputFiles " +
      "textContent innerText innerHTML getAttribute isVisible isHidden isEnabled isDisabled isChecked isEditable " +
      "addScriptTag addStyleTag",
  ],
  FrameLocator: [
    "locator frameLocator getByRole getByText getByLabel getByPlaceholder getByAltText getByTitle getByTestId " +
      "first last nth owner",
  ],
  Locator: [
    "locator frameLocator getByRole getByText getByLabel getByPlaceholder getByAltText getByTitle getByTestId " +
      "first last nth filter and or page contentFrame",
    "all allInnerTexts allTextContents count evaluate evaluateAll evaluateHandle elementHandle elementHandles " +
      "waitFor click dblclick tap hover focus blur fill clear type press pressSequentially check uncheck setChecked " +
      "selectText selectOption setInputFiles scrollIntoViewIfNeeded screenshot boundingBox getAttribute textContent " +
      "innerText innerHTML inputValue isVisible isHidden isEnabled isDisabled isChecked isEditable dispatchEvent " +
      "dragTo ariaSnapshot describe",
  ],
  ElementHandle: [
    "", "$ $$ $eval $$eval evaluate evaluateHandle getProperty getProperties jsonValue dispose " +
      "ownerFrame contentFrame textContent innerText innerHTML getAttribute inputValue isVisible isHidden isEnabled " +
      "isDisabled isChecked isEditable click dblclick tap hover focus fill type press check uncheck setChecked selectText " +
      "selectOption setInputFiles scrollIntoViewIfNeeded screenshot boundingBox waitForSelector waitForElementState dispatchEvent",
  ],
  JSHandle: ["asElement", "evaluate evaluateHandle getProperty getProperties jsonValue dispose"],
  Keyboard: ["", "down up press insertText type"],
  Mouse: ["", "move down up click dblclick wheel"],
  Touchscreen: ["", "tap"],
  Request: [
    "url resourceType method postData postDataJSON headers isNavigationRequest failure frame redirectedFrom redirectedTo",
    "allHeaders headersArray headerValue response sizes",
  ],
  Response: [
    "url status statusText ok headers request frame fromServiceWorker",
    "allHeaders headersArray headerValue headerValues body text json finished serverAddr securityDetails",
  ],
  APIRequestContext: ["", "get post put patch delete head fetch storageState dispose"],
  APIResponse: ["url status statusText ok headers headersArray", "body text json dispose"],
  Download: ["url suggestedFilename page", "saveAs cancel failure"],
  Dialog: ["type message defaultValue page", "accept dismiss"],
  ConsoleMessage: ["type text args location page"],
};

const expressionIndices = {
  $eval: 1, $$eval: 1, evaluate: 0, evaluateAll: 0, evaluateHandle: 0, waitForFunction: 0,
};
const props = (type, offset) => (api[type][offset] || "").split(" ").filter(Boolean);
const navigate = new Set(["goto"]);
const request = new Set(["get", "post", "put", "patch", "delete", "head", "fetch"]);
const browserSchemes = new Set(["http:", "https:", "about:", "data:", "blob:"]);

function checkUrl(value, schemes) {
  if (typeof value !== "string") throw Error("脚本页面 URL 无效");
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !schemes.has(new URL(value).protocol))
    throw Error("脚本页面 URL 协议无效");
}

function checkOptions(options, forbidden) {
  if (options == null) return;
  if (typeof options !== "object" || Array.isArray(options)) throw Error("Playwright 选项无效");
  if (forbidden.some(key => Object.hasOwn(options, key))) throw Error("Playwright 选项包含未授权的宿主资源");
}

function createScriptPlaywright(engine, windowId, storage, signal, emit) {
  const handles = new Map();
  const ids = new WeakMap();
  const subscriptions = new Map();
  const ownedContexts = new Set();
  let browser, connecting, detachFirefox, nextId = 0;

  function encode(value, depth = 0) {
    if (depth > 40) throw Error("脚本返回值嵌套过深");
    if (value === undefined) return { $type: "undefined" };
    if (typeof value === "bigint" || (typeof value === "number" && !Number.isFinite(value)))
      return { $type: typeof value, value: String(value) };
    if (value == null || typeof value !== "object") return value;
    if (Buffer.isBuffer(value) || ArrayBuffer.isView(value)) {
      if (value.byteLength > MAX_FILE) throw Error("脚本字节结果超过 10 MiB");
      return { $type: "bytes", value: Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString("base64") };
    }
    if (value instanceof Error) return { $type: "error", value: value.message };
    if (value instanceof Date) return { $type: "date", value: value.toISOString() };
    if (value instanceof RegExp) return { $type: "regexp", source: value.source, flags: value.flags };
    if (Array.isArray(value)) return value.map(item => encode(item, depth + 1));
    if (value instanceof Map) return { $type: "map", value: encode([...value], depth + 1) };
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null)
      return { $type: "object", value: Object.fromEntries(Object.entries(value).map(([key, item]) =>
        [key, encode(item, depth + 1)])) };
    const type = Object.hasOwn(api, value._type) ? value._type : prototype.constructor?.name.replace(/^_|\d+$/g, "");
    if (Object.hasOwn(api, type)) {
      let id = ids.get(value);
      if (id === undefined) {
        if (handles.size >= 2048) throw Error("脚本 Playwright 对象过多");
        ids.set(value, id = ++nextId);
        handles.set(id, { type, value });
      }
      return { $type: "handle", id, name: type };
    }
    throw Error("不支持的 Playwright 结果类型：" + type);
  }

  function decode(value, depth = 0) {
    if (depth > 40) throw Error("脚本参数嵌套过深");
    if (value == null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(item => decode(item, depth + 1));
    switch (value.$type) {
      case "handle": return handle(value.id).value;
      case "undefined": return undefined;
      case "regexp": return new RegExp(value.source, value.flags);
      case "date": return new Date(value.value);
      case "bigint": return BigInt(value.value);
      case "number": return Number(value.value);
      case "function": {
        // Playwright serializes this as a browser expression. The host never
        // evaluates sandbox source or gives it a callable Node function.
        if (typeof value.source !== "string") throw Error("页面表达式无效");
        const browserExpression = () => { throw Error("脚本表达式只能在页面中执行"); };
        return Object.defineProperty(browserExpression, "toString", { value: () => value.source });
      }
      case "bytes": return Buffer.from(value.value, "base64");
      case "object": return Object.fromEntries(Object.entries(value.value).map(([key, item]) => [key, decode(item, depth + 1)]));
      default: throw Error("不支持的脚本参数类型");
    }
  }

  function handle(id) {
    const target = handles.get(id);
    if (!target) throw Error("无效的任务 Playwright 对象");
    return target;
  }

  async function connect([kind, endpoint]) {
    const running = engine?.running?.get(windowId);
    if (!["chromium", "firefox"].includes(kind) || !["openbrowser:window", "openbrowser:cdp"].includes(endpoint))
      throw Error("脚本只能连接任务指定的本地窗口");
    const firefox = running?.engine === "firefox";
    if (!running || (kind === "firefox") !== firefox || (!firefox && !running.port) ||
        (firefox && !running.bidiConnection))
      throw Error(firefox ? "当前 Firefox 内核没有 Playwright 会话" : "此操作需要已启动的 Chrome CDP 会话");
    if (browser) return browser;
    if (!connecting) {
      const promise = firefox ? require("./agent-script-firefox").connectFirefox(running.bidiConnection, signal)
        .then(connected => { detachFirefox = connected.detach; return connected.browser; }) :
        require("playwright").chromium.connectOverCDP("http://127.0.0.1:" + running.port, { timeout: 5000 });
      connecting = promise.then(value => (browser = value)).finally(() => { connecting = null; });
    }
    const connected = await connecting;
    signal.throwIfAborted();
    return connected;
  }

  async function close() {
    const client = browser || await connecting?.catch(() => undefined);
    if (!client || browser !== client) return;
    browser = null;
    for (const { target, event, listener } of subscriptions.values()) target.off(event, listener);
    subscriptions.clear();
    const contexts = [...ownedContexts];
    ownedContexts.clear();
    await Promise.allSettled(contexts.map(context => context.close()));
    try { await client.close(); }
    finally { await detachFirefox?.(); detachFirefox = undefined; }
  }

  function synchronous([id, name, args]) {
    signal.throwIfAborted();
    const { type, value } = handle(id);
    if (props(type, 3).includes(name)) return value[name];
    if (!props(type, 0).includes(name)) throw Error("不支持的 Playwright 方法：" + type + "." + name);
    return value[name](...args);
  }

  function subscribe([id, event, key]) {
    signal.throwIfAborted();
    const { type, value: target } = handle(id);
    if (!Number.isSafeInteger(key) || subscriptions.has(key) || subscriptions.size >= 48 ||
        !props(type, 2).includes(event))
      throw Error("不支持的 Playwright 事件：" + event);
    const listener = value => emit(key, value);
    target.on(event, listener);
    subscriptions.set(key, { target, event, listener });
  }

  function unsubscribe([key]) {
    const item = subscriptions.get(key);
    if (!item) return;
    item.target.off(item.event, item.listener);
    subscriptions.delete(key);
  }

  async function method([id, name, args]) {
    signal.throwIfAborted();
    const { type, value: target } = handle(id);
    if (!props(type, 1).includes(name)) throw Error("不支持的 Playwright 方法：" + type + "." + name);
    if (Object.hasOwn(expressionIndices, name)) {
      if (!["string", "function"].includes(typeof args[expressionIndices[name]]))
        throw Error("Playwright 页面表达式必须为函数或文本");
      checkOptions(args[expressionIndices[name] + 2], ["exposeFunctions"]);
    }
    if (navigate.has(name)) checkUrl(args[0], browserSchemes);
    if (name === "close" && type === "Browser") return close();
    if (name === "close" && type === "BrowserContext" && !ownedContexts.has(target))
      throw Error("不能关闭用户窗口的原有浏览器上下文");
    if (type === "Browser" && ["newPage", "newContext"].includes(name)) {
      const options = args[0];
      checkOptions(options, ["recordHar", "recordVideo", "proxy", "clientCertificates"]);
      if (typeof options?.storageState === "string") throw Error("不能直接读取宿主浏览器状态文件");
      if (options?.baseURL !== undefined) checkUrl(options.baseURL, new Set(["http:", "https:"]));
    }
    if (type === "APIRequestContext" && request.has(name)) {
      checkUrl(typeof args[0] === "string" ? args[0] : args[0]?.url(), new Set(["http:", "https:"]));
      checkOptions(args[1], ["multipart"]);
    }
    if (name === "storageState") checkOptions(args[0], ["path"]);
    if (name === "setInputFiles") {
      const index = ["Page", "Frame"].includes(type) ? 1 : 0;
      const input = list => typeof list === "string" ?
        { name: list.split("/").at(-1), mimeType: "application/octet-stream", buffer: storage.read(list) } : list;
      args[index] = Array.isArray(args[index]) ? args[index].map(input) : input(args[index]);
    }
    if (name === "addScriptTag" || name === "addStyleTag") {
      const { path: filename, ...options } = args[0] || {};
      args[0] = filename ? { ...options, content: storage.read(filename).toString("utf8") } : options;
    }
    if (type === "Download" && name === "saveAs") {
      const limit = args[1]?.maxBytes ?? MAX_FILE;
      if (!Number.isSafeInteger(limit) || limit <= 0) throw Error("无效的下载大小限制");
      const stream = await target.createReadStream();
      let size = 0;
      const chunks = [];
      for await (const chunk of stream) {
        signal.throwIfAborted();
        size += chunk.length;
        if (size > Math.min(limit, MAX_FILE)) throw Error("下载内容超过大小限制");
        chunks.push(chunk);
      }
      storage.store(args[0], Buffer.concat(chunks, size));
      return;
    }
    const fileMethod = name === "screenshot" || name === "pdf";
    const destination = fileMethod ? args[0]?.path : undefined;
    if (destination !== undefined) {
      const { path: _path, ...options } = args[0];
      args[0] = options;
    }
    const result = await target[name](...args);
    if (type === "Browser" && name === "newContext") ownedContexts.add(result);
    if (type === "Browser" && name === "newPage") ownedContexts.add(result.context());
    if (name === "close" && type === "BrowserContext") ownedContexts.delete(target);
    if (destination !== undefined) storage.store(destination, result);
    return result;
  }

  function cancel() {
    // On abort close the CDP client immediately to cancel auto-wait actions.
    // Graceful context cleanup is available only while the connection is alive.
    for (const { target, event, listener } of subscriptions.values()) target.off(event, listener);
    subscriptions.clear();
    if (detachFirefox) return detachFirefox();
    if (browser) return browser.close();
    return connecting?.then(client => detachFirefox ? detachFirefox() : client.close(), () => {});
  }

  return { connect, method, synchronous, subscribe, unsubscribe, close, cancel, encode, decode };
}

module.exports = { createScriptPlaywright, api };
