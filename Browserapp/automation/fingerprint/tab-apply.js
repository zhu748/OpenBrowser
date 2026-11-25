'use strict';

/**
 * Per-target inject application: tracks what each CDP target already
 * carries so re-injects are true no-ops, and drives addScriptToEvaluateOnNewDocument.
 * Extracted verbatim from the former automation/fingerprint.js.
 */

const { buildUaProfile, cdpUserAgentOverride, buildAcceptLanguageHeader, formatAcceptLanguage } = require('./shared');
const { buildInjectionScript, injectSourceKeyCached, injectionCacheKeyFor } = require('./injection-script');
const { resolveProfileGeolocation } = require('./geolocation-policy');
const { resolveProfileTimezone } = require('../locale-from-country');
const { assertFingerprintConsistency } = require('./persona');

// Registrations belong to a CDP connection/session, not just a target ID.
// Weak owners are released with the connection; live targets are never evicted.
const OWNER_INJECT_STATE = new WeakMap();

function targetKey(webSocketDebuggerUrl, options) {
  if (typeof options.applyKey === 'string' && options.applyKey) return options.applyKey;
  if (typeof webSocketDebuggerUrl !== 'string' || !webSocketDebuggerUrl) return '';
  const id = webSocketDebuggerUrl.match(/\/devtools\/(?:page|browser)\/([^/?#]+)/)?.[1];
  return id ? `target:${id}` : webSocketDebuggerUrl;
}

function closedTargetError() {
  return Object.assign(new Error('Fingerprint target session was closed'), { code: 'FINGERPRINT_TARGET_CLOSED' });
}

function forgetFingerprintOwner(owner) {
  const states = owner && OWNER_INJECT_STATE.get(owner);
  if (!states) return;
  for (const state of states.values()) state.closed = true;
  OWNER_INJECT_STATE.delete(owner);
}

function forgetFingerprintTarget(owner, key, scope) {
  const states = owner && OWNER_INJECT_STATE.get(owner);
  if (!states) return;
  for (const [id, state] of states) {
    if (state.targetKey !== key || (scope !== undefined && state.scope !== scope)) continue;
    state.closed = true;
    states.delete(id);
  }
}

async function applyFingerprintToTab(cdpCall, webSocketDebuggerUrl, fp, profile = {}, options = {}) {
  assertFingerprintConsistency(fp);
  if (typeof cdpCall !== 'function') throw new Error('CDP call function required');
  const owner = options.registrationOwner || cdpCall;
  const key = targetKey(webSocketDebuggerUrl, options);
  if (!key) return applyToTarget(cdpCall, webSocketDebuggerUrl, fp, profile, options, { applied: null, closed: false });
  if ((typeof owner !== 'object' || owner === null) && typeof owner !== 'function') throw new Error('Invalid fingerprint registration owner');
  let states = OWNER_INJECT_STATE.get(owner);
  if (!states) { states = new Map(); OWNER_INJECT_STATE.set(owner, states); }
  const scope = String(options.registrationScope || '');
  const stateKey = JSON.stringify([scope, key]);
  let state = states.get(stateKey);
  if (!state) {
    state = { targetKey: key, scope, applied: null, tail: Promise.resolve(), closed: false };
    states.set(stateKey, state);
  }
  // Serialize all configurations for one session. Concurrent identical applies
  // reuse the first registration; a rejection cannot poison later retries.
  const operation = state.tail.then(() => {
    if (state.closed) throw closedTargetError();
    return applyToTarget(cdpCall, webSocketDebuggerUrl, fp, profile, options, state);
  });
  state.tail = operation.catch(() => {});
  return operation;
}

async function applyToTarget(cdpCall, webSocketDebuggerUrl, fp, profile, options, state) {
  assertFingerprintConsistency(fp);
  if (state.registrationError) throw state.registrationError;
  const timezone = Object.hasOwn(fp, 'timezone') ? (fp.timezone || '') : resolveProfileTimezone(profile);
  const { position, permission } = resolveProfileGeolocation(profile, fp.geoPermission);

  // cdpCall may be:
  //  1) (wsUrl, method, params) — classic page WebSocket path
  //  2) (method, params) — flattened session path (sessionId bound by caller)
  const invoke = async (method, params = {}) => {
    if (state.closed) throw closedTargetError();
    if (webSocketDebuggerUrl == null) return cdpCall(method, params);
    return cdpCall(webSocketDebuggerUrl, method, params);
  };

  // The evaluated copy for an ephemeral document drops the font payload (see
  // buildInjectionScript livePatch). It is built BEFORE the full source so the
  // fp.fontBlobBridge side effect ends up matching the full script's laziness
  // policy — the binding registration the engine makes from that value must
  // agree with the document-start script that actually runs on later navigations.
  const livePatchSource = options.livePatchDocument === true
    ? buildInjectionScript(fp, { livePatch: true })
    : null;
  const source = buildInjectionScript(fp);
  const fpKey = injectSourceKeyCached(injectionCacheKeyFor(fp), source);
  // CDP overrides also depend on profile-only fields absent from the JS
  // payload, notably custom coordinates and whether the real timezone wins.
  const roleKey = JSON.stringify([Boolean(options.isSubframe), options.targetType || '']);
  const nativeKey = JSON.stringify([timezone, position, permission, roleKey]);
  const native = state.native || (state.native = {});
  const forceInject = options.force === true;
  const injectState = state.applied;
  const sameConfig = Boolean(injectState && injectState.fpKey === fpKey);
  const alreadyPatched = Boolean(sameConfig && injectState.nativeKey === nativeKey && injectState.documentStartOk && injectState.evaluated);
  const refreshDocument = !sameConfig || !injectState.documentStartOk || !injectState.evaluated
    || injectState.roleKey !== roleKey || forceInject;
  const refreshNative = refreshDocument || state.nativeRefreshPending === true;
  const refreshDynamic = refreshNative || state.nativeChangePending === true;
  // Nothing left to do for this target: the live document already carries this exact config and the
  // document-start registration covers every later navigation.
  if (alreadyPatched && !refreshDynamic) return { documentStartOk: true, evaluated: true };

  // Native commands can take effect before a later command fails. Track which
  // settings need another pass independently of the document registration.
  state.nativeChangePending = true;
  state.nativeRefreshPending = refreshNative;

  // Page domain must be enabled or addScriptToEvaluateOnNewDocument is a no-op on some hosts.
  if (refreshDocument) {
    await invoke('Page.enable', {}).catch(() => {});
    await invoke('Runtime.enable', {}).catch(() => {});
  }

  // Soft overrides: CDP rejects a second setLocale/setTimezone with
  // "Another locale override is already in effect" — must not abort the whole inject.
  const softOverride = async (method, params) => {
    try {
      await invoke(method, params);
    } catch (error) {
      const msg = String(error && error.message || error || '');
      if (/already in effect|cannot be overridden|not available|Command can only be executed on top-level targets|Cannot find default execution context/i.test(msg)) return;
      throw error;
    }
  };

  // Media features at the COMPOSITOR level: Emulation.setEmulatedMedia makes the
  // color-scheme and prefers-* answers agree for CSS `@media` blocks and
  // :root color-scheme rendering, complementing the document-side matchMedia
  // rewrite (which covers JS MediaQueryList reads). Cheap and per-tab.
  if (refreshNative && fp.mediaPreferences) {
    const prefs = fp.mediaPreferences;
    await softOverride('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: String(prefs.colorScheme || 'light') },
        { name: 'prefers-reduced-motion', value: String(prefs.reducedMotion || 'no-preference') },
        { name: 'prefers-contrast', value: String(prefs.contrast || 'no-preference') },
        { name: 'forced-colors', value: String(prefs.forcedColors || 'none') },
      ],
    });
  }
  // Network/Emulation.setUserAgentOverride + UserAgentMetadata (Client Hints)
  if (refreshNative && (fp.userAgent || fp.uaProfile)) {
    const isIos = Boolean((fp.mobileDevice && fp.mobileDevice.os === 'ios') || fp.uaProfile?.os === 'ios' || (fp.platform && /iphone|ipad|ipod/i.test(fp.platform)));
    const uaProfile = fp.uaProfile || buildUaProfile({
      userAgent: fp.userAgent,
      platform: fp.platform,
    });
    const acceptLanguage = fp.acceptLanguage || buildAcceptLanguageHeader(fp.languages || ['en-US', 'en']);
    const override = cdpUserAgentOverride(uaProfile, acceptLanguage);
    if (isIos) {
      override.userAgentMetadata = undefined;
    }
    // Emulation affects navigator + most page JS
    await softOverride('Emulation.setUserAgentOverride', override);
    // Network affects HTTP headers (User-Agent + sec-ch-ua*)
    await softOverride('Network.enable', {});
    await softOverride('Network.setUserAgentOverride', {
      userAgent: override.userAgent,
      acceptLanguage: override.acceptLanguage || formatAcceptLanguage(acceptLanguage),
      platform: override.platform,
      userAgentMetadata: isIos ? undefined : override.userAgentMetadata,
    });
  }
  // Zero desktop layout dimensions retain Chromium's live viewport while
  // synchronizing CSS resolution/screen queries with the declared identity.
  // A phone profile is the exception: there the layout viewport IS the device panel, and pinning
  // it is what makes innerWidth, screen.*, the pixel ratio and pointer type agree inside a
  // desktop window. Emulated touch goes with it, or a phone that cannot answer touch probes is
  // immediately suspicious.
  if (refreshNative && fp.mobile && fp.screen && !options.isSubframe && options.targetType !== 'iframe') {
    const viewport = fp.mobileDevice?.viewport || {};
    const mobileWidth = Math.round(Number(viewport.width) || Number(fp.screen.width) || 360);
    const mobileHeight = Math.round(Number(viewport.height) || Number(fp.screen.height) || 640);
    await invoke('Emulation.setDeviceMetricsOverride', {
      width: mobileWidth,
      height: mobileHeight,
      deviceScaleFactor: Number(fp.screen.devicePixelRatio) || 3,
      mobile: true,
      screenWidth: Math.round(Number(fp.screen.width) || mobileWidth),
      screenHeight: Math.round(Number(fp.screen.height) || mobileHeight),
      screenOrientation: { type: 'portraitPrimary', angle: 0 },
      positionX: 0,
      positionY: 0,
    });
    native.touch = true;
    await invoke('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: Number(fp.maxTouchPoints) || 5,
    });
  } else if (refreshNative && fp.screen && !options.isSubframe && options.targetType !== 'iframe') {
    // DPR=1 is an override too: clearing metrics would restore a 1.5x/2x host.
    // This command is required; failure must prevent publishing the target.
    await invoke('Emulation.setDeviceMetricsOverride', {
      width: 0,
      height: 0,
      deviceScaleFactor: Number(fp.screen.devicePixelRatio) || 1,
      mobile: false,
      screenWidth: Math.round(Number(fp.screen.width)),
      screenHeight: Math.round(Number(fp.screen.height)),
    });
    if (native.touch) {
      await invoke('Emulation.setTouchEmulationEnabled', { enabled: false });
      native.touch = false;
    }
  }
  if ((timezone || native.timezone) && (refreshDynamic || timezone !== native.timezone)) {
    // A timeout can follow a successful remote set. Keep enough state to
    // remove a possibly installed override even if the command rejects.
    if (timezone) native.timezone = timezone;
    await softOverride('Emulation.setTimezoneOverride', { timezoneId: timezone });
    native.timezone = timezone;
  }
  const syncGeoPermission = async () => {
    if (permission === 'prompt' && !native.permissionOverride) return;
    if (!refreshDynamic && permission === native.permission) return;
    native.permissionOverride = true;
    await invoke('Browser.setPermission', {
      permission: { name: 'geolocation' },
      setting: permission,
    });
    native.permission = permission;
  };
  // Revoke permission before removing emulated coordinates, and install the
  // replacement coordinates before granting access.
  if (permission !== 'granted') await syncGeoPermission();
  if (position) {
    const positionKey = JSON.stringify(position);
    if (refreshDynamic || native.geolocation !== positionKey) {
      native.geolocation = positionKey;
      await invoke('Emulation.setGeolocationOverride', position);
    }
  } else if (native.geolocation) {
    await invoke('Emulation.clearGeolocationOverride', {});
    native.geolocation = null;
  }
  if (permission === 'granted') await syncGeoPermission();
  if (refreshNative && fp.languages?.[0]) {
    await softOverride('Emulation.setLocaleOverride', { locale: fp.languages[0] });
  }

  // Register for future documents first (start page navigation depends on this).
  // Must not silently drop registration failures — otherwise navigation paints host FP.
  let documentStartOk = Boolean(sameConfig && injectState.documentStartOk);
  let scriptIdentifier = injectState && injectState.identifier ? injectState.identifier : null;
  if (!documentStartOk) {
    if (scriptIdentifier) {
      // The config changed under a live registration: drop the stale script so the next navigation
      // cannot run both the previous and the current inject back to back.
      state.applied = { ...injectState, documentStartOk: false, evaluated: false };
      try {
        await invoke('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptIdentifier });
      } catch (error) {
        if (!/script not found/i.test(String(error?.message || error))) throw error;
      }
      scriptIdentifier = null;
      state.applied = null;
    }
    let registrationError;
    const register = 'Page.addScriptToEvaluateOnNewDocument';
    const unconfirmedRegistration = (cause) => {
      const error = new Error('Document-start registration could not be confirmed; a fresh target is required', { cause });
      error.code = 'FINGERPRINT_REGISTRATION_UNCONFIRMED';
      state.registrationError = error;
      return error;
    };
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let added;
      try {
        added = await invoke(register, { source });
      } catch (error) {
        // Chromium may have installed the script already. Its unknown ID
        // cannot be removed or safely replaced on this target.
        if (error?.message === 'CDP timeout: ' + register) throw unconfirmedRegistration(error);
        registrationError = error;
        if (attempt === 0) await invoke('Page.enable', {});
        continue;
      }
      scriptIdentifier = added?.identifier || added?.result?.identifier || null;
      if (!scriptIdentifier) throw unconfirmedRegistration();
      documentStartOk = true;
      registrationError = null;
      break;
    }
    if (registrationError) throw registrationError;
  }
  if (state.closed) throw closedTargetError();
  state.applied = { fpKey, nativeKey, roleKey, identifier: scriptIdentifier, documentStartOk, evaluated: false };
  let evaluatedOk = Boolean(sameConfig && injectState.evaluated);
  if (!options.skipEvaluate && !options.isWaiting && (!evaluatedOk || forceInject)) {
    const evaluated = await invoke('Runtime.evaluate', {
      expression: livePatchSource || source,
      returnByValue: false,
      awaitPromise: false,
    });
    const details = evaluated?.exceptionDetails || evaluated?.result?.exceptionDetails;
    if (details) {
      const error = new Error(details.exception?.description || details.text || 'Fingerprint script execution failed');
      error.exceptionDetails = details;
      error.documentStartOk = documentStartOk;
      throw error;
    }
    evaluatedOk = true;
  }
  if (state.closed) throw closedTargetError();
  state.applied = { fpKey, nativeKey, roleKey, identifier: scriptIdentifier, documentStartOk, evaluated: evaluatedOk };
  state.nativeChangePending = false;
  state.nativeRefreshPending = false;
  return { documentStartOk, evaluated: evaluatedOk };
}


module.exports = {
  applyFingerprintToTab,
  forgetFingerprintOwner,
  forgetFingerprintTarget,
};
