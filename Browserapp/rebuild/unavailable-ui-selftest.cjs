"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(
      path.join(repo, "work/rebuild/unavailable-ui-"),
    ),
    evidence = path.join(repo, "docs/rebuild/evidence");
  let app, page;
  const result = {
    passed: false,
    checks: [],
    errors: [],
    externalRequests: [],
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
    const failure = await page.evaluate(async () => {
      try {
        await globalThis.electronAPI.send("unknown:test");
        return null;
      } catch (error) {
        return { code: error.code, message: error.message };
      }
    });
    assert.equal(failure.code, "LOCAL_CHANNEL_UNIMPLEMENTED");
    await page
      .getByText("此功能尚未完成本地接线，操作未执行。", { exact: true })
      .last()
      .waitFor();
    result.checks.push("未映射 channel 明确拒绝并显示原 Toast，不伪造成功");
    const profile = await page.evaluate(() =>
      globalThis.__localRequest("profiles:create", {
        windowName: "未完成能力验收",
        os: "Linux",
      }),
    );
    await page
      .getByText("未完成能力验收", { exact: true })
      .click({ button: "right" });
    await page.getByText("Cookie 机器人", { exact: true }).last().click();
    const form = page.locator(".p-dialog");
    await form.getByText("OPE-1", { exact: true }).waitFor();
    await form.locator("textarea").fill("http://127.0.0.1:1/fixture");
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:delete", { ids: [id] }),
      profile.id,
    );
    await form
      .getByRole("button", { name: "开始生成 Cookie", exact: true })
      .click();
    await page
      .getByText("窗口在回收站或正在同步，请先停止同步", { exact: true })
      .last()
      .waitFor();
    assert.ok(await form.isVisible());
    assert.equal(
      await form.locator("textarea").inputValue(),
      "http://127.0.0.1:1/fixture",
    );
    assert.equal(
      (await page.evaluate(() => globalThis.ops.rpaTasks())).length,
      0,
    );
    assert.equal(
      (
        await page.evaluate(() =>
          globalThis.__localRequest("cookie-robot:list"),
        )
      ).length,
      0,
    );
    assert.ok(
      (await page.evaluate(() => globalThis.ops.profileStatus())).every(
        (row) => !row.running,
      ),
    );
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(evidence, "cookie-robot-invalid.png"),
    });
    result.checks.push(
      "Cookie Robot 拒绝已经移入回收站的窗口，原表单与输入保留；机器人与 RPA 任务均为零、没有启动浏览器",
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "unavailable-ui-failure.png"),
      });
    }
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "unavailable-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
