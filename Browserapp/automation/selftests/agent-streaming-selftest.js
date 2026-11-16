'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const http = require('node:http');
const { AgentService } = require('../../rebuild/agent-service');
const { createContentEmitter } = require('../../rebuild/agent-content-emitter');

function testEmitter() {
  const events = [], timers = new Map(), errors = [];
  let serial = 0;
  const clock = { interval: 24, maximum: 8,
    setTimer: fn => { timers.set(++serial, fn); return serial; }, clearTimer: id => timers.delete(id) };
  const emitter = createContentEmitter(text => events.push(text), error => errors.push(error), clock);
  emitter.push('首'); assert.deepEqual(events, ['首'], 'first token is immediate');
  emitter.push('🙂'); emitter.push('文');
  assert.equal(timers.size, 1);
  [...timers.values()][0]();
  assert.deepEqual(events, ['首', '🙂文'], 'timer publishes combined Unicode text');
  emitter.push('1234'); emitter.push('5678');
  assert.equal(events.at(-1), '12345678', 'large bursts flush before waiting for a timer');
  emitter.push('结尾'); emitter.close();
  assert.equal(events.join(''), '首🙂文12345678结尾');
  assert.equal(timers.size, 0, 'completion cannot leave a timer publishing after a terminal event');
  emitter.close(); assert.throws(() => emitter.push('late'), /closed/); assert.deepEqual(errors, []);
  const failure = Error('event transport failed');
  const broken = createContentEmitter(text => { if (text !== 'first') throw failure; }, error => errors.push(error), clock);
  broken.push('first'); broken.push('pending'); [...timers.values()][0]();
  assert.deepEqual(errors, [failure]); assert.throws(() => broken.close(), error => error === failure);
}

async function testEventRanges() {
  const source = await fs.readFile(path.resolve(__dirname, '../../roxy-ui/assets/hook-CnJE4hRq.js'), 'utf8');
  const functions = ['Hl', 'Ul', 'Wl', 'Gl', 'Kl', 'ql'].map(name => {
    const match = source.match(new RegExp('^function ' + name + '\\([^]*?^}', 'm'));
    assert.ok(match, 'generated event reducer boundary changed: ' + name); return match[0];
  });
  const { Gl, ql } = new Function(functions.join('\n') + ';return {Gl,ql};')();
  const event = (sequence, text) => ({ conversationId: 'c', runId: 'r', sequence, startSequence: sequence,
    event: { type: 'content_delta', data: { contentId: 'a', text } } });
  const first = event(1, '前🙂'), second = event(2, '后');
  const stream = { runId: 'r', lastSequence: 0, events: [] };
  assert.equal(Gl(stream, first), 'accepted'); assert.equal(Gl(stream, second), 'accepted');
  assert.equal(stream.events.map(value => value.event.data.text).join(''), '前🙂后', 'atomic deltas append instead of replacing preceding text');
  assert.equal(Gl(stream, second), 'duplicate');
  const history = []; ql(history, [first]); ql(history, [second]);
  assert.equal(history.map(value => value.event.data.text).join(''), '前🙂后');
  const replacement = { ...event(2, '前🙂后'), startSequence: 1 };
  ql(history, [replacement]);
  assert.equal(history.length, 1, 'a genuine aggregated range still replaces its preceding fragments');
  assert.equal(history[0].event.data.text, '前🙂后');
}

async function channelFixture(filename = path.resolve(__dirname, '../../rebuild/agent-channel.js'), summaries = []) {
  const { createTaskHistory } = await import('../../rebuild/agent-task-history.mjs');
  const source = (await fs.readFile(filename, 'utf8')).replace(/^import[\s\S]*?from "[^"]+";\n/gm, '');
  assert.ok(!/^import /m.test(source), 'channel fixture must remove only its module imports');
  const snapshots = new Map(summaries.map(log => [log.id, { taskLogId: log.id, conversationId: log.conversationId, revision: 3,
    messages: [{ id: 'u-' + log.id, role: 'user', content: 'input' }, { id: 'a-' + log.id, role: 'assistant', content: 'prefix' }] }]));
  const fixture = { receive: null, read: id => structuredClone(snapshots.get(id)), snapshots, errors: [] };
  const globals = { electronAPI: { on: (_name, fn) => { fixture.receive = fn; } },
    __localUiError: message => fixture.errors.push(message),
    __agentRequest: async (method, p) => {
      if (method === 'info') return { ready: true };
      if (method === 'taskLogs:summary') return summaries;
      if (method === 'activeEvents') return [];
      if (method === 'logs:detail') return fixture.read(p.id);
      throw Error('unexpected request: ' + method);
    } };
  new Function('ref', 'computed', 'createTaskHistory', 'globalThis', 'crypto', 'queueMicrotask', source)(
    value => ({ value }), get => ({ get value() { return get(); } }), createTaskHistory, globals, require('node:crypto'), queueMicrotask);
  fixture.channel = globals.__localAgentChannel(); await fixture.channel.waitUntilConnected();
  fixture.event = (log, sequence, type, data, runId = log.id) => fixture.receive({ id: 'e-' + runId + '-' + sequence,
    type: 'conversation.run.event', data: { runId, conversationId: log.conversationId, assistantMessageId: 'a-' + log.id,
      sequence, timestamp: 1700000000000, event: { type, data } } });
  return fixture;
}

async function testChannel() {
  const logs = Array.from({ length: 500 }, (_, i) => ({ id: 'run-' + i, conversationId: 'c-' + i, taskId: i + 1, status: 'success' }));
  const fixture = await channelFixture(undefined, logs), { channel, event, snapshots } = fixture;
  for (const log of logs) {
    event(log, 1, 'user_message', { messageId: 'u-' + log.id, content: 'input' });
    event(log, 2, 'content_delta', { text: 'unopened output'.repeat(1000) });
    event(log, 3, 'run_completed', {});
  }
  assert.equal(Object.keys(channel.taskExecutionDetails.value).length, 0, 'unopened task output must not bypass the detail-cache limit');
  const log = logs[0]; await channel.loadTaskExecution(log.id);
  const attachment = { fileId: 'attached', fileName: 'fixture.txt' };
  event(log, 4, 'user_message', { messageId: 'u-' + log.id, content: 'input', attachments: [attachment] });
  assert.equal(channel.taskExecutionDetails.value[log.id].messages.length, 2, 'attachment updates replace the existing user message');
  assert.deepEqual(channel.taskExecutionDetails.value[log.id].messages[0].metadata.attachments, [attachment]);
  event(log, 100, 'content_delta', { text: 'WRONG RUN' }, 'other-run');
  assert.equal(channel.taskExecutionDetails.value[log.id].revision, 4, 'a different run in the same conversation cannot edit this log');
  for (let i = 1; i < 20; i++) await channel.loadTaskExecution(logs[i].id);
  assert.equal(Object.keys(channel.taskExecutionDetails.value).length, 12, 'opened and live detail retention share one bounded cache');
  const pending = logs[99], baseline = structuredClone(snapshots.get(pending.id));
  let release, reads = 0;
  fixture.read = id => {
    if (id === pending.id && ++reads === 1) return new Promise(resolve => { release = resolve; });
    return structuredClone(snapshots.get(id));
  };
  const opening = channel.loadTaskExecution(pending.id); await Promise.resolve();
  snapshots.get(pending.id).revision = 4; snapshots.get(pending.id).messages[1].content = 'prefix + tail';
  event(pending, 4, 'content_delta', { text: ' + tail' });
  assert.equal(channel.taskExecutionDetails.value[pending.id], undefined, 'an unbased tail must not replace a pending full snapshot');
  release(baseline); await opening; await new Promise(resolve => setImmediate(resolve));
  assert.equal(reads, 2, 'one trailing read recovers events that arrived during snapshot loading');
  assert.equal(channel.taskExecutionDetails.value[pending.id].messages[1].content, 'prefix + tail');
  event(pending, 5, 'content_delta', { text: ' + live' });
  assert.equal(channel.taskExecutionDetails.value[pending.id].messages[1].content, 'prefix + tail + live');
  fixture.receive({ type: 'task_log.deleted', data: { logId: pending.id } });
  assert.ok(!Object.hasOwn(channel.taskExecutionDetails.value, pending.id));
  assert.ok(!channel.taskLogs.value.some(row => row.id === pending.id));
  assert.deepEqual(fixture.errors, []);
}

async function testTransport() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-stream-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  const frame = text => 'data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\n';
  let mode = 'burst', finishResponse, reached, responseEnded = false;
  const received = [], expected = '甲🙂'.repeat(10000);
  const service = new AgentService({ root, engine: { status: () => [], emit: value => {
    received.push(value.payload);
    if (value.payload.type === 'conversation.run.event' && value.payload.data.event.type === 'content_delta') reached?.();
  } } });
  const server = http.createServer((req, res) => {
    req.resume(); res.writeHead(200, { 'content-type': 'text/event-stream' });
    if (mode === 'burst') { res.end(frame('甲🙂').repeat(10000) + 'data: [DONE]\n\n'); return; }
    res.write(frame('先') + frame('后'));
    if (mode === 'broken') { res.end(); return; }
    finishResponse = () => { responseEnded = true; res.end('data: [DONE]\n\n'); };
    res.on('close', () => { responseEnded = true; });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await service.request('config:set', { provider: 'openai', baseUrl: 'http://127.0.0.1:' + server.address().port, model: 'stream-fixture' });
    service.data.logs = Array.from({ length: 500 }, (_, i) => ({ id: 'old-' + i, taskId: i + 1, status: 'success' }));
    const c = await service.request('createConversation');
    const id = service.start({ conversationId: c.id, message: 'burst', fullAccess: true, taskMeta: { taskId: 501 } }, 'burst');
    await service.active.get(c.id).done;
    const events = received.filter(value => value.type === 'conversation.run.event' && value.data.runId === id).map(value => value.data);
    const deltas = events.filter(value => value.event.type === 'content_delta');
    assert.ok(deltas.length < 100, 'tiny provider frames must not produce thousands of IPC/replay records');
    assert.equal(deltas.map(value => value.event.data.text).join(''), expected);
    assert.equal(c.messages.at(-1).content, expected);
    assert.equal(events.at(-1).event.type, 'run_completed');
    assert.ok(events.every((value, i) => value.sequence === i + 1 && value.startSequence === value.sequence));
    assert.equal(service.data.logs.length, 500);
    assert.ok(received.some(value => value.type === 'task_log.deleted' && value.data.logId === 'old-499'), 'durable log eviction must remove the renderer summary too');
    assert.equal((await service.request('taskLogs:summary')).length, 500);
    const reopened = await new (require('../../rebuild/agent-state-store').AgentStateStore)(service.root).load();
    assert.equal(reopened.conversations[0].messages.at(-1).content, expected);
    mode = 'broken';
    service.start({ conversationId: c.id, message: 'broken', fullAccess: true }, 'broken');
    await service.active.get(c.id).done;
    assert.equal(c.latestRunStatus, 'failed');
    assert.equal(c.messages.at(-1).content, '先后', 'incomplete responses still flush their final partial text before failure');
    assert.equal(c.messages.at(-1).events.at(-1).event.type, 'run_failed');
    mode = 'pause';
    let resolveFlushed, pendingProbe;
    const flushed = new Promise(resolve => { resolveFlushed = resolve; });
    reached = () => {
      pendingProbe ||= service.request('logs:detail', { id: running.id });
      const text = received.filter(value => value.type === 'conversation.run.event' && value.data.runId === running?.id &&
        value.data.event.type === 'content_delta').map(value => value.data.event.data.text).join('');
      if (text === '先后') resolveFlushed();
    };
    service.start({ conversationId: c.id, message: 'pause', fullAccess: true, taskMeta: { taskId: 502 } }, 'pause');
    const running = service.active.get(c.id);
    let timeout;
    try { await Promise.race([flushed, new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('pending model text never flushed')), 5000); })]); }
    finally { clearTimeout(timeout); }
    assert.equal(responseEnded, false, 'a provider waiting for more data must not hold back already received text');
    const snapshot = await pendingProbe;
    const published = running.events.filter(value => value.sequence <= snapshot.revision && value.event.type === 'content_delta')
      .map(value => value.event.data.text).join('');
    assert.equal(snapshot.messages.at(-1).content, published, 'detail snapshots cannot contain pending text beyond their published sequence');
    running.abort.abort(); await running.done;
    assert.equal(c.latestRunStatus, 'cancelled');
    assert.equal(c.messages.at(-1).content, '先后');
    const count = received.length; await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal(received.length, count, 'cancelled streams must not publish late timer events');
    finishResponse();
  } finally {
    await service.shutdown(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY; else process.env.OPENBROWSER_MASTER_KEY = previousKey;
  }
}

async function main() {
  testEmitter(); await testEventRanges(); await testChannel(); await testTransport();
  console.log('AGENT_STREAMING OK (immediate first token, bounded batching, timer cleanup/errors, unopened retention, cache limits, attachments, run identity and pending snapshot races)');
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { channelFixture };
