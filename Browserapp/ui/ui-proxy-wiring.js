// Proxy-domain load-time event wiring (classic script, no build step).
// Loaded AFTER renderer.js (before ui-dialogs.js): these statements execute
// during script evaluation and need renderer.js's $/document and its globals
// to already exist. The proxy functions they bind live in ui/ui-proxy.js and
// ui/ui-editor.js (loaded even earlier), so the bare-global references here
// resolve at evaluation time.
//
// Create-dialog template wiring (profile-create-template / batch-add-template)
// and the network-mode installer calls intentionally stay in renderer.js —
// they own startUrl/platform preferences beyond the proxy domain.

document.addEventListener('click', async (event) => {
  const nav = event.target.closest('[data-view="rpa"][data-rpa-tab]');
  if (!nav) return;
  // switchView will be called by existing nav handler; stash tab
  currentRpaTab = nav.dataset.rpaTab || 'flows';
}, true);

installProxyTypeControl('#batch-add-proxies', 'batch-add-proxy-type');

installProxyTypeControl('#batch-proxy-list', 'batch-update-proxy-type');

$('#create-proxy-library')?.addEventListener('change', (event) => {
  const id = String(event.target.value || '').trim();
  if (id) applyProxyLibrarySelection('create', id);
});

$('#editor-proxy-library')?.addEventListener('change', (event) => {
  const id = String(event.target.value || '').trim();
  if (id) applyProxyLibrarySelection('editor', id);
  else {
    const status = $('#editor-proxy-library-status');
    if (status) status.textContent = tx('未关联代理库节点');
  }
});

$('#batch-add-proxy-library')?.addEventListener('change', (event) => {
  const id = String(event.target.value || '').trim();
  const item = proxyLibraryItem(id);
  const textarea = $('#batch-add-proxies');
  // parseProxyInputForUi throws on a malformed raw entry (a corrupt library
  // row used to kill this listener outright); a toast matches how the
  // openProxyDialog path reports the same failure.
  if (item && textarea) {
    try {
      textarea.value = parseProxyInputForUi(item, item.protocol || 'socks5')?.raw || item.raw || `${item.host}:${item.port}`;
    } catch (error) {
      textarea.value = item.raw || `${item.host}:${item.port}`;
      toast(tx('代理格式错误：') + error.message);
    }
  }
});

document.addEventListener('click', async (event) => {
  const cancelButton = event.target.closest('dialog button[value="cancel"]');
  if (cancelButton) {
    const dialog = cancelButton.closest('dialog');
    if (dialog?.open) {
      event.preventDefault();
      dialog.close('cancel');
      return;
    }
  }
  const selectOption = event.target.closest('.themed-select-option');
  if (selectOption && openSelectMenu) {
    const { select } = openSelectMenu;
    select.selectedIndex = Number(selectOption.dataset.optionIndex);
    select.dispatchEvent(new Event('change', { bubbles: true }));
    syncThemedSelect(select);
    closeSelectMenu({ restoreFocus: true });
    return;
  }
  if (!event.target.closest('.themed-select-menu, .themed-select')) closeSelectMenu();
  const nav = event.target.closest('[data-view]'); if (nav) switchView(nav.dataset.view);
  const action = event.target.closest('[data-action]');
  if (action?.dataset.action === 'start') startProfile(action.dataset.id);
  if (action?.dataset.action === 'stop') stopProfile(action.dataset.id);
  if (action?.dataset.action === 'edit') openProfileEditor(action.dataset.id);
  if (action?.dataset.action === 'clone') cloneProfile(action.dataset.id);
  if (action?.dataset.action === 'restore') restoreProfile(action.dataset.id);
  if (action?.dataset.action === 'purge') purgeProfile(action.dataset.id);
  if (action?.dataset.action === 'select-sync') { selectedSessions.add(action.dataset.id); pushSyncSelection(); switchView('sync'); }
  // Roxy 对齐：行「其他」菜单与收藏/复制窗口ID/导出窗口
  if (action?.dataset.action === 'more') toggleRowMoreMenu(action);
  if (action?.dataset.action === 'fav') { toggleProfileFavorite(action.dataset.id); closeRowMoreMenu(); }
  if (action?.dataset.action === 'copy-id') { navigator.clipboard.writeText(action.dataset.id).then(() => toast(tx('复制成功'))).catch(() => {}); closeRowMoreMenu(); }
  if (action?.dataset.action === 'export-profile') { exportProfile(action.dataset.id); }
  if (action?.dataset.action === 'note') { closeRowMoreMenu(); if (await openProfileEditor(action.dataset.id)) document.getElementById('editor-note')?.focus(); }
  // Roxy 对齐：查看窗口 / 重启 / 行级测代理 / 快捷标签 / 清除缓存 / 删除入回收站
  if (action?.dataset.action === 'view') { closeRowMoreMenu(); if (await openProfileEditor(action.dataset.id)) makeEditorReadonly(); }
  if (action?.dataset.action === 'restart') { closeRowMoreMenu(); restartProfile(action.dataset.id); }
  if (action?.dataset.action === 'check-proxy') { closeRowMoreMenu(); checkProfileProxy(action.dataset.id); }
  if (action?.dataset.action === 'tag') { openBatchQuickDialog('tag', action.dataset.id); }
  if (action?.dataset.action === 'clear-cache') { closeRowMoreMenu(); clearProfileCache(action.dataset.id); }
  if (action?.dataset.action === 'trash') { closeRowMoreMenu(); trashProfile(action.dataset.id); }
  if (!action && !event.target.closest('.row-more-wrap')) closeRowMoreMenu();

  const assign = event.target.closest('[data-extension-assign]'); if (assign) openAssign(assign.dataset.extensionAssign);
  const reload = event.target.closest('[data-extension-reload]'); if (reload) { try { const updated = await window.ops.reloadExtension(reload.dataset.extensionReload); toast(tx('扩展已重新加载：') + (updated?.name || '') + ' v' + (updated?.version || '')); invalidateViewCache('extensions'); await refreshExtensions(); } catch (error) { toast(tx('重新加载失败：') + error.message); } }
  const remove = event.target.closest('[data-extension-remove]'); if (remove) { try { await window.ops.removeExtension(remove.dataset.extensionRemove); invalidateViewCache(['extensions', 'profiles', 'sync']); await refreshExtensions(); } catch (error) { toast(error.message); } }
  const windowButton = event.target.closest('[data-window]');
  if (windowButton) {
    const action = windowButton.dataset.window;
    const buttons = $$('[data-window]');
    const previous = buttons.find((button) => button.classList.contains('active')) || null;
    buttons.forEach((button) => { button.disabled = true; });
    const result = await runSyncAction('窗口操作', () => window.ops.windowAction(selectedSessionIds(), action));
    buttons.forEach((button) => { button.disabled = false; });
    buttons.forEach((button) => button.classList.toggle('active', result ? button === windowButton : button === previous));
  }
  const masterSelect = event.target.closest('[data-master-select]'); if (masterSelect && !syncState.active && selectedSessions.has(masterSelect.dataset.masterSelect)) { preferredMasterId = masterSelect.dataset.masterSelect; pushSyncSelection(); renderSessions(); }
  const showWindow = event.target.closest('[data-show-window]'); if (showWindow) runSyncAction('\u663e\u793a\u7a97\u53e3', () => window.ops.windowAction([showWindow.dataset.showWindow], 'normal'));
  const proxyCheck = event.target.closest('[data-proxy-check]'); if (proxyCheck) checkProfileProxy(proxyCheck.dataset.proxyCheck);
  const consoleButton = event.target.closest('[data-console]'); if (consoleButton) { $$('.console-tabs button').forEach((button) => button.classList.toggle('active', button === consoleButton)); $$('.console-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `console-${consoleButton.dataset.console}`)); }
});

document.addEventListener('change', async (event) => {
  if (event.target.id === 'editor-engine') {
    const warn = document.getElementById('editor-engine-warn');
    const current = (typeof ui !== 'undefined' && typeof editingProfileId !== 'undefined')
      ? ui.profiles.find((item) => item.id === editingProfileId) : null;
    if (warn) warn.hidden = !current || String(current.engine === 'firefox' ? 'firefox' : 'chromium') === event.target.value;
  }
  if (event.target.dataset.extensionToggle) {
    const input = event.target; input.disabled = true;
    try { toast(input.checked ? tx('正在批量启用扩展并重启运行环境...') : tx('正在批量停用扩展并重启运行环境...')); const result = await window.ops.toggleExtensionAll(input.dataset.extensionToggle, input.checked); invalidateViewCache(['extensions', 'profiles', 'sync']); await refreshExtensions(); await refreshStatus(); await refreshSessions(); toast(tx(`已${input.checked ? '启用' : '停用'}，影响 ${result.affected} 个环境，重启 ${result.restarted} 个`) + (result.partial ? tx('；部分运行环境尚未应用，请手动重启') : ''), { tone: result.partial ? 'warning' : 'status' }); }
    catch (error) { input.checked = !input.checked; toast(error.message); } finally { input.disabled = false; }
  }
  if (event.target.dataset.profileSelect) { event.target.checked ? selectedProfiles.add(event.target.dataset.profileSelect) : selectedProfiles.delete(event.target.dataset.profileSelect); updateProfileSelectionUi(); }
  if (event.target.dataset.sessionSelect && !syncState.active) { event.target.checked ? selectedSessions.add(event.target.dataset.sessionSelect) : selectedSessions.delete(event.target.dataset.sessionSelect); if (!selectedSessions.has(preferredMasterId)) preferredMasterId = [...selectedSessions][0] || null; pushSyncSelection(); renderSessions(); }
});

$('#editor-test-proxy')?.addEventListener('click', testEditorProxy);

$('#editor-apply-proxy-fp')?.addEventListener('click', applyEditorProxyFingerprint);

$('#editor-refresh-proxy')?.addEventListener('click', refreshEditorProxy);

$('#proxy-create')?.addEventListener('click', () => openProxyDialog(null));

$('#proxy-refresh')?.addEventListener('click', refreshProxies);

$('#proxy-search')?.addEventListener('input', scheduleProxySearchRender);

$('#proxy-select-all')?.addEventListener('change', (event) => {
  const checked = event.target.checked;
  // Select exactly the rows the table renders: status filter + search box
  // (see visibleProxies in ui/ui-proxy.js).
  const list = visibleProxies(proxyLibrary);
  for (const item of list) {
    if (checked) selectedProxies.add(item.id); else selectedProxies.delete(item.id);
  }
  renderProxies();
});

$('#proxy-filter')?.addEventListener('change', () => renderProxies());

$('#proxy-delete-selected')?.addEventListener('click', async () => {
  const ids = [...selectedProxies];
  if (!ids.length) return toast(tx('请先勾选代理'));
  // Reference delete confirm lists the affected proxies by name.
  const names = ids.map((id) => proxyLibraryItem(id)?.name || id).slice(0, 3).join('、');
  if (!await confirmAction({
    title: tx('删除代理'),
    message: t('proxies.deleteConfirmNamed', { names, count: ids.length }),
    confirmLabel: tx('确认删除'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.proxyDelete(ids);
    ids.forEach((id) => selectedProxies.delete(id));
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    toast(t('proxies.deleteDone', { n: ids.length }));
    log('Proxy', '删除 ' + ids.length + ' 条');
  } catch (error) { toast(error.message); }
});

$('#proxy-delete-failed')?.addEventListener('click', async () => {
  const failed = (proxyLibrary || []).filter((item) => item.lastCheckOk === false);
  if (!failed.length) return toast(t('proxies.noFailed'));
  if (!await confirmAction({
    title: t('proxies.deleteFailed'),
    message: t('proxies.deleteFailedConfirm', { n: failed.length }),
    confirmLabel: tx('确认删除'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.proxyDelete(failed.map((item) => item.id));
    failed.forEach((item) => selectedProxies.delete(item.id));
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    toast(t('proxies.deleteFailedDone', { n: failed.length }));
    log('Proxy', '删除失败代理 ' + failed.length + ' 条');
  } catch (error) { toast(error.message); }
});

$('#proxy-clear-all')?.addEventListener('click', async () => {
  if (!(proxyLibrary || []).length) return toast(tx('代理库为空'));
  if (!await confirmAction({
    title: t('proxies.clearAll'),
    message: t('proxies.clearAllConfirm'),
    confirmLabel: t('proxies.confirmClear'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.proxyDelete((proxyLibrary || []).map((item) => item.id));
    selectedProxies.clear();
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    toast(t('proxies.clearAllDone'));
    log('Proxy', '清空代理库');
  } catch (error) { toast(error.message); }
});

$('#proxy-export-selected')?.addEventListener('click', async () => {
  const ids = [...selectedProxies];
  const items = ids.length ? ids.map((id) => proxyLibraryItem(id)).filter(Boolean) : proxyLibrary;
  if (!items.length) return toast(tx('请先勾选代理'));
  const text = buildProxyExportText(items);
  if (!text) return toast(t('proxies.exportEmpty'));
  // Download via a Blob URL so Electron's save dialog handles the file; one
  // importable raw-proxy line per record.
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `proxies-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(t('proxies.exportDone', { n: items.length }));
  log('Proxy', '导出代理 ' + items.length + ' 条');
});

$('#proxy-check-selected')?.addEventListener('click', async () => {
  await runProxyBatchCheck([...selectedProxies]);
});

$('#proxy-check-all')?.addEventListener('click', async () => {
  const ids = (proxyLibrary || []).map((item) => item.id);
  if (!ids.length) return toast(tx('代理库为空'));
  await runProxyBatchCheck(ids);
});

document.addEventListener('change', (event) => {
  const box = event.target.closest('[data-proxy-select]');
  if (!box) return;
  if (box.checked) selectedProxies.add(box.dataset.proxySelect);
  else selectedProxies.delete(box.dataset.proxySelect);
  if (typeof updateProxySelectedChip === 'function') updateProxySelectedChip();
});

document.addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-proxy-edit]');
  if (edit) {
    const item = proxyLibrary.find((p) => p.id === edit.dataset.proxyEdit);
    if (item) openProxyDialog(item);
    return;
  }
  const del = event.target.closest('[data-proxy-delete]');
  if (del) {
    const id = del.dataset.proxyDelete;
    if (!await confirmAction({
      title: tx('删除代理'),
      message: tx('您确认要删除该代理吗？'),
      confirmLabel: tx('确认删除'),
      tone: 'danger',
    })) return;
    try {
      await window.ops.proxyDelete([id]);
      selectedProxies.delete(id);
      invalidateViewCache(['proxies', 'profiles']);
      await refreshProxies();
      toast(tx('已删除'));
    } catch (error) { toast(error.message); }
    return;
  }
  const test = event.target.closest('[data-proxy-test]');
  if (test) {
    const id = test.dataset.proxyTest;
    try {
      toast(tx('检测中…'));
      const result = await window.ops.proxyCheck({ id });
      invalidateViewCache('proxies');
      await refreshProxies();
      const locationParts = [result.country, result.city].filter(Boolean).join(' ');
      const detailParts = [`IP: ${result.ip}`];
      if (locationParts) detailParts.push(`${t('proxies.locationLabel')}: ${locationParts}`);
      if (result.timezone) detailParts.push(`${t('proxies.timezoneLabel')}: ${result.timezone}`);
      toast(`${t('proxies.testSuccess')} · ${detailParts.join(' · ')}`);
      log('Proxy', '检测 ' + id + ' → ' + result.ip);
    } catch (error) { toast(tx('检测失败：') + error.message); }
    return;
  }
  const applyBtn = event.target.closest('[data-proxy-apply]');
  if (applyBtn) {
    const item = proxyLibrary.find((p) => p.id === applyBtn.dataset.proxyApply);
    if (item) openProxyApplyDialog(item);
    return;
  }
  const use = event.target.closest('[data-proxy-use]');
  if (use) {
    const item = proxyLibrary.find((p) => p.id === use.dataset.proxyUse);
    if (!item) return;
    openCreateProfileDialog();
    renderProxyLibrarySelect($('#create-proxy-library'), item.id);
    const librarySelect = $('#create-proxy-library');
    if (librarySelect) librarySelect.value = item.id;
    const proxyRadio = document.querySelector('input[name="create-network"][value="proxy"]');
    if (proxyRadio) {
      proxyRadio.checked = true;
      proxyRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const type = $('#create-proxy-type');
    if (type && item.protocol) type.value = item.protocol;
    const input = $('#create-proxy-input') || document.querySelector('#profile-form input[name="proxy"]');
    if (input) input.value = item.raw || `${item.host}:${item.port}`;
    const fields = $('#create-proxy-fields');
    if (fields) fields.hidden = false;
    toast(tx('已切换为代理模式并关联代理库节点'));
  }
});

$('#proxy-apply-select-all')?.addEventListener('change', (e) => {
  const checked = e.target.checked;
  const boxes = document.querySelectorAll('#proxy-apply-list input[type="checkbox"]');
  boxes.forEach((b) => { b.checked = checked; });
  const countEl = $('#proxy-apply-count');
  if (countEl) countEl.textContent = tx('已选择 ') + (checked ? boxes.length : 0) + tx(' 个环境');
});

$('#proxy-apply-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (event.submitter?.value === 'cancel') return $('#proxy-apply-dialog').close();
  const proxyId = $('#proxy-apply-id')?.value;
  const item = proxyLibraryItem(proxyId);
  if (!item) return $('#proxy-apply-dialog').close();
  const checkedIds = Array.from(document.querySelectorAll('#proxy-apply-list input[type="checkbox"]:checked')).map((el) => el.value);
  if (!checkedIds.length) {
    toast(tx('未选择任何环境'));
    return $('#proxy-apply-dialog').close();
  }
  const proxyVal = item.raw || `${item.protocol || 'socks5'}://${item.username ? encodeURIComponent(item.username) + ':' + encodeURIComponent(item.password || '') + '@' : ''}${item.host}:${item.port}`;
  const submitter = event.submitter;
  if (submitter && submitter.value !== 'cancel') submitter.disabled = true;
  let modified = 0;
  // 变更前快照：syncProfiles 失败时本地列表与引擎存档不能停留在半应用
  // 状态（此前无回滚，失败后界面与存档都保留了新代理值）。
  const snapshots = new Map();
  for (const pid of checkedIds) {
    const idx = ui.profiles.findIndex((p) => p.id === pid);
    if (idx >= 0) {
      const prev = ui.profiles[idx];
      snapshots.set(idx, {
        networkMode: prev.networkMode, proxy: prev.proxy, proxyId: prev.proxyId,
        proxyMeta: prev.proxyMeta ? { ...prev.proxyMeta } : prev.proxyMeta,
      });
      prev.networkMode = 'proxy';
      prev.proxy = proxyVal;
      prev.proxyId = item.id;
      prev.proxyMeta = { ...(prev.proxyMeta || {}), proxyId: item.id };
      modified++;
    }
  }
  save();
  invalidateViewCache(['proxies', 'profiles']);
  try {
    engineProfiles = await (window.OpenBrowserApp?.syncProfiles || window.ops.syncProfiles)(Array.from(snapshots.keys(), (index) => ui.profiles[index]));
    renderProfiles();
    $('#proxy-apply-dialog').close();
    toast(tx('已成功应用代理到 ') + modified + tx(' 个环境'));
    log('Proxy', `应用代理 ${item.name || item.host} 到 ${modified} 个环境`);
  } catch (err) {
    for (const [idx, snap] of snapshots) Object.assign(ui.profiles[idx], snap);
    save();
    renderProfiles();
    toast(tx('应用失败：') + err.message);
  } finally { if (submitter) submitter.disabled = false; }
});

$('#proxy-dialog-test')?.addEventListener('click', async () => {
  const output = $('#proxy-dialog-result');
  try {
    const draft = readProxyForm();
    output.className = 'proxy-test-result';
    output.textContent = tx('正在检测…');
    let proxyValue = draft.raw;
    if (!proxyValue && draft.host && Number.isInteger(draft.port) && draft.port > 0 && draft.port <= 65535) {
      const auth = draft.username ? `${encodeURIComponent(draft.username)}:${encodeURIComponent(draft.password || '')}@` : '';
      proxyValue = `${draft.protocol || 'socks5'}://${auth}${draft.host}:${draft.port}`;
    }
    if (!proxyValue) throw new Error(tx('请先填写主机和端口'));
    const result = await window.ops.proxyCheck(draft.id ? { id: draft.id } : { proxy: proxyValue, ...draft });
    output.className = 'proxy-test-result success';
    // Reference check-result detail: IP + 位置 + 时区 on one line.
    const locationParts = [result.country, result.city].filter(Boolean).join(' ');
    const detailParts = [`IP: ${result.ip}`];
    if (locationParts) detailParts.push(`${t('proxies.locationLabel')}: ${locationParts}`);
    if (result.timezone) detailParts.push(`${t('proxies.timezoneLabel')}: ${result.timezone}`);
    output.textContent = `${t('proxies.testSuccess')} · ${detailParts.join(' · ')}`;
    if (draft.id) await refreshProxies();
  } catch (error) {
    output.className = 'proxy-test-result error';
    output.textContent = tx('检测失败 · ') + error.message;
  }
});

$('#proxy-user')?.addEventListener('input', () => { window.__proxyAuthFieldsTouched = true; });

$('#proxy-password')?.addEventListener('input', () => { window.__proxyAuthFieldsTouched = true; });

['input', 'change'].forEach((evt) => {
  $('#proxy-raw')?.addEventListener(evt, handleProxyRawChange);
});

$('#proxy-raw')?.addEventListener('paste', () => {
  setTimeout(handleProxyRawChange, 0);
});

$('#proxy-name')?.addEventListener('input', () => { delete $('#proxy-name').dataset.autoProxyName; });

['input', 'change'].forEach((evt) => {
  $('#proxy-host')?.addEventListener(evt, handleProxyHostChange);
});

$('#proxy-host')?.addEventListener('paste', () => {
  setTimeout(handleProxyHostChange, 0);
});

$('#proxy-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.value === 'cancel') return $('#proxy-dialog').close('cancel');
  if (submitter && submitter.id !== 'proxy-dialog-save' && submitter.value !== 'default') return;
  if (submitter) submitter.disabled = true;
  try {
    const draft = readProxyForm();
    if (draft.id) await window.ops.proxyUpdate(draft);
    else await window.ops.proxyCreate(draft);
    $('#proxy-dialog').close();
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    toast(draft.id ? tx('代理已更新') : tx('代理已创建'));
    log('Proxy', (draft.id ? '更新 ' : '新建 ') + (draft.name || draft.host));
  } catch (error) {
    toast(tx('保存失败：') + error.message);
  } finally { if (submitter) submitter.disabled = false; }
});

$('#proxy-dialog')?.addEventListener('close', () => { editingProxyRecord = null; });

// M-5/M-6: the four live-parse listeners (create/editor × raw/host) were
// four near-identical 18-line bodies differing only in field id prefix,
// how each found field is written back, and which side effects fire. One
// parameterized installer owns the shared skeleton (trim, guard, parse,
// write-back, library unlink, themed-select sync, silent catch); the
// per-listener options below pin down only the differences.
function installProxyLiveParse({ listenId, typeSel, rawId, hostId, portId, userId, passwordId, isHostField, requireCompound, fillInputSel, authTouch, statusSel, statusText, scopeSel }) {
  const el = $(listenId);
  if (!el) return;
  el.addEventListener('input', () => {
    const value = el.value.trim();
    if (!value) return;
    if (requireCompound && !value.includes(':') && !value.includes('@') && !value.includes('/')) return;
    try {
      const parsed = parseProxyInputForUi(value, $(typeSel)?.value || 'socks5');
      if (!parsed) return;
      if ($(typeSel)) $(typeSel).value = parsed.protocol;
      // The raw field overwrites every parsed field unconditionally; the
      // host field is mid-edit so only the fields the paste actually
      // carries are filled (host itself always, the rest only when parsed).
      if (!isHostField || parsed.host) $(hostId).value = parsed.host;
      if (!isHostField || parsed.port) if ($(portId)) $(portId).value = parsed.port;
      if (!isHostField || parsed.username) {
        if ($(userId)) $(userId).value = parsed.username;
        if (authTouch) authTouch();
      }
      if (!isHostField || parsed.password) {
        if ($(passwordId)) $(passwordId).value = parsed.password;
        if (authTouch) authTouch();
      }
      if (!isHostField && $(rawId)) $(rawId).value = parsed.raw;
      if (isHostField && $(rawId)) $(rawId).value = parsed.raw;
      const input = fillInputSel ? document.querySelector(fillInputSel) : null;
      if (input) input.value = parsed.raw;
      const library = $('#create-proxy-library') || $('#editor-proxy-library');
      if (library) library.value = '';
      if (statusSel) {
        const status = $(statusSel);
        if (status) status.textContent = statusText;
      }
      syncThemedSelects($(scopeSel));
    } catch (_) {}
  });
}

installProxyLiveParse({
  listenId: '#create-proxy-raw', typeSel: '#create-proxy-type',
  rawId: '#create-proxy-raw', hostId: '#create-proxy-host', portId: '#create-proxy-port',
  userId: '#create-proxy-user', passwordId: '#create-proxy-password',
  isHostField: false, requireCompound: false,
  fillInputSel: '#create-proxy-input, #profile-form input[name="proxy"]',
  authTouch: null, statusSel: null, statusText: '', scopeSel: '#profile-dialog',
});

installProxyLiveParse({
  listenId: '#create-proxy-host', typeSel: '#create-proxy-type',
  rawId: '#create-proxy-raw', hostId: '#create-proxy-host', portId: '#create-proxy-port',
  userId: '#create-proxy-user', passwordId: '#create-proxy-password',
  isHostField: true, requireCompound: true,
  fillInputSel: '#create-proxy-input, #profile-form input[name="proxy"]',
  authTouch: null, statusSel: null, statusText: '', scopeSel: '#profile-dialog',
});

installProxyLiveParse({
  listenId: '#editor-proxy-raw', typeSel: '#editor-proxy-type',
  rawId: '#editor-proxy-raw', hostId: '#editor-proxy-host', portId: '#editor-proxy-port',
  userId: '#editor-proxy-user', passwordId: '#editor-proxy-password',
  isHostField: false, requireCompound: false,
  fillInputSel: null,
  authTouch: () => { window.__editorProxyAuthTouched = true; },
  statusSel: '#editor-proxy-library-status', statusText: tx('未关联代理库节点（使用快捷粘贴代理）'),
  scopeSel: '#editor-proxy-fields',
});

installProxyLiveParse({
  listenId: '#editor-proxy-host', typeSel: '#editor-proxy-type',
  rawId: '#editor-proxy-raw', hostId: '#editor-proxy-host', portId: '#editor-proxy-port',
  userId: '#editor-proxy-user', passwordId: '#editor-proxy-password',
  isHostField: true, requireCompound: true,
  fillInputSel: null,
  authTouch: () => { window.__editorProxyAuthTouched = true; },
  statusSel: '#editor-proxy-library-status', statusText: tx('未关联代理库节点（使用快捷粘贴代理）'),
  scopeSel: '#editor-proxy-fields',
});

$('#editor-proxy-user')?.addEventListener('input', () => { window.__editorProxyAuthTouched = true; });

$('#editor-proxy-password')?.addEventListener('input', () => { window.__editorProxyAuthTouched = true; });

$('#proxy-raw-paste-btn')?.addEventListener('click', () => handleQuickPasteToInput('#proxy-raw'));

$('#create-proxy-raw-paste-btn')?.addEventListener('click', () => handleQuickPasteToInput('#create-proxy-raw'));

$('#editor-proxy-raw-paste-btn')?.addEventListener('click', () => handleQuickPasteToInput('#editor-proxy-raw'));

$('#editor-proxy-import-and-bind-btn')?.addEventListener('click', async () => {
  const rawInput = ($('#editor-proxy-raw')?.value || '').trim();
  const formProtocol = $('#editor-proxy-type')?.value || 'socks5';
  const formHost = ($('#editor-proxy-host')?.value || '').trim();
  const formPort = ($('#editor-proxy-port')?.value || '').trim();
  const formUser = $('#editor-proxy-user')?.value || '';
  const formPass = $('#editor-proxy-password')?.value || '';

  const fallbackRaw = formHost && formPort
    ? buildProxyUiValue({ protocol: formProtocol, host: formHost, port: formPort, username: formUser, password: formPass })
    : '';
  const targetRaw = rawInput || fallbackRaw;
  if (!targetRaw) return toast(tx('请先输入或快捷粘贴代理信息'));

  let parsed = null;
  try {
    parsed = parseProxyInputForUi(targetRaw, formProtocol);
  } catch (error) {
    // parseProxyInputForUi throws on malformed raw URIs; without this guard
    // the rejection escaped the listener entirely (the try below starts
    // after the parse) and the user saw no feedback at all.
    return toast(tx('代理格式错误：') + error.message);
  }
  if (!parsed || !parsed.host || !parsed.port) return toast(tx('代理格式不正确，缺少主机或端口'));

  try {
    const current = ui.profiles.find((p) => p.id === editingProfileId) || {};
    const profNumber = displayProfileNumber(current) || '';
    const name = parsed.name || (profNumber ? `环境${profNumber}-代理` : `代理-${parsed.host}:${parsed.port}`);
    const created = await window.ops.proxyCreate({
      name,
      protocol: parsed.protocol || 'socks5',
      host: parsed.host,
      port: Number(parsed.port),
      username: parsed.username || '',
      password: parsed.password || '',
      raw: parsed.raw || targetRaw,
      remark: parsed.remark || (profNumber ? `由环境${profNumber}入库并绑定` : '快捷入库'),
      ipChannel: $('#editor-ip-channel')?.value || 'ip-api',
    });

    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    if (created?.id) {
      applyProxyLibrarySelection('editor', created.id);
      if (editingProfileId) {
        const idx = ui.profiles.findIndex((p) => p.id === editingProfileId);
        if (idx >= 0) {
          ui.profiles[idx] = normalizeProxyAssociationForUi(ui.profiles[idx], created.id);
          save();
        }
      }
      toast(tx('代理已存入代理库并绑定当前环境'));
    }
  } catch (error) {
    toast(tx('入库并绑定失败：') + error.message);
  }
});

$('#create-proxy-input')?.addEventListener('input', () => {
  const val = $('#create-proxy-input').value.trim();
  if (!val) return;
  try {
    const parsed = parseProxyInputForUi(val, $('#create-proxy-type')?.value || 'socks5');
    if (!parsed) return;
    if ($('#create-proxy-type')) $('#create-proxy-type').value = parsed.protocol;
    if ($('#create-proxy-host')) $('#create-proxy-host').value = parsed.host;
    if ($('#create-proxy-port')) $('#create-proxy-port').value = parsed.port;
    if ($('#create-proxy-user')) $('#create-proxy-user').value = parsed.username;
    if ($('#create-proxy-password')) $('#create-proxy-password').value = parsed.password;
    if ($('#create-proxy-raw')) $('#create-proxy-raw').value = parsed.raw;
    syncThemedSelects($('#profile-dialog'));
  } catch (_) {}
});

$('#proxy-batch-import-btn')?.addEventListener('click', () => {
  $('#proxy-batch-import-text').value = '';
  syncThemedSelects($('#proxy-batch-import-dialog'));
  $('#proxy-batch-import-dialog')?.showModal();
});

$('#proxy-batch-import-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (event.submitter?.value === 'cancel') return $('#proxy-batch-import-dialog').close('cancel');
  const text = $('#proxy-batch-import-text')?.value || '';
  if (!text.trim()) return toast(tx('请输入要导入的代理'));
  const submitter = event.submitter; if (submitter && submitter.value !== 'cancel') submitter.disabled = true;
  const defaultProtocol = $('#proxy-batch-default-protocol')?.value || 'socks5';
  const ipChannel = $('#proxy-batch-ip-channel')?.value || 'ip-api';
  // Reference import flow: parse all lines first, drop duplicates against the
  // input itself and the library, then create the rest and report the outcome
  // (成功 N · 过滤重复 M · 第 K 行缺少信息) instead of a bare ok/fail count.
  const parsed = normalizeProxyImportLines(text, proxyLibrary, defaultProtocol, 500);
  try {
    // Bounded concurrency (runPool, renderer.js): 500 lines used to be 500
    // serial IPC round-trips. Failures are counted per line and reported —
    // the old empty catch reported the parse count as created, so a fully
    // failed batch still toasted "成功导入 N".
    let created = 0; const failedLines = [];
    await runPool(parsed.drafts, async (draft) => {
      try {
        await window.ops.proxyCreate({ ...draft, ipChannel });
        created += 1;
      } catch (_) {
        failedLines.push(draft.raw || `${draft.host}:${draft.port}`);
      }
    }, 4);
    $('#proxy-batch-import-dialog').close();
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    if (parsed.truncated) toast(t('proxies.importTruncated'));
    if (!parsed.drafts.length && parsed.missing.length) {
      toast(t('proxies.importMissingOnly', { lines: parsed.missing.join('、') }));
      return;
    }
    const summaryParts = [t('proxies.importParsed', { n: created })];
    if (parsed.duplicates) summaryParts.push(t('proxies.importDuplicates', { n: parsed.duplicates }));
    if (parsed.missing.length) summaryParts.push(t('proxies.importMissing', { lines: parsed.missing.join('、') }));
    if (failedLines.length) summaryParts.push(tx(`导入失败 ${failedLines.length} 条`));
    toast(summaryParts.join(tx('，')));
    log('Proxy', `批量导入代理：成功 ${created}，失败 ${failedLines.length}，重复 ${parsed.duplicates}，缺失 ${parsed.missing.length}`);
  } finally { if (submitter) submitter.disabled = false; }
});

document.addEventListener('click', async (event) => {
  const install = event.target.closest('[data-store-install]');
  if (!install) return;
  const url = install.dataset.storeInstall;
  if (!url) return;
  try {
    toast(tx('正在从 Chrome 应用商店安装…'));
    const ids = ui.profiles.map((item) => item.id);
    const result = await window.ops.addExtensionStore(url.includes('://') ? url : `https://chromewebstore.google.com/detail/${url}`, ids, true);
    invalidateViewCache(['extensions', 'profiles', 'sync']);
    await refreshExtensions();
    await refreshStatus();
    await refreshSessions();
    toast(tx(`已安装 ${result.extension?.name || '扩展'}`));
    log('Extension', `推荐安装 ${result.extension?.name || url}`);
  } catch (error) {
    toast(tx('安装失败：') + error.message);
    log('Error', error.message);
  }
});

$('#batch-set-direct')?.addEventListener('click', async () => {
  if (!selectedProfiles.size) return toast(tx('请先选择环境'));
  try {
    const result = await applySelectedNetworkMode('direct', { restart: true });
    log('Batch', '批量设为本地直连 · ' + result.count);
    toast(tx('已将 ') + result.count + tx(' 个环境设为本地直连'));
  } catch (error) {
    toast(error.message);
  }
});
