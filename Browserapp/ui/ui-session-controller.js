(() => {
  'use strict';

  /** Read selection at commit time, so a slow reply cannot undo a new click. */
  function reconcileSessions(sessions, { selectedIds, initialized, preferredMasterId, syncState }) {
    const live = new Set(sessions.map((item) => item.id));
    const candidates = syncState.active ? (syncState.selected || [])
      : initialized ? selectedIds : live;
    const selected = new Set([...candidates].filter((id) => live.has(id)));
    const master = syncState.active ? syncState.master : preferredMasterId;
    return { sessions, selectedIds: selected, initialized: true,
      preferredMasterId: selected.has(master) ? master : selected.values().next().value || null };
  }

  /** One fetch at a time, plus one shared trailing request for late callers. */
  function createSessionController({ fetchSessions, getState, setState, onRows = () => {}, onError = () => {} }) {
    let active = null;
    let trailing = null;
    function refresh() {
      if (active) {
        if (!trailing) trailing = active.then(() => { trailing = null; return refresh(); });
        return trailing;
      }
      active = (async () => {
        const sessions = await fetchSessions();
        if (!Array.isArray(sessions)) throw new Error('Invalid session inventory');
        setState(reconcileSessions(sessions, getState()));
        onRows();
        return true;
      })().catch((error) => {
        try { onError(error); } catch (_) { /* observer */ }
        return false;
      }).finally(() => { active = null; });
      return active;
    }
    return { refresh };
  }

  const api = { reconcileSessions, createSessionController };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserSessionController = api;
})();
