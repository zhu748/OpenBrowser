'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { createProfileEndpointResolver, resolveWebSocketDebuggerUrl } = require('../api/devtools');

async function main() {
  const running = new Map(Array.from({ length: 12 }, (_, id) => [String(id), { port: 9000 + id }]));
  const engine = { running };
  const releases = [];
  let active = 0; let peak = 0; let calls = 0;
  const endpoint = createProfileEndpointResolver(engine, { concurrency: 2, resolve: async (port) => {
    calls += 1; active += 1; peak = Math.max(peak, active);
    await new Promise((resolve) => releases.push(resolve));
    active -= 1;
    return 'ws://127.0.0.1:' + port + '/devtools/browser/real-guid';
  } });
  const rows = [...running].map(([id, item]) => ({ id, port: item.port }));
  const results = rows.map(endpoint);
  assert.strictEqual(endpoint(rows[0]), results[0], 'overlapping queries share in-flight I/O');
  await new Promise(setImmediate);
  assert.equal(calls, 2);
  running.set('0', { port: 9999 }); // Restart during I/O must invalidate the old GUID.
  running.delete('11'); // Deleted queued entries must never issue I/O.
  for (let pass = 0; pass < 12; pass += 1) {
    releases.splice(0).forEach((release) => release());
    await new Promise(setImmediate);
  }
  const resolved = await Promise.all(results);
  assert.equal(peak, 2);
  assert.equal(calls, 11);
  assert.equal(resolved[0], null);
  assert.equal(resolved[11], null);
  assert.match(resolved[1], /real-guid$/);
  assert.equal(await endpoint({ id: 'stopped', port: 9001 }), null);
  assert.equal(await endpoint({ id: 'empty', port: 0 }), null);
  const failed = createProfileEndpointResolver({}, { resolve: async () => { throw new Error('broken'); } });
  await assert.rejects(failed({ id: 'x', port: 1 }), /broken/);
  await assert.rejects(failed({ id: 'x', port: 1 }), /broken/, 'failed queries release their slot');
  const sockets = new Set();
  let peakSockets = 0;
  const slow = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write('{');
    const timer = setInterval(() => res.write(' '), 50);
    res.on('close', () => clearInterval(timer));
  });
  slow.on('connection', (socket) => {
    sockets.add(socket); peakSockets = Math.max(peakSockets, sockets.size);
    socket.on('close', () => sockets.delete(socket));
  });
  await new Promise((resolve) => slow.listen(0, '127.0.0.1', resolve));
  try {
    assert.equal(await resolveWebSocketDebuggerUrl(slow.address().port), null);
    // The client has destroyed its request; allow the peer's close notification
    // to cross the socket before inspecting its connection inventory.
    await new Promise((resolve, reject) => {
      if (!sockets.size) return resolve();
      const timer = setTimeout(() => reject(new Error('CDP peer connection was not closed')), 1000);
      for (const socket of sockets) socket.once('close', () => {
        if (!sockets.size) { clearTimeout(timer); resolve(); }
      });
    });
    assert.equal(peakSockets, 1, 'a retry starts only after the prior transport deadline');
    assert.equal(sockets.size, 0, 'returning null leaves no unbounded HTTP requests behind');
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => slow.close(resolve));
  }
  console.log('API_DEVTOOLS_INVENTORY_SELFTEST OK (concurrency, overlapping requests, restart, deletion and failures)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
