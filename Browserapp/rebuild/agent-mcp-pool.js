"use strict";

const { Connection } = require("./agent-mcp-connection");
const changed = () => Error("MCP 服务已修改或停用，请重新发起任务");

function cancellable(promise, signal) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener("abort", abort); reject(signal.reason || Error("MCP request cancelled")); };
    signal.addEventListener("abort", abort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
    if (signal.aborted) abort();
  });
}

class Slots {
  constructor(maximum) { this.maximum = maximum; this.active = 0; this.waiting = []; }
  acquire(signal) {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
      const entry = { resolve, signal, abort: () => {
        this.waiting = this.waiting.filter(value => value !== entry); reject(signal.reason);
      } };
      signal.addEventListener("abort", entry.abort, { once: true });
      this.waiting.push(entry); this.drain();
    });
  }
  drain() {
    while (this.active < this.maximum && this.waiting.length) {
      const entry = this.waiting.shift(); entry.signal.removeEventListener("abort", entry.abort);
      if (entry.signal.aborted) continue;
      this.active++;
      let released = false;
      entry.resolve(() => { if (!released) { released = true; this.active--; this.drain(); } });
    }
  }
}

class ConnectionPool {
  constructor(current, { maximum = 4, ConnectionClass = Connection } = {}) {
    if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 32) throw Error("Invalid MCP connection concurrency");
    this.current = current; this.ConnectionClass = ConnectionClass;
    this.connections = new Map(); this.lanes = new Map(); this.epochs = new Map();
    this.operations = new Set(); this.transients = new Set(); this.slots = new Slots(maximum);
    this.controller = new AbortController();
  }
  get signal() { return this.controller.signal; }
  signalFor(name, signal) {
    let controller = this.epochs.get(name);
    if (!controller) { controller = new AbortController(); this.epochs.set(name, controller); }
    return AbortSignal.any([this.signal, controller.signal, ...(signal ? [signal] : [])]);
  }
  invalidate(name) { this.epochs.get(name)?.abort(changed()); this.epochs.delete(name); }
  isCurrent(row, allowDisabled) {
    const current = this.current(row.name);
    return Boolean(current && (current.enabled || allowDisabled) && JSON.stringify(current.config) === JSON.stringify(row.config));
  }
  lane(name, operation, signal) {
    const previous = this.lanes.get(name) || Promise.resolve();
    const pending = previous.catch(() => {}).then(operation);
    this.lanes.set(name, pending); this.operations.add(pending);
    pending.finally(() => {
      this.operations.delete(pending); if (this.lanes.get(name) === pending) this.lanes.delete(name);
    }).catch(() => {});
    return cancellable(pending, signal);
  }
  connect(row, signal, { allowDisabled = false } = {}) {
    const combined = this.signalFor(row.name, signal);
    return this.lane(row.name, () => this.connectNow(row, combined, allowDisabled), combined);
  }
  async connectNow(row, signal, allowDisabled) {
    signal.throwIfAborted();
    if (!this.isCurrent(row, allowDisabled)) throw changed();
    const key = JSON.stringify(row.config), existing = this.connections.get(row.name);
    if (existing?.key === key && !existing.connection.closed) return existing;
    if (existing) { await existing.connection.close(); this.connections.delete(row.name); }
    const release = await this.slots.acquire(signal);
    let connection;
    try {
      signal.throwIfAborted();
      if (!this.isCurrent(row, allowDisabled)) throw changed();
      connection = new this.ConnectionClass(row.config); this.transients.add(connection);
      await connection.open(signal);
      const tools = await connection.tools(signal);
      signal.throwIfAborted();
      if (!this.isCurrent(row, allowDisabled)) throw changed();
      const record = { key, connection, tools };
      this.connections.set(row.name, record); this.transients.delete(connection);
      return record;
    } catch (error) {
      if (connection) {
        try { await this.dispose(connection); }
        catch (cleanup) { throw new AggregateError([error, cleanup], "MCP 连接初始化及清理失败"); }
      }
      throw error;
    } finally { release(); }
  }
  async dispose(connection) { await connection.close(); this.transients.delete(connection); }
  close(name) {
    this.invalidate(name);
    return this.lane(name, async () => {
      const record = this.connections.get(name);
      if (record) { await record.connection.close(); this.connections.delete(name); }
    });
  }
  async test(config) {
    this.signal.throwIfAborted();
    const release = await this.slots.acquire(this.signal);
    let connection;
    try {
      this.signal.throwIfAborted();
      connection = new this.ConnectionClass(config); this.transients.add(connection);
      await connection.open(this.signal); return await connection.tools(this.signal);
    } finally {
      try { if (connection) await this.dispose(connection); }
      finally { release(); }
    }
  }
  beginShutdown() {
    this.controller.abort(Error("MCP 正在关闭"));
    for (const controller of this.epochs.values()) controller.abort(Error("MCP 正在关闭"));
  }
  async shutdown(queue) {
    this.beginShutdown();
    await Promise.allSettled([queue, ...this.operations]);
    const results = await Promise.allSettled([
      ...[...this.connections.keys()].map(name => this.close(name)),
      ...[...this.transients].map(connection => this.dispose(connection)),
    ]);
    const errors = results.filter(value => value.status === "rejected").map(value => value.reason);
    if (errors.length) throw new AggregateError(errors, "MCP 连接清理失败");
    this.epochs.clear();
  }
}

module.exports = { ConnectionPool, cancellable };
