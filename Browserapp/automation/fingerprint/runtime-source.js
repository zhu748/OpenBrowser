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
const { runtimeSource: nativeArguments } = require('./native-arguments');
const { runtimeSource: webglCapabilities } = require('./webgl-capabilities');
const codecMatrixFragment = require('./runtime/codec-matrix-fragment');

// Parse the assembled CFG once (it is a JSON literal produced by
// injection-script.js), then decide fragment inclusion against it.
function parseCfg(context) {
  try { return JSON.parse(context.json); } catch (_) { return null; }
}

// webrtc fragment: only executes for 'disabled' or ('proxy' + address).
// 'real' (or an absent value) makes every top-level branch dead.
function webrtcFragmentActive(cfg) {
  return cfg ? (cfg.webrtc === 'disabled' || (cfg.webrtc === 'proxy' && cfg.webrtcAddress)) : true;
}

// fonts fragment: requires a declared font persona (list or foreign families).
function fontsFragmentActive(cfg) {
  return cfg ? Boolean(
    (cfg.fonts && Array.isArray(cfg.fonts.list) && cfg.fonts.list.length)
    || (cfg.fonts && Array.isArray(cfg.fonts.foreign) && cfg.fonts.foreign.length)
  ) : true;
}

// This fragment also owns speech, battery and Bluetooth. It can
// only be dropped when every independent branch is inactive.
function mediaFragmentActive(cfg) {
  return cfg ? Boolean(
    (cfg.mediaDevices && cfg.mediaDevices.mode && cfg.mediaDevices.mode !== 'real' && Array.isArray(cfg.mediaDevices.devices))
    || cfg.mediaDevices?.blockCapture
    || cfg.speech?.mode === 'blocked'
    || (cfg.speech?.mode === 'noise' && Array.isArray(cfg.speech.voices))
    || cfg.battery?.mode === 'blocked'
    || (cfg.battery?.mode === 'noise' && cfg.battery.value && !cfg.battery.value.blocked)
    || cfg.bluetooth?.mode === 'blocked'
  ) : true;
}

function buildDocumentRuntime(context) {
  const cfg = parseCfg(context);
  const keepWebrtc = webrtcFragmentActive(cfg);
  const keepFonts = fontsFragmentActive(cfg);
  const keepMedia = mediaFragmentActive(cfg);
  // When the CFG could not be parsed, keep everything: pruning is an
  // optimization and must never change behavior on unexpected input.
  // gpu-storage is NOT prunable: its StorageManager.estimate quota block
  // runs unconditionally, independent of CFG.webgpu.
  const drop = (keep) => (keep === false ? '' : undefined);
  return [
    documentBootstrap(context),
    nativeArguments,
    documentNavigator,
    networkFragment,
    documentTimezoneAudio,
    drop(keepFonts) ?? documentFonts,
    documentScreen,
    webglCapabilities,
    documentGraphics,
    drop(keepWebrtc) ?? documentWebrtc,
    drop(keepMedia) ?? documentMedia,
    // Install inside the document helper closure, before its IIFE closes.
    context.workerSource ? workerConstructorPatch({ workerSource: context.workerSource }) : '',
    documentGpuStorage,
    // Codec capability matrix: passive unless the CFG carries a matrix.
    codecMatrixFragment(context),
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
    webglCapabilities,
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

module.exports = { buildDocumentRuntime, buildWorkerRuntime, buildWorkerRuntimeFull };
