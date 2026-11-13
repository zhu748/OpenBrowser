'use strict';

const assert = require('node:assert/strict');
const { PersistentConnection } = require('../../network/cdp-connection');
const { BidiConnection } = require('../../network/bidi-connection');

// A synchronous emitter makes protocol handler exceptions directly observable.
class Socket {
  constructor() { this.listeners = new Map(); this.readyState = 0; this.sent = []; }
  addEventListener(type, listener) {
    const list = this.listeners.get(type) || []; list.push(listener); this.listeners.set(type, list);
  }
  emit(type, data) { for (const listener of this.listeners.get(type) || []) listener({ data }); }
  send(payload) { this.sent.push(JSON.parse(payload)); }
  close() { this.readyState = 3; this.emit('close'); }
}

(async () => {
  const original = global.WebSocket;
  let checks = 0;
  try {
    for (const kind of ['cdp', 'bidi']) {
      const socket = new Socket();
      global.WebSocket = function () { return socket; };
      const connection = kind === 'cdp' ? new PersistentConnection('ws://127.0.0.1:12345/devtools')
        : new BidiConnection('ws://127.0.0.1:12345', { socketFactory: () => socket });
      try {
        const opening = connection.open(); socket.readyState = 1; socket.emit('open'); await opening;
        const pending = connection.command('first');
        const circular = {}; circular.self = circular;
        for (const params of [circular, { value: 1n }]) {
          await assert.rejects(connection.command('invalid', params), TypeError);
          assert.equal(connection.closed, false, 'bad arguments cannot close a shared transport');
          assert.equal(connection.pending.size, 1, 'unrelated command remains pending');
          checks += 1;
        }
        for (const message of ['null', '[]', 'true', '17', '"text"', '{invalid']) {
          assert.doesNotThrow(() => socket.emit('message', message));
        }
        const firstId = socket.sent[0].id;
        socket.emit('message', JSON.stringify({ id: firstId, type: 'success', result: { value: 'first' } }));
        assert.deepEqual(await pending, { value: 'first' });
        const second = connection.command('second');
        socket.emit('message', JSON.stringify({ id: socket.sent.at(-1).id, type: 'success', result: { value: 'second' } }));
        assert.deepEqual(await second, { value: 'second' });
        assert.equal(connection.pending.size, 0);
        checks += 1;
        const performanceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
        let clock = 0;
        Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => clock } });
        try {
          const options = kind === 'cdp' ? { timeout: 50 } : 50;
          const late = assert.rejects(connection.command('late', {}, options), /timeout: late/);
          clock = 51;
          socket.emit('message', JSON.stringify({ id: socket.sent.at(-1).id, type: 'success', result: { tooLate: true } }));
          await late;
          assert.equal(connection.pending.size, 0, 'late replies cannot win against delayed timeout callbacks');
          const sent = socket.sent.length;
          clock = 100;
          await assert.rejects(connection.command('serialization', { toJSON() { clock = 151; return {}; } }, options), /timeout: serialization/);
          assert.equal(socket.sent.length, sent, 'serialization consumes the deadline and expired input is never sent');
          assert.equal(connection.closed, false, 'one command expiring leaves the shared connection usable');
          clock = 200;
          const healthy = connection.command('healthy', {}, options);
          clock = 210;
          socket.emit('message', JSON.stringify({ id: socket.sent.at(-1).id, type: 'success', result: { healthy: true } }));
          assert.deepEqual(await healthy, { healthy: true });
          checks += 3;
        } finally { Object.defineProperty(globalThis, 'performance', performanceDescriptor); }
        const failed = connection.command('send-failure');
        const rejection = assert.rejects(failed, /socket error/);
        socket.send = () => { throw new Error('socket error'); };
        await assert.rejects(connection.command('broken'), /socket error/);
        await rejection;
        assert.equal(connection.closed, true, 'real socket failures still terminate the connection');
        assert.equal(connection.pending.size, 0);
        checks += 1;
      } finally { connection.close(); }
      const delayed = new Socket();
      global.WebSocket = function () { return delayed; };
      const lateConnection = kind === 'cdp' ? new PersistentConnection('ws://127.0.0.1:12345/devtools')
        : new BidiConnection('ws://127.0.0.1:12345', { socketFactory: () => delayed });
      const performanceDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance');
      let clock = 0;
      Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => clock } });
      try {
        const rejected = assert.rejects(lateConnection.open(50), /connection timeout/);
        clock = 51; delayed.readyState = 1; delayed.emit('open'); await rejected;
        assert.equal(lateConnection.closed, true, 'late handshakes close rather than publish a ready connection');
        checks += 1;
      } finally { lateConnection.close(); Object.defineProperty(globalThis, 'performance', performanceDescriptor); }
    }
  } finally { global.WebSocket = original; }
  console.log(`TRANSPORT_ISOLATION_SELFTEST OK ${checks}/${checks}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
