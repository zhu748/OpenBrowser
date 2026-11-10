'use strict';

// Domain fragments share the original lexical scope and order. Only the bootstrap
// renders configuration; static fragments are loaded once without changing output.
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
const workerTimezone = require('./runtime/worker-timezone');
const workerGraphics = require('./runtime/worker-graphics');
const workerGpuStorage = require('./runtime/worker-gpu-storage');

function buildDocumentRuntime(context) {
  return [documentBootstrap(context), documentNavigator, documentTimezoneAudio, documentFonts,
    documentScreen, documentGraphics, documentWebrtc, documentMedia, documentGpuStorage].join('');
}

function buildWorkerRuntime(context) {
  return [workerBootstrap(context), workerTimezone, workerGraphics, workerGpuStorage].join('');
}

module.exports = { buildDocumentRuntime, buildWorkerRuntime };
