// Proxy UI domain module (classic script, no build step).
// Loaded before renderer.js; declares the proxy-domain functions renderer.js
// and its event wiring call as shared script globals. The load-time event
// wiring itself stays in renderer.js, where $ / document and the editor
// helpers exist at evaluation time. Keep this file function-declarations-only:
// no top-level statements, or the load order breaks.
//
// Functions (verbatim from renderer.js):
//   parseProxyInputForUi / applyProxyLibrarySelection / proxyHasCredentials /
//   mergeRemoteProxy / proxyAuthActionForUpdate — editor-side proxy parsing,
//   library selection and auth merge policy
//   renderProxies / refreshProxies / openProxyDialog / readProxyForm —
//   the proxies view and the proxy dialog form
//   runProxyBatchCheck / openProxyApplyDialog — batch check & apply flows
//   handleProxyRawChange / handleProxyHostChange — live form re-parse handlers
//   applySelectedNetworkMode — batch network-mode apply

function parseProxyInputForUi(value, selectedType = 'socks5') {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const raw = value.raw ?? value.proxy ?? value.proxy_url ?? value.proxyUrl;
    if (raw != null && String(raw).trim()) {
      const parsed = parseProxyInputForUi(raw, value.protocol ?? value.type ?? selectedType);
      const redacted = parsed && [parsed.username, parsed.password].some((part) => /^\*+$/.test(String(part || '')));
      if (parsed && !redacted) {
        if (value.name) parsed.name = String(value.name).trim();
        if (value.remark && !parsed.remark) parsed.remark = String(value.remark).trim();
        return parsed;
      }
    }
    const protocol = normalizeProxyProtocolForUi(value.protocol ?? value.type ?? value.proxy_type ?? selectedType);
    const host = value.host ?? value.proxy_host ?? value.proxyHost ?? value.server;
    const port = value.port ?? value.proxy_port ?? value.proxyPort;
    if (host == null || port == null) return null;
    return {
      raw: buildProxyUiValue({
        protocol,
        host,
        port,
        username: value.username ?? value.user ?? value.proxy_user ?? value.proxy_username ?? '',
        password: value.password ?? value.pass ?? value.proxy_password ?? '',
        remark: value.remark ?? value.note ?? '',
      }),
      protocol,
      host: proxyHostForUi(host),
      port: String(Number(port)),
      username: String(value.username ?? value.user ?? value.proxy_user ?? value.proxy_username ?? ''),
      password: String(value.password ?? value.pass ?? value.proxy_password ?? ''),
      authenticated: Boolean(value.username || value.user || value.password || value.pass),
      remark: String(value.remark ?? value.note ?? '').trim(),
      name: String(value.name || value.remark || `${protocol.toUpperCase()} ${host}:${port}`).trim(),
    };
  }
  const rawValue = String(value || '').trim();
  if (!rawValue || /^(direct|offline|none)$/i.test(rawValue)) return null;
  let { source, remark } = splitProxyRemarkForUi(rawValue);
  if (!source) return null;

  source = source.replace(/^[\"'`(]+|[\"'`)]+$/g, '').trim();
  if (source.endsWith('/')) source = source.slice(0, -1).trim();
  if (!source || /^(direct|offline|none)$/i.test(source)) return null;

  let protocol = normalizeProxyProtocolForUi(selectedType);
  let body = source;
  const scheme = source.match(/^([a-z][a-z0-9+.-]*):\/\/([\s\S]*)$/i);
  if (scheme) {
    protocol = normalizeProxyProtocolForUi(scheme[1]);
    body = scheme[2];
  }

  let host = '';
  let port = '';
  let username = '';
  let password = '';
  const legacyWithScheme = scheme && body.match(/^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5}):([^:]*):([\s\S]*)$/);
  const legacyWithoutScheme = !scheme && body.match(/^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5}):([^:]*):([\s\S]*)$/);
  if (legacyWithScheme || legacyWithoutScheme) {
    const match = legacyWithScheme || legacyWithoutScheme;
    host = proxyHostForUi(match[1]); port = match[2]; username = decodeProxyPartForUi(match[3]); password = decodeProxyPartForUi(match[4]);
  } else if (scheme) {
    // Match the endpoint from the right. This accepts vendor-style `\\@` and
    // keeps raw @, /, and backslashes inside credentials intact.
    const authority = body.match(/^([\s\S]*?)(?:(\\@|@))?(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})$/);
    if (!authority) throw new Error(tx('代理 URI 格式无效'));
    const userinfo = authority[1];
    const hasAuthSeparator = Boolean(authority[2]);
    host = proxyHostForUi(authority[3]); port = authority[4];
    if (hasAuthSeparator) {
      const separator = userinfo.indexOf(':');
      username = decodeProxyPartForUi(separator < 0 ? userinfo : userinfo.slice(0, separator));
      password = decodeProxyPartForUi(separator < 0 ? '' : userinfo.slice(separator + 1));
    } else if (userinfo) {
      throw new Error(tx('代理 URI 凭据格式无效'));
    }
  } else {
    const userAtHost = body.match(/^([\s\S]*?)(?:(\\@|@))(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})\/?$/);
    const hostAtUser = !userAtHost && body.match(/^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})@([\s\S]*)\/?$/);
    const endpoint = !userAtHost && !hostAtUser && body.match(/^(\[[^\]]+\]|[a-zA-Z0-9._-]+):(\d{1,5})$/);
    if (userAtHost) {
      protocol = 'socks5';
      host = proxyHostForUi(userAtHost[3]); port = userAtHost[4];
      const userinfo = userAtHost[1];
      const separator = userinfo.indexOf(':');
      username = decodeProxyPartForUi(separator < 0 ? userinfo : userinfo.slice(0, separator));
      password = decodeProxyPartForUi(separator < 0 ? '' : userinfo.slice(separator + 1));
    } else if (hostAtUser) {
      protocol = 'socks5';
      host = proxyHostForUi(hostAtUser[1]); port = hostAtUser[2];
      const userinfo = hostAtUser[3];
      const separator = userinfo.indexOf(':');
      username = decodeProxyPartForUi(separator < 0 ? userinfo : userinfo.slice(0, separator));
      password = decodeProxyPartForUi(separator < 0 ? '' : userinfo.slice(separator + 1));
    } else if (endpoint) {
      host = proxyHostForUi(endpoint[1]); port = endpoint[2];
    } else {
      let tokens = null;
      if (body.includes(',')) {
        tokens = body.split(',').map((t) => t.trim());
      } else if (body.includes('|')) {
        tokens = body.split('|').map((t) => t.trim());
      } else if (/\s+/.test(body)) {
        tokens = body.split(/\s+/).map((t) => t.trim());
      } else if (/^([a-zA-Z0-9._-]+)-(\d{1,5})(?:-(.*?)(?:-([\s\S]*))?)?$/.test(body)) {
        const hm = body.match(/^([a-zA-Z0-9._-]+)-(\d{1,5})(?:-(.*?)(?:-([\s\S]*))?)?$/);
        if (hm) tokens = [hm[1], hm[2], hm[3] || '', hm[4] || ''].filter((x, idx) => idx < 2 || x);
      }
      if (tokens && tokens.length >= 2) {
        if (/^(socks5|socks4|http|https)$/i.test(tokens[0])) {
          protocol = normalizeProxyProtocolForUi(tokens[0]);
          tokens = tokens.slice(1);
        }
        if (tokens.length >= 2 && /^\d{1,5}$/.test(tokens[1])) {
          host = proxyHostForUi(tokens[0]);
          port = tokens[1];
          username = tokens[2] ? decodeProxyPartForUi(tokens[2]) : '';
          password = tokens[3] ? decodeProxyPartForUi(tokens.slice(3).join(':')) : '';
        }
      }
      if (!host || !port) {
        throw new Error(tx('代理格式应为 IP:端口、IP:端口:用户名:密码或 protocol://用户名:密码@主机:端口'));
      }
    }
  }
  const canonical = buildProxyUiValue({ protocol, host, port, username, password, remark });
  return {
    raw: canonical,
    protocol: normalizeProxyProtocolForUi(protocol),
    host,
    port: String(Number(port)),
    username,
    password,
    authenticated: Boolean(username || password),
    remark,
    name: remark || `${normalizeProxyProtocolForUi(protocol).toUpperCase()} ${host}:${port}`,
  };
}

function applyProxyLibrarySelection(kind, id) {
  const item = typeof id === 'object' && id ? id : proxyLibraryItem(id);
  if (!item) return;
  window.__proxyLibrarySelectionInProgress = true;
  try {
    const editor = kind === 'editor';
    const networkName = editor ? 'editor-network' : 'create-network';
    const proxyValue = editor ? 'custom' : 'proxy';
    const radio = document.querySelector(`input[name="${networkName}"][value="${proxyValue}"]`);
    if (radio) {
      radio.checked = true;
      try { radio.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
    }
    const prefix = editor ? 'editor' : 'create';
    // Same defensive parse as openProxyDialog: this runs synchronously inside
    // the #editor-proxy-library change listener (ui/ui-proxy-wiring.js), so a
    // malformed stored raw would crash the listener. Toast + fall back to the
    // per-field values below.
    let parsed = null;
    try { parsed = parseProxyInputForUi(item.raw || item, item.protocol || 'socks5'); }
    catch (error) { toast(tx('代理格式错误：') + error.message); }
    editorSet(`#${prefix}-proxy-type`, parsed?.protocol || item.protocol || 'socks5');
    editorSet(`#${prefix}-proxy-host`, parsed?.host || item.host || '');
    editorSet(`#${prefix}-proxy-port`, parsed?.port || item.port || '');
    editorSet(`#${prefix}-proxy-user`, parsed?.username || item.username || '');
    editorSet(`#${prefix}-proxy-password`, parsed?.password || item.password || '');
    const rawVal = parsed?.raw || item.raw || buildProxyUiValue(item);
    const rawEl = $(`#${prefix}-proxy-raw`);
    if (rawEl) rawEl.value = rawVal;
    const inputEl = $(`#${prefix}-proxy-input`);
    if (inputEl) inputEl.value = rawVal;
    const select = $(`#${prefix}-proxy-library`);
    if (select) {
      select.value = String(item.id);
      syncThemedSelect(select);
    }
    syncThemedSelects(`#${prefix}-proxy-library, #${prefix}-proxy-type`);
    if (editor) {
      const status = $('#editor-proxy-library-status');
      if (status) status.textContent = tx('已关联代理库：') + proxyLibraryLabel(item);
      window.__editorProxyAuthTouched = false;
    }
  } finally {
    window.__proxyLibrarySelectionInProgress = false;
  }
}

function proxyHasCredentials(value) {
  const parsed = parseEditorProxy(value);
  return Boolean(String(parsed.username || '') || String(parsed.password || ''));
}

function mergeRemoteProxy(localValue, remoteValue) {
  const local = String(localValue || '').trim();
  const remote = String(remoteValue || '').trim();
  // Renderer storage deliberately redacts proxy credentials. Prefer the main
  // process value when it is the only side that still has the credentials.
  if (remote && proxyHasCredentials(remote) && !proxyHasCredentials(local)) return remote;
  if (local) return local;
  return remote;
}

function proxyAuthActionForUpdate(currentValue, nextValue, networkMode = 'proxy') {
  if (networkMode === 'direct') return null;
  const current = parseEditorProxy(currentValue);
  const next = parseEditorProxy(nextValue);
  const sameEndpoint = current.mode === 'custom'
    && next.mode === 'custom'
    && current.type === next.type
    && current.host === next.host
    && String(current.port || '') === String(next.port || '');
  if (sameEndpoint
    && (String(current.username || '') || String(current.password || ''))
    && !String(next.username || '')
    && !String(next.password || '')) {
    if (typeof window !== 'undefined' && !window.__editorProxyAuthTouched) return null;
    return 'clear';
  }
  return null;
}

/**
 * Relative check-time label ("5 分钟前" / absolute fallback), matching the
 * reference proxy page's 检测时间 column. Pure function so the selftest can
 * exercise it without a DOM.
 */
function formatProxyCheckTime(iso) {
  const time = Date.parse(String(iso || ''));
  if (!Number.isFinite(time)) return '—';
  const diff = Date.now() - time;
  if (diff >= 0 && diff < 60_000) return '刚刚';
  if (diff >= 0 && diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff >= 0 && diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  const date = new Date(time);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Filter predicate for the proxy toolbar select (全部/仅可用/仅失败/未检测). */
function matchesProxyFilter(item, filter) {
  if (!filter || filter === 'all') return true;
  if (filter === 'ok') return item.lastCheckOk === true;
  if (filter === 'fail') return item.lastCheckOk === false;
  if (filter === 'unchecked') return item.lastCheckOk == null;
  return true;
}

/**
 * Proxies currently visible in the proxies view: toolbar status filter plus
 * the live search box. Shared by renderProxies and the select-all handler
 * (ui/ui-proxy-wiring.js) so "select all" never grabs hidden rows.
 */
function visibleProxies(library) {
  const q = ($('#proxy-search')?.value || '').trim().toLowerCase();
  const filter = $('#proxy-filter')?.value || 'all';
  return (library || proxyLibrary || []).filter((item) => matchesProxyFilter(item, filter)
    && (!q || [item.name, item.host, item.protocol, item.remark, item.lastIp, String(item.port)].join(' ').toLowerCase().includes(q)));
}

/**
 * Export selected proxies as importable text lines (one raw proxy per line,
 * optionally followed by `#出口IP` as a remark-free hint the parser ignores).
 * Pure function; the wiring layer turns it into a download.
 */
function buildProxyExportText(items) {
  const lines = [];
  for (const item of items || []) {
    const raw = String(item.raw || '').trim() || `${item.host}:${item.port}`;
    if (!raw) continue;
    lines.push(raw);
  }
  return lines.join('\n') + (lines.length ? '\n' : '');
}

/**
 * Parse batch-import lines into create drafts with reference-style feedback:
 * duplicates (against the input itself and the existing library) are dropped,
 * unparsable lines are reported by line number. Pure function.
 */
function normalizeProxyImportLines(lines, existingItems, defaultProtocol = 'socks5', limit = 500) {
  const seen = new Set();
  const existingKeys = new Set();
  for (const item of existingItems || []) {
    if (!item) continue;
    existingKeys.add(`${item.protocol || ''}|${String(item.host || '').toLowerCase()}|${Number(item.port) || 0}|${item.username || ''}`);
  }
  const drafts = [];
  const missing = [];
  let duplicates = 0;
  let truncated = false;
  const queue = (Array.isArray(lines) ? lines : String(lines || '').split('\n'))
    .map((line) => String(line).trim())
    .filter((line) => line && !line.startsWith('//') && !line.startsWith('#'));
  for (const [index, line] of queue.entries()) {
    if (drafts.length >= limit) { truncated = true; break; }
    let parsed = null;
    try { parsed = parseProxyInputForUi(line, defaultProtocol); }
    catch (_) { /* unparsable line: counted as missing below */ }
    if (!parsed || !parsed.host || !parsed.port) { missing.push(index + 1); continue; }
    const key = `${parsed.protocol}|${String(parsed.host).toLowerCase()}|${Number(parsed.port) || 0}|${parsed.username || ''}`;
    if (seen.has(key) || existingKeys.has(key)) { duplicates += 1; continue; }
    seen.add(key);
    drafts.push({
      name: parsed.name || `${parsed.protocol.toUpperCase()} ${parsed.host}:${parsed.port}`,
      protocol: parsed.protocol,
      host: parsed.host,
      port: Number(parsed.port),
      username: parsed.username || '',
      password: parsed.password || '',
      raw: parsed.raw,
      remark: parsed.remark || '',
    });
  }
  return { drafts, duplicates, missing, truncated, total: queue.length };
}

function renderProxies() {
  const table = $('#proxy-table');
  const empty = $('#proxy-empty');
  const countEl = $('#proxy-count');
  if (!table) return;
  const list = visibleProxies(proxyLibrary);
  table.replaceChildren();

  /**
   * Window usage for one proxy-library record. The proxy cap is enforced in the main process off
   * the same association (profile.proxyId, or the raw endpoint for a manually pasted proxy), so
   * the badge and the blocking rule always describe the same set of windows.
   */
  // Usage used to rescan every profile (each hitting the linear
  // engineProfiles.find) per proxy row: O(proxies x profiles x engineStates)
  // per render. Bucket once per render instead.
  const runningByProfile = new Map(engineProfiles.map((item) => [item.id, Boolean(item.running)]));
  const boundByProxyId = new Map();
  const boundByRawEndpoint = new Map();
  for (const profile of (ui.profiles || [])) {
    const linked = profileProxyId(profile);
    if (linked) {
      const list = boundByProxyId.get(linked) || [];
      list.push(profile); boundByProxyId.set(linked, list);
      continue;
    }
    const rawEndpoint = String(profile.proxy || '').trim();
    if (profile.networkMode === 'proxy' && rawEndpoint) {
      const list = boundByRawEndpoint.get(rawEndpoint) || [];
      list.push(profile); boundByRawEndpoint.set(rawEndpoint, list);
    }
  }
  const proxyUsage = (item) => {
    const raw = String(item.raw || '').trim();
    const bound = boundByProxyId.get(item.id)
      || (raw ? boundByRawEndpoint.get(raw) : undefined) || [];
    const running = bound.filter((profile) => runningByProfile.get(profile.id));
    return { bound, running, limit: Number(item.maxConcurrency) || 0 };
  };

  const fragment = new DocumentFragment();
  for (const item of list) {
    const row = document.createElement('tr');
    const checkCell = document.createElement('td');
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = selectedProxies.has(item.id);
    check.dataset.proxySelect = item.id;
    checkCell.append(check);
    const host = `${item.host}:${item.port}`;
    const auth = item.authenticated ? t('proxies.authYes') : t('proxies.authNo');
    // Reference proxy page shows IP + 位置 + 时区 on the checked row; we keep
    // the cell compact and surface the rest as a hover tooltip.
    const locationParts = [item.lastCountry, item.lastCity].filter(Boolean).join(' ');
    const exitTitleParts = [];
    if (item.lastIp) exitTitleParts.push(`IP: ${item.lastIp}`);
    if (locationParts) exitTitleParts.push(`${t('proxies.locationLabel')}: ${locationParts}`);
    if (item.lastTimezone) exitTitleParts.push(`${t('proxies.timezoneLabel')}: ${item.lastTimezone}`);
    if (item.lastIsp) exitTitleParts.push(`ISP: ${item.lastIsp}`);
    const exit = item.lastIp
      ? `${item.lastIp}${item.lastCountryCode ? ' · ' + item.lastCountryCode : ''}${item.lastCheckOk === false ? ' · 失败' : ''}`
      : (item.lastCheckOk === false ? (item.lastErrorClass || '失败') : '—');
    const latency = Number.isFinite(Number(item.lastLatencyMs)) ? `${Number(item.lastLatencyMs)}ms` : '—';
    const checkTime = item.lastCheck ? tx(formatProxyCheckTime(item.lastCheck)) : '—';
    const netType = item.lastNetworkType || '—';
    const actions = element('div', 'actions');
    const edit = iconActionButton('pencil', t('action.edit'), 'mini edit'); edit.dataset.proxyEdit = item.id;
    const test = iconActionButton('activity', t('action.check'), 'mini blue'); test.dataset.proxyTest = item.id;
    const apply = iconActionButton('users-round', tx('应用')); apply.dataset.proxyApply = item.id;
    const use = iconActionButton('link-2', t('action.use')); use.dataset.proxyUse = item.id;
    const del = iconActionButton('trash-2', t('action.delete'), 'mini danger'); del.dataset.proxyDelete = item.id;
    actions.append(edit, test, apply, use, del);
    const actionCell = document.createElement('td'); actionCell.append(actions);
    const proto = String(item.protocol || 'proxy').toUpperCase();
    const protoLabel = proto === 'SOCKS5' ? 'S5' : proto === 'HTTPS' ? 'HS' : proto === 'HTTP' ? 'HT' : proto.slice(0, 2);
    const nameCell = document.createElement('td');
    const nameWrap = element('div', 'profile-name env-identity');
    nameWrap.append(
      buildSquareMark(protoLabel, {
        color: proto.includes('SOCKS') ? '#22d3ee' : proto.includes('HTTPS') ? '#34d399' : '#245cff',
        title: proto,
        size: UI_MARK_SIZE,
        className: 'proxy-mark',
      }),
    );
    const nameText = document.createElement('div');
    nameText.className = 'env-identity-text';
    nameText.append(element('strong', '', item.name || host));
    nameText.append(element('small', '', host));
    nameWrap.append(nameText);
    nameCell.append(nameWrap);
    const usage = proxyUsage(item);
    const usageCell = document.createElement('td');
    const usageBadge = element('span', 'net-badge', '');
    const numbers = usage.bound.map((profile) => displayProfileNumber(profile)).join('、');
    // Translated label + raw counters: interpolating inside tx() would leave the Chinese label
    // untranslated, because the catalogs match the literal text rather than a template pattern.
    if (usage.bound.length === 0) {
      usageBadge.className = 'net-badge net-badge-idle';
      usageBadge.textContent = tx('未使用');
    } else if (usage.running.length === 0) {
      usageBadge.className = 'net-badge net-badge-idle';
      usageBadge.textContent = `${tx('闲置')} · ${usage.bound.length}`;
      usageBadge.title = `${tx('已绑定环境')}：${numbers}`;
    } else {
      const full = usage.limit > 0 && usage.running.length >= usage.limit;
      usageBadge.className = full ? 'net-badge net-badge-full' : 'net-badge net-badge-direct';
      usageBadge.textContent = full
        ? `${tx('满载')} · ${usage.running.length}/${usage.limit}`
        : `${tx('运行中')} · ${usage.running.length}`;
      usageBadge.title = `${tx('运行中环境')}：${usage.running.map((profile) => displayProfileNumber(profile)).join('、')}`;
    }
    usageCell.append(usageBadge);

    const limitCell = document.createElement('td');
    const limitText = document.createElement('span');
    limitText.className = usage.limit > 0 ? 'net-badge net-badge-proxy' : 'net-badge net-badge-idle';
    limitText.textContent = usage.limit > 0 ? String(usage.limit) : '—';
    if (usage.limit > 0) limitText.title = tx('该代理最多允许同时运行这么多窗口');
    limitCell.append(limitText);

    const exitCell = document.createElement('td');
    exitCell.textContent = exit;
    if (exitTitleParts.length) exitCell.title = exitTitleParts.join(' · ');
    const timeCell = document.createElement('td');
    timeCell.textContent = checkTime;
    if (item.lastCheck) timeCell.title = new Date(item.lastCheck).toLocaleString();

    row.append(
      checkCell,
      nameCell,
      element('td', '', proto),
      element('td', '', host),
      element('td', '', auth),
      exitCell,
      timeCell,
      element('td', '', latency),
      element('td', '', netType),
      usageCell,
      limitCell,
      element('td', '', item.remark || '—'),
      actionCell
    );
    fragment.append(row);
  }
  table.append(fragment);
  if (empty) {
    empty.textContent = proxyLibrary.length === 0 ? t('proxies.empty') : t('proxies.emptyFiltered');
    empty.hidden = list.length !== 0;
  }
  if (countEl) {
    const hasFilter = ($('#proxy-search')?.value || '').trim() || ($('#proxy-filter')?.value || 'all') !== 'all';
    const filtered = hasFilter ? ` · ${t('proxies.countFiltered', { n: list.length })}` : '';
    countEl.textContent = t('proxies.count', { n: proxyLibrary.length }) + filtered;
  }
  updateProxySelectedChip();
  const selectAll = $('#proxy-select-all');
  if (selectAll) {
    const ids = list.map((i) => i.id);
    const n = ids.filter((id) => selectedProxies.has(id)).length;
    selectAll.checked = ids.length > 0 && n === ids.length;
    selectAll.indeterminate = n > 0 && n < ids.length;
  }
  if (typeof refreshIcons === 'function') refreshIcons();
  loadedViews.add('proxies');
}

/** Chip refresh without a full table re-render (checkbox toggles). */
function updateProxySelectedChip() {
  const selectedChip = $('#proxy-selected-count');
  if (!selectedChip) return;
  const n = selectedProxies.size;
  selectedChip.hidden = n === 0;
  selectedChip.textContent = t('proxies.selected', { n });
}

async function refreshProxies() {
  try {
    proxyLibrary = await window.ops.proxyList({ q: $('#proxy-search')?.value || '' });
    if (!Array.isArray(proxyLibrary)) proxyLibrary = [];
  } catch (error) {
    proxyLibrary = [];
    toast(tx('加载代理库失败：') + error.message);
  }
  renderProxyLibrarySelectors();
  renderProxies();
  afterUiRender(document.getElementById('view-proxies') || document);
  loadedViews.add('proxies');
}

function openProxyDialog(item = null) {
  editingProxyRecord = item ? { ...item } : null;
  window.__proxyAuthFieldsTouched = false;
  $('#proxy-edit-id').value = item?.id || '';
  $('#proxy-dialog-title').textContent = item ? tx('编辑代理') : tx('新建代理');
  $('#proxy-name').value = item?.name || '';
  delete $('#proxy-name').dataset.autoProxyName;
  // A malformed stored raw must not escape as a sync throw: the edit-button
  // handler (ui/ui-proxy-wiring.js) is async, so the rejection went unhandled
  // and the dialog never opened. Toast the parse error and fall back to the
  // per-field values — the `parsed?.x || item?.x` chains below already handle
  // a null parsed.
  let parsed = null;
  if (item) {
    try { parsed = parseProxyInputForUi(item.raw || item, item.protocol || 'socks5'); }
    catch (error) { toast(tx('代理格式错误：') + error.message); }
  }
  $('#proxy-protocol').value = parsed?.protocol || item?.protocol || 'socks5';
  $('#proxy-ip-channel').value = item?.ipChannel || 'ip-api';
  $('#proxy-host').value = parsed?.host || item?.host || '';
  $('#proxy-port').value = parsed?.port || item?.port || '';
  $('#proxy-user').value = parsed?.username || item?.username || '';
  $('#proxy-password').value = parsed?.password || item?.password || '';
  $('#proxy-raw').value = parsed?.raw || item?.raw || '';
  $('#proxy-remark').value = parsed?.remark || item?.remark || '';
  $('#proxy-refresh-url').value = item?.refreshUrl || '';
  $('#proxy-max-concurrency').value = item?.maxConcurrency ? String(item.maxConcurrency) : '';
  const result = $('#proxy-dialog-result');
  result.className = 'proxy-test-result';
  result.textContent = item?.lastIp ? (tx('上次出口：') + item.lastIp) : tx('保存前可先检测');
  syncThemedSelects($('#proxy-dialog'));
  $('#proxy-dialog').showModal();
}

function readProxyForm() {
  const rawInput = $('#proxy-raw')?.value?.trim() || '';
  const formProtocol = $('#proxy-protocol')?.value?.trim() || '';
  const formHost = $('#proxy-host')?.value?.trim() || '';
  const formPort = $('#proxy-port')?.value?.trim() || '';
  const formUser = $('#proxy-user')?.value || '';
  const formPass = $('#proxy-password')?.value || '';
  const formName = $('#proxy-name')?.value?.trim() || '';
  const formRemark = $('#proxy-remark')?.value?.trim() || '';

  let parsed = rawInput ? parseProxyInputForUi(rawInput, formProtocol || 'socks5') : null;
  if (!parsed && (formHost.includes(':') || formHost.includes('@') || formHost.includes('/'))) {
    try { parsed = parseProxyInputForUi(formHost, formProtocol || 'socks5'); } catch (_) {}
  }

  const protocol = formProtocol || parsed?.protocol || 'socks5';
  const host = (formHost && !formHost.includes(':') && !formHost.includes('@') && !formHost.includes('/'))
    ? formHost
    : (parsed?.host || formHost);
  // Integer-coerce with the same 1-65535 range enforced by buildProxyUiValue
  // and the main-process store (automation/proxy-store.js): garbage input used
  // to leak NaN into draft.port. 0 stays the "unset" value (as the old
  // `|| 0` fallback), so the save/test paths surface the standard
  // host+port validation error instead of NaN poisoning.
  const portNumber = Number(formPort || parsed?.port || 0);
  const port = Number.isInteger(portNumber) && portNumber >= 1 && portNumber <= 65535 ? portNumber : 0;
  const username = formUser || parsed?.username || '';
  const password = formPass || parsed?.password || '';
  const name = formName || parsed?.name || '';
  const remark = formRemark || parsed?.remark || '';

  const builtRaw = (host && port)
    ? buildProxyUiValue({ protocol, host, port, username, password, remark })
    : (parsed?.raw || undefined);

  const draft = {
    id: $('#proxy-edit-id')?.value || undefined,
    name,
    protocol,
    host,
    port,
    username,
    password,
    raw: builtRaw,
    ipChannel: $('#proxy-ip-channel')?.value || 'direct',
    refreshUrl: ($('#proxy-refresh-url')?.value || '').trim(),
    maxConcurrency: Math.max(0, Math.min(1000, Number.parseInt($('#proxy-max-concurrency')?.value || '0', 10) || 0)),
    remark,
  };
  // Empty credentials are normally redacted by round-tripped UI data. Only
  // send an explicit clear operation when the user is editing an existing
  // authenticated record and deliberately emptied both fields.
  if (editingProxyRecord?.id && editingProxyRecord.authenticated && window.__proxyAuthFieldsTouched && !username && !password) {
    draft.proxyAuthAction = 'clear';
  }
  if (editingProxyRecord?.id && editingProxyRecord.authenticated && !window.__proxyAuthFieldsTouched && !username && !password) {
    delete draft.username;
    delete draft.password;
  }
  return draft;
}

async function runProxyBatchCheck(ids) {
  if (!ids.length) return toast(tx('请先勾选代理'));
  // The backend rejects >100 ids per invoke; slice here so "select all" on a
  // large library checks the first batch and reports the remainder instead of
  // previously dropping ids 101+ silently.
  const MAX_BATCH = 100;
  const remainingCount = Math.max(0, ids.length - MAX_BATCH);
  const batch = ids.slice(0, MAX_BATCH);
  toast(tx('正在检测 ') + batch.length + tx(' 条代理…'));
  if (typeof window.ops.proxyCheckMany === 'function') {
    try {
      const summary = await window.ops.proxyCheckMany({ ids: batch });
      invalidateViewCache('proxies');
      await refreshProxies();
      toast(tx(`检测完成：成功 ${summary.ok || 0} · 失败 ${summary.fail || 0}`)
        + (remainingCount ? tx('；另有 ') + remainingCount + tx(' 条未检测，请分批勾选') : ''));
      return;
    } catch (error) {
      await refreshProxies();
      toast(tx('批量检测失败：') + (error.message || error));
      log('Proxy', '批量检测失败 · ' + (error.message || error));
      return;
    }
  }
  let ok = 0; let fail = 0;
  for (const id of ids) {
    try { await window.ops.proxyCheck({ id }); ok += 1; }
    catch (_) { fail += 1; }
  }
  await refreshProxies();
  toast(tx(`检测完成：成功 ${ok} · 失败 ${fail}`));
}

function openProxyApplyDialog(item) {
  const dialog = $('#proxy-apply-dialog');
  if (!dialog) return;
  $('#proxy-apply-id').value = item.id;
  $('#proxy-apply-title').textContent = `${tx('应用代理到环境')} · ${item.name || `${item.host}:${item.port}`}`;
  $('#proxy-apply-summary').textContent = `${String(item.protocol || 'socks5').toUpperCase()}://${item.host}:${item.port}${item.remark ? ' (' + item.remark + ')' : ''}`;
  
  const listEl = $('#proxy-apply-list');
  listEl.replaceChildren();
  
  const updateCount = () => {
    const checkedBoxes = listEl.querySelectorAll('input[type="checkbox"]:checked');
    const countEl = $('#proxy-apply-count');
    if (countEl) countEl.textContent = tx('已选择 ') + checkedBoxes.length + tx(' 个环境');
    const selectAll = $('#proxy-apply-select-all');
    if (selectAll) {
      const allBoxes = listEl.querySelectorAll('input[type="checkbox"]');
      selectAll.checked = allBoxes.length > 0 && checkedBoxes.length === allBoxes.length;
      selectAll.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allBoxes.length;
    }
  };

  for (const p of ui.profiles.filter((profile) => !profile.trashed)) {
    const isBound = p.proxyId === item.id;
    const label = document.createElement('label');
    label.className = 'assign-item';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = p.id;
    checkbox.checked = isBound;
    checkbox.addEventListener('change', updateCount);
    const span = document.createElement('span');
    span.textContent = `${displayProfileNumber(p)} - ${p.name || '环境'} (${p.networkMode === 'direct' ? '直连' : (p.proxy || '代理')})`;
    if (isBound) {
      const tag = document.createElement('small');
      tag.className = 'field-hint';
      tag.style.marginLeft = 'auto';
      tag.textContent = tx('当前绑定');
      label.append(checkbox, span, tag);
    } else {
      label.append(checkbox, span);
    }
    listEl.append(label);
  }
  updateCount();
  dialog.showModal();
}

const handleProxyRawChange = () => {
  const raw = ($('#proxy-raw')?.value || '').trim();
  const statusEl = $('#proxy-raw-status');
  if (!raw) {
    if (statusEl) statusEl.textContent = tx('粘贴整行代理（如 socks5://user:pass@host:port#备注）会自动拆分填入下方各字段');
    return;
  }
  try {
    const parsed = parseProxyInputForUi(raw, $('#proxy-protocol')?.value || 'socks5');
    if (!parsed) return;
    if ($('#proxy-protocol')) $('#proxy-protocol').value = parsed.protocol;
    if ($('#proxy-host')) $('#proxy-host').value = parsed.host;
    if ($('#proxy-port')) $('#proxy-port').value = parsed.port;
    if ($('#proxy-user')) $('#proxy-user').value = parsed.username;
    if ($('#proxy-password')) $('#proxy-password').value = parsed.password;
    if ($('#proxy-remark')) $('#proxy-remark').value = parsed.remark;
    if (!$('#proxy-name')?.value.trim() || $('#proxy-name').dataset.autoProxyName === 'true') {
      $('#proxy-name').value = parsed.name;
      $('#proxy-name').dataset.autoProxyName = 'true';
    }
    if (statusEl) {
      statusEl.textContent = tx('已自动解析：') + parsed.protocol.toUpperCase() + '://' + parsed.host + ':' + parsed.port + (parsed.username ? tx(' (含认证)') : '') + (parsed.remark ? ' #' + parsed.remark : '');
    }
    syncThemedSelects($('#proxy-dialog'));
  } catch (_) {}
};

const handleProxyHostChange = () => {
  const value = ($('#proxy-host')?.value || '').trim();
  if (!value || (!value.includes(':') && !value.includes('@') && !value.includes('/'))) return;
  try {
    const parsed = parseProxyInputForUi(value, $('#proxy-protocol')?.value || 'socks5');
    if (!parsed) return;
    if ($('#proxy-protocol')) $('#proxy-protocol').value = parsed.protocol;
    $('#proxy-host').value = parsed.host;
    if (parsed.port && $('#proxy-port')) $('#proxy-port').value = parsed.port;
    if (parsed.username && $('#proxy-user')) $('#proxy-user').value = parsed.username;
    if (parsed.password && $('#proxy-password')) $('#proxy-password').value = parsed.password;
    if (parsed.remark && $('#proxy-remark')) $('#proxy-remark').value = parsed.remark;
    if ($('#proxy-raw')) $('#proxy-raw').value = parsed.raw;
    if (!$('#proxy-name')?.value.trim() || $('#proxy-name').dataset.autoProxyName === 'true') {
      $('#proxy-name').value = parsed.name;
      $('#proxy-name').dataset.autoProxyName = 'true';
    }
    syncThemedSelects($('#proxy-dialog'));
  } catch (_) {}
};

async function applySelectedNetworkMode(mode, { proxies = null, restart = true } = {}) {
  const ids = ui.profiles.filter((profile) => selectedProfiles.has(profile.id)).map((profile) => profile.id);
  if (!ids.length) throw new Error(tx('请先选择环境'));
  const profiles = ids.map((id) => ui.profiles.find((profile) => profile.id === id));
  const direct = mode === 'direct';
  let list; let verified;
  if (direct) {
    list = profiles.map(() => 'Direct');
    verified = profiles.map(() => null);
  } else {
    list = proxies;
    if (!list || list.length !== profiles.length) throw new Error(tx('代理数量必须与所选环境数量一致'));
    verified = await verifyProxyAssignments(profiles, list);
  }
  const status = await window.ops.profileStatus();
  const runningBefore = new Set(status.filter((item) => item.running && ids.includes(item.id)).map((item) => item.id));
  if (restart) for (const id of runningBefore) await window.ops.stopProfile(id);
  // Snapshot so a failure in syncProfiles/restart leaves the renderer state
  // as it was instead of half-applied (proxy fields set, engine unchanged).
  const snapshot = profiles.map((profile) => ({
    id: profile.id, proxy: profile.proxy, exitIp: profile.exitIp, exitCountryCode: profile.exitCountryCode,
    exitTimezone: profile.exitTimezone, exitLatitude: profile.exitLatitude, exitLongitude: profile.exitLongitude,
    exitCheckedAt: profile.exitCheckedAt,
  }));
  const applyAt = (profile, index) => {
    profile.proxy = list[index];
    const result = verified[index];
    if (result) {
      profile.exitIp = result.ip; profile.exitCountryCode = result.countryCode; profile.exitTimezone = result.timezone || '';
      profile.exitLatitude = result.latitude; profile.exitLongitude = result.longitude; profile.exitCheckedAt = result.checkedAt;
    } else {
      delete profile.exitIp; delete profile.exitCountryCode; delete profile.exitTimezone;
      delete profile.exitLatitude; delete profile.exitLongitude; delete profile.exitCheckedAt;
    }
  };
  profiles.forEach(applyAt);
  try {
    save();
    invalidateViewCache(['profiles', 'groups', 'sync', 'extensions', 'proxies']);
    engineProfiles = await (window.OpenBrowserApp?.syncProfiles || window.ops.syncProfiles)(profiles);
  } catch (error) {
    for (const snap of snapshot) {
      const profile = ui.profiles.find((item) => item.id === snap.id);
      if (!profile) continue;
      ['exitIp', 'exitCountryCode', 'exitTimezone', 'exitLatitude', 'exitLongitude', 'exitCheckedAt'].forEach((key) => { delete profile[key]; });
      Object.assign(profile, snap);
    }
    save();
    throw error;
  }
  if (restart) await runPool(runningBefore, async (id) => {
    const profile = ui.profiles.find((item) => item.id === id);
    if (profile) await window.ops.startProfile(profile);
  });
  await refreshStatus(); await refreshSessions(); renderProfiles();
  return { count: ids.length, direct };
}
