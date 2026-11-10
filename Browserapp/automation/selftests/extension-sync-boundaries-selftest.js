'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const cdp = require('../../cdp');
const { LiveSyncController } = require('../../live-sync-v5');
const { extensionIdFromPath } = require('../sync/extension-pages');
const allowed = 'a'.repeat(32), other = 'b'.repeat(32);
const tab = (id, host = allowed, page = 'index.html') => ({ id, url: `chrome-extension://${host}/${page}`, webSocketDebuggerUrl: `ws://${id}` });

async function main() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-extension-sync-'));
  const original = cdp.PersistentConnection;
  try {
    const file = path.join(temp, 'manifest.json');
    await fs.writeFile(file, JSON.stringify({ key: 'YWJj' }));
    let assigned = [{ path: temp }];
    const running = { loadedExtensions: [{ id: allowed, path: temp, enabled: true }, { id: other, path: temp + '-unassigned', enabled: true }] };
    const engine = { running: new Map([['master', running]]), assignedExtensions: () => assigned, on: () => () => {} };
    const controller = new LiveSyncController(engine, () => {});
    controller.master = { id: 'master', item: { port: 1 } };
    controller.slaves = [{ id: 'slave', port: 2 }];
    assert.deepEqual([...controller.masterExtensionWhitelist()], [allowed], 'loaded but unassigned extensions cannot authorize capture');
    running.loadedExtensions = [];
    assert.equal(controller.cachedExtensionKeyId(assigned[0]), 'lkhibglpipabmpokebebeanofnkocccd', 'manifest key hashes decoded bytes and uses a-p alphabet');
    const stat = await fs.stat(file);
    await fs.writeFile(file, JSON.stringify({ key: 'YWJjZA==', description: 'updated' }));
    await fs.utimes(file, stat.atime, stat.mtime);
    assert.notEqual(controller.cachedExtensionKeyId(assigned[0]), 'lkhibglpipabmpokebebeanofnkocccd', 'a preserved mtime alone does not keep a stale identity');
    await fs.writeFile(file, '{}');
    assert.equal(controller.cachedExtensionKeyId(assigned[0]), extensionIdFromPath(temp), 'unkeyed assignments use Chromium path identity');
    assert.equal(extensionIdFromPath('c:\\Extensions\\测试', 'win32'), 'pnkefedjndpfkfjpmkahgoliboggjnkl');
    assert.notEqual(extensionIdFromPath('/tmp/Case', 'linux'), extensionIdFromPath('/tmp/case', 'linux'));
    assigned = []; controller.masterExtensionWhitelist();
    assert.equal(controller.extensionManifestCache.size, 0, 'removed assignments do not retain manifest cache entries');

    let closed = 0; const attached = [];
    controller.attachExtensionPage = async (value) => { attached.push(value.id); };
    controller.extensionConnections.set('foreign', { connection: { socket: { readyState: 1 }, close() { closed += 1; } } });
    await controller.refreshExtensionConnections([tab('foreign', other)], new Map());
    assert.equal(closed, 1); assert.deepEqual(attached, [], 'empty whitelist denies all extension pages');
    assigned = [{ path: temp }]; running.loadedExtensions = [{ id: allowed, path: temp }];
    const count = 200;
    let reads = 0, identityReads = 0;
    const masters = Array.from({ length: count }, (_, i) => ({ ...tab('m' + i), get url() { reads += 1; return `chrome-extension://${allowed}/p${i}.html`; } }));
    const slaves = Array.from({ length: count }, (_, i) => ({ ...tab('s' + i),
      get id() { identityReads += 1; return 's' + i; },
      get url() { reads += 1; return `chrome-extension://${allowed}/p${i}.html`; } }));
    await controller.refreshExtensionConnections(masters, new Map([['slave', slaves]]));
    assert.equal(attached.length, count);
    assert.equal(new Set([...controller.extensionMap.values()].map((mapping) => mapping.get('slave').id)).size, count);
    assert.ok(reads < count * 30, 'exact page mapping indexes targets once per refresh');
    assert.ok(identityReads < count * 20, 'each master page must not re-filter every slave target');
    controller.extensionConnections.set('m0', { connection: { socket: { readyState: 1 }, close() { closed += 1; } } });
    assigned = [];
    await controller.refreshExtensionConnections(masters, new Map([['slave', slaves]]));
    assert.equal(closed, 2, 'revoking assignments closes existing capture even when the page remains open');
    assert.equal(controller.extensionMap.size, 0);

    class SlowConnection {
      static instances = [];
      constructor(url, options) { this.url = url; this.options = options; this.commands = []; this.closeCount = 0; SlowConnection.instances.push(this); }
      open() { return new Promise((resolve) => { this.release = resolve; }); }
      command(method) { this.commands.push(method); return Promise.resolve({}); }
      close() { this.closeCount += 1; }
    }
    cdp.PersistentConnection = SlowConnection;
    const lifecycle = new LiveSyncController(engine, () => {});
    assigned = [{ path: temp }];
    lifecycle.master = { id: 'master', item: { port: 1 } };
    const oldAttach = lifecycle.attach({ id: 'page', url: 'https://example.test', webSocketDebuggerUrl: 'ws://page' });
    const oldExtension = lifecycle.attachExtensionPage(tab('extension'));
    const pending = SlowConnection.instances.slice();
    assert.equal(lifecycle.pendingAttachments.size, 2);
    lifecycle.stop();
    assert.ok(pending.every((connection) => connection.closeCount >= 1), 'stop immediately closes handshakes, not only established connections');
    lifecycle.master = { id: 'new-master', item: { port: 3 } };
    for (const connection of pending) connection.release(connection);
    await Promise.all([oldAttach, oldExtension]);
    assert.equal(lifecycle.connections.size, 0, 'late opens cannot repopulate a restarted session');
    assert.equal(lifecycle.extensionConnections.size, 0);
    assert.ok(pending.every((connection) => connection.commands.length === 0), 'stale sessions cannot inject into a new session');
    assert.equal(lifecycle.pendingAttachments.size, 0);
    console.log('EXTENSION_SYNC_BOUNDARIES_SELFTEST OK (assignments, revocation, key/path identities, cache, indexed mapping, stop/restart races)');
  } finally { cdp.PersistentConnection = original; await fs.rm(temp, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
