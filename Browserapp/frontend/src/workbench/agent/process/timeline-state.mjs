import { h as api } from './utils-BIWenCnY.js';
import { n as workspaceCode } from './workspace-CNvgSgaH.js';

const singleEvents = new Set(['context_compacted', 'retrying', 'agent_lifecycle', 'hitl']);
const isSpawn = event => event.type === 'tool_call' && (event.toolName === 'spawn_agent' || event.toolName?.endsWith('__spawn_agent'));

export function lastMeaningfulEvent(events) {
  return events.findLast(event => event.type !== 'thinking') ?? events.at(-1);
}

export function groupEvents(events, parentId = 'root') {
  const groups = [];
  let pending = [];
  function flush() {
    if (pending.length === 1) groups.push({ type: 'event', event: pending[0] });
    else if (pending.length > 1) groups.push({ type: 'group', id: `event-group-${parentId}-${pending[0].id}`, events: pending });
    pending = [];
  }
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    if (event.type === 'content') {
      flush();
      if (event.content.trim()) groups.push({ type: 'content', event });
    } else if (event.type === 'script_log' && event.toolId && events[index + 1]?.type === 'script_log' &&
      events[index + 1]?.toolId === event.toolId) {
      flush();
      const logs = [event];
      while (events[index + 1]?.type === 'script_log' && events[index + 1].toolId === event.toolId) logs.push(events[++index]);
      groups.push({ type: 'script_logs', id: event.id, events: logs });
    } else if (singleEvents.has(event.type) || isSpawn(event)) {
      flush();
      groups.push({ type: 'event', event });
    } else pending.push(event);
  }
  flush();
  return groups;
}

export function splitProcessSteps(events, parentId = 'root') {
  const steps = [];
  let pending = [];
  let index = 0;
  function flush() {
    if (!pending.length) return;
    steps.push({ type: 'events', id: `${parentId}-events-${index++}-${pending[0].id}`, events: pending });
    pending = [];
  }
  for (const event of events) {
    if (event.type === 'agent_lifecycle') {
      flush();
      steps.push({ type: 'agent_lifecycle', id: event.id, event });
    } else pending.push(event);
  }
  flush();
  return steps;
}

export const shouldCollapse = (events, status) => status === 'done' && events.at(-1)?.type === 'task_report';

export function scrollSignatures(groups, expanded) {
  const signatures = {};
  for (const group of groups) {
    if (group.type === 'event') {
      const { event } = group;
      if (event.type === 'thinking' && expanded[event.id] === true) {
        signatures[`thinking:${event.id}`] = `${event.status}:${event.content.length}`;
      }
      continue;
    }
    if (expanded[group.id] !== true) continue;
    const last = group.events?.at(-1);
    if (group.type === 'script_logs') {
      signatures[`script-grid:${group.id}`] = `${group.events.length}:${last?.id ?? ''}:${last?.lines.length ?? 0}:${last?.lines.at(-1)?.message.length ?? 0}`;
    } else if (last) {
      const length = last.type === 'thinking' ? `:${last.content.length}` : '';
      signatures[group.id] = `${group.events.length}:${last.id}${length}`;
    }
  }
  return signatures;
}

const cache = new Map();
const pendingWindows = new Map();
const pageSize = 50;
const parallelPages = 4;
const maxAge = 10_000;

export function formatWindowTitle(info) {
  if (info.windowSortNum === undefined) return '';
  const prefix = workspaceCode(info.workspaceName);
  return prefix ? `${prefix}-${info.windowSortNum}` : String(info.windowSortNum);
}

async function fetchWindowInfo(ids) {
  const result = await api.window.userGetWindowInfoListList({ page_index: 1, page_size: ids.length,
    dirIds: ids.join(','), isDelete: 0, orderName: 'createTime', orderType: 'desc' });
  if (result.code !== 0) throw Error(result.msg || 'Failed to load task report windows');
  const expiresAt = Date.now() + maxAge;
  const missing = new Set(ids);
  for (const row of result.data?.rows ?? []) {
    const { dirId, windowSortNum, workspaceName, platformUserName } = row;
    if (!missing.delete(dirId)) continue;
    const info = {};
    if (windowSortNum !== undefined) info.windowSortNum = windowSortNum;
    if (workspaceName) info.workspaceName = workspaceName;
    if (row.lastCountry || row.country) info.countryCode = (row.lastCountry || row.country).toUpperCase();
    if (platformUserName) info.platformUserName = platformUserName;
    cache.set(dirId, { expiresAt, info });
  }
  for (const id of missing) cache.set(id, { expiresAt });
}

export async function loadWindowInfo(rawIds) {
  const ids = [...new Set(rawIds.map(id => id.trim()).filter(Boolean))];
  const now = Date.now();
  for (const [id, entry] of cache) if (entry.expiresAt <= now) cache.delete(id);
  const missing = ids.filter(id => !cache.has(id));
  const pages = [];
  for (let offset = 0; offset < missing.length; offset += pageSize) pages.push(missing.slice(offset, offset + pageSize));
  for (let offset = 0; offset < pages.length; offset += parallelPages) {
    await Promise.all(pages.slice(offset, offset + parallelPages).map(async page => {
      const key = page.join(',');
      if (!pendingWindows.has(key)) pendingWindows.set(key, fetchWindowInfo(page).finally(() => pendingWindows.delete(key)));
      await pendingWindows.get(key);
    }));
  }
  return new Map(ids.flatMap(id => cache.get(id)?.info ? [[id, cache.get(id).info]] : []));
}
