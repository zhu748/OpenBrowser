"use strict";
const { CronExpressionParser } = require("cron-parser");
const { nextRecordId, rememberRecordIds } = require("./local-record-ids");
const { saveFields } = require("./agent-store");
const date = () => new Date().toISOString();
const recordActions = {
 userTemplates: ["listUserTemplates", "getUserTemplate", "createUserTemplate", "updateUserTemplate", "deleteUserTemplate", "topUserTemplate", "untopUserTemplate", "uploadUserTemplateSkill"],
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
  const pending=(service.recordQueue||Promise.resolve()).then(()=>{
    if(service.closing)throw Error('Agent 正在关闭');
    return operation();
  });
  service.recordQueue=pending.catch(()=>{});
  return pending;
}
function records(service, method, input) {
  return enqueue(service, () => recordOperation(service, method, input));
}
async function recordOperation(service, method, input) {
  const [ns, action] = method.split(".");
  if (
    !["userTemplates", "userTasks", "templates", "officialScripts"].includes(ns)
  )
    throw Error("Unknown record namespace");
  if (!recordActions[ns].includes(action)) throw Error("不支持的记录操作: " + method);
  if (ns === "officialScripts") throw Error("原脚本沙箱尚未移植，无法读取脚本");
  if (action === "uploadUserTemplateSkill") return require("./agent-skill-upload").uploadSkill(service, input);
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
        items: filtered.slice(offset, offset + limit),
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
      ...service.data.conversations.flatMap(c => [key === "tasks" ? c.taskId : c.checkpoint?.taskMeta?.templateId]),
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
    if (!["prompt", "skill"].includes(value.templateType))
      throw Error("当前本地运行时支持提示词和 Skill 模板；原脚本沙箱尚未移植");
  } else if (ns === "userTasks") {
    if (
      !service.data.templates.some((t) => t.id === Number(value.userTemplateId))
    )
      throw Error("所选模板不存在");
    value.windowIds = (value.windowIds || []).map(String);
    value.planType ??= "manual";
    value.enabled = value.enabled !== false;
    value.nextExecuteAt = next(value);
  }
  await saveFields(service, { [key]: rows.filter((v) => v.id !== value.id).concat(value), recordIds: idDraft.recordIds });
  return { code: 0, data: value };
}
function runTask(service,taskId,scheduled=false){return enqueue(service,()=>runTaskOperation(service,taskId,scheduled));}
async function runTaskOperation(service, taskId, scheduled = false) {
  const task = service.data.tasks.find((t) => t.id === Number(taskId));
  if (!task) throw Error("任务不存在");
  if (!task.enabled) throw Error("任务已停用");
  if (
    service.data.conversations.some(
      (c) => c.taskId === task.id && service.active.has(c.id),
    )
  )
    throw Object.assign(Error("任务正在运行"), {
      code: "TASK_ALREADY_RUNNING",
    });
  const template = service.data.templates.find(
    (t) => t.id === Number(task.userTemplateId),
  );
  if (!template) throw Error("模板不存在");
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
  const c = await service.request("createConversation");
  c.taskId = task.id;
  const runId = service.start(
    {
      conversationId: c.id,
      message:
        String(prompt) + "\n任务选择的窗口 ID：" + task.windowIds.join(", "),
      fullAccess: true,
      allowedProfileIds: task.windowIds.length ? task.windowIds : undefined,
      taskMeta: {
        taskId: task.id,
        taskName: task.name,
        templateId: template.id,
        templateName: template.name,
        templateType: template.templateType,
        windowDirIds: task.windowIds,
        triggerType: scheduled ? task.planType : "manual",
        scheduledAt: scheduled ? task.nextExecuteAt : null,
      },
    },
    require("node:crypto").randomUUID(),
  );
  task.runtimeTaskLogId = runId;
  await service.save();
  return { success: true, taskLogId: runId, conversationId: c.id };
}
function startScheduler(service) {
  if (service.scheduler || service.closing) return;
  service.scheduler = setInterval(() => {
    if (service.tickBusy || service.closing) return;
    service.tickBusy = true;
    service.tickPromise = enqueue(service,async () => {
      await service.load();
      for (const task of service.data.tasks) {
        if (service.closing) break;
        if (
          !task.enabled ||
          !task.nextExecuteAt ||
          Date.parse(task.nextExecuteAt) > Date.now()
        )
          continue;
        try {
          await runTaskOperation(service, task.id, true);
        } catch (error) {
          service.engine.emit({
            channel: "agent:scheduler-error",
            payload: { taskId: task.id, message: error.message },
          });
          task.lastError = error.message;
        }
        if (task.planType === "once") {
          task.enabled = false;
          task.nextExecuteAt = null;
        } else task.nextExecuteAt = next(task);
        await service.save();
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
