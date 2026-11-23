"use strict";
const assert = require("node:assert/strict");
const { buildProfileIndex } = require("./profile-index");
const { queryProfiles } = require("./profile-query");

process.env.TZ = "America/New_York";
const start = "2026-03-08T00:00:00-05:00", end = "2026-03-09T00:00:00-04:00";
let snapshot = [
  { id: "first", createdAt: start, updatedAt: end },
  { id: "second", createdAt: "2026-03-08T23:59:59-04:00", updatedAt: start },
  { id: "next", createdAt: end, updatedAt: end },
  { id: "invalid", createdAt: "invalid", updatedAt: "invalid" },
];
const rebuild = () => buildProfileIndex({ snapshot, groups: [], labels: [] });
let projection = rebuild();
const service = { profileIndex: () => projection, decorate: row => row.id };
const day = { startDate: "2026-03-08", endDate: "2026-03-08", pageSize: 1 };
const parse = Date.parse;
let calls = 0;
Date.parse = input => { calls++; return parse(input); };
try {
  assert.equal(queryProfiles(service).total, 4);
  assert.equal(calls, 0, "plain pagination must not parse dates");
  assert.deepEqual(queryProfiles(service, day), { rows: ["first"], total: 2 });
  assert.equal(calls, 4);
  assert.deepEqual(queryProfiles(service, { ...day, pageIndex: 2 }), { rows: ["second"], total: 2 });
  assert.equal(calls, 4, "repeat pages must reuse even invalid parse results");
  assert.deepEqual(queryProfiles(service, { startTime: end, endTime: end }), { rows: ["next"], total: 1 });
  assert.deepEqual(queryProfiles(service, { startUpdateDate: day.startDate, endUpdateDate: day.endDate }),
    { rows: ["second"], total: 1 });
  assert.equal(calls, 8, "each field is cached separately");
  snapshot = [{ ...snapshot[0], createdAt: end }, ...snapshot.slice(1)];
  projection = rebuild();
  assert.deepEqual(queryProfiles(service, day), { rows: ["second"], total: 1 });
  assert.equal(calls, 12, "a rebuilt projection uses edited timestamps");
} finally {
  Date.parse = parse;
}

const earlier = "2026-06-01T12:00:00+08:00"; // 04:00Z, despite sorting later as text.
const later = "2026-06-01T06:00:00.000Z";
const sameAsLater = "2026-06-01T08:00:00+02:00";
const active = [
  { id: "later", lastOpenedAt: later, createdAt: later, updatedAt: later, os: "Linux" },
  { id: "same", lastOpenedAt: sameAsLater, createdAt: sameAsLater, updatedAt: sameAsLater, os: "Linux" },
  { id: "earlier", lastOpenedAt: earlier, createdAt: earlier, updatedAt: earlier, os: "Linux" },
  { id: "missing", os: "Linux" },
  { id: "invalid", lastOpenedAt: "invalid", createdAt: "invalid", updatedAt: "invalid", os: "Linux" },
];
snapshot = active.concat(active.map(row => ({
  ...row, id: "trash-" + row.id, trashed: true, trashedAt: row.lastOpenedAt,
})));
projection = rebuild();
const query = params => queryProfiles(service, params);
const ascending = ["missing", "invalid", "earlier", "later", "same"];
const descending = ["later", "same", "earlier", "missing", "invalid"];
assert.deepEqual(query({ orderName: "openTime" }), { rows: ascending, total: 5 },
  "last opened uses chronological order across UTC offsets, with stable ties");
assert.deepEqual(query({ orderName: "openTime", orderType: "desc" }).rows, descending);
assert.deepEqual(query({ orderName: "createTime", osList: ["Linux"] }).rows, ascending,
  "a cold filtered sort must use the same chronology");
assert.deepEqual(query({ orderName: "updateTime", dirIds: ["earlier", "same", "missing", "later"] }).rows,
  ["missing", "earlier", "later", "same"], "sorting selected IDs must use chronology and preserve snapshot ties");
assert.deepEqual(query({ orderName: "updateTime", orderType: "desc", isDelete: 1 }).rows,
  descending.map(id => "trash-" + id), "recycle rows are ordered by deletion time rather than edit time");

projection = rebuild();
calls = 0;
Date.parse = value => { calls++; return parse(value); };
try {
  assert.deepEqual(query({ orderName: "createTime", pageSize: 2 }).rows, ascending.slice(0, 2));
  assert.equal(calls, 4, "sorting parses each present timestamp only once");
  assert.deepEqual(query({ orderName: "createTime", pageSize: 2, pageIndex: 2 }).rows, ascending.slice(2, 4));
  assert.deepEqual(query({ orderName: "createTime", orderType: "desc" }).rows, descending);
  assert.deepEqual(query({ startTime: later, endTime: later }), { rows: ["later", "same"], total: 2 });
  assert.equal(calls, 4, "paging, reverse sorts and date filters share the per-field parse cache");
  snapshot = [{ ...snapshot[0], createdAt: "2026-06-01T00:00:00.000Z" }, ...snapshot.slice(1)];
  projection = rebuild();
  assert.deepEqual(query({ orderName: "createTime", orderType: "desc" }).rows,
    ["same", "earlier", "later", "missing", "invalid"], "a new projection must sort the edited timestamp");
  assert.equal(calls, 8);
} finally {
  Date.parse = parse;
}
console.log("PROFILE_QUERY_SELFTEST OK");
