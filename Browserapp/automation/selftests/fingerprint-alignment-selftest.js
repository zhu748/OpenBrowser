#!/usr/bin/env node
'use strict';

/**
 * Fingerprint settings alignment selftest.
 *
 * Covers the settings-parity additions (full fingerprint-config field coverage):
 * 1. Sanitizer round-trip: MAC address, hardware acceleration, sandbox, custom
 *    launch args, fullscreen/window position, search engine, font list mode,
 *    resolution follow-system, IP change policy, launch-time clearing, CPU 20/24.
 * 2. Persona effects: custom WebGL vendor/renderer override, MAC normalization,
 *    font list real/noise modes, screen follow-host via profile.hostScreen.
 * 3. Chrome args: hardware-acceleration off, --no-sandbox.
 * 4. UI wiring: every new editor control id present in index.html; start.js
 *    applies launch-time behavior (args, Preferences write, data clearing).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { buildFingerprint } = require('../../automation/fingerprint');
const { chromeArgsForFingerprint } = require('../../automation/fingerprint/chrome-args');
const { completeLaunchArguments } = require('../../engine/launch-arguments');

const REPO_HTML = path.join(__dirname, '..', '..', 'index.html');
const START_JS = path.join(__dirname, '..', '..', 'engine', 'start.js');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    awaitable(fn, () => { passed += 1; console.log(`  ok  ${name}`); });
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}: ${error && error.message ? error.message : error}`);
  }
}

// Support sync fns; keep signature simple like the other selftests.
function awaitable(fn, done) {
  const result = fn();
  if (result && typeof result.then === 'function') return result.then(done, (error) => { throw error; });
  done();
  return null;
}

function baseProfile(extra = {}) {
  return {
    id: 'env-align-1',
    name: '1',
    number: 1,
    os: 'Windows',
    language: 'en-US',
    networkMode: 'direct',
    proxy: 'Direct',
    width: 1280,
    height: 820,
    privacy: {},
    advanced: {},
    ...extra,
  };
}

async function main() {
  console.log('\n== 1. sanitizer round-trip ==');

  const sanitized = sanitizeProfile(baseProfile({
    privacy: {
      macMode: 'custom',
      mac: '1e-2e-7d-74-2b-87',
      hardwareAcceleration: 'off',
      noSandbox: true,
      customArgs: '--mute; --disable-features=Translate; rm -rf /; --flag="bad quote"',
      resolutionMode: 'real',
      fontListMode: 'noise',
      fullscreen: true,
      windowPos: 'mm',
      searchEngine: 'bing',
      cores: 24,
      memory: 16,
      fingerprint: { webglVendor: 'Google Inc. (NVIDIA)\n', webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
    },
    advanced: {
      clearCookiesOnStart: true,
      clearLocalStorageOnStart: true,
      ipChangePolicy: 'stop',
    },
  }));

  check('mac normalizes to colon-separated uppercase', () => {
    assert.strictEqual(sanitized.privacy.mac, '1E:2E:7D:74:2B:87');
    assert.strictEqual(sanitized.privacy.macMode, 'custom');
  });
  check('invalid mac is dropped to empty string', () => {
    const bad = sanitizeProfile(baseProfile({ privacy: { mac: 'zz:11:22:33:44:55', macMode: 'custom' } }));
    assert.strictEqual(bad.privacy.mac, '');
  });
  check('hardwareAcceleration off survives', () => {
    assert.strictEqual(sanitized.privacy.hardwareAcceleration, 'off');
  });
  check('noSandbox survives', () => {
    assert.strictEqual(sanitized.privacy.noSandbox, true);
  });
  check('customArgs keeps switch-shaped tokens only', () => {
    assert.strictEqual(sanitized.privacy.customArgs, '--mute --disable-features=Translate');
  });
  check('resolutionMode real survives', () => {
    assert.strictEqual(sanitized.privacy.resolutionMode, 'real');
  });
  check('fontListMode noise survives', () => {
    assert.strictEqual(sanitized.privacy.fontListMode, 'noise');
  });
  check('fullscreen + window position survive', () => {
    assert.strictEqual(sanitized.privacy.fullscreen, true);
    assert.strictEqual(sanitized.privacy.windowPos, 'mm');
  });
  check('invalid window position falls back to default', () => {
    const bad = sanitizeProfile(baseProfile({ privacy: { windowPos: 'xx' } }));
    assert.strictEqual(bad.privacy.windowPos, '');
  });
  check('search engine enum survives', () => {
    assert.strictEqual(sanitized.privacy.searchEngine, 'bing');
  });
  check('cpu 20/24 now valid, deviceMemory stays spec-capped', () => {
    const c24 = sanitizeProfile(baseProfile({ privacy: { cores: 24 } }));
    assert.strictEqual(c24.privacy.cores, 24);
    const c20 = sanitizeProfile(baseProfile({ privacy: { cores: 20 } }));
    assert.strictEqual(c20.privacy.cores, 20);
    // navigator.deviceMemory is spec-quantised to max 8; 16 must not be accepted
    const m16 = sanitizeProfile(baseProfile({ privacy: { memory: 16 } }));
    assert.strictEqual(m16.privacy.memory, null);
  });
  check('webgl custom vendor/renderer clamp newlines', () => {
    assert.strictEqual(sanitized.privacy.fingerprint.webglVendor, 'Google Inc. (NVIDIA) ');
    assert.ok(sanitized.privacy.fingerprint.webglRenderer.startsWith('ANGLE (NVIDIA'));
  });
  check('advanced launch-time clearing + ip policy survive', () => {
    assert.strictEqual(sanitized.advanced.clearCookiesOnStart, true);
    assert.strictEqual(sanitized.advanced.clearLocalStorageOnStart, true);
    assert.strictEqual(sanitized.advanced.ipChangePolicy, 'stop');
  });
  check('ipChangePolicy defaults to patch', () => {
    const plain = sanitizeProfile(baseProfile());
    assert.strictEqual(plain.advanced.ipChangePolicy, 'patch');
  });

  console.log('\n== 1.5 noise-seed / battery / strict-UA / fonts / ssl round-trip ==');
  const seeded = sanitizeProfile(baseProfile({
    privacy: {
      fingerprint: {
        canvasId: 777,
        clientRectsId: -42,
        audioId: 0.25,
        battery: { charging: true, level: 5 },
        uaStrict: true,
        fonts: [' Foo Sans ', 'Bar\n', ''],
        sslVersionMin: 'tls1.2',
        sslBlacklist: '0x0004, 0x0005, bad, 0x000a',
      },
    },
  }));
  check('numeric seeds survive and drop zero/invalid', () => {
    assert.strictEqual(seeded.privacy.fingerprint.canvasId, 777);
    assert.strictEqual(seeded.privacy.fingerprint.clientRectsId, -42);
    assert.strictEqual(seeded.privacy.fingerprint.audioId, 0.25);
    const zero = sanitizeProfile(baseProfile({ privacy: { fingerprint: { canvasId: 0 } } }));
    assert.strictEqual(zero.privacy.fingerprint.canvasId, undefined);
    const blank = sanitizeProfile(baseProfile({ privacy: { fingerprint: { canvasId: '' } } }));
    assert.strictEqual(blank.privacy.fingerprint.canvasId, undefined);
  });
  check('battery level clamps into 0-1, charging normalizes, times survive', () => {
    // seeded may or may not carry times; assert the invariants, not an exact shape.
    const b = seeded.privacy.fingerprint.battery;
    assert.ok(b && typeof b === 'object');
    assert.strictEqual(b.charging, true);
    assert.strictEqual(b.level, 1);
    if (b.chargingTime !== undefined) assert.ok(Number.isFinite(b.chargingTime) && b.chargingTime >= 0);
    assert.strictEqual(b.dischargingTime, null, 'charging batteries have infinite dischargingTime');
    const off = sanitizeProfile(baseProfile({ privacy: { fingerprint: { battery: { charging: false, level: 0.3 } } } }));
    assert.deepStrictEqual(off.privacy.fingerprint.battery, { charging: false, level: 0.3, chargingTime: null, dischargingTime: null });
    // Round-3 fix: the editor writes chargingTime/dischargingTime and the
    // generators consume them (generators.js:518-523) — the old sanitizer
    // silently stripped both on every save. They must now survive.
    const withTimes = sanitizeProfile(baseProfile({ privacy: { fingerprint: { battery: { charging: true, level: 0.5, chargingTime: 60, dischargingTime: 120 } } } }));
    assert.deepStrictEqual(withTimes.privacy.fingerprint.battery, { charging: true, level: 0.5, chargingTime: 60, dischargingTime: null });
    // Round-3 fix: the STRING form is the battery MODE enum (persona.js:81),
    // previously dropped wholesale; a valid enum value survives, junk drops.
    const junkEnum = sanitizeProfile(baseProfile({ privacy: { fingerprint: { battery: 'noise' } } }));
    assert.strictEqual(junkEnum.privacy.fingerprint.battery, 'noise');
    const junk = sanitizeProfile(baseProfile({ privacy: { fingerprint: { battery: 'bogus' } } }));
    assert.strictEqual(junk.privacy.fingerprint.battery, undefined);
  });
  check('uaStrict survives as boolean', () => {
    assert.strictEqual(seeded.privacy.fingerprint.uaStrict, true);
    assert.strictEqual(sanitizeProfile(baseProfile()).privacy.fingerprint?.uaStrict, undefined);
  });
  check('custom font list strips empties', () => {
    assert.deepStrictEqual(seeded.privacy.fingerprint.fonts, ['Foo Sans', 'Bar']);
  });
  check('ssl settings keep valid values and filter junk', () => {
    assert.strictEqual(seeded.privacy.fingerprint.sslVersionMin, 'tls1.2');
    assert.strictEqual(seeded.privacy.fingerprint.sslBlacklist, '0x0004,0x0005,0x000a');
    const bad = sanitizeProfile(baseProfile({ privacy: { fingerprint: { sslVersionMin: 'tls1.0', sslBlacklist: '802.11' } } }));
    assert.strictEqual(bad.privacy.fingerprint.sslVersionMin, undefined);
    assert.strictEqual(bad.privacy.fingerprint.sslBlacklist, undefined);
  });

  console.log('\n== 2. persona effects ==');

  const customFp = buildFingerprint(baseProfile({
    privacy: {
      webglMeta: 'custom',
      macMode: 'custom',
      mac: 'AA-BB-CC-DD-EE-FF',
      fontListMode: 'real',
      resolutionMode: 'real',
      fingerprint: {
        webglVendor: 'Google Inc. (NVIDIA)',
        webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      },
    },
    hostScreen: { width: 2560, height: 1440 },
  }));
  check('custom webgl vendor/renderer honored', () => {
    assert.strictEqual(customFp.webgl.metaMode, 'custom');
    assert.strictEqual(customFp.webgl.vendor, 'Google Inc. (NVIDIA)');
    assert.strictEqual(customFp.webgl.renderer, 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)');
  });
  check('custom mac recorded normalized', () => {
    assert.strictEqual(customFp.mac.mode, 'custom');
    assert.strictEqual(customFp.mac.value, 'AA:BB:CC:DD:EE:FF');
  });
  check('fontListMode real returns host font list (null persona list)', () => {
    assert.strictEqual(customFp.fonts, null);
  });
  check('resolutionMode real follows hostScreen', () => {
    assert.strictEqual(customFp.screen.width, 2560);
    assert.strictEqual(customFp.screen.height, 1440);
  });

  const noiseFp = buildFingerprint(baseProfile({
    os: 'Linux',
    privacy: { fontListMode: 'noise', resolutionMode: '' },
  }));
  check('fontListMode noise forces persona font list on same-OS profiles', () => {
    // linux host + linux claim would otherwise answer from the host list (fonts: null)
    assert.ok(Array.isArray(noiseFp.fonts?.list) && noiseFp.fonts.list.length > 0, 'expected forced font list');
  });

  const defaultFp = buildFingerprint(baseProfile());
  check('default mac mode real carries empty value', () => {
    assert.strictEqual(defaultFp.mac.mode, 'real');
    assert.strictEqual(defaultFp.mac.value, '');
  });

  console.log('\n== 2.5 persona honors explicit seeds / battery / strict UA / custom fonts ==');

  const seedFp = buildFingerprint(baseProfile({
    privacy: {
      fingerprint: { canvasId: 777, clientRectsId: -42, audioId: 0.25, battery: { charging: true, level: 0.42 } },
    },
  }));
  check('canvas/crects/audio marks follow explicit seeds', () => {
    assert.strictEqual(seedFp.canvas.mark, 777);
    assert.strictEqual(seedFp.clientRects.mark, -42);
    assert.strictEqual(seedFp.audio.mark, 0.25);
  });
  check('battery override applies fixed level', () => {
    assert.strictEqual(seedFp.battery.value.level, 0.42);
    assert.strictEqual(seedFp.battery.value.charging, true);
    assert.strictEqual(seedFp.battery.mode, 'noise');
  });
  const autoFp = buildFingerprint(baseProfile());
  check('without overrides marks stay seed-driven', () => {
    assert.ok(!Number.isFinite(Number(baseProfile().privacy?.fingerprint?.canvasId)));
    assert.strictEqual(typeof autoFp.canvas.mark, 'number');
  });

  const strictFp = buildFingerprint(baseProfile({
    kernelVersion: '148.0.7204.0',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    privacy: { fingerprint: { uaStrict: true } },
  }));
  check('uaStrict rewrites UA major to kernel major', () => {
    assert.ok(/Chrome\/148\./.test(String(strictFp.userAgent)), `expected Chrome/148 in ${strictFp.userAgent}`);
    assert.ok(!/Chrome\/120\./.test(String(strictFp.userAgent)));
  });
  const looseFp = buildFingerprint(baseProfile({
    kernelVersion: '148.0.7204.0',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }));
  check('without strict mode custom UA major is kept', () => {
    assert.ok(/Chrome\/120\./.test(String(looseFp.userAgent)));
  });

  const fontsFp = buildFingerprint(baseProfile({
    privacy: { fontListMode: 'custom', fingerprint: { fonts: ['Foo Sans', 'Bar Serif'] } },
  }));
  check('custom font list passes through to persona fonts', () => {
    assert.deepStrictEqual(fontsFp.fonts?.list, ['Foo Sans', 'Bar Serif']);
  });

  console.log('\n== 3. chrome args ==');

  const argsOff = chromeArgsForFingerprint({ webgl: { mode: 'noise' } }, baseProfile({ privacy: { hardwareAcceleration: 'off', noSandbox: true } }), {});
  check('hardware acceleration off adds software rendering flags', () => {
    for (const flag of ['--disable-gpu', '--disable-gpu-compositing', '--use-angle=swiftshader']) {
      assert.ok(argsOff.includes(flag), `missing ${flag}`);
    }
  });
  check('noSandbox adds --no-sandbox', () => {
    assert.ok(argsOff.includes('--no-sandbox'));
  });
  const argsOn = chromeArgsForFingerprint({ webgl: { mode: 'noise' } }, baseProfile(), {});
  check('default profile does not force software rendering', () => {
    assert.ok(!argsOn.includes('--disable-gpu'));
    assert.ok(!argsOn.includes('--no-sandbox'));
  });
  const argsSsl = chromeArgsForFingerprint({ webgl: { mode: 'noise' } }, baseProfile({
    privacy: { fingerprint: { sslVersionMin: 'tls1.2', sslBlacklist: '0x0004, 0x0005, junk, 0x000a' } },
  }), {});
  check('ssl settings emit real chromium switches', () => {
    assert.ok(argsSsl.includes('--ssl-version-min=tls1.2'));
    assert.ok(argsSsl.includes('--cipher-suite-black-list=0x0004,0x0005,0x000a'));
    const plain = chromeArgsForFingerprint({ webgl: { mode: 'noise' } }, baseProfile(), {});
    assert.ok(!plain.some((a) => a.startsWith('--ssl-version-min') || a.startsWith('--cipher-suite-black-list')));
  });

  console.log('\n== 4. UI + launch wiring ==');

  const html = fs.readFileSync(REPO_HTML, 'utf8');
  for (const id of [
    'editor-random-fp', 'editor-mac-mode', 'editor-mac', 'editor-mac-shuffle',
    'editor-webgl-custom-fields', 'editor-webgl-vendor', 'editor-webgl-renderer',
    'editor-webgl-vendor-shuffle', 'editor-webgl-renderer-shuffle',
    'editor-gpu-mode', 'editor-no-sandbox', 'editor-custom-args', 'editor-search-engine',
    'editor-font-list-mode', 'editor-fullscreen', 'editor-window-pos',
    'editor-clear-cookies', 'editor-clear-localstorage', 'editor-ip-change-policy',
    'editor-canvas-seed', 'editor-crects-seed', 'editor-audio-seed', 'editor-battery-level',
    'editor-ua-strict', 'editor-font-list', 'editor-ssl-min', 'editor-ssl-blacklist',
  ]) {
    check(`index.html has #${id}`, () => {
      assert.ok(html.includes(`id="${id}"`), `missing id="${id}"`);
    });
  }
  check('resolution select has follow-system option', () => {
    assert.ok(/id="editor-resolution"[^<]*<option value="real">/.test(html.replace(/\n/g, '')) || html.includes('<option value="real">跟随系统</option>'));
  });
  check('webgl meta select has custom option', () => {
    assert.ok(html.includes('<option value="custom">自定义</option>'));
  });
  check('cpu select offers 20/24 cores', () => {
    // Labels use the RoxyBrowser parity style ("20核", no space) since the
    // editor restyle; the assertion tracks the capability, not the label copy.
    assert.ok(html.includes('<option value="20">20核</option>'));
    assert.ok(html.includes('<option value="24">24核</option>'));
  });

  const startSrc = fs.readFileSync(START_JS, 'utf8');
  check('launch configuration applies fullscreen', () => {
    const profile = sanitizeProfile(baseProfile({ privacy: { fullscreen: true } }));
    const { args } = completeLaunchArguments([], { profile, proxyEndpoint: '' });
    assert.ok(args.includes('--start-fullscreen'));
  });
  for (const marker of [
    'applyDefaultSearchEngine(root, profile.privacy.searchEngine)',
    'clearProfileLaunchData(root, profile)',
    'windowPositionArg(profile)',
    "profile.advanced.ipChangePolicy === 'stop'",
    'ip-change-notice',
    'hostScreen: hostScreenSummary()',
  ]) {
    check(`start.js applies: ${marker}`, () => {
      assert.ok(startSrc.includes(marker), `missing ${marker}`);
    });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error('selftest crashed:', error);
  process.exit(1);
});
