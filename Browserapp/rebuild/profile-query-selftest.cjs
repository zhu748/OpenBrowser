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

async function checkStatusSnapshot(sqlite) {
  const fs = require("node:fs/promises");
  const os = require("node:os");
  const path = require("node:path");
  const { BrowserEngine } = require("../engine");
  const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
  const { encryptCredentialJson } = require("../credential-crypto");
  const { KERNEL_POLICY_VERSION } = require("../engine/state-storage");
  const { LocalService } = require("./local-service");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-status-query-"));
  const savedKey = process.env.OPENBROWSER_MASTER_KEY;
  const isSupported = ProfileStoreSqlite.isSupported;
  let engine, seed;
  try {
    process.env.OPENBROWSER_MASTER_KEY = "synthetic-test-status-query-key";
    engine = new BrowserEngine({ getPath: () => root });
    engine.kernelManager = { loadMeta: async () => {} };
    engine.sanitizeProfile = row => structuredClone(row);
    const records = [
      { id: "status-a", number: 1, name: "Bravo" },
      { id: "status-b", number: 2, name: "Alpha" },
      { id: "status-c", number: 3, name: "Charlie" },
    ];
    if (sqlite) {
      seed = new ProfileStoreSqlite({ dbPath: engine.dbFile, wal: true });
      await seed.init();
      seed.setMeta("kernelPolicyVersion", KERNEL_POLICY_VERSION);
      seed.saveProfiles(records);
      seed.close();
      seed = undefined;
    } else {
      ProfileStoreSqlite.isSupported = () => false;
      await fs.writeFile(engine.stateFile, encryptCredentialJson({ kernelPolicyVersion: KERNEL_POLICY_VERSION, profiles: records }));
    }
    await engine.init(null);
    assert.equal(engine.usingSqlite, sqlite);
    assert.deepEqual(Array.from(engine.profiles.values(), ({ id, number, name }) => ({ id, number, name })), records);
    const files = sqlite ? [engine.dbFile, engine.dbFile + "-wal"] : [engine.stateFile];
    const readFiles = () => Promise.all(files.map(file => fs.readFile(file).catch(error => {
      if (error.code !== "ENOENT") throw error;
      return null;
    })));
    const disk = await readFiles();
    const profiles = engine.profiles;
    const version = profiles.version;
    const live = Array.from(profiles.values());
    const contents = structuredClone(live);
    const service = Object.assign(Object.create(LocalService.prototype), {
      file: path.join(root, "rebuild-local.json"), queue: Promise.resolve(), engine,
    });
    const backend = sqlite ? "sqlite" : "json";
    const attempted = [];
    const realPublicRunning = engine.publicRunning.bind(engine);
    const fault = Error("fixture status row 2 failed");
    let fail = true, temporaryRuntime = false;
    engine.publicRunning = id => {
      attempted.push(id);
      if (fail && id === "status-b") { fail = false; throw fault; }
      return temporaryRuntime && id === "status-a"
        ? { ...realPublicRunning(id), starting: true } : realPublicRunning(id);
    };
    const readPage = options => service.request("profiles:query", options);
    const statusState = () => [engine._statusCache, engine._statusPositions, engine._statusProfiles,
      engine._statusProfileVersion, engine._statusStamps, engine._statusInstance, engine._statusSequence];
    const beforeCold = statusState();
    await assert.rejects(readPage({}), error => error === fault);
    const afterColdFailure = statusState();
    assert.equal(service.profileProjection, undefined, "a failed cold query must not build a search index");
    assert.deepEqual(attempted, ["status-a", "status-b"]);
    const retry = await readPage({ orderName: "windowName", orderType: "asc", pageSize: 2 });
    assert.equal(retry.total, 3, backend + ": a healthy retry must return the entire fleet, not the first partial row");
    assert.deepEqual(afterColdFailure, beforeCold, "a failed first read must not publish any status cache state");
    assert.deepEqual(retry.rows.map(row => row.id), ["status-b", "status-a"]);
    const nextPage = await readPage({ orderName: "windowName", orderType: "asc", pageSize: 2, pageIndex: 2 });
    assert.deepEqual(nextPage.rows.map(row => row.id), ["status-c"]);
    assert.equal(nextPage.total, 3);
    const warm = engine.status();
    const index = service.profileProjection;
    assert.equal(engine.status(), warm, "subsequent status reads reuse the completed snapshot");
    assert.equal(service.profileIndex(), index, "ordered pages preserve the existing search projection");
    assert.deepEqual(attempted, ["status-a", "status-b", "status-a", "status-b", "status-c"]);

    // A rebuild after invalidation may also fail. An unpublished row with a
    // transient runtime value must not affect the last accepted cursor.
    const cursor = engine.statusDelta(null, { includeCursor: true }).cursor;
    const positions = engine._statusPositions;
    engine.invalidateStatusCache();
    fail = temporaryRuntime = true;
    await assert.rejects(readPage({}), error => error === fault);
    assert.equal(engine._statusCache, null);
    assert.equal(engine._statusPositions, positions, "a failed rebuild must not replace the accepted position index");
    assert.equal(index.snapshot, warm);
    temporaryRuntime = false;
    assert.equal((await readPage({})).total, 3);
    const delta = engine.statusDelta(cursor, { includeCursor: true, includeWatermark: false });
    assert.deepEqual({ full: delta.full, rows: delta.rows, removed: delta.removed }, { full: false, rows: [], removed: [] });
    assert.deepEqual(attempted.slice(5), ["status-a", "status-b", "status-a", "status-b", "status-c"]);
    assert.equal(service.profileProjection, index, "a same-version status rebuild does not rebuild membership and ordering");
    assert.equal(engine.profiles, profiles);
    assert.equal(profiles.version, version);
    assert.deepEqual(Array.from(profiles.values()), contents);
    assert.ok(Array.from(profiles.values()).every((row, index) => row === live[index]), "reads must not replace profile objects");
    assert.deepEqual(await readFiles(), disk, "projection and retry must not touch the durable store");
  } finally {
    seed?.close();
    engine?.sqliteStore?.close();
    ProfileStoreSqlite.isSupported = isSupported;
    if (savedKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = savedKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function main() {
  const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
  const errors = [];
  for (const sqlite of ProfileStoreSqlite.isSupported() ? [true, false] : [false]) {
    try { await checkStatusSnapshot(sqlite); } catch (error) { errors.push(error); }
  }
  if (errors.length) throw new AggregateError(errors, "status query recovery failed");
  console.log("PROFILE_QUERY_SELFTEST OK (ordered dates, paging and status snapshot recovery)");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
