'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');
const { createTestDirectory, waitUntil } = require('./selftest-helpers.cjs');
const { evidenceDirectory } = require('./compiler/evidence-path.cjs');

async function main() {
  if (!process.env.OPENBROWSER_TEST_KERNEL_BINARY) {
    console.log('SKIP Set OPENBROWSER_TEST_KERNEL_BINARY for the real browser lifecycle UI gate');process.exitCode = 2;return;
  }
  const root = await createTestDirectory('lifecycle-ui-'), evidence = evidenceDirectory();
  const errors = [];let app, page;
  try {
    app = await electron.launch({ executablePath: require('electron'),
      args: [...(process.platform === 'linux' ? ['--no-sandbox', '--ozone-platform=headless', '--disable-gpu'] : []), path.resolve(__dirname, '..')],
      env: { ...process.env, OPENBROWSER_USER_DATA: root, OPENBROWSER_HEADLESS: '1', OPENBROWSER_API_PORT: '0',
        OPENBROWSER_MASTER_KEY_FILE: path.join(root, 'master.key') } });
    page = await app.firstWindow();await page.setViewportSize({ width: 1536, height: 960 });page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    await page.waitForFunction(() => !!globalThis.__localRequest && !!globalThis.__router);
    await app.evaluate((_host, file) => {
      const { LocalService } = process.mainModule.require(file), original = LocalService.prototype.request;
      const cdp = process.mainModule.require('./cdp');
      const { buildDocumentDeliveryProbe } = process.mainModule.require('./automation/fingerprint/delivery-probe');
      const gates = new Map();
      globalThis.lifecycleTest = { gates, trace: [], failIp: false,
        hold(name) { let resolve;const promise = new Promise(done => { resolve = done; });gates.set(name, { promise, resolve, entered: false }); },
        async wait(name) { const gate = gates.get(name);if (gate) { gate.entered = true;await gate.promise; } },
        release(name) { gates.get(name)?.resolve();gates.delete(name); } };
      const test = globalThis.lifecycleTest;
      LocalService.prototype.request = async function(method, payload, ...args) {
        if (!test.engine) {
          const engine = test.engine = this.engine;
          engine.on(event => {
            if (/^profile-(start|stop|sync)-progress$/.test(event.type))
              test.trace.push({ id: event.id, type: event.type, phase: event.phase, percent: event.percent, at: Date.now() });
          });
          engine.ensureExitNetworkForLocale = async (_profile, options = {}) => {
            await test.wait('ip');
            if (test.failIp) throw Error('测试 IP 探测失败');
            const network = { ip: '203.0.113.25', countryCode: 'US', timezone: 'America/New_York', source: 'controlled-ui-fixture' };
            options.onNetwork?.(network);return network;
          };
          const apply = engine.applyRuntimeSettings, retain = engine.enforceDataRetention, drain = engine.drainProfileHelpers;
          engine.applyRuntimeSettings = async function(...args) { await test.wait('inject');return apply.apply(this, args); };
          const verify = engine.verifyStartupFingerprintDelivery;
          engine.verifyStartupFingerprintDelivery = async function(item, profile, fingerprint) {
            if (!test.replaceInitialRealm) return verify.call(this, item, profile, fingerprint);
            const tab = (await cdp.tabs(item.port)).find(candidate => candidate.url === 'about:blank');
            if (!tab) throw Error('Missing initial blank page for startup recovery test');
            const evaluate = expression => cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', { expression, returnByValue: true });
            // Remove the marker only in the current realm. Document-start registration remains active.
            await evaluate('Function.prototype.toString = () => ""');
            const marker = await evaluate(buildDocumentDeliveryProbe(fingerprint, { paused: true }));
            if (!marker.result?.value?.installationMissing || !marker.result.value.blankDocument)
              throw Error('Startup recovery test did not invalidate the initial blank page marker');
            const result = await verify.call(this, item, profile, fingerprint);
            test.recoveredInitialRealm = result.ok && result.liveProbe?.href === 'about:blank';
            return result;
          };
          engine.enforceDataRetention = async function(...args) {
            if (engine.stopping.size || [...engine.running.values()].some(item => item.stopping)) await test.wait('close');
            return retain.apply(this, args);
          };
          engine.drainProfileHelpers = async function(...args) {
            if (test.nativeClosing) await test.wait('native-close');return drain.apply(this, args);
          };
        }
        if (method === 'profiles:start') await test.wait('request');
        return original.call(this, method, payload, ...args);
      };
      for (const name of ['request', 'ip', 'inject', 'close']) test.hold(name);
    }, path.join(__dirname, 'local-service.js'));
    const profile = await page.evaluate(() => globalThis.__localRequest('profiles:create', {
      windowName: '启动状态对齐验收', os: 'Windows', coreType: 'Chrome', sandboxPermission: true,
      startupParam: '--headless=new', openWorkbench: false,
    }));
    const row = () => page.getByRole('row').filter({ hasText: '启动状态对齐验收' });
    const release = name => app.evaluate((_host, name) => globalThis.lifecycleTest.release(name), name);
    const shot = name => page.screenshot({ path: path.join(evidence, 'lifecycle-' + name + '.png') });
    await row().getByRole('button', { name: '打开窗口', exact: true }).click();
    await row().getByRole('button', { name: /启动中/ }).waitFor();await shot('starting');
    await release('request');
    await row().getByRole('button', { name: '检测 IP…', exact: true }).waitFor();
    assert.equal(await row().getByRole('button', { name: '检测 IP…', exact: true }).isDisabled(), true);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(true))));
    await shot('detect-ip');await release('ip');
    await waitUntil(() => app.evaluate(() => globalThis.lifecycleTest.gates.get('inject')?.entered), { timeout: 60000 });
    await row().getByRole('button', { name: '启动窗口', exact: true }).waitFor();
    const staged = await app.evaluate((_host, id) => ({ hasProcess: globalThis.lifecycleTest.engine.running.has(id),
      status: globalThis.lifecycleTest.engine.status().find(row => row.id === id) }), profile.id);
    assert.equal(staged.hasProcess, true);assert.equal(staged.status.running, false);
    assert.equal(staged.status.lifecycle.phase, 'inject');await shot('launch-window');
    await page.reload();await page.waitForFunction(() => !!globalThis.__localRequest);
    await row().getByRole('button', { name: '启动窗口', exact: true }).waitFor();await shot('reload-starting');
    await release('inject');await row().getByRole('button', { name: '查看', exact: true }).waitFor({ timeout: 60000 });
    assert.equal((await page.evaluate(() => globalThis.__localRequest('profiles:list'))).find(row => row.id === profile.id).openStatus, true);
    const generation = await app.evaluate((_host, id) => globalThis.lifecycleTest.engine.lifecycleGenerations.get(id), profile.id);
    await page.evaluate(id => globalThis.electronAPI.send('browser:batchLaunch', [id]), profile.id);
    await row().getByRole('button', { name: '查看', exact: true }).waitFor();
    assert.equal(await app.evaluate((_host, id) => globalThis.lifecycleTest.engine.lifecycleGenerations.get(id), profile.id), generation);
    await page.evaluate(id => { globalThis.lifecycleStop = globalThis.electronAPI.send('browser:batchClose', [id]); }, profile.id);
    await waitUntil(() => app.evaluate(() => globalThis.lifecycleTest.gates.get('close')?.entered), { timeout: 30000 });
    await row().getByRole('button', { name: '同步中…', exact: true }).waitFor();await shot('syncing');
    await page.reload();await page.waitForFunction(() => !!globalThis.__localRequest);
    await row().getByRole('button', { name: '同步中…', exact: true }).waitFor();await shot('reload-syncing');
    await release('close');await row().getByRole('button', { name: '打开窗口', exact: true }).waitFor();
    await app.evaluate(() => { globalThis.lifecycleTest.failIp = true; });
    await row().getByRole('button', { name: '打开窗口', exact: true }).click();
    await waitUntil(() => app.evaluate((_host, id) => globalThis.lifecycleTest.engine.status().find(row => row.id === id)?.lifecycle?.error, profile.id));
    await waitUntil(() => row().getByRole('button', { name: '打开窗口', exact: true }).isEnabled());await shot('probe-failed');
    await app.evaluate(() => {
      globalThis.lifecycleTest.failIp = false;
      globalThis.lifecycleTest.replaceInitialRealm = true;
      globalThis.lifecycleTest.hold('native-close');
    });
    await row().getByRole('button', { name: '打开窗口', exact: true }).click();
    await row().getByRole('button', { name: '查看', exact: true }).waitFor({ timeout: 60000 });
    assert.equal(await app.evaluate(() => globalThis.lifecycleTest.recoveredInitialRealm), true);
    await app.evaluate(async (_host, id) => {
      globalThis.lifecycleTest.nativeClosing = true;
      await globalThis.lifecycleTest.engine.running.get(id).cdpConnection.command('Browser.close', {}, { timeout: 5000 }).catch(() => {});
    }, profile.id);
    await row().getByRole('button', { name: '同步中…', exact: true }).waitFor();await shot('native-close');
    await release('native-close');await row().getByRole('button', { name: '打开窗口', exact: true }).waitFor();
    await fs.writeFile(path.join(evidence, 'lifecycle-trace.json'), JSON.stringify(await app.evaluate(() => globalThis.lifecycleTest.trace), null, 2));
    assert.deepEqual(errors, []);
    console.log('PROFILE_LIFECYCLE_UI_SELFTEST OK (real Chromium, controlled IP and cleanup, live progress, reload recovery, failures/retry and native close)');
  } catch (error) {
    if (page) { await shotFailure(); }
    throw error;
  } finally {
    if (app) await app.evaluate(() => { for (const name of [...(globalThis.lifecycleTest?.gates.keys() || [])]) globalThis.lifecycleTest.release(name); }).catch(() => {});
    await app?.close();await fs.rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
  async function shotFailure() {
    await fs.writeFile(path.join(evidence, 'lifecycle-failure.txt'), await page.locator('body').innerText());
    await page.screenshot({ path: path.join(evidence, 'lifecycle-failure.png') });
    await fs.writeFile(path.join(evidence, 'lifecycle-failure-trace.json'), JSON.stringify(await app.evaluate(() => globalThis.lifecycleTest?.trace), null, 2));
  }
}
main().catch(error => { console.error(error);process.exitCode = 1; });
