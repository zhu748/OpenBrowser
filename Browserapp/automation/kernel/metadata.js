'use strict';

const { requestBuffer } = require('../../network/http-request');

/** Trusted metadata transport, independent of kernel discovery and installation. */
function createKernelMetadataClient({ validateUrl, maxRedirects, maxBytes: defaultMaxBytes }) {
  function fetchDocument(url, { maxBytes, timeoutMs, redirects, kind }) {
    if (redirects > maxRedirects) return Promise.reject(new Error(`Kernel ${kind} redirected too many times`));
    const parsed = validateUrl(url);
    return requestBuffer(parsed.toString(), {
      validateUrl, maxBytes, timeoutMs,
      headers: { 'User-Agent': 'OpenBrowser/1.0 (kernel)' },
      followRedirects: true, maxRedirects: maxRedirects - redirects,
      validateStatus: (status, target) => { if (status !== 200) throw new Error('HTTP ' + status + ' for ' + target); },
      timeoutMessage: `Kernel ${kind} request timed out`,
      tooLargeMessage: `Kernel ${kind} exceeds ${maxBytes} bytes`,
      redirectMessage: `Kernel ${kind} redirected too many times`,
    });
  }
  return {
    fetchJson(url, redirects = 0, maxBytes = defaultMaxBytes) {
      return fetchDocument(url, { maxBytes, timeoutMs: 30000, redirects, kind: 'metadata' })
        .then(({ buffer }) => JSON.parse(buffer.toString('utf8')));
    },
    fetchText(url, { maxBytes = defaultMaxBytes, timeoutMs = 30000, redirects = 0 } = {}) {
      return fetchDocument(url, { maxBytes, timeoutMs, redirects, kind: 'text document' })
        .then(({ buffer }) => buffer.toString('utf8'));
    },
  };
}

module.exports = { createKernelMetadataClient };
