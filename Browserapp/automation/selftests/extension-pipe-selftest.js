'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const { PipeConnection, closeInstaller, reconcileOnConnection } = require('../../extension-pipe');
const { extensionPathKey } = require('../extension-identity');

function childProcess() {
  const child = new EventEmitter();
  const input = new EventEmitter(), output = new EventEmitter();
  child.stdio = [null, null, null, input, output];
  child.exitCode = null; child.signalCode = null; child.killed = 0;
  child.kill = () => { child.killed += 1; };
  input.frames = []; input.write = (frame) => { input.frames.push(frame); return true; };
  return child;
}

async function main() {
  const child = childProcess(), pipe = new PipeConnection(child);
  await assert.rejects(pipe.command('Serialize', { value: 1n }), /BigInt/);
  assert.equal(pipe.pending.size, 0, 'serialization failure leaves no timer or pending entry');
  const pending = pipe.command('Browser.getVersion');
  const frame = JSON.parse(child.stdio[3].frames[0].toString().slice(0, -1));
  child.stdio[4].emit('data', Buffer.from('null\0true\0'));
  assert.equal(pipe.pending.size, 1, 'non-object frames do not crash or settle commands');
  child.stdio[4].emit('data', Buffer.from(JSON.stringify({ id: frame.id, result: { product: 'test' } }) + '\0'));
  assert.deepEqual(await pending, { product: 'test' });
  const failure = assert.rejects(pipe.command('Waiting'), /output ended/);
  child.stdio[4].emit('end'); await failure;
  await assert.rejects(pipe.command('AfterClose'), /output ended/);
  assert.equal(pipe.pending.size, 0); assert.equal(pipe.buffer.length, 0);

  const broken = childProcess(), brokenPipe = new PipeConnection(broken);
  broken.stdio[3].write = () => { throw new Error('write failed'); };
  await assert.rejects(brokenPipe.command('Write'), /write failed/);
  assert.equal(brokenPipe.pending.size, 0); assert.equal(brokenPipe.closed, true);

  const exited = childProcess(); exited.exitCode = 0;
  await closeInstaller({ child: exited, connection: { command() { throw new Error('already exited'); } } });
  assert.equal(exited.listenerCount('exit'), 0);
  const exiting = childProcess();
  await closeInstaller({ child: exiting, connection: { command() {
    exiting.exitCode = 0; exiting.emit('exit', 0);
    return new Promise(() => {}); // shutdown never replies, but process exit wins
  } } });
  assert.equal(exiting.killed, 0); assert.equal(exiting.listenerCount('exit'), 0);

  const set = global.setTimeout, clear = global.clearTimeout;
  let expire, cleared = false;
  global.setTimeout = (fn, ms) => { assert.equal(ms, 5000); expire = fn; return 123; };
  global.clearTimeout = (id) => { assert.equal(id, 123); cleared = true; };
  const stuck = childProcess();
  try {
    const closing = closeInstaller({ child: stuck, connection: { command: async () => ({}) } });
    expire(); await closing;
    assert.equal(stuck.killed, 1); assert.equal(cleared, true); assert.equal(stuck.listenerCount('exit'), 0);
  } finally { global.setTimeout = set; global.clearTimeout = clear; }

  assert.equal(extensionPathKey('C:\\Tools\\Extension', 'win32'), extensionPathKey('c:\\tools\\extension', 'win32'));
  assert.notEqual(extensionPathKey('/tmp/Extension', 'linux'), extensionPathKey('/tmp/extension', 'linux'));
  const wantedPath = path.resolve('Extension'), oldPath = path.resolve('extension');
  let extensions = [{ id: 'old', path: oldPath, enabled: true }];
  const commands = [];
  const connection = { async command(method, params = {}) {
    commands.push(method);
    if (method === 'Extensions.getExtensions') return { extensions: extensions.map((item) => ({ ...item })) };
    if (method === 'Extensions.uninstall') extensions = extensions.filter((item) => item.id !== params.id);
    if (method === 'Extensions.loadUnpacked') { extensions.push({ id: 'new', path: params.path, enabled: true }); return { id: 'new' }; }
    return {};
  } };
  const result = await reconcileOnConnection(connection, [{ id: 'assigned', path: wantedPath }], [wantedPath, oldPath]);
  if (process.platform === 'win32') {
    assert.equal(result.installed[0].chromeExtensionId, 'old');
    assert.equal(commands.includes('Extensions.uninstall'), false);
  } else {
    assert.equal(result.installed[0].chromeExtensionId, 'new');
    assert.equal(commands.filter((method) => method === 'Extensions.uninstall').length, 1);
  }
  console.log('EXTENSION_PIPE_SELFTEST OK (frames, serialization, EOF, write failure, exit race, timeout, platform path identity)');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
