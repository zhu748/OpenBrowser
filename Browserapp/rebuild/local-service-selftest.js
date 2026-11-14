"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { BrowserEngine } = require("../engine");
const { LocalService, fromRoxy, toRoxy } = require("./local-service");
const {
  resolveAsset,
  isUiDocument,
  isUiRequest,
  CSP,
  installUiProtocol,
} = require("./protocol");
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-rebuild-"));
  try {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    const removed = [];
    const service = new LocalService({
      engine,
      root,
      dialog: {},
      window: () => null,
      beforeRemove: (ids) => removed.push(...ids),
    });
    const row = await service.request("profiles:create", {
      windowName: "本地测试",
      coreType: "Firefox",
      os: "Linux",
      cookie: '[{"name":"test","value":"secret","domain":"example.com"}]',
      windowPlatformList: [
        { platformUserName: "local", platformPassword: "secret" },
      ],
    });
    assert.equal(engine.profiles.get(row.id).engine, "firefox");
    await assert.rejects(service.request("profiles:create", {
      windowName: "Cookie 截断保护", cookie: "x".repeat(500001),
    }), (error) => error.code === "PROFILE_COOKIES_TOO_LARGE");
    assert.equal(engine.profiles.size, 1, "过大 Cookie 拒绝后没有新增或损坏窗口");
    assert.equal(row.workspaceId, "local");
    assert.equal(row.workspaceName, "OpenBrowser");
    assert.equal(
      (await service.request("profiles:list"))[0].windowName,
      "本地测试",
    );
    assert.equal((await service.request("profiles:list"))[0].cookie, "");
    assert.equal(
      (await service.request("profiles:list"))[0].windowPlatformList[0]
        .platformPassword,
      "",
    );
    const edit = await service.request("profiles:read", { id: row.id });
    assert.ok(edit.cookie.includes("secret"));
    await engine.applyProfileCommands([
      {
        kind: "patch",
        id: row.id,
        baseRev: edit.rev,
        patch: { note: "来自后端的新内容" },
      },
    ]);
    await assert.rejects(
      service.request("profiles:update", {
        id: row.id,
        rev: edit.rev,
        windowName: "旧表单",
      }),
      (e) => e.code === "PROFILE_STALE_REV",
    );
    assert.equal(engine.profiles.get(row.id).note, "来自后端的新内容");
    const fresh = await service.request("profiles:read", { id: row.id });
    await service.request("profiles:update", {
      id: row.id,
      rev: fresh.rev,
      windowName: "修改成功",
    });
    assert.equal(engine.profiles.get(row.id).name, "修改成功");
    assert.ok(engine.profiles.get(row.id).cookies.includes("secret"));
    await service.request("profiles:delete", { ids: [row.id] });
    assert.equal((await service.request("profiles:list")).length, 0);
    assert.equal((await service.request("profiles:trash")).length, 1);
    assert.ok(removed.includes(row.id));
    await service.request("profiles:restore", { ids: [row.id] });
    assert.equal((await service.request("profiles:list")).length, 1);
    await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        service.request("templates:save", {
          templateName: "模板" + i,
          content: '{"os":"Linux"}',
        }),
      ),
    );
    const second = new LocalService({ engine, root });
    assert.equal((await second.request("templates:list")).length, 8);
    await assert.rejects(
      service.request("templates:save", {
        templateName: "坏模板",
        content: "[]",
      }),
      /Invalid template/,
    );
    await assert.rejects(
      service.request("unknown:operation"),
      /未实现本地接口/,
    );
    assert.equal(
      (await service.request("templates:list")).length,
      8,
      "失败之后队列应继续服务",
    );
    const exchanged = path.join(root, "exchange.json");
    service.dialog = {
      showSaveDialog: async () => ({ canceled: false, filePath: exchanged }),
      showOpenDialog: async () => ({ canceled: false, filePaths: [exchanged] }),
    };
    assert.equal(
      (await service.request("transfer:export", { ids: [row.id] })).count,
      1,
    );
    const exported = JSON.parse(await fs.readFile(exchanged, "utf8"));
    assert.ok(exported.profiles[0].cookies.includes("secret"));
    assert.equal((await service.request("transfer:import")).count, 1);
    assert.equal(engine.status().length, 2);
    const { AccountStore } = require("../automation/account-store");
    const accounts = new AccountStore(path.join(root, "accounts.enc"));
    await accounts.load();
    await accounts.import([
      {
        id: "selected-account",
        url: "https://example.test/first",
        username: "selected-user",
        password: "selected-secret",
        totpSecret: "TOTP",
      },
    ]);
    service.accountStore = () => accounts;
    const batch = await service.request("profiles:create-batch", {
      createCount: 2,
      windowNamePrefix: "批量",
      platformBindType: 1,
      platformUrlIds: ["selected-account"],
      fingerDetail: [
        { userAgent: "Batch-UA-one", deviceName: "device-one" },
        { userAgent: "Batch-UA-two", deviceName: "device-two" },
      ],
      proxyInfoList: [
        {
          host: "127.0.0.1",
          port: 8080,
          protocol: "http",
          proxyUserName: "proxy-user",
          proxyPassword: "proxy-secret",
        },
        { id: 0, proxyCategory: "noproxy" },
      ],
    });
    const first = engine.profileForEdit(batch[0].id).profile,
      last = engine.profileForEdit(batch[1].id).profile;
    assert.equal(first.userAgent, "Batch-UA-one");
    assert.equal(last.userAgent, "Batch-UA-two");
    assert.equal(first.platform.accounts[0].password, "selected-secret");
    assert.equal(first.platform.accounts[0].url, "https://example.test/first");
    assert.equal(last.platform.accounts.length, 0);
    assert.equal(first.networkMode, "proxy");
    assert.equal(last.networkMode, "direct");
    assert.ok(first.proxy.includes("proxy-user:proxy-secret"));
    const upgradeIds=batch.map(row=>row.id);
    const beforeUpgrade=upgradeIds.map(id=>engine.profileForEdit(id));
    await assert.rejects(service.request('profiles:patch',{ids:upgradeIds,patch:{coreVersion:'157',fingerDetail:[{userAgent:'incomplete'}]}}),/指纹条数/);
    assert.deepEqual(upgradeIds.map(id=>engine.profileForEdit(id)),beforeUpgrade,'升级指纹不完整时整批不修改');
    await service.request('profiles:patch',{ids:upgradeIds,patch:{coreVersion:'157',fingerDetail:[{userAgent:'Upgrade-UA-one',webGLManufacturer:'Vendor one',webGLRender:'Renderer one'},{userAgent:'Upgrade-UA-two',webGLManufacturer:'Vendor two',webGLRender:'Renderer two'}]}});
    assert.deepEqual(upgradeIds.map(id=>engine.profileForEdit(id).profile.userAgent),['Upgrade-UA-one','Upgrade-UA-two'],'逐窗升级 UA 不可丢弃或复用第一行');
    assert.deepEqual(upgradeIds.map(id=>toRoxy(engine.profileForEdit(id).profile).webGLRender),['Renderer one','Renderer two']);
    const countBeforeInvalid = engine.status().length;
    await assert.rejects(
      service.request("profiles:create-batch", {
        createCount: 2,
        fingerDetail: [{}],
      }),
      /指纹数量/,
    );
    await assert.rejects(
      service.request("profiles:create-batch", {
        createCount: 2,
        platformUrlIds: ["missing"],
      }),
      /账号不存在/,
    );
    assert.equal(
      engine.status().length,
      countBeforeInvalid,
      "批量校验失败不能留下部分窗口",
    );
    const shared = await service.request("profiles:create-batch", {
      createCount: 2,
      platformBindType: 2,
      platformUrlIds: ["selected-account"],
    });
    assert.ok(
      shared.every(
        (v) =>
          engine.profileForEdit(v.id).profile.platform.accounts[0].password ===
          "selected-secret",
      ),
    );
    assert.notEqual(engine.status()[1].id, row.id);
    const beforeBadImport = engine.status().length;
    await fs.writeFile(exchanged, '{"format":"wrong","profiles":[]}');
    await assert.rejects(
      service.request("transfer:import"),
      /Invalid profile exchange/,
    );
    assert.equal(engine.status().length, beforeBadImport);
    const { ProxyStore } = require("../automation/proxy-store");
    const proxyStore = new ProxyStore(path.join(root, "proxies.enc"));
    await proxyStore.load();
    service.proxyStore = () => proxyStore;
    const library = await proxyStore.create({
      protocol: "http",
      host: "127.0.0.1",
      port: 80,
      username: "u@x",
      password: "p:c",
    });
    const group = await service.request("groups:save", {
      projectName: "交换分组",
    });
    const grouped = await service.request("profiles:create", {
      windowName: "代理库交换",
      projectId: group.id,
      proxyInfoList: [{ moduleId: library.id }],
    });
    await service.request("transfer:export", { ids: [grouped.id] });
    const proxyExport = JSON.parse(await fs.readFile(exchanged, "utf8"))
      .profiles[0];
    assert.equal(proxyExport.proxyId, null);
    assert.equal(proxyExport.group_name, "交换分组");
    assert.ok(proxyExport.proxy.includes("u%40x:p%3Ac"));
    const duplicates = await service.request("proxies:duplicates", {
      items: [
        {
          tempId: "same",
          host: "127.0.0.1",
          port: 80,
          proxyUserName: "u@x",
          proxyPassword: "p:c",
        },
        { tempId: "new", host: "127.0.0.1", port: 81 },
      ],
    });
    assert.deepEqual(duplicates.items, [
      { tempId: "same", hasImportRecord: true },
      { tempId: "new", hasImportRecord: false },
    ]);
    const destination = await fs.mkdtemp(path.join(root, "destination-"));
    const foreignEngine = new BrowserEngine({ getPath: () => destination });
    await foreignEngine.init(null);
    const foreign = new LocalService({
      engine: foreignEngine,
      root: destination,
      dialog: service.dialog,
      window: () => null,
    });
    await foreign.request("transfer:import");
    const imported = foreignEngine.status()[0];
    assert.notEqual(imported.id, grouped.id);
    assert.notEqual(imported.groupId, group.id);
    assert.equal(imported.proxyId, null);
    assert.equal(imported.proxy, proxyExport.proxy);
    assert.equal(
      (await foreign.request("groups:list"))[0].projectName,
      "交换分组",
    );
    await service.request("profiles:patch", {
      ids: [grouped.id],
      patch: { projectId: null },
    });
    assert.equal(engine.profileForEdit(grouped.id).profile.groupId, "");
    await assert.rejects(
      service.request("profiles:patch", {
        ids: [grouped.id, "missing-profile"],
        patch: { windowRemark: "partial" },
      }),
    );
    assert.notEqual(
      engine.profileForEdit(grouped.id).profile.note,
      "partial",
      "批量修改校验失败不得部分写入",
    );
    const legacy = fromRoxy({
      windowName: "旧分组",
      projectId: "legacy-group",
    });
    legacy.group_name = "原分组名";
    await foreignEngine.syncProfiles([legacy]);
    const restarted = new LocalService({
      engine: foreignEngine,
      root: destination,
    });
    assert.ok(
      (await restarted.request("groups:list")).some(
        (row) => row.id === "legacy-group" && row.projectName === "原分组名",
      ),
    );
    await restarted.request("groups:delete", { ids: ["legacy-group"] });
    assert.equal(
      foreignEngine.profileForEdit(legacy.id).profile.group_name,
      "",
    );
    const fonts = fromRoxy({
      fontType: true,
      font: "Arial; Noto Sans CJK SC;Times New Roman",
    });
    assert.deepEqual(fonts.privacy.fingerprint.fonts, [
      "Arial",
      "Noto Sans CJK SC",
      "Times New Roman",
    ]);
    assert.equal(toRoxy(fonts).font, "Arial;Noto Sans CJK SC;Times New Roman");
    const mapped = fromRoxy({
      windowName: "字段验证",
      coreType: "Firefox",
      webRTC: 2,
      canvas: false,
      hardwareConcurrent: "12",
      deviceMemory: "8",
      position: 2,
      sandboxPermission: false,
      defaultOpenUrl: ["https://example.com"],
      resolutionX: "1920",
      resolutionY: "1080",
      syncLocalStorage: true,
      startupParam: "--disable-quic",
      disableSsl: true,
      disableSslList: ["0x1301"],
      windowPlatformList: [
        { platformUrl: "https://example.test/one", platformUserName: "one" },
        { platformUrl: "https://example.test/two", platformUserName: "two" },
      ],
    });
    assert.equal(mapped.engine, "firefox");
    assert.equal(
      fromRoxy({ coreType: "Chrome" }, mapped).engine,
      "chromium",
      "编辑 Firefox 时切换 Chrome 不能保留旧 engine",
    );
    assert.deepEqual(
      fromRoxy({ windowPlatformList: [] }, mapped).platform.accounts,
      [],
      "明确清空平台账号必须真正移除旧数据",
    );
    const withoutProxy = fromRoxy(
      { proxyInfoList: [{ proxyCategory: "noproxy", moduleId: 0 }] },
      first,
    );
    assert.equal(withoutProxy.networkMode, "direct");
    assert.equal(withoutProxy.proxyId, null);
    assert.equal(withoutProxy.proxy, "Direct");

    assert.equal(mapped.privacy.webrtc, "disabled");
    assert.equal(mapped.privacy.canvas, "real");
    assert.equal(mapped.privacy.cores, 12);
    assert.equal(mapped.privacy.fingerprint.screenWidth, 1920);
    assert.equal(mapped.privacy.geoPermission, "deny");
    assert.equal(mapped.privacy.noSandbox, false);
    assert.equal(mapped.startUrl, "https://example.com");
    assert.equal(mapped.advanced.syncLocalStorage, true);
    assert.equal(mapped.privacy.customArgs, "--disable-quic");
    assert.equal(mapped.privacy.fingerprint.sslBlacklist, "0x1301");
    assert.notEqual(
      mapped.advanced.ignoreHttpsError,
      true,
      "SSL 密码套件黑名单不得关闭证书校验",
    );
    assert.deepEqual(
      mapped.platform.accounts.map((a) => a.url),
      ["https://example.test/one", "https://example.test/two"],
    );
    await service.request("proxies:bind", {
      proxyId: library.id,
      windowIds: [row.id],
    });
    assert.equal(engine.profileForEdit(row.id).profile.proxyId, library.id);
    await assert.rejects(
      service.request("proxies:delete", { ids: [library.id] }),
      /仍关联/,
    );
    await service.request("proxies:save-results", {
      proxyList: [
        {
          id: library.id,
          lastIp: "203.0.113.10",
          lastCountry: "US",
          timezone: "UTC",
        },
      ],
    });
    assert.equal(proxyStore.get(library.id).lastIp, "203.0.113.10");
    await service.request("profiles:proxy-results", {
      proxyList: [
        {
          id: row.id,
          lastIp: "203.0.113.10",
          lastCountry: "US",
          timezone: "UTC",
          checkTime: "2026-01-01T00:00:00Z",
        },
      ],
    });
    assert.equal(
      (await service.request("profiles:read", { id: row.id })).lastIp,
      "203.0.113.10",
    );
    await service.request("proxies:bind", {
      proxyId: library.id,
      windowIds: [],
    });
    assert.equal(engine.profileForEdit(row.id).profile.networkMode, "direct");
    assert.equal(engine.profileForEdit(row.id).profile.proxyId, null);
    await service.request("proxies:delete", { ids: [library.id] });
    assert.equal(proxyStore.get(library.id), null);
    const defaultPort = fromRoxy({
      windowName: "标准端口",
      proxyInfoList: [
        {
          protocol: "http",
          host: "127.0.0.1",
          port: 80,
          proxyUserName: "a@b",
          proxyPassword: "p:c",
        },
      ],
      forbidImage: true,
      forbidMedia: true,
      forbidAudio: true,
      positionSwitch: false,
      windowRatioPosition: "1,0.5,tr",
    });
    const parsed = require("../proxy-forwarder").parseProxy(defaultPort.proxy);
    assert.equal(parsed.port, 80);
    assert.equal(parsed.username, "a@b");
    assert.equal(parsed.password, "p:c");
    assert.equal(toRoxy(defaultPort).port, 80);
    assert.equal(defaultPort.advanced.blockImages, false);
    assert.equal(defaultPort.advanced.blockVideo, false);
    assert.equal(defaultPort.advanced.blockSound, false);
    assert.equal(defaultPort.privacy.fullscreen, true);
    assert.equal(defaultPort.privacy.windowPos, "mr");
    assert.equal(toRoxy(defaultPort).windowRatioPosition, "1,0.5,tr");
    await assert.rejects(
      service.request("fingerprint:preview", { count: 0 }),
      /Invalid fingerprint count/,
    );
    const ui = path.join(root, "ui");
    await fs.mkdir(ui);
    await fs.writeFile(path.join(ui, "index.html"), "<p>local</p>");
    let handler;
    installUiProtocol(
      {
        handle: (_scheme, fn) => {
          handler = fn;
        },
      },
      null,
      ui,
    );
    const page = await handler({ url: "obui://app/index.html" });
    assert.equal(page.status, 200);
    assert.equal(await page.text(), "<p>local</p>");
    assert.equal(page.headers.get("Content-Security-Policy"), CSP);
    assert.equal((await handler({ url: "obui://app/missing.js" })).status, 404);
    if (process.platform !== "win32") {
      await fs.symlink(exchanged, path.join(ui, "escape.json"));
      assert.equal(
        (await handler({ url: "obui://app/escape.json" })).status,
        403,
      );
    }
    const persisted = new BrowserEngine({ getPath: () => root });
    await persisted.init(null);
    assert.equal(persisted.profiles.get(row.id).name, "修改成功");
    assert.equal(isUiDocument("obui://app/index.html#/browser/list"), true);
    assert.equal(isUiDocument("obui://app/assets/other.html"), false);
    assert.equal(isUiDocument("https://app/index.html"), false);
    assert.equal(isUiDocument("obui://evil/index.html"), false);
    assert.equal(
      resolveAsset("/local/ui", "obui://app/assets/test.js"),
      path.resolve("/local/ui/assets/test.js"),
    );
    assert.throws(() =>
      resolveAsset("/local/ui", "obui://app/%2e%2e%2fsecret"),
    );
    assert.throws(() => resolveAsset("/local/ui", "obui://evil/index.html"));
    assert.equal(isUiRequest("https://example.com"), false);
    assert.equal(isUiRequest("blob:https://example.com/id"), false);
    assert.equal(isUiRequest("blob:obui://app/id"), true);
    assert.equal(isUiRequest("obui://evil/assets/a.js"), false);
    assert.match(CSP, /connect-src 'none'/);
    assert.match(CSP, /frame-src 'none'/);
    assert.doesNotMatch(CSP, /unsafe-inline.*script-src/);
    console.log(
      "PASS: real engine CRUD, secrets, stale edits, restart, trash, template concurrency, local transfer, field mapping, rejection recovery, protocol/realpath confinement",
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
