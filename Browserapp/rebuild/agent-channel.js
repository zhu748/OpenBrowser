import {
  St as ref,
  d as computed,
} from "./runtime-core.esm-bundler-CBj16o9G.js";
import { createTaskHistory } from "./agent-task-history.js";
const connected = ref(false),
  lastError = ref(),
  taskLogs = ref([]),
  ready = ref(false),
  loadingDetail = ref(false),
  subscribers = new Set(),
  taskExecutionDetails = ref({});
const detail = (log) => ({
  taskLogId: log.id,
  revision: log.events?.length || 0,
  conversationId: log.conversationId,
  messages: log.messages || [],
  artifacts: [],
  scriptWindows: [],
});
const history = createTaskHistory({
  read: id => globalThis.__agentRequest("logs:detail", { id }),
  exists: id => taskLogs.value.some(log => log.id === id),
  publish: (id, value) => {
    if ((taskExecutionDetails.value[id]?.revision || 0) > value.revision) return;
    taskExecutionDetails.value = { ...taskExecutionDetails.value, [id]: value };
  },
  drop: id => { const next = { ...taskExecutionDetails.value }; delete next[id]; taskExecutionDetails.value = next; },
  busy: value => { loadingDetail.value = value; },
  onError: error => { lastError.value = error.message; globalThis.__localUiError?.(error.message); console.error(error); },
});
const delivered = new WeakMap();
const deliver = (fn, event) => {
  let seen = delivered.get(fn);
  if (!seen) { seen = new Set(); delivered.set(fn, seen); }
  const key = event.type === "conversation.run.event"
    ? `${event.data.runId}:${event.data.conversationId}:${event.data.assistantMessageId}:${event.data.sequence}`
    : event.id;
  if (seen.has(key)) return;
  seen.add(key);
  if (seen.size > 10000) seen.delete(seen.values().next().value);
  fn(event);
};
const dispatch = (event) => {
  if (event.type === "task_log.changed") {
    taskLogs.value = [
      event.data,
      ...taskLogs.value.filter((log) => log.id !== event.data.id),
    ];
    history.refresh(event.data.id);
  }
  if (event.type === "task_log.deleted") {
    history.remove(event.data.logId);
    taskLogs.value = taskLogs.value.filter(
      (log) => log.id !== event.data.logId,
    );
    const next = { ...taskExecutionDetails.value };
    delete next[event.data.logId];
    taskExecutionDetails.value = next;
  }
  if (event.type === "conversation.run.event") {
    const e = event.data,
      log = taskLogs.value.find(
        (log) => log.id === e.runId && log.conversationId === e.conversationId,
      );
    // An in-flight snapshot owns this detail until it is published. Remember
    // intervening changes for one trailing read instead of appending a tail
    // that could hide the snapshot's earlier text behind a newer revision.
    if (log && history.isLoading(log.id)) history.refresh(log.id);
    if (log && history.has(log.id) && !history.isLoading(log.id) &&
        e.sequence > (taskExecutionDetails.value[log.id]?.revision || 0)) {
      const previous = taskExecutionDetails.value[log.id] || detail(log),
        messages = [...previous.messages];
      if (e.event.type === "user_message") {
        const index = messages.findIndex(message => message.id === e.event.data.messageId);
        const user = {
          ...(index < 0 ? {} : messages[index]),
          id: e.event.data.messageId,
          role: "user",
          content: e.event.data.content,
          createdAt: e.event.data.createdAt || new Date(e.timestamp).toISOString(),
          metadata: { ...(index < 0 ? {} : messages[index].metadata), attachments: e.event.data.attachments || [] },
        };
        if (index < 0) messages.push(user); else messages[index] = user;
      }
      if (e.event.type === "content_delta") {
        let assistant = messages.find((m) => m.id === e.assistantMessageId);
        if (assistant) {
          assistant = {
            ...assistant,
            content: assistant.content + e.event.data.text,
          };
          messages[messages.findIndex((m) => m.id === assistant.id)] =
            assistant;
        } else
          messages.push({
            id: e.assistantMessageId,
            role: "assistant",
            content: e.event.data.text,
            createdAt: new Date(e.timestamp).toISOString(),
          });
      }
      taskExecutionDetails.value = {
        ...taskExecutionDetails.value,
        [log.id]: { ...previous, revision: e.sequence, messages },
      };
    }
  }
  for (const fn of subscribers) deliver(fn, event);
};
const replayActive = async (target) => {
  if (target && !subscribers.has(target) || !target && !subscribers.size) return;
  const events = await globalThis.__agentRequest('activeEvents');
  for (const event of events) {
    if (target) { if (subscribers.has(target)) deliver(target, event); }
    else dispatch(event);
  }
};
let connecting, buffered, overflow = false;
const connect = () => {
  if (connecting) return connecting;
  connected.value = false;
  ready.value = false;
  buffered = [];
  overflow = false;
  const operation = (async () => {
    try {
      const info = await globalThis.__agentRequest("info");
      if (!info.ready) throw Error("Agent 尚未就绪");
      const logs = await globalThis.__agentRequest("taskLogs:summary");
      const active = await globalThis.__agentRequest("activeEvents");
      if (overflow) throw Error("Agent 重连期间事件过多，请重新连接");
      taskLogs.value = logs;
      history.reset();
      taskExecutionDetails.value = {};
      const pending = buffered;
      buffered = undefined;
      lastError.value = undefined;
      connected.value = true;
      ready.value = true;
      dispatch({ id: crypto.randomUUID(), type: "channel.ready",
        data: { connectedAt: new Date().toISOString() } });
      for (const event of active) dispatch(event);
      for (const event of pending) dispatch(event);
      history.reconnect();
    } catch (error) {
      connected.value = false;
      ready.value = false;
      lastError.value = error.message;
      buffered = undefined;
      throw error;
    }
  })();
  connecting = operation.finally(() => { connecting = undefined; });
  return connecting;
};
globalThis.electronAPI.on("agent:event", event => {
  if (buffered) {
    if (buffered.length < 10000) buffered.push(event);
    else overflow = true;
  } else dispatch(event);
});
void connect().catch(error => console.error(error));
const channel = {
  connected,
  lastError,
  status: computed(() => (connected.value ? "connected" : "disconnected")),
  taskLogs,
  taskLogsReady: ready,
  taskExecutionReady: computed(() => ready.value && !loadingDetail.value),
  taskExecutionDetails,
  loadTaskExecution: id => history.select(id),
  clearTaskExecution: () => history.clearSelection(),
  taskMonitorSnapshot: ref(),
  profileMonitorSnapshot: ref(),
  executionCenterSnapshot: ref(),
  waitUntilConnected: async () => {
    if (!connected.value) await connect();
    if (!connected.value) throw Error(lastError.value || "Agent 尚未就绪");
  },
  subscribe: (fn) => {
    subscribers.add(fn);
    if (connected.value)
      queueMicrotask(async () => {
        if (subscribers.has(fn))
          deliver(fn, {
            id: crypto.randomUUID(),
            type: "channel.ready",
            data: { connectedAt: new Date().toISOString() },
          });
        try { await replayActive(fn); }
        catch (error) { lastError.value=error.message;globalThis.__localUiError?.(error.message);console.error(error); }
      });
    return () => subscribers.delete(fn);
  },
  send: (type, data) => {
    if (!connected.value) throw Error(lastError.value || "Agent 尚未连接，请重新连接");
    const requestId = crypto.randomUUID();
    globalThis
      .__agentRequest("channel:send", { type, data, requestId })
      .catch((e) => {
        lastError.value = e.message;
        globalThis.__localUiError?.(e.message);
        console.error(e);
      });
    return requestId;
  },
  reconnect: connect,
};
globalThis.__localAgentChannel = () => channel;
