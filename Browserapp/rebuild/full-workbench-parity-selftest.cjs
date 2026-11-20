'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { resolve } = path;
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');
const { createTestDirectory } = require('./selftest-helpers.cjs');
const { launchVisualApp, captureStableScreenshot } = require('./source-visual-selftest-helpers.cjs');
const { disableReferenceCache } = require('./workbench-reference-selftest-helpers.cjs');

const appRoot = resolve(__dirname, '..');
const bootAssets = ['/index.html', '/assets/bootstrap.js'];
const viewport = { width: 1448, height: 960 };

function pixelBounds(box, padding) {
  return [Math.floor(box.x) - padding, Math.floor(box.y) - padding,
    Math.ceil(box.x + box.width) + padding, Math.ceil(box.y + box.height) + padding];
}

async function installUiRoots(app, roots) {
  await app.evaluate(({ protocol, net }, { roots, protocolFile, serviceFile }) => {
    const { createHash } = process.mainModule.require('node:crypto');
    const { installUiProtocol } = process.mainModule.require(protocolFile);
    const { LocalService } = process.mainModule.require(serviceFile);
    const request = LocalService.prototype.request;
    LocalService.prototype.request = function (method, ...args) {
      if (method === 'host:network') {
        return Promise.resolve({ ip: '192.0.2.23', country_code: 'US', city: 'San Jose' });
      }
      return request.call(this, method, ...args);
    };

    const handlers = {};
    for (const [mode, root] of Object.entries(roots)) {
      installUiProtocol({ handle: (_scheme, serve) => { handlers[mode] = serve; } }, net, root);
    }
    const test = globalThis.__parity = { mode: 'archive', served: { archive: {}, source: {} }, failed: [] };
    protocol.unhandle('obui');
    protocol.handle('obui', async request => {
      const mode = test.mode;
      const file = new URL(request.url).pathname;
      const response = await handlers[mode](request);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-store');
      if (!response.ok) test.failed.push({ mode, file, status: response.status });
      if (file === '/index.html' || file === '/assets/bootstrap.js') {
        const bytes = await response.arrayBuffer();
        test.served[mode][file] = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
        return new Response(bytes, { status: response.status, headers });
      }
      return new Response(response.body, { status: response.status, headers });
    });
  }, { roots, protocolFile: resolve(__dirname, 'protocol.js'), serviceFile: resolve(__dirname, 'local-service.js') });
}

async function setPicker(app, file) {
  await app.evaluate(({ dialog }, file) => {
    dialog.showOpenDialog = async () => ({ canceled: !file, filePaths: file ? [file] : [] });
  }, file);
}

async function visit(page, { route, theme, mode }) {
  await page.goto(`obui://app/index.html?parity=${mode}-${theme}#${route}`);
  await page.waitForFunction(wanted => globalThis.__router?.currentRoute.value.path === wanted, route);
  await page.evaluate(async theme => {
    const { n: useTheme } = await import('/assets/theme-mq6SsndU.js');
    useTheme().setTheme(theme);
    await document.fonts.ready;
  }, theme);
  await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme);
}

async function settleAnimations(page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (Number.isFinite(animation.effect.getComputedTiming().endTime)) animation.finish();
      else { animation.pause(); animation.currentTime = 0; }
    }
  });
}

async function beginUploadAnimation(page, label, animationName) {
  await page.evaluate(async ({ label, animationName }) => {
    const button = Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === label);
    if (!button) throw Error('Missing button: ' + label);
    // Vue's fallback can finish the transition while Chromium is holding the
    // CSS animation for a screenshot. Let animationend handle normal cleanup.
    const setTimer = window.setTimeout;
    window.setTimeout = (callback, delay, ...args) => setTimer(callback, delay === 301 ? 30000 : delay, ...args);
    try {
      button.click();
      for (let frame = 0; frame < 25; frame++) {
        await new Promise(requestAnimationFrame);
        const animation = document.getAnimations().find(item => item.animationName === animationName);
        if (animation) {
          animation.pause();
          await animation.ready;
          await new Promise(requestAnimationFrame);
          return;
        }
      }
      throw Error('Missing upload dialog animation: ' + animationName);
    } finally {
      window.setTimeout = setTimer;
    }
  }, { label, animationName });
}

async function exercise(page, app, fixtures, theme, mode, record) {
  const button = name => page.getByRole('button', { name, exact: true });
  const dialog = page.locator('.p-dialog').last();
  const extensionRoute = { route: '/extensions', theme, mode };
  await visit(page, extensionRoute);
  await button('本地上传').waitFor();
  await record('extensions');
  for (const time of [50, 150, 250]) {
    for (const [label, phase] of [['本地上传', 'enter'], ['取消', 'leave']]) {
      const animationName = 'p-animate-dialog-' + phase;
      await beginUploadAnimation(page, label, animationName);
      const { state, previousStyle } = await page.evaluate(({ animationName, time }) => {
        const animation = document.getAnimations().find(item => item.animationName === animationName);
        animation.currentTime = time;
        const target = animation.effect.target;
        const { opacity, transform } = getComputedStyle(target);
        const state = { time, timing: animation.effect.getTiming(), keyframes: animation.effect.getKeyframes(), opacity, transform };
        const previousStyle = target.getAttribute('style');
        // Rasterize the sampled pose deterministically once the native CSS
        // animation has supplied its actual transform and opacity.
        Object.assign(target.style, { animation: 'none', opacity, transform });
        return { state, previousStyle };
      }, { animationName, time });
      assert.equal(state.timing.duration, 300);
      await record('upload-' + phase + '-' + time + 'ms', { state });
      await dialog.evaluate((target, { name, style }) => {
        if (style === null) target.removeAttribute('style');
        else target.setAttribute('style', style);
        target.getAnimations().find(item => item.animationName === name)?.finish();
      }, { name: animationName, style: previousStyle });
      await dialog.waitFor({ state: phase === 'enter' ? 'visible' : 'hidden' });
    }
  }

  await button('本地上传').click();
  await setPicker(app, null);
  await button('选择文件夹').click();
  assert.equal(await button('上传').isDisabled(), true);
  await setPicker(app, fixtures.badExtension);
  await button('选择文件夹').click();
  await page.getByText('The selected folder does not contain a valid Chrome extension manifest', { exact: true }).waitFor();
  assert.equal(await button('上传').isDisabled(), true);
  await record('extension-invalid-manifest');
  await setPicker(app, fixtures.validExtension);
  await button('选择文件夹').click();
  assert.equal(await page.locator('input.extension-input').inputValue(), '扩展恢复验收');
  await button('取消').click();
  await dialog.waitFor({ state: 'hidden' });

  await visit(page, { ...extensionRoute, mode: mode + '-store' });
  await button('添加 Google 扩展').click();
  const address = dialog.getByRole('textbox');
  await address.fill('not-a-store-url');
  const submit = button('确认添加');
  await submit.click();
  const invalidUrl = page.getByText('请输入有效的 Chrome 应用商店 URL', { exact: true });
  await invalidUrl.waitFor();
  assert.equal(await address.inputValue(), 'not-a-store-url');
  const canRetry = await submit.isEnabled();
  await settleAnimations(page);
  const genericError = page.locator('.p-overlaybadge').filter({ has: page.getByText('操作失败', { exact: true }) });
  const duplicateError = await genericError.count() ? await genericError.first().boundingBox() : null;
  if (mode === 'source') {
    assert.ok(canRetry, 'A rejected URL must leave the dialog ready to retry');
    assert.equal(duplicateError, null, 'One error notification is enough');
  }
  const cancel = button('取消');
  const actions = await submit.locator('..').boundingBox();
  await record('extension-invalid-store-url', { state: { canRetry, duplicateError, actions } });
  await cancel.click();
  await dialog.waitFor({ state: 'hidden' });

  await visit(page, { route: '/browser/create', theme, mode });
  await page.getByText('窗口导入', { exact: true }).click();
  await button('上传文件').waitFor();
  const importForm = page.locator('.upload').locator('..');
  await setPicker(app, fixtures.invalidProfile);
  await button('上传文件').click();
  await page.getByText('平台账号 必须是 JSON 数组', { exact: true }).waitFor();
  assert.equal((await page.evaluate(() => globalThis.__localRequest('profiles:list'))).length, 0);
  await record('profile-invalid-import', { target: importForm });
  await setPicker(app, fixtures.validProfile);
  await button('上传文件').click();
  await page.getByText('1 个窗口已成功导入', { exact: true }).waitFor();
  assert.equal((await page.evaluate(() => globalThis.__localRequest('profiles:list'))).length, 0);
  await record('profile-import-retry', { target: importForm });
}

async function makeFixtures(data) {
  const fixtures = {
    badExtension: resolve(data, 'invalid-extension'), validExtension: resolve(data, 'valid-extension'),
    invalidProfile: resolve(data, 'invalid.txt'), validProfile: resolve(data, 'valid.txt'),
  };
  for (const [key, version] of [['badExtension', 0], ['validExtension', 3]]) {
    await fs.mkdir(fixtures[key]);
    await fs.writeFile(resolve(fixtures[key], 'manifest.json'), JSON.stringify({
      name: '扩展恢复验收', version: '1.0', manifest_version: version,
    }));
  }
  await fs.writeFile(fixtures.invalidProfile, 'windowName=导入恢复验收\nos=Linux\nwindowPlatformList={"bad":true}\n');
  await fs.writeFile(fixtures.validProfile, 'windowName=导入恢复验收\nos=Linux\ncoreType=Chrome\n');
  return fixtures;
}

async function main() {
  assert.ok(process.argv[2], 'Usage: node rebuild/full-workbench-parity-selftest.cjs <archive roxy-ui> [current roxy-ui]');
  const roots = { archive: await fs.realpath(process.argv[2]), source: await fs.realpath(process.argv[3] || resolve(appRoot, 'roxy-ui')) };
  assert.notEqual(roots.archive, roots.source, 'Pass two independent frontend roots');
  const hashes = {};
  for (const [mode, root] of Object.entries(roots)) {
    hashes[mode] = {};
    for (const file of bootAssets) {
      const content = await fs.readFile(path.join(root, file));
      hashes[mode][file] = createHash('sha256').update(content).digest('hex');
    }
  }
  assert.notDeepEqual(hashes.archive, hashes.source, 'The baseline must precede the source-built workbench');

  const data = await createTestDirectory('full-workbench-parity-');
  const output = evidenceDirectory('full-workbench-parity');
  const report = { passed: false, platform: process.platform, viewport, bootHashes: hashes, cases: [], errors: [], external: [] };
  const baseline = new Map();
  let app;
  let mode = 'startup';
  try {
    const fixtures = await makeFixtures(data);
    app = await launchVisualApp(appRoot, data, '');
    const page = await app.firstWindow();
    await disableReferenceCache(page);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => report.errors.push({ mode, error: error.message }));
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push({ mode, error: message.text() });
    });
    page.on('request', request => {
      if (/^(https?|wss?):/.test(request.url())) report.external.push({ mode, url: request.url() });
    });
    await page.getByText('暂无窗口', { exact: true }).waitFor();
    await installUiRoots(app, roots);
    for (mode of ['archive', 'source']) {
      await app.evaluate((_electron, mode) => { globalThis.__parity.mode = mode; }, mode);
      for (const theme of ['light', 'dark']) {
        await exercise(page, app, fixtures, theme, mode, async (name, { state, target = page } = {}) => {
          await page.mouse.move(2, 2);
          await settleAnimations(page);
          const id = theme + '-' + name;
          const file = path.join(output, id + '-' + mode + '.png');
          await captureStableScreenshot(page, file, target);
          if (mode === 'archive') baseline.set(id, { file, state });
          else {
            const before = baseline.get(id);
            const diff = path.join(output, id + '-diff.png');
            // Allow only the recovered submit control and the redundant
            // notification to change for the archived invalid-URL bug.
            const fixedRetry = name === 'extension-invalid-store-url' && !before.state.canRetry && state.canRetry;
            const bounds = fixedRetry ? [pixelBounds(before.state.actions, 8), pixelBounds(state.actions, 8)] : [];
            if (fixedRetry && before.state.duplicateError) bounds.push(pixelBounds(before.state.duplicateError, 16));
            const pixels = JSON.parse(execFileSync(process.env.PYTHON || 'python3', [
              resolve(__dirname, 'visual-pixel-diff.py'), before.file, file, diff, JSON.stringify(bounds),
            ], { encoding: 'utf8' }));
            const expectedFix = fixedRetry && pixels.unexpectedPixels === 0 && 'Store URL rejected, submit recovered';
            const stateMatches = JSON.stringify(before.state) === JSON.stringify(state);
            // Early scaled dialog frames can round icon edge alpha
            // differently across two loads, even after both poses are frozen.
            const rasterRounding = /^upload-(?:enter|leave)-50ms$/.test(name) && !pixels.equal && stateMatches &&
              pixels.changedPixels <= 32 && pixels.maxChannelDelta <= 2;
            report.cases.push({ id, ...pixels, stateMatches, ...(expectedFix && { expectedFix }),
              ...(rasterRounding && { rasterRounding }) });
          }
        });
      }
    }
    report.protocol = await app.evaluate(() => globalThis.__parity);
    assert.deepEqual(report.protocol.served, hashes);
    assert.deepEqual(report.protocol.failed, []);
    assert.deepEqual(report.errors.filter(item => item.mode !== 'archive'), []);
    assert.deepEqual(report.external, []);
    assert.equal(report.cases.length, baseline.size);
    assert.deepEqual(report.cases.filter(item => !item.expectedFix && !item.rasterRounding &&
      (!item.equal || !item.stateMatches)).map(item => item.id), []);
    report.passed = true;
  } catch (error) {
    report.failure = error.stack;
    throw error;
  } finally {
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await app?.close();
    await fs.rm(data, { recursive: true, force: true, maxRetries: 3 });
  }
  console.log('Full workbench parity:', report.cases.filter(item => item.equal).length, 'pixel-exact comparisons,',
    report.cases.filter(item => item.expectedFix).length, 'verified error recovery changes,',
    report.cases.filter(item => item.rasterRounding).length, 'bounded antialiasing comparisons');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
