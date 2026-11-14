const { toggleTheme } = require("./selftest-helpers.cjs");
"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(
    path.join(repo, "work/rebuild/dialog-security-"),
  );
  let app;
  const result = { status: "FAIL", checks: [] };
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
    const page = await app.firstWindow();
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const reject = async (method, payload, pattern) => {
      const message = await page.evaluate(
        async (p) => {
          try {
            await globalThis.__localRequest(p.method, p.payload);
            return "unexpected success";
          } catch (error) {
            return error.message;
          }
        },
        { method, payload },
      );
      assert.match(message, pattern);
    };
    await reject("ui:dialog:open", { kind: "../../main" }, /未知/);
    await reject("ui:dialog:open", { kind: "__proto__" }, /未知/);
    await reject("ui:dialog:open", { kind: "constructor" }, /未知/);
    await reject(
      "ui:dialog:open",
      { kind: "preferences", tab: "../../main" },
      /无效/,
    );
    await reject("ui:dialog:resize", { width: 900, height: 700 }, /来源/);
    await reject("ui:dialog:close", {}, /来源/);
    assert.equal((await app.windows()).length, 1);
    result.checks.push(
      "未知弹窗/标签与主窗口冒充子窗 resize/close 被拒绝，不创建窗口或误关主窗",
    );
    const next = app.waitForEvent("window").then(async (dialog) => {
      await dialog.setViewportSize({ width: 500, height: 500 });
      return dialog;
    });
    await toggleTheme(page);
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await page.evaluate(() =>
      globalThis.electronAPI.send("syncControl:openPreferencesDialog"),
    );
    const dialog = await next;
    await dialog.getByRole("tab", { name: "基础设置", exact: true }).waitFor();
    await dialog.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    await dialog.screenshot({ path: path.join(repo, "docs/rebuild/evidence/sync-preferences-dark.png") });
    await toggleTheme(page);
    await dialog.waitForFunction(() => document.documentElement.dataset.theme === "light");
    result.checks.push("原主题在独立弹窗继承深色，并通过原 BroadcastChannel 跟随主窗切换为浅色");
    assert.ok(
      await dialog.evaluate(() => globalThis.__localRequest("settings:get")),
    );
    assert.match(
      await dialog.evaluate(async () => {
        try {
          await globalThis.__localRequest("ui:dialog:resize", {
            width: Infinity,
            height: 300,
          });
          return "unexpected success";
        } catch (error) {
          return error.message;
        }
      }),
      /尺寸/,
    );
    result.checks.push("已注册原文档子窗可以使用受信 IPC，非法尺寸被拒绝");
    await app.evaluate(async ({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows().find((win) =>
        win.webContents.getURL().includes("dialog=preferences"),
      );
      await window.loadURL("data:text/html,<title>changed document</title>");
    });
    assert.match(
      await dialog.evaluate(async () => {
        try {
          await globalThis.rebuild.request("settings:get");
          return "unexpected success";
        } catch (error) {
          return error.message;
        }
      }),
      /untrusted IPC document/,
    );
    result.checks.push(
      "已注册窗口导航到其他文档后，精确文档 IPC 校验仍拒绝请求",
    );
    await dialog.close();
    const rogueNext = app.waitForEvent("window");
    await app.evaluate(
      async ({ BrowserWindow }, preload) => {
        const window = new BrowserWindow({
          show: false,
          webPreferences: {
            preload,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        });
        await window.loadURL(
          "data:text/html,<title>unregistered window</title>",
        );
      },
      path.join(repo, "Browserapp/preload.js"),
    );
    const rogue = await rogueNext;
    assert.match(
      await rogue.evaluate(async () => {
        try {
          await globalThis.ops.getInfo();
          return "unexpected success";
        } catch (error) {
          return error.message;
        }
      }),
      /untrusted IPC sender/,
    );
    await rogue.close();
    result.checks.push(
      "相同 preload 的未注册 Electron 窗口仍无法调用原 ops IPC",
    );
    assert.equal((await app.windows()).length, 1);
    result.status = "PASS";
  } catch (error) {
    result.failure = error.stack;
    process.exitCode = 1;
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(repo, "docs/rebuild/evidence/dialog-security-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
