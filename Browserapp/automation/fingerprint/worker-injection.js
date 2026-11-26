'use strict';

/**
 * The worker-safe injection subset applied before attached workers are
 * resumed. Extracted verbatim from the former automation/fingerprint.js.
 */

const { injectionOs, injectionTimezone, injectionDeviceMemory, injectionWebgl, injectionCanvas, injectionStability } = require('./injection-config');
const { normalizeNetworkInformation } = require('../../shared/profile-values');
const { canonicalBridgeToken } = require('./shared');
const { WORKER_RUNTIME_REVISION } = require('./runtime-revision');
const { buildWorkerRuntimeFull } = require('./runtime-source');
const { buildWorkerFontPresenceSource } = require('../worker-font-presence-fallback');
const { BoundedLru } = require('../bounded-lru');

const WORKER_CACHE_LIMIT = 64;
const WORKER_CACHE_BYTES = 16 * 1024 * 1024;
const workerScripts = new BoundedLru({ maxEntries: WORKER_CACHE_LIMIT, maxBytes: WORKER_CACHE_BYTES,
  sizeOf: (source) => source.length * 2 });

function rememberWorkerScript(key, source) {
  workerScripts.set(key, source);
  return source;
}

/** Worker-safe subset injected before attached workers are resumed. */
function buildWorkerInjectionScript(fp, options = {}) {
  const bridgeToken = canonicalBridgeToken(fp);
  const cacheKey = JSON.stringify([bridgeToken, Boolean(options.coreOnly), options.retiredWorkerIdentities || []]);
  const cached = workerScripts.get(cacheKey);
  if (cached) {
    return cached;
  }
  const timezone = injectionTimezone(fp);
  const json = JSON.stringify({
    engine: fp.engine || fp.uaProfile?.engine || 'chromium',
    kernelVersion: fp.kernelVersion || '',
    platform: fp.platform,
    // Mirrors the main-world CFG (injection-script.js): os/mobile/mobileDevice feed the worker's
    // platform guards (isIosPersona / isAndroidPersona / the UAData page-side replacement path).
    // Missing keys made those guards read undefined and silently skip the patches they gate.
    os: injectionOs(fp),
    mobile: Boolean(fp.mobile),
    mobileDevice: fp.mobileDevice || null,
    userAgent: fp.userAgent,
    appVersion: fp.uaProfile?.appVersion || String(fp.userAgent || '').replace(/^Mozilla\//, ''),
    // Workers use the explicit vendor or UA profile, without inferring it from the platform.
    vendor: fp.vendor ?? fp.uaProfile?.vendor ?? 'Google Inc.',
    // Keep the same metadata fallback as the document builder.
    userAgentMetadata: fp.userAgentMetadata || fp.uaProfile?.metadata || null,
    languages: fp.languages,
    timezone,
    hardwareConcurrency: fp.hardwareConcurrency,
    connection: normalizeNetworkInformation(fp.connection),
    ...(options.retiredWorkerIdentities?.length ? { retiredWorkerIdentities: options.retiredWorkerIdentities } : {}),
    // Pass persona's legal quantised tiers (0.25/0.5) through; snap illegal values to the
    // nearest step — same policy as the main-world script, shared in injection-config.js.
    deviceMemory: injectionDeviceMemory(fp),
    webgl: injectionWebgl(fp),
    webgpu: fp.webgpu || null,
    canvas: injectionCanvas(fp),
    seed: fp.seed,
    stability: injectionStability(fp),
  });
  // The private Function bridge in worker-bootstrap owns idempotency.
  // The entire prefix returns before any fragment can be installed twice.
  const core = buildWorkerRuntimeFull({
    json, bridgeToken, timezone, blockWebgl: fp.webgl?.mode === 'blocked',
    canvasNoise: fp.canvas?.mode === 'noise',
    fontPresenceSource: buildWorkerFontPresenceSource(fp),
  });
  if (options.coreOnly) return rememberWorkerScript(cacheKey, core);
  const { installerSource } = require('./runtime/worker-constructor-patch');
  return rememberWorkerScript(cacheKey, core + '(undefined, (' + installerSource + '));');

}

function buildWorkerDeliveryProbe(fp) {
  const token = JSON.stringify(canonicalBridgeToken(fp));
  return `Function.prototype.toString.call(Function.prototype.toString, ${token}, 'workerInstalled') === ${WORKER_RUNTIME_REVISION}`;
}

module.exports = {
  buildWorkerDeliveryProbe,
  buildWorkerInjectionScript,
};
