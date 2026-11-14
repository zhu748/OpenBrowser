"use strict";
const fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict");
const { BrowserEngine } = require("../engine"),
  { AccountStore } = require("../automation/account-store"),
  { LocalService } = require("./local-service");
(async () => {
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString("hex");
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-accounts-")),
    result = { status: "FAIL", checks: [] };
  const engine = new BrowserEngine({ getPath: () => root }),
    store = new AccountStore(path.join(root, "platform-accounts.enc"));
  let service;
  try {
    await engine.init(null);
    await store.load();
    service = new LocalService({ engine, root, accountStore: () => store });
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
    store.file = badFile;
    const apply = engine.applyProfileCommands.bind(engine);
    let inject = true;
    engine.applyProfileCommands = async (commands, ...args) => {
      const outcome = await apply(commands, ...args);
      if (
        inject &&
        commands.some((command) =>
          command.profile?.platform.accounts.some(
            (row) =>
              row.accountId === account.id &&
              row.username === "rollback-target",
          ),
        )
      ) {
        inject = false;
        const current = engine.profileForEdit(two.id);
        await apply([
          {
            kind: "patch",
            id: two.id,
            baseRev: current.rev,
            patch: { note: "concurrent note survives" },
          },
        ]);
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
    engine.applyProfileCommands = apply;
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
    result.status = "PASS";
  } finally {
    await service?.agent.shutdown();
    await store.flush();
    await engine.flushPersistence();
    await fs.writeFile(
      path.join(
        __dirname,
        "../../docs/rebuild/evidence/accounts-selftest.json",
      ),
      JSON.stringify(result, null, 2),
    );
    await fs.rm(root, { recursive: true, force: true });
  }
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
