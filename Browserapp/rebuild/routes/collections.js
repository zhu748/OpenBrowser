"use strict";

const { randomUUID: uid } = require("node:crypto");
const { nextRecordId, rememberRecordIds } = require("../local-record-ids");
const { profileRelations } = require("../profile-relations");
// toRoxy is intentionally NOT imported here anymore: the label routes parse
// profile.tag directly (labelIdsOf below) instead of building a full DTO per
// window. See profile-dto.js for the canonical labelIds semantics.
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

async function groupsList(service, p) {
  // The sidebar needs only pinned projects. Avoid cloning discarded rows
  // or preparing the profile index when no project will be returned.
  const groups = p.pinnedOnly
    ? service.data.groups.filter((group) => group.pinStatus === 1)
    : service.data.groups;
  const defaultPin = p.default === 2 ? service.data.settings.defaultProjectPin || 0 : 0;
  const includeDefault = p.default === 2 && (!p.pinnedOnly || defaultPin === 1);
  if (!groups.length && !includeDefault) return [];

  const { groupCounts } = service.profileIndex();
  const rows = groups.map((v) => ({
    ...structuredClone(v),
    projectName: v.projectName,
    project_id: v.id,
    projectId: v.id,
    windowCount: groupCounts.get(String(v.id)) || 0,
    user_info: [
      {
        userId: "local",
        userName: "OpenBrowser",
        pinStatus: v.pinStatus || 0,
      },
    ],
  }));
  if (includeDefault)
    rows.unshift({
      id: "local-default",
      project_id: "local-default",
      projectId: "local-default",
      projectDefault: 1,
      projectName: "默认项目",
      pinStatus: defaultPin,
      windowCount: groupCounts.get("") || 0,
      user_info: [
        {
          userId: "local",
          userName: "OpenBrowser",
          pinStatus: defaultPin,
        },
      ],
    });
  return rows;
}

async function groupsSave(service, p) {
  const id = p.project_id || p.id || uid();
  if (Object.hasOwn(p, "pinStatus") && ![0, 1].includes(p.pinStatus))
    throw Error("项目固定状态无效");
  if (id === "local-default") {
    if (!Object.hasOwn(p, "pinStatus") || Object.hasOwn(p, "projectName"))
      throw Error("默认项目不能重命名");
    service.data.settings.defaultProjectPin = p.pinStatus;
    await service.save();
    service.engine.emit?.({ type: "profiles", action: "group-metadata" });
    return true;
  }
  const previous = service.data.groups.find((v) => v.id === id),
    name = Object.hasOwn(p, "projectName")
      ? String(p.projectName || "").trim()
      : previous?.projectName;
  if (!name) throw Error("请输入项目名称");
  const row = {
    ...previous,
    ...p,
    projectName: name,
    project_id: id,
    projectId: id,
    id,
  };
  service.data.groups = previous ? service.data.groups.map(project => project.id === id ? row : project) :
    [...service.data.groups, row];
  await service.save();
  service.engine.emit?.({ type: "profiles", action: "group-metadata" });
  return row;
}

async function labelsList(service) {
  const labels = service.data.labels || [];
  if (!labels.length) return [];
  const { labelProfiles } = service.profileIndex();
  return labels.map((row) => ({
    ...row,
    bindWindowIds: labelProfiles.get(row.id)?.slice() || [],
  }));
}

// labelIds without building a full ~100-field toRoxy DTO per profile — the
// same tag parsing toRoxy applies (profile-dto.js), used by the label routes
// that only need the id list. A 5000-window label delete used to build up to
// 3 full DTOs per window.
const labelIdsOf = (profile) =>
  /^\d+(,\d+)*$/.test(profile.tag || "")
    ? profile.tag.split(",").map(Number)
    : [];

async function labelsSave(service, p) {
  const e = service.engine;
  if (!String(p.name || "").trim()) throw Error("请输入标签名称");
  if (!/^#[0-9a-f]{6}$/i.test(p.color || "#12a3fc"))
    throw Error("无效的标签颜色");
  service.data.labels ??= [];
  const id = p.id
    ? Number(p.id)
    : nextRecordId(service.data, "labels", [
        ...service.data.filters.flatMap((row) => row.labelIds || []),
        ...e.status().flatMap((profile) => labelIdsOf(profile)),
      ]);
  if (!Number.isSafeInteger(id) || id <= 0) throw Error("Invalid label ID");
  if (p.id && !service.data.labels.some((row) => row.id === id))
    throw Error("标签不存在");
  const row = { ...p, id, color: p.color || "#12a3fc" };
  service.data.labels = service.data.labels
    .filter((label) => label.id !== id)
    .concat(row);
  await service.save();
  e.emit?.({ type: "profiles", action: "label-metadata" });
  return row;
}

async function labelsDelete(service, p) {
  const e = service.engine;
  rememberRecordIds(service.data, "labels");
  const ids = new Set(p.ids.map(Number));
  const changes = [...e.profiles.values()]
    .filter((profile) => labelIdsOf(profile).some((id) => ids.has(id)))
    .map((profile) => {
      const base = e.profileForEdit(profile.id);
      return {
        original: base.profile,
        baseRev: base.rev,
        patch: {
          tag: labelIdsOf(base.profile)
            .filter((id) => !ids.has(id))
            .join(","),
        },
      };
    });
  const result = await profileRelations(service, changes, () => {
    service.data.labels = (service.data.labels || []).filter(
      (row) => !ids.has(row.id),
    );
  });
  e.emit?.({ type: "profiles", action: "label-metadata" });
  return result;
}

async function groupsDelete(service, p) {
  const e = service.engine;
  const ids = new Set(p.ids.map(String));
  if (ids.has("local-default")) throw Error("默认项目不能删除");
  const changes = [...e.profiles.values()]
    .filter((profile) => ids.has(profile.groupId))
    .map((profile) => {
      const base = e.profileForEdit(profile.id);
      return {
        original: base.profile,
        baseRev: base.rev,
        patch: { groupId: "", group_name: "" },
      };
    });
  const result = await profileRelations(service, changes, () => {
    service.data.groups = service.data.groups.filter(
      (row) => !ids.has(String(row.id)),
    );
  });
  e.emit?.({ type: "profiles", action: "group-metadata" });
  return result;
}

async function groupsSort(service, p) {
  const requested = p.projectIds.map(String);
  if (new Set(requested).size !== requested.length)
    throw Error("项目排序不能重复");
  const order = requested.filter((id) => id !== "local-default");
  if (!order.length) return true;
  const selected = new Set(order);
  const byId = new Map();
  for (const row of service.data.groups) {
    const id = String(row.id);
    if (!selected.has(id)) continue;
    if (byId.has(id)) throw Error("排序中的项目 ID 重复");
    byId.set(id, row);
  }
  if (byId.size !== order.length) throw Error("排序中的项目不存在");
  let index = 0;
  let changed = false;
  const sorted = service.data.groups.map((row) => {
    if (!selected.has(String(row.id))) return row;
    const next = byId.get(order[index++]);
    changed ||= next !== row;
    return next;
  });
  if (!changed) return true;
  service.data.groups = sorted;
  await service.save();
  service.engine.emit?.({ type: "profiles", action: "group-metadata" });
  return true;
}

async function templatesList(service) {
  return structuredClone(service.data.templates);
}

async function templatesSave(service, p) {
  if (!String(p.templateName || "").trim()) throw Error("请输入模板名称");
  if (
    p.id != null &&
    (!Number.isSafeInteger(Number(p.id)) || Number(p.id) <= 0)
  )
    throw Error("Invalid template ID");
  // Validate the JSON first with a friendly message: JSON.parse used to leak
  // a raw "Unexpected token ..." SyntaxError for a pasted invalid body.
  let content;
  if (typeof p.content !== "string") throw Error("Invalid template content");
  try { content = JSON.parse(p.content); } catch { throw Error("模板内容必须是合法的 JSON 对象"); }
  if (!object(content)) throw Error("Invalid template content");
  if (p.id && !service.data.templates.some((row) => row.id === Number(p.id)))
    throw Error("模板不存在");
  const row = {
    ...p,
    id: p.id
      ? Number(p.id)
      : nextRecordId(service.data, "templates", [
          service.data.settings.quickTemplate?.id,
        ]),
  };
  service.data.templates = service.data.templates
    .filter((v) => v.id !== row.id)
    .concat(row);
  await service.save();
  return row;
}

async function templatesDelete(service, p) {
  if (!Array.isArray(p.ids)) throw Error("模板 ID 必须是数组");
  const templates = service.data.templates;
  const ids = new Set(p.ids);
  const remaining = templates.filter((row) => !ids.has(row.id));
  if (remaining.length === templates.length) return true;
  // Record the highest old ID before replacing the list.
  rememberRecordIds(service.data, "templates");
  service.data.templates = remaining;
  await service.save();
  return true;
}

async function filtersList(service) {
  const order = new Map(
    (service.data.settings.filterSort || []).map((row) => [
      row.name,
      Number(row.sort),
    ]),
  );
  return structuredClone(service.data.filters).sort(
    (a, b) =>
      (order.get(a.filter_name) ?? Infinity) -
      (order.get(b.filter_name) ?? Infinity),
  );
}

async function filtersSave(service, p) {
  const row = { ...p, filter_name: p.new_filter_name || p.filter_name };
  if (!String(row.filter_name || "").trim()) throw Error("请输入筛选器名称");
  const oldName = p.old_filter_name || row.filter_name;
  if (oldName !== row.filter_name) {
    if (service.data.filters.some((v) => v.filter_name === row.filter_name))
      throw Error("筛选器名称已存在");
    service.data.settings.filterSort = (
      service.data.settings.filterSort || []
    ).map((item) =>
      item.name === oldName
        ? { ...item, name: row.filter_name }
        : item,
    );
  }
  service.data.filters = service.data.filters
    .filter((v) => v.filter_name !== oldName)
    .concat(row);
  await service.save();
  return true;
}

async function filtersDelete(service, p) {
  const filters = service.data.filters;
  const remaining = filters.filter(
    (v) => v.filter_name !== p.filter_name,
  );
  if (remaining.length === filters.length) return true;
  service.data.filters = remaining;
  const settings = service.data.settings;
  if (Array.isArray(settings?.filterSort))
    settings.filterSort = settings.filterSort.filter((item) => item?.name !== p.filter_name);
  await service.save();
  return true;
}

module.exports = [
  ["groups:list", groupsList, "read"],
  ["groups:save", groupsSave, "serial"],
  ["labels:list", labelsList, "read"],
  ["labels:save", labelsSave, "serial"],
  ["labels:delete", labelsDelete, "serial"],
  ["groups:delete", groupsDelete, "serial"],
  ["groups:sort", groupsSort, "serial"],
  ["templates:list", templatesList, "read"],
  ["templates:save", templatesSave, "serial"],
  ["templates:delete", templatesDelete, "serial"],
  ["filters:list", filtersList, "read"],
  ["filters:save", filtersSave, "serial"],
  ["filters:delete", filtersDelete, "serial"],
];
