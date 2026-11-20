"use strict";

const { randomUUID } = require("node:crypto");
const { setTimeout: delay } = require("node:timers/promises");
const { parseChatIds } = require("./agent-integration-settings");

async function callTelegram(token, method, values, signal, timeout = 12000) {
  let body;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(timeout)]),
    });
    body = await response.json();
    if (!response.ok || body?.ok !== true) throw Error();
  } catch {
    signal.throwIfAborted();
    throw Error("Telegram API 请求失败");
  }
  return body.result;
}

class AgentTelegram {
  constructor(agent) {
    this.agent = agent;
    this.current = null;
  }

  status() {
    return {
      status: this.current?.status || "stopped",
      error: this.current?.error || "",
    };
  }

  async start() {
    if (this.current) return this.current.ready;
    const state = {
      status: "starting", error: "", sessions: new Map(),
      controller: new AbortController(), offset: 0,
    };
    this.current = state;
    state.ready = this.connect(state).catch(error => {
      if (this.current === state && !state.controller.signal.aborted) this.current = null;
      throw error;
    });
    return state.ready;
  }

  async connect(state) {
    const { controller: { signal } } = state;
    // An earlier settings save finishes before the bot captures its credentials.
    await this.agent.writeQueue;
    signal.throwIfAborted();
    const settings = this.agent.data.integrationSettings?.telegram;
    const token = settings?.botToken || "";
    if (!/^\d+:[A-Za-z0-9_-]{8,128}$/.test(token)) throw Error("请保存有效的 Telegram Bot Token");
    const allowed = new Set(parseChatIds(settings.allowedChatIds));
    if (!allowed.size) throw Error("请至少添加一个允许的 Telegram 聊天 ID");
    state.token = token;
    state.allowed = allowed;
    const bot = await callTelegram(token, "getMe", {}, signal);
    if (bot?.is_bot !== true) throw Error("Telegram 凭证验证失败");
    const backlog = await callTelegram(token, "getUpdates", { offset: -1, limit: 1, timeout: 0 }, signal);
    if (Number.isSafeInteger(backlog?.[0]?.update_id)) state.offset = backlog[0].update_id + 1;
    signal.throwIfAborted();
    state.status = "running";
    state.done = this.poll(state).catch(error => {
      if (!signal.aborted) {
        state.status = "error";
        state.error = error.message;
      }
    });
    return this.status();
  }

  async stop() {
    const state = this.current;
    if (state) {
      state.status = "stopping";
      state.controller.abort(Error("Telegram 已停止"));
      await state.ready.catch(() => {});
      await state.done;
      if (this.current === state) this.current = null;
    }
    return this.status();
  }

  async poll(state) {
    const { token, controller: { signal } } = state;
    while (!signal.aborted) {
      try {
        const updates = await callTelegram(token, "getUpdates", {
          offset: state.offset, timeout: 25, limit: 20, allowed_updates: ["message"],
        }, signal, 32000);
        if (!Array.isArray(updates)) throw Error("Telegram 消息响应格式无效");
        state.error = "";
        for (const update of updates) {
          if (!Number.isSafeInteger(update?.update_id) || update.update_id < state.offset) continue;
          state.offset = update.update_id + 1;
          await this.message(state, update.message);
        }
      } catch (error) {
        if (signal.aborted) return;
        state.error = error.message;
        await delay(3000, undefined, { signal }).catch(() => {});
      }
    }
  }

  async message(state, message) {
    const chatId = String(message?.chat?.id);
    const text = typeof message?.text === "string" && message.text.trim();
    if (!state.allowed.has(chatId) || message?.from?.is_bot || !text) return;
    const signal = state.controller.signal;
    const sessionKey = `${chatId}/${message.message_thread_id ?? ""}`;
    let reply;
    const command = text.split(/[\s@]+/, 1)[0];
    if (command === "/start") reply = "你好，发送文字开始对话。\n/new — 新开对话\n/clear — 清空历史\n/status — 查看状态";
    else if (command === "/new" || command === "/clear") {
      state.sessions.delete(sessionKey);
      reply = command === "/new" ? "已创建新对话。" : "已清空当前对话上下文。";
    } else if (command === "/status") {
      const target = this.agent.data.conversations.find(row => row.id === state.sessions.get(sessionKey));
      reply = `当前对话长度：${target?.messages.length || 0} 条消息`;
    } else if (command.startsWith("/")) reply = "请发送文字，或使用 /start 查看可用命令。";
    else {
      try { reply = await this.respond(state, sessionKey, text); }
      catch {
        signal.throwIfAborted();
        reply = "模型暂时无法回复。请检查 OpenBrowser 的模型设置后重试。";
      }
    }
    const cap = Array.from(reply).slice(0, 10000);
    for (let start = 0; start < cap.length; start += 1700) {
      await callTelegram(state.token, "sendMessage", {
        chat_id: chatId,
        text: cap.slice(start, start + 1700).join(""),
        ...(Number.isSafeInteger(message.message_thread_id) ? { message_thread_id: message.message_thread_id } : {}),
      }, signal);
    }
  }

  async respond(state, sessionKey, text) {
    const agent = this.agent, signal = state.controller.signal;
    let conversation = agent.data.conversations.find(row => row.id === state.sessions.get(sessionKey));
    if (!conversation) {
      conversation = await agent.request("createConversation");
      if (state.sessions.size >= 200) state.sessions.delete(state.sessions.keys().next().value);
      state.sessions.set(sessionKey, conversation.id);
    }
    signal.throwIfAborted();
    agent.start({ conversationId: conversation.id, message: text, textOnly: true }, randomUUID());
    const run = agent.active.get(conversation.id);
    const abort = () => run.abort.abort(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    try {
      await run.done;
      if (conversation.latestRunStatus !== "completed") throw Error("模型没有正常结束");
      return conversation.messages.at(-1)?.content || "（无回复）";
    } finally {
      signal.removeEventListener("abort", abort);
    }
  }
}

module.exports = { AgentTelegram };
