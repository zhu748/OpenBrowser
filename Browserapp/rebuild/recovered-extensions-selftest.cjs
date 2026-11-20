"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { createTestDirectory } = require("./selftest-helpers.cjs");
const { evidenceDirectory } = require("./compiler/evidence-path.cjs");
const { launchVisualApp, captureStableScreenshot } = require("./source-visual-selftest-helpers.cjs");

const { installReference, readReferenceRequests, readSourceRequests, switchReferenceMode, disableReferenceCache } = require("./workbench-reference-selftest-helpers.cjs");

const appRoot = path.resolve(__dirname, "..");
const output = evidenceDirectory("extensions-comparison");
const comparator = path.join(__dirname, "visual-pixel-diff.py");
const routeAsset = "extensions-DkcE60nw.js";
const baselineAsset = "extensions-reference.js";
const tableAsset = "table-BJcS2I0Z.js";

async function capture(page, theme, mode, record) {
  await page.goto("obui://app/index.html?visual=extensions-" + mode + "-" + theme + "#/extensions");
  await page.waitForFunction(() => globalThis.__router?.currentRoute.value.path === "/extensions");
  await page.evaluate(async theme => {
    const { n: useTheme } = await import("/assets/theme-mq6SsndU.js");
    useTheme().setTheme(theme);
    await document.fonts.ready;
  }, theme);
  await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);

  const entry = page.getByRole("row").filter({ hasText: "本地扩展对照" });
  const button = name => page.getByRole("button", { name, exact: true });
  const dialog = page.locator(".p-dialog").last();
  const shot = async (name, target) => {
    await target.waitFor();
    await page.mouse.move(2, 2);
    const file = theme + "-" + name + "-" + mode + ".png";
    await captureStableScreenshot(page, path.join(output, file), target);
    await record(theme + "-" + name, file);
  };
  await entry.waitFor();
  await shot("installed", page.locator(".rx-main-content"));
  await entry.getByRole("checkbox").check();
  await shot("bulk-selection", page.locator(".actionbar"));
  await entry.getByRole("checkbox").uncheck();
  await page.locator(".actionbar").waitFor({ state: "hidden" });

  await button("本地上传").click();
  await button("选择文件夹").waitFor();
  await shot("upload-empty", dialog);
  await button("选择文件夹").click();
  await page.locator("input.extension-input").waitFor();
  await shot("upload-selected", dialog);
  await button("取消").last().click();
  await dialog.waitFor({ state: "hidden" });

  await entry.getByText("尚未安装", { exact: true }).click();
  await dialog.getByText("默认项目", { exact: true }).waitFor();
  await shot("assignment", dialog);
  await button("取消").last().click();
  await dialog.waitFor({ state: "hidden" });

  await button("添加 Google 扩展").click();
  await button("确认添加").waitFor();
  await shot("store", dialog);
  await button("取消").last().click();
  await dialog.waitFor({ state: "hidden" });

  await entry.locator("button").nth(1).click();
  const inspection = page.locator(".shield-dialog");
  await inspection.waitFor();
  await shot("inspection", dialog);
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}

async function main() {
  assert.ok(process.argv[2], "Pass the saved pre-migration extension bundle");
  const code = await fs.readFile(process.argv[2], "utf8");
  const tableCode = await fs.readFile(path.join(path.dirname(process.argv[2]), tableAsset), "utf8");
  const data = await createTestDirectory("extensions-visual-");
  const viewports = [{ width: 1448, height: 960 }, { width: 1914, height: 1280 }];
  const result = { passed: false, viewports, reference: createHash("sha256").update(code).digest("hex"),
    tableReference: createHash("sha256").update(tableCode).digest("hex"),
    errors: [], external: [], cases: [] };
  let app;
  try {
    const fixture = path.join(data, "fixture");
    await fs.mkdir(fixture);
    await fs.writeFile(path.join(fixture, "manifest.json"), JSON.stringify({
      manifest_version: 3, version: "1.0", name: "本地扩展对照",
    }));
    app = await launchVisualApp(appRoot, data, "");
    const page = await app.firstWindow();
    await disableReferenceCache(page);
    await page.setViewportSize(viewports[0]);
    page.setDefaultTimeout(10000);
    page.on("pageerror", error => result.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") result.errors.push(message.text()); });
    page.on("request", request => { if (/^https?:|^wss?:/.test(request.url())) result.external.push(request.url()); });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    await app.evaluate(({ dialog }, fixture) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [fixture] });
    }, fixture);
    await page.evaluate(async () => {
      const call = globalThis.__localRequest;
      const { data } = await call("extensions:select", { kind: "dir" });
      const { localToken } = await call("extensions:stage", { pluginPath: data.pluginPath });
      await call("extensions:finish", { localToken, pluginName: data.pluginName });
    });
    await installReference(app, {
      [routeAsset]: `export { t as default } from './${baselineAsset}';`,
      [baselineAsset]: code,
      [tableAsset]: tableCode,
    });
    for (const viewport of viewports) {
      const reference = new Map();
      const resolution = viewport.width + "x" + viewport.height;
      await page.setViewportSize(viewport);
      await switchReferenceMode(app, true);
      for (const theme of ["light", "dark"])
        await capture(page, theme, "reference-" + resolution, (id, file) => { reference.set(id, file); });
      await switchReferenceMode(app, false);
      for (const theme of ["light", "dark"]) {
        await capture(page, theme, "source-" + resolution, (id, file) => {
          const previous = reference.get(id);
          const diff = id + "-diff-" + resolution + ".png";
          assert.ok(previous, id);
          const pixels = JSON.parse(execFileSync("python3", [
            comparator, ...[previous, file, diff].map(name => path.join(output, name)),
          ], { encoding: "utf8" }));
          result.cases.push({ id, viewport: resolution, reference: previous, source: file, diff, ...pixels });
        });
      }
      assert.equal(result.cases.filter(item => item.viewport === resolution).length, reference.size);
    }
    result.referenceRequests = await readReferenceRequests(app);
    result.sourceRequests = await readSourceRequests(app);
    for (const asset of [routeAsset, baselineAsset, tableAsset]) assert.ok(result.referenceRequests.includes(asset), asset);
    for (const asset of [routeAsset, tableAsset]) assert.ok(result.sourceRequests.includes(asset), asset);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.external, []);
    assert.deepEqual(result.cases.filter(item => !item.equal).map(item => item.id), []);
    result.passed = true;
  } catch (error) {
    result.failure = error.stack;
    throw error;
  } finally {
    await app?.close();
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
    await fs.writeFile(path.join(output, "report.json"), JSON.stringify(result, null, 2) + "\n");
  }
  console.log("EXTENSIONS SOURCE VISUAL OK", result.cases.length, "pixel-exact comparisons");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
