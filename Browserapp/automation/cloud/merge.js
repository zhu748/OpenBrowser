'use strict';

const nowIso = () => new Date().toISOString();

function profileStamp(profile) {
  const p = profile || {};
  const candidates = [p.updatedAt, p.syncedAt, p.exitCheckedAt, p.createdAt];
  for (const c of candidates) {
    const t = Date.parse(String(c || ''));
    if (Number.isFinite(t)) return t;
  }
  return 0;
}

function stripDataFiles(profile) {
  if (!profile || typeof profile !== 'object') return profile;
  const copy = { ...profile };
  delete copy._dataFiles;
  return copy;
}

/**
 * Merge remote backup into local state.
 * mode:
 *  - merge (default): keep local-only; add remote-only; same id → newer wins (timestamp), else remote config fields win
 *  - local-wins: only add missing ids from remote
 *  - remote-wins / overwrite: remote list becomes truth (still reported as merge stats)
 */
function mergeProfiles(localList = [], remoteList = [], mode = 'merge') {
  const { profiles, stats } = mergeProfileState(localList, remoteList, mode);
  return { profiles, stats };
}

// Carry provenance separately from persisted profiles. Browser files must only
// be restored when the corresponding remote configuration was selected.
function mergeProfileState(localList = [], remoteList = [], mode = 'merge') {
  const local = Array.isArray(localList) ? localList.map(stripDataFiles) : [];
  const remote = Array.isArray(remoteList) ? remoteList.map(stripDataFiles) : [];
  const remoteIds = new Set(remote.map((item) => item?.id));
  const remoteProfileIds = new Set();
  const stats = { added: 0, updated: 0, kept: 0, skipped: 0, conflicts: 0 };

  if (mode === 'overwrite' || mode === 'remote-wins') {
    const localIds = new Set(local.map((item) => item?.id));
    stats.added = remote.filter((r) => !localIds.has(r.id)).length;
    stats.updated = remote.length - stats.added;
    stats.kept = 0;
    return {
      profiles: remote.map((p) => ({ ...p, syncedAt: nowIso() })),
      stats: { ...stats, mode },
      remoteProfileIds: remoteIds,
    };
  }

  const byId = new Map();
  for (const item of local) {
    if (item?.id) byId.set(item.id, { ...item, _source: 'local' });
  }

  for (const remoteItem of remote) {
    if (!remoteItem?.id) continue;
    const localItem = byId.get(remoteItem.id);
    if (!localItem) {
      byId.set(remoteItem.id, { ...remoteItem, syncedAt: nowIso(), _source: 'remote' });
      stats.added += 1;
      remoteProfileIds.add(remoteItem.id);
      continue;
    }
    if (mode === 'local-wins') {
      stats.skipped += 1;
      continue;
    }
    // merge / newer-wins
    const localTs = profileStamp(localItem);
    const remoteTs = profileStamp(remoteItem);
    stats.conflicts += 1;
    let winner;
    if (mode === 'remote-preferred') {
      winner = remoteItem;
    } else if (remoteTs && localTs && remoteTs !== localTs) {
      winner = remoteTs >= localTs ? remoteItem : localItem;
    } else if (remoteTs && !localTs) {
      winner = remoteItem;
    } else if (!remoteTs && localTs) {
      winner = localItem;
    } else {
      // no timestamps: prefer remote cloud-relevant fields, keep local identity/runtime
      winner = {
        ...localItem,
        ...remoteItem,
        id: localItem.id,
        number: localItem.number || remoteItem.number,
        name: localItem.name || remoteItem.name,
        // cookies/platform/proxy from remote if present
        cookies: remoteItem.cookies != null && remoteItem.cookies !== '' ? remoteItem.cookies : localItem.cookies,
        platform: remoteItem.platform || localItem.platform,
        proxy: remoteItem.proxy != null ? remoteItem.proxy : localItem.proxy,
        proxyMeta: { ...(localItem.proxyMeta || {}), ...(remoteItem.proxyMeta || {}) },
        privacy: { ...(localItem.privacy || {}), ...(remoteItem.privacy || {}) },
        advanced: { ...(localItem.advanced || {}), ...(remoteItem.advanced || {}) },
      };
    }
    const fromRemote = winner !== localItem;
    if (fromRemote) remoteProfileIds.add(remoteItem.id);
    byId.set(remoteItem.id, {
      ...stripDataFiles(winner),
      syncedAt: nowIso(),
      updatedAt: winner.updatedAt || nowIso(),
      _mergedFrom: fromRemote ? 'remote' : 'local',
    });
    stats.updated += 1;
  }

  for (const item of byId.values()) {
    if (item._source === 'local' && !remoteIds.has(item.id)) stats.kept += 1;
    delete item._source;
    delete item._mergedFrom;
  }

  return {
    profiles: [...byId.values()],
    stats: { ...stats, mode: mode || 'merge' },
    remoteProfileIds,
  };
}

function mergeGroups(localGroups = [], remoteGroups = [], mode = 'merge') {
  if (mode === 'overwrite' || mode === 'remote-wins') return Array.isArray(remoteGroups) ? remoteGroups : [];
  const map = new Map();
  for (const g of localGroups || []) if (g?.id) map.set(g.id, g);
  for (const g of remoteGroups || []) {
    if (!g?.id) continue;
    if (mode === 'local-wins' && map.has(g.id)) continue;
    map.set(g.id, { ...(map.get(g.id) || {}), ...g });
  }
  return [...map.values()];
}

function mergeProxies(localProxies = [], remoteProxies = [], mode = 'merge') {
  if (mode === 'overwrite' || mode === 'remote-wins') return Array.isArray(remoteProxies) ? remoteProxies : [];
  const map = new Map();
  const keyOf = (p) => p.id || `${p.protocol || ''}:${p.host || ''}:${p.port || ''}`;
  for (const p of localProxies || []) map.set(keyOf(p), p);
  for (const p of remoteProxies || []) {
    const k = keyOf(p);
    if (mode === 'local-wins' && map.has(k)) continue;
    map.set(k, { ...(map.get(k) || {}), ...p });
  }
  return [...map.values()];
}

module.exports = { profileStamp, mergeProfiles, mergeProfileState, mergeGroups, mergeProxies };
