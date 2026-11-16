function protectedConversation(state, id, { selected, isActive }) {
  return selected() === id || isActive(id) || !!state.pendingHitlByConversationId[id];
}
function evictConversationCache(state, id, options) {
  if (protectedConversation(state, id, options)) return !1;
  delete state.messagesByConversationId[id];
  const runs = /* @__PURE__ */ new Set();
  for (const [runId, run] of Object.entries(state.runsById))
    run.conversationId === id && runs.add(runId);
  for (const [runId, stream] of Object.entries(state.streamsByRunId))
    stream.conversationId === id && runs.add(runId);
  for (const runId of runs)
    delete state.streamsByRunId[runId], delete state.runsById[runId], delete state.todoProgressByRunId[runId];
  return options.onEvict(id), !0;
}
function touchConversationCache(state, id, options) {
  const { recent, maximum, isActive } = options;
  if (recent.delete(id), !(isActive(id) || state.pendingHitlByConversationId[id])) {
    recent.set(id, !0);
    for (const candidate of recent.keys()) {
      if (recent.size <= maximum) break;
      if (isActive(candidate) || state.pendingHitlByConversationId[candidate]) {
        recent.delete(candidate);
        continue;
      }
      evictConversationCache(state, candidate, options) && recent.delete(candidate);
    }
  }
}
export {touchConversationCache as touchConversationCache};