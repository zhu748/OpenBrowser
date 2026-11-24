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
      info.running, info.port || '', info.cdpError || '', info.verificationBlocked || false, info.launchStatus || null,
      info.assignedExtensions?.length ?? 0, starting ? [starting.phase, starting.percent, starting.message] : null,
      info.network?.ip || '', info.network?.countryCode || '', info.network?.checkedAt || '',
      view, locale, number, light, remaining,
    ]);
  }

  function profileLaunchDetails(info, translate = text => text) {
    const status = info.launchStatus;
    const blocked = status?.configurationState === 'blocked' || info.verificationBlocked === true;
    const summary = translate(blocked ? '窗口已打开，配置验证受阻' : '窗口已打开，配置未完整验证');
    const revision = status?.capturedRevision;
    const saved = status?.savedRevision;
    const detail = [
      summary,
      info.alreadyRunning ? translate('已复用原窗口，未重新启动。') : '',
      revision ? translate('启动时记录的保存版本：{revision}').replace('{revision}', revision) : translate('启动时的配置版本未知'),
      saved && saved !== revision ? translate('当前保存版本：{revision}').replace('{revision}', saved) : '',
      status?.savedRelation === 'differs' ? translate('当前保存配置与启动记录不同。若要按新配置启动，请先关闭窗口。') : '',
      ...(status?.warningMessages || []),
    ].filter(Boolean).join('\n');
    return { summary, detail };
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

  const api = { profileRenderKey, profileLaunchDetails, reconcileProfileRows };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserProfileRows = api;
})();
