const UI_KEY = 'openbrowser-ui-state';
const GROUP_COLORS = ['#245cff', '#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#94a3b8', '#f97316', '#2dd4bf'];
const UNGROUPED_ID = '';

function t(key, params) {
  return window.OpenBrowserI18n?.t?.(key, params) ?? key;
}

function tx(s) {
  if (s == null || s === '') return s;
  try {
    if (window.OpenBrowserI18n?.getLocale?.() === 'zh-CN') return String(s);
    return window.OpenBrowserI18n?.translateChineseUiText?.(String(s)) ?? String(s);
  } catch (_) { return String(s); }
}


const loadedViews = new Set();
const viewScrollPositions = new Map();

function invalidateViewCache(views) {
  if (!views) {
    loadedViews.clear();
    return;
  }
  if (Array.isArray(views)) {
    for (const v of views) loadedViews.delete(v);
    return;
  }
  loadedViews.delete(views);
}

const appUpdateState = { status: 'idle', result: null, message: '', progress: null };

function applyVersionTrafficLight(payload) {
  const lightEl = document.getElementById('version-traffic-light');
  const wrap = document.getElementById('app-version-wrap');
  const versionEl = document.getElementById('app-version');
  if (!lightEl || !wrap) return;
  // Product: green = latest, red = update available. Never paint "latest" as yellow.
  let light = payload?.light;
  if (!light) {
    if (payload?.status === 'checking') light = 'checking';
    else if (payload?.upToDate === true) light = 'green';
    else if (payload?.upToDate === false && payload?.remoteVersion) light = 'red';
    else if (payload?.error) light = 'unknown';
    else light = 'checking';
  }
  // Legacy / mistaken amber states → gray unknown (not "update available")
  if (light === 'yellow' || light === 'amber' || light === 'orange') light = 'unknown';
  // If backend already compared versions, force green/red even if light string is wrong
  if (payload?.upToDate === true) light = 'green';
  else if (payload?.upToDate === false && payload?.remoteVersion) light = 'red';
  // An unparseable version pair is neither "latest" nor a confirmed update;
  // keep it gray so the UI never offers a download from an unknown comparison.
  if (payload?.updateStatus === 'unknown') light = 'unknown';
  lightEl.dataset.state = light;
  if (payload?.currentVersion && versionEl) versionEl.textContent = `v${payload.currentVersion}`;
  let title = t('footer.versionChecking') || '正在检查版本…';
  if (light === 'green') {
    title = t('footer.versionLatest', { version: payload.currentVersion || '' })
      || `已是最新版本 v${payload.currentVersion || ''}`;
  } else if (light === 'red') {
    title = t('footer.versionUpdateAvailable', {
      current: payload.currentVersion || '',
      version: payload.remoteVersion || '',
    }) || `有新版本 v${payload.remoteVersion}（当前 v${payload.currentVersion}），点击查看更新`;
  } else if (light === 'unknown') {
    title = payload?.error
      ? (t('footer.versionCheckFailed', { message: payload.error }) || `版本检查失败：${payload.error}`)
      : (t('footer.versionUnknown') || '无法判断是否为最新版本');
  }
  wrap.title = title;
  wrap.setAttribute('aria-label', title);
  wrap.classList.toggle('is-clickable', light === 'red');
  wrap.dataset.light = light;
  if (payload && (payload.upToDate != null || payload.remoteVersion || payload.supported != null)) {
    appUpdateState.result = {
      ...(appUpdateState.result || {}),
      ...payload,
      supported: payload.supported !== false,
      upToDate: payload.upToDate,
      currentVersion: payload.currentVersion,
      remoteVersion: payload.remoteVersion,
    };
    if (appUpdateState.status === 'idle' || appUpdateState.status === 'checking' || appUpdateState.status === 'ready') {
      if (payload.error && light === 'unknown') {
        /* keep settings card free unless user opened it */
      } else {
        appUpdateState.status = 'ready';
        appUpdateState.message = '';
      }
      renderAppUpdateState();
    }
  }
}

function openAppUpdatePanel() {
  try {
    switchView('system');
    const card = document.getElementById('app-update-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (_) {}
}


function renderAppUpdateState() {
  const status = document.getElementById('app-update-status');
  const version = document.getElementById('app-update-version');
  const check = document.getElementById('app-check-update');
  const download = document.getElementById('app-download-update');
  if (!status || !version || !check || !download) return;
  const result = appUpdateState.result;
  version.textContent = result?.remoteVersion ? `v${result.remoteVersion}` : '—';
  check.disabled = appUpdateState.status === 'checking' || appUpdateState.status === 'downloading';
  download.hidden = !(result && !result.upToDate && result.updateStatus !== 'unknown' && (result.canDownload !== false) && result.asset?.name && appUpdateState.status !== 'downloading');
  download.disabled = appUpdateState.status === 'checking' || appUpdateState.status === 'downloading';
  if (appUpdateState.message) {
    status.textContent = appUpdateState.message;
    return;
  }
  if (appUpdateState.status === 'checking') status.textContent = t('system.update.checking');
  else if (appUpdateState.status === 'downloading') {
    const progress = appUpdateState.progress;
    if (progress?.percent != null) status.textContent = t('system.update.downloadingPercent', { percent: progress.percent });
    else if (progress?.received && progress?.total) status.textContent = t('system.update.downloadingBytes', { received: formatBytes(progress.received), total: formatBytes(progress.total) });
    else status.textContent = t('system.update.downloading');
  }
  else if (result?.supported && result.upToDate) status.textContent = t('system.update.latest', { version: result.currentVersion });
  else if (result?.supported && !result.upToDate && result.updateStatus !== 'unknown') status.textContent = t('system.update.available', { current: result.currentVersion, version: result.remoteVersion });
  else if (result && !result.supported) status.textContent = t('system.update.unsupported');
  else status.textContent = t('system.update.idle');
}

async function checkAppUpdate() {
  appUpdateState.status = 'checking'; appUpdateState.result = null; appUpdateState.message = ''; appUpdateState.progress = null;
  applyVersionTrafficLight({ light: 'checking', currentVersion: document.getElementById('app-version')?.textContent?.replace(/^v/i, '') });
  renderAppUpdateState();
  try {
    appUpdateState.result = await window.ops.checkAppUpdate();
    appUpdateState.status = 'ready';
    const result = appUpdateState.result || {};
    let light = result.light;
    if (result.upToDate === true) light = 'green';
    else if (result.upToDate === false && result.remoteVersion) light = 'red';
    else if (result.supported === false) light = 'unknown';
    else if (!light) light = result.remoteVersion ? (result.upToDate ? 'green' : 'red') : 'unknown';
    if (result.updateStatus === 'unknown') light = 'unknown';
    applyVersionTrafficLight({ ...result, light });
  } catch (error) {
    appUpdateState.status = 'error';
    appUpdateState.message = t('system.update.error', { message: error.message });
    applyVersionTrafficLight({ light: 'unknown', error: error.message });
  }
  renderAppUpdateState();
}

async function downloadAppUpdate() {
  appUpdateState.status = 'downloading'; appUpdateState.message = ''; appUpdateState.progress = null; renderAppUpdateState();
  try {
    const result = await window.ops.downloadAppUpdate();
    appUpdateState.status = 'ready';
    appUpdateState.message = result.upToDate
      ? t('system.update.latest', { version: result.version })
      : t('system.update.downloaded', { path: result.path });
  } catch (error) {
    appUpdateState.status = 'error';
    appUpdateState.message = t('system.update.error', { message: error.message });
  }
  renderAppUpdateState();
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

document.getElementById('github-link')?.addEventListener('click', async (event) => {
  event.preventDefault();
  try { await window.ops.openGithub(); } catch (error) { toast(error.message); }
});
document.getElementById('app-version-wrap')?.addEventListener('click', () => {
  const light = document.getElementById('app-version-wrap')?.dataset?.light;
  if (light === 'red') openAppUpdatePanel();
  else checkAppUpdate();
});
document.getElementById('app-check-update')?.addEventListener('click', () => checkAppUpdate());
document.getElementById('app-download-update')?.addEventListener('click', () => downloadAppUpdate());

function afterUiRender(root) {
  // Renderers always pass the view or card they just changed. Keeping i18n scoped
  // avoids walking the entire desktop shell after every table/card update.
  try { window.OpenBrowserI18n?.applyDom?.(root || document); } catch (_) {}
}

function refreshLocaleChrome() {
  const i18n = window.OpenBrowserI18n;
  if (!i18n) return;
  i18n.applyDom(document);
  const select = document.getElementById('ui-locale-select');
  if (select) {
    i18n.fillLocaleSelect(select);
    select.value = i18n.getPreference();
  }
  const badge = document.getElementById('ui-locale-badge');
  if (badge) {
    const pref = i18n.getPreference();
    badge.textContent = pref === 'system' ? 'System' : i18n.getLocale();
  }
  const current = document.getElementById('ui-locale-current');
  if (current) {
    const label = i18n.SUPPORTED.find((item) => item.code === i18n.getLocale())?.label || i18n.getLocale();
    current.textContent = t('system.locale.current', { lang: label });
  }
  // Keep browser language pickers complete (en/zh/ja/vi/fr/de/th/id + …)
  i18n.fillBrowserLanguageSelect?.(document.getElementById('editor-language'));
  i18n.fillBrowserLanguageSelect?.(document.getElementById('profile-create-language'));
  i18n.fillBrowserLanguageSelect?.(document.getElementById('batch-add-language'));
  const modeSelect = document.getElementById('editor-language-mode');
  if (modeSelect) {
    const prev = modeSelect.value || 'ip';
    i18n.fillBrowserLanguageSelect(modeSelect, { includeModes: true });
    if ([...modeSelect.options].some((o) => o.value === prev)) modeSelect.value = prev;
    else modeSelect.value = 'ip';
  }
  if (typeof syncThemedSelects === 'function') syncThemedSelects();
  if (typeof refreshIcons === 'function') refreshIcons();
  renderAppUpdateState();
}

function applyPlatformClass() {
  const raw = navigator.userAgentData?.platform || navigator.platform || '';
  const platform = /mac/i.test(raw) ? 'macos' : /win/i.test(raw) ? 'windows' : 'other';
  document.documentElement.dataset.platform = platform;
  // Shipping-app fused title bar (hiddenInset / titleBarOverlay)
  const integrated = platform === 'macos' || platform === 'windows';
  document.documentElement.dataset.titlebar = integrated ? 'integrated' : 'default';
  document.documentElement.classList.toggle('titlebar-integrated', integrated);
}

function refreshIcons(root = document) {
  if (!window.lucide?.createIcons) return;
  try {
    const icons = window.lucide.icons || window.lucide;
    if (!icons || !Object.keys(icons).length) {
      console.warn('Lucide icons map is empty');
      return;
    }
    // Lucide replaces <i data-lucide="..."> elements with SVGs, so re-running
    // it over the whole document re-parses every already-converted node.
    // Scope to elements that still carry the marker attribute.
    const rootEl = root && root.querySelectorAll ? root : document;
    if (rootEl !== document && !rootEl.querySelector('[data-lucide]')) return;
    if (rootEl === document && !document.querySelector('[data-lucide]')) return;
    window.lucide.createIcons({
      icons,
      nameAttr: 'data-lucide',
      attrs: {
        'aria-hidden': 'true',
        'stroke-width': '1.75',
        stroke: 'currentColor',
        fill: 'none',
      },
    });
  } catch (error) {
    console.warn('Lucide icons failed to render:', error?.message || error);
  }
}

applyPlatformClass();
refreshIcons();

function createGroupId() {
  return 'grp-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function defaultGroups() {
  return [
    { id: 'grp-default', name: t('groups.default'), color: '#245cff', note: '', sort: 0, createdAt: new Date().toISOString() },
  ];
}

const defaultProfiles = () => [
  { id: 'env-001', number: 1, name: '1', browser: 'Google Chrome', language: 'zh-CN', networkMode: 'direct', proxy: 'Direct', tag: '', groupId: 'grp-default', os: 'Windows', location: 'Local' },
];

function positiveProfileNumber(value) {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : 0;
}


function normalizeOptionalWebUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^about:(blank|newtab)$/i.test(raw)) return raw.toLowerCase();
  const normalized = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed;
  try { parsed = new URL(normalized); } catch (_) { throw new Error(tx('打开网页地址无效')); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(tx('打开网页仅支持 HTTP 或 HTTPS 地址'));
  return parsed.href;
}

function cloneProfilePreferences(profile) {
  const value = normalizeProfileSettings(profile);
  const privacy = structuredClone(value.privacy || {});
  // Preferences may be shared, but an anti-detect identity must not be duplicated.
  // The new profile id deterministically creates its own marks/snapshots on first start.
  delete privacy.fingerprint;
  delete privacy.batterySnapshot;
  delete privacy.mediaLabels;
  return {
    os: value.os,
    userAgent: value.userAgent,
    width: value.width,
    height: value.height,
    note: value.note,
    platform: {
      type: value.platform?.type || 'other',
      startUrl: value.platform?.startUrl || '',
      username: '',
      password: '',
      totpSecret: '',
    },
    privacy,
    advanced: structuredClone(value.advanced || {}),
  };
}

function mergeEngineExitState(values) {
  const result = window.OpenBrowserProfileState.mergeExitState({ profiles: ui.profiles, engineProfiles: values,
    hasCredentials: proxyHasCredentials,
    restoreProxy(proxy, proxyId) {
      const item = proxyLibraryItem(proxyId);
      return item ? parseProxyInputForUi(item, item.protocol || 'socks5')?.raw || proxy : proxy;
    },
  });
  if (result.changed) {
    ui.profiles = result.profiles;
    uiStateStore.request();
  }
  return result.changed;
}

const uiStateStore = window.OpenBrowserUiState.createUiStateStore({
  read: () => localStorage.getItem(UI_KEY),
  write: (value) => localStorage.setItem(UI_KEY, value),
  getState: () => ui,
  normalizeProfile: (profile) => normalizeProfileSettings(profile),
  fallback: () => ({ profiles: defaultProfiles(), groups: defaultGroups(), logs: [] }),
  onQuota: (error) => notifyStorageQuotaExceeded(error),
  onFailure: (error) => console.warn('[OpenBrowser Storage] Unable to persist UI state:', error?.message || error),
});

function loadUi() { return uiStateStore.load(); }

function normalizeGroup(raw, index = 0) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const id = String(value.id || createGroupId()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48) || createGroupId();
  const savedColor = String(value.color || '').trim();
  const color = /^#[0-9a-fA-F]{6}$/.test(savedColor)
    ? savedColor.toUpperCase()
    : GROUP_COLORS[index % GROUP_COLORS.length];
  return {
    id,
    name: String(value.name || t('groups.unnamed')).trim().slice(0, 40) || t('groups.unnamed'),
    color,
    note: String(value.note || '').slice(0, 200),
    sort: Number.isFinite(Number(value.sort)) ? Number(value.sort) : index,
    createdAt: value.createdAt || new Date().toISOString(),
  };
}

function migrateGroups(rawGroups, profiles) {
  let groups = Array.isArray(rawGroups) ? rawGroups.map((g, i) => normalizeGroup(g, i)) : [];
  if (!groups.length) groups = defaultGroups();
  // Ensure unique ids
  const seen = new Set();
  groups = groups.filter((g) => {
    if (seen.has(g.id)) return false;
    seen.add(g.id);
    return true;
  });
  const validIds = new Set(groups.map((g) => g.id));
  // Legacy: profiles may have group_name without groupId
  for (const profile of profiles) {
    if (profile.groupId && validIds.has(profile.groupId)) continue;
    const legacyName = String(profile.group_name || profile.groupName || '').trim();
    if (legacyName) {
      let found = groups.find((g) => g.name === legacyName);
      if (!found) {
        found = normalizeGroup({ id: createGroupId(), name: legacyName, color: GROUP_COLORS[groups.length % GROUP_COLORS.length] }, groups.length);
        groups.push(found);
        validIds.add(found.id);
      }
      profile.groupId = found.id;
    } else if (profile.groupId && !validIds.has(profile.groupId)) {
      profile.groupId = UNGROUPED_ID;
    } else if (profile.groupId == null) {
      profile.groupId = UNGROUPED_ID;
    }
  }
  groups.sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name, 'zh'));
  return groups;
}

function migrateProfileNumbers(profiles, savedNextNumber) {
  const used = new Set(); let cursor = 1;
  const migrated = profiles.map((profile) => {
    let number = positiveProfileNumber(profile?.number);
    if (!number || used.has(number)) { while (used.has(cursor)) cursor += 1; number = cursor; }
    used.add(number); cursor = Math.max(cursor, number + 1);
    return normalizeProfileSettings({ ...profile, number, name: String(number) });
  });
  const maximum = used.size ? Math.max(...used) : 0;
  return { profiles: migrated, nextProfileNumber: profiles.length ? Math.max(positiveProfileNumber(savedNextNumber), maximum + 1, 1) : 1 };
}

const loadedUi = loadUi();
const migratedUi = migrateProfileNumbers(loadedUi.profiles, loadedUi.nextProfileNumber);
const migratedGroups = migrateGroups(loadedUi.groups, migratedUi.profiles);
let ui = { ...loadedUi, ...migratedUi, groups: migratedGroups };
// Roxy 对齐：回收站保留 7 天，启动时自动清理过期项
const TRASH_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
let profileSort = { key: '', dir: 1 };
async function purgeExpiredTrash() {
  const now = Date.now();
  const expired = ui.profiles.filter((p) => p.trashed && p.trashedAt && now - Date.parse(p.trashedAt) > TRASH_RETENTION_MS);
  if (!expired.length) return;
  const ids = expired.map((p) => p.id);
  try {
    await window.ops.purgeProfiles(ids, true);
    ui.profiles = ui.profiles.filter((p) => !ids.includes(p.id));
    for (const id of ids) { selectedProfiles.delete(id); selectedSessions.delete(id); }
    save();
    invalidateViewCache(['profiles', 'groups']);
    renderProfiles();
    log('Trash', `已自动清理 ${ids.length} 个超过 7 天的回收站环境`);
  } catch (_) {}
}
setTimeout(() => { purgeExpiredTrash(); }, 4000);

let activeGroupFilter = 'all'; // 'all' | 'ungrouped' | groupId

let __groupListCache = null; // [groupsRef, sortedArray]
let __groupMapCache = null; // [groupsRef, Map<id, group>]
function listGroups() {
  const groups = ui.groups || [];
  if (!__groupListCache || __groupListCache[0] !== groups) {
    __groupListCache = [groups, [...groups].sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name, 'zh'))];
  }
  return __groupListCache[1];
}

function groupMap() {
  const groups = ui.groups || [];
  if (!__groupMapCache || __groupMapCache[0] !== groups) {
    __groupMapCache = [groups, new Map(groups.map((g) => [g.id, g]))];
  }
  return __groupMapCache[1];
}

function findGroup(id) {
  if (!id) return null;
  return groupMap().get(id) || null;
}

function localizeSystemLabel(name) {
  const n = String(name || '').trim();
  if (!n) return n;
  // Prefer full UI phrase map (covers 主控/工作组/代理/默认分组/…)
  if (window.OpenBrowserI18n?.translateChineseUiText) {
    const translated = window.OpenBrowserI18n.translateChineseUiText(n);
    if (translated && translated !== n) return translated;
  }
  if (n === '未分组' || n === 'Ungrouped') return t('groups.ungrouped');
  if (n === '默认分组' || n === 'Default group') return t('groups.default');
  if (n === '全部' || n === 'All') return t('groups.all');
  if (n === '全部分组' || n === 'All groups') return t('groups.allGroups');
  if (n === '主控' || n === 'Master') return t('tag.master');
  if (n === '工作组' || n === 'Workgroup') return t('tag.workgroup');
  if (n === '代理' || n === 'Proxy') return t('tag.proxy');
  return n;
}

function groupNameOf(profile) {
  const g = findGroup(profile?.groupId);
  return g ? localizeSystemLabel(g.name) : t('groups.ungrouped');
}

/** Raw stored group name (for data), not display-localized */
function groupNameRaw(profile) {
  const g = findGroup(profile?.groupId);
  return g ? g.name : '';
}

function groupColorOf(profile) {
  const g = findGroup(profile?.groupId);
  return g ? g.color : '#6b7280';
}

// One pass for every chip badge: the filter bar used to run a full profile
// scan per group on every render.
let __groupCountsCache = null;
function rebuildGroupCounts() {
  const summary = window.OpenBrowserProfileList.summarizeProfiles(ui.profiles, (id) => profileEngine(id).running);
  __groupCountsCache = summary.groups;
  return summary;
}

function countProfilesInGroup(groupId) {
  if (!__groupCountsCache) rebuildGroupCounts();
  return __groupCountsCache.get(groupId === 'ungrouped' || groupId === UNGROUPED_ID ? 'ungrouped' : groupId) || 0;
}

function fillGroupSelect(selectEl, selectedId = '', { includeAll = false, includeUngrouped = true } = {}) {
  if (!selectEl) return;
  selectEl.replaceChildren();
  if (includeAll) {
    const opt = document.createElement('option');
    opt.value = 'all';
    opt.textContent = t('groups.allGroups');
    selectEl.append(opt);
  }
  if (includeUngrouped) {
    const opt = document.createElement('option');
    opt.value = UNGROUPED_ID;
    opt.textContent = t('groups.ungrouped');
    selectEl.append(opt);
  }
  for (const g of listGroups()) {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = localizeSystemLabel(g.name);
    selectEl.append(opt);
  }
  if (selectedId === 'all' && includeAll) selectEl.value = 'all';
  else if (selectedId && [...selectEl.options].some((o) => o.value === selectedId)) selectEl.value = selectedId;
  else if (includeUngrouped) selectEl.value = UNGROUPED_ID;
}

function displayProfileNumber(profile) {
  return String(positiveProfileNumber(profile?.number) || profile?.name || profile?.id || '');
}

/** Shared square mark size — matches 环境管理 env-badge (CSS --ui-mark-size). */
const UI_MARK_SIZE = 34;

function hashHue(text) {
  const s = String(text || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function markGradientFromColor(color) {
  const raw = String(color || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    const r = parseInt(raw.slice(1, 3), 16);
    const g = parseInt(raw.slice(3, 5), 16);
    const b = parseInt(raw.slice(5, 7), 16);
    const d = (n) => Math.max(0, Math.min(255, Math.round(n * 0.72)));
    return `linear-gradient(145deg, ${raw}, rgb(${d(r)}, ${d(g)}, ${d(b)}))`;
  }
  const hue = hashHue(raw || 'default');
  return `linear-gradient(145deg, hsl(${hue} 72% 52%), hsl(${hue} 68% 38%))`;
}

/** Colored square badge (env / group / proxy / extension) — clean modern mark */
function buildSquareMark(label, { color, title, size = UI_MARK_SIZE, className = '' } = {}) {
  const badge = document.createElement('div');
  badge.className = ('env-badge ui-mark ' + (className || '')).trim();
  badge.style.width = size + 'px';
  badge.style.height = size + 'px';
  badge.style.background = markGradientFromColor(color || label);
  if (title) badge.title = title;
  const num = document.createElement('span');
  num.className = 'env-badge-num';
  const text = String(label ?? '').trim() || '?';
  num.textContent = text;
  if (text.length >= 3) num.classList.add('env-badge-num-sm');
  if (text.length >= 4) num.classList.add('env-badge-num-xs');
  badge.append(num);
  return badge;
}

function escapeXmlAttr(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isCurrentThemeLight() {
  if (typeof document === 'undefined' || !document.documentElement) return false;
  const theme = document.documentElement.dataset.uiTheme || 'modern';
  const def = (typeof UI_THEMES !== 'undefined' && UI_THEMES[theme]) ? UI_THEMES[theme] : null;
  if (def?.supportsColorMode) {
    const mode = document.documentElement.dataset.colorMode || (typeof uiColorMode !== 'undefined' ? uiColorMode : 'light');
    return mode === 'light';
  }
  return def ? def.colorScheme === 'light' : false;
}

/** Clean, professional environment badge — pure engineering aesthetics, no toy illustration */
function renderMicroWindowSvg(num, isLight = false, size = UI_MARK_SIZE) {
  const nStr = String(num);
  const len = nStr.length;
  let fontSize = 12.5;
  if (len === 3) fontSize = 11;
  else if (len >= 4) fontSize = 9.5;

  const winBg1 = isLight ? '#f4f6f8' : '#141a20';
  const winBorder = isLight ? '#c8d1d8' : '#222c36';
  const numColor = isLight ? '#2d3748' : '#d2dbe2';

  return `<svg class="env-window-svg" width="${size}" height="${size}" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="33" height="33" rx="5" fill="${winBg1}" stroke="${winBorder}" stroke-width="1" />
    <line x1="0.5" y1="9" x2="33.5" y2="9" stroke="${winBorder}" stroke-width="0.75"/>
    <circle cx="5" cy="5" r="1.2" fill="#8896a4" opacity="0.6"/>
    <circle cx="8.5" cy="5" r="1.2" fill="#8896a4" opacity="0.6"/>
    <circle cx="12" cy="5" r="1.2" fill="#8896a4" opacity="0.6"/>
    <text x="17" y="21.5" text-anchor="middle" dominant-baseline="central" 
          font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" 
          font-size="${fontSize}" font-weight="600" fill="${numColor}">${escapeXmlAttr(nStr)}</text>
  </svg>`;
}

/** Colored badge with environment number — precision miniature browser window */
function buildEnvBadge(profile, size = UI_MARK_SIZE) {
  const n = displayProfileNumber(profile);
  const isLight = isCurrentThemeLight();
  const badge = document.createElement('div');
  badge.className = 'env-badge ui-mark env-window-badge';
  badge.style.width = size + 'px';
  badge.style.height = size + 'px';
  badge.title = t('profiles.envName', { n });
  badge.innerHTML = renderMicroWindowSvg(n, isLight, size);
  return badge;
}

function buildEnvIdentity(profile) {
  const n = displayProfileNumber(profile);
  const box = document.createElement('div');
  box.className = 'profile-name env-identity';
  box.append(buildEnvBadge(profile, UI_MARK_SIZE));
  const text = document.createElement('div');
  text.className = 'env-identity-text';
  const titleText = (profile.title && String(profile.title).trim() && String(profile.title) !== String(n))
    ? String(profile.title).trim()
    : t('profiles.envName', { n });
  text.append(element('strong', '', titleText));
  const sub = (profile.tag ? localizeSystemLabel(profile.tag) : '')
    || (profile.platform?.startUrl ? String(profile.platform.startUrl).slice(0, 42) : '')
    || (profile.platform?.type && profile.platform.type !== 'other' ? String(profile.platform.type) : '')
    || '';
  if (sub && sub !== titleText) text.append(element('small', '', sub));
  text.title = [titleText, sub].filter(Boolean).join(' · ');
  box.append(text);
  return box;
}

/** Vector browser engine icons for Chromium and Microsoft Edge */
function buildBrowserEngineIcon(name, size = 26) {
  const isEdge = /edge/i.test(name);
  if (isEdge) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 27600 27600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="edge-b1" x1="6870" x2="24704" y1="18705" y2="18705" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="var(--engine-edge-b1-0, #0c59a4)"/>
          <stop offset="1" stop-color="var(--engine-edge-b1-1, #114a8b)"/>
        </linearGradient>
        <linearGradient id="edge-b2" x1="16272" x2="5133" y1="10968" y2="23102" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="var(--engine-edge-b2-0, #1b9de2)"/>
          <stop offset=".16" stop-color="var(--engine-edge-b2-1, #1595df)"/>
          <stop offset=".67" stop-color="var(--engine-edge-b2-2, #0680d7)"/>
          <stop offset="1" stop-color="var(--engine-edge-b2-3, #0078d4)"/>
        </linearGradient>
        <radialGradient id="edge-b3" cx="2523" cy="4680" r="20243" gradientTransform="matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="var(--engine-edge-b3-0, #35c1f1)"/>
          <stop offset=".11" stop-color="var(--engine-edge-b3-1, #34c1ed)"/>
          <stop offset=".23" stop-color="var(--engine-edge-b3-2, #2fc2df)"/>
          <stop offset=".31" stop-color="var(--engine-edge-b3-3, #2bc3d2)"/>
          <stop offset=".67" stop-color="var(--engine-edge-b3-4, #36c752)"/>
        </radialGradient>
      </defs>
      <path d="M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z" fill="url(#edge-b1)"/>
      <path d="M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z" fill="url(#edge-b2)"/>
      <path d="M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z" fill="url(#edge-b3)"/>
    </svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cr-green" x1="145" x2="34" y1="253" y2="61" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="var(--engine-cr-green-0, #1e8e3e)"/>
        <stop offset="1" stop-color="var(--engine-cr-green-1, #34a853)"/>
      </linearGradient>
      <linearGradient id="cr-yellow" x1="111" x2="222" y1="254" y2="62" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="var(--engine-cr-yellow-0, #fcc934)"/>
        <stop offset="1" stop-color="var(--engine-cr-yellow-1, #fbbc04)"/>
      </linearGradient>
      <linearGradient id="cr-red" x1="17" x2="239" y1="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="var(--engine-cr-red-0, #d93025)"/>
        <stop offset="1" stop-color="var(--engine-cr-red-1, #ea4335)"/>
      </linearGradient>
    </defs>
    <circle cx="128" cy="128" r="64" fill="var(--engine-cr-center-bg, #ffffff)"/>
    <path fill="url(#cr-green)" d="M96 183.4A63.7 63.7 0 0 1 72.6 160L17.2 64A128 128 0 0 0 128 256l55.4-96A64 64 0 0 1 96 183.4Z"/>
    <path fill="url(#cr-yellow)" d="M192 128a63.7 63.7 0 0 1-8.6 32L128 256A128 128 0 0 0 238.9 64h-111a64 64 0 0 1 64 64Z"/>
    <circle cx="128" cy="128" r="52" fill="var(--engine-cr-center-dot, #1a73e8)"/>
    <path fill="url(#cr-red)" d="M96 72.6a63.7 63.7 0 0 1 32-8.6h110.8a128 128 0 0 0-221.7 0l55.5 96A64 64 0 0 1 96 72.6Z"/>
  </svg>`;
}

function buildEnvBrowserCell(profile) {
  const wrap = document.createElement('div');
  wrap.className = 'env-browser-cell env-browser-cell-engine';
  const rawBrowser = String(profile.browser || '').trim();
  const isEdge = /edge/i.test(rawBrowser);
  const isFirefox = String(profile?.engine || '').toLowerCase() === 'firefox';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'browser-engine-icon';
  if (isFirefox) {
    iconWrap.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#ff7139"/><path d="M12.6 5.1c2.5 1.5 3.7 3.9 3.4 6.5-.1 1.2-.7 2.1-1.6 2.7 1.5-.2 2.6-1.2 3-2.7.5 2.6-.5 4.9-2.7 6.3-1.9 1.2-4 1.5-6.2.9C6 18.1 4.4 15.9 4.5 13.2c.1-2.1 1.2-3.8 3-4.9-.2.6-.2 1.2 0 1.7.4-1.9 1.7-3.2 3.6-3.7-.8-.6-1.7-.8-2.7-.7 1.4-1.1 3-1.5 4.2-1.2-.2-.9-1-1.6-2.1-1.9 1.6-.4 2.9-.1 4.1.6Z" fill="#fff" opacity=".92"/></svg>`;
  } else {
    iconWrap.innerHTML = buildBrowserEngineIcon(isEdge ? 'Edge' : 'Chrome', 26);
  }
  wrap.append(iconWrap);

  const label = document.createElement('div');
  label.className = 'env-browser-label';

  const engineName = isFirefox ? 'Firefox' : (isEdge ? 'Microsoft Edge' : 'Chromium');
  const versionMatch = rawBrowser.match(/\b(?:Chrome|Chromium|Edge)\/(\d+[\.\d]*)/i) || rawBrowser.match(/\b(\d{2,3})\b/);
  const fullVersion = versionMatch ? versionMatch[1] : '130';
  const displayVersion = String(fullVersion).split('.')[0] || fullVersion;

  const titleEl = element('strong', '', `${engineName} ${displayVersion}`);
  const kernelSub = isFirefox
    ? (t('profiles.kernel.firefox') || 'Firefox 内核')
    : (isEdge ? t('profiles.kernel.edge') : t('profiles.kernel.independent'));
  const subEl = element('small', '', kernelSub);

  label.append(titleEl, subEl);
  wrap.append(label);
  wrap.title = `${engineName} ${fullVersion} · ${kernelSub}`;
  return wrap;
}

function nextProfileNumber() {
  if (!ui.profiles || ui.profiles.length === 0) {
    ui.nextProfileNumber = 1;
    return 1;
  }
  const maximum = ui.profiles.reduce((value, profile) => Math.max(value, positiveProfileNumber(profile.number)), 0);
  return Math.max(positiveProfileNumber(ui.nextProfileNumber), maximum + 1, 1);
}

function createInternalProfileId(number, usedIds = new Set(ui.profiles.map((profile) => profile.id))) {
  const base = 'env-' + String(number).padStart(3, '0'); if (!usedIds.has(base)) return base;
  let suffix = 2; while (usedIds.has(base + '-' + suffix)) suffix += 1; return base + '-' + suffix;
}

let engineProfiles = [];
let extensions = [];
let appCenterTab = 'builtin';
let appCenterData = { builtin: [], recommended: [], local: [], counts: {} };
let sessions = [];
let sessionsInitialized = false;
let preferredMasterId = null;
let syncHealth = { queueDepth: 0, coalesced: 0, dropped: 0, lastLatencyMs: 0, recovering: false };
let selectedProfiles = new Set();
/** @type {Map<string, {phase:string, percent:number, message:string, updatedAt:number}>} */
const startingProfiles = new Map();
const START_PROGRESS_PHASES = {
  prepare: 6,
  proxy: 18,
  kernel: 30,
  configure: 48,
  spawn: 62,
  cdp: 76,
  inject: 88,
  ready: 100,
};
let selectedSessions = new Set();
let currentExtension = null;
let syncState = { active: false, master: null, selected: [] };
const SYNC_SETTINGS_KEY = 'openbrowser-sync-settings-v13';
const DEFAULT_SYNC_SETTINGS = Object.freeze({ keyboard: true, click: true, scroll: true, track: true, delayClick: false, delayInput: false, inputMinMs: 300, inputMaxMs: 300, clickMinMs: 100, clickMaxMs: 300 });
function normalizeSyncSettings(value = {}) {
  const number = (name, fallback) => Math.max(0, Math.min(5000, Number(value[name] ?? fallback) || 0));
  const result = { ...DEFAULT_SYNC_SETTINGS, ...value };
  for (const name of ['keyboard', 'click', 'scroll', 'track', 'delayClick', 'delayInput']) result[name] = value[name] === undefined ? DEFAULT_SYNC_SETTINGS[name] : value[name] !== false;
  result.inputMinMs = number('inputMinMs', 300); result.inputMaxMs = Math.max(result.inputMinMs, number('inputMaxMs', result.inputMinMs));
  result.clickMinMs = number('clickMinMs', 100); result.clickMaxMs = Math.max(result.clickMinMs, number('clickMaxMs', result.clickMinMs));
  return result;
}
let syncSettings = (() => { try { return normalizeSyncSettings(JSON.parse(localStorage.getItem(SYNC_SETTINGS_KEY) || '{}')); } catch (_) { return { ...DEFAULT_SYNC_SETTINGS }; } })();
let pendingDeleteProfiles = [];
let editingProfileId = null;
// Engine revision captured when the editor opened; the submit path sends it as
// the command's baseRev (profiles:apply-commands) so the engine can reject a
// save that would silently overwrite engine-side changes made meanwhile.
let editingProfileBaseRev = 0;
let editorNetworkResult = null;
let toastTimer = null;
const PROFILE_PAGE_SIZES = [10, 20, 50, 100];
const PROFILE_PAGE_SIZE_KEY = 'openbrowser-profile-page-size-v1';
let profilePage = 1;
let profilePageSize = 10;
try {
  const savedProfilePageSize = Number(localStorage.getItem(PROFILE_PAGE_SIZE_KEY));
  if (PROFILE_PAGE_SIZES.includes(savedProfilePageSize)) profilePageSize = savedProfilePageSize;
} catch (_) {}

const SPECIFIED_TEXT_GROUPS_KEY = 'openbrowser-specified-text-groups-v1';
const SPECIFIED_TEXT_GROUP_LIMIT = 20;
let specifiedTextGroupSerial = 0;

function createSpecifiedTextGroup(index = 0) {
  specifiedTextGroupSerial += 1;
  return { id: 'text-group-' + Date.now().toString(36) + '-' + specifiedTextGroupSerial, mode: 'sequence', text: '', cursor: 0, index };
}

function normalizeSpecifiedTextGroups(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, SPECIFIED_TEXT_GROUP_LIMIT).map((group, index) => {
    const source = group && typeof group === 'object' ? group : {};
    const fallback = createSpecifiedTextGroup(index);
    const id = String(source.id || fallback.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || fallback.id;
    return { id, mode: source.mode === 'random' ? 'random' : 'sequence', text: String(source.text || '').slice(0, 500000), cursor: Math.max(0, Number.parseInt(source.cursor, 10) || 0), index };
  });
}

function loadSpecifiedTextGroups() {
  try {
    const groups = normalizeSpecifiedTextGroups(JSON.parse(localStorage.getItem(SPECIFIED_TEXT_GROUPS_KEY) || '[]'));
    if (groups.length) return groups;
  } catch (_) {}
  return [createSpecifiedTextGroup(0)];
}

let specifiedTextGroups = loadSpecifiedTextGroups();

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const element = (tag, className, text) => { const value = document.createElement(tag); if (className) value.className = className; if (text !== undefined) value.textContent = text; return value; };

function toLucidePascalCase(str) {
  return String(str || '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

const ACTION_ICON_SVGS = {
  play: '<polygon points="6 3 20 12 6 21 6 3"></polygon>',
  square: '<rect width="18" height="18" x="3" y="3" rx="2"></rect>',
  'panels-top-left': '<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path><path d="m15 5 4 4"></path>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
  activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.48 12H2"></path>',
  'users-round': '<path d="M18 21a8 8 0 0 0-16 0"></path><circle cx="10" cy="8" r="5"></circle><path d="M22 20c0-.37-.06-.73-.17-1.07a5 5 0 0 0-4.4-3.93"></path><path d="M16 3.13a5 5 0 0 1 0 9.75"></path>',
  'link-2': '<path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path><line x1="8" x2="16" y1="12" y2="12"></line>',
  'trash-2': '<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line>',
};

function createLucideIconElement(iconName, customAttrs = {}) {
  try {
    const pascal = toLucidePascalCase(iconName);
    const icons = window.lucide?.icons || window.lucide;
    const def = icons?.[pascal];
    if (def && typeof window.lucide?.createElement === 'function') {
      const svg = window.lucide.createElement(def);
      if (svg) {
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('stroke-width', '1.75');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('class', `lucide lucide-${iconName}`);
        for (const [key, val] of Object.entries(customAttrs)) {
          svg.setAttribute(key, String(val));
        }
        return svg;
      }
    }
  } catch (_) {}
  if (ACTION_ICON_SVGS[iconName]) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.75');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', `lucide lucide-${iconName}`);
    for (const [key, val] of Object.entries(customAttrs)) {
      svg.setAttribute(key, String(val));
    }
    svg.innerHTML = ACTION_ICON_SVGS[iconName];
    return svg;
  }
  const glyph = document.createElement('i');
  glyph.dataset.lucide = iconName;
  glyph.setAttribute('aria-hidden', 'true');
  return glyph;
}

function iconActionButton(icon, label, className = 'mini') {
  const button = element('button', `${className} action-icon`);
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  const iconEl = createLucideIconElement(icon);
  button.append(iconEl);
  if (iconEl.tagName === 'I' && typeof refreshIcons === 'function') {
    requestAnimationFrame(() => refreshIcons());
  }
  return button;
}
let lastQuotaWarningAt = 0;
function notifyStorageQuotaExceeded(error) {
  const now = Date.now();
  if (now - lastQuotaWarningAt > 5000) {
    lastQuotaWarningAt = now;
    if (typeof toast === 'function') {
      try {
        toast(tx('本地存储空间不足，已降级精简持久化字段，部分UI状态可能未保存'), { tone: 'error' });
      } catch (_) {}
    }
  }
  console.warn('[OpenBrowser Storage] localStorage save failed, quota exceeded:', error?.message || error);
}

function save() {
  if (!Array.isArray(ui.groups)) ui.groups = defaultGroups();
  __groupListCache = null;
  __groupMapCache = null;
  return uiStateStore.save();
}
// All state/cache bindings are initialized before the first migration write.
// This removes credentials from legacy localStorage immediately after load.
save();
window.addEventListener?.('beforeunload', () => uiStateStore.flush());
window.addEventListener?.('pagehide', () => uiStateStore.flush());

function textDelayRange() { return syncSettings.delayInput ? [syncSettings.inputMinMs / 1000, syncSettings.inputMaxMs / 1000] : [0, 0]; }
function fillSyncSettingsForm() {
  const checks = { '#settings-sync-keyboard': 'keyboard', '#settings-sync-click': 'click', '#settings-sync-scroll': 'scroll', '#settings-sync-track': 'track', '#settings-delay-click': 'delayClick', '#settings-delay-input': 'delayInput' };
  for (const [selector, name] of Object.entries(checks)) { const input = $(selector); if (input) input.checked = Boolean(syncSettings[name]); }
  const values = { '#settings-input-min': 'inputMinMs', '#settings-input-max': 'inputMaxMs', '#settings-click-min': 'clickMinMs', '#settings-click-max': 'clickMaxMs' };
  for (const [selector, name] of Object.entries(values)) { const input = $(selector); if (input) input.value = syncSettings[name]; }
  if ($('#delay-input')) $('#delay-input').checked = syncSettings.delayInput;
  if ($('#delay-click')) $('#delay-click').checked = syncSettings.delayClick;
}
function syncSettingsFromForm() {
  return normalizeSyncSettings({ keyboard: $('#settings-sync-keyboard').checked, click: $('#settings-sync-click').checked, scroll: $('#settings-sync-scroll').checked, track: $('#settings-sync-track').checked, delayClick: $('#settings-delay-click').checked, delayInput: $('#settings-delay-input').checked, inputMinMs: $('#settings-input-min').value, inputMaxMs: $('#settings-input-max').value, clickMinMs: $('#settings-click-min').value, clickMaxMs: $('#settings-click-max').value });
}
async function applySyncSettings(value, announce = false) {
  syncSettings = normalizeSyncSettings(value); localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(syncSettings)); fillSyncSettingsForm();
  await window.ops.setSyncSettings(syncSettings);
  if (announce) toast('\u540c\u6b65\u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff0c\u9f20\u6807\u548c\u952e\u76d8\u5f00\u5173\u5df2\u7acb\u5373\u751f\u6548');
}
// The themed select widget (renderer-select.js) and the theme/color-mode
// system (renderer-theme.js) were extracted to sibling classic scripts that
// index.html loads before this file; their declarations remain shared
// top-level script globals (openSelectMenu/closeSelectMenu/enhanceSelects/
// syncThemedSelect(s), UI_THEMES/uiColorMode/applyUiTheme/applyColorMode...).
applyUiTheme(savedUiTheme, false);
// UI language: default = system; user can pin en/zh/ja/vi/fr/de/th/id
try {
  refreshLocaleChrome();
  window.OpenBrowserI18n?.onChange?.((resolved) => {
    invalidateViewCache();
    refreshLocaleChrome();
    applyUiTheme(document.documentElement.dataset.uiTheme || 'modern', false);
    const activeView = document.querySelector('.view.active')?.id?.replace(/^view-/, '') || 'profiles';
    if (typeof switchView === 'function') switchView(activeView);
    // invalidateViewCache() above cleared loadedViews, so switchView re-renders
    // the active view; the other views rebuild lazily on their next switch.
    // Drop the unconditional rebuilds (the sessions table used to rebuild even
    // when the sync view was never opened).
    if (typeof renderRpaStore === 'function') renderRpaStore();
    if (activeView === 'rpa' && typeof refreshRpaPage === 'function') refreshRpaPage().catch(() => {});
    if (activeView === 'api-mcp' && typeof refreshApiMcpPage === 'function') refreshApiMcpPage();
    if (typeof fillGroupSelect === 'function') {
      try {
        fillGroupSelect($('#batch-assign-group'), UNGROUPED_ID, { includeUngrouped: true });
        fillGroupSelect($('#batch-add-group'), listGroups()[0]?.id || UNGROUPED_ID);
        fillGroupSelect($('#profile-create-group'), listGroups()[0]?.id || UNGROUPED_ID);
      } catch (_) {}
    }
    // Re-read engine badge with new locale
    window.ops?.getInfo?.().then((info) => updateEngineBadge(info)).catch(() => {});
    if (typeof refreshIcons === 'function') refreshIcons();
    if (typeof syncThemedSelects === 'function') syncThemedSelects();
    document.documentElement.dataset.uiLocale = resolved;
  });
  document.getElementById('ui-locale-select')?.addEventListener('change', (event) => {
    window.OpenBrowserI18n?.setPreference?.(event.target.value);
  });
} catch (_) {}
// 启动保护（Roxy 客户端设置对齐）：内存使用率上限 / 磁盘可用空间下限 / 关闭软件行为。
try {
  const memoryInput = document.getElementById('launch-memory-limit');
  const diskInput = document.getElementById('launch-disk-limit');
  const badge = document.getElementById('launch-gate-badge');
  const statusEl = document.getElementById('launch-gate-status');
  const saveBtn = document.getElementById('launch-gate-save');
  const fillLaunchGate = (settings) => {
    if (!settings || !memoryInput || !diskInput) return;
    memoryInput.value = settings.memoryLimit ?? 95;
    diskInput.value = settings.diskLimit ?? 8;
    if (badge) badge.textContent = `${memoryInput.value}% / ${diskInput.value}GB`;
  };
  window.ops?.getClientSettings?.().then(fillLaunchGate).catch(() => {});
  saveBtn?.addEventListener('click', async () => {
    if (!memoryInput || !diskInput) return;
    try {
      const saved = await window.ops.saveClientSettings({
        memoryLimit: memoryInput.value,
        diskLimit: diskInput.value,
      });
      fillLaunchGate(saved);
      if (statusEl) statusEl.textContent = tx('已保存启动保护设置。');
    } catch (error) {
      if (statusEl) statusEl.textContent = tx('保存失败：') + error.message;
    }
  });
} catch (_) {}
// seed group selects
try {
  fillGroupSelect($('#batch-assign-group'), UNGROUPED_ID, { includeUngrouped: true });
  fillGroupSelect($('#batch-add-group'), listGroups()[0]?.id || UNGROUPED_ID);
  fillGroupSelect($('#profile-create-group'), listGroups()[0]?.id || UNGROUPED_ID);
} catch (_) {}
enhanceSelects();
new MutationObserver((records) => {
  records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node instanceof Element) enhanceSelects(node);
  }));
}).observe(document.body, { childList: true, subtree: true });

function toast(message, { tone = 'status' } = {}) {
  const value = $('#toast');
  if (!value) return;
  // Engine/IPC 错误正文多为中文短语，统一过一遍 zh→en 映射（英文与 zh 环境下均为恒等）
  const translated = typeof message === 'string'
    ? (window.OpenBrowserI18n?.translateChineseUiText?.(message) ?? message)
    : message;
  value.textContent = translated;
  value.dataset.tone = tone;
  value.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  value.setAttribute('aria-live', tone === 'error' ? 'assertive' : 'polite');
  value.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => value.classList.remove('show'), 2400);
}

async function confirmAction(options) {
  const confirmUi = window.OpenBrowserApp?.confirmAction || window.confirmAction;
  if (typeof confirmUi !== 'function') {
    toast(tx('确认服务尚未就绪，请稍后重试'), { tone: 'error' });
    return false;
  }
  return confirmUi(options);
}
let logsDirty = false;
function log(module, message) {
  ui.logs.unshift({ time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), module, message });
  ui.logs = ui.logs.slice(0, 200);
  uiStateStore.request();
  // #view-logs is hidden most of the time; rebuilding up to 200 rows per log
  // line is wasted work. Render now only while the view is active, else mark
  // dirty and render when the logs view is switched to.
  if (document.querySelector('#view-logs.view.active')) renderLogs();
  else logsDirty = true;
}
function initials(name) { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }
function isDirectProxy(value) {
  return !value || /^(direct|offline|none)$/i.test(String(value).trim());
}

function maskProxy(value) {
  const raw = String(value || '').trim();
  if (isDirectProxy(raw)) return t('net.localDirect');
  try {
    const parsed = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? new URL(raw) : null;
    // new URL yields '' for the scheme's default port, so https://proxy:443 used
    // to render as "HTTPS · proxy:" — display the effective port instead
    // (80/http, 443/https; anything else keeps its explicit port).
    if (parsed) {
      const effectivePort = parsed.port || { 'http:': 80, 'https:': 443 }[parsed.protocol] || '';
      return parsed.protocol.replace(':', '').toUpperCase() + ' · ' + parsed.hostname + ':' + effectivePort + (parsed.username ? ' · ' + t('net.auth') : '');
    }
  } catch (_) {}
  const parts = raw.split(':');
  return parts.length >= 4 ? 'SOCKS5 · ' + parts[0] + ':' + parts[1] + ' · ' + t('net.auth') : raw;
}

function networkModeBadge(proxy) {
  const wrap = document.createElement('div');
  wrap.className = 'network-mode-cell network-mode-cell-compact';
  if (isDirectProxy(proxy)) {
    const badge = element('span', 'net-badge net-badge-direct', t('net.direct'));
    badge.title = t('net.localDirect');
    wrap.append(badge);
  } else {
    const badge = element('span', 'net-badge net-badge-proxy', t('net.proxy'));
    badge.title = maskProxy(proxy);
    wrap.append(badge);
  }
  return wrap;
}
function countryFlag(code) { const value = String(code || '').toUpperCase(); return /^[A-Z]{2}$/.test(value) ? String.fromCodePoint(...[...value].map((char) => 127397 + char.charCodeAt(0))) : '🌐'; }
// Intl.DisplayNames construction is not cheap and countryName runs per row and
// per detection paste; cache one instance per resolved locale.
const countryDisplayNames = new Map();
function countryName(code) {
  const locale = window.OpenBrowserI18n?.getLocale?.() === 'zh-CN' ? 'zh-CN' : (window.OpenBrowserI18n?.getLocale?.() || 'en');
  let displayNames = countryDisplayNames.get(locale);
  if (!displayNames) {
    try {
      displayNames = new Intl.DisplayNames([locale], { type: 'region' });
      countryDisplayNames.set(locale, displayNames);
    } catch (_) { return code || ''; }
  }
  try { return displayNames.of(String(code || '').toUpperCase()) || code; } catch (_) { return code || ''; }
}
function parseEditorProxy(value) {
  const parsed = parseProxyInputForUi(value, 'socks5');
  if (!parsed) return { mode: 'direct', type: 'socks5', host: '', port: '', username: '', password: '', remark: '', name: '' };
  return { mode: 'custom', ...parsed };
}

function decodeProxyPartForUi(value) {
  const raw = String(value || '');
  try { return decodeURIComponent(raw); } catch (_) {
    return raw.replace(/(?:%[0-9a-f]{2})+/gi, (encoded) => {
      try { return decodeURIComponent(encoded); } catch (_) { return encoded; }
    });
  }
}

function normalizeProxyProtocolForUi(value, fallback = 'socks5') {
  const protocol = String(value || fallback).trim().replace(/:$/, '').toLowerCase();
  if (protocol === 'socks5h' || protocol === 'socks5s') return 'socks5';
  return ['http', 'https', 'socks4', 'socks5'].includes(protocol) ? protocol : fallback;
}

function splitProxyRemarkForUi(value) {
  const raw = String(value || '').trim();
  const at = raw.lastIndexOf('@');
  const index = at >= 0 ? raw.indexOf('#', at) : raw.indexOf('#');
  return index < 0
    ? { source: raw, remark: '' }
    : { source: raw.slice(0, index).trim(), remark: decodeProxyPartForUi(raw.slice(index + 1)).trim() };
}

function proxyHostForUi(value) {
  const host = String(value || '').trim();
  return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host;
}

function encodeProxyHostForUi(host) {
  return String(host || '').includes(':') && !String(host).startsWith('[') ? `[${host}]` : String(host || '');
}

function buildProxyUiValue({ protocol, host, port, username = '', password = '', remark = '' }) {
  const normalizedProtocol = normalizeProxyProtocolForUi(protocol);
  const cleanHost = proxyHostForUi(host);
  const numericPort = Number(port);
  if (!cleanHost || !Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    throw new Error(tx('请填写有效的代理主机和端口'));
  }
  if (!/^[a-zA-Z0-9._:-]+$/.test(cleanHost)) throw new Error(tx('代理主机格式无效'));
  const auth = username || password
    ? `${encodeURIComponent(String(username || ''))}:${encodeURIComponent(String(password || ''))}@`
    : '';
  const suffix = String(remark || '').trim() ? `#${encodeURIComponent(String(remark).trim())}` : '';
  return `${normalizedProtocol}://${auth}${encodeProxyHostForUi(cleanHost)}:${numericPort}${suffix}`;
}


function editorSet(id, value) { const field = $(id); if (field) { field.value = value ?? ''; if (field instanceof HTMLSelectElement && typeof syncThemedSelect === 'function') syncThemedSelect(field); } }
function editorCheck(id, value) { const field = $(id); if (field) field.checked = Boolean(value); }
function editorSelectedNetwork() { return document.querySelector('input[name="editor-network"]:checked')?.value || 'direct'; }

function serializeEditorProxy(strict = true) {
  if (editorSelectedNetwork() === 'direct') return 'Direct';
  const protocol = normalizeProxyProtocolForUi($('#editor-proxy-type').value); const host = $('#editor-proxy-host').value.trim(); const port = Number($('#editor-proxy-port').value);
  const username = $('#editor-proxy-user').value; const password = $('#editor-proxy-password').value;
  if (!host && !$('#editor-proxy-port').value.trim() && !username && !password) return 'Direct';
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    if (strict) throw new Error(tx('请填写有效的代理主机和端口'));
    return protocol.toUpperCase() + ' · 待完善';
  }
  return buildProxyUiValue({ protocol, host, port, username, password });
}

function editorResolution() {
  const selected = $('#editor-resolution').value;
  if (selected === 'real') {
    // 跟随系统：宽高保留原值作为回退占位，真实屏幕尺寸由引擎在启动时传入（profile.hostScreen）。
    const current = ui.profiles.find((item) => item.id === editingProfileId) || {};
    return { width: Number(current.width) || 1280, height: Number(current.height) || 820 };
  }
  if (selected !== 'custom') { const [width, height] = selected.split('x').map(Number); return { width, height }; }
  const width = Number($('#editor-width').value); const height = Number($('#editor-height').value);
  if (!Number.isInteger(width) || width < 640 || width > 7680 || !Number.isInteger(height) || height < 480 || height > 4320) throw new Error(tx('请填写有效的窗口宽度和高度'));
  return { width, height };
}

function editorCookies() {
  const raw = $('#editor-cookies').value.trim(); if (!raw) return '';
  // Roxy 对齐：支持 JSON 数组 / Netscape / Name=Value 三种格式；
  // Name=Value 未写 domain 时按当前平台启动网址自动补 domain。
  const platformSel = $('#editor-platform-type');
  const startUrl = platformSel?.selectedOptions?.[0]?.dataset.url
    || $('#editor-start-urls')?.value?.split(/\r?\n/).find((line) => line.trim())
    || '';
  let origin = '';
  try { origin = startUrl ? new URL(startUrl).origin : ''; } catch (_) { origin = ''; }
  const fromPair = (name, value, domain, path, extra) => ({
    name: String(name).trim(),
    value: String(value),
    domain: domain || (origin ? new URL(origin).hostname : ''),
    path: path || '/',
    ...extra,
  });
  const parseNetscape = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => {
    const parts = line.split('\t');
    if (parts.length < 6) return null;
    const [domain, _flag, path, secure, _expires, name, value] = parts;
    return fromPair(name, value ?? '', domain, path, { secure: secure === 'TRUE' });
  }).filter(Boolean);
  const parsePairs = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const eq = line.indexOf('=');
    if (eq <= 0) return null;
    return fromPair(line.slice(0, eq), line.slice(eq + 1), '', '/');
  }).filter(Boolean);
  if (raw.startsWith('[') || raw.startsWith('{')) {
    let values; try { values = JSON.parse(raw); } catch (_) { throw new Error(tx('Cookie JSON 格式错误')); }
    if (!Array.isArray(values)) values = [values];
    if (values.some((item) => !item || typeof item !== 'object' || typeof item.name !== 'string' || typeof item.value !== 'string')) throw new Error(tx('Cookie 必须是包含 name 和 value 的 JSON 数组'));
    return JSON.stringify(values);
  }
  if (/^#( Netscape|HTTP Cookie)/i.test(raw) || raw.includes('\t')) {
    const values = parseNetscape(raw);
    if (!values.length) throw new Error(tx('Cookie 格式错误，请检查格式'));
    return JSON.stringify(values);
  }
  const values = parsePairs(raw);
  if (!values.length) throw new Error(tx('Cookie 格式错误，请检查格式'));
  return JSON.stringify(values);
}


function updateEditorVisibility() {
  const network = editorSelectedNetwork();
  const direct = network === 'direct';
  const choose = network === 'choose';
  const proxyFields = $('#editor-proxy-fields');
  if (proxyFields) {
    proxyFields.classList.toggle('disabled', direct || choose);
    proxyFields.hidden = direct || choose;
  }
  const chooseBlock = $('#editor-proxy-choose-block');
  if (chooseBlock) chooseBlock.hidden = !choose;
  if (typeof renderDirectBanner === 'function') renderDirectBanner();
  $('#editor-timezone').hidden = $('#editor-timezone-mode').value !== 'custom';
  const geoDenied = $('#editor-geo-permission')?.value === 'deny';
  const geoGroup = $('#editor-geo-mode')?.closest('.editor-field-group');
  if (geoGroup) geoGroup.hidden = geoDenied;
  $('.geo-custom').hidden = geoDenied || $('#editor-geo-mode').value !== 'custom';
  const customResolution = $('#editor-resolution').value === 'custom'; $('#editor-width').hidden = !customResolution; $('#editor-height').hidden = !customResolution;
  $('#editor-font-size').hidden = $('#editor-font-mode').value !== 'custom';
  const webglCustom = $('#editor-webgl-meta')?.value === 'custom';
  const webglCustomCard = $('#editor-webgl-custom-fields');
  if (webglCustomCard) webglCustomCard.hidden = !webglCustom;
  const macCustom = $('#editor-mac-mode')?.value === 'custom';
  const macInput = $('#editor-mac');
  if (macInput) macInput.hidden = !macCustom;
  const macShuffle = $('#editor-mac-shuffle');
  if (macShuffle) macShuffle.hidden = !macCustom;
  const fontListCustom = $('#editor-font-list-mode')?.value === 'custom';
  const fontList = $('#editor-font-list');
  if (fontList) {
    fontList.hidden = !fontListCustom;
    fontList.closest('label')?.classList.toggle('disabled-row', !fontListCustom);
  }
  const batteryLevel = $('#editor-battery-level');
  if (batteryLevel) batteryLevel.disabled = $('#editor-battery')?.value === 'blocked';
}


function setEditorTab(tab, focus = false) {
  const tabs = $$('[data-editor-tab]');
  tabs.forEach((button) => {
    const isActive = button.dataset.editorTab === tab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
    if (!button.hasAttribute('role')) button.setAttribute('role', 'tab');
    if (isActive && focus) {
      try { button.focus(); } catch (_) {}
    }
  });
  $$('[data-editor-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.editorPanel === tab));
}


function formatProxyCheckResult(result = {}) {
  const parts = [
    result.ip || '',
    result.countryCode ? (countryFlag(result.countryCode) + ' ' + countryName(result.countryCode)) : '',
    Number.isFinite(Number(result.latencyMs)) ? (Number(result.latencyMs) + 'ms') : '',
    result.networkType || '',
    result.timezone || '',
  ].filter(Boolean);
  return parts.join(' · ');
}

function applyEditorNetworkResult(result = {}, { fillFingerprint = true } = {}) {
  editorNetworkResult = result;
  if (!fillFingerprint) return;
  if (result.timezone) {
    editorSet('#editor-timezone-mode', 'ip');
    editorSet('#editor-timezone', result.timezone);
  }
  if (result.countryCode) {
    editorSet('#editor-language-mode', 'ip');
  }
  if (window.OpenBrowserProfileValues.normalizeCoordinates(result.latitude, result.longitude).valid) {
    editorSet('#editor-geo-mode', 'ip');
  }
  updateEditorVisibility();
  renderEditorSummary();
}

async function testEditorProxy() {
  const output = $('#editor-proxy-result');
  if (output.getAttribute('aria-busy') === 'true') return;
  const profileId = editingProfileId;
  output.setAttribute('aria-busy', 'true');
  const button = $('#editor-test-proxy');
  if (button) button.disabled = true;
  try {
    const draft = editorDraft(true);
    if (/^Direct$/i.test(draft.proxy) && !draft.proxyMeta?.apiExtractUrl) throw new Error(tx('本地直连无需代理检测'));
    output.className = 'proxy-test-result';
    output.textContent = tx('正在检测代理出口...');
    const result = await window.ops.testProfileProxy(draft);
    if (editingProfileId !== profileId) return;
    const fill = $('#editor-proxy-fill-fingerprint')?.checked !== false;
    applyEditorNetworkResult(result, { fillFingerprint: fill });
    output.className = 'proxy-test-result success';
    output.textContent = tx('连接成功 · ') + formatProxyCheckResult(result);
  } catch (error) {
    output.className = 'proxy-test-result error';
    const cls = error?.errorClass ? ` [${error.errorClass}]` : '';
    if (editingProfileId === profileId) output.textContent = tx('检测失败 · ') + error.message + cls;
  } finally {
    output.setAttribute('aria-busy', 'false');
    if (button) button.disabled = false;
  }
}

async function applyEditorProxyFingerprint() {
  const output = $('#editor-proxy-result');
  try {
    const draft = editorDraft(true);
    if (/^Direct$/i.test(draft.proxy) && !draft.proxyMeta?.apiExtractUrl) throw new Error(tx('本地直连无需代理检测'));
    output.className = 'proxy-test-result';
    output.textContent = tx('正在用代理对齐指纹...');
    const result = await window.ops.applyProxyFingerprint(draft);
    applyEditorNetworkResult(result, { fillFingerprint: true });
    output.className = 'proxy-test-result success';
    output.textContent = tx('已对齐指纹 · ') + formatProxyCheckResult(result);
    toast(tx('已按出口 IP 填充时区 / 语言 / 定位'));
  } catch (error) {
    output.className = 'proxy-test-result error';
    output.textContent = tx('对齐失败 · ') + error.message;
    toast(tx('对齐失败：') + error.message);
  }
}

async function refreshEditorProxy() {
  const output = $('#editor-proxy-result');
  try {
    const draft = editorDraft(true);
    if (!draft.proxyMeta?.refreshUrl && !draft.proxyMeta?.apiExtractUrl) {
      throw new Error(tx('请先填写刷新 URL 或 API 提取 URL'));
    }
    output.className = 'proxy-test-result';
    output.textContent = tx('正在刷新代理...');
    const result = await window.ops.refreshProfileProxy(draft);
    const network = result.network || result;
    if (result.profile?.proxy) {
      try {
        const raw = String(result.profile.proxy);
        const url = new URL(raw.includes('://') ? raw : ('socks5://' + raw));
        editorSet('#editor-proxy-type', (url.protocol || 'socks5:').replace(':', '') || 'socks5');
        editorSet('#editor-proxy-host', url.hostname || '');
        editorSet('#editor-proxy-port', url.port || '');
        editorSet('#editor-proxy-user', decodeURIComponent(url.username || ''));
        editorSet('#editor-proxy-password', decodeURIComponent(url.password || ''));
      } catch (_) {}
    }
    applyEditorNetworkResult(network, { fillFingerprint: $('#editor-proxy-fill-fingerprint')?.checked !== false });
    updateEditorVisibility();
    renderEditorSummary();
    output.className = 'proxy-test-result success';
    let msg = tx('刷新成功 · ') + formatProxyCheckResult(network);
    if (result.extractError) msg += ' · ' + tx('提取警告：') + result.extractError;
    output.textContent = msg;
    toast(result.extractError ? (tx('代理已刷新（提取有警告）')) : tx('代理已刷新'));
  } catch (error) {
    output.className = 'proxy-test-result error';
    output.textContent = tx('刷新失败 · ') + error.message;
    toast(tx('刷新失败：') + error.message);
  }
}

function useSystemEditorDefaults() {
  editorSet('#editor-user-agent', ''); editorSet('#editor-timezone-mode', 'real'); editorSet('#editor-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || ''); editorSet('#editor-geo-mode', 'disabled'); editorSet('#editor-ui-language', 'system');
  editorSet('#editor-resolution', 'custom'); editorSet('#editor-width', Math.max(640, screen.availWidth || 1280)); editorSet('#editor-height', Math.max(480, screen.availHeight || 820));
  // WebGPU must stay on the product default here: "real" would pair a host adapter with a WebGL
  // identity the user may later disguise, which is a cross API contradiction a page can read.
  editorSet('#editor-webrtc', 'real'); editorSet('#editor-canvas', 'real'); editorSet('#editor-webgl', 'real'); editorSet('#editor-webgpu', 'webgl'); editorSet('#editor-audio', 'real'); editorSet('#editor-media', 'real'); editorSet('#editor-speech', 'real'); editorSet('#editor-bluetooth', 'real');
  for (const sel of ['#editor-canvas-seed', '#editor-crects-seed', '#editor-audio-seed', '#editor-battery-level', '#editor-font-list', '#editor-ssl-min', '#editor-ssl-blacklist']) editorSet(sel, '');
  editorCheck('#editor-ua-strict', false);
  updateEditorVisibility(); renderEditorSummary(); toast(tx('已读取本机安全默认值'));
  refreshUaMetaPreview().catch(() => {});
}

function editorOsToUaKey(osLabel) {
  const s = String(osLabel || '');
  if (/android/i.test(s)) return 'android';
  if (/mac/i.test(s)) return 'macos';
  if (/linux/i.test(s)) return 'linux';
  return 'windows';
}

async function applyBuiltUa(payload) {
  if (!window.ops?.buildUa) throw new Error(tx('UA 生成接口不可用，请重启应用'));
  const ua = await window.ops.buildUa(payload);
  editorSet('#editor-user-agent', ua.userAgent || '');
  // sync OS selector with generated UA platform
  if (ua.os === 'macos') editorSet('#editor-os', 'macOS');
  else if (ua.os === 'linux') editorSet('#editor-os', 'Linux');
  else if (ua.os === 'android') editorSet('#editor-os', 'Android');
  else if (ua.os === 'windows') editorSet('#editor-os', 'Windows');
  if (ua.chromeMajor) editorSet('#editor-ua-chrome-major', String(ua.chromeMajor));
  await showUaMetaPreview(ua);
  renderEditorSummary();
  return ua;
}

async function showUaMetaPreview(ua) {
  const el = document.getElementById('editor-ua-meta');
  if (!el) return;
  if (!ua) { el.hidden = true; el.textContent = ''; return; }
  const meta = ua.metadata || ua.userAgentMetadata || {};
  const brands = (meta.brands || []).map((b) => `${b.brand} ${b.version}`).join(', ');
  el.hidden = false;
  el.textContent = [
    'Client Hints / UserAgentMetadata',
    `platform: ${meta.platform || ''}  platformVersion: ${meta.platformVersion || ''}`,
    `architecture: ${meta.architecture || ''}  bitness: ${meta.bitness || ''}  mobile: ${meta.mobile}`,
    `uaFullVersion: ${meta.uaFullVersion || meta.fullVersion || ''}`,
    `brands: ${brands}`,
  ].join('\n');
}


document.getElementById('editor-ua-generate')?.addEventListener('click', async () => {
  try {
    await applyBuiltUa({
      os: editorOsToUaKey($('#editor-os')?.value),
      chromeMajor: Number($('#editor-ua-chrome-major')?.value) || 131,
    });
    toast(tx('已按系统生成 UA + Client Hints'));
  } catch (e) { toast(e.message); }
});
document.getElementById('editor-ua-random')?.addEventListener('click', async () => {
  try {
    await applyBuiltUa({
      random: true,
      chromeMajor: Number($('#editor-ua-chrome-major')?.value) || undefined,
    });
    toast(tx('已随机生成 UA'));
  } catch (e) { toast(e.message); }
});
document.getElementById('editor-ua-clear')?.addEventListener('click', () => {
  editorSet('#editor-user-agent', '');
  refreshUaMetaPreview().catch(() => {});
  renderEditorSummary();
  toast(tx('已改为自动生成'));
});
document.getElementById('editor-user-agent')?.addEventListener('input', () => {
  clearTimeout(window.__uaPreviewTimer);
  window.__uaPreviewTimer = setTimeout(() => refreshUaMetaPreview().catch(() => {}), 300);
});
document.getElementById('editor-os')?.addEventListener('change', () => refreshUaMetaPreview().catch(() => {}));

// WebGL 自定义标识随机池：按当前选择的系统给出 ANGLE 风格的常见组合（与内核预设同一命名格式）。
const WEBGL_CUSTOM_PRESETS = {
  Windows: [
    ['Google Inc. (NVIDIA)', 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'],
    ['Google Inc. (NVIDIA)', 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)'],
    ['Google Inc. (Intel)', 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)'],
    ['Google Inc. (Intel)', 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'],
    ['Google Inc. (AMD)', 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)'],
    ['Google Inc. (AMD)', 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'],
  ],
  macOS: [
    ['Google Inc. (Apple)', 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)'],
    ['Google Inc. (Apple)', 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)'],
    ['Google Inc. (Intel)', 'ANGLE (Intel, Intel(R) Iris(TM) Plus Graphics 655, OpenGL 4.1)'],
  ],
  Linux: [
    ['Google Inc. (Intel)', 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL 4.6)'],
    ['Google Inc. (AMD)', 'ANGLE (AMD, AMD Radeon RX 6700 XT (radeonsi navi22 llvm), OpenGL 4.6)'],
  ],
  Android: [
    ['Google Inc. (Qualcomm)', 'ANGLE (Qualcomm, Adreno (TM) 740, OpenGL ES 3.2)'],
    ['Google Inc. (ARM)', 'ANGLE (ARM, Mali-G715, OpenGL ES 3.2)'],
  ],
};
function editorWebglShuffle() {
  const presets = WEBGL_CUSTOM_PRESETS[$('#editor-os')?.value] || WEBGL_CUSTOM_PRESETS.Windows;
  const picked = presets[Math.floor(Math.random() * presets.length)];
  editorSet('#editor-webgl-vendor', picked[0]);
  editorSet('#editor-webgl-renderer', picked[1]);
}
document.getElementById('editor-webgl-vendor-shuffle')?.addEventListener('click', () => { editorWebglShuffle(); renderEditorSummary(); });
document.getElementById('editor-webgl-renderer-shuffle')?.addEventListener('click', () => { editorWebglShuffle(); renderEditorSummary(); });
document.getElementById('editor-os')?.addEventListener('change', () => {
  if ($('#editor-webgl-meta')?.value === 'custom') editorWebglShuffle();
});

// MAC 随机：本地管理位（第 2 个十六进制位取 2/6/A/E）+ 随机 5 字节，冒号分隔。
document.getElementById('editor-mac-shuffle')?.addEventListener('click', () => {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  const second = ['2', '6', 'A', 'E'][Math.floor(Math.random() * 4)];
  const mac = [hex()[0] + second, hex(), hex(), hex(), hex(), hex()].join(':');
  editorSet('#editor-mac', mac);
  renderEditorSummary();
});

document.getElementById('editor-random-fp')?.addEventListener('click', () => {
  if (typeof randomizeFingerprintDraft === 'function') {
    randomizeFingerprintDraft();
    toast(tx('已切换为随机指纹组合，点「立即保存」后生效'));
  }
});

// engineProfiles is reassigned at many call sites, so the id index is rebuilt
// lazily whenever the array identity changes: one Map per burst instead of a
// linear scan over all engine states per rendered row.
let __engineProfilesById = new Map();
let __engineProfilesIndexedFor = null;
function profileEngine(id) {
  if (engineProfiles !== __engineProfilesIndexedFor) {
    __engineProfilesIndexedFor = engineProfiles;
    __engineProfilesById = new Map(engineProfiles.map((item) => [item.id, item]));
  }
  return __engineProfilesById.get(id) || { running: false, assignedExtensions: [] };
}

function viewMetaFor(view) {
  const map = {
    profiles: ['view.profiles', 'view.profiles.sub'],
    'profile-editor': ['view.profile-editor', 'view.profile-editor.sub'],
    groups: ['view.groups', 'view.groups.sub'],
    proxies: ['view.proxies', 'view.proxies.sub'],
    extensions: ['view.extensions', 'view.extensions.sub'],
    sync: ['view.sync', 'view.sync.sub'],
    rpa: ['view.rpa', 'view.rpa.sub'],
    'rpa-guide': ['view.rpa.guide', 'view.rpa.guide.sub'],
    'api-mcp': ['view.api-mcp', 'view.api-mcp.sub'],
    logs: ['view.logs', 'view.logs.sub'],
    kernels: ['view.kernels', 'view.kernels.sub'],
    system: ['view.system', 'view.system.sub'],
  };
  const keys = map[view] || map.profiles;
  return [t(keys[0]), t(keys[1])];
}

let proxyLibrary = [];
const selectedProxies = new Set();
let editingProxyRecord = null;

function profileProxyId(profile) {
  const source = profile && typeof profile === 'object' ? profile : {};
  const meta = source.proxyMeta && typeof source.proxyMeta === 'object' ? source.proxyMeta : {};
  for (const key of ['proxyId', 'proxy_id', 'proxyLibraryId', 'proxy_library_id']) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return String(source[key] || '').trim();
  }
  for (const key of ['proxyId', 'proxy_id', 'proxyLibraryId', 'proxy_library_id']) {
    if (Object.prototype.hasOwnProperty.call(meta, key)) return String(meta[key] || '').trim();
  }
  return '';
}

function normalizeProxyAssociationForUi(profile, proxyId) {
  const next = { ...(profile || {}) };
  for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId', 'proxyIdAlias', 'proxyLibraryIdAlias']) delete next[key];
  const meta = { ...(next.proxyMeta || {}) };
  for (const key of ['proxy_id', 'proxy_library_id', 'proxyLibraryId', 'proxyIdAlias', 'proxyLibraryIdAlias']) delete meta[key];
  const id = String(proxyId || '').trim() || null;
  next.proxyId = id;
  meta.proxyId = id;
  next.proxyMeta = meta;
  return next;
}

function proxyLibraryItem(id) {
  const value = String(id || '').trim();
  return value ? proxyLibrary.find((item) => String(item.id) === value) || null : null;
}

function proxyLibraryLabel(item) {
  const host = item?.host && item?.port ? `${item.host}:${item.port}` : (item?.raw || '');
  return `${item?.name || host || '代理'}${host && item?.name ? ` · ${host}` : ''}`;
}

function renderProxyLibrarySelect(select, selectedId = '', { includeManual = true, includeMissing = true } = {}) {
  if (!select) return;
  const value = String(selectedId || '').trim();
  select.replaceChildren();
  if (includeManual) select.append(new Option(tx('手动填写代理（不关联代理库）'), ''));
  for (const item of proxyLibrary) {
    select.append(new Option(proxyLibraryLabel(item), String(item.id)));
  }
  if (includeMissing && value && !proxyLibraryItem(value)) {
    const missing = new Option(tx('代理节点已失效 · ') + value, value);
    missing.dataset.missing = 'true';
    select.append(missing);
  }
  select.value = value;
  if (select.value !== value) select.value = '';
  syncThemedSelect(select);
}

function renderProxyLibrarySelectors() {
  renderProxyLibrarySelect($('#create-proxy-library'), $('#create-proxy-library')?.value || '');
  renderProxyLibrarySelect($('#editor-proxy-library'), profileProxyId(ui.profiles.find((item) => item.id === editingProfileId)));
  renderProxyLibrarySelect($('#batch-add-proxy-library'), $('#batch-add-proxy-library')?.value || '');
}

function switchView(view) {
  if (view !== 'profile-editor') openProfileEditor.cancel?.();
  try {
    const currentActive = document.querySelector('.view.active')?.id?.replace(/^view-/, '');
    if (currentActive) {
      viewScrollPositions.set(currentActive, window.scrollY || document.documentElement.scrollTop || 0);
    }
  } catch (_) {}

  $$('.nav').forEach((button) => {
    if (button.id === 'rpa-menu-toggle') {
      // parent group: active while any RPA sub-page is open
      button.classList.toggle('active', view === 'rpa');
      return;
    }
    if (button.classList.contains('nav-child') && button.dataset.view === 'rpa') {
      // child active state is refined in showRpaPanel
      button.classList.toggle('active', view === 'rpa' && button.dataset.rpaTab === (currentRpaTab || 'flows'));
      return;
    }
    button.classList.toggle('active', button.dataset.view === view);
  });
  $$('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
  const meta = viewMetaFor(view);
  $('#page-title').textContent = meta[0]; $('#page-subtitle').textContent = meta[1];
  if (view === 'sync') {
    if (!loadedViews.has('sync')) {
      refreshSessions();
    } else if (sessionsDirty) {
      sessionsDirty = false;
      refreshSessions();
    }
  }
  if (view === 'extensions') {
    if (!loadedViews.has('extensions')) {
      refreshExtensions();
    }
  }
  if (view === 'proxies') {
    if (!loadedViews.has('proxies')) {
      refreshProxies();
    }
  }
  if (view === 'groups') {
    if (!loadedViews.has('groups')) {
      renderGroupsPage();
    }
  }
  if (view === 'kernels') {
    try { window.ensureKernelInitialLoad?.(); } catch (_) {}
    window.refreshKernelPanel?.();
    window.refreshKernelInstalledList?.();
  }
  if (view === 'profiles') {
    if (!loadedViews.has('profiles')) {
      renderProfiles();
    }
  }
  if (view === 'rpa') {
    // Single source of truth (ui-rpa.js keeps its own private copy; the old
    // implicit global threw ReferenceError when reached before any click).
    const tab = arguments[1] || window.currentRpaTab || 'flows';
    showRpaPanel(tab);
    if (!loadedViews.has('rpa')) {
      refreshRpaPage().catch(() => {});
      loadedViews.add('rpa');
    }
  } else {
    // leaving RPA does not force-collapse; user may re-open later
    document.getElementById('rpa-menu-toggle')?.classList.remove('open');
  }
  if (view === 'api-mcp') {
    if (!loadedViews.has('api-mcp')) {
      refreshApiMcpPage();
      loadedViews.add('api-mcp');
    }
  }
  if (view === 'logs' && logsDirty) {
    logsDirty = false;
    renderLogs();
  }

  try {
    const targetScroll = viewScrollPositions.get(view);
    if (typeof targetScroll === 'number') {
      window.scrollTo({ top: targetScroll, behavior: 'instant' });
    }
  } catch (_) {}
}

function renderGroupFilterChips(summary = rebuildGroupCounts()) {
  // Cheap renderKey: the chips are rebuilt from the same group list on every
  // profile refresh tick; skip the DOM teardown when nothing visible changed
  // (group identity+color+label, per-chip counts, active filter, trash count).
  const host = $('#profile-group-chips');
  if (!host) return;
  const trashedCount = summary.trash;
  const groups = listGroups();
  const renderKey = JSON.stringify({
    groups: groups.map((g) => [g.id, g.color || '', localizeSystemLabel(g.name), countProfilesInGroup(g.id)]),
    all: summary.all,
    ungrouped: countProfilesInGroup('ungrouped'),
    trash: trashedCount,
    active: activeGroupFilter,
  });
  if (renderKey === renderGroupFilterChips._lastKey) return;
  renderGroupFilterChips._lastKey = renderKey;
  host.replaceChildren();
  const mk = (id, label, count) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group-chip' + (activeGroupFilter === id ? ' active' : '');
    btn.dataset.groupFilter = id;
    const g = findGroup(id);
    if (g?.color) btn.style.setProperty('--chip-color', g.color);
    const dot = document.createElement('span');
    dot.className = 'dot';
    const text = document.createElement('span');
    text.textContent = label;
    const badge = document.createElement('b');
    badge.textContent = String(count);
    btn.append(dot, text, badge);
    return btn;
  };
  const trashBtn = mk('trash', t('groups.trash'), trashedCount);
  host.append(mk('all', t('groups.all'), summary.all));
  host.append(mk('ungrouped', t('groups.ungrouped'), countProfilesInGroup('ungrouped')));
  for (const g of groups) {
    host.append(mk(g.id, localizeSystemLabel(g.name), countProfilesInGroup(g.id)));
  }
  trashBtn.classList.add('trash-chip');
  host.append(trashBtn);
}

function updateProfileSelectionUi() {
  const currentIds = new Set(ui.profiles.map((profile) => profile.id));
  for (const id of selectedProfiles) if (!currentIds.has(id)) selectedProfiles.delete(id);
  const count = selectedProfiles.size;
  const bar = $('#profile-selection-bar');
  const label = $('#profile-selection-count');
  if (label) label.textContent = t('profiles.selected', { n: count });
  if (bar) {
    bar.hidden = count === 0;
    bar.classList.toggle('is-visible', count > 0);
  }
  const inTrash = activeGroupFilter === 'trash';
  const restoreBtn = $('#restore-selected');
  if (restoreBtn) restoreBtn.hidden = !inTrash;
  const normalActions = [
    '#start-selected',
    '#stop-selected',
    '#copy-selected',
    '#batch-edit-preferences',
    '#batch-note',
    '#batch-tag',
    '#batch-update',
    '#batch-set-direct',
    '.batch-group-assign',
    '#batch-assign-group-btn',
  ];
  for (const sel of normalActions) {
    const el = $(sel);
    if (el) el.hidden = inTrash;
  }
  const deleteBtn = $('#delete-selected');
  if (deleteBtn) {
    const textSpan = deleteBtn.querySelector('span');
    if (textSpan) {
      textSpan.textContent = inTrash ? t('trash.purge') : t('profiles.batchDelete');
    }
  }
  $$('#profile-table tr[data-profile-id]').forEach((row) => {
    row.classList.toggle('selected-row', selectedProfiles.has(row.dataset.profileId));
  });
  const visibleCheckboxes = $$('#profile-table [data-profile-select]');
  const selectedOnPage = visibleCheckboxes.filter((input) => selectedProfiles.has(input.dataset.profileSelect)).length;
  const selectAll = $('#select-all-profiles');
  if (selectAll) {
    selectAll.setAttribute('aria-label', t('profiles.selectPage'));
    selectAll.checked = visibleCheckboxes.length > 0 && selectedOnPage === visibleCheckboxes.length;
    selectAll.indeterminate = selectedOnPage > 0 && selectedOnPage < visibleCheckboxes.length;
  }
}

function setStartingProgress(id, progress = {}) {
  if (!id) return;
  const prev = startingProfiles.get(id) || {};
  const percentRaw = Number(progress.percent);
  const percent = Number.isFinite(percentRaw)
    ? Math.max(0, Math.min(100, Math.round(percentRaw)))
    : (START_PROGRESS_PHASES[progress.phase] ?? prev.percent ?? 8);
  startingProfiles.set(id, {
    phase: progress.phase || prev.phase || 'prepare',
    percent,
    message: progress.message || prev.message || t('status.starting'),
    updatedAt: Date.now(),
  });
}

function clearStartingProgress(id) {
  if (id) startingProfiles.delete(id);
  else startingProfiles.clear();
}

function startProgressLabel(progress) {
  if (!progress) return t('status.starting');
  const phaseKey = progress.phase ? `status.startPhase.${progress.phase}` : '';
  const phaseText = phaseKey && t(phaseKey) !== phaseKey ? t(phaseKey) : '';
  if (phaseText) return phaseText;
  if (progress.message) return progress.message;
  return t('status.starting');
}

function buildStartProgressCell(profileId, progress) {
  const wrap = element('div', 'start-progress');
  wrap.dataset.profileId = profileId;
  wrap.dataset.phase = progress?.phase || 'prepare';
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  const label = element('span', 'start-progress-label', startProgressLabel(progress));
  const track = element('div', 'start-progress-track');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  const percent = Math.max(0, Math.min(100, Number(progress?.percent) || 8));
  track.setAttribute('aria-valuenow', String(percent));
  track.setAttribute('aria-label', startProgressLabel(progress));
  const fill = element('div', 'start-progress-fill');
  fill.style.width = `${percent}%`;
  const shimmer = element('span', 'start-progress-shimmer');
  fill.append(shimmer);
  track.append(fill);
  const pct = element('span', 'start-progress-percent', `${percent}%`);
  wrap.append(label, track, pct);
  wrap.title = progress?.message || startProgressLabel(progress);
  return wrap;
}

// In-place patch for an existing start-progress cell: mid-launch progress
// events change only phase/percent/label, and rebuilding the whole table for
// each of them (batch start = N rows × 8 events) is pure churn.
function updateStartProgressCell(wrap, progress) {
  if (!wrap || !progress) return;
  const percent = Math.max(0, Math.min(100, Number(progress.percent) || 8));
  const label = startProgressLabel(progress);
  wrap.dataset.phase = progress.phase || 'prepare';
  wrap.title = progress.message || label;
  const labelEl = wrap.querySelector('.start-progress-label');
  if (labelEl) labelEl.textContent = label;
  const track = wrap.querySelector('.start-progress-track');
  if (track) {
    track.setAttribute('aria-valuenow', String(percent));
    track.setAttribute('aria-label', label);
  }
  const fill = wrap.querySelector('.start-progress-fill');
  if (fill) fill.style.width = `${percent}%`;
  const pct = wrap.querySelector('.start-progress-percent');
  if (pct) pct.textContent = `${percent}%`;
}


async function cloneProfile(id) {
  const target = ui.profiles.find((item) => item.id === id);
  if (!target) return toast(tx('未找到要克隆的环境'));
  const number = nextProfileNumber();
  const newId = createInternalProfileId(number);
  const cloned = normalizeProfileSettings({
    ...JSON.parse(JSON.stringify(target)),
    id: newId,
    number,
    name: String(number),
    title: target.title ? `${target.title} ${tx('(副本)')}` : '',
    cookies: '',
    exitIp: '',
    exitCountryCode: '',
    exitTimezone: '',
    exitLatitude: '',
    exitLongitude: '',
    exitCheckedAt: '',
    exitLatencyMs: '',
    exitNetworkType: '',
  });
  ui.profiles.push(cloned);
  ui.nextProfileNumber = number + 1;
  save();
  invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
  try {
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    toast(tx(`已克隆环境 #${displayProfileNumber(target)} 到 #${number}`));
    log('Profile', `克隆环境 #${displayProfileNumber(target)} 到 #${number}`);
  } catch (error) {
    ui.profiles = ui.profiles.filter((p) => p.id !== newId);
    save();
    toast(tx('克隆失败：' + error.message));
  }
}

async function restoreProfile(id) {
  try {
    await window.ops.restoreProfiles([id]);
    const target = ui.profiles.find((item) => item.id === id);
    if (target) {
      delete target.trashed;
      delete target.trashedAt;
    }
    save();
    invalidateViewCache(['profiles', 'groups', 'sync']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    toast(t('trash.restored'));
  } catch (error) {
    toast(t('trash.restoreFailed') + ': ' + error.message);
  }
}

async function purgeProfile(id) {
  const target = ui.profiles.find((item) => item.id === id);
  if (!await confirmAction({
    title: t('trash.purge'),
    message: t('trash.confirmPurgeSingle'),
    confirmLabel: t('trash.purge'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.purgeProfiles([id], true);
    ui.profiles = ui.profiles.filter((item) => item.id !== id);
    selectedProfiles.delete(id);
    selectedSessions.delete(id);
    save();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    toast(t('trash.purged'));
  } catch (error) {
    toast(t('trash.purgeFailed') + ': ' + error.message);
  }
}

function filteredProfilesForCurrentView() {
  return window.OpenBrowserProfileList.filterProfiles({
    profiles: ui.profiles,
    activeGroupFilter,
    query: $('#profile-search')?.value || '',
    displayProfileNumber,
    groupNameOf,
    activeListTab,
    advancedFilter: advancedFilterState,
    isRunning: (id) => profileEngine(id).running,
    sort: profileSort,
  });
}

// ===== Roxy 对齐：列表标签条 / 行更多菜单 / 收藏 / 导出窗口 =====
let activeListTab = 'all';
function renderListTabs(counts = rebuildGroupCounts()) {
  const row = $('#profile-list-tabs');
  if (!row) return;
  row.querySelectorAll('.list-tab').forEach((tab) => {
    const key = tab.dataset.listTab;
    tab.classList.toggle('active', key === (key === 'trash' ? (activeGroupFilter === 'trash' ? 'trash' : activeListTab) : activeListTab));
    let count = tab.querySelector('.list-tab-count');
    if (!count) { count = element('span', 'list-tab-count'); tab.append(count); }
    count.textContent = String(counts[key] ?? 0);
  });
}
function switchListTab(tab) {
  activeListTab = tab;
  if (tab === 'trash') { if (activeGroupFilter !== 'trash') { activeGroupFilter = 'trash'; } }
  else if (activeGroupFilter === 'trash') { activeGroupFilter = 'all'; }
  profilePage = 1;
  renderProfiles();
}
function closeRowMoreMenu() {
  document.querySelectorAll('.row-more-menu').forEach((menu) => menu.remove());
}
// Roxy 对齐：行菜单全集（查看/编辑/开关/重启/收藏/复制ID/备注/标签/测代理/导出/克隆/清缓存 + 删除）
function rowMenuItemsFor(profile, info) {
  return [
    ['view', t('profiles.menuView') || '查看窗口', 'eye'],
    ['edit', t('profiles.menuEdit') || '编辑窗口', 'pencil'],
    [info.running ? 'stop' : 'start', info.running ? (t('action.stop')) : (t('profiles.openProfile') || '打开窗口'), 'play'],
    ...(info.running ? [['restart', t('profiles.menuRestart') || '重启窗口', 'rotate-cw']] : []),
    ['fav', profile.favorite ? (t('profiles.unfavorite') || '取消收藏') : (t('profiles.favorite') || '收藏'), 'star'],
    ['copy-id', t('profiles.copyId') || '复制窗口 ID', 'copy'],
    ['note', profile.note ? (t('profiles.editNote') || '修改备注') : (t('profiles.addNote') || '添加备注'), 'sticky-note'],
    ['tag', t('profiles.menuTag') || '添加标签', 'tags'],
    ['check-proxy', t('profiles.menuCheckProxy') || '测试代理 IP', 'radar'],
    ['export-profile', t('profiles.exportProfile') || '导出窗口', 'download'],
    ['clone', t('action.clone') || '克隆', 'copy-plus'],
    ['clear-cache', t('profiles.menuClearCache') || '清除缓存', 'eraser'],
  ];
}
function fillRowMenu(menu, profile, info) {
  for (const [act, label, icon] of rowMenuItemsFor(profile, info)) {
    const btn = element('button', '', '');
    btn.dataset.action = act;
    btn.dataset.id = profile.id;
    btn.innerHTML = `<i data-lucide="${icon}"></i><span></span>`;
    btn.querySelector('span').textContent = label;
    menu.append(btn);
  }
  const danger = element('button', '', '');
  danger.dataset.action = activeGroupFilter === 'trash' ? 'purge' : 'trash';
  danger.dataset.id = profile.id;
  danger.style.color = '#c43a49';
  danger.innerHTML = `<i data-lucide="trash-2"></i><span></span>`;
  danger.querySelector('span').textContent = t('profiles.menuDelete') || '删除窗口';
  menu.append(danger);
}
function toggleRowMoreMenu(button) {
  const wrap = button.closest('.row-more-wrap');
  if (!wrap) return;
  const existing = wrap.querySelector('.row-more-menu');
  closeRowMoreMenu();
  if (existing) return;
  const profile = ui.profiles.find((item) => item.id === button.dataset.id);
  if (!profile) return;
  const info = profileEngine(profile.id);
  const menu = element('div', 'row-more-menu');
  fillRowMenu(menu, profile, info);
  wrap.append(menu);
  refreshIcons(menu);
}
// Roxy 对齐：整行右键弹出与「其他」一致的动作菜单
// Single module-level closer so repeated right-clicks cannot stack listeners.
let activeRowMenuCloser = null;
function clearRowMenuCloser() {
  if (!activeRowMenuCloser) return;
  document.removeEventListener('click', activeRowMenuCloser.click);
  document.removeEventListener('keydown', activeRowMenuCloser.keydown);
  activeRowMenuCloser = null;
}
document.getElementById('profile-table')?.closest('table')?.addEventListener('contextmenu', (event) => {
  const row = event.target.closest('tr[data-profile-id]');
  if (!row || activeGroupFilter === 'trash') return;
  event.preventDefault();
  closeRowMoreMenu();
  const profile = ui.profiles.find((item) => item.id === row.dataset.profileId);
  if (!profile) return;
  const menu = element('div', 'row-more-menu');
  menu.style.position = 'fixed';
  menu.style.left = `${Math.min(event.clientX, window.innerWidth - 220)}px`;
  menu.style.top = `${Math.min(event.clientY, window.innerHeight - 380)}px`;
  menu.style.zIndex = '80';
  fillRowMenu(menu, profile, profileEngine(profile.id));
  document.body.append(menu);
  refreshIcons(menu);
  clearRowMenuCloser();
  const entry = {
    click: (clickEvent) => {
      if (!clickEvent.target.closest('.row-more-menu')) { closeRowMoreMenu(); clearRowMenuCloser(); }
    },
    keydown: (keyEvent) => {
      if (keyEvent.key === 'Escape') { closeRowMoreMenu(); clearRowMenuCloser(); }
    },
  };
  activeRowMenuCloser = entry;
  setTimeout(() => {
    if (activeRowMenuCloser !== entry) return;
    document.addEventListener('click', entry.click);
    document.addEventListener('keydown', entry.keydown);
  });
});

async function restartProfile(id) {
  const info = profileEngine(id);
  if (!info.running) return startProfile(id);
  try { await stopProfile(id); } catch (_) {}
  return startProfile(id);
}
async function trashProfile(id) {
  const target = ui.profiles.find((item) => item.id === id);
  if (!target) return;
  if (!await confirmAction({
    title: t('profiles.menuDelete') || '删除窗口',
    message: t('trash.trashConfirmSingle') || '您确认要将所选窗口移至回收站吗？',
    confirmLabel: t('profiles.menuDelete') || '删除窗口',
    tone: 'danger',
  })) return;
  try {
    await window.ops.trashProfiles([id]);
    target.trashed = true;
    target.trashedAt = new Date().toISOString();
    selectedProfiles.delete(id);
    selectedSessions.delete(id);
    save();
    invalidateViewCache(['profiles', 'groups', 'sync']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    toast(t('trash.trashed') || '已移入回收站');
  } catch (error) {
    toast((t('trash.trashFailed') || '移入回收站失败') + ': ' + error.message);
  }
}
async function clearProfileCache(id) {
  const profile = ui.profiles.find((item) => item.id === id);
  if (!profile) return;
  if (profileEngine(id).running) return toast(tx('请先关闭该窗口，再清除缓存'));
  if (!await confirmAction({
    title: tx('清除缓存及 Cookie'),
    message: tx('清除该环境的缓存及 Cookie？需先关闭窗口。'),
    confirmLabel: tx('确认清除'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.clearProfileCacheCookies(id);
    toast(tx('缓存及 Cookie 已清除'));
  } catch (error) {
    toast(tx('清除失败：') + error.message);
  }
}
// Roxy 对齐：批量备注 / 批量标签（行菜单单个标签也走这里）
function openBatchQuickDialog(mode, singleId = null) {
  const ids = singleId ? [singleId] : [...selectedProfiles];
  if (!ids.length) return toast(tx('请先选择环境'));
  const dialog = $('#batch-quick-dialog');
  if (!dialog) return;
  $('#batch-quick-title').textContent = t(mode === 'note' ? 'profiles.batchNote' : 'profiles.batchTag');
  $('#batch-quick-summary').textContent = t('profiles.selected', { n: ids.length });
  const field = $('#batch-quick-value');
  field.value = '';
  field.placeholder = mode === 'note' ? (t('profiles.addNote') || '添加备注') : (t('profiles.tagPlaceholder') || '输入标签');
  field.dataset.mode = mode;
  field.dataset.ids = JSON.stringify(ids);
  dialog.showModal();
  setTimeout(() => field.focus(), 60);
}
$('#batch-quick-form')?.addEventListener('submit', async (event) => {
  if (event.submitter?.value === 'cancel') return $('#batch-quick-dialog').close();
  event.preventDefault();
  const field = $('#batch-quick-value');
  const mode = field.dataset.mode || 'note';
  let ids = [];
  try { ids = JSON.parse(field.dataset.ids || '[]'); } catch (_) { ids = []; }
  const value = field.value.trim();
  for (const id of ids) {
    const profile = ui.profiles.find((item) => item.id === id);
    if (!profile) continue;
    if (mode === 'tag') profile.tag = value;
    else profile.note = value;
  }
  save();
  invalidateViewCache(['profiles', 'sync']);
  try { engineProfiles = await window.ops.syncProfiles(ui.profiles); } catch (error) { log('Error', '环境同步失败: ' + ((error && error.message) || error)); }
  $('#batch-quick-dialog').close();
  renderProfiles();
  toast(t(mode === 'tag' ? 'batch.tagApplied' : 'batch.noteApplied', { n: ids.length }));
});
$('#batch-note')?.addEventListener('click', () => openBatchQuickDialog('note'));
$('#batch-tag')?.addEventListener('click', () => openBatchQuickDialog('tag'));

// Roxy 对齐：自定义表头（列显隐，localStorage 持久化）
const PROFILE_COL_DEFS = [
  ['created', 'profiles.col.created'],
  ['updated', 'profiles.col.updated'],
  ['note', 'profiles.col.note'],
  ['tag', 'profiles.col.tag'],
  ['group', 'profiles.col.project'],
  ['lastopen', 'profiles.col.lastOpen'],
  ['ext', 'profiles.col.ext'],
  ['status', 'profiles.col.status'],
  ['remaining', 'trash.remaining'],
];
let hiddenProfileCols = new Set((() => {
  try {
    const raw = localStorage.getItem('openbrowser-profile-cols-v1');
    // Roxy 默认不展示 创建时间/更新时间（保存过列配置则按用户配置）
    if (raw == null) return ['created', 'updated'];
    return JSON.parse(raw);
  } catch (_) { return ['created', 'updated']; }
})());
function applyProfileColumnVisibility(inTrash = false) {
  const table = document.querySelector('.profile-table-compact');
  if (!table) return;
  for (const [col] of PROFILE_COL_DEFS) {
    const th = table.querySelector(`th.col-${col}`);
    if (th) th.hidden = hiddenProfileCols.has(col);
    table.classList.toggle(`hide-${col}`, hiddenProfileCols.has(col));
  }
  table.classList.toggle('cols-created', !hiddenProfileCols.has('created'));
  table.classList.toggle('cols-updated', !hiddenProfileCols.has('updated'));
  table.classList.toggle('cols-remaining', !hiddenProfileCols.has('remaining') || inTrash);
}
function renderProfileColsMenu() {
  const menuEl = $('#profile-cols-menu');
  if (!menuEl) return;
  menuEl.replaceChildren();
  for (const [col, key] of PROFILE_COL_DEFS) {
    const btn = element('button', '', '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !hiddenProfileCols.has(col);
    box.addEventListener('change', () => {
      if (box.checked) hiddenProfileCols.delete(col); else hiddenProfileCols.add(col);
      try { localStorage.setItem('openbrowser-profile-cols-v1', JSON.stringify([...hiddenProfileCols])); } catch (_) {}
      applyProfileColumnVisibility();
      renderProfileColsMenu();
    });
    const label = element('span', '', t(key));
    btn.append(box, label);
    menuEl.append(btn);
  }
}
$('#profile-cols-btn')?.addEventListener('click', (event) => {
  event.stopPropagation();
  const menuEl = $('#profile-cols-menu');
  if (!menuEl) return;
  renderProfileColsMenu();
  menuEl.hidden = !menuEl.hidden;
});
document.addEventListener('click', (event) => {
  if (event.target.closest('#profile-cols-wrap')) return;
  const menuEl = $('#profile-cols-menu');
  if (menuEl) menuEl.hidden = true;
});
// Roxy 对齐：编号/名称/最后打开/创建/更新 点击表头排序
document.querySelector('#view-profiles thead')?.addEventListener('click', (event) => {
  const th = event.target.closest('th[data-sort]');
  if (!th) return;
  const key = th.dataset.sort;
  if (profileSort.key === key) profileSort.dir = -profileSort.dir;
  else profileSort = { key, dir: 1 };
  for (const head of document.querySelectorAll('#view-profiles th[data-sort]')) head.classList.remove('sort-asc', 'sort-desc');
  th.classList.add(profileSort.dir === 1 ? 'sort-asc' : 'sort-desc');
  renderProfiles();
});

// ===== Roxy 对齐：高级筛选 + 保存筛选器 =====
let advancedFilterState = null;
let savedFilters = (() => {
  try { return JSON.parse(localStorage.getItem('openbrowser-saved-filters-v1') || '[]'); } catch (_) { return []; }
})();
const ADV_FIELDS = window.OpenBrowserProfileList.ADV_FIELDS;
function readAdvancedFilterFromPanel() {
  const state = {};
  for (const field of ADV_FIELDS) state[field] = document.getElementById(`adv-${field}`)?.value || '';
  state.status = $('#adv-status')?.value || '';
  state.fav = $('#adv-fav')?.value || '';
  return state;
}
function writeAdvancedFilterToPanel(state) {
  for (const field of ADV_FIELDS) { const el = document.getElementById(`adv-${field}`); if (el) el.value = state?.[field] || ''; }
  const statusSel = $('#adv-status'); if (statusSel) statusSel.value = state?.status || '';
  const favSel = $('#adv-fav'); if (favSel) favSel.value = state?.fav || '';
}
function advancedFilterIsEmpty(state) {
  return !state || (!ADV_FIELDS.some((field) => String(state[field] || '').trim()) && !state.status && !state.fav);
}
function applyAdvancedFilter(state) {
  advancedFilterState = advancedFilterIsEmpty(state) ? null : state;
  $('#adv-filter-btn')?.classList.toggle('active', Boolean(advancedFilterState));
  profilePage = 1;
  renderProfiles();
}
function persistSavedFilters() {
  try { localStorage.setItem('openbrowser-saved-filters-v1', JSON.stringify(savedFilters)); } catch (_) {}
}
function renderSavedFilters() {
  const list = $('#adv-saved-list');
  if (!list) return;
  list.replaceChildren();
  if (!savedFilters.length) {
    list.append(element('span', 'adv-empty', t('adv.none') || '暂无保存的筛选器'));
    return;
  }
  for (const item of savedFilters) {
    const chip = element('button', 'saved-filter-chip', '');
    chip.type = 'button';
    const label = element('span', '', item.name);
    const del = element('span', 'x', '×');
    del.title = t('common.delete') || '删除';
    chip.append(label, del);
    chip.addEventListener('click', (event) => {
      if (event.target === del) {
        savedFilters = savedFilters.filter((entry) => entry !== item);
        persistSavedFilters();
        renderSavedFilters();
        return;
      }
      writeAdvancedFilterToPanel(item.state);
      applyAdvancedFilter(item.state);
      const panel = $('#adv-filter-panel');
      if (panel) panel.hidden = true;
    });
    list.append(chip);
  }
}
$('#adv-filter-btn')?.addEventListener('click', () => {
  const panel = $('#adv-filter-panel');
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) { writeAdvancedFilterToPanel(advancedFilterState); renderSavedFilters(); }
});
$('#adv-apply')?.addEventListener('click', () => {
  applyAdvancedFilter(readAdvancedFilterFromPanel());
  const panel = $('#adv-filter-panel');
  if (panel) panel.hidden = true;
});
$('#adv-reset')?.addEventListener('click', () => { writeAdvancedFilterToPanel(null); applyAdvancedFilter(null); });
$('#adv-save')?.addEventListener('click', () => {
  const nameEl = $('#adv-save-name');
  const name = String(nameEl?.value || '').trim();
  if (!name) return toast(tx('请先填写筛选器名称'));
  const state = readAdvancedFilterFromPanel();
  savedFilters = savedFilters.filter((entry) => entry.name !== name);
  savedFilters.push({ name, state });
  if (savedFilters.length > 20) savedFilters = savedFilters.slice(-20);
  persistSavedFilters();
  if (nameEl) nameEl.value = '';
  renderSavedFilters();
  toast(t('adv.saved') || '筛选器已保存');
});

function makeEditorReadonly() {
  const form = $('#profile-editor-form');
  if (!form) return;
  form.dataset.readonly = '1';
  form.querySelectorAll('input,select,textarea').forEach((el) => { el.disabled = true; });
  form.querySelectorAll('button').forEach((btn) => { btn.disabled = true; });
  for (const id of ['#editor-back', '#editor-cancel']) { const btn = $(id); if (btn) btn.disabled = false; }
}
async function toggleProfileFavorite(id) {
  const profile = ui.profiles.find((item) => item.id === id);
  if (!profile) return;
  profile.favorite = !profile.favorite;
  save();
  invalidateViewCache('profiles');
  renderProfiles();
  toast(profile.favorite ? tx('已收藏') : tx('已取消收藏'));
}
function exportProfile(id) {
  const profile = ui.profiles.find((item) => item.id === id);
  if (!profile) return;
  closeRowMoreMenu();
  // 安全：导出配置但不导出平台密码 / 2FA 密钥（含多账号行）
  const sanitized = sanitizeProfileForExport(profile);
  const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `profile-${displayProfileNumber(profile)}-${profile.id}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(tx('窗口已导出'));
}

// One <tr> for the profile table. Pure builder — no caching, no diffing;
// renderProfiles decides whether an existing row can be reused and only
// calls this when the row's render key actually changed.
function buildProfileRow(profile) {
  const info = profileEngine(profile.id); const row = document.createElement('tr');
  row.dataset.profileId = profile.id;
  const selectCell = document.createElement('td'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedProfiles.has(profile.id); checkbox.dataset.profileSelect = profile.id; selectCell.append(checkbox);
  checkbox.setAttribute('aria-label', t('profiles.selectOne', { n: displayProfileNumber(profile) }));
  const idCell = element('td', 'col-num', displayProfileNumber(profile));
  const nameCell = document.createElement('td');
  nameCell.append(buildEnvIdentity(profile));
  if (profile.favorite) {
    const star = element('span', 'fav-star', '★');
    star.title = t('profiles.favorited') || '已收藏';
    nameCell.append(star);
  }
  const exitInfo = info.network || (profile.exitIp ? { ip: profile.exitIp, countryCode: profile.exitCountryCode } : null);
  if (exitInfo?.ip) {
    const code = String(exitInfo.countryCode || '').toUpperCase();
    const exitChip = element('small', 'exit-compact', (code ? countryFlag(code) + ' ' + code : '🌐') + ' · ' + String(exitInfo.ip).replace(/^(\d+\.\d+)\.\d+\.\d+$/, '$1.*.*'));
    exitChip.title = (exitInfo.ip || '') + (code ? ' · ' + countryName(code) : '');
    nameCell.append(exitChip);
  }
  const actionCell = document.createElement('td');
  actionCell.className = 'col-actions';
  const actions = element('div', 'actions');
  if (activeGroupFilter === 'trash') {
    const restore = iconActionButton('rotate-ccw', t('trash.restore'), 'mini restore');
    restore.dataset.action = 'restore';
    restore.dataset.id = profile.id;
    const purge = iconActionButton('trash-2', t('trash.purge'), 'mini danger purge');
    purge.dataset.action = 'purge';
    purge.dataset.id = profile.id;
    actions.append(restore, purge);
  } else {
    const openBtn = iconActionButton(info.running ? 'square' : 'play', info.running ? t('action.stop') : (startingProfiles.has(profile.id) ? t('status.starting') : (t('profiles.openProfile') || '打开窗口')), 'mini primary-outline');
    openBtn.dataset.action = info.running ? 'stop' : 'start';
    openBtn.dataset.id = profile.id;
    if (startingProfiles.has(profile.id)) {
      openBtn.disabled = true;
      openBtn.classList.add('is-starting');
      openBtn.title = startProgressLabel(startingProfiles.get(profile.id));
    }
    actions.append(openBtn);
  }
  actionCell.append(actions);
  const noteCell = element('td', 'col-note', profile.note ? String(profile.note).slice(0, 40) : '');
  noteCell.title = profile.note || '';
  const tagCell = element('td', 'col-tag', profile.tag ? localizeSystemLabel(profile.tag) : '');
  const projectCell = document.createElement('td');
  projectCell.className = 'col-group';
  const badge = element('span', 'group-badge group-badge-compact', groupNameOf(profile));
  badge.style.setProperty('--chip-color', groupColorOf(profile));
  badge.title = groupNameOf(profile);
  projectCell.append(badge);
  const lastOpenCell = element('td', 'col-lastopen', profile.lastOpenedAt ? new Date(profile.lastOpenedAt).toLocaleString() : '—');
  const createdCell = element('td', 'col-created', profile.createdAt ? new Date(profile.createdAt).toLocaleString() : '—');
  const updatedCell = element('td', 'col-updated', profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '—');
  const remainCell = element('td', 'col-remaining', trashRemainingText(profile));
  const extensionCell = element('td', 'col-ext', String(info.assignedExtensions?.length || 0));
  const statusCell = document.createElement('td');
  statusCell.className = 'col-status';
  const starting = !info.running && startingProfiles.has(profile.id);
  if (starting) {
    statusCell.append(buildStartProgressCell(profile.id, startingProfiles.get(profile.id)));
    row.classList.add('is-starting');
  } else {
    const status = element('span', `status status-compact ${info.running ? 'running' : ''}`, info.running ? t('status.run') : t('status.stop'));
    if (info.running && info.port) status.title = t('status.runningCdp', { port: info.port });
    statusCell.append(status);
  }
  const moreCell = document.createElement('td');
  moreCell.className = 'col-more';
  if (activeGroupFilter !== 'trash') {
    const moreWrap = element('div', 'row-more-wrap');
    const moreBtn = iconActionButton('ellipsis-vertical', t('profiles.more') || '更多', 'mini');
    moreBtn.dataset.action = 'more';
    moreBtn.dataset.id = profile.id;
    moreWrap.append(moreBtn);
    moreCell.append(moreWrap);
  }
  row.append(selectCell, idCell, nameCell, actionCell, noteCell, tagCell, projectCell, lastOpenCell, createdCell, updatedCell, remainCell, extensionCell, statusCell, moreCell);
  return row;
}

function trashRemainingText(profile) {
  if (!profile.trashedAt) return '—';
  const left = TRASH_RETENTION_MS - (Date.now() - Date.parse(profile.trashedAt));
  if (!Number.isFinite(left) || left <= 0) return '0';
  const hours = Math.floor(left / 3600000);
  return hours >= 24 ? `${Math.floor(hours / 24)}d` : `${hours}h`;
}

function renderProfiles() {
  const summary = rebuildGroupCounts();
  renderGroupFilterChips(summary);
  renderListTabs(summary);
  const table = $('#profile-table');
  const filtered = filteredProfilesForCurrentView();
  const pageData = window.OpenBrowserProfileList?.paginate?.(filtered, profilePage, profilePageSize)
    || { items: filtered, currentPage: 1, totalPages: 1 };
  profilePage = pageData.currentPage;
  const totalPages = pageData.totalPages;
  const visible = pageData.items;
  // Row-level diff: scheduleRenderProfiles fires on every poll-driven state
  // merge, but usually only one row's inputs changed (a badge flip, an exit-IP
  // arrival). Rebuild only rows whose render key moved; keep the rest (and
  // their DOM state — focus, tooltips, transition mid-frames) untouched.
  const renderKeyFor = (profile) => window.OpenBrowserProfileRows.profileRenderKey({
    profile, info: profileEngine(profile.id), starting: startingProfiles.get(profile.id), group: findGroup(profile.groupId),
    view: activeGroupFilter, locale: window.OpenBrowserI18n?.getLocale?.() || '', number: displayProfileNumber(profile),
    light: isCurrentThemeLight(), remaining: activeGroupFilter === 'trash' ? trashRemainingText(profile) : '',
  });
  window.OpenBrowserProfileRows.reconcileProfileRows({
    table, profiles: visible, renderKeyFor, buildRow: buildProfileRow, selectedIds: selectedProfiles,
  });
  const inTrash = activeGroupFilter === 'trash';
  applyProfileColumnVisibility(inTrash);
  const emptyBtn = $('#empty-trash-btn');
  if (emptyBtn) emptyBtn.hidden = !inTrash;
  const toolbarLeftButtons = ['#create-profile', '#batch-add', '#batch-import', '#renumber-profiles', '#batch-export', '#test-all-proxies'];
  for (const sel of toolbarLeftButtons) {
    const el = $(sel);
    if (el) el.hidden = inTrash;
  }
  const empty = $('#profile-empty');
  const hasProfiles = ui.profiles.length > 0;
  empty.hidden = filtered.length !== 0;
  table.closest('table').hidden = filtered.length === 0;
  if (filtered.length === 0) table.closest('.table-card').scrollLeft = 0;
  if (inTrash) {
    $('#profile-empty-title').textContent = t('trash.emptyTitle');
    $('#profile-empty-description').textContent = t('trash.emptyHint');
    $('#profile-clear-filters').hidden = true;
    $('#profile-empty-create').hidden = true;
  } else {
    $('#profile-empty-title').textContent = t(hasProfiles ? 'profiles.noResults' : 'profiles.empty');
    $('#profile-empty-description').textContent = t(hasProfiles ? 'profiles.filterHint' : 'profiles.emptyHint');
    $('#profile-clear-filters').hidden = !hasProfiles;
    $('#profile-empty-create').hidden = hasProfiles;
  }
  $('#profile-total').textContent = String(filtered.length);
  const totalLabel = document.querySelector('#profile-pagination .profile-total');
  if (totalLabel) {
    // Keep strong#profile-total as number; wrap prefix via data-i18n or rebuild
    const strong = totalLabel.querySelector('#profile-total');
    const num = String(filtered.length);
    if (strong) {
      totalLabel.replaceChildren(document.createTextNode(t('profiles.totalLabel')), strong);
      strong.textContent = num;
    } else {
      totalLabel.textContent = t('profiles.totalLabel') + num;
    }
  }
  const pageSize = $('#profile-page-size');
  if (pageSize) {
    const prev = pageSize.value;
    [...pageSize.options].forEach((opt) => {
      opt.textContent = t('profiles.perPageOpt', { n: opt.value });
    });
    pageSize.value = prev || String(profilePageSize);
  }
  $('#profile-page').value = String(profilePage);
  $('#profile-page').max = String(totalPages);
  $('#profile-pages').textContent = String(totalPages);
  $('#profile-page-size').value = String(profilePageSize);
  $('#profile-prev').disabled = profilePage <= 1;
  $('#profile-next').disabled = profilePage >= totalPages;
  const pageIds = visible.map((profile) => profile.id);
  const selectedOnPage = pageIds.filter((id) => selectedProfiles.has(id)).length;
  const selectAll = $('#select-all-profiles');
  selectAll.checked = pageIds.length > 0 && selectedOnPage === pageIds.length;
  selectAll.indeterminate = selectedOnPage > 0 && selectedOnPage < pageIds.length;
  updateProfileSelectionUi();
  // Translate any remaining Chinese chrome text that was just injected
  // Only rows built during this pass need i18n treatment: reused rows keep
  // their translations, and afterUiRender walks every element in scope.
  const profilesScope = document.getElementById('view-profiles') || document;
  const freshRows = profilesScope.querySelectorAll('[data-i18n-pending]');
  if (freshRows.length) {
    afterUiRender(profilesScope);
    freshRows.forEach((row) => { delete row.dataset.i18nPending; });
  }
  if (typeof refreshIcons === 'function') refreshIcons();
  loadedViews.add('profiles');
}

function visibleProfilePageIds() {
  const filtered = filteredProfilesForCurrentView();
  const pageData = window.OpenBrowserProfileList?.paginate?.(filtered, profilePage, profilePageSize)
    || { items: filtered };
  return pageData.items.map((profile) => profile.id);
}

async function refreshStatus() {
  invalidateViewCache(['sync', 'profiles']);
  await statusController.refresh(); renderProfiles();
}

// --- Render/IPC coalescing (perf) --------------------------------------------------
// Engine events arrive in bursts (a single launch emits ~8 start-progress events; a batch
// of N launches multiplies that and interleaves status events). Rendering each event
// synchronously means N×(full table rebuild) + IPC stampede → dropped frames.
// These helpers collapse a burst into at most one render per animation frame and one
// status/session fetch per ~120ms. ONLY the engine event loop uses them; synchronous
// callers (button handlers that render then read the DOM) keep the direct functions.
let __rafPending = 0;
function scheduleRenderProfiles() {
  if (__rafPending) return;
  __rafPending = requestAnimationFrame(() => { __rafPending = 0; renderProfiles(); });
}
let __profileSearchTimer = 0;
function scheduleProfileSearchRender() {
  clearTimeout(__profileSearchTimer);
  __profileSearchTimer = setTimeout(() => {
    __profileSearchTimer = 0;
    profilePage = 1;
    renderProfiles();
  }, 90);
}
let __proxySearchTimer = 0;
let __proxySearchFrame = 0;
// Typing used to re-render the whole proxy table once per animation frame;
// debounce like the other search inputs (profiles 90ms, extensions 250ms) and
// keep a rAF only for the final paint.
function scheduleProxySearchRender() {
  clearTimeout(__proxySearchTimer);
  __proxySearchTimer = setTimeout(() => {
    __proxySearchTimer = 0;
    if (__proxySearchFrame) cancelAnimationFrame(__proxySearchFrame);
    __proxySearchFrame = requestAnimationFrame(() => {
      __proxySearchFrame = 0;
      renderProxies();
    });
  }, 120);
}
// The controller owns IPC serialization and derives watermarks from actual rows.
const statusController = window.OpenBrowserStatusController.createStatusController({
  getRows: () => engineProfiles,
  setRows: (rows) => { engineProfiles = rows; },
  fetchDelta: (watermark) => window.ops.profileStatusDelta(watermark),
  fetchFull: () => window.ops.profileStatus(),
  onRows: (rows) => mergeEngineExitState(rows),
});
const __statusRefresher = window.OpenBrowserRefreshScheduler.createRefreshScheduler({
  isPaused: () => document.hidden,
  refresh: async () => {
    await statusController.refresh();
    scheduleRenderProfiles();
    if (document.querySelector('#view-proxies.view.active')) scheduleProxySearchRender();
  },
  onError: (error) => console.warn('Status refresh failed:', error.message),
});
function scheduleStatusRefresh() {
  __statusRefresher.request();
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) __statusRefresher.resume();
});
let __sessionRefreshTimer = 0;
// #view-sync is hidden most of the time; same dirty-flag pattern as logsDirty:
// rebuild sessions only while the view is active, else mark dirty and refresh
// when the user switches back to the sync view.
let sessionsDirty = false;
function scheduleSessionRefresh() {
  if (__sessionRefreshTimer) return;
  __sessionRefreshTimer = setTimeout(() => {
    __sessionRefreshTimer = 0;
    // refreshSessions() already in-flight-dedups its IPC and renders sessions itself.
    if (document.querySelector('#view-sync.view.active')) refreshSessions();
    else sessionsDirty = true;
  }, 120);
}
// -----------------------------------------------------------------------------------

async function startProfile(id) {
  invalidateViewCache(['sync', 'profiles']);
  const profile = ui.profiles.find((item) => item.id === id); if (!profile) return;
  if (profileEngine(id).running || startingProfiles.has(id)) return;
  const payload = {
    ...profile,
    group_name: groupNameRaw(profile) || '',
  };
  setStartingProgress(id, { phase: 'prepare', percent: 6, message: t('status.starting') });
  scheduleRenderProfiles();
  try {
    const result = await window.ops.startProfile(payload);
    profile.lastOpenedAt = new Date().toISOString();
    save();
    setStartingProgress(id, { phase: 'ready', percent: 100, message: t('status.startPhase.ready') });
    log('Browser', `${displayProfileNumber(profile)} 已启动 · ${result.browser} · CDP ${result.port || 'pending'}`);
    toast(tx(`${displayProfileNumber(profile)} 已启动`));
    invalidateViewCache(['sync', 'profiles']);
    scheduleStatusRefresh();
    scheduleSessionRefresh();
  } catch (error) {
    log('Error', error.message);
    toast(tx(`启动失败：${error.message}`));
  } finally {
    clearStartingProgress(id);
    invalidateViewCache(['sync', 'profiles']);
    scheduleStatusRefresh();
  }
}

/**
 * Run a batch task with bounded concurrency. Batch start/stop of N environments
 * used to await each profile in sequence; every start includes proxy probing and
 * kernel preparation, so the total wait grew linearly with N. Concurrency stays
 * modest (2-3): each launch is itself disk- and CPU-heavy, and a stampede would
 * only move the queue into the main process.
 */
async function runPool(items, worker, concurrency = 3) {
  const queue = [...items];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (cursor < queue.length) {
      const item = queue[cursor++];
      await worker(item);
    }
  });
  await Promise.all(workers);
}

// In-flight guard for stop: without it, rapid double-clicks queued duplicate
// stop IPC calls for the same profile during the window before the throttled
// status event flipped the badge (mirrors the starting guard in startProfile).
const stoppingProfiles = new Set();

async function stopProfile(id) {
  if (stoppingProfiles.has(id)) return;
  stoppingProfiles.add(id);
  try {
    invalidateViewCache(['sync', 'profiles']);
    await window.ops.stopProfile(id); const profile = ui.profiles.find((item) => item.id === id); log('Browser', `${profile?.name || id} 已停止`); scheduleStatusRefresh(); scheduleSessionRefresh();
  } catch (error) { log('Error', error.message); toast(tx(`停止失败：${error.message}`)); }
  finally { stoppingProfiles.delete(id); }
}

async function checkProfileProxy(id) {
  const profile = ui.profiles.find((item) => item.id === id); if (!profile) return;
  try {
    toast(t('profiles.proxyChecking', { n: displayProfileNumber(profile) }));
    const result = await window.ops.checkProfileProxy(profile);
    profile.exitIp = result.ip; profile.exitCountryCode = result.countryCode; profile.exitTimezone = result.timezone || ''; profile.exitLatitude = result.latitude; profile.exitLongitude = result.longitude; profile.exitCheckedAt = result.checkedAt;
    if (Number.isFinite(Number(result.latencyMs))) profile.exitLatencyMs = Number(result.latencyMs);
    if (result.networkType) profile.exitNetworkType = result.networkType;
    if (result.appliedFingerprint?.language) profile.language = result.appliedFingerprint.language;
    if (result.appliedFingerprint?.privacy) profile.privacy = { ...(profile.privacy || {}), ...result.appliedFingerprint.privacy };
    save();
    const number = displayProfileNumber(profile); await refreshStatus();
    const detail = formatProxyCheckResult(result);
    log('Proxy', '环境 ' + number + ' 出口检测成功 · ' + detail);
    toast(t('profiles.exitResult', { n: number, detail }));
  } catch (error) { log('Proxy', '环境 ' + displayProfileNumber(profile) + ' 检测失败 · ' + error.message); toast('代理检测失败：' + error.message); }
}

// The app-center / platform install view (renderer-platform-install.js:
// renderExtensions / refreshExtensions / hydrateAppCenterIcons / openAssign /
// applyAssignment) was extracted to a sibling classic script loaded before
// this file.

function orderedSelectedSessionIds() {
  const ids = [...selectedSessions];
  if (!preferredMasterId || !selectedSessions.has(preferredMasterId)) preferredMasterId = ids[0] || null;
  return preferredMasterId ? [preferredMasterId, ...ids.filter((id) => id !== preferredMasterId)] : ids;
}

function populateSyncGroups() {
  const select = $('#sync-group'); const current = select.value || 'all'; const groups = [...new Set(sessions.map((item) => String(item.profile?.tag || '未分组')))].sort();
  select.replaceChildren(); const all = document.createElement('option'); all.value = 'all'; all.textContent = tx('全部分组'); select.append(all);
  for (const group of groups) { const option = document.createElement('option'); option.value = group; option.textContent = localizeSystemLabel(group); select.append(option); }
  select.value = [...select.options].some((option) => option.value === current) ? current : 'all';
}

function renderSessions() {
  populateSyncGroups(); const group = $('#sync-group').value || 'all'; const visible = group === 'all' ? sessions : sessions.filter((item) => String(item.profile?.tag || '未分组') === group);
  const table = $('#session-table'); table.replaceChildren();
  for (const value of visible) {
    const selected = selectedSessions.has(value.id);
    const role = syncState.active && syncState.master === value.id ? t('tag.master') : syncState.active && syncState.selected.includes(value.id) ? t('tag.workgroup') : selected && preferredMasterId === value.id ? t('tag.master') : selected ? t('action.use') : t('status.stopped');
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-row');
    if ((syncState.active && syncState.master === value.id) || (!syncState.active && preferredMasterId === value.id && selected)) row.classList.add('master-row');
    const selectCell = document.createElement('td'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selected; checkbox.disabled = syncState.active; checkbox.dataset.sessionSelect = value.id; selectCell.append(checkbox);
    const statusCell = document.createElement('td'); statusCell.append(element('span', 'sync-role', role));
    const actionCell = document.createElement('td'); actionCell.className = 'sync-actions';
    const master = element('button', 'sync-show', preferredMasterId === value.id ? t('tag.master') : t('action.use')); master.dataset.masterSelect = value.id; master.disabled = syncState.active || !selected;
    const show = element('button', 'sync-show', t('action.preview')); show.dataset.showWindow = value.id; actionCell.append(master, show);
    const profile = value.profile || { id: value.id, number: value.id };
    const number = displayProfileNumber(profile);
    const idCell = document.createElement('td');
    idCell.append(buildEnvBadge(profile, UI_MARK_SIZE));
    const nameCell = document.createElement('td');
    nameCell.append(element('strong', '', (profile.title && String(profile.title) !== String(number)) ? profile.title : (t('profiles.envName', { n: number }))));
    const browserCell = document.createElement('td');
    browserCell.append(buildEnvBrowserCell(profile));
    row.append(selectCell, idCell, nameCell, browserCell, element('td', '', String(value.tabs.length)), statusCell, actionCell); table.append(row);
  }
  $('#session-empty').style.display = visible.length ? 'none' : 'block';
  $('#selected-count').textContent = t('profiles.selected', { n: selectedSessions.size });
  $('#sync-selected').textContent = t('profiles.selected', { n: selectedSessions.size });
  const allBox = $('#select-all-sessions'); allBox.checked = visible.length > 0 && visible.every((item) => selectedSessions.has(item.id)); allBox.indeterminate = visible.some((item) => selectedSessions.has(item.id)) && !allBox.checked;
  renderSyncState(); renderTabInventory();
  afterUiRender(document.getElementById('view-sync') || document);
}

function renderSyncState() {
  $('#start-sync').hidden = syncState.active;
  $('#stop-sync').hidden = !syncState.active;
  $('#restart-sync').disabled = selectedSessions.size < 2;
  $('#select-all-sessions').disabled = syncState.active; $('#sync-group').disabled = syncState.active;
  const health = $('#sync-health');
  if (!health) return;
  if (!syncState.active) { health.className = 'sync-health idle'; health.textContent = t('sync.idle'); }
  else if (syncHealth.recovering) { health.className = 'sync-health warning'; health.textContent = t('sync.recovering'); }
  else if (syncHealth.queueDepth > 24 || syncHealth.lastLatencyMs > 800) { health.className = 'sync-health warning'; health.textContent = tx(`同步繁忙 · 队列 ${syncHealth.queueDepth}`); }
  else { health.className = 'sync-health healthy'; health.textContent = tx(`同步正常 · ${syncHealth.lastLatencyMs || 0}ms`); }
}

function pushSyncSelection() {
  if (syncState.active) return renderSyncState();
  const ids = orderedSelectedSessionIds(); syncState.selected = ids;
  window.ops.setSyncSelection(ids).catch((error) => log('Error', error.message));
  renderSyncState();
}

function renderTabInventory() {
  const target = $('#tab-inventory'); target.replaceChildren();
  for (const value of sessions.filter((item) => selectedSessions.has(item.id))) { const group = element('div', 'tab-group'); group.append(element('strong', '', `${t('profiles.envName', { n: displayProfileNumber(value.profile || { id: value.id }) })} · ${value.tabs.length} ${t('common.tabs')}`)); for (const tab of value.tabs.slice(0, 6)) group.append(element('span', '', `${tab.title || 'Untitled'} — ${tab.url}`)); target.append(group); }
}

const sessionController = window.OpenBrowserSessionController.createSessionController({
  fetchSessions: () => window.ops.syncSessions(),
  getState: () => ({ selectedIds: selectedSessions, initialized: sessionsInitialized, preferredMasterId, syncState }),
  setState: (next) => {
    sessions = next.sessions;
    selectedSessions = next.selectedIds;
    sessionsInitialized = next.initialized;
    preferredMasterId = next.preferredMasterId;
  },
  onRows: () => {
    if (!syncState.active) pushSyncSelection();
    renderSessions(); loadedViews.add('sync');
  },
  onError: (error) => log('CDP', error.message),
});
function refreshSessions() { return sessionController.refresh(); }
function selectedSessionIds(minimum = 1) { const ids = orderedSelectedSessionIds(); if (ids.length < minimum) throw new Error(tx('请至少选择 ') + minimum + tx(' 个运行环境')); return ids; }
function specifiedTextItems(value) {
  return window.OpenBrowserSyncText.specifiedTextItems(value);
}

function distributeSpecifiedTexts(items, count, mode = 'sequence', cursor = 0, random = Math.random) {
  return window.OpenBrowserSyncText.distributeSpecifiedTexts(items, count, mode, cursor, random);
}

// Quota-overflow toasts are throttled so a tight save loop does not
// re-notify (and re-translate) on every keystroke.
let __specifiedTextSaveFailedAt = 0;
function saveSpecifiedTextGroups() {
  try {
    localStorage.setItem(SPECIFIED_TEXT_GROUPS_KEY, JSON.stringify(specifiedTextGroups.map(({ id, mode, text, cursor }) => ({ id, mode, text, cursor }))));
  } catch (_) {
    // Quota exceeded: the groups stay in memory but would be silently lost
    // on restart. Tell the user once per 5 seconds.
    const now = Date.now();
    if (now - __specifiedTextSaveFailedAt > 5000) {
      __specifiedTextSaveFailedAt = now;
      toast(tx('文本组保存失败：本地存储空间不足，内容将在重启后丢失'), { tone: 'error' });
    }
  }
}

function renderSpecifiedTextGroups() {
  const target = $('#specified-text-groups'); if (!target) return;
  target.replaceChildren();
  specifiedTextGroups.forEach((group, index) => {
    const card = element('article', 'specified-text-group'); card.dataset.specifiedGroup = group.id;
    const head = element('div', 'specified-text-group-head');
    head.append(element('strong', '', '\u6587\u672c\u7ec4' + (index + 1)));
    const remove = element('button', 'specified-text-remove', '\u5220\u9664'); remove.type = 'button'; remove.dataset.specifiedRemove = group.id; remove.hidden = specifiedTextGroups.length <= 1; head.append(remove);
    const modes = element('div', 'specified-text-modes');
    for (const [value, labelText] of [['sequence', '\u987a\u5e8f\u8f93\u5165'], ['random', '\u968f\u673a\u8f93\u5165']]) {
      const label = document.createElement('label'); const input = document.createElement('input');
      input.type = 'radio'; input.name = 'specified-mode-' + group.id; input.value = value; input.checked = group.mode === value; input.dataset.specifiedMode = group.id;
      label.append(input, document.createTextNode(labelText)); modes.append(label);
    }
    const textarea = document.createElement('textarea'); textarea.value = group.text; textarea.dataset.specifiedText = group.id; textarea.placeholder = '\u6bcf\u884c\u4e00\u6761\u6587\u672c\uff0c\u8f93\u5165\u65f6\u6309\u73af\u5883\u5206\u914d';
    const foot = element('div', 'specified-text-group-foot');
    const count = element('span', 'specified-text-count', specifiedTextItems(group.text).length + ' \u6761\u6587\u672c'); count.dataset.specifiedCount = group.id;
    const send = element('button', 'specified-text-send', '\u8f93\u5165 (Shift+F1)'); send.type = 'button'; send.dataset.specifiedSend = group.id;
    foot.append(count, send); card.append(head, modes, textarea, foot); target.append(card);
  });
}

function specifiedTextSessionIds() {
  return window.OpenBrowserSyncText.orderedSessionIds(selectedSessionIds(), sessions, displayProfileNumber);
}

function specifiedTextFailureLabel(id) {
  const session = sessions.find((item) => item.id === id);
  return displayProfileNumber(session?.profile || { id });
}

async function sendSpecifiedTextGroup(id) {
  const group = specifiedTextGroups.find((item) => item.id === id); if (!group) return;
  let ids;
  try { ids = specifiedTextSessionIds(); } catch (error) { return toast(error.message); }
  const items = specifiedTextItems(group.text); if (!items.length) return toast('\u8bf7\u5148\u5728\u6587\u672c\u7ec4\u4e2d\u6bcf\u884c\u586b\u5199\u4e00\u6761\u6587\u672c');
  const assignment = distributeSpecifiedTexts(items, ids.length, group.mode, group.cursor);
  const [delayMin, delayMax] = textDelayRange();
  const button = document.querySelector('[data-specified-send="' + id + '"]'); if (button) button.disabled = true;
  try {
    const label = group.mode === 'random' ? '\u968f\u673a\u6307\u5b9a\u6587\u672c' : '\u987a\u5e8f\u6307\u5b9a\u6587\u672c';
    const result = await window.ops.batchTextAction(ids, assignment.texts, delayMin, delayMax);
    log('Sync', label + ' \u00b7 ' + JSON.stringify(result));
    if (!result?.success) {
      const failed = (result?.failures || []).map((item) => specifiedTextFailureLabel(item.id));
      const suffix = failed.length ? '\uff1b\u8bf7\u5148\u5728\u73af\u5883 ' + failed.join('\u3001') + ' \u4e2d\u70b9\u51fb\u4f60\u8981\u8f93\u5165\u7684\u4f4d\u7f6e' : '';
      return toast('\u6307\u5b9a\u6587\u672c\u4ec5\u5199\u5165 ' + (result?.profiles?.length || 0) + '/' + ids.length + ' \u4e2a\u73af\u5883' + suffix);
    }
    if (group.mode === 'sequence') { group.cursor = assignment.nextCursor; saveSpecifiedTextGroups(); }
    toast(label + '\u5b8c\u6210\uff1a' + result.profiles.length + '/' + ids.length + ' \u4e2a\u73af\u5883\u5df2\u5b9e\u9645\u5199\u5165');
  } catch (error) { log('Error', error.message); toast(error.message); }
  finally { if (button) button.disabled = false; }
}
function normalizeUrl(value) { const raw = String(value || '').trim(); if (!raw) return 'about:blank'; if (/^(https?:\/\/|about:)/i.test(raw)) return raw; return `https://${raw}`; }

function normalizedProxyType(value) {
  return normalizeProxyProtocolForUi(value);
}
function normalizeProxy(value, selectedType = 'socks5') {
  const parsed = parseProxyInputForUi(value, selectedType);
  return parsed ? parsed.raw : 'Direct';
}
function proxyLines(textareaId, typeId) { return $(textareaId).value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => normalizeProxy(item, $(typeId).value)); }
async function verifyProxyAssignments(profiles, proxies) {
  if (profiles.length !== proxies.length) throw new Error('\u4ee3\u7406\u6570\u91cf\u5fc5\u987b\u4e0e\u73af\u5883\u6570\u91cf\u4e00\u81f4\uff0c\u786e\u4fdd\u6bcf\u4e2a\u73af\u5883\u7ed1\u5b9a\u81ea\u5df1\u7684\u4ee3\u7406');
  // Probe proxies with bounded concurrency (each probe is a network round-trip of
  // its own; serialising them made an N-environment batch take N x probe-time).
  // Results stay index-aligned for the caller; failures abort remaining work.
  const results = new Array(profiles.length);
  let done = 0;
  let failure = null;
  const queue = profiles.map((profile, index) => ({ profile, index }));
  const workerCount = Math.min(3, queue.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length && !failure) {
      const { profile, index } = queue.shift();
      toast('\u6b63\u5728\u68c0\u6d4b\u4ee3\u7406 ' + (done + 1) + '/' + profiles.length + '\uff08\u73af\u5883 ' + displayProfileNumber(profile) + '\uff09...');
      try { results[index] = await window.ops.testProfileProxy({ ...profile, proxy: proxies[index] }); done += 1; }
      catch (error) {
        failure = new Error('\u73af\u5883 ' + displayProfileNumber(profile) + ' \u4ee3\u7406\u4e0d\u53ef\u7528\uff1a' + error.message);
        return;
      }
    }
  });
  await Promise.all(workers);
  if (failure) throw failure;
  return results;
}
function installProxyTypeControl(textareaId, selectId) {
  const textarea = $(textareaId); if (!textarea || $(selectId)) return;
  const label = document.createElement('label'); label.className = 'proxy-type-field'; label.dataset.proxyFor = textarea.id; label.textContent = '\u4ee3\u7406\u7c7b\u578b\uff08\u672a\u586b\u5199\u524d\u7f00\u65f6\u4f7f\u7528\uff09';
  const select = document.createElement('select'); select.id = selectId;
  for (const [value, text] of [['socks5', 'SOCKS5'], ['http', 'HTTP'], ['https', 'HTTPS']]) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
  label.append(select);
  const note = element('p', 'store-note', '\u53ef\u76f4\u63a5\u8f93\u5165 IP:\u7aef\u53e3:\u7528\u6237\u540d:\u5bc6\u7801\uff1b\u68c0\u6d4b\u6210\u529f\u540e\u624d\u4f1a\u5199\u5165\u73af\u5883\u3002'); note.dataset.proxyFor = textarea.id;
  const field = textarea.closest('label') || textarea; field.before(label, note);
}
function installBatchUpdateNetworkMode() {
  const form = $('#batch-update-form');
  const hidden = $('#batch-update-network-mode');
  const fields = $('#batch-update-proxy-fields');
  const textarea = $('#batch-proxy-list');
  const submit = $('#batch-update-submit') || form?.querySelector('button.primary[value="default"]');
  if (!form || !hidden) return;
  const sync = () => {
    const selected = document.querySelector('input[name="batch-update-network"]:checked')?.value
      || (hidden.value === 'direct' ? 'direct' : 'proxy');
    const direct = selected === 'direct';
    hidden.value = direct ? 'direct' : 'proxy';
    if (fields) fields.hidden = direct;
    if (textarea) textarea.disabled = direct;
    form.querySelectorAll('[data-proxy-for="batch-proxy-list"]').forEach((item) => { item.hidden = direct; });
    if (submit) submit.textContent = direct ? tx('应用本地直连') : tx('检测并应用代理');
  };
  form.querySelectorAll('input[name="batch-update-network"]').forEach((input) => {
    input.addEventListener('change', sync);
  });
  // keep legacy select support if something still injects it
  const legacy = document.getElementById('batch-update-network-mode-select');
  if (legacy) legacy.addEventListener('change', () => { hidden.value = legacy.value; sync(); });
  sync();
}
installBatchUpdateNetworkMode();

function installCreateNetworkMode() {
  const fields = $('#create-proxy-fields');
  const input = $('#create-proxy-input');
  const sync = () => {
    const mode = document.querySelector('input[name="create-network"]:checked')?.value || 'direct';
    const direct = mode === 'direct';
    if (fields) fields.hidden = direct;
    if (input) {
      input.required = !direct;
      if (direct) input.value = '';
    }
  };
  document.querySelectorAll('input[name="create-network"]').forEach((el) => el.addEventListener('change', sync));
  sync();
}
installCreateNetworkMode();


function installBatchAddNetworkMode() {
  const fields = $('#batch-add-proxy-fields');
  const sync = () => {
    const mode = document.querySelector('input[name="batch-add-network"]:checked')?.value || 'direct';
    if (fields) fields.hidden = mode === 'direct';
  };
  document.querySelectorAll('input[name="batch-add-network"]').forEach((el) => el.addEventListener('change', sync));
  sync();
}
installBatchAddNetworkMode();
renderSpecifiedTextGroups();

async function runSyncAction(label, action) {
  try {
    const result = await action(); log('Sync', label + ' · ' + JSON.stringify(result));
    if (result?.success === false) {
      const failures = Array.isArray(result.failures) ? result.failures : [];
      const failed = failures.map((item) => specifiedTextFailureLabel(item.id)).join('、');
      toast(label + tx('仅完成 ') + (result.profiles?.length || 0) + tx(' 个环境') + (failed ? tx('；失败环境：') + failed : ''));
      await refreshSessions(); return result;
    }
    toast(label + tx('完成')); await refreshSessions(); return result;
  }
  catch (error) { log('Error', error.message); toast(error.message); return null; }
}

function renderLogs() {
  const target = $('#log-list');
  target.replaceChildren();
  if (!ui.logs.length) {
    target.append(element('div', 'log-empty', tx('暂无操作记录')));
    return;
  }
  for (const item of ui.logs) {
    const row = element('div', 'log-row');
    row.append(element('span', '', item.time), element('span', '', item.module), element('span', '', tx(item.message)));
    target.append(row);
  }
}

document.addEventListener('focusin', (event) => {
  if (!openSelectMenu || openSelectMenu.settling) return;
  if (openSelectMenu.menu.contains(event.target) || openSelectMenu.button.contains(event.target)) return;
  closeSelectMenu();
});

let shellLayoutFrame = 0;
let shellLayoutSignature = '';
let shellLayoutObserver = null;
function reconcileShellLayout() {
  shellLayoutFrame = 0;
  const content = document.querySelector('.content');
  const main = content?.querySelector(':scope > main');
  if (!content || !main) return;
  const contentRect = content.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportWidth = Math.max(0, Math.round(viewport?.width || document.documentElement.clientWidth || window.innerWidth || 0));
  const viewportHeight = Math.max(0, Math.round(viewport?.height || document.documentElement.clientHeight || window.innerHeight || 0));
  const signature = [viewportWidth, viewportHeight, Math.round(contentRect.width), Math.round(mainRect.width)].join(':');
  if (signature !== shellLayoutSignature) {
    shellLayoutSignature = signature;
    document.documentElement.style.setProperty('--openbrowser-viewport-width', `${viewportWidth}px`);
    document.documentElement.style.setProperty('--openbrowser-viewport-height', `${viewportHeight}px`);
    document.documentElement.style.setProperty('--openbrowser-content-width', `${Math.max(0, Math.round(contentRect.width))}px`);
    // Theme styles occasionally leave a historical max-width on a view. Keep
    // the live workspace tied to the actual grid track after native resizing.
    content.style.maxInlineSize = 'none';
    main.style.inlineSize = '100%';
    main.style.maxInlineSize = 'none';
    for (const view of main.querySelectorAll(':scope > .view')) {
      view.style.inlineSize = '100%';
      view.style.maxInlineSize = 'none';
    }
  }
  if (openSelectMenu) positionSelectMenu(openSelectMenu.menu, openSelectMenu.button);
}

function scheduleShellLayoutReconcile() {
  if (shellLayoutFrame) return;
  shellLayoutFrame = requestAnimationFrame(reconcileShellLayout);
}

window.addEventListener('resize', scheduleShellLayoutReconcile);
window.visualViewport?.addEventListener('resize', scheduleShellLayoutReconcile);
if (typeof ResizeObserver === 'function') {
  shellLayoutObserver = new ResizeObserver(scheduleShellLayoutReconcile);
  const content = document.querySelector('.content');
  const main = content?.querySelector(':scope > main');
  if (content) shellLayoutObserver.observe(content);
  if (main) shellLayoutObserver.observe(main);
}
scheduleShellLayoutReconcile();
// Close dropdown on outer scroll — but NOT when scrolling the menu itself
// (long lists need overflow scroll; previous capture-scroll closed them instantly)
window.addEventListener('scroll', (event) => {
  if (!openSelectMenu || openSelectMenu.settling) return;
  const target = event.target;
  if (target === openSelectMenu.menu || openSelectMenu.menu.contains(target)) return;
  // Also ignore scrolls bubbling from within the open menu (some browsers)
  if (typeof target?.closest === 'function' && target.closest('.themed-select-menu')) return;
  if (target instanceof Element && (target.contains(openSelectMenu.button) || openSelectMenu.button.closest('dialog') === target)) {
    positionSelectMenu(openSelectMenu.menu, openSelectMenu.button);
    return;
  }
  closeSelectMenu();
}, true);
document.addEventListener('keydown', (event) => {
  if (!openSelectMenu) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeSelectMenu({ restoreFocus: true });
    return;
  }
  const option = event.target.closest?.('.themed-select-option');
  if (!option || !openSelectMenu.menu.contains(option)) return;
  const options = [...openSelectMenu.menu.querySelectorAll('.themed-select-option:not(:disabled)')];
  if (!options.length) return;
  const current = Math.max(0, options.indexOf(option));
  let next = current;
  if (event.key === 'ArrowDown') next = (current + 1) % options.length;
  else if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = options.length - 1;
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    option.click();
    return;
  } else if (event.key === 'Tab') {
    closeSelectMenu();
    return;
  } else return;
  event.preventDefault();
  options[next].focus({ preventScroll: true });
  options[next].scrollIntoView({ block: 'nearest' });
});

document.addEventListener('close', (event) => {
  if (event.target instanceof HTMLDialogElement && openSelectMenu?.select.closest('dialog') === event.target) closeSelectMenu();
}, true);


$('#select-all-profiles').addEventListener('change', (event) => { for (const id of visibleProfilePageIds()) event.target.checked ? selectedProfiles.add(id) : selectedProfiles.delete(id); renderProfiles(); });
$('#select-all-sessions').addEventListener('change', (event) => { if (syncState.active) return; const group = $('#sync-group').value || 'all'; const visible = group === 'all' ? sessions : sessions.filter((item) => String(item.profile?.tag || '未分组') === group); for (const item of visible) event.target.checked ? selectedSessions.add(item.id) : selectedSessions.delete(item.id); if (!selectedSessions.has(preferredMasterId)) preferredMasterId = [...selectedSessions][0] || null; pushSyncSelection(); renderSessions(); });
$('#sync-group').addEventListener('change', () => { if (syncState.active) return; const group = $('#sync-group').value || 'all'; const values = group === 'all' ? sessions : sessions.filter((item) => String(item.profile?.tag || '未分组') === group); selectedSessions = new Set(values.map((item) => item.id)); preferredMasterId = values[0]?.id || null; pushSyncSelection(); renderSessions(); });
$('#profile-search').addEventListener('input', scheduleProfileSearchRender);
$('#profile-search').addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !event.target.value) return;
  event.preventDefault();
  clearTimeout(__profileSearchTimer);
  event.target.value = '';
  profilePage = 1;
  renderProfiles();
});
$('#profile-clear-filters').addEventListener('click', () => {
  clearTimeout(__profileSearchTimer);
  $('#profile-search').value = '';
  activeGroupFilter = 'all';
  profilePage = 1;
  renderProfiles();
  $('#profile-search').focus();
});
$('#profile-empty-create').addEventListener('click', () => $('#create-profile').click());
let __extensionSearchTimer = 0;
$('#extension-search').addEventListener('input', () => {
  clearTimeout(__extensionSearchTimer);
  __extensionSearchTimer = setTimeout(() => { __extensionSearchTimer = 0; renderExtensions(); }, 250);
});
$('#profile-page-size').addEventListener('change', (event) => { const value = Number(event.target.value); profilePageSize = PROFILE_PAGE_SIZES.includes(value) ? value : 10; profilePage = 1; try { localStorage.setItem(PROFILE_PAGE_SIZE_KEY, String(profilePageSize)); } catch (_) {} renderProfiles(); });
$('#profile-prev').addEventListener('click', () => { profilePage = Math.max(1, profilePage - 1); renderProfiles(); });
$('#profile-next').addEventListener('click', () => { profilePage += 1; renderProfiles(); });
$('#profile-page').addEventListener('change', (event) => { profilePage = Math.max(1, Number.parseInt(event.target.value, 10) || 1); renderProfiles(); });
$('#create-profile').addEventListener('click', openCreateProfileDialog); $('#quick-create').addEventListener('click', openCreateProfileDialog);

// group filter chips
document.getElementById('profile-group-chips')?.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-group-filter]');
  if (!btn) return;
  activeGroupFilter = btn.dataset.groupFilter || 'all';
  selectedProfiles.clear();
  profilePage = 1;
  renderProfiles();
});

// groups page actions
document.getElementById('group-create')?.addEventListener('click', () => openGroupDialog(null));
document.getElementById('group-refresh')?.addEventListener('click', () => renderGroupsPage());
document.getElementById('group-table')?.addEventListener('click', (event) => {
  const editId = event.target.closest('[data-group-edit]')?.dataset.groupEdit;
  const delId = event.target.closest('[data-group-delete]')?.dataset.groupDelete;
  const viewId = event.target.closest('[data-group-view]')?.dataset.groupView;
  if (editId) openGroupDialog(findGroup(editId));
  if (delId) deleteGroup(delId);
  if (viewId) {
    activeGroupFilter = viewId;
    switchView('profiles');
    renderProfiles();
  }
});
document.getElementById('group-color-chips')?.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-color]');
  if (!btn) return;
  $('#group-color').value = btn.dataset.color;
  $('#group-color-preview')?.style.setProperty('--group-color', btn.dataset.color);
  $$('#group-color-chips .group-color-pick').forEach((b) => b.classList.toggle('active', b === btn));
});
document.getElementById('group-color')?.addEventListener('input', (event) => {
  const color = event.target.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    $('#group-color-preview')?.style.setProperty('--group-color', color);
    $$('#group-color-chips .group-color-pick').forEach((button) => button.classList.toggle('active', button.dataset.color.toLowerCase() === color.toLowerCase()));
  }
});
document.getElementById('group-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.submitter?.value === 'cancel') return $('#group-dialog').close();
  try {
    saveGroupFromDialog();
    $('#group-dialog').close();
    toast(tx('分组已保存'));
    log('Group', tx('保存分组'));
  } catch (error) { toast(error.message); }
});
document.getElementById('batch-assign-group-btn')?.addEventListener('click', async () => {
  try {
    const gid = $('#batch-assign-group')?.value;
    await assignSelectedToGroup(gid === '' ? UNGROUPED_ID : gid);
  } catch (error) { toast(error.message); }
});
$('#profile-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (event.submitter?.value === 'cancel') return $('#profile-dialog').close();
  const form = event.currentTarget; const data = new FormData(form); const number = nextProfileNumber(); const previousNext = ui.nextProfileNumber;
  const groupId = String(data.get('groupId') || $('#profile-create-group')?.value || UNGROUPED_ID);
  let startUrl = '';
  try { startUrl = normalizeOptionalWebUrl(data.get('startUrl')); }
  catch (error) { return toast(error.message); }
  const networkMode = document.querySelector('input[name="create-network"]:checked')?.value || 'direct';
  const proxyLibraryId = String($('#create-proxy-library')?.value || '').trim();
  let proxy = 'Direct';
  if (networkMode === 'proxy') {
    const libraryItem = proxyLibraryItem(proxyLibraryId);
    if (proxyLibraryId && !libraryItem) return toast(tx('所选代理库节点已失效，请重新选择'));
    const type = $('#create-proxy-type')?.value || libraryItem?.protocol || 'socks5';
    const libraryProxy = libraryItem ? parseProxyInputForUi(libraryItem, type) : null;
    const raw = libraryProxy?.raw || String(data.get('proxy') || '').trim();
    if (raw) {
      try { proxy = normalizeProxy(raw, type); }
      catch (error) { return toast(tx('代理格式错误：') + error.message); }
    }
  }
  const templateId = String($('#profile-create-template')?.value || '').trim();
  const template = templateId ? ui.profiles.find((item) => item.id === templateId) : null;
  const profile = {
    id: createInternalProfileId(number),
    number,
    name: String(number),
    browser: data.get('browser') || template?.browser || 'Google Chrome',
    language: data.get('language') || template?.language || 'en-US',
    networkMode: isDirectProxy(proxy) ? 'direct' : 'proxy',
    proxy,
    proxyId: isDirectProxy(proxy) ? null : (proxyLibraryId || null),
    tag: String(data.get('tag') || template?.tag || 'Default'),
    groupId,
    os: template?.os || 'Windows',
    userAgent: template?.userAgent || '',
    location: 'Local',
    startUrl,
    platform: { type: 'other', startUrl },
    ...(template?.platform ? { platform: { ...template.platform, startUrl } } : {}),
    advanced: {
      ...(template?.advanced || {}),
      startUrls: startUrl,
      // Roxy 对齐的新环境默认值：弹出保存密码提示开、端口扫描保护开、DNT 开、硬件并发 12、内存 8G、MAC 自定义
      promptSavePassword: template?.advanced?.promptSavePassword !== undefined ? template.advanced.promptSavePassword : true,
      openWorkbench: template?.advanced?.openWorkbench || '1',
      ipChangeRemind: template?.advanced?.ipChangeRemind || '2',
      googleLogin: template?.advanced?.googleLogin || '2',
    },
    privacy: {
      languageMode: 'ip',
      langFromIp: true,
      uiLanguage: 'profile',
      deviceProfile: 'persona',
      // Roxy 对齐默认值（仅新建环境；已有环境不静默改档）
      ...(template?.privacy ? {} : {
        webrtc: 'disabled',
        dntMode: 'on',
        dnt: true,
        portScanProtect: true,
        cores: '12',
        memory: '8',
        macMode: 'custom',
      }),
      ...(template?.privacy ? JSON.parse(JSON.stringify(template.privacy)) : {}),
    },
    ...(template?.fingerprint ? { fingerprint: JSON.parse(JSON.stringify(template.fingerprint)) } : {}),
    proxyMeta: { proxyId: isDirectProxy(proxy) ? null : (proxyLibraryId || null) },
  };
  const shouldSaveToLib = Boolean($('#create-proxy-save-to-library')?.checked);
  const submitter = event.submitter; if (submitter && submitter.value !== 'cancel') submitter.disabled = true;
  ui.profiles.push(profile); ui.nextProfileNumber = number + 1; save();
  invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
  try {
    await window.ops.syncProfiles(ui.profiles); $('#profile-dialog').close(); form.reset();
    if (shouldSaveToLib && !isDirectProxy(proxy)) {
      try {
        const parsed = parseProxyInputForUi(proxy, $('#create-proxy-type')?.value || 'socks5');
        if (parsed?.host && parsed?.port) {
          const createdLib = await window.ops.proxyCreate({
            name: `环境${number}代理`,
            protocol: parsed.protocol || 'socks5',
            host: parsed.host,
            port: Number(parsed.port),
            username: parsed.username || '',
            password: parsed.password || '',
            raw: parsed.raw || proxy,
            remark: `由环境${number}创建时自动保存`,
          });
          if (createdLib?.id) {
            profile.proxyId = createdLib.id;
            profile.proxyMeta = { ...(profile.proxyMeta || {}), proxyId: createdLib.id };
            save();
          }
          await refreshProxies();
        }
      } catch (saveErr) {
        console.warn('自动保存代理到代理库失败', saveErr);
      }
    }
    const directRadio = document.querySelector('input[name="create-network"][value="direct"]');
    if (directRadio) directRadio.checked = true;
    const fields = $('#create-proxy-fields'); if (fields) fields.hidden = true;
    await refreshStatus(); log('Profile', '创建环境 ' + number + ' · ' + (isDirectProxy(proxy) ? '本地直连' : '代理'));
    toast(isDirectProxy(proxy) && networkMode === 'proxy' ? tx('未填写代理，已自动切换为本地直连') : (isDirectProxy(proxy) ? tx('已创建（本地直连）') : tx('已创建（代理模式）')));
  } catch (error) {
    ui.profiles = ui.profiles.filter((item) => item.id !== profile.id); ui.nextProfileNumber = previousNext; save(); toast(tx('创建失败：') + error.message);
  } finally { if (submitter) submitter.disabled = false; }
});

$$('[data-editor-tab]').forEach((button) => {
  button.addEventListener('click', () => setEditorTab(button.dataset.editorTab));
  button.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const tabs = $$('[data-editor-tab]');
    if (!tabs.length) return;
    const currentIndex = tabs.indexOf(button);
    if (currentIndex < 0) return;
    event.preventDefault();
    const nextIndex = event.key === 'ArrowRight'
      ? (currentIndex + 1) % tabs.length
      : (currentIndex - 1 + tabs.length) % tabs.length;
    const nextTabBtn = tabs[nextIndex];
    if (nextTabBtn?.dataset?.editorTab) {
      setEditorTab(nextTabBtn.dataset.editorTab, true);
    }
  });
});
setEditorTab('basic');
$('#editor-back').addEventListener('click', () => { openProfileEditor.cancel(); editingProfileId = null; editorNetworkResult = null; switchView('profiles'); });
$('#editor-cancel').addEventListener('click', () => { openProfileEditor.cancel(); editingProfileId = null; editorNetworkResult = null; switchView('profiles'); });
$('#editor-system-defaults').addEventListener('click', useSystemEditorDefaults);
const editorProxyFieldsSelector = '#editor-proxy-host,#editor-proxy-port,#editor-proxy-user,#editor-proxy-password,#editor-proxy-raw';
const editorProxyGeneralSelector = '#editor-proxy-type,input[name="editor-network"],' + editorProxyFieldsSelector;
const onEditorFormChange = (event) => {
  if (event.target.matches(editorProxyGeneralSelector)) {
    if (event.isTrusted && !window.__proxyLibrarySelectionInProgress && event.target.matches(editorProxyFieldsSelector)) {
      const library = $('#editor-proxy-library');
      if (library && library.value) {
        library.value = '';
        syncThemedSelect(library);
      }
      const status = $('#editor-proxy-library-status');
      if (status) status.textContent = tx('未关联代理库节点（已改为手动代理）');
    }
    editorNetworkResult = null;
    $('#editor-proxy-result').className = 'proxy-test-result';
    $('#editor-proxy-result').textContent = editorSelectedNetwork() === 'direct' ? tx('本地直连') : tx('设置已更改，请重新检测');
  }
  updateEditorVisibility(); scheduleEditorSummaryRender();
};
let __editorSummaryTimer = 0;
// renderEditorSummary walks the whole form and rebuilds its DOM; on 'input'
// (every keystroke) that is wasted work. Debounce it, keep 'change' immediate.
function scheduleEditorSummaryRender() {
  clearTimeout(__editorSummaryTimer);
  __editorSummaryTimer = setTimeout(() => { __editorSummaryTimer = 0; renderEditorSummary(); }, 250);
  __editorSummaryTimer.unref?.();
}
$('#profile-editor-form').addEventListener('input', onEditorFormChange);
$('#profile-editor-form').addEventListener('change', (event) => {
  clearTimeout(__editorSummaryTimer);
  __editorSummaryTimer = 0;
  onEditorFormChange(event);
});

// Platform preset → fill 指定地址
function applyPlatformPresetToStartUrl() {
  const sel = document.getElementById('editor-platform-type');
  const urlInput = document.getElementById('editor-start-url');
  if (!sel || !urlInput) return;
  const opt = sel.selectedOptions?.[0];
  const preset = opt?.getAttribute('data-url');
  const type = sel.value;
  if (type === 'blank') {
    urlInput.value = '';
    urlInput.placeholder = tx('空白页 — 启动不打开站点');
    return;
  }
  if (type === 'other') {
    urlInput.placeholder = tx('手填任意 URL，例如 https://www.example.com');
    // do not clear custom URL when switching to other
    return;
  }
  if (preset != null && preset !== '') {
    urlInput.value = preset;
    urlInput.placeholder = tx('选择平台后自动填入，也可手动修改');
  }
}
document.getElementById('editor-platform-type')?.addEventListener('change', () => {
  applyPlatformPresetToStartUrl();
  renderEditorSummary?.();
});

setupPlatformPresets('profile-create-platform', 'profile-create-platform-chips', 'profile-create-start-url');
setupPlatformPresets('batch-add-platform', 'batch-add-platform-chips', 'batch-add-start-url');
// Roxy 对齐控件一次性接线（版本下拉/九宫格/三段开关/ID 复制/横幅/右栏随机）
if (typeof wireEditorAlignmentControls === 'function') wireEditorAlignmentControls();
// 列表标签条（全部窗口/收藏/已打开/回收站）
document.querySelectorAll('#profile-list-tabs .list-tab').forEach((tab) => {
  tab.addEventListener('click', () => switchListTab(tab.dataset.listTab));
});
// 全局 Ctrl+F 聚焦列表搜索（对齐 搜索 Ctrl+F）
window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
    const target = event.target;
    const typing = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (typing) return;
    event.preventDefault();
    $('#profile-search')?.focus();
    $('#profile-search')?.select?.();
  }
});

// Cookie tools (export/import/clear)
document.getElementById('editor-cookie-export')?.addEventListener('click', () => {
  try {
    const raw = ($('#editor-cookies')?.value || '').trim() || '[]';
    JSON.parse(raw); // validate
    const blob = new Blob([raw], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cookies-${editingProfileId || 'profile'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(tx('Cookie 已导出'));
  } catch (error) { toast('导出失败：' + error.message); }
});
document.getElementById('editor-cookie-import-file')?.addEventListener('click', () => {
  document.getElementById('editor-cookie-file')?.click();
});
document.getElementById('editor-cookie-file')?.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error(tx('Cookie 必须是 JSON 数组'));
    editorSet('#editor-cookies', JSON.stringify(data, null, 2));
    toast(tx('已导入 ') + data.length + tx(' 条 Cookie（保存环境后生效）'));
  } catch (error) { toast('导入失败：' + error.message); }
});
document.getElementById('editor-clear-cache-cookie')?.addEventListener('click', async () => {
  if (!editingProfileId) return toast(tx('未打开环境'));
  if (!await confirmAction({
    title: tx('清除缓存及 Cookie'),
    message: tx('清除该环境的缓存及 Cookie？需先关闭窗口。'),
    confirmLabel: tx('确认清除'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.clearProfileCacheCookies(editingProfileId);
    editorSet('#editor-cookies', '');
    const idx = ui.profiles.findIndex((p) => p.id === editingProfileId);
    if (idx >= 0) {
      ui.profiles[idx] = { ...ui.profiles[idx], cookies: '', updatedAt: new Date().toISOString() };
      save();
      invalidateViewCache('profiles');
    }
    toast(tx('缓存及 Cookie 已清除'));
  } catch (error) { toast(error.message); }
});
$('#profile-editor-form').addEventListener('submit', window.OpenBrowserProfileCommands.createProfileEditorSubmit({
  getSession: () => ({ id: editingProfileId, baseRev: editingProfileBaseRev, networkResult: editorNetworkResult,
    saveProxy: Boolean($('#editor-proxy-save-to-library')?.checked), proxyType: $('#editor-proxy-type')?.value || 'socks5' }),
  getProfiles: () => ui.profiles,
  readDraft: () => editorDraft(true),
  ops: window.ops,
  publish(profile) {
    const index = ui.profiles.findIndex((item) => item.id === profile.id);
    if (index >= 0) ui.profiles[index] = profile;
    save();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    renderProfiles();
  },
  setRows: (rows) => { engineProfiles = rows; },
  normalize: normalizeProfileSettings,
  async saveProxy(draft, session) {
    if (!session.saveProxy || isDirectProxy(draft.proxy)) return null;
    const parsed = parseProxyInputForUi(draft.proxy, session.proxyType);
    if (!parsed?.host || !parsed?.port) return null;
    const number = displayProfileNumber(draft);
    const created = await window.ops.proxyCreate({ name: `环境${number}代理`, protocol: parsed.protocol || 'socks5',
      host: parsed.host, port: Number(parsed.port), username: parsed.username || '', password: parsed.password || '',
      raw: parsed.raw || draft.proxy, remark: `由环境${number}编辑时自动保存` });
    return created?.id || null;
  },
  afterProxy: (_draft, session) => session.saveProxy ? refreshProxies() : undefined,
  onSaved(draft, session) {
    log('Profile', '已更新环境 ' + displayProfileNumber(draft));
    if (editingProfileId === session.id) {
      editingProfileId = null;
      editorNetworkResult = null;
      switchView('profiles');
    }
    toast(profileEngine(draft.id).running ? tx('设置已保存，请重启该环境后生效') : tx('环境设置已保存'));
  },
  onError: (error) => toast('保存失败：' + tx(error.message)),
  onConflict: () => toast(tx('环境已被其他操作更新，请重新打开编辑器后保存；当前草稿未提交。')),
  onWarning: (error) => log('Error', '更新环境关联数据失败：' + error.message),
}));

$('#batch-add').addEventListener('click', () => {
  $('#batch-add-start').value = String(nextProfileNumber());
  fillGroupSelect($('#batch-add-group'), listGroups()[0]?.id || UNGROUPED_ID);
  fillGroupSelect($('#batch-assign-group'), UNGROUPED_ID, { includeUngrouped: true });
  const directRadio = document.querySelector('input[name="batch-add-network"][value="direct"]');
  if (directRadio) directRadio.checked = true;
  renderProxyLibrarySelect($('#batch-add-proxy-library'), '');
  if ($('#batch-add-proxies')) $('#batch-add-proxies').value = '';
  if ($('#batch-add-start-url')) $('#batch-add-start-url').value = '';
  if ($('#batch-add-platform')) $('#batch-add-platform').value = 'other';
  document.querySelectorAll('#batch-add-platform-chips .mini-chip').forEach((c) => c.classList.remove('active'));
  if ($('#batch-add-os')) $('#batch-add-os').value = 'Windows';
  if ($('#batch-add-resolution')) $('#batch-add-resolution').value = '1280x820';
  if ($('#batch-add-block-images')) $('#batch-add-block-images').checked = false;
  if ($('#batch-add-block-sound')) $('#batch-add-block-sound').checked = false;
  if ($('#batch-add-clear-cache')) $('#batch-add-clear-cache').checked = false;
  if ($('#batch-add-multi-open')) $('#batch-add-multi-open').checked = false;
  const fields = $('#batch-add-proxy-fields'); if (fields) fields.hidden = true;
  const template = $('#batch-add-template');
  if (template) {
    template.replaceChildren(new Option(tx('使用新环境默认偏好'), ''));
    for (const profile of ui.profiles) template.append(new Option(tx('环境 ') + displayProfileNumber(profile) + (profile.title ? tx(' · ') + profile.title : ''), profile.id));
  }
  $('#batch-add-dialog').showModal();
});
$('#batch-add-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (event.submitter?.value === 'cancel') return $('#batch-add-dialog').close();
  const count = Number.parseInt($('#batch-add-count').value, 10); const start = nextProfileNumber(); const previousNext = ui.nextProfileNumber;
  if (!Number.isInteger(count) || count < 1 || count > 200) return toast(tx('新增数量必须为 1-200'));
  const language = $('#batch-add-language').value; const tag = $('#batch-add-tag').value.trim() || '批量创建';
  const groupId = $('#batch-add-group')?.value || UNGROUPED_ID;
  const templateId = $('#batch-add-template')?.value || '';
  const templateProfile = templateId ? (profileEngine(templateId)?.id ? profileEngine(templateId) : ui.profiles.find((item) => item.id === templateId)) : null;
  const templatePreferences = templateProfile ? cloneProfilePreferences(templateProfile) : null;
  let batchStartUrl = '';
  const inputBatchStartUrl = $('#batch-add-start-url')?.value?.trim();
  if (inputBatchStartUrl) {
    try { batchStartUrl = normalizeOptionalWebUrl(inputBatchStartUrl); }
    catch (e) { return toast(e.message); }
  } else if (templatePreferences?.startUrl) {
    batchStartUrl = templatePreferences.startUrl;
  }
  const networkMode = document.querySelector('input[name="batch-add-network"]:checked')?.value || 'direct';
  const proxyLibraryId = String($('#batch-add-proxy-library')?.value || '').trim();
  let proxies = [];
  const proxyIds = [];
  if (networkMode === 'proxy') {
    const libraryItem = proxyLibraryItem(proxyLibraryId);
    if (proxyLibraryId && !libraryItem) return toast(tx('所选代理库节点已失效，请重新选择'));
    try {
      const libraryProxy = libraryItem ? parseProxyInputForUi(libraryItem, libraryItem.protocol || $('#batch-add-proxy-type')?.value || 'socks5') : null;
      proxies = libraryProxy ? Array(count).fill(libraryProxy.raw) : proxyLines('#batch-add-proxies', '#batch-add-proxy-type');
    }
    catch (error) { return toast(tx('代理格式错误：') + error.message); }
    if (!proxies.length) return toast(tx('代理模式请填写代理列表'));
    if (libraryItem) proxyIds.push(...Array(count).fill(libraryItem.id));
  }
  if (proxies.length && proxies.length !== count) return toast(tx('代理数量必须等于新增环境数量，每个环境对应一条代理'));
  const batchOs = $('#batch-add-os')?.value || templatePreferences?.os || 'Windows';
  const batchResolution = $('#batch-add-resolution')?.value || '1280x820';
  let [bWidth, bHeight] = batchResolution.split('x').map(Number);
  bWidth = bWidth >= 640 ? bWidth : (templatePreferences?.width || 1280);
  bHeight = bHeight >= 480 ? bHeight : (templatePreferences?.height || 820);
  const blockImages = Boolean($('#batch-add-block-images')?.checked);
  const blockSound = Boolean($('#batch-add-block-sound')?.checked);
  const clearCache = Boolean($('#batch-add-clear-cache')?.checked);
  const multiOpen = Boolean($('#batch-add-multi-open')?.checked);

  const submitter = event.submitter; if (submitter && submitter.value !== 'cancel') submitter.disabled = true;
  const used = new Set(ui.profiles.map((item) => item.id)); const created = [];
  while (created.length < count) {
    const number = start + created.length; const id = createInternalProfileId(number, used); used.add(id);
    const assignedProxyId = proxyIds[created.length] || null;
    const effectiveStartUrl = batchStartUrl || templatePreferences?.startUrl || '';
    created.push({
      ...(templatePreferences ? structuredClone(templatePreferences) : {}),
      id,
      number,
      name: String(number),
      title: '',
      browser: 'Google Chrome',
      language,
      networkMode: proxies.length ? 'proxy' : 'direct',
      proxy: proxies.length ? proxies[created.length] : 'Direct',
      proxyId: assignedProxyId,
      proxyMeta: { ...(templatePreferences?.proxyMeta || {}), proxyId: assignedProxyId },
      tag,
      groupId,
      startUrl: effectiveStartUrl,
      platform: { type: 'other', startUrl: effectiveStartUrl },
      advanced: {
        ...(templatePreferences?.advanced || {}),
        startUrls: effectiveStartUrl,
        blockImages,
        blockSound,
        clearCacheOnStart: clearCache,
        multiOpen,
      },
      os: batchOs,
      width: bWidth,
      height: bHeight,
      location: 'Local',
      cookies: '',
    });
  }
  try {
    const verified = proxies.length ? await verifyProxyAssignments(created, proxies) : [];
    created.forEach((profile, index) => {
      const result = verified[index]; if (!result) return;
      profile.exitIp = result.ip; profile.exitCountryCode = result.countryCode; profile.exitTimezone = result.timezone || ''; profile.exitLatitude = result.latitude; profile.exitLongitude = result.longitude; profile.exitCheckedAt = result.checkedAt;
    });
    ui.profiles.push(...created); ui.nextProfileNumber = start + created.length; save(); invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']); engineProfiles = await window.ops.syncProfiles(ui.profiles);
    selectedProfiles = new Set(created.map((item) => item.id)); $('#select-all-profiles').checked = false; $('#batch-add-dialog').close(); $('#batch-add-proxies').value = '';
    await refreshStatus(); await refreshExtensions();
    log('Batch', '批量新增 ' + created.length + ' 个环境 · ' + (networkMode === 'direct' ? '本地直连' : '代理'));
    toast(tx('已批量创建 ') + created.length + tx(' 个环境（') + (networkMode === 'direct' ? tx('本地直连') : tx('代理模式')) + tx('）'));
  } catch (error) {
    ui.profiles = window.OpenBrowserProfileBatch.removeProfilesById(ui.profiles, created.map((item) => item.id)); ui.nextProfileNumber = previousNext; save(); toast(tx('批量新增失败：') + error.message);
  } finally { if (submitter) submitter.disabled = false; }
});
$('#delete-selected').addEventListener('click', async () => {
  pendingDeleteProfiles = ui.profiles.filter((item) => selectedProfiles.has(item.id)).map((item) => item.id);
  if (!pendingDeleteProfiles.length) return toast(tx('请先勾选要删除的环境'));
  const inTrash = activeGroupFilter === 'trash';
  try {
    const status = await window.ops.profileStatus(); const pendingIds = new Set(pendingDeleteProfiles);
    const running = status.filter((item) => item.running && pendingIds.has(item.id)).length;
    if (inTrash) {
      $('#batch-delete-title').textContent = t('trash.purge');
      $('#batch-delete-summary').textContent = t('trash.purgeSummary', { count: pendingDeleteProfiles.length });
      $('#batch-delete-warning').textContent = t('trash.purgeWarning');
      $('#batch-delete-data-label').hidden = true;
      $('#batch-delete-confirm').textContent = t('trash.purge');
    } else {
      $('#batch-delete-title').textContent = t('profiles.batchDeleteTitle');
      $('#batch-delete-summary').textContent = tx('已选择 ') + pendingDeleteProfiles.length + ' 个环境，其中 ' + running + ' 个正在运行。';
      $('#batch-delete-warning').textContent = t('trash.trashWarning');
      $('#batch-delete-data-label').hidden = false;
      $('#batch-delete-confirm').textContent = t('profiles.batchDelete');
    }
    $('#batch-delete-dialog').showModal();
  } catch (error) { toast(error.message); }
});

$('#batch-delete-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (event.submitter?.value === 'cancel') { pendingDeleteProfiles = []; return $('#batch-delete-dialog').close(); }
  const ids = [...pendingDeleteProfiles]; if (!ids.length) return $('#batch-delete-dialog').close();
  const submitter = event.submitter; if (submitter) submitter.disabled = true;
  const inTrash = activeGroupFilter === 'trash';
  try {
    const deleteData = inTrash ? true : $('#batch-delete-data').checked;
    const result = inTrash
      ? await window.ops.purgeProfiles(ids, deleteData)
      : (deleteData
          ? await window.ops.purgeProfiles(ids, true)
          : await window.ops.trashProfiles(ids));
    if (inTrash || deleteData) {
      ui.profiles = window.OpenBrowserProfileBatch.removeProfilesById(ui.profiles, ids);
    } else {
      window.OpenBrowserProfileBatch.setProfilesTrashed(ui.profiles, ids, true);
    }
    for (const id of ids) { selectedProfiles.delete(id); selectedSessions.delete(id); }
    if (!ui.profiles.length) ui.nextProfileNumber = 1;
    pendingDeleteProfiles = []; save(); $('#select-all-profiles').checked = false; $('#batch-delete-dialog').close();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    await refreshStatus(); await refreshSessions(); await refreshExtensions();
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    if (inTrash || deleteData) {
      log('Batch', '彻底删除 ' + result.deleted + ' 个环境');
      toast(t('trash.purged'));
    } else {
      log('Batch', '移入回收站 ' + result.deleted + ' 个环境');
      toast(t('trash.movedToTrash', { n: result.deleted }));
    }
  } catch (error) { toast(error.message); } finally { if (submitter) submitter.disabled = false; }
});

$('#restore-selected')?.addEventListener('click', async () => {
  const ids = [...selectedProfiles];
  if (!ids.length) return toast(tx('请先勾选环境'));
  try {
    await window.ops.restoreProfiles(ids);
    window.OpenBrowserProfileBatch.setProfilesTrashed(ui.profiles, ids, false);
    for (const id of ids) selectedProfiles.delete(id);
    save();
    invalidateViewCache(['profiles', 'groups', 'sync']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderGroupFilterChips();
    updateProfileSelectionUi();
    renderProfiles();
    toast(t('trash.restored'));
  } catch (err) {
    toast(t('trash.restoreFailed') + ': ' + err.message);
  }
});

$('#empty-trash-btn')?.addEventListener('click', async () => {
  const trashedCount = ui.profiles.filter((p) => p.trashed).length;
  if (!trashedCount) return toast(t('trash.emptyTitle'));
  if (!await confirmAction({
    title: t('trash.empty'),
    message: t('trash.confirmEmpty'),
    confirmLabel: t('trash.empty'),
    tone: 'danger',
  })) return;
  try {
    await window.ops.emptyTrash(true);
    ui.profiles = ui.profiles.filter((p) => !p.trashed);
    const remainingIds = new Set(ui.profiles.map((profile) => profile.id));
    for (const id of selectedProfiles) if (!remainingIds.has(id)) selectedProfiles.delete(id);
    save();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    toast(t('trash.emptied'));
  } catch (err) {
    toast(t('trash.emptyFailed') + ': ' + err.message);
  }
});
$('#start-selected').addEventListener('click', async () => { if (!selectedProfiles.size) return toast(tx('请先选择环境')); await runPool([...selectedProfiles], (id) => startProfile(id)); });
$('#stop-selected').addEventListener('click', async () => { if (!selectedProfiles.size) return toast(tx('请先选择环境')); await runPool([...selectedProfiles], (id) => stopProfile(id)); });
$('#copy-selected')?.addEventListener('click', async () => {
  const sources = ui.profiles.filter((profile) => selectedProfiles.has(profile.id));
  if (!sources.length) return toast(tx('请先选择环境'));
  // nextProfileNumber() recomputes from the live list: ui.nextProfileNumber
  // goes stale after initialize() appends engine-only profiles or a cloud
  // restore replaces the list, which produced duplicate environment numbers.
  const previousNext = nextProfileNumber();
  const used = new Set(ui.profiles.map((item) => item.id));
  const created = sources.map((local, index) => {
    const engineProfile = profileEngine(local.id);
    const source = normalizeProfileSettings(engineProfile?.id ? { ...local, ...engineProfile } : local);
    const number = previousNext + index;
    const id = createInternalProfileId(number, used); used.add(id);
    const clone = normalizeProfileSettings({
      ...source,
      ...cloneProfilePreferences(source),
      id,
      number,
      name: String(number),
      title: source.title ? `${source.title} ${tx('副本')}` : '',
      cookies: '',
      platform: { ...(source.platform || {}), username: '', password: '', totpSecret: '' },
      exitIp: '', exitCountryCode: '', exitTimezone: '', exitLatitude: '', exitLongitude: '', exitCheckedAt: '', exitLatencyMs: '', exitNetworkType: '',
    });
    return clone;
  });
  try {
    ui.profiles.push(...created); ui.nextProfileNumber = previousNext + created.length; save();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    for (let index = 0; index < sources.length; index += 1) {
      const extensionIds = profileEngine(sources[index].id).assignedExtensions || [];
      for (const extensionId of extensionIds) await window.ops.assignExtension(extensionId, [created[index].id], true);
    }
    await refreshExtensions();
    await refreshStatus();
    selectedProfiles = new Set(created.map((item) => item.id));
    renderProfiles();
    log('Batch', `复制 ${created.length} 个环境配置`);
    toast(tx('已复制 ') + created.length + tx(' 个环境配置（未复制 Cookie 和账号密码）'));
  } catch (error) {
    await window.ops.deleteProfiles(created.map((item) => item.id), false).catch(() => {});
    ui.profiles = window.OpenBrowserProfileBatch.removeProfilesById(ui.profiles, created.map((item) => item.id));
    ui.nextProfileNumber = previousNext; save(); toast(tx('复制环境失败：') + error.message);
  }
});
$('#renumber-profiles')?.addEventListener('click', async () => {
  if (!ui.profiles || !ui.profiles.length) return toast(tx('当前暂无环境'));
  if (!await confirmAction({
    title: tx('重排环境编号'),
    message: tx('是否将所有环境按列表顺序重新编号为 1 到 N？'),
    confirmLabel: tx('确认重排'),
    tone: 'danger',
  })) return;
  try {
    ui.profiles.forEach((profile, index) => {
      const num = index + 1;
      profile.number = num;
      profile.name = String(num);
    });
    ui.nextProfileNumber = ui.profiles.length + 1;
    save();
    invalidateViewCache('profiles');
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    renderProfiles();
    log('Profile', `已将 ${ui.profiles.length} 个环境重新编号为 1..${ui.profiles.length}`);
    toast(tx(`已将 ${ui.profiles.length} 个环境重排为 1..${ui.profiles.length}`));
  } catch (error) {
    toast(tx('重排编号失败：') + error.message);
  }
});
$('#add-extension').addEventListener('click', () => $('#add-app-dialog').showModal());
$('#close-add-app').addEventListener('click', () => $('#add-app-dialog').close());
$('#cancel-add-app').addEventListener('click', () => $('#add-app-dialog').close());
$('#choose-extension-folder').addEventListener('click', async () => {
  try {
    const result = await window.ops.addExtensionFolder();
    if (!result.canceled) { invalidateViewCache(['extensions', 'profiles', 'sync']); await refreshExtensions(); await refreshStatus(); await refreshSessions(); $('#add-app-dialog').close(); log('Extension', `添加 ${result.extension.name}，默认分配 ${result.assigned || 0} 个环境，重启 ${result.restarted || 0} 个`); toast(tx(`已添加 ${result.extension.name}，默认启用 ${result.assigned || 0}/${ui.profiles.length}`)); }
  } catch (error) { toast(error.message); }
});
$('#add-store-submit').addEventListener('click', async (event) => {
  const url = $('#chrome-store-url').value.trim();
  if (!url) return toast(tx('请输入 Chrome 应用商店 URL'));
  const submitter = event.currentTarget; if (submitter) submitter.disabled = true;
  const all = $('#store-assign-all').checked; const ids = all ? ui.profiles.map((item) => item.id) : [];
  try {
    toast(tx('正在从 Chrome 应用商店获取扩展...'));
    const result = await window.ops.addExtensionStore(url, ids, all);
    invalidateViewCache(['extensions', 'profiles', 'sync']); await refreshExtensions(); await refreshStatus(); await refreshSessions();
    $('#add-app-dialog').close(); $('#chrome-store-url').value = '';
    log('Extension', '商店添加 ' + result.extension.name + ', 分配 ' + result.assigned + ', 重启 ' + result.restarted);
    toast(tx('已添加 ') + result.extension.name + tx('，分配 ') + result.assigned + tx(' 个环境'));
  } catch (error) { toast('商店添加失败：' + error.message); } finally { if (submitter) submitter.disabled = false; }
});
$('#refresh-extensions').addEventListener('click', refreshExtensions);
$('#app-center-tabs')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-app-tab]');
  if (!button) return;
  appCenterTab = button.dataset.appTab;
  renderExtensions();
});

// ---- proxy library ----


$('#profile-create-template')?.addEventListener('change', (event) => {
  const selectedId = event.target.value;
  if (!selectedId) return;
  const target = ui.profiles.find((p) => p.id === selectedId);
  if (!target) return;
  const targetStartUrl = target.startUrl || target.platform?.startUrl || target.advanced?.startUrls || '';
  const form = $('#profile-form');
  if (form?.elements?.startUrl) {
    form.elements.startUrl.value = targetStartUrl;
  }
  const startUrlInput = $('#profile-create-start-url');
  if (startUrlInput) {
    startUrlInput.value = targetStartUrl;
  }
  if (targetStartUrl) {
    const platformSelect = $('#profile-create-platform');
    if (platformSelect) {
      let matched = false;
      for (const opt of platformSelect.options) {
        if (opt.dataset.url && targetStartUrl.includes(opt.dataset.url.replace(/^https?:\/\/(www\.)?/, ''))) {
          platformSelect.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) platformSelect.value = 'other';
    }
    document.querySelectorAll('#profile-create-platform-chips .mini-chip').forEach((c) => {
      const chipUrl = c.dataset.url;
      if (chipUrl && targetStartUrl.includes(chipUrl.replace(/^https?:\/\/(www\.)?/, ''))) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }
  if (target.language) {
    const langSelect = $('#profile-create-language');
    if (langSelect) langSelect.value = target.language;
  }
  if (target.groupId) {
    const groupSelect = $('#profile-create-group');
    if (groupSelect) groupSelect.value = target.groupId;
  }
  if (target.networkMode === 'proxy' && target.proxy && !isDirectProxy(target.proxy)) {
    const modeProxy = document.querySelector('input[name="create-network"][value="proxy"]') || $('#create-network-proxy');
    if (modeProxy) {
      modeProxy.checked = true;
      modeProxy.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const proxyFields = $('#create-proxy-fields');
    if (proxyFields) proxyFields.hidden = false;
    const rawInput = $('#create-proxy-raw');
    if (rawInput) rawInput.value = target.proxy;
    const proxyInput = $('#create-proxy-input');
    if (proxyInput) proxyInput.value = target.proxy;
    try {
      const parsed = parseProxyInputForUi(target.proxy);
      if (parsed) {
        if ($('#create-proxy-type')) $('#create-proxy-type').value = parsed.protocol;
        if ($('#create-proxy-host')) $('#create-proxy-host').value = parsed.host;
        if ($('#create-proxy-port')) $('#create-proxy-port').value = parsed.port;
        if ($('#create-proxy-user')) $('#create-proxy-user').value = parsed.username;
        if ($('#create-proxy-password')) $('#create-proxy-password').value = parsed.password;
        if (proxyInput) proxyInput.value = parsed.raw || `${parsed.host}:${parsed.port}`;
      }
    } catch (_) {}
  } else {
    const modeDirect = document.querySelector('input[name="create-network"][value="direct"]') || $('#create-network-direct');
    if (modeDirect) {
      modeDirect.checked = true;
      modeDirect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const proxyFields = $('#create-proxy-fields');
    if (proxyFields) proxyFields.hidden = true;
  }
  syncThemedSelects($('#profile-dialog'));
  toast(tx('已沿用所选环境偏好设置'));
});

$('#batch-add-template')?.addEventListener('change', (event) => {
  const selectedId = event.target.value;
  if (!selectedId) return;
  const target = ui.profiles.find((p) => p.id === selectedId);
  if (!target) return;
  const targetStartUrl = target.startUrl || target.platform?.startUrl || target.advanced?.startUrls || '';
  if ($('#batch-add-start-url')) $('#batch-add-start-url').value = targetStartUrl;
  if (target.os && $('#batch-add-os')) $('#batch-add-os').value = target.os;
  const targetRes = (target.width && target.height) ? `${target.width}x${target.height}` : '';
  if (targetRes && $('#batch-add-resolution')) {
    let matched = false;
    for (const opt of $('#batch-add-resolution').options) {
      if (opt.value === targetRes) {
        $('#batch-add-resolution').value = targetRes;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const newOpt = new Option(`${target.width} × ${target.height}`, targetRes, true, true);
      $('#batch-add-resolution').add(newOpt);
    }
  }
  if (target.language && $('#batch-add-language')) $('#batch-add-language').value = target.language;
  if (target.groupId && $('#batch-add-group')) $('#batch-add-group').value = target.groupId;
  if ($('#batch-add-block-images')) $('#batch-add-block-images').checked = Boolean(target.advanced?.blockImages);
  if ($('#batch-add-block-sound')) $('#batch-add-block-sound').checked = Boolean(target.advanced?.blockAudio);
  if ($('#batch-add-clear-cache')) $('#batch-add-clear-cache').checked = Boolean(target.advanced?.clearCacheOnStart);
  if ($('#batch-add-multi-open')) $('#batch-add-multi-open').checked = Boolean(target.advanced?.allowMultiOpen);
  if (targetStartUrl) {
    const platformSelect = $('#batch-add-platform');
    if (platformSelect) {
      let matched = false;
      for (const opt of platformSelect.options) {
        if (opt.dataset.url && targetStartUrl.includes(opt.dataset.url.replace(/^https?:\/\/(www\.)?/, ''))) {
          platformSelect.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) platformSelect.value = 'other';
    }
    document.querySelectorAll('#batch-add-platform-chips .mini-chip').forEach((c) => {
      const chipUrl = c.dataset.url;
      if (chipUrl && targetStartUrl.includes(chipUrl.replace(/^https?:\/\/(www\.)?/, ''))) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }
  syncThemedSelects($('#batch-add-dialog'));
  toast(tx('已沿用所选环境偏好设置'));
});


async function handleQuickPasteToInput(targetInputSelector) {
  try {
    let text = '';
    if (window.ops?.readClipboardText) {
      try { text = await window.ops.readClipboardText(); } catch (_) {}
    }
    if (!text && navigator.clipboard?.readText) {
      try { text = await navigator.clipboard.readText(); } catch (_) {}
    }
    text = String(text || '').trim();
    if (!text) {
      toast(tx('剪贴板为空'));
      return;
    }
    const input = $(targetInputSelector);
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      toast(tx('已粘贴并解析代理'));
    }
  } catch (err) {
    toast(tx('读取剪贴板失败：') + err.message);
  }
}


$('#assign-extension').addEventListener('click', (event) => { event.preventDefault(); applyAssignment(true); }); $('#unassign-extension').addEventListener('click', (event) => { event.preventDefault(); applyAssignment(false); });
$('#refresh-sessions').addEventListener('click', refreshSessions);
$('#start-sync').addEventListener('click', () => { invalidateViewCache('sync'); return runSyncAction('\u542f\u52a8\u540c\u6b65', () => window.ops.startSync(selectedSessionIds(2))); });
$('#stop-sync').addEventListener('click', () => { invalidateViewCache('sync'); return runSyncAction('\u505c\u6b62\u540c\u6b65', () => window.ops.stopSync()); });
$('#restart-sync').addEventListener('click', () => { invalidateViewCache('sync'); return runSyncAction('\u91cd\u542f\u540c\u6b65', () => window.ops.restartSync()); });
async function sendSameText() { const [delayMin, delayMax] = textDelayRange(); return runSyncAction('\u6587\u672c\u8f93\u5165', () => window.ops.textAction(selectedSessionIds(), 'insert', $('#sync-text').value, delayMin, delayMax)); }
async function sendRandomNumbers() {
  let ids; try { ids = specifiedTextSessionIds(); } catch (error) { return toast(error.message); }
  let min = Number($('#random-number-min').value), max = Number($('#random-number-max').value); if (!Number.isFinite(min) || !Number.isFinite(max)) return toast('\u8bf7\u8f93\u5165\u6709\u6548\u7684\u6570\u5b57\u8303\u56f4'); if (max < min) [min, max] = [max, min];
  const decimals = Math.max((String($('#random-number-min').value).split('.')[1] || '').length, (String($('#random-number-max').value).split('.')[1] || '').length);
  const texts = ids.map(() => (min + Math.random() * (max - min)).toFixed(Math.min(8, decimals)));
  const [delayMin, delayMax] = textDelayRange(); return runSyncAction('\u968f\u673a\u6570\u5b57\u8f93\u5165', () => window.ops.batchTextAction(ids, texts, delayMin, delayMax));
}
$('#send-text').addEventListener('click', sendSameText);
$('#send-random-number').addEventListener('click', sendRandomNumbers);
$('#sync-settings-button').addEventListener('click', () => { fillSyncSettingsForm(); $('#sync-settings-dialog').showModal(); });
$('#sync-settings-form').addEventListener('submit', async (event) => { event.preventDefault(); if (event.submitter?.value === 'cancel') return $('#sync-settings-dialog').close('cancel'); await applySyncSettings(syncSettingsFromForm(), true); $('#sync-settings-dialog').close(); });
$('#delay-input').addEventListener('change', () => applySyncSettings({ ...syncSettings, delayInput: $('#delay-input').checked }));
$('#delay-click').addEventListener('change', () => applySyncSettings({ ...syncSettings, delayClick: $('#delay-click').checked }));
$('#clear-text').addEventListener('click', () => runSyncAction('清空内容', () => window.ops.textAction(selectedSessionIds(), 'clear', '', 0, 0)));
$('#add-specified-text-group').addEventListener('click', () => {
  if (specifiedTextGroups.length >= SPECIFIED_TEXT_GROUP_LIMIT) return toast('\u6700\u591a\u6dfb\u52a0 ' + SPECIFIED_TEXT_GROUP_LIMIT + ' \u4e2a\u6587\u672c\u7ec4');
  specifiedTextGroups.push(createSpecifiedTextGroup(specifiedTextGroups.length)); saveSpecifiedTextGroups(); renderSpecifiedTextGroups();
});
$('#specified-text-groups').addEventListener('input', (event) => {
  const id = event.target.dataset.specifiedText; if (!id) return;
  const group = specifiedTextGroups.find((item) => item.id === id); if (!group) return;
  group.text = event.target.value.slice(0, 500000); group.cursor = Math.min(group.cursor, Math.max(0, specifiedTextItems(group.text).length - 1));
  // Debounced: serializing all 20 groups (up to ~10MB) on every keystroke
  // froze input and could silently exceed the localStorage quota.
  clearTimeout(saveSpecifiedTextGroups.__timer);
  saveSpecifiedTextGroups.__timer = setTimeout(() => saveSpecifiedTextGroups(), 400);
  const counter = document.querySelector('[data-specified-count="' + id + '"]'); if (counter) counter.textContent = specifiedTextItems(group.text).length + ' \u6761\u6587\u672c';
});
$('#specified-text-groups').addEventListener('change', (event) => {
  const id = event.target.dataset.specifiedMode; if (!id) return;
  const group = specifiedTextGroups.find((item) => item.id === id); if (!group) return;
  group.mode = event.target.value === 'random' ? 'random' : 'sequence'; group.cursor = 0; saveSpecifiedTextGroups();
});
$('#specified-text-groups').addEventListener('click', (event) => {
  const send = event.target.closest('[data-specified-send]'); if (send) return sendSpecifiedTextGroup(send.dataset.specifiedSend);
  const remove = event.target.closest('[data-specified-remove]'); if (!remove || specifiedTextGroups.length <= 1) return;
  specifiedTextGroups = specifiedTextGroups.filter((item) => item.id !== remove.dataset.specifiedRemove); saveSpecifiedTextGroups(); renderSpecifiedTextGroups();
});
$('#new-tab').addEventListener('click', () => runSyncAction('新建标签页', () => window.ops.tabAction(selectedSessionIds(), 'new', { url: normalizeUrl($('#tab-url').value) })));
$('#navigate-tab').addEventListener('click', () => runSyncAction('批量导航', () => window.ops.tabAction(selectedSessionIds(), 'navigate', { url: normalizeUrl($('#tab-url').value) })));
$('#reload-tab').addEventListener('click', () => runSyncAction('刷新标签页', () => window.ops.tabAction(selectedSessionIds(), 'reload', {})));
$('#close-tab').addEventListener('click', () => runSyncAction('关闭标签页', () => window.ops.tabAction(selectedSessionIds(), 'close', {})));
$('#close-other-tabs')?.addEventListener('click', () => runSyncAction('关闭其他标签页', () => window.ops.tabAction(selectedSessionIds(), 'closeOthers', {})));
$('#close-blank-tabs')?.addEventListener('click', () => runSyncAction('关闭空白标签页', () => window.ops.tabAction(selectedSessionIds(), 'closeBlank', {})));
$('#sync-tabs').addEventListener('click', () => runSyncAction('同步标签页', () => window.ops.tabAction(selectedSessionIds(2), 'sync', {})));
// 窗口同步快捷键（Roxy simulation 快捷键对齐）：仅在同步页生效，避免全局劫持。
// Ctrl+Alt+A 启动/停止同步；D 停止；R 重启；F3 平铺；F4 层叠；F5 批量输入；X 统一
// 标签页；B 关闭其他标签页；C 关闭当前页；N 关闭空白标签页；O 打开网址；L 全选会话；
// P 同步设置（与工具栏按钮标注一致）。
const syncShortcutHandlers = {
  'KeyA': () => $(syncState.active ? '#stop-sync' : '#start-sync')?.click(),
  'KeyD': () => $('#stop-sync')?.click(),
  'KeyR': () => $('#restart-sync')?.click(),
  'F3': () => runSyncAction('平铺窗口', () => window.ops.windowAction(selectedSessionIds(), 'tile')),
  'F4': () => runSyncAction('层叠窗口', () => window.ops.windowAction(selectedSessionIds(), 'cascade')),
  'F5': () => { document.querySelector('.sync-tab[data-console="text"]')?.click(); $('#sync-text')?.focus(); },
  'KeyX': () => document.querySelector('.sync-tab[data-console="tabs"]')?.click(),
  'KeyB': () => $('#close-other-tabs')?.click(),
  'KeyC': () => $('#close-tab')?.click(),
  'KeyN': () => $('#close-blank-tabs')?.click(),
  'KeyO': () => { document.querySelector('.sync-tab[data-console="window"]')?.click(); $('#tab-url')?.focus(); },
  'KeyL': () => $('#select-all-sessions')?.click(),
  'KeyP': () => $('#sync-settings-button')?.click(),
};
document.addEventListener('keydown', (event) => {
  if (!document.querySelector('.view.active#view-sync')) return;
  if (!(event.ctrlKey && event.altKey) || event.shiftKey || event.metaKey) return;
  const handler = syncShortcutHandlers[event.code];
  if (!handler) return;
  event.preventDefault();
  try { handler(); } catch (error) { toast(error.message); }
});
$('#clear-logs').addEventListener('click', () => { ui.logs = []; save(); renderLogs(); });
$('#choose-profile-storage').addEventListener('click', chooseProfileStorage);
$('#reset-profile-storage').addEventListener('click', resetProfileStorage);
$('#open-profile-storage').addEventListener('click', async () => { try { await window.ops.openProfileStorage(); } catch (error) { toast(error.message); log('Error', error.message); } });

window.ops.onEvent(async (value) => {
  if (value?.type === 'app-update-progress') {
    appUpdateState.progress = value;
    renderAppUpdateState();
  }
  if (value?.type === 'app-update-status') {
    applyVersionTrafficLight(value);
  }
  if (value?.type === 'profile-start-progress' && value.id) {
    if (value.error || value.starting === false) {
      clearStartingProgress(value.id);
    } else {
      setStartingProgress(value.id, value);
    }
    // ~8 progress events fire per launch. Coalesce to one render per frame —
    // or, when only the percent/label of an already-rendered start cell
    // changed (the common case mid-launch), patch that cell in place instead
    // of rebuilding the whole 100-row table.
    if (document.hidden) return;
    const existing = document.querySelector(`.start-progress[data-profile-id="${CSS.escape(value.id)}"]`);
    if (existing && !value.error && value.starting !== false) {
      updateStartProgressCell(existing, startingProfiles.get(value.id));
      return;
    }
    scheduleRenderProfiles();
  }
  if (value.type === 'status') {
    // Only terminal status clears the start bar. Intermediate emits (e.g. extensions-reconcile-skipped)
    // also set running:true and must not wipe progress mid-launch.
    if (value.id && value.running === false) clearStartingProgress(value.id);
    if (value.id && value.running === true && !value.action) clearStartingProgress(value.id);
    // Coalesce fetch+render: a batch start/stop fires many status events; without this each
    // one did 2 IPC round-trips + 2 full table rebuilds. The log() below only reads `value`.
    scheduleStatusRefresh();
    scheduleSessionRefresh();
    if (value.action === 'extensions-reconcile-skipped' && value.message) {
      // Informative only — openbrowser-148 lacks Extensions CDP; --load-extension still works.
      log('Browser', value.message);
    } else if (value.running === false && value.id) {
      const profile = ui.profiles.find((item) => item.id === value.id);
      const num = profile ? displayProfileNumber(profile) : value.id;
      if (value.reason && value.reason !== 'stop') {
        log('Browser', `环境 ${num} 已关闭（窗口退出）`);
      }
    } else if (value.message && value.action) {
      log('Browser', value.message);
    }
  }
  if (value.type === 'profile-closed' && value.profile?.id) {
    // Keep renderer UI state aligned with engine cookie snapshot after close
    const idx = ui.profiles.findIndex((p) => p.id === value.profile.id);
    if (idx >= 0) {
      const next = { ...ui.profiles[idx], ...value.profile };
      if (value.profile.cookies != null) next.cookies = value.profile.cookies;
      next.updatedAt = value.profile.updatedAt || new Date().toISOString();
      ui.profiles[idx] = normalizeProfileSettings(next);
      save();
      if (editingProfileId === value.profile.id) {
        editorSet('#editor-cookies', (() => {
          try { return next.cookies ? JSON.stringify(JSON.parse(next.cookies), null, 2) : ''; }
          catch (_) { return next.cookies || ''; }
        })());
      }
    }
  }
  if (value.type === 'profiles' && value.action === 'delete' && Array.isArray(value.ids) && value.ids.length) {
    const deletedSet = new Set(value.ids);
    const prevLen = ui.profiles.length;
    ui.profiles = ui.profiles.filter((item) => !deletedSet.has(item.id));
    for (const id of value.ids) {
      selectedProfiles.delete(id);
      selectedSessions.delete(id);
    }
    if (!ui.profiles.length) ui.nextProfileNumber = 1;
    if (ui.profiles.length !== prevLen) {
      save();
      invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
      scheduleStatusRefresh();
      scheduleSessionRefresh();
      scheduleRenderProfiles();
    }
  }
  if (value.type === 'extensions') {
    try { await refreshExtensions(); }
    catch (error) { console.error('refreshExtensions failed for extensions event:', error); }
  }
  if (value.type === 'platform-preflight' && Array.isArray(value.warnings)) {
    for (const w of value.warnings) {
      log(w.level === 'error' ? 'Error' : 'Platform', `${w.message}${w.hint ? ' — ' + w.hint : ''}`);
    }
    const blocker = value.warnings.find((w) => w.level === 'error');
    if (blocker) toast(blocker.message);
  }
  if (value.type === 'storage-settings') updateProfileStorageDisplay(value.profileRoot);
  if (value.type === 'sync-settings' && value.settings) { syncSettings = normalizeSyncSettings(value.settings); fillSyncSettingsForm(); }
  if (value.type === 'text-shortcut') {
    if (value.action === 'random-number') sendRandomNumbers();
    else if (value.action === 'same-text') sendSameText();
    else if (value.action === 'specified-text' && specifiedTextGroups[0]) sendSpecifiedTextGroup(specifiedTextGroups[0].id);
  }
  if (value.type === 'sync-state') {
    syncState = { active: value.active, master: value.master, selected: value.selected || [] };
    if (value.active) { preferredMasterId = value.master; selectedSessions = new Set(value.selected || []); syncHealth.recovering = false; }
    else syncHealth = { queueDepth: 0, coalesced: 0, dropped: 0, lastLatencyMs: 0, recovering: false };
    renderSessions(); log('Sync', value.active ? '同步已启动' : '同步已停止');
  }
  if (value.type === 'sync-health') {
    syncHealth = { ...syncHealth, ...value, recovering: false };
    // Throttle status paints — health events can fire ~1Hz while syncing.
    if (!window.__syncHealthPaintTimer) {
      window.__syncHealthPaintTimer = setTimeout(() => {
        window.__syncHealthPaintTimer = null;
        renderSyncState();
      }, 400);
    }
  }
  if (value.type === 'sync-recovering') { syncHealth.recovering = true; renderSyncState(); log('Sync', `输入桥自动恢复，第 ${value.attempt} 次`); }
  if (value.type === 'native-input' && value.active) { syncHealth.recovering = false; renderSyncState(); }
  // Skipped-segment events from live-sync: the mirror was dropped, so the
  // next event forces a full sync. Surfacing them here keeps the Sync log
  // honest about silent degradations instead of a no-op in the UI.
  if (value.type === 'sync-input-skipped') { log('Sync', `输入段跳过（${value.reason || 'native-input-failed'}），镜像已丢弃，下段将全量同步`); }
  if (value.type === 'sync-change-skipped') { log('Sync', `变更段跳过（${value.reason || 'native-change-failed'}）`); }
  if (value.type === 'sync-change-fallback') { log('Sync', `变更段以合成回退完成（${value.reason || 'native-change-failed'}）`); }
  if (value.type === 'sync-error') { toast(value.message); log('Error', value.message); }
  if (value.type === 'sync-disconnected') { toast(value.message); log('Sync', value.message); }
});

window.ops.onEvent((value) => {
  if (value.type === 'proxy-error' || value.type === 'proxy-warn') {
    const profile = ui.profiles.find((item) => item.id === value.id);
    const msg = String(value.message || '');
    const message = '环境 ' + displayProfileNumber(profile || { id: value.id }) + '：' + msg;
    if (/出口信息检测失败（语言\/时区可能回退）|本地出口信息暂不可用|Direct exit lookup|本地出口查询失败/.test(msg)) {
      log('ProxyWarn', message);
      return;
    }
    if (value.type === 'proxy-error') toast(message);
    log(value.type === 'proxy-error' ? 'Proxy' : 'ProxyWarn', message);
  }
});

function updateProfileStorageDisplay(profileRoot) {
  const value = String(profileRoot || '');
  const current = $('#profile-storage-path'); if (current) current.textContent = value;
  const runtimeValue = document.querySelector('[data-runtime-key="Profile root"]'); if (runtimeValue) runtimeValue.textContent = value;
}

function renderRuntimeInfo(info) {
  const runtime = $('#runtime-info'); runtime.replaceChildren();
  const rows = [
    [t('system.runtime'), info.appVersion],
    [t('system.cdp'), info.chrome],
    [t('system.storage.current'), info.profileRoot],
  ];
  for (const [key, value] of rows) {
    const row = document.createElement('div'); const output = element('dd', '', value); output.dataset.runtimeKey = key;
    row.append(element('dt', '', key), output); runtime.append(row);
  }
  updateProfileStorageDisplay(info.profileRoot);
}

async function chooseProfileStorage() {
  const button = $('#choose-profile-storage'); button.disabled = true;
  try {
    const result = await window.ops.chooseProfileStorage(); if (result.canceled) return;
    updateProfileStorageDisplay(result.profileRoot); log('System', '\u73af\u5883\u6570\u636e\u4f4d\u7f6e\u5df2\u66f4\u6539\u4e3a ' + result.profileRoot); toast('\u73af\u5883\u6570\u636e\u4f4d\u7f6e\u5df2\u66f4\u6539\uff0c\u4e0b\u6b21\u542f\u52a8\u73af\u5883\u65f6\u751f\u6548');
  } catch (error) { toast(error.message); log('Error', error.message); } finally { button.disabled = false; }
}

async function resetProfileStorage() {
  const button = $('#reset-profile-storage'); button.disabled = true;
  try {
    const result = await window.ops.resetProfileStorage(); updateProfileStorageDisplay(result.profileRoot); log('System', '\u73af\u5883\u6570\u636e\u4f4d\u7f6e\u5df2\u6062\u590d\u9ed8\u8ba4'); toast('\u5df2\u6062\u590d\u9ed8\u8ba4\u6570\u636e\u4f4d\u7f6e');
  } catch (error) { toast(error.message); log('Error', error.message); } finally { button.disabled = false; }
}
function updateEngineBadge(info) {
  const badge = $('#engine-badge');
  if (!badge) return;
  const browsers = Array.isArray(info?.browsers) ? info.browsers : [];
  const ready = browsers.length > 0;
  const names = browsers.map((item) => item.name || item.path || '').filter(Boolean);
  badge.classList.remove('engine-badge-checking', 'engine-badge-ok', 'engine-badge-missing');
  badge.classList.add(ready ? 'engine-badge-ok' : 'engine-badge-missing');
  const text = badge.querySelector('.engine-badge-text');
  if (text) text.textContent = ready ? t('header.browserReady') : t('header.browserMissing');
  badge.title = ready
    ? (names.length ? names.join(' · ') : t('header.browserReadyTitle'))
    : t('header.browserMissingTitle');
  badge.setAttribute('aria-label', badge.title);
}

async function initialize() {
  refreshLocaleChrome();
  const info = await window.ops.getInfo();
  const appVersion = document.getElementById('app-version');
  if (appVersion && info?.appVersion) appVersion.textContent = `v${info.appVersion}`;
  applyVersionTrafficLight({ light: 'checking', currentVersion: info?.appVersion });
  // Backend also pushes app-update-status after startup delay; this primes the light immediately.
  updateEngineBadge(info);
  renderRuntimeInfo(info);
  const closeActionCard = document.getElementById('close-action-card');
  if (closeActionCard) {
    if (info?.platform === 'darwin') {
      closeActionCard.hidden = true;
    }
    const currentAction = info?.closeAction || 'tray';
    const radio = closeActionCard.querySelector(`input[name="close-action-radio"][value="${currentAction}"]`);
    if (radio) radio.checked = true;
    closeActionCard.querySelectorAll('input[name="close-action-radio"]').forEach((input) => {
      input.addEventListener('change', async () => {
        try {
          await window.ops.setCloseAction(input.value);
          toast(tx('关闭窗口设置已更新'));
        } catch (e) {
          toast(tx('设置失败：') + e.message);
        }
      });
    });
  }
  syncState = await window.ops.getSyncState(); preferredMasterId = syncState.master || null; if (syncState.active) selectedSessions = new Set(syncState.selected || []);
  await applySyncSettings(syncSettings); fillSyncSettingsForm();
  ui.profiles = ui.profiles.map((item) => ({ ...item, browser: 'Google Chrome' }));
  await refreshProxies().catch(() => {});
  // Merge secrets already loaded in main process (not stored in localStorage).
  try {
    const engineStatus = await window.ops.profileStatus();
    if (Array.isArray(engineStatus)) {
      ui.profiles = window.OpenBrowserProfileState.reconcileProfiles({
        localProfiles: ui.profiles,
        engineProfiles: engineStatus,
        normalizeProfile: normalizeProfileSettings,
        mergeProxy: mergeRemoteProxy,
        restoreProxy(proxy, proxyId) {
          if (!proxyId || proxyHasCredentials(proxy)) return proxy;
          const item = proxyLibraryItem(proxyId);
          const fullProxy = item && parseProxyInputForUi(item, item.protocol || 'socks5')?.raw;
          return fullProxy && proxyHasCredentials(fullProxy) ? fullProxy : proxy;
        },
      });
    }
  } catch (_) {}
  save();
  try {
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
  } catch (err) {
    // A failed first sync must not abort the rest of UI init: the engine
    // store keeps whatever init loaded; later syncs retry the reconcile.
    console.error('[renderer] initial profile sync failed:', err?.message || err);
  }
  await refreshExtensions(); await refreshSessions(); renderProfiles(); renderLogs();
  log('System', readyBrowserLog(info));
  switchView(document.querySelector('.view.active')?.id?.replace(/^view-/, '') || 'profiles');
}
function readyBrowserLog(info) {
  const n = Array.isArray(info?.browsers) ? info.browsers.length : 0;
  return n > 0 ? `引擎启动 · ${n} 个浏览器可用` : '引擎启动 · 未找到浏览器';
}
initialize().catch((error) => {
  updateEngineBadge({ browsers: [] });
  log('Error', error.message);
  toast(error.message);
});


function parseCsvLine(line) {
  const values = []; let current = ''; let quoted = false;
  for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(current.trim()); current = ''; } else current += char; }
  values.push(current.trim()); return values;
}

// 导入行数上限：此前一百万行的文件会被完整 parse、逐行构造成环境对象、
// 再整份发往 IPC，配额兜底在那之后才裁剪。10,000 行在解析边界就截断——
// 整数好记，且比任何真实环境清单大一个量级以上。
const IMPORT_ROW_CAP = 10000;
function parseImportedProfiles(text, extension) {
  if (extension === 'json') {
    const values = JSON.parse(text); if (!Array.isArray(values)) throw new Error('\u5bfc\u5165 JSON \u5fc5\u987b\u662f\u6570\u7ec4');
    return { rows: values.slice(0, IMPORT_ROW_CAP), truncated: values.length > IMPORT_ROW_CAP };
  }
  const lines = text.split(/\r?\n/).filter((line) => line.trim()); if (lines.length < 2) return { rows: [], truncated: false };
  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
  // 截断发生在逐行构造对象之前：数据行 = lines[1..]，含表头共取 CAP+1 行。
  const body = lines.slice(1, IMPORT_ROW_CAP + 1);
  return { rows: body.map((line, row) => { const values = parseCsvLine(line); const item = Object.fromEntries(headers.map((key, index) => [key, values[index] || ''])); return { id: item.id || 'env-import-' + Date.now().toString(36) + '-' + row, name: item.name || item.id || 'Imported ' + (row + 1), browser: item.browser || 'Google Chrome', language: item.language || 'en-US', proxy: item.proxy || item.ip || 'Direct', proxyType: item.proxytype || '', exitIp: item.ip || '', exitCountryCode: item.countrycode || '', tag: item.tag || item.group || 'Imported', os: 'Windows', location: item.location || 'Local' }; }), truncated: lines.length - 1 > IMPORT_ROW_CAP };
}

$('#batch-import').addEventListener('click', () => $('#batch-import-file').click());
$('#batch-import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0]; if (!file) return;
  const previousLength = ui.profiles.length; const previousNext = ui.nextProfileNumber;
  try {
    const extension = file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv'; const parsed = parseImportedProfiles(await file.text(), extension);
    const imported = parsed.rows;
    const start = nextProfileNumber(); const used = new Set(ui.profiles.map((item) => item.id));
    const normalized = imported.map((item, index) => { const number = start + index; const id = createInternalProfileId(number, used); used.add(id); return { id, number, name: String(number), browser: 'Google Chrome', language: String(item.language || 'en-US'), proxy: String(item.proxy || item.ip || 'Direct'), proxyType: String(item.proxyType || item.proxytype || ''), exitIp: String(item.exitIp || item.ip || ''), exitCountryCode: String(item.exitCountryCode || item.countrycode || ''), tag: String(item.tag || item.group || 'Imported'), os: 'Windows', location: String(item.location || 'Local') }; });
    ui.profiles.push(...normalized); ui.nextProfileNumber = start + normalized.length; save(); invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']); engineProfiles = await window.ops.syncProfiles(ui.profiles); renderProfiles(); log('Import', '\u6279\u91cf\u5bfc\u5165 ' + normalized.length + ' \u4e2a\u73af\u5883');
    // 截断必须用户可见（沿用既有 toast 约定），否则用户以为全量导入成功。
    if (parsed.truncated) toast('\u5df2\u5bfc\u5165 ' + normalized.length + ' \u4e2a\u73af\u5883\uff08\u8d85\u51fa\u4e0a\u9650\uff0c\u5df2\u622a\u65ad\u4e3a\u524d ' + normalized.length + ' \u884c\uff09');
    else toast('\u5df2\u5bfc\u5165 ' + normalized.length + ' \u4e2a\u73af\u5883');
  } catch (error) { ui.profiles = ui.profiles.slice(0, previousLength); ui.nextProfileNumber = previousNext; save(); toast('\u5bfc\u5165\u5931\u8d25\uff1a' + error.message); }
  event.target.value = '';
});


// Roxy 对齐：批量导出窗口（脱敏密码/2FA）与 测试全部代理IP
function sanitizeProfileForExport(profile) {
  return {
    ...profile,
    platform: {
      ...(profile.platform || {}),
      password: '',
      totpSecret: '',
      accounts: Array.isArray(profile.platform?.accounts)
        ? profile.platform.accounts.map((acc) => ({ ...acc, password: '', totpSecret: '' }))
        : [],
    },
  };
}
$('#batch-export')?.addEventListener('click', () => {
  const source = selectedProfiles.size ? ui.profiles.filter((p) => selectedProfiles.has(p.id)) : ui.profiles.filter((p) => !p.trashed);
  const items = source.map(sanitizeProfileForExport);
  if (!items.length) return toast(t('profiles.exportNone'));
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `profiles-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('profiles.exportDone', { n: items.length }));
});
$('#test-all-proxies')?.addEventListener('click', async () => {
  const targets = ui.profiles.filter((p) => !p.trashed && p.networkMode === 'proxy');
  if (!targets.length) return toast(t('profiles.testAllNone'));
  toast(t('profiles.testAllStart'));
  let ok = 0; let bad = 0; let index = 0;
  const worker = async () => {
    while (index < targets.length) {
      const profile = targets[index++];
      try {
        const result = await window.ops.testProfileProxy(profile);
        if (result?.ip) {
          ok += 1;
          profile.exitIp = String(result.ip).slice(0, 80);
          if (result.countryCode) profile.exitCountryCode = String(result.countryCode).slice(0, 4);
          profile.exitCheckedAt = new Date().toISOString();
        } else bad += 1;
      } catch (_) { bad += 1; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, targets.length) }, worker));
  save(); invalidateViewCache('profiles'); renderProfiles();
  toast(t('profiles.testAllDone', { ok, bad }));
});

$('#batch-update').addEventListener('click', () => {
  if (!selectedProfiles.size) return toast(tx('请先选择环境'));
  const proxyRadio = document.querySelector('input[name="batch-update-network"][value="proxy"]');
  if (proxyRadio) proxyRadio.checked = true;
  const hidden = $('#batch-update-network-mode'); if (hidden) hidden.value = 'proxy';
  const fields = $('#batch-update-proxy-fields'); if (fields) fields.hidden = false;
  const submit = $('#batch-update-submit'); if (submit) submit.textContent = tx('检测并应用代理');
  $('#batch-update-dialog').showModal();
});
$('#batch-update-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (event.submitter?.value === 'cancel') return $('#batch-update-dialog').close();
  const submitter = event.submitter; if (submitter && submitter.value !== 'cancel') submitter.disabled = true;
  const mode = document.querySelector('input[name="batch-update-network"]:checked')?.value
    || $('#batch-update-network-mode')?.value
    || 'proxy';
  const restart = !!$('#restart-running')?.checked;
  try {
    let proxies = null;
    if (mode !== 'direct') {
      try { proxies = proxyLines('#batch-proxy-list', '#batch-update-proxy-type'); }
      catch (error) { return toast(tx('代理格式错误：') + error.message); }
    }
    const result = await applySelectedNetworkMode(mode === 'direct' ? 'direct' : 'proxy', { proxies, restart });
    $('#batch-update-dialog').close();
    $('#batch-proxy-list').value = '';
    const modeText = result.direct ? '本地直连' : '已验证代理';
    log('Batch', '批量更新 ' + result.count + ' 个环境 · ' + modeText);
    toast(tx('已将 ') + result.count + tx(' 个环境更新为') + modeText);
  } catch (error) {
    log('Proxy', '批量更新失败 · ' + error.message);
    toast(error.message);
  } finally { if (submitter) submitter.disabled = false; }
});


// Expose core app utilities and state to UI submodules
window.OpenBrowserApp = {
  get ui() { return ui; },
  get engineProfiles() { return engineProfiles; },
  get editingProfileId() { return editingProfileId; },
  get loadedViews() { return loadedViews; },
  invalidateViewCache,
  save,
  toast,
  tx,
  t,
  log,
  $,
  $$,
  element,
  buildSquareMark,
  displayProfileNumber,
  updateEngineBadge,
  afterUiRender,
  syncThemedSelects,
  editorDraft,
  openProfileEditor,
  renderProfiles,
};
window.ui = ui;
window.save = save;
window.toast = toast;
window.tx = tx;
window.t = t;
window.log = log;
window.$ = $;
window.loadedViews = loadedViews;
window.invalidateViewCache = invalidateViewCache;
window.$$ = $$;
window.element = element;
window.buildSquareMark = buildSquareMark;
window.displayProfileNumber = displayProfileNumber;
window.updateEngineBadge = updateEngineBadge;
window.afterUiRender = afterUiRender;
window.syncThemedSelects = syncThemedSelects;
// Editor/proxy glue whose only remaining callers live in ui/ui-editor.js and
// ui/ui-proxy.js; exported here explicitly so the cross-file contract stays
// visible (they are already script globals via their declarations).
window.parseEditorProxy = parseEditorProxy;
window.splitProxyRemarkForUi = splitProxyRemarkForUi;
window.editorCheck = editorCheck;
window.serializeEditorProxy = serializeEditorProxy;
window.editorResolution = editorResolution;
window.editorCookies = editorCookies;
window.renderProxyLibrarySelectors = renderProxyLibrarySelectors;
window.normalizedProxyType = normalizedProxyType;
// Proxy/session actions whose only remaining callers are the event handlers in
// ui/ui-proxy-wiring.js (and the editor domain module); exported explicitly so
// the cross-file contract stays visible.
window.testEditorProxy = testEditorProxy;
window.applyEditorProxyFingerprint = applyEditorProxyFingerprint;
window.refreshEditorProxy = refreshEditorProxy;
window.checkProfileProxy = checkProfileProxy;
window.handleQuickPasteToInput = handleQuickPasteToInput;
window.installProxyTypeControl = installProxyTypeControl;
window.normalizeProxyAssociationForUi = normalizeProxyAssociationForUi;
window.openAssign = openAssign;
window.purgeProfile = purgeProfile;
window.restoreProfile = restoreProfile;
window.cloneProfile = cloneProfile;

// Submodules extracted to ui/:
// - ui/ui-rpa.js (RPA flow execution & template catalog)
// - ui/ui-api-mcp.js (Local API & MCP config UI)
// - ui/ui-kernel.js (Browser kernel manager UI)
// - ui/ui-cloud.js (Cloud backup & WebDAV sync UI)

// hook system view
const _switchViewKernel = switchView;
switchView = function(view) {
  _switchViewKernel.apply(this, arguments);
  // Re-translate only the view that was activated. Static copy lives inside its
  // view, so a document-wide scan is unnecessary and becomes visible on large lists.
  try {
    const root = document.getElementById('view-' + view) || document;
    afterUiRender(root);
  } catch (_) {}
  if (view === 'system') {
    refreshLocaleChrome();
    try { window.ensureKernelInitialLoad?.(); } catch (_) {}
    try { refreshKernelPanel?.(); } catch (_) {}
    try { refreshApiMcpPage?.().catch(() => setLocalApiStatus?.(false)); } catch (_) {}
    try { refreshCloudPanel?.().catch(() => {}); } catch (_) {}
  }
  if (view === 'api-mcp') {
    if (!loadedViews.has('api-mcp')) {
      try { refreshApiMcpPage?.().catch(() => {}); } catch (_) {}
      loadedViews.add('api-mcp');
    }
    afterUiRender(document.getElementById('view-api-mcp') || document);
  }
  if (view === 'rpa-guide') {
    afterUiRender(document.getElementById('view-rpa-guide') || document);
  }
};

window.ops.onEvent((value) => {
  // kernel-progress is fully handled by ui/ui-kernel.js handleKernelProgressEvent
  // (progress bar + stage labels + cancel/refresh); handling it here as well made
  // lagging download events overwrite the final result in #kernel-progress.
  if (value?.type === 'kernel-error') {
    const progress = document.getElementById('kernel-progress');
    if (progress) progress.textContent = value.message || tx('内核准备失败');
    toast(value.message || tx('内核准备失败'));
    refreshKernelPanel().catch(() => {});
  }
  if (value?.type === 'kernel-ready') refreshKernelPanel().catch(() => {});
  if (value?.type === 'cloud-sync') {
    refreshCloudPanel().catch(() => {});
  }
});

$('#batch-edit-preferences')?.addEventListener('click', () => {
  const sources = ui.profiles.filter((profile) => selectedProfiles.has(profile.id));
  if (!sources.length) return toast(tx('请先选择环境'));
  const templateSelect = $('#batch-pref-template');
  if (templateSelect) {
    templateSelect.replaceChildren(new Option(tx('手动指定下方偏好设置'), ''));
    ui.profiles.forEach((profile) => templateSelect.append(new Option(
      `环境 ${displayProfileNumber(profile)}${profile.title ? ' · ' + profile.title : ''}`,
      profile.id,
    )));
  }
  $('#batch-pref-start-url').value = '';
  $('#batch-pref-clear-start-url').checked = false;
  $('#batch-pref-os').value = '';
  $('#batch-pref-resolution').value = '';
  ['batch-pref-block-images', 'batch-pref-block-sound', 'batch-pref-clear-cache', 'batch-pref-multi-open']
    .forEach((id) => { const el = $('#' + id); if (el) el.value = 'keep'; });
  const summary = $('#batch-pref-summary');
  if (summary) summary.textContent = tx('将偏好设置统一应用到已勾选的 ') + sources.length + tx(' 个环境');
  $('#batch-preferences-dialog')?.showModal();
});

$('#batch-preferences-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (event.submitter?.value === 'cancel') return $('#batch-preferences-dialog')?.close();
  const sources = ui.profiles.filter((profile) => selectedProfiles.has(profile.id));
  if (!sources.length) return toast(tx('请先选择环境'));

  const templateId = $('#batch-pref-template')?.value;
  const templateProfile = templateId ? ui.profiles.find((item) => item.id === templateId) : null;
  let startUrl = '';
  try { startUrl = normalizeOptionalWebUrl($('#batch-pref-start-url')?.value || ''); } catch (e) { return toast(e.message); }
  const clearStartUrl = Boolean($('#batch-pref-clear-start-url')?.checked);
  const os = $('#batch-pref-os')?.value;
  const resolution = $('#batch-pref-resolution')?.value;
  const preferenceModes = {
    blockImages: $('#batch-pref-block-images')?.value || 'keep',
    blockSound: $('#batch-pref-block-sound')?.value || 'keep',
    clearCacheOnStart: $('#batch-pref-clear-cache')?.value || 'keep',
    multiOpen: $('#batch-pref-multi-open')?.value || 'keep',
  };

  let width, height;
  if (resolution) {
    const [w, h] = resolution.split('x').map(Number);
    if (w && h) { width = w; height = h; }
  }

  const before = new Map(sources.map((item) => [item.id, structuredClone(item)]));
  const submit = event.submitter;
  if (submit) submit.disabled = true;
  try {
    for (const item of sources) {
      if (templateProfile) {
        const prefs = cloneProfilePreferences(templateProfile);
        const currentPlatform = item.platform || {};
        prefs.platform = {
          ...(prefs.platform || {}),
          username: currentPlatform.username || '',
          password: currentPlatform.password || '',
          totpSecret: currentPlatform.totpSecret || '',
        };
        Object.assign(item, prefs);
      }
      if (clearStartUrl) {
        item.platform = { ...(item.platform || {}), startUrl: '' };
        item.advanced = { ...(item.advanced || {}), startUrls: '' };
      } else if (startUrl) {
        item.platform = { ...(item.platform || {}), startUrl };
        item.advanced = { ...(item.advanced || {}), startUrls: startUrl };
      }
      if (os) item.os = os;
      if (width && height) { item.width = width; item.height = height; }
      for (const [key, mode] of Object.entries(preferenceModes)) {
        if (mode !== 'keep') item.advanced = { ...(item.advanced || {}), [key]: mode === 'on' };
      }
    }

    save();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    engineProfiles = await window.ops.syncProfiles(ui.profiles);
    $('#batch-preferences-dialog')?.close();
    renderProfiles();
    log('Batch', `已批量更新 ${sources.length} 个环境的偏好设置`);
    toast(tx('已批量更新 ') + sources.length + tx(' 个环境的偏好设置'));
  } catch (error) {
    for (const item of sources) {
      const original = before.get(item.id);
      if (!original) continue;
      const index = ui.profiles.findIndex((profile) => profile.id === item.id);
      if (index >= 0) ui.profiles[index] = original;
    }
    save();
    toast(tx('批量偏好设置失败：') + error.message);
  } finally {
    if (submit) submit.disabled = false;
  }
});
