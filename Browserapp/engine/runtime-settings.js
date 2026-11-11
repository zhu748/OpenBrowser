'use strict';

/**
 * runtime-settings mixin for BrowserEngine (prototype-assigned by engine.js).
 * Extracted verbatim from engine.js during the decomposition; see the class
 * body in engine.js for the remaining methods and engine/start.js for the
 * startup routine that drives these.
 */

const cdp = require('../cdp');
const { applyFingerprintToTab, buildFingerprint } = require('../automation/fingerprint');
const { LIVE_PROBE_EXPRESSION, fpLog, summarizeFp, logPath: fingerprintLogPath } = require('../automation/fingerprint-debug-log');
const { sanitizeUrlForLog } = require('../automation/log-sanitizer');
const { compileUrlAccessPolicy } = require('../automation/url-access-policy');
const { runtimePolicyProfile, applyTargetRuntimePolicy, pruneRuntimePolicyPages } = require('./runtime-policy');
const { evaluateFingerprintDelivery } = require('../automation/request-header-rewriter');
const { fingerprintConfigHash, isEphemeralDocumentUrl } = require('./fingerprint-injection');
const { pageFingerprintConnection, pageFingerprintRegistration, closePageFingerprintConnections } = require('./fingerprint-transport');

module.exports = {
  async applyRuntimeSettings(port, profile, fingerprint = null, options = {}) {
    const phase = String(options.phase || 'applyRuntimeSettings');
    const tabs = await cdp.tabs(port);
    if (phase === 'pre-startpage' && !tabs.length) throw new Error('No page target available for fingerprint delivery');
    const network = this.networkInfo.get(profile.id) || {};
    // merge IP-detected geo/tz into profile for fingerprint apply
    const enriched = {
      ...profile,
      exitTimezone: profile.exitTimezone || network.timezone || '',
      exitLatitude: profile.exitLatitude ?? network.latitude,
      exitLongitude: profile.exitLongitude ?? network.longitude,
    };
    const fp = fingerprint || buildFingerprint(enriched);
    const policyProfile = runtimePolicyProfile(profile, this.profiles?.get?.(profile.id));
    // Lazy hash: the watch loop reaches the all-applied early exit below every
    // ~2.4s per profile with no config change; serializing the whole
    // fingerprint object for a SHA-1 each pass is wasted steady-state work.
    let fpHashCached = null;
    const fpHash = () => (fpHashCached ?? (fpHashCached = fingerprintConfigHash(fp)));
    // Track which CDP page targets already received inject (new tabs must not skip FP)
    const applied = options.appliedTargetIds instanceof Set ? options.appliedTargetIds : new Set();
    // Only a recorded hash may invalidate the cache: callers that never tracked one keep the
    // previous behaviour, while a real config change forces every live tab to be re-applied.
    const configChanged = Boolean(options.appliedFingerprintHash)
      && options.appliedFingerprintHash !== fpHash();
    if (configChanged) applied.clear();
    // The browser-level Fetch owner handles access policy and persona headers
    // together. Startup may validate it on blank tabs before that owner exists;
    // all subsequent restricted browsing requires the live owner.
    const requestOwner = options.trackOn?.requestHeaderRewriter;
    if (requestOwner && !requestOwner.destroyed) requestOwner.refreshUrlPolicy(policyProfile);
    else if (compileUrlAccessPolicy(policyProfile).active
      && !(phase === 'pre-startpage' && tabs.every((tab) => isEphemeralDocumentUrl(tab.url)))) {
      throw new Error('网址访问规则拦截尚未就绪，已停止继续浏览');
    }
    const policyOwner = options.trackOn || applied;
    closePageFingerprintConnections(policyOwner, new Set(tabs.map((tab) => tab.id)));
    const sessions = options.trackOn?.fingerprintTargetSessions || new Map();
    const sessionTargets = new Map([...sessions].map(([sessionId, target]) => [target.targetId, { ...target, sessionId }]));
    const policyIds = new Set(tabs.map((tab) => tab.id));
    for (const id of sessionTargets.keys()) policyIds.add(id);
    pruneRuntimePolicyPages(policyOwner, policyIds);
    const policyTargets = new Map(tabs.map((tab) => [tab.id, { targetType: 'page', tab }]));
    for (const [id, target] of sessionTargets) policyTargets.set(id, { targetType: target.type, sessionId: target.sessionId });
    for (const [targetId, target] of policyTargets) {
      try {
        await applyTargetRuntimePolicy({ owner: policyOwner, targetId, profile: policyProfile, targetType: target.targetType,
          registrationOwner: target.sessionId ? options.trackOn.workerFingerprintConnection : pageFingerprintRegistration(policyOwner, target.tab),
          registrationScope: target.sessionId || '',
          invoke: target.sessionId
            ? (method, params) => options.trackOn.workerFingerprintConnection.command(method, params, { sessionId: target.sessionId, timeout: 5000 })
            : async (method, params) => (await pageFingerprintConnection(this, policyOwner, target.tab)).command(method, params),
        });
      } catch (error) {
        if (target.sessionId && !sessions.has(target.sessionId)) continue;
        const current = target.tab ? await cdp.tabs(port).catch(() => null) : null;
        if (current && !current.some((tab) => tab.id === targetId)) continue;
        throw error;
      }
    }

    // Re-injecting a document that already carries this exact config stacks a second layer of
    // noise on the readers, which moves canvas / clientRects while the profile is already in use,
    // so a pass only covers tabs that are unmarked or that carry a different config. Recovery of
    // a single suspect tab goes through applyFingerprintToTab directly instead.
    const force = configChanged;
    // Steady state: the watch loop calls this every ~2.4s per running profile. When every
    // live tab already carries the inject there is nothing to do, and logging begin/skip/end
    // each time would burn disk and append tab URLs to the diagnostic log forever.
    // Prune closed targets, keep the tracked state fresh, and return quietly.
    if (!force && !options.verifyApplied && tabs.every((tab) => applied.has(tab.id))) {
      const liveIds = new Set(tabs.map((tab) => tab.id));
      for (const id of [...applied]) {
        if (!liveIds.has(id)) applied.delete(id);
      }
      if (options.trackOn) {
        options.trackOn.fpAppliedTargets = applied;
        options.trackOn.fpAppliedHash = fpHash();
        options.trackOn.fingerprint = fp;
      }
      return fp;
    }

    await fpLog('inject.begin', {
      phase,
      profileId: profile.id,
      port,
      tabCount: tabs.length,
      tabUrls: tabs.map((t) => ({ id: t.id, url: String(t.url || '').slice(0, 200) })),
      intended: summarizeFp(fp),
      logFile: fingerprintLogPath(),
    });

    for (const tab of tabs) {
      if (!force && !options.verifyApplied && applied.has(tab.id)) {
        await fpLog('inject.skip-tab', { phase, profileId: profile.id, tabId: tab.id, url: tab.url, reason: 'already-applied' });
        continue;
      }
      try {
        const flat = sessionTargets.get(tab.id);
        const connection = flat ? options.trackOn.workerFingerprintConnection
          : await pageFingerprintConnection(this, policyOwner, tab);
        const invoke = (method, params, timeout = 8000) => connection.command(method, params, {
          ...(flat ? { sessionId: flat.sessionId } : {}), timeout,
        });
        const fontBlobBridge = fp?.fontBlobBridge || options?.trackOn?.fontBlobBridge || options?.trackOn?.fingerprint?.fontBlobBridge;
        if (fontBlobBridge?.channelName && tab.webSocketDebuggerUrl) {
          if (options?.trackOn) { options.trackOn.fontBlobBridge = fontBlobBridge; options.trackOn.fingerprint = fp; }
          try {
            await invoke('Runtime.enable', {}).catch(() => {});
            await invoke('Runtime.addBinding', { name: fontBlobBridge.channelName }).catch((err) => {
              const msg = String(err?.message || err);
              if (!/already exists/i.test(msg)) {}
            });
          } catch (_) {}
        }
        if (force || !applied.has(tab.id)) await applyFingerprintToTab(invoke, null, fp, enriched, {
          applyKey: `target:${tab.id}`,
          registrationOwner: connection,
          registrationScope: flat?.sessionId || '',
          livePatchDocument: isEphemeralDocumentUrl(tab.url),
        });
        const probe = await invoke('Runtime.evaluate', {
          expression: LIVE_PROBE_EXPRESSION, returnByValue: true, awaitPromise: true,
        }, 8000);
        const live = probe?.result?.value ?? probe?.value ?? null;
        const exception = probe?.exceptionDetails || probe?.result?.exceptionDetails;
        const verified = evaluateFingerprintDelivery(profile, fp, exception ? { probeError: exception.text || 'Probe script failed' } : live, { strict: true });
        if (!verified.ok) {
          const error = new Error('指纹交付校验失败：' + verified.mismatches.map((m) => m.message).join('; '));
          error.code = 'FINGERPRINT_DELIVERY_FAILED';
          error.mismatches = verified.mismatches;
          throw error;
        }
        await fpLog('inject.tab-ok', {
          phase, profileId: profile.id, tabId: tab.id,
          url: sanitizeUrlForLog(tab.url).slice(0, 240), intended: summarizeFp(fp), live,
        });
        applied.add(tab.id);
      } catch (error) {
        await fpLog('inject.tab-fail', {
          phase,
          profileId: profile.id,
          tabId: tab.id,
          url: sanitizeUrlForLog(tab.url).slice(0, 240),
          error: String(error.message || error),
        });
        applied.delete(tab.id);
        // A closed target is harmless only when a fresh snapshot confirms its removal.
        // Timeouts, script exceptions and missing probes on live tabs remain failures.
        const liveTabs = await cdp.tabs(port).catch(() => null);
        if (liveTabs && !liveTabs.some((entry) => entry.id === tab.id)) continue;
        throw error;
      }
      // Only verified targets enter the applied set.
    }
    // Drop closed targets so Set does not grow forever
    const liveIds = new Set(tabs.map((t) => t.id));
    for (const id of [...applied]) {
      if (!liveIds.has(id)) applied.delete(id);
    }
    if (options.trackOn) {
      options.trackOn.fpAppliedTargets = applied;
      options.trackOn.fpAppliedHash = fpHash();
      options.trackOn.fingerprint = fp;
    }
    await fpLog('inject.end', { phase, profileId: profile.id, applied: applied.size, port });
    return fp;
  },
};
