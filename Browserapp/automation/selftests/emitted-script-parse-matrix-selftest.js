#!/usr/bin/env node
'use strict';

/**
 * Emitted-script parse matrix gate.
 *
 * The injection source is assembled from template-literal fragments whose inclusion is
 * CFG-driven (runtime-source.js prunes per persona/mode). The escaping layers
 * (string-in-string-in-template) have produced three bugs that only surfaced in
 * darwin-gated or native gates — both effectively skipped in per-push CI. This gate
 * parses, for every persona x mode combination that pruning can emit, both the document
 * script and the worker script with new Function(), so a malformed join or quoting
 * regression fails statically on every push.
 *
 * Complements fingerprint-coverage-selftest.js (four-layer contract) which checks
 * presence, not parseability.
 */

const assert = require('assert');
const {
  buildFingerprint,
  buildInjectionScript,
} = require('../fingerprint');
const { buildWorkerInjectionScript } = require('../fingerprint/worker-injection');

const MODES = ['blocked', 'noise', 'real', 'proxy', 'off'];

function buildFor(os, overrides, identity, extra) {
  return buildFingerprint(
    { os, ...overrides },
    { identity, seed: `seed-${identity}`, privacy: {}, ...(extra || {}) },
  );
}

function run() {
  const oses = ['windows', 'macos', 'macos_arm', 'linux'];
  let docCount = 0;
  let workerCount = 0;
  const failures = [];

  for (const os of oses) {
    for (const webrtcMode of MODES) {
      for (const fonts of [true, false]) {
        for (const deviceProfile of ['pool', 'persona']) {
          const identity = `pm-${os}-${webrtcMode}-${fonts ? 'f' : 'nf'}-${deviceProfile}`;
          const fp = buildFor(os, {
            webrtc: webrtcMode,
            fontsEnabled: fonts,
            deviceProfile,
            webrtcAddress: webrtcMode === 'proxy' ? '203.0.113.7' : undefined,
          }, identity);
          const label = `${identity}`;

          try {
            const doc = buildInjectionScript(fp, { bridgeToken: `bt-${identity}` });
            new Function(doc);
            docCount++;
          } catch (error) {
            failures.push(`document ${label}: ${error.message}`);
          }

          try {
            const worker = buildWorkerInjectionScript(fp);
            new Function(worker);
            workerCount++;
          } catch (error) {
            failures.push(`worker ${label}: ${error.message}`);
          }
        }
      }
    }
  }

  // Mobile personas exercise different fragment sets (iOS scrub, android tables).
  for (const os of ['android', 'ios']) {
    for (const fonts of [true, false]) {
      const identity = `pm-${os}-${fonts ? 'f' : 'nf'}`;
      const fp = buildFor(os, { fontsEnabled: fonts }, identity);
      try {
        const doc = buildInjectionScript(fp, { bridgeToken: `bt-${identity}` });
        new Function(doc);
        docCount++;
        const worker = buildWorkerInjectionScript(fp);
        new Function(worker);
        workerCount++;
      } catch (error) {
        failures.push(`${identity}: ${error.message}`);
      }
    }
  }

  assert.strictEqual(failures.length, 0,
    `emitted-script parse matrix failures:\n${failures.join('\n')}`);
  console.log(`emitted-script-parse-matrix: OK (document=${docCount} worker=${workerCount} combinations parsed)`);
}

run();
