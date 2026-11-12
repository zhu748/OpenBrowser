'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { buildEditorUa } = require('../editor-ua');
const { buildFingerprint, buildInjectionScript, applyFingerprintToTab, assertFingerprintConsistency } = require('../fingerprint');
const { sanitizeProfile } = require('../../engine/profile-sanitizer');
const { evaluateFingerprintDelivery } = require('../request-header-rewriter');
const { LIVE_PROBE_EXPRESSION } = require('../fingerprint-debug-log');
const mobile = require('../mobile-personas');
const { randomUaForSeed, buildUaProfile } = require('../user-agent');
const { resolveEditorUaDraft } = require('../../ui/ui-profile-commands');

const version = '149.0.7827.114';
const engine = { profiles: new Map(), chooseBrowser: () => ({ version }) };
const profile = (extra = {}) => sanitizeProfile({ id: 'identity-test', name: 'Identity', os: 'Windows', fingerprintSeed: 'persistent', privacy: { fontListMode: 'real' }, ...extra });
let count = 0;
async function test(name, run) { await run(); count += 1; console.log('PASS ' + name); }

function scopeFor(fp) {
  const queries = [];
  const scope = vm.createContext({ queries, setTimeout, clearTimeout });
  vm.runInContext(`
    class Navigator {}
    for (const [key,value] of Object.entries({userAgent:'native',platform:'Linux x86_64',vendor:'',hardwareConcurrency:2,deviceMemory:4,language:'en-US',languages:['en-US'],maxTouchPoints:0,webdriver:false})) {
      Object.defineProperty(Navigator.prototype,key,{configurable:true,enumerable:true,get(){return value}});
    }
    class Screen {};
    const screen=new Screen(); const navigator=new Navigator(); const window=globalThis; const self=globalThis;
    const document={createElement(){return {getContext(){return null}}},documentElement:{clientWidth:800,clientHeight:600},body:{},querySelectorAll(){return []}};
    const location={hostname:'example.test',href:'https://example.test/'};
    class MediaQueryListEvent {
      constructor(media,trusted=false){this.raw=media;this.isTrusted=trusted}
      get media(){if(!(this instanceof MediaQueryListEvent))throw new TypeError('Illegal invocation');return this.raw}
    }
    class MediaQueryList {
      constructor(query){this.query=query;this.listeners=[]}
      get media(){return this.query}
      get matches(){return !this.query.includes('max-resolution: 0dppx')}
      addEventListener(type,fn){this.listeners.push(fn)}
      dispatchEvent(event){this.listeners.forEach(fn=>fn(event))}
    }
    function matchMedia(query){queries.push(query);return new MediaQueryList(query)}
    const CSS={supports(...args){queries.push(args[0]);return false}};
    const innerWidth=800,innerHeight=600;
  `, scope);
  vm.runInContext(buildInjectionScript(fp), scope);
  return { scope, queries };
}

(async () => {
  await test('editor UA changes, clear and random reset cannot retain stale metadata or hidden overrides', () => {
    const generated = buildEditorUa(engine, { os: 'windows' });
    const current = profile({ userAgent: generated.userAgent, privacy: { fingerprint: { userAgent: generated.userAgent, clientHints: generated.clientHints, uaGenerated: true } } });
    const kept = resolveEditorUaDraft({ current, userAgent: generated.userAgent });
    assert.equal(kept.fingerprint.uaGenerated, true);
    assert.deepEqual(kept.fingerprint.clientHints, current.privacy.fingerprint.clientHints);
    assert.equal(kept.fingerprint.userAgent, undefined);
    for (const input of [{ userAgent: '', generatedUa: generated }, { userAgent: generated.userAgent + ' CUSTOM', generatedUa: generated }, { userAgent: generated.userAgent, reset: true }]) {
      const draft = resolveEditorUaDraft({ current, ...input });
      assert.equal(draft.fingerprint.clientHints, undefined);
      assert.equal(draft.fingerprint.uaGenerated, false);
      assert.equal(draft.fingerprint.userAgent, undefined);
    }
    const saved = resolveEditorUaDraft({ current, userAgent: generated.userAgent, generatedUa: generated });
    assert.equal(saved.fingerprint.uaGenerated, true);
    assert.equal(saved.fingerprint.clientHints.ua_full_version, version);
  });
  await test('mobile UA generation survives the real sanitizer and selects the same device at launch', () => {
    for (const os of ['Android', 'iOS']) {
      for (const random of [false, true]) {
        const generated = buildEditorUa(engine, { os, random, deviceSeed: 4711 });
        const saved = profile({ os, userAgent: generated.userAgent, privacy: { fontListMode: 'real', fingerprint: { clientHints: generated.clientHints } } });
        const fp = buildFingerprint({ ...saved, kernelVersion: version });
        assertFingerprintConsistency(fp);
        assert.equal(fp.mobileDevice.model, generated.metadata.model);
        assert.equal(fp.mobileDevice.osVersion, Number(generated.metadata.platformVersion.split('.')[0]));
        assert.equal(fp.userAgentMetadata.fullVersion, version);
        assert.equal(fp.clientHints.deviceModel, generated.clientHints.deviceModel);
        assert.equal(saved.privacy.fingerprint.clientHints.mobile, true);
        assert.equal(saved.privacy.fingerprint.clientHints.wow64, false);
        if (os === 'Android') {
          assert.match(fp.userAgent, /Android 10; K/);
          assert.notEqual(fp.userAgentMetadata.model, 'K');
        }
        const seeded = randomUaForSeed(4711, { osList: [os.toLowerCase()], majors: [149], fullVersion: version });
        assert.equal(seeded.metadata.model, generated.metadata.model);
        assert.equal(seeded.clientHints.deviceModel, generated.clientHints.deviceModel);
      }
    }
  });
  await test('known hardware corrections replace the source record and placeholder geometries never enter sampling', () => {
    const device = mobile.mobilePersona(1, 'android', { model: 'SM-G990B', osVersion: '16.0.0' });
    assert.equal(device.gpu.renderer, 'Adreno (TM) 660');
    assert.equal(device.screen.height, 780);
    assert.equal(device.panel.width, 1080);
    assert.ok(mobile.QUARANTINED_COUNT > 0);
    assert.equal(mobile.POOL_SIZE + mobile.QUARANTINED_COUNT, mobile.CATALOG_SIZE);
    assert.ok(mobile.devicesForOs('android').every((d) => d.width !== 360 || d.height !== 592));
    const catalog = require('../data/mobile-devices.json').devices.filter((d) => d.os === 'android');
    const index = catalog.findIndex((d) => d.model === 'Pixel 7');
    assert.equal(mobile.mobilePersona(index, 'android').deviceModel, 'Pixel 7', 'valid old seed mappings remain stable');
    assert.throws(() => mobile.mobilePersona(1, 'android', { model: 'missing-model' }), /没有可用/);
    assert.throws(() => mobile.mobilePersona(1, 'android', { model: 'SM-G990B', osVersion: '8' }), /不兼容/);
  });
  await test('full custom Android UA keeps its supported device release and conflicting hints are rejected', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 13; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36';
    const fp = buildFingerprint({ ...profile({ os: 'Android', userAgent: ua }), kernelVersion: version });
    assert.equal(fp.mobileDevice.osVersion, 13);
    assert.equal(fp.userAgentMetadata.platformVersion, '13.0.0');
    assertFingerprintConsistency(fp);
    const conflicting = buildFingerprint(profile({ os: 'Android', userAgent: ua, privacy: { fingerprint: { clientHints: { model: 'SM-G990B', platform_version: '16.0.0' } } } }));
    assert.throws(() => assertFingerprintConsistency(conflicting), { code: 'FINGERPRINT_CONFIG_INVALID' });
  });
  await test('strict mode replaces stale UA and all Client Hints version fields, including same-major builds', () => {
    for (const old of ['120.0.6099.199', '149.0.1111.1']) {
      const ua = buildEditorUa(engine, { os: 'windows' }).userAgent.replace(/Chrome\/[\d.]+/, 'Chrome/' + old);
      const fp = buildFingerprint({ ...profile({ userAgent: ua, privacy: { fingerprint: { uaStrict: true, clientHints: { ua_full_version: old } } } }), kernelVersion: version });
      assert.match(fp.userAgent, /Chrome\/149\.0\.0\.0/);
      assert.equal(fp.userAgentMetadata.fullVersion, version);
      assert.ok(fp.userAgentMetadata.fullVersionList.filter((b) => /^(Google Chrome|Chromium)$/.test(b.brand)).every((b) => b.version === version));
      assertFingerprintConsistency(fp);
    }
  });
  await test('generated UA follows kernel upgrades while custom UA intent remains explicit', () => {
    const generated = buildEditorUa(engine, { os: 'windows' });
    assert.equal(generated.kernelBound, true);
    const saved = profile({ userAgent: generated.userAgent, privacy: { fingerprint: { uaGenerated: generated.kernelBound, clientHints: generated.clientHints } } });
    const fp = buildFingerprint({ ...saved, kernelVersion: '150.0.9999.1' });
    assert.match(fp.userAgent, /Chrome\/150\.0\.0\.0/);
    assert.equal(fp.userAgentMetadata.fullVersion, '150.0.9999.1');
    assertFingerprintConsistency(fp);
    const custom = buildEditorUa(engine, { os: 'windows', userAgent: generated.userAgent });
    assert.equal(custom.kernelBound, false);
    const versioned = buildEditorUa(engine, { os: 'windows', osVersion: '7', random: true });
    assert.match(versioned.userAgent, /Windows NT 6.1/);
    assert.equal(versioned.metadata.platformVersion, '1.0.0');
    assert.equal(buildUaProfile({ os: 'macOS', osVersion: '14.5' }).metadata.platformVersion, '14.5.0');
    assert.equal(buildUaProfile({ os: 'android', userAgent: 'Mozilla/5.0 (Linux; Android 14.1; SM-G990B) Chrome/149.0.0.0 Mobile' }).metadata.platformVersion, '14.1.0');
  });
  await test('cross-OS UA and metadata version contradictions fail before any target command', async () => {
    const generated = buildEditorUa(engine, { os: 'windows' });
    const mixed = buildFingerprint(profile({ os: 'Linux', userAgent: generated.userAgent }));
    assert.equal(mixed.consistency.ok, false);
    let calls = 0;
    await assert.rejects(applyFingerprintToTab(async () => { calls += 1; }, null, mixed), { code: 'FINGERPRINT_CONFIG_INVALID' });
    assert.equal(calls, 0);
    const fp = buildFingerprint(profile({ userAgent: generated.userAgent, privacy: { fingerprint: { clientHints: { ua_full_version: '120.0.0.0' } } } }));
    assert.throws(() => assertFingerprintConsistency(fp), { code: 'FINGERPRINT_CONFIG_INVALID' });
    for (const memory of [0.25, 0.5]) assertFingerprintConsistency(buildFingerprint(profile({ privacy: { fingerprint: { memory } } })));
  });
  await test('full document injection delegates complete media expressions to the native parser', () => {
    const fp = buildFingerprint(profile({ privacy: { fontListMode: 'real', fingerprint: { devicePixelRatio: 2 } } }));
    const { scope, queries } = scopeFor(fp);
    const original = '(min-device-width: 1px) and (max-device-width: 1px)';
    assert.equal(vm.runInContext(`matchMedia(${JSON.stringify(original)}).matches`, scope), false);
    assert.equal(queries.at(-1), '(min-resolution: 0.001dppx) and (max-resolution: 0dppx)');
    assert.equal(vm.runInContext(`matchMedia(${JSON.stringify(original)}).media`, scope), original);
    assert.equal(vm.runInContext(`matchMedia(${JSON.stringify(original)}) instanceof MediaQueryList`, scope), true);
    const events = vm.runInContext(`(()=>{
      const mql=matchMedia(${JSON.stringify(original)});
      const trusted=new MediaQueryListEvent(mql.query,true), synthetic=new MediaQueryListEvent('screen',false);
      mql.dispatchEvent(trusted);mql.dispatchEvent(synthetic);
      return {trusted:trusted.media,synthetic:synthetic.media,own:Object.hasOwn(trusted,'media')};
    })()`, scope);
    assert.equal(events.trusted, original);
    assert.equal(events.synthetic, 'screen');
    assert.equal(events.own, false);
    vm.runInContext(`matchMedia('not all and (min-device-width: 1px), print and (resolution: 192dpi)')`, scope);
    assert.equal(queries.at(-1), 'not all and (min-resolution: 0.001dppx), print and (min-resolution: 0.001dppx)');
    // prefers-* is now persona-driven (round 11): the predicate is rewritten to a
    // resolution tautology so the native parser composes the persona's draw. The
    // default profile's draw is light, so 'dark' maps to the always-false tautology.
    vm.runInContext(`matchMedia('(prefers-color-scheme: dark)')`, scope);
    assert.equal(queries.at(-1), '(max-resolution: 0dppx)');
    vm.runInContext(`matchMedia('(resolution: 1garbage)')`, scope);
    assert.equal(queries.at(-1), '(resolution: 1garbage)');
    const ios = scopeFor(buildFingerprint(profile({ os: 'iOS' })));
    assert.equal(vm.runInContext(`CSS.supports('not (-webkit-touch-callout: none) and (display: invalid)')`, ios.scope), false);
    assert.equal(ios.queries.at(-1), 'not (-webkit-touch-callout: none) and (display: invalid)', 'iOS capability queries must reach the actual CSS parser unchanged');
  });
  await test('the production async probe and strict delivery detect high-entropy Client Hints drift', async () => {
    const fp = buildFingerprint(profile());
    const { scope } = scopeFor(fp);
    scope.entropy = { ...fp.userAgentMetadata, uaFullVersion: fp.userAgentMetadata.fullVersion };
    scope.brands = fp.userAgentMetadata.brands;
    vm.runInContext(`
      const isSecureContext=true;
      Object.defineProperty(globalThis,'isSecureContext',{value:true});
      Object.defineProperty(Navigator.prototype,'userAgentData',{configurable:true,get(){return {platform:'Windows',brands,mobile:false,getHighEntropyValues:async()=>entropy}}});
    `, scope);
    const live = await vm.runInContext(LIVE_PROBE_EXPRESSION, scope);
    assert.equal(evaluateFingerprintDelivery({}, fp, live, { strict: true }).ok, true);
    for (const patch of [{ uaFullVersion: '120.0.0.0' }, { model: 'another-device' }, { architecture: 'arm' }, { fullVersionList: [] }]) {
      const result = evaluateFingerprintDelivery({}, fp, { ...live, uaDataHighEntropy: { ...live.uaDataHighEntropy, ...patch } }, { strict: true });
      assert.equal(result.ok, false, JSON.stringify(patch));
    }
    assert.equal(evaluateFingerprintDelivery({}, fp, { ...live, uaDataError: 'timeout' }, { strict: true }).ok, false);
    assert.equal(evaluateFingerprintDelivery({}, fp, { ...live, uaDataPresent: false }, { strict: true }).ok, false);
    assert.equal(evaluateFingerprintDelivery({}, fp, { ...live, uaDataHighEntropy: null }, { strict: true }).ok, false);
  });
  console.log(`fingerprint-identity-selftest: OK ${count}/${count}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
