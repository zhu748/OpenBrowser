'use strict';

/**
 * Fingerprint injection mixin for BrowserEngine (prototype-assigned by
 * engine.js): service-worker/worker-realm injection, per-session page attach
 * injection (before target resume), startup delivery verification, start-page
 * fingerprint refresh, and network-driven fingerprint patches. The two helpers
 * shared with engine.js's applyRuntimeSettings — fingerprintConfigHash and
 * isEphemeralDocumentUrl — are re-exported here and imported back by engine.js.
 */

const cdp = require('../cdp');
const { createCssFontResponseRewriter } = require('../automation/css-font-response-rewrite');
const { applyFingerprintToTab, buildFingerprint, buildWorkerInjectionScript } = require('../automation/fingerprint');
const { LIVE_PROBE_EXPRESSION, fpLog, summarizeFp } = require('../automation/fingerprint-debug-log');
const { deriveFontPlaceholder } = require('../automation/font-placeholder');
const { fingerprintForNativeKernelInject } = require('../automation/kernel-init-sync');
const { resolveProfileLanguage, resolveProfileTimezone } = require('../automation/locale-from-country');
const { buildPortScanProtectionScript } = require('../automation/port-scan-protection');
const { getPlatformFontPayload } = require('../automation/query-local-font-blob-gate');
const { RequestHeaderRewriter, evaluateFingerprintDelivery } = require('../automation/request-header-rewriter');
const { buildWorkerFontPresenceSource } = require('../automation/worker-font-presence-fallback');
const crypto = require('crypto');

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
    // NOTE: the fingerprint used for service-worker injection is pinned per
    // connection (see the cdp.connect wrapper and the connect call below) —
    // no process-global state is updated here on purpose.
    const workerPrivacy = (item.profile && item.profile.privacy) || {};
    const portScanSource = workerPrivacy.portScanProtect
      ? '\n' + buildPortScanProtectionScript(workerPrivacy.portScanAllow)
      : '';
    const fontPresenceSource = typeof buildWorkerFontPresenceSource === 'function'
      ? buildWorkerFontPresenceSource(fingerprint)
      : '';
    const source = buildWorkerInjectionScript(fingerprint)
      + portScanSource
      + (fontPresenceSource ? '\n' + fontPresenceSource : '');
    if (fingerprint?.fontBlobBridge && !item.fontBlobBridge) {
      item.fontBlobBridge = fingerprint.fontBlobBridge;
    }
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
    const requestHeaderRewriter = new RequestHeaderRewriter({
      profile: item.profile,
      fingerprint,
      logger: (details) => {
        if (details?.type === 'request-rewrite-error') {
          item.requestHeaderRewriteError = details.error;
        }
      },
    });
    item.requestHeaderRewriter = requestHeaderRewriter;
    // service_worker is owned by cdp-hardening's connect wrapper (it injects
    // buildWorkerInjectionScript on SW attach). Duplicating it here cost one
    // redundant Runtime.evaluate round trip per SW attach; the second copy was
    // rejected by the bridge-token guard in the worker script anyway.
    const workerTypes = new Set(['worker', 'shared_worker']);
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

    const onAttached = (event, connection) => {
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
      // Fetch.requestPaused at Request stage (responseStatusCode == null) is handled by
      // requestHeaderRewriter to guarantee that main-frame navigations, subresources, and workers
      // carry persona User-Agent, Client Hints (sec-ch-ua*), and Accept-Language without host leaks.
      if (event?.method === 'Fetch.requestPaused' && event.params?.requestId && event.params?.responseStatusCode == null) {
        try { requestHeaderRewriter.handleEvent(event, connection); } catch (_) {}
        return;
      }

      // Fetch.requestPaused is delivered on this same browser connection. It must be dispatched
      // before the Target branch below, otherwise a paused parser response can wait forever.
      try { fontResponseRewriter.handleEvent(event, connection); } catch (_) {}

      // Clean up in-flight requests when a target session detaches or closes
      if (event?.method === 'Target.detachedFromTarget') {
        const detachedSessionId = event.params?.sessionId;
        const detachedTargetId = event.params?.targetId || (detachedSessionId ? workerSessionToTargetId.get(detachedSessionId) : null);
        if (detachedTargetId && item.attachedWorkerTargets) {
          item.attachedWorkerTargets.delete(detachedTargetId);
        }
        if (detachedSessionId) {
          workerSessionToTargetId.delete(detachedSessionId);
          try { requestHeaderRewriter.cleanupSession(detachedSessionId); } catch (_) {}
          try { fontResponseRewriter.cleanupSession?.(detachedSessionId); } catch (_) {}
        }
        return;
      }

      // If an initial target closes before attaching, unblock barrier without hanging
      if (event?.method === 'Target.targetDestroyed') {
        const destroyedId = event.params?.targetId;
        if (destroyedId && item.attachedWorkerTargets) {
          item.attachedWorkerTargets.delete(destroyedId);
        }
        if (destroyedId && pendingInitialTargets.has(destroyedId)) {
          pendingInitialTargets.delete(destroyedId);
          if (pendingInitialTargets.size === 0) {
            settleBarrier();
          }
        }
        return;
      }

      if (event.method !== 'Target.attachedToTarget') return;
      const { sessionId, targetInfo = {}, waitingForDebugger } = event.params || {};
      if (!sessionId) return;
      const targetId = targetInfo.targetId;
      if (targetId) workerSessionToTargetId.set(sessionId, targetId);
      const isInitial = Boolean(targetId && pendingInitialTargets.has(targetId));

      (async () => {
        // A fresh tab (window.open with noopener, ctrl-click, or any target opened without an
        // opener) can attach while its renderer still has no execution context. Every session
        // command then waits out its full timeout, and because the target stays paused on
        // waitForDebuggerOnStart until the end of the block, the user faces a blank tab for that
        // whole time. Keep one resume latch so the pause is released as early as correctness
        // allows and never released twice.
        let pausedTargetNeedsResume = Boolean(waitingForDebugger);
        const resumeTarget = async () => {
          if (!pausedTargetNeedsResume) return;
          pausedTargetNeedsResume = false;
          await connection.command('Runtime.runIfWaitingForDebugger', {}, { sessionId, timeout: 3000 })
            .catch(() => {});
        };
        const armResponseRewriting = async (timeout) => {
          if (targetInfo.type === 'iframe') return;
          try {
            await fontResponseRewriter.enable(connection, { sessionId, timeout });
            await connection.command('Fetch.enable', {
              patterns: [
                { urlPattern: '*', requestStage: 'Request' },
                { urlPattern: '*', requestStage: 'Response', resourceType: 'Document' },
                { urlPattern: '*', requestStage: 'Response', resourceType: 'Stylesheet' },
              ],
            }, { sessionId, timeout }).catch(() => {});
          } catch (_) {}
        };
        try {
          const pageLikeTypes = new Set(['page', 'iframe', 'popup', 'webview']);
          if (targetInfo.type === 'page' || targetInfo.type === 'iframe' || pageLikeTypes.has(targetInfo.type)) {
            // Nested attach so workers/iframes under this page also pause for inject.
            await connection.command('Target.setAutoAttach', {
              autoAttach: true,
              waitForDebuggerOnStart: true,
              flatten: true,
            }, { sessionId }).catch(() => {});
            if (isInitial) {
              // Startup barrier targets are known-ready and must be sanitized before first paint.
              // Critical: inject fingerprint BEFORE resuming the page/iframe target.
              // Polling in startRunningWatch is only a fallback, not the primary path.
              await this.applyFingerprintToSession(connection, sessionId, item, fingerprint, { ...targetInfo, waitingForDebugger });
              // Enable Fetch while this page/iframe is paused. The next navigation then receives
              // sanitized HTML/CSS bytes before the renderer tokenizes its static styles.
              await armResponseRewriting(8000);
              if (!completedInitialTargets.has(targetId)) {
                completedInitialTargets.add(targetId);
                pendingInitialTargets.delete(targetId);
                if (pendingInitialTargets.size === 0) {
                  settleBarrier();
                }
              }
            } else {
              // Late-created target: bound the inject, resume, then arm rewriting in the
              // background. Response rewriting only has to be armed before the *next* document
              // load, and a tab that the user just opened has no document worth sanitizing yet.
              const injectBudget = targetInfo.type === 'iframe' ? 1500 : 2500;
              await Promise.race([
                Promise.resolve(this.applyFingerprintToSession(connection, sessionId, item, fingerprint, { ...targetInfo, waitingForDebugger }))
                  .catch((error) => report(error, targetInfo)),
                new Promise((resolve) => { const timer = setTimeout(resolve, injectBudget); if (timer && typeof timer.unref === 'function') timer.unref(); }),
              ]);
            }
            await resumeTarget();
            if (!isInitial) armResponseRewriting(2500).catch(() => {});
          } else if (workerTypes.has(targetInfo.type) && !internalUrl.test(String(targetInfo.url || ''))) {
            if (!item.attachedWorkerTargets) item.attachedWorkerTargets = new Set();
            if (targetId && item.attachedWorkerTargets.has(targetId)) {
              await resumeTarget();
              return;
            }
            if (targetId) item.attachedWorkerTargets.add(targetId);
            const isServiceWorker = targetInfo.type === 'service_worker';
            if (!isServiceWorker) {
              await connection.command('Network.enable', {}, { sessionId }).catch(() => {});
              const workerUa = requestHeaderRewriter.enabled ? requestHeaderRewriter.persona : null;
              if (workerUa) {
                await connection.command('Network.setUserAgentOverride', {
                  userAgent: workerUa.userAgent,
                  acceptLanguage: workerUa.acceptLanguage,
                  platform: workerUa.platformNav || workerUa.platform,
                  userAgentMetadata: workerUa.metadata,
                }, { sessionId }).catch(() => {});
                await connection.command('Emulation.setUserAgentOverride', {
                  userAgent: workerUa.userAgent,
                  acceptLanguage: workerUa.acceptLanguage,
                  platform: workerUa.platformNav || workerUa.platform,
                  userAgentMetadata: workerUa.metadata,
                }, { sessionId }).catch(() => {});
              }
              await connection.command('Fetch.enable', {
                patterns: [{ urlPattern: '*', requestStage: 'Request' }],
              }, { sessionId, timeout: 8000 }).catch(() => {});
            }
            // Worker fingerprint injection (DedicatedWorker, SharedWorker, and ServiceWorker)
            // Evaluated before runIfWaitingForDebugger so the worker global scope carries persona
            // mocks before evaluating initial worker scripts. Short timeout guarantees no hang.
            await connection.command('Runtime.evaluate', {
              expression: source,
            }, { sessionId, timeout: 3000 }).catch((evalErr) => {
              report(evalErr, targetInfo);
            });
          }
        } catch (error) {
          report(error, targetInfo);
          this.emit({
            type: 'fingerprint-injection-failed',
            id: item.profile?.id,
            targetType: targetInfo.type || '',
            message: error.message,
          });
          if (isInitial) {
            settleBarrier(new Error(`Initial target session attach failed for ${targetId}: ${error.message}`));
          }
        } finally {
          // Release the pause on every path, including a rejected inject: a target left waiting
          // for the debugger never paints, so failing closed here means a permanent blank tab.
          if (pausedTargetNeedsResume) {
            pausedTargetNeedsResume = false;
            await connection.command('Runtime.runIfWaitingForDebugger', {}, { sessionId, timeout: 3000 })
              .catch((error) => report(error, targetInfo));
          }
        }
      })();
    };

    const connection = await cdp.connect(browserWs, {
      onEvent: onAttached,
      // Pin this browser's own persona for service-worker injection (see the
      // cdp.connect wrapper): prevents cross-profile fingerprint bleed when
      // several environments start concurrently.
      serviceWorkerFingerprint: fingerprint,
      serviceWorkerLogContext: {
        profile: item.profile,
        logger: (details) => {
          if (details?.type === 'fingerprint-injection-failed') {
            item.workerFingerprintError = String(details?.message || '');
          }
        },
      },
      onDisconnect: (error) => {
        try { requestHeaderRewriter.destroy(); } catch (_) {}
        try { fontResponseRewriter.destroy?.(); } catch (_) {}
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
      try { requestHeaderRewriter.destroy(); } catch (_) {}
      try { fontResponseRewriter.destroy?.(); } catch (_) {}
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
        discoveredTargets = targetsRes?.targetInfos || [];
      } catch (_) {
        try {
          const fallbackTargets = await cdp.targets(item.port);
          discoveredTargets = fallbackTargets || [];
        } catch (_) {}
      }

      for (const t of discoveredTargets) {
        const tid = t.targetId || t.id;
        const ttype = t.type;
        const turl = String(t.url || '');
        const pageLikeTypes = new Set(['page', 'iframe', 'popup', 'webview']);
        if ((ttype === 'page' || ttype === 'iframe' || pageLikeTypes.has(ttype)) && !internalUrl.test(turl) && tid) {
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
    const isWaiting = Boolean(targetInfo?.waitingForDebugger || targetInfo?.isWaiting || !targetInfo?.url || targetInfo?.url === 'about:blank');
    const sessionCall = async (method, params = {}, timeout = 8000) => {
      try {
        // Optimization: on targets paused waiting for debugger at startup, Runtime.evaluate
        // blocks until Runtime.runIfWaitingForDebugger is called, hanging for 6-8s timeout.
        // Page.addScriptToEvaluateOnNewDocument already guarantees sync execution on document start.
        if (isWaiting && method === 'Runtime.evaluate') {
          return {};
        }
        return await connection.command(method, params, { sessionId, timeout });
      } catch (err) {
        if (isSubframe && /Command can only be executed on top-level targets|Cannot find default execution context/i.test(String(err?.message || err))) {
          return {};
        }
        throw err;
      }
    };
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
      applyKey: `session:${targetInfo?.targetId || sessionId}`,
      targetType: targetInfo?.type,
      isSubframe,
      livePatchDocument: isEphemeralDocumentUrl(targetInfo?.url),
    });
    // Synchronize Blink physical layout scaling with target devicePixelRatio for desktop personas.
    // Without setDeviceMetricsOverride, Blink computes CSS @media (resolution) at host 1dppx,
    // creating an observable contradiction with window.devicePixelRatio and JS matchMedia.
    const dpr = Number(injectFp?.screen?.devicePixelRatio);
    if (dpr && dpr !== 1 && !injectFp?.mobileDevice && !isSubframe && targetInfo?.type !== 'iframe') {
      await sessionCall('Emulation.setDeviceMetricsOverride', {
        width: 0,
        height: 0,
        deviceScaleFactor: dpr,
        mobile: false,
      }).catch(() => {});
    }
    if (!item.fpAppliedTargets) item.fpAppliedTargets = new Set();
    if (targetInfo?.targetId) item.fpAppliedTargets.add(targetInfo.targetId);
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
        ok: true,
        blocked: false,
        mismatches: [],
        warnings: ['未获取到调试端口，跳过指纹交付校验'],
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
          }, timeout);
          liveProbe = probeRes?.result?.value || probeRes?.value || null;
        }
      } catch (err) {
        probeWarning = "CDP 探针执行异常: " + (err?.message || String(err));
        liveProbe = { probeError: probeWarning };
      }
    }

    const targetFp = fingerprint || item?.fingerprint || {};
    const evalResult = evaluateFingerprintDelivery(profile, targetFp, liveProbe);
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
  /**
   * After start-page navigation: inject fingerprint, probe live surfaces, reload once
   * if still looks like the host machine. Writes diagnostics to fingerprint-inject.log.
   */
  async ensureStartPageFingerprint(item, profile, injectFp, startUrl) {
    const port = item?.port;
    if (!port) return null;
    const sleep = (ms) => new Promise((r) => { const t = setTimeout(r, ms); t.unref?.(); });
    // Give navigation a moment to produce a target URL.
    for (let i = 0; i < 10; i += 1) {
      const tabs = await cdp.tabs(port).catch(() => []);
      if (tabs.some((t) => this.isStartPageUrl(t.url) || /about:blank/i.test(String(t.url || '')))) break;
      await sleep(100);
    }
    await this.applyRuntimeSettings(port, profile, injectFp, {
      appliedTargetIds: item?.fpAppliedTargets instanceof Set ? item.fpAppliedTargets : new Set(),
      appliedFingerprintHash: item?.fpAppliedHash,
      trackOn: item,
      phase: 'post-startpage',
    });
    // Short settle before the first repaint request; the retry below covers a slower boot.
    await sleep(120);
    // Ask welcome page to repaint fingerprint table from spoofed navigator.
    // Retry a few times: start-page script may still be booting. Stop as soon as the page
    // confirms it ran the collector — it re-samples itself on a timer after that, so extra
    // rounds only added fixed delay to the launch (this loop always ran its full 3 rounds
    // and slept after the last one because the result was discarded).
    for (let repaint = 0; repaint < 3; repaint += 1) {
      let collected = false;
      try {
        const tabsR = await cdp.tabs(port).catch(() => []);
        for (const tab of tabsR) {
          if (!tab.webSocketDebuggerUrl) continue;
          if (!this.isStartPageUrl(tab.url) && !/about:blank/i.test(String(tab.url || ''))) continue;
          const outcome = await cdp.call(tab.webSocketDebuggerUrl, 'Runtime.evaluate', {
            expression: `(() => { try { if (typeof window.__openbrowserCollectFingerprint === 'function') { window.__openbrowserCollectFingerprint('post-inject-${repaint}'); return 'ok'; } return 'missing'; } catch (e) { return String(e && e.message || e); } })()`,
            returnByValue: true,
          }, 3000).catch(() => null);
          if ((outcome?.result?.value ?? outcome?.value) === 'ok') collected = true;
        }
      } catch (_) {}
      if (collected) break;
      await sleep(200);
    }
    const tabs = await cdp.tabs(port).catch(() => []);
    const page = tabs.find((t) => this.isStartPageUrl(t.url)) || tabs[0];
    if (!page?.webSocketDebuggerUrl) {
      await fpLog('probe.no-tab', { profileId: profile.id, port, tabCount: tabs.length });
      return null;
    }
    let live = null;
    try {
      const probe = await cdp.call(page.webSocketDebuggerUrl, 'Runtime.evaluate', {
        expression: LIVE_PROBE_EXPRESSION,
        returnByValue: true,
      }, 8000);
      live = probe?.result?.value || probe?.value || null;
    } catch (error) {
      live = { probeError: String(error.message || error) };
    }
    const intended = summarizeFp(injectFp);
    const hostLikeWebgl = Boolean(live?.webglRenderer && /Radeon|GeForce|Intel\(R\)|W6800|RX |GTX |RTX /i.test(String(live.webglRenderer)))
      && intended?.webglRenderer
      && String(live.webglRenderer) !== String(intended.webglRenderer);
    const hostLikeCores = intended?.hardwareConcurrency != null
      && live?.hardwareConcurrency != null
      && Number(live.hardwareConcurrency) !== Number(intended.hardwareConcurrency)
      && Number(live.hardwareConcurrency) >= 12;
    const bad = hostLikeWebgl || hostLikeCores
      || (intended?.userAgent && live?.userAgent && intended.userAgent !== live.userAgent);
    await fpLog('probe.startpage', {
      profileId: profile.id,
      port,
      url: page.url,
      intended,
      live,
      hostLikeWebgl,
      hostLikeCores,
      bad,
    });
    if (!bad) return live;

    // Hard recovery: re-register document-start script and reload start page.
    await fpLog('probe.reload-startpage', { profileId: profile.id, reason: { hostLikeWebgl, hostLikeCores } });
    try {
      const fontBlobBridge = injectFp?.fontBlobBridge || profile?.fingerprint?.fontBlobBridge || item?.fontBlobBridge;
      if (fontBlobBridge?.channelName && page?.webSocketDebuggerUrl) {
        try {
          await cdp.call(page.webSocketDebuggerUrl, 'Runtime.enable', {}).catch(() => {});
          await cdp.call(page.webSocketDebuggerUrl, 'Runtime.addBinding', { name: fontBlobBridge.channelName }).catch((err) => {
            const msg = String(err?.message || err);
            if (!/already exists/i.test(msg)) {}
          });
        } catch (_) {}
      }
      await applyFingerprintToTab(cdp.call, page.webSocketDebuggerUrl, injectFp, profile, { force: true });
      await cdp.call(page.webSocketDebuggerUrl, 'Page.enable', {}).catch(() => {});
      if (startUrl) await cdp.call(page.webSocketDebuggerUrl, 'Page.navigate', { url: startUrl });
      else await cdp.call(page.webSocketDebuggerUrl, 'Page.reload', { ignoreCache: true });
      await sleep(600);
      await this.applyRuntimeSettings(port, profile, injectFp, {
        appliedTargetIds: item?.fpAppliedTargets instanceof Set ? item.fpAppliedTargets : new Set(),
        appliedFingerprintHash: item?.fpAppliedHash,
        trackOn: item,
        phase: 'post-reload',
      });
      const tabs2 = await cdp.tabs(port).catch(() => []);
      const page2 = tabs2.find((t) => this.isStartPageUrl(t.url)) || tabs2[0];
      if (page2?.webSocketDebuggerUrl) {
        const probe2 = await cdp.call(page2.webSocketDebuggerUrl, 'Runtime.evaluate', {
          expression: LIVE_PROBE_EXPRESSION,
          returnByValue: true,
        }, 8000).catch((e) => ({ result: { value: { probeError: String(e.message || e) } } }));
        const live2 = probe2?.result?.value || probe2?.value || null;
        await fpLog('probe.after-reload', { profileId: profile.id, live: live2, intended });
        return live2;
      }
    } catch (error) {
      await fpLog('probe.reload-fail', { profileId: profile.id, error: String(error.message || error) });
    }
    return live;
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
    const fingerprint = buildFingerprint(profile);
    // Firefox has no CDP, so nothing can inject or verify this expectation.
    // Mark it intent-only at the source (parity with publicRunning's
    // capabilities) so downstream consumers cannot mistake it for a
    // delivery promise. Keep the shape: existing readers of the fields still
    // work, they just see the extra marker.
    if (this.profilePrefersFirefox?.(profile)) {
      fingerprint.delivery = 'intent-only';
      fingerprint.undeliverable = 'Firefox 无 CDP：该指纹期望无法注入或验证，仅为配置意图。';
    }
    return fingerprint;
  },

fingerprintConfigHash,
isEphemeralDocumentUrl,
};
