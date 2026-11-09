(() => {
'use strict';

function normalizeText(value) {
  return String(value ?? '').toLocaleLowerCase();
}

// Roxy 对齐：搜索支持 字段::值 语法（name/remark/account/proxy/tag/os/kernel/id/group），
// 其余词仍走全文模糊匹配；多个条件之间是「与」关系。
const FIELD_ALIASES = {
  name: ['name'],
  remark: ['remark'],
  account: ['account'],
  proxy: ['proxy'],
  tag: ['tag'],
  os: ['os'],
  kernel: ['kernel'],
  id: ['id'],
  group: ['group'],
};

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

function filterProfiles({ profiles = [], activeGroupFilter = 'all', query = '', displayProfileNumber, groupNameOf }) {
  const numberOf = typeof displayProfileNumber === 'function' ? displayProfileNumber : (profile) => profile?.number || profile?.id || '';
  const groupOf = typeof groupNameOf === 'function' ? groupNameOf : () => '';
  const fieldTokens = [];
  const textTokens = [];
  for (const raw of String(query ?? '').trim().split(/\s+/)) {
    if (!raw) continue;
    const match = raw.match(/^([a-zA-Z_]+)::(.*)$/);
    if (match && FIELD_ALIASES[match[1].toLowerCase()]) fieldTokens.push([match[1].toLowerCase(), normalizeText(match[2])]);
    else textTokens.push(normalizeText(raw));
  }
  return profiles.filter((profile) => {
    if (activeGroupFilter === 'trash') return Boolean(profile.trashed);
    if (profile.trashed) return false;
    if (activeGroupFilter === 'ungrouped') return !profile.groupId;
    if (activeGroupFilter !== 'all' && profile.groupId !== activeGroupFilter) return false;
    return true;
  }).filter((profile) => {
    const freeText = [
      profile.name,
      profile.title,
      profile.id,
      numberOf(profile),
      profile.browser,
      profile.proxy,
      profile.tag,
      groupOf(profile),
    ].map(normalizeText);
    for (const token of textTokens) {
      if (!freeText.some((value) => value.includes(token))) return false;
    }
    for (const [field, needle] of fieldTokens) {
      const hay = profileFieldText(profile, field, displayProfileNumber, groupNameOf).map(normalizeText);
      if (!hay.some((value) => value.includes(needle))) return false;
    }
    return true;
  });
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

  const api = { filterProfiles, paginate };
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else if (typeof window !== 'undefined') {
    window.OpenBrowserProfileList = api;
  } else {
    globalThis.OpenBrowserProfileList = api;
  }
})();
