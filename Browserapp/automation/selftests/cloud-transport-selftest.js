'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { request } = require('../cloud/transport');

async function main() {
  const timers = new Set();
  const server = http.createServer((req, res) => {
    if (req.url === '/drip') {
      res.writeHead(200);
      res.write('x');
      const timer = setInterval(() => res.write('x'), 5);
      timers.add(timer);
      res.on('close', () => { clearInterval(timer); timers.delete(timer); });
    } else if (req.url === '/broken') {
      res.writeHead(200, { 'Content-Length': '100' });
      res.write('partial');
      setImmediate(() => res.destroy());
    } else if (req.url === '/redirect') {
      res.writeHead(302, { Location: '/normal' }); res.end();
    } else { res.writeHead(200); res.end('test'); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const result = await request(base + '/normal', { maxBytes: 4 });
    assert.equal(result.body.toString(), 'test');
    assert.equal(result.status, 200);
    await assert.rejects(request(base + '/normal', { maxBytes: 3 }), { code: 'ERESPONSETOOLARGE' });
    await assert.rejects(request(base + '/broken'), { code: 'ECONNRESET' });
    // Continually receiving bytes must not postpone the absolute deadline.
    await assert.rejects(request(base + '/drip', { timeout: 40 }), { code: 'ETIMEDOUT' });
    assert.equal((await request(base + '/redirect')).status, 302, 'providers retain manual redirect handling');
    console.log('CLOUD_TRANSPORT_SELFTEST OK (limits, truncated replies, drip deadline, redirect policy)');
  } finally {
    for (const timer of timers) clearInterval(timer);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
