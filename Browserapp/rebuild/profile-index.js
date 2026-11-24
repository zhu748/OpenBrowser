"use strict";

const { labelIdsOf } = require("./profile-fields");
const { toRoxy } = require("./profile-dto");

function append(map, key, value) {
  let entries = map.get(key);
  if (!entries) map.set(key, entries = []);
  entries.push(value);
}

function buildProjectLookup(groups) {
  const groupById = new Map(groups.map(row => [row.id, row]));
  // Alias legacy numeric IDs, but preserve exact matches if both forms exist.
  for (const group of groups) {
    if (typeof group.id !== "number") continue;
    const id = String(group.id);
    if (!groupById.has(id)) groupById.set(id, group);
  }
  return groupById;
}

function buildProfileIndex({ snapshot, profiles, version, groups, labels }) {
  const index = {
    snapshot, profiles, version, groups, labels,
    groupById: buildProjectLookup(groups),
    labelById: new Map((labels || []).map(row => [row.id, row])),
    activeByProject: new Map(),
    deletedByProject: new Map(),
    proxyProfiles: new Map(),
    labelProfiles: new Map(),
    activeRows: [],
    deletedRows: [],
    summariesById: new Map(),
    platformUrls: new Set(),
    sortOrders: new Map(),
    activeCount: 0,
  };
  for (const [position, profile] of snapshot.entries()) {
    const labelIds = labelIdsOf(profile);
    const accounts = profile.platform?.accounts || (profile.platform ? [profile.platform] : []);
    const platformUrls = accounts.map(account => account.url || account.startUrl || profile.platform?.startUrl);
    const projectId = String(profile.groupId ?? "");
    const windowName = profile.name || "";
    const windowRemark = profile.note || "";
    const summary = {
      position, trashed: Boolean(profile.trashed), trashedAt: profile.trashedAt,
      windowName, windowRemark, searchText: `${windowName} ${windowRemark}`.toLowerCase(),
      windowSortNum: profile.number, projectId, isOften: Boolean(profile.favorite), os: profile.os,
      coreType: profile.engine === "firefox" ? "Firefox" : "Chrome",
      labelIds,
      platformUrls, createdAt: profile.createdAt, updatedAt: profile.updatedAt, openTime: profile.lastOpenedAt,
    };
    index.summariesById.set(String(profile.id), summary);
    if (summary.trashed) {
      index.deletedRows.push(summary);
      append(index.deletedByProject, projectId, summary);
      continue;
    }
    index.activeRows.push(summary);
    append(index.activeByProject, projectId, summary);
    if (profile.proxyId) append(index.proxyProfiles, profile.proxyId, {
      id: profile.id, windowName: profile.name, windowSortNum: profile.number,
    });
    for (const id of labelIds) append(index.labelProfiles, id, profile.id);
    for (const platformUrl of platformUrls) if (platformUrl) index.platformUrls.add(platformUrl);
  }
  index.activeCount = index.activeRows.length;
  return index;
}

function projectNameFor(profile, groupById) {
  const id = profile.groupId;
  const group = groupById.get(id)
    ?? (typeof id === "number" ? groupById.get(String(id)) : undefined);
  return group?.projectName || profile.group_name || "";
}

function decorateProfile(profile, index) {
  const row = toRoxy(profile);
  const labelInfo = row.labelIds.map(id => index.labelById.get(id)).filter(Boolean).map(label => ({
    labelId: String(label.id), labelName: label.name, labelColor: label.color,
  }));
  return {
    ...row,
    projectName: projectNameFor(profile, index.groupById),
    labelInfo,
    labelInfos: labelInfo,
  };
}

module.exports = { buildProfileIndex, buildProjectLookup, decorateProfile, projectNameFor };
