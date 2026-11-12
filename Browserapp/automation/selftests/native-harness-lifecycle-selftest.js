'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { createRequire } = require('node:module');

async function scenario(stage) {
  const filename = require.resolve('./native-gate-harness');
  const realRequire = createRequire(filename), module = { exports: {} };
  let root, child, removals = 0, killed = 0, disconnected = 0;
  const injected = {
    'node:fs/promises': { ...fsp,
      async mkdtemp(prefix) { root = await fsp.mkdtemp(prefix); return root; },
      async readFile() {
        if (['injection', 'success', 'baseline'].includes(stage)) return '9222\n';
        throw Object.assign(new Error('not ready'), { code: 'ENOENT' });
      },
      async rm(...args) { removals += 1; await fsp.rm(...args); },
    },
    'node:child_process': {
      spawn() {
        child = Object.assign(new EventEmitter(), { pid: 123, exitCode: null, signalCode: null, stderr: new EventEmitter(),
          kill() { killed += 1; this.signalCode = 'SIGKILL'; this.emit('exit'); },
        });
        if (stage === 'spawn') {
          child.pid = undefined;
          queueMicrotask(() => child.emit('error', new Error('spawn failed')));
        }
        if (stage === 'exit') queueMicrotask(() => { child.exitCode = 1; child.emit('exit'); });
        return child;
      },
    },
    '../../engine/launch-arguments': { buildBaseLaunchArguments() {
      if (stage === 'arguments') throw new Error('argument build failed');
      return [];
    }, completeLaunchArguments(args) { return { args }; } },
    '../../engine/fingerprint-injection': { async startWorkerFingerprintInjection(item) {
      assert.notEqual(stage, 'baseline', 'the raw baseline must not install fingerprint patches');
      item.workerFingerprintConnection = { close() { disconnected += 1; } };
      if (stage === 'injection') throw new Error('injection failed');
    } },
  };
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    module, console, process, Buffer,
    require: (name) => Object.hasOwn(injected, name) ? injected[name] : realRequire(name),
    setTimeout: (callback, delay) => delay === 100 ? (queueMicrotask(callback), null) : setTimeout(callback, delay),
    clearTimeout,
  }, { filename });
  try {
    const launching = module.exports.launchPersonaBrowser({ binary: 'fake', version: '156' }, { profile: { id: 'test' }, fingerprint: {} },
      { injectFingerprint: stage !== 'baseline' });
    if (['success', 'baseline'].includes(stage)) {
      const session = await launching;
      assert.equal(fs.existsSync(root), true);
      await Promise.all([session.close(), session.close()]);
    } else {
      const messages = { arguments: /argument build failed/, spawn: /spawn failed/, exit: /exited before CDP/, timeout: /did not publish/, injection: /injection failed/ };
      await assert.rejects(launching, messages[stage]);
    }
    assert.equal(fs.existsSync(root), false, `${stage}: temporary browser profile must be removed`);
    assert.equal(removals, 1, `${stage}: cleanup runs exactly once`);
    assert.equal(killed, ['timeout', 'injection', 'success', 'baseline'].includes(stage) ? 1 : 0);
    assert.equal(disconnected, ['injection', 'success'].includes(stage) ? 1 : 0);
    if (child) assert.equal(child.listenerCount('exit'), 0);
  } finally { if (root) await fsp.rm(root, { recursive: true, force: true }); }
}

(async () => {
  for (const stage of ['arguments', 'spawn', 'exit', 'timeout', 'injection', 'success', 'baseline']) await scenario(stage);
  console.log('NATIVE_HARNESS_LIFECYCLE_SELFTEST OK 7/7');
})().catch((error) => { console.error(error); process.exitCode = 1; });
