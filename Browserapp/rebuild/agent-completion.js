"use strict";

const crypto = require("node:crypto");
const { createContentEmitter } = require("./agent-content-emitter");
const LIMIT = 2 * 1024 * 1024;
const failure = (message, code = "LLM_INCOMPLETE_RESPONSE") => Object.assign(Error(message), { code });

function checkFinish(reason) {
  if (reason && !["stop", "tool_calls", "function_call"].includes(reason))
    throw failure("模型响应未正常完成：" + reason, "LLM_FINISH_REJECTED");
}

function validateMessage(message) {
  if (!message || typeof message !== "object") throw failure("LLM 返回中没有 message");
  if (message.content != null && typeof message.content !== "string") throw failure("LLM 正文格式无效");
  if (message.tool_calls !== undefined && !Array.isArray(message.tool_calls)) throw failure("LLM 工具列表无效");
  const calls = message.tool_calls || [];
  if (calls.length > 64) throw failure("LLM 工具调用超过 64 个");
  if (!message.content && !calls.length) throw failure("模型没有返回正文或工具调用", "LLM_EMPTY_RESPONSE");
  const ids = new Set();
  for (const call of calls) {
    if (!call || typeof call.function?.name !== "string" || !call.function.name.trim())
      throw failure("LLM 工具名称缺失");
    const args = typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments;
    if (!args || typeof args !== "object" || Array.isArray(args)) throw failure("LLM 工具参数必须为 JSON 对象");
    call.id ||= crypto.randomUUID();
    if (typeof call.id !== "string" || call.id.length > 256) throw failure("LLM 工具调用 ID 无效");
    if (ids.has(call.id)) throw failure("LLM 工具调用 ID 重复");
    ids.add(call.id);
  }
  return message;
}

function providerMessages(messages, ollama) {
  if (!ollama) return messages;
  const names = new Map(messages.flatMap(message => (message.tool_calls || []).map(call => [call.id, call.function.name])));
  return messages.map(message => {
    if (message.tool_calls) return { ...message, tool_calls: message.tool_calls.map(call => ({ function: {
      name: call.function.name,
      arguments: typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments,
    } })) };
    if (message.role === "tool") return { role: "tool", content: message.content, tool_name: names.get(message.tool_call_id) };
    return message;
  });
}

function streamState(run, ollama, output) {
  const state = { content: "", calls: [], done: false, finish: null };
  state.consume = data => {
    if (state.done) return;
    if (data.trim() === "[DONE]" && !ollama) { state.done = true; return; }
    const body = JSON.parse(data);
    if (body.error) throw Error(typeof body.error === "string" ? body.error : body.error.message);
    const choice = body.choices?.[0];
    checkFinish(ollama ? body.done_reason : choice?.finish_reason);
    state.finish ||= ollama ? (body.done ? "stop" : null) : choice?.finish_reason;
    const delta = ollama ? body.message : choice?.delta;
    if (delta?.refusal) throw failure("模型拒绝了此请求", "LLM_REFUSAL");
    if (delta?.content) {
      if (typeof delta.content !== "string") throw failure("LLM 正文格式无效");
      state.content += delta.content;
      output.push(delta.content);
    }
    for (const item of delta?.tool_calls || []) {
      const index = item.index ?? state.calls.length;
      if (!Number.isInteger(index) || index < 0 || index >= 64) throw failure("LLM 工具调用索引无效或超过 64 个");
      const target = state.calls[index] ||= { id: item.id || crypto.randomUUID(), type: "function", function: { name: "", arguments: "" } };
      if (item.id) target.id = item.id;
      if (item.function?.name) target.function.name += item.function.name;
      if (item.function?.arguments != null) target.function.arguments = typeof item.function.arguments === "object"
        ? JSON.stringify(item.function.arguments) : target.function.arguments + item.function.arguments;
    }
    if (ollama && body.done === true) state.done = true;
  };
  return state;
}

async function readStream(res, service, run, ollama) {
  const output = createContentEmitter(text => {
    // Snapshots must describe exactly the published sequence. Including queued
    // text here would make its later delta appear twice in an opened log.
    run.partialAnswer = (run.partialAnswer || "") + text;
    service.event(run, "content_delta", { contentId: run.assistantId, text });
  },
    error => run.abort.abort(error));
  try { return await consumeStream(res, run, ollama, output); }
  finally { output.close(); }
}

async function consumeStream(res, run, ollama, output) {
  const state = streamState(run, ollama, output), decoder = new TextDecoder();
  let buffer = "", received = 0, eventData = [];
  const dispatch = () => {
    if (eventData.length) state.consume(eventData.join("\n"));
    eventData = [];
  };
  const line = raw => {
    const text = raw.replace(/\r$/, "");
    if (ollama) { if (text.trim()) state.consume(text); return; }
    if (text === "") dispatch();
    else if (text.startsWith("data:")) eventData.push(text.slice(5).replace(/^ /, ""));
  };
  for await (const chunk of res.body) {
    run.abort.signal.throwIfAborted();
    received += chunk.byteLength;
    if (received > LIMIT) throw failure("LLM 单轮响应超过 2 MiB 上限");
    buffer += decoder.decode(chunk, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf("\n")) !== -1) {
      line(buffer.slice(0, boundary)); buffer = buffer.slice(boundary + 1);
    }
    if (state.done) break;
  }
  buffer += decoder.decode();
  if (buffer) line(buffer);
  dispatch();
  run.abort.signal.throwIfAborted();
  if (!state.done && !state.finish) throw failure("模型响应提前结束，未收到完成标记；已保留部分内容");
  const message = validateMessage({ content: state.content, tool_calls: state.calls.filter(Boolean), streamed: true });
  if (state.finish === "tool_calls" && !message.tool_calls.length) throw failure("模型完成状态缺少工具调用");
  return message;
}

async function readText(res) {
  let total = 0;
  const chunks = [];
  for await (const chunk of res.body) {
    total += chunk.byteLength;
    if (total > LIMIT) throw failure("LLM 单轮响应超过 2 MiB 上限");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function completion(service, config, messages, run, tools) {
  run.abort.signal.throwIfAborted();
  messages = await service.files.context(messages, config.provider);
  const ollama = config.provider === "ollama", base = config.baseUrl.replace(/\/$/, "");
  const url = ollama ? base.replace(/\/api$/, "") + "/api/chat" : base.replace(/\/chat\/completions$/, "") + "/chat/completions";
  const definitions = run.textOnly ? [] : [...tools, ...await service.mcp.definitions(run)];
  run.abort.signal.throwIfAborted();
  const res = await fetch(url, {
    method: "POST", redirect: "error",
    headers: { "Content-Type": "application/json", ...(config.apiKey ? { Authorization: "Bearer " + config.apiKey } : {}) },
    body: JSON.stringify({ model: config.model, messages: providerMessages(messages, ollama), tools: definitions, stream: true,
      ...(ollama ? (run.requestOptions && { options: {
        temperature: run.requestOptions.temperature, num_predict: run.requestOptions.maxTokens,
      } }) : {
        temperature: run.requestOptions?.temperature, max_tokens: run.requestOptions?.maxTokens,
      }),
    }),
    signal: AbortSignal.any([run.abort.signal, AbortSignal.timeout(120000)]),
  });
  if (!res.ok) throw Error("LLM HTTP " + res.status + ": " + (await readText(res)).slice(0, 400));
  const type = (res.headers.get("content-type") || "").toLowerCase();
  if (type.includes("application/json") && !type.includes("ndjson")) {
    const body = JSON.parse(await readText(res));
    run.abort.signal.throwIfAborted();
    checkFinish(ollama ? body.done_reason : body.choices?.[0]?.finish_reason);
    if (ollama && body.done !== true) throw failure("Ollama 响应缺少完成标记");
    return validateMessage(ollama ? body.message : body.choices?.[0]?.message);
  }
  if (!type.includes(ollama ? "ndjson" : "text/event-stream")) {
    await res.body?.cancel();
    throw failure("不支持的 LLM 响应类型");
  }
  return readStream(res, service, run, ollama);
}

module.exports = { completion };
