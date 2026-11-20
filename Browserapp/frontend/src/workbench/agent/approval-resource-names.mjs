import { h as api, On as isTemplateRef, Cn as parseTemplateRef } from './utils-BIWenCnY.js';
import { n as workspaceCode } from './workspace-CNvgSgaH.js';
import { schemaText as localizedName } from './workbench-script-parameters.js';
import { toolFamily } from './workbench-tool-event-labels.js';

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const trimmed = value => typeof value === 'string' ? value.trim() : '';
const unique = values => [...new Set(values.filter(Boolean))];
const asId = value => typeof value === 'number' && Number.isFinite(value) ? String(value) : trimmed(value);
const ids = values => Array.isArray(values) ? unique(values.map(asId)) : [];

export async function resolveTemplateName(ref, { templates, userTemplates, locale }) {
  if (!isTemplateRef(ref)) return;
  const { namespace, id } = parseTemplateRef(ref);
  if (namespace === 'official') {
    const result = await templates.getOfficialTemplate({ templateIdOrSlug: String(id) });
    return localizedName(result.data?.name, locale).trim() || undefined;
  }
  const result = await userTemplates.getUserTemplate({ templateId: id });
  return trimmed(result.data?.name) || undefined;
}

async function resolveScriptName(path, context) {
  const absolute = path.startsWith('/') || path.startsWith('\\\\') || /^[a-z]:[\\/]/i.test(path);
  if (absolute) return path.split(/[\\/]/).filter(Boolean).at(-1) || path;
  if (!isTemplateRef(path)) return path;
  try {
    return await resolveTemplateName(path, context) || path;
  } catch (error) {
    console.warn(`[agent-console] Failed to resolve HITL script ${path}:`, error);
    return path;
  }
}

function windowsFor(args) {
  if (Array.isArray(args)) return unique(args.flatMap(value => record(value) ? ids(value.dirIds) : typeof value === 'string' ? [value] : []));
  if (Array.isArray(args?.scripts)) return unique(args.scripts.flatMap(value => record(value) ? ids(value.dirIds) : []));
  return ids(args?.dirIds);
}

function scriptsFor(args) {
  const rows = Array.isArray(args) ? args : Array.isArray(args?.scripts) ? args.scripts : [args];
  return unique(rows.map(row => trimmed(row?.scriptPath)));
}

async function fetchNames(values, domain, read, readRow) {
  if (!values.length) return new Map();
  try {
    const result = await read({ page_index: 1, page_size: values.length });
    if (result.code !== 0) throw Error(result.msg || `Failed to load ${domain}`);
    return new Map((result.data?.rows ?? []).map(readRow).filter(Boolean));
  } catch (error) {
    console.warn(`[agent-console] Failed to resolve HITL ${domain} names:`, error);
    return new Map();
  }
}

async function accountsNames(values) {
  const pairs = await Promise.all(values.map(async id => {
    try {
      const result = await api.platform.userGetPlatformInfoV2List({ id, page_index: 1, page_size: 1 });
      if (result.code !== 0) throw Error(result.msg || 'Failed to load platform account');
      const rows = result.data?.rows ?? [];
      const name = trimmed((rows.find(row => String(row.id) === id) ?? rows[0])?.platformUserName);
      if (name) return [id, name];
    } catch (error) { console.warn(`[agent-console] Failed to resolve HITL platform account ${id}:`, error); }
  }));
  return new Map(pairs.filter(Boolean));
}

export async function approvalActionTitles(requests, context) {
  const actions = (Array.isArray(requests) ? requests : []).map(action => ({ kind: toolFamily(trimmed(action?.name)), args: action?.args }));
  const windows = unique(actions.flatMap(({ kind, args }) => ['roxy_profile_delete', 'roxy_script_run'].includes(kind) ? windowsFor(args) : []));
  const proxies = unique(actions.flatMap(({ kind, args }) => kind === 'roxy_proxy_delete' ? ids(args?.ids) : []));
  const accounts = unique(actions.flatMap(({ kind, args }) => kind === 'roxy_platform_account_delete' ? ids(args?.ids) : []));
  const scripts = unique(actions.flatMap(({ kind, args }) => kind === 'roxy_script_run' ? scriptsFor(args) : []));
  const prefix = workspaceCode(context.workspaceName);
  const [windowsMap, proxiesMap, accountMap, scriptPairs] = await Promise.all([
    fetchNames(windows, 'window', options => api.window.userGetWindowInfoV2List({ ...options, dirIds: windows.join(','), isDelete: 0 }), row => {
      if (row.dirId && typeof row.windowSortNum === 'number') return [row.dirId, prefix ? `${prefix}-${row.windowSortNum}` : String(row.windowSortNum)];
    }),
    fetchNames(proxies, 'proxy', options => api.proxy.userGetProxyModuleList({ ...options, id: proxies.join(',') }), row => {
      const name = trimmed(row.remark);
      if (name) return [String(row.id), name];
    }),
    accountsNames(accounts),
    Promise.all(scripts.map(async path => [path, await resolveScriptName(path, context)])),
  ]);
  const scriptMap = new Map(scriptPairs);
  const joined = (keys, titles, separator = '、') => keys.map(key => titles.get(key) || key).join(separator);
  return actions.map(({ kind, args }) => {
    if (kind === 'roxy_profile_delete') {
      const names = joined(windowsFor(args), windowsMap);
      if (names) return $t('删除窗口 {names}', { names });
    } else if (kind === 'roxy_proxy_delete') {
      const names = joined(ids(args?.ids), proxiesMap);
      if (names) return $t('删除代理 IP {names}', { names });
    } else if (kind === 'roxy_platform_account_delete') {
      const names = joined(ids(args?.ids), accountMap);
      if (names) return $t('删除平台账号 {names}', { names });
    } else if (kind === 'roxy_script_run') {
      const currentWindows = joined(windowsFor(args), windowsMap);
      const script = joined(scriptsFor(args), scriptMap, ', ');
      if (currentWindows && script) return $t('在窗口 {windows} 中运行脚本 {script}', { windows: currentWindows, script });
      if (script) return $t('运行脚本 {script}', { script });
    }
  });
}
