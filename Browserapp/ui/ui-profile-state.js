(() => {
  'use strict';
  const { redactProxyCredentials } = typeof module === 'object' && module.exports
    ? require('../shared/proxy-redact') : globalThis.OpenBrowserProxyRedact;
  const backupKey = (proxy) => redactProxyCredentials(proxy).replace(/#.*$/, '');

  /** Restore only credentials for the same saved backup endpoint. */
  function restoreBackupProxies(localMeta, remoteMeta, mergeProxy) {
    if (!Array.isArray(localMeta?.backupProxies) || !localMeta.backupProxies.length || !Array.isArray(remoteMeta?.backupProxies)) return localMeta;
    const remote = new Map();
    for (const proxy of remoteMeta.backupProxies) {
      const key = backupKey(proxy);
      remote.set(key, remote.has(key) ? null : proxy);
    }
    let changed = false;
    const backups = localMeta.backupProxies.map((proxy, index) => {
      const key = backupKey(proxy);
      const sameRow = remoteMeta.backupProxies[index];
      const matching = sameRow && backupKey(sameRow) === key ? sameRow : remote.get(key);
      const restored = matching ? mergeProxy(proxy, matching) : proxy;
      if (restored !== proxy) changed = true;
      return restored;
    });
    return changed ? { ...localMeta, backupProxies: backups } : localMeta;
  }

  /** Restore engine-owned secrets while retaining the saved UI profile order. */
  function reconcileProfiles({ localProfiles, engineProfiles, normalizeProfile, mergeProxy, restoreProxy = (proxy) => proxy }) {
    // An empty engine can be the first launch with a legacy UI-only list.
    if (!engineProfiles.length) return localProfiles;
    const byId = new Map(engineProfiles.map((profile) => [profile.id, profile]));
    const seen = new Set();
    const result = [];
    for (const local of localProfiles) {
      const remote = byId.get(local.id);
      if (!remote) continue;
      const authoritative = Number.isSafeInteger(remote.rev) && remote.rev > 0;
      const sameRevision = !authoritative || local.rev === remote.rev;
      const proxyId = authoritative ? remote.proxyId : (local.proxyId || remote.proxyId);
      result.push(normalizeProfile({
        ...local,
        ...remote,
        proxyMeta: authoritative ? remote.proxyMeta : restoreBackupProxies(local.proxyMeta, remote.proxyMeta, mergeProxy),
        proxyId: proxyId || null,
        ...(Object.hasOwn(remote, 'exitIp') && remote.exitIp !== undefined ? {
          exitIp: remote.exitIp,
          exitCountryCode: remote.exitCountryCode,
          exitTimezone: remote.exitTimezone,
          exitLatitude: remote.exitLatitude,
          exitLongitude: remote.exitLongitude,
          exitCheckedAt: remote.exitCheckedAt,
          exitLatencyMs: remote.exitLatencyMs,
          exitNetworkType: remote.exitNetworkType,
        } : {}),
        cookies: (sameRevision && local.cookies) || remote.cookies || '',
        proxy: restoreProxy(authoritative ? remote.proxy : mergeProxy(local.proxy, remote.proxy), proxyId),
        platform: {
          ...(local.platform || {}),
          ...(remote.platform || {}),
          password: (sameRevision && local.platform?.password) || remote.platform?.password || '',
          totpSecret: (sameRevision && local.platform?.totpSecret) || remote.platform?.totpSecret || '',
        },
      }));
      seen.add(local.id);
    }
    // Updating membership as we append preserves first-wins behavior for
    // duplicate engine-only IDs, without rescanning the growing result array.
    for (const remote of engineProfiles) {
      if (seen.has(remote.id)) continue;
      result.push(normalizeProfile(remote));
      seen.add(remote.id);
    }
    return result;
  }

  function withField(current, original, key, value) {
    if (current[key] === value) return current;
    if (current === original) return { ...original, [key]: value };
    current[key] = value;
    return current;
  }

  /** Merge polling data without changing references for unchanged profiles. */
  function mergeExitState({ profiles, engineProfiles, hasCredentials, restoreProxy = (proxy) => proxy, normalizeProfile = (profile) => profile }) {
    if (!Array.isArray(engineProfiles) || !engineProfiles.length) return { profiles, changed: false };
    const byId = new Map(engineProfiles.filter(Boolean).map((item) => [item.id, item]));
    const exitFields = ['exitIp', 'exitCountryCode', 'exitTimezone', 'exitLatitude', 'exitLongitude', 'exitCheckedAt', 'exitLatencyMs', 'exitNetworkType'];
    let result = profiles;
    const localIds = new Set();
    profiles.forEach((local, index) => {
      localIds.add(local.id);
      const remote = byId.get(local.id);
      if (!remote) return;
      let next = local;
      if (Number.isSafeInteger(remote.rev) && remote.rev > 0 && remote.rev !== local.rev) {
        // An API/cloud edit moves configuration as well as runtime state.
        // Old cached secrets cannot prove ownership of the new revision.
        next = normalizeProfile({ ...local, ...remote });
      }
      if (Object.hasOwn(remote, 'exitIp') && remote.exitIp !== undefined) {
        for (const field of exitFields) if (remote[field] !== undefined) next = withField(next, local, field, remote[field]);
      }
      if (remote.proxy && hasCredentials(remote.proxy) && !hasCredentials(next.proxy)) next = withField(next, local, 'proxy', remote.proxy);
      if (remote.proxyId && !next.proxyId) next = withField(next, local, 'proxyId', remote.proxyId);
      const proxyId = next.proxyId || remote.proxyId;
      if (proxyId && !hasCredentials(next.proxy)) {
        const restored = restoreProxy(next.proxy, proxyId);
        if (restored && hasCredentials(restored)) next = withField(next, local, 'proxy', restored);
      }
      if (next !== local) {
        if (result === profiles) result = profiles.slice();
        result[index] = next;
      }
    });
    for (const remote of engineProfiles) {
      if (!remote || localIds.has(remote.id)) continue;
      if (result === profiles) result = profiles.slice();
      result.push(normalizeProfile(remote));
      localIds.add(remote.id);
    }
    return { profiles: result, changed: result !== profiles };
  }

  const api = { reconcileProfiles, mergeExitState };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserProfileState = api;
})();
