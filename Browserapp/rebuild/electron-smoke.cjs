const { waitUntil, toggleTheme } = require("./selftest-helpers.cjs");
("use strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { _electron: electron } = require("playwright");
const { unwrapIpcResult } = require("../shared/ipc-result");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const evidence = path.join(repo, "docs/rebuild/evidence");
  await fs.mkdir(evidence, { recursive: true });
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/ui-smoke-"));
  let app;
  const result = {
    passed: false,
    viewport: { width: 1280, height: 860 },
    errors: [],
    externalRequests: [],
    checks: [],
  };
  let phase = "startup";
  try {
    const env = { ...process.env, OPENBROWSER_USER_DATA: data };
    delete env.OPENBROWSER_ROXY_UI;
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        path.join(repo, "Browserapp"),
      ],
      env,
      timeout: 30000,
    });
    const page = await app.firstWindow();
    await page.setViewportSize(result.viewport);
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
    assert.match(page.url(), /^obui:\/\/app\/index\.html#\/browser\/list$/);
    result.checks.push("真实 Electron 加载本地原版窗口列表，无登录页");
    await page.screenshot({ path: path.join(evidence, "workbench-light.png") });
    await toggleTheme(page);
    await page.waitForTimeout(250);
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.screenshot({ path: path.join(evidence, "workbench-dark.png") });
    result.checks.push("真实深色主题切换");
    await toggleTheme(page);
    const row = unwrapIpcResult(
      await page.evaluate(() =>
        globalThis.rebuild.request("profiles:create", {
          windowName: "UI smoke profile",
          coreType: "Chrome",
          os: "Linux",
        }),
      ),
    );
    result.backendCreateId = row.id;
    const edit = unwrapIpcResult(
      await page.evaluate(
        (id) => globalThis.rebuild.request("profiles:read", { id }),
        row.id,
      ),
    );
    unwrapIpcResult(
      await page.evaluate(
        (p) => globalThis.rebuild.request("profiles:update", p),
        {
          id: row.id,
          rev: edit.rev,
          windowName: "UI smoke profile",
          windowRemark: "new",
        },
      ),
    );
    const stale = await page.evaluate(
      (p) => globalThis.rebuild.request("profiles:update", p),
      { id: row.id, rev: edit.rev, windowName: "stale" },
    );
    assert.equal(stale.ok, false);
    assert.equal(stale.error.code, "PROFILE_STALE_REV");
    result.checks.push(
      "真实 Electron IPC 保留过期编辑错误码 PROFILE_STALE_REV",
    );

    phase = "profile-list";
    await page.reload();
    await page
      .getByText("UI smoke profile", { exact: true })
      .first()
      .waitFor({ timeout: 15000 });
    await page.screenshot({
      path: path.join(evidence, "workbench-profile.png"),
    });
    result.checks.push(
      "真实 IPC 新增的数据能在原版列表显示（不是表单端到端创建验收）",
    );
    phase = "create";
    await page.evaluate(() => globalThis.__router.push("/browser/create"));
    await page.waitForTimeout(2500);
    result.installedKernels = unwrapIpcResult(
      await page.evaluate(() => globalThis.rebuild.request("kernels:list")),
    );
    await page.screenshot({ path: path.join(evidence, "create-light.png") });
    result.createText = await page.locator("body").innerText();
    if (!result.installedKernels.length) {
      assert.equal(
        await page
          .getByRole("button", { name: "创建窗口", exact: true })
          .last()
          .isDisabled(),
        true,
      );
      result.checks.push("无内核时禁用创建按钮，保留失败门槛");
    }
    assert.ok(
      result.installedKernels.length > 0,
      "没有已安装内核，无法完成创建/启动的端到端验收",
    );
    phase = "create-submit";
    await page.locator("input").first().fill("原表单创建验收");
    await page
      .locator("textarea")
      .first()
      .fill(
        '[{"name":"fixture-cookie","value":"local-secret","domain":"example.test","path":"/"}]',
      );
    await page
      .getByRole("button", { name: "创建窗口", exact: true })
      .last()
      .click();
    await page.getByText("原表单创建验收", { exact: true }).first().waitFor();
    const createdRows = unwrapIpcResult(
      await page.evaluate(() => globalThis.rebuild.request("profiles:list")),
    );
    const created = createdRows.find(
      (row) => row.windowName === "原表单创建验收",
    );
    assert.ok(created);
    const setup = unwrapIpcResult(
      await page.evaluate(
        (id) => globalThis.rebuild.request("profiles:read", { id }),
        created.id,
      ),
    );
    assert.ok(setup.cookie.includes("fixture-cookie"));
    result.checks.push(
      "原版创建表单通过真实按钮保存名称和 Cookie，并在原列表显示",
    );
    // The container has no display server. Only this isolated test profile uses the backend's existing headless flag.
    unwrapIpcResult(
      await page.evaluate(
        (profile) => globalThis.rebuild.request("profiles:update", profile),
        { ...setup, startupParam: "--headless=new", sandboxPermission: true },
      ),
    );
    phase = "start";
    let uiRow = page.getByRole("row").filter({ hasText: "原表单创建验收" });
    await uiRow.getByRole("button", { name: "打开窗口", exact: true }).click();
    await waitUntil(
      () =>
        page.evaluate(
          async (id) =>
            (await globalThis.rebuild.request("profiles:list")).value.find(
              (row) => row.id === id,
            )?.openStatus,
          created.id,
        ),
      { timeout: 30000 },
    );
    await uiRow.getByRole("button", { name: "查看", exact: true }).waitFor();
    const running = (
      await page.evaluate(() => globalThis.ops.profileStatus())
    ).find((row) => row.id === created.id);
    assert.ok(running.pid > 0);
    assert.match(running.executable, /kernels\//);
    result.nativeProcess = { pid: running.pid, executable: running.executable };
    await page.screenshot({ path: path.join(evidence, "window-running.png") });
    result.checks.push(
      "原列表打开按钮启动真实独立 Chrome，状态变为查看，记录实际 PID/CDP 端口",
    );
    phase = "stop";
    await uiRow
      .getByText("原表单创建验收", { exact: true })
      .click({ button: "right" });
    await page.getByText("关闭窗口", { exact: true }).last().click();
    await waitUntil(
      () =>
        page.evaluate(
          async (id) =>
            !(await globalThis.rebuild.request("profiles:list")).value.find(
              (row) => row.id === id,
            )?.openStatus,
          created.id,
        ),
      { timeout: 30000 },
    );
    await uiRow
      .getByRole("button", { name: "打开窗口", exact: true })
      .waitFor();
    assert.equal(
      (await page.evaluate(() => globalThis.ops.profileStatus())).find(
        (row) => row.id === created.id,
      ).running,
      false,
    );
    result.checks.push(
      "原列表右键菜单关闭窗口，后端确认进程停止，按钮恢复可启动状态",
    );
    await page.screenshot({ path: path.join(evidence, "window-stopped.png") });
    phase = "edit";
    await uiRow
      .getByText("原表单创建验收", { exact: true })
      .click({ button: "right" });
    await page.getByText("编辑窗口", { exact: true }).last().click();
    await page
      .getByRole("button", { name: "保存", exact: true })
      .last()
      .waitFor();
    await page.locator("input").first().fill("原表单编辑验收");
    await page
      .getByRole("button", { name: "保存", exact: true })
      .last()
      .click();
    await page.getByText("原表单编辑验收", { exact: true }).first().waitFor();
    result.checks.push("原版编辑表单读取完整配置，真实保存后列表显示新名称");
    await page.screenshot({ path: path.join(evidence, "window-edited.png") });
    phase = "delete";
    await page.evaluate(() => {
      globalThis.__localRequests = [];
      globalThis.__localApiCalls = [];
    });
    uiRow = page.getByRole("row").filter({ hasText: "原表单编辑验收" });
    await uiRow
      .getByText("原表单编辑验收", { exact: true })
      .click({ button: "right" });
    await page.getByText("删除窗口", { exact: true }).last().click();
    await page
      .getByRole("button", { name: /^(确认|删除)$/ })
      .last()
      .click();
    await waitUntil(
      () =>
        page.evaluate(
          async (id) =>
            !(await globalThis.rebuild.request("profiles:list")).value.some(
              (row) => row.id === id,
            ),
          created.id,
        ),
      {},
    );
    assert.ok(
      unwrapIpcResult(
        await page.evaluate(() => globalThis.rebuild.request("profiles:trash")),
      ).some((row) => row.id === created.id),
    );
    result.checks.push("原删除入口将窗口移入真实回收站");
    phase = "restore";
    await page.getByText("回收站", { exact: true }).click();
    const trashedRow = page
      .getByRole("row")
      .filter({ hasText: "原表单编辑验收" });
    await trashedRow
      .getByText("原表单编辑验收", { exact: true })
      .click({ button: "right" });
    await page.getByText("恢复", { exact: true }).last().click();
    await waitUntil(
      () =>
        page.evaluate(
          async (id) =>
            (await globalThis.rebuild.request("profiles:list")).value.some(
              (row) => row.id === id,
            ),
          created.id,
        ),
      {},
    );
    assert.ok(
      !unwrapIpcResult(
        await page.evaluate(() => globalThis.rebuild.request("profiles:trash")),
      ).some((row) => row.id === created.id),
    );
    result.checks.push("原回收站恢复入口恢复真实窗口，不经过云端或额度检查");
    await page.screenshot({
      path: path.join(evidence, "recycle-restored.png"),
    });
    assert.equal(result.externalRequests.length, 0, "界面不应发起任何外部请求");
    result.checks.push("探针监听期间未观察到前端外部请求");
    assert.equal(result.errors.length, 0, "页面出现错误，完整 UI 验收失败");
    assert.ok(
      result.installedKernels.length > 0,
      "没有已安装内核，无法完成创建/启动的端到端验收",
    );
    result.passed = true;
  } catch (error) {
    result.failure = error.message;
    if (app) {
      const p = await app.firstWindow();
      result.failureBody = await p.locator("body").innerText();
      result.calls = await p.evaluate(() => ({
        requests: globalThis.__localRequests,
        api: globalThis.__localApiCalls,
      }));
      await p.screenshot({ path: path.join(evidence, "ui-failure.png") });
    }
    process.exitCode = 1;
  } finally {
    if (app) await app.close();
    await fs.writeFile(
      path.join(evidence, "ui-smoke.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(
      JSON.stringify(
        {
          passed: result.passed,
          checks: result.checks,
          errors: result.errors,
          failure: result.failure,
        },
        null,
        2,
      ),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
