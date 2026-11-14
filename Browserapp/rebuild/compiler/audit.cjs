"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const repo = path.resolve(__dirname, "../../..");
process.chdir(repo);
const root = process.env.REBUILD_OUTPUT || "Browserapp/roxy-ui",
  source = require("./source.cjs").resolveBuildSource();
const files = [];
function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else files.push(p);
  }
}
scan(root);
const violations = [],
  syntax = [],
  channels = [],
  network = [];
const forbidden =
  /feedback-consultant-qr|custom-template-dialog|my-templates-custom-button|custom-template-banner|openCustomTemplateDialog|pay-wall|last-pay-modal|\/user_[a-z_]+|js\.stripe\.com|api\.mixpanel\.com|\.pay\.|showPayWall|showUpgradePlanDialog|userBuyPointsSettlement|subscribe-plan|upgrade-plan|showRenewalDialog|userGetCloudBrowserInfoList|pay-metrics|lifetime-entry|userPayInfo|freeProjectCount|useProjectCount|PROJECT_MAX_LIMIT|proxyRenewMinDiscount|isDirectWhitelist/g;
for (const file of files) {
  if (!/\.(js|css|html)$/.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  const found = [...new Set(text.match(forbidden) || [])];
  if (found.length) violations.push({ file, found });
  if (file.endsWith(".js"))
    try {
      acorn.parse(text, { ecmaVersion: "latest", sourceType: "module" });
    } catch (e) {
      syntax.push({ file, error: e.message });
    }
}
const raw = path.join(source, "web/assets");
for (const file of fs.readdirSync(raw).filter((f) => f.endsWith(".js"))) {
  const text = fs.readFileSync(path.join(raw, file), "utf8");
  let ast;
  try {
    ast = acorn.parse(text, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
    });
  } catch {
    continue;
  }
  walk.simple(ast, {
    CallExpression(n) {
      const callee = text.slice(n.callee.start, n.callee.end);
      if (/electronAPI\??\.(send|invoke)$/.test(callee)) {
        const a = n.arguments[0];
        channels.push({
          file,
          line: n.loc.start.line,
          transport: callee.split(".").at(-1),
          channel: a ? text.slice(a.start, a.end) : null,
          arguments: n.arguments
            .slice(1)
            .map((v) => text.slice(v.start, v.end)),
        });
      }
      if (/(^|\.)(fetch|sendBeacon)$|ipcRenderer\.(send|invoke)$/.test(callee))
        network.push({
          file,
          line: n.loc.start.line,
          call: callee,
          argument: n.arguments[0]
            ? text.slice(n.arguments[0].start, n.arguments[0].end)
            : "",
        });
    },
  });
}
const dist = fs.readFileSync(
  path.join(source, "main/src/dist-vite/dist.mjs"),
  "utf8",
);
const endpoints = [
  ...new Set(
    [...dist.matchAll(/path:\s*[`'"](\/user_[a-z_]+)/g)].map((m) => m[1]),
  ),
].sort();
const result = {
  status: violations.length || syntax.length ? "FAIL" : "PASS",
  files: files.length,
  javascript: files.filter((f) => f.endsWith(".js")).length,
  syntaxErrors: syntax,
  commercialMatches: violations,
  rawChannels: channels.length,
  distinctRawChannels: new Set(channels.map((c) => c.channel)).size,
  cloudEndpoints: endpoints.length,
};
fs.mkdirSync("docs/rebuild/evidence", { recursive: true });
fs.writeFileSync(
  "docs/rebuild/evidence/static-audit.json",
  JSON.stringify(result, null, 2),
);
fs.writeFileSync(
  "docs/rebuild/CHANNEL-INVENTORY.json",
  JSON.stringify({ channels, network, endpoints }, null, 2),
);
fs.writeFileSync(
  "docs/rebuild/evidence/asset-hashes.json",
  JSON.stringify(
    files.map((file) => ({
      file: path.posix.join('Browserapp/roxy-ui', path.relative(root, file).split(path.sep).join('/')),
      sha256: crypto
        .createHash("sha256")
        .update(fs.readFileSync(file))
        .digest("hex"),
    })),
    null,
    2,
  ),
);
console.log(JSON.stringify(result, null, 2));
if (result.status === "FAIL") process.exitCode = 1;
