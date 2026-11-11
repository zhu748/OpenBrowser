#!/usr/bin/env node
'use strict';

// Compare the previous status response contract with the compact trusted IPC
// handler. Sizes are UTF-8 JSON representations, not Electron wire captures.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const statusApi = require('../engine/status-api');
const { sanitizeProfile } = require('../engine/profile-sanitizer');
const { TrackedProfileMap } = require('../engine/profile-revisions');
const { registerProfileIpc } = require('../main/profile-ipc');
const { mergeStatusDelta } = require('../ui/ui-status-controller');

function bytes(value) { return Buffer.byteLength(JSON.stringify(value)); }
function medianSerializationMs(value) {
  const samples = [];
  for (let sample = 0; sample < 7; sample++) {
    const start = performance.now();
    for (let i = 0; i < 100; i++) JSON.stringify(value);
    samples.push((performance.now() - start) / 100);
  }
  return Number(samples.sort((a, b) => a - b)[3].toFixed(6));
}

function scenario(size) {
  const profiles = new TrackedProfileMap(Array.from({ length: size }, (_, i) => {
    const id = `profile-${i}`;
    return [id, sanitizeProfile({ id, name: `环境 ${i}`, number: i + 1,
      os: 'Windows', language: 'en-US', width: 1280, height: 820,
      createdAt: '2026-11-11T00:00:00.000Z', updatedAt: '2026-11-11T00:00:00.000Z',
      startUrl: 'https://example.test/', note: 'sample profile',
      privacy: { cores: 8, memory: 8 }, advanced: {}, networkMode: 'direct',
    })];
  }));
  const engine = { ...statusApi, profiles, networkInfo: new Map(), assignments: new Map(),
    publicRunning: () => ({ running: false, starting: false, port: 0 }) };
  const handlers = new Map();
  registerProfileIpc({ engine, registerTrustedIpc: (name, handler) => handlers.set(name, handler) });
  const compact = (watermark) => handlers.get('profiles:status-delta')(null, watermark);
  const full = engine.statusDelta(null);
  const first = compact(null);
  assert.deepEqual(first.rows, full.rows);
  assert.equal(Object.hasOwn(first, 'watermark'), false);
  const idleBefore = engine.statusDelta(full.watermark);
  const idleAfter = compact(full.watermark);
  assert.deepEqual(mergeStatusDelta(full.rows, idleBefore), mergeStatusDelta(full.rows, idleAfter));
  engine.profiles.set('profile-0', { ...engine.profiles.get('profile-0'), name: 'Changed' });
  const changedBefore = engine.statusDelta(full.watermark);
  const changedAfter = compact(full.watermark);
  assert.equal(changedAfter.rows.length, 1);
  assert.deepEqual(mergeStatusDelta(full.rows, changedBefore), mergeStatusDelta(full.rows, changedAfter));
  const requestBytes = bytes(full.watermark);
  return { profiles: size, requestBytes,
    firstReply: { beforeBytes: bytes(full), afterBytes: bytes(first) },
    idleReply: { beforeBytes: bytes(idleBefore), afterBytes: bytes(idleAfter),
      beforeSerializeMedianMs: medianSerializationMs(idleBefore), afterSerializeMedianMs: medianSerializationMs(idleAfter) },
    idleRoundTrip: { beforeBytes: requestBytes + bytes(idleBefore), afterBytes: requestBytes + bytes(idleAfter) },
    oneChangedReply: { beforeBytes: bytes(changedBefore), afterBytes: bytes(changedAfter) },
  };
}

console.log(JSON.stringify({ node: process.version, measuredAt: new Date().toISOString(), baseline: '528a10a response contract',
  scope: 'real status methods and trusted IPC handler, synthetic sanitized profiles; JSON size only, no desktop or browser',
  parity: true, cases: [10, 100, 1000].map(scenario) }, null, 2));
