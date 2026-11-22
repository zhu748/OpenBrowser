"use strict";

const fs = require("node:fs/promises");
const { O_NONBLOCK, O_RDONLY } = require("node:fs").constants;
const { randomUUID: uid } = require("node:crypto");
const { sanitizeProfile } = require("../../engine/profile-sanitizer");
const { writeRawAtomically } = require("../../engine/state-storage");
const { maxProfileNumber } = require("../../shared/profile-values");
const limit = 20 * 1024 * 1024;

async function transferExport(service, p) {
  const e = service.engine;
  if (!Array.isArray(p.ids) || !p.ids.length || p.ids.length > 200)
    throw Error("一次只能导出 1–200 个窗口");
  // One Map for all exported rows instead of a linear groups.find per profile.
  const groupById = new Map(service.data.groups.map((group) => [group.id, group]));
  const profiles = p.ids.map((id) => {
    const profile = e.profileForEdit(String(id)).profile;
    const selected = profile.proxyId
      ? service.proxyStore?.().get(profile.proxyId)
      : null;
    if (profile.proxyId && !selected)
      throw Error("绑定的代理不存在，无法导出完整配置");
    return sanitizeProfile({
      ...profile,
      proxy: selected?.raw || profile.proxy,
      proxyId: null,
      group_name:
        groupById.get(profile.groupId)?.projectName ||
        profile.group_name ||
        "",
    });
  });
  const content = JSON.stringify(
    { format: "openbrowser-profiles", version: 1, profiles },
    null,
    2,
  );
  if (Buffer.byteLength(content) > limit)
    throw Error("导出内容超过 20 MiB，请减少窗口数量");
  const picked = await service.dialog.showSaveDialog(service.window(), {
    title: "导出窗口配置（文件可能含密码和 Cookie）",
    defaultPath: "openbrowser-profiles.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };
  await writeRawAtomically(picked.filePath, content);
  return { count: profiles.length };
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
  // Persist group labels before engine mutation; request rollback handles a
  // failed write. Engine failure removes new metadata before surfacing it.
  const originalGroups = service.data.groups;
  if (additions.length) {
    service.data.groups = [...originalGroups, ...additions];
    await service.save();
  }
  try {
    let number = maxProfileNumber(e.profiles.values());
    if (!Number.isSafeInteger(number + profiles.length)) throw Error("无法分配新的窗口编号");
    await e.syncProfiles(profiles.map(profile => ({ ...profile, number: ++number })));
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
