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
    await settings.saveLocalSettings({ memoryLimit: 79 });
    const queuedEdit = settings.saveLocalSettings({ memoryLimit: 80 });
    await settings.loadLocalSettings();
    await queuedEdit;
    assert.equal(settings.getLocalSettings().memoryLimit, 80, 'reload cannot overwrite an edit waiting for persistence');

    let replacements = 0;
    fs.rename = async (...args) => { if (args[0] === file + '.tmp') replacements += 1; return originalRename(...args); };
    try {
      const acknowledgements = await Promise.all(Array.from({length:20},(_,n)=>settings.saveLocalSettings({memoryLimit:80+n})));
      assert.equal(replacements,1,'a burst of settings edits shares one durable replacement');
      assert.equal(acknowledgements.every(value=>value.memoryLimit===99),true);
      assert.notEqual(acknowledgements[0],acknowledgements[1]);
      await settings.saveLocalSettings({memoryLimit:80});
    } finally { fs.rename = originalRename; }

    const originalRead = fs.readFile;
    let reads = 0;
    fs.readFile = async (...args) => { if (args[0] === file) reads += 1; return originalRead(...args); };
    try {
      await Promise.all(Array.from({ length: 20 }, () => settings.loadLocalSettings()));
      assert.equal(reads, 1, 'concurrent reloads share one read/decrypt operation');
    } finally { fs.readFile = originalRead; }

    let finishRead, enteredRead;
    const readGate = new Promise((resolve) => { finishRead = resolve; });
    const readStarted = new Promise((resolve) => { enteredRead = resolve; });
    let gateOnce = true;
    fs.readFile = async (...args) => {
      const raw = await originalRead(...args);
      if (args[0] === file && gateOnce) { gateOnce = false; enteredRead(); await readGate; }
      return raw;
    };
    try {
      const reload = settings.loadLocalSettings();
      await readStarted;
      const editDuringRead = settings.saveLocalSettings({ memoryLimit: 84 });
      finishRead();
      await Promise.all([reload, editDuringRead]);
      assert.equal(settings.getLocalSettings().memoryLimit, 84, 'an old disk read cannot replace newer settings');
    } finally { finishRead(); fs.readFile = originalRead; }

    // An external reload changes what is on disk, so the no-op write marker
    // must follow the newly loaded file rather than an earlier save.
    const external = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    external.memoryLimit = 85;
    await fs.writeFile(file, crypto.encryptCredential(JSON.stringify(external)));
    await settings.loadLocalSettings();
    assert.equal(settings.getLocalSettings().memoryLimit, 85);
    await settings.saveLocalSettings({ memoryLimit: 84 });
    assert.equal(JSON.parse(crypto.decryptCredential(await fs.readFile(file))).memoryLimit, 84,
      'saving an earlier value after reload must not be skipped');

    await fs.writeFile(file, '{broken settings');
    let quarantineEntered, finishQuarantine;
    const quarantineStarted = new Promise((resolve) => { quarantineEntered = resolve; });
    const quarantineGate = new Promise((resolve) => { finishQuarantine = resolve; });
    fs.rename = async (...args) => {
      if (args[0] === file && String(args[1]).includes('.corrupt-')) {
        quarantineEntered(); await quarantineGate;
      }
      return originalRename(...args);
    };
    let releaseTimer, duringQuarantine;
    try {
      const reload = settings.loadLocalSettings();
      await quarantineStarted;
      duringQuarantine = settings.saveLocalSettings({ memoryLimit: 86 });
      const order = await Promise.race([
        duringQuarantine.then(() => 'write overtook quarantine'),
        new Promise((resolve) => { releaseTimer = setTimeout(() => { finishQuarantine(); resolve('quarantine released'); }, 100); }),
      ]);
      finishQuarantine();
      await Promise.all([reload, duringQuarantine]);
      assert.equal(order, 'quarantine released', 'new writes must wait for an active quarantine');
      assert.equal(settings.getLocalSettings().memoryLimit, 86, 'a late corrupt-read reset cannot replace an edit');
      assert.equal(JSON.parse(crypto.decryptCredential(await fs.readFile(file))).memoryLimit, 86);
    } finally {
      clearTimeout(releaseTimer); finishQuarantine(); await duringQuarantine;
      fs.rename = originalRename;
    }

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
    const flushing = settings.flushSettingsWriter();
    await writing;
    const second = settings.saveLocalSettings({ memoryLimit: 82 });
    release();
    await flushing;
    const flushed = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    const [acknowledgedFirst, acknowledgedSecond] = await Promise.all([first, second]);
    assert.equal(acknowledgedFirst.memoryLimit, 81, 'first acknowledgement must not claim the later pending cache value');
    assert.equal(acknowledgedSecond.memoryLimit, 82);
    await settings.flushSettingsWriter();
    const saved = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    assert.equal(saved.memoryLimit, 82, 'an edit during a write must reach disk');
    assert.equal(flushed.memoryLimit, 82, 'quit flush must include edits arriving during its write');

    const groups = [{ id: 'group', name: 'Original' }];
    const cloneWrite = settings.saveLocalSettings({ uiGroups: groups });
    groups[0].name = 'Mutated by caller';
    const acknowledged = await cloneWrite;
    assert.equal(acknowledged.uiGroups[0].name, 'Original');
    acknowledged.uiGroups[0].name = 'Mutated acknowledgement';
    assert.equal(settings.getLocalSettings().uiGroups[0].name, 'Original', 'caller objects and acknowledgements do not alias the settings cache');

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
    console.log('LOCAL_SETTINGS_SELFTEST OK (reload/write races, shared reads, quit drain, atomic replacement, retry)');
  } finally {
    fs.rename = originalRename;
    if (originalKeyFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = originalKeyFile;
    crypto.resetLocalMasterKeyCache();
    clearInterval(keepAlive);
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
