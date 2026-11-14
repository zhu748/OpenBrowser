"use strict";
const fs = require("node:fs/promises"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { setTimeout: delay } = require("node:timers/promises"),
  cdp = require("../cdp"),
  credentials = require("../credential-crypto");
const terminal = new Set(["completed", "failed", "cancelled", "interrupted"]);
function range(value, fallback, min, max, label) {
  const pair = value ?? fallback;
  if (
    !Array.isArray(pair) ||
    pair.length !== 2 ||
    !pair.every((v) => Number.isSafeInteger(v) && v >= min && v <= max) ||
    pair[0] > pair[1]
  )
    throw Error(label + "范围无效");
  return pair;
}
function options(payload) {
  if (
    !Array.isArray(payload.dirIds) ||
    payload.dirIds.length < 1 ||
    payload.dirIds.length > 200 ||
    payload.dirIds.some(
      (id) => typeof id !== "string" || !id || id.length > 200,
    ) ||
    new Set(payload.dirIds).size !== payload.dirIds.length
  )
    throw Error("请选择 1–200 个不同窗口");
  const p = payload.robotParams ?? {},
    custom = payload.customParams ?? {};
  if (
    !Array.isArray(p.cookieRobotUrls) ||
    !p.cookieRobotUrls.length ||
    p.cookieRobotUrls.length > 100
  )
    throw Error("请填写 1–100 个目标网址");
  const urls = p.cookieRobotUrls.map((value) => {
    if (typeof value !== "string" || value.length > 4096)
      throw Error("目标网址无效");
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw Error("目标网址只支持不含账号密码的 HTTP/HTTPS 地址");
    return url.href;
  });
  for (const key of Object.keys(custom))
    if (
      ![
        "$keepOriginOpenUrl",
        "openWorkbench",
        "forbidImage",
        "forbidMedia",
        "startupParam",
      ].includes(key)
    )
      throw Error("不支持的机器人启动参数: " + key);
  for (const key of ["forbidImage", "forbidMedia"])
    if (custom[key] !== undefined && typeof custom[key] !== "boolean")
      throw Error("无效资源开关");
  if (custom.startupParam && custom.startupParam !== "--headless=new")
    throw Error("不支持的临时启动参数");
  if (p.closeProfile !== undefined && typeof p.closeProfile !== "boolean")
    throw Error("无效关闭窗口设置");
  const pageLoadTimeout = p.pageLoadTimeout ?? 60000;
  if (
    !Number.isSafeInteger(pageLoadTimeout) ||
    pageLoadTimeout < 1000 ||
    pageLoadTimeout > 120000
  )
    throw Error("页面加载超时应为 1000–120000 ms");
  return {
    urls,
    scrollRange: range(p.scrollRange, [100, 500], 100, 50000, "滚动距离"),
    delayRange: range(p.delayRange, [0, 500], 0, 120000, "停留时间"),
    pageLoadTimeout,
    closeProfile: p.closeProfile === true,
    headless: custom.startupParam === "--headless=new",
    blockImages: custom.forbidImage === false,
    blockMedia: custom.forbidMedia === false,
  };
}
// This is the original scroll-target choice: document, or the largest named
// application container. All interval/timeout handles are cleared on completion.
function scrollPage(distance) {
  return new Promise((resolve) => {
    const root = document.scrollingElement || document.documentElement;
    const docMax = () =>
      Math.max(0, root.scrollHeight, document.body?.scrollHeight || 0) -
      innerHeight;
    let container = null,
      largest = 0;
    for (const selector of [
      "main",
      '[role="main"]',
      "ytd-app",
      "#content",
      "#app",
      "#page",
    ]) {
      const element = document.querySelector(selector);
      if (
        element instanceof HTMLElement &&
        element.scrollHeight - element.clientHeight > largest
      ) {
        container = element;
        largest = element.scrollHeight - element.clientHeight;
      }
    }
    if (largest <= docMax()) container = null;
    const max = () =>
      Math.max(
        0,
        container ? container.scrollHeight - container.clientHeight : docMax(),
      );
    const position = () => (container ? container.scrollTop : scrollY);
    const start = position();
    if (max() <= 0)
      return resolve({
        notScrollable: true,
        reachedBottom: false,
        position: start,
      });
    if (start >= max() - 10)
      return resolve({ reachedBottom: true, position: start });
    if (container) container.scrollTop += distance;
    else scrollBy({ top: distance, behavior: "smooth" });
    let previous = start,
      stable = 0,
      timer,
      timeout;
    const finish = () => {
      clearInterval(timer);
      clearTimeout(timeout);
      resolve({
        reachedBottom: position() >= max() - 10,
        position: position(),
        maximum: max(),
      });
    };
    timer = setInterval(() => {
      const current = position();
      stable = Math.abs(current - previous) < 1 ? stable + 1 : 0;
      previous = current;
      if (stable >= 3) finish();
    }, 100);
    timeout = setTimeout(finish, 2000);
  });
}
function waitImages() {
  return new Promise((resolve) => {
    const images = Array.from(document.images);
    if (!images.length) return resolve(true);
    const disposers = [];
    let completed = 0,
      timer,
      settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      for (const off of disposers) off();
      resolve(true);
    };
    const mark = () => {
      if (++completed >= Math.ceil(images.length * 0.3)) finish();
    };
    timer = setTimeout(finish, 3000);
    for (const image of images) {
      if (settled) break;
      if (image.complete) mark();
      else {
        let counted = false;
        const done = () => {
          if (!counted) {
            counted = true;
            mark();
          }
        };
        image.addEventListener("load", done);
        image.addEventListener("error", done);
        disposers.push(() => {
          image.removeEventListener("load", done);
          image.removeEventListener("error", done);
        });
      }
    }
  });
}
const random = ([a, b]) => (a === b ? a : crypto.randomInt(a, b + 1));
class CookieRobot {
  constructor({
    engine,
    root,
    notify,
    isSynchronizing = () => false,
    pageBudgetMs = 300000,
  }) {
    Object.assign(this, {
      engine,
      root: path.join(root, "cookie-robot"),
      notify,
      isSynchronizing,
      pageBudgetMs,
    });
    this.active = new Map();
    this.queue = [];
    this.workers = 0;
    this.writes = Promise.resolve();
    this.failures = [];
  }
  async load() {
    if (!this.loading)
      this.loading = (async () => {
        await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
        try {
          this.records = credentials.decryptCredentialJson(
            await fs.readFile(path.join(this.root, "jobs.enc")),
          );
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
          this.records = [];
        }
        if (!Array.isArray(this.records))
          throw Error("Cookie Robot 记录格式无效");
        for (const row of this.records)
          if (!terminal.has(row.status)) {
            row.status = "interrupted";
            row.error = "应用退出时任务未完成";
          }
      })();
    return this.loading;
  }
  save() {
    const bytes = credentials.encryptCredentialJson(this.records);
    const run = this.writes.then(async () => {
      const temp = path.join(this.root, crypto.randomUUID() + ".tmp");
      try {
        await fs.writeFile(temp, bytes, { mode: 0o600 });
        await fs.rename(temp, path.join(this.root, "jobs.enc"));
      } finally {
        await fs.rm(temp, { force: true });
      }
    });
    this.writes = run.catch(() => undefined);
    return run;
  }
  async request(method, payload = {}) {
    await this.load();
    if (method === "list") return structuredClone(this.records);
    if (this.closing) throw Error("应用正在退出");
    if (method === "cancel") {
      const task = this.active.get(payload.id);
      if (!task) throw Error("任务已经结束或不存在");
      task.abort.abort();
      task.row.status = "cancelling";
      await this.save();
      const running = this.engine.running.get(task.row.profileId);
      if (
        task.ownsLaunch &&
        ((task.item && task.item === running) ||
          (task.launch &&
            task.launch === this.engine.starting.get(task.row.profileId)))
      )
        await this.engine.stop(task.row.profileId);
      return { id: task.row.id, status: "cancelling" };
    }
    if (method !== "start") throw Error("未知 Cookie Robot 操作");
    const params = options(payload);
    if (this.active.size + payload.dirIds.length > 200)
      throw Error("机器人队列最多 200 个窗口");
    // Validate every row before reserving work or starting the first browser.
    for (const id of payload.dirIds) {
      const profile = this.engine.profileForEdit(id).profile;
      if (profile.trashed || this.isSynchronizing(id))
        throw Error("窗口在回收站或正在同步，请先停止同步");
      if ([...this.active.values()].some((task) => task.row.profileId === id))
        throw Error("该窗口已有 Cookie Robot 任务");
      if (this.engine.starting.has(id) || this.engine.stopping.has(id))
        throw Error("窗口正在启动或停止");
      if (
        (params.headless || params.blockImages) &&
        this.engine.running.has(id)
      )
        throw Error("请先停止窗口，再应用无头模式或禁用图片");
    }
    const tasks = payload.dirIds.map((profileId) => ({
      row: {
        id: crypto.randomUUID(),
        profileId,
        status: "pending",
        createdAt: new Date().toISOString(),
        pages: [],
        options: params,
      },
      abort: new AbortController(),
    }));
    for (const task of tasks) this.active.set(task.row.id, task);
    this.records = [
      ...this.records.filter((row) => !terminal.has(row.status)).slice(-200),
      ...this.records.filter((row) => terminal.has(row.status)).slice(-300),
      ...tasks.map((task) => task.row),
    ];
    try {
      await this.save();
    } catch (error) {
      const ids = new Set(tasks.map((task) => task.row.id));
      for (const id of ids) this.active.delete(id);
      this.records = this.records.filter((row) => !ids.has(row.id));
      throw error;
    }
    this.queue.push(...tasks);
    this.pump();
    return { taskIds: tasks.map((task) => task.row.id), status: "pending" };
  }
  pump() {
    while (this.workers < 4 && this.queue.length) {
      const task = this.queue.shift();
      this.workers++;
      task.done = this.run(task)
        .catch((error) => {
          task.persistenceError = error;
          this.failures.push(error);
          this.engine.emit({
            channel: "local:error",
            payload: "Cookie Robot 记录保存失败: " + error.message,
          });
        })
        .finally(() => {
          this.active.delete(task.row.id);
          this.workers--;
          this.pump();
        });
    }
  }
  alive(task) {
    task.abort.signal.throwIfAborted();
    if (this.closing)
      throw Object.assign(Error("应用正在退出"), { name: "AbortError" });
    if (
      task.item &&
      (this.engine.running.get(task.row.profileId) !== task.item ||
        task.item.stopping ||
        task.item.cleanedUp)
    )
      throw Object.assign(Error("浏览器已关闭，任务取消"), {
        name: "AbortError",
      });
  }
  async sleep(task, ms) {
    this.alive(task);
    await delay(ms, undefined, { signal: task.abort.signal });
    this.alive(task);
  }
  async run(task) {
    const row = task.row,
      params = row.options;
    try {
      this.alive(task);
      row.status = "running";
      await this.save();
      const profile = this.engine.profileForEdit(row.profileId).profile;
      if (profile.trashed || this.isSynchronizing(profile.id))
        throw Object.assign(Error("窗口已移入回收站或正在同步"), {
          name: "AbortError",
        });
      task.ownsLaunch = !this.engine.running.has(profile.id);
      const launch = this.engine.start(profile, {
        headless: params.headless,
        blockImages: params.blockImages,
      });
      task.launch = this.engine.starting.get(profile.id);
      await launch;
      task.item = this.engine.running.get(profile.id);
      row.pid = task.item?.pid;
      this.alive(task);
      if (!task.item) throw Error("浏览器未返回运行实例");
      let first = true;
      for (const url of params.urls) {
        this.alive(task);
        const page = { url, status: "running", scrolls: 0 };
        row.pages.push(page);
        let adapter;
        try {
          adapter = await this.page(task, first);
          first = false;
          await adapter.navigate(url, params.pageLoadTimeout);
          const deadline = Date.now() + params.pageLoadTimeout;
          while (
            (await adapter.evaluate("document.readyState")) !== "complete"
          ) {
            if (Date.now() >= deadline) throw Error("页面加载超时");
            await this.sleep(task, 100);
          }
          await this.sleep(task, 500);
          await adapter.evaluate("(" + waitImages.toString() + ")()", 5000);
          const scrollDeadline = Date.now() + this.pageBudgetMs;
          let unscrollable = 0;
          for (;;) {
            this.alive(task);
            if (++page.scrolls > 2000 || Date.now() >= scrollDeadline)
              throw Error("页面持续加载，未在滚动上限内到达底部");
            const state = await adapter.evaluate(
              "(" +
                scrollPage.toString() +
                ")(" +
                random(params.scrollRange) +
                ")",
              5000,
            );
            page.position = state.position;
            if (state.notScrollable) {
              if (++unscrollable >= 3) break;
              await this.sleep(task, 2000);
            } else {
              unscrollable = 0;
              if (state.reachedBottom) break;
            }
            await this.sleep(task, random(params.delayRange));
          }
          page.status = "completed";
        } catch (error) {
          page.status = "failed";
          page.error = error.message;
          if (error.name === "AbortError") throw error;
        } finally {
          await adapter?.cleanup();
          await this.save();
        }
      }
      await this.persistCookies(task);
      row.status = row.pages.some((page) => page.status !== "completed")
        ? "failed"
        : "completed";
      if (row.status === "failed") row.error = "部分网址未完成，详见逐页记录";
    } catch (error) {
      row.status = error.name === "AbortError" ? "cancelled" : "failed";
      row.error = error.message;
    } finally {
      if (
        task.item &&
        this.engine.running.get(row.profileId) === task.item &&
        (params.closeProfile ||
          (task.ownsLaunch && (task.abort.signal.aborted || this.closing)))
      ) {
        try {
          await this.engine.stop(row.profileId);
        } catch (error) {
          row.status = "failed";
          row.error = "关闭浏览器失败: " + error.message;
        }
      }
      row.finishedAt = new Date().toISOString();
      await this.save();
      await this.notify?.(row);
      this.engine.emit({
        channel: "cookie-robot:change",
        payload: { id: row.id, status: row.status },
      });
    }
  }
  async persistCookies(task) {
    this.alive(task);
    const current = this.engine.profileForEdit(task.row.profileId);
    if (
      current.profile.advanced?.saveCookies === false ||
      current.profile.advanced?.syncCookiesOnClose === false
    )
      return;
    const item = task.item;
    const response =
      item.engine === "firefox"
        ? await item.bidiConnection.command("storage.getCookies", {}, 15000)
        : await cdp.call(
            await cdp.browserSocket(item.port),
            "Storage.getCookies",
            {},
            15000,
          );
    if (!Array.isArray(response.cookies) || response.cookies.length > 5000)
      throw Error("Cookie 快照格式或数量无效");
    const cookies = response.cookies.map((cookie) => ({
      ...cookie,
      value:
        typeof cookie.value === "string"
          ? cookie.value
          : cookie.value?.type === "base64"
            ? Buffer.from(cookie.value.value, "base64").toString("latin1")
            : cookie.value?.value,
      ...(cookie.expiry === undefined ? {} : { expires: cookie.expiry }),
    }));
    this.alive(task);
    // Re-read the revision after the protocol round trip. The native command
    // checks it atomically, so a simultaneous editor write is never overwritten.
    const latest = this.engine.profileForEdit(task.row.profileId);
    if (
      latest.profile.advanced?.saveCookies === false ||
      latest.profile.advanced?.syncCookiesOnClose === false
    )
      return;
    await this.engine.applyProfileCommands(
      [
        {
          kind: "modify",
          id: task.row.profileId,
          baseRev: latest.rev,
          profile: { ...latest.profile, cookies: JSON.stringify(cookies) },
        },
      ],
      { delta: true },
    );
  }
  async page(task, first) {
    this.alive(task);
    const item = task.item,
      params = task.row.options;
    if (item.engine === "firefox") return this.firefoxPage(task, first);
    const old = first ? await cdp.tabs(item.port) : [],
      tab = await cdp.newTab(item.port);
    let connection;
    try {
      connection = await cdp.connect(tab.webSocketDebuggerUrl, {
        onEvent: async (event, client) => {
          if (event.method === "Fetch.requestPaused") {
            await client.command("Fetch.failRequest", {
              requestId: event.params.requestId,
              errorReason: "BlockedByClient",
            });
            task.row.blockedMedia = (task.row.blockedMedia || 0) + 1;
          }
        },
      });
      if (params.blockMedia)
        await connection.command("Fetch.enable", {
          patterns: [{ resourceType: "Media", requestStage: "Request" }],
        });
      await cdp.activateTab(item.port, tab.id);
      for (const previous of old) await cdp.closeTab(item.port, previous.id);
      return {
        navigate: async (url, timeout) => {
          const result = await connection.command(
            "Page.navigate",
            { url },
            { timeout },
          );
          if (result.errorText) throw Error(result.errorText);
        },
        evaluate: async (expression, timeout = 8000) => {
          this.alive(task);
          const result = await connection.command(
            "Runtime.evaluate",
            { expression, awaitPromise: true, returnByValue: true },
            { timeout },
          );
          if (result.exceptionDetails)
            throw Error(result.exceptionDetails.text || "页面脚本执行失败");
          return result.result.value;
        },
        cleanup: async () => connection.close(),
      };
    } catch (error) {
      connection?.close();
      throw error;
    }
  }
  async firefoxPage(task, first) {
    const client = task.item.bidiConnection,
      params = task.row.options;
    if (!client || client.closed) throw Error("Firefox BiDi 未就绪");
    const old = first
      ? (await client.command("browsingContext.getTree", { maxDepth: 0 }))
          .contexts
      : [];
    const { context } = await client.command("browsingContext.create", {
      type: "tab",
    });
    let intercept, subscription, previousHandler, handler;
    const cleanup = async () => {
      if (intercept && !client.closed)
        await client.command("network.removeIntercept", { intercept });
      if (subscription && !client.closed)
        await client.command("session.unsubscribe", {
          subscriptions: [subscription],
        });
      if (handler && client.onEvent === handler)
        client.onEvent = previousHandler;
    };
    try {
      if (params.blockMedia) {
        previousHandler = client.onEvent;
        handler = async (event, connection) => {
          await previousHandler?.(event, connection);
          if (
            event.method !== "network.responseStarted" ||
            !event.params.isBlocked ||
            event.params.context !== context
          )
            return;
          const response = event.params.response;
          const mime =
            response.mimeType ||
            response.headers?.find(
              (header) => header.name.toLowerCase() === "content-type",
            )?.value?.value ||
            "";
          if (/^(audio|video)\//i.test(mime))
            task.row.blockedMedia = (task.row.blockedMedia || 0) + 1;
          await client.command(
            /^(audio|video)\//i.test(mime)
              ? "network.failRequest"
              : "network.continueResponse",
            { request: event.params.request.request },
          );
        };
        client.onEvent = handler;
        ({ subscription } = await client.command("session.subscribe", {
          events: ["network.responseStarted"],
          contexts: [context],
        }));
        ({ intercept } = await client.command("network.addIntercept", {
          phases: ["responseStarted"],
          contexts: [context],
        }));
      }
      await client.command("browsingContext.activate", { context });
      for (const previous of old)
        await client.command("browsingContext.close", {
          context: previous.context,
        });
      return {
        navigate: (url, timeout) =>
          client.command(
            "browsingContext.navigate",
            { context, url, wait: "complete" },
            timeout,
          ),
        evaluate: async (expression, timeout = 8000) => {
          this.alive(task);
          // Returning JSON avoids loss of nested BiDi RemoteValue structure.
          const result = await client.command(
            "script.evaluate",
            {
              target: { context },
              expression:
                "(async()=>JSON.stringify(await (" + expression + ")))()",
              awaitPromise: true,
            },
            timeout,
          );
          if (result.type === "exception")
            throw Error(
              result.exceptionDetails?.text || "Firefox 页面脚本执行失败",
            );
          return result.result?.value === undefined
            ? undefined
            : JSON.parse(result.result.value);
        },
        cleanup,
      };
    } catch (error) {
      await cleanup();
      throw error;
    }
  }
  async shutdown() {
    this.closing = true;
    for (const task of this.active.values()) task.abort.abort();
    const stopping = await Promise.allSettled(
      [...this.active.values()]
        .filter(
          (task) =>
            task.ownsLaunch &&
            task.launch &&
            this.engine.starting.get(task.row.profileId) === task.launch,
        )
        .map((task) => this.engine.stop(task.row.profileId)),
    );
    for (const result of stopping)
      if (result.status === "rejected") this.failures.push(result.reason);
    while (this.active.size) {
      const running = [...this.active.values()]
        .map((task) => task.done)
        .filter(Boolean);
      await Promise.all(running);
      if (!running.length) this.pump();
      // start() may still be persisting its reservation before enqueuing. Yield
      // to that I/O; a synchronous empty-worker loop would starve it forever.
      if (!running.length) await delay(0);
    }
    await this.writes;
    if (this.failures.length)
      throw new AggregateError(this.failures, "Cookie Robot 记录或停止失败");
  }
}
module.exports = { CookieRobot, options, scrollPage, waitImages };
