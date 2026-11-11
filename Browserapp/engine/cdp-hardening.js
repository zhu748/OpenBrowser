'use strict';

/**
 * CDP-layer hardening, extracted from engine.js: sanitization of every script
 * that crosses the CDP boundary (addScriptToEvaluateOnNewDocument /
 * Runtime.evaluate) for the browser connection. Worker setup is owned by fingerprint-injection.js
 * so one path controls evaluation, network rewriting and debugger resume.
 *
 * The patches are idempotent (guarded by cdp.__scriptSanitized on
 * the shared cdp module) and are installed once at engine.js module
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
 */
function installCdpHardening(cdp) {
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

}

module.exports = {
  sanitizeInjectionScript,
  installCdpHardening,
};
