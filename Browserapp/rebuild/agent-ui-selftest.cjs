"use strict";
const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
(async () => {
  const evidence = path.join(root, "docs/rebuild/evidence"),
    data = await fs.mkdtemp(path.join(root, "work/rebuild/agent-ui-"));
  let app;
  const result = {
    passed: false,
    errors: [],
    externalRequests: [],
    checks: [],
  };
  let modelRequests = 0;
  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const input = JSON.parse(raw);
    assert.equal(input.model, "local-fixture");
    assert.equal(input.stream, true);
    modelRequests++;
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end(
      "data: " +
        JSON.stringify({
          choices: [
            { delta: { content: "原版聊天界面已接通本地模型适配器。" } },
          ],
        }) +
        "\n\ndata: [DONE]\n\n",
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        path.join(root, "Browserapp"),
      ],
      env: {
        ...process.env,
        OPENBROWSER_ROXY_UI: "1",
        OPENBROWSER_USER_DATA: data,
      },
    });
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (e) => result.errors.push(e.stack));
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push(m.text());
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push(r.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await page.evaluate(() =>
      globalThis.__router.push("/agent-console/settings"),
    );
    await page.getByLabel("模型服务", { exact: true }).selectOption("openai");
    await page
      .getByLabel("服务地址", { exact: true })
      .fill("http://127.0.0.1:" + server.address().port);
    await page.getByLabel("模型名称", { exact: true }).fill("local-fixture");
    await page.getByLabel("API key", { exact: true }).fill("local-test-key");
    await page.getByRole("button", { name: "保存设置", exact: true }).click();
    await page.getByText("设置已保存", { exact: true }).waitFor();
    result.checks.push(
      "本地设置页使用原主题组件填写 LLM 地址、模型和 key，经真实 IPC 加密保存",
    );
    await page.getByRole("button", { name: "返回对话", exact: true }).click();
    await page.getByText("有什么我能帮你的吗？", { exact: true }).waitFor();
    await page.screenshot({ path: path.join(evidence, "agent-empty.png") });
    result.editorCount = await page
      .locator('[contenteditable="true"],textarea')
      .count();
    const editor = page.locator('[contenteditable="true"]');
    if (await editor.count()) {
      await editor.first().fill("测试本地模型连线");
      await editor.first().press("Enter");
    } else {
      const textarea = page.locator("textarea").first();
      await textarea.fill("测试本地模型连线");
      await textarea.press("Enter");
    }
    await page
      .getByText("原版聊天界面已接通本地模型适配器。", { exact: true })
      .first()
      .waitFor({ timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(evidence, "agent-conversation.png"),
    });
    assert.equal(modelRequests, 1);
    result.checks.push(
      "原聊天输入框发送，主进程请求本地 SSE 端点，原聊天组件显示真实返回文本",
    );
    assert.equal(result.externalRequests.length, 0);
    assert.deepEqual(result.errors, []);
    result.checks.push("渲染进程无 HTTP/WebSocket 请求与页面错误");
    result.passed = true;
  } catch (e) {
    result.failure = e.stack;
    process.exitCode = 1;
  } finally {
    await app?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.writeFile(
      path.join(evidence, "agent-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
