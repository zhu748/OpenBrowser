"use strict";

const fs = require("node:fs/promises");
const { fromRoxy } = require("../profile-dto");

async function proxiesDetect(service, p) {
  const e = service.engine;
  if (!p.host && !p.moduleId && !p.id)
    return service.dispatch("host:network", { probe: true });
  const selected =
    p.moduleId || p.id
      ? service.proxyStore().get(String(p.moduleId || p.id))
      : null;
  if ((p.moduleId || p.id) && !selected)
    throw Error("所选代理不存在，请刷新后重试");
  const profile = fromRoxy({
    windowName: "Proxy test",
    proxyInfoList: [selected || p],
  });
  const result = await e.testProxy({
    ...profile,
    proxyMeta: {
      ...profile.proxyMeta,
      ipChannel: p.checkChannel || "ip-api",
    },
  });
  if (selected) await service.proxyStore().markCheck(selected.id, result);
  return { ...result, country_code: result.countryCode || "" };
}

async function proxiesRefresh(_service, p) {
  return require("../../proxy-forwarder").invokeProxyRefresh(p.url);
}

async function proxiesExtract(_service, p) {
  return require("../../network/outbound").fetchUrlText(p.url, {
    timeout: 20000,
  });
}

async function proxiesList(service, p) {
  return service
    .proxyStore()
    .list(p)
    .map((row) => ({
      ...row,
      bindList: service.profileIndex().proxyProfiles.get(row.id) || [],
    }));
}

async function proxiesRead(service, p) {
  const row = service.proxyStore().get(String(p.id));
  if (!row) throw Error("代理不存在");
  return row;
}

async function proxiesDuplicates(service, p) {
  if (!Array.isArray(p.items) || p.items.length > 500)
    throw Error("一次只能检查 0–500 条代理");
  const existing = service.proxyStore().list();
  const key = (row) =>
    [
      String(row.host).toLowerCase(),
      Number(row.port),
      String(row.username ?? row.proxyUserName ?? ""),
      String(row.password ?? row.proxyPassword ?? ""),
    ].join("\0");
  const known = new Set(existing.map(key));
  return {
    items: p.items.map((item) => ({
      tempId: String(item.tempId),
      hasImportRecord: known.has(key(item)),
    })),
  };
}

async function proxiesCreateMany(service, p) {
  return service.proxyStore().createMany(p.items);
}

async function proxiesCreate(service, p) {
  return service.proxyStore().create(p);
}

async function proxiesUpdate(service, p) {
  return service.proxyStore().update(p.id, p);
}

async function proxiesBind(service, p) {
  const e = service.engine;
  if (!Array.isArray(p.windowIds) || p.windowIds.length > 200)
    throw Error("一次只能关联 0–200 个窗口");
  const proxy = service.proxyStore().get(String(p.proxyId));
  if (!proxy) throw Error("代理不存在");
  const selected = new Set(p.windowIds.map(String));
  for (const id of selected) e.profileForEdit(id);
  const commands = e
    .status()
    .filter((row) => selected.has(row.id) || row.proxyId === proxy.id)
    .map((row) => {
      const current = e.profileForEdit(row.id);
      return {
        kind: "modify",
        id: row.id,
        baseRev: current.rev,
        profile: fromRoxy(
          selected.has(row.id)
            ? { proxyInfoList: [proxy] }
            : { proxyCategory: "noproxy" },
          current.profile,
        ),
      };
    });
  if (commands.length) await e.applyProfileCommands(commands, { delta: true });
  return true;
}

async function proxiesSaveResults(service, p) {
  if (!Array.isArray(p.proxyList) || p.proxyList.length > 500)
    throw Error("无效的代理检测结果");
  for (const row of p.proxyList)
    if (!service.proxyStore().get(String(row.id))) throw Error("代理不存在");
  return Promise.all(
    p.proxyList.map((row) =>
      service.proxyStore().markCheck(String(row.id), {
        ip: row.lastIp || "",
        countryCode: row.lastCountry || "",
        city: row.lastCity || "",
        timezone: row.timezone || "",
      }),
    ),
  );
}

async function proxiesDelete(service, p) {
  const e = service.engine;
  const ids = new Set(p.ids.map(String));
  const bound = e.status().filter((row) => ids.has(row.proxyId));
  if (bound.length)
    throw Error(
      "代理仍关联 " + bound.length + " 个窗口（含回收站），请先解除关联",
    );
  return service.proxyStore().remove(p.ids);
}

async function proxiesExport(service, p) {
  const rows = p.ids.map((id) => service.proxyStore().get(String(id)));
  if (rows.some((row) => !row)) throw Error("代理不存在，请刷新后重试");
  const picked = await service.dialog.showSaveDialog(service.window(), {
    defaultPath: "openbrowser-proxies.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };
  await fs.writeFile(
    picked.filePath,
    JSON.stringify(
      { format: "openbrowser-proxies", version: 1, proxies: rows },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  return { count: rows.length };
}

module.exports = [
  ["proxies:detect", proxiesDetect, "parallel"],
  ["proxies:refresh", proxiesRefresh, "parallel"],
  ["proxies:extract", proxiesExtract, "parallel"],
  ["proxies:list", proxiesList, "parallel"],
  ["proxies:read", proxiesRead, "parallel"],
  ["proxies:duplicates", proxiesDuplicates, "serial"],
  ["proxies:create-many", proxiesCreateMany, "serial"],
  ["proxies:create", proxiesCreate, "serial"],
  ["proxies:update", proxiesUpdate, "serial"],
  ["proxies:bind", proxiesBind, "serial"],
  ["proxies:save-results", proxiesSaveResults, "serial"],
  ["proxies:delete", proxiesDelete, "serial"],
  ["proxies:export", proxiesExport, "serial"],
];
