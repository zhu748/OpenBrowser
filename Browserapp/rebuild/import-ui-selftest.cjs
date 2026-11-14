"use strict";
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await fs.mkdtemp(path.join(repo, "work/rebuild/import-ui-")),
    evidence = path.join(repo, "docs/rebuild/evidence"),
    result = { passed: false, errors: [], externalRequests: [], checks: [] };
  let app, page;
  const choose = async (file) => {
    await app.evaluate(({ dialog }, file) => {
      dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [file],
      });
    }, file);
  };
  const upload = async (file) => {
    await choose(file);
    await page.getByRole("button", { name: /^(上传文件|重新上传)$/ }).click();
  };
  const create = () =>
    page
      .locator(".rx-main-content")
      .getByRole("button", { name: "创建窗口", exact: true })
      .click();
  const importPage = async () => {
    await page.locator("#NEW_PROFILE").click();
    await page.getByText("窗口导入", { exact: true }).click();
    await page.getByRole("button", { name: "上传文件", exact: true }).waitFor();
  };
  try {
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        path.join(repo, "Browserapp"),
      ],
      env: { ...process.env, OPENBROWSER_USER_DATA: data },
    });
    page = await app.firstWindow();
    await page.setViewportSize({ width: 1280, height: 860 });
    page.on("pageerror", (error) => result.errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") result.errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        result.externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const txt = path.join(data, "profiles.txt");
    await fs.writeFile(
      txt,
      'windowName=TXT 导入一\nos=Linux\ncoreType=Chrome\ncoreVersion=157\nproxyCategory=HTTP\nproxyInfo=127.0.0.1:8080:import-user:import-pass\nwindowPlatformList=["https://example.com:local:account-secret"]\ndefaultOpenUrl=["https://example.com"]\ncookie=[{"name":"from-txt","value":"txt-cookie","domain":"example.com"}]\n\n##########\n\nwindowName=TXT 导入二\nos=Windows\ncoreType=Chrome\ndefaultOpenUrl=["about:blank"]\n\n##########\n',
    );
    await importPage();
    await upload(txt);
    await page.getByText("2 个窗口已成功导入", { exact: true }).waitFor();
    assert.equal(
      (await page.evaluate(() => globalThis.ops.profileStatus())).length,
      0,
    );
    await page.screenshot({
      path: path.join(evidence, "import-txt-preview.png"),
    });
    await create();
    await page.getByText("TXT 导入一", { exact: true }).waitFor();
    await page.getByText("TXT 导入二", { exact: true }).waitFor();
    const native = await page.evaluate(() => globalThis.ops.profileStatus());
    assert.equal(native.length, 2);
    const first = native.find((row) => row.name === "TXT 导入一"),
      full = await page.evaluate(
        (id) => globalThis.ops.profileForEdit(id),
        first.id,
      );
    const profile = full.value?.profile || full.profile;
    assert.ok(profile.cookies.includes("txt-cookie"));
    assert.equal(profile.platform.accounts[0].password, "account-secret");
    assert.ok(profile.proxy.includes("import-user:import-pass"));
    assert.equal(profile.engineVersion, "157");
    result.checks.push(
      "原窗口导入页解析真实 TXT（含结尾分隔符），分析不创建数据；点击创建后两条记录、代理认证、账号与 Cookie 写入原后端",
    );
    const code = await fs.readFile(
        path.join(repo, "Browserapp/roxy-ui/assets/utils-CnUy4XUk.js"),
        "utf8",
      ),
      keys = [];
    walk.simple(
      acorn.parse(code, { sourceType: "module", ecmaVersion: "latest" }),
      {
        FunctionDeclaration(node) {
          if (node.id.name !== "p") return;
          walk.simple(node.body, {
            ObjectExpression(row) {
              const key = row.properties.find(
                (property) => property.key?.name === "key",
              );
              if (key) {
                const value =
                  key.value.value ?? key.value.quasis?.[0]?.value.cooked;
                if (typeof value === "string") keys.push(value);
              }
            },
          });
        },
      },
    );
    assert.ok(keys.includes("coreType") && keys.includes("windowName"));
    const bytes = await page.evaluate(async (keys) => {
      const excel = (await import("/assets/exceljs.min-DfecxsXL.js")).t();
      const book = new excel.Workbook(),
        sheet = book.addWorksheet("profiles");
      sheet.addRow(keys);
      sheet.getRow(2).getCell(1).value = "说明";
      sheet.getRow(3).getCell(1).value = "举例";
      sheet.getRow(4).getCell(1).value = "说明";
      const row = {
        windowName: "XLSX 导入三",
        os: "Linux",
        coreType: "Chrome",
        coreVersion: "157",
        proxyCategory: "",
        windowPlatformList: '["https://example.org:xlsx-user:xlsx-secret"]',
        defaultOpenUrl: '["https://example.org"]',
        cookie:
          '[{"name":"from-xlsx","value":"xlsx-cookie","domain":"example.org"}]',
        windowRemark: "Excel 原解析器",
      };
      sheet.addRow(keys.map((key) => row[key] ?? ""));
      return Array.from(new Uint8Array(await book.xlsx.writeBuffer()));
    }, keys);
    const xlsx = path.join(data, "profiles.xlsx");
    await fs.writeFile(xlsx, Buffer.from(bytes));
    await importPage();
    await upload(xlsx);
    await page.getByText("1 个窗口已成功导入", { exact: true }).waitFor();
    await create();
    await page.getByText("XLSX 导入三", { exact: true }).waitFor();
    assert.equal(
      (await page.evaluate(() => globalThis.ops.profileStatus())).length,
      3,
    );
    await page.screenshot({ path: path.join(evidence, "import-created.png") });
    result.checks.push(
      "原 ExcelJS 与原列顺序生成 .xlsx 夹具，原上传/解析/创建流程真实新增第三条窗口；原生文件选择只固定测试返回路径",
    );
    const invalid = path.join(data, "invalid.txt");
    await fs.writeFile(
      invalid,
      'windowName=禁止写入\nos=Linux\nwindowPlatformList={"bad":true}',
    );
    await importPage();
    await upload(invalid);
    await page
      .getByText("平台账号 必须是 JSON 数组", { exact: true })
      .waitFor();
    assert.equal(
      (await page.evaluate(() => globalThis.ops.profileStatus())).length,
      3,
    );
    await page.screenshot({ path: path.join(evidence, "import-invalid.png") });
    result.checks.push(
      "非法平台账号 JSON 显示原页面错误区，不转成空账号、不新增窗口、不遗留等待状态",
    );
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.externalRequests, []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    if (page) {
      result.body = await page.locator("body").innerText();
      await page.screenshot({
        path: path.join(evidence, "import-ui-failure.png"),
      });
    }
  } finally {
    await app?.close();
    await fs.writeFile(
      path.join(evidence, "import-ui-selftest.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    if (!result.passed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
