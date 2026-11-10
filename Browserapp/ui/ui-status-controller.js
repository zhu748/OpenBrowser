(() => {
  'use strict';

  function mergeStatusDelta(rows, delta) {
    if (!delta || !Array.isArray(delta.rows)) throw new Error('Invalid status response');
    if (delta.full === true) return delta.rows;
    if (delta.full !== false || (delta.removed != null && !Array.isArray(delta.removed))) throw new Error('Invalid status delta');
    if (!delta.rows.length && !delta.removed?.length) return rows;
    const changed = new Map(delta.rows.map((row) => [row.id, row]));
    const removed = new Set(delta.removed || []);
    const result = [];
    for (const row of rows) {
      if (!removed.has(row.id)) result.push(changed.get(row.id) || row);
      changed.delete(row.id);
    }
    for (const row of changed.values()) if (!removed.has(row.id)) result.push(row);
    return result;
  }

  /** One IPC lane, with a watermark derived from the exact in-memory rows.
   * A persisted watermark alone cannot establish what rows the UI has loaded.
   * An edit replacing those rows while IPC waits wins over the stale reply. */
  function createStatusController({ getRows, setRows, fetchDelta, fetchFull, onRows = () => {} }) {
    let pending = null;
    function refresh() {
      if (pending) return pending;
      const base = getRows();
      const watermark = base.length ? Object.fromEntries(base.map((row) => [row.id, row.statusRev ?? row.rev ?? 0])) : null;
      pending = (async () => {
        let next;
        if (typeof fetchDelta === 'function') {
          const delta = await fetchDelta(watermark);
          try { next = mergeStatusDelta(base, delta); }
          catch (_) { next = await fetchFull(); }
        } else next = await fetchFull();
        if (getRows() !== base) return false;
        setRows(next);
        onRows(next);
        return true;
      })().finally(() => { pending = null; });
      return pending;
    }
    return { refresh };
  }

  const api = { mergeStatusDelta, createStatusController };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserStatusController = api;
})();
