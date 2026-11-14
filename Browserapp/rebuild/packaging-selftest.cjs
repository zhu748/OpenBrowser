"use strict";
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
    assert.equal(
      typeof requirePackaged("cron-parser").CronExpressionParser.parse,
      "function",
    );
    for (const file of [
      "roxy-ui/index.html",
      "rebuild/protocol.js",
      "rebuild/local-service.js",
      "rebuild/agent-service.js",
      "rebuild/skills/roxybrowser-openapi-skills/SKILL.md",
    ]) {
      assert.equal(isRuntimeResource(file), true, file);
      assert.ok(fs.existsSync(path.join(source, file)), file);
    }
    for (const file of [
      "rebuild/compiler/build.cjs",
      "rebuild/agent-selftest.cjs",
      "rebuild/acceptance-runner.cjs",
      "rebuild/acceptance-manifest.json",
      "rebuild/verify-evidence.cjs",
      "rebuild/visual-pixel-diff.py",
      "rebuild/build-evidence-gallery.cjs",
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
    assert.deepEqual(errors, []);
    assert.deepEqual(externalRequests, []);
    await app.close();
    app = null;
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
        "directory boot excludes user-installed kernel binaries; it is not an installer test",
        "unexpected development dependency rejected",
      ],
    };
    fs.writeFileSync(
      path.resolve(source, "../docs/rebuild/evidence/packaging-selftest.json"),
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
