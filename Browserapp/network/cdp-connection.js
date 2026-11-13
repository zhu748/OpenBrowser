'use strict';

/** A multiplexed CDP transport. Pooling and browser discovery live in cdp.js. */
class PersistentConnection {
  constructor(webSocketUrl, options = {}) {
    this.webSocketUrl = webSocketUrl;
    this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : null;
    this.onDisconnect = typeof options.onDisconnect === 'function' ? options.onDisconnect : null;
    this.nextId = 1;
    this.pending = new Map();
    this.socket = options.socket || null;
    this.closed = false;
    this.opened = false;
    this.disconnectNotified = false;
    this.openPromise = null;
    this.opening = null;
  }

  open(timeout = 6000) {
    if (this.closed) return Promise.reject(new Error('CDP persistent connection is closed'));
    if (this.openPromise) return this.openPromise;
    if (typeof WebSocket !== 'function') return Promise.reject(new Error('WebSocket API is unavailable in this host runtime'));
    const parsed = Number(timeout);
    const budget = Number.isFinite(parsed) && parsed > 0 ? parsed : 6000;
    const deadline = performance.now() + budget;
    this.openPromise = new Promise((resolve, reject) => {
      const opening = { resolve, reject, timer: null };
      this.opening = opening;
      let socket;
      try { socket = new WebSocket(this.webSocketUrl); }
      catch (error) { this.terminate(error); return; }
      this.socket = socket;
      const isCurrent = () => !this.closed && this.socket === socket;
      opening.timer = setTimeout(() => this.terminate(new Error('CDP connection timeout')), Math.max(0, Math.ceil(deadline - performance.now())));
      socket.addEventListener('open', () => {
        if (!isCurrent() || this.opening !== opening) return;
        if (performance.now() >= deadline) { this.terminate(new Error('CDP connection timeout')); return; }
        clearTimeout(opening.timer);
        this.opening = null;
        this.opened = true;
        resolve(this);
      });
      socket.addEventListener('message', (event) => { if (isCurrent()) this.handleMessage(event); });
      socket.addEventListener('error', () => {
        if (isCurrent()) this.terminate(new Error('CDP persistent socket error'), true);
      });
      socket.addEventListener('close', () => {
        if (isCurrent()) this.terminate(new Error('CDP persistent socket closed'), true);
      });
    });
    return this.openPromise;
  }

  handleMessage(event) {
    if (this.closed) return;
    let value;
    try { value = JSON.parse(String(event.data)); } catch (_) { return; }
    if (!value || typeof value !== 'object') return;
    if (value.id != null) {
      const pending = this.pending.get(value.id);
      if (!pending) return;
      if (performance.now() >= pending.deadline) { this.expireCommand(value.id); return; }
      this.pending.delete(value.id);
      clearTimeout(pending.timer);
      if (value.error) pending.reject(new Error(value.error.message || 'CDP command failed'));
      else pending.resolve(value.result || {});
      return;
    }
    if (value.method && this.onEvent) {
      try { Promise.resolve(this.onEvent(value, this)).catch(() => {}); } catch (_) {}
    }
  }

  command(method, params = {}, options = {}) {
    if (this.closed || !this.socket) return Promise.reject(new Error('CDP persistent connection is closed'));
    const id = this.nextId++;
    const parsed = Number(options.timeout);
    const timeout = Number.isFinite(parsed) && parsed > 0 ? parsed : 6000;
    const deadline = performance.now() + timeout;
    const message = { id, method, params };
    if (options.sessionId) message.sessionId = options.sessionId;
    let payload;
    try { payload = JSON.stringify(message); }
    catch (error) { return Promise.reject(error); }
    if (performance.now() >= deadline) return Promise.reject(new Error(`CDP timeout: ${method}`));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.expireCommand(id), Math.max(0, Math.ceil(deadline - performance.now())));
      this.pending.set(id, {
        resolve: (value) => { this.consecutiveTimeouts = 0; resolve(value); }, reject, timer, method, deadline,
      });
      try { this.socket.send(payload); }
      catch (error) { this.terminate(error, true); }
    });
  }

  expireCommand(id) {
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    clearTimeout(pending.timer);
    this.consecutiveTimeouts = (this.consecutiveTimeouts || 0) + 1;
    const error = new Error(`CDP timeout: ${pending.method}`);
    pending.reject(error);
    // Timer and late-response expiry share the same retirement policy.
    if (this.consecutiveTimeouts >= 3) this.terminate(error, true);
  }

  failAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  /** Settle both handshake and commands before closing the physical socket. */
  terminate(error, unexpected = false) {
    if (this.closed) return;
    const notify = unexpected && this.opened && !this.disconnectNotified;
    this.closed = true;
    this.opened = false;
    const socket = this.socket;
    this.socket = null;
    if (this.opening) {
      clearTimeout(this.opening.timer);
      this.opening.reject(error);
      this.opening = null;
    }
    this.failAll(error);
    if (notify) {
      this.disconnectNotified = true;
      try { Promise.resolve(this.onDisconnect?.(error, this)).catch(() => {}); } catch (_) {}
    }
    try { socket?.close(); } catch (_) {}
  }

  close() { this.terminate(new Error('CDP persistent connection closed')); }
}

module.exports = { PersistentConnection };
