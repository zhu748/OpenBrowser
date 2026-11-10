'use strict';

const { requestBuffer } = require('../../network/http-request');
const { MAX_REMOTE_RESPONSE_BYTES } = require('./limits');

// Keep the cloud provider response contract; shared HTTP code owns the actual
// response limit, total deadline and cleanup. Provider redirects remain manual.
async function request(url, options = {}, body) {
  if (body && body.length > MAX_REMOTE_RESPONSE_BYTES * 2) throw new Error('上传内容超过安全限制');
  const result = await requestBuffer(url, {
    method: options.method || 'GET', headers: options.headers || {}, body,
    timeoutMs: options.timeout ?? 60000,
    maxBytes: options.maxBytes ?? MAX_REMOTE_RESPONSE_BYTES,
    timeoutMessage: 'request timeout', tooLargeMessage: '远程响应超过安全限制',
  });
  return { status: result.status, headers: result.headers, body: result.buffer };
}

module.exports = { request };
