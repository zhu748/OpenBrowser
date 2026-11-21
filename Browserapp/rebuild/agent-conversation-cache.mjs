// Keep conversation metadata and unsent work independent from disposable
// message/process projections. Active and selected conversations stay pinned.
function protectedConversation(state, id, { selected, isActive }) {
  return selected() === id || isActive(id) || Boolean(state.pendingHitlByConversationId[id]);
}

export function evictConversationCache(state, id, options) {
  if (protectedConversation(state, id, options)) return false;
  delete state.messagesByConversationId[id];
  const runs = new Set();
  for (const [runId, run] of Object.entries(state.runsById))
    if (run.conversationId === id) runs.add(runId);
  for (const [runId, stream] of Object.entries(state.streamsByRunId))
    if (stream.conversationId === id) runs.add(runId);
  for (const runId of runs) {
    delete state.streamsByRunId[runId];
    delete state.runsById[runId];
    delete state.todoProgressByRunId[runId];
  }
  options.onEvict(id);
  return true;
}

export function touchConversationCache(state, id, options) {
  const { recent, maximum, isActive } = options;
  recent.delete(id);
  if (isActive(id) || state.pendingHitlByConversationId[id]) return;
  recent.set(id, true);
  for (const candidate of recent.keys()) {
    if (recent.size <= maximum) break;
    if (isActive(candidate) || state.pendingHitlByConversationId[candidate]) { recent.delete(candidate); continue; }
    if (evictConversationCache(state, candidate, options)) recent.delete(candidate);
  }
}

export function cacheConversationMessages(state, id, messages, touch) {
  state.messagesByConversationId[id] = messages;
  touch(state, id);
}
