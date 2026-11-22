"use strict";

const crypto = require("node:crypto");
const { setTimeout: delay } = require("node:timers/promises");

function validateText(value) {
  if (typeof value !== "string" || value.length > 100000)
    throw Error("文本必须少于 100 000 字符");
  return value;
}

function textsByProcess(entries, data, engine) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw Error("无效差异文本");
  const byPid = new Map();
  let snapshotPids;
  const validPid = pid => {
    const number = Number(pid);
    return Number.isSafeInteger(number) && number > 0;
  };
  for (const { id, item } of entries) {
    let pid = item.process?.pid || item.pid || item.child?.pid;
    if (!validPid(pid)) {
      snapshotPids ??= new Map(engine.status().map(row => [row.id, row.pid]));
      pid = snapshotPids.get(id);
    }
    if (validPid(pid)) byPid.set(String(pid), id);
  }
  const texts = new Map();
  for (const [pid, value] of Object.entries(data)) {
    if (!byPid.has(pid)) throw Error("差异文本引用了未选择的进程");
    texts.set(byPid.get(pid), validateText(value));
  }
  if (!texts.size) throw Error("请输入差异文本");
  return texts;
}

function randomText({ min: rawMin, max: rawMax, decimal_place_count, data_type } = {}) {
  const min = Number(rawMin), max = Number(rawMax), decimals = Number(decimal_place_count ?? 1);
  if (![min, max].every(Number.isFinite) || min >= max || min < -1e9 || max > 1e9
    || !["int", "float"].includes(data_type) || !Number.isInteger(decimals) || decimals < 1 || decimals > 10
    || (data_type === "int" && (!Number.isInteger(min) || !Number.isInteger(max))))
    throw Error("无效随机数范围或精度");
  return data_type === "int" ? () => String(crypto.randomInt(min, max + 1))
    : () => (min + (crypto.randomBytes(6).readUIntBE(0, 6) / 2 ** 48) * (max - min)).toFixed(decimals);
}

function prepareTexts(entries, p, engine) {
  if (p.mode === "diff") return textsByProcess(entries, p.data, engine);
  if (p.mode === "random") {
    const next = randomText(p.data ?? {});
    return new Map(entries.map(({ id }) => [id, next()]));
  }
  if (p.mode !== "same") throw Error("未知批量输入模式");
  const value = validateText(p.data);
  if (!value.trim()) throw Error("请输入文本");
  return new Map(entries.map(({ id }) => [id, value]));
}

function verify(result) {
  if (!result.success)
    throw Error("批量输入失败: " + result.failures.map(row => row.id + ": " + row.message).join("; "));
  return result;
}

async function runSyncBatchText(service, entries, p) {
  const texts = prepareTexts(entries, p, service.engine);
  if (typeof p.append !== "boolean") throw Error("无效追加选项");
  const ids = entries.filter(({ id }) => texts.has(id)).map(({ id }) => id);
  const controller = service.controller;
  const previous = controller.getSettings();
  // Native edits generate master input events. Hold mirroring until all
  // destinations have been written and the controller's CDP streams drained.
  controller.updateSettings({ keyboard: false, click: false });
  try {
    const deadline = Date.now() + 12000;
    while (controller.forwardQueueRunning) {
      if (Date.now() > deadline) throw Error("同步事件队列未能完成，请重试批量输入");
      await delay(10);
    }
    if (!p.append) verify(await service.textAssignments({ ids, allowClear: true, clearAction: "clear", resolveText: () => "" }));
    const result = verify(await service.textAssignments({ ids, resolveText: id => texts.get(id) }));
    await Promise.all([...(controller.connections?.values() || [])]
      .map(({ connection }) => connection.command("Runtime.evaluate", { expression: "void 0" })));
    return result;
  } finally {
    controller.updateSettings({ keyboard: previous.keyboard, click: previous.click });
  }
}

module.exports = { runSyncBatchText };
