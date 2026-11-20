"use strict";
const { evidencePath } = require("./compiler/evidence-path.cjs");

const { createTestDirectory } = require("./selftest-helpers.cjs");
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const { once } = require("node:events");
const repo = path.resolve(__dirname, "../..");
const fatalHang = process.argv.includes("--fatal-hang");
const normalHang = process.argv.includes("--normal-hang");
(async () => {
  const data = await createTestDirectory('quit-failure-');
  let app, pid, child;
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
      env: { ...process.env, OPENBROWSER_USER_DATA: data, OPENBROWSER_API_PORT: "0",
        OPENBROWSER_MASTER_KEY_FILE: path.join(data, "master.key") },
    });
    child = app.process();
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
      (_host, { file, hang }) => {
        const { AgentService } = process.mainModule.require(file);
        AgentService.prototype.shutdown = async () => {
          if (hang) return new Promise(() => {});
          throw Error("intentional checkpoint persistence failure");
        };
      },
      { file: path.join(repo, "Browserapp/rebuild/agent-service.js"), hang: fatalHang || normalHang },
    );
    if (fatalHang) {
      const closed = once(child, "close", { signal: AbortSignal.timeout(25000) });
      await app.evaluate(() => { process.emit("uncaughtException", Error("intentional fatal shutdown fixture")); })
        .catch(error => { assert.match(error.message, /closed|destroyed|disconnected/i); });
      await waitUntil(() => !alive(), { timeout: 10000 });
      assert.equal(child.exitCode, null, "browser drain cannot depend on the stalled Agent finishing or the host exiting");
      const [code] = await closed;
      app = null;
      assert.equal(code, 1);
      result.status = "PASS";
      result.pid = pid;
      result.checks.push("Agent 关闭永久挂起时，致命异常仍先停止真实独立 Chrome，再由关闭期限以状态 1 退出宿主");
      return;
    }
    if (normalHang) {
      const closed = once(child, "close", { signal: AbortSignal.timeout(30000) });
      await app.evaluate(({ app: host }) => { host.quit(); });
      const [code] = await closed;
      assert.equal(code, 0);
      assert.equal(alive(), false, "normal quit must stop the external browser before the host exits");
      app = null;
    } else {
      await app.close();
      app = null;
    }
    await waitUntil(() => !alive(), { timeout: 10000 });
    const diagnostic = await fs.readFile(
      path.join(data, "logs/browser-startup.log"),
      "utf8",
    );
    assert.ok(diagnostic.includes("local-service-shutdown-error"));
    assert.ok(diagnostic.includes(normalHang ? "Quit local-agent timed out" : "intentional checkpoint persistence failure"));
    result.status = "PASS";
    result.pid = pid;
    result.checks.push(
      normalHang ? "真实独立 Chrome 运行时，普通退出等待 Agent 到达时限" : "真实独立 Chrome 运行时，测试显式注入 Agent 退出持久化拒绝",
    );
    result.checks.push(
      "退出仍等待并停止真实浏览器进程，未因服务失败跳过 stopAll",
    );
    result.checks.push("失败原因真实写入本地诊断日志；未删除或吞掉失败断言");
  } catch (error) {
    result.failure = error.stack;
    process.exitCode = 1;
  } finally {
    if (app && child?.exitCode === null) {
      if (fatalHang || normalHang) child.kill("SIGKILL");
      else await app.close();
    }
    if (alive()) process.kill(pid, "SIGTERM");
    await fs.writeFile(
      evidencePath(fatalHang ? "quit-fatal-hang-selftest.json" : normalHang ? "quit-normal-hang-selftest.json" : "quit-failure-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
