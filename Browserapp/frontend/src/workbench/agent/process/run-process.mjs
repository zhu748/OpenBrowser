import { classifyMemoryOperations } from './workbench-tool-event-labels.js';
import { isAgentCancellation, parseAgentStatus } from './workbench-agent-status.js';
import { Nn as taskReportSchema } from './utils-BIWenCnY.js';
import { toRaw } from './workbench-vue.js';
function lifecycleStepStatus(status) {
  return status === 'starting' || status === 'running'
    ? 'running'
    : status === 'completed'
      ? 'success'
      : 'failed';
}
function lifecycleStepTitle(name, status) {
  return `${{ starting: '正在创建', running: '正在执行', completed: '已完成', failed: '执行失败', cancelled: '已取消' }[status]} ${name}`;
}
function ensureAgentNode(context, path, data = {}) {
  let key = `${context.currentConversationId ?? context.conversationId}:${context.currentRunId ?? context.runId}:${path}`,
    existing = context.agentByPath.get(key);
  if (existing) return existing;
  let parent = text(data.parentAgentPath) || path.split('/').slice(0, -1).join('/') || undefined,
    name = text(data.agentName) || path.split('/').at(-1) || path,
    status = text(data.status) || 'starting',
    node = {
      id: `agent-${path}`,
      type: 'agent_lifecycle',
      agentPath: path,
      parentAgentPath: parent,
      agentName: name,
      agentType: text(data.agentType) || 'agent',
      lifecycleStatus: status,
      title: lifecycleStepTitle(name, status),
      status: lifecycleStepStatus(status),
      expanded: false,
      startedAt: finiteNumber(data.startedAt),
      finishedAt: finiteNumber(data.finishedAt),
      report: text(data.report) || undefined,
      error: text(data.error) || undefined,
      events: [],
      children: [],
    };
  context.agentByPath.set(key, node);
  parent && parent !== '/root'
    ? ensureAgentNode(context, parent).children.push(node)
    : path !== '/root' && context.rootEvents.push(node);
  return node;
}
function agentPath(data) {
  let path = text(data.agentPath);
  return path === '/root' || !path ? '/root' : path;
}
function agentScope(context, data) {
  return `${context.currentConversationId ?? context.conversationId}:${context.currentRunId ?? context.runId}:${agentPath(data)}`;
}
function displayEventId(context, data, kind, id) {
  return agentPath(data) === '/root' ? `${kind}-${id}` : `${kind}-${agentScope(context, data)}-${id}`;
}
function agentEvents(context, data) {
  let path = agentPath(data);
  return path === '/root' ? context.rootEvents : ensureAgentNode(context, path, data).events;
}
function applyAgentLifecycle(context, data) {
  let path = text(data.agentPath);
  if (!path) return;
  let node = ensureAgentNode(context, path, data),
    status = text(data.status);
  node.parentAgentPath = text(data.parentAgentPath) || node.parentAgentPath;
  node.agentName = text(data.agentName) || node.agentName;
  node.agentType = text(data.agentType) || node.agentType;
  node.lifecycleStatus = status;
  node.title = lifecycleStepTitle(node.agentName, status);
  node.status = lifecycleStepStatus(status);
  node.startedAt = finiteNumber(data.startedAt) ?? node.startedAt;
  node.finishedAt = finiteNumber(data.finishedAt) ?? node.finishedAt;
  node.report = text(data.report) || node.report;
  node.error = text(data.error) || node.error;
}
function updateBranchRevision(context, path, data, revision) {
  if (path === '/root') return;
  let current = path,
    metadata = data;
  for (; current && current !== '/root'; ) {
    let t3 = ensureAgentNode(context, current, metadata);
    t3.renderRevision = Math.max(t3.renderRevision ?? 0, revision);
    current = t3.parentAgentPath;
    metadata = {};
  }
}
function associateSpawnedAgents(events, children = []) {
  let branches = [...events.filter((e3) => e3.type === 'agent_lifecycle'), ...children],
    unmatched = [...branches],
    matches = new Map();
  for (let t3 of events) {
    if (t3.type !== 'tool_call' || (t3.toolName !== 'spawn_agent' && !t3.toolName.endsWith('__spawn_agent')))
      continue;
    let e3 = record(t3.input),
      n3 = text(e3.name) || text(e3.taskName),
      a3 = n3 ? unmatched.findIndex((e4) => e4.agentName === n3) : unmatched.length > 0 ? 0 : -1;
    a3 < 0 || matches.set(t3.id, unmatched.splice(a3, 1)[0]);
  }
  let placed = new Set(matches.values()),
    ordered = events.flatMap((e3) => {
      let t3 = matches.get(e3.id);
      return t3 ? [t3] : e3.type === 'agent_lifecycle' && placed.has(e3) ? [] : [e3];
    });
  for (let e3 of branches) {
    let t3 = associateSpawnedAgents(e3.events, e3.children);
    e3.events = t3.events;
    e3.children = t3.remainingChildren;
  }
  return { events: ordered, remainingChildren: children.filter((e3) => !placed.has(e3)) };
}
function text(value) {
  return typeof value == 'string' ? value : '';
}
function finiteNumber(value) {
  return typeof value == 'number' && Number.isFinite(value) ? value : undefined;
}
function record(value) {
  return value && typeof value == 'object' && !Array.isArray(value) ? value : {};
}
function parseJsonValue(value) {
  if (typeof value != 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function readTaskReport(input) {
  let parsed = taskReportSchema.safeParse(parseJsonValue(input));
  return parsed.success ? parsed.data : undefined;
}
function messageDate(value) {
  if (!value) return '';
  let date = new Date(typeof value == 'number' && value < 1e10 ? value * 1e3 : value);
  if (Number.isNaN(date.getTime())) return `${value}`;
  let pad = (e3) => `${e3}`.padStart(2, '0'),
    now = new Date();
  return `${date.getFullYear() === now.getFullYear() ? `${pad(date.getMonth() + 1)}/${pad(date.getDate())}` : `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function taskDuration(milliseconds) {
  if (milliseconds < 1e3) return `${$t('任务耗时')} 1s`;
  let seconds = Math.round(milliseconds / 1e3);
  if (seconds < 60) return `${$t('任务耗时')} ${seconds}s`;
  let minutes = Math.floor(seconds / 60),
    remainder = seconds % 60;
  return remainder > 0 ? `${$t('任务耗时')} ${minutes}m${remainder}s` : `${$t('任务耗时')} ${minutes}m`;
}
function stepDuration(milliseconds) {
  let seconds = Math.max(1, Math.round(milliseconds / 1e3));
  if (seconds < 60) return `${seconds}s`;
  let minutes = Math.floor(seconds / 60),
    remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m${remainder}s` : `${minutes}m`;
}
function normalizeToolStatus(status) {
  return status === 'pending' || status === 'running' || status === 'success' || status === 'failed'
    ? status
    : status === 'error' || status === 'cancelled'
      ? 'failed'
      : 'success';
}
function ensureThinking(events, index, key, id) {
  let existing = index.get(key);
  if (existing?.type === 'thinking') return existing;
  let event = {
    id: id,
    type: 'thinking',
    title: $t('正在思考'),
    expanded: false,
    status: 'running',
    content: '',
  };
  index.set(key, event);
  events.push(event);
  return event;
}
function ensureContent(events, index, key, id, emphasis = false) {
  let existing = index.get(key);
  if (existing?.type === 'content') return existing;
  let event = { id: id, type: 'content', content: '', emphasis: emphasis };
  index.set(key, event);
  events.push(event);
  return event;
}
function ensureTool(events, index, key, id, data) {
  let existing = index.get(key);
  if (existing?.type === 'tool_call') return existing;
  let event = {
    id: id,
    type: 'tool_call',
    toolName: text(data.toolName) || 'tool',
    finished: false,
    target: text(data.target),
    patchType:
      data.patchType === 'create' ||
      data.patchType === 'update' ||
      data.patchType === 'delete' ||
      data.patchType === 'mixed'
        ? data.patchType
        : undefined,
    input: data.input,
    status: 'running',
  };
  index.set(key, event);
  events.push(event);
  return event;
}
function ensureReport(events, index, key, id, reportId, report) {
  let existing = index.get(key);
  if (existing?.type === 'task_report') return existing;
  let event = { id: id, type: 'task_report', sourceReportId: reportId, report: report, status: 'success' };
  index.set(key, event);
  events.push(event);
  return event;
}
function isAbsolutePath(path) {
  return path.startsWith('/') || /^[a-z]:[\\/]/i.test(path) || path.startsWith('\\\\');
}
function fileBasename(path) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) || path;
}
function scriptDisplayName(path) {
  return isAbsolutePath(path) ? fileBasename(path) : path;
}
function ensureScriptLog(context, events, key, id, data) {
  let existing = context.eventByKey.get(key);
  if (existing?.type === 'script_log') {
    let e3 = text(data.scriptName);
    e3 &&
      existing.scriptName !== e3 &&
      ((existing.scriptName = e3), (existing.title = `${$t('运行脚本')} ${scriptDisplayName(e3)}`));
    return existing;
  }
  let scriptName = text(data.scriptName),
    name = text(data.toolId) || undefined,
    c2 = text(data.scriptRunId) || undefined,
    l2 = text(data.dirId) || undefined,
    u2 = {
      id: id,
      type: 'script_log',
      title: scriptName ? `${$t('运行脚本')} ${scriptDisplayName(scriptName)}` : $t('运行脚本'),
      expanded: false,
      status: 'running',
      toolId: name,
      scriptRunId: c2,
      dirId: l2,
      scriptName: scriptName,
      lines: [],
    };
  context.eventByKey.set(key, u2);
  events.push(u2);
  return u2;
}
function ensureArtifactGroup(context) {
  let key = 'agent-files',
    existing = context.eventByKey.get(key);
  if (existing?.type === 'agent_file') return existing;
  let artifact = { id: key, type: 'agent_file', title: $t('产物文件'), status: 'success', files: [] };
  context.eventByKey.set(key, artifact);
  context.rootEvents.push(artifact);
  return artifact;
}
function isClarification(data) {
  return data.requestKind === 'clarification';
}
function approvalTitle(data, completed = false) {
  if (isClarification(data)) {
    let n2 = Array.isArray(data.questions) && data.questions.length > 0 ? data.questions.length : 1;
    return completed ? $t('已询问 {n} 个问题', { n: n2 }) : $t('正在询问 {n} 个问题', { n: n2 });
  }
  return completed ? text(data.title) || $t('审批已处理') : text(data.title) || $t('请求批准');
}
function splitAnswer(value) {
  let [title, ...details] = value.split(/[:：]/);
  return { title: title.trim() || value, description: details.join('：').trim() };
}
function choiceDetail(controls) {
  if (!Array.isArray(controls)) return '';
  let choice =
      controls.map(record).find((e3) => text(e3.kind) === 'choice' && text(e3.id) === 'answer') ??
      controls.map(record).find((e3) => text(e3.kind) === 'choice'),
    options = Array.isArray(choice?.options) ? choice.options.map(record) : [],
    r2 = options.find((e3) => text(e3.label).includes('推荐')) ?? options[0];
  return r2 ? splitAnswer(text(r2.label)).title : '';
}
function approvalDetail(data) {
  let description = text(data.description);
  if (description) return description;
  if (isClarification(data)) return;
  let detail = choiceDetail(data.controls);
  if (detail) return detail;
}
function readClarificationQuestions(data) {
  if (!Array.isArray(data.questions)) return;
  let questions = data.questions
    .map(record)
    .map((e3) => {
      let t3 = text(e3.id),
        n2 = text(e3.header),
        r2 = text(e3.question),
        i2 = Array.isArray(e3.options)
          ? e3.options
              .map(record)
              .map((e4) => {
                let t4 = text(e4.label),
                  n3 = text(e4.description);
                return t4 ? { label: t4, description: n3 } : undefined;
              })
              .filter((e4) => !!e4)
          : [];
      return t3 && r2 ? { id: t3, header: n2, question: r2, options: i2 } : undefined;
    })
    .filter((e3) => !!e3);
  return questions.length > 0 ? questions : undefined;
}
function parseAnswers(value) {
  try {
    let t2 = JSON.parse(value);
    return !t2 || typeof t2 != 'object' || Array.isArray(t2)
      ? undefined
      : Object.fromEntries(
          Object.entries(t2)
            .filter(([, e3]) => typeof e3 == 'string')
            .map(([e3, t3]) => [e3, t3.trim()]),
        );
  } catch {
    return;
  }
}
function readApprovalResult(data, questions) {
  let decisions = Array.isArray(data.decisions) ? data.decisions.map(record) : [];
  for (let e3 of decisions)
    if (text(e3.type) === 'answer') {
      let n3 = text(e3.answer).trim();
      if (!questions?.length) return { detail: n3 || $t('已跳过') };
      let r2 = parseAnswers(n3);
      return r2
        ? {
            clarificationAnswers: questions.map((e4) => {
              let t3 = r2[e4.id] || '';
              return {
                id: e4.id,
                question: e4.question,
                answer: t3 || $t('未提供答案'),
                recommended: !!(t3 && e4.options[0]?.label === t3),
              };
            }),
          }
        : { detail: n3 || $t('已跳过') };
    }
}
function ensureApprovalEvent(context, events, scope, id, data) {
  let existing = context.hitlByApprovalId.get(id),
    questions = readClarificationQuestions(data),
    count = questions?.length;
  if (existing)
    return (
      (existing.title = approvalTitle(data)),
      (existing.prompt = text(data.prompt) || existing.prompt),
      (existing.description = text(data.description) || existing.description),
      (existing.detail = approvalDetail(data) || existing.detail),
      (existing.requestKind = isClarification(data) ? 'clarification' : 'approval'),
      (existing.clarificationQuestionCount = count ?? existing.clarificationQuestionCount),
      (existing.clarificationQuestions = questions ?? existing.clarificationQuestions),
      (existing.status = 'running'),
      existing
    );
  let c2 = {
    id: `hitl-${scope}-${id}`,
    type: 'hitl',
    title: approvalTitle(data),
    prompt: text(data.prompt) || $t('RoxyAgent 需要您的输入才能继续'),
    description: text(data.description) || undefined,
    detail: approvalDetail(data),
    requestKind: isClarification(data) ? 'clarification' : 'approval',
    clarificationQuestionCount: count,
    clarificationQuestions: questions,
    approvalId: id,
    status: 'running',
    expanded: true,
  };
  context.hitlByApprovalId.set(id, c2);
  events.push(c2);
  return c2;
}
function completeApproval(context, data, timestamp) {
  let id = text(data.approvalId),
    event = id ? context.hitlByApprovalId.get(id) : undefined;
  if (!event) return;
  let result =
    event.requestKind === 'clarification'
      ? readApprovalResult(data, event.clarificationQuestions)
      : undefined;
  event.status = 'success';
  event.title =
    event.requestKind === 'clarification'
      ? $t('已询问 {n} 个问题', { n: event.clarificationQuestionCount ?? 1 })
      : approvalTitle({ ...data, requestKind: event.requestKind }, true);
  event.detail = result?.detail ?? event.detail;
  event.clarificationAnswers = result?.clarificationAnswers ?? event.clarificationAnswers;
  event.timestamp = messageDate(timestamp);
}
function retryTitle(data, status = 'running') {
  if (status === 'success') return $t('已重新连接');
  if (status === 'failed') return $t('网络重试失败');
  let attempt = finiteNumber(data.attempt) ?? 0,
    maximum = finiteNumber(data.maxAttempts) ?? 0;
  return $t('正在重新连接 {attempt}/{maxAttempts}', { attempt: attempt, maxAttempts: maximum });
}
function recordRetry(context, events, scope, key, id, data) {
  let existing = context.activeRetriesByScope.get(scope);
  if (existing)
    return (
      (existing.attempt = finiteNumber(data.attempt) ?? existing.attempt),
      (existing.maxAttempts = finiteNumber(data.maxAttempts) ?? existing.maxAttempts),
      (existing.reason = text(data.reason) || existing.reason),
      (existing.status = 'running'),
      (existing.title = retryTitle(data)),
      existing
    );
  let event = context.eventByKey.get(key);
  if (event?.type === 'retrying')
    return (
      (event.attempt = finiteNumber(data.attempt) ?? event.attempt),
      (event.maxAttempts = finiteNumber(data.maxAttempts) ?? event.maxAttempts),
      (event.reason = text(data.reason) || event.reason),
      (event.status = 'running'),
      (event.title = retryTitle(data)),
      context.activeRetriesByScope.set(scope, event),
      event
    );
  let c2 = {
    id: id,
    type: 'retrying',
    title: retryTitle(data),
    attempt: finiteNumber(data.attempt) ?? 0,
    maxAttempts: finiteNumber(data.maxAttempts) ?? 0,
    reason: text(data.reason) || undefined,
    status: 'running',
    timestamp: undefined,
  };
  context.eventByKey.set(key, c2);
  context.activeRetriesByScope.set(scope, c2);
  events.push(c2);
  return c2;
}
function finishRetry(context, scope, status) {
  let retry = context.activeRetriesByScope.get(scope);
  retry &&
    ((retry.status = status),
    (retry.title = retryTitle(retry, status)),
    context.activeRetriesByScope.delete(scope));
}
function appendScriptOutput(context, data) {
  let scope = agentScope(context, data),
    toolId = text(data.toolId),
    runId = text(data.scriptRunId),
    profileId = text(data.dirId),
    identity = toolId || runId || text(data.scriptName) || 'default',
    groupId = profileId || runId,
    events = agentEvents(context, data),
    group = `script:${scope}:${identity}`,
    key = groupId ? `${group}:${groupId}` : group,
    existing = context.eventByKey.get(key);
  if (existing?.type !== 'script_log') {
    let f3 = context.eventByKey.get(group);
    f3?.type === 'script_log' && !f3.dirId
      ? ((f3.toolId = toolId || f3.toolId),
        (f3.scriptRunId = runId || f3.scriptRunId),
        (f3.dirId = profileId || f3.dirId),
        context.eventByKey.set(key, f3),
        (existing = f3))
      : (existing = ensureScriptLog(
          context,
          events,
          key,
          `script-log-${scope}-${identity}-${groupId || 'default'}`,
          data,
        ));
  }
  if (existing.type !== 'script_log') return;
  let f2 = text(data.scriptName);
  f2 &&
    existing.scriptName !== f2 &&
    ((existing.scriptName = f2), (existing.title = `${$t('运行脚本')} ${scriptDisplayName(f2)}`));
  existing.toolId = toolId || existing.toolId;
  existing.scriptRunId = runId || existing.scriptRunId;
  existing.dirId = profileId || existing.dirId;
  let p2 =
    data.unavailableReason === 'file_missing'
      ? $t('（脚本日志文件不存在）')
      : text(data.message) || text(data.text);
  p2 && existing.lines.push({ level: text(data.level) || 'info', message: p2 });
}
function appendArtifact(context, data) {
  let fileId = text(data.fileId),
    fileName = text(data.fileName);
  if (!fileId || !fileName) return;
  let group = ensureArtifactGroup(context),
    file = {
      fileId: fileId,
      fileName: fileName,
      size: finiteNumber(data.size) ?? 0,
      mimeType: text(data.mimeType) || 'application/octet-stream',
      op: data.op === 'update' ? 'update' : 'create',
    },
    o2 = group.files.findIndex((e3) => e3.fileId === file.fileId);
  o2 >= 0 ? (group.files[o2] = file) : group.files.push(file);
}
function appendFinalAnswer(context, content) {
  context.finalAnswer ||
    ((context.finalAnswer = { id: 'final-answer', type: 'final_answer', content: '' }),
    context.rootEvents.push(context.finalAnswer));
  context.finalAnswer.content += content;
}
function promoteFinalContent(context) {
  if (!context.finalAnswer?.content.trim())
    for (let t2 = context.rootEvents.length - 1; t2 >= 0; t2--) {
      let n2 = context.rootEvents[t2];
      if (n2.type === 'content' && n2.content.trim()) {
        context.finalAnswer = { id: 'final-answer', type: 'final_answer', content: n2.content };
        context.rootEvents.splice(t2, 1, context.finalAnswer);
        return;
      }
    }
}
function setFinalAnswer(context, content) {
  context.finalAnswer || promoteFinalContent(context);
  context.finalAnswer ? (context.finalAnswer.content = content) : appendFinalAnswer(context, content);
}
function finishThinking(context, id, scope, data, timestamp) {
  let key = `${scope}:thinking:${id}`,
    event = context.eventByKey.get(key);
  if (event?.type !== 'thinking') return;
  let duration =
    event.durationStartedAt !== undefined && timestamp !== undefined
      ? Math.max(0, timestamp - event.durationStartedAt)
      : undefined;
  event.durationEndedAt = finiteNumber(data.endTimestamp) ?? timestamp;
  event.durationMs = finiteNumber(data.durationMs) ?? duration;
  event.title = `${$t('已思考')} ${stepDuration(event.durationMs ?? 0)}`;
  event.status = 'success';
}
function beginToolEvent(context, data) {
  let toolName = text(data.toolName) || 'tool',
    toolId = text(data.toolId) || `${toolName}-${context.eventByKey.size}`,
    scope = agentScope(context, data),
    events = agentEvents(context, data);
  if (toolName === 'roxy_task_report') {
    let n3 = readTaskReport(data.input ?? data.args);
    if (!n3) return;
    context.pendingTaskReports.set(`task-report:${scope}:${toolId}`, { sourceReportId: toolId, report: n3 });
  } else if (
    classifyMemoryOperations(toolName, data.input ?? data.args, {
      patchType:
        data.patchType === 'create' ||
        data.patchType === 'update' ||
        data.patchType === 'delete' ||
        data.patchType === 'mixed'
          ? data.patchType
          : undefined,
      target: text(data.target) || undefined,
    })?.kind !== 'hidden'
  )
    if (toolName === 'load_skill_file') {
      let n3 = text(data.skillFilePath) || text(data.skillName) || 'skill',
        o2 = { id: `skill-${scope}-${toolId}`, type: 'skill_load', skillPath: n3, status: 'running' };
      context.eventByKey.set(`skill:${scope}:${toolId}`, o2);
      events.push(o2);
    } else if (toolName === 'roxy_script_run') {
      let n3 = record(data.input ?? data.args),
        o2 = Array.isArray(n3.scripts)
          ? n3.scripts.filter((e3) => !(!e3 || typeof e3 != 'object' || Array.isArray(e3)))
          : [n3],
        s2 = [
          ...new Set(
            o2.flatMap((e3) => (Array.isArray(e3.dirIds) ? e3.dirIds.map(text).filter(Boolean) : [])),
          ),
        ];
      if (s2.length > 0) {
        for (let n4 of s2)
          ensureScriptLog(
            context,
            events,
            `script:${scope}:${toolId}:${n4}`,
            `script-log-${scope}-${toolId}-${n4}`,
            { ...data, scriptName: text(data.target), toolId: toolId, dirId: n4 },
          );
        return;
      }
      ensureScriptLog(context, events, `script:${scope}:${toolId}`, `script-log-${scope}-${toolId}`, {
        ...data,
        scriptName: text(data.target),
        toolId: toolId,
      });
    } else ensureTool(events, context.eventByKey, `tool:${scope}:${toolId}`, `tool-${scope}-${toolId}`, data);
}
function completeToolEvent(context, data) {
  let toolName = text(data.toolName) || 'tool',
    toolId = text(data.toolId) || `${toolName}-${context.eventByKey.size}`,
    scope = agentScope(context, data),
    reportKey = `task-report:${scope}:${toolId}`,
    pending = context.pendingTaskReports.get(reportKey);
  if (pending) {
    if ((context.pendingTaskReports.delete(reportKey), data.status === 'success')) {
      let n3 = ensureReport(
        agentEvents(context, data),
        context.eventByKey,
        reportKey,
        `task-report-${scope}-${toolId}`,
        pending.sourceReportId,
        pending.report,
      );
      for (let r3 of agentEvents(context, data))
        r3.type === 'task_report' && r3 !== n3 && (r3.superseded = true);
    }
    return;
  }
  let s2 = context.eventByKey.get(`skill:${scope}:${toolId}`);
  if (s2?.type === 'skill_load') {
    s2.status = normalizeToolStatus(data.status);
    return;
  }
  if (toolName === 'roxy_script_run') {
    let n3 = normalizeToolStatus(data.status),
      i3 = agentEvents(context, data);
    for (let t3 of new Set(context.eventByKey.values()))
      t3.type === 'script_log' && t3.toolId === toolId && i3.includes(t3) && (t3.status = n3);
    return;
  }
  let c2 = context.eventByKey.get(`tool:${scope}:${toolId}`);
  c2?.type === 'tool_call' &&
    ((c2.finished = true),
    (c2.status = normalizeToolStatus(data.status)),
    (c2.output = data.output),
    (c2.durationMs = finiteNumber(data.durationMs)));
}
function recordTimestamp(context, timestamp) {
  timestamp &&
    ((context.firstTimestamp =
      context.firstTimestamp === undefined ? timestamp : Math.min(context.firstTimestamp, timestamp)),
    (context.lastTimestamp =
      context.lastTimestamp === undefined ? timestamp : Math.max(context.lastTimestamp, timestamp)));
}
function finishTimeline(events, failed) {
  for (let n2 of events)
    (n2.status === 'running' && (n2.status = failed ? 'failed' : 'success'),
      n2.type === 'agent_lifecycle' &&
        (finishTimeline(n2.events, failed), n2.children.forEach((e3) => finishTimeline([e3], failed))));
}
function eventScope(envelope) {
  let data = record(envelope.event.data);
  return `${envelope.conversationId}:${envelope.runId}:${agentPath(data)}`;
}
function deltaKey(envelope) {
  let scope = eventScope(envelope);
  if (envelope.event.type === 'thinking_delta')
    return `${scope}:thinking:${envelope.event.data.id ?? envelope.event.data.thinkingId}`;
  if (envelope.event.type === 'content_delta')
    return `${scope}:content:${envelope.event.data.id ?? envelope.event.data.contentId}:${envelope.event.data.phase ?? ''}`;
}
function thinkingCompletionKey(envelope) {
  if (envelope.event.type === 'thinking_completed')
    return `${eventScope(envelope)}:thinking:${envelope.event.data.id ?? envelope.event.data.thinkingId}`;
}
function normalizeReplay(events) {
  let sorted = [...events].sort((e3, t3) => e3.sequence - t3.sequence),
    deltas = new Map(),
    active = new Map(),
    discarded = new Set(),
    completed = new Set(),
    o2 = (e3, t3) => {
      let n3 = e3.get(t3);
      n3 || ((n3 = new Map()), e3.set(t3, n3));
      return n3;
    },
    s2 = (e3) => {
      if (e3) for (let t3 of e3.values()) for (let e4 of t3.sequences) completed.add(e4);
    },
    c2 = (e3) => {
      s2(active.get(e3));
      active.delete(e3);
    },
    l2 = () => {
      for (let e3 of active.values()) s2(e3);
      for (let e3 of deltas.values()) s2(e3);
      active.clear();
      deltas.clear();
    },
    u2 = (e3) => {
      deltas.delete(e3);
    },
    d2 = () => {
      deltas.clear();
    },
    f2 = (e3) => {
      let t3 = deltas.get(e3);
      if (!t3) return;
      let i3 = o2(active, e3);
      for (let [e4, n3] of t3) {
        let t4 = i3.get(e4);
        if (t4) for (let e5 of n3.sequences) t4.sequences.add(e5);
        else i3.set(e4, n3);
      }
      deltas.delete(e3);
    };
  for (let e3 of sorted) {
    let t3 = e3.event,
      a3 = eventScope(e3),
      s3 = deltaKey(e3);
    if (s3 && (t3.type === 'thinking_delta' || t3.type === 'content_delta')) {
      c2(a3);
      let r3 = o2(deltas, a3),
        i3 = t3.type === 'thinking_delta' ? 'content_delta' : 'thinking_delta';
      for (let [e4, t4] of r3) t4.type === i3 && r3.delete(e4);
      let l3 = r3.get(s3) ?? { sequences: new Set(), type: t3.type };
      l3.sequences.add(e3.sequence);
      r3.set(s3, l3);
      continue;
    }
    if (t3.type === 'run_retrying') {
      discarded.add(a3);
      f2(a3);
      continue;
    }
    let p2 = thinkingCompletionKey(e3);
    if (p2) {
      let t4 = deltas.get(a3)?.get(p2);
      if (t4) {
        t4.sequences.add(e3.sequence);
        continue;
      }
      let i3 = active.get(a3)?.get(p2);
      if (i3) {
        i3.sequences.add(e3.sequence);
        continue;
      }
    }
    if (t3.type === 'run_completed') {
      for (let e4 of [...active.keys()]) c2(e4);
      d2();
      discarded.clear();
    } else
      t3.type === 'run_failed'
        ? (t3.data.code === 'network_interrupted' ? l2() : d2(), discarded.clear())
        : t3.type === 'run_cancelled'
          ? (t3.data.reason === 'user' ? d2() : l2(), discarded.clear())
          : (c2(a3), u2(a3), discarded.delete(a3));
  }
  return sorted.filter((e3) => !completed.has(e3.sequence));
}
function createProcessContext(id, events) {
  return {
    conversationId: events[0]?.conversationId ?? id,
    runId: events[0]?.runId ?? id,
    rootEvents: [],
    eventByKey: new Map(),
    activeRetriesByScope: new Map(),
    agentByPath: new Map(),
    hitlByApprovalId: new Map(),
    pendingTaskReports: new Map(),
  };
}
function applyRunEvent(context, envelope) {
  let event = envelope.event,
    payload = event.data,
    data = record(payload);
  context.currentConversationId = envelope.conversationId;
  context.currentRunId = envelope.runId;
  recordTimestamp(context, envelope.timestamp);
  let path = agentPath(data),
    scope = agentScope(context, data);
  switch ((updateBranchRevision(context, path, data, envelope.sequence), event.type)) {
    case 'agent_lifecycle':
      applyAgentLifecycle(context, data);
      break;
    case 'run_retrying': {
      let n3 = text(data.retryId) || `sequence-${envelope.sequence}`,
        r3 = agentEvents(context, data);
      recordRetry(context, r3, scope, `retry:${scope}:${n3}`, `retry-${scope}-${n3}`, data).timestamp =
        messageDate(envelope.timestamp);
      break;
    }
    case 'thinking_delta': {
      finishRetry(context, scope, 'success');
      let n3 = text(data.id) || text(data.thinkingId) || 'main',
        r3 = agentEvents(context, data),
        a3 = `${scope}:thinking:${n3}`,
        s2 = ensureThinking(r3, context.eventByKey, a3, displayEventId(context, data, 'thinking', n3));
      s2.durationStartedAt ??= envelope.timestamp;
      s2.content += text(data.text);
      break;
    }
    case 'thinking_completed':
      finishThinking(context, text(data.id) || text(data.thinkingId), scope, data, envelope.timestamp);
      break;
    case 'content_delta': {
      finishRetry(context, scope, 'success');
      let t3 = text(data.id) || text(data.contentId) || `content-${context.eventByKey.size}`;
      if (data.phase === 'synthesis' && path === '/root') {
        appendFinalAnswer(context, text(data.text));
        break;
      }
      let n3 = agentEvents(context, data),
        r3 = `${scope}:content:${t3}:${text(data.phase)}`,
        s2 = ensureContent(
          n3,
          context.eventByKey,
          r3,
          displayEventId(context, data, 'content', t3),
          path !== '/root',
        );
      s2.content += text(data.text);
      break;
    }
    case 'tool_started':
      (finishRetry(context, scope, 'success'),
        beginToolEvent(context, { ...data, args: data.input, agentPath: path }));
      break;
    case 'tool_finished':
      completeToolEvent(context, { ...data, result: data.output, et: data.durationMs, agentPath: path });
      break;
    case 'approval_requested': {
      let n3 = text(data.approvalId) || text(data.interruptsId) || `sequence-${envelope.sequence}`,
        r3 = ensureApprovalEvent(context, agentEvents(context, data), scope, n3, data);
      r3.timestamp = messageDate(envelope.timestamp);
      break;
    }
    case 'approval_resolved':
      completeApproval(context, data, envelope.timestamp);
      break;
    case 'run_completed':
      (finishRetry(context, `${context.conversationId}:${context.runId}:/root`, 'success'),
        text(data.finalAnswer) && setFinalAnswer(context, text(data.finalAnswer)),
        (context.endStatus = 'completed'));
      break;
    case 'run_failed': {
      finishRetry(context, scope, 'failed');
      let t3 = data;
      if (isAgentCancellation(t3)) {
        context.endStatus = 'cancelled';
        break;
      }
      context.endStatus = 'failed';
      let n3 = parseAgentStatus(t3);
      context.errorData =
        typeof t3.code == 'string'
          ? t3
          : {
              ...(n3.code ? { code: n3.code } : {}),
              message: text(t3.message),
              retryable: n3.retryable,
              ...(n3.requestId ? { requestId: n3.requestId } : {}),
            };
      context.errorMessage = n3.message;
      break;
    }
    case 'run_cancelled':
      (finishRetry(context, scope, 'success'), (context.endStatus = 'cancelled'));
      break;
    case 'script_output':
      appendScriptOutput(context, data);
      break;
    case 'artifact_created':
      appendArtifact(context, { ...data, op: data.operation });
      break;
    case 'context_compacted': {
      let n3 = finiteNumber(data.compactedCount) ?? 0,
        r3 = data.status !== 'started',
        a3 = agentEvents(context, data),
        s2 = a3.find((e3) => e3.type === 'context_compacted' && e3.status === 'running');
      if (s2?.type === 'context_compacted') {
        s2.title = r3 ? $t('上下文已自动压缩') : $t('正在自动压缩上下文');
        s2.status = r3 ? 'success' : 'running';
        s2.compactedCount = n3;
        s2.summary = text(data.summary) || undefined;
        s2.timestamp = messageDate(envelope.timestamp);
        break;
      }
      let c2 = {
        id: `context-compacted-${scope}-${envelope.sequence}`,
        type: 'context_compacted',
        title: r3 ? $t('上下文已自动压缩') : $t('正在自动压缩上下文'),
        compactedCount: n3,
        summary: text(data.summary) || undefined,
        status: r3 ? 'success' : 'running',
        timestamp: messageDate(envelope.timestamp),
      };
      a3.push(c2);
      break;
    }
  }
}
function bindVisibleEvents(events, visible, indexed) {
  let reused = new Set();
  for (let i2 = 0; i2 < events.length; i2++) {
    let a2 = events[i2],
      o2 = i2,
      s2 = visible[o2];
    (!s2 || s2.id !== a2.id || s2.type !== a2.type || reused.has(o2)) &&
      ((o2 = visible.findIndex((e3, t3) => !reused.has(t3) && e3.id === a2.id && e3.type === a2.type)),
      (s2 = o2 >= 0 ? visible[o2] : undefined));
    s2 &&
      (reused.add(o2),
      indexed.set(toRaw(a2), s2),
      a2.type === 'agent_lifecycle' &&
        s2.type === 'agent_lifecycle' &&
        (bindVisibleEvents(a2.events, s2.events, indexed),
        bindVisibleEvents(a2.children, s2.children, indexed)));
  }
}
function bindCheckpointToView(context, process) {
  let indexed = new Map();
  bindVisibleEvents(context.rootEvents, process.events, indexed);
  let viewOf = (e3) => indexed.get(toRaw(e3)) ?? e3;
  for (let [t3, n3] of context.eventByKey) context.eventByKey.set(t3, viewOf(n3));
  for (let [t3, n3] of context.activeRetriesByScope) context.activeRetriesByScope.set(t3, viewOf(n3));
  for (let [t3, n3] of context.agentByPath) context.agentByPath.set(t3, viewOf(n3));
  for (let [t3, n3] of context.hitlByApprovalId) context.hitlByApprovalId.set(t3, viewOf(n3));
  context.finalAnswer &&= viewOf(context.finalAnswer);
  context.rootEvents = process.events;
}
function makeCheckpoint(context, events) {
  let lastSequence;
  for (let e3 of events)
    lastSequence = lastSequence === undefined ? e3.sequence : Math.max(lastSequence, e3.sequence);
  return {
    context: context,
    eventCount: events.length,
    lastEvent: events.at(-1),
    lastSequence: lastSequence,
    replayUnsafe: events.some((e3) => e3.event.type === 'run_retrying'),
  };
}
function paintProcess(id, events, checkpoint, options, visible) {
  let context = checkpoint.context;
  !context.finalAnswer?.content.trim() &&
    context.errorMessage &&
    appendFinalAnswer(context, context.errorMessage);
  let failed = context.endStatus === 'failed',
    completed = context.endStatus === 'completed',
    ended = context.endStatus !== undefined;
  options.finalize !== false && completed && promoteFinalContent(context);
  options.finalize !== false && ended && finishTimeline(context.rootEvents, failed);
  context.rootEvents = associateSpawnedAgents(context.rootEvents).events;
  let l2 = context.finalAnswer?.content || '',
    u2 = context.firstTimestamp,
    d2 = visible?.durationStartedAt,
    f2 = u2 === undefined ? d2 : d2 === undefined ? u2 : Math.min(u2, d2),
    p2 =
      f2 !== undefined && context.lastTimestamp !== undefined
        ? Math.max(0, context.lastTimestamp - f2)
        : undefined,
    m2 = ended ? messageDate(context.lastTimestamp) : '',
    h2 = visible ?? { id: `history-process-${id}`, events: context.rootEvents };
  h2.id = `history-process-${id}`;
  h2.revision = events.at(-1)?.sequence ?? checkpoint.lastSequence ?? 0;
  h2.completed = completed;
  h2.durationLabel = p2 === undefined ? undefined : taskDuration(p2);
  h2.durationState = ended ? undefined : 'thinking';
  h2.durationStartedAt = f2;
  h2.durationEndedAt = ended ? context.lastTimestamp : undefined;
  h2.collapsed = completed;
  h2.events = context.rootEvents;
  return {
    content: l2,
    completedAt: m2,
    process: h2,
    status: failed ? 'error' : ended ? 'done' : 'streaming',
    errorData: context.errorData,
    checkpoint: checkpoint,
  };
}
function requiresReplay(envelope) {
  return envelope.event.type === 'run_retrying'
    ? true
    : envelope.event.type === 'run_failed'
      ? envelope.event.data.code === 'network_interrupted'
      : envelope.event.type === 'run_cancelled' && envelope.event.data.reason !== 'user';
}
function continueProcess(id, previous, events, checkpoint, options = { finalize: false }) {
  if (
    checkpoint.replayUnsafe ||
    events.length <= checkpoint.eventCount ||
    (checkpoint.eventCount > 0 && events[checkpoint.eventCount - 1] !== checkpoint.lastEvent)
  )
    return;
  let appended = events.slice(checkpoint.eventCount);
  if (appended.some(requiresReplay)) return;
  let context = checkpoint.lastSequence;
  for (let e3 of appended) {
    if (context !== undefined && e3.sequence <= context) return;
    context = e3.sequence;
  }
  bindCheckpointToView(checkpoint.context, previous);
  for (let e3 of appended) applyRunEvent(checkpoint.context, e3);
  checkpoint.eventCount = events.length;
  checkpoint.lastEvent = events.at(-1);
  checkpoint.lastSequence = context;
  return paintProcess(id, events, checkpoint, options, previous);
}
function replayProcess(id, events, options = {}) {
  let context = createProcessContext(id, events);
  for (let e3 of normalizeReplay(events)) applyRunEvent(context, e3);
  return paintProcess(id, events, makeCheckpoint(context, events), options);
}
function assistantMessageFromHistory(conversationId, message, index) {
  let id = message.id || `${conversationId}-assistant-${index}`,
    content = message.content ?? '',
    events = message.events ?? [];
  if (events.length > 0) {
    let n3 = replayProcess(id, events, { finalize: true });
    return {
      id: id,
      conversationId: conversationId,
      runId: events[0]?.runId ?? `history-run-${id}`,
      role: 'assistant',
      author: 'OpenBrowser AI Agent',
      content: n3.content,
      createdAt: n3.completedAt || messageDate(message.createdAt),
      status: n3.status,
      process: n3.process,
      errorData: n3.errorData,
    };
  }
  return {
    id: id,
    conversationId: conversationId,
    runId: `history-run-${id}`,
    role: 'assistant',
    author: 'OpenBrowser AI Agent',
    content: content,
    createdAt: messageDate(message.createdAt),
    status: 'done',
  };
}
function readHistoryAttachments(message) {
  let attachments = message.metadata?.attachments;
  if (Array.isArray(attachments) && attachments.length !== 0)
    return attachments.map((e3) => ({
      fileId: e3.fileId,
      kind: 'file',
      fileName: e3.fileName,
      mimeType: e3.mimeType,
      size: e3.size,
      url: e3.url,
      localUrl: e3.localUrl,
      remoteUrl: e3.remoteUrl,
      fileUrl: e3.fileUrl,
      uploadStatus: 'uploaded',
    }));
}
function conversationFromRecord(row) {
  return {
    id: row.id,
    title: row.title?.trim() || 'New conversation',
    updatedAt: messageDate(row.updatedAt || row.createdAt),
    latestRunId: row.latestRunId,
    latestRunStatus: row.latestRunStatus,
    runningRunIds: [],
    unread: row.unread,
  };
}
function messagesFromHistory(history) {
  let conversationId = history.conversation.id;
  return (history.messages ?? [])
    .filter((e3) => e3.role !== 'system')
    .map((e3, n2) =>
      e3.role === 'assistant'
        ? assistantMessageFromHistory(conversationId, e3, n2)
        : {
            id: e3.id || `${conversationId}-user-${n2}`,
            conversationId: conversationId,
            role: 'user',
            author: 'You',
            content: e3.content ?? '',
            attachments: readHistoryAttachments(e3),
            createdAt: messageDate(e3.createdAt),
            status: 'done',
          },
    );
}
class ProcessAccumulator {
  checkpoint;
  reset(events, checkpoint) {
    this.checkpoint =
      checkpoint ?? replayProcess('incremental-process', events, { finalize: false }).checkpoint;
  }
  update(idOrProcess, processOrEvents, events) {
    const implicitId = typeof idOrProcess !== 'string';
    const id = implicitId ? 'incremental-process' : idOrProcess;
    const process = implicitId ? idOrProcess : processOrEvents;
    const timeline = implicitId ? processOrEvents : events;
    if (!timeline || !this.checkpoint) return false;
    const result = continueProcess(id, process, timeline, this.checkpoint, { finalize: false });
    if (!result) return false;
    this.checkpoint = result.checkpoint;
    return implicitId ? true : result;
  }
}
function finishOfflineEvents(events) {
  for (const event of events) {
    if (event.status === 'running' || event.status === 'pending') event.status = 'failed';
    if (event.type === 'agent_lifecycle') {
      if (event.lifecycleStatus === 'starting' || event.lifecycleStatus === 'running')
        event.lifecycleStatus = 'cancelled';
      finishOfflineEvents(event.events);
      finishOfflineEvents(event.children);
    }
  }
}
export {
  messageDate as formatMessageDate,
  taskDuration as formatTaskDuration,
  replayProcess as buildRunProcess,
  conversationFromRecord as readConversationRow,
  messagesFromHistory as readConversationMessages,
  ProcessAccumulator as IncrementalProcess,
  finishOfflineEvents as failLiveTimelineEvents,
};
