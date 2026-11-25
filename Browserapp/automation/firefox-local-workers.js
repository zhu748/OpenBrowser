'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { writeRawAtomically } = require('../engine/state-storage');
const { buildZip } = require('./zip-writer');
const { isJavaScriptMime, JAVASCRIPT_MIMES, MAX_WORKER_BYTES } = require('./worker-source');
const { workerInjectionPosition } = require('./worker-source-position');

const EXTENSION_ID = 'local-workers@openbrowser.local';
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1'];
const LOOPBACK_URLS = LOOPBACK_HOSTS.flatMap(host => ['http', 'https'].map(scheme =>
  scheme + '://' + (host.includes(':') ? '[' + host + ']' : host) + '/*'));

// Serialized into the extension background page. Gecko's StreamFilter supplies
// decoded bytes, even when the HTTP response uses gzip or Brotli.
function workerResponseListener(webRequest, urls, source, syntax, insertAt, isJavaScript, maxWorkerBytes) {
  const workerRequests = new Set();
  const workerDestinations = new Set(['worker', 'sharedworker', 'serviceworker']);
  const staleHeaders = new Set(['cache-control', 'content-length', 'content-md5', 'etag', 'digest', 'content-digest', 'repr-digest']);
  const requestFilter = { urls, types: ['script'] };
  const maxActive = 64;
  const maxBuffered = 2 * maxWorkerBytes;
  let active = 0;
  let buffered = 0;

  const header = (headers = [], name) => headers.find(entry => entry.name.toLowerCase() === name)?.value;
  const forget = ({ requestId }) => { workerRequests.delete(requestId); };
  webRequest.onCompleted.addListener(forget, requestFilter);
  webRequest.onErrorOccurred.addListener(forget, requestFilter);
  webRequest.onBeforeRedirect.addListener(forget, requestFilter);
  webRequest.onBeforeSendHeaders.addListener(({ requestId, method, requestHeaders }) => {
    if (method !== 'HEAD' && workerDestinations.has(header(requestHeaders, 'sec-fetch-dest'))) {
      workerRequests.add(requestId);
    }
  }, requestFilter, ['requestHeaders']);

  webRequest.onHeadersReceived.addListener(details => {
    const { requestId, statusCode, responseHeaders } = details;
    if (!workerRequests.has(requestId) || statusCode < 200 || statusCode >= 300
      || statusCode === 204 || statusCode === 205 || !isJavaScript(header(responseHeaders, 'content-type'))) return;
    const contentLength = Number(header(responseHeaders, 'content-length'));
    if (statusCode === 206 || header(responseHeaders, 'content-range')
      || contentLength > maxWorkerBytes || active >= maxActive) return { cancel: true };

    let filter;
    try { filter = webRequest.filterResponseData(requestId); }
    catch (_) { return { cancel: true }; }
    active++;
    let bytes = 0;
    let closed = false;
    const chunks = [];
    function finish(close) {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      buffered -= bytes;
      active--;
      chunks.length = 0;
      if (close) filter.close();
    }
    const timer = setTimeout(() => finish(true), 30000);
    filter.ondata = ({ data }) => {
      if (closed) return;
      if (bytes + data.byteLength > maxWorkerBytes || buffered + data.byteLength > maxBuffered) {
        finish(true);
        return;
      }
      bytes += data.byteLength;
      buffered += data.byteLength;
      chunks.push(data);
    };
    filter.onstop = () => {
      if (closed) return;
      try {
        const decoder = new TextDecoder('utf-8', { ignoreBOM: true });
        const text = chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('') + decoder.decode();
        const bom = text.charCodeAt(0) === 0xfeff ? 1 : 0;
        const position = bom + insertAt(text.slice(bom), syntax);
        filter.write(new TextEncoder().encode(text.slice(0, position) + '\n;' + source + '\n;' + text.slice(position)));
      } finally { finish(true); }
    };
    filter.onerror = () => finish(false);

    return { responseHeaders: [
      ...responseHeaders.filter(entry => !staleHeaders.has(entry.name.toLowerCase())),
      { name: 'Cache-Control', value: 'no-store' },
    ] };
  }, requestFilter, ['blocking', 'responseHeaders']);
}

async function installFirefoxWorkerFilter(connection, root, workerSource, { allHttpOrigins = false } = {}) {
  const urls = allHttpOrigins ? ['http://*/*', 'https://*/*'] : LOOPBACK_URLS;
  const acorn = await fs.readFile(path.join(__dirname, 'vendor', 'acorn-runtime.js'), 'utf8');
  const filter = `'use strict';
const JAVASCRIPT_MIMES = new Set(${JSON.stringify([...JAVASCRIPT_MIMES])});
(${workerResponseListener})(browser.webRequest, ${JSON.stringify(urls)}, ${JSON.stringify(workerSource)},
  globalThis.acorn, ${workerInjectionPosition}, ${isJavaScriptMime}, ${MAX_WORKER_BYTES});
`;
  const manifest = {
    manifest_version: 2,
    name: 'OpenBrowser Worker delivery',
    version: '1.0',
    browser_specific_settings: { gecko: { id: EXTENSION_ID } },
    permissions: ['webRequest', 'webRequestBlocking', 'webRequestFilterResponse',
      'webRequestFilterResponse.serviceWorkerScript', ...urls],
    background: { scripts: ['acorn.js', 'worker-filter.js'] },
  };
  const extensionPath = path.join(root, 'OpenBrowserLocalWorkers.xpi');
  await writeRawAtomically(extensionPath, buildZip([
    { name: 'manifest.json', data: JSON.stringify(manifest) },
    { name: 'acorn.js', data: acorn },
    { name: 'worker-filter.js', data: filter },
  ]));
  const result = await connection.command('webExtension.install', { extensionData: { type: 'path', path: extensionPath } });
  if (result.extension !== EXTENSION_ID) throw Error('Firefox Worker 过滤器身份不匹配');
}

module.exports = { installFirefoxWorkerFilter, LOOPBACK_HOSTS };
