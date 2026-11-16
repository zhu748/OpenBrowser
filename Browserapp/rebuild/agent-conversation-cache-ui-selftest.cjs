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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-conversation-cache-ui-'));
  let app, page, phase = 'startup'; const errors = [];
  const server = http.createServer(async (req, res) => {
    let text = ''; for await (const chunk of req) text += chunk;
    const input = JSON.parse(text).messages.findLast(message => message.role === 'user').content;
    res.writeHead(200, { 'content-type': 'text/event-stream' });
    res.end('data: ' + JSON.stringify({ choices: [{ delta: { content: '模型回复：' + input } }] }) + '\n\ndata: [DONE]\n\n');
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
      provider: 'openai', model: 'cache-ui-fixture', baseUrl: 'http://127.0.0.1:' + port,
    }), server.address().port);
    page = await openWorkspacePage(app, '/agent-console');
    const editor = () => page.locator('[contenteditable="true"]').first();
    await editor().fill('当前会话');
    const skip = page.getByRole('button', { name: '跳过', exact: true }); if (await skip.isVisible()) await skip.click();
    await page.locator('button.send-button').click();
    await page.getByText('模型回复：当前会话', { exact: true }).first().waitFor();
    await waitUntil(() => page.evaluate(async () => (await globalThis.__localRequest('agent:info')).running === 0));
    const selected = await page.evaluate(() => globalThis.__router.currentRoute.value.params.conversationId);
    await editor().fill('未发送草稿应保留');
    phase = 'background completions';
    const conversations = [];
    for (let i = 0; i < 10; i++) {
      const c = await page.evaluate(async index => {
        const conversation = await globalThis.__localAgentApi.createConversation();
        await globalThis.__localAgentApi.updateConversation(conversation.id, '后台会话 ' + index);
        await globalThis.__localRequest('agent:channel:send', { type: 'conversation.run.start', data: {
          conversationId: conversation.id, message: '后台请求 ' + index, fullAccess: true,
        }, requestId: 'background-' + index });
        return conversation;
      }, i);
      conversations.push(c);
      await waitUntil(() => page.evaluate(async () => (await globalThis.__localRequest('agent:info')).running === 0));
      await page.getByText('模型回复：当前会话', { exact: true }).first().waitFor();
    }
    assert.equal(await page.evaluate(() => globalThis.__router.currentRoute.value.params.conversationId), selected);
    assert.equal(await editor().innerText(), '未发送草稿应保留');
    phase = 'reopen evicted history';
    await page.evaluate(() => {
      const request = globalThis.__agentRequest; globalThis.__cacheDetailReads = [];
      globalThis.__agentRequest = (method, payload) => {
        if (method === 'conversationDetail') globalThis.__cacheDetailReads.push(payload.id);
        return request(method, payload);
      };
    });
    await page.locator('.conversation-item').filter({ hasText: '后台会话 3' }).click();
    await page.getByText('模型回复：后台请求 3', { exact: true }).first().waitFor();
    assert.ok((await page.evaluate(() => globalThis.__cacheDetailReads)).includes(conversations[3].id), 'evicted history must reload through the real backend');
    await page.locator('.conversation-item').filter({ hasText: '当前会话' }).click();
    await page.getByText('模型回复：当前会话', { exact: true }).first().waitFor();
    assert.equal(await editor().innerText(), '未发送草稿应保留');
    assert.deepEqual(errors, []);
    console.log('AGENT_CONVERSATION_CACHE_UI OK (selected response and unsent draft survive 10 background completions; evicted history reloads through IPC)');
  } catch (error) {
    if (page) console.error(await page.evaluate(value => ({ phase: value, url: location.href, body: document.body.innerText.slice(0, 1800) }), phase));
    throw error;
  } finally {
    await app?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
