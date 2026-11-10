'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const cdp = require('../../cdp');

async function main() {
  let closed = false;
  let onClosed;
  const socketClosed = new Promise((resolve) => { onClosed = resolve; });
  const server = http.createServer((req, res) => {
    if (req.url === '/drip') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.write('[');
      const drip = setInterval(() => res.write(' '), 5);
      // Bound the failing baseline case too: peer closure must not substitute
      // for the transport's own deadline in the assertion below.
      const fallback = setTimeout(() => res.destroy(), 300);
      res.on('close', () => { closed = true; clearInterval(drip); clearTimeout(fallback); onClosed(); });
    } else if (req.url === '/missing') {
      res.writeHead(404); res.end('missing');
    } else {
      res.end(JSON.stringify([{ id: 'tab', type: 'page', webSocketDebuggerUrl: 'ws://example.test/tab' }]));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    await assert.rejects(cdp.json(`http://127.0.0.1:${port}/drip`, 'GET', { timeoutMs: 40 }), /CDP HTTP timeout/,
      'continuous partial data must not defeat the absolute request deadline');
    await socketClosed;
    assert.equal(closed, true, 'deadline destroys the transport instead of only releasing a scheduler slot');
    assert.equal((await cdp.tabs(port, { timeoutMs: 1000 }))[0].id, 'tab');
    await assert.rejects(cdp.json(`http://127.0.0.1:${port}/missing`), /CDP HTTP 404/);
    console.log('CDP_HTTP_DEADLINE_SELFTEST OK (drip body deadline, socket closure, success, HTTP error)');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
