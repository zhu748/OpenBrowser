'use strict';

// External API aliases and field adaptation; no transport or engine state.
const { normalizeCoordinates, resolveDoNotTrackMode, toFiniteNumber } = require('../../shared/profile-values');

const FINGERPRINT_OBJECT_FIELDS = ['clientHints', 'network', 'battery', 'webgpu', 'mediaLabels', 'canvas', 'webgl', 'audio'];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function mergeFingerprintOverrides(previous, patch) {
  const merged = { ...previous, ...patch };
  for (const key of FINGERPRINT_OBJECT_FIELDS) {
    if (isObject(previous?.[key]) && isObject(patch?.[key])) merged[key] = { ...previous[key], ...patch[key] };
  }
  return merged;
}

function booleanValue(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'off', 'no', 'disabled'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'yes', 'enabled'].includes(normalized)) return true;
  return Boolean(value);
}

function firstDefined(input, keys, fallback = undefined) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(input || {}, key) && input[key] !== undefined) return input[key];
  }
  return fallback;
}

function firstArray(input, keys) {
  for (const key of keys) {
    if (Array.isArray(input?.[key])) return input[key];
  }
  return null;
}

function firstString(input, keys, fallback = '') {
  const value = firstDefined(input, keys, fallback);
  return value == null ? String(fallback) : String(value);
}

function parseResolution(value) {
  if (value && typeof value === 'object') {
    return [Number(value.width), Number(value.height)];
  }
  const text = String(value || '').trim();
  const match = text.match(/(\d+)\s*[x×*]\s*(\d+)/i) || text.match(/^(\d+)[,\s]+(\d+)$/);
  if (!match) return [NaN, NaN];
  return [Number(match[1]), Number(match[2])];
}

function parseGeolocation(value) {
  let latitude;
  let longitude;
  if (value && typeof value === 'object') {
    latitude = value.latitude ?? value.lat;
    longitude = value.longitude ?? value.lon ?? value.lng;
  } else {
    const parts = String(value ?? '').trim().split(/[,;:\s]+/);
    if (parts.length !== 2) return [null, null];
    [latitude, longitude] = parts;
  }
  const location = normalizeCoordinates(latitude, longitude);
  return [location.latitude, location.longitude];
}

function normalizeProfileInput(input = {}) {
  const out = { ...input };
  const extra = out.privacy_extra ?? out.privacyExtra;
  const privacy = { ...(isObject(out.privacy) ? out.privacy : {}), ...(isObject(extra) ? extra : {}) };
  let fingerprint = isObject(out.fingerprint)
    ? { ...out.fingerprint }
    : (isObject(privacy.fingerprint) ? { ...privacy.fingerprint } : null);
  const clearFingerprint = Boolean(out.__clearFingerprint) || out.fingerprint === null
    || out.privacy?.fingerprint === null || privacy.fingerprint === null;

  if (out.profile_id === undefined && out.profileId !== undefined) out.profile_id = out.profileId;
  if (out.user_id === undefined && out.userId !== undefined) out.user_id = out.userId;
  if (out.start_url !== undefined) out.startUrl = out.start_url;
  if (out.user_agent !== undefined) out.userAgent = out.user_agent;
  if (out.fingerprint_version !== undefined) out.fingerprintVersion = out.fingerprint_version;
  if (out.network_mode !== undefined) out.networkMode = out.network_mode;
  if (out.language_code !== undefined) out.languageCode = out.language_code;
  if (out.user_proxy_config === undefined && out.userProxyConfig !== undefined) out.user_proxy_config = out.userProxyConfig;
  if (out.privacy_extra === undefined && out.privacyExtra !== undefined) out.privacy_extra = out.privacyExtra;
  if (typeof out.platform === 'string') out.platform = { type: out.platform };

  const sizeValue = out.resolution ?? out.window_size ?? out.windowSize;
  if (sizeValue !== undefined) {
    const [width, height] = parseResolution(sizeValue);
    if (Number.isFinite(width)) out.width = width;
    if (Number.isFinite(height)) out.height = height;
  }
  if (out.notes !== undefined) out.note = out.notes;

  if (out.timezone !== undefined && String(out.timezone).trim()) {
    privacy.timezone = String(out.timezone).trim();
    privacy.timezoneMode = 'custom';
  }
  if (out.locale !== undefined && String(out.locale).trim()) {
    privacy.uiLanguage = String(out.locale).trim();
    privacy.languageMode = String(out.locale).trim();
  }
  if (out.geolocation !== undefined) {
    const [lat, lon] = parseGeolocation(out.geolocation);
    if (lat === null || lon === null) {
      throw Object.assign(new Error('invalid geolocation coordinates'), { statusCode: 400 });
    }
    privacy.latitude = lat;
    privacy.longitude = lon;
    privacy.geoMode = 'custom';
  }
  const webglVendor = firstDefined(out, ['webgl_vendor', 'webglVendor']);
  if (webglVendor !== undefined && String(webglVendor).trim()) {
    fingerprint = fingerprint || {};
    fingerprint.webglVendor = String(webglVendor).trim();
    privacy.webglMeta = 'custom';
  }
  const webglRenderer = firstDefined(out, ['webgl_renderer', 'webglRenderer']);
  if (webglRenderer !== undefined && String(webglRenderer).trim()) {
    fingerprint = fingerprint || {};
    fingerprint.webglRenderer = String(webglRenderer).trim();
    privacy.webglMeta = 'custom';
  }
  const hardwareConcurrency = firstDefined(out, ['hardware_concurrency', 'hardwareConcurrency']);
  const cores = toFiniteNumber(hardwareConcurrency);
  if (cores !== null) {
    fingerprint = fingerprint || {};
    privacy.cores = cores;
    fingerprint.hardwareConcurrency = cores;
  }
  const deviceMemory = firstDefined(out, ['device_memory', 'deviceMemory']);
  const memory = toFiniteNumber(deviceMemory);
  if (memory !== null) {
    fingerprint = fingerprint || {};
    privacy.memory = memory;
    fingerprint.deviceMemory = memory;
  }
  const doNotTrack = firstDefined(out, ['do_not_track', 'doNotTrack']);
  if (doNotTrack !== undefined) {
    const enabled = resolveDoNotTrackMode({ dnt: doNotTrack }) === 'on';
    privacy.dnt = enabled;
    privacy.dntMode = enabled ? 'on' : 'off';
  }

  if (!clearFingerprint && fingerprint) {
    out.fingerprint = fingerprint;
    privacy.fingerprint = fingerprint;
  } else {
    delete out.fingerprint;
    delete privacy.fingerprint;
  }
  out.privacy = privacy;
  out.__clearFingerprint = clearFingerprint;
  return out;
}

function normalizeProxyInput(input = {}) {
  const out = { ...input };
  if (out.refreshUrl === undefined && out.refresh_url !== undefined) out.refreshUrl = out.refresh_url;
  if (out.ipChannel === undefined && out.ip_channel !== undefined) out.ipChannel = out.ip_channel;
  if (out.proxyAuthAction === undefined && out.proxy_auth_action !== undefined) out.proxyAuthAction = out.proxy_auth_action;
  return out;
}

function normalizeRpaInput(input = {}) {
  const out = { ...input };
  const aliases = [
    ['profile_id', 'profileId'], ['user_id', 'userId'],
    ['profile_ids', 'profileIds'], ['user_ids', 'userIds'],
    ['plan_id', 'planId'], ['task_id', 'taskId'], ['template_id', 'templateId'],
    ['process_name', 'processName'], ['plan_name', 'planName'], ['save_as', 'saveAs'],
  ];
  for (const [snakeCase, camelCase] of aliases) {
    if (out[snakeCase] === undefined && out[camelCase] !== undefined) out[snakeCase] = out[camelCase];
  }
  return out;
}

function readProxyAssociation(input = {}) {
  const source = input && typeof input.profile === 'object' ? { ...input, ...input.profile } : input;
  const keys = ['proxy_id', 'proxy_library_id', 'proxyId', 'proxyLibraryId'];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source || {}, key)) {
      return { present: true, value: source[key] == null ? '' : String(source[key]).trim() };
    }
  }
  const hasExplicitManualProxy = ['proxy', 'user_proxy_config', 'userProxyConfig', 'network_mode', 'networkMode']
    .some((key) => Object.prototype.hasOwnProperty.call(source || {}, key));
  if (!hasExplicitManualProxy && source?.proxyMeta && typeof source.proxyMeta === 'object') {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source.proxyMeta, key)) {
        const value = source.proxyMeta[key];
        return { present: true, value: value == null ? '' : String(value).trim() };
      }
    }
  }
  return { present: false, value: '' };
}

module.exports = { booleanValue, firstDefined, firstArray, firstString, mergeFingerprintOverrides, normalizeProfileInput, normalizeProxyInput, normalizeRpaInput, readProxyAssociation };
