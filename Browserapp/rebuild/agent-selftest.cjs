"use strict";
const assert = require("node:assert/strict"),
  http = require("node:http"),
  fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { AgentService } = require("./agent-service");
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-agent-"));
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString("hex");
  const events = [],
    requests = [];
  let mode = "tools";
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const p = JSON.parse(body);
    requests.push(p);
    if (req.url === "/api/chat") {
      res.writeHead(200, { "content-type": "application/x-ndjson" });
      if (!p.messages.some((m) => m.role === "tool"))
        res.end(
          JSON.stringify({
            message: {
              role: "assistant",
              content: "",
              tool_calls: [
                { function: { name: "list_profiles", arguments: {} } },
              ],
            },
            done: true,
          }) + "\n",
        );
      else {
        assert.equal(
          p.messages.find((m) => m.role === "tool").tool_name,
          "list_profiles",
        );
        res.end(
          JSON.stringify({
            message: {
              role: "assistant",
              content: "Ollama 本地工具回合完成。",
            },
            done: true,
          }) + "\n",
        );
      }
      return;
    }
    res.writeHead(200, { "content-type": "text/event-stream" });
    if (mode === "oversized") {
      res.end(
        "data: " +
          JSON.stringify({
            choices: [{ delta: { content: "x".repeat(3 * 1024 * 1024) } }],
          }) +
          "\n\n",
      );
      return;
    }
    if (mode === "invalid-index") {
      res.end(
        "data: " +
          JSON.stringify({
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 10000000,
                      function: { name: "list_profiles", arguments: "{}" },
                    },
                  ],
                },
              },
            ],
          }) +
          "\n\n",
      );
      return;
    }
    if (mode === "wait") {
      res.write(
        "data: " +
          JSON.stringify({ choices: [{ delta: { content: "waiting" } }] }) +
          "\n\n",
      );
      req.on("close", () => res.end());
      return;
    }
    if (!p.messages.some((m) => m.role === "tool"))
      res.end(
        "data: " +
          JSON.stringify({
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: "tool1",
                      function: { name: "list_profiles", arguments: "{}" },
                    },
                  ],
                },
              },
            ],
          }) +
          "\n\ndata: [DONE]\n\n",
      );
    else
      res.end(
        "data: " +
          JSON.stringify({
            choices: [{ delta: { content: "本地有一个窗口。" } }],
          }) +
          "\n\ndata: [DONE]\n\n",
      );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const engine = {
    status: () => [{ id: "one", name: "Local", running: false }],
    emit: (e) => events.push(e),
  };
  const service = new AgentService({ root, engine });
  try {
    await service.request("config:set", {
      provider: "openai",
      baseUrl: "http://127.0.0.1:" + server.address().port,
      model: "test-model",
      apiKey: "test-secret",
    });
    const config = await service.request("config:get");
    assert.equal(config.apiKey, undefined);
    assert.equal(config.hasApiKey, true);
    const c = await service.request("createConversation");
    await service.request("channel:send", {
      type: "conversation.run.start",
      requestId: "req1",
      data: {
        conversationId: c.id,
        message: "列出本地窗口",
        fullAccess: false,
        allowedProfileIds: ["one"],
      },
    });
    await wait(() => !service.active.size);
    const detail = await service.request("conversationDetail", { id: c.id });
    assert.equal(detail.conversation.latestRunStatus, "completed");
    assert.equal(detail.messages.at(-1).content, "本地有一个窗口。");
    assert.equal(requests.length, 2);
    assert.ok(
      requests[1].messages.some(
        (m) => m.role === "tool" && m.content.includes("Local"),
      ),
    );
    const log = (await service.request("logs:list"))[0];
    assert.ok(
      (await service.request("logs:replay", { id: log.id })).events.some(
        (e) => e.event.type === "tool_finished",
      ),
    );
    assert.ok(detail.conversation.checkpoint.context.length);
    assert.deepEqual(detail.conversation.checkpoint.allowedProfileIds, ["one"]);
    assert.equal(detail.conversation.checkpoint.fullAccess, false);
    await service.request("resume", { id: c.id });
    await wait(() => !service.active.size);
    assert.equal(service.conversation(c.id).latestRunStatus, "completed");
    assert.ok(
      requests.at(-1).messages.at(-1).content.startsWith("继续上次中断"),
    );
    mode = "oversized";
    await assert.rejects(
      service.completion(
        service.data.config,
        [{ role: "user", content: "large" }],
        { abort: new AbortController() },
      ),
      /2 MiB/,
    );
    mode = "invalid-index";
    await assert.rejects(
      service.completion(
        service.data.config,
        [{ role: "user", content: "bad index" }],
        { abort: new AbortController() },
      ),
      /索引无效/,
    );
    mode = "tools";
    const { compactContext } = require("./context-window");
    const history = [
      { role: "system", content: "system" },
      { role: "user", content: "old".repeat(1000) },
      { role: "assistant", content: "old answer" },
      { role: "user", content: "latest" },
      {
        role: "assistant",
        tool_calls: [
          { id: "call", function: { name: "list_profiles", arguments: "{}" } },
        ],
      },
      { role: "tool", tool_call_id: "call", content: "result" },
    ];
    assert.ok(compactContext(history, 1000).removed > 0);
    assert.equal(history[1].content, "latest");
    assert.equal(history[2].tool_calls[0].id, history[3].tool_call_id);
    const disk = await fs.readFile(path.join(root, "local-agent/state.enc"));
    assert.equal(disk.includes(Buffer.from("test-secret")), false);
    const again = new AgentService({ root, engine });
    assert.equal((await again.request("conversationList"))[0].id, c.id);
    const template = (
      await service.request("userTemplates.createUserTemplate", {
        template_type: "prompt",
        name: "本地任务模板",
        metadata: { prompt: "列出本地窗口" },
      })
    ).data;
    assert.equal(template.templateType, "prompt");
    const task = (
      await service.request("userTasks.createUserTask", {
        name: "本地任务",
        user_template_id: template.id,
        window_ids: [],
        plan_type: "manual",
        enabled: true,
      })
    ).data;
    const started = await service.request("runTask", { id: task.id });
    assert.ok(started.taskLogId);
    await wait(() => !service.active.size);
    assert.equal((await service.request("taskLogs:list"))[0].status, "success");
    const { next } = require("./agent-records");
    assert.equal(
      next(
        { enabled: true, planType: "cron", cron: "0 * * * *", timezone: "UTC" },
        Date.parse("2026-11-14T10:30:00Z"),
      ),
      "2026-11-14T11:00:00.000Z",
    );
    mode = "wait";
    const second = await service.request("createConversation");
    await service.request("channel:send", {
      type: "conversation.run.start",
      requestId: "req2",
      data: { conversationId: second.id, message: "等待" },
    });
    await wait(() =>
      events.some(
        (e) =>
          e.payload?.data?.conversationId === second.id &&
          e.payload?.data?.event?.type === "content_delta",
      ),
    );
    await service.request("channel:send", {
      type: "conversation.run.stop",
      data: { conversationId: second.id },
    });
    await wait(() => !service.active.size);
    assert.equal(service.conversation(second.id).latestRunStatus, "cancelled");
    assert.equal(
      service.conversation(second.id).messages.at(-1).content,
      "waiting",
      "取消后保留已流式输出的正文",
    );
    await service.request("config:set", {
      provider: "ollama",
      baseUrl: "http://127.0.0.1:" + server.address().port,
    });
    const ollama = await service.request("createConversation");
    await service.request("channel:send", {
      type: "conversation.run.start",
      requestId: "ollama1",
      data: { conversationId: ollama.id, message: "列出窗口" },
    });
    await wait(() => !service.active.size);
    assert.equal(
      service.conversation(ollama.id).messages.at(-1).content,
      "Ollama 本地工具回合完成。",
    );
    await service.request("skills:save", {
      slug: "test-skill",
      content: "Use list_profiles only.",
      enabled: true,
    });
    assert.ok(
      (await service.request("skills:list")).some(
        (s) => s.slug === "test-skill",
      ),
    );
    await assert.rejects(
      service.request("skills:save", { slug: "../escape" }),
      /无效/,
    );
    const builtin = (await service.request("skills:list")).find(
      (skill) => skill.builtin,
    );
    const reference = await service.tool("read_skill_file", {
      slug: builtin.slug,
      file: "references/legacy-SKILL.md",
    });
    assert.ok(reference.content.length > 0);
    await assert.rejects(
      service.tool("read_skill_file", {
        slug: builtin.slug,
        file: "../../agent-service.js",
      }),
      /越界/,
    );
    await service.request("skills:save", {
      slug: builtin.slug,
      enabled: true,
      root: "/etc",
    });
    assert.equal(
      (await service.request("skills:list")).find(
        (skill) => skill.slug === builtin.slug,
      ).root,
      builtin.root,
      "编辑接口不能覆写包根路径",
    );
    console.log(
      JSON.stringify(
        {
          status: "PASS",
          checks: [
            "OpenAI SSE tool round trip with local HTTP fixture",
            "real tool result enters second model request",
            "encrypted key and restart persistence",
            "checkpoint and log replay",
            "cancel aborts streaming request",
            "skill CRUD and path validation",
            "Skill reference read, traversal rejection and root whitelist",
            "local template/task execution and task log",
            "cron timezone calculation",
            "bounded LLM response and invalid tool index rejection",
            "context compaction keeps latest turn and tool pairing",
            "Ollama native NDJSON and object tool arguments",
          ],
          events: events.length,
        },
        null,
        2,
      ),
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
    delete process.env.OPENBROWSER_MASTER_KEY;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
async function wait(fn) {
  const limit = Date.now() + 10000;
  while (!fn()) {
    if (Date.now() > limit) throw Error("Timed out");
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
