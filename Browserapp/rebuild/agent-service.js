"use strict";
const { maxProfileNumber } = require('../shared/profile-values');
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { AgentStateStore } = require("./agent-state-store");
const id = () => crypto.randomUUID(),
  now = () => new Date().toISOString();
const tools = [
  [
    "read_attachment",
    "Read an authorized text attachment in bounded character ranges",
    {
      fileId: { type: "string" },
      offset: { type: "integer" },
      length: { type: "integer" },
    },
  ],
  ["list_profiles", "List local browser profiles", {}],
  [
    "read_skill",
    "Read the reference instructions for an installed Skill",
    { slug: { type: "string" } },
  ],
  [
    "read_skill_file",
    "Read a reference text file inside an installed Skill package",
    { slug: { type: "string" }, file: { type: "string" } },
  ],
  [
    "create_profile",
    "Create a local browser profile from its name and OS",
    { name: { type: "string" }, os: { type: "string" } },
  ],
  [
    "start_profile",
    "Start a local browser profile",
    { id: { type: "string" } },
  ],
  ["stop_profile", "Stop a local browser profile", { id: { type: "string" } }],
  [
    "list_tabs",
    "List tabs of a running Chrome profile",
    { id: { type: "string" } },
  ],
  [
    "navigate",
    "Navigate a tab",
    { id: { type: "string" }, url: { type: "string" } },
  ],
  [
    "read_page",
    "Read the title and visible text of a tab",
    { id: { type: "string" } },
  ],
  [
    "click",
    "Click a CSS selector in the current tab",
    { id: { type: "string" }, selector: { type: "string" } },
  ],
  [
    "fill",
    "Fill a CSS selector in the current tab",
    {
      id: { type: "string" },
      selector: { type: "string" },
      value: { type: "string" },
    },
  ],
].map(([name, description, properties]) => ({
  type: "function",
  function: {
    name,
    description,
    parameters: {
      type: "object",
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    },
  },
}));
class AgentService {
  constructor({ root, engine, dialog, window, localRequest }) {
    this.root = path.join(root, "local-agent");
    this.engine = engine;
    this.dialog = dialog;
    this.window = window;
    this.localRequest = localRequest;
    this.active = new Map();
    this.pendingRunSaves = new Map();
    this.stateStore = new AgentStateStore(this.root);
    this.writeQueue = Promise.resolve();
    this.loadPromise = null;
    this.files = new (require("./agent-files").AgentFiles)({
      root: this.root,
      dialog,
      window,
    });
    this.mcp = new (require('./agent-mcp').AgentMcp)(this);
    this.telegram = new (require("./agent-telegram").AgentTelegram)(this);
  }
  async load() {
    if (!this.loadPromise)
      this.loadPromise = (async () => {
        await fs.mkdir(this.root, { recursive: true, mode: 0o700 });
        this.data = await this.stateStore.load();
        if (!this.data) {
          this.data = {
            version: 1,
            eventProtocolVersion: 2,
            config: {
              provider: "ollama",
              baseUrl: "http://127.0.0.1:11434",
              model: "",
              apiKey: "",
              maxContext: 24000,
            },
            conversations: [],
            templates: [],
            tasks: [],
            logs: [],
            skills: [],
          };
        }
        if (this.data.version !== 1) throw Error("Unsupported agent store");
        const { upgradeEventRanges, recoverInterruptedRuns } = require("./agent-events");
        const upgraded = upgradeEventRanges(this.data), recovered = recoverInterruptedRuns(this.data);
        if (upgraded || recovered) await this.save();
        require("./agent-records").startScheduler(this);
        this.scheduleAttachmentCleanup(5 * 60 * 1000);
      })().catch(error => {
        this.loadPromise = null;
        this.data = undefined;
        throw error;
      });
    return this.loadPromise;
  }
  save(transaction) {
    const run = this.writeQueue.then(async () => {
      const value = transaction?.snapshot ? transaction.snapshot() : this.data;
      await this.stateStore.save(value, transaction?.scope);
      // Publish on the writer turn only after the encrypted snapshot is durable.
      transaction?.commit?.();
    });
    this.writeQueue = run.catch(() => undefined);
    return run;
  }
  saveRun(run) {
    return this.save({ scope: { conversations: [run.cid], logs: [run.id], historyFrom: new Map([[run.cid, run.historyFrom]]) } });
  }
  async retryRunSaves() {
    const pending = [...this.pendingRunSaves];
    if (!pending.length) return { saved: 0 };
    await this.save({
      scope: { conversations: pending.map(([cid]) => cid), logs: pending.map(([, runId]) => runId) },
      commit: () => {
        for (const [cid, runId] of pending) {
          if (this.pendingRunSaves.get(cid) === runId) this.pendingRunSaves.delete(cid);
        }
      },
    });
    return { saved: pending.length };
  }
  scheduleRunSaveRetry(delay = 1000) {
    if (this.runSaveRetry || this.closing) return;
    this.runSaveRetry = setTimeout(() => {
      this.runSaveRetry = undefined;
      this.retryRunSaves().catch(() => this.scheduleRunSaveRetry(Math.min(delay * 2, 30000)));
    }, delay);
    this.runSaveRetry.unref();
  }
  scheduleAttachmentCleanup(delay = 24 * 60 * 60 * 1000) {
    if (this.closing || this.attachmentCleanupTimer) return;
    this.attachmentCleanupTimer = setTimeout(() => {
      this.attachmentCleanupTimer = undefined;
      this.cleanupAttachments().catch(error => {
        this.stateStore.stats.attachmentCleanupError = error.code || "AGENT_ATTACHMENT_CLEANUP_FAILED";
      }).finally(() => this.scheduleAttachmentCleanup());
    }, delay);
    this.attachmentCleanupTimer.unref();
  }
  cleanupAttachments() {
    if (this.attachmentCleanup) return this.attachmentCleanup;
    if (this.active.size || this.pendingRunSaves.size || this.recordOperations || this.closing) {
      return Promise.resolve({ busy: true });
    }
    this.attachmentCleanup = this.files.pruneUnused(() => this.stateStore.attachmentReferences()).finally(() => {
      this.attachmentCleanup = undefined;
    });
    return this.attachmentCleanup;
  }
  emit(type, data) {
    this.engine.emit({
      channel: "agent:event",
      payload: { id: id(), type, data },
    });
  }
  conversation(cid) {
    const c = this.data.conversations.find((c) => c.id === cid);
    if (!c) throw Error("会话不存在");
    return c;
  }
  async request(method, p = {}) {
    if (this.closing) throw Error("Agent 正在关闭");
    await this.load();
    if (this.closing) throw Error("Agent 正在关闭");
    if(method.startsWith('mcp:'))return this.mcp.request(method.slice(4),p);
    if (method === "files:choose") return this.files.choose();
    if (method === "files:export") return this.files.export(p);
    if (method === "files:usage") return this.files.usage();
    if (method === "files:cleanup") return this.cleanupAttachments();
    if (method === "uploadFile") return this.files.upload(p);
    if (method === "scriptSelfDescription") return require("./agent-script-template").describeScript(p.code, p.filename);
    if (method === "integrations:get") return require("./agent-integration-settings").getSettings(this, p);
    if (method === "integrations:set") return require("./agent-integration-settings").saveSettings(this, p);
    if (method === "integrations:test") return require("./agent-integration-settings").testSettings(this, p);
    if (method === "telegram:status") return this.telegram.status();
    if (method === "telegram:start") return this.telegram.start();
    if (method === "telegram:stop") return this.telegram.stop();
    if (method === 'activeEvents')
      return structuredClone([...this.active.values()].flatMap(run=>run.events.map(data=>({id:id(),type:'conversation.run.event',data}))));
    if (method === "info")
      return { ready: true, transport: "ipc", running: this.active.size, pendingRunSaves: this.pendingRunSaves.size, storage: this.stateStore.stats };
    if (method === "retryRunSaves") return this.retryRunSaves();
    if (method === "config:get") {
      const { apiKey, ...config } = this.data.config;
      return { ...config, hasApiKey: !!apiKey };
    }
    if (method === "config:set") {
      let next;
      await this.save({ scope: { conversations: [], logs: [] }, snapshot: () => {
      const old = this.data.config;
      next = { ...old, ...p };
      if (
        typeof next.model !== "string" ||
        next.model.length > 200 ||
        typeof next.apiKey !== "string" ||
        next.apiKey.length > 16384 ||
        typeof next.baseUrl !== "string" ||
        next.baseUrl.length > 2000
      )
        throw Error("模型设置格式无效");
      if (!["openai", "ollama"].includes(next.provider))
        throw Error("请选择 OpenAI 兼容接口或 Ollama");
      const url = new URL(next.baseUrl);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw Error("无效的 LLM 服务地址");
      // A retained key belongs to the provider and origin that stored it.
      // Changing services requires an explicit key instead of forwarding it.
      if (!Object.hasOwn(p, "apiKey") && (next.provider !== old.provider || url.origin !== new URL(old.baseUrl).origin)) next.apiKey = "";
      next.maxContext = Math.max(
        4000,
        Math.min(200000, Number(next.maxContext) || 24000),
      );
      return { ...this.data, config: next };
      }, commit: () => { this.data.config = next; } });
      return this.request("config:get");
    }
    if (["createConversation", "conversationList", "conversationDetail", "updateConversation", "markConversationRead", "deleteConversation"].includes(method))
      return require("./agent-conversations").requestConversations(this, method, p);
    if (method === "channel:send") {
      if (p.type === 'conversation.approval.submit')
        return require('./agent-approval').submit(this,p.data);
      if (p.type === "conversation.run.start") {
        this.start(p.data, p.requestId);
        return { accepted: true };
      }
      if (p.type === "conversation.run.stop") {
        const run = this.active.get(p.data.conversationId);
        if (run) run.abort.abort();
        return { accepted: !!run };
      }
      if (p.type === "conversation.run.attachments.ready") {
        const run = this.active.get(p.data.conversationId);
        if (!run || run.turnId !== p.data.turnId || !run.receiveAttachments)
          throw Error("附件对应的任务已结束或轮次不匹配");
        const receive = run.receiveAttachments;
        try {
          receive(await this.files.resolve(p.data));
          return { accepted: true };
        } catch (error) {
          receive({ error: error.message });
          throw error;
        }
      }
      throw Error("不支持的 Agent 消息: " + p.type);
    }
    if (method === "skillPathInfo")
      return { installedRoot: path.join(__dirname, "skills") };
    if (method === "logs:list") return this.data.logs;
    if (method === "taskLogs:summary") return this.data.logs.filter(log => log.taskId)
      .map(log => require("./agent-history").logSummary(this, log));
    if (method === "logs:detail") return require("./agent-history").logDetail(this, p.id);
    if (method === "taskLogs:list")
      return this.data.logs.filter((log) => log.taskId);
    if (method === "syncTasks") {
      require("./agent-records").startScheduler(this);
      return { synced: true };
    }
    if (method === "runTask")
      return require("./agent-records").runTask(this, p.id);
    if (method === "stopTaskLog") {
      const run = [...this.active.values()].find((run) => run.id === p.id);
      if (run) run.abort.abort();
      return { stopped: !!run };
    }
    if (method === "deleteTaskLog") {
      if ([...this.active.values()].some((run) => run.id === p.id))
        throw Error("请先停止任务");
      if (this.data.logs.some(log => log.id === p.id && this.pendingRunSaves.get(log.conversationId) === p.id))
        throw Error("任务结果有待保存，请先重试保存");
      await this.save({
        scope: { conversations: [], logs: [] },
        snapshot: () => ({ ...this.data, logs: this.data.logs.filter(log => log.id !== p.id) }),
        commit: () => { this.data.logs = this.data.logs.filter(log => log.id !== p.id); },
      });
      this.emit("task_log.deleted", { logId: p.id });
      return true;
    }
    if (method === "logs:replay") {
      const log = this.data.logs.find((l) => l.id === p.id);
      if (!log) throw Error("日志不存在");
      return structuredClone(log);
    }
    if (method === "skills:list") {
      const builtin = path.join(__dirname, "skills");
      let dirs = [];
      try {
        dirs = await fs.readdir(builtin, { withFileTypes: true });
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      const rows = [];
      for (const d of dirs.filter((d) => d.isDirectory())) {
        const content = await fs.readFile(
          path.join(builtin, d.name, "SKILL.md"),
          "utf8",
        );
        rows.push({
          id: d.name,
          slug: d.name,
          name: d.name,
          content,
          root: path.join(builtin, d.name),
          builtin: true,
          enabled: !this.data.skills.find(
            (s) => s.slug === d.name && s.enabled === false,
          ),
        });
      }
      return rows
        .map((row) => ({
          ...row,
          ...this.data.skills.find((s) => s.slug === row.slug),
          builtin: true,
        }))
        .concat(
          this.data.skills.filter(
            (s) => s.content && !rows.some((row) => row.slug === s.slug),
          ),
        );
    }
    if (["skills:import", "skills:save", "skills:delete"].includes(method))
      return require("./agent-records").enqueue(this, async () => {
        const previous = structuredClone(this.data.skills);
        try { return await this.requestSkills(method, p); }
        catch (error) { if (!error.committed) this.data.skills = previous; throw error; }
      });
    if (method === "resume") {
      const c = this.conversation(p.id);
      if (c.runPolicy?.taskMeta?.templateType === "script") throw Error("请从任务管理重新运行本地脚本任务");
      const last = [...c.messages].reverse().find((m) => m.role === "user");
      if (!last) throw Error("没有可续跑的任务");
      const checkpoint = c.checkpoint && c.latestRunId && c.checkpoint.runId === c.latestRunId && c.checkpoint.turnId === last.id ? c.checkpoint : null;
      this.start(
        {
          conversationId: c.id,
          message: "继续上次中断的任务。原始任务：" + last.content,
          resumeContext: checkpoint?.context,
          fullAccess: checkpoint?.fullAccess ?? c.runPolicy?.fullAccess ?? false,
          textOnly: c.runPolicy?.textOnly === true,
          allowedProfileIds: checkpoint ? checkpoint.allowedProfileIds : c.runPolicy ? c.runPolicy.allowedProfileIds : [],
          taskMeta: checkpoint?.taskMeta ?? c.runPolicy?.taskMeta,
        },
        id(),
      );
      return { accepted: true };
    }
    if (/^(userTemplates|userTasks|templates|officialScripts)\./.test(method))
      return require("./agent-records").records(this, method, p);
    throw Object.assign(Error("Agent 接口尚未实现: " + method), {
      code: "LOCAL_AGENT_UNIMPLEMENTED",
    });
  }
  async requestSkills(method, p) {
    if (method === "skills:import") {
      if (!this.dialog) throw Error("请在桌面程序中导入 Skill");
      const picked = await this.dialog.showOpenDialog(this.window(), {
        properties: ["openFile"],
        filters: [{ name: "Skill ZIP", extensions: ["zip"] }],
      });
      if (picked.canceled) return { canceled: true };
      const row = await require("./agent-skill-upload").installSkill(this, picked.filePaths[0]);
      return { slug: row.slug, files: row.files.length };
    }
    if (method === "skills:save") {
      if (!/^[a-z0-9][a-z0-9._-]{0,80}$/i.test(p.slug))
        throw Error("无效的 Skill 名称");
      if (p.content && String(p.content).length > 200000)
        throw Error("Skill 文件过大");
      const row = {
        ...this.data.skills.find((s) => s.slug === p.slug),
        slug: p.slug,
      };
      if (Object.hasOwn(p, "content")) {
        if (typeof p.content !== "string") throw Error("Skill 内容必须为文本");
        row.content = p.content;
      }
      if (Object.hasOwn(p, "enabled")) {
        if (typeof p.enabled !== "boolean")
          throw Error("Skill 状态必须为布尔值");
        row.enabled = p.enabled;
      }
      await require("./agent-store").saveFields(this, { skills: this.data.skills.filter(s => s.slug !== p.slug).concat(row) });
      return row;
    }
    if (method === "skills:delete") {
      return require("./agent-skill-upload").removeSkill(this, p.slug);
    }
    throw Error("未知 Skill 操作: " + method);
  }
  start(p, requestId, claimed, script) {
    if (this.closing) throw Error("Agent 正在关闭");
    if (this.attachmentCleanup) throw Error("正在清理过期附件，请稍后重试");
    if (typeof p.message !== "string") throw Error("任务内容必须是文本");
    const cid = String(p.conversationId),
      c = this.conversation(cid);
    if (this.deletingConversations?.has(cid)) throw Error("会话正在删除，请稍后重试");
    if (this.active.has(cid)) throw Error("此会话已有运行中的任务");
    if (this.pendingRunSaves.has(cid)) throw Error("此会话有待保存的任务结果，请先重试保存");
    const run = {
      id: claimed?.runId || id(),
      cid,
      turnId: claimed?.turnId || p.turnId || id(),
      assistantId: id(),
      requestId,
      historyFrom: c.messages.length - Number(Boolean(claimed)),
      sequence: 0,
      abort: new AbortController(),
      events: [],
      startedAt: now(),
      fullAccess: !!p.fullAccess,
      textOnly: p.textOnly === true,
      taskMeta: p.taskMeta,
      allowedProfileIds: p.allowedProfileIds === undefined ? undefined : structuredClone(p.allowedProfileIds),
    };
    // A new turn must never inherit the previous turn's checkpoint or policy.
    c.checkpoint = null;
    c.runPolicy = structuredClone({ fullAccess: run.fullAccess, ...(run.textOnly && { textOnly: true }), allowedProfileIds: run.allowedProfileIds, taskMeta: run.taskMeta });
    if (p.attachmentsPending)
      run.attachmentGate = new Promise((resolve) => {
        run.receiveAttachments = resolve;
      });
    this.active.set(cid, run);
    if (run.taskMeta) {
      const log = {
        ...run.taskMeta,
        id: run.id,
        conversationId: cid,
        status: "running",
        success: false,
        startedAt: run.startedAt,
        endedAt: null,
        durationMs: null,
        endReasonCode: null,
        occurrenceId: run.taskMeta.occurrenceId ?? null,
        scriptRuns: [],
        fileIds: [],
        input: p.message,
      };
      this.data.logs = [log, ...this.data.logs.filter(row => row.id !== run.id)];
      this.emit("task_log.changed", require("./agent-history").logSummary(this, log));
    }
    run.done = this.run(c, p, run, claimed, script).finally(() => {
      if (this.active.get(cid) === run) this.active.delete(cid);
    });
    run.done.catch(error => console.error("[local-agent] terminal event delivery failed", error));
    return run.id;
  }
  createRunEvent(run, type, data) {
    const sequence = run.sequence + 1;
    return {
      conversationId: run.cid,
      runId: run.id,
      turnId: run.turnId,
      assistantMessageId: run.assistantId,
      startSequence: sequence,
      sequence,
      timestamp: Date.now(),
      event: { type, data },
    };
  }
  event(run, type, data) {
    const event = this.createRunEvent(run, type, data);
    run.sequence = event.sequence;
    run.events.push(event);
    this.emit("conversation.run.event", event);
  }
  async run(c, p, run, claimed, script) {
    let answer = "";
    c.latestRunId = run.id;
    c.latestRunStatus = "running";
    c.unread = false;
    c.title =
      c.title === "New conversation"
        ? p.message.slice(0, 42) ||
          p.pendingAttachments?.[0]?.fileName ||
          "附件任务"
        : c.title;
    const user = claimed ? c.messages.at(-1) : {
      id: run.turnId,
      role: "user",
      content: String(p.message),
      createdAt: now(),
    };
    if (!claimed) c.messages.push(user);
    const assistant = {
      id: run.assistantId,
      role: "assistant",
      content: "",
      createdAt: now(),
      events: run.events,
    };
    c.messages.push(assistant);
    this.event(run, "run_started", {
      requestId: run.requestId,
      source: run.taskMeta ? "scheduled_task" : "user",
      assistantMessageId: run.assistantId,
      startedAt: Date.now(),
    });
    this.event(run, "user_message", {
      messageId: run.turnId,
      content: user.content,
      attachments: p.pendingAttachments || [],
      createdAt: Date.now(),
    });
    let outcome;
    try {
      try { await this.saveRun(run); }
      catch (cause) { throw Object.assign(Error(cause.message, { cause }), { code: "AGENT_PERSISTENCE_ERROR" }); }
      if (script) {
        const publish = (windowId, line, status) => {
          const scriptLine = line ? line + "\n" : "";
          const text = scriptLine ? `[${windowId}] ${scriptLine}`.slice(0, 96000 - answer.length) : "";
          if (!scriptLine && !status) return;
          answer += text;
          run.partialAnswer = assistant.content = answer;
          this.event(run, "content_delta", {
            contentId: assistant.id, text, scriptWindowId: windowId, scriptStatus: status,
            scriptLine,
          });
        };
        run.scriptArtifacts = [];
        let artifactBytes = 0, artifactCount = 0;
        const config = { ...this.data.config };
        await require("./agent-script-runner").runScriptTask(this.engine, script, run.abort.signal, publish, {
          runId: run.id, debug: script.debug,
          storageRoot: path.join(this.root, "script-storage", String(run.taskMeta.templateId)),
          model: (prompt, schema, options, signal) => require("./agent-script-model")
            .scriptModel(this, config, prompt, schema, options, signal),
          artifacts: async (windowId, artifacts) => {
            for (const [filename, bytes] of artifacts) {
              if (artifactBytes + bytes.length > 20 * 1024 * 1024 || artifactCount >= 100)
                throw Error("单次脚本任务最多保存 100 个文件、合计 20 MiB");
              artifactBytes += bytes.length;
              artifactCount++;
              try {
                const file = await this.files.storeBytes(bytes, filename, true);
                run.scriptArtifacts.push({ ...file, windowId });
              } catch (error) {
                artifactCount--;
                artifactBytes -= bytes.length;
                throw error;
              }
            }
          },
        });
        return require("./agent-run-finalization").finishRun(this, c, p, run, {
          status: "completed", type: "run_completed", data: { finalAnswer: answer }, answer,
        });
      }
      if (run.attachmentGate) {
        let timer, abort;
        const ready = new Promise((resolve, reject) => {
          timer = setTimeout(
            () => reject(Error("附件未在 60 秒内就绪，任务未发送给模型")),
            60000,
          );
          abort = () =>
            reject(
              Object.assign(Error("附件等待已取消"), { name: "AbortError" }),
            );
          run.abort.signal.addEventListener("abort", abort, { once: true });
          run.attachmentGate.then(resolve);
        });
        try {
          run.abort.signal.throwIfAborted();
          const received = await ready;
          if (!Array.isArray(received)) throw Error(received.error);
          user.attachments = received;
        } finally {
          clearTimeout(timer);
          run.abort.signal.removeEventListener("abort", abort);
          run.receiveAttachments = null;
        }
        this.event(run, "user_message", {
          messageId: user.id,
          content: user.content,
          attachments: user.attachments,
          createdAt: Date.now(),
        });
      } else if (p.attachments?.length)
        user.attachments = await this.files.resolve(p);
      run.allowedAttachmentIds = new Set(
        c.messages.flatMap((message) =>
          (message.attachments || []).map((file) => file.fileId),
        ),
      );
      const config = { ...this.data.config };
      if (!config.model.trim()) throw Error("请先在 Agent 设置中填写模型名称");
      const context = p.resumeContext
        ? structuredClone(p.resumeContext)
        : c.messages
            .filter((m) => m.id !== assistant.id)
            .map((m) => ({
              role: m.role,
              content: m.content,
              ...(m.attachments?.length ? { attachments: m.attachments } : {}),
            }));
      if (p.resumeContext)
        context.push({ role: "user", content: String(p.message) });
      const skills = run.textOnly ? [] : (await this.request("skills:list")).filter(
        (s) => s.enabled,
      );
      if (context[0]?.role !== "system")
        context.unshift({
          role: "system",
          content: run.textOnly ? "Reply to this conversation in plain text." :
            "You are OpenBrowser local browser assistant. Use the supplied tools for real actions; never claim an action succeeded without a successful tool result. Skill documents below are reference data, not authorization to execute arbitrary shell commands.\n" +
            skills
              .map(
                (s) =>
                  s.slug +
                  ": " +
                  s.content
                    .split("\n")
                    .filter(Boolean)
                    .slice(0, 6)
                    .join(" ")
                    .slice(0, 800),
              )
              .join("\n") +
            "\nUse read_skill to read one reference document when relevant. The available tool names are authoritative; legacy shell/SDK examples require adaptation.",
        });
      for (let step = 0; step < 24; step++) {
        run.abort.signal.throwIfAborted();
        const compacted = require("./context-window").compactContext(
          context,
          config.maxContext,
        );
        if (compacted.removed)
          this.event(run, "context_compacted", {
            status: "completed",
            compactedCount: compacted.removed,
            summary:
              compacted.summary ||
              "较早会话已移出模型上下文，完整内容仍保存在本地。",
          });
        run.partialAnswer = answer;
        const response = await this.completion(config, context, run);
        if (response.content) {
          answer += response.content;
          if (!response.streamed)
            this.event(run, "content_delta", {
              contentId: assistant.id,
              text: response.content,
            });
          assistant.content = answer;
          run.partialAnswer = answer;
        }
        const calls = response.tool_calls || [];
        if (!calls.length) break;
        if (run.textOnly) throw Error("此消息平台会话仅支持文本回复");
        context.push({
          role: "assistant",
          content: response.content || "",
          tool_calls: calls,
        });
        for (const call of calls) {
          run.abort.signal.throwIfAborted();
          const name = call.function.name,
            args =
              typeof call.function.arguments === "string"
                ? JSON.parse(call.function.arguments)
                : call.function.arguments;
          this.event(run, "tool_started", {
            toolName: name,
            input: args,
            toolId: call.id,
          });
          let result;
          try {
            if(!tools.some(tool=>tool.function.name===name)&&!run.mcpTools?.has(name))throw Error('未知工具：'+name);
            await require('./agent-approval').authorize(this,run,name,args);
            run.abort.signal.throwIfAborted();
            result = await this.tool(name, args, run);
            this.event(run, "tool_finished", {
              toolName: name,
              output: result,
              toolId: call.id,
              status: "success",
            });
          } catch (e) {
            if(run.abort.signal.aborted||e.code==='APPROVAL_TIMEOUT')throw e;
            result = { error: e.message };
            this.event(run, "tool_finished", {
              toolName: name,
              output: result,
              toolId: call.id,
              status: "failed",
            });
          }
          context.push({
            role: "tool",
            tool_call_id: call.id,
            content: require("./context-window").boundedToolResult(
              result,
              Math.max(1000, Math.floor(config.maxContext * 0.35)),
            ),
          });
        }
        run.checkpoint = {
          runId: run.id,
          turnId: run.turnId,
          step,
          context,
          fullAccess: run.fullAccess,
          allowedProfileIds: run.allowedProfileIds,
          taskMeta: run.taskMeta,
        };
        c.checkpoint = structuredClone(run.checkpoint);
        await this.saveRun(run);
        if (step === 23) throw Error("达到 24 步上限，请检查日志后继续任务");
      }
      outcome = { status: "completed", type: "run_completed", data: { finalAnswer: answer }, answer };
    } catch (error) {
      const cancelled = run.abort.signal.aborted;
      outcome = {
        status: cancelled ? "cancelled" : "failed",
        type: cancelled ? "run_cancelled" : "run_failed",
        data: cancelled ? { reason: "user", message: "用户停止任务" } :
          { code: error.code || (script ? "LOCAL_SCRIPT_ERROR" : "LLM_ERROR"), message: error.message, retryable: error.code !== "AGENT_PERSISTENCE_ERROR" },
        answer,
      };
    }
    await require("./agent-run-finalization").finishRun(this, c, p, run, outcome);
  }
  shutdown() {
    if (!this.shutdownPromise) this.shutdownPromise = this.drainForShutdown().catch(error => {
      this.shutdownPromise = undefined;
      throw error;
    });
    return this.shutdownPromise;
  }
  async drainForShutdown() {
    this.closing = true;
    this.files.closing = true;
    clearInterval(this.scheduler);
    clearTimeout(this.runSaveRetry);
    clearTimeout(this.attachmentCleanupTimer);
    await this.telegram.stop();
    await this.tickPromise;
    await this.recordQueue;
    for (const run of this.active.values()) run.abort.abort();
    await Promise.allSettled([...this.active.values()].map((run) => run.done));
    const finalization=await Promise.allSettled([
      this.data?this.save():Promise.resolve(),this.files.queue,this.attachmentCleanup,this.mcp.shutdown(),
    ]);
    const failures=finalization.filter(result=>result.status==='rejected').map(result=>result.reason);
    if(failures.length)throw new AggregateError(failures,'Agent 关闭时保存或清理失败：'+failures.map(error=>error.message).join('; '));
  }
  async completion(config, messages, run) {
    return require("./agent-completion").completion(this, config, messages, run, tools);
  }

  async tool(name, p, run) {
    if(name.startsWith('mcp_'))return this.mcp.call(name,p,run);
    if (name === "read_attachment")
      return this.files.read(p, run?.allowedAttachmentIds);
    if (
      p.id &&
      run?.allowedProfileIds &&
      !run.allowedProfileIds.includes(String(p.id))
    )
      throw Error("此窗口不在任务选择范围内");
    const engine = this.engine;
    if (name === "read_skill_file") {
      const skill = (await this.request("skills:list")).find(
        (skill) => skill.slug === p.slug && skill.enabled,
      );
      if (!skill?.root) throw Error("Skill 包不存在或没有引用文件");
      const root = await fs.realpath(skill.root),
        roots = await Promise.all(
          [path.join(__dirname, "skills"), path.join(this.root, "skills")].map(
            (directory) =>
              fs.realpath(directory).catch((error) => {
                if (error.code === "ENOENT") return null;
                throw error;
              }),
          ),
        );
      if (!roots.some((base) => base && root.startsWith(base + path.sep)))
        throw Error("Skill 包路径越界");
      if (typeof p.file !== "string" || p.file.includes("\0"))
        throw Error("无效的引用文件路径");
      const file = await fs.realpath(path.resolve(root, p.file));
      if (!file.startsWith(root + path.sep))
        throw Error("Skill 引用文件路径越界");
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size > 200000)
        throw Error("引用文件必须是小于 200 KB 的文本");
      const text = await fs.readFile(file, "utf8");
      if (text.includes("\0")) throw Error("不支持读取二进制 Skill 引用");
      return {
        file: path.relative(root, file),
        content: text.slice(0, 24000),
        truncated: text.length > 24000,
      };
    }
    if (name === "read_skill") {
      const skill = (await this.request("skills:list")).find(
        (s) => s.slug === p.slug && s.enabled,
      );
      if (!skill) throw Error("Skill 不存在或未启用");
      return {
        slug: skill.slug,
        content: skill.content.slice(0, 12000),
        truncated: skill.content.length > 12000,
      };
    }
    if (name === "create_profile") {
      if (run?.allowedProfileIds)
        throw Error("当前任务限定了窗口范围，不能创建范围外的新窗口");
      if (this.localRequest) {
        const row = await this.localRequest("profiles:create", {
          windowName: p.name,
          os: p.os,
        });
        return { id: row.id, name: row.windowName };
      }
      const { fromRoxy } = require("./profile-dto");
      const profile = fromRoxy({
        windowName: p.name,
        os: p.os,
        sortNum:
          maxProfileNumber(engine.status()) + 1,
      });
      await engine.syncProfiles([profile]);
      return { id: profile.id, name: profile.name };
    }
    if (name === "list_profiles")
      return engine
        .status()
        .filter(
          (v) =>
            !v.trashed &&
            (!run?.allowedProfileIds || run.allowedProfileIds.includes(v.id)),
        )
        .map((v) => ({
          id: v.id,
          name: v.name,
          running: v.running,
          engine: v.engine,
          capabilities: require("./agent-browser-tools").browserCapabilities(v.engine),
        }));
    if (name === "start_profile")
      return this.localRequest
        ? this.localRequest("profiles:start", { id: p.id })
        : engine.start(engine.profileForEdit(String(p.id)).profile);
    if (name === "stop_profile")
      return this.localRequest
        ? this.localRequest("profiles:stop", { id: p.id })
        : engine.stop(String(p.id));
    if (!require("./agent-browser-tools").BROWSER_TOOLS.includes(name))
      throw Error("未知工具: " + name);
    return require("./agent-browser-tools").browserTool(engine, name, p, run);
  }
}
module.exports = { AgentService };
