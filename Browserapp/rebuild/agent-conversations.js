"use strict";
const crypto = require("node:crypto");
const now = () => new Date().toISOString();
function metadata(conversation) {
  const { messages: _messages, ...value } = conversation;
  return value.latestRunStatus === "interrupted" ? { ...value, latestRunStatus: "cancelled", interrupted: true } : value;
}
function pageSize(value, fallback = 40, maximum = 200) {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw Error("历史分页数量无效");
  return value;
}
function messageDto(message) {
  return { ...message, ...(message.attachments?.length ? {
    metadata: { ...message.metadata, attachments: message.attachments },
  } : {}) };
}
async function requestConversations(service, method, p) {
  if (method === "createConversation") {
    const c = { id: crypto.randomUUID(), title: "New conversation", createdAt: now(), updatedAt: now(), messages: [], unread: false };
    await service.save({
      snapshot: () => ({ ...service.data, conversations: [c, ...service.data.conversations] }),
      commit: () => service.data.conversations.unshift(c),
    });
    return c;
  }
  if (method === "conversationList") {
    const limit = pageSize(p.limit, 20, 10000), offset = p.offset ?? 0;
    if (!Number.isSafeInteger(offset) || offset < 0) throw Error("会话列表偏移无效");
    return [...service.data.conversations].sort((a, b) =>
      String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)) || b.id.localeCompare(a.id))
      .slice(offset, offset + limit).map(metadata);
  }
  const c = service.conversation(p.id);
  if (method === "conversationDetail") {
    const limit = pageSize(p.limit);
    let end = c.messages.length;
    if (p.cursor != null) {
      if (typeof p.cursor !== "string" || !p.cursor) throw Error("历史游标无效");
      end = c.messages.findIndex(message => message.id === p.cursor);
      if (end < 0) throw Error("历史游标不存在或不属于当前会话");
    }
    const start = Math.max(0, end - limit), messages = c.messages.slice(start, end).map(messageDto);
    return { conversation: metadata(c), messages, hasMore: start > 0, nextCursor: start > 0 ? messages[0].id : null };
  }
  if (method === "updateConversation") {
    if (typeof p.title !== "string" || !p.title.trim() || p.title.trim().length > 200) throw Error("会话名称应为 1–200 个字符");
    const title = p.title.trim();
    let updatedAt;
    await service.save({
      snapshot: () => {
        service.conversation(p.id); updatedAt = now();
        return { ...service.data, conversations: service.data.conversations.map(row => row.id === p.id ? { ...row, title, updatedAt } : row) };
      },
      commit: () => { c.title = title; c.updatedAt = c.updatedAt > updatedAt ? c.updatedAt : updatedAt; },
    });
    return metadata(c);
  }
  if (method === "markConversationRead") {
    if (p.runId !== undefined && typeof p.runId !== "string") throw Error("已读轮次无效");
    let seenRunId;
    await service.save({
      snapshot: () => {
        const current = service.conversation(p.id); seenRunId = p.runId ?? current.latestRunId;
        return { ...service.data, conversations: service.data.conversations.map(row =>
          row.id === p.id && row.latestRunId === seenRunId ? { ...row, unread: false } : row) };
      },
      commit: () => { if (c.latestRunId === seenRunId) c.unread = false; },
    });
    return metadata(c);
  }
  if (method === "deleteConversation") {
    service.deletingConversations ??= new Set();
    if (service.active.has(p.id)) throw Error("请先停止任务");
    if (service.deletingConversations.has(p.id)) throw Error("会话正在删除");
    service.deletingConversations.add(p.id);
    try {
      await service.save({
        snapshot: () => {
          service.conversation(p.id);
          return { ...service.data, conversations: service.data.conversations.filter(row => row.id !== p.id) };
        },
        commit: () => { service.data.conversations = service.data.conversations.filter(row => row.id !== p.id); },
      });
      return true;
    } finally { service.deletingConversations.delete(p.id); }
  }
  throw Error("不支持的会话操作: " + method);
}
module.exports = { requestConversations };
