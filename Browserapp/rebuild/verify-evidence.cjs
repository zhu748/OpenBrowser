"use strict";
// Verifies recorded evidence; it does not rerun tests or certify pixel parity.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const repo = path.resolve(__dirname, "../.."),
  docs = path.join(repo, "docs/rebuild"),
  evidence = path.join(docs, "evidence");
const records = [
  "circled-ui-selftest.json",
  "ui-smoke.json",
  "management-ui-selftest.json",
  "agent-selftest.json",
  "agent-ui-selftest.json",
  "agent-browser-selftest.json",
  "agent-tasks-ui-selftest.json",
  "skill-packages-selftest.json",
  "sync-browser-ui-selftest.json",
  "synchronizer-ui-selftest.json",
  "network-ui-selftest.json",
  "kernels-ui-selftest.json",
  "packaging-selftest.json",
  "static-audit.json",
  "ui-audit.json",
  "module-links.json",
  "renderer-transports.json",
  "build-guard.json",
  "sync-service-selftest.json",
  "sync-dialogs-ui-selftest.json",
  "dialog-security-selftest.json",
  "import-selftest.json",
  "import-ui-selftest.json",
  "profile-cache-selftest.json",
  "profile-cache-ui-selftest.json",
  "quit-failure-selftest.json",
  "unavailable-ui-selftest.json",
  "phase2-command-results.json",
  "cookie-robot-selftest.json",
  "cookie-robot-ui-selftest.json",
  "agent-files-selftest.json",
  "agent-files-ui-selftest.json",
  "accounts-selftest.json",
  "accounts-ui-selftest.json",
  "extensions-selftest.json",
  "extensions-ui-selftest.json",
  "host-actions-selftest.json",
  "host-actions-ui-selftest.json",
  "local-api-selftest.json",
  "local-api-ui-selftest.json",
  "agent-approval-selftest.json",
  "agent-approval-ui-selftest.json",
  "projects-ui-selftest.json",
  "agent-mcp-selftest.json",
  "agent-mcp-ui-selftest.json",
  "style-provenance.json",
  "visual-parity-selftest.json",
  "settings-ui-selftest.json",
  "phase3-command-results.json",
  "environment-network-selftest.json",
  "network-form-selftest.json",
  "image-size-selftest.json",
  "image-size-ui-selftest.json",
  "media-preferences-selftest.json",
  "kernel-upgrade-ui-selftest.json",
  "template-catalog-selftest.json",
  "template-catalog-ui-selftest.json",
  "phase4-command-results.json",
  "gallery-ui-selftest.json",
  "tab-mapping-selftest.json",
  "firefox-image-size-selftest.json",
  "master-color-selftest.json",
  "master-color-visual-selftest.json",
  "native-regression-selftest.json",
  "desktop-shortcuts-selftest.json",
  "backend-contract-audit.json",
  "review-2/consistency.json",
  "review-2/agent-reconnect.json",
  "review-2/template-ui.json",
  "review-3/component-audit.json",
  "review-3/agent-contracts.json",
  "review-3/agent-contracts-ui.json",
];
const failures = [],
  result = {
    status: "FAIL",
    scope:
      "核对指定最新证据记录与当前运行文件，不重跑测试，不代表全页面像素或跨平台验收；历史失败记录保留并明确排除。",
    evidence: [],
    runtimeAssetHashesVerified: 0,
    documentationLinks: "FAIL",
    failures,
  };
function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
for (const file of records) {
  try {
    const data = read(path.join(evidence, file));
    const errors = ["errors", "externalRequests", "failures"].filter(
      (key) => data[key]?.length,
    );
    const commandsFailed = data.results?.some(
      (row) => row.exitCode !== 0 || row.status !== "PASS",
    );
    if (
      !(data.status === "PASS" || data.passed === true) ||
      errors.length ||
      commandsFailed
    )
      throw Error("记录未通过或包含失败: " + errors.join(","));
    result.evidence.push({ file, status: "PASS" });
  } catch (error) {
    failures.push({ file, error: error.message });
    result.evidence.push({ file, status: "FAIL" });
  }
}
try {
 const ledger=read(path.join(evidence,'phase4-command-results.json')),manifest=read(path.join(__dirname,'acceptance-manifest.json'));
 if(JSON.stringify(ledger.results.map(row=>row.name))!==JSON.stringify(manifest))throw Error('总回归命令与当前清单不一致');
 if(!ledger.runtimeUnchanged||ledger.runtimeAtStart.sha256!==ledger.runtimeAtEnd.sha256)throw Error('验收期间运行代码发生变化');
 const current=require('./compiler/runtime-snapshot.cjs').runtimeSnapshot();if(current.sha256!==ledger.runtimeAtEnd.sha256)throw Error('验收后运行代码发生变化');
 for(const row of ledger.results){if(!row.testSourceUnchanged)throw Error('测试执行期间来源变化：'+row.name);const current=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,row.name))).digest('hex');if(current!==row.testSha256)throw Error('验收后测试来源变化：'+row.name);}
 result.commandSourcesVerified=ledger.results.length;result.frozenRuntimeFilesVerified=current.files;
 const contracts=read(path.join(evidence,'backend-contract-audit.json'));if(contracts.missing.length)throw Error('后端契约审计仍有缺口');
 for(const row of contracts.sources){const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,'Browserapp',row.file))).digest('hex');if(actual!==row.sha256)throw Error('后端契约来源已变化：'+row.file);}
 const components=read(path.join(evidence,'review-3/component-audit.json'));if(components.snapshot.sha256!==current.sha256||components.retained.length)throw Error('组件语义关注清单与当前产物不一致');

 const targeted=read(path.join(evidence,'native-regression-selftest.json'));for(const row of targeted.results){const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,'Browserapp',row.name))).digest('hex');if(actual!==row.sha256)throw Error('原生回归来源已变化：'+row.name);}result.nativeTestsVerified=targeted.results.length;
 const desktop=read(path.join(evidence,'desktop-shortcuts-selftest.json'));if(!desktop.sourceUnchanged||desktop.runtimeAtEnd.sha256!==current.sha256||desktop.sourceSha256!==crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'desktop-shortcuts-selftest.cjs'))).digest('hex'))throw Error('真实桌面证据来源与当前代码不一致');
 const visuals=read(path.join(evidence,'visual-parity-selftest.json'));if(visuals.selectedCases.length!==48||visuals.cases.length!==96||visuals.cases.some(row=>!row.comparison.equal))throw Error('视觉证据未覆盖完整 48 状态 / 明暗 96 组');result.visualCasesVerified=visuals.cases.length;
} catch(error) { failures.push({file:'phase4-command-results.json',error:error.message}); }
const native=read(path.join(evidence,'native-runtime-hashes.json'));
result.nativeRuntimeHashesVerified=0;
for(const row of native.files){
 try{const file=path.resolve(repo,row.file);if(!file.startsWith(path.join(repo,'Browserapp')+path.sep))throw Error('Native hash 路径越界');const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(actual!==row.sha256)throw Error('Native SHA256 不一致');result.nativeRuntimeHashesVerified++;}
 catch(error){failures.push({file:row.file,error:error.message});}
}
const hashes = read(path.join(evidence, "asset-hashes.json"));
const runtime = path.join(repo, "Browserapp/roxy-ui");
function list(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error("运行资源含符号链接: " + file);
    return entry.isDirectory() ? list(file) : [file];
  });
}
const indexed = new Set();
for (const { file, sha256 } of hashes) {
  try {
    const absolute = path.resolve(repo, file);
    if (!absolute.startsWith(runtime + path.sep) || indexed.has(absolute))
      throw Error("资源清单路径越界或重复");
    indexed.add(absolute);
    const actual = crypto
      .createHash("sha256")
      .update(fs.readFileSync(absolute))
      .digest("hex");
    if (actual !== sha256) throw Error("SHA256 不一致");
    result.runtimeAssetHashesVerified++;
  } catch (error) {
    failures.push({ file, error: error.message });
  }
}
for (const file of list(runtime))
  if (!indexed.has(file)) failures.push({ file, error: "资源没有哈希记录" });
const broken = [];
for (const file of fs
  .readdirSync(docs)
  .filter((name) => name.endsWith(".md"))) {
  const text = fs.readFileSync(path.join(docs, file), "utf8");
  for (const match of text.matchAll(/!?\[[^\]]*\]\(([^)\n]+)\)/g)) {
    const url = match[1].replace(/^<|>$/g, "").split("#")[0];
    if (!url || /^[a-z][\w+.-]*:/i.test(url)) continue;
    const target = path.resolve(
      docs,
      decodeURIComponent(url).replace(/:\d+$/, ""),
    );
    if (!fs.existsSync(target)) broken.push({ file, target: url });
  }
}
result.documentationLinks = broken.length ? "FAIL" : "PASS";
failures.push(...broken.map((row) => ({ ...row, error: "文档链接不存在" })));
result.status = failures.length ? "FAIL" : "PASS";
fs.writeFileSync(
  path.join(evidence, "final-verification.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({ ...result, evidence: result.evidence.length }, null, 2),
);
if (result.status !== "PASS") process.exitCode = 1;
