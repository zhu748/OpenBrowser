"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  acorn = require("acorn"),
  walk = require("acorn-walk"),
  postcss = require("postcss");
const repo = path.resolve(__dirname, "../../..");
process.chdir(repo);
const source = require("./source.cjs").resolveBuildSource(),
  root = process.env.REBUILD_OUTPUT || "Browserapp/roxy-ui";
const failures = [],
  transports = [],
  localFetchCallbacks = [],
  commercialComponents = [];
for (const name of fs
  .readdirSync(path.join(root, "assets"))
  .filter((name) => name.endsWith(".js"))) {
  const text = fs.readFileSync(path.join(root, "assets", name), "utf8"),
    ast = acorn.parse(text, {
      ecmaVersion: "latest",
      sourceType: "module",
      locations: true,
    });
  walk.simple(ast, {
    Property(n) {
      const value =
        n.value?.type === "Literal"
          ? n.value.value
          : n.value?.type === "TemplateLiteral" && !n.value.expressions.length
            ? n.value.quasis[0].value.cooked
            : undefined;
      if (
        n.key?.name === "__name" &&
        typeof value === "string" &&
        /pay|wallet|recharge|bill|renew|quota|bonus|member|team|trial|subscription|profit|invite|buy|gift|activity|credit|coupon|sale/i.test(
          value,
        )
      )
        commercialComponents.push({
          file: name,
          name: value,
          line: n.loc.start.line,
        });
    },
    CallExpression(n) {
      const callee = text.slice(n.callee.start, n.callee.end);
      if (
        /^(?:(?:globalThis|window|self)\.)?fetch$|(?:^|\.)sendBeacon$/.test(
          callee,
        )
      )
        transports.push({ file: name, line: n.loc.start.line, callee });
      if (
        n.callee.property?.name === "fetch" &&
        !/^(window|globalThis|self)$/.test(n.callee.object?.name || "")
      )
        localFetchCallbacks.push({
          file: name,
          line: n.loc.start.line,
          callee,
        });
    },
    NewExpression(n) {
      if (
        ["WebSocket", "XMLHttpRequest", "EventSource"].includes(n.callee.name)
      )
        transports.push({
          file: name,
          line: n.loc.start.line,
          callee: "new " + n.callee.name,
        });
    },
  });
  if (
    /\.billing\.|userBatchInviteCreate|userGetMemberInfoByWorkspaceList|userGetMemberInfoByProjectIdList/.test(
      text,
    )
  )
    failures.push({ file: name, error: "商业/团队接口仍在运行模块中" });
}
if (transports.length)
  failures.push({ error: "渲染端直接网络传输仍存在", transports });
if (commercialComponents.length)
  failures.push({ error: "商业/团队组件仍在运行模块中", commercialComponents });
const missingResources = [];
for (const name of fs
  .readdirSync(path.join(root, "assets"))
  .filter((name) => name.endsWith(".css"))) {
  const ast = postcss.parse(
    fs.readFileSync(path.join(root, "assets", name), "utf8"),
  );
  ast.walkDecls((n) => {
    for (const match of n.value.matchAll(
      /url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g,
    )) {
      const url = match[1];
      if (/^data:|^#/.test(url)) continue;
      if (/^https?:|^\/\//i.test(url)) {
        failures.push({ file: name, error: "外部 CSS 资源", url });
        continue;
      }
      const file = path.join(
        root,
        decodeURIComponent(new URL(url, "obui://app/assets/" + name).pathname),
      );
      if (!fs.existsSync(file)) missingResources.push({ file: name, url });
    }
  });
}
if (missingResources.length)
  failures.push({ error: "CSS 引用缺失资源", missingResources });
function theme(file) {
  const values = new Map();
  postcss.parse(fs.readFileSync(file, "utf8")).walkDecls((n) => {
    if (n.prop.startsWith("--"))
      values.set(n.parent.selector + "::" + n.prop, n.value);
  });
  return values;
}
const original = theme(path.join(source, "web/assets/theme-sp0uFzH4.css")),
  built = theme(path.join(root, "assets/theme-sp0uFzH4.css"));
const changed = [...built]
    .filter(([key, value]) => original.get(key) !== value)
    .map(([key]) => key),
  removed = [...original.keys()].filter((key) => !built.has(key));
if (changed.length) failures.push({ error: "保留主题值与原版不同", changed });
if (removed.some((key) => !/wallet|referral|pay-wallet/.test(key)))
  failures.push({ error: "非商业主题变量被删除", removed });
function localeKeys(file) {
  const code = fs.readFileSync(file, "utf8"),
    ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" }),
    name = ast.body
      .find((n) => n.type === "ExportNamedDeclaration")
      .specifiers.find((n) => n.exported.name === "default").local.name;
  const object = ast.body
    .filter((n) => n.type === "VariableDeclaration")
    .flatMap((n) => n.declarations)
    .find((n) => n.id.name === name).init;
  return new Set(
    object.properties.map(
      (p) => p.key.name ?? p.key.value ?? p.key.quasis?.[0]?.value.cooked,
    ),
  );
}
const locale = [];
for (const name of ["zh-CN-CKEkLKpn.js", "en-D33DiJcZ.js", "ru-Bo9bnzty.js"]) {
  if (!fs.existsSync(path.join(root, "assets", name))) continue;
  const before = localeKeys(path.join(source, "web/assets", name)),
    after = localeKeys(path.join(root, "assets", name)),
    lost = [...before].filter((key) => !after.has(key));
  if (lost.length) failures.push({ file: name, error: "翻译键被删除", lost });
  locale.push({
    file: name,
    original: before.size,
    retained: after.size,
    lost,
  });
}
const result = {
  status: failures.length ? "FAIL" : "PASS",
  directTransports: transports,
  commercialComponents,
  localFetchCallbacks,
  theme: {
    originalDeclarations: original.size,
    retainedDeclarations: built.size,
    changed,
    removed,
  },
  locale,
  failures,
};
fs.writeFileSync(
  "docs/rebuild/evidence/ui-audit.json",
  JSON.stringify(result, null, 2),
);
fs.writeFileSync(
  "docs/rebuild/evidence/renderer-transports.json",
  JSON.stringify(
    {
      status: transports.length ? "FAIL" : "PASS",
      scope: "Current generated runtime JavaScript (AST call/new expressions)",
      directTransports: transports,
      localFetchCallbacks,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      status: result.status,
      directTransports: transports.length,
      retainedTheme: built.size,
      failures,
    },
    null,
    2,
  ),
);
assert.equal(failures.length, 0, "UI 审计失败");
