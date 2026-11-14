"use strict";
// Persist the high-water mark with its records, including references from old logs.
function rememberRecordIds(data, key, references = []) {
  data.recordIds ??= {};
  const saved = data.recordIds[key] ?? 0;
  if (!Number.isSafeInteger(saved) || saved < 0)
    throw Error("本地记录 ID 计数损坏: " + key);
  let maximum = saved;
  for (const value of [...(data[key] || []).map((row) => row.id), ...references]) {
    const id = Number(value);
    if (Number.isSafeInteger(id) && id > maximum) maximum = id;
  }
  data.recordIds[key] = maximum;
  return maximum;
}
function nextRecordId(data, key, references = []) {
  const maximum = rememberRecordIds(data, key, references);
  if (maximum === Number.MAX_SAFE_INTEGER) throw Error("本地记录 ID 已用尽");
  data.recordIds[key] = maximum + 1;
  return maximum + 1;
}
module.exports = { nextRecordId, rememberRecordIds };
