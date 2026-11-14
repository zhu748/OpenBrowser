const { waitUntil } = require("./selftest-helpers.cjs");
("use strict");
const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { unwrapIpcResult } = require("../shared/ipc-result");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const evidence = path.join(repo, "docs/rebuild/evidence"),
    data = await fs.mkdtemp(path.join(repo, "work/rebuild/management-"));
  const result = {
    passed: false,
    checks: [],
    errors: [],
    externalRequests: [],
  };
  let app,
    page,
    phase = "startup";
  const call = async (method, payload = {}) =>
    unwrapIpcResult(
      await page.evaluate(
        ({ method, payload }) => globalThis.rebuild.request(method, payload),
        { method, payload },
      ),
    );
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
        OPENBROWSER_ROXY_UI: "1",
        OPENBROWSER_USER_DATA: data,
      },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (e) =>
      result.errors.push({ phase, error: e.message }),
    );
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push({ phase, error: m.text() });
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push({ phase, url: r.url() });
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    phase = "project-create";
    console.log(phase);
    await page.evaluate(() => globalThis.__router.push("/projects/list"));
    await page
      .getByRole("button", { name: "创建项目", exact: true })
      .last()
      .click();
    await page.locator("input").last().fill("本地项目验收");
    await page.getByRole("button", { name: "确认", exact: true }).click();
    await page.getByText("本地项目验收", { exact: true }).first().waitFor();
    assert.ok(
      (await call("groups:list")).some((r) => r.projectName === "本地项目验收"),
    );
    result.checks.push("原项目页面创建项目，真实本地存储存在该记录");
    await page.screenshot({
      path: path.join(evidence, "projects-created.png"),
    });
    phase = "template-save";
    console.log(phase);
    await page.evaluate(() => globalThis.__router.push("/browser/create"));
    await page.locator("input").first().fill("模板字段验收");
    await page
      .locator("textarea")
      .first()
      .fill(
        '[{"name":"template-cookie","value":"fixture-secret","domain":"example.test","path":"/"}]',
      );
    await page.getByRole("button", { name: "存为新模板", exact: true }).click();
    await page.locator('input[name="templateName"]').fill("本地模板验收");
    await page
      .getByRole("button", { name: "保存", exact: true })
      .last()
      .click();
    await waitUntil(
      () =>
        page.evaluate(async () => {
          const r = await globalThis.rebuild.request("templates:list");
          return r.value?.some((row) => row.templateName === "本地模板验收");
        }),
      {},
    );
    const template = (await call("templates:list")).find(
      (r) => r.templateName === "本地模板验收",
    );
    assert.ok(
      JSON.parse(template.content).cookie.some(
        (c) => c.name === "template-cookie",
      ),
    );
    result.checks.push("原创建表单存为本地模板，完整 Cookie 配置写入磁盘");
    await page.screenshot({ path: path.join(evidence, "template-saved.png") });
    phase = "template-use";
    console.log(phase);
    await page.evaluate(() => globalThis.__router.push("/templates"));
    await page
      .getByRole("button", { name: "使用 / 修改", exact: true })
      .click();
    await page.waitForFunction(() =>
      document.querySelector("textarea")?.value.includes("template-cookie"),
    );
    assert.ok(
      (await page.locator("textarea").first().inputValue()).includes(
        "template-cookie",
      ),
    );
    result.checks.push("模板管理使用按钮把完整配置读回原创建表单");
    phase = "proxy-edit";
    console.log(phase);
    const proxy = await call("proxies:create", {
      host: "127.0.0.1",
      port: 9999,
      protocol: "http",
      username: "fixture-user",
      password: "fixture-password",
      remark: "代理编辑验收",
    });
    await page.evaluate(() => globalThis.__router.push("/agent"));
    await page.getByText("127.0.0.1:9999", { exact: false }).first().waitFor();
    await page.screenshot({
      path: path.join(evidence, "proxy-before-edit.png"),
    });
    const row = page.getByRole("row").filter({ hasText: "127.0.0.1" });
    await row.click({ button: "right" });
    await page.getByText("编辑", { exact: true }).last().click();
    await page.locator('input[name="port"]').fill("9998");
    await page
      .getByRole("button", { name: "保存", exact: true })
      .last()
      .click();
    await waitUntil(
      () =>
        page.evaluate(
          async (id) =>
            (await globalThis.rebuild.request("proxies:read", { id })).value
              ?.port === 9998,
          proxy.id,
        ),
      {},
    );
    result.checks.push("原代理列表编辑入口保存到 OpenBrowser 原代理库");
    phase = "proxy-delete";
    console.log(phase);
    await page
      .getByRole("row")
      .filter({ hasText: "127.0.0.1" })
      .click({ button: "right" });
    await page.getByText("删除", { exact: true }).last().click();
    await page
      .getByRole("button", { name: "确认", exact: true })
      .last()
      .click();
    await waitUntil(
      () =>
        page.evaluate(
          async (id) =>
            !(await globalThis.rebuild.request("proxies:list")).value.some(
              (row) => row.id === id,
            ),
          proxy.id,
        ),
      {},
    );
    result.checks.push("原代理删除确认入口移除真实代理库记录");
    phase = "file-exchange";
    console.log(phase);
    const profile = await call("profiles:create", {
      windowName: "文件交换验收",
      cookie:
        '[{"name":"exchange-cookie","value":"secret","domain":"example.test"}]',
    });
    const file = path.join(data, "exchange.json");
    // Native dialogs are deterministically selected in this automated test; file IO and IPC remain real.
    await app.evaluate(({ dialog }, file) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: file });
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [file],
      });
    }, file);
    await page.evaluate(() => globalThis.__router.push("/browser/list"));
    await page.getByText("转移中", { exact: true }).click();
    await page.getByLabel("选择 文件交换验收", { exact: true }).check();
    await page
      .getByRole("button", { name: "导出所选窗口", exact: true })
      .click();
    await page.getByText("已处理 1 个窗口", { exact: true }).waitFor();
    assert.ok(
      JSON.parse(await fs.readFile(file, "utf8")).profiles[0].cookies.includes(
        "exchange-cookie",
      ),
    );
    await page
      .getByRole("button", { name: "导入窗口文件", exact: true })
      .click();
    await waitUntil(
      () =>
        page.evaluate(
          async () =>
            (await globalThis.rebuild.request("profiles:list")).value?.filter(
              (r) => r.windowName === "文件交换验收",
            ).length === 2,
        ),
      {},
    );
    result.checks.push(
      "文件交换页面导出/导入真实 JSON 与 Cookie；自动测试固定原生文件选择返回路径",
    );
    await page.screenshot({ path: path.join(evidence, "file-exchange.png") });
    assert.ok(profile.id);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (e) {
    result.failure = { phase, error: e.stack };
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "management-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "management-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
