#!/usr/bin/env node
'use strict';

// Pure, local catalog CPU time, not download/install or browser startup time.
// Compare the actual implementation at a Git revision against the worktree.
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const current = require('../automation/kernel-versions').filterFirefoxCatalog;
const ref = process.argv[2] || '85411750';
const file = 'Browserapp/automation/kernel-versions.js';
const repo = path.resolve(__dirname, '../..'), filename = path.join(repo, file);
const legacy = new Module(filename, module);
legacy.filename = filename;
legacy.paths = module.paths;
legacy._compile(execFileSync('git', ['show', `${ref}:${file}`], { cwd: repo, encoding: 'utf8' }), filename);
const before = legacy.exports.filterFirefoxCatalog;

function fixture(majors) {
  const releases = {};
  for (let point = 0; point < 12; point++) {
    for (let i = 0; i < majors; i++) {
      const version = `${100 + i}.0.${point}`;
      releases['firefox-' + version] = { category: point ? 'stability' : 'major', version };
      if (point === 5) releases['duplicate-' + version] = { category: 'stability', version };
      if (!point) releases['dev-' + version] = { category: 'dev', version: version + 'b1' };
    }
  }
  return { releases };
}

for (const majors of [25, 100, 200]) {
  const feed = fixture(majors), channels = { FIREFOX_ESR: '116.0.0esr' };
  const expected = before(feed, channels);
  assert.deepEqual(current(feed, channels), expected, 'same rows, channels, limit and ordering');
  const samples = [[], []], functions = [before, current];
  for (let round = 0; round < 25; round++) {
    for (const i of round % 2 ? [1, 0] : [0, 1]) {
      const start = performance.now();
      const result = functions[i](feed, channels);
      const duration = performance.now() - start;
      assert.deepEqual(result, expected);
      if (round >= 4) samples[i].push(duration);
    }
  }
  const [beforeMs, afterMs] = samples.map(times => times.sort((a, b) => a - b)[10]);
  console.log(JSON.stringify({ scope: 'synthetic Mozilla-shaped release history; 21-sample median ms',
    ref, node: process.version, majors, entries: Object.keys(feed.releases).length, rows: expected.length,
    beforeMs: +beforeMs.toFixed(3), afterMs: +afterMs.toFixed(3) }));
}
