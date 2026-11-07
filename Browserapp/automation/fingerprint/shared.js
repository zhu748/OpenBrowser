'use strict';

/**
 * Deterministic fingerprint profile for multi-open isolation.
 *
 * Stock Chromium path (no custom kernel):
 *  - isolated user-data-dir
 *  - CDP Emulation (timezone / geo / UA-CH / locale / device metrics)
 *  - document-start JS injection for navigator, canvas/webgl/audio/clientRects noise,
 *    mediaDevices, speech voices, WebRTC policy, WebGPU adapter info
 *
 * Config is split into:
 *  - staticConfig: stable noise identity (marks, cores, platform, devices, webgl payload)
 *  - dynamicConfig: exit-IP layer (timezone, geoposition, webrtc address/mode)
 *
 * Kernel-only surfaces (MAC, device name, file-protocol static/dynamic consumers,
 * full TLS/JA3 gateway) are out of scope for this module.
 */

const { mergeFlags, LIST_VALUE_FLAGS } = require('../command-line-flags');
const { pickPersona, fontsForOs, exclusiveFontsForOtherOs, HOST_WEBGL_LIMITS, getHostWebglLimits, isPersonaWebglCompatible, compatiblePersonasForOs, resolveCompatiblePersona, applyPersonaPerturbations } = require('../device-personas');
const { createWebRtcFallbackSource } = require('../webrtc-fallback');
const { mobilePersona, supportsRuntimePersona } = require('../mobile-personas');
const { buildCssFontLocalGateSource } = require('../css-font-local-gate');
const { deriveFontPlaceholder, deriveBridgeToken } = require('../font-placeholder');
const { buildQueryLocalFontBlobGateSource } = require('../query-local-font-blob-gate');
const {
  buildUaProfile,
  randomUaForSeed,
  chromeArgsForUa,
  cdpUserAgentOverride,
  buildAcceptLanguageHeader,
  formatAcceptLanguage,
  buildUaInjectionScript,
  parseOsFromUa,
  OS_PRESETS,
} = require('../user-agent');

/**
 * Canonical bridge secret for one profile.
 *
 * The bridge token is the shared secret between the page-side lazy font payload channel and the
 * host that answers it. It has to be a pure function of the *declared* configuration, because
 * three independent callers derive it — buildFingerprint (which stamps fontBlobBridge), the
 * document injection script and the worker injection script — plus the host re-reads it later to
 * validate whatever the page sends. Two derived fields are therefore excluded:
 *   * fontBlobBridge carries the token itself, so hashing it would make the value depend on how
 *     many times (and in what order) the helpers ran, and would break the injection script cache.
 *   * consistency is a diagnostic list computed at the end of buildFingerprint.
 * Without this, a document could receive a script whose token the host then rejects, and workers
 * would disagree with the main world — a cross-realm fingerprint inconsistency that silently
 * drops every lazy payload request.
 */
function canonicalBridgeToken(fp) {
  if (!fp || typeof fp !== 'object') return deriveBridgeToken(fp);
  const { fontBlobBridge, consistency, ...declared } = fp;
  return deriveBridgeToken(declared);
}

const { FONT_SUBSET_ROOT, mapPlatformToSubsetKey, loadFontSubsetPayload, buildFontMetricsScript } = require('../font-metrics');
const {
  hashSeed,
  u32,
  mulberry32,
  WEBGL_PRESETS,
  LEGACY_MACOS_WEBGL_PRESETS,
  webglPresetsForOs,
  WEBGL_GPU_LIMITS,
  HOST_WEBGL2_DEFAULTS,
  WEBGL_PARAM_IDS,
  normalizeGpuArchitecture,
  webglParameterOverrides,
  isDisallowedVendorExtension,
  expectedClientHintPlatform,
  buildWebglFpPayload,
  desktopOs,
  MEDIA_DEVICE_POOLS_BY_OS,
  MEDIA_DEVICE_TEMPLATES,
  SPEECH_VOICE_POOL,
  speechVoicePoolForOs,
  DEVICE_NAME_PREFIXES,
  DEVICE_NAME_SUFFIXES,
  DEFAULT_STABILITY_HOSTS,
  DEFAULT_STABILITY_SKIP_HOSTS,
  normalizeHost,
  hostMatchesPattern,
  listIncludesHost,
  resolveStabilityPolicy,
  matchStabilityHost,
  sampleCanvasBlocks,
  hammingDistance,
  applyStableCanvasNoise,
  withinHammingThreshold,
  createBatteryFromSeed,
  createMediaDevicesFromSeed,
  createSpeechVoicesFromSeed,
  createDeviceNameFromSeed,
  createLocalIpFromSeed,
  formatGeopositionValue,
  audioMarkFromSeed,
  clientRectMarkFromSeed,
} = require('../fingerprint-generators');

module.exports = {
  mergeFlags,
  LIST_VALUE_FLAGS,
  pickPersona,
  fontsForOs,
  exclusiveFontsForOtherOs,
  HOST_WEBGL_LIMITS,
  getHostWebglLimits,
  isPersonaWebglCompatible,
  compatiblePersonasForOs,
  resolveCompatiblePersona,
  applyPersonaPerturbations,
  createWebRtcFallbackSource,
  mobilePersona,
  supportsRuntimePersona,
  buildCssFontLocalGateSource,
  deriveFontPlaceholder,
  deriveBridgeToken,
  buildQueryLocalFontBlobGateSource,
  buildUaProfile,
  randomUaForSeed,
  chromeArgsForUa,
  cdpUserAgentOverride,
  buildAcceptLanguageHeader,
  formatAcceptLanguage,
  buildUaInjectionScript,
  parseOsFromUa,
  OS_PRESETS,
  canonicalBridgeToken,
  FONT_SUBSET_ROOT,
  mapPlatformToSubsetKey,
  loadFontSubsetPayload,
  buildFontMetricsScript,
  hashSeed,
  u32,
  mulberry32,
  WEBGL_PRESETS,
  LEGACY_MACOS_WEBGL_PRESETS,
  webglPresetsForOs,
  WEBGL_GPU_LIMITS,
  HOST_WEBGL2_DEFAULTS,
  WEBGL_PARAM_IDS,
  normalizeGpuArchitecture,
  webglParameterOverrides,
  isDisallowedVendorExtension,
  expectedClientHintPlatform,
  buildWebglFpPayload,
  desktopOs,
  MEDIA_DEVICE_POOLS_BY_OS,
  MEDIA_DEVICE_TEMPLATES,
  SPEECH_VOICE_POOL,
  speechVoicePoolForOs,
  DEVICE_NAME_PREFIXES,
  DEVICE_NAME_SUFFIXES,
  DEFAULT_STABILITY_HOSTS,
  DEFAULT_STABILITY_SKIP_HOSTS,
  normalizeHost,
  hostMatchesPattern,
  listIncludesHost,
  resolveStabilityPolicy,
  matchStabilityHost,
  sampleCanvasBlocks,
  hammingDistance,
  applyStableCanvasNoise,
  withinHammingThreshold,
  createBatteryFromSeed,
  createMediaDevicesFromSeed,
  createSpeechVoicesFromSeed,
  createDeviceNameFromSeed,
  createLocalIpFromSeed,
  formatGeopositionValue,
  audioMarkFromSeed,
  clientRectMarkFromSeed,
};
