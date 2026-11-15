"use strict";

const fs = require("node:fs/promises");
const { randomUUID: uid } = require("node:crypto");
const { sanitizeProfile } = require("../../engine/profile-sanitizer");

async function transferExport(service, p) {
  const e = service.engine;
  if (!Array.isArray(p.ids) || !p.ids.length || p.ids.length > 200)
    throw Error("一次只能导出 1–200 个窗口");
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
        service.data.groups.find((group) => group.id === profile.groupId)
          ?.projectName ||
        profile.group_name ||
        "",
    });
  });
  const content = JSON.stringify(
    { format: "openbrowser-profiles", version: 1, profiles },
    null,
    2,
  );
  if (Buffer.byteLength(content) > 20 * 1024 * 1024)
    throw Error("导出内容超过 20 MiB，请减少窗口数量");
  const picked = await service.dialog.showSaveDialog(service.window(), {
    defaultPath: "openbrowser-profiles.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };
  await fs.writeFile(picked.filePath, content, { mode: 0o600 });
  return { count: profiles.length };
}

async function transferImport(service) {
  const e = service.engine;
  const picked = await service.dialog.showOpenDialog(service.window(), {
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };
  const file = picked.filePaths[0];
  if ((await fs.stat(file)).size > 20 * 1024 * 1024)
    throw Error("文件不能超过 20 MiB");
  const value = JSON.parse(await fs.readFile(file, "utf8"));
  if (
    value.format !== "openbrowser-profiles" ||
    value.version !== 1 ||
    !Array.isArray(value.profiles) ||
    value.profiles.length > 200
  )
    throw Error("Invalid profile exchange file");
  const additions = [];
  const profiles = value.profiles.map((v) => {
    let groupId = "";
    if (v.group_name) {
      const name = String(v.group_name).slice(0, 40);
      let group = [...service.data.groups, ...additions].find(
        (row) => row.projectName === name,
      );
      if (!group) {
        const id = uid();
        group = { id, project_id: id, projectName: name };
        additions.push(group);
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
    await e.syncProfiles(profiles);
  } catch (error) {
    service.data.groups = originalGroups;
    await service.save();
    throw error;
  }
  return { count: profiles.length };
}

module.exports = [
  ["transfer:export", transferExport, "serial"],
  ["transfer:import", transferImport, "serial"],
];
