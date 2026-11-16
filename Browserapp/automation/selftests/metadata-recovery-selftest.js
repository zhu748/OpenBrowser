'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { collectStorageDiagnostics } = require('../storage-diagnostics');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-metadata-recovery-'));
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'data.db') });
  try {
    await store.init();
    store.saveGroup({ id: 'g', name: 'Group' });
    store.saveExtension({ id: 'e', name: 'Extension' });
    store.setAssignments('p', ['e']);
    const bad = '{"secret":"must-not-enter-diagnostics",broken';
    store.db.prepare('UPDATE groups SET data = ? WHERE id = ?').run(bad, 'g');
    store.db.prepare('UPDATE extensions SET data = ? WHERE id = ?').run('null', 'e');
    assert.deepEqual(store.listGroups(), []);
    assert.deepEqual(store.listExtensions(), []);
    assert.equal(store.recordDecodeFailureReport().count, 2);
    assert.equal(Buffer.from(store.db.prepare('SELECT raw_data FROM record_decode_failures WHERE kind = ?').get('group').raw_data).toString(), bad);
    const diagnostics = collectStorageDiagnostics({ engine: { sqliteStore: store } });
    assert.ok(diagnostics.warnings.some(row => row.code === 'METADATA_DECODE_FAILED' && row.count === 2));
    assert.ok(!JSON.stringify(diagnostics).includes('must-not-enter-diagnostics'));
    assert.throws(() => store.exportEngineState(), { code: 'STORAGE_DECODE_FAILED' });
    store.replaceExtensions([]);
    assert.equal(store.db.prepare('SELECT count(*) AS n FROM extensions').get().n, 1, 'bulk persistence must retain quarantined rows');
    assert.deepEqual([...store.getAssignments().get('p')], ['e']);
    store.close();
    await store.init();
    assert.equal(store.recordDecodeFailureReport().count, 2, 'quarantine survives reopening');
    store.saveGroup({ id: 'g', name: 'Repaired group' });
    store.saveExtension({ id: 'e', name: 'Repaired extension' });
    assert.equal(store.exportEngineState().extensions[0].name, 'Repaired extension');
    assert.equal(store.recordDecodeFailureReport().count, 0);
    store.db.prepare('UPDATE groups SET data = ? WHERE id = ?').run('{"id":"another-record"}', 'g');
    store.listGroups();
    assert.equal(store.recordDecodeFailureReport().count, 1, 'mismatched identities are quarantined');
    store.deleteGroup('g');
    assert.equal(store.recordDecodeFailureReport().count, 0, 'explicit deletion clears the active warning');
    console.log('METADATA_RECOVERY OK (raw preservation, diagnostics, export guard, bulk-save protection, restart, repair, explicit delete)');
  } finally { store.close(); await fs.rm(root, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
