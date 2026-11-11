'use strict';

const assert = require('assert');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { BrowserEngine } = require('./engine');

async function main() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'openbrowser-profile-workflow-'));
  const app = { getPath: (name) => (name === 'userData' ? root : '') };
  const base = {
    id: 'workflow-env',
    number: 1,
    name: '1',
    browser: 'Google Chrome',
    networkMode: 'proxy',
    proxy: 'socks5://127.0.0.1:1080',
    platform: { type: 'other', startUrl: 'https://example.com/' },
  };
  try {
    const first = new BrowserEngine(app);
    await first.init(null);
    first.syncProfiles([{
      ...base,
      exitIp: '203.0.113.8',
      exitCountryCode: 'SG',
      exitTimezone: 'Asia/Singapore',
      exitLatitude: 1.3521,
      exitLongitude: 103.8198,
      exitCheckedAt: '2026-08-05T00:00:00.000Z',
      exitLatencyMs: 42,
      exitNetworkType: 'proxy',
    }]);
    await first.persist();

    const restarted = new BrowserEngine(app);
    await restarted.init(null);
    let profile = restarted.status().find((item) => item.id === base.id);
    assert.equal(profile.exitIp, '203.0.113.8', 'exit IP must survive engine restart');
    assert.equal(profile.exitCheckedAt, '2026-08-05T00:00:00.000Z', 'exit check time must survive engine restart');
    assert.equal(profile.exitLatencyMs, 42, 'exit latency must survive engine restart');
    assert.equal(profile.platform.startUrl, 'https://example.com/', 'startup URL must survive engine restart');

    restarted.syncProfiles([base]);
    profile = restarted.status().find((item) => item.id === base.id);
    assert.equal(profile.exitIp, '203.0.113.8', 'redacted renderer sync must not erase engine exit state');

    restarted.syncProfiles([{ ...base, proxy: 'socks5://127.0.0.1:2080' }]);
    profile = restarted.status().find((item) => item.id === base.id);
    assert.equal(profile.exitIp, '', 'changing proxy must invalidate the previous exit state');

    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const renderer = fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8');
    const fingerprintInject = require('./automation/fingerprint').buildInjectionScript(require('./automation/fingerprint').buildFingerprint(base));
    const fingerprintTab = fs.readFileSync(path.join(__dirname, 'automation', 'fingerprint', 'tab-apply.js'), 'utf8');
    const liveSync = fs.readFileSync(path.join(__dirname, 'live-sync-v5.js'), 'utf8');
    const nativeMirror = fs.readFileSync(path.join(__dirname, 'native-input-mirror.cs'), 'utf8');
    const main = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

    assert.ok(html.includes('name="startUrl"'), 'create dialog must expose startup URL');
    assert.ok(html.includes('id="batch-add-template"'), 'batch create must expose preference template');
    assert.ok(html.includes('id="copy-selected"'), 'selection bar must expose copy action');
    assert.ok(renderer.includes('delete privacy.fingerprint'), 'copied preferences must create an independent fingerprint identity');
    assert.ok(renderer.includes('assignedExtensions || []'), 'copied profiles must inherit source extension assignments');
    assert.ok(renderer.includes("platform: { type: 'other', startUrl }"), 'create flow must persist startup URL');
    assert.ok(main.includes("engine.checkProxy(profile, { persist: true })"), 'manual exit checks must persist in engine state');
    // checkProxy moved to the engine/profile-proxy.js mixin; its persist gate reads the mixin.
    assert.ok(fs.readFileSync(path.join(__dirname, 'engine', 'profile-proxy.js'), 'utf8').includes('if (options.persist) await this.persist()'), 'manual exit check must await durable persistence');
    // Phones pin the viewport; desktop metrics use zero dimensions so window
    // resize remains live while DPR and CSS device queries follow the persona.
    const tabInject = fingerprintTab.slice(fingerprintTab.indexOf('async function applyFingerprintToTab'));
    assert.ok(tabInject.includes("invoke('Emulation.setDeviceMetricsOverride'"));
    assert.ok(/width: 0,\s*height: 0,/.test(tabInject), 'desktop metrics must retain the live viewport');
    assert.ok(!tabInject.includes('Emulation.clearDeviceMetricsOverride'), 'DPR=1 must not restore the host DPI');
    assert.ok(fingerprintInject.includes("defineWindowMetric('innerWidth'"), 'native viewport must be bridged to the live DOM viewport');
    assert.ok(liveSync.includes('this.nativePopupActive'), 'window geometry sync must pause for native popups');
    assert.ok(liveSync.includes('hasVisibleExtensionSurface'), 'window geometry sync must inspect extension popup visibility');
    assert.ok(nativeMirror.includes('NATIVE_POPUP_ACTIVE='), 'native bridge must report popup foreground state');

    process.stdout.write(JSON.stringify({ success: true, checks: 18 }, null, 2));
  } finally {
    await fsp.rm(root, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  process.stderr.write(error.stack || error.message);
  process.exitCode = 1;
});
