'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory, waitUntil } = require('./selftest-helpers.cjs');
const { evidencePath } = require('./compiler/evidence-path.cjs');

async function main() {
  const data = await createTestDirectory('source-templates-');
  const exchange = path.join(data, 'profiles.json');
  const errors = [];
  let app, page;
  try {
    await fs.writeFile(exchange, JSON.stringify({ format: 'openbrowser-profiles', version: 1,
      profiles: [{ name: '源码模板导入校验', os: 'Linux' }] }));
    app = await electron.launch({
      executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.join(__dirname, '..')],
      env: { ...process.env, OPENBROWSER_ROXY_UI: '1', OPENBROWSER_USER_DATA: data,
        OPENBROWSER_MASTER_KEY_FILE: path.join(data, 'master.key'), OPENBROWSER_API_PORT: '0' },
    });
    page = await app.firstWindow();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.getByText('暂无窗口', { exact: true }).waitFor();
    const navigate = route => page.evaluate(value => globalThis.__router.push(value), route);
    const button = name => page.getByRole('button', { name, exact: true });
    const heading = page.getByRole('heading', { name: '已保存的模板', exact: true });
    const call = (method, payload) => page.evaluate(({ method, payload }) => globalThis.__localRequest(method, payload), { method, payload });
    const initialCount = () => page.evaluate(() => globalThis.__localRequests.filter(method => method === 'templates:list').length);

    await page.evaluate(() => { globalThis.__localRequests = []; });
    await navigate('/templates');
    await heading.waitFor();
    await page.getByText('暂无模板', { exact: true }).waitFor();
    assert.equal(await initialCount(), 1, 'first mount reads the template list once');
    await navigate('/templates?renderer=legacy');
    await heading.waitFor({ state: 'detached' });
    await page.getByText('暂无模板', { exact: true }).waitFor();

    await app.evaluate(({ dialog }, { file, servicePath }) => {
      const { LocalService } = process.mainModule.require(servicePath);
      const request = LocalService.prototype.request;
      const failOnce = new Set(['templates:list', 'templates:delete']);
      LocalService.prototype.request = function (method, payload) {
        if (failOnce.delete(method)) throw Error(`测试请求失败 ${method}`);
        return request.call(this, method, payload);
      };
      let pick = 0;
      dialog.showOpenDialog = async () => ++pick === 1
        ? { canceled: true, filePaths: [] }
        : { canceled: false, filePaths: [file] };
    }, { file: exchange, servicePath: path.join(__dirname, 'local-service.js') });

    const template = await call('templates:save', { templateName: '待删除模板', content: '{}' });
    await navigate('/templates');
    await heading.waitFor();
    await page.getByRole('alert').filter({ hasText: '测试请求失败 templates:list' }).waitFor();
    await button('刷新列表').click();
    const row = page.getByRole('listitem').filter({ hasText: '待删除模板' });
    await row.waitFor();

    await row.getByRole('button', { name: '删除', exact: true }).click();
    await button('取消').click();
    await row.getByRole('button', { name: '删除', exact: true }).click();
    await button('确认删除').click();
    await page.getByRole('alert').filter({ hasText: '测试请求失败 templates:delete' }).waitFor();
    assert.equal((await call('templates:list')).some(item => item.id === template.id), true);
    await button('确认删除').click();
    await row.waitFor({ state: 'detached' });
    await page.getByText('暂无模板', { exact: true }).waitFor();
    assert.deepEqual(await call('templates:list'), []);

    await button('导入窗口文件').click();
    await page.waitForFunction(() => globalThis.__localRequests.includes('transfer:import'));
    assert.deepEqual(await call('profiles:list'), []);
    await button('导入窗口文件').click();
    await page.getByRole('status').filter({ hasText: '已导入 1 个窗口' }).waitFor();
    assert.equal((await call('profiles:list'))[0].windowName, '源码模板导入校验');

    const editable = await call('templates:save', { templateName: '用于编辑的模板', content: '{}' });
    await button('刷新列表').click();
    await button('使用 / 修改').click();
    await page.waitForFunction(id => {
      const route = globalThis.__router.currentRoute.value;
      return route.path === '/browser/create' && route.query.templateId === String(id);
    }, editable.id);
    await heading.waitFor({ state: 'detached' });
    await button('用于编辑的模板').waitFor();

    await navigate('/templates');
    await heading.waitFor();
    const editableRow = page.getByRole('listitem').filter({ hasText: '用于编辑的模板' });
    await editableRow.waitFor();
    // The editor retains its imported API object. Hold just its next IPC read,
    // not the new templates page's list read when we navigate back.
    await app.evaluate((_, servicePath) => {
      const { LocalService } = process.mainModule.require(servicePath);
      const request = LocalService.prototype.request;
      const { promise, resolve } = Promise.withResolvers();
      const lookup = globalThis.templateLookup = { pending: false, finished: false };
      LocalService.prototype.request = async function (method, payload) {
        if (method !== 'templates:list' || lookup.pending) return request.call(this, method, payload);
        lookup.pending = true;
        await promise;
        const response = await request.call(this, method, payload);
        lookup.finished = true;
        return response;
      };
      lookup.release = () => { LocalService.prototype.request = request; resolve(); };
    }, path.join(__dirname, 'local-service.js'));
    try {
      await editableRow.getByRole('button', { name: '使用 / 修改', exact: true }).click();
      await waitUntil(() => app.evaluate(() => globalThis.templateLookup.pending), { message: '编辑器未请求模板列表' });
      await navigate('/templates');
      await heading.waitFor();
      await editableRow.waitFor();
    } finally {
      await app.evaluate(() => globalThis.templateLookup.release());
    }
    await waitUntil(() => app.evaluate(() => globalThis.templateLookup.finished), { message: '已离开的编辑器未收到模板列表响应' });
    assert.equal(await page.evaluate(() => globalThis.__router.currentRoute.value.path), '/templates');
    await app.evaluate((_, servicePath) => {
      const { LocalService } = process.mainModule.require(servicePath);
      const request = LocalService.prototype.request;
      const { promise, resolve } = Promise.withResolvers();
      LocalService.prototype.request = function (method, payload) {
        if (method === 'kernels:list') return promise.then(() => request.call(this, method, payload));
        return request.call(this, method, payload);
      };
      globalThis.releaseTemplateKernelList = () => {
        LocalService.prototype.request = request;
        resolve();
      };
    }, path.join(__dirname, 'local-service.js'));
    try {
      await button('创建模板').click();
      await button('存为新模板').click();
      await page.locator('input[name="templateName"]').fill('延后选择内核');
      await button('保存').last().click();
      assert.equal((await call('templates:list')).some(item => item.templateName === '延后选择内核'), false);
    } finally {
      await app.evaluate(() => globalThis.releaseTemplateKernelList());
    }
    await page.locator('input[name="templateName"]').waitFor({ state: 'hidden' });
    const deferred = (await call('templates:list')).find(item => item.templateName === '延后选择内核');
    assert.ok(deferred, 'the stock editor can save the template');
    const content = JSON.parse(deferred.content);
    assert.ok(content.os && content.coreType, 'the template contains the initialized form fields');
    if ((await call('kernels:list')).length === 0) {
      assert.equal(content.useLatestCore, true);
      assert.equal(content.coreVersion, '');
      assert.equal(await button('创建窗口').last().isDisabled(), true);
    }
    assert.equal((await call('profiles:list')).length, 1, 'saving a template does not create a window');
    await navigate('/templates');
    await page.getByText('延后选择内核', { exact: true }).waitFor();
    await page.screenshot({ path: evidencePath('workbench-template-deferred-kernel.png') });
    assert.deepEqual(errors, []);
    console.log('SOURCE_TEMPLATES_UI_SELFTEST OK (fallback, IPC retries, import, delete, editor navigation and deferred kernel selection)');
  } catch (error) {
    if (page) {
      await fs.writeFile(evidencePath('templates-ui-failure.json'), JSON.stringify({
        errors, failure: error.message, body: await page.locator('body').innerText(),
      }, null, 2));
      await page.screenshot({ path: evidencePath('templates-ui-failure.png') });
    }
    throw error;
  } finally {
    try { await app?.close(); }
    finally { await fs.rm(data, { recursive: true, force: true, maxRetries: 3 }); }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
