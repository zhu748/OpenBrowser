'use strict';

const http = require('node:http');
const https = require('node:https');

/** Bounded Node HTTP response reading, with one deadline for the redirect chain. */
function requestBuffer(url, {
  method = 'GET', headers = {}, body = null, timeoutMs = 15000, maxBytes,
  lookup, validateUrl = (value) => new URL(value), validateStatus,
  followRedirects = false, maxRedirects = 3, signal,
  environmentProxy = false,
  timeoutMessage = 'HTTP request timed out', tooLargeMessage = 'Response body exceeds size limit',
  redirectMessage = 'Too many HTTP redirects',
} = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) return Promise.reject(new RangeError('maxBytes must be a positive integer'));
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) return Promise.reject(new RangeError('timeoutMs must be non-negative'));
  if (!Number.isSafeInteger(maxRedirects) || maxRedirects < 0) return Promise.reject(new RangeError('maxRedirects must be non-negative'));
  if (signal != null && (typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) return Promise.reject(new TypeError('signal must be an AbortSignal'));
  return new Promise((resolve, reject) => {
    let settled = false; let activeRequest; let activeResponse; let timer;
    const timeout = () => Object.assign(new Error(timeoutMessage), { code: 'ETIMEDOUT' });
    const interrupted = () => Object.assign(new Error('HTTP response ended before completion'), { code: 'ECONNRESET' });
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      const request = activeRequest; const response = activeResponse;
      activeRequest = activeResponse = null;
      if (error) {
        reject(error);
        response?.destroy();
        request?.destroy(error);
      } else resolve(result);
    };
    const abort = () => finish(Object.assign(new Error('HTTP request aborted'), { name: 'AbortError', code: 'ABORT_ERR' }));

    const start = (value, remaining, outgoingHeaders) => {
      if (settled) return;
      let request; let superseded = false; let receivedResponse = false;
      const fail = (error) => { if (!superseded) finish(error); };
      try {
        const target = validateUrl(value);
        if (!(target instanceof URL) || !['http:', 'https:'].includes(target.protocol)) throw new Error('Only HTTP/HTTPS URLs are supported');
        const transport = target.protocol === 'https:' ? https : http;
        const agent=environmentProxy?require('./environment-agent').environmentAgent(target):undefined;
        request = transport.request(target.toString(), { method, headers: outgoingHeaders, timeout: timeoutMs, lookup,agent }, (response) => {
          if (settled || superseded) { response.on('error', () => {}); response.destroy(); return; }
          receivedResponse = true;
          activeResponse = response;
          let ended = false;
          response.on('error', fail);
          response.on('aborted', () => fail(interrupted()));
          response.on('close', () => { if (!ended) fail(interrupted()); });
          try {
            const status = response.statusCode || 0;
            if (followRedirects && status >= 300 && status < 400 && response.headers.location) {
              if (remaining === 0) throw Object.assign(new Error(redirectMessage), { code: 'ETOOMANYREDIRECTS' });
              const next = new URL(String(response.headers.location), target);
              const nextHeaders = { ...outgoingHeaders };
              if (next.origin !== target.origin) {
                for (const key of Object.keys(nextHeaders)) {
                  if (['authorization', 'proxy-authorization', 'cookie', 'cookie2', 'host'].includes(key.toLowerCase())) delete nextHeaders[key];
                }
              }
              superseded = true;
              response.destroy();
              request?.destroy();
              activeRequest = activeResponse = null;
              start(next.toString(), remaining - 1, nextHeaders);
              return;
            }
            validateStatus?.(status, target);
            const tooLarge = () => Object.assign(new Error(tooLargeMessage), { code: 'ERESPONSETOOLARGE' });
            if (Number(response.headers['content-length']) > maxBytes) throw tooLarge();
            const chunks = []; let received = 0;
            response.on('data', (value) => {
              if (settled || superseded) return;
              const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
              received += chunk.length;
              if (received > maxBytes) { fail(tooLarge()); return; }
              chunks.push(chunk);
            });
            response.on('end', () => {
              ended = true;
              if (settled || superseded) return;
              if (response.complete === false) { fail(interrupted()); return; }
              finish(null, {
                status, headers: response.headers, url: target.toString(),
                buffer: chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, received),
              });
            });
          } catch (error) { fail(error); }
        });
        activeRequest = request;
        request.on('error', fail);
        request.on('timeout', () => fail(timeout()));
        request.on('close', () => { if (!receivedResponse) fail(interrupted()); });
        if (settled) { request.destroy(); return; }
        if (body === null || body === undefined) request.end();
        else request.end(body);
      } catch (error) { fail(error); }
    };

    if (timeoutMs > 0) timer = setTimeout(() => finish(timeout()), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    start(url, maxRedirects, { ...headers });
  });
}

module.exports = { requestBuffer };
