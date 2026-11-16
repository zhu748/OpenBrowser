'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { _electron: electron } = require('playwright');
const { openWorkspacePage, waitUntil } = require('./selftest-helpers.cjs');

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-stream-ui-'));
  const prefix = '起始🙂' + '甲'.repeat(1000), suffix = '乙'.repeat(500) + '完成';
  const frame = content => 'data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\n';
  let app, page, response;
  const errors = [];
  const server = http.createServer((req, res) => {
    req.resume(); res.writeHead(200, { 'content-type': 'text/event-stream' }); response = res;
    res.write(frame('起始🙂') + frame('甲').repeat(1000));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    app = await electron.launch({ executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.resolve(__dirname, '..')],
      env: { ...process.env, OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0', OPENBROWSER_MASTER_KEY: crypto.randomBytes(32).toString('hex') } });
    page = await app.firstWindow(); await page.setViewportSize({ width: 1536, height: 960 });
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => !!globalThis.__localRequest);
    await page.evaluate(port => globalThis.__localRequest('agent:config:set', {
      provider: 'openai', model: 'streaming-ui-fixture', baseUrl: 'http://127.0.0.1:' + port,
    }), server.address().port);
    page = await openWorkspacePage(app, '/agent-console/templates');
    const conversation = await page.evaluate(() => globalThis.__localAgentApi.createConversation());
    await page.evaluate(id => globalThis.__router.push({ name: 'agent-console-conversation', params: { conversationId: id } }), conversation.id);
    await page.evaluate(id => globalThis.__localRequest('agent:channel:send', { type: 'conversation.run.start',
      data: { conversationId: id, message: '流式重载验收', fullAccess: true }, requestId: 'streaming-ui' }), conversation.id);
    const text = () => page.locator('.chat-message.assistant').last().innerText();
    await waitUntil(async () => (await text()).includes(prefix));
    const active = await page.evaluate(() => globalThis.__localRequest('agent:activeEvents'));
    assert.ok(active.filter(value => value.data.event.type === 'content_delta').length < 20);
    await page.evaluate(() => globalThis.__localAgentChannel().reconnect());
    await waitUntil(async () => (await text()).includes(prefix));
    assert.equal((await text()).split(prefix).length - 1, 1, 'reconnect must not duplicate already displayed deltas');
    await page.reload();
    await page.locator('.conversation-item').filter({ hasText: '流式重载验收' }).click();
    await waitUntil(async () => (await text()).includes(prefix));
    response.end(frame('乙').repeat(500) + frame('完成') + 'data: [DONE]\n\n');
    await waitUntil(async () => (await text()).includes(prefix + suffix));
    await waitUntil(() => page.evaluate(async () => (await globalThis.__localRequest('agent:info')).running === 0));
    assert.equal((await text()).split(prefix + suffix).length - 1, 1);
    const history = await page.evaluate(id => globalThis.__localAgentApi.conversationDetail(id), conversation.id);
    assert.equal(history.messages.at(-1).content, prefix + suffix);
    assert.equal(history.conversation.latestRunStatus, 'completed');
    assert.deepEqual(errors, []);
    console.log('AGENT_STREAMING_UI OK (1502 tiny Unicode deltas over real SSE, paused provider, reconnect, full renderer reload, exact final DOM and persisted message)');
  } catch (error) {
    if (page) console.error(await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 2500) })));
    throw error;
  } finally {
    response?.end(); await app?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
