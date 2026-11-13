'use strict';

const assert = require('node:assert/strict');
const { registerExtensionIpc } = require('../../main/extensions-ipc');

function fixture() {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'bad-stop', 'blocked', 'starting', 'missing'];
  const profiles = new Map(ids.map((id) => [id, { id }]));
  const running = new Map(ids.map((id) => [id, { id }]));
  const calls = { stops: [], starts: [], assignments: [], stopActive: 0, startActive: 0, maxStops: 0, maxStarts: 0 };
  const engine = {
    profiles, running, starting: new Map([['starting', {}]]),
    listExtensions: () => [{ id: 'ext' }],
    status: () => ids.map((id) => ({ id, running: running.has(id) })),
    assignExtension: async (...args) => { calls.assignments.push(args); return { success: true, restartRequired: args[1].filter((id) => running.has(id)) }; },
    setExtensionEnabledAll: async (id, enabled) => {
      const selected = [...profiles.keys()]; calls.assignments.push([id, selected, enabled]);
      return { affected: selected.length, restartRequired: selected.filter((id) => running.has(id)) };
    },
    stop: async (id) => {
      calls.stops.push(id);
      calls.maxStops = Math.max(calls.maxStops, ++calls.stopActive);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1));
        if (id === 'bad-stop') throw new Error('cannot stop');
        if (id === 'blocked') return { cleanupBlocked: true, running: true };
        running.delete(id);
        if (id === 'missing') profiles.delete(id);
        return { running: false };
      } finally { calls.stopActive -= 1; }
    },
    start: async (profile) => {
      calls.starts.push(profile.id);
      calls.maxStarts = Math.max(calls.maxStarts, ++calls.startActive);
      await new Promise((resolve) => setTimeout(resolve, 1));
      calls.startActive -= 1;
      running.set(profile.id, { id: profile.id });
    },
    addExtension: async () => ({ id: 'folder' }),
    addStoreExtension: async (_url, fetchPackage) => {
      if (!fetchPackage) throw new Error('direct unavailable');
      await fetchPackage('https://example.test/package');
      return { id: 'store' };
    },
    reloadAllExtensions: async () => 'all', reloadExtension: async (id) => id,
    removeExtension: async (id) => ({ id }),
  };
  const handlers = new Map();
  const downloads = [];
  registerExtensionIpc({
    registerTrustedIpc: (channel, handler) => { assert.equal(handlers.has(channel), false); handlers.set(channel, handler); },
    engine, dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
    sanitizeIds: (values) => [...new Set(values.map(String))],
    fetchStorePackage: async (...args) => { downloads.push(args); return Buffer.alloc(0); },
  });
  return { handlers, engine, calls, downloads };
}

async function main() {
  const { handlers, calls } = fixture();
  assert.deepEqual([...handlers.keys()], ['extensions:list', 'extensions:add-folder', 'extensions:add-store',
    'extensions:assign', 'extensions:toggle-all', 'extensions:reload', 'extensions:remove']);
  assert.deepEqual(await handlers.get('extensions:add-folder')(), { canceled: true });
  const warn = console.warn;
  console.warn = () => {};
  let result;
  try { result = await handlers.get('extensions:toggle-all')(null, { extensionId: 'ext', enabled: true }); }
  finally { console.warn = warn; }
  assert.equal(result.restarted, 6);
  assert.equal(result.affected, 10);
  assert.equal(result.partial, true);
  assert.deepEqual(result.restartFailures.map((entry) => entry.id).sort(), ['bad-stop', 'blocked']);
  assert.deepEqual(result.restartSkipped.map((entry) => entry.id).sort(), ['missing', 'starting']);
  assert.equal(calls.maxStops, 4);
  assert.equal(calls.maxStarts, 3);
  assert.deepEqual([...calls.starts].sort(), ['a', 'b', 'c', 'd', 'e', 'f']);
  assert.equal(await handlers.get('extensions:reload')(null, 'all'), 'all');
  assert.equal(await handlers.get('extensions:reload')(null, 'ext'), 'ext');

  const store = fixture();
  const installed = await store.handlers.get('extensions:add-store')(null, { url: 'store-url', profileIds: ['a', 'a'], restart: false });
  assert.equal(installed.assigned, 1);
  assert.equal(installed.restarted, 0);
  assert.deepEqual(store.downloads, [['https://example.test/package', 'system']]);
  assert.deepEqual(store.calls.assignments, [['store', ['a'], true]]);
  const rapid = fixture();
  console.warn = () => {};
  try {
    await Promise.all([rapid.handlers.get('extensions:toggle-all')(null, {extensionId:'ext',enabled:true}),
      rapid.handlers.get('extensions:toggle-all')(null, {extensionId:'ext',enabled:false})]);
    assert.equal(rapid.calls.maxStops,4,'rapid toggles share the full stop/restart lane');
    assert.equal(rapid.calls.maxStarts,3);
  } finally { console.warn = warn; }
  console.log('EXTENSIONS_IPC_SELFTEST OK (trusted registration, bounded restart, incomplete stop, download fallback)');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
