"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { simple } = require("acorn-walk");
const { evidencePath } = require("./evidence-path.cjs");

const app = path.resolve(__dirname, "../..");
const applicationGlobals = new Set(["electronAPI", "__localApi", "__localAgentApi", "__localRequest", "__localSettings"]);
const programReference = value => typeof value === "string" && /^\/assets\/.+\.js$/.test(value);

function stylesheetSource(asset, manifest, reviewedVendor) {
  const source = manifest[asset];
  if (typeof source === "string") return { asset, sources: [source] };
  const component = manifest[asset.replace(/\.css$/, ".js")];
  if (component?.source?.endsWith(".vue")) return { asset, sources: [component.source] };
  if (asset === "assets/workbench-chrome.css") {
    return { asset, sources: ["frontend/workbench-chrome-theme.css", "rebuild/workbench-chrome.css"] };
  }
  const dependency = reviewedVendor.has(path.basename(asset)) && fs.existsSync(path.join(app, "frontend/workbench", asset));
  return { asset, dependency };
}

function sourceSignals({ ast, translates }) {
  const signals = new Set();
  if (translates) signals.add("workbench-translation");
  simple(ast, {
    Property(node) {
      const key = node.key.name ?? node.key.value;
      if (key === "__name") signals.add("named-vue-component");
      if (key === "setup" && /Function/.test(node.value.type)) signals.add("vue-setup-function");
    },
    MemberExpression(node) {
      if (["window", "globalThis", "self"].includes(node.object.name) && applicationGlobals.has(node.property.name ?? node.property.value)) {
        signals.add("workbench-runtime-global");
      }
    },
  });
  return [...signals].sort();
}

function writeSourceProvenance({ root, modules, resolve }) {
  const manifest = JSON.parse(fs.readFileSync(path.join(app, "frontend/workbench-entries.json"), "utf8"));
  const reviewedVendor = new Set(JSON.parse(fs.readFileSync(path.join(app, "frontend/workbench-vendor-modules.json"), "utf8")));
  const unclassifiedCopiedAssets = fs.readdirSync(path.join(app, "frontend/workbench/assets")).sort()
    .filter(filename => /\.(?:js|css|wasm)$/.test(filename) && !reviewedVendor.has(filename))
    .map(filename => "assets/" + filename);
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const entryPoints = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi), match => match[1]).filter(programReference);
  const bundleFile = path.join(root, "workbench-styles.json");
  const stylesheetBundles = fs.existsSync(bundleFile) ? JSON.parse(fs.readFileSync(bundleFile, "utf8")) : {};
  const linkedStylesheets = Array.from(html.matchAll(/<link rel="stylesheet" href="\/([^"]+)">/g), match => match[1]);
  const stylesheetSources = linkedStylesheets.flatMap(asset => stylesheetBundles[asset] || [asset])
    .map(asset => stylesheetSource(asset, manifest, reviewedVendor));
  const visited = new Set();
  const pending = entryPoints.map(name => path.join(root, name));
  while (pending.length) {
    const file = pending.pop();
    const module = modules.get(file);
    if (!module || visited.has(file)) continue;
    visited.add(file);
    for (const { source } of module.imports) pending.push(resolve(file, source));
    pending.push(...module.stars);
  }
  const mapped = [];
  const icons = [];
  const copied = [];
  const computedImports = [];
  const generated = [];
  for (const file of [...visited].sort()) {
    const asset = path.relative(root, file).split(path.sep).join("/");
    const module = modules.get(file);
    const entry = manifest[asset];
    const source = typeof entry === "string" ? entry : entry?.source;
    const icon = "frontend/src/workbench/icons/" + path.basename(asset, ".js") + ".svg";
    if (source?.endsWith(".svg") || (!entry && fs.existsSync(path.join(app, icon)))) {
      icons.push({ asset, source: source || icon });
    } else if (entry) mapped.push({ asset, source });
    else if (fs.existsSync(path.join(app, "frontend/workbench", asset))) {
      copied.push({ asset, signals: sourceSignals(module) });
    } else generated.push(asset);
    if (module.computedImports.length) computedImports.push({ asset, lines: module.computedImports });
  }
  const report = {
    entryPoints,
    reachableModules: visited.size,
    manifestModules: mapped.length,
    iconModules: icons.length,
    iconSources: icons,
    copiedModules: copied.length,
    unclassifiedCopiedAssets,
    copiedModulesWithSourceSignals: copied.filter(module => module.signals.length > 0),
    copiedAssets: copied.map(module => module.asset),
    generatedAssets: generated,
    computedImports,
    stylesheetBundles,
    stylesheetSources,
    unclassifiedStylesheets: stylesheetSources.filter(style => !style.sources && !style.dependency).map(style => style.asset),
  };
  fs.writeFileSync(evidencePath("workbench-source-provenance.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}

module.exports = { writeSourceProvenance };
