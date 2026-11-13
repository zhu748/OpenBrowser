'use strict';

/**
 * CDP Fetch response rewrite module for CSS @font-face local() leakage prevention.
 *
 * Intercepts incoming Document (HTML) and Stylesheet (CSS) network responses at the CDP
 * Fetch layer (Response stage) before Blink tokenization and style resolution.
 * Rewrites foreign local() font family declarations outside the allowed persona whitelist
 * to a neutral nonexistent local family, neutralizing static <style> and external <link> font leaks
 * while leaving external url(), data: font sources, and persona fonts intact.
 */

const crypto = require('crypto');
const { deriveFontPlaceholder } = require('./font-placeholder');
const { sanitizeFontCss } = require('./css-font-parser');
const { rewriteHtmlStyles } = require('./html-font-parser');
const { BoundedLru } = require('./bounded-lru');

const DEFAULT_BLOCKED_FONT = deriveFontPlaceholder('response-rewrite-default');
const DEFAULT_MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB limit to prevent excessive memory usage
// Static stylesheet transforms can be shared across tabs. Cache only CSS, not
// HTML documents or request headers, with policy+content isolation and a hard cap.
const stylesheetTransforms = new BoundedLru({ maxEntries: 128, maxBytes: 8 * 1024 * 1024,
  sizeOf: (entry) => 32 + (entry.source?.length || 0) * 2 });

/**
 * Extract case-insensitive font family whitelist set from persona options or fingerprint.
 *
 * @param {Array<string>|Object} personaFonts - Font family array or fingerprint object.
 * @returns {Set<string>}
 */
function normalizePersonaFontSet(personaFonts) {
  let list = [];
  if (Array.isArray(personaFonts)) {
    list = personaFonts;
  } else if (personaFonts && personaFonts.fonts && Array.isArray(personaFonts.fonts.list)) {
    list = personaFonts.fonts.list;
  } else if (personaFonts && Array.isArray(personaFonts.list)) {
    list = personaFonts.list;
  }
  const set = new Set();
  for (const name of list) {
    if (typeof name === 'string') {
      const clean = name.trim().replace(/\s+/g, ' ').toLowerCase();
      if (clean) set.add(clean);
    }
  }
  return set;
}

/**
 * Sanitize @font-face local() sources within CSS text.
 *
 * Replaces any local("ForeignFont") that is not in the allowedFamilies set
 * with a neutral nonexistent local family. Web fonts with url(...) and data:...
 * remain untouched.
 *
 * @param {string} css - Raw CSS stylesheet content.
 * @param {Set<string>} allowedFamilies - Normalized allowed font family names.
 * @param {string} [blockedFont] - Fallback placeholder font name.
 * @returns {string} - Sanitized CSS content.
 */
function sanitizeCss(css, allowedFamilies, blockedFont = DEFAULT_BLOCKED_FONT) {
  return sanitizeFontCss(css, allowedFamilies, blockedFont);
}

/**
 * Sanitize HTML content by rewriting inline <style> tags and static data:text/css <link> tags.
 *
 * @param {string} html - Raw HTML document content.
 * @param {Set<string>} allowedFamilies - Normalized allowed font family names.
 * @param {string} [blockedFont] - Fallback placeholder font name.
 * @param {Function} [onStyleReplaced] - Callback invoked when a <style> block is modified.
 * @returns {string} - Sanitized HTML content.
 */
function sanitizeHtml(html, allowedFamilies, blockedFont = DEFAULT_BLOCKED_FONT, onStyleReplaced = null) {
  if (typeof html !== 'string') return html;
  const result = rewriteHtmlStyles(html, (css) => sanitizeCss(css, allowedFamilies, blockedFont),
    (policy, replacements) => updateCspHeaders([{ name: 'content-security-policy', value: policy }], replacements)[0].value);
  for (const pair of result.replacements) if (typeof onStyleReplaced === 'function') onStyleReplaced(pair.oldContent, pair.newContent);
  return result.html;
}

/**
 * Calculate SHA-256 base64 digest of a string or buffer.
 */
function styleDigest(data, algorithm) {
  return crypto.createHash(algorithm).update(data.replace(/\r\n?/g, '\n')).digest('base64');
}

/**
 * Update Content-Security-Policy headers when inline <style> elements are modified.
 *
 * Add rewritten style hashes to their original style directives. Keep existing
 * authorization and unrelated script directives unchanged.
 *
 * @param {Array<{name: string, value: string}>} headers
 * @param {Array<{oldContent: string, newContent: string}>} styleReplacements
 * @returns {Array<{name: string, value: string}>}
 */
function updateCspHeaders(headers, styleReplacements) {
  if (!styleReplacements || !styleReplacements.length || !headers || !headers.length) {
    return headers;
  }

  const algorithms = new Set();
  for (const header of headers) {
    if (!/^content-security-policy(?:-report-only)?$/i.test(header.name)) continue;
    for (const match of header.value.matchAll(/'sha(256|384|512)-[A-Za-z\d+/=]+'/gi)) algorithms.add('sha' + match[1]);
  }
  // Nonce-only and unsafe-inline policies need no hash work at all.
  if (!algorithms.size) return headers;
  const hashPairs = styleReplacements.flatMap((pair) => [...algorithms].map((algorithm) => ({
    oldHash: `'${algorithm}-${styleDigest(pair.oldContent, algorithm)}'`,
    newHash: `'${algorithm}-${styleDigest(pair.newContent, algorithm)}'`,
  }))).filter((pair) => pair.oldHash !== pair.newHash);

  if (!hashPairs.length) return headers;

  return headers.map((header) => {
    const name = header.name.toLowerCase();
    if (name === 'content-security-policy' || name === 'content-security-policy-report-only') {
      const directives = header.value.split(';');
      const hasStyle = directives.some((part) => /^\s*style-src(?:\s|$)/i.test(part));
      const hasStyleElem = directives.some((part) => /^\s*style-src-elem(?:\s|$)/i.test(part));
      const extendStyle = (part) => {
        const tokens = new Set(part.trim().split(/\s+/).map((token) => token.replace(/^'sha(256|384|512)-/i, (prefix) => prefix.toLowerCase())));
        for (const { oldHash, newHash } of hashPairs) {
          if (tokens.has(oldHash) && !tokens.has(newHash)) { part += ' ' + newHash; tokens.add(newHash); }
        }
        return part;
      };
      let fallbackStyle = '', sawDefault = false;
      const updatedVal = directives.map((part) => {
        const directive = /^\s*([^\s]+)/.exec(part)?.[1]?.toLowerCase();
        if (directive === 'style-src' || directive === 'style-src-elem') return extendStyle(part);
        if (directive === 'default-src' && !sawDefault) {
          sawDefault = true;
          if (!hasStyle && !hasStyleElem) {
            const style = part.replace(/^(\s*)default-src\b/i, '$1style-src');
            const rewritten = extendStyle(style);
            if (rewritten !== style) fallbackStyle = rewritten;
          }
        }
        // Keep the default policy intact for scripts and every other resource.
        return part;
      }).join(';');
      return { name: header.name, value: updatedVal + (fallbackStyle ? ';' + fallbackStyle : '') };
    }
    return header;
  });
}

class CssFontResponseRewriter {
  /**
   * @param {Object} options
   * @param {Array<string>|Object} [options.personaFonts] - Persona font list or fingerprint object.
   * @param {number} [options.maxBodySize] - Maximum body byte size to process (default: 10MB).
   * @param {string} [options.blockedFont] - Placeholder blocked font name.
   * @param {boolean} [options.enabled] - Whether response rewriting is enabled (default: true).
   * @param {Function} [options.logger] - Optional diagnostic logging function.
   */
  constructor(options = {}) {
    this.allowedFamilies = normalizePersonaFontSet(options.personaFonts);
    this.maxBodySize = Number(options.maxBodySize) || DEFAULT_MAX_BODY_SIZE;
    this.blockedFont = options.blockedFont || deriveFontPlaceholder(options.fingerprint || options.seed || options.personaFonts || DEFAULT_BLOCKED_FONT);
    this.policyCacheKey = JSON.stringify([[...this.allowedFamilies].sort(), this.blockedFont]);
    this.enabled = options.enabled !== false;
    this.logger = typeof options.logger === 'function' ? options.logger : null;
    this.inFlightRequests = new Set();
    // requestId -> owning CDP session, so a detached iframe/worker can only release its own
    // bookkeeping instead of clearing ids that still belong to live tabs.
    this.inFlightBySession = new Map();
    this.operations = new Map();
    this.destroyed = false;
  }

  /**
   * Update allowed font families.
   * @param {Array<string>|Object} personaFonts
   */
  setPersonaFonts(personaFonts) {
    this.allowedFamilies = normalizePersonaFontSet(personaFonts);
    this.policyCacheKey = JSON.stringify([[...this.allowedFamilies].sort(), this.blockedFont]);
  }

  rewriteStylesheet(body) {
    const key = crypto.createHash('sha256').update(this.policyCacheKey).update('\0').update(body).digest('hex');
    const cached = stylesheetTransforms.get(key);
    if (cached) return cached.source ?? body;
    const source = sanitizeCss(body, this.allowedFamilies, this.blockedFont);
    stylesheetTransforms.set(key, { source: source === body ? null : source });
    return source;
  }

  /**
   * Enable CDP Fetch domain response interception for Document and Stylesheet resources.
   *
   * @param {Object} connection - CDP connection or client exposing .command() or .send()
   * @param {Object} [options] - Options including sessionId
   */
  async enable(connection, options = {}) {
    if (!this.enabled) return;
    const params = {
      patterns: [
        { requestStage: 'Response', resourceType: 'Document' },
        { requestStage: 'Response', resourceType: 'Stylesheet' },
      ],
    };
    return this._sendCommand(connection, 'Fetch.enable', params, options);
  }

  /**
   * Disable CDP Fetch domain interception.
   *
   * @param {Object} connection
   * @param {Object} [options]
   */
  async disable(connection, options = {}) {
    return this._sendCommand(connection, 'Fetch.disable', {}, options);
  }

  /**
   * Attach rewriter to a PersistentConnection instance.
   * Automatically chains onEvent and enables Fetch interception.
   *
   * @param {Object} connection
   * @param {Object} [options]
   */
  attach(connection, options = {}) {
    if (!connection) return;
    const existingOnEvent = connection.onEvent;
    connection.onEvent = (event, conn) => {
      this.handleEvent(event, conn || connection);
      if (typeof existingOnEvent === 'function') {
        try { existingOnEvent(event, conn || connection); } catch (_) {}
      }
    };
    this.enable(connection, options).catch((err) => {
      this._log('enable-error', { error: err.message });
    });
  }

  /**
   * Handle incoming CDP events (specifically Fetch.requestPaused).
   *
   * Deadlock prevention guarantees:
   * - Strict synchronous dispatch into async handler.
   * - In-flight tracking with timeout protection.
   * - Every requestPaused event is guaranteed to either continueRequest or fulfillRequest.
   *
   * @param {Object} event - CDP event object.
   * @param {Object} connection - CDP connection object.
   */
  handleEvent(event, connection) {
    if (!event || event.method !== 'Fetch.requestPaused' || !event.params) {
      return;
    }
    const { requestId, request, resourceType, responseStatusCode, responseHeaders, responseStatusText } = event.params;
    const sessionId = event.sessionId;

    if (!requestId || this.destroyed) return;
    const key = JSON.stringify([sessionId || '', requestId]);
    const pending = this.operations.get(key);
    if (pending) return pending.promise;
    const state = { cancelled: false, cleanup: null, promise: null };
    this.operations.set(key, state);

    this.inFlightRequests.add(key);
    if (sessionId) {
      let sessionRequests = this.inFlightBySession.get(sessionId);
      if (!sessionRequests) {
        sessionRequests = new Set();
        this.inFlightBySession.set(sessionId, sessionRequests);
      }
      sessionRequests.add(key);
    }

    state.promise = (async () => {
      let settled = false;
      let safetyTimer = null;
      const clearSafety = () => {
        if (safetyTimer) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }
      };
      const forget = () => {
        if (this.operations.get(key) !== state) return;
        this.inFlightRequests.delete(key);
        const tracked = sessionId ? this.inFlightBySession.get(sessionId) : null;
        if (tracked) {
          tracked.delete(key);
          if (!tracked.size) this.inFlightBySession.delete(sessionId);
        }
      };
      const release = () => {
        settled = true;
        clearSafety();
        forget();
      };
      state.cleanup = release;
      // Fail-open backstop. Every awaited CDP call already carries its own timeout, so the only
      // way this handler can strand a paused response is a send() that never settles at all.
      // The backstop is therefore armed per send and sized to that send's own budget: one absolute
      // deadline shorter than the longest legitimate path (8s body fetch + 8s fulfil) would
      // release requests that were merely slow, which the page sees as a half-rewritten document
      // and a tab that stops responding — exactly the symptom this guard exists to prevent.
      const guardedSend = async (method, params = {}, options = {}) => {
        if (state.cancelled || this.destroyed) return null;
        const budget = Number(options.timeout) || 6000;
        clearSafety();
        safetyTimer = setTimeout(() => {
          if (settled || state.cancelled || this.destroyed) return;
          settled = true;
          state.cancelled = true;
          forget();
          if (this.operations.get(key) === state) this.operations.delete(key);
          this._log('stuck-failopen', { method, url: request?.url, budget });
          this._sendCommand(connection, 'Fetch.continueRequest', { requestId }, { sessionId, timeout: 4000 }).catch(() => {});
        }, budget + 2000);
        if (typeof safetyTimer.unref === 'function') safetyTimer.unref();
        try {
          return await this._sendCommand(connection, method, params, options);
        } finally {
          clearSafety();
        }
      };
      const doContinue = async () => {
        if (settled || state.cancelled || this.destroyed) return;
        release();
        try {
          await guardedSend('Fetch.continueRequest', { requestId }, { sessionId, timeout: 6000 });
        } catch (_) {}
      };

      try {
        // 1. If rewrite is disabled, pass through immediately
        if (!this.enabled) {
          return await doContinue();
        }

        // 2. Only handle responses (responseStatusCode is provided)
        if (responseStatusCode == null) {
          return await doContinue();
        }
        if (request?.method === 'HEAD' || [204, 205, 304].includes(responseStatusCode)
          || (responseStatusCode >= 300 && responseStatusCode < 400)) return await doContinue();

        // 3. Skip 206 Partial Content and Range responses
        if (responseStatusCode === 206 || this._hasHeader(responseHeaders, 'content-range')) {
          return await doContinue();
        }

        // 4. Validate Content-Type / ResourceType whitelist (only HTML and CSS)
        const contentType = (this._getHeaderValue(responseHeaders, 'content-type') || '').toLowerCase();
        const mime = contentType.split(';')[0].trim();
        const isHtml = mime ? mime === 'text/html' || mime === 'application/xhtml+xml' : resourceType === 'Document';
        const isCss = mime ? mime === 'text/css' : resourceType === 'Stylesheet';

        if (!isHtml && !isCss) {
          return await doContinue();
        }

        // 5. Check Content-Length size boundary
        const rawContentLength = this._getHeaderValue(responseHeaders, 'content-length');
        if (rawContentLength) {
          const parsedLength = parseInt(rawContentLength, 10);
          if (parsedLength > this.maxBodySize) {
            this._log('skip-oversized', { url: request?.url, size: parsedLength });
            return await doContinue();
          }
        }

        // 6. Request response body from CDP
        const bodyMessage = await guardedSend(
          'Fetch.getResponseBody',
          { requestId },
          { sessionId, timeout: 8000 }
        );
        if (settled || state.cancelled || this.destroyed) return;

        const bodyData = bodyMessage?.result || bodyMessage;
        if (!bodyData || bodyData.body == null) {
          return await doContinue();
        }

        // Content-Length can be absent or describe compressed bytes. Bound
        // decoded data before allocating another buffer or scanning CSS.
        const bodyBytes = bodyData.base64Encoded
          ? Buffer.byteLength(bodyData.body, 'base64')
          : Buffer.byteLength(String(bodyData.body), 'utf8');
        if (bodyBytes > this.maxBodySize) {
          this._log('skip-decoded-oversized', { url: request?.url, size: bodyBytes });
          return await doContinue();
        }

        // 7. Decode body to UTF-8 text
        let bodyText = '';
        if (bodyData.base64Encoded) {
          const charset = /charset\s*=\s*["']?([^\s;"']+)/i.exec(contentType)?.[1] || 'utf-8';
          bodyText = new TextDecoder(charset).decode(Buffer.from(bodyData.body, 'base64'));
        } else {
          bodyText = String(bodyData.body);
        }

        // 8. Sanitize content
        const styleReplacements = [];
        const onStyleReplaced = (oldContent, newContent) => {
          styleReplacements.push({ oldContent, newContent });
        };

        let rewritten = bodyText;
        if (isHtml) {
          rewritten = sanitizeHtml(bodyText, this.allowedFamilies, this.blockedFont, onStyleReplaced);
        } else if (isCss) {
          rewritten = this.rewriteStylesheet(bodyText);
        }

        // If nothing was modified, continue original request to preserve network streaming
        if (rewritten === bodyText) {
          return await doContinue();
        }

        // 9. Prepare fulfilled headers:
        // - Recalculate Content-Length to match rewritten byte size
        // - Strip Content-Encoding because CDP getResponseBody decodes transparently,
        //   so the fulfilled payload is uncompressed identity stream.
        // - Strip Transfer-Encoding (chunked) as the body is delivered as a single entity.
        // - Update Content-Security-Policy if style sha256 hashes changed.
        const newBodyBuffer = Buffer.from(rewritten, 'utf8');
        let fulfilledHeaders = (responseHeaders || []).filter((h) => {
          const lower = h.name.toLowerCase();
          return lower !== 'content-length' && lower !== 'content-encoding' && lower !== 'transfer-encoding';
        });
        fulfilledHeaders = fulfilledHeaders.map((header) => header.name.toLowerCase() === 'content-type'
          ? { name: header.name, value: header.value.replace(/;\s*charset\s*=\s*(?:"[^"]*"|'[^']*'|[^;\s]*)/ig, '') + '; charset=utf-8' }
          : header);
        fulfilledHeaders.push({ name: 'Content-Length', value: String(newBodyBuffer.length) });

        if (styleReplacements.length > 0) {
          fulfilledHeaders = updateCspHeaders(fulfilledHeaders, styleReplacements);
        }

        // Settle only after the CDP call actually succeeds. Marking the request settled first
        // made the catch-path fallback a no-op, so a rejected fulfill left the resource paused
        // forever and the tab stopped responding.
        let fulfilled = false;
        try {
          await guardedSend(
            'Fetch.fulfillRequest',
            {
              requestId,
              responseCode: responseStatusCode || 200,
              responsePhrase: responseStatusText || undefined,
              responseHeaders: fulfilledHeaders,
              body: newBodyBuffer.toString('base64'),
            },
            { sessionId, timeout: 8000 }
          );
          fulfilled = true;
        } catch (fulfillError) {
          this._log('fulfill-error', { error: fulfillError.message, url: request?.url });
        }
        release();
        if (!fulfilled) {
          // Hand the untouched response back instead of stranding it.
          try {
            await guardedSend('Fetch.continueRequest', { requestId }, { sessionId, timeout: 6000 });
          } catch (_) {}
          return;
        }

        this._log('rewritten', {
          url: request?.url,
          resourceType,
          originalLength: bodyData.body.length,
          newLength: newBodyBuffer.length,
        });

      } catch (err) {
        this._log('handle-error', { error: err.message, url: request?.url });
        await doContinue();
      } finally {
        clearSafety();
        forget();
        if (this.operations.get(key) === state) this.operations.delete(key);
      }
    })();
    return state.promise;
  }

  /**
   * Drop bookkeeping for a detached session. Without this, a closed iframe/worker leaves its
   * request ids behind for the lifetime of the process.
   */
  cleanupSession(sessionId) {
    if (!sessionId) return;
    const tracked = this.inFlightBySession.get(sessionId);
    if (!tracked) return;
    // Only this session's ids are dropped. A detached iframe/worker must never clear bookkeeping
    // that still belongs to a live tab, which would hide that tab's requests from the counters.
    for (const key of [...tracked]) {
      const state = this.operations.get(key);
      if (state) { state.cancelled = true; state.cleanup?.(); this.operations.delete(key); }
    }
    this.inFlightBySession.delete(sessionId);
  }

  destroy() {
    this.destroyed = true;
    for (const state of this.operations.values()) { state.cancelled = true; state.cleanup?.(); }
    this.operations.clear();
    this.inFlightRequests.clear();
    this.inFlightBySession.clear();
  }

  _hasHeader(headers, targetName) {
    if (!Array.isArray(headers)) return false;
    const lowerTarget = targetName.toLowerCase();
    return headers.some((h) => h && typeof h.name === 'string' && h.name.toLowerCase() === lowerTarget);
  }

  _getHeaderValue(headers, targetName) {
    if (!Array.isArray(headers)) return null;
    const lowerTarget = targetName.toLowerCase();
    const entry = headers.find((h) => h && typeof h.name === 'string' && h.name.toLowerCase() === lowerTarget);
    return entry ? entry.value : null;
  }

  async _sendCommand(connection, method, params = {}, options = {}) {
    if (!connection) throw new Error('No CDP connection available');
    if (typeof connection.command === 'function') {
      return connection.command(method, params, options);
    }
    if (typeof connection.call === 'function') {
      return connection.call(method, params, options);
    }
    if (typeof connection.send === 'function') {
      return connection.send(method, params, options);
    }
    throw new Error('Unsupported connection object (missing command/call/send)');
  }

  _log(type, details) {
    if (this.logger) {
      try { this.logger({ type, ...details }); } catch (_) {}
    }
  }
}

function createCssFontResponseRewriter(options = {}) {
  return new CssFontResponseRewriter(options);
}

module.exports = {
  DEFAULT_BLOCKED_FONT,
  DEFAULT_MAX_BODY_SIZE,
  normalizePersonaFontSet,
  sanitizeCss,
  sanitizeHtml,
  updateCspHeaders,
  CssFontResponseRewriter,
  createCssFontResponseRewriter,
};
