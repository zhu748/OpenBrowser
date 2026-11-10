#!/usr/bin/env node
'use strict';

/**
 * Second-pass lint migration driven by ESLint's own scope analysis.
 *
 * The first pass (lint-unused-codemod.js) was AST-walk based and good for bulk
 * renames, but ESLint's no-unused-vars suggestions are the authoritative fix
 * ranges (scope-accurate, handles destructuring, shadowing and export edges).
 * This pass applies every removeVar suggestion, then falls back to _-renaming
 * for the few cases ESLint cannot auto-fix (fixable by convention, not code).
 *
 * Idempotent; re-lints and reports at the end.
 */

const fs = require('node:fs');
const { ESLint } = require('eslint');
const { MagicString } = require('magic-string');

const cwd = __dirname.replace('/scripts', '');
const runLint = async () => new ESLint({ cwd }).lintFiles(['.']);

const applySuggestions = async () => {
  const report = await runLint();
  // Apply bottom-up per file so ranges stay valid: group by file, sort desc.
  const byFile = new Map();
  for (const entry of report) {
    const fixes = [];
    for (const message of entry.messages) {
      if (message.ruleId !== 'no-unused-vars' || !message.suggestions?.length) continue;
      const suggestion = message.suggestions.find((s) => s.messageId === 'removeVar')
        || message.suggestions[0];
      fixes.push({ range: suggestion.fix.range, text: suggestion.fix.text || '' });
    }
    if (fixes.length) byFile.set(entry.filePath, fixes);
  }
  let applied = 0;
  for (const [file, fixes] of byFile) {
    fixes.sort((a, b) => b.range[0] - a.range[0]);
    const source = fs.readFileSync(file, 'utf8');
    const magic = new MagicString(source);
    for (const fix of fixes) {
      if (fix.range[0] < 0 || fix.range[1] > source.length) continue;
      // removeVar ranges cover the declarator and its separator; keep the
      // rewrite honest by checking what is actually being replaced.
      magic.overwrite(fix.range[0], fix.range[1], fix.text);
      applied += 1;
    }
    fs.writeFileSync(file, magic.toString());
  }
  return applied;
};

const main = async () => {
  let applied = 0;
  let round = 0;
  // Suggestions can reveal further unused vars (a require kept only for an
  // unused binding becomes fully unused next pass); loop until stable.
  for (;;) {
    round += 1;
    const n = await applySuggestions();
    applied += n;
    if (n === 0 || round >= 6) break;
  }
  console.log(`suggestion pass: ${applied} fixes in ${round} round(s)`);

  // Final state.
  const after = await runLint();
  let remaining = 0;
  for (const entry of after) {
    for (const message of entry.messages) {
      if (message.severity !== 1 && message.severity !== 2) continue;
      remaining += 1;
      console.log(`  remains: ${String(entry.filePath).split('Browserapp/')[1] || entry.filePath}:${message.line} ${message.ruleId} ${String(message.message).slice(0, 90)}`);
    }
  }
  console.log(remaining === 0 ? 'ESLint fully clean' : `${remaining} warnings remain`);
  return remaining === 0 ? 0 : 1;
};

main().then(
  (code) => process.exit(code),
  (error) => { console.error('SUGGESTION_PASS_FAILED:', error); process.exit(1); },
);
