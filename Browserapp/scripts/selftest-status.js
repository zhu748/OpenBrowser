'use strict';

/** A successful process can still have skipped its browser assertions. */
function classifySelftestResult(result) {
  const output = String(result.stdout || '') + '\n' + String(result.stderr || '');
  const skipped = /^\s*SKIP(?:PED)?\b/im.test(output);
  if (result.error || result.signal || (result.status !== 0 && !(result.status === 2 && skipped))) return 'failed';
  if (skipped) return /^\s*PASS\b/im.test(output) ? 'partial' : 'skipped';
  return result.status === 0 ? 'passed' : 'failed';
}

module.exports = { classifySelftestResult };
