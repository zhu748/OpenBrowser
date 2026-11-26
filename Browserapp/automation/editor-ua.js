'use strict';

const crypto = require('node:crypto');
const { buildUaProfile, withChromeUaVersion, parseOsFromUa, parseChromeVersion, normalizeUaOs, normalizeSelectedOsVersion, desktopUaOsForRelease } = require('./user-agent');
const { firefoxUserAgent } = require('./kernel-versions');
const { desktopPlatformVersion, pickPersona } = require('./device-personas');
const { CURRENT_FINGERPRINT_VERSION, fingerprintVersion } = require('./fingerprint/generation');
const { OPENBROWSER_KERNEL_VERSION } = require('./versions');
const { pickRandomChromeVersion } = require('./ua-version');
const { readKernelVersion } = require('../engine/launch-profile');

async function buildEditorUa(engine, payload = {}) {
  const saved = engine.profiles.get(String(payload.profileId || '')) || {};
  const family = (payload.engine || saved.engine) === 'firefox' ? 'firefox' : 'chromium';
  const profile = { ...saved, engine: family, engineVersion: payload.engineVersion || saved.engineVersion };
  let browser;
  try { browser = engine.chooseBrowser(profile, family); }
  catch (error) { if (family === 'firefox' || error.code === 'KERNEL_VERSION_NOT_INSTALLED') throw error; }
  const version = browser ? await readKernelVersion(engine, browser) : OPENBROWSER_KERNEL_VERSION;
  const savedOs = normalizeUaOs(saved.os);
  const os = normalizeUaOs(payload.os || saved.os) || (payload.userAgent ? parseOsFromUa(payload.userAgent) : 'windows');
  const samePlatform = os === savedOs || (os === 'macos' && savedOs === 'macos_arm');
  const osVersion = payload.osVersion ?? (samePlatform ? saved.osVersion : undefined);
  if (family === 'firefox') {
    if (os === 'android' || os === 'ios')
      throw Object.assign(new Error('Firefox 当前支持桌面设备配置，请选择 Windows、macOS 或 Linux'), { code: 'UA_PLATFORM_UNSUPPORTED' });
    const osName = os.startsWith('mac') ? 'mac' : os.startsWith('win') ? 'win' : 'linux';
    if (payload.random) {
      return { ...buildUaProfile({ os, userAgent: firefoxUserAgent(osName, version) }),
        kernelBound: true, uaReduced: false, uaPatchRandomized: false };
    }
    return { ...buildUaProfile({ os, userAgent: payload.userAgent || firefoxUserAgent(osName, version) }), kernelBound: !payload.userAgent };
  }
  const installedMajor = Number(version.split('.')[0]);
  const versionForDraft = fingerprintVersion(payload.fingerprintVersion ?? saved.fingerprintVersion
    ?? (payload.profileId ? 1 : CURRENT_FINGERPRINT_VERSION));
  const major = payload.random ? installedMajor
    : (Number(payload.chromeMajor) || parseChromeVersion(payload.userAgent)?.major || installedMajor);
  const keepDevice = !payload.resetFingerprint && samePlatform
    && normalizeSelectedOsVersion(saved.osVersion) === normalizeSelectedOsVersion(osVersion)
    && versionForDraft === fingerprintVersion(saved.fingerprintVersion);
  const hints = keepDevice ? saved.privacy?.fingerprint?.clientHints : null;
  const generated = (ua) => {
    if (payload.random) {
      const full = pickRandomChromeVersion(version, ua.os, payload.previousUserAgent);
      return { ...withChromeUaVersion(ua, full), kernelVersion: version, kernelBound: true,
        uaReduced: false, uaVersionRandomized: true, uaPatchRandomized: false };
    }
    return { ...ua, kernelVersion: version, kernelBound: !payload.userAgent && ua.chromeFull === version };
  };
  if ((os === 'android' || os === 'ios') && !payload.userAgent) {
    return generated(require('./mobile-personas').mobilePersona(payload.deviceSeed ?? crypto.randomBytes(4).readUInt32BE(0), os, {
      chromeMajor: major, chromeFull: installedMajor === major ? version : undefined,
      osVersion: hints?.platform_version || osVersion,
      deviceModel: hints?.deviceModel, fingerprintVersion: versionForDraft,
    }).uaProfile);
  }
  if (payload.random) {
    const seed = crypto.randomBytes(4).readUInt32BE(0);
    const release = normalizeSelectedOsVersion(osVersion);
    const desktopOs = desktopUaOsForRelease(
      os === 'macos' && keepDevice && (hints?.architecture === 'arm' || savedOs === 'macos_arm') ? 'macos_arm' : os,
      release,
    );
    const persona = pickPersona(desktopOs, seed, { fingerprintVersion: versionForDraft, osVersion: release });
    const sampled = !release || os === 'linux' ? desktopPlatformVersion(desktopOs, persona, seed >>> 16, major) : undefined;
    return generated(buildUaProfile({ os: desktopOs, chromeMajor: major, chromeFull: version,
      osVersion: release, platform_version: hints?.platform_version ?? hints?.platformVersion ?? sampled, reduced: true }));
  }
  return generated(buildUaProfile({
    userAgent: payload.userAgent || '', os, chromeMajor: major,
    chromeFull: payload.chromeFull || payload.fullVersion || (!payload.userAgent && Number(version.split('.')[0]) === major ? version : undefined),
    reduced: payload.reduced !== false,
    osVersion,
  }));
}

module.exports = { buildEditorUa };
