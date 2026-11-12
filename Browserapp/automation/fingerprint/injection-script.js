'use strict';

/**
 * The document-start injection script (noise/block modes for navigator,
 * canvas/webgl/audio/clientRects, mediaDevices, speech voices, WebRTC, fonts)
 * plus the size-capped injection cache. Extracted verbatim from the former
 * automation/fingerprint.js.
 */

const crypto = require('crypto');
const { normalizeNetworkInformation } = require('../../shared/profile-values');
const { buildDocumentRuntime } = require('./runtime-source');
const { createWebRtcFallbackSource, buildCssFontLocalGateSource, deriveFontPlaceholder, buildQueryLocalFontBlobGateSource, buildUaProfile, buildUaInjectionScript, canonicalBridgeToken, mapPlatformToSubsetKey, loadFontSubsetPayload, buildFontMetricsScript } = require('./shared');
// Shared CFG layer: the os/timezone/deviceMemory/webgl/stability computations the
// worker builder (worker-injection.js) also embeds live in injection-config.js so
// the two emitted CFGs cannot drift independently. Key order, key set and the
// intentionally divergent leaves (vendor, userAgentMetadata, webgpu, stability
// caps) stay in this file's literal — see the drift list in injection-config.js.
const { resolveInjectionStability, injectionOs, injectionTimezone, injectionDeviceMemory, injectionWebgl, stabilityNoiseAmplitude, stabilitySampleStepDivisor, stabilityHamming, stabilityMaxWidth, stabilityMaxHeight, stabilitySquare } = require('./injection-config');

/**
 * Document-start injection implementing noise/block modes.
 */
function buildInjectionScript(fp, options = {}) {
  // A pure function of the declared configuration, so every call for one profile — cold or warm,
  // main or worker — agrees with the token the host later validates and with the value this
  // function stores back on fp.fontBlobBridge. See canonicalBridgeToken.
  const bridgeToken = canonicalBridgeToken(fp);
  // livePatch builds the source used to patch an ALREADY-OPEN document that the caller
  // knows is ephemeral (about:blank before the first real navigation). It drops the
  // multi-megabyte font payload: the Page.addScriptToEvaluateOnNewDocument registration
  // made for the same target carries the full bytes and runs on every later navigation,
  // so transmitting the payload a second time for the throwaway document only doubles
  // the CDP transfer and the renderer parse cost on the startup critical path.
  const livePatch = options.livePatch === true;
  const injectionCacheKey = bridgeToken + '|' + String((fp && fp.bridgeChannel) || '') + (livePatch ? '|live' : '');
  if (injectionCacheKey) {
    const cached = injectionScriptCache.get(injectionCacheKey);
    if (typeof cached === 'string') {
      injectionScriptCache.delete(injectionCacheKey);
      injectionScriptCache.set(injectionCacheKey, cached);
      return cached;
    }
  }
  const stability = resolveInjectionStability(fp);
  const json = JSON.stringify({
    engine: fp.engine || fp.uaProfile?.engine || 'chromium',
    // R-3: opt-in runtime telemetry for debugging builds (default off): the
    // runtime's silent catches report once per (fragment, key) through the
    // bootstrap's __obReportError hook when this is true.
    telemetry: process.env.OPENBROWSER_FP_TELEMETRY === '1',
    platform: fp.platform,
    os: injectionOs(fp),
    userAgent: fp.userAgent,
    languages: fp.languages,
    timezone: injectionTimezone(fp),
    hardwareConcurrency: fp.hardwareConcurrency,
    // persona.js quantises to DEVICE_MEMORY_STEPS (0.25/0.5/1/2/4/8); Math.max(1, ...) rewrote
    // the legal 0.25/0.5 tiers to 1, contradicting the CDP/main record. Legal values pass
    // through; anything illegal snaps to the nearest step (capped at 8, as the spec does).
    // Shared computation with the worker CFG — see injection-config.js.
    deviceMemory: injectionDeviceMemory(fp),
    screen: fp.screen,
    webgl: injectionWebgl(fp),
    canvas: fp.canvas,
    audio: fp.audio,
    clientRects: fp.clientRects,
    webrtc: fp.webrtc,
    webrtcPolicy: fp.webrtcPolicy,
    webrtcAddress: fp.webrtcAddress || null,
    webrtcLocalMdns: typeof fp.webrtcLocalMdns === 'string' ? fp.webrtcLocalMdns : '',
    mediaPreferences: fp.mediaPreferences || { colorScheme: 'light', reducedMotion: 'no-preference', forcedColors: 'none', contrast: 'no-preference' },
    battery: fp.battery || null,
    connection: normalizeNetworkInformation(fp.connection),
    geoPermission: fp.geoPermission || null,
    webgpu: fp.webgpu || null,
    bluetooth: fp.bluetooth || null,
    mediaDevices: fp.mediaDevices || null,
    speech: fp.speech || null,
    fonts: fp.fonts || null,
    maxTouchPoints: fp.maxTouchPoints,
    mobile: Boolean(fp.mobile),
    mobileDevice: fp.mobileDevice || null,
    // The injected navigator.patches read this; without it the page reported empty brands / model.
    // Intentionally divergent from the worker CFG (worker-injection.js keeps no uaProfile.metadata
    // fallback) — preserved as-is, see the drift list in injection-config.js.
    userAgentMetadata: fp.userAgentMetadata || fp.uaProfile?.metadata || null,
    // Intentionally divergent from the worker CFG (worker keeps fp.uaProfile?.vendor ||
    // 'Google Inc.' with no iOS branch) — preserved as-is, see injection-config.js.
    vendor: fp.vendor ?? ((fp.mobileDevice?.os === 'ios' || fp.uaProfile?.os === 'ios' || (fp.platform && /iphone|ipad|ipod/i.test(fp.platform))) ? 'Apple Computer, Inc.' : (fp.uaProfile?.vendor ?? 'Google Inc.')),
    doNotTrack: fp.doNotTrack,
    seed: fp.seed,
    stability: {
      mode: stability.mode,
      active: Boolean(stability.active),
      noiseAmplitude: stabilityNoiseAmplitude(stability),
      sampleStepDivisor: stabilitySampleStepDivisor(stability),
      hamming: stabilityHamming(stability),
      maxWidth: stabilityMaxWidth(stability),
      maxHeight: stabilityMaxHeight(stability),
      square: stabilitySquare(stability),
      hosts: Array.isArray(stability.hosts) ? stability.hosts.slice(0, 800) : [],
      skipHosts: Array.isArray(stability.skipHosts) ? stability.skipHosts.slice(0, 200) : [],
    },
  });

  // UA + Client Hints (userAgentData) injected first
  const uaScript = fp.uaProfile
    ? buildUaInjectionScript(fp.uaProfile)
    : (fp.userAgent ? buildUaInjectionScript(buildUaProfile({ userAgent: fp.userAgent, platform: fp.platform })) : '');

  // The document script also carries the worker injection source so the
  // Worker-constructor patch can prefix blob:/data: workers (the Fetch
  // prefixer only intercepts network-loaded scripts). buildWorkerInjectionScript
  // is required lazily to avoid a require cycle with worker-injection.js.
  const { buildWorkerInjectionScript } = require('./worker-injection');
  const mainScript = buildDocumentRuntime({ uaScript, json, bridgeToken, workerSource: buildWorkerInjectionScript(fp, { coreOnly: true }) });

  let fontMetricsScript = '';
  let cssFontLocalGateScript = '';
  let queryLocalFontBlobGateScript = '';
  let sharedFontPayloadForOutput = null;
  if (fp && fp.fonts && Array.isArray(fp.fonts.list) && fp.fonts.list.length) {
    const platformKey = mapPlatformToSubsetKey(fp.platform);
    // Load the platform payload once: both the document.fonts seeding layer and the dynamic
    // local() gate consume the same bytes, and serialising it twice used to bloat every
    // document-start script to ~6 MB. In livePatch mode the payload is skipped entirely:
    // an about:blank document has no content to measure fonts against, and the registered
    // document-start script delivers the full payload on the real navigation.
    const sharedFontPayload = livePatch ? [] : (platformKey ? loadFontSubsetPayload(platformKey) : []);
    const sharedPayloadVar = sharedFontPayload.length ? SHARED_FONT_PAYLOAD_VAR : null;
    if (sharedPayloadVar) sharedFontPayloadForOutput = sharedFontPayload;
    if (platformKey) {
      fontMetricsScript = buildFontMetricsScript(platformKey, {
        ...(fp.fontMetricsOptions || {}),
        bridgeToken,
        payload: sharedFontPayload,
        payloadVar: sharedPayloadVar,
      });
    }
    const platKey = (() => {
      const p = String(fp.uaProfile?.os || fp.os || fp.platform || '').trim().toLowerCase();
      if (p.includes('win')) return 'windows';
      if (p.includes('mac') || p.includes('darwin')) return 'macos';
      if (p.includes('android')) return 'android';
      if (p.includes('linux')) return 'linux';
      if (p.includes('ios') || p.includes('iphone') || p.includes('ipad')) return 'macos';
      return 'windows';
    })();
    // Dynamic stylesheet APIs reach the native local-font resolver without constructing a
    // FontFace object. The companion source filters those dynamic paths from the same persona
    // list while leaving web-font url/data candidates untouched. The persona platform and the
    // real host platform decide whether the subset payload may be appended at all: on a host
    // that already ships the family the subset shadows it and mixes glyphs per character.
    try {
      const fontSubsets = sharedFontPayload;
      cssFontLocalGateScript = buildCssFontLocalGateSource(fp.fonts.list, fontSubsets, {
        blockedFont: deriveFontPlaceholder(fp),
        bridgeToken,
        payloadVar: sharedPayloadVar,
        platform: platKey,
        hostPlatform: typeof process !== 'undefined' ? process.platform : '',
        // livePatch carries no subset bytes, so the gate must not fall back to loading and
        // embedding them itself. An empty subset map degrades exactly like a same-platform
        // persona host: local() resolution for missing families lands on the blocked
        // placeholder instead of host bytes.
        injectSubsets: livePatch ? false : undefined,
      });
    } catch (_) {}
    // Local Font Access exposes a binary blob after user activation. Its returned FontData
    // records have already been re-labelled above, so their blob() method must not remain bound
    // to the host record and disclose a different platform's font bytes.
    // Laziness follows the lazy-bridge rule from persona.js (its own lazyFontPayload gate is
    // platform-independent): every persona that carries a font payload takes the lazy font
    // bridge. The old `platKey === 'windows'` gate was the historical first platform the
    // bridge shipped for; it kept macos/linux/android personas on fully inlined payloads
    // (a macos persona script was ~10.8 MB against ~3.5 MB on the bridge, and a 64 MB cache
    // held only ~19 scripts). The bridge delivers the bytes through the engine's
    // Runtime.addBinding channel instead, so the page still sees the same FontData list and
    // blob bytes — only the delivery changes. platKey is always one of the four canonical
    // keys (it defaults to 'windows'), so every persona with a fonts list now goes lazy.
    const lazyFontPayload = livePatch
      || (fp.lazyFontPayload !== false && fp.lazyPayload !== false);
    const fontBridgeChannel = String(fp.bridgeChannel || fp.fontBlobBridge?.channelName || ('_' + String(bridgeToken).slice(0, 16)));
    // The fontBlobBridge side effect is authoritative only for the FULL build: the livePatch
    // variant forces the lazy gate for its stripped source, and letting it write here would
    // leave a lazy bridge object behind even when the full script (and the engine's binding
    // registration) follows the non-lazy policy — especially when the full build is a cache
    // hit and never re-runs this block.
    if (!livePatch) {
      fp.fontBlobBridge = lazyFontPayload ? {
        channelName: fontBridgeChannel,
        token: String(bridgeToken),
        platform: platKey,
        wanted: null,
      } : null;
    }
    try {
      queryLocalFontBlobGateScript = buildQueryLocalFontBlobGateSource({
        ...fp,
        bridgeToken,
        lazyPayload: lazyFontPayload,
        bridgeChannel: fontBridgeChannel,
      });
    } catch (_) {}
  }

  let webrtcFallbackScript = '';
  if (fp && fp.webrtc !== 'disabled') {
    try {
      // Per-profile values only, no shared-constant fallback: the host candidate carries the
      // persona's seeded webrtcLocalIp, and the srflx side only appears when an exit address is
      // actually known (explicit webrtcAddress / exit IP). Neither known -> no fallback source at
      // all, which is preferred over a cross-environment shared constant candidate.
      const exitAddress = String(fp.webrtcAddress || (fp.network && fp.network.exitIp) || '').trim();
      webrtcFallbackScript = createWebRtcFallbackSource({
        publicIp: exitAddress || null,
        localIp: fp.webrtcLocalIp || (fp.webrtc && fp.webrtc.localIp) || null,
        localMdns: fp.webrtcLocalMdns || (fp.webrtc && fp.webrtc.localMdns) || null,
        bridgeToken,
      });
    } catch (_) {}
  }

  const composed = [mainScript, webrtcFallbackScript, fontMetricsScript, cssFontLocalGateScript, queryLocalFontBlobGateScript].filter(Boolean).join('\n');
  // Check before the UA layer can replace Function.toString and obscure the
  // document bridge. A real replay of the whole source must be a no-op.
  const replayGuard = 'try { if (Function.prototype.toString.call(Function.prototype.toString, '
    + JSON.stringify(bridgeToken) + ', "documentInstalled") === true) return; } catch (_) {}\n';
  const complete = '\n;Function.prototype.toString.call(Function.prototype.toString, '
    + JSON.stringify(bridgeToken) + ', "documentInstalled", true);';
  const payload = sharedFontPayloadForOutput
    ? 'const ' + SHARED_FONT_PAYLOAD_VAR + ' = ' + JSON.stringify(sharedFontPayloadForOutput) + ';\n'
    : '';
  const output = '(() => {\n' + replayGuard + payload + composed + complete + '\n})();';
  return rememberInjectionScript(injectionCacheKey, output);
}

// Name of the single hoisted platform-payload binding inside the composed document-start script.
// It lives inside an outer IIFE, so nothing about it is reachable from the page.
const SHARED_FONT_PAYLOAD_VAR = '__obPlatformFontPayload';

// Composing a document-start script serialises the font payload, so repeating it for every
// iframe/worker of one profile costs tens of milliseconds of main-process CPU and a fresh
// multi-megabyte string. The cache keeps at least the previous 4 entries and additionally a
// 64 MB byte budget, so font-heavy personas keep their behaviour while light personas stop
// thrashing the moment more than 4 profiles are alternately active.
const INJECTION_SCRIPT_CACHE_MIN_ENTRIES = 4;
const INJECTION_SCRIPT_CACHE_BUDGET_BYTES = 64 * 1024 * 1024;
const injectionScriptCache = new Map();
const injectionScriptCacheBytes = { total: 0 };
const rememberInjectionScript = (key, value) => {
  if (!key) return value;
  const size = typeof value === 'string' ? value.length : 0;
  if (injectionScriptCache.has(key)) {
    const prev = injectionScriptCache.get(key);
    injectionScriptCacheBytes.total -= typeof prev === 'string' ? prev.length : 0;
    injectionScriptCache.delete(key);
  }
  injectionScriptCache.set(key, value);
  injectionScriptCacheBytes.total += size;
  while (injectionScriptCache.size > INJECTION_SCRIPT_CACHE_MIN_ENTRIES
      && injectionScriptCacheBytes.total > INJECTION_SCRIPT_CACHE_BUDGET_BYTES) {
    const oldest = injectionScriptCache.keys().next().value;
    const prev = injectionScriptCache.get(oldest);
    injectionScriptCacheBytes.total -= typeof prev === 'string' ? prev.length : 0;
    injectionScriptCache.delete(oldest);
  }
  return value;
};

const injectSourceKey = (source) => crypto.createHash('sha1').update(source).digest('hex').slice(0, 16);

// applyFingerprintToTab runs on every tab, watch sweep and reload recovery, and hashing the
// multi-megabyte source each time is pure waste: the script is already cached per
// injectionCacheKey, so the derived key is cached alongside it.
const injectionSourceKeyCache = new Map();
const injectionSourceKeyCacheLimit = 256;
const injectSourceKeyCached = (injectionCacheKey, source) => {
  if (!injectionCacheKey) return injectSourceKey(source);
  const hit = injectionSourceKeyCache.get(injectionCacheKey);
  if (hit) return hit;
  const key = injectSourceKey(source);
  if (injectionSourceKeyCache.size >= injectionSourceKeyCacheLimit) {
    injectionSourceKeyCache.delete(injectionSourceKeyCache.keys().next().value);
  }
  injectionSourceKeyCache.set(injectionCacheKey, key);
  return key;
};
const injectionCacheKeyFor = (fp) => canonicalBridgeToken(fp) + '|' + String((fp && fp.bridgeChannel) || '');

module.exports = {
  buildInjectionScript,
  injectSourceKeyCached,
  injectionCacheKeyFor,
};
