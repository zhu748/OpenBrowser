"use strict";

const manifest = require("../rebuild/acceptance-manifest.json");

// Keep existing public aliases. The acceptance manifest owns the test list;
// this table owns prerequisites, shared by smoke and acceptance execution.
const nodeAliases = {
  "agent-selftest.cjs": "agent",
  "agent-approval-selftest.cjs": "approval",
  "agent-mcp-selftest.cjs": "mcp",
  "accounts-selftest.cjs": "accounts",
  "agent-files-selftest.cjs": "attachments",
  "extensions-selftest.cjs": "extensions",
  "sync-service-selftest.cjs": "sync-service",
  "import-selftest.cjs": "import",
  "profile-cache-selftest.cjs": "cache",
  "review-agent-contracts-selftest.cjs": "contracts",
  "skill-packages-selftest.cjs": "skills",
  "cookie-robot-selftest.cjs": "robot",
  "host-actions-selftest.cjs": "host",
  "local-api-selftest.cjs": "api",
  "environment-network-selftest.cjs": "environment-network",
  "template-catalog-selftest.cjs": "template-catalog",
  "review-consistency-selftest.cjs": "consistency",
};

const browserRuntimes = {
  "network-form-selftest.cjs": "chromium",
  "image-size-selftest.cjs": "chromium",
  "media-preferences-selftest.cjs": "chromium",
  "master-color-selftest.cjs": "chromium",
  "master-color-visual-selftest.cjs": "chromium",
  "firefox-image-size-selftest.cjs": "firefox",
};
const electronTests = new Set([
  "electron-smoke.cjs",
  "packaging-selftest.cjs",
  "dialog-security-selftest.cjs",
  "quit-failure-selftest.cjs",
  "review-agent-reconnect-selftest.cjs",
  "agent-browser-selftest.cjs",
  "sync-browser-ui-selftest.cjs",
]);

function describe(file) {
  const runtime = Object.hasOwn(nodeAliases, file)
    ? "node"
    : browserRuntimes[file] ||
      (file.endsWith("-ui-selftest.cjs") || electronTests.has(file)
        ? "electron"
        : null);
  if (!runtime) throw Error("Declare workbench test prerequisites: " + file);
  return Object.freeze({
    file,
    script: "rebuild/" + file,
    name:
      "selftest:rebuild:" +
      (nodeAliases[file] || file.replace(/(?:-selftest)?\.cjs$/, "")),
    runtime,
    timeoutMs: 5 * 60 * 1000,
  });
}

if (new Set(manifest).size !== manifest.length)
  throw Error("Duplicate acceptance test");
for (const file of Object.keys(nodeAliases)) {
  if (!manifest.includes(file))
    throw Error(
      "Node workbench test missing from acceptance manifest: " + file,
    );
}
const workbenchTests = Object.freeze(manifest.map(describe));
const nodeWorkbenchTests = Object.freeze([
  Object.freeze({
    name: "selftest:rebuild:optimization",
    script: "rebuild/optimization-selftest.cjs",
    runtime: "node",
    timeoutMs: 5 * 60 * 1000,
  }),
  Object.freeze({
    name: "selftest:rebuild:service",
    script: "rebuild/local-service-selftest.js",
    runtime: "node",
    timeoutMs: 5 * 60 * 1000,
  }),
  ...workbenchTests.filter((test) => test.runtime === "node"),
]);

module.exports = { workbenchTests, nodeWorkbenchTests };
