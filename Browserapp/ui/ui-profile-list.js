(() => {
'use strict';

function normalizeText(value) {
  return String(value ?? '').toLocaleLowerCase();
}

// Roxy 对齐：搜索支持 字段::值 语法（name/remark/account/proxy/tag/os/kernel/id/group），
// 其余词仍走全文模糊匹配；多个条件之间是「与」关系。
const ADV_FIELDS = Object.freeze(['name', 'remark', 'account', 'proxy', 'tag', 'os', 'kernel']);
const SEARCH_FIELDS = new Set([...ADV_FIELDS, 'id', 'group']);

function profileFieldText(profile, field, displayProfileNumber, groupNameOf) {
  switch (field) {
    case 'name': return [profile.name, profile.title];
    case 'remark': return [profile.note, profile.notes];
    case 'account':
      return [
        profile.platform?.username,
        ...(Array.isArray(profile.platform?.accounts) ? profile.platform.accounts.map((acc) => acc?.username) : []),
      ];
    case 'proxy': return [profile.proxy, profile.proxyMeta?.host];
    case 'tag': return [profile.tag, ...(Array.isArray(profile.tags) ? profile.tags : [])];
    case 'os': return [profile.os, profile.osVersion];
    case 'kernel': return [profile.engine, profile.engineVersion];
    case 'id': return [profile.id, typeof displayProfileNumber === 'function' ? displayProfileNumber(profile) : profile.number];
    case 'group': return [groupNameOf ? groupNameOf(profile) : '', profile.groupId];
    default: return [];
  }
}

function filterProfiles({
  profiles = [], activeGroupFilter = 'all', query = '', displayProfileNumber, groupNameOf,
  activeListTab = 'all', advancedFilter = null, isRunning = () => false, sort = null,
}) {
  const numberOf = typeof displayProfileNumber === 'function' ? displayProfileNumber : (profile) => profile?.number || profile?.id || '';
  const groupOf = typeof groupNameOf === 'function' ? groupNameOf : () => '';
  const fieldTokens = [];
  const textTokens = [];
  for (const raw of String(query ?? '').trim().split(/\s+/)) {
    if (!raw) continue;
    const match = raw.match(/^([a-zA-Z_]+)::(.*)$/);
    if (match && SEARCH_FIELDS.has(match[1].toLowerCase())) fieldTokens.push([match[1].toLowerCase(), normalizeText(match[2])]);
    else textTokens.push(normalizeText(raw));
  }
  // Compile the panel values once per query, rather than once per profile.
  const advancedTokens = ADV_FIELDS.flatMap((field) => {
    const needle = String(advancedFilter?.[field] || '').trim().toLowerCase();
    return needle ? [[field, needle]] : [];
  });
  const result = profiles.filter((profile) => {
    if (activeGroupFilter === 'trash') {
      if (!profile.trashed) return false;
    } else {
      if (profile.trashed) return false;
      if (activeGroupFilter === 'ungrouped') {
        if (profile.groupId) return false;
      } else if (activeGroupFilter !== 'all' && profile.groupId !== activeGroupFilter) return false;
    }
    if (activeListTab === 'fav' && (!profile.favorite || profile.trashed)) return false;
    if (activeListTab === 'open' && !isRunning(profile.id)) return false;
    if (advancedFilter?.status === 'running' && !isRunning(profile.id)) return false;
    if (advancedFilter?.status === 'stopped' && isRunning(profile.id)) return false;
    if (advancedFilter?.fav === 'yes' && !profile.favorite) return false;
    if (advancedFilter?.fav === 'no' && profile.favorite) return false;
    for (const [field, needle] of advancedTokens) {
      if (!profileFieldText(profile, field, numberOf, groupOf)
        .some((value) => String(value ?? '').toLowerCase().includes(needle))) return false;
    }
    // Empty and field-only searches never need the full-text projection.
    const freeText = textTokens.length ? [
      profile.name,
      profile.title,
      profile.id,
      numberOf(profile),
      profile.browser,
      profile.proxy,
      profile.tag,
      groupOf(profile),
    ].map(normalizeText) : [];
    for (const token of textTokens) {
      if (!freeText.some((value) => value.includes(token))) return false;
    }
    for (const [field, needle] of fieldTokens) {
      // numberOf keeps the id::/number:: fallback (profile.number missing →
      // profile.id) consistent with the advanced-panel and free-text paths.
      const hay = profileFieldText(profile, field, numberOf, groupOf).map(normalizeText);
      if (!hay.some((value) => value.includes(needle))) return false;
    }
    return true;
  });
  return sort?.key ? sortProfiles(result, sort, numberOf) : result;
}

function sortProfiles(profiles, sort, numberOf) {
  const valueOf = (profile) => {
    switch (sort.key) {
      case 'number': return Number(numberOf(profile)) || 0;
      case 'name': return String(profile.title || profile.name || '').toLowerCase();
      case 'lastopen': return Date.parse(profile.lastOpenedAt || '') || 0;
      case 'created': return Date.parse(profile.createdAt || '') || 0;
      case 'updated': return Date.parse(profile.updatedAt || '') || 0;
      default: return 0;
    }
  };
  const dir = sort.dir || 1;
  // Date parsing / text normalization happens N times, not per comparison.
  return profiles.map((profile) => ({ profile, value: valueOf(profile) }))
    .sort((a, b) => a.value < b.value ? -dir : a.value > b.value ? dir : 0)
    .map(({ profile }) => profile);
}

function summarizeProfiles(profiles = [], isRunning = () => false) {
  const counts = { all: 0, fav: 0, open: 0, trash: 0, groups: new Map([['all', 0], ['ungrouped', 0]]) };
  for (const profile of profiles) {
    if (profile.trashed) {
      counts.trash += 1;
      continue;
    }
    counts.all += 1;
    if (profile.favorite) counts.fav += 1;
    if (isRunning(profile.id)) counts.open += 1;
    const group = profile.groupId || 'ungrouped';
    counts.groups.set(group, (counts.groups.get(group) || 0) + 1);
  }
  counts.groups.set('all', counts.all);
  return counts;
}

function paginate(items = [], page = 1, pageSize = 10) {
  const size = Math.max(1, Number.parseInt(pageSize, 10) || 10);
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.min(Math.max(1, Number.parseInt(page, 10) || 1), totalPages);
  const offset = (currentPage - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    currentPage,
    totalPages,
    total: items.length,
  };
}

// Explicitly invalidated by persisted UI edits; array/runtime identities cover
// server deltas. Keep only the current projection so old query results cannot
// retain an unbounded fleet. Pagination and selection reuse it without scans.
function createProfileListCache() {
  let summaryKey, summary, filterKey, filtered, idsKey, ids, exitKey, exit;
  const same = (a, b) => a && a.length === b.length && b.every((value, index) => Object.is(value, a[index]));
  return {
    invalidate() { summaryKey = filterKey = summary = filtered = idsKey = ids = exitKey = exit = undefined; },
    ids(profiles) {
      const key = [profiles, profiles.length];
      if (!same(idsKey, key)) { ids = new Set(profiles.map((profile) => profile.id)); idsKey = key; }
      return ids;
    },
    firstExit(profiles) {
      const key = [profiles, profiles.length];
      if (!same(exitKey, key)) { exit = profiles.find((profile) => profile.exitIp); exitKey = key; }
      return exit;
    },
    summarize(profiles, isRunning, runtimeVersion) {
      const key = [profiles, profiles.length, isRunning, runtimeVersion];
      if (!same(summaryKey, key)) {
        summary = summarizeProfiles(profiles, isRunning);
        summaryKey = key;
      }
      return summary;
    },
    filter(options, { runtimeVersion, groups, locale } = {}) {
      const key = [options.profiles, options.profiles.length, runtimeVersion, groups, locale,
        options.activeGroupFilter, options.activeListTab, options.query,
        JSON.stringify(options.advancedFilter), options.sort?.key, options.sort?.dir,
        options.isRunning, options.displayProfileNumber, options.groupNameOf];
      if (!same(filterKey, key)) {
        filtered = filterProfiles(options);
        filterKey = key;
      }
      return filtered;
    },
  };
}

  const api = { ADV_FIELDS, filterProfiles, summarizeProfiles, paginate, createProfileListCache };
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.OpenBrowserProfileList = api;
  } else {
    globalThis.OpenBrowserProfileList = api;
  }
})();
