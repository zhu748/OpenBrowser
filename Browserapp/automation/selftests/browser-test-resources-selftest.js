'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const { mkdtemp, rm } = require('node:fs/promises');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { closeFixtureServer, listenFixtureServer, startFixtureProcess } = require('./fixtures/browser-test-resources');

test('already-signaled child keeps original diagnostics and can still be closed', { skip: process.platform === 'win32', timeout: 2000 }, async () => {
  const child = startFixtureProcess(process.execPath, ['-e', "process.stderr.write('fixture startup log', () => process.kill(process.pid, 'SIGTERM'))"]);
  try {
    await child.closed;
    assert.throws(child.assertRunning, /SIGTERM[\s\S]*fixture startup log/);
  } finally {
    await child.close();
  }
});

test('a missing executable is reported without hanging on teardown', { timeout: 2000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'browser-fixture-test-'));
  try {
    const child = startFixtureProcess(path.join(root, 'not-installed'), []);
    try {
      await child.closed;
      assert.throws(child.assertRunning, { message: /Could not launch fixture browser/ });
    } finally {
      await child.close();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('closing a live subprocess waits for its exit', { timeout: 2000 }, async () => {
  const child = startFixtureProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
  child.assertRunning();
  await child.close();
  await child.closed;
  assert.throws(child.assertRunning, /Fixture browser exited/);
});

test('server teardown closes active fixture requests', { timeout: 2000 }, async () => {
  const server = http.createServer(() => {}); // Intentionally never responds.
  await listenFixtureServer(server);
  const request = once(server, 'request');
  const socket = net.connect(server.address().port, '127.0.0.1');
  try {
    await once(socket, 'connect');
    socket.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
    await request;
    const disconnected = once(socket, 'close');
    await closeFixtureServer(server);
    await disconnected;
  } finally {
    socket.destroy();
    await closeFixtureServer(server);
  }
});
