'use strict';

/**
 * Shared CFG construction layer for the two injection-script builders
 * (injection-script.js, the document-start main-world script, and
 * worker-injection.js, the WorkerGlobalScope subset).
 *
 * Both builders used to carry their own copy of the CFG literals (os/mobile
 * fallbacks, deviceMemory quantisation, webgl override block, stability
 * coercions), which the P0-P4 review flagged as hand-double-written drift
 * surface. Every computation the two builders share now lives here once, so a
 * change to a shared leaf cannot be made on one side only.
 *
 * Scope contract (byte-identical output): each helper below reproduces exactly
 * one field of the former inline literals — same fallback chain, same coercion
 * defaults, same property evaluation order. The builders keep their own key
 * ORDER, key SET and per-key comments, because those differ between the main
 * and worker CFG shapes by design (and where they drifted, see the
 * "intentionally divergent" notes below — the divergence is preserved, not
 * unified; unifying it is a behaviour change that needs product sign-off):
 *
 *   - vendor: main falls back to the iOS 'Apple Computer, Inc.' branch when
 *     the persona is iOS (mobileDevice/uaProfile/platform tests); worker falls
 *     back to fp.uaProfile?.vendor || 'Google Inc.' only.
 *   - userAgentMetadata uses the same uaProfile fallback in both realms.
 *   - webgpu: main passes fp.webgpu || null through unchanged; worker
 *     restructures it to {mode, gpu} and synthesises a webgl-gpu fallback.
 *   - stability: main slices hosts to 800 / skipHosts to 200, emits hamming,
 *     and keeps raw stability.mode; worker slices nothing, has no hamming key,
 *     and stringifies mode with an 'auto' default.
 *   - key order inside the emitted CFG JSON differs between the two files.
 *
 * The deviceMemory quantisation and the stability leaf defaults below are the
 * values both builders already agreed on (verified by snapshot diff before the
 * extraction) and are therefore shared outright.
 */

const { webglParameterOverrides, resolveStabilityPolicy } = require('./shared');

/**
 * navigator.deviceMemory is spec-quantised to these tiers and capped at 8.
 * Legal values pass through; anything else snaps to the nearest step.
 */
const DEVICE_MEMORY_STEPS = [0.25, 0.5, 1, 2, 4, 8];

/** Default leaves of the injected stability CFG (shared by both scripts). */
const STABILITY_DEFAULT_NOISE_AMPLITUDE = 3;
const STABILITY_DEFAULT_SAMPLE_STEP_DIVISOR = 64;
const STABILITY_DEFAULT_HAMMING = 12;
const STABILITY_DEFAULT_MAX_WIDTH = 600;
const STABILITY_DEFAULT_MAX_HEIGHT = 600;
const STABILITY_DEFAULT_SQUARE = 8;

/**
 * Both builders resolve the stability policy from the same chain:
 * explicit fp.stability, then the canvas-attached variant, then a fresh
 * default policy. The worker builder resolves it before the CFG literal
 * (it is also used for the String(...) mode read); keep calling this helper
 * in the same position each builder used to resolve it inline.
 */
function resolveInjectionStability(fp) {
  return fp.stability || fp.canvas?.stability || resolveStabilityPolicy({}, {});
}

/** CFG.os: declared UA OS, else android/windows from the mobile flag. */
function injectionOs(fp) {
  return fp.uaProfile?.os || (fp.mobile ? 'android' : 'windows');
}

/** CFG.timezone: explicit, then the dynamicConfig exit-IP zone, else null. */
function injectionTimezone(fp) {
  return fp.timezone || fp.dynamicConfig?.timezone || null;
}

/** CFG.deviceMemory: pass legal quantised tiers through, snap illegal ones. */
function injectionDeviceMemory(fp) {
  if (fp.deviceMemory == null) return null;
  const raw = Number(fp.deviceMemory);
  if (!Number.isFinite(raw) || raw <= 0) return 8;
  if (DEVICE_MEMORY_STEPS.includes(raw)) return Math.min(8, raw);
  return DEVICE_MEMORY_STEPS.reduce((best, s) => (Math.abs(s - raw) < Math.abs(best - raw) ? s : best), 1);
}

/**
 * CFG.webgl: the override block both scripts embed. Same evaluation order as
 * the former inline literals (mode, metaMode, vendor, renderer, mark, gpu,
 * limits) so the emitted JSON keeps its exact byte shape.
 */
function injectionWebgl(fp) {
  return {
    mode: fp.webgl?.mode,
    metaMode: fp.webgl?.metaMode || 'noise',
    vendor: fp.webgl?.vendor,
    renderer: fp.webgl?.renderer,
    mark: fp.webgl?.mark,
    gpu: fp.webgl?.gpu || null,
    limits: fp.webgl?.limits || webglParameterOverrides(fp.webgl?.gpu, { reconcileHost: fp.webgl?.reconcileHost !== false, hostPlatform: process.platform }),
  };
}

// Stability leaf coercions. Key presence/order stay in each builder's literal
// (the worker CFG omits hamming and orders keys differently — preserved); only
// the Number(...)|| default computations are shared.
const stabilityNoiseAmplitude = (stability) => Number(stability.noiseAmplitude) || STABILITY_DEFAULT_NOISE_AMPLITUDE;
const stabilitySampleStepDivisor = (stability) => Number(stability.sampleStepDivisor) || STABILITY_DEFAULT_SAMPLE_STEP_DIVISOR;
const stabilityHamming = (stability) => Number(stability.hamming) || STABILITY_DEFAULT_HAMMING;
const stabilityMaxWidth = (stability) => Number(stability.maxWidth) || STABILITY_DEFAULT_MAX_WIDTH;
const stabilityMaxHeight = (stability) => Number(stability.maxHeight) || STABILITY_DEFAULT_MAX_HEIGHT;
const stabilitySquare = (stability) => Number(stability.square) || STABILITY_DEFAULT_SQUARE;

module.exports = {
  DEVICE_MEMORY_STEPS,
  STABILITY_DEFAULT_NOISE_AMPLITUDE,
  STABILITY_DEFAULT_SAMPLE_STEP_DIVISOR,
  STABILITY_DEFAULT_HAMMING,
  STABILITY_DEFAULT_MAX_WIDTH,
  STABILITY_DEFAULT_MAX_HEIGHT,
  STABILITY_DEFAULT_SQUARE,
  resolveInjectionStability,
  injectionOs,
  injectionTimezone,
  injectionDeviceMemory,
  injectionWebgl,
  stabilityNoiseAmplitude,
  stabilitySampleStepDivisor,
  stabilityHamming,
  stabilityMaxWidth,
  stabilityMaxHeight,
  stabilitySquare,
};
