"use strict";
// Decoded Vue component names complement the raw text audit. This finite
// concern list cannot prove that every commercial meaning has been removed.
const fs = require("node:fs"), path = require("node:path"),
  acorn = require("acorn"), walk = require("acorn-walk");
const app = path.resolve(__dirname, "../.."),
  concernSource = fs.readFileSync(path.join(__dirname, "commerce.cjs"), "utf8"),
  concerns = new Set();
walk.simple(acorn.parse(concernSource, { ecmaVersion: "latest", sourceType: "script" }), {
  VariableDeclarator(node) {
    if (node.id.name !== "commercial") return;
    for (const property of node.init.properties)
      for (const element of property.value.arguments[0].elements)
        concerns.add(element.value);
  },
});
if (concerns.size < 25) throw Error("Commercial component concern list changed");
const retained = [], names = new Set(), assets = path.join(app, "roxy-ui/assets");
function literal(node) {
  if (node?.type === "Literal") return node.value;
  if (node?.type === "TemplateLiteral" && !node.expressions.length)
    return node.quasis[0].value.cooked;
}
for (const file of fs.readdirSync(assets).filter(file => file.endsWith(".js"))) {
  const source = fs.readFileSync(path.join(assets, file), "utf8");
  walk.simple(acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" }), {
    Property(node) {
      if (!["__name", "name"].includes(node.key.name || literal(node.key))) return;
      const name = literal(node.value);
      if (typeof name !== "string") return;
      names.add(name);
      if (concerns.has(name)) retained.push({ file, name, offset: node.start });
    },
  });
}
const result = {
  status: retained.length ? "FAIL" : "PASS",
  scope: "当前产物解码后的组件名称关注清单，不能替代商业语义检查",
  concernNames: [...concerns].sort(), decodedNames: names.size, retained,
  snapshot: require("./runtime-snapshot.cjs").runtimeSnapshot(),
};
fs.writeFileSync(path.resolve(app, "../docs/rebuild/evidence/review-3/component-audit.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
if (retained.length) process.exitCode = 1;
