"use strict";

const HEAVY = new Set(["events", "messages", "checkpoint", "input", "artifacts"]);

function findLog(service, id) {
  const log = service.data.logs.find(row => row.id === id);
  if (!log) throw Error("日志不存在");
  return log;
}

function logSummary(service, log) {
  const value = Object.fromEntries(Object.keys(log).filter(key => !HEAVY.has(key)).map(key => [key, log[key]]));
  const run = service.active.get(log.conversationId);
  const events = Object.getOwnPropertyDescriptor(log, "events")?.value;
  value.eventCount = run?.id === log.id ? run.sequence :
    (Array.isArray(events) ? events.length : service.stateStore.eventCount(log.id));
  return value;
}

function logDetail(service, id) {
  const log = findLog(service, id), run = service.active.get(log.conversationId);
  const active = run?.id === id;
  const messages = active ? service.conversation(run.cid).messages.slice(-2).map(message =>
    message.id === run.assistantId ? { ...message, content: run.partialAnswer || message.content } : message) : log.messages || [];
  const events = active ? run.events : log.events || [];
  const artifacts = active ? run.scriptArtifacts || [] : log.artifacts || [];
  const scriptWindows = log.templateType === "script" ? scriptWindowLogs(log, events, artifacts) : [];
  return structuredClone({ taskLogId: id, conversationId: log.conversationId,
    revision: active ? run.sequence : events.length, messages, artifacts, scriptWindows });
}

function scriptWindowLogs(log, events, artifacts) {
  const windows = new Map((log.windowDirIds || []).map(id => [
    id, { key: id, dirId: id, label: id, status: "preparing", log: "", artifacts: [], failedFiles: [] },
  ]));
  for (const { event } of events) {
    const row = windows.get(event?.data?.scriptWindowId);
    if (!row) continue;
    if (event.data.scriptStatus) row.status = event.data.scriptStatus;
    if (event.data.scriptLine) row.log += event.data.scriptLine;
  }
  for (const file of artifacts) windows.get(file.windowId)?.artifacts.push(file);
  if (["interrupted", "failed"].includes(log.status)) {
    for (const row of windows.values())
      if (["running", "preparing"].includes(row.status)) row.status = log.status;
  }
  return [...windows.values()];
}

module.exports = { logSummary, logDetail };
