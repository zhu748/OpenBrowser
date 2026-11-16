#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { Module, createRequire } = require('node:module');
const { AgentMcp } = require('../rebuild/agent-mcp');
const { fixture, serviceFixture, staleCallScenario } = require('../automation/selftests/agent-mcp-lifecycle-selftest');
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function loadBaseline(file) {
  const module = new Module(file);
  module.filename = file;
  module.require = createRequire(path.resolve(__dirname, '../rebuild/agent-mcp.js'));
  module._compile(await fs.readFile(file, 'utf8'), file);
  return module.exports.AgentMcp;
}

async function discovery(Mcp) {
  const remote = await fixture(); remote.state.delayMs = 60;
  const samples = [];
  try {
    for (let round = 0; round < 3; round++) {
      const owner = await serviceFixture(remote, Array.from({ length: 8 }, (_, i) => '/bench-' + round + '-' + i), Mcp);
      try {
        const started = performance.now(), definitions = await owner.service.mcp.definitions({});
        samples.push(+(performance.now() - started).toFixed(2)); assert.equal(definitions.length, 8);
      } finally { await owner.close(); }
    }
    assert.equal(remote.state.initialized.length, 24, 'one initialize per server and sample');
    return { servers: 8, syntheticInitializeDelayMs: 60, samplesMs: samples, medianMs: median(samples), peakConcurrentInitializers: remote.state.peak };
  } finally { await remote.close(); }
}

async function main() {
  const args = process.argv.slice(2), option = name => {
    const index = args.indexOf(name);
    if (index < 0) return null;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw Error(name + ' needs a filename');
    return path.resolve(args[index + 1]);
  };
  const baseline = option('--baseline'), output = option('--output');
  const previous = process.env.OPENBROWSER_MASTER_KEY; process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  try {
    const Before = baseline ? await loadBaseline(baseline) : null;
    const before = Before ? await discovery(Before) : null, after = await discovery(AgentMcp);
    assert.ok(after.peakConcurrentInitializers <= 4 && after.peakConcurrentInitializers > 1);
    const staleBefore = Before ? await staleCallScenario(Before) : null, staleAfter = await staleCallScenario();
    assert.equal(staleAfter.staleRemoteCalls, 0); assert.equal(staleAfter.rejected, true);
    const result = { node: process.version, platform: process.platform,
      scope: 'Real loopback MCP HTTP initialize/tools-list calls, actual Agent configuration transactions, three discovery samples over eight fixture servers; deterministic disable-during-connect interleaving',
      discovery: { before, after }, disabledCallRace: { before: staleBefore, after: staleAfter },
      limitations: 'Each fixture handshake waits 60ms. Discovery time excludes setup, disk save and shutdown, and does not measure real remote-service performance. HTTP request dispatch remains irreversible once sent.' };
    const text = JSON.stringify(result, null, 2) + '\n';
    if (output) { await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, text); }
    process.stdout.write(text);
  } finally { if (previous === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = previous; }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
