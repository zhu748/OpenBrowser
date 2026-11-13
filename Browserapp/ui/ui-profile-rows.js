(() => {
  'use strict';

  /** Explicit display dependencies, including values which change without updatedAt. */
  function profileRenderKey({ profile, info = {}, starting = null, group = null,
    view = '', locale = '', number = '', light = false, remaining = '' }) {
    return JSON.stringify([
      profile.updatedAt || '', profile.createdAt || '', profile.name || '', profile.title || '', profile.groupId || '',
      profile.note || '', profile.tag || '', profile.favorite ? 1 : 0, profile.lastOpenedAt || '',
      profile.platform?.startUrl || '', profile.platform?.type || '',
      group ? [group.name, group.color] : null,
      profile.browser || '', profile.engine || '', profile.proxy || '', profile.exitIp || '', profile.exitCountryCode || '',
      profile.os || '', profile.osVersion || '', profile.networkMode || '',
      info.running, info.port || '', info.cdpError || '', info.verificationBlocked || false,
      info.assignedExtensions?.length ?? 0, starting ? [starting.phase, starting.percent, starting.message] : null,
      info.network?.ip || '', info.network?.countryCode || '', info.network?.checkedAt || '',
      view, locale, number, light, remaining,
    ]);
  }

  /** Reconcile one visible page, retaining rows already at the next position. */
  function reconcileProfileRows({ table, profiles, renderKeyFor, buildRow, selectedIds }) {
    const existingRows = new Map([...table.querySelectorAll('tr[data-profile-id]')]
      .map((row) => [row.dataset.profileId, row]));
    const seen = new Set();
    let cursor = table.firstChild;
    for (const profile of profiles) {
      if (seen.has(profile.id)) continue;
      seen.add(profile.id);
      const key = renderKeyFor(profile);
      let row = existingRows.get(profile.id);
      if (row && row.dataset.renderKey === key) {
        const checkbox = row.querySelector('[data-profile-select]');
        if (checkbox) checkbox.checked = selectedIds.has(profile.id);
      } else {
        if (row) {
          if (row === cursor) cursor = row.nextSibling;
          row.remove();
        }
        row = buildRow(profile);
        row.dataset.renderKey = key;
        row.dataset.i18nPending = '1';
      }
      if (row !== cursor) table.insertBefore(row, cursor);
      cursor = row.nextSibling;
    }
    for (const [id, row] of existingRows) if (!seen.has(id)) row.remove();
  }

  const api = { profileRenderKey, reconcileProfileRows };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserProfileRows = api;
})();
