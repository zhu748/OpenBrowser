"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const { createRequire } = require("node:module");
function packageDirectory(name, from) {
  const resolve = createRequire(path.join(from, "package.json")).resolve;
  try {
    return path.dirname(resolve(name + "/package.json"));
  } catch (error) {
    if (error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") throw error;
    let directory = path.dirname(resolve(name));
    while (directory !== path.dirname(directory)) {
      const file = path.join(directory, "package.json");
      if (
        fs.existsSync(file) &&
        JSON.parse(fs.readFileSync(file, "utf8")).name === name
      )
        return directory;
      directory = path.dirname(directory);
    }
    throw Error("Cannot locate production package: " + name);
  }
}
function collectProductionDependencies(root) {
  const packages = new Map(),
    pending = [root];
  while (pending.length) {
    const from = pending.pop(),
      metadata = JSON.parse(
        fs.readFileSync(path.join(from, "package.json"), "utf8"),
      );
    for (const name of Object.keys(metadata.dependencies || {})) {
      const directory = packageDirectory(name, from),
        version = JSON.parse(
          fs.readFileSync(path.join(directory, "package.json"), "utf8"),
        ).version;
      if (packages.has(name)) {
        if (packages.get(name).version !== version)
          throw Error("Production dependency version conflict: " + name);
        continue;
      }
      packages.set(name, { name, version, directory });
      pending.push(directory);
    }
  }
  return packages;
}
function copyProductionDependencies(source, destination) {
  const packages = collectProductionDependencies(source);
  for (const { name, directory } of packages.values())
    fs.cpSync(directory, path.join(destination, "node_modules", name), {
      recursive: true,
      dereference: true,
      filter: (file) =>
        file === directory ||
        !path
          .relative(directory, file)
          .split(path.sep)
          .includes("node_modules"),
    });
  return [...packages.keys()].sort();
}
function assertProductionDependencies(root) {
  const packages = collectProductionDependencies(root),
    modules = path.join(root, "node_modules");
  const expected = new Set(packages.keys()),
    actual = [];
  for (const entry of fs.readdirSync(modules, { withFileTypes: true })) {
    if (entry.name.startsWith("@"))
      for (const item of fs.readdirSync(path.join(modules, entry.name)))
        actual.push(entry.name + "/" + item);
    else actual.push(entry.name);
  }
  for (const name of actual)
    if (!expected.has(name))
      throw Error("[package] Non-production dependency: " + name);
  for (const { name, directory } of packages.values())
    if (
      !fs
        .realpathSync(directory)
        .startsWith(fs.realpathSync(modules) + path.sep)
    )
      throw Error("[package] Dependency resolved outside the package: " + name);
}
module.exports = {
  collectProductionDependencies,
  copyProductionDependencies,
  assertProductionDependencies,
};
