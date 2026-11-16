#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { AgentStateStore } = require('../rebuild/agent-state-store');
const { nextRecordId } = require('../rebuild/local-record-ids');
const { conversationCacheFixture } = require('../rebuild/selftest-conversation-cache.cjs');

async function retention(sourceFile, count) {
  const { state, touch } = await conversationCacheFixture(sourceFile);
  for (let i = 0; i < count; i++) {
    const id = 'c' + i, runId = 'r' + i;
    state.conversationsById[id] = { id, runningRunIds: [] };
    state.messagesByConversationId[id] = [{ role: 'assistant', status: 'done', content: 'rendered '.repeat(100) }];
    state.runsById[runId] = { conversationId: id, status: 'completed' };
    state.streamsByRunId[runId] = { conversationId: id,
      events: Array.from({ length: 10 }, (_, n) => ({ sequence: n + 1, text: 'synthetic event '.repeat(30) })) };
    touch(state, id);
  }
  return { conversations: count, cachedMessages: Object.keys(state.messagesByConversationId).length,
    retainedRuns: Object.keys(state.runsById).length, retainedStreams: Object.keys(state.streamsByRunId).length,
    selectedConversationRetained: Object.hasOwn(state.messagesByConversationId, 'c0'),
    serializedProjectionBytes: Buffer.byteLength(JSON.stringify({ messages: state.messagesByConversationId,
      runs: state.runsById, streams: state.streamsByRunId })) };
}

async function references(root, count) {
  const directory = path.join(root, String(count)); await fs.mkdir(directory);
  const initial = new AgentStateStore(directory); await initial.load();
  await initial.save({ version: 1, eventProtocolVersion: 2, config: {}, templates: [], tasks: [], skills: [], logs: [],
    conversations: Array.from({ length: count }, (_, i) => ({ id: 'c' + i, title: 'fixture ' + i,
      messages: [{ role: 'assistant', content: 'synthetic history '.repeat(500) }],
      checkpoint: { taskMeta: { templateId: 10000 + i }, context: [{ role: 'tool', content: 'synthetic checkpoint '.repeat(100) }] } })) });
  const sample = async indexed => {
    const store = new AgentStateStore(directory), data = await store.load();
    const started = performance.now();
    const ids = data.conversations.map(row => indexed ? store.templateReference(row) : row.checkpoint?.taskMeta?.templateId);
    const allocatedId = nextRecordId({ templates: [] }, 'templates', ids);
    return { conversations: count, bodyReads: store.stats.bodyReads, allocatedId,
      elapsedMs: +(performance.now() - started).toFixed(2) };
  };
  const before = await sample(false), after = await sample(true);
  assert.equal(before.bodyReads, count); assert.equal(after.bodyReads, 0);
  assert.equal(after.allocatedId, before.allocatedId);
  return { before, after };
}

async function main() {
  const args = process.argv.slice(2), option = name => {
    const index = args.indexOf(name);
    if (index < 0) return null;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw Error(name + ' needs a filename');
    return path.resolve(args[index + 1]);
  };
  const baseline = option('--baseline-hook'), output = option('--output');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-retention-benchmark-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  try {
    const before = baseline ? await retention(baseline, 1000) : null, after = await retention(undefined, 1000);
    assert.equal(after.retainedStreams, 3); assert.equal(after.cachedMessages, 3); assert.equal(after.selectedConversationRetained, true);
    const projection = [];
    for (const count of [100, 1000]) projection.push(await references(root, count));
    const report = { node: process.version, platform: process.platform,
      scope: 'Actual generated conversation cache entry points with plain-state fixtures; original checkpoint scan versus indexed ID projection over identical real encrypted records',
      idleCache: { before, after }, templateIdProjection: projection,
      limitations: 'Serialized projection bytes are not heap usage. ID timings exclude index load and save. Existing V2 indexes without projected references require a one-time lazy fallback. Active/selected/approval state is protected; this is not an absolute total-memory cap.' };
    const text = JSON.stringify(report, null, 2) + '\n';
    if (output) { await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, text); }
    process.stdout.write(text);
  } finally {
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = previousKey;
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
