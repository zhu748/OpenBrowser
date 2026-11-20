'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { unwrapIpcResult } = require('../shared/ipc-result');
const { toggleTheme, waitUntil } = require('./selftest-helpers.cjs');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');
const { copySourceOnlyApp, launchVisualApp, waitForPaint, captureStableScreenshot } = require('./source-visual-selftest-helpers.cjs');

const appRoot = path.resolve(__dirname, '..');
const output = evidenceDirectory('source-workbench-visual');
const comparison = path.join(__dirname, 'visual-pixel-diff.py');
const extensionName = '视觉测试扩展';
const wide = { width: 1448, height: 960 };
const narrow = { width: 800, height: 660 };
const button = (page, name) => page.getByRole('button', { name, exact: true });
const heading = (page, name) => page.getByRole('heading', { name, exact: true });

const call = async (page, method, payload = {}) => unwrapIpcResult(await page.evaluate(
  ({ method, payload }) => globalThis.rebuild.request(method, payload), { method, payload },
));

async function go(page, route, workbench) {
  if (workbench) await page.evaluate(value => globalThis.__router.push(value), route);
  else await page.evaluate(value => { location.hash = value; }, route);
}

async function theme(page, colorScheme, reducedMotion, workbench) {
  await page.emulateMedia({ colorScheme, reducedMotion });
  if (workbench && await page.locator('html').getAttribute('data-theme') !== colorScheme) await toggleTheme(page);
  await waitUntil(() => page.locator('html').getAttribute('data-theme').then(theme => theme === colorScheme));
}

async function assertLocalNavigation(page) {
  const actions = await page.getByRole('button').or(page.getByRole('link')).or(page.getByRole('tab')).evaluateAll(elements =>
    elements.map(element => (element.getAttribute('aria-label') || element.textContent).trim()),
  );
  const removed = /^(?:扩展推荐|立即升级|购买终身窗口|充值(?:\/账单)?|推广计划|扫码登录|注册|登录|付费)$/;
  assert.deepEqual(actions.filter(name => removed.test(name)), []);
}

async function seed(app, page, fixture) {
  await app.evaluate(({ dialog }, selected) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selected] });
  }, fixture);
  const { data } = await call(page, 'extensions:select', { kind: 'dir' });
  const { localToken } = await call(page, 'extensions:stage', { pluginPath: data.pluginPath });
  const { plugin_id: pluginId } = await call(page, 'extensions:finish', { localToken, pluginName: extensionName });
  const project = await call(page, 'groups:save', { projectName: '截图验证项目' });
  await call(page, 'extensions:assign', { pluginId, projectId: ['local-default', project.id], installStatus: [1, 0] });
}

async function extensionCases(page, shot, workbench) {
  await go(page, workbench ? '/extensions?renderer=source' : '/extensions', workbench);
  await heading(page, '已安装扩展').waitFor();
  const section = page.locator('.extension-workspace');
  const row = page.getByRole('row').filter({ hasText: extensionName });
  await row.waitFor();
  await row.locator('.extension-avatar').evaluate(image => image.decode());
  const metrics = await section.evaluate(element => {
    const dimensions = (selector) => {
      const item = element.querySelector(selector);
      const rect = item.getBoundingClientRect();
      const css = getComputedStyle(item);
      return { width: rect.width, height: rect.height, fontSize: css.fontSize, padding: css.padding, color: css.color };
    };
    return {
      avatar: dimensions('tbody tr:last-child .extension-avatar'),
      row: { height: dimensions('tbody tr:last-child').height },
      glyph: dimensions('tbody tr:last-child .extension-actions svg'),
      action: dimensions('tbody tr:last-child .row-button'),
      footer: { height: dimensions('.extension-footer').height },
      workspace: { height: element.clientHeight, bottom: element.getBoundingClientRect().bottom },
    };
  });
  assert.equal(metrics.avatar.width, 36);
  assert.equal(metrics.avatar.height, 36);
  assert.equal(metrics.glyph.width, 16);
  assert.equal(metrics.glyph.height, 16);
  assert.equal(metrics.action.width, 30);
  assert.equal(metrics.action.height, 30);
  assert.ok(metrics.workspace.bottom <= wide.height && wide.height - metrics.workspace.bottom <= 32, 'extension footer should reach the workspace bottom');
  await assertLocalNavigation(page);
  await shot('extensions-light');

  await page.getByLabel('工具栏固定方式 · ' + extensionName).click();
  await button(page, '始终固定到工具栏').waitFor();
  await shot('extensions-pin-menu');
  await page.keyboard.press('Escape');
  await button(page, '始终固定到工具栏').waitFor({ state: 'hidden' });

  const element = page.locator('dialog.extension-dialog');
  await element.evaluate(dialog => {
    dialog.addEventListener('animationstart', async () => {
      const animation = dialog.getAnimations()[0];
      animation.pause();
      await animation.ready;
      animation.currentTime = 75;
      dialog.dataset.visualTime = '75';
    }, { once: true });
  });
  await button(page, '本地上传').click();
  await page.locator('dialog[data-visual-time="75"]').waitFor();
  const motion = await element.evaluate(dialog => {
    const animation = dialog.getAnimations()[0];
    return { duration: animation.effect.getTiming().duration, progress: animation.effect.getComputedTiming().progress };
  });
  assert.equal(motion.duration, 150);
  assert.ok(motion.progress > 0 && motion.progress < 1);
  await shot('extensions-upload-75ms');
  await element.evaluate(dialog => dialog.getAnimations()[0].finish());
  await button(page, '选择文件夹').click();
  await page.getByLabel('扩展名称').waitFor();
  await element.locator('.extension-avatar').evaluate(image => image.decode());
  await shot('extensions-upload-preview');
  await page.keyboard.press('Escape');

  await row.getByRole('button', { name: '安全', exact: true }).click();
  await page.getByText('本地清单可读取。可以打开目录进一步检查扩展文件。', { exact: true }).waitFor();
  await shot('extensions-manifest');
  await button(page, '关闭').click();

  await theme(page, 'dark', 'reduce', workbench);
  await shot('extensions-dark');
  await button(page, '本地上传').click();
  await button(page, '选择文件夹').waitFor();
  assert.equal(await element.evaluate(dialog => dialog.getAnimations().length), 0);
  await shot('extensions-reduced-motion');
  await page.keyboard.press('Escape');

  await page.setViewportSize(narrow);
  await section.locator('.extension-scroll').evaluate(scroller => {
    if (scroller.scrollWidth <= scroller.clientWidth || document.documentElement.scrollWidth > innerWidth) {
      throw Error('The narrow table must scroll within the panel');
    }
  });
  assert.equal(await row.locator('.extension-source').evaluate(cell => {
    const label = document.createRange();
    label.selectNodeContents(cell);
    return label.getClientRects().length;
  }), 1, 'source labels should stay on one line');
  assert.equal((await button(page, '刷新').boundingBox()).y, (await page.getByLabel('搜索扩展').boundingBox()).y);
  await shot('extensions-narrow');
  await page.setViewportSize(wide);
  await theme(page, 'light', 'no-preference', workbench);
  return { metrics, motion };
}

async function otherPages(page, shot) {
  for (const [id, route, label] of [
    ['windows', '/profiles', '暂无窗口'],
    ['trash', '/trash', '回收站为空'],
    ['import', '/profiles/import', '导入窗口'],
    ['templates', '/templates', '暂无模板'],
    ['kernels', '/kernels', '已安装内核'],
    ['proxies', '/proxies', '暂无代理'],
    ['projects', '/projects', '截图验证项目'],
    ['accounts', '/accounts', '暂无匹配的账号'],
  ]) {
    await go(page, route, false);
    await page.getByText(label, { exact: true }).last().waitFor();
    await assertLocalNavigation(page);
    await shot(id);
  }
  await go(page, '/accounts/new', false);
  await heading(page, '添加平台账号').waitFor();
  await button(page, '批量录入').click();
  await shot('accounts-import');

  await call(page, 'api:set', { open: false, port: 50001, apiAllowLan: false });
  await go(page, '/api-keys', false);
  await page.getByText('服务已关闭', { exact: true }).waitFor();
  await shot('api-settings');
  await button(page, '本地文档').click();
  await page.getByLabel('本地 API 文档').waitFor();
  await shot('api-documentation');
}

async function run(root, data, fixture, label, workbench, onFrame) {
  const app = await launchVisualApp(root, data, workbench ? '' : 'source');
  try {
    const page = await app.firstWindow();
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^(?:https?|wss?):/.test(request.url())) external.push(request.url()); });
    await page.setViewportSize(wide);
    await page.getByText('暂无窗口', { exact: true }).waitFor();
    await theme(page, 'light', 'no-preference', workbench);
    await seed(app, page, fixture);
    const shot = async id => {
      await page.mouse.move(3, 3);
      await page.evaluate(async () => { await document.fonts.ready; });
      await waitForPaint(page);
      const file = path.join(output, id + '-' + label + '.png');
      if (workbench) await page.screenshot({ path: file, scale: 'css', caret: 'hide', animations: 'allow' });
      else await captureStableScreenshot(page, file);
      await onFrame(id, file);
    };
    const stats = await extensionCases(page, shot, workbench);
    if (!workbench) await otherPages(page, shot);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    return stats;
  } finally { await app.close(); }
}

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-source-workbench-visual-'));
  const packaged = path.join(temp, 'app');
  const fixture = path.join(temp, 'fixture');
  const report = { status: 'FAIL', reference: 'OpenBrowser standalone development build',
    actual: 'OpenBrowser standalone packaged build', cases: [], defaultWorkbench: [] };
  const reference = new Map();
  try {
    fs.mkdirSync(fixture);
    fs.writeFileSync(path.join(fixture, 'manifest.json'), JSON.stringify({
      manifest_version: 3, name: extensionName, version: '1.2.3', icons: { 32: 'icon.svg' },
    }));
    fs.writeFileSync(path.join(fixture, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#126359" width="32" height="32" rx="6"/><circle fill="#aff5cd" cx="16" cy="16" r="8"/></svg>');
    const dev = await run(appRoot, path.join(temp, 'dev'), fixture, 'dev', false, (id, file) => reference.set(id, file));
    fs.rmSync(path.join(temp, 'dev'), { recursive: true, force: true, maxRetries: 3 });
    copySourceOnlyApp(appRoot, packaged);
    const prod = await run(packaged, path.join(temp, 'prod'), fixture, 'packaged', false, (id, file) => {
      const diff = path.join(output, id + '-diff.png');
      const expected = reference.get(id);
      assert.ok(expected, id);
      const pixels = JSON.parse(execFileSync('python3', [comparison, expected, file, diff], { encoding: 'utf8' }));
      report.cases.push({ id, reference: path.basename(expected), actual: path.basename(file), diff: fs.existsSync(diff) ? path.basename(diff) : null, ...pixels });
    });
    report.controls = { development: dev, packaged: prod };
    assert.deepEqual(prod, dev);
    assert.equal(report.cases.length, reference.size);
    assert.deepEqual(report.cases.filter(item => !item.equal).map(item => item.id), []);
    fs.rmSync(packaged, { recursive: true, force: true, maxRetries: 3 });
    fs.rmSync(path.join(temp, 'prod'), { recursive: true, force: true, maxRetries: 3 });
    const workbench = await run(appRoot, path.join(temp, 'workbench'), fixture, 'workbench', true,
      (id, file) => report.defaultWorkbench.push({ id, screenshot: path.basename(file) }));
    report.controls.defaultWorkbench = workbench;
    assert.deepEqual(workbench.motion, dev.motion);
    for (const name of ['avatar', 'row', 'glyph', 'action', 'footer']) {
      assert.deepEqual(workbench.metrics[name], dev.metrics[name], name);
    }
    report.status = 'PASS';
    console.log('Source workbench visual tests passed with ' + report.cases.length + ' identical screenshot pairs');
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 3 });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
