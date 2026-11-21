"use strict";
const { maxProfileNumber } = require('../../shared/profile-values');

const fs = require("node:fs/promises");
const { O_RDONLY, O_NONBLOCK } = require("node:fs").constants;
const path = require("node:path");
const { randomUUID: uid } = require("node:crypto");
const { sanitizeProfile } = require("../../engine/profile-sanitizer");
const { assertProfileId } = require("../../automation/isolation");
const { fromRoxy, toRoxy } = require("../profile-dto");
const { profileFromPreview, savePreviewProfiles } = require('../fingerprint-draft');
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

async function profilesQuery(service, p) {
  return require("../profile-query").queryProfiles(service, p);
}

function profilesCount(service) {
  return { count: service.profileIndex().activeCount };
}

async function profilesClearCache(service, p) {
  const e = service.engine;
  return require("../profile-cache").clearLocalCache(e, p);
}

async function profilesChooseImport(service) {
  const choice = await service.dialog.showOpenDialog(service.window(), {
    properties: ["openFile"],
    filters: [{ name: "窗口导入", extensions: ["xlsx", "txt"] }],
  });
  if (choice.canceled || !choice.filePaths?.[0]) return null;
  const file = choice.filePaths[0],
    extension = path.extname(file).toLowerCase();
  if (![".xlsx", ".txt"].includes(extension))
    throw Error("仅支持 .xlsx 或 .txt 文件");
  const limit = 5 * 1024 * 1024;
  const handle = await fs.open(file, O_RDONLY | O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw Error("请选择普通文件");
    if (stat.size > limit) throw Error("导入文件不能超过 5 MiB");
    // Read a bounded snapshot from the same handle that was checked above.
    const bytes = new Uint8Array(stat.size + 1);
    let size = 0;
    while (size < bytes.length) {
      const { bytesRead } = await handle.read(bytes, size, bytes.length - size, size);
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > limit) throw Error("导入文件不能超过 5 MiB");
    const current = await handle.stat();
    if (size !== stat.size || current.size !== stat.size || current.mtimeMs !== stat.mtimeMs) {
      throw Error("导入文件已更改，请重新选择");
    }
    return {
      name: path.basename(file),
      size,
      bytes: bytes.subarray(0, size),
      type:
        extension === ".txt"
          ? "text/plain"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } finally {
    await handle.close();
  }
}

async function profilesAnalyseImport(service, p, method) {
  const e = service.engine;
  const rows = require("../import-profiles").importRows(p);
  if (
    p.fingerDetail !== undefined &&
    (!Array.isArray(p.fingerDetail) || p.fingerDetail.length !== rows.length)
  )
    throw Error("指纹条数与导入窗口数不一致");
  const start = maxProfileNumber(e.status());
  const allocated = new Set();
  const profiles = rows.map((row, index) => {
    const { excelData: _rows, fingerDetail, fileName: _name, ...defaults } = p;
    const profile = profileFromPreview(e, {
      ...service.resolveInputs(defaults),
      ...fingerDetail?.[index],
      ...row,
      sortNum: start + index + 1,
    }, allocated);
    if (row._importRefreshUrl)
      profile.proxyMeta = {
        ...profile.proxyMeta,
        refreshUrl: row._importRefreshUrl,
      };
    return profile;
  });
  if (method === "profiles:analyse-import") return { count: profiles.length };
  await savePreviewProfiles(e, profiles);
  return { successCount: profiles.length };
}

async function profilesReadImport(service) {
  const file = await profilesChooseImport(service);
  if (!file) return null;
  const excelData = await require('../profile-import-formats').parseProfileImport(file);
  const payload = { fileName: file.name, excelData };
  const { count } = await profilesAnalyseImport(service, payload, 'profiles:analyse-import');
  return { ...payload, count };
}

async function profilesList(service) {
  const e = service.engine;
  return e
    .status()
    .filter((v) => !v.trashed)
    .map((v) => service.decorate(v));
}

function profilesSelectionStatus(service, p) {
  if (!Array.isArray(p.ids) || p.ids.length > 5000) throw Error("无效的窗口选择");
  const engine = service.engine;
  const rows = [];
  for (const id of new Set(p.ids.map(String))) {
    const profile = engine.profiles.get(id);
    if (!profile || profile.trashed) continue;
    const openStatus = Boolean(engine.publicRunning(id).running);
    rows.push({ id, sortNum: profile.number, openStatus,
      statusInfo: openStatus ? [{ openUserId: "local", openUserName: "OpenBrowser" }] : [] });
  }
  return rows;
}

function profilesOpenRows(service, p) {
  if (p.ids != null && (!Array.isArray(p.ids) || p.ids.length > 5000)) throw Error("无效的窗口选择");
  const ids = p.ids == null ? null : new Set(p.ids.map(String));
  return service.engine.status().filter(profile => !profile.trashed && (ids ? ids.has(profile.id) : profile.running))
    .map(profile => service.decorate(profile));
}

function profilesLifecycleRows(service) {
  return service.engine.status()
    .filter(profile => !profile.trashed && (profile.running || profile.lifecycle?.pending || profile.lifecycle?.error))
    .map(profile => ({ id: profile.id, openStatus: Boolean(profile.running), lifecycle: profile.lifecycle }));
}

function profilesPlatformOptions(service) {
  return { rows: [...service.profileIndex().platformUrls].map(platformUrl => ({ platformUrl })) };
}

function profilesNextNumber(service) {
  return { windowSortNum: maxProfileNumber(service.engine.profiles.values()) + 1 };
}

async function profilesRead(service, p) {
  const e = service.engine;
  const r = e.profileForEdit(String(p.id));
  return { ...service.decorate(r.profile), rev: r.rev };
}

async function profilesCreate(service, p) {
  const e = service.engine;
  if (!object(p)) throw Error("Invalid create payload");
  const n = maxProfileNumber(e.status()) + 1;
  const profile = profileFromPreview(e, { ...service.resolveInputs(p), sortNum: n });
  await savePreviewProfiles(e, [profile]);
  return { windowId: profile.id, ...toRoxy(profile) };
}

async function profilesCreateBatch(service, p) {
  const e = service.engine;
  const count = Number(p.createCount);
  if (!Number.isInteger(count) || count < 1 || count > 100)
    throw Error("一次只能创建 1–100 个窗口");
  const proxies = p.proxyInfoList || [],
    fingers = p.fingerDetail || [];
  const accounts = [
    ...(p.windowPlatformList || []),
    ...(p.platformUrlIds || []).map((id) => ({ accountId: id })),
  ];
  if (proxies.length > count || (fingers.length && fingers.length !== count))
    throw Error("批量代理或指纹数量与窗口数量不一致");
  if (p.platformBindType !== 2 && accounts.length > count)
    throw Error("账号数量不能大于窗口数量");
  let number = maxProfileNumber(e.status());
  const allocated = new Set();
  const profiles = Array.from({ length: count }, (_, i) => {
    const selected =
      p.platformBindType === 2 ? accounts : accounts.slice(i, i + 1);
    const proxy = proxies[i] || { proxyCategory: "noproxy" };
    const profileInput = service.resolveInputs({
      ...p,
      ...fingers[i],
      sortNum: ++number,
      windowName:
        String(p.windowNamePrefix || p.windowName || "窗口") + " " + (i + 1),
      proxyCategory: proxy.proxyCategory,
      proxyInfoList: [proxy],
      windowPlatformList: selected.filter((a) => !a.accountId),
      platformUrlIds: selected
        .filter((a) => a.accountId)
        .map((a) => a.accountId),
    });
    return profileFromPreview(e, profileInput, allocated);
  });
  // Validate every row before the original engine commits the whole batch.
  await savePreviewProfiles(e, profiles);
  return profiles.map(toRoxy);
}

async function profilesUpdate(service, p) {
  const e = service.engine;
  const id = String(p.id ?? p.windowId ?? p.dirId ?? "");
  const base = e.profileForEdit(id);
  const rev = p.rev;
  if (!Number.isInteger(rev)) throw Error("请重新打开编辑表单以读取版本");
  const profile = fromRoxy(service.resolveInputs(p), base.profile);
  await e.applyProfileCommands(
    [
      {
        kind: "modify",
        id,
        baseRev: rev,
        profile: {
          ...profile,
          credentialsAction: "replace",
          proxyAuthAction: "clear",
        },
      },
    ],
    {
      delta: true,
    },
  );
  return profilesRead(service, { id });
}

async function profilesStart(service, p) {
  const e = service.engine;
  const id = String(p.id),
    result = await e.start(e.profileForEdit(id).profile);
  if (result.alreadyRunning) return result;
  try {
    const current = e.profileForEdit(id);
    await e.applyProfileCommands(
      [
        {
          kind: "modify",
          id,
          baseRev: current.rev,
          profile: {
            ...current.profile,
            lastOpenedAt: new Date().toISOString(),
          },
        },
      ],
      { delta: true },
    );
  } catch (error) {
    const warning = "窗口已启动，但最后打开时间保存失败：" + error.message;
    e.emit({ type: "profile-metadata-error", id, message: warning });
    return {
      ...result,
      warningMessages: [...(result.warningMessages || []), warning],
    };
  }
  return result;
}

async function profilesClone(service, p) {
  const e = service.engine;
  const rows = p.ids.map((id) => e.profileForEdit(String(id)).profile);
  let number = maxProfileNumber(e.status());
  const copies = rows.map((v) =>
    sanitizeProfile({
      ...v,
      id: uid(),
      name: v.name + " 副本",
      number: ++number,
    }),
  );
  await e.syncProfiles(copies);
  return copies.map((v) => ({
    ...toRoxy(v),
    projectName:
      service.data.groups.find((group) => group.id === v.groupId)
        ?.projectName ||
      v.group_name ||
      "",
  }));
}

async function profilesPatch(service, p) {
  const e = service.engine;
  const ids = p.ids.map(String);
  const { fingerDetail, ...patch } = p.patch;
  if (
    fingerDetail !== undefined &&
    (!Array.isArray(fingerDetail) ||
      fingerDetail.length !== ids.length ||
      fingerDetail.some(
        (row) =>
          !object(row) ||
          typeof row.userAgent !== "string" ||
          !row.userAgent.trim(),
      ))
  )
    throw Error("指纹条数或 UA 与更新窗口不一致");
  const commands = ids.map((id, index) => {
    const base = e.profileForEdit(id);
    return {
      kind: "modify",
      id,
      baseRev: base.rev,
      profile: {
        ...fromRoxy(
          service.resolveInputs({ ...patch, ...fingerDetail?.[index] }),
          base.profile,
        ),
        credentialsAction: "replace",
        proxyAuthAction: "clear",
      },
    };
  });
  if (commands.length) await e.applyProfileCommands(commands, { delta: true });
  return true;
}

async function profilesStop(service, p) {
  const e = service.engine;
  const id = String(p.id);
  const result = await e.stop(id);
  if (result?.running || result?.cleanupBlocked) {
    throw Object.assign(Error("窗口关闭尚未确认，请稍后重试"), { code: "BROWSER_EXIT_UNCONFIRMED" });
  }
  return result;
}

async function profilesEditData(service, p) {
  const e = service.engine;
  const ids = p.ids.map(String);
  if (p.proxyList && p.proxyList.length !== ids.length)
    throw Error("代理数量与窗口数量不一致");
  const commands = ids.map((id, index) => {
    const current = e.profileForEdit(id);
    let patch = p.paramList || p.proxyList?.[index] || {};
    if (p.type === "platform_edit") patch = { ...patch, platformUrlIds: [] };
    if (p.type === "proxy_delete") patch = { proxyCategory: "noproxy" };
    if (["platform_add", "platform_select"].includes(p.type)) {
      const selected = service.resolveInputs(patch);
      patch = {
        ...selected,
        platformUrlIds: [],
        windowPlatformList: [
          ...toRoxy(current.profile).windowPlatformList,
          ...(selected.windowPlatformList || []),
        ],
      };
      const seen = new Set();
      patch.windowPlatformList = patch.windowPlatformList.filter((row) => {
        if (!row.accountId) return true;
        if (seen.has(row.accountId)) return false;
        seen.add(row.accountId);
        return true;
      });
    }
    return {
      kind: "modify",
      id,
      baseRev: current.rev,
      profile: {
        ...fromRoxy(service.resolveInputs(patch), current.profile),
        credentialsAction: "replace",
        proxyAuthAction: "clear",
      },
    };
  });
  await e.applyProfileCommands(commands, { delta: true });
  return true;
}

async function profileLifecycleBatch(values, countField, apply, defaults = {}) {
  if (!Array.isArray(values) || values.length > 5000) throw Error("窗口选择数量无效");
  const ids = [...new Set(values.map(value => assertProfileId(String(value))))];
  const result = { success: true, [countField]: 0, ids: [], ...defaults };
  for (let offset = 0; offset < ids.length; offset += 200) {
    const chunk = ids.slice(offset, offset + 200);
    try {
      const completed = await apply(chunk);
      result[countField] += completed[countField];
      result.ids.push(...completed.ids);
      if ("stopped" in result) result.stopped += completed.stopped || 0;
    } catch (cause) {
      const remainingIds = ids.slice(offset);
      if (!offset) throw cause;
      throw Object.assign(Error(`已处理 ${result[countField]} 个窗口，其余 ${remainingIds.length} 个未处理。 ${cause.message}`, { cause }), {
        code: cause.code || "PROFILE_BATCH_PARTIAL", completed: result[countField], remainingIds,
      });
    }
  }
  return result;
}

function profilesDelete(service, p) {
  return profileLifecycleBatch(p.ids, "trashed", async ids => {
    await service.beforeRemove?.(ids);
    return service.engine.trashProfiles(ids);
  }, { stopped: 0 });
}

function profilesRestore(service, p) {
  return profileLifecycleBatch(p.ids, "restored", ids => service.engine.restoreProfiles(ids));
}

function profilesPurge(service, p) {
  return profileLifecycleBatch(p.ids, "deleted", async ids => {
    await service.beforeRemove?.(ids);
    return service.engine.purgeProfiles(ids, true);
  }, { stopped: 0, dataDeleted: true });
}

async function profilesTrash(service) {
  const e = service.engine;
  return e
    .status()
    .filter((v) => v.trashed)
    .map((v) => ({
      ...toRoxy(v),
      projectName:
        service.data.groups.find((group) => group.id === v.groupId)
          ?.projectName ||
        v.group_name ||
        "",
    }));
}

async function profilesProxyResults(service, p) {
  const e = service.engine;
  if (!Array.isArray(p.proxyList) || p.proxyList.length > 200)
    throw Error("无效的窗口检测结果");
  const commands = p.proxyList.map((row) => {
    const id = String(row.id || row.dirId),
      current = e.profileForEdit(id),
      checked = new Date(row.checkTime || Date.now());
    if (!Number.isFinite(checked.getTime())) throw Error("无效的代理检测时间");
    return {
      kind: "modify",
      id,
      baseRev: current.rev,
      profile: sanitizeProfile({
        ...current.profile,
        exitIp: row.lastIp || "",
        exitCountryCode: row.lastCountry || "",
        exitTimezone: row.timezone || "",
        exitCheckedAt: checked.toISOString(),
      }),
    };
  });
  if (commands.length) await e.applyProfileCommands(commands, { delta: true });
  return true;
}

module.exports = [
  ["profiles:count", profilesCount, "parallel"],
  ["profiles:query", profilesQuery, "parallel"],
  ["profiles:clear-cache", profilesClearCache, "serial"],
  ["profiles:choose-import", profilesChooseImport, "parallel"],
  ["profiles:read-import", profilesReadImport, "parallel"],
  ["profiles:analyse-import", profilesAnalyseImport, "serial"],
  ["profiles:import", profilesAnalyseImport, "serial"],
  ["profiles:list", profilesList, "parallel"],
  ["profiles:selection-status", profilesSelectionStatus, "parallel", false],
  ["profiles:open-rows", profilesOpenRows, "parallel"],
  ["profiles:lifecycle-rows", profilesLifecycleRows, "parallel", false],
  ["profiles:platform-options", profilesPlatformOptions, "parallel"],
  ["profiles:next-number", profilesNextNumber, "parallel", false],
  ["profiles:read", profilesRead, "parallel"],
  ["profiles:create", profilesCreate, "serial"],
  ["profiles:create-batch", profilesCreateBatch, "serial"],
  ["profiles:update", profilesUpdate, "serial"],
  ["profiles:start", profilesStart, "parallel"],
  ["profiles:clone", profilesClone, "serial"],
  ["profiles:patch", profilesPatch, "serial"],
  ["profiles:stop", profilesStop, "parallel"],
  ["profiles:edit-data", profilesEditData, "serial"],
  ["profiles:delete", profilesDelete, "serial"],
  ["profiles:restore", profilesRestore, "serial"],
  ["profiles:purge", profilesPurge, "serial"],
  ["profiles:trash", profilesTrash, "parallel"],
  ["profiles:proxy-results", profilesProxyResults, "serial"],
];
