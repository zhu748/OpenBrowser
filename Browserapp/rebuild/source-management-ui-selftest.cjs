"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const net = require("node:net");
const { _electron: electron } = require("playwright");
const { unwrapIpcResult } = require("../shared/ipc-result");
const { createTestDirectory, openWorkspacePage, toggleTheme, waitUntil } = require("./selftest-helpers.cjs");
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");
const { readXlsxSheets } = require("./profile-import-xlsx");
const { workbookFixture, cell } = require("./selftest-profile-xlsx.cjs");

const appRoot = path.resolve(__dirname, "..");
const artifacts = evidenceDirectory();
const exact = (page, name) => page.getByRole("button", { name, exact: true });
const headline = (page, name) => page.getByRole("heading", { name, exact: true });
const row = (page, text) => page.getByRole("row").filter({ hasText: text });
const nativeRequest = async (page, method, payload = {}) => unwrapIpcResult(await page.evaluate(
  ({ method, payload }) => globalThis.rebuild.request(method, payload), { method, payload },
));

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function exerciseProjects(page, open) {
  await open("/projects/list", "/projects");
  await headline(page, "项目").waitFor();
  const create = async name => {
    await exact(page, "创建项目").click();
    await page.getByLabel("项目名称", { exact: true }).fill(name);
    await exact(page, "保存项目").click();
    await row(page, name).waitFor();
  };
  await create("交付项目");
  await create("空扩展项目");
  const [first, second] = await nativeRequest(page, "groups:list");
  await row(page, first.projectName).getByRole("button", { name: "重命名", exact: true }).click();
  await page.getByLabel("项目名称", { exact: true }).fill("项目迁移验收");
  await exact(page, "保存项目").click();
  await row(page, "项目迁移验收").waitFor();
  assert.deepEqual((await nativeRequest(page, "groups:list")).map(project => project.id), [first.id, second.id]);
  await row(page, second.projectName).getByRole("button", { name: "上移", exact: true }).click();
  await waitUntil(async () => (await nativeRequest(page, "groups:list"))[0].id === second.id);
  await row(page, "项目迁移验收").getByRole("button", { name: "固定到侧栏", exact: true }).click();
  await waitUntil(async () => (await nativeRequest(page, "groups:list", { pinnedOnly: true }))[0]?.id === first.id);
  await exact(page, "项目迁移验收").click();
  await headline(page, "项目迁移验收").waitFor();
  await exact(page, "在此项目创建窗口").click();
  await page.getByLabel("名称", { exact: true }).fill("管理源码验证窗口");
  assert.equal(await page.getByLabel("项目", { exact: true }).inputValue(), first.id);
  await exact(page, "创建").click();
  await row(page, "管理源码验证窗口").waitFor();
  const [profile] = await nativeRequest(page, "profiles:list");
  assert.equal(profile.projectId, first.id);
  return { first, second, profile };
}

async function exerciseAccounts(app, page, open, profile, data) {
  await open("/account/list", "/accounts");
  await headline(page, "平台账号").waitFor();
  await exact(page, "添加账号").click();
  await page.getByLabel("平台网址").fill("https://example.test/");
  await page.getByLabel("用户名").fill("local-account-fixture");
  await page.getByLabel("密码", { exact: true }).fill("only-fixture-password");
  await exact(page, "保存账号").click();
  const entry = row(page, "local-account-fixture");
  await entry.waitFor();
  assert.equal(await entry.getByText("only-fixture-password", { exact: true }).count(), 0);
  const [account] = (await nativeRequest(page, "accounts:list")).rows;
  assert.equal(account.platformPassword, undefined);
  await entry.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByLabel("用户名").fill("renamed-account-fixture");
  await exact(page, "保存账号").click();
  const renamed = row(page, "renamed-account-fixture");
  await renamed.waitFor();
  await renamed.getByRole("button", { name: "查看密码", exact: true }).click();
  await renamed.getByText("only-fixture-password", { exact: true }).waitFor();
  await renamed.getByRole("button", { name: "隐藏密码", exact: true }).click();
  await renamed.getByText("only-fixture-password", { exact: true }).waitFor({ state: "detached" });
  await renamed.getByRole("button", { name: "关联窗口", exact: true }).click();
  await page.getByRole("checkbox", { name: /管理源码验证窗口/ }).check();
  await exact(page, "保存关联").click();
  await waitUntil(async () => (await nativeRequest(page, "accounts:list")).rows[0].boundProfileIds.includes(profile.id));
  await renamed.getByText(/OPE-/).waitFor();

  const exported = path.join(data, "account-summary.xlsx");
  const imported = path.join(data, "account-import.xlsx");
  await fs.writeFile(imported, workbookFixture([
    '<row r="1">' + cell("A1", "平台") + cell("B1", "账号") + '</row>' +
    '<row r="2">' + cell("A2", "https://example.test/") + cell("B2", "account-from-file") + '</row>',
  ]));
  await app.evaluate(({ dialog }, paths) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: paths.exported });
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [paths.imported] });
  }, { exported, imported });
  await renamed.getByRole("checkbox").check();
  await exact(page, "导出 Excel").click();
  await exact(page, "选择导出位置").click();
  await page.getByText("已导出 1 个账号", { exact: true }).waitFor();
  for await (const [header, record] of readXlsxSheets(await fs.readFile(exported))) {
    assert.ok(header.cells.some(field => field.text === "密码"));
    assert.ok(record.cells.some(field => field.text === "renamed-account-fixture"));
    assert.ok(!record.cells.some(field => field.column === "C"), "default export excludes passwords");
  }
  await exact(page, "添加账号").click();
  await exact(page, "批量录入").click();
  await exact(page, "选择 TXT / XLSX").click();
  await page.getByText("account-import.xlsx · 1 个账号", { exact: true }).waitFor();
  await exact(page, "保存账号").click();
  await row(page, "account-from-file").waitFor();
}

async function exerciseExtensions(app, page, open, fixture, projects, mode) {
  await open("/extensions", "/extensions");
  await headline(page, "已安装扩展").waitFor();
  await page.getByRole("columnheader", { name: "来源", exact: true }).waitFor();
  await page.getByRole("columnheader", { name: "更新信息", exact: true }).waitFor();
  assert.equal(await page.getByLabel("每页条数").inputValue(), "10");
  const panel = page.locator('[aria-labelledby="extensions-title"]');
  await exact(page, "添加 Google 扩展").click();
  await page.getByRole("dialog", { name: "添加 Google 扩展" }).waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await app.evaluate(({ dialog }, selected) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selected] });
  }, fixture);
  const name = "OpenBrowser 源码扩展验收";
  await exact(page, "本地上传").click();
  await exact(page, "选择 ZIP / CRX").waitFor();
  await exact(page, "选择文件夹").click();
  await page.getByLabel("扩展名称").fill(name);
  await page.screenshot({ path: path.join(artifacts, "extensions-" + mode + "-upload.png") });
  await exact(page, "上传").click();
  await page.getByRole("checkbox", { name: "空扩展项目", exact: true }).check();
  await page.getByRole("checkbox", { name: "项目迁移验收", exact: true }).check();
  await exact(page, "保存分配").click();
  const entry = row(page, name);
  await entry.getByText("空扩展项目", { exact: true }).waitFor();
  await entry.getByText("项目迁移验收", { exact: true }).waitFor();
  await entry.getByText("本地上传", { exact: true }).waitFor();
  const installed = (await nativeRequest(page, "extensions:list")).rows.find(extension => extension.pluginName === name);
  assert.deepEqual(new Set(installed.projectIds), new Set([projects.first.id, projects.second.id]));
  const later = await nativeRequest(page, "profiles:create", { projectId: projects.second.id, windowName: "后建扩展窗口" });
  const native = await page.evaluate(() => globalThis.ops.extensionList());
  const extension = native.find(extension => extension.id === installed.id);
  assert.ok(extension.assignedProfileIds.includes(later.id));
  await page.getByLabel("工具栏固定方式 · " + name).click();
  await exact(page, "始终固定到工具栏").click();
  await waitUntil(async () => (await nativeRequest(page, "extensions:read", { pluginId: installed.id })).rows[0].fixedPlugin === "pin");
  await page.getByLabel("更多操作 · " + name).click();
  await exact(page, "分配项目").click();
  assert.equal(await page.getByRole("checkbox", { name: "空扩展项目", exact: true }).isChecked(), true);
  await exact(page, "取消").click();
  await page.getByLabel("安装到项目 · " + name).click();
  await page.getByRole("dialog", { name: "安装到项目" }).waitFor();
  await exact(page, "取消").click();
  await entry.getByRole("button", { name: "安全", exact: true }).click();
  await page.getByText("本地清单可读取。可以打开目录进一步检查扩展文件。", { exact: true }).waitFor();
  await exact(page, "关闭").click();

  await fs.writeFile(path.join(extension.path, "manifest.json"), JSON.stringify({ manifest_version: 3, name, version: "2.0.0" }));
  await entry.getByRole("button", { name: "检查更新", exact: true }).click();
  await exact(page, "更新到 v2.0.0").click();
  await entry.getByText("v2.0.0", { exact: true }).waitFor();
  assert.equal((await nativeRequest(page, "extensions:read", { pluginId: installed.id })).rows[0].pluginVersion, "2.0.0");
  await panel.screenshot({ path: path.join(artifacts, "management-" + mode + "-extensions.png") });
  if (mode === "standalone") await page.emulateMedia({ colorScheme: "dark" });
  else await toggleTheme(page);
  await waitUntil(() => page.locator("html").getAttribute("data-theme").then(theme => theme === "dark"));
  await panel.screenshot({ path: path.join(artifacts, "extensions-" + mode + "-dark.png") });
  if (mode === "standalone") await page.emulateMedia({ colorScheme: "light" });
  else await toggleTheme(page);

  const installFixture = async pluginName => {
    const { data } = await nativeRequest(page, "extensions:select", { kind: "dir" });
    const { localToken } = await nativeRequest(page, "extensions:stage", { pluginPath: data.pluginPath });
    return (await nativeRequest(page, "extensions:finish", { localToken, pluginName, pluginDesc: "分页验收" })).plugin_id;
  };
  const fixtureIds = [];
  for (let index = 1; index <= 11; index++) fixtureIds.push(await installFixture("分页扩展 " + index));
  await exact(page, "刷新").click();
  await exact(page, "下一页").click();
  await page.getByText("2 / 2", { exact: true }).waitFor();
  await page.getByRole("spinbutton", { name: /跳至第/ }).fill("1");
  await exact(page, "跳转").click();
  await page.getByText("1 / 2", { exact: true }).waitFor();
  await page.getByLabel("每页条数").selectOption("20");
  await page.getByText("1 / 1", { exact: true }).waitFor();
  const all = page.getByLabel("选择本页全部扩展");
  await all.check();
  assert.equal(await exact(page, "移除所选").isDisabled(), true, "内置扩展不可批量移除");
  await exact(page, "取消选择").click();
  await page.getByLabel("搜索扩展").fill("分页验收");
  await exact(page, "搜索").click();
  await page.getByText("共 11 个扩展", { exact: true }).waitFor();
  await all.check();
  await exact(page, "批量检查更新").click();
  await page.getByText("检查完成，清单版本没有变化", { exact: true }).waitFor();
  await exact(page, "移除所选").click();
  await page.getByText("移除选中的 11 个扩展并解除窗口关联？", { exact: true }).waitFor();
  await exact(page, "确认移除").click();
  await page.getByText("暂无匹配扩展", { exact: true }).waitFor();
  assert.ok((await nativeRequest(page, "extensions:list")).rows.every(extension => !fixtureIds.includes(extension.id)));
}

async function exerciseApi(page) {
  await headline(page, "API & MCP").waitFor();
  const initial = await nativeRequest(page, "api:get");
  const port = await freePort();
  await page.getByLabel("端口", { exact: true }).fill(String(port));
  if (!initial.open) await page.getByRole("checkbox", { name: "启用本地 API" }).check();
  await exact(page, "检查端口").click();
  await page.getByText("端口可用", { exact: true }).waitFor();
  await exact(page, "保存设置").click();
  await page.getByText("API 设置已保存", { exact: true }).waitFor();
  const endpoint = "http://127.0.0.1:" + port + "/api/v1/user/list";
  const http = async key => fetch(endpoint, { headers: { authorization: "Bearer " + key } });
  assert.equal((await http(initial.apiKey)).status, 200);
  await exact(page, "MCP 配置").click();
  const config = page.getByLabel("MCP 配置内容");
  await config.waitFor();
  assert.equal(JSON.parse(await config.inputValue()).mcpServers.openbrowser.env.OPENBROWSER_API_PORT, String(port));
  await exact(page, "重置密钥").click();
  await exact(page, "确认重置").click();
  await page.getByText("密钥已更新", { exact: true }).waitFor();
  await config.waitFor({ state: "detached" });
  const next = await nativeRequest(page, "api:get");
  assert.notEqual(next.apiKey, initial.apiKey);
  assert.equal((await http(initial.apiKey)).status, 401);
  assert.equal((await http(next.apiKey)).status, 200);
  await exact(page, "本地文档").click();
  await page.getByLabel("本地 API 文档").waitFor();
}

async function main() {
  const source = process.argv.includes("--source");
  const data = await createTestDirectory("source-management-");
  const result = { passed: false, mode: source ? "standalone" : "default", checks: [], errors: [], external: [] };
  const mode = result.mode;
  let app, page;
  try {
    const fixture = path.join(data, "test-extension");
    await fs.mkdir(fixture);
    await fs.writeFile(path.join(fixture, "manifest.json"), JSON.stringify({ manifest_version: 3, name: "Local source management fixture", version: "1.0.0" }));
    app = await electron.launch({
      executablePath: require("electron"),
      args: [...(process.platform === "linux" ? ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu"] : []), appRoot],
      env: { ...process.env, OPENBROWSER_RENDERER: source ? "source" : "", OPENBROWSER_USER_DATA: data,
        OPENBROWSER_MASTER_KEY_FILE: path.join(data, "master.key"), OPENBROWSER_API_PORT: "0" },
    });
    page = await app.firstWindow();
    page.setDefaultTimeout(16000);
    await page.setViewportSize({ width: 1280, height: 900 });
    page.on("pageerror", error => result.errors.push(error.message));
    page.on("console", event => { if (event.type() === "error") result.errors.push(event.text()); });
    page.on("request", request => { if (/^https?:|^wss?:/.test(request.url())) result.external.push(request.url()); });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const open = (hybrid, standalone) => source
      ? page.evaluate(route => { location.hash = route; }, standalone)
      : page.evaluate(path => globalThis.__router.push({ path, query: { renderer: 'source' } }), hybrid);
    const projects = await exerciseProjects(page, open);
    result.checks.push("项目创建、重命名保序、重排、固定和项目内创建窗口");
    await exerciseAccounts(app, page, open, projects.profile, data);
    result.checks.push("账号添加、编辑保留密码、按需查看密码、真实窗口关联和 Excel 往返");
    await exerciseExtensions(app, page, open, fixture, projects, mode);
    result.checks.push("扩展上传、分配、固定、清单检查、版本更新、分页跳转、批量检查和移除，以及浅色和深色截图");
    const api = source ? await open("/api-keys", "/api-keys").then(() => page) : await openWorkspacePage(app, "/api-keys?renderer=source");
    api.setDefaultTimeout(16000);
    await exerciseApi(api);
    result.checks.push("API 换端口、旧密钥失效、新密钥访问以及 MCP 配置");
    await api.emulateMedia({ reducedMotion: "no-preference" });
    const settingsForm = api.locator("form.editor").first();
    assert.equal(await settingsForm.evaluate(element => getComputedStyle(element).animationDuration), "0.15s");
    await api.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    assert.equal(await settingsForm.evaluate(element => getComputedStyle(element).animationName), "none");
    await api.locator('[aria-labelledby="api-title"]').screenshot({ path: path.join(artifacts, "management-" + mode + "-api.png") });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.external, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    result.alerts = await page?.locator('[role="alert"]').allTextContents().catch(() => []);
    throw error;
  } finally {
    try { await app?.close(); }
    finally {
      await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
      await fs.writeFile(path.join(artifacts, "source-management-" + mode + ".json"), JSON.stringify(result, null, 2));
    }
  }
  console.log("SOURCE MANAGEMENT UI OK (" + mode + ")");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
