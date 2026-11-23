'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: wait } = require('node:timers/promises');
const { assertProfileId, validateProfileRootSecure } = require('../automation/isolation');
const { syncDirectory, writeRawAtomically } = require('./state-storage');

const PREFIX = '.openbrowser-delete-';
const JOURNAL = 'journal.json';
const COMMITTED = '.committed';
const RETRYABLE_RENAME = new Set(['EBUSY', 'EPERM', 'EACCES', 'ENOTEMPTY']);

async function renameDirectory(source, destination) {
  for (let attempt = 0; ; attempt++) {
    try { await fs.rename(source, destination); return; }
    catch (error) {
      if (attempt === 7 || !RETRYABLE_RENAME.has(error.code)) throw error;
      await wait(120 * (attempt + 1));
    }
  }
}

async function statIfPresent(file) {
  try { return await fs.lstat(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function requireDirectory(stat, directory) {
  if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
    throw new Error('Invalid environment directory: ' + directory);
  }
  return Boolean(stat);
}

async function profileDirectories(root, ids) {
  const directories = [];
  for (const id of ids) {
    const directory = path.join(root, id);
    const check = await validateProfileRootSecure(root, directory, id);
    if (!check.ok) throw new Error('Isolation error: ' + check.message);
    if (requireDirectory(await statIfPresent(directory), directory)) directories.push(id);
  }
  return directories;
}

async function settle(root, stage, ids, keepProfile) {
  for (const id of ids) {
    const staged = path.join(stage, id);
    if (!requireDirectory(await statIfPresent(staged), staged)) continue;
    if (keepProfile(id)) {
      const live = path.join(root, id);
      const check = await validateProfileRootSecure(root, live, id);
      if (!check.ok) throw new Error('Isolation error: ' + check.message);
      if (await statIfPresent(live)) throw new Error('Both staged and live environment data exist: ' + id);
      await renameDirectory(staged, live);
      await syncDirectory(root);
      await syncDirectory(stage);
    } else {
      await fs.rm(staged, { recursive: true, force: true, maxRetries: 7, retryDelay: 120 });
    }
  }
  for (const entry of await fs.readdir(stage, { withFileTypes: true })) {
    if (entry.name === JOURNAL || entry.name === COMMITTED) continue;
    if (!entry.isFile() || !entry.name.startsWith(COMMITTED + '.tmp-')) {
      throw new Error('Unexpected file in deletion staging directory: ' + entry.name);
    }
    await fs.unlink(path.join(stage, entry.name));
  }
  // Keep the journal until every staged child has been removed or restored.
  await fs.unlink(path.join(stage, JOURNAL));
  await fs.rm(path.join(stage, COMMITTED), { force: true });
  await fs.rmdir(stage);
  await syncDirectory(root);
}

function recoveryError(stage, cause) {
  return Object.assign(new Error('环境删除恢复未完成，请保留暂存目录：' + stage, { cause }), {
    code: 'PROFILE_DELETE_RECOVERY_REQUIRED',
  });
}

async function deleteProfileDirectories(engine, ids, commit) {
  const root = engine.profileDataRootPath;
  const directories = await profileDirectories(root, ids);
  if (!directories.length) { await commit(); return; }
  const stage = await fs.mkdtemp(path.join(root, PREFIX));
  try {
    await writeRawAtomically(path.join(stage, JOURNAL), JSON.stringify({ version: 1, ids: directories }));
    await syncDirectory(root);
  } catch (error) {
    await fs.rmdir(stage).catch(() => {});
    throw error;
  }

  try {
    for (const id of directories) {
      await renameDirectory(path.join(root, id), path.join(stage, id));
      await syncDirectory(root);
      await syncDirectory(stage);
    }
    await commit();
  } catch (error) {
    try { await settle(root, stage, directories, () => true); }
    catch (failure) {
      for (const id of directories) engine.profileMaintenance.set(id, Symbol('profile-deletion-recovery'));
      throw recoveryError(stage, new AggregateError([error, failure]));
    }
    throw error;
  }

  let marked = false;
  try {
    await writeRawAtomically(path.join(stage, COMMITTED), '1');
    marked = true;
  } catch (error) {
    engine.emit({ type: 'storage-error', feature: 'profile-deletion', message: recoveryError(stage, error).message });
  }
  try { await settle(root, stage, directories, () => false); }
  catch (error) {
    if (!marked) for (const id of directories) engine.profileMaintenance.set(id, Symbol('profile-deletion-recovery'));
    // The metadata has committed. Report deferred cleanup without asking the
    // caller to repeat a completed deletion.
    engine.emit({ type: 'storage-error', feature: 'profile-deletion', message: recoveryError(stage, error).message });
  }
}

async function recoverProfileDeletions(engine, { recoveredState = false, storedIds, validateOnly = false } = {}) {
  // Backup migration preflights the same journals before the new database is
  // authoritative. The actual handling is deferred until startup loads it.
  const root = engine.profileDataRootPath;
  const entries = await fs.readdir(root, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  for (const entry of entries) {
    if (!entry.name.startsWith(PREFIX)) continue;
    const stage = path.join(root, entry.name);
    try {
      if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error('Invalid deletion staging directory');
      const journal = path.join(stage, JOURNAL);
      const stat = await statIfPresent(journal);
      if (!stat) {
        // A crash before installing the journal can only leave temporary metadata.
        const contents = await fs.readdir(stage, { withFileTypes: true });
        if (contents.some(file => !file.isFile() || !(file.name === COMMITTED || file.name.startsWith(JOURNAL + '.tmp-')))) {
          throw new Error('Deletion journal is missing');
        }
        if (!validateOnly) await fs.rm(stage, { recursive: true, force: true });
        continue;
      }
      if (!stat.isFile() || stat.size > 16_384) throw new Error('Invalid deletion journal');
      const { version, ids } = JSON.parse(await fs.readFile(journal, 'utf8'));
      if (version !== 1 || !Array.isArray(ids) || !ids.length || ids.length > 200 || new Set(ids).size !== ids.length) {
        throw new Error('Invalid deletion journal');
      }
      ids.forEach(assertProfileId);
      const marker = await statIfPresent(path.join(stage, COMMITTED));
      if (marker && (!marker.isFile() || marker.size !== 1 || await fs.readFile(path.join(stage, COMMITTED), 'utf8') !== '1')) {
        throw new Error('Invalid deletion commit marker');
      }
      // When the commit marker is missing, the authoritative store decides
      // whether a rename happened before or after the metadata transaction.
      const keep = id => !marker && (engine.sqliteStore
        ? engine.sqliteStore.hasProfile(id)
        : storedIds?.has(id) ?? engine.profiles.has(id));
      if (!marker && recoveredState && ids.some(id => !keep(id))) {
        throw new Error('Cannot determine deletion outcome from a recovered state snapshot');
      }
      if (!validateOnly) await settle(root, stage, ids, keep);
    } catch (error) {
      throw recoveryError(stage, error);
    }
  }
}

module.exports = { deleteProfileDirectories, recoverProfileDeletions };
