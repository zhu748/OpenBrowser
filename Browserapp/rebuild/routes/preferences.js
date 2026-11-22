"use strict";

const { randomUUID: uid } = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

async function activityAppend(service, p) {
  const action = p?.action;
  if (typeof action !== "string" || !/^[a-zA-Z][a-zA-Z0-9:_-]{0,80}$/.test(action))
    throw Error("Invalid action name");
  service.data.activity ??= [];
  service.data.activity.push({
    action,
    at: new Date().toISOString(),
  });
  service.data.activity = service.data.activity.slice(-500);
  service.data.notifications ??= [];
  service.data.notifications.push({
    id: uid(),
    title: "本地操作记录",
    message: action,
    at: new Date().toISOString(),
    read: false,
  });
  service.data.notifications = service.data.notifications.slice(-100);
  await service.save();
  return true;
}

async function settingsGet(service) {
  return structuredClone(service.data.settings);
}

async function settingsSet(service, p) {
  if (!object(p)) throw Error("Invalid settings");
  const current = service.data.settings;
  const next = { ...current, ...p };
  // Identical saves from multiple windows do not need another whole-store write.
  if (isDeepStrictEqual(current, next)) return true;
  service.data.settings = next;
  await service.save();
  return true;
}

async function notificationsList(service) {
  return structuredClone(service.data.notifications || []).reverse();
}

async function notificationsAppend(service, p) {
  if (
    typeof p.title !== "string" ||
    typeof p.message !== "string" ||
    p.title.length > 200 ||
    p.message.length > 2000
  )
    throw Error("通知内容无效");
  service.data.notifications ??= [];
  service.data.notifications.push({
    id: uid(),
    title: p.title,
    message: p.message,
    at: new Date().toISOString(),
    read: false,
  });
  service.data.notifications = service.data.notifications.slice(-100);
  await service.save();
  return true;
}

async function notificationsRead(service, p) {
  if (
    p.ids !== undefined &&
    (!Array.isArray(p.ids) || p.ids.some((id) => typeof id !== "string"))
  )
    throw Error("无效通知 ID");
  const ids = p.ids === undefined ? null : new Set(p.ids);
  let changed = false;
  for (const notice of service.data.notifications || []) {
    if (notice.read === true || (ids && !ids.has(notice.id))) continue;
    notice.read = true;
    changed = true;
  }
  if (changed) await service.save();
  return true;
}

module.exports = [
  ["activity:append", activityAppend, "serial"],
  ["settings:get", settingsGet, "read"],
  ["settings:set", settingsSet, "serial"],
  ["notifications:list", notificationsList, "read"],
  ["notifications:append", notificationsAppend, "serial"],
  ["notifications:read", notificationsRead, "serial"],
];
