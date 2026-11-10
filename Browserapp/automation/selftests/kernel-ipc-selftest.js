'use strict';

const assert = require('node:assert/strict');
const { registerKernelIpc } = require('../../main/kernel-ipc');

async function main() {
  const handlers = new Map();
  const calls = [];
  const record = (method) => (...args) => { calls.push([method, ...args]); return method; };
  const engine = {
    kernelStatus: record('status'), ensureIndependentKernel: record('download'),
    checkKernelUpdate: record('update'), setCustomKernel: record('custom'),
    setKernelPolicy: record('policy'), kernelDelete: record('delete'),
    kernelCheck: record('check'), kernelCancelDownload: record('cancel'),
    kernelManager: Object.fromEntries([
      'listFirefoxVersions', 'listChromiumVersions', 'installFirefoxVersion', 'installChromiumVersion',
      'listInstalledKernels', 'pinKernel', 'clearPin',
    ].map((method) => [method, record(method)])),
  };
  let chosen = { canceled: true, filePaths: [] };
  let dialogOptions;
  registerKernelIpc({
    registerTrustedIpc(channel, handler) {
      assert.equal(handlers.has(channel), false, 'each channel registers once through the trusted host callback');
      handlers.set(channel, handler);
    },
    engine, platform: 'win32',
    dialog: { async showOpenDialog(options) { dialogOptions = options; return chosen; } },
  });
  const invoke = (name, ...args) => handlers.get(`kernel:${name}`)(null, ...args);
  assert.deepEqual([...handlers.keys()].sort(), [
    'status', 'download', 'check-update', 'set-custom', 'policy', 'list-versions', 'install-version',
    'list-installed', 'delete', 'check', 'cancel-download', 'pin', 'unpin', 'choose-custom',
  ].map((name) => `kernel:${name}`).sort());
  assert.equal(invoke('status'), 'status');
  await invoke('download', 0); assert.deepEqual(calls.at(-1), ['download', false]);
  await invoke('check-update'); assert.deepEqual(calls.at(-1), ['update']);
  await invoke('set-custom', 123); assert.deepEqual(calls.at(-1), ['custom', '123']);
  await invoke('policy', null); assert.deepEqual(calls.at(-1), ['policy', {}]);
  for (const family of ['firefox', 'chromium']) {
    const prefix = family === 'firefox' ? 'Firefox' : 'Chromium';
    await invoke('list-versions', family, 1);
    assert.deepEqual(calls.at(-1), [`list${prefix}Versions`, { refresh: true }]);
    await invoke('install-version', family, ' 148 ');
    assert.deepEqual(calls.at(-1), [`install${prefix}Version`, '148']);
    for (const action of ['delete', 'check', 'pin']) {
      await invoke(action, family, ' 148 ');
      assert.deepEqual(calls.at(-1), action === 'pin' ? ['pinKernel', { engine: family, version: '148' }] : [action, family, '148']);
    }
  }
  for (const action of ['delete', 'check', 'pin']) {
    await assert.rejects(invoke(action, 'unknown', '148'), /Unknown engine/);
  }
  await assert.rejects(invoke('install-version', 'chromium', '  '), /Missing version/);
  assert.equal(invoke('list-installed'), 'listInstalledKernels');
  assert.equal(invoke('cancel-download'), 'cancel');
  assert.equal(await invoke('unpin'), 'clearPin');
  assert.deepEqual(await invoke('choose-custom'), { canceled: true });
  assert.deepEqual(dialogOptions.filters, [{ name: 'Executable', extensions: ['exe'] }]);
  chosen = { canceled: false, filePaths: ['/selected/browser'] };
  assert.deepEqual(await invoke('choose-custom'), { canceled: false, kernel: 'custom' });
  assert.deepEqual(calls.at(-1), ['custom', '/selected/browser']);
  console.log('KERNEL_IPC_SELFTEST OK (trusted registration, all channels, family routing, validation, dialog)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
