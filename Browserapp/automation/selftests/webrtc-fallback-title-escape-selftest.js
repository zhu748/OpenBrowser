#!/usr/bin/env node
'use strict';

/**
 * Regression selftest: the webrtc fallback layer must not expose any page-controlled switch.
 *
 * The former production branch (webrtc-fallback.js) keyed on
 * `document.title === 'surface probe'`: when native RTCPeerConnection construction
 * failed, a page could set its own title before constructing a PC and make the patched
 * constructor rethrow the native error instead of returning the synthetic instance — an
 * A/B probe that revealed the injected layer's existence and the kernel state behind the
 * native error message. document.title is a fully page-controlled low-privilege property,
 * so this was an injection-surface escape. The branch is removed; this selftest pins the
 * invariant behaviourally, in pure Node (vm realms) — no kernel, no GUI:
 *
 *   1. With native construction failing, every construction returns a compliant synthetic
 *      instance — for the retired magic title, a one-shot random nonce, and any other
 *      title value. No title may change the outcome, and the native error must never
 *      reach the page through the patched constructor.
 *   2. The same holds inside a nested realm standing in for a hidden frame carrying a
 *      one-shot nonce: the layer installs per realm and is title-agnostic there too.
 *   3. When native construction succeeds, the patched constructor returns the native
 *      instance untouched — the layer prefers native and only falls back on failure.
 *
 *   node automation/selftests/webrtc-fallback-title-escape-selftest.js
 */

const assert = require('assert');
const crypto = require('crypto');
const vm = require('vm');

const { createWebRtcFallbackSource } = require('../webrtc-fallback');

const PUBLIC_IP = '198.51.100.7';
const LOCAL_IP = '10.8.0.14';

/** One-shot per-run nonce: unpredictable, never reused, never a repo constant. */
const nonce = 'ob-' + crypto.randomBytes(16).toString('hex');

const source = createWebRtcFallbackSource({ publicIp: PUBLIC_IP, localIp: LOCAL_IP, bridgeToken: 'title-escape-token' });
assert.ok(typeof source === 'string' && source.length > 500, 'fallback source must be built');

// Secondary guard on the built artifact: the generated source must not read the page
// document in its decision path (the primary checks below are behavioural). Strip
// comments first — explanatory prose in a comment is not a code path. Both the retired
// magic string and any document.title lookup must be absent from executable code.
const codeOnly = source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');
assert.ok(!codeOnly.includes('document.title'), 'generated code must not read document.title');
assert.ok(!codeOnly.includes('surface probe'), 'generated code must not embed the retired magic string');
assert.ok(!/\bdocument\b\s*\./.test(codeOnly), 'generated code must not dereference the page document at all');

/**
 * A realm (top page or hidden-frame stand-in) with a controllable native constructor.
 * nativeMode 'throw' mimics a kernel that cannot instantiate RTCPeerConnection
 * (the documented fallback trigger); 'ok' returns a real native instance.
 */
function makeRealm(nativeMode) {
  class EventTarget {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
  }
  class Event {
    constructor(type) { this.type = type; }
  }
  const pcProto = {
    createOffer() { return Promise.resolve({ type: 'offer', sdp: '' }); },
    close() {}
  };
  Object.defineProperty(pcProto, Symbol.toStringTag, { value: 'RTCPeerConnection', configurable: true });

  function NativeRTCPeerConnection(...args) {
    if (nativeMode === 'throw') {
      const err = new TypeError('RTCPeerConnection is not supported in this environment');
      err.name = 'NotSupportedError';
      throw err;
    }
    return { nativeInstance: true, marker: 'native-ok', config: args[0] || {} };
  }
  NativeRTCPeerConnection.prototype = pcProto;

  const sandbox = {
    RTCPeerConnection: NativeRTCPeerConnection,
    document: { title: '' },
    EventTarget,
    Event,
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  const context = vm.createContext(sandbox);
  vm.runInContext(source, context);
  return { context, sandbox };
}

const constructOutcome = (realm, title) => vm.runInContext(
  `(function () {
    try { document.title = ${JSON.stringify(title)}; } catch (_) {}
    try {
      const pc = new RTCPeerConnection();
      return JSON.stringify({
        ok: true,
        titleEcho: document.title,
        own: Object.getOwnPropertyNames(pc).sort(),
        tag: Object.prototype.toString.call(pc),
        nativeInstance: pc.nativeInstance === true,
        instanceofPC: pc instanceof RTCPeerConnection,
        ctorName: RTCPeerConnection.name,
        ctorLength: RTCPeerConnection.length,
      });
    } catch (e) {
      return JSON.stringify({ ok: false, err: e && e.name, msg: String(e && e.message) });
    }
  })()`,
  realm.context
);

const titles = {
  magic: 'surface probe',
  nonce,
  empty: '',
  unicode: '任意页面标题',
  long: 'x'.repeat(512),
};

// --- 1. top realm, native construction fails: title-agnostic synthetic fallback ----------
const top = makeRealm('throw');
{
  const results = {};
  for (const [key, title] of Object.entries(titles)) {
    const raw = constructOutcome(top, title);
    let parsed;
    try { parsed = JSON.parse(raw); } catch (_) { parsed = { ok: false, parse: raw }; }
    results[key] = parsed;
  }
  for (const [key, value] of Object.entries(results)) {
    assert.strictEqual(value.ok, true,
      `construction must succeed for title "${titles[key]}" (got ${JSON.stringify(value)}) — the native error must never reach the page through the patched constructor`);
    assert.strictEqual(value.err, undefined, `no native error may surface for title "${titles[key]}"`);
    assert.deepStrictEqual(value.own, [], `synthetic instance must carry no own members for title "${titles[key]}"`);
    assert.strictEqual(value.tag, '[object RTCPeerConnection]', `synthetic instance must keep the native toString tag for title "${titles[key]}"`);
    assert.strictEqual(value.instanceofPC, true, `synthetic instance must satisfy instanceof for title "${titles[key]}"`);
    assert.strictEqual(value.nativeInstance, false, `the returned instance must be the fallback one, not a native passthrough`);
    assert.strictEqual(value.ctorName, 'RTCPeerConnection', 'the patched constructor must keep the native name');
    assert.strictEqual(value.ctorLength, 0, 'the patched constructor must keep the native arity');
  }
  // Title-agnosticism: every outcome must be identical, so no A/B contrast is derivable.
  const distinct = new Set(Object.values(results).map((v) => JSON.stringify({ ...v, titleEcho: null })));
  assert.strictEqual(distinct.size, 1,
    'document.title must not change the construction outcome — the fallback layer would be A/B-able');
  // The page-set title round-trips untouched: the layer neither reads nor rewrites it.
  assert.strictEqual(results.magic.titleEcho, 'surface probe', 'the layer must not rewrite the page title');
}

// --- 2. hidden-frame stand-in (nested realm) with the one-shot nonce ---------------------
const frame = makeRealm('throw');
{
  const inFrame = vm.runInContext(
    `(function () {
      document.title = ${JSON.stringify(nonce)};
      try {
        const pc = new RTCPeerConnection();
        return JSON.stringify({ ok: true, own: Object.getOwnPropertyNames(pc).sort(), tag: Object.prototype.toString.call(pc) });
      } catch (e) {
        return JSON.stringify({ ok: false, err: e && e.name });
      }
    })()`,
    frame.context
  );
  let parsed;
  try { parsed = JSON.parse(inFrame); } catch (_) { parsed = { ok: false, parse: inFrame }; }
  assert.strictEqual(parsed.ok, true,
    `the nested realm (hidden-frame stand-in) must construct through the fallback under the one-shot nonce (got ${JSON.stringify(parsed)})`);
  assert.deepStrictEqual(parsed.own, [], 'the nested-realm instance must carry no own members');
  assert.strictEqual(parsed.tag, '[object RTCPeerConnection]', 'the nested-realm instance must keep the native tag');
  // Cross-realm agreement: frame outcome equals the top-level outcome for the same mode.
  const topRaw = JSON.parse(constructOutcome(top, nonce));
  delete topRaw.titleEcho;
  delete parsed.titleEcho;
  assert.deepStrictEqual({ ok: parsed.ok, own: parsed.own, tag: parsed.tag },
    { ok: topRaw.ok, own: topRaw.own, tag: topRaw.tag },
    'the fallback layer must behave identically in the nested realm and the top realm');
}

// --- 3. native construction succeeds: the native instance must pass through untouched ----
const healthy = makeRealm('ok');
{
  const raw = constructOutcome(healthy, 'surface probe');
  let parsed;
  try { parsed = JSON.parse(raw); } catch (_) { parsed = { ok: false, parse: raw }; }
  assert.strictEqual(parsed.ok, true, 'construction must succeed when the native constructor works');
  assert.strictEqual(parsed.nativeInstance, true,
    'the patched constructor must return the native instance, not a synthetic one, when native construction succeeds');
  assert.strictEqual(parsed.tag, '[object Object]',
    'the native instance (a plain object from the fake native ctor) must pass through unmodified');
}

console.log('WEBRTC_FALLBACK_TITLE_ESCAPE_SELFTEST_OK magic=1 nonce=1 frame=1 native-passthrough=1 titleAgnostic=1');
