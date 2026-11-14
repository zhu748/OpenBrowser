"use strict";
const EVENT_PROTOCOL_VERSION = 2;
function upgradeEventRanges(data) {
  if (data.eventProtocolVersion === EVENT_PROTOCOL_VERSION) return false;
  if (data.eventProtocolVersion !== undefined && data.eventProtocolVersion !== 1)
    throw Error("Unsupported local Agent event protocol");
  const fix = events => {
    for (const event of events || []) {
      // Version 1 of this local store emitted individual events with a constant
      // startSequence=1. They are atomic, never aggregated ranges from Roxy.
      if (event.startSequence === 1 && Number.isSafeInteger(event.sequence) && event.sequence > 1)
        event.startSequence = event.sequence;
    }
  };
  for (const conversation of data.conversations)
    for (const message of conversation.messages || []) fix(message.events);
  for (const log of data.logs) {
    fix(log.events);
    for (const message of log.messages || []) fix(message.events);
  }
  data.eventProtocolVersion = EVENT_PROTOCOL_VERSION;
  return true;
}
function recoverInterruptedRuns(data) {
  let changed = false;
  const finish = events => {
    if (!events?.length || events.some(item => ["run_completed", "run_failed", "run_cancelled"].includes(item.event?.type))) return;
    const last = events.at(-1), sequence = events.reduce((maximum, item) => Math.max(maximum, item.sequence || 0), 0) + 1;
    events.push({ ...last, sequence, startSequence: sequence, timestamp: Date.now(), event: {
      type: "run_cancelled", data: { reason: "process_exit", message: "应用退出导致任务中断，可从检查点继续。" },
    } });
    changed = true;
  };
  for (const c of data.conversations) {
    if (c.latestRunStatus === "running") { c.latestRunStatus = "interrupted"; c.unread = true; changed = true; }
    if (c.latestRunStatus === "interrupted")
      for (const message of c.messages || [])
        if (message.role === "assistant" && message.events?.some(event => event.runId === c.latestRunId)) finish(message.events);
  }
  for (const log of data.logs) {
    if (log.status === "running" || log.status === "preparing") {
      Object.assign(log, { status: "interrupted", success: false, endedAt: new Date().toISOString(), endReasonCode: "process_exit" });
      changed = true;
    }
    if (log.status === "interrupted" && log.endReasonCode === "process_exit") {
      finish(log.events);
      for (const message of log.messages || []) if (message.role === "assistant") finish(message.events);
    }
  }
  return changed;
}
module.exports = { EVENT_PROTOCOL_VERSION, upgradeEventRanges, recoverInterruptedRuns };
