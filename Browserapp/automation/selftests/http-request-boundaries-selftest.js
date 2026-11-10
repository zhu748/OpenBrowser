'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { getEventListeners } = require('node:events');
const { requestBuffer } = require('../../network/http-request');
const { fetchUrlText } = require('../../network/outbound');
const { createKernelMetadataClient } = require('../kernel/metadata');

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
const close = (server) => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); });

async function main() {
  let requests = 0; let dripEnded = false;
  const destination = http.createServer((req, res) => res.end(JSON.stringify(req.headers)));
  const other = await listen(destination);
  const server = http.createServer((req, res) => {
    requests += 1;
    if (req.url === '/utf8') { res.end('中中'); return; }
    if (req.url === '/json') { res.end('{"ok":true}'); return; }
    if (req.url === '/large') { res.writeHead(200, { 'Content-Length': '999999' }); res.flushHeaders(); return; }
    if (req.url === '/partial') {
      res.writeHead(200, { 'Content-Length': '100' }); res.write('short');
      setImmediate(() => res.destroy()); return;
    }
    if (req.url === '/drip') {
      res.writeHead(200); res.flushHeaders();
      let count = 0;
      const timer = setInterval(() => {
        res.write('x');
        if (++count === 40) { dripEnded = true; clearInterval(timer); res.end(); }
      }, 10);
      res.on('close', () => clearInterval(timer)); return;
    }
    if (req.url === '/redirect-drip') { res.writeHead(302, { Location: '/drip' }); res.flushHeaders(); return; }
    if (req.url === '/loop') { res.writeHead(302, { Location: '/loop' }); res.end(); return; }
    if (req.url === '/cross') { res.writeHead(302, { Location: other + '/echo' }); res.end(); return; }
    if (req.url === '/same') { res.writeHead(302, { Location: '/echo' }); res.end(); return; }
    res.end(JSON.stringify(req.headers));
  });
  const base = await listen(server);
  const options = { maxBytes: 1024, timeoutMs: 1000 };
  try {
    assert.equal((await requestBuffer(base + '/utf8', { ...options, maxBytes: 6 })).buffer.length, 6);
    await assert.rejects(requestBuffer(base + '/utf8', { ...options, maxBytes: 5 }), (error) => error.code === 'ERESPONSETOOLARGE');
    await assert.rejects(requestBuffer(base + '/large', options), (error) => error.code === 'ERESPONSETOOLARGE');
    await assert.rejects(requestBuffer(base + '/partial', options), (error) => error.code === 'ECONNRESET');
    await assert.rejects(requestBuffer(base + '/redirect-drip', { ...options, timeoutMs: 70, followRedirects: true }), (error) => error.code === 'ETIMEDOUT');
    assert.equal(dripEnded, false, 'periodic incoming data cannot postpone the absolute deadline');
    await assert.rejects(requestBuffer(base + '/loop', { ...options, followRedirects: true, maxRedirects: 1 }), (error) => error.code === 'ETOOMANYREDIRECTS');
    let vetted = 0;
    await assert.rejects(requestBuffer(base + '/cross', { ...options, followRedirects: true, validateUrl(url) {
      vetted += 1; const parsed = new URL(url); if (parsed.origin !== base) throw new Error('blocked redirect'); return parsed;
    } }), /blocked redirect/);
    assert.equal(vetted, 2, 'every redirect target is validated');
    const headers = { Authorization: 'private', Cookie: 'session=private', 'X-Custom': 'kept' };
    const same = await requestBuffer(base + '/same', { ...options, headers, followRedirects: true });
    assert.equal(JSON.parse(same.buffer).authorization, 'private');
    const cross = await requestBuffer(base + '/cross', { ...options, headers, followRedirects: true });
    assert.equal(JSON.parse(cross.buffer).authorization, undefined);
    assert.equal(JSON.parse(cross.buffer).cookie, undefined);
    assert.equal(JSON.parse(cross.buffer)['x-custom'], 'kept');

    const controller = new AbortController(); controller.abort();
    const before = requests;
    await assert.rejects(requestBuffer(base + '/json', { ...options, signal: controller.signal }), (error) => error.code === 'ABORT_ERR');
    assert.equal(requests, before, 'an already cancelled request never opens a connection');
    const active = new AbortController();
    const pending = requestBuffer(base + '/drip', { ...options, signal: active.signal });
    setTimeout(() => active.abort(), 15);
    await assert.rejects(pending, (error) => error.code === 'ABORT_ERR');
    assert.equal(getEventListeners(active.signal, 'abort').length, 0, 'cancelled requests release their abort listener');
    const completed = new AbortController();
    await requestBuffer(base + '/json', { ...options, signal: completed.signal });
    assert.equal(getEventListeners(completed.signal, 'abort').length, 0, 'successful requests release their abort listener');

    const metadata = createKernelMetadataClient({ validateUrl: (url) => new URL(url), maxRedirects: 3, maxBytes: 1024 });
    await assert.rejects(metadata.fetchText(base + '/utf8', { maxBytes: 5 }), (error) => error.code === 'ERESPONSETOOLARGE');
    assert.deepEqual(await metadata.fetchJson(base + '/json'), { ok: true });
    await assert.rejects(fetchUrlText(base + '/partial', { allowPrivate: true, timeout: 1000 }), (error) => error.code === 'ECONNRESET');
    await assert.rejects(requestBuffer(base + '/json', { maxBytes: NaN }), RangeError);
    await assert.rejects(requestBuffer(base + '/json', { ...options, signal: {} }), TypeError);
    console.log('HTTP_REQUEST_BOUNDARIES_SELFTEST OK (real HTTP, byte limits, truncation, deadline, redirects, credentials, cancellation, metadata)');
  } finally { await Promise.all([close(server), close(destination)]); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
