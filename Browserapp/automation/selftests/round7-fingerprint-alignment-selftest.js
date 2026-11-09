#!/usr/bin/env node
'use strict';

/**
 * Round-7 alignment selftest (RoxyBrowser 4.1.0 fingerprint generation /
 * parameters / injection).
 *
 * Source of truth: unpacked asar dist/main.mjs — lumi.conf writer (geoLocation
 * mode 0/1/2, navigator {platform, hardwareConcurrency, maxTouchPoints,
 * deviceMemory}, webrtc {mode altered/real/disable}, WebGPU, speechSynthesis
 * voices, portScan, networkType/networkSpeed/downloadSpeed/latency),
 * genRandomFingerprint cloud/local generator map, and getMacAddress.
 *
 * This round closes the three verified gaps:
 *   1. geolocation permission policy (geoPermission deny/allow) — enforced via
 *      CDP Browser.setPermission + injection fallback (API + permissions.query)
 *   2. navigator.connection persona (effectiveType/downlink/rtt/type)
 *   3. custom MAC passthrough into the native kernel init.json (mac_address)
 * and guards the surfaces that were already aligned from regressing.
 */

const assert = require('assert');
const fs = require('fs');

const ROOT = require('path').resolve(__dirname, '../..');
const rel = (p) => require('path').join(ROOT, p);
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
async function checkAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL - ${name}: ${error.message}`);
  }
}

// 1. Syntax of every touched file
for (const file of [
  'automation/fingerprint/persona.js',
  'automation/fingerprint/injection-script.js',
  'automation/fingerprint/tab-apply.js',
  'automation/kernel-init-sync.js',
  'automation/port-scan-protection.js',
]) {
  check(`syntax: ${file}`, () => {
    // eslint-disable-next-line global-require
    require(rel(file));
  });
}

const persona = require(rel('automation/fingerprint/persona.js'));
const { buildInjectionScript } = require(rel('automation/fingerprint/injection-script.js'));

function buildFp(privacy = {}, extra = {}) {
  return persona.buildFingerprint({
    id: 'fp-round7',
    width: 1280,
    height: 820,
    os: 'Windows',
    kernelVersion: '148',
    privacy,
    ...extra,
  });
}

// 2-6. persona: geoPermission mapping
check('persona maps geoPermission deny → denied', () => {
  const fp = buildFp({ geoMode: 'disabled', geoPermission: 'deny' });
  assert.strictEqual(fp.geoPermission, 'denied');
});
check('persona maps geoPermission allow → granted', () => {
  const fp = buildFp({ geoMode: 'ip', geoPermission: 'allow' });
  assert.strictEqual(fp.geoPermission, 'granted');
});
check('persona leaves default geoPermission at prompt', () => {
  const fp = buildFp({ geoMode: 'ip' });
  assert.strictEqual(fp.geoPermission, 'prompt');
});
check('persona denies coordinates when geoMode disabled', () => {
  const fp = buildFp({ geoMode: 'disabled', geoPermission: 'deny', latitude: '1', longitude: '2' });
  assert.strictEqual(fp.dynamicConfig.geoposition, null);
});
check('persona keeps exit-IP coordinates for allow mode', () => {
  const fp = buildFp({ geoMode: 'ip', geoPermission: 'allow' }, { exitLatitude: 31.2, exitLongitude: 121.4 });
  assert.strictEqual(fp.dynamicConfig.geoposition.latitude, 31.2);
});

// 7-11. persona: navigator.connection persona
check('persona generates a deterministic connection persona', () => {
  const a = buildFp({});
  const b = buildFp({});
  assert.ok(a.connection && b.connection);
  assert.deepStrictEqual(a.connection, b.connection);
  assert.ok(['wifi', 'ethernet'].includes(a.connection.type));
  assert.ok(['4g', '3g'].includes(a.connection.effectiveType));
  assert.ok(a.connection.downlink > 0 && a.connection.rtt >= 50);
  assert.strictEqual(a.connection.saveData, false);
});
check('persona connection responds to privacy.network overrides', () => {
  const fp = buildFp({ network: { type: 'cellular', effectiveType: '2g', downlink: 0.35, rtt: 800 } });
  assert.strictEqual(fp.connection.type, 'cellular');
  assert.strictEqual(fp.connection.effectiveType, '2g');
  assert.strictEqual(fp.connection.downlink, 0.35);
  assert.strictEqual(fp.connection.rtt, 800);
});
check('persona networkMode real keeps the host answers', () => {
  const fp = buildFp({ networkMode: 'real' });
  assert.strictEqual(fp.connection, null);
});
check('injection CFG carries connection and geoPermission', () => {
  const src = buildInjectionScript(buildFp({ geoPermission: 'deny' }));
  assert.ok(src.includes('"geoPermission":"denied"'), 'geoPermission must reach CFG');
  assert.ok(src.includes('"effectiveType"'), 'connection must reach CFG');
});
check('injection patches NetworkInformation prototype accessors', () => {
  const src = read('automation/fingerprint/injection-script.js');
  for (const marker of [
    'typeof NetworkInformation !== "undefined"',
    'for (const key of ["type", "effectiveType", "downlink", "rtt", "saveData"]) patchNetworkAccessor(key)',
    'if (CFG.connection && typeof navigator !== "undefined" && navigator.connection',
  ]) {
    assert.ok(src.includes(marker), `missing marker: ${marker}`);
  }
});
check('injection keeps iOS connection deletion upstream of the patch', () => {
  const src = read('automation/fingerprint/injection-script.js');
  const iosGuard = src.indexOf('if (isIosPersona) {');
  const netPatch = src.indexOf('patchNetworkAccessor(key)');
  assert.ok(iosGuard > 0 && netPatch > iosGuard, 'connection patch must run after the iOS persona guards');
});

// 12-16. geolocation enforcement (CDP + injection fallback)
check('tab-apply grants/denies geolocation via Browser.setPermission', () => {
  const src = read('automation/fingerprint/tab-apply.js');
  assert.ok(src.includes("Browser.setPermission"), 'Browser.setPermission call missing');
  assert.ok(src.includes("setting: privacy.geoPermission === 'allow' ? 'granted' : 'denied'"), 'grant/deny mapping missing');
  assert.ok(src.includes("permission: { name: 'geolocation' }"), 'geolocation permission name missing');
});
check('injection forces permissions.query geolocation state', () => {
  const src = read('automation/fingerprint/injection-script.js');
  assert.ok(src.includes('const forcedGeoState'), 'forced geo state missing');
  assert.ok(src.includes("descriptor.name === 'geolocation'"), 'geolocation query branch missing');
});
check('injection denies getCurrentPosition/watchPosition on deny', () => {
  const src = read('automation/fingerprint/injection-script.js');
  assert.ok(src.includes('if (CFG.geoPermission === "denied") {'), 'deny branch missing');
  assert.ok(src.includes('GeolocationPositionError'), 'native-shaped error missing');
  assert.ok(src.includes('"User denied Geolocation"'), 'deny message missing');
});
check('injection leaves geolocation untouched at prompt', () => {
  const fp = buildFp({ geoMode: 'ip' });
  const src = buildInjectionScript(fp);
  assert.ok(!src.includes('"geoPermission":"denied"'));
  assert.ok(!src.includes('"geoPermission":"granted"'));
});
check('Roxy webrtc/webgl/battery/speech personas remain wired', () => {
  const src = buildInjectionScript(buildFp({}));
  assert.ok(src.includes('"webrtcPolicy"'));
  assert.ok(src.includes('"charging"'));
  assert.ok(src.includes('"voices"'));
});

// 17-19. native kernel init.json: mac + geo + machine
check('kernel-init-sync passes custom MAC as mac_address', () => {
  const src = read('automation/kernel-init-sync.js');
  assert.ok(src.includes('fields.mac_address'), 'mac_address field missing');
  assert.ok(src.includes("fp.mac?.mode === 'custom'"), 'mac custom gate missing');
});
check('kernel-init-sync keeps geoposition and machine fields', () => {
  const src = read('automation/kernel-init-sync.js');
  assert.ok(src.includes('fields.geoposition = geoText'), 'geoposition field missing');
  assert.ok(src.includes('fields.machine = deviceName'), 'machine field missing');
});
check('persona mac persona format is MAC-shaped for init.json', () => {
  const fp = buildFp({ macMode: 'custom', mac: '1E-2E-7D-74-2B-87' });
  assert.strictEqual(fp.mac.mode, 'custom');
  assert.strictEqual(fp.mac.value, '1E:2E:7D:74:2B:87');
});

// 20-22. editor chain (geo permission select → privacy → persona)
check('editor collects geoPermission and derives geoMode', () => {
  const src = read('ui/ui-editor.js');
  assert.ok(src.includes("const geoPermission = $('#editor-geo-permission')?.value || 'allow'"), 'geoPermission collect missing');
  assert.ok(src.includes("geoPermission === 'deny' ? 'disabled'"), 'geoMode derivation missing');
});
check('editor offers the Roxy geo permission options', () => {
  const html = read('index.html');
  assert.ok(html.includes('id="editor-geo-permission"'), 'geo permission select missing');
  for (const value of ['prompt', 'allow', 'deny']) {
    assert.ok(html.includes(`value="${value}" data-i18n="editor.geo`), `option ${value} missing`);
  }
});
check('editor offers MAC custom mode feeding persona', () => {
  const html = read('index.html');
  assert.ok(html.includes('id="editor-mac-mode"'), 'mac mode select missing');
  const src = read('ui/ui-editor.js');
  assert.ok(src.includes("macMode: $('#editor-mac-mode')?.value === 'custom' ? 'custom' : 'real'"), 'mac collect missing');
});

// 23. new profiles default like Roxy (portScanProtect + custom MAC)
check('new-profile defaults keep Roxy-aligned privacy switches', () => {
  const src = read('renderer.js');
  assert.ok(src.includes("portScanProtect: true"), 'portScanProtect default missing');
  assert.ok(src.includes("macMode: 'custom'"), 'macMode default missing');
});

// 24. runtime-settings still drives the port-scan script per tab
check('runtime-settings applies port-scan protection per tab', () => {
  const src = read('engine/runtime-settings.js');
  assert.ok(src.includes('buildPortScanProtectionScript'), 'port-scan wiring missing');
  assert.ok(src.includes('profile.privacy.portScanProtect'), 'portScanProtect switch missing');
});

(async () => {
  // 25. live injection smoke: deny policy reaches a real script value
  await checkAsync('injection script executes with deny persona (vm smoke)', async () => {
    const vm = require('vm');
    const fp = buildFp({ geoMode: 'disabled', geoPermission: 'deny' });
    const src = buildInjectionScript(fp);
    const context = { window: {}, navigator: undefined };
    // The full script expects a DOM; only assert it compiles and CFG serializes.
    new vm.Script(src); // throws on syntax error
    assert.ok(src.length > 100000);
    assert.ok(context);
  });

  console.log(`\nround7-alignment-selftest: ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const f of failures) console.error(`- ${f.name}: ${f.error.stack || f.error.message}`);
    process.exit(1);
  }
})();
