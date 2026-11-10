'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-sqlite-noop-'));
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'data.db') });
  try {
    await store.init();
    const changes = () => store.db.prepare('SELECT total_changes() AS n').get().n;
    const extensions = [{ id: 'a', name: 'A', version: '1' }, { id: 'b', name: 'B', builtIn: true }];
    store.saveExtensions(extensions);
    store.setMeta('policy', { enabled: true });
    let before = changes();
    store.saveExtensions(extensions);
    store.setMeta('policy', { enabled: true });
    assert.equal(changes() - before, 0, 'unchanged metadata and extensions must not rewrite SQLite rows');

    extensions[0].name = 'Changed';
    before = changes();
    store.saveExtensions(extensions);
    store.setMeta('policy', null);
    assert.equal(changes() - before, 2, 'only changed extension and metadata rows are written');
    assert.equal(store.listExtensions().find((entry) => entry.id === 'a').name, 'Changed');
    assert.equal(store.getMeta('policy'), null);
    before = changes();
    store.setMeta('policy', null);
    assert.equal(changes(), before);

    store.saveExtensions([{ id: 'a', name: 'Superseded' }, extensions[0]]);
    assert.equal(store.listExtensions().find((entry) => entry.id === 'a').name, 'Changed', 'duplicate IDs retain last-write-wins semantics');
    store.deleteExtension('b');
    store.saveExtension(extensions[1]);
    assert.equal(store.listExtensions().length, 2, 'delete then recreate is never suppressed');
    store.close();
    await store.init();
    before = changes();
    store.saveExtensions(extensions);
    assert.equal(changes(), before, 'no-op detection works after reopening without a memory cache');
    console.log('SQLITE_NOOP_SELFTEST OK (unchanged rows, edits, null, duplicate IDs, reopen)');
  } finally {
    store.close();
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
