"use strict";
const { _electron: electron } = require("playwright"), fs = require("node:fs/promises"),
  path = require("node:path"), http = require("node:http"), assert = require("node:assert/strict");
const { zip } = require("./selftest-zip.cjs"), { waitUntil } = require("./selftest-helpers.cjs");
(async () => {
  const repo = path.resolve(__dirname, "../.."), output = path.join(repo, "docs/rebuild/evidence/review-3"),
    data = await fs.mkdtemp(path.join(repo, "work/rebuild/review3-ui-")),
    result = { passed: false, checks: [], errors: [], externalRequests: [] }, requests = [];
  let app, page;
  const server = http.createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    const input = JSON.parse(body); requests.push(input);
    const prompt = input.messages.findLast(message => message.role === "user")?.content || "";
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.end("data: " + JSON.stringify({ choices: [{ delta: { content: "reply:" + prompt } }] }) + "\n\ndata: [DONE]\n\n");
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    await fs.mkdir(output, { recursive: true });
    app = await electron.launch({ executablePath: require("electron"),
      args: ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu", path.join(repo, "Browserapp")],
      env: { ...process.env, OPENBROWSER_USER_DATA: data, OPENBROWSER_API_PORT: "0" } });
    page = await app.firstWindow(); page.setDefaultTimeout(15000); await page.setViewportSize({ width: 1536, height: 960 });
    page.on("pageerror", error => result.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") result.errors.push(message.text()); });
    page.on("request", request => { if (/^https?:|^wss?:/.test(request.url())) result.externalRequests.push(request.url()); });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await page.evaluate(port => globalThis.__localRequest("agent:config:set", { provider: "openai", baseUrl: "http://127.0.0.1:" + port, model: "contract-ui" }), server.address().port);
    await page.evaluate(() => globalThis.__router.push("/agent-console/templates"));
    await page.getByRole("button", { name: "创建模板", exact: true }).last().click();
    await page.getByRole("button", { name: "Skill", exact: true }).last().click();
    await page.locator('input[type="file"][accept*=".zip"]').last().setInputFiles({ name: "edit.zip", mimeType: "application/zip",
      buffer: zip([{ name: "demo/SKILL.md", content: "---\nname: contract-edit\ndescription: 编辑包引用验收\n---\n本地包正文应保留" }, { name: "demo/references/a.md", content: "reference bytes" }]) });
    await waitUntil(() => page.getByPlaceholder("请输入模板名称", { exact: true }).inputValue().then(value => value === "contract-edit"));
    await page.getByPlaceholder("请输入模板名称", { exact: true }).fill("编辑 Skill 契约");
    await page.getByRole("button", { name: "仅保存", exact: true }).click();
    const card = page.locator(".my-template-card").filter({ hasText: "编辑 Skill 契约" }); await card.waitFor();
    await card.getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("button", { name: "编辑", exact: true }).last().click();
    const dialog = page.locator(".create-template-dialog");
    await dialog.getByText("references/a.md", { exact: false }).waitFor();
    await dialog.locator('[contenteditable="true"]').fill("修改后的任务提示词");
    await page.screenshot({ path: path.join(output, "skill-edit.png") });
    await dialog.getByRole("button", { name: "仅保存", exact: true }).click();
    const edited = await page.evaluate(async () => (await globalThis.__localAgentApi.userTemplates.listUserTemplates({ limit: 200 })).data.items[0]);
    assert.equal(edited.metadata.packageSlug, "contract-edit"); assert.equal(edited.metadata.slug, "contract-edit");
    assert.deepEqual(edited.metadata.files, ["SKILL.md", "references/a.md"]); assert.equal(edited.metadata.prompt, "修改后的任务提示词");
    const taskRun = await page.evaluate(async id => {
      const task = (await globalThis.__localAgentApi.userTasks.createUserTask({ name: "编辑后实际执行", user_template_id: id })).data;
      return globalThis.__localAgentApi.runTask(task.id);
    }, edited.id);
    await waitUntil(() => page.evaluate(async id => (await globalThis.__localRequest("agent:taskLogs:list")).some(row => row.id === id && row.status === "success"), taskRun.taskLogId));
    assert.ok(JSON.stringify(requests).includes("本地包正文应保留"));
    result.checks.push("原版 Skill 编辑只提交 prompt，包/文件/slug 保留，实际任务仍读取包正文");
    const c = await page.evaluate(() => globalThis.__localAgentApi.createConversation());
    await page.evaluate(id => globalThis.__localAgentApi.updateConversation(id, "历史游标验收"), c.id);
    for (let i = 0; i < 22; i++) {
      await page.evaluate(({ id, index }) => globalThis.__localRequest("agent:channel:send", { type: "conversation.run.start", data: { conversationId: id, message: "history-" + String(index).padStart(2, "0"), fullAccess: true }, requestId: "history-" + index }), { id: c.id, index: i });
      await waitUntil(() => page.evaluate(async () => (await globalThis.__localRequest("agent:info")).running === 0));
    }
    assert.equal(await page.evaluate(async id => (await globalThis.__localAgentApi.conversationDetail(id)).conversation.unread, c.id), true);
    await page.reload(); await page.getByRole("heading", { name: "我的模板", exact: true }).waitFor();
    const entry = () => page.locator(".conversation-item").filter({ hasText: "历史游标验收" });
    await entry().locator(".conversation-status--ended").waitFor();
    await page.screenshot({ path: path.join(output, "conversation-unread.png") });
    await page.evaluate(() => {
      const request = globalThis.__agentRequest; globalThis.__reviewHistoryCalls = [];
      globalThis.__agentRequest = (method, payload) => { if (method === "conversationDetail") globalThis.__reviewHistoryCalls.push(payload); return request(method, payload); };
    });
    await entry().click(); await page.getByText("history-21", { exact: true }).first().waitFor();
    await waitUntil(() => page.evaluate(async id => !(await globalThis.__localAgentApi.conversationDetail(id)).conversation.unread, c.id));
    assert.equal(await page.locator(".chat-message.user").getByText("history-00", { exact: true }).count(), 0);
    const skip = page.getByText("跳过", { exact: true }); if (await skip.isVisible()) await skip.click();
    const list = page.locator(".message-list"); await list.hover();
    for (let attempt = 0; attempt < 22; attempt++) {
      if (await page.locator(".chat-message.user").getByText("history-00", { exact: true }).count()) break;
      const before = await page.evaluate(() => globalThis.__reviewHistoryCalls.filter(call => call.cursor).length);
      await page.mouse.wheel(0, -50000);
      await waitUntil(() => page.evaluate(count => globalThis.__reviewHistoryCalls.filter(call => call.cursor).length > count, before));
      await waitUntil(() => list.getAttribute("aria-busy").then(value => value === "false"));
    }
    await page.mouse.wheel(0, -50000);
    await page.locator(".chat-message.user").getByText("history-00", { exact: true }).waitFor();
    assert.equal(await page.locator(".chat-message.user").count(), 22);
    assert.equal(await page.locator(".chat-message.assistant").count(), 22);
    const calls = await page.evaluate(() => globalThis.__reviewHistoryCalls);
    assert.ok(calls.some(call => typeof call.cursor === "string"));
    await page.screenshot({ path: path.join(output, "conversation-history.png") });
    result.checks.push("22 个真实模型回合；刷新后后台未读保留；选择会话触发真实已读 DTO；原向上滚动按游标加载全部 44 条消息，无重复");
    await entry().hover(); await entry().locator(".conversation-delete").click();
    await page.getByRole("button", { name: "重命名对话", exact: true }).click();
    const rename = page.locator(".rename-conversation-dialog");
    await rename.getByRole("textbox", { name: "重命名对话", exact: true }).fill("已重命名的历史");
    await rename.getByRole("button", { name: "保存", exact: true }).click();
    await page.reload();
    const renamed = page.locator(".conversation-item").filter({ hasText: "已重命名的历史" }); await renamed.waitFor();
    await page.mouse.move(1400, 40); await renamed.focus();
    await renamed.locator(".conversation-delete").waitFor();
    await page.keyboard.press("Tab");
    assert.ok(await renamed.locator(".conversation-delete").evaluate(node => node === document.activeElement || node.contains(document.activeElement)));
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "删除", exact: true }).last().click();
    await page.getByRole("button", { name: "删除", exact: true }).last().click();
    await waitUntil(() => renamed.count().then(count => count === 0));
    assert.equal(await page.evaluate(async id => (await globalThis.__localAgentApi.conversationList({ limit: 100 })).some(row => row.id === id), c.id), false);
    result.checks.push("原会话菜单、重命名弹窗、重载和删除确认实际写入后端");
    assert.deepEqual(result.errors, []); assert.deepEqual(result.externalRequests, []); result.passed = true;
  } catch (error) {
    result.failure = error.stack; process.exitCode = 1;
    if (page) result.focusState = await page.evaluate(() => ({ active: document.activeElement?.outerHTML, rows: [...document.querySelectorAll(".conversation-item")].map(row => ({ html: row.outerHTML, events: Reflect.ownKeys(row).filter(key => typeof key === "symbol" && String(key).includes("vei")).map(key => Object.keys(row[key])) })) }));
    if (page) { result.body = await page.locator("body").innerText(); await page.screenshot({ path: path.join(output, "agent-ui-failure.png") }); }
  } finally {
    await app?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await fs.writeFile(path.join(output, "agent-contracts-ui.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
