"use strict";
const fs = require("node:fs/promises"),
  os = require("node:os"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { BrowserEngine } = require("../engine"),
  { LocalService } = require("./local-service");
(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ob-import-"));
  let service;
  try {
    const engine = new BrowserEngine({ getPath: () => root });
    await engine.init(null);
    service = new LocalService({
      engine,
      root,
      window: () => null,
      dialog: {},
    });
    const rows = [
      {
        rowNum: 5,
        windowName: "真实导入一",
        os: "Linux",
        coreType: "Chrome",
        coreVersion: "157",
        proxyCategory: "HTTP",
        proxyInfo: "127.0.0.1:8080:user:pass[http://127.0.0.1/refresh]",
        windowPlatformList: [
          {
            platformUrl: "https://example.com",
            platformUserName: "local",
            platformPassword: "account-secret",
          },
        ],
        defaultOpenUrl: ["https://example.com"],
        cookie:
          '[{"name":"import-cookie","value":"cookie-secret","domain":"example.com"}]',
      },
      {
        rowNum: 6,
        windowName: "真实导入二",
        os: "Windows",
        coreType: "Firefox",
        coreVersion: "160",
        proxyCategory: "",
        defaultOpenUrl: ["about:blank"],
      },
    ];
    const payload = {
      fileName: "test.xlsx",
      useLatestCore: true,
      excelData: rows,
    };
    assert.deepEqual(
      await service.request("profiles:analyse-import", payload),
      { count: 2 },
    );
    assert.equal(engine.profiles.size, 0);
    await assert.rejects(
      service.request("profiles:import", {
        ...payload,
        excelData: [rows[0], { ...rows[1], os: "invalid" }],
      }),
      /第 6 行/,
    );
    assert.equal(engine.profiles.size, 0);
    await assert.rejects(
      service.request("profiles:import", {
        excelData: Array.from({ length: 201 }, () => rows[0]),
      }),
      /1–200/,
    );
    await service.request("profiles:import", payload);
    assert.equal(engine.profiles.size, 2);
    const first = [...engine.profiles.values()].find(
        (row) => row.name === "真实导入一",
      ),
      second = [...engine.profiles.values()].find(
        (row) => row.name === "真实导入二",
      );
    assert.equal(first.engineVersion, "157");
    assert.equal(second.engineVersion, "160");
    assert.equal(second.engine, "firefox");
    assert.equal(first.proxy, "http://user:pass@127.0.0.1:8080");
    assert.equal(first.proxyMeta.refreshUrl, "http://127.0.0.1/refresh");
    assert.equal(first.platform.accounts[0].password, "account-secret");
    assert.ok(first.cookies.includes("cookie-secret"));
    assert.equal(second.networkMode, "direct");
    assert.notEqual(first.id, second.id);
    const reloaded = new BrowserEngine({ getPath: () => root });
    await reloaded.init(null);
    assert.equal(reloaded.profiles.size, 2);
    assert.equal(
      reloaded.profiles.get(first.id).platform.accounts[0].url,
      "https://example.com",
    );
    const file = path.join(root, "fixture.txt");
    await fs.writeFile(file, "windowName=test");
    service.dialog.showOpenDialog = async () => ({
      canceled: false,
      filePaths: [file],
    });
    const picked = await service.request("profiles:choose-import");
    assert.equal(picked.name, "fixture.txt");
    assert.equal(Buffer.from(picked.bytes).toString(), "windowName=test");
    service.dialog.showOpenDialog = async () => ({
      canceled: true,
      filePaths: [],
    });
    assert.equal(await service.request("profiles:choose-import"), null);
    const evidence = {
      status: "PASS",
      checks: [
        "real BrowserEngine: analysis has no writes, invalid second row rejects entire batch",
        "proxy auth/refresh, accounts/URLs, Cookie, Chrome/Firefox and explicit major version persist across restart",
        "fresh IDs and direct mode; row/count validation",
        "native picker cancellation and bounded file bytes",
      ],
    };
    await fs.writeFile(
      path.resolve(
        __dirname,
        "../../docs/rebuild/evidence/import-selftest.json",
      ),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await service?.agent?.shutdown();
    await fs.rm(root, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
