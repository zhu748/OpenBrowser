'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { FirefoxWorkerMitmProxy } = require('../firefox-worker-mitm-proxy');

async function bounded(operation) {
  let timer;
  try { return await Promise.race([operation, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Connection cleanup timed out')), 2500);
  })]); } finally { clearTimeout(timer); }
}
async function main() {
  let seen, closed;
  const received = new Promise((resolve) => { seen = resolve; });
  const disconnected = new Promise((resolve) => { closed = resolve; });
  const bridge = net.createServer((socket) => { socket.once('data', seen); socket.once('close', closed); });
  await new Promise((resolve) => bridge.listen(0, '127.0.0.1', resolve));
  const proxy = new FirefoxWorkerMitmProxy({ ca: {}, upstreamProxy: { host: '127.0.0.1', port: bridge.address().port } });
  await proxy.start();
  try {
    const request = http.get({ host: '127.0.0.1', port: proxy.port, path: 'https://pending.invalid/worker.js' });
    request.on('error', () => {});
    assert.match((await bounded(received)).toString(), /^CONNECT pending.invalid:443/);
    request.destroy();
    await bounded(disconnected);
    console.log('PASS client cancellation closes an upstream CONNECT still awaiting headers');
  } finally { await proxy.close(); await new Promise((resolve) => bridge.close(resolve)); }

  let originRequests = 0;
  const origin = http.createServer((_request, response) => { originRequests++; response.end('private data'); });
  await new Promise((resolve) => origin.listen(0, '127.0.0.1', resolve));
  const guarded = new FirefoxWorkerMitmProxy({ ca: {}, lookup: (_host, _options, done) => {
    done(null, [{ address: '127.0.0.1', family: 4 }]);
  } });
  await guarded.start();
  try {
    const status = await bounded(new Promise((resolve, reject) => {
      const request = http.get({ host: '127.0.0.1', port: guarded.port,
        path: `http://public-name.invalid:${origin.address().port}/` }, (response) => {
        response.resume(); response.on('end', () => resolve(response.statusCode));
      });
      request.on('error', reject);
    }));
    assert.equal(status, 502);
    await assert.rejects(guarded.openTunnel('public-name.invalid', origin.address().port), { code: 'OUTBOUND_ADDRESS_BLOCKED' });
    assert.equal(originRequests, 0, 'socket cannot connect to a rejected DNS answer');
    console.log('PASS actual HTTP/TLS connection lookups enforce the existing private-address policy');
  } finally { await guarded.close(); await new Promise((resolve) => origin.close(resolve)); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
