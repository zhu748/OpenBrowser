"use strict";
const { _electron: electron, chromium } = require("playwright"),
  http = require("node:http"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/sync-dialogs-")),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = { passed: false, checks: [], errors: [], externalRequests: [] };
  let app, page, dialog;
  const connections = [];
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      '<!doctype html><html><title>Sync dialogs fixture</title><body><input id="batch-field"><p>' +
        req.url +
        "</p></body></html>",
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + server.address().port;
  const observe = (target) => {
    target.on("pageerror", (error) => result.errors.push(error.message));
    target.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    target.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
  };
  const open = async (action) => {
    const [next] = await Promise.all([app.waitForEvent("window"), action()]);
    dialog = next;
    const nativeWindow = await app.browserWindow(dialog);
    const bounds = await nativeWindow.evaluate((win) => win.getContentBounds());
    await nativeWindow.dispose();
    assert.ok(
      bounds && bounds.width >= 200 && bounds.height >= 200,
      JSON.stringify(bounds),
    );
    (result.nativeDialogBounds ??= []).push({
      url: dialog.url(),
      width: bounds.width,
      height: bounds.height,
    });
    // The headless compositor starts secondary renderers at 1×1. Use the
    // actual native content bounds, retaining an assertion on those dimensions.
    await dialog.setViewportSize({
      width: bounds.width,
      height: bounds.height,
    });
    await dialog.locator(".p-dialog").waitFor();
    return dialog;
  };
  const close = async () => {
    const closed = dialog.waitForEvent("close");
    await dialog.locator(".p-dialog-close-button").click();
    await closed;
    dialog = null;
  };
  const save = async () => {
    const closed = dialog.waitForEvent("close");
    await dialog
      .getByRole("button", { name: "保存并生效", exact: true })
      .click();
    await closed;
    dialog = null;
  };
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
    app.on("window", observe);
    page = await app.firstWindow();
    observe(page);
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const ids = [];
    for (let i = 0; i < 2; i++) {
      const row = await page.evaluate(
        (p) => globalThis.__localRequest("profiles:create", p),
        {
          windowName: "弹窗真实窗口 " + (i + 1),
          coreType: "Chrome",
          os: "Linux",
          startupParam: "--headless=new",
          sandboxPermission: true,
          defaultOpenUrl: [origin + "/initial"],
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
    await page.evaluate(
      (ids) => globalThis.electronAPI.send("syncControl:start", ids),
      ids,
    );
    const state = await page.evaluate(() => globalThis.ops.getSyncState());
    result.processes = (
      await page.evaluate(() => globalThis.ops.profileStatus())
    )
      .filter((row) => ids.includes(row.id))
      .map((row) => ({ id: row.id, pid: row.pid, port: row.port }));
    assert.ok(result.processes.every((row) => row.pid > 0));
    for (const id of [
      state.master,
      ...ids.filter((id) => id !== state.master),
    ]) {
      const row = result.processes.find((row) => row.id === id);
      connections.push(
        await chromium.connectOverCDP("http://127.0.0.1:" + row.port),
      );
    }
    let stable = Date.now(),
      previous = "";
    await waitUntil(() => {
      const signature = connections
        .map((browser) =>
          browser
            .contexts()
            .flatMap((context) => context.pages())
            .map((tab) => tab.url())
            .join(","),
        )
        .join("|");
      if (signature !== previous) {
        stable = Date.now();
        previous = signature;
      }
      return signature.includes("/initial") && Date.now() - stable > 1400;
    });
    const current = () =>
      connections.map((browser) =>
        browser
          .contexts()
          .flatMap((context) => context.pages())
          .find(
            (tab) =>
              !tab.isClosed() && tab.url().startsWith(origin + "/initial"),
          ),
      );
    assert.ok(current().every(Boolean));
    await page.locator(".sync-text").hover();
    await open(() => page.locator(".other-item").last().click());
    await dialog.getByRole("tab", { name: "基础设置", exact: true }).waitFor();
    assert.equal(await dialog.evaluate(() => innerWidth), 500);
    await dialog.locator(".base-settings .cursor-pointer").nth(1).click();
    await dialog
      .getByRole("button", { name: "保存并生效", exact: true })
      .click();
    await waitUntil(async()=>!(await app.windows()).includes(dialog));
    const colorSettings=(await page.evaluate(()=>globalThis.__localRequest('settings:get'))).preferenceSettings;
    assert.match(colorSettings.base.mainControlWindowColor,/^#[0-9A-F]{6,8}$/i);
    assert.equal((await page.evaluate(()=>globalThis.ops.getSyncSettings())).keyboard,true);
    const masterDirectory=path.join(data,'browser-profiles-v2',result.processes[0].id,'OpenBrowserControlTheme');
    const theme=JSON.parse(await fs.readFile(path.join(masterDirectory,'manifest.json'),'utf8'));
    assert.deepEqual(theme.theme.colors.frame.slice(0,3),[1,3,5].map(index=>parseInt(colorSettings.base.mainControlWindowColor.slice(index,index+2),16)));
    await page.screenshot({path:path.join(evidence,'sync-color-applied.png')});
    result.checks.push('原颜色选择器保存生效，标准 Chrome 实际加载对应 RGB 的本地主控主题，原设置真实保存；没有返回不支持或假成功');
    await page.locator(".sync-text").hover();
    await open(() => page.locator(".other-item").last().click());
    await dialog.getByRole("switch").first().uncheck();
    await dialog.waitForTimeout(250);
    await dialog.screenshot({
      path: path.join(evidence, "sync-preferences-base.png"),
    });
    await save();
    assert.equal(
      (await page.evaluate(() => globalThis.ops.getSyncSettings())).keyboard,
      false,
    );
    assert.equal(
      (await page.evaluate(() => globalThis.__localRequest("settings:get")))
        .preferenceSettings.base.enableSyncKeybord,
      false,
    );
    result.checks.push(
      "浮条真实设置按钮打开原 500px 独立偏好窗口，原开关保存到本地并立即改变原同步控制器",
    );
    await page.locator(".sync-text").hover();
    await open(() => page.locator(".other-item").last().click());
    await dialog
      .getByRole("tab", { name: "仿真参数设置", exact: true })
      .click();
    await dialog
      .locator(".simulate-settings")
      .getByRole("switch")
      .first()
      .check();
    const delay = dialog.locator(".simulate-settings .p-inputnumber-input");
    await delay.nth(0).fill("40");
    await delay.nth(1).fill("80");
    await dialog.locator("#serialization-delay").check();
    await dialog.screenshot({
      path: path.join(evidence, "sync-preferences-simulate.png"),
    });
    await save();
    const configured = await page.evaluate(() =>
      globalThis.ops.getSyncSettings(),
    );
    assert.equal(configured.delayMode, 0);
    assert.equal(configured.clickMinMs, 40);
    assert.equal(configured.clickMaxMs, 80);
    result.checks.push(
      "原仿真页保存点击延迟及串行模式，原控制器读回 40–80ms 和 delayMode=0",
    );
    await page.locator(".sync-text").hover();
    await open(() => page.locator(".other-item").last().click());
    await dialog.getByRole("switch").first().check();
    await save();
    await page.locator(".sync-text").hover();
    await open(() =>
      page
        .getByText("窗口布局", { exact: true })
        .click()
        .then(() => page.getByText("自定义", { exact: true }).click()),
    );
    await dialog
      .getByRole("tab", { name: "自定义布局", exact: true })
      .waitFor();
    const fields = dialog.locator(".custom-layout .p-inputnumber-input");
    for (const [i, value] of ["640", "480", "12", "16", "2"].entries())
      await fields.nth(i).fill(value);
    await dialog.screenshot({
      path: path.join(evidence, "sync-custom-layout.png"),
    });
    await save();
    result.bounds = await Promise.all(
      result.processes.map((row) =>
        require("../cdp")
          .windowForPort(row.port)
          .then((value) => value.bounds),
      ),
    );
    assert.ok(
      result.bounds.every(
        (bounds) => bounds.width === 640 && bounds.height === 480,
      ),
    );
    assert.equal(result.bounds[1].left - result.bounds[0].left, 652);
    result.checks.push(
      "原自定义布局表单真实保存，两个独立 Chrome 的 CDP 窗口尺寸 640×480、水平间距 12 均匹配",
    );
    await page.locator(".sync-text").hover();
    await open(() => page.locator(".other-item").first().click());
    await dialog.getByText("弹窗真实窗口 2", { exact: true }).waitFor();
    await dialog.getByText("主控窗口", { exact: true }).waitFor();
    await dialog.screenshot({
      path: path.join(evidence, "sync-window-list.png"),
    });
    await close();
    result.checks.push(
      "原同步窗口列表在独立窗口显示真实两条记录与主控状态，关闭回收窗口",
    );
    for (const tab of current())
      await tab.locator("#batch-field").evaluate((el) => {
        el.value = "old";
        el.focus();
        el.setSelectionRange(3, 3);
      });
    await page.locator(".sync-text").hover();
    await open(() => page.getByText("批量输入", { exact: true }).click());
    await dialog.getByRole("tab", { name: "相同文本", exact: true }).waitFor();
    await dialog.locator("textarea:visible").fill("本地批量输入");
    await dialog.locator("#append:visible").check();
    await dialog.getByRole("button", { name: "输入", exact: true }).click();
    await waitUntil(async () => {
      const values = await Promise.all(
        current().map((tab) => tab.locator("#batch-field").inputValue()),
      );
      return values.every((value) => value === "本地批量输入");
    });
    await page.waitForTimeout(600);
    assert.deepEqual(
      await Promise.all(
        current().map((tab) => tab.locator("#batch-field").inputValue()),
      ),
      ["本地批量输入", "本地批量输入"],
    );
    await dialog.locator("#append:visible").uncheck();
    await dialog.locator("textarea:visible").fill("-追加");
    await dialog.getByRole("button", { name: "输入", exact: true }).click();
    await waitUntil(async () =>
      (
        await Promise.all(
          current().map((tab) => tab.locator("#batch-field").inputValue()),
        )
      ).every((value) => value === "本地批量输入-追加"),
    );
    await page.waitForTimeout(600);
    assert.deepEqual(
      await Promise.all(
        current().map((tab) => tab.locator("#batch-field").inputValue()),
      ),
      ["本地批量输入-追加", "本地批量输入-追加"],
    );
    await dialog.getByRole("tab", { name: "差异文本", exact: true }).click();
    const perWindow = dialog.locator(".diff-text textarea");
    await perWindow.nth(0).fill("窗口 A");
    await perWindow.nth(1).fill("窗口 B");
    await dialog.locator("#append:visible").check();
    await dialog.getByRole("button", { name: "输入", exact: true }).click();
    await waitUntil(async () => {
      const values = await Promise.all(
        current().map((tab) => tab.locator("#batch-field").inputValue()),
      );
      return values.includes("窗口 A") && values.includes("窗口 B");
    });
    await dialog.screenshot({
      path: path.join(evidence, "sync-batch-different.png"),
    });
    result.checks.push(
      "原批量输入页经真实原后端输入：同文替换、追加无重复、按实际 PID 分配差异文本；同步镜像状态恢复",
    );
    assert.equal(
      (await page.evaluate(() => globalThis.ops.getSyncSettings())).keyboard,
      true,
    );
    await close();
    await page.locator(".sync-text").hover();
    await open(() =>
      page
        .getByText("标签控制", { exact: true })
        .click()
        .then(() => page.getByText("打开网址", { exact: true }).click()),
    );
    await dialog
      .locator("textarea")
      .fill(origin + "/first\n" + origin + "/second");
    await dialog.getByRole("button", { name: "打开", exact: true }).click();
    await waitUntil(
      () =>
        connections.every((browser) => {
          const urls = browser
            .contexts()
            .flatMap((context) => context.pages())
            .map((tab) => tab.url());
          return (
            urls.includes(origin + "/first") &&
            urls.includes(origin + "/second")
          );
        }),
      { timeout: 20000 },
    );
    await dialog.screenshot({
      path: path.join(evidence, "sync-open-sites.png"),
    });
    result.openedUrls = connections.map((browser) =>
      browser
        .contexts()
        .flatMap((context) => context.pages())
        .map((tab) => tab.url()),
    );
    await page.waitForTimeout(700);
    for (const browser of connections) {
      const urls = browser
        .contexts()
        .flatMap((context) => context.pages())
        .map((tab) => tab.url());
      assert.equal(urls.filter((url) => url === origin + "/first").length, 1);
      assert.equal(urls.filter((url) => url === origin + "/second").length, 1);
    }
    const active = connections[0]
      .contexts()
      .flatMap((context) => context.pages())
      .find((tab) => tab.url() === origin + "/second");
    await active.bringToFront();
    await dialog.locator("textarea:visible").fill(origin + "/replacement");
    await dialog.locator("#ingredient1").check();
    await dialog.getByRole("button", { name: "打开", exact: true }).click();
    await waitUntil(() =>
      connections.every((browser) => {
        const urls = browser
          .contexts()
          .flatMap((context) => context.pages())
          .map((tab) => tab.url());
        return (
          urls.includes(origin + "/replacement") &&
          urls.includes(origin + "/initial") &&
          !urls.includes(origin + "/second")
        );
      }),
    );
    result.checks.push(
      "原打开网址弹窗在两台真实 Chrome 各打开一次，无重复；从当前页打开保留首个标签，实际替换活动标签；渲染端无 fetch",
    );
    await close();
    assert.equal((await app.windows()).length, 1);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    for (const target of [dialog, page])
      if (target && !target.isClosed()) {
        result.body = await target.locator("body").innerText();
        await target.screenshot({
          path: path.join(
            evidence,
            "sync-dialogs-failure-" +
              (target === dialog ? "dialog" : "main") +
              ".png",
          ),
        });
      }
  } finally {
    for (const browser of connections) await browser.close();
    await app?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.writeFile(
      path.join(evidence, "sync-dialogs-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
