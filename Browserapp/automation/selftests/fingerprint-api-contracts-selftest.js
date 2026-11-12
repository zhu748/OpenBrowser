'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const storageSource = require('../fingerprint/runtime/storage-estimate-fragment');
const { buildFingerprint, applyFingerprintToTab } = require('../fingerprint');
const { firefoxExtraUserPrefs } = require('../../engine/start-firefox');

async function storageCase(result, expectedQuota) {
  const brand = new WeakSet();let calls = 0;
  class StorageManager {
    constructor() { brand.add(this); }
    estimate() { calls++;return brand.has(this) ? Promise.resolve(result) : Promise.reject(new TypeError('native brand check')); }
  }
  const store = new StorageManager();
  const scope = vm.createContext({ StorageManager, navigator: { storage: store }, result });
  vm.runInContext(`const CFG={deviceMemory:8},isIosPersona=false,isAndroidPersona=false,BRIDGE_TOKEN='token';
    const bridges=new WeakMap();const inspectBridge=fn=>bridges.get(fn);const nativeLike=fn=>{bridges.set(fn,{token:BRIDGE_TOKEN});return fn};
    const subWindowSyncHooks=[];`, scope);
  vm.runInContext('(function(){' + storageSource + '})()', scope);
  const fn = StorageManager.prototype.estimate;
  const estimate = await fn.call(store);
  assert.equal(estimate, result, 'preserve the actual native dictionary and realm');
  assert.equal(estimate.quota, expectedQuota);
  assert.equal(calls, 1);
  await assert.rejects(fn.call({}), /native brand check/);
  const foreign = vm.runInNewContext('new (class StorageManager {})()');brand.add(foreign);
  assert.equal(foreign instanceof StorageManager, false);
  assert.equal(await fn.call(foreign), result, 'native validation accepts a genuine foreign receiver');
  vm.runInContext('(function(){' + storageSource + '})()', scope);
  assert.equal(StorageManager.prototype.estimate, fn, 'synchronization does not stack wrappers');
}

(async () => {
  // Execute each independent installation in an isolated scope.
  for (const [result, quota] of [
    [{ quota: 1000, usage: 100, futureMember: 'kept' }, 1000],
    [{ quota: 128 * 1024 ** 3, usage: 0 }, 60 * 1024 ** 3],
    [{ quota: 128 * 1024 ** 3, usage: 80 * 1024 ** 3 }, 80 * 1024 ** 3],
    [{ quota: 0, usage: 0 }, 0], [{ usage: 0 }, undefined],
    [Object.freeze({ quota: 1000, usage: 0 }), 1000],
  ]) {
    await storageCase(result, quota);
    assert.equal('usageDetails' in result, false, 'preserve optional member absence');
    if ('futureMember' in result) assert.equal(result.futureMember, 'kept');
  }
  for (const privacy of [{ geoMode: 'disabled' }, { geoMode: 'prompt', geoPermission: 'deny' }, { geoPermission: 'allow' }]) {
    const p = { id: 'geo-contract', name: 'Geo', privacy: { fontListMode: 'real', ...privacy } };
    const fp = buildFingerprint(p);
    assert.equal(fp.geoPermission, 'denied');
    const prefs = new Map(firefoxExtraUserPrefs(p, fp));
    assert.equal(prefs.get('geo.enabled'), false);
    assert.equal(prefs.get('permissions.default.geo'), 2);
    const calls = [];
    await assert.rejects(applyFingerprintToTab(async (method) => {
      calls.push(method);if (method === 'Browser.setPermission') throw new Error('native permission unavailable');return {};
    }, null, fp, p, { applyKey: 'deny-' + JSON.stringify(privacy), isWaiting: true }), /native permission unavailable/);
    assert.equal(calls.includes('Page.addScriptToEvaluateOnNewDocument'), false, 'native denial failure precedes registration');
  }
  const allowed = { id: 'allow', privacy: { geoMode: 'custom', geoPermission: 'allow', latitude: 0, longitude: 0 } };
  const fp = buildFingerprint(allowed);
  assert.equal(fp.geoPermission, 'granted');
  assert.equal(new Map(firefoxExtraUserPrefs(allowed, fp)).get('geo.enabled'), true);
  assert.equal(new Map(firefoxExtraUserPrefs({ privacy: { geoMode: 'prompt' } })).get('geo.enabled'), true);
  console.log('PASS native storage bounds/shape/brand/realm, zero/absent/frozen fields, effective geolocation denial and mandatory native permission setup');
})().catch(error => { console.error(error);process.exitCode = 1; });
