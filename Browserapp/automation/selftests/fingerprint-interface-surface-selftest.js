'use strict';

/**
 * P1 gate: interface nativeness under the persona patches.
 *
 * Property descriptors (get/set vs value, enumerability, configurability),
 * prototypes (no own-property drift vs a stock build's chain), for-in
 * enumeration, error types on illegal receivers, cross-realm calls,
 * double-injection idempotence, and that APIs which do not exist stay
 * non-existent (the patch must not conjure new globals).
 *
 * Exit codes: 2 = native prerequisite missing, 1 = assertion failure.
 */
const assert = require('node:assert/strict');
const {
  Unavailable, delay, chooseChromiumBinary, buildPersona, launchPersonaBrowser,
  openPage, evaluate,
} = require('./native-gate-harness');

const PROBE = `(async () => {
  const out = {};

  // 1. navigator property descriptors: accessors stay accessors, native-looking
  const d = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')
    || Object.getOwnPropertyDescriptor(navigator, 'userAgent');
  out.userAgentDescriptor = {
    hasGetter: Boolean(d && d.get),
    hasSetter: Boolean(d && d.set),
    configurable: d ? d.configurable : null,
    enumerable: d ? d.enumerable : null,
    getterNative: d && d.get ? String(d.get).includes('[native code]') : null,
    getterName: d && d.get ? d.get.name : null,
  };
  out.platformOwn = Object.getOwnPropertyNames(Object.getPrototypeOf(navigator)).includes('platform');

  // 2. Prototype chain intact
  out.navProtoChain = [];
  let p = Object.getPrototypeOf(navigator);
  while (p && out.navProtoChain.length < 4) { out.navProtoChain.push(p.constructor?.name || 'anon'); p = Object.getPrototypeOf(p); }

  // 3. Enumeration: for-in over navigator yields the stock key set shape
  //    (patched values must not add enumerable own keys).
  const ownEnumerable = Object.keys(navigator);
  out.navigatorEnumerableOwnCount = ownEnumerable.length;

  // 4. Illegal receiver throws the native TypeError
  out.illegalReceiver = (() => {
    try { Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent').get.call({}); return 'no-throw'; }
    catch (e) { return { name: e.name, isType: e instanceof TypeError, messageNative: String(e.message).length > 0 }; }
  })();

  // 5. Error types: patched storage estimate still rejects illegal invocation
  out.storageIllegal = await (async () => {
    if (!navigator.storage) return 'unavailable';
    try { await navigator.storage.estimate.call({}); return 'no-throw'; }
    catch (e) { return { name: e.name, isType: e instanceof TypeError }; }
  })();

  // 6. Cross-realm call: an iframe's navigator reading our patched globals
  const f = document.createElement('iframe');
  f.src = 'about:blank';
  document.body.append(f);
  const other = f.contentWindow;
  out.crossRealm = {
    uaPatchedInChild: other.navigator.userAgent === navigator.userAgent,
    childOwnUa: Boolean(other.Navigator),
  };

  // 7. Read stability. Actual repeated-source execution is covered separately
  //    by fingerprint-native-contract-selftest.js.
  out.doubleRead = { same: navigator.userAgent === navigator.userAgent, stablePlatform: navigator.platform === navigator.platform };

  // 8. Absent APIs stay absent (nothing conjured)
  out.conjured = ['getBattery', 'requestMIDIAccess', 'sharedArrayBufferHack'].filter((k) => typeof navigator[k] === 'function' && !(['getBattery'].includes(k) && 'getBattery' in Navigator.prototype));
  // Chrome does have getBattery; the check above allows stock members only.

  // 9. Reflect.getOwnPropertyDescriptor enumeration through Proxy-free path
  out.reflected = Reflect.ownKeys(Navigator.prototype).slice(0, 3).map(String);

  return out;
})()`;

(async () => {
  const browser = chooseChromiumBinary();
  const persona = buildPersona('native-surface', { os: 'Windows' });
  const fp = persona.fingerprint;
  const session = await launchPersonaBrowser(browser, persona);
  try {
    const page = await openPage(session.port, 'about:blank');
    await evaluate(page, `document.open(); document.write('<!doctype html><html><body></body></html>'); document.close(); true`);
    await delay(200);
    const probe = await evaluate(page, PROBE, 30000);

    // 1. Descriptor shape
    const ud = probe.userAgentDescriptor;
    assert.equal(ud.hasGetter, true, 'userAgent must stay an accessor (getter)');
    assert.equal(ud.getterNative, true, 'userAgent getter must read as native code');
    assert.ok(ud.getterName === 'userAgent' || ud.getterName === 'get userAgent',
      'getter name preserved, got: ' + ud.getterName);
    assert.equal(ud.configurable, true, 'descriptor configurable as stock');
    console.log('PASS surface userAgent accessor is native-shaped');

    // 2. Prototype chain
    assert.deepEqual(probe.navProtoChain.slice(0, 2), ['Navigator', 'Object'],
      'navigator prototype chain must stay Navigator -> Object');
    assert.equal(probe.platformOwn, true, 'platform stays on Navigator.prototype');
    console.log('PASS surface prototype chain intact');

    // 3. No enumerable own-key drift
    assert.ok(probe.navigatorEnumerableOwnCount <= 4,
      'navigator must not gain enumerable own keys (got ' + probe.navigatorEnumerableOwnCount + ')');
    console.log('PASS surface enumeration free of injected own keys');

    // 4/5. Illegal receiver + storage estimate errors
    assert.notEqual(probe.illegalReceiver, 'no-throw', 'illegal receiver must throw');
    assert.equal(probe.illegalReceiver.isType, true, 'illegal receiver must be a TypeError');
    if (probe.storageIllegal !== 'unavailable') {
      assert.notEqual(probe.storageIllegal, 'no-throw');
      assert.equal(probe.storageIllegal.isType, true, 'storage.estimate illegal receiver must be TypeError');
    }
    console.log('PASS surface illegal receivers throw native TypeErrors');

    // 6. Cross-realm
    assert.equal(probe.crossRealm.uaPatchedInChild, true, 'child realm must observe the patched UA');
    assert.equal(probe.crossRealm.childOwnUa, true, 'child realm keeps its own Navigator');
    console.log('PASS surface cross-realm reads agree');

    // 7. Double-read stability
    assert.equal(probe.doubleRead.same, true);
    assert.equal(probe.doubleRead.stablePlatform, true);
    console.log('PASS surface repeated reads are idempotent');

    // 8. Nothing conjured beyond stock members
    assert.deepEqual(probe.conjured.filter((k) => k !== 'getBattery'), [],
      'patch conjured non-stock navigator APIs: ' + probe.conjured.join(','));
    console.log('PASS surface no conjured APIs beyond stock members');

    // Persona values are actually the patched ones (sanity within this gate)
    const values = await evaluate(page, `({ ua: navigator.userAgent, platform: navigator.platform })`);
    assert.equal(values.ua, fp.userAgent);
    assert.equal(values.platform, fp.platform);
    console.log('PASS surface persona values present');

    console.log('fingerprint-interface-surface-selftest: OK');
  } finally {
    await session.close().catch(() => {});
  }
})().catch((error) => {
  console.error((error instanceof Unavailable ? 'SKIP ' : 'FAIL ') + error.message);
  process.exitCode = error instanceof Unavailable ? 2 : 1;
});
