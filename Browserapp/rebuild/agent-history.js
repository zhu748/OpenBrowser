"use strict";

const HEAVY = new Set(["events", "messages", "checkpoint", "input"]);

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
  return structuredClone({ taskLogId: id, conversationId: log.conversationId,
    revision: active ? run.sequence : log.events?.length || 0, messages, artifacts: [], scriptWindows: [] });
}

module.exports = { logSummary, logDetail };
