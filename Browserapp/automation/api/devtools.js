'use strict';

const cdp = require('../../cdp');
const { TaskScheduler } = require('../task-scheduler');

/** Resolve the browser GUID; transport deadlines destroy the underlying socket. */
async function resolveWebSocketDebuggerUrl(port, _profileId) {
  if (!port) return null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      const ws = await cdp.browserSocket(port, { timeoutMs: 600 });
      if (typeof ws === 'string' && ws.startsWith('ws://')) return ws;
    } catch (_) { /* A newly started browser may not have published its GUID yet. */ }
  }
  return null;
}

/** Share bounded, in-flight inventory queries without retaining stale browser GUIDs. */
function createProfileEndpointResolver(engine, { concurrency = 8, resolve = resolveWebSocketDebuggerUrl } = {}) {
  const scheduler = new TaskScheduler({ name: 'api-devtools-inventory', concurrency });
  const queries = new Map();
  return function endpointFor(row) {
    if (!row.port) return Promise.resolve(null);
    const item = engine.running?.get(row.id);
    const port = row.port;
    const isCurrent = () => !engine.running || (item && engine.running.get(row.id) === item
      && item.port === port && !item.cleanedUp && !item.stopping);
    if (!isCurrent()) return Promise.resolve(null);
    const existing = queries.get(row.id);
    if (existing && existing.item === item && existing.port === port) return existing.promise;
    const query = { item, port };
    query.promise = scheduler.schedule(async () => {
      if (!isCurrent()) return null;
      const ws = await resolve(port, row.id);
      return isCurrent() ? ws : null;
    }).finally(() => {
      if (queries.get(row.id) === query) queries.delete(row.id);
    });
    queries.set(row.id, query);
    return query.promise;
  };
}

module.exports = { resolveWebSocketDebuggerUrl, createProfileEndpointResolver };
