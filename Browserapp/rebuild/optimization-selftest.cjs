"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs/promises"),
  path = require("node:path"), os = require("node:os"), http = require("node:http");
const { BrowserEngine } = require("../engine"), { LocalService } = require("./local-service"),
  { AgentService } = require("./agent-service"), { readLocalStore } = require("./local-store");
async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-optimization-"));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, "master.key");
  require("../credential-crypto").resetLocalMasterKeyCache();
  const engine = new BrowserEngine({ getPath: () => root });
  let agent;
  try {
    await engine.init(null);
    const file = path.join(root, "rebuild-local.json"), secret = "migration-cookie-secret";
    const legacy = { version: 1, groups: [], templates: [{ id: 1, templateName: "legacy", content: JSON.stringify({ cookie: secret }) }], filters: [],
      settings: { quickTemplate: { templateInfo: { cookie: secret } }, localApi: { open: false, port: 50325, apiAllowLan: false } } };
    await fs.writeFile(file, JSON.stringify(legacy));
    const service = new LocalService({ engine, root });
    // An unsuccessful migration must preserve the plaintext source and allow retry.
    const rename = fs.rename;
    fs.rename = async (from, to) => { if (to === file) throw Error("fixture rename failed"); return rename(from, to); };
    try { await assert.rejects(service.load(), /rename failed/); }
    finally { fs.rename = rename; }
    assert.deepEqual(JSON.parse(await fs.readFile(file, "utf8")), legacy);
    await service.load();
    assert(!(await fs.readFile(file)).includes(Buffer.from(secret)));
    assert.deepEqual((await readLocalStore(file)).data, legacy);
    assert.equal((await require("./local-api").startupConfig(root)).port, 50325);
    assert(!(await fs.readdir(root)).some(name => name.endsWith(".tmp")));
    const restarted = new LocalService({ engine, root });
    assert.equal((await restarted.request("templates:list"))[0].content, legacy.templates[0].content);
    const damaged = Buffer.from(await fs.readFile(file)); damaged[damaged.length - 1] ^= 1;
    await fs.writeFile(file, damaged);
    await assert.rejects(new LocalService({ engine, root }).load());
    assert.deepEqual(await fs.readFile(file), damaged, "a damaged encrypted store is never overwritten");
    await service.save();

    const created = await service.request("profiles:create", { windowName: "Clear secrets", cookie: '[{"name":"sid","value":"cookie-secret","domain":"example.test"}]',
      windowPlatformList: [{ platformUrl: "https://example.test", platformUserName: "alice", platformPassword: "account-secret", platformEfa: "TOTP" }],
      proxyInfoList: [{ host: "proxy.test", port: 8080, protocol: "http", username: "user", password: "proxy-secret" }] });
    assert.ok(Number.isFinite(Date.parse(created.createTime)));
    assert.equal(created.updateTime, created.createTime);
    let edit = await service.request("profiles:read", { id: created.id });
    await assert.rejects(service.request("profiles:update", { id: edit.id, windowRemark: "missing revision" }), /版本/);
    await service.request("profiles:update", { id: edit.id, rev: edit.rev, windowRemark: "unrelated edit" });
    assert(engine.profileForEdit(edit.id).profile.cookies.includes("cookie-secret"));
    edit = await service.request("profiles:read", { id: created.id });
    await service.request("profiles:update", { id: edit.id, rev: edit.rev, cookie: "",
      windowPlatformList: [{ platformUrl: "https://example.test", platformUserName: "alice", platformPassword: "", platformEfa: "" }],
      proxyInfoList: [{ host: "proxy.test", port: 8080, protocol: "http", username: "", password: "" }] });
    const cleared = engine.profileForEdit(edit.id).profile;
    assert.equal(cleared.createdAt, created.createTime);
    assert.ok(cleared.updatedAt > created.updateTime);
    assert.equal(engine.sqliteStore.getProfile(created.id).createdAt, created.createTime);
    assert.equal(cleared.cookies, ""); assert.equal(cleared.platform.password, "");
    assert.equal(cleared.platform.accounts[0].password, ""); assert.equal(cleared.platform.accounts[0].totpSecret, "");
    assert(!cleared.proxy.includes("proxy-secret"));

    agent = new AgentService({ root, engine });
    await agent.load(); await agent.request("config:set", { model: "fixture" });
    await agent.request("config:set", { apiKey: "origin-bound-secret" });
    await agent.request("config:set", { model: "same-origin" });
    assert.equal((await agent.request("config:get")).hasApiKey, true);
    await agent.request("config:set", { baseUrl: "http://localhost:11434" });
    assert.equal((await agent.request("config:get")).hasApiKey, false);
    const c = await agent.request("createConversation"); let round = 0;
    agent.completion = async () => ++round === 1 ? { tool_calls: [{ id: "call", function: { name: "list_profiles", arguments: "{}" } }] } : { content: "done" };
    agent.start({ conversationId: c.id, message: "Task A", fullAccess: true }, "a"); await agent.active.get(c.id).done;
    assert.equal(c.checkpoint.runId, c.latestRunId);
    agent.completion = async () => { throw Error("fixture task B failure"); };
    agent.start({ conversationId: c.id, message: "Task B", fullAccess: false, allowedProfileIds: [created.id] }, "b"); await agent.active.get(c.id).done;
    assert.equal(c.checkpoint, null);
    let resumed;
    agent.completion = async (_config, messages, run) => { resumed = { run, messages }; return { content: "resumed" }; };
    await agent.request("resume", { id: c.id }); await agent.active.get(c.id).done;
    assert.equal(resumed.run.fullAccess, false); assert.deepEqual(resumed.run.allowedProfileIds, [created.id]);
    assert(resumed.messages.at(-1).content.includes("Task B"));
    c.checkpoint = { runId: c.latestRunId, context: [{ role: "tool", content: "x".repeat(200000) }], fullAccess: true };
    const list = await agent.request("conversationList");
    assert.equal(list[0].checkpoint, undefined); assert.equal(list[0].runPolicy, undefined);
    assert(JSON.stringify(list).length < 1000);
    assert.equal((await agent.request("conversationDetail", { id: c.id })).conversation.checkpoint.context[0].content.length, 200000);

    let release, reached;
    const discovered = new Promise(resolve => { reached = resolve; });
    const server = http.createServer(async (req, res) => {
      let text = ""; for await (const chunk of req) text += chunk;
      const message = JSON.parse(text); res.setHeader("content-type", "application/json");
      if (message.method === "initialize") res.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} } } }));
      else if (message.method === "tools/list") { release = () => { if (!res.destroyed && !res.writableEnded) res.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { tools: [] } })); }; reached(); }
      else { res.statusCode = 202; res.end(); }
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try {
      agent.data.mcpServers = [{ name: "slow", enabled: true, config: { type: "http", url: "http://127.0.0.1:" + server.address().port, headers: {} } }];
      const controller = new AbortController(), discovering = agent.mcp.definitions({ abort: controller });
      discovering.catch(() => {});
      await discovered; controller.abort(Error("cancel discovery"));
      await assert.rejects(Promise.race([discovering, new Promise((_, reject) => { const timer = setTimeout(() => reject(Error("cancellation too slow")), 1000); timer.unref(); })]), /cancel discovery/);
      release(); await Promise.allSettled([...agent.mcp.pool.operations]);
      assert.equal(agent.mcp.connections.size, 0);
      assert.equal(agent.mcp.pool.transients.size, 0);
      assert.equal(agent.mcp.pool.slots.active, 0);
    } finally { release?.(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    await agent.shutdown(); agent = null;

    const group = await service.request("groups:save", { projectName: "Query group" });
    const label = await service.request("labels:save", { name: "Query label" });
    for (let i = 0; i < 30; i++) await service.request("profiles:create", { windowName: "Paged " + i, sortNum: i + 1, projectId: group.id, labelIds: [label.id], windowRemark: i % 2 ? "odd" : "even", os: i % 2 ? "Windows" : "Linux" });
    const projection = service.profileIndex(); let expanded = 0;
    const decorate = service.decorate.bind(service); service.decorate = row => { expanded++; return decorate(row); };
    const page = await service.request("profiles:query", { projectId: group.id, page_index: 2, page_size: 5, orderName: "windowSortNum", orderType: "desc" });
    assert.equal(page.total, 30); assert.equal(page.rows.length, 5); assert.equal(expanded, 5);
    assert.equal(service.profileIndex(), projection);
    assert.equal((await service.request("groups:list")).find(row => row.id === group.id).windowCount, 30);
    assert.equal((await service.request("labels:list"))[0].bindWindowIds.length, 30);
    const runningId = page.rows[0].id;
    const beforeProgress = engine.status();
    engine.running.set(runningId, { port: 9222, browser: { name: "Fixture" }, extensions: [] });
    try {
      engine.emit({ type: "status", id: runningId });
      const afterProgress = engine.status();
      assert.equal(afterProgress.filter((row, i) => row !== beforeProgress[i]).length, 1, "a single runtime event reprojects only its row");
      const opened = await service.request("profiles:query", { projectId: group.id, openStatus: true });
      assert.deepEqual(opened.rows.map(row => row.id), [runningId]);
      assert.equal(opened.rows[0].openStatus, true);
      assert.equal(service.profileIndex(), projection, "list metadata is reused across runtime-only updates");
    } finally {
      engine.running.delete(runningId);
      engine.emit({ type: "status", id: runningId });
    }
    const filtered = await service.request("profiles:query", { osList: ["Linux"], queryKey: "tag", queryValue: "Query label", page_size: 50 });
    assert.equal(filtered.total, 15);
    await service.request("profiles:delete", { ids: [page.rows[0].id] });
    assert.notEqual(service.profileIndex(), projection);
    assert.equal((await service.request("profiles:query", { isDelete: true })).total, 1);
    await assert.rejects(service.request("profiles:query", { page_size: 0 }), /分页/);
    const morning = new Date(2026, 2, 8, 0).toISOString();
    const evening = new Date(2026, 2, 8, 23, 59, 59, 999).toISOString();
    const nextDay = new Date(2026, 2, 9, 0).toISOString();
    await engine.syncProfiles([
      { id: "dates-first", name: "Date filters", createdAt: morning, updatedAt: evening },
      { id: "dates-second", name: "Date filters", createdAt: evening, updatedAt: nextDay },
      { id: "dates-third", name: "Date filters", createdAt: nextDay, updatedAt: nextDay },
    ]);
    const nodesCreatedOnDay = await service.request("profiles:query", { startDate: "2026-03-08", endDate: "2026-03-08" });
    assert.deepEqual(nodesCreatedOnDay.rows.map(row => row.id), ["dates-first", "dates-second"]);
    const nodesUpdatedOnDay = await service.request("profiles:query", { startUpdateDate: "2026-03-08", endUpdateDate: "2026-03-08" });
    assert.deepEqual(nodesUpdatedOnDay.rows.map(row => row.id), ["dates-first"]);
    const exact = await service.request("profiles:query", { startTime: evening, endTime: evening });
    assert.deepEqual(exact.rows.map(row => row.id), ["dates-second"]);
    const tied = { orderName: "windowName", orderType: "desc", queryValue: "Date filters" };
    const insertionOrder = ["dates-first", "dates-second", "dates-third"];
    const direct = await service.request("profiles:query", { ...tied, dirIds: ["dates-third", "dates-first", "dates-third", "dates-second"] });
    assert.deepEqual(direct.rows.map(row => row.id), insertionOrder, "an ID subset keeps insertion order for sort ties");
    assert.deepEqual((await service.request("profiles:query", tied)).rows.map(row => row.id), insertionOrder);
    const second = await service.request("profiles:query", { ...tied, page_index: 2, page_size: 1 });
    assert.equal(second.total, 3);
    assert.deepEqual(second.rows.map(row => row.id), ["dates-second"]);
    console.log("OPTIMIZATION_SELFTEST OK (encrypted migration/retry/corruption, explicit credential clearing, checkpoint policy, bounded list DTO, cancellable MCP discovery, indexed server pagination)");
  } finally {
    await agent?.shutdown(); await engine.stopAll(); await engine.flushPersistence(); engine.sqliteStore?.close();
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE; else process.env.OPENBROWSER_MASTER_KEY_FILE = oldKey;
    require("../credential-crypto").resetLocalMasterKeyCache();
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
