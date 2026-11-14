import {St as ref,d as computed} from "./runtime-core.esm-bundler-CBj16o9G.js";
const connected = ref(!1);
const lastError = ref();
const taskLogs = ref([]);
const ready = ref(!1);
const subscribers = /* @__PURE__ */ new Set();
const taskExecutionDetails = ref({});
const detail = (log) => ({
  taskLogId: log.id,
  revision: log.events?.length || 0,
  conversationId: log.conversationId,
  messages: log.messages || [],
  artifacts: [],
  scriptWindows: []
});
const delivered = /* @__PURE__ */ new WeakMap();
const deliver = (fn, event) => {
  let seen = delivered.get(fn);
  seen || (seen = /* @__PURE__ */ new Set(), delivered.set(fn, seen));
  const key = event.type === "conversation.run.event" ? `${event.data.runId}:${event.data.conversationId}:${event.data.assistantMessageId}:${event.data.sequence}` : event.id;
  seen.has(key) || (seen.add(key), seen.size > 1e4 && seen.delete(seen.values().next().value), fn(event));
};
const dispatch = (event) => {
  if (event.type === "task_log.changed" && (taskLogs.value = [
    event.data,
    ...taskLogs.value.filter((log) => log.id !== event.data.id)
  ], taskExecutionDetails.value = {
    ...taskExecutionDetails.value,
    [event.data.id]: detail(event.data)
  }), event.type === "task_log.deleted") {
    taskLogs.value = taskLogs.value.filter(
      (log) => log.id !== event.data.logId
    );
    const next = { ...taskExecutionDetails.value };
    delete next[event.data.logId], taskExecutionDetails.value = next;
  }
  if (event.type === "conversation.run.event") {
    const e = event.data, log = taskLogs.value.find(
      (log2) => log2.conversationId === e.conversationId
    );
    if (log && e.sequence > (taskExecutionDetails.value[log.id]?.revision || 0)) {
      const previous = taskExecutionDetails.value[log.id] || detail(log), messages = [...previous.messages];
      if (e.event.type === "user_message" && messages.push({
        id: e.event.data.messageId,
        role: "user",
        content: e.event.data.content,
        createdAt: new Date(e.timestamp).toISOString()
      }), e.event.type === "content_delta") {
        let assistant = messages.find((m) => m.id === e.assistantMessageId);
        assistant ? (assistant = {
          ...assistant,
          content: assistant.content + e.event.data.text
        }, messages[messages.findIndex((m) => m.id === assistant.id)] = assistant) : messages.push({
          id: e.assistantMessageId,
          role: "assistant",
          content: e.event.data.text,
          createdAt: new Date(e.timestamp).toISOString()
        });
      }
      taskExecutionDetails.value = {
        ...taskExecutionDetails.value,
        [log.id]: { ...previous, revision: e.sequence, messages }
      };
    }
  }
  for (const fn of subscribers) deliver(fn, event);
};
const replayActive = async (target) => {
  if (target && !subscribers.has(target) || !target && !subscribers.size) return;
  const events = await globalThis.__agentRequest("activeEvents");
  for (const event of events)
    target ? subscribers.has(target) && deliver(target, event) : dispatch(event);
};
let connecting;
let buffered;
let overflow = !1;
const connect = () => connecting || (connected.value = !1, ready.value = !1, buffered = [], overflow = !1, connecting = (async () => {
  try {
    if (!(await globalThis.__agentRequest("info")).ready) throw Error("Agent \u5C1A\u672A\u5C31\u7EEA");
    const logs = await globalThis.__agentRequest("taskLogs:list"), active = await globalThis.__agentRequest("activeEvents");
    if (overflow) throw Error("Agent \u91CD\u8FDE\u671F\u95F4\u4E8B\u4EF6\u8FC7\u591A\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5");
    taskLogs.value = logs, taskExecutionDetails.value = Object.fromEntries(logs.map((log) => [log.id, detail(log)]));
    const pending = buffered;
    buffered = void 0, lastError.value = void 0, connected.value = !0, ready.value = !0, dispatch({
      id: crypto.randomUUID(),
      type: "channel.ready",
      data: { connectedAt: (/* @__PURE__ */ new Date()).toISOString() }
    });
    for (const event of active) dispatch(event);
    for (const event of pending) dispatch(event);
  } catch (error) {
    throw connected.value = !1, ready.value = !1, lastError.value = error.message, buffered = void 0, error;
  }
})().finally(() => {
  connecting = void 0;
}), connecting);
globalThis.electronAPI.on("agent:event", (event) => {
  buffered ? buffered.length < 1e4 ? buffered.push(event) : overflow = !0 : dispatch(event);
});
connect().catch((error) => console.error(error));
const channel = {
  connected,
  lastError,
  status: computed(() => connected.value ? "connected" : "disconnected"),
  taskLogs,
  taskLogsReady: ready,
  taskExecutionReady: ready,
  taskExecutionDetails,
  taskMonitorSnapshot: ref(),
  profileMonitorSnapshot: ref(),
  executionCenterSnapshot: ref(),
  waitUntilConnected: async () => {
    if (connected.value || await connect(), !connected.value) throw Error(lastError.value || "Agent \u5C1A\u672A\u5C31\u7EEA");
  },
  subscribe: (fn) => (subscribers.add(fn), connected.value && queueMicrotask(async () => {
    subscribers.has(fn) && deliver(fn, {
      id: crypto.randomUUID(),
      type: "channel.ready",
      data: { connectedAt: (/* @__PURE__ */ new Date()).toISOString() }
    });
    try {
      await replayActive(fn);
    } catch (error) {
      lastError.value = error.message, globalThis.__localUiError?.(error.message), console.error(error);
    }
  }), () => subscribers.delete(fn)),
  send: (type, data) => {
    if (!connected.value) throw Error(lastError.value || "Agent \u5C1A\u672A\u8FDE\u63A5\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5");
    const requestId = crypto.randomUUID();
    return globalThis.__agentRequest("channel:send", { type, data, requestId }).catch((e) => {
      lastError.value = e.message, globalThis.__localUiError?.(e.message), console.error(e);
    }), requestId;
  },
  reconnect: connect
};
globalThis.__localAgentChannel = () => channel;