"use strict";

const { fromRoxy } = require("../profile-dto");
const { writeRawAtomically } = require("../../engine/state-storage");

async function proxiesDetect(service, p) {
  const e = service.engine;
  if (!p.host && !p.moduleId && !p.id)
    return service.dispatch("host:network", { probe: true });
  const store = p.moduleId || p.id ? service.proxyStore() : null;
  const selected =
    p.moduleId || p.id
      ? store.get(String(p.moduleId || p.id))
      : null;
  if ((p.moduleId || p.id) && !selected)
    throw Error("所选代理不存在，请刷新后重试");
  const profile = fromRoxy({
    windowName: "Proxy test",
    proxyInfoList: [selected || p],
  });
  const probe = () => e.testProxy({
    ...profile,
    proxyMeta: {
      ...profile.proxyMeta,
      ipChannel: p.checkChannel || selected?.ipChannel || "ip-api",
    },
  });
  const { result } = selected && p.persist !== false ? await store.checkAndRecord(selected, probe) : { result: await probe() };
  return { ...result, country_code: result.countryCode || "" };
}

async function proxiesRefresh(service, p) {
  const url = p.id ? service.proxyStore().get(String(p.id))?.refreshUrl : p.url;
  if (!url) throw Error("未配置动态代理 IP 刷新 URL");
  return require("../../proxy-forwarder").invokeProxyRefresh(url);
}

async function proxiesExtract(_service, p) {
  return require("../../network/outbound").fetchUrlText(p.url, {
    timeout: 20000,
  });
}

function listRow(row, usage) {
  const { username: _username, password: _password, raw: _raw, chromeUrl: _chromeUrl, refreshUrl, ...summary } = row;
  return { ...summary, hasRefreshUrl: Boolean(refreshUrl), bindList: usage.get(row.id) || [] };
}

function proxiesList(service, p) {
  const usage = service.profileIndex().proxyProfiles;
  return service.proxyStore().list(p).map(row => listRow(row, usage));
}

function proxiesQuery(service, p) {
  const index = Number(p.page_index ?? 1), size = Number(p.page_size ?? 200);
  if (!Number.isSafeInteger(index) || index < 1 || !Number.isSafeInteger(size) || size < 1 || size > 5000)
    throw Error("分页参数无效，单页范围 1–5000");

  const values = value => (Array.isArray(value) ? value : String(value ?? "").split(","))
    .map(value => String(value).trim().toLowerCase()).filter(Boolean);
  const contains = (fields, query) => fields.some(field => String(field ?? "").toLowerCase().includes(query));
  const protocols = values(p.proxyProtocol);
  const countries = values(p.proxyLastCountry);
  const providers = values(p.proxyProvider ?? p.providerType);
  const binding = values(p.proxyBindStatus);
  const sources = values(p.proxyType);
  const expiry = values(p.proxyExpireStatus);
  const host = String(p.proxyHost ?? "").trim().toLowerCase();
  const remark = String(p.proxyRemark ?? "").trim().toLowerCase();
  const query = String(p.queryValue ?? "").trim().toLowerCase();
  const usage = service.profileIndex().proxyProfiles;
  const rows = service.proxyStore().list(p).filter(row => {
    const provider = String(row.vendor || "本地").toLowerCase();
    const country = [row.lastCountry, row.lastCountryCode].map(value => String(value ?? "").toLowerCase());
    if (protocols.length && !protocols.includes(row.protocol)) return false;
    if (countries.length && !countries.some(value => country.includes(value))) return false;
    if (providers.length && !providers.includes(provider)) return false;
    if (binding.length && !binding.includes(usage.get(row.id)?.length ? "1" : "0")) return false;
    if (sources.length && !sources.includes("0")) return false;
    if (expiry.length && !expiry.includes("1")) return false;
    if (host && !contains([row.host, `${row.host}:${row.port}`], host)) return false;
    if (remark && !contains([row.remark], remark)) return false;
    if (!query) return true;
    switch (p.queryKey) {
      case "proxyHost": return contains([row.host, `${row.host}:${row.port}`], query);
      case "proxyLastCountry": return contains(country, query);
      case "username": return contains([row.username], query);
      case "proxyRemark": return contains([row.remark], query);
      case "proxyProvider": return contains([provider], query);
      default: return contains([row.name, row.host, row.port, row.protocol, row.remark, row.lastIp, row.lastCity, ...country], query);
    }
  });
  const sortFields = { lastCountry: "lastCountry", createTime: "create_time", proxyProviderName: "vendor" };
  const field = Object.hasOwn(sortFields, p.orderName) && sortFields[p.orderName];
  if (field) {
    const direction = /desc|^-1$/i.test(String(p.orderType)) ? -1 : 1;
    rows.sort((a, b) => direction * String(a[field] ?? "").localeCompare(String(b[field] ?? "")) || a.id.localeCompare(b.id));
  }
  return { total: rows.length, rows: rows.slice((index - 1) * size, index * size).map(row => listRow(row, usage)) };
}

function proxiesOptions(service) {
  const rows = service.proxyStore().list();
  return {
    countries: [...new Set(rows.map(row => row.lastCountry).filter(Boolean))],
    vendors: [...new Set(rows.map(row => row.vendor || "本地"))],
  };
}

function proxiesRandom(service) {
  const rows = service.proxyStore().list();
  if (!rows.length) return null;
  return listRow(rows[Math.floor(Math.random() * rows.length)], service.profileIndex().proxyProfiles);
}

async function proxiesSummaries(service, p) {
  const usage = service.profileIndex().proxyProfiles;
  return service.proxyStore().list(p).map(({ id, name, protocol, host, port, remark, lastCheckOk, lastIp }) => ({
    id, name, protocol, host, port, remark, lastCheckOk, lastIp,
    windowCount: usage.get(id)?.length || 0,
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

function proxiesUpdateMany(service, p) {
  return service.proxyStore().updateMany(p.items);
}

async function proxiesBind(service, p) {
  const e = service.engine;
  if (!Array.isArray(p.windowIds) || p.windowIds.length > 200)
    throw Error("一次只能关联 0–200 个窗口");
  const proxy = service.proxyStore().get(String(p.proxyId));
  if (!proxy) throw Error("代理不存在");
  const selected = new Set(p.windowIds.map(String));
  for (const id of selected) {
    if (e.profileForEdit(id).profile.trashed) throw Error("请先恢复回收站中的窗口");
  }
  const changes = [];
  for (const row of e.profiles.values()) {
    if (row.trashed || selected.has(row.id) === (row.proxyId === proxy.id)) continue;
    const current = e.profileForEdit(row.id);
    const patch = selected.has(row.id) ? { proxyInfoList: [proxy] } : { proxyCategory: "noproxy" };
    changes.push({ ...fromRoxy(patch, current.profile), rev: current.rev });
  }
  if (changes.length) await e.syncProfiles(changes, { checkRevisions: true, delta: true });
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
        ...(row.checkStatus === 2 && { errorClass: "unknown" }),
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
    title: "导出代理配置（文件可能含登录凭据）",
    defaultPath: "openbrowser-proxies.json",
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (picked.canceled) return { canceled: true };
  await writeRawAtomically(
    picked.filePath,
    JSON.stringify(
      { format: "openbrowser-proxies", version: 1, proxies: rows },
      null,
      2,
    ),
  );
  return { count: rows.length };
}

module.exports = [
  ["proxies:detect", proxiesDetect, "parallel"],
  ["proxies:refresh", proxiesRefresh, "parallel"],
  ["proxies:extract", proxiesExtract, "parallel"],
  ["proxies:list", proxiesList, "parallel"],
  ["proxies:query", proxiesQuery, "parallel"],
  ["proxies:options", proxiesOptions, "parallel", false],
  ["proxies:random", proxiesRandom, "parallel"],
  ["proxies:summaries", proxiesSummaries, "parallel"],
  ["proxies:read", proxiesRead, "parallel"],
  ["proxies:duplicates", proxiesDuplicates, "serial"],
  ["proxies:create-many", proxiesCreateMany, "serial"],
  ["proxies:create", proxiesCreate, "serial"],
  ["proxies:update", proxiesUpdate, "serial"],
  ["proxies:update-many", proxiesUpdateMany, "serial"],
  ["proxies:bind", proxiesBind, "serial"],
  ["proxies:save-results", proxiesSaveResults, "serial"],
  ["proxies:delete", proxiesDelete, "serial"],
  ["proxies:export", proxiesExport, "parallel", false],
];
