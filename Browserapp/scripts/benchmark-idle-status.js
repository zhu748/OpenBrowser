'use strict';

// Compare unchanged status requests against the checked-out base without
// touching either revision. This measures the status path, not full UI FPS.
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const Module = require('node:module');
const path = require('node:path');
const current = require('../engine/status-api');
const baselineSource = execFileSync('git', ['show', 'HEAD:Browserapp/engine/status-api.js'], { encoding: 'utf8' });
const baselineModule = new Module(path.resolve(__dirname, '../engine/status-api.js'));
baselineModule._compile(baselineSource, baselineModule.id);
const baseline = baselineModule.exports;

function measure(api, size) {
  const rows = Array.from({ length: size }, (_, index) => ({ id: 'profile-' + index, statusRev: 'instance:' + index }));
  const engine = { status: () => rows, _statusInstance: 'benchmark' };
  const options = { includeWatermark: false, includeCursor: true };
  const cursor = api.statusDelta.call(engine, null, options).cursor;
  for (let i = 0; i < 50; i++) api.statusDelta.call(engine, cursor, options);
  const samples = [];
  const iterations = 1000;
  for (let sample = 0; sample < 5; sample++) {
    const started = performance.now();
    for (let i = 0; i < iterations; i++) {
      const reply = api.statusDelta.call(engine, cursor, options);
      if (reply.rows.length || reply.full) throw new Error('Idle benchmark unexpectedly changed rows');
    }
    samples.push((performance.now() - started) / iterations);
  }
  samples.sort((a, b) => a - b);
  return samples[2];
}

const results = [1000, 10000].map((profiles) => ({ profiles,
  baselineMedianMs: measure(baseline, profiles), optimizedMedianMs: measure(current, profiles),
}));
console.log(JSON.stringify({ node: process.version, scope: 'unchanged statusDelta, 5 samples of 1000 calls, median milliseconds per call', results }, null, 2));
