"use strict";

const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { parse } = require("acorn");
const { BrowserEngine } = require("../engine");
const { ProfileRoutes } = require("../automation/api/profile-routes");
const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
const { readEngineStateCandidate } = require("../engine/state-storage");
const { captureIpcResult } = require("../shared/ipc-result");
const { LocalService } = require("./local-service");
const { encodeLocalStore } = require("./local-store");
const { previewIdentity } = require("./fingerprint-draft");

const markers = ["cookie-fixture", "password-fixture", "totp-fixture", "main-fixture", "backup-fixture"];
const original = {
  id: "source", number: 1, name: "Source", note: "Before", groupId: "7", group_name: "Old name", tag: "3",
  cookies: markers[0],
  platform: { accounts: [{ username: "local-fixture", password: markers[1], totpSecret: markers[2] }] },
  networkMode: "proxy", proxy: `http://fixture:${markers[3]}@primary.invalid:80`,
  proxyMeta: { backupProxies: [`http://fixture:${markers[4]}@backup.invalid:80`] },
};

function checkExplicitRead(row) {
  const json = JSON.stringify(row);
  assert.ok(markers.every(marker => json.includes(marker)), "the trusted editor can still read all five fixture fields");
}

function checkCloneReceipt(result) {
  assert.equal(result.length, 1);
  assert.ok(markers.every(marker => !JSON.stringify(result).includes(marker)), "a clone receipt must not disclose persisted credential fields");
  const [{ id }] = result;
  assert.notEqual(id, original.id);
  assert.deepEqual(result, [{ id, windowId: id, dirId: id }]);
  return id;
}

async function openLocalEngine(root, sqlite) {
  const engine = new BrowserEngine({ getPath: () => root });
  engine.kernelManager = { loadMeta: async () => {} };
  await engine.init(null);
  assert.equal(engine.usingSqlite, sqlite);
  return engine;
}

async function runCase(root, sqlite, operation, phase) {
  const open = () => openLocalEngine(root, sqlite);
  let engine = await open();
  const readDurable = async () => sqlite ? engine.sqliteStore.getAllProfiles()
    : (await readEngineStateCandidate(engine.stateFile)).saved.profiles;
  try {
    const service = new LocalService({ engine, root });
    const malformed = phase === "catalog";
    await fs.writeFile(service.file, encodeLocalStore({
      version: 1, groups: [{ id: 7, projectName: "Current name" }],
      labels: malformed ? {} : [{ id: 3, name: "Label", color: "#123456" }],
      settings: {}, templates: [], filters: [], skills: [], tasks: [],
    }));
    const initial = await engine.syncProfiles([original], { delta: true });
    assert.equal(initial[0].id, original.id, "legacy public sync still returns rows");
    const rev = initial[0].rev;
    if (!malformed) checkExplicitRead(await service.request("profiles:read", { id: original.id }));
    const clone = operation === "clone";
    const payload = clone ? { ids: [original.id] } : { id: original.id, rev, windowRemark: "First edit" };
    let later, committed = false, statusCalls = 0;
    const status = engine.status, emit = engine.emit, editor = engine.profileForEdit, rename = fs.rename;
    const store = engine.sqliteStore, save = store?.saveEngineState, upsert = store?.saveProfilesDiffed;
    const full = Object.assign(Error("fixture full disk"), { code: "ENOSPC", errno: -28 });
    const fault = Object.assign(Error("fixture late view error"), { code: "EIO" });
    if (phase === "projection") {
      engine.status = () => { statusCalls++; throw fault; };
    } else if (phase === "notification") {
      engine.emit = function (event) {
        if (event.action === "profiles-update") throw fault;
        return emit.call(this, event);
      };
    } else if (phase === "overlap") {
      engine.on(event => {
        if (event.action !== "profiles-update" || later) return;
        const current = editor.call(engine, original.id);
        later = engine.applyProfileCommands([
          { kind: "patch", id: original.id, baseRev: current.rev, patch: { note: "Later edit" } },
        ], { delta: true });
      });
    } else if (phase === "late-read") {
      engine.profileForEdit = function (...args) {
        if (committed) throw fault;
        return editor.apply(this, args);
      };
      if (sqlite) {
        store.saveEngineState = function (state) {
          const saved = save.call(this, state);
          committed = true;
          return saved;
        };
      } else {
        fs.rename = async (source, target) => {
          await rename(source, target);
          if (target === engine.stateFile) committed = true;
        };
      }
    } else if (phase === "write") {
      if (sqlite) {
        store.saveProfilesDiffed = function (rows) {
          upsert.call(this, rows);
          throw full;
        };
      } else {
        fs.rename = async (source, target) => {
          if (target === engine.stateFile) throw full;
          return rename(source, target);
        };
      }
    }
    let result;
    try {
      const request = () => service.request(`profiles:${operation}`, payload);
      if (phase === "write") {
        await assert.rejects(request, error => error === full && error.errno === -28);
      } else {
        result = await captureIpcResult(request);
      }
    } finally {
      engine.status = status;
      engine.emit = emit;
      engine.profileForEdit = editor;
      fs.rename = rename;
      if (store) { store.saveProfilesDiffed = upsert; store.saveEngineState = save; }
    }
    if (later) {
      const laterRows = await later;
      assert.equal(laterRows[0].id, original.id, "public command still returns the status delta");
    }
    if (phase === "late-read") assert.equal(committed, true);
    const failedBeforeWrite = phase === "write" || malformed;
    const current = engine.profileForEdit(original.id);
    if (malformed) {
      assert.equal(result.ok, false);
      assert.equal(current.rev, rev, "bad response dependencies must stop before publication");
      await assert.rejects(service.request("profiles:update", { ...payload, rev: rev + 1 }), { code: "PROFILE_STALE_REV" });
    }
    if (phase === "write" && !clone) {
      assert.ok(current.rev > rev, "rollback restores the content, not an old revision token");
      await assert.rejects(service.request("profiles:update", payload), { code: "PROFILE_STALE_REV" });
    }
    let cloneId;
    if (!failedBeforeWrite) {
      assert.equal(result.ok, true, `confirmed ${operation} must not be rejected by ${phase}`);
      if (clone) cloneId = checkCloneReceipt(result.value);
      else {
        const value = result.value;
        assert.equal(value.windowRemark, "First edit");
        assert.ok(value.rev > rev);
        assert.equal(value.projectName, "Current name");
        assert.deepEqual(value.labelInfo, [{ labelId: "3", labelName: "Label", labelColor: "#123456" }]);
        checkExplicitRead(value);
        if (phase === "overlap") {
          assert.ok(current.rev > value.rev, "the receipt keeps its own revision, not a subsequent edit's revision");
          assert.equal(current.profile.note, "Later edit");
        } else {
          const direct = await service.request("profiles:read", { id: original.id });
          assert.deepEqual(value, direct, "healthy explicit editor DTO must not change");
          value.platform.accounts[0].username = "receipt-only edit";
          assert.notEqual(engine.profileForEdit(original.id).profile.platform.accounts[0].username, "receipt-only edit");
        }
      }
    }
    assert.equal(statusCalls, 0, "the write receipt must not build a list snapshot");
    const durable = await readDurable();
    assert.equal(durable.length, cloneId ? 2 : 1);
    assert.equal(durable.find(row => row.id === original.id).note,
      failedBeforeWrite || clone ? original.note : phase === "overlap" ? "Later edit" : "First edit");
    // A failed save leaves a coalescer retry queued on this engine. Settle
    // it after checking the failed write, before a second engine takes over
    // the same directory. Otherwise the old retry can replace its JSON.
    if (phase === "write") await engine.flushPersistence();
    engine.sqliteStore?.close();
    engine = await open();
    assert.deepEqual((await readDurable()).map(row => [row.id, row.note]), durable.map(row => [row.id, row.note]));
    const reopened = new LocalService({ engine, root });
    if (cloneId) checkExplicitRead(await reopened.request("profiles:read", { id: cloneId }));
    if (clone) {
      const secondId = checkCloneReceipt(await reopened.request("profiles:clone", payload));
      assert.notEqual(secondId, cloneId, "a deliberate new clone is not deduplicated");
      assert.equal((await readDurable()).length, cloneId ? 3 : 2, "the deliberate clone remains durable after reopening");
    } else if (phase === "write") {
      const fresh = await reopened.request("profiles:read", { id: original.id });
      assert.equal((await reopened.request("profiles:update", { ...payload, rev: fresh.rev })).windowRemark, "First edit");
    }
  } finally { engine.sqliteStore?.close(); }
}

async function runCreateCase(root, sqlite, operation, phase) {
  const open = () => openLocalEngine(root, sqlite);
  let engine = await open();
  const readDurable = async () => sqlite ? engine.sqliteStore.getAllProfiles()
    : (await readEngineStateCandidate(engine.stateFile).catch(error => {
      if (error.code === "ENOENT") return {};
      throw error;
    })).saved?.profiles ?? [];
  try {
    const service = new LocalService({ engine, root });
    const batch = operation === "create-batch", count = batch ? 3 : 1;
    // Issue synthetic draft receipts only; no generation or installed browser
    // is needed to check that their allocation survives a failed write.
    const drafts = phase === "write" ? Array.from({ length: count }, () => ({
      _fingerprintDraft: previewIdentity(engine, {
        id: randomUUID(), fingerprintSeed: randomBytes(16).toString("hex"), fingerprintVersion: 2,
      }),
    })) : null;
    const fingerprintData = !drafts ? {} : batch ? { fingerDetail: drafts } : drafts[0];
    const payload = { windowName: "New window", windowRemark: "Initial note", createCount: count, ...fingerprintData };
    const request = extra => service.request(`profiles:${operation}`, { ...payload, ...extra });
    const { emit, status, persist } = engine;
    let notifyCalls = 0, statusCalls = 0, later, result;
    const diskError = Object.assign(Error("fixture disk write failed"), { code: "ENOSPC" });
    engine.status = function () {
      statusCalls++;
      if (phase === "projection") throw Error("fixture status unavailable");
      return status.call(this);
    };
    engine.emit = function (event) {
      if (event.action !== "profiles-update") return emit.call(this, event);
      notifyCalls++;
      if (phase === "notification") throw Error("fixture notification unavailable");
      if (phase === "overlap" && notifyCalls === 1) {
        const { id } = this.profiles.values().next().value;
        later = this.commitProfileCommand({ kind: "patch", id, baseRev: this.profiles.revisionOf(id),
          patch: { note: "Later note" } }, row => ({ note: row.note }));
      }
      return emit.call(this, event);
    };
    try {
      if (phase === "write") {
        engine.persist = async () => { throw diskError; };
        await assert.rejects(request, error => error === diskError);
        assert.equal(notifyCalls, 0, "a failed write must not notify a successful creation");
        assert.equal(engine.profiles.size, 0, "the failed single/batch rolls back live rows");
        assert.equal((await readDurable()).length, 0, "a failed create does not commit any durable rows");
        engine.persist = persist;
      }
      if (phase === "invalid-list") {
        for (const fingerDetail of [[], null, undefined, { length: count }, [{}]]) {
          await assert.rejects(() => request({ fingerDetail }), /数量与窗口数量不一致/);
        }
        assert.equal(engine.profiles.size, 0, "no rows are created for a malformed explicit list");
      }
      result = await captureIpcResult(() => request(phase === "invalid-list"
        ? { fingerDetail: [840, 930, 1020].map(openWidth => ({ openWidth })) }
        : undefined));
      if (later) assert.equal((await later).note, "Later note");
    } finally {
      engine.emit = emit;
      engine.status = status;
      engine.persist = persist;
    }
    assert.equal(result.ok, true, `confirmed ${operation} must not be rejected by ${phase}`);
    assert.equal(statusCalls, 0, "creation uses neither a list projection nor its error");
    assert.equal(notifyCalls, phase === "overlap" ? 2 : 1);
    const rows = batch ? result.value : [result.value];
    assert.equal(rows.length, count);
    assert.equal(new Set(rows.map(row => row.id)).size, count);
    if (drafts) assert.deepEqual(rows.map(row => row.id), drafts.map(row => row._fingerprintDraft.profileId),
      "a genuine write failure does not consume the draft allocation");
    if (phase === "invalid-list") assert.deepEqual(rows.map(row => row.openWidth), [840, 930, 1020]);
    const durable = await readDurable();
    assert.equal(durable.length, count, "one accepted submission writes exactly the requested rows");
    for (const [index, row] of rows.entries()) {
      const saved = durable.find(profile => profile.id === row.id);
      assert.equal(row.windowId, row.id);
      assert.equal(row.windowName, batch ? `New window ${index + 1}` : "New window");
      assert.equal(row.windowRemark, "Initial note", "receipt must describe its own write, not a later edit");
      assert.ok(row.createTime, "creation receipt includes the staged creation timestamp");
      assert.equal(saved.note, phase === "overlap" && index === 0 ? "Later note" : row.windowRemark);
      row.advanced.startUrls = "receipt-only value";
      assert.notEqual(engine.profiles.get(row.id).advanced.startUrls, row.advanced.startUrls);
    }
    engine.sqliteStore?.close();
    engine = await open();
    assert.deepEqual(new Set((await readDurable()).map(row => row.id)), new Set(rows.map(row => row.id)));
    assert.equal(engine.profiles.size, count, "cold reopen finds the same rows");
  } finally { engine.sqliteStore?.close(); }
}

async function runApiCreateCase(root, sqlite) {
  const engine = await openLocalEngine(root, sqlite);
  const routes = new ProfileRoutes({ engine });
  const { emit, persist } = engine;
  let failNotification = false, statusCalls = 0;
  engine.status = () => { statusCalls++; throw Error("fixture status unavailable"); };
  engine.emit = function (event) {
    if (failNotification && event.action === "profiles-update") throw Error("fixture notification unavailable");
    return emit.call(this, event);
  };
  const secret = "synthetic-create-account-secret";
  const create = id => routes.routeProfileCreate({ input: {
    id, name: "Fixture API profile", platform: { accounts: [{ username: "local fixture", password: secret }] },
  } });
  try {
    for (const id of ["status-fault", "notification-fault"]) {
      failNotification = id === "notification-fault";
      const result = await create(id);
      assert.equal(result.code, 0);
      assert.equal(result.data.user_id, id);
      assert.equal(result.data.profile_id, id);
      assert.equal(result.data.id, id);
      assert.equal(result.data.profile.id, id);
      assert.ok(result.data.profile.createdAt);
      assert.equal(engine.profiles.get(id).platform.accounts[0].password, secret);
      assert.ok(!JSON.stringify(result).includes(secret), "the public acknowledgement still redacts credentials");
    }
    engine.persist = async () => { throw Error("fixture disk write failed"); };
    const failed = await create("write-fault");
    assert.equal(failed.code, 400, "a real write failure must remain a rejected request");
    assert.match(failed.msg, /fixture disk write failed/);
    assert.equal(engine.profiles.has("write-fault"), false);
    engine.persist = persist;
    assert.equal((await create("status-fault")).code, 409, "an explicit ID still rejects replay as before");
    assert.equal(statusCalls, 0, "API creates do not read the fleet status");
    const durable = sqlite ? engine.sqliteStore.getAllProfiles()
      : (await readEngineStateCandidate(engine.stateFile)).saved.profiles;
    assert.deepEqual(new Set(durable.map(profile => profile.id)), new Set(["status-fault", "notification-fault"]));
  } finally {
    engine.persist = persist;
    engine.sqliteStore?.close();
  }
}

async function loadFormSource(context, file, bindings = {}, exports = []) {
  const filename = path.resolve(__dirname, "..", file);
  const source = await fs.readFile(filename, "utf8");
  const body = parse(source, { ecmaVersion: "latest", sourceType: "module" }).body;
  const statements = body.filter(node => node.type !== "ImportDeclaration" && !node.type.startsWith("Export"))
    .map(node => source.slice(node.start, node.end)).join("\n");
  return vm.runInContext(`(({ ${Object.keys(bindings)} }) => {
    ${statements}
    return { ${exports} };
  })`, context, { filename })(bindings);
}

async function runSettingsRoundTrip(root, sqlite) {
  let engine = await openLocalEngine(root, sqlite);
  try {
    let service = new LocalService({ engine, root });
    let versions = ["156", "155"];
    const permitted = new Set(["profiles:create", "profiles:read", "profiles:update"]);
    const context = vm.createContext({
      $t: text => text,
      createProfileLifecycleBridge: () => ({}),
      rebuild: { request: (method, payload) => captureIpcResult(() => {
        if (method === "kernels:list") return versions.map(version => ({ engine: "chromium", version }));
        if (method === "fingerprint:sample-fields") return { getSpeechSynthesis: [] };
        assert.ok(permitted.has(method), `unexpected form route ${method}`);
        return service.request(method, structuredClone(payload));
      }) },
    });
    await loadFormSource(context, "rebuild/renderer-bridge.js");
    const draft = await import("./workbench-fingerprint-draft.mjs");
    const wb = "frontend/src/workbench";
    const fields = await loadFormSource(context, `${wb}/shared/workbench-fields.mjs`,
      { serializeFingerprintDraft: draft.serializeFingerprintDraft },
      ["findField", "selectFields", "changeVisibility", "updateFields", "applyValues", "matchesOrDefault", "readFields", "fingerprintFields"]);
    const proxy = await import("../frontend/src/workbench/profiles/profile-proxy-inputs.mjs");
    const { o: formatCookies, r: parseCookies, s: validateCookies } =
      await import("../frontend/src/workbench/profiles/fields/cookie-text.mjs");
    const api = context.__localApi;
    const { initializeProfileInputs } = await loadFormSource(context, `${wb}/profiles/profile-inputs.mjs`, {
      ...draft, ...proxy, formatCookies, parseCookies, validateCookies, reactive: value => value, api,
      findField: fields.findField, findFields: fields.selectFields, readFields: fields.readFields,
      setFieldVisibility: fields.changeVisibility, setFieldProperty: fields.updateFields, applyFields: fields.applyValues,
      equalsOrDefault: fields.matchesOrDefault, isOsBlockedForKernel: () => false, detectDesktopOs: () => "Windows",
      uaMode: { close: "close" }, loadOsRestrictions: async () => ({}),
      loadProfileSettings: async () => context.__localDict, useUser: () => ({ getUserConfig: async () => ({}) }),
      useWorkspaceState: () => ({ currentWorkspace: { workspaceType: "Private" } }), workspaceType: { ECommerce: "ECommerce" },
      browserEngine: { Chrome: "Chrome", Firefox: "Firefox" }, supportsFirefox: () => true,
      isEmpty: value => value == null || value === "" || (Array.isArray(value) && !value.length),
      numberSchema: () => ({ safeParse: value => ({ success: Number.isFinite(value) }) }),
      getProfileLabels: () => ({}), getProxyLabels: () => ({}), readAccountProxyDraft: { Order: 1 },
    }, ["initializeProfileInputs"]);
    const kernel = groups => fields.selectFields(groups, ["coreVersion"])[0];
    const search = groups => fields.selectFields(groups, ["searchEngine"])[0];
    const select = (field, value) => {
      const selected = field.options.find(option => option.value === value);
      assert.ok(selected, value);
      field.value = selected;
    };
    const serialize = (groups, base, metadata) => proxy.serializeProfileInput({
      ...base, ...fields.fingerprintFields(groups, metadata),
    });
    const [create, createBase] = await initializeProfileInputs({ windowName: "Profile round trip", speechVoices: false });
    select(kernel(create), "__useLatestCore__");
    select(search(create), "Bing");
    const created = (await api.window.userAddWindowInfoV2Create(serialize(create, createBase))).data;
    assert.equal(created.useLatestCore, true);
    assert.equal(created.searchEngine, "bing");
    engine.sqliteStore?.close();
    engine = await openLocalEngine(root, sqlite);
    service = new LocalService({ engine, root });
    versions = ["160", ...versions];
    const read = async () => (await api.window.userGetWindowInfoV2List({ windowIds: created.id })).data.rows[0];
    const saved = await read();
    assert.equal(saved.coreVersion, "latest");
    assert.equal(saved.useLatestCore, true);
    const [legacy] = await initializeProfileInputs({ ...saved, useLatestCore: undefined });
    assert.equal(kernel(legacy).value.value, "__useLatestCore__", "recognize the old saved DTO without the mode flag");
    const [edit, editBase] = await initializeProfileInputs(saved);
    assert.equal(kernel(edit).value.value, "__useLatestCore__");
    assert.equal(search(edit).value.value, "Bing");
    const remarkOnly = serialize(edit, editBase, { windowRemark: "Only the note changed" });
    assert.equal(remarkOnly.coreVersion, "160", "the form can resolve a newly available concrete version");
    await api.window.userMdfWindowInfoSingleV2Create(remarkOnly);
    const after = await read();
    assert.equal(after.windowRemark, "Only the note changed");
    assert.equal(after.coreVersion, "latest", "editing metadata must not pin a kernel");
    assert.equal(after.searchEngine, "bing", "editing metadata must not change the search engine");
    const [chosen, chosenBase] = await initializeProfileInputs(after);
    select(kernel(chosen), "155");
    select(search(chosen), "Google");
    await api.window.userMdfWindowInfoSingleV2Create(serialize(chosen, chosenBase));
    const explicit = await read();
    assert.equal(explicit.coreVersion, "155");
    assert.equal(explicit.useLatestCore, false);
    assert.equal(explicit.searchEngine, "google");
  } finally { engine.sqliteStore?.close(); }
}

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ob-profile-write-receipt-"));
  const dbSupported = ProfileStoreSqlite.isSupported;
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString("hex");
  const failures = [];
  let passes = 0;
  try {
    assert.ok(dbSupported(), "real SQLite is required");
    for (const sqlite of [true, false]) {
      ProfileStoreSqlite.isSupported = sqlite ? dbSupported : () => false;
      for (const [operation, verify, phases] of [
        ["clone", runCase, ["healthy", "projection", "notification", "write"]],
        ["update", runCase, ["healthy", "projection", "notification", "late-read", "catalog", "write", "overlap"]],
        ["create", runCreateCase, ["projection", "notification", "write", "overlap"]],
        ["create-batch", runCreateCase, ["projection", "notification", "write", "overlap", "invalid-list"]],
        ["api-create", runApiCreateCase, ["receipt"]],
        ["form", runSettingsRoundTrip, ["round-trip"]],
      ]) {
        for (const phase of phases) {
          try {
            await verify(await fs.mkdtemp(path.join(tmp, "case-")), sqlite, operation, phase);
            passes++;
          } catch (error) {
            failures.push(new Error(`${sqlite ? "SQLite" : "JSON"} ${operation} ${phase}: ${error.message}`, { cause: error }));
          }
        }
      }
    }
    console.log(`Profile write receipts: ${passes}/${passes + failures.length}`);
    if (failures.length) throw new AggregateError(failures, "Profile write receipt regressions");
  } finally {
    ProfileStoreSqlite.isSupported = dbSupported;
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
