'use strict';
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

async function main() {
  let sequence = 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/truncated' || req.url === '/' && sequence++ === 0) {
      res.writeHead(200, { 'Content-Length': '1000' }); res.write('{'); setTimeout(() => res.destroy(), 10);
    } else if (req.url === '/drip') {
      res.writeHead(200); res.write('{');
      const timer = setInterval(() => res.write(' '), 10);
      res.on('close', () => clearInterval(timer));
    } else if (req.url === '/large') { res.writeHead(200, { 'Content-Length': String(40 * 1024 * 1024) }); res.end(); }
    else res.end('{"code":0,"data":{}}');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const oldPort = process.env.OPENBROWSER_API_PORT, oldKey = process.env.OPENBROWSER_API_KEY;
  process.env.OPENBROWSER_API_PORT = String(server.address().port);
  process.env.OPENBROWSER_API_KEY = 'synthetic-mcp-key-for-testing';
  try {
    const { request } = require('../mcp-server');
    await assert.rejects(request('GET', '/truncated'), { code: 'ECONNRESET' });
    await assert.rejects(request('GET', '/drip', undefined, { timeout: 60 }), { code: 'ETIMEDOUT' });
    await assert.rejects(request('GET', '/large'), { code: 'ERESPONSETOOLARGE' });
    const controller = new AbortController();
    const pending = request('GET', '/drip', undefined, { signal: controller.signal }); controller.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    const child = spawn(process.execPath, [path.join(__dirname, '../mcp-server.js')], { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', errors = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { errors += chunk; });
    child.stdin.end([1, 2].map((id) => JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'status', arguments: {} } })).join('\n') + '\n');
    const watchdog = setTimeout(() => child.kill(), 5000);
    const code = await new Promise((resolve) => child.once('close', resolve)); clearTimeout(watchdog);
    assert.equal(code, 0, errors);
    const replies = output.trim().split('\n').map((line) => JSON.parse(line));
    assert.ok(replies[0].error, 'truncated response rejects the first tool');
    assert.equal(replies[1].id, 2); assert.ok(replies[1].result, 'the next queued tool still completes');
    console.log('MCP_TRANSPORT_BOUNDARIES_SELFTEST OK (truncation, absolute deadline, bytes, abort, queue recovery)');
  } finally {
    for (const [key, value] of [['OPENBROWSER_API_PORT', oldPort], ['OPENBROWSER_API_KEY', oldKey]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    server.closeAllConnections(); await new Promise((resolve) => server.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
