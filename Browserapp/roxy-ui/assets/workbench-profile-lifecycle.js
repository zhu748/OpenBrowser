const translate = (text) => typeof globalThis.$t == "function" ? globalThis.$t(text) : text;
const startMessage = (phase) => phase === "proxy" ? "\u68C0\u6D4B IP\u2026" : phase === "kernel" ? "\u68C0\u6D4B\u5185\u6838\u2026" : ["configure", "spawn", "cdp", "inject", "verify"].includes(phase) ? "\u542F\u52A8\u7A97\u53E3" : "\u542F\u52A8\u4E2D...";
function profileProgressMessage(id, lifecycle, warnings = []) {
  if (lifecycle.error) return {
    code: 1,
    message: lifecycle.message,
    data: { dirId: id, percent: 0, message: lifecycle.message, warningMessages: [] }
  };
  const uploading = lifecycle.pending && lifecycle.operation !== "start";
  return { code: 0, uploading, data: {
    dirId: id,
    percent: uploading || !lifecycle.pending ? 100 : Math.max(1, Math.min(99, lifecycle.percent || 1)),
    message: translate(uploading ? "\u540C\u6B65\u4E2D\u2026" : lifecycle.pending ? startMessage(lifecycle.phase) : "\u6253\u5F00\u6210\u529F"),
    phase: lifecycle.phase,
    detail: lifecycle.message || "",
    warningMessages: warnings
  } };
}
function createProfileLifecycleBridge({ emit, notify = () => {
} }) {
  const latest = /* @__PURE__ */ new Map(), remember = (id, value) => {
    for (latest.delete(id), latest.set(id, value); latest.size > 4096; ) latest.delete(latest.keys().next().value);
  };
  function publish(id, lifecycle, warnings = []) {
    id = String(id);
    const previous = latest.get(id), generation = Number(lifecycle.generation) || 0;
    if (generation < (previous?.generation || 0) || ["closed", "stop", "sync"].includes(previous?.kind) && generation <= previous.generation && lifecycle.operation === "start" && !lifecycle.error) return;
    const closed = !lifecycle.pending && !lifecycle.error && lifecycle.operation !== "start", message = profileProgressMessage(id, lifecycle, warnings), key = closed ? "closed" : JSON.stringify([
      message.code,
      message.uploading,
      message.data.percent,
      message.data.message,
      warnings
    ]), value = {
      generation,
      key,
      kind: closed ? "closed" : lifecycle.operation,
      pending: lifecycle.pending,
      token: lifecycle.operation === "start" ? previous?.token : null
    };
    remember(id, value), !(previous?.key === key && previous.generation === generation) && (closed || lifecycle.error && lifecycle.operation !== "start" ? (emit("browser:on-close", [id]), lifecycle.error && notify("\u5173\u95ED\u6216\u540C\u6B65\u5931\u8D25\uFF1A" + lifecycle.message)) : (emit("browser:launch-process-message", message), message.uploading && emit("browser:on-close-syncing-data", [id])));
  }
  function handle(event) {
    if (!event.id) return;
    const lifecycle = event.lifecycle || (/^profile-(start|stop|sync)-progress$/.test(event.type) ? {
      operation: event.type.split("-")[1],
      phase: event.phase,
      generation: event.lifecycleGeneration,
      pending: !event.error && !["ready", "done", "error"].includes(event.phase),
      error: !!event.error || event.phase === "error",
      percent: event.percent,
      message: event.message
    } : null);
    event.type === "status" ? lifecycle?.pending || lifecycle?.error ? publish(event.id, lifecycle) : !event.running && !latest.get(String(event.id))?.pending ? publish(event.id, { operation: "stop", phase: "done", generation: lifecycle?.generation }) : event.running && !lifecycle && !latest.has(String(event.id)) && publish(event.id, { operation: "start", phase: "ready" }) : /^profile-(start|stop|sync)-progress$/.test(event.type) && publish(event.id, lifecycle);
  }
  function beginStart(id) {
    id = String(id);
    const previous = latest.get(id);
    if (previous?.kind === "start" && previous.pending) return { id, token: previous.token };
    const token = /* @__PURE__ */ Symbol("start"), generation = previous?.generation ? previous.generation + 1 : 0;
    return remember(id, { generation, token, kind: "start", pending: !0 }), publish(id, { operation: "start", phase: "prepare", pending: !0, generation, percent: 1 }), { id, token };
  }
  function finishStart(context, result, error) {
    const state = latest.get(String(context.id));
    if (state?.token !== context.token) return;
    const existingGeneration = Number(result?.lifecycle?.generation);
    !error && result?.alreadyRunning && existingGeneration > 0 && (state.generation = existingGeneration), publish(context.id, {
      operation: "start",
      generation: state.generation,
      phase: error ? "error" : "ready",
      pending: !1,
      error: !!error,
      percent: error ? 0 : 100,
      message: error?.message || ""
    }, result?.warningMessages || []);
  }
  function messages(rows) {
    return rows.flatMap((row) => {
      const lifecycle = row.lifecycle;
      if (!row.openStatus && !lifecycle?.pending && !lifecycle?.error) return [];
      const value = profileProgressMessage(row.dirId || row.id, lifecycle || { operation: "start", phase: "ready" });
      return [{ ...value.data, code: value.code, uploading: value.uploading, errorMessage: value.message }];
    });
  }
  return { handle, beginStart, finishStart, messages };
}
export {createProfileLifecycleBridge as createProfileLifecycleBridge};