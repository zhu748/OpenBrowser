'use strict';

const { normalizeCoordinates, normalizeGeolocationAccuracy } = require('../../shared/profile-values');

function requestedPermission(privacy, fallback) {
  if (privacy.geoMode === 'disabled' || privacy.geoPermission === 'deny') return 'denied';
  if (privacy.geoPermission === 'allow') return 'granted';
  if (privacy.geoPermission === 'prompt' || privacy.geoMode === 'prompt') return 'prompt';
  return fallback === 'granted' || fallback === 'denied' ? fallback : 'prompt';
}

function positionFrom(latitude, longitude, accuracy, fallbackAccuracy) {
  const coords = normalizeCoordinates(latitude, longitude);
  return coords.valid ? { latitude: coords.latitude, longitude: coords.longitude,
    accuracy: normalizeGeolocationAccuracy(accuracy, fallbackAccuracy) } : null;
}

function effectivePolicy(permission, position) {
  return {
    permission: permission === 'granted' && !position ? 'denied' : permission,
    position: permission === 'denied' ? null : position,
  };
}

// Chromium can update the location on an existing target without rebuilding
// its document script. Use the current profile for that native-only update.
function resolveProfileGeolocation(profile = {}, fallbackPermission) {
  const privacy = profile.privacy || {};
  const permission = requestedPermission(privacy, fallbackPermission);
  if (permission === 'denied' || privacy.geoMode === 'prompt') return effectivePolicy(permission, null);

  const position = privacy.geoMode === 'custom'
    ? positionFrom(privacy.latitude, privacy.longitude, privacy.accuracy, 100)
    : positionFrom(profile.exitLatitude, profile.exitLongitude, privacy.accuracy, 1000);
  return effectivePolicy(permission, position);
}

// Native launch paths consume the generated snapshot, with a fallback for
// older callers that supply a top-level position or serialized init value.
function resolveFingerprintGeolocation(fingerprint = {}, profile = {}) {
  const privacy = profile.privacy || {};
  const permission = fingerprint.geoPermission === 'denied' ? 'denied' : requestedPermission(privacy, fingerprint.geoPermission);
  if (permission === 'denied' || privacy.geoMode === 'prompt') return effectivePolicy(permission, null);

  const dynamic = fingerprint.dynamicConfig || {};
  const hasPosition = Object.hasOwn(dynamic, 'geoposition') || Object.hasOwn(fingerprint, 'geoposition');
  if (hasPosition) {
    const raw = Object.hasOwn(dynamic, 'geoposition') ? dynamic.geoposition : fingerprint.geoposition;
    return effectivePolicy(permission, positionFrom(raw?.latitude, raw?.longitude, raw?.accuracy));
  }
  if (typeof dynamic.geopositionText === 'string' && dynamic.geopositionText) {
    const parts = dynamic.geopositionText.split(',');
    return effectivePolicy(permission, parts.length === 3 ? positionFrom(...parts) : null);
  }
  return resolveProfileGeolocation(profile, permission);
}

function formatGeopositionValue(geo) {
  const position = positionFrom(geo?.latitude, geo?.longitude, geo?.accuracy);
  return position ? `${position.latitude},${position.longitude},${position.accuracy}` : null;
}

module.exports = { resolveProfileGeolocation, resolveFingerprintGeolocation, formatGeopositionValue };
