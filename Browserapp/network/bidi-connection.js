'use strict';

// Firefox's Remote Agent exposes WebDriver BiDi directly on /session.
// https://developer.mozilla.org/en-US/docs/Web/WebDriver/How_to/Create_BiDi_connection
function localBidiEndpoint(value) {
  const url = new URL(value);
  if (url.protocol !== 'ws:' || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname)
      || url.username || url.password || !url.port) throw new Error('Firefox BiDi endpoint must use loopback');
  url.pathname = '/session';
  url.search = '';
  url.hash = '';
  return url.href;
}

class BidiConnection {
  constructor(endpoint, options = {}) {
    this.endpoint = localBidiEndpoint(endpoint);
    this.socketFactory = options.socketFactory || ((url) => new WebSocket(url));
    this.onEvent = options.onEvent;
    this.onDisconnect = options.onDisconnect;
    this.pending = new Map();
    this.nextId = 1;
    this.closed = false;
    this.intentionalClose = false;
  }

  open(timeout = 8000) {
    if (this.closed) return Promise.reject(new Error('BiDi connection is closed'));
    if (this.openPromise) return this.openPromise;
    this.openPromise = this._open(timeout);
    return this.openPromise;
  }

  async _open(timeout) {
    const parsed = Number(timeout);
    const budget = Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
    const deadline = performance.now() + budget;
    try { this.socket = this.socketFactory(this.endpoint); }
    catch (error) { this.terminate(error); throw error; }
    this.socket.addEventListener('message', (event) => {
      if (this.closed) return;
      let message;
      const text = String(event.data);
      if (text.length > 16 * 1024 * 1024) { this.terminate(new Error('Firefox BiDi response exceeded its size limit')); return; }
      try { message = JSON.parse(text); } catch (_) { return; }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return;
      if (message.id !== undefined) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        if (performance.now() >= pending.deadline) { this.expireCommand(message.id); return; }
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.type === 'error' || message.error) {
          const error = new Error(message.message || message.error || 'BiDi command failed');
          error.code = message.error;
          pending.reject(error);
        } else pending.resolve(message.result || {});
      } else if (message.type === 'event') {
        Promise.resolve().then(() => { if (!this.closed) return this.onEvent?.(message, this); }).catch((error) => this.terminate(error));
      }
    });
    this.socket.addEventListener('close', () => this.terminate(new Error('Firefox BiDi connection closed')));
    this.socket.addEventListener('error', () => this.terminate(new Error('Firefox BiDi socket error')));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.terminate(new Error('Firefox BiDi connection timeout')); }, Math.max(0, Math.ceil(deadline - performance.now())));
      this.opening = { resolve: () => { clearTimeout(timer); this.opening = null; resolve(); }, reject: (error) => { clearTimeout(timer); this.opening = null; reject(error); } };
      this.socket.addEventListener('open', () => {
        if (performance.now() >= deadline) this.terminate(new Error('Firefox BiDi connection timeout'));
        else this.opening?.resolve();
      }, { once: true });
    });
    return this;
  }

  command(method, params = {}, timeout = 8000) {
    if (this.closed || !this.socket || this.socket.readyState !== 1) return Promise.reject(new Error('BiDi connection is not open'));
    if (this.pending.size >= 256) return Promise.reject(new Error('Too many pending BiDi commands'));
    const id = this.nextId++;
    const parsed = Number(timeout);
    const budget = Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
    const deadline = performance.now() + budget;
    let payload;
    try { payload = JSON.stringify({ id, method, params }); }
    catch (error) { return Promise.reject(error); }
    if (performance.now() >= deadline) return Promise.reject(new Error(`BiDi timeout: ${method}`));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.expireCommand(id), Math.max(0, Math.ceil(deadline - performance.now())));
      this.pending.set(id, { resolve, reject, timer, method, deadline });
      try { this.socket.send(payload); }
      catch (error) { this.terminate(error); }
    });
  }

  expireCommand(id) {
    const pending = this.pending.get(id);
    if (!pending) return;
    this.pending.delete(id);
    clearTimeout(pending.timer);
    pending.reject(new Error(`BiDi timeout: ${pending.method}`));
  }

  terminate(error) {
    if (this.closed) return;
    this.closed = true;
    this.opening?.reject(error);
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
    this.pending.clear();
    try { this.socket?.close(); } catch (_) {}
    if (!this.intentionalClose) {
      try { Promise.resolve(this.onDisconnect?.(error)).catch(() => {}); } catch (_) {}
    }
  }

  close() {
    this.intentionalClose = true;
    this.terminate(new Error('Firefox BiDi connection closed by host'));
  }
}

function deserializeRemoteValue(value, depth = 0) {
  if (!value || depth > 16) return undefined;
  if (value.type === 'null') return null;
  if (value.type === 'undefined') return undefined;
  if (value.type === 'array') return (value.value || []).map((entry) => deserializeRemoteValue(entry, depth + 1));
  if (value.type === 'object') {
    const out = {};
    for (const [key, entry] of value.value || []) {
      Object.defineProperty(out, typeof key === 'string' ? key : String(deserializeRemoteValue(key, depth + 1)), {
        enumerable: true, configurable: true, writable: true, value: deserializeRemoteValue(entry, depth + 1),
      });
    }
    return out;
  }
  return value.value;
}

async function evaluateBidi(connection, target, expression) {
  const result = await connection.command('script.evaluate', {
    expression, target, awaitPromise: true, resultOwnership: 'none',
    serializationOptions: { maxObjectDepth: 6 },
  });
  if (result.type === 'exception') throw new Error(result.exceptionDetails?.text || 'Firefox fingerprint script failed');
  if (result.type !== 'success') throw new Error('Firefox returned an invalid script result');
  return deserializeRemoteValue(result.result);
}

function waitForFirefoxEndpoint(child, timeout = 12000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let output = child._startupDiagnostic?.stderr || '';
    const finish = (error, endpoint) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stderr?.removeListener('data', read);
      child.removeListener('exit', exited);
      child.removeListener('error', failed);
      if (error) reject(error); else resolve(endpoint);
    };
    const read = (chunk = '') => {
      output = (output + chunk).slice(-32768);
      const match = output.match(/WebDriver BiDi listening on (ws:\/\/[^\s]+)/i);
      if (match) {
        try { finish(null, localBidiEndpoint(match[1])); } catch (error) { finish(error); }
      }
    };
    const exited = () => finish(new Error('Firefox exited before BiDi became ready'));
    const failed = (error) => finish(error);
    const timer = setTimeout(() => finish(new Error('Firefox BiDi startup timeout')), timeout);
    child.stderr?.on('data', read);
    child.once('exit', exited);
    child.once('error', failed);
    if (child.exitCode != null || child.signalCode) exited(); else read();
  });
}

module.exports = { BidiConnection, localBidiEndpoint, deserializeRemoteValue, evaluateBidi, waitForFirefoxEndpoint };
