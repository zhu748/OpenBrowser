'use strict';

const { requestBuffer } = require('../../network/http-request');
const { MAX_REMOTE_RESPONSE_BYTES } = require('./limits');

// Keep the cloud provider response contract; shared HTTP code owns the actual
// response limit, total deadline and cleanup. Provider redirects remain manual.
async function requestOnce(url, options = {}, body) {
  if (body && body.length > MAX_REMOTE_RESPONSE_BYTES * 2) throw new Error('上传内容超过安全限制');
  const result = await requestBuffer(url, {
    method: options.method || 'GET', headers: options.headers || {}, body,
    timeoutMs: options.timeout ?? 60000,
    maxBytes: options.maxBytes ?? MAX_REMOTE_RESPONSE_BYTES,
    timeoutMessage: 'request timeout', tooLargeMessage: '远程响应超过安全限制',
  });
  return { status: result.status, headers: result.headers, body: result.buffer };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// C-9: cloud transports had zero retry — one transient network hiccup
// (ECONNRESET, ETIMEDOUT, a provider 5xx) failed a whole backup push or
// restore. Idempotent methods (GET/HEAD/PUT/DELETE/MKCOL, and MOVE whose
// source is the unique .partial-<rand> name) are retried twice with
// exponential backoff. Definitive 4xx rejections pass through untouched;
// options.retries disables.
async function request(url, options = {}, body) {
  const retries = options.retries === undefined ? 2 : Number(options.retries);
  const method = String(options.method || 'GET').toUpperCase();
  const idempotent = ['GET', 'HEAD', 'PUT', 'DELETE', 'MKCOL', 'MOVE'].includes(method);
  if (retries <= 0 || !idempotent) return requestOnce(url, options, body);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) await sleep(500 * Math.pow(2, attempt - 1));
    try {
      const res = await requestOnce(url, options, body);
      // A definitive provider rejection will not heal on retry.
      if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) return res;
      // 5xx / 408 / 429 are worth another round when attempts remain.
      if (res.status >= 500 || res.status === 408 || res.status === 429) {
        lastError = new Error(`远程服务暂时不可用 (HTTP ${res.status})`);
        continue;
      }
      return res;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('远程请求失败');
}

module.exports = { request };
