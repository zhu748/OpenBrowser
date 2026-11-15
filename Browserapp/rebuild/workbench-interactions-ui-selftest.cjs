'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory } = require('./selftest-helpers.cjs');
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
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => !!globalThis.__router && !!globalThis.__localRequest);
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
    await page.evaluate(() => globalThis.__localRequest('profiles:create', { windowName: '三点操作回归', coreType: 'Chrome', os: 'Windows' }));
    const row = page.locator('tr').filter({ hasText: '三点操作回归' });
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
      child.on('pageerror', error => errors.push(error.message));
      await child.waitForFunction(() => !!globalThis.__router && !!globalThis.__localRequest);
      assert.equal(new URL(child.url()).searchParams.get('workspace'), route);
      assert.equal(await page.evaluate(() => globalThis.__router.currentRoute.value.path), '/browser/list');
      assert.equal((await child.evaluate(() => globalThis.__localRequest('profiles:list'))).length, 1, 'owned secondary window has authenticated local IPC');
      await child.close();
      await page.getByText('三点操作回归', { exact: true }).waitFor();
    }
    // The editor also has no tutorial banner when no kernel is installed.
    await page.evaluate(() => globalThis.__router.push('/browser/create'));
    await page.getByRole('button', { name: '一键随机指纹', exact: true }).waitFor();
    assert.equal(await page.getByText('窗口教程', { exact: true }).count(), 0);
    await page.screenshot({ path: path.join(evidence, 'workbench-feedback-main.png') });
    assert.deepEqual(errors, []);
    console.log('WORKBENCH_INTERACTIONS_UI_SELFTEST OK (video removal, left-click menu, independent workspaces and native frame)');
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
