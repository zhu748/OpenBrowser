'use strict';
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { unwrapIpcResult } = require('../shared/ipc-result');
const { copySourceOnlyApp, launchVisualApp, waitForPaint, captureStableScreenshot } = require('./source-visual-selftest-helpers.cjs');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');

const source = path.resolve(__dirname, '..');
const output = evidenceDirectory('source-proxy-visual');
const compare = path.join(__dirname, 'visual-pixel-diff.py');

const capture = (page, file) => captureStableScreenshot(page, path.join(output, file));

async function photography(appRoot, data, visit) {
  const app = await launchVisualApp(appRoot, data);
  try {
    const page = await app.firstWindow();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await page.addStyleTag({ content: '* { caret-color: transparent !important }' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    const ready = page.getByRole('heading', { name: '代理库', exact: true });
    const link = name => page.getByRole('link', { name, exact: true });
    const button = name => page.getByRole('button', { name, exact: true });
    const call = async (method, payload) => unwrapIpcResult(await page.evaluate(
      ({ method, payload }) => globalThis.rebuild.request(method, payload), { method, payload }));
    const shot = async id => {
      await page.mouse.move(4, 4);
      await page.evaluate(async () => { document.activeElement?.blur(); await document.fonts.ready; });
      await waitForPaint(page);
      const layout = await page.evaluate(() => ({
        viewport: [innerWidth, innerHeight, devicePixelRatio, scrollX, scrollY],
        boxes: [...document.querySelectorAll('.page-header, .proxy-filters, .panel')].map(element => {
          const { x, y, width, height } = element.getBoundingClientRect();
          const { opacity, transform } = getComputedStyle(element);
          return { x, y, width, height, opacity, transform };
        }),
      }));
      return visit(id, page, layout);
    };

    await link('代理库').click();
    await ready.waitFor();
    await page.getByText('暂无代理', { exact: true }).waitFor();
    await link('窗口管理').click();
    await page.getByRole('heading', { name: '窗口管理', exact: true }).waitFor();
    await call('proxies:create', { id: 'visual-http', name: '本地代理 A', host: '192.0.2.15', protocol: 'http', port: 8080, remark: '用于窗口测试' });
    await call('proxies:create', { id: 'visual-socks', name: '本地代理 B', host: '192.0.2.18', protocol: 'socks5', port: 1080 });
    await link('代理库').click();
    const row = page.getByRole('listitem').filter({ hasText: '本地代理 A' });
    await row.waitFor();
    await shot('light-list');

    await row.getByRole('button', { name: '编辑', exact: true }).click();
    const form = page.getByRole('form', { name: '编辑代理' });
    await form.waitFor();
    const progress = await form.evaluate(async element => {
      const animation = element.getAnimations().find(item => item.effect?.getTiming().duration === 160);
      if (!animation) throw new Error('代理表单入场动画缺失');
      animation.pause();
      await animation.ready;
      animation.currentTime = 80;
      return animation.effect.getComputedTiming().progress;
    });
    assert.ok(progress > 0 && progress < 1, 'the 80 ms screenshot captures an intermediate frame');
    await shot('light-form-at-80ms');
    await form.evaluate(element => { element.getAnimations()[0].currentTime = 160; });
    await shot('light-form-complete');
    await button('取消').click();
    await page.getByLabel('搜索代理').fill('缺少匹配');
    await page.getByText('没有匹配的代理', { exact: true }).waitFor();
    await shot('light-no-match');
    await page.getByLabel('搜索代理').fill('');

    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await row.waitFor();
    await shot('dark-list');
    await page.setViewportSize({ width: 1000, height: 740 });
    await row.getByRole('button', { name: '删除', exact: true }).click();
    await button('确认删除').waitFor();
    await shot('dark-delete-1000px');
    await row.getByRole('button', { name: '取消', exact: true }).click();
    await button('新增代理').click();
    const newForm = page.getByRole('form', { name: '新增代理' });
    await newForm.waitFor();
    assert.equal(await newForm.evaluate(element => element.getAnimations().length), 0, 'reduced-motion form');
    await shot('dark-reduced-motion-form');
    await button('取消').click();
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await call('proxies:delete', { ids: ['visual-http', 'visual-socks'] });
    await button('刷新列表').click();
    await page.getByText('暂无代理', { exact: true }).waitFor();
    await shot('light-empty');
    assert.deepEqual(errors, []);
  } finally { await app.close(); }
}

async function main() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-source-proxy-visual-'));
  const packaged = path.join(temp, 'app');
  const baseline = new Map();
  const report = { status: 'FAIL', platform: process.platform, electron: require('electron/package.json').version,
    reference: 'OpenBrowser source-frontend development build', actual: 'OpenBrowser source-frontend packaged build', cases: [] };
  try {
    copySourceOnlyApp(source, packaged);
    await photography(source, path.join(temp, 'development'), async (id, page, layout) => {
      const file = `${id}-reference.png`;
      await capture(page, file);
      baseline.set(id, { file, layout });
    });
    await photography(packaged, path.join(temp, 'production'), async (id, page, layout) => {
      const reference = baseline.get(id), actual = `${id}-packaged.png`, diff = `${id}-diff.png`;
      assert.ok(reference, id);
      await capture(page, actual);
      const pixels = JSON.parse(execFileSync('python3', [compare, path.join(output, reference.file), path.join(output, actual), path.join(output, diff)], { encoding: 'utf8' }));
      report.cases.push({ id, reference: reference.file, actual, diff, ...pixels, layout: { reference: reference.layout, actual: layout } });
    });
    assert.equal(report.cases.length, baseline.size);
    assert.ok(report.cases.every(item => item.equal), 'source proxy screenshot pixels differ');
    for (const { id, layout } of report.cases) assert.deepEqual(layout.actual, layout.reference, id);
    report.status = 'PASS';
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 3 });
  }
  console.log(`SOURCE_PROXY_VISUAL_SELFTEST OK ${report.cases.length} screenshot pairs, 0 changed pixels`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
