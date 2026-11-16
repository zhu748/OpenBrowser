'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { AgentService } = require('../../rebuild/agent-service');
const { compactContext } = require('../../rebuild/context-window');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-agent-boundaries-'));
  const previousKey = process.env.OPENBROWSER_MASTER_KEY;
  process.env.OPENBROWSER_MASTER_KEY = crypto.randomBytes(32).toString('hex');
  let mode = 'truncated', calls = 0;
  const server = http.createServer((req, res) => {
    req.resume();
    const ollama = req.url === '/api/chat';
    res.writeHead(200, { 'content-type': ollama ? 'application/x-ndjson' : 'text/event-stream' });
    if (ollama) {
      res.end(JSON.stringify({ message: { content: 'partial' }, ...(mode === 'valid' ? { done: true } : {}) }) + '\n');
      return;
    }
    const delta = mode === 'truncated-tools' ? { tool_calls: [{ index: 0, id: 'call', function: { name: 'list_profiles', arguments: '{}' } }] }
      : { content: 'partial' };
    const first = { choices: [{ delta }] };
    if (mode === 'length') first.choices[0].finish_reason = 'length';
    // Exercise real SSE events, CRLF, comments, and JSON spread across data lines.
    const data = JSON.stringify(first);
    const split = data.indexOf(':') + 1;
    res.write(': keepalive\r\nevent: message\r\ndata: ' + data.slice(0, split) + '\r\ndata: ' + data.slice(split) + '\r\n\r\n');
    res.end(mode === 'valid' ? 'data: [DONE]\r\n\r\n' : '');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const service = new AgentService({ root, engine: { emit() {}, status() { calls++; return []; } } });
  try {
    await service.request('config:set', { provider: 'openai', baseUrl: 'http://127.0.0.1:' + server.address().port, model: 'fixture' });
    const complete = provider => service.completion({ ...service.data.config, provider }, [{ role: 'user', content: 'test' }], { abort: new AbortController(), events: [], sequence: 0 });
    await assert.rejects(complete('openai'), { code: 'LLM_INCOMPLETE_RESPONSE' });
    await assert.rejects(complete('ollama'), { code: 'LLM_INCOMPLETE_RESPONSE' });
    mode = 'length';
    await assert.rejects(complete('openai'), { code: 'LLM_FINISH_REJECTED' });
    mode = 'valid';
    assert.equal((await complete('openai')).content, 'partial');
    assert.equal((await complete('ollama')).content, 'partial');
    mode = 'truncated-tools';
    const c = await service.request('createConversation');
    service.start({ conversationId: c.id, message: 'test', fullAccess: true }, 'test');
    await service.active.get(c.id).done;
    assert.equal(c.latestRunStatus, 'failed');
    assert.equal(calls, 0, 'an incomplete response must never dispatch even syntactically complete tool arguments');

    const marker = 'EXTERNAL_TOOL_CONTENT';
    const messages = [{ role: 'system', content: 'Original policy' }, { role: 'user', content: 'latest' },
      { role: 'assistant', tool_calls: [{ id: 'old', function: { name: 'read_page', arguments: '{}' } }] },
      { role: 'tool', tool_call_id: 'old', content: marker + 'x'.repeat(6000) },
      { role: 'assistant', tool_calls: [{ id: 'new', function: { name: 'list_tabs', arguments: '{}' } }] },
      { role: 'tool', tool_call_id: 'new', content: '[]' }];
    const result = compactContext(messages, 1500);
    assert.ok(result.removed);
    assert.equal(messages[0].content, 'Original policy');
    assert.ok(messages.filter(m => m.role === 'tool').some(m => m.content.includes(marker)));
    assert.ok(!messages.filter(m => m.role !== 'tool').some(m => String(m.content).includes(marker)));
    assert.equal(messages.at(-1).tool_call_id, messages.at(-2).tool_calls[0].id);
    assert.ok(JSON.stringify(messages).length <= 1500);
    messages[0].content += '\n已执行步骤的简要记录（完整结果保存在本地日志）：\nLEGACY_EXTERNAL_MARKER';
    compactContext(messages, 2000);
    assert.equal(messages[0].content, 'Original policy');
    assert.ok(messages.at(-1).content.includes('LEGACY_EXTERNAL_MARKER'), 'old checkpoints are demoted on resume');

    const file = path.join(root, 'local-agent/state.enc'), committed = await fs.readFile(file);
    const rename = fs.rename;
    fs.rename = async (from, to) => {
      if (to === file) throw Object.assign(Error('injected disk failure'), { code: 'EIO' });
      return rename(from, to);
    };
    try { await assert.rejects(service.request('config:set', { model: 'must-not-commit' }), /disk failure/); }
    finally { fs.rename = rename; }
    assert.equal((await service.request('config:get')).model, 'fixture');
    assert.deepEqual(await fs.readFile(file), committed);
    assert.equal((await fs.readdir(path.dirname(file))).some(name => name.includes('.tmp-')), false);
    await service.request('config:set', { model: 'retry' });
    assert.equal((await service.request('config:get')).model, 'retry');
    console.log('AGENT_EXECUTION_BOUNDARIES OK (SSE/NDJSON termination, no incomplete tool dispatch, tool-data trust, durable save rollback/retry)');
  } finally {
    await service.shutdown();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
    if (previousKey === undefined) delete process.env.OPENBROWSER_MASTER_KEY;
    else process.env.OPENBROWSER_MASTER_KEY = previousKey;
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
