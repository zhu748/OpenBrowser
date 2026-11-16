'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { _electron: electron } = require('playwright');
const credentials = require('../credential-crypto');
const { openWorkspacePage } = require('./selftest-helpers.cjs');

async function launch(root, key) {
  const app = await electron.launch({ executablePath: require('electron'),
    args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.resolve(__dirname, '..')],
    env: { ...process.env, OPENBROWSER_ROXY_UI: '1', OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0', OPENBROWSER_MASTER_KEY: key } });
  const page = await app.firstWindow();
  await page.setViewportSize({ width: 1536, height: 960 });
  await page.waitForFunction(() => !!globalThis.__localRequest && !!globalThis.__router);
  return { app, page };
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ob-history-restart-ui-'));
  const key = crypto.randomBytes(32).toString('hex');
  const legacy = { version: 1, eventProtocolVersion: 2,
    config: { provider: 'ollama', model: 'history-fixture', baseUrl: 'http://127.0.0.1:11434', apiKey: '', maxContext: 24000 },
    conversations: Array.from({ length: 200 }, (_, i) => ({ id: 'history-' + i, title: '历史记录 ' + i,
      updatedAt: new Date(1700000000000 + i * 1000).toISOString(), latestRunStatus: 'completed', latestRunId: 'run-' + i, unread: false,
      messages: [{ id: 'user-' + i, role: 'user', content: '历史问题 ' + i }, { id: 'assistant-' + i, role: 'assistant', content: '持久化回复 ' + i }],
      checkpoint: { context: [{ role: 'user', content: 'CHECKPOINT_NOT_FOR_RENDERER'.repeat(1000) }], fullAccess: false } })),
    logs: [], templates: [], tasks: [], skills: [] };
  await fs.mkdir(path.join(root, 'local-agent'));
  const original = credentials.encryptCredentialJson(legacy, { mode: 'aes-gcm', passphrase: key });
  await fs.writeFile(path.join(root, 'local-agent/state.enc'), original);
  let app, page;
  try {
    ({ app, page } = await launch(root, key));
    await page.evaluate(() => globalThis.__localRequest('agent:config:set', { model: 'migrated-fixture' }));
    assert.deepEqual(await fs.readFile(path.join(root, 'local-agent/state.legacy.enc')), original);
    await app.close(); app = null;
    ({ app, page } = await launch(root, key));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page = await openWorkspacePage(app, '/agent-console/templates');
    const entry = page.locator('.conversation-item').filter({ hasText: '历史记录 199' });
    await entry.waitFor();
    let info = await page.evaluate(() => globalThis.__localRequest('agent:info'));
    assert.equal(info.storage.format, 2);
    assert.equal(info.storage.bodyReads, 0, 'startup and sidebar history must not decrypt conversation bodies');
    await page.getByRole('button', { name: '创建模板', exact: true }).last().click();
    await page.getByPlaceholder('请输入模板名称', { exact: true }).fill('无历史正文读取的模板');
    await page.getByRole('button', { name: '提示词', exact: true }).last().click();
    await page.locator('[contenteditable="true"]').last().fill('索引引用验收');
    await page.getByRole('button', { name: '仅保存', exact: true }).click();
    await page.getByText('无历史正文读取的模板', { exact: true }).first().waitFor();
    info = await page.evaluate(() => globalThis.__localRequest('agent:info'));
    assert.equal(info.storage.bodyReads, 0, 'creating a template through the original dialog must not load 200 historical checkpoints');
    await entry.click();
    await page.getByText('持久化回复 199', { exact: true }).first().waitFor();
    info = await page.evaluate(() => globalThis.__localRequest('agent:info'));
    assert.equal(info.storage.bodyReads, 1, 'opening a conversation reads just that encrypted record');
    const history = await page.evaluate(() => globalThis.__localAgentApi.conversationDetail('history-199'));
    assert.ok(!Object.hasOwn(history.conversation, 'checkpoint'));
    assert.ok(!JSON.stringify(history).includes('CHECKPOINT_NOT_FOR_RENDERER'));
    assert.deepEqual(errors, []);
    console.log('AGENT_HISTORY_UI OK (real Electron legacy migration, encrypted backup, process restart, lazy sidebar/template creation, on-demand message and bounded DTO)');
  } catch (error) {
    if (page) console.error(await page.evaluate(() => ({ url: location.href, body: document.body.innerText.slice(0, 2500) })));
    throw error;
  } finally { await app?.close(); await fs.rm(root, { recursive: true, force: true, maxRetries: 3 }); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
