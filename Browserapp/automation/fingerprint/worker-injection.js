'use strict';

/**
 * The worker-safe injection subset applied before attached workers are
 * resumed. Extracted verbatim from the former automation/fingerprint.js.
 */

// Shared CFG layer: the os/timezone/deviceMemory/webgl/stability computations the
// main-world builder (injection-script.js) also embeds live in injection-config.js so
// the two emitted CFGs cannot drift independently. Key order, key set and the
// intentionally divergent leaves (vendor, userAgentMetadata, webgpu, stability caps)
// stay in this file's literal — see the drift list in injection-config.js.
const { resolveInjectionStability, injectionOs, injectionTimezone, injectionDeviceMemory, injectionWebgl, stabilityNoiseAmplitude, stabilitySampleStepDivisor, stabilityMaxWidth, stabilityMaxHeight, stabilitySquare } = require('./injection-config');
const { normalizeNetworkInformation } = require('../../shared/profile-values');
const { canonicalBridgeToken } = require('./shared');
const { WORKER_RUNTIME_REVISION } = require('./runtime-revision');
const { buildWorkerRuntimeFull } = require('./runtime-source');
const { buildWorkerFontPresenceSource } = require('../worker-font-presence-fallback');


/** Worker-safe subset injected before attached workers are resumed. */
function buildWorkerInjectionScript(fp, options = {}) {
  const bridgeToken = canonicalBridgeToken(fp);
  const stability = resolveInjectionStability(fp);
  const json = JSON.stringify({
    platform: fp.platform,
    // Mirrors the main-world CFG (injection-script.js): os/mobile/mobileDevice feed the worker's
    // platform guards (isIosPersona / isAndroidPersona / the UAData page-side replacement path).
    // Missing keys made those guards read undefined and silently skip the patches they gate.
    os: injectionOs(fp),
    mobile: Boolean(fp.mobile),
    mobileDevice: fp.mobileDevice || null,
    userAgent: fp.userAgent,
    appVersion: fp.uaProfile?.appVersion || String(fp.userAgent || '').replace(/^Mozilla\//, ''),
    // Intentionally divergent from the main-world CFG (injection-script.js adds the iOS
    // 'Apple Computer, Inc.' branch and a uaProfile.vendor fallback) — preserved as-is,
    // see the drift list in injection-config.js.
    vendor: fp.vendor ?? fp.uaProfile?.vendor ?? 'Google Inc.',
    // Keep the same metadata fallback as the document builder.
    userAgentMetadata: fp.userAgentMetadata || fp.uaProfile?.metadata || null,
    languages: fp.languages,
    timezone: injectionTimezone(fp),
    hardwareConcurrency: fp.hardwareConcurrency,
    connection: normalizeNetworkInformation(fp.connection),
    ...(options.retiredWorkerIdentities?.length ? { retiredWorkerIdentities: options.retiredWorkerIdentities } : {}),
    // Pass persona's legal quantised tiers (0.25/0.5) through; snap illegal values to the
    // nearest step — same policy as the main-world script, shared in injection-config.js.
    deviceMemory: injectionDeviceMemory(fp),
    webgl: injectionWebgl(fp),
    // Intentionally divergent from the main-world CFG (main passes fp.webgpu || null
    // through unchanged; this side restructures to {mode, gpu} and synthesises a
    // webgl-gpu fallback) — preserved as-is, see injection-config.js.
    webgpu: fp.webgpu ? {
      mode: String(fp.webgpu.mode || 'real'),
      gpu: fp.webgpu.gpu || fp.webgl?.gpu || null,
    } : (fp.webgl?.gpu ? {
      mode: 'webgl',
      gpu: fp.webgl.gpu,
    } : null),
    canvas: fp.canvas,
    seed: fp.seed,
    stability: {
      active: Boolean(stability.active),
      mode: String(stability.mode || 'auto'),
      hosts: Array.isArray(stability.hosts) ? stability.hosts : [],
      skipHosts: Array.isArray(stability.skipHosts) ? stability.skipHosts : [],
      noiseAmplitude: stabilityNoiseAmplitude(stability),
      sampleStepDivisor: stabilitySampleStepDivisor(stability),
      maxWidth: stabilityMaxWidth(stability),
      maxHeight: stabilityMaxHeight(stability),
      square: stabilitySquare(stability),
    },
  });
  // The private Function bridge in worker-bootstrap owns idempotency.
  // The entire prefix returns before any fragment can be installed twice.
  const core = buildWorkerRuntimeFull({ json, bridgeToken, fontPresenceSource: buildWorkerFontPresenceSource(fp) });
  if (options.coreOnly) return core;
  const { installerSource } = require('./runtime/worker-constructor-patch');
  return core + '(undefined, (' + installerSource + '));';

}

function buildWorkerDeliveryProbe(fp) {
  const token = JSON.stringify(canonicalBridgeToken(fp));
  return `Function.prototype.toString.call(Function.prototype.toString, ${token}, 'workerInstalled') === ${WORKER_RUNTIME_REVISION}`;
}

module.exports = {
  buildWorkerDeliveryProbe,
  buildWorkerInjectionScript,
};
