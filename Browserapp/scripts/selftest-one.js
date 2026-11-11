#!/usr/bin/env node
'use strict';

/**
 * Generic single-test runner on top of the SUITE registry.
 *
 * Usage:
 *   npm run selftest -- list        print every registered test name
 *   npm run selftest -- <name>      resolve and run a single test
 *
 * <name> is resolved against the SUITE registry in scripts/selftest-all.js —
 * the single source of truth for which tests exist and how they run:
 *   1. exact registry name                     (selftest:port)
 *   2. exact name without the "selftest:"      (port)
 *      prefix
 *   3. unique prefix of either form            (selftest:iso / iso)
 *   4. unique prefix of the registered file    (local-api-port / downloade)
 *      path or its basename
 * Extra arguments after <name> are forwarded to the test script.
 *
 * Run semantics mirror scripts/selftest-all.js exactly: cwd is the Browserapp
 * root, the child is spawned as `node <script> selftest ...` with the parent
 * environment passed through unchanged, darwinOnly entries are reported as
 * explicit skips on other platforms (exit 0, never a silent fake pass), and
 * the child's exit status becomes this runner's exit status.
 *
 * No arguments, an ambiguous prefix or an unknown name prints the available
 * names and exits non-zero.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const { SUITE, PER_SCRIPT_TIMEOUT_MS } = require('./selftest-all.js');

// Browserapp root (this runner lives in scripts/); all script paths are
// relative to the app root, not to this file.
const ROOT = path.join(__dirname, '..');

function strippedName(name) {
  return name.replace(/^selftest:?/, '');
}

function matches(entries, predicate) {
  return SUITE.filter((entry) => predicate(entry));
}

/**
 * Resolve a user-supplied query to exactly one SUITE entry.
 * Returns the entry, an { ambiguous } wrapper, or null when nothing matches.
 */
function resolve(query) {
  const q = query.trim();
  if (!q) return null;

  // 1. exact registry name (selftest:port)
  let hit = matches(SUITE, ([name]) => name === q);
  if (hit.length === 1) return hit[0];
  // 2. exact name without the "selftest:" prefix (port)
  hit = matches(SUITE, ([name]) => strippedName(name) === q);
  if (hit.length === 1) return hit[0];
  // 3. unique prefix of the registry name, then of the stripped name
  hit = matches(SUITE, ([name]) => name.startsWith(q));
  if (hit.length === 1) return hit[0];
  if (hit.length > 1) return { ambiguous: hit };
  hit = matches(SUITE, ([name]) => strippedName(name).startsWith(q));
  if (hit.length === 1) return hit[0];
  if (hit.length > 1) return { ambiguous: hit };
  // 4. unique prefix of the registered file path or its basename
  hit = matches(SUITE, ([, file]) => file.startsWith(q) || path.basename(file).startsWith(q));
  if (hit.length === 1) return hit[0];
  if (hit.length > 1) return { ambiguous: hit };
  return null;
}

function listSuite() {
  const width = Math.max(...SUITE.map(([name]) => name.length));
  for (const [name, script, flags] of SUITE) {
    const mark = flags && flags.darwinOnly ? '  [darwin-only]' : '';
    console.log(`${name.padEnd(width)}  ${script}${mark}`);
  }
  console.log(`\n${SUITE.length} registered tests — run one with: npm run selftest -- <name>`);
}

function runOne(entry, extraArgs) {
  const [name, script, flags] = entry;
  if (flags && flags.darwinOnly && process.platform !== 'darwin') {
    console.log(`skip  ${name}  ${script}`);
    console.log('     (darwin-only: macOS kernel launcher required)');
    return process.env.OPENBROWSER_REQUIRE_COMPLETE_TESTS === '1' ? 2 : 0;
  }
  const scriptPath = path.join(ROOT, script);
  const started = Date.now();
  process.stdout.write(`run   ${name}  ${script} ... `);
  const res = spawnSync(process.execPath, [scriptPath, 'selftest', ...extraArgs], {
    cwd: ROOT,
    timeout: PER_SCRIPT_TIMEOUT_MS,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const status = require('./selftest-status').classifySelftestResult(res);
  if (status === 'passed') {
    console.log(`ok (${seconds}s)`);
    return 0;
  }
  if (status === 'partial' || status === 'skipped') {
    console.log(`${status} (${seconds}s)`);
    return process.env.OPENBROWSER_REQUIRE_COMPLETE_TESTS === '1' ? 2 : 0;
  }
  console.log(`FAIL (exit=${res.status}${res.signal ? ' signal=' + res.signal : ''}, ${seconds}s)`);
  return res.status === null ? 1 : res.status;
}

function failUsage(message) {
  console.error(`selftest-one: ${message}\n`);
  listSuite();
  return 1;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    return failUsage('no test name given');
  }
  const [query, ...extraArgs] = argv;
  if (query === 'list' || query === '--list') {
    listSuite();
    return 0;
  }
  const resolved = resolve(query);
  if (resolved === null) {
    return failUsage(`no registered test matches "${query}"`);
  }
  if (resolved.ambiguous) {
    const names = resolved.ambiguous.map(([name]) => name).join(', ');
    return failUsage(`"${query}" is ambiguous — matches: ${names}`);
  }
  return runOne(resolved, extraArgs);
}

if (require.main === module) process.exit(main());

module.exports = { resolve, strippedName };
