'use strict';

/**
 * Codec capability matrix, document side.
 *
 * isConfigSupported / isTypeSupported / getCapabilities answer with the HOST's
 * hardware codec support — a per-machine read that ignores the persona entirely.
 * The persona answers from the claimed OS's stock-Chrome capability set instead;
 * the host's real accelerators stay invisible.
 *
 * Built as a function of the assembly context (like workerConstructorPatch): the
 * fragment runs as a top-level sibling of the bootstrap IIFE, where CFG is NOT in
 * scope, so the matrix is inlined into the emitted source instead of read from it.
 */

module.exports = function codecMatrixFragment({ json }) {
  let cfg;
  try { cfg = JSON.parse(json); } catch (_) { return ''; }
  const matrix = cfg && cfg.codecMatrix;
  if (!matrix || typeof matrix !== 'object') return '';
  return `
  // --- codec capability matrix (persona-OS shaped) ---
  (() => {
    const matrix = ${JSON.stringify(matrix)};
    const answerFor = (family, mime) => {
      const m = String(mime || '').toLowerCase();
      const codecs = (m.match(/codecs="?([^";]*)"?/) || [])[1] || '';
      const base = m.split(';')[0].trim();
      const row = matrix[family];
      if (!row) return null;
      const hit = Object.keys(row).find((k) => base === k || base.includes(k));
      if (!hit) return null;
      const decision = row[hit];
      if (decision === true) return true;
      if (decision === false) return false;
      if (typeof decision === 'object' && decision.codec !== undefined) {
        if (!codecs) return decision.default !== false;
        return decision.list ? decision.list.some((p) => codecs.startsWith(p)) : decision.default !== false;
      }
      return null;
    };
    const install = (proto, method, family) => {
      if (!proto || typeof proto[method] !== 'function') return;
      const original = proto[method];
      const patched = function (config) {
        const mime = String(config?.contentType || config?.type || config?.mimeType || '');
        const decision = answerFor(family, mime);
        if (decision == null) return original.apply(this, arguments);
        return Promise.resolve({ supported: decision });
      };
      try {
        Object.defineProperty(proto, method, { configurable: true, enumerable: true, writable: true, value: patched });
      } catch (_) {}
    };
    if (typeof VideoDecoder !== 'undefined') install(VideoDecoder, 'isConfigSupported', 'video');
    if (typeof AudioDecoder !== 'undefined') install(AudioDecoder, 'isConfigSupported', 'audio');
    if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
      const origMRS = MediaRecorder.isTypeSupported;
      const patchedMRS = function isTypeSupported(type) {
        const decision = answerFor('recorder', type);
        return decision == null ? origMRS.call(this, type) : Boolean(decision);
      };
      try {
        Object.defineProperty(MediaRecorder, 'isTypeSupported', { configurable: true, enumerable: true, writable: true, value: patchedMRS });
      } catch (_) {}
    }
    if (typeof RTCRtpSender !== 'undefined' && typeof RTCRtpSender.getCapabilities === 'function') {
      const origCaps = RTCRtpSender.getCapabilities;
      const patchedCaps = function getCapabilities(kind) {
        const caps = origCaps.call(this, kind);
        if (!caps || !Array.isArray(caps.codecs)) return caps;
        const family = String(kind) === 'audio' ? 'rtcAudio' : 'rtcVideo';
        const row = matrix[family];
        if (!row) return caps;
        const kept = caps.codecs.filter((c) => {
          const mime = String(c.mimeType || '').toLowerCase();
          const hit = Object.keys(row).find((k) => mime.includes(k));
          if (hit == null) return true;
          return row[hit] !== false;
        });
        if (kept.length === caps.codecs.length) return caps;
        return { codecs: kept };
      };
      try {
        Object.defineProperty(RTCRtpSender, 'getCapabilities', { configurable: true, enumerable: true, writable: true, value: patchedCaps });
      } catch (_) {}
    }
  })();
`;
};
