#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { SUITE, PER_SCRIPT_TIMEOUT_MS, runSelftest } = require('./selftest-all');
const { classifySelftestResult } = require('./selftest-status');
const ROOT = path.resolve(__dirname, '..');
const RUNTIMES = ['chromium', 'firefox', 'electron'];

function nativePlan(runtime, suite = SUITE) {
  if (!RUNTIMES.includes(runtime)) throw Error('Unknown native runtime: ' + runtime);
  const tests = [];
  for (const [name, script, options] of suite) {
    if (!options?.nativeOnly) continue;
    if (!Array.isArray(options.runtimes) || !options.runtimes.length ||
        new Set(options.runtimes).size !== options.runtimes.length || options.runtimes.some(value => !RUNTIMES.includes(value)))
      throw Error('Declare native test runtimes: ' + name);
    if (options.runtimes.includes(runtime)) tests.push({ name, script, args: options.argsByRuntime?.[runtime] || [],
      timeoutMs: options.timeoutMs || PER_SCRIPT_TIMEOUT_MS });
  }
  return tests;
}

function runPlan(plan, { execute, saveLog }) {
  if (!plan.length) throw Error('Native test plan is empty');
  return plan.map(test => {
    const started = performance.now();
    const result = execute(test);
    const outcome = classifySelftestResult(result);
    saveLog(test, result);
    // A native gate is intentionally strict: missing prerequisites, partial
    // assertions, crashes and timeouts all prevent a passing report.
    return { ...test, outcome, passed: outcome === 'passed', exitCode: result.status,
      signal: result.signal || null, error: result.error?.message || null,
      durationMs: Math.round(performance.now() - started) };
  });
}

function options(argv) {
  const value = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--list') value.list = true;
    else if (argv[i] === '--runtime' && RUNTIMES.includes(argv[i + 1])) value.runtime = argv[++i];
    else if (argv[i] === '--report' && argv[i + 1]) value.report = path.resolve(argv[++i]);
    else throw Error('Usage: native-test-runner.js --runtime chromium|firefox|electron [--list] [--report file]');
  }
  if (!value.runtime) throw Error('--runtime is required');
  return value;
}

function main(argv = process.argv.slice(2)) {
  const args = options(argv), plan = nativePlan(args.runtime).map(test => ({ ...test,
    sha256: createHash('sha256').update(fs.readFileSync(path.join(ROOT, test.script))).digest('hex'),
  }));
  if (args.list) { console.log(JSON.stringify(plan, null, 2)); return 0; }
  const file = args.report || path.resolve(ROOT, '../work/native-gates', args.runtime, 'report.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const results = runPlan(plan, {
    execute: test => {
      process.stdout.write('run ' + test.name + ' ... ');
      return runSelftest(test.script, test.timeoutMs, test.args);
    },
    saveLog: (test, result) => {
      const log = path.join(path.dirname(file), test.name.replace(/[^a-z0-9_-]/gi, '_') + '.log');
      fs.writeFileSync(log, String(result.stdout || '') + '\n' + String(result.stderr || ''));
      const outcome = classifySelftestResult(result);
      console.log(outcome);
      if (outcome !== 'passed') console.error(String(result.stderr || result.stdout || result.error || '').slice(-6000));
    },
  });
  const report = { runtime: args.runtime, node: process.version, platform: process.platform,
    complete: results.every(result => result.passed), expected: plan.length,
    passed: results.filter(result => result.passed).length, results };
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.passed}/${report.expected} complete; report: ${file}`);
  return report.complete ? 0 : 1;
}

module.exports = { nativePlan, runPlan, options };
if (require.main === module) {
  try { process.exitCode = main(); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
