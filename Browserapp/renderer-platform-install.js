/**
 * App center / platform install view — second renderer.js split.
 *
 * Extracted verbatim from renderer.js (zero behaviour change): the 应用中心
 * rendering (recommended store cards with 安装/批量分配, the local extension
 * grid with per-extension toggles), refreshExtensions / hydrateAppCenterIcons
 * and the assignment dialog (openAssign / applyAssignment). The state lets
 * (extensions / appCenterTab / appCenterData / currentExtension) stay owned
 * by renderer.js and are reached through the shared script scope at call
 * time. Classic script loaded BEFORE renderer.js.
 */
function extensionIcon(name) { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

function createExtensionIcon(item) {
  const label = extensionIcon(item.name || 'OB');
  const icon = buildSquareMark(label, {
    color: item.builtIn || item.source === 'builtin' ? '#245cff' : '#a78bfa',
    title: item.name || tx('扩展'),
    size: UI_MARK_SIZE,
    className: 'extension-icon',
  });
  const iconUrl = String(item.iconUrl || item.icon_url || '');
  if (!/^(https:|file:|data:)/i.test(iconUrl)) return icon;
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'lazy';
  image.referrerPolicy = 'no-referrer';
  image.src = iconUrl;
  image.addEventListener('error', () => {
    icon.classList.remove('has-image');
    icon.replaceChildren();
    const num = document.createElement('span');
    num.className = 'env-badge-num';
    num.textContent = label;
    if (label.length >= 3) num.classList.add('env-badge-num-sm');
    icon.append(num);
  }, { once: true });
  icon.classList.add('has-image');
  icon.replaceChildren(image);
  return icon;
}

function renderAppCenterTabs() {
  $$('#app-center-tabs button').forEach((button) => button.classList.toggle('active', button.dataset.appTab === appCenterTab));
  const counts = appCenterData.counts || {};
  const countsEl = $('#extension-counts');
  if (countsEl) countsEl.textContent = tx(`自带 ${counts.builtin || 0} · 推荐 ${counts.recommended || 0} · 本地 ${counts.local || counts.installed || 0}`);
}

function renderExtensions() {
  renderAppCenterTabs();
  const query = $('#extension-search').value.trim().toLowerCase();
  const grid = $('#extension-grid');
  const marketBar = document.getElementById('ext-category-bar');
  const marketGrid = document.getElementById('roxy-ext-market-grid');
  const isRecommended = appCenterTab === 'recommended';
  if (marketBar) marketBar.hidden = !isRecommended;
  if (marketGrid) marketGrid.hidden = !isRecommended;
  if (grid) grid.hidden = isRecommended;
  if (typeof window.renderExtensionMarketShowcase === 'function') {
    window.renderExtensionMarketShowcase();
  }
  grid.replaceChildren();

  if (isRecommended) {
    const visibleMarketCount = marketGrid ? marketGrid.children.length : (appCenterData.recommended || []).length;
    $('#extension-empty').hidden = visibleMarketCount !== 0;
    if (!visibleMarketCount) $('#extension-empty').textContent = query ? tx('没有匹配的推荐应用') : tx('暂无推荐应用');
    return;
  }

  const sourceList = appCenterTab === 'builtin'
    ? (appCenterData.builtin || []).map((item) => {
      const full = extensions.find((ext) => ext.id === item.extension_id || ext.id === item.id);
      return full || {
        id: item.extension_id || item.id,
        name: item.name,
        description: item.description,
        version: item.version || '-',
        manifestVersion: item.manifest_version || 3,
        source: item.source,
        builtIn: item.source === 'builtin',
        enabledAll: item.enabled_all,
        assignedProfiles: item.assigned_profiles || 0,
        assignedProfileIds: [],
        iconUrl: item.icon_url || null,
      };
    })
    : extensions;

  const visible = sourceList.filter((item) => [item.name, item.description, item.version].join(' ').toLowerCase().includes(query));
  for (const extension of visible) {
    const card = element('article', 'extension-card');
    const top = element('div', 'extension-top');
    const toggleLabel = element('label', 'extension-toggle');
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = extension.enabledAll;
    toggle.dataset.extensionToggle = extension.id;
    toggle.indeterminate = !extension.enabledAll && Number(extension.assignedProfiles) > 0;
    toggleLabel.title = extension.enabledAll ? tx('全部环境已启用') : toggle.indeterminate ? tx('部分环境已启用') : tx('全部环境已停用');
    toggle.setAttribute('aria-label', `${extension.name}: ${toggleLabel.title}`);
    toggleLabel.append(toggle, element('span', 'extension-toggle-slider'));
    top.append(createExtensionIcon(extension), toggleLabel);
    card.append(top, element('h3', '', extension.name), element('p', '', extension.description || 'Local unpacked Chrome extension'));
    const meta = element('div', 'extension-meta');
    meta.append(
      element('span', '', `v${extension.version} · MV${extension.manifestVersion} · ${extension.source || (extension.builtIn ? tx('内置') : tx('本地'))}`),
      element('span', '', tx('已启用 ') + extension.assignedProfiles + '/' + ui.profiles.length)
    );
    card.append(meta);
    const actions = element('div', 'card-actions');
    const assign = element('button', 'primary', tx('批量分配'));
    assign.dataset.extensionAssign = extension.id;
    actions.append(assign);
    if (!extension.builtIn) {
      const reload = element('button', 'outline', tx('重新加载'));
      reload.dataset.extensionReload = extension.id;
      actions.append(reload);
      const remove = element('button', 'outline', tx('移除'));
      remove.dataset.extensionRemove = extension.id;
      actions.append(remove);
    }
    card.append(actions);
    grid.append(card);
  }
  $('#extension-empty').hidden = visible.length !== 0;
  if (!visible.length) $('#extension-empty').textContent = appCenterTab === 'builtin' ? tx('暂无自带应用') : tx('尚未添加扩展');
}

const refreshExtensions = (() => {
  let running = false;
  let waiters = [];
  async function drain() {
    running = true;
    try {
      while (waiters.length) {
        const batch = waiters; waiters = [];
        try { await readAndRender(); for (const waiter of batch) waiter.resolve(); }
        catch (error) { for (const waiter of batch) waiter.reject(error); }
      }
    } finally { running = false; }
  }
  async function readAndRender() {
    extensions = await window.ops.extensionList();
    try {
      const payload = await window.ops.appCenterList({ tab: 'all' });
      if (payload?.list && !Array.isArray(payload.list)) {
        appCenterData = {
          builtin: payload.list.builtin || [],
          recommended: payload.list.recommended || [],
          local: payload.list.local || [],
          counts: payload.counts || {},
        };
      } else {
        appCenterData = { builtin: [], recommended: [], local: extensions, counts: { builtin: 0, recommended: 0, local: extensions.length, installed: extensions.length } };
      }
    } catch (_) {
      appCenterData = {
        builtin: extensions.filter((item) => item.builtIn),
        recommended: [],
        local: extensions,
        counts: { builtin: 0, recommended: 0, local: extensions.length, installed: extensions.length },
      };
    }
    renderExtensions();
    window.renderExtensionMarketShowcase?.();
    hydrateAppCenterIcons().catch(() => {});
    loadedViews.add('extensions');
  }

  return () => new Promise((resolve, reject) => {
    waiters.push({ resolve, reject });
    if (!running) void drain();
  });
})();

async function hydrateAppCenterIcons() {
  const items = [...(appCenterData.recommended || []), ...(appCenterData.local || []), ...(appCenterData.builtin || [])];
  const missingStoreIds = [...new Set(items
    .filter((item) => {
      const storeId = item.store_id || item.storeId || item.chromeId;
      const hasIcon = Boolean(item.icon_url || item.iconUrl);
      return storeId && !hasIcon;
    })
    .map((item) => item.store_id || item.storeId || item.chromeId)
    .filter(Boolean))];
  if (!missingStoreIds.length) return;

  let changed = false;
  // Prefer page/CRX metadata; fall back to dedicated icon scrape (both return data: URLs)
  const [metadata, icons] = await Promise.all([
    window.ops.appCenterMetadata?.(missingStoreIds).catch(() => ({})) || {},
    window.ops.appCenterIcons?.(missingStoreIds).catch(() => ({})) || {},
  ]);

  for (const item of items) {
    const storeId = item.store_id || item.storeId || item.chromeId;
    if (!storeId) continue;
    const meta = metadata?.[storeId];
    const iconUrl = meta?.icon_url || icons?.[storeId] || null;
    if (iconUrl && item.icon_url !== iconUrl && item.iconUrl !== iconUrl) {
      item.icon_url = iconUrl;
      item.iconUrl = iconUrl;
      changed = true;
    }
    if (meta?.description && item.description !== meta.description) {
      item.description = meta.description;
      changed = true;
    }
    if (meta?.name && !item.name) {
      item.name = meta.name;
      changed = true;
    }
  }
  if (changed) renderExtensions();
  afterUiRender(document.getElementById('view-extensions') || document);
}

function openAssign(id) {
  currentExtension = extensions.find((item) => item.id === id); if (!currentExtension) return;
  $('#assign-dialog').dataset.assignmentSession = crypto.randomUUID();
  $('#assign-extension-name').textContent = tx(`${currentExtension.name} · 运行中的环境需重启后生效`);
  const list = $('#assign-profile-list'); list.replaceChildren();
  const assigned = new Set(currentExtension.assignedProfileIds || []);
  for (const profile of ui.profiles.filter((p) => !p.trashed)) { const label = element('label', 'assign-item'); const input = document.createElement('input'); input.type = 'checkbox'; input.value = profile.id; input.checked = assigned.has(profile.id); label.append(input, element('span', '', '环境 ' + displayProfileNumber(profile))); list.append(label); }
  $('#assign-dialog').showModal();
}

let assignmentInFlight = false;
async function applyAssignment(enabled) {
  if (assignmentInFlight) return;
  const ids = $$('#assign-profile-list input:checked').map((input) => input.value); if (!ids.length) return toast(tx('请先选择环境'));
  const extension = currentExtension;
  const session = $('#assign-dialog').dataset.assignmentSession;
  assignmentInFlight = true;
  try {
    const result = await window.ops.assignExtension(extension.id, ids, enabled); if ($('#assign-dialog').dataset.assignmentSession === session) $('#assign-dialog').close(); invalidateViewCache(['extensions', 'profiles', 'sync']); await refreshExtensions(); await refreshStatus();
    log('Extension', `${extension.name} ${enabled ? '添加到' : '移出'} ${ids.length} 个环境`);
    toast(result.restartRequired?.length ? tx('已保存；') + result.restartRequired.length + tx(' 个运行环境需重启') : tx('批量分配已生效'));
  } catch (error) {
    toast(String(error?.message || error)); log('Error', String(error?.message || error));
  } finally { assignmentInFlight = false; }
}
