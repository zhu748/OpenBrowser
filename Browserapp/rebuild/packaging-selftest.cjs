"use strict";
const { evidencePath } = require("./compiler/evidence-path.cjs");

const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const {
  copyProductionDependencies,
  assertProductionDependencies,
} = require("../main/production-dependencies");
const {
  isRuntimeResource,
  assertRuntimeResourceTree,
} = require("../scripts/runtime-manifest");
const { _electron: electron } = require("playwright");
const { exerciseSourceWorkbench } = require("./source-workbench-ui-selftest.cjs");
const source = path.resolve(__dirname, ".."),
  root = fs.mkdtempSync(path.join(os.tmpdir(), "ob-rebuild-package-"));
async function main() {
  let app;
  try {
    fs.copyFileSync(
      path.join(source, "package.json"),
      path.join(root, "package.json"),
    );
    const packages = copyProductionDependencies(source, root);
    assertProductionDependencies(root);
    const requirePackaged = createRequire(path.join(root, "package.json"));
    assert.equal(
      typeof requirePackaged("playwright").chromium.connectOverCDP,
      "function",
    );
    assert.equal(typeof requirePackaged("yauzl").open, "function");
    assert.equal(typeof requirePackaged("acorn").parse, "function");
    assert.equal(typeof requirePackaged("quickjs-emscripten-core").newQuickJSWASMModuleFromVariant, "function");
    assert.equal(
      typeof requirePackaged("cron-parser").CronExpressionParser.parse,
      "function",
    );
    for (const file of [
      "roxy-ui/index.html",
      "roxy-ui/source-frontend/templates.js",
      "roxy-ui/source-frontend/index.html",
      "roxy-ui/source-frontend/kernels.js",
      "roxy-ui/source-frontend/management.js",
      "roxy-ui/source-frontend/VUE-LICENSE.txt",
      "rebuild/protocol.js",
      "rebuild/local-service.js",
      "rebuild/agent-service.js",
      "rebuild/skills/roxybrowser-openapi-skills/SKILL.md",
    ]) {
      assert.equal(isRuntimeResource(file), true, file);
      assert.ok(fs.existsSync(path.join(source, file)), file);
    }
    for (const file of [
      "frontend/src/templates/TemplatesPage.vue",
      "rebuild/compiler/source-selftest.cjs",
      "rebuild/agent-selftest.cjs",
      "rebuild/acceptance-runner.cjs",
      "rebuild/acceptance-manifest.json",
      "rebuild/verify-evidence.cjs",
      "rebuild/visual-pixel-diff.py",
    ])
      assert.equal(isRuntimeResource(file), false, file);
    // Exercise the same runtime filter against real files, not invented paths.
    // Kernel binaries are user-installed resources and deliberately excluded from
    // this directory boot check; real Chrome/Firefox have separate process tests.
    fs.cpSync(source, root, {
      recursive: true,
      filter: (file) => {
        if (file === source) return true;
        const relative = path.relative(source, file).split(path.sep).join("/");
        return (
          relative !== "kernels" &&
          !relative.startsWith("kernels/") &&
          isRuntimeResource(relative)
        );
      },
    });
    assertRuntimeResourceTree(root);
    const errors = [],
      externalRequests = [];
    app = await electron.launch({
      executablePath: require("electron"),
      args: [
        "--no-sandbox",
        "--ozone-platform=headless",
        "--disable-gpu",
        root,
      ],
      env: {
        ...process.env,
        OPENBROWSER_USER_DATA: path.join(root, "test-user-data"),
      },
    });
    const page = await app.firstWindow();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:|^wss?:/.test(request.url()))
        externalRequests.push(request.url());
    });
    await page.getByText("暂无窗口", { exact: true }).waitFor();
    const profiles = await page.evaluate(() =>
      globalThis.__localRequest("profiles:list"),
    );
    assert.ok(Array.isArray(profiles));
    const description = await page.evaluate(() => globalThis.__localRequest("agent:scriptSelfDescription", {
      code: 'defineMetadata({name:"Packaged script"});defineParams({type:"object"});export function main(options: object){return options}',
    }));
    assert.equal(description.metadata.name, "Packaged script");
    const packagedScript = await requirePackaged("./rebuild/agent-script-runner").runScriptWindow(null, {
      source: "export async function main(){return await Promise.resolve(42)}",
      filename: "packaged.js", schema: { type: "object" }, params: "{}",
    }, "fixture", new AbortController().signal, () => {});
    assert.equal(packagedScript, "42");
    await page.evaluate(() => globalThis.__router.push("/templates"));
    await page.getByRole("heading", { name: "已保存的模板", exact: true }).waitFor();
    await page.getByText("暂无模板", { exact: true }).waitFor();
    await page.evaluate(() => globalThis.__router.push("/extensions"));
    await page.getByRole("button", { name: "本地上传", exact: true }).waitFor();
    await page.getByRole("columnheader", { name: "扩展信息", exact: true }).waitFor();
    await page.evaluate(() => globalThis.__router.push("/extensions?renderer=source"));
    await page.locator("#extensions-title").waitFor();
    await page.getByRole("button", { name: "本地上传", exact: true }).click();
    await page.getByRole("dialog", { name: "本地上传" }).getByRole("button", { name: "选择 ZIP / CRX", exact: true }).waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
    await app.close();
    app = null;
    for (const name of fs.readdirSync(path.join(root, "roxy-ui"))) {
      if (name !== "source-frontend") fs.rmSync(path.join(root, "roxy-ui", name), { recursive: true });
    }
    await exerciseSourceWorkbench(root);
    fs.mkdirSync(path.join(root, "node_modules", "eslint"));
    assert.throws(
      () => assertProductionDependencies(root),
      /Non-production dependency/,
    );
    const evidence = {
      status: "PASS",
      packages,
      checks: [
        "production dependency closure copied",
        "packaged Playwright/CDP, ZIP and cron modules load",
        "real runtime tree copied; compiler/selftests excluded; resource tree audited",
        "copied app directory boots real Electron and renders local profiles without renderer network",
        "source workbench boots and uses native IPC with only its own renderer assets in the packaged tree",
        "directory boot excludes user-installed kernel binaries; it is not an installer test",
        "unexpected development dependency rejected",
      ],
    };
    fs.writeFileSync(
      evidencePath("packaging-selftest.json"),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await app?.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
