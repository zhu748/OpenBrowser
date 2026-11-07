'use strict';

/**
 * Public entry of the fingerprint package. The require path from every
 * consumer is unchanged (require('.../fingerprint') resolves to this
 * directory now that the former fingerprint.js monolith is gone); the export
 * surface is identical to the original module.
 */

const persona = require('./persona');
const injectionScript = require('./injection-script');
const workerInjection = require('./worker-injection');
const shared = require('./shared');
const chromeArgs = require('./chrome-args');
const tabApply = require('./tab-apply');

module.exports = {
  buildFingerprint: persona.buildFingerprint,
  buildInjectionScript: injectionScript.buildInjectionScript,
  buildWorkerInjectionScript: workerInjection.buildWorkerInjectionScript,
  buildFontMetricsScript: shared.buildFontMetricsScript,
  loadFontSubsetPayload: shared.loadFontSubsetPayload,
  mapPlatformToSubsetKey: shared.mapPlatformToSubsetKey,
  FONT_SUBSET_ROOT: shared.FONT_SUBSET_ROOT,
  chromeArgsForFingerprint: chromeArgs.chromeArgsForFingerprint,
  applyFingerprintToTab: tabApply.applyFingerprintToTab,
  fingerprintConsistencyIssues: persona.fingerprintConsistencyIssues,
  hashSeed: shared.hashSeed,
  createMediaDevicesFromSeed: shared.createMediaDevicesFromSeed,
  createSpeechVoicesFromSeed: shared.createSpeechVoicesFromSeed,
  createDeviceNameFromSeed: shared.createDeviceNameFromSeed,
  createLocalIpFromSeed: shared.createLocalIpFromSeed,
  formatGeopositionValue: shared.formatGeopositionValue,
  createBatteryFromSeed: shared.createBatteryFromSeed,
  buildWebglFpPayload: shared.buildWebglFpPayload,
  webglParameterOverrides: shared.webglParameterOverrides,
  normalizeGpuArchitecture: shared.normalizeGpuArchitecture,
  isDisallowedVendorExtension: shared.isDisallowedVendorExtension,
  WEBGL_PARAM_IDS: shared.WEBGL_PARAM_IDS,
  HOST_WEBGL_LIMITS: shared.HOST_WEBGL_LIMITS,
  HOST_WEBGL2_DEFAULTS: shared.HOST_WEBGL2_DEFAULTS,
  MEDIA_DEVICE_POOLS_BY_OS: shared.MEDIA_DEVICE_POOLS_BY_OS,
  MEDIA_DEVICE_TEMPLATES: shared.MEDIA_DEVICE_TEMPLATES,
  getHostWebglLimits: shared.getHostWebglLimits,
  isPersonaWebglCompatible: shared.isPersonaWebglCompatible,
  compatiblePersonasForOs: shared.compatiblePersonasForOs,
  resolveCompatiblePersona: shared.resolveCompatiblePersona,
  audioMarkFromSeed: shared.audioMarkFromSeed,
  clientRectMarkFromSeed: shared.clientRectMarkFromSeed,
  resolveStabilityPolicy: shared.resolveStabilityPolicy,
  matchStabilityHost: shared.matchStabilityHost,
  sampleCanvasBlocks: shared.sampleCanvasBlocks,
  hammingDistance: shared.hammingDistance,
  applyStableCanvasNoise: shared.applyStableCanvasNoise,
  withinHammingThreshold: shared.withinHammingThreshold,
  DEFAULT_STABILITY_HOSTS: shared.DEFAULT_STABILITY_HOSTS,
  DEFAULT_STABILITY_SKIP_HOSTS: shared.DEFAULT_STABILITY_SKIP_HOSTS,
  WEBGL_PRESETS: shared.WEBGL_PRESETS,
  buildUaProfile: shared.buildUaProfile,
  randomUaForSeed: shared.randomUaForSeed,
  OS_PRESETS: shared.OS_PRESETS,
};
