"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  net = require("node:net");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/network-ui-")),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = { passed: false, errors: [], externalRequests: [], checks: [] };
  let app, page;
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
    await page
      .getByRole("button", { name: "刷新网络定位", exact: true })
      .click();
    await waitUntil(
      () =>
        page.evaluate(() =>
          globalThis.__localRequest("host:network").then((row) => !!row.ip),
        ),
      { timeout: 60000 },
    );
    result.host = await page.evaluate(() =>
      globalThis.__localRequest("host:network"),
    );
    assert.ok(net.isIP(result.host.ip));
    await page
      .getByTestId("workbench-header")
      .getByText("(" + result.host.ip + ")", { exact: true })
      .waitFor();
    result.checks.push(
      "真实点击定位按钮：原后端完成公网探测，显示实际返回地址，未使用固定截图数据",
    );
    const proxy = new URL(
      process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "",
    );
    const proxyInfo = {
      host: proxy.hostname,
      port: Number(proxy.port || 80),
      protocol: proxy.protocol.slice(0, -1),
      proxyUserName: decodeURIComponent(proxy.username),
      proxyPassword: decodeURIComponent(proxy.password),
    };
    await page.evaluate(() => (globalThis.__localRequests = []));
    const row = await page.evaluate(
      (proxyInfo) =>
        globalThis.__localRequest("profiles:create", {
          windowName: "代理检测真实接线",
          coreType: "Chrome",
          os: "Linux",
          proxyInfoList: [proxyInfo],
        }),
      proxyInfo,
    );
    await page.getByText("代理检测真实接线", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "测试全部代理 IP", exact: true })
      .click();
    await waitUntil(
      () =>
        page.evaluate(
          (id) =>
            globalThis
              .__localRequest("profiles:read", { id })
              .then((row) => !!row.checkTime && !!row.lastIp),
          row.id,
        ),
      { timeout: 60000 },
    );
    result.profile = await page.evaluate(
      (id) =>
        globalThis
          .__localRequest("profiles:read", { id })
          .then((row) => ({
            id: row.id,
            lastIp: row.lastIp,
            checkTime: row.checkTime,
            checkStatus: row.checkStatus,
          })),
      row.id,
    );
    assert.ok(net.isIP(result.profile.lastIp));
    assert.equal(result.profile.checkStatus, 1);
    result.checks.push(
      "原列表“测试全部代理 IP”走实际探测及结果写回，刷新后检查时间、IP 与成功状态仍在",
    );
    await page.screenshot({ path: path.join(evidence, "network-live.png") });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      result.requests = await page.evaluate(() => globalThis.__localRequests);
      await page.screenshot({
        path: path.join(evidence, "network-live-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "network-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
