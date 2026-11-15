"use strict";

const fs = require("node:fs");
const path = require("node:path");
const acorn = require("acorn");
const walk = require("acorn-walk");

function parse(source) {
  return acorn.parse(source, { ecmaVersion: "latest", sourceType: "module" });
}

function applyEdits(source, edits, label) {
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

function assertSingleMatches(hits, label) {
  for (const [key, count] of hits) {
    if (count !== 1) throw Error(`${label}: ${key} expected 1 match, found ${count}`);
  }
}

/** Literal source edits must fail when the locked input drifts. */
function replaceExactly(source, before, after, label = "source", expected = 1) {
  if (typeof before !== "string" || !before || !Number.isInteger(expected) || expected < 1)
    throw Error(`${label}: invalid literal patch`);
  const count = source.split(before).length - 1;
  if (count !== expected)
    throw Error(`${label}: literal patch expected ${expected} matches, found ${count}: ${before.slice(0, 120)}`);
  return expected === 1 ? source.replace(before, after) : source.replaceAll(before, after);
}

function replaceOneOf(source, alternatives, after, label = "source") {
  const matches = alternatives.filter(before => typeof before === "string" && before && source.includes(before));
  if (matches.length !== 1) throw Error(`${label}: expected one source spelling, found ${matches.length}`);
  return replaceExactly(source, matches[0], after, label);
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
  assertSingleMatches(hits, label);
  return applyEdits(source, edits, label);
}

/** Replace setup behavior while preserving the archived render expression. */
function patchComponentSetups(source, replacements, label = "source") {
  const hits = new Map(Object.keys(replacements).map(name => [name, 0]));
  const edits = [];
  walk.simple(parse(source), {
    VariableDeclarator(node) {
      const name = node.id.name;
      if (!Object.hasOwn(replacements, name)) return;
      if (!node.init) throw Error(`${label}: ${name} has no initializer`);
      walk.simple(node.init, {
        Property(property) {
          if (property.key.name !== 'setup') return;
          hits.set(name, hits.get(name) + 1);
          const body = property.value.body;
          const returned = body?.body?.findLast(row => row.type === 'ReturnStatement');
          let render = returned?.argument;
          if (render?.type === 'SequenceExpression') render = render.expressions.at(-1);
          if (!render) throw Error(`${label}: ${name} has no setup render return`);
          edits.push({ start: body.start, end: body.end,
            replacement: '{' + replacements[name] + ';return ' + source.slice(render.start, render.end) + ';}' });
        },
      });
    },
  });
  assertSingleMatches(hits, label);
  return applyEdits(source, edits, label);
}

function createPatch(directory) {
  return (name, variables = {}, functions = {}) => {
    const file = path.join(directory, name + ".js");
    const source = fs.readFileSync(file, "utf8");
    const result = patchSource(source, variables, functions, name);
    fs.writeFileSync(file, result);
  };
}

module.exports = { createPatch, patchSource, patchComponentSetups, replaceExactly, replaceOneOf };
