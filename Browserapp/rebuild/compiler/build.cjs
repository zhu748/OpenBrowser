"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const repo = path.resolve(__dirname, "../../..");
process.chdir(repo);
// All compiler steps share a staging directory. Never allow parallel builds
// to delete one another's stage or install a partially audited output.
const lock = path.join(repo, "work/rebuild/build.lock");
fs.mkdirSync(path.dirname(lock), { recursive: true });
let lockFd;
try {
  lockFd = fs.openSync(lock, "wx");
} catch (error) {
  if (error.code === "EEXIST")
    throw Error(
      "已有构建锁 " + lock + "；请先检查该文件中的 PID，确认进程结束后再清理",
    );
  throw error;
}
fs.writeFileSync(lockFd, String(process.pid));
process.on("exit", () => {
  fs.closeSync(lockFd);
  fs.rmSync(lock, { force: true });
});

const src = process.env.ROXY_SOURCE || "/workspace/roxy-src";
if (!fs.existsSync(path.join(src, "web/index.html")))
  throw Error("Missing ROXY_SOURCE/web/index.html");
function countFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .reduce(
      (sum, item) =>
        sum + (item.isDirectory() ? countFiles(path.join(dir, item.name)) : 1),
      0,
    );
}
const archive = {
  total: countFiles(src),
  web: countFiles(path.join(src, "web")),
  main: countFiles(path.join(src, "main")),
  agent: countFiles(path.join(src, "agent")),
  tools: countFiles(path.join(src, "tools")),
  javascript: fs
    .readdirSync(path.join(src, "web/assets"))
    .filter((file) => file.endsWith(".js")).length,
};
if (
  archive.total !== 2063 ||
  archive.web !== 1874 ||
  archive.main !== 113 ||
  archive.agent !== 71 ||
  archive.tools !== 3 ||
  archive.javascript !== 1162
)
  throw Error("归档数量校验失败: " + JSON.stringify(archive));
fs.mkdirSync(path.join(repo, "docs/rebuild/evidence"), { recursive: true });
fs.writeFileSync(
  path.join(repo, "docs/rebuild/evidence/archive-check.json"),
  JSON.stringify(archive, null, 2),
);
fs.rmSync(path.join(repo, "work/rebuild/stage"), {
  recursive: true,
  force: true,
});
const target = path.join(repo, "Browserapp/roxy-ui");
const assets = path.join(repo, "work/rebuild/output");
process.env.REBUILD_OUTPUT = assets;
// This directory is generated exclusively by this compiler.
fs.rmSync(assets, { recursive: true, force: true });
for (const step of [
  "prepare.cjs",
  "patch-local.cjs",
  "patch-workbench.cjs",
  "patch-extensions.cjs",
  "patch-host.cjs",
  "patch-api.cjs",
  "patch-profile-menu.cjs",
  "patch-projects.cjs",
  "patch-mcp.cjs",
  "commerce.cjs",
  "offline-boundaries.cjs",
  "slice.cjs",
]) {
  const result = spawnSync(process.execPath, [path.join(__dirname, step)], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
const stage = path.join(repo, "work/rebuild/stage");
function copyResources(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const from = path.join(dir, d.name),
      to = path.join(assets, path.relative(stage, from));
    if (d.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyResources(from);
    } else if (!from.endsWith(".js") && d.name !== "index.html") {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  }
}
copyResources(stage);
const result = spawnSync(
  process.execPath,
  [path.join(__dirname, "resources.cjs")],
  {
    stdio: "inherit",
    env: process.env,
  },
);
if (result.status) process.exit(result.status);
for (const step of [
  "purge-resources.cjs",
  "link-audit.cjs",
  "ui-audit.cjs",
  "audit.cjs",
  "channel-audit.cjs",
  "backend-contract-audit.cjs",
]) {
  const result = spawnSync(process.execPath, [path.join(__dirname, step)], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
const backup = target + ".previous";
fs.rmSync(backup, { recursive: true, force: true });
if (fs.existsSync(target)) fs.renameSync(target, backup);
try {
  fs.renameSync(assets, target);
} catch (error) {
  if (fs.existsSync(backup)) fs.renameSync(backup, target);
  throw error;
}
fs.rmSync(backup, { recursive: true, force: true });
console.log("Validated local UI installed");
