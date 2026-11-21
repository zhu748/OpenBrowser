#!/usr/bin/env node
'use strict';

/**
 * Registry consistency guard (P2 single-registry consolidation).
 *
 * The SUITE array in scripts/selftest-all.js is the single registry for every
 * dependency-free selftest; `npm run selftest -- <name>` (scripts/selftest-one.js)
 * resolves against it. package.json used to duplicate ~190 selftest:* entries,
 * most of them pointing at the same files as SUITE — two hand-maintained lists
 * that kept drifting apart. This guard keeps the duplication from creeping
 * back:
 *
 * 1. Every selftest:* entry in package.json must be EITHER
 *    a) referenced by a real consumer — CI workflows, the release gate /
 *       release-coverage / fingerprint-coverage validators, the regression
 *       runner, README or docs — OR
 *    b) NOT covered by SUITE (kernel/display-bound tests intentionally keep
 *       their individual npm scripts because the aggregate gate cannot run
 *       them; see the SUITE tail comment in scripts/selftest-all.js).
 *
 *    In other words: a SUITE-covered entry that nobody invokes directly is a
 *    duplicate of the registry. Run it with `npm run selftest -- <name>`
 *    instead of re-adding an npm script for it.
 *
 * 2. Every SUITE entry points at a real, non-empty, syntactically valid file,
 *    so a registry typo cannot silently shrink the aggregate gate.
 *
 * 3. SUITE names and files are unique — no shadowed aliases like the historical
 *    selftest:port / selftest:localapiport double registration of one file.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const appRoot = path.join(__dirname, '..', '..');
const repoRoot = path.join(appRoot, '..');

// Require the registry itself — no re-declared copy here.
const { SUITE } = require(path.join(appRoot, 'scripts', 'selftest-all.js'));

const pkg = JSON.parse(fs.readFileSync(path.join(appRoot, 'package.json'), 'utf8'));
const scripts = pkg.scripts || {};
const npmSelftests = Object.keys(scripts).filter((k) => k === 'selftest' || k.startsWith('selftest:'));

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`  FAIL  ${name} - ${error.message}`);
    process.exitCode = 1;
  }
};

// ---------------------------------------------------------------- corpus ---
// Files whose references legitimize keeping a package.json entry: workflows,
// the gate/validators that read package.json, and documentation. A mention
// anywhere else (e.g. a source comment) does NOT count — that is exactly how
// the duplication drifted back in before.
function collectFiles(dir, exts, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '__pycache__') continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectFiles(full, exts, out);
    else if (exts.some((ext) => name.endsWith(ext))) out.push(full);
  }
  return out;
}

const corpusFiles = [
  ...fs.readdirSync(path.join(repoRoot, '.github', 'workflows'))
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .map((f) => path.join(repoRoot, '.github', 'workflows', f)),
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'README_CN.md'),
  path.join(repoRoot, 'README_EN.md'),
  ...collectFiles(path.join(repoRoot, 'docs'), ['.md'], []),
  path.join(appRoot, 'automation', 'README.md'),
  // Validators that read package.json directly: their required lists are
  // functional references, not documentation.
  path.join(appRoot, 'automation', 'selftests', 'fingerprint-release-gate-selftest.js'),
  path.join(appRoot, 'automation', 'selftests', 'fingerprint-release-coverage-selftest.js'),
  path.join(appRoot, 'automation', 'selftests', 'fingerprint-coverage-selftest.js'),
  path.join(appRoot, 'automation', 'final-release-regression-runner.js'),
].filter((f) => fs.existsSync(f));

const corpus = corpusFiles.map((file) => ({ file, text: fs.readFileSync(file, 'utf8') }));

function findReferences(key) {
  // Exact key with a boundary, so "selftest:port" does not match inside
  // "selftest:portsce2e" and a bare "selftest" does not match "selftest:all".
  const pattern = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-zA-Z0-9])`);
  return corpus.filter((c) => pattern.test(c.text)).map((c) => path.relative(repoRoot, c.file));
}

// ------------------------------------------------------- registry sanity ---
check('SUITE registry is non-empty and loaded from scripts/selftest-all.js', () => {
  assert.ok(Array.isArray(SUITE) && SUITE.length >= 80, `SUITE must stay populated (found ${SUITE ? SUITE.length : 0})`);
  for (const [name, script] of SUITE) {
    assert.strictEqual(typeof name, 'string', 'every SUITE entry needs a name');
    assert.strictEqual(typeof script, 'string', `SUITE entry ${name} needs a script path`);
  }
});

check('SUITE registry names and files are unique (no shadowed aliases)', () => {
  const names = SUITE.map(([name]) => name);
  const files = SUITE.map(([, file]) => file);
  const dupNames = names.filter((n, i) => names.indexOf(n) !== i);
  const dupFiles = files.filter((f, i) => files.indexOf(f) !== i);
  assert.deepStrictEqual(dupNames, [], `duplicate SUITE names: ${dupNames.join(', ')}`);
  assert.deepStrictEqual(dupFiles, [], `duplicate SUITE files (same test registered twice): ${dupFiles.join(', ')}`);
});

check('every SUITE entry points at a real, non-empty, syntactically valid file', () => {
  const problems = [];
  for (const [name, script] of SUITE) {
    const full = path.join(appRoot, script);
    if (!fs.existsSync(full)) {
      problems.push(`${name}: ${script} does not exist`);
      continue;
    }
    if (fs.statSync(full).size === 0) {
      problems.push(`${name}: ${script} is empty`);
      continue;
    }
    try {
      execFileSync(process.execPath, ['-c', full], { stdio: 'pipe' });
    } catch (err) {
      problems.push(`${name}: ${script} fails node -c (${err.message.split('\n')[0]})`);
    }
  }
  assert.deepStrictEqual(problems, [], `broken SUITE entries:\n  ${problems.join('\n  ')}`);
});

// --------------------------------------------------- package.json policy ---
function suiteCoverage(key) {
  // "Covered" = the registry already knows how to run this exact test:
  // same name with the same file, or the same file under another name.
  const cmd = scripts[key] || '';
  const m = /^node\s+(.+?)(?:\s+.*)?$/.exec(cmd.trim());
  const file = m ? m[1] : null;
  if (file && SUITE.some(([, script]) => script === file)) return true;
  const entry = SUITE.find(([name]) => name === key);
  return Boolean(entry);
}

check('every package.json selftest:* entry is consumer-referenced or outside SUITE coverage', () => {
  const offenders = [];
  for (const key of npmSelftests) {
    if (!suiteCoverage(key)) continue; // kernel/display-bound etc. — legitimate
    const refs = findReferences(key);
    if (refs.length === 0) {
      offenders.push(
        `${key} (= ${scripts[key]}) is covered by the SUITE registry but referenced by no workflow, validator or doc — ` +
        `delete it and use: npm run selftest -- ${key.replace(/^selftest:?/, '')}`
      );
    }
  }
  assert.deepStrictEqual(offenders, [], `duplicate registry entries in package.json:\n  ${offenders.join('\n  ')}`);
});

check('generic runner and aggregate entries are wired to the single registry', () => {
  assert.strictEqual(scripts.selftest, 'node scripts/selftest-one.js',
    'the bare "selftest" entry must be the generic single-test runner');
  assert.strictEqual(scripts['selftest:all'], 'node scripts/selftest-all.js',
    '"selftest:all" must stay the aggregate runner over the SUITE registry');
  assert.ok(fs.existsSync(path.join(appRoot, 'scripts', 'selftest-one.js')),
    'scripts/selftest-one.js must exist on disk');
});

// --------------------------------------------------- orphan reverse check ---
// The checks above only look "down" (registry -> disk). Orphaned selftest
// files on disk that NO registry, npm script, manifest or sibling module
// mentions used to be invisible: three recovered-* scripts and a broken
// audit tool accumulated that way. This check looks "up" instead: every
// selftest-named file must be reachable from at least one real reference.
check('no orphan selftest files on disk (registered, invoked or required)', () => {
  const scanRoots = ['.', 'automation/selftests', 'automation/protocol', 'rebuild', 'scripts', 'ui'];
  const skipDirs = new Set([
    'node_modules', 'roxy-ui', 'kernels', 'rust-core', 'dist', 'frontend',
    'assets', 'rpa-output', 'reports', 'target', '.workbench-build', '__pycache__',
    '.git', '.kernel-release-cache',
  ]);
  const candidates = [];
  const seen = new Set();
  const walk = (dir) => {
    const entries = fs.readdirSync(path.join(appRoot, dir), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) walk(path.join(dir, entry.name));
      } else if (/\.(js|cjs|mjs)$/.test(entry.name) && /selftest/i.test(entry.name)) {
        const rel = path.join(dir, entry.name);
        if (!seen.has(rel)) { seen.add(rel); candidates.push(rel); }
      }
    }
  };
  for (const root of scanRoots) walk(root);

  // Reference corpus: every remaining text file (excluding each candidate's
  // own content, which self-references its name in output strings).
  const corpusByFile = new Map();
  const readInto = (dir) => {
    const entries = fs.readdirSync(path.join(appRoot, dir), { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) readInto(path.join(dir, entry.name));
      } else if (/\.(js|cjs|mjs|json|md|yml|yaml|html)$/.test(entry.name)) {
        const rel = path.join(dir, entry.name);
        try {
          corpusByFile.set(rel, fs.readFileSync(path.join(appRoot, rel), 'utf8'));
        } catch (_) { /* unreadable files simply do not count as references */ }
      }
    }
  };
  readInto('.');
  // Workflow files live outside the app root and are authoritative consumers.
  for (const wf of fs.readdirSync(path.join(repoRoot, '.github', 'workflows'))) {
    if (wf.endsWith('.yml') || wf.endsWith('.yaml')) {
      corpusByFile.set('.github/workflows/' + wf, fs.readFileSync(path.join(repoRoot, '.github', 'workflows', wf), 'utf8'));
    }
  }
  const manifest = fs.readFileSync(path.join(appRoot, 'rebuild', 'acceptance-manifest.json'), 'utf8');
  const suiteText = JSON.stringify(SUITE);
  const npmValues = Object.values(scripts).join('\n');

  const orphans = [];
  for (const candidate of candidates) {
    const base = path.basename(candidate);
    const baseNoExt = base.replace(/\.(js|cjs|mjs)$/, '');
    if (suiteText.includes(base) || npmValues.includes(base) || manifest.includes(base)) continue;
    let referenced = false;
    for (const [rel, text] of corpusByFile) {
      if (rel === candidate) continue;
      if (text.includes(base) || text.includes(baseNoExt)) { referenced = true; break; }
    }
    if (!referenced) orphans.push(candidate);
  }
  assert.deepStrictEqual(orphans, [],
    `selftest files with no registry, npm, manifest or sibling reference (delete or register them):\n  ${orphans.join('\n  ')}`);
});

const failed = results.filter((r) => !r.ok);
if (!failed.length) {
  console.log(`selftest-registry-consistency-selftest: OK ${results.length}/${results.length}`);
} else {
  console.log(`selftest-registry-consistency-selftest: FAILED ${failed.length}/${results.length}`);
  process.exitCode = 1;
}
