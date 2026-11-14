"use strict";
const { _electron: electron } = require("playwright"), fs = require("node:fs/promises"),
  path = require("node:path"), http = require("node:http"), assert = require("node:assert/strict");
const { zip } = require("./selftest-zip.cjs"), { waitUntil, toggleTheme } = require("./selftest-helpers.cjs");
(async () => {
  const repo = path.resolve(__dirname, "../.."), output = path.join(repo, "docs/rebuild/evidence/review-2"),
    data = await fs.mkdtemp(path.join(repo, "work/rebuild/review-template-")),
    result = { passed: false, checks: [], errors: [], externalRequests: [] }, requests = [];
  let app, page;
  const server = http.createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    requests.push(JSON.parse(body));
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.end('data: {"choices":[{"delta":{"content":"Skill 模板执行完成"}}]}\n\ndata: [DONE]\n\n');
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    app = await electron.launch({ executablePath: require("electron"),
      args: ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu", path.join(repo, "Browserapp")],
      env: { ...process.env, OPENBROWSER_USER_DATA: data, OPENBROWSER_API_PORT: "0" } });
    page = await app.firstWindow(); page.setDefaultTimeout(15000);
    await page.setViewportSize({ width: 1536, height: 960 });
    page.on("pageerror", error => result.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") result.errors.push(message.text()); });
    page.on("request", request => { if (/^https?:|^wss?:/.test(request.url())) result.externalRequests.push(request.url()); });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await page.evaluate(() => globalThis.__router.push("/agent-console/templates"));
    await page.getByRole("button", { name: "创建模板", exact: true }).last().waitFor();
    assert.equal(await page.getByRole("button", { name: "定制模板", exact: true }).count(), 0, "商业咨询入口必须删除");
    assert.equal(await page.locator(".custom-template-dialog,.custom-template-banner").count(), 0);
    await page.getByRole("button", { name: "创建模板", exact: true }).last().click();
    await page.getByRole("button", { name: "Skill", exact: true }).last().click();
    const bytes = zip([{ name: "package/SKILL.md", content: "---\nname: review-upload\ndescription: 模板弹窗上传验收\n---\n从 ZIP 导入的真实 Skill 内容" },
      { name: "package/references/local.md", content: "辅助文档" }]);
    await page.locator('input[type="file"][accept*=".zip"]').last().setInputFiles({ name: "review.zip", mimeType: "application/zip", buffer: bytes });
    await waitUntil(() => page.getByPlaceholder("请输入模板名称", { exact: true }).inputValue().then(value => value === "review-upload"));
    await page.getByText("references/local.md", { exact: false }).last().waitFor();
    await page.getByPlaceholder("请输入模板名称", { exact: true }).fill("Skill 上传复核");
    await page.screenshot({ path: path.join(output, "skill-upload-light.png") });
    await page.getByRole("button", { name: "仅保存", exact: true }).click();
    const card = () => page.locator(".my-template-card").filter({ hasText: "Skill 上传复核" });
    await card().waitFor();
    const saved = await page.evaluate(async () => (await globalThis.__localAgentApi.userTemplates.listUserTemplates({ limit: 200 })).data.items[0]);
    assert.equal(saved.templateType, "skill"); assert.equal(saved.metadata.packageSlug, "review-upload");
    assert.deepEqual(saved.metadata.files.sort(), ["SKILL.md", "references/local.md"]);
    await card().getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("button", { name: "置顶", exact: true }).last().click();
    await waitUntil(() => page.evaluate(async id => (await globalThis.__localAgentApi.userTemplates.getUserTemplate({ templateId: id })).data.isTopped, saved.id));
    await page.reload(); await card().waitFor();
    await card().getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("button", { name: "取消置顶", exact: true }).last().waitFor();
    await page.screenshot({ path: path.join(output, "template-pin-light.png") });
    await page.getByRole("button", { name: "取消置顶", exact: true }).last().click();
    await waitUntil(() => page.evaluate(async id => !(await globalThis.__localAgentApi.userTemplates.getUserTemplate({ templateId: id })).data.isTopped, saved.id));
    await page.evaluate(() => globalThis.__router.push("/browser/list")); await toggleTheme(page);
    await page.evaluate(() => globalThis.__router.push("/agent-console/templates")); await card().waitFor();
    await page.screenshot({ path: path.join(output, "skill-template-dark.png") });
    result.checks.push("原版弹窗选择 ZIP，保留多文件 Skill 并保存；原版更多操作置顶/取消置顶及重载持久化；明暗截图");
    const catalog = await page.evaluate(async () => {
      const api = globalThis.__localAgentApi, row = (await api.templates.listOfficialTemplates({ templateType: "skill" }, { paramsSerializer() {} })).data[0];
      const detail = (await api.templates.getOfficialTemplate({ templateIdOrSlug: String(row.id) })).data;
      const pinned = await api.templates.topOfficialTemplate(row.id);
      const persisted = (await api.templates.listOfficialTemplates({})).data.find(item => item.id === row.id);
      await api.templates.untopOfficialTemplate(row.id);
      return { id: row.id, detailId: detail.id, pinned, persisted };
    });
    assert.equal(catalog.detailId, catalog.id); assert.equal(catalog.pinned.isTopped, true); assert.equal(catalog.persisted.isTopped, true);
    result.checks.push("原版模板 API 的 numeric ID、templateIdOrSlug、列表 paramsSerializer 与置顶返回形状实际 IPC 验证");
    const task = await page.evaluate(async ({ id, port }) => {
      await globalThis.__localRequest("agent:config:set", { provider: "openai", baseUrl: "http://127.0.0.1:" + port, model: "review-skill", apiKey: "fixture" });
      const task = (await globalThis.__localAgentApi.userTasks.createUserTask({ name: "上传后真实运行", user_template_id: id })).data;
      return globalThis.__localAgentApi.runTask(task.id);
    }, { id: saved.id, port: server.address().port });
    await waitUntil(() => page.evaluate(async logId => (await globalThis.__localRequest("agent:taskLogs:list")).some(row => row.id === logId && row.status === "success"), task.taskLogId));
    assert.ok(requests.length); assert.ok(JSON.stringify(requests).includes("从 ZIP 导入的真实 Skill 内容"));
    result.checks.push("导入模板实际启动 Agent 任务，后端读取磁盘 Skill，真实 SSE 模型收到内容并完成日志");
    await page.evaluate(() => globalThis.__router.push("/agent-console/templates")); await card().waitFor();
    await card().getByRole("button", { name: "去对话运行", exact: true }).click();
    const editor = page.locator('[contenteditable="true"]').first(); await editor.waitFor();
    await waitUntil(() => page.locator('[data-agent-token="skill"]').count().then(count => count > 0));
    const token = page.locator('[data-agent-token="skill"]').first();
    assert.equal(await token.getAttribute("data-id"), "review-upload");
    assert.equal(JSON.parse(await token.getAttribute("data-payload")).skillPath, "review-upload");
    const skip = page.getByText("跳过", { exact: true }); if (await skip.isVisible()) await skip.click();
    await editor.press("Enter");
    await page.getByText("Skill 模板执行完成", { exact: true }).first().waitFor();
    assert.ok(requests.length >= 2); assert.ok(JSON.stringify(requests.at(-1)).includes("review-upload"));
    const deletion = await page.evaluate(async id => {
      const api = globalThis.__localAgentApi;
      try { await api.userTemplates.deleteUserTemplate({ templateId: id }); return { rejected: false }; }
      catch (error) {
        const skills = await globalThis.__localRequest("agent:skills:list");
        const tasks = (await api.userTasks.listUserTasks({ limit: 200 })).data.items;
        for (const task of tasks) await api.userTasks.deleteUserTask({ taskId: task.id });
        return { rejected: error.message.includes("引用"), skillRetained: skills.some(row => row.slug === "review-upload") };
      }
    }, saved.id);
    assert.deepEqual(deletion, { rejected: true, skillRetained: true });
    await page.evaluate(() => globalThis.__router.push("/agent-console/templates")); await card().waitFor();
    await card().getByRole("button", { name: "更多操作", exact: true }).click();
    await page.getByRole("button", { name: "删除", exact: true }).last().click();
    await page.getByRole("button", { name: "删除", exact: true }).last().click();
    await waitUntil(() => card().count().then(count => count === 0));
    assert.ok(await page.evaluate(async () => (await globalThis.__localRequest("agent:skills:list")).some(row => row.slug === "review-upload")));
    await page.evaluate(() => globalThis.__localRequest("agent:skills:delete", { slug: "review-upload" }));
    assert.equal(await page.evaluate(async () => (await globalThis.__localRequest("agent:skills:list")).some(row => row.slug === "review-upload")), false);
    result.checks.push("原去对话运行发送正确本地 slug；任务引用拒绝删除且 Skill 不丢；原确认框删除模板后共享 Skill 保留，再显式删除 Skill 库");
    assert.deepEqual(result.errors, []); assert.deepEqual(result.externalRequests, []); result.passed = true;
  } catch (error) {
    result.failure = error.stack; process.exitCode = 1;
    if (page) result.tokenHtml = await page.locator('[data-agent-token="skill"]').evaluateAll(nodes => nodes.map(node => node.outerHTML));
    if (page) { result.body = await page.locator("body").innerText(); await page.screenshot({ path: path.join(output, "template-failure.png") }); }
  } finally {
    await app?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await fs.writeFile(path.join(output, "template-ui.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
