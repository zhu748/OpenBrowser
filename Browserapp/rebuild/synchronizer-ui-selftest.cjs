"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/sync-ui-")),
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
    await page.evaluate(() => (globalThis.__localSubscriptions = []));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() =>
        globalThis.electronAPI.send("syncControl:open"),
      );
      await page.getByText("窗口同步", { exact: true }).waitFor();
      await page.waitForTimeout(300);
      const end = await page.evaluate(
        () => globalThis.__localSubscriptions.length,
      );
      assert.ok(end > 0);
      if (i === 0) {
        result.body = await page.locator("body").innerText();
        await page.screenshot({
          path: path.join(evidence, "synchronizer-empty.png"),
        });
      }
      await page.evaluate(() =>
        globalThis.electronAPI.send("syncControl:close"),
      );
      await page.getByText("暂无窗口", { exact: true }).waitFor();
      await waitUntil(() =>
        page.evaluate(
          (end) =>
            globalThis.__localSubscriptions
              .slice(0, end)
              .every((item) => !item.active),
          end,
        ),
      );
    }
    result.checks.push("原版同步组件通过原 channel 在本地 shell 打开和关闭");
    result.checks.push("连续三次挂载/卸载，组件创建的事件订阅全部释放");
    await page.evaluate(() => {
      const add = window.addEventListener.bind(window),
        remove = window.removeEventListener.bind(window);
      globalThis.__windowSubscriptions = [];
      window.addEventListener = (type, callback, options) => {
        if (["blur", "mouseup"].includes(type))
          globalThis.__windowSubscriptions.push({
            type,
            callback,
            active: true,
          });
        return add(type, callback, options);
      };
      window.removeEventListener = (type, callback, options) => {
        for (const item of globalThis.__windowSubscriptions)
          if (item.type === type && item.callback === callback)
            item.active = false;
        return remove(type, callback, options);
      };
    });
    await page.evaluate(() => globalThis.__router.push("/synchronizer/active"));
    await page.locator(".action-bar").hover();
    await page.getByText("停止同步", { exact: true }).waitFor();
    await page.screenshot({
      path: path.join(evidence, "synchronizer-actions.png"),
    });
    await page.getByText("停止同步", { exact: true }).click();
    await page.getByText("窗口同步", { exact: true }).waitFor();
    await page.waitForTimeout(200);
    assert.equal(
      await page.evaluate(
        () =>
          globalThis.__windowSubscriptions.filter((item) => item.active).length,
      ),
      0,
    );
    result.checks.push(
      "原操作条停止按钮调用现有后端并返回选择页；窗口级事件监听释放（此项没有启动真实同步会话）",
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "synchronizer-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "synchronizer-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
