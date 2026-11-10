'use strict';

/**
 * Per-target inject application: tracks what each CDP target already
 * carries so re-injects are true no-ops, and drives addScriptToEvaluateOnNewDocument.
 * Extracted verbatim from the former automation/fingerprint.js.
 */

const { buildUaProfile, cdpUserAgentOverride, buildAcceptLanguageHeader, formatAcceptLanguage } = require('./shared');
const { buildInjectionScript, injectSourceKeyCached, injectionCacheKeyFor } = require('./injection-script');

// Bookkeeping for the per-target inject. The runtime drives the same document-start script from
// several places (pre-start, post-start, watch sweeps, reload recovery, worker attach). Registering
// one identical source twice makes Chromium run it twice on every later navigation, and evaluating
// it twice on a live document stacks a second layer of noise on the readers, which shifts canvas /
// clientRects while the profile is already in use. Tracking what each target already carries keeps
// the later passes true no-ops without leaving anything the page itself could detect.
const TARGET_INJECT_STATE = new Map();
const MAX_TRACKED_TARGETS = 256;

async function applyFingerprintToTab(cdpCall, webSocketDebuggerUrl, fp, profile = {}, options = {}) {
  const privacy = profile.privacy || {};
  const timezone = privacy.timezoneMode === 'real'
    ? ''
    : String(privacy.timezone || profile.timezone || profile.exitTimezone || fp.timezone || '').trim();
  // geoMode: custom coords | disabled/prompt (no override) | ip/allow (from exit IP)
  let latitude = null;
  let longitude = null;
  if (privacy.geoMode === 'custom') {
    latitude = Number(privacy.latitude);
    longitude = Number(privacy.longitude);
  } else if (privacy.geoMode === 'disabled' || privacy.geoMode === 'prompt') {
    latitude = null;
    longitude = null;
  } else {
    latitude = Number(profile.exitLatitude);
    longitude = Number(profile.exitLongitude);
  }

  // cdpCall may be:
  //  1) (wsUrl, method, params) — classic page WebSocket path
  //  2) (method, params) — flattened session path (sessionId bound by caller)
  const invoke = async (method, params = {}) => {
    if (typeof cdpCall !== 'function') throw new Error('CDP call function required');
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
  // One key space, keyed by the CDP target id. Callers that attach a target through
  // a flat session (engine/fingerprint-injection.js) register as `target:<id>` while
  // the ws-URL path below derives the SAME id from /devtools/(page|browser)/<id> —
  // otherwise the alreadyPatched short-circuit cannot see what the other caller
  // recorded for the same physical tab and Page.addScriptToEvaluateOnNewDocument
  // ends up registered twice.
  const wsTargetId = typeof webSocketDebuggerUrl === 'string' && webSocketDebuggerUrl
    ? (webSocketDebuggerUrl.match(/\/devtools\/(?:page|browser)\/([0-9A-Fa-f-]+)/) || [])[1]
    : null;
  const injectTargetKey = typeof options.applyKey === 'string' && options.applyKey
    ? options.applyKey
    : (wsTargetId ? `target:${wsTargetId}` : (typeof webSocketDebuggerUrl === 'string' && webSocketDebuggerUrl ? webSocketDebuggerUrl : ''));
  const forceInject = options.force === true;
  const injectState = injectTargetKey ? TARGET_INJECT_STATE.get(injectTargetKey) : null;
  const sameConfig = Boolean(injectState && injectState.fpKey === fpKey);
  const alreadyPatched = Boolean(sameConfig && injectState.documentStartOk && injectState.evaluated);
  // Nothing left to do for this target: the live document already carries this exact config and the
  // document-start registration covers every later navigation.
  if (alreadyPatched && !forceInject) return;

  // Page domain must be enabled or addScriptToEvaluateOnNewDocument is a no-op on some hosts.
  await invoke('Page.enable', {}).catch(() => {});
  await invoke('Runtime.enable', {}).catch(() => {});

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

  // Network/Emulation.setUserAgentOverride + UserAgentMetadata (Client Hints)
  if (fp.userAgent || fp.uaProfile) {
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
  // Desktop windows must retain Chromium's live viewport. A fixed device-metrics
  // override leaves the renderer at the fingerprint's initial size after resize,
  // producing a large blank region. screen.* remains spoofed by the document script.
  // A phone profile is the exception: there the layout viewport IS the device panel, and pinning
  // it is what makes innerWidth, screen.*, the pixel ratio and pointer type agree inside a
  // desktop window. Emulated touch goes with it, or a phone that cannot answer touch probes is
  // immediately suspicious.
  if (fp.mobile && fp.screen) {
    const viewport = fp.mobileDevice?.viewport || {};
    const mobileWidth = Math.round(Number(viewport.width) || Number(fp.screen.width) || 360);
    const mobileHeight = Math.round(Number(viewport.height) || Number(fp.screen.height) || 640);
    await softOverride('Emulation.setDeviceMetricsOverride', {
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
    await softOverride('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: Number(fp.maxTouchPoints) || 5,
    });
  } else if (fp.screen && !options.isSubframe && options.targetType !== 'iframe') {
    await softOverride('Emulation.clearDeviceMetricsOverride', {});
  }
  if (timezone) {
    await softOverride('Emulation.setTimezoneOverride', { timezoneId: timezone });
  }
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    await softOverride('Emulation.setGeolocationOverride', {
      latitude,
      longitude,
      accuracy: privacy.accuracy || 100,
    });
  }
  // Roxy geoLocation mode: 'allow' auto-grants the permission (coordinates above provide the
  // position), 'deny' blocks it at the browser level so no native prompt can leak host coords.
  // The injection script mirrors both for hosts where this command is unavailable.
  if (privacy.geoPermission === 'allow' || privacy.geoPermission === 'deny') {
    await softOverride('Browser.enable', {});
    await softOverride('Browser.setPermission', {
      permission: { name: 'geolocation' },
      setting: privacy.geoPermission === 'allow' ? 'granted' : 'denied',
    });
  }
  if (fp.languages?.[0]) {
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
      await invoke('Page.removeScriptToEvaluateOnNewDocument', { identifier: scriptIdentifier }).catch(() => {});
      scriptIdentifier = null;
    }
    try {
      const added = await invoke('Page.addScriptToEvaluateOnNewDocument', { source });
      scriptIdentifier = added?.identifier || added?.result?.identifier || scriptIdentifier;
      documentStartOk = true;
    } catch (error) {
      const msg = String(error && error.message || error || '');
      if (!/already|duplicate|exists/i.test(msg)) {
        // Retry once after re-enabling Page domain.
        await invoke('Page.enable', {}).catch(() => {});
        try {
          const added = await invoke('Page.addScriptToEvaluateOnNewDocument', { source });
          scriptIdentifier = added?.identifier || added?.result?.identifier || scriptIdentifier;
          documentStartOk = true;
        } catch (retryError) {
          const retryMsg = String(retryError && retryError.message || retryError || '');
          if (!/already|duplicate|exists/i.test(retryMsg)) {
            // Soft: still try Runtime.evaluate on current document.
            documentStartOk = false;
          } else {
            documentStartOk = true;
          }
        }
      } else {
        documentStartOk = true;
      }
    }
  }
  // Already-open documents: best-effort patch. Never abort startup if evaluate throws
  // (Chromium often reports "Uncaught" for redefine races; document-start still applies on next nav).
  let evaluatedOk = false;
  if (!options.skipEvaluate && !options.isWaiting) {
    try {
      const evaluated = await invoke('Runtime.evaluate', {
      expression: livePatchSource || source,
      returnByValue: false,
      awaitPromise: false,
    });
    const exceptionDetails = evaluated && (evaluated.exceptionDetails || evaluated.result?.exceptionDetails);
    if (exceptionDetails) {
      // leave a soft signal for callers that inspect return value; do not throw
      const text = exceptionDetails.text
        || exceptionDetails.exception?.description
        || 'Uncaught';
      const err = new Error(text);
      err.softInject = true;
      err.exceptionDetails = exceptionDetails;
      err.documentStartOk = documentStartOk;
      // Soft path: swallow so keepDefaultTab can still open the welcome page.
    } else {
      evaluatedOk = true;
    }
  } catch (error) {
    const msg = String(error && error.message || error || '');
    if (!/Uncaught|already in effect|cannot be overridden|Cannot find default execution context|Command can only be executed on top-level targets/i.test(msg)) {
      // unexpected CDP transport errors still surface
      throw error;
    }
  }
  }
  if (injectTargetKey) {
    TARGET_INJECT_STATE.set(injectTargetKey, { fpKey, identifier: scriptIdentifier, documentStartOk, evaluated: evaluatedOk });
    if (TARGET_INJECT_STATE.size > MAX_TRACKED_TARGETS) {
      // Bounded: keep the most recent targets so a long-running host cannot grow this forever.
      const oldest = TARGET_INJECT_STATE.keys().next().value;
      TARGET_INJECT_STATE.delete(oldest);
    }
  }
}


module.exports = {
  applyFingerprintToTab,
};
