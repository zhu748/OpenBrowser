"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const resources = {
  "session.subscribe": ["session.unsubscribe", "subscriptions", "subscription", true],
  "network.addIntercept": ["network.removeIntercept", "intercept", "intercept"],
  "network.addDataCollector": ["network.removeDataCollector", "collector", "collector"],
  "script.addPreloadScript": ["script.removePreloadScript", "script", "script"],
};

function createBidiTransport(connection) {
  const retained = new Map();
  const pending = new Set();
  let initialTab = true;
  let detached = false;
  let closing;
  let downloadsConfigured = false;
  const transport = {
    send({ id, method, params }) {
      if (detached) return;
      const command = dispatch(method, params).then(
        result => transport.onmessage?.({ type: "success", id, result }),
        error => transport.onmessage?.({ type: "error", id, error: error.code || "unknown error", message: error.message }),
      );
      pending.add(command);
      void command.finally(() => pending.delete(command)).catch(() => {});
    },
    close(reason) {
      if (closing) return closing;
      detached = true;
      removeListener();
      transport.onclose?.(reason);
      closing = (async () => {
        await Promise.allSettled([...pending]);
        await Promise.allSettled([...retained.values()].map(([name, args]) => connection.command(name, args, 2500)));
        if (downloadsConfigured) await connection.command("browser.setDownloadBehavior", { downloadBehavior: null,
          userContexts: ["default"] }, 2500).catch(() => {});
      })();
      return closing;
    },
  };

  const removeListener = connection.observe(event => {
    if (detached || initialTab) return;
    try { transport.onmessage?.(event); }
    catch (error) { void transport.close(error.message); }
  });

  async function dispatch(method, params) {
    // Firefox already has an OpenBrowser BiDi session. The private Playwright
    // client shares it without starting or ending the application session.
    if (method === "session.new") return connection.sessionInfo;
    if (["session.end", "browser.close"].includes(method)) return {};
    if (method === "emulation.setMediaFeaturesOverride" && initialTab) return {};
    if (method === "browsingContext.create" && initialTab) {
      const { contexts } = await connection.command("browsingContext.getTree");
      const { realms } = await connection.command("script.getRealms", {});
      initialTab = false;
      function announce(context) {
        transport.onmessage?.({ type: "event", method: "browsingContext.contextCreated", params: context });
        for (const child of context.children || []) announce(child);
      }
      for (const context of contexts) announce(context);
      for (const realm of realms)
        transport.onmessage?.({ type: "event", method: "script.realmCreated", params: realm });
      if (contexts.length) return { context: contexts[0].context };
    }

    const result = await connection.command(method, params, 15000);
    const cleanup = Object.hasOwn(resources, method) && resources[method];
    if (cleanup && result[cleanup[2]] !== undefined) {
      const [command, key, field, array] = cleanup;
      const value = result[field];
      retained.set(method + ":" + value, [command, { [key]: array ? [value] : value }]);
    }
    if (method === "browser.setDownloadBehavior" && params.userContexts?.includes("default"))
      downloadsConfigured = true;
    return result;
  }
  return transport;
}

async function connectFirefox(connection, signal) {
  signal.throwIfAborted();
  if (!connection?.sessionInfo || connection.closed) throw Error("此操作需要已启动的 Firefox BiDi 会话");
  const core = path.dirname(require.resolve("playwright-core/package.json"));
  const { remote: { PlaywrightServer }, server: { createPlaywright } } = require(path.join(core, "lib/coreBundle.js"));
  const playwright = createPlaywright({ sdkLanguage: "javascript", isServer: true });
  const firefox = playwright.firefox._bidiFirefox;
  if (typeof firefox?.connectToTransport !== "function") throw Error("当前 Playwright 版本缺少 Firefox BiDi 适配接口");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "openbrowser-script-firefox-"));
  const transport = createBidiTransport(connection);
  let service, listening;
  let cleanup;
  const detach = () => {
    if (!cleanup) cleanup = (async () => {
      await transport.close();
      await listening?.catch(() => {});
      await service?.close();
      await fs.rm(dir, { recursive: true, force: true, maxRetries: 3 });
    })();
    return cleanup;
  };
  const abort = () => { void detach().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    const serverBrowser = await firefox.connectToTransport(transport, {
      name: "firefox", browserType: "firefox",
      isChromium: false, headful: true, originalLaunchOptions: {},
      artifactsDir: dir, downloadsPath: dir, tracesDir: dir,
      browserLogsCollector: { recentLogs: () => [] },
      protocolLogger() {},
      browserProcess: { close: () => transport.close(), kill: () => transport.close() },
      persistent: { noDefaultViewport: true, acceptDownloads: "accept" },
    });
    signal.throwIfAborted();
    service = new PlaywrightServer({
      mode: "launchServerShared", path: "/" + randomUUID(), maxConnections: 1, preLaunchedBrowser: serverBrowser,
    });
    listening = service.listen(0, "127.0.0.1");
    const endpoint = await listening;
    signal.throwIfAborted();
    const browser = await require("playwright").firefox.connect(endpoint, { timeout: 5000 });
    signal.throwIfAborted();
    return { browser, detach };
  } catch (error) {
    await detach();
    throw error;
  } finally { signal.removeEventListener("abort", abort); }
}

module.exports = { connectFirefox };
