"use strict";
const fs = require("node:fs"), path = require("node:path");
const acorn = require("acorn"), walk = require("acorn-walk");
const file = path.resolve("work/rebuild/stage/assets/edit-IaDdchpD.js");
let source = fs.readFileSync(file, "utf8"), replacement;
walk.simple(acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" }), {
  FunctionDeclaration(node) {
    if (node.id?.name !== "$" || !node.async) return;
    const body = source.slice(node.body.start + 1, node.body.end - 1);
    const start = /J\.value\s*=\s*!0\s*;/.exec(body);
    if (!start || !/J\.value\s*=\s*!1\s*,/.test(body)) throw Error("Edit save lifecycle patch no longer matches");
    const boundary = start.index + start[0].length;
    replacement = { start: node.body.start + 1, end: node.body.end - 1,
      text: body.slice(0, boundary) + "try {" + body.slice(boundary).replace(/J\.value\s*=\s*!1\s*,/, "") + "} finally { J.value = false; }" };
  },
});
if (!replacement) throw Error("Missing edit save handler");
source = source.slice(0, replacement.start) + replacement.text + source.slice(replacement.end);
fs.writeFileSync(file, source);
