'use strict';

/** Engine-wide, bounded CDP inventory queries, shared across UI/API callers. */
const cdp = require('../cdp');
const { TaskScheduler } = require('../automation/task-scheduler');
const SESSION_QUERY_CONCURRENCY = 8;

module.exports = {
  async sessions() {
    this._sessionScheduler ||= new TaskScheduler({ name: 'session-inventory', concurrency: SESSION_QUERY_CONCURRENCY });
    this._sessionQueries ||= new Map();
    const requests = this.runningWithCdp([...this.running.keys()]).map(({ id, item }) => {
      const port = item.port;
      const existing = this._sessionQueries.get(id);
      if (existing?.item === item && existing.port === port) return existing.promise;

      const query = { item, port };
      const isCurrent = () => this.running.get(id) === item && item.port === port && !item.cleanedUp && !item.stopping;
      // No scheduler timeout: the transport destroys its socket at its own
      // deadline. A slot stays occupied until the underlying I/O actually ends.
      query.promise = this._sessionScheduler.schedule(async () => {
        if (!isCurrent()) return null;
        let tabs = [];
        let error;
        try { tabs = await cdp.tabs(port); }
        catch (cause) { error = cause?.message || String(cause); }
        if (!isCurrent()) return null;
        return { id, profile: this.profiles.get(id), port, browser: item.browser?.name || '', tabs, ...(error ? { error } : {}) };
      }).finally(() => {
        if (this._sessionQueries.get(id) === query) this._sessionQueries.delete(id);
      });
      this._sessionQueries.set(id, query);
      return query.promise;
    });
    return (await Promise.all(requests)).filter((entry) => entry !== null);
  },
};
