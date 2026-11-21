"use strict";
const { randomUUID } = require("node:crypto");
const { createConversation } = require("./agent-conversations");
const { CronExpressionParser } = require("cron-parser");
const { nextRecordId, rememberRecordIds } = require("./local-record-ids");
const { saveFields } = require("./agent-store");
const date = () => new Date().toISOString();
const recordActions = {
 userTemplates: ["listUserTemplates", "getUserTemplate", "createUserTemplate", "updateUserTemplate", "deleteUserTemplate", "topUserTemplate", "untopUserTemplate", "uploadUserTemplateSkill", "uploadUserTemplateScript"],
 userTasks: ["listUserTasks", "createUserTask", "updateUserTask", "deleteUserTask"],
 templates: ["listTemplateLabelCategories", "listTemplateLabels", "listOfficialTemplates", "getOfficialTemplate", "topOfficialTemplate", "untopOfficialTemplate"],
 officialScripts: ["getOfficialScript"],
};
const aliases = {
  template_type: "templateType",
  official_template_id: "officialTemplateId",
  user_template_id: "userTemplateId",
  window_ids: "windowIds",
  plan_type: "planType",
  execute_at: "executeAt",
  next_execute_at: "nextExecuteAt",
};
function normalize(input) {
  const value = { ...input };
  for (const [source, target] of Object.entries(aliases))
    if (Object.hasOwn(input, source)) value[target] = input[source];
  return value;
}
function next(task, at = Date.now()) {
  if (!task.enabled || task.planType === "manual") return null;
  if (task.planType === "once") {
    const time = Date.parse(task.executeAt);
    if (!Number.isFinite(time)) throw Error("请选择有效的执行时间");
    return new Date(time).toISOString();
  }
  if (task.planType !== "cron") throw Error("无效的计划类型");
  return CronExpressionParser.parse(String(task.cron), {
    tz: task.timezone || "UTC",
    currentDate: new Date(at),
  })
    .next()
    .toISOString();
}
function enqueue(service, operation) {
  service.recordOperations = (service.recordOperations || 0) + 1;
  const pending = (service.recordQueue || Promise.resolve()).then(async () => {
    await service.attachmentCleanup?.catch(() => {});
    if (service.closing) throw Error('Agent 正在关闭');
    return operation();
  }).finally(() => { service.recordOperations--; });
  service.recordQueue = pending.catch(() => {});
  return pending;
}
function records(service, method, input) {
  return enqueue(service, () => recordOperation(service, method, input));
}
function listTemplate(row) {
  if (!Object.hasOwn(row.metadata || {}, "scriptSource")) return row;
  const { scriptSource: _scriptSource, ...metadata } = row.metadata;
  return { ...row, metadata };
}
async function recordOperation(service, method, input) {
  const [ns, action] = method.split(".");
  if (
    !["userTemplates", "userTasks", "templates", "officialScripts"].includes(ns)
  )
    throw Error("Unknown record namespace");
  if (!recordActions[ns].includes(action)) throw Error("不支持的记录操作: " + method);
  if (ns === "officialScripts") throw Error("官方脚本目录未接入，请使用本地脚本模板");
  if (action === "uploadUserTemplateSkill") return require("./agent-skill-upload").uploadSkill(service, input);
  if (action === "uploadUserTemplateScript") {
    return { code: 0, data: require("./agent-script-template").scriptFile(input.filename, input.code) };
  }
  if(ns==='templates')return require('./agent-template-catalog').catalogRequest(service,action,input);
  let source;
  const normalized=normalize(input);
  if(ns==='userTemplates'&&action.startsWith('create')&&normalized.officialTemplateId!==undefined){
    source=(await require('./agent-template-catalog').localCatalog(service)).find(row=>row.id===Number(normalized.officialTemplateId));
    if(!source)throw Error('本地模板不存在或 Skill 已停用');
  }
  const key =
    ns === "userTasks"
      ? "tasks"
      : ns === "userTemplates"
        ? "templates"
        : ns === "templates"
          ? "catalog"
          : "scripts";
  const rows = service.data[key] || [],
    p = source?{...source,...normalized,metadata:{...source.metadata,...normalized.metadata}}:normalized,
    recordId = Number(p.id || p.templateId || p.taskId);
  const sortKey = { name: "name", created_at: "createdAt", createdAt: "createdAt", updated_at: "updatedAt", updatedAt: "updatedAt" }[p.sortBy ?? "updated_at"];
  if (/^list/.test(action) && !sortKey) throw Error("无效的记录排序字段");
  const sort = values => [...values].sort((a, b) =>
    (String(a[sortKey] || "").localeCompare(String(b[sortKey] || "")) || a.id - b.id) * (p.sortOrder === "asc" ? 1 : -1));
  if (/^list/.test(action)) {
    const filtered = sort(
      rows.filter(
        (row) => !p.templateType || row.templateType === p.templateType,
      ),
    );
    if (["templates", "officialScripts"].includes(ns))
      return { code: 0, data: filtered };
    const offset = Math.max(0, Number(p.offset) || 0),
      limit = Math.min(200, Math.max(1, Number(p.limit) || 20));
    return {
      code: 0,
      data: {
        items: filtered.slice(offset, offset + limit).map(row => ns === "userTemplates" ? listTemplate(row) : row),
        total: filtered.length,
        limit,
        offset,
      },
    };
  }
  const row = action.startsWith("create") ? undefined : rows.find((v) => v.id === recordId);
  const idDraft = { [key]: rows, recordIds: structuredClone(service.data.recordIds || {}) };
  if (/^get/.test(action)) {
    if (!row) throw Error("本地记录不存在");
    return { code: 0, data: row };
  }
  if (/^top|^untop/.test(action)) {
    if (!row) throw Error("模板不存在");
    const updated = { ...row, isTopped: action.startsWith("top"), toppedAt: action.startsWith("top") ? date() : null };
    await saveFields(service, { [key]: rows.map(value => value.id === row.id ? updated : value) });
    return { code: 0, data: updated };
  }
  if (/^delete/.test(action)) {
    if(!row)throw Error('本地记录不存在');
    if(ns==='userTemplates'&&service.data.tasks.some(task=>Number(task.userTemplateId)===recordId))
      throw Error('请先删除引用此模板的任务');
    if (
      service.data.conversations.some(
        (c) => ns==='userTasks'&&c.taskId === recordId && service.active.has(c.id),
      )
    )
      throw Error("请先停止运行中的任务");
    rememberRecordIds(idDraft, key);
    await saveFields(service, { [key]: rows.filter((v) => v.id !== recordId), recordIds: idDraft.recordIds });
    return { code: 0, data: true };
  }
  if (!/^create|^update/.test(action))
    throw Error("不支持的记录操作: " + action);
  if (/^update/.test(action) && !row) throw Error("本地记录不存在");
  if (p.metadata !== undefined && !(ns === "userTasks" && p.metadata === null) && (!p.metadata || typeof p.metadata !== "object" || Array.isArray(p.metadata))) throw Error("模板/任务 metadata 必须为对象");
  const value = {
    ...row,
    ...p,
    id: row?.id || nextRecordId(idDraft, key, [
      ...service.data.logs.flatMap(log => [key === "tasks" ? log.taskId : log.templateId]),
      ...service.data.conversations.map(c => key === "tasks" ? c.taskId : service.stateStore.templateReference(c)),
      ...(key === "templates" ? service.data.tasks.map(task => task.userTemplateId) : []),
    ]),
    workspaceId: "local",
    creatorUserId: "local",
    source: source ? 'official' : (row?.source||'custom'),
    createdAt: row?.createdAt || date(),
    updatedAt: date(),
    metadata: p.metadata === null || (p.metadata === undefined && row?.metadata === null) ? null : { ...row?.metadata, ...p.metadata },
  };
  if (!String(value.name || "").trim()) throw Error("请输入名称");
  if (ns === "userTemplates") {
    value.templateType ??= "prompt";
    if (!["prompt", "skill", "script"].includes(value.templateType)) throw Error("无效的模板类型");
    if (value.templateType === "script") {
      if (row?.templateType !== "script" && service.data.tasks.some(task => Number(task.userTemplateId) === value.id))
        throw Error("此模板已被任务引用，不能变更为脚本类型");
      const script = require("./agent-script-template")
        .scriptFile(value.metadata.filename, value.metadata.scriptSource, value.metadata.optionsSchema);
      value.metadata = { ...value.metadata, ...script };
    }
  } else if (ns === "userTasks") {
    const template = service.data.templates.find(t => t.id === Number(value.userTemplateId));
    if (!template) throw Error("所选模板不存在");
    value.windowIds = (value.windowIds || []).map(String);
    if (template.templateType === "script") {
      const script = require("./agent-script-runner").prepareScript(template, value, service.engine);
      value.windowIds = script.windowIds;
    }
    value.planType ??= "manual";
    value.enabled = value.enabled !== false;
    value.nextExecuteAt = next(value);
  }
  await saveFields(service, { [key]: rows.filter((v) => v.id !== value.id).concat(value), recordIds: idDraft.recordIds });
  return { code: 0, data: value };
}
function runTask(service, taskId) {
  return enqueue(service, async () => {
    const task = service.data.tasks.find(row => row.id === Number(taskId));
    const input = await prepareTaskRun(service, task);
    return claimTaskRun(service, task, input);
  });
}
async function prepareTaskRun(service, task, scheduledAt = null) {
  if (!task) throw Error("任务不存在");
  // Older store records predate windowIds normalization; a missing field
  // used to blow up below as "Cannot read properties of undefined".
  const windowIds = Array.isArray(task.windowIds) ? task.windowIds.map(String) : [];
  if (scheduledAt !== null && !task.enabled) throw Error("任务已停用");
  if (service.data.conversations.some(c => c.taskId === task.id && service.active.has(c.id))) {
    throw Object.assign(Error("任务正在运行"), { code: "TASK_ALREADY_RUNNING" });
  }
  const template = service.data.templates.find(
    (t) => t.id === Number(task.userTemplateId),
  );
  if (!template) throw Error("模板不存在");
  const taskMeta = {
    taskId: task.id,
    taskName: task.name,
    templateId: template.id,
    templateName: template.name,
    templateType: template.templateType,
    windowDirIds: windowIds,
    triggerType: scheduledAt ? task.planType : "manual",
    scheduledAt,
    occurrenceId: scheduledAt ? `${task.id}:${scheduledAt}` : null,
  };
  if (template.templateType === "script") {
    const script = require("./agent-script-runner").prepareScript(template, task, service.engine);
    taskMeta.windowDirIds = script.windowIds;
    return { script, message: "运行本地脚本：" + template.name, fullAccess: false, allowedProfileIds: script.windowIds, taskMeta };
  }
  let prompt =
    template.metadata.prompt ||
    template.metadata.usageExample ||
    template.description ||
    template.name;
  if (typeof prompt === "object")
    prompt = prompt["zh-CN"] || prompt.en || Object.values(prompt)[0];
  if (template.templateType === "skill") {
    const slug = template.metadata.skillSlug || template.metadata.slug;
    const skill = (await service.request("skills:list")).find(
      (s) => s.slug === slug && s.enabled,
    );
    if (!skill) throw Error("任务的 Skill 不存在或未启用");
    prompt = String(prompt) + "\n参考 Skill：" + skill.content;
  }
  return {
    message: String(prompt) + "\n任务选择的窗口 ID：" + windowIds.join(", "),
    fullAccess: true,
    allowedProfileIds: windowIds.length ? windowIds : undefined,
    taskMeta,
  };
}

function replaceTask(tasks, task) {
  return tasks.map(row => row.id === task.id ? task : row);
}

function saveTask(service, task) {
  return saveFields(service, { tasks: replaceTask(service.data.tasks, task) });
}

function advanceSchedule(task) {
  return task.planType === "once" ? { ...task, enabled: false, nextExecuteAt: null } : { ...task, nextExecuteAt: next(task) };
}

async function claimTaskRun(service, task, { script, ...input }) {
  const conversation = createConversation();
  const runId = randomUUID(), turnId = randomUUID();
  const user = { id: turnId, role: "user", content: input.message, createdAt: conversation.createdAt };
  Object.assign(conversation, {
    taskId: task.id, latestRunId: runId, latestRunStatus: "running", messages: [user],
    runPolicy: { fullAccess: input.fullAccess, allowedProfileIds: input.allowedProfileIds, taskMeta: input.taskMeta },
  });
  const log = {
    ...input.taskMeta, id: runId, conversationId: conversation.id, status: "preparing", success: false,
    startedAt: conversation.createdAt, endedAt: null, durationMs: null, endReasonCode: null,
    scriptRuns: [], fileIds: [], input: input.message, messages: [user],
  };
  const claimedTask = { ...task, runtimeTaskLogId: runId };
  // Persist the task pointer, conversation and log together before executing.
  await service.save({
    scope: { conversations: [conversation.id], logs: [log.id] },
    snapshot: () => ({
      ...service.data, tasks: replaceTask(service.data.tasks, claimedTask),
      conversations: [conversation, ...service.data.conversations], logs: [log, ...service.data.logs],
    }),
    commit: () => {
      service.data.tasks = replaceTask(service.data.tasks, claimedTask);
      service.data.conversations.unshift(conversation);
      service.data.logs.unshift(log);
    },
  });
  if (service.closing) {
    if (input.taskMeta.triggerType === "manual") throw Error("Agent 正在关闭");
    return;
  }
  service.start({ ...input, conversationId: conversation.id }, randomUUID(), { runId, turnId }, script);
  return { success: true, taskLogId: runId, conversationId: conversation.id };
}

async function runScheduledTask(service, task) {
  const scheduledAt = task.nextExecuteAt;
  const updated = advanceSchedule(task);
  // Versions before atomic claims could record a run before advancing the
  // schedule. Honor those records when reopening an existing store.
  const recorded = service.data.logs.find(log => log.taskId === task.id && log.scheduledAt === scheduledAt);
  if (recorded) {
    await saveTask(service, { ...updated, runtimeTaskLogId: recorded.id });
    return;
  }
  let input;
  try { input = await prepareTaskRun(service, task, scheduledAt); }
  catch (error) {
    await saveTask(service, { ...updated, lastError: error.message });
    service.engine.emit({ channel: "agent:scheduler-error", payload: { taskId: task.id, message: error.message } });
    return;
  }
  if (!service.closing) await claimTaskRun(service, { ...updated, lastError: null }, input);
}
function startScheduler(service) {
  if (service.scheduler || service.closing) return;
  service.scheduler = setInterval(() => {
    if (service.tickBusy || service.closing) return;
    service.tickBusy = true;
    service.tickPromise = enqueue(service,async () => {
      await service.load();
      for (const task of service.data.tasks) {
        if (service.closing || service.attachmentCleanup) break;
        if (
          !task.enabled ||
          !task.nextExecuteAt ||
          Date.parse(task.nextExecuteAt) > Date.now()
        )
          continue;
        await runScheduledTask(service, task);
      }
    })
      .catch((error) => {
        console.error("[local-agent] scheduler failed", error);
      })
      .finally(() => (service.tickBusy = false));
  }, 1000);
  service.scheduler.unref();
}
module.exports = { records, runTask, startScheduler, next, normalize, recordActions, enqueue };
