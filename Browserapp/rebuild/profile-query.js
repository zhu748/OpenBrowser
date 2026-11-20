"use strict";
// Filter lightweight cached summaries; expand full UI DTOs only for the page.
function queryProfiles(service, p = {}) {
  const index = Number(p.page_index ?? p.pageIndex ?? 1), size = Number(p.page_size ?? p.pageSize ?? 10);
  if (!Number.isSafeInteger(index) || index < 1 || !Number.isSafeInteger(size) || size < 1 || size > 5000)
    throw Error("分页参数无效，单页范围 1–5000");
  let rows = service.profileIndex().summaries.filter(row => !!row.source.trashed === !!p.isDelete);
  if (p?.windowName)
    rows = rows.filter((r) => r.windowName.includes(p.windowName));
  if (p?.openStatus) rows = rows.filter((r) => r.openStatus);
  if (p?.isOften) rows = rows.filter((r) => r.isOften);
  if (p?.projectId || p?.projectIds) {
    const ids = String(p.projectId || p.projectIds).split(",").map(id=>id==='local-default'?'':id);
    rows = rows.filter((r) => ids.includes(r.projectId));
  }
  if (p?.queryValue && (!p.queryKey || p.queryKey === "name_remark")) {
    const query = String(p.queryValue).toLowerCase();
    rows = rows.filter((r) =>
      (r.windowName + " " + r.windowRemark).toLowerCase().includes(query),
    );
  }
  const values = (v) =>
    Array.isArray(v)
      ? v.map(String)
      : String(v ?? "")
          .split(",")
          .filter(Boolean);
  if (p.dirIds) {
    const selected = new Set(values(p.dirIds));
    rows = rows.filter(row => selected.has(String(row.source.id)));
  }
  const query = String(p.queryValue || "").toLowerCase();
  if (query && p.queryKey) {
    const key = {
      name: "windowName",
      remark: "windowRemark",
      note: "windowRemark",
      sortNum: "windowSortNum",
      id: "windowSortNum",
    }[p.queryKey];
    if (key)
      rows = rows.filter((row) =>
        String(row[key]).toLowerCase().includes(query),
      );
    if (p.queryKey === "tag")
      rows = rows.filter((row) =>
        row.labelInfos.some((label) =>
          label.labelName.toLowerCase().includes(query),
        ),
      );
  }
  if (p.sortNums) {
    const selected = new Set(values(p.sortNums));
    rows = rows.filter(row => selected.has(String(row.windowSortNum)));
  }
  if (p.osList?.length) {
    const selected = new Set(values(p.osList));
    rows = rows.filter(row => selected.has(row.os));
  }
  if (p.coreType?.length) {
    const selected = new Set(values(p.coreType));
    rows = rows.filter(row => selected.has(row.coreType));
  }
  if (p.labelIds?.length) {
    const selected = new Set(values(p.labelIds));
    rows = rows.filter(row => row.labelIds.some(id => selected.has(String(id))));
  }
  if (p.windowRemark)
    rows = rows.filter((row) => row.windowRemark.includes(p.windowRemark));
  if (p.platformUrls?.length) {
    const urls = values(p.platformUrls);
    rows = rows.filter(row => row.windowPlatformList.some(account => urls.some(value => String(account.platformUrl).includes(value))));
  }
  const ranges = Array.isArray(p.createTime)
    ? p.createTime
    : [p.startTime, p.endTime];
  if (ranges[0])
    rows = rows.filter(
      (row) => Date.parse(row.createdAt) >= Date.parse(ranges[0]),
    );
  if (ranges[1])
    rows = rows.filter(
      (row) => Date.parse(row.createdAt) <= Date.parse(ranges[1]),
    );
  if (p.orderName) {
    const key = {
      profile: "windowSortNum",
      profileName: "windowSortNum",
      windowSortNum: "windowSortNum",
      windowName: "windowName",
      openTime: "openTime",
      createTime: "createdAt",
      updateTime: "updatedAt",
    }[p.orderName];
    if (key)
      rows.sort((a, b) => {
        const left = a[key] ?? "",
          right = b[key] ?? "";
        const result =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : String(left).localeCompare(String(right));
        return /desc|^-1$/i.test(String(p.orderType)) ? -result : result;
      });
  }

  const total = rows.length;
  return { rows: rows.slice((index - 1) * size, index * size).map(row => service.decorate(row.source)), total };
}
module.exports = { queryProfiles };
