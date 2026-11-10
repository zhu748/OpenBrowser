'use strict';

const assert = require('assert');
const { PersistentConnection } = require('./cdp');
const { PersistentCdp } = require('./live-sync-v4');

class FakeWebSocket {
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.listeners = new Map();
    this.sent = [];
    this.closeCount = 0;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  emit(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) listener(event);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open');
  }

  send(raw) {
    if (this.readyState !== FakeWebSocket.OPEN) throw new Error('fake socket is not open');
    this.sent.push(JSON.parse(raw));
  }

  close() {
    this.closeCount += 1;
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close');
  }
}

FakeWebSocket.CONNECTING = 0;
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;

function latestSocket() {
  const socket = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
  assert.ok(socket, 'expected a fake WebSocket instance');
  return socket;
}

async function rejectsFast(promise, pattern, label, maxMilliseconds = 150) {
  const started = Date.now();
  await assert.rejects(promise, (error) => {
    assert.match(error.message, pattern, label);
    return true;
  });
  const elapsed = Date.now() - started;
  assert.ok(elapsed < maxMilliseconds, `${label} took ${elapsed}ms`);
  return elapsed;
}

async function testOpenFailure(kind, expectedPattern) {
  const connection = new PersistentConnection('ws://fake.test/devtools');
  const opening = connection.open(500);
  const socket = latestSocket();
  socket.emit(kind);

  const elapsed = await rejectsFast(opening, expectedPattern, `open ${kind}`);
  assert.strictEqual(connection.closed, true);
  assert.strictEqual(connection.socket, null);
  assert.strictEqual(connection.pending.size, 0);
  await rejectsFast(connection.command('Runtime.evaluate'), /connection is closed/, `command after open ${kind}`);
  return elapsed;
}

async function testTimeout() {
  const connection = new PersistentConnection('ws://fake.test/timeout');
  const started = Date.now();
  const opening = connection.open(25);
  const socket = latestSocket();
  const elapsed = await rejectsFast(opening, /connection timeout/, 'open timeout', 180);
  assert.ok(Date.now() - started < 180, 'timeout rejection was not prompt');
  assert.strictEqual(socket.closeCount, 1);
  assert.strictEqual(connection.closed, true);
  assert.strictEqual(connection.socket, null);
  await rejectsFast(connection.command('Runtime.evaluate'), /connection is closed/, 'command after timeout');
  return elapsed;
}

async function testDisconnectRejectsPending() {
  const connection = new PersistentConnection('ws://fake.test/disconnect');
  const opening = connection.open(500);
  const socket = latestSocket();
  socket.open();
  await opening;

  const first = connection.command('Runtime.evaluate', { expression: '1' }, { timeout: 1000 });
  const second = connection.command('Runtime.enable', {}, { timeout: 1000 });
  assert.strictEqual(connection.pending.size, 2);
  assert.deepStrictEqual(socket.sent.map((message) => message.method), ['Runtime.evaluate', 'Runtime.enable']);

  const started = Date.now();
  socket.emit('close');
  await assert.rejects(first, /persistent socket closed/);
  await assert.rejects(second, /persistent socket closed/);
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 150, `pending commands took ${elapsed}ms to reject after disconnect`);
  assert.strictEqual(connection.pending.size, 0);
  assert.strictEqual(connection.closed, true);
  assert.strictEqual(connection.socket, null);
  await rejectsFast(connection.command('Runtime.evaluate'), /connection is closed/, 'command after disconnect');
  return elapsed;
}

async function testDisconnectCallback() {
  let disconnected = 0;
  const connection = new PersistentConnection('ws://fake.test/disconnect-callback', {
    onDisconnect: (error) => {
      disconnected += 1;
      assert.match(error.message, /persistent socket closed/);
    },
  });
  const opening = connection.open(500);
  const socket = latestSocket();
  socket.open();
  await opening;
  socket.emit('close');
  assert.strictEqual(disconnected, 1, 'unexpected disconnect must notify lifecycle owner');
  socket.emit('close');
  assert.strictEqual(disconnected, 1, 'disconnect callback must fire once');
}

async function testExplicitCloseRejectsPending() {
  const connection = new PersistentConnection('ws://fake.test/explicit-close');
  const opening = connection.open(500);
  const socket = latestSocket();
  socket.open();
  await opening;

  const pending = connection.command('Page.enable', {}, { timeout: 1000 });
  const started = Date.now();
  connection.close();
  await assert.rejects(pending, /persistent connection closed/);
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 150, `pending command took ${elapsed}ms to reject after close()`);
  assert.strictEqual(socket.closeCount, 1);
  assert.strictEqual(connection.pending.size, 0);
  await rejectsFast(connection.command('Page.enable'), /connection is closed/, 'command after close()');
  return elapsed;
}

async function testPostOpenErrorRejectsPending() {
  const connection = new PersistentConnection('ws://fake.test/error');
  const opening = connection.open(500);
  const socket = latestSocket();
  socket.open();
  await opening;

  const pending = connection.command('Target.getTargets', {}, { timeout: 1000 });
  socket.emit('error');
  await assert.rejects(pending, /persistent socket error/);
  assert.strictEqual(connection.closed, true);
  assert.strictEqual(connection.socket, null);
  await rejectsFast(connection.command('Target.getTargets'), /connection is closed/, 'command after socket error');
}

async function testCloseDuringHandshake() {
  let disconnected = 0;
  const connection = new PersistentConnection('ws://fake.test/handshake', {
    onDisconnect: () => { disconnected += 1; },
  });
  const opening = connection.open(60);
  const socket = latestSocket();
  const outcome = opening.then(() => 'opened', () => 'closed');
  connection.close();
  assert.strictEqual(await Promise.race([outcome, new Promise((resolve) => setImmediate(() => resolve('waiting')))]), 'closed',
    'close must settle the handshake immediately, without waiting for its timeout');
  socket.open(); // a late transport event must not resurrect the connection
  assert.strictEqual(connection.opened, false);
  assert.strictEqual(connection.closed, true);
  assert.strictEqual(disconnected, 0, 'explicit shutdown is not an unexpected disconnect');
}

async function testSharedHandshake() {
  const connection = new PersistentConnection('ws://fake.test/shared-handshake');
  const before = FakeWebSocket.instances.length;
  const first = connection.open(100);
  const second = connection.open(100);
  // Handle all results even if an assertion fails.
  const results = Promise.allSettled([first, second]);
  try {
    assert.strictEqual(FakeWebSocket.instances.length - before, 1, 'concurrent open calls must share a socket');
    latestSocket().open();
    assert.deepStrictEqual((await results).map((result) => result.status), ['fulfilled', 'fulfilled']);
    assert.strictEqual(await connection.open(), connection, 'opening an established connection is idempotent');
    assert.strictEqual(FakeWebSocket.instances.length - before, 1);
  } finally { connection.close(); await results; }
}

async function testSendFailureClosesTransport() {
  let disconnected = 0;
  const connection = new PersistentConnection('ws://fake.test/send-error', { onDisconnect: () => { disconnected += 1; } });
  const opening = connection.open(100);
  const socket = latestSocket(); socket.open(); await opening;
  const pending = connection.command('Page.enable');
  const rejection = assert.rejects(pending, /send failed/);
  socket.send = () => { throw new Error('send failed'); };
  await assert.rejects(connection.command('Page.navigate'), /send failed/);
  await rejection;
  assert.strictEqual(socket.closeCount, 1, 'a failed send must close the physical socket');
  assert.strictEqual(disconnected, 1);
  let events = 0; connection.onEvent = () => { events += 1; };
  socket.emit('message', { data: JSON.stringify({ method: 'Page.loadEventFired' }) });
  assert.strictEqual(events, 0, 'late events from a closed connection are ignored');
}

async function testSyncTransportCompatibility() {
  const events = [];
  const connection = new PersistentCdp('ws://fake.test/sync', (event) => events.push(event));
  await assert.rejects(connection.command('Page.enable'), /CDP is not connected/);
  const opening = connection.open(100);
  const socket = latestSocket(); socket.open(); await opening;
  const command = connection.command('Runtime.enable', {}, { sessionId: 'session' });
  for (const data of ['null', 'true', '42', '"text"', '{']) socket.emit('message', { data });
  assert.strictEqual(connection.pending.size, 1, 'malformed messages do not crash or settle a pending command');
  assert.strictEqual(socket.sent[0].sessionId, 'session');
  socket.emit('message', { data: JSON.stringify({ id: socket.sent[0].id, result: { enabled: true } }) });
  assert.deepStrictEqual(await command, { enabled: true });
  socket.emit('message', { data: JSON.stringify({ method: 'Runtime.bindingCalled', params: {} }) });
  assert.strictEqual(events.length, 1);
  connection.close();
  assert.strictEqual(connection.url, 'ws://fake.test/sync');

  const cancelled = new PersistentCdp('ws://fake.test/sync-cancel', () => {});
  const result = cancelled.open(100);
  cancelled.close();
  await rejectsFast(result, /connection closed/, 'sync handshake cancellation');
}

async function main() {
  const originalWebSocket = global.WebSocket;
  global.WebSocket = FakeWebSocket;
  FakeWebSocket.instances.length = 0;
  try {
    const errorElapsed = await testOpenFailure('error', /persistent socket error/);
    const closeElapsed = await testOpenFailure('close', /persistent socket closed/);
    const timeoutElapsed = await testTimeout();
    const disconnectElapsed = await testDisconnectRejectsPending();
    await testDisconnectCallback();
    const explicitCloseElapsed = await testExplicitCloseRejectsPending();
    await testPostOpenErrorRejectsPending();
    await testCloseDuringHandshake();
    await testSharedHandshake();
    await testSendFailureClosesTransport();
    await testSyncTransportCompatibility();
    process.stdout.write([
      'CDP_CONNECTION_SELFTEST_OK',
      `preopen_error_ms=${errorElapsed}`,
      `preopen_close_ms=${closeElapsed}`,
      `timeout_ms=${timeoutElapsed}`,
      `disconnect_pending_ms=${disconnectElapsed}`,
      `explicit_close_ms=${explicitCloseElapsed}`,
      `sockets=${FakeWebSocket.instances.length}`,
    ].join(' ') + '\n');
  } finally {
    global.WebSocket = originalWebSocket;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
