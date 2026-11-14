"use strict";
// Extends the SDK/channel audit to direct local RPC, Agent namespaces and ops.
// This proves a dispatch branch exists; actual DTO semantics need UI regressions.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"),
  acorn = require("acorn"), walk = require("acorn-walk");
const repo = path.resolve(__dirname, "../../.."), assets = process.env.REBUILD_OUTPUT || path.join(repo, "Browserapp/roxy-ui"),
  base = path.join(repo, "Browserapp"), branches = new Map(), uses = [], dynamic = [], missing = [];
const parse = code => acorn.parse(code, { ecmaVersion: "latest", sourceType: "module", locations: true, ranges: true });
const literal = node => node?.type === "Literal" ? node.value :
  node?.type === "TemplateLiteral" && !node.expressions.length ? node.quasis[0].value.cooked : undefined;
function alternatives(node) {
  if (typeof literal(node) === "string") return [literal(node)];
  if (node?.type === "ConditionalExpression") return [...alternatives(node.consequent), ...alternatives(node.alternate)];
  return [];
}
function add(name, file, line) { if (!branches.has(name)) branches.set(name, []); branches.get(name).push({ file, line }); }
for (const [file, prefix] of [
  ["rebuild/local-service.js", ""], ["rebuild/accounts.js", "accounts:"],
  ["rebuild/extensions.js", "extensions:"], ["rebuild/local-api.js", "api:"],
  ["rebuild/sync-service.js", ""], ["rebuild/dialog-windows.js", ""],
  ["rebuild/cookie-robot.js", "cookie-robot:"], ["rebuild/agent-service.js", "agent:"],
  ["rebuild/agent-mcp.js", "agent:mcp:"], ["rebuild/agent-conversations.js", "agent:"],
]) {
  const code = fs.readFileSync(path.join(base, file), "utf8");
  walk.simple(parse(code), {
    BinaryExpression(node) {
      if (!["===", "=="].includes(node.operator)) return;
      for (const [a, b] of [[node.left, node.right], [node.right, node.left]])
        if (a.type === "Identifier" && ["method", "action"].includes(a.name) && typeof literal(b) === "string")
          add(prefix + literal(b), file, node.loc.start.line);
    },
    IfStatement(node) {
      const test = node.test;
      if (test?.type === "BinaryExpression" && test.operator === "!==" && test.left.name === "method" &&
          typeof literal(test.right) === "string" && node.consequent.type === "ThrowStatement")
        add(prefix + literal(test.right), file, node.loc.start.line);
    },
    CallExpression(node) {
      if (node.callee.type === "MemberExpression" && node.callee.property.name === "includes" &&
          node.callee.object.type === "ArrayExpression" && ["method", "action"].includes(node.arguments[0]?.name))
        for (const element of node.callee.object.elements)
          if (typeof literal(element) === "string") add(prefix + literal(element), file, node.loc.start.line);
    },
  });
}
const { recordActions } = require("../agent-records");
for (const [namespace, methods] of Object.entries(recordActions))
  for (const method of methods) add("agent:" + namespace + "." + method, "rebuild/agent-records.js", 5);
const unsupported = {
  "agent:scriptSelfDescription": "原脚本沙箱未移植，明确拒绝；不是已接通功能",
  "agent:officialScripts.getOfficialScript": "原脚本沙箱未移植，明确拒绝；不是已接通功能",
  "agent:userTemplates.uploadUserTemplateScript": "原脚本沙箱未移植，明确拒绝；不是已接通功能",
};
const preload = fs.readFileSync(path.join(base, "preload.js"), "utf8"), ops = new Map(), handlers = new Map();
walk.simple(parse(preload), { CallExpression(node) {
  if (node.callee.property?.name !== "exposeInMainWorld" || literal(node.arguments[0]) !== "ops") return;
  for (const property of node.arguments[1].arguments[0].properties) {
    const channels = [];
    walk.simple(property.value, { CallExpression(call) {
      if (["invoke", "send"].includes(call.callee.property?.name)) channels.push(literal(call.arguments[0]));
    } });
    ops.set(property.key.name || property.key.value, { file: "preload.js", line: property.loc.start.line, channels });
  }
} });
for (const file of ["main.js", ...fs.readdirSync(path.join(base,"main")).filter(file=>file.endsWith(".js")).map(file=>"main/"+file)]) {
  const code = fs.readFileSync(path.join(base, file), "utf8");
  walk.simple(parse(code), { CallExpression(node) {
    if (["registerTrustedIpc", "register", "handle"].includes(node.callee.name || node.callee.property?.name) && typeof literal(node.arguments[0]) === "string")
      handlers.set(literal(node.arguments[0]), { file, line: node.loc.start.line });
  } });
}
function nativeUse(name, file, node) {
  const row = { kind: "local RPC", name, file, line: node.loc.start.line,
    backend: branches.get(name) || [], unsupported: unsupported[name] };
  uses.push(row); if (!row.backend.length && !row.unsupported) missing.push(row);
}
for (const file of fs.readdirSync(path.join(assets, "assets")).filter(name => name.endsWith(".js"))) {
  const code = fs.readFileSync(path.join(assets, "assets", file), "utf8");
  const tree = parse(code), bindings = new Map(), clients = new Set();
  const scopes = require("eslint-scope").analyze(tree, { ecmaVersion: 2024, sourceType: "module", optimistic: true });
  for (const scope of scopes.scopes) for (const reference of scope.references) bindings.set(reference.identifier, reference.resolved);
  const isGetter = variable => variable?.defs.some(definition => definition.type === "ImportBinding" &&
    definition.node.imported?.name === "N" && definition.parent.source.value === "./utils-BIWenCnY.js");
  for (const scope of scopes.scopes) for (const variable of scope.variables)
    if (variable.defs.some(definition => definition.node.type === "VariableDeclarator" &&
        definition.node.init?.type === "CallExpression" && isGetter(bindings.get(definition.node.init.callee)))) clients.add(variable);
  walk.simple(tree, { CallExpression(node) {
    const callee = node.callee, property = callee.property?.name, identifier = callee.name;
    const local = property === "__localRequest" || (identifier === "ipc" && ["local-pages.js", "workbench-chrome.js"].includes(file)) ||
      (identifier === "request" && file === "local-api.js");
    const mcp = file === "AgentSettingsRoute-BB9ba93X.js" && identifier === "call";
    const agent = property === "__agentRequest";
    if (local || agent || mcp) {
      const names = alternatives(node.arguments[0]);
      if (names.length) for (const name of names) nativeUse((agent ? "agent:" : mcp ? "agent:mcp:" : "") + name, file, node);
      else dynamic.push({ file, line: node.loc.start.line, expression: code.slice(node.start, node.end).slice(0, 220) });
    }
    const namespace = callee.object?.property?.name;
    if (Object.hasOwn(recordActions, namespace) && /[A-Z]/.test(property || ""))
      nativeUse("agent:" + namespace + "." + property, file, node);
    if (callee.object?.property?.name === "ops") {
      const backend = ops.get(property), row = { kind: "ops", name: property, file, line: node.loc.start.line, backend };
      uses.push(row); if (!backend) missing.push(row);
      else for (const channel of backend.channels)
        if (!handlers.has(channel)) missing.push({ ...row, missingMainHandler: channel });
    }
  }, MemberExpression(node) {
    if (!clients.has(bindings.get(node.object))) return;
    const property = node.property?.name;
    if (Object.hasOwn(recordActions, property)) return;
    if (["getFileUrl", "fileToBase64", "initializeAgentBackendAuth"].includes(property))
      uses.push({kind:"renderer helper",name:property,file,line:node.loc.start.line,backend:"renderer-bridge.js agentCall / Proxy"});
    else nativeUse("agent:" + (property === "ensureAgentReady" ? "info" : property), file, node);
  } });
}
const result = { status: missing.length ? "FAIL" : "PASS",
  scope: "仅对可静态解析调用证明存在精确分发分支；动态转发单列，不等于参数、返回值或所有交互已验收。脚本沙箱明确列为未迁移。",
  staticCalls: uses.length, uniqueCalls: new Set(uses.map(row => row.kind + row.name)).size,
  uses, dynamic, unsupported, missing,
  sources: ["preload.js", "rebuild/local-service.js", "rebuild/agent-service.js", "rebuild/agent-conversations.js", "rebuild/renderer-bridge.js"].map(file => ({ file,
    sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(base, file))).digest("hex") })) };
fs.writeFileSync(path.join(repo, "docs/rebuild/evidence/backend-contract-audit.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ...result, uses: uses.length, dynamic: dynamic.length, sources: result.sources.length }, null, 2));
if (missing.length) process.exitCode = 1;
