"use strict";

const CHUNK_SIZE = 16;
const INLINE_MESSAGES = 32;
const INLINE_BYTES = 512 * 1024;

function shouldChunk(messages, previous, text) {
  return Array.isArray(messages) && (previous || messages.length > INLINE_MESSAGES || Buffer.byteLength(text) > INLINE_BYTES);
}

function prepareMessageChunks(messages, previous = [], firstDirty = 0, makeRecord) {
  const chunks = [];
  for (let start = 0; start < messages.length; start += CHUNK_SIZE) {
    const old = previous[chunks.length];
    if (old && old.ids.length === CHUNK_SIZE && start + CHUNK_SIZE <= firstDirty) {
      chunks.push(old);
      continue;
    }
    const rows = messages.slice(start, start + CHUNK_SIZE);
    const reference = makeRecord({ messages: rows }, old);
    chunks.push({ ...reference, ids: rows.map(row => typeof row?.id === "string" ? row.id : null) });
  }
  return chunks;
}

async function pageChunks(chunks, cursor, limit, read) {
  let end = 0;
  for (const chunk of chunks) {
    const position = cursor == null ? -1 : chunk.ids.indexOf(cursor);
    if (position >= 0) { end += position; break; }
    end += chunk.ids.length;
  }
  const total = chunks.reduce((count, chunk) => count + chunk.ids.length, 0);
  if (cursor != null && end === total) throw Error("历史游标不存在或不属于当前会话");
  const start = Math.max(0, end - limit);
  const selected = [];
  let offset = 0;
  for (const chunk of chunks) {
    const next = offset + chunk.ids.length;
    if (offset < end && next > start) {
      const from = Math.max(0, start - offset), to = Math.min(chunk.ids.length, end - offset);
      selected.push(read(chunk).then(value => value.messages.slice(from, to)));
    }
    offset = next;
  }
  return { messages: (await Promise.all(selected)).flat(), hasMore: start > 0 };
}

module.exports = { CHUNK_SIZE, shouldChunk, prepareMessageChunks, pageChunks };
