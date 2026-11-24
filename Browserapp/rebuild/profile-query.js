"use strict";

const { pageBounds } = require("./page-bounds");
const { projectNameFor } = require("./profile-index");

const QUERY_FIELDS = { name: "windowName", remark: "windowRemark", note: "windowRemark", sortNum: "windowSortNum", id: "windowSortNum" };
const ORDER_FIELDS = {
  profile: "windowSortNum", profileName: "windowSortNum", windowSortNum: "windowSortNum",
  windowName: "windowName", openTime: "openTime", createTime: "createdAt", updateTime: "updatedAt",
};
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ORDER_FIELDS = new Set(["createdAt", "updatedAt", "openTime", "trashedAt"]);
const MAX_SORT_ORDERS = 4;
const values = value => (Array.isArray(value) ? value : String(value ?? "").split(",")).map(String).filter(Boolean);

function dateBoundary(value, end, calendar) {
  if (value == null || value === "") return null;
  const dateOnly = typeof value === "string" && DATE_ONLY.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);
  if (calendar || dateOnly) {
    if (end) date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
  }
  return date.getTime();
}

const timestampsByProjection = new WeakMap();

function timestampsFor(index, key) {
  let byField = timestampsByProjection.get(index);
  if (!byField) timestampsByProjection.set(index, byField = {});
  // Allocate per used field. NaN is unparsed; missing and invalid dates sort
  // before known dates in ascending order and are excluded from date filters.
  return byField[key] ??= new Float64Array(index.snapshot.length).fill(NaN);
}

function timestampAt(timestamps, row, key) {
  let time = timestamps[row.position];
  if (Number.isNaN(time)) {
    const raw = row[key];
    const parsed = raw == null || raw === "" ? NaN : Date.parse(raw);
    time = timestamps[row.position] = Number.isNaN(parsed) ? -Infinity : parsed;
  }
  return time;
}

function dateFilter(index, key, start, end, calendar) {
  const first = dateBoundary(start, false, calendar);
  const last = dateBoundary(end, true, calendar);
  if (first === null && last === null) return null;
  const exclusive = calendar || (typeof end === "string" && DATE_ONLY.test(end));
  const timestamps = timestampsFor(index, key);
  return row => {
    const time = timestampAt(timestamps, row, key);
    return Number.isFinite(time) && (first === null || time >= first)
      && (last === null || (exclusive ? time < last : time <= last));
  };
}

function compileFilters(p, index) {
  const { snapshot } = index;
  const filters = [];
  if (p.windowName) filters.push(row => row.windowName.includes(p.windowName));
  if (p.openStatus) filters.push(row => snapshot[row.position].running);
  if (p.isOften) filters.push(row => row.isOften);
  if (p.projectId || p.projectIds) {
    const ids = new Set(String(p.projectId || p.projectIds).split(",").map(id => id === "local-default" ? "" : id));
    filters.push(row => ids.has(row.projectId));
  }
  const query = String(p.queryValue || "").toLowerCase();
  if (query) {
    if (!p.queryKey || p.queryKey === "name_remark") filters.push(row => row.searchText.includes(query));
    else if (Object.hasOwn(QUERY_FIELDS, p.queryKey)) {
      const field = QUERY_FIELDS[p.queryKey];
      filters.push(row => String(row[field]).toLowerCase().includes(query));
    } else if (p.queryKey === "tag") {
      const matching = new Set();
      for (const [id, label] of index.labelById) {
        if (String(label.name ?? "").toLowerCase().includes(query)) matching.add(id);
      }
      filters.push(row => row.labelIds.some(id => matching.has(id)));
    } else if (p.queryKey === "project_name") {
      filters.push(row => String(projectNameFor(snapshot[row.position], index.groupById)).toLowerCase().includes(query));
    }
  }
  if (p.sortNums) {
    const selected = new Set(values(p.sortNums));
    filters.push(row => selected.has(String(row.windowSortNum)));
  }
  if (p.osList?.length) {
    const selected = new Set(values(p.osList));
    filters.push(row => selected.has(row.os));
  }
  if (p.coreType?.length) {
    const selected = new Set(values(p.coreType));
    filters.push(row => selected.has(row.coreType));
  }
  if (p.labelIds?.length) {
    const selected = new Set(values(p.labelIds));
    filters.push(row => row.labelIds.some(id => selected.has(String(id))));
  }
  if (p.windowRemark) filters.push(row => row.windowRemark.includes(p.windowRemark));
  if (p.platformUrls?.length) {
    const urls = values(p.platformUrls);
    filters.push(row => row.platformUrls.some(url => urls.some(value => String(url).includes(value))));
  }
  const created = Array.isArray(p.createTime) ? p.createTime : null;
  const byCalendarDay = Boolean(created || p.startDate || p.endDate);
  const createdFilter = byCalendarDay
    ? dateFilter(index, "createdAt", p.startDate ?? created?.[0], p.endDate ?? created?.[1], true)
    : dateFilter(index, "createdAt", p.startTime, p.endTime, false);
  const modifyTime = p.modfiyTime ?? p.modifyTime;
  const updated = Array.isArray(modifyTime) ? modifyTime : [];
  const updatedFilter = dateFilter(index, "updatedAt", p.startUpdateDate ?? updated[0], p.endUpdateDate ?? updated[1], true);
  if (createdFilter) filters.push(createdFilter);
  if (updatedFilter) filters.push(updatedFilter);
  return filters;
}

function sortBy(rows, index, field, direction) {
  if (rows.length < 2) return rows;
  if (DATE_ORDER_FIELDS.has(field)) {
    // Parse once per row, even if the persisted timestamps have differing UTC
    // offsets or the user re-sorts. Keep parsing out of the comparator.
    const timestamps = timestampsFor(index, field);
    for (const row of rows) timestampAt(timestamps, row, field);
    return rows.sort((a, b) => direction * (timestamps[a.position] - timestamps[b.position])
      || a.position - b.position);
  }
  return rows.sort((a, b) => {
    const left = a[field] ?? "", right = b[field] ?? "";
    const result = typeof left === "number" && typeof right === "number"
      ? left - right : String(left).localeCompare(String(right));
    return direction * result || a.position - b.position;
  });
}

function orderedCandidates(index, p, trashed, filters) {
  const field = p.orderName === "updateTime" && trashed ? "trashedAt"
    : Object.hasOwn(ORDER_FIELDS, p.orderName) ? ORDER_FIELDS[p.orderName] : null;
  const direction = /desc|^-1$/i.test(String(p.orderType)) ? -1 : 1;
  // A detail route scopes to one opaque project ID, including IDs containing commas.
  let project = null;
  if (Object.hasOwn(p, "scopeProjectId")) {
    if (typeof p.scopeProjectId !== "string" || !p.scopeProjectId.length) throw Error("项目范围无效");
    project = p.scopeProjectId === "local-default" ? "" : p.scopeProjectId;
  }
  if (p.dirIds) {
    const selected = [...new Set(values(p.dirIds))]
      .map(id => index.summariesById.get(id))
      .filter(row => row?.trashed === trashed && (project === null || row.projectId === project) && filters.every(matches => matches(row)));
    return [field ? sortBy(selected, index, field, direction) : selected.sort((a, b) => a.position - b.position), []];
  }
  const all = trashed ? index.deletedRows : index.activeRows;
  const byProject = trashed ? index.deletedByProject : index.activeByProject;
  const rows = project === null ? all : byProject.get(project) ?? [];
  if (!field) return [rows, filters];
  const key = JSON.stringify([trashed, field, direction, project]);
  const orders = index.sortOrders;
  const cached = orders.get(key);
  if (!cached && filters.length) {
    // A selective cold search should only sort its matches. An unfiltered
    // request can populate the reusable order for later pages and filters.
    const selected = rows.filter(row => filters.every(matches => matches(row)));
    return [sortBy(selected, index, field, direction), []];
  }
  const order = cached || sortBy(rows.slice(), index, field, direction);
  orders.delete(key);
  orders.set(key, order);
  if (orders.size > MAX_SORT_ORDERS) orders.delete(orders.keys().next().value);
  return [order, filters];
}

function selectPage(rows, filters, start, end) {
  if (!filters.length) return { total: rows.length, page: rows.slice(start, end) };
  const page = [];
  let total = 0;
  for (const row of rows) {
    if (!filters.every(matches => matches(row))) continue;
    if (total >= start && total < end) page.push(row);
    total++;
  }
  return { total, page };
}

// The ordering cache belongs to the profile projection. Runtime-only changes
// retain the order and use the current snapshot for open-state filters.
function queryProfiles(service, p = {}) {
  const { offset, limit } = pageBounds(p.page_index ?? p.pageIndex ?? 1, p.page_size ?? p.pageSize ?? 10);
  const projection = service.profileIndex();
  const snapshot = projection.snapshot;
  const trashed = p.isDelete === true || p.isDelete === 1 || p.isDelete === "1" || p.isDelete === "true";
  const [candidates, filters] = orderedCandidates(projection, p, trashed, compileFilters(p, projection));
  const { total, page } = selectPage(candidates, filters, offset, offset + limit);
  return { rows: page.map(row => service.decorate(snapshot[row.position], projection)), total };
}
module.exports = { queryProfiles };
