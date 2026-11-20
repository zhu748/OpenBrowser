'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const { AgentService } = require('../../rebuild/agent-service');
const { AgentStateStore } = require('../../rebuild/agent-state-store');

function agent(root, events = []) {
  return new AgentService({ root, engine: { emit: event => events.push(event) } });
}

async function checkTerminal(root) {
  const events = [];
  const service = agent(root, events);
  try {
    await service.request('config:set', { model: 'fixture' });
    const conversation = await service.request('createConversation');
    let calls = 0;
    service.completion = async () => { calls++; return { content: 'fixture response' }; };
    const save = service.stateStore.save.bind(service.stateStore);
    service.stateStore.save = async (value, scope) => {
      if (value.conversations.some(row => ['completed', 'failed'].includes(row.latestRunStatus))) {
        throw Object.assign(Error('injected disk failure'), { code: 'EIO' });
      }
      return save(value, scope);
    };
    const runId = service.start({ conversationId: conversation.id, message: 'fixture' }, 'fixture');
    await service.active.get(conversation.id).done;
    const terminal = events.map(event => event.payload?.data?.event?.type).filter(type => /run_(completed|failed)/.test(type || ''));
    assert.deepEqual(terminal, ['run_failed']);
    assert.equal(conversation.latestRunStatus, 'failed');
    assert.equal(service.data.logs[0].status, 'failed');
    assert.equal(service.pendingRunSaves.size, 1);
    assert.equal((await new AgentStateStore(service.root).load()).conversations[0].latestRunStatus, 'running');
    service.stateStore.save = save;
    assert.deepEqual(await service.request('retryRunSaves'), { saved: 1 });
    const persisted = await new AgentStateStore(service.root).load();
    assert.equal(persisted.conversations[0].latestRunStatus, 'failed');
    assert.equal(persisted.logs[0].id, runId);
    assert.equal(persisted.logs[0].endReasonCode, 'AGENT_PERSISTENCE_ERROR');
    assert.equal(persisted.logs[0].messages.at(-1).content, 'fixture response');
    assert.equal(calls, 1, 'retry saves the result without calling the model again');
  } finally {
    await service.shutdown();
  }
}

async function waitForClaim(started) {
  const by = Date.now() + 8000;
  while (Date.now() < by) {
    if (started()) return;
    await delay(30);
  }
  throw new Error('Scheduler did not claim the fixture');
}

async function checkSchedule(root) {
  let service = agent(root);
  try {
    await service.request('config:set', { model: 'fixture' });
    const template = (await service.request('userTemplates.createUserTemplate', { name: 'template', metadata: { prompt: 'fixture' } })).data;
    const scheduledAt = new Date(Date.now() - 1000).toISOString();
    const task = (await service.request('userTasks.createUserTask', { name: 'once', userTemplateId: template.id,
      planType: 'once', executeAt: scheduledAt })).data;
    let claims = 0;
    service.start = () => { claims++; }; // Interrupt after the durable claim, before starting the model.
    await waitForClaim(() => claims > 0);
    await service.shutdown();
    service = agent(root);
    service.start = () => { claims++; };
    await service.request('info');
    await delay(1150);
    const rows = service.data.logs.filter(log => log.taskId === task.id);
    assert.equal(claims, 1);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'interrupted');
    assert.equal(rows[0].occurrenceId, task.id + ':' + scheduledAt);
    assert.equal(service.data.tasks[0].enabled, false);
    assert.equal(service.data.tasks[0].nextExecuteAt, null);
    assert.equal((await service.request('conversationDetail', { id: rows[0].conversationId })).messages[0].role, 'user');
  } finally {
    await service.shutdown();
  }
}

async function checkManualScript(root) {
  const service = agent(root);
  const windowIds = Array.from({ length: 9 }, (_, index) => "window-" + index);
  service.engine.profiles = new Map(windowIds.map(id => [id, { id }]));
  try {
    const template = (await service.request('userTemplates.createUserTemplate', {
      name: "Local script", templateType: "script",
      metadata: {
        filename: "test.js",
        params: null,
        scriptSource: 'defineMetadata({name:"test"}); defineParams({type:"object",properties:{size:{type:"integer",default:11990}}}); export function main({size}){return "x".repeat(size)}',
      },
    })).data;
    const task = (await service.request('userTasks.createUserTask', {
      name: "Manual with paused schedule", userTemplateId: template.id, windowIds,
      planType: "cron", cron: "0 0 * * *", enabled: false, metadata: { concurrency: 3 },
    })).data;
    const save = service.stateStore.save.bind(service.stateStore);
    const start = service.start.bind(service);
    let launches = 0;
    service.start = (...args) => { launches++; return start(...args); };
    service.stateStore.save = (value, scope) => {
      if (value.tasks.some(row => row.runtimeTaskLogId)) throw Error("injected manual task claim failure");
      return save(value, scope);
    };
    try {
      await assert.rejects(service.request("runTask", { id: task.id }), /injected manual task claim failure/);
      assert.equal(launches, 0, "a rejected task must never execute the script");
      assert.equal(service.data.conversations.length, 0);
      assert.equal(service.data.logs.length, 0);
    } finally { service.stateStore.save = save; }

    const run = await service.request("runTask", { id: task.id });
    const durable = await new AgentStateStore(service.root).load();
    assert.equal(durable.tasks[0].runtimeTaskLogId, run.taskLogId);
    assert.equal(durable.tasks[0].enabled, false);
    assert.equal(durable.tasks[0].nextExecuteAt, null);
    assert.equal(durable.logs[0].conversationId, run.conversationId);
    await service.active.get(run.conversationId)?.done;
    const result = await service.request("logs:detail", { id: run.taskLogId });
    assert.equal(result.scriptWindows.length, windowIds.length);
    for (const row of result.scriptWindows) {
      assert.equal(row.status, "success");
      assert.match(row.log, /^结果 "x{1000,}…\n$/);
    }
    assert.equal(launches, 1);
  } finally {
    await service.shutdown();
  }
}

async function checkHistoryAndAttachments(root) {
  let service = agent(root);
  try {
    const c = await service.request('createConversation');
    const mentioned = await service.request('uploadFile', { fileName: 'referenced.txt', data: Buffer.from('kept').toString('base64') });
    const stray = await service.request('uploadFile', { fileName: 'unused.txt', data: Buffer.from('stray').toString('base64') });
    const rows = Array.from({ length: 200 }, (_, index) => ({ id: String(index), content: 'x'.repeat(32768) }));
    rows[3].attachments = [mentioned];
    c.messages = rows;
    await service.save();
    assert.equal(service.stateStore.stats.format, 3);
    await service.shutdown();

    service = agent(root);
    let detail = await service.request('conversationDetail', { id: c.id, limit: 4, includeCheckpoint: false });
    assert.deepEqual(detail.messages.map(row => row.id), ['196', '197', '198', '199']);
    assert.equal(service.stateStore.stats.bodyReads, 1, 'a short page reads just the containing segment');
    detail = await service.request('conversationDetail', { id: c.id, cursor: '17', limit: 4, includeCheckpoint: false });
    assert.deepEqual(detail.messages.map(row => row.id), ['13', '14', '15', '16']);
    assert.equal(service.stateStore.stats.bodyReads, 3, 'a page overlapping a boundary reads two segments');
    await assert.rejects(service.request('conversationDetail', { id: c.id, cursor: 'other', includeCheckpoint: false }), /游标/);
    const loaded = service.conversation(c.id);
    loaded.messages.push({ id: '200', content: 'one more message' });
    await service.save({ scope: { conversations: [c.id], logs: [], historyFrom: new Map([[c.id, 200]]) } });
    assert.equal(service.stateStore.stats.lastWrite.records, 1);
    assert.ok(service.stateStore.stats.lastWrite.recordBytes < 320 * 1024);

    await service.request('deleteConversation', { id: c.id });
    await service.files.load();
    for (const file of service.files.index.files) file.createdAt = 1;
    assert.equal((await service.request('files:cleanup')).removed, 1);
    const usage = await service.request('files:usage');
    assert.equal(usage.count, 1);
    assert.equal(usage.bytes, 4);
    await assert.rejects(service.files.get(stray.fileId), /附件不存在/);
    assert.equal((await service.files.get(mentioned.fileId)).bytes.toString(), 'kept', 'the previous recoverable snapshot retains its attachment');
  } finally {
    await service.shutdown();
  }
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-durability-'));
  const oldKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = randomBytes(32).toString('hex');
  try {
    await checkTerminal(path.join(root, 'terminal'));
    await checkSchedule(path.join(root, 'schedule'));
    await checkManualScript(path.join(root, 'manual'));
    await checkHistoryAndAttachments(path.join(root, 'history'));
    console.log('AGENT DURABILITY OK (terminal retry, atomic manual task launch, paused schedule, per-window results, occurrence recovery and segmented storage)');
  } finally {
    if (oldKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = oldKey;
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
