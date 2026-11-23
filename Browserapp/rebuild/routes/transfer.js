"use strict";

const fs = require("node:fs/promises");
const { O_NONBLOCK, O_RDONLY } = require("node:fs").constants;
const { randomUUID: uid } = require("node:crypto");
const { assertProfileId } = require("../../automation/isolation");
const { sanitizeProfile } = require("../../engine/profile-sanitizer");
const { writeRawAtomically } = require("../../engine/state-storage");
const { maxProfileNumber } = require("../../shared/profile-values");
const { buildProjectLookup, projectNameFor } = require("../profile-index");
const limit = 20 * 1024 * 1024;

function activeExportProfile(engine, id) {
  const profile = engine.profiles.get(id);
  if (!profile)
    throw Object.assign(Error(`Profile not found: ${id}`), { code: "PROFILE_NOT_FOUND" });
  if (profile.trashed || engine.deletingProfiles?.has(id) || engine.profileMaintenance?.has(id))
    throw Object.assign(Error("所选窗口当前不可导出，请刷新后重试"), { code: "PROFILE_INACTIVE" });
  return profile;
}

function exportMetadata(service, profile, groupById) {
  const linked = profile.proxyId ? service.proxyStore?.()?.get(profile.proxyId) : null;
  if (profile.proxyId && !linked)
    throw Error("绑定的代理不存在，无法导出完整配置");
  return {
    proxy: String(linked?.raw || profile.proxy || "").trim(),
    group_name: String(projectNameFor(profile, groupById)).slice(0, 40),
  };
}

async function transferExport(service, p) {
  const e = service.engine;
  if (!Array.isArray(p?.ids) || !p.ids.length || p.ids.length > 200)
    throw Error("一次只能导出 1–200 个窗口");
  const ids = Array.from(p.ids, assertProfileId);
  if (new Set(ids).size !== ids.length) throw Error("请选择不同的窗口");
  for (const id of ids) activeExportProfile(e, id);
  const picked = await service.dialog.showSaveDialog(service.window(), {
    title: "导出窗口配置（文件可能含密码和 Cookie）",
    defaultPath: "openbrowser-profiles.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };

  // Order only this snapshot with LocalService mutations, so a save awaiting
  // persistence cannot supply a draft that may roll back. Neither the picker
  // nor filesystem work holds the queue. Direct engine writes use another lane.
  const rows = await service.enqueueLocal(() => {
    const groupById = buildProjectLookup(service.data.groups);
    return ids.map(id => {
      activeExportProfile(e, id);
      const { profile, rev } = e.profileForEdit(id);
      const metadata = exportMetadata(service, profile, groupById);
      return { id, rev, metadata, exported: sanitizeProfile({ ...profile, ...metadata, proxyId: null }) };
    });
  }, { rollback: false });
  const content = JSON.stringify(
    { format: "openbrowser-profiles", version: 1, profiles: rows.map(row => row.exported) }, null, 2,
  );
  if (Buffer.byteLength(content) > limit)
    throw Error("导出内容超过 20 MiB，请减少窗口数量");

  await writeRawAtomically(picked.filePath, content, undefined, { beforeReplace() {
    const groupById = buildProjectLookup(service.data.groups);
    for (const { id, rev, metadata } of rows) {
      const profile = activeExportProfile(e, id);
      const current = exportMetadata(service, profile, groupById);
      if (e.profiles.revisionOf(id) !== rev || current.group_name !== metadata.group_name || current.proxy !== metadata.proxy)
        throw Object.assign(Error("导出期间窗口配置已变更，请重新导出"), { code: "TRANSFER_SELECTION_CHANGED" });
    }
  } });
  return { count: rows.length };
}

async function transferImport(service) {
  const picked = await service.dialog.showOpenDialog(service.window(), {
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled || !picked.filePaths?.[0]) return { canceled: true };
  const file = await fs.open(picked.filePaths[0], O_RDONLY | O_NONBLOCK);
  let value;
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > limit) throw Error("请选择不超过 20 MiB 的普通文件");
    const buffer = Buffer.alloc(stat.size + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await file.read(buffer, offset, buffer.length - offset, offset);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset !== stat.size || (await file.stat()).mtimeMs !== stat.mtimeMs)
      throw Error("导入文件已更改，请重新选择");
    // Some editors prepend a UTF-8 byte-order mark to otherwise valid JSON.
    value = JSON.parse(buffer.toString("utf8", 0, offset).replace(/^\uFEFF/, ""));
  } finally {
    await file.close();
  }
  if (
    value?.format !== "openbrowser-profiles" ||
    value.version !== 1 ||
    !Array.isArray(value.profiles) ||
    value.profiles.length > 200 ||
    value.profiles.some(row => !row || typeof row !== "object" || Array.isArray(row))
  )
    throw Error("Invalid profile exchange file");
  return service.enqueueLocal(() => commitImport(service, value.profiles));
}

async function commitImport(service, rows) {
  if (!rows.length) return { count: 0 };
  const e = service.engine, additions = [];
  const byName = new Map();
  for (const group of service.data.groups) if (!byName.has(group.projectName)) byName.set(group.projectName, group);
  const profiles = rows.map((v) => {
    let groupId = "";
    if (v.group_name) {
      const name = String(v.group_name).slice(0, 40);
      let group = byName.get(name);
      if (!group) {
        const id = uid();
        group = { id, project_id: id, projectName: name };
        additions.push(group);
        byName.set(name, group);
      }
      groupId = group.id;
    }
    return sanitizeProfile({
      ...v,
      id: uid(),
      proxyId: null,
      groupId,
      platform: {
        ...v.platform,
        accounts: v.platform?.accounts?.map(
          ({ accountId: _accountId, ...account }) => account,
        ),
      },
    });
  });
  // Persist group labels before engine mutation. A failure before the
  // profile commit removes new metadata, not a later status update failure.
  const originalGroups = service.data.groups;
  if (additions.length) {
    service.data.groups = [...originalGroups, ...additions];
    await service.save();
  }
  try {
    let number = maxProfileNumber(e.profiles.values());
    if (!Number.isSafeInteger(number + profiles.length)) throw Error("无法分配新的窗口编号");
    await e.commitProfiles(profiles.map(profile => ({ ...profile, number: ++number })));
  } catch (error) {
    if (additions.length) {
      service.data.groups = originalGroups;
      try { await service.save(); }
      catch (rollbackError) { throw new AggregateError([error, rollbackError], "导入失败且新增项目未能撤销"); }
    }
    throw error;
  }
  return { count: profiles.length };
}

module.exports = [
  ["transfer:export", transferExport, "parallel"],
  ["transfer:import", transferImport, "parallel", false],
];
