"use strict";
const { evidencePath } = require("./evidence-path.cjs");

const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  acorn = require("acorn");
const repo = path.resolve(__dirname, "../../..");
process.chdir(repo);
const root = process.env.REBUILD_OUTPUT || "Browserapp/roxy-ui";
const files = [];
function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else files.push(p);
  }
}
scan(root);
const violations = [], syntax = [];
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
const result = {
  status: violations.length || syntax.length ? "FAIL" : "PASS",
  files: files.length,
  javascript: files.filter((f) => f.endsWith(".js")).length,
  syntaxErrors: syntax,
  commercialMatches: violations,
  scope: "runtime",
};
fs.writeFileSync(
  evidencePath("static-audit.json"),
  JSON.stringify(result, null, 2),
);
fs.writeFileSync(
  evidencePath("asset-hashes.json"),
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
