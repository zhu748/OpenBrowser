import { Tt as shallowRef, At as triggerRef } from './runtime-core.esm-bundler-CBj16o9G.js';
import { h as api } from './utils-BIWenCnY.js';
import { n as workspaceCode } from './workspace-CNvgSgaH.js';

function samePage(popup, target) {
  try {
    const current = new URL(popup.location.href);
    const next = new URL(target, location.href);
    return current.origin === next.origin && current.pathname === next.pathname;
  } catch { return false; }
}

function createWindowManager() {
  const winMap = shallowRef(new Map());
  let poll;
  function stopWhenEmpty() {
    if (winMap.value.size) return;
    clearInterval(poll);
    poll = undefined;
  }
  function removeClosed() {
    let changed = false;
    for (const [id, popup] of winMap.value) if (popup.closed) changed = winMap.value.delete(id) || changed;
    if (changed) triggerRef(winMap);
    stopWhenEmpty();
  }
  function open(url, id, target = id) {
    const popup = window.open(url, target);
    if (popup) {
      winMap.value.set(id, popup);
      triggerRef(winMap);
      poll ??= setInterval(removeClosed, 1000);
    }
    return popup;
  }
  function focusOrOpen(url, id) {
    const popup = winMap.value.get(id);
    if (popup && !popup.closed && samePage(popup, url)) { popup.focus(); return popup; }
    return open(url, id, '_blank');
  }
  function closeAll() {
    for (const popup of winMap.value.values()) popup.close();
    winMap.value.clear();
    stopWhenEmpty();
    triggerRef(winMap);
  }
  function broadcast(message) {
    for (const popup of winMap.value.values()) popup.postMessage(message, '*');
  }
  return { winMap, open, focusOrOpen, closeAll, broadcast };
}

export const windowManager = createWindowManager();

export async function fetchOpenWindows() {
  if (!globalThis.isElectron) return new Set([...windowManager.winMap.value].filter(([, popup]) => popup && !popup.closed).map(([id]) => String(id)));
  try {
    const windows = await globalThis.electronAPI.send('browser:getOpenedBrowser');
    return new Set(windows.map(row => row.dirId).filter(Boolean));
  } catch (error) {
    console.warn('[agent-console] Failed to read opened browser state', error);
    return new Set();
  }
}

export const markOpenWindow = (row, opened) => ({ ...row, openStatus: Boolean(row.openStatus || row.dirId && opened.has(row.dirId)) });
export function windowDisplayInfo(row) {
  const country = (row.lastCountry || row.country || '').trim();
  return { iconName: country ? `country-code/${country.toUpperCase()}` : '', isOpen: Boolean(row.openStatus),
    name: row.windowName ?? '', remark: row.windowRemark ?? '' };
}

function code(row, workspaceName) {
  if (row.windowSortNum == null) return '';
  const prefix = workspaceCode(row.workspaceName || workspaceName);
  return prefix ? `${prefix}-${row.windowSortNum}` : String(row.windowSortNum);
}

function rowsToOptions(rows, workspaceName, opened) {
  return rows.filter(row => row.dirId).map(row => ({ id: row.dirId, code: code(row, workspaceName), windowSortNum: row.windowSortNum,
    workspaceName: row.workspaceName || workspaceName, projectId: row.projectId?.toString(), projectName: row.projectName,
    ...windowDisplayInfo(markOpenWindow(row, opened)) }));
}

export const restoreWindowCodes = (rows, workspaceName) => rows.map(row => ({ ...row,
  code: row.windowSortNum === undefined ? row.code : code(row, workspaceName) }));

async function queryWindows(options) {
  const response = await api.window.userGetWindowInfoListList({ isDelete: 0, orderName: 'createTime', orderType: 'desc', ...options });
  if (response.code !== 0) throw Error(response.msg || 'Failed to load task windows');
  return response.data ?? {};
}

export async function resolveProfiles(rawIds, workspaceName) {
  const ids = [...new Set(rawIds.filter(Boolean))];
  if (!ids.length) return [];
  const opened = fetchOpenWindows();
  const rows = [];
  const pages = [];
  const batchSize = 50;
  for (let offset = 0; offset < ids.length; offset += batchSize) pages.push(ids.slice(offset, offset + batchSize));
  for (let offset = 0; offset < pages.length; offset += 4) {
    const results = await Promise.all(pages.slice(offset, offset + 4).map(async page => {
      const data = await queryWindows({ page_index: 1, page_size: page.length, dirIds: page.join(',') });
      const requested = new Set(page);
      return (data.rows ?? []).filter(row => requested.has(row.dirId));
    }));
    rows.push(...results.flat());
  }
  return rowsToOptions(rows, workspaceName, await opened);
}

export async function loadWindowOptions({ pageIndex, pageSize = 10, keyword, projectId }, workspaceName) {
  const query = keyword?.trim();
  const [data, opened] = await Promise.all([queryWindows({ page_index: pageIndex, page_size: pageSize,
    ...(projectId && { projectIds: projectId }), ...(query && { queryKey: 'name_remark', queryValue: query }) }), fetchOpenWindows()]);
  const rows = data.rows ?? [];
  const total = data.total ?? rows.length;
  return { items: rowsToOptions(rows, workspaceName, opened), total, hasMore: pageIndex * pageSize < total };
}
