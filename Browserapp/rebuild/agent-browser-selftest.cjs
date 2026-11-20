"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory, openWorkspacePage } = require("./selftest-helpers.cjs");
const { _electron: electron, chromium } = require("playwright"),
  http = require("node:http"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { waitUntil } = require("./selftest-helpers.cjs");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await createTestDirectory('agent-browser-'),
    evidence = evidenceDirectory(),
    result = {
      passed: false,
      errors: [],
      externalRequests: [],
      checks: [],
      modelRequests: 0,
      scriptModelRequests: 0,
    };
  let app, page, profileId, browser;
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== "POST") {
        if (req.url === "/script-fixture.json") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end('{"value":"归档脚本已写入"}');
          return;
        }
        if (req.url === "/script-download.txt") {
          res.writeHead(200, { "Content-Type": "text/plain", "Content-Disposition": 'attachment; filename="sample.txt"' });
          res.end("download from the selected browser");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(
          '<!doctype html><html><title>Agent browser fixture</title><body><h1>真实浏览器测试页面</h1><input id="agent-note"><button id="agent-apply" onclick="document.querySelector(\'#agent-result\').textContent=document.querySelector(\'#agent-note\').value">应用</button><p id="agent-result">等待操作</p></body></html>',
        );
        return;
      }
      let body = "";
      for await (const chunk of req) body += chunk;
      const request = JSON.parse(body);
      if (request.messages.at(-1)?.content === "本地脚本结构化输出") {
        result.scriptModelRequests++;
        assert.deepEqual(request.tools, []);
        assert.equal(request.temperature, 0);
        assert.equal(request.max_tokens, 75);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { content: '{"local":true}' } }] }));
        return;
      }
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
    await page.evaluate(() => globalThis.ops.saveClientSettings({ diskLimit: 0 }));
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
    page = await openWorkspacePage(app, "/agent-console/c/" + conversation.id);
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
    const scriptRequest = (method, payload) =>
      page.evaluate(([name, value]) => globalThis.__agentRequest(name, value), [method, payload]);
    const { data: scriptTemplate } = await scriptRequest("userTemplates.createUserTemplate", {
      name: "本地窗口脚本", templateType: "script",
      metadata: {
        filename: "browser.ts",
        scriptSource: `
          import {browser, defineMetadata, defineParams} from "@openbrowser/sandbox";
          defineMetadata({name:"本地窗口脚本"});
          defineParams({type:"object",properties:{text:{type:"string",default:"脚本已写入"}}});
          export async function main(options: {text:string}) {
            if (!(await browser.listTabs()).length) throw Error("标签页不存在");
            await browser.fill("#agent-note", options.text);
            await browser.click("#agent-apply");
            return (await browser.readPage()).text;
          }
        `,
      },
    });
    const { data: scriptTask } = await scriptRequest("userTasks.createUserTask", {
      name: "本地窗口脚本", userTemplateId: scriptTemplate.id, windowIds: [profileId],
    });
    const scriptRun = await scriptRequest("runTask", { id: scriptTask.id });
    const scriptLog = await waitUntil(async () => (await scriptRequest("taskLogs:summary", {}))
      .find(log => log.id === scriptRun.taskLogId && ["success", "failed"].includes(log.status)));
    const scriptDetail = await scriptRequest("logs:detail", { id: scriptLog.id });
    assert.equal(scriptLog.status, "success", JSON.stringify(scriptDetail.messages));
    assert.equal(await tab.locator("#agent-result").innerText(), "脚本已写入");
    assert.equal(result.modelRequests, 6);
    result.checks.push("隔离脚本使用受限模块读取真实 Chromium 标签页、填写、点击和读取结果，模型请求次数不增加");
    const source = `
      import { chromium, firefox } from "playwright";
      import { Table } from "@roxybrowser/sandbox/table";
      import { KV } from "@roxybrowser/sandbox/kv";
      import { sleep } from "@roxybrowser/sandbox/utils";
      import { capturePageState } from "@roxybrowser/sandbox/debug";
      import { saveDownload } from "@roxybrowser/sandbox/download";
      import { json } from "@roxybrowser/sandbox/llm";
      import path from "node:path";
      import fs from "node:fs/promises";
      export async function main() {
        const { BROWSER_URL, BROWSER_TYPE } = process.env;
        const browserType = BROWSER_TYPE === "firefox" ? firefox : chromium;
        try { await browserType.connect("ws://127.0.0.1:1/"); throw Error("连接目标越界"); }
        catch (error) { if (!error.message.includes("任务指定")) throw error; }
        const browser = await browserType.connect(BROWSER_URL);
        const page = browser.contexts()[0].pages().find(page => page.url().includes("127.0.0.1"));
        const pendingResponse = page.waitForResponse(response => response.url().endsWith("/script-fixture.json") && response.status() === 200);
        const endpoint = new URL("/script-fixture.json", page.url());
        const [, response] = await Promise.all([page.evaluate(url => fetch(url), endpoint.href), pendingResponse]);
        const { value } = await response.json();
        await page.locator("input").filter({ visible: true }).fill(value);
        await page.getByRole("button", { name: /应用/ }).click();
        await sleep(5, 8);
        if (await page.locator("#agent-result").evaluate(node => node.textContent) !== value) throw Error("窗口内容错误");
        const table = new Table("results"), kv = new KV("checkpoint");
        const hits = (await kv.get("hits") || 0) + 1;
        await Promise.all([table.append({ window: process.env.SANDBOX_DIR_ID, value, hits }), kv.set("hits", hits)]);
        if (!(await kv.has("hits")) || !(await table.find(row => row.hits === hits))) throw Error("持久化读取失败");
        await fs.writeFile(path.join(process.cwd(), "notes", "result.txt"), value);
        if (await fs.readFile("notes/result.txt", "utf8") !== value) throw Error("输出读回失败");
        await capturePageState(page, "after-form");
        await page.evaluate(() => {
          const link = document.createElement("a");
          link.href = "/script-download.txt";
          link.textContent = "样例下载";
          document.body.append(link);
        });
        await saveDownload(page, () => page.getByRole("link", { name: "样例下载" }).last().click(), { filename: "sample.txt" });
        const model = await json("本地脚本结构化输出", {
          type: "object", properties: { local: { type: "boolean" } }, required: ["local"],
        }, { temperature: 0, maxTokens: 75 });
        await browser.close();
        return { value, hits, model };
      }
    `;
    const { data: legacyTemplate } = await scriptRequest("userTemplates.createUserTemplate", {
      name: "归档脚本兼容验收", templateType: "script", metadata: { filename: "archive.ts", scriptSource: source },
    });
    const { data: legacyTask } = await scriptRequest("userTasks.createUserTask", {
      name: "归档脚本兼容验收", userTemplateId: legacyTemplate.id, windowIds: [profileId], metadata: { debug: true },
    });
    let firstArtifacts;
    for (const hits of [1, 2]) {
      const { taskLogId } = await scriptRequest("runTask", { id: legacyTask.id });
      const log = await waitUntil(async () => (await scriptRequest("taskLogs:summary", {}))
        .find(log => log.id === taskLogId && ["success", "failed"].includes(log.status)));
      const detail = await scriptRequest("logs:detail", { id: taskLogId });
      assert.equal(log.status, "success", JSON.stringify(detail.scriptWindows));
      assert.ok(detail.scriptWindows[0].log.includes('"hits":' + hits));
      const files = detail.scriptWindows[0].artifacts;
      assert.deepEqual(files.map(file => file.fileName).sort(), ["checkpoint.kv.json", "html-snapshots/after-form.html",
        "notes/result.txt", "results.csv", "sample.txt"]);
      if (hits === 1) firstArtifacts = files;
    }
    assert.equal(result.scriptModelRequests, 2);
    assert.equal(await tab.locator("#agent-result").innerText(), "归档脚本已写入");
    const csv = firstArtifacts.find(file => file.fileName === "results.csv");
    const snapshot = await app.evaluate(({ net }, url) => net.fetch(url).then(response => response.text()), csv.localUrl);
    assert.match(snapshot, /window,value,hits\n[^\n]+,归档脚本已写入,1\n$/);
    const taskPage = await openWorkspacePage(app, "/agent-console/task-manager");
    await taskPage.getByText("执行日志", { exact: true }).click();
    await taskPage.locator("tr").filter({ hasText: "归档脚本兼容验收" })
      .getByRole("button", { name: "查看日志", exact: true }).first().click();
    const artifactLink = taskPage.getByRole("link", { name: /results\.csv/ });
    await artifactLink.waitFor();
    const exported = path.join(data, "compatibility-export.csv");
    await app.evaluate(({ session }, target) => {
      session.defaultSession.once("will-download", (_event, item) => item.setSavePath(target));
    }, exported);
    await artifactLink.click();
    await waitUntil(async () => (await fs.readFile(exported, "utf8").catch(() => "")).includes(",2\n"));
    assert.equal((await fs.readFile(exported, "utf8")).split("\n").filter(Boolean).length, 3);
    await taskPage.screenshot({ path: path.join(evidence, "agent-script-compatible-artifacts.png") });
    result.checks.push("归档 Playwright 脚本兼容，覆盖页面表达式、响应等待、实际下载、CSV、KV、调试产物与自配模型");
    result.checks.push("任务日志的产物链接实际导出最新 CSV，旧运行仍保留独立快照");
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
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
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
