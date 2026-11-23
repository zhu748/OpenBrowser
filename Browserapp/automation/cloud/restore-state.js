'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { decryptCredential, encryptCredential, isEncrypted } = require('../../credential-crypto');
const { syncDirectory, writeJsonAtomically } = require('../../engine/state-storage');
const { assertProfileId, assertSafeProfileChild } = require('../isolation');
const { MAX_BACKUP_PROFILES } = require('./limits');

const JOURNAL_NAME = 'cloud-restore-pending.obstate';
// Match the state-storage writer and the host's profile-root recovery probe.
const JOURNAL_ARTIFACT = /^cloud-restore-pending\.obstate(?:\.bak)?(?:\.tmp-\d+-[0-9a-f]{16})?$/i;

function journalPath(engine) {
  const root = engine.app?.getPath?.('userData') || engine.getProfileDataRoot();
  return path.join(root, JOURNAL_NAME);
}

function captureRestoreState(engine, ids, proxyStore, settings, restoreProxies) {
  const profiles = ids.map((id) => {
    const profile = engine.profiles.get(id) || null;
    if (!profile && engine.sqliteStore?.hasProfile?.(id)) throw Object.assign(
      new Error(`环境 ${id} 的本地记录无法读取，已停止恢复以保留原始数据`),
      { code: 'STORAGE_DECODE_FAILED', profileId: id },
    );
    return { id, profile, assignments: engine.assignments?.has(id) ? [...engine.assignments.get(id)] : null };
  });
  return {
    version: 1, phase: 'prepare', records: [],
    profiles,
    groups: settings.uiGroups || [],
    proxies: restoreProxies ? proxyStore?.list?.({}) || [] : null,
  };
}

async function saveRestoreState(engine, state) {
  await writeJsonAtomically(journalPath(engine), JSON.stringify(state));
}

async function removeRestoreState(engine) {
  const file = journalPath(engine);
  // Keep the authoritative primary available if discarding its older copy
  // fails. Removing the primary first would leave an ambiguous backup-only
  // journal after an ordinary cleanup interruption.
  await fs.rm(file + '.bak', { force: true });
  await fs.rm(file, { force: true });
}

async function statOrAbsent(file) {
  try { return await fs.lstat(file, { bigint: true }); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

const sameFile = (earlier, later) => later && earlier.dev === later.dev && earlier.ino === later.ino;

async function inspectMissingDirectory(directory) {
  // Fresh host-provided storage can have an uncreated directory. Don't
  // mistake a dangling link or an invalid ancestor for genuine absence.
  let ancestor = path.dirname(directory);
  for (;;) {
    const identity = await statOrAbsent(ancestor);
    if (identity?.isDirectory()) break;
    if (identity || ancestor === path.dirname(ancestor)) throw new Error('Invalid restore journal directory');
    ancestor = path.dirname(ancestor);
  }
  if (await statOrAbsent(directory)) throw new Error('Restore journal directory changed during inspection');
}

const recoveryRequired = cause => Object.assign(
  new Error('无法确认云恢复记录，原始数据与恢复记录已保留。请先检查恢复记录，再重试。', { cause }),
  { code: 'CLOUD_RECOVERY_REQUIRED' },
);

async function inspectJournal(file, stage = null) {
  const dir = path.dirname(file);
  const directory = await statOrAbsent(dir);
  if (!directory) { await inspectMissingDirectory(dir); return { directory, primary: null, backup: null }; }
  if (!directory.isDirectory()) throw new Error('Invalid restore journal directory');

  const names = (await fs.readdir(dir)).filter(name => JOURNAL_ARTIFACT.test(name));
  const backupName = JOURNAL_NAME + '.bak';
  const ownStageName = stage && path.basename(stage.file);
  if (names.some(name => name !== JOURNAL_NAME && name !== backupName && name !== ownStageName)
    || (stage && (!names.includes(ownStageName) || !sameFile(stage.identity, await statOrAbsent(stage.file))))) {
    throw new Error('Ambiguous restore journal stage or name');
  }
  const primary = await statOrAbsent(file);
  const backup = await statOrAbsent(file + '.bak');
  if (Boolean(primary) !== names.includes(JOURNAL_NAME) || Boolean(backup) !== names.includes(backupName)
    || (primary && !primary.isFile()) || (backup && !backup.isFile()) || (!primary && backup)) {
    throw new Error('Ambiguous restore journal');
  }
  if (!sameFile(directory, await statOrAbsent(dir))) throw new Error('Restore journal directory changed during inspection');
  return { directory, primary, backup };
}

async function readJournalDocument(file) {
  const bytes = await fs.readFile(file);
  const encrypted = isEncrypted(bytes);
  // Inspect existing evidence without provisioning a replacement fallback key.
  const saved = JSON.parse(encrypted ? decryptCredential(bytes, { existingKeyOnly: true }) : bytes.toString('utf8'));
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)
    || (saved.claimId !== undefined && (!encrypted || typeof saved.claimId !== 'string' || !/^[0-9a-f]{32}$/.test(saved.claimId)))) {
    throw new Error('Invalid restore journal document');
  }
  return saved;
}

async function readRestoreState(engine) {
  try {
    const file = journalPath(engine);
    const { directory, primary, backup } = await inspectJournal(file);
    if (!primary) return null;

    // Only the current primary can authorize compensation or cleanup. A
    // backup/stage is evidence to preserve, never a candidate to promote.
    const saved = await readJournalDocument(file);
    // Journals written by the exclusive writer can only clean a backup it
    // made. An older reader-compatible v1 journal has no claim ID.
    if (saved.claimId !== undefined && backup && ((await readJournalDocument(file + '.bak')).claimId !== saved.claimId
      || !sameFile(backup, await statOrAbsent(file + '.bak')))) {
      throw new Error('Restore backup does not belong to the primary');
    }
    if (!sameFile(primary, await statOrAbsent(file))
      || !sameFile(directory, await statOrAbsent(path.dirname(file)))) throw new Error('Restore journal changed during inspection');
    if (saved.version !== 1 || !['prepare', 'pending', 'committed'].includes(saved.phase)
      || !Array.isArray(saved.profiles) || saved.profiles.length > MAX_BACKUP_PROFILES || !Array.isArray(saved.records)) throw new Error('Invalid restore journal');
    for (const entry of saved.profiles) assertProfileId(entry.id);
    return saved;
  } catch (cause) {
    throw recoveryRequired(cause);
  }
}

/** Install a synced journal without replacing an incumbent or importing its backup. */
async function claimRestoreState(engine, state) {
  const file = journalPath(engine);
  const dir = path.dirname(file);
  const backupFile = file + '.bak';
  const claimId = randomBytes(16).toString('hex');
  const owns = (expected, current) => expected ? sameFile(expected, current) : current === null;
  let directory, primary = null, backup = null;
  const verify = async (stage = null) => {
    try {
      const observed = await inspectJournal(file, stage);
      if (file !== journalPath(engine) || !sameFile(directory, observed.directory)
        || !owns(primary, observed.primary) || !owns(backup, observed.backup)) throw new Error('Restore journal ownership changed');
    } catch (cause) { throw recoveryRequired(cause); }
  };
  async function publish(value, initial = false) {
    const temporary = `${file}.tmp-${process.pid}-${randomBytes(8).toString('hex')}`;
    let handle, stage;
    try {
      handle = await fs.open(temporary, 'wx', 0o600);
      stage = { file: temporary, identity: await handle.stat({ bigint: true }) };
      await handle.writeFile(encryptCredential(JSON.stringify({ ...value, claimId })));
      await handle.sync();
      await handle.close();
      handle = null;
      await verify(stage);
      if (initial) {
        // rename would replace whatever arrived after verify(). Link publishes
        // the synced file only when the canonical name is still free.
        await fs.link(temporary, file);
      } else {
        if (!backup) {
          // Preserve one prior phase. Never overwrite or claim an old backup.
          await fs.link(file, backupFile);
          backup = primary;
          await verify(stage);
        }
        await fs.rename(temporary, file);
      }
      primary = stage.identity;
      // The replacement consumed the stage. Do not turn any later cleanup
      // check into a failed phase write after the new decision committed.
      if (!initial) stage = null;
    } finally {
      if (handle) await handle.close().catch(() => {});
      if (stage && sameFile(directory, await statOrAbsent(dir)) && sameFile(stage.identity, await statOrAbsent(temporary))) {
        await fs.unlink(temporary);
      }
    }
    await syncDirectory(dir);
    if (initial) await verify();
  }
  try {
    const observed = await inspectJournal(file);
    if (observed.primary) throw new Error('Restore journal is already owned');
    if (!observed.directory) await fs.mkdir(dir, { recursive: true });
    directory = await statOrAbsent(dir);
    if (!directory?.isDirectory() || (observed.directory && !sameFile(observed.directory, directory))) {
      throw new Error('Restore journal directory changed before claim');
    }
    await publish(state, true);
  } catch (cause) {
    // No application state has changed. Only our own initial link can safely
    // be undone; never remove a newly arrived canonical file or backup.
    try {
      if (primary && sameFile(directory, await statOrAbsent(dir)) && sameFile(primary, await statOrAbsent(file))) {
        await fs.unlink(file);
        await syncDirectory(dir);
      }
    } catch (_) { /* Leave uncertain evidence for recovery. */ }
    throw cause.code === 'CLOUD_RECOVERY_REQUIRED' ? cause : recoveryRequired(cause);
  }
  return {
    verify,
    save: value => publish(value),
    async remove() {
      await verify();
      if (backup) { await fs.unlink(backupFile); backup = null; await verify(); }
      await fs.unlink(file);
      await syncDirectory(dir);
    },
  };
}

/** Re-entrant compensation: originals remain available until every store is restored. */
async function rollbackRestoreState({ engine, proxyStore, getSettings, saveSettings, state, maintenanceToken,
  restoreProxies = true, restoreGroups = true, restoreProfiles = true }) {
  const rootFor = (id) => path.join(engine.getProfileDataRoot(), assertProfileId(id));
  const roots = new Set(state.profiles.map((entry) => rootFor(entry.id)));
  for (const item of state.records) {
    if (!roots.has(item.root)) throw new Error('Restore journal contains an unknown profile root');
    for (const target of [item.target, item.backup, item.staged]) await assertSafeProfileChild(item.root, target);
    const exists = async (target) => { try { await fs.lstat(target); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
    if (await exists(item.backup)) {
      await fs.mkdir(path.dirname(item.target), { recursive: true });
      // Keep the backup for retries if a later metadata write fails.
      const temporary = item.target + '.restore-rollback';
      await assertSafeProfileChild(item.root, temporary);
      await fs.copyFile(item.backup, temporary);
      const handle = await fs.open(temporary, 'r+');
      try { await handle.sync(); } finally { await handle.close(); }
      await fs.rename(temporary, item.target);
    } else if (!item.hadOriginal && !(await exists(item.staged))) {
      await fs.rm(item.target, { force: true });
    }
  }
  if (restoreProxies && state.proxies !== null) await proxyStore.replaceAll(state.proxies, { maintenanceToken });
  if (restoreGroups) await saveSettings({ ...getSettings(), uiGroups: state.groups });
  if (!restoreProfiles) return;
  for (const entry of state.profiles) {
    if (entry.profile) engine.profiles.set(entry.id, entry.profile);
    else {
      engine.profiles.delete(entry.id);
      if (engine.usingSqlite) engine.sqliteStore.deleteProfiles([entry.id]);
    }
    if (engine.assignments) {
      if (entry.assignments) engine.assignments.set(entry.id, new Set(entry.assignments));
      else engine.assignments.delete(entry.id);
    }
    engine.networkInfo?.delete(entry.id);
  }
  engine.invalidateStatusCache?.();
  await engine.persist?.();
}

async function cleanupRestoreState(engine, state, claim) {
  await claim?.verify();
  // The journal also covers config-only restores. Preflight excluded old
  // pending work before creation, so these staging directories belong to it.
  for (const { id } of state.profiles) {
    const root = path.join(engine.getProfileDataRoot(), assertProfileId(id));
    let entries;
    try { entries = await fs.readdir(root); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    for (const name of entries) if (name.startsWith('.openbrowser-restore-')) {
      const directory = path.join(root, name);
      await assertSafeProfileChild(root, directory);
      await fs.rm(directory, { recursive: true, force: true });
    }
  }
  if (claim) await claim.remove();
  else await removeRestoreState(engine);
}

module.exports = { captureRestoreState, claimRestoreState, saveRestoreState, readRestoreState, rollbackRestoreState, cleanupRestoreState };
