"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs/promises"),
  path = require("node:path"), os = require("node:os"), http = require("node:http");
const { AgentService } = require("./agent-service");
const evidence = path.resolve(__dirname, "../../docs/rebuild/evidence/review-3"),
  result = { passed: false, cases: [] };
async function check(name, operation) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-contract-")),
    service = new AgentService({ root, engine: { emit() {}, status: () => [] } });
  try { await service.load(); await operation(service, root); result.cases.push({ name, status: "PASS" }); }
  catch (error) { result.cases.push({ name, status: "FAIL", error: error.stack }); }
  finally { if (!service.closing) await service.shutdown(); }
}
async function conversation(service) { return service.request("createConversation"); }
(async () => {
  await fs.mkdir(evidence, { recursive: true });
  await check("编辑 Skill 提示词保留原包元数据", async service => {
    const metadata = { slug: "contract-skill", packageSlug: "contract-skill", files: ["SKILL.md", "references/a.md"], skillMetadata: { name: "contract-skill" }, prompt: "old" };
    const row = (await service.request("userTemplates.createUserTemplate", { name: "Skill", templateType: "skill", metadata })).data;
    const edited = (await service.request("userTemplates.updateUserTemplate", { templateId: row.id, metadata: { prompt: "edited" } })).data;
    assert.deepEqual(edited.metadata, { ...metadata, prompt: "edited" });
  });
  await check("任务列表按 created_at 排序，不随开关更新而跳位", async service => {
    const template = (await service.request("userTemplates.createUserTemplate", { name: "Prompt", metadata: { prompt: "test" } })).data;
    const old = (await service.request("userTasks.createUserTask", { name: "older", userTemplateId: template.id })).data,
      recent = (await service.request("userTasks.createUserTask", { name: "newer", userTemplateId: template.id })).data;
    Object.assign(old, { createdAt: "2020-01-01", updatedAt: "2025-01-01" });
    Object.assign(recent, { createdAt: "2021-01-01", updatedAt: "2022-01-01" });
    const rows = (await service.request("userTasks.listUserTasks", { sortBy: "created_at", sortOrder: "desc" })).data.items;
    assert.deepEqual(rows.map(row => row.id), [recent.id, old.id]);
  });
  await check("已读接口返回原界面所需的会话 DTO", async service => {
    const c = await conversation(service); Object.assign(c, { unread: true, latestRunId: "current", latestRunStatus: "completed" });
    const read = await service.request("markConversationRead", { id: c.id, runId: "current" });
    assert.equal(read.id, c.id); assert.equal(read.unread, false); assert.equal(read.latestRunId, "current");
  });
  await check("旧轮次已读请求不得清掉新轮次未读", async service => {
    const c = await conversation(service); Object.assign(c, { unread: true, latestRunId: "new-run", latestRunStatus: "completed" });
    const read = await service.request("markConversationRead", { id: c.id, runId: "old-run" });
    assert.equal(c.unread, true); assert.equal(read.unread, true); assert.equal(read.latestRunId, "new-run");
  });
  await check("刷新历史消息后附件仍在 metadata.attachments 中", async service => {
    const c = await conversation(service), file = await service.request("uploadFile", { fileName: "persisted.txt", data: Buffer.from("real encrypted attachment").toString("base64") });
    c.messages.push({ id: "user-with-file", role: "user", content: "attachment", attachments: [file] }); await service.save();
    const detail = await service.request("conversationDetail", { id: c.id });
    assert.deepEqual(detail.messages[0].metadata.attachments, [file]);
  });
  await check("历史游标分页在追加新消息后不重复、不漏旧消息", async service => {
    const c = await conversation(service);
    c.messages = Array.from({ length: 6 }, (_, i) => ({ id: "message-" + i, role: i % 2 ? "assistant" : "user", content: "body-" + i })); await service.save();
    const latest = await service.request("conversationDetail", { id: c.id, limit: 2 });
    assert.deepEqual(latest.messages.map(row => row.id), ["message-4", "message-5"]); assert.equal(latest.hasMore, true);
    c.messages.push({ id: "message-6", role: "user", content: "appended" });
    const middle = await service.request("conversationDetail", { id: c.id, limit: 2, cursor: latest.nextCursor });
    const oldest = await service.request("conversationDetail", { id: c.id, limit: 2, cursor: middle.nextCursor });
    assert.deepEqual([...oldest.messages, ...middle.messages, ...latest.messages].map(row => row.id), Array.from({ length: 6 }, (_, i) => "message-" + i));
    assert.equal(oldest.hasMore, false); assert.equal(oldest.nextCursor, null);
    await assert.rejects(service.request("conversationDetail", { id: c.id, cursor: "missing-cursor", limit: 2 }), /游标|cursor/);
  });
  for (const method of ["config:set", "createConversation", "updateConversation", "markConversationRead", "deleteConversation", "deleteTaskLog"])
    await check(method + " 写盘失败不改变已提交内存状态", async service => {
      const c = await conversation(service); Object.assign(c, { unread: true, latestRunId: "current", latestRunStatus: "completed" }); await service.save();
      if (method === "deleteTaskLog") { service.data.logs.push({ id: c.id, conversationId: c.id, status: "success" }); await service.save(); }
      const before = structuredClone(service.data), original = service.save.bind(service);
      service.save = async () => { throw Error("injected durable-write failure"); };
      try { await assert.rejects(service.request(method, method === "config:set" ? { model: "unsaved" } : { id: c.id, title: "unsaved", runId: "current" }), /durable-write/); }
      finally { service.save = original; }
      assert.deepEqual(service.data, before);
    });
  await check("真实模型结束持久化未读，最近会话按实际更新时间排序", async service => {
    const server = http.createServer(async (req, res) => { for await (const _ of req) {} res.writeHead(200, { "Content-Type": "text/event-stream" }); res.end('data: {"choices":[{"delta":{"content":"actual SSE reply"}}]}\n\ndata: [DONE]\n\n'); });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      await service.request("config:set", { provider: "openai", baseUrl: "http://127.0.0.1:" + server.address().port, model: "fixture" });
      const a = await conversation(service), b = await conversation(service); b.updatedAt = "2000-01-01T00:00:00Z";
      await service.request("channel:send", { type: "conversation.run.start", data: { conversationId: a.id, message: "actual run", fullAccess: true }, requestId: "fixture" });
      await service.active.get(a.id).done;
      assert.equal(a.latestRunStatus, "completed"); assert.equal(a.unread, true);
      assert.ok(a.messages.at(-1).events.every(event => event.startSequence === event.sequence), "原子事件必须声明自己的序号区间");
      assert.equal((await service.request("conversationList", { limit: 20 }))[0].id, a.id);
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  });
  await check("配置并发部分更新及实际 rename 故障保持磁盘/内存一致", async (service, root) => {
    await Promise.all([service.request("config:set", { model: "merged-model" }), service.request("config:set", { provider: "openai", baseUrl: "http://127.0.0.1:12345" })]);
    assert.equal(service.data.config.model, "merged-model"); assert.equal(service.data.config.provider, "openai");
    const before = structuredClone(service.data), rename = fs.rename;
    fs.rename = async (from, to) => { if (to === path.join(service.root, "state.enc")) throw Error("injected real rename failure"); return rename(from, to); };
    try { await assert.rejects(service.request("config:set", { model: "not-committed" }), /real rename/); }
    finally { fs.rename = rename; }
    assert.deepEqual(service.data, before); assert.deepEqual((await fs.readdir(service.root)).filter(name => /\.tmp$/.test(name)), []);
    const reloaded = new AgentService({ root, engine: { emit() {}, status: () => [] } });
    try { await reloaded.load(); assert.deepEqual(reloaded.data.config, before.config); }
    finally { await reloaded.shutdown(); }
  });
  await check("删除写盘期间禁止新运行，提交前不提前删除会话", async service => {
    const c = await conversation(service), rename = fs.rename; let release, entered;
    const gate = new Promise(resolve => { release = resolve; }), ready = new Promise(resolve => { entered = resolve; });
    fs.rename = async (from, to) => { if (to === path.join(service.root, "state.enc")) { entered(); await gate; } return rename(from, to); };
    let deleting;
    try {
      deleting = service.request("deleteConversation", { id: c.id }); await ready;
      assert.equal(service.conversation(c.id).id, c.id);
      await assert.rejects(service.request("channel:send", { type: "conversation.run.start", data: { conversationId: c.id, message: "race" } }), /正在删除/);
      release(); await deleting; assert.equal(service.active.size, 0); assert.throws(() => service.conversation(c.id), /不存在/);
    } finally { release(); fs.rename = rename; await deleting; }
  });
  await check("不可用 Skill 任务失败不遗留空会话", async service => {
    const template = (await service.request("userTemplates.createUserTemplate", { name: "missing skill", templateType: "skill", metadata: { slug: "missing-skill" } })).data;
    const task = (await service.request("userTasks.createUserTask", { name: "unavailable", userTemplateId: template.id })).data;
    await assert.rejects(service.request("runTask", { id: task.id }), /Skill 不存在|未启用/);
    assert.equal(service.data.conversations.length, 0); assert.equal(service.active.size, 0);
  });
  await check("关闭标记后内部 start 同样拒绝新运行", async service => {
    const c = await conversation(service); service.closing = true;
    try { assert.throws(() => service.start({ conversationId: c.id, message: "late" }, "late"), /正在关闭/); assert.equal(service.active.size, 0); assert.equal(c.messages.length, 0); }
    finally { service.closing = false; }
  });
  for (const kind of ["template", "skill", "catalog-pin", "mcp"]) await check(kind + " 保存失败不得借并发配置写入落盘", async service => {
    if (kind === "skill") await service.request("skills:save", { slug: "stable-skill", content: "name: stable-skill", enabled: true });
    if (kind === "mcp") { service.data.mcpServers = []; await service.save(); }
    const catalog = kind === "catalog-pin" ? (await service.request("templates.listOfficialTemplates")).data[0] : null;
    const rename = fs.rename; let release, entered, writes = 0;
    const gate = new Promise(resolve => { release = resolve; }), ready = new Promise(resolve => { entered = resolve; });
    fs.rename = async (from, to) => {
      if (to === path.join(service.root, "state.enc")) {
        writes++; if (writes === 1) { entered(); await gate; }
        if (writes === 3) throw Error("injected record rename failure");
      }
      return rename(from, to);
    };
    let initial, config, mutation;
    try {
      initial = service.save(); await ready;
      config = service.request("config:set", { model: "committed-model" });
      mutation = kind === "template" ? service.request("userTemplates.createUserTemplate", { name: "must not persist", metadata: { prompt: "test" } })
        : kind === "skill" ? service.request("skills:save", { slug: "stable-skill", enabled: false }) : kind === "mcp" ? service.request("mcp:upsert", { name: "not-committed", config: { type: "http", url: "http://127.0.0.1:12345" } }) : service.request("templates.topOfficialTemplate", { id: catalog.id });
      const rejected = assert.rejects(mutation, /record rename failure/);
      await new Promise(resolve => setImmediate(resolve)); release(); await initial; await config; await rejected;
      const disk = require("../credential-crypto").decryptCredentialJson(await fs.readFile(path.join(service.root, "state.enc")));
      assert.deepEqual(disk, service.data, "其他请求不能把尚未提交的记录带入自己的快照");
    } finally { release(); fs.rename = rename; await Promise.allSettled([initial, config, mutation]); }
  });
  await check("旧版原子事件区间迁移并实际加密落盘", async (service, root) => {
    const c = await conversation(service), events = [1, 2, 3].map(sequence => ({ sequence, startSequence: 1, runId: "legacy-run", event: { type: sequence === 3 ? "run_completed" : "content_delta", data: { text: "legacy" } } }));
    c.messages.push({ id: "legacy-assistant", role: "assistant", content: "legacy", events });
    service.data.logs.push({ id: "legacy-run", status: "completed", events: structuredClone(events), messages: structuredClone(c.messages) });
    service.data.eventProtocolVersion = 1; await service.shutdown();
    const reloaded = new AgentService({ root, engine: { emit() {}, status: () => [] } });
    try {
      await reloaded.load(); const disk = require("../credential-crypto").decryptCredentialJson(await fs.readFile(path.join(reloaded.root, "state.enc")));
      assert.equal(disk.eventProtocolVersion, 2);
      for (const stream of [disk.conversations[0].messages[0].events, disk.logs[0].events, disk.logs[0].messages[0].events]) assert.deepEqual(stream.map(event => event.startSequence), [1, 2, 3]);
    } finally { await reloaded.shutdown(); }
  });
  await check("异常退出的会话回放明确结束且检查点保留", async (service, root) => {
    const c = await conversation(service), events = [1, 2].map(sequence => ({ conversationId: c.id, assistantMessageId: "crashed-assistant", runId: "crashed", sequence, startSequence: sequence, event: { type: sequence === 1 ? "run_started" : "content_delta", data: { text: "partial" } } }));
    Object.assign(c, { latestRunId: "crashed", latestRunStatus: "running", checkpoint: { context: [{ role: "user", content: "continue me" }], fullAccess: false, allowedProfileIds: ["allowed"] } });
    c.messages.push({ id: "crashed-assistant", role: "assistant", content: "partial", events });
    service.data.logs.push({ id: "crashed", status: "running", events: structuredClone(events), messages: structuredClone(c.messages) });
    await service.shutdown();
    const reloaded = new AgentService({ root, engine: { emit() {}, status: () => [] } });
    try {
      const detail = await reloaded.request("conversationDetail", { id: c.id });
      assert.equal(detail.conversation.latestRunStatus, "cancelled"); assert.equal(detail.conversation.interrupted, true);
      assert.equal(detail.messages[0].events.at(-1).event.type, "run_cancelled"); assert.equal(detail.messages[0].events.at(-1).event.data.reason, "process_exit");
      assert.deepEqual(detail.conversation.checkpoint, c.checkpoint); assert.equal(reloaded.data.logs[0].events.at(-1).event.type, "run_cancelled");
    } finally { await reloaded.shutdown(); }
  });
  await check("恢复写盘短暂失败后实际加载可重试且不覆盖旧文件", async (service, root) => {
    service.data.eventProtocolVersion = 1; await service.shutdown();
    const reloaded = new AgentService({ root, engine: { emit() {}, status: () => [] } }), rename = fs.rename; let failures = 1;
    fs.rename = async (from, to) => { if (to === path.join(reloaded.root, "state.enc") && failures-- > 0) throw Error("injected migration rename failure"); return rename(from, to); };
    try {
      await assert.rejects(reloaded.request("info"), /migration rename/);
      const disk = require("../credential-crypto").decryptCredentialJson(await fs.readFile(path.join(reloaded.root, "state.enc"))); assert.equal(disk.eventProtocolVersion, 1);
      assert.equal((await reloaded.request("info")).ready, true); assert.equal(reloaded.data.eventProtocolVersion, 2);
    } finally { fs.rename = rename; await reloaded.shutdown(); }
  });
  await check("原任务表单 nullable metadata 可创建并明确清空并发配置", async service => {
    const template = (await service.request("userTemplates.createUserTemplate", { name: "nullable", metadata: { prompt: "test" } })).data;
    const task = (await service.request("userTasks.createUserTask", { name: "default task", userTemplateId: template.id, metadata: null })).data;
    assert.equal(task.metadata, null);
    const toggled = (await service.request("userTasks.updateUserTask", { taskId: task.id, enabled: false })).data;
    assert.equal(toggled.metadata, null, "省略 metadata 时应保留原来的 null");
    await service.request("userTasks.updateUserTask", { taskId: task.id, metadata: { concurrency: 2 } });
    const reset = (await service.request("userTasks.updateUserTask", { taskId: task.id, metadata: null })).data;
    assert.equal(reset.metadata, null);
    await assert.rejects(service.request("userTemplates.updateUserTemplate", { templateId: template.id, metadata: null }), /metadata 必须为对象/);
    await assert.rejects(service.request("userTasks.updateUserTask", { taskId: task.id, metadata: [] }), /metadata 必须为对象/);
  });
  result.passed = result.cases.every(row => row.status === "PASS"); if (!result.passed) process.exitCode = 1;
})().catch(error => { result.failure = error.stack; process.exitCode = 1; }).finally(async () => {
  await fs.writeFile(path.join(evidence, "agent-contracts.json"), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result, null, 2));
});
