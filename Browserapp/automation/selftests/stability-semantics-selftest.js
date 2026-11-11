#!/usr/bin/env node
'use strict';

/** Stable mode keeps sparse deterministic nonzero perturbations; skipHosts
 * retains normal noise. Runtime realm parity is covered by fpconsistency. */

const assert = require('assert');
const { resolveStabilityPolicy } = require('../fingerprint');

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

// 1. Target high-risk host matches stability policy -> active === true, noiseAmplitude === 1
check('resolveStabilityPolicy: www.amazon.com active is true with noiseAmplitude 1', () => {
  const res = resolveStabilityPolicy({}, { host: 'www.amazon.com' });
  assert.strictEqual(res.active, true, 'amazon.com must match stability.hosts');
  assert.strictEqual(res.noiseAmplitude, 1, 'stability active must set noiseAmplitude to 1');
  assert.strictEqual(res.sampleStepDivisor, 128, 'stability active must set sampleStepDivisor to 128');
});

// 2. Host on skipHosts exception table -> active === false, noiseAmplitude === 3 (retains normal noise)
check('resolveStabilityPolicy: www.sephora.com active is false with noiseAmplitude 3', () => {
  const res = resolveStabilityPolicy({}, { host: 'www.sephora.com' });
  assert.strictEqual(res.active, false, 'sephora.com must be skipped from stability');
  assert.strictEqual(res.skipped, true, 'skipped flag must be true');
  assert.strictEqual(res.noiseAmplitude, 3, 'skipped host must keep default noiseAmplitude 3');
  assert.strictEqual(res.sampleStepDivisor, 64, 'skipped host must keep default sampleStepDivisor 64');
});

// 3. Subdomain on wildcard skipHosts (cdn.*) -> active === false
check('resolveStabilityPolicy: cdn.sephora.com active is false via cdn. wildcard', () => {
  const res = resolveStabilityPolicy({}, { host: 'cdn.sephora.com' });
  assert.strictEqual(res.active, false, 'cdn.* wildcard must skip stability');
  assert.strictEqual(res.skipped, true, 'skipped flag must be true');
  assert.strictEqual(res.noiseAmplitude, 3, 'skipped host must keep default noiseAmplitude 3');
});

// 4. Neutral host not in stability.hosts -> active === false, noiseAmplitude === 3
check('resolveStabilityPolicy: example.com active is false with noiseAmplitude 3', () => {
  const res = resolveStabilityPolicy({}, { host: 'example.com' });
  assert.strictEqual(res.active, false, 'neutral host must not activate stability');
  assert.strictEqual(res.noiseAmplitude, 3, 'neutral host must keep default noiseAmplitude 3');
});

// 5. mode='off' -> active is always false even on high-risk hosts
check('resolveStabilityPolicy: mode=off forces active to false everywhere', () => {
  const resAmazon = resolveStabilityPolicy({ stabilityMode: 'off' }, { host: 'www.amazon.com' });
  assert.strictEqual(resAmazon.active, false, 'mode=off must disable stability on amazon');
  assert.strictEqual(resAmazon.noiseAmplitude, 3, 'mode=off must use noiseAmplitude 3');

  const resExample = resolveStabilityPolicy({ stabilityMode: 'off' }, { host: 'example.com' });
  assert.strictEqual(resExample.active, false, 'mode=off must disable stability on example');
  assert.strictEqual(resExample.noiseAmplitude, 3);
});

// 6. mode='force' -> active is true everywhere except skipHosts
check('resolveStabilityPolicy: mode=force enables stability everywhere except skipHosts', () => {
  const resExample = resolveStabilityPolicy({ stabilityMode: 'force' }, { host: 'example.com' });
  assert.strictEqual(resExample.active, true, 'mode=force must enable stability on example.com');
  assert.strictEqual(resExample.noiseAmplitude, 1, 'mode=force must use noiseAmplitude 1');

  const resSephora = resolveStabilityPolicy({ stabilityMode: 'force' }, { host: 'www.sephora.com' });
  assert.strictEqual(resSephora.active, false, 'mode=force must still respect skipHosts exception');
  assert.strictEqual(resSephora.skipped, true);
  assert.strictEqual(resSephora.noiseAmplitude, 3, 'skipHosts must retain noiseAmplitude 3');
});

// Stable noise is bounded and sparse, but never collapses the whole distribution to zero.
check('Stable and normal distributions both contain nonzero noise', () => {
  const { noiseDelta } = require('../fingerprint/noise-policy');
  const distributions = [1, 3].map((amp) => Array.from({length:10000}, (_,i) => noiseDelta(i / 10000, amp)));
  for (const values of distributions) assert.deepStrictEqual([...new Set(values)].sort(), [-1, 0, 1]);
  assert.ok(distributions[0].filter(Boolean).length < distributions[1].filter(Boolean).length);
});

const failed = results.filter((r) => !r.ok);
if (!failed.length) {
  console.log(`\nstability-semantics-selftest: OK ${results.length}/${results.length}`);
} else {
  console.log(`\nstability-semantics-selftest: FAILED ${failed.length}/${results.length}`);
  process.exitCode = 1;
}
