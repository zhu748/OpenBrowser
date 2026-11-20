import { faviconForLink } from './workbench-markdown-links.js';
import { browserOperations, genericOperations, templateOperations } from './workbench-tool-operation-labels.js';

const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const string = value => typeof value === 'string' && value ? value : undefined;
const basename = path => path.split(/[\\/]/).filter(Boolean).at(-1) || path;
const patchHeader = /^\*\*\* (Add File|Update File|Delete File): (.+)$/;
const patchActions = { 'Add File': 'create', 'Update File': 'update', 'Delete File': 'delete' };
const structuredActions = { create_file: 'create', update_file: 'update', delete_file: 'delete' };
const suffix = (text, value) => value ? `${text} ${value}` : text;
const stage = (completed, active, done, options) => $t(completed ? done : active, options);

export const toolFamily = name => name.split('__').at(-1) || name;
export const retryIcon = status => status === 'running' ? 'base/rx_ic_wifi2' : 'base/rx_ic_wifi';

function patchActionsFor(input) {
  const { operation, patch } = object(input);
  const structured = object(operation);
  if (string(structured.path) && typeof structured.type === 'string') {
    const patchType = Object.hasOwn(structuredActions, structured.type) ? structuredActions[structured.type] : undefined;
    return [{ patchType, target: structured.path, paths: [structured.path] }];
  }
  const operations = [];
  const text = typeof input === 'string' ? input : string(patch) || '';
  for (const line of text.split(/\r?\n/)) {
    const header = patchHeader.exec(line);
    if (header) {
      const target = header[2].trim();
      operations.push({ patchType: patchActions[header[1]], target, paths: [target] });
    } else {
      const move = /^\*\*\* Move to: (.+)$/.exec(line);
      if (move) operations.at(-1)?.paths.push(move[1].trim());
    }
  }
  return operations;
}

export function describePatch(input) {
  const operations = patchActionsFor(input);
  if (operations.length !== 1 || !operations[0].patchType) return { patchType: 'mixed' };
  const { patchType, target } = operations[0];
  return { patchType, target };
}

const fileActions = { read_file: 'read', grep: 'read', edit_file: 'update', write_file: 'write', ls: 'discover', glob: 'discover' };
function findFileOperations(name, input, { patchType, target }) {
  if (name === 'apply_patch') {
    const operations = patchActionsFor(input);
    if (!operations.length && target) operations.push({ patchType, paths: [target] });
    return operations.map(operation => ({ paths: operation.paths, action: operation.patchType === 'create' ? 'write' : 'update' }));
  }
  const path = string(object(input)[name === 'glob' ? 'cwd' : 'path']) ?? target;
  const action = Object.hasOwn(fileActions, name) ? fileActions[name] : undefined;
  return path && action ? [{ action, paths: [path] }] : [];
}

function memoryPath(path) {
  const normalized = path.trim().replaceAll('\\', '/').replace(/\/+/g, '/');
  const match = /(?:^|\/)\.roxy-agent(?:-dev)?\/memory(?:\/(.*))?$/.exec(normalized);
  if (!match) return;
  const file = match[1];
  if (!file) return 'directory';
  if (file === 'MEMORY.md') return 'index';
  return !file.includes('/') && file.toLowerCase().endsWith('.md') ? 'entry' : 'internal';
}

export function classifyMemoryOperations(name, input, options = {}) {
  const operations = findFileOperations(toolFamily(name), input, options).map(operation => ({ ...operation, kinds: operation.paths.map(memoryPath) }));
  if (!operations.length || operations.some(operation => operation.kinds.includes(undefined))) return;
  if (operations.some(operation => operation.action === 'discover')) return { kind: 'hidden' };
  const entries = operations.filter(operation => operation.kinds.includes('entry'));
  if (!entries.length) return { kind: 'hidden' };
  const first = entries[0].action;
  return { kind: 'entries', action: entries.every(operation => operation.action === first) ? first : 'update', count: entries.length };
}

function memoryLabel(action, count, completed) {
  if (action === 'read') return stage(completed, '正在读取 {n} 条记忆', '已读取 {n} 条记忆', { n: count });
  if (action === 'write') return stage(completed, '正在写入 {n} 条记忆', '已写入 {n} 条记忆', { n: count });
  return stage(completed, '正在更新 {n} 条记忆', '已更新 {n} 条记忆', { n: count });
}

export function summarizeTools(events) {
  if (!events.length) return;
  const memory = events.map(event => classifyMemoryOperations(event.toolName, event.input, event));
  const first = memory[0];
  if (first?.kind !== 'entries' || memory.some(operation => operation?.kind !== 'entries' || operation.action !== first.action)) return;
  const total = memory.reduce((count, operation) => count + operation.count, 0);
  return memoryLabel(first.action, total, events.every(event => event.status === 'success' && event.finished !== false));
}

function searchUrl(value) {
  const url = string(value)?.trim();
  if (!url) return;
  try {
    const cleaned = new URL(url);
    cleaned.searchParams.delete('ws_call_id');
    if (/^#ws_call_id=/i.test(cleaned.hash)) cleaned.hash = '';
    const href = cleaned.toString();
    const faviconUrl = faviconForLink(href);
    return { url: href, ...(faviconUrl && { faviconUrl }) };
  } catch { return { url }; }
}

export function parseSearch(value) {
  const input = object(value);
  const { type, queries, query, url, pattern } = typeof input.type === 'string' ? input : object(input.action);
  if (type === 'search') {
    const terms = Array.isArray(queries) ? queries : [query];
    return { action: type, queries: terms.map(term => string(term)?.trim()).filter(term => term && !/^ws_call_id=/i.test(term)) };
  }
  if (type === 'open_page' || type === 'find_in_page') {
    const destination = searchUrl(url);
    const keyword = string(pattern)?.trim();
    if (destination && type === 'open_page') return { action: type, ...destination };
    if (destination && keyword) return { action: type, ...destination, pattern: keyword };
  }
}

function searchLabel(done, input) {
  const search = parseSearch(input);
  if (search?.action === 'search') {
    const queries = search.queries.map(query => `“${query}”`).join(' ');
    return queries ? stage(done, '正在搜索 {queries}', '已搜索 {queries}', { queries }) : stage(done, '正在搜索', '已搜索');
  }
  if (search?.action === 'open_page') return stage(done, '正在打开页面 {url}', '已打开页面 {url}', { url: search.url });
  if (search?.action === 'find_in_page') return stage(done, '正在页面 {url} 中搜索 "{keyword}"', '已在页面 {url} 中搜索 "{keyword}"', { url: search.url, keyword: search.pattern });
}

function compact(input, key) {
  const value = string(object(input)[key])?.trim().replace(/\s+/g, ' ');
  return value?.length > 80 ? `${value.slice(0, 79)}…` : value || undefined;
}
function urlSummary(input) {
  const value = compact(input, 'url');
  if (!value) return;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.host || (url.protocol === 'about:' ? value : undefined);
  } catch { return undefined; }
}

function tabLabel(done, input) {
  switch (compact(input, 'action')) {
    case 'list': return stage(done, '正在获取标签页列表', '已获取标签页列表');
    case 'new': return suffix(stage(done, '正在打开新标签页', '已打开新标签页'), urlSummary(input));
    case 'select': return stage(done, '正在切换标签页', '已切换标签页');
    case 'close': return stage(done, '正在关闭标签页', '已关闭标签页');
    default: return stage(done, '正在管理标签页', '已管理标签页');
  }
}

function waitLabel(done, input) {
  const absent = compact(input, 'textGone');
  if (absent) return suffix(stage(done, '正在等待页面内容消失', '页面内容已消失'), absent);
  const text = compact(input, 'text');
  return text ? suffix(stage(done, '正在等待页面内容', '页面内容已出现'), text) : stage(done, '正在等待页面响应', '已等待页面响应');
}

const browserTargets = new Set(['browser_click', 'browser_hover', 'browser_select_option', 'browser_type']);
function browserLabel(name, done, input) {
  if (!name.startsWith('browser_') && !name.startsWith('roxy_browser_')) return;
  if (name === 'browser_tabs') return tabLabel(done, input);
  if (name === 'browser_wait_for') return waitLabel(done, input);
  if (!Object.hasOwn(browserOperations, name)) return stage(done, '正在执行浏览器操作：{name}', '已执行浏览器操作：{name}', { name });
  const text = $t(browserOperations[name][Number(done)]);
  const detail = name === 'browser_navigate' ? urlSummary(input) : browserTargets.has(name) ? compact(input, 'element') : undefined;
  return suffix(text, detail);
}

function templateLabel(name, done, input) {
  if (name === 'roxy_list_templates') {
    const scope = compact(input, 'scope');
    if (scope === 'official') return stage(done, '正在获取官方模板列表', '已获取官方模板列表');
    if (scope === 'user') return stage(done, '正在获取用户模板列表', '已获取用户模板列表');
    return;
  }
  return Object.hasOwn(templateOperations, name) ? $t(templateOperations[name][Number(done)]) : undefined;
}

export function skillInPath(path) {
  if (!path) return;
  const parts = path.split(/[\\/]/).filter(Boolean);
  if (/^skill\.md$/i.test(parts.at(-1) || '')) return parts.at(-2);
}

function patchLabel(done, input, options) {
  const { patchType, target } = options.patchType ? options : describePatch(input);
  if (patchType === 'mixed') return stage(done, '正在更新多个文件', '已更新多个文件');
  const text = patchType === 'create' ? stage(done, '正在创建文件', '已创建文件') :
    patchType === 'delete' ? stage(done, '正在删除文件', '已删除文件') : stage(done, '正在修改文件', '已修改文件');
  return suffix(text, options.target || target);
}

export function toolLabel(tool, status, input, options = {}) {
  const name = toolFamily(tool);
  const done = status === 'success' && options.finished !== false;
  const memory = classifyMemoryOperations(tool, input, options);
  if (memory?.kind === 'entries') return memoryLabel(memory.action, memory.count, done);
  if (name === 'apply_patch') return patchLabel(done, input, options);
  if (name === 'spawn_agent') return suffix(stage(done, '正在创建智能体', '已创建智能体'), string(object(input).name)?.trim());
  if (name === 'list_agents') return stage(done, '正在列出智能体', '已列出智能体');
  if (name === 'wait_agent') return stage(done, '正在等待智能体完成工作', '智能体已完成工作');
  if (name === 'read_file') {
    const path = options.target || string(object(input).path);
    const skill = skillInPath(path);
    return skill ? `${$t('加载 skill')}：${skill}` : suffix(stage(done, '正在读取文件', '已读取文件'), path && basename(path));
  }
  if (name === 'exec_command') {
    const command = string(object(input).cmd)?.trim().replace(/\s+/g, ' ');
    return suffix(stage(done, '正在执行命令', '已执行命令'), command);
  }
  const label = (name === 'web_search' && searchLabel(done, input)) || templateLabel(name, done, input) || browserLabel(name, done, input);
  if (label) return label;
  if (name === 'ls') return stage(status === 'success', '浏览目录', '已浏览目录');
  const operation = genericOperations.find(([tool]) => name.includes(tool));
  return operation ? $t(operation[done ? 2 : 1]) : $t('使用工具：{name}', { name });
}
