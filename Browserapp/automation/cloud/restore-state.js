'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { writeJsonAtomically, readEngineStateCandidate } = require('../../engine/state-storage');
const { assertProfileId, assertSafeProfileChild } = require('../isolation');

function journalPath(engine) {
  const root = engine.app?.getPath?.('userData') || engine.getProfileDataRoot();
  return path.join(root, 'cloud-restore-pending.obstate');
}

function captureRestoreState(engine, ids, proxyStore, settings, restoreProxies) {
  return {
    version: 1, phase: 'prepare', records: [],
    profiles: ids.map((id) => ({ id, profile: engine.profiles.get(id) || null,
      assignments: engine.assignments?.has(id) ? [...engine.assignments.get(id)] : null })),
    groups: settings.uiGroups || [],
    proxies: restoreProxies ? proxyStore?.list?.({}) || [] : null,
  };
}

async function saveRestoreState(engine, state) {
  await writeJsonAtomically(journalPath(engine), JSON.stringify(state));
}

async function removeRestoreState(engine) {
  const file = journalPath(engine);
  await fs.rm(file, { force: true });
  await fs.rm(file + '.bak', { force: true });
}

async function readRestoreState(engine) {
  try {
    const { saved } = await readEngineStateCandidate(journalPath(engine));
    if (saved.version !== 1 || !['prepare', 'pending', 'committed'].includes(saved.phase)
      || !Array.isArray(saved.profiles) || saved.profiles.length > 5000 || !Array.isArray(saved.records)) throw new Error('Invalid restore journal');
    for (const entry of saved.profiles) assertProfileId(entry.id);
    return saved;
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
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

async function cleanupRestoreState(engine, state) {
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
  await removeRestoreState(engine);
}

module.exports = { captureRestoreState, saveRestoreState, readRestoreState, rollbackRestoreState, cleanupRestoreState, removeRestoreState };
