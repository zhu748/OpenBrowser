'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { BrowserEngine } = require('../../engine');
const { ProfileStoreSqlite } = require('../profile-store-sqlite');
const { persistProfileSync } = require('../../engine/profile-publication');
const { prepareProfileSync } = require('../../engine/profile-sync');
const credentialCrypto = require('../../credential-crypto');
const turn = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

function fixture(count = 2) {
  return Object.assign(Object.create(BrowserEngine.prototype), {
    profiles: new Map(Array.from({ length: count }, (_, n) => ['p' + n, { id: 'p' + n, name: 'Profile ' + n }])),
    extensions: new Map([['ext', { id: 'ext', name: 'Extension', path: 'fixture', storeId: 'store-id', source: 'chrome-store' }]]),
    preferIndependentKernel: true, allowSystemBrowserFallback: false, systemBrowserPath: '',
    assignments: new Map(), running: new Map(), networkInfo: new Map(), events: [],
    persist: async () => {}, emit(event) { this.events.push(event); }, publicRunning: () => ({ running: false }),
  });
}

async function main() {
  const engine = fixture();
  const original = new Set(['other']); engine.assignments.set('p0', original);
  engine.persist = async () => { throw new Error('disk failure'); };
  await assert.rejects(engine.assignExtension('ext', ['p0'], true), /disk failure/);
  assert.equal(engine.assignments.get('p0'), original, 'failed writes restore the original independent Set');
  assert.equal(original.has('ext'), false);
  await assert.rejects(engine.removeExtension('ext'), /disk failure/);
  assert.equal(engine.extensions.get('ext').storeId, 'store-id');
  engine.persist = async () => {};
  await assert.rejects(engine.assignExtension('ext', ['p0', 'missing'], true), { code: 'PROFILE_NOT_FOUND' });
  assert.equal(engine.assignments.get('p0'), original);
  engine.profileMaintenance = new Map([['p0', Symbol('restore')]]);
  await assert.rejects(engine.assignExtension('ext', ['p0'], true), { code: 'PROFILE_MAINTENANCE' });
  engine.profileMaintenance.clear();
  const gate = deferred(); let writes = 0;
  engine.persist = async () => { if (++writes === 1) await gate.promise; };
  const ids = ['p0']; const first = engine.assignExtension('ext', ids, true);
  ids[0] = 'missing';
  const second = engine.assignExtension('ext', ['p0'], false);
  await turn(); assert.equal(writes, 1);
  gate.resolve(); await Promise.all([first, second]);
  assert.equal(engine.assignments.get('p0').has('ext'), false); assert.equal(writes, 2);
  await engine.assignExtension('ext', ['p0'], false); assert.equal(writes, 2, 'no-op assignments do not write');

  // A failed profile and failed extension publication share assignment lineage.
  const overlap = fixture(1), profileWrite = deferred(), extensionWrite = deferred();
  const before = new Set(['original']); overlap.assignments.set('p0', before);
  let write = 0; overlap.persist = () => ++write === 1 ? profileWrite.promise : extensionWrite.promise;
  const profile = persistProfileSync(overlap, { profiles: new Map([['p0', { id: 'p0', name: 'Pending' }]]),
    assignments: new Map([['p0', new Set(['original', 'provisional'])]]), networkInvalidations: new Set() }).catch((error) => error);
  const extension = overlap.assignExtension('ext', ['p0'], true).catch((error) => error);
  await turn(); profileWrite.reject(new Error('profile failed')); await profile;
  extensionWrite.reject(new Error('extension failed')); await extension;
  assert.equal(overlap.assignments.get('p0'), before, 'overlapping failed domains restore their shared baseline');
  assert.equal(overlap.profiles.get('p0').name, 'Profile 0');

  const fleet = fixture(1201); let saves = 0; fleet.persist = async () => { saves += 1; };
  await fleet.setExtensionEnabledAll('ext', true);
  assert.equal(fleet.assignments.size, 1201); assert.equal(saves, 1);
  assert.equal(fleet.listExtensions()[0].enabledAll, true);
  await fleet.setExtensionEnabledAll('ext', true); assert.equal(saves, 1);
  const empty = fixture(0); await empty.setExtensionEnabledAll('ext', true);
  assert.equal(empty.listExtensions()[0].enabledAll, true);
  const staged = prepareProfileSync(empty, [{ id: 'new', name: 'New' }]);
  assert.equal(staged.assignments.get('new').has('ext'), true, 'global enable on an empty fleet applies to the first profile');

  const pinned = fixture(0);
  pinned.extensions.get('ext').builtIn = true;
  pinned.readExtension = async () => ({id:'ext',name:'Pinned',builtIn:false});
  await pinned.addExtension('fixture');
  assert.equal(pinned.extensions.get('ext').builtIn,true,'adding a built-in folder cannot downgrade its removal protection');
  await assert.rejects(pinned.removeExtension('ext'),/Built-in/);

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-ext-publication-'));
  const keyFile = process.env.OPENBROWSER_MASTER_KEY_FILE;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key'); credentialCrypto.resetLocalMasterKeyCache();
  const store = new ProfileStoreSqlite({ dbPath: path.join(root, 'state.db') });
  try {
    await store.init();
    const durable = fixture(1); durable.extensions.get('ext').path = root;
    durable.readExtension = async () => ({ id: 'path-derived-new-id', name: 'Reloaded', version: '2', path: root });
    await durable.reloadExtension('ext');
    assert.equal(durable.extensions.get('ext').storeId, 'store-id');
    assert.equal(durable.extensions.get('ext').source, 'chrome-store');
    assert.equal(durable.extensions.get('ext').id, 'ext', 'reload preserves the stable engine id even for legacy path hashes');
    durable.extensions.set('other', {id:'other',name:'Other',path:root});
    let reloadSaves = 0; durable.persist = async () => { reloadSaves += 1; };
    await durable.reloadAllExtensions(); assert.equal(reloadSaves, 1, 'reload-all uses one publication for multiple extensions');
    durable.extensions.delete('other');
    durable.persist = async () => store.saveEngineState(durable._engineStateSnapshot());
    await durable.assignExtension('ext', ['p0'], true);
    const saveAssignments = store.saveAssignmentsDiffed;
    store.saveAssignmentsDiffed = () => { throw new Error('transaction failed after extension deletion'); };
    await assert.rejects(durable.removeExtension('ext'), /transaction failed/);
    assert.equal(store.listExtensions().length, 1, 'failed remove rolls back the database and live metadata together');
    assert.equal(durable.extensions.has('ext'), true);
    assert.equal(durable.assignments.get('p0').has('ext'), true);
    store.saveAssignmentsDiffed = saveAssignments;
    await durable.removeExtension('ext');
    assert.equal(store.listExtensions().length, 0);
    assert.equal(store.getAssignments().get('p0')?.has('ext') || false, false);
    console.log('EXTENSION_PUBLICATION_SELFTEST OK (rollback, shared provenance, serialized writes, maintenance, metadata, 1201 profiles, empty-fleet defaults, SQLite atomic removal)');
  } finally {
    store.close();
    if (keyFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE; else process.env.OPENBROWSER_MASTER_KEY_FILE = keyFile;
    credentialCrypto.resetLocalMasterKeyCache(); await fs.rm(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
