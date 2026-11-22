'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory, openWorkspacePage } = require('./selftest-helpers.cjs');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');

async function main() {
  const root = await createTestDirectory('workbench-interactions-');
  const evidence = evidenceDirectory(), errors = [];
  let app;
  try {
    app = await electron.launch({ executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.resolve(__dirname, '..')],
      env: { ...process.env, OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0',
        OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'master.key') } });
    const page = await app.firstWindow();
    const monitor = target => target.on('pageerror', error => errors.push({ url: target.url(), error: error.stack || error.message }));
    monitor(page);
    await page.waitForFunction(() => !!globalThis.__router && !!globalThis.__localRequest);
    const paths = await page.evaluate(() => globalThis.__router.getRoutes().map(route => route.path));
    for (const excluded of [
      "/login", "/register", "/billing", "/subscribe-plan", "/upgrade-plan",
      "/referral-program", "/agent-console/credits", "/agent-console/roxyclaw/wechat",
    ]) {
      assert.ok(!paths.some(route => route === excluded || route.startsWith(excluded + "/")), excluded);
    }
    await page.getByText('暂无窗口', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '观看视频', exact: true }).count(), 0);
    const info = await page.evaluate(() => globalThis.ops.getInfo());
    assert.equal(info.titleBarIntegrated, false);
    const bounds = await app.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      return { outer: window.getBounds(), content: window.getContentBounds(), resizable: window.isResizable(), movable: window.isMovable() };
    });
    assert.equal(bounds.resizable, true);
    if (process.platform !== 'linux') {
      assert.equal(bounds.movable, true);
      assert.ok(bounds.outer.height > bounds.content.height, 'native title bar occupies its own space');
    }
    const profileMenu = page.getByRole('button', { name: '本地工作区菜单', exact: true });
    const box = await profileMenu.boundingBox();
    assert.ok(box.width >= 80 && box.x + box.width <= (await page.evaluate(() => innerWidth)), 'workspace icon/text fit inside the client area');
    const profileName = '三点操作回归';
    const quickCreate = page.getByRole('button', { name: '快速创建', exact: true });
    const hasChrome = await page.evaluate(async () => (await globalThis.electronAPI.send('app:getCoreList'))
      .some(kernel => kernel.coreType === 'Chrome'));
    let profile;
    if (hasChrome) {
      await page.evaluate(windowName => globalThis.__localRequest('settings:set', { quickTemplate: { templateInfo: { windowName } } }), profileName);
      await quickCreate.click();
      await page.getByText('创建成功', { exact: true }).waitFor();
      assert.equal(await page.getByText('操作失败', { exact: true }).count(), 0, 'a successful save must not be reported as a failure');
      const profiles = await page.evaluate(() => globalThis.__localRequest('profiles:list'));
      assert.equal(profiles.length, 1, 'one click creates one profile');
      profile = profiles[0];
      assert.equal(profile.windowName, profileName);
    } else {
      await quickCreate.click();
      const missingKernel = page.getByText(/未找到可用的 Chrome 内核/);
      await missingKernel.first().waitFor();
      assert.equal(await missingKernel.count(), 1, 'a failed preview reports the missing kernel once');
      assert.deepEqual(await page.evaluate(() => globalThis.__localRequest('profiles:list')), []);
      profile = await page.evaluate(windowName => globalThis.__localRequest('profiles:create', { windowName, coreType: 'Chrome', os: 'Windows' }), profileName);
    }
    const row = page.locator('tr').filter({ hasText: profileName });
    await row.waitFor();
    await row.locator('.quick-item').last().click();
    await page.getByText('编辑窗口', { exact: true }).first().waitFor();
    assert.equal(await page.getByText('鼠标右键编辑', { exact: true }).count(), 0);
    await page.locator('#__prevent-mask-overlay__').click({ position: { x: 4, y: 4 } });
    await page.getByText('编辑窗口', { exact: true }).first().waitFor({ state: 'hidden' });
    for (const [label, route] of [['任务管理', '/agent-console/task-manager'], ['模板商城', '/agent-console/template-store'], ['API & AI MCP', '/api-keys']]) {
      console.log('WORKSPACE_PHASE', label);
      const opened = app.waitForEvent('window').catch(error => ({ error }));
      await page.getByText(label, { exact: true }).first().click();
      const child = await opened;
      if (child.error) throw child.error;
      monitor(child);
      await child.waitForFunction(() => !!globalThis.__router && !!globalThis.__localRequest);
      assert.equal(new URL(child.url()).searchParams.get('workspace'), route);
      assert.equal(await page.evaluate(() => globalThis.__router.currentRoute.value.path), '/browser/list');
      assert.equal((await child.evaluate(() => globalThis.__localRequest('profiles:list'))).length, 1, 'owned secondary window has authenticated local IPC');
      await child.close();
      await page.getByText('三点操作回归', { exact: true }).waitFor();
    }
    const mcpWindow = await openWorkspacePage(app, '/agent-console/mcp');
    assert.equal(await mcpWindow.evaluate(() => globalThis.__router.currentRoute.value.path), '/agent-console/mcp');
    await mcpWindow.close();

    const readRoute = () => page.evaluate(() => globalThis.__router.currentRoute.value.fullPath);
    for (const [legacy, canonical] of [
      ['/resource/agent', '/agent'],
      ['/resource/create', '/agent/create'],
      ['/resource/account', '/account/list'],
      ['/resource/accountcreate', '/account/create'],
      ['/resource/extensions', '/extensions'],
      ['/sync-control-synchronizer', '/synchronizer'],
      ['/automation/sync-control', '/synchronizer'],
    ]) {
      await page.evaluate(route => globalThis.__router.push(route), legacy + '?from=archive#legacy');
      assert.equal(await readRoute(), canonical + '?from=archive#legacy');
    }
    await page.evaluate(() => globalThis.__router.push('/browser/list'));
    const openedLegacyTask = app.waitForEvent('window');
    await page.evaluate(() => globalThis.__router.push('/automation/task-manager?from=archive'));
    const taskWindow = await openedLegacyTask;
    await taskWindow.getByRole('heading', { name: '任务管理', exact: true }).waitFor();
    assert.equal(new URL(taskWindow.url()).searchParams.get('workspace'), '/agent-console/task-manager');
    assert.equal(await taskWindow.evaluate(() => globalThis.__router.currentRoute.value.fullPath), '/agent-console/task-manager?from=archive');
    assert.equal(await readRoute(), '/browser/list');
    await taskWindow.close();

    const modelWindow = await openWorkspacePage(app, '/agent-console/settings');
    await modelWindow.getByRole('button', { name: 'MCP 服务', exact: true }).waitFor();
    await page.evaluate(() => globalThis.__localRequest('ui:workspace:open', { route: '/agent-console/roxyclaw?from=archive#model' }));
    await modelWindow.waitForFunction(() => globalThis.__router.currentRoute.value.fullPath === '/agent-console/settings?from=archive#model');
    assert.equal(app.windows().length, 2, 'the archive settings URL reuses the current model settings window');
    await modelWindow.close();

    const openedSkills = app.waitForEvent('window');
    await page.evaluate(() => globalThis.__router.push('/skills?from=legacy#library'));
    const skills = await openedSkills;
    monitor(skills);
    await skills.getByRole('heading', { name: 'Skill 管理', exact: true }).waitFor();
    assert.equal(new URL(skills.url()).searchParams.get('workspace'), '/agent-console/skills');
    assert.equal(await skills.evaluate(() => globalThis.__router.currentRoute.value.fullPath), '/agent-console/skills?from=legacy#library');
    await page.evaluate(() => globalThis.__localRequest('ui:workspace:open', { route: '/skills?from=ipc#library' }));
    await skills.waitForFunction(() => globalThis.__router.currentRoute.value.fullPath === '/agent-console/skills?from=ipc#library');
    assert.equal(app.windows().length, 2, 'the alias and canonical route share a single workspace');
    await skills.screenshot({ path: path.join(evidence, 'workbench-skill-legacy-route.png') });
    await skills.close();

    await page.evaluate(async () => {
      for (let i = 0; i < 10; i++) {
        await globalThis.__localRequest('profiles:create', { windowName: '分页回归 ' + i, coreType: 'Chrome', os: 'Windows' });
      }
    });
    const nextPage = page.locator('.p-paginator-next');
    await nextPage.waitFor();
    await nextPage.click();
    await page.waitForFunction(() => document.querySelectorAll('tr[data-row-id]').length === 1);
    const onlyRow = page.locator('tr[data-row-id]').first();
    const lastId = await onlyRow.getAttribute('data-row-id');
    await page.evaluate(id => globalThis.__localRequest('profiles:delete', { ids: [id] }), lastId);
    await page.waitForFunction(id => {
      const rows = [...document.querySelectorAll('tr[data-row-id]')];
      return rows.length > 1 && rows.every(row => row.getAttribute('data-row-id') !== id);
    }, lastId);
    assert.ok(await nextPage.isDisabled(), 'deleting the final page should return to the last available page');
    await page.getByText('回收站', { exact: true }).click();
    const recycled = page.locator(`tr[data-row-id="${lastId}"]`);
    await recycled.waitFor();
    await page.evaluate(() => { globalThis.__localRequests = []; });
    await recycled.locator('.quick-item').last().click();
    await page.getByRole('button', { name: '确认', exact: true }).last().click();
    await recycled.waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => globalThis.__localRequests.filter(method => method === 'profiles:purge-trash').length), 1);
    // The editor also has no tutorial banner when no kernel is installed.
    await page.evaluate(() => globalThis.__router.push('/browser/create'));
    await page.getByRole('button', { name: '一键随机指纹', exact: true }).waitFor();
    assert.equal(await page.getByText('窗口教程', { exact: true }).count(), 0);
    // Prime the active list cache, then change a profile while its table is unmounted.
    await page.evaluate(() => globalThis.__router.push('/browser/list'));
    await row.waitFor();
    await page.evaluate(() => globalThis.__router.push('/browser/create'));
    await row.waitFor({ state: 'detached' });
    await page.evaluate(id => globalThis.__localRequest('profiles:patch', { ids: [id], patch: { windowName: '切页后后端更新' } }), profile.id);
    await page.evaluate(() => globalThis.__router.push('/browser/list'));
    await page.locator('tr').filter({ hasText: '切页后后端更新' }).waitFor({ timeout: 5000 });
    assert.equal(await row.count(), 0);
    await page.screenshot({ path: path.join(evidence, 'workbench-feedback-main.png') });
    assert.deepEqual(errors, []);
    console.log('WORKBENCH_INTERACTIONS_UI_SELFTEST OK (quick creation, legacy and current routes, native frame, final-page recovery, single recycle-bin purge and cache invalidation across routes)');
  } catch (error) {
    for (const [index, page] of (app?.windows() || []).entries()) {
      await fs.writeFile(path.join(evidence, `workbench-interactions-failure-${index}.txt`), await page.locator('body').innerText());
      await page.screenshot({ path: path.join(evidence, `workbench-interactions-failure-${index}.png`) });
    }
    throw error;
  } finally {
    await app?.close();
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
