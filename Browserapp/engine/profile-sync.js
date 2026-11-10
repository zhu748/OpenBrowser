'use strict';

/** Stage the entire sync before publishing any live profile, assignment or network changes. */
const { proxyHasCredentials, sameProxyEndpoint, sameProxyIdentity } = require('./index');

function prepareProfileSync(engine, values) {
  const profiles = new Map();
  const assignments = new Map();
  const networkInvalidations = new Set();
  // Aligned with LOAD_PROFILE_CAP (engine/init.js): the renderer's first
  // sync sends everything init loaded, so a lower cap here killed UI init
  // for 1001-5000 profile fleets (round-4 PERF-4).
  // Aligned with LOAD_PROFILE_CAP (engine/init.js): the renderer's first
  // sync sends everything init loaded, so a lower cap here killed UI init
  // for 1001-5000 profile fleets (round-4 PERF-4).
  if (!Array.isArray(values) || values.length > 5000) throw new Error('Invalid profile list');
  const globallyEnabled = engine.listExtensions().filter((extension) => extension.enabledAll).map((extension) => extension.id);
  for (const value of values) {
    // Inputs are mutable, and IPC creates fresh objects anyway. Reference
    // equality cannot prove that this profile (or a nested field) is unchanged.
    const sanitized = engine.sanitizeProfile(value);
    const previous = (profiles.get(sanitized.id) || engine.profiles.get(sanitized.id));
    let profile = sanitized;
    if (previous && sanitized.proxyId && previous.proxyId === sanitized.proxyId) {
      const stored = engine.proxyStore?.get?.(sanitized.proxyId);
      const matchesPrevious = sameProxyIdentity(sanitized.proxy, previous.proxy)
        || (!proxyHasCredentials(sanitized.proxy) && sameProxyEndpoint(sanitized.proxy, previous.proxy));
      const matchesStored = Boolean(stored?.raw) && (
        sameProxyIdentity(sanitized.proxy, stored.raw)
        || (!proxyHasCredentials(sanitized.proxy) && sameProxyEndpoint(sanitized.proxy, stored.raw))
      );
      if (!matchesPrevious && !matchesStored) {
        // A linked profile whose endpoint/auth was manually edited becomes a
        // manual proxy. This prevents the old library id from overwriting it.
        profile = engine.sanitizeProfile({
          ...sanitized,
          proxyId: null,
          proxyMeta: { ...(sanitized.proxyMeta || {}), proxyId: null },
        });
      }
    }
    profile = engine.resolveStoredProxyProfile(profile);
    const isNew = !previous;
    // UI may send redacted proxy (no auth) after localStorage reload. Prefer previous
    // authenticated form only when host:port match and incoming lacks credentials.
    let merged = profile;
    if (previous) {
      const nextProxy = String(profile.proxy || '');
      const prevProxy = String(previous.proxy || '');
      const nextHasAuth = proxyHasCredentials(nextProxy);
      const prevHasAuth = proxyHasCredentials(prevProxy);
      const explicitlyCleared = String(value?.proxyAuthAction ?? value?.proxy_auth_action ?? '').toLowerCase() === 'clear';
      if (!explicitlyCleared && !nextHasAuth && prevHasAuth && sameProxyEndpoint(prevProxy, nextProxy)) {
        merged = engine.sanitizeProfile({ ...profile, proxy: prevProxy });
      }
      // Restore cookies/platform secrets only when UI clearly redacted ALL of them
      // (post-localStorage load) while engine still holds values — not when user
      // intentionally cleared a single field in the editor.
      const secretAction = String(value?.secretsAction ?? value?.credentialsAction ?? '').trim().toLowerCase();
      const explicitSecretUpdate = value?.__secretsExplicit === true
        || secretAction === 'replace'
        || secretAction === 'clear';
      const uiLooksRedacted = !explicitSecretUpdate
        && !String(profile.cookies || '').trim()
        && !String(profile.platform?.password || '').trim()
        && !String(profile.platform?.totpSecret || '').trim()
        && (
          String(previous.cookies || '').trim()
          || String(previous.platform?.password || '').trim()
          || String(previous.platform?.totpSecret || '').trim()
        );
      if (uiLooksRedacted) {
        merged = engine.sanitizeProfile({
          ...merged,
          cookies: previous.cookies || '',
          platform: {
            ...(merged.platform || {}),
            password: previous.platform?.password || '',
            totpSecret: previous.platform?.totpSecret || '',
          },
        });
      }
      // Renderer storage intentionally omits runtime exit details. Keep the engine's
      // last successful result unless the proxy itself changed (which invalidates it).
      if (previous.proxy === merged.proxy && previous.exitIp && !profile.exitIp) {
        merged = engine.sanitizeProfile({
          ...merged,
          exitIp: previous.exitIp,
          exitCountryCode: previous.exitCountryCode,
          exitTimezone: previous.exitTimezone,
          exitLatitude: previous.exitLatitude,
          exitLongitude: previous.exitLongitude,
          exitCheckedAt: previous.exitCheckedAt,
          exitLatencyMs: previous.exitLatencyMs,
          exitNetworkType: previous.exitNetworkType,
        });
      }
    }
    if (previous && previous.proxy !== merged.proxy) networkInvalidations.add(profile.id);
    profiles.set(merged.id, merged);
    const hasSavedAssignment = (assignments.has(merged.id) || engine.assignments.has(merged.id));
    if (isNew || !hasSavedAssignment) {
      const assigned = new Set(assignments.get(merged.id) || engine.assignments.get(merged.id));
      for (const extensionId of globallyEnabled) assigned.add(extensionId);
      // The bundled marker is part of the environment contract.
      for (const [extensionId, extension] of engine.extensions) {
        if (extension.builtIn) assigned.add(extensionId);
      }
      assignments.set(merged.id, assigned);
    }
  }
  return { profiles, assignments, networkInvalidations };
}

module.exports = { prepareProfileSync };
