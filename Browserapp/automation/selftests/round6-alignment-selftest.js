#!/usr/bin/env node
'use strict';

/**
 * Round-6 alignment selftest (RoxyBrowser 4.1.0 client settings / sync
 * specials / blocked page).
 *
 * Source of truth: unpacked asar dist/main.mjs client settings object
 * (memoryLimit:95, diskLimit:8, closeSoft min/pop/exit), simulation
 * shortcuts, and web/blockDomain.html.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const rel = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(rel(p), 'utf8');

let passed = 0;
const failures = [];
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL - ${name}: ${error.message}`);
  }
}

// 1-2. Syntax of every touched file
for (const file of [
  'engine/resource-gate.js',
  'engine/runtime-settings.js',
  'engine/start.js',
  'automation/local-settings.js',
  'main.js',
  'preload.js',
  'renderer.js',
  'i18n.js',
]) {
  check(`syntax: ${file}`, () => {
    execFileSync(process.execPath, ['--check', rel(file)], { stdio: 'pipe' });
  });
}

// 3. Local settings defaults + clamps (Roxy: memoryLimit 95, diskLimit 8)
const settingsStore = require(rel('automation/local-settings.js'));
check('local-settings defaults match Roxy client settings', () => {
  settingsStore.initLocalSettings({ file: path.join(os.tmpdir(), `r6-selftest-${Date.now()}.json`), defaultProfileDataRoot: os.tmpdir() });
  const settings = settingsStore.getLocalSettings();
  assert.strictEqual(settings.memoryLimit, 95);
  assert.strictEqual(settings.diskLimit, 8);
  assert.ok(['ask', 'tray', 'exit'].includes(settings.closeAction));
});
check('local-settings clamps out-of-range values', () => {
  assert.strictEqual(settingsStore.clampMemoryLimit(0), 1);
  assert.strictEqual(settingsStore.clampMemoryLimit(150), 100);
  assert.strictEqual(settingsStore.clampMemoryLimit('abc'), 95);
  assert.strictEqual(settingsStore.clampDiskLimit(-5), 0);
  assert.strictEqual(settingsStore.clampDiskLimit(5000), 1024);
  assert.strictEqual(settingsStore.clampDiskLimit('abc'), 8);
});

// 4. Resource gate math + gate behavior
const resourceGate = require(rel('engine/resource-gate.js'));
check('resource-gate memory usage percent is sane', () => {
  const used = resourceGate.memoryUsagePercent();
  assert.ok(used >= 0 && used <= 100, `used=${used}`);
});

// 5. start.js wiring: resource gate runs before the proxy/network gate
check('start.js runs the resource gate before network gates', () => {
  const src = read('engine/start.js');
  const gate = src.indexOf('assertResourceGateForLaunch');
  const network = src.indexOf("ensureExitNetworkForLocale(profile, { force: true })");
  assert.ok(gate > 0, 'gate call missing');
  assert.ok(network > gate, 'gate must run before network gate');
  assert.match(src, /emitStartProgress\(profile\.id, 'resources'/);
});

// 6. Blocked page: fulfill for documents, fail for subresources, blacklist parity
check('runtime-settings serves a local blocked page for documents', () => {
  const src = read('engine/runtime-settings.js');
  assert.match(src, /resourceType === 'Document'/);
  assert.match(src, /Fetch\.fulfillRequest/);
  assert.match(src, /Fetch\.failRequest/);
  assert.match(src, /text\/html; charset=utf-8/);
  assert.match(src, /无法访问该网页/);
  assert.match(src, /该网址已被管理员禁止访问/);
});
check('runtime-settings enforces the blacklist through the same intercept', () => {
  const src = read('engine/runtime-settings.js');
  assert.match(src, /parseAllowHosts\(profile\?\.advanced\?\.blockUrls\)/);
  assert.match(src, /blockedByBlacklist/);
  assert.match(src, /ensureAllowIntercept\(engine, profile\.id, tab, allowHosts, blockHosts\)/);
});

// 7. Sync page: unified-tab actions + client settings IPC
check('main.js implements closeOthers / closeBlank tab actions', () => {
  const src = read('main.js');
  assert.match(src, /action === 'closeOthers'/);
  assert.match(src, /action === 'closeBlank'/);
  assert.match(src, /isBlankTab/);
});
check('main.js exposes client settings IPC', () => {
  const src = read('main.js');
  assert.match(src, /registerTrustedIpc\('system:get-client-settings'/);
  assert.match(src, /registerTrustedIpc\('system:save-client-settings'/);
});
check('preload exposes client settings ops', () => {
  const src = read('preload.js');
  assert.match(src, /getClientSettings/);
  assert.match(src, /saveClientSettings/);
});

// 8. Settings UI: launch-protection card (no duplicate close-action control)
check('index.html has the launch protection card', () => {
  const src = read('index.html');
  assert.match(src, /id="launch-gate-card"/);
  assert.match(src, /id="launch-memory-limit"/);
  assert.match(src, /id="launch-disk-limit"/);
  assert.match(src, /id="launch-gate-save"/);
  assert.ok(!src.includes('launch-close-action'), 'close action must not duplicate the existing close-action card');
});
check('index.html has the Roxy unified-tab buttons', () => {
  const src = read('index.html');
  assert.match(src, /id="close-other-tabs"/);
  assert.match(src, /id="close-blank-tabs"/);
});

// 9. i18n coverage for the new card
check('i18n has launchgate keys in zh and en', () => {
  const src = read('i18n.js');
  assert.match(src, /'system\.launchgate\.title': '启动保护'/);
  assert.match(src, /'system\.launchgate\.title': 'Launch protection'/);
  assert.match(src, /'system\.launchgate\.memory': '内存使用率上限（%）'/);
  assert.match(src, /'system\.launchgate\.memory': 'Memory usage limit \(%\)'/);
});

// 10. Renderer wiring: launch gate + sync shortcuts + new tab buttons
check('renderer wires the launch gate and Roxy sync shortcuts', () => {
  const src = read('renderer.js');
  assert.match(src, /getClientSettings/);
  assert.match(src, /saveClientSettings/);
  assert.match(src, /syncShortcutHandlers/);
  for (const code of ['KeyA', 'KeyD', 'KeyR', 'F3', 'F4', 'F5', 'KeyX', 'KeyB', 'KeyC', 'KeyN', 'KeyO', 'KeyL', 'KeyP']) {
    assert.ok(src.includes(`'${code}'`), `shortcut ${code} missing`);
  }
  assert.match(src, /'#close-other-tabs'/);
  assert.match(src, /'#close-blank-tabs'/);
});

(async () => {
  // async resource-gate behavior (needs await)
  try {
    // 纯判定：两条拒绝路径 + 放行
    assert.deepStrictEqual(resourceGate.evaluateResourceGate({ usedPercent: 96, availableGb: 20, memoryLimit: 95, diskLimit: 8 }).code, 'memory-limit');
    assert.deepStrictEqual(resourceGate.evaluateResourceGate({ usedPercent: 50, availableGb: 7.9, memoryLimit: 95, diskLimit: 8 }).code, 'disk-limit');
    assert.strictEqual(resourceGate.evaluateResourceGate({ usedPercent: 50, availableGb: 20, memoryLimit: 95, diskLimit: 8 }).ok, true);
    assert.strictEqual(resourceGate.evaluateResourceGate({ usedPercent: 50, availableGb: null, memoryLimit: 95, diskLimit: 8 }).ok, true, 'statfs 不可用时跳过磁盘项');
    passed += 1;
    console.log('  ok - evaluateResourceGate rejects memory/disk violations and passes otherwise');
  } catch (error) {
    failures.push({ name: 'evaluateResourceGate', error });
    console.error(`FAIL - evaluateResourceGate: ${error.message}`);
  }
  try {
    // 纯 Node 进程默认跳过（引擎自测环境）
    const skipped = await resourceGate.assertResourceGateForLaunch({ diskRoot: os.tmpdir() });
    assert.strictEqual(skipped.skipped, true);
    assert.strictEqual(skipped.memoryLimit, 95);
    assert.strictEqual(skipped.diskLimit, 8);
    passed += 1;
    console.log('  ok - resource gate skips in plain Node (selftest) with Roxy defaults');
  } catch (error) {
    failures.push({ name: 'resource gate skip path', error });
    console.error(`FAIL - resource gate skip path: ${error.message}`);
  }
  try {
    // 启用前提是 Electron 主进程（process.type === 'browser'）；纯 Node 里即使
    // 设置了环境变量也保持跳过——拒绝路径由上方单元测试覆盖。
    process.env.OPENBROWSER_RESOURCE_GATE = 'on';
    const stillSkipped = await resourceGate.assertResourceGateForLaunch({ diskRoot: os.tmpdir() });
    delete process.env.OPENBROWSER_RESOURCE_GATE;
    assert.strictEqual(stillSkipped.skipped, true);
    passed += 1;
    console.log('  ok - gate stays disabled outside the Electron main process');
  } catch (error) {
    delete process.env.OPENBROWSER_RESOURCE_GATE;
    failures.push({ name: 'gate stays disabled outside Electron', error });
    console.error(`FAIL - gate stays disabled outside Electron: ${error.message}`);
  }
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const { name, error } of failures) console.error(`- ${name}: ${error.stack || error.message}`);
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
