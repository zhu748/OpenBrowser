(() => {
  'use strict';

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
      const proxyId = local.proxyId || remote.proxyId;
      result.push(normalizeProfile({
        ...local,
        proxyId: proxyId || null,
        ...(remote.exitIp ? {
          exitIp: remote.exitIp,
          exitCountryCode: remote.exitCountryCode,
          exitTimezone: remote.exitTimezone,
          exitLatitude: remote.exitLatitude,
          exitLongitude: remote.exitLongitude,
          exitCheckedAt: remote.exitCheckedAt,
          exitLatencyMs: remote.exitLatencyMs,
          exitNetworkType: remote.exitNetworkType,
        } : {}),
        cookies: local.cookies || remote.cookies || '',
        proxy: restoreProxy(mergeProxy(local.proxy, remote.proxy), proxyId),
        platform: {
          ...(local.platform || {}),
          password: local.platform?.password || remote.platform?.password || '',
          totpSecret: local.platform?.totpSecret || remote.platform?.totpSecret || '',
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

  const api = { reconcileProfiles };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.OpenBrowserProfileState = api;
})();
