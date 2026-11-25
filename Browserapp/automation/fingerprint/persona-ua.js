'use strict';

// Resolve declared UA intent without I/O, host injection or device sampling.
const { buildUaProfile, randomUaForSeed, normalizeUaOs, normalizeSelectedOsVersion, desktopUaOsForRelease, parseOsFromUa } = require('../user-agent');
const { OPENBROWSER_KERNEL_VERSION } = require('../versions');
const { resolveUaPatchVersion, resolvePublishedChromeVersion } = require('../ua-version');

function normalizeClientHints(hints) {
  // Normalize at the configuration boundary so custom, random and mobile UA
  // paths use one precedence. Never add normalized keys to the saved object.
  const normalized = { ...hints };
  if (normalized.platform_version == null && hints.platformVersion != null) normalized.platform_version = hints.platformVersion;
  const fullVersion = hints.uaFullVersion || hints.fullVersion;
  if (!normalized.ua_full_version && fullVersion) normalized.ua_full_version = fullVersion;
  return normalized;
}

function resolvePersonaUa({ profile, privacy, fpIn, draw, fingerprintVersion }) {
  const selectedVersion = fingerprintVersion >= 3
    ? normalizeSelectedOsVersion(profile.osVersion)
    : String(profile.osVersion || '').trim();
  const uaOverride = String(fpIn.userAgent || profile.userAgent || '').trim();
  const rawClientHints = (fpIn.clientHints && typeof fpIn.clientHints === 'object')
    ? fpIn.clientHints
    : (privacy.clientHints && typeof privacy.clientHints === 'object' ? privacy.clientHints
      : (profile.clientHints && typeof profile.clientHints === 'object' ? profile.clientHints : {}));
  const clientHintsIn = normalizeClientHints(rawClientHints);
  const kernelMajor = Number(String(profile.kernelVersion || '').match(/^\d+/)?.[0]) || 0;
  // The UA major must track the actual browser kernel: an engine advertising
  // Chrome 128-137 while running a 148 kernel is a one-shot CSS/API
  // feature-detection tell. When the profile doesn't pin a kernel version,
  // derive the pool from the bundled kernel's major version.
  const defaultKernelMajor = Number(String(OPENBROWSER_KERNEL_VERSION || '').match(/^\d+/)?.[0]) || 0;
  const uaMajorPool = kernelMajor ? [kernelMajor] : (defaultKernelMajor ? [defaultKernelMajor] : undefined);
  // UA 严格模式：强制自定义 UA 的 Chrome 主版本与内核一致 — UA 宣传 131 而内核是 148
  // 是一次性 CSS/API 特性探测即可识破的硬伤，与下方 uaMajorPool 的注释同理。
  let uaOverrideStr = uaOverride;
  const strictMajor = kernelMajor || defaultKernelMajor;
  const kernelFull = profile.kernelVersion || OPENBROWSER_KERNEL_VERSION;
  const configuredOs = normalizeUaOs(fpIn.os || clientHintsIn.os || profile.os);
  const uaOs = configuredOs || (uaOverride ? parseOsFromUa(uaOverride) : '');
  const releaseOs = uaOs === 'macos' && clientHintsIn.architecture === 'arm' ? 'macos_arm' : uaOs;
  const strictFull = (fpIn.uaVersionRandomized
    ? resolvePublishedChromeVersion(kernelFull, releaseOs, uaOverride)
    : fpIn.uaPatchRandomized && resolveUaPatchVersion(kernelFull, uaOverride)) || kernelFull;
  const strictUa = fpIn.uaStrict || fpIn.uaGenerated;
  if (strictUa && uaOverride && strictMajor) {
    const fullUa = fpIn.uaVersionRandomized || fpIn.uaPatchRandomized || fpIn.uaReduced === false;
    uaOverrideStr = uaOverride.replace(/(Chrome|Chromium|CriOS)\/[\d.]+/i,
      (_, brand) => `${brand}/${brand.toLowerCase() === 'crios' || fullUa ? strictFull : `${strictMajor}.0.0.0`}`);
  }
  let uaProfile;
  if (uaOverrideStr) {
    const osFromUa = parseOsFromUa(uaOverrideStr);
    // buildUaProfile keys OS_PRESETS with exact lowercase ids; profile records may carry
    // aliases ("iOS", "Mac", "Win11") that would otherwise fall through to the host OS.
    uaProfile = buildUaProfile({
      userAgent: uaOverrideStr,
      // profile.os participates so a saved "macos_arm" profile keeps its Apple Silicon
      // identity (preset pins architecture=arm) even when it also pins a custom UA string.
      os: configuredOs || osFromUa,
      chromeMajor: (strictUa && strictMajor) || Number(fpIn.chromeMajor || clientHintsIn.chromeMajor) || undefined,
      chromeFull: strictUa ? strictFull : (fpIn.ua_full_version || clientHintsIn.ua_full_version || fpIn.fullVersion),
      platform: fpIn.platform,
      chPlatform: clientHintsIn.chPlatform || clientHintsIn.platform,
      architecture: clientHintsIn.architecture ?? fpIn.architecture,
      platform_version: clientHintsIn.platform_version ?? fpIn.platformVersion,
      model: clientHintsIn.model,
      mobile: clientHintsIn.mobile,
      wow64: clientHintsIn.wow64,
      bitness: clientHintsIn.bitness,
      ua_full_version: strictUa ? strictFull : (clientHintsIn.ua_full_version || fpIn.ua_full_version),
    });
  } else {
    const desktopRequested = [fpIn.os, clientHintsIn.os, profile.os]
      .map(normalizeUaOs)
      .find((value) => value === "windows" || value === "macos" || value === "macos_arm" || value === "linux");
    uaProfile = randomUaForSeed(draw('userAgent', 44), {
      majors: uaMajorPool,
      fullVersion: profile.kernelVersion || OPENBROWSER_KERNEL_VERSION,
      // The UA is the source of truth for every OS-facing fingerprint surface.
      // macos_arm goes through as-is: OS_PRESETS.macos_arm emits the same MacIntel UA token
      // but pins Client Hints architecture=arm, which downstream persona/WebGL pools key on.
      osList: desktopRequested ? [fingerprintVersion >= 3 ? desktopUaOsForRelease(desktopRequested, selectedVersion) : desktopRequested]
        : ['windows', 'windows', 'macos', 'linux'],
    });
    // Apply explicit clientHints overrides on top of seeded UA
    if (Object.keys(clientHintsIn).length) {
      uaProfile = buildUaProfile({
        userAgent: uaProfile.userAgent,
        os: uaProfile.os,
        chromeMajor: uaProfile.chromeMajor,
        ...clientHintsIn,
        ua_full_version: clientHintsIn.ua_full_version || uaProfile.chromeFull,
      });
    }
  }

  // Roxy 对齐：编辑器「系统版本」下拉（profile.osVersion）参与 UA token 与
  // Client Hints platformVersion 生成；未选择时保持原有随机 UA 不变。
  if (!uaOverrideStr && selectedVersion) {
    uaProfile = buildUaProfile({
      ...clientHintsIn,
      os: uaProfile.os || parseOsFromUa(uaProfile.userAgent),
      ...(fingerprintVersion >= 3 ? { architecture: clientHintsIn.architecture ?? uaProfile.metadata?.architecture } : {}),
      chromeMajor: uaProfile.chromeMajor,
      ua_full_version: uaProfile.chromeFull,
      osVersion: selectedVersion,
    });
  }
  return { uaProfile, uaOverrideStr, clientHintsIn, kernelMajor, defaultKernelMajor, selectedVersion };
}

module.exports = { resolvePersonaUa };
