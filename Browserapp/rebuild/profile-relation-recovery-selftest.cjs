"use strict";

const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { BrowserEngine } = require("../engine");
const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
const { encryptCredentialJson } = require("../credential-crypto");
const { KERNEL_POLICY_VERSION } = require("../engine/state-storage");
const { captureIpcResult } = require("../shared/ipc-result");
const { LocalService } = require("./local-service");
const { encodeLocalStore, readLocalStore } = require("./local-store");

const pending = "PROFILE_RELATIONS_RECOVERY_PENDING";
const members = ["first-readable", "later-target"];
const cleared = { groupId: "", group_name: "" };

async function exerciseRecovered(root, sqlite, missing) {
  const engine = new BrowserEngine({ getPath: () => root });
  const service = new LocalService({ root, engine });
  const project = { id: "existing-project", projectName: "Existing project" };
  const previous = { groupId: project.id, group_name: project.projectName };
  const backupFile = engine.stateFile + ".bak";
  const backup = encryptCredentialJson({
    kernelPolicyVersion: KERNEL_POLICY_VERSION,
    profiles: (missing ? members.slice(0, 1) : members).map(id => ({ id, name: id, ...cleared })),
  });
  const journal = encodeLocalStore({
    version: 1, groups: [project], settings: {}, templates: [], filters: [], skills: [], tasks: [],
    pendingProfileRelations: members.map(id => ({ id, before: previous, after: cleared })),
  });
  await fs.writeFile(backupFile, backup);
  await fs.writeFile(service.file, journal);
  try {
    await engine.init(null);
    assert.equal(engine.usingSqlite, sqlite);
    assert.equal(engine.storageRecovery, true, "the engine must actually load the backup");
    if (sqlite) assert.equal(engine.sqliteStore.getMeta("migrated_from"), backupFile);
    assert.equal(engine.profiles.has(members[1]), !missing);
    const active = sqlite ? engine.dbFile : engine.stateFile;
    const originalActive = await fs.readFile(active);
    if (missing) {
      for (let attempt = 0; attempt < 2; attempt++) {
        await assert.rejects(service.request("groups:list"), { code: pending });
        assert.equal(engine.profileForEdit(members[0]).profile.groupId, "");
        if (sqlite) assert.equal(engine.sqliteStore.getProfile(members[0]).groupId, "");
        assert.equal(service.data, undefined);
        assert.deepEqual(await fs.readFile(active), originalActive);
        assert.deepEqual(await fs.readFile(backupFile), backup);
        assert.deepEqual(await fs.readFile(service.file), journal);
      }
    } else {
      assert.equal((await service.request("groups:list"))[0].windowCount, 2);
      assert.deepEqual(members.map(id => engine.profileForEdit(id).profile.groupId), members.map(() => project.id));
      assert.equal(Object.hasOwn((await readLocalStore(service.file)).data, "pendingProfileRelations"), false);
    }
  } finally { engine.sqliteStore?.close(); }
}

async function exercise(root, sqlite, scenario) {
  if (scenario.startsWith("fallback-")) return exerciseRecovered(root, sqlite, scenario === "fallback-missing");
  const open = async () => {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    assert.equal(engine.usingSqlite, sqlite);
    return engine;
  };
  let engine = await open();
  const serviceFor = () => new LocalService({ root, engine });
  const links = (expected, ids = members) => {
    for (const id of ids) assert.equal(engine.profileForEdit(id).profile.groupId, expected);
  };
  const verifyJournal = async (service, absent, expected) => {
    const metadata = (await readLocalStore(service.file)).data;
    assert.equal(Object.hasOwn(metadata, "pendingProfileRelations"), !absent);
    if (expected) assert.deepEqual(await fs.readFile(service.file), expected);
  };
  const reopen = async () => {
    engine.sqliteStore?.close();
    engine = await open();
  };
  try {
    const service = serviceFor();
    const group = await service.request("groups:save", { projectName: "Existing project" });
    const original = { groupId: group.id, group_name: group.projectName };
    const rows = members.map(id => ({ id, name: id, note: "Preserve this note", ...original }));
    await engine.commitProfiles(rows);
    if (scenario === "aggregate") {
      const save = service.save.bind(service);
      const writeFailure = Object.assign(Error("fixture final metadata failure"), { code: "ENOSPC" });
      let journal, unavailable;
      service.save = async () => {
        if (service.data.pendingProfileRelations) {
          await save();
          journal = await fs.readFile(service.file);
          return;
        }
        // Simulate losing access to the second member after the forward SQLite
        // commit, not deleting that member from the authoritative store.
        unavailable = engine.profiles.get(members[1]);
        engine.profiles.delete(members[1]);
        throw writeFailure;
      };
      await assert.rejects(service.request("groups:delete", { ids: [group.id] }), error => {
        assert.ok(error instanceof AggregateError);
        assert.equal(error.code, pending);
        assert.equal(error.errors[0], writeFailure);
        assert.equal(error.errors[1].code, pending);
        return true;
      });
      links("", [members[0]]);
      assert.equal(engine.sqliteStore.hasProfile(members[1]), true);
      await verifyJournal(service, false, journal);
      // The rejected operation must evict the stale LocalService load; once
      // access returns, the same service can reload and finish its recovery.
      engine.profiles.set(members[1], unavailable);
      service.save = save;
      assert.equal((await service.request("groups:list"))[0].windowCount, 2);
      links(group.id);
      await verifyJournal(service, true);
      await reopen();
      links(group.id);
      return;
    }
    service.data.pendingProfileRelations = members.map(id => ({ id, before: original, after: cleared }));
    await service.save();
    const journal = await fs.readFile(service.file);
    await engine.commitProfiles(rows.map(row => ({ ...row, ...cleared })));
    const absent = ["deleted", "EIO", "not-ready"].includes(scenario);
    if (absent) await engine.deleteProfiles([members[1]], false);
    let activeBytes;
    const rowSql = "SELECT data FROM profiles WHERE id = ?";
    const replaceSql = "UPDATE profiles SET data = ? WHERE id = ?";
    if (scenario === "unreadable") {
      activeBytes = Buffer.from(engine.sqliteStore.db.prepare(rowSql).get(members[1]).data);
      const unreadable = Buffer.from(activeBytes);
      unreadable[unreadable.length - 1] ^= 1;
      engine.sqliteStore.db.prepare(replaceSql).run(unreadable, members[1]);
    }
    await reopen();
    let current = serviceFor();
    let unreadableBytes;
    if (scenario === "unreadable") {
      assert.equal(engine.sqliteStore.hasProfile(members[1]), true);
      assert.equal(engine.profiles.has(members[1]), false);
      unreadableBytes = Buffer.from(engine.sqliteStore.db.prepare(rowSql).get(members[1]).data);
    }
    if (["EIO", "not-ready", "unreadable", "partial-view"].includes(scenario)) {
      const injected = Object.assign(Error("fixture SQLite membership read"), { code: "EIO" });
      const hasProfile = engine.sqliteStore?.hasProfile, profileForEdit = engine.profileForEdit;
      if (scenario === "EIO") {
        engine.sqliteStore.hasProfile = function (id) {
          if (id === members[1]) throw injected;
          return hasProfile.call(this, id);
        };
      } else if (scenario === "not-ready") engine.sqliteStore.hasProfile = undefined;
      else if (scenario === "partial-view") {
        engine.profileForEdit = function (id) {
          if (id === members[1]) return undefined;
          return profileForEdit.call(this, id);
        };
      }
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await captureIpcResult(() => current.request("groups:list"));
          assert.equal(result.ok, false, "cannot clear this journal until absence or readability is verified");
          assert.equal(result.error.code, pending);
          assert.ok(!result.error.message.includes("fixture SQLite membership read"));
          await verifyJournal(current, false, journal);
          assert.equal(current.data, undefined, "an uncertain recovery must not expose a partial local store");
          links("", [members[0]]);
          if (sqlite) assert.equal(engine.sqliteStore.getProfile(members[0]).groupId, "", "do not compensate the first member alone");
          if (unreadableBytes) assert.deepEqual(Buffer.from(engine.sqliteStore.db.prepare(rowSql).get(members[1]).data), unreadableBytes);
        }
      } finally {
        if (sqlite) engine.sqliteStore.hasProfile = hasProfile;
        engine.profileForEdit = profileForEdit;
      }
      if (scenario === "unreadable") {
        engine.sqliteStore.db.prepare(replaceSql).run(activeBytes, members[1]);
        await reopen();
        current = serviceFor();
      }
    }
    assert.equal((await current.request("groups:list"))[0].windowCount, absent ? 1 : 2);
    links(group.id, absent ? [members[0]] : members);
    assert.equal(engine.profileForEdit(members[0]).profile.note, "Preserve this note");
    await verifyJournal(current, true);
    await reopen();
    links(group.id, absent ? [members[0]] : members);
    if (absent) assert.equal(engine.profiles.has(members[1]), false);
  } finally { engine.sqliteStore?.close(); }
}

async function main() {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ob-relations-recovery-"));
  const supported = ProfileStoreSqlite.isSupported;
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString("hex");
  const failures = [];
  let passed = 0;
  try {
    assert.ok(supported(), "exercise real SQLite and forced JSON");
    for (const sqlite of [true, false]) {
      ProfileStoreSqlite.isSupported = sqlite ? supported : () => false;
      const scenarios = ["healthy", "deleted", "partial-view", "fallback-missing", "fallback-present",
        ...(sqlite ? ["unreadable", "EIO", "not-ready", "aggregate"] : [])];
      for (const scenario of scenarios) {
        try {
          await exercise(await fs.mkdtemp(path.join(tmp, "case-")), sqlite, scenario);
          passed++;
        } catch (error) {
          failures.push(new Error(`${sqlite ? "SQLite" : "JSON"} ${scenario}: ${error.message}`));
        }
      }
    }
    console.log(`Profile relation recovery: ${passed}/${passed + failures.length}`);
    if (failures.length) throw new AggregateError(failures, "Profile relation recovery regressions");
  } finally {
    ProfileStoreSqlite.isSupported = supported;
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(tmp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
