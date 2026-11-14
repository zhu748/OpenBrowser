"use strict";
const { _electron: electron, chromium } = require("playwright"),
  http = require("node:http"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/agent-browser-")),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = {
      passed: false,
      errors: [],
      externalRequests: [],
      checks: [],
      modelRequests: 0,
    };
  let app, page, profileId, browser;
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== "POST") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          '<!doctype html><html><title>Agent browser fixture</title><body><h1>真实浏览器测试页面</h1><input id="agent-note"><button id="agent-apply" onclick="document.querySelector(\'#agent-result\').textContent=document.querySelector(\'#agent-note\').value">应用</button><p id="agent-result">等待操作</p></body></html>',
        );
        return;
      }
      let body = "";
      for await (const chunk of req) body += chunk;
      const request = JSON.parse(body);
      const step = ++result.modelRequests;
      const previous = request.messages
        .filter((message) => message.role === "tool")
        .at(-1);
      if (step === 3)
        assert.ok(
          JSON.parse(previous.content).title.includes("Agent browser fixture"),
        );
      if (step === 6)
        assert.ok(JSON.parse(previous.content).text.includes("AI 已写入"));
      const actions = [
        ["list_profiles", {}],
        ["read_page", { id: profileId }],
        [
          "fill",
          { id: profileId, selector: "#agent-note", value: "AI 已写入" },
        ],
        ["click", { id: profileId, selector: "#agent-apply" }],
        ["read_page", { id: profileId }],
      ];
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      if (actions[step - 1]) {
        const [name, args] = actions[step - 1];
        res.end(
          "data: " +
            JSON.stringify({
              choices: [
                {
                  delta: {
                    tool_calls: [
                      {
                        index: 0,
                        id: "call-" + step,
                        type: "function",
                        function: { name, arguments: JSON.stringify(args) },
                      },
                    ],
                  },
                },
              ],
            }) +
            "\n\ndata: [DONE]\n\n",
        );
      } else
        res.end(
          "data: " +
            JSON.stringify({
              choices: [{ delta: { content: "已读取页面并写入：AI 已写入" } }],
            }) +
            "\n\ndata: [DONE]\n\n",
        );
    } catch (error) {
      result.fixtureFailure = error.stack;
      res.writeHead(500);
      res.end(error.message);
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
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
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (error) => result.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const row = await page.evaluate(
      (url) =>
        globalThis.__localRequest("profiles:create", {
          windowName: "Agent 真实浏览器",
          coreType: "Chrome",
          os: "Linux",
          startupParam: "--headless=new",
          sandboxPermission: true,
          defaultOpenUrl: [url],
          isDisplayLanguageBaseIp: false,
          isTimeZone: false,
          isPositionBaseIp: false,
          openWorkbench: 0,
        }),
      "http://127.0.0.1:" + server.address().port,
    );
    profileId = row.id;
    await page.evaluate(
      (id) => globalThis.__localRequest("profiles:start", { id }),
      profileId,
    );
    await page.evaluate(
      (url) =>
        globalThis.__agentRequest("config:set", {
          provider: "openai",
          baseUrl: url,
          model: "local-browser-fixture",
          apiKey: "fixture-key",
        }),
      "http://127.0.0.1:" + server.address().port + "/v1",
    );
    const conversation = await page.evaluate(() =>
      globalThis.__agentRequest("createConversation"),
    );
    await page.evaluate(
      (id) => globalThis.__router.push("/agent-console/c/" + id),
      conversation.id,
    );
    await page.waitForTimeout(300);
    await page.evaluate(
      (p) =>
        globalThis.__agentRequest("channel:send", {
          type: "conversation.run.start",
          requestId: "browser-e2e",
          data: {
            conversationId: p.conversation,
            message: "读取测试页面，填写输入框并点击应用。",
            fullAccess: true,
            allowedProfileIds: [p.profile],
          },
        }),
      { conversation: conversation.id, profile: profileId },
    );
    await waitUntil(
      () =>
        page.evaluate(
          (id) =>
            globalThis
              .__agentRequest("conversationDetail", { id })
              .then((detail) =>
                ["completed", "failed"].includes(
                  detail.conversation.latestRunStatus,
                ),
              ),
          conversation.id,
        ),
      { timeout: 60000 },
    );
    const detail = await page.evaluate(
      (id) => globalThis.__agentRequest("conversationDetail", { id }),
      conversation.id,
    );
    assert.equal(
      detail.conversation.latestRunStatus,
      "completed",
      JSON.stringify(detail.messages),
    );
    assert.equal(result.modelRequests, 6);
    assert.equal(result.fixtureFailure, undefined);
    await page
      .getByText("已读取页面并写入：AI 已写入", { exact: true })
      .waitFor();
    const status = (
      await page.evaluate(() => globalThis.ops.profileStatus())
    ).find((row) => row.id === profileId);
    assert.ok(status.running && status.pid > 0);
    browser = await chromium.connectOverCDP("http://127.0.0.1:" + status.port);
    const tab = browser
      .contexts()
      .flatMap((context) => context.pages())
      .find((tab) =>
        tab.url().startsWith("http://127.0.0.1:" + server.address().port),
      );
    assert.equal(await tab.locator("#agent-note").inputValue(), "AI 已写入");
    assert.equal(await tab.locator("#agent-result").innerText(), "AI 已写入");
    result.checks.push(
      "真实原后端 Chrome 进程，经生产 Playwright/CDP 执行 list_profiles/read_page/fill/click/read_page",
    );
    result.checks.push(
      "本地 SSE 模型夹具接收真实工具结果，六轮请求后原 Agent 界面显示最终回复",
    );
    result.checks.push(
      "本测试通过 IPC 授予单个测试窗口完整访问；未冒充 UI 权限勾选验收",
    );
    await page.screenshot({
      path: path.join(evidence, "agent-browser-tools.png"),
    });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "agent-browser-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    await browser?.close();
    await app?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.writeFile(
      path.join(evidence, "agent-browser-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
