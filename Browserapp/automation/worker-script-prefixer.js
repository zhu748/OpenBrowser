'use strict';

// Chromium worker response delivery through the page Fetch domain. Request
// headers have a separate owner; every response tracked here is released once.
const { injectWorkerSource, rewrittenScriptHeaders, isJavaScriptMime, MAX_WORKER_BYTES } = require('./worker-source');
const WORKER_SCRIPT_PATTERN = /\.(?:js|mjs)(?:[?#]|$)/i;
const TRANSIENT_ERRORS = /No resource with given identifier|Session (?:closed|with given id not found)|Target closed|Invalid InterceptionId/i;

class WorkerScriptPrefixer {
  constructor(options = {}) {
    this.source = options.source || '';
    this.commandTimeout = Math.max(2000, Math.min(15000, Number(options.commandTimeout) || 8000));
    this.requestStage = new Map();
    this.inFlight = new Map();
    this.fulfilledUrls = new Set();
    this.destroyed = false;
    this.logger = typeof options.logger === 'function' ? options.logger : null;
  }

  setSource(source) {
    if (this.source !== (source || '')) this.fulfilledUrls.clear();
    this.source = source || '';
  }

  matches(url) {
    return !this.destroyed && Boolean(this.source) && /^https?:/i.test(String(url || ''))
      && WORKER_SCRIPT_PATTERN.test(String(url).split('?')[0].split('#')[0]);
  }

  isExtensionlessWorkerResponse(event) {
    const params = event?.params || {};
    return !this.destroyed && Boolean(this.source) && /^https?:/i.test(String(params.request?.url || ''))
      && params.resourceType === 'Other' && isJavaScriptMime(this.header(params, 'content-type'));
  }

  key(event) { return JSON.stringify([event.sessionId || '', event.params?.requestId]); }
  header(params, name) {
    return params.responseHeaders?.find((h) => String(h.name).toLowerCase() === name)?.value;
  }

  track(event) {
    if (this.destroyed || !this.source || !event.params?.requestId) return;
    const key = this.key(event);
    if (!this.requestStage.has(key) && !this.inFlight.has(key)) {
      this.requestStage.set(key, { sessionId: event.sessionId, networkId: event.params.networkId, canceled: false, source: this.source });
    }
  }

  hasTracked(event) {
    return !this.destroyed && (this.requestStage.has(this.key(event)) || this.inFlight.has(this.key(event)));
  }

  cleanupSession(sessionId) {
    this.cancelWhere((state) => state.sessionId === sessionId);
  }

  cleanupFailedRequest(event) {
    const networkId = event.params?.requestId;
    if (networkId) this.cancelWhere((state) => state.sessionId === event.sessionId && state.networkId === networkId);
  }

  cancelWhere(matches) {
    for (const map of [this.requestStage, this.inFlight]) {
      for (const [key, state] of map) if (matches(state)) { state.canceled = true; map.delete(key); }
    }
  }

  destroy() {
    this.destroyed = true;
    for (const map of [this.requestStage, this.inFlight]) {
      for (const state of map.values()) state.canceled = true;
      map.clear();
    }
    this.fulfilledUrls.clear();
  }

  handlePaused(event, connection) {
    const params = event.params || {};
    if (!params.requestId || params.responseStatusCode == null && params.responseErrorReason == null) return Promise.resolve(false);
    const key = this.key(event);
    const existing = this.inFlight.get(key);
    if (existing) return existing.operation;
    const state = this.requestStage.get(key);
    if (!state || this.destroyed) return Promise.resolve(false);
    this.requestStage.delete(key);
    this.inFlight.set(key, state);
    state.operation = Promise.resolve().then(() => this.rewrite(event, connection, state)).finally(() => {
      if (this.inFlight.get(key) === state) this.inFlight.delete(key);
    });
    return state.operation;
  }

  async rewrite(event, connection, state) {
    const params = event.params;
    const requestId = params.requestId;
    const url = params.request?.url || '';
    const send = async (method, values) => {
      if (state.canceled || this.destroyed) return null;
      return connection.command(method, values, { sessionId: event.sessionId, timeout: this.commandTimeout });
    };
    // Page scripts, redirects, failed responses, partial bodies and non-JS
    // extensionless resources must keep their original headers and native errors.
    try {
      const workerScript = params.resourceType === 'Other' && isJavaScriptMime(this.header(params, 'content-type'));
      if (workerScript && (params.responseStatusCode === 206 || this.header(params, 'content-range'))) {
        throw new Error('Partial worker scripts cannot be initialized safely');
      }
      if (params.resourceType !== 'Other' || params.request?.method === 'HEAD'
        || !(params.responseStatusCode >= 200 && params.responseStatusCode < 300)
        || params.responseStatusCode === 204 || params.responseStatusCode === 205
        || !isJavaScriptMime(this.header(params, 'content-type'))) {
        await send('Fetch.continueRequest', { requestId });
        return true;
      }
      if (Number(this.header(params, 'content-length')) > MAX_WORKER_BYTES) throw new Error('Worker response exceeds byte limit');
      const result = await send('Fetch.getResponseBody', { requestId });
      if (state.canceled || this.destroyed) return true;
      if (!result || typeof result.body !== 'string') throw new Error('Worker response body is unavailable');
      const original = Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8');
      if (original.length > MAX_WORKER_BYTES) throw new Error('Worker response exceeds byte limit');
      const body = injectWorkerSource(original, state.source);
      await send('Fetch.fulfillRequest', { requestId, responseCode: params.responseStatusCode,
        responseHeaders: rewrittenScriptHeaders(params.responseHeaders, body.length), body: body.toString('base64') });
      if (state.canceled || this.destroyed) return true;
      if (state.source === this.source) this.fulfilledUrls.add(url);
      try { this.logger?.({ type: 'worker-script-prefixed', url }); } catch (_) {}
      return true;
    } catch (error) {
      if (state.canceled || this.destroyed || TRANSIENT_ERRORS.test(String(error.message))) return true;
      try { await send('Fetch.failRequest', { requestId, errorReason: 'Aborted' }); }
      catch (failure) {
        if (!TRANSIENT_ERRORS.test(String(failure.message)) && !state.canceled && !this.destroyed) error.fatal = true;
      }
      throw error;
    }
  }
}

module.exports = { WorkerScriptPrefixer, WORKER_SCRIPT_PATTERN, TRANSIENT_ERRORS };
