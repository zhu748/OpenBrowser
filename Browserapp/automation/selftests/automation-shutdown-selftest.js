'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { createAutomationStop } = require('../shutdown');

async function main() {
  const calls = [];
  let failing = true;
  const resources = Object.fromEntries(['rpaEngine', 'localApi', 'proxyStore', 'accountStore', 'transferStore', 'rpaStore']
    .map(name => [name, { [name === 'rpaEngine' || name === 'localApi' ? 'stop' : 'flush']: async () => {
      calls.push(name);
      if (failing && (name === 'rpaEngine' || name === 'proxyStore')) throw Error(name + ' failure');
    } }]));
  const stop = createAutomationStop(resources);
  const first = stop();
  assert.strictEqual(stop(), first, 'concurrent callers share one cleanup attempt');
  await assert.rejects(first, error => {
    assert.ok(error instanceof AggregateError);
    assert.deepEqual(error.errors.map(item => item.service), ['rpa', 'proxy-store']);
    assert.equal(error.errors[0].cause.message, 'rpaEngine failure');
    return true;
  });
  assert.deepEqual(calls, Object.keys(resources), 'later resources are still closed and flushed');
  failing = false;
  await stop();
  assert.equal(calls.length, 12, 'a failed shutdown can be retried');

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-shutdown-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  const crypto = require('../../credential-crypto');
  crypto.resetLocalMasterKeyCache();
  let stack;
  try {
    stack = await require('../index').startAutomation({
      app: { getPath: () => root, getVersion: () => '1.0.0' },
      engine: { profiles: new Map(), running: new Map(), status: () => [] }, port: 0,
    });
    const server = stack.localApi.server;
    assert.equal(server.listening, true);
    stack.rpaEngine.stop = () => { throw Error('real-stack cancellation failure'); };
    await assert.rejects(stack.stop(), /real-stack cancellation failure/);
    assert.equal(server.listening, false, 'an RPA error cannot leave the actual API listener open');
    await new Promise((resolve, reject) => {
      const socket = net.connect({ host: '127.0.0.1', port: stack.info.port });
      socket.setTimeout(2000, () => { socket.destroy(); reject(Error('connection test timed out')); });
      socket.once('connect', () => { socket.destroy(); reject(Error('API still accepts connections')); });
      socket.once('error', error => { socket.destroy(); error.code === 'ECONNREFUSED' ? resolve() : reject(error); });
    });
  } finally {
    if (stack) { stack.rpaEngine.stop = async () => {}; await stack.stop(); }
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = previousKey;
    crypto.resetLocalMasterKeyCache();
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log('PASS automation shutdown: error aggregation, remaining flushes, retry, single flight and real API closure');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
