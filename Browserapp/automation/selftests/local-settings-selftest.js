'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const settings = require('../local-settings');
const crypto = require('../../credential-crypto');

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-settings-'));
  const file = path.join(root, 'settings.json');
  const originalRename = fs.rename;
  const originalKeyFile = process.env.OPENBROWSER_MASTER_KEY_FILE;
  const keepAlive = setInterval(() => {}, 1000);
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  crypto.resetLocalMasterKeyCache();
  try {
    settings.initLocalSettings({ file, defaultProfileDataRoot: path.join(root, 'profiles') });
    await settings.loadLocalSettings();

    let release;
    const blocked = new Promise((resolve) => { release = resolve; });
    let started;
    const writing = new Promise((resolve) => { started = resolve; });
    let blockOnce = true;
    fs.rename = async (...args) => {
      if (args[0] === file + '.tmp' && blockOnce) {
        blockOnce = false;
        started();
        await blocked;
      }
      return originalRename(...args);
    };

    const first = settings.saveLocalSettings({ memoryLimit: 81 });
    await writing;
    const second = settings.saveLocalSettings({ memoryLimit: 82 });
    release();
    await Promise.all([first, second]);
    await settings.flushSettingsWriter();
    const saved = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    assert.equal(saved.memoryLimit, 82, 'an edit during a write must reach disk');

    // A failed replacement must leave the last good settings readable.
    fs.rename = async (...args) => {
      if (args[0] === file + '.tmp') throw new Error('simulated rename failure');
      return originalRename(...args);
    };
    await assert.rejects(settings.saveLocalSettings({ memoryLimit: 83 }), /rename failure/);
    const retained = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    assert.equal(retained.memoryLimit, 82, 'failed replacement must preserve the old file');
    fs.rename = originalRename;
    await settings.flushSettingsWriter();
    const retried = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    assert.equal(retried.memoryLimit, 83, 'failed writes remain retryable');
    console.log('LOCAL_SETTINGS_SELFTEST OK (concurrent edits, atomic replacement, retry)');
  } finally {
    fs.rename = originalRename;
    if (originalKeyFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = originalKeyFile;
    crypto.resetLocalMasterKeyCache();
    clearInterval(keepAlive);
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
