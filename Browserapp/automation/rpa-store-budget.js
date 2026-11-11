'use strict';

const ACTIVE = new Set(['pending', 'running']);

function taskSize(task) {
  return Buffer.byteLength(JSON.stringify(task) || 'null', 'utf8');
}

/**
 * Keep newest/active tasks and shed old history, then logs, then results.
 * Returns the compact JSON serialization of the data when the store fit
 * unchanged (the common case), so the caller reuses it for the write and
 * pays only one stringify per save. After shedding, returns null: the
 * caller serializes once itself — the eviction stage must not re-serialize
 * the surviving tasks (kept linear by the budget selftest).
 */
function enforceStoreBudget(data, limitBytes) {
  let total;
  let serialized;
  try { serialized = JSON.stringify(data); total = Buffer.byteLength(serialized, 'utf8'); }
  catch { return null; }
  if (total <= limitBytes) return serialized;

  const records = data.tasks.map((task) => ({ task, bytes: taskSize(task), keep: true }));
  let taskBytes = records.reduce((sum, item) => sum + item.bytes, 0);
  let count = records.length;
  // Account for commas separately so removing a task updates the exact compact
  // JSON byte count without serializing all surviving tasks again.
  const overhead = total - taskBytes - Math.max(0, count - 1);
  const fits = () => overhead + taskBytes + Math.max(0, count - 1) <= limitBytes;
  for (let i = records.length - 1; i >= 1 && !fits(); i -= 1) {
    const item = records[i];
    if (ACTIVE.has(String(item.task?.status || ''))) continue;
    item.keep = false;
    taskBytes -= item.bytes;
    count -= 1;
  }
  if (count !== records.length) data.tasks = records.filter((item) => item.keep).map((item) => item.task);
  if (fits()) return null;

  const updateSize = (item) => {
    const bytes = taskSize(item.task);
    taskBytes += bytes - item.bytes;
    item.bytes = bytes;
  };
  for (let i = records.length - 1; i >= 0 && !fits(); i -= 1) {
    const item = records[i];
    if (!item.keep) continue;
    if (Array.isArray(item.task.process_logs) && item.task.process_logs.length) {
      item.task.process_logs = [];
      updateSize(item);
    }
  }
  for (let i = records.length - 1; i >= 0 && !fits(); i -= 1) {
    const item = records[i];
    if (!item.keep) continue;
    if (item.task.process_result && typeof item.task.process_result === 'object') {
      delete item.task.process_result.variables;
      delete item.task.process_result.exports;
      item.task.process_result.__shed = 'result payload dropped to keep rpa-store.json under the size limit';
      updateSize(item);
    }
  }
  return null;
}

module.exports = { enforceStoreBudget };
