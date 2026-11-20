"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { _electron: electron } = require("playwright");
const { createTestDirectory, openWorkspacePage, waitUntil } = require("./selftest-helpers.cjs");
const { evidencePath } = require("./compiler/evidence-path.cjs");

async function main() {
  const data = await createTestDirectory("agent-integrations-");
  const errors = [], requests = [];
  let app;
  async function launch() {
    app = await electron.launch({
      executablePath: require("electron"),
      args: [...(process.platform === "linux" ? ["--no-sandbox", "--ozone-platform=headless", "--disable-gpu"] : []), path.join(__dirname, "..")],
      env: { ...process.env, OPENBROWSER_USER_DATA: data, OPENBROWSER_API_PORT: "0" },
    });
    const page = await app.firstWindow();
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (/^https?:|^wss?:/.test(request.url())) requests.push(request.url()); });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    return page;
  }
  try {
    const mainPage = await launch();
    await app.evaluate(() => {
      const fixture = { sent: [], verified: [], prompts: [], queue: [] };
      globalThis.agentIntegrationsFixture = fixture;
      const liveFetch = globalThis.fetch;
      globalThis.fetch = async (input, options) => {
        const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
        if (url.hostname === "api.telegram.org") {
          const action = url.pathname.split("/").at(-1);
          const body = options.body ? JSON.parse(options.body) : {};
          if (action === "getMe") {
            fixture.verified.push({ provider: "telegram", tokenPath: url.pathname });
            return Response.json({ ok: true, result: { is_bot: true } });
          }
          if (action === "getUpdates") {
            if (body.offset < 0) return Response.json({ ok: true, result: [{ update_id: 1 }] });
            if (!fixture.queue.length) {
              await new Promise(resolve => setTimeout(resolve, 30));
              options.signal.throwIfAborted();
            }
            return Response.json({ ok: true, result: fixture.queue.splice(0) });
          }
          if (action === "sendMessage") {
            fixture.sent.push(body);
            return Response.json({ ok: true, result: {} });
          }
        }
        if (url.hostname === "open.larksuite.com") {
          fixture.verified.push({ provider: "lark", url: url.href, method: options.method, body: JSON.parse(options.body) });
          return Response.json({ code: 0, tenant_access_token: "fixture-tenant-token" });
        }
        if (url.hostname === "slack.com" || url.hostname === "discord.com") {
          const slack = url.hostname === "slack.com";
          fixture.verified.push({ provider: slack ? "slack" : "discord", auth: options.headers.Authorization });
          return Response.json(slack ? { ok: true } : { bot: true, id: "12345" });
        }
        if (url.href === "http://127.0.0.1:65432/chat/completions") {
          const payload = JSON.parse(options.body);
          fixture.prompts.push(payload);
          const text = payload.messages.at(-1).content;
          return Response.json({ choices: [{ finish_reason: "stop", message: { content: "模型回复：" + text } }] });
        }
        return liveFetch(input, options);
      };
    });
    const request = (method, payload) => mainPage.evaluate(([name, value]) => globalThis.__localRequest(name, value), [method, payload]);
    await request("agent:config:set", { provider: "openai", model: "im-fixture", baseUrl: "http://127.0.0.1:65432" });
    const settings = await openWorkspacePage(app, "/agent-console/settings");
    const button = name => settings.getByRole("button", { name, exact: true });
    async function saveAndTest() {
      await button("保存配置").click();
      await settings.getByText("配置已保存", { exact: true }).waitFor();
      await button("测试连接").click();
      await settings.getByText("凭证验证通过", { exact: true }).waitFor();
    }
    await button("消息平台").click();
    await settings.getByLabel("Bot Token", { exact: true }).fill("123456:telegram_fixture_token");
    await settings.getByLabel("允许的聊天 ID", { exact: true }).fill("10001, -22002");
    await saveAndTest();
    await button("启动 Telegram").click();
    await button("停止 Telegram").waitFor();
    await assert.rejects(request("agent:integrations:set", {
      provider: "telegram", values: { allowedChatIds: "92345" },
    }), /先停止/);
    await app.evaluate(() => {
      const { queue } = globalThis.agentIntegrationsFixture;
      queue.push(
        { update_id: 2, message: { chat: { id: 99999 }, text: "未授权的内容" } },
        { update_id: 3, message: { chat: { id: 10001 }, text: "你好", message_thread_id: 8 } },
        { update_id: 4, message: { chat: { id: 10001 }, text: "/status", message_thread_id: 8 } },
      );
    });
    await waitUntil(() => app.evaluate(() => globalThis.agentIntegrationsFixture.sent.length === 2));
    const { sent, prompts } = await app.evaluate(() => globalThis.agentIntegrationsFixture);
    assert.deepEqual(sent, [
      { chat_id: "10001", text: "模型回复：你好", message_thread_id: 8 },
      { chat_id: "10001", text: "当前对话长度：2 条消息", message_thread_id: 8 },
    ]);
    assert.equal(prompts.length, 1);
    assert.deepEqual(prompts[0].tools, []);
    await settings.screenshot({ path: evidencePath("agent-telegram-settings.png") });
    await button("停止 Telegram").click();
    await settings.getByText("Telegram · 已停止", { exact: true }).waitFor();

    await button("飞书 / Lark").click();
    await settings.getByLabel("环境", { exact: true }).selectOption("lark");
    await settings.getByLabel("App ID", { exact: true }).fill("fixture_app");
    await settings.getByLabel("App Secret", { exact: true }).fill("lark_fixture_secret");
    await saveAndTest();
    for (const provider of ["Slack", "Discord"]) {
      await button(provider).click();
      await settings.getByLabel("Bot Token", { exact: true }).fill(provider + "_fixture_token");
      await saveAndTest();
    }
    const verified = await app.evaluate(() => globalThis.agentIntegrationsFixture.verified);
    assert.equal(verified.filter(item => item.provider === "telegram").length, 2);
    assert.deepEqual(verified.find(item => item.provider === "lark"), {
      provider: "lark", url: "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal",
      method: "POST", body: { app_id: "fixture_app", app_secret: "lark_fixture_secret" },
    });
    assert.deepEqual(verified.find(item => item.provider === "slack"), { provider: "slack", auth: "Bearer Slack_fixture_token" });
    assert.deepEqual(verified.find(item => item.provider === "discord"), { provider: "discord", auth: "Bot Discord_fixture_token" });
    assert.equal(await settings.getByLabel("Bot Token", { exact: true }).inputValue(), "");

    await app.close();
    const encrypted = await fs.readFile(path.join(data, "local-agent", "state.enc"));
    for (const secret of ["telegram_fixture_token", "lark_fixture_secret", "Slack_fixture_token", "Discord_fixture_token"])
      assert.equal(encrypted.includes(secret), false);
    await launch();
    const opening = app.waitForEvent("window");
    await (await app.firstWindow()).evaluate(() => globalThis.__router.push("/agent-console/roxyclaw/telegram"));
    const reopened = await opening;
    assert.equal(new URL(reopened.url()).searchParams.get("workspace"), "/agent-console/settings");
    await reopened.getByText("Telegram · 已停止", { exact: true }).waitFor();
    await reopened.getByPlaceholder("已保存，留空保留原值").waitFor();
    assert.equal(await reopened.getByLabel("允许的聊天 ID", { exact: true }).inputValue(), "10001, -22002");
    await reopened.getByRole("button", { name: "清除凭证", exact: true }).click();
    await reopened.getByText("凭证已清除", { exact: true }).waitFor();
    assert.equal(await reopened.getByRole("button", { name: "启动 Telegram", exact: true }).isDisabled(), true);
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    console.log("AGENT_INTEGRATION_UI_SELFTEST OK (credential verification, Telegram reply, allowlist, stop and encrypted settings across restart)");
  } finally {
    await app?.close();
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
