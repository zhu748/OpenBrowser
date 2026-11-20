import { computed, reactive, watch } from './workbench-vue.js';
import { r as useAgentChannel } from './TaskStatusBadge-fl9VE7c_.js';

const monitor = reactive({ groups: [], lastUpdatedAt: undefined });
const expanded = new Map();
const idleId = 'profile-monitor-idle';

function taskDescription(type) {
  return `${type && type.charAt(0).toUpperCase() + type.slice(1)} task`;
}

function formatEvent(event, label) {
  const { id, stage, toolName, input, result, success, errorMessage, durationMs, timestamp, workerId, conversationId } = event;
  const title = label(toolName, stage === 'end' && success ? 'success' : 'running', input);
  return { id, stage, toolName, input, result, success, errorMessage, durationMs, timestamp, workerId,
    conversationId, summary: stage === 'error' && errorMessage ? `${title}：${errorMessage}` : title };
}

function browserTask(row, id, owner, socket, name, status, label) {
  const { dirId, browserType, windowName, windowSortNum, platformUrl, platformUserName, platformIcon, countryCode } = row;
  const events = row.events.map(event => formatEvent(event, label));
  return { id, conversationId: owner.conversationId ?? id, runId: owner.runId, name,
    subtitle: events.at(-1)?.summary ?? dirId ?? socket ?? 'Browser session', status,
    dirId, ws: socket, browserType, windowName, windowSortNum, platformUrl, platformUserName, platformIcon, countryCode, events };
}

function runningGroup(task, id, tasks, lastActivityAt, show) {
  const { conversationId, runId, title, sourceType } = task;
  expanded.set(id, show);
  return { id, conversationId: conversationId ?? id, runId, title, description: taskDescription(sourceType), expanded: show,
    sourceType, browserCount: tasks.length, lastActivityAt, tasks, kind: 'running' };
}

function fromTasks(snapshot, label) {
  const groups = snapshot.tasks.map(task => {
    const owner = { conversationId: task.conversationId ?? task.id, runId: task.runId };
    const browsers = task.browsers.map(row => browserTask(row, row.id, owner, row.ws, row.windowName || row.label || row.dirId || row.id, 'running', label));
    const last = task.browsers.reduce((time, row) => Math.max(time, row.updatedAt), task.updatedAt);
    return runningGroup(task, task.id, browsers, last, expanded.get(task.id) ?? (browsers.length > 0 && expanded.size === 0));
  });
  const live = new Set(groups.map(group => group.id));
  for (const id of expanded.keys()) if (!live.has(id)) expanded.delete(id);
  return groups;
}

function fromProfiles(snapshot, label) {
  const running = new Map();
  const idle = [];
  let lastIdleUpdate = -Infinity;
  for (const row of snapshot.profiles) {
    const { owner, dirId, status } = row;
    const entry = browserTask(row, dirId, owner ?? {}, row.endpoint, row.windowName || row.platformUserName || dirId, status, label);
    if (status === 'idle' || !owner) {
      idle.push(entry);
      lastIdleUpdate = Math.max(lastIdleUpdate, row.updatedAt);
      continue;
    }
    const id = owner.taskId;
    if (!running.has(id)) running.set(id, runningGroup(owner, id, [], row.updatedAt, expanded.get(id) ?? true));
    const group = running.get(id);
    group.tasks.push(entry);
    group.browserCount = group.tasks.length;
    group.lastActivityAt = Math.max(group.lastActivityAt ?? 0, row.updatedAt);
  }
  const groups = [...running.values()].sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0));
  if (idle.length) {
    const show = expanded.get(idleId) ?? false;
    expanded.set(idleId, show);
    groups.push({ id: idleId, conversationId: idleId, title: '', description: '', expanded: show, browserCount: idle.length,
      lastActivityAt: lastIdleUpdate, tasks: idle.sort((a, b) => a.name.localeCompare(b.name)), kind: 'idle' });
  }
  return groups;
}

export function useTaskMonitor(label) {
  const channel = useAgentChannel();
  watch([channel.profileMonitorSnapshot, channel.taskMonitorSnapshot], ([profiles, tasks]) => {
    const latest = profiles?.data ?? tasks?.data;
    if (!latest) return;
    monitor.groups = profiles ? fromProfiles(latest, label) : fromTasks(latest, label);
    monitor.lastUpdatedAt = latest.generatedAt;
  }, { immediate: true });

  function toggleTaskGroup(id) {
    const show = !expanded.get(id);
    expanded.set(id, show);
    monitor.groups = monitor.groups.map(group => group.id === id ? { ...group, expanded: show } : group);
  }
  const taskGroupList = computed(() => monitor.groups);
  const runningTaskCount = computed(() => monitor.groups.reduce((total, { tasks }) => total + tasks.filter(task => task.status === 'running').length, 0));
  const profileCount = computed(() => monitor.groups.reduce((total, { tasks }) => total + tasks.length, 0));
  return { connected: channel.connected, lastError: channel.lastError, lastUpdatedAt: computed(() => monitor.lastUpdatedAt),
    runningTaskCount, profileCount, taskGroupList, toggleTaskGroup };
}
