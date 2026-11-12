'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { BrowserEngine } = require('../../engine');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { commitProfilePatches } = require('../../ui/ui-profile-commands');
const { registerProfileIpc } = require('../../main/profile-ipc');
const { captureIpcResult } = require('../../shared/ipc-result');
const cc = require('../../credential-crypto');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-metadata-patches-'));
  const originalKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = 'isolated-metadata-patch-regression-fixture-key';
  cc.setSafeStorageMock({ isEncryptionAvailable: () => false });
  const engine = new BrowserEngine({ getPath: () => root });
  engine.sqliteStore = new ProfileStoreSqlite({ dbPath: engine.dbFile });
  engine.usingSqlite = true;
  try {
    await engine.sqliteStore.init();
    await engine.syncProfiles(Array.from({ length: 450 }, (_, n) => ({
      id: 'p-' + n, name: 'Environment ' + n, number: n + 1,
      cookies: 'secret-cookie-' + n,
      platform: { password: 'secret-password-' + n, accounts: [{ username: 'user', password: 'nested-secret' }] },
    })));
    const handlers = new Map();
    registerProfileIpc({ engine, registerTrustedIpc: (name, handler) => handlers.set(name, handler),
      sanitizeIds: (ids) => ids, beforeRemove() {} });
    const invoke = (commands, options) => handlers.get('profiles:apply-commands')({}, structuredClone(commands), options);
    const patches = [{ id: 'p-0', patch: { tag: 'new tag', groupId: 'group-a' } }, { id: 'p-1', patch: { note: 'new note' } }];
    const untouched = engine.profiles.get('p-449');
    let sanitizations = 0;
    const sanitize = engine.sanitizeProfile;
    engine.sanitizeProfile = function (...args) { sanitizations++; return sanitize.apply(this, args); };
    let publications = 0;
    await commitProfilePatches({ patches, rows: engine.status(),
      applyCommands: (commands, options) => {
        assert.ok(!JSON.stringify(commands).includes('secret-'), 'requests carry only requested metadata');
        return invoke(commands, options);
      },
      onCommitted(commands, rows) { publications++; assert.equal(commands.length, 2); assert.equal(rows.length, 2); },
    });
    assert.equal(publications, 1);
    assert.equal(sanitizations, 2, 'unselected profiles never enter the sanitizer');
    assert.equal(engine.profiles.get('p-449'), untouched);
    assert.equal(engine.profiles.get('p-0').cookies, 'secret-cookie-0');
    assert.equal(engine.profiles.get('p-0').platform.accounts[0].password, 'nested-secret');
    assert.equal(engine.sqliteStore.getProfile('p-1').note, 'new note');

    const staleRows = structuredClone(engine.status());
    engine.profiles.set('p-0', { ...engine.profiles.get('p-0'), name: 'concurrent edit' });
    await assert.rejects(commitProfilePatches({ patches, rows: staleRows, applyCommands: invoke,
      onCommitted() { throw new Error('stale batch cannot publish'); } }), { code: 'PROFILE_STALE_REV' });
    assert.equal(engine.profiles.get('p-0').name, 'concurrent edit');
    const revision = engine.profiles.revisionOf('p-0');
    for (const patch of [{ id: 'other' }, { cookies: '' }, { privacy: {} }, {}, { __proto__: null, constructor: {} }]) {
      await assert.rejects(engine.applyProfileCommands([{ kind: 'patch', id: 'p-0', baseRev: revision, patch }]), /Invalid profile metadata patch/);
    }
    await assert.rejects(commitProfilePatches({ patches: [patches[0], patches[0]], rows: engine.status(), applyCommands: invoke, onCommitted() {} }), /duplicate/);

    let accepted = 0, requests = 0;
    const batchPatches = engine.status().map((row) => ({ id: row.id, patch: { note: 'batch note' } }));
    await assert.rejects(commitProfilePatches({ patches: batchPatches, rows: engine.status(),
      applyCommands: (commands, options) => { requests++; assert.ok(commands.length <= 200); return invoke(commands, options); },
      onCommitted(commands) {
        accepted += commands.length;
        if (accepted === 200) engine.profiles.set('p-200', { ...engine.profiles.get('p-200'), name: 'late edit' });
      },
    }), { code: 'PROFILE_STALE_REV', completedCount: 200 });
    assert.equal(requests, 2, 'a conflict never retries an old draft or runs later chunks');
    assert.equal(accepted, 200, 'already-acknowledged chunks stay published');
    assert.equal(engine.profiles.get('p-199').note, 'batch note');
    assert.notEqual(engine.profiles.get('p-201').note, 'batch note', 'the entire stale chunk is rejected');

    requests = 0;
    await commitProfilePatches({ patches: batchPatches, rows: engine.status(),
      applyCommands: (commands, options) => { requests++; return invoke(commands, options); }, onCommitted() {},
    });
    assert.equal(requests, 3);
    assert.equal(engine.sqliteStore.getProfile('p-449').note, 'batch note');
    let publishes = 0;
    await assert.rejects(commitProfilePatches({ patches, rows: engine.status(),
      applyCommands: () => captureIpcResult(() => { throw new Error('disk failed'); }), onCommitted() { publishes++; },
    }), /disk failed/);
    assert.equal(publishes, 0, 'failed persistence cannot claim a successful UI commit');
    await assert.rejects(commitProfilePatches({ patches, rows: engine.status(),
      applyCommands: async () => [{ id: 'p-0', rev: 999 }, { id: 'p-0', rev: 999 }], onCommitted() { publishes++; },
    }), /Invalid profile patch result/);
    assert.equal(publishes, 0);
    console.log('PROFILE_METADATA_PATCHES_SELFTEST OK (real SQLite/IPC, scoped work, credentials, conflicts, chunking and publication)');
  } finally {
    await engine.flushPersistence();
    engine.sqliteStore.close();
    cc.setSafeStorageMock(null);
    if (originalKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = originalKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
