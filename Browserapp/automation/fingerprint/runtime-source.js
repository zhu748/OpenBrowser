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
    documentNavigator,
    networkFragment,
    documentTimezoneAudio,
    drop(keepFonts) ?? documentFonts,
    documentScreen,
    documentGraphics,
    drop(keepWebrtc) ?? documentWebrtc,
    drop(keepMedia) ?? documentMedia,
    documentGpuStorage,
    // blob:/data: worker identity delivery: the Fetch prefixer only sees
    // network-loaded scripts, so inline workers need a main-world constructor
    // patch (see runtime/worker-constructor-patch.js).
    context.workerSource
      ? workerConstructorPatch({ workerSource: context.workerSource })
      : '',
  ].join('');
}

function buildWorkerRuntime(context) {
  // The session bootstrap must be able to re-emit the ENTIRE worker prefix
  // (itself included) for blob:/data: session delivery, so its __SELF_SOURCE__
  // placeholder is substituted at assembly time — after assembly, replace the
  // marker with the final source. See buildWorkerRuntimeFull below.
  const assembled = [
    workerBootstrap(context),
    networkFragment,
    workerTimezone,
    workerGraphics,
    workerGpuStorage,
  ].join('');
  return assembled;
}

/** Full worker source including the session bootstrap. Callers that deliver
 *  worker identity (engine prefixer, document Worker patch) must use THIS
 *  builder so blob:/data: sessions can re-run original scripts under the
 *  already-installed prefix mocks. The session fragment carries NO copy of
 *  the prefix: re-emission runs the original text as a plain second
 *  importScripts after the bootstrap's own persona import (see
 *  runtime/worker-session-bootstrap.js), which keeps the composed document
 *  script free of a second font-payload copy (font-bridge budget).
 */
function buildWorkerRuntimeFull(context) {
  const body = buildWorkerRuntime(context);
  const closeIdx = body.lastIndexOf('})();');
  if (closeIdx === -1) return body + workerSessionBootstrap;
  return body.slice(0, closeIdx) + workerSessionBootstrap + body.slice(closeIdx);
}

module.exports = { buildDocumentRuntime, buildWorkerRuntime, buildWorkerRuntimeFull };
