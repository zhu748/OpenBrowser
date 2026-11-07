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

document.addEventListener('click', (event) => {
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
    if (status) status.textContent = '未关联代理库节点';
  }
});

$('#batch-add-proxy-library')?.addEventListener('change', (event) => {
  const id = String(event.target.value || '').trim();
  const item = proxyLibraryItem(id);
  const textarea = $('#batch-add-proxies');
  if (item && textarea) textarea.value = parseProxyInputForUi(item, item.protocol || 'socks5')?.raw || item.raw || `${item.host}:${item.port}`;
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
  const colorModeBtn = event.target.closest('[data-color-mode]');
  if (colorModeBtn && colorModeBtn.closest('#theme-appearance')) {
    event.stopPropagation();
    applyColorMode(colorModeBtn.dataset.colorMode);
    return;
  }
  const themeOption = event.target.closest('[data-ui-theme-option]');
  if (themeOption) {
    applyUiTheme(themeOption.dataset.uiThemeOption);
    // Keep popover open so user can switch light/dark for 系统原生
    if (themeOption.dataset.uiThemeOption !== 'element-admin') setThemePopoverOpen(false);
  } else if (!event.target.closest('#theme-picker') && !event.target.closest('#theme-popover')) {
    setThemePopoverOpen(false);
  }
  const nav = event.target.closest('[data-view]'); if (nav) switchView(nav.dataset.view);
  const action = event.target.closest('[data-action]');
  if (action?.dataset.action === 'start') startProfile(action.dataset.id);
  if (action?.dataset.action === 'stop') stopProfile(action.dataset.id);
  if (action?.dataset.action === 'edit') openProfileEditor(action.dataset.id);
  if (action?.dataset.action === 'clone') cloneProfile(action.dataset.id);
  if (action?.dataset.action === 'restore') restoreProfile(action.dataset.id);
  if (action?.dataset.action === 'purge') purgeProfile(action.dataset.id);
  if (action?.dataset.action === 'select-sync') { selectedSessions.add(action.dataset.id); pushSyncSelection(); switchView('sync'); }

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
  if (event.target.dataset.extensionToggle) {
    const input = event.target; input.disabled = true;
    try { toast(input.checked ? '正在批量启用扩展并重启运行环境...' : '正在批量停用扩展并重启运行环境...'); const result = await window.ops.toggleExtensionAll(input.dataset.extensionToggle, input.checked); invalidateViewCache(['extensions', 'profiles', 'sync']); await refreshExtensions(); await refreshStatus(); await refreshSessions(); toast(tx(`已${input.checked ? '启用' : '停用'}，影响 ${result.affected} 个环境，重启 ${result.restarted} 个`)); }
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
  const q = ($('#proxy-search')?.value || '').trim().toLowerCase();
  const list = proxyLibrary.filter((item) => !q || [item.name, item.host, item.protocol, item.remark, item.lastIp, String(item.port)].join(' ').toLowerCase().includes(q));
  for (const item of list) {
    if (checked) selectedProxies.add(item.id); else selectedProxies.delete(item.id);
  }
  renderProxies();
});

$('#proxy-delete-selected')?.addEventListener('click', async () => {
  const ids = [...selectedProxies];
  if (!ids.length) return toast(tx('请先勾选代理'));
  if (!await confirmAction({
    title: tx('删除代理'),
    message: tx(`确定删除选中的 ${ids.length} 条代理？`),
    confirmLabel: tx('确认删除'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.proxyDelete(ids);
    ids.forEach((id) => selectedProxies.delete(id));
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    toast('已删除 ' + ids.length + ' 条代理');
    log('Proxy', '删除 ' + ids.length + ' 条');
  } catch (error) { toast(error.message); }
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
      message: tx('确定删除该代理？'),
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
      toast('连接成功 · ' + result.ip + (result.countryCode ? ' · ' + result.countryCode : ''));
      log('Proxy', '检测 ' + id + ' → ' + result.ip);
    } catch (error) { toast('检测失败：' + error.message); }
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
  if (countEl) countEl.textContent = `已选择 ${checked ? boxes.length : 0} 个环境`;
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
  let modified = 0;
  for (const pid of checkedIds) {
    const idx = ui.profiles.findIndex((p) => p.id === pid);
    if (idx >= 0) {
      ui.profiles[idx].networkMode = 'proxy';
      ui.profiles[idx].proxy = proxyVal;
      ui.profiles[idx].proxyId = item.id;
      ui.profiles[idx].proxyMeta = { ...(ui.profiles[idx].proxyMeta || {}), proxyId: item.id };
      modified++;
    }
  }
  save();
  invalidateViewCache(['proxies', 'profiles']);
  try {
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    $('#proxy-apply-dialog').close();
    toast(`已成功应用代理到 ${modified} 个环境`);
    log('Proxy', `应用代理 ${item.name || item.host} 到 ${modified} 个环境`);
  } catch (err) {
    toast('应用失败：' + err.message);
  }
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
    output.textContent = tx('连接成功 · ') + result.ip + (result.countryCode ? ' · ' + result.countryCode : '');
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
  try {
    const draft = readProxyForm();
    if (draft.id) await window.ops.proxyUpdate(draft);
    else await window.ops.proxyCreate(draft);
    $('#proxy-dialog').close();
    invalidateViewCache(['proxies', 'profiles']);
    await refreshProxies();
    toast(draft.id ? '代理已更新' : '代理已创建');
    log('Proxy', (draft.id ? '更新 ' : '新建 ') + (draft.name || draft.host));
  } catch (error) {
    toast('保存失败：' + error.message);
  }
});

$('#proxy-dialog')?.addEventListener('close', () => { editingProxyRecord = null; });

$('#create-proxy-raw')?.addEventListener('input', () => {
  const raw = $('#create-proxy-raw').value.trim();
  if (!raw) return;
  try {
    const parsed = parseProxyInputForUi(raw, $('#create-proxy-type')?.value || 'socks5');
    if (!parsed) return;
    if ($('#create-proxy-type')) $('#create-proxy-type').value = parsed.protocol;
    if ($('#create-proxy-host')) $('#create-proxy-host').value = parsed.host;
    if ($('#create-proxy-port')) $('#create-proxy-port').value = parsed.port;
    if ($('#create-proxy-user')) $('#create-proxy-user').value = parsed.username;
    if ($('#create-proxy-password')) $('#create-proxy-password').value = parsed.password;
    const input = $('#create-proxy-input') || document.querySelector('#profile-form input[name="proxy"]');
    if (input) input.value = parsed.raw;
    const library = $('#create-proxy-library');
    if (library) library.value = '';
    syncThemedSelects($('#profile-dialog'));
  } catch (_) {}
});

$('#create-proxy-host')?.addEventListener('input', () => {
  const value = $('#create-proxy-host').value.trim();
  if (!value || (!value.includes(':') && !value.includes('@') && !value.includes('/'))) return;
  try {
    const parsed = parseProxyInputForUi(value, $('#create-proxy-type')?.value || 'socks5');
    if (!parsed) return;
    if ($('#create-proxy-type')) $('#create-proxy-type').value = parsed.protocol;
    $('#create-proxy-host').value = parsed.host;
    if (parsed.port && $('#create-proxy-port')) $('#create-proxy-port').value = parsed.port;
    if (parsed.username && $('#create-proxy-user')) $('#create-proxy-user').value = parsed.username;
    if (parsed.password && $('#create-proxy-password')) $('#create-proxy-password').value = parsed.password;
    if ($('#create-proxy-raw')) $('#create-proxy-raw').value = parsed.raw;
    const input = $('#create-proxy-input') || document.querySelector('#profile-form input[name="proxy"]');
    if (input) input.value = parsed.raw;
    const library = $('#create-proxy-library');
    if (library) library.value = '';
    syncThemedSelects($('#profile-dialog'));
  } catch (_) {}
});

$('#editor-proxy-raw')?.addEventListener('input', () => {
  const raw = $('#editor-proxy-raw').value.trim();
  if (!raw) return;
  try {
    const parsed = parseProxyInputForUi(raw, $('#editor-proxy-type')?.value || 'socks5');
    if (!parsed) return;
    if ($('#editor-proxy-type')) $('#editor-proxy-type').value = parsed.protocol;
    if ($('#editor-proxy-host')) $('#editor-proxy-host').value = parsed.host;
    if ($('#editor-proxy-port')) $('#editor-proxy-port').value = parsed.port;
    if ($('#editor-proxy-user')) $('#editor-proxy-user').value = parsed.username;
    if ($('#editor-proxy-password')) $('#editor-proxy-password').value = parsed.password;
    const library = $('#editor-proxy-library');
    if (library) library.value = '';
    const status = $('#editor-proxy-library-status');
    if (status) status.textContent = '未关联代理库节点（使用快捷粘贴代理）';
    window.__editorProxyAuthTouched = true;
    syncThemedSelects($('#editor-proxy-fields'));
  } catch (_) {}
});

$('#editor-proxy-host')?.addEventListener('input', () => {
  const value = $('#editor-proxy-host').value.trim();
  if (!value || (!value.includes(':') && !value.includes('@') && !value.includes('/'))) return;
  try {
    const parsed = parseProxyInputForUi(value, $('#editor-proxy-type')?.value || 'socks5');
    if (!parsed) return;
    if ($('#editor-proxy-type')) $('#editor-proxy-type').value = parsed.protocol;
    $('#editor-proxy-host').value = parsed.host;
    if (parsed.port && $('#editor-proxy-port')) $('#editor-proxy-port').value = parsed.port;
    if (parsed.username && $('#editor-proxy-user')) {
      $('#editor-proxy-user').value = parsed.username;
      window.__editorProxyAuthTouched = true;
    }
    if (parsed.password && $('#editor-proxy-password')) {
      $('#editor-proxy-password').value = parsed.password;
      window.__editorProxyAuthTouched = true;
    }
    if ($('#editor-proxy-raw')) $('#editor-proxy-raw').value = parsed.raw;
    const library = $('#editor-proxy-library');
    if (library) library.value = '';
    const status = $('#editor-proxy-library-status');
    if (status) status.textContent = '未关联代理库节点（使用快捷粘贴代理）';
    syncThemedSelects($('#editor-proxy-fields'));
  } catch (_) {}
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

  const parsed = parseProxyInputForUi(targetRaw, formProtocol);
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
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//') && !l.startsWith('#'));
  if (!lines.length) return toast(tx('请输入要导入的代理'));
  const defaultProtocol = $('#proxy-batch-default-protocol')?.value || 'socks5';
  const ipChannel = $('#proxy-batch-ip-channel')?.value || 'ip-api';
  let successCount = 0;
  let failCount = 0;
  for (const line of lines) {
    try {
      const parsed = parseProxyInputForUi(line, defaultProtocol);
      if (!parsed || !parsed.host || !parsed.port) {
        failCount++;
        continue;
      }
      const draft = {
        name: parsed.name || `${parsed.protocol.toUpperCase()} ${parsed.host}:${parsed.port}`,
        protocol: parsed.protocol,
        ipChannel,
        host: parsed.host,
        port: Number(parsed.port),
        username: parsed.username || '',
        password: parsed.password || '',
        raw: parsed.raw,
        remark: parsed.remark || '',
      };
      await window.ops.proxyCreate(draft);
      successCount++;
    } catch (_) {
      failCount++;
    }
  }
  $('#proxy-batch-import-dialog').close();
  invalidateViewCache(['proxies', 'profiles']);
  await refreshProxies();
  toast(tx(`批量导入完成：成功 ${successCount} 个` + (failCount ? `，失败 ${failCount} 个` : '')));
  log('Proxy', `批量导入代理完成：${successCount} 成功，${failCount} 失败`);
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
    toast('安装失败：' + error.message);
    log('Error', error.message);
  }
});

$('#batch-set-direct')?.addEventListener('click', async () => {
  if (!selectedProfiles.size) return toast(tx('请先选择环境'));
  try {
    const result = await applySelectedNetworkMode('direct', { restart: true });
    log('Batch', '批量设为本地直连 · ' + result.count);
    toast('已将 ' + result.count + ' 个环境设为本地直连');
  } catch (error) {
    toast(error.message);
  }
});
