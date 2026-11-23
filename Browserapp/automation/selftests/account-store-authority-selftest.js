'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { AccountStore } = require('../account-store');
const { encryptCredentialJson, isEncrypted } = require('../../credential-crypto');

const unknown = 'ACCOUNT_STORE_UNAVAILABLE';
const sample = id => ({ id, username: `Synthetic fixture ${id}`, createdAt: '2025-01-01T00:00:00Z' });
const fixtureBytes = () => encryptCredentialJson({ version: 1, accounts: [sample('existing')] });

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-account-authority-'));
  const previous = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  t.after(async () => {
    if (previous === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previous;
    await fs.rm(root, { recursive: true, force: true });
  });
  return { root, file: path.join(root, 'platform-accounts.enc') };
}

async function assertUnavailable(store, cause) {
  const error = await store.load().then(() => undefined, failure => failure);
  assert.equal(error?.code, unknown);
  if (cause) assert.equal(error.cause, cause);
  assert.throws(() => store.list(), e => e === error);
  await assert.rejects(store.import([sample('attempt')]), e => e === error);
}

async function assertSameBytes(file, bytes) {
  assert.ok((await fs.readFile(file)).equals(bytes), 'fixture contents must stay byte-for-byte intact');
}

function tryImportInFreshProcess(file, id) {
  const child = spawnSync(process.execPath, ['-e', `
    const { AccountStore } = require(process.argv[1]);
    const [file, id] = process.argv.slice(2);
    (async () => {
      const store = new AccountStore(file);
      await store.load();
      await store.import([{ id, username: 'Synthetic fixture', createdAt: '2025-01-01T00:00:00Z' }]);
      process.stdout.write('WROTE');
    })().catch(e => { process.stdout.write(e?.code ?? 'UNEXPECTED'); });
  `, require.resolve('../account-store'), file, id], { encoding: 'utf8', timeout: 8000 });
  assert.ifError(child.error);
  assert.equal(child.status, 0);
  return child.stdout;
}

test('an authenticated backup-only library cannot be replaced or refreshed by successive processes', { timeout: 12000 }, async t => {
  const { root, file } = await fixture(t);
  const store = new AccountStore(file);
  await store.load();
  await store.import([sample('older')]);
  await store.import([sample('newer')]);
  const backup = await fs.readFile(file + '.bak');
  const primary = await fs.readFile(file);
  const parked = path.join(root, 'unrelated-held-copy');
  assert.ok(isEncrypted(backup));
  assert.ok(!primary.equals(backup));
  await fs.rename(file, parked);

  const outcomes = ['first', 'second'].map(id => tryImportInFreshProcess(file, id));
  await assertSameBytes(file + '.bak', backup);
  await assertSameBytes(parked, primary);
  assert.deepEqual(outcomes, [unknown, unknown]);
  await assert.rejects(fs.stat(file), { code: 'ENOENT' });
});

for (const suffix of ['.tmp-321-0123456789abcdef', '.bak.tmp-321-fedcba9876543210']) {
  test(`primary absent with an exact account staging name (${suffix.startsWith('.bak') ? 'backup' : 'primary'})`, async t => {
    const { file } = await fixture(t);
    const bytes = fixtureBytes();
    await fs.writeFile(file + suffix, bytes);
    const read = fs.readFile;
    let evidenceReads = 0;
    fs.readFile = async (candidate, ...args) => {
      if (candidate === file + suffix) evidenceReads++;
      return read(candidate, ...args);
    };
    try {
      for (let attempt = 0; attempt < 2; attempt++) await assertUnavailable(new AccountStore(file));
    } finally { fs.readFile = read; }
    assert.equal(evidenceReads, 0, 'admission uses names only, never replays the stage');
    await assertSameBytes(file + suffix, bytes);
    await assert.rejects(fs.stat(file), { code: 'ENOENT' });
    await assert.rejects(fs.stat(file + '.bak'), { code: 'ENOENT' });
  });
}

for (const code of ['EIO', 'EACCES']) {
  test(`uncertain directory ${code} is not virgin and a later successful retry is admissible`, async t => {
    const { root, file } = await fixture(t);
    const unrelated = path.join(root, 'another-component.enc');
    const bytes = Buffer.from('Independent fixture');
    await fs.writeFile(unrelated, bytes);
    const store = new AccountStore(file);
    const failure = Object.assign(Error('Fixture directory inspection failed'), { code });
    const readdir = fs.readdir;
    fs.readdir = async (candidate, ...args) => {
      if (candidate === root) throw failure;
      return readdir(candidate, ...args);
    };
    try {
      await assertUnavailable(store, failure);
      await assertUnavailable(store, failure);
    } finally { fs.readdir = readdir; }
    await assertSameBytes(unrelated, bytes);
    await assert.rejects(fs.stat(file), { code: 'ENOENT' });
    await store.load();
    assert.deepEqual(store.list(), []);
    await store.import([sample('created-after-retry')]);
    const reopened = new AccountStore(file);
    await reopened.load();
    assert.equal(reopened.list()[0].id, 'created-after-retry');
  });
}

test('genuinely absent parent and unrelated sibling names still permit ordinary creation', async t => {
  const { root, file } = await fixture(t);
  const unrelated = [`${file}.backup`, `${file}.bak.other`, path.join(root, 'unrelated.tmp-321-0123456789abcdef')];
  await Promise.all(unrelated.map(name => fs.writeFile(name, 'Leave untouched')));
  for (const selected of [file, path.join(root, 'unused-directory', path.basename(file))]) {
    const store = new AccountStore(selected);
    await store.load();
    assert.deepEqual(store.list(), []);
    await store.import([sample('created')]);
    const reopened = new AccountStore(selected);
    await reopened.load();
    assert.equal(reopened.get('created').id, 'created');
  }
  for (const name of unrelated) assert.equal(await fs.readFile(name, 'utf8'), 'Leave untouched');
});

test('a valid primary retains authority even with a legitimate earlier encrypted backup', async t => {
  const { file } = await fixture(t);
  const store = new AccountStore(file);
  await store.load();
  await store.import([sample('old')]);
  await store.import([sample('newer')]);
  const main = await fs.readFile(file);
  const backup = await fs.readFile(file + '.bak');
  assert.ok(isEncrypted(main) && isEncrypted(backup) && !main.equals(backup));
  const reopened = new AccountStore(file);
  await reopened.load();
  assert.deepEqual(reopened.list().map(row => row.id), ['old', 'newer']);
  await assertSameBytes(file, main);
  await assertSameBytes(file + '.bak', backup);
  await reopened.import([sample('legitimate-write')]);
  assert.equal(reopened.list().length, 3);
});

for (const kind of ['appeared-backup', 'appeared-stage', 'appeared-primary', 'directory-eio']) {
  test(`bounded first creation recheck after virgin load: ${kind}`, async t => {
    const { root, file } = await fixture(t);
    const store = new AccountStore(file);
    await store.load();
    assert.deepEqual(store.list(), []);
    const evidence = kind === 'appeared-primary' ? file
      : kind === 'appeared-backup' ? file + '.bak'
        : kind === 'appeared-stage' ? file + '.tmp-654-0123456789abcdef' : null;
    const bytes = fixtureBytes();
    if (evidence) await fs.writeFile(evidence, bytes);
    const readdir = fs.readdir;
    const failure = Object.assign(Error('Fixture first creation inspection failed'), { code: 'EIO' });
    if (kind === 'directory-eio') fs.readdir = async (candidate, ...args) => {
      if (candidate === root) throw failure;
      return readdir(candidate, ...args);
    };
    let rejected;
    try {
      rejected = await store.import([sample('new')]).then(() => undefined, error => error);
      assert.equal(rejected?.code, unknown);
      if (!evidence) assert.equal(rejected.cause, failure);
      assert.throws(() => store.list(), error => error === rejected);
      await assert.rejects(store.import([sample('another')]), error => error === rejected);
    } finally { fs.readdir = readdir; }
    if (evidence) await assertSameBytes(evidence, bytes);
    if (kind !== 'appeared-primary') await assert.rejects(fs.stat(file), { code: 'ENOENT' });
    if (kind === 'appeared-primary') {
      // Reload only; no guessing what the new primary contains.
      await store.load();
      assert.equal(store.get('existing').id, 'existing');
    }
  });
}
