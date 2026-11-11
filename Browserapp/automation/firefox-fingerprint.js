'use strict';

const crypto = require('node:crypto');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript, assertFingerprintConsistency } = require('./fingerprint');
const { firefoxUserAgent } = require('./kernel-versions');
const { evaluateFingerprintDelivery } = require('./request-header-rewriter');
const { LIVE_PROBE_EXPRESSION } = require('./fingerprint-debug-log');
const { evaluateBidi } = require('../network/bidi-connection');
const { startupNavigationUrl } = require('../engine/startup-session');
const { assertUrlAccessPolicySupported } = require('./url-access-policy');

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
  // The emulation commands below are context-scoped in current WebDriver BiDi (the spec
  // requires `contexts`, and Firefox 160 rejects the call without it), so the tree has to
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
      await connection.command('emulation.setGeolocationOverride', { coordinates: location });
    }
  };
  await applyEmulation(topLevelContexts, 'initial');
  // Omitting sandbox is essential: prototypes must be patched in the page's main realm.
  const source = buildInjectionScript(fingerprint);
  const preload = await connection.command('script.addPreloadScript', { functionDeclaration: `() => {\n${source}\n}` });
  if (!preload.script) throw new Error('Firefox did not register the fingerprint preload script');
  const workerSource = buildWorkerInjectionScript(fingerprint);
  const previousEvent = connection.onEvent;
  connection.onEvent = async (event, conn) => {
    await previousEvent?.(event, conn);
    const realm = event.params;
    if (event.method === 'script.realmCreated' && /worker$/.test(realm?.type || '')) {
      try { await evaluateBidi(conn, { realm: realm.realm }, workerSource); }
      catch (error) { options.onWorkerError?.(error); }
    }
    if (event.method === 'browsingContext.contextCreated' && realm?.context) {
      try { await applyEmulation([realm.context], 'new-context'); }
      catch (error) { warnings.push(`emulation(new context ${realm.context}): ${error.message}`); }
    }
  };
  await connection.command('session.subscribe', { events: ['script.realmCreated', 'browsingContext.contextCreated'] });
  for (const context of contexts) {
    await evaluateBidi(connection, { context: context.context }, source);
    const live = await evaluateBidi(connection, { context: context.context }, LIVE_PROBE_EXPRESSION);
    const verified = evaluateFingerprintDelivery(profile, fingerprint, live, { strict: true });
    if (!verified.ok) throw new Error('Firefox 指纹交付校验失败：' + verified.mismatches.map((m) => m.message).join('; '));
  }
  return {
    context: contexts[0].context, preload: preload.script, warnings,
    capabilities: {
      engine: 'firefox', cdp: false, bidi: true, fingerprintDelivery: true,
      fingerprintVerification: true, runtimeInjection: true, documentStartInjection: true,
      workerFingerprintDelivery: false, workerInjection: 'best-effort',
      deviceMemoryOverride: false, extensionHotLoad: false, zoomReconcile: false,
      retention: true, startUrls: true,
    },
  };
}

async function navigateFirefoxStartup(connection, context, urls) {
  urls = [...new Set(urls.map(startupNavigationUrl).filter(Boolean))];
  for (let index = 0; index < urls.length; index += 1) {
    const target = index === 0 ? context : (await connection.command('browsingContext.create', { type: 'tab' })).context;
    await connection.command('browsingContext.navigate', { context: target, url: urls[index], wait: 'interactive' }, 15000);
  }
}

module.exports = { buildFirefoxFingerprint, initializeFirefoxFingerprint, navigateFirefoxStartup };
