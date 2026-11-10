'use strict';

/**
 * CDP-layer hardening, extracted from engine.js: sanitization of every script
 * that crosses the CDP boundary (addScriptToEvaluateOnNewDocument /
 * Runtime.evaluate) and the connect-time wrapper that pins each browser
 * connection's service workers to that profile's fingerprint.
 *
 * The patches are idempotent (guarded by cdp.__scriptSanitized /
 * cdp.__serviceWorkerHardened) and are installed once at engine.js module
 * load, before any connection is opened.
 */

const SANITIZE_MARKERS = ['secret', '[object Navigator]', '[object WorkerNavigator]', '/^Mozilla//'];

function sanitizeInjectionScript(source) {
  if (typeof source !== 'string' || !source) return source;
  // Fast path: when none of the patch targets is present, skip the five
  // full-string scans. Fingerprint payloads run multi-MB through every CDP
  // addScript/evaluate, so the scans are a fixed per-command tax otherwise.
  if (!SANITIZE_MARKERS.some((marker) => source.includes(marker))) return source;
  let out = source.split('/^Mozilla//').join('/^Mozilla\\//');
  out = out.replace(/typeof secret === "string" && secret\.length > 0/g, 'secret === "__UA_BRIDGE_TOKEN__"');
  out = out.replace(
    'if (typeof Navigator !== "undefined" && (receiver instanceof Navigator || Object.prototype.toString.call(receiver) === "[object Navigator]")) return true;',
    'if (typeof Navigator !== "undefined" && receiver !== Navigator.prototype && (receiver instanceof Navigator || (Object.prototype.toString.call(receiver) === "[object Navigator]" && !Navigator.prototype.isPrototypeOf(receiver) && receiver !== Navigator.prototype))) return true;'
  );
  out = out.replace(
    'if (typeof WorkerNavigator !== "undefined" && (receiver instanceof WorkerNavigator || Object.prototype.toString.call(receiver) === "[object WorkerNavigator]")) return true;',
    'if (typeof WorkerNavigator !== "undefined" && receiver !== WorkerNavigator.prototype && (receiver instanceof WorkerNavigator || (Object.prototype.toString.call(receiver) === "[object WorkerNavigator]" && !WorkerNavigator.prototype.isPrototypeOf(receiver) && receiver !== WorkerNavigator.prototype))) return true;'
  );
  return out;
}

/**
 * Install the CDP hardening patches on the shared cdp module.
 * @param {object} cdp the ./cdp module instance
 * @param {Function} buildWorkerInjectionScript worker-realm injection builder
 *   (injected so this module stays free of fingerprint-package coupling)
 */
function installCdpHardening(cdp, { buildWorkerInjectionScript }) {
if (!cdp.__scriptSanitized) {
  cdp.__scriptSanitized = true;
  const origCdpCall = cdp.call;
  if (typeof origCdpCall === 'function') {
    cdp.call = function (webSocketUrl, method, params = {}, timeout) {
      if (method === 'Page.addScriptToEvaluateOnNewDocument' && params && typeof params.source === 'string') {
        params.source = sanitizeInjectionScript(params.source);
      }
      if (method === 'Runtime.evaluate' && params && typeof params.expression === 'string') {
        params.expression = sanitizeInjectionScript(params.expression);
      }
      return origCdpCall.call(this, webSocketUrl, method, params, timeout);
    };
  }
  if (cdp.PersistentConnection && cdp.PersistentConnection.prototype) {
    const origCommand = cdp.PersistentConnection.prototype.command;
    cdp.PersistentConnection.prototype.command = function (method, params = {}, options = {}) {
      if (method === 'Page.addScriptToEvaluateOnNewDocument' && params && typeof params.source === 'string') {
        params.source = sanitizeInjectionScript(params.source);
      }
      if (method === 'Runtime.evaluate' && params && typeof params.expression === 'string') {
        params.expression = sanitizeInjectionScript(params.expression);
      }
      return origCommand.call(this, method, params, options);
    };
  }
}

if (!cdp.__serviceWorkerHardened) {
  cdp.__serviceWorkerHardened = true;
  const origConnect = cdp.connect;
  cdp.connect = async function (webSocketUrl, options = {}) {
    const originalOnEvent = options.onEvent;
    // Per-connection persona: the caller (startWorkerFingerprintInjection) pins
    // the exact fingerprint that belongs to THIS browser connection. When the
    // option is absent we skip injection entirely — we must NEVER fall back to
    // a process-global "latest" fingerprint: two profiles starting concurrently
    // would otherwise cross-inject each other's identity into service workers.
    const serviceWorkerFingerprint = options.serviceWorkerFingerprint || null;
    const serviceWorkerLogContext = options.serviceWorkerLogContext || null;
    const attachedWorkerTargets = new Set();
    const sessionToTargetId = new Map();
    const wrappedOptions = { ...options };
    delete wrappedOptions.serviceWorkerFingerprint;
    delete wrappedOptions.serviceWorkerLogContext;
    wrappedOptions.onEvent = async (event, conn) => {
      if (event?.method === 'Target.attachedToTarget') {
        const { sessionId, targetInfo = {}, waitingForDebugger } = event.params || {};
        const targetId = targetInfo.targetId;
        if (sessionId && targetId) sessionToTargetId.set(sessionId, targetId);
        if (sessionId && targetInfo.type === 'service_worker') {
          if (targetId && attachedWorkerTargets.has(targetId)) {
            if (waitingForDebugger) {
              await conn.command('Runtime.runIfWaitingForDebugger', {}, { sessionId }).catch(() => {});
            }
            return;
          }
          if (targetId) attachedWorkerTargets.add(targetId);
          const fp = serviceWorkerFingerprint;
          if (fp) {
            const logFailure = (err) => {
              const logger = serviceWorkerLogContext?.logger;
              if (typeof logger === 'function') {
                logger({
                  type: 'fingerprint-injection-failed',
                  id: serviceWorkerLogContext?.profile?.id,
                  targetType: 'service_worker',
                  stage: 'worker-inject',
                  operation: 'sw-evaluate',
                  message: err?.message || String(err),
                });
              }
            };
            try {
              const source = buildWorkerInjectionScript(fp);
              await conn.command('Runtime.evaluate', { expression: source }, { sessionId, timeout: 2000 }).catch((evalErr) => {
                logFailure(evalErr);
              });
            } catch (err) {
              logFailure(err);
            }
          }
        }
      } else if (event?.method === 'Target.detachedFromTarget') {
        const sid = event.params?.sessionId;
        const tid = event.params?.targetId || (sid ? sessionToTargetId.get(sid) : null);
        if (tid) attachedWorkerTargets.delete(tid);
        if (sid) sessionToTargetId.delete(sid);
      } else if (event?.method === 'Target.targetDestroyed') {
        const tid = event.params?.targetId;
        if (tid) attachedWorkerTargets.delete(tid);
      }
      if (typeof originalOnEvent === 'function') {
        return originalOnEvent(event, conn);
      }
    };
    return origConnect.call(this, webSocketUrl, wrappedOptions);
  };
}
}

module.exports = {
  sanitizeInjectionScript,
  installCdpHardening,
};
