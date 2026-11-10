'use strict';

const crypto = require('node:crypto');
const ACTIVE_STATUSES = new Set(['pending', 'running']);

/** Shared persisted schema for single and batch task creation. */
function createTaskRecord(input = {}, now = new Date().toISOString()) {
  return {
    id: String(input.id || crypto.randomUUID()),
    plan_id: input.plan_id ? String(input.plan_id) : null,
    profile_id: String(input.profile_id || ''),
    process_name: String(input.process_name || 'task').slice(0, 120),
    status: 'pending',
    steps: Array.isArray(input.steps) ? input.steps : [],
    process_content: input.process_content !== undefined ? input.process_content : null,
    variables: input.variables && typeof input.variables === 'object' && !Array.isArray(input.variables)
      ? { ...input.variables } : {},
    process_logs: [],
    process_result: null,
    create_time: now,
    start_time: null,
    complete_time: null,
    update_time: now,
  };
}

/** Newest-first history: remove oldest terminal records, preserving active work. */
function pruneTaskHistory(tasks, limit) {
  let excess = tasks.length - limit;
  if (excess <= 0) return [];
  const removed = [];
  const drop = new Set();
  for (let index = tasks.length - 1; index >= 0 && excess > 0; index -= 1) {
    if (!ACTIVE_STATUSES.has(String(tasks[index]?.status || ''))) {
      removed.push(tasks[index].id);
      drop.add(index);
      excess -= 1;
    }
  }
  // Compact once instead of shifting the tail for every removed record.
  let write = 0;
  for (let read = 0; read < tasks.length; read += 1) {
    if (!drop.has(read)) tasks[write++] = tasks[read];
  }
  tasks.length = write;
  return removed;
}

module.exports = { createTaskRecord, pruneTaskHistory };
