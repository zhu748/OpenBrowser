"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil, toggleTheme } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/accounts-ui-")),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = { passed: false, checks: [], errors: [], externalRequests: [] };
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
    await page.setViewportSize({ width: 1448, height: 960 });
    page.on("pageerror", (error) => result.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await page.getByText("平台账号", { exact: true }).first().click();
    await page.getByText("暂无平台账号", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(evidence, "accounts-empty.png") });
    await page
      .getByRole("button", { name: "添加账号", exact: true })
      .first()
      .click();
    result.inputs = await page
      .locator("input")
      .evaluateAll((inputs) =>
        inputs.map((input) => ({
          name: input.name,
          type: input.type,
          placeholder: input.placeholder,
        })),
      );
    await page
      .getByPlaceholder("请输入或选择平台网址", { exact: true })
      .first()
      .fill("https://accounts.example.test/");
    await page
      .getByPlaceholder("请输入或选择平台网址", { exact: true })
      .first()
      .press("Tab");
    await page
      .locator('input[name="platformUserName"]')
      .fill("library@example.test");
    await page.locator('input[name="platformPassword"]').fill("account-secret");
    await page.screenshot({ path: path.join(evidence, "accounts-create.png") });
    await page
      .getByRole("button", { name: "保存", exact: true })
      .first()
      .click();
    await page
      .getByText("library@example.test", { exact: true })
      .first()
      .waitFor();
    const list = await page.evaluate(() =>
      globalThis.__localRequest("accounts:list"),
    );
    assert.equal(list.total, 1);
    const id = list.rows[0].id;
    assert.equal(
      (await page.evaluate((id) => globalThis.ops.accountGet(id), id)).password,
      "account-secret",
    );
    result.checks.push("原侧栏、空态、单个添加表单真实保存到原加密账号库");
    await page
      .getByText("library@example.test", { exact: true })
      .first()
      .click({ button: "right" });
    await page.getByText("编辑", { exact: true }).last().click();
    const drawer = page.locator(".p-drawer");
    await drawer.waitFor();
    assert.equal(
      await drawer.locator('input[name="platformPassword"]').inputValue(),
      "account-secret",
      "显式编辑才读取机密",
    );
    await drawer
      .locator('input[name="platformUserName"]')
      .fill("edited@example.test");
    await drawer.getByRole("button", { name: "保存", exact: true }).click();
    await drawer.waitFor({ state: "hidden" });
    await page
      .getByText("edited@example.test", { exact: true })
      .first()
      .waitFor();
    assert.equal(
      (await page.evaluate((id) => globalThis.ops.accountGet(id), id)).password,
      "account-secret",
    );
    await page.screenshot({
      path: path.join(evidence, "accounts-list-light.png"),
    });
    const profile = await page.evaluate(() =>
      globalThis.__localRequest("profiles:create", {
        windowName: "账号关联窗口",
        os: "Linux",
      }),
    );
    await page.evaluate(
      (value) => globalThis.__localRequest("accounts:bind", value),
      { platformId: id, windowIds: [profile.id] },
    );
    await page.reload();
    await page
      .getByText("edited@example.test", { exact: true })
      .first()
      .waitFor();
    await page.getByText("OPE-1", { exact: true }).last().waitFor();
    await toggleTheme(page);
    await waitUntil(() =>
      page
        .locator("html")
        .getAttribute("data-theme")
        .then((theme) => theme === "dark"),
    );
    await page.screenshot({
      path: path.join(evidence, "accounts-list-dark.png"),
    });
    result.checks.push(
      "原编辑抽屉读取真实密码，修改用户名不清空密码；关联由真实 IPC 固定数据，原列表显示实际窗口编号；原暗色样式可见",
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    if (page) {
      result.body = await page
        .locator("body")
        .innerText()
        .catch(() => "unavailable");
      result.currentInputs = await page
        .locator("input")
        .evaluateAll((inputs) =>
          inputs.map((input) => ({
            name: input.name,
            type: input.type,
            placeholder: input.placeholder,
          })),
        );
      await page
        .screenshot({ path: path.join(evidence, "accounts-ui-failure.png") })
        .catch(() => undefined);
    }
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "accounts-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
