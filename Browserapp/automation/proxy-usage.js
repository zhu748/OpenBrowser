'use strict';

// Allocation rules and usage projections have no persistence or credential I/O.
const { profileProxyAssociation, normalizedProxyAssociationId, sameProxyEndpoint,
  parsedProxy, hasExplicitScheme } = require('../network/proxy-identity');

const MAX_PROXY_CONCURRENCY = 1000;

/**
 * Determine whether a given environment (profile) is associated with or configured to use a proxy.
 *
 * Checks explicit association IDs (proxyId, proxy_id, proxyLibraryId, proxy_library_id across top-level
 * and proxyMeta), and falls back to matching raw endpoints or canonical IP/host/port endpoints for
 * manually pasted proxies that do not carry a library record ID. Direct/offline network modes are
 * never matched.
 */
function profileMatchesProxy(profile, proxy) {
  if (!profile || typeof profile !== 'object' || !proxy) return false;
  if (profile.networkMode === 'direct' || /^(direct|offline|none)$/i.test(String(profile.proxy || '').trim())) {
    return false;
  }
  const proxyId = String(proxy.id || '').trim();
  const assoc = profileProxyAssociation(profile);
  const linkedId = normalizedProxyAssociationId(assoc?.value);
  if (linkedId) {
    return Boolean(proxyId && linkedId === proxyId);
  }
  const profileRaw = String(profile.proxy || profile.raw || profile.proxyUrl || '').trim();
  const proxyRaw = String(proxy.raw || '').trim();
  if (!profileRaw || !proxyRaw) return false;
  if (profileRaw === proxyRaw) return true;
  return sameProxyEndpoint(profileRaw, proxyRaw);
}

function normalizeProfileList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input.values === 'function') return Array.from(input.values());
  if (typeof input === 'object') return Object.values(input);
  return [];
}

function normalizeProxyList(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input.list === 'function') return input.list();
  if (input.data && Array.isArray(input.data.items)) return input.data.items;
  if (Array.isArray(input.items)) return input.items;
  if (typeof input.values === 'function') return Array.from(input.values());
  if (typeof input === 'object' && input.id) return [input];
  return [];
}

function extractProxyLimit(proxy) {
  if (!proxy || typeof proxy !== 'object') return 0;
  const raw = Number.parseInt(
    proxy.maxConcurrency ?? proxy.max_concurrency ?? proxy.concurrencyLimit ?? proxy.concurrency,
    10
  );
  return Number.isInteger(raw) && raw > 0 ? Math.min(raw, MAX_PROXY_CONCURRENCY) : 0;
}

// Build an index per snapshot: profiles and proxies may be edited in place, so
// retaining this across calls would risk stale allocation counts.
function boundProfilesByProxy(proxyList, profileList) {
  const bound = proxyList.map(() => []);
  const ids = new Map();
  const raws = new Map();
  const endpoints = new Map();
  const parsed = new Map();
  const add = (map, key, value) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };
  const endpoint = (raw) => {
    if (!parsed.has(raw)) {
      const value = parsedProxy(raw);
      parsed.set(raw, value ? {
        key: JSON.stringify([value.host, Number(value.port)]),
        protocol: hasExplicitScheme(raw) ? value.protocol : null,
      } : null);
    }
    return parsed.get(raw);
  };
  proxyList.forEach((proxy, index) => {
    const id = String(proxy.id || '').trim();
    if (id) add(ids, id, index);
    const raw = String(proxy.raw || '').trim();
    if (!raw) return;
    add(raws, raw, index);
    const value = endpoint(raw);
    if (!value) return;
    if (!endpoints.has(value.key)) endpoints.set(value.key, { all: [], protocols: new Map() });
    const group = endpoints.get(value.key);
    group.all.push(index);
    add(group.protocols, value.protocol, index);
  });
  for (const profile of profileList) {
    if (!profile || typeof profile !== 'object' || profile.networkMode === 'direct'
      || /^(direct|offline|none)$/i.test(String(profile.proxy || '').trim())) continue;
    const linkedId = normalizedProxyAssociationId(profileProxyAssociation(profile)?.value);
    let matches;
    if (linkedId) matches = ids.get(linkedId) || [];
    else {
      const raw = String(profile.proxy || profile.raw || profile.proxyUrl || '').trim();
      if (!raw) continue;
      matches = new Set(raws.get(raw));
      const value = endpoint(raw);
      const group = value && endpoints.get(value.key);
      if (group) {
        const candidates = value.protocol === null ? group.all
          : [...(group.protocols.get(value.protocol) || []), ...(group.protocols.get(null) || [])];
        for (const index of candidates) matches.add(index);
      }
    }
    for (const index of matches) {
      bound[index].push({ id: String(profile.id), name: String(profile.name || profile.title || profile.id) });
    }
  }
  return bound;
}

/**
 * Summarize proxy allocation and window concurrency usage across profiles (Issue #25).
 *
 * Pure function. For each proxy in the library, calculates:
 * - profiles: list of profiles currently assigned to this proxy (id and name)
 * - count / used: number of occupying profiles
 * - limit / maxConcurrency: concurrency cap (0 means unlimited)
 * - isOverLimit / overLimit: boolean, whether count exceeds limit (> limit when limit > 0)
 * - isFull: boolean, whether count has reached or exceeded limit (>= limit when limit > 0)
 * - isIdle / idle: boolean, whether count is 0
 * - available: remaining slots before reaching limit, or null if unlimited
 *
 * Returns an array with attached convenience getters:
 * - byId: Map<proxyId, itemSummary>
 * - idle: array of idle proxy summaries
 * - inUse: array of proxies currently in use
 * - overLimit: array of proxies exceeding their limit
 * - full: array of proxies that have reached their limit
 */
function summarizeProxyUsage(proxies, profiles) {
  const proxyList = normalizeProxyList(proxies);
  const profileList = normalizeProfileList(profiles);
  const bound = boundProfilesByProxy(proxyList, profileList);

  const results = proxyList.map((proxy, index) => {
    const limit = extractProxyLimit(proxy);

    const boundProfiles = bound[index];

    const count = boundProfiles.length;
    const isOverLimit = limit > 0 && count > limit;
    const isFull = limit > 0 && count >= limit;
    const isIdle = count === 0;

    return {
      id: String(proxy.id || ''),
      name: String(proxy.name || (proxy.host && proxy.port ? `${proxy.host}:${proxy.port}` : proxy.raw || '')),
      proxy,
      profiles: boundProfiles,
      count,
      used: count,
      limit,
      maxConcurrency: limit,
      isOverLimit,
      overLimit: isOverLimit,
      isFull,
      isIdle,
      idle: isIdle,
      available: limit > 0 ? Math.max(0, limit - count) : null,
    };
  });

  const byId = new Map(results.map((item) => [item.id, item]));
  Object.defineProperties(results, {
    byId: { value: byId, enumerable: false },
    idle: { get: () => results.filter((item) => item.isIdle), enumerable: false },
    inUse: { get: () => results.filter((item) => !item.isIdle), enumerable: false },
    overLimit: { get: () => results.filter((item) => item.isOverLimit), enumerable: false },
    full: { get: () => results.filter((item) => item.isFull), enumerable: false },
  });

  return results;
}

/**
 * Check whether assigning a proxy to a profile is allowed under its maxConcurrency cap.
 *
 * If targetProfileId (or target profile object) is specified, its existing binding does not count
 * against the limit (i.e. saving an existing profile without switching proxies does not trigger
 * self-blocking).
 */
function canAssignProxy(proxyOrId, profiles, targetOrOptions = null) {
  let targetProfileId = null;
  let proxy = proxyOrId;

  if (targetOrOptions && typeof targetOrOptions === 'object') {
    if ('id' in targetOrOptions && !('targetProfileId' in targetOrOptions)) {
      targetProfileId = targetOrOptions.id;
    } else {
      targetProfileId = targetOrOptions.targetProfileId ?? targetOrOptions.targetId ?? null;
      if (typeof proxyOrId === 'string') {
        if (targetOrOptions.store?.get) proxy = targetOrOptions.store.get(proxyOrId);
        else if (Array.isArray(targetOrOptions.proxies)) proxy = targetOrOptions.proxies.find((p) => p.id === proxyOrId);
      }
    }
  } else if (targetOrOptions != null) {
    targetProfileId = String(targetOrOptions);
  }

  if (!proxy) {
    return { ok: true, count: 0, limit: 0, reason: null, proxy: null, occupyingProfiles: [] };
  }

  const limit = extractProxyLimit(proxy);
  const profileList = normalizeProfileList(profiles);
  const targetIdStr = targetProfileId != null ? String(targetProfileId).trim() : null;

  const occupyingProfiles = profileList
    .filter((profile) => {
      if (targetIdStr && String(profile.id).trim() === targetIdStr) return false;
      return profileMatchesProxy(profile, proxy);
    })
    .map((profile) => ({
      id: String(profile.id),
      name: String(profile.name || profile.title || profile.id),
    }));

  const count = occupyingProfiles.length;
  if (limit > 0 && count >= limit) {
    const name = proxy.name || (proxy.host && proxy.port ? `${proxy.host}:${proxy.port}` : proxy.raw || proxy.id || '未知代理');
    const holders = occupyingProfiles.slice(0, 3).map((p) => p.name || p.id).join('、');
    const extra = occupyingProfiles.length > 3 ? ' 等' : '';
    const reason = `代理「${name}」已分配给 ${count} 个环境，已达并发上限（${count}/${limit}）。占用环境：${holders}${extra}。无法继续分配，请先解除其他环境的绑定或提高该代理的并发上限。`;
    return {
      ok: false,
      reason,
      code: 'ERR_PROXY_MAX_CONCURRENCY',
      count,
      limit,
      proxy,
      occupyingProfiles,
    };
  }

  return {
    ok: true,
    reason: null,
    count,
    limit,
    proxy,
    occupyingProfiles,
  };
}

/**
 * Assert that a proxy has capacity to accept a new profile or switch assignment.
 * Throws a typed Error (code: ERR_PROXY_MAX_CONCURRENCY) with actionable message when capped.
 */
function assertProxyAssignmentAvailable(proxyOrId, profiles, targetOrOptions = null) {
  const result = canAssignProxy(proxyOrId, profiles, targetOrOptions);
  if (!result.ok) {
    const error = new Error(result.reason);
    error.code = result.code || 'ERR_PROXY_MAX_CONCURRENCY';
    error.proxyId = result.proxy?.id || null;
    error.limit = result.limit;
    error.count = result.count;
    error.occupyingProfiles = result.occupyingProfiles;
    throw error;
  }
  return result;
}

module.exports = {
  summarizeProxyUsage, canAssignProxy, assertProxyAssignmentAvailable,
  profileMatchesProxy, MAX_PROXY_CONCURRENCY,
};
