'use strict';

const crypto = require('node:crypto');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript, assertFingerprintConsistency } = require('./fingerprint');
const { firefoxUserAgent } = require('./kernel-versions');
const { evaluateFingerprintDelivery } = require('./request-header-rewriter');
const { LIVE_PROBE_EXPRESSION } = require('./fingerprint-debug-log');
const { evaluateBidi } = require('../network/bidi-connection');
const { startupNavigationUrl } = require('../engine/startup-session');
const { assertUrlAccessPolicySupported } = require('./url-access-policy');

// Context events and startup navigation share the same in-flight native setup.
const contextEmulation = new WeakMap();

function buildFirefoxFingerprint(profile, version) {
  assertUrlAccessPolicySupported(profile, 'firefox');
  if (/android|ios|iphone|ipad/i.test(profile.os || '')) throw new Error('Firefox 当前支持桌面设备配置，请选择 Windows、macOS 或 Linux');
  const os = /mac|darwin/i.test(profile.os) ? 'mac' : (/win/i.test(profile.os) ? 'win' : 'linux');
  const pinned = profile.privacy?.fingerprint?.userAgent || (profile.privacy?.fingerprint?.uaGenerated ? '' : profile.userAgent);
  if (pinned && (!/Firefox\//i.test(pinned) || /Chrome\//i.test(pinned))) {
    throw new Error('Firefox 环境需要 Firefox/Gecko UA；清空 UA 可按实际内核自动生成');
  }
  const fp = buildFingerprint({
    ...profile, osVersion: '', kernelVersion: version,
    userAgent: pinned || firefoxUserAgent(os, version),
    fingerprintLaunchSeed: profile.privacy?.refreshFingerprintOnStart ? crypto.randomBytes(16).toString('hex') : '',
  });
  fp.engine = 'firefox';
  fp.vendor = '';
  fp.uaProfile.vendor = '';
  fp.deviceMemory = null;
  fp.connection = null;
  fp.staticConfig.deviceMemory = null;
  fp.lazyFontPayload = false;
  fp.fontBlobBridge = null;
  assertFingerprintConsistency(fp);
  return fp;
}

async function initializeFirefoxFingerprint(connection, fingerprint, profile, options = {}) {
  const warnings = [];
  await connection.command('session.new', { capabilities: { alwaysMatch: { acceptInsecureCerts: Boolean(profile.advanced?.ignoreHttpsError) } } });
  // Apply native emulation to explicit top-level contexts, so the tree has to
  // be resolved BEFORE the emulation phase. The preload registration is order-independent:
  // it applies to every future document in every context, including tabs opened later.
  const tree = await connection.command('browsingContext.getTree', {});
  const contexts = tree.contexts || [];
  if (!contexts.length) throw new Error('Firefox has no initial browsing context');
  const topLevelContexts = contexts.map((c) => c.context);
  // New top-level tabs are covered by the global preload (UA/JS surfaces), but the
  // context-scoped emulation overrides have to be re-applied per context, so the arrival
  // event is subscribed before any new tab can open.
  const applyEmulation = async (contextIds, label) => {
    if (!contextIds.length) return;
    const scoped = async (method, params) => {
      try { return await connection.command(method, { contexts: contextIds, ...params }); }
      catch (error) {
        // Older builds reject the then-unknown `contexts` field; retry once without it so
        // an ERI kernel keeps working while a current one gets the scoped form.
        if (String(error.code || error.message || '').includes('invalid argument')) {
          return connection.command(method, params);
        }
        throw error;
      }
    };
    try { await scoped('emulation.setUserAgentOverride', { userAgent: fingerprint.userAgent }); }
    catch (error) { warnings.push(`emulation.setUserAgentOverride(${label}): ${error.message}`); }
    if (fingerprint.timezone) {
      try { await scoped('emulation.setTimezoneOverride', { timezone: fingerprint.timezone }); }
      catch (error) { warnings.push(`emulation.setTimezoneOverride(${label}): ${error.message}`); }
    }
    // No emulation.setLocaleOverride: on Firefox 160 the BiDi locale override rewrites the
    // Accept-Language HTTP header to the bare single locale ("de-DE"), destroying the
    // persona's language chain that intl.accept_languages would otherwise ship (measured:
    // pref "de-DE,de" alone produces header "de-DE,de;q=0.9" with a clean JS surface). The
    // Intl runtime surfaces are owned by the document injection and the TZ environment, and
    // navigator.language(s) by the injection (plus the pref in worker scopes).
    const location = fingerprint.dynamicConfig?.geoposition;
    if (location) {
      // There is no safe host-location fallback when the configured position cannot be delivered.
      await scoped('emulation.setGeolocationOverride', { coordinates: location });
    }
  };
  const pendingContexts = new Map();
  const initialEmulation = applyEmulation(topLevelContexts, 'initial');
  for (const context of topLevelContexts) pendingContexts.set(context, initialEmulation);
  await initialEmulation;
  const ensureContext = (context, label = 'new-context') => {
    if (!pendingContexts.has(context)) {
      const task = Promise.resolve().then(() => applyEmulation([context], label));
      // An event handler can await an earlier listener before observing this task.
      task.catch(() => {});
      pendingContexts.set(context, task);
    }
    return pendingContexts.get(context);
  };
  // Omitting sandbox is essential: prototypes must be patched in the page's main realm.
  const source = buildInjectionScript(fingerprint);
  const preload = await connection.command('script.addPreloadScript', { functionDeclaration: `() => {\n${source}\n}` });
  if (!preload.script) throw new Error('Firefox did not register the fingerprint preload script');
  const workerSource = buildWorkerInjectionScript(fingerprint);
  const previousEvent = connection.onEvent;
  connection.onEvent = async (event, conn) => {
    const realm = event.params;
    // Child frames inherit top-level native settings; the emulation commands do
    // not accept frame contexts. Reserve the task before awaiting other listeners.
    const contextReady = event.method === 'browsingContext.contextCreated' && realm?.context && realm.parent == null
      ? ensureContext(realm.context) : null;
    if (event.method === 'browsingContext.contextDestroyed') pendingContexts.delete(realm?.context);
    await previousEvent?.(event, conn);
    // Required native failures propagate to BiDi's fatal event/disconnect path.
    if (contextReady) await contextReady;
    if (event.method === 'script.realmCreated' && /worker$/.test(realm?.type || '')) {
      try { await evaluateBidi(conn, { realm: realm.realm }, workerSource); }
      catch (error) { options.onWorkerError?.(error); }
    }
  };
  await connection.command('session.subscribe', { events: ['script.realmCreated', 'browsingContext.contextCreated', 'browsingContext.contextDestroyed'] });
  for (const context of contexts) {
    await evaluateBidi(connection, { context: context.context }, source);
    const live = await evaluateBidi(connection, { context: context.context }, LIVE_PROBE_EXPRESSION);
    const verified = evaluateFingerprintDelivery(profile, fingerprint, live, { strict: true });
    if (!verified.ok) throw new Error('Firefox 指纹交付校验失败：' + verified.mismatches.map((m) => m.message).join('; '));
  }
  const permissionOrigins = new Set();
  const prepareNavigation = async (url) => {
    if (!['granted', 'denied'].includes(fingerprint.geoPermission)) return;
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || permissionOrigins.has(parsed.origin)) return;
    await connection.command('permissions.setPermission', {
      descriptor: { name: 'geolocation' }, state: fingerprint.geoPermission, origin: parsed.origin,
    });
    permissionOrigins.add(parsed.origin);
  };
  contextEmulation.set(connection, { ensureContext, prepareNavigation });
  return {
    context: contexts[0].context, preload: preload.script, warnings,
    capabilities: {
      engine: 'firefox', cdp: false, bidi: true, fingerprintDelivery: true,
      fingerprintVerification: true, runtimeInjection: true, documentStartInjection: true,
      workerFingerprintDelivery: options.workerProxyReady === true ? 'prefs-fields-plus-proxy' : 'prefs-fields',
      workerInjection: options.workerProxyReady === true
        ? 'Prefs cover UA/platform/languages/timezone. Newly fetched HTTP(S) worker scripts routed through the trusted per-profile forwarder receive JS-only fields; blob/data, cached scripts, static module dependencies and local bypasses are not certified.'
        : 'Prefs cover UA/platform/languages/timezone; asynchronous realm injection does not guarantee JS-only fields before the first worker instruction.',
      deviceMemoryOverride: false, extensionHotLoad: false, zoomReconcile: false,
      retention: true, startUrls: true,
    },
  };
}

async function navigateFirefoxStartup(connection, context, urls) {
  const policy = contextEmulation.get(connection);
  if (!policy) throw new Error('Firefox fingerprint initialization is required before navigation');
  urls = [...new Set(urls.map(startupNavigationUrl).filter(Boolean))];
  for (let index = 0; index < urls.length; index += 1) {
    const target = index === 0 ? context : (await connection.command('browsingContext.create', { type: 'tab' })).context;
    if (!target) throw new Error('Firefox did not create a browsing context');
    await policy.ensureContext(target, 'startup');
    await policy.prepareNavigation(urls[index]);
    await connection.command('browsingContext.navigate', { context: target, url: urls[index], wait: 'interactive' }, 15000);
  }
}

module.exports = { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup };
