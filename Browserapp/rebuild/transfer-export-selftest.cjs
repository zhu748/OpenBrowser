"use strict";

const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { setImmediate: nextTurn } = require("node:timers/promises");
const { test } = require("node:test");
const { BrowserEngine } = require("../engine");
const { writeRawAtomically } = require("../engine/state-storage");
const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
const { ProxyStore } = require("../automation/proxy-store");
const { LocalService } = require("./local-service");

const sourceId = "selected-profile", otherId = "other-profile", group = "7";
const original = Buffer.from("An existing user export\n");
const proxyId = "inert-linked-proxy";
const oldProxy = "http://old.proxy.invalid:80", newProxy = "http://new.proxy.invalid:80";
const errno = code => Object.assign(Error(`Fixture ${code}`), { code });

async function fixture(t, sqlite, { linked = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-transfer-export-"));
  const priorKey = process.env.OPENBROWSER_MASTER_KEY;
  const support = ProfileStoreSqlite.isSupported;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString("hex");
  if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
  const engine = new BrowserEngine({ getPath: () => root });
  t.after(async () => {
    engine.sqliteStore?.close();
    ProfileStoreSqlite.isSupported = support;
    if (priorKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = priorKey;
    await fs.rm(root, { recursive: true, force: true });
  });
  engine.kernelManager = { loadMeta: async () => {} };
  engine.start = () => { throw Error("Browser launch is out of scope"); };
  await engine.init(null);
  assert.equal(engine.usingSqlite, sqlite);
  const filePath = path.join(root, "export.json");
  await fs.writeFile(filePath, original);
  const proxies = new ProxyStore(path.join(root, "proxy-library.json"));
  await proxies.load();
  if (linked) {
    await proxies.create({ id: proxyId, raw: oldProxy });
    engine.proxyStore = proxies;
  }
  let picker, pickerCalls = 0;
  const service = new LocalService({ engine, root, window: () => null, proxyStore: () => proxies,
    dialog: {
      showSaveDialog: async () => {
        pickerCalls++;
        picker?.entered.resolve();
        return picker ? picker.answer.promise : { canceled: false, filePath };
      },
      showOpenDialog: async () => ({ canceled: false, filePaths: [filePath] }),
    },
  });
  await service.request("groups:save", { id: Number(group), projectName: "Original catalog name" });
  await engine.commitProfiles([
    { id: sourceId, name: "Selected", number: 1, note: "Original note", groupId: group, group_name: "Stale shadow",
      ...(linked && { proxyId, proxy: oldProxy, networkMode: "proxy" }) },
    { id: otherId, name: "Other", number: 2 },
    { id: "null", name: "A valid string key", number: 3 },
  ]);
  const request = ids => service.request("transfer:export", { ids });
  return {
    root, filePath, engine, service, proxies, request, pickerCalls: () => pickerCalls,
    heldPicker() {
      const entered = Promise.withResolvers(), answer = Promise.withResolvers();
      picker = { entered, answer };
      return { entered: entered.promise, complete: canceled => { answer.resolve({ canceled, filePath }); picker = null; } };
    },
    async keepOriginal() {
      assert.deepEqual(await fs.readFile(filePath), original);
      assert.ok(!(await fs.readdir(root)).some(name => name.startsWith("export.json.tmp-")));
    },
    async readExport() {
      const doc = JSON.parse(await fs.readFile(filePath, "utf8"));
      assert.deepEqual([doc.format, doc.version], ["openbrowser-profiles", 1]);
      return doc.profiles;
    },
    updateNote(note) {
      return service.request("profiles:update", { id: sourceId, rev: engine.profileForEdit(sourceId).rev, windowRemark: note });
    },
    changeProject(name) {
      return service.request("groups:save", { id: Number(group), projectName: name });
    },
  };
}

function holdExportStage(filePath) {
  const reached = Promise.withResolvers(), complete = Promise.withResolvers();
  const open = fs.open;
  fs.open = async (file, ...args) => {
    const handle = await open(file, ...args);
    if (String(file).startsWith(`${filePath}.tmp-`)) {
      const close = handle.close.bind(handle);
      handle.close = async () => {
        await close();
        reached.resolve();
        await complete.promise;
      };
    }
    return handle;
  };
  return { reached: reached.promise, release: complete.resolve, restore() { complete.resolve(); fs.open = open; } };
}

for (const sqlite of [true, false]) {
  const prefix = sqlite ? "SQLite" : "encrypted JSON";
  const options = { skip: sqlite && !ProfileStoreSqlite.isSupported(), timeout: 12000 };

  test(`${prefix}: invalid, duplicate, sparse, missing or recycled IDs do not open the picker`, options, async t => {
    const f = await fixture(t, sqlite);
    for (const ids of [[], Array(201).fill(sourceId), [null], Array(1), [sourceId, sourceId], [sourceId, "absent"]])
      await assert.rejects(f.request(ids));
    await f.engine.trashProfiles([sourceId]);
    await assert.rejects(f.request([otherId, sourceId]));
    f.engine.deletingProfiles.add(otherId);
    try { await assert.rejects(f.request([otherId])); }
    finally { f.engine.deletingProfiles.delete(otherId); }
    assert.equal(f.pickerCalls(), 0);
    await f.keepOriginal();
    assert.deepEqual(await f.request(["null"]), { count: 1 });
    assert.equal((await f.readExport())[0].id, "null");
  });

  test(`${prefix}: cancellation stays cancellation, but approval refuses a now-retired selection`, options, async t => {
    const f = await fixture(t, sqlite);
    for (const canceled of [true, false]) {
      const picker = f.heldPicker();
      // Capture the result before resolving the mocked picker (no native UI).
      const sending = f.request([otherId, sourceId]).then(value => ({ value }), error => ({ error }));
      await picker.entered;
      try { await f.engine.trashProfiles([sourceId]); }
      finally { picker.complete(canceled); }
      const reply = await sending;
      if (canceled) assert.deepEqual(reply.value, { canceled: true });
      else assert.equal(reply.error?.code, "PROFILE_INACTIVE");
      await f.keepOriginal();
      await f.engine.restoreProfiles([sourceId]);
    }
  });

  test(`${prefix}: approval reads the latest row and effective project/proxy without holding the picker`, options, async t => {
    const f = await fixture(t, sqlite, { linked: true });
    const picker = f.heldPicker();
    const sending = f.request([otherId, sourceId]);
    await picker.entered;
    try {
      await f.updateNote("New note");
      const rev = f.engine.profiles.revisionOf(sourceId);
      await f.changeProject("Current catalog name");
      await f.proxies.update(proxyId, { raw: newProxy });
      assert.equal(f.engine.profiles.revisionOf(sourceId), rev, "catalog changes do not change the row revision");
    } finally { picker.complete(false); }
    assert.deepEqual(await sending, { count: 2 });
    const profiles = await f.readExport();
    assert.deepEqual(profiles.map(row => row.id), [otherId, sourceId]);
    assert.deepEqual([profiles[1].note, profiles[1].group_name, profiles[1].proxy, profiles[1].proxyId],
      ["New note", "Current catalog name", newProxy, null]);
    assert.deepEqual(await f.service.request("transfer:import"), { count: 2 });
    assert.deepEqual((await f.service.request("groups:list")).map(row => [row.projectName, row.windowCount]), [["Current catalog name", 2]]);
  });

  for (const kind of ["recycle", "pending", "row", "project", "proxy", "unrelated"]) {
    test(`${prefix}: staged export checks ${kind} at pre-replace without blocking other work`, options, async t => {
      const f = await fixture(t, sqlite, { linked: true });
      const stage = holdExportStage(f.filePath);
      const sending = f.request([otherId, sourceId]).then(value => ({ value }), error => ({ error }));
      try {
        await stage.reached;
        if (kind === "recycle") await f.engine.trashProfiles([sourceId]);
        if (kind === "pending") f.engine.deletingProfiles.add(sourceId);
        if (kind === "row") await f.updateNote("A later edit");
        if (kind === "project") await f.changeProject("A newer project");
        if (kind === "proxy") await f.proxies.update(proxyId, { raw: newProxy });
        if (kind === "unrelated") {
          await f.service.request("groups:save", { id: "unrelated", projectName: "Unrelated project" });
          await f.proxies.update(proxyId, { name: "New display name only" });
        }
        stage.release();
        const reply = await sending;
        if (kind === "unrelated") {
          assert.deepEqual(reply.value, { count: 2 });
          assert.equal((await f.readExport())[1].proxy, oldProxy);
        } else {
          assert.equal(reply.error?.code, ["recycle", "pending"].includes(kind) ? "PROFILE_INACTIVE" : "TRANSFER_SELECTION_CHANGED");
          await f.keepOriginal();
        }
      } finally { stage.restore(); f.engine.deletingProfiles.delete(sourceId); }
    });
  }

  test(`${prefix}: true destination rename EIO retains the previous export`, options, async t => {
    const f = await fixture(t, sqlite);
    const rename = fs.rename, error = errno("EIO");
    let sawRename = false;
    fs.rename = async (source, destination) => {
      if (destination === f.filePath) { sawRename = true; throw error; }
      return rename(source, destination);
    };
    try { await assert.rejects(f.request([sourceId]), cause => cause === error); }
    finally { fs.rename = rename; }
    assert.equal(sawRename, true);
    await f.keepOriginal();
  });

  test(`${prefix}: waits only for a same-service save and excludes its rolled-back ENOSPC draft`, options, async t => {
    const f = await fixture(t, sqlite);
    const { engine, service } = f;
    const saving = Promise.withResolvers(), release = Promise.withResolvers(), ordered = Promise.withResolvers();
    const store = engine.sqliteStore, save = store?.saveEngineState, rename = fs.rename;
    const error = errno("ENOSPC");
    const captured = service.enqueueLocal;
    const failWrite = async () => { saving.resolve(); await release.promise; throw error; };
    if (sqlite) store.saveEngineState = failWrite;
    else fs.rename = async (source, target) => target === engine.stateFile ? failWrite() : rename(source, target);
    service.enqueueLocal = function (call, options) {
      if (options?.rollback === false) ordered.resolve("ordered");
      return captured.call(this, call, options);
    };
    const writing = f.updateNote("Uncommitted draft").catch(cause => cause);
    try {
      await saving.promise;
      assert.equal(engine.profileForEdit(sourceId).profile.note, "Uncommitted draft");
      const sending = f.request([sourceId]);
      const which = await Promise.race([ordered.promise, sending.then(() => "wrote prematurely")]);
      if (which === "ordered") {
        await nextTurn();
        await f.keepOriginal();
      }
      release.resolve();
      assert.equal(await writing, error);
      assert.deepEqual(await sending, { count: 1 });
      assert.equal((await f.readExport())[0].note, "Original note");
      assert.equal(which, "ordered");
    } finally { release.resolve(); fs.rename = rename; if (sqlite) store.saveEngineState = save; }
  });

  test(`${prefix}: export does not start or flush an unrelated direct engine write`, options, async t => {
    const f = await fixture(t, sqlite);
    const { engine } = f;
    const { persist, _persistWriter: writer } = engine, flush = writer.flushNow;
    const started = Promise.withResolvers(), release = Promise.withResolvers();
    const error = errno("ENOSPC");
    let requests = 0, flushes = 0;
    engine.persist = () => { requests++; started.resolve(); return release.promise; };
    writer.flushNow = () => { flushes++; throw Error("Export must not flush pending engine writes"); };
    const current = engine.profileForEdit(otherId);
    const writing = engine.applyProfileCommands([
      { id: otherId, baseRev: current.rev, kind: "patch", patch: { note: "Unrelated staged note" } },
    ]).catch(cause => cause);
    try {
      await started.promise;
      assert.deepEqual(await f.request([sourceId]), { count: 1 });
      assert.equal((await f.readExport())[0].note, "Original note");
      assert.deepEqual([requests, flushes], [1, 0]);
    } finally { release.reject(error); await writing; writer.flushNow = flush; engine.persist = persist; }
  });

  test(`${prefix}: 200 active V1 rows keep their exact order and existing archived V1 remains archived`, options, async t => {
    const f = await fixture(t, sqlite);
    const ids = Array.from({ length: 200 }, (_, i) => `export-${i}`);
    await f.engine.commitProfiles(ids.map((id, i) => ({ id, name: `Fixture ${i}`, number: i + 4 })));
    assert.deepEqual(await f.request(ids), { count: 200 });
    assert.deepEqual((await f.readExport()).map(row => row.id), ids);
    assert.deepEqual(await f.service.request("transfer:import"), { count: 200 });
    assert.equal((await f.service.request("profiles:list")).length, 403);
    await fs.writeFile(f.filePath, JSON.stringify({ format: "openbrowser-profiles", version: 1,
      profiles: [{ id: "old-archive", name: "Previous archived entry", trashed: true, trashedAt: "2020-01-01T00:00:00Z" }] }));
    assert.deepEqual(await f.service.request("transfer:import"), { count: 1 });
    assert.equal((await f.service.request("profiles:list")).length, 403);
    assert.ok([...f.engine.profiles.values()].find(row => row.name === "Previous archived entry")?.trashed);
  });
}

test("atomic writer retains an unowned collision and a failed owned staging file is still cleaned", { timeout: 12000 }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-transfer-writer-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const target = path.join(root, "destination.json"), open = fs.open;
  const unrelated = Buffer.from("Independent stage");
  let otherStage, ownedStage;
  fs.open = async (file, ...args) => {
    if (!otherStage && String(file).startsWith(`${target}.tmp-`)) {
      otherStage = file;
      await fs.writeFile(file, unrelated, { flag: "wx" });
    }
    return open(file, ...args);
  };
  try { await writeRawAtomically(target, "New normal content"); }
  finally { fs.open = open; }
  assert.equal(await fs.readFile(target, "utf8"), "New normal content");
  assert.deepEqual(await fs.readFile(otherStage), unrelated);

  const error = errno("ENOSPC");
  fs.open = async (file, ...args) => {
    const handle = await open(file, ...args);
    if (String(file).startsWith(`${target}.tmp-`)) {
      ownedStage = file;
      handle.sync = async () => { throw error; };
    }
    return handle;
  };
  try { await assert.rejects(writeRawAtomically(target, "Do not replace"), cause => cause === error); }
  finally { fs.open = open; }
  assert.equal(await fs.readFile(target, "utf8"), "New normal content");
  await assert.rejects(fs.stat(ownedStage), { code: "ENOENT" });
  assert.deepEqual(await fs.readFile(otherStage), unrelated);
});

test("atomic retry authorizes each rename but never retries a failed authorization", { timeout: 12000 }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-transfer-authorization-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const target = path.join(root, "destination.json");
  await fs.writeFile(target, original);
  const rename = fs.rename;
  let renames = 0, checks = 0;
  const failure = errno("EAGAIN");
  fs.rename = async (source, dest) => {
    if (dest === target && ++renames === 1) throw errno("EBUSY");
    return rename(source, dest);
  };
  try {
    await assert.rejects(writeRawAtomically(target, "Do not replace", undefined, { beforeReplace() {
      if (++checks === 2) throw failure;
    } }), error => error === failure);
  } finally { fs.rename = rename; }
  assert.deepEqual([checks, renames], [2, 1]);
  assert.deepEqual(await fs.readFile(target), original);
  assert.deepEqual(await fs.readdir(root), ["destination.json"]);
});

for (const when of ["before rename dispatch", "during a failed rename"]) {
  test(`atomic writer preserves a replacement of its stage pathname ${when}`, { timeout: 12000 }, async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-transfer-stage-identity-"));
    t.after(() => fs.rm(root, { recursive: true, force: true }));
    const target = path.join(root, "destination.json"), parked = path.join(root, "initial-stage.json");
    const independent = Buffer.from("Independent replacement contents");
    const { open, rename } = fs, failure = errno("EIO");
    let stage, dispatches = 0;
    await fs.writeFile(target, original);
    const replace = async file => {
      stage = file;
      // Keep the original inode allocated so the independent replacement
      // cannot have reused its identity.
      await rename(file, parked);
      await fs.writeFile(file, independent, { flag: "wx" });
    };
    fs.open = async (file, ...args) => {
      const handle = await open(file, ...args);
      if (when === "before rename dispatch" && String(file).startsWith(`${target}.tmp-`)) {
        const close = handle.close.bind(handle);
        handle.close = async () => { await close(); if (!stage) await replace(file); };
      }
      return handle;
    };
    fs.rename = async (source, destination) => {
      if (destination === target) {
        dispatches++;
        if (when === "during a failed rename") { await replace(source); throw failure; }
      }
      return rename(source, destination);
    };
    try {
      if (when === "before rename dispatch") {
        await assert.rejects(writeRawAtomically(target, "Owned content"), { code: "ATOMIC_STAGE_CHANGED" });
        assert.equal(dispatches, 0);
      } else {
        await assert.rejects(writeRawAtomically(target, "Owned content"), error => error === failure);
        assert.equal(dispatches, 1);
      }
    } finally { Object.assign(fs, { open, rename }); }
    assert.deepEqual(await fs.readFile(target), original);
    assert.deepEqual(await fs.readFile(stage), independent);
    assert.equal(await fs.readFile(parked, "utf8"), "Owned content");
  });
}

test("atomic writer retains unconfirmed stage when file identity is unsupported", { timeout: 12000 }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-transfer-stage-unsupported-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const target = path.join(root, "destination.json"), open = fs.open, failure = errno("EIO");
  let stage, failSync = true;
  await fs.writeFile(target, original);
  fs.open = async (file, ...args) => {
    const handle = await open(file, ...args);
    if (String(file).startsWith(`${target}.tmp-`)) {
      stage = file;
      handle.stat = async () => { throw errno("ENOTSUP"); };
      if (failSync) handle.sync = async () => { throw failure; };
    }
    return handle;
  };
  try {
    await assert.rejects(writeRawAtomically(target, "Unconfirmed content"), error => error === failure);
    assert.deepEqual(await fs.readFile(target), original);
    const unconfirmed = stage;
    assert.equal(await fs.readFile(unconfirmed, "utf8"), "Unconfirmed content");
    failSync = false;
    await writeRawAtomically(target, "Otherwise healthy write");
    assert.equal(await fs.readFile(target, "utf8"), "Otherwise healthy write");
    assert.equal(await fs.readFile(unconfirmed, "utf8"), "Unconfirmed content");
  } finally { fs.open = open; }
});
