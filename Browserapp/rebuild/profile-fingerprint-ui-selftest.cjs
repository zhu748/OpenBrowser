'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const constants = require('node:fs').constants;
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory, waitUntil } = require('./selftest-helpers.cjs');
const { BrowserKernelManager } = require('../automation/browser-kernel');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');

const customMac = '02:00:00:12:34:56';
const customVendor = 'Test WebGL vendor';
const customRenderer = 'Test WebGL renderer';

async function settingsPanel(page, name) {
  const panel = page.getByRole('region', { name, exact: true });
  if (!await panel.isVisible()) await page.getByText(name, { exact: true }).click();
  await panel.waitFor();
  return panel;
}

const setting = (panel, label) => panel.locator('.rx-input').filter({
  has: panel.page().getByText(label, { exact: true }),
});

async function selectOption(page, panel, name, value, { filter = false } = {}) {
  const input = panel.locator('#' + name);
  await input.click();
  const listId = await input.getAttribute('aria-controls');
  const list = page.locator('[id=' + JSON.stringify(listId) + ']');
  if (filter) await list.locator('xpath=ancestor::*[contains(@class, "p-select-overlay")]').locator('.p-select-filter').fill(value);
  await list.getByRole('option', { name: value, exact: true }).click();
}

async function configureChrome(page, app, random, evidence) {
  const basic = await settingsPanel(page, '基础设置');
  const advanced = await settingsPanel(page, '高级指纹设置');
  await page.setViewportSize({ width: 1024, height: 680 });
  const box = await random.boundingBox();
  assert.ok(box && box.x + box.width <= 1024 && box.y + box.height <= 680,
    'the fingerprint action fits inside the smaller viewport');
  await page.screenshot({ path: path.join(evidence, 'fingerprint-narrow-editor.png') });
  await page.setViewportSize({ width: 1536, height: 1050 });

  const originalOs = await basic.locator('.switch-group').first().getByRole('button', { pressed: true }).getAttribute('aria-label');
  const mobileBattery = advanced.getByText('电池模拟', { exact: true });
  await mobileBattery.waitFor({ state: 'hidden' });
  await basic.getByRole('button', { name: 'Android', exact: true }).click();
  await mobileBattery.waitFor();
  await advanced.getByText('网络模拟', { exact: true }).waitFor();
  const bluetooth = setting(advanced, '蓝牙模拟');
  await bluetooth.getByRole('button', { name: '模拟不可用', exact: true }).click();
  const firefox = basic.getByRole('button', { name: 'Firefox', exact: true });
  assert.equal(await firefox.isDisabled(), true, 'Firefox requires a desktop OS');
  await basic.getByRole('button', { name: originalOs, exact: true }).click();
  await firefox.click();
  await mobileBattery.waitFor({ state: 'hidden' });
  assert.equal(await basic.getByRole('button', { name: 'Android', exact: true }).isDisabled(), true);
  await advanced.locator('#deviceMemory').waitFor({ state: 'hidden' });
  await basic.getByRole('button', { name: 'Chrome', exact: true }).click();
  await basic.getByRole('button', { name: 'Android', exact: true }).click();
  await mobileBattery.waitFor();
  await bluetooth.getByRole('button', { name: '模拟不可用', exact: true, pressed: true }).waitFor();
  await basic.getByRole('button', { name: originalOs, exact: true }).click();
  await mobileBattery.waitFor({ state: 'hidden' });

  const geo = setting(basic, '地理位置');
  await geo.getByRole('button', { name: '自定义', exact: true }).click();
  const longitude = basic.locator('input[name="longitude"]');
  assert.equal(await longitude.inputValue(), '');
  const mac = advanced.locator('input[name="macAddr"]');
  const deviceName = advanced.locator('input[name="deviceName"]');
  const [previousName, previousMac] = await Promise.all([deviceName.inputValue(), mac.inputValue()]);
  const previewCount = await app.evaluate(() => globalThis.editorPreviewHistory.length);
  await random.click();
  await waitUntil(async () => await app.evaluate(() => globalThis.editorPreviewHistory.length) > previewCount);
  const generated = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).row._fingerprintDraft.generatedHardware);
  await waitUntil(async () => (await deviceName.inputValue()) === generated.deviceName
    && (await mac.inputValue()) === generated.macAddr);
  assert.notEqual(generated.deviceName, previousName);
  assert.notEqual(generated.macAddr, previousMac);
  await geo.getByRole('button', { name: '基于 IP 匹配', exact: true }).click();

  assert.equal(await mac.isEditable(), true);
  const generatedMac = await mac.inputValue();
  const macFormat = /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/;
  assert.match(generatedMac, macFormat);
  await mac.locator('..').locator('.p-inputicon > *').click();
  await waitUntil(async () => (await mac.inputValue()) !== generatedMac);
  assert.match(await mac.inputValue(), macFormat);
  await mac.fill(customMac);
  const macMode = setting(advanced, 'MAC地址');
  await macMode.getByRole('button', { name: '真实', exact: true }).click();
  await mac.waitFor({ state: 'hidden' });
  await macMode.getByRole('button', { name: '自定义', exact: true }).click();
  assert.equal(await mac.inputValue(), customMac);

  const webgl = setting(advanced, 'WebGL Info');
  const vendor = advanced.locator('input[name="webGLManufacturer"]');
  const renderer = advanced.locator('textarea[name="webGLRender"]');
  await webgl.getByRole('button', { name: '真实', exact: true }).click();
  await vendor.waitFor({ state: 'hidden' });
  await webgl.getByRole('button', { name: '自定义', exact: true }).click();
  await vendor.fill(customVendor);
  await renderer.fill(customRenderer);
  await vendor.locator('..').locator('.p-inputicon > *').click();
  await waitUntil(async () => (await vendor.inputValue()) !== customVendor);
  assert.notEqual(await renderer.inputValue(), customRenderer);
  await vendor.fill(customVendor);
  await renderer.fill(customRenderer);
  const before = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).row._fingerprintDraft.seed);
  await random.click();
  await waitUntil(async () => await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).row._fingerprintDraft.seed) !== before);

  assert.equal(await mac.inputValue(), customMac);
  assert.equal(await vendor.inputValue(), customVendor);
  assert.equal(await renderer.inputValue(), customRenderer);
  assert.equal(await advanced.locator('#hardwareConcurrent').innerText(), '自动');
  assert.equal(await advanced.locator('#deviceMemory').innerText(), '自动');
  await selectOption(page, advanced, 'hardwareConcurrent', '跟随系统');
  await selectOption(page, advanced, 'hardwareConcurrent', '自动');
  await selectOption(page, advanced, 'hardwareConcurrent', '32');
  await selectOption(page, advanced, 'deviceMemory', '0.5');
  await setting(advanced, '分辨率').getByRole('button', { name: '自定义', exact: true }).click();
  await selectOption(page, advanced, 'resolution', '1366 x 768');
  await geo.getByRole('button', { name: '自定义', exact: true }).click();
  await longitude.fill('0');
  await basic.locator('input[name="latitude"]').fill('0');
  const previewCountWithResolution = await app.evaluate(() => globalThis.editorPreviewHistory.length);
  await random.click();
  await waitUntil(async () => await app.evaluate(() => globalThis.editorPreviewHistory.length) > previewCountWithResolution);
  const displayPreview = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).payload);
  assert.deepEqual([displayPreview.resolutionType, displayPreview.resolutionX, displayPreview.resolutionY], [true, '1366', '768']);
  assert.deepEqual([displayPreview.isPositionBaseIp, String(displayPreview.latitude), String(displayPreview.longitude)], [false, '0', '0']);
  const languageMode = setting(basic, '界面语言');
  await languageMode.getByRole('button', { name: '自定义', exact: true }).click();
  const german = await page.evaluate(() => new Intl.DisplayNames(['zh-CN'], { type: 'language' }).of('de-DE'));
  await selectOption(page, basic, 'language', german, { filter: true });
}

async function checkCreationTabs(page, app) {
  await page.evaluate(() => globalThis.__router.push('/browser/create'));
  const editor = page.locator('.profile-editor-viewport');
  const create = editor.getByRole('button', { name: '创建窗口', exact: true });
  await waitUntil(() => create.isEnabled());
  const tab = name => page.getByRole('tab', { name, exact: true });
  let advanced = await settingsPanel(page, '高级指纹设置');
  await selectOption(page, advanced, 'hardwareConcurrent', '24');
  await selectOption(page, advanced, 'deviceMemory', '2');
  await tab('批量创建').click();
  advanced = await settingsPanel(page, '高级指纹设置');
  await waitUntil(() => create.isEnabled());
  assert.equal(await advanced.locator('#hardwareConcurrent').innerText(), '24', 'tab switch preserves the chosen CPU count');
  assert.equal(await advanced.locator('#deviceMemory').innerText(), '2', 'tab switch preserves the chosen memory');

  await tab('窗口导入').click();
  await waitUntil(() => create.isEnabled());
  await app.evaluate(() => { globalThis.editorHoldNextPreview = true; });
  await editor.getByRole('button', { name: '一键随机指纹', exact: true }).click();
  await waitUntil(() => app.evaluate(() => Boolean(globalThis.editorReleasePreview)));
  try {
    await tab('单个创建').click();
    advanced = await settingsPanel(page, '高级指纹设置');
    await selectOption(page, advanced, 'hardwareConcurrent', '20');
  } finally {
    await app.evaluate(() => globalThis.editorReleasePreview());
  }
  await waitUntil(() => create.isEnabled());
  assert.equal(await advanced.locator('#hardwareConcurrent').innerText(), '20', 'a late import preview cannot overwrite the active editor');
  assert.equal(await advanced.locator('#deviceMemory').innerText(), '2');

  await app.evaluate(() => { globalThis.editorHoldNextPreview = true; });
  await editor.getByRole('button', { name: '一键随机指纹', exact: true }).click();
  await waitUntil(() => app.evaluate(() => Boolean(globalThis.editorReleasePreview)));
  try {
    await selectOption(page, advanced, 'hardwareConcurrent', '24');
    await selectOption(page, advanced, 'deviceMemory', '跟随系统');
  } finally {
    await app.evaluate(() => globalThis.editorReleasePreview());
  }
  await waitUntil(() => create.isEnabled());
  assert.equal(await advanced.locator('#hardwareConcurrent').innerText(), '24', 'a pending preview preserves later hardware edits');
  assert.equal(await advanced.locator('#deviceMemory').innerText(), '跟随系统');
  await page.evaluate(() => globalThis.__router.push('/browser'));
}

async function createMobileBatch(page) {
  await page.evaluate(() => globalThis.__router.push('/browser/create'));
  await page.getByRole('tab', { name: '批量创建', exact: true }).click();
  const editor = page.locator('.profile-editor-viewport');
  await editor.getByRole('button', { name: 'Android', exact: true }).click();
  await editor.getByText(/Firefox 当前支持桌面设备配置/).waitFor();
  await editor.getByRole('spinbutton').fill('2');
  await editor.locator('input[name="windowName"]').fill('指纹批量回归');
  const advanced = await settingsPanel(page, '高级指纹设置');
  await setting(advanced, '电池模拟').getByRole('button', { name: '开启', exact: true }).click();
  await advanced.locator('input[name="level"]').fill('0.75');
  await setting(advanced, '蓝牙模拟').getByRole('button', { name: '模拟不可用', exact: true }).click();
  await selectOption(page, advanced, 'hardwareConcurrent', '20');
  await selectOption(page, advanced, 'deviceMemory', '跟随系统');
  await editor.getByRole('button', { name: '创建窗口', exact: true }).click();
  await page.getByText('指纹批量回归 2', { exact: true }).waitFor();
  const rows = await page.evaluate(async () => (await globalThis.__localRequest('profiles:list'))
    .filter(row => row.windowName.startsWith('指纹批量回归 ')));
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.equal(row.os.toLowerCase(), 'android');
    assert.equal(row.privacy.cores, 20);
    assert.equal(row.privacy.memory, 0);
    assert.equal(row.privacy.batterySnapshot.level, 0.75);
    assert.equal(row.privacy.fingerprint.bluetooth, 'blocked');
  }
}

async function createFromTemplate(page, app) {
  const version = await page.evaluate(async () => (await globalThis.__localRequest('kernels:list'))
    .find(row => row.engine === 'chromium').version);
  const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 TemplateTest/1.0`;
  const template = await page.evaluate(userAgent => globalThis.__localRequest('templates:save', {
    templateName: '指纹模板回归',
    content: JSON.stringify({
      os: 'Linux', coreType: 'Chrome', useLatestCore: true, userAgent, _custom_ua: true,
      hardwareConcurrent: '24', deviceMemory: '0', deviceNameSwitch: true, deviceName: 'TEMPLATE-DEVICE',
    }),
  }), userAgent);
  const editor = page.locator('.profile-editor-viewport');
  const create = editor.getByRole('button', { name: '创建窗口', exact: true });
  const profiles = [];
  for (const index of [1, 2]) {
    const previewCount = await app.evaluate(() => globalThis.editorPreviewHistory.length);
    await page.evaluate(id => globalThis.__router.push({ path: '/browser/create', query: { templateId: String(id) } }), template.id);
    await editor.getByText(template.templateName, { exact: true }).waitFor();
    await waitUntil(() => create.isEnabled());
    assert.equal(await app.evaluate(() => globalThis.editorPreviewHistory.length), previewCount + 1);
    const advanced = await settingsPanel(page, '高级指纹设置');
    assert.equal(await advanced.locator('#hardwareConcurrent').innerText(), '24');
    assert.equal(await advanced.locator('#deviceMemory').innerText(), '跟随系统');
    assert.equal(await advanced.locator('input[name="deviceName"]').inputValue(), 'TEMPLATE-DEVICE');
    const basic = await settingsPanel(page, '基础设置');
    await basic.getByRole('button', { name: userAgent, exact: true }).waitFor();
    const name = '模板指纹保存 ' + index;
    await editor.locator('input').first().fill(name);
    await create.click();
    await page.getByText(name, { exact: true }).waitFor();
    const row = await page.evaluate(async name => (await globalThis.__localRequest('profiles:list'))
      .find(profile => profile.windowName === name), name);
    assert.equal(row.userAgent, userAgent);
    assert.equal(row.privacy.cores, 24);
    assert.equal(row.privacy.memory, 0);
    assert.equal(row.privacy.deviceName, 'TEMPLATE-DEVICE');
    profiles.push(row);
  }
  assert.notEqual(profiles[0].id, profiles[1].id);
  assert.notEqual(profiles[0].fingerprintSeed, profiles[1].fingerprintSeed);
}

async function importLargeFile(page, app, root) {
  const count = 102;
  const prefix = '容量导入回归 ';
  const file = path.join(root, 'large-import.txt');
  const rows = Array.from({ length: count }, (_, index) =>
    `windowName=${prefix}${index + 1}\nos=${index === count - 1 ? 'IOS' : 'Linux'}\ncoreType=Chrome`);
  await fs.writeFile(file, rows.join('\n####\n'));
  await app.evaluate(({ dialog }, file) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] });
  }, file);
  await page.evaluate(() => globalThis.__router.push('/browser/create'));
  await page.getByRole('tab', { name: '窗口导入', exact: true }).click();
  const editor = page.locator('.profile-editor-viewport');
  await editor.getByRole('button', { name: '上传文件', exact: true }).click();
  await editor.getByText(`${count} 个窗口已成功导入`, { exact: true }).waitFor();
  const create = editor.getByRole('button', { name: '创建窗口', exact: true });
  await waitUntil(() => create.isEnabled());
  const previousPreviews = await app.evaluate(() => globalThis.editorPreviewHistory.length);
  await create.click();
  await page.waitForFunction(() => globalThis.__router.currentRoute.value.path !== '/browser/create');
  const imported = await page.evaluate(async prefix => (await globalThis.__localRequest('profiles:list'))
    .filter(profile => profile.windowName.startsWith(prefix))
    .map(profile => ({ name: profile.windowName, sortNum: profile.sortNum, seed: profile.fingerprintSeed,
      os: profile.os, osVersion: profile.osVersion, ua: profile.userAgent })), prefix);
  imported.sort((a, b) => a.sortNum - b.sortNum);
  assert.deepEqual(imported.map(row => row.name), rows.map(row => row.split('\n')[0].slice('windowName='.length)));
  assert.equal(new Set(imported.map(row => row.seed)).size, count);
  assert.equal(imported.at(-1).os, 'IOS');
  assert.equal(imported.at(-1).osVersion, '');
  assert.match(imported.at(-1).ua, /iPhone; CPU iPhone OS/);
  const batches = await app.evaluate((_host, start) => globalThis.editorPreviewHistory
    .slice(start).map(({ payload }) => ({ os: payload.os, count: payload.count, version: payload.osVersion })), previousPreviews);
  assert.deepEqual(batches.filter(row => row.os === 'Linux').map(row => row.count), [100, 1]);
  assert.deepEqual(batches.filter(row => row.os === 'IOS'), [{ os: 'IOS', count: 1, version: '' }]);
}

async function main() {
  const chromium = process.env.OPENBROWSER_TEST_KERNEL_BINARY;
  const firefox = process.env.OPENBROWSER_FIREFOX_BINARY;
  if (!chromium || !firefox) { console.log('SKIP Set OPENBROWSER_TEST_KERNEL_BINARY and OPENBROWSER_FIREFOX_BINARY for the real two-engine editor gate'); process.exitCode = 2; return; }
  const root = await createTestDirectory('profile-fingerprint-ui-');
  const manager = new BrowserKernelManager(root);
  const verified = await manager.probeFirefoxBinary(firefox);
  const tree = path.join(manager.kernelsRoot, 'firefox', verified.version);
  await fs.mkdir(tree, { recursive: true });
  // Copy an actually verified Firefox installation, including its libraries.
  await fs.cp(path.dirname(firefox), path.join(tree, 'firefox'), { recursive: true, mode: constants.COPYFILE_FICLONE });
  await fs.writeFile(path.join(tree, 'kernel.json'), JSON.stringify({ engine: 'firefox', source: 'mozilla', version: verified.version }));
  const evidence = evidenceDirectory(), errors = [];
  let app;
  try {
    app = await electron.launch({ executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.resolve(__dirname, '..')],
      env: { ...process.env, OPENBROWSER_USER_DATA: root, OPENBROWSER_API_PORT: '0', OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'master.key') } });
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1536, height: 1050 });
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => !!globalThis.__router);
    await page.evaluate(() => {
      globalThis.previewErrors = [];
      const original = globalThis.__localUiError;
      globalThis.__localUiError = error => { globalThis.previewErrors.push(String(error)); return original?.(error); };
    });
    await app.evaluate((_host, file) => {
      const { LocalService } = process.mainModule.require(file), original = LocalService.prototype.request;
      globalThis.editorPreviewHistory = [];
      LocalService.prototype.request = async function(method, payload, ...rest) {
        globalThis.editorTestEngine = this.engine;
        const result = await original.call(this, method, payload, ...rest);
        if (method === 'fingerprint:preview') {
          globalThis.editorPreviewHistory.push({ payload, row: result[0] });
          if (globalThis.editorHoldNextPreview) {
            globalThis.editorHoldNextPreview = false;
            await new Promise(resolve => { globalThis.editorReleasePreview = resolve; });
            globalThis.editorReleasePreview = null;
          }
        }
        return result;
      };
    }, path.join(__dirname, 'local-service.js'));
    for (const family of ['Chrome', 'Firefox']) {
      console.log('EDITOR_PHASE', family);
      await page.evaluate(() => globalThis.__router.push('/browser/create'));
      await page.getByRole('button', { name: '一键随机指纹', exact: true }).waitFor();
      const ua = page.getByRole('button', { name: /^Mozilla\/5/ }).first();
      const readUa = () => page.evaluate(() => {
        const input = [...document.querySelectorAll('textarea')].find(node => /^Mozilla\/5/.test(node.value));
        return input?.value || [...document.querySelectorAll('button')].find(node => /^Mozilla\/5/.test(node.innerText))?.innerText || '';
      });
      if (!await ua.isVisible()) await page.getByText('基础设置', { exact: true }).click();
      if (family === 'Firefox') await page.getByText('Firefox', { exact: true }).first().click();
      await ua.waitFor();
      await waitUntil(async () => (await readUa()).includes(family + '/'));
      await page.getByText(new RegExp('^' + family + ' \\d+$'), { exact: true }).first().waitFor();
      const originalOs = await page.evaluate(async () => {
        const rows = await globalThis.__localRequest('kernels:list');
        return rows.length;
      });
      assert.ok(originalOs >= 2, 'both real kernels are available');
      let previousUa = await readUa();
      const versionOf = value => value.match(/(?:Chrome|Firefox)\/([\d.]+)/)?.[1];
      const major = versionOf(previousUa).split('.')[0];
      const singleRandom = page.getByRole('button', { name: '随机', exact: true }).first();
      const wholeRandom = page.getByRole('button', { name: '一键随机指纹', exact: true });
      if (family === 'Firefox') {
        await page.getByText('Chrome', { exact: true }).first().click();
        await waitUntil(async () => (await readUa()).includes('Chrome/'));
        assert.equal(await singleRandom.isDisabled(), false, 'returning to Chrome enables UA refresh');
        await page.getByText('Firefox', { exact: true }).first().click();
        await waitUntil(async () => (await readUa()).includes('Firefox/'));
        previousUa = await readUa();
        assert.equal(await singleRandom.isDisabled(), true);
        assert.match(await singleRandom.getAttribute('title'), /Firefox.*标准 UA/);
        assert.match(previousUa, /Firefox\/\d+\.0$/);
        await singleRandom.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(evidence, 'firefox-native-ua-disabled.png') });
      }
      for (const button of family === 'Firefox' ? [wholeRandom, wholeRandom] : [singleRandom, singleRandom, wholeRandom]) {
        const before = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1));
        const previewCount = await app.evaluate(() => globalThis.editorPreviewHistory.length);
        await button.click();
        await waitUntil(async () => await app.evaluate(() => globalThis.editorPreviewHistory.length) > previewCount);
        const latest = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1));
        await waitUntil(async () => (await readUa()) === latest.row.userAgent);
        assert.equal(latest.payload.os, before.payload.os, 'randomization preserves the chosen OS');
        assert.equal(latest.payload.coreType, family);
        assert.equal(latest.row._fingerprintDraft.seed === before.row._fingerprintDraft.seed, button === singleRandom);
        if (button === singleRandom) {
          assert.equal(latest.payload.previousUserAgent, previousUa);
          assert.equal(latest.row._fingerprintDraft.uaVersionRandomized, true);
          assert.equal(versionOf(latest.row.userAgent), latest.row._fingerprintDraft.clientHints.ua_full_version);
          const versions = require('../automation/data/chrome-release-versions.json').versions.windows[major] || [];
          if (versions.length > 1) assert.notEqual(latest.row.userAgent, previousUa);
        } else {
          assert.equal(versionOf(latest.row.userAgent), family === 'Firefox' ? major + '.0' : major + '.0.0.0');
        }
        if (family === 'Chrome')
          assert.equal(latest.row._fingerprintDraft.clientHints.ua_full_version.split('.')[0], major);
        assert.equal(latest.row._fingerprintDraft.uaPatchRandomized, false);
        previousUa = await readUa();
      }
      if (family === 'Chrome') await configureChrome(page, app, wholeRandom, evidence);
      const expected = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).row);
      await page.locator('input').first().fill('真实表单随机 ' + family);
      await page.getByRole('button', { name: '创建窗口', exact: true }).last().click();
      await page.getByText('真实表单随机 ' + family, { exact: true }).waitFor();
      const saved = await page.evaluate(async name => (await globalThis.__localRequest('profiles:list')).find(row => row.windowName === name), '真实表单随机 ' + family);
      assert.equal(saved.userAgent, expected.userAgent);
      assert.equal(saved.fingerprintSeed, expected._fingerprintDraft.seed);
      assert.equal(saved.id, expected._fingerprintDraft.profileId, 'creation accepts the preview UUID');
      assert.equal(saved.privacy.fingerprint.uaGenerated, true);
      assert.equal(saved.privacy.fingerprint.uaPatchRandomized, false);
      if (family === 'Chrome') {
        assert.equal(saved.privacy.mac, customMac);
        assert.equal(saved.privacy.deviceName, '');
        assert.equal(await app.evaluate((_host, id) => globalThis.editorTestEngine.fingerprintFor(id).deviceName, saved.id),
          expected.deviceName);
        assert.equal(saved.privacy.cores, 32);
        assert.equal(saved.privacy.memory, 0.5);
        assert.deepEqual([saved.privacy.geoMode, saved.privacy.latitude, saved.privacy.longitude], ['custom', 0, 0]);
        assert.equal(saved.privacy.fingerprint.screenWidth, 1366);
        assert.equal(saved.privacy.fingerprint.screenHeight, 768);
        assert.equal(saved.privacy.fingerprint.webglVendor, customVendor);
        assert.equal(saved.privacy.fingerprint.webglRenderer, customRenderer);
        assert.equal(saved.privacy.uiLanguage, 'de-DE');
      }
      await page.screenshot({ path: path.join(evidence, 'fingerprint-saved-' + family + '.png') });
      const legacyUa = await app.evaluate(async (_host, id) => {
        const engine = globalThis.editorTestEngine, current = engine.profiles.get(id);
        const userAgent = current.userAgent.replace(/((?:Chrome|Firefox)\/)([\d.]+)/, (_match, product, version) => {
          const parts = version.split('.');parts[parts.length - 1] = parts.at(-1) === '1' ? '2' : '1';return product + parts.join('.');
        });
        const screen = current.engine === 'chromium' ? { screenWidth: 1600, screenHeight: 1000 } : {};
        const location = current.engine === 'chromium' ? { geoMode: 'disabled' } : {};
        await engine.syncProfiles([{ ...current, privacy: { ...current.privacy, ...location,
          fingerprint: { ...current.privacy.fingerprint, ...screen, userAgent } } }]);
        return userAgent;
      }, saved.id);
      const beforeUaEdit = family === 'Chrome' ? await app.evaluate((_host, id) => {
        const { canvas, audio, clientRects } = globalThis.editorTestEngine.fingerprintFor(id);
        return { canvas, audio, clientRects };
      }, saved.id) : null;
      await page.evaluate(id => globalThis.__router.push('/browser/edit?id=' + id), saved.id);
      await page.getByRole('button', { name: '保存', exact: true }).waitFor();
      const editRandom = family === 'Firefox' ? page.getByRole('button', { name: '一键随机指纹', exact: true }) : page.getByRole('button', { name: '随机', exact: true }).first();
      if (!await ua.isVisible()) await page.getByText('基础设置', { exact: true }).click();
      await waitUntil(async () => !!(await readUa()));
      assert.equal(await readUa(), legacyUa, 'the editor shows the effective legacy override');
      await editRandom.click();
      await waitUntil(async () => { const value = await readUa();return value && value !== legacyUa; });
      const editedUa = await readUa();
      const editPreview = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).row);
      assert.equal(editPreview._fingerprintDraft.profileId, saved.id, 'edit preview is bound to its actual window');
      if (family === 'Chrome') {
        const basic = await settingsPanel(page, '基础设置');
        const advanced = await settingsPanel(page, '高级指纹设置');
        const geoPermission = setting(basic, '地理位置提示');
        const longitude = basic.locator('input[name="longitude"]');
        await geoPermission.getByRole('button', { name: '禁止', exact: true, pressed: true }).waitFor();
        await longitude.waitFor({ state: 'hidden' });
        await geoPermission.getByRole('button', { name: '允许', exact: true }).click();
        assert.equal(await longitude.inputValue(), '0');
        await setting(basic, '界面语言').getByRole('button', { name: '基于 IP 匹配', exact: true }).click();
        await basic.locator('#language').waitFor({ state: 'hidden' });
        assert.equal(await advanced.locator('input[name="macAddr"]').inputValue(), customMac);
        assert.equal(await advanced.locator('#hardwareConcurrent').innerText(), '32');
        assert.equal(await advanced.locator('#deviceMemory').innerText(), '0.5');
        assert.equal(await advanced.locator('#resolution').innerText(), '1600 x 1000');
      }
      await page.getByRole('button', { name: '保存', exact: true }).click();
      await page.getByText('真实表单随机 ' + family, { exact: true }).waitFor();
      const edited = await page.evaluate(id => globalThis.__localRequest('profiles:read', { id }), saved.id);
      assert.equal(edited.userAgent, editedUa);
      assert.equal(edited.privacy.fingerprint.userAgent, undefined, 'saving migrates the old hidden override');
      assert.equal(edited.privacy.fingerprint.uaPatchRandomized, false, 'editing keeps the selected engine UA policy');
      assert.equal(edited.privacy.fingerprint.uaVersionRandomized, family === 'Chrome');
      if (family === 'Chrome') {
        assert.equal(edited.privacy.uiLanguage, 'ip');
        assert.deepEqual([edited.privacy.geoMode, edited.privacy.geoPermission], ['custom', 'allow']);
        assert.equal(edited.privacy.fingerprint.screenWidth, 1600);
        assert.equal(edited.privacy.fingerprint.screenHeight, 1000);
      }
      assert.equal(await app.evaluate((_host, id) => globalThis.editorTestEngine.fingerprintFor(id).userAgent, saved.id), editedUa);
      assert.equal(edited.fingerprintSeed, family === 'Chrome' ? saved.fingerprintSeed : editPreview._fingerprintDraft.seed);
      if (beforeUaEdit) {
        const afterUaEdit = await app.evaluate((_host, id) => {
          const { canvas, audio, clientRects } = globalThis.editorTestEngine.fingerprintFor(id);
          return { canvas, audio, clientRects };
        }, saved.id);
        assert.deepEqual(afterUaEdit, beforeUaEdit, 'UA-only randomization preserves the persisted noise values');
      }
    }
    console.log('EDITOR_PHASE creation tabs');
    await checkCreationTabs(page, app);
    console.log('EDITOR_PHASE Android batch');
    await createMobileBatch(page);
    console.log('EDITOR_PHASE template');
    await createFromTemplate(page, app);
    console.log('EDITOR_PHASE large import');
    await importLargeFile(page, app, root);
    assert.deepEqual(errors, []);
    assert.deepEqual(await page.evaluate(() => globalThis.previewErrors), []);
    assert.equal(await app.evaluate(() => globalThis.editorPreviewHistory.every(({ row }) => !Object.hasOwn(row, '_openbrowser'))), true);
    await fs.writeFile(path.join(evidence, 'ua-seed-history.json'), JSON.stringify(await app.evaluate(() => globalThis.editorPreviewHistory.map(({ payload, row }) => ({
      os: payload.os, coreType: payload.coreType, userAgent: row.userAgent,
      seed: row._fingerprintDraft.seed, uaPatchRandomized: row._fingerprintDraft.uaPatchRandomized,
    }))), null, 2));
    console.log('PROFILE_FINGERPRINT_UI_SELFTEST OK (UA and seed, narrow layout, mobile controls, manual settings and persisted round trips)');
  } catch (error) {
    console.error('RENDER_ERRORS', errors, await app?.firstWindow().then(page => page.evaluate(() => globalThis.previewErrors)));
    console.error('PREVIEWS', await app?.evaluate(() => globalThis.editorPreviewHistory));
    for (const [index, page] of (app?.windows() || []).entries()) {
      await fs.writeFile(path.join(evidence, `fingerprint-ui-failure-${index}.txt`), await page.locator('body').innerText());
      await page.screenshot({ path: path.join(evidence, `fingerprint-ui-failure-${index}.png`) });
    }
    throw error;
  } finally {
    await app?.close();
    await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
