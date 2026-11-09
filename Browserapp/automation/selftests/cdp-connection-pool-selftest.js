'use strict';

/**
 * Self-test for the cdp.call() command connection pool.
 *
 * Uses a mock global WebSocket (no real CDP target needed) to verify:
 *  - socket reuse across sequential and concurrent commands
 *  - id-multiplexed concurrent calls over one socket
 *  - eviction on mid-flight disconnect and next-call recovery
 *  - transparent single retry when an entry died before the command was sent
 *  - idle reaping and explicit pooled-socket teardown
 *  - pool cap with LRU eviction and dedicated-socket fallback on overflow
 *  - error propagation parity (CDP error message, command timeout)
 */

const assert = require('assert');

const cdp = require('../../cdp');
const { callPool, POOL_MAX, setIdleMs } = cdp.__test.pool;

// ---- mock WebSocket -----------------------------------------------------------

class MockSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 'connecting';
    this.listeners = new Map();
    this.received = [];
    MockSocket.created.push(this);
    const behavior = MockSocket.behaviors.get(url) || {};
    if (behavior.rejectConnect) {
      queueMicrotask(() => this.emit('error', {}));
      return;
    }
    queueMicrotask(() => {
      if (this.readyState === 'closed') return;
      this.readyState = 'open';
      this.emit('open', {});
      if (behavior.dieAfterOpen && behavior.dieAfterOpen > 0) {
        behavior.dieAfterOpen -= 1; // consume one death: later connections stay healthy
        this.readyState = 'closed';
        this.emit('close', {});
      }
    });
  }
  static created = [];
  static behaviors = new Map();
  static reset() {
    MockSocket.created = [];
    MockSocket.behaviors = new Map();
  }
  static socketsFor(url) {
    return MockSocket.created.filter((s) => s.url === url);
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  emit(type, event) {
    for (const fn of this.listeners.get(type) || []) {
      try { fn(event || {}); } catch (_) {}
    }
  }
  send(data) {
    const message = JSON.parse(data);
    this.received.push(message);
    const behavior = MockSocket.behaviors.get(this.url) || {};
    if (behavior.dropAfterSend > 0) {
      behavior.dropAfterSend -= 1;
      queueMicrotask(() => this.serverDrop());
      return;
    }
    if (behavior.manual) return; // test replies explicitly via serverReply()
    queueMicrotask(() => {
      if (this.readyState === 'closed') return;
      if (behavior.errorReply) {
        this.emit('message', { data: JSON.stringify({ id: message.id, error: { message: 'Target closed' } }) });
        return;
      }
      this.emit('message', { data: JSON.stringify({ id: message.id, result: { echoed: message.method, params: message.params } }) });
    });
  }
  serverReply(id, result) {
    this.emit('message', { data: JSON.stringify({ id, result: result || {} }) });
  }
  serverDrop() {
    if (this.readyState === 'closed') return;
    this.readyState = 'closed';
    this.emit('error', {});
    this.emit('close', {});
  }
  close() {
    if (this.readyState === 'closed') return;
    this.readyState = 'closed';
    this.emit('close', {});
  }
}

const realWebSocket = globalThis.WebSocket;
const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}
async function checkAsync(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message || String(e) }); }
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  globalThis.WebSocket = MockSocket;
  const URL = (n) => `ws://127.0.0.1:5000/devtools/page/AAA${String(n).padStart(3, '0')}`;

  try {
    await checkAsync('sequential calls reuse one pooled socket', async () => {
      MockSocket.reset();
      const url = URL(1);
      for (let i = 0; i < 5; i += 1) {
        const result = await cdp.call(url, 'Runtime.evaluate', { i });
        assert.strictEqual(result.echoed, 'Runtime.evaluate');
        assert.strictEqual(result.params.i, i);
      }
      assert.strictEqual(MockSocket.socketsFor(url).length, 1, 'expected exactly one socket for 5 sequential calls');
      assert.ok(callPool.has(url), 'entry stays pooled after settle');
    });

    await checkAsync('concurrent calls multiplex over one socket by id', async () => {
      MockSocket.reset();
      const url = URL(2);
      MockSocket.behaviors.set(url, { manual: true });
      const pending = [];
      for (let i = 0; i < 10; i += 1) pending.push(cdp.call(url, `M${i}`, { i }));
      await sleep(20); // let all opens/sends land
      const socket = MockSocket.socketsFor(url)[0];
      assert.ok(socket, 'socket created');
      assert.strictEqual(socket.received.length, 10, 'all ten commands sent');
      const ids = new Set(socket.received.map((m) => m.id));
      assert.strictEqual(ids.size, 10, 'ids are unique');
      for (const message of socket.received) {
        socket.serverReply(message.id, { echoed: message.method });
      }
      const settled = await Promise.all(pending);
      for (let i = 0; i < 10; i += 1) {
        assert.strictEqual(settled[i].echoed, `M${i}`, `reply ${i} matched its own id`);
      }
      assert.strictEqual(MockSocket.socketsFor(url).length, 1, 'one socket served ten concurrent commands');
    });

    await checkAsync('mid-flight disconnect rejects and evicts; next call reopens', async () => {
      MockSocket.reset();
      const url = URL(3);
      MockSocket.behaviors.set(url, { manual: true });
      const inFlight = cdp.call(url, 'Page.navigate', { url: 'https://example.test/' });
      await sleep(20);
      const socket = MockSocket.socketsFor(url)[0];
      // Attach the rejection assertion BEFORE the drop so the rejection is always handled.
      const rejection = assert.rejects(() => inFlight, (err) => /closed|error/i.test(String(err.message)));
      socket.serverDrop();
      await rejection;
      assert.strictEqual(callPool.has(url), false, 'dead entry evicted from pool');
      MockSocket.behaviors.delete(url);
      const after = await cdp.call(url, 'Runtime.evaluate', {});
      assert.strictEqual(after.echoed, 'Runtime.evaluate');
      assert.strictEqual(MockSocket.socketsFor(url).length, 2, 'a fresh socket served the next call');
    });

    await checkAsync('open-then-instant-death gets one transparent retry', async () => {
      MockSocket.reset();
      const url = URL(4);
      MockSocket.behaviors.set(url, { dieAfterOpen: 1 });
      // First connection: socket opens, dies instantly. The pool must retry once on a
      // fresh socket; the consumed death counter makes the second connection healthy.
      const result = await cdp.call(url, 'Input.dispatchKeyEvent', { type: 'keyDown' });
      assert.strictEqual(result.echoed, 'Input.dispatchKeyEvent');
      assert.strictEqual(MockSocket.socketsFor(url).length, 2, 'retry opened exactly one extra socket');
      MockSocket.behaviors.delete(url);
    });

    await checkAsync('same-millisecond disconnect never retries a command already sent', async () => {
      MockSocket.reset();
      const url = URL(503);
      MockSocket.behaviors.set(url, { dropAfterSend: 1 });
      const originalNow = Date.now;
      Date.now = () => 123456789;
      try {
        await assert.rejects(cdp.call(url, 'Input.dispatchKeyEvent', { type: 'keyDown' }), /closed|error/i);
        const sent = MockSocket.socketsFor(url).flatMap((socket) => socket.received);
        assert.strictEqual(sent.length, 1, 'input may have executed already and must never be replayed');
      } finally { Date.now = originalNow; }
    });

    await checkAsync('stale pooled entry with externally closed conn is dropped', async () => {
      MockSocket.reset();
      const url = URL(5);
      await cdp.call(url, 'Runtime.enable', {});
      const entry = callPool.get(url);
      assert.ok(entry, 'entry pooled');
      entry.conn.close(); // external close without eviction (defensive path)
      const result = await cdp.call(url, 'Runtime.disable', {});
      assert.strictEqual(result.echoed, 'Runtime.disable');
      assert.strictEqual(MockSocket.socketsFor(url).length, 2, 'stale entry was replaced by a fresh socket');
    });

    await checkAsync('idle reaping closes pooled sockets and clears entries', async () => {
      MockSocket.reset();
      const url = URL(6);
      setIdleMs(40);
      await cdp.call(url, 'Runtime.enable', {});
      assert.ok(callPool.has(url), 'entry pooled while active');
      await sleep(90);
      assert.strictEqual(callPool.has(url), false, 'entry reaped after idle window');
      const socket = MockSocket.socketsFor(url)[0];
      assert.strictEqual(socket.readyState, 'closed', 'idle socket was closed');
      setIdleMs(30000);
    });

    await checkAsync('closePooledSocket tears down and is idempotent', async () => {
      MockSocket.reset();
      const url = URL(7);
      await cdp.call(url, 'Runtime.enable', {});
      const socket = MockSocket.socketsFor(url)[0];
      cdp.closePooledSocket(url);
      assert.strictEqual(callPool.has(url), false, 'entry removed');
      assert.strictEqual(socket.readyState, 'closed', 'socket closed');
      cdp.closePooledSocket(url); // must not throw
      assert.strictEqual(callPool.has(url), false);
    });

    await checkAsync('pool cap evicts the least recently used idle entry', async () => {
      MockSocket.reset();
      const urls = [];
      for (let i = 0; i < POOL_MAX; i += 1) {
        const url = URL(100 + i);
        urls.push(url);
        await cdp.call(url, 'Runtime.enable', {});
      }
      assert.strictEqual(callPool.size, POOL_MAX, 'pool filled to cap');
      const oldestSocket = MockSocket.socketsFor(urls[0])[0];
      const freshUrl = URL(200);
      await cdp.call(freshUrl, 'Runtime.enable', {});
      assert.strictEqual(callPool.size, POOL_MAX, 'pool stays at cap after insertion');
      assert.strictEqual(callPool.has(urls[0]), false, 'oldest idle entry evicted (LRU)');
      assert.strictEqual(callPool.has(freshUrl), true, 'newest entry kept');
      assert.strictEqual(oldestSocket.readyState, 'closed', 'evicted entry socket closed');
      cdp.closeAllPooledSockets();
      assert.strictEqual(callPool.size, 0, 'closeAllPooledSockets empties the pool');
    });

    await checkAsync('overflow with all sockets busy falls back to a dedicated socket', async () => {
      MockSocket.reset();
      const held = [];
      for (let i = 0; i < POOL_MAX; i += 1) {
        const url = URL(300 + i);
        MockSocket.behaviors.set(url, { manual: true });
        held.push({ url, promise: cdp.call(url, 'Runtime.evaluate', { i }) });
      }
      await sleep(20); // all pooled sockets open and busy awaiting replies
      assert.strictEqual(callPool.size, POOL_MAX);
      const overflowUrl = URL(400);
      const overflow = await cdp.call(overflowUrl, 'Runtime.evaluate', { x: 1 });
      assert.strictEqual(overflow.echoed, 'Runtime.evaluate', 'overflow call still succeeds');
      assert.strictEqual(callPool.size, POOL_MAX, 'pool size unchanged by overflow');
      assert.strictEqual(callPool.has(overflowUrl), false, 'dedicated socket was not pooled');
      const overflowSocket = MockSocket.socketsFor(overflowUrl)[0];
      assert.strictEqual(overflowSocket.readyState, 'closed', 'dedicated socket closed after settle');
      // Release the held commands.
      for (const { url, promise } of held) {
        const socket = MockSocket.socketsFor(url)[0];
        for (const message of socket.received) socket.serverReply(message.id, {});
        await promise;
      }
      for (const { url } of held) MockSocket.behaviors.delete(url);
    });

    await checkAsync('CDP protocol errors keep their message', async () => {
      MockSocket.reset();
      const url = URL(500);
      MockSocket.behaviors.set(url, { errorReply: true });
      await assert.rejects(
        () => cdp.call(url, 'Page.navigate', {}),
        (err) => String(err.message) === 'Target closed',
      );
    });

    await checkAsync('command timeout keeps the CDP timeout message', async () => {
      MockSocket.reset();
      const url = URL(501);
      MockSocket.behaviors.set(url, { manual: true });
      await assert.rejects(
        () => cdp.call(url, 'Runtime.evaluate', {}, 40),
        (err) => String(err.message) === 'CDP timeout: Runtime.evaluate',
      );
      const entry = callPool.get(url);
      assert.ok(entry, 'timed-out entry stays pooled (socket itself is healthy)');
      cdp.closeAllPooledSockets();
    });

    await checkAsync('failed handshake rejects and evicts', async () => {
      MockSocket.reset();
      const url = URL(502);
      MockSocket.behaviors.set(url, { rejectConnect: true });
      await assert.rejects(() => cdp.call(url, 'Runtime.enable', {}));
      assert.strictEqual(callPool.has(url), false, 'failed-open entry not pooled');
    });
  } finally {
    cdp.closeAllPooledSockets();
    setIdleMs(30000);
    globalThis.WebSocket = realWebSocket;
  }

  // ---- report ----
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.err}`}`);
  }
  console.log(`\nCDP_CONNECTION_POOL_SELFTEST ${failed.length ? 'FAILED' : 'OK'} ${passed}/${results.length}`);
  if (failed.length) process.exitCode = 1;
})();
