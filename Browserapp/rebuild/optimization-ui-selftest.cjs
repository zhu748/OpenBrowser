"use strict";
const { openWorkspacePage, waitUntil } = require("./selftest-helpers.cjs");
const assert = require("node:assert/strict"), fs = require("node:fs/promises"),
  path = require("node:path"), os = require("node:os"), vm = require("node:vm");
const acorn = require("acorn"), walk = require("acorn-walk");
async function checkSaveFailure() {
  const source = await fs.readFile(path.join(__dirname, "../roxy-ui/assets/edit-IaDdchpD.js"), "utf8");
  let handler;
  walk.simple(acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" }), {
    FunctionDeclaration(node) { if (node.id?.name === "$" && node.async) handler = source.slice(node.start, node.end); },
  });
  assert(handler);
  const context = { de() {}, X: { value: true }, W: { value: [[]] }, Y: { waitUntilReady: async () => {} }, n: () => ({}), ee: value => value,
    K: { value: {} }, G: { value: {} }, E: async value => value, R: { value: {} }, O: value => value, J: { value: false },
    t: { window: { userMdfWindowInfoSingleV2Create: async () => { throw Object.assign(Error("conflict"), { code: "PROFILE_STALE_REV" }); } } } };
  await assert.rejects(vm.runInNewContext(handler + "; $()", context), { code: "PROFILE_STALE_REV" });
  assert.equal(context.J.value, false, "a rejected save releases the loading state");
}
async function main() {
  await checkSaveFailure();
  if (process.argv.includes("--handler-only")) { console.log("EDIT_SAVE_LIFECYCLE OK"); return; }
  const { _electron: electron } = require("playwright");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-ui-optimization-"));
  let app;
  try {
    app = await electron.launch({ executablePath: require("electron"),
      args: [...(process.platform === "linux" ? ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu"] : []), path.resolve(__dirname, "..")],
      env: { ...process.env, OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: "0", OPENBROWSER_MASTER_KEY_FILE: path.join(root, "master.key") }, timeout: 30000 });
    let page = await app.firstWindow();
    await page.waitForFunction(() => !!globalThis.__router, null, { timeout: 30000 });
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler("kernel:list-versions");
      ipcMain.handle("kernel:list-versions", (_event, family) => {
        globalThis.__versionRequestCount = (globalThis.__versionRequestCount || 0) + 1;
        if (family === "firefox") return [{ version: "999.0" }];
        return new Promise((resolve, reject) => { globalThis.__pendingVersions = { resolve, reject }; });
      });
    });
    await page.evaluate(() => globalThis.__router.push("/kernels"));
    await page.getByRole("heading", { name: "已安装内核", exact: true }).waitFor();
    const type = page.getByLabel("内核类型", { exact: true }), version = page.getByLabel("内核版本", { exact: true }),
      load = page.getByRole("button", { name: "获取可下载版本", exact: true });
    await load.click();
    assert(await load.isDisabled(), "duplicate discovery is disabled");
    await type.selectOption("firefox");
    await app.evaluate(() => globalThis.__pendingVersions.resolve([{ version: "145.0.100.0" }]));
    await load.waitFor({ state: "visible" });
    await waitUntil(async () => !(await load.isDisabled()));
    assert.equal(await version.locator("option").count(), 0, "late Chrome versions never populate Firefox");
    await load.click();
    await waitUntil(async () => (await version.inputValue()) === "999.0");
    await type.selectOption("chromium"); await load.click(); await type.selectOption("firefox");
    await app.evaluate(() => globalThis.__pendingVersions.reject(Error("obsolete Chrome failure")));
    await waitUntil(async () => !(await load.isDisabled()));
    assert.equal(await page.getByRole("alert").filter({ hasText: "obsolete Chrome failure" }).count(), 0);
    // The real bridge now transfers only a page, with a preserved total count.
    await page.evaluate(async () => {
      for (let i = 0; i < 15; i++) await globalThis.__localRequest("profiles:create", { windowName: "UI page " + i, os: "Linux" });
    });
    const result = await page.evaluate(() => globalThis.__localApi.window.userGetWindowInfoListList({ page_index: 2, page_size: 5 }));
    assert.equal(result.data.total, 15); assert.equal(result.data.rows.length, 5);
    await app.evaluate(({ ipcMain }) => {
      const original = ipcMain._invokeHandlers.get("rebuild:request");
      ipcMain.removeHandler("rebuild:request");
      ipcMain.handle("rebuild:request", (event, method, payload) => {
        if (method === "agent:config:get" || method === "agent:config:set")
          return new Promise(resolve => { globalThis.__configResponse = value => resolve({ ipcResult: 1, ok: true, value }); });
        return original(event, method, payload);
      });
    });
    page = await openWorkspacePage(app, '/agent-console/settings');
    const model = page.getByLabel("模型名称", { exact: true }), save = page.getByRole("button", { name: "保存设置", exact: true });
    await model.waitFor(); assert(await model.isDisabled()); assert(await save.isDisabled());
    await app.evaluate(() => globalThis.__configResponse({ provider: "ollama", baseUrl: "http://127.0.0.1:11434", model: "loaded-model", hasApiKey: false }));
    await page.waitForFunction(() => !document.querySelector('[aria-label="模型名称"]')?.disabled);
    await model.fill("saved-model"); await save.click(); await model.fill("newer-draft");
    await app.evaluate(() => globalThis.__configResponse({ hasApiKey: false }));
    await page.waitForFunction(() => ![...document.querySelectorAll("button")].find(button => button.textContent.trim() === "保存设置")?.disabled);
    assert.equal(await model.inputValue(), "newer-draft");
    assert.equal(await page.getByText("设置已保存", { exact: true }).count(), 0, "a late acknowledgement cannot mark a newer draft saved");
    console.log("OPTIMIZATION_UI_SELFTEST OK (real Electron preload/IPC, obsolete kernel response/error isolation, bounded profile page, edit-save exception recovery, Agent settings load/save draft races)");
  } finally { await app?.close(); await fs.rm(root, { recursive: true, force: true, maxRetries: 3 }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
