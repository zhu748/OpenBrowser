'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const constants = require('node:fs').constants;
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory, waitUntil } = require('./selftest-helpers.cjs');
const { BrowserKernelManager } = require('../automation/browser-kernel');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');

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
        if (method === 'fingerprint:preview') globalThis.editorPreviewHistory.push({ payload, row: result[0] });
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
      const branch = versionOf(previousUa).split('.').slice(0, -1).join('.');
      const singleRandom = page.getByRole('button', { name: '随机', exact: true }).first();
      const wholeRandom = page.getByRole('button', { name: '一键随机指纹', exact: true });
      if (family === 'Firefox') {
        await page.getByText('Chrome', { exact: true }).first().click();
        await waitUntil(async () => (await readUa()).includes('Chrome/'));
        assert.equal(await singleRandom.isDisabled(), false, 'returning to Chrome enables patch randomization');
        await page.getByText('Firefox', { exact: true }).first().click();
        await waitUntil(async () => (await readUa()).includes('Firefox/'));
        previousUa = await readUa();
        assert.equal(await singleRandom.isDisabled(), true);
        assert.match(await singleRandom.getAttribute('title'), /Firefox.*标准 UA/);
        assert.match(previousUa, /Firefox\/\d+\.0$/);
        await singleRandom.scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(evidence, 'firefox-native-ua-disabled.png') });
      }
      for (const button of family === 'Firefox' ? [wholeRandom, wholeRandom] : [singleRandom, wholeRandom]) {
        const before = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1));
        await button.click();
        await waitUntil(async () => (await app.evaluate(() => globalThis.editorPreviewHistory.at(-1))).row._fingerprintDraft.seed !== before.row._fingerprintDraft.seed);
        if (family === 'Chrome') await waitUntil(async () => { const value = await readUa(); return value && value !== previousUa; });
        else assert.equal(await readUa(), previousUa);
        const latest = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1));
        assert.equal(latest.payload.os, before.payload.os, 'randomization preserves the chosen OS');
        assert.equal(latest.payload.coreType, family);
        assert.notEqual(latest.row._fingerprintDraft.seed, before.row._fingerprintDraft.seed);
        assert.equal(versionOf(latest.row.userAgent).split('.').slice(0, -1).join('.'), branch);
        assert.ok(family === 'Firefox' || Number(versionOf(latest.row.userAgent).split('.').at(-1)) >= 1);
        assert.equal(latest.row._fingerprintDraft.uaPatchRandomized, family === 'Chrome');
        previousUa = await readUa();
      }
      const expected = await app.evaluate(() => globalThis.editorPreviewHistory.at(-1).row);
      await page.locator('input').first().fill('真实表单随机 ' + family);
      await page.getByRole('button', { name: '创建窗口', exact: true }).last().click();
      await page.getByText('真实表单随机 ' + family, { exact: true }).waitFor();
      const saved = await page.evaluate(async name => (await globalThis.__localRequest('profiles:list')).find(row => row.windowName === name), '真实表单随机 ' + family);
      assert.equal(saved.userAgent, expected.userAgent);
      assert.equal(saved.fingerprintSeed, expected._fingerprintDraft.seed);
      assert.equal(saved.id, expected._fingerprintDraft.profileId, 'creation accepts the preview UUID');
      assert.equal(await app.evaluate((_host, id) => globalThis.editorTestEngine.fingerprintFor(id).seed, saved.id), expected._openbrowser.seed);
      assert.equal(saved.privacy.fingerprint.uaGenerated, true);
      assert.equal(saved.privacy.fingerprint.uaPatchRandomized, family === 'Chrome');
      await page.screenshot({ path: path.join(evidence, 'fingerprint-saved-' + family + '.png') });
      const legacyUa = await app.evaluate(async (_host, id) => {
        const engine = globalThis.editorTestEngine, current = engine.profiles.get(id);
        const userAgent = current.userAgent.replace(/((?:Chrome|Firefox)\/)([\d.]+)/, (_match, product, version) => {
          const parts = version.split('.');parts[parts.length - 1] = parts.at(-1) === '1' ? '2' : '1';return product + parts.join('.');
        });
        await engine.syncProfiles([{ ...current, privacy: { ...current.privacy,
          fingerprint: { ...current.privacy.fingerprint, userAgent } } }]);
        return userAgent;
      }, saved.id);
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
      await page.getByRole('button', { name: '保存', exact: true }).click();
      await page.getByText('真实表单随机 ' + family, { exact: true }).waitFor();
      const edited = await page.evaluate(id => globalThis.__localRequest('profiles:read', { id }), saved.id);
      assert.equal(edited.userAgent, editedUa);
      assert.equal(edited.privacy.fingerprint.userAgent, undefined, 'saving migrates the old hidden override');
      assert.equal(edited.privacy.fingerprint.uaPatchRandomized, family === 'Chrome', 'editing keeps the selected engine UA policy');
      assert.equal(await app.evaluate((_host, id) => globalThis.editorTestEngine.fingerprintFor(id).userAgent, saved.id), editedUa);
      assert.equal(await app.evaluate((_host, id) => globalThis.editorTestEngine.fingerprintFor(id).seed, saved.id), editPreview._openbrowser.seed);
    }
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(evidence, 'ua-seed-history.json'), JSON.stringify(await app.evaluate(() => globalThis.editorPreviewHistory.map(({ payload, row }) => ({
      os: payload.os, coreType: payload.coreType, userAgent: row.userAgent,
      seed: row._fingerprintDraft.seed, uaPatchRandomized: row._fingerprintDraft.uaPatchRandomized,
    }))), null, 2));
    console.log('PROFILE_FINGERPRINT_UI_SELFTEST OK (Chrome patch randomization, Firefox native UA/disabled single action, changing seed, unchanged OS and form-to-disk persistence)');
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
