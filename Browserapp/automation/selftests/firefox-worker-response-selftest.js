'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const zlib = require('node:zlib');
const { FirefoxWorkerMitmProxy } = require('../firefox-worker-mitm-proxy');
const { injectWorkerSource } = require('../worker-source');

async function main() {
  const script = 'postMessage("compressed worker");';
  const codecs = { gzip: zlib.gzipSync, deflate: zlib.deflateSync, br: zlib.brotliCompressSync };
  let releaseStream;
  const origin = http.createServer((request, response) => {
    if (request.url === '/upload') {
      const chunks = [];
      request.on('data', (chunk) => chunks.push(chunk));
      request.on('end', () => response.end(Buffer.concat(chunks)));
      return;
    }
    response.setHeader('Content-Type', request.url.startsWith('/html') ? 'text/html' : 'application/javascript');
    response.setHeader('ETag', '"original"');
    if (request.url === '/zero') { response.setHeader('Content-Length', '0'); response.end(); return; }
    if (request.url === '/head') { response.setHeader('Content-Length', '123'); response.end(); return; }
    if (request.url === '/no-content') { response.writeHead(204); response.end(); return; }
    if (request.url === '/not-modified') { response.writeHead(304); response.end(); return; }
    if (request.url === '/conditional') { response.end(JSON.stringify(request.headers)); return; }
    if (request.url === '/created') { response.statusCode = 201; response.end(script); return; }
    if (request.url === '/partial') { response.statusCode = 206; response.end(script); return; }
    if (request.url === '/stream') {
      response.setHeader('Content-Type', 'text/plain');
      response.write('first'); releaseStream = () => response.end('last'); return;
    }
    if (request.url === '/oversize') {
      response.setHeader('Content-Encoding', 'gzip');
      response.end(zlib.gzipSync(Buffer.alloc(17 * 1024 * 1024, 65))); return;
    }
    const encoding = request.url.split('/').pop();
    response.setHeader('Content-Encoding', encoding === 'bad' ? 'gzip' : encoding);
    response.end(encoding === 'bad' ? Buffer.from('not gzip') : codecs[encoding](script));
  });
  const raw = net.createServer((socket) => socket.once('data', (data) => {
    if (data.toString().includes('/truncated')) {
      socket.end('HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\nshort'); return;
    }
    if (data.toString().includes('/chunks')) {
      const body = '/* embedded terminator\r\n0\r\n\r\n*/postMessage(1)';
      socket.write('HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nTransfer-Encoding: chunked\r\nTrailer: X-End\r\n\r\n');
      socket.end(body.length.toString(16) + '\r\n' + body + '\r\n0\r\nX-End: yes\r\n\r\n'); return;
    }
    socket.end('HTTP/1.1 200 OK\r\nContent-Type: application/javascript\r\nConnection: close\r\n\r\n' + script);
  }));
  origin.on('upgrade', (request, socket, head) => {
    socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: test-echo\r\n\r\n');
    if (head.length) socket.write(head);
    socket.pipe(socket);
  });
  const proxy = new FirefoxWorkerMitmProxy({ ca: {}, workerSource: '/* persona */', allowedUpstreamHosts: ['127.0.0.1'] });
  await new Promise((resolve) => origin.listen(0, '127.0.0.1', resolve));
  await new Promise((resolve) => raw.listen(0, '127.0.0.1', resolve));
  await proxy.start();
  const fetch = (path, { worker = true, port = origin.address().port, method = 'GET', headers = {}, body } = {}) => new Promise((resolve, reject) => {
    const request = http.request({ host: '127.0.0.1', port: proxy.port, method,
      path: `http://127.0.0.1:${port}${path}`, headers: { ...headers, 'sec-fetch-dest': worker ? 'worker' : 'document' },
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    request.on('error', reject);
    request.setTimeout(3000, () => request.destroy(new Error('Response timed out')));
    if (body) for (const part of body) request.write(part);
    request.end();
  });
  try {
    for (const encoding of Object.keys(codecs)) {
      const worker = await fetch('/' + encoding);
      assert.equal(worker.status, 200);
      assert.equal(worker.body.toString(), injectWorkerSource(script, '/* persona */').toString());
      assert.equal(worker.headers['content-encoding'], undefined);
      assert.equal(worker.headers.etag, undefined);
      assert.equal(worker.headers['cache-control'], 'no-store');
      assert.equal(Number(worker.headers['content-length']), worker.body.length);
      const html = await fetch('/html/' + encoding, { worker: false });
      assert.equal(html.headers['content-encoding'], encoding);
      assert.deepEqual(html.body, codecs[encoding](script));
    }
    assert.equal((await fetch('/close', { port: raw.address().port })).body.toString(), injectWorkerSource(script, '/* persona */').toString());
    assert.match((await fetch('/chunks', { port: raw.address().port })).body.toString(), /postMessage\(1\)$/);
    assert.equal((await fetch('/zero')).body.toString(), injectWorkerSource('', '/* persona */').toString());
    assert.equal((await fetch('/head', { method: 'HEAD' })).body.length, 0);
    assert.equal((await fetch('/no-content')).status, 204);
    assert.equal((await fetch('/not-modified')).status, 304);
    assert.equal((await fetch('/bad')).status, 502);
    assert.ok((await fetch('/created')).body.toString().includes('/* persona */'));
    assert.equal((await fetch('/partial')).status, 502);
    assert.equal((await fetch('/partial', { worker: false })).status, 206);
    assert.equal((await fetch('/oversize')).status, 502);
    const conditional = await fetch('/conditional', { headers: { 'if-none-match': '"old"', range: 'bytes=1-4' } });
    const sent = JSON.parse(conditional.body.toString().replace(injectWorkerSource('', '/* persona */').toString(), ''));
    assert.equal(sent['if-none-match'], undefined); assert.equal(sent.range, undefined);
    const upload = await fetch('/upload', { method: 'POST', worker: false, body: ['chunk one', 'chunk two'] });
    assert.equal(upload.body.toString(), 'chunk onechunk two');
    await assert.rejects(fetch('/truncated', { port: raw.address().port, worker: false }));
    await new Promise((resolve, reject) => {
      const req = http.get({ host: '127.0.0.1', port: proxy.port,
        path: `http://127.0.0.1:${origin.address().port}/stream` }, (res) => {
        res.once('data', (chunk) => { assert.equal(chunk.toString(), 'first'); releaseStream(); });
        res.on('error', reject); res.on('end', resolve);
      });
      req.on('error', reject); req.setTimeout(3000, () => req.destroy(new Error('Stream was buffered')));
    });
    await new Promise((resolve, reject) => {
      const request = http.request({ host: '127.0.0.1', port: proxy.port,
        path: `http://127.0.0.1:${origin.address().port}/upgrade`, headers: { connection: 'Upgrade', upgrade: 'test-echo' } });
      request.on('error', reject);
      request.setTimeout(3000, () => request.destroy(new Error('Upgrade timed out')));
      request.once('upgrade', (response, socket) => {
        assert.equal(response.statusCode, 101);
        socket.write('echo payload');
        socket.once('data', (chunk) => { assert.equal(chunk.toString(), 'echo payload'); socket.destroy(); resolve(); });
        socket.on('error', reject);
      });
      request.end();
    });
    const upstreamRequests = [];
    const bridge = http.createServer((request, response) => {
      upstreamRequests.push(request.url);
      response.setHeader('Content-Type', 'application/javascript'); response.end(script);
    });
    await new Promise((resolve) => bridge.listen(0, '127.0.0.1', resolve));
    const chained = new FirefoxWorkerMitmProxy({ ca: {}, workerSource: '/* chained */',
      upstreamProxy: { host: '127.0.0.1', port: bridge.address().port } });
    try {
      await chained.start();
      const value = await new Promise((resolve, reject) => {
        const request = http.get({ host: '127.0.0.1', port: chained.port,
          path: 'http://only-upstream.invalid/worker.js', headers: { 'sec-fetch-dest': 'worker' } }, (response) => {
          let body = ''; response.on('data', (chunk) => { body += chunk; }); response.on('end', () => resolve(body));
        });
        request.on('error', reject); request.setTimeout(3000, () => request.destroy(new Error('Upstream was bypassed')));
      });
      assert.equal(value, injectWorkerSource(script, '/* chained */').toString());
      assert.deepEqual(upstreamRequests, ['http://only-upstream.invalid/worker.js']);
    } finally { await chained.close(); await new Promise((resolve) => bridge.close(resolve)); }
    console.log('PASS Firefox response framing, gzip/deflate/br, native pass-through, bounded rewriting, uploads and streaming');
  } finally {
    releaseStream?.();
    await proxy.close(); await proxy.close();
    assert.equal(proxy.sockets.size, 0);
    await Promise.all([origin, raw].map((server) => new Promise((resolve) => server.close(resolve))));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
