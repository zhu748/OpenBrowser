import { On as isTemplateRef } from './utils-BIWenCnY.js';
import { resolveTemplateName } from './workbench-approval-resource-names.js';

const labels = new Map();
const pendingNames = new Map();

function scriptRef({ event: { type, data } }) {
  if (type === 'tool_started' && data.toolName === 'roxy_script_run') return [data.target, data.input?.scriptPath].find(isTemplateRef);
  if (type === 'script_output' && isTemplateRef(data.scriptName)) return data.scriptName;
}

async function labelFor(ref, context) {
  const key = `${context.workspaceId ?? ''}\0${context.locale ?? ''}\0${ref}`;
  if (labels.has(key)) return labels.get(key);
  if (!pendingNames.has(key)) {
    const request = resolveTemplateName(ref, context).then(label => {
      if (label) labels.set(key, label);
      return label;
    }).catch(error => console.warn(`[agent-console] Failed to resolve script template ${ref}:`, error)).finally(() => pendingNames.delete(key));
    pendingNames.set(key, request);
  }
  return pendingNames.get(key);
}

export async function enrichScriptEvents(events, context) {
  const refs = [...new Set(events.map(scriptRef).filter(Boolean))];
  if (!refs.length) return [...events];
  const names = new Map(await Promise.all(refs.map(async ref => [ref, await labelFor(ref, context)])));
  return events.map(envelope => {
    const name = names.get(scriptRef(envelope));
    if (!name) return envelope;
    const { event } = envelope;
    const field = event.type === 'tool_started' ? 'target' : 'scriptName';
    return { ...envelope, event: { ...event, data: { ...event.data, [field]: name } } };
  });
}

function scope(envelope) {
  const { agentPath, workerId } = envelope.event.data;
  const path = (typeof agentPath === 'string' && agentPath) || (typeof workerId === 'string' && workerId) || '/root';
  return JSON.stringify([envelope.conversationId, path]);
}

export function idleScheduler(host) {
  return { schedule(callback, timeout) {
    if (host.requestIdleCallback && host.cancelIdleCallback) {
      const id = host.requestIdleCallback(callback, { timeout });
      return () => host.cancelIdleCallback?.(id);
    }
    const id = host.setTimeout(callback, timeout);
    return () => host.clearTimeout(id);
  } };
}

export class RunEventBatch {
  #options;
  #entries = new Map();
  #inFlight = new Map();

  constructor(options) { this.#options = options; }

  enqueue(event) {
    if (event.event.type !== 'content_delta' && event.event.type !== 'thinking_delta') return false;
    const key = scope(event);
    const pending = this.#entries.get(key);
    if (pending?.runId === event.runId) { pending.items.push(event); return true; }
    if (pending) this.#flush(key, pending).catch(this.#options.onError);

    const { runId, conversationId } = event;
    const entry = { runId, conversationId, items: [event], cancel: () => {} };
    entry.cancel = this.#options.scheduler.schedule(() => this.#flush(key, entry).catch(this.#options.onError), this.#options.ttlMs);
    this.#entries.set(key, entry);
    return true;
  }

  async flushRun(id) {
    const pending = [];
    for (const [key, entry] of this.#entries) if (entry.runId === id) pending.push(this.#flush(key, entry));
    await Promise.all([...pending, ...(this.#inFlight.get(id) ?? [])]);
  }

  discardRun(id) { this.#discard(entry => entry.runId === id); }
  removeConversation(id) { this.#discard(entry => entry.conversationId === id); }

  #discard(predicate) {
    for (const [key, entry] of this.#entries) {
      if (!predicate(entry)) continue;
      entry.cancel();
      this.#entries.delete(key);
    }
  }

  async #flush(key, entry) {
    if (this.#entries.get(key) !== entry) return;
    entry.cancel();
    this.#entries.delete(key);
    const events = [...entry.items].sort((a, b) => a.sequence - b.sequence);
    let request;
    try { request = Promise.resolve(this.#options.onFlush(events)); }
    catch (error) { request = Promise.reject(error); }
    const running = this.#inFlight.get(entry.runId) ?? new Set();
    running.add(request);
    this.#inFlight.set(entry.runId, running);
    try { await request; }
    finally {
      running.delete(request);
      if (!running.size) this.#inFlight.delete(entry.runId);
    }
  }
}
