const terminalStatus = { run_completed: 'completed', run_failed: 'failed', run_cancelled: 'cancelled' };
const terminalStates = new Set(Object.values(terminalStatus));
const firstSequence = event => event.startSequence ?? event.sequence;
const compareSequence = (a, b) => firstSequence(a) - firstSequence(b) || a.sequence - b.sequence;
const sequenceKey = event => `${firstSequence(event)}:${event.sequence}`;

export function unreadRun(conversation, activeId) {
  if (conversation && conversation.id === activeId && conversation.unread && conversation.latestRunId && terminalStates.has(conversation.latestRunStatus)) {
    return { conversationId: conversation.id, runId: conversation.latestRunId };
  }
}

export const needsConversationHistory = view => view.isKnownConversation && !view.isRunning && !view.hasMessageCache;
export const runIsBusy = view => view.hasActiveRun || view.hasPendingRun || view.hasPreparingRun || view.hasRunningMessage || view.hasStoppedPendingRun;

export function pendingMessages({ conversationId, token, startedAt, content, attachments, createdAt = '' }) {
  const userMessageId = `pending-user-${token}`;
  const assistantMessageId = `pending-assistant-${token}`;
  return { presentation: { assistantMessageId, startedAt, userMessageId }, messages: [
    { id: userMessageId, conversationId, role: 'user', author: 'You', content, attachments, createdAt: createdAt ?? '', status: 'streaming' },
    { id: assistantMessageId, conversationId, role: 'assistant', author: 'OpenBrowser AI Agent', content: '', createdAt: '', status: 'streaming',
      process: { id: `pending-process-${token}`, completed: false, durationState: 'thinking', durationStartedAt: startedAt, collapsed: false, events: [] } },
  ] };
}

export function reconcilePendingMessages(messages, pending, event) {
  if (event.event.type !== 'run_started') return;
  const { runId, assistantMessageId } = event;
  const user = messages.find(message => message.id === pending.userMessageId);
  if (user) Object.assign(user, { runId, status: 'done' });
  const assistant = messages.find(message => message.id === pending.assistantMessageId);
  if (!assistant) return;
  for (let index = messages.length - 1; index >= 0; index--) {
    const other = messages[index];
    if (other !== assistant && other.role === 'assistant' && (other.id === assistantMessageId || other.runId === runId)) messages.splice(index, 1);
  }
  Object.assign(assistant, { id: assistantMessageId, runId });
  if (assistant.process) Object.assign(assistant.process, { id: `pending-process-${assistantMessageId}`, durationStartedAt: pending.startedAt });
}

function deltaGroup({ event: { data, type } }) {
  const path = data?.agentPath || data?.workerId || '/root';
  if (type === 'thinking_delta') return `${path}:thinking:${data?.id ?? data?.thinkingId}`;
  if (type === 'content_delta') return `${path}:content:${data?.id ?? data?.contentId}:${data?.phase ?? ''}`;
}

const coalescedGroup = event => firstSequence(event) < event.sequence ? deltaGroup(event) : undefined;
function replaceDeltas(events, replacement, group) {
  if (events.some(event => deltaGroup(event) === group && event.sequence > replacement.sequence)) return false;
  let insertAt = events.length;
  for (let index = events.length - 1; index >= 0; index--) {
    if (deltaGroup(events[index]) !== group) continue;
    insertAt = index;
    events.splice(index, 1);
  }
  events.splice(insertAt, 0, replacement);
  return true;
}

export function acceptStreamEvent(stream, event) {
  if (stream.runId !== event.runId) return 'gap';
  const group = coalescedGroup(event);
  if (event.sequence <= stream.lastSequence) return group && replaceDeltas(stream.events, event, group) ? 'accepted' : 'duplicate';
  if (firstSequence(event) > stream.lastSequence + 1 || firstSequence(event) > event.sequence) return 'gap';
  if (group) replaceDeltas(stream.events, event, group);
  else stream.events.push(event);
  stream.lastSequence = event.sequence;
  return 'accepted';
}

export function drainStreamBuffer(stream, buffer, latest) {
  const bySequence = new Map([...buffer, latest].map(event => [sequenceKey(event), event]));
  const ordered = [...bySequence.values()].sort(compareSequence);
  const accepted = [];
  for (const [index, event] of ordered.entries()) {
    const result = acceptStreamEvent(stream, event);
    if (result === 'gap') return { accepted, buffered: ordered.slice(index) };
    if (result === 'accepted') accepted.push(event);
  }
  return { accepted, buffered: [] };
}

export function mergeEventHistory(events, incoming) {
  let last = events.at(-1)?.sequence ?? 0;
  if (incoming.every(event => {
    if (coalescedGroup(event) || firstSequence(event) <= last) return false;
    last = event.sequence;
    return true;
  })) { events.push(...incoming); return; }

  const existing = new Set(events.map(sequenceKey));
  for (const event of incoming) {
    const group = coalescedGroup(event);
    if (group) { replaceDeltas(events, event, group); continue; }
    const key = sequenceKey(event);
    if (existing.has(key)) continue;
    events.push(event);
    existing.add(key);
  }
  events.sort(compareSequence);
}

export function restoreEventHistory(stream, history) {
  const events = history.filter(event => event.runId === stream.runId).sort(compareSequence);
  let last = 0;
  for (const event of events) {
    if (firstSequence(event) !== last + 1 || firstSequence(event) > event.sequence) return false;
    last = event.sequence;
  }
  if (last > stream.lastSequence || last === stream.lastSequence && stream.events.length < events.length) {
    stream.events = events;
    stream.lastSequence = last;
  }
  return true;
}

export const terminalRunStatus = event => Object.hasOwn(terminalStatus, event.event.type) ? terminalStatus[event.event.type] : undefined;
export function mergeConversationRun(previous, next, forceCancelled) {
  const latestRunId = next.latestRunId ?? previous?.latestRunId;
  const latestRunStatus = forceCancelled ? 'cancelled' : next.latestRunStatus ?? previous?.latestRunStatus;
  const running = latestRunStatus === 'queued' || latestRunStatus === 'streaming';
  return { latestRunId, latestRunStatus, runningRunIds: running ? latestRunId ? [latestRunId] : previous?.runningRunIds ?? [] : [] };
}

export class StoppedRuns {
  #runs = new Set();
  #pending = new Map();
  addRun(id) { this.#runs.add(id); }
  addPending(id, requestId, value) { this.#pending.set(id, { requestId, value }); }
  hasRun(id) { return this.#runs.has(id); }
  hasPending(id) { return this.#pending.has(id); }
  resolve(event) {
    if (event.event.type !== 'run_started') return;
    const pending = this.#pending.get(event.conversationId);
    if (!pending || pending.requestId !== event.event.data.requestId) return;
    this.#pending.delete(event.conversationId);
    this.#runs.add(event.runId);
    return pending.value;
  }
  removeConversation(id, runIds) {
    this.#pending.delete(id);
    for (const runId of runIds) this.#runs.delete(runId);
  }
}

export class PendingRequests {
  #entries = new Map();
  begin(id, requestId, value, timeout, onTimeout) {
    this.clear(id);
    const timer = setTimeout(() => {
      const pending = this.#entries.get(id);
      if (pending?.requestId !== requestId) return;
      this.#entries.delete(id);
      onTimeout(pending.value);
    }, timeout);
    this.#entries.set(id, { requestId, value, timer });
  }
  acknowledge(id, requestId) {
    const pending = this.#entries.get(id);
    if (!pending || requestId && pending.requestId !== requestId) return;
    this.clear(id);
    return pending.value;
  }
  has(id) { return this.#entries.has(id); }
  clear(id) {
    clearTimeout(this.#entries.get(id)?.timer);
    this.#entries.delete(id);
  }
}
