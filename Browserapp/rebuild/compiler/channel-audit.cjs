"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  acorn = require("acorn"),
  walk = require("acorn-walk");
const repo = path.resolve(__dirname, "../../.."),
  root = process.env.REBUILD_OUTPUT || path.join(repo, "Browserapp/roxy-ui");
const parse = (code) =>
  acorn.parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    locations: true,
  });
const text = (n) =>
  n?.type === "Literal"
    ? n.value
    : n?.type === "TemplateLiteral" && !n.expressions.length
      ? n.quasis[0].value.cooked
      : undefined;
const bridge = fs.readFileSync(
    path.join(repo, "Browserapp/rebuild/renderer-bridge.js"),
    "utf8",
  ),
  tables = {};
walk.simple(parse(bridge), {
  VariableDeclarator(n) {
    if (["methods", "sends"].includes(n.id.name)) {
      tables[n.id.name] = n.init.properties
        .filter((p) => p.type !== "SpreadElement")
        .map((p) => {
          const native = new Set();
          walk.simple(p.value, {
            CallExpression(c) {
              if (c.callee.name === "request" && text(c.arguments[0]))
                native.add(text(c.arguments[0]));
              if (
                c.callee.type === "MemberExpression" &&
                c.callee.object.type === "MemberExpression" &&
                c.callee.object.property.name === "ops"
              )
                native.add("ops." + c.callee.property.name);
            },
          });
          return {
            name: p.key.name ?? p.key.value,
            parameters: p.value.params?.map((v) =>
              bridge.slice(v.start, v.end),
            ),
            line: p.loc.start.line,
            backend: [...native],
          };
        });
    }
  },
});
for (const name of [
  "unifyTabs",
  "closeOtherTabs",
  "closeCurrentTab",
  "closeBlankTabs",
])
  tables.sends.push({
    name: "syncControl:" + name,
    parameters: [],
    line: bridge.slice(0, bridge.indexOf("...Object.fromEntries")).split("\n")
      .length,
    backend: ["ops.tabAction"],
    note: "Object.fromEntries 映射",
  });
const api = new Set(tables.methods.map((v) => v.name)),
  channels = new Set(tables.sends.map((v) => v.name)),
  unmappedApi = [],
  unmappedChannels = [],
  dynamicChannels = [],
  uses = [];
for (const file of fs
  .readdirSync(path.join(root, "assets"))
  .filter((f) => f.endsWith(".js"))) {
  const code = fs.readFileSync(path.join(root, "assets", file), "utf8");
  walk.simple(parse(code), {
    CallExpression(n) {
      const callee = code.slice(n.callee.start, n.callee.end),
        name = n.callee.property?.name;
      if (/^user[A-Z].*(?:List|Create|Delete|Patch|Update)$/.test(name || "")) {
        const row = {
          file,
          line: n.loc.start.line,
          name,
          parameters: n.arguments.map((p) => code.slice(p.start, p.end)),
        };
        uses.push(row);
        if (!api.has(name)) unmappedApi.push(row);
      }
      if (/electronAPI\??\.(send|invoke)$/.test(callee)) {
        const channel = text(n.arguments[0]),
          row = {
            file,
            line: n.loc.start.line,
            channel:
              channel ?? code.slice(n.arguments[0].start, n.arguments[0].end),
          };
        if (channel === undefined) dynamicChannels.push(row);
        else if (!channels.has(channel)) unmappedChannels.push(row);
      }
    },
  });
}
const result = {
  adapters: tables,
  retainedApiCalls: uses.length,
  unmappedApi,
  unmappedChannels,
  dynamicChannels,
};
fs.writeFileSync(
  path.join(repo, "docs/rebuild/ADAPTER-MAP.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify(
    {
      apiAdapters: api.size,
      channelAdapters: channels.size,
      retainedApiCalls: uses.length,
      unmappedApi: [...new Set(unmappedApi.map((v) => v.name))],
      unmappedChannels: [...new Set(unmappedChannels.map((v) => v.channel))],
      dynamicChannels,
    },
    null,
    2,
  ),
);
