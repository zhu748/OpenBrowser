"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(
      path.join(repo, "work/rebuild/agent-files-ui-"),
    ),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    image = await fs.readFile(
      path.join(repo, "Browserapp/assets/logo-pixel.png"),
    ),
    picked = path.join(data, "picked.txt"),
    output = path.join(data, "saved.png"),
    result = { passed: false, checks: [], errors: [], externalRequests: [] };
  await fs.writeFile(picked, "原界面附件内容\n");
  let app,
    page,
    fixtureError,
    requests = 0,
    imageId;
  const server = http.createServer(async (req, res) => {
    try {
      let body = "";
      for await (const chunk of req) body += chunk;
      const input = JSON.parse(body);
      requests++;
      const user = input.messages.findLast(
        (message) => message.role === "user",
      );
      assert.ok(Array.isArray(user.content));
      const text = user.content.find((part) => part.type === "text").text,
        textId = text.match(/picked\.txt: ([0-9a-f-]{36})/)?.[1];
      assert.ok(textId);
      imageId = text.match(/picture\.png: ([0-9a-f-]{36})/)?.[1];
      assert.ok(imageId);
      assert.equal(
        user.content.find((part) => part.type === "image_url").image_url.url,
        "data:image/png;base64," + image.toString("base64"),
      );
      const tool = input.messages.findLast(
        (message) => message.role === "tool",
      );
      if (tool)
        assert.equal(JSON.parse(tool.content).content, "原界面附件内容\n");
      const delta = tool
        ? { content: "已读取附件内容，图片也已收到。" }
        : {
            tool_calls: [
              {
                index: 0,
                id: "file-call",
                type: "function",
                function: {
                  name: "read_attachment",
                  arguments: JSON.stringify({
                    fileId: textId,
                    offset: 0,
                    length: 12000,
                  }),
                },
              },
            ],
          };
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.end(
        "data: " +
          JSON.stringify({ choices: [{ delta }] }) +
          "\n\ndata: [DONE]\n\n",
      );
    } catch (error) {
      fixtureError = error;
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
    await page.setViewportSize({ width: 1280, height: 900 });
    page.on("pageerror", (error) => result.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await app.evaluate(
      ({ dialog }, values) => {
        dialog.showOpenDialog = async () => ({
          canceled: false,
          filePaths: [values.picked],
        });
        dialog.showSaveDialog = async () => ({
          canceled: false,
          filePath: values.output,
        });
      },
      { picked, output },
    );
    await page.evaluate(
      (baseUrl) =>
        globalThis.__agentRequest("config:set", {
          provider: "openai",
          model: "fixture",
          baseUrl,
          apiKey: "",
        }),
      "http://127.0.0.1:" + server.address().port,
    );
    await page.evaluate(() => globalThis.__router.push("/agent-console"));
    await page.getByText("有什么我能帮你的吗？", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Attach file", exact: true })
      .click();
    await page
      .locator(".composer-shell .agent-file-card")
      .getByText("picked", { exact: true })
      .waitFor();
    const input = page.locator(
      '.composer-shell input[type="file"]:not([webkitdirectory])',
    );
    await input.setInputFiles({
      name: "picture.png",
      mimeType: "image/png",
      buffer: image,
    });
    await waitUntil(
      async () =>
        await page
          .locator(".composer-shell .agent-file-card img")
          .evaluateAll((images) =>
            images.some(
              (img) =>
                img.src.startsWith("obui://app/agent-files/") &&
                img.complete &&
                img.naturalWidth > 0,
            ),
          ),
    );
    await page.screenshot({
      path: path.join(evidence, "agent-attachments-pending.png"),
    });
    result.checks.push(
      "原附件按钮经原生选择返回路径读取真实文本；原隐藏 File 输入上传 PNG，原卡片通过本地协议显示真实缩略图",
    );
    const editor = page.locator('[contenteditable="true"]').first();
    await editor.fill("读取两个附件");
    await editor.press("Enter");
    await page
      .getByText("已读取附件内容，图片也已收到。", { exact: true })
      .first()
      .waitFor({ timeout: 30000 });
    assert.ifError(fixtureError);
    assert.equal(requests, 2);
    await page.screenshot({
      path: path.join(evidence, "agent-attachments-chat.png"),
    });
    const imageCard = page
      .locator(".chat-message.user .agent-file-card--previewable")
      .filter({ has: page.locator("img") })
      .first();
    await imageCard.locator(".agent-file-card__file").click();
    await page.locator(".attachment-image-preview__stage img").waitFor();
    await page.screenshot({
      path: path.join(evidence, "agent-attachment-preview.png"),
    });
    await page.keyboard.press("Escape");
    await page
      .locator(".attachment-image-preview__stage")
      .waitFor({ state: "hidden" });
    result.checks.push(
      "原聊天流程实际发送附件，模型工具读取真实文字；原图片预览打开并能用 Escape 关闭",
    );
    const exported = await page.evaluate(
      (fileId) =>
        globalThis.electronAPI.send("app:downloadLocalFile", {
          filePath: "obui://app/agent-files/" + fileId,
          fileName: "saved.png",
        }),
      imageId,
    );
    assert.equal(exported.canceled, false);
    assert.deepEqual(await fs.readFile(output), image);
    result.checks.push("下载 channel 经原生保存返回路径，实际导出字节一致");
    await page.reload();
    await page.getByText("已读取附件内容，图片也已收到。", { exact: true }).first().waitFor();
    await page.locator(".chat-message.user .agent-file-card").nth(1).waitFor();
    assert.equal(await page.locator(".chat-message.user .agent-file-card").count(), 2, "历史重载应保留两个实际附件");
    const persistedImage = page.locator(".chat-message.user .agent-file-card--previewable img").first();
    await waitUntil(() => persistedImage.evaluate(img => img.complete && img.naturalWidth > 0));
    await page.screenshot({ path: path.join(evidence, "agent-attachments-reloaded.png") });
    result.checks.push("刷新原聊天历史后，文本/图片附件及真实本地缩略图保持；metadata.attachments 契约实际验证");
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
      await page
        .screenshot({
          path: path.join(evidence, "agent-attachments-failure.png"),
        })
        .catch(() => undefined);
    }
  } finally {
    await app?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.writeFile(
      path.join(evidence, "agent-files-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
