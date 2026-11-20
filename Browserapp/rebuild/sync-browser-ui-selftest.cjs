"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const { _electron: electron, chromium } = require("playwright"),
  http = require("node:http"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await createTestDirectory("sync-browser-ui-"),
    evidence = evidenceDirectory(),
    result = { passed: false, errors: [], externalRequests: [], checks: [] };
  let app, page;
  const connections = [];
  const tabs = [];
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      '<!doctype html><html lang="en"><title>Local synchronization fixture</title><body><label for="sync-input">Sync input</label><input id="sync-input"><button id="count" onclick="this.textContent=Number(this.textContent)+1">0</button></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        path.join(repo, "Browserapp"),
      ],
      env: { ...process.env, OPENBROWSER_USER_DATA: data },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (e) => result.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push(m.text());
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push(r.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    if (process.env.OPENBROWSER_TEST_KERNEL_BINARY) await page.evaluate(() => globalThis.ops.saveClientSettings({ diskLimit: 0 }));
    await page.evaluate(() => {
      globalThis.__syncProbeEvents = [];
      globalThis.ops.onEvent((event) => {
        if (/^(sync|live-sync)/.test(event.type))
          globalThis.__syncProbeEvents.push(event);
      });
    });
    const ids = [];
    for (let i = 0; i < 2; i++) {
      const row = await page.evaluate(
        (p) => globalThis.__localRequest("profiles:create", p),
        {
          windowName: "同步真实窗口 " + (i + 1),
          coreType: "Chrome",
          os: "Linux",
          startupParam: "--headless=new",
          sandboxPermission: true,
          defaultOpenUrl: ["http://127.0.0.1:" + server.address().port],
          isDisplayLanguageBaseIp: false,
          isTimeZone: false,
          isPositionBaseIp: false,
          openWorkbench: 0,
        },
      );
      ids.push(row.id);
      await page.evaluate(
        (id) => globalThis.__localRequest("profiles:start", { id }),
        row.id,
      );
    }
    result.processes = (
      await page.evaluate(() => globalThis.ops.profileStatus())
    )
      .filter((row) => ids.includes(row.id))
      .map((row) => ({ id: row.id, pid: row.pid, port: row.port }));
    assert.equal(result.processes.length, 2);
    assert.ok(result.processes.every((row) => row.pid > 0 && row.port > 0));
    result.checks.push("两个独立 Chrome 真实进程及 CDP 端口存在");
    const invalidStart = await page.evaluate(async ids => {
      try {
        await globalThis.electronAPI.send("syncControl:start", ["closed-sync-window", ...ids]);
      } catch (error) {
        return error.message;
      }
    }, ids);
    assert.match(invalidStart, /请重新选择/);
    assert.equal(await page.evaluate(() => globalThis.ops.getSyncState().then(state => state.active)), false);
    result.checks.push("失效主控被拒绝，启动流程不会自动改用另一窗口");
    await page.locator(".rx-side").getByText("窗口同步", { exact: true }).click();
    const syncTable = page.locator(".sync-control-table");
    await syncTable.getByText("同步真实窗口 2", { exact: true }).waitFor();
    await waitUntil(async () => await syncTable.locator(".can-use-sync-control").count() === 2, {
      message: "同步页未显示两台可同步的 Chrome 窗口",
    });
    const controllingRow = syncTable.getByRole('row').filter({ hasText: '同步真实窗口 2' });
    await controllingRow.hover();
    await controllingRow.getByRole('button', { name: '设为主控', exact: true }).click();
    await page
      .locator(".sync-control-table")
      .getByRole("checkbox")
      .first()
      .check();
    await page.screenshot({ path: path.join(evidence, "sync-real-window-selection.png") });
    await page
      .getByRole("button", { name: "开始同步 2 个窗口", exact: true })
      .click();
    await waitUntil(() =>
      page.evaluate(() =>
        globalThis.ops.getSyncState().then((state) => state.active),
      ),
    );
    result.state = await page.evaluate(() => globalThis.ops.getSyncState());
    assert.equal(result.state.master, ids[1]);
    await page.locator(".action-bar").hover();
    await page.getByText("停止同步", { exact: true }).waitFor();
    await page.screenshot({
      path: path.join(evidence, "sync-real-active.png"),
    });
    await page.locator(".sync-text").hover();
    await page.locator(".action-bar.hover .bottom-bar").waitFor();
    await page.screenshot({
      path: path.join(evidence, "sync-real-tools-expanded.png"),
      animations: "disabled",
    });
    result.checks.push(
      "选择两个真实窗口、指定第二个为主控并从原操作条进入运行状态",
    );
    const ordered = [
      result.state.master,
      ...ids.filter((id) => id !== result.state.master),
    ];
    for (const id of ordered) {
      const row = result.processes.find((row) => row.id === id);
      const browser = await chromium.connectOverCDP(
        "http://127.0.0.1:" + row.port,
      );
      connections.push(browser);
      const tab = await waitUntil(() =>
        Promise.resolve(
          browser
            .contexts()
            .flatMap((context) => context.pages())
            .find((tab) =>
              tab.url().startsWith("http://127.0.0.1:" + server.address().port),
            ),
        ),
      );
      await tab.locator("#sync-input").waitFor();
      tabs.push(tab);
    }
    let stableAt = Date.now(),
      lastPages = "",
      pageSequence = 0;
    const pageIds = new WeakMap();
    await waitUntil(async () => {
      const current = connections[1]
        .contexts()
        .flatMap((context) => context.pages())
        .filter(
          (tab) =>
            !tab.isClosed() &&
            tab.url().startsWith("http://127.0.0.1:" + server.address().port),
        );
      const signature = current
        .map((tab) => {
          if (!pageIds.has(tab)) pageIds.set(tab, ++pageSequence);
          return pageIds.get(tab);
        })
        .join(",");
      if (signature !== lastPages) {
        lastPages = signature;
        stableAt = Date.now();
      }
      if (current.length === 1 && Date.now() - stableAt > 1200) {
        tabs[1] = current[0];
        return true;
      }
      return false;
    });
    result.bindingState = await tabs[0].evaluate(() => ({
      type: typeof window.openBrowserSync,
      installed: window.openBrowserSync?.__installed,
      focused: document.hasFocus(),
      url: location.href,
    }));
    result.browserErrors = [];
    tabs[0].on("pageerror", (error) =>
      result.browserErrors.push(error.message),
    );
    await tabs[0].bringToFront();
    await waitUntil(() => tabs[0].evaluate(() => document.hasFocus()));
    await tabs[0].locator("#sync-input").click();
    await tabs[0].keyboard.type("local sync verification", { delay: 30 });
    await waitUntil(
      async () => {
        const current = connections[1]
          .contexts()
          .flatMap((context) => context.pages())
          .filter(
            (tab) =>
              !tab.isClosed() &&
              tab.url().startsWith("http://127.0.0.1:" + server.address().port),
          );
        for (const tab of current) {
          if (
            (await tab.locator("#sync-input").inputValue()) ===
            "local sync verification"
          )
            return true;
        }
        return false;
      },
      { timeout: 20000 },
    );
    result.checks.push("真实主控窗口键盘输入经原同步后端到达从控窗口");
    await page.getByText("暂停同步", { exact: true }).click();
    await waitUntil(() =>
      page.evaluate(() =>
        globalThis.ops.getSyncState().then((state) => !state.active),
      ),
    );
    await tabs[0].locator("#sync-input").fill("paused input");
    await page.waitForTimeout(600);
    const pausedPage = connections[1]
      .contexts()
      .flatMap((context) => context.pages())
      .find(
        (tab) =>
          !tab.isClosed() &&
          tab.url().startsWith("http://127.0.0.1:" + server.address().port),
      );
    assert.equal(
      await pausedPage.locator("#sync-input").inputValue(),
      "local sync verification",
    );
    await page.screenshot({ path: path.join(evidence, "sync-real-paused.png"), animations: "disabled" });
    await page.locator(".action-bar").hover();
    await page.getByText("恢复同步", { exact: true }).click();
    await waitUntil(() =>
      page.evaluate(() =>
        globalThis.ops.getSyncState().then((state) => state.active),
      ),
    );
    await tabs[0].bringToFront();
    await tabs[0].locator("#sync-input").fill("after resume");
    await waitUntil(
      async () => {
        for (const tab of connections[1]
          .contexts()
          .flatMap((context) => context.pages())
          .filter(
            (tab) =>
              !tab.isClosed() &&
              tab.url().startsWith("http://127.0.0.1:" + server.address().port),
          )) {
          if (
            (await tab.locator("#sync-input").inputValue()) === "after resume"
          )
            return true;
        }
        return false;
      },
      { timeout: 20000 },
    );
    result.checks.push(
      "原操作条暂停后输入不再镜像，恢复后真实输入再次到达从控",
    );
    result.resumedBinding = await tabs[0].evaluate(
      () => typeof window.openBrowserSync,
    );
    assert.equal(
      result.resumedBinding,
      "undefined",
      "恢复同步也不能暴露全局回调",
    );

    await page.getByText("停止同步", { exact: true }).click();
    await waitUntil(() =>
      page.evaluate(() =>
        globalThis.ops.getSyncState().then((state) => !state.active),
      ),
    );
    result.checks.push("原操作条停止真实同步会话");
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      result.syncEvents = await page.evaluate(() =>
        globalThis.__syncProbeEvents.slice(-40),
      );
      result.lastValues = await Promise.all(
        tabs.map((tab) =>
          tab.isClosed()
            ? { closed: true }
            : tab
                .locator("#sync-input")
                .inputValue()
                .catch((error) => ({ diagnosticError: error.message })),
        ),
      );
      if (await page.getByText("停止同步", { exact: true }).count()) {
        await page.getByText("停止同步", { exact: true }).click();
        await waitUntil(() =>
          page.evaluate(() =>
            globalThis.ops.getSyncState().then((state) => !state.active),
          ),
        );
        result.checks.push("失败后仍通过原停止入口终止真实会话");
      }
      await page.screenshot({
        path: path.join(evidence, "sync-real-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    for (const browser of connections) await browser.close();
    await app?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
    await fs.writeFile(
      path.join(evidence, "sync-browser-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
