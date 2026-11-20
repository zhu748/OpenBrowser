"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { parseArgs } = require("node:util");
const { parseExpressionAt } = require("acorn");
const { evidencePath } = require("../rebuild/compiler/evidence-path.cjs");
const { compileWorkbenchComponent, compileWorkbenchIcon } = require("./compile-workbench-component.cjs");

const app = path.resolve(__dirname, "..");
const repo = path.dirname(app);
const compiler = path.join(app, "rebuild/compiler");
const { values } = parseArgs({ options: { "out-dir": { type: "string" } } });
const output = values["out-dir"] ? path.resolve(values["out-dir"]) : path.join(app, "roxy-ui");
const parent = path.dirname(output);
const iconDirectory = "frontend/src/workbench/icons";
const entries = readEntries();

function readEntries() {
  const manifest = fs.readFileSync(path.join(__dirname, "workbench-entries.json"), "utf8");
  const mappings = JSON.parse(manifest);
  const names = new Set();
  for (const { key } of parseExpressionAt(manifest, 0, { ecmaVersion: "latest" }).properties) {
    if (names.has(key.value)) throw Error("Duplicate workbench asset " + key.value);
    names.add(key.value);
  }
  for (const filename of fs.readdirSync(path.join(app, iconDirectory)).sort()) {
    if (filename.endsWith(".svg")) {
      const asset = "assets/" + path.basename(filename, ".svg") + ".js";
      mappings[asset] ??= { source: iconDirectory + "/" + filename };
    }
  }
  return mappings;
}

function run(file, args, env) {
  const child = spawnSync(process.execPath, [file, ...args], { cwd: repo, env, encoding: "utf8" });
  if (child.error) throw child.error;
  if (child.status !== 0) {
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    throw Error(path.basename(file) + " failed: " + (child.signal || child.status));
  }
}

function assemble(destination) {
  fs.cpSync(path.join(__dirname, "workbench"), destination, { recursive: true });
  const componentStyles = [];
  for (const [asset, entry] of Object.entries(entries)) {
    // A recovered module has exactly one maintained source.
    const target = path.join(destination, asset);
    if (typeof entry === "string") {
      fs.copyFileSync(path.join(app, entry), target, fs.constants.COPYFILE_EXCL);
      continue;
    }
    const { source: filename } = entry;
    const source = fs.readFileSync(path.join(app, filename), "utf8");
    const compile = filename.endsWith(".svg") ? compileWorkbenchIcon : compileWorkbenchComponent;
    const { code, css } = compile({ ...entry, source, filename });
    fs.writeFileSync(target, code, { flag: "wx" });
    if (css.trim()) {
      const stylesheet = asset.replace(/\.js$/, ".css");
      fs.writeFileSync(path.join(destination, stylesheet), css, { flag: "wx" });
      componentStyles.push(`<link rel="stylesheet" href="/${stylesheet}">`);
    }
  }
  const index = path.join(destination, "index.html");
  if (componentStyles.length) {
    const html = fs.readFileSync(index, "utf8");
    fs.writeFileSync(index, html.replace("</head>", componentStyles.join("\n") + "\n</head>"));
  }
  const chromeStyles = ["frontend/workbench-chrome-theme.css", "rebuild/workbench-chrome.css"]
    .map(file => fs.readFileSync(path.join(app, file), "utf8").trimEnd());
  fs.writeFileSync(path.join(destination, "assets/workbench-chrome.css"), chromeStyles.join("\n") + "\n", { flag: "wx" });
  const env = { ...process.env, REBUILD_OUTPUT: destination };
  run(path.join(__dirname, "build.mjs"), ["--out-dir", path.join(destination, "source-frontend")], env);
  for (const check of ["link-audit", "ui-audit", "audit", "channel-audit", "backend-contract-audit"]) {
    run(path.join(compiler, check + ".cjs"), [], env);
  }
  const html = fs.readFileSync(path.join(destination, "index.html"), "utf8");
  const styles = [...html.matchAll(/<link rel="stylesheet" href="\/([^"]+)">/g)].map(match => match[1]);
  if (!styles.length) throw Error("Workbench stylesheet list is empty");
  for (const style of styles) fs.accessSync(path.join(destination, style));
  fs.writeFileSync(evidencePath("style-inventory.json"), JSON.stringify(styles, null, 2));
}

function publish(staged, backup) {
  const previous = fs.existsSync(output);
  if (previous) fs.renameSync(output, backup);
  try {
    fs.renameSync(staged, output);
  } catch (error) {
    if (previous) fs.renameSync(backup, output);
    throw error;
  }
}

fs.mkdirSync(parent, { recursive: true });
const lock = output + ".build.lock";
const fd = fs.openSync(lock, "wx");
let stage;
try {
  fs.writeFileSync(fd, String(process.pid));
  if (values["out-dir"] && fs.existsSync(output)) throw Error("--out-dir must point to a new directory");
  stage = fs.mkdtempSync(path.join(parent, ".workbench-build-"));
  const staged = path.join(stage, "output");
  assemble(staged);
  publish(staged, path.join(stage, "previous"));
  console.log("Built workbench from frontend sources:", output);
} finally {
  try {
    // If restoration failed, preserve the old application in the staging directory.
    if (stage && (!fs.existsSync(path.join(stage, "previous")) || fs.existsSync(output))) {
      fs.rmSync(stage, { recursive: true, force: true });
    }
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}
