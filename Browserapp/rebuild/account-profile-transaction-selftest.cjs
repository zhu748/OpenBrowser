"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { randomBytes } = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");
const { BrowserEngine } = require("../engine");
const { AccountStore } = require("../automation/account-store");
const { ProfileStoreSqlite } = require("../automation/profile-store-sqlite");
const { encryptCredentialJson, decryptCredentialJson } = require("../credential-crypto");
const { KERNEL_POLICY_VERSION } = require("../engine/state-storage");
const { captureIpcResult } = require("../shared/ipc-result");
const { LocalService } = require("./local-service");
const { restoreAccountProfiles } = require("./accounts");

const ids = ["active-target", "later-archived-target"];
const account = { id: "synthetic-library-row", username: "Original", url: "https://account.invalid", createdAt: "2025-01-01" };
const nextName = "Changed by profile editor";
const linked = { accountId: account.id, username: account.username, url: account.url };
const archiveTime = "2024-01-01T00:00:00.000Z";
const profile = (id, i) => ({ id, name: id, number: i + 1, trashed: i % 2 === 1, trashedAt: i % 2 ? archiveTime : null,
  startUrl: account.url, platform: { accounts: [linked], username: account.username, startUrl: account.url } });
const updateFields = profile => ({ ...profile,
  platform: { ...profile.platform, username: nextName,
    accounts: profile.platform.accounts.map(row => ({ ...row, username: nextName })) } });
const onlyAccountFields = ({ platform, startUrl }) => ({ platform, startUrl });
const err = (message, code) => Object.assign(Error(message), { code });
const pending = "ACCOUNT_STORE_RECOVERY_PENDING", unavailable = "ACCOUNT_STORE_UNAVAILABLE";

async function setup(t, sqlite, { count = 2, incompleteBackup = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-account-profile-transaction-"));
  const file = path.join(root, "platform-accounts.enc");
  const previous = process.env.OPENBROWSER_MASTER_KEY;
  const supports = ProfileStoreSqlite.isSupported;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString("hex");
  if (!sqlite) ProfileStoreSqlite.isSupported = () => false;
  let engine, store, service;
  t.after(async () => {
    engine?.sqliteStore?.close();
    if (previous === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previous;
    ProfileStoreSqlite.isSupported = supports;
    await fs.rm(root, { recursive: true, force: true });
  });
  async function reopen(load = true) {
    engine?.sqliteStore?.close();
    engine = new BrowserEngine({ getPath: () => root });
    engine.kernelManager = { loadMeta: async () => {} };
    engine.start = () => { throw Error("Browser launch is out of scope"); };
    await engine.init(null);
    assert.equal(engine.usingSqlite, sqlite);
    store = new AccountStore(file, { recoverProfileChanges: journal => restoreAccountProfiles(engine, journal) });
    if (load) await store.load();
    service = new LocalService({ engine, root, accountStore: () => store });
  }
  const all = count === 2 ? ids : Array.from({ length: count }, (_, i) => `fixture-${i}`);
  if (incompleteBackup) {
    const initial = new BrowserEngine({ getPath: () => root });
    const originals = all.map(profile).map(row => initial.sanitizeProfile(row)), changes = originals.map(updateFields);
    await fs.writeFile(file, encryptCredentialJson({ version: 1, accounts: [account], pendingProfileChanges: all.map((id, i) => ({
      id, before: onlyAccountFields(originals[i]), after: onlyAccountFields(changes[i]),
    })) }));
    await fs.writeFile(initial.stateFile + ".bak", encryptCredentialJson({ kernelPolicyVersion: KERNEL_POLICY_VERSION,
      profiles: changes.slice(0, 1) }));
    await reopen(false);
  } else {
    await reopen();
    await store.import([account]);
    await engine.commitProfiles(all.map(profile));
  }
  return {
    file, all, reopen, engine: () => engine, store: () => store,
    update: () => service.request("accounts:update", { platformList: [{ id: account.id, platformUserName: nextName }] }),
    bind: () => service.request("accounts:bind", { platformId: account.id, windowIds: [] }),
    remove: () => service.request("accounts:delete", { ids: [account.id] }),
    username: id => engine.profileForEdit(id).profile.platform.accounts[0]?.username,
    hasJournal: async () => Object.hasOwn(decryptCredentialJson(await fs.readFile(file)), "pendingProfileChanges"),
  };
}

for (const sqlite of [true, false]) {
  const mode = sqlite ? "SQLite" : "encrypted JSON";
  const options = { skip: sqlite && !ProfileStoreSqlite.isSupported(), timeout: 15000 };

  for (const intervening of ["durable purge", "independent matching update"]) {
    test(`${mode}: ${intervening} while writing the account journal is not undone`, options, async t => {
      const f = await setup(t, sqlite);
      const e = f.engine(), { rename } = fs;
      const reached = Promise.withResolvers(), release = Promise.withResolvers();
      let held = false;
      fs.rename = async (from, to) => {
        if (to === f.file && !held) { held = true; reached.resolve(); await release.promise; }
        return rename(from, to);
      };
      const update = f.update().then(value => ({ value }), error => ({ error }));
      try {
        await reached.promise;
        if (intervening === "durable purge") {
          await e.deleteProfiles([ids[1]], false);
          assert.equal(e.profiles.has(ids[1]), false);
          if (sqlite) assert.equal(e.sqliteStore.hasProfile(ids[1]), false);
        } else {
          const { profile, rev } = e.profileForEdit(ids[0]);
          await e.commitProfiles([{ ...updateFields(profile), note: "Competing note", rev }], { checkRevisions: true });
        }
        release.resolve();
        const result = await update;
        assert.equal(result.error?.code, intervening === "durable purge" ? "PROFILE_NOT_FOUND" : "PROFILE_STALE_REV");
      } finally { release.resolve(); fs.rename = rename; }
      assert.equal(await f.hasJournal(), false);
      await f.reopen();
      assert.equal(f.store().get(account.id).username, account.username);
      if (intervening === "durable purge") {
        assert.equal(f.engine().profiles.has(ids[1]), false);
        assert.equal(f.username(ids[0]), account.username);
      } else {
        assert.equal(f.username(ids[0]), nextName);
        assert.equal(f.engine().profileForEdit(ids[0]).profile.note, "Competing note");
        assert.equal(f.username(ids[1]), account.username);
      }
    });
  }

  test(`${mode}: failed clearing of an unapplied journal rejects and locks further account writes`, options, async t => {
    const f = await setup(t, sqlite);
    const e = f.engine(), { rename } = fs;
    const reached = Promise.withResolvers(), release = Promise.withResolvers();
    const cleanupFailure = err("Fixture could not clear the unapplied journal", "ENOSPC");
    let writes = 0, journalBytes;
    fs.rename = async (from, to) => {
      if (to === f.file) {
        const phase = ++writes;
        if (phase === 1) { reached.resolve(); await release.promise; }
        if (phase === 2) { journalBytes = await fs.readFile(f.file); throw cleanupFailure; }
      }
      return rename(from, to);
    };
    const update = f.update().catch(error => error);
    try {
      await reached.promise;
      const { profile, rev } = e.profileForEdit(ids[0]);
      await e.commitProfiles([{ ...updateFields(profile), rev }], { checkRevisions: true });
      release.resolve();
      const result = await update;
      assert.equal(result.code, pending);
      assert.equal(result.errors[0].code, "PROFILE_STALE_REV");
      assert.equal(result.errors[1], cleanupFailure);
      assert.ok((await fs.readFile(f.file)).equals(journalBytes));
      assert.equal(f.username(ids[0]), nextName, "do not compensate an independent same-values edit");
      const removal = await captureIpcResult(f.remove);
      assert.equal(removal.ok, false);
      assert.equal(removal.error.code, pending);
      assert.equal(writes, 2, "the lock prevents another attempt from consuming the journal");
    } finally { release.resolve(); fs.rename = rename; }
    // This runtime still knows the transaction did not apply. The journal
    // format does not encode that fact for recovery by a different process.
  });

  for (const [operation, late] of [["bind", "status"], ["update", "status"], ["update", "event"]]) {
    test(`${mode}: late ${late} does not falsely reject durable ${operation}`, options, async t => {
      const f = await setup(t, sqlite);
      const e = f.engine(), { status, emit } = e, failure = err("Late fixture notification/projection", "EIO");
      if (late === "status") e.status = () => { throw failure; };
      else e.emit = function (event) {
        if (event.action === "profiles-update") throw failure;
        return emit.call(this, event);
      };
      try {
        const reply = await f[operation]();
        assert.deepEqual(reply, operation === "bind" ? { bound: [] } : { changed: [account.id] });
      } finally { Object.assign(e, { status, emit }); }
      await f.reopen();
      assert.equal(await f.hasJournal(), false);
      assert.equal(f.username(ids[0]), operation === "bind" ? undefined : nextName);
      assert.equal(f.username(ids[1]), operation === "bind" ? account.username : nextName);
      assert.equal(f.engine().profileForEdit(ids[1]).profile.trashed, true);
    });
  }

  for (const phase of ["profile write", "account final write", "account final write and compensation"]) {
    test(`${mode}: actual persistence-boundary ENOSPC in ${phase} has a truthful outcome`, options, async t => {
      const f = await setup(t, sqlite);
      const e = f.engine(), db = e.sqliteStore, save = db?.saveProfilesDiffed;
      const { rename } = fs;
      const profileFault = err("Fixture window write failed", "ENOSPC"), accountFault = err("Fixture account write failed", "ENOSPC");
      let profileWrites = 0, accountWrites = 0, journalBytes;
      const faultProfileWrite = () => {
        profileWrites++;
        if ((phase === "profile write" && profileWrites === 1) ||
            (phase === "account final write and compensation" && profileWrites === 2)) throw profileFault;
      };
      if (sqlite) db.saveProfilesDiffed = function (rows) { const value = save.call(this, rows); faultProfileWrite(); return value; };
      fs.rename = async (from, to) => {
        if (!sqlite && to === e.stateFile) faultProfileWrite();
        if (to === f.file && ++accountWrites === 2 && phase !== "profile write") {
          if (phase === "account final write") {
            // Keep ordinary independent metadata even if the account association is rolled back.
            const current = e.profileForEdit(ids[0]).profile;
            await e.commitProfiles([{ ...current, note: "Independent note while account file is held" }]);
          }
          journalBytes = await fs.readFile(f.file);
          throw accountFault;
        }
        return rename(from, to);
      };
      try {
        if (phase === "account final write and compensation") {
          await assert.rejects(f.update(), error => error.code === pending && error.errors[0] === accountFault && error.errors[1] === profileFault);
          assert.ok((await fs.readFile(f.file)).equals(journalBytes), "the original pending journal must remain byte-identical");
          assert.equal(f.username(ids[0]), nextName);
          assert.equal(f.username(ids[1]), nextName);
          await assert.rejects(f.update(), { code: pending });
        } else {
          await assert.rejects(f.update(), error => error === (phase === "profile write" ? profileFault : accountFault));
          assert.equal(await f.hasJournal(), false);
        }
      } finally { fs.rename = rename; if (sqlite) db.saveProfilesDiffed = save; }
      await f.reopen();
      assert.equal(await f.hasJournal(), false);
      assert.equal(f.store().get(account.id).username, account.username);
      assert.ok(ids.every(id => f.username(id) === account.username));
      assert.equal(f.engine().profileForEdit(ids[1]).profile.trashed, true);
      if (phase === "account final write")
        assert.equal(f.engine().profileForEdit(ids[0]).profile.note, "Independent note while account file is held");
    });
  }

  test(`${mode}: a genuine absent journal target can settle without recreating it`, options, async t => {
    const f = await setup(t, sqlite);
    const originals = ids.map(id => f.engine().profileForEdit(id).profile), changes = originals.map(updateFields);
    await f.engine().commitProfiles(changes);
    await fs.writeFile(f.file, encryptCredentialJson({ version: 1, accounts: [account], pendingProfileChanges: ids.map((id, i) => ({
      id, before: onlyAccountFields(originals[i]), after: onlyAccountFields(changes[i]),
    })) }));
    await f.engine().deleteProfiles([ids[1]], false);
    await f.reopen();
    assert.equal(await f.hasJournal(), false);
    assert.equal(f.username(ids[0]), account.username);
    assert.equal(f.engine().profiles.has(ids[1]), false);
  });

  test(`${mode}: an absent target in this boot's recovered backup does not authorize journal settlement`, options, async t => {
    const f = await setup(t, sqlite, { incompleteBackup: true });
    const bytes = await fs.readFile(f.file);
    assert.equal(f.engine().storageRecovery, true);
    assert.equal(f.engine().profiles.has(ids[1]), false);
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(f.store().load(), { code: unavailable });
      await assert.rejects(f.update(), { code: unavailable });
      assert.ok((await fs.readFile(f.file)).equals(bytes));
      assert.equal(f.username(ids[0]), nextName);
    }
  });

  test(`${mode}: duplicate journal IDs do not authorize even the first compensation`, options, async t => {
    const f = await setup(t, sqlite);
    const original = f.engine().profileForEdit(ids[0]).profile, updated = updateFields(original);
    await f.engine().commitProfiles([updated]);
    const entry = { id: ids[0], before: onlyAccountFields(original), after: onlyAccountFields(updated) };
    const bytes = encryptCredentialJson({ version: 1, accounts: [account], pendingProfileChanges: [entry, entry] });
    await fs.writeFile(f.file, bytes);
    await assert.rejects(f.store().load(), { code: unavailable });
    assert.ok((await fs.readFile(f.file)).equals(bytes));
    assert.equal(f.username(ids[0]), nextName);
  });

  test(`${mode}: exact 202 existing targets are supported including recycled rows`, options, async t => {
    const f = await setup(t, sqlite, { count: 202 });
    assert.deepEqual(await f.update(), { changed: [account.id] });
    await f.reopen();
    assert.ok(f.all.every(id => f.username(id) === nextName));
    assert.equal([...f.engine().profiles.values()].filter(row => row.trashed).length, 101);
    assert.deepEqual(await f.remove(), { changed: [account.id] });
    await f.reopen();
    assert.ok(f.all.every(id => f.username(id) === undefined));
    assert.equal([...f.engine().profiles.values()].filter(row => row.trashed).length, 101);
  });
}

for (const condition of ["durable unreadable", "presence EIO"]) {
  test(`SQLite holds all journal targets when a later target is ${condition}`, { skip: !ProfileStoreSqlite.isSupported(), timeout: 15000 }, async t => {
    const f = await setup(t, true);
    const originals = ids.map(id => f.engine().profileForEdit(id).profile), changes = originals.map(updateFields);
    await f.engine().commitProfiles(changes);
    await fs.writeFile(f.file, encryptCredentialJson({ version: 1, accounts: [account], pendingProfileChanges: ids.map((id, i) => ({
      id, before: onlyAccountFields(originals[i]), after: onlyAccountFields(changes[i]),
    })) }));
    const bytes = await fs.readFile(f.file);
    let db = f.engine().sqliteStore, restored;
    if (condition === "durable unreadable") {
      const content = Buffer.from(db.db.prepare("SELECT data FROM profiles WHERE id = ?").get(ids[1]).data);
      const damaged = Buffer.from(content);
      damaged[damaged.length - 1] ^= 1;
      db.db.prepare("UPDATE profiles SET data = ? WHERE id = ?").run(damaged, ids[1]);
      await f.reopen(false);
      db = f.engine().sqliteStore;
      assert.equal(db.hasProfile(ids[1]), true);
      assert.equal(f.engine().profiles.has(ids[1]), false);
      restored = async () => {
        db.db.prepare("UPDATE profiles SET data = ? WHERE id = ?").run(content, ids[1]);
        await f.reopen();
      };
    } else {
      const has = db.hasProfile;
      db.hasProfile = function (id) {
        if (id === ids[1]) throw err("Fixture lookup failed", "EIO");
        return has.call(this, id);
      };
      restored = () => { db.hasProfile = has; return f.store().load(); };
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      await assert.rejects(f.store().load(), { code: unavailable });
      await assert.rejects(f.update(), { code: unavailable });
      assert.ok((await fs.readFile(f.file)).equals(bytes));
      assert.equal(f.username(ids[0]), nextName);
    }
    await restored();
    assert.equal(await f.hasJournal(), false);
    assert.ok(ids.every(id => f.username(id) === account.username));
    assert.equal(f.engine().profileForEdit(ids[1]).profile.trashed, true);
  });
}
