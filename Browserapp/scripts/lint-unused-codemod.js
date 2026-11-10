#!/usr/bin/env node
'use strict';

/**
 * One-shot lint migration for the 372 no-unused-vars warnings.
 *
 * Strategy (conservative — this is a bulk hygiene pass, not a refactor):
 *   - unused `catch (e)` bindings and unused function params: rename to _e/_x
 *     (the ESLint config already honors the underscore convention);
 *   - unused local/const assignments: rename to _name and KEEP the assignment
 *     (audit scripts use them as self-documenting measurements; deleting 287
 *     assignments blindly is a semantic risk this pass must not take);
 *   - unused imports/require bindings: DELETE the binding (imports are pure;
 *     deleting is the only correct fix there);
 *   - never a behavioral edit: only identifier renames and import removal.
 *
 * Every file is re-linted after rewriting; any file that still warns is
 * reported at the end. Idempotent: a second run rewrites nothing.
 */

const fs = require('node:fs');
const espree = require('espree');
const { MagicString } = require('magic-string');



// Full ESLint report up front. Warnings make eslint exit 1; read the JSON
// from stdout regardless.
const { ESLint } = require('eslint');
const runLint = async () => {
  const eslint = new ESLint({ cwd: __dirname.replace('/scripts', '') });
  return eslint.lintFiles(['.']);
};
const mainAsync = async () => {
const report = await runLint();

const perFile = new Map();
for (const entry of report) {
  for (const message of entry.messages) {
    if (message.ruleId !== 'no-unused-vars') continue;
    const match = message.message.match(/^'([^']+)' (is assigned a value but never used|is defined but never used)/);
    if (!match) continue;
    perFile.set(entry.filePath, perFile.get(entry.filePath) || []);
    perFile.get(entry.filePath).push({ line: message.line, column: message.column, name: match[1], kind: match[2] });
  }
}
if (process.env.CODEMOD_DEBUG) console.log(`[debug] perFile: ${perFile.size} files, ${[...perFile.values()].reduce((a, b) => a + b.length, 0)} warnings`);

let filesTouched = 0;
let renames = 0;
let importDeletes = 0;
const failed = [];

for (const [file, warnings] of perFile) {
  const source = fs.readFileSync(file, 'utf8');
  const byLine = new Map(warnings.map((w) => [w.line, w]));
  let ast;
  try {
    ast = espree.parse(source, { ecmaVersion: 'latest', range: true, loc: true, comment: true });
  } catch (error) {
    failed.push(`${file}: parse failed: ${error.message}`);
    continue;
  }
  const magic = new MagicString(source);

  // Collect declarations to rename / imports to drop.
  const renameTargets = new Map(); // name -> [range of the identifier in source]
  const dropImports = new Set(); // variable names whose require/import should go

  const consider = (node, kind) => {
    const w = byLine.get(node.loc?.start?.line ?? -1);
    if (!w) return;
    if (kind === 'import' || (node.parent?.type === 'VariableDeclarator' && node.parent?.init?.type === 'CallExpression' && /^(require|import)$/.test(node.parent?.init?.callee?.name || ''))) {
      dropImports.add(w.name);
      return;
    }
    if (!renameTargets.has(w.name)) renameTargets.set(w.name, []);
    renameTargets.get(w.name).push(node.range);
  };

  const walk = (node, parent) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const child of node) walk(child, parent); return; }
    node.parent = parent;
    switch (node.type) {
      case 'Identifier':
        if (parent && (parent.type === 'VariableDeclarator' && parent.id === node && parent.init)) consider(node, 'assign');
        if (parent && (parent.type === 'CatchClause' && parent.param === node)) consider(node, 'catch');
        if (parent && ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ArrowFunctionExpression') && parent.params?.includes(node))) consider(node, 'param');
        break;
      default:
        break;
    }
    for (const key of Object.keys(node)) {
      if (key === 'parent') continue;
      const child = node[key];
      if (child && typeof child === 'object') walk(child, node);
      else if (Array.isArray(child)) for (const grandchild of child) if (grandchild && typeof grandchild === 'object') walk(grandchild, node);
    }
  };
  walk(ast, null);

  if (!renameTargets.size && !dropImports.size) continue;

  let changed = false;
  for (const [name, ranges] of renameTargets) {
    for (const [start, end] of ranges) {
      const before = source.slice(start, end);
      if (before !== name) continue;
      magic.overwrite(start, end, `_${name}`);
      renames += 1;
      changed = true;
    }
  }

  // Drop import declarations whose only bindings are unused. Restrict to
  // simple whole-declaration drops: mixed used/unused declarations keep the
  // used bindings (fall back to the rename pass on the next iteration).
  if (dropImports.size) {
    const dropRanges = [];
    for (const node of ast.body) {
      if (node.type !== 'VariableDeclaration') continue;
      const declarators = node.declarations;
      if (!declarators?.length) continue;
      const dropDeclarators = declarators.filter((d) => d.id?.type === 'Identifier' && dropImports.has(d.id.name) && d.init?.type === 'CallExpression' && d.init?.callee?.type === 'Identifier' && d.init.callee.name === 'require');
      if (dropDeclarators.length === declarators.length) {
        dropRanges.push(node.range);
      } else if (dropDeclarators.length) {
        // Mixed declaration: drop only the unused declarators (comma list).
        for (const d of dropDeclarators) {
          const listStart = d.range[0];
          // Find the comma before/after within the declaration list.
          const nextComma = source.indexOf(',', d.range[1]);
          const prevComma = source.lastIndexOf(',', listStart);
          if (nextComma !== -1 && (prevComma === -1 || nextComma < prevComma || true)) {
            // comma after -> remove "…, <decl>"; comma before -> remove "<decl>, "
            if (prevComma >= node.declarations[0].range[0]) {
              magic.remove(prevComma + 1, d.range[1]);
            } else {
              magic.remove(d.range[0], nextComma + 1 > d.range[1] ? nextComma + 1 : d.range[1]);
            }
          }
          importDeletes += 1;
          changed = true;
        }
      } else {
        continue;
      }
    }
    for (const [start, end] of dropRanges) { magic.remove(start, end); importDeletes += 1; changed = true; }
  }

  if (!changed) continue;
  const out = magic.toString();
  fs.writeFileSync(file, out);
  filesTouched += 1;
}

console.log(`codemod: ${filesTouched} files, ${renames} renames, ${importDeletes} import drops`);

// Re-lint and report remaining warnings.
const after = await runLint();
let remaining = 0;
for (const entry of after) {
  for (const message of entry.messages) {
    if (message.severity !== 1 && message.severity !== 2) continue;
    remaining += 1;
    if (remaining <= 15) console.log(`  remains: ${String(entry.filePath).split('Browserapp/')[1] || entry.filePath}:${message.line} ${message.ruleId} ${String(message.message).slice(0, 80)}`);
  }
}
console.log(remaining === 0 ? 'codemod: ESLint is fully clean' : `codemod: ${remaining} warnings remain (see list)`);
return remaining === 0 ? 0 : 1;
};

mainAsync().then(
  (code) => process.exit(code),
  (error) => { console.error('CODEMOD_FAILED:', error); process.exit(1); },
);
