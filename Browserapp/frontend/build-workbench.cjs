"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { parseArgs } = require("node:util");
const { setTimeout: delay } = require("node:timers/promises");
const { parseExpressionAt } = require("acorn");
const { evidencePath } = require("../rebuild/compiler/evidence-path.cjs");
const { compileWorkbenchComponent, compileWorkbenchIcon } = require("./compile-workbench-component.cjs");

const app = path.resolve(__dirname, "..");
const repo = path.dirname(app);
const compiler = path.join(app, "rebuild/compiler");
const { values } = parseArgs({ options: { "out-dir": { type: "string" }, "if-needed": { type: "boolean" }, dev: { type: "boolean" } } });
const devBuild = Boolean(values.dev) && process.env.OPENBROWSER_RENDERER !== "source";
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
  // Bounded subprocesses: assemble() chains 5 audit compilers, and a hung
  // child (file lock, wedged CI runner) used to hang `npm start` forever —
  // the first step of which is rebuild:ui --if-needed. The 32MB maxBuffer
  // also prevents the default 1MB cap from ENOBUFS-killing audits that dump
  // large link inventories.
  const child = spawnSync(process.execPath, [file, ...args], {
    cwd: repo, env, encoding: "utf8",
    timeout: 10 * 60 * 1000, maxBuffer: 32 * 1024 * 1024,
  });
  if (child.error) throw child.error;
  if (child.status !== 0) {
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    throw Error(path.basename(file) + " failed: " + (child.signal || child.status));
  }
}

function bundleStylesheets(destination, html) {
  const link = '<link rel="stylesheet" href="/(assets/[^"]+\\.css)">';
  const bundles = {};
  const output = html.replace(new RegExp(`(?:${link}\\s*){2,}`, "g"), group => {
    const assets = Array.from(group.matchAll(new RegExp(link, "g")), match => match[1]);
    const styles = assets.map(asset => fs.readFileSync(path.join(destination, asset), "utf8"));
    // Rules that depend on the start of a sheet must keep their own sheet.
    if (styles.some(style => /@(?:charset|import|namespace)\b/i.test(style))) return group;
    const bundle = `assets/workbench-styles-${Object.keys(bundles).length + 1}.css`;
    // All inputs and the bundle live in /assets, so relative URLs stay valid.
    fs.writeFileSync(path.join(destination, bundle), styles.join("\n") + "\n", { flag: "wx" });
    bundles[bundle] = assets;
    return `<link rel="stylesheet" href="/${bundle}">\n`;
  });
  fs.writeFileSync(path.join(destination, "workbench-styles.json"), JSON.stringify(bundles));
  return output;
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
  const chromeStyles = ["frontend/workbench-chrome-theme.css", "rebuild/workbench-chrome.css"]
    .map(file => fs.readFileSync(path.join(app, file), "utf8").trimEnd());
  fs.writeFileSync(path.join(destination, "assets/workbench-chrome.css"), chromeStyles.join("\n") + "\n", { flag: "wx" });
  const html = fs.readFileSync(index, "utf8").replace("</head>", componentStyles.join("\n") + "\n</head>");
  fs.writeFileSync(index, bundleStylesheets(destination, html));
  const env = { ...process.env, REBUILD_OUTPUT: destination };
  run(path.join(__dirname, "build.mjs"), ["--out-dir", path.join(destination, "source-frontend")], env);
  if (!devBuild) {
    for (const check of ["link-audit", "ui-audit", "audit", "channel-audit", "backend-contract-audit"]) {
      run(path.join(compiler, check + ".cjs"), [], env);
    }
  }
  const styles = [...fs.readFileSync(index, "utf8").matchAll(/<link rel="stylesheet" href="\/([^"]+)">/g)].map(match => match[1]);
  if (!styles.length) throw Error("Workbench stylesheet list is empty");
  for (const style of styles) fs.accessSync(path.join(destination, style));
  if (!devBuild) fs.writeFileSync(evidencePath("style-inventory.json"), JSON.stringify(styles, null, 2));
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
const lockPrefix = path.basename(lock) + "-";
// A contender publishes a unique PID directory before checking for peers.
// Live peers cause rejection, so even a simultaneous start can't enter publish twice.
const buildBusy = message => Object.assign(new Error(message), { code: "WORKBENCH_BUILD_BUSY" });

function processAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) return true;
  try { process.kill(pid, 0); return true; }
  catch (error) { if (error.code === "ESRCH") return false; throw error; }
}

function recoverBuilds(stage) {
  let legacyPid;
  try { legacyPid = Number(fs.readFileSync(lock, "utf8").trim()); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (legacyPid !== undefined && processAlive(legacyPid)) throw buildBusy("Workbench build lock is held: " + lock);
  const stale = [];
  for (const name of fs.readdirSync(parent)) {
    if (!name.startsWith(lockPrefix) || name === path.basename(stage)) continue;
    const pid = Number(name.slice(lockPrefix.length).split("-")[0]);
    if (processAlive(pid)) throw buildBusy("Another workbench build is running: " + pid);
    stale.push(path.join(parent, name));
  }
  for (const directory of stale) {
    const backup = path.join(directory, "previous");
    if (!fs.existsSync(output) && fs.existsSync(backup)) fs.renameSync(backup, output);
    fs.rmSync(directory, { recursive: true, force: true });
  }
  if (legacyPid !== undefined) fs.rmSync(lock, { force: true });
}

// Binary/asset inputs are copied verbatim by assemble() — their content never
// influences compilation — so stat identity (size + mtime) is sufficient for
// them and skips re-reading ~60MB of workbench assets on every
// `npm start` --if-needed. Source files still hash by content.
const STAT_IDENTITY = /\.(?:png|jpe?g|gif|webp|ico|svg|woff2?|ttf|otf|eot|mp4|webm|wasm)$/i;

function hashFiles(root, names, { statOnly = false } = {}) {
  const hash = createHash("sha256").update(`${process.version}/${process.platform}/${process.arch}\0`);
  function add(relative) {
    const file = path.join(root, relative);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(file).sort()) {
        if (relative === "frontend" && name === "dist") continue;
        add(path.join(relative, name));
      }
    } else if (statOnly || STAT_IDENTITY.test(relative)) {
      hash.update(`${relative}\0s${stat.size}\0${stat.mtimeMs}\0`);
    } else {
      hash.update(`${relative}\0${stat.size}\0`).update(fs.readFileSync(file));
    }
  }
  for (const name of names) add(name);
  return hash.digest("hex");
}

function buildInputHash() {
  return hashFiles(app, ["frontend", "rebuild", "shared", "main", "assets", "main.js", "preload.js",
    "package.json", "package-lock.json", "node_modules/fuse.js/dist/fuse.mjs"]);
}

function reuseBuild(input, stamp) {
  try {
    const cached = JSON.parse(fs.readFileSync(stamp, "utf8"));
    // The output tree is generated: its hash exists only to detect manual
    // tampering or drift, and any real write changes mtime — so stat identity
    // answers it without re-reading ~90MB of built assets per start.
    return (devBuild || cached.dev === false) && cached.input === input && cached.output === hashFiles(output, ["."], { statOnly: true });
  } catch (_) { return false; }
}

function buildOnce() {
  const stage = fs.mkdtempSync(path.join(parent, lockPrefix + process.pid + "-"));
  try {
    recoverBuilds(stage);
    if (values["out-dir"] && fs.existsSync(output)) throw Error("--out-dir must point to a new directory");
    const input = !values["out-dir"] ? buildInputHash() : null;
    const stamp = output + ".build-input.json";
    if (values["if-needed"] && input && reuseBuild(input, stamp)) {
      console.log("Reusing existing workbench build:", output);
      return;
    }
    const staged = path.join(stage, "output");
    assemble(staged);
    publish(staged, path.join(stage, "previous"));
    if (input && buildInputHash() === input) {
      const nextStamp = path.join(stage, "build-input.json");
      fs.writeFileSync(nextStamp, JSON.stringify({
        input, output: hashFiles(output, ["."], { statOnly: true }), dev: devBuild,
      }));
      fs.renameSync(nextStamp, stamp);
    }
    console.log("Built workbench from frontend sources:", output);
  } finally {
    // If restoration failed, preserve the old application for the next build.
    if (!fs.existsSync(path.join(stage, "previous")) || fs.existsSync(output)) {
      fs.rmSync(stage, { recursive: true, force: true });
    }
  }
}

async function main() {
  const deadline = performance.now() + 120_000;
  for (;;) {
    try { return buildOnce(); }
    catch (error) {
      if (error.code !== "WORKBENCH_BUILD_BUSY" || !values["if-needed"] || values["out-dir"]
          || performance.now() >= deadline) throw error;
      await delay(100 + Math.random() * 100);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
