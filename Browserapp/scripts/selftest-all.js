#!/usr/bin/env node
'use strict';

/**
 * Aggregate runner for every dependency-free Node selftest.
 *
 * CI used to invoke ~40 scripts one by one; a new selftest that was not
 * manually added to the workflow silently never ran. This runner executes the
 * full kernel-free suite in one process tree, reports a per-script table, and
 * exits non-zero when ANY script fails — so "which selftests exist" and "which
 * selftests run" can no longer drift apart in the smoke gate.
 *
 * Kernel/display-bound scripts (real Chromium needed) stay out of the gate on
 * purpose — see the SUITE tail comment. Use --list to print the plan.
 */

const { spawnSync } = require('child_process');
const path = require('path');

// Browserapp root (this runner lives in scripts/); all script paths are
// relative to the app root, not to this file.
const ROOT = path.join(__dirname, '..');

// [npm script name, argv script path relative to Browserapp/, flags]
const SUITE = [
  ['selftest', 'environment-audit-selftest.js'],
  ['selftest:hardening', 'security-hardening-selftest.js'],
  ['selftest:credentials', 'automation/selftests/credential-encryption-selftest.js'],
  ['selftest:cloud', 'automation/selftests/cloud-sync-security-selftest.js'],
  ['selftest:apikey', 'automation/selftests/api-key-store-selftest.js'],
  ['selftest:isolation', 'automation/selftests/isolation-fingerprint-selftest.js'],
  ['selftest:isolationasync', 'automation/selftests/isolation-async-lock-selftest.js'],
  ['selftest:i18n', 'i18n-selftest.js'],
  ['selftest:typing', 'automation/selftests/human-typing-selftest.js'],
  ['selftest:templates', 'rpa-template-audit-selftest.js'],
  ['selftest:port', 'automation/selftests/local-api-port-selftest.js'],
  ['selftest:shellguard', 'automation/selftests/shell-guard-selftest.js'],
  ['selftest:portscan', 'automation/selftests/port-scan-protection-selftest.js'],
  ['selftest:integrity', 'automation/selftests/asset-integrity-selftest.js'],
  ['selftest:sched', 'automation/selftests/task-scheduler-selftest.js'],
  ['selftest:queue', 'automation/selftests/task-queue-selftest.js'],
  ['selftest:logsan', 'automation/selftests/utility-selftest.js'],
  ['selftest:objutils', 'automation/selftests/object-utils-selftest.js'],
  ['selftest:cdppool', 'automation/selftests/cdp-connection-pool-selftest.js'],
  ['selftest:validation', 'automation/selftests/input-validation-selftest.js'],
  ['selftest:version', 'automation/selftests/version-compare-selftest.js'],
  ['selftest:runtime', 'automation/selftests/runtime-utils-selftest.js'],
  ['selftest:flags', 'automation/selftests/command-line-flags-selftest.js'],
  ['selftest:layout', 'automation/selftests/layout-validation-selftest.js'],
  ['selftest:arrange', 'automation/selftests/window-arrangement-selftest.js'],
  ['selftest:download', 'automation/selftests/downloader-selftest.js'],
  ['selftest:nav', 'automation/selftests/navigation-policy-selftest.js'],
  ['selftest:crash', 'automation/selftests/crash-report-selftest.js'],
  ['selftest:machineid', 'automation/selftests/machine-id-selftest.js'],
  ['selftest:proxyauth', 'proxy-forwarder-selftest.js'],
  ['selftest:socks5complete', 'socks5-auth-complete-selftest.js'],
  ['selftest:socks5reset', 'socks5-reset-selftest.js'],
  ['selftest:socks5retry', 'socks5-retry-selftest.js'],
  ['selftest:dnsleakclassify', 'automation/selftests/dns-leak-classify-selftest.js'],
  ['selftest:proxyconcurrency', 'automation/selftests/proxy-concurrency-selftest.js'],
  ['selftest:localapi', 'automation/selftests/local-api-profile-selftest.js'],
  ['selftest:localapiws', 'automation/selftests/local-api-ws-selftest.js'],
  ['selftest:localapiport', 'automation/selftests/local-api-port-selftest.js'],
  ['selftest:mcp', 'automation/selftests/mcp-control-selftest.js'],
  ['selftest:profiles', 'profile-workflow-selftest.js'],
  ['selftest:lifecycle', 'lifecycle-selftest.js'],
  ['selftest:proxyformat', 'proxy-format-selftest.js'],
  ['selftest:proxypersist', 'proxy-persistence-selftest.js'],
  ['selftest:startupbarrier', 'automation/selftests/startup-consistency-and-barrier-selftest.js'],
  ['selftest:fpstability', 'automation/selftests/fingerprint-stability-selftest.js'],
  ['selftest:updatetrust', 'automation/update-trust-tool.js'],
  ['selftest:updatechecksum', 'automation/selftests/update-checksum-selftest.js'],
  ['selftest:automation', 'automation/selftests/automation-selftest.js'],
  ['selftest:tzfallback', 'automation/selftests/timezone-country-fallback-selftest.js'],
  ['selftest:persona', 'device-persona-selftest.js'],
  ['selftest:fontpersona', 'font-persona-selftest.js'],
  ['selftest:fingerprintpool', 'automation/selftests/fingerprint-pool-selftest.js'],
  ['selftest:fingerprintcoverage', 'automation/selftests/fingerprint-coverage-selftest.js'],
  ['selftest:cssfontgate', 'automation/selftests/css-font-local-gate-e2e-selftest.js'],
  ['selftest:cssfontrewrite', 'automation/selftests/css-font-response-rewrite-e2e-selftest.js'],
  // Kernel/display-bound scripts stay out of the aggregate gate on purpose:
  // selftest.js, live-sync-v4-selftest.js, rust-core-*-selftest.js,
  // browser-startup-diagnostic-selftest.js and friends need a real Chromium;
  // they keep their individual npm scripts and CI/本地按环境调用。
];

const argv = process.argv.slice(2);
const LIST_ONLY = argv.includes('--list');
const PER_SCRIPT_TIMEOUT_MS = 5 * 60 * 1000;

function main() {
  if (LIST_ONLY) {
    for (const [name, script] of SUITE) console.log(`${name.padEnd(28)} ${script}`);
    console.log(`\n${SUITE.length} scripts`);
    return 0;
  }
  const width = Math.max(...SUITE.map(([name]) => name.length));
  const results = [];
  let failed = 0;
  for (const [name, script] of SUITE) {
    const scriptPath = path.join(ROOT, script);
    process.stdout.write(`run  ${name.padEnd(width)}  ${script} ... `);
    const started = Date.now();
    const res = spawnSync(process.execPath, [scriptPath, 'selftest'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: PER_SCRIPT_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const pass = res.status === 0;
    if (!pass) failed += 1;
    results.push({ name, script, pass, seconds, status: res.status, signal: res.signal });
    console.log(pass ? `ok (${seconds}s)` : `FAIL (exit=${res.status}${res.signal ? ' signal=' + res.signal : ''})`);
    if (!pass && res.stderr) {
      const tail = String(res.stderr).trim().split('\n').slice(-6).join('\n');
      if (tail) console.log(tail.replace(/^/gm, '     '));
    }
  }
  console.log(`\n${SUITE.length - failed}/${SUITE.length} passed, ${failed} failed`);
  if (failed) {
    console.log('failed scripts:');
    for (const r of results.filter((x) => !x.pass)) console.log(`  ${r.name}  ${r.script}`);
  }
  return failed ? 1 : 0;
}

process.exit(main());
