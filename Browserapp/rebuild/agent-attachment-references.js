"use strict";

const FILE_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

function collectAttachmentIds(value, result = new Set()) {
  const pending = [value];
  while (pending.length) {
    const item = pending.pop();
    if (!item || typeof item !== "object") continue;
    if (typeof item.fileId === "string" && FILE_ID.test(item.fileId)) result.add(item.fileId);
    if (Array.isArray(item.fileIds)) {
      for (const id of item.fileIds) if (typeof id === "string" && FILE_ID.test(id)) result.add(id);
    }
    for (const child of Object.values(item)) if (child && typeof child === "object") pending.push(child);
  }
  return result;
}

module.exports = { FILE_ID, collectAttachmentIds };
