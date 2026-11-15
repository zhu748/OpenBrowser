"use strict";

const fs = require("node:fs");
const path = require("node:path");
const acorn = require("acorn");
const walk = require("acorn-walk");

function parse(source) {
  return acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" });
}

/** Validate every requested symbol and edit before publishing any replacement. */
function patchSource(source, variables = {}, functions = {}, label = "source") {
  const edits = [];
  const hits = new Map([
    ...Object.keys(variables).map((name) => ["variable:" + name, 0]),
    ...Object.keys(functions).map((name) => ["function:" + name, 0]),
  ]);
  function add(kind, name, node, replacement) {
    const key = kind + ":" + name;
    hits.set(key, hits.get(key) + 1);
    if (!node) throw Error(`${label}: ${key} has no initializer`);
    edits.push({ start: node.start, end: node.end, replacement });
  }
  walk.simple(parse(source), {
    VariableDeclarator(node) {
      if (node.id.type === "Identifier" && Object.hasOwn(variables, node.id.name))
        add("variable", node.id.name, node.init, variables[node.id.name]);
    },
    FunctionDeclaration(node) {
      if (node.id && Object.hasOwn(functions, node.id.name))
        add("function", node.id.name, node.body, "{" + functions[node.id.name] + "}");
    },
  });
  for (const [key, count] of hits) {
    if (count !== 1) throw Error(`${label}: ${key} expected 1 match, found ${count}`);
  }
  edits.sort((a, b) => a.start - b.start);
  for (let index = 1; index < edits.length; index++) {
    if (edits[index].start < edits[index - 1].end)
      throw Error(`${label}: overlapping patches`);
  }
  let result = source;
  for (const { start, end, replacement } of edits.reverse())
    result = result.slice(0, start) + replacement + result.slice(end);
  parse(result);
  return result;
}

function createPatch(directory) {
  return (name, variables = {}, functions = {}) => {
    const file = path.join(directory, name + ".js");
    const source = fs.readFileSync(file, "utf8");
    const result = patchSource(source, variables, functions, name);
    fs.writeFileSync(file, result);
  };
}

module.exports = { createPatch, patchSource };
