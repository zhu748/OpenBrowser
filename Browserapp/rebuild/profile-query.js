"use strict";

const QUERY_FIELDS = { name: "windowName", remark: "windowRemark", note: "windowRemark", sortNum: "windowSortNum", id: "windowSortNum" };
const ORDER_FIELDS = {
  profile: "windowSortNum", profileName: "windowSortNum", windowSortNum: "windowSortNum",
  windowName: "windowName", openTime: "openTime", createTime: "createdAt", updateTime: "updatedAt",
};
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
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

function dateFilter(key, start, end, calendar) {
  const first = dateBoundary(start, false, calendar);
  const last = dateBoundary(end, true, calendar);
  if (first === null && last === null) return null;
  const exclusive = calendar || (typeof end === "string" && DATE_ONLY.test(end));
  return row => {
    const time = Date.parse(row[key]);
    return Number.isFinite(time) && (first === null || time >= first)
      && (last === null || (exclusive ? time < last : time <= last));
  };
}

function compileFilters(p, snapshot) {
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
      filters.push(row => row.labelInfos.some(label => label.labelName.toLowerCase().includes(query)));
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
    filters.push(row => row.windowPlatformList.some(account => urls.some(value => String(account.platformUrl).includes(value))));
  }
  const created = Array.isArray(p.createTime) ? p.createTime : null;
  const byCalendarDay = Boolean(created || p.startDate || p.endDate);
  const createdFilter = byCalendarDay
    ? dateFilter("createdAt", p.startDate ?? created?.[0], p.endDate ?? created?.[1], true)
    : dateFilter("createdAt", p.startTime, p.endTime, false);
  const modifyTime = p.modfiyTime ?? p.modifyTime;
  const updated = Array.isArray(modifyTime) ? modifyTime : [];
  const updatedFilter = dateFilter("updatedAt", p.startUpdateDate ?? updated[0], p.endUpdateDate ?? updated[1], true);
  if (createdFilter) filters.push(createdFilter);
  if (updatedFilter) filters.push(updatedFilter);
  return filters;
}

function compareBy(field, direction) {
  return (a, b) => {
    const left = a[field] ?? "", right = b[field] ?? "";
    const result = typeof left === "number" && typeof right === "number"
      ? left - right : String(left).localeCompare(String(right));
    return direction * result || a.position - b.position;
  };
}

function orderedCandidates(index, p, trashed, filters) {
  const field = p.orderName === "updateTime" && trashed ? "trashedAt"
    : Object.hasOwn(ORDER_FIELDS, p.orderName) ? ORDER_FIELDS[p.orderName] : null;
  const direction = /desc|^-1$/i.test(String(p.orderType)) ? -1 : 1;
  if (p.dirIds) {
    const selected = [...new Set(values(p.dirIds))]
      .map(id => index.summariesById.get(id))
      .filter(row => row?.trashed === trashed && filters.every(matches => matches(row)));
    return [selected.sort(field ? compareBy(field, direction) : (a, b) => a.position - b.position), []];
  }
  const rows = trashed ? index.deletedRows : index.activeRows;
  if (!field) return [rows, filters];
  const key = `${trashed}:${field}:${direction}`;
  const orders = index.sortOrders;
  const cached = orders.get(key);
  if (!cached && filters.length) {
    // A selective cold search should only sort its matches. An unfiltered
    // request can populate the reusable order for later pages and filters.
    const selected = rows.filter(row => filters.every(matches => matches(row)));
    return [selected.sort(compareBy(field, direction)), []];
  }
  const order = cached || rows.slice().sort(compareBy(field, direction));
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
  const index = Number(p.page_index ?? p.pageIndex ?? 1), size = Number(p.page_size ?? p.pageSize ?? 10);
  if (!Number.isSafeInteger(index) || index < 1 || !Number.isSafeInteger(size) || size < 1 || size > 5000)
    throw Error("分页参数无效，单页范围 1–5000");
  const projection = service.profileIndex();
  const snapshot = projection.snapshot;
  const trashed = p.isDelete === true || p.isDelete === 1 || p.isDelete === "1" || p.isDelete === "true";
  const [candidates, filters] = orderedCandidates(projection, p, trashed, compileFilters(p, snapshot));
  const { total, page } = selectPage(candidates, filters, (index - 1) * size, index * size);
  return { rows: page.map(row => service.decorate(snapshot[row.position], projection)), total };
}
module.exports = { queryProfiles };
