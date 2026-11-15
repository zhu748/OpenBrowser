'use strict';

const crypto = require('node:crypto');
const { buildUaProfile, parseOsFromUa, parseChromeVersion, normalizeUaOs } = require('./user-agent');
const { firefoxUserAgent } = require('./kernel-versions');
const { randomUaPatchVersion } = require('./ua-version');
const { OPENBROWSER_KERNEL_VERSION } = require('./versions');

function buildEditorUa(engine, payload = {}) {
  const saved = engine.profiles.get(String(payload.profileId || '')) || {};
  const family = (payload.engine || saved.engine) === 'firefox' ? 'firefox' : 'chromium';
  const profile = { ...saved, engine: family, engineVersion: payload.engineVersion || saved.engineVersion };
  let browser;
  try { browser = engine.chooseBrowser(profile, family); }
  catch (error) { if (family === 'firefox' || error.code === 'KERNEL_VERSION_NOT_INSTALLED') throw error; }
  const os = normalizeUaOs(payload.os || saved.os) || (payload.userAgent ? parseOsFromUa(payload.userAgent) : 'windows');
  const osVersion = payload.osVersion ?? (!payload.os || normalizeUaOs(payload.os) === normalizeUaOs(saved.os) ? saved.osVersion : undefined);
  if (family === 'firefox') {
    if (os === 'android' || os === 'ios')
      throw Object.assign(new Error('Firefox 当前支持桌面设备配置，请选择 Windows、macOS 或 Linux'), { code: 'UA_PLATFORM_UNSUPPORTED' });
    const osName = os.startsWith('mac') ? 'mac' : os.startsWith('win') ? 'win' : 'linux';
    if (payload.random) {
      const productVersion = randomUaPatchVersion(browser.version, { engine: family, previousUserAgent: payload.previousUserAgent || payload.userAgent });
      return { ...buildUaProfile({ os, userAgent: firefoxUserAgent(osName, browser.version, { productVersion }) }),
        kernelBound: true, uaReduced: false, uaPatchRandomized: true };
    }
    return { ...buildUaProfile({ os, userAgent: payload.userAgent || firefoxUserAgent(osName, browser.version) }), kernelBound: !payload.userAgent };
  }
  const version = browser?.version || OPENBROWSER_KERNEL_VERSION;
  const major = Number(payload.chromeMajor) || parseChromeVersion(payload.userAgent)?.major || Number(version.split('.')[0]);
  const generated = (ua) => ({ ...ua, kernelVersion: version, kernelBound: !payload.userAgent && ua.chromeFull === version });
  if ((os === 'android' || os === 'ios') && !payload.userAgent) {
    return generated(require('./mobile-personas').mobilePersona(payload.deviceSeed ?? crypto.randomBytes(4).readUInt32BE(0), os, {
      chromeMajor: major, chromeFull: Number(version.split('.')[0]) === major ? version : undefined,
      osVersion,
    }).uaProfile);
  }
  if (payload.random) {
    const fullVersion = randomUaPatchVersion(version, { previousUserAgent: payload.previousUserAgent || payload.userAgent });
    return { ...buildUaProfile({ os, chromeMajor: Number(version.split('.')[0]), chromeFull: fullVersion, osVersion, reduced: false }),
      kernelVersion: version, kernelBound: true, uaReduced: false, uaPatchRandomized: true };
  }
  return generated(buildUaProfile({
    userAgent: payload.userAgent || '', os, chromeMajor: major,
    chromeFull: payload.chromeFull || payload.fullVersion || (!payload.userAgent && Number(version.split('.')[0]) === major ? version : undefined),
    reduced: payload.reduced !== false,
    osVersion,
  }));
}

module.exports = { buildEditorUa };
