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
  const originalKey = process.env.OPENBROWSER_MASTER_KEY;
  const originalKeyFile = process.env.OPENBROWSER_MASTER_KEY_FILE;
  const keepAlive = setInterval(() => {}, 1000);
  delete process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY_FILE = path.join(root, 'master.key');
  crypto.resetLocalMasterKeyCache();
  try {
    settings.initLocalSettings({ file, defaultProfileDataRoot: path.join(root, 'profiles') });
    assert.equal((await settings.loadLocalSettings()).profileDataRoot, path.join(root, 'profiles'));
    await assert.rejects(fs.access(file), { code: 'ENOENT' });
    await settings.saveLocalSettings({ memoryLimit: 79 });
    const queuedEdit = settings.saveLocalSettings({ memoryLimit: 80 });
    await settings.loadLocalSettings();
    await queuedEdit;
    assert.equal(settings.getLocalSettings().memoryLimit, 80, 'reload cannot overwrite an edit waiting for persistence');

    const originalPrimary = await fs.readFile(file);
    const originalBackup = await fs.readFile(file + '.bak');
    assert.equal(JSON.parse(crypto.decryptCredential(originalBackup)).memoryLimit, 79);
    try {
      process.env.OPENBROWSER_MASTER_KEY = 'temporary-synthetic-wrong-settings-key';
      const unreadable = await settings.loadLocalSettings().catch(error => error);
      assert.equal(unreadable.code, 'LOCAL_SETTINGS_DECRYPT_FAILED');
      assert.ok(unreadable.cause instanceof Error);
      await assert.rejects(settings.saveLocalSettings({ diskLimit: 64 }), error => error === unreadable);
      await assert.rejects(settings.writeLocalSettingsFile(), error => error === unreadable);
      await assert.rejects(settings.commitProfileDataRoot(path.join(root, 'refused')), error => error === unreadable);
      await assert.rejects(settings.flushSettingsWriter(), error => error === unreadable);
      assert.deepEqual(await fs.readFile(file), originalPrimary);
      assert.deepEqual(await fs.readFile(file + '.bak'), originalBackup);
      assert.equal((await fs.readdir(root)).some(name => name.includes('.corrupt-')), false);
    } finally {
      delete process.env.OPENBROWSER_MASTER_KEY;
      crypto.resetLocalMasterKeyCache();
    }
    assert.equal((await settings.loadLocalSettings()).memoryLimit, 80, 'restoring key A reads the newest settings');

    try {
      process.env.OPENBROWSER_MASTER_KEY = 'temporary-synthetic-wrong-settings-key';
      await assert.rejects(settings.commitProfileDataRoot(path.join(root, 'refused')), { code: 'LOCAL_SETTINGS_DECRYPT_FAILED' });
      assert.equal(settings.getLocalSettings().profileDataRoot, path.join(root, 'profiles'));
      assert.deepEqual(await fs.readFile(file), originalPrimary);
      assert.deepEqual(await fs.readFile(file + '.bak'), originalBackup);
    } finally {
      delete process.env.OPENBROWSER_MASTER_KEY;
      crypto.resetLocalMasterKeyCache();
    }
    assert.equal((await settings.loadLocalSettings()).memoryLimit, 80);

    // A setter queued before reloading cannot authenticate the existing
    // ciphertext under key B. Reload must not drain it into a new primary.
    const accepted = settings.saveLocalSettings({ diskLimit: 63 }).catch(error => error);
    try {
      process.env.OPENBROWSER_MASTER_KEY = 'temporary-synthetic-wrong-settings-key';
      await assert.rejects(settings.loadLocalSettings(), { code: 'LOCAL_SETTINGS_DECRYPT_FAILED' });
      assert.equal((await accepted).code, 'LOCAL_SETTINGS_DECRYPT_FAILED');
      assert.deepEqual(await fs.readFile(file), originalPrimary);
      assert.deepEqual(await fs.readFile(file + '.bak'), originalBackup);
    } finally {
      delete process.env.OPENBROWSER_MASTER_KEY;
      crypto.resetLocalMasterKeyCache();
      await accepted;
    }
    assert.equal((await settings.loadLocalSettings()).diskLimit, 8, 'the rejected edit is not applied when the key returns');
    await settings.flushSettingsWriter();
    assert.deepEqual(await fs.readFile(file), originalPrimary);
    assert.deepEqual(await fs.readFile(file + '.bak'), originalBackup);

    // A second edit can arrive while the first write is reading the primary.
    // Repair must not make either refused edit look successfully committed.
    const readBeforeWrite = fs.readFile;
    let enterWriteRead, releaseWriteRead;
    const writeReadStarted = new Promise(resolve => { enterWriteRead = resolve; });
    const writeReadGate = new Promise(resolve => { releaseWriteRead = resolve; });
    let skipGate = false;
    fs.readFile = async (...args) => {
      const raw = await readBeforeWrite(...args);
      if (args[0] === file && !skipGate) {
        skipGate = true;
        enterWriteRead();
        await writeReadGate;
      }
      return raw;
    };
    let secondAccepted;
    try {
      process.env.OPENBROWSER_MASTER_KEY = 'temporary-synthetic-wrong-settings-key';
      const firstAccepted = settings.saveLocalSettings({ diskLimit: 61 }).catch(error => error);
      const faultedFlush = settings.flushSettingsWriter().catch(error => error);
      await writeReadStarted;
      secondAccepted = settings.saveLocalSettings({ diskLimit: 62 }).catch(error => error);
      releaseWriteRead();
      assert.equal((await firstAccepted).code, 'LOCAL_SETTINGS_DECRYPT_FAILED');
      assert.equal((await faultedFlush).code, 'LOCAL_SETTINGS_DECRYPT_FAILED');
    } finally {
      releaseWriteRead();
      fs.readFile = readBeforeWrite;
      delete process.env.OPENBROWSER_MASTER_KEY;
      crypto.resetLocalMasterKeyCache();
    }
    assert.equal((await settings.loadLocalSettings()).diskLimit, 8);
    assert.equal((await secondAccepted).code, 'LOCAL_SETTINGS_DECRYPT_FAILED');
    assert.deepEqual(await fs.readFile(file), originalPrimary);
    assert.deepEqual(await fs.readFile(file + '.bak'), originalBackup);

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

    const originalBytes = await originalRead(file);
    const readFailure = Object.assign(new Error('simulated settings read I/O failure ' + file), { code: 'EIO' });
    fs.readFile = async (...args) => {
      if (args[0] === file) throw readFailure;
      return originalRead(...args);
    };
    try {
      await assert.rejects(settings.loadLocalSettings(), error =>
        error.code === 'EIO' && error.cause === readFailure && !error.message.includes(file));
      assert.equal(settings.getLocalSettings().memoryLimit, 80, 'an unreadable file must not reset the live cache');
      assert.deepEqual(await originalRead(file), originalBytes, 'an unreadable file must not be quarantined as corrupt');
      assert.equal((await fs.readdir(root)).some(name => name.includes('.corrupt-')), false);
    } finally { fs.readFile = originalRead; }
    assert.equal((await settings.loadLocalSettings()).memoryLimit, 80, 'reload can retry after the read failure clears');

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

    // A real, previously valid storage folder can be replaced by a link
    // between launches. Refuse to use that root without treating its healthy
    // settings file as corruption or silently starting on another folder.
    const customRoot = path.join(root, 'custom-profiles');
    const movedRoot = path.join(root, 'moved-profiles');
    await fs.mkdir(customRoot);
    await settings.saveLocalSettings({ memoryLimit: 84, uiGroups: [{ id: 'kept', name: 'Kept' }] });
    await settings.commitProfileDataRoot(customRoot);
    const beforeRootProblem = await fs.readFile(file);
    await fs.rename(customRoot, movedRoot);
    await fs.symlink(movedRoot, customRoot, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(settings.loadLocalSettings(), /must not be a symlink or junction/);
    assert.deepEqual(await fs.readFile(file), beforeRootProblem, 'a path validation failure must not replace the settings file');
    assert.equal((await fs.readdir(root)).some(name => name.includes('.corrupt-')), false);
    assert.equal(settings.getLocalSettings().memoryLimit, 84);
    await fs.rm(customRoot, { recursive: true });
    await fs.rename(movedRoot, customRoot);
    const recovered = await settings.loadLocalSettings();
    assert.equal(recovered.profileDataRoot, customRoot);
    assert.equal(recovered.memoryLimit, 84);
    assert.deepEqual(recovered.uiGroups, [{ id: 'kept', name: 'Kept' }]);
    assert.deepEqual(await fs.readFile(file), beforeRootProblem, 'retry after repairing the folder should not rewrite settings');

    // A successfully decrypted array is malformed, but failure to preserve it
    // must never let an overlapping write replace the encrypted primary or its
    // earlier valid backup. Use same-file paths to test the real serialized writer.
    const goodBackup = await fs.readFile(file + '.bak');
    const malformed = crypto.encryptCredential('["synthetic private setting"]');
    await fs.writeFile(file, malformed);
    const archiveError = Object.assign(new Error('simulated quarantine rename failure ' + file), { code: 'EPERM' });
    let quarantineEntered, finishQuarantine;
    const quarantineStarted = new Promise((resolve) => { quarantineEntered = resolve; });
    const quarantineGate = new Promise((resolve) => { finishQuarantine = resolve; });
    fs.rename = async (...args) => {
      if (args[0] === file && String(args[1]).includes('.corrupt-')) {
        quarantineEntered(); await quarantineGate;
        throw archiveError;
      }
      return originalRename(...args);
    };
    const outcome = promise => promise.then(() => null, error => error);
    let duringQuarantine;
    try {
      const reload = outcome(settings.loadLocalSettings());
      await quarantineStarted;
      duringQuarantine = outcome(settings.saveLocalSettings({ memoryLimit: 86 }));
      const quitDuringQuarantine = outcome(settings.flushSettingsWriter());
      assert.equal(settings.getLocalSettings().memoryLimit, 84, 'do not admit an edit during quarantine');
      finishQuarantine();
      const loadError = await reload;
      assert.equal(loadError.code, 'EPERM');
      assert.equal(loadError.cause, archiveError);
      assert.equal(loadError.message.includes(file), false);
      assert.ok((await duringQuarantine) === loadError, 'overlapping edits are not admitted on failed quarantine');
      assert.ok((await quitDuringQuarantine) === loadError, 'quit flush cannot overtake quarantine');
      await assert.rejects(settings.saveLocalSettings({ memoryLimit: 86 }), error => error === loadError);
      await assert.rejects(settings.flushSettingsWriter(), error => error === loadError);
      assert.equal(settings.getLocalSettings().memoryLimit, 84, 'failure must not publish factory defaults or queued changes');
      assert.deepEqual(await fs.readFile(file), malformed);
      assert.deepEqual(await fs.readFile(file + '.bak'), goodBackup);
      assert.equal((await fs.readdir(root)).filter(name => name.includes('.corrupt-')).length, 0);
    } finally {
      finishQuarantine(); await duringQuarantine;
      fs.rename = originalRename;
    }

    // Once preservation succeeds the backup is a possible, not authoritative,
    // recovery source. Reloads and unrelated saves must continue failing closed
    // until the primary is repaired. Check the original bytes of both files.
    const originalWarn = console.warn;
    const archiveWarnings = [];
    console.warn = (...args) => archiveWarnings.push(args.join(' '));
    try {
      await assert.rejects(settings.loadLocalSettings(), { code: 'LOCAL_SETTINGS_RECOVERY_REQUIRED' });
      const quarantined = (await fs.readdir(root)).filter(name => name.includes('.corrupt-'));
      assert.equal(quarantined.length, 1, 'successfully decrypted but malformed JSON still gets preserved');
      assert.deepEqual(await fs.readFile(path.join(root, quarantined[0])), malformed);
      assert.equal(archiveWarnings.length, 1);
      assert.ok(!archiveWarnings[0].includes(file) && !archiveWarnings[0].includes('synthetic private setting'));
    } finally { console.warn = originalWarn; }
    await assert.rejects(settings.loadLocalSettings(), { code: 'LOCAL_SETTINGS_RECOVERY_REQUIRED' });
    await assert.rejects(settings.saveLocalSettings({ memoryLimit: 87 }), { code: 'LOCAL_SETTINGS_RECOVERY_REQUIRED' });
    await assert.rejects(settings.flushSettingsWriter(), { code: 'LOCAL_SETTINGS_RECOVERY_REQUIRED' });
    await assert.rejects(fs.access(file), { code: 'ENOENT' });
    assert.deepEqual(await fs.readFile(file + '.bak'), goodBackup);
    await fs.writeFile(file, beforeRootProblem);
    assert.equal((await settings.loadLocalSettings()).profileDataRoot, customRoot, 'a repaired primary releases the write guard');

    // A valid empty object is still a document and can migrate. Genuinely
    // absent files, including after successful quarantine with no backup,
    // may use defaults but must not materialize them as a side effect.
    await fs.unlink(file + '.bak');
    const plaintextBroken = '["malformed legacy settings"]';
    await fs.writeFile(file, plaintextBroken);
    assert.equal((await settings.loadLocalSettings()).memoryLimit, 95);
    await settings.flushSettingsWriter();
    await assert.rejects(fs.access(file), { code: 'ENOENT' });
    await assert.rejects(fs.access(file + '.bak'), { code: 'ENOENT' });
    await fs.writeFile(file, '{}');
    assert.equal((await settings.loadLocalSettings()).memoryLimit, 95);
    assert.ok(crypto.isEncrypted(await fs.readFile(file)), 'valid empty legacy object still migrates');
    await assert.rejects(fs.access(file + '.bak'), { code: 'ENOENT' });
    await fs.writeFile(file, beforeRootProblem);
    assert.equal((await settings.loadLocalSettings()).profileDataRoot, customRoot);

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
    const backupBeforePrimaryFault = await fs.readFile(file + '.bak');
    fs.rename = async (...args) => {
      if (args[0] === file + '.tmp') throw new Error('simulated rename failure');
      return originalRename(...args);
    };
    await assert.rejects(settings.saveLocalSettings({ memoryLimit: 83 }), /rename failure/);
    const retained = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    assert.equal(retained.memoryLimit, 82, 'failed replacement must preserve the old file');
    assert.deepEqual(await fs.readFile(file + '.bak'), backupBeforePrimaryFault,
      'a failed primary replacement does not rotate the previous backup');
    assert.equal((await fs.readdir(root)).includes(path.basename(file + '.tmp')), false,
      'failed replacement must not leave an abandoned settings staging file');
    fs.rename = originalRename;
    await settings.flushSettingsWriter();
    const retried = JSON.parse(crypto.decryptCredential(await fs.readFile(file)));
    assert.equal(retried.memoryLimit, 83, 'failed writes remain retryable');

    const beforeReadFailure = await fs.readFile(file);
    const backupBeforeReadFailure = await fs.readFile(file + '.bak');
    fs.readFile = async (...args) => {
      if (args[0] === file) throw readFailure;
      return originalRead(...args);
    };
    try {
      await assert.rejects(settings.saveLocalSettings({ memoryLimit: 84 }), error =>
        error.code === 'EIO' && error.cause === readFailure && !error.message.includes(file));
      await assert.rejects(settings.commitProfileDataRoot(path.join(root, 'unavailable')), error =>
        error.code === 'EIO' && error.cause === readFailure && !error.message.includes(file));
      assert.deepEqual(await originalRead(file), beforeReadFailure);
      assert.deepEqual(await originalRead(file + '.bak'), backupBeforeReadFailure);
    } finally { fs.readFile = originalRead; }
    await settings.flushSettingsWriter();
    assert.equal(JSON.parse(crypto.decryptCredential(await fs.readFile(file))).memoryLimit, 84,
      'an ordinary pre-write read error preserves the files and can retry once readable');

    const backupPath = file + '.bak';
    const currentRoot = settings.getLocalSettings().profileDataRoot;
    const requestedRoot = path.join(root, 'another-profile-root');
    const lastPrimary = await fs.readFile(file);
    const lastBackup = await fs.readFile(backupPath);
    for (const [label, invalidContents, write] of [
      ['ordinary write', '["private test marker"]', () => settings.saveLocalSettings({ diskLimit: 23 })],
      ['dedicated root', '{ "broken private test marker":', () => settings.commitProfileDataRoot(requestedRoot)],
    ]) {
      const invalid = crypto.encryptCredential(invalidContents);
      await fs.writeFile(file, invalid);
      let attempted = 0;
      fs.rename = async (...args) => {
        if (args[1] === file) {
          attempted++;
          throw Object.assign(new Error('injected primary update ENOSPC'), { code: 'ENOSPC' });
        }
        return originalRename(...args);
      };
      try {
        const refused = await write().catch(error => error);
        assert.equal(refused.code, 'LOCAL_SETTINGS_INVALID', label + ' must reject the authenticated malformed source');
        assert.ok(!refused.message.includes('private test marker') && !refused.message.includes(file));
        await assert.rejects(settings.flushSettingsWriter(), error => error === refused);
        assert.equal(attempted, 0, label + ' must reject before primary replacement or retry');
        assert.deepEqual(await fs.readFile(file), invalid);
        assert.deepEqual(await fs.readFile(backupPath), lastBackup);
        assert.equal(settings.getLocalSettings().profileDataRoot, currentRoot);
      } finally { fs.rename = originalRename; }
      await fs.writeFile(file, lastPrimary);
      await settings.loadLocalSettings();
      await settings.flushSettingsWriter();
      assert.deepEqual(await fs.readFile(file), lastPrimary, label + ' must not replay a refused edit');
      assert.deepEqual(await fs.readFile(backupPath), lastBackup);
    }

    await fs.rename(file, file + '.held');
    const recovery = await settings.saveLocalSettings({ memoryLimit: 77 }).catch(error => error);
    assert.equal(recovery.code, 'LOCAL_SETTINGS_RECOVERY_REQUIRED');
    await assert.rejects(settings.flushSettingsWriter(), error => error === recovery);
    await assert.rejects(fs.access(file), { code: 'ENOENT' });
    assert.deepEqual(await fs.readFile(file + '.held'), lastPrimary);
    assert.deepEqual(await fs.readFile(backupPath), lastBackup);
    await fs.rename(file + '.held', file);
    assert.equal((await settings.loadLocalSettings()).memoryLimit, 84);

    // Emulate a filesystem short write without filling or truncating any real
    // user disk. The guard must use an exclusive stage, not write to .bak.
    const originalOpen = fs.open;
    const originalWrite = fs.writeFile;
    let shortWrites = 0;
    const short = async (write, data, ...args) => {
      shortWrites++;
      await write(data.subarray(0, 12), ...args);
      throw Object.assign(new Error('synthetic backup staging failure ' + backupPath), { code: 'ENOSPC' });
    };
    fs.open = async (...args) => {
      const handle = await originalOpen(...args);
      if (args[0].startsWith(backupPath + '.tmp-')) {
        assert.equal(args[1], 'wx');
        assert.equal(args[2], 0o600);
        const write = handle.writeFile.bind(handle);
        handle.writeFile = (data, ...extra) => short(write, data, ...extra);
      }
      return handle;
    };
    fs.writeFile = (name, data, ...args) => name === backupPath
      ? short((piece, ...extra) => originalWrite(name, piece, ...extra), data, ...args)
      : originalWrite(name, data, ...args);
    const backupWarnings = [];
    console.warn = (...args) => backupWarnings.push(args.join(' '));
    try {
      const saved = await settings.saveLocalSettings({ diskLimit: 18 });
      assert.equal(saved.diskLimit, 18, 'backup advisory cannot invalidate a committed primary');
      assert.equal(JSON.parse(crypto.decryptCredential(await fs.readFile(file))).diskLimit, 18);
      assert.equal(shortWrites, 1);
      assert.deepEqual(await fs.readFile(backupPath), lastBackup, 'a partial backup stage cannot touch the previous backup');
      assert.equal(backupWarnings.length, 1);
      assert.match(backupWarnings[0], /settings were saved/);
      assert.ok(!backupWarnings[0].includes(backupPath) && !backupWarnings[0].includes('synthetic backup staging failure'));
    } finally { fs.open = originalOpen; fs.writeFile = originalWrite; console.warn = originalWarn; }
    assert.equal((await fs.readdir(root)).some(name => name.startsWith(path.basename(backupPath) + '.tmp-')), false);

    let backupRenames = 0;
    fs.rename = async (...args) => {
      if (args[1] === backupPath) {
        backupRenames++;
        throw Object.assign(new Error('synthetic backup rename failure'), { code: 'EPERM' });
      }
      return originalRename(...args);
    };
    const published = [];
    try {
      assert.equal(await settings.commitProfileDataRoot(requestedRoot, { publish: () => published.push(requestedRoot) }), requestedRoot);
      assert.equal(backupRenames, 1);
      assert.deepEqual(published, [requestedRoot], 'backup refresh failure does not roll back a committed root');
      assert.equal((await settings.loadLocalSettings()).profileDataRoot, requestedRoot);
      assert.deepEqual(await fs.readFile(backupPath), lastBackup);
    } finally { fs.rename = originalRename; }
    assert.equal((await fs.readdir(root)).some(name => name.startsWith(path.basename(backupPath) + '.tmp-')), false);
    const previous = await fs.readFile(file);
    await settings.saveLocalSettings({ memoryLimit: 85 });
    assert.deepEqual(await fs.readFile(backupPath), previous, 'a later successful save rotates the prior authenticated object');
    const emptyObject = crypto.encryptCredential('{}');
    await fs.writeFile(file, emptyObject);
    await settings.loadLocalSettings();
    await settings.saveLocalSettings({ memoryLimit: 86 });
    assert.deepEqual(await fs.readFile(backupPath), emptyObject, 'an encrypted empty object remains recoverable');
    console.log('LOCAL_SETTINGS_SELFTEST OK (key/last-good backup preservation, quarantine, reload/write races, quit drain, atomic replacement, retry)');
  } finally {
    fs.rename = originalRename;
    if (originalKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = originalKey;
    if (originalKeyFile === undefined) delete process.env.OPENBROWSER_MASTER_KEY_FILE;
    else process.env.OPENBROWSER_MASTER_KEY_FILE = originalKeyFile;
    crypto.resetLocalMasterKeyCache();
    clearInterval(keepAlive);
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
