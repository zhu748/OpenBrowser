'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory } = require('./selftest-helpers.cjs');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');
const { disableReferenceCache, installReference, readReferenceRequests, readSourceRequests, switchReferenceMode } = require('./workbench-reference-selftest-helpers.cjs');

const appRoot = path.resolve(__dirname, '..');
const output = evidenceDirectory('recovered-workbench', 'comparison');
const modules = {
  'layout-C916OUcf.js': 'layout.js',
  'create-Bs68oonD.js': 'proxy-create.js',
};

async function installBaseline(app, baseline) {
  await app.evaluate((_electron, service) => {
    const { LocalService } = process.mainModule.require(service);
    const dispatch = LocalService.prototype.dispatch;
    LocalService.prototype.dispatch = function (method, params) {
      if (method === 'host:network') return { ip: '203.0.113.15', country_code: 'CN', city: '本地验收' };
      return dispatch.call(this, method, params);
    };

  }, path.join(__dirname, 'local-service.js'));
  await installReference(app, baseline);
}

async function settlePaint(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function screenshot(page, file, state) {
  await page.evaluate(keepSidebarWidth => {
    for (const animation of document.getAnimations()) {
      const effect = animation.effect;
      if (keepSidebarWidth && animation.transitionProperty === 'width' && effect.target?.classList.contains('rx-side')) continue;
      if (Number.isFinite(effect.getComputedTiming().endTime)) animation.finish();
      else { animation.pause(); animation.currentTime = 0; }
    }
    for (const svg of document.querySelectorAll('svg')) {
      svg.pauseAnimations?.();
      svg.setCurrentTime?.(0);
    }
  }, Boolean(state));
  let previous, consecutive = 0;
  for (let attempt = 0; attempt < 40; attempt++) {
    await settlePaint(page);
    const frame = await page.screenshot({ scale: 'css', caret: 'initial', animations: 'allow' });
    consecutive = previous?.equals(frame) ? consecutive + 1 : 1;
    if (consecutive === 3) {
      await fs.writeFile(path.join(output, file), frame);
      return;
    }
    previous = frame;
  }
  throw Error('Screenshot did not settle: ' + file);
}

async function enter(page, route, theme, mode) {
  // Changing only the hash leaves the existing renderer module cache alive.
  await page.goto('obui://app/index.html?visual=' + mode + '-' + theme + '#' + route);
  await page.waitForFunction(expected => globalThis.__router?.currentRoute.value.path === expected, route);
  await page.evaluate(async theme => {
    const { n: useTheme } = await import('/assets/theme-mq6SsndU.js');
    useTheme().setTheme(theme);
    await document.fonts.ready;
  }, theme);
  await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
  await page.addStyleTag({ content: '* { caret-color: transparent !important }' });
}

async function capture(page, mode, record) {
  for (const theme of ['light', 'dark']) {
    await enter(page, '/browser/list', theme, mode + '-workbench');
    const profile = page.getByText('工作台验收窗口', { exact: true });
    await profile.first().waitFor();
    await page.mouse.move(1, 1);
    await record(theme + '-workbench');

    await page.getByRole('button', { name: '本地工作区菜单' }).click();
    await page.getByText('主题模式', { exact: true }).waitFor();
    await page.mouse.move(1, 1);
    await record(theme + '-profile-menu');
    await page.keyboard.press('Escape');
    await page.getByText('主题模式', { exact: true }).waitFor({ state: 'hidden' });

    const sidebar = page.locator('.rx-side');
    const width = await sidebar.evaluate(async element => {
      const indicator = element.querySelector('.indicator');
      // Flush the expanded geometry before the click so Chromium creates the
      // transition and we can pause it before any screenshot delay.
      if (element.getBoundingClientRect().width !== 220) throw Error('Expected expanded sidebar');
      indicator.click();
      await Promise.resolve();
      element.getBoundingClientRect();
      const transition = element.getAnimations().find(animation => animation.transitionProperty === 'width');
      if (!transition) throw Error('Missing sidebar width transition: ' + getComputedStyle(element).transition);
      transition.pause();
      await transition.ready;
      if (transition.effect.getTiming().duration !== 250) throw Error('Expected a 250 ms width transition');
      transition.currentTime = 125;
      return element.getBoundingClientRect().width;
    });
    assert.ok(width > 66 && width < 220, 'capture must show a partially collapsed sidebar');
    await page.mouse.move(1, 1);
    await record(theme + '-sidebar-at-125ms', { width });
    await sidebar.evaluate(element => {
      element.getAnimations().find(animation => animation.transitionProperty === 'width')?.finish();
    });
    await record(theme + '-sidebar-collapsed');
    await page.locator('.indicator').click();
    await page.waitForFunction(() => document.querySelector('.rx-side').getBoundingClientRect().width === 220);

    await enter(page, '/agent/create', theme, mode + '-proxy');
    await page.locator('input[name="host"]').fill('192.0.2.31');
    await page.locator('input[name="port"]').fill('8080');
    await page.mouse.move(1, 1);
    await page.evaluate(() => document.activeElement?.blur());
    await record(theme + '-proxy-single');
    await page.getByRole('tab', { name: '批量添加', exact: true }).click();
    await page.getByPlaceholder('请在此处输入代理 IP 信息').fill('http://192.0.2.32:8181');
    await page.mouse.move(1, 1);
    await page.evaluate(() => document.activeElement?.blur());
    await record(theme + '-proxy-batch');
    await page.getByRole('tab', { name: '单个添加', exact: true }).click();
    assert.equal(await page.locator('input[name="host"]').inputValue(), '192.0.2.31');
    await page.getByRole('tab', { name: '批量添加', exact: true }).click();
    assert.equal(await page.getByPlaceholder('请在此处输入代理 IP 信息').inputValue(), 'http://192.0.2.32:8181');
  }
}

async function main() {
  assert.ok(process.argv[2], 'Pass the folder with the pre-migration layout.js and proxy-create.js');
  const referenceRoot = path.resolve(process.argv[2]);
  const baseline = Object.fromEntries(await Promise.all(Object.entries(modules).map(async ([asset, name]) => [
    asset, await fs.readFile(path.join(referenceRoot, name), 'utf8'),
  ])));
  const data = await createTestDirectory('recovered-workbench-');
  const report = { passed: false, dimensions: [1440, 900], baseline: Object.fromEntries(
    Object.entries(baseline).map(([file, content]) => [file, createHash('sha256').update(content).digest('hex')]),
  ), cases: [], pageErrors: [] };
  let app;
  try {
    app = await electron.launch({
      executablePath: require('electron'),
      args: [
        ...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []),
        '--force-device-scale-factor=1', '--force-color-profile=srgb', '--disable-threaded-animation',
        '--disable-lcd-text', '--disable-skia-runtime-opts', '--disable-font-subpixel-positioning',
        '--disable-partial-raster', '--disable-oop-rasterization', appRoot,
      ],
      env: { ...process.env, OPENBROWSER_USER_DATA: data, OPENBROWSER_API_PORT: '0',
        OPENBROWSER_MASTER_KEY_FILE: path.join(data, 'master.key') },
    });
    const page = await app.firstWindow();
    await disableReferenceCache(page);
    page.setDefaultTimeout(15_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.setViewportSize({ width: report.dimensions[0], height: report.dimensions[1] });
    await page.getByText('暂无窗口', { exact: true }).waitFor();
    await app.evaluate((_electron, serviceFile) => {
      const { LocalService } = process.mainModule.require(serviceFile);
      const request = LocalService.prototype.request;
      LocalService.prototype.request = function (method, ...args) {
        if (method === 'host:network') return Promise.resolve({ ip: '192.0.2.23', country_code: 'US', city: 'San Jose' });
        return request.call(this, method, ...args);
      };
    }, path.join(__dirname, 'local-service.js'));
    await page.evaluate(() => globalThis.__localRequest('profiles:create', {
      windowName: '工作台验收窗口', os: 'Windows', coreType: 'Chrome',
    }));
    await installBaseline(app, baseline);

    const referenceFrames = new Map();
    await switchReferenceMode(app, true);
    await capture(page, 'reference', async (id, state) => {
      const file = id + '-reference.png';
      await screenshot(page, file, state);
      referenceFrames.set(id, { file, state });
    });
    await switchReferenceMode(app, false);
    await capture(page, 'source', async (id, state) => {
      const reference = referenceFrames.get(id);
      assert.deepEqual(state, reference.state, id + ' animation state');
      const actual = id + '-source.png', diff = id + '-diff.png';
      await screenshot(page, actual, state);
      const result = JSON.parse(execFileSync('python3', [
        path.join(__dirname, 'visual-pixel-diff.py'),
        path.join(output, reference.file), path.join(output, actual), path.join(output, diff),
      ], { encoding: 'utf8' }));
      report.cases.push({ id, reference: reference.file, actual, diff, state, ...result });
    });
    assert.equal(report.cases.length, referenceFrames.size);
    report.referenceRequests = await readReferenceRequests(app);
    report.sourceRequests = await readSourceRequests(app);
    for (const asset of Object.keys(modules)) {
      assert.ok(report.referenceRequests.includes(asset), 'reference ' + asset);
      assert.ok(report.sourceRequests.includes(asset), 'source ' + asset);
    }
    await page.getByRole('tab', { name: '单个添加', exact: true }).click();
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await page.waitForFunction(() => globalThis.__router?.currentRoute.value.path === '/agent');
    const proxies = await page.evaluate(() => globalThis.__localRequest('proxies:summaries'));
    assert.ok(proxies.some(row => row.host === '192.0.2.31' && row.port === 8080), 'single form persists through native IPC');
    assert.deepEqual(report.pageErrors, []);
    assert.ok(report.cases.every(row => row.equal), 'Pre-migration screenshot pixels differ');
    report.passed = true;
  } catch (error) {
    report.failure = error.message;
    throw error;
  } finally {
    try { await app?.close(); }
    finally {
      await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
      await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
    }
  }
  console.log('RECOVERED_WORKBENCH_SELFTEST OK', report.cases.length, 'pixel-exact comparisons');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
