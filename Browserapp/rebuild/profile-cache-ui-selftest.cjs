"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/cache-ui-")),
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
    page.on("pageerror", (error) => result.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const profile = await page.evaluate(() =>
      globalThis.__localRequest("profiles:create", {
        windowName: "缓存界面验收",
        os: "Linux",
        cookie:
          '[{"name":"keep-cookie","value":"keep","domain":"example.com"}]',
      }),
    );
    await page.getByText("缓存界面验收", { exact: true }).waitFor();
    const dir = path.join(data, "browser-profiles-v2", profile.id),
      cache = path.join(dir, "Default/Cache/data"),
      extension = path.join(dir, "Default/Local Extension Settings/ext/data"),
      cookies = path.join(dir, "Default/Network/Cookies");
    const put = async (file) => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, "keep");
    };
    const exists = async (file) =>
      !!(await fs.stat(file).catch((error) => {
        if (error.code === "ENOENT") return null;
        throw error;
      }));
    await put(cache);
    await put(extension);
    await put(cookies);
    const open = async () => {
      await page
        .getByText("缓存界面验收", { exact: true })
        .click({ button: "right" });
      await page.getByText("清除缓存", { exact: true }).last().click();
      await page.getByText("清空窗口缓存", { exact: true }).waitFor();
    };
    await open();
    assert.equal(
      await page.getByText("清除所有缓存", { exact: true }).count(),
      0,
    );
    await page.getByText("清除本地缓存（保留插件）", { exact: true }).waitFor();
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(evidence, "cache-local-dialog.png"),
    });
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await waitUntil(async () => !(await exists(cache)));
    assert.ok(await exists(extension));
    assert.ok(await exists(cookies));
    result.checks.push(
      "原右键清除缓存弹窗只剩两个本地选项；默认模式实际删除磁盘缓存并保留插件数据与 Cookie",
    );
    await put(cache);
    await open();
    await page.getByText("清除本地缓存", { exact: true }).click();
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await waitUntil(async () => !(await exists(extension)));
    assert.equal(await exists(cache), false);
    assert.ok(await exists(cookies));
    const edit = await page.evaluate(
      (id) => globalThis.__localRequest("profiles:read", { id }),
      profile.id,
    );
    assert.ok(edit.cookie.includes("keep-cookie"));
    result.checks.push(
      "原弹窗第二种本地模式实际清除插件缓存，磁盘及配置 Cookie 均保留；未调用云端接口",
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "cache-ui-failure.png"),
      });
    }
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "profile-cache-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
