'use strict';

const crypto = require('node:crypto');
const { buildFingerprint, buildInjectionScript, buildWorkerInjectionScript } = require('./fingerprint');
const { firefoxUserAgent } = require('./kernel-versions');
const { evaluateFingerprintDelivery } = require('./request-header-rewriter');
const { LIVE_PROBE_EXPRESSION } = require('./fingerprint-debug-log');
const { evaluateBidi } = require('../network/bidi-connection');
const { startupNavigationUrl } = require('../engine/startup-session');

function buildFirefoxFingerprint(profile, version) {
  if (/android|ios|iphone|ipad/i.test(profile.os || '')) throw new Error('Firefox 当前支持桌面设备配置，请选择 Windows、macOS 或 Linux');
  const os = /mac|darwin/i.test(profile.os) ? 'mac' : (/win/i.test(profile.os) ? 'win' : 'linux');
  const pinned = profile.privacy?.fingerprint?.userAgent || profile.userAgent;
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
  return fp;
}

async function initializeFirefoxFingerprint(connection, fingerprint, profile, options = {}) {
  const warnings = [];
  const optional = async (method, params) => {
    try { await connection.command(method, params); return true; }
    catch (error) {
      if (error.code !== 'unknown command' && error.code !== 'unsupported operation') throw error;
      warnings.push(`${method}: ${error.message}`);
      return false;
    }
  };
  await connection.command('session.new', { capabilities: { alwaysMatch: { acceptInsecureCerts: Boolean(profile.advanced?.ignoreHttpsError) } } });
  // Omitting sandbox is essential: prototypes must be patched in the page's main realm.
  const source = buildInjectionScript(fingerprint);
  const preload = await connection.command('script.addPreloadScript', { functionDeclaration: `() => {\n${source}\n}` });
  if (!preload.script) throw new Error('Firefox did not register the fingerprint preload script');
  await optional('emulation.setUserAgentOverride', { userAgent: fingerprint.userAgent });
  const nativeTimezone = fingerprint.timezone
    ? await optional('emulation.setTimezoneOverride', { timezone: fingerprint.timezone })
    : false;
  await optional('emulation.setLocaleOverride', { locale: fingerprint.languages[0] });
  const location = fingerprint.dynamicConfig?.geoposition;
  if (location) {
    // There is no safe host-location fallback when the configured position cannot be delivered.
    await connection.command('emulation.setGeolocationOverride', { coordinates: location });
  }
  const workerSource = buildWorkerInjectionScript(fingerprint);
  const previousEvent = connection.onEvent;
  connection.onEvent = async (event, conn) => {
    await previousEvent?.(event, conn);
    const realm = event.params;
    if (event.method === 'script.realmCreated' && /worker$/.test(realm?.type || '')) {
      try { await evaluateBidi(conn, { realm: realm.realm }, workerSource); }
      catch (error) { options.onWorkerError?.(error); }
    }
  };
  await connection.command('session.subscribe', { events: ['script.realmCreated'] });
  const tree = await connection.command('browsingContext.getTree', {});
  const contexts = tree.contexts || [];
  if (!contexts.length) throw new Error('Firefox has no initial browsing context');
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
      workerFingerprintDelivery: false, workerInjection: 'best-effort', nativeTimezone,
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
