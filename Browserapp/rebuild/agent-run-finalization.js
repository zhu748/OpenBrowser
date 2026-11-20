"use strict";

const { logSummary } = require("./agent-history");

function finalization(service, conversation, input, run, outcome) {
  const event = service.createRunEvent(run, outcome.type, outcome.data);
  const events = [...run.events, event];
  const messages = [...conversation.messages];
  const assistant = messages.at(-1);
  if (assistant?.id === run.assistantId) {
    messages[messages.length - 1] = { ...assistant, content: run.partialAnswer || outcome.answer || "", events };
  }
  const endedAt = new Date().toISOString();
  const patch = { messages, latestRunStatus: outcome.status, unread: true, updatedAt: endedAt };
  const log = {
    ...run.taskMeta,
    id: run.id,
    conversationId: conversation.id,
    status: run.taskMeta ? ({ completed: "success", cancelled: "interrupted" })[outcome.status] ||
      (outcome.data.code === "PARTIAL_WINDOW_FAILURE" ? "partial_failed" : "failed") : outcome.status,
    success: outcome.status === "completed",
    durationMs: Date.parse(endedAt) - Date.parse(run.startedAt),
    endReasonCode: outcome.data.code || null,
    fileIds: run.scriptArtifacts?.map(file => file.fileId) || [],
    ...(run.scriptArtifacts?.length && { artifacts: run.scriptArtifacts }),
    scriptRuns: [],
    input: input.message,
    startedAt: run.startedAt,
    endedAt,
    messages: structuredClone(messages.slice(-2)),
    events,
    checkpoint: run.checkpoint,
  };
  let removed = [];
  function retainedLogs() {
    const others = service.data.logs.filter(row => row.id !== run.id);
    const activeIds = new Set([...service.active.values()].map(item => item.id));
    for (const pendingId of service.pendingRunSaves.values()) activeIds.add(pendingId);
    const archived = others.filter(row => !activeIds.has(row.id));
    removed = archived.slice(499);
    return replaceLogs();
  }
  function replaceLogs() {
    const expired = new Set([run.id, ...removed.map(row => row.id)]);
    return [log, ...service.data.logs.filter(row => !expired.has(row.id))];
  }
  return {
    scope: { conversations: [conversation.id], logs: [run.id], historyFrom: new Map([[conversation.id, run.historyFrom]]) },
    snapshot: () => ({
      ...service.data,
      conversations: service.data.conversations.map(row => row === conversation ? { ...row, ...patch } : row),
      logs: retainedLogs(),
    }),
    commit() {
      Object.assign(conversation, patch);
      service.data.logs = replaceLogs();
      run.sequence = event.sequence;
      run.events = events;
    },
    publish() {
      service.active.delete(conversation.id);
      service.emit("conversation.run.event", event);
      if (run.taskMeta) service.emit("task_log.changed", logSummary(service, log));
      for (const row of removed) if (row.taskId) service.emit("task_log.deleted", { logId: row.id });
    },
  };
}

async function finishRun(service, conversation, input, run, outcome) {
  let result = finalization(service, conversation, input, run, outcome);
  try {
    await service.save(result);
  } catch (error) {
    console.error("[local-agent] could not commit run result", error);
    result = finalization(service, conversation, input, run, {
      status: "failed", type: "run_failed", answer: outcome.answer,
      data: { code: "AGENT_PERSISTENCE_ERROR", message: error.message, retryable: false },
    });
    try { await service.save(result); }
    catch (failure) {
      // Preserve the failure and response in memory. A later retry persists
      // this exact terminal result without repeating model or tool calls.
      result.commit();
      service.pendingRunSaves.set(conversation.id, run.id);
      service.scheduleRunSaveRetry();
      service.emit("local-agent.persistence-error", { message: failure.message, conversationId: conversation.id });
    }
  }
  result.publish();
}

module.exports = { finishRun };
