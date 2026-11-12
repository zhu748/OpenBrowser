'use strict';

/**
 * Chromium 157+ worker first-instruction delivery.
 *
 * Chrome removed the Fetch domain from worker sessions and introduced a debugger
 * deadlock: Runtime.evaluate of a nontrivial script on a worker held at
 * waitForDebuggerOnStart never returns. The worker injection source can therefore
 * no longer be delivered through the worker's own CDP session on those builds.
 *
 * This rewriter runs on the PAGE-level Fetch domain (still fully available). Worker
 * script requests are transparently continued at the request stage; when the paused
 * request reaches the response stage (Fetch.getResponseBody is only legal there),
 * the original body is re-fulfilled with the persona injection source prepended.
 * The worker's own first instruction then observes the patched globals, preserving
 * the first-read contract the worker-session evaluate used to provide.
 */

const WORKER_SCRIPT_PATTERN = /\.(?:js|mjs)(?:[?#]|$)/i;
const TRANSIENT_ERRORS = /Can only get response body|No resource with given identifier|Session (?:closed|with given id not found)|Target closed|Invalid InterceptionId/i;

class WorkerScriptPrefixer {
  constructor(options = {}) {
    this.source = options.source || '';
    this.commandTimeout = Math.max(2000, Math.min(15000, Number(options.commandTimeout) || 8000));
    this.requestStage = new Set();
    this.inFlight = new Set();
    this.destroyed = false;
    this.logger = typeof options.logger === 'function' ? options.logger : null;
  }

  setSource(source) {
    this.source = source || '';
  }

  /**
   * True when the paused request is a worker script this prefixer should rewrite.
   *
   * The request-stage view of a worker script load is nearly blind: no Sec-Fetch-Dest,
   * no UA/sec-ch-ua headers (verified empirically — worker script requests expose only
   * Accept/Referer), and possibly no .js suffix (extensionless endpoints like
   * /api/worker). The URL suffix therefore only covers the common case; the
   * extensionless case is discriminated at the RESPONSE stage by
   * isExtensionlessWorkerResponse() (resourceType "Other" + JavaScript MIME).
   */
  matches(url) {
    if (this.destroyed || !this.source) return false;
    const text = String(url || '');
    if (!/^https?:/i.test(text)) return false;
    const path = text.split('?')[0].split('#')[0];
    return WORKER_SCRIPT_PATTERN.test(path);
  }

  /**
   * Response-stage discriminator for extensionless worker scripts: worker loads are
   * resourceType "Other" (page scripts are "Script", documents "Document") and served
   * with a JavaScript MIME type. Covers dedicated, shared and service workers alike.
   */
  isExtensionlessWorkerResponse(event) {
    if (this.destroyed || !this.source) return false;
    const params = event?.params || {};
    const url = String(params.request?.url || '');
    if (!/^https?:/i.test(url)) return false;
    const path = url.split('?')[0].split('#')[0];
    if (WORKER_SCRIPT_PATTERN.test(path)) return false; // already matched by suffix
    if (String(params.resourceType || '') !== 'Other') return false;
    if (params.responseStatusCode == null) return false;
    const responseHeaders = params.responseHeaders;
    if (!Array.isArray(responseHeaders)) return false;
    const mime = String(responseHeaders.find((h) => String(h.name || '').toLowerCase() === 'content-type')?.value || '').toLowerCase();
    return /(?:application|text)\/(?:x-)?(?:javascript|ecmascript)/.test(mime);
  }

  /** Track a request-stage pause without continuing it (the header rewriter continues). */
  track(event) {
    const { requestId } = event.params || {};
    if (!requestId) return;
    const key = event.sessionId ? `${event.sessionId}:${requestId}` : requestId;
    this.requestStage.add(key);
  }

  /** True when this paused event belongs to a worker script we continued at request stage. */
  hasTracked(event) {
    if (this.destroyed) return false;
    const { requestId } = event.params || {};
    if (!requestId) return false;
    const key = event.sessionId ? `${event.sessionId}:${requestId}` : requestId;
    return this.requestStage.has(key);
  }

  destroy() {
    this.destroyed = true;
    this.requestStage.clear();
    this.inFlight.clear();
  }

  /**
   * Handle a paused request. Request stage: remember and continue. Response stage:
   * read the body, prepend the injection source, fulfill. Both stages must be
   * intercepted by the caller's Fetch.enable patterns (Request + Response for
   * Scripts).
   */
  async handlePaused(event, connection) {
    const { requestId, request, responseStatusCode } = event.params || {};
    if (!requestId) return false;
    const url = request?.url || '';
    const key = event.sessionId ? `${event.sessionId}:${requestId}` : requestId;
    if (responseStatusCode == null) return false; // request stage is tracked via track()
    if (!this.requestStage.delete(key)) return false;
    // Extensionless worker scripts were tracked speculatively at the request stage
    // (no discriminator was visible there); the response stage now decides.
    if (!WORKER_SCRIPT_PATTERN.test(url.split('?')[0].split('#')[0])
      && !this.isExtensionlessWorkerResponse(event)) return false;
    if (this.inFlight.has(key)) return false;
    this.inFlight.add(key);
    try {
      const response = await connection.command('Fetch.getResponseBody', { requestId }, { sessionId: event.sessionId, timeout: this.commandTimeout });
      const original = response && response.base64Encoded
        ? Buffer.from(response.body || '', 'base64')
        : Buffer.from(response?.body || '', 'utf8');
      await connection.command('Fetch.fulfillRequest', {
        requestId,
        responseCode: responseStatusCode,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/javascript' },
          { name: 'Cache-Control', value: 'no-store' },
        ],
        // Footer BEFORE the original body: a network worker that synchronously
        // spawns a nested worker at top level must already observe
        // self.__obPersonaUrl when the nested rewrite runs. The footer var is
        // IIFE-scoped so no marker leaks onto the realm global (the pattern
        // also fires for page scripts, which early-return the source but
        // would still execute this footer).
        body: Buffer.concat([
          Buffer.from(this.source, 'utf8'),
          Buffer.from('\n;\n', 'utf8'),
            Buffer.from(';(function(){try{var b=' + JSON.stringify(this.source)
            + ';Object.defineProperty(self,\'__obPersonaUrl\',{value:URL.createObjectURL(new Blob([b],{type:\'application/javascript\'})),configurable:true,writable:true});}catch(e){}})();\n', 'utf8'),
          Buffer.from('\n;\n', 'utf8'),
          original,
        ]).toString('base64'),
      }, { sessionId: event.sessionId, timeout: this.commandTimeout });
      this.logger?.({ type: 'worker-script-prefixed', url });
      return true;
    } finally {
      this.inFlight.delete(key);
    }
  }
}

module.exports = { WorkerScriptPrefixer, WORKER_SCRIPT_PATTERN, TRANSIENT_ERRORS };
