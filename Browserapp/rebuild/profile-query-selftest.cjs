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
console.log("PROFILE_QUERY_SELFTEST OK");
