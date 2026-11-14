"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data =
      process.env.OPENBROWSER_KERNEL_TEST_DATA ||
      (await fs.mkdtemp(path.join(repo, "work/rebuild/kernel-ui-"))),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = {
      passed: false,
      errors: [],
      externalRequests: [],
      checks: [],
      data,
    };
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
      env: {
        ...process.env,
        OPENBROWSER_USER_DATA: data,
        OPENBROWSER_HEADLESS: "1",
      },
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
    await page.getByText("窗口管理", { exact: true }).first().waitFor();
    await page.evaluate(() => globalThis.__router.push("/kernels"));
    await page.getByText("内核管理", { exact: true }).last().waitFor();
    await page.getByLabel("内核类型", { exact: true }).selectOption("firefox");
    await page
      .getByRole("button", { name: "获取可下载版本", exact: true })
      .click();
    await waitUntil(
      async () =>
        (await page
          .getByLabel("内核版本", { exact: true })
          .locator("option")
          .count()) > 0,
      { timeout: 60000 },
    );
    result.version = await page
      .getByLabel("内核版本", { exact: true })
      .inputValue();
    assert.match(result.version, /^\d/);
    console.log("Firefox catalog:", result.version);
    result.checks.push("真实原后端读取 Mozilla 可安装版本目录");
    await page
      .getByRole("button", { name: "安装所选版本", exact: true })
      .click();
    await waitUntil(
      async () => {
        const rows = await page.evaluate(() =>
          globalThis.__localRequest("kernels:list"),
        );
        return rows.some(
          (k) => k.engine === "firefox" && k.version === result.version,
        );
      },
      { timeout: 300000 },
    );
    result.checks.push("通过新内核页下载并由原后端校验、安装 Firefox");
    await page.screenshot({
      path: path.join(evidence, "kernels-firefox-installed.png"),
    });
    const row = await page.evaluate(
      (version) =>
        globalThis.__localRequest("profiles:create", {
          windowName: "Firefox 真实启动",
          coreType: "Firefox",
          coreVersion: version,
          os: "Linux",
          startupParam: "--headless",
          defaultOpenUrl: ["about:blank"],
          isDisplayLanguageBaseIp: false,
          isTimeZone: false,
          isPositionBaseIp: false,
        }),
      result.version,
    );
    result.profileId = row.id;
    console.log("Starting Firefox profile:", row.id);
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:start", { id }),
      row.id,
    );
    await waitUntil(
      () =>
        page.evaluate(
          (id) =>
            globalThis
              .__localRequest("profiles:list")
              .then((rows) =>
                rows.some((row) => row.id === id && row.openStatus),
              ),
          row.id,
        ),
      { timeout: 60000 },
    );
    const status = await page.evaluate(() => globalThis.ops.profileStatus());
    result.running = status.find((v) => v.id === row.id);
    assert.ok(result.running?.running);
    assert.ok(result.running.pid > 0);
    result.checks.push(
      "新 UI IPC 到原 BrowserEngine，真实 Firefox 子进程已启动",
    );
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:stop", { id }),
      row.id,
    );
    await waitUntil(() =>
      page.evaluate(
        (id) =>
          globalThis
            .__localRequest("profiles:list")
            .then((rows) =>
              rows.every((row) => row.id !== id || !row.openStatus),
            ),
        row.id,
      ),
    );
    result.checks.push("真实 Firefox 子进程停止");
    assert.deepEqual(result.externalRequests, []);
    assert.deepEqual(result.errors, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      result.hitTest = await page.evaluate(() =>
        [...document.querySelectorAll("button")].map((el) => {
          const r = el.getBoundingClientRect(),
            style = getComputedStyle(el);
          return {
            text: el.innerText,
            rect: r.toJSON(),
            pointer: style.pointerEvents,
            hit: document
              .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
              ?.outerHTML.slice(0, 500),
          };
        }),
      );
      await page.screenshot({
        path: path.join(evidence, "kernels-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "kernels-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
