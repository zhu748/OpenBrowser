'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { unwrapIpcResult } = require('../shared/ipc-result');
const { createTestDirectory, waitUntil } = require('./selftest-helpers.cjs');
const { workbookFixture, cell } = require('./selftest-profile-xlsx.cjs');

async function exerciseProfiles(page, call) {
  const button = name => page.getByRole('button', { name, exact: true });
  const row = text => page.getByRole('row').filter({ hasText: text });
  const nav = name => page.getByRole('navigation', { name: '工作台' }).getByRole('link', { name, exact: true });

  await page.getByText('暂无窗口', { exact: true }).waitFor();
  const project = await call('groups:save', { projectName: '源码配置项目' });
  await button('创建窗口').click();
  await page.getByLabel('名称', { exact: true }).fill('源码窗口');
  await page.getByLabel('操作系统', { exact: true }).selectOption('Linux');
  await page.getByLabel('项目', { exact: true }).selectOption({ label: '源码配置项目' });
  await page.getByLabel('启动网址', { exact: true }).fill('https://example.test/start');
  await page.getByLabel('窗口宽度', { exact: true }).fill('1440');
  await page.getByLabel('启动时清理缓存', { exact: true }).check();
  await button('创建').click();
  await row('源码窗口').waitFor();
  const [profile] = await call('profiles:list');
  assert.equal(profile.os, 'Linux');
  assert.equal(profile.projectId, project.id);
  assert.deepEqual(profile.defaultOpenUrl, ['https://example.test/start']);
  assert.equal(profile.openWidth, 1440);
  assert.equal(profile.clearCacheFile, true);
  await row('源码窗口').getByRole('button', { name: '编辑', exact: true }).click();
  await page.getByLabel('名称', { exact: true }).fill('待保存名称');
  await call('profiles:patch', { ids: [profile.id], patch: { windowRemark: '后端更新的备注' } });
  await button('保存').click();
  await page.getByRole('alert').filter({ hasText: '窗口配置已变更' }).waitFor();
  assert.equal(await page.getByLabel('名称', { exact: true }).inputValue(), '待保存名称');
  await button('重新读取').click();
  await waitUntil(async () => (await page.getByLabel('备注', { exact: true }).inputValue()) === '后端更新的备注');
  await page.getByLabel('名称', { exact: true }).fill('已修改窗口');
  await page.getByLabel('启动网址', { exact: true }).fill('');
  await button('保存').click();
  await row('已修改窗口').waitFor();
  assert.deepEqual((await call('profiles:read', { id: profile.id })).defaultOpenUrl, []);

  await page.getByRole('link', { name: '批量创建', exact: true }).click();
  await page.getByLabel('名称前缀', { exact: true }).fill('分页窗口');
  await page.getByLabel('窗口数量', { exact: true }).fill('20');
  await button('创建').click();
  await page.getByText('第 1 / 2 页，共 21 个窗口', { exact: true }).waitFor();
  await button('下一页').click();
  await page.getByText('第 2 / 2 页，共 21 个窗口', { exact: true }).waitFor();
  await button('移入回收站').click();
  await button('确认移入回收站').click();
  await page.getByText('第 1 / 1 页，共 20 个窗口', { exact: true }).waitFor();
  await page.getByLabel('搜索名称或备注', { exact: true }).fill('后端更新');
  await button('搜索').click();
  await page.getByText('第 1 / 1 页，共 1 个窗口', { exact: true }).waitFor();
  await row('已修改窗口').waitFor();

  await nav('回收站').click();
  const [recycled] = await call('profiles:trash');
  assert.ok(recycled.id);
  await button('恢复').click();
  await page.getByText('回收站为空', { exact: true }).waitFor();
  await call('profiles:delete', { ids: [recycled.id] });
  await button('永久删除').click();
  await button('取消').click();
  assert.equal((await call('profiles:trash')).length, 1);
  await button('永久删除').click();
  await button('确认永久删除').click();
  await page.getByText('回收站为空', { exact: true }).waitFor();
  assert.deepEqual(await call('profiles:trash'), []);
}

async function exerciseImport(app, page, call, data) {
  const invalid = path.join(data, 'invalid.txt'), txt = path.join(data, 'source.txt'), xlsx = path.join(data, 'source.xlsx');
  await fs.writeFile(invalid, 'windowName=不会写入\nos=Linux\n####\nwindowName=错误窗口\nos=无效系统');
  await fs.writeFile(txt, '\uFEFFwindowName=TXT 源码窗口\nos=Linux\nwindowRemark=参数=a####b\n####\n');
  await fs.writeFile(xlsx, workbookFixture([
    `<row r="1">${cell('A1', 'windowName')}${cell('B1', 'os')}${cell('C1', 'windowRemark')}</row><row r="2">${cell('A2', 'XLSX 源码窗口')}${cell('B2', 'Linux')}${cell('C2', '工作簿备注')}</row>`,
  ]));
  const paths = [null, invalid, txt, xlsx];
  await app.evaluate(({ dialog, ipcMain }, fixtures) => {
    dialog.showOpenDialog = async () => {
      const file = fixtures.shift();
      return file ? { canceled: false, filePaths: [file] } : { canceled: true, filePaths: [] };
    };
    const original = ipcMain._invokeHandlers.get('rebuild:request');
    let fail = true;
    ipcMain.removeHandler('rebuild:request');
    ipcMain.handle('rebuild:request', (event, method, payload) => {
      if (method === 'profiles:import' && fail) {
        fail = false;
        return { ipcResult: 1, ok: false, error: { message: '模拟导入保存失败' } };
      }
      return original(event, method, payload);
    });
  }, paths);
  const startingCount = (await call('profiles:list')).length;
  await page.getByRole('link', { name: '导入窗口', exact: true }).click();
  const choose = page.getByRole('button', { name: '选择 TXT / XLSX 文件', exact: true });
  const confirm = page.getByRole('button', { name: '确认导入', exact: true });
  await choose.click();
  await waitUntil(() => choose.isEnabled());
  assert.equal(await confirm.count(), 0, 'cancellation must not create a preview');
  await choose.click();
  await page.getByRole('alert').filter({ hasText: /第 4 行.*操作系统/ }).waitFor();
  assert.equal((await call('profiles:list')).length, startingCount);
  await choose.click();
  await page.getByRole('heading', { name: 'source.txt · 1 个窗口待导入' }).waitFor();
  assert.equal((await call('profiles:list')).length, startingCount);
  await confirm.click();
  await page.getByRole('alert').filter({ hasText: '模拟导入保存失败' }).waitFor();
  assert.equal((await call('profiles:list')).length, startingCount);
  await confirm.click();
  await page.getByText('已导入 1 个窗口', { exact: true }).waitFor();
  await choose.click();
  await page.getByRole('heading', { name: 'source.xlsx · 1 个窗口待导入' }).waitFor();
  await confirm.click();
  await page.getByText('已导入 1 个窗口', { exact: true }).waitFor();
  const rows = await call('profiles:list');
  assert.equal(rows.length, startingCount + 2);
  assert.equal(rows.find(row => row.windowName === 'TXT 源码窗口').windowRemark, '参数=a####b');
  assert.equal(rows.find(row => row.windowName === 'XLSX 源码窗口').windowRemark, '工作簿备注');
}

async function exerciseTemplates(page, call) {
  const button = name => page.getByRole('button', { name, exact: true });
  await page.getByRole('link', { name: '窗口模板', exact: true }).click();
  await page.getByText('暂无模板', { exact: true }).waitFor();
  if (process.env.OPENBROWSER_TEST_KERNEL_BINARY) {
    await call('templates:save', { templateName: '源码模板', content: JSON.stringify({ os: 'Linux', coreType: 'Chrome',
      startupParam: '--headless=new', sandboxPermission: true, defaultOpenUrl: ['about:blank'], openWorkbench: 0,
      isDisplayLanguageBaseIp: false, isTimeZone: false, isPositionBaseIp: false }) });
    await button('刷新列表').click();
  } else {
    await button('创建模板').click();
    await page.getByLabel('名称', { exact: true }).fill('源码模板');
    await button('保存').click();
  }
  await button('使用 / 修改').click();
  await page.getByLabel('备注', { exact: true }).fill('模板写入备注');
  await button('保存').click();
  await button('使用 / 修改').click();
  await page.getByRole('link', { name: '用此模板创建窗口', exact: true }).click();
  await page.getByRole('heading', { name: '创建窗口', exact: true }).waitFor();
  assert.equal(await page.getByLabel('备注', { exact: true }).inputValue(), '模板写入备注');
  await page.getByLabel('名称', { exact: true }).fill('从模板创建');
  await button('创建').click();
  await page.getByRole('link', { name: '窗口管理', exact: true }).waitFor();
  const search = page.getByLabel('搜索名称或备注', { exact: true });
  await search.fill('从模板创建');
  await button('搜索').click();
  const row = page.getByRole('row').filter({ hasText: '从模板创建' });
  await row.getByText('模板写入备注', { exact: true }).waitFor();
  if (process.env.OPENBROWSER_TEST_KERNEL_BINARY) {
    await row.getByRole('button', { name: '启动', exact: true }).click();
    await row.getByRole('button', { name: '停止', exact: true }).waitFor({ timeout: 60_000 }).catch(async error => {
      const feedback = await page.getByRole('alert').allTextContents();
      throw Error('启动从模板创建的窗口失败' + (feedback.length ? `（${feedback.join('，')}）` : ''), { cause: error });
    });
    await row.getByRole('button', { name: '停止', exact: true }).click();
    await row.getByRole('button', { name: '启动', exact: true }).waitFor({ timeout: 45_000 });
  }
}

async function exerciseProxies(app, page, call, data) {
  const exported = path.join(data, 'exported-proxy.json');
  await app.evaluate(({ app, dialog }, destination) => {
    const { join } = process.mainModule.require('node:path');
    const { BrowserEngine } = process.mainModule.require(join(app.getAppPath(), 'engine.js'));
    BrowserEngine.prototype.testProxy = async () => ({ ok: true, ip: '203.0.113.11', countryCode: 'US' });
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination });
  }, exported);
  const button = name => page.getByRole('button', { name, exact: true });
  const row = name => page.getByRole('listitem').filter({ hasText: name });
  const nav = name => page.getByRole('navigation', { name: '工作台' }).getByRole('link', { name, exact: true });

  await nav('代理库').click();
  await page.getByText('暂无代理', { exact: true }).waitFor();
  await button('新增代理').click();
  await page.getByLabel('名称', { exact: true }).fill('源码代理');
  await page.getByLabel('地址', { exact: true }).fill('192.0.2.10');
  await page.getByLabel('端口', { exact: true }).fill('8080');
  await page.getByLabel('用户名', { exact: true }).fill('mock-user');
  await page.getByLabel('密码', { exact: true }).fill('mock-password');
  await button('保存代理').click();
  await row('源码代理').waitFor();
  const [saved] = await call('proxies:summaries');
  assert.equal(saved.name, '源码代理');
  for (const key of ['username', 'password', 'raw', 'chromeUrl']) assert.ok(!Object.hasOwn(saved, key));
  assert.equal((await call('proxies:read', { id: saved.id })).password, 'mock-password');

  await button('检测').click();
  const detection = await page.getByRole('status').filter({ hasText: '检测完成' }).or(page.getByRole('alert')).textContent();
  assert.equal(detection, '检测完成，出口 IP 为 203.0.113.11');
  await button('导出（含认证）').click();
  await page.getByText('已导出 1 条代理', { exact: true }).waitFor();
  assert.equal(JSON.parse(await fs.readFile(exported, 'utf8')).proxies[0].password, 'mock-password');

  await button('编辑').click();
  assert.equal(await page.getByLabel('用户名', { exact: true }).inputValue(), 'mock-user');
  await page.getByLabel('清除认证', { exact: true }).check();
  await page.getByLabel('端口', { exact: true }).fill('8181');
  await button('保存代理').click();
  await row('源码代理').getByText(/192\.0\.2\.10:8181/).waitFor();
  const updated = await call('proxies:read', { id: saved.id });
  assert.equal(updated.port, 8181);
  assert.equal(updated.password, '');
  assert.equal(updated.username, '');

  await button('批量新增').click();
  await page.getByLabel('代理地址', { exact: true }).fill('socks5://192.0.2.21:1080\nhttp://192.0.2.22:8080');
  await button('保存代理').click();
  await page.getByText('已新增 2 条代理', { exact: true }).waitFor();
  await page.getByLabel('筛选协议', { exact: true }).selectOption('socks5');
  await row('192.0.2.21:1080').waitFor();
  assert.equal(await row('源码代理').count(), 0);

  await nav('窗口模板').click();
  const legacy = await call('templates:save', { templateName: '关联代理模板', content: JSON.stringify({
    networkMode: 'direct', proxyCategory: 'noproxy', windowName: '代理关联窗口',
  }) });
  await button('刷新列表').click();
  const legacyRow = page.getByRole('listitem').filter({ hasText: '关联代理模板' });
  await legacyRow.getByRole('button', { name: '使用 / 修改', exact: true }).click();
  await page.getByLabel('网络连接', { exact: true }).selectOption(`library:${saved.id}`);
  await button('保存').click();
  await page.getByText('关联代理模板', { exact: true }).waitFor();
  const templates = await call('templates:list');
  const template = templates.find(item => item.templateName === '关联代理模板');
  assert.equal(template.id, legacy.id);
  const templateContent = JSON.parse(template.content);
  assert.deepEqual(templateContent.proxyInfoList, [{ moduleId: saved.id }]);
  assert.equal(Object.hasOwn(templateContent, 'networkMode'), false);

  const network = page.getByLabel('网络连接', { exact: true });
  await legacyRow.getByRole('button', { name: '使用 / 修改', exact: true }).click();
  assert.equal(await network.inputValue(), `library:${saved.id}`);
  await page.getByRole('link', { name: '用此模板创建窗口', exact: true }).click();
  await page.getByRole('heading', { name: '创建窗口', exact: true }).waitFor();
  assert.equal(await network.inputValue(), `library:${saved.id}`);
  await button('创建').click();
  const profileRow = page.getByRole('row').filter({ hasText: '代理关联窗口' });
  const findProfile = async () => (await call('profiles:list')).find(item => item.windowName === '代理关联窗口');
  await waitUntil(findProfile);
  assert.equal((await findProfile()).proxyId, saved.id);

  await nav('代理库').click();
  await row('源码代理').getByText('1 个窗口', { exact: true }).waitFor();
  await row('源码代理').getByRole('button', { name: '删除', exact: true }).click();
  await button('确认删除').click();
  await page.getByRole('alert').filter({ hasText: '代理仍关联' }).waitFor();

  await nav('窗口管理').click();
  await page.getByLabel('搜索名称或备注', { exact: true }).fill('代理关联窗口');
  await button('搜索').click();
  await profileRow.getByRole('button', { name: '编辑', exact: true }).click();
  await page.getByLabel('网络连接', { exact: true }).selectOption('direct');
  await button('保存').click();
  await button('创建窗口').waitFor();
  assert.equal((await findProfile()).networkMode, 'direct');

  await nav('代理库').click();
  await row('源码代理').getByRole('button', { name: '删除', exact: true }).click();
  await button('确认删除').click();
  await row('源码代理').waitFor({ state: 'detached' });
  assert.equal((await call('proxies:summaries')).length, 2);
}

async function exerciseSourceWorkbench(appRoot) {
  const data = await createTestDirectory('source-workbench-');
  const errors = [];
  const remoteRequests = [];
  let app;
  try {
    app = await electron.launch({
      executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), appRoot],
      env: { ...process.env, OPENBROWSER_RENDERER: 'source', OPENBROWSER_USER_DATA: data,
        OPENBROWSER_MASTER_KEY_FILE: path.join(data, 'master.key'), OPENBROWSER_API_PORT: '0' },
    });
    const page = await app.firstWindow();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
    assert.ok((await page.title()).includes('OpenBrowser'));
    const call = async (method, payload = {}) => unwrapIpcResult(await page.evaluate(
      ({ method, payload }) => globalThis.rebuild.request(method, payload), { method, payload }));
    await exerciseProfiles(page, call);
    await exerciseTemplates(page, call);
    await exerciseImport(app, page, call, data);
    await exerciseProxies(app, page, call, data);
    await page.getByRole('link', { name: '内核管理', exact: true }).click();
    await page.getByRole('heading', { name: '已安装内核', exact: true }).waitFor();
    const installed = await call('kernels:list');
    if (installed.length) await page.getByText(new RegExp(installed[0].version.replace(/\./g, '\\.'))).first().waitFor();
    else await page.getByText(/尚无可用内核/).waitFor();
    assert.equal(await page.evaluate(() => typeof globalThis.__router), 'undefined');
    assert.deepEqual(errors, []);
    assert.deepEqual(remoteRequests, []);
  } catch (error) {
    const diagnostics = await fs.readFile(path.join(data, 'logs', 'browser-startup.log'), 'utf8').catch(() => '');
    if (diagnostics) console.error(diagnostics.trim().split('\n').slice(-3).join('\n'));
    throw error;
  } finally {
    try { await app?.close(); }
    finally { await fs.rm(data, { recursive: true, force: true, maxRetries: 3 }); }
  }
}

module.exports = { exerciseSourceWorkbench };
if (require.main === module) exerciseSourceWorkbench(path.resolve(__dirname, '..'))
  .then(() => console.log('SOURCE_WORKBENCH_UI_SELFTEST OK (profile editor, batch creation, TXT/XLSX import, pagination, trash, templates, proxies and kernels)'))
  .catch(error => { console.error(error); process.exitCode = 1; });
