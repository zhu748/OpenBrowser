#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const credentials = require('../credential-crypto');
const { writeRawAtomically } = require('../engine/state-storage');
const { AgentStateStore } = require('../rebuild/agent-state-store');

function fixture(size) {
  return { version: 1, eventProtocolVersion: 2, config: { model: 'fixture', apiKey: 'synthetic-key' },
    conversations: Array.from({ length: size }, (_, i) => ({ id: 'c' + i, title: 'Conversation ' + i,
      latestRunStatus: 'completed', messages: [{ id: 'm' + i, role: 'assistant', content: 'synthetic body '.repeat(600) }],
      checkpoint: { context: [{ role: 'user', content: 'synthetic checkpoint'.repeat(50) }], fullAccess: false } })),
    logs: Array.from({ length: Math.min(size, 500) }, (_, i) => ({ id: 'run-' + i, taskId: i + 1, status: 'success',
      messages: [{ role: 'assistant', content: 'synthetic log'.repeat(100) }],
      events: [{ sequence: 1, event: { type: 'run_completed', data: {} } }] })),
    tasks: [], templates: [], skills: [] };
}

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function scenario(root, size) {
  const directory = path.join(root, String(size));
  await fs.mkdir(directory);
  const data = fixture(size), original = credentials.encryptCredentialJson(data);
  await writeRawAtomically(path.join(directory, 'state.enc'), original);
  const migrating = new AgentStateStore(directory);
  const value = await migrating.load();
  const migrationStart = performance.now();
  await migrating.save(value);
  const migrationMs = performance.now() - migrationStart;
  const store = new AgentStateStore(directory), loadStart = performance.now();
  const loaded = await store.load();
  const loadMs = performance.now() - loadStart;
  assert.equal(store.stats.bodyReads, 0);
  const legacySamples = [], recordSamples = [];
  let written = 0;
  for (let i = 0; i < 3; i++) {
    data.config.model = loaded.config.model = 'edit-' + i;
    let started = performance.now();
    await writeRawAtomically(path.join(directory, 'legacy-benchmark.enc'), credentials.encryptCredentialJson(data));
    legacySamples.push(performance.now() - started);
    started = performance.now();
    await store.save(loaded, { conversations: [], logs: [] });
    recordSamples.push(performance.now() - started);
    const stats = store.stats.lastWrite;
    written = stats.recordBytes + stats.indexBytes + stats.backupBytes;
    assert.equal(stats.records, 0);
    assert.equal(store.stats.bodyReads, 0, 'metadata updates must not load historical bodies');
  }
  loaded.conversations[0].messages.push({ id: 'new', role: 'user', content: 'next turn' });
  await store.save(loaded, { conversations: ['c0'], logs: [] });
  assert.equal(store.stats.lastWrite.records, 1);
  if (size >= 100) assert.ok(written < original.length * .2, 'metadata saves must not approach full-history write volume');
  return { conversations: size, logs: data.logs.length, migrationMs: +migrationMs.toFixed(1),
    metadataLoadMs: +loadMs.toFixed(1), legacySaveMedianMs: +median(legacySamples).toFixed(2),
    recordSaveMedianMs: +median(recordSamples).toFixed(2), legacyEncryptedBytes: original.length,
    metadataWriteBytesIncludingBackup: written, metadataBodyReads: 0,
    singleConversationBodyWrites: store.stats.lastWrite.records, singleConversationRecordBytes: store.stats.lastWrite.recordBytes };
}

async function main() {
  const argv = process.argv.slice(2), sizesAt = argv.indexOf('--sizes'), outputAt = argv.indexOf('--output');
  const sizes = (sizesAt >= 0 ? argv[sizesAt + 1] || '' : '10,100,1000').split(',').map(Number);
  if (sizes.some(size => !Number.isSafeInteger(size) || size < 1 || size > 5000)) throw Error('Invalid history benchmark sizes');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-history-benchmark-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  try {
    const reports = [];
    for (const size of sizes) reports.push(await scenario(root, size));
    const result = { scope: 'Synthetic history, real encryption, fsync and atomic file replacement; three warmed samples per save scenario',
      node: process.version, platform: process.platform, reports };
    const text = JSON.stringify(result, null, 2) + '\n';
    if (outputAt >= 0) {
      if (!argv[outputAt + 1]) throw Error('--output needs a filename');
      const output = path.resolve(argv[outputAt + 1]);
      await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, text);
    }
    process.stdout.write(text);
  } finally {
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = previousKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
