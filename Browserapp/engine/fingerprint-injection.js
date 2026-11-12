'use strict';

/**
 * Fingerprint injection mixin for BrowserEngine (prototype-assigned by
 * engine.js): service-worker/worker-realm injection, per-session page attach
 * injection (before target resume), startup delivery verification, start-page
 * fingerprint verification, and network-driven fingerprint patches. The two helpers
 * shared with engine.js's applyRuntimeSettings — fingerprintConfigHash and
 * isEphemeralDocumentUrl — are re-exported here and imported back by engine.js.
 */

const cdp = require('../cdp');
const { createCssFontResponseRewriter } = require('../automation/css-font-response-rewrite');
const { applyFingerprintToTab, buildFingerprint, buildWorkerInjectionScript, forgetFingerprintOwner, forgetFingerprintTarget } = require('../automation/fingerprint');
const { LIVE_PROBE_EXPRESSION, fpLog } = require('../automation/fingerprint-debug-log');
const { deriveFontPlaceholder } = require('../automation/font-placeholder');
const { fingerprintForNativeKernelInject } = require('../automation/kernel-init-sync');
const { resolveProfileLanguage, resolveProfileTimezone } = require('../automation/locale-from-country');
const { runtimePolicyProfile, applyTargetRuntimePolicy, forgetTargetRuntimePolicy } = require('./runtime-policy');
const { getPlatformFontPayload } = require('../automation/query-local-font-blob-gate');
const { RequestHeaderRewriter, evaluateFingerprintDelivery } = require('../automation/request-header-rewriter');
const { WorkerScriptPrefixer, TRANSIENT_ERRORS: TRANSIENT_PREFIX_ERRORS } = require('../automation/worker-script-prefixer');
const crypto = require('crypto');
const { ServiceWorkerScriptGate } = require('../automation/service-worker-script-gate');
const { closePageFingerprintConnection } = require('./fingerprint-transport');
const { FingerprintSession } = require('./fingerprint-session');
const { applyNetworkConditions } = require('./network-conditions');

// Stable identity of the document-start config. Two inject payloads built from the same
// fingerprint serialise identically, so this is what decides whether a live tab still matches
// what the runtime intends to apply.
const fingerprintConfigHash = (fp) => {
  try {
    return crypto.createHash('sha1').update(JSON.stringify(fp || {})).digest('hex').slice(0, 16);
  } catch (_) {
    return '';
  }
};

/**
 * Documents that will be replaced by a real navigation before any page content runs
 * (the initial about:blank tab at startup). The fingerprint evaluated into them does
 * not need the multi-megabyte font payload: the document-start registration covers
 * every later navigation with the full source.
 */
function isEphemeralDocumentUrl(url) {
  const text = String(url || '').trim().toLowerCase();
  return text === '' || text === 'about:blank';
}

module.exports = {
  async startWorkerFingerprintInjection(item, fingerprint) {
    // Every worker handler captures this connection's own fingerprint. Concurrent
    // profile launches must never share a process-global "latest" identity.
    const source = buildWorkerInjectionScript(fingerprint);
    if (fingerprint?.fontBlobBridge && !item.fontBlobBridge) {
      item.fontBlobBridge = fingerprint.fontBlobBridge;
    }
    // Chromium 143+ gate (see the worker branch in onAttached): worker-session
    // Runtime.evaluate of the real source deadlocks intermittently, so delivery goes
    // through script-response prefixing. Decided here, before any target attaches, so
    // the browser-level Fetch arm below and every page worker branch see the flag.
    const kernelMajor = Number(String(item.kernelVersion || fingerprint?.kernelVersion || '').split('.')[0]) || 0;
    item.workerScriptPrefixDelivery = kernelMajor >= 143;
    const browserWs = await cdp.browserSocket(item.port);
    // Response rewriting runs below the parser, before static HTML/CSS is turned into a
    // stylesheet. It complements the document gate, which only sees dynamic DOM/CSSOM writes.
    const fontResponseRewriter = createCssFontResponseRewriter({
      personaFonts: fingerprint?.fonts?.list || [],
      fingerprint,
      blockedFont: deriveFontPlaceholder(fingerprint),
      logger: (details) => {
        if (details?.type === 'handle-error' || details?.type === 'enable-error' || details?.type === 'fulfill-error') {
          const errMsg = String(details?.error || '');
          if (/Can only get response body|No resource with given identifier/i.test(errMsg)) {
            return;
          }
          console.warn('[OpenBrowser] css font response rewriter error:', details?.error || details);
          item.cssFontResponseRewriteError = String(details.error || 'response rewrite error');
        }
      },
    });
    item.cssFontResponseRewriter = fontResponseRewriter;
    // Chromium 157+ worker delivery: page-level Fetch prefixing of worker scripts.
    // Created up front with the full source; only consulted when the runtime probe
    // marks the browser as requiring prefix delivery (item.workerScriptPrefixDelivery).
    const workerScriptPrefixer = new WorkerScriptPrefixer({
      source,
      logger: (details) => this.emit({ type: details?.type, id: item.profile?.id, url: details?.url }),
    });
    item.workerScriptPrefixer = workerScriptPrefixer;
    const requestHeaderRewriter = new RequestHeaderRewriter({
      profile: item.profile,
      fingerprint,
      getPolicyProfile: () => runtimePolicyProfile(item.profile, this.profiles?.get?.(item.profile.id)),
      isInternalRequest: (url) => Boolean(this.startPageServer?.server && this.startPageServer.isStartPageUrl?.(url)),
      onFatalError: (error) => {
        item.requestHeaderRewriteError = error.message;
        this.emit({ type: 'fingerprint-injection-failed', id: item.profile.id, stage: 'request-headers', message: error.message });
        this.handleBrowserGone(item.profile.id, item, 'request-header-rewrite-failed', {
          expected: false, error: error.message, kill: true, waitForExit: true,
        }).catch((cleanupError) => this.emit({ type: 'sync-error', id: item.profile.id, message: cleanupError.message }));
      },
      logger: (details) => {
        if (details?.type === 'request-rewrite-error') {
          item.requestHeaderRewriteError = details.error;
        }
      },
    });
    item.requestHeaderRewriter = requestHeaderRewriter;
    // One owner for DedicatedWorker, SharedWorker and ServiceWorker delivery.
    const workerTypes = new Set(['worker', 'shared_worker', 'service_worker']);
    const targetSetup = new Map();
    const sessionStates = new Map();
    const internalUrl = /^(chrome|chrome-extension|edge|edge-extension|devtools):/i;
    const report = (error, targetInfo = {}) => {
      item.workerFingerprintError = error.message;
      this.emit({
        type: 'worker-fingerprint-injection-failed',
        id: item.profile.id,
        targetType: targetInfo.type || '',
        message: error.message,
      });
      this.emit({
        type: 'fingerprint-injection-failed',
        id: item.profile?.id,
        targetType: targetInfo.type || '',
        stage: 'worker-inject',
        operation: 'worker-inject',
        message: error.message,
      });
    };

    // Tracking for initial pre-existing target attach and fetch enablement barrier
    const workerSessionToTargetId = new Map();
    const policySessions = new Map();
    item.fingerprintTargetSessions = policySessions;
    const pendingInitialTargets = new Set();
    const completedInitialTargets = new Set();
    let barrierResolve;
    let barrierReject;
    let barrierSettled = false;
    let barrierTimer = null;

    const barrierPromise = new Promise((resolve, reject) => {
      barrierResolve = resolve;
      barrierReject = reject;
    });

    barrierPromise.catch(() => {}); // observed again by the startup await below

    const settleBarrier = (err) => {
      if (barrierSettled) return;
      barrierSettled = true;
      if (barrierTimer) {
        clearTimeout(barrierTimer);
        barrierTimer = null;
      }
      if (err) {
        barrierReject(err);
      } else {
        barrierResolve();
      }
    };

    const replacementFor = (state) => [...sessionStates.values()].some((other) =>
      other !== state && other.targetId === state.targetId && !other.reason);
    const cancelAll = () => {
      for (const state of sessionStates.values()) state.cancel('closed');
      sessionStates.clear();
      workerSessionToTargetId.clear();
      targetSetup.clear();
      item.fpAppliedTargets?.clear();
      item.attachedWorkerTargets?.clear();
    };
    const targetStillExists = async (connection, targetId) => {
      try {
        const snapshot = await connection.command('Target.getTargets', {}, { timeout: 3000 });
        if (!Array.isArray(snapshot?.targetInfos)) return null;
        return snapshot.targetInfos.some((target) => (target.targetId || target.id) === targetId);
      } catch (_) { return null; }
    };
    const confirmLostReadySession = async (state, connection) => {
      if (item.stopping || item.cleanedUp || replacementFor(state)) return;
      const exists = await targetStillExists(connection, state.targetId);
      if (item.stopping || item.cleanedUp || replacementFor(state) || exists === false) return;
      await this.handleBrowserGone(item.profile.id, item, 'fingerprint-session-detached', {
        expected: false, error: 'A live target lost its verified fingerprint session', kill: true, waitForExit: true,
      });
    };

    const onAttached = (event, connection) => {
      if (event?.method === 'Debugger.scriptParsed') {
        sessionStates.get(event.sessionId)?.serviceWorkerGate?.recordScript(event.params || {});
        return;
      }
      if (event?.method === 'Debugger.paused') {
        const gate = sessionStates.get(event.sessionId)?.serviceWorkerGate;
        if (gate) return gate.handlePaused(event.params || {});
      }
      // Font payload lazy-load host bridge (consumer side)
      if (event?.method === 'Runtime.bindingCalled') {
        const bridge = item?.fontBlobBridge || item?.fingerprint?.fontBlobBridge || fingerprint?.fontBlobBridge;
        if (bridge?.channelName && event.params?.name === bridge.channelName) {
          (async () => {
            try {
              let parsed = null;
              try {
                parsed = JSON.parse(event.params?.payload || '{}');
              } catch (_) {
                return;
              }
              const { action, platform, token, wanted } = parsed || {};
              const validTokens = new Set([
                bridge?.token,
                item?.fontBlobBridge?.token,
                item?.fingerprint?.fontBlobBridge?.token,
                fingerprint?.fontBlobBridge?.token,
              ].filter(Boolean));
              const isTokenValid = Boolean(token && (
                validTokens.has(token) ||
                (bridge?.channelName && bridge.channelName.startsWith('_') && token.startsWith(bridge.channelName.slice(1))) ||
                (event.params?.name && event.params.name.startsWith('_') && token.startsWith(event.params.name.slice(1)))
              ));
              // 安全校验：action 必须是 getFontBytes 且 token 必须有效
              if (action !== 'getFontBytes' || !isTokenValid) {
                return;
              }
              const targetPlatform = platform || bridge.platform || 'windows';
              const targetWanted = wanted || bridge.wanted || undefined;
              const payload = getPlatformFontPayload(targetPlatform, { wanted: targetWanted });
              const expr = `try {
                const targetFn = (typeof FontData !== 'undefined' && FontData?.prototype?.blob)
                  ? FontData.prototype.blob
                  : Function.prototype.toString;
                Function.prototype.toString.call(targetFn, ${JSON.stringify(token)}, 'provideBytes', ${JSON.stringify(payload)});
              } catch (_) {}`;
              const targetSessionId = event.sessionId;
              const cmdOptions = targetSessionId ? { sessionId: targetSessionId, timeout: 8000 } : { timeout: 8000 };
              const evalParams = {
                expression: expr,
                awaitPromise: false,
                returnByValue: false,
              };
              if (event.params?.executionContextId != null) {
                evalParams.contextId = event.params.executionContextId;
              }
              await connection.command('Runtime.evaluate', evalParams, cmdOptions).catch(async () => {
                if (evalParams.contextId != null) {
                  await connection.command('Runtime.evaluate', {
                    expression: expr,
                    awaitPromise: false,
                    returnByValue: false,
                  }, cmdOptions).catch(() => {});
                }
              });
            } catch (_) {}
          })();
          return;
        }
      }
      // Failed loads may never produce a response-stage pause.
      if (event?.method === 'Network.loadingFailed') workerScriptPrefixer.cleanupFailedRequest(event);
      // Fetch.requestPaused at Request stage (responseStatusCode == null) is handled by
      // requestHeaderRewriter to guarantee that main-frame navigations, subresources, and workers
      // carry persona User-Agent, Client Hints (sec-ch-ua*), and Accept-Language without host leaks.
      if (event?.method === 'Fetch.requestPaused' && event.params?.requestId && event.params?.responseStatusCode == null && event.params?.responseErrorReason == null) {
        // Chromium 143+ workers: worker script responses get the injection source
        // prefixed at the response stage (see workerScriptPrefixer). The request
        // stage still flows through requestHeaderRewriter so persona UA and
        // Client Hints headers apply; the prefixer only records the request id.
        if (item.workerScriptPrefixDelivery && workerScriptPrefixer?.matches(event.params.request?.url)) {
          try { workerScriptPrefixer.track(event); } catch (_) {}
        } else if (item.workerScriptPrefixDelivery && String(event.params.resourceType || '') === 'Other') {
          // Extensionless worker scripts are resourceType "Other" at the request stage with
          // no discriminating headers (no Sec-Fetch-Dest on worker loads); track them
          // speculatively and let the response stage decide via MIME type. Non-worker
          // "Other" responses (favicons, pings) are dropped there without a body read.
          try { workerScriptPrefixer.track(event); } catch (_) {}
        }
        try { requestHeaderRewriter.handleEvent(event, connection); } catch (_) {}
        return;
      }

      // Response-stage pause of a tracked worker script: fulfill with the injected prefix.
      if (event?.method === 'Fetch.requestPaused' && event.params?.requestId
        && (event.params?.responseStatusCode != null || event.params?.responseErrorReason != null)
        && item.workerScriptPrefixDelivery && workerScriptPrefixer?.hasTracked(event)) {
        workerScriptPrefixer.handlePaused(event, connection).catch((error) => {
          if (!TRANSIENT_PREFIX_ERRORS.test(String(error?.message))) report(error, { type: 'page' });
          if (error.fatal) this.handleBrowserGone(item.profile.id, item, 'worker-response-failed', {
            expected: false, error: error.message, kill: true, waitForExit: true,
          }).catch(() => {});
        });
        return;
      }

      // Fetch.requestPaused is delivered on this same browser connection. It must be dispatched
      // before the Target branch below, otherwise a paused parser response can wait forever.
      try { fontResponseRewriter.handleEvent(event, connection); } catch (_) {}

      // Clean up in-flight requests when a target session detaches or closes
      if (event?.method === 'Target.detachedFromTarget') {
        const detachedSessionId = event.params?.sessionId;
        item.networkConditionsSessions?.delete(detachedSessionId);
        const detachedTargetId = event.params?.targetId || (detachedSessionId ? workerSessionToTargetId.get(detachedSessionId) : null);
        const detachedState = sessionStates.get(detachedSessionId);
        detachedState?.cancel('detached');
        sessionStates.delete(detachedSessionId);
        const hasReplacement = [...policySessions].some(([id, target]) =>
          id !== detachedSessionId && target.targetId === detachedTargetId);
        if (!hasReplacement && detachedTargetId && item.attachedWorkerTargets) {
          item.attachedWorkerTargets.delete(detachedTargetId);
        }
        if (detachedTargetId) {
          forgetFingerprintTarget(connection, `target:${detachedTargetId}`, detachedSessionId);
          if (!hasReplacement) item.fpAppliedTargets?.delete(detachedTargetId);
        }
        if (detachedTargetId) forgetTargetRuntimePolicy(item, detachedTargetId, connection, detachedSessionId);
        if (detachedSessionId) {
          policySessions.delete(detachedSessionId);
          workerSessionToTargetId.delete(detachedSessionId);
          targetSetup.delete(detachedSessionId);
          try { requestHeaderRewriter.cleanupSession(detachedSessionId); } catch (_) {}
          workerScriptPrefixer.cleanupSession(detachedSessionId);
          try { fontResponseRewriter.cleanupSession?.(detachedSessionId); } catch (_) {}
        }
        if (detachedState?.ready) {
          confirmLostReadySession(detachedState, connection).catch((error) => report(error, { targetId: detachedTargetId }));
        }
        return;
      }

      // If an initial target closes before attaching, unblock barrier without hanging
      if (event?.method === 'Target.targetDestroyed') {
        const destroyedId = event.params?.targetId;
        forgetTargetRuntimePolicy(item, destroyedId);
        forgetFingerprintTarget(connection, `target:${destroyedId}`);
        closePageFingerprintConnection(item, destroyedId);
        item.fpAppliedTargets?.delete(destroyedId);
        if (destroyedId && item.attachedWorkerTargets) {
          item.attachedWorkerTargets.delete(destroyedId);
        }
        for (const [session, target] of workerSessionToTargetId) {
          if (target !== destroyedId) continue;
          sessionStates.get(session)?.cancel('destroyed');
          sessionStates.delete(session);
          workerSessionToTargetId.delete(session);
          policySessions.delete(session);
          targetSetup.delete(session);
          requestHeaderRewriter.cleanupSession(session);
          fontResponseRewriter.cleanupSession?.(session);
        }
        if (destroyedId && pendingInitialTargets.has(destroyedId)) {
          pendingInitialTargets.delete(destroyedId);
          if (pendingInitialTargets.size === 0) {
            settleBarrier();
          }
        }
        return;
      }

      if (event.method !== 'Target.attachedToTarget' || item.stopping || item.cleanedUp) return;
      const { sessionId, targetInfo = {}, waitingForDebugger } = event.params || {};
      if (!sessionId) return;
      if (targetSetup.has(sessionId)) return targetSetup.get(sessionId);
      const targetId = targetInfo.targetId;
      const workerOwner = item.workerScriptPrefixDelivery && targetInfo.type === 'service_worker' && targetId
        ? [...sessionStates.values()].find(other => other.targetId === targetId && !other.reason) : null;
      if (workerOwner?.serviceWorkerGate) {
        // Browser and page auto-attach both announce the same SW. A second
        // Debugger agent can pause the first agent's delivery commands, or
        // resume its breakpoint. Keep exactly one pre-script delivery owner.
        // Detaching an extra startup session too early can itself release the
        // worker. Wait until the owner's ordered breakpoint commands are sent,
        // release this session's startup latch, then detach after verification.
        return (async () => {
          await workerOwner.run(() => workerOwner.serviceWorkerGate.started);
          await connection.command('Runtime.runIfWaitingForDebugger', {}, { sessionId, timeout: 3000 });
          await workerOwner.run(() => workerOwner.serviceWorkerGate.completion);
          await connection.command('Target.detachFromTarget', { sessionId }, { sessionId: event.sessionId, timeout: 3000 });
        })().catch(error => {
          if (workerOwner.reason || item.stopping || item.cleanedUp || /No session with given id|Session closed|Target closed/i.test(error.message)) return;
          report(error, targetInfo);
          return this.handleBrowserGone(item.profile.id, item, 'duplicate-worker-session', {
            expected: false, error: error.message, kill: true, waitForExit: true,
          });
        });
      }
      if (targetId) workerSessionToTargetId.set(sessionId, targetId);
      const isInitial = Boolean(targetId && pendingInitialTargets.has(targetId));
      const state = new FingerprintSession({ sessionId, targetId, item, connection });
      sessionStates.set(sessionId, state);
      const scopedConnection = { command: (method, params, options) => state.command(method, params, options) };

      const setup = (async () => {
        // A fresh tab (window.open with noopener, ctrl-click, or any target opened without an
        // opener) can attach while its renderer still has no execution context. Every session
        // command then waits out its full timeout, and because the target stays paused on
        // waitForDebuggerOnStart until the end of the block, the user faces a blank tab for that
        // whole time. Keep one resume latch so the pause is released as early as correctness
        // allows and never released twice.
        let pausedTargetNeedsResume = Boolean(waitingForDebugger);
        const resumeTarget = async () => {
          state.assertActive();
          if (!pausedTargetNeedsResume) return;
          pausedTargetNeedsResume = false;
          if (state.serviceWorkerGate) {
            await state.serviceWorkerGate.resume();
            this.emit({ type: 'service-worker-first-script-injected', id: item.profile?.id, targetId, sessionId });
          }
          else await state.command('Runtime.runIfWaitingForDebugger', {}, { sessionId, timeout: 3000 });
          // Chrome 157: Network.enable on a PAUSED service worker times out; it works
          // right after the pause is released. Deferred SW network setup lands here.
          if (state.serviceWorkerNeedsNetwork) {
            state.serviceWorkerNeedsNetwork = false;
            try {
              await state.command('Network.enable', {}, { sessionId, timeout: 3000 });
              const workerUa = requestHeaderRewriter.enabled ? requestHeaderRewriter.persona : null;
              if (workerUa) {
                await state.command('Network.setUserAgentOverride', {
                  userAgent: workerUa.userAgent,
                  acceptLanguage: workerUa.acceptLanguage,
                  platform: workerUa.platformNav || workerUa.platform,
                  ...(requestHeaderRewriter.supportsClientHints ? { userAgentMetadata: workerUa.metadata } : {}),
                }, { sessionId, timeout: 3000 });
              }
            } catch (error) {
              // The SW may already be stopped (no clients); its script is prefixed
              // regardless, so this is a best-effort header override, never fatal.
              this.emit({ type: 'service-worker-network-setup-deferred-failed', id: item.profile?.id, message: error.message });
            }
          }
        };
        const armResponseRewriting = async (timeout) => {
          await fontResponseRewriter.enable(scopedConnection, { sessionId, timeout });
          await state.command('Fetch.enable', {
            patterns: [
              { urlPattern: '*', requestStage: 'Request' },
              { urlPattern: '*', requestStage: 'Response', resourceType: 'Document' },
              { urlPattern: '*', requestStage: 'Response', resourceType: 'Stylesheet' },
              // Chromium 157+ worker delivery: the page-level Fetch prefixer needs the
              // response stage of worker scripts. Their resourceType is "Other" (not
              // "Script"), so the patterns must be URL-based, not resourceType-based.
              { urlPattern: '*.js', requestStage: 'Response' },
              { urlPattern: '*.js?*', requestStage: 'Response' },
              { urlPattern: '*.mjs', requestStage: 'Response' },
              { urlPattern: '*.mjs?*', requestStage: 'Response' },
              // Extensionless worker endpoints (/api/worker, /sw?v=2) match none of the
              // suffix patterns. Worker script loads are classified resourceType "Other",
              // so a suffix-free "Other" response pattern still reaches them while leaving
              // page scripts (resourceType "Script"), documents and stylesheets untouched.
              // matches() then filters on Sec-Fetch-Dest before anything is rewritten.
              { urlPattern: '*', requestStage: 'Response', resourceType: 'Other' },
            ],
          }, { sessionId, timeout });
        };
        try {
          const pageLikeTypes = new Set(['page', 'iframe', 'popup', 'webview']);
          if (targetInfo.type === 'page' || targetInfo.type === 'iframe' || pageLikeTypes.has(targetInfo.type)) {
            // Nested attach so workers/iframes under this page also pause for inject.
            await state.command('Target.setAutoAttach', {
              autoAttach: true,
              waitForDebuggerOnStart: true,
              flatten: true,
              // SWs belong to the browser auto-attach owner. Exclude them here
              // before creation, rather than racing two startup/debugger agents.
              ...(item.workerScriptPrefixDelivery ? { filter: [{ type: 'service_worker', exclude: true }, {}] } : {}),
            }, { sessionId });
            if (isInitial) {
              // Startup barrier targets are known-ready and must be sanitized before first paint.
              // Critical: inject fingerprint BEFORE resuming the page/iframe target.
              // Polling in startRunningWatch is only a fallback, not the primary path.
              await state.run(() => this.applyFingerprintToSession(connection, sessionId, item, fingerprint, { ...targetInfo, waitingForDebugger, setupGuard: state }));
              // Enable Fetch while this page/iframe is paused. The next navigation then receives
              // sanitized HTML/CSS bytes before the renderer tokenizes its static styles.
              await armResponseRewriting(8000);
            } else {
              // A timed-out target is closed rather than resumed without its identity.
              const injectBudget = targetInfo.type === 'iframe' ? 5000 : 8000;
              let timer;
              try {
                await Promise.race([
                  state.run(() => this.applyFingerprintToSession(connection, sessionId, item, fingerprint, { ...targetInfo, waitingForDebugger, setupGuard: state })),
                  new Promise((_resolve, reject) => { timer = setTimeout(() => {
                    state.cancel('timeout', 'Fingerprint target injection timeout');reject(state.error);
                  }, injectBudget); }),
                ]);
                await armResponseRewriting(injectBudget);
              } finally { clearTimeout(timer); }
            }
          } else if (workerTypes.has(targetInfo.type) && !internalUrl.test(String(targetInfo.url || ''))) {
            if (!item.attachedWorkerTargets) item.attachedWorkerTargets = new Set();
            // item.workerScriptPrefixDelivery is decided in startWorkerFingerprintInjection
            // (Chromium >= 143). See the long comment there for the deadlock rationale.
            if (item.workerScriptPrefixDelivery) {
              if (targetInfo.type === 'service_worker') {
                if (!waitingForDebugger) throw new Error('Cannot verify first-script fingerprint delivery on an already running Service Worker');
                state.serviceWorkerGate = new ServiceWorkerScriptGate(state, fingerprint);
                // SW scripts load through the browser process: the browser-level Fetch
                // domain (armed in startWorkerFingerprintInjection) prefixes them.
                // Network setup only works AFTER the pause is released on Chrome 157,
                // so defer it to resumeTarget().
                state.serviceWorkerNeedsNetwork = true;
              } else {
                // Dedicated/Shared workers: script prefixing (page-level Fetch) carries
                // the JS mocks; the network-layer override below keeps their fetch()
                // headers persona too (works on paused dedicated workers, unlike SWs).
                await state.command('Network.enable', {}, { sessionId, timeout: 3000 });
                const workerUa = requestHeaderRewriter.enabled ? requestHeaderRewriter.persona : null;
                if (workerUa) {
                  await state.command('Network.setUserAgentOverride', {
                    userAgent: workerUa.userAgent,
                    acceptLanguage: workerUa.acceptLanguage,
                    platform: workerUa.platformNav || workerUa.platform,
                    ...(requestHeaderRewriter.supportsClientHints ? { userAgentMetadata: workerUa.metadata } : {}),
                  }, { sessionId, timeout: 3000 });
                }
              }
            } else {
              await state.command('Network.enable', {}, { sessionId, timeout: 3000 });
              const workerUa = requestHeaderRewriter.enabled ? requestHeaderRewriter.persona : null;
              if (workerUa) {
                await state.command('Network.setUserAgentOverride', {
                  userAgent: workerUa.userAgent,
                  acceptLanguage: workerUa.acceptLanguage,
                  platform: workerUa.platformNav || workerUa.platform,
                  ...(requestHeaderRewriter.supportsClientHints ? { userAgentMetadata: workerUa.metadata } : {}),
                }, { sessionId, timeout: 3000 });
              }
              await state.command('Fetch.enable', {
                patterns: [{ urlPattern: '*', requestStage: 'Request' }],
              }, { sessionId, timeout: 3000 }).catch((error) => {
                if (!/wasn't found|not found/i.test(String(error?.message))) throw error;
                item.workerFetchDomainUnavailable = true;
                this.emit({
                  type: 'worker-fetch-domain-unavailable',
                  id: item.profile?.id,
                  targetType: targetInfo.type,
                  message: 'Worker session Fetch domain unavailable; relying on Network.setUserAgentOverride',
                });
              });
              // Worker fingerprint injection (DedicatedWorker, SharedWorker, and ServiceWorker)
              // Evaluated before runIfWaitingForDebugger so the worker global scope carries persona
              // mocks before evaluating initial worker scripts. Short timeout guarantees no hang.
              const evaluation = await state.command('Runtime.evaluate', { expression: source }, { sessionId, timeout: 3000 });
              if (evaluation?.exceptionDetails) {
                throw new Error(evaluation.exceptionDetails.exception?.description || evaluation.exceptionDetails.text || 'Worker fingerprint execution failed');
              }
            }
            await applyTargetRuntimePolicy({ owner: item, targetId: targetId || sessionId, targetType: targetInfo.type,
              registrationOwner: connection, registrationScope: sessionId,
              profile: runtimePolicyProfile(item.profile, this.profiles?.get?.(item.profile.id)),
              invoke: (method, params) => state.command(method, params, { timeout: 3000 }),
            });
          }
          await resumeTarget();
          state.assertActive();
          state.ready = Boolean(targetId && (pageLikeTypes.has(targetInfo.type) || workerTypes.has(targetInfo.type)) && !internalUrl.test(String(targetInfo.url || '')));
          if (state.ready && workerTypes.has(targetInfo.type)) item.attachedWorkerTargets?.add(targetId);
          if (state.ready) {
            policySessions.set(sessionId, { targetId, type: targetInfo.type });
          }
          if (pageLikeTypes.has(targetInfo.type) && targetId) {
            if (!item.fpAppliedTargets) item.fpAppliedTargets = new Set();
            item.fpAppliedTargets.add(targetId);
          }
          if (isInitial && !completedInitialTargets.has(targetId)) {
            completedInitialTargets.add(targetId);
            pendingInitialTargets.delete(targetId);
            if (pendingInitialTargets.size === 0) settleBarrier();
          }
        } catch (error) {
          pausedTargetNeedsResume = false;
          if (!state.reason) state.cancel('failed', error.message);
          if (sessionStates.get(sessionId) === state) sessionStates.delete(sessionId);
          if (state.reason === 'closed' || item.stopping || item.cleanedUp || connection.closed) return;
          if (state.reason === 'destroyed') return;
          if (state.reason === 'detached') {
            if (replacementFor(state)) return;
            const exists = await targetStillExists(connection, targetId);
            if (replacementFor(state)) return;
            if (exists === false) {
              pendingInitialTargets.delete(targetId);
              if (!pendingInitialTargets.size) settleBarrier();
              return;
            }
          }
          report(error, targetInfo);
          // Closing an iframe/worker target can be unsupported; then stop its browser.
          try {
            const closed = targetId && await connection.command('Target.closeTarget', { targetId }, { timeout: 3000 });
            if (!closed?.success) throw new Error('Target closure was not confirmed');
          } catch (_) {
            this.handleBrowserGone(item.profile.id, item, 'fingerprint-target-failed', { expected: false, error: error.message, kill: true, waitForExit: true }).catch(() => {});
          }
          this.emit({
            type: 'fingerprint-injection-failed',
            id: item.profile?.id,
            targetType: targetInfo.type || '',
            message: error.message,
          });
          if (isInitial) {
            settleBarrier(new Error(`Initial target session attach failed for ${targetId}: ${error.message}`));
          }
        }
      })();
      targetSetup.set(sessionId, setup);
      return setup;
    };

    const connection = await cdp.connect(browserWs, {
      onEvent: onAttached,
      onDisconnect: (error, disconnected) => {
        cancelAll();
        forgetFingerprintOwner(disconnected);
        policySessions.clear();
        try { requestHeaderRewriter.destroy(); } catch (_) {}
        try { fontResponseRewriter.destroy?.(); } catch (_) {}
        try { workerScriptPrefixer.destroy(); } catch (_) {}
        if (!barrierSettled) {
          settleBarrier(new Error(`CDP connection closed before initial target barrier resolved: ${error?.message || error}`));
        }
        if (item.cleanedUp || item.stopping) return;
        this.handleBrowserGone(item.profile.id, item, 'worker-cdp-disconnect', {
          expected: false,
          error: error?.message || String(error),
          kill: true,
          waitForExit: true,
        }).catch((cleanupError) => this.emit({
          type: 'sync-error',
          action: 'worker-cdp-disconnect-cleanup',
          id: item.profile.id,
          message: cleanupError.message,
        }));
      },
      timeout: 8000,
    });

    const origClose = connection.close.bind(connection);
    connection.close = () => {
      cancelAll();
      forgetFingerprintOwner(connection);
      policySessions.clear();
      try { requestHeaderRewriter.destroy(); } catch (_) {}
      try { fontResponseRewriter.destroy?.(); } catch (_) {}
      try { workerScriptPrefixer.destroy(); } catch (_) {}
      if (!barrierSettled) {
        settleBarrier(new Error('CDP connection closed before initial target barrier resolved'));
      }
      return origClose();
    };
    item.workerFingerprintConnection = connection;

    if (item.cleanedUp || item.stopping) {
      connection.close();
      throw new Error('Browser item is already stopping or cleaned up');
    }

    try {
      await connection.command('Target.setDiscoverTargets', { discover: true });

      // Identify existing targets before setAutoAttach to establish the initial target barrier
      let discoveredTargets = [];
      try {
        const targetsRes = await connection.command('Target.getTargets', {}, { timeout: 8000 });
        if (!Array.isArray(targetsRes?.targetInfos)) throw new Error('Invalid target discovery result');
        discoveredTargets = targetsRes.targetInfos;
      } catch (_) {
        const fallbackTargets = await cdp.targets(item.port);
        if (!Array.isArray(fallbackTargets)) throw new Error('Cannot enumerate initial fingerprint targets');
        discoveredTargets = fallbackTargets;
      }

      for (const t of discoveredTargets) {
        const tid = t.targetId || t.id;
        const ttype = t.type;
        const turl = String(t.url || '');
        const pageLikeTypes = new Set(['page', 'iframe', 'popup', 'webview']);
        if ((pageLikeTypes.has(ttype) || workerTypes.has(ttype)) && !internalUrl.test(turl) && tid) {
          pendingInitialTargets.add(tid);
        }
      }

      if (pendingInitialTargets.size === 0) {
        settleBarrier();
      } else {
        barrierTimer = setTimeout(() => {
          const remaining = Array.from(pendingInitialTargets).join(', ');
          settleBarrier(new Error(`Initial target session attach barrier timed out after 8000ms (targets: ${remaining})`));
        }, 8000);
        if (typeof barrierTimer.unref === 'function') barrierTimer.unref();
      }

      await connection.command('Target.setAutoAttach', {
        autoAttach: true,
        waitForDebuggerOnStart: true,
        flatten: true,
      });

      // Chromium 143+ Service Worker scripts load through the browser process and
      // bypass page-level Fetch interception. Arm the browser-level Fetch domain so
      // workerScriptPrefixer can rewrite their responses too (request stage passes
      // through, response stage gets the injection prefix). Harmless on builds where
      // the classic evaluate delivery runs instead — those never set the flag.
      if (item.workerScriptPrefixDelivery) {
        await connection.command('Fetch.enable', {
          patterns: [
            { urlPattern: '*', requestStage: 'Request' },
            { urlPattern: '*.js', requestStage: 'Response' },
            { urlPattern: '*.js?*', requestStage: 'Response' },
            { urlPattern: '*.mjs', requestStage: 'Response' },
            { urlPattern: '*.mjs?*', requestStage: 'Response' },
            // Extensionless worker/SW scripts are resourceType "Other" (see the page-level
            // pattern above); Sec-Fetch-Dest filtering happens in WorkerScriptPrefixer.
            { urlPattern: '*', requestStage: 'Response', resourceType: 'Other' },
          ],
        }, { timeout: 8000 });
      }

      // Synchronize on the initial target barrier before returning to prevent navigation race
      await barrierPromise;
    } catch (error) {
      settleBarrier(error);
      connection.close();
      if (item.workerFingerprintConnection === connection) {
        item.workerFingerprintConnection = null;
      }
      throw error;
    }
    item.workerFingerprintConnection = connection;
    return connection;
  },
  async applyFingerprintToSession(connection, sessionId, item, fingerprint, targetInfo = {}) {
    const profile = item?.profile || {};
    const network = this.networkInfo.get(profile.id) || {};
    const enriched = {
      ...profile,
      exitTimezone: profile.exitTimezone || network.timezone || '',
      exitLatitude: profile.exitLatitude ?? network.latitude,
      exitLongitude: profile.exitLongitude ?? network.longitude,
    };
    const baseFp = fingerprint || item.fingerprint || buildFingerprint(enriched);
    const injectFp = item.nativeKernelFingerprint
      ? fingerprintForNativeKernelInject(baseFp)
      : baseFp;
    // session-scoped CDP calls for targets attached with flatten:true
    const isSubframe = targetInfo?.type === 'iframe';
    const isWaiting = Boolean(targetInfo?.waitingForDebugger || targetInfo?.isWaiting);
    const setupGuard = targetInfo.setupGuard;
    setupGuard?.assertActive();
    if (item.fingerprintPageConnections?.has(targetInfo?.targetId)) {
      // Retire the old session before applying the new session's native
      // overrides, so old-agent teardown cannot undo the new emulation.
      // Blank/paused targets cannot run a site during this handover.
      if (!isWaiting && !isEphemeralDocumentUrl(targetInfo?.url)) {
        throw Object.assign(new Error('Cannot transfer fingerprint ownership on an active document'), {
          code: 'FINGERPRINT_HANDOVER_UNSAFE',
        });
      }
      closePageFingerprintConnection(item, targetInfo.targetId);
    }
    const sessionCall = async (method, params = {}, timeout = 8000) => {
      try {
        setupGuard?.assertActive();
        // Optimization: on targets paused waiting for debugger at startup, Runtime.evaluate
        // blocks until Runtime.runIfWaitingForDebugger is called, hanging for 6-8s timeout.
        // Page.addScriptToEvaluateOnNewDocument already guarantees sync execution on document start.
        if (isWaiting && method === 'Runtime.evaluate') {
          return {};
        }
        return setupGuard
          ? await setupGuard.command(method, params, { timeout })
          : await connection.command(method, params, { sessionId, timeout });
      } catch (err) {
        if (isSubframe && /Command can only be executed on top-level targets|Cannot find default execution context/i.test(String(err?.message || err))) {
          return {};
        }
        throw err;
      }
    };
    // Apply before resume. A configured offline/throttle policy must succeed.
    const netSim = enriched.privacy?.networkConditions;
    if (!isSubframe && (netSim || item.networkConditionsSessions?.has(sessionId))) {
      await applyNetworkConditions(sessionCall, netSim);
      item.networkConditionsSessions ||= new Set();
      if (netSim) item.networkConditionsSessions.add(sessionId);
      else item.networkConditionsSessions.delete(sessionId);
    }
    const fontBlobBridge = injectFp?.fontBlobBridge || baseFp?.fontBlobBridge || item?.fontBlobBridge || item?.fingerprint?.fontBlobBridge;
    if (fontBlobBridge?.channelName) {
      if (!item.fontBlobBridge) item.fontBlobBridge = fontBlobBridge;
      try {
        await sessionCall('Runtime.enable', {}).catch(() => {});
        await sessionCall('Runtime.addBinding', { name: fontBlobBridge.channelName }).catch((err) => {
          const msg = String(err?.message || err);
          if (!/already exists/i.test(msg)) {
            // ignore non-fatal binding errors
          }
        });
      } catch (_) {}
    }
    await applyFingerprintToTab(sessionCall, null, injectFp, enriched, {
      // Keep one registration per connection/session. Once this persistent
      // session is ready it can replace the initial page-WebSocket owner.
      applyKey: `target:${targetInfo?.targetId || sessionId}`,
      registrationOwner: connection,
      registrationScope: sessionId,
      targetType: targetInfo?.type,
      isSubframe,
      isWaiting,
      livePatchDocument: isEphemeralDocumentUrl(targetInfo?.url),
    });
    await applyTargetRuntimePolicy({ owner: item, targetId: targetInfo?.targetId || sessionId,
      registrationOwner: connection, registrationScope: sessionId,
      targetType: targetInfo?.type || 'page', waiting: isWaiting,
      profile: runtimePolicyProfile(profile, this.profiles?.get?.(profile.id)), invoke: sessionCall,
    });
    setupGuard?.assertActive();
    item.fpAppliedHash = fingerprintConfigHash(injectFp);
    item.fingerprint = baseFp;
    return injectFp;
  },
  /**
   * 启动前 CDP 指纹交付校验：
   * 在导航目标站点/启动页之前，用 CDP 在初始页面执行单次探针 Runtime.evaluate，
   * 校验实际交付给页面的指纹值与配置是否存在直接矛盾。
   */
  async verifyStartupFingerprintDelivery(item, profile, fingerprint = null, options = {}) {
    const profileId = profile?.id || item?.profile?.id || 'unknown';
    const maxConsecutiveFailures = options.maxConsecutiveFailures || 3;
    const windowMs = options.failureWindowMs || (5 * 60 * 1000);

    const lastFailureTime = this.deliveryVerificationFailureTimestamps?.get(profileId) || 0;
    if (lastFailureTime > 0 && Date.now() - lastFailureTime > windowMs) {
      this.resetFingerprintVerificationFailures(profileId);
    }

    const priorFailures = this.deliveryVerificationFailures.get(profileId) || 0;

    if (priorFailures >= maxConsecutiveFailures) {
      const errorMsg = "同一环境连续指纹交付校验失败已达上限 (" + maxConsecutiveFailures + " 次)，已阻止访问目标站点";
      await fpLog('verify.delivery-blocked-consecutive-limit', {
        profileId,
        priorFailures,
        maxConsecutiveFailures,
      });
      return {
        ok: false,
        blocked: true,
        consecutiveLimitReached: true,
        mismatches: [{ field: 'consecutiveFailures', expected: "< " + maxConsecutiveFailures, actual: priorFailures, message: errorMsg }],
        message: errorMsg,
        warnings: [],
      };
    }

    const port = item?.port;
    if (!port && !options.probe && options.mockProbe === undefined) {
      return {
        ok: false,
        blocked: true,
        mismatches: [{ field: 'port', message: '未获取到调试端口，无法校验指纹交付' }],
        warnings: [],
        liveProbe: null,
      };
    }

    const timeout = Math.min(5000, Math.max(1000, Number(options.timeout) || 3500));
    let liveProbe = null;
    let probeWarning = null;

    if (typeof options.probe === 'function') {
      try {
        liveProbe = await options.probe();
      } catch (err) {
        probeWarning = "探针执行异常: " + (err?.message || String(err));
        liveProbe = { probeError: probeWarning };
      }
    } else if (options.mockProbe !== undefined) {
      liveProbe = options.mockProbe;
    } else {
      try {
        const tabs = await cdp.tabs(port).catch(() => []);
        // Probe initial blank tab or current start page tab
        const probeTab = tabs.find((t) => /about:blank/i.test(String(t.url || '')) || this.isStartPageUrl(t.url)) || tabs[0];
        if (!probeTab?.webSocketDebuggerUrl) {
          probeWarning = '未找到可用于探针校验的初始标签页';
          liveProbe = { probeError: probeWarning };
        } else {
          const probeRes = await cdp.call(probeTab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: LIVE_PROBE_EXPRESSION,
            returnByValue: true,
            awaitPromise: true,
          }, timeout);
          liveProbe = probeRes?.result?.value || probeRes?.value || null;
        }
      } catch (err) {
        probeWarning = "CDP 探针执行异常: " + (err?.message || String(err));
        liveProbe = { probeError: probeWarning };
      }
    }

    const targetFp = fingerprint || item?.fingerprint || {};
    const evalResult = evaluateFingerprintDelivery(profile, targetFp, liveProbe, { strict: true });
    if (probeWarning && !evalResult.warnings.includes(probeWarning)) {
      evalResult.warnings.push(probeWarning);
    }

    await fpLog('verify.delivery-result', {
      profileId,
      ok: evalResult.ok,
      mismatchCount: evalResult.mismatches.length,
      warningCount: evalResult.warnings.length,
      mismatches: evalResult.mismatches,
      warnings: evalResult.warnings,
      liveProbeSummary: liveProbe ? {
        platform: liveProbe.platform,
        userAgent: liveProbe.userAgent ? String(liveProbe.userAgent).slice(0, 80) : null,
        uaDataPlatform: liveProbe.uaDataPlatform,
        timezone: liveProbe.timezone,
        webglVendor: liveProbe.webglVendor,
        webglRenderer: liveProbe.webglRenderer,
        languages: liveProbe.languages,
        hardwareConcurrency: liveProbe.hardwareConcurrency,
        deviceMemory: liveProbe.deviceMemory,
      } : null,
    });

    if (!evalResult.ok) {
      const newFailureCount = priorFailures + 1;
      const MAX_FAILURE_TRACK_SIZE = 200;
      if (this.deliveryVerificationFailures.has(profileId)) {
        this.deliveryVerificationFailures.delete(profileId);
        this.deliveryVerificationFailureTimestamps?.delete(profileId);
      } else if (this.deliveryVerificationFailures.size >= MAX_FAILURE_TRACK_SIZE) {
        const oldestKey = this.deliveryVerificationFailures.keys().next().value;
        if (oldestKey !== undefined) {
          this.deliveryVerificationFailures.delete(oldestKey);
          this.deliveryVerificationFailureTimestamps?.delete(oldestKey);
        }
      }
      this.deliveryVerificationFailures.set(profileId, newFailureCount);
      if (!this.deliveryVerificationFailureTimestamps) this.deliveryVerificationFailureTimestamps = new Map();
      this.deliveryVerificationFailureTimestamps.set(profileId, Date.now());
      const mismatchText = evalResult.mismatches.map((m) => m.message || String(m)).join('; ');
      return {
        ok: false,
        blocked: true,
        mismatches: evalResult.mismatches,
        message: "指纹交付校验失败: " + mismatchText,
        warnings: evalResult.warnings,
        liveProbe,
      };
    }

    // Success: clear consecutive failure counter
    this.resetFingerprintVerificationFailures(profileId);
    return {
      ok: true,
      blocked: false,
      mismatches: [],
      warnings: evalResult.warnings,
      liveProbe,
    };
  },
  /** Verify every startup tab again without stacking a second live injection. */
  async ensureStartPageFingerprint(item, profile, injectFp) {
    if (!item?.port) throw new Error('Missing CDP port for post-navigation verification');
    await this.applyRuntimeSettings(item.port, profile, injectFp, {
      appliedTargetIds: item.fpAppliedTargets instanceof Set ? item.fpAppliedTargets : new Set(),
      appliedFingerprintHash: item.fpAppliedHash,
      trackOn: item, phase: 'post-startpage', verifyApplied: true,
    });
    // Refresh the local information table after verified delivery.
    const tabs = await cdp.tabs(item.port);
    for (const tab of tabs) {
      if (!this.isStartPageUrl(tab.url) || !tab.webSocketDebuggerUrl) continue;
      await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
        expression: `if (typeof window.__openbrowserCollectFingerprint === 'function') window.__openbrowserCollectFingerprint('post-inject')`,
      }, 3000).catch(() => {});
    }
    return injectFp;
  },
  fingerprintPatchFromNetwork(network = {}, profile = {}) {
    const privacy = { ...(profile.privacy || {}) };
    const language = resolveProfileLanguage({
      ...profile,
      privacy: { ...privacy, languageMode: privacy.languageMode || 'ip' },
    }, network);
    const timezone = resolveProfileTimezone(profile, network);
    const tzMode = String(privacy.timezoneMode || 'ip').trim().toLowerCase();
    const patch = {
      exitIp: network.ip || '',
      exitCountryCode: network.countryCode || '',
      exitTimezone: tzMode === 'real' ? '' : (timezone || network.timezone || ''),
      exitLatitude: network.latitude ?? null,
      exitLongitude: network.longitude ?? null,
      exitCheckedAt: network.checkedAt || new Date().toISOString(),
      language,
      privacy: { ...privacy },
    };
    if ((tzMode === 'ip' || tzMode === 'custom') && timezone) {
      patch.privacy.timezoneMode = privacy.timezoneMode || 'ip';
      patch.privacy.timezone = timezone;
    }
    if ((privacy.languageMode === 'ip' || privacy.langFromIp !== false) && language) {
      patch.privacy.languageMode = privacy.languageMode || 'ip';
      patch.language = language;
    }
    return patch;
  },
  resetFingerprintVerificationFailures(profileId) {
    if (profileId) {
      this.deliveryVerificationFailures?.delete(profileId);
      this.deliveryVerificationFailureTimestamps?.delete(profileId);
    } else {
      this.deliveryVerificationFailures?.clear();
      this.deliveryVerificationFailureTimestamps?.clear();
    }
  },
  fingerprintFor(profileOrId) {
    const profile = typeof profileOrId === 'string'
      ? (this.profiles.get(profileOrId) || this.running.get(profileOrId)?.profile)
      : profileOrId;
    if (!profile) throw new Error('profile not found');
    const running = this.running?.get(profile.id);
    if (this.profilePrefersFirefox?.(profile)) {
      const fingerprint = running?.fingerprint || require('../automation/firefox-fingerprint').buildFirefoxFingerprint(profile, this.chooseBrowser(profile, 'firefox').version);
      return { ...structuredClone(fingerprint), delivery: running?.capabilities?.fingerprintDelivery ? 'verified-document' : 'configured' };
    }
    return running?.fingerprint ? structuredClone(running.fingerprint) : buildFingerprint(profile);
  },

fingerprintConfigHash,
isEphemeralDocumentUrl,
};
