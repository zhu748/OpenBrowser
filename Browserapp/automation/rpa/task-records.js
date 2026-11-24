'use strict';

const crypto = require('node:crypto');
const ACTIVE_STATUSES = new Set(['pending', 'running']);
const RESULT_NOT_CONFIRMED = Object.freeze({
  state: 'unconfirmed',
  code: 'RPA_RESULT_NOT_SAVED',
  message: 'The task ran, but saving its outcome could not be confirmed. Check the outcome before starting a new run.',
});
const EXECUTION_INTERRUPTED = Object.freeze({
  code: 'RPA_EXECUTION_INTERRUPTED',
  message: 'The app stopped before the task outcome was recorded. Check the outcome before starting a new run.',
});

/** Reusing an uncertain attempt's ID must never execute its steps again. */
function taskRetryBlock(task) {
  if (task.status === 'interrupted') return EXECUTION_INTERRUPTED;
  if (task.persistence?.state === RESULT_NOT_CONFIRMED.state) return RESULT_NOT_CONFIRMED;
  return null;
}

// A non-empty override replaces the plan's profiles; an empty override uses
// the saved list. Do not accept a partial run if an entry is missing.
function resolvePlanProfileIds(plan, options = {}) {
  const ids = Array.isArray(options.profile_ids) && options.profile_ids.length
    ? options.profile_ids : plan.profile_ids;
  if (!Array.isArray(ids) || !ids.length) return [];
  const normalized = ids.map((id) => typeof id === 'string' || typeof id === 'number' ? String(id).trim() : '');
  return normalized.includes('') ? [] : normalized;
}

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

module.exports = {
  createTaskRecord, pruneTaskHistory, resolvePlanProfileIds, taskRetryBlock, RESULT_NOT_CONFIRMED, EXECUTION_INTERRUPTED,
};
