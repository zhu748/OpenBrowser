'use strict';

// Domain fragments share the original lexical scope and order. Only the bootstrap
// renders configuration; static fragments are loaded once without changing output.
//
// Fragments are also PRUNED at assembly time: the emitted script used to carry
// every domain unconditionally (~262KB document-side), so a desktop persona paid
// for the mobile branches, a profile with fonts disabled paid for the entire font
// block, and so on. A fragment is dropped only when the same CFG the fragment
// itself reads proves the whole block cannot execute — pruning must never remove
// a fragment whose top-level condition could still be true at runtime.
const documentBootstrap = require('./runtime/document-bootstrap');
const documentNavigator = require('./runtime/document-navigator');
const documentTimezoneAudio = require('./runtime/document-timezone-audio');
const documentFonts = require('./runtime/document-fonts');
const documentScreen = require('./runtime/document-screen');
const documentGraphics = require('./runtime/document-graphics');
const documentWebrtc = require('./runtime/document-webrtc');
const documentMedia = require('./runtime/document-media');
const documentGpuStorage = require('./runtime/document-gpu-storage');
const workerBootstrap = require('./runtime/worker-bootstrap');
const workerConstructorPatch = require('./runtime/worker-constructor-patch');
const workerTimezone = require('./runtime/worker-timezone');
const workerGraphics = require('./runtime/worker-graphics');
const workerGpuStorage = require('./runtime/worker-gpu-storage');
const workerSessionBootstrap = require('./runtime/worker-session-bootstrap');
const networkFragment = require('./runtime/network-fragment');
const canvasReadback = require('./runtime/canvas-readback');
const textMetricsCache = require('./runtime/text-metrics-cache').runtimeSource;
const audioWriteTracker = require('./runtime/audio-write-tracker').runtimeSource;
const videoFrameReadback = require('./runtime/video-frame-readback').runtimeSource;
const { runtimeSource: nativeArguments } = require('./native-arguments');
const { runtimeSource: webglCapabilities } = require('./webgl-capabilities');
const { contextKindSource, contextBlockingSource } = require('./webgl-context-policy');

// webrtc fragment: only executes for 'disabled' or ('proxy' + address).
// 'real' (or an absent value) makes every top-level branch dead.
function webrtcFragmentActive(cfg) {
  return cfg.webrtc === 'disabled' || (cfg.webrtc === 'proxy' && cfg.webrtcAddress);
}

// fonts fragment: requires a declared font persona (list or foreign families).
function fontsFragmentActive(cfg) {
  return Boolean(
    (cfg.fonts && Array.isArray(cfg.fonts.list) && cfg.fonts.list.length)
    || (cfg.fonts && Array.isArray(cfg.fonts.foreign) && cfg.fonts.foreign.length)
  );
}

// This fragment also owns speech, battery and Bluetooth. It can
// only be dropped when every independent branch is inactive.
function mediaFragmentActive(cfg) {
  return Boolean(
    (cfg.mediaDevices && cfg.mediaDevices.mode && cfg.mediaDevices.mode !== 'real' && Array.isArray(cfg.mediaDevices.devices))
    || cfg.mediaDevices?.blockCapture
    || cfg.speech?.mode === 'blocked'
    || (cfg.speech?.mode === 'noise' && Array.isArray(cfg.speech.voices))
    || cfg.battery?.mode === 'blocked'
    || (cfg.battery?.mode === 'noise' && cfg.battery.value && !cfg.battery.value.blocked)
    || cfg.bluetooth?.mode === 'blocked'
  );
}

function buildDocumentRuntime({ config, ...context }) {
  const blockWebgl = config.webgl?.mode === 'blocked';
  // The pruning checks and the emitted script read the same configuration.
  return [
    documentBootstrap({ ...context, json: JSON.stringify(config) }),
    nativeArguments,
    documentNavigator,
    networkFragment,
    audioWriteTracker,
    documentTimezoneAudio,
    fontsFragmentActive(config) ? documentFonts : '',
    documentScreen,
    webglCapabilities,
    blockWebgl || config.canvas?.mode === 'noise' ? contextKindSource : '',
    blockWebgl ? contextBlockingSource : '',
    canvasReadback,
    textMetricsCache,
    videoFrameReadback,
    documentGraphics,
    webrtcFragmentActive(config) ? documentWebrtc : '',
    mediaFragmentActive(config) ? documentMedia : '',
    // Install inside the document helper closure, before its IIFE closes.
    context.workerSource ? workerConstructorPatch({ workerSource: context.workerSource }) : '',
    documentGpuStorage,
  ].join('');
}

function buildWorkerRuntime(context) {
  // A named, closure-local installer can serialize itself for child workers.
  // The source is reconstructed only at runtime, without recursive embedding.
  const assembled = [
    workerBootstrap(context),
    nativeArguments,
    networkFragment,
    workerTimezone,
    canvasReadback,
    textMetricsCache,
    videoFrameReadback,
    webglCapabilities,
    context.blockWebgl ? contextKindSource + contextBlockingSource : '',
    workerGraphics,
    workerGpuStorage,
  ].join('');
  return assembled;
}

/** Add private nested-worker delivery and original WorkerLocation handling.
 *  The fragment runs inside the named installer and adds no global hooks.
 */
function buildWorkerRuntimeFull(context) {
  const body = buildWorkerRuntime(context);
  const closeIdx = body.lastIndexOf('})();');
  if (closeIdx === -1) throw new Error('Worker installer closing expression is missing');
  const complete = body.slice(0, closeIdx) + (context.fontPresenceSource || '') + workerSessionBootstrap + body.slice(closeIdx);
  return complete.replace(/\(\);\s*$/, '');
}

module.exports = { buildDocumentRuntime, buildWorkerRuntimeFull  };
