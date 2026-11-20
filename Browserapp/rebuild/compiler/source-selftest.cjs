"use strict";
const { evidencePath } = require("./evidence-path.cjs");

const fs = require("node:fs"), path = require("node:path"), os = require("node:os"),
  assert = require("node:assert/strict"), crypto = require("node:crypto"), { spawnSync } = require("node:child_process");
const { isRuntimeResource } = require("../../scripts/runtime-manifest.js"),
  repo = path.resolve(__dirname, "../../.."), temporary = fs.mkdtempSync(path.join(os.tmpdir(), "ob-build-input-")),
  result = { passed: false, checks: [], failures: [] };
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function filesUnder(root, directory = root) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.sort((left, right) => left.name.localeCompare(right.name)).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(root, file) : [[path.relative(root, file), hash(file)]];
  });
}
function check(name, operation) {
  try { operation(); result.checks.push(name); }
  catch (error) { result.failures.push({ name, error: error.stack }); }
}
try {
  check("工作区不含归档构建入口或补丁模块", () => {
    const compiler = path.join(repo, "Browserapp/rebuild/compiler");
    const retired = fs.readdirSync(compiler).filter(name =>
      /^(?:vendor$|build\.cjs$|source\.cjs$|source-manifest\.json$|patch-)/.test(name));
    assert.deepEqual(retired, []);
  });
  check("默认工作台在没有旧产物、原始归档和补丁脚本的目录可复现", () => {
    const current = path.join(repo, "Browserapp");
    const app = path.join(temporary, "default", "Browserapp");
    const compilerTools = new Set([
      "evidence-path.cjs", "link-audit.cjs", "ui-audit.cjs", "audit.cjs",
      "channel-audit.cjs", "backend-contract-audit.cjs", "workbench-source-provenance.cjs",
    ]);
    fs.cpSync(current, app, { recursive: true, filter(file) {
      const rel = path.relative(current, file).split(path.sep).join("/");
      if (!rel || rel === "rebuild/compiler") return true;
      if (rel.startsWith("rebuild/compiler/")) return compilerTools.has(path.basename(rel));
      const top = rel.split("/")[0];
      if (["roxy-ui", "kernels", "node_modules"].includes(top)) return false;
      if (top === "frontend") return rel !== "frontend/dist" && !rel.startsWith("frontend/dist/");
      return isRuntimeResource(rel);
    } });
    fs.symlinkSync(path.join(current, "node_modules"), path.join(app, "node_modules"),
      process.platform === "win32" ? "junction" : "dir");
    const built = path.join(app, "roxy-ui");
    assert.ok(!fs.existsSync(built) && !fs.existsSync(path.join(app, "rebuild/compiler/vendor")));
    const env = { ...process.env,
      OPENBROWSER_EVIDENCE_DIR: path.join(temporary, "default-evidence") };
    const build = () => spawnSync(process.execPath, [path.join(app, "frontend/build-workbench.cjs")],
      { cwd: temporary, env, encoding: "utf8" });
    const isolated = build();
    assert.equal(isolated.status, 0, isolated.error?.message || isolated.stderr);
    const snapshot = filesUnder(built);
    assert.deepEqual(snapshot, filesUnder(path.join(current, "roxy-ui")));
    assert.equal(isRuntimeResource("frontend/workbench/index.html"), false);

    const unmanagedJs = path.join(app, "frontend/workbench/assets/unmanaged-fixture.js");
    const unmanagedCss = path.join(app, "frontend/workbench/assets/unmanaged-fixture.css");
    fs.writeFileSync(unmanagedJs, "export default null;");
    fs.writeFileSync(unmanagedCss, "body { color: red; }");
    const rejected = build();
    assert.notEqual(rejected.status, 0);
    assert.match(rejected.stdout, /copied asset must have maintained source or be a reviewed dependency/);
    assert.match(rejected.stdout, /unmanaged-fixture\.js/);
    assert.match(rejected.stdout, /unmanaged-fixture\.css/);
    assert.deepEqual(filesUnder(built), snapshot);
    fs.unlinkSync(unmanagedJs);
    fs.unlinkSync(unmanagedCss);

    fs.writeFileSync(path.join(app, "frontend/workbench/assets/bootstrap.js"), "throw Error('duplicate');");
    const collision = build();
    assert.notEqual(collision.status, 0);
    assert.match(collision.stderr, /EEXIST/);
    assert.deepEqual(filesUnder(built), snapshot);
    assert.ok(!fs.existsSync(built + ".build.lock"));
  });
  check("源码工作台能在没有归档或旧界面的目录独立编译", () => {
    const app = path.join(temporary, "source-renderer"), frontend = path.join(app, "frontend");
    const input = path.join(repo, "Browserapp/frontend");
    const dependencies = path.join(repo, "Browserapp/node_modules");
    fs.mkdirSync(frontend, { recursive: true });
    fs.cpSync(path.join(input, "src"), path.join(frontend, "src"), { recursive: true });
    fs.copyFileSync(path.join(input, "build.mjs"), path.join(frontend, "build.mjs"));
    fs.copyFileSync(path.join(input, "index.html"), path.join(frontend, "index.html"));
    fs.symlinkSync(dependencies, path.join(app, "node_modules"), process.platform === "win32" ? "junction" : "dir");
    const standalone = spawnSync(process.execPath, [path.join(frontend, "build.mjs")], {
      cwd: app, env: process.env, encoding: "utf8",
    });
    assert.equal(standalone.status, 0, standalone.error?.message || standalone.stderr);
    const dist = path.join(frontend, "dist");
    const files = fs.readdirSync(dist).sort();
    for (const entry of ["index.html", "workbench.js", "templates.js", "kernels.js", "management.js", "VUE-LICENSE.txt"])
      assert.ok(files.includes(entry), entry);
    for (const [entry, symbol] of [["templates.js", "mountTemplates"], ["kernels.js", "mountKernels"], ["management.js", "mountManagement"]]) {
      const { body } = require("acorn").parse(fs.readFileSync(path.join(dist, entry), "utf8"), { ecmaVersion: "latest", sourceType: "module" });
      assert.ok(body.some(node => node.type === "ExportNamedDeclaration"
        && (node.declaration?.id?.name === symbol || node.specifiers.some(specifier => specifier.exported.name === symbol))), symbol);
    }
    assert.deepEqual(fs.readdirSync(path.join(repo, "Browserapp/roxy-ui/source-frontend")).sort(), files);
    for (const name of files) {
      const built = "roxy-ui/source-frontend/" + name;
      assert.equal(isRuntimeResource(built), true);
      assert.equal(hash(path.join(repo, "Browserapp", built)), hash(path.join(dist, name)));
    }
    assert.equal(isRuntimeResource("frontend/src/templates/TemplatesPage.vue"), false);
  });
  result.testSha256 = hash(__filename);
  result.passed = result.failures.length === 0;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
  fs.writeFileSync(evidencePath("build-source-selftest.json"), JSON.stringify(result, null, 2));
}
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
