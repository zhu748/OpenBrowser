"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  http = require("node:http"),
  crypto = require("node:crypto"),
  { execFile } = require("node:child_process"),
  { promisify } = require("node:util"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(
      path.join(repo, "work/rebuild/cookie-robot-ui-"),
    ),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = {
      passed: false,
      checks: [],
      errors: [],
      externalRequests: [],
      data,
    },
    received = [];
  let app, page;
  const server = http.createServer((req, res) => {
    received.push(req.url);
    if (req.url.startsWith("/image")) {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
          "base64",
        ),
      );
      return;
    }
    if (req.url.startsWith("/clip")) {
      res.writeHead(200, { "Content-Type": "video/mp4" });
      res.end(Buffer.alloc(1024));
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/html;charset=utf-8",
      "Set-Cookie": "robot_visited=true; Path=/; Max-Age=86400",
    });
    res.end(
      `<!doctype html><html><title>Cookie Robot fixture</title><style>body{margin:0}main{height:300px;overflow-y:auto}article{height:2800px}</style><main id="app" onscroll="if(this.scrollTop>=this.scrollHeight-this.clientHeight-10)document.cookie='robot_bottom=true; Path=/; Max-Age=86400'"><article>Robot scroll target<img src="/image${req.url}"><video muted preload="auto" src="/clip${req.url}"></video></article></main></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + server.address().port;
  const jobs = () =>
    page.evaluate(() => globalThis.__localRequest("cookie-robot:list"));
  try {
    // Keep the verified fixture outside disposable per-run data. The digest is
    // the previously recorded official archive, never a newly trusted download.
    const archiveRoot = path.join(
        repo,
        "work/rebuild/fixtures/firefox-160.0",
      ),
      archiveFile = path.join(archiveRoot, "firefox-160.0-linux-x86_64.tar.xz"),
      url = "https://download-installer.cdn.mozilla.net/pub/firefox/releases/160.0/linux-x86_64/en-US/firefox-160.0.tar.xz",
      sha256 = "fde774e9757c8878534c05ec210db592bf6a1b244c57941ffb2e364c04f35fcd";
    let archive;
    try { archive = await fs.readFile(archiveFile); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      archive = (await require("../network/http-request").requestBuffer(url, {
        maxBytes: 160 * 1024 * 1024, timeoutMs: 120000, environmentProxy: true,
        validateStatus: status => assert.equal(status, 200),
      })).buffer;
      assert.equal(crypto.createHash("sha256").update(archive).digest("hex"), sha256);
      await fs.mkdir(archiveRoot, { recursive: true });
      const temporary = archiveFile + "." + process.pid + ".tmp";
      try { await fs.writeFile(temporary, archive); await fs.rename(temporary, archiveFile); }
      finally { await fs.rm(temporary, { force: true }); }
    }
    assert.equal(crypto.createHash("sha256").update(archive).digest("hex"), sha256);
    result.kernelFixture = { url, sha256, archive: path.relative(repo, archiveFile) };
    const tree = path.join(data, "kernels/firefox/160.0");
    await fs.mkdir(tree, { recursive: true });
    await promisify(execFile)(
      "tar",
      [
        "-xJf",
        path.join(archiveRoot, "firefox-160.0-linux-x86_64.tar.xz"),
        "-C",
        tree,
      ],
      { timeout: 60000 },
    );
    await fs.writeFile(
      path.join(tree, "kernel.json"),
      JSON.stringify({
        version: "160.0",
        engine: "firefox",
        source: "mozilla",
      }),
    );
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
        OPENBROWSER_USER_DATA: data,
        OPENBROWSER_HEADLESS: "",
      },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 960 });
    page.on("pageerror", (error) => result.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    // Observe the actual service instance without replacing any command or
    // browser response. This permits native spawn-argument/BiDi checks below.
    await app.evaluate(
      (_host, file) => {
        const { CookieRobot } = process.mainModule.require(file),
          original = CookieRobot.prototype.request;
        globalThis.__robotCdp = process.mainModule.require(
          process.mainModule.require("node:path").resolve(file, "../../cdp.js"),
        );
        CookieRobot.prototype.request = function (...args) {
          globalThis.__robotProbe = this;
          return original.apply(this, args);
        };
      },
      path.join(repo, "Browserapp/rebuild/cookie-robot.js"),
    );
    const profiles = [];
    for (const coreType of ["Chrome", "Firefox"]) {
      profiles.push(
        await page.evaluate(
          (type) =>
            globalThis.__localRequest("profiles:create", {
              windowName: "Cookie Robot " + type,
              os: "Linux",
              coreType: type,
              ...(type === "Firefox" ? { coreVersion: "160.0" } : {}),
              isDisplayLanguageBaseIp: false,
              isTimeZone: false,
              isPositionBaseIp: false,
              defaultOpenUrl: ["about:blank"],
              openWorkbench: 0,
            }),
          coreType,
        ),
      );
    }
    for (const profile of profiles) {
      await page
        .getByText(profile.windowName, { exact: true })
        .click({ button: "right" });
      await page.getByText("Cookie 机器人", { exact: true }).last().click();
      const form = page.locator(".p-dialog");
      await form
        .locator("textarea")
        .fill(origin + "/" + profile.coreType.toLowerCase());
      await form.getByText("更多设置", { exact: true }).click();
      const fields = form.locator("input.p-inputnumber-input");
      assert.equal(await fields.count(), 4);
      for (const [index, value] of ["1000", "1000", "0", "0"].entries())
        await fields.nth(index).fill(value);
      const switches = form.getByRole("switch");
      result.switches = await switches.count();
      assert.equal(await switches.count(), 4);
      for (const index of [0, 1, 3]) {
        await switches.nth(index).locator("../..").click();
        assert.ok(await switches.nth(index).isChecked());
      }
      await page.screenshot({
        path: path.join(
          evidence,
          "cookie-robot-" + profile.coreType.toLowerCase() + ".png",
        ),
      });
      await form
        .getByRole("button", { name: "开始生成 Cookie", exact: true })
        .click();
      await form.waitFor({ state: "hidden" });
      const job = await waitUntil(async () =>
        (await jobs()).find((row) => row.profileId === profile.id),
      );
      await waitUntil(
        async () =>
          (await page.evaluate(() => globalThis.ops.profileStatus())).some(
            (row) => row.id === profile.id && row.running,
          ),
        { timeout: 90000 },
      );
      const native = await app.evaluate((_host, id) => {
        const item = globalThis.__robotProbe.engine.running.get(id);
        return {
          pid: item.pid,
          engine: item.engine,
          args: item.child?.spawnargs,
        };
      }, profile.id);
      assert.ok(native.pid > 0);
      assert.ok(
        native.args.some((arg) => /^--?headless(?:=|$)/.test(arg)),
        JSON.stringify(native),
      );
      const done = await waitUntil(
        async () =>
          (await jobs()).find(
            (row) =>
              row.id === job.id &&
              ["completed", "failed", "cancelled"].includes(row.status),
          ),
        { timeout: 90000 },
      );
      assert.equal(done.status, "completed", JSON.stringify(done));
      assert.ok(
        done.blockedMedia >= 1,
        "真实协议媒体拦截事件至少一次: " + JSON.stringify(done),
      );
      assert.ok(
        done.pages[0].scrolls >= 3 && done.pages[0].position >= 2490,
        JSON.stringify(done),
      );
      const cookies = await app.evaluate(async (_host, id) => {
        const robot = globalThis.__robotProbe,
          item = robot.engine.running.get(id);
        if (item.engine === "firefox")
          return item.bidiConnection.command("storage.getCookies", {});
        const cdp = globalThis.__robotCdp;
        return cdp.call(
          await cdp.browserSocket(item.port),
          "Storage.getCookies",
          {},
        );
      }, profile.id);
      const bottomCookie = cookies.cookies.find(
        (cookie) => cookie.name === "robot_bottom",
      );
      assert.ok(bottomCookie, "真实浏览器包含到底后的 Cookie");
      if (profile.coreType === "Firefox") {
        assert.equal(bottomCookie.value.type, "string");
        assert.equal(bottomCookie.value.value, "true");
      } else assert.equal(bottomCookie.value, "true");
      const state = await page.evaluate(
        (id) => globalThis.__localRequest("profiles:read", { id }),
        profile.id,
      );
      assert.equal(state.forbidImage, true, "临时禁图没有写回窗口设置");
      await page.evaluate(
        (id) => globalThis.__localRequest("profiles:stop", { id }),
        profile.id,
      );
      const saved = await page.evaluate(
        (id) => globalThis.__localRequest("profiles:read", { id }),
        profile.id,
      );
      assert.ok(
        saved.cookie.includes("robot_bottom"),
        "原后端关闭时保存真实 Cookie",
      );
      result.checks.push(
        profile.coreType +
          " 原弹窗启动真实 headless 内核，滚动容器到底、生成 Cookie，关闭后由原后端保存；临时开关不污染配置",
      );
    }
    assert.ok(
      !received.some((url) => url.startsWith("/image")),
      JSON.stringify(received),
    );
    assert.ok(
      !received.some((url) => url.startsWith("/clip/chrome")),
      JSON.stringify(received),
    );
    result.checks.push(
      "两种内核临时禁图真实生效；Chrome Media 请求被阻止；Firefox 通过 BiDi 响应阶段拦截媒体",
    );
    const profile = profiles[0],
      payload = {
        dirIds: [profile.id],
        customParams: { startupParam: "--headless=new" },
        robotParams: {
          cookieRobotUrls: [origin + "/cancel"],
          scrollRange: [100, 100],
          delayRange: [1000, 1000],
          closeProfile: false,
        },
      };
    const start = await page.evaluate(
      (value) => globalThis.electronAPI.send("browser:startCookieRobot", value),
      payload,
    );
    await assert.rejects(
      page.evaluate(
        (value) =>
          globalThis.electronAPI.send("browser:startCookieRobot", value),
        payload,
      ),
      /已有 Cookie Robot/,
    );
    await waitUntil(
      async () =>
        (await page.evaluate(() => globalThis.ops.profileStatus())).some(
          (row) => row.id === profile.id && row.running,
        ),
      { timeout: 90000 },
    );
    await page.evaluate(
      (id) => globalThis.__localRequest("cookie-robot:cancel", { id }),
      start.taskIds[0],
    );
    const cancelled = await waitUntil(
      async () =>
        (await jobs()).find(
          (row) => row.id === start.taskIds[0] && row.status === "cancelled",
        ),
      { timeout: 30000 },
    );
    assert.equal(cancelled.status, "cancelled");
    await waitUntil(
      async () =>
        !(await page.evaluate(() => globalThis.ops.profileStatus())).some(
          (row) => row.id === profile.id && row.running,
        ),
    );
    result.checks.push(
      "重复任务明确拒绝；取消自有任务停止实际浏览器并保存 cancelled",
    );
    await app.evaluate(() => {
      globalThis.__robotProbe.pageBudgetMs = 100;
    });
    const bounded = await page.evaluate(
      (value) =>
        globalThis.electronAPI.send("browser:startCookieRobot", {
          ...value,
          robotParams: { ...value.robotParams, closeProfile: true },
        }),
      payload,
    );
    const failed = await waitUntil(
      async () =>
        (await jobs()).find(
          (row) => row.id === bounded.taskIds[0] && row.status === "failed",
        ),
      { timeout: 90000 },
    );
    assert.ok(
      failed.pages.some((entry) => entry.error?.includes("未在滚动上限")),
      JSON.stringify(failed),
    );
    assert.ok(failed.pid > 0);
    assert.throws(
      () => process.kill(failed.pid, 0),
      (error) => error.code === "ESRCH",
    );
    assert.ok(
      !(await page.evaluate(() => globalThis.ops.profileStatus())).some(
        (entry) => entry.id === profile.id && entry.running,
      ),
    );
    result.checks.push(
      "测试明确缩短内部滚动预算，真实失败记录可读，closeProfile 仍关闭真实进程；没有把未到达底部当成功",
    );
    assert.ok(
      (await fs.readFile(path.join(data, "cookie-robot/jobs.enc"))).indexOf(
        Buffer.from(origin),
      ) < 0,
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.received = received;
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    if (page) {
      result.body = await page
        .locator("body")
        .innerText()
        .catch(() => "unavailable");
      result.jobs = await jobs().catch(() => []);
      await page
        .screenshot({ path: path.join(evidence, "cookie-robot-failure.png") })
        .catch(() => undefined);
    }
  } finally {
    await app?.close();
    await new Promise((resolve) => server.close(resolve));
    await fs.writeFile(
      path.join(evidence, "cookie-robot-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
