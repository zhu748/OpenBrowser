'use strict';

/**
 * Shared CFG construction layer for the two injection-script builders
 * (injection-script.js, the document-start main-world script, and
 * worker-injection.js, the WorkerGlobalScope subset).
 *
 * Realm-specific fields and policies stay with their respective builders.
 */

const { webglParameterOverrides, resolveStabilityPolicy } = require('./shared');
const { normalizeDeviceMemory, normalizeStabilitySettings } = require('../../shared/profile-values');

/** CFG.os: declared UA OS, else android/windows from the mobile flag. */
function injectionOs(fp) {
  return fp.uaProfile?.os || (fp.mobile ? 'android' : 'windows');
}

/** Explicit null clears the override. Older snapshots can omit the field. */
function injectionTimezone(fp) {
  return (Object.hasOwn(fp, 'timezone') ? fp.timezone : fp.dynamicConfig?.timezone) || null;
}

/** CFG.deviceMemory: pass legal quantised tiers through, snap illegal ones. */
function injectionDeviceMemory(fp) {
  return normalizeDeviceMemory(fp.deviceMemory);
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

function injectionCanvas(fp) {
  return fp.canvas && { mode: fp.canvas.mode, mark: fp.canvas.mark };
}

function injectionStability(fp) {
  const stability = fp.stability || fp.canvas?.stability || resolveStabilityPolicy();
  const { square, maxWidth, maxHeight } = normalizeStabilitySettings(stability);
  return {
    mode: String(stability.mode || 'auto').toLowerCase(),
    active: Boolean(stability.active),
    square, maxWidth, maxHeight,
    hosts: Array.isArray(stability.hosts) ? stability.hosts.slice(0, 800) : [],
    skipHosts: Array.isArray(stability.skipHosts) ? stability.skipHosts.slice(0, 200) : [],
  };
}

module.exports = {
  injectionOs,
  injectionTimezone,
  injectionDeviceMemory,
  injectionWebgl,
  injectionCanvas,
  injectionStability,
};
