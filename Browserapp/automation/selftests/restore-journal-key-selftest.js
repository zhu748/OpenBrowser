'use strict';

const assert = require('node:assert/strict');
const { createCipheriv, randomBytes, scryptSync } = require('node:crypto');
const nodeFs = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const credentials = require('../../credential-crypto');
const { readRestoreState } = require('../cloud/restore-state');

const claimId = '0123456789abcdef0123456789abcdef';
const journalName = 'cloud-restore-pending.obstate';
const syntheticKey = 'synthetic test value for the local journal key';
const state = (phase, claimed = true) => ({
  version: 1, phase, profiles: [], records: [], groups: [], proxies: null,
  ...(claimed ? { claimId } : {}),
});
const modern = (value, key = syntheticKey) => credentials.encryptCredential(JSON.stringify(value), { passphrase: key });

async function fixture(t) {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'ob-restore-journal-key-')));
  const workspace = path.join(root, 'workspace');
  await fs.mkdir(workspace);
  const originalKey = process.env.OPENBROWSER_MASTER_KEY;
  const originalPath = process.env.OPENBROWSER_MASTER_KEY_FILE;
  const keyDir = path.join(root, 'key-home');
  const keyFile = path.join(keyDir, 'existing.key');
  delete process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY_FILE = keyFile;
  credentials.resetLocalMasterKeyCache();
  const file = path.join(workspace, journalName);
  const engine = { app: { getPath: () => workspace } };
  t.after(async () => {
    if (originalKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = originalKey;
    if (originalPath === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = originalPath;
    credentials.resetLocalMasterKeyCache();
    credentials.setSafeStorageMock(null);
    await fs.rm(root, { recursive: true, force: true });
  });
  return {
    root, workspace, keyDir, keyFile, file, engine,
    async key(value = syntheticKey) {
      await fs.mkdir(keyDir, { recursive: true });
      await fs.writeFile(keyFile, value, { mode: 0o600 });
    },
    async journal(primary, backup) {
      await fs.writeFile(file, primary);
      if (backup) await fs.writeFile(file + '.bak', backup);
    },
    async assertEvidence(primary, backup) {
      assert.deepEqual(await fs.readFile(file), primary);
      assert.deepEqual((await fs.readdir(workspace)).sort(), backup ? [journalName, journalName + '.bak'] : [journalName]);
      if (backup) assert.deepEqual(await fs.readFile(file + '.bak'), backup);
    },
  };
}

function recoveryRequired(error) {
  assert.equal(error.code, 'CLOUD_RECOVERY_REQUIRED');
  assert.doesNotMatch(error.message, /fixture|existing\.key|key-home|ob-restore-journal-key-/);
  return true;
}

test('valid modern journal with no available fallback key does not create one or its directory', async t => {
  const f = await fixture(t);
  const primary = modern(state('pending'));
  const backup = modern(state('prepare'));
  await f.journal(primary, backup);
  for (let repeat = 0; repeat < 2; repeat++) {
    await assert.rejects(readRestoreState(f.engine), error => recoveryRequired(error) && error.cause?.code === 'ENOENT');
    await assert.rejects(fs.lstat(f.keyFile), { code: 'ENOENT' });
    await assert.rejects(fs.lstat(f.keyDir), { code: 'ENOENT' });
    await f.assertEvidence(primary, backup);
  }
  // This guard is journal-specific: the ordinary encryption path may still
  // create a new workspace's local fallback key on its first real write.
  const ordinary = credentials.encryptCredential('ordinary first write');
  assert.ok((await fs.stat(f.keyFile)).isFile());
  assert.equal(credentials.decryptCredential(ordinary), 'ordinary first write');
  await f.assertEvidence(primary, backup);
});

test('an earlier cached key does not authorize reading with a missing, inaccessible or replaced key file', async t => {
  for (const problem of ['ENOENT', 'EACCES', 'replaced']) await t.test(problem, async t => {
    const f = await fixture(t);
    const primary = modern(state('committed'));
    await f.journal(primary);
    await f.key();
    assert.equal(credentials.getLocalMasterKey(), syntheticKey);
    const rootBefore = await fs.readdir(f.root);
    if (problem === 'ENOENT') await fs.unlink(f.keyFile);
    if (problem === 'replaced') await f.key('synthetic but not the old committed key');
    if (problem === 'EACCES') {
      const read = nodeFs.readFileSync;
      t.mock.method(nodeFs, 'readFileSync', (file, ...args) => {
        if (file === f.keyFile) throw Object.assign(new Error('private fixture path detail'), { code: 'EACCES' });
        return read(file, ...args);
      });
    }
    const keyBefore = await fs.readFile(f.keyFile).catch(error => {
      if (problem === 'ENOENT' && error.code === 'ENOENT') return null;
      throw error;
    });
    await assert.rejects(readRestoreState(f.engine), error => recoveryRequired(error)
      && (problem === 'replaced' || error.cause?.code === problem));
    assert.deepEqual(await fs.readdir(f.root), rootBefore);
    if (keyBefore) assert.deepEqual(await fs.readFile(f.keyFile), keyBefore);
    else await assert.rejects(fs.lstat(f.keyFile), { code: 'ENOENT' });
    await f.assertEvidence(primary);
  });
});

test('a key access failure reading the claimed backup cannot be hidden by the primary decrypt', async t => {
  const f = await fixture(t);
  const primary = modern(state('committed'));
  const backup = modern(state('pending'));
  await f.journal(primary, backup);
  await f.key();
  const before = await fs.readFile(f.keyFile);
  const actualRead = nodeFs.readFileSync;
  let reads = 0;
  t.mock.method(nodeFs, 'readFileSync', (file, ...args) => {
    if (file === f.keyFile && ++reads === 2) throw Object.assign(new Error('private fixture backup detail'), { code: 'EACCES' });
    return actualRead(file, ...args);
  });
  await assert.rejects(readRestoreState(f.engine), error => recoveryRequired(error) && error.cause?.code === 'EACCES');
  assert.equal(reads, 2);
  assert.deepEqual(await fs.readFile(f.keyFile), before);
  await f.assertEvidence(primary, backup);
});

test('matching current key opens pending and committed journals without modifying the key or evidence', async t => {
  for (const phase of ['pending', 'committed']) await t.test(phase, async t => {
    const f = await fixture(t);
    const primary = modern(state(phase));
    const backup = modern(state('prepare'));
    await f.key();
    const before = await fs.readFile(f.keyFile);
    await f.journal(primary, backup);
    assert.deepEqual(await readRestoreState(f.engine), state(phase));
    assert.deepEqual(await fs.readFile(f.keyFile), before);
    await f.assertEvidence(primary, backup);
  });
});

test('explicit key wins, but a wrong or empty explicit key never falls back to provisioning', async t => {
  const f = await fixture(t);
  const primary = modern(state('pending'));
  await f.journal(primary);
  await f.key();
  process.env.OPENBROWSER_MASTER_KEY = 'different synthetic explicit key';
  await assert.rejects(readRestoreState(f.engine), recoveryRequired);
  assert.equal(await fs.readFile(f.keyFile, 'utf8'), syntheticKey);
  await fs.unlink(f.keyFile);
  await fs.rmdir(f.keyDir);
  process.env.OPENBROWSER_MASTER_KEY = '  ';
  await assert.rejects(readRestoreState(f.engine), recoveryRequired);
  await assert.rejects(fs.lstat(f.keyDir), { code: 'ENOENT' });
  process.env.OPENBROWSER_MASTER_KEY = syntheticKey;
  assert.deepEqual(await readRestoreState(f.engine), state('pending'));
  await assert.rejects(fs.lstat(f.keyDir), { code: 'ENOENT' });
  await f.assertEvidence(primary);
});

test('legacy plaintext, legacy untagged OBE1 and OBS1 decrypt-only paths stay readable', async t => {
  for (const kind of ['plaintext', 'untagged', 'OBS1']) await t.test(kind, async t => {
    const f = await fixture(t);
    const value = state('pending', false);
    let payload = Buffer.from(JSON.stringify(value));
    if (kind === 'untagged') {
      await f.key();
      const salt = Buffer.alloc(16, 0xB4);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', scryptSync(syntheticKey, salt, 32), iv);
      const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
      payload = Buffer.concat([Buffer.from('OBE1'), salt, iv, cipher.getAuthTag(), encrypted]);
      assert.equal(credentials.isUnifiedSaltEnvelope(payload), false);
    } else if (kind === 'OBS1') {
      const nativeOpaque = Buffer.from('simulated OS ciphertext');
      payload = Buffer.concat([Buffer.from('OBS1'), nativeOpaque]);
      credentials.setSafeStorageMock({
        decryptString(bytes) { assert.deepEqual(bytes, nativeOpaque); return JSON.stringify(value); },
        isEncryptionAvailable() { assert.fail('must not probe native encryption'); },
        encryptString() { assert.fail('must not provision native encryption'); },
      });
    }
    await f.journal(payload);
    assert.deepEqual(await readRestoreState(f.engine), value);
    if (kind === 'untagged') assert.equal(await fs.readFile(f.keyFile, 'utf8'), syntheticKey);
    else await assert.rejects(fs.lstat(f.keyDir), { code: 'ENOENT' });
    await f.assertEvidence(payload);
  });
});
