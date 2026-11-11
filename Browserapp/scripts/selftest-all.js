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
 * The SUITE array below is the SINGLE test registry: `npm run selftest -- <name>`
 * (scripts/selftest-one.js) resolves names against it, and
 * automation/selftests/selftest-registry-consistency-selftest.js guards the
 * package.json <-> SUITE contract. Both require() this module, so the list is
 * declared exactly once.
 *
 * Scripts kept out of the gate — those needing a real Chromium/display, and
 * the rust-core-* selftests whose prerequisite is a built Rust binary, not
 * Chromium — stay out on purpose; see the SUITE tail comment. Use --list to
 * print the plan.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const { classifySelftestResult } = require('./selftest-status');

// Browserapp root (this runner lives in scripts/); all script paths are
// relative to the app root, not to this file.
const ROOT = path.join(__dirname, '..');

// [registry name, argv script path relative to Browserapp/, flags]
// The name is the canonical identifier used by `npm run selftest -- <name>`
// (scripts/selftest-one.js); it no longer implies an npm script of the same
// name exists — package.json only keeps entries that a workflow, the release
// gate or the docs still invoke directly.
const SUITE = [
  ['selftest:fpconsistency', 'automation/selftests/fingerprint-runtime-consistency-selftest.js'],
  ['selftest:fplifecycle', 'automation/selftests/fingerprint-lifecycle-selftest.js'],
  ['selftest:fpsessionraces', 'automation/selftests/fingerprint-session-races-selftest.js'],
  ['selftest:firefoxcontexts', 'automation/selftests/firefox-context-barrier-selftest.js'],
  ['selftest:teststatus', 'automation/selftests/selftest-status-selftest.js'],
  ['selftest:reviewstorage', 'automation/selftests/review-storage-selftest.js'],
  ['selftest:reviewruntime', 'automation/selftests/review-runtime-selftest.js'],
  ['selftest:reviewupdate', 'automation/selftests/review-update-selftest.js'],
  ['selftest:reviewinputmetrics', 'automation/selftests/review-input-metrics-selftest.js'],
  ['selftest:cloudrecovery', 'automation/selftests/cloud-recovery-selftest.js'],
  ['selftest:environment', 'environment-audit-selftest.js'],
  ['selftest:hardening', 'security-hardening-selftest.js'],
  ['selftest:addresspolicy', 'automation/selftests/address-policy-selftest.js'],
  ['selftest:profilecommands', 'automation/selftests/profile-command-client-selftest.js'],
  ['selftest:runtimemanifest', 'automation/selftests/runtime-manifest-selftest.js'],
  ['selftest:apiroutes', 'automation/selftests/api-route-registry-selftest.js'],
  ['selftest:rpavariables', 'automation/selftests/rpa-variables-selftest.js'],
  ['selftest:editorsave', 'automation/selftests/profile-editor-save-selftest.js'],
  ['selftest:editoropen', 'automation/selftests/profile-editor-open-selftest.js'],
  ['selftest:outbounddns', 'automation/selftests/outbound-dns-policy-selftest.js'],
  ['selftest:archiveconcurrency', 'automation/selftests/archive-trust-concurrency-selftest.js'],
  ['selftest:httpboundaries', 'automation/selftests/http-request-boundaries-selftest.js'],
  ['selftest:rparegistry', 'automation/selftests/rpa-registry-boundaries-selftest.js'],
  ['selftest:rpataskrecords', 'automation/selftests/rpa-task-records-selftest.js'],
  ['selftest:profilerows', 'automation/selftests/profile-rows-selftest.js'],
  ['selftest:profilebatchcollections', 'automation/selftests/profile-batch-collections-selftest.js'],
  ['selftest:synctextmodel', 'automation/selftests/sync-text-model-selftest.js'],
  ['selftest:rpapaths', 'automation/selftests/rpa-paths-selftest.js'],
  ['selftest:credentials', 'automation/selftests/credential-encryption-selftest.js'],
  ['selftest:settings', 'automation/selftests/local-settings-selftest.js'],
  ['selftest:persistenceboundaries', 'automation/selftests/persistence-boundaries-selftest.js'],
  ['selftest:coalesce', 'automation/selftests/coalesced-writer-selftest.js'],
  ['selftest:sqlitediff', 'automation/selftests/sqlite-diff-selftest.js'],
  ['selftest:sqlitenoop', 'automation/selftests/sqlite-noop-selftest.js'],
  ['selftest:sqliteassignments', 'automation/selftests/sqlite-assignments-selftest.js'],
  ['selftest:enginepersistence', 'automation/selftests/engine-persistence-selftest.js'],
  ['selftest:statestorage', 'automation/selftests/state-storage-selftest.js'],
  ['selftest:enginetransaction', 'automation/selftests/engine-transaction-selftest.js'],
  ['selftest:enginesessions', 'automation/selftests/engine-sessions-selftest.js'],
  ['selftest:profilesync', 'automation/selftests/profile-sync-selftest.js'],
  ['selftest:profilerevisions', 'automation/selftests/profile-revisions-selftest.js'],
  ['selftest:cloud', 'automation/selftests/cloud-sync-security-selftest.js'],
  ['selftest:cloudmaintenance', 'automation/selftests/cloud-maintenance-selftest.js'],
  ['selftest:statusrefresh', 'automation/selftests/status-refresh-selftest.js'],
  ['selftest:sessioncontroller', 'automation/selftests/session-controller-selftest.js'],
  ['selftest:cloudrestore', 'automation/selftests/cloud-restore-selftest.js'],
  ['selftest:cloudcrypto', 'automation/selftests/cloud-crypto-selftest.js'],
  ['selftest:cloudtransport', 'automation/selftests/cloud-transport-selftest.js'],
  ['selftest:proxyusage', 'automation/selftests/proxy-usage-index-selftest.js'],
  ['selftest:apikey', 'automation/selftests/api-key-store-selftest.js'],
  ['selftest:apikeyconcurrency', 'automation/selftests/api-key-concurrency-selftest.js'],
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
  ['selftest:cdpdeadline', 'automation/selftests/cdp-http-deadline-selftest.js'],
  ['selftest:validation', 'automation/selftests/input-validation-selftest.js'],
  ['selftest:profilevalues', 'automation/selftests/profile-values-selftest.js'],
  ['selftest:uistatestore', 'automation/selftests/ui-state-store-selftest.js'],
  ['selftest:enginecompose', 'automation/selftests/engine-compose-selftest.js'],
  ['selftest:apiinventory', 'automation/selftests/api-devtools-inventory-selftest.js'],
  ['selftest:launcharguments', 'automation/selftests/launch-arguments-selftest.js'],
  ['selftest:automationipc', 'automation/selftests/automation-ipc-selftest.js'],
  ['selftest:version', 'automation/selftests/version-compare-selftest.js'],
  ['selftest:runtime', 'automation/selftests/runtime-utils-selftest.js'],
  ['selftest:flags', 'automation/selftests/command-line-flags-selftest.js'],
  ['selftest:layout', 'automation/selftests/layout-validation-selftest.js'],
  ['selftest:arrange', 'automation/selftests/window-arrangement-selftest.js'],
  ['selftest:download', 'automation/selftests/downloader-selftest.js'],
  ['selftest:doh', 'automation/selftests/doh-resolver-selftest.js'],
  ['selftest:nav', 'automation/selftests/navigation-policy-selftest.js'],
  ['selftest:crash', 'automation/selftests/crash-report-selftest.js'],
  ['selftest:machineid', 'automation/selftests/machine-id-selftest.js'],
  ['selftest:proxyauth', 'proxy-forwarder-selftest.js'],
  ['selftest:proxyfeature', 'proxy-feature-selftest.js'],
  ['selftest:socks5complete', 'socks5-auth-complete-selftest.js'],
  ['selftest:socks5reset', 'socks5-reset-selftest.js'],
  ['selftest:socks5retry', 'socks5-retry-selftest.js'],
  ['selftest:dnsleakclassify', 'automation/selftests/dns-leak-classify-selftest.js'],
  ['selftest:proxyconcurrency', 'automation/selftests/proxy-concurrency-selftest.js'],
  ['selftest:localapi', 'automation/selftests/local-api-profile-selftest.js'],
  ['selftest:localapiws', 'automation/selftests/local-api-ws-selftest.js'],
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
  ['selftest:cssfontgate', 'automation/selftests/css-font-local-gate-e2e-selftest.js', { darwinOnly: true }],
  ['selftest:cssfontrewrite', 'automation/selftests/css-font-response-rewrite-e2e-selftest.js', { darwinOnly: true }],
  // Rescued from the orphan backlog (P1 audit): real tests of production
  // code that were never registered anywhere, so CI silently never ran them.
  ['selftest:extstate', 'extension-state-unit-selftest.js'],
  ['selftest:extensionsapi', 'automation/selftests/extensions-api-selftest.js'],
  ['selftest:extensionsipc', 'automation/selftests/extensions-ipc-selftest.js'],
  ['selftest:kernelipc', 'automation/selftests/kernel-ipc-selftest.js'],
  ['selftest:profileipc', 'automation/selftests/profile-ipc-selftest.js'],
  ['selftest:rpalifecycle', 'automation/selftests/rpa-lifecycle-selftest.js'],
  ['selftest:rpabudgetexecution', 'automation/selftests/rpa-execution-budget-selftest.js'],
  ['selftest:rpatabrouting', 'automation/selftests/rpa-tab-routing-selftest.js'],
  ['selftest:rpafiles', 'automation/selftests/rpa-file-steps-selftest.js'],
  ['selftest:rpabudget', 'automation/selftests/rpa-store-budget-selftest.js'],
  ['selftest:rpaopen', 'automation/selftests/rpa-open-queue-selftest.js'],
  ['selftest:profile-list', 'profile-list-selftest.js'],
  ['selftest:profilestate', 'automation/selftests/profile-state-selftest.js'],
  ['selftest:refreshscheduler', 'automation/selftests/refresh-scheduler-selftest.js'],
  ['selftest:crx', 'automation/selftests/crx-reader-selftest.js'],
  ['selftest:ui-modules', 'ui-module-load-selftest.js'],
  ['selftest:groupsui', 'automation/selftests/groups-ui-selftest.js'],
  ['selftest:uabuilder', 'automation/selftests/ua-builder-selftest.js'],
  ['selftest:fpreliability', 'automation/selftests/fingerprint-reliability-selftest.js'],
  ['selftest:fpidentity', 'automation/selftests/fingerprint-identity-selftest.js'],
  ['selftest:fprealms', 'automation/selftests/fingerprint-realms-selftest.js'],
  ['selftest:runtimepolicy', 'automation/selftests/runtime-policy-selftest.js'],
  ['selftest:urlpolicy', 'automation/selftests/url-access-policy-selftest.js'],
  ['selftest:mobilepersonas', 'automation/selftests/mobile-personas-selftest.js'],
  ['selftest:fpdeliveryboundaries', 'automation/selftests/fingerprint-delivery-boundaries-selftest.js'],
  ['selftest:profilebatch', 'profile-batch-unit-selftest.js'],
  ['selftest:syncbackpressure', 'sync-backpressure-unit-selftest.js'],
  ['selftest:syncsettings', 'sync-settings-unit-selftest.js'],
  ['selftest:tabmapping', 'tab-mapping-unit-selftest.js'],
  ['selftest:extensionsync', 'automation/selftests/extension-sync-boundaries-selftest.js'],
  ['selftest:extensionpipe', 'automation/selftests/extension-pipe-selftest.js'],
  ['selftest:storeoffline', 'store-offline-selftest.js'],
  ['selftest:storeresponse', 'automation/selftests/store-response-selftest.js'],
  ['selftest:cdpconnection', 'cdp-connection-selftest.js'],
  ['selftest:hostruntime', 'scripts/ensure-host-runtime-selftest.js'],
  ['selftest:workerstorageparity', 'automation/selftests/worker-storage-estimate-parity-selftest.js'],
  ['selftest:iphealth', 'automation/selftests/ip-health-score-selftest.js'],
  ['selftest:templatessrf', 'automation/selftests/template-sync-ssrf-selftest.js'],
  ['selftest:archivedigest', 'automation/selftests/archive-digest-pin-selftest.js'],
  ['selftest:livepatchpayload', 'automation/selftests/inject-livepatch-payload-selftest.js'],
  ['selftest:fontbridge', 'automation/selftests/font-bridge-all-personas-selftest.js'],
  ['selftest:webrtcfbperprofile', 'automation/selftests/webrtc-fallback-perprofile-selftest.js'],
  ['selftest:webrtcfbtitle', 'automation/selftests/webrtc-fallback-title-escape-selftest.js'],
  ['selftest:cssfonthardening', 'automation/selftests/css-font-gate-hardening-selftest.js'],
  ['selftest:proxymultisrc', 'automation/selftests/proxy-multi-source-probe-selftest.js'],
  ['selftest:envicon', 'automation/selftests/env-icon-selftest.js'],
  ['selftest:fontmetricscope', 'automation/selftests/font-metric-scope-e2e-selftest.js'],
  ['selftest:newtabresume', 'automation/selftests/new-tab-resume-first-e2e-selftest.js'],
  ['selftest:kernelflagforensics', 'automation/selftests/kernel-automation-flag-forensics-selftest.js'],
  // Repaired legacy failures (theme legacy-naming residue, fullscreen state
  // commit timing, fpalign CPU/memory options, probebudget keepalive): real
  // tests of production code that were failing or silently not asserting.
  ['selftest:theme', 'theme-modern-selftest.js'],
  ['selftest:fullscreen', 'fullscreen-window-sync-selftest.js'],
  ['selftest:fpalign', 'automation/selftests/fingerprint-alignment-selftest.js'],
  ['selftest:probebudget', 'automation/selftests/proxy-probe-budget-selftest.js'],
  // Native-browser gates (Chromium/Firefox fingerprints on real kernels). They need
  // OPENBROWSER_CHROMIUM_BINARY / OPENBROWSER_FIREFOX_BINARY and a display-less
  // headless run; exit code 2 marks the browser as unavailable (reported as skip).
  ['selftest:fingerprintnative', 'automation/selftests/fingerprint-native-consistency-selftest.js', { nativeOnly: true }],
  ['selftest:firefoxfingerprint', 'automation/selftests/firefox-fingerprint-e2e-selftest.js', { nativeOnly: true }],
  ['pageentry', 'automation/selftests/fingerprint-page-entry-matrix-selftest.js', { nativeOnly: true }],
  ['nativereqheaders', 'automation/selftests/fingerprint-request-headers-selftest.js', { nativeOnly: true }],
  ['sessionfaults', 'automation/selftests/fingerprint-session-faults-selftest.js', { nativeOnly: true }],
  ['concurrencysiso', 'automation/selftests/fingerprint-concurrent-isolation-selftest.js', { nativeOnly: true }],
  ['renderconsistency', 'automation/selftests/fingerprint-render-consistency-selftest.js', { nativeOnly: true }],
  ['permleak', 'automation/selftests/fingerprint-permission-leak-selftest.js', { nativeOnly: true }],
  ['navlifecycle', 'automation/selftests/fingerprint-navigation-lifecycle-selftest.js', { nativeOnly: true }],
  ['interfacesurface', 'automation/selftests/fingerprint-interface-surface-selftest.js', { nativeOnly: true }],
  ['multiplatform', 'automation/selftests/fingerprint-multiplatform-selftest.js', { nativeOnly: true }],
  ['ffworker', 'automation/selftests/firefox-worker-delivery-selftest.js', { nativeOnly: true }],
  ['selftest:ffmitm', 'automation/selftests/firefox-worker-mitm-proxy-selftest.js', { nativeOnly: true }],
  // Registry-consistency guard: with SUITE as the single registry this is
  // what stops package.json from silently re-accumulating duplicate
  // selftest:* entries (P2 single-registry consolidation).
  ['selftest:registry', 'automation/selftests/selftest-registry-consistency-selftest.js'],
  // Out-of-gate scripts and their real prerequisites — they are NOT
  // registered here and keep their individual npm scripts:
  // - selftest.js, live-sync-v4-selftest.js and
  //   browser-startup-diagnostic-selftest.js need a real Chromium/display.
  // - rust-core-*-selftest.js (parity/chaos) need NO Chromium: they use
  //   node builtins only (http/net/child_process + ps) against a built
  //   Rust core binary (npm run build:rustcore output under
  //   Browserapp/rust-core/), which this aggregate gate never builds. They
  //   are covered per push by the rust job in .github/workflows/ci.yml
  //   (build:rustcore + selftest:rustparity + selftest:rustchaos) and by
  //   build-installers.yml on release builds.
  // Entries flagged { darwinOnly: true } need the macOS kernel launcher; their
  // scripts self-skip with a misleading "OK n/n" on Linux, so the runner marks
  // them as explicit skips instead of counting them as passes.
];

const argv = process.argv.slice(2);
const LIST_ONLY = argv.includes('--list');
const PER_SCRIPT_TIMEOUT_MS = 5 * 60 * 1000;

function main() {
  if (LIST_ONLY) {
    for (const [name, script, flags] of SUITE) {
      const mark = flags && flags.darwinOnly ? '  [darwin-only]' : '';
      console.log(`${name.padEnd(28)} ${script}${mark}`);
    }
    console.log(`\n${SUITE.length} scripts`);
    return 0;
  }
  const width = Math.max(...SUITE.map(([name]) => name.length));
  const results = [];
  let failed = 0;
  let skipped = 0;
  let partial = 0;
  for (const [name, script, flags] of SUITE) {
    const scriptPath = path.join(ROOT, script);
    if (flags && flags.darwinOnly && process.platform !== 'darwin') {
      skipped += 1;
      results.push({ name, script, pass: null });
      process.stdout.write(`run  ${name.padEnd(width)}  ${script} ... `);
      console.log('skip (darwin-only: macOS kernel launcher required)');
      continue;
    }
    if (flags && flags.nativeOnly) {
      // Native-browser gates exit 2 when the browser binary env var is unset.
      // Probe availability first so an absent browser is a visible skip, never a pass.
      process.stdout.write(`run  ${name.padEnd(width)}  ${script} ... `);
      const startedNative = Date.now();
      // Native gates launch real browsers and routinely run for minutes; the
      // 60s availability probe must not become the de-facto execution timeout
      // (a SIGTERM here turns a green gate into FAILED).
      const probe = spawnSync(process.execPath, [scriptPath, 'selftest'], {
        cwd: ROOT, encoding: 'utf8', timeout: PER_SCRIPT_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (probe.status === 2) {
        skipped += 1;
        results.push({ name, script, pass: null, outcome: 'skipped' });
        console.log('skip (native-only: browser binary not provided)');
        continue;
      }
      const seconds0 = ((Date.now() - startedNative) / 1000).toFixed(1);
      const status0 = classifySelftestResult(probe);
      results.push({ name, script, pass: status0 === 'passed', outcome: status0, seconds: seconds0, status: probe.status, signal: probe.signal });
      if (status0 === 'failed') failed += 1;
      else if (status0 === 'partial') partial += 1;
      else if (status0 === 'skipped') skipped += 1;
      console.log(status0 === 'passed' ? `ok (${seconds0}s)` : `${status0.toUpperCase()} (exit=${probe.status})`);
      continue;
    }
    const started = Date.now();
    process.stdout.write(`run  ${name.padEnd(width)}  ${script} ... `);
    const res = spawnSync(process.execPath, [scriptPath, 'selftest'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: PER_SCRIPT_TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const status = classifySelftestResult(res);
    const pass = status === 'passed';
    if (status === 'failed') failed += 1;
    else if (status === 'partial') partial += 1;
    else if (status === 'skipped') skipped += 1;
    results.push({ name, script, pass: status === 'failed' ? false : (pass ? true : null),
      outcome: status, seconds, status: res.status, signal: res.signal });
    console.log(pass ? `ok (${seconds}s)` : `${status.toUpperCase()} (exit=${res.status}${res.signal ? ' signal=' + res.signal : ''})`);
    if (!pass && res.stderr) {
      const tail = String(res.stderr).trim().split('\n').slice(-6).join('\n');
      if (tail) console.log(tail.replace(/^/gm, '     '));
    }
  }
  console.log(`\n${SUITE.length - failed - skipped - partial} passed, ${partial} partial, ${skipped} skipped, ${failed} failed`);
  if (failed) {
    console.log('failed scripts:');
    for (const r of results.filter((x) => x.pass === false)) console.log(`  ${r.name}  ${r.script}`);
  }
  return failed || (process.env.OPENBROWSER_REQUIRE_COMPLETE_TESTS === '1' && (partial || skipped)) ? 1 : 0;
}

// The SUITE registry is require()-able without side effects so that
// scripts/selftest-one.js (single-test runner) and
// automation/selftests/selftest-registry-consistency-selftest.js (drift guard)
// share this exact list instead of re-declaring it.
module.exports = { SUITE, PER_SCRIPT_TIMEOUT_MS };

if (require.main === module) process.exit(main());
