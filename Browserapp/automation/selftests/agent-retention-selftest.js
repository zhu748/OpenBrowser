'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const credentials = require('../../credential-crypto');
const { AgentService } = require('../../rebuild/agent-service');

async function testCache() {
  const { touchConversationCache, evictConversationCache } = await import('../../rebuild/agent-conversation-cache.mjs');
  const state = { conversationsById: {}, draftsByConversationId: {}, queuedPromptsByConversationId: {}, pendingHitlByConversationId: {},
    messagesByConversationId: {}, runsById: {}, streamsByRunId: {}, todoProgressByRunId: {} };
  const active = new Set(), evicted = [], recent = new Map(); let selected = 'c0';
  const options = { recent, maximum: 3, isActive: id => active.has(id), selected: () => selected, onEvict: id => evicted.push(id) };
  const add = i => {
    const id = 'c' + i, runId = 'r' + i;
    state.conversationsById[id] = { id, title: 'conversation ' + i };
    state.messagesByConversationId[id] = [{ content: 'message ' + i }];
    state.runsById[runId] = { conversationId: id, status: 'completed' };
    state.streamsByRunId[runId] = { conversationId: id, events: [{ text: 'heavy '.repeat(1000) }] };
    state.todoProgressByRunId[runId] = { total: 1 };
    touchConversationCache(state, id, options); return id;
  };
  const first = add(0);
  state.draftsByConversationId[first] = { prompt: 'unsent', attachments: [{ preview: 'blob:fixture' }] };
  state.queuedPromptsByConversationId[first] = [{ content: 'queued' }];
  for (let i = 1; i < 1000; i++) add(i);
  assert.equal(Object.keys(state.messagesByConversationId).length, 3);
  assert.equal(Object.keys(state.streamsByRunId).length, 3, 'eviction must release raw event history as well as rendered messages');
  assert.equal(Object.keys(state.runsById).length, 3);
  assert.ok(state.messagesByConversationId[first], 'background completions must not blank the selected conversation');
  assert.equal(Object.keys(state.conversationsById).length, 1000, 'metadata remains available for history navigation');
  selected = 'c999';
  assert.equal(evictConversationCache(state, first, options), true);
  assert.equal(state.draftsByConversationId[first].prompt, 'unsent');
  assert.equal(state.draftsByConversationId[first].attachments[0].preview, 'blob:fixture');
  assert.equal(state.queuedPromptsByConversationId[first][0].content, 'queued');
  active.add('c1000'); add(1000); assert.equal(evictConversationCache(state, 'c1000', options), false);
  state.pendingHitlByConversationId.c1001 = { approvalId: 'pending' }; add(1001);
  assert.equal(evictConversationCache(state, 'c1001', options), false, 'pending approval remains available');
  state.streamsByRunId.orphan = { conversationId: 'c999', events: ['orphan payload'] };
  selected = undefined; active.delete('c1000');
  assert.equal(evictConversationCache(state, 'c999', options), true);
  assert.ok(!state.streamsByRunId.orphan, 'orphaned streams without run metadata are evicted too');
  assert.ok(evicted.length > 990);
}

async function testTemplateReferences() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-references-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  let service = new AgentService({ root, engine: { emit() {}, status: () => [] } });
  const open = async () => { service = new AgentService({ root, engine: { emit() {}, status: () => [] } }); await service.load(); };
  const create = name => service.request('userTemplates.createUserTemplate', { name, metadata: { prompt: 'fixture' } });
  try {
    await service.load();
    service.data.conversations = Array.from({ length: 20 }, (_, i) => ({ id: 'c' + i, title: 'fixture', messages: [{ role: 'assistant', content: 'heavy '.repeat(10000) }],
      checkpoint: { taskMeta: { templateId: i === 19 ? 900 : i + 1 }, context: [{ role: 'tool', content: 'checkpoint '.repeat(10000) }] } }));
    await service.shutdown(); await open();
    assert.equal(service.stateStore.stats.bodyReads, 0);
    assert.equal((await create('new template')).data.id, 901, 'checkpoint-only references cannot be reused');
    assert.equal(service.stateStore.stats.bodyReads, 0, 'creating a template must use authenticated index references');
    for (const row of service.data.conversations)
      assert.equal(typeof Object.getOwnPropertyDescriptor(row, 'checkpoint').get, 'function');
    await service.shutdown();
    const file = path.join(root, 'local-agent/state.enc');
    const legacyIndex = credentials.decryptCredentialJson(await fs.readFile(file));
    for (const entry of legacyIndex.conversations) delete entry.body.templateReference;
    await fs.writeFile(file, credentials.encryptCredentialJson(legacyIndex));
    await open();
    assert.equal((await create('older V2')).data.id, 902);
    assert.equal(service.stateStore.stats.bodyReads, 20, 'old V2 references are resolved once on demand');
    assert.equal((await create('second')).data.id, 903);
    assert.equal(service.stateStore.stats.bodyReads, 20);
    for (const row of service.data.conversations)
      assert.equal(typeof Object.getOwnPropertyDescriptor(row, 'checkpoint').get, 'function', 'fallback reads must not retain complete historic bodies');
    await service.shutdown(); await open();
    assert.equal((await create('reopened')).data.id, 904);
    assert.equal(service.stateStore.stats.bodyReads, 0, 'the enriched index survives restart');
    const c = service.data.conversations[0]; c.checkpoint = { taskMeta: { templateId: 1200 } };
    assert.equal((await create('modified checkpoint')).data.id, 1201, 'loaded, edited checkpoints take precedence over the older reference');
    await service.shutdown();
    const damaged = credentials.decryptCredentialJson(await fs.readFile(file));
    damaged.conversations[0].body.templateReference = -1;
    await fs.writeFile(file, credentials.encryptCredentialJson(damaged));
    await assert.rejects(new (require('../../rebuild/agent-state-store').AgentStateStore)(path.dirname(file)).load(), /Invalid Agent template reference/);
  } finally {
    await service.shutdown(); await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = previousKey;
  }
}

async function testLateHistoryRetention() {
  const fixture = await require('../../rebuild/selftest-conversation-cache.cjs').conversationCacheFixture();
  const { state, touch } = fixture;
  for (let i = 0; i < 1000; i++) {
    const id = 'c' + i, runId = 'r' + i;
    state.conversationsById[id] = { id, runningRunIds: [] };
    state.messagesByConversationId[id] = [{ role: 'assistant', status: 'done', content: 'cached answer' }];
    state.runsById[runId] = { conversationId: id, status: 'completed' };
    state.streamsByRunId[runId] = { conversationId: id, events: ['raw event payload'] };
    touch(state, id);
  }
  assert.equal(Object.keys(state.streamsByRunId).length, 3, 'cache entry points must release raw history');
  assert.equal(Object.keys(state.messagesByConversationId).length, 3);
  assert.ok(state.messagesByConversationId.c0, 'the selected conversation stays pinned');
  state.conversationsById.late = { id: 'late', runningRunIds: [] };
  let release;
  const load = fixture.detailLoader(() => new Promise(resolve => { release = resolve; }));
  const pending = load('late');
  for (let i = 1000; i < 1010; i++) {
    const id = 'c' + i;
    state.conversationsById[id] = { id, runningRunIds: [] };
    state.messagesByConversationId[id] = [{ role: 'assistant', status: 'done' }];
    touch(state, id);
  }
  release({ conversation: state.conversationsById.late, messages: [{ role: 'user', content: 'late response' }] });
  await pending;
  assert.equal(Object.keys(state.messagesByConversationId).length, 3, 'a late detail response must enroll in cache retention again');
  assert.ok(state.messagesByConversationId.c0);
  assert.ok(state.messagesByConversationId.late);
}

async function main() {
  await testCache(); await testLateHistoryRetention(); await testTemplateReferences();
  console.log('AGENT_RETENTION OK (bounded idle messages and streams, selected/active/approval pinning, unsent work, indexed template IDs and lazy legacy fallback)');
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { testCache };
