(() => {
  'use strict';

  const numberCollator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

  function specifiedTextItems(value) {
    return String(value || '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  function distributeSpecifiedTexts(items, count, mode = 'sequence', cursor = 0, random = Math.random) {
    const values = Array.isArray(items) ? items.map((item) => String(item)).filter((item) => item.length > 0) : [];
    const amount = Math.max(0, Number.parseInt(count, 10) || 0);
    if (!values.length || !amount) return { texts: [], nextCursor: Math.max(0, Number.parseInt(cursor, 10) || 0) };
    if (mode === 'random') {
      return {
        texts: Array.from({ length: amount }, () => values[Math.min(values.length - 1, Math.max(0, Math.floor(Number(random()) * values.length)))]),
        nextCursor: Math.max(0, Number.parseInt(cursor, 10) || 0),
      };
    }
    const start = ((Number.parseInt(cursor, 10) || 0) % values.length + values.length) % values.length;
    return { texts: Array.from({ length: amount }, (_unused, index) => values[(start + index) % values.length]), nextCursor: (start + amount) % values.length };
  }

  /** Resolve labels once per selected session, never inside the sort comparator. */
  function orderedSessionIds(ids, sessions, displayProfileNumber) {
    const byId = new Map(sessions.map((session) => [session.id, session]));
    return ids.map((id) => ({ id, number: String(displayProfileNumber(byId.get(id)?.profile || { id })) }))
      .sort((left, right) => numberCollator.compare(left.number, right.number)
        || String(left.id).localeCompare(String(right.id)))
      .map((entry) => entry.id);
  }

  const api = { specifiedTextItems, distributeSpecifiedTexts, orderedSessionIds };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserSyncText = api;
})();
