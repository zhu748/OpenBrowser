"use strict";

const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { BrowserEngine } = require("../engine");
const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
const { readEngineStateCandidate } = require("../engine/state-storage");
const { captureIpcResult } = require("../shared/ipc-result");
const { LocalService } = require("./local-service");
const { encodeLocalStore } = require("./local-store");

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

async function runCase(root, sqlite, operation, phase) {
  const open = async () => {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    assert.equal(engine.usingSqlite, sqlite);
    return engine;
  };
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
    engine.sqliteStore?.close();
    engine = await open();
    assert.deepEqual((await readDurable()).map(row => [row.id, row.note]), durable.map(row => [row.id, row.note]));
    const reopened = new LocalService({ engine, root });
    if (cloneId) checkExplicitRead(await reopened.request("profiles:read", { id: cloneId }));
    if (clone) {
      const secondId = checkCloneReceipt(await reopened.request("profiles:clone", payload));
      assert.notEqual(secondId, cloneId, "a deliberate new clone is not deduplicated");
      assert.equal((await readDurable()).length, cloneId ? 3 : 2);
    } else if (phase === "write") {
      const fresh = await reopened.request("profiles:read", { id: original.id });
      assert.equal((await reopened.request("profiles:update", { ...payload, rev: fresh.rev })).windowRemark, "First edit");
    }
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
      for (const [operation, phases] of [
        ["clone", ["healthy", "projection", "notification", "write"]],
        ["update", ["healthy", "projection", "notification", "late-read", "catalog", "write", "overlap"]],
      ]) {
        for (const phase of phases) {
          try {
            await runCase(await fs.mkdtemp(path.join(tmp, "case-")), sqlite, operation, phase);
            passes++;
          } catch (error) {
            failures.push(new Error(`${sqlite ? "SQLite" : "JSON"} ${operation} ${phase}: ${error.message}`));
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
