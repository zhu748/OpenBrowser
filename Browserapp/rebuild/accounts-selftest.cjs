"use strict";
const { evidencePath } = require("./compiler/evidence-path.cjs");

const fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict");
const { BrowserEngine } = require("../engine"),
  { AccountStore } = require("../automation/account-store"),
  { LocalService } = require("./local-service");
const { spawnSync } = require("node:child_process");
const { isEncrypted, decryptCredential } = require("../credential-crypto");
const { restoreAccountProfiles } = require("./accounts");

async function interruptAccountWrite(root, operation) {
  const engine = new BrowserEngine({ getPath: () => root });
  const store = new AccountStore(path.join(root, "platform-accounts.enc"));
  await engine.init(null);
  await store.load();
  const service = new LocalService({ engine, root, window: () => null, accountStore: () => store });
  const [account] = await service.request("accounts:create", {
    values: [{ platformUserName: "before-interruption", platformPassword: "synthetic-before" }],
  });
  const profile = await service.request("profiles:create", { windowName: "crash test", platformUrlIds: [account.id] });
  await fs.writeFile(path.join(root, "test-ids.json"), JSON.stringify({ accountId: account.id, profileId: profile.id }));
  const commit = engine.commitProfiles.bind(engine);
  engine.commitProfiles = async (...args) => {
    await commit(...args);
    process.exit(77);
  };
  const method = "accounts:" + operation;
  await service.request(method, operation === "delete" ? { ids: [account.id] } : {
    platformList: [{ id: account.id, platformUserName: "after-interruption", platformPassword: "synthetic-after" }],
  });
  assert.fail("The process should have stopped after the window write");
}

async function checkInterruptedAccountWrite(root, operation) {
  const dir = path.join(root, "interrupted-" + operation);
  await fs.mkdir(dir);
  const child = spawnSync(process.execPath, [__filename, "--interrupt", dir, operation], { encoding: "utf8", timeout: 30000 });
  assert.equal(child.status, 77, child.error?.message || child.stderr);
  const { accountId, profileId } = JSON.parse(await fs.readFile(path.join(dir, "test-ids.json"), "utf8"));
  const file = path.join(dir, "platform-accounts.enc");
  const pending = await fs.readFile(file);
  assert.ok(isEncrypted(pending));
  assert.equal(JSON.parse(decryptCredential(pending)).pendingProfileChanges.length, 1);
  const engine = new BrowserEngine({ getPath: () => dir });
  await engine.init(null);
  const before = engine.profileForEdit(profileId).profile.platform.accounts[0];
  assert.equal(before?.username, operation === "delete" ? undefined : "after-interruption");
  const store = new AccountStore(file, { recoverProfileChanges: journal => restoreAccountProfiles(engine, journal) });
  await store.load();
  assert.equal(store.get(accountId).username, "before-interruption");
  const recovered = engine.profileForEdit(profileId).profile.platform.accounts[0];
  assert.equal(recovered.username, "before-interruption");
  assert.equal(recovered.password, "synthetic-before");
  assert.equal(JSON.parse(decryptCredential(await fs.readFile(file))).pendingProfileChanges, undefined);
  await engine.flushPersistence();
}

(async () => {
  if (process.argv[2] === "--interrupt") return interruptAccountWrite(process.argv[3], process.argv[4]);
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString("hex");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-accounts-")),
    result = { status: "FAIL", checks: [] };
  const engine = new BrowserEngine({ getPath: () => root }),
    store = new AccountStore(path.join(root, "platform-accounts.enc"));
  let service;
  try {
    await engine.init(null);
    await store.load();
    service = new LocalService({ engine, root, window: () => null, accountStore: () => store });
    const [account] = await service.request("accounts:create", {
      values: [
        {
          platformUrl: "https://accounts.example.test/",
          platformUserName: "original",
          platformPassword: "library-secret",
          platformEfa: "TOTP",
          platformRemarks: "remark",
        },
      ],
    });
    const rows = await service.request("accounts:list");
    assert.equal(rows.total, 1);
    assert.equal(rows.rows[0].platformPassword, undefined);
    assert.equal(rows.rows[0].platformEfa, undefined);
    assert.equal(
      (await service.request("accounts:list", { id: account.id })).rows[0]
        .platformPassword,
      "library-secret",
    );
    assert.ok(
      !(await fs.readFile(store.file)).includes(Buffer.from("library-secret")),
    );
    const exportFile = path.join(root, "accounts.txt");
    service.dialog = {
      showSaveDialog: async () => ({ filePath: exportFile }),
      showOpenDialog: async () => ({ filePaths: [exportFile] }),
    };
    await fs.writeFile(exportFile, "old", { mode: 0o644 });
    await service.request("accounts:export", { ids: [account.id], format: "txt" });
    assert.ok(!(await fs.readFile(exportFile, "utf8")).includes("library-secret"));
    if (process.platform !== "win32") assert.equal((await fs.stat(exportFile)).mode & 0o777, 0o600);
    await service.request("accounts:export", { ids: [account.id], format: "txt", includeCredentials: true });
    const exported = await service.request("accounts:import-preview");
    assert.equal(exported.values[0].platformPassword, "library-secret");
    assert.equal(exported.values[0].platformEfa, "TOTP");
    const one = await service.request("profiles:create", {
      windowName: "manual and library",
      os: "Linux",
      windowPlatformList: [
        {
          platformUrl: "https://manual.example.test/",
          platformUserName: "manual",
          platformPassword: "manual-secret",
        },
      ],
      platformUrlIds: [account.id],
      cookie: '[{"name":"preserved","value":"yes","domain":"example.test"}]',
    });
    const two = await service.request("profiles:create", {
      windowName: "other",
      os: "Linux",
    });
    assert.equal(
      engine.profileForEdit(one.id).profile.platform.accounts[1].accountId,
      account.id,
    );
    await service.request("accounts:bind", {
      platformId: account.id,
      windowIds: [two.id],
    });
    assert.equal(
      engine.profileForEdit(one.id).profile.platform.accounts.length,
      1,
    );
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.accounts[0].accountId,
      account.id,
    );
    assert.equal(
      engine.profileForEdit(two.id).profile.startUrl,
      "https://accounts.example.test/",
    );
    assert.deepEqual(
      JSON.parse((await service.request("accounts:list")).rows[0].window_info),
      [two.windowSortNum],
    );
    const archived = await service.request("profiles:create", {
      windowName: "recycled account binding", platformUrlIds: [account.id],
    });
    await service.request("profiles:delete", { ids: [archived.id] });
    const currentBinding = engine.profileForEdit(two.id);
    await service.request("accounts:bind", { platformId: account.id, windowIds: [two.id] });
    assert.deepEqual(engine.profileForEdit(two.id), currentBinding, "saving the same selection leaves the active window unchanged");
    assert.equal(engine.profileForEdit(archived.id).profile.platform.accounts[0].accountId, account.id);
    assert.equal((await service.request("accounts:list")).rows[0].boundProfileIds.includes(archived.id), false);
    await service.request("accounts:update", {
      platformList: [{ id: account.id, platformUserName: "updated" }],
    });
    assert.equal(store.get(account.id).password, "library-secret");
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.username,
      "updated",
    );
    await assert.rejects(
      service.request("accounts:update", {
        platformList: [
          { id: account.id, platformUserName: "must-not-save" },
          { id: "missing", platformUserName: "bad" },
        ],
      }),
      /账号不存在/,
    );
    assert.equal(store.get(account.id).username, "updated");
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.username,
      "updated",
    );
    result.checks.push(
      "真实加密账号库创建/读取/脱敏；绑定与改名传播到原窗口，非法末行整批拒绝；主启动 URL 正确",
    );
    const edit = await service.request("profiles:read", { id: two.id });
    await service.request("profiles:update", {
      ...edit,
      windowName: "edited",
      rev: edit.rev,
    });
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.accounts[0].accountId,
      account.id,
    );
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.password,
      "library-secret",
    );
    await service.request("profiles:edit-data", {
      ids: [two.id],
      type: "platform_select",
      paramList: { platformUrlIds: [account.id] },
    });
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.accounts.length,
      1,
      "重复选择原有账号不重复追加",
    );
    const linked = engine.profileForEdit(two.id).profile.platform.accounts[0];
    await service.request("profiles:edit-data", {
      ids: [two.id],
      type: "platform_edit",
      paramList: {
        platformUrlIds: [account.id],
        windowPlatformList: [
          {
            accountId: account.id,
            platformUrl: linked.url,
            platformUserName: "window-specific",
            platformPassword: linked.password,
            platformEfa: linked.totpSecret,
          },
        ],
      },
    });
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.accounts.length,
      1,
    );
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.username,
      "window-specific",
    );
    assert.equal(
      engine.profileForEdit(two.id).profile.platform.accounts[0].accountId,
      undefined,
    );
    assert.equal(store.get(account.id).username, "updated");
    result.checks.push(
      "完整原 DTO 往返保留库 ID/机密；重复选择去重；原 batch-edit 改为窗口专用账号时解除库关联，库值不被覆盖",
    );
    await service.request("accounts:bind", {
      platformId: account.id,
      windowIds: [one.id, two.id],
    });
    const originalFile = store.file,
      badFile = path.join(root, "unwritable-directory");
    await fs.mkdir(badFile);
    const commit = engine.commitProfiles.bind(engine);
    let inject = true;
    engine.commitProfiles = async (profiles, ...args) => {
      const outcome = await commit(profiles, ...args);
      if (
        inject &&
        profiles.some((profile) =>
          profile.platform?.accounts.some(
            (row) =>
              row.accountId === account.id &&
              row.username === "rollback-target",
          ),
        )
      ) {
        inject = false;
        const current = engine.profileForEdit(two.id);
        await engine.applyProfileCommands([
          {
            kind: "patch",
            id: two.id,
            baseRev: current.rev,
            patch: { note: "concurrent note survives" },
          },
        ]);
        store.file = badFile;
      }
      return outcome;
    };
    await assert.rejects(
      service.request("accounts:update", {
        platformList: [{ id: account.id, platformUserName: "rollback-target" }],
      }),
    );
    assert.equal(store.get(account.id).username, "updated");
    assert.equal(
      engine
        .profileForEdit(two.id)
        .profile.platform.accounts.find((row) => row.accountId === account.id)
        .username,
      "updated",
    );
    assert.equal(
      engine.profileForEdit(two.id).profile.note,
      "concurrent note survives",
    );
    store.file = originalFile;
    engine.commitProfiles = commit;
    result.checks.push(
      "明确注入账号文件写失败，真实窗口关联补偿回滚；并发备注编辑保留，没有全行旧快照覆盖",
    );
    await service.request("profiles:delete", { ids: [two.id] });
    await service.request("accounts:delete", { ids: [account.id] });
    assert.equal(store.list().length, 0);
    assert.ok(
      engine.profileForEdit(one.id).profile.cookies.includes("preserved"),
    );
    assert.ok(
      [...engine.profiles.values()].every(
        (profile) =>
          !profile.platform.accounts.some(
            (row) => row.accountId === account.id,
          ),
      ),
    );
    const reopened = new AccountStore(originalFile);
    await reopened.load();
    assert.equal(reopened.list().length, 0);
    result.checks.push(
      "删除解绑活动配置与回收站，保留 Cookie/登录数据；重新读取原库结果一致",
    );
    for (const operation of ["update", "delete"]) await checkInterruptedAccountWrite(root, operation);
    result.checks.push("更新或删除时强制退出，重启通过加密日志恢复关联窗口");

    const [largeBinding] = await service.request("accounts:create", { values: [{ platformUserName: "large-binding" }] });
    for (const createCount of [100, 100, 2]) {
      await service.request("profiles:create-batch", { createCount, platformBindType: 2, platformUrlIds: [largeBinding.id] });
    }
    const { rows: [detail] } = await service.request("accounts:list", { id: largeBinding.id });
    assert.equal(detail.boundProfileIds.length, 202);
    for (const windowIds of [detail.boundProfileIds, detail.boundProfileIds.slice(1)]) {
      const saved = await service.request("accounts:bind", { platformId: largeBinding.id, windowIds });
      assert.deepEqual(saved.bound, windowIds);
      assert.deepEqual((await service.request("accounts:list", { id: largeBinding.id })).rows[0].boundProfileIds, windowIds);
    }
    result.checks.push("超过旧上限的账号关联可以原样保存和修改");
    result.status = "PASS";
  } finally {
    await service?.agent.shutdown();
    await store.flush();
    await engine.flushPersistence();
    await fs.writeFile(
      evidencePath("accounts-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
