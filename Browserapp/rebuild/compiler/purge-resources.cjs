"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  postcss = require("postcss");
const root = process.env.REBUILD_OUTPUT || "Browserapp/roxy-ui",
  removed = [];
const businessFile =
  /(?:^|\/)(?:feedback-consultant-qr|pay-wall|last-pay|wallet[-_]|login-|CreditsRoute-|billing-|bank-cards-|major-client-purchase|lifetime-profile-|tier-slider|useNewUserBenefit|useTeamEntityLabels-|team-|empty-teams-|payment_icon|pay_success|purchase-gift|newbie-gift|upgrade-(?:pay-)?plan-|purchase_title_|subscription-expired-|identity-verification-(?:pending-dialog|details-dialog|dialog)-|union-pay-|gift-|invite-|referral[-_]|credits-|paywall|payments\/|campaing\/|campaign\/|proxy-shop-labels-)/i;
const removedScopes = new Set(
  JSON.parse(fs.readFileSync("work/rebuild/removed-scopes.json", "utf8")),
);
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(file);
      continue;
    }
    if (businessFile.test(file) && !file.endsWith(".js")) {
      removed.push(file);
      fs.unlinkSync(file);
      continue;
    }
    if (file.endsWith(".css")) {
      const ast = postcss.parse(fs.readFileSync(file, "utf8"));
      if (
        [
          "action-bar-wpLLnkNt.css",
          "window-list-DVlbVHdg.css",
          "base-dialog-CVdM7Cnu.css",
          "syncing-window-list-DGi17PrZ.css",
        ].includes(path.basename(file))
      )
        ast.walkRules((rule) => {
          if (
            rule.parent.type === "atrule" &&
            /keyframes$/i.test(rule.parent.name)
          )
            return;
          rule.selectors = rule.selectors.map((selector) => {
            const scope =
              path.basename(file) === "action-bar-wpLLnkNt.css"
                ? "html[data-ob-synchronizer]"
                : path.basename(file) === "base-dialog-CVdM7Cnu.css"
                  ? "html[data-ob-local-dialog]"
                  : "html[data-ob-sync-screen]";
            if (selector === ":root" || selector === "html") return scope;
            if (selector.startsWith(":root"))
              return selector.replace(":root", scope);
            if (selector.startsWith("html"))
              return selector.replace(/^html/, scope);
            return scope + " " + selector;
          });
        });
      ast.walkDecls((n) => {
        if (
          /pay-wall|paywall|wallet|purchase|credits|referral|\/payments\/|\/campaing\/|\/campaign\//i.test(
            n.prop + " " + n.value,
          )
        )
          n.remove();
      });
      ast.walkRules((n) => {
        const selectors = n.selectors.filter(
          (selector) =>
            ![...removedScopes].some((scope) => selector.includes(scope)) &&
            !/custom-template-dialog|my-templates-custom-button|custom-template-banner|pay-wall|last-pay|wallet|purchase|credits|referral|pay-metrics|lifetime-entry|payway|subscription-expired/i.test(
              selector,
            ),
        );
        if (!selectors.length) {
          n.remove();
          return;
        }
        n.selectors = selectors;
      });
      ast.walkAtRules((n) => {
        if (
          /custom-template-dialog|my-templates-custom-button|custom-template-banner|pay-wall|last-pay|wallet|purchase|credits|referral/i.test(n.params)
        )
          n.remove();
      });
      fs.writeFileSync(file, ast.toString());
    }
  }
}
scan(root);
// Dynamic preload dependency arrays are removed by the graph slicer. The
// stylesheet manifest is the complete set loaded by this local build.
const activeCss = new Set(
  JSON.parse(fs.readFileSync("docs/rebuild/style-inventory.json", "utf8")),
);
activeCss.add("assets/workbench-chrome.css");
for (const entry of fs.readdirSync(path.join(root, "assets"))) {
  if (entry.endsWith(".css") && !activeCss.has("assets/" + entry)) {
    const file = path.join(root, "assets", entry);
    removed.push(file);
    fs.unlinkSync(file);
  }
}
const index = path.join(root, "index.html");
let html = fs.readFileSync(index, "utf8");
html = html.replace(/<link rel="stylesheet" href="([^\"]+)">/g, (tag, href) =>
  fs.existsSync(path.join(root, href)) ? tag : "",
);
fs.writeFileSync(index, html);
fs.writeFileSync(
  "docs/rebuild/evidence/removed-resources.json",
  JSON.stringify(removed, null, 2),
);
console.log("Deleted commercial resources", removed.length);
