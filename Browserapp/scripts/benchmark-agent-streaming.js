#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { AgentService } = require('../rebuild/agent-service');
const { completion } = require('../rebuild/agent-completion');
const { channelFixture } = require('../automation/selftests/agent-streaming-selftest');

async function transportSample(complete, baseUrl, frames) {
  let ipcBytes = 0;
  const service = { files: { context: async value => value }, mcp: { definitions: async () => [] },
    engine: { emit: value => { ipcBytes += Buffer.byteLength(JSON.stringify(value)); } },
    emit: AgentService.prototype.emit, event: AgentService.prototype.event };
  const run = { id: 'benchmark-run', cid: 'benchmark-conversation', assistantId: 'benchmark-assistant',
    turnId: 'benchmark-turn', sequence: 0, events: [], abort: new AbortController() };
  const started = performance.now();
  const message = await complete(service, { provider: 'openai', baseUrl, model: String(frames) }, [{ role: 'user', content: 'synthetic stream' }], run, []);
  const elapsedMs = +(performance.now() - started).toFixed(2);
  assert.equal(message.content, '甲🙂'.repeat(frames));
  assert.equal(run.events.map(event => event.event.data.text).join(''), message.content);
  return { providerFrames: frames, events: run.events.length, ipcBytes,
    replayBytes: Buffer.byteLength(JSON.stringify(run.events)), elapsedMs };
}

async function retainedSample(source, count) {
  const logs = Array.from({ length: count }, (_, i) => ({ id: 'run-' + i, conversationId: 'c-' + i, taskId: i + 1 }));
  const fixture = await channelFixture(source, logs);
  for (const log of logs) {
    fixture.event(log, 1, 'user_message', { messageId: 'u-' + log.id, content: 'input' });
    fixture.event(log, 2, 'content_delta', { text: 'synthetic unopened response '.repeat(1000) });
    fixture.event(log, 3, 'run_completed', {});
  }
  const retained = fixture.channel.taskExecutionDetails.value;
  return { unopenedLogs: count, retainedDetails: Object.keys(retained).length,
    serializedDetailBytes: Buffer.byteLength(JSON.stringify(retained)) };
}

async function main() {
  const args = process.argv.slice(2), option = name => {
    const index = args.indexOf(name);
    if (index < 0) return null;
    if (!args[index + 1] || args[index + 1].startsWith('--')) throw Error(name + ' needs a filename');
    return path.resolve(args[index + 1]);
  };
  const baseline = option('--baseline'), channelBaseline = option('--channel-baseline'), output = option('--output');
  const server = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    const frames = Number(JSON.parse(body).model);
    assert.ok(Number.isSafeInteger(frames) && frames >= 1 && frames <= 10000);
    const frame = 'data: ' + JSON.stringify({ choices: [{ delta: { content: '甲🙂' } }] }) + '\n\n';
    res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end(frame.repeat(frames) + 'data: [DONE]\n\n');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const baseUrl = 'http://127.0.0.1:' + server.address().port, reports = [];
    for (const frames of [1000, 10000]) {
      const before = baseline ? await transportSample(require(baseline).completion, baseUrl, frames) : null;
      const after = await transportSample(completion, baseUrl, frames);
      assert.ok(after.events < frames / 10, 'tiny frames should be coalesced before IPC and persistence');
      reports.push({ before, after });
    }
    const retainedBefore = channelBaseline ? await retainedSample(channelBaseline, 500) : null;
    const retainedAfter = await retainedSample(undefined, 500);
    assert.equal(retainedAfter.retainedDetails, 0);
    const result = { node: process.version, platform: process.platform,
      scope: 'Synthetic tiny-token SSE over real loopback HTTP, actual Agent event envelopes and serialization; authored channel executed with reactive-ref stubs for retention accounting',
      reports, retention: { before: retainedBefore, after: retainedAfter },
      caveat: 'Elapsed time is a single local sample, not an SLA. Serialized retained-detail bytes do not measure process heap. Encryption and file I/O are outside this benchmark.' };
    const text = JSON.stringify(result, null, 2) + '\n';
    if (output) { await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, text); }
    process.stdout.write(text);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
