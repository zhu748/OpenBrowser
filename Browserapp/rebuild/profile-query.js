"use strict";
// Filter lightweight cached summaries; expand full UI DTOs only for the page.
function queryProfiles(service, p = {}) {
  const index = Number(p.page_index ?? p.pageIndex ?? 1), size = Number(p.page_size ?? p.pageSize ?? 10);
  if (!Number.isSafeInteger(index) || index < 1 || !Number.isSafeInteger(size) || size < 1 || size > 5000)
    throw Error("分页参数无效，单页范围 1–5000");
  const { summaries, summariesById } = service.profileIndex();
  const values = value => (Array.isArray(value) ? value : String(value ?? "").split(","))
    .map(String).filter(Boolean);
  const candidates = p.dirIds
    ? [...new Set(values(p.dirIds))].map(id => summariesById.get(id)).filter(Boolean).sort((a, b) => a.position - b.position)
    : summaries;
  const trashed = p.isDelete === true || p.isDelete === 1 || p.isDelete === "1" || p.isDelete === "true";
  let rows = candidates.filter(row => Boolean(row.source.trashed) === trashed);
  if (p?.windowName)
    rows = rows.filter((r) => r.windowName.includes(p.windowName));
  if (p?.openStatus) rows = rows.filter((r) => r.openStatus);
  if (p?.isOften) rows = rows.filter((r) => r.isOften);
  if (p?.projectId || p?.projectIds) {
    const ids = new Set(String(p.projectId || p.projectIds).split(",").map(id => id === 'local-default' ? '' : id));
    rows = rows.filter(r => ids.has(r.projectId));
  }
  if (p?.queryValue && (!p.queryKey || p.queryKey === "name_remark")) {
    const query = String(p.queryValue).toLowerCase();
    rows = rows.filter((r) =>
      (r.windowName + " " + r.windowRemark).toLowerCase().includes(query),
    );
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
  const start = ranges[0] && Date.parse(ranges[0]);
  const end = ranges[1] && Date.parse(ranges[1]);
  if (ranges[0])
    rows = rows.filter(
      (row) => Date.parse(row.createdAt) >= start,
    );
  if (ranges[1])
    rows = rows.filter(
      (row) => Date.parse(row.createdAt) <= end,
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
