'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { AgentService } = require('../../rebuild/agent-service');
const { AgentFiles } = require('../../rebuild/agent-files');

async function testLoader() {
  const { createTaskHistory } = await import('../../rebuild/agent-task-history.mjs');
  assert.throws(() => createTaskHistory({ maximum: 0 }), /cache limit/);
  const pending = [], published = [], dropped = [], errors = [], busy = [];
  const existing = new Set(['a', 'b', 'c']);
  const history = createTaskHistory({ maximum: 2,
    read: id => new Promise((resolve, reject) => pending.push({ id, resolve, reject })),
    exists: id => existing.has(id), publish: (id, value) => published.push([id, value]),
    drop: id => dropped.push(id), busy: value => busy.push(value), onError: error => errors.push(error),
  });
  const value = (id, revision = 1) => ({ taskLogId: id, revision, messages: [{ content: id }] });
  const a = history.select('a'), secondA = history.select('a');
  await Promise.resolve(); assert.equal(pending.length, 1, 'duplicate clicks share a single detail request');
  const b = history.select('b'); await Promise.resolve();
  pending[1].resolve(value('b')); await b;
  assert.equal(busy.at(-1), false, 'an obsolete detail request must not keep the current viewer loading');
  pending[0].resolve(value('a')); assert.equal(await a, null); assert.equal(await secondA, null);
  const c = history.select('c'); await Promise.resolve(); pending[2].resolve(value('c')); await c;
  assert.ok(dropped.includes('b'), 'detail cache is bounded');
  const late = history.select('a'); await Promise.resolve();
  history.remove('a'); existing.delete('a'); pending[3].resolve(value('a', 2));
  assert.equal(await late, null);
  assert.ok(!published.some(([id, row]) => id === 'a' && row.revision === 2), 'deleted logs cannot be resurrected by late replies');
  const selected = history.select('b'); await Promise.resolve();
  history.refresh('b'); history.refresh('b');
  pending[4].resolve(value('b', 2)); await selected; await new Promise(resolve => setImmediate(resolve));
  assert.equal(pending.length, 6, 'updates during a request trigger one trailing refresh');
  pending[5].resolve(value('b', 3)); await new Promise(resolve => setImmediate(resolve));
  assert.equal(published.at(-1)[1].revision, 3);
  // A response from before a reconnect must not consume the dirty flag of a
  // new request for the same log.
  const old = history.select('b'); await Promise.resolve();
  history.reset();
  const afterReset = history.select('b'); await Promise.resolve(); history.refresh('b');
  pending[6].resolve(value('b', 4)); assert.equal(await old, null);
  pending[7].resolve(value('b', 5)); await afterReset; await new Promise(resolve => setImmediate(resolve));
  assert.equal(pending.length, 9);
  pending[8].resolve(value('b', 6)); await new Promise(resolve => setImmediate(resolve));
  assert.equal(published.at(-1)[1].revision, 6);
  const fail = history.select('c'); await Promise.resolve(); pending[9].reject(Error('fixture failure'));
  await assert.rejects(fail, /fixture failure/);
  assert.equal(busy.at(-1), false);
  history.clearSelection(); history.reset();
  assert.equal(errors.length, 0);
}

async function main() {
  await testLoader();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-history-'));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  let service = new AgentService({ root, engine: { emit() {}, status: () => [] } });
  try {
    await service.load();
    const c = await service.request('createConversation');
    c.messages.push({ id: 'm', role: 'assistant', content: 'visible body' });
    c.checkpoint = { context: [{ role: 'tool', content: 'PRIVATE_CHECKPOINT'.repeat(10000) }] };
    service.data.logs = Array.from({ length: 20 }, (_, i) => ({ id: 'run-' + i, conversationId: c.id, taskId: 1,
      taskName: 'Task ' + i, status: 'success', input: 'PRIVATE_INPUT'.repeat(2000),
      events: [{ sequence: 1, event: { type: 'tool_finished', data: { text: 'PRIVATE_EVENT'.repeat(2000) } } }],
      messages: [{ id: 'a', role: 'assistant', content: 'visible log ' + i }], checkpoint: c.checkpoint }));
    await service.shutdown();
    service = new AgentService({ root, engine: { emit() {}, status: () => [] } });
    await service.load();
    assert.equal(service.stateStore.stats.bodyReads, 0);
    await service.request('updateConversation', { id: c.id, title: 'Renamed without reading body' });
    await service.request('markConversationRead', { id: c.id });
    assert.equal(service.stateStore.stats.bodyReads, 0, 'title and unread updates must preserve lazy history');
    const summaries = await service.request('taskLogs:summary');
    assert.equal(summaries.length, 20);
    assert.equal(summaries[0].eventCount, 1);
    assert.ok(!JSON.stringify(summaries).includes('PRIVATE_'));
    assert.equal(service.stateStore.stats.bodyReads, 0, 'task-list hydration is metadata-only');
    const detail = await service.request('logs:detail', { id: 'run-0' });
    assert.equal(detail.messages[0].content, 'visible log 0');
    assert.equal(detail.revision, 1);
    assert.ok(!JSON.stringify(detail).includes('PRIVATE_'), 'viewer DTO omits duplicate events, prompts and checkpoints');
    assert.equal(service.stateStore.stats.bodyReads, 1);
    const conversation = await service.request('conversationDetail', { id: c.id, includeCheckpoint: false });
    assert.ok(!Object.hasOwn(conversation.conversation, 'checkpoint'));
    assert.equal(conversation.messages[0].content, 'visible body');

    const files = new AgentFiles({ root: path.join(root, 'file-fixture') });
    const first = await files.upload({ fileName: 'first.txt', data: Buffer.from('PRIVATE_FILE').toString('base64') });
    const indexFile = path.join(files.root, 'index.enc'), committed = await fs.readFile(indexFile), rename = fs.rename;
    fs.rename = async (from, to) => { if (to === indexFile) throw Object.assign(Error('index failure'), { code: 'EIO' }); return rename(from, to); };
    try { await assert.rejects(files.upload({ fileName: 'rejected.txt', data: Buffer.from('reject').toString('base64') }), /index failure/); }
    finally { fs.rename = rename; }
    assert.deepEqual(await fs.readFile(indexFile), committed);
    assert.deepEqual((await fs.readdir(files.root)).sort(), [first.fileId + '.enc', 'index.enc'].sort());
    const fresh = new AgentFiles({ root: path.join(root, 'file-fixture') }), readFile = fs.readFile;
    let once = true;
    fs.readFile = async (...args) => { if (args[0] === indexFile && once) { once = false; throw Object.assign(Error('temporary read failure'), { code: 'EIO' }); } return readFile(...args); };
    try { await assert.rejects(fresh.load(), /temporary/); await fresh.load(); }
    finally { fs.readFile = readFile; }
    assert.equal((await fresh.get(first.fileId)).bytes.toString(), 'PRIVATE_FILE');
    console.log('AGENT_HISTORY OK (metadata-only IPC, on-demand details, checkpoint omission, cache limits/races, durable attachments and retry)');
  } finally {
    await service.shutdown();
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    await fs.rm(root, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
