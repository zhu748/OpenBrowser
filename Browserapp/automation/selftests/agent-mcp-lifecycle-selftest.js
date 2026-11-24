'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { AgentService } = require('../../rebuild/agent-service');
const { ConnectionPool } = require('../../rebuild/agent-mcp-pool');
const { AgentMcp, Connection } = require('../../rebuild/agent-mcp');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, timeout = 5000) {
  const end = Date.now() + timeout;
  while (!predicate()) { if (Date.now() > end) throw Error('MCP fixture did not reach expected state'); await delay(10); }
}

async function fixture() {
  const state = { calls: 0, initialized: [], active: 0, peak: 0, closed: new Set(), pings: 0, cancellations: 0, releases: new Map(), delayMs: 0 };
  const server = http.createServer(async (req, res) => {
    res.on('close', () => state.closed.add(req.url));
    if (req.method === 'DELETE') { res.writeHead(204); res.end(); return; }
    let text = ''; for await (const chunk of req) text += chunk;
    const message = JSON.parse(text);
    if (message.id !== undefined && message.method === undefined) {
      state.pings++; if (req.url !== '/pingstorm') { res.writeHead(202); res.end(); } return;
    }
    if (message.method.startsWith('notifications/')) {
      if (req.url === '/drip' && message.method === 'notifications/cancelled') {
        await delay(250);
        if (res.destroyed) return;
        state.cancellations++;
      }
      res.writeHead(202); res.end(); return;
    }
    const result = value => { if (!res.destroyed) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: value })); } };
    if (req.url === '/wrong') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id + 1, result: {} })); return; }
    if (req.url === '/case') { res.writeHead(200, { 'content-type': 'Application/JSON' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { ok: true } })); return; }
    if (req.url === '/empty') { res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(': keepalive\n\n'); return; }
    if (req.url === '/error' || req.url === '/type') { res.writeHead(req.url === '/error' ? 503 : 200, { 'content-type': 'text/html' }); res.write('not a model response'); return; }
    if (req.url === '/drip') {
      res.writeHead(200, { 'content-type': 'text/event-stream' }); res.write(': wait\n\n');
      const timer = setInterval(() => res.write(': wait\n\n'), 10); res.on('close', () => clearInterval(timer)); return;
    }
    if (req.url === '/pingstorm') {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(Array.from({ length: 33 }, (_, i) => 'data: ' + JSON.stringify({ jsonrpc: '2.0', id: 1000 + i, method: 'ping' }) + '\n\n').join('')); return;
    }
    if (req.url === '/sse') {
      res.writeHead(200, { 'content-type': 'TEXT/EVENT-STREAM' });
      res.write('data: ' + JSON.stringify({ jsonrpc: '2.0', id: 999, method: 'ping' }) + '\r\n\r\n');
      res.write('data: {"jsonrpc":"2.0",\r\ndata: "id":' + message.id + ',"result":{"text":"汉🙂"}}\r');
      setTimeout(() => { if (!res.destroyed) res.write('\n\r\n'); }, 5); return;
    }
    if (message.method === 'initialize') {
      state.initialized.push(req.url); state.active++; state.peak = Math.max(state.peak, state.active);
      let finished = false;
      const finish = () => { if (!finished) { finished = true; state.active--; } };
      res.on('close', finish);
      const send = () => { finish(); result({ protocolVersion: '2024-11-05', capabilities: { tools: {} } }); };
      if (req.url.startsWith('/blocked')) state.releases.set(req.url, send);
      else if (state.delayMs) setTimeout(send, state.delayMs); else send();
    } else if (message.method === 'tools/list') {
      const count = req.url.startsWith('/many') ? 101 : 1;
      result({ tools: Array.from({ length: count }, (_, i) => ({ name: 'echo_' + i, inputSchema: { type: 'object' } })) });
    } else if (message.method === 'tools/call') { state.calls++; result({ content: [{ type: 'text', text: 'called' }] }); }
    else result({});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { state, baseUrl: 'http://127.0.0.1:' + server.address().port,
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}

async function serviceFixture(remote, endpoints, Mcp = AgentMcp, options) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-mcp-life-'));
  const service = new AgentService({ root, engine: { emit() {}, status: () => [] } }); await service.load();
  service.mcp = new Mcp(service, options);
  service.data.mcpServers = endpoints.map((endpoint, i) => ({ name: 'server-' + i, enabled: true,
    config: { type: 'http', url: remote.baseUrl + endpoint, headers: {} } }));
  return { service, async close() { await service.shutdown(); await fs.rm(root, { recursive: true, force: true, maxRetries: 3 }); } };
}

async function staleCallScenario(Mcp = AgentMcp) {
  const remote = await fixture(), owner = await serviceFixture(remote, ['/normal'], Mcp), mcp = owner.service.mcp;
  let releaseCall, releaseClose;
  const callGate = new Promise(resolve => { releaseCall = resolve; }), closeGate = new Promise(resolve => { releaseClose = resolve; });
  try {
    const run = { abort: new AbortController() }, definitions = await mcp.definitions(run);
    const connect = mcp.connect.bind(mcp), close = mcp.close.bind(mcp);
    let connected = false, disabling = false;
    mcp.connect = async (...args) => { const record = await connect(...args); connected = true; await callGate; return record; };
    mcp.close = async (...args) => { disabling = true; await closeGate; return close(...args); };
    const calling = mcp.call(definitions[0].function.name, {}, run).then(() => null, error => error);
    await until(() => connected);
    const disable = owner.service.request('mcp:disable', { name: 'server-0' });
    await until(() => disabling);
    releaseCall(); const error = await calling;
    releaseClose(); await disable;
    return { staleRemoteCalls: remote.state.calls, rejected: Boolean(error), message: error?.message };
  } finally { releaseCall(); releaseClose(); await owner.close(); await remote.close(); }
}

async function testConcurrency() {
  const remote = await fixture(), owner = await serviceFixture(remote, ['/blocked', ...Array.from({ length: 7 }, (_, i) => '/fast-' + i)]);
  try {
    remote.state.delayMs = 30;
    const first = owner.service.mcp.definitions({}), second = owner.service.mcp.definitions({});
    await until(() => remote.state.initialized.includes('/fast-6'));
    assert.ok(remote.state.releases.has('/blocked'), 'other servers must progress while the first handshake is blocked');
    remote.state.releases.get('/blocked')();
    const values = await Promise.all([first, second]);
    assert.equal(values[0].length, 8); assert.deepEqual(values[0], values[1]);
    assert.equal(remote.state.initialized.length, 8, 'same-server discovery reuses one connection');
    assert.ok(remote.state.peak <= 4 && remote.state.peak > 1);
    assert.equal(owner.service.mcp.pool.slots.active, 0);
    assert.equal(owner.service.mcp.pool.transients.size, 0);
  } finally { await owner.close(); await remote.close(); }
}

async function testShutdownAndBudget() {
  const remote = await fixture(), owner = await serviceFixture(remote, []);
  try {
    const pending = owner.service.request('mcp:test', { name: 'blocked', config: { type: 'http', url: remote.baseUrl + '/blocked-test' } })
      .then(() => null, error => error);
    await until(() => remote.state.releases.has('/blocked-test'));
    const scoped = await owner.service.mcp.definitions({ allowedProfileIds: ['selected-window'] });
    assert.deepEqual(scoped, [], 'a window-scoped task must not wait for an unrelated MCP configuration test');
    const start = performance.now(); await owner.service.shutdown();
    assert.ok(performance.now() - start < 1500, 'shutdown must cancel a transient test handshake');
    assert.ok(await pending); assert.equal(owner.service.mcp.pool.transients.size, 0);
    assert.equal(owner.service.mcp.pool.slots.active, 0);
  } finally { await owner.close(); await remote.close(); }
  const many = await fixture(), excessive = await serviceFixture(many, ['/many-1', '/many-2', '/many-3']);
  try {
    const run = {};
    await assert.rejects(excessive.service.mcp.definitions(run), /200/);
    assert.equal(run.mcpTools.size, 0, 'failed discovery cannot publish a partial tool snapshot');
    await until(() => excessive.service.mcp.pool.operations.size === 0);
    assert.equal(excessive.service.mcp.pool.slots.active, 0);
    assert.equal(excessive.service.mcp.pool.transients.size, 0);
  } finally { await excessive.close(); await many.close(); }
}

async function testQueuedCancellation() {
  const remote = await fixture(), owner = await serviceFixture(remote, ['/blocked-queue', '/queued'], AgentMcp, { maximum: 1 });
  try {
    const controller = new AbortController();
    const pending = owner.service.mcp.definitions({ abort: controller }).then(() => null, error => error);
    await until(() => remote.state.releases.has('/blocked-queue'));
    controller.abort(Error('cancel queued discovery')); assert.ok(await pending);
    await until(() => owner.service.mcp.pool.operations.size === 0);
    assert.deepEqual(remote.state.initialized, ['/blocked-queue'], 'a cancelled queued server must never start');
    assert.equal(owner.service.mcp.pool.slots.active, 0); assert.equal(owner.service.mcp.pool.slots.waiting.length, 0);
    const retry = owner.service.mcp.definitions({});
    await until(() => remote.state.initialized.length === 2);
    remote.state.releases.get('/blocked-queue')();
    assert.equal((await retry).length, 2, 'cancellation must release capacity for the next discovery');
    const connection = owner.service.mcp.connections.get('server-0').connection, close = connection.close.bind(connection);
    let fail = true;
    connection.close = () => { if (fail) { fail = false; return Promise.reject(Error('injected cleanup failure')); } return close(); };
    await assert.rejects(owner.service.shutdown(), /MCP/);
    assert.ok(owner.service.mcp.connections.has('server-0'), 'failed cleanup stays owned for retry');
    await owner.service.shutdown(); assert.equal(owner.service.mcp.connections.size, 0);
  } finally { await owner.close(); await remote.close(); }
}

async function testHttp() {
  const remote = await fixture();
  try {
    for (const [endpoint, pattern] of [['/wrong', /ID/], ['/empty', /matching/], ['/error', /503/], ['/type', /content-type/]]) {
      const connection = new Connection({ type: 'http', url: remote.baseUrl + endpoint, headers: {} }, { requestTimeoutMs: 500 });
      // Wrong-id replies still have a JSON content type.
      await assert.rejects(connection.request('fixture', {}), pattern);
      await until(() => remote.state.closed.has(endpoint)); assert.equal(connection.pending.size, 0); await connection.close();
    }
    const sse = new Connection({ type: 'http', url: remote.baseUrl + '/sse', headers: {} });
    assert.equal((await sse.request('fixture', {})).text, '汉🙂');
    await until(() => remote.state.pings === 1 && remote.state.closed.has('/sse'));
    assert.equal(sse.closed, false, 'replying to a server ping may receive HTTP 202'); await sse.close();
    const json = new Connection({ type: 'http', url: remote.baseUrl + '/case', headers: {} });
    assert.deepEqual(await json.request('fixture', {}), { ok: true }); await json.close();
    const flood = new Connection({ type: 'http', url: remote.baseUrl + '/pingstorm', headers: {} });
    await assert.rejects(flood.request('fixture', {}), /Too many pending MCP server requests/);
    await until(() => flood.replying === 0);
    assert.equal(flood.closed, true); assert.equal(flood.pending.size, 0); await flood.close();
    const drip = new Connection({ type: 'http', url: remote.baseUrl + '/drip', headers: {} },
      { requestTimeoutMs: 150, cleanupTimeoutMs: 2000 });
    await assert.rejects(drip.request('fixture', {}), /timed out|timeout/i);
    assert.equal(remote.state.cancellations, 1, 'cancellation uses its cleanup deadline even when it exceeds the request deadline');
    await until(() => remote.state.closed.has('/drip')); assert.equal(drip.pending.size, 0); await drip.close();
  } finally { await remote.close(); }
}

async function testStdio() {
  const connection = new Connection({ type: 'stdio', command: process.execPath,
    args: ['-e', "process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"], env: {} },
  { cleanupTimeoutMs: 60, killAfterMs: 40, exitTimeoutMs: 1000 });
  connection.openProcess();
  try {
    await delay(60);
    const controller = new AbortController();
    const pending = connection.request('fixture', { payload: 'x'.repeat(1024 * 1024) }, controller.signal).then(() => null, error => error);
    controller.abort(Error('cancel blocked stdin'));
    const start = performance.now(), error = await pending;
    assert.ok(error); assert.ok(performance.now() - start < 1000, 'backpressure must not block cancellation notification forever');
    assert.equal(connection.pending.size, 0);
    connection.requestTimeoutMs = 60;
    await assert.rejects(connection.notify('fixture', { payload: 'x'.repeat(1024 * 1024) }), /timeout/i,
      'standalone notifications also have an absolute write deadline');
    const pid = connection.child.pid; await Promise.all([connection.close(), connection.close()]);
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
    assert.equal(connection.child.stdout.destroyed, true);
  } finally { await connection.close(); }
}

async function testInheritedPipes() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-mcp-pipe-')), file = path.join(root, 'grandchild.pid');
  const script = `const {spawn}=require('node:child_process');const fs=require('node:fs');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:['ignore',1,2]});fs.writeFileSync(process.env.PID_FILE,String(child.pid));setInterval(()=>{},1000);`;
  const connection = new Connection({ type: 'stdio', command: process.execPath, args: ['-e', script], env: { PID_FILE: file } });
  let grandchild;
  try {
    connection.openProcess();
    await until(() => require('node:fs').existsSync(file)); grandchild = Number(await fs.readFile(file, 'utf8'));
    const start = performance.now(); await connection.close();
    assert.ok(performance.now() - start < 1500, 'inherited pipes cannot delay direct-child exit handling');
    assert.equal(connection.child.stdout.destroyed, true); assert.equal(connection.child.stderr.destroyed, true);
  } finally {
    await connection.close(); if (grandchild) { try { process.kill(grandchild, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

async function testBoundedShutdown() {
  // Regression: an operation that misses its abort signal used to pin
  // ConnectionPool.shutdown (and this whole selftest) forever at 0 CPU until
  // the CI script budget SIGTERMed it. Shutdown must stay bounded: drain for
  // a short grace, then force-close and report instead of hanging.
  const pool = new ConnectionPool(() => null, { maximum: 1, shutdownGraceMs: 60 });
  let release;
  const stuck = new Promise(resolve => { release = resolve; });
  pool.operations.add(stuck);
  const start = performance.now();
  try {
    await pool.shutdown(Promise.resolve());
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 2000, 'shutdown must stay bounded when an operation never settles (took ' + elapsed.toFixed(1) + 'ms)');
  } finally { release(); }
}

async function main() {
  const previous = process.env.OPENBROWSER_MASTER_KEY; process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  try {
    const stale = await staleCallScenario(); assert.equal(stale.staleRemoteCalls, 0); assert.equal(stale.rejected, true);
    await testConcurrency(); await testShutdownAndBudget(); await testQueuedCancellation(); await testHttp(); await testStdio(); await testInheritedPipes(); await testBoundedShutdown();
    console.log('AGENT_MCP_LIFECYCLE OK (bounded parallel discovery, no stale disabled calls, shutdown cancellation, HTTP release/correlation/SSE and stdio backpressure cleanup)');
  } finally { if (previous === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = previous; }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { fixture, serviceFixture, staleCallScenario };
