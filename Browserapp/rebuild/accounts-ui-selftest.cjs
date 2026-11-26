"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil, toggleTheme } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await createTestDirectory('accounts-ui-'),
    evidence = evidenceDirectory(),
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
    await page.evaluate(() => globalThis.__router.beforeEach(to => {
      if (to.path.startsWith('/account/') && to.query.renderer !== 'legacy') {
        return { path: to.path, query: { ...to.query, renderer: 'legacy' }, hash: to.hash };
      }
    }));
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
    await page.getByRole("button", { name: "导出数据", exact: true }).click();
    const exportDialog = page.locator(".export-accounts");
    await exportDialog.waitFor();
    await exportDialog.getByRole("button", { name: "取消", exact: true }).click();
    await exportDialog.waitFor({ state: "hidden" });
    result.checks.push("没有选中账号时仍能打开当前列表的导出弹窗");
    const exportFile = path.join(data, "accounts.xlsx");
    await app.evaluate(({ dialog }, filename) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: filename });
    }, exportFile);
    const { readXlsxSheets } = require("./profile-import-xlsx");
    for (const includeCredentials of [false, true]) {
      await page.getByRole("button", { name: "导出数据", exact: true }).click();
      const credentials = exportDialog.getByRole("checkbox", { name: "包含明文密码和 2FA 密钥" });
      assert.equal(await credentials.isChecked(), false);
      if (includeCredentials) await credentials.check();
      await exportDialog.getByRole("button", { name: "导出数据", exact: true }).click();
      await exportDialog.waitFor({ state: "hidden" });
      let hasSecret = false;
      for await (const rows of readXlsxSheets(await fs.readFile(exportFile), { maxRows: 2 }))
        hasSecret ||= rows.some(row => row.cells.some(cell => cell.text === "account-secret"));
      assert.equal(hasSecret, includeCredentials);
    }
    result.checks.push("真实保存 XLSX，默认摘要无密码，明确勾选才导出密码");
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
    const accountRow = page.getByRole("row").filter({ hasText: "edited@example.test" });
    await accountRow.hover();
    await accountRow.locator("button.row-hover-action").click();
    const picker = page.locator(".profile-select");
    await picker.getByText("账号关联窗口", { exact: true }).first().waitFor();
    const confirm = picker.getByRole("button", { name: "确认保存", exact: true });
    await waitUntil(() => confirm.isEnabled());
    await app.evaluate(({ ipcMain }) => {
      const original = ipcMain._invokeHandlers.get("rebuild:request");
      let failed = false;
      ipcMain.removeHandler("rebuild:request");
      ipcMain.handle("rebuild:request", (event, method, payload) => {
        if (!failed && method === "accounts:bind") {
          failed = true;
          return { ipcResult: 1, ok: false, error: { message: "测试账号关联保存失败" } };
        }
        return original(event, method, payload);
      });
    });
    await confirm.click();
    const saveError = picker.getByRole("alert");
    await saveError.waitFor();
    assert.equal(await saveError.textContent(), "测试账号关联保存失败");
    await confirm.click();
    await picker.waitFor({ state: "hidden" });
    const linked = await page.evaluate(() => globalThis.__localRequest("accounts:list"));
    assert.deepEqual(linked.rows[0].boundProfileIds, [profile.id]);
    result.checks.push("账号关联保存失败保留选择，重试后关联同一 UUID");
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
    const textExport = path.join(data, "roundtrip.txt");
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath });
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filePath] });
    }, textExport);
    await page.evaluate(id => globalThis.__localRequest("accounts:export", { ids: [id], format: "txt", includeCredentials: true }), id);
    const text = await fs.readFile(textExport, "utf8");
    await page.getByRole("button", { name: "添加账号", exact: true }).first().click();
    await page.getByText("模板导入", { exact: true }).click();
    const template = path.join(data, "account-import-template.xlsx");
    await app.evaluate(({ session }, filePath) => {
      session.defaultSession.once("will-download", (_event, item) => {
        item.setSavePath(filePath);
        item.once("done", (_event, state) => { globalThis.__accountTemplateDownloadState = state; });
      });
    }, template);
    await page.getByText("账号导入模板", { exact: true }).click();
    await waitUntil(() => app.evaluate(() => globalThis.__accountTemplateDownloadState));
    assert.equal(await app.evaluate(() => globalThis.__accountTemplateDownloadState), "completed");
    let hasExample = false;
    for await (const rows of readXlsxSheets(await fs.readFile(template), { maxRows: 2 })) {
      hasExample ||= rows.some(row => row.cells.some(cell => cell.text === "example@gmail.com"));
    }
    assert.ok(hasExample, "the downloaded workbook contains the example account");
    result.checks.push("首次下载账号导入模板按需加载 XLSX 工具，生成可读取的工作簿");
    await page.getByRole("button", { name: "上传文件", exact: true }).click();
    await page.getByText("roundtrip.txt", { exact: true }).waitFor();
    await page.locator(".upload-card").evaluate((element, contents) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(new File([contents], "roundtrip-dropped.txt", { type: "text/plain" }));
      element.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer }));
    }, text);
    await page.getByText("roundtrip-dropped.txt", { exact: true }).waitFor();
    await page.locator(".template-import").locator("..").getByRole("button", { name: "保存", exact: true }).click();
    await waitUntil(() => page.evaluate(() => globalThis.__localRequest("accounts:list").then(result => result.total === 2)));
    const imported = await page.evaluate(async previousId => {
      const { rows } = await globalThis.__localRequest("accounts:list");
      return globalThis.ops.accountGet(rows.find(row => row.id !== previousId).id);
    }, id);
    assert.equal(imported.username, "edited@example.test");
    assert.equal(imported.url, "https://accounts.example.test/");
    assert.equal(imported.password, "account-secret");
    result.checks.push("真实 TXT 导出经原生选择与拖放进入工作台，回导保留网址、用户名和密码");
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
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
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
