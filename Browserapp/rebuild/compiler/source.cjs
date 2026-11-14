"use strict";
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const manifest = require("./source-manifest.json");
const bundledRoot = path.join(__dirname, "vendor/roxy-ui");
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function verifySource(root) {
  if (manifest.version !== 1 || manifest.files.length !== manifest.snapshot.files)
    throw Error("不支持或不完整的构建输入清单");
  root = path.resolve(root);
  if (!fs.existsSync(root)) throw Error("构建输入目录不存在: " + root);
  if (fs.lstatSync(root).isSymbolicLink() || !fs.statSync(root).isDirectory())
    throw Error("构建输入根目录必须是实际目录: " + root);
  const actual = [];
  for (const entry of manifest.files) {
    if (!entry.file || entry.file.includes("\\") || entry.file.split("/").some(segment => !segment || segment === "." || segment === "..") || path.isAbsolute(entry.file))
      throw Error("非法构建输入路径");
    let file = root;
    for (const segment of entry.file.split("/")) {
      file = path.join(file, segment);
      if (!fs.existsSync(file)) throw Error("缺少构建输入: " + entry.file);
      if (fs.lstatSync(file).isSymbolicLink()) throw Error("构建输入不允许符号链接: " + entry.file);
    }
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size !== entry.bytes)
      throw Error("构建输入大小不一致: " + entry.file);
    const hash = sha256(fs.readFileSync(file));
    if (hash !== entry.sha256) throw Error("构建输入 SHA256 不一致: " + entry.file);
    actual.push([entry.file, hash]);
  }
  const web = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw Error("构建输入不允许符号链接: " + file);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) web.push(path.relative(root, file).split(path.sep).join("/"));
      else throw Error("构建输入必须是普通文件: " + file);
    }
  }
  visit(path.join(root, "web"));
  if (JSON.stringify(web.sort()) !== JSON.stringify(manifest.files.filter(entry => entry.file.startsWith("web/")).map(entry => entry.file).sort()))
    throw Error("web 构建输入文件清单不一致");
  if (sha256(JSON.stringify(actual)) !== manifest.snapshot.sha256)
    throw Error("构建输入总摘要不一致");
  return { root, snapshot: manifest.snapshot };
}
function resolveBuildSource(environment = process.env) {
  return verifySource(environment.ROXY_SOURCE || bundledRoot).root;
}
module.exports = { resolveBuildSource, verifySource, bundledRoot, manifest };
