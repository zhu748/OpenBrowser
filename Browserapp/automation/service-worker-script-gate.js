'use strict';

const { buildWorkerInjectionScript } = require('./fingerprint');
const { buildWorkerDeliveryProbe } = require('./fingerprint/worker-injection');
const { canonicalBridgeToken } = require('./fingerprint/shared');
const { WORKER_RUNTIME_REVISION } = require('./fingerprint/runtime-revision');
const { MAX_WORKER_BYTES, injectionPosition } = require('./worker-source');
const syntax = require('./vendor/acorn-runtime');
const { normalizeNetworkInformation } = require('../shared/profile-values');

// Older releases persisted their injected prefix inside Chromium's SW script
// cache. Let only those exact token/revision checks return early after the new
// identity is installed. Application globals and cached scripts stay untouched.
function cachedWorkerIdentities(script) {
  if (typeof script !== 'string' || Buffer.byteLength(script) > MAX_WORKER_BYTES) throw new Error('Service Worker script exceeds the delivery limit');
  const text = script.replace(/^\ufeff/, '');
  const identities = [];
  let position = injectionPosition(text);
  while (true) {
    const header = /^[\s;]*(\(function installWorkerIdentity\(originalWorkerUrl, constructorInstaller\) \{)/.exec(text.slice(position));
    if (!header) break;
    if (identities.length === 16) throw new Error('Too many cached Service Worker injection prefixes');
    const start = position + header[0].length - header[1].length;
    let end;
    try { end = syntax.parseExpressionAt(text, start, { ecmaVersion: 'latest', sourceType: 'module' }).end; }
    catch (_) { throw new Error('Unrecognized cached Service Worker injection prefix'); }
    // Inspect only our prefix expression. Similar text in application code or
    // string literals must not affect delivery or be interpreted as a token.
    const prefix = text.slice(start, end);
    const token = /const BRIDGE_TOKEN = "([a-f0-9]{32}(?:[a-f0-9]{32})?)";/.exec(prefix)?.[1];
    const revision = /\.call\(Function\.prototype\.toString, BRIDGE_TOKEN, 'workerInstalled'\) === (\d+)\) return;/.exec(prefix)?.[1];
    if (!token && !revision) break; // an application may reuse the function name
    if (!token || !revision) throw new Error('Unrecognized cached Service Worker injection prefix');
    identities.push([token, Number(revision)]);
    position = end;
  }
  return identities;
}

class ServiceWorkerScriptGate {
  constructor(state, fingerprint) {
    this.state = state;
    this.fingerprint = fingerprint;
    this.verified = false;
    this.scripts = new Set();
    this.started = new Promise(resolve => { this.markStarted = resolve; });
    this.completion = new Promise((resolve, reject) => { this.resolve = resolve;this.reject = reject; });
    this.completion.catch(() => {});
  }

  async resume() {
    const state = this.state;
    // Chrome 157 queues Debugger commands until the startup pause is released.
    // Send all three in protocol order before awaiting any reply. Awaiting enable
    // first deadlocks; arming after resume would allow the first script to run.
    const enabled = state.command('Debugger.enable', {}, { timeout: 5000 });
    this.armed = state.command('Debugger.setInstrumentationBreakpoint', { instrumentation: 'beforeScriptExecution' }, { timeout: 5000 });
    const resumed = state.command('Runtime.runIfWaitingForDebugger', {}, { timeout: 5000 });
    this.markStarted();
    let timer;
    try {
      await Promise.all([enabled, this.armed, resumed]);
      await state.run(() => Promise.race([this.completion, new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('Service Worker first-script delivery timed out')), 7000);
      })]));
    } finally { clearTimeout(timer); }
  }

  handlePaused(params) {
    if (this.handling) return this.handling;
    this.handling = this.inject(params).then(this.resolve, this.reject);
    return this.handling;
  }

  recordScript(params) {
    if (!this.handling && params.scriptId) this.scripts.add(params.scriptId);
  }

  async inject(params) {
    const state = this.state;
    if (params.reason !== 'instrumentation') throw new Error('Unexpected Service Worker pause before fingerprint delivery');
    const { breakpointId } = await this.armed;
    if (!breakpointId) throw new Error('Service Worker script breakpoint was not confirmed');
    const scriptId = params.data?.scriptId || params.callFrames?.[0]?.location?.scriptId;
    if (!scriptId) throw new Error('Service Worker script identity unavailable');
    this.scripts.add(scriptId);
    // Static module dependencies can execute before the entry module. All have
    // been parsed at this pause; include the entry's cached token as well.
    if (this.scripts.size > 512) throw new Error('Service Worker module graph exceeds the delivery limit');
    const retiredWorkerIdentities = [];
    let totalBytes = 0;
    for (const id of this.scripts) {
      const { scriptSource } = await state.command('Debugger.getScriptSource', { scriptId: id }, { timeout: 4000 });
      totalBytes += Buffer.byteLength(scriptSource || '');
      if (totalBytes > MAX_WORKER_BYTES * 2) throw new Error('Service Worker module graph exceeds the delivery limit');
      retiredWorkerIdentities.push(...cachedWorkerIdentities(scriptSource));
    }
    this.scripts.clear();
    const token = canonicalBridgeToken(this.fingerprint);
    if (retiredWorkerIdentities.some(([oldToken, revision]) => oldToken === token && revision !== WORKER_RUNTIME_REVISION)) {
      throw new Error('Cached Service Worker runtime revision is incompatible with the current identity');
    }
    await state.command('Debugger.removeBreakpoint', { breakpointId }, { timeout: 3000 });
    const source = buildWorkerInjectionScript(this.fingerprint, { retiredWorkerIdentities });
    const result = await state.command('Runtime.evaluate', { expression: source, disableBreaks: true }, { timeout: 5000 });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Service Worker fingerprint execution failed');
    const probe = await state.command('Runtime.evaluate', {
      expression: `(${buildWorkerDeliveryProbe(this.fingerprint)}) && (${function (expected) {
        if (expected.cores != null && navigator.hardwareConcurrency !== expected.cores) return false;
        if (navigator.userAgent !== expected.ua || navigator.platform !== expected.platform) return false;
        if (expected.timezone && Intl.DateTimeFormat().resolvedOptions().timeZone !== expected.timezone) return false;
        if (expected.connection && navigator.connection) {
          for (const key of ['rtt', 'downlink', 'effectiveType', 'saveData']) {
            if (key in expected.connection && key in navigator.connection && navigator.connection[key] !== expected.connection[key]) return false;
          }
        }
        return true;
      }.toString()})(${JSON.stringify({ cores: this.fingerprint.hardwareConcurrency, ua: this.fingerprint.userAgent,
        platform: this.fingerprint.platform, timezone: this.fingerprint.timezone, connection: normalizeNetworkInformation(this.fingerprint.connection) })})`,
      returnByValue: true, disableBreaks: true,
    }, { timeout: 3000 });
    if (probe.result?.value !== true) throw new Error('Service Worker fingerprint installation was not confirmed');
    await state.command('Debugger.setSkipAllPauses', { skip: true }, { timeout: 3000 });
    await state.command('Debugger.resume', {}, { timeout: 3000 });
    await state.command('Debugger.disable', {}, { timeout: 3000 });
    this.verified = true;
  }
}

module.exports = { ServiceWorkerScriptGate, cachedWorkerIdentities };
