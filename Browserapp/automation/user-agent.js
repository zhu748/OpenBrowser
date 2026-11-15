"use strict";

/**
 * User-Agent + Client Hints (UserAgentMetadata) builder.
 *
 * Surfaces:
 *  1) chrome arg `--user-agent=...`
 *  2) UserAgentMetadata / clientHints object
 *       { platform, platformVersion, architecture, model, mobile,
 *         wow64, uaFullVersion, bitness }
 *  3) Network/Emulation.setUserAgentOverride({ userAgent, userAgentMetadata })
 *  4) TLS: Chrome major <106 disable PermuteTLSExtensions, >=106 enable
 *
 * Applied via CDP + document-start JS inject on stock Chromium.
 */

const { OPENBROWSER_KERNEL_VERSION, DEFAULT_UA_CHROME_MAJOR, RANDOM_UA_CHROME_MAJORS } = require('./versions');

const crypto = require('node:crypto');
const UA_BRIDGE_KEY = crypto.randomBytes(32);
const uaRuntimeSource = Function.prototype.toString.call(require('./fingerprint/runtime/ua-bootstrap'));

const GREASE_BRANDS = [
  { brand: "Not:A-Brand", version: "99" },
  { brand: "Not A(Brand", version: "8" },
  { brand: "Not)A;Brand", version: "24" },
  { brand: "Not;A=Brand", version: "99" },
  { brand: "Not_A Brand", version: "8" },
  { brand: "Not/A)Brand", version: "8" },
];

const OS_PRESETS = {
  windows: {
    id: "windows",
    platformNav: "Win32",
    uaToken: "Windows NT 10.0; Win64; x64",
    chPlatform: "Windows",
    chPlatformVersion: "15.0.0",
    architecture: "x86",
    bitness: "64",
    wow64: false,
    vendor: "Google Inc.",
  },
  macos: {
    id: "macos",
    platformNav: "MacIntel",
    uaToken: "Macintosh; Intel Mac OS X 10_15_7",
    chPlatform: "macOS",
    chPlatformVersion: "14.5.0",
    architecture: "x86",
    bitness: "64",
    wow64: false,
    vendor: "Google Inc.",
  },
  macos_arm: {
    id: "macos_arm",
    platformNav: "MacIntel",
    uaToken: "Macintosh; Intel Mac OS X 10_15_7",
    chPlatform: "macOS",
    chPlatformVersion: "14.5.0",
    architecture: "arm",
    bitness: "64",
    wow64: false,
    vendor: "Google Inc.",
  },
  linux: {
    id: "linux",
    platformNav: "Linux x86_64",
    uaToken: "X11; Linux x86_64",
    chPlatform: "Linux",
    chPlatformVersion: "6.5.0",
    architecture: "x86",
    bitness: "64",
    wow64: false,
    vendor: "Google Inc.",
  },
  android: {
    id: "android",
    platformNav: "Linux armv8l",
    uaToken: "Linux; Android 10; K",
    chPlatform: "Android",
    chPlatformVersion: "14.0.0",
    architecture: "",
    bitness: "",
    model: "K",
    mobile: true,
    wow64: false,
    vendor: "Google Inc.",
  },
  ios: {
    id: "ios",
    platformNav: "iPhone",
    uaToken: "iPhone; CPU iPhone OS 18_0 like Mac OS X",
    chPlatform: "iOS",
    chPlatformVersion: "18.0.0",
    architecture: "arm",
    bitness: "64",
    model: "iPhone",
    mobile: true,
    wow64: false,
    vendor: "Apple Computer, Inc.",
  },
};

const NAVIGATOR_PLATFORMS = new Set(Object.values(OS_PRESETS).map(preset => preset.platformNav));
const CLIENT_HINT_PLATFORMS = new Set(Object.values(OS_PRESETS).map(preset => preset.chPlatform));

function navigatorPlatform(preset, options) {
  return options.platformNav || (CLIENT_HINT_PLATFORMS.has(options.platform) ? '' : options.platform) || preset.platformNav;
}

function clientHintPlatform(preset, options) {
  return options.chPlatform || (NAVIGATOR_PLATFORMS.has(options.platform) ? '' : options.platform) || preset.chPlatform;
}

function detectHostOs() {
  if (process.platform === "darwin") return "macos";
  if (process.platform === "linux") return "linux";
  return "windows";
}

function parseChromeVersion(ua = "") {
  const m = String(ua).match(/(?:Chrome|Chromium|CriOS)\/([\d.]+)/i);
  if (!m) return null;
  const full = m[1];
  const major = Number(full.split(".")[0]) || 0;
  return { full, major };
}

function normalizeUaOs(value) {
  const os = String(value || '').trim().toLowerCase();
  if (/^(win|win32|win64|win\d+)$/.test(os) || os.startsWith('windows')) return 'windows';
  if (['macos_arm', 'mac_arm'].includes(os)) return 'macos_arm';
  if (['mac', 'macos', 'darwin', 'osx', 'macintel'].includes(os)) return 'macos';
  if (['ios', 'iphone', 'ipad', 'ipod'].includes(os)) return 'ios';
  return OS_PRESETS[os] ? os : '';
}

function parseOsFromUa(ua = "") {
  const s = String(ua);
  if (/Windows NT/i.test(s)) return "windows";
  if (/Android/i.test(s)) return "android";
  if (/iPhone|iPad|iPod/i.test(s)) return "ios";
  if (/Macintosh|Mac OS X/i.test(s)) return "macos";
  if (/Linux/i.test(s)) return "linux";
  return detectHostOs();
}

/**
 * Build grease brands list similar to real Chrome sec-ch-ua order.
 */
function buildBrands(major) {
  // Fall back to the kernel default (never a stale literal): an unpinned major still
  // advertises the same engine the browser actually runs.
  const m = String(Math.max(1, Number(major) || DEFAULT_UA_CHROME_MAJOR));
  const grease = { ...GREASE_BRANDS[Number(m) % GREASE_BRANDS.length] };
  const chromium = { brand: "Chromium", version: m };
  const chrome = { brand: "Google Chrome", version: m };
  if (Number(m) % 2 === 0) return [grease, chromium, chrome];
  return [chrome, chromium, grease];
}

function buildFullVersionList(major, fullVersion) {
  const full = String(fullVersion || `${major}.0.0.0`);
  const brands = buildBrands(major);
  return brands.map((b) => {
    if (b.brand === "Chromium" || b.brand === "Google Chrome") {
      return { brand: b.brand, version: full };
    }
    return { brand: b.brand, version: `${b.version}.0.0.0` };
  });
}

function normalizeChromeFull(major, full) {
  const m = Number(major) || DEFAULT_UA_CHROME_MAJOR;
  if (full && /^\d+\.\d+\.\d+\.\d+$/.test(String(full))) return String(full);
  return `${m}.0.0.0`;
}

function platformVersionParts(value) {
  return String(value).split('.').slice(0, 3).concat(['0', '0']).slice(0, 3).join('.');
}

// Roxy 4.1.0 系统/内核版本下拉：osVersion 参与 UA token 与 Client Hints platformVersion。
// 返回 null 表示该版本没有专属覆盖（沿用 OS preset 默认值）。
// Chrome dropped support for older OSes at known majors; a UA claiming that pairing is a
// machine that never existed. Win7/8/8.1 topped out at 109, macOS <11 at 138 (10.15 lost
// support at 139). The caller decides how to handle incompatible profiles.
const OS_CHROME_SUPPORT_FLOORS = Object.freeze([
  { os: 'windows', maxOsVersion: '8.1', maxChromeMajor: 109 },
  { os: 'windows', maxOsVersion: '7', maxChromeMajor: 109 },
  { os: 'windows', maxOsVersion: '8', maxChromeMajor: 109 },
  { os: 'macos', maxOsVersion: '10.15', maxChromeMajor: 138 },
  { os: 'macos_arm', maxOsVersion: '10.15', maxChromeMajor: 138 },
]);
function osChromeSupportViolation(preset, osVersion, chromeMajor) {
  const raw = String(osVersion || '').trim().toLowerCase();
  const parts = raw.match(/^(\d+)(?:\.(\d+))?(?:\.\d+)*$/);
  const v = parts ? String(Number(parts[1])) + (Number(parts[2]) ? '.' + Number(parts[2]) : '') : raw;
  const major = Number(chromeMajor) || 0;
  if (!v || !preset || !major) return null;
  const osId = String(preset.id || '').toLowerCase();
  const hit = OS_CHROME_SUPPORT_FLOORS.find((row) => row.os === osId && row.maxOsVersion === v);
  if (!hit || major <= hit.maxChromeMajor) return null;
  return { osId, osVersion: v, maxChromeMajor: hit.maxChromeMajor };
}

function osVersionUaAdjustments(preset, osVersion) {
  const v = String(osVersion || "").trim();
  if (!v || !preset) return null;
  if (preset.id === "windows") {
    const map = {
      "7": { uaToken: "Windows NT 6.1; Win64; x64", chPlatformVersion: "1.0.0" },
      "8": { uaToken: "Windows NT 6.2; Win64; x64", chPlatformVersion: "2.0.0" },
      "8.1": { uaToken: "Windows NT 6.3; Win64; x64", chPlatformVersion: "3.0.0" },
      "10": { uaToken: "Windows NT 10.0; Win64; x64", chPlatformVersion: "10.0.0" },
      "11": { uaToken: "Windows NT 10.0; Win64; x64", chPlatformVersion: "15.0.0" },
    };
    return map[v] || null;
  }
  if (preset.id === "macos" || preset.id === "macos_arm") {
    if (!/^\d+(\.\d+)*$/.test(v)) return null;
    return { chPlatformVersion: v === "10.15" ? "10.15.7" : platformVersionParts(v) };
  }
  if (preset.id === "linux") {
    const map = { "ubuntu 24.04": "6.8.0", "ubuntu 22.04": "6.5.0", "debian 12": "6.1.0", "fedora 40": "6.8.0" };
    const hit = map[v.toLowerCase()];
    return hit ? { chPlatformVersion: hit } : null;
  }
  if (preset.id === "android" && /^\d+$/.test(v)) {
    // The UA itself stays frozen at "Android 10; K" (Chrome 110+ reduction) no matter which
    // release the device runs; the selected version surfaces only in Client Hints
    // platformVersion. Emitting "Android 14; K" is a string no stock build ever sent.
    return { chPlatformVersion: `${v}.0.0` };
  }
  return null;
}

/**
 * Build a complete UA string for desktop or mobile Chrome.
 */
function buildUserAgentString(options = {}) {
  const osKey = normalizeUaOs(options.os) || detectHostOs();
  const preset = OS_PRESETS[osKey] || OS_PRESETS.windows;
  const osAdj = osVersionUaAdjustments(preset, options.osVersion);
  const major = Number(options.chromeMajor || options.major || DEFAULT_UA_CHROME_MAJOR) || DEFAULT_UA_CHROME_MAJOR;
  const full = normalizeChromeFull(major, options.chromeFull || options.fullVersion);
  const chromeToken = options.reduced === false ? full : `${major}.0.0.0`;

  if (preset.id === "android") {
    // Frozen reduced UA (Chrome 110+): the OS segment never moves off Android 10, the model
    // segment is the placeholder K, and the device identity lives in Client Hints. The
    // full-form branch (reduced === false) keeps a real model and the full four-segment
    // version, which is the only other shape stock builds emit.
    const model = options.reduced !== false ? "K" : (options.model || "SM-S918B");
    const osToken = options.reduced !== false ? "Android 10" : `Android ${options.androidVersion || options.version || "10"}`;
    return `Mozilla/5.0 (Linux; ${osToken}; ${model}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeToken} Mobile Safari/537.36`;
  }
  if (preset.id === "ios") {
    const version = String(options.iosVersion || options.version || "18_0").replace(/\./g, "_");
    return `Mozilla/5.0 (iPhone; CPU iPhone OS ${version} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${chromeToken} Mobile/15E148 Safari/604.1`;
  }
  return `Mozilla/5.0 (${osAdj?.uaToken || preset.uaToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeToken} Safari/537.36`;
}

/**
 * Derive Client Hints / UserAgentMetadata from UA (+ optional overrides).
 */
function buildUserAgentMetadata(ua, overrides = {}) {
  const parsed = parseChromeVersion(ua) || { full: `${DEFAULT_UA_CHROME_MAJOR}.0.0.0`, major: DEFAULT_UA_CHROME_MAJOR };
  const osKey = normalizeUaOs(overrides.os) || parseOsFromUa(ua);
  const preset = OS_PRESETS[osKey] || OS_PRESETS.windows;
  const major = Number(overrides.chromeMajor || parsed.major) || DEFAULT_UA_CHROME_MAJOR;
  const fullVersion = normalizeChromeFull(
    major,
    overrides.ua_full_version || overrides.uaFullVersion || overrides.fullVersion || parsed.full
  );
  const copyBrands = list => list.map(item => item && typeof item === 'object' ? { ...item } : item);
  const brands = Array.isArray(overrides.brands) ? copyBrands(overrides.brands) : buildBrands(major);
  const fullVersionList = Array.isArray(overrides.fullVersionList)
    ? copyBrands(overrides.fullVersionList)
    : buildFullVersionList(major, fullVersion);

  const platform = clientHintPlatform(preset, overrides);
  const osAdj = osVersionUaAdjustments(preset, overrides.osVersion);
  let platformVersion = overrides.platform_version
    || overrides.platformVersion
    || osAdj?.chPlatformVersion
    || preset.chPlatformVersion;
  let model = overrides.model != null ? String(overrides.model) : (preset.model || "");

  if (osKey === "android" && ua) {
    const androidMatch = String(ua).match(/Android\s+([0-9.]+)(?:;\s*([^)]+))?/i);
    if (androidMatch) {
      // Reduced UAs carry placeholders, not the device's Android release/model.
      const reduced = androidMatch[1] === '10' && androidMatch[2]?.trim() === 'K';
      if (!reduced && !overrides.osVersion && !overrides.platform_version && !overrides.platformVersion) {
        platformVersion = platformVersionParts(androidMatch[1]);
      }
      if (!reduced && overrides.model == null && androidMatch[2]) {
        const rawModel = androidMatch[2].trim();
        if (rawModel) model = rawModel;
      }
    }
  }

  const isMobile = overrides.mobile !== undefined
    ? (overrides.mobile === true || overrides.mobile === "1" || overrides.mobile === 1)
    : (/Mobile/i.test(ua) || Boolean(preset.mobile));

  // Android Client Hints report empty string for architecture and bitness
  const architecture = overrides.architecture !== undefined
    ? String(overrides.architecture)
    : (osKey === "android" ? "" : preset.architecture);
  const bitness = overrides.bitness !== undefined
    ? String(overrides.bitness)
    : (osKey === "android" ? "" : preset.bitness);
  const wow64 = overrides.wow64 === true || overrides.wow64 === "1" || overrides.wow64 === 1
    ? true
    : Boolean(preset.wow64);

  return {
    brands,
    fullVersionList,
    fullVersion,
    platform,
    platformVersion,
    architecture,
    model,
    mobile: isMobile,
    bitness,
    wow64,
    uaFullVersion: fullVersion,
    platform_version: platformVersion,
    ua_full_version: fullVersion,
  };
}

/**
 * Full UA profile: string + navigator fields + client hints + chrome flags.
 */
function buildUaProfile(options = {}) {
  let userAgent = String(options.userAgent || options.ua || "").trim();
  const osKey = normalizeUaOs(options.os)
    || (userAgent ? parseOsFromUa(userAgent) : detectHostOs());
  const majorHint = Number(options.chromeMajor || options.major) || 0;

  if (!userAgent) {
    userAgent = buildUserAgentString({
      os: osKey,
      chromeMajor: majorHint || DEFAULT_UA_CHROME_MAJOR,
      chromeFull: options.chromeFull || options.fullVersion,
      reduced: options.reduced !== false,
      model: options.model,
      androidVersion: options.androidVersion,
      iosVersion: options.iosVersion,
      version: options.version,
      osVersion: options.osVersion,
    });
  }

  if (/Firefox\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    const preset = OS_PRESETS[osKey] || OS_PRESETS.windows;
    const appPlatform = osKey.startsWith('macos') ? 'Macintosh' : (osKey === 'windows' ? 'Windows' : 'X11');
    return {
      engine: 'firefox', userAgent, appVersion: `5.0 (${appPlatform})`,
      platform: navigatorPlatform(preset, options),
      vendor: '', os: osKey, chromeMajor: 0, chromeFull: '', metadata: null, clientHints: {},
    };
  }

  const parsed = parseChromeVersion(userAgent) || { full: `${DEFAULT_UA_CHROME_MAJOR}.0.0.0`, major: DEFAULT_UA_CHROME_MAJOR };
  const major = majorHint || parsed.major;
  const fullForHints = normalizeChromeFull(
    major,
    options.ua_full_version || options.fullVersion || options.chromeFull || parsed.full
  );

  const metadata = buildUserAgentMetadata(userAgent, {
    ...options,
    os: osKey,
    chromeMajor: major,
    ua_full_version: fullForHints,
  });

  const preset = OS_PRESETS[osKey] || OS_PRESETS.windows;
  const platformNav = navigatorPlatform(preset, options);

  const appVersion = userAgent.replace(/^Mozilla\//, "");

  return {
    userAgent,
    appVersion,
    platform: platformNav,
    vendor: options.vendor || preset.vendor || "Google Inc.",
    chromeMajor: major,
    chromeFull: fullForHints,
    os: osKey,
    metadata,
    clientHints: {
      platform: metadata.platform,
      platform_version: metadata.platformVersion,
      architecture: metadata.architecture,
      model: metadata.model,
      mobile: metadata.mobile ? "1" : "0",
      wow64: metadata.wow64 ? "1" : "0",
      ua_full_version: metadata.uaFullVersion,
      bitness: metadata.bitness,
    },
  };
}

/**
 * TLS extension permutation flags based on Chrome major from UA.
 */
function chromeArgsForUa(uaProfile) {
  const args = [];
  const major = Number(uaProfile?.chromeMajor) || parseChromeVersion(uaProfile?.userAgent || "")?.major || 0;
  if (!major) return args;
  if (major < 106) {
    args.push("--disable-features=PermuteTLSExtensions");
  } else {
    args.push("--enable-features=PermuteTLSExtensions");
  }
  return args;
}

/**
 * Clean comma-separated language tags for CDP Network.setUserAgentOverride.
 * Removes premature q-values to prevent double-weighting by the browser network stack.
 */
function formatAcceptLanguage(languages) {
  if (!languages) return "";
  const list = Array.isArray(languages)
    ? languages
    : String(languages).split(",");
  const cleaned = list
    .map((tag) => String(tag || "").trim().split(";")[0].trim())
    .filter(Boolean);
  return Array.from(new Set(cleaned)).join(",");
}

/**
 * Build RFC-compliant Accept-Language header with descending quality values.
 */
function buildAcceptLanguageHeader(languages) {
  if (!languages) return "";
  const list = Array.isArray(languages)
    ? languages
    : String(languages).split(",");
  const cleaned = list
    .map((tag) => String(tag || "").trim().split(";")[0].trim())
    .filter(Boolean);
  if (!cleaned.length) return "";
  return cleaned.map((lang, idx) => {
    if (idx === 0) return lang;
    const q = Math.max(0.1, 1.0 - idx * 0.1).toFixed(1).replace(/\.0$/, "");
    return `${lang};q=${q}`;
  }).join(",");
}

/**
 * CDP payload for Emulation.setUserAgentOverride / Network.setUserAgentOverride.
 */
function cdpUserAgentOverride(uaProfile, acceptLanguage = "") {
  const meta = uaProfile.metadata || buildUserAgentMetadata(uaProfile.userAgent);
  const cleanLang = formatAcceptLanguage(acceptLanguage);
  return {
    userAgent: uaProfile.userAgent,
    acceptLanguage: cleanLang || undefined,
    platform: uaProfile.platform,
    userAgentMetadata: {
      brands: meta.brands,
      fullVersionList: meta.fullVersionList,
      fullVersion: meta.fullVersion || meta.uaFullVersion,
      platform: meta.platform,
      platformVersion: meta.platformVersion,
      architecture: meta.architecture ?? "",
      model: meta.model || "",
      mobile: Boolean(meta.mobile),
      bitness: meta.bitness ?? "",
      wow64: Boolean(meta.wow64),
      formFactors: meta.formFactors || (meta.mobile ? ["Mobile"] : ["Desktop"]),
    },
  };
}

/**
 * Document-start patch: navigator.userAgent / appVersion / platform / userAgentData.
 * Supports both Window (Navigator) and DedicatedWorker (WorkerNavigator) contexts.
 */
function buildUaInjectionScript(uaProfile) {
  const bridgeToken = crypto.createHmac('sha256', UA_BRIDGE_KEY).update(JSON.stringify(uaProfile)).digest('hex');
  const payload = {
    userAgent: uaProfile.userAgent,
    appVersion: uaProfile.appVersion,
    platform: uaProfile.platform,
    vendor: uaProfile.vendor ?? "Google Inc.",
    brands: uaProfile.metadata?.brands || [],
    fullVersionList: uaProfile.metadata?.fullVersionList || [],
    fullVersion: uaProfile.metadata?.uaFullVersion || uaProfile.chromeFull,
    chPlatform: uaProfile.metadata?.platform || "Windows",
    platformVersion: uaProfile.metadata?.platformVersion || "",
    architecture: uaProfile.metadata?.architecture ?? "x86",
    model: uaProfile.metadata?.model || "",
    mobile: Boolean(uaProfile.metadata?.mobile),
    bitness: uaProfile.metadata?.bitness ?? "64",
    wow64: Boolean(uaProfile.metadata?.wow64),
    formFactors: uaProfile.metadata?.formFactors || (uaProfile.metadata?.mobile ? ["Mobile"] : ["Desktop"]),
  };
  return `(${uaRuntimeSource})(${JSON.stringify(payload)}, ${JSON.stringify(bridgeToken)});`;
}

function randomUaForSeed(seedU32, options = {}) {
  const seed = typeof seedU32 === 'number' || (typeof seedU32 === 'string' && seedU32.trim()) ? Number(seedU32) : NaN;
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
    throw Object.assign(new RangeError('UA random seed must be an unsigned 32-bit integer'), { code: 'UA_RANDOM_SEED_INVALID' });
  const requestedOs = options.osList ?? ["windows", "windows", "macos", "linux"];
  const requestedMajors = options.majors ?? RANDOM_UA_CHROME_MAJORS;
  if (!Array.isArray(requestedOs) || !requestedOs.length)
    throw Object.assign(new TypeError('UA operating-system pool must be a nonempty array'), { code: 'UA_RANDOM_OS_INVALID' });
  const osList = Array.from(requestedOs, normalizeUaOs);
  if (osList.some(os => !os))
    throw Object.assign(new TypeError('UA operating-system pool contains an unsupported value'), { code: 'UA_RANDOM_OS_INVALID' });
  if (!Array.isArray(requestedMajors) || !requestedMajors.length)
    throw Object.assign(new TypeError('UA version pool must be a nonempty array'), { code: 'UA_RANDOM_VERSION_INVALID' });
  const majors = Array.from(requestedMajors, value => typeof value === 'number' || (typeof value === 'string' && value.trim()) ? Number(value) : NaN);
  if (majors.some(major => !Number.isSafeInteger(major) || major < 1))
    throw Object.assign(new RangeError('UA version pool must contain positive integer majors'), { code: 'UA_RANDOM_VERSION_INVALID' });
  const os = osList[seed % osList.length];
  const major = majors[(seed >>> 8) % majors.length];
  const knownFull = String(options.fullVersion || OPENBROWSER_KERNEL_VERSION);
  const full = Number(knownFull.split('.')[0]) === Number(major) ? knownFull : `${major}.0.0.0`;
  if (os === 'android' || os === 'ios') {
    return require('./mobile-personas').mobilePersona(seed, os, { chromeMajor: major, chromeFull: full }).uaProfile;
  }
  return buildUaProfile({
    os,
    chromeMajor: major,
    chromeFull: full,
    reduced: true,
    ua_full_version: full,
    architecture: os === "macos" && ((seed >>> 12) & 1) ? "arm" : undefined,
  });
}

module.exports = {
  osChromeSupportViolation,
  OS_CHROME_SUPPORT_FLOORS,
  OS_PRESETS,
  GREASE_BRANDS,
  detectHostOs,
  parseChromeVersion,
  normalizeUaOs,
  parseOsFromUa,
  buildBrands,
  buildFullVersionList,
  buildUserAgentString,
  buildUserAgentMetadata,
  buildUaProfile,
  chromeArgsForUa,
  formatAcceptLanguage,
  buildAcceptLanguageHeader,
  cdpUserAgentOverride,
  buildUaInjectionScript,
  randomUaForSeed,
};
