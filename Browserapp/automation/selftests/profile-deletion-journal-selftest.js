'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { BrowserEngine } = require('../../engine');

async function addProfile(engine, id) {
  await engine.syncProfiles([{ id, name: id }]);
  await fs.mkdir(engine.profileRoot(id), { recursive: true });
  await fs.writeFile(path.join(engine.profileRoot(id), 'browser-data'), id);
}

async function interrupted(engine, id) {
  const stage = await fs.mkdtemp(path.join(engine.profileDataRootPath, '.openbrowser-delete-'));
  await fs.writeFile(path.join(stage, 'journal.json'), JSON.stringify({ version: 1, ids: [id] }));
  await fs.rename(engine.profileRoot(id), path.join(stage, id));
  return stage;
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-profile-deletion-'));
  const create = () => new BrowserEngine({ getPath: () => root });
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  let engine = create();
  try {
    await engine.init(null);
    for (const id of ['first', 'second', 'committed']) await addProfile(engine, id);
    const original = engine.sqliteStore.deleteProfiles;
    engine.sqliteStore.deleteProfiles = () => { throw Object.assign(Error('injected database failure'), { code: 'SQLITE_IOERR' }); };
    try { await assert.rejects(engine.deleteProfiles(['first', 'second']), /injected database failure/); }
    finally { engine.sqliteStore.deleteProfiles = original; }
    for (const id of ['first', 'second']) {
      assert.equal(engine.sqliteStore.hasProfile(id), true);
      assert.equal(engine.profiles.has(id), true);
      assert.equal(await fs.readFile(path.join(engine.profileRoot(id), 'browser-data'), 'utf8'), id);
    }

    const rename = fs.rename;
    fs.rename = async (source, destination) => {
      if (source === engine.profileRoot('second')) throw Error('injected staging failure');
      return rename(source, destination);
    };
    try { await assert.rejects(engine.deleteProfiles(['first', 'second']), /injected staging failure/); }
    finally { fs.rename = rename; }
    assert.equal(await fs.readFile(path.join(engine.profileRoot('first'), 'browser-data'), 'utf8'), 'first');

    const uncommitted = await interrupted(engine, 'first');
    const committed = await interrupted(engine, 'committed');
    engine.sqliteStore.deleteProfiles(['committed']);
    engine.sqliteStore.close();
    engine = create();
    await engine.init(null);
    assert.equal(await fs.readFile(path.join(engine.profileRoot('first'), 'browser-data'), 'utf8'), 'first');
    assert.equal(engine.profiles.has('committed'), false);
    for (const stage of [committed, uncommitted]) await assert.rejects(fs.stat(stage), { code: 'ENOENT' });
    const store = engine.sqliteStore, deleteRows = store.deleteProfileRows;
    store.deleteProfileRows = function (ids) {
      assert.equal(this.db.prepare('PRAGMA synchronous').get().synchronous, 2);
      return deleteRows.call(this, ids);
    };
    assert.equal((await engine.purgeProfiles(['first'])).deleted, 1);
    assert.equal(store.db.prepare('PRAGMA synchronous').get().synchronous, 1);
    await assert.rejects(fs.stat(engine.profileRoot('first')), { code: 'ENOENT' });
    assert.equal(engine.sqliteStore.hasProfile('first'), false);

    await engine.trashProfiles(['second']);
    const selection = { trashedAtById: { second: engine.profiles.get('second').trashedAt },
      revisions: engine.profiles.revisionState(['second']) };
    await engine.restoreProfiles(['second']);
    assert.equal((await engine.purgeTrashedProfiles(['second'], true, selection)).deleted, 0);
    await engine.trashProfiles(['second']);
    assert.equal((await engine.purgeTrashedProfiles(['second'], true, selection)).deleted, 0, 're-trashed window requires a new selection');

    const trash = Array.from({ length: 200 }, (_, i) => ({ id: `trash-${i}`, name: `Trash ${i}`, trashed: true }));
    await engine.restoreProfiles(['second']);
    await engine.syncProfiles(trash);
    await addProfile(engine, 'last');
    await engine.trashProfiles(['last']);
    const purge = engine.purgeTrashedProfiles.bind(engine);
    const { promise: firstBatchDeleted, resolve: signalFirstBatch } = Promise.withResolvers();
    const { promise: resume, resolve: resumePurge } = Promise.withResolvers();
    engine.purgeTrashedProfiles = async (...args) => {
      const result = await purge(...args);
      if (args[0].length === 200) {
        signalFirstBatch();
        await resume;
      }
      return result;
    };
    const clearing = engine.emptyTrash();
    try {
      await Promise.race([firstBatchDeleted, clearing]);
      assert.equal((await engine.restoreProfiles(['last'])).restored, 1);
    } finally { resumePurge(); }
    assert.equal((await clearing).deleted, 200);
    assert.equal(store.getProfile('last').trashed, false);
    assert.equal(await fs.readFile(path.join(engine.profileRoot('last'), 'browser-data'), 'utf8'), 'last');

    const legacy = new BrowserEngine({ getPath: () => path.join(root, 'legacy') });
    await addProfile(legacy, 'legacy');
    fs.rename = async (source, destination) => {
      if (destination === legacy.stateFile) throw Error('injected JSON failure');
      return rename(source, destination);
    };
    try { await assert.rejects(legacy.purgeProfiles(['legacy']), /injected JSON failure/); }
    finally { fs.rename = rename; }
    assert.equal(legacy.profiles.has('legacy'), true);
    assert.equal(await fs.readFile(path.join(legacy.profileRoot('legacy'), 'browser-data'), 'utf8'), 'legacy');
    await legacy.purgeProfiles(['legacy']);
    assert.equal(legacy.profiles.has('legacy'), false);
    console.log('PROFILE DELETION JOURNAL OK (SQLite and JSON failures, batch rollback, both startup recovery outcomes)');
  } finally {
    engine.sqliteStore?.close();
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
