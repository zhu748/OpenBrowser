"use strict";
const { evidencePath } = require("./compiler/evidence-path.cjs");
const { workbookFixture, cell } = require('./selftest-profile-xlsx.cjs');

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

    const header = `<row r="1">${cell('A1', 'windowName')}${cell('B1', 'os')}</row>`;
    const xlsx = path.join(root, 'fixture.xlsx');
    service.dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [xlsx] });
    await fs.writeFile(xlsx, workbookFixture([
      `${header}<row r="4">${cell('A4', '说明：从第 5 行导入')}</row><row r="5"><c r="A5" t="s"><v>0</v></c>${cell('B5', 'Linux')}</row>`,
      `<row r="1">${cell('A1', '操作系统')}${cell('C1', '窗口名称')}${cell('D1', '备注')}</row><row r="2">${cell('A2', 'Windows')}${cell('C2', '普通表头')}</row><row r="4">${cell('A4', 'Linux')}${cell('C4', '第四行')}${cell('D4', '现场说明')}</row>`,
    ], { shared: '<si><r><t>旧模板</t></r><r><t>富文本</t></r></si>' }));
    const analysis = await service.request('profiles:read-import');
    assert.deepEqual(analysis.excelData.map(row => row.windowName), ['旧模板富文本', '普通表头', '第四行']);
    assert.equal(analysis.count, 3);
    assert.equal(engine.profiles.size, 2);
    await fs.writeFile(xlsx, workbookFixture([`${header}<row r="2"><c r="A2"><f>1+2</f><v>3</v></c>${cell('B2', 'Linux')}</row>`]));
    await assert.rejects(service.request('profiles:read-import'), /第 2 行.*公式/);
    await fs.writeFile(xlsx, workbookFixture([`${header}<row r="2">${cell('A2', 'x'.repeat(16 * 1024 * 1024))}${cell('B2', 'Linux')}</row>`]));
    await assert.rejects(service.request('profiles:read-import'), /解压内容超过 16 MiB/);
    assert.equal(engine.profiles.size, 2);

    const draft = await service.request('profiles:read', { id: first.id });
    const saved = await service.request('profiles:update', { id: first.id, rev: draft.rev, defaultOpenUrl: [], openWidth: 1440 });
    assert.deepEqual(saved.defaultOpenUrl, []);
    assert.equal(saved.openWidth, 1440);
    const after = engine.profiles.get(first.id);
    assert.equal(after.proxy, first.proxy);
    assert.deepEqual(after.platform.accounts, first.platform.accounts);
    assert.equal(after.cookies, first.cookies);
    const evidence = {
      status: "PASS",
      checks: [
        "real BrowserEngine: analysis has no writes, invalid second row rejects entire batch",
        "proxy auth/refresh, accounts/URLs, Cookie, Chrome/Firefox and explicit major version persist across restart",
        "fresh IDs and direct mode; row/count validation",
        "native picker cancellation and bounded file bytes",
        "source XLSX supports legacy and plain sheets and rejects formulas and oversized expanded content",
        "clearing startup URLs preserves existing proxy, accounts and cookies",
      ],
    };
    await fs.writeFile(
      evidencePath("import-selftest.json"),
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
