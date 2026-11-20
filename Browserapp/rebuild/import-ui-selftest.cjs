"use strict";
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");

const { createTestDirectory, waitUntil } = require("./selftest-helpers.cjs");
const { _electron: electron } = require("playwright"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const repo = path.resolve(__dirname, "../..");
(async () => {
  const data = await createTestDirectory('import-ui-'),
    evidence = evidenceDirectory(),
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
    const coreVersion = await page.evaluate(async () =>
      (await globalThis.electronAPI.send("app:getCoreList")).find((core) => core.coreType === "Chrome")?.coreVersion,
    );
    assert.ok(coreVersion, "Set OPENBROWSER_TEST_KERNEL_BINARY to an independent Chrome kernel");

    const unavailable = path.join(data, "unavailable.txt");
    await fs.writeFile(unavailable, "windowName=内核缺失回归\nos=Linux\ncoreType=Chrome\ncoreVersion=9999\n");
    await importPage();
    await upload(unavailable);
    await page.getByText("1 个窗口已成功导入", { exact: true }).waitFor();
    await create();
    await page.getByText(/未安装所选的 Chrome 9999 内核/).waitFor();
    await page.waitForFunction(() => !document.querySelector('.rx-main-content button[aria-label="创建窗口"]').disabled);
    assert.equal((await page.evaluate(() => globalThis.ops.profileStatus())).length, 0);
    result.checks.push("缺少指定内核时显示确切版本，结束等待并允许重新选择文件，未写入窗口");

    const txt = path.join(data, "profiles.txt");
    await fs.writeFile(
      txt,
      `windowName=TXT 导入一\nos=Linux\ncoreType=Chrome\ncoreVersion=${coreVersion}\nproxyCategory=HTTP\nproxyInfo=127.0.0.1:8080:import-user:import-pass\nwindowPlatformList=["https://example.com:local:account-secret"]\ndefaultOpenUrl=["https://example.com"]\ncookie=[{"name":"from-txt","value":"txt-cookie","domain":"example.com"}]\n\n##########\n\nwindowName=TXT 导入二\nos=Windows\ncoreType=Chrome\ndefaultOpenUrl=["about:blank"]\n\n##########\n`,
    );
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
    assert.equal(profile.engineVersion, coreVersion);
    result.checks.push(
      "原窗口导入页解析真实 TXT（含结尾分隔符），分析不创建数据；点击创建后两条记录、代理认证、账号与 Cookie 写入原后端",
    );
    await importPage();
    const templatePath = path.join(data, "downloaded-template.xlsx");
    await app.evaluate(({ session }, target) => {
      session.defaultSession.once("will-download", (_event, item) => {
        item.setSavePath(target);
        item.once("done", (_event, state) => { globalThis.__templateDownloadState = state; });
      });
    }, templatePath);
    await page.getByText("窗口导入模板", { exact: true }).click();
    await page.getByText("excel 模板", { exact: true }).click();
    await waitUntil(() => app.evaluate(() => globalThis.__templateDownloadState));
    assert.equal(await app.evaluate(() => globalThis.__templateDownloadState), "completed");
    const template = Array.from(await fs.readFile(templatePath));
    const bytes = await page.evaluate(async ({ template, coreVersion }) => {
      const excel = (await import("/assets/exceljs.min-DfecxsXL.js")).t();
      const book = new excel.Workbook();
      await book.xlsx.load(new Uint8Array(template));
      const sheet = book.getWorksheet(1);
      const headings = sheet.getRow(1).values.slice(1);
      if (!headings.includes("浏览器内核") || !headings.includes("窗口名称")) throw Error("Workbook is missing required headers");
      const cells = {
        窗口名称: "XLSX 导入三",
        操作系统: "Linux",
        浏览器内核: "Chrome",
        内核版本: coreVersion,
        平台账号: '["https://example.org:xlsx-user:xlsx-secret"]',
        "自定义打开 URL": '["https://example.org"]',
        Cookie: '[{"name":"from-xlsx","value":"xlsx-cookie","domain":"example.org"}]',
        窗口备注: "工作台导出的工作簿",
      };
      sheet.addRow(headings.map(header => cells[header] ?? ""));
      return Array.from(new Uint8Array(await book.xlsx.writeBuffer()));
    }, { template, coreVersion });
    const xlsx = path.join(data, "profiles.xlsx");
    await fs.writeFile(xlsx, Buffer.from(bytes));
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
      "点击导出 XLSX 模板，在实际下载的工作簿中填入一条记录，上传后经原窗口创建流程新增第三条窗口",
    );
    const invalid = path.join(data, "invalid.txt");
    await fs.writeFile(
      invalid,
      'windowName=禁止写入\nos=Linux\nwindowPlatformList={"bad":true}',
    );
    const oldPreview = path.join(data, "obsolete-preview.txt");
    await fs.writeFile(oldPreview, `windowName=已替换的预览\nos=Linux\ncoreType=Chrome\ncoreVersion=${coreVersion}\n`);
    await importPage();
    await upload(oldPreview);
    await page.getByText("1 个窗口已成功导入", { exact: true }).waitFor();
    await upload(invalid);
    await page
      .getByText("平台账号 必须是 JSON 数组", { exact: true })
      .waitFor();
    assert.equal(
      (await page.evaluate(() => globalThis.ops.profileStatus())).length,
      3,
    );
    await page.screenshot({ path: path.join(evidence, "import-invalid.png") });
    assert.equal(await page.getByText("obsolete-preview.txt", { exact: true }).count(), 0);
    await page.locator(".rx-alert-close").click();
    await create();
    await page.getByText("请选择要导入的文件。", { exact: true }).waitFor();
    assert.equal((await page.evaluate(() => globalThis.ops.profileStatus())).length, 3);
    result.checks.push(
      "用无效文件替换已预览文件时显示校验错误并清除旧预览，关闭提示后也无法提交旧文件",
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
