const { waitUntil } = require("./selftest-helpers.cjs");
("use strict");
const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { unwrapIpcResult } = require("../shared/ipc-result");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const evidence = path.join(repo, "docs/rebuild/evidence"),
    data = await fs.mkdtemp(path.join(repo, "work/rebuild/task-ui-"));
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
      "data: " +
        JSON.stringify({
          choices: [{ delta: { content: "这是本地任务的真实模型输出。" } }],
        }) +
        "\n\ndata: [DONE]\n\n",
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
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        path.join(repo, "Browserapp"),
      ],
      env: {
        ...process.env,
        OPENBROWSER_ROXY_UI: "1",
        OPENBROWSER_USER_DATA: data,
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
    await page.evaluate(() =>
      globalThis.__router.push("/agent-console/templates"),
    );
    await page
      .getByRole("button", { name: "创建模板", exact: true })
      .last()
      .click();
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
    phase = "task-create";
    console.log(phase);
    await page.evaluate(() =>
      globalThis.__router.push("/agent-console/task-manager"),
    );
    await call("profiles:create", { windowName: "任务关联窗口" });
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
    await page
      .getByRole("button", { name: "立即执行", exact: true })
      .last()
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
    await page.screenshot({ path: path.join(evidence, "agent-task-logs.png") });
    assert.equal(requests, 2);
    result.checks.push(
      "测试经 IPC 设置一次性计划；本地调度器真实执行模型任务，原执行日志页面显示成功结果",
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
    await app?.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
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
