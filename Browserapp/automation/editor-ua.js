'use strict';

const crypto = require('node:crypto');
const { buildUaProfile, randomUaForSeed, parseOsFromUa, parseChromeVersion } = require('./user-agent');
const { firefoxUserAgent } = require('./kernel-versions');
const { OPENBROWSER_KERNEL_VERSION } = require('./versions');

function buildEditorUa(engine, payload = {}) {
  const saved = engine.profiles.get(String(payload.profileId || '')) || {};
  const family = (payload.engine || saved.engine) === 'firefox' ? 'firefox' : 'chromium';
  const profile = { ...saved, engine: family, engineVersion: payload.engineVersion || saved.engineVersion };
  let browser;
  try { browser = engine.chooseBrowser(profile, family); } catch (error) { if (family === 'firefox') throw error; }
  const osMap = { Windows: 'windows', macOS: 'macos', Mac: 'macos', Linux: 'linux', Android: 'android' };
  const os = osMap[payload.os] || payload.os || (payload.userAgent ? parseOsFromUa(payload.userAgent) : 'windows');
  if (family === 'firefox') {
    const osName = os.startsWith('mac') ? 'mac' : os.startsWith('win') ? 'win' : 'linux';
    return buildUaProfile({ os, userAgent: payload.userAgent || firefoxUserAgent(osName, browser.version) });
  }
  const version = browser?.version || OPENBROWSER_KERNEL_VERSION;
  const major = Number(payload.chromeMajor) || parseChromeVersion(payload.userAgent)?.major || Number(version.split('.')[0]);
  if (payload.random) {
    return randomUaForSeed(crypto.randomBytes(4).readUInt32BE(0), {
      majors: [major], fullVersion: version, osList: payload.os ? [os] : undefined,
    });
  }
  if (os === 'android' && !payload.userAgent) {
    return require('./mobile-personas').mobilePersona(payload.deviceSeed ?? crypto.randomBytes(4).readUInt32BE(0), 'android', {
      chromeMajor: major, chromeFull: Number(version.split('.')[0]) === major ? version : undefined,
    }).uaProfile;
  }
  return buildUaProfile({
    userAgent: payload.userAgent || '', os, chromeMajor: major,
    chromeFull: payload.chromeFull || payload.fullVersion || (!payload.userAgent && Number(version.split('.')[0]) === major ? version : undefined),
    reduced: payload.reduced !== false,
  });
}

module.exports = { buildEditorUa };
