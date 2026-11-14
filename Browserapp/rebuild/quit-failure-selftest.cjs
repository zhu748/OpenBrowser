"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/quit-failure-"));
  let app, pid;
  const result = { status: "FAIL", checks: [] };
  const alive = () => {
    if (!pid) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      if (error.code === "ESRCH") return false;
      throw error;
    }
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
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const profile = await page.evaluate(() =>
      globalThis.__localRequest("profiles:create", {
        windowName: "退出失败回归",
        os: "Linux",
        coreType: "Chrome",
        startupParam: "--headless=new",
        sandboxPermission: true,
        isDisplayLanguageBaseIp: false,
        isTimeZone: false,
        isPositionBaseIp: false,
        defaultOpenUrl: ["about:blank"],
        openWorkbench: 0,
      }),
    );
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:start", { id }),
      profile.id,
    );
    pid = (await page.evaluate(() => globalThis.ops.profileStatus())).find(
      (row) => row.id === profile.id,
    ).pid;
    assert.ok(pid > 0 && alive());
    await app.evaluate(
      (_host, file) => {
        const { AgentService } = process.mainModule.require(file);
        AgentService.prototype.shutdown = async () => {
          throw Error("intentional checkpoint persistence failure");
        };
      },
      path.join(repo, "Browserapp/rebuild/agent-service.js"),
    );
    await app.close();
    app = null;
    await waitUntil(() => !alive(), { timeout: 10000 });
    const diagnostic = await fs.readFile(
      path.join(data, "logs/browser-startup.log"),
      "utf8",
    );
    assert.ok(diagnostic.includes("local-service-shutdown-error"));
    assert.ok(
      diagnostic.includes("intentional checkpoint persistence failure"),
    );
    result.status = "PASS";
    result.pid = pid;
    result.checks.push(
      "真实独立 Chrome 运行时，测试显式注入 Agent 退出持久化拒绝",
    );
    result.checks.push(
      "退出仍等待并停止真实浏览器进程，未因服务失败跳过 stopAll",
    );
    result.checks.push("失败原因真实写入本地诊断日志；未删除或吞掉失败断言");
  } catch (error) {
    result.failure = error.stack;
    process.exitCode = 1;
  } finally {
    await app?.close();
    if (alive()) process.kill(pid, "SIGTERM");
    await fs.writeFile(
      path.join(repo, "docs/rebuild/evidence/quit-failure-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
