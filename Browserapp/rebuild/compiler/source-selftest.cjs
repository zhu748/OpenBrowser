"use strict";
const fs = require("node:fs"), path = require("node:path"), os = require("node:os"),
  assert = require("node:assert/strict"), crypto = require("node:crypto"), { spawnSync } = require("node:child_process");
const { resolveBuildSource, verifySource, bundledRoot, manifest } = require("./source.cjs");
const { runtimeSnapshot } = require("./runtime-snapshot.cjs"),
  { isRuntimeResource } = require("../../scripts/runtime-manifest.js"),
  repo = path.resolve(__dirname, "../../.."), temporary = fs.mkdtempSync(path.join(os.tmpdir(), "ob-build-input-")),
  result = { passed: false, checks: [], failures: [] };
const hash = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function check(name, operation) {
  try { operation(); result.checks.push(name); }
  catch (error) { result.failures.push({ name, error: error.stack }); }
}
try {
  check("默认输入来自仓库，1875 文件逐一校验，不需要原始五卷目录", () => {
    assert.equal(resolveBuildSource({}), bundledRoot);
    assert.equal(manifest.files.length, 1875);
    assert.equal(manifest.files.filter(entry => /^web\/assets\/.+\.js$/.test(entry.file)).length, 1162);
  });
  check("从其他工作目录调用仍解析同一仓库输入", () => {
    const child = spawnSync(process.execPath, ["-e", "process.chdir(process.argv[1]);console.log(require(process.argv[2]).resolveBuildSource({}))", temporary, path.join(__dirname, "source.cjs")], { encoding: "utf8" });
    assert.equal(child.status, 0, child.stderr); assert.equal(child.stdout.trim(), bundledRoot);
  });
  check("原始输入和全部编译器不进入生产资源树", () => {
    for (const entry of manifest.files)
      assert.equal(isRuntimeResource("rebuild/compiler/vendor/roxy-ui/" + entry.file), false);
  });
  const fixture = path.join(temporary, "source");
  fs.cpSync(bundledRoot, fixture, { recursive: true });
  const file = path.join(fixture, "web/index.html"), bytes = fs.readFileSync(file);
  check("显式完整输入覆盖仍可校验", () => assert.equal(resolveBuildSource({ ROXY_SOURCE: fixture }), fixture));
  check("显式缺失目录拒绝，不静默改用默认输入", () => assert.throws(() => resolveBuildSource({ ROXY_SOURCE: path.join(temporary, "missing") }), /目录不存在/));
  check("同长度字节篡改被 SHA256 拒绝", () => {
    const changed = Buffer.from(bytes); changed[0] ^= 1; fs.writeFileSync(file, changed);
    try { assert.throws(() => verifySource(fixture), /SHA256 不一致/); }
    finally { fs.writeFileSync(file, bytes); }
  });
  check("缺文件拒绝，不能只靠总数量判断", () => {
    fs.renameSync(file, file + ".held");
    try { assert.throws(() => verifySource(fixture), /缺少构建输入/); }
    finally { fs.renameSync(file + ".held", file); }
  });
  check("额外 JS 文件拒绝，防止未知模块混入复制树", () => {
    const extra = path.join(fixture, "web/assets/untracked-injected.js"); fs.writeFileSync(extra, "export const injected=true");
    try { assert.throws(() => verifySource(fixture), /文件清单不一致/); }
    finally { fs.rmSync(extra); }
  });
  check("符号链接即使内容相同也拒绝", () => {
    const target = path.join(temporary, "index.html"); fs.writeFileSync(target, bytes); fs.rmSync(file); fs.symlinkSync(target, file);
    try { assert.throws(() => verifySource(fixture), /符号链接/); }
    finally { fs.rmSync(file); fs.writeFileSync(file, bytes); }
  });
  check("预检失败保留当前运行产物并释放构建锁", () => {
    const before = runtimeSnapshot(), changed = Buffer.from(bytes); changed[0] ^= 1; fs.writeFileSync(file, changed);
    try {
      const child = spawnSync(process.execPath, [path.join(__dirname, "build.cjs")], { cwd: repo, env: { ...process.env, ROXY_SOURCE: fixture }, encoding: "utf8" });
      assert.notEqual(child.status, 0); assert.match(child.stderr, /SHA256 不一致/);
      assert.deepEqual(runtimeSnapshot(), before); assert.equal(fs.existsSync(path.join(repo, "work/rebuild/build.lock")), false);
    } finally { fs.writeFileSync(file, bytes); }
  });
  result.sourceSnapshot = manifest.snapshot;
  result.testSha256 = hash(__filename); result.sourceResolverSha256 = hash(path.join(__dirname, "source.cjs"));
  result.passed = result.failures.length === 0;
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
  fs.writeFileSync(path.join(repo, "docs/rebuild/evidence/build-source-selftest.json"), JSON.stringify(result, null, 2));
}
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
