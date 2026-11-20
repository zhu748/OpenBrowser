
const { openWorkspacePage } = require("./selftest-helpers.cjs");
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");
const { waitUntil } = require("./selftest-helpers.cjs");
const { createTestDirectory } = require("./selftest-helpers.cjs");
("use strict");
const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { unwrapIpcResult } = require("../shared/ipc-result");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const evidence = evidenceDirectory(),
    data = await createTestDirectory('task-ui-');
  const result = {
    passed: false,
    errors: [],
    externalRequests: [],
    checks: [],
  };
  let app,
    page,
    phase = "startup",
    requests = 0;
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    assert.equal(JSON.parse(body).model, "task-fixture");
    requests++;
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end(
      Array.from("这是本地任务的真实模型输出。", content => "data: " +
        JSON.stringify({
          choices: [{ delta: { content } }],
        }) +
        "\n\n").join("") + "data: [DONE]\n\n",
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const call = async (method, payload = {}) =>
    unwrapIpcResult(
      await page.evaluate(
        ({ method, payload }) => globalThis.rebuild.request(method, payload),
        { method, payload },
      ),
    );
  try {
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        ...(process.platform === 'linux' ? ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu"] : []),
        path.join(repo, "Browserapp"),
      ],
      env: {
        ...process.env,
        OPENBROWSER_ROXY_UI: "1",
        OPENBROWSER_USER_DATA: data,
        OPENBROWSER_API_PORT: "0",
      },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (e) =>
      result.errors.push({ phase, error: e.message }),
    );
    page.on("console", (m) => {
      if (m.type() === "error") result.errors.push({ phase, error: m.text() });
    });
    page.on("request", (r) => {
      if (/^https?:|^wss?:/.test(r.url()))
        result.externalRequests.push(r.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await call("agent:config:set", {
      provider: "openai",
      model: "task-fixture",
      baseUrl: "http://127.0.0.1:" + server.address().port,
      apiKey: "local-fixture",
    });
    phase = "template-create";
    console.log(phase);
    page = await openWorkspacePage(app, '/agent-console/templates');
    await page
      .getByRole("button", { name: "创建模板", exact: true })
      .last()
      .click();
    assert.equal(await page.getByRole("button", { name: "脚本", exact: true }).isEnabled(), true);
    assert.equal(await page.getByRole("button", { name: "脚本", exact: true }).getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "上传脚本", exact: true }).waitFor();
    assert.equal(await page.getByText("请选择官方脚本模板", { exact: true }).count(), 0);
    await page
      .getByPlaceholder("请输入模板名称", { exact: true })
      .fill("本地提示词任务验收");
    await page
      .getByRole("button", { name: "提示词", exact: true })
      .last()
      .click();
    await page
      .locator('[contenteditable="true"]')
      .last()
      .fill("请返回一次任务执行结果。");
    await page.screenshot({
      path: path.join(evidence, "agent-template-dialog.png"),
    });
    await page.getByRole("button", { name: "仅保存", exact: true }).click();
    await page
      .getByText("本地提示词任务验收", { exact: true })
      .first()
      .waitFor();
    const templates = (await call("agent:userTemplates.listUserTemplates")).data
      .items;
    assert.equal(
      templates.find((t) => t.name === "本地提示词任务验收").metadata.prompt,
      "请返回一次任务执行结果。",
    );
    result.checks.push("原版 Agent 模板弹窗创建提示词模板，经真实 IPC 落盘");

    phase = "local-script";
    const script = [
      'import {defineMetadata, defineParams} from "@openbrowser/sandbox";',
      'defineMetadata({name: "本地脚本模板", description: "脚本描述预览"});',
      'defineParams({type: "object", properties: {count: {type: "number", default: -1}}});',
      'export async function main(options: {count: number}) { console.log("开始计算"); return {scriptValue: await Promise.resolve(options.count * 3)}; }',
    ].join("\n");
    const metadata = await call("agent:scriptSelfDescription", { code: 'throw Error("仅允许静态预览");\n' + script });
    assert.equal(metadata.paramsSchema.properties.count.default, -1);
    const legacy = await call("agent:scriptSelfDescription", {
      filename: "旧版归档.ts", code: 'import { chromium } from "playwright"; export async function main() { return chromium.name(); }',
    });
    assert.equal(legacy.metadata.name, "旧版归档");
    assert.deepEqual(legacy.paramsSchema, { type: "object" });
    await assert.rejects(call("agent:scriptSelfDescription", { code: script.replace("default: -1", "default: Math.random()") }), /静态/);
    await assert.rejects(call("agent:scriptSelfDescription", { code: script.replace("function main", "function other") }), /main\(options\)/);
    await page.getByRole("button", { name: "创建模板", exact: true }).last().click();
    await page.getByRole("button", { name: "脚本", exact: true }).click();
    await page.getByRole("button", { name: "上传脚本", exact: true }).click();
    const upload = page.locator(".agent-console-upload-script-dialog");
    await upload.getByRole("button", { name: "脚本开发文档", exact: true }).click();
    await upload.getByText(/从任务管理选择窗口后运行/).waitFor();
    assert.equal(app.windows().length, 2, "the documentation stays inside the current workspace");
    await upload.getByRole("button", { name: "脚本开发文档", exact: true }).click();
    await upload.locator('input[value="file"]').check();
    await upload.locator('input[type="file"]').setInputFiles({
      name: "archive-fixture.ts", mimeType: "application/typescript", buffer: Buffer.from(script),
    });
    await upload.getByText("脚本描述预览", { exact: true }).waitFor();
    await upload.screenshot({ path: path.join(evidence, "agent-script-preview.png") });
    await upload.getByRole("button", { name: "上传脚本", exact: true }).click();
    await upload.waitFor({ state: "hidden" });
    const scriptParameter = page.locator('.create-template-dialog__script-parameters input[type="number"]');
    assert.equal(await scriptParameter.inputValue(), "-1");
    await scriptParameter.fill("7");
    await scriptParameter.press("Tab");
    assert.equal(await page.getByRole("button", { name: "保存并运行", exact: true }).isEnabled(), true);
    await page.getByRole("button", { name: "仅保存", exact: true }).click();
    const scriptCard = page.locator(".my-template-card").filter({ hasText: "本地脚本模板" });
    await scriptCard.waitFor();
    assert.equal(await scriptCard.getByRole("button", { name: "创建任务", exact: true }).isEnabled(), true);
    const summary = (await call("agent:userTemplates.listUserTemplates")).data.items.find(row => row.templateType === "script");
    assert.equal(summary.metadata.scriptSource, undefined);
    const storedScript = (await call("agent:userTemplates.getUserTemplate", { id: summary.id })).data.metadata;
    assert.equal(storedScript.scriptSource, script);
    assert.deepEqual(storedScript.params, { count: 7 });
    await assert.rejects(call("agent:userTasks.createUserTask", { name: "未选择窗口", userTemplateId: summary.id }), /选择/);
    await scriptCard.getByRole("button", { name: /本地脚本模板/ }).click();
    await page.getByRole("button", { name: "上传脚本", exact: true }).click();
    assert.equal(await upload.locator("textarea").inputValue(), script);
    await upload.getByRole("button", { name: "取消", exact: true }).click();
    await upload.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "取消", exact: true }).click();
    const workspace = await call("profiles:create", { windowName: "本地脚本窗口" });
    await scriptCard.getByRole("button", { name: "运行脚本", exact: true }).click();
    const scriptDialog = page.locator(".agent-console-create-task-dialog");
    await scriptDialog.getByPlaceholder("请输入任务名称", { exact: true }).fill("本地脚本任务验收");
    await scriptDialog.getByText(/OPE-\d+ · 本地脚本窗口/).click();
    await scriptDialog.getByRole("button", { name: "保存", exact: true }).click();
    await scriptDialog.waitFor({ state: "hidden" });
    await waitUntil(async () => (await call("agent:taskLogs:summary")).some(log => log.taskName === "本地脚本任务验收" && log.status === "success"));
    const manualScript = (await call("agent:taskLogs:summary")).find(log => log.taskName === "本地脚本任务验收");
    const scriptLog = await call("agent:logs:detail", { id: manualScript.id });
    assert.ok(scriptLog.messages.at(-1).content.includes('"scriptValue":21'));
    assert.equal(requests, 0, "the script runs locally without calling the model");
    await page.getByText("执行日志", { exact: true }).click();
    await page.locator("tr").filter({ hasText: "本地脚本任务验收" }).getByRole("button", { name: "查看日志", exact: true }).click();
    await page.getByText(/scriptValue.*21/).first().waitFor();
    await page.getByText("任务已开始", { exact: true }).waitFor({ state: "hidden" });
    await page.getByText("任务已创建", { exact: true }).waitFor({ state: "hidden" });
    await page.screenshot({ path: path.join(evidence, "agent-local-script-log.png") });
    await page.keyboard.press("Escape");
    await call("agent:userTasks.updateUserTask", {
      taskId: manualScript.taskId, plan_type: "once", execute_at: new Date(Date.now() + 1000).toISOString(), enabled: true,
    });
    await waitUntil(async () => (await call("agent:taskLogs:summary")).some(log => log.taskId === manualScript.taskId && log.id !== manualScript.id && log.status === "success"));
    assert.ok(workspace.id);
    assert.equal(requests, 0);
    result.checks.push("原脚本弹窗静态读取 TypeScript 参数，模板卡片创建并运行手动任务，定时重跑保留结果且不调用模型");
    await page.evaluate(() => globalThis.__router.push("/agent-console/templates"));
    phase = "script-rerun";
    await page.evaluate(() =>
      globalThis.__router.push("/agent-console/task-manager"),
    );
    const taskLogs = async () => (await call("agent:taskLogs:summary"))
      .filter(log => log.taskId === manualScript.taskId);
    const previousRuns = new Set((await taskLogs()).map(log => log.id));
    await page.locator("tr").filter({ hasText: "本地脚本任务验收" })
      .getByRole("button", { name: "立即执行", exact: true }).click();
    await waitUntil(async () => (await taskLogs()).some(log => !previousRuns.has(log.id) && log.status === "success"));
    const rerunTask = (await call("agent:userTasks.listUserTasks")).data.items.find(task => task.id === manualScript.taskId);
    assert.equal(rerunTask.enabled, false);
    assert.equal(rerunTask.nextExecuteAt, null);
    assert.equal(requests, 0);
    result.checks.push("一次性计划结束后，任务管理仍可通过立即执行手动重跑，计划继续停用");
    phase = "task-create";
    console.log(phase);
    await call("profiles:create", { windowName: "任务关联窗口" });
    const selectedOnly = await call("profiles:query", {
      dirIds: workspace.id, page_size: 1, orderName: "createTime", orderType: "desc",
    });
    assert.deepEqual(selectedOnly.rows.map(row => row.dirId), [workspace.id]);
    assert.equal(selectedOnly.total, 1);
    await page
      .getByRole("button", { name: "创建任务", exact: true })
      .last()
      .click();
    await page
      .getByPlaceholder("请输入任务名称", { exact: true })
      .fill("本地任务执行验收");
    await page.getByText("请选择任务模板", { exact: true }).click();
    await page.getByText("本地提示词任务验收", { exact: true }).last().click();
    await page.getByText(/OPE-\d+ · 任务关联窗口/).click();
    await page.screenshot({
      path: path.join(evidence, "agent-task-dialog.png"),
    });
    await page
      .getByRole("button", { name: "保存", exact: true })
      .last()
      .click();
    await page.getByText("本地任务执行验收", { exact: true }).first().waitFor();
    const tasks = (await call("agent:userTasks.listUserTasks")).data.items;
    assert.ok(tasks.some((t) => t.name === "本地任务执行验收"));
    assert.equal(tasks.find(t => t.name === "本地任务执行验收").metadata, null,
      "原表单的空并发配置应保留为 null，启动器必须回退到模板提示词");
    result.checks.push("原任务弹窗选择本地模板及真实窗口后保存本地任务");
    phase = "task-run";
    console.log(phase);
    await page
      .getByRole("button", {
        name: "更多任务操作：本地任务执行验收",
        exact: true,
      })
      .click();
    await page.keyboard.press("Escape");
    await page.locator("tr").filter({ hasText: "本地任务执行验收" })
      .getByRole("button", { name: "立即执行", exact: true })
      .click();
    await page.locator('[contenteditable="true"]').first().waitFor();
    await waitUntil(async () =>
      (
        await page.locator('[contenteditable="true"]').first().innerText()
      ).includes("请返回一次任务执行结果。"),
    );
    result.prompt = await page
      .locator('[contenteditable="true"]')
      .first()
      .innerText();
    if (
      await page.getByRole("button", { name: "跳过", exact: true }).isVisible()
    )
      await page.getByRole("button", { name: "跳过", exact: true }).click();
    await page.locator("button.send-button").click();
    await page
      .getByText("这是本地任务的真实模型输出。", { exact: true })
      .first()
      .waitFor();
    result.checks.push(
      "原提示词任务入口进入聊天并预填内容，确认发送后显示真实模型输出",
    );
    // Exercise persisted scheduled execution separately; the original prompt action opens the composer.
    const task = tasks.find((t) => t.name === "本地任务执行验收");
    await call("agent:userTasks.updateUserTask", {
      taskId: task.id,
      plan_type: "once",
      execute_at: new Date(Date.now() + 1000).toISOString(),
      enabled: true,
    });
    await waitUntil(
      () =>
        page.evaluate(async () =>
          (await globalThis.rebuild.request("agent:taskLogs:list")).value.some(
            (log) =>
              log.taskName === "本地任务执行验收" && log.status === "success",
          ),
        ),
      {},
    );
    await page.evaluate(() =>
      globalThis.__router.push("/agent-console/task-manager"),
    );
    await page.getByText("执行日志", { exact: true }).click();
    await page.getByText("本地任务执行验收", { exact: true }).first().waitFor();
    const promptLog = (await call("agent:taskLogs:summary")).find(log => log.taskId === task.id);
    assert.equal(await page.evaluate(id => Object.hasOwn(globalThis.__localAgentChannel().taskExecutionDetails.value, id), promptLog.id), false,
      'unopened live task output must not allocate viewer details');
    await page.evaluate(() => {
      const request = globalThis.__agentRequest;
      globalThis.__historyDetailReads = 0;
      globalThis.__agentRequest = (method, payload) => {
        if (method === 'taskLogs:list') throw Error('task list must use summaries');
        if (method === 'logs:detail') globalThis.__historyDetailReads++;
        return request(method, payload);
      };
    });
    await page.evaluate(() => globalThis.__localAgentChannel().reconnect());
    await page.locator('tr').filter({ hasText: '本地任务执行验收' })
      .getByRole('button', { name: '查看日志', exact: true }).click();
    await page.getByText('这是本地任务的真实模型输出。', { exact: true }).first().waitFor();
    assert.equal(await page.evaluate(() => globalThis.__historyDetailReads), 1);
    await page.screenshot({ path: path.join(evidence, "agent-task-logs.png") });
    assert.equal(requests, 2);
    result.checks.push(
      "测试经 IPC 设置一次性计划；本地调度器真实执行模型任务，原执行日志页面显示成功结果",
      "重连仅同步摘要；原查看日志按钮按需读取一次详情并显示真实模型输出",
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = { phase, error: error.stack };
    if (page) {
      result.body = await page.locator("body").innerText();
      result.inputs = await page
        .locator("input")
        .evaluateAll((els) =>
          els.map((e) => ({ placeholder: e.placeholder, name: e.name })),
        );
      await page.screenshot({
        path: path.join(evidence, "agent-task-failure.png"),
      });
    }
    process.exitCode = 1;
  } finally {
    try {
      await app?.close();
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
    }
    result.modelRequests = requests;
    await fs.writeFile(
      path.join(evidence, "agent-tasks-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
