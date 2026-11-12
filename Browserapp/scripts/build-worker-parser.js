'use strict';

// Preserve token spelling and all original line-terminator boundaries while
// stripping upstream comments and indentation. No parser dependency at runtime.
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('../automation/vendor/acorn');
const root = path.join(__dirname, '../automation/vendor');
const source = fs.readFileSync(path.join(root, 'acorn.js'), 'utf8');
const license = fs.readFileSync(path.join(root, 'acorn.LICENSE'), 'utf8');
let output = '', end = 0;
for (const token of acorn.tokenizer(source, { ecmaVersion: 'latest' })) {
  if (token.type.label === 'eof') break;
  const gap = source.slice(end, token.start);
  if (gap) output += /[\r\n\u2028\u2029]/.test(gap) ? '\n' : ' ';
  output += source.slice(token.start, token.end);
  end = token.end;
}
// Parse the result with the upstream parser before publishing the generated file.
acorn.parse(output, { ecmaVersion: 'latest' });
fs.writeFileSync(path.join(root, 'acorn-runtime.js'), `/* Acorn ${acorn.version}\n${license}*/\n${output}\n`);
console.log(`worker parser: ${source.length} -> ${output.length} characters (+ MIT license)`);
