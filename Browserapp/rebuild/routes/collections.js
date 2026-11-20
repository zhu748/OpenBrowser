"use strict";

const { randomUUID: uid } = require("node:crypto");
const { nextRecordId, rememberRecordIds } = require("../local-record-ids");
const { profileRelations } = require("../profile-relations");
const { toRoxy } = require("../profile-dto");
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

async function groupsList(service, p) {
  const index = service.profileIndex();
  const rows = service.data.groups.map((v) => ({
    ...structuredClone(v),
    projectName: v.projectName,
    project_id: v.id,
    projectId: v.id,
    windowCount: index.groupCounts.get(v.id) || 0,
    user_info: [
      {
        userId: "local",
        userName: "OpenBrowser",
        pinStatus: v.pinStatus || 0,
      },
    ],
  }));
  if (p.default === 2)
    rows.unshift({
      id: "local-default",
      project_id: "local-default",
      projectId: "local-default",
      projectDefault: 1,
      projectName: "默认项目",
      pinStatus: service.data.settings.defaultProjectPin || 0,
      windowCount: index.groupCounts.get("") || 0,
      user_info: [
        {
          userId: "local",
          userName: "OpenBrowser",
          pinStatus: service.data.settings.defaultProjectPin || 0,
        },
      ],
    });
  return p.pinnedOnly ? rows.filter((row) => row.pinStatus === 1) : rows;
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
  return (service.data.labels || []).map((row) => ({
    ...row,
    bindWindowIds: service.profileIndex().labelProfiles.get(row.id) || [],
  }));
}

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
        ...e.status().flatMap((profile) => toRoxy(profile).labelIds),
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
  const ids = p.ids.map(Number);
  const changes = [...e.profiles.values()]
    .filter((profile) =>
      toRoxy(profile).labelIds.some((id) => ids.includes(id)),
    )
    .map((profile) => {
      const base = e.profileForEdit(profile.id);
      return {
        original: base.profile,
        baseRev: base.rev,
        patch: {
          tag: toRoxy(base.profile)
            .labelIds.filter((id) => !ids.includes(id))
            .join(","),
        },
      };
    });
  return profileRelations(e, changes, async () => {
    service.data.labels = (service.data.labels || []).filter(
      (row) => !ids.includes(row.id),
    );
    await service.save();
    return true;
  });
}

async function groupsDelete(service, p) {
  const e = service.engine;
  const ids = p.ids.map(String);
  if (ids.includes("local-default")) throw Error("默认项目不能删除");
  const changes = [...e.profiles.values()]
    .filter((profile) => ids.includes(profile.groupId))
    .map((profile) => {
      const base = e.profileForEdit(profile.id);
      return {
        original: base.profile,
        baseRev: base.rev,
        patch: { groupId: "", group_name: "" },
      };
    });
  const result = await profileRelations(e, changes, async () => {
    service.data.groups = service.data.groups.filter(
      (row) => !ids.includes(String(row.id)),
    );
    await service.save();
    return true;
  });
  e.emit?.({ type: "profiles", action: "group-metadata" });
  return result;
}

async function groupsSort(service, p) {
  const requested = p.projectIds.map(String);
  if (new Set(requested).size !== requested.length)
    throw Error("项目排序不能重复");
  const order = requested.filter((id) => id !== "local-default");
  const byId = new Map(service.data.groups.map((row) => [row.id, row]));
  if (order.some((id) => !byId.has(id))) throw Error("排序中的项目不存在");
  const selected = new Set(order);
  let index = 0;
  service.data.groups = service.data.groups.map((row) =>
    selected.has(row.id) ? byId.get(order[index++]) : row,
  );
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
  if (typeof p.content !== "string" || !object(JSON.parse(p.content)))
    throw Error("Invalid template content");
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
  rememberRecordIds(service.data, "templates");
  service.data.templates = service.data.templates.filter(
    (v) => !p.ids.includes(v.id),
  );
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
  if (p.old_filter_name && p.old_filter_name !== row.filter_name)
    service.data.settings.filterSort = (
      service.data.settings.filterSort || []
    ).map((item) =>
      item.name === p.old_filter_name
        ? { ...item, name: row.filter_name }
        : item,
    );
  service.data.filters = service.data.filters
    .filter((v) => v.filter_name !== (p.old_filter_name || row.filter_name))
    .concat(row);
  await service.save();
  return true;
}

async function filtersDelete(service, p) {
  service.data.filters = service.data.filters.filter(
    (v) => v.filter_name !== p.filter_name,
  );
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
